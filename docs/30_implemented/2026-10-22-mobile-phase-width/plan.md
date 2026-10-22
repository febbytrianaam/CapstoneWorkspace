# Mobile Phase Width Fix

## Scope

- Reproduce the reported zoom-out when navigating to Tugas 2 from the mobile sidebar.
- Fix intrinsic Kanban widths and long unbroken task text without forcing browser zoom or changing the saved board mode.
- Cover Tugas 1/2/3, both Kanban/list modes, and member/superadmin roles using actual mobile viewport emulation rather than desktop viewport resizing alone.

## Constraints

- No database, business workflow, role, or task content changes.
- Keep desktop horizontal Kanban scrolling and normal mobile pinch zoom available.
- Use synthetic records and intercepted requests only.
