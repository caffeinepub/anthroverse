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
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Calendar,
  User,
  Shield,
  TrendingUp,
  LogOut,
  Heart,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole, Role } from '../backend';

const roleLabels: Record<string, string> = {
  president: 'President',
  vicePresident: 'Vice President',
  secretaryTreasurer: 'Sec. Treasurer',
  lt: 'LT',
  mc: 'MC',
  elt: 'ELT',
  member: 'Member',
};

const roleBadgeColors: Record<string, string> = {
  president: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
  vicePresident: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
  secretaryTreasurer: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  lt: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  mc: 'bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/30',
  elt: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  member: 'bg-muted text-muted-foreground border-border',
};

export default function AppSidebar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userRoleData } = useGetCallerUserRole();
  const { setOpenMobile } = useSidebar();

  const isAdmin = userRoleData === UserRole.admin;
  const userRole = userProfile?.role as Role | undefined;

  const navItems = [
    { path: '/', label: 'Feed', icon: Home },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/chapter-growth', label: 'Chapter Growth', icon: TrendingUp },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const handleNavigate = (path: string) => {
    navigate({ to: path });
    setOpenMobile(false);
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const profilePicUrl = userProfile?.profilePic
    ? userProfile.profilePic.getDirectURL()
    : undefined;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="Chapter Hub"
            className="w-9 h-9 rounded-xl shadow"
          />
          <div>
            <h2 className="font-bold text-sidebar-foreground font-display text-base leading-tight">
              Chapter Hub
            </h2>
            <p className="text-xs text-sidebar-foreground/60">Community Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={currentPath === item.path}
                    onClick={() => handleNavigate(item.path)}
                    className="cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {userProfile && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-9 h-9 shrink-0">
              {profilePicUrl && <AvatarImage src={profilePicUrl} alt={userProfile.name} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(userProfile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userProfile.name}
              </p>
              {userRole && (
                <span
                  className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border font-medium ${
                    roleBadgeColors[userRole] || roleBadgeColors.member
                  }`}
                >
                  {roleLabels[userRole] || userRole}
                </span>
              )}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
        <div className="mt-3 pt-3 border-t border-sidebar-border/50">
          <p className="text-xs text-sidebar-foreground/40 text-center">
            Built with <Heart className="inline w-3 h-3 text-rose-500 fill-rose-500" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sidebar-foreground/70 underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
