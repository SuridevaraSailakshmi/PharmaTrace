/**
 * PharmaTrace — QR-related types
 *
 * Types for QR payload building and QR generation.
 */

/** QR payload structure */
export interface QrPayload {
  version: string;
  productReferenceCode: string;
  sscc: string;
  formData: Record<string, unknown>;
  generatedAt: string;
}

/** QR generation options */
export interface QrGenerationOptions {
  width?: number;
  height?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  format?: 'png' | 'svg';
}

/** QR generation result */
export interface QrGenerationResult {
  dataUrl: string;
  payload: QrPayload;
}
