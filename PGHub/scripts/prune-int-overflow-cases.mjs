// Prune OUT-OF-DOMAIN test cases whose INTEGER expected value exceeds the range the
// problem's declared fixed-width return type can hold. Our harness maps `int` -> 32-bit
// (Java/C++ `int`), so a case whose expected is an integer outside [-2^31, 2^31-1] can
// NEVER be produced by a correct int-returning solution — it's a bad auto-grow artifact
// that false-rejects correct Java/C++/JS solutions (the #1 rule) while Python's bignum
// sails through. Dropping such cases can't false-reject anything (it removes the
// impossible-to-satisfy cases only).
//
// SAFETY: only drops when the expected is a whole integer out of int32 range. A FRACTIONAL
// expected (e.g. 1.0, 20.5) means the return type is mislabeled `int` but really `float`
// — that's a type fix, NOT an OOD case, so we never touch those here. Keeps >= MIN_KEEP.
//   node scripts/prune-int-overflow-cases.mjs --dry
//   node scripts/prune-int-overflow-cases.mjs --apply
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const MIN_KEEP = 8;
const I32_MAX = 2147483647n, I32_MIN = -2147483648n;

// return types whose values must fit a 32-bit int (scalar or per-element)
const INT_SCALAR = new Set(['int', 'integer']);
const INT_LIST = new Set(['List[int]', 'List[List[int]]']);

// Does this expected string contain an INTEGER literal out of int32 range?
// Ignores fractional numbers (those indicate a float-typed answer, not OOD).
function overflowsInt32(expected) {
  const s = String(expected);
  // find integer literals NOT followed by a decimal point (skip 1.0, 20.5, etc.)
  const re = /-?\d+(?!\.\d)/g; let m;
  while ((m = re.exec(s)) !== null) {
    // guard: skip if this digit run is actually the fractional tail of a float
    const before = s[m.index - 1];
    if (before === '.') continue;
    let v; try { v = BigInt(m[0]); } catch { continue; }
    if (v > I32_MAX || v < I32_MIN) return m[0];
  }
  return null;
}

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,return_type,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
console.log('scanning', rows.length, 'problems');

const report = []; let totalDropped = 0, wrote = 0;
for (const p of rows) {
  const rt = (p.return_type || '').trim();
  const isIntScalar = INT_SCALAR.has(rt), isIntList = INT_LIST.has(rt);
  if (!isIntScalar && !isIntList) continue;
  const cases = Array.isArray(p.test_cases) ? p.test_cases : [];
  if (cases.length < MIN_KEEP) continue;
  const keep = [], dropped = [];
  for (const c of cases) {
    const bad = overflowsInt32(c.expected);
    if (bad) dropped.push({ expected: String(c.expected).slice(0, 40), bad }); else keep.push(c);
  }
  if (!dropped.length) continue;
  if (keep.length < MIN_KEEP) { report.push({ id: p.id, rt, dropped: dropped.length, kept: keep.length, skipped: 'too-few-kept', sample: dropped[0] }); continue; }
  const kept2 = keep.map((c, i) => ({ ...c, is_sample: i < 2 }));
  totalDropped += dropped.length;
  report.push({ id: p.id, rt, dropped: dropped.length, kept: keep.length, sample: dropped[0] });
  if (APPLY) { const { error } = await sb.from('PGcode_problems').update({ test_cases: kept2 }).eq('id', p.id); if (!error) wrote++; }
}
report.sort((a, b) => b.dropped - a.dropped);
fs.writeFileSync('/tmp/health/int-overflow-ood.json', JSON.stringify(report, null, 1));
const actionable = report.filter(r => !r.skipped);
console.log(`\nproblems with INT32-OVERFLOW expecteds: ${report.length} (${actionable.length} prunable, ${report.length - actionable.length} skipped: too few would remain)`);
console.log(`total out-of-domain cases: ${totalDropped}${APPLY ? ` | pruned ${wrote} problems` : ' (dry-run)'}`);
for (const r of actionable.slice(0, 25)) console.log(`  ${r.id} (${r.rt}): drop ${r.dropped}, keep ${r.kept}  e.g. ${r.sample?.bad}`);
console.log('-> /tmp/health/int-overflow-ood.json');
