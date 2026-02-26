# Specification

## Summary
**Goal:** Fix the blank page that appears after the AnthroVerse loading/splash screen by adding defensive error handling, an error boundary, and resolving initialization race conditions.

**Planned changes:**
- Audit `App.tsx` for unhandled promise rejections, missing null checks on actor/user profile queries, and router initialization errors that cause a silent blank screen
- Add a top-level React `ErrorBoundary` component in `main.tsx` wrapping the entire app tree, displaying a recovery message on render errors
- Ensure the TanStack Router does not render authenticated routes before Internet Identity auth state has resolved
- Add explicit `isLoading` and `isError` handling to all `useQuery` hooks in `App.tsx` and the root layout so no component accesses undefined data
- Add fallback states so the app always progresses to either the auth page or main layout, even if backend queries fail

**User-visible outcome:** After the loading screen, the app always navigates to either the authentication page or the main app layout — never a blank page — and any unexpected errors show a user-friendly recovery message instead of a blank screen.
