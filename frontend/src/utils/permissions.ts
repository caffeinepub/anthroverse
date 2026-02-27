import { Role } from "../backend";
import { isExecutiveRole } from "../lib/utils";

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

export function isAdminRole(role: Role): boolean {
  return isExecutiveRole(role);
}

/** Alias used by AdminPage — same as isExecutiveRole / isAdminRole */
export function canAccessAdmin(role: Role | undefined): boolean {
  if (!role) return false;
  return isExecutiveRole(role);
}

export function canDeleteAnyPost(role: Role): boolean {
  return isExecutiveRole(role);
}

export function canCreatePost(role: Role, _category?: unknown): boolean {
  return true; // All approved members can create posts (backend enforces category restrictions)
}
