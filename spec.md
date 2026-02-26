# Specification

## Summary
**Goal:** Fix the blank page that appears for the Root Admin account (`graph.dust@gmail.com`) after the loading screen, while all other accounts continue to work normally.

**Planned changes:**
- In `App.tsx`, audit and fix the root admin bypass code path so it only runs after auth and profile loading is complete, never during it
- In `App.tsx`, add a fallback profile object (role = `#rootAdmin`, isApproved = true) when the profile query returns null or undefined for `graph.dust@gmail.com`
- In `App.tsx`, ensure the root admin code path is structurally isolated from the `isApproved` gate and profile-null guard, so it never falls through to `WaitingForApproval` or `ProfileSetup` branches
- In the backend (`main.mo`), add a guard in `getMyProfile` so that if the caller is `graph.dust@gmail.com` and their record is missing, unapproved, or lacks `#rootAdmin` role, the record is auto-created or corrected before returning

**User-visible outcome:** Logging in with `graph.dust@gmail.com` successfully renders the main app layout without a blank page, and no other accounts are affected.
