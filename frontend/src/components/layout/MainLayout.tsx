import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { canAccessChapterGrowth, canManageUsers } from '../../utils/permissions';
import { Bell, LogOut, Menu, X, Users, BarChart2, Calendar, Home } from 'lucide-react';
import { useState } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = userProfile?.role;

  const handleLogout = async () => {
    await clear();
    qc.clear();
    navigate({ to: '/' });
  };

  const navLinks = [
    { to: '/' as const, label: 'Feed', icon: Home },
    { to: '/events' as const, label: 'Events', icon: Calendar },
    ...(userRole && canAccessChapterGrowth(userRole)
      ? [{ to: '/chapter-growth' as const, label: 'Chapter Growth', icon: BarChart2 }]
      : []),
    ...(userRole && canManageUsers(userRole)
      ? [{ to: '/admin' as const, label: 'Admin', icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <img
                src="/assets/generated/logo-mark.dim_256x256.png"
                alt="AnthroVerse"
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-bold text-lg text-foreground hidden sm:block">AnthroVerse</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  activeProps={{ className: 'text-foreground bg-muted' }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {identity && (
                <>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Bell className="w-5 h-5" />
                  </button>
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {userProfile?.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-sm font-medium text-foreground">{userProfile?.name ?? 'Profile'}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(v => !v)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {identity && (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} AnthroVerse. All rights reserved.</span>
          <span>
            Built with{' '}
            <span className="text-rose-500">♥</span>{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'anthroverse')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
