// Apply JS/Java/C++ translations of a problem's (already-correct) Python canonical.
// Input JSON: { slug: { javascript?: code, java?: code, cpp?: code } }. Each provided
// language is graded on the host toolchain against the problem's stored test cases;
// only languages that pass EVERY case are written into solutions[lang].code. A wrong
// translation can never land. The test cases are the oracle (they already agree with
// the Python canonical), so no pruning here — a failure means the translation is wrong.
//
//   node scripts/apply-xlate.mjs --in /tmp/xl/out-0.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { gradeLang } from './local-grade.mjs';
import { ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const IN = arg('in'); const DRY = process.argv.includes('--dry');
if (!IN) { console.error('need --in'); process.exit(1); }
const SAMPLE = arg('sample') !== undefined ? Number(arg('sample')) : 0;

const map = JSON.parse(fs.readFileSync(IN, 'utf8'));
const slugs = Object.keys(map);
console.log(`apply-xlate ${DRY ? '(DRY)' : '(LIVE)'} | candidates: ${slugs.length}\n`);
let wrote = 0, langWrites = 0, failed = 0;
const fails = [];
for (const slug of slugs) {
  const entry = map[slug] || {};
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases,tags').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); failed++; continue; }
  let cases = Array.isArray(data.test_cases) ? data.test_cases : [];
  if (!cases.length) { console.log(`  -    ${slug}: no test cases`); failed++; continue; }
  if (SAMPLE > 0) cases = cases.slice(0, SAMPLE);
  const orderInsensitive = ORDER_INSENSITIVE.has(slug);
  const merged = { ...(data.solutions || {}) };
  const okLangs = []; const failLangs = [];
  for (const lang of ['javascript', 'java', 'cpp']) {
    const code = entry[lang]; if (!code || code.length < 12) continue;
    const g = gradeLang(lang, code, data, cases, { cmpOpts: { orderInsensitive } });
    if (g.ok) {
      const prev = merged[lang];
      merged[lang] = (prev && typeof prev === 'object') ? { ...prev, code } : { code };
      okLangs.push(lang); langWrites++;
    } else {
      failLangs.push(`${lang}@${g.firstFail?.at}(${g.firstFail?.status || g.reason})`);
    }
  }
  if (!okLangs.length) { console.log(`  FAIL ${slug}: ${failLangs.join(' ') || 'no langs'}`); fails.push({ slug, msg: failLangs.join(' ') }); failed++; continue; }
  if (!DRY) {
    const { error: uerr } = await sb.from('PGcode_problems').update({ solutions: merged }).eq('id', slug);
    if (uerr) { console.log(`  ERR  ${slug}: ${uerr.message.slice(0, 50)}`); failed++; continue; }
  }
  wrote++;
  console.log(`  WROTE ${slug}: [${okLangs.join(',')}]${failLangs.length ? ' | fail:' + failLangs.join(' ') : ''}`);
}
console.log(`\n${DRY ? 'would-write' : 'wrote'}: ${wrote} problems | lang-solutions: ${langWrites} | failed: ${failed}`);
if (fails.length) { const o = IN.replace(/\.json$/, '') + '.fails.json'; fs.writeFileSync(o, JSON.stringify(fails, null, 0)); console.log(`fails -> ${o}`); }
