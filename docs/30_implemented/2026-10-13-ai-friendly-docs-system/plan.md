# Plan: AI-Friendly Documentation System

## Summary

Create a documentation structure that helps humans and AI agents understand the current app, plan future work, record decisions, and preserve shipped implementation history.

## Goals

- Add docs index and navigation.
- Separate current truth from plans, brainstorming, references, archives, and shipped work.
- Add current product, architecture, testing, security, privacy, roadmap, and AI handoff docs.
- Add ADR and plan/report templates.
- Preserve existing Tugas 1 reconciliation docs.

## Non-Goals

- Do not rewrite old reconciliation documents.
- Do not archive old docs without owner approval.
- Do not invent fake certainty where the repo does not prove facts.

## Implementation Details

- Create `docs/00_current/` factual current-state files.
- Create `docs/10_ai_workspace/` for brainstorming and decisions.
- Create `docs/20_plans/` for active/backlog plans.
- Create `docs/30_implemented/` for implementation history.
- Create `docs/40_references/` and `docs/90_archive/`.
- Add an accepted ADR for the lightweight PHP/MySQL stack.

## Test Plan

- Verify expected folders and files exist.
- Verify links are relative and readable.
- Verify old docs remain in place.

## Acceptance Criteria

- Future AI agents have a clear starting point.
- Current truth is separated from future ideas.
- Implementation history has a repeatable template.
- Existing docs are preserved.

## Assumptions

- The docs are part of the repository and should be committed with code.
