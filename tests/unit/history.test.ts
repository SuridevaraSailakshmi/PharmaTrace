/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QRHistoryService } from '@/services/history/history.service';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
vi.mock('@/lib/auth/AuthorizationService');
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('QRHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = 'worker-1';
  
  it('rejects unauthorized users for history list', async () => {
    vi.mocked(AuthorizationService.hasPermission).mockResolvedValue(false);
    await expect(QRHistoryService.getHistory(mockUser, { page: 1, pageSize: 20 }))
      .rejects.toThrow('Unauthorized');
  });

  it('rejects unauthorized users for history detail', async () => {
    vi.mocked(AuthorizationService.hasPermission).mockResolvedValue(false);
    await expect(QRHistoryService.getRecord(mockUser, 'qr-123'))
      .rejects.toThrow('Unauthorized');
  });

  it('retrieves history list for authorized users', async () => {
    // Worker authorized
    vi.mocked(AuthorizationService.hasPermission).mockImplementation(async (perm) => perm === 'qr.create');
    
    const mockRpc = vi.fn().mockResolvedValue({
      data: [{
        id: '1',
        product_reference_code: 'PRC-1',
        sscc: 'SSCC-1',
        product_name: 'Test',
        batch_no: 'B1',
        status: 'GENERATED',
        created_at: '2026-01-01',
        created_by: mockUser,
        total_count: 1
      }],
      error: null
    });
    
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: [{ id: mockUser, full_name: 'Worker Name', email: 'worker@test.com' }] })
      })
    });
    
    (createClient as any).mockResolvedValue({ rpc: mockRpc, from: mockFrom });

    const result = await QRHistoryService.getHistory(mockUser, { page: 1, pageSize: 20 });
    
    expect(result.data.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.data[0]!.productReferenceCode).toBe('PRC-1');
    expect(mockRpc).toHaveBeenCalledWith('get_qr_history', expect.objectContaining({
      p_user_id: mockUser,
      p_is_admin: false,
      p_limit: 20,
      p_offset: 0
    }));
  });

  it('retrieves record detail for authorized users', async () => {
    vi.mocked(AuthorizationService.hasPermission).mockImplementation(async (perm) => perm === 'qr.create');
    
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        id: 'qr-1',
        status: 'GENERATED',
        created_at: '2026-01-01',
        created_by: mockUser,
        payload: { test: true },
        payload_version: '1',
        product_reference_code: 'PRC-1',
        sscc: 'SSCC-1',
        form: { id: 'f1', name: 'Form 1' },
        form_version: { id: 'v1', version_number: 1 },
        fields: [{ field_key: 'test', label: 'Test', field_type: 'short_text', sort_order: 1, value: 'Hello' }]
      },
      error: null
    });
    
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { full_name: 'Worker Name', email: 'worker@test.com' } })
        })
      })
    });

    (createClient as any).mockResolvedValue({ rpc: mockRpc, from: mockFrom });

    const result = await QRHistoryService.getRecord(mockUser, 'qr-1');
    expect(result.productReferenceCode).toBe('PRC-1');
    expect(result.fields[0]!.value).toBe('Hello');
  });
});
