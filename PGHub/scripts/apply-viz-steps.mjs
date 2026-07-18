// Apply agent-produced viz_steps to PGcode_problems. Reads /tmp/viz/out-*.json
// (each = array of {id, viz_steps:{title,renderer,frames}}), validates shape,
// and stores only well-formed viz. Idempotent (overwrites viz_steps for the id).
//   node scripts/apply-viz-steps.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');
const OK_RENDERERS = new Set(['array', 'window', 'grid', 'graph', 'tree']);

function valid(v) {
  if (!v || typeof v !== 'object') return 'not-object';
  if (!v.title || typeof v.title !== 'string') return 'no-title';
  if (!OK_RENDERERS.has(v.renderer)) return 'bad-renderer';
  if (!Array.isArray(v.frames) || v.frames.length < 4) return 'too-few-frames';
  for (const f of v.frames) {
    if (!f || typeof f !== 'object') return 'bad-frame';
    if (typeof f.caption !== 'string' || !f.caption) return 'frame-no-caption';
    if ((v.renderer === 'array' || v.renderer === 'window') && !Array.isArray(f.array)) return 'frame-no-array';
  }
  return null;
}

const dir = '/tmp/viz';
const files = fs.readdirSync(dir).filter((f) => /^out-\d+\.json$/.test(f));
let applied = 0, bad = 0; const rejects = [];
for (const f of files) {
  let arr; try { arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { console.log('unparseable', f); continue; }
  if (!Array.isArray(arr)) continue;
  for (const { id, viz_steps } of arr) {
    const why = valid(viz_steps);
    if (why) { bad++; rejects.push({ id, why }); continue; }
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ viz_steps }).eq('id', id); if (error) { rejects.push({ id, why: 'db:' + error.message.slice(0, 40) }); continue; } }
    applied++;
  }
}
console.log(`viz applied: ${applied} | rejected: ${bad}${DRY ? ' (DRY)' : ''}`);
if (rejects.length) console.log('rejects:', JSON.stringify(rejects.slice(0, 20)));
