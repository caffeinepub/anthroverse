import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle, XCircle, Clock, Shield, UserCheck, Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ApprovalStatus, Role, User } from '../backend';
import { Principal } from '@dfinity/principal';
import {
  useListApprovals,
  useSetApproval,
  useGetAllUsers,
  useAssignRole,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ROOT_ADMIN_EMAIL, roleToLabel, getInitials } from '../lib/utils';
import RoleAssignmentPanel from '../components/admin/RoleAssignmentPanel';
import CreatePostForm from '../components/feed/CreatePostForm';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('approvals');

  const { data: approvals = [], isLoading: approvalsLoading, refetch: refetchApprovals } = useListApprovals();
  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsers();
  const setApprovalMutation = useSetApproval();
  const assignRoleMutation = useAssignRole();

  const handleApprove = async (principal: Principal) => {
    try {
      await setApprovalMutation.mutateAsync({ user: principal, status: ApprovalStatus.approved });
      toast.success('User approved successfully');
      refetchApprovals();
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (principal: Principal) => {
    try {
      await setApprovalMutation.mutateAsync({ user: principal, status: ApprovalStatus.rejected });
      toast.success('User rejected');
      refetchApprovals();
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject user');
    }
  };

  // Build a map of principal -> user from allUsers
  const userMap = new Map<string, User>();
  allUsers.forEach(([principal, user]) => {
    userMap.set(principal.toString(), user);
  });

  // Pending users: all users who are not approved (from getAllUsers)
  const pendingUsers = allUsers.filter(([, user]) => !user.isApproved && user.email !== ROOT_ADMIN_EMAIL);
  const approvedUsers = allUsers.filter(([, user]) => user.isApproved && user.email !== ROOT_ADMIN_EMAIL);

  // Also include users from listApprovals that might not be in allUsers yet
  const approvalMap = new Map<string, typeof approvals[0]>();
  approvals.forEach(a => approvalMap.set(a.principal.toString(), a));

  const isLoading = approvalsLoading || usersLoading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage members, roles, and content</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approvals
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0.5">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Assign Roles
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Create Post
          </TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Member Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p className="font-medium">No pending approvals</p>
                  <p className="text-sm mt-1">All members have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(([principal, user]) => (
                    <div
                      key={principal.toString()}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.companyName && (
                            <p className="text-xs text-muted-foreground">{user.companyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                          Pending
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
                          onClick={() => handleApprove(principal)}
                          disabled={setApprovalMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleReject(principal)}
                          disabled={setApprovalMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                All Members ({allUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No members registered yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allUsers.map(([principal, user]) => (
                    <div
                      key={principal.toString()}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {user.profilePic ? (
                            <img
                              src={user.profilePic.getDirectURL()}
                              alt={user.name}
                              className="h-full w-full object-cover rounded-full"
                            />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm">{user.name}</p>
                            {user.role === Role.rootAdmin && (
                              <Badge className="text-xs bg-rose-500 text-white">Admin</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.companyName && (
                            <p className="text-xs text-muted-foreground italic">{user.companyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {roleToLabel(user.role)}
                        </Badge>
                        <Badge
                          variant={user.isApproved ? 'default' : 'outline'}
                          className={user.isApproved
                            ? 'text-xs bg-green-500 text-white'
                            : 'text-xs text-amber-600 border-amber-300'
                          }
                        >
                          {user.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Assignment Tab */}
        <TabsContent value="roles">
          <RoleAssignmentPanel />
        </TabsContent>

        {/* Create Post Tab */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create New Post
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreatePostForm
                onSuccess={() => {
                  toast.success('Post created successfully!');
                  setActiveTab('approvals');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
