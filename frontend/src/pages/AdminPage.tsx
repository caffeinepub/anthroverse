import React, { useState } from 'react';
import { useGetPendingUsers, useGetAllUsers, useApproveOrRejectUser, useAssignRole } from '../hooks/useQueries';
import { ApprovalStatus, Role, type User } from '../backend';
import type { Principal } from '@dfinity/principal';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { getRoleLabel, roleBadgeClass } from '../lib/utils';
import { canManageUsers } from '../utils/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Users, UserCheck, Shield, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { getInitials } from '../lib/utils';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: Role.president, label: 'President' },
  { value: Role.vicePresident, label: 'Vice President' },
  { value: Role.secretaryTreasurer, label: 'Secretary Treasurer' },
  { value: Role.lt, label: 'LT' },
  { value: Role.mc, label: 'MC' },
  { value: Role.elt, label: 'ELT' },
  { value: Role.member, label: 'Member' },
];

export default function AdminPage() {
  const { isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const {
    data: pendingUsers,
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useGetPendingUsers();
  const {
    data: allUsers,
    isLoading: allUsersLoading,
  } = useGetAllUsers();

  const approveOrRejectMutation = useApproveOrRejectUser();
  const assignRoleMutation = useAssignRole();

  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});

  // Determine if the current user can manage other users
  const userRole = userProfile?.role ?? null;
  const isLoadingAuth = actorFetching || profileLoading;
  const canManage = !isLoadingAuth && userRole !== null && canManageUsers(userRole);

  const handleApprove = (principal: Principal) => {
    approveOrRejectMutation.mutate({
      userPrincipal: principal,
      status: ApprovalStatus.approved,
    });
  };

  const handleReject = (principal: Principal) => {
    approveOrRejectMutation.mutate({
      userPrincipal: principal,
      status: ApprovalStatus.rejected,
    });
  };

  const handleAssignRole = (principal: Principal) => {
    const role = selectedRoles[principal.toString()];
    if (!role) return;
    assignRoleMutation.mutate({ userPrincipal: principal, role });
  };

  // Show loading state while auth is initializing
  if (isLoadingAuth) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show access denied if user doesn't have management permissions
  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access the admin panel. Only Executive Core members and above can manage users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const approvedMembers = (allUsers ?? []).filter(([, u]) => u.isApproved);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            <UserCheck className="h-4 w-4 mr-2" />
            Pending Approvals
            {pendingUsers && pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            All Members
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Assign Roles
          </TabsTrigger>
        </TabsList>

        {/* ── Pending Approvals Tab ── */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Approvals</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchPending()}
                disabled={pendingLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${pendingLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {pendingError ? (
                <div className="text-center py-8 space-y-3">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
                  <p className="text-sm text-destructive font-medium">
                    Failed to load pending users
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(pendingError as Error).message}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetchPending()}>
                    Try Again
                  </Button>
                </div>
              ) : pendingLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !pendingUsers || pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(([principal, user]) => (
                    <PendingUserRow
                      key={principal.toString()}
                      principal={principal}
                      user={user}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isLoading={
                        approveOrRejectMutation.isPending &&
                        approveOrRejectMutation.variables?.userPrincipal.toString() === principal.toString()
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── All Members Tab ── */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Members ({approvedMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {allUsersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : approvedMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No approved members yet</p>
              ) : (
                <div className="space-y-2">
                  {approvedMembers.map(([principal, user]) => (
                    <div
                      key={principal.toString()}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Badge className={roleBadgeClass(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Assign Roles Tab ── */}
        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {allUsersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : approvedMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No approved members to assign roles to</p>
              ) : (
                <div className="space-y-3">
                  {approvedMembers.map(([principal, user]) => {
                    const principalStr = principal.toString();
                    const isAssigning =
                      assignRoleMutation.isPending &&
                      assignRoleMutation.variables?.userPrincipal.toString() === principalStr;
                    return (
                      <div
                        key={principalStr}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={selectedRoles[principalStr] ?? user.role}
                            onValueChange={(val) =>
                              setSelectedRoles((prev) => ({
                                ...prev,
                                [principalStr]: val as Role,
                              }))
                            }
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleAssignRole(principal)}
                            disabled={
                              isAssigning ||
                              !selectedRoles[principalStr] ||
                              selectedRoles[principalStr] === user.role
                            }
                          >
                            {isAssigning ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Assign'
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PendingUserRowProps {
  principal: Principal;
  user: User;
  onApprove: (principal: Principal) => void;
  onReject: (principal: Principal) => void;
  isLoading: boolean;
}

function PendingUserRow({ principal, user, onApprove, onReject, isLoading }: PendingUserRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => onApprove(principal)}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(principal)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
