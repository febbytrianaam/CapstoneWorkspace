# Plan: Team Workflow Improvements

## Scope

Implement the eight recommendations accepted on 17 October 2026: personal action queues, clearer review next steps, task-code search and review filters, Kanban/list views, archive search/sort, form protection, explicit data refresh, and lazy audit loading.

## Constraints

- The workspace is live. Do not execute SQL, migrations, seeders, repository initialization, or test API requests against the live database.
- Preserve existing tables, records, assignments, reviews, and timestamps. No backfill or data normalization.
- Use existing fields and endpoints. Keep permissions and reviewer ownership intact.
- Test against synthetic data with every browser request intercepted.

## Implementation

1. Await server confirmation for business mutations and send task deltas instead of cached task/meeting objects.
2. Initialize date constants before controls that format snapshot data; preserve form input on failed requests.
3. Add phase action queues, contextual review guidance, task-code search, reset/review filters, and a persistent view preference.
4. Add archive text search and date/name/category sorting over existing metadata.
5. Guard unsaved input, improve keyboard focus and modal dismissal, and retain drafts/inputs on errors.
6. Add manual refresh with a last-sync indicator and guard it while forms are dirty or saving.
7. Let the app request snapshots without logs; fetch audit/activity data only when the superadmin opens Audit.

## Acceptance

- Rejected saves do not close forms or change local business data.
- Review submission includes current checklist values; later edits never replay a review command.
- Role-specific queues and list/board views use the same tasks and permissions.
- Mobile layouts fit 360, 390, and 768 pixel widths; desktop is checked at 1365 pixels.
- Audit GET requests are absent during ordinary startup and occur when Audit is opened.
- No schema/migration files change and no live database is accessed by tests.
