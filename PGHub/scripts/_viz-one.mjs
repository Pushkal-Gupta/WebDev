import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count: total } = await sb.from('PGcode_problems').select('*', { count: 'exact', head: true });
const { count: withViz } = await sb.from('PGcode_problems').select('*', { count: 'exact', head: true }).not('viz_steps','is',null);
console.log('DONE', withViz, '| LEFT', total-withViz, '| TOTAL', total);
const { data } = await sb.from('PGcode_problems').select('name,leetcode_number,viz_steps').eq('id','partition-array-for-maximum-sum');
console.log('\n=== EXAMPLE:', data[0].name, '(LC', data[0].leetcode_number, ') ===');
console.log('title:', data[0].viz_steps.title, '| renderer:', data[0].viz_steps.renderer);
data[0].viz_steps.frames.forEach((f,i)=>console.log(`  frame ${i}: [${(f.array||[]).join(',')}] chip="${f.chip}" | ${f.caption}`));
