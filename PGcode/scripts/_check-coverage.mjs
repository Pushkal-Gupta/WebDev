import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
for (const line of fs.readFileSync('.env','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const slugify = (n) => String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const all = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from('PGcode_problems').select('id,name,roadmap_set,method_name,solutions,editorial_md').range(from, from + 999);
  if (error) throw error;
  if (!data.length) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
const byBucket = {};
for (const p of all) {
  const b = p.roadmap_set || 'none';
  if (!byBucket[b]) byBucket[b] = { total: 0, withMethod: 0, withSolutions: 0, withEditorial: 0, fullCovered: 0 };
  byBucket[b].total++;
  if (p.method_name) byBucket[b].withMethod++;
  if (p.solutions) byBucket[b].withSolutions++;
  if (p.editorial_md) byBucket[b].withEditorial++;
  if (p.method_name && p.solutions && p.editorial_md) byBucket[b].fullCovered++;
}
console.log('Coverage by bucket:');
for (const [b, s] of Object.entries(byBucket).sort()) {
  console.log(`  ${b}: ${s.fullCovered}/${s.total} fully covered, method=${s.withMethod}, sol=${s.withSolutions}, ed=${s.withEditorial}`);
}
const TOTAL = all.length;
const F = all.filter(p => p.method_name && p.solutions && p.editorial_md).length;
console.log(`\nGLOBAL: ${F}/${TOTAL} fully covered`);

const pending200 = all.filter(p => p.roadmap_set === '200' && !(p.method_name && p.solutions && p.editorial_md)).map(p => slugify(p.name));
const pending500 = all.filter(p => p.roadmap_set === '500' && !(p.method_name && p.solutions && p.editorial_md)).map(p => slugify(p.name));
console.log(`\nPending PGcode-200: ${pending200.length}`);
console.log(`Pending PGcode-500: ${pending500.length}`);
const CHUNK = 30;
for (let i = 0; i < pending200.length; i += CHUNK) {
  const n = String(Math.floor(i/CHUNK)).padStart(2,'0');
  fs.writeFileSync(`/tmp/w5-200-${n}.txt`, pending200.slice(i, i+CHUNK).join('\n') + '\n');
}
for (let i = 0; i < pending500.length; i += CHUNK) {
  const n = String(Math.floor(i/CHUNK)).padStart(2,'0');
  fs.writeFileSync(`/tmp/w5-500-${n}.txt`, pending500.slice(i, i+CHUNK).join('\n') + '\n');
}
console.log(`Wrote ${Math.ceil(pending200.length/CHUNK)} PGcode-200 + ${Math.ceil(pending500.length/CHUNK)} PGcode-500 chunks`);
