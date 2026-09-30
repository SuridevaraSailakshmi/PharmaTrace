/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminUserService } from '@/services/admin/admin-user.service';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/auth/AuthorizationService');
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('AdminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdmin = 'admin-1';
  const mockWorker = 'worker-1';

  it('rejects worker from retrieving user list', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(false);
    await expect(AdminUserService.getUsers(mockWorker, { page: 1, pageSize: 20 }))
      .rejects.toThrow('Unauthorized');
  });

  it('allows admin to retrieve user list', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(true);
    const mockRpc = vi.fn().mockResolvedValue({
      data: [{
        id: 'u-1', email: 'test@example.com', role_id: 'WORKER', is_active: true, total_count: 1
      }], error: null
    });
    (createClient as any).mockResolvedValue({ rpc: mockRpc });

    const result = await AdminUserService.getUsers(mockAdmin, { page: 1, pageSize: 20 });
    expect(result.data.length).toBe(1);
    expect(result.data[0]!.email).toBe('test@example.com');
  });

  it('rejects worker from updating roles', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(false);
    await expect(AdminUserService.updateUser(mockWorker, 'u-1', 'ADMIN', true))
      .rejects.toThrow('Unauthorized');
  });

  it('rejects invalid role assignment', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(true);
    // @ts-expect-error Testing invalid role
    await expect(AdminUserService.updateUser(mockAdmin, 'u-1', 'SUPERADMIN', true))
      .rejects.toThrow('Invalid role');
  });

  it('allows admin to update user successfully', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(true);
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    (createClient as any).mockResolvedValue({ rpc: mockRpc });

    await expect(AdminUserService.updateUser(mockAdmin, 'u-1', 'WORKER', false))
      .resolves.not.toThrow();
  });

  it('rejects modification of last active ADMIN', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(true);
    const mockRpc = vi.fn().mockResolvedValue({ 
      error: { message: 'Cannot demote or deactivate the last active ADMIN' } 
    });
    (createClient as any).mockResolvedValue({ rpc: mockRpc });

    await expect(AdminUserService.updateUser(mockAdmin, 'admin-1', 'WORKER', true))
      .rejects.toThrow('Cannot demote or deactivate the last active ADMIN.');
  });
});
