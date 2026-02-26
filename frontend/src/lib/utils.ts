import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Role, PostCategory, PostStatus } from '../backend';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roleToLabel(role: Role): string {
  switch (role) {
    case Role.president: return 'President';
    case Role.vicePresident: return 'Vice President';
    case Role.secretaryTreasurer: return 'Secretary Treasurer';
    case Role.lt: return 'LT';
    case Role.mc: return 'MC';
    case Role.elt: return 'ELT';
    case Role.member: return 'Member';
    case Role.rootAdmin: return 'Root Admin';
    default: return 'Member';
  }
}

/** Alias for roleToLabel — used by newer components */
export function getRoleLabel(role: Role): string {
  return roleToLabel(role);
}

export function roleBadgeClass(role: Role): string {
  switch (role) {
    case Role.president: return 'role-badge-president';
    case Role.vicePresident: return 'role-badge-vp';
    case Role.secretaryTreasurer: return 'role-badge-st';
    case Role.lt: return 'role-badge-lt';
    case Role.mc: return 'role-badge-mc';
    case Role.elt: return 'role-badge-elt';
    case Role.member: return 'role-badge-member';
    case Role.rootAdmin: return 'role-badge-root-admin';
    default: return 'role-badge-member';
  }
}

export function categoryToLabel(category: PostCategory): string {
  switch (category) {
    case PostCategory.announcements: return 'Announcements';
    case PostCategory.general: return 'General';
    case PostCategory.fun: return 'Fun';
    case PostCategory.requirements: return 'Requirements';
    case PostCategory.leadershipTeam: return 'Leadership Team';
    case PostCategory.membershipCommittee: return 'Membership Committee';
    case PostCategory.coreTeam: return 'Core Team';
    default: return 'General';
  }
}

export function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Legacy helper used by older PostCard component.
 * Checks if the user can approve content (posts/announcements).
 */
export function canApproveContent(role: Role, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  switch (role) {
    case Role.rootAdmin:
    case Role.president:
    case Role.vicePresident:
    case Role.secretaryTreasurer:
    case Role.lt:
      return true;
    default:
      return false;
  }
}

export function postStatusLabel(status: PostStatus): string {
  switch (status) {
    case PostStatus.pending: return 'Pending';
    case PostStatus.published: return 'Published';
    default: return 'Unknown';
  }
}
