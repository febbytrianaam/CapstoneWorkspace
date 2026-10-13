# Implementation Report: Project Guides And Flow Documents

## What Shipped

Project guide upload, preview, download, and delete behavior shipped in the Alur Kerja menu.

## What Changed From The Plan

General document archiving later moved to Arsip Dokumen so Alur Kerja can stay focused on reusable guides.

## Files/Modules Changed

- `partials/pages/flow.php`
- `js/app.js`
- `js/data.js`
- `css/style.css`
- `backend/api/index.php`
- `backend/Repository.php`
- `backend/guide-preview.php`
- `database/schema.sql`

## Tests Run

Historical test record is incomplete.

## Manual QA

- User feedback clarified that final/signed BA and other document types should also appear in Arsip Dokumen, not only in task/phase UI.

## Known Limitations

- No file versioning.
- File storage is in MySQL.

## Follow-Up Ideas

- Add tags or sections if the number of guide files grows.

## Rollback Notes

Export guide files before removing the `project_guides` feature.

## Date Completed

2026-10-11
