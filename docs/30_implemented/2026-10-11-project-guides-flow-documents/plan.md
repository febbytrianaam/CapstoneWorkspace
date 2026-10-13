# Plan: Project Guides And Flow Documents

## Summary

Add an Alur Kerja area for shared project guide documents such as Capstone guidelines, KARIL guidelines, diagrams, and reference files.

## Goals

- Let admin upload project guide files.
- Let team members preview/download guidance files.
- Keep Alur Kerja focused on process/reference material.
- Avoid hardcoding only one document type.

## Non-Goals

- No full document archive replacement.
- No collaborative document editing.
- No cloud drive integration.

## Implementation Details

- Use `project_guides` table.
- Add upload form in `partials/pages/flow.php`.
- Render guide cards in `js/app.js`.
- Serve guide previews/downloads through backend endpoints.

## Test Plan

- Upload a supported guide file.
- Preview guide.
- Delete guide as allowed role.
- Verify member can read but not delete.

## Acceptance Criteria

- Team can access current project guidance from the app.
- Upload/delete permissions respect role rules.
- Guide cards are readable.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
