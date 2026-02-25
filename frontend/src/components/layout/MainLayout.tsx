import React, { useState, useEffect } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { canAccessChapterGrowth, canManageUsers } from '../../utils/permissions';
import NotificationBell from '../notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Rss, Calendar, TrendingUp, User, LogOut, Sun, Moon, Shield } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface MainLayoutProps {
  children: React.ReactNode;
}

function useThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('anthroverse-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('anthroverse-theme', next);
  };

  return { theme, toggle };
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { clear } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { theme, toggle } = useThemeToggle();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const navLinks = [
    { to: '/feed', label: 'Feed', icon: Rss },
    { to: '/events', label: 'Events', icon: Calendar },
    ...(profile && canAccessChapterGrowth(profile.role)
      ? [{ to: '/chapter-growth', label: 'Chapter Growth', icon: TrendingUp }]
      : []),
    ...(profile && canManageUsers(profile.role)
      ? [{ to: '/admin', label: 'Admin', icon: Shield }]
      : []),
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const profilePicUrl = profile?.profilePic?.getDirectURL();
  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navLinks.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to || (to === '/feed' && location.pathname === '/');
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-accent/15 text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 nav-glass">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/assets/generated/logo-mark.dim_256x256.png"
              alt="AnthroVerse"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-display font-bold text-lg gold-text hidden sm:block">AnthroVerse</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavContent />
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="rounded-full w-9 h-9"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            <NotificationBell />

            <Link to="/profile">
              <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-accent/30 hover:ring-accent/60 transition-all">
                {profilePicUrl && <AvatarImage src={profilePicUrl} alt={profile?.name} />}
                <AvatarFallback className="bg-accent/20 text-accent-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full w-9 h-9 text-muted-foreground hover:text-destructive hidden md:flex"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full w-9 h-9">
                  <Menu size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 pt-12">
                <div className="flex flex-col gap-1">
                  <NavContent onNavigate={() => setMobileOpen(false)} />
                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} AnthroVerse · Anthropos Chapter</span>
          <span className="flex items-center gap-1">
            Built with <span className="text-red-500 mx-1">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'anthroverse')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-medium ml-1"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
