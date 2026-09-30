import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdminUserService } from '@/services/admin/admin-user.service';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const roleId = searchParams.get('roleId') || undefined;
    const isActiveStr = searchParams.get('isActive');
    const isActive = isActiveStr === 'true' ? true : (isActiveStr === 'false' ? false : undefined);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await AdminUserService.getUsers(user.id, {
      search,
      roleId,
      isActive,
      page,
      pageSize
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /admin/users GET error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to load users.' }, { status: 500 });
  }
}
