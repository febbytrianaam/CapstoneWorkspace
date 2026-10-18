# Member Account Status

## Agreed Behavior

- Superadmin may deactivate/reactivate member and coordinator accounts, without deleting them.
- Protect the current account and superadmin accounts from this action.
- Inactive accounts cannot log in; existing sessions are rejected when their next API request checks account status.
- New PIC, reviewer, and meeting-host assignments must use active accounts. Keep historical assignments visible; flag unfinished work for manual reassignment instead of deleting or silently reallocating it.
- BA generated from the form uses active members for the roster, attendance, and signatures. If all active members attend, the absent column is `-`.
- Existing archived PDFs, free-text activity notes, tasks, attendance payloads, audit history, and documents are not rewritten by a status change.

## Live Data Boundary

The owner approved adding only a status column. Add `users.is_active TINYINT(1) NOT NULL DEFAULT 1` using a separate CLI migration after isolated tests. Do not deactivate any real account automatically. Do not run the complete schema or seed scripts.

## Verification

- In-memory PHP tests: role/self/superadmin protection, inactive login and session rejection, assignment rejection, reactivation, preservation of identity/password, idempotence, and audit transaction behavior.
- Node datastore tests: server rejection retains state, canonical status confirmation, no business-record mutation.
- Mocked browser: deactivate/reactivate, inactive options, four-member BA, absent dash, preserved history, and mobile controls.
