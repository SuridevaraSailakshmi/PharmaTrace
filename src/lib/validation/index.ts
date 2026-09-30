/**
 * PharmaTrace — Validation schemas (Zod)
 *
 * Shared Zod schemas used across the application.
 * Feature-specific schemas should be co-located with their features.
 */

import { z } from 'zod';

/** Pagination query parameters */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/** UUID parameter */
export const uuidSchema = z.string().uuid('Invalid ID format');

/** Email validation */
export const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

/** Non-empty trimmed string */
export const requiredStringSchema = z.string().trim().min(1, 'This field is required');

/** Date string validation (ISO 8601) */
export const dateStringSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' },
);
