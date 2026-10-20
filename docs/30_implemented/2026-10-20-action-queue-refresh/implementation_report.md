# Action Queue Refresh

## Behavior

- Tugas 1/2/3 show the progress summary immediately after the phase banner, above Akses Terakhir Tim. Content, collapse state, and permissions are unchanged; browser navigation assertions guard this order.
- Four colored segmented controls show live queue counts: blue Tugas saya, rose Perlu revisi, teal Perlu saya review, and amber Tugas saya menunggu review.
- The own-task queue excludes submitted tasks, which have their own waiting queue. Perlu saya review now means the viewer is the assigned reviewer and is not the PIC, for all roles. This narrows the personal queue, not permission to manage reviews; the separate manager-wide review section and task modal role checks remain unchanged.
- Revision filtering retains existing manager/member visibility rules. Archived/completed exclusions follow the existing task completion checks. When no explicit filter is selected, the first nonempty queue is previewed, with exactly one pressed mode control; the main board stays unfiltered until a mode is chosen.
- Nonempty review/revision controls pulse their small color indicator for two two-second cycles, then settle. Reduced-motion disables animation. Waiting is visually distinct without implying that the owner should approve their own task.
- Unframed rows show task code, title, contextual state, PIC when relevant, and a native progress element derived only from checklist flags. No progress value or business record is stored by this UI.
- Row labels differentiate Periksa, Perbaiki, Buka tugas, and Lihat pengajuan. Each opens the existing task modal; there are no automatic review submissions/approvals.
- Preview defaults to three rows. Lihat semua expands the actual preview and can collapse again; expansion is held only in memory per phase and queue. Queue changes preserve focus.
- CSS supports two-column controls on narrow screens, wrapped labels, dark-mode accent contrast, and existing design tokens. CSS/app cache versions were bumped.

## Verification Boundary

`tests/action-queues.test.cjs` covers disjoint own-waiting/assigned-review queues for all roles, permission enforcement, nonmutation, per-phase expansion, escaping, missing checklists, and bounded numeric progress. The intercepted browser suite exercises filtering, modal opening, expansion, responsive screenshots, dark mode, and reduced motion, without real API/database writes. Existing BA tests now explicitly await server-loaded modal readiness before asserting reset photo state, avoiding a timing-dependent assertion against the previous closed modal.

No live database, source ShifaStock, deployment route, or migrations were changed for this feature. Browser tests do not certify a public Cloudflare session.

Verified: 19 Node tests and 23 intercepted browser scenario groups passed without browser errors. Screenshots at 360/390/768/1365px and the waiting/dark states were inspected. No page overflow occurred, and task selection/expansion produced no task, account, or BA mutations. PHP/JS syntax and whitespace checks passed. Only synthetic records were used; no live database requests were made by these tests.
