'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LabelRenderer } from '@/components/qr/LabelRenderer';
import { QRPayload } from '@/services/qr/qr.types';
import { Card } from '@/components/ui/card';
import { useRef } from 'react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<QRPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState('auto');
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!payload || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const padding = window.innerWidth >= 640 ? 64 : 32;
        const availableWidth = entry.contentRect.width - padding;
        if (availableWidth > 0 && availableWidth < 800) {
          const newScale = availableWidth / 800;
          setScale(newScale);
          if (labelRef.current) {
            const paddingY = window.innerWidth >= 640 ? 64 : 32;
            const scaledLabelHeight = labelRef.current.offsetHeight * newScale;
            setScaledHeight(`${scaledLabelHeight + paddingY}px`);
          }
        } else {
          setScale(1);
          setScaledHeight('auto');
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [payload]);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      setError('No QR data found in the URL.');
      return;
    }

    try {
      // Next.js searchParams already URL-decodes the parameter value, so we do NOT use decodeURIComponent
      const parsed = JSON.parse(dataParam) as QRPayload;
      
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
      
      <div 
        ref={containerRef}
        className="bg-[var(--color-bg-secondary)] p-0 sm:p-0 rounded-xl shadow-inner border border-slate-200 print-mode overflow-hidden max-w-full flex justify-center w-full"
      >
        <div className="w-full p-4 sm:p-8 flex justify-center" style={{ height: scale < 1 ? scaledHeight : 'auto' }}>
          <div 
            className="origin-top" 
            style={{ 
              transform: `scale(${scale})`, 
              width: '800px'
            }}
          >
            <div ref={labelRef} className="bg-white inline-block shadow-lg ring-1 ring-slate-900/5">
              <LabelRenderer 
                qrSvg=""
                prc={payload.prc}
                payloadData={payload.data as Record<string, string | number>}
              />
            </div>
          </div>
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
