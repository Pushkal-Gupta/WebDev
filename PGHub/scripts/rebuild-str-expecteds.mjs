// Repair str-return problems whose stored `expected` predates the strict
// (case/whitespace-sensitive) grader — those were LC-scraped with different
// casing/spacing and would now false-reject the (correct) canonical.
//
// SAFE split: for each case, run the canonical. If canonical output == stored
// expected under the OLD lax compare (strip-all-whitespace + lowercase) but !=
// under the NEW strict compare, the discrepancy is FORMATTING-ONLY → rebuild
// `expected` from the canonical (safe). If they differ even under the lax
// compare, it's a SEMANTIC divergence (canonical may be wrong OR the scraped
// answer may be) → do NOT touch; log it for review.
//
//   node scripts/rebuild-str-expecteds.mjs            # apply formatting-only fixes
//   node scripts/rebuild-str-expecteds.mjs --dry      # report, write nothing
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');
// Strip ONE surrounding pair of JSON quotes (the systemic bug: str expecteds
// stored as `"abc"` while the driver prints `abc` bare), then collapse internal
// whitespace runs + trim. CASE-SENSITIVE — a case difference is semantic, not
// formatting.
function unquote(s) {
  const t = (s ?? '').toString().trim();
  if (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') { try { const v = JSON.parse(t); if (typeof v === 'string') return v; } catch { /* fallthrough */ } }
  return t;
}
const norm = (s) => unquote(s).replace(/\s+/g, ' ').trim();

const broken = JSON.parse(fs.readFileSync('/tmp/str-broken.json', 'utf8'));
let fixed = 0, semantic = 0, casesFixed = 0; const review = [];
for (const b of broken) {
  const { data: p } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', b.id).single();
  if (!p) continue;
  const code = p.solutions?.python?.code;
  const tcs = Array.isArray(p.test_cases) ? p.test_cases : [];
  if (!code || !tcs.length) continue;
  let wrapped; try { wrapped = wrapWithDriver(code, 'python', p.method_name, p.params, p.return_type); } catch { continue; }
  const next = []; let changed = 0, sem = 0, ran = true;
  for (const c of tcs) {
    let r; try { r = runLocal('python', wrapped, buildStdin(c.inputs) + '\n', { timeoutMs: 6000 }); } catch { ran = false; break; }
    if (!r || !r.ok) { ran = false; break; }
    const out = (r.stdout ?? '').replace(/\n$/, '');
    const exp = c.expected ?? '';
    if (out === exp) { next.push(c); continue; }
    if (norm(out) === norm(exp)) { next.push({ ...c, expected: out }); changed++; }     // quote/whitespace-only → rebuild bare
    else { next.push(c); sem++; }                                                       // semantic → leave, flag
  }
  if (!ran) { review.push({ id: b.id, reason: 'canonical run error' }); continue; }
  if (sem > 0) { semantic++; review.push({ id: b.id, semanticCases: sem, sampleExp: b.firstFail?.exp, sampleGot: b.firstFail?.got }); }
  if (changed > 0 && sem === 0) {
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ test_cases: next }).eq('id', b.id); if (error) { review.push({ id: b.id, reason: error.message.slice(0, 50) }); continue; } }
    fixed++; casesFixed += changed;
    console.log(`  ${DRY ? 'would-fix' : 'FIXED'} ${b.id}: ${changed} formatting-only expecteds rebuilt`);
  } else if (changed > 0) {
    console.log(`  MIXED ${b.id}: ${changed} formatting + ${sem} semantic — SKIPPED (semantic present, needs review)`);
  }
}
fs.writeFileSync('/tmp/str-review.json', JSON.stringify(review, null, 2));
console.log(`\n${DRY ? 'would-fix' : 'fixed'}: ${fixed} problems, ${casesFixed} cases | semantic-divergence (review): ${semantic} -> /tmp/str-review.json`);
