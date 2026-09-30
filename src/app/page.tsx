import { redirect } from 'next/navigation';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';

export default async function HomePage() {
  let user;
  try {
    user = await AuthorizationService.requireActiveUser();
  } catch {
    user = null;
  }
  
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
