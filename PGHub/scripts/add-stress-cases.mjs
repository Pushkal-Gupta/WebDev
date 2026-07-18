// Add LARGE stress test cases so a correct-but-SLOW solution TLEs here exactly as it does on
// LeetCode. Our existing cases top out at ~15 elements, so an O(n^2)/O(2^n) brute force runs
// instantly and passes — violating "code blocked on LeetCode fails here". This generates
// max-size inputs (near the constraint bound) for problems with a dominant 1-D array param,
// grades them with the CANONICAL python solution (so the expected is correct), sizes down if
// the canonical itself is slow, validates in-domain, and appends them as hidden cases.
//
//   node scripts/add-stress-cases.mjs --dry  [--offset N] [--limit N]
//   node scripts/add-stress-cases.mjs --apply [--offset N] [--limit N]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parseBounds } from './lib/constraint-bounds.mjs';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const OFFSET = arg('offset', 0), LIMIT = arg('limit', 100000);
const THRESHOLD = 5000;   // only stress problems whose array can reach >= this length
const CAP = 60000;        // hard ceiling on generated length (canonical speed + Judge0 + stdin)
const FLOOR = 2000;       // if the canonical can't handle this size, give up on the problem
const rnd = (n) => Math.floor((Math.sin(n * 12.9898) * 43758.5453 % 1 + 1) % 1 * 1e9);   // seeded-ish, Date.now-free

const arrParam = (params) => params.findIndex((p) => p.type === 'List[int]' || p.type === 'List[str]');

// value range for the elements of a List[int] sizing param
function intRange(bounds, name) {
  const pb = bounds?.perParam?.[name] || {};
  let lo = Number.isFinite(pb.min) ? pb.min : 1;
  let hi = Number.isFinite(pb.max) ? pb.max : 10000;
  if (hi - lo > 2_000_000) hi = lo + 2_000_000;   // keep values printable
  if (hi < lo) hi = lo + 100;
  return [lo, hi];
}
function genIntArr(len, lo, hi, seed) { const a = new Array(len); for (let i = 0; i < len; i++) a[i] = lo + (rnd(seed + i) % (hi - lo + 1)); return a; }
function genStrArr(len, seed) { const a = new Array(len); for (let i = 0; i < len; i++) { const L = 1 + rnd(seed + i) % 8; let s = ''; for (let j = 0; j < L; j++) s += String.fromCharCode(97 + rnd(seed + i * 31 + j) % 26); a[i] = s; } return a; }

// build the OTHER params (non-sizing) at a valid, modest value
function genOther(p, bounds, arrLen, seed) {
  const pb = bounds?.perParam?.[p.name] || {}; const sc = bounds?.scalars?.[p.name] || {};
  const lo = Number.isFinite(pb.min ?? sc.min) ? (pb.min ?? sc.min) : 0;
  const hi = Number.isFinite(pb.max ?? sc.max) ? (pb.max ?? sc.max) : arrLen;
  if (p.type === 'int') { let v = Math.min(hi, arrLen); if (!Number.isFinite(v)) v = Math.floor(arrLen / 2); return String(Math.max(lo, Math.min(v, arrLen))); }
  if (p.type === 'float') return String(Math.max(lo, 1));
  if (p.type === 'bool') return 'true';
  if (p.type === 'str') return '"' + genStrArr(1, seed)[0] + '"';
  if (p.type === 'List[int]') return JSON.stringify(genIntArr(Math.min(arrLen, 100), lo, Math.max(lo + 1, hi), seed));
  if (p.type === 'List[str]') return JSON.stringify(genStrArr(Math.min(arrLen, 100), seed));
  return null; // unsupported other-param type -> skip problem
}

let rows = []; let from = 0;
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,constraints,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }

let scanned = 0, added = 0, skipped = { noArr: 0, small: 0, noPy: 0, otherType: 0, canonSlow: 0, alreadyBig: 0, pyFail: 0 };
const report = [];
// Structural constraints a random array would VIOLATE (making the stress case out-of-domain
// and able to false-reject correct code). Skip these — they need a per-problem generator.
const STRUCTURAL = /permutation|sorted|non-?decreasing|non-?increasing|strictly (in|de)creasing|distinct|in (increasing|decreasing|non-decreasing) order|ascending|descending|unique|no duplicate|palindrom|already sorted|0-indexed permutation|1\s*to\s*n/i;
skipped.structural = 0;
const eligible = rows.filter((p) => {
  const params = Array.isArray(p.params) ? p.params : [];
  const ai = arrParam(params); if (ai < 0) { skipped.noArr++; return false; }
  let b; try { b = parseBounds(p.constraints, params); } catch { skipped.noArr++; return false; }
  const pb = b?.perParam?.[params[ai].name] || {};
  const lenMax = pb.lenMax || 0;
  if (lenMax < THRESHOLD) { skipped.small++; return false; }
  if (STRUCTURAL.test(p.constraints || '')) { skipped.structural++; return false; }
  return true;
}).slice(OFFSET, OFFSET + LIMIT);

for (const p of eligible) {
  scanned++;
  const params = p.params; const ai = arrParam(params);
  const py = p.solutions?.python?.code || '';
  if (!/class\s+Solution/.test(py)) { skipped.noPy++; continue; }
  const cases = (Array.isArray(p.test_cases) ? p.test_cases : []).filter((c) => Array.isArray(c.inputs));
  // current biggest array length already present
  const curMax = Math.max(0, ...cases.map((c) => Math.max(0, ...c.inputs.map((s) => (String(s).match(/,/g) || []).length + 1))));
  if (curMax >= CAP / 2) { skipped.alreadyBig++; continue; }

  const b = parseBounds(p.constraints, params);
  const sizeName = params[ai].name;
  const lenMax = Math.min(b.perParam[sizeName].lenMax, CAP);

  // Derive the element VALUE range from the existing (proven in-domain) cases for THIS param,
  // so the large array uses only values the problem already accepts (no OOD guessing). The
  // OTHER params are copied verbatim from a real template case (guaranteed in-domain).
  const template = cases[Math.min(1, cases.length - 1)] || cases[0];
  if (!template || !Array.isArray(template.inputs) || template.inputs[ai] == null) { skipped.otherType++; continue; }
  const isStr = params[ai].type === 'List[str]';
  let lo = Infinity, hi = -Infinity, sampleStrs = [];
  for (const c of cases) {
    const raw = c.inputs?.[ai]; if (typeof raw !== 'string') continue;
    if (isStr) { try { for (const s of JSON.parse(raw)) if (typeof s === 'string') sampleStrs.push(s); } catch { /* skip */ } }
    else { const nums = (raw.match(/-?\d+/g) || []).map(Number); for (const n of nums) { if (n < lo) lo = n; if (n > hi) hi = n; } }
  }
  if (!isStr && (!Number.isFinite(lo) || !Number.isFinite(hi))) { skipped.otherType++; continue; }
  if (isStr && !sampleStrs.length) { skipped.otherType++; continue; }
  if (!isStr && hi === lo) hi = lo + 1;  // avoid zero-width range

  const pyWrap = wrapWithDriver(py, 'python', p.method_name, params, p.return_type);
  // adaptive sizing: start at lenMax, shrink until the canonical runs in < 3.5s
  let len = lenMax, expected = null, inputs = null;
  while (len >= FLOOR) {
    const arr = isStr
      ? Array.from({ length: len }, (_, i) => sampleStrs[rnd(scanned * 101 + i) % sampleStrs.length])
      : genIntArr(len, lo, hi, scanned * 101);
    const arrStr = JSON.stringify(arr);
    const ins = template.inputs.map((v, i) => (i === ai ? arrStr : v));
    const t0 = Number(process.hrtime.bigint() / 1000000n);
    const r = runLocal('python', pyWrap, buildStdin(ins.map(String)) + '\n', { timeoutMs: 4000 });
    const dt = Number(process.hrtime.bigint() / 1000000n) - t0;
    if (r && r.ok && (r.stdout ?? '').trim() !== '' && dt < 3500) { expected = (r.stdout ?? '').replace(/\n$/, ''); inputs = ins; break; }
    len = Math.floor(len / 2);
  }
  if (expected == null) { skipped.canonSlow++; continue; }

  // sanity: re-run the canonical on the same input to confirm determinism
  const r2 = runLocal('python', pyWrap, buildStdin(inputs.map(String)) + '\n', { timeoutMs: 5000 });
  if (!r2 || !r2.ok || !compareOutput((r2.stdout ?? '').replace(/\n$/, ''), expected)) { skipped.pyFail++; continue; }

  const newCase = { inputs, expected, is_sample: false, stress: true };
  report.push({ id: p.id, len, param: sizeName });
  added++;
  if (APPLY) {
    const merged = [...cases, newCase];
    await sb.from('PGcode_problems').update({ test_cases: merged }).eq('id', p.id);
  }
}

fs.writeFileSync('/tmp/health/stress-added.json', JSON.stringify(report, null, 1));
console.log(`eligible (large-array-param): ${eligible.length + OFFSET}+ | scanned ${scanned}`);
console.log(`stress cases ${APPLY ? 'ADDED' : 'would add'}: ${added}`);
console.log('skipped:', JSON.stringify(skipped));
for (const r of report.slice(0, 20)) console.log(`  ${r.id}: +1 case, ${r.param} len ${r.len}`);
console.log('-> /tmp/health/stress-added.json');
