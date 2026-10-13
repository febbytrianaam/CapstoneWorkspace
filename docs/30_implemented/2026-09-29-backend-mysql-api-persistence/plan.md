# Plan: Backend MySQL API Persistence

## Summary

Move the workspace from prototype-only data behavior toward persistent backend data using PHP, PDO, and MySQL.

## Goals

- Add a lightweight PHP API layer.
- Store users, tasks, meetings, checklist items, notifications, audit logs, progress notes, guides, and archives in MySQL.
- Keep the app frameworkless and easy to run locally.
- Preserve a local/offline fallback path in frontend data code where practical.

## Non-Goals

- Do not introduce Laravel.
- Do not add Composer dependency management.
- Do not build a complex migration framework.

## Implementation Details

- Use `backend/api/index.php` as the API router.
- Use `backend/Repository.php` as the data-access layer.
- Use `backend/Database.php` and `backend/config.php` for PDO connection.
- Use `database/schema.sql` for base schema.
- Add small SQL migration files for incremental schema changes.

## Test Plan

- Run PHP lint on backend files.
- Run `Repository::create()` to verify database connection and defensive table/column setup.
- Smoke test `GET resource=snapshot` after login.

## Acceptance Criteria

- Runtime data survives page refresh.
- Backend endpoints return JSON.
- Main app functions no longer rely only on hardcoded browser state.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
