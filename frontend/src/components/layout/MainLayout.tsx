import React, { useState } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { Bell, LogOut, User, ChevronDown, Menu, X } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile, useGetMyNotifications, useMarkNotificationsRead } from '../../hooks/useQueries';
import { getInitials, roleToLabel } from '../../lib/utils';
import AppSidebar from '../AppSidebar';
import { ExternalBlob } from '../../backend';

export default function MainLayout() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: notifications = [] } = useGetMyNotifications();
  const markReadMutation = useMarkNotificationsRead();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleNotificationClick = async () => {
    if (unreadCount > 0) {
      await markReadMutation.mutateAsync();
    }
  };

  const profilePicUrl = userProfile?.profilePic
    ? (userProfile.profilePic as ExternalBlob).getDirectURL()
    : undefined;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Sticky Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <span className="font-semibold text-foreground text-sm hidden sm:block">
                {userProfile?.name ? `Welcome, ${userProfile.name.split(' ')[0]}` : 'Anthroverse'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={handleNotificationClick}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                    <Avatar className="w-7 h-7">
                      {profilePicUrl && <AvatarImage src={profilePicUrl} alt={userProfile?.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(userProfile?.name ?? '')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
                      {userProfile?.name ?? 'User'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{userProfile?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
                    {userProfile?.role && (
                      <p className="text-xs text-primary mt-0.5">{roleToLabel(userProfile.role)}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main scrollable content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
