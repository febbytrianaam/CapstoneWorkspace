# ADR-0001: Lightweight PHP/MySQL Stack

## Status

Accepted

## Context

Capstone Workspace is a small project coordination app that must run on a Windows VDI with minimal setup. The project is explicitly not Laravel and currently uses PHP, HTML, CSS, JavaScript, and MySQL. It is exposed publicly through Cloudflare Tunnel without a VPS or port forwarding.

## Decision

Use a lightweight frameworkless PHP architecture:

- `index.php` renders the app shell.
- PHP partials render page/modal markup.
- Vanilla JavaScript handles UI behavior.
- `backend/api/index.php` provides JSON API routing.
- `backend/Repository.php` handles PDO/MySQL persistence.
- `database/schema.sql` and migration SQL files manage schema.

## Consequences

Positive:

- Simple to run with `php -S localhost:4000`.
- No Composer or Laravel runtime requirement.
- Easy to deploy behind Cloudflare Tunnel.
- Small enough for Capstone prototype/development workflow.

Negative:

- Routing, validation, and permissions require manual discipline.
- `js/app.js` can become large.
- No built-in CSRF, migrations, queue, or test framework.
- More documentation is needed so future agents do not assume Laravel patterns.

## Alternatives Considered

- Laravel: rejected for now because project instructions say this is not Laravel and the current app already works without it.
- Static-only app with LocalStorage: no longer enough because authentication, roles, documents, and persistence are needed.
- VPS with Nginx/Apache: not needed because Cloudflare Tunnel and local PHP server satisfy current deployment needs.

## Date

2026-10-13
