// Fresh-query the remaining viz + approaches gaps, pre-slice each into its own per-agent
// directory (SP/{viz,appr}/wf/sNNN/slice.json), and emit the Workflow task list to
// SP/content-drive-tasks.json. Run after each apply so it always reflects true remaining work.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SP = process.argv[2];
if (!SP) { console.error('usage: node preslice-content-drive.mjs <scratchpad-abs-path> [maxViz] [maxAppr]'); process.exit(1); }
const MAX_VIZ = Number(process.argv[3] || 100000), MAX_APPR = Number(process.argv[4] || 100000);
const VIZ_PER = 12, APPR_PER = 15;

// remaining VIZ: viz_steps null + has python
let viz = [], from = 0;
while (true) { const { data, error } = await sb.from('PGcode_problems').select('id,name,pattern,difficulty,method_name,params,description,solutions,tags').is('viz_steps', null).range(from, from + 499); if (error) { console.error('viz err', error.message); break; } if (!data || !data.length) break; viz = viz.concat(data); if (data.length < 500) break; from += 500; }
const vizT = viz.filter((p) => p.solutions?.python?.code).map((p) => ({ id: p.id, name: p.name, pattern: p.pattern, difficulty: p.difficulty, method_name: p.method_name, params: p.params, tags: (p.tags || []).slice(0, 4), description: String(p.description || '').slice(0, 600), python: p.solutions.python.code })).slice(0, MAX_VIZ);

// remaining APPR: Medium/Hard, editorial present, not brute+optimal, has python
let ap = [], f2 = 0;
while (true) { const { data, error } = await sb.from('PGcode_problems').select('id,name,pattern,difficulty,solutions,editorial_md').in('difficulty', ['Medium', 'Hard']).not('editorial_md', 'is', null).range(f2, f2 + 499); if (error) { console.error('appr err', error.message); break; } if (!data || !data.length) break; ap = ap.concat(data); if (data.length < 500) break; f2 += 500; }
const apT = ap.filter((p) => { const m = p.editorial_md || ''; return !(/brute|naive/i.test(m) && /optimal|efficient/i.test(m)) && m.length > 120 && p.solutions?.python?.code; }).map((p) => ({ id: p.id, name: p.name, pattern: p.pattern, difficulty: p.difficulty, python: p.solutions.python.code, editorial: String(p.editorial_md || '').slice(0, 400) })).slice(0, MAX_APPR);

const tasks = [];
const chunk = (arr, per) => { const out = []; for (let i = 0; i < arr.length; i += per) out.push(arr.slice(i, i + per)); return out; };
const vizChunks = chunk(vizT, VIZ_PER);
vizChunks.forEach((c, i) => { const dir = `${SP}/viz/wf/s${i}`; fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(`${dir}/slice.json`, JSON.stringify(c)); tasks.push({ kind: 'viz', dir, idx: i }); });
const apprChunks = chunk(apT, APPR_PER);
apprChunks.forEach((c, i) => { const dir = `${SP}/appr/wf/s${i}`; fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(`${dir}/slice.json`, JSON.stringify(c)); tasks.push({ kind: 'appr', dir, idx: i }); });

fs.writeFileSync(`${SP}/content-drive-tasks.json`, JSON.stringify({ tasks }, null, 1));
console.log(`remaining VIZ ${vizT.length} -> ${vizChunks.length} slices | remaining APPR ${apT.length} -> ${apprChunks.length} slices`);
console.log(`total tasks: ${tasks.length} -> ${SP}/content-drive-tasks.json`);
process.exit(0);
