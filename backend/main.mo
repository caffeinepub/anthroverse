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

  // Comparison Module for (Nat, Principal) tuples
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
  };

  public type PostStatus = {
    #pending;
    #published;
  };

  public type User = {
    name : Text;
    email : Text;
    role : Role;
    isApproved : Bool;
    profilePic : ?Storage.ExternalBlob;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    role : Role;
    isApproved : Bool;
    profilePic : ?Storage.ExternalBlob;
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

  func requireApprovedUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot perform this action");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #admin) and not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Your account is pending approval");
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
    };
  };

  func isLTOrAdmin(caller : Principal) : Bool {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return true;
    };
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        switch (user.role) {
          case (#president) { true };
          case (#vicePresident) { true };
          case (#secretaryTreasurer) { true };
          case (#lt) { true };
          case (_) { false };
        };
      };
    };
  };

  func isMCOrELT(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        switch (user.role) {
          case (#mc) { true };
          case (#elt) { true };
          case (_) { false };
        };
      };
    };
  };

  func canAccessPrivateGroup(caller : Principal, category : PostCategory) : Bool {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return true;
    };
    switch (users.get(caller)) {
      case (null) { false };
      case (?user) {
        switch (category) {
          case (#leadershipTeam) {
            switch (user.role) {
              case (#president) { true };
              case (#vicePresident) { true };
              case (#secretaryTreasurer) { true };
              case (#lt) { true };
              case (_) { false };
            };
          };
          case (#membershipCommittee) {
            switch (user.role) {
              case (#president) { true };
              case (#vicePresident) { true };
              case (#secretaryTreasurer) { true };
              case (#lt) { true };
              case (#mc) { true };
              case (_) { false };
            };
          };
          case (#coreTeam) {
            switch (user.role) {
              case (#president) { true };
              case (#vicePresident) { true };
              case (#secretaryTreasurer) { true };
              case (#lt) { true };
              case (#mc) { true };
              case (#elt) { true };
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

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can get their profile");
    };
    switch (users.get(caller)) {
      case (null) { null };
      case (?u) {
        ?{
          name = u.name;
          email = u.email;
          role = u.role;
          isApproved = u.isApproved;
          profilePic = u.profilePic;
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can save their profile");
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
    };
    users.add(caller, user);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (users.get(user)) {
      case (null) { null };
      case (?u) {
        ?{
          name = u.name;
          email = u.email;
          role = u.role;
          isApproved = u.isApproved;
          profilePic = u.profilePic;
        };
      };
    };
  };

  public shared ({ caller }) func registerUser(name : Text, email : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot register");
    };
    let user : User = {
      name;
      email;
      role = #member;
      isApproved = false;
      profilePic = null;
    };
    users.add(caller, user);
  };

  public shared ({ caller }) func startNewTenure(
    president : Principal,
    vicePresident : Principal,
    secretaryTreasurer : Principal,
    startDate : Time.Time,
    endDate : Time.Time,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    for ((principal, user) in users.entries()) {
      let updatedUser = { user with role = #member };
      users.add(principal, updatedUser);
      AccessControl.assignRole(accessControlState, caller, principal, #user);
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

  public shared ({ caller }) func assignRole(user : Principal, role : Role) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };

    let userData = switch (users.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?data) { data };
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

  public shared ({ caller }) func submitPost(category : PostCategory, content : Text, image : ?Storage.ExternalBlob) : async () {
    requireApprovedUser(caller);

    let user = switch (users.get(caller)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?u) { u };
    };

    let isAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);
    let callerIsLTOrAdmin = isLTOrAdmin(caller);
    let callerIsMCOrELT = isMCOrELT(caller);

    switch (category) {
      case (#announcements) {
        if (not callerIsLTOrAdmin and not callerIsMCOrELT) {
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
        if (callerIsLTOrAdmin) { #published } else { #pending };
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
    if (not isLTOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only LT or admins can approve posts");
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
    let post = switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?p) { p };
    };

    if (not AccessControl.hasPermission(accessControlState, caller, #admin) and post.author != caller) {
      Runtime.trap("Unauthorized: Only admins or the post author can delete posts");
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

  public query ({ caller }) func getPosts(categoryFilter : ?PostCategory) : async [PostView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin) and not UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("Unauthorized: Your account is pending approval");
    };

    let callerIsLTOrAdmin = isLTOrAdmin(caller);

    let filteredPosts = switch (categoryFilter) {
      case (?category) {
        if (isPrivateGroupCategory(category) and not canAccessPrivateGroup(caller, category)) {
          Runtime.trap("Unauthorized: You do not have access to this group");
        };
        filterAndMapPosts(
          func(p : Post) : Bool {
            p.category == category and (
              p.status == #published or callerIsLTOrAdmin
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
            let canSeePending = p.status == #published or callerIsLTOrAdmin;
            canSeeGroup and canSeePending;
          },
        );
      };
    };

    sortPostsByTime(filteredPosts);
  };

  public query ({ caller }) func getMyPosts() : async [PostView] {
    requireApprovedUser(caller);
    let myPosts = filterAndMapPosts(func(p : Post) : Bool { p.author == caller });
    sortPostsByTime(myPosts);
  };

  public query ({ caller }) func searchPostsByMember(memberName : Text) : async [PostView] {
    requireApprovedUser(caller);
    let callerIsLTOrAdmin = isLTOrAdmin(caller);
    let matchingPosts = filterAndMapPosts(
      func(p : Post) : Bool {
        p.authorName.contains(#text memberName) and (p.status == #published or callerIsLTOrAdmin) and (not p.isPrivateGroup or canAccessPrivateGroup(caller, p.category));
      },
    );
    sortPostsByTime(matchingPosts);
  };

  public query ({ caller }) func getComments(postId : Nat) : async [Comment] {
    requireApprovedUser(caller);

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

  public shared ({ caller }) func createEvent(
    title : Text,
    description : Text,
    date : Time.Time,
    banner : ?Storage.ExternalBlob,
    registrationLimit : ?Nat,
  ) : async () {
    requireApprovedUser(caller);

    if (not isLTOrAdmin(caller) and not isMCOrELT(caller)) {
      Runtime.trap("Unauthorized: Only LT, MC, ELT, or admins can create events");
    };

    let event : Event = {
      id = events.size();
      title;
      description;
      date;
      banner;
      registrationLimit;
      creator = caller;
    };

    events.add(events.size(), event);

    for (member in users.keys().toArray().values()) {
      addNotification(
        member,
        "New event created: " # title,
        #eventCreated,
      );
    };
  };

  public query ({ caller }) func getEvents() : async [Event] {
    requireApprovedUser(caller);
    events.values().toArray();
  };

  public shared ({ caller }) func registerForEvent(eventId : Nat) : async () {
    requireApprovedUser(caller);

    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event does not exist") };
      case (?_event) {};
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
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update payment status");
    };

    let reg = switch (eventRegistrations.get((eventId, user))) {
      case (null) { Runtime.trap("Registration does not exist") };
      case (?r) { r };
    };

    eventRegistrations.add((eventId, user), { reg with isPaid = not reg.isPaid });
  };

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

  public shared ({ caller }) func requestApproval() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can approve users");
    };
    UserApproval.setApproval(approvalState, user, status);

    switch (users.get(user)) {
      case (null) {};
      case (?u) {
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
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public shared ({ caller }) func uploadProfilePic(image : Storage.ExternalBlob) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot upload profile pictures");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
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

  func roleToText(role : Role) : Text {
    switch (role) {
      case (#president) { "President" };
      case (#vicePresident) { "Vice President" };
      case (#secretaryTreasurer) { "Secretary Treasurer" };
      case (#lt) { "LT" };
      case (#mc) { "MC" };
      case (#elt) { "ELT" };
      case (#member) { "Member" };
    };
  };
};

