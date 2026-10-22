# Testing Strategy

## Current Test Status

The repo has isolated datastore tests and a Playwright browser regression script.

Tests use synthetic records and intercepted API requests. The owner has prohibited changes to the live database. Do not run database/API mutations or repository initialization as smoke tests.

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
node --check js/task-reports.js
node --check js/task-reports-ui.js
```

Datastore tests (no database or network):

```bash
node --test tests/store.test.cjs tests/rbac.test.cjs
node --test tests/action-queues.test.cjs
node --test tests/task-reports.test.cjs
php tests/task-report.test.php
```

Storage/account contracts with PDO doubles only: `php tests/ba-storage.test.php`, `php tests/phase-access.test.php`, and `php tests/user-status.test.php`. They never connect to MySQL.

The owner approved the two-table BA/recovery migration and, separately, migration 007 adding the active-account status column on 18 October 2026. Both have been applied and verified. The owner also authorized one draft-number correction, already completed. None of these approvals permits live test records, further migrations, or the full schema/seed file.

Browser tests: `node tests/workspace-ui.cjs <playwright-module-path>`. The optional module path locates an existing Playwright install; omit it when Playwright resolves normally. PHP and installed Chrome are required. All browser requests, including API calls, are intercepted. Screenshots are saved in an OS temporary folder, not in the live document archive.

Coverage includes server-rejected saves, task deltas/review submission, dirty forms, fast-snapshot startup, role-specific action queues, task/document filters, lazy audit data, refresh failure/retry, BA state, and desktop/mobile layouts. These tests do not prove real MySQL persistence or public Cloudflare behavior.

Report coverage includes phase/filter/archive/empty states, latest-server export values, actual XLSX roundtrip and formula-injection protection, full print/PDF generation, popup-blocked and retry states, mobile overflow, and no business writes. The real API router is exercised in subprocesses with a fake Repository and synthetic session; it never initializes or connects to MySQL. Separate PDO-double tests validate the actual report queries and deny unauthorized roles before querying.

Mobile navigation regression: `node tests/mobile-navigation.cjs <playwright-module-path>`. Touch-enabled mobile contexts test widths 360/390/412px, member/superadmin roles, persisted Kanban/list preferences, and sidebar navigation across Tugas 1/2/3 with long unbroken text. Assert both document/layout width and visual viewport scale; viewport resizing alone is insufficient to catch mobile shrink-to-fit bugs. Requests are fully intercepted.

Latest mobile navigation result: all 36 phase transitions across 12 mobile contexts passed on 22 October 2026, in addition to the 32 Node tests and 25 main browser scenario groups below. No live database requests or business mutations were used.

Latest verified baseline: 32 Node tests; PHP BA-storage, phase-access, account-status, and task-report contracts; 25 mocked browser scenario groups at widths 360/390/768/1365px. Synthetic native Chrome BA PDFs also passed five-page long-table and seven-page documentation layout checks, retaining all 36 long-note paragraphs and both photos. Account status tests never deactivate real members. Action queues and review-card highlights additionally cover own waiting versus assigned reviews, preview expansion, dark mode, focus, unchanged readonly/drag permissions, and reduced-motion suppression of bounded indicator pulses. Revision notes/status are verified in action rows and Kanban/list views, including opening the existing modal review panel from each. Reports add authenticated fixed-role API checks, real XLSX roundtrip, fresh-data export, and browser-generated A4 PDF checks.

HTTP smoke check when server is running:

```bash
curl http://localhost:4000
```

## Manual QA Checklist

Synthetic native print regression (no live API/database):

```bash
node tests/ba-print.cjs <playwright-module-path>
python tests/check-ba-print.py <generated-directory>/ba-print.pdf
python tests/check-ba-print.py <generated-directory>/docs-print.pdf
php tests/ba-storage.test.php
php tests/user-status.test.php
```

Requires Chrome, Playwright, pdfplumber, and pypdfium2. Check rendered page PNGs, documentation heading/photo placement, and long-row border closure.

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
- Verify own submitted tasks appear under Tugas saya menunggu review, not Perlu saya review. Personal reviews require the assigned reviewer, including for superadmin; broader management remains in the existing review section.
- Verify action-preview expansion, keyboard focus, light/dark layout, and disabled pulse under reduced-motion settings.
- Verify the progress summary precedes Akses Terakhir Tim in phase views; intercepted browser navigation asserts their DOM order.
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
