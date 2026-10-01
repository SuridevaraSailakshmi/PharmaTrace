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

async function setup() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const users = usersData?.users || [];
  
  for (const user of users) {
    let role = 'WORKER';
    if (user.email.includes('admin')) role = 'ADMIN';
    
    await supabase.from('users').upsert({ id: user.id, email: user.email, role_id: role });
    console.log(`Upserted ${user.email} as ${role}`);
  }
}
setup();
