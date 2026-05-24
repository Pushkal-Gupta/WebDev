import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
for (const line of fs.readFileSync('.env','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await sb.from('PGcode_problems')
  .select('id, method_name, params, return_type, test_cases, solutions')
  .not('solutions', 'is', null)
  .not('params', 'is', null)
  .limit(50);
if (error) { console.error(error.message); process.exit(1); }
const filtered = data.filter(p => Array.isArray(p.params) && p.params.length > 0 && p.solutions?.python?.code && p.method_name);
console.log('with python+params+method:', filtered.length, '/', data.length);
filtered.slice(0,8).forEach(p => {
  console.log(p.id, '|', JSON.stringify(p.params), '|', p.return_type, '| cases:', (p.test_cases||[]).length);
});
