/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductReferenceService } from '@/services/product-reference/product-reference.service';

// Mock the createClient from supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('ProductReferenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePrc', () => {
    it('generates a PRC correctly through the DB RPC', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: 'PRC-2026-000001', error: null });
      (createClient as any).mockResolvedValue({ rpc: mockRpc });

      const prc = await ProductReferenceService.generatePrc();
      
      expect(mockRpc).toHaveBeenCalledWith('generate_next_prc');
      expect(prc).toBe('PRC-2026-000001');
    });

    it('throws error if the sequence is exhausted', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'PRC_SEQUENCE_EXHAUSTED' } });
      (createClient as any).mockResolvedValue({ rpc: mockRpc });

      await expect(ProductReferenceService.generatePrc()).rejects.toThrow('PRC sequence exhausted');
    });

    it('throws error on database failure', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB connection error' } });
      (createClient as any).mockResolvedValue({ rpc: mockRpc });

      await expect(ProductReferenceService.generatePrc()).rejects.toThrow('Failed to generate PRC: DB connection error');
    });

    it('throws error if data is missing or invalid', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: 12345, error: null });
      (createClient as any).mockResolvedValue({ rpc: mockRpc });

      await expect(ProductReferenceService.generatePrc()).rejects.toThrow('Invalid response from PRC generator');
    });
  });

  describe('isValidPrc', () => {
    it('returns true for valid PRCs', () => {
      expect(ProductReferenceService.isValidPrc('PRC-2026-000001')).toBe(true);
      expect(ProductReferenceService.isValidPrc('PRC-2026-123456')).toBe(true);
      expect(ProductReferenceService.isValidPrc('PRC-2027-999999')).toBe(true);
    });

    it('returns false for PRCs with invalid prefixes', () => {
      expect(ProductReferenceService.isValidPrc('ABC-2026-000001')).toBe(false);
      expect(ProductReferenceService.isValidPrc('prc-2026-000001')).toBe(false);
      expect(ProductReferenceService.isValidPrc('PRC_2026_000001')).toBe(false);
    });

    it('returns false for PRCs with invalid years', () => {
      expect(ProductReferenceService.isValidPrc('PRC-26-000001')).toBe(false); // Short year
      expect(ProductReferenceService.isValidPrc('PRC-20265-000001')).toBe(false); // Long year
    });

    it('returns false for PRCs with invalid sequence numbers', () => {
      expect(ProductReferenceService.isValidPrc('PRC-2026-1')).toBe(false); // Missing padding
      expect(ProductReferenceService.isValidPrc('PRC-2026-0000001')).toBe(false); // Too many digits
      expect(ProductReferenceService.isValidPrc('PRC-2026-ABCDEF')).toBe(false); // Not numeric
    });

    it('returns false for 000000 sequence', () => {
      expect(ProductReferenceService.isValidPrc('PRC-2026-000000')).toBe(false);
    });

    it('returns false for malformed formats', () => {
      expect(ProductReferenceService.isValidPrc('PRC2026000001')).toBe(false);
      expect(ProductReferenceService.isValidPrc(' PRC-2026-000001 ')).toBe(false);
    });
  });
});
