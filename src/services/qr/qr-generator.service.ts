import QRCode from 'qrcode';
import { QRGenerationResult } from './qr.types';

export class QRGeneratorService {
  /**
   * Generates a deterministic SVG QR code from the provided payload string.
   * 
   * @param payload The canonical, validated string payload.
   */
  static async generateSvg(payload: string): Promise<QRGenerationResult> {
    if (!payload || payload.trim() === '') {
      throw new Error('Cannot generate QR code for an empty payload.');
    }

    try {
      // Deterministic QR generation options:
      // errorCorrectionLevel 'H' guarantees ~30% damage resistance, ideal for pharma/industrial.
      // margin: 1 gives a tight SVG.
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      return {
        svg: svgString,
        payload
      };
    } catch (error: unknown) {
      throw new Error(`QR generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generates a deterministic PNG QR code base64 Data URL.
   */
  static async generatePng(payload: string): Promise<string> {
    if (!payload || payload.trim() === '') {
      throw new Error('Cannot generate QR code for an empty payload.');
    }

    try {
      const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      return dataUrl;
    } catch (error: unknown) {
      throw new Error(`QR generation failed: ${(error as Error).message}`);
    }
  }
}
