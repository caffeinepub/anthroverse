import { useEffect, useState } from 'react';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole, useSaveCallerUserProfile } from './hooks/useQueries';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './components/AppSidebar';
import AppHeader from './components/AppHeader';
import FeedPage from './pages/FeedPage';
import EventsPage from './pages/EventsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ChapterGrowthPage from './pages/ChapterGrowthPage';
import { UserRole } from './backend';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

function ProfileSetupModal({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    await saveProfile.mutateAsync({
      name: name.trim(),
      email: email.trim(),
      role: { member: null } as any,
      isApproved: false,
      profilePic: undefined,
    });
    onComplete();
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Set Up Your Profile</DialogTitle>
          <DialogDescription>
            Please enter your name and email to complete your profile setup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={saveProfile.isPending || !name.trim() || !email.trim()}
          >
            {saveProfile.isPending ? 'Saving...' : 'Complete Setup'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedApp() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: userRoleData } = useGetCallerUserRole();

  const isAuthenticated = !!identity;

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const rootRoute = createRootRoute({
    component: AppLayout,
  });

  const feedRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: FeedPage,
  });

  const eventsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/events',
    component: EventsPage,
  });

  const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/profile',
    component: ProfilePage,
  });

  const adminRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin',
    component: AdminPage,
  });

  const chapterGrowthRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/chapter-growth',
    component: ChapterGrowthPage,
  });

  const routeTree = rootRoute.addChildren([
    feedRoute,
    eventsRoute,
    profileRoute,
    adminRoute,
    chapterGrowthRoute,
  ]);

  const router = createRouter({ routeTree });

  return (
    <>
      {showProfileSetup && (
        <ProfileSetupModal onComplete={() => queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] })} />
      )}
      <RouterProvider router={router} />
    </>
  );
}

function LoginPage() {
  const { login, loginStatus, isInitializing } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: 'url(/assets/generated/auth-bg.dim_1200x800.png)' }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col items-center gap-8 p-8 rounded-2xl bg-card/90 shadow-2xl border border-border max-w-sm w-full mx-4">
        <img src="/assets/generated/logo-mark.dim_256x256.png" alt="Logo" className="w-20 h-20 rounded-2xl shadow-lg" />
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-display">Chapter Hub</h1>
          <p className="text-muted-foreground text-sm">Your chapter community platform</p>
        </div>
        <Button
          onClick={login}
          disabled={loginStatus === 'logging-in' || isInitializing}
          className="w-full"
          size="lg"
        >
          {loginStatus === 'logging-in' ? 'Logging in...' : isInitializing ? 'Initializing...' : 'Login'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Secure authentication powered by Internet Identity
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}
