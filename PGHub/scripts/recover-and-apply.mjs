// Wait for the DB to recover from saturation, then GENTLY (paced writes) apply all staged
// content: viz_steps + multi-approach editorials from /tmp. Reports what landed + stress count.
// Paced to avoid re-triggering the throttle that the 929-write burst caused.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PACE = 180; // ms between writes — gentle

async function timed(fn, ms) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fn(ctrl.signal); } catch (e) { return { error: { message: e.name === 'AbortError' ? 'timeout' : e.message } }; } finally { clearTimeout(t); }
}

// 1) wait for recovery
console.log('waiting for DB recovery...');
await sleep(30000);
let healthy = false;
for (let a = 1; a <= 40 && !healthy; a++) {
  const r = await timed((s) => sb.from('PGcode_problems').select('id').limit(1).abortSignal(s), 20000);
  if (r && !r.error && r.data && r.data.length) { healthy = true; console.log(`healthy on attempt ${a}`); break; }
  console.log(`  attempt ${a}: ${r?.error?.message || 'empty'}`);
  await sleep(30000);
}
if (!healthy) { console.log('DB never recovered in window — rerun this script later.'); process.exit(1); }

const OK_R = new Set(['array', 'window', 'grid', 'graph', 'tree']);
const vizValid = (v) => v && v.title && OK_R.has(v.renderer) && Array.isArray(v.frames) && v.frames.length >= 4 &&
  v.frames.every((f) => f && f.caption && ((v.renderer !== 'array' && v.renderer !== 'window') || Array.isArray(f.array)));
const mdValid = (md) => typeof md === 'string' && md.length >= 300 && /brute|naive/i.test(md) && /optimal|efficient/i.test(md) && /O\(/.test(md);

async function pacedUpdate(id, patch) {
  for (let a = 1; a <= 4; a++) {
    const r = await timed((s) => sb.from('PGcode_problems').update(patch).eq('id', id).abortSignal(s), 20000);
    if (r && !r.error) return true;
    await sleep(1500 * a);
  }
  return false;
}

// 2) apply viz
let vizOk = 0, vizFail = 0;
for (const f of fs.readdirSync('/tmp/viz').filter((x) => /^out-\d+\.json$/.test(x))) {
  for (const { id, viz_steps } of JSON.parse(fs.readFileSync('/tmp/viz/' + f, 'utf8'))) {
    if (!vizValid(viz_steps)) { vizFail++; continue; }
    if (await pacedUpdate(id, { viz_steps })) vizOk++; else vizFail++;
    await sleep(PACE);
  }
}
console.log(`VIZ applied: ${vizOk} | failed: ${vizFail}`);

// 3) apply editorials
let apOk = 0, apFail = 0;
for (const f of fs.readdirSync('/tmp/appr').filter((x) => /^out-\d+\.json$/.test(x))) {
  for (const { id, editorial_md } of JSON.parse(fs.readFileSync('/tmp/appr/' + f, 'utf8'))) {
    if (!mdValid(editorial_md)) { apFail++; continue; }
    if (await pacedUpdate(id, { editorial_md })) apOk++; else apFail++;
    await sleep(PACE);
  }
}
console.log(`EDITORIALS applied: ${apOk} | failed: ${apFail}`);

// 4) report stress persistence on the reported ids
try {
  const ids = JSON.parse(fs.readFileSync('/tmp/health/stress-added.json', 'utf8')).map((r) => r.id);
  let present = 0, missing = 0;
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const r = await timed((s) => sb.from('PGcode_problems').select('id,test_cases').in('id', chunk).abortSignal(s), 20000);
    if (r?.error) { console.log('stress-check chunk error', r.error.message); continue; }
    for (const p of r.data || []) { (p.test_cases || []).some((c) => c && c.stress) ? present++ : missing++; }
    await sleep(120);
  }
  console.log(`STRESS present: ${present} | missing(of reported): ${missing}`);
} catch (e) { console.log('stress-check skipped:', e.message); }

console.log('DONE.');
process.exit(0);
