/**
 * PharmaTrace — Supabase server client
 *
 * Creates a Supabase client for use in server components,
 * route handlers, and server actions.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if middleware is refreshing user sessions.
          }
        },
      },
    },
  );
}

/**
 * Creates a privileged Supabase client using the Service Role Key.
 *
 * IMPORTANT SECURITY RULES:
 * 1. ONLY use this for explicit server-side atomic operations that require bypassing RLS
 *    (e.g., generating Product Reference Codes, SSCCs, or registering users).
 * 2. NEVER expose the client, its key, or its direct responses to the browser.
 * 3. ALWAYS manually authorize the application user BEFORE using this client.
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to create a service client.');
  }

  // Service role client bypasses RLS and shouldn't handle user cookies
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for service role
        },
      },
    },
  );
}
