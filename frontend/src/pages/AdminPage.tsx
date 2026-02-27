import { useState } from 'react';
import { useGetAllUsers, useAssignRole, useRemoveMember } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Role } from '../backend';
import { getRoleLabel, roleBadgeClass, getInitials } from '../lib/utils';
import { canManageUsers } from '../utils/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import RoleAssignmentPanel from '../components/admin/RoleAssignmentPanel';

const ROOT_ADMIN_EMAIL = 'graph.dust@gmail.com';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: currentUserProfile } = useGetCallerUserProfile();
  const { data: allUsers, isLoading: usersLoading } = useGetAllUsers();
  const removeMember = useRemoveMember();

  const [removingPrincipal, setRemovingPrincipal] = useState<string | null>(null);

  const callerPrincipal = identity?.getPrincipal().toString();
  const userRole = currentUserProfile?.role;
  // Guard against undefined role — only show admin panel when role is known
  const isAdmin = userRole !== undefined && canManageUsers(userRole);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <ShieldCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">
          You don't have permission to access the admin panel.
        </p>
      </div>
    );
  }

  const handleRemoveMember = async (principal: Principal) => {
    const principalStr = principal.toString();
    setRemovingPrincipal(principalStr);
    try {
      await removeMember.mutateAsync(principal);
    } finally {
      setRemovingPrincipal(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage members and assign roles
        </p>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Assign Roles
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Members</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !allUsers || allUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No members found.</p>
                  <p className="text-xs mt-1">Members appear here after they register.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allUsers.map(([principal, user]) => {
                    const principalStr = principal.toString();
                    const isSelf = principalStr === callerPrincipal;
                    const isRootAdmin = user.email === ROOT_ADMIN_EMAIL;
                    const isRemoving = removingPrincipal === principalStr;

                    return (
                      <div
                        key={principalStr}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <Avatar className="w-10 h-10 shrink-0">
                          {user.profilePic && (
                            <AvatarImage src={user.profilePic.getDirectURL()} />
                          )}
                          <AvatarFallback className="text-sm font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{user.name}</span>
                            {isSelf && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                            {isRootAdmin && (
                              <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                                Root Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <Badge
                            variant="secondary"
                            className={`text-xs mt-1 ${roleBadgeClass(user.role)}`}
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>

                        {/* Remove button — hidden for self and root admin */}
                        {!isSelf && !isRootAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={isRemoving || removeMember.isPending}
                              >
                                {isRemoving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{' '}
                                  <strong>{user.name}</strong> from AnthroVerse? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleRemoveMember(principal)}
                                >
                                  Remove Member
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assign Roles Tab */}
        <TabsContent value="roles" className="mt-4">
          <RoleAssignmentPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
