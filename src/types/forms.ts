/**
 * PharmaTrace — Form-related types
 *
 * Types for form engine, form fields, and form submissions.
 */

export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'time'
  | 'datetime'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'multi_select'
  | 'file'
  | 'image'
  | 'section'
  | 'system_generated';

export type FormStatus = 'draft' | 'published' | 'archived';
/** Form field configuration */
export interface FormFieldConfig {
  placeholder?: string;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  options?: FormFieldOption[];
  validationPattern?: string;
  helpText?: string;
}

/** Option for dropdown, radio, multi-select fields */
export interface FormFieldOption {
  label: string;
  value: string;
}

/** Form field definition for rendering */
export interface FormFieldDefinition {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: FormFieldType;
  isRequired: boolean;
  sortOrder: number;
  includeInQr?: boolean;
  config: FormFieldConfig;
}

/** Complete form definition for rendering */
export interface FormDefinition {
  id: string;
  name: string;
  description: string | null;
  fields: FormFieldDefinition[];
}

/** Form submission values (key-value pairs from user input) */
export type FormSubmissionValues = Record<string, unknown>;

/** Form submission request */
export interface FormSubmissionRequest {
  formId: string;
  values: FormSubmissionValues;
}

/** Form submission result */
export interface FormSubmissionResult {
  submissionId: string;
  productReferenceCode: string;
  sscc: string;
  qrPayload: Record<string, unknown>;
  qrDataUrl: string;
}
