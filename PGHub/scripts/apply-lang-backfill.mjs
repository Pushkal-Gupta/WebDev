// Backfill missing REFERENCE solutions (js/java/cpp) on problems that already have a
// correct python canonical + real graded test_cases. For each supplied language, verify
// it against the problem's EXISTING test cases via the local driver; write ONLY languages
// that pass every case (never store a wrong reference). Does NOT touch test_cases.
//
// Input JSON: { slug: { javascript?, java?, cpp?, python? } }  (python optional override)
//   node scripts/apply-lang-backfill.mjs --in /tmp/bf/out-0.json [--dry]
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
const IN = arg('in'); const DRY = process.argv.includes('--dry');
if (!IN) { console.error('need --in'); process.exit(1); }
const BAD = /Reference skeleton|See the Editorial|TODO|NotImplemented/i;
const map = JSON.parse(fs.readFileSync(IN, 'utf8'));
let touched = 0, failed = 0; const stat = { javascript: 0, java: 0, cpp: 0 };
for (const slug of Object.keys(map)) {
  const e = map[slug] || {};
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); failed++; continue; }
  const cases = (Array.isArray(data.test_cases) ? data.test_cases : []).filter(c => Array.isArray(c.inputs));
  if (cases.length < 5) { console.log(`  x    ${slug}: only ${cases.length} cases, skip`); failed++; continue; }
  const sol = { ...(data.solutions || {}) };
  const report = [];
  for (const lang of ['javascript', 'java', 'cpp']) {
    const code = (e[lang] || '').trim();
    if (!code) continue;
    if (BAD.test(code)) { report.push(`${lang}:stub-skip`); continue; }
    if ((sol[lang]?.code || '').trim() && !BAD.test(sol[lang].code)) { report.push(`${lang}:already`); continue; }
    let w; try { w = wrapWithDriver(code, lang, data.method_name, data.params, data.return_type); } catch { report.push(`${lang}:wrap-err`); continue; }
    let ok = true;
    for (const tc of cases) { const r = runLocal(lang, w, buildStdin(tc.inputs.map(String)) + '\n', { timeoutMs: 15000 }); if (!r || !r.ok || !compareOutput((r.stdout ?? '').replace(/\n$/, ''), tc.expected)) { ok = false; break; } }
    if (ok) { sol[lang] = { code }; stat[lang]++; report.push(`${lang}:PASS`); } else report.push(`${lang}:FAIL`);
  }
  const added = report.filter(r => r.endsWith(':PASS')).length;
  if (added && !DRY) { const { error: uerr } = await sb.from('PGcode_problems').update({ solutions: sol }).eq('id', slug); if (uerr) { console.log(`  ERR  ${slug}: ${uerr.message.slice(0, 40)}`); failed++; continue; } }
  if (added) { touched++; console.log(`  +${added}   ${slug}: ${report.join(' ')}`); }
  else console.log(`  0    ${slug}: ${report.join(' ')}`);
}
console.log(`\n${DRY ? 'would-touch' : 'touched'}: ${touched} | failed: ${failed} | added js:${stat.javascript} java:${stat.java} cpp:${stat.cpp}`);
