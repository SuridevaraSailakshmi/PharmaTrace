/**
 * PharmaTrace — Permissions smoke test
 *
 * Verifies that the granular RBAC permission system works correctly.
 */

import { describe, it, expect } from 'vitest';
import { hasPermission, hasAllPermissions, hasAnyPermission, getPermissionsForRole } from '@/lib/permissions';

describe('RBAC Permissions', () => {
  describe('ADMIN role', () => {
    it('should have users.view permission', () => {
      expect(hasPermission('ADMIN', 'users.view')).toBe(true);
    });

    it('should have users.create permission', () => {
      expect(hasPermission('ADMIN', 'users.create')).toBe(true);
    });

    it('should have settings.edit permission', () => {
      expect(hasPermission('ADMIN', 'settings.edit')).toBe(true);
    });

    it('should have sscc.configure permission', () => {
      expect(hasPermission('ADMIN', 'sscc.configure')).toBe(true);
    });

    it('should have qr.void permission', () => {
      expect(hasPermission('ADMIN', 'qr.void')).toBe(true);
    });

    it('should have all admin permissions', () => {
      const adminPerms = getPermissionsForRole('ADMIN');
      expect(adminPerms.length).toBeGreaterThan(0);
    });
  });

  describe('WORKER role', () => {
    it('should have forms.view permission', () => {
      expect(hasPermission('WORKER', 'forms.view')).toBe(true);
    });

    it('should have qr.create permission', () => {
      expect(hasPermission('WORKER', 'qr.create')).toBe(true);
    });

    it('should NOT have users.view permission', () => {
      expect(hasPermission('WORKER', 'users.view')).toBe(false);
    });

    it('should NOT have settings.edit permission', () => {
      expect(hasPermission('WORKER', 'settings.edit')).toBe(false);
    });

    it('should NOT have sscc.configure permission', () => {
      expect(hasPermission('WORKER', 'sscc.configure')).toBe(false);
    });

    it('should NOT have qr.void permission', () => {
      expect(hasPermission('WORKER', 'qr.void')).toBe(false);
    });

    it('should NOT have forms.create permission', () => {
      expect(hasPermission('WORKER', 'forms.create')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when role has all specified permissions', () => {
      expect(hasAllPermissions('ADMIN', ['users.view', 'users.create', 'settings.edit'])).toBe(true);
    });

    it('should return false when role is missing any permission', () => {
      expect(hasAllPermissions('WORKER', ['forms.view', 'settings.edit'])).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when role has at least one of the specified permissions', () => {
      expect(hasAnyPermission('WORKER', ['settings.edit', 'forms.view'])).toBe(true);
    });

    it('should return false when role has none of the specified permissions', () => {
      expect(hasAnyPermission('WORKER', ['users.create', 'settings.edit'])).toBe(false);
    });
  });
});
