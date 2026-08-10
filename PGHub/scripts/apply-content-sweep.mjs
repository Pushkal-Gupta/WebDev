// Paced apply sweep for the content-drive Workflow output. Collects every out-*.json under
// SP/viz/wf/*/ (viz_steps) and SP/appr/wf/*/ (editorial_md), validates, and updates the DB
// with a small pause every BATCH writes so a large sweep never re-triggers the PostgREST throttle.
//   node scripts/apply-content-sweep.mjs <scratchpad-abs-path> [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SP = process.argv[2]; const DRY = process.argv.includes('--dry');
if (!SP) { console.error('usage: node apply-content-sweep.mjs <scratchpad> [--dry]'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BATCH = 25, PAUSE = 1500;
const OK_RENDERERS = new Set(['array', 'window', 'grid', 'graph', 'tree']);

const vizValid = (v) => {
  if (!v || typeof v !== 'object' || typeof v.title !== 'string' || !OK_RENDERERS.has(v.renderer)) return false;
  if (!Array.isArray(v.frames) || v.frames.length < 4) return false;
  return v.frames.every((f) => f && typeof f.caption === 'string' && f.caption && ((v.renderer !== 'array' && v.renderer !== 'window') || Array.isArray(f.array)));
};
const apprValid = (md) => typeof md === 'string' && md.length >= 300 && /brute|naive/i.test(md) && /optimal|efficient/i.test(md) && /O\(/.test(md);

function collect(baseDir, key, validate) {
  const items = []; if (!fs.existsSync(baseDir)) return items;
  for (const sub of fs.readdirSync(baseDir)) {
    const d = path.join(baseDir, sub); if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d).filter((x) => /^out-\d+\.json$/.test(x))) {
      let arr; try { arr = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); } catch { continue; }
      if (!Array.isArray(arr)) continue;
      for (const row of arr) { const val = row[key]; if (row.id && validate(val)) items.push({ id: row.id, val }); }
    }
  }
  return items;
}

const viz = collect(`${SP}/viz/wf`, 'viz_steps', vizValid);
const appr = collect(`${SP}/appr/wf`, 'editorial_md', apprValid);
console.log(`collected: viz ${viz.length}, appr ${appr.length}${DRY ? ' (DRY)' : ''}`);

async function applyAll(items, col) {
  let n = 0, bad = 0;
  for (const it of items) {
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ [col]: it.val }).eq('id', it.id); if (error) { bad++; continue; } }
    n++; if (n % BATCH === 0) { await sleep(PAUSE); process.stdout.write(`  ${col}: ${n}/${items.length}\r`); }
  }
  console.log(`\n${col} applied: ${n} | failed: ${bad}`);
}
await applyAll(viz, 'viz_steps');
await applyAll(appr, 'editorial_md');
console.log('sweep done.');
process.exit(0);
