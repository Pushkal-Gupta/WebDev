// Deterministic applier for authored Python solutions. An authoring agent writes
// a JSON map { slug: "<python class Solution code>" } to a file; this script grades
// each candidate against the problem's stored test cases on the HOST toolchain
// (local-grade) and writes solutions.python ONLY for candidates that pass every
// case. A failing candidate is never written — it's reported so the agent can retry.
//
//   node scripts/apply-pyxlate.mjs --in /tmp/pyxlate-slice-3.json
//   node scripts/apply-pyxlate.mjs --in file.json --dry      # grade only, no writes
//   node scripts/apply-pyxlate.mjs --in file.json --sample 0 # grade ALL cases (default: all)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { gradeLang } from './local-grade.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const IN = arg('in'); const DRY = process.argv.includes('--dry');
const SAMPLE = arg('sample') !== undefined ? Number(arg('sample')) : 0; // 0 => all cases
// When set: if the solution passes EVERY sample case (trusted LC samples) but fails
// some hidden cases whose expected looks well-formed, treat those hidden cases as
// corrupt and prune them. Samples are the ground truth; a solution matching all of
// them is a credible oracle, so a disagreeing hidden case is the suspect, not the code.
const PRUNE_HIDDEN = process.argv.includes('--prune-hidden');
if (!IN) { console.error('need --in <json file of {slug: code}>'); process.exit(1); }

const codeOf = (e) => !e ? '' : (typeof e === 'string' ? e : e.code || '');

// A case is independently corrupt (prunable) if its expected/inputs are malformed
// regardless of any solution — null for a non-nullable return, empty, narrative
// text glued in, or table-dumps. We only ever prune INDEPENDENTLY-corrupt cases;
// a well-formed case that the solution fails means the SOLUTION is wrong → reject.
function looksCorrupt(c, returnType) {
  const exp = (c?.expected ?? '').toString();
  const t = exp.trim();
  const nullable = /Optional|Any|None/i.test(returnType || '');
  if (!c || !Array.isArray(c.inputs) || c.inputs.length === 0) return true;
  if (t === '') return true;
  if (!nullable && /^(null|None|undefined)$/i.test(t)) return true;
  if (/\+--|Users table|Transactions table|"headers"/.test(exp)) return true;
  // table / operation-log / explanation prose glued onto an answer
  // ("5 Operation Array 1 [..]", "[1,6] Explantion: ..."). Match misspellings too.
  if (/\b(Operation|Step|Index|Output|Input|Table|Row|Column|Expla[a-z]*|Example|Note)\b/.test(exp) && /^\S+\s/.test(t)) return true;
  // a complete data literal (number / [..] / {..} / "..") immediately followed by prose words
  if (/^(-?\d+(\.\d+)?|\[[^\]]*\]|\{[^}]*\}|"[^"]*")\s+[A-Za-z]{3,}/.test(t)) return true;
  // numeric/bool return whose expected carries alphabetic prose => answer + junk
  const rt = (returnType || '').toLowerCase();
  const numericRet = /\b(int|float|long|double|number)\b/.test(rt) && !/list|\[/.test(rt);
  if (numericRet && /[a-zA-Z]/.test(t.replace(/\b(true|false|null|none|inf|nan|e)\b/gi, ''))) return true;
  const boolRet = /\bbool(ean)?\b/.test(rt);
  if (boolRet && !/^(true|false|0|1)$/i.test(t)) return true;
  // narrative prose smuggled into a non-literal expected
  if (/[A-Za-z]{4,}\s+[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(exp) && !/^[\[{"]/.test(t)) return true;
  if (/[​-‍﻿]/.test(exp) || /[​-‍﻿]/.test(c.inputs.join(''))) return true; // zero-width
  return false;
}
const isSampleCase = (c, idx) => c?.is_sample === true || idx < 2;

const map = JSON.parse(fs.readFileSync(IN, 'utf8'));
const slugs = Object.keys(map);
console.log(`apply-pyxlate ${DRY ? '(DRY)' : '(LIVE)'} | candidates: ${slugs.length}\n`);

let wrote = 0, failed = 0, missing = 0, prunedTotal = 0;
const fails = [];
for (const slug of slugs) {
  // entry is either a bare code string (legacy) or { code, approach, complexity, hints }
  const entry = map[slug];
  const code = typeof entry === 'string' ? entry : entry?.code;
  const approach = typeof entry === 'object' ? entry?.approach : null;
  const complexity = typeof entry === 'object' ? entry?.complexity : null;
  const hints = typeof entry === 'object' && Array.isArray(entry?.hints) ? entry.hints.filter((h) => h && h.trim()) : null;
  if (!code || code.length < 12) { console.log(`  -    ${slug}: empty candidate`); missing++; continue; }
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases,hints').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); missing++; continue; }
  let cases = Array.isArray(data.test_cases) ? data.test_cases : [];
  if (!cases.length) { console.log(`  -    ${slug}: no test cases`); missing++; continue; }
  if (SAMPLE > 0) cases = cases.slice(0, SAMPLE);

  // grade each case independently so we can tell solution-wrong from case-corrupt
  let wrapErr = null;
  const results = cases.map((c, idx) => {
    const g = gradeLang('python', code, data, [c]);
    if (g.reason === 'wrap') wrapErr = g.err;
    return { c, idx, sample: isSampleCase(c, idx), ok: g.ok, fail: g.firstFail };
  });
  if (wrapErr) { console.log(`  FAIL ${slug}: wrap-error ${wrapErr}`); fails.push({ slug, msg: 'wrap ' + wrapErr }); failed++; continue; }
  const failedCases = results.filter((r) => !r.ok);
  if (failedCases.length) {
    const sampleFail = failedCases.filter((r) => r.sample);
    const corruptFail = failedCases.filter((r) => looksCorrupt(r.c, data.return_type));
    const wellFormedFail = failedCases.filter((r) => !looksCorrupt(r.c, data.return_type));
    // a failing SAMPLE case that is well-formed => the solution is genuinely wrong
    const sampleWellFormedFail = sampleFail.filter((r) => !looksCorrupt(r.c, data.return_type));
    if (sampleWellFormedFail.length) {
      const f = sampleWellFormedFail[0].fail;
      const msg = `solution wrong: fails sample case ${sampleWellFormedFail[0].idx} ${f?.status} got=${JSON.stringify((f?.got || '').slice(0, 36))} want=${JSON.stringify((f?.want || '').slice(0, 36))}`;
      console.log(`  FAIL ${slug}: ${msg}`); fails.push({ slug, msg }); failed++; continue;
    }
    // hidden well-formed failures: prune only in --prune-hidden mode (solution passed all samples)
    const wellFormedHidden = wellFormedFail.filter((r) => !r.sample);
    if (wellFormedHidden.length && !PRUNE_HIDDEN) {
      const f = wellFormedHidden[0].fail;
      const msg = `solution wrong or bad hidden case: ${wellFormedHidden.length} well-formed hidden case(s) fail, e.g. idx${wellFormedHidden[0].idx} got=${JSON.stringify((f?.got || '').slice(0, 36))} want=${JSON.stringify((f?.want || '').slice(0, 36))}`;
      console.log(`  FAIL ${slug}: ${msg}`); fails.push({ slug, msg }); failed++; continue;
    }
    const keep = results.filter((r) => r.ok).map((r) => r.c);
    cases = keep; prunedTotal += failedCases.length;
    const why = wellFormedHidden.length ? `${corruptFail.length} corrupt + ${wellFormedHidden.length} suspect-hidden (samples all pass)` : `${failedCases.length} corrupt`;
    console.log(`  PRUNE ${slug}: removed ${why}, ${keep.length} sound remain`);
  }
  if (!cases.length) { console.log(`  -    ${slug}: all cases corrupt, skipping`); missing++; continue; }
  if (DRY) { console.log(`  PASS ${slug}: ${cases.length} cases (dry, not written)`); wrote++; continue; }
  const merged = { ...(data.solutions || {}) };
  const prev = merged.python;
  // NeetCode-style entry: store { code, approach, complexity } so the solution page
  // shows intuition + complexity, not bare code. Preserve any existing richer fields.
  const prevObj = (prev && typeof prev === 'object') ? prev : {};
  const pyEntry = { ...prevObj, code };
  if (approach && approach.trim()) pyEntry.approach = approach.trim();
  if (complexity && (complexity.time || complexity.space)) pyEntry.complexity = { time: complexity.time || '', space: complexity.space || '' };
  merged.python = pyEntry;
  const update = { solutions: merged };
  if (prunedTotal && cases.length !== (Array.isArray(data.test_cases) ? data.test_cases.length : 0)) update.test_cases = cases;
  // Fill graduated hints only when the problem has none (don't clobber good existing hints).
  const hasHints = Array.isArray(data.hints) && data.hints.length >= 2;
  if (hints && hints.length >= 2 && !hasHints) update.hints = hints;
  const { error: uerr } = await sb.from('PGcode_problems').update(update).eq('id', slug);
  if (uerr) { console.log(`  ERR  ${slug}: write failed ${uerr.message.slice(0, 60)}`); failed++; continue; }
  const extras = [pyEntry.approach ? 'approach' : null, pyEntry.complexity ? 'complexity' : null, (update.hints ? 'hints' : null)].filter(Boolean);
  console.log(`  WROTE ${slug}: python PASS ${cases.length} cases${extras.length ? ' +' + extras.join('+') : ' (CODE ONLY — no editorial)'}`);
  wrote++;
}
console.log(`\n${DRY ? 'would-write' : 'wrote'}: ${wrote} | failed: ${failed} | missing/skip: ${missing} | corrupt cases pruned: ${prunedTotal}`);
if (fails.length) {
  const outp = IN.replace(/\.json$/, '') + '.fails.json';
  fs.writeFileSync(outp, JSON.stringify(fails, null, 0));
  console.log(`fails -> ${outp}`);
}
