import { useState } from 'react';
import {
  useListApprovals,
  useSetApproval,
  useAssignRole,
  useGetCallerUserRole,
  useStartNewTenure,
} from '../hooks/useQueries';
import { ApprovalStatus, Role, UserRole, UserApprovalInfo } from '../backend';
import { Principal } from '@dfinity/principal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Users, CheckCircle, XCircle, UserCog, Calendar } from 'lucide-react';

const roleLabels: Record<string, string> = {
  president: 'President',
  vicePresident: 'Vice President',
  secretaryTreasurer: 'Secretary Treasurer',
  lt: 'LT',
  mc: 'MC',
  elt: 'ELT',
  member: 'Member',
};

function ApprovalPanel() {
  const { data: approvals = [], isLoading } = useListApprovals();
  const setApproval = useSetApproval();

  const pendingApprovals = approvals.filter(
    (a: UserApprovalInfo) => a.status === ApprovalStatus.pending
  );
  const processedApprovals = approvals.filter(
    (a: UserApprovalInfo) => a.status !== ApprovalStatus.pending
  );

  const handleApprove = (principal: Principal) => {
    setApproval.mutate({ user: principal, status: ApprovalStatus.approved });
  };

  const handleReject = (principal: Principal) => {
    setApproval.mutate({ user: principal, status: ApprovalStatus.rejected });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Pending Approvals ({pendingApprovals.length})
        </h3>
        {pendingApprovals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No pending approvals
          </p>
        ) : (
          <div className="space-y-2">
            {pendingApprovals.map((approval: UserApprovalInfo) => (
              <div
                key={approval.principal.toString()}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <div className="min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">
                    {approval.principal.toString().slice(0, 20)}...
                  </p>
                  <Badge variant="outline" className="text-xs mt-1 border-amber-500/30 text-amber-600">
                    Pending
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-green-500/30 text-green-600 hover:bg-green-500/10"
                    onClick={() => handleApprove(approval.principal)}
                    disabled={setApproval.isPending}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(approval.principal)}
                    disabled={setApproval.isPending}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {processedApprovals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            Processed ({processedApprovals.length})
          </h3>
          <div className="space-y-2">
            {processedApprovals.map((approval: UserApprovalInfo) => (
              <div
                key={approval.principal.toString()}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">
                    {approval.principal.toString().slice(0, 20)}...
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs mt-1 ${
                      approval.status === ApprovalStatus.approved
                        ? 'border-green-500/30 text-green-600'
                        : 'border-destructive/30 text-destructive'
                    }`}
                  >
                    {approval.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleAssignmentPanel() {
  const { data: approvals = [] } = useListApprovals();
  const assignRole = useAssignRole();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');

  const approvedUsers = approvals.filter(
    (a: UserApprovalInfo) => a.status === ApprovalStatus.approved
  );

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    await assignRole.mutateAsync({
      user: Principal.fromText(selectedUser),
      role: selectedRole as Role,
    });
    setSelectedUser('');
    setSelectedRole('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign Role</CardTitle>
          <CardDescription>Assign a role to an approved member</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Select Member</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member..." />
              </SelectTrigger>
              <SelectContent>
                {approvedUsers.map((a: UserApprovalInfo) => (
                  <SelectItem key={a.principal.toString()} value={a.principal.toString()}>
                    {a.principal.toString().slice(0, 20)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Select Role</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAssignRole}
            disabled={assignRole.isPending || !selectedUser || !selectedRole}
            className="w-full"
          >
            {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TenureManagement() {
  const startNewTenure = useStartNewTenure();
  const [presidentPrincipal, setPresidentPrincipal] = useState('');
  const [vpPrincipal, setVpPrincipal] = useState('');
  const [stPrincipal, setStPrincipal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleStartTenure = async () => {
    if (!presidentPrincipal || !vpPrincipal || !stPrincipal || !startDate || !endDate) return;
    try {
      await startNewTenure.mutateAsync({
        president: Principal.fromText(presidentPrincipal),
        vicePresident: Principal.fromText(vpPrincipal),
        secretaryTreasurer: Principal.fromText(stPrincipal),
        startDate: BigInt(new Date(startDate).getTime()) * BigInt(1_000_000),
        endDate: BigInt(new Date(endDate).getTime()) * BigInt(1_000_000),
      });
      setPresidentPrincipal('');
      setVpPrincipal('');
      setStPrincipal('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      console.error('Failed to start tenure:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Start New Tenure</CardTitle>
        <CardDescription>
          This will reset all member roles and assign new leadership positions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="president">President Principal ID</Label>
          <Input
            id="president"
            value={presidentPrincipal}
            onChange={(e) => setPresidentPrincipal(e.target.value)}
            placeholder="aaaaa-aa..."
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vp">Vice President Principal ID</Label>
          <Input
            id="vp"
            value={vpPrincipal}
            onChange={(e) => setVpPrincipal(e.target.value)}
            placeholder="aaaaa-aa..."
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="st">Secretary Treasurer Principal ID</Label>
          <Input
            id="st"
            value={stPrincipal}
            onChange={(e) => setStPrincipal(e.target.value)}
            placeholder="aaaaa-aa..."
            className="font-mono text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <Button
          onClick={handleStartTenure}
          disabled={
            startNewTenure.isPending ||
            !presidentPrincipal ||
            !vpPrincipal ||
            !stPrincipal ||
            !startDate ||
            !endDate
          }
          variant="destructive"
          className="w-full"
        >
          {startNewTenure.isPending ? 'Starting Tenure...' : 'Start New Tenure'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { data: userRoleData, isLoading: roleLoading } = useGetCallerUserRole();
  const isAdmin = userRoleData === UserRole.admin;

  if (roleLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-sm">
          You don't have permission to access the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage members, roles, and chapter settings
        </p>
      </div>

      <Tabs defaultValue="approvals">
        <TabsList className="w-full">
          <TabsTrigger value="approvals" className="flex-1 gap-2">
            <Users className="w-4 h-4" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex-1 gap-2">
            <UserCog className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="tenure" className="flex-1 gap-2">
            <Calendar className="w-4 h-4" />
            Tenure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member Approvals</CardTitle>
              <CardDescription>Review and approve new member requests</CardDescription>
            </CardHeader>
            <CardContent>
              <ApprovalPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <RoleAssignmentPanel />
        </TabsContent>

        <TabsContent value="tenure" className="mt-4">
          <TenureManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
