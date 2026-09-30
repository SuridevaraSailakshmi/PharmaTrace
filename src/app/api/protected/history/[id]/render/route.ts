import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QRHistoryService } from '@/services/history/history.service';
import { QRGeneratorService } from '@/services/qr/qr-generator.service';

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

    // Fetch the detail record
    const result = await QRHistoryService.getRecord(user.id, resolvedParams.id);
    
    // Construct the payload exact same way as generation to make it a scannable URL
    const jsonString = JSON.stringify(result.payload);
    const base64UrlString = Buffer.from(jsonString).toString('base64url');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const payloadStr = `${baseUrl}/verify?data=${base64UrlString}`;

    // Regenerate QR representation cleanly (deterministic generation guarantees identical matrix)
    const svgRes = await QRGeneratorService.generateSvg(payloadStr);

    return NextResponse.json({ svg: svgRes.svg });
  } catch (error: unknown) {
    const e = error as Error;
    console.error('[API] /history/[id]/render error:', e.message);

    if (e.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized to view this record' }, { status: 403 });
    }

    if (e.message.includes('Record not found')) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to render QR representation.' }, { status: 500 });
  }
}
