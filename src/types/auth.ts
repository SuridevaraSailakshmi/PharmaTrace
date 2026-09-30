/**
 * PharmaTrace — Authentication & authorization types
 *
 * Types for user authentication, roles, and permissions.
 *
 * PRELIMINARY: The exact permission matrix will be finalized during
 * the database/RBAC phase. Do not build business logic that depends
 * on the current permission definitions being final.
 */

/** Application roles (V1) */
export type AppRole = 'ADMIN' | 'WORKER';

/**
 * Granular permission identifiers.
 *
 * Format: resource.action
 *
 * This list is preliminary and will be finalized in the RBAC phase.
 * It should be kept in sync with the database `permissions` table
 * once the schema is frozen.
 */
export type PermissionId =
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.disable'
  // Forms
  | 'forms.view'
  | 'forms.create'
  | 'forms.edit'
  | 'forms.publish'
  | 'forms.version'
  // QR
  | 'qr.view'
  | 'qr.create'
  | 'qr.download'
  | 'qr.print'
  | 'qr.void'
  // SSCC
  | 'sscc.view'
  | 'sscc.configure'
  // Audit
  | 'audit.view'
  // Settings
  | 'settings.view'
  | 'settings.edit';

/** Authenticated user with role information */
export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  full_name: string | null;
  created_at: string;
}

/** Session information */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}
