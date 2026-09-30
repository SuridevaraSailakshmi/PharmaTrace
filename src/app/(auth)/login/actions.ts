'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Verify the application user profile exists and is active
  const { data: authData } = await supabase.auth.getUser();
  if (authData?.user) {
    const { data: appUser, error: dbError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', authData.user.id)
      .single();

    if (dbError || !appUser) {
      // Missing profile or database error (e.g., table not created)
      await supabase.auth.signOut();
      return { error: 'Your account is pending configuration or missing a profile. Please contact the administrator.' };
    }

    if (!(appUser as { is_active: boolean }).is_active) {
      await supabase.auth.signOut();
      return { error: 'Your account has been deactivated.' };
    }
  }

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
