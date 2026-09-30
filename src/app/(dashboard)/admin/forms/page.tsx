/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormDefinition } from '@/types/forms';

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/protected/forms');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch forms');
      }
      const data = await res.json();
      setForms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchForms();
  }, []);

  const handleCreateForm = async () => {
    try {
      const name = prompt('Enter form name (e.g. New Traceability Form):');
      if (!name) return;
      const res = await fetch('/api/protected/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: '' })
      });
      if (!res.ok) throw new Error('Failed to create form');
      const data = await res.json();
      router.push(`/admin/forms/builder/${data.formId}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const navigateToBuilder = (formId: string) => {
    router.push(`/admin/forms/builder/${formId}`);
  };



  if (loading) return <div className="p-8">Loading forms...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Forms</h1>
          <p className="text-slate-500 mt-1">Manage traceability form.</p>
        </div>
        {forms.length === 0 && <Button onClick={handleCreateForm}>Create Form</Button>}
      </div>

      {forms.length === 0 ? (
        <Card className="border-dashed bg-slate-50 text-center py-12">
          <CardContent>
            <p className="text-slate-500">No forms found. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <Card key={form.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{form.name}</CardTitle>
                </div>
                {form.description && <CardDescription className="line-clamp-2">{form.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-xs text-slate-500 font-mono">Single Operational Form</p>
              </CardContent>
              <div className="p-4 border-t border-slate-100 flex gap-2 justify-end">
                 <Button size="sm" onClick={() => navigateToBuilder(form.id)}>Manage Form Builder</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
