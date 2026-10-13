# Plan: Document Archive Management

## Summary

Improve Arsip Dokumen so it can store mixed document types, support manual BA files, and remain readable on desktop and mobile.

## Goals

- Add document categories beyond Berita Acara.
- Support view and download for archived files.
- Allow superadmin to edit archive metadata.
- Keep member access limited to view/download.
- Improve card layout and action controls.
- Support meeting-linked manual BA uploads.

## Non-Goals

- No cloud storage integration.
- No document OCR.
- No collaborative editing inside uploaded documents.

## Implementation Details

- Store documents in `document_archives`.
- Add categories such as dokumen and poster.
- Add metadata edit API and UI.
- Use a compact list/card layout with a three-dot management menu for admin actions.
- Keep bottom actions focused on `Lihat` and `Download`.

## Test Plan

- Upload PDF, document, and image-like archive types within supported extensions.
- Filter by category.
- View and download as member.
- Edit and delete as superadmin.
- Verify manual BA can appear in archive and related meeting context.

## Acceptance Criteria

- Archive is understandable for members.
- Superadmin can manage metadata without reuploading.
- Member cannot edit/delete.
- Cards align cleanly without inconsistent button sizing.

## Assumptions

- This plan is reconstructed from current code and commit history.
