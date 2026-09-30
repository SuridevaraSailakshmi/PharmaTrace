# Admin User Management & System Configuration

## 1. Overview
The Admin Management layer provides absolute configuration control over operational users and global GS1 SSCC Production variables. It adheres rigidly to the V1 Scope, limiting architectural roles strictly to `ADMIN` and `WORKER`.

## 2. Server-Side Last-Admin Protection
To guarantee the system never suffers catastrophic administrative lockout, PharmaTrace enforces a database-level safety threshold inside `20260929000008_admin_user_management.sql`.
- When modifying an administrative user, the `admin_update_user` Postgres RPC explicitly counts the remaining active `ADMIN` personnel. 
- If an operation (demotion to `WORKER` or setting `is_active = FALSE`) drops the active admin count to zero, the transaction rolls back violently raising a `'Cannot demote or deactivate the last active ADMIN'` exception.
- This constraint bypasses the frontend entirely, making it impenetrable to client-side manipulation.

## 3. Authorization vs Authentication
In alignment with the Phase 3 architecture:
- Supabase Auth manages true identity credentials (passwords, tokens, invites).
- PharmaTrace `users` table manages the application profile (Role, Active Status).
- PharmaTrace explicitly refuses to duplicate password or cryptographic data. The Admin UI merely regulates application-level privileges and logical activation. Deactivated users instantly fail `AuthorizationService` gatekeeping despite possessing valid OAuth tokens.

## 4. Production SSCC Config Guardrails
GS1 prefixes dictate standard compliance. The `AdminConfigService` strictly regulates:
- The active SSCC Configuration singleton.
- Prevents GS1 Company Prefixes outside the 6-12 digit bounds.
- Records all mutations immutably in the `sscc_configurations` table, ensuring historical sequences and historical QR labels remain unaffected when an administrator rolls over a prefix for a new financial year.

## 5. Security & Isolation
- Endpoints located at `/api/protected/admin/*` undergo deep inspection via `AuthorizationService.hasRole('ADMIN')`.
- All destructive RPCs enforce `SECURITY DEFINER` tying the modifications directly to the administrator's footprint, routing immutable trails straight into the `audit_logs` ledger.
