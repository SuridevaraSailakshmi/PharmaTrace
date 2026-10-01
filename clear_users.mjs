import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function clearUsers() {
  console.log('Fetching users...');
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error fetching users:', listError);
    return;
  }
  
  const users = usersData?.users || [];
  
  for (const user of users) {
    // Delete from public.users first if ON DELETE CASCADE isn't enough or to avoid FK issues
    await supabase.from('users').delete().eq('id', user.id);

    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Error deleting user ' + user.email, error.message);
    } else {
      console.log('Deleted user ' + user.email);
    }
  }
  console.log('User wipe complete.');
}
clearUsers();
