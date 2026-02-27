import { Role } from '../backend';

/**
 * Returns true for roles that have executive/admin privileges.
 */
export function isExecutiveRole(role: Role): boolean {
  return (
    role === Role.president ||
    role === Role.vicePresident ||
    role === Role.secretaryTreasurer ||
    role === Role.rootAdmin
  );
}

/**
 * Returns true for roles that are LT or above (includes executives).
 */
export function isLTOrAbove(role: Role): boolean {
  return (
    role === Role.president ||
    role === Role.vicePresident ||
    role === Role.secretaryTreasurer ||
    role === Role.lt ||
    role === Role.rootAdmin
  );
}

/**
 * Returns true for roles that can manage users (approve/reject/assign roles).
 * Executives (president, VP, secretaryTreasurer) and rootAdmin can manage users.
 */
export function canManageUsers(role: Role): boolean {
  return isExecutiveRole(role);
}

/**
 * Returns true for roles that can access the admin panel.
 */
export function canAccessAdmin(role: Role): boolean {
  return isExecutiveRole(role);
}

/**
 * Returns true for roles that can approve posts/announcements.
 */
export function canApprovePost(role: Role): boolean {
  return isExecutiveRole(role);
}

/**
 * Returns true for roles that can approve content (alias for canApprovePost).
 */
export function canApproveContent(role: Role): boolean {
  return isExecutiveRole(role);
}

/**
 * Returns true for roles that can post announcements.
 */
export function canPostAnnouncement(role: Role): boolean {
  return isLTOrAbove(role) || role === Role.mc || role === Role.elt;
}

/**
 * Returns true for roles that can create posts.
 */
export function canCreatePost(role: Role): boolean {
  return role !== Role.member || true; // all approved members can post general/fun/requirements
}

/**
 * Returns true for roles that can delete any post (not just their own).
 */
export function canDeleteAnyPost(role: Role): boolean {
  return isExecutiveRole(role);
}

/**
 * Returns true for roles that can access chapter growth analytics.
 */
export function canAccessChapterGrowth(role: Role): boolean {
  return isLTOrAbove(role);
}

/**
 * Returns true for roles that can access private group feeds.
 */
export function canAccessPrivateGroup(role: Role, category: string): boolean {
  switch (category) {
    case 'leadershipTeam':
      return isLTOrAbove(role);
    case 'membershipCommittee':
      return isLTOrAbove(role) || role === Role.mc;
    case 'coreTeam':
      return isLTOrAbove(role) || role === Role.mc || role === Role.elt;
    default:
      return false;
  }
}
