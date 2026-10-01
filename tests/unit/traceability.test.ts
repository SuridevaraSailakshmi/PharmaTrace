/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TraceabilityService } from '@/services/traceability/traceability.service';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { FormsService } from '@/services/forms/forms.service';
import { SSCCService } from '@/services/sscc/sscc.service';
import { QRPayloadService } from '@/services/qr/qr-payload.service';
import { QRGeneratorService } from '@/services/qr/qr-generator.service';

// Mock dependencies
vi.mock('@/lib/auth/AuthorizationService');
vi.mock('@/services/forms/forms.service');
vi.mock('@/services/sscc/sscc.service');
vi.mock('@/services/qr/qr-payload.service');
vi.mock('@/services/qr/qr-generator.service');
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

describe('TraceabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = 'worker-1';
  const mockRequest = {
    formId: 'f1',
    formData: {
      name: 'Test Product'
    }
  };

  const mockFormDef = {
    id: 'f1',
    fields: [
      { id: 'field1', fieldKey: 'name', fieldType: 'short_text', isRequired: true, label: 'Name' },
      { id: 'field2', fieldKey: 'prc', fieldType: 'system_generated' }
    ]
  };

  it('generates traceability transaction successfully with atomic RPC', async () => {
    vi.mocked(AuthorizationService.hasPermission).mockResolvedValue(true);
    vi.mocked(FormsService.getFormById).mockResolvedValue(mockFormDef as any);
    vi.mocked(SSCCService.getActiveConfiguration).mockResolvedValue({
      id: 'conf1',
      extension_digit: '0',
      gs1_company_prefix: '0614141'
    } as any);
    vi.mocked(QRPayloadService.buildPayload).mockReturnValue({
      jsonPayload: '{}',
      readableText: 'mock readable text'
    });
    vi.mocked(QRGeneratorService.generateSvg).mockResolvedValue({ svg: '<svg/>', payload: '' });
    vi.mocked(QRGeneratorService.generatePng).mockResolvedValue('data:image/png');

    const mockRpc = vi.fn().mockResolvedValue({
      data: [{
        qr_record_id: 'qr-rec-1',
        submission_id: 'sub-1',
        prc: 'PRC-2026-000001',
        sscc: '006141410000000011'
      }],
      error: null
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: { 
              id: 'qr-rec-1', 
              submission_id: 'sub-1', 
              created_at: '2026-09-29T00:00:00.000Z',
              product_references: { code: 'PRC-2026-000001' },
              sscc_records: { sscc: '006141410000000011' }
            }, 
            error: null 
          })
        })
      })
    });

    (createClient as any).mockResolvedValue({ rpc: mockRpc, from: mockFrom });

    const result = await TraceabilityService.submitAndGenerateQr(mockUser, mockRequest);

    expect(result.qrRecordId).toBe('qr-rec-1');
    expect(result.submissionId).toBe('sub-1');
    expect(result.productReferenceCode).toBe('PRC-2026-000001');
    expect(result.sscc).toBe('006141410000000011');
    expect(mockRpc).toHaveBeenCalledWith('persist_traceability_record', expect.objectContaining({
      p_form_id: 'f1',
      p_user_id: mockUser,
      p_extension_digit: '0',
      p_company_prefix: '0614141'
    }));
  });

  it('rejects unauthorized users', async () => {
    vi.mocked(AuthorizationService.hasPermission).mockResolvedValue(false);
    await expect(TraceabilityService.submitAndGenerateQr(mockUser, mockRequest))
      .rejects.toThrow('Unauthorized to generate QR records');
  });



  it('rejects missing required fields', async () => {
    vi.mocked(AuthorizationService.hasPermission).mockResolvedValue(true);
    vi.mocked(FormsService.getFormById).mockResolvedValue(mockFormDef as any);
    
    await expect(TraceabilityService.submitAndGenerateQr(mockUser, {
      ...mockRequest,
      formData: {} // missing required 'name'
    })).rejects.toThrow('Missing required field: Name');
  });

  it('handles idempotency duplicate request returning cached result', async () => {
    vi.mocked(AuthorizationService.hasPermission).mockResolvedValue(true);

    const cachedResult = {
      qrRecordId: 'cached-qr-1',
      submissionId: 'cached-sub-1',
      productReferenceCode: 'PRC-2026-000001',
      sscc: '006141410000000011',
      qrPayload: '{}',
      qrRepresentationSvg: '<svg/>',
      qrRepresentationPng: 'data:image/png',
      createdAt: '2026-09-29T00:00:00.000Z'
    };

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                request_hash: JSON.stringify({ formId: 'f1', formData: { name: 'Test Product' } }),
                response_payload: cachedResult
              },
              error: null
            })
          })
        })
      })
    });

    (createClient as any).mockResolvedValue({ from: mockFrom });

    const result = await TraceabilityService.submitAndGenerateQr(mockUser, {
      ...mockRequest,
      idempotencyKey: 'key-123'
    });

    expect(result).toEqual(cachedResult);
  });
});
