// Pre-slice the under-covered problems (from undercovered.json) for the test-case GROWTH drive.
// Each agent gets a problem's constraints + python + signature and generates VALID diverse inputs;
// Python computes the expected downstream, so correctness is guaranteed. Skips 0-case design/interactive
// problems (no method_name / no params) which can't be driver-graded.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SP = process.argv[2]; const PER = 12;
const ids = JSON.parse(fs.readFileSync(`${SP}/undercovered.json`, 'utf8')).map((u) => u.id);
const idset = new Set(ids);
let rows = [], from = 0;
while (true) { const { data, error } = await sb.from('PGcode_problems').select('id,name,difficulty,constraints,method_name,params,return_type,solutions').range(from, from + 499); if (error) { console.error('ERR', error.message); break; } if (!data || !data.length) break; rows = rows.concat(data.filter((r) => idset.has(r.id))); if (data.length < 500) break; from += 500; }
const targets = rows.filter((r) => r.method_name && Array.isArray(r.params) && r.params.length && r.solutions?.python?.code)
  .map((r) => ({ id: r.id, name: r.name, difficulty: r.difficulty, constraints: String(r.constraints || '').slice(0, 500), method_name: r.method_name, params: r.params, return_type: r.return_type, python: r.solutions.python.code }));
const skipped = rows.length - targets.length;
// Fetch 2 EXISTING sample input-tuples per target so agents copy the EXACT string format
// (e.g. str params are JSON-quoted like "\"abc\""). Done as small single-row reads (resize-safe).
const byId = Object.fromEntries(targets.map((t) => [t.id, t]));
for (const t of targets) {
  const { data: row } = await sb.from('PGcode_problems').select('test_cases').eq('id', t.id).single();
  const cs = (Array.isArray(row?.test_cases) ? row.test_cases : []).filter((c) => Array.isArray(c.inputs) && !c.stress).slice(0, 2);
  byId[t.id].sampleInputs = cs.map((c) => c.inputs);
}
const chunks = []; for (let i = 0; i < targets.length; i += PER) chunks.push(targets.slice(i, i + PER));
fs.rmSync(`${SP}/growth/wf`, { recursive: true, force: true });
chunks.forEach((c, i) => { const dir = `${SP}/growth/wf/s${i}`; fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(`${dir}/slice.json`, JSON.stringify(c)); });
console.log(`under-covered ids: ${ids.length} | growable (has method+params+python): ${targets.length} | skipped design/interactive: ${skipped}`);
console.log(`slices: ${chunks.length} (PER ${PER})`);
process.exit(0);
