# Capstone Workspace Documentation

This documentation system is the shared memory for humans and AI agents working on Capstone Workspace.
It separates current facts, rough thinking, future plans, and shipped implementation history so the project can be continued safely without re-learning everything from chat history.

## Start Here

- [Product overview](00_current/product_overview.md)
- [Current state](00_current/current_state.md)
- [Architecture](00_current/architecture.md)
- [AI handoff](00_current/ai_handoff.md)
- [Testing strategy](00_current/testing_strategy.md)
- [Security](00_current/security.md)
- [Privacy and retention](00_current/privacy_and_retention.md)
- [Roadmap](00_current/roadmap.md)
- [Next-step plan](20_plans/active/next-step-plan.md)
- [Audit alur dan bug, 17 Oktober 2026](10_ai_workspace/reviews/2026-10-17-flow-audit.md)

## Folder Lifecycle

- `00_current/` contains factual current truth only. Update it when the app, deployment, data model, or risks actually change.
- `10_ai_workspace/` is for rough thinking, open questions, rejected ideas, and ADRs.
- `10_ai_workspace/decisions/` contains durable Architecture Decision Records.
- `20_plans/` contains future work. Active plans are ready or in progress; backlog plans are lower priority ideas.
- `30_implemented/` contains historical records of shipped work.
- `40_references/` contains external references, screenshots, copied source material, and prototype notes.
- `90_archive/` contains old or superseded docs kept for history.

Existing project-specific reference notes currently in `docs/`:

- [Tugas 1 Phase 3 reconciliation](tugas1-phase3-reconciliation.md)
- [Tugas 1 Phase 3B dry-run](tugas1-phase3b-dry-run.md)

## Implementation History Index

- [2026-09-27 Initial workspace prototype](30_implemented/2026-09-27-initial-workspace-prototype/implementation_report.md)
- [2026-09-29 Backend MySQL API persistence](30_implemented/2026-09-29-backend-mysql-api-persistence/implementation_report.md)
- [2026-09-29 Dashboard and Kanban task tracker](30_implemented/2026-09-29-dashboard-kanban-task-tracker/implementation_report.md)
- [2026-09-29 Meeting management](30_implemented/2026-09-29-meeting-management/implementation_report.md)
- [2026-09-29 Notifications and audit log](30_implemented/2026-09-29-notifications-audit-log/implementation_report.md)
- [2026-09-30 Workflow polish](30_implemented/2026-09-30-workflow-polish/implementation_report.md)
- [2026-10-11 Authentication, RBAC, and team readiness](30_implemented/2026-10-11-auth-rbac-team-readiness/implementation_report.md)
- [2026-10-11 Berita Acara archive workflow](30_implemented/2026-10-11-berita-acara-archive-workflow/implementation_report.md)
- [2026-10-11 User profile and password management](30_implemented/2026-10-11-user-profile-password-management/implementation_report.md)
- [2026-10-11 Phase progress notes](30_implemented/2026-10-11-phase-progress-notes/implementation_report.md)
- [2026-10-11 Project guides and flow documents](30_implemented/2026-10-11-project-guides-flow-documents/implementation_report.md)
- [2026-10-12 Task review and member dashboard](30_implemented/2026-10-12-task-review-member-dashboard/implementation_report.md)
- [2026-10-12 Document archive management](30_implemented/2026-10-12-document-archive-management/implementation_report.md)
- [2026-10-12 Task seeding and reconciliation](30_implemented/2026-10-12-task-seeding-reconciliation/implementation_report.md)
- [2026-10-12 Mobile responsive polish](30_implemented/2026-10-12-mobile-responsive-polish/implementation_report.md)
- [2026-10-13 Superadmin user activity tracking](30_implemented/2026-10-13-user-activity-tracking/implementation_report.md)
- [2026-10-13 AI-friendly docs system](30_implemented/2026-10-13-ai-friendly-docs-system/implementation_report.md)
- [2026-10-17 Team workflow improvements](30_implemented/2026-10-17-team-workflow-improvements/implementation_report.md)
- [2026-10-18 Team phase access and presence](30_implemented/2026-10-18-team-phase-presence/implementation_report.md)
- [2026-10-18 Server BA drafts and browser recovery](30_implemented/2026-10-18-server-ba-drafts/implementation_report.md)
- [2026-10-18 BA print layout and naming](30_implemented/2026-10-18-ba-print-layout-and-naming/implementation_report.md)
- [2026-10-18 Member account status](30_implemented/2026-10-18-member-account-status/implementation_report.md)
- [2026-10-20 Action queue refresh](30_implemented/2026-10-20-action-queue-refresh/implementation_report.md)
- [2026-10-20 Kanban review highlights](30_implemented/2026-10-20-kanban-review-highlight/implementation_report.md)
- [2026-10-22 Phase task reports](30_implemented/2026-10-22-task-reports/implementation_report.md)
- [2026-10-22 Mobile phase width](30_implemented/2026-10-22-mobile-phase-width/implementation_report.md)

For every future meaningful shipped feature, create:

```text
docs/30_implemented/YYYY-MM-DD-short-feature-name/
  plan.md
  implementation_report.md
```

Optional files:

- `test_notes.md`
- `screenshots/`
- `migration_notes.md`
- `rollback_notes.md`

## Rules For Future AI Agents

1. Inspect the repo before editing docs or code.
2. Treat `00_current/` as current truth, not a brainstorming area.
3. Put messy notes in `10_ai_workspace/brainstorming/`.
4. Put durable decisions in `10_ai_workspace/decisions/` as ADRs.
5. Put future implementation plans in `20_plans/active/` or `20_plans/backlog/`.
6. After a feature ships, add an implementation folder under `30_implemented/`.
7. Preserve old plans and decisions. Archive them instead of deleting casually.
8. Do not invent certainty. Write `Unknown` or `Assumption` when the repo does not prove something.
9. Keep secrets, tokens, passwords, and real private data out of docs.
10. Update this index when docs are added or implementation history changes.
