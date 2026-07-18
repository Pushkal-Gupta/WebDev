// Resilient persistence re-check after a throttle. Retries with per-attempt timeouts
// and reports whether stress cases + viz_steps + multi-approach editorials actually persisted.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withTimeout(promiseFactory, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await promiseFactory(ctrl.signal); } finally { clearTimeout(t); }
}

async function tryQuery(label, fn, attempts = 6) {
  for (let a = 1; a <= attempts; a++) {
    try {
      const r = await withTimeout((signal) => fn(signal), 12000);
      if (r && !r.error) return r;
      console.log(`  [${label}] attempt ${a}: error ${r?.error?.message || 'unknown'}`);
    } catch (e) { console.log(`  [${label}] attempt ${a}: ${e.name === 'AbortError' ? 'timeout' : e.message}`); }
    await sleep(3000 * a);
  }
  return null;
}

// warm-up ping first
console.log('waiting 45s for throttle to clear...');
await sleep(45000);

const ids = JSON.parse(fs.readFileSync('/tmp/health/stress-added.json', 'utf8')).slice(0, 5).map((r) => r.id);
const viz0 = JSON.parse(fs.readFileSync('/tmp/viz/out-0.json', 'utf8')).slice(0, 3).map((r) => r.id);
const appr0 = JSON.parse(fs.readFileSync('/tmp/appr/out-0.json', 'utf8')).slice(0, 3).map((r) => r.id);

const r = await tryQuery('sample', (signal) =>
  sb.from('PGcode_problems').select('id,test_cases,viz_steps,editorial_md').in('id', [...new Set([...ids, ...viz0, ...appr0])]).abortSignal(signal));
if (!r) { console.log('STILL UNREACHABLE after retries.'); process.exit(1); }

const by = Object.fromEntries(r.data.map((p) => [p.id, p]));
console.log('\n=== PERSISTENCE CHECK ===');
for (const id of ids) { const p = by[id]; const cs = p?.test_cases || []; console.log(`stress ${id}: ${cs.some((c) => c && c.stress) ? 'PRESENT' : 'MISSING'} (${cs.length} cases)`); }
for (const id of viz0) { const p = by[id]; console.log(`viz ${id}: ${p?.viz_steps?.frames?.length ? 'PRESENT (' + p.viz_steps.frames.length + ' frames)' : 'MISSING'}`); }
for (const id of appr0) { const p = by[id]; const md = p?.editorial_md || ''; console.log(`editorial ${id}: ${/brute/i.test(md) && /optimal/i.test(md) ? 'MULTI-APPROACH' : 'single/old'} (${md.length} ch)`); }
process.exit(0);
