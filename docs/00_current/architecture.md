# Architecture

## Current Stack

- PHP without Laravel or another backend framework.
- MySQL via PDO.
- HTML/PHP partials.
- CSS in `css/style.css`.
- JavaScript in `js/app.js`, `js/data.js`, and `js/rbac.js`.
- Chart.js from CDN.
- SweetAlert2 from CDN.
- Cloudflare Tunnel for public access.

## Major Modules

| Area | Files |
|---|---|
| App shell | `index.php`, `partials/sidebar.php`, `partials/top-header.php`, `partials/login.php` |
| Pages | `partials/pages/*.php` |
| Modals | `partials/modals/*.php` |
| Frontend orchestration | `js/app.js` |
| Frontend data/API layer | `js/data.js` |
| Frontend RBAC helper | `js/rbac.js` |
| API routing and authorization | `backend/api/index.php` |
| Data access | `backend/Repository.php` |
| Database connection | `backend/Database.php`, `backend/config.php` |
| Schema and migrations | `database/schema.sql`, `database/migrations/*.sql` |

## Runtime Flow

```mermaid
flowchart TD
    Browser[Browser] --> PHP[index.php]
    PHP --> Partials[PHP partial templates]
    Browser --> JS[js/app.js + js/data.js + js/rbac.js]
    JS --> API[backend/api/index.php]
    API --> Auth[PHP session]
    API --> Repo[backend/Repository.php]
    Repo --> DB[(MySQL capstone_workspace)]
    Browser --> CDN[Chart.js and SweetAlert2 CDN]
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend JS
    participant API as PHP API
    participant DB as MySQL

    U->>FE: Login / action
    FE->>API: fetch resource request
    API->>API: Validate session and role
    API->>DB: Read or write via Repository
    DB-->>API: Rows
    API-->>FE: JSON response
    FE-->>U: Render dashboard, task, document, or modal
```

## Important Interfaces

- `GET backend/api/index.php?resource=snapshot`
- `POST backend/api/index.php?resource=auth`
- `DELETE backend/api/index.php?resource=auth`
- `GET/POST/PUT/DELETE resource=tasks`
- `GET/POST/PUT/DELETE resource=meetings`
- `GET/POST/PUT/DELETE resource=users`
- `GET/POST resource=notifications`
- `GET/POST/DELETE resource=audit-logs`
- `GET/POST resource=user-activities`
- `GET/POST/DELETE resource=guides`
- `GET/POST/PUT/DELETE resource=document-archives`
- `GET/PUT resource=progress-notes`
- `GET/POST resource=rbac`

## Storage And Database Behavior

- Main data is stored in MySQL.
- Uploaded guides and archive documents are stored as BLOBs.
- Timestamps are stored in UTC at the database level. Frontend renders WIB.
- `Repository::create()` performs some table and column setup for compatibility.
- LocalStorage is still used for cached/offline fallback and UI preferences.

## External Services

- Cloudflare Tunnel routes public HTTPS traffic to local PHP server.
- CDN loads Chart.js and SweetAlert2.
- No VPS is used according to the deployment handoff.

## Security And Privacy-Relevant Behavior

- PHP sessions use `httponly`, `samesite=Lax`, and `secure` when HTTPS is detected.
- Passwords are stored as password hashes.
- Backend validates role permissions before non-auth API requests.
- Member task updates are restricted to their own PIC tasks, with review exceptions.
- Audit logs and user activity logs may store IP and device/user-agent.
- File downloads stream from API with `X-Content-Type-Options: nosniff`.

## Deployment Shape

```mermaid
flowchart TD
    Internet[Internet] --> CF[Cloudflare HTTPS]
    CF --> Tunnel[Cloudflare Tunnel]
    Tunnel --> VDI[Windows VDI]
    VDI --> PHPServer[PHP built-in server localhost:4000]
    PHPServer --> App[Capstone Workspace index.php]
    App --> MySQL[(Local MySQL)]
```
