/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormDefinition } from '@/types/forms';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';

export default function FormViewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [_isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/protected/forms/${id}`);
        if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || 'Failed to load form');
        }
        const data = await res.json();
        setForm(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/protected/forms/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      });
      
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
           console.error('Validation errors:', data.details);
           alert('Server Validation Failed. Check console for details.');
        } else {
           throw new Error(data.error || 'Submission failed');
        }
        return;
      }
      
      alert('Form validated locally and server-side successfully. Final submission logic belongs to Phase 6.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading form...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!form) return <div className="p-8">Form not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="mb-4">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900">&larr; Back</button>
      </div>
      
      <DynamicFormRenderer
        fields={form.fields}
        onSubmit={handleSubmit}
        isReadOnly={false}
        title={form.name}
        description={form.description || ''}
      />
    </div>
  );
}
