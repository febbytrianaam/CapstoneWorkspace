# Plan: Workflow Polish

## Summary

Improve Capstone Workspace from a basic tracker into a more complete team workflow interface.

## Goals

- Improve task, meeting, dashboard, and audit workflows.
- Make Tugas phase views more usable.
- Support project coordination patterns from the team.
- Keep the app lightweight and frameworkless.

## Non-Goals

- Do not migrate to Laravel.
- Do not redesign infrastructure.
- Do not create a separate production deployment stack.

## Implementation Details

- Extend frontend rendering in `js/app.js`.
- Keep task and meeting behavior integrated with the existing app shell.
- Continue using PHP partials and MySQL-backed repository logic.

## Test Plan

- Run syntax checks for touched PHP and JS files.
- Manually verify dashboard, task, and meeting views.
- Manually verify audit entries for important changes.

## Acceptance Criteria

- The workspace supports realistic Capstone coordination.
- Users can navigate between dashboard and task phase views.
- Important changes are visible through audit behavior.

## Assumptions

- This plan is reconstructed from git commit history and current feature state.
