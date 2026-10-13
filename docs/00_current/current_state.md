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
- Tugas 1, Tugas 2, and Tugas 3 phase views.
- Dashboard summaries, personal task section, review queue, meetings, workload, charts.
- Kanban task board with status, PIC, reviewer, review workflow, checklist, dates, archive behavior.
- Phase progress notes with admin input and member read-only visibility.
- Project guide uploads in Alur Kerja.
- Arsip Dokumen with category filter, upload, edit metadata, view, download, and delete.
- Berita Acara form, preview in new tab, printable portrait output, manual BA upload linked to meetings.
- Superadmin-only audit and user activity visibility.

## What Does Not Exist Yet

- Automated test suite.
- CI/CD pipeline.
- Formal migration runner.
- Formal backup/restore workflow.
- Rate limiting.
- CSRF token validation.
- Granular file virus scanning.
- Automated PHP server startup for the current local server.
- Dated implementation history folders under `docs/30_implemented/`.

## Current Limitations

- The app is frameworkless PHP, so routing and permission handling are centralized in one API file.
- Frontend logic is large and concentrated in `js/app.js`.
- Database migrations exist as SQL files, but `Repository::create()` also performs some defensive `CREATE TABLE` and `ALTER TABLE` checks.
- Some historical project data is maintained through ad hoc seed/reconciliation scripts.
- File uploads are stored as BLOBs in MySQL, which is simple but can grow the database quickly.
- Local/offline fallback code still exists in `js/data.js`, but the current app is intended to use backend data.

## Current Risks

- Secrets and real personal/project data must not be committed or documented.
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
