import React from 'react';
import { Role } from '../backend';
import { useGetCallerUserProfile } from '../hooks/useQueries';

interface ProtectedSectionProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedSection({ allowedRoles, children, fallback = null }: ProtectedSectionProps) {
  const { data: profile } = useGetCallerUserProfile();

  if (!profile) return <>{fallback}</>;
  if (!allowedRoles.includes(profile.role)) return <>{fallback}</>;

  return <>{children}</>;
}
