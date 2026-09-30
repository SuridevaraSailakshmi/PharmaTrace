/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';

export interface AdminUserQuery {
  search?: string;
  roleId?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string | null;
  roleId: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserResponse {
  data: AdminUserRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class AdminUserService {
  /**
   * List all users with pagination and filters
   */
  static async getUsers(_adminId: string, query: AdminUserQuery): Promise<AdminUserResponse> {
    const isAdmin = await AuthorizationService.hasRole('ADMIN');
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();

    const limit = query.pageSize > 0 && query.pageSize <= 100 ? query.pageSize : 20;
    const offset = (query.page > 0 ? query.page - 1 : 0) * limit;

    const { data, error } = await (supabase.rpc as any)('get_admin_users', {
      p_search: query.search || null,
      p_role: query.roleId || null,
      p_is_active: query.isActive !== undefined ? query.isActive : null,
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const records = data || [];
    const totalCount = records.length > 0 ? Number(records[0]?.total_count || 0) : 0;

    return {
      data: records.map((r: any) => ({
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        roleId: r.role_id,
        isActive: r.is_active,
        createdAt: r.created_at
      })),
      total: totalCount,
      page: query.page,
      pageSize: limit,
      hasNext: offset + limit < totalCount,
      hasPrevious: query.page > 1
    };
  }

  /**
   * Update a user's role and/or status
   */
  static async updateUser(
    adminId: string,
    targetUserId: string,
    newRoleId: 'ADMIN' | 'WORKER',
    isActive: boolean
  ): Promise<void> {
    const isAdmin = await AuthorizationService.hasRole('ADMIN');
    if (!isAdmin) throw new Error('Unauthorized');

    if (newRoleId !== 'ADMIN' && newRoleId !== 'WORKER') {
      throw new Error('Invalid role specified');
    }

    const supabase = await createClient();

    const { error } = await (supabase.rpc as any)('admin_update_user', {
      p_target_user_id: targetUserId,
      p_new_role_id: newRoleId,
      p_is_active: isActive,
      p_admin_id: adminId
    });

    if (error) {
      if (error.message.includes('last active ADMIN')) {
         throw new Error('Cannot demote or deactivate the last active ADMIN.');
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}
