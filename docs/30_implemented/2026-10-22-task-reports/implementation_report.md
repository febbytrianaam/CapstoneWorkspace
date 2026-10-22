# Phase Task Reports

## Delivered

- Laporan Tugas is a separate, fixed-superadmin menu, with phase shortcuts next to Salin Tugas. Members and coordinators cannot open it even if a browser permission cache is modified.
- A dedicated GET `task-reports&phase=tugas1|tugas2|tugas3` authenticates the session, enforces superadmin, checks task-read/phase permission overrides, validates the phase, and sets no-store. Other methods are rejected. Repository reports read only the phase's tasks, checklist items, and progress note, without meeting, audit, activity, notification, account, or file records.
- Filters cover PIC (including historical assignees), work status, review status, and archive scope. Default is unarchived tasks. These filters do not reuse or change Kanban filters. Summary totals always reflect the selected report rows.
- Completion follows the existing verified-completion rule, not checklist completion alone. Checklist counts are bounded by actual items. Empty selections remain valid reports with zero totals.
- Each refresh or export fetches a fresh report response. Screen, XLSX, and print use the same model, filters, server timestamp, and WIB formatting. This is a current-state report, not a historical audit report. Multi-query reads are not a transactionally locked historical snapshot.
- XLSX has Ringkasan, Tugas, and Subtugas sheets; formula-backed summaries with cached results, frozen headings, column filters, wrapped text, and numeric checklist percentages. All task fields and checklist text are retained, including newlines; user strings cannot become spreadsheet formulas. Oversized Excel cells fail explicitly and recommend the full PDF preview rather than silently truncating text.
- Preview opens a new tab synchronously, then renders an A4 landscape report with summary, task table, phase note, full task details, and checklists. Cetak / Simpan PDF opens the browser print workflow; no automatic PDF download. HTML is escaped, links allow HTTP(S) only, headers repeat when printed, and long detail content may paginate.
- Explicit loading/error/retry and popup-blocked messages avoid silent blank previews. Export failures do not fall back to stale downloaded data. Session changes invalidate pending report work. Generated files stay on the user's device and are not automatically uploaded to Arsip Dokumen.
- ExcelJS 4.4.0 is vendored with its MIT license and is lazy-loaded for Excel only. No spreadsheet generation service receives task data.
- Mobile filters and actions wrap, report tables scroll within their own area, and the phase shortcut toolbar also wraps. Existing review highlighting remains intact.

## Files

- `partials/pages/reports.php`, `js/task-reports.js`, `js/task-reports-ui.js`
- `js/vendor/exceljs-4.4.0.min.js`, `js/vendor/exceljs.LICENSE`, `js/vendor/README.md`
- App shell/sidebar, RBAC/navigation hooks, styles, and read-only Repository/API report path.
- `tests/task-reports.test.cjs`, `tests/task-report.test.php`, `tests/task-report-router-fixture.php`, and extended RBAC/browser regressions.

## Safety And Limits

Verified on 22 October 2026: 32 Node tests, four PHP contract suites, and 25 intercepted browser scenario groups passed. UI widths 360/390/768/1365px were checked without document overflow, including phase shortcuts. XLSX downloads were reopened to verify fresh task titles, full data, formula safety, and summary results. A native Chrome A4 landscape PDF retained all five synthetic task/checklist sections across six nonblank pages; every page and the desktop/mobile report screenshots were visually inspected. PHP/JavaScript syntax and whitespace checks passed. A localhost:4000 shell-only HTTP check returned 200 without executing live API requests.

No live database changes or tests were performed for this feature. Ordinary application navigation/click/presence telemetry remains as before; the report path introduces no business mutations or schema setup. Repository initialization elsewhere still has existing compatibility DDL, so never use real `Repository::create()` as a test harness.

Downloaded reports contain team/project information and must be shared intentionally. Existing downloads/preview contents cannot be remotely revoked after creation. Browser printing depends on the user's print settings; public Cloudflare behavior and real MySQL integration are not certified by mocked tests.
