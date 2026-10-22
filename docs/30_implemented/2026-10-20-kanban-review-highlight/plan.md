# Kanban Review Highlights

## Scope

- Make submitted tasks easier to recognize in phase Kanban and mobile list views.
- Distinguish reviews assigned to the viewer from tasks waiting for another reviewer with both text and color.
- Highlight requested revisions in rose and show review status, reviewer, and note excerpts in Tindak Lanjut as well as Kanban/list views. Provide Lihat catatan review to open the existing review panel.
- Show the PIC or reviewer context, preserve priority and readonly indicators, and avoid duplicate submitted-status badges.
- Use only a short indicator pulse, disable it for reduced-motion users, and support dark mode.

## Constraints

- No database, API, review workflow, notification, assignment, or permission changes.
- Do not highlight archived, unsubmitted, or approved tasks as pending review. Revision requests have their own distinct state.
- Verify with synthetic unit tests and intercepted desktop/mobile browser requests only.
