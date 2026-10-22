# Mobile Phase Width Fix

## Cause And Change

The issue reproduced with a saved Kanban preference and a long unbroken task title: a 360px mobile viewport acquired a 1377px document/layout width after sidebar navigation to Tugas 2. Existing browser tests resized a desktop context and used short titles, so they missed this intrinsic-width case.

Mobile Kanban used a `1fr` track with an automatic content-based minimum. Unbroken title/description text could grow the column beyond the screen while the mobile board wrapper allowed visible horizontal overflow. Hiding body overflow alone did not fix the layout viewport.

- Mobile tracks now use `minmax(0, 1fr)`.
- Board wrappers, columns, card containers, and task cards have appropriate width constraints and zero minimum widths.
- Long titles, descriptions, next-action text, and assignee/list labels wrap inside their own surfaces; timestamps may wrap. Avatars keep their size.
- The CSS cache key is bumped. There are no viewport-meta restrictions, zoom/scale transforms, JS zoom resets, automatic view changes, or changes to task content.

## Verification Boundary

`tests/mobile-navigation.cjs` creates touch-enabled Chromium mobile contexts (`isMobile`, device scale factor 2) at 360/390/412px, with saved Kanban/list preferences for member and superadmin. It navigates through all three phases using sidebar taps, uses synthetic long words/links and meetings, checks document/layout width and visual scale, captures screenshots, and rejects business writes. All requests are intercepted; no live API/database is used. This does not certify every physical device or mobile browser engine.

Verified on 22 October 2026: all 36 sidebar transitions across 12 mobile contexts passed, retaining device-width layout/document bounds and initial visual scale. Member Kanban and superadmin list screenshots were inspected. The existing 32 Node tests and 25 intercepted browser scenario groups also passed; PHP syntax and whitespace checks passed. No live database/API tests or mutations were performed.
