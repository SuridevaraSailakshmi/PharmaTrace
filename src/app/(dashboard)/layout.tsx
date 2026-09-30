import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { AppShell } from '@/components/layout/AppShell';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await AuthorizationService.requireActiveUser();
  } catch {
    redirect('/login');
  }

  return (
    <AppShell userRole={user.roleId}>
      {children}
    </AppShell>
  );
}
