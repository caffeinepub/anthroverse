# Specification

## Summary
**Goal:** Fix the broken member approval flow by correcting authorization logic in the backend and fixing the identity-passing issue in the frontend AdminPage.

**Planned changes:**
- Fix backend authorization logic in `backend/main.mo` so that the caller's principal is correctly identified and validated when an admin or manager calls the approve user endpoint
- Ensure unauthorized principals are still rejected by the backend
- Fix the frontend `AdminPage` pending-users approval flow so the authenticated caller's identity is correctly passed to the backend actor when the approve button is clicked
- Update the UI to reflect the approved state after a successful call (remove from pending list, add to approved list)
- Show a clear error message or toast when the approval call fails

**User-visible outcome:** Admins and managers can successfully approve pending members from the AdminPage without encountering authorization errors, and the member list updates immediately to reflect the approval.
