# Plan: Mobile Responsive Polish

## Summary

Fix mobile layout issues found during real phone testing and screenshots.

## Goals

- Improve topbar notification dropdown on mobile.
- Improve sidebar/tour overlap behavior.
- Improve task modal scrolling.
- Improve document cards and archive layout.
- Improve meeting/dashboard card button sizing.
- Disable problematic member tour after it caused overlap/stuck states.

## Non-Goals

- No full redesign.
- No frontend framework migration.
- No native mobile app.

## Implementation Details

- Add responsive CSS rules in `css/style.css`.
- Adjust rendering classes and action placement in `js/app.js`.
- Disable member tour with `MEMBER_TOUR_ENABLED = false`.
- Keep mobile UI functional before decorative polish.

## Test Plan

- Open app on mobile viewport.
- Check notification dropdown.
- Check sidebar and phase navigation.
- Check task modal scroll and save buttons.
- Check dashboard cards and document archive cards.

## Acceptance Criteria

- Important controls are reachable on mobile.
- No major overlap blocks interaction.
- Member and superadmin workflows remain usable on phone.

## Assumptions

- This plan is reconstructed after implementation because the docs system was added later.
