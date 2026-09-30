/**
 * PharmaTrace — Database entity types
 *
 * Generated/Updated from the authoritative Supabase migrations.
 * These types represent the source of truth for the database schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          details: Json | null;
          id: string;
          ip_address: string | null;
          resource_id: string;
          resource_type: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id: string;
          resource_type: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string;
          resource_type?: string;
          user_id?: string | null;
        };
      };
      form_field_options: {
        Row: {
          field_id: string;
          id: string;
          label: string;
          sort_order: number;
          value: string;
        };
        Insert: {
          field_id: string;
          id?: string;
          label: string;
          sort_order: number;
          value: string;
        };
        Update: {
          field_id?: string;
          id?: string;
          label?: string;
          sort_order?: number;
          value?: string;
        };
      };
      form_fields: {
        Row: {
          config: Json | null;
          field_key: string;
          field_type: string;
          form_id: string;
          id: string;
          include_in_qr: boolean;
          is_required: boolean;
          label: string;
          sort_order: number;
        };
        Insert: {
          config?: Json | null;
          field_key: string;
          field_type: string;
          form_id: string;
          id?: string;
          include_in_qr?: boolean;
          is_required?: boolean;
          label: string;
          sort_order: number;
        };
        Update: {
          config?: Json | null;
          field_key?: string;
          field_type?: string;
          form_id?: string;
          id?: string;
          include_in_qr?: boolean;
          is_required?: boolean;
          label?: string;
          sort_order?: number;
        };
      };
      form_submissions: {
        Row: {
          created_at: string;
          form_id: string;
          id: string;
          product_reference_id: string | null;
          qr_record_id: string | null;
          sscc_record_id: string | null;
          status: string;
          submitted_by: string;
        };
        Insert: {
          created_at?: string;
          form_id: string;
          id?: string;
          product_reference_id?: string | null;
          qr_record_id?: string | null;
          sscc_record_id?: string | null;
          status?: string;
          submitted_by: string;
        };
        Update: {
          created_at?: string;
          form_id?: string;
          id?: string;
          product_reference_id?: string | null;
          qr_record_id?: string | null;
          sscc_record_id?: string | null;
          status?: string;
          submitted_by?: string;
        };
      };

      forms: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      permissions: {
        Row: {
          description: string | null;
          id: string;
        };
        Insert: {
          description?: string | null;
          id: string;
        };
        Update: {
          description?: string | null;
          id?: string;
        };
      };
      product_references: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          submission_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          submission_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          submission_id?: string;
        };
      };
      qr_records: {
        Row: {
          created_at: string;
          created_by: string;
          form_id: string;
          id: string;
          payload: Json;
          payload_version: string;
          product_reference_id: string;
          sscc_record_id: string;
          status: string;
          submission_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          form_id: string;
          id?: string;
          payload: Json;
          payload_version: string;
          product_reference_id: string;
          sscc_record_id: string;
          status?: string;
          submission_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          form_id?: string;
          id?: string;
          payload?: Json;
          payload_version?: string;
          product_reference_id?: string;
          sscc_record_id?: string;
          status?: string;
          submission_id?: string;
        };
      };
      role_permissions: {
        Row: {
          permission_id: string;
          role_id: string;
        };
        Insert: {
          permission_id: string;
          role_id: string;
        };
        Update: {
          permission_id?: string;
          role_id?: string;
        };
      };
      roles: {
        Row: {
          description: string | null;
          id: string;
        };
        Insert: {
          description?: string | null;
          id: string;
        };
        Update: {
          description?: string | null;
          id?: string;
        };
      };
      sscc_configurations: {
        Row: {
          created_at: string;
          created_by: string | null;
          extension_digit: string;
          gs1_company_prefix: string;
          id: string;
          is_active: boolean;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          extension_digit?: string;
          gs1_company_prefix: string;
          id?: string;
          is_active?: boolean;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          extension_digit?: string;
          gs1_company_prefix?: string;
          id?: string;
          is_active?: boolean;
        };
      };
      sscc_records: {
        Row: {
          configuration_id: string | null;
          created_at: string;
          id: string;
          sscc: string;
          submission_id: string;
        };
        Insert: {
          configuration_id?: string | null;
          created_at?: string;
          id?: string;
          sscc: string;
          submission_id: string;
        };
        Update: {
          configuration_id?: string | null;
          created_at?: string;
          id?: string;
          sscc?: string;
          submission_id?: string;
        };
      };
      sscc_sequences: {
        Row: {
          configuration_id: string;
          current_value: number;
          max_value: number;
          updated_at: string;
        };
        Insert: {
          configuration_id: string;
          current_value?: number;
          max_value: number;
          updated_at?: string;
        };
        Update: {
          configuration_id?: string;
          current_value?: number;
          max_value?: number;
          updated_at?: string;
        };
      };
      submission_values: {
        Row: {
          field_id: string | null;
          field_key: string;
          field_type: string;
          id: string;
          label: string;
          sort_order: number;
          submission_id: string;
          value: string | null;
        };
        Insert: {
          field_id?: string | null;
          field_key: string;
          field_type: string;
          id?: string;
          label: string;
          sort_order: number;
          submission_id: string;
          value?: string | null;
        };
        Update: {
          field_id?: string | null;
          field_key?: string;
          field_type?: string;
          id?: string;
          label?: string;
          sort_order?: number;
          submission_id?: string;
          value?: string | null;
        };
      };
      system_settings: {
        Row: {
          description: string | null;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          description?: string | null;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          description?: string | null;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean;
          role_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          role_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          role_id?: string | null;
          updated_at?: string;
        };
      };
      traceability_idempotency: {
        Row: {
          idempotency_key: string;
          user_id: string;
          request_hash: string;
          resulting_qr_record_id: string;
          resulting_submission_id: string;
          response_payload: Json;
          created_at: string;
        };
        Insert: {
          idempotency_key: string;
          user_id: string;
          request_hash: string;
          resulting_qr_record_id: string;
          resulting_submission_id: string;
          response_payload: Json;
          created_at?: string;
        };
        Update: {
          idempotency_key?: string;
          user_id?: string;
          request_hash?: string;
          resulting_qr_record_id?: string;
          resulting_submission_id?: string;
          response_payload?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      persist_traceability_record: {
        Args: {
          p_form_id: string;
          p_user_id: string;
          p_sscc_config_id: string;
          p_extension_digit: string;
          p_company_prefix: string;
          p_qr_payload: Json;
          p_qr_payload_version: string;
          p_submission_values: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
