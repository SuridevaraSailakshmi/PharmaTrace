import { createClient } from '@/lib/supabase/server';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { FormsService } from '../forms/forms.service';
import { SSCCService } from '../sscc/sscc.service';
import { QRPayloadService } from '../qr/qr-payload.service';
import { QRGeneratorService } from '../qr/qr-generator.service';

export interface TraceabilityGenerationRequest {
  formId: string;
  formData: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface TraceabilityGenerationResult {
  qrRecordId: string;
  submissionId: string;
  productReferenceCode: string;
  sscc: string;
  qrPayload: string; // JSON string representation
  qrRepresentationSvg: string; // SVG image
  qrRepresentationPng: string; // PNG base64
  createdAt: string;
}

export class TraceabilityService {
  /**
   * Final atomic Traceability Transaction Workflow.
   * Performs authorization, form validation, and QR preparation before executing a SINGLE atomic
   * PostgreSQL RPC (`persist_traceability_record`) that increments sequence numbers for PRC & SSCC,
   * inserts the submission, submission values snapshot, PRC record, SSCC record, QR record, and audit log atomically.
   */
  static async submitAndGenerateQr(
    userId: string,
    request: TraceabilityGenerationRequest
  ): Promise<TraceabilityGenerationResult> {
    // 1. Authorization: Only permitted workers can generate QRs
    const isAuthorized = await AuthorizationService.hasPermission('qr.create');
    if (!isAuthorized) {
      throw new Error('Unauthorized to generate QR records');
    }

    const supabase = await createClient();

    // 2. Idempotency Check
    const requestHash = JSON.stringify({
      formId: request.formId,
      formData: request.formData
    });

    interface IdempotencyClient {
      from(table: 'traceability_idempotency'): {
        select(query: string): {
          eq(col: string, val: string): {
            eq(col: string, val: string): {
              single(): Promise<{ data: { request_hash: string; response_payload: TraceabilityGenerationResult } | null }>
            }
          }
        },
        insert(data: Record<string, unknown>): Promise<void>
      }
    }
    const idempotencyClient = supabase as unknown as IdempotencyClient;

    if (request.idempotencyKey) {
      const { data: existingIdempotency } = await idempotencyClient
        .from('traceability_idempotency')
        .select('response_payload,request_hash')
        .eq('user_id', userId)
        .eq('idempotency_key', request.idempotencyKey)
        .single();

      if (existingIdempotency) {
        if (existingIdempotency.request_hash !== requestHash) {
          throw new Error('IDEMPOTENCY_CONFLICT: Same key provided with different request payload');
        }
        return existingIdempotency.response_payload as TraceabilityGenerationResult;
      }
    }

    // 3. Validate Form (Single Form)
    const formDefinition = await FormsService.getFormById(userId, request.formId);

    // Map provided formData to snapshot metadata for persistence.
    // The historical record is fully self-contained using this metadata.
    const submissionValues: Array<{ field_key: string; label: string; field_type: string; sort_order: number; value: string | null }> = [];
    for (const field of formDefinition.fields) {
      if (field.fieldType === 'system_generated') continue;

      const val = request.formData[field.fieldKey];
      if (field.isRequired && (val === undefined || val === null || val === '')) {
        throw new Error(`Missing required field: ${field.label}`);
      }
      submissionValues.push({
        field_key: field.fieldKey,
        label: field.label,
        field_type: field.fieldType,
        sort_order: field.sortOrder,
        value: val !== undefined && val !== null ? String(val) : null
      });
    }

    // 4. Obtain Active SSCC Config
    const ssccConfig = await SSCCService.getActiveConfiguration();

    // 5. Pre-build template QR Payload with temporary placeholders for memory SVG generation validation
    const tempPrc = 'PRC-9999-999999';
    const tempSscc = '000000000000000000';
    const qrPayloadStr = QRPayloadService.buildPayload(
      formDefinition,
      request.formData,
      tempPrc,
      tempSscc
    );
    const urlObj = new URL(qrPayloadStr);
    const dataParam = urlObj.searchParams.get('data');
    const qrPayloadObj = JSON.parse(decodeURIComponent(dataParam || '{}'));

    // 6. Generate QR Images safely in memory before starting DB transaction
    await QRGeneratorService.generateSvg(qrPayloadStr);
    await QRGeneratorService.generatePng(qrPayloadStr);

    // 7. Execute Single Atomic DB RPC Transaction
    interface RpcClient {
      rpc(fn: 'persist_traceability_record', args: Record<string, unknown>): Promise<{ data: string | null, error: Error | null }>
    }
    const rpcClient = supabase as unknown as RpcClient;

    const { data: qrRecordId, error } = await rpcClient.rpc('persist_traceability_record', {
      p_form_id: request.formId,
      p_user_id: userId,
      p_sscc_config_id: ssccConfig.id,
      p_extension_digit: ssccConfig.extension_digit,
      p_company_prefix: ssccConfig.gs1_company_prefix,
      p_qr_payload: qrPayloadObj,
      p_qr_payload_version: '1',
      p_submission_values: submissionValues as unknown as Record<string, unknown>
    });

    if (error || !qrRecordId) {
      throw new Error(`Failed to persist traceability record atomically: ${error?.message || 'Empty response'}`);
    }

    // Now fetch the created records to return PRC/SSCC
    const { data: qrRecord, error: fetchError } = await (supabase
      .from('qr_records')
      .select('id, submission_id, created_at, product_references(code), sscc_records(sscc)')
      .eq('id', qrRecordId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single() as any);

    if (fetchError || !qrRecord) {
      throw new Error('Failed to retrieve newly created QR record');
    }

    const prcCode = (qrRecord.product_references as unknown as {code: string}).code;
    const ssccCode = (qrRecord.sscc_records as unknown as {sscc: string}).sscc;

    // Re-render QR SVGs/PNGs with exact generated PRC & SSCC for return payload
    const finalQrPayloadStr = QRPayloadService.buildPayload(
      formDefinition,
      request.formData,
      prcCode,
      ssccCode
    );

    const finalSvg = await QRGeneratorService.generateSvg(finalQrPayloadStr);
    const finalPng = await QRGeneratorService.generatePng(finalQrPayloadStr);

    const result: TraceabilityGenerationResult = {
      qrRecordId: qrRecord.id,
      submissionId: qrRecord.submission_id,
      productReferenceCode: prcCode,
      sscc: ssccCode,
      qrPayload: finalQrPayloadStr,
      qrRepresentationSvg: finalSvg.svg,
      qrRepresentationPng: finalPng,
      createdAt: qrRecord.created_at
    };

    // 8. Idempotency Completion
    if (request.idempotencyKey) {
      await idempotencyClient
        .from('traceability_idempotency')
        .insert({
          user_id: userId,
          idempotency_key: request.idempotencyKey,
          request_hash: requestHash,
          response_payload: result
        } as Record<string, unknown>);
    }

    return result;
  }
}
