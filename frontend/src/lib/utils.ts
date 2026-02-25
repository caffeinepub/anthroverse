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
    default: return 'Member';
  }
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

export function formatEventDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function isUpcomingEvent(timestamp: bigint): boolean {
  const ms = Number(timestamp) / 1_000_000;
  return ms > Date.now();
}

export function canPostAnnouncements(role: Role, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return [Role.president, Role.vicePresident, Role.secretaryTreasurer, Role.lt, Role.mc, Role.elt].includes(role);
}

export function canApproveContent(role: Role, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return [Role.president, Role.vicePresident, Role.secretaryTreasurer].includes(role);
}

export function canMarkPayment(role: Role, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return [Role.president, Role.vicePresident, Role.secretaryTreasurer].includes(role);
}

export function canCreateEvent(role: Role, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return [Role.president, Role.vicePresident, Role.secretaryTreasurer, Role.lt].includes(role);
}

export function canAccessChapterGrowth(role: Role, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return [Role.president, Role.vicePresident, Role.secretaryTreasurer, Role.lt, Role.mc, Role.elt].includes(role);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function postStatusBadge(status: PostStatus): { label: string; className: string } {
  if (status === PostStatus.pending) {
    return { label: 'Pending', className: 'bg-warning/15 text-warning border border-warning/30' };
  }
  return { label: 'Published', className: 'bg-success/15 text-success border border-success/30' };
}
