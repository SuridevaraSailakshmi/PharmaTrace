/**
 * PharmaTrace — SSCC types
 *
 * Types for Serial Shipping Container Code (SSCC) generation.
 *
 * SSCC structure (18 digits):
 *   Extension Digit (1) + GS1 Company Prefix (variable) + Serial Reference (variable) + Check Digit (1)
 *   Total = 18 digits always.
 *
 * The GS1 Company Prefix MUST be configured from the real company's
 * GS1 registration. No placeholder or invented prefix is used.
 * Until a real prefix is configured, SSCC generation operates
 * in DEVELOPMENT mode and produces clearly-marked non-production codes.
 */

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

/** SSCC environment mode */
export type SsccMode = 'DEVELOPMENT' | 'PRODUCTION';

/**
 * SSCC configuration stored in system settings.
 *
 * In DEVELOPMENT mode:
 *   - gs1CompanyPrefix is null (not configured)
 *   - Generated SSCCs are prefixed/flagged as non-production
 *
 * In PRODUCTION mode:
 *   - gs1CompanyPrefix must be the company's real, registered GS1 prefix
 *   - Extension digit must be formally specified
 *   - Generated SSCCs are valid for shipping
 */
export interface SsccConfig {
  /** Current operating mode — derived from whether a real prefix is configured */
  mode: SsccMode;
  /** GS1 Company Prefix — null until real prefix is configured */
  gs1CompanyPrefix: string | null;
  /** Extension digit (0–9) */
  extensionDigit: string;
  /**
   * Length of the serial reference portion.
   * Determined by: 16 - length(gs1CompanyPrefix) = serial reference length.
   * (18 total - 1 extension - 1 check digit = 16 for prefix + serial)
   */
  serialReferenceLength: number;
}

// ──────────────────────────────────────────────
// Generation
// ──────────────────────────────────────────────

/** SSCC generation result */
export interface SsccGenerationResult {
  /** Full 18-digit SSCC */
  sscc: string;
  /** Whether this is a development-only SSCC */
  isDevelopment: boolean;
  /** Components */
  extensionDigit: string;
  gs1CompanyPrefix: string;
  serialReference: string;
  checkDigit: string;
}

/** SSCC validation result */
export interface SsccValidationResult {
  isValid: boolean;
  errors: string[];
}
