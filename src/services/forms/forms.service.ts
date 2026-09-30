/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { FormDefinition, FormFieldDefinition } from '@/types/forms';

export class FormsService {
  /**
   * Get a list of all forms based on user's authorization.
   */
  static async getForms(_userId: string): Promise<FormDefinition[]> {
    const isWorker = await AuthorizationService.hasPermission('qr.create');
    const isAdmin = await AuthorizationService.hasPermission('forms.create');

    if (!isAdmin && !isWorker) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    const { data, error } = await (supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false }) as any);
    
    if (error) {
      throw new Error(`Failed to fetch forms: ${error.message}`);
    }

    return (data || []).map((form: any) => ({
      id: form.id,
      name: form.name,
      description: form.description,
      fields: [], // Fields not loaded in list view
    }));
  }

  /**
   * Get the active operational form definition
   */
  static async getActiveForm(_userId: string): Promise<FormDefinition> {
    const isWorker = await AuthorizationService.hasPermission('qr.create');
    const isAdmin = await AuthorizationService.hasPermission('forms.view');

    if (!isAdmin && !isWorker) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    // Since there is only one operational form in PharmaTrace V1, just select the first one.
    const { data: form, error: formError } = await (supabase
      .from('forms')
      .select('*')
      .limit(1)
      .single() as any);

    if (formError || !form) {
      throw new Error(`Form not found: ${formError?.message || 'Unknown error'}`);
    }

    return this.getFormById(_userId, form.id);
  }

  /**
   * Create a new form (Admin only).
   */
  static async createForm(userId: string, name: string, description: string | null): Promise<string> {
    const hasPermission = await AuthorizationService.hasPermission('forms.create');
    if (!hasPermission) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    // Insert form
    const { data: form, error: formError } = await (supabase
      .from('forms')
      .insert({
        name,
        description,
        created_by: userId,
      } as any)
      .select('id')
      .single() as any);

    if (formError || !form) {
      throw new Error(`Failed to create form: ${formError?.message}`);
    }

    return form.id;
  }

  /**
   * Get a specific form by ID with its fields.
   */
  static async getFormById(_userId: string, formId: string): Promise<FormDefinition> {
    const isWorker = await AuthorizationService.hasPermission('qr.create');
    const isAdmin = await AuthorizationService.hasPermission('forms.view');

    if (!isAdmin && !isWorker) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    const { data: form, error: formError } = await (supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single() as any);

    if (formError || !form) {
      throw new Error(`Form not found: ${formError?.message || 'Unknown error'}`);
    }

    const { data: fields, error: fieldsError } = await (supabase
      .from('form_fields')
      .select('*, form_field_options(*)')
      .eq('form_id', formId)
      .order('sort_order', { ascending: true }) as any);

    if (fieldsError) {
      throw new Error(`Failed to fetch fields: ${fieldsError.message}`);
    }

    return {
      id: form.id,
      name: form.name,
      description: form.description,
      fields: (fields || []).map((f: any) => ({
        id: f.id,
        label: f.label,
        fieldKey: f.field_key,
        fieldType: f.field_type as any,
        isRequired: f.is_required,
        sortOrder: f.sort_order,
        config: {
          ...((f.config as any) || {}),
          ...(f.form_field_options?.length > 0 
            ? { options: f.form_field_options
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((o: any) => ({ label: o.label, value: o.value })) 
              } 
            : {})
        },
        includeInQr: f.include_in_qr
      }))
    };
  }

  /**
   * Update the form structure directly (Admin only).
   */
  static async updateFormFields(userId: string, formId: string, fields: Omit<FormFieldDefinition, 'id'>[]): Promise<void> {
    const hasPermission = await AuthorizationService.hasPermission('forms.edit');
    if (!hasPermission) {
      throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    // In a real application we would use an RPC or transaction for absolute safety.
    // For this rewrite, we will replace the fields directly.
    await supabase.from('form_fields').delete().eq('form_id', formId);

    // Insert new fields
    if (fields.length > 0) {
      const { error: fieldsError } = await ((supabase.from('form_fields') as any).insert(
        fields.map((f, i) => ({
          form_id: formId,
          label: f.label,
          field_key: f.fieldKey,
          field_type: f.fieldType,
          is_required: f.isRequired,
          sort_order: f.sortOrder || i + 1,
          include_in_qr: (f as any).includeInQr || false,
          config: f.config as any
        }))
      ) as any);

      if (fieldsError) {
        throw new Error(`Failed to update fields: ${fieldsError.message}`);
      }
    }

    // Log audit
    await (supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'FORM_UPDATED',
      resource_type: 'forms',
      resource_id: formId,
      details: { field_count: fields.length }
    } as any) as any);
  }
}
