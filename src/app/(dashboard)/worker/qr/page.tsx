'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, CheckCircle2, PackageSearch } from 'lucide-react';
import { FormDefinition } from '@/types/forms';
import { LabelRenderer } from '@/components/qr/LabelRenderer';
import * as htmlToImage from 'html-to-image';

interface TraceabilityGenerationResult {
  qrRecordId: string;
  submissionId: string;
  productReferenceCode: string;
  sscc: string;
  qrPayload: string;
  qrRepresentationSvg: string;
  qrRepresentationPng: string;
  createdAt: string;
  productName?: string;
  batchNo?: string;
}

export default function WorkerQrPage() {
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TraceabilityGenerationResult | null>(null);

  useEffect(() => {
    const fetchActiveForm = async () => {
      try {
        const res = await fetch('/api/protected/forms/active');
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch form definition');
        }
        const def = await res.json();
        setForm(def);
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
    fetchActiveForm();
  }, []);

  const handleInputChange = (fieldKey: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/protected/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          formData
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate QR');

      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState('auto');

  useEffect(() => {
    if (!result || !containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // We have p-4 (32px total) on small screens, sm:p-8 (64px total) on larger
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
  }, [result]);
  
  const resetFlow = () => {
    setResult(null);
    setFormData({});
  };

  const printQr = () => {
    window.print();
  };

  const downloadLabel = async () => {
    if (!labelRef.current || !result) return;
    try {
      const dataUrl = await htmlToImage.toPng(labelRef.current, { 
        quality: 1, 
        backgroundColor: '#ffffff',
        width: 800,
        style: {
          transform: 'scale(1)',
          margin: '0',
          border: '3px solid black'
        }
      });
      const link = document.createElement('a');
      link.download = `${result.productReferenceCode}_Label.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate label image', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading Form Definition...</p>
        </div>
      </div>
    );
  }

  if (error && !form && !result) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <PackageSearch className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Form Unavailable</h2>
        <p className="text-slate-500 mb-6 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
      </div>
    );
  }

  // --- STAGE 3: RESULT ---
  if (result) {
    return (
      <div className="max-w-[864px] mx-auto space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">QR Successfully Generated</h2>
          <p className="text-emerald-700">
            The immutable traceability record has been created and securely logged.
          </p>
        </div>

        <div 
          ref={containerRef}
          className="bg-white p-0 sm:p-0 rounded-xl shadow-lg border border-slate-200 print-mode overflow-hidden max-w-full flex justify-center"
        >
          {/* We apply padding directly here, and wrap the scaled element */}
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
                  qrSvg={result.qrRepresentationSvg}
                  prc={result.productReferenceCode}
                  payloadData={formData as Record<string, string | number>}
                />
              </div>
            </div>
          </div>
        </div>
          
        <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100 print:hidden">
            <Button onClick={printQr} className="flex-1 bg-slate-900 text-white hover:bg-slate-800" size="lg">
              <Printer className="mr-2 h-5 w-5" /> Print Label
            </Button>
            <Button onClick={downloadLabel} variant="outline" className="flex-1 border-slate-200 hover:bg-slate-50" size="lg">
              <Download className="mr-2 h-5 w-5 text-slate-700" /> Download PNG
            </Button>
          </div>

        <div className="text-center pt-4">
          <Button variant="ghost" onClick={resetFlow} className="text-slate-600 hover:text-slate-900">
            ← Generate another code
          </Button>
        </div>
      </div>
    );
  }

  // --- STAGE 2: FORM ENTRY ---
  if (form) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Generate QR Code</h1>
          <p className="text-slate-500">Fill in the required product traceability attributes.</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              {form.name}
              <Badge variant="outline" className="ml-auto bg-white font-mono text-xs">
                Operational Form
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form id="qr-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 flex items-start gap-2">
                  <div className="mt-0.5 font-bold">!</div>
                  <div>{error}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {form.fields.filter(f => f.fieldType !== 'system_generated').map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.fieldKey} className="text-sm font-medium text-slate-700">
                      {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {['short_text', 'long_text', 'integer', 'decimal'].includes(field.fieldType) && (
                      <Input
                        id={field.fieldKey}
                        type={['integer', 'decimal'].includes(field.fieldType) ? 'number' : 'text'}
                        step={field.fieldType === 'decimal' ? '0.01' : '1'}
                        required={field.isRequired}
                        placeholder={field.config?.placeholder || ''}
                        value={(formData[field.fieldKey] as string) || ''}
                        onChange={e => handleInputChange(field.fieldKey, e.target.value)}
                        className="w-full h-10 border-slate-300 focus:ring-slate-900 focus:border-slate-900"
                      />
                    )}

                    {field.fieldType === 'date' && (
                      <Input
                        id={field.fieldKey}
                        type="date"
                        required={field.isRequired}
                        value={(formData[field.fieldKey] as string) || ''}
                        onChange={e => handleInputChange(field.fieldKey, e.target.value)}
                        className="w-full h-10 border-slate-300"
                      />
                    )}
                    
                    {field.fieldType === 'dropdown' && field.config?.options && (
                      <select
                        id={field.fieldKey}
                        required={field.isRequired}
                        value={(formData[field.fieldKey] as string) || ''}
                        onChange={e => handleInputChange(field.fieldKey, e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Select {field.label}</option>
                        {field.config.options.map((opt: { value: string; label: string }) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 py-4 flex justify-between items-center rounded-b-xl">
            <Button variant="ghost" onClick={resetFlow} className="text-slate-500">
              Clear
            </Button>
            <Button 
              type="submit" 
              form="qr-form" 
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8"
            >
              {isSubmitting ? 'Generating Secure QR...' : 'Generate Traceability QR'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
}
