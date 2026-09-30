# Security: Authentication & Authorization

PharmaTrace utilizes a multi-layered security architecture that strictly separates Authentication (Identity) from Authorization (Application RBAC), backed by Database Row-Level Security (RLS).

## 1. Authentication Architecture
**Identity Authority**: Supabase Auth
- Handles email/password authentication, sessions, JWTs, and secure cookie storage.
- Passwords are never stored in the application database.
- The Next.js 16 Proxy (`src/proxy.ts` -> `src/lib/supabase/middleware.ts`) refreshes the Supabase session on every request to prevent stale tokens.

## 2. Application Users
The authenticated Supabase User ID strictly maps to the application's `public.users` table. 
- A valid Supabase session **does not** automatically grant application access.
- Users must have an active (`is_active = true`) profile in `public.users`.
- Role assignments (`role_id`) are entirely database-controlled. Clients cannot spoof their role by modifying cookies, JWTs, or request bodies.

## 3. Role & Permission Resolution
The `AuthorizationService` (`src/lib/auth/AuthorizationService.ts`) is the centralized authority for resolving access:
- **Role Resolution**: Explicit lookup against `public.users`.
- **Permission Resolution**: Dynamic lookup against `public.role_permissions` mapped to the user's assigned role.
- Standard V1 roles: `ADMIN`, `WORKER`.
- Example permissions: `forms.publish`, `qr.create`.

## 4. Protected Routes & APIs
- **UI Protection**: The Proxy (`middleware.ts`) provides a lightweight first line of defense, redirecting unauthenticated users away from protected UI routes (like `/dashboard`) to `/login`.
- **API Protection**: API routes *independently* enforce their own security using `AuthorizationService.requirePermission()`. They do not rely solely on the proxy, adhering to defense-in-depth principles.

## 5. Service-Role Boundary
Atomic operations (e.g., generating SSCCs or Product Reference Codes) require bypassing standard user RLS to ensure gapless sequence increments and absolute structural integrity.
- These operations use the `createServiceClient()` initialized exclusively with `SUPABASE_SERVICE_ROLE_KEY`.
- The key is strictly server-side (no `NEXT_PUBLIC_` prefix).
- The Service Client is **never** exposed to the browser.
- **Rule**: Server endpoints must always authorize the user (via `AuthorizationService`) *before* invoking the Service Client.

## 6. RLS Integration
Database RLS acts as the ultimate safety net.
- `ADMIN` has full access to administrative tables.
- `WORKER` can only access resources they own (e.g., their own submissions).
- `INSERT` operations for generation artifacts (`product_references`, `sscc_records`, `qr_records`) are completely restricted at the RLS level for standard users, violently forcing these writes to go through the authorized API Service Client.

## 7. Security Assumptions
- The database is properly seeded and RLS is active.
- API endpoints never trust client-provided `submitted_by` IDs; they must use the session's authenticated ID.
- Historic immutability is maintained by denying `UPDATE` and `DELETE` on submission records at the RLS level.
