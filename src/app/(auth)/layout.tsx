/**
 * Auth group layout — will wrap login/signup pages.
 */
import { AuthorizationService } from '@/lib/auth/AuthorizationService';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await AuthorizationService.getCurrentUser();
  if (user && user.isActive) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)]">
      {children}
    </div>
  );
}
