# Implementation: Team Workflow Improvements

Date: 17 October 2026.

## Delivered

- Tindak Lanjut on each phase: Tugas saya, Perlu revisi, and Perlu saya review, with counts, compact previews, and matching board filters.
- Task next-action messages and review buttons reflecting PIC/reviewer/manager capabilities; members still cannot change reviewers.
- Search across task ID, title, description, and PIC; review-state filtering and reset controls.
- Kanban and list views using identical task data and permission checks. New mobile preferences default to list; the user's choice is remembered locally.
- Archive search across title, filename, notes, and uploader; date/name/category sorting and reset.
- Awaited task/user/meeting/progress-note saves, explicit failures, retries, busy controls, dirty-form confirmation, focus management, Escape/Tab behavior, and inline date validation.
- Review submission carries pending checklist edits. Subsequent task edits send only their delta and do not resend the last review action or replace meetings.
- Manual data refresh with last-sync time, error feedback, and unsaved-input protection.
- App snapshots request `include_logs=0`; audit and user activity are fetched only when the superadmin opens Audit. Direct/default snapshot behavior remains compatible.

## Supporting Fixes

- Date constants initialize before archive meeting selectors, preventing the fast-snapshot startup exception.
- Expired sessions close old modals and clear sensitive in-memory/cache state. Failed server logout is reported.
- Browser cache failure does not invalidate a server-confirmed save.
- BA images and grid selection reset between meetings; mouseup handling persists; Delete within one editable cell retains native text editing behavior.
- BA draft quota errors are reported; preview can still open when caching fails.
- Backdrop dismissal requires a gesture that starts outside the dialog. Draft confirmation also applies to inline upload forms and progress notes.
- Notification text is escaped. This fixes the rendered-notification script execution but does not replace server-side notification validation.
- Workload links choose a phase with the selected member's active tasks.
- Repeated BA marking returns the existing meeting instead of treating an unchanged row count as a missing meeting.
- Mobile archive meeting selectors are constrained to their available width.

## Database Protection

- No database connection, SQL statement, migration, seed, reconciliation, or live API mutation was executed during implementation/testing.
- No database schema or migration files were edited.
- Backend source changes are limited to an optional snapshot log flag and idempotent BA-mark response behavior. Existing persistence continues only through normal application use.
- `index.php` was rendered through PHP CLI solely to obtain the static shell for intercepted browser tests. It does not initialize the Repository.
- No server/tunnel restart or infrastructure configuration change was performed.

## Verification

- `node --test tests/store.test.cjs`: five tests covering rejected CRUD operations, server-canonical task deltas, lazy logs, failed logout, and full browser cache.
- `node tests/workspace-ui.cjs <playwright-module-path>`: isolated browser scenarios covering fast snapshot startup, task search/filter/view, rejected-save retry, dirty-form protection, member review submission, command replay, archive filters/sort, lazy audit, refresh failure/retry, BA state, and mobile member restrictions.
- Screenshots and overflow checks at widths 360, 390, 768, and 1365. Screenshots are generated in an OS temporary directory using synthetic records.
- PHP and JavaScript syntax checks and `git diff --check`.
- Browser/API mocks validate frontend behavior; no real MySQL round-trip or public-domain acceptance test is claimed.

## Follow-up: First Login Readiness (18 October 2026)

- Login waits for the initial session snapshot to settle before authenticating, preventing a delayed anonymous 401 from clearing the new session.
- Successful login activates the permitted page through `setPage`, not only its content renderer. Permission/data events do not render anonymous pages.
- Snapshot failures keep the login form open, preserve entered credentials for retry, show an error, and restore the submit button. They no longer activate an empty shell using only the authentication response.
- The app script cache version is `20261018-login-ready-1`.
- Isolated browser coverage now includes first superadmin login, failed-snapshot retry, a delayed anonymous snapshot, and member first-login page/menu restrictions. No live login or database mutation is used.

## Remaining Risks

The earlier audit is not fully resolved by these eight improvements. CLI-only protection for legacy seed scripts, MIME enforcement for uploaded files, effective backend RBAC policy, SQL transactions, stable user-ID assignment relations, per-user notification receipts, and other backend hardening still need separate work. No production-ready claim is made.

Snapshots still load all tasks; the improvement removes audit/activity from ordinary initial snapshots rather than introducing task pagination or a new framework. Notifications/audit telemetry remain best effort and are not part of a business transaction. Multi-step document upload and meeting linkage can still partially succeed; the UI now reports that distinction.
