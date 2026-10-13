# Plan: Task Review And Member Dashboard

## Summary

Improve task workflow so members can work on assigned tasks, request review, and avoid clutter from completed work.

## Goals

- Add reviewer assignment and review status.
- Let PIC submit and cancel review requests.
- Let reviewer/superadmin approve or request revision.
- Keep reviewer selection read-only for members.
- Show member task focus on dashboard.
- Hide completed tasks from the active personal task section.
- Improve mobile modal and Kanban usability.

## Non-Goals

- No complex approval chain.
- No email/WhatsApp notification integration.
- No automatic reviewer assignment.

## Implementation Details

- Extend task data with reviewer, review status, submitted/reviewed timestamps, review note, and deliverable URL.
- Add backend validation for review actions.
- Add dashboard review queue and phase review queue.
- Keep superadmin responsible for reviewer setup.

## Test Plan

- Login as member PIC and submit review.
- Cancel submitted review.
- Login as reviewer/superadmin and approve/request revision.
- Confirm member cannot change reviewer.
- Confirm completed tasks do not show in active assigned task list.
- Check mobile task modal scrolling.

## Acceptance Criteria

- Review status is visible on task cards and detail modal.
- Member can only update allowed progress and review actions.
- Superadmin can manage reviewer and structure fields.
- Dashboard remains focused and not overly long.

## Assumptions

- This plan is reconstructed from current code and user-driven iteration.
