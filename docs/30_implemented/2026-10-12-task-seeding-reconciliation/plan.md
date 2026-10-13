# Plan: Task Seeding And Reconciliation

## Summary

Seed and reconcile Capstone task data so the app reflects actual Tugas 1 and Tugas 2 work without creating unnecessary duplicates.

## Goals

- Add baseline tasks for Tugas 1 and Tugas 2.
- Preserve existing meetings and document evidence.
- Compare handoff task lists against existing app data before input.
- Document dry-run reconciliation findings.
- Avoid duplicate or misleading historical tasks.

## Non-Goals

- Do not blindly import every Notion/task handoff item.
- Do not fabricate audit logs for historical actions.
- Do not mark tasks done without evidence.

## Implementation Details

- Use PHP seed/reconciliation scripts in `database/`.
- Keep dry-run reports in `docs/`.
- Prefer update/enrich over duplicate task creation.
- Keep Anggi-related historical assignments neutral when evidence is incomplete.

## Test Plan

- Run seed scripts only when intended.
- Review generated tasks in app.
- Verify counts by phase/status.
- Compare with dry-run reports before mutating data.

## Acceptance Criteria

- Tugas 1 and Tugas 2 data are meaningful and non-redundant.
- Historical ambiguity is documented.
- Existing evidence such as meetings and archives remains intact.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
