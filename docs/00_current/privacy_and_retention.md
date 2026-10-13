# Privacy And Retention

## User Data In The App

The app handles personal and project coordination data, including:

- Usernames.
- Password hashes.
- Names, full names, NIM/NIP fields.
- Roles and display metadata.
- Task assignment and review history.
- Meeting titles, dates, URLs, hosts, and notes.
- Progress notes.
- Notifications.
- Audit logs.
- User activity logs.
- Uploaded project documents and evidence.

## What Is Stored

Stored in MySQL:

- Users and password hashes.
- Tasks and checklist items.
- Meetings.
- Progress notes.
- Notifications.
- Audit logs.
- User activity logs.
- Project guides and document archives as BLOBs.
- RBAC permission overrides.

Stored in browser LocalStorage:

- UI preferences and cached/offline fallback data.
- Some cached app data may include task or activity state.

## What Is Not Intentionally Stored

- Plaintext passwords.
- Cloudflare tunnel tokens.
- Raw private database backups.
- Browser cookies beyond PHP session cookie.

## Retention Assumptions

- Assumption: Data is retained for the duration of the Capstone project unless manually deleted.
- Assumption: Documents remain stored until superadmin deletes them.
- Assumption: Audit and activity logs currently remain until manually cleared or pruned by future logic.

## Deletion Assumptions

- Tasks can be deleted by allowed roles, but archiving is preferred for completed work.
- Meetings use soft delete behavior in some flows.
- Document archives can be deleted by superadmin.
- Audit log clearing exists for superadmin, but user activity log clearing does not currently appear to have a UI.

## Third-Party Processing

- Cloudflare processes traffic for the public URL.
- Browser loads Chart.js and SweetAlert2 from jsDelivr CDN.
- If users paste Microsoft Teams or Google Meet links, those third-party URLs are stored as meeting/document context.

## Privacy Risks

- Meeting links in records may expose private meeting rooms.
- Uploaded documents may contain student, clinic, or operational details.
- Audit/activity logs include IP and user-agent data.
- Browser LocalStorage may persist data on shared devices.

## Recommendations

- Decide a retention date after Tugas 3 submission.
- Export and archive final evidence privately.
- Remove or anonymize logs after project completion if no longer needed.
- Avoid uploading clinic data unless permission is explicit.
- Avoid storing real patient or sensitive clinic records.
