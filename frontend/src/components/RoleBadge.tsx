import React from 'react';
import { Role } from '../backend';
import { roleToLabel, roleBadgeClass } from '../lib/utils';

interface RoleBadgeProps {
  role: Role;
  isAdmin?: boolean;
  size?: 'sm' | 'md';
}

export default function RoleBadge({ role, isAdmin = false, size = 'md' }: RoleBadgeProps) {
  const label = isAdmin && role === Role.member ? 'Root Admin' : roleToLabel(role);
  const badgeClass = isAdmin && role === Role.member ? 'role-badge-admin' : roleBadgeClass(role);
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-full font-poppins font-medium ${sizeClass} ${badgeClass}`}>
      {label}
    </span>
  );
}
