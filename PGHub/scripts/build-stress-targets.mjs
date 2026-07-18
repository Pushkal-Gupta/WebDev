// Build agent-ready slices for the HARDER stress-case work: problems whose "size" lives in a
// 2-D array / scalar-N / tree-graph param (the 1-D-array ones are handled by add-stress-cases.mjs).
// Each target carries the constraints + canonical python + 2 sample cases so an agent can write a
// per-problem max-size input generator and grade it with the canonical.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const SLICES = arg('slices', 6), LIMIT = arg('limit', 90), OFFSET = arg('offset', 0);
const dead = new Set(JSON.parse(fs.readFileSync('/tmp/health/dead.json', 'utf8')).map(d => d.id));
const big = /10\^[4-9]|[1-9]0{4,}|100000|2\s*\*\s*10\^[4-9]/;

let rows = [], from = 0;
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,constraints,solutions,test_cases').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }

const targets = [];
for (const p of rows) {
  if (dead.has(p.id)) continue;
  const params = Array.isArray(p.params) ? p.params : [];
  const py = p.solutions?.python?.code || '';
  if (!/class\s+Solution/.test(py)) continue;
  if (params.some((x) => x.type === 'List[int]' || x.type === 'List[str]')) continue; // 1-D handled by script
  if (!big.test(p.constraints || '')) continue;
  // heterogeneous/dict/Any → not gradeable at scale, skip
  if (params.some((x) => /Any|dict|Table|List\[List\[List/.test(x.type || ''))) continue;
  const cases = (Array.isArray(p.test_cases) ? p.test_cases : []).filter((c) => Array.isArray(c.inputs));
  if (cases.length < 2) continue;
  const curMax = Math.max(0, ...cases.map((c) => Math.max(0, ...c.inputs.map((s) => (String(s).match(/,/g) || []).length + 1))));
  if (curMax >= 20000) continue; // already stressed
  targets.push({ id: p.id, method_name: p.method_name, params: p.params, return_type: p.return_type, constraints: p.constraints, python: py, sampleCases: cases.slice(0, 2).map((c) => ({ inputs: c.inputs, expected: c.expected })) });
}
const batch = targets.slice(OFFSET, OFFSET + LIMIT);
fs.mkdirSync('/tmp/st', { recursive: true });
const per = Math.ceil(batch.length / SLICES);
for (let s = 0; s < SLICES; s++) fs.writeFileSync(`/tmp/st/slice-${s}.json`, JSON.stringify(batch.slice(s * per, (s + 1) * per), null, 1));
console.log(`stress targets: ${batch.length} (of ${targets.length} total harder) -> ${SLICES} slices of ~${per}`);
