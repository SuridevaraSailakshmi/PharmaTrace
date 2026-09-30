import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QRHistoryService } from '@/services/history/history.service';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const formId = searchParams.get('formId') || undefined;
    const createdBy = searchParams.get('createdBy') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await QRHistoryService.getHistory(user.id, {
      search,
      status,
      formId,
      createdBy,
      dateFrom,
      dateTo,
      page,
      pageSize
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /history error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized to view history' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to load history.' }, { status: 500 });
  }
}
