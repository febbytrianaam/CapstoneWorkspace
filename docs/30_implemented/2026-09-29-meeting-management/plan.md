# Plan: Meeting Management

## Summary

Add meeting and agenda management for Capstone coordination.

## Goals

- Store meeting records.
- Link meetings to tasks/phases when relevant.
- Show meeting schedule on dashboard and phase pages.
- Support creating, editing, deleting, and marking meetings with Berita Acara evidence.

## Non-Goals

- No calendar integration.
- No automatic Teams/Google Meet API sync.
- No email invitations.

## Implementation Details

- Use `meetings` table.
- Add meeting modal UI.
- Render dashboard meeting cards and phase meeting cards.
- Prevent unsafe deletion when BA evidence exists.

## Test Plan

- Create a meeting.
- Edit meeting details.
- Delete a meeting without BA.
- Confirm meeting with BA is protected.
- Verify member visibility according to role rules.

## Acceptance Criteria

- Team meetings can be tracked in the app.
- BA-related meetings are not accidentally lost.
- Meeting information remains connected to task context where available.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
