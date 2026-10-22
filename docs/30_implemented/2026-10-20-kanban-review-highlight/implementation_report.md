# Kanban Review Highlights

## Behavior

- Nonarchived submitted cards receive a tinted background, matching border, and a prominent review strip.
- Teal Perlu kamu review requires the viewer to be the assigned reviewer, not the PIC, and to pass the existing review permission check. Other viewers, including the task owner and managers not assigned as reviewer, see amber Menunggu review with the reviewer's name.
- Requested revisions use rose Perlu revisi with reviewer context. Both pending-review and revision strips apply only to nonarchived tasks.
- Tindak Lanjut rows also show the actual review-status badge, reviewer, and a maximum three-line escaped note excerpt. Kanban/list cards share the same note presentation. Lihat catatan review opens the existing task modal and scrolls to its review panel; it does not save, focus an editable field, or change permissions. Revision requests without notes show an explicit empty-note message.
- The same strip appears in mobile list mode. Labels, not just colors, communicate the difference. Missing reviewer names have an explicit fallback; dynamic names are escaped.
- Readonly, priority, task-opening, and drag permissions are unchanged. The old submitted-status badge is suppressed when the strip is present; other review badges remain as before.
- A small dot pulses for two two-second cycles, then stops. Reduced-motion disables the animation. Dark-mode colors are defined separately. No page-wide flashing or animated card movement is added.
- CSS and app asset versions are bumped to refresh browser caches.

## Verification Boundary

- Unit tests cover member/manager distinctions, permission denial, archive/status exclusions, nonmutation, escaping, missing reviewers, note excerpts, and avoiding nested buttons in action rows.
- Intercepted browser checks cover readonly and drag behavior, contrasting queue colors, mobile Kanban/list views, dark mode, reduced motion, and no task writes while switching views.
- No live database requests, migrations, seed operations, or real review actions are used for this feature's verification. Public Cloudflare behavior is not certified by these isolated tests.

Verified on 20 October 2026: 22 Node tests and 24 intercepted browser scenario groups passed without browser errors. Kanban cards at 360/390/768/1365px, dark mode, waiting/revision cards, mobile revision lists, and mobile action-note rows were captured. Revision, waiting, and mobile note screenshots were visually inspected. Opening notes from all three surfaces preserved task data and permissions. PHP/JavaScript syntax and whitespace checks passed.
