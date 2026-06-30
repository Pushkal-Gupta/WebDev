// Dump a slice of editorial-backfill targets for an authoring agent: includes the
// EXISTING (graded-correct) python code so the agent explains that exact solution
// rather than rewriting it. Agent returns { slug: { code:<same>, approach, complexity, hints } }.
//
//   node scripts/dump-editorial-slice.mjs --start 0 --count 30 --out /tmp/ed/slice-0.json
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
const START = Number(arg('start', 0)); const COUNT = Number(arg('count', 30));
const OUT = arg('out'); if (!OUT) { console.error('need --out'); process.exit(1); }
const codeOf = (e) => !e ? '' : (typeof e === 'string' ? e : e.code || '');
const targets = JSON.parse(fs.readFileSync(path.join(__dirname, 'py-editorial-targets.json'), 'utf8'));
const slice = targets.slice(START, START + COUNT);
const out = [];
for (const t of slice) {
  const { data, error } = await sb.from('PGcode_problems').select('id,name,method_name,params,return_type,description,solutions,hints').eq('id', t.id).single();
  if (error || !data) continue;
  out.push({
    id: data.id,
    title: data.name,
    method_name: data.method_name,
    params: data.params,
    return_type: data.return_type,
    description: (data.description || '').slice(0, 1800),
    code: codeOf(data.solutions?.python),
    has_hints: Array.isArray(data.hints) && data.hints.length >= 2,
    need: t,
  });
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`dumped ${out.length} editorial targets [${START},${START + COUNT}) -> ${OUT}`);
