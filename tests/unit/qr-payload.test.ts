import { describe, it, expect } from 'vitest';
import { QRPayloadService } from '@/services/qr/qr-payload.service';
import { FormDefinition } from '@/types/forms';

describe('QRPayloadService', () => {
  const mockForm: FormDefinition = {
    id: 'form-1',
    name: 'Test Form',
    description: null,
    fields: [
      { id: 'f1', label: 'Field 1', fieldKey: 'f1', fieldType: 'short_text', isRequired: true, sortOrder: 1, includeInQr: true, config: {} },
      { id: 'f2', label: 'Field 2', fieldKey: 'f2', fieldType: 'short_text', isRequired: false, sortOrder: 2, includeInQr: false, config: {} },
      { id: 'f3', label: 'PRC', fieldKey: 'product_reference_code', fieldType: 'system_generated', isRequired: true, sortOrder: 3, includeInQr: true, config: {} },
      { id: 'f4', label: 'SSCC', fieldKey: 'sscc', fieldType: 'system_generated', isRequired: true, sortOrder: 4, includeInQr: true, config: {} },
      { id: 'f5', label: 'Field 5', fieldKey: 'f5', fieldType: 'integer', isRequired: false, sortOrder: 5, includeInQr: true, config: {} },
    ]
  };

  const validPrc = 'PRC-2026-000001';
  const validSscc = '006141411234567890'; // 18 digits. Let's make sure it's valid SSCC.
  // wait, earlier I tested: 00614141123456789 -> check digit 0. 
  // So '006141411234567890' is valid.

  it('builds a valid deterministic payload', () => {
    const formData = {
      f1: 'test_value',
      f2: 'hidden_value',
      f5: 42
    };

    const payloadResult = QRPayloadService.buildPayload(mockForm, formData, validPrc, validSscc);
    const parsed = JSON.parse(payloadResult.jsonPayload);

    expect(parsed.v).toBe(1);
    expect(parsed.prc).toBe(validPrc);
    expect(parsed.sscc).toBe(validSscc);
    expect(parsed.data).toBeDefined();
    expect(parsed.data.f1).toBe('test_value');
    expect(parsed.data.f5).toBe(42);

    // f2 is explicitly omitted via includeInQr: false
    expect(parsed.data.f2).toBeUndefined();

    // prc and sscc are NOT duplicated inside data
    expect(parsed.data.product_reference_code).toBeUndefined();
    expect(parsed.data.sscc).toBeUndefined();
    
    // Check readableText
    expect(payloadResult.readableText).toContain('PRC: ' + validPrc);
    expect(payloadResult.readableText).toContain('SSCC: ' + validSscc);
    expect(payloadResult.readableText).toContain('Field 1: test_value');
    expect(payloadResult.readableText).not.toContain('Field 2:');
  });

  it('preserves null for missing included values', () => {
    const formData = {
      f1: 'test_value'
      // f5 is missing
    };

    const payloadResult = QRPayloadService.buildPayload(mockForm, formData, validPrc, validSscc);
    const parsed = JSON.parse(payloadResult.jsonPayload);

    expect(parsed.data.f5).toBeNull(); // Missing but included
  });

  it('preserves meaningful false or zero values', () => {
    const formData = {
      f1: 'test_value',
      f5: 0
    };

    const payloadResult = QRPayloadService.buildPayload(mockForm, formData, validPrc, validSscc);
    const parsed = JSON.parse(payloadResult.jsonPayload);

    expect(parsed.data.f5).toBe(0);
  });

  it('rejects invalid PRC', () => {
    const formData = { f1: 'test' };
    expect(() => QRPayloadService.buildPayload(mockForm, formData, 'INVALID_PRC', validSscc)).toThrow('Invalid Product Reference Code');
  });

  it('rejects invalid SSCC', () => {
    const formData = { f1: 'test' };
    expect(() => QRPayloadService.buildPayload(mockForm, formData, validPrc, '123')).toThrow('Invalid SSCC');
  });

  it('is deterministic based on field sortOrder regardless of object insertion', () => {
    // Reverse sortOrder in mock form 2
    const mockForm2: FormDefinition = {
      ...mockForm,
      fields: [
        { id: 'f5', label: 'Field 5', fieldKey: 'f5', fieldType: 'integer', isRequired: false, sortOrder: 5, includeInQr: true, config: {} },
        { id: 'f1', label: 'Field 1', fieldKey: 'f1', fieldType: 'short_text', isRequired: true, sortOrder: 1, includeInQr: true, config: {} },
      ]
    };

    const formData1 = { f1: 'A', f5: 1 };
    const formData2 = { f5: 1, f1: 'A' }; // Reverse key order

    const payload1 = QRPayloadService.buildPayload(mockForm2, formData1, validPrc, validSscc);
    const payload2 = QRPayloadService.buildPayload(mockForm2, formData2, validPrc, validSscc);

    expect(payload1.jsonPayload).toBe(payload2.jsonPayload);
  });
});
