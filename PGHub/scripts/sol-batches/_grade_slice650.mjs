// Standalone grader for slice-650 backfill chunks.
// Usage: node scripts/sol-batches/_grade_slice650.mjs <chunkFile.json> <batchFile.mjs>
// Grades EVERY preserved test case for each problem in the chunk against the
// authored python solution in the batch file (default export, keyed by slug,
// value either a string or {python}). Reports PASS/FAIL with the first failing case.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wrapWithDriver, buildStdin } from '../../src/lib/driverCode.js';
import { compareOutputSmart, ORDER_INSENSITIVE } from './grade-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JUDGE0_URL = (process.env.JUDGE0_URL || 'http://localhost:2358').replace(/\/$/, '');
const JUDGE0_AUTH = process.env.JUDGE0_AUTH_TOKEN || 'pgcode-local-j0-tok';
const HEADERS = { 'content-type': 'application/json', 'X-Auth-Token': JUDGE0_AUTH };
const PY = 71;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// extra order-insensitive slugs for this slice (multiple-valid-answer problems)
const OI = new Set([...ORDER_INSENSITIVE]);

async function judge(src, stdin) {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  let lastErr;
  for (let a = 1; a <= 4; a++) {
    try {
      const res = await fetch(url, { method:'POST', headers:HEADERS, body: JSON.stringify({ language_id:PY, source_code:src, stdin, cpu_time_limit:8, wall_time_limit:15 }) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0,120)}`);
      const d = await res.json();
      const st = (d?.status?.description||'').toLowerCase();
      if (st && st !== 'accepted') return { ok:false, error: `${d.status.description}: ${(d.stderr||d.compile_output||d.message||'').toString().slice(0,200)}` };
      return { ok:true, stdout: (d.stdout||'').replace(/\r\n/g,'\n').replace(/\n$/,'') };
    } catch(e){ lastErr=e; await sleep(500*a); }
  }
  return { ok:false, error:`unreachable: ${lastErr?.message}` };
}

const codeOf = (e) => typeof e === 'string' ? e : (e && typeof e.python === 'string' ? e.python : (e && typeof e.code === 'string' ? e.code : ''));

const chunkFile = process.argv[2];
const batchFile = process.argv[3];
const onlySlug = process.argv[4] || null;
const chunk = JSON.parse(fs.readFileSync(chunkFile, 'utf8'));
const batch = (await import(path.resolve(batchFile))).default;

let allPass = 0, allFail = 0, missing = 0;
for (const p of chunk) {
  if (onlySlug && p.slug !== onlySlug) continue;
  const code = codeOf(batch[p.slug]);
  if (!code) { console.log(`MISSING  ${p.slug}`); missing++; continue; }
  const cases = Array.isArray(p.test_cases) ? p.test_cases : [];
  let wrapped;
  try { wrapped = wrapWithDriver(code, 'python', p.method_name, p.params, p.return_type); }
  catch(e){ console.log(`FAIL     ${p.slug} wrap-error: ${e.message.slice(0,80)}`); allFail++; continue; }
  let ok = true, detail = '';
  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const r = await judge(wrapped, buildStdin(tc.inputs) + '\n');
    if (!r.ok) { ok=false; detail=`case${i} ERR ${r.error?.slice(0,120)}`; break; }
    if (!compareOutputSmart(r.stdout, tc.expected, { orderInsensitive: OI.has(p.slug) })) {
      ok=false; detail=`case${i} WA in=${JSON.stringify(tc.inputs).slice(0,80)} got=${JSON.stringify(r.stdout).slice(0,60)} want=${JSON.stringify(tc.expected).slice(0,60)}`; break;
    }
  }
  if (ok) { console.log(`PASS     ${p.slug} (${cases.length}/${cases.length})`); allPass++; }
  else { console.log(`FAIL     ${p.slug} ${detail}`); allFail++; }
}
console.log(`\n=== ${allPass} PASS | ${allFail} FAIL | ${missing} MISSING ===`);
