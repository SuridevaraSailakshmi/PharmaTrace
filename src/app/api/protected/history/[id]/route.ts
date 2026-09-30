import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QRHistoryService } from '@/services/history/history.service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In Next.js 16.3+ params is a Promise. We must await it.
    const resolvedParams = await params;

    const result = await QRHistoryService.getRecord(user.id, resolvedParams.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /history/[id] error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized to view this record' }, { status: 403 });
    }

    if (e.message.includes('Record not found')) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to load record details.' }, { status: 500 });
  }
}
