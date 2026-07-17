// Fix return types mislabeled as int when the answer is actually a FLOAT. If any test
// case's expected is a genuine non-integer (e.g. 20.5, 0.78333), an int-returning Java/C++
// solution truncates it and false-rejects correct code (the #1 rule) while Python's float
// sails through. The fix is to widen the declared return type to its float form. We only
// apply when the corrected type lets the PYTHON canonical pass every case via the driver
// (float-tolerant compare) — so we never introduce a regression.
//
//   node scripts/fix-float-return-types.mjs --dry
//   node scripts/fix-float-return-types.mjs --apply
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
const FLOATEN = { 'int': 'float', 'integer': 'float', 'number': 'float', 'List[int]': 'List[float]', 'List[List[int]]': 'List[List[float]]' };

// a genuine non-integer number appears in the expected (not just X.0)
function hasFraction(expected) {
  const s = String(expected);
  const re = /-?\d+\.(\d+)/g; let m;
  while ((m = re.exec(s)) !== null) { if (/[1-9]/.test(m[1])) return m[0]; }
  return null;
}

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
console.log('scanning', rows.length, 'problems');

const report = []; let fixed = 0;
for (const p of rows) {
  const rt = (p.return_type || '').trim();
  if (!FLOATEN[rt]) continue;
  const cases = (Array.isArray(p.test_cases) ? p.test_cases : []).filter(c => Array.isArray(c.inputs));
  if (cases.length < 3) continue;
  const frac = cases.map(c => hasFraction(c.expected)).find(Boolean);
  if (!frac) continue;                              // no genuine fraction → really is int
  const py = p.solutions?.python?.code || '';
  if (!/class\s+Solution/.test(py)) { report.push({ id: p.id, rt, newRt: FLOATEN[rt], skip: 'no-python', frac }); continue; }
  const newRt = FLOATEN[rt];
  // verify python passes ALL cases with the corrected return type
  let w; try { w = wrapWithDriver(py, 'python', p.method_name, p.params, newRt); } catch { report.push({ id: p.id, rt, newRt, skip: 'wrap-err' }); continue; }
  let ok = true, pass = 0;
  for (const tc of cases) { const r = runLocal('python', w, buildStdin(tc.inputs.map(String)) + '\n', { timeoutMs: 15000 }); if (r && r.ok && compareOutput((r.stdout ?? '').replace(/\n$/, ''), tc.expected)) pass++; else { ok = false; break; } }
  if (!ok) { report.push({ id: p.id, rt, newRt, skip: `python ${pass}/${cases.length} with float`, frac }); continue; }
  report.push({ id: p.id, rt, newRt, frac, cases: cases.length });
  if (APPLY) { const { error } = await sb.from('PGcode_problems').update({ return_type: newRt }).eq('id', p.id); if (!error) fixed++; }
}
const good = report.filter(r => !r.skip);
fs.writeFileSync('/tmp/health/float-return-fixes.json', JSON.stringify(report, null, 1));
console.log(`\nfloat-return candidates: ${report.length} (${good.length} verified-safe, ${report.length - good.length} skipped)`);
for (const r of good.slice(0, 30)) console.log(`  ${r.id}: ${r.rt} -> ${r.newRt}  (e.g. ${r.frac})`);
if (report.length - good.length) { console.log('skipped:'); for (const r of report.filter(x => x.skip).slice(0, 12)) console.log(`  ${r.id}: ${r.skip}`); }
console.log(`${APPLY ? `applied ${fixed}` : 'dry-run'} -> /tmp/health/float-return-fixes.json`);
