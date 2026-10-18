# BA Print Layout And Naming

## Scope

- Use uniform thin table rules with closed borders when activity rows span pages.
- Suggest `01. BA003 - Berita Acara Pertemuan 14 Oktober 2026` as the PDF filename: fixed `01.`, global sequential BA code, date from the BA header without weekday.
- Reuse manual archive codes for the same meeting; avoid counting legacy unlinked uploads and their drafts twice.
- Keep the documentation heading with its first photo. Move both to the next page if they cannot fit after signatures. Keep subsequent photos intact, one per row.

## Safety

- No schema changes or test writes to live data.
- Preserve previously assigned codes; no automatic mass renumbering.
- The owner separately authorized one existing third-meeting draft correction from BA004 to BA003. Verify every other payload field is unchanged and use a revision-guarded transaction.

## Verification

- Isolated PHP numbering/storage tests and mocked browser workflows.
- Native Chrome PDFs with a long activity spanning pages and landscape/portrait documentation.
- Inspect PDF borders, retained paragraphs, photo page bounds, and heading placement.
