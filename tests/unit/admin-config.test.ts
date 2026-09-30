/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminConfigService } from '@/services/admin/admin-config.service';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/auth/AuthorizationService');
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('AdminConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdmin = 'admin-1';
  const mockWorker = 'worker-1';

  it('rejects worker from fetching SSCC config', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(false);
    await expect(AdminConfigService.getActiveSSCCConfig(mockWorker))
      .rejects.toThrow('Unauthorized');
  });

  it('rejects invalid GS1 prefix length', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(true);
    await expect(AdminConfigService.setActiveSSCCConfig(mockAdmin, '123', '0'))
      .rejects.toThrow('Invalid GS1 Company Prefix format');
  });

  it('rejects invalid extension digit', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(true);
    await expect(AdminConfigService.setActiveSSCCConfig(mockAdmin, '0614141', '10'))
      .rejects.toThrow('Extension digit must be a single digit (0-9).');
  });

  it('allows admin to set valid SSCC config', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(true);
    const mockRpc = vi.fn().mockResolvedValue({ data: 'new-uuid', error: null });
    (createClient as any).mockResolvedValue({ rpc: mockRpc });

    const res = await AdminConfigService.setActiveSSCCConfig(mockAdmin, '0614141', '0');
    expect(res).toBe('new-uuid');
    expect(mockRpc).toHaveBeenCalledWith('set_active_sscc_config', expect.objectContaining({
      p_company_prefix: '0614141',
      p_extension_digit: '0'
    }));
  });

  it('rejects unknown system settings update', async () => {
    vi.mocked(AuthorizationService.hasRole).mockResolvedValue(true);
    await expect(AdminConfigService.updateSystemSetting(mockAdmin, 'hacked_key', true))
      .rejects.toThrow('Attempting to update restricted or unknown setting key.');
  });
});
