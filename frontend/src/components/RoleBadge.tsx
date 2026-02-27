import React from "react";
import { Role } from "../backend";
import { roleToLabel, roleBadgeClass } from "../lib/utils";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export default function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeClass(role)} ${className}`}>
      {roleToLabel(role)}
    </span>
  );
}
