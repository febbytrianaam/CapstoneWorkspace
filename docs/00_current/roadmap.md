# Roadmap

## Current Focus

Stabilize Capstone Workspace as a usable team coordination app for members, reviewers, and the superadmin while keeping deployment lightweight.

## Phase 1: Operational Stability

Goal: Make the current app reliable for daily team use.

Output:

- Confirmed role flows for superadmin, koordinator, and member.
- Confirmed document archive and Berita Acara workflows.
- Confirmed task review workflow.
- Confirmed deployment/run instructions for port `4000`.

Gate:

- Can each team member log in and complete their expected workflow without admin help?

## Phase 2: Security Hardening

Goal: Reduce obvious risks before wider usage.

Output:

- CSRF protection for state-changing API requests.
- Confirmed tunnel token rotation.
- Backup and restore procedure.
- File upload validation review.
- Session and password policy review.

Gate:

- Can the app be considered safe enough for internet-facing access behind Cloudflare Tunnel?

## Phase 3: Documentation And Audit Maturity

Goal: Make the project maintainable by future humans and AI agents.

Output:

- Current docs kept up to date.
- Implementation history folders for shipped features.
- ADRs for major architecture/security decisions.
- Clear data retention notes.

Gate:

- Can a new AI agent understand the repo, risks, and next step within 10 minutes?

## Phase 4: Product Refinement

Goal: Polish UX and reduce manual coordination burden.

Output:

- Improved mobile QA.
- Better filters/search for tasks and documents.
- More explicit review status messaging.
- Optional automatic PHP server startup if VDI policy allows it.

Gate:

- Does the team naturally use the app instead of WhatsApp-only tracking?

## What Not To Build Yet

- Do not migrate to Laravel unless the project scope justifies it.
- Do not add Apache/Nginx/IIS unless PHP built-in server is no longer enough.
- Do not create a new Cloudflare Tunnel per project unless there is a concrete need.
- Do not add complex analytics before privacy and retention rules are agreed.
