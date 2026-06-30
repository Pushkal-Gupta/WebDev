// Fix the catalog-wide method-name mismatch: ~2000 problems have solutions whose
// entry method is named after the slug/title (e.g. `battleshipsInABoard`) instead
// of the `method_name` column the driver actually calls (`countBattleships`). The
// driver calls method_name -> the canonical can't run -> can't grade. method_name +
// test cases are the ground truth; the solution's def name is wrong.
//
// For each lang we detect the entry method name, whole-word-rename it to method_name
// (long unique camelCase names don't collide with locals; recursive self-calls are
// renamed too), GRADE the result on local Judge0, and write back ONLY langs that pass.
// The grade-gate means a bad rename can never corrupt a row — it just isn't written.
//
//   node scripts/fix-method-names.mjs --slug two-sum --dry        # inspect one
//   node scripts/fix-method-names.mjs --max 50 --dry              # preview a chunk
//   node scripts/fix-method-names.mjs --max 5000 --offset 0       # apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart } from './sol-batches/grade-helpers.mjs';
import { runLocal } from './local-grade.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? (process.argv[i + 1]?.startsWith('--') ? true : process.argv[i + 1]) : undefined; };
const SLUG = arg('slug'); const DRY = process.argv.includes('--dry');
const MAX = Number(arg('max') || 50); const OFFSET = Number(arg('offset') || 0);
const SAMPLE = Number(arg('sample') || 12);
const JUDGE0_URL = (process.env.JUDGE0_URL || 'https://ce.judge0.com').replace(/\/$/, '');
const AUTH = process.env.JUDGE0_AUTH_TOKEN || '';
const HDRS = AUTH ? { 'content-type': 'application/json', 'X-Auth-Token': AUTH } : { 'content-type': 'application/json' };
const LANG_ID = { python: 71, javascript: 63, java: 62, cpp: 54 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LOCAL_EXEC = process.env.LOCAL_EXEC !== '0';
async function run(langId, src, stdin) {
  if (LOCAL_EXEC) {
    const r = runLocal(langId, src, stdin, { timeoutMs: 8000 });
    return { ok: r.ok, stdout: r.stdout || '', status: r.status, err: r.err };
  }
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, { method: 'POST', headers: HDRS, body: JSON.stringify({ language_id: langId, source_code: src, stdin, cpu_time_limit: 6, wall_time_limit: 10 }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      return { ok: (d.status?.id === 3), stdout: (d.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, ''), status: d.status?.description };
    } catch (e) { if (a === 3) return { ok: false, err: e.message }; await sleep(400 * a * a); }
  }
}
const codeOf = (s) => typeof s === 'string' ? s : s?.code;
const wrapCode = (s, lang, code) => (typeof s === 'string' ? code : { ...s, code });

// entry method name per language (best-effort; skip on ambiguity)
function entryName(code, lang) {
  if (!code) return null;
  if (lang === 'python') { const ds = [...code.matchAll(/def\s+([a-zA-Z_]\w*)\s*\(/g)].map((m) => m[1]).filter((n) => n !== '__init__'); return ds.length === 1 ? ds[0] : null; }
  if (lang === 'javascript') { let m = code.match(/(?:var|let|const)\s+([a-zA-Z_$]\w*)\s*=\s*function/) || code.match(/function\s+([a-zA-Z_$]\w*)\s*\(/); return m ? m[1] : null; }
  if (lang === 'java') { const ds = [...code.matchAll(/public\s+[\w<>\[\],\s]+?\s+([a-zA-Z_]\w*)\s*\(/g)].map((m) => m[1]).filter((n) => n !== 'main' && n[0] === n[0].toLowerCase()); return ds.length ? ds[0] : null; }
  if (lang === 'cpp') { const body = code.split(/public:/).pop() || code; const ds = [...body.matchAll(/(?:^|\n)\s*[\w:<>\*&,\s]+?\s+([a-zA-Z_]\w*)\s*\([^;]*\)\s*\{/g)].map((m) => m[1]).filter((n) => n !== 'Solution'); return ds.length ? ds[0] : null; }
  return null;
}
const renameWord = (code, oldN, newN) => code.replace(new RegExp(`\\b${oldN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), newN);

async function gradeLang(lang, code, p, cases) {
  let wrapped; try { wrapped = wrapWithDriver(code, lang, p.method_name, p.params, p.return_type); } catch { return { ok: false, reason: 'wrap' }; }
  let pass = 0, n = 0;
  for (const c of cases) {
    n++; const r = await run(LANG_ID[lang], wrapped, buildStdin(c.inputs) + '\n');
    if (!r.ok || !compareOutputSmart(r.stdout, c.expected, {})) return { ok: false, reason: r?.status || 'WA', at: n };
    pass++;
  }
  return { ok: n > 0, pass, n };
}

async function processProblem(p) {
  const cases = (Array.isArray(p.test_cases) ? p.test_cases : []).slice(0, SAMPLE);
  if (!cases.length) return { id: p.id, skip: 'no cases' };
  const sols = p.solutions || {}; const changed = {}; const report = [];
  let anyMismatch = false;
  for (const lang of ['python', 'javascript', 'java', 'cpp']) {
    const code = codeOf(sols[lang]); if (!code) continue;
    const en = entryName(code, lang); if (!en) { if (lang === 'python') report.push(`py:entry?`); continue; }
    if (en === p.method_name) continue; // already correct
    anyMismatch = true;
    const renamed = renameWord(code, en, p.method_name);
    const g = await gradeLang(lang, renamed, p, cases);
    if (g.ok) { changed[lang] = wrapCode(sols[lang], lang, renamed); report.push(`${lang}:${en}->${p.method_name} PASS ${g.pass}/${g.n}`); }
    else report.push(`${lang}:${en}->${p.method_name} FAIL(${g.reason}${g.at ? '@' + g.at : ''})`);
  }
  if (!anyMismatch) return { id: p.id, skip: 'all match' };
  if (Object.keys(changed).length && !DRY) {
    const merged = { ...sols, ...changed };
    const { error } = await sb.from('PGcode_problems').update({ solutions: merged }).eq('id', p.id);
    if (error) return { id: p.id, report, err: error.message.slice(0, 40) };
  }
  return { id: p.id, fixed: Object.keys(changed), report };
}

async function main() {
  console.log(`fix-method-names ${DRY ? '(DRY)' : '(APPLY)'} | Judge0: ${JUDGE0_URL}`);
  let rows;
  if (SLUG) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', SLUG); rows = data || []; }
  else { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').order('id').range(OFFSET, OFFSET + MAX - 1); rows = data || []; }
  let fixed = 0, langs = 0, skip = 0;
  for (const p of rows) {
    const r = await processProblem(p);
    if (r.skip) { skip++; continue; }
    if (r.fixed?.length) { fixed++; langs += r.fixed.length; console.log(`  FIX ${r.id}: [${r.fixed.join(',')}]  ${r.report.join(' | ')}`); }
    else console.log(`  -   ${r.id}: ${r.report.join(' | ')}${r.err ? ' ERR ' + r.err : ''}`);
  }
  console.log(`\nproblems: ${rows.length} | fixed: ${fixed} | lang-solutions renamed: ${langs} | skipped: ${skip}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
