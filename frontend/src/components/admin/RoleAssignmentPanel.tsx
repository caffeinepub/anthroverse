import React, { useState } from 'react';
import { useListApprovals, useAssignRole, useSetApproval } from '../../hooks/useQueries';
import { ApprovalStatus, Role } from '../../backend';
import { getRoleDisplayName } from '../../utils/permissions';
import RoleBadge from '../RoleBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@icp-sdk/core/principal';

const ALL_ROLES: Role[] = [
  Role.president, Role.vicePresident, Role.secretaryTreasurer,
  Role.lt, Role.mc, Role.elt, Role.member,
];

export default function RoleAssignmentPanel() {
  const { data: approvals = [], isLoading } = useListApprovals();
  const assignRole = useAssignRole();
  const setApproval = useSetApproval();
  const [pendingRoles, setPendingRoles] = useState<Record<string, Role>>({});
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const handleApprove = async (principal: Principal) => {
    const key = principal.toString();
    setLoadingActions(prev => ({ ...prev, [key + '_approve']: true }));
    try {
      await setApproval.mutateAsync({ user: principal, status: ApprovalStatus.approved });
      toast.success('User approved!');
    } catch {
      toast.error('Failed to approve user');
    } finally {
      setLoadingActions(prev => ({ ...prev, [key + '_approve']: false }));
    }
  };

  const handleReject = async (principal: Principal) => {
    const key = principal.toString();
    setLoadingActions(prev => ({ ...prev, [key + '_reject']: true }));
    try {
      await setApproval.mutateAsync({ user: principal, status: ApprovalStatus.rejected });
      toast.success('User rejected');
    } catch {
      toast.error('Failed to reject user');
    } finally {
      setLoadingActions(prev => ({ ...prev, [key + '_reject']: false }));
    }
  };

  const handleAssignRole = async (principal: Principal) => {
    const key = principal.toString();
    const role = pendingRoles[key];
    if (!role) return;
    setLoadingActions(prev => ({ ...prev, [key + '_role']: true }));
    try {
      await assignRole.mutateAsync({ user: principal, role });
      toast.success(`Role assigned: ${getRoleDisplayName(role)}`);
      setPendingRoles(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch {
      toast.error('Failed to assign role');
    } finally {
      setLoadingActions(prev => ({ ...prev, [key + '_role']: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingApprovals = approvals.filter(a => a.status === ApprovalStatus.pending);
  const approvedUsers = approvals.filter(a => a.status === ApprovalStatus.approved);
  const rejectedUsers = approvals.filter(a => a.status === ApprovalStatus.rejected);

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <UserCheck size={15} className="text-amber-500" />
            Pending Approvals
            <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-500/30">
              {pendingApprovals.length}
            </span>
          </h3>
          <div className="space-y-2">
            {pendingApprovals.map(approval => {
              const key = approval.principal.toString();
              return (
                <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                      {key.slice(0, 24)}...
                    </p>
                    <Badge variant="outline" className="text-xs mt-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(approval.principal)}
                      disabled={loadingActions[key + '_approve']}
                      className="h-7 px-3 text-xs bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 border border-green-500/30"
                      variant="outline"
                    >
                      {loadingActions[key + '_approve'] ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <><CheckCircle size={11} className="mr-1" />Approve</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReject(approval.principal)}
                      disabled={loadingActions[key + '_reject']}
                      className="h-7 px-3 text-xs"
                      variant="destructive"
                    >
                      {loadingActions[key + '_reject'] ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <><XCircle size={11} className="mr-1" />Reject</>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approved Users - Role Assignment */}
      {approvedUsers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Users size={15} className="text-blue-500" />
            Members & Role Assignment
            <span className="text-xs text-muted-foreground">({approvedUsers.length})</span>
          </h3>
          <div className="space-y-2">
            {approvedUsers.map(approval => {
              const key = approval.principal.toString();
              return (
                <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                      {key.slice(0, 20)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={pendingRoles[key] || ''}
                      onValueChange={v => setPendingRoles(prev => ({ ...prev, [key]: v as Role }))}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs rounded-lg">
                        <SelectValue placeholder="Assign role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map(role => (
                          <SelectItem key={role} value={role} className="text-xs">
                            {getRoleDisplayName(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => handleAssignRole(approval.principal)}
                      disabled={!pendingRoles[key] || loadingActions[key + '_role']}
                      className="h-7 px-3 text-xs"
                    >
                      {loadingActions[key + '_role'] ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        'Assign'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2 text-muted-foreground">
            <XCircle size={15} />
            Rejected Users
            <span className="text-xs">({rejectedUsers.length})</span>
          </h3>
          <div className="space-y-2">
            {rejectedUsers.map(approval => {
              const key = approval.principal.toString();
              return (
                <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border opacity-60">
                  <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                    {key.slice(0, 24)}...
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(approval.principal)}
                    disabled={loadingActions[key + '_approve']}
                    variant="outline"
                    className="h-7 px-3 text-xs"
                  >
                    Re-approve
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {approvals.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No users have registered yet</p>
        </div>
      )}
    </div>
  );
}
