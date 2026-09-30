/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormDefinition, FormFieldDefinition, FormFieldType } from '@/types/forms';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'system_generated', label: 'System Generated (Read-only)' },
];

export default function FormBuilderPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [fields, setFields] = useState<FormFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/protected/forms/${id}`);
      if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         throw new Error(errData.error || 'Failed to fetch form');
      }
      const data = await res.json();
      setForm(data);
      setFields(data.fields || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddField = (type: FormFieldType) => {
    const newField: FormFieldDefinition = {
      id: generateId(),
      fieldKey: `field_${generateId()}`,
      label: 'New Field',
      fieldType: type,
      isRequired: false,
      sortOrder: fields.length + 1,
      config: {},
      ...(type === 'system_generated' ? { includeInQr: true } : {})
    } as any;
    
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateSelectedField = (updates: Partial<FormFieldDefinition>) => {
    setFields(fields.map(f => f.id === selectedFieldId ? { ...f, ...updates } : f));
  };

  const updateSelectedFieldConfig = (key: string, value: any) => {
    setFields(fields.map(f => {
      if (f.id === selectedFieldId) {
        return { ...f, config: { ...(f.config || {}), [key]: value } };
      }
      return f;
    }));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= fields.length) return;
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index + direction] as FormFieldDefinition;
    newFields[index + direction] = temp as FormFieldDefinition;
    
    // update sortOrder
    const reordered = newFields.map((f, i) => ({ ...f, sortOrder: i + 1 }));
    setFields(reordered);
  };

  const handleSaveForm = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/protected/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error || 'Failed to save form');
      }
      alert('Form saved successfully. It is now active for workers.');
      router.push('/admin/forms');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading builder...</div>;
  if (!form) return <div className="p-8 text-red-600">Form not found</div>;

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold">{form.name} Builder</h1>
          <p className="text-sm text-slate-500">Current Operational Form</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveForm} disabled={saving}>{saving ? 'Saving...' : 'Save Form'}</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-4 gap-6">
        {/* Left Side: Builder Canvas */}
        <div className="w-2/3 flex flex-col gap-4 overflow-y-auto pr-4 pb-20">
          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-sm font-semibold text-slate-600 self-center mr-2">Add Field:</span>
            {FIELD_TYPES.map(type => (
              <Button key={type.value} variant="outline" size="sm" onClick={() => handleAddField(type.value)}>
                + {type.label}
              </Button>
            ))}
          </div>

          {fields.length === 0 ? (
            <div className="text-center p-12 bg-slate-50 border border-dashed rounded-md text-slate-400">
              No fields added yet.
            </div>
          ) : (
            fields.map((field, index) => (
              <Card 
                key={field.id} 
                className={`cursor-pointer transition-all ${selectedFieldId === field.id ? 'ring-2 ring-slate-900 shadow-md' : 'hover:border-slate-400'}`}
                onClick={() => setSelectedFieldId(field.id)}
              >
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{field.label}</CardTitle>
                    <span className="text-xs text-slate-500 font-mono">{field.fieldKey} • {field.fieldType} {field.isRequired ? '• Required' : ''} {(field as any).includeInQr ? '• QR' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={index === 0} onClick={(e) => { e.stopPropagation(); moveField(index, -1); }}>↑</Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={index === fields.length - 1} onClick={(e) => { e.stopPropagation(); moveField(index, 1); }}>↓</Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); removeField(field.id); }}>X</Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        {/* Right Side: Field Configuration */}
        <div className="w-1/3 border-l border-slate-200 pl-6 overflow-y-auto pb-20">
          {selectedField ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Field Settings</h2>
              
              <div className="space-y-2">
                <Label>Label</Label>
                <Input 
                  value={selectedField.label} 
                  onChange={e => updateSelectedField({ label: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <Label>Field Key (DB column name)</Label>
                <Input 
                  value={selectedField.fieldKey} 
                  onChange={e => updateSelectedField({ fieldKey: e.target.value.replace(/[^a-z0-9_]/g, '') })} 
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="required"
                  checked={selectedField.isRequired}
                  onChange={e => updateSelectedField({ isRequired: e.target.checked })}
                  disabled={selectedField.fieldType === 'system_generated'}
                />
                <Label htmlFor="required">Required Field</Label>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="includeQr"
                  checked={(selectedField as any).includeInQr || false}
                  onChange={e => updateSelectedField({ includeInQr: e.target.checked } as any)}
                />
                <Label htmlFor="includeQr">Include in QR Payload</Label>
              </div>

              <div className="space-y-2 pt-4">
                <Label>Help Text</Label>
                <Input 
                  value={selectedField.config?.helpText || ''} 
                  onChange={e => updateSelectedFieldConfig('helpText', e.target.value)} 
                />
              </div>

              {['short_text', 'long_text'].includes(selectedField.fieldType) && (
                <div className="space-y-2 pt-2">
                  <Label>Placeholder</Label>
                  <Input 
                    value={selectedField.config?.placeholder || ''} 
                    onChange={e => updateSelectedFieldConfig('placeholder', e.target.value)} 
                  />
                </div>
              )}
              
              {selectedField.fieldType === 'system_generated' && (
                <div className="bg-slate-100 p-3 rounded-md mt-4 text-xs text-slate-600">
                  <strong>System Generated:</strong> This field is read-only for workers and will be populated during QR generation. Ensure the field key is precisely &quot;prc&quot; or &quot;sscc&quot; to map correctly to core identifiers.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 mt-12">
              Select a field to configure its properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
