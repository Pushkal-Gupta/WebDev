import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
for (const line of fs.readFileSync('.env','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const all = JSON.parse(fs.readFileSync('scripts/stub-targets.json','utf8'));
const corrupt = new Set(JSON.parse(fs.readFileSync('scripts/stub-corrupted-expected.json','utf8')));
const slice = all.slice(250,300);
const out = [];
for (const slug of slice) {
  if (corrupt.has(slug)) { out.push({slug, skip:'corrupted'}); continue; }
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,name,description,method_name,params,return_type,test_cases,constraints,solutions')
    .eq('id', slug).maybeSingle();
  if (error || !data) { out.push({slug, skip:'notfound:'+(error?.message||'null')}); continue; }
  out.push(data);
}
fs.writeFileSync('/tmp/slice250_data.json', JSON.stringify(out));
console.log('fetched', out.length);
for (const p of out) {
  if (p.skip) { console.log('SKIP', p.slug, '|', p.skip); continue; }
  const tc = Array.isArray(p.test_cases)? p.test_cases : [];
  const nonNull = tc.filter(c=>c && c.expected!=null && c.expected!=='').length;
  console.log(`${p.id} | mn=${p.method_name} | rt=${p.return_type} | params=[${(p.params||[]).map(x=>x.name+':'+x.type).join(', ')}] | cases=${tc.length} nn=${nonNull}`);
}
