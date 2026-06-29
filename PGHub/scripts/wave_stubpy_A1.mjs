import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
for (const line of fs.readFileSync('.env','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const t = JSON.parse(fs.readFileSync('scripts/stub-targets.json','utf8'));
const c = new Set(JSON.parse(fs.readFileSync('scripts/stub-corrupted-expected.json','utf8')));
const slice = t.slice(0,50).filter(s=>!c.has(s));
const out = [];
for (const slug of slice) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id, name, description, method_name, params, return_type, test_cases, constraints')
    .eq('id', slug).maybeSingle();
  if (error) { out.push({slug, err: error.message}); continue; }
  if (!data) { out.push({slug, err:'not found'}); continue; }
  const tc = Array.isArray(data.test_cases)?data.test_cases:[];
  out.push({
    slug, id:data.id, name:data.name, method_name:data.method_name,
    params:data.params, return_type:data.return_type,
    ncases: tc.length,
    nNullExpected: tc.filter(x=>x.expected==null||x.expected==='').length,
    constraints: (data.constraints||'').slice(0,500),
    description: (data.description||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,1200),
    samples: tc.slice(0,3),
  });
}
fs.writeFileSync('/tmp/stubpy_A1_data.json', JSON.stringify(out,null,2));
console.log('wrote', out.length, 'problems to /tmp/stubpy_A1_data.json');
