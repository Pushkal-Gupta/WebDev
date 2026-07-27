import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const START_WAVE = parseInt(process.argv[2] || '33', 10);
const COUNT_ONLY = process.argv.includes('--count');
let rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,name,pattern,difficulty,method_name,params,tags,description,solutions')
    .is('viz_steps', null).order('id').range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  rows = rows.concat(data);
  if (data.length < 1000) break;
}
function realAlgo(r) {
  const py = r.solutions && r.solutions.python;
  if (typeof py !== 'string') return false;
  if (/Reference skeleton/.test(py)) return false;
  // strip comments/blank, require a real body beyond 'pass'
  const body = py.replace(/#.*$/gm, '').split('\n').map(s => s.trim()).filter(Boolean);
  if (body.length < 6) return false;
  if (!/\breturn\b/.test(py)) return false;
  const tags = r.tags || [];
  if (tags.includes('database')) return false;
  return true;
}
const targets = rows.filter(realAlgo)
  .map(r => ({ id: r.id, name: r.name, pattern: r.pattern, difficulty: r.difficulty,
    method_name: r.method_name, params: r.params, tags: r.tags,
    description: (r.description || '').slice(0, 700), python: r.solutions.python }));
console.log('remaining-null-viz', rows.length, 'real-algo', targets.length);
if (COUNT_ONLY) process.exit(0);
const PER_SLICE = 12, SLICES = 6, PER_WAVE = PER_SLICE * SLICES;
fs.mkdirSync('/tmp/viz', { recursive: true });
// clear old w33+ slices to avoid stale
for (const f of fs.readdirSync('/tmp/viz')) { const m = f.match(/^w(\d+)-\d\.json$/); if (m && +m[1] >= START_WAVE) fs.unlinkSync('/tmp/viz/'+f); }
let wave = START_WAVE, written = 0;
for (let w = 0; w < targets.length; w += PER_WAVE, wave++) {
  const waveItems = targets.slice(w, w + PER_WAVE);
  for (let s = 0; s < SLICES; s++) {
    const slice = waveItems.slice(s * PER_SLICE, s * PER_SLICE + PER_SLICE);
    if (!slice.length) break;
    fs.writeFileSync(`/tmp/viz/w${wave}-${s}.json`, JSON.stringify(slice));
    written++;
  }
}
console.log('waves', START_WAVE, '..', wave - 1, 'sliceFiles', written);
