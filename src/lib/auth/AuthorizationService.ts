/**
 * PharmaTrace — Authorization Service
 *
 * Centralized service for role and permission resolution, enforcing RBAC
 * and application user validity before allowing sensitive operations.
 */

import { createClient } from '@/lib/supabase/server';

export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  roleId: string;
  isActive: boolean;
}

export type PermissionId =
  | 'users.view' | 'users.create' | 'users.edit' | 'users.disable'
  | 'forms.view' | 'forms.create' | 'forms.edit' | 'forms.publish' | 'forms.version'
  | 'qr.view' | 'qr.create' | 'qr.download' | 'qr.print' | 'qr.void'
  | 'sscc.view' | 'sscc.configure'
  | 'audit.view'
  | 'settings.view' | 'settings.edit';

export class AuthorizationService {
  /**
   * Retrieves the current authenticated application user.
   * Ensures the user is valid in the database and active.
   */
  static async getCurrentUser(): Promise<AppUser | null> {
    const supabase = await createClient();
    
    // 1. Get Supabase Auth Session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // 2. Lookup Application User
    const { data, error: dbError } = await supabase
      .from('users')
      .select('id, email, full_name, role_id, is_active')
      .eq('id', user.id)
      .single();

    if (dbError || !data) {
      // Return null without console.error to avoid Next.js dev overlay intercepting the redirect
      return null;
    }
    
    // Explicitly casting the row to match the selected fields
    const appUser = data as { id: string; email: string; full_name: string | null; role_id: string | null; is_active: boolean };

    return {
      id: appUser.id,
      email: appUser.email,
      fullName: appUser.full_name,
      roleId: appUser.role_id ?? 'UNKNOWN',
      isActive: appUser.is_active,
    };
  }

  /**
   * Asserts that a valid, authenticated, and active user exists.
   * Throws a 401/403 style error if not.
   */
  static async requireActiveUser(): Promise<AppUser> {
    const user = await this.getCurrentUser();
    
    if (!user) {
      throw new Error('UNAUTHENTICATED');
    }

    if (!user.isActive) {
      throw new Error('INACTIVE_USER');
    }

    return user;
  }

  /**
   * Checks if the user has a specific permission.
   */
  static async hasPermission(permission: PermissionId): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user || !user.isActive) return false;

    const supabase = await createClient();
    
    // Resolve from database explicitly
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', user.roleId)
      .eq('permission_id', permission)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  }

  /**
   * Asserts that the current user has the required permission.
   * Throws an error if not authorized.
   */
  static async requirePermission(permission: PermissionId): Promise<AppUser> {
    const user = await this.requireActiveUser();
    
    const isAuthorized = await this.hasPermission(permission);
    
    if (!isAuthorized) {
      console.error(`[AuthorizationService] User ${user.id} denied required permission: ${permission}`);
      throw new Error('FORBIDDEN');
    }

    return user;
  }

  /**
   * Checks if the user has a specific explicit role.
   */
  static async hasRole(role: 'ADMIN' | 'WORKER'): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user && user.isActive && user.roleId === role;
  }

  /**
   * Specifically asserts the user's explicit role (use sparingly, prefer requirePermission).
   */
  static async requireRole(role: 'ADMIN' | 'WORKER'): Promise<AppUser> {
    const user = await this.requireActiveUser();
    
    if (user.roleId !== role) {
      console.error(`[AuthorizationService] User ${user.id} denied required role: ${role}`);
      throw new Error('FORBIDDEN');
    }
    
    return user;
  }
}
