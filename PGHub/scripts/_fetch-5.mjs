import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..', 'Desktop', 'WebDev', 'PGHub');
for (const l of fs.readFileSync('/Users/pushkalgupta/Desktop/WebDev/PGHub/.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const slugs = JSON.parse(fs.readFileSync('/tmp/struct/slice-5.json','utf8')).map(x=>x.id);
const { data, error } = await sb.from('PGcode_problems').select('id,params,return_type,test_cases').in('id', slugs);
if (error) { console.error(error); process.exit(1); }
const out = {};
for (const d of data) out[d.id] = { params: d.params, return_type: d.return_type, count: (d.test_cases||[]).length, cases: (d.test_cases||[]).map(c=>c.inputs) };
fs.writeFileSync('/tmp/struct/db-5.json', JSON.stringify(out, null, 1));
for (const s of slugs) console.log(s, '->', out[s]?.count, 'cases');
