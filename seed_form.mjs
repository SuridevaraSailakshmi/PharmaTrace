import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  // Get admin user
  const { data: adminUsers } = await supabase.from('users').select('id').eq('role_id', 'ADMIN').limit(1);
  const adminId = adminUsers?.[0]?.id;

  // Create active SSCC configuration
  const { data: ssccConfig, error: ssccErr } = await supabase.from('sscc_configurations').insert({
    gs1_company_prefix: '1234567',
    extension_digit: '0',
    is_active: true,
    created_by: adminId
  }).select('id').single();
  
  if (ssccErr) console.error('Error creating SSCC Config:', ssccErr);
  
  if (ssccConfig) {
    await supabase.from('sscc_sequences').insert({
      configuration_id: ssccConfig.id,
      current_value: 0,
      max_value: 999999999
    });
  }

  // Create form
  const { data: form, error: formErr } = await supabase.from('forms').insert({
    name: 'PharmaTrace Standard Form',
    description: 'Standard product traceability label form',
    created_by: adminId
  }).select('id').single();

  if (formErr) {
    console.error('Error creating form:', formErr);
    return;
  }

  const fields = [
    { form_id: form.id, field_key: 'product_name', label: 'Product Name', field_type: 'text', sort_order: 1, is_required: true },
    { form_id: form.id, field_key: 'batch_no', label: 'Batch No.', field_type: 'text', sort_order: 2, is_required: true },
    { form_id: form.id, field_key: 'license_no', label: 'License No.', field_type: 'text', sort_order: 3, is_required: true },
    { form_id: form.id, field_key: 'cas_no', label: 'CAS No.', field_type: 'text', sort_order: 4, is_required: true },
    { form_id: form.id, field_key: 'mfg_date', label: 'Mfg. Date', field_type: 'date', sort_order: 5, is_required: true },
    { form_id: form.id, field_key: 'expiry_date', label: 'Re-test/Expiry Date', field_type: 'date', sort_order: 6, is_required: true },
    { form_id: form.id, field_key: 'container_no', label: 'Container No.', field_type: 'text', sort_order: 7, is_required: true },
    { form_id: form.id, field_key: 'country_origin', label: 'Country of Origin', field_type: 'text', sort_order: 8, is_required: true },
    { form_id: form.id, field_key: 'storage', label: 'Storage', field_type: 'text', sort_order: 9, is_required: true },
    { form_id: form.id, field_key: 'manufactured_by', label: 'Manufactured By', field_type: 'textarea', sort_order: 10, is_required: true },
    { form_id: form.id, field_key: 'gross_weight', label: 'Gross Weight', field_type: 'number', sort_order: 11, is_required: true },
    { form_id: form.id, field_key: 'tare_weight', label: 'Tare Weight', field_type: 'number', sort_order: 12, is_required: true },
    { form_id: form.id, field_key: 'net_weight', label: 'Net Weight', field_type: 'number', sort_order: 13, is_required: true },
  ];

  const { error: fieldsErr } = await supabase.from('form_fields').insert(fields);
  if (fieldsErr) console.error('Error creating fields:', fieldsErr);

  console.log('Seed complete.');
}
seed();
