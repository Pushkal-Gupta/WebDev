import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Load .env
try {
  for (const line of fs.readFileSync('/Users/pushkalgupta/Desktop/WebDev/PGcode/.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const slugs = fs.readFileSync('/tmp/slugs-400-A.txt', 'utf8').trim().split('\n');

const { data, error } = await sb.from('PGcode_problems')
  .select('id,name,description,method_name,params,return_type,test_cases,hints,editorial_md,solutions,pattern,topic_id,tags,difficulty')
  .in('id', slugs);

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

fs.writeFileSync('/tmp/state-400-A.json', JSON.stringify(data, null, 2));
console.log('Found:', data.length, '/', slugs.length);
const missing = slugs.filter(s => !data.find(d => d.id === s));
if (missing.length) console.log('Missing slugs:', missing);

// Show quick summary
const summary = data.map(d => ({
  id: d.id,
  name: d.name,
  has_method: !!d.method_name,
  has_params: Array.isArray(d.params) && d.params.length > 0,
  has_return: !!d.return_type,
  tc_count: Array.isArray(d.test_cases) ? d.test_cases.length : 0,
  hints_count: Array.isArray(d.hints) ? d.hints.length : 0,
  has_editorial: !!d.editorial_md && d.editorial_md.length > 100,
  has_solutions: d.solutions && typeof d.solutions === 'object' ? Object.keys(d.solutions).length : 0,
  has_pattern: !!d.pattern,
  topic_id: d.topic_id,
}));
console.log(JSON.stringify(summary, null, 2));
