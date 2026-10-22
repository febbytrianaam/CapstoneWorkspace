# Current State

## What Exists Now

- PHP entrypoint: `index.php`.
- Frontend: HTML/PHP partials, `css/style.css`, `js/app.js`, `js/data.js`, `js/rbac.js`.
- Backend API: `backend/api/index.php`.
- Data access: `backend/Repository.php` with PDO/MySQL via `backend/Database.php`.
- Database schema: `database/schema.sql`.
- Incremental migrations in `database/migrations/`.
- Existing seed and reconciliation scripts in `database/`.
- Login/logout, session cookies, role checks, task CRUD, user CRUD, RBAC, notifications, audit logs, user activity logs.
- Superadmin-only account deactivation/reactivation preserves history, prevents login/new assignments, and excludes inactive accounts from the generated BA roster and current presence/workload. All active members attending produces `-` in the absent column. See [member status](../30_implemented/2026-10-18-member-account-status/implementation_report.md).
- Tugas 1, Tugas 2, and Tugas 3 phase views.
- Mobile phase navigation keeps Kanban columns within the screen even with long unbroken text and a saved Kanban preference; list mode and user-controlled browser zoom remain available.
- Dashboard summaries, personal task section, review queue, meetings, workload, charts.
- Kanban task board with status, PIC, reviewer, review workflow, checklist, dates, archive behavior.
- Phase progress notes with admin input and member read-only visibility.
- In Tugas 1/2/3, the progress summary appears directly below the phase banner and above Akses Terakhir Tim; note content, collapse behavior, and permissions are unchanged.
- Project guide uploads in Alur Kerja.
- Arsip Dokumen with category filter, upload, edit metadata, view, download, and delete.
- Berita Acara form, preview in new tab, printable portrait output, manual BA upload linked to meetings.
- Superadmin-only audit and user activity visibility.
- Superadmin-only Laporan Tugas, separate from audit logs, with phase/PIC/status/review/archive filters, latest-server-data Excel exports (Ringkasan, Tugas, Subtugas), and new-tab print/PDF previews. Phase shortcuts open the matching report; downloads are local, not saved automatically to Arsip Dokumen. See [reports](../30_implemented/2026-10-22-task-reports/implementation_report.md).
- Phase action queues, contextual task next steps, task-code search and review filters, Kanban/list modes, archive search/sort, protected forms, explicit refresh status, and lazy audit loading.
- Tindak Lanjut now distinguishes own active work, revisions, assigned personal reviews, and own submissions waiting for review. Colored counts, brief reduced-motion-aware highlights, checklist ratios, and expandable previews provide a clearer daily work surface without changing task data or permissions.
- Kanban/list cards use teal Perlu kamu review, amber Menunggu review, or rose Perlu revisi, with contextual names, dark-mode colors, and a short reduced-motion-aware indicator pulse. Tindak Lanjut rows also show review status, reviewer, note excerpts, and Lihat catatan review; notes can be opened from queues or either board view. Archive and task permissions are unchanged.
- Datastore mutations await server confirmation before updating local business state; task edits send deltas instead of meeting snapshots.
- Isolated tests in `tests/store.test.cjs` and `tests/workspace-ui.cjs`.
- Tugas 1/2/3 show team phase access with full WIB timestamps and approximate app-wide Online/Offline presence. Members receive only the minimal summary, not audit history or account management.
- The PDO-double contract test `php tests/phase-access.test.php` requires no database.
- BA drafts now persist in MySQL by meeting with revision checks, including attendance, activity cells, and photos. Browser copies are backed up before non-overwriting import; superadmin can download legacy backups from Audit.
- Two additive storage tables were created with explicit owner approval on 18 October 2026. Existing business records were not altered. See the server-BA-drafts implementation report for scope and storage inventory.
- Migration 007 was separately approved and applied on 18 October 2026, adding only `users.is_active` with default 1. All five accounts remained active at verification; no real account was deactivated by implementation/testing. One separately authorized BA004-to-BA003 draft-number correction is complete; other draft content was preserved.

## What Does Not Exist Yet

- CI/CD pipeline.
- Formal migration runner.
- Formal backup/restore workflow.
- Rate limiting.
- CSRF token validation.
- Granular file virus scanning.
- Automated PHP server startup for the current local server.

## BA Print And Filenames

- BA PDFs use thin closed table borders and keep the documentation heading with its first photo. Default PDF names use fixed `01.`, a server-persisted global BA code, and the BA date. Existing manual filenames are unchanged; see [implementation](../30_implemented/2026-10-18-ba-print-layout-and-naming/implementation_report.md).

## Current Limitations

- The app is frameworkless PHP, so routing and permission handling are centralized in one API file.
- Frontend logic is large and concentrated in `js/app.js`.
- Database migrations exist as SQL files, but `Repository::create()` also performs some defensive `CREATE TABLE` and `ALTER TABLE` checks.
- Some historical project data is maintained through ad hoc seed/reconciliation scripts.
- File uploads are stored as BLOBs in MySQL, which is simple but can grow the database quickly.
- Local/offline fallback code still exists in `js/data.js`, but the current app is intended to use backend data.

## Current Risks

- Secrets and real personal/project data must not be committed or documented.
- The live database must not be changed by development tests, seeds, migrations, or repository smoke checks without a new explicit request.
- Remaining issues from the 17 October audit are documented separately; the workflow improvements do not resolve every production-readiness finding.
- Cloudflare Tunnel token was previously exposed in chat and should be rotated if not already done.
- Without CSRF protection, same-origin session endpoints need careful deployment assumptions.
- Large uploaded files can increase database size.
- Manual PHP server startup can make the public URL fail even when Cloudflare Tunnel is healthy.
- Audit/activity logs may contain personal data, IP address, and user agent strings.

## Known Setup And Deployment State

- Local run command currently used by the owner: `php -S localhost:4000`.
- Earlier deployment handoff used `localhost:8099`, but the owner later stated port `4000` is being used.
- Public deployment has been through Cloudflare Tunnel and custom domain `https://capstone.nexspace.my.id`.
- The app is not Laravel. Do not run `php artisan serve`.
- The app depends on MySQL database `capstone_workspace` by default.

## Next Best Step

Do a production-readiness pass focused on:

1. Confirm database migrations and real data backup.
2. Verify all user roles on mobile and desktop.
3. Add CSRF protection for state-changing endpoints.
4. Document the exact run/deploy procedure for the current port and Cloudflare route.
5. Start implementation history records for recently shipped features.
