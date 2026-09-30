'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LabelRenderer } from '@/components/qr/LabelRenderer';
import { QRPayload } from '@/services/qr/qr.types';
import { Card } from '@/components/ui/card';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<QRPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      setError('No QR data found in the URL.');
      return;
    }

    try {
      const decoded = decodeURIComponent(dataParam);
      const parsed = JSON.parse(decoded) as QRPayload;
      
      if (!parsed.v || !parsed.prc || !parsed.sscc || !parsed.data) {
        throw new Error('Invalid QR payload format.');
      }
      
      setPayload(parsed);
    } catch (e) {
      setError('Failed to decode or parse QR data.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="p-6 border-red-200 bg-red-50 text-red-700 text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Verification Error</h2>
          <p>{error}</p>
        </Card>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <p className="text-slate-500 font-medium">Decoding Traceability Record...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Verified Traceability Record</h1>
        <p className="text-slate-600">This digital record represents an immutable snapshot of the product.</p>
      </div>
      
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-xl border border-slate-200 overflow-x-auto max-w-full">
        <div className="inline-block min-w-max">
          <LabelRenderer 
            qrSvg=""
            prc={payload.prc}
            payloadData={payload.data as Record<string, string | number>}
          />
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center p-4">
        <p className="text-slate-500 font-medium">Loading Verification Engine...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
