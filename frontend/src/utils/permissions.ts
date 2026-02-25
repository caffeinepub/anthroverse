import { Role } from '../backend';

export function isPresidentRole(role: Role): boolean {
  return role === Role.president;
}

export function isVPRole(role: Role): boolean {
  return role === Role.vicePresident;
}

export function isSTRole(role: Role): boolean {
  return role === Role.secretaryTreasurer;
}

export function isLTRole(role: Role): boolean {
  return role === Role.lt;
}

export function isMCRole(role: Role): boolean {
  return role === Role.mc;
}

export function isELTRole(role: Role): boolean {
  return role === Role.elt;
}

export function isMemberRole(role: Role): boolean {
  return role === Role.member;
}

export function isLTOrAbove(role: Role): boolean {
  return [Role.president, Role.vicePresident, Role.secretaryTreasurer, Role.lt].includes(role);
}

export function isLeadershipOrAbove(role: Role): boolean {
  return [Role.president, Role.vicePresident, Role.secretaryTreasurer, Role.lt, Role.mc, Role.elt].includes(role);
}

export function canPostAnnouncement(role: Role): boolean {
  return isLeadershipOrAbove(role);
}

export function canCreateEvent(role: Role): boolean {
  return isLeadershipOrAbove(role);
}

export function canApproveContent(role: Role): boolean {
  return isLTOrAbove(role);
}

export function canDeleteAnyPost(role: Role): boolean {
  return isLTOrAbove(role);
}

export function canManageUsers(role: Role): boolean {
  return isLTOrAbove(role);
}

export function canAssignRoles(role: Role): boolean {
  return isLTOrAbove(role);
}

export function canStartNewTenure(role: Role): boolean {
  return isPresidentRole(role);
}

export function canAccessChapterGrowth(role: Role): boolean {
  return isLeadershipOrAbove(role);
}

export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case Role.president: return 'President';
    case Role.vicePresident: return 'Vice President';
    case Role.secretaryTreasurer: return 'Secretary Treasurer';
    case Role.lt: return 'Leadership Team';
    case Role.mc: return 'Membership Committee';
    case Role.elt: return 'Extended Leadership Team';
    case Role.member: return 'Member';
    default: return 'Member';
  }
}

export function getRoleShortName(role: Role): string {
  switch (role) {
    case Role.president: return 'President';
    case Role.vicePresident: return 'Vice President';
    case Role.secretaryTreasurer: return 'Sec. Treasurer';
    case Role.lt: return 'LT';
    case Role.mc: return 'MC';
    case Role.elt: return 'ELT';
    case Role.member: return 'Member';
    default: return 'Member';
  }
}

export function getRoleClassName(role: Role): string {
  switch (role) {
    case Role.president: return 'role-president';
    case Role.vicePresident: return 'role-vp';
    case Role.secretaryTreasurer: return 'role-st';
    case Role.lt: return 'role-lt';
    case Role.mc: return 'role-mc';
    case Role.elt: return 'role-elt';
    case Role.member: return 'role-member';
    default: return 'role-member';
  }
}
