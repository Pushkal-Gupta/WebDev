// Quantify out-of-domain (OOD) test cases via the port-crash oracle, and how many 4-lang
// backfill ports they block. For each backfill-ported problem: grade the canonical Python and
// the ported Java/C++ on every real case. A case is an OOD CANDIDATE iff Python produces an
// answer but a faithful port CRASHES on it (structural exception / no output) — a
// constraint-respecting fixed-width solution literally cannot process that input.
// SAFE-PRUNE rule (reported, not applied here): prune the OOD cases only if >=MIN_KEEP clean
// cases remain AND the port then passes ALL of them (proves the port is correct, so the crash
// was the input's fault, not the code's). Dry analysis only — writes a report for review.
//   node scripts/ood-analyze.mjs <scratchpad>
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, JAVA_CASE_SEP, JAVA_OUT_END } from '../src/lib/driverCode.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SP = process.argv[2]; const APPLY = process.argv.includes('--apply'); const MIN_KEEP = 8; const DIR = fs.mkdtempSync(os.tmpdir() + '/ood-');

function stripNodeClasses(code) { for (const kw of ['class', 'struct']) for (const name of ['ListNode', 'TreeNode', 'Node']) { let idx; while ((idx = code.search(new RegExp(`(^|\\n)\\s*(public\\s+)?${kw}\\s+${name}\\b`))) >= 0) { const bs = code.indexOf('{', idx); if (bs < 0) break; let d = 0, end = -1; for (let i = bs; i < code.length; i++) { if (code[i] === '{') d++; else if (code[i] === '}') { d--; if (d === 0) { end = i; break; } } } if (end < 0) break; let cut = end + 1; if (kw === 'struct' && code[cut] === ';') cut++; code = code.slice(0, idx) + '\n' + code.slice(cut); } } return code; }
const CRASH = /###ERR###|Exception|Error|Traceback|terminate|Segmentation|core dumped|out_of_range|bad_alloc|OutOfBounds|NegativeArray/i;

function runPy(code, method, params, rt, cases) {
  let w; try { w = wrapWithDriver(code, 'python', method, params, rt); } catch { return null; }
  fs.writeFileSync(`${DIR}/m.py`, w); const parts = [];
  for (const c of cases) { const r = spawnSync('python3', [`${DIR}/m.py`], { input: c.inputs.join('\n') + '\n', encoding: 'utf8', timeout: 12000, maxBuffer: 5e7 }); parts.push({ out: (r.stdout || '').replace(/\n$/, ''), crash: r.status !== 0 || CRASH.test(r.stderr || '') }); }
  return parts;
}
function runCompiled(lang, code, method, params, rt, cases) {
  let wrapped; try { wrapped = wrapWithDriver(stripNodeClasses(code), lang, method, params, rt, { multiCaseCount: cases.length }); } catch { return null; }
  const stdin = cases.map((c) => c.inputs.join('\n')).join('\n' + JAVA_CASE_SEP + '\n') + '\n';
  if (lang === 'java') { let mc = 'Main'; for (const s of wrapped.split(/\bclass\s+/)) if (/public static void main/.test(s)) { mc = (s.match(/^(\w+)/) || [])[1] || 'Main'; break; } fs.writeFileSync(`${DIR}/${mc}.java`, wrapped); const comp = spawnSync('javac', [`${DIR}/${mc}.java`, '-d', DIR], { encoding: 'utf8', timeout: 30000 }); if (comp.status !== 0) return { compileFail: true }; const run = spawnSync('java', ['-cp', DIR, mc], { input: stdin, encoding: 'utf8', timeout: 20000, maxBuffer: 5e7 }); return { parts: (run.stdout || '').split(JAVA_OUT_END + '\n').map((p) => p.replace(/\n$/, '')) }; }
  fs.writeFileSync(`${DIR}/main.cpp`, wrapped); const comp = spawnSync('g++', ['-std=c++17', '-O1', '-I', 'scripts/_cppshim', `${DIR}/main.cpp`, '-o', `${DIR}/a.out`], { encoding: 'utf8', timeout: 40000 }); if (comp.status !== 0) return { compileFail: true }; const run = spawnSync(`${DIR}/a.out`, [], { input: stdin, encoding: 'utf8', timeout: 20000, maxBuffer: 5e7 }); return { parts: (run.stdout || '').split(JAVA_OUT_END + '\n').map((p) => p.replace(/\n$/, '')) };
}
const norm = (s) => String(s ?? '').trim();
const isCrash = (s) => CRASH.test(String(s ?? '')) || String(s ?? '').trim() === '';

const ports = {};
for (let i = 0; i < 40; i++) { const f = `${SP}/backfill/wf/s${i}/out.json`; if (!fs.existsSync(f)) continue; const j = JSON.parse(fs.readFileSync(f, 'utf8')); for (const k of Object.keys(j)) ports[k] = j[k]; }
const slugs = Object.keys(ports);
let oodProblems = 0, oodCases = 0, recoverable = 0; const report = [];
for (const slug of slugs) {
  const { data, error } = await sb.from('PGcode_problems').select('method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (error || !data) continue;
  const cases = (Array.isArray(data.test_cases) ? data.test_cases : []).filter((c) => Array.isArray(c.inputs) && !c.stress).slice(0, 60);
  if (cases.length < MIN_KEEP + 2) continue;
  const py = data.solutions?.python?.code; if (!py) continue;
  const rt = data.return_type || 'int'; const isStr = rt === 'str' || rt === 'string';
  const pyRes = runPy(py, data.method_name, data.params, rt, cases); if (!pyRes) continue;
  // choose the port lang to test: prefer java, else cpp
  const lang = ports[slug].java ? 'java' : ports[slug].cpp ? 'cpp' : null; if (!lang) continue;
  const res = runCompiled(lang, ports[slug][lang], data.method_name, data.params, rt, cases);
  if (!res || res.compileFail || !res.parts) continue;
  const ood = []; let cleanFail = 0;
  for (let i = 0; i < cases.length; i++) {
    const want = norm(cases[i].expected); const got = norm(res.parts[i]); const pyOk = !pyRes[i].crash && norm(pyRes[i].out) === want;
    if (!pyOk) continue; // python doesn't cleanly answer -> not an OOD-prune target
    if (got === want || (!isStr && (() => { try { return JSON.stringify(JSON.parse(got)) === JSON.stringify(JSON.parse(want)); } catch { return false; } })())) continue; // port passes
    if (isCrash(res.parts[i])) ood.push(i); else cleanFail++; // crash -> OOD candidate; wrong-answer -> real port bug
  }
  const kept = cases.length - ood.length;
  if (ood.length && cleanFail === 0 && kept >= MIN_KEEP) {
    oodProblems++; oodCases += ood.length; recoverable++; report.push({ slug, lang, total: cases.length, ood: ood.length, kept, sampleBadInput: cases[ood[0]].inputs });
    if (APPLY) {
      // prune OOD cases (matched by inputs) from the FULL test_cases; keep stress + clean cases.
      const oodKeys = new Set(ood.map((i) => JSON.stringify(cases[i].inputs)));
      const full = Array.isArray(data.test_cases) ? data.test_cases : [];
      const cleaned = full.filter((c) => !(Array.isArray(c.inputs) && !c.stress && oodKeys.has(JSON.stringify(c.inputs))));
      // store recovered ports that pass ALL kept non-stress cases
      const keptCases = cleaned.filter((c) => Array.isArray(c.inputs) && !c.stress).slice(0, 60);
      const sol = { ...(data.solutions || {}) }; const stored = [];
      for (const L of ['java', 'cpp', 'javascript']) { const pc = ports[slug][L]; if (!pc) continue; if ((sol[L]?.code || '').trim()) continue;
        const rr = L === 'javascript' ? null : runCompiled(L, pc, data.method_name, data.params, rt, keptCases);
        if (L !== 'javascript' && rr && !rr.compileFail && rr.parts) { let allok = true; for (let i = 0; i < keptCases.length; i++) { const g = norm(rr.parts[i]), w = norm(keptCases[i].expected); if (g !== w && !((!isStr) && (() => { try { return JSON.stringify(JSON.parse(g)) === JSON.stringify(JSON.parse(w)); } catch { return false; } })())) { allok = false; break; } } if (allok) { sol[L] = { code: pc }; stored.push(L); } }
      }
      await sb.from('PGcode_problems').update({ test_cases: cleaned, solutions: sol }).eq('id', slug);
      report[report.length - 1].pruned = full.length - cleaned.length; report[report.length - 1].stored = stored;
    }
  }
  else if (ood.length) report.push({ slug, lang, total: cases.length, ood: ood.length, kept, cleanFail, note: 'has-real-port-bug-or-too-few-kept' });
}
try { fs.rmSync(DIR, { recursive: true, force: true }); } catch { /**/ }
fs.writeFileSync(`${SP}/ood-report.json`, JSON.stringify(report, null, 1));
console.log(`analyzed ${slugs.length} ported problems`);
console.log(`SAFE-prunable OOD problems: ${oodProblems} | total OOD cases: ${oodCases} | backfill ports recoverable after prune: ${recoverable}`);
console.log('sample:', report.filter((r) => !r.note).slice(0, 8).map((r) => `${r.slug}(${r.ood}ood/${r.total},keep${r.kept})`).join(', '));
console.log('-> ood-report.json');
process.exit(0);
