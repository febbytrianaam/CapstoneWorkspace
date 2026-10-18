# Plan: Team Phase Access And Presence

Status: Implemented, 18 October 2026.

## Requested Behavior

- Show team access information in Tugas 1, 2, and 3 for members as well as managers.
- Display weekday, date, hour, minute, second, and WIB explicitly.
- Indicate whether a teammate is online.

## Approach

- Aggregate existing activity records by the selected phase and current user name. Do not expose the underlying activity history.
- Use existing `users.last_seen_at` for an approximate app-wide online indicator, refreshed by a visible-tab heartbeat.
- Preserve audit/history and user-management restrictions. Respect page permission for phase summaries.
- Add no tables, columns, migrations, historical backfill, or seed changes.
- Test with intercepted requests, synthetic members, and PDO doubles only. Never connect development tests to the live database.

## Acceptance

- Independent phase access timestamps, empty history states, complete WIB formatting, online/offline expiration, retry, and mobile layout.
- No task/modal rerender or input loss during presence refresh.
- API returns only identity/display fields and access/presence timestamps, never IP, device, NIM, username, or audit details.
