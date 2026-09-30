/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { FormFieldDefinition } from '@/types/forms';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DynamicFormRendererProps {
  fields: FormFieldDefinition[];
  onSubmit?: (values: Record<string, any>) => void;
  isReadOnly?: boolean;
  initialValues?: Record<string, any>;
  title?: string;
  description?: string;
}

export function DynamicFormRenderer({
  fields,
  onSubmit,
  isReadOnly = false,
  initialValues = {},
  title,
  description
}: DynamicFormRendererProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: any) => {
    if (isReadOnly) return;
    setValues(prev => ({ ...prev, [key]: value }));
    // Basic clearing of error
    if (errors[key]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[key];
        return newErrs;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.fieldType === 'system_generated') continue; // Handled by server
      
      const val = values[field.fieldKey];
      if (field.isRequired && (val === undefined || val === null || val === '')) {
        newErrors[field.fieldKey] = `${field.label} is required`;
      }
      
      // additional client validations can go here (min length, max length, pattern)
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-2xl font-semibold text-slate-900">{title}</CardTitle>}
          {description && <p className="text-sm text-slate-500 mt-2">{description}</p>}
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.fieldKey} className="font-semibold text-slate-900">
                {field.label} {field.isRequired && <span className="text-red-600">*</span>}
              </Label>
              
              {field.config?.helpText && (
                <p className="text-xs text-slate-500">{field.config.helpText}</p>
              )}
              
              {field.fieldType === 'system_generated' ? (
                <Input
                  id={field.fieldKey}
                  value={values[field.fieldKey] || 'SYSTEM GENERATED'}
                  disabled
                  readOnly
                  className="bg-slate-50 text-slate-500 font-mono"
                />
              ) : field.fieldType === 'long_text' ? (
                <textarea
                  id={field.fieldKey}
                  value={values[field.fieldKey] || ''}
                  onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                  disabled={isReadOnly}
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={field.config?.placeholder}
                />
              ) : field.fieldType === 'dropdown' ? (
                 <select
                    id={field.fieldKey}
                    value={values[field.fieldKey] || ''}
                    onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    disabled={isReadOnly}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                 >
                    <option value="" disabled>Select...</option>
                    {field.config?.options?.map(opt => (
                       <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                 </select>
              ) : (
                <Input
                  id={field.fieldKey}
                  type={field.fieldType === 'date' ? 'date' : field.fieldType === 'decimal' || field.fieldType === 'integer' ? 'number' : 'text'}
                  step={field.fieldType === 'decimal' ? 'any' : undefined}
                  value={values[field.fieldKey] || ''}
                  onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder={field.config?.placeholder}
                  className={errors[field.fieldKey] ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
              )}
              {errors[field.fieldKey] && (
                <p className="text-xs text-red-600 font-medium">{errors[field.fieldKey]}</p>
              )}
            </div>
          ))}
          {!isReadOnly && (
            <div className="pt-4 flex justify-end">
              <Button type="submit">Submit</Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
