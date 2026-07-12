// Dump problems needing example-quality work (LeetCode-voice rewrite and/or real
// param names) into agent slice files. A problem qualifies if it has
// explained_samples OR carries generic nums/target param names.
//   node scripts/dump-example-quality.mjs --slices 6 --per 18 --outdir /tmp/eq [--offset 0]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const SLICES = Number(arg('slices', 6)); const PER = Number(arg('per', 18));
const OUTDIR = arg('outdir', '/tmp/eq'); const OFFSET = Number(arg('offset', 0));
const DONE = new Set(fs.existsSync(`${OUTDIR}/done.json`) ? JSON.parse(fs.readFileSync(`${OUTDIR}/done.json`, 'utf8')) : []);

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,name,description,method_name,params,return_type,solutions,explained_samples,constraints').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }

const genericParam = (ps) => { const names = (ps || []).map(p => p?.name || ''); return names.includes('nums') && names.includes('target') && names.length >= 2; };
const needs = rows.filter(p => !DONE.has(p.id) && (
  (Array.isArray(p.explained_samples) && p.explained_samples.length) || genericParam(p.params)
));
needs.sort((a, b) => a.id.localeCompare(b.id));
const pool = needs.slice(OFFSET, OFFSET + SLICES * PER);
console.log('qualifying problems:', needs.length, '| dumping', pool.length, 'from offset', OFFSET);

fs.mkdirSync(OUTDIR, { recursive: true });
const strip = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 900);
for (let i = 0; i < SLICES; i++) {
  const slice = pool.slice(i * PER, (i + 1) * PER).map(p => ({
    id: p.id, title: p.name, method_name: p.method_name,
    params: (p.params || []).map(x => ({ name: x.name, type: x.type })),
    return_type: p.return_type,
    genericParams: genericParam(p.params),
    description: strip(p.description),
    constraints: typeof p.constraints === 'string' ? p.constraints.slice(0, 400) : p.constraints,
    canonical: (p.solutions?.python?.code || '').slice(0, 1400),
    samples: (p.explained_samples || []).map(s => ({ inputs: s.inputs, expected: s.expected, current_explanation: (s.explanation_md || '').slice(0, 500) })),
  }));
  if (slice.length) fs.writeFileSync(`${OUTDIR}/slice-${i}.json`, JSON.stringify(slice));
}
console.log('wrote', Math.min(SLICES, Math.ceil(pool.length / PER)), 'slices to', OUTDIR);
