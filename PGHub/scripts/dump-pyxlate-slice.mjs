// Dump a slice of python-stub translation targets into a self-contained JSON the
// authoring agent can read directly (no DB access in the agent). Each entry has the
// problem's signature, the existing REAL solution to translate from, and a few
// sample cases for the agent to sanity-check against.
//
//   node scripts/dump-pyxlate-slice.mjs --start 0 --count 40 --out /tmp/slice-0.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const START = Number(arg('start', 0)); const COUNT = Number(arg('count', 40));
const OUT = arg('out'); if (!OUT) { console.error('need --out'); process.exit(1); }

const TARGETS_FILE = arg('targets', 'py-author-targets.json');
const targets = JSON.parse(fs.readFileSync(path.join(__dirname, TARGETS_FILE), 'utf8'));
const slice = targets.slice(START, START + COUNT);
const out = [];
for (const t of slice) {
  const { data, error } = await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,test_cases,description,constraints').eq('id', t.id).single();
  if (error || !data) { console.error(`skip ${t.id}: ${error?.message || 'no data'}`); continue; }
  const cases = Array.isArray(data.test_cases) ? data.test_cases : [];
  out.push({
    id: data.id,
    title: data.name,
    method_name: data.method_name,
    params: data.params,
    return_type: data.return_type,
    constraints: data.constraints || null,
    description: (data.description || '').slice(0, 2200),
    sample_cases: cases.slice(0, 5),
    total_cases: cases.length,
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`dumped ${out.length} targets [${START},${START + COUNT}) -> ${OUT}`);
