# Plan: Notifications And Audit Log

## Summary

Add lightweight in-app notifications and an audit trail for important data changes.

## Goals

- Show topbar notifications.
- Track task/user/meeting/document changes in audit logs.
- Allow superadmin to inspect and export/print audit history.
- Keep audit logs focused on data changes, not every UI interaction.

## Non-Goals

- No push notifications.
- No email notification integration.
- No full analytics tracking.

## Implementation Details

- Store notifications in `notifications`.
- Store audit events in `audit_logs`.
- Render notification dropdown in the topbar.
- Render audit page with filters, KPI cards, export, print, and clear controls.

## Test Plan

- Trigger task changes and verify audit entries.
- Verify notifications render in topbar.
- Verify mobile notification dropdown is readable.
- Verify member cannot access audit page.

## Acceptance Criteria

- Important changes are traceable.
- Topbar notifications are useful but not visually broken.
- Audit visibility is restricted.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
