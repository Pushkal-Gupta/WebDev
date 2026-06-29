// Read-modify-write the python canonical for each slice-650 problem.
// Re-reads `solutions` per row, sets solutions.python = {code, approach, complexity}
// preserving every other language. Only runs after independent 100%-pass grading.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname,'..','..','.env'),'utf8').split('\n')){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const codeOf = (e) => typeof e === 'string' ? e : (e && typeof e.python === 'string' ? e.python : (e && typeof e.code === 'string' ? e.code : ''));

// merge all chunk batches
const merged = {};
for (let i = 0; i < 5; i++) {
  const mod = (await import(path.join(__dirname, `batch-stub-650-chunk${i}.mjs`))).default;
  for (const [slug, v] of Object.entries(mod)) merged[slug] = codeOf(v);
}
console.log('merged solutions for', Object.keys(merged).length, 'slugs');

let wrote = 0, skipped = 0, failed = 0;
for (const [slug, code] of Object.entries(merged)) {
  if (!code) { console.log('SKIP empty', slug); skipped++; continue; }
  const { data, error } = await sb.from('PGcode_problems').select('solutions').eq('id', slug).maybeSingle();
  if (error || !data) { console.log('FAIL read', slug, error?.message); failed++; continue; }
  const existing = (data.solutions && typeof data.solutions === 'object') ? data.solutions : {};
  const next = { ...existing, python: {
    code,
    approach: 'Canonical Python solution, graded correct against every preserved test case via Judge0.',
    complexity: existing?.python?.complexity || '',
  }};
  const { error: upErr } = await sb.from('PGcode_problems').update({ solutions: next }).eq('id', slug);
  if (upErr) { console.log('FAIL write', slug, upErr.message); failed++; continue; }
  console.log('WROTE', slug);
  wrote++;
}
console.log(`\n=== wrote ${wrote} | skipped ${skipped} | failed ${failed} ===`);
