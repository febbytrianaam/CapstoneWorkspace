# Plan: Authentication, RBAC, And Team Readiness

## Summary

Prepare the app for real team use with individual logins, roles, backend persistence, and permission-aware UI.

## Goals

- Replace prototype account switching with real login behavior.
- Add role-based access for superadmin, koordinator, and member.
- Keep member task updates constrained to allowed tasks.
- Add password-change support.
- Keep backend permission checks aligned with frontend visibility.

## Non-Goals

- No OAuth or external identity provider.
- No Laravel middleware.
- No public user self-registration.

## Implementation Details

- Use PHP sessions and password hashes.
- Store users and role data in MySQL.
- Keep frontend RBAC in `js/rbac.js` for UX.
- Enforce backend permissions in `backend/api/index.php`.
- Add profile dropdown and password change modal.

## Test Plan

- Login as superadmin and member.
- Confirm hidden menus for member.
- Confirm backend denies unauthorized role actions.
- Verify password change flow.

## Acceptance Criteria

- Users can log in with their own account.
- Members cannot update tasks that are not theirs.
- Superadmin can manage users and permissions.
- Prototype account switcher is no longer required.

## Assumptions

- This plan is reconstructed from current code and commit history.
