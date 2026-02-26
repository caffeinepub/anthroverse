import { useNavigate, useLocation } from '@tanstack/react-router';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Calendar,
  TrendingUp,
  Settings,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { Role } from '../backend';
import type { User as UserType } from '../backend';

interface AppSidebarProps {
  userProfile: UserType | null;
  onLogout: () => void;
}

const roleLabels: Record<string, string> = {
  president: 'President',
  vicePresident: 'Vice President',
  secretaryTreasurer: 'Secretary Treasurer',
  lt: 'Leadership Team',
  mc: 'Membership Committee',
  elt: 'Extended Leadership Team',
  member: 'Member',
  rootAdmin: 'Root Admin',
};

const roleBadgeColors: Record<string, string> = {
  president: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  vicePresident: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  secretaryTreasurer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  lt: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  mc: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  elt: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  member: 'bg-muted text-muted-foreground',
  rootAdmin: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

const navItems = [
  { label: 'Feed', path: '/', icon: Home },
  { label: 'Events', path: '/events', icon: Calendar },
  { label: 'Chapter Growth', path: '/chapter-growth', icon: TrendingUp },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function AppSidebar({ userProfile, onLogout }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const roleKey = userProfile?.role
    ? (Object.keys(userProfile.role as any)[0] ?? 'member')
    : 'member';

  // Check if user is admin (rootAdmin role OR president/vicePresident/secretaryTreasurer/lt)
  const isAdmin =
    roleKey === 'rootAdmin' ||
    roleKey === 'president' ||
    roleKey === 'vicePresident' ||
    roleKey === 'secretaryTreasurer' ||
    roleKey === 'lt';

  const roleLabel = roleLabels[roleKey] ?? 'Member';
  const badgeColor = roleBadgeColors[roleKey] ?? roleBadgeColors.member;

  const initials = userProfile?.name
    ? userProfile.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="AnthroVerse"
            className="w-9 h-9 rounded-lg"
          />
          <div>
            <h1 className="font-bold text-foreground text-base leading-tight">AnthroVerse</h1>
            <p className="text-xs text-muted-foreground">Community Hub</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate({ to: item.path })}
                      className="cursor-pointer"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === '/admin'}
                    onClick={() => navigate({ to: '/admin' })}
                    className="cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            {userProfile?.profilePic ? (
              <AvatarImage src={userProfile.profilePic.getDirectURL()} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {userProfile?.name ?? 'Loading...'}
            </p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${badgeColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
