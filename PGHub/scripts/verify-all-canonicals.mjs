// Full-catalog integrity sweep: the definitive "test cases are PROPER" check.
// For every problem with a Python canonical, run it against ALL its stored test
// cases via the local grader. A proper suite => the canonical passes 100% of its
// own cases (they were graded by it). Any FAIL means either a wrong `expected`
// or a broken canonical — logged for repair. Also flags problems with too few
// cases (< MIN) and null/empty expecteds.
//
//   node scripts/verify-all-canonicals.mjs [--min 12] [--offset N] [--max M]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const MIN = Number(arg('min', 12)); const OFFSET = Number(arg('offset', 0)); const MAX = Number(arg('max', 100000));

const CACHE = '/tmp/vall-rows.json';
let rows = [];
if (fs.existsSync(CACHE)) {
  rows = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
} else {
  let from = 0;
  while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
  fs.writeFileSync(CACHE, JSON.stringify(rows));
}
rows = rows.slice(OFFSET, OFFSET + MAX);
console.log('scanning', rows.length, 'problems | min-cases', MIN);

const failing = [], thin = [], nullExp = [], noCanon = [];
let ok = 0, checked = 0;
for (const p of rows) {
  const tcs = Array.isArray(p.test_cases) ? p.test_cases : [];
  const code = p.solutions?.python?.code;
  if (tcs.some(c => c.expected === null || c.expected === undefined)) nullExp.push(p.id);
  if (tcs.length < MIN) thin.push({ id: p.id, n: tcs.length });
  if (!code || !/class\s+Solution/.test(code)) { noCanon.push(p.id); continue; }
  let wrapped; try { wrapped = wrapWithDriver(code, 'python', p.method_name, p.params, p.return_type); } catch { noCanon.push(p.id); continue; }
  if (!tcs.length) continue;
  checked++;
  let pass = 0, fail = 0, firstFail = null;
  for (const c of tcs) {
    if (!Array.isArray(c.inputs)) continue;
    let r; try { r = runLocal('python', wrapped, buildStdin(c.inputs.map(String)) + '\n', { timeoutMs: 6000 }); } catch { fail++; continue; }
    if (!r || !r.ok) { fail++; if (!firstFail) firstFail = { inputs: c.inputs, err: (r?.stderr || '').slice(0, 60) }; continue; }
    const out = (r.stdout ?? '').replace(/\n$/, '');
    if (compareOutput(out, c.expected)) pass++;
    else { fail++; if (!firstFail) firstFail = { inputs: c.inputs, exp: c.expected, got: out }; }
  }
  if (fail > 0) failing.push({ id: p.id, pass, fail, total: tcs.length, firstFail });
  else ok++;
}
failing.sort((a, b) => b.fail - a.fail);
fs.writeFileSync(`/tmp/verify-all-${OFFSET}.json`, JSON.stringify({ failing, thin, nullExp, noCanon }, null, 2));
console.log('\n=== INTEGRITY REPORT ===');
console.log('canonical passes ALL own cases:', ok, '/', checked, 'checked');
console.log('FAILING (improper cases or broken canonical):', failing.length);
console.log('thin (<' + MIN + ' cases):', thin.length);
console.log('null/empty expected present:', nullExp.length);
console.log('no usable canonical:', noCanon.length);
console.log('\ntop failing:');
for (const f of failing.slice(0, 30)) console.log(`  ${f.id}: ${f.pass}/${f.total} (${f.fail} fail) | exp=${JSON.stringify(f.firstFail?.exp)?.slice(0, 34)} got=${JSON.stringify(f.firstFail?.got)?.slice(0, 34)}${f.firstFail?.err ? ' ERR ' + f.firstFail.err : ''}`);
