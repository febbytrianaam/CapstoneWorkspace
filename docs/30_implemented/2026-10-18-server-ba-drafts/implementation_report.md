# Implementation: Server BA Drafts And Browser Recovery

Date: 18 October 2026.

## Delivered

- BA drafts now use authenticated `ba-drafts` API GET/PUT, one row per existing non-deleted meeting. No new meeting is created and no meeting's schedule, BA-finalization flag, or task relation is modified.
- Drafts include title, actual date/time text, location/link, attendee names, activity/output/PIC/notes cells, and documentation images. Text/newlines remain intact; incomplete drafts may be saved.
- Atomic expected-revision updates reject concurrent changes. Identical retries are idempotent. Failed saves retain form input and show an error inside the modal.
- Server drafts are loaded before editing/saving is enabled. A database load failure cannot silently fall back to an empty/default draft and overwrite unknown server content.
- Preview still opens synchronously in a new tab before awaiting its server save, avoiding popup blocking. Failed save shows a warning without claiming the draft was persisted.
- Existing local drafts are backed up first, then imported only into meetings without a conflicting server draft. Deleted/missing meetings and invalid legacy payloads remain preserved in backups and local source storage.
- When a local version differs, the form offers an explicit Use Device Version action. It does not replace the server record until a version-checked save succeeds.
- Superadmin Audit includes Cadangan Browser Lama with list/download, not an automatic restoration of stale tasks or users.
- RBAC permission writes now await the backend and update the UI/cache only after confirmation. Failed writes roll back the checkbox instead of pretending the browser-only change was saved.

## Storage Inventory

| Feature / local key | Authoritative storage and treatment |
|---|---|
| BA draft `capstone_berita_acara_drafts_v1` | Previously browser-only. Now `berita_acara_drafts`; legacy values backed up before safe import. New saves do not write this key. |
| Tasks `capstone_workspace_v3` | Already MySQL tasks/checklists. Old raw cache preserved in `browser_recovery_backups`, never merged over live tasks. No new online business-cache writes. |
| Meetings `capstone_general_meetings_v1` | Already MySQL meetings. Old raw cache preserved, not automatically recreated or merged. |
| Progress notes `capstone_progress_notes_v1` | Already MySQL phase notes. Old cache preserved without overwriting newer notes. Unsaved form input is still protected in memory. |
| Notifications `capstone_notifications_v3` | Already MySQL notifications. Legacy cache preserved, not republished as duplicate notifications. |
| Audit `capstone_audit_logs_v3` / activities `capstone_user_activities_v1` | Already MySQL logs. Old raw snapshots preserved, not fabricated or replayed as real history. |
| Users `capstone_users_list_v3` | Already MySQL users. No new online cache writes. This old cache is not uploaded because historical copies may contain credential fields. |
| `capstone_auth_v1`, `capstone_current_user_v3` | Cached identity for boot/UI only, not authentication authority. PHP session and backend role checks remain authoritative. Never included in browser backups. |
| `capstone_rbac_matrix_v1` | UI permission cache; permissions already persist through RBAC API/MySQL. It is not imported as authority over current server permissions. |
| Theme, sidebar, saved page, Kanban/list, note collapse, disabled-tour state | Device-specific display preferences intentionally remain local. They are not project data or permission authority. |

## New Storage And API

- `berita_acara_drafts`: meeting primary key, JSON-text payload, fingerprint, revision, editor, and UTC timestamps. No FK/alteration of the existing meeting table is required.
- `browser_recovery_backups`: immutable, content-addressed original work-key snapshots, attributed to the authenticated importing account. Repeating the same snapshot does not duplicate it.
- `backend/BeritaAcaraStorage.php` owns validation, mapping, concurrency, and recovery. Repository delegates without adding auto-DDL for these tables.
- `GET/PUT resource=ba-drafts&meeting_id=...`: superadmin/coordinator only, subject to BA permission.
- `POST resource=ba-drafts`: safe import from a backup owned by the current account. Reports saved/conflicting/unresolved entries.
- `POST resource=browser-backups`: authenticated BA managers may preserve a whitelisted snapshot. Auth/user credential caches and arbitrary keys are excluded.
- `GET resource=browser-backups[&id=...]`: superadmin only, for listing/download.
- Supported documentation images are PNG/JPEG/GIF/WebP, validated by decoded image content. SVG/invalid data is rejected; the original legacy backup is retained. Total image data limit is 10 MB; draft limit is 12 MB; backup limit is 16 MB.
- Imports never delete local keys. Online snapshots no longer overwrite old work caches. Session expiration/logout removes identity cache but preserves work awaiting recovery.

## Authorized Deployment

- User answer: Boleh, tambahkan tabel saja.
- Ran `php database/migrate_ba_storage.php` dry run, followed by `--apply`, then a verifying dry run.
- Only the two new empty tables were created. No existing business-table DML, ALTER, backfill, seed, or compatibility migration was executed.
- The runner is CLI-only, checks its exact two CREATE statements, checks existing target table columns, and defaults to dry run.
- `database/schema.sql` also describes the tables for fresh installs. Do not run that whole file on live data; it still contains historical seeds.

## Verification

- Twelve Node datastore/RBAC tests: local-source preservation through snapshot/logout, backup-before-import ordering/failure, conflict propagation, failed-permission rollback/server authority, plus earlier workflow regressions.
- `php tests/ba-storage.test.php`: in-memory PDO doubles cover images/text/newlines, revisions/idempotency, conflict protection, validation, immutable/deduplicated backups, ownership, orphan handling, and no meeting changes.
- `php tests/phase-access.test.php`: existing phase-access regression.
- Nineteen isolated browser scenario groups, including server draft round-trip after clearing browser storage, failed-save retry, concurrent update rejection, legacy preservation/import/conflict handling, backup download visibility, permission-save rollback/retry, and earlier role/mobile behavior.
- Syntax checks and responsive screenshot/overflow checks at 360, 390, 768, and 1365 pixels.
- No live test draft, notification, meeting, task, or backup record was inserted. Real data migration happens when an authorized account opens the upgraded app in the original browser/origin.

## Remaining Limits

- localStorage belongs to a specific browser/profile/origin. The server cannot collect records from another device, a closed browser, or an old localhost port automatically. That browser/origin must open the upgraded app and authenticate. Previously deleted/overwritten local data cannot be recreated by this feature.
- Business-cache snapshots are preserved for manual comparison, not blindly restored. This prevents stale task statuses, meetings, and permissions from replacing current live data.
- Legacy user credential caches are deliberately not uploaded. Actual users/passwords remain in MySQL; password recovery must use the normal authorized reset flow.
- Recovery is initiated by BA managers (superadmin/coordinator). Members do not gain draft or audit access.
- Existing audit/notification telemetry remains best effort; this is not an offline write queue or complete database backup system.
- No claim of live authenticated end-to-end testing or all historical browser data already migrated is made.
