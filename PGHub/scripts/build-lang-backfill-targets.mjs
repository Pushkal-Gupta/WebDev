// Build agent-ready slices for the missing-language reference-solution backfill.
// Sources /tmp/health/missing-langs.json, EXCLUDES the non-gradeable/broken DEAD set
// (/tmp/health/dead.json), and for each remaining problem attaches the correct python
// canonical (to port from), method signature, and 2 sample cases (for sanity checks).
// Prioritizes problems missing the MOST languages first.
//   node scripts/build-lang-backfill-targets.mjs [--slices 6] [--limit 90]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const SLICES = Number(arg('slices', 6)); const LIMIT = Number(arg('limit', 90));
const OFFSET = Number(arg('offset', 0));
const ml = JSON.parse(fs.readFileSync('/tmp/health/missing-langs.json', 'utf8'));
const deadIds = new Set(JSON.parse(fs.readFileSync('/tmp/health/dead.json', 'utf8')).map(d => d.id));
// only js/java/cpp are portable via our driver; ignore python-missing (rare) here
const cand = ml.filter(m => !deadIds.has(m.id)).map(m => ({ id: m.id, missing: m.missing.filter(L => L !== 'python') }))
  .filter(m => m.missing.length)
  .sort((a, b) => b.missing.length - a.missing.length);
// Problems that repeatedly fail to backfill regardless of agent (order-sensitive /
// return-any, int/bigint overflow with int32 return, JS-async, node-return quirks,
// order-mismatch vs stored python-set-order expected) — exclude so agents aren't
// re-fed the unbackfillable tail every wave (they'd re-sort to the top and waste a slice).
const RESIDUAL = new Set(['add-two-numbers-ii', 'find-if-path-exists', 'course-schedule-ii', 'course-schedule-iv', 'dfs-traversal', 'add-edges-to-make-degrees-of-all-nodes-even', 'factorial', 'fibonacci', 'super-pow', 'add-two-promises', 'find-and-replace-in-string', 'shortest-path-with-alternating-colors', 'angles-of-a-triangle', 'walls-and-gates', 'next-permutation', 'max-product-three', 'integer-to-english-words', 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance', 'is-graph-bipartite', 'sum-of-floored-pairs', 'circular-array-implementation', 'two-out-of-three', 'sum-of-distances-in-tree', 'arithmetic-subarrays', 'flattening', 'graph-coloring', 'finding-the-users-active-minutes', 'josephus', 'linear-probing', 'min-swaps-to-group-all-1',
  // OUT-OF-DOMAIN cases (bad auto-grow): python bigint/arbitrary-precision passes them but
  // fixed-width js/java/cpp can't, and they'd false-reject correct human solutions. Excluded
  // from backfill until the out-of-domain case pruner cleans them.
  'cells-with-odd-values-in-a-matrix', 'all-ancestors-of-a-node-in-a-directed-acyclic-graph', 'first-non-repeating-in-a-stream', 'sort-by-set-bits', 'modify-the-matrix', 'sum-of-subarray-minimums', 'n-th-tribonacci', 'add-digits', 'circular-queue', '01-matrix', 'array-reduce-transformation', 'cheapest-flights-within-k-stops', 'hollow-rectangle', 'erect-the-fence', 'browser-history']);
const batch = cand.slice(OFFSET, OFFSET + LIMIT * 4);
const BAD = /Reference skeleton|See the Editorial|TODO|NotImplemented/i;
let rows = [];
for (let i = 0; i < batch.length; i += 200) {
  const ids = batch.slice(i, i + 200).map(b => b.id);
  const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').in('id', ids);
  rows = rows.concat(data || []);
}
const byId = Object.fromEntries(rows.map(r => [r.id, r]));
const targets = [];
for (const b of batch) {
  if (RESIDUAL.has(b.id)) continue;
  const r = byId[b.id]; if (!r) continue;
  const py = r.solutions?.python?.code || '';
  if (!/class\s+Solution/.test(py) || BAD.test(py)) continue; // need a real python to port from
  // apply-lang-backfill needs >=5 cases to verify a port; grow <5-case ones first.
  if ((Array.isArray(r.test_cases) ? r.test_cases.length : 0) < 5) continue;
  const cs = (r.test_cases || []).slice(0, 2).map(c => ({ inputs: c.inputs, expected: c.expected }));
  targets.push({ id: r.id, method_name: r.method_name, params: r.params, return_type: r.return_type, missing: b.missing, python: py, sampleCases: cs });
  if (targets.length >= LIMIT) break;
}
fs.mkdirSync('/tmp/bf', { recursive: true });
const per = Math.ceil(targets.length / SLICES);
for (let s = 0; s < SLICES; s++) fs.writeFileSync(`/tmp/bf/slice-${s}.json`, JSON.stringify(targets.slice(s * per, (s + 1) * per), null, 1));
console.log(`backfill targets: ${targets.length} (of ${cand.length} total missing, offset ${OFFSET}) -> ${SLICES} slices of ~${per}`);
console.log('missing-lang distribution in batch:', JSON.stringify(targets.reduce((a, t) => (a[t.missing.length] = (a[t.missing.length] || 0) + 1, a), {})));
console.log('TOTAL remaining missing-lang (gradeable):', cand.length);
