# Security

## Current Security Posture

The app has a practical security baseline for a small Capstone workspace, but it is not fully hardened.

Implemented:

- Password hash authentication.
- PHP session-based login.
- Session cookie flags: `httponly`, `samesite=Lax`, and `secure` when HTTPS is detected.
- Role-based backend permission checks in `backend/api/index.php`.
- Frontend RBAC for UX in `js/rbac.js`.
- Member task update restrictions for non-PIC tasks.
- Superadmin-only audit and user activity visibility.
- File extension and size checks for guide/archive uploads.
- `X-Content-Type-Options: nosniff` headers.

## Known Risks

- CSRF protection is not implemented yet.
- No rate limiting on login or API requests.
- File uploads are not virus-scanned.
- Uploaded files are stored in MySQL and can grow the database.
- Audit and activity logs can include personal/device metadata.
- Public URL is internet-facing through Cloudflare Tunnel, so application authentication still matters.

## Secrets Handling

- Do not commit Cloudflare Tunnel tokens.
- Do not commit real passwords or password reset notes.
- Do not commit database dumps with real data, password hashes, meeting links, or audit logs.
- Use placeholders such as `[TUNNEL_TOKEN]`.
- If a token was exposed in chat, screenshot, logs, or repository, rotate it through Cloudflare.

## Auth And Access Status

- `superadmin`: full control, including audit/activity log visibility.
- `koordinator`: task/meeting coordination, user read access, no audit menu.
- `member`: read shared project views and update only permitted task progress/review actions.
- Reviewers are assigned manually by superadmin.

## Abuse And Rate-Limit Considerations

Not implemented yet:

- Login throttling.
- IP-based rate limits.
- Upload frequency limits.
- Account lockout policy.

Recommended:

- Add basic login throttling.
- Add CSRF tokens before broader usage.
- Add upload error logging and stricter MIME validation.

## Deployment Security Notes

- Cloudflare handles public HTTPS.
- Local PHP server remains HTTP behind the tunnel.
- Do not change origin to HTTPS unless the local server is configured for TLS.
- Public URL should be treated as internet-facing.
- Cloudflare Tunnel does not replace app authentication.
