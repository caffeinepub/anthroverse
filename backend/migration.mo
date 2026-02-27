import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type Role = {
    #president;
    #vicePresident;
    #secretaryTreasurer;
    #lt;
    #mc;
    #elt;
    #member;
    #rootAdmin;
  };

  type OldUser = {
    name : Text;
    email : Text;
    role : Role;
    isApproved : Bool;
    profilePic : ?Storage.ExternalBlob;
  };

  type NewUser = {
    name : Text;
    email : Text;
    role : Role;
    isApproved : Bool;
    profilePic : ?Storage.ExternalBlob;
    companyName : Text;
    description : Text;
  };

  type OldActor = {
    users : Map.Map<Principal, OldUser>;
  };

  type NewActor = {
    users : Map.Map<Principal, NewUser>;
  };

  public func run(old : OldActor) : NewActor {
    let users = old.users.map<Principal, OldUser, NewUser>(
      func(_principal, oldUser) {
        {
          oldUser with
          companyName = "";
          description = "";
        };
      }
    );
    { users };
  };
};
