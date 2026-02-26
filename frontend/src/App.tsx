import { useEffect, useMemo } from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useGetCallerUserProfile, useIsCallerApproved } from './hooks/useQueries';
import { Role } from './backend';
import type { User } from './backend';
import AppSidebar from './components/AppSidebar';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import EventsPage from './pages/EventsPage';
import AdminPage from './pages/AdminPage';
import ChapterGrowthPage from './pages/ChapterGrowthPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSetupModal from './components/ProfileSetupModal';
import WaitingForApproval from './components/WaitingForApproval';

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <img src="/assets/generated/logo-mark.dim_256x256.png" alt="AnthroVerse" className="w-20 h-20 animate-pulse" />
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-medium tracking-wide">Loading AnthroVerse…</p>
      </div>
    </div>
  );
}

// ─── Not Found Redirect ───────────────────────────────────────────────────────
function NotFoundRedirect() {
  useEffect(() => {
    window.history.replaceState(null, '', '/');
  }, []);
  return <FeedPage />;
}

// ─── Router ───────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: () => <Outlet /> });
const feedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: FeedPage });
const eventsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/events', component: EventsPage });
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminPage });
const chapterGrowthRoute = createRoute({ getParentRoute: () => rootRoute, path: '/chapter-growth', component: ChapterGrowthPage });
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile', component: ProfilePage });
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundRedirect,
});

const routeTree = rootRoute.addChildren([
  feedRoute,
  eventsRoute,
  adminRoute,
  chapterGrowthRoute,
  profileRoute,
  notFoundRoute,
]);
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ─── Root Admin Email ─────────────────────────────────────────────────────────
const ROOT_ADMIN_EMAIL = 'graph.dust@gmail.com';

// ─── App Content ─────────────────────────────────────────────────────────────
function AppContent() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const qc = useQueryClient();

  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileQueryLoading,
    isFetched: profileQueryFetched,
  } = useGetCallerUserProfile();

  const {
    data: isApproved,
    isLoading: approvalLoading,
    isFetched: approvalFetched,
  } = useIsCallerApproved();

  // Combined loading states
  const profileLoading = actorFetching || profileQueryLoading;
  const profileFetched = !!actor && profileQueryFetched;

  // Root admin bypass:
  // Case 1: Profile exists and has rootAdmin role
  // Case 2: Profile is null but isApproved=true (happens after saveCallerUserProfile
  //         with root admin email — backend sets AccessControl #admin which makes
  //         isCallerApproved return true, but getCallerUserProfile still returns null
  //         because UserApproval state is separate)
  const isRootAdminByRole = userProfile?.role === Role.rootAdmin;
  const isRootAdminByApproval = userProfile === null && isApproved === true && approvalFetched;

  // Synthesize a fallback profile for root admin when profile is null but approved
  const effectiveUserProfile: User | null = useMemo(() => {
    if (userProfile !== null && userProfile !== undefined) return userProfile;
    if (isRootAdminByApproval) {
      // Root admin has been set up (saveCallerUserProfile was called with root admin email)
      // but getCallerUserProfile returns null due to backend UserApproval state mismatch.
      // Synthesize a minimal fallback so the app renders correctly.
      return {
        name: 'Root Admin',
        email: ROOT_ADMIN_EMAIL,
        role: Role.rootAdmin,
        isApproved: true,
        profilePic: undefined,
      };
    }
    return null;
  }, [userProfile, isRootAdminByApproval]);

  const isRootAdmin = isRootAdminByRole || isRootAdminByApproval;

  // Show profile setup only when:
  // - authenticated, actor ready, profile query settled
  // - profile is null
  // - NOT a root admin bypass case (isApproved=true means root admin already set up)
  const showProfileSetup =
    isAuthenticated &&
    !actorFetching &&
    !profileLoading &&
    profileFetched &&
    approvalFetched &&
    !approvalLoading &&
    effectiveUserProfile === null;

  const showWaitingForApproval =
    isAuthenticated &&
    !actorFetching &&
    !profileLoading &&
    profileFetched &&
    approvalFetched &&
    effectiveUserProfile !== null &&
    !isRootAdmin &&
    isApproved === false &&
    !approvalLoading;

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  // Phase 1: Internet Identity initializing
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // Phase 2: Not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Phase 3: Actor initializing
  if (actorFetching) {
    return <LoadingScreen />;
  }

  // Phase 4: Actor unavailable
  if (!actor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-8">
        <img src="/assets/generated/logo-mark.dim_256x256.png" alt="AnthroVerse" className="w-16 h-16 opacity-60" />
        <h2 className="text-xl font-semibold text-foreground">Connection Error</h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Unable to connect to the AnthroVerse network. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  // Phase 5: Profile or approval loading — wait for both to settle before deciding
  if (profileLoading || !profileFetched || approvalLoading || !approvalFetched) {
    return <LoadingScreen />;
  }

  // Phase 6: Profile setup needed (not root admin, no profile yet)
  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileSetupModal
          onComplete={() => {
            qc.invalidateQueries({ queryKey: ['currentUserProfile'] });
            qc.invalidateQueries({ queryKey: ['isCallerApproved'] });
          }}
        />
      </div>
    );
  }

  // Phase 7: Waiting for approval
  if (showWaitingForApproval) {
    return (
      <div className="min-h-screen bg-background">
        <WaitingForApproval onLogout={handleLogout} />
      </div>
    );
  }

  // Phase 8: Fully authenticated and approved — render main app
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userProfile={effectiveUserProfile} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <RouterProvider router={router} />
        </main>
      </div>
    </SidebarProvider>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
}
