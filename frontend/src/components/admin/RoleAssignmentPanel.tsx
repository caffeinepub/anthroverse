import React, { useState } from 'react';
import { UserCheck, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Role } from '../../backend';
import { Principal } from '@dfinity/principal';
import { useGetAllUsers, useAssignRole } from '../../hooks/useQueries';
import { getInitials, roleToLabel, roleBadgeClass, ROOT_ADMIN_EMAIL } from '../../lib/utils';

const ASSIGNABLE_ROLES: { value: Role; label: string }[] = [
  { value: Role.president, label: 'President' },
  { value: Role.vicePresident, label: 'Vice President' },
  { value: Role.secretaryTreasurer, label: 'Secretary Treasurer' },
  { value: Role.lt, label: 'LT' },
  { value: Role.mc, label: 'MC' },
  { value: Role.elt, label: 'ELT' },
  { value: Role.member, label: 'Member' },
];

export default function RoleAssignmentPanel() {
  const { data: allUsers = [], isLoading } = useGetAllUsers();
  const assignRoleMutation = useAssignRole();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});

  const approvedUsers = allUsers.filter(
    ([, user]) => user.isApproved && user.email !== ROOT_ADMIN_EMAIL
  );

  const handleAssignRole = async (principal: Principal, role: Role) => {
    try {
      await assignRoleMutation.mutateAsync({ user: principal, role });
      toast.success(`Role "${roleToLabel(role)}" assigned successfully`);
      // Clear the selection for this user
      setSelectedRoles((prev) => {
        const next = { ...prev };
        delete next[principal.toString()];
        return next;
      });
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign role');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Assign Roles to Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvedUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No approved members yet</p>
            <p className="text-sm mt-1">Approve members first to assign roles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedUsers.map(([principal, user]) => {
              const principalStr = principal.toString();
              const selectedRole = selectedRoles[principalStr];

              return (
                <div
                  key={principalStr}
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
                      <p className="font-medium text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${roleBadgeClass(user.role)}`}>
                      {roleToLabel(user.role)}
                    </Badge>
                    <Select
                      value={selectedRole ?? ''}
                      onValueChange={(val) =>
                        setSelectedRoles((prev) => ({
                          ...prev,
                          [principalStr]: val as Role,
                        }))
                      }
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="Change role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value} className="text-xs">
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedRole || assignRoleMutation.isPending}
                      onClick={() => selectedRole && handleAssignRole(principal, selectedRole)}
                      className="h-8 text-xs"
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
