import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Health check endpoint for deployment verification.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    application: 'PharmaTrace',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
}
