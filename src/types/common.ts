/**
 * PharmaTrace — Common shared types
 *
 * Types used across multiple features and services.
 */

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/** API error structure */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Pagination metadata */
export interface ApiMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Pagination request parameters */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Sort parameter */
export interface SortParams {
  field: string;
  direction: SortDirection;
}

/** Timestamp fields present on all database records */
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

/** Soft-delete field */
export interface SoftDeletable {
  deleted_at: string | null;
}
