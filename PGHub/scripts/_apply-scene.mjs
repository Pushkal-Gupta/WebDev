// Merge a `scene` into an existing problem's viz_steps (keeping frames).
// Usage: node scripts/_apply-scene.mjs <scene-json-file>
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const file = process.argv[2];
const { id, scene } = JSON.parse(fs.readFileSync(file, 'utf8'));
const { data, error } = await sb.from('PGcode_problems').select('viz_steps').eq('id', id).single();
if (error) { console.error(error.message); process.exit(1); }
const viz = data.viz_steps || {};
viz.scene = scene;
const { error: e2 } = await sb.from('PGcode_problems').update({ viz_steps: viz }).eq('id', id);
if (e2) { console.error(e2.message); process.exit(1); }
console.log('scene applied to', id, '| objects', scene.objects.length, '| beats', (scene.beats||[]).length, '| frames kept', Array.isArray(viz.frames) ? viz.frames.length : 0);
