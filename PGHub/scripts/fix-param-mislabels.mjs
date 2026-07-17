// Fix ambiguous/mislabeled PARAM types (Any, List[Any], List[List[Any]], number, bare List)
// by INFERRING the concrete type from the actual test inputs, then verifying the Python
// canonical still passes every case through the driver with the corrected params. Only
// applies when inference yields a supported concrete type AND python passes — so a wrong
// guess can never ship. Ambiguous/heterogeneous inputs are left untouched.
//   node scripts/fix-param-mislabels.mjs --dry
//   node scripts/fix-param-mislabels.mjs --apply
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const AMBIGUOUS = new Set(['Any', 'List[Any]', 'List[List[Any]]', 'number', 'List', 'List[number]', 'List[List[number]]']);
const SUPPORTED = new Set(['int', 'float', 'bool', 'str', 'List[int]', 'List[float]', 'List[bool]', 'List[str]', 'List[List[int]]', 'List[List[float]]', 'List[List[str]]']);

const isInt = (n) => typeof n === 'number' && Number.isInteger(n);
const isNum = (n) => typeof n === 'number';
// infer a concrete type from one parsed JSON value
function shapeOf(v) {
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return isInt(v) ? 'int' : 'float';
  if (typeof v === 'string') return 'str';
  if (Array.isArray(v)) {
    if (!v.length) return 'List[]';                          // empty — unknown element type
    if (v.every(isNum)) return v.every(isInt) ? 'List[int]' : 'List[float]';
    if (v.every((x) => typeof x === 'string')) return 'List[str]';
    if (v.every((x) => typeof x === 'boolean')) return 'List[bool]';
    if (v.every(Array.isArray)) {
      const inner = v.flat();
      if (inner.length && inner.every(isNum)) return inner.every(isInt) ? 'List[List[int]]' : 'List[List[float]]';
      if (inner.length && inner.every((x) => typeof x === 'string')) return 'List[List[str]]';
      return null;                                           // ragged / heterogeneous
    }
    return null;                                             // heterogeneous list
  }
  return null;                                               // dict/object — unsupported
}
// merge two inferred shapes across cases (int+float -> float; List[]+List[int] -> List[int])
function merge(a, b) {
  if (!a) return b; if (!b) return a; if (a === b) return a;
  const pair = [a, b].sort().join('|');
  const rules = {
    'float|int': 'float', 'List[float]|List[int]': 'List[float]', 'List[List[float]]|List[List[int]]': 'List[List[float]]',
    'List[]|List[int]': 'List[int]', 'List[]|List[str]': 'List[str]', 'List[]|List[float]': 'List[float]', 'List[]|List[bool]': 'List[bool]',
    'List[]|List[List[int]]': 'List[List[int]]', 'List[]|List[List[str]]': 'List[List[str]]',
  };
  return rules[pair] || null;
}

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
console.log('scanning', rows.length, 'problems');

const report = []; let fixed = 0;
for (const p of rows) {
  const params = Array.isArray(p.params) ? p.params : [];
  if (!params.some((pp) => AMBIGUOUS.has((pp.type || '').trim()))) continue;
  const cases = (Array.isArray(p.test_cases) ? p.test_cases : []).filter(c => Array.isArray(c.inputs));
  if (cases.length < 3) continue;
  const py = p.solutions?.python?.code || '';
  if (!/class\s+Solution/.test(py)) continue;

  const newParams = params.map((pp) => ({ ...pp }));
  const changes = [];
  let bail = false;
  params.forEach((pp, i) => {
    const t = (pp.type || '').trim();
    if (!AMBIGUOUS.has(t)) return;
    let inferred = null;
    for (const c of cases) {
      const raw = c.inputs[i]; if (typeof raw !== 'string') { bail = true; return; }
      let v; try { v = JSON.parse(raw); } catch { bail = true; return; }
      inferred = merge(inferred, shapeOf(v));
      if (!inferred) { bail = true; return; }
    }
    if (!inferred || inferred === 'List[]' || !SUPPORTED.has(inferred)) { bail = true; return; }
    if (inferred !== t) { newParams[i].type = inferred; changes.push(`${pp.name}:${t}->${inferred}`); }
  });
  if (bail || !changes.length) { if (!bail && !changes.length) continue; report.push({ id: p.id, skip: bail ? 'cant-infer' : 'no-change' }); continue; }

  // verify python passes ALL cases with the corrected params
  let w; try { w = wrapWithDriver(py, 'python', p.method_name, newParams, p.return_type); } catch { report.push({ id: p.id, changes, skip: 'wrap-err' }); continue; }
  let ok = true, pass = 0;
  for (const tc of cases) { const r = runLocal('python', w, buildStdin(tc.inputs.map(String)) + '\n', { timeoutMs: 15000 }); if (r && r.ok && compareOutput((r.stdout ?? '').replace(/\n$/, ''), tc.expected)) pass++; else { ok = false; break; } }
  if (!ok) { report.push({ id: p.id, changes, skip: `python ${pass}/${cases.length}` }); continue; }
  report.push({ id: p.id, changes });
  if (APPLY) { const { error } = await sb.from('PGcode_problems').update({ params: newParams }).eq('id', p.id); if (!error) fixed++; }
}
const good = report.filter(r => !r.skip);
fs.writeFileSync('/tmp/health/param-mislabel-fixes.json', JSON.stringify(report, null, 1));
console.log(`\nparam-mislabel candidates: ${report.length} (${good.length} verified-safe, ${report.length - good.length} skipped)`);
for (const r of good.slice(0, 30)) console.log(`  ${r.id}: ${r.changes.join(', ')}`);
console.log(`${APPLY ? `applied ${fixed}` : 'dry-run'} -> /tmp/health/param-mislabel-fixes.json`);
