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
const batch = cand.slice(OFFSET, OFFSET + LIMIT);
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
  const r = byId[b.id]; if (!r) continue;
  const py = r.solutions?.python?.code || '';
  if (!/class\s+Solution/.test(py) || BAD.test(py)) continue; // need a real python to port from
  const cs = (r.test_cases || []).slice(0, 2).map(c => ({ inputs: c.inputs, expected: c.expected }));
  targets.push({ id: r.id, method_name: r.method_name, params: r.params, return_type: r.return_type, missing: b.missing, python: py, sampleCases: cs });
}
fs.mkdirSync('/tmp/bf', { recursive: true });
const per = Math.ceil(targets.length / SLICES);
for (let s = 0; s < SLICES; s++) fs.writeFileSync(`/tmp/bf/slice-${s}.json`, JSON.stringify(targets.slice(s * per, (s + 1) * per), null, 1));
console.log(`backfill targets: ${targets.length} (of ${cand.length} total missing, offset ${OFFSET}) -> ${SLICES} slices of ~${per}`);
console.log('missing-lang distribution in batch:', JSON.stringify(targets.reduce((a, t) => (a[t.missing.length] = (a[t.missing.length] || 0) + 1, a), {})));
console.log('TOTAL remaining missing-lang (gradeable):', cand.length);
