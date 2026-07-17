// Apply the mistyped-tree fix: retype tree params List[int] -> TreeNode, install correct
// TreeNode-recursion canonicals in all 4 langs, REGRADE every case with the new python
// canonical (the old array-hack produced at least one wrong expected), then verify js/java/
// cpp pass the regraded cases. Only writes a problem if ALL 4 langs pass every case.
//   node scripts/apply-tree-fix.mjs --dry
//   node scripts/apply-tree-fix.mjs --apply
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
const fix = JSON.parse(fs.readFileSync('/tmp/bf/tree-fix.json', 'utf8'));

for (const id of Object.keys(fix)) {
  const e = fix[id];
  const { data, error } = await sb.from('PGcode_problems').select('id, method_name, test_cases, params, return_type').eq('id', id).single();
  if (error || !data) { console.log(`${id}: FETCH FAIL`); continue; }
  const params = e.params;                        // retyped (TreeNode)
  const rt = e.return_type || data.return_type;
  const cases = (Array.isArray(data.test_cases) ? data.test_cases : []).filter(c => Array.isArray(c.inputs));

  // 1) regrade every case with the NEW python canonical
  const pyWrap = wrapWithDriver(e.python, 'python', data.method_name, params, rt);
  const regraded = []; let changed = 0, pyFail = 0;
  for (const c of cases) {
    const r = runLocal('python', pyWrap, buildStdin(c.inputs.map(String)) + '\n', { timeoutMs: 15000 });
    if (!r || !r.ok) { pyFail++; regraded.push(c); continue; }
    const out = (r.stdout ?? '').replace(/\n$/, '').trim();
    if (!compareOutput(out, c.expected)) changed++;
    regraded.push({ ...c, expected: out });
  }
  if (pyFail) { console.log(`${id}: python failed to run on ${pyFail} case(s) — SKIP (needs manual look)`); continue; }

  // 2) verify all 4 langs pass the regraded cases
  const report = {};
  for (const lang of ['python', 'javascript', 'java', 'cpp']) {
    const code = e[lang]; if (!code) { report[lang] = 'MISSING'; continue; }
    let w; try { w = wrapWithDriver(code, lang, data.method_name, params, rt); } catch { report[lang] = 'WRAP-ERR'; continue; }
    let ok = true;
    for (const tc of regraded) { const r = runLocal(lang, w, buildStdin(tc.inputs.map(String)) + '\n', { timeoutMs: 15000 }); if (!r || !r.ok || !compareOutput((r.stdout ?? '').replace(/\n$/, ''), tc.expected)) { ok = false; break; } }
    report[lang] = ok ? 'PASS' : 'FAIL';
  }
  const allPass = ['python', 'javascript', 'java', 'cpp'].every(l => report[l] === 'PASS');
  console.log(`${id}: regraded ${changed}/${cases.length} expecteds | ${Object.entries(report).map(([k, v]) => k + ':' + v).join(' ')} | ${allPass ? 'READY' : 'BLOCKED'}`);
  if (allPass && APPLY) {
    const kept = regraded.map((c, i) => ({ ...c, is_sample: i < 2 }));
    const solutions = {};
    for (const lang of ['python', 'javascript', 'java', 'cpp']) solutions[lang] = { code: e[lang] };
    // merge onto existing solutions to keep any other fields
    const { data: cur } = await sb.from('PGcode_problems').select('solutions').eq('id', id).single();
    const merged = { ...(cur?.solutions || {}), ...solutions };
    const { error: uerr } = await sb.from('PGcode_problems').update({ params, return_type: rt, solutions: merged, test_cases: kept }).eq('id', id);
    console.log(`   ${uerr ? 'WRITE ERR: ' + uerr.message : 'WROTE params+solutions+test_cases'}`);
  }
}
