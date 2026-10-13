# Testing Strategy

## Current Test Status

There is no formal automated test suite in the repo at this time.

Current practical checks are syntax checks, manual browser QA, and database/API smoke tests.

## Commands

Run the app locally:

```bash
php -S localhost:4000
```

PHP syntax checks:

```bash
php -l index.php
php -l backend/api/index.php
php -l backend/Repository.php
php -l partials/pages/audit.php
```

JavaScript syntax checks:

```bash
node --check js/app.js
node --check js/data.js
node --check js/rbac.js
```

Database/repository smoke check:

```bash
php -r "require 'backend/Repository.php'; Repository::create(); echo 'ok';"
```

HTTP smoke check when server is running:

```bash
curl http://localhost:4000
```

## Manual QA Checklist

- Login as superadmin.
- Login as member.
- Verify dashboard loads data immediately after login without manual refresh.
- Verify member only sees allowed menus.
- Verify superadmin can open Audit and see Aktivitas Pengguna.
- Verify member cannot open Audit.
- Verify task detail modal scrolls on mobile.
- Verify PIC can update own task status/checklist.
- Verify non-PIC sees read-only task status/checklist.
- Verify reviewer cannot be changed by member.
- Verify review submit, cancel, approve, and request revision flows.
- Verify completed tasks do not appear in dashboard personal active task list.
- Verify Arsip Dokumen view/download/edit/delete according to role.
- Verify Berita Acara preview opens in a new tab and prints portrait.
- Verify mobile layout for notification dropdown, sidebar, task board, and document cards.

## What Should Be Tested Before Release

- Authentication and password change.
- Session expiration and logout.
- RBAC enforcement in backend, not just UI.
- File upload size and extension validation.
- Document view/download permissions.
- Task review workflow.
- Archive and restore behavior.
- Audit/activity logging behavior.
- Cloudflare public URL behavior with local PHP server running.

## Dangerous Commands To Avoid

- Do not run `git reset --hard` unless explicitly requested.
- Do not delete database rows in bulk without a backup.
- Do not run destructive SQL against production data without explicit approval.
- Do not commit database dumps containing real data or password hashes.
- Do not expose Cloudflare tunnel tokens in docs, code, screenshots, or logs.
