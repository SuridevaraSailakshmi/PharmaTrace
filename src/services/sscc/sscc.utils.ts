/**
 * Pure functions for SSCC computation and validation.
 */

export class SSCCUtils {
  /**
   * Calculates the check digit for a 17-digit SSCC body according to GS1 standards.
   * Right-to-left alternating weights of 3 and 1.
   */
  static calculateCheckDigit(body: string): string {
    if (!/^\d{17}$/.test(body)) {
      throw new Error('SSCC body must be exactly 17 digits');
    }

    let sum = 0;
    // Iterate from right to left (index 16 down to 0)
    for (let i = 16; i >= 0; i--) {
      const char = body[i];
      if (!char) throw new Error('Invalid body length');
      const digit = parseInt(char, 10);
      // Even position from right gets weight 3, odd gets 1.
      // Since we are zero-indexed and starting from 16:
      // index 16 is rightmost -> weight 3
      // index 15 is next -> weight 1
      const weight = (16 - i) % 2 === 0 ? 3 : 1;
      sum += digit * weight;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  /**
   * Validates if a string is a formally valid 18-digit SSCC.
   */
  static isValidSscc(sscc: string): boolean {
    if (!/^\d{18}$/.test(sscc)) {
      return false;
    }

    const body = sscc.substring(0, 17);
    const providedCheckDigit = sscc[17];
    const expectedCheckDigit = this.calculateCheckDigit(body);

    return providedCheckDigit === expectedCheckDigit;
  }

  /**
   * Validates if a GS1 Company Prefix is well-formed.
   * Usually between 6 and 12 digits for SSCC.
   */
  static isValidCompanyPrefix(prefix: string): boolean {
    // Basic structural validation: only digits, 5 to 12 length
    return /^\d{5,12}$/.test(prefix);
  }

  /**
   * Validates the extension digit.
   */
  static isValidExtensionDigit(ext: string): boolean {
    return /^\d{1}$/.test(ext);
  }

  /**
   * Calculates max serial reference dynamically based on company prefix length.
   * Length is 16 - prefix_length.
   */
  static calculateMaxSerial(prefixLength: number): number {
    if (prefixLength < 5 || prefixLength > 12) {
      throw new Error('Invalid GS1 Company Prefix length');
    }
    const serialLength = 16 - prefixLength;
    return Math.pow(10, serialLength) - 1;
  }

  /**
   * Constructs the 17 digit body.
   */
  static constructBody(extensionDigit: string, companyPrefix: string, serialValue: number): string {
    const serialLength = 16 - companyPrefix.length;
    const serialString = serialValue.toString().padStart(serialLength, '0');
    if (serialString.length > serialLength) {
      throw new Error('Serial value exceeds maximum allowed length for this prefix');
    }
    
    const body = `${extensionDigit}${companyPrefix}${serialString}`;
    return body;
  }

  /**
   * Generates the final 18 digit SSCC.
   */
  static generateSscc(extensionDigit: string, companyPrefix: string, serialValue: number): string {
    const body = this.constructBody(extensionDigit, companyPrefix, serialValue);
    const checkDigit = this.calculateCheckDigit(body);
    return `${body}${checkDigit}`;
  }
}
