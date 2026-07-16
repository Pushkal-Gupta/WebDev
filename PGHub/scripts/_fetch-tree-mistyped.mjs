import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const IDS = ['identical-trees', 'sum-of-nodes-with-even-valued-grandparent', 'pghub-b48-tree-tilt', 'pghub-b50-tree-tilt', 'pghub-b15-tree-tilt'];

const { data, error } = await sb
  .from('PGcode_problems')
  .select('id, method_name, params, return_type, test_cases, solutions')
  .in('id', IDS);

if (error) { console.error(error); process.exit(1); }

const out = {};
for (const r of data) {
  out[r.id] = r;
}
fs.writeFileSync('/tmp/tree-current.json', JSON.stringify(out, null, 2));
for (const r of data) {
  console.log('====', r.id, '| method:', r.method_name, '| rt:', r.return_type);
  console.log('params:', JSON.stringify(r.params));
  console.log('num test_cases:', Array.isArray(r.test_cases) ? r.test_cases.length : 'N/A');
  console.log('first 4 cases:', JSON.stringify((r.test_cases||[]).slice(0,4)));
  console.log('python sol:', JSON.stringify(r.solutions?.python)?.slice(0,600));
}
