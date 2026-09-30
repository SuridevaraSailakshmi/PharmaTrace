'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LabelRenderer } from '@/components/qr/LabelRenderer';
import { useRef } from 'react';

interface FormField {
  label: string;
  fieldKey: string;
  fieldType: string;
  value?: string;
}

interface HistoryRecord {
  id: string;
  createdAt: string;
  status: string;
  productReferenceCode: string;
  sscc: string;
  form: { name: string };
  fields: FormField[];
  payload: Record<string, unknown>;
  createdByName?: string;
}

export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [record, setRecord] = useState<HistoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState('auto');
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!record || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const padding = window.innerWidth >= 640 ? 64 : 32;
        const availableWidth = entry.contentRect.width - padding;
        if (availableWidth > 0 && availableWidth < 800) {
          const newScale = availableWidth / 800;
          setScale(newScale);
          if (labelRef.current) {
            setScaledHeight(`${labelRef.current.offsetHeight * newScale}px`);
          }
        } else {
          setScale(1);
          setScaledHeight('auto');
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [record]);

  const fetchRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/protected/history/${id}`);
      if (!res.ok) throw new Error('Failed to fetch record');
      const data = await res.json();
      setRecord(data);

      const svgRes = await fetch(`/api/protected/history/${id}/render`);
      if (svgRes.ok) {
        const svgData = await svgRes.json();
        setSvgUrl(svgData.svg);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      fetchRecord(resolved.id);
    };
    resolveParams();
  }, [params]);

  const printRecord = () => {
    window.print();
  };

  if (isLoading) return <div className="p-8 text-center text-[var(--color-text-muted)]">Loading Traceability Record...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!record) return <div className="p-8 text-center">Record not found.</div>;

  const payloadData = record.fields.reduce((acc, field) => {
    if (field.fieldType !== 'system_generated') {
      acc[field.fieldKey] = field.value || '';
    }
    return acc;
  }, {} as Record<string, string | number>);

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      <div className="no-print mb-6">
        <Button variant="ghost" asChild>
          <Link href="/history">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Traceability Record</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Generated {new Date(record.createdAt).toLocaleString()} by <span className="font-semibold text-foreground">{record.createdByName || 'Unknown'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={record.status === 'GENERATED' ? 'default' : 'destructive'} className="text-sm">
            {record.status}
          </Badge>
          <div className="no-print flex gap-2">
            <Button variant="outline" size="sm" onClick={printRecord}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

        {/* Document Label Render */}
        <div className="md:col-span-3 mt-4">
          <h2 className="text-lg font-bold tracking-tight mb-4 no-print">Generated Traceability Document</h2>
          <div 
            ref={containerRef}
            className="bg-white p-0 sm:p-0 rounded-xl shadow-lg border border-slate-200 print-mode overflow-hidden max-w-full flex justify-center"
          >
            <div className="w-full p-4 sm:p-8" style={{ height: scale < 1 ? scaledHeight : 'auto' }}>
              <div 
                className="origin-top-left sm:origin-top" 
                style={{ 
                  transform: `scale(${scale})`, 
                  width: '800px',
                  margin: scale < 1 ? '0' : '0 auto'
                }}
              >
                <div ref={labelRef} className="bg-white inline-block">
                  <LabelRenderer 
                    qrSvg={svgUrl || ''}
                    prc={record.productReferenceCode}
                    payloadData={payloadData}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
