import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useListApprovals, useSetApproval, useAssignRole } from "../hooks/useQueries";
import { Role, ApprovalStatus, User } from "../backend";
import { roleToLabel, roleBadgeClass, ROOT_ADMIN_EMAIL } from "../lib/utils";
import { canAccessAdmin } from "../utils/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Users, UserCheck, UserX, Crown } from "lucide-react";
import { getInitials } from "../lib/utils";
import TenureManagement from "../components/admin/TenureManagement";

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: approvals, isLoading: approvalsLoading } = useListApprovals();
  const setApprovalMutation = useSetApproval();
  const assignRoleMutation = useAssignRole();

  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});

  // Root admin bypass: if the logged-in user's email is the root admin email,
  // grant full admin access regardless of stored role state
  const isRootAdminUser = userProfile?.email === ROOT_ADMIN_EMAIL;
  const userRole = isRootAdminUser ? Role.rootAdmin : userProfile?.role;
  const hasAdminAccess = isRootAdminUser || canAccessAdmin(userRole);

  if (!hasAdminAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access the admin panel. This area is reserved for administrators and leadership team members.
        </p>
      </div>
    );
  }

  const pendingApprovals = approvals?.filter(a => a.status === ApprovalStatus.pending) ?? [];
  const approvedUsers = approvals?.filter(a => a.status === ApprovalStatus.approved) ?? [];

  const handleApprove = (principal: any) => {
    setApprovalMutation.mutate({ user: principal, status: ApprovalStatus.approved });
  };

  const handleReject = (principal: any) => {
    setApprovalMutation.mutate({ user: principal, status: ApprovalStatus.rejected });
  };

  const handleAssignRole = (principal: any) => {
    const role = selectedRoles[principal.toString()];
    if (!role) return;
    assignRoleMutation.mutate({ user: principal, role });
  };

  const availableRoles = [
    Role.member,
    Role.elt,
    Role.mc,
    Role.lt,
    Role.secretaryTreasurer,
    Role.vicePresident,
    Role.president,
  ];

  // Roles that can manage tenures (rootAdmin + senior leadership)
  const canManageTenure = isRootAdminUser || [
    Role.rootAdmin,
    Role.president,
    Role.vicePresident,
    Role.secretaryTreasurer,
  ].includes(userRole as Role);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, approvals, and roles</p>
        </div>
      </div>

      <Tabs defaultValue="approvals">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approvals">
            <UserCheck className="w-4 h-4 mr-2" />
            Approvals
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Crown className="w-4 h-4 mr-2" />
            Role Assignment
          </TabsTrigger>
          {canManageTenure && (
            <TabsTrigger value="tenure">
              <Users className="w-4 h-4 mr-2" />
              Tenure
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Pending Approvals ({pendingApprovals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pendingApprovals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending approvals</p>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.principal.toString()}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="text-xs bg-muted">
                            {approval.principal.toString().slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {approval.principal.toString().slice(0, 20)}...
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(approval.principal)}
                          disabled={setApprovalMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(approval.principal)}
                          disabled={setApprovalMutation.isPending}
                        >
                          <UserX className="w-3 h-3 mr-1" />
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

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Assign Roles to Approved Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : approvedUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No approved members yet</p>
              ) : (
                <div className="space-y-3">
                  {approvedUsers.map((approval) => (
                    <div
                      key={approval.principal.toString()}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="text-xs bg-muted">
                            {approval.principal.toString().slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium text-foreground">
                          {approval.principal.toString().slice(0, 20)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedRoles[approval.principal.toString()] ?? ""}
                          onValueChange={(val) =>
                            setSelectedRoles((prev) => ({
                              ...prev,
                              [approval.principal.toString()]: val as Role,
                            }))
                          }
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass(role)}`}>
                                  {roleToLabel(role)}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => handleAssignRole(approval.principal)}
                          disabled={
                            !selectedRoles[approval.principal.toString()] ||
                            assignRoleMutation.isPending
                          }
                        >
                          {assignRoleMutation.isPending ? (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Assign"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canManageTenure && (
          <TabsContent value="tenure">
            <TenureManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
