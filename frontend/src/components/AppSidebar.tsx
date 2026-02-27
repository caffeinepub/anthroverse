import React from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Home,
  Calendar,
  TrendingUp,
  Shield,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { getInitials, roleToLabel, roleBadgeClass, ROOT_ADMIN_EMAIL } from '../lib/utils';
import { Role } from '../backend';
import { canManageUsers, canAccessChapterGrowth } from '../utils/permissions';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();

  const userRole = userProfile?.role;
  const isAdmin = userRole === Role.rootAdmin || userProfile?.email === ROOT_ADMIN_EMAIL;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const mainNavItems: NavItem[] = [
    { label: 'Feed', path: '/', icon: <Home className="h-4 w-4" /> },
    { label: 'Events', path: '/events', icon: <Calendar className="h-4 w-4" /> },
  ];

  if (userRole && canAccessChapterGrowth(userRole)) {
    mainNavItems.push({
      label: 'Chapter Growth',
      path: '/chapter-growth',
      icon: <TrendingUp className="h-4 w-4" />,
    });
  }

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/anthroverse-logo.dim_256x256.png"
            alt="AnthroVerse"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <div>
            <p className="font-bold text-sm text-sidebar-foreground">AnthroVerse</p>
            <p className="text-xs text-sidebar-foreground/60">Community Hub</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* User Profile Section */}
        {userProfile && (
          <SidebarGroup className="pt-4 pb-2">
            <SidebarGroupContent>
              <button
                onClick={() => navigate({ to: '/profile' })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  {userProfile.profilePic ? (
                    <img
                      src={userProfile.profilePic.getDirectURL()}
                      alt={userProfile.name}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                      {getInitials(userProfile.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-sidebar-foreground truncate">
                      {userProfile.name}
                    </p>
                    {isAdmin && (
                      <Badge className="text-xs px-1.5 py-0 bg-rose-500 text-white shrink-0">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <Badge className={`text-xs mt-0.5 ${roleBadgeClass(userProfile.role)}`}>
                    {roleToLabel(userProfile.role)}
                  </Badge>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0" />
              </button>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    onClick={() => navigate({ to: item.path })}
                    className="cursor-pointer"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {(isAdmin || (userRole && canManageUsers(userRole))) && (
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
                      className="cursor-pointer"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Account */}
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('/profile')}
                  onClick={() => navigate({ to: '/profile' })}
                  className="cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Logout */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
