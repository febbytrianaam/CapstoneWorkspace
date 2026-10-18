# Member Account Status

## Changes

- User Management shows account status and superadmin-only Nonaktifkan/Aktifkan actions with confirmation. Pending tasks involving the member are counted in the warning. Superadmin accounts and the current account cannot be toggled.
- `PUT resource=users&id=...` with `{ "action": "set_status", "isActive": false }` validates the role and boolean server-side. Repository updates the status and audit entry in a transaction; retries do not add duplicate audit events.
- Public user mapping exposes `isActive`, including the limited member snapshot, while retaining historical user identities. Password authentication checks the status, and session resolution checks it on every API request and clears an inactive session's account identity.
- New/changed task PIC, reviewer, and meeting host must be active. Existing assignments are retained during unrelated edits; review submission requires active assignees. Existing inactive selections appear disabled in edit dropdowns. Unfinished task next-action text requests reassignment by superadmin; completed history remains completed.
- Current workload and phase-presence lists omit inactive accounts. Management and historical task filters retain them.
- Opening the BA form refreshes the user directory from the server. Active members alone populate attendance, roster, automatic default team PIC text, and signatures. The empty absent column is `-`. An actual absent active member is still listed.
- No status toggle rewrites draft payloads, free-text activity PIC/notes, manual PDFs, archived files, task assignments, or meeting records. Regenerating an old draft uses the current active roster; already archived PDFs are immutable unless explicitly replaced through the existing archive workflow.
- Reactivation restores the same account; it does not move tasks or reset passwords. A session that was rejected while inactive must log in again. This feature does not introduce a permanent session-version registry for dormant sessions that make no request during the entire inactive interval.

## Migration

- Fresh-install schema includes `users.is_active` with default 1.
- `database/migrate_user_active_status.php` checks for compatible existing columns, defaults to dry-run, and accepts `--apply` only for the additive migration 007.
- Migration requests `ALGORITHM=INSTANT` and a five-second metadata-lock wait; it fails instead of silently falling back to a table copy. No application boot-time DDL was added.
- Owner approval covers the column addition, not deactivating a real member. No real account should be toggled by automated testing.
- Applied on 18 October 2026 after isolated tests: migration added only `users.is_active` and verified that all five existing accounts remained active. A second dry run confirmed the compatible column already exists and made no changes. No member was deactivated and no task, meeting, document, or BA draft was updated by this migration.

## Testing

`tests/user-status.test.php`, `tests/phase-access.test.php`, Node store/RBAC tests, and the mocked browser suite cover the feature without a live DB connection. Browser tests intercept every API call; synthetic fixture changes are not real project mutations. Public Cloudflare login and multi-admin concurrency are not certified by these tests.

Verification passed: PHP status/auth/assignment/rollback contracts, phase-access filtering, BA storage regressions, Node tests including active-roster/default-PIC coverage, and 21 mocked browser scenario groups across 360/390/768/1365px. The four-member roster, four signatures, absent `-`, rejected status changes, reactivation, and unchanged business records were checked. Mobile user management screenshot inspected; the wide table retains horizontal scrolling. Syntax checks and `git diff --check` passed.
