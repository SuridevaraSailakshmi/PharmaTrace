# UI Route Integration

This document maps out the application-level UI routing structure and the associated Role-Based Access Control (RBAC) mechanisms for PharmaTrace.

## Canonical Routes & Ownership

| Route | Ownership / Purpose | Role Requirement |
|-------|---------------------|------------------|
| `/` | Landing/Root | Public (redirects based on auth state) |
| `/login` | Authentication | Public (unauthenticated) |
| `/dashboard` | Main App Dashboard | Authenticated (ADMIN or WORKER) |
| `/admin/users` | User Management UI | ADMIN only |
| `/admin/settings` | SSCC/System Config | ADMIN only |
| `/admin/forms` | Form Builder / Forms | ADMIN only |
| `/worker/qr` | QR Generation Flow | WORKER (or ADMIN via forms.create proxy) |
| `/history` | QR History / Search | Authenticated (Scoped by role) |
| `/history/[id]` | QR Detail View | Authenticated (Scoped by role) |

## Route Security

- **Supabase Auth Middleware:** All routes under `/(dashboard)` are protected by the Next.js `AuthorizationService.requireActiveUser()`. Unauthenticated users are strictly redirected to `/login`.
- **Admin Layout (`/admin/layout.tsx`):** All routes under `/admin/*` are strictly protected at the layout level. Access requires the `ADMIN` role. Unauthorized users (e.g., workers) are redirected to `/dashboard`.
- **Service Level:** Server-side functions (such as `FormsService.getForms` and `QRHistoryService.getHistory`) enforce exact permissions (`forms.create`, `qr.create`, etc.). The UI is purely a reflection of these constraints, ensuring security is strictly enforced at the API layer.

## Major Navigation Links

The `AppShell.tsx` dynamically renders the Sidebar based on the user's role:
- **Dashboard:** Visible to all.
- **QR Generation:** Visible to all.
- **QR History:** Visible to all.
- **Forms & Templates:** `adminOnly: true` (only visible to ADMIN).
- **User Management:** `adminOnly: true` (only visible to ADMIN).
- **Settings:** `adminOnly: true` (only visible to ADMIN).

## UI/Service Relationships

- **`/admin/forms`:** Integrates `FormsService` for form creation, versioning, and draft updates. Relies on `DynamicFormRenderer` for builder capabilities.
- **`/admin/users`:** Integrates `AdminUserService` for paginated EAV search and dynamic role assignments.
- **`/admin/settings`:** Integrates `AdminConfigService` for strictly adhering to GS1 prefixes and system-wide keys.
- **`/worker/qr`:** Orchestrates `FormsService` (viewing published forms), `TraceabilityService`, `PRC Service`, `SSCC Service`, and `QR Generator`.
- **`/history`:** Integrates `QRHistoryService` relying on immutable record retrieval.

## Error Handling

Appropriate `try/catch` and UI error state variables are utilized in Client components to catch API-level rejections. Unauthenticated accesses are automatically caught and redirected using `redirect('/login')` at the Server Component or Middleware layers. No raw stack traces are exposed to users.
