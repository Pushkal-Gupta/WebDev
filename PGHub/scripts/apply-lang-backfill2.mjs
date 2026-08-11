// Self-contained lang-backfill apply (the shared local-grade.mjs no longer exports runLocal).
// Reads {slug:{javascript?,java?,cpp?}} files, grades each candidate against the problem's REAL
// (non-stress) test cases, and stores ONLY languages that pass every case. Never stores a wrong ref.
//   node scripts/apply-lang-backfill2.mjs --in <file.json> [--dry]
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, JAVA_CASE_SEP, JAVA_OUT_END } from '../src/lib/driverCode.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const IN = arg('in'); const DRY = process.argv.includes('--dry');
if (!IN) { console.error('need --in'); process.exit(1); }
const BAD = /Reference skeleton|See the Editorial|TODO|NotImplemented|not implemented/i;
const DIR = fs.mkdtempSync(os.tmpdir() + '/bf-');

function stripNodeClasses(code) {
  for (const kw of ['class', 'struct']) for (const name of ['ListNode', 'TreeNode', 'Node']) {
    let idx; while ((idx = code.search(new RegExp(`(^|\\n)\\s*(public\\s+)?${kw}\\s+${name}\\b`))) >= 0) {
      const bs = code.indexOf('{', idx); if (bs < 0) break; let d = 0, end = -1;
      for (let i = bs; i < code.length; i++) { if (code[i] === '{') d++; else if (code[i] === '}') { d--; if (d === 0) { end = i; break; } } }
      if (end < 0) break; let cut = end + 1; if (kw === 'struct' && code[cut] === ';') cut++; code = code.slice(0, idx) + '\n' + code.slice(cut);
    }
  }
  return code;
}
function deepEq(a, b) {
  if (typeof a === 'boolean' || typeof b === 'boolean') return a === b;
  if (typeof a === 'number' && typeof b === 'number') { if (!Number.isInteger(a) || !Number.isInteger(b)) return Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(a), Math.abs(b)); return a === b; }
  if (Array.isArray(a) && Array.isArray(b)) { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (!deepEq(a[i], b[i])) return false; return true; }
  if (a && b && typeof a === 'object' && typeof b === 'object') { const ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false; for (const k of ka) if (!deepEq(a[k], b[k])) return false; return true; }
  return a === b;
}
const eq = (got, want, isStr) => { if (got === undefined) return false; const g = String(got).trim(), w = String(want).trim(); if (isStr) return g === w; if (g === w) return true; try { return deepEq(JSON.parse(g), JSON.parse(w)); } catch { return false; } };

function runCompiled(lang, code, method, params, rt, cases) {
  const wrapped = wrapWithDriver(stripNodeClasses(code), lang, method, params, rt, { multiCaseCount: cases.length });
  const stdin = cases.map((c) => c.inputs.join('\n')).join('\n' + JAVA_CASE_SEP + '\n') + '\n';
  if (lang === 'java') {
    let mc = 'Main'; for (const s of wrapped.split(/\bclass\s+/)) if (/public static void main/.test(s)) { mc = (s.match(/^(\w+)/) || [])[1] || 'Main'; break; }
    fs.writeFileSync(`${DIR}/${mc}.java`, wrapped);
    const comp = spawnSync('javac', [`${DIR}/${mc}.java`, '-d', DIR], { encoding: 'utf8', timeout: 30000 });
    if (comp.status !== 0) return { ok: false, why: 'compile' };
    const run = spawnSync('java', ['-cp', DIR, mc], { input: stdin, encoding: 'utf8', timeout: 20000, maxBuffer: 5e7 });
    if (run.signal === 'SIGTERM') return { ok: false, why: 'timeout' };
    return { ok: true, parts: (run.stdout || '').split(JAVA_OUT_END + '\n').map((p) => p.replace(/\n$/, '')) };
  }
  fs.writeFileSync(`${DIR}/main.cpp`, wrapped);
  const comp = spawnSync('g++', ['-std=c++17', '-O1', '-I', 'scripts/_cppshim', `${DIR}/main.cpp`, '-o', `${DIR}/a.out`], { encoding: 'utf8', timeout: 40000 });
  if (comp.status !== 0) return { ok: false, why: 'compile' };
  const run = spawnSync(`${DIR}/a.out`, [], { input: stdin, encoding: 'utf8', timeout: 20000, maxBuffer: 5e7 });
  if (run.signal === 'SIGTERM') return { ok: false, why: 'timeout' };
  return { ok: true, parts: (run.stdout || '').split(JAVA_OUT_END + '\n').map((p) => p.replace(/\n$/, '')) };
}
function runJs(code, method, params, rt, cases) {
  let wrapped; try { wrapped = wrapWithDriver(code, 'javascript', method, params, rt); } catch { return { ok: false, why: 'wrap' }; }
  fs.writeFileSync(`${DIR}/main.js`, wrapped);
  const parts = [];
  for (const c of cases) { const run = spawnSync('node', [`${DIR}/main.js`], { input: c.inputs.join('\n') + '\n', encoding: 'utf8', timeout: 15000, maxBuffer: 5e7 }); if (run.signal === 'SIGTERM') return { ok: false, why: 'timeout' }; parts.push((run.stdout || '').replace(/\n$/, '')); }
  return { ok: true, parts };
}

const map = JSON.parse(fs.readFileSync(IN, 'utf8'));
let touched = 0; const stat = { javascript: 0, java: 0, cpp: 0 };
for (const slug of Object.keys(map)) {
  const e = map[slug] || {};
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); continue; }
  const cases = (Array.isArray(data.test_cases) ? data.test_cases : []).filter((c) => Array.isArray(c.inputs) && !c.stress).slice(0, 60);
  if (cases.length < 3) { console.log(`  x    ${slug}: ${cases.length} gradeable cases, skip`); continue; }
  const sol = { ...(data.solutions || {}) }; const rt = data.return_type || 'int'; const isStr = rt === 'str' || rt === 'string';
  const report = [];
  for (const lang of ['javascript', 'java', 'cpp']) {
    const code = (e[lang] || '').trim(); if (!code) continue;
    if (BAD.test(code)) { report.push(`${lang}:stub`); continue; }
    if ((sol[lang]?.code || '').trim() && !BAD.test(sol[lang].code)) { report.push(`${lang}:already`); continue; }
    let res; try { res = lang === 'javascript' ? runJs(code, data.method_name, data.params, rt, cases) : runCompiled(lang, code, data.method_name, data.params, rt, cases); } catch { res = { ok: false, why: 'harness' }; }
    if (!res.ok) { report.push(`${lang}:${res.why}`); continue; }
    let bad = 0; for (let i = 0; i < cases.length; i++) if (!eq(res.parts[i], isStr ? String(cases[i].expected) : cases[i].expected, isStr)) { bad++; break; }
    if (bad === 0) { sol[lang] = { code }; stat[lang]++; report.push(`${lang}:PASS`); } else report.push(`${lang}:FAIL`);
  }
  const added = report.filter((r) => r.endsWith(':PASS')).length;
  if (added && !DRY) { const { error: uerr } = await sb.from('PGcode_problems').update({ solutions: sol }).eq('id', slug); if (uerr) { console.log(`  ERR  ${slug}: ${uerr.message.slice(0, 40)}`); continue; } }
  if (added) touched++;
  console.log(`  ${added ? '+' + added : '0'}   ${slug}: ${report.join(' ')}`);
}
try { fs.rmSync(DIR, { recursive: true, force: true }); } catch { /**/ }
console.log(`\n${DRY ? 'would-touch' : 'touched'}: ${touched} | added js:${stat.javascript} java:${stat.java} cpp:${stat.cpp}`);
