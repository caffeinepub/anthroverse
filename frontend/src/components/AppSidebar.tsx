import React from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Home, Calendar, TrendingUp, Shield, User, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { getInitials, roleToLabel, roleBadgeClass } from '../lib/utils';
import { canAccessAdmin, canAccessChapterGrowth } from '../utils/permissions';
import { Role, ExternalBlob } from '../backend';

export default function AppSidebar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();

  const userRole = userProfile?.role ?? Role.member;
  const profilePicUrl = userProfile?.profilePic
    ? (userProfile.profilePic as ExternalBlob).getDirectURL()
    : undefined;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <img
            src="/assets/generated/anthroverse-logo.dim_256x256.png"
            alt="Anthroverse"
            className="w-8 h-8 rounded-lg shrink-0 object-cover"
          />
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm text-sidebar-foreground truncate">Anthroverse</span>
            <span className="text-xs text-sidebar-foreground/60 truncate">Community Hub</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/')}
                  onClick={() => navigate({ to: '/' })}
                  tooltip="Feed"
                >
                  <Home className="w-4 h-4" />
                  <span>Feed</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/events')}
                  onClick={() => navigate({ to: '/events' })}
                  tooltip="Events"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Events</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {canAccessChapterGrowth(userRole) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive('/chapter-growth')}
                    onClick={() => navigate({ to: '/chapter-growth' })}
                    tooltip="Chapter Growth"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Chapter Growth</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {canAccessAdmin(userRole) && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive('/admin')}
                      onClick={() => navigate({ to: '/admin' })}
                      tooltip="Admin Panel"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer: Profile + Logout */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive('/profile')}
              onClick={() => navigate({ to: '/profile' })}
              tooltip="Profile"
              className="h-auto py-2"
            >
              <Avatar className="w-7 h-7 shrink-0">
                {profilePicUrl && <AvatarImage src={profilePicUrl} alt={userProfile?.name} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(userProfile?.name ?? '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">{userProfile?.name ?? 'Profile'}</span>
                {userProfile?.role && (
                  <span className={`text-xs truncate ${roleBadgeClass(userProfile.role)}`}>
                    {roleToLabel(userProfile.role)}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Log Out"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
