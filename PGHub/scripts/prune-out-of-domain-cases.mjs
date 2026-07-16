// Prune OUT-OF-DOMAIN test cases: cases whose inputs violate the problem's own stated
// constraints (negatives where the min is 0/1, values past the max, over-length arrays,
// n large enough that the answer overflows a fixed-width int). A bad auto-grow pass
// seeded these; python's arbitrary precision passes them, but they FALSE-REJECT correct
// human/js/java/cpp solutions — the #1 rule violation. This only DROPS constraint-
// violating cases (never edits `expected`), and only when >=8 in-domain cases remain, so
// coverage stays adequate. Bounds come from the SAME parser the input generator uses.
//
//   node scripts/prune-out-of-domain-cases.mjs --dry        # report scope, write /tmp/ood.json
//   node scripts/prune-out-of-domain-cases.mjs --apply       # prune (only >=8 kept)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parseBounds, validateInputs } from './lib/constraint-bounds.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const MIN_KEEP = 8;

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,params,constraints,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
console.log('scanning', rows.length, 'problems');

const report = [];
let totalDropped = 0, wrote = 0;
for (const p of rows) {
  const params = Array.isArray(p.params) ? p.params : [];
  const cases = Array.isArray(p.test_cases) ? p.test_cases : [];
  if (!params.length || cases.length < MIN_KEEP || !p.constraints) continue;
  let bounds; try { bounds = parseBounds(p.constraints, params); } catch { continue; }
  if (!bounds || (!Object.keys(bounds.perParam || {}).length && !Object.keys(bounds.scalars || {}).length)) continue;
  // Only trust HIGH-CONFIDENCE lower-bound violations. Upper-bound and charset checks
  // false-positive constantly because scraped constraints lose their exponents
  // (10^15 -> "1015", 2^30 -> "230") and charsets parse incompletely (decode-string's
  // "[" flagged, uppercase flagged). A NEGATIVE value where the min is >= 0, or an
  // EMPTY array/string where a positive min length is required, can't be a corrupted-
  // power artifact — those are genuinely out-of-domain and safe to drop.
  const safeViolation = (s) => {
    let m = s.match(/element (-?\d+(?:\.\d+)?) < min (-?\d+(?:\.\d+)?)/) || s.match(/=(-?\d+(?:\.\d+)?) < min (-?\d+(?:\.\d+)?)/);
    if (m) { const val = Number(m[1]), min = Number(m[2]); return val < 0 && min >= 0; }
    m = s.match(/\.length=(\d+) < min (\d+)/);
    if (m) { return Number(m[1]) === 0 && Number(m[2]) >= 1; }
    return false;
  };
  const keep = [], dropped = [];
  for (const c of cases) {
    if (!Array.isArray(c.inputs)) { keep.push(c); continue; }
    let v; try { v = validateInputs(c.inputs, params, bounds); } catch { keep.push(c); continue; }
    const bad = (v.violations || []).find(safeViolation);
    if (!bad) keep.push(c); else dropped.push({ inputs: c.inputs, why: bad });
  }
  if (!dropped.length) continue;
  if (keep.length < MIN_KEEP) { report.push({ id: p.id, dropped: dropped.length, kept: keep.length, skipped: 'too-few-kept', sample: dropped[0]?.why }); continue; }
  // renumber samples
  const kept2 = keep.map((c, i) => ({ ...c, is_sample: i < 2 }));
  totalDropped += dropped.length;
  report.push({ id: p.id, dropped: dropped.length, kept: keep.length, sample: dropped[0]?.why });
  if (APPLY) { const { error } = await sb.from('PGcode_problems').update({ test_cases: kept2 }).eq('id', p.id); if (!error) wrote++; }
}
report.sort((a, b) => b.dropped - a.dropped);
fs.writeFileSync('/tmp/ood.json', JSON.stringify(report, null, 1));
const actionable = report.filter(r => !r.skipped);
console.log(`\nproblems with OUT-OF-DOMAIN cases: ${report.length} (${actionable.length} prunable, ${report.length - actionable.length} skipped: too few would remain)`);
console.log(`total out-of-domain cases: ${totalDropped}${APPLY ? ` | pruned ${wrote} problems` : ' (dry-run, nothing written)'}`);
console.log('top offenders:');
for (const r of actionable.slice(0, 20)) console.log(`  ${r.id}: drop ${r.dropped}, keep ${r.kept}  (${r.sample})`);
console.log('-> /tmp/ood.json');
