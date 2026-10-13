# Plan: User Profile And Password Management

## Summary

Add practical account management around profile information, logout, password changes, and user CRUD.

## Goals

- Show logged-in user profile data.
- Move password change and logout into a profile dropdown.
- Allow superadmin to manage users.
- Allow temporary password visibility in admin CRUD with an eye toggle.
- Prevent accidental self-demotion or deletion of the last superadmin.

## Non-Goals

- No self-service account registration.
- No password reset email workflow.
- No external SSO.

## Implementation Details

- Use `users` table fields for profile metadata.
- Add profile dropdown in topbar.
- Add change password modal.
- Add user management modal and password eye toggle.
- Enforce backend safety checks for role changes/deletion.

## Test Plan

- Login and open profile dropdown.
- Change password.
- Create/edit/delete user as superadmin.
- Verify member cannot access user management.
- Verify mobile user modal scrolls to save button.

## Acceptance Criteria

- Users can log out and change password from profile.
- Superadmin can manage users safely.
- Members cannot manage accounts.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
