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
  await supabase.from('sscc_configurations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sscc_sequences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const users = usersData?.users || [];
  
  for (const user of users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) console.error('Error deleting user ' + user.email, error.message);
    else console.log('Deleted user ' + user.email);
  }
}
finishWipe();
