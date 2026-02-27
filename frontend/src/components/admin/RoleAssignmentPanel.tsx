import React, { useState } from 'react';
import { useAssignRole } from '../../hooks/useQueries';
import { Role, type UserApprovalInfo } from '../../backend';
import { roleToLabel } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface RoleAssignmentPanelProps {
  approvals: UserApprovalInfo[];
  userNames: Record<string, string>;
}

const ASSIGNABLE_ROLES: Role[] = [
  Role.member,
  Role.elt,
  Role.mc,
  Role.lt,
  Role.secretaryTreasurer,
  Role.vicePresident,
  Role.president,
];

export default function RoleAssignmentPanel({
  approvals,
  userNames,
}: RoleAssignmentPanelProps) {
  const assignRole = useAssignRole();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});

  const approvedUsers = approvals.filter(
    (a) => a.status.toString() === 'approved' || String(a.status) === 'approved',
  );

  const handleAssign = async (principalStr: string) => {
    const role = selectedRoles[principalStr];
    if (!role) {
      toast.error('Please select a role first');
      return;
    }

    try {
      await assignRole.mutateAsync({
        user: approvedUsers.find((a) => a.principal.toString() === principalStr)!
          .principal,
        role,
      });
      toast.success(`Role assigned successfully`);
      setSelectedRoles((prev) => {
        const next = { ...prev };
        delete next[principalStr];
        return next;
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to assign role';
      toast.error(message);
    }
  };

  if (approvedUsers.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No approved members to assign roles to.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {approvedUsers.map((approval) => {
        const principalStr = approval.principal.toString();
        const name = userNames[principalStr] || principalStr.slice(0, 12) + '…';
        const isPending =
          assignRole.isPending &&
          assignRole.variables?.user.toString() === principalStr;

        return (
          <div
            key={principalStr}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <span className="flex-1 truncate text-sm font-medium">{name}</span>
            <Select
              value={selectedRoles[principalStr] ?? ''}
              onValueChange={(val) =>
                setSelectedRoles((prev) => ({
                  ...prev,
                  [principalStr]: val as Role,
                }))
              }
              disabled={isPending}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select role…" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleToLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => handleAssign(principalStr)}
              disabled={!selectedRoles[principalStr] || isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
