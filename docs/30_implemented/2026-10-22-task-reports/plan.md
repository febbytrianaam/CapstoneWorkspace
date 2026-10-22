# Phase Task Reports

## Scope

- Provide superadmin-only Laporan Tugas, separate from audit/activity logs, with shortcuts from Tugas 1/2/3.
- Read the current phase from the server; support PIC, task status, review status, and active/all/archived filters independently of Kanban filters.
- Share one filtered report model between the screen, real XLSX download, and a new-tab printable PDF preview.
- Include task identifiers, assignments, progress/checklist, review notes, deliverables, dates in WIB, archive markers, and the phase progress note.
- Keep Excel summary, task detail, and individual checklist rows in separate sheets at their respective levels of detail.

## Boundaries

- No migration, seed, reconciliation, task update, review action, or new business-data storage.
- Enforce the fixed superadmin role in UI and API; honor revoked task-read and selected-phase permissions server-side.
- Use a locally served pinned Excel writer; do not send task contents to a CDN or conversion service.
- Test only synthetic records with intercepted browser requests, fake repository routing, and PDO doubles.
