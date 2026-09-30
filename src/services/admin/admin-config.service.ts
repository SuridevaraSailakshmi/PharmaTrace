
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';

export interface SSCCConfigRecord {
  id: string;
  gs1CompanyPrefix: string;
  extensionDigit: string;
  isActive: boolean;
  createdAt: string;
}

export interface SystemSettingRecord {
  key: string;
  value: string | boolean;
  description: string;
  updatedAt: string;
}

export class AdminConfigService {
  
  static async getActiveSSCCConfig(_adminId: string): Promise<SSCCConfigRecord | null> {
    const isAdmin = await AuthorizationService.hasRole('ADMIN');
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sscc_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows
      throw new Error(error.message);
    }

    const row = data as unknown as { id: string; gs1_company_prefix: string; extension_digit: string; is_active: boolean; created_at: string };
    return {
      id: row.id,
      gs1CompanyPrefix: row.gs1_company_prefix,
      extensionDigit: row.extension_digit,
      isActive: row.is_active,
      createdAt: row.created_at
    };
  }

  static async setActiveSSCCConfig(
    adminId: string,
    companyPrefix: string,
    extensionDigit: string
  ): Promise<string> {
    const isAdmin = await AuthorizationService.hasRole('ADMIN');
    if (!isAdmin) throw new Error('Unauthorized');

    // Basic length validation (GS1 prefixes are typically 6-12 digits)
    if (!companyPrefix || !/^\d{6,12}$/.test(companyPrefix)) {
      throw new Error('Invalid GS1 Company Prefix format. Must be 6-12 digits.');
    }
    if (!/^\d$/.test(extensionDigit)) {
      throw new Error('Extension digit must be a single digit (0-9).');
    }

    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)('set_active_sscc_config', {
      p_company_prefix: companyPrefix,
      p_extension_digit: extensionDigit,
      p_admin_id: adminId
    });

    if (error) throw new Error(error.message);
    return data;
  }

  static async getSystemSettings(_adminId: string): Promise<SystemSettingRecord[]> {
    const isAdmin = await AuthorizationService.hasRole('ADMIN');
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();
    const { data, error } = await (supabase.rpc as any)('get_system_settings');
    if (error) throw new Error(error.message);

    return (data || []).map((s: any) => ({
      key: s.key,
      value: s.value,
      description: s.description,
      updatedAt: s.updated_at
    }));
  }

  static async updateSystemSetting(adminId: string, key: string, value: string | boolean): Promise<void> {
    const isAdmin = await AuthorizationService.hasRole('ADMIN');
    if (!isAdmin) throw new Error('Unauthorized');

    // Strict validation for allowed V1 settings keys
    const allowedKeys = ['app_name', 'default_timezone', 'maintenance_mode'];
    if (!allowedKeys.includes(key)) {
      throw new Error('Attempting to update restricted or unknown setting key.');
    }

    const supabase = await createClient();
    const { error } = await (supabase.rpc as any)('update_system_setting', {
      p_key: key,
      p_value: value,
      p_admin_id: adminId
    });

    if (error) throw new Error(error.message);
  }
}
