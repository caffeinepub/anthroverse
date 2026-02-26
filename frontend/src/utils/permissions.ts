import { Role, PostCategory } from '../backend';

/**
 * Extract the role key string from a Role enum value.
 * The backend returns Role as an enum string like "rootAdmin", "president", etc.
 */
export function getRoleKey(role: Role | undefined | null): string {
  if (!role) return 'member';
  return role as string;
}

export function getRoleDisplayName(role: Role | undefined | null): string {
  const key = getRoleKey(role);
  const labels: Record<string, string> = {
    president: 'President',
    vicePresident: 'Vice President',
    secretaryTreasurer: 'Secretary Treasurer',
    lt: 'Leadership Team',
    mc: 'Membership Committee',
    elt: 'Extended Leadership Team',
    member: 'Member',
    rootAdmin: 'Root Admin',
  };
  return labels[key] ?? 'Member';
}

export function getRoleBadgeClass(role: Role | undefined | null): string {
  const key = getRoleKey(role);
  const classes: Record<string, string> = {
    president: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    vicePresident: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    secretaryTreasurer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    lt: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    mc: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    elt: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    member: 'bg-muted text-muted-foreground',
    rootAdmin: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  };
  return classes[key] ?? classes.member;
}

/**
 * Returns true if the role is rootAdmin.
 * Root admin bypasses ALL permission checks.
 */
export function isRootAdmin(role: Role | undefined | null): boolean {
  return getRoleKey(role) === 'rootAdmin';
}

/**
 * Returns true if the role has elevated (LT-level or above) privileges.
 */
export function isElevatedRole(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  const key = getRoleKey(role);
  return ['president', 'vicePresident', 'secretaryTreasurer', 'lt'].includes(key);
}

/**
 * Returns true if the role is MC or ELT.
 */
export function isMCOrELT(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  const key = getRoleKey(role);
  return ['mc', 'elt'].includes(key);
}

/**
 * Can the user create a post in the given category?
 */
export function canCreatePost(role: Role | undefined | null, category: PostCategory): boolean {
  if (isRootAdmin(role)) return true;
  const key = getRoleKey(role);

  switch (category) {
    case PostCategory.announcements:
      return isElevatedRole(role) || isMCOrELT(role);
    case PostCategory.leadershipTeam:
      return ['president', 'vicePresident', 'secretaryTreasurer', 'lt'].includes(key);
    case PostCategory.membershipCommittee:
      return ['president', 'vicePresident', 'secretaryTreasurer', 'lt', 'mc'].includes(key);
    case PostCategory.coreTeam:
      return ['president', 'vicePresident', 'secretaryTreasurer', 'lt', 'mc', 'elt'].includes(key);
    case PostCategory.general:
    case PostCategory.fun:
    case PostCategory.requirements:
      return true;
    default:
      return false;
  }
}

/**
 * Can the user post announcements?
 * Alias for canCreatePost with announcements category.
 */
export function canPostAnnouncement(role: Role | undefined | null): boolean {
  return canCreatePost(role, PostCategory.announcements);
}

/**
 * Can the user approve/reject posts?
 */
export function canApprovePost(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  return isElevatedRole(role);
}

/**
 * Alias for canApprovePost — used by legacy components.
 */
export function canApproveContent(role: Role | undefined | null): boolean {
  return canApprovePost(role);
}

/**
 * Can the user delete any post (not just their own)?
 */
export function canDeleteAnyPost(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  return isElevatedRole(role);
}

/**
 * Can the user assign roles to other users?
 */
export function canAssignRoles(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  return isElevatedRole(role);
}

/**
 * Can the user approve/reject user registrations?
 */
export function canApproveUsers(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  return isElevatedRole(role);
}

/**
 * Can the user manage tenure (start new tenure)?
 */
export function canManageTenure(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  const key = getRoleKey(role);
  return ['president', 'vicePresident', 'secretaryTreasurer'].includes(key);
}

/**
 * Can the user create events?
 */
export function canCreateEvent(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  return isElevatedRole(role) || isMCOrELT(role);
}

/**
 * Can the user toggle payment status on event registrations?
 */
export function canTogglePaid(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  return isElevatedRole(role);
}

/**
 * Can the user access the admin panel?
 */
export function canAccessAdmin(role: Role | undefined | null): boolean {
  if (isRootAdmin(role)) return true;
  return isElevatedRole(role);
}

/**
 * Alias for canAccessAdmin — used by legacy components.
 */
export function canManageUsers(role: Role | undefined | null): boolean {
  return canAccessAdmin(role);
}

/**
 * Can the user access the Chapter Growth page?
 * All authenticated users can view chapter growth.
 */
export function canAccessChapterGrowth(_role: Role | undefined | null): boolean {
  return true;
}

/**
 * Can the user access a private group category?
 */
export function canAccessPrivateGroup(role: Role | undefined | null, category: PostCategory): boolean {
  if (isRootAdmin(role)) return true;
  const key = getRoleKey(role);

  switch (category) {
    case PostCategory.leadershipTeam:
      return ['president', 'vicePresident', 'secretaryTreasurer', 'lt'].includes(key);
    case PostCategory.membershipCommittee:
      return ['president', 'vicePresident', 'secretaryTreasurer', 'lt', 'mc'].includes(key);
    case PostCategory.coreTeam:
      return ['president', 'vicePresident', 'secretaryTreasurer', 'lt', 'mc', 'elt'].includes(key);
    default:
      return false;
  }
}
