import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, Users, User, Shield, Bell } from "lucide-react";
import { useGetCallerUserProfile, useGetMyNotifications } from "../../hooks/useQueries";
import { isExecutiveRole } from "../../lib/utils";
import { Role } from "../../backend";
import NotificationBell from "../notifications/NotificationBell";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/", label: "Feed", icon: Home },
  { path: "/meeting", label: "Meeting", icon: Calendar },
  { path: "/events", label: "Events", icon: Users },
  { path: "/profile", label: "Profile", icon: User },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const userRole = userProfile?.role ?? Role.member;
  const isAdmin = isExecutiveRole(userRole);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F7F7FB" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/anthroverse-logo.dim_256x256.png"
              alt="AnthroVerse"
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/assets/generated/logo-mark.dim_256x256.png";
              }}
            />
            <span className="font-poppins font-bold text-primary-700 text-lg">AnthroVerse</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold font-poppins transition-colors ${
                  currentPath === "/admin"
                    ? "bg-primary-100 text-primary-700"
                    : "text-muted-foreground hover:text-primary-700 hover:bg-primary-50"
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
            <NotificationBell />
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:block border-t border-border">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold font-poppins transition-colors border-b-2 ${
                    currentPath === path
                      ? "border-primary-700 text-primary-700"
                      : "border-transparent text-muted-foreground hover:text-primary-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
        <div className="flex">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-semibold font-poppins transition-colors ${
                currentPath === path
                  ? "text-primary-700"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${currentPath === path ? "text-primary-700" : ""}`} />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-semibold font-poppins transition-colors ${
                currentPath === "/admin"
                  ? "text-primary-700"
                  : "text-muted-foreground"
              }`}
            >
              <Shield className="w-5 h-5" />
              Admin
            </Link>
          )}
        </div>
      </nav>

      {/* Footer */}
      <footer className="hidden md:block bg-white border-t border-border py-3 text-center text-xs text-muted-foreground font-inter">
        © {new Date().getFullYear()} AnthroVerse · Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary-700"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
