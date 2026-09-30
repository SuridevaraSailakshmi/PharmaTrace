/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SSCCUtils } from '@/services/sscc/sscc.utils';
import { SSCCService } from '@/services/sscc/sscc.service';

// Mock the createClient from supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('SSCCUtils', () => {
  describe('calculateCheckDigit', () => {
    it('calculates GS1 check digit correctly (GS1 provided vector)', () => {
      // 0 + 0614141 + 123456789 -> extension 0, company 0614141 (7), serial 123456789 (9)
      const body = '00614141123456789'; // 17 digits
      const checkDigit = SSCCUtils.calculateCheckDigit(body);
      expect(checkDigit).toBe('0'); 
    });

    it('calculates GS1 check digit correctly (Alternative vector)', () => {
      // 1 + 1234567 + 000000001
      const body = '11234567000000001';
      // weights:
      // 1(3) 1(1) 2(3) 3(1) 4(3) 5(1) 6(3) 7(1) 0(3) 0(1) 0(3) 0(1) 0(3) 0(1) 0(3) 0(1) 1(3)
      // 3 + 1 + 6 + 3 + 12 + 5 + 18 + 7 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 3 = 58
      // 10 - (58 % 10) = 10 - 8 = 2
      const checkDigit = SSCCUtils.calculateCheckDigit(body);
      expect(checkDigit).toBe('2');
    });

    it('throws if body is not 17 digits', () => {
      expect(() => SSCCUtils.calculateCheckDigit('123')).toThrow('exactly 17 digits');
    });
  });

  describe('generateSscc & isValidSscc', () => {
    it('generates a full SSCC and validates it', () => {
      const extension = '1';
      const company = '1234567';
      const serial = 1;
      
      const sscc = SSCCUtils.generateSscc(extension, company, serial);
      expect(sscc).toHaveLength(18);
      expect(sscc.substring(0, 8)).toBe('11234567');
      expect(sscc.substring(8, 17)).toBe('000000001');
      expect(sscc[17]).toBe('2');
      
      expect(SSCCUtils.isValidSscc(sscc)).toBe(true);
    });

    it('returns false for invalid check digit', () => {
      const valid = SSCCUtils.generateSscc('1', '1234567', 1); // ends with 2
      const invalid = valid.substring(0, 17) + '3'; // alter check digit
      expect(SSCCUtils.isValidSscc(invalid)).toBe(false);
    });

    it('returns false for wrong length', () => {
      expect(SSCCUtils.isValidSscc('12345678901234567')).toBe(false); // 17
      expect(SSCCUtils.isValidSscc('1234567890123456789')).toBe(false); // 19
    });

    it('returns false for non-numeric', () => {
      expect(SSCCUtils.isValidSscc('A23456789012345678')).toBe(false);
    });
  });

  describe('calculateMaxSerial', () => {
    it('calculates properly', () => {
      expect(SSCCUtils.calculateMaxSerial(7)).toBe(999999999);
      expect(SSCCUtils.calculateMaxSerial(9)).toBe(9999999);
      expect(SSCCUtils.calculateMaxSerial(12)).toBe(9999);
    });
    
    it('throws on invalid length', () => {
      expect(() => SSCCUtils.calculateMaxSerial(4)).toThrow();
      expect(() => SSCCUtils.calculateMaxSerial(13)).toThrow();
    });
  });
});

describe('SSCCService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockConfig = {
    id: 'config-1',
    gs1_company_prefix: '1234567',
    extension_digit: '1',
    is_active: true,
    environment: 'production'
  };

  it('generates SSCC successfully', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: 1, error: null });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockConfig, error: null })
      })
    });
    
    (createClient as any).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      rpc: mockRpc
    });

    const sscc = await SSCCService.generateSscc();
    expect(sscc).toBe('112345670000000012');
    expect(mockRpc).toHaveBeenCalledWith('increment_sscc_sequence', { conf_id: 'config-1' });
  });

  it('fails if production but company prefix is missing', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { ...mockConfig, gs1_company_prefix: '' }, error: null })
      })
    });
    
    (createClient as any).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect })
    });

    await expect(SSCCService.generateSscc()).rejects.toThrow('GS1 Company Prefix is not configured for production');
  });

  it('handles sequence exhaustion', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'SSCC_SEQUENCE_EXHAUSTED' } });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockConfig, error: null })
      })
    });
    
    (createClient as any).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      rpc: mockRpc
    });

    await expect(SSCCService.generateSscc()).rejects.toThrow('SSCC sequence exhausted');
  });
});
