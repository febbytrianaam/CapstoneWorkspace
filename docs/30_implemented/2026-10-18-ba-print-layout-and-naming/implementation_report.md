# BA Print Layout And Naming

## Implementation

- Renderer and both print styles use 0.5pt black rules. Repeating table footers close the bottom border on each physical page; the former thick outer frame was removed.
- The first documentation photo and heading share a nonbreaking wrapper. Each later photo has its own nonbreaking bordered block. Print images are constrained to 245mm height to fit A4 portrait without cropping.
- Server-owned `documentNumber` is stored in the existing BA JSON payload. MySQL advisory locking serializes number allocation; normal saves own a transaction. External transaction callers retain the connection-scoped lock until their connection closes.
- Numbering spans all phases and reuses codes from manual BA filenames. A linked manual archive and draft count once. Legacy unlinked coded uploads can match a draft by a unique valid Indonesian calendar date; ambiguous same-date meetings are not silently merged.
- Existing assigned numbers remain stable. New numbers follow the highest reserved code, so deletion can leave gaps; there is no separate permanent numbering registry.
- New-tab preview enables printing only after the draft and code are confirmed by the server. Browser document title provides the suggested PDF filename. Existing manually uploaded filenames are not renamed, and browser Save As overrides remain possible.
- Asset cache keys were updated. No table/column migrations were introduced.

## Scoped Live Correction

Read-only metadata inspection found an unlinked manual BA001 and an unnumbered draft for the same first meeting. The earlier allocator counted that draft again, assigning BA004 to the third meeting. After explicit owner approval, only that draft's document number was corrected to BA003 in a transaction. Revision advanced for concurrency protection; every other JSON field was compared before commit and remained identical. No task, archive, meeting, photo, attendance, or activity content was changed. The temporary correction helper was removed.

## Verification

- PHP in-memory tests cover numbering, legacy archive/date deduplication, ambiguity, stable retries, revision conflicts, and retained images.
- Mocked browser suite verifies persisted preview filenames and table-closing rules, along with existing role/mobile workflows.
- `tests/ba-print.cjs` generates synthetic A4 PDFs without connecting to the app or database. `tests/check-ba-print.py` checks thin/closed borders, all 36 long-note paragraphs, and photo/heading placement, then renders page PNGs for visual inspection.
- These checks do not certify every browser's print engine or an operating-system Save As dialog.

Results: 12 Node datastore/RBAC tests, PHP storage and phase-access contracts, and 20 mocked browser scenario groups passed. Responsive widths were 360, 390, 768, and 1365px. Native Chrome generated a five-page long-note PDF and a seven-page version with landscape/portrait photos; both passed border/text assertions. The documentation heading appeared with the first photo on page six, after signatures, and both photos stayed inside page bounds. Rendered documentation pages were visually inspected. PHP/JS syntax checks and `git diff --check` passed (Git only reported existing CRLF conversion warnings).
