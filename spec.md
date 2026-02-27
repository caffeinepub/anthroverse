# Specification

## Summary
**Goal:** Build AnthroVerse — a full-stack community platform on ICP with a complete Motoko backend and React frontend supporting role-based access, social feed, events, chapter meetings, and admin management.

**Planned changes:**

### Backend (Motoko)
- Define all stable data stores: Users, Roles, UserRoles, Posts, Comments, Reactions, Polls, Events, Registrations, Meetings, Tenures, PinnedContent, SavedPosts, Notifications
- Enforce MasterAdmin permanence for graph.dust@gmail.com across all operations including tenure resets
- Implement role-based permission guards on all write operations (MasterAdmin, Executive Core, regular members)
- Implement `startNewTenure` function: deactivates old tenure, clears executive roles except MasterAdmin, assigns new President/VP/ST, notifies all members
- Full Post/Feed functions: createPost, approvePost, deletePost, reactToPost, addComment, deleteComment, savePost, unsavePost, getPosts, getPendingPosts, getSavedPosts
- PinnedContent functions: pinContent (single slot, replaces existing), unpinContent, getPinnedContent
- Events functions: createEvent, approveEvent, registerForEvent, markPayment, getEvents, getPendingEvents, getMyRegistrations
- Chapter Meeting functions: createOrUpdateMeeting, getMeeting
- Notification system: auto-emit on user approved, post published, event created/approved, meeting updated, role assigned/removed, tenure started; expose getMyNotifications and markNotificationsRead
- User management: registerUser, approveUser, getPendingUsers, getAllUsers, getMyProfile, updateMyProfile

### Frontend (React)
- Auth flow: Login page → Profile Setup → Waiting for Approval page
- Main app layout: bottom navigation bar on mobile, sidebar on desktop; all routes gated to approved users
- Home/Feed page: pinned content card (gold #C9A227 accent) at top, category filter tabs (Announcements, General, Fun, Requirements), post creation form with text/image/video/GIF/emoji/poll support, post cards with author info, role badges, reactions, comments, save/share actions
- Chapter Meeting tab: styled meeting card showing all fields, edit form and Pin button visible to Executive Core + MasterAdmin only
- Events page: event card grid, register button, create event form, pending events approval list and Mark Paid button for Executive Core + MasterAdmin
- Profile page: editable photo/name/email, role badges, My Posts / My Events / Saved Posts tabs, Logout button, no dark mode toggle
- Admin page (Executive Core + MasterAdmin only): pending user approvals, role management (create/delete), role assignment, tenure management with Start New Tenure dialog, announcement approvals
- Notification bell in header: unread count badge, dropdown panel sorted newest-first, marks all read on open
- Apply design system globally: Primary Purple #4C1D95, Secondary #7C3AED, Accent Teal #00B3A4, Gold #C9A227, Light Background #F7F7FB, Poppins + Inter fonts, 12px border radius, no dark mode classes or toggles
- Use the orbital rings image (PSX_20260227_075738(1).jpg) as full-bleed auth background (with semi-transparent purple overlay) and as circular logo mark in app header; serve from `frontend/public/assets/generated/`

**User-visible outcome:** Members can log in via Internet Identity, set up their profile, and access a full community platform with a social feed, chapter meeting info, events with registration, an admin panel for role/tenure management, and in-app notifications — all enforced by backend role-based permissions.
