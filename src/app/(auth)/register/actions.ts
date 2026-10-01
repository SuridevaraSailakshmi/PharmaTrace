'use server';

import { createServiceClient } from '@/lib/supabase/server';

export async function register(formData: FormData): Promise<{ error?: string; success?: boolean; autoActivated?: boolean }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  
  if (!email || !password || !fullName) {
    return { error: 'Email, password, and full name are required' };
  }

  const requestedRole = formData.get('roleId') as string || 'WORKER';

  const supabase = createServiceClient();

  // Check if any active admin exists
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role_id', 'ADMIN')
    .eq('is_active', true);

  const isFirstAdmin = count === 0 && requestedRole === 'ADMIN';

  // Create user via Admin API (avoids signing them in automatically)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: authError.message };
  }

  const user = authData.user;

  // Insert into public.users
  const { error: dbError } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      role_id: requestedRole,
      is_active: isFirstAdmin, // First admin is active, others require verification
    } as any);

  if (dbError) {
    // Rollback auth user creation if database insert fails
    await supabase.auth.admin.deleteUser(user.id);
    return { error: 'Failed to create user profile. Please try again.' };
  }

  return { success: true, autoActivated: isFirstAdmin };
}
