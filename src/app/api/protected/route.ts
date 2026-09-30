import { NextResponse } from 'next/server';
import { AuthorizationService } from '@/lib/auth/AuthorizationService';

export async function GET() {
  try {
    // API independently enforces authorization.
    // Example: only someone with 'forms.view' can access this.
    const user = await AuthorizationService.requirePermission('forms.view');
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'You have accessed a protected API endpoint.',
        user: { id: user.id, role: user.roleId }
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED') {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
      }
      if (error.message === 'INACTIVE_USER') {
        return NextResponse.json({ error: 'User is inactive' }, { status: 403 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
