// Poll the Supabase Management API (NOT the origin DB — zero load on the resizing instance)
// until project status is ACTIVE_HEALTHY, then gently apply staged viz + editorials and report.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const PAT = process.env.SUPABASE_ACCESS_TOKEN;
const REF = 'ykpjmvoyatcrlqyqbgfu';
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function status() {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}`, { headers: { Authorization: `Bearer ${PAT}` }, signal: ctrl.signal });
    const j = await res.json(); return j.status || 'UNKNOWN';
  } catch (e) { return e.name === 'AbortError' ? 'API_TIMEOUT' : 'API_ERR'; } finally { clearTimeout(t); }
}

console.log('watching Management API for ACTIVE_HEALTHY (up to ~40 min)...');
let healthy = false;
for (let a = 1; a <= 80; a++) {
  const s = await status();
  console.log(`  [${a}] status: ${s}`);
  if (s === 'ACTIVE_HEALTHY') { healthy = true; break; }
  await sleep(30000);
}
if (!healthy) { console.log('Not healthy within window. Status stuck — may need Supabase support.'); process.exit(1); }

// small settle, then confirm the origin actually answers an authed query
await sleep(8000);
async function timed(fn, ms) { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); try { return await fn(c.signal); } catch (e) { return { error: { message: e.name } }; } finally { clearTimeout(t); } }
for (let a = 1; a <= 10; a++) {
  const r = await timed((s) => sb.from('PGcode_problems').select('id').limit(1).abortSignal(s), 20000);
  if (r && !r.error && r.data?.length) { console.log('origin answering — proceeding to apply'); break; }
  console.log(`  origin warmup ${a}: ${r?.error?.message || 'empty'}`); await sleep(15000);
}

const OK_R = new Set(['array', 'window', 'grid', 'graph', 'tree']);
const vizValid = (v) => v && v.title && OK_R.has(v.renderer) && Array.isArray(v.frames) && v.frames.length >= 4 &&
  v.frames.every((f) => f && f.caption && ((v.renderer !== 'array' && v.renderer !== 'window') || Array.isArray(f.array)));
const mdValid = (md) => typeof md === 'string' && md.length >= 300 && /brute|naive/i.test(md) && /optimal|efficient/i.test(md) && /O\(/.test(md);
async function upd(id, patch) { for (let a = 1; a <= 4; a++) { const r = await timed((s) => sb.from('PGcode_problems').update(patch).eq('id', id).abortSignal(s), 20000); if (r && !r.error) return true; await sleep(1500 * a); } return false; }

let vizOk = 0, vizFail = 0;
for (const f of fs.readdirSync('/tmp/viz').filter((x) => /^out-\d+\.json$/.test(x)))
  for (const { id, viz_steps } of JSON.parse(fs.readFileSync('/tmp/viz/' + f, 'utf8'))) {
    if (!vizValid(viz_steps)) { vizFail++; continue; }
    (await upd(id, { viz_steps })) ? vizOk++ : vizFail++; await sleep(180);
  }
console.log(`VIZ applied: ${vizOk} | failed: ${vizFail}`);

let apOk = 0, apFail = 0;
for (const f of fs.readdirSync('/tmp/appr').filter((x) => /^out-\d+\.json$/.test(x)))
  for (const { id, editorial_md } of JSON.parse(fs.readFileSync('/tmp/appr/' + f, 'utf8'))) {
    if (!mdValid(editorial_md)) { apFail++; continue; }
    (await upd(id, { editorial_md })) ? apOk++ : apFail++; await sleep(180);
  }
console.log(`EDITORIALS applied: ${apOk} | failed: ${apFail}`);
console.log('DONE.');
process.exit(0);
