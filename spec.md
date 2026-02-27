# Specification

## Summary
**Goal:** Fix two broken flows: the registration process so new users skip any approval gate and land directly in the app, and the admin member removal feature so it works correctly.

**Planned changes:**
- Set newly registered users' status to approved immediately upon completing signup and profile setup
- Route users directly to the main app after registration, removing any approval waiting screen
- Fix the admin Members tab "Remove Member" action to call the correct backend function
- Add a confirmation prompt before removing a member
- Update the member list immediately after a successful removal without a full page reload
- Show an appropriate error message if member removal fails

**User-visible outcome:** New users are taken straight into the app after registering, with no waiting screen. Admins can successfully remove members from the Members tab, seeing the list update instantly after removal.
