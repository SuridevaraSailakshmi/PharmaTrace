import { FormDefinition } from '@/types/forms';
import { ProductReferenceService } from '../product-reference/product-reference.service';
import { SSCCUtils } from '../sscc/sscc.utils';
import { QRPayload } from './qr.types';

export class QRPayloadService {
  /**
   * Constructs the deterministic canonical QR Payload format for PharmaTrace.
   * 
   * @param formDefinition The server-authorized form definition.
   * @param formData The validated form data (key-value pairs).
   * @param prc The authoritative server-generated Product Reference Code.
   * @param sscc The authoritative server-generated SSCC.
   * @param requestBaseUrl Optional dynamic base URL from request headers.
   */
  static buildPayload(
    formDefinition: FormDefinition,
    formData: Record<string, unknown>,
    prc: string,
    sscc: string,
    requestBaseUrl?: string
  ): { jsonPayload: string; readableText: string } {
    if (!ProductReferenceService.isValidPrc(prc)) {
      throw new Error('Invalid Product Reference Code provided to QR Payload Builder.');
    }

    if (!SSCCUtils.isValidSscc(sscc)) {
      throw new Error('Invalid SSCC provided to QR Payload Builder.');
    }

    const qrData: Record<string, string | number | boolean | null> = {};

    // 1. Sort fields deterministically by sortOrder to guarantee identical ordering
    const sortedFields = [...formDefinition.fields].sort((a, b) => a.sortOrder - b.sortOrder);

    // 2. Map form data according to includeInQr configuration
    for (const field of sortedFields) {
      if (!field.includeInQr) continue;

      // Ensure PRC and SSCC are exclusively at the root, not duplicated in data
      if (field.fieldKey === 'prc' || field.fieldKey === 'sscc') continue;

      const rawValue = formData[field.fieldKey];

      // Canonicalization rules:
      // undefined becomes null to ensure presence of configured fields
      qrData[field.fieldKey] = rawValue === undefined ? null : (rawValue as string | number | boolean | null);
    }

    // 3. Construct root payload
    const payloadObject: QRPayload = {
      v: 1,
      prc,
      sscc,
      data: qrData
    };

    // 4. Return strictly deterministic JSON serialization and readable text.
    const jsonPayload = JSON.stringify(payloadObject, null, 2);

    // Build readable text for Google Scanner
    const lines = [];
    lines.push('PHARMATRACE RECORD');
    lines.push(`PRC: ${prc}`);
    lines.push(`SSCC: ${sscc}`);
    lines.push('---');
    for (const field of sortedFields) {
      if (!field.includeInQr) continue;
      if (field.fieldKey === 'prc' || field.fieldKey === 'sscc') continue;
      
      const rawValue = formData[field.fieldKey];
      lines.push(`${field.label}: ${rawValue || 'N/A'}`);
    }
    const readableText = lines.join('\n');

    return { jsonPayload, readableText };
  }
}
