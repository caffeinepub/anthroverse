import React from 'react';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, LogOut, User, Shield, Home, Users, Calendar, TrendingUp } from 'lucide-react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppSidebar from '../AppSidebar';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetMyNotifications } from '../../hooks/useQueries';
import { getInitials, ROOT_ADMIN_EMAIL } from '../../lib/utils';
import { Role } from '../../backend';
import { canManageUsers, canAccessChapterGrowth } from '../../utils/permissions';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: notifications = [] } = useGetMyNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const userRole = userProfile?.role;
  const isAdmin = userRole === Role.rootAdmin || userProfile?.email === ROOT_ADMIN_EMAIL;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const navItems = [
    { label: 'Feed', path: '/', icon: <Home className="h-4 w-4" /> },
    { label: 'Events', path: '/events', icon: <Calendar className="h-4 w-4" /> },
    ...(userRole && canAccessChapterGrowth(userRole)
      ? [{ label: 'Chapter Growth', path: '/chapter-growth', icon: <TrendingUp className="h-4 w-4" /> }]
      : []),
    ...(isAdmin || (userRole && canManageUsers(userRole))
      ? [{ label: 'Admin', path: '/admin', icon: <Shield className="h-4 w-4" /> }]
      : []),
  ];

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4">
          <SidebarTrigger className="-ml-1" />

          {/* Nav buttons */}
          <nav className="hidden sm:flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate({ to: item.path })}
                className="flex items-center gap-1.5 text-xs"
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex-1 sm:flex-none" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notifications bell (no route — just a visual indicator) */}
            <div className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-7 w-7">
                    {userProfile?.profilePic ? (
                      <img
                        src={userProfile.profilePic.getDirectURL()}
                        alt={userProfile.name}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {userProfile ? getInitials(userProfile.name) : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {userProfile && (
                  <>
                    <div className="px-3 py-2">
                      <p className="font-semibold text-sm truncate">{userProfile.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                      {isAdmin && (
                        <Badge className="mt-1 text-xs bg-rose-500 text-white">Admin</Badge>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                {(isAdmin || (userRole && canManageUsers(userRole))) && (
                  <DropdownMenuItem onClick={() => navigate({ to: '/admin' })}>
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} AnthroVerse. Built with{' '}
            <span className="text-rose-500">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'anthroverse')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
