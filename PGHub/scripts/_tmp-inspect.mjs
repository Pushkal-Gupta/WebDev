import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await sb.from('PGcode_problems').select('*').not('leetcode_number','is',null).limit(1);
if (error) { console.error(error); process.exit(1); }
const row = data[0];
console.log('COLUMNS:', Object.keys(row).join(', '));
console.log('\n--- SAMPLE VALUES (truncated) ---');
for (const [k,v] of Object.entries(row)) {
  let s = JSON.stringify(v);
  if (s && s.length > 400) s = s.slice(0,400)+'...';
  console.log(`${k} :: ${typeof v} :: ${s}`);
}
