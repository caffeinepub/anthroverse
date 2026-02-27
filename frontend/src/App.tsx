import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider, createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import { ROOT_ADMIN_EMAIL } from "./lib/utils";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import FeedPage from "./pages/FeedPage";
import EventsPage from "./pages/EventsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import ChapterMeetingPage from "./pages/ChapterMeetingPage";
import ProfileSetupModal from "./components/ProfileSetupModal";
import WaitingForApproval from "./components/WaitingForApproval";
import { Toaster } from "./components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

// ─── Router ──────────────────────────────────────────────────────────────────

// MainLayout uses <Outlet /> internally via SidebarInset, so the root route
// uses it as the layout component directly — no children prop needed.
const rootRoute = createRootRoute({
  component: MainLayout,
});

const feedRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: FeedPage });
const eventsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/events", component: EventsPage });
const meetingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/meeting", component: ChapterMeetingPage });
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: "/profile", component: ProfilePage });
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: "/admin", component: AdminPage });

const routeTree = rootRoute.addChildren([feedRoute, eventsRoute, meetingRoute, profileRoute, adminRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}

// ─── Inner App (needs identity context) ──────────────────────────────────────

function InnerApp() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15_000);
    return () => clearTimeout(t);
  }, []);

  // Phase: initializing
  if (isInitializing || (!timedOut && !isInitializing && identity && profileLoading && !isFetched)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F7FB" }}>
        <div className="text-center">
          <img src="/assets/generated/anthroverse-logo.dim_256x256.png" alt="AnthroVerse" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-semibold text-primary">Loading AnthroVerse…</p>
        </div>
      </div>
    );
  }

  // Phase: unauthenticated
  if (!identity) {
    return <LoginPage />;
  }

  // Phase: profile setup
  const isRootAdmin = userProfile?.email === ROOT_ADMIN_EMAIL;
  const showProfileSetup = !profileLoading && isFetched && userProfile === null;

  if (showProfileSetup) {
    return <ProfileSetupModal />;
  }

  // Phase: waiting approval
  const isApproved = userProfile?.isApproved || isRootAdmin;
  if (userProfile && !isApproved) {
    return <WaitingForApproval />;
  }

  // Phase: main app
  return <RouterProvider router={router} />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
