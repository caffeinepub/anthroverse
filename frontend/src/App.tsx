import { useEffect, useState } from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import ProfileSetupModal from './components/ProfileSetupModal';
import MainLayout from './components/layout/MainLayout';
import FeedPage from './pages/FeedPage';
import EventsPage from './pages/EventsPage';
import ChapterGrowthPage from './pages/ChapterGrowthPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import ChapterMeetingPage from './pages/ChapterMeetingPage';
import LoginPage from './pages/LoginPage';

// Root route with layout
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Auth route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Protected layout route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: MainLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: FeedPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/events',
  component: EventsPage,
});

const chapterGrowthRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/chapter-growth',
  component: ChapterGrowthPage,
});

const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/admin',
  component: AdminPage,
});

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const chapterMeetingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/chapter-meeting',
  component: ChapterMeetingPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    indexRoute,
    eventsRoute,
    chapterGrowthRoute,
    adminRoute,
    profileRoute,
    chapterMeetingRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while initializing identity
  if (isInitializing || (!timedOut && !isInitializing && identity && profileLoading && !isFetched)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading AnthroVerse...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated but no profile yet (null OR undefined from error/new user) → show profile setup
  // Use loose equality (== null) to catch both null and undefined
  const showProfileSetup = !profileLoading && isFetched && userProfile == null;

  if (showProfileSetup) {
    return <ProfileSetupModal />;
  }

  // Still loading profile for the first time
  if (!isFetched && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Authenticated with profile → show main app
  return <RouterProvider router={router} />;
}

export default function App() {
  return <AppContent />;
}
