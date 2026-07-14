// Fix a DEAD/stub problem end-to-end in all four languages. An agent authors a
// correct canonical in Python + JS + Java + C++ and a pool of IN-DOMAIN inputs;
// this script:
//   1. grades the PYTHON canonical through the real driver to compute `expected`
//      for every input (python is the oracle),
//   2. verifies each of JS/Java/C++ passes ALL those cases via the local driver,
//   3. writes ONLY the languages that pass (never stores a wrong solution),
//      the regenerated test_cases, and return_type if supplied.
// A problem is skipped unless python yields >=8 clean cases (canonical likely wrong).
//
// Input JSON: { slug: { python, javascript?, java?, cpp?, return_type?, inputs: [[inpStr,...],...] } }
//   node scripts/apply-full-solution.mjs --in /tmp/dead/out-0.json [--dry] [--target 50]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const IN = arg('in'); const DRY = process.argv.includes('--dry'); const TARGET = Number(arg('target') || 50);
if (!IN) { console.error('need --in'); process.exit(1); }
const BAD = /Reference skeleton|See the Editorial|TODO|NotImplemented/i;
const map = JSON.parse(fs.readFileSync(IN, 'utf8'));
let wrote = 0, failed = 0, totCases = 0; const langStats = { javascript: 0, java: 0, cpp: 0 };
for (const slug of Object.keys(map)) {
  const e = map[slug] || {};
  const py = (e.python || '').trim();
  if (!/class\s+Solution/.test(py) || py.length < 25 || BAD.test(py)) { console.log(`  x    ${slug}: no real python canonical`); failed++; continue; }
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); failed++; continue; }
  const ret = (e.return_type && typeof e.return_type === 'string') ? e.return_type : data.return_type;
  // Retype structural INPUT params (Invariant 1): if the canonical treats a param as a
  // node object (.left/.right/.next/.children) but it's stored as a raw array, the driver
  // must reconstruct the real node. Prefer an explicit agent `params`, else auto-detect.
  let newParams;
  if (Array.isArray(e.params) && e.params.length === (data.params || []).length) {
    newParams = e.params;
  } else {
    const usesTree = /\b\w+\.(left|right)\b|\bTreeNode\b/.test(py);
    const usesList = /\b\w+\.next\b|\bListNode\b/.test(py);
    const usesNary = /\.children\b/.test(py) || /:\s*'?Node'?/.test(py);
    newParams = (data.params || []).map((p) => {
      const q = { ...p }; const n = (p.name || '').toLowerCase();
      if (p.type !== 'List[int]' && p.type !== 'List[List[int]]') return q;
      if (usesList && /^(head|l1|l2|list1|list2|lista|listb)$/.test(n)) q.type = 'ListNode';
      else if (usesNary && /^(root|tree)$/.test(n)) q.type = 'Node';
      else if (usesTree && /^(root|tree|root1|root2|subroot|original|cloned)$/.test(n)) q.type = 'TreeNode';
      return q;
    });
  }
  const paramsChanged = JSON.stringify(newParams) !== JSON.stringify(data.params || []);
  let wrapped; try { wrapped = wrapWithDriver(py, 'python', data.method_name, newParams, ret); } catch (err) { console.log(`  x    ${slug}: wrap ${err.message.slice(0, 40)}`); failed++; continue; }
  // build graded cases from agent inputs + existing case inputs (recomputed)
  const cand = Array.isArray(e.inputs) ? e.inputs.slice() : [];
  for (const c of (Array.isArray(data.test_cases) ? data.test_cases : [])) if (Array.isArray(c.inputs)) cand.push(c.inputs);
  const seen = new Set(); const cases = [];
  for (const tuple of cand) {
    if (cases.length >= TARGET) break;
    if (!Array.isArray(tuple)) continue;
    const inputs = tuple.map((v) => String(v)); const key = JSON.stringify(inputs); if (seen.has(key)) continue;
    let r; try { r = runLocal('python', wrapped, buildStdin(inputs) + '\n', { timeoutMs: 6000 }); } catch { continue; }
    if (!r || !r.ok) continue;
    const expected = (r.stdout ?? '').replace(/\n$/, ''); if (expected === '') continue;
    // A `null` expected on a non-nullable return (str/int/bool/double/List[...]) means
    // the INPUT was out-of-domain (e.g. a guaranteed-answer problem with no answer):
    // python emits None->"null" while typed langs emit ""/0 -> false lang mismatch AND
    // a polluted case. Only node/Optional returns may legitimately be null.
    const nullable = /Optional|TreeNode|ListNode|Node/.test(ret);
    if (!nullable && expected === 'null') continue;
    seen.add(key); cases.push({ inputs, expected, is_sample: cases.length < 2 });
  }
  if (cases.length < 8) { console.log(`  x    ${slug}: only ${cases.length} clean python cases (canonical wrong?)`); failed++; continue; }
  // verify the other three languages against these cases; keep only those that pass all
  const sol = { ...(data.solutions || {}), python: { code: py } };
  const langReport = ['python(oracle)'];
  for (const [lang, code] of [['javascript', e.javascript], ['java', e.java], ['cpp', e.cpp]]) {
    const c = (code || '').trim(); if (!c || BAD.test(c)) { langReport.push(`${lang}:absent`); continue; }
    let w; try { w = wrapWithDriver(c, lang, data.method_name, newParams, ret); } catch { langReport.push(`${lang}:wrap-err`); continue; }
    let ok = true;
    for (const tc of cases) { const r = runLocal(lang, w, buildStdin(tc.inputs) + '\n', { timeoutMs: 15000 }); if (!r || !r.ok || !compareOutput((r.stdout ?? '').replace(/\n$/, ''), tc.expected)) { ok = false; break; } }
    if (ok) { sol[lang] = { code: c }; langStats[lang]++; langReport.push(`${lang}:PASS`); } else { langReport.push(`${lang}:FAIL(skip)`); }
  }
  if (!DRY) {
    const upd = { solutions: sol, test_cases: cases }; if (ret !== data.return_type) upd.return_type = ret; if (paramsChanged) upd.params = newParams;
    const { error: uerr } = await sb.from('PGcode_problems').update(upd).eq('id', slug); if (uerr) { console.log(`  ERR  ${slug}: ${uerr.message.slice(0, 40)}`); failed++; continue; }
  }
  wrote++; totCases += cases.length;
  console.log(`  WROTE ${slug}: ${cases.length} cases | ${langReport.join(' ')}`);
}
console.log(`\n${DRY ? 'would-write' : 'wrote'}: ${wrote} | failed: ${failed} | cases: ${totCases} | langs js:${langStats.javascript} java:${langStats.java} cpp:${langStats.cpp}`);
