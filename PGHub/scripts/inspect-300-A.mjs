import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const envPath = '/Users/pushkalgupta/Desktop/WebDev/PGcode/.env';
try {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const slugs = fs.readFileSync('/tmp/slugs-300-A.txt','utf8').trim().split('\n');
const { data, error } = await sb.from('PGcode_problems')
  .select('id,name,description,method_name,params,return_type,test_cases,hints,editorial_md,solutions,pattern,topic_id,tags,difficulty')
  .in('id', slugs);
if (error) { console.error(error); process.exit(1); }
fs.writeFileSync('/tmp/state-300-A.json', JSON.stringify(data, null, 2));
console.log('Fetched', data.length, 'of', slugs.length, 'slugs');
const missing = slugs.filter(s => !data.find(d => d.id === s));
if (missing.length) console.log('Missing:', missing);
