# Plan: Phase Progress Notes

## Summary

Add a visible progress note area above each phase board so admin can share WhatsApp-style progress updates inside the app.

## Goals

- Let admin/superadmin write freeform progress notes per phase.
- Preserve formatting exactly enough for copied updates.
- Show notes to members without exposing CRUD controls.
- Make the section collapsible.
- Provide a copy button.

## Non-Goals

- No rich text editor.
- No per-paragraph task conversion.
- No replacement for formal Berita Acara/notulensi.

## Implementation Details

- Store notes in `phase_progress_notes`.
- Render progress note panel above phase Kanban.
- Use textarea for admin input.
- Use read-only preview for members.
- Store collapse state in LocalStorage.

## Test Plan

- Save a note as admin.
- View note as member.
- Collapse/expand panel.
- Copy note text.
- Verify note persists after refresh.

## Acceptance Criteria

- Progress note is eye-catching above the board.
- Member can read but not edit.
- Admin can update and copy.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
