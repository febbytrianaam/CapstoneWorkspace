# Plan: Berita Acara Archive Workflow

## Summary

Support meeting Berita Acara workflows for generated and manually uploaded meeting evidence.

## Goals

- Generate Berita Acara from meeting data.
- Allow attendance selection and activity rows.
- Preview Berita Acara before printing/saving.
- Support manual BA upload for meetings that already have signed documents.
- Connect BA documents to meeting cards and the document archive.

## Non-Goals

- No server-side PDF generation.
- No digital signature workflow.
- No permanent legal document validation.

## Implementation Details

- Use a modal form for Berita Acara data entry.
- Dismiss on backdrop click only when the pointer also started on the backdrop, so text selection cannot close the form.
- Build preview HTML in a new browser tab.
- Use browser print/save-to-PDF for final output.
- Store manual BA uploads through the document archive API.
- Mark meetings that already have BA evidence.

## Test Plan

- Open a meeting and generate BA.
- Delete and replace the title; drag a text selection outside the dialog without closing it.
- Preview in a new tab.
- Print/save from browser.
- Upload a manual BA and verify it appears in archive and meeting context.

## Acceptance Criteria

- Admin can create or upload BA evidence.
- Member can view/download archived BA where allowed.
- Meetings with BA evidence are protected from accidental deletion.

## Assumptions

- This plan is reconstructed from current implementation and commit history.
