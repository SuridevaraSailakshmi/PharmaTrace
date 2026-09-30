import { createClient } from '@/lib/supabase/server';

/**
 * Service responsible for authoritative generation and validation of 
 * Product Reference Codes (PRC).
 * 
 * Rules:
 * - Format: PRC-YYYY-NNNNNN
 * - Sequence is scoped per calendar year.
 * - Sequence is atomic, gaplessness is not strictly guaranteed, but uniqueness is absolute.
 * - Generation MUST happen server-side.
 */
export class ProductReferenceService {
  /**
   * Generates a new authoritative Product Reference Code safely using
   * the database's internal sequence mechanisms.
   */
  static async generatePrc(): Promise<string> {
    const supabase = await createClient();
    
    // Using the RPC function to guarantee atomicity and concurrency safety.
    const { data, error } = await supabase.rpc('generate_next_prc');

    if (error) {
      if (error.message.includes('PRC_SEQUENCE_EXHAUSTED')) {
         throw new Error('PRC sequence exhausted for the current year.');
      }
      throw new Error(`Failed to generate PRC: ${error.message}`);
    }

    if (!data || typeof data !== 'string') {
       throw new Error('Invalid response from PRC generator.');
    }

    return data;
  }

  /**
   * Validates the exact PRC format: PRC-YYYY-NNNNNN
   */
  static isValidPrc(prc: string): boolean {
    // Format: PRC-YYYY-NNNNNN
    // YYYY must be exactly 4 digits.
    // NNNNNN must be exactly 6 digits.
    const prcRegex = /^PRC-\d{4}-\d{6}$/;
    
    if (!prcRegex.test(prc)) {
      return false;
    }

    // Additional sanity checks: 
    // sequence component cannot be 000000
    const sequencePart = prc.split('-')[2];
    if (sequencePart === '000000') {
      return false;
    }

    return true;
  }
}
