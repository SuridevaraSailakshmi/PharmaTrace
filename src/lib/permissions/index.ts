/**
 * PharmaTrace — Permission definitions
 *
 * Defines the RBAC permission matrix for V1 roles using granular permissions.
 *
 * PRELIMINARY: This matrix is a starting point. The exact permission
 * assignments will be finalized during the database/RBAC phase and
 * stored in the database. Do not treat this as the final authority.
 *
 * Once the schema is frozen, permissions will be loaded from the
 * database (role_permissions table) rather than this static map.
 */

import type { AppRole, PermissionId } from '@/types';

/**
 * Preliminary permission matrix by role.
 *
 * ADMIN — Full granular access to all system areas.
 * WORKER — Limited to viewing forms, creating submissions, viewing own QR/SSCC.
 */
const ROLE_PERMISSIONS: Record<AppRole, readonly PermissionId[]> = {
  ADMIN: [
    // Users
    'users.view',
    'users.create',
    'users.edit',
    'users.disable',
    // Forms
    'forms.view',
    'forms.create',
    'forms.edit',
    'forms.publish',
    'forms.version',
    // QR
    'qr.view',
    'qr.create',
    'qr.download',
    'qr.print',
    'qr.void',
    // SSCC
    'sscc.view',
    'sscc.configure',
    // Audit
    'audit.view',
    // Settings
    'settings.view',
    'settings.edit',
  ],
  WORKER: [
    // Forms — view only (to fill submissions)
    'forms.view',
    // QR — create, view, download, print (own submissions)
    'qr.view',
    'qr.create',
    'qr.download',
    'qr.print',
    // SSCC — view only
    'sscc.view',
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(
  role: AppRole,
  permission: PermissionId,
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role.
 */
export function getPermissionsForRole(role: AppRole): readonly PermissionId[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(
  role: AppRole,
  required: PermissionId[],
): boolean {
  return required.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(
  role: AppRole,
  required: PermissionId[],
): boolean {
  return required.some((p) => hasPermission(role, p));
}
