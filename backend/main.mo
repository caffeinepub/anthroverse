import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import List "mo:core/List";
import Set "mo:core/Set";
import Order "mo:core/Order";
import Nat "mo:core/Nat";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import UserApproval "user-approval/approval";

actor {
  include MixinStorage();

  module EventEntriesByEventId {
    public func compare(a : (Nat, Principal), b : (Nat, Principal)) : Order.Order {
      Nat.compare(a.0, b.0);
    };
  };

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  public type PostCategory = {
    #announcements;
    #general;
    #fun;
    #requirements;
    #leadershipTeam;
    #membershipCommittee;
    #coreTeam;
  };

  public type Role = {
    #president;
    #vicePresident;
    #secretaryTreasurer;
    #lt;
    #mc;
    #elt;
    #member;
    #rootAdmin;
  };

  public type PostStatus = {
    #pending;
    #published;
  };

  public type EventStatus = {
    #pending;
    #approved;
  };

  public type User = {
    name : Text;
    email : Text;
    role : Role;
    isApproved : Bool;
    profilePic : ?Storage.ExternalBlob;
    companyName : Text;
    description : Text;
  };

  public type Post = {
    id : Nat;
    author : Principal;
    authorName : Text;
    category : PostCategory;
    content : Text;
    image : ?Storage.ExternalBlob;
    timestamp : Time.Time;
    likes : ?Set.Set<Principal>;
    status : PostStatus;
    isPrivateGroup : Bool;
    groupMembers : ?Set.Set<Principal>;
  };

  public type PostView = {
    id : Nat;
    author : Principal;
    authorName : Text;
    category : PostCategory;
    content : Text;
    image : ?Storage.ExternalBlob;
    timestamp : Time.Time;
    likes : [Principal];
    status : PostStatus;
    isPrivateGroup : Bool;
    groupMembers : [Principal];
  };

  public type Comment = {
    postId : Nat;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  public type Tenure = {
    startDate : Time.Time;
    endDate : Time.Time;
    president : Principal;
    vicePresident : Principal;
    secretaryTreasurer : Principal;
    ltMembers : [Principal];
    mcMembers : [Principal];
    eltMembers : [Principal];
  };

  public type Event = {
    id : Nat;
    title : Text;
    description : Text;
    date : Time.Time;
    banner : ?Storage.ExternalBlob;
    registrationLimit : ?Nat;
    creator : Principal;
    status : EventStatus;
  };

  public type Notification = {
    recipient : Principal;
    message : Text;
    timestamp : Time.Time;
    isRead : Bool;
    notificationType : {
      #accountApproved;
      #announcementPublished;
      #eventCreated;
      #eventReminder;
      #roleAssigned;
      #tenureSwitched;
    };
  };

  public type Registration = {
    eventId : Nat;
    user : Principal;
    isPaid : Bool;
    timestamp : Time.Time;
  };

  let users = Map.empty<Principal, User>();
  let posts = Map.empty<Nat, Post>();
  let comments = Map.empty<Nat, List.List<Comment>>();
  let tenures = List.empty<Tenure>();
  let events = Map.empty<Nat, Event>();
  let notifications = Map.empty<Principal, List.List<Notification>>();
  let eventRegistrations = Map.empty<(Nat, Principal), Registration>();
  let currentTenure : ?Tenure = null;

  // ---------------------------------------------------------------------------
  // Root admin helpers
  // ---------------------------------------------------------------------------

  func isMasterAdmin(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (?u) { u.email == "graph.dust@gmail.com" };
      case (null) {
        AccessControl.isAdmin(accessControlState, caller);
      };
    };
  };

  func ensureRootAdminUser(caller : Principal) {
    switch (users.get(caller)) {
      case (null) {
        let user : User = {
          name = "Root Admin";
          email = "graph.dust@gmail.com";
          role = #rootAdmin;
          isApproved = true;
          profilePic = null;
          companyName = "";
          description = "";
        };
        users.add(caller, user);
        AccessControl.assignRole(accessControlState, caller, caller, #admin);
      };
      case (?u) {
        if (u.role != #rootAdmin or not u.isApproved) {
          let updatedUser : User = {
            u with
            role = #rootAdmin;
            isApproved = true;
          };
          users.add(caller, updatedUser);
          AccessControl.assignRole(accessControlState, caller, caller, #admin);
        };
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Approval helpers
  // ---------------------------------------------------------------------------

  func isApprovedOrAdmin(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    if (isMasterAdmin(caller)) { return true };
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) { return true };
    UserApproval.isApproved(approvalState, caller);
  };

  func requireApprovedUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot perform this action");
    };
    if (isMasterAdmin(caller)) {
      ensureRootAdminUser(caller);
      return;
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #admin) and not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Your account is pending approval");
    };
  };

  func requireApprovedUserQuery(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot perform this action");
    };
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Your account is pending approval");
    };
  };

  // ---------------------------------------------------------------------------
  // Role-check helpers
  // ---------------------------------------------------------------------------

  func requireMasterAdmin(caller : Principal) {
    if (not isMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only MasterAdmin can perform this action");
    };
  };

  /// Require caller to be an admin (AccessControl #admin role) OR executive core/master admin.
  /// This is the correct guard for user approval management.
  func requireAdminOrExecutive(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot perform this action");
    };
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return;
    };
    if (isExecutiveCoreOrMasterAdmin(caller)) {
      return;
    };
    Runtime.trap("Unauthorized: Only admins or Executive Core and above can perform this action");
  };

  func isExecutiveCoreOrMasterAdmin(caller : Principal) : Bool {
    if (isMasterAdmin(caller)) { return true };
    switch (getAppRole(caller)) {
      case (null) { false };
      case (?role) {
        switch (role) {
          case (#president) { true };
          case (#vicePresident) { true };
          case (#secretaryTreasurer) { true };
          case (#rootAdmin) { true };
          case (_) { false };
        };
      };
    };
  };

  func isLTOrAbove(caller : Principal) : Bool {
    if (isMasterAdmin(caller)) { return true };
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      switch (getAppRole(caller)) {
        case (null) {
          return isMasterAdmin(caller);
        };
        case (?role) {
          switch (role) {
            case (#president) { return true };
            case (#vicePresident) { return true };
            case (#secretaryTreasurer) { return true };
            case (#lt) { return true };
            case (#rootAdmin) { return true };
            case (_) { return false };
          };
        };
      };
    };
    switch (getAppRole(caller)) {
      case (null) { false };
      case (?role) {
        switch (role) {
          case (#president) { true };
          case (#vicePresident) { true };
          case (#secretaryTreasurer) { true };
          case (#lt) { true };
          case (#rootAdmin) { true };
          case (_) { false };
        };
      };
    };
  };

  func getAppRole(caller : Principal) : ?Role {
    switch (users.get(caller)) {
      case (null) { null };
      case (?u) { ?u.role };
    };
  };

  func isElevatedRole(role : Role) : Bool {
    switch (role) {
      case (#president) { true };
      case (#vicePresident) { true };
      case (#secretaryTreasurer) { true };
      case (#lt) { true };
      case (#mc) { false };
      case (#elt) { false };
      case (#member) { false };
      case (#rootAdmin) { true };
    };
  };

  func isMCOrELT(caller : Principal) : Bool {
    switch (getAppRole(caller)) {
      case (null) { false };
      case (?role) {
        switch (role) {
          case (#mc) { true };
          case (#elt) { true };
          case (_) { false };
        };
      };
    };
  };

  func requiresApproval(caller : Principal) : Bool {
    not isExecutiveCoreOrMasterAdmin(caller);
  };

  func canAccessPrivateGroup(caller : Principal, category : PostCategory) : Bool {
    if (isMasterAdmin(caller)) { return true };
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return true;
    };
    switch (getAppRole(caller)) {
      case (null) { false };
      case (?roleName) {
        switch (category) {
          case (#leadershipTeam) {
            switch (roleName) {
              case (#president) { true };
              case (#vicePresident) { true };
              case (#secretaryTreasurer) { true };
              case (#lt) { true };
              case (#rootAdmin) { true };
              case (_) { false };
            };
          };
          case (#membershipCommittee) {
            switch (roleName) {
              case (#president) { true };
              case (#vicePresident) { true };
              case (#secretaryTreasurer) { true };
              case (#lt) { true };
              case (#mc) { true };
              case (#rootAdmin) { true };
              case (_) { false };
            };
          };
          case (#coreTeam) {
            switch (roleName) {
              case (#president) { true };
              case (#vicePresident) { true };
              case (#secretaryTreasurer) { true };
              case (#lt) { true };
              case (#mc) { true };
              case (#elt) { true };
              case (#rootAdmin) { true };
              case (_) { false };
            };
          };
          case (_) { false };
        };
      };
    };
  };

  func isPrivateGroupCategory(category : PostCategory) : Bool {
    switch (category) {
      case (#leadershipTeam) { true };
      case (#membershipCommittee) { true };
      case (#coreTeam) { true };
      case (_) { false };
    };
  };

  func filterAndMapPosts(predicate : Post -> Bool) : [PostView] {
    posts.values().toArray().filter(predicate).map(
      func(post) {
        {
          post with
          likes = switch (post.likes) {
            case (null) { [] };
            case (?likes) { likes.toArray() };
          };
          groupMembers = switch (post.groupMembers) {
            case (null) { [] };
            case (?members) { members.toArray() };
          };
        };
      }
    );
  };

  func sortPostsByTime(postsArr : [PostView]) : [PostView] {
    postsArr.sort(
      func(a : PostView, b : PostView) : Order.Order {
        if (b.timestamp > a.timestamp) { #less }
        else if (b.timestamp < a.timestamp) { #greater }
        else { #equal };
      },
    );
  };

  // ---------------------------------------------------------------------------
  // Notification helper
  // ---------------------------------------------------------------------------

  func addNotification(
    recipient : Principal,
    message : Text,
    notificationType : {
      #accountApproved;
      #announcementPublished;
      #eventCreated;
      #eventReminder;
      #roleAssigned;
      #tenureSwitched;
    },
  ) {
    let notification : Notification = {
      recipient;
      message;
      timestamp = Time.now();
      isRead = false;
      notificationType;
    };

    let existing = switch (notifications.get(recipient)) {
      case (null) { List.empty<Notification>() };
      case (?n) { n };
    };

    existing.add(notification);
    notifications.add(recipient, existing);
  };

  // ---------------------------------------------------------------------------
  // Public: profile
  // ---------------------------------------------------------------------------

  public query ({ caller }) func isCallerApproved() : async Bool {
    isApprovedOrAdmin(caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?User {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot get their profile");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      if (not isMasterAdmin(caller)) {
        Runtime.trap("Unauthorized: Only authenticated users can get their profile");
      };
    };
    switch (users.get(caller)) {
      case (null) {
        null;
      };
      case (?u) {
        if (u.email == "graph.dust@gmail.com") {
          if (u.role != #rootAdmin or not u.isApproved) {
            return ?{ u with role = #rootAdmin; isApproved = true };
          };
        };
        ?u;
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : User) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save their profile");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      if (not isMasterAdmin(caller)) {
        Runtime.trap("Unauthorized: Only authenticated users can save their profile");
      };
    };

    if (profile.email == "graph.dust@gmail.com") {
      let user : User = {
        name = profile.name;
        email = profile.email;
        role = #rootAdmin;
        isApproved = true;
        profilePic = profile.profilePic;
        companyName = profile.companyName;
        description = profile.description;
      };
      users.add(caller, user);
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
      return;
    };

    let existingRole : Role = switch (users.get(caller)) {
      case (null) { #member };
      case (?u) { u.role };
    };
    let existingApproved : Bool = switch (users.get(caller)) {
      case (null) { false };
      case (?u) { u.isApproved };
    };
    let user : User = {
      name = profile.name;
      email = profile.email;
      role = existingRole;
      isApproved = existingApproved;
      profilePic = profile.profilePic;
      companyName = profile.companyName;
      description = profile.description;
    };
    users.add(caller, user);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?User {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view profiles");
    };
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Your account is pending approval");
    };
    switch (users.get(user)) {
      case (null) { null };
      case (?u) {
        if (u.email == "graph.dust@gmail.com") {
          if (u.role != #rootAdmin or not u.isApproved) {
            return ?{ u with role = #rootAdmin; isApproved = true };
          };
        };
        ?u;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Public: registration
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func registerUser(name : Text, email : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot register");
    };

    if (email == "graph.dust@gmail.com") {
      let user : User = {
        name;
        email;
        role = #rootAdmin;
        isApproved = true;
        profilePic = null;
        companyName = "";
        description = "";
      };
      users.add(caller, user);
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
      return;
    };

    let user : User = {
      name;
      email;
      role = #member;
      isApproved = false;
      profilePic = null;
      companyName = "";
      description = "";
    };
    users.add(caller, user);
  };

  // ---------------------------------------------------------------------------
  // Public: tenure — MasterAdmin only
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func startNewTenure(
    president : Principal,
    vicePresident : Principal,
    secretaryTreasurer : Principal,
    startDate : Time.Time,
    endDate : Time.Time,
  ) : async () {
    requireMasterAdmin(caller);

    for ((principal, user) in users.entries()) {
      if (user.email != "graph.dust@gmail.com") {
        let updatedUser = { user with role = #member };
        users.add(principal, updatedUser);
        AccessControl.assignRole(accessControlState, caller, principal, #user);
      };
    };

    let newTenure : Tenure = {
      startDate;
      endDate;
      president;
      vicePresident;
      secretaryTreasurer;
      ltMembers = [];
      mcMembers = [];
      eltMembers = [];
    };

    tenures.add(newTenure);

    AccessControl.assignRole(accessControlState, caller, president, #admin);
    AccessControl.assignRole(accessControlState, caller, vicePresident, #admin);
    AccessControl.assignRole(accessControlState, caller, secretaryTreasurer, #admin);

    for (officialPrincipal in [president, vicePresident, secretaryTreasurer].values()) {
      switch (users.get(officialPrincipal)) {
        case (null) {};
        case (?u) {
          let newRole : Role = if (officialPrincipal == president) {
            #president;
          } else if (officialPrincipal == vicePresident) {
            #vicePresident;
          } else {
            #secretaryTreasurer;
          };
          users.add(officialPrincipal, { u with role = newRole });
          addNotification(
            officialPrincipal,
            "Your role has been updated to: " # roleToText(newRole),
            #roleAssigned,
          );
        };
      };
    };

    for (member in users.keys().toArray().values()) {
      addNotification(
        member,
        "A new tenure has started.",
        #tenureSwitched,
      );
    };
  };

  // ---------------------------------------------------------------------------
  // Public: role assignment
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func assignRole(user : Principal, role : Role) : async () {
    requireApprovedUser(caller);

    let userData = switch (users.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?data) { data };
    };

    if (userData.email == "graph.dust@gmail.com") {
      Runtime.trap("Unauthorized: Cannot change the role of the MasterAdmin");
    };

    switch (role) {
      case (#president or #vicePresident or #secretaryTreasurer or #rootAdmin) {
        requireMasterAdmin(caller);
      };
      case (_) {
        if (not isExecutiveCoreOrMasterAdmin(caller)) {
          Runtime.trap("Unauthorized: Only Executive Core or MasterAdmin can assign roles");
        };
      };
    };

    let updatedUser = { userData with role };
    users.add(user, updatedUser);

    let acRole : AccessControl.UserRole = if (isElevatedRole(role)) { #admin } else { #user };
    AccessControl.assignRole(accessControlState, caller, user, acRole);

    addNotification(
      user,
      "Your role has been updated to: " # roleToText(role),
      #roleAssigned,
    );
  };

  // ---------------------------------------------------------------------------
  // Public: posts
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func submitPost(category : PostCategory, content : Text, image : ?Storage.ExternalBlob) : async () {
    requireApprovedUser(caller);

    let user = switch (users.get(caller)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?u) { u };
    };

    let callerIsExecOrAdmin = isExecutiveCoreOrMasterAdmin(caller);
    let callerIsLTOrAbove = isLTOrAbove(caller);
    let callerIsMCOrELT = isMCOrELT(caller);

    switch (category) {
      case (#announcements) {
        if (not callerIsLTOrAbove and not callerIsMCOrELT) {
          Runtime.trap("Unauthorized: Members cannot post announcements");
        };
      };
      case (#leadershipTeam) {
        if (not canAccessPrivateGroup(caller, #leadershipTeam)) {
          Runtime.trap("Unauthorized: You do not have access to the Leadership Team group");
        };
      };
      case (#membershipCommittee) {
        if (not canAccessPrivateGroup(caller, #membershipCommittee)) {
          Runtime.trap("Unauthorized: You do not have access to the Membership Committee group");
        };
      };
      case (#coreTeam) {
        if (not canAccessPrivateGroup(caller, #coreTeam)) {
          Runtime.trap("Unauthorized: You do not have access to the Core Team group");
        };
      };
      case (#general) {};
      case (#fun) {};
      case (#requirements) {};
    };

    let isPrivateGroup = isPrivateGroupCategory(category);

    let status : PostStatus = switch (category) {
      case (#announcements) {
        if (callerIsExecOrAdmin) { #published } else { #pending };
      };
      case (_) { #published };
    };

    let post : Post = {
      id = posts.size();
      author = caller;
      authorName = user.name;
      category;
      content;
      image;
      timestamp = Time.now();
      likes = ?Set.empty<Principal>();
      status;
      isPrivateGroup;
      groupMembers = if (isPrivateGroup) {
        ?Set.empty<Principal>();
      } else {
        null;
      };
    };

    posts.add(posts.size(), post);
  };

  public shared ({ caller }) func approvePost(postId : Nat) : async () {
    requireApprovedUser(caller);

    if (not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Executive Core or MasterAdmin can approve posts");
    };

    let post = switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?p) { p };
    };

    let updatedPost = { post with status = #published };
    posts.add(postId, updatedPost);

    if (post.category == #announcements) {
      for (myUser in users.keys().toArray().values()) {
        addNotification(
          myUser,
          "A new announcement has been published: " # post.content,
          #announcementPublished,
        );
      };
    };
  };

  public shared ({ caller }) func deletePost(postId : Nat) : async () {
    requireApprovedUser(caller);

    let post = switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?p) { p };
    };

    if (not isExecutiveCoreOrMasterAdmin(caller) and post.author != caller) {
      Runtime.trap("Unauthorized: Only Executive Core, MasterAdmin, or the post author can delete posts");
    };

    posts.remove(postId);
  };

  public shared ({ caller }) func toggleLike(postId : Nat) : async () {
    requireApprovedUser(caller);

    let post = switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?p) { p };
    };

    if (post.isPrivateGroup and not canAccessPrivateGroup(caller, post.category)) {
      Runtime.trap("Unauthorized: You do not have access to this group");
    };

    let userLikes = switch (post.likes) {
      case (?likes) { likes };
      case (null) { Set.empty<Principal>() };
    };

    if (userLikes.contains(caller)) {
      userLikes.remove(caller);
    } else {
      userLikes.add(caller);
    };

    posts.add(postId, { post with likes = ?userLikes });
  };

  public shared ({ caller }) func addComment(postId : Nat, content : Text) : async () {
    requireApprovedUser(caller);

    let post = switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?_p) { _p };
    };

    if (post.isPrivateGroup and not canAccessPrivateGroup(caller, post.category)) {
      Runtime.trap("Unauthorized: You do not have access to this group");
    };

    let comment : Comment = {
      postId;
      author = caller;
      content;
      timestamp = Time.now();
    };

    let existingComments = switch (comments.get(postId)) {
      case (null) { List.empty<Comment>() };
      case (?c) { c };
    };

    existingComments.add(comment);
    comments.add(postId, existingComments);
  };

  public shared ({ caller }) func deleteComment(postId : Nat, commentIndex : Nat) : async () {
    requireApprovedUser(caller);

    let commentList = switch (comments.get(postId)) {
      case (null) { Runtime.trap("No comments for this post") };
      case (?c) { c };
    };

    let commentsArr = commentList.toArray();
    if (commentIndex >= commentsArr.size()) {
      Runtime.trap("Comment index out of bounds");
    };

    let comment = commentsArr[commentIndex];

    if (not isExecutiveCoreOrMasterAdmin(caller) and comment.author != caller) {
      Runtime.trap("Unauthorized: Only Executive Core, MasterAdmin, or the comment author can delete comments");
    };

    let newList = List.empty<Comment>();
    var idx = 0;
    for (c in commentsArr.values()) {
      if (idx != commentIndex) {
        newList.add(c);
      };
      idx += 1;
    };
    comments.add(postId, newList);
  };

  public query ({ caller }) func getPosts(categoryFilter : ?PostCategory) : async [PostView] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Your account is pending approval");
    };

    let callerIsExecOrAdmin = isExecutiveCoreOrMasterAdmin(caller);
    let callerIsLTOrAbove = isLTOrAbove(caller);

    let filteredPosts = switch (categoryFilter) {
      case (?category) {
        if (isPrivateGroupCategory(category) and not canAccessPrivateGroup(caller, category)) {
          Runtime.trap("Unauthorized: You do not have access to this group");
        };
        filterAndMapPosts(
          func(p : Post) : Bool {
            p.category == category and (
              p.status == #published or callerIsLTOrAbove
            );
          },
        );
      };
      case (null) {
        filterAndMapPosts(
          func(p : Post) : Bool {
            let canSeeGroup = if (p.isPrivateGroup) {
              canAccessPrivateGroup(caller, p.category);
            } else {
              true;
            };
            let canSeePending = p.status == #published or callerIsLTOrAbove;
            canSeeGroup and canSeePending;
          },
        );
      };
    };

    sortPostsByTime(filteredPosts);
  };

  public query ({ caller }) func getPendingPosts() : async [PostView] {
    requireApprovedUserQuery(caller);

    if (not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Executive Core or MasterAdmin can view pending posts");
    };

    let pendingPosts = filterAndMapPosts(func(p : Post) : Bool { p.status == #pending });
    sortPostsByTime(pendingPosts);
  };

  public query ({ caller }) func getMyPosts() : async [PostView] {
    requireApprovedUserQuery(caller);
    let myPosts = filterAndMapPosts(func(p : Post) : Bool { p.author == caller });
    sortPostsByTime(myPosts);
  };

  public query ({ caller }) func searchPostsByMember(memberName : Text) : async [PostView] {
    requireApprovedUserQuery(caller);
    let callerIsLTOrAbove = isLTOrAbove(caller);
    let matchingPosts = filterAndMapPosts(
      func(p : Post) : Bool {
        p.authorName.contains(#text memberName) and (p.status == #published or callerIsLTOrAbove) and (not p.isPrivateGroup or canAccessPrivateGroup(caller, p.category));
      },
    );
    sortPostsByTime(matchingPosts);
  };

  public query ({ caller }) func getComments(postId : Nat) : async [Comment] {
    requireApprovedUserQuery(caller);

    let post = switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?p) { p };
    };

    if (post.isPrivateGroup and not canAccessPrivateGroup(caller, post.category)) {
      Runtime.trap("Unauthorized: You do not have access to this group");
    };

    switch (comments.get(postId)) {
      case (null) { [] };
      case (?c) { c.toArray() };
    };
  };

  // ---------------------------------------------------------------------------
  // Public: events
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func createEvent(
    title : Text,
    description : Text,
    date : Time.Time,
    banner : ?Storage.ExternalBlob,
    registrationLimit : ?Nat,
  ) : async () {
    requireApprovedUser(caller);

    if (not isLTOrAbove(caller) and not isMCOrELT(caller)) {
      Runtime.trap("Unauthorized: Only LT, MC, ELT, or admins can create events");
    };

    let eventStatus : EventStatus = if (requiresApproval(caller)) {
      #pending;
    } else {
      #approved;
    };

    let event : Event = {
      id = events.size();
      title;
      description;
      date;
      banner;
      registrationLimit;
      creator = caller;
      status = eventStatus;
    };

    events.add(events.size(), event);

    for (member in users.keys().toArray().values()) {
      addNotification(
        member,
        "New event created: " # title,
        #eventCreated,
      );
    };

    if (eventStatus == #pending) {
      for ((principal, user) in users.entries()) {
        if (isExecutiveCoreOrMasterAdmin(principal)) {
          addNotification(
            principal,
            "A new event requires your approval: " # title,
            #eventCreated,
          );
        };
      };
    };
  };

  public shared ({ caller }) func approveEvent(eventId : Nat) : async () {
    requireApprovedUser(caller);

    if (not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Executive Core or MasterAdmin can approve events");
    };

    let event = switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event does not exist") };
      case (?e) { e };
    };

    if (event.status == #approved) {
      Runtime.trap("Event is already approved");
    };

    let updatedEvent = { event with status = #approved };
    events.add(eventId, updatedEvent);

    addNotification(
      event.creator,
      "Your event has been approved: " # event.title,
      #eventCreated,
    );

    for (member in users.keys().toArray().values()) {
      if (member != event.creator) {
        addNotification(
          member,
          "Event approved and now available: " # event.title,
          #eventCreated,
        );
      };
    };
  };

  public query ({ caller }) func getEvents() : async [Event] {
    requireApprovedUserQuery(caller);

    let callerCanSeePending = isExecutiveCoreOrMasterAdmin(caller);

    events.values().toArray().filter(
      func(e : Event) : Bool {
        e.status == #approved or callerCanSeePending;
      }
    );
  };

  public query ({ caller }) func getPendingEvents() : async [Event] {
    requireApprovedUserQuery(caller);

    if (not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Executive Core or MasterAdmin can view pending events");
    };

    events.values().toArray().filter(func(e : Event) : Bool { e.status == #pending });
  };

  public shared ({ caller }) func registerForEvent(eventId : Nat) : async () {
    requireApprovedUser(caller);

    let event = switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event does not exist") };
      case (?e) { e };
    };

    if (event.status != #approved) {
      Runtime.trap("Cannot register for an event that has not been approved yet");
    };

    let registration : Registration = {
      eventId;
      user = caller;
      isPaid = false;
      timestamp = Time.now();
    };

    eventRegistrations.add((eventId, caller), registration);
  };

  public shared ({ caller }) func togglePaid(eventId : Nat, user : Principal) : async () {
    requireApprovedUser(caller);

    if (not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Executive Core or MasterAdmin can update payment status");
    };

    let reg = switch (eventRegistrations.get((eventId, user))) {
      case (null) { Runtime.trap("Registration does not exist") };
      case (?r) { r };
    };

    eventRegistrations.add((eventId, user), { reg with isPaid = not reg.isPaid });
  };

  public query ({ caller }) func getEventRegistrations(eventId : Nat) : async [Registration] {
    requireApprovedUserQuery(caller);

    if (not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Executive Core or MasterAdmin can view registration payment details");
    };

    eventRegistrations.values().toArray().filter(
      func(r : Registration) : Bool { r.eventId == eventId }
    );
  };

  public query ({ caller }) func getMyRegistrations() : async [Registration] {
    requireApprovedUserQuery(caller);

    eventRegistrations.values().toArray().filter(
      func(r : Registration) : Bool { r.user == caller }
    );
  };

  // ---------------------------------------------------------------------------
  // Public: notifications
  // ---------------------------------------------------------------------------

  public query ({ caller }) func getMyNotifications() : async [Notification] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot view notifications");
    };
    switch (notifications.get(caller)) {
      case (null) { [] };
      case (?n) { n.toArray() };
    };
  };

  public shared ({ caller }) func markNotificationsRead() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot perform this action");
    };
    switch (notifications.get(caller)) {
      case (null) {};
      case (?notifList) {
        let updated = notifList.map<Notification, Notification>(
          func(n : Notification) : Notification { { n with isRead = true } },
        );
        notifications.add(caller, updated);
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Public: approval workflow
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func requestApproval() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  /// Approve or reject a pending user registration.
  /// Permitted callers: AccessControl admins (#admin role) OR executive core/master admin.
  public shared ({ caller }) func approveOrRejectUser(
    user : Principal,
    status : UserApproval.ApprovalStatus,
  ) : async {
    updatedUsers : [(Principal, User)];
    approvals : [UserApproval.UserApprovalInfo];
  } {
    // Allow callers who hold the AccessControl #admin role OR are executive core / master admin.
    requireAdminOrExecutive(caller);

    UserApproval.setApproval(approvalState, user, status);

    switch (users.get(user)) {
      case (null) {};
      case (?u) {
        if (u.email == "graph.dust@gmail.com") {
          return {
            updatedUsers = [];
            approvals = [];
          };
        };
        let isApproved = switch (status) {
          case (#approved) { true };
          case (#pending) { false };
          case (#rejected) { false };
        };
        users.add(user, { u with isApproved });

        if (isApproved) {
          AccessControl.assignRole(accessControlState, caller, user, #user);
          addNotification(
            user,
            "Your account has been approved! Welcome to the community.",
            #accountApproved,
          );
        };
      };
    };

    {
      updatedUsers = users.entries().toArray().filter(
        func((_, u) : (Principal, User)) : Bool { not u.isApproved }
      );
      approvals = UserApproval.listApprovals(approvalState);
    };
  };

  /// View pending approvals.
  /// Permitted callers: AccessControl admins (#admin role) OR executive core / master admin.
  public query ({ caller }) func getPendingApprovals() : async {
    users : [(Principal, User)];
    approvals : [UserApproval.UserApprovalInfo];
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin) and not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins or Executive Core and above can view pending approvals");
    };

    let pendingApprovalUsers = users.entries().toArray().filter(
      func((_, u) : (Principal, User)) : Bool { not u.isApproved }
    );

    let pendingApprovals = UserApproval.listApprovals(approvalState);

    {
      users = pendingApprovalUsers;
      approvals = pendingApprovals;
    };
  };

  public query ({ caller }) func getAllUsers() : async [(Principal, User)] {
    requireApprovedUserQuery(caller);

    if (not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Executive Core or MasterAdmin can view all users");
    };

    users.entries().toArray();
  };

  /// View pending (unapproved) users.
  /// Permitted callers: AccessControl admins (#admin role) OR executive core / master admin.
  public query ({ caller }) func getPendingUsers() : async [(Principal, User)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin) and not isExecutiveCoreOrMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins or Executive Core and above can view pending users");
    };

    users.entries().toArray().filter(
      func((_, u) : (Principal, User)) : Bool { not u.isApproved }
    );
  };

  // ---------------------------------------------------------------------------
  // Public: profile picture
  // ---------------------------------------------------------------------------

  public shared ({ caller }) func uploadProfilePic(image : Storage.ExternalBlob) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot upload profile pictures");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user) and not isMasterAdmin(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can upload profile pictures");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) {
        let updatedUser = { user with profilePic = ?image };
        users.add(caller, updatedUser);
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  func roleToText(role : Role) : Text {
    switch (role) {
      case (#president) { "President" };
      case (#vicePresident) { "Vice President" };
      case (#secretaryTreasurer) { "Secretary Treasurer" };
      case (#lt) { "LT" };
      case (#mc) { "MC" };
      case (#elt) { "ELT" };
      case (#member) { "Member" };
      case (#rootAdmin) { "Root Admin" };
    };
  };
};
