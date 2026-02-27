# Specification

## Summary
**Goal:** Fix admin visibility, enable profile editing, add role/post management controls for admin, and add a logout button for all users in the AnthroVerse app.

**Planned changes:**
- Fix the AdminPage so the root admin (graph.dust@gmail.com) can see all member profiles and pending approval requests immediately upon viewing the panel
- Add an "Admin" badge/tag to the profile page and profile card for users with the admin/root role
- Add admin UI controls for creating posts, creating roles, and assigning roles to members, accessible from the admin panel or sidebar
- Add profile editing support for all users with fields for profile picture, display name, category, company name, and description/bio; persist changes to the backend
- Update the backend User type to include companyName and description fields and accept them in the updateProfile function
- Add a visible logout button in the main navigation sidebar accessible to all authenticated users on all layouts

**User-visible outcome:** The admin can see all members and pending approvals, manage posts and roles, and display an Admin badge on their profile. All users can edit their profiles with extended fields and log out from the sidebar at any time.
