# AI Handoff

## Project Summary

Capstone Workspace is a PHP/MySQL coordination app for a Universitas Terbuka Capstone Project team. It tracks tasks, meetings, review flow, progress notes, documents, Berita Acara, users, RBAC, audit logs, and superadmin-only user activity logs.

## Current Stack

- PHP, no Laravel.
- MySQL via PDO.
- Frontend in PHP partials, CSS, and vanilla JavaScript.
- Chart.js and SweetAlert2 from CDN.
- Cloudflare Tunnel for public access.

## Current Architecture

- `index.php` renders the app shell and includes all page/modal partials.
- `js/app.js` controls UI rendering and interactions.
- `js/data.js` is the frontend data/API layer.
- `js/rbac.js` contains frontend permission behavior.
- `backend/api/index.php` is the API router and role gatekeeper.
- `backend/Repository.php` handles database operations.
- `database/schema.sql` and `database/migrations/` define schema changes.

## Current Constraints

- Not Laravel. Do not use Artisan.
- Preserve existing data and user changes.
- The database is live and used by team members. Do not execute migrations, seeds, reconciliation, SQL changes, or real mutation requests for testing without a new explicit request.
- Use the isolated tests in `tests/`. Even `Repository::create()` performs compatibility DDL, so do not run it as a live smoke check.
- On 18 October the owner explicitly approved adding only `berita_acara_drafts` and `browser_recovery_backups`; this narrow migration has been applied and verified. This is not blanket permission for other live DDL/DML or test records.
- The owner later separately approved migration 007 (`users.is_active`, default active) and one BA004-to-BA003 draft-number correction. Both are already applied and verified. These completed, scoped approvals do not authorize additional live mutations or automatic member deactivation.
- Preserve legacy browser work; BA import must never overwrite a conflicting server draft or merge stale task/cache records into live business tables. UI preferences remain local.
- Use port `4000` unless the owner says otherwise.
- Keep Cloudflare origin HTTP unless local TLS is explicitly configured.
- Do not expose Cloudflare tunnel tokens, passwords, private meeting links, or real data dumps.
- Superadmin-only audit/activity visibility is intentional.
- Members may see a minimal phase-access/presence summary in Tugas 1/2/3, not detailed audit records. Online is approximate app-wide presence, not presence within the selected phase.
- Member reviewer selection is read-only; superadmin sets reviewers manually.

## Key Files And Folders

- `index.php`
- `partials/pages/dashboard.php`
- `partials/pages/phase-placeholders.php`
- `partials/pages/documents.php`
- `partials/pages/audit.php`
- `partials/modals/task.php`
- `partials/modals/berita-acara.php`
- `js/app.js`
- `js/data.js`
- `js/rbac.js`
- `css/style.css`
- `backend/api/index.php`
- `backend/Repository.php`
- `backend/Database.php`
- `backend/config.php`
- `database/schema.sql`
- `database/migrations/`
- `database/seed_tugas2_tasks.php`

## Current Risks

- Isolated datastore and browser regression tests exist; real MySQL integration coverage is still missing.
- No CSRF protection yet.
- File uploads are stored in MySQL BLOBs.
- Some setup and deployment steps remain manual.
- Audit and activity logs store personal/device metadata.
- Existing docs include historical task reconciliation notes that should not be treated as automatic instructions to mutate data.

## Next Recommended Task

Add a small security-hardening plan and implement CSRF tokens for state-changing API calls. Keep it frameworkless and compatible with the existing session system.

## Things Not To Do Yet

- Do not redesign infrastructure.
- Do not run `php artisan serve`.
- Do not mass-delete or overwrite task data.
- Do not move old docs to archive unless the owner explicitly approves.
- Do not fabricate historical audit logs for old actions.
- Do not expose tokens or credentials in docs.

## Commands To Run

Run local server:

```bash
php -S localhost:4000
```

PHP syntax checks:

```bash
php -l index.php
php -l backend/api/index.php
php -l backend/Repository.php
```

JavaScript syntax checks:

```bash
node --check js/app.js
node --check js/data.js
node --check js/rbac.js
```

Safe datastore regression tests (no database):

```bash
node --test tests/store.test.cjs tests/rbac.test.cjs
```

Browser regression tests: `node tests/workspace-ui.cjs <playwright-module-path>`. Requires PHP, Playwright, and an installed Chrome browser. Every request is intercepted; do not replace the synthetic URL with the live application's URL.

BA print/naming: see `docs/30_implemented/2026-10-18-ba-print-layout-and-naming/`. Codes are persisted in existing draft JSON; do not mass-renumber or count manual/draft copies twice. A single owner-approved BA004-to-BA003 correction has already been applied and verified; do not rerun it. Print regression includes synthetic long notes and multiple photo orientations, without live writes.

Member account status: see `docs/30_implemented/2026-10-18-member-account-status/`. Deactivation preserves historical assignments/documents and only removes the account from current roster/assignment choices; do not delete their tasks or alter PDFs. The owner approved adding `users.is_active`, not automatically deactivating any specific person. Status controls are superadmin-only.

Migration 007 has been applied and verified on 18 October 2026. All five accounts remained active. Do not rerun the full schema or deactivate a member as a test. Reopening a BA refreshes the active user directory; already archived PDFs and manual activity notes are not rewritten.
