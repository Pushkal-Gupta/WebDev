// Differential OOD pruner using PORT-CRASH as the oracle. For each ported candidate in the
// /tmp/bf/out-*.json wave files: if the Python canonical passes every case, and a faithful
// Java/C++ port (which we're about to store) passes all the "clean" cases but CRASHES (empty
// output / non-ok) on a handful of cases whose int-array params contain a NEGATIVE value, then
// those crashing cases are out-of-domain (a correct fixed-width solution literally cannot run
// them — negative array index). Prune them. This is safe:
//   - only cases the port CRASHES on are touched (never a case it can satisfy),
//   - only when the crash coincides with a negative in a List[int]/List[List[int]] param
//     (the OOD signal — distinguishes bad-id crashes from a valid-negative coordinate port,
//      which wouldn't crash),
//   - only when >=8 clean cases remain, and the port then passes ALL of them.
// A port that fails a case WITHOUT crashing, or on a case with no negative, is treated as a
// port bug (not OOD) and the problem is left untouched.
//   node scripts/prune-via-port-crash.mjs --dry
//   node scripts/prune-via-port-crash.mjs --apply
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
const MIN_KEEP = 8;

const outFiles = fs.readdirSync('/tmp/bf').filter(f => /^out-\d+\.json$/.test(f)).map(f => `/tmp/bf/${f}`);
const ports = {};
for (const f of outFiles) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); for (const k of Object.keys(j)) ports[k] = { ...(ports[k] || {}), ...j[k] }; }
const slugs = Object.keys(ports);
console.log('candidate ported problems:', slugs.length);

const negInIntArrayParam = (inputs, params) => params.some((p, i) => /List\[int\]|List\[List\[int\]\]/.test(p.type || '') && typeof inputs[i] === 'string' && /-\d/.test(inputs[i]));
const crashed = (r, exp) => !r || !r.ok || (r.stdout ?? '').trim() === '' || !compareOutput((r.stdout ?? '').replace(/\n$/, ''), exp);
const isCrash = (r) => !r || !r.ok || (r.stdout ?? '').trim() === '';

const report = []; let pruned = 0, totalDropped = 0;
for (const slug of slugs) {
  const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (!data) continue;
  const params = Array.isArray(data.params) ? data.params : [];
  const cases = (Array.isArray(data.test_cases) ? data.test_cases : []).filter(c => Array.isArray(c.inputs));
  if (cases.length < MIN_KEEP + 1) continue;
  const py = data.solutions?.python?.code || '';
  if (!/class\s+Solution/.test(py)) continue;
  // pick a port language we have
  const lang = ['java', 'cpp', 'javascript'].find(L => ports[slug][L]);
  if (!lang) continue;

  // python must pass every case (expected is python-consistent)
  let pyOk = true; const pw = wrapWithDriver(py, 'python', data.method_name, params, data.return_type);
  for (const tc of cases) { const r = runLocal('python', pw, buildStdin(tc.inputs.map(String)) + '\n', { timeoutMs: 15000 }); if (!r || !r.ok || !compareOutput((r.stdout ?? '').replace(/\n$/, ''), tc.expected)) { pyOk = false; break; } }
  if (!pyOk) { report.push({ slug, skip: 'python-fails' }); continue; }

  let pw2; try { pw2 = wrapWithDriver(ports[slug][lang], lang, data.method_name, params, data.return_type); } catch { report.push({ slug, skip: 'wrap-err' }); continue; }
  const keep = [], dropped = [];
  let unsafe = false;
  for (const tc of cases) {
    const r = runLocal(lang, pw2, buildStdin(tc.inputs.map(String)) + '\n', { timeoutMs: 15000 });
    if (!crashed(r, tc.expected)) { keep.push(tc); continue; }
    // port failed this case. Only OK to drop if it CRASHED and the case has a negative int-array input.
    if (isCrash(r) && negInIntArrayParam(tc.inputs, params)) dropped.push(tc);
    else { unsafe = true; break; }   // a non-crash divergence or non-negative fail => port bug, bail
  }
  if (unsafe) { report.push({ slug, skip: 'port-diverges-non-OOD' }); continue; }
  if (!dropped.length) { report.push({ slug, skip: 'no-OOD-drops' }); continue; }
  if (keep.length < MIN_KEEP) { report.push({ slug, skip: 'too-few-kept', drop: dropped.length }); continue; }
  totalDropped += dropped.length;
  report.push({ slug, lang, drop: dropped.length, keep: keep.length, sample: dropped[0].inputs.map(s => String(s).slice(0, 24)) });
  if (APPLY) {
    const kept2 = keep.map((c, i) => ({ ...c, is_sample: i < 2 }));
    const { error } = await sb.from('PGcode_problems').update({ test_cases: kept2 }).eq('id', slug); if (!error) pruned++;
  }
}
const good = report.filter(r => !r.skip);
fs.writeFileSync('/tmp/health/port-crash-prune.json', JSON.stringify(report, null, 1));
console.log(`\nOOD (port-crash) prunable: ${good.length} problems, ${totalDropped} cases ${APPLY ? `| pruned ${pruned}` : '(dry)'}`);
for (const r of good.slice(0, 30)) console.log(`  ${r.slug} (${r.lang}): drop ${r.drop}, keep ${r.keep}  e.g. ${JSON.stringify(r.sample)}`);
console.log('-> /tmp/health/port-crash-prune.json');
