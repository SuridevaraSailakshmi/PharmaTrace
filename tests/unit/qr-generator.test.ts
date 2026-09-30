import { describe, it, expect } from 'vitest';
import { QRGeneratorService } from '@/services/qr/qr-generator.service';

describe('QRGeneratorService', () => {
  const dummyPayload = JSON.stringify({
    v: 1,
    prc: 'PRC-2026-000001',
    sscc: '006141411234567890',
    data: { foo: 'bar' }
  });

  describe('generateSvg', () => {
    it('generates a valid SVG string', async () => {
      const result = await QRGeneratorService.generateSvg(dummyPayload);
      
      expect(result.payload).toBe(dummyPayload);
      expect(result.svg).toBeDefined();
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
    });

    it('throws error for empty payload', async () => {
      await expect(QRGeneratorService.generateSvg('')).rejects.toThrow('Cannot generate QR code for an empty payload');
      await expect(QRGeneratorService.generateSvg('   ')).rejects.toThrow('Cannot generate QR code for an empty payload');
    });
  });

  describe('generatePng', () => {
    it('generates a valid base64 PNG data url', async () => {
      const dataUrl = await QRGeneratorService.generatePng(dummyPayload);
      
      expect(dataUrl).toBeDefined();
      expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('throws error for empty payload', async () => {
      await expect(QRGeneratorService.generatePng('')).rejects.toThrow('Cannot generate QR code for an empty payload');
    });
  });
});
