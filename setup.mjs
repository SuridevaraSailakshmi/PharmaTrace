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
  // Re-create users
  console.log('Creating users...');
  const adminRes = await supabase.auth.admin.createUser({
    email: 'newadmin@pharmatrace.local',
    password: 'AdminPassword123!',
    email_confirm: true,
  });
  if (adminRes.error) console.error(adminRes.error);
  else console.log('Admin user created:', adminRes.data.user.id);

  const worker1Res = await supabase.auth.admin.createUser({
    email: 'employee@pharmatrace.local',
    password: 'WorkerPassword123!',
    email_confirm: true,
  });
  if (worker1Res.error) console.error(worker1Res.error);
  else console.log('Worker 1 created:', worker1Res.data.user.id);

  const worker2Res = await supabase.auth.admin.createUser({
    email: 'newworker@pharmatrace.local',
    password: 'WorkerPassword123!',
    email_confirm: true,
  });
  if (worker2Res.error) console.error(worker2Res.error);
  else console.log('Worker 2 created:', worker2Res.data.user.id);

  // Assign roles
  if (adminRes.data?.user) {
    await supabase.from('users').upsert({ id: adminRes.data.user.id, email: adminRes.data.user.email, role_id: 'ADMIN' });
  }
  if (worker1Res.data?.user) {
    await supabase.from('users').upsert({ id: worker1Res.data.user.id, email: worker1Res.data.user.email, role_id: 'WORKER' });
  }
  if (worker2Res.data?.user) {
    await supabase.from('users').upsert({ id: worker2Res.data.user.id, email: worker2Res.data.user.email, role_id: 'WORKER' });
  }
  console.log('Setup complete.');
}
setup();
