import { z } from 'zod';

/**
 * Server-only Environment Schema
 * Secrets and variables that MUST NOT be exposed to the client bundle.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is missing'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Public Environment Schema
 * Variables prefixed with NEXT_PUBLIC_ accessible in both client and server bundles.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing'),
  NEXT_PUBLIC_APP_NAME: z.string().default('PharmaTrace'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
});

/**
 * Validates server-side environment variables.
 * Safe for server runtime; throws sanitised error if validation fails without exposing secret values.
 */
export function validateServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv cannot be called on the client side.');
  }

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const issueKeys = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`[Server Environment Validation Failed]: Missing or invalid keys: ${issueKeys}`);
  }
  return result.data;
}

/**
 * Validates public environment variables accessible on both client and server.
 */
export function validatePublicEnv() {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const issueKeys = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`[Public Environment Validation Failed]: Missing or invalid keys: ${issueKeys}`);
  }
  return result.data;
}
