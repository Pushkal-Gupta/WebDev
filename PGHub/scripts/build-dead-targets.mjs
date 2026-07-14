// From /tmp/health/dead.json, pull full context for each problem and split into
// GRADEABLE algorithmic targets (for the fix-wave) vs NON-GRADEABLE (SQL / pandas /
// JS-runtime-design / randomized-interactive) which our Judge0 driver can't grade and
// must be flagged, not "fixed". Writes agent-ready slices with method signature,
// constraints, description, and a couple of existing input tuples for shape.
//   node scripts/build-dead-targets.mjs [--slices 6]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const SLICES = Number(arg('slices', 6));
const dead = JSON.parse(fs.readFileSync('/tmp/health/dead.json', 'utf8'));
const ids = dead.map(d => d.id);

let rows = [];
for (let i = 0; i < ids.length; i += 300) {
  const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,constraints,description,test_cases').in('id', ids.slice(i, i + 300));
  rows = rows.concat(data || []);
}

const nonGradeable = [], targets = [];
for (const p of rows) {
  const desc = (p.description || '').replace(/<[^>]+>/g, ' ');
  const params = Array.isArray(p.params) ? p.params : [];
  const ptypes = params.map(x => x.type).join(',');
  const sql = /\bTable\s*:|\bSQL\b|SELECT\s|Write an SQL|Write a solution to (report|find)|\+--+\+/i.test(desc) || /DataFrame|pandas|pd\./i.test(desc) || ptypes.includes('DataFrame');
  const jsRuntime = /\bclosure|\bpromise\b|debounce|throttle|\bcurry|memoize|event ?emitter|callback|\basync function|setTimeout|this binding|call the function/i.test(desc) && params.length <= 1 && /function|callback|fn/i.test(ptypes + ' ' + params.map(x => x.name).join(' '));
  const rand = /\brandom|\brand\d|shuffle|\bguess\b|interactive|ArrayReader|pick(Index| a random)/i.test(desc);
  if (sql) { nonGradeable.push({ id: p.id, why: 'sql/pandas' }); continue; }
  if (rand) { nonGradeable.push({ id: p.id, why: 'random/interactive' }); continue; }
  if (jsRuntime) { nonGradeable.push({ id: p.id, why: 'js-runtime' }); continue; }
  const sampleInputs = (p.test_cases || []).slice(0, 3).map(c => c.inputs).filter(Array.isArray);
  targets.push({ id: p.id, method_name: p.method_name, params, return_type: p.return_type, constraints: (p.constraints || '').slice(0, 400), description: desc.replace(/\s+/g, ' ').trim().slice(0, 1200), sampleInputs });
}
fs.mkdirSync('/tmp/dead', { recursive: true });
fs.writeFileSync('/tmp/dead/non-gradeable.json', JSON.stringify(nonGradeable, null, 1));
const per = Math.ceil(targets.length / SLICES);
for (let s = 0; s < SLICES; s++) fs.writeFileSync(`/tmp/dead/slice-${s}.json`, JSON.stringify(targets.slice(s * per, (s + 1) * per), null, 1));
console.log('gradeable targets:', targets.length, `-> ${SLICES} slices of ~${per}`);
console.log('non-gradeable (flagged, skip):', nonGradeable.length, '-> /tmp/dead/non-gradeable.json');
console.log('  by reason:', JSON.stringify(nonGradeable.reduce((a, x) => (a[x.why] = (a[x.why] || 0) + 1, a), {})));
