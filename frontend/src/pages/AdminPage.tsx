import { useState } from 'react';
import { Role, ApprovalStatus, type UserApprovalInfo } from '../backend';
import {
  useListApprovals,
  useSetApproval,
  useAssignRole,
  useStartNewTenure,
  useGetCallerUserProfile,
} from '../hooks/useQueries';
import { canAccessAdmin, canAssignRoles, canApproveUsers, canManageTenure, getRoleDisplayName } from '../utils/permissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, UserCheck, RefreshCw, CheckCircle, XCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';

const ASSIGNABLE_ROLES: { value: Role; label: string }[] = [
  { value: Role.president, label: 'President' },
  { value: Role.vicePresident, label: 'Vice President' },
  { value: Role.secretaryTreasurer, label: 'Secretary Treasurer' },
  { value: Role.lt, label: 'Leadership Team' },
  { value: Role.mc, label: 'Membership Committee' },
  { value: Role.elt, label: 'Extended Leadership Team' },
  { value: Role.member, label: 'Member' },
];

function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const variants: Record<ApprovalStatus, { label: string; className: string }> = {
    [ApprovalStatus.pending]: { label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    [ApprovalStatus.approved]: { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    [ApprovalStatus.rejected]: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  };
  const v = variants[status] ?? variants[ApprovalStatus.pending];
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${v.className}`}>
      {v.label}
    </span>
  );
}

function UserApprovalRow({ info, onApprove, onReject, onAssignRole, canAssign }: {
  info: UserApprovalInfo;
  onApprove: (p: Principal) => void;
  onReject: (p: Principal) => void;
  onAssignRole: (p: Principal, role: Role) => void;
  canAssign: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.member);
  const principalStr = info.principal.toString();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono text-foreground truncate">{principalStr}</p>
        <div className="mt-1">
          <ApprovalStatusBadge status={info.status} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {info.status === ApprovalStatus.pending && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
              onClick={() => onApprove(info.principal)}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
              onClick={() => onReject(info.principal)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
          </>
        )}
        {canAssign && info.status === ApprovalStatus.approved && (
          <div className="flex items-center gap-2">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAssignRole(info.principal, selectedRole)}
            >
              Assign
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: approvals, isLoading: approvalsLoading, refetch: refetchApprovals } = useListApprovals();
  const setApprovalMutation = useSetApproval();
  const assignRoleMutation = useAssignRole();
  const startTenureMutation = useStartNewTenure();

  const userRole = userProfile?.role;
  const hasAdminAccess = canAccessAdmin(userRole);

  // Tenure form state
  const [presidentPrincipal, setPresidentPrincipal] = useState('');
  const [vpPrincipal, setVpPrincipal] = useState('');
  const [stPrincipal, setStPrincipal] = useState('');
  const [tenureStart, setTenureStart] = useState('');
  const [tenureEnd, setTenureEnd] = useState('');

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
            <p className="text-muted-foreground text-sm">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApprove = async (principal: Principal) => {
    try {
      await setApprovalMutation.mutateAsync({ user: principal, status: ApprovalStatus.approved });
      toast.success('User approved successfully');
      refetchApprovals();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (principal: Principal) => {
    try {
      await setApprovalMutation.mutateAsync({ user: principal, status: ApprovalStatus.rejected });
      toast.success('User rejected');
      refetchApprovals();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject user');
    }
  };

  const handleAssignRole = async (principal: Principal, role: Role) => {
    try {
      await assignRoleMutation.mutateAsync({ user: principal, role });
      toast.success(`Role assigned: ${getRoleDisplayName(role)}`);
      refetchApprovals();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign role');
    }
  };

  const handleStartTenure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presidentPrincipal || !vpPrincipal || !stPrincipal || !tenureStart || !tenureEnd) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const { Principal: PrincipalClass } = await import('@dfinity/principal');
      await startTenureMutation.mutateAsync({
        president: PrincipalClass.fromText(presidentPrincipal),
        vicePresident: PrincipalClass.fromText(vpPrincipal),
        secretaryTreasurer: PrincipalClass.fromText(stPrincipal),
        startDate: BigInt(new Date(tenureStart).getTime()) * 1_000_000n,
        endDate: BigInt(new Date(tenureEnd).getTime()) * 1_000_000n,
      });
      toast.success('New tenure started successfully');
      setPresidentPrincipal('');
      setVpPrincipal('');
      setStPrincipal('');
      setTenureStart('');
      setTenureEnd('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start tenure');
    }
  };

  const pendingApprovals = approvals?.filter(a => a.status === ApprovalStatus.pending) ?? [];
  const allApprovals = approvals ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Manage users, roles, and chapter settings
              {userRole && (
                <span className="ml-2 text-xs font-medium text-primary">
                  ({getRoleDisplayName(userRole)})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <Tabs defaultValue="approvals">
          <TabsList className="mb-6">
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              User Approvals
              {pendingApprovals.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Role Assignment
            </TabsTrigger>
            {canManageTenure(userRole) && (
              <TabsTrigger value="tenure" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Tenure
              </TabsTrigger>
            )}
          </TabsList>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>Review and approve new member registrations</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchApprovals()}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading approvals...</div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovals.map(info => (
                      <UserApprovalRow
                        key={info.principal.toString()}
                        info={info}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onAssignRole={handleAssignRole}
                        canAssign={canAssignRoles(userRole)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Assignment Tab */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Role Assignment</CardTitle>
                <CardDescription>Assign roles to approved members</CardDescription>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading members...</div>
                ) : allApprovals.filter(a => a.status === ApprovalStatus.approved).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No approved members yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allApprovals
                      .filter(a => a.status === ApprovalStatus.approved)
                      .map(info => (
                        <UserApprovalRow
                          key={info.principal.toString()}
                          info={info}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onAssignRole={handleAssignRole}
                          canAssign={canAssignRoles(userRole)}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenure Tab */}
          {canManageTenure(userRole) && (
            <TabsContent value="tenure">
              <Card>
                <CardHeader>
                  <CardTitle>Start New Tenure</CardTitle>
                  <CardDescription>
                    Begin a new chapter tenure. This will reset all member roles to Member (except Root Admin).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleStartTenure} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        President Principal ID
                      </label>
                      <input
                        type="text"
                        value={presidentPrincipal}
                        onChange={e => setPresidentPrincipal(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="aaaaa-aa..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Vice President Principal ID
                      </label>
                      <input
                        type="text"
                        value={vpPrincipal}
                        onChange={e => setVpPrincipal(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="aaaaa-aa..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Secretary Treasurer Principal ID
                      </label>
                      <input
                        type="text"
                        value={stPrincipal}
                        onChange={e => setStPrincipal(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="aaaaa-aa..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={tenureStart}
                          onChange={e => setTenureStart(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={tenureEnd}
                          onChange={e => setTenureEnd(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={startTenureMutation.isPending}
                      className="w-full"
                    >
                      {startTenureMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Starting Tenure...
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Start New Tenure
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 px-6 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} AnthroVerse. Built with{' '}
          <span className="text-rose-500">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
