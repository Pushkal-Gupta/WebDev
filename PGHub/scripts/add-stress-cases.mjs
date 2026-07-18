// Add LARGE stress test cases so a correct-but-SLOW solution TLEs here exactly as on LeetCode.
// Handles THREE sizer kinds: a 1-D array param (List[int]/List[str]), a 2-D array param
// (List[List[int]]/List[List[str]]), or a scalar-N int param whose bound is large. In every
// case the enlarged input is built from the problem's OWN existing (in-domain) cases so it can
// never be out-of-domain, and the expected is computed by the CANONICAL python (adaptively
// down-sized if the canonical is slow). Structural constraints (permutation/sorted/distinct)
// are skipped — a synthesized large input would violate them.
//   node scripts/add-stress-cases.mjs --dry|--apply [--offset N] [--limit N]
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
// CAP lowered 60k -> 12k (2026-07-18): 12k elements already TLE any O(n^2) Python solution
// (144M ops > 5s), and the 60k JSONB payloads (~300KB each) bloated the DB enough to trigger
// an automatic disk RESIZE that took the whole project offline. See project_supabase_resize_incident.
const THRESHOLD = 5000, CAP = 12000, FLOOR = 2000, SCALAR_THRESHOLD = 20000;
const rnd = (n) => Math.floor((Math.sin(n * 12.9898) * 43758.5453 % 1 + 1) % 1 * 1e9);
const STRUCTURAL = /permutation|sorted|non-?decreasing|non-?increasing|strictly (in|de)creasing|distinct|in (increasing|decreasing|non-decreasing) order|ascending|descending|unique|no duplicate|palindrom|already sorted/i;
const ONE_D = new Set(['List[int]', 'List[str]']);
const TWO_D = new Set(['List[List[int]]', 'List[List[str]]']);

// choose the param to enlarge + how. Returns {i, kind, bound} or null.
function pickSizer(params, bounds) {
  // prefer a 1-D array with a large length bound
  for (let i = 0; i < params.length; i++) if (ONE_D.has(params[i].type)) { const b = bounds?.perParam?.[params[i].name]?.lenMax || 0; if (b >= THRESHOLD) return { i, kind: '1d', bound: b }; }
  for (let i = 0; i < params.length; i++) if (TWO_D.has(params[i].type)) { const b = bounds?.perParam?.[params[i].name]?.lenMax || 0; if (b >= THRESHOLD) return { i, kind: '2d', bound: b }; }
  // scalar-N: a single int param whose value bound is large and NO array param
  if (!params.some((p) => ONE_D.has(p.type) || TWO_D.has(p.type))) {
    for (let i = 0; i < params.length; i++) if (params[i].type === 'int') { const sc = bounds?.scalars?.[params[i].name] || bounds?.perParam?.[params[i].name] || {}; const mx = sc.max || 0; if (mx >= SCALAR_THRESHOLD) return { i, kind: 'scalar', bound: Math.min(mx, CAP) }; }
  }
  return null;
}

let rows = [], from = 0;
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,constraints,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }

const skipped = { noSizer: 0, noPy: 0, structural: 0, alreadyBig: 0, canonSlow: 0, pyFail: 0, badTemplate: 0 };
const eligible = [];
for (const p of rows) {
  const params = Array.isArray(p.params) ? p.params : [];
  let b; try { b = parseBounds(p.constraints, params); } catch { skipped.noSizer++; continue; }
  const sizer = pickSizer(params, b); if (!sizer) { skipped.noSizer++; continue; }
  if (STRUCTURAL.test(p.constraints || '')) { skipped.structural++; continue; }
  eligible.push({ p, sizer, b });
}
const work = eligible.slice(OFFSET, OFFSET + LIMIT);

let added = 0; const report = [];
for (const { p, sizer, b } of work) {
  const params = p.params; const py = p.solutions?.python?.code || '';
  if (!/class\s+Solution/.test(py)) { skipped.noPy++; continue; }
  const cases = (Array.isArray(p.test_cases) ? p.test_cases : []).filter((c) => Array.isArray(c.inputs));
  const curMax = Math.max(0, ...cases.map((c) => Math.max(0, ...c.inputs.map((s) => (String(s).match(/,/g) || []).length + 1))));
  const template = cases[Math.min(1, cases.length - 1)] || cases[0];
  if (!template || !Array.isArray(template.inputs)) { skipped.badTemplate++; continue; }
  const i = sizer.i;
  if (sizer.kind === 'scalar') { if (curMax >= SCALAR_THRESHOLD) { skipped.alreadyBig++; continue; } }
  else if (curMax >= CAP / 2) { skipped.alreadyBig++; continue; }

  const pyWrap = wrapWithDriver(py, 'python', p.method_name, params, p.return_type);
  const seed = report.length * 101 + 7;
  let expected = null, inputs = null, usedLen = 0;

  const attempt = (buildArrStr) => {
    const ins = template.inputs.map((v, k) => (k === i ? buildArrStr : v));
    const r = runLocal('python', pyWrap, buildStdin(ins.map(String)) + '\n', { timeoutMs: 4000 });
    if (r && r.ok && (r.stdout ?? '').trim() !== '') return { ins, out: (r.stdout ?? '').replace(/\n$/, '') };
    return null;
  };

  if (sizer.kind === '1d') {
    const isStr = params[i].type === 'List[str]';
    let lo = Infinity, hi = -Infinity; const strs = [];
    for (const c of cases) { const raw = c.inputs?.[i]; if (typeof raw !== 'string') continue; if (isStr) { try { for (const s of JSON.parse(raw)) if (typeof s === 'string') strs.push(s); } catch { /**/ } } else { for (const n of (raw.match(/-?\d+/g) || []).map(Number)) { if (n < lo) lo = n; if (n > hi) hi = n; } } }
    if ((!isStr && !Number.isFinite(lo)) || (isStr && !strs.length)) { skipped.badTemplate++; continue; }
    if (!isStr && hi === lo) hi = lo + 1;
    let len = Math.min(sizer.bound, CAP);
    while (len >= FLOOR && !expected) {
      const arr = isStr ? Array.from({ length: len }, (_, j) => strs[rnd(seed + j) % strs.length]) : Array.from({ length: len }, (_, j) => lo + (rnd(seed + j) % (hi - lo + 1)));
      const a = attempt(JSON.stringify(arr)); if (a) { expected = a.out; inputs = a.ins; usedLen = len; } else len = Math.floor(len / 2);
    }
  } else if (sizer.kind === '2d') {
    // sample rows from the existing 2-D value(s); enlarge the OUTER length.
    let rowsPool = [];
    for (const c of cases) { const raw = c.inputs?.[i]; if (typeof raw !== 'string') continue; try { const v = JSON.parse(raw); if (Array.isArray(v) && v.length && Array.isArray(v[0])) rowsPool.push(...v); } catch { /**/ } }
    if (!rowsPool.length) { skipped.badTemplate++; continue; }
    let len = Math.min(sizer.bound, CAP);
    while (len >= FLOOR && !expected) {
      const arr = Array.from({ length: len }, (_, j) => rowsPool[rnd(seed + j) % rowsPool.length]);
      const a = attempt(JSON.stringify(arr)); if (a) { expected = a.out; inputs = a.ins; usedLen = len; } else len = Math.floor(len / 2);
    }
  } else { // scalar
    let n = sizer.bound;
    while (n >= FLOOR && !expected) { const a = attempt(String(n)); if (a) { expected = a.out; inputs = a.ins; usedLen = n; } else n = Math.floor(n / 2); }
  }

  if (expected == null) { skipped.canonSlow++; continue; }
  // determinism re-check
  const r2 = runLocal('python', pyWrap, buildStdin(inputs.map(String)) + '\n', { timeoutMs: 5000 });
  if (!r2 || !r2.ok || !compareOutput((r2.stdout ?? '').replace(/\n$/, ''), expected)) { skipped.pyFail++; continue; }

  added++; report.push({ id: p.id, kind: sizer.kind, size: usedLen });
  if (APPLY) await sb.from('PGcode_problems').update({ test_cases: [...cases, { inputs, expected, is_sample: false, stress: true }] }).eq('id', p.id);
}

fs.writeFileSync('/tmp/health/stress-added.json', JSON.stringify(report, null, 1));
console.log(`total eligible (all sizer kinds): ${eligible.length} | worked ${work.length}`);
console.log(`stress cases ${APPLY ? 'ADDED' : 'would add'}: ${added} (1d/2d/scalar mix)`);
console.log('skipped:', JSON.stringify(skipped));
const byKind = report.reduce((a, r) => (a[r.kind] = (a[r.kind] || 0) + 1, a), {});
console.log('by kind:', JSON.stringify(byKind));
console.log('-> /tmp/health/stress-added.json');
