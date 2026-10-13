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
- Use port `4000` unless the owner says otherwise.
- Keep Cloudflare origin HTTP unless local TLS is explicitly configured.
- Do not expose Cloudflare tunnel tokens, passwords, private meeting links, or real data dumps.
- Superadmin-only audit/activity visibility is intentional.
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

- No automated tests.
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

Initialize repository/database compatibility checks:

```bash
php -r "require 'backend/Repository.php'; Repository::create(); echo 'ok';"
```
