/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';

export interface QRHistoryQuery {
  search?: string;
  status?: string;
  formId?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export interface QRHistoryRecord {
  id: string;
  productReferenceCode: string;
  sscc: string;
  productName: string | null;
  batchNo: string | null;
  status: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface QRHistoryResponse {
  data: QRHistoryRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface QRDetailRecord {
  id: string;
  status: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  payload: Record<string, unknown>;
  payloadVersion: string;
  productReferenceCode: string;
  sscc: string;
  form: { id: string; name: string };
  fields: Array<{
    fieldKey: string;
    label: string;
    fieldType: string;
    sortOrder: number;
    value: string | null;
  }>;
}

export class QRHistoryService {
  /**
   * Retrieves a paginated, filtered list of QR traceability records.
   */
  static async getHistory(userId: string, query: QRHistoryQuery): Promise<QRHistoryResponse> {
    const isWorker = await AuthorizationService.hasPermission('qr.create');
    const isAdmin = await AuthorizationService.hasPermission('forms.create'); // Proxy for admin access

    if (!isWorker && !isAdmin) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    const limit = query.pageSize > 0 && query.pageSize <= 100 ? query.pageSize : 20;
    const offset = (query.page > 0 ? query.page - 1 : 0) * limit;

    const { data, error } = await (supabase.rpc as any)('get_qr_history', {
      p_search: query.search || null,
      p_status: query.status || null,
      p_form_id: query.formId || null,
      p_created_by: query.createdBy || null,
      p_date_from: query.dateFrom || null,
      p_date_to: query.dateTo || null,
      p_limit: limit,
      p_offset: offset,
      p_user_id: userId,
      p_is_admin: isAdmin
    });

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }

    const records = data || [];
    const totalCount = records.length > 0 ? Number(records[0]?.total_count || 0) : 0;

    // Fetch user names
    let usersMap: Record<string, string> = {};
    if (records.length > 0) {
      const userIds = [...new Set(records.map((r: any) => r.created_by).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);
          
        if (usersData) {
          usersMap = usersData.reduce((acc: any, u: any) => {
            acc[u.id] = u.full_name || u.email;
            return acc;
          }, {});
        }
      }
    }

    return {
      data: records.map((r: any) => ({
        id: r.id,
        productReferenceCode: r.product_reference_code,
        sscc: r.sscc,
        productName: r.product_name,
        batchNo: r.batch_no,
        status: r.status,
        createdAt: r.created_at,
        createdBy: r.created_by,
        createdByName: usersMap[r.created_by] || r.created_by,
      })),
      total: totalCount,
      page: query.page,
      pageSize: limit,
      hasNext: offset + limit < totalCount,
      hasPrevious: query.page > 1
    };
  }

  /**
   * Retrieves full details for a specific QR Traceability Record.
   */
  static async getRecord(userId: string, qrId: string): Promise<QRDetailRecord> {
    const isWorker = await AuthorizationService.hasPermission('qr.create');
    const isAdmin = await AuthorizationService.hasPermission('forms.create');

    if (!isWorker && !isAdmin) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    const { data, error } = await (supabase.rpc as any)('get_qr_detail', {
      p_qr_id: qrId,
      p_user_id: userId,
      p_is_admin: isAdmin
    });

    if (error || !data) {
      throw new Error(error ? `Failed to fetch detail: ${error.message}` : 'Record not found or unauthorized');
    }

    let createdByName = data.created_by;
    if (data.created_by) {
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', data.created_by)
        .single();
      if (userData) {
        const u = userData as any;
        createdByName = u.full_name || u.email;
      }
    }

    // Map to camelCase
    return {
      id: data.id,
      status: data.status,
      createdAt: data.created_at,
      createdBy: data.created_by,
      createdByName,
      payload: data.payload,
      payloadVersion: data.payload_version,
      productReferenceCode: data.product_reference_code,
      sscc: data.sscc,
      form: data.form,
      fields: data.fields.map((f: any) => ({
        fieldKey: f.field_key,
        label: f.label,
        fieldType: f.field_type,
        sortOrder: f.sort_order,
        value: f.value
      }))
    };
  }
}
