import React, { useState } from 'react';
import { Shield, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useGetAllUsers, useAssignRole } from '../../hooks/useQueries';
import { Role } from '../../backend';
import { roleToLabel, getInitials, roleBadgeClass } from '../../lib/utils';
import type { Principal } from '@dfinity/principal';

const ASSIGNABLE_ROLES: Role[] = [
  Role.lt,
  Role.mc,
  Role.elt,
  Role.member,
];

export default function RoleAssignmentPanel() {
  const { data: allUsers = [], isLoading } = useGetAllUsers();
  const assignRoleMutation = useAssignRole();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});
  const [assigningUsers, setAssigningUsers] = useState<Set<string>>(new Set());

  // Only show approved non-root-admin users
  const eligibleUsers = allUsers.filter(
    ([, u]) => u.isApproved && u.email !== 'graph.dust@gmail.com'
  );

  const handleRoleSelect = (principalStr: string, role: Role) => {
    setSelectedRoles(prev => ({ ...prev, [principalStr]: role }));
  };

  const handleAssign = async (principal: Principal) => {
    const key = principal.toString();
    const role = selectedRoles[key];
    if (!role) {
      toast.error('Please select a role first');
      return;
    }

    setAssigningUsers(prev => new Set(prev).add(key));
    try {
      await assignRoleMutation.mutateAsync({ userPrincipal: principal, role });
      toast.success(`Role assigned: ${roleToLabel(role)}`);
      setSelectedRoles(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to assign role: ${msg}`);
    } finally {
      setAssigningUsers(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (eligibleUsers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No eligible members</p>
        <p className="text-sm mt-1">Approve members first before assigning roles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {eligibleUsers.map(([principal, user]) => {
        const key = principal.toString();
        const isAssigning = assigningUsers.has(key);
        const selectedRole = selectedRoles[key];

        return (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate text-sm">{user.name}</p>
                <Badge className={`text-xs mt-0.5 ${roleBadgeClass(user.role)}`}>
                  {roleToLabel(user.role)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              <Select
                value={selectedRole ?? ''}
                onValueChange={val => handleRoleSelect(key, val as Role)}
              >
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map(role => (
                    <SelectItem key={role} value={role} className="text-xs">
                      {roleToLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={() => handleAssign(principal)}
                disabled={!selectedRole || isAssigning}
                className="h-8 px-3"
              >
                {isAssigning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
