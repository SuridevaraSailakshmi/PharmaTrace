import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AdminConfigService } from '@/services/admin/admin-config.service';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await AdminConfigService.getSystemSettings(user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /admin/settings GET error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    if (typeof body.key !== 'string' || body.value === undefined) {
      return NextResponse.json({ error: 'Invalid input payload' }, { status: 400 });
    }

    await AdminConfigService.updateSystemSetting(user.id, body.key, body.value);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /admin/settings PATCH error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
