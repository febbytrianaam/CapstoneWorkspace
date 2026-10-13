# Product Overview

## Summary

Capstone Workspace is a lightweight web app for coordinating a Universitas Terbuka Capstone Project team working on:

> Rancang Bangun Sistem Informasi Manajemen Persediaan Obat pada Klinik Shifa Medika

The app is a team workspace for tasks, meetings, progress notes, document archives, review workflow, and audit visibility. It is not the ShifaStock inventory system itself; it supports the Capstone team's planning and documentation work.

## Target Users

- Superadmin: Febby or project owner role with full control over tasks, users, documents, RBAC, audit, and activity logs.
- Koordinator: team coordination role with task and meeting management, but without audit visibility.
- Member: team member role focused on assigned tasks, checklist updates, task review submissions, and reading shared documents.

## Core Problem

The team needs one place to track Capstone work across Tugas 1, Tugas 2, and Tugas 3 without duplicating Notion, WhatsApp updates, manual Berita Acara files, and document evidence.

## Current Value Proposition

- Shows assigned tasks and phase progress.
- Provides Kanban-style task views for Tugas 1, Tugas 2, and Tugas 3.
- Supports task checklist, status, priority, PIC, reviewer, due date, and review status.
- Keeps phase-level progress notes that can be copied for team updates.
- Stores project guides and archived documents.
- Supports Berita Acara generation, preview, print/PDF workflow, and manual BA upload.
- Records audit logs and superadmin-only user activity logs.

## Main Workflows

1. Login with an assigned account.
2. View dashboard summaries and assigned active tasks.
3. Open a phase page, read progress notes, and review tasks.
4. PIC updates task status/checklist and submits review when ready.
5. Reviewer or superadmin approves or requests revision.
6. Superadmin manages users, RBAC, archives, documents, and audit/activity logs.
7. Admin uploads shared documents or meeting evidence to Arsip Dokumen.
8. Admin creates or uploads Berita Acara for meetings.

## What Success Looks Like

- Every team member can see their responsibilities without asking in chat.
- Completed work can be archived or reviewed without losing evidence.
- Proposal, meeting, and supporting documents remain retrievable.
- Superadmin can audit important changes and understand user activity.
- The app remains easy to run locally and through the existing Cloudflare Tunnel.

## Assumptions And Unknowns

- Assumption: The primary deployment is still a Windows VDI with PHP built-in server and Cloudflare Tunnel.
- Assumption: Local development currently uses `php -S localhost:4000`.
- Unknown: Whether the production database has all migrations applied after the latest changes.
- Unknown: Whether all real team members have final passwords and have completed first login.
- Unknown: Whether the app should eventually become a formal production system or remain a Capstone coordination tool.
