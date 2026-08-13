// Grade + store agent-generated growth inputs. For each slug in the growth out.json files, run the
// canonical Python on every candidate input; keep only inputs Python cleanly answers (no crash,
// non-empty), dedupe against existing cases, and append up to TARGET total non-stress cases. Python
// computes the expected, so every stored case is correct-by-construction. Never removes cases.
//   node scripts/grade-growth.mjs <scratchpad> [--target 40] [--dry]
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver } from '../src/lib/driverCode.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SP = process.argv[2]; const DRY = process.argv.includes('--dry');
const T = process.argv.indexOf('--target'); const TARGET = T >= 0 ? +process.argv[T + 1] : 40;
const CRASH = /Traceback|Error|Exception/i;
const DIR = fs.mkdtempSync(os.tmpdir() + '/grow-');

const gen = {};
for (let i = 0; i < 200; i++) { const f = `${SP}/growth/wf/s${i}/out.json`; if (!fs.existsSync(f)) continue; let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; } for (const k of Object.keys(j)) gen[k] = (gen[k] || []).concat(Array.isArray(j[k]) ? j[k] : []); }
const slugs = Object.keys(gen);
let added = 0, touched = 0; const perProblem = [];
for (const slug of slugs) {
  const { data, error } = await sb.from('PGcode_problems').select('method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (error || !data) continue;
  const py = data.solutions?.python?.code; if (!py || !data.method_name) continue;
  let wrapped; try { wrapped = wrapWithDriver(py, 'python', data.method_name, data.params, data.return_type); } catch { continue; }
  fs.writeFileSync(`${DIR}/m.py`, wrapped);
  const existing = (Array.isArray(data.test_cases) ? data.test_cases : []);
  const seen = new Set(existing.filter((c) => Array.isArray(c.inputs)).map((c) => JSON.stringify(c.inputs)));
  const realCount = existing.filter((c) => Array.isArray(c.inputs) && !c.stress).length;
  const need = Math.max(0, TARGET - realCount);
  if (need === 0) { perProblem.push(`${slug}:full`); continue; }
  const fresh = [];
  for (const tup of gen[slug]) {
    if (fresh.length >= need) break;
    if (!Array.isArray(tup)) continue; const inputs = tup.map(String); const key = JSON.stringify(inputs);
    if (seen.has(key)) continue;
    const r = spawnSync('python3', [`${DIR}/m.py`], { input: inputs.join('\n') + '\n', encoding: 'utf8', timeout: 10000, maxBuffer: 5e7 });
    if (r.status !== 0 || CRASH.test(r.stderr || '')) continue; // python couldn't run it -> invalid/OOD input, drop
    const out = (r.stdout || '').replace(/\n$/, ''); if (out.trim() === '') continue;
    seen.add(key); fresh.push({ inputs, expected: out, is_sample: false });
  }
  if (fresh.length) { added += fresh.length; touched++; if (!DRY) await sb.from('PGcode_problems').update({ test_cases: [...existing, ...fresh] }).eq('id', slug); perProblem.push(`${slug}:+${fresh.length}(${realCount}->${realCount + fresh.length})`); }
  else perProblem.push(`${slug}:+0`);
}
try { fs.rmSync(DIR, { recursive: true, force: true }); } catch { /**/ }
fs.writeFileSync(`${SP}/growth-apply-report.json`, JSON.stringify(perProblem, null, 0));
console.log(`${DRY ? 'would-add' : 'added'}: ${added} cases across ${touched} problems (of ${slugs.length} with generated inputs)`);
process.exit(0);
