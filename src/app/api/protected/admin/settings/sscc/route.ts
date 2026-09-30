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

    const result = await AdminConfigService.getActiveSSCCConfig(user.id);
    return NextResponse.json(result || { exists: false });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /admin/settings/sscc GET error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to load SSCC config.' }, { status: 500 });
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
    
    if (typeof body.companyPrefix !== 'string' || typeof body.extensionDigit !== 'string') {
      return NextResponse.json({ error: 'Invalid input payload' }, { status: 400 });
    }

    const newId = await AdminConfigService.setActiveSSCCConfig(user.id, body.companyPrefix, body.extensionDigit);

    return NextResponse.json({ success: true, id: newId });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /admin/settings/sscc PATCH error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
