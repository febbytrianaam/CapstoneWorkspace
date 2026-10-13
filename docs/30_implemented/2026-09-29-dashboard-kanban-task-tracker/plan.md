# Plan: Dashboard And Kanban Task Tracker

## Summary

Build the main task tracking experience for Tugas 1, Tugas 2, and Tugas 3 using dashboard summaries and phase-based Kanban boards.

## Goals

- Show project status on the dashboard.
- Show personal assigned tasks.
- Show phase progress and workload summaries.
- Render Kanban columns by task status.
- Support task details, checklist, PIC, priority, dates, and archive metadata.

## Non-Goals

- No drag-and-drop library dependency.
- No external task manager integration.
- No automated dependency graph UI.

## Implementation Details

- Render dashboard from task and user data in `js/app.js`.
- Render phase pages from `partials/pages/phase-placeholders.php`.
- Use task cards and modal detail editor.
- Keep completed/archive behavior role-aware.

## Test Plan

- Verify dashboard loads after login.
- Verify task cards appear in the correct phase/status columns.
- Verify task modal opens.
- Verify member read-only restrictions for non-PIC tasks.
- Verify superadmin can manage task structure.

## Acceptance Criteria

- Team can track work across Tugas 1, Tugas 2, and Tugas 3.
- Members can understand assigned work quickly.
- Superadmin can manage the task board.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
