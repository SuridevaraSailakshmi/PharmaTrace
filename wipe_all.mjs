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

async function finishWipe() {
  console.log('Nullifying references...');
  await supabase.from('forms').update({ current_version_id: null, created_by: null }).neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('form_versions').update({ published_by: null }).neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('system_settings').update({ updated_by: null }).neq('key', 'nothing');
  await supabase.from('form_submissions').update({ qr_record_id: null, product_reference_id: null, sscc_record_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Deleting application data...');
  const tables = [
    'audit_logs',
    'traceability_idempotency',
    'qr_records',
    'sscc_records',
    'product_references',
    'submission_values',
    'form_submissions',
    'form_field_options',
    'form_fields',
    'form_versions',
    'forms'
  ];

  for (const table of tables) {
    console.log('Deleting from ' + table + '...');
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error('Error deleting from ' + table, error);
  }

  console.log('Deleting users...');
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const users = usersData?.users || [];
  
  for (const user of users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) console.error('Error deleting user ' + user.email, error.message);
    else console.log('Deleted user ' + user.email);
  }
  console.log('Wipe complete.');
}

finishWipe().catch(console.error);
