import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TraceabilityService } from '@/services/traceability/traceability.service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.formId || !body.formData) {
      return NextResponse.json({ error: 'Missing required request payload (formId, formData)' }, { status: 400 });
    }

    const idempotencyKey = request.headers.get('idempotency-key') || request.headers.get('x-idempotency-key') || body.idempotencyKey;

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const dynamicBaseUrl = `${protocol}://${host}`;

    const result = await TraceabilityService.submitAndGenerateQr(user.id, {
      formId: body.formId,
      formData: body.formData,
      idempotencyKey: idempotencyKey || undefined,
      baseUrl: dynamicBaseUrl
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /qr/generate error:', e.message);

    if (e.message.includes('IDEMPOTENCY_CONFLICT')) {
      return NextResponse.json({ error: 'Idempotency key reused with a different request payload.' }, { status: 409 });
    }

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized to perform this action' }, { status: 403 });
    }

    if (e.message.includes('Missing required field') || e.message.includes('Invalid')) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // Default server error
    return NextResponse.json({ error: 'Failed to generate traceability record. ' + e.message }, { status: 500 });
  }
}
