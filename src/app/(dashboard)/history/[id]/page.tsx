'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, ArrowLeft, Database, QrCode } from 'lucide-react';
import Link from 'next/link';

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

      <div className="grid md:grid-cols-3 gap-6">
        {/* Identifiers & QR */}
        <Card className="md:col-span-1 shadow-sm border-[var(--color-border)]">
          <CardHeader className="bg-[var(--color-surface-muted)] py-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[var(--color-text-secondary)]">
              <QrCode className="h-4 w-4" />
              Identifiers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center">
            {svgUrl ? (
              <div 
                className="w-48 h-48 mb-6"
                dangerouslySetInnerHTML={{ __html: svgUrl }} 
              />
            ) : (
              <div className="w-48 h-48 mb-6 bg-gray-100 flex items-center justify-center text-xs text-gray-500">Rendering QR...</div>
            )}
            
            <div className="w-full space-y-4 text-left">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider mb-1">Product Reference Code</p>
                <p className="font-mono text-sm font-bold">{record.productReferenceCode}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider mb-1">SSCC</p>
                <p className="font-mono text-sm font-bold">{record.sscc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Form Data */}
        <Card className="md:col-span-2 shadow-sm border-[var(--color-border)]">
          <CardHeader className="bg-[var(--color-surface-muted)] py-4 border-b flex flex-row justify-between items-center">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Database className="h-4 w-4" />
              Form Submission
            </CardTitle>
            <Badge variant="outline" className="text-xs font-mono bg-white">
              {record.form.name}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {record.fields.map((field: FormField, idx: number) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 px-4 text-[var(--color-text-muted)] font-medium w-1/3 align-top bg-gray-50/50">
                      {field.label}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--color-text-primary)] break-words">
                      {field.fieldType === 'system_generated' 
                        ? (field.fieldKey === 'prc' ? record.productReferenceCode : record.sscc) 
                        : (field.value || '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
