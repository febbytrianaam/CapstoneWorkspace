# Plan: Server BA Drafts And Legacy Browser Recovery

Status: Implemented, 18 October 2026.

## Scope

- Move BA form drafts, attendance, activities, images, and editable meeting identity fields to MySQL, keyed by the existing meeting.
- Inventory localStorage usage. Existing database-backed features must not be overwritten from stale browser snapshots.
- Preserve original legacy browser work before importing BA drafts. Conflicts and orphaned drafts must remain recoverable.
- Keep display preferences local; they are not project records. Authentication remains a PHP session.

## Safety

- The owner explicitly approved adding only two tables to the live database after tests: `berita_acara_drafts` and `browser_recovery_backups`.
- Never execute the full schema/seed file against the live database.
- Use a dedicated CLI migration that only adds those tables; no Repository initialization or compatibility migrations.
- Tests use intercepted browser APIs and in-memory PDO doubles. No synthetic records may be written to live tables.
- No existing tasks, users, meetings, archives, progress notes, or audit records may be overwritten by local cache recovery.

## Acceptance

- Server draft round-trip survives cleared localStorage; images, newlines, attendance, and activities persist.
- Concurrent updates reject stale revisions without clearing input.
- Initial server load failure prevents saving defaults over an unknown draft.
- Backup precedes legacy import, imports are idempotent, and conflicts never overwrite server drafts.
- Original local work remains untouched, including invalid or orphaned legacy content.
- Superadmin can list/download preserved browser backups. Members cannot read drafts or backups.
