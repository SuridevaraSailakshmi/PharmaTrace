/**
 * PharmaTrace — Application constants
 */

/** Application metadata */
export const APP_NAME = 'PharmaTrace' as const;
export const APP_DESCRIPTION = 'Pharmaceutical QR, SSCC & Product Traceability Management System' as const;

/** Roles */
export const ROLES = {
  ADMIN: 'ADMIN',
  WORKER: 'WORKER',
} as const;

/** Product Reference Code format */
export const PRC_PREFIX = 'PRC' as const;
export const PRC_SEPARATOR = '-' as const;

/**
 * SSCC — Serial Shipping Container Code
 *
 * WARNING: No production GS1 Company Prefix is hard-coded anywhere in this
 * codebase. The real prefix must be configured through system settings.
 * Until configured, SSCC generation runs in DEVELOPMENT mode only.
 */
export const SSCC_LENGTH = 18 as const;
export const SSCC_DEVELOPMENT_PREFIX = 'DEV' as const;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20 as const;
export const MAX_PAGE_SIZE = 100 as const;

/** QR payload version */
export const QR_PAYLOAD_VERSION = '1.0' as const;

/** Route paths */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SUBMISSIONS: '/dashboard/submissions',
  NEW_SUBMISSION: '/dashboard/submissions/new',
  USERS: '/admin/users',
  FORMS: '/admin/forms',
  SETTINGS: '/admin/settings',
  AUDIT_LOGS: '/admin/audit',
} as const;

/** API route paths */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  SUBMISSIONS: '/api/submissions',
  USERS: '/api/users',
  FORMS: '/api/forms',
  SETTINGS: '/api/settings',
  AUDIT_LOGS: '/api/audit-logs',
} as const;
