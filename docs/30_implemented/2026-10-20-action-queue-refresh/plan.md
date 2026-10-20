# Action Queue Refresh

## Scope

- Improve the phase Tindak Lanjut section without creating a decorative dashboard or changing live data.
- Show four distinct queue controls: active own tasks, revision work, reviews assigned to the viewer, and the viewer's submitted tasks waiting for another reviewer.
- Use readable color highlights and a brief, gentle attention pulse for nonempty review/revision queues. Respect reduced-motion preferences; do not flash text or the page.
- Add actual checklist ratios, clear task-opening labels, empty states, and working expand/collapse for previews longer than three rows.
- Place the phase progress summary above team access in Tugas 1/2/3 without changing note content or collapse/permission behavior.

## Constraints

- No database changes, migrations, assignments, review decisions, notifications, or task synchronization.
- Keep existing task-modal permissions and the manager-wide review section intact.
- Verify mobile/desktop, dark mode, keyboard focus, zero-checklist tasks, and long text using synthetic intercepted browser requests.
