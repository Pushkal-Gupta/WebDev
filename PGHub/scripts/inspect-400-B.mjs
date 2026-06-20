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
const slugs = fs.readFileSync('/tmp/slugs-400-B.txt', 'utf8').trim().split('\n');

const { data, error } = await sb
  .from('PGcode_problems')
  .select('id,name,description,method_name,params,return_type,test_cases,hints,editorial_md,solutions,pattern,topic_id,tags,difficulty')
  .in('id', slugs);

if (error) { console.error(error); process.exit(1); }

fs.writeFileSync('/tmp/state-400-B.json', JSON.stringify(data, null, 2));
console.log(`Fetched ${data.length} of ${slugs.length} problems`);
const found = new Set(data.map(d => d.id));
const missing = slugs.filter(s => !found.has(s));
if (missing.length) console.log('Missing:', missing);

// Summarize current state
const summary = data.map(d => ({
  id: d.id,
  name: d.name,
  has_method_name: !!d.method_name,
  has_params: Array.isArray(d.params) && d.params.length > 0,
  has_return_type: !!d.return_type,
  test_case_count: Array.isArray(d.test_cases) ? d.test_cases.length : 0,
  hint_count: Array.isArray(d.hints) ? d.hints.length : 0,
  has_editorial: !!d.editorial_md && d.editorial_md.length > 100,
  has_solutions: d.solutions && typeof d.solutions === 'object' ? Object.keys(d.solutions).length : 0,
  has_pattern: !!d.pattern,
  difficulty: d.difficulty,
  topic_id: d.topic_id,
}));
fs.writeFileSync('/tmp/state-400-B-summary.json', JSON.stringify(summary, null, 2));
console.log('Summary written');
