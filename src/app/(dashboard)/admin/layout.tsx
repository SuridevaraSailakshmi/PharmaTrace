import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await AuthorizationService.hasRole('ADMIN');
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
