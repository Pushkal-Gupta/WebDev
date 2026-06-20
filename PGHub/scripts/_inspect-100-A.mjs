import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const ENV_PATH = '/Users/pushkalgupta/Desktop/WebDev/PGcode/.env';
try {
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const slugs = fs.readFileSync('/tmp/slugs-100-A.txt','utf8').trim().split('\n');
const { data, error } = await sb.from('PGcode_problems')
  .select('id,name,description,method_name,params,return_type,test_cases,hints,editorial_md,solutions,pattern,topic_id,tags,difficulty')
  .in('id', slugs);
if (error) { console.error(error); process.exit(1); }
fs.writeFileSync('/tmp/state-100-A.json', JSON.stringify(data, null, 2));
console.log('rows:', data.length);
const summary = data.map(p => ({
  id: p.id,
  name: p.name,
  difficulty: p.difficulty,
  method_name: p.method_name || null,
  params: p.params ? 'set' : null,
  return_type: p.return_type || null,
  test_cases_n: Array.isArray(p.test_cases) ? p.test_cases.length : 0,
  hints_n: Array.isArray(p.hints) ? p.hints.length : 0,
  editorial_len: p.editorial_md ? p.editorial_md.length : 0,
  solutions_keys: p.solutions ? Object.keys(p.solutions) : [],
  pattern: p.pattern || null,
}));
fs.writeFileSync('/tmp/state-100-A-summary.json', JSON.stringify(summary, null, 2));
const missing = slugs.filter(s => !data.find(p => p.id === s));
if (missing.length) console.log('MISSING SLUGS:', missing);
