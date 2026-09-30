/**
 * PharmaTrace — AuthorizationService Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';

// Mock the server Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('AuthorizationService', () => {
  let mockSupabase: {
    auth: { getUser: ReturnType<typeof vi.fn> };
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  });

  it('getCurrentUser returns null when unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    
    const user = await AuthorizationService.getCurrentUser();
    expect(user).toBeNull();
  });

  it('getCurrentUser returns null when application profile is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'auth-123' } }, error: null });
    
    // Missing profile in DB
    const selectMock = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
    };
    mockSupabase.from.mockReturnValue({ select: vi.fn().mockReturnValue(selectMock) });
    
    const user = await AuthorizationService.getCurrentUser();
    expect(user).toBeNull();
  });

  it('requireActiveUser throws UNAUTHENTICATED when no user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    
    await expect(AuthorizationService.requireActiveUser()).rejects.toThrow('UNAUTHENTICATED');
  });

  it('requireActiveUser throws INACTIVE_USER when user is inactive', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'auth-123' } }, error: null });
    
    const selectMock = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { id: 'app-123', email: 'test@example.com', role_id: 'WORKER', is_active: false }, 
        error: null 
      }),
    };
    mockSupabase.from.mockReturnValue({ select: vi.fn().mockReturnValue(selectMock) });
    
    await expect(AuthorizationService.requireActiveUser()).rejects.toThrow('INACTIVE_USER');
  });

  it('requirePermission enforces database-driven permission (SUCCESS)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'auth-123' } }, error: null });
    
    // Setup valid active user
    const selectMockUsers = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { id: 'app-123', email: 'test@example.com', role_id: 'WORKER', is_active: true }, 
        error: null 
      }),
    };

    // Setup permission found
    const selectMockPerms = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { permission_id: 'qr.create' }, 
        error: null 
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') return { select: vi.fn().mockReturnValue(selectMockUsers) };
      if (table === 'role_permissions') return { select: vi.fn().mockReturnValue(selectMockPerms) };
    });

    const user = await AuthorizationService.requirePermission('qr.create');
    expect(user.id).toBe('app-123');
  });

  it('requirePermission enforces database-driven permission (FORBIDDEN)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'auth-123' } }, error: null });
    
    // Setup valid active user
    const selectMockUsers = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { id: 'app-123', email: 'test@example.com', role_id: 'WORKER', is_active: true }, 
        error: null 
      }),
    };

    // Setup permission NOT found
    const selectMockPerms = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('No rows') 
      }),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') return { select: vi.fn().mockReturnValue(selectMockUsers) };
      if (table === 'role_permissions') return { select: vi.fn().mockReturnValue(selectMockPerms) };
    });

    await expect(AuthorizationService.requirePermission('forms.publish')).rejects.toThrow('FORBIDDEN');
  });
});
