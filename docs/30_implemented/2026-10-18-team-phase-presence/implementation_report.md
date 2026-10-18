# Implementation: Team Phase Access And Presence

Date: 18 October 2026.

## Delivered

- A compact Akses Terakhir Tim section above phase notes in Tugas 1, 2, and 3, visible to anyone who can access that phase.
- Per-member phase access timestamp, including Indonesian weekday, date, hours, minutes, seconds, and explicit WIB.
- Online/Offline status for the app, separate from phase access. A foreground authenticated client sends a heartbeat every 30 seconds; online expires after 90 seconds without a signal. This is approximate presence, not proof that someone is currently viewing the same phase or working.
- Refresh control, loading/error/retry, and unknown access state. Returning to a phase records the existing menu activity, including the initially restored page.
- Presence updates replace only their own section; they do not replace the task board, filters, or open forms.

## API And Storage

- `GET resource=phase-access&phase=tugas1|tugas2|tugas3` requires authentication and permits only a phase allowed by the role's page permission. Returns `members` and `serverTime`.
- Each member contains only `id`, `name`, `initial`, `lastSeenAt`, and `lastAccessAt`. Detailed logs, IP, device, NIM, credentials, and account administration are not shared.
- The summary aggregates `MAX(occurred_at)` from existing `user_activity_logs` for the selected `page_name`, then joins current users. It is not limited to the 500-record audit UI window.
- Grouping and name joins explicitly use `utf8mb4_unicode_ci` to support mixed existing utf8mb4 column collations without altering tables. Failed summary requests show a generic retry message instead of raw SQL errors.
- `POST resource=presence` uses the authenticated session identity to update the existing `last_seen_at` field. No user ID from the request body is used. Heartbeats do not add audit records.
- UI time conversion uses Asia/Jakarta; online age uses server time plus elapsed client time.
- The frontend awaits its latest navigation log write before fetching the phase summary, preventing its own visit from being missing on first load.

## Verification

- `node --test tests/store.test.cjs`: includes phase validation, navigation-write ordering, error handling, and changed-session rejection.
- `php tests/phase-access.test.php`: Repository contract using PDO doubles only; verifies selected-phase binding, read-only aggregate, minimal response, UTC timestamps, and missing history.
- `node tests/workspace-ui.cjs <playwright-module-path>`: synthetic API/browser coverage for phase separation, member visibility without audit reads, exact WIB format, online expiration, hidden-tab heartbeat behavior, dirty checklist preservation, errors/retry, and responsive widths 360/390/768/1365.
- JavaScript/PHP syntax checks and `git diff --check`.
- No live SQL, schema change, migration, seed, database smoke check, or real API mutation was run by the tests. Normal application use records menu visits and presence through the existing persistence paths.

## Limitations

- Existing activity records identify people by display name. A rename or duplicate name can fragment or conflate old access history; this feature does not migrate historic identities.
- A closed/disconnected tab can remain Online for up to approximately 90 seconds; another viewer sees that change at the next summary refresh (normally within 30 seconds).
- Global `last_seen_at` is also updated by existing login/snapshot behavior. Online is app-wide; the phase timestamp is the latest recorded activity within that phase, not continuous dwell time.
- Empty history is not interpreted as never having visited. No past activity is fabricated.
- Real MySQL/public-site acceptance testing remains unperformed to protect live data.
