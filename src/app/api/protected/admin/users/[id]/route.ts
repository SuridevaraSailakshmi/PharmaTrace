import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdminUserService } from '@/services/admin/admin-user.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const body = await request.json();
    
    if (typeof body.roleId !== 'string' || typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid input payload' }, { status: 400 });
    }

    await AdminUserService.updateUser(user.id, resolvedParams.id, body.roleId as 'ADMIN' | 'WORKER', body.isActive);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /admin/users/[id] PATCH error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (e.message.includes('last active ADMIN')) {
      return NextResponse.json({ error: 'Cannot demote or deactivate the last active ADMIN' }, { status: 400 });
    }

    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
