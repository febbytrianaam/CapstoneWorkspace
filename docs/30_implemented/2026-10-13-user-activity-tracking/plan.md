# Plan: Superadmin User Activity Tracking

## Summary

Add a superadmin-only view of user activity separate from audit logs, so the owner can understand which menus and important actions users interact with.

## Goals

- Track login/logout.
- Track menu opens.
- Track task detail opens.
- Track review actions.
- Track document view/download and guide preview actions.
- Keep visibility limited to superadmin.
- Keep members and koordinator able to submit activity but unable to read it.

## Non-Goals

- No analytics dashboard.
- No behavioral scoring.
- No tracking of every keystroke or field edit.
- No member-visible activity history.

## Implementation Details

- Add `user_activity_logs` table and migration.
- Add backend `user-activities` GET/POST resource.
- Include activity data in snapshot only for superadmin.
- Add frontend logging helper in `js/app.js`.
- Add `getUserActivities()` and `logUserActivity()` in `js/data.js`.
- Add `Aktivitas Pengguna` section on the audit page.
- Force audit page visibility to superadmin only in frontend and backend.

## Test Plan

- Run PHP and JS syntax checks.
- Run `Repository::create()` to ensure table creation.
- Smoke test `http://localhost:4000`.
- Login and navigate as different roles.
- Confirm superadmin can see activity section.
- Confirm member cannot open audit page.

## Acceptance Criteria

- Activity records are stored in MySQL.
- Superadmin sees filtered activity table.
- Koordinator/member cannot fetch activity logs.
- Existing audit log remains focused on data changes.

## Assumptions

- Activity logging is acceptable for this team workspace when visible only to superadmin.
