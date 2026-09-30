'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SsccConfig {
  gs1CompanyPrefix: string;
  extensionDigit: string;
  exists: boolean;
}

interface Setting {
  key: string;
  value: string | boolean;
}

export default function AdminSettingsPage() {
  const [ssccConfig, setSsccConfig] = useState<SsccConfig | null>(null);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSSCC, setIsSavingSSCC] = useState(false);

  const [companyPrefix, setCompanyPrefix] = useState('');
  const [extensionDigit, setExtensionDigit] = useState('0');

  const fetchData = useCallback(async () => {
    try {
      const [ssccRes, settingsRes] = await Promise.all([
        fetch('/api/protected/admin/settings/sscc'),
        fetch('/api/protected/admin/settings')
      ]);

      if (ssccRes.ok) {
        const ssccData = await ssccRes.json();
        setSsccConfig(ssccData.exists === false ? null : ssccData);
        if (ssccData.gs1CompanyPrefix) setCompanyPrefix(ssccData.gs1CompanyPrefix);
        if (ssccData.extensionDigit) setExtensionDigit(ssccData.extensionDigit);
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettings(sData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const runFetch = async () => {
      await fetchData();
    };
    runFetch();
  }, [fetchData]);

  const handleSaveSSCC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('WARNING: Changing the production SSCC configuration will affect all future generated codes. Are you absolutely sure?')) return;
    
    setIsSavingSSCC(true);
    try {
      const res = await fetch('/api/protected/admin/settings/sscc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyPrefix, extensionDigit })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update SSCC Config');
      }
      alert('SSCC Configuration Updated Successfully.');
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setIsSavingSSCC(false);
    }
  };

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || '';

  const handleSaveSetting = async (key: string, value: string | boolean) => {
    try {
      const res = await fetch('/api/protected/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update setting');
      }
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  if (isLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-[var(--color-text-muted)]">Manage production SSCC configuration and system settings.</p>
      </div>

      {/* SSCC Configuration */}
      <Card>
        <CardHeader className="border-b bg-[var(--color-surface-muted)]">
          <CardTitle className="text-lg">SSCC Production Configuration</CardTitle>
          <CardDescription>
            The GS1 Company Prefix is required for generating compliant Serial Shipping Container Codes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-4 p-4 border rounded bg-gray-50">
            <div>
              <p className="text-sm font-semibold">Current Status:</p>
              {ssccConfig ? (
                <Badge variant="default">CONFIGURED (Active)</Badge>
              ) : (
                <Badge variant="destructive">UNCONFIGURED</Badge>
              )}
            </div>
            {ssccConfig && (
              <div className="text-sm">
                <span className="text-[var(--color-text-muted)] mr-2">Active Prefix:</span>
                <span className="font-mono font-bold">{ssccConfig.gs1CompanyPrefix}</span>
                <span className="text-[var(--color-text-muted)] ml-4 mr-2">Ext Digit:</span>
                <span className="font-mono font-bold">{ssccConfig.extensionDigit}</span>
              </div>
            )}
            <div className="text-xs text-[var(--color-text-muted)] mt-3">
              * System enforces SSCC mathematical length and GS1 check-digit validity. Production compliance requires this to be your organization&apos;s formally licensed GS1 Prefix.
            </div>
          </div>

          <form onSubmit={handleSaveSSCC} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">GS1 Company Prefix</label>
              <Input 
                value={companyPrefix}
                onChange={e => setCompanyPrefix(e.target.value)}
                placeholder="e.g. 0614141"
                required
                pattern="\d{6,12}"
                title="6-12 digit GS1 Company Prefix"
              />
              <p className="text-xs text-muted-foreground mt-1">Must be an exact 6 to 12 digit prefix allocated to your organization.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Extension Digit</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={extensionDigit}
                onChange={e => setExtensionDigit(e.target.value)}
              >
                {Array.from({length: 10}).map((_, i) => (
                  <option key={i} value={i.toString()}>{i}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={isSavingSSCC}>
              {isSavingSSCC ? 'Saving...' : 'Save Production Configuration'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader className="border-b bg-[var(--color-surface-muted)]">
          <CardTitle className="text-lg">Application Settings</CardTitle>
          <CardDescription>
            General operational configuration for PharmaTrace.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Application Name</label>
              <div className="flex gap-2">
                <Input 
                  defaultValue={getSetting('app_name') as string}
                  id="app_name_input"
                />
                <Button variant="outline" onClick={() => handleSaveSetting('app_name', (document.getElementById('app_name_input') as HTMLInputElement).value)}>
                  Save
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Maintenance Mode</label>
              <div className="flex gap-2 items-center">
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  id="maintenance_mode_input"
                  defaultValue={getSetting('maintenance_mode') === true ? 'true' : 'false'}
                >
                  <option value="false">Off (Normal Operation)</option>
                  <option value="true">On (Maintenance)</option>
                </select>
                <Button variant="outline" onClick={() => handleSaveSetting('maintenance_mode', (document.getElementById('maintenance_mode_input') as HTMLSelectElement).value === 'true')}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
