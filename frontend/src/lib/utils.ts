import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Role, PostCategory, PostStatus } from "../backend";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ROOT_ADMIN_EMAIL = "graph.dust@gmail.com";

export function isRootAdminEmail(email: string): boolean {
  return email.toLowerCase().trim() === ROOT_ADMIN_EMAIL.toLowerCase();
}

export const isRootAdmin = isRootAdminEmail;

export function roleToLabel(role: Role): string {
  switch (role) {
    case Role.rootAdmin: return "Root Admin";
    case Role.president: return "President";
    case Role.vicePresident: return "Vice President";
    case Role.secretaryTreasurer: return "Secretary Treasurer";
    case Role.lt: return "Leadership Team";
    case Role.mc: return "Membership Committee";
    case Role.elt: return "Extended Leadership Team";
    case Role.member: return "Member";
    default: return "Member";
  }
}

export const getRoleLabel = roleToLabel;

export function roleBadgeClass(role: Role): string {
  switch (role) {
    case Role.rootAdmin: return "bg-rose-100 text-rose-800 border border-rose-200";
    case Role.president: return "bg-purple-100 text-purple-800 border border-purple-200";
    case Role.vicePresident: return "bg-violet-100 text-violet-800 border border-violet-200";
    case Role.secretaryTreasurer: return "bg-indigo-100 text-indigo-800 border border-indigo-200";
    case Role.lt: return "bg-blue-100 text-blue-800 border border-blue-200";
    case Role.mc: return "bg-teal-100 text-teal-800 border border-teal-200";
    case Role.elt: return "bg-cyan-100 text-cyan-800 border border-cyan-200";
    case Role.member: return "bg-gray-100 text-gray-700 border border-gray-200";
    default: return "bg-gray-100 text-gray-700 border border-gray-200";
  }
}

export function categoryToLabel(category: PostCategory): string {
  switch (category) {
    case PostCategory.announcements: return "Announcements";
    case PostCategory.general: return "General";
    case PostCategory.fun: return "Fun";
    case PostCategory.requirements: return "Requirements";
    case PostCategory.leadershipTeam: return "Leadership Team";
    case PostCategory.membershipCommittee: return "Membership Committee";
    case PostCategory.coreTeam: return "Core Team";
    default: return "General";
  }
}

export function postStatusLabel(status: PostStatus): string {
  switch (status) {
    case PostStatus.pending: return "Pending";
    case PostStatus.published: return "Published";
    default: return "Unknown";
  }
}

export function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return date.toLocaleDateString();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isExecutiveRole(role: Role): boolean {
  return [Role.rootAdmin, Role.president, Role.vicePresident, Role.secretaryTreasurer].includes(role);
}

export function canApproveContent(role: Role): boolean {
  return isExecutiveRole(role);
}

export function canApprovePost(role: Role): boolean {
  return isExecutiveRole(role);
}

export function canManageUsers(role: Role): boolean {
  return isExecutiveRole(role);
}

export function canPinContent(role: Role): boolean {
  return isExecutiveRole(role);
}

export function canPostAnnouncement(role: Role): boolean {
  return isExecutiveRole(role) || role === Role.lt || role === Role.mc || role === Role.elt;
}

export function canAccessChapterGrowth(role: Role): boolean {
  return isExecutiveRole(role) || role === Role.lt;
}

export function canCreateEvent(role: Role): boolean {
  return isExecutiveRole(role) || role === Role.lt || role === Role.mc || role === Role.elt;
}
