# Next-Step Plan: Production-Readiness Hardening

## Summary

Improve confidence before more team members rely on the app by hardening security basics, clarifying deployment, and adding lightweight manual QA documentation.

## Goals

- Add CSRF protection for state-changing API requests.
- Confirm all migrations are applied on the active database.
- Verify role-based workflows for superadmin, koordinator, and member.
- Document exact run/deploy procedure using port `4000`.
- Start implementation history entries for recently shipped features.

## Non-Goals

- Do not migrate to Laravel.
- Do not redesign Cloudflare Tunnel setup.
- Do not add a complex web server stack unless the owner approves.
- Do not rewrite `js/app.js` into a frontend framework.

## Implementation Details

1. Add CSRF token generation to the PHP session.
2. Expose the token to frontend safely in `index.php`.
3. Send the token on POST/PUT/DELETE requests from `js/data.js`.
4. Validate the token in `backend/api/index.php` for state-changing requests.
5. Keep GET requests readable without CSRF validation.
6. Update docs and manual QA checklist.
7. Confirm `database/migrations/005_user_activity_logs.sql` is applied or covered by `Repository::create()`.

## Test Plan

- Run PHP lint on modified PHP files.
- Run `node --check` on modified JS files.
- Login as superadmin and member.
- Verify POST/PUT/DELETE work with valid token.
- Verify direct state-changing request without token fails.
- Verify GET snapshot still works after login.
- Verify public URL still loads when local server is running.

## Acceptance Criteria

- State-changing API requests require a valid CSRF token.
- Login/logout still work.
- Task update, review action, document upload, and progress note save still work.
- Member cannot access audit/activity pages.
- Documentation reflects the security change.

## Assumptions

- The app will remain session-based.
- JavaScript fetch calls go through `js/data.js` or can be patched centrally.
- Port `4000` remains the local runtime port unless the owner changes it.
