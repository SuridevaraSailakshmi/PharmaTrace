import { createClient } from '@/lib/supabase/server';
import { SSCCUtils } from './sscc.utils';

export interface SSCCConfiguration {
  id: string;
  gs1_company_prefix: string;
  extension_digit: string;
  is_active: boolean;
  environment: 'production' | 'development';
}

export class SSCCService {
  /**
   * Retrieves the currently active SSCC configuration.
   */
  static async getActiveConfiguration(): Promise<SSCCConfiguration> {
    const supabase = await createClient();
    const { data: config, error } = await supabase
      .from('sscc_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !config) {
      throw new Error('No active SSCC configuration found.');
    }

    return config as SSCCConfiguration;
  }

  /**
   * Generates a new authoritative SSCC code safely using atomic DB mechanisms.
   */
  static async generateSscc(): Promise<string> {
    const config = await this.getActiveConfiguration();

    // Configuration Security & Validation
    if (config.environment === 'production') {
      if (!config.gs1_company_prefix || config.gs1_company_prefix.trim() === '') {
         throw new Error('GS1 Company Prefix is not configured for production SSCC generation.');
      }
    }

    if (!SSCCUtils.isValidCompanyPrefix(config.gs1_company_prefix)) {
      throw new Error('Invalid GS1 Company Prefix configured.');
    }

    if (!SSCCUtils.isValidExtensionDigit(config.extension_digit)) {
      throw new Error('Invalid Extension Digit configured.');
    }

    const supabase = await createClient();
    
    // Atomic allocation of the serial reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('increment_sscc_sequence', {
      conf_id: config.id
    });

    if (error) {
      if (error.message.includes('SSCC_SEQUENCE_EXHAUSTED')) {
        throw new Error('SSCC sequence exhausted for the active configuration.');
      }
      if (error.message.includes('SSCC_SEQUENCE_NOT_FOUND')) {
        throw new Error('Sequence tracking not initialized for the active configuration.');
      }
      throw new Error(`Failed to allocate SSCC serial: ${error.message}`);
    }

    const serialValue = data;

    if (typeof serialValue !== 'number') {
      throw new Error('Invalid serial value returned from database sequence.');
    }

    // Construct final 18 digit SSCC
    const sscc = SSCCUtils.generateSscc(
      config.extension_digit,
      config.gs1_company_prefix,
      serialValue
    );

    // Final sanity check
    if (!SSCCUtils.isValidSscc(sscc)) {
      throw new Error('Generated SSCC failed structural validation.');
    }

    return sscc;
  }
}
