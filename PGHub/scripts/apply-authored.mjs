// Fix stub problems that have null-expected test cases: an agent authors a correct
// canonical Python + a pool of in-domain inputs; this script writes the solution and
// REBUILDS the test cases by running the canonical on each input (so `expected` is
// real, never null). Input whose canonical run errors/empties is dropped. Only writes
// a problem if the canonical produced >=8 clean cases.
//
// Input JSON: { slug: { python: "class Solution: ...", approach?: str, complexity?: {time,space},
//                       inputs: [ [inpStr, ...], ... ] } }
//
//   node scripts/apply-authored.mjs --in /tmp/au/out-0.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const IN = arg('in'); const DRY = process.argv.includes('--dry'); const TARGET = Number(arg('target') || 50);
if (!IN) { console.error('need --in'); process.exit(1); }

const map = JSON.parse(fs.readFileSync(IN, 'utf8'));
let wrote = 0, failed = 0, totCases = 0;
for (const slug of Object.keys(map)) {
  const entry = map[slug] || {};
  const code = (entry.python || '').trim();
  if (!/class\s+Solution/.test(code) || code.length < 25 || /Reference skeleton|See the Editorial/i.test(code)) { console.log(`  x    ${slug}: no real canonical`); failed++; continue; }
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); failed++; continue; }
  let wrapped; try { wrapped = wrapWithDriver(code, 'python', data.method_name, data.params, data.return_type); } catch (e) { console.log(`  x    ${slug}: wrap ${e.message.slice(0, 40)}`); failed++; continue; }

  // candidate inputs: agent-supplied + recompute any existing case inputs
  const cand = Array.isArray(entry.inputs) ? entry.inputs.slice() : [];
  for (const c of (Array.isArray(data.test_cases) ? data.test_cases : [])) if (Array.isArray(c.inputs)) cand.push(c.inputs);
  const seen = new Set(); const cases = [];
  for (const tuple of cand) {
    if (cases.length >= TARGET) break;
    if (!Array.isArray(tuple)) continue;
    const inputs = tuple.map((v) => String(v));
    const key = JSON.stringify(inputs); if (seen.has(key)) continue;
    let r; try { r = runLocal('python', wrapped, buildStdin(inputs) + '\n', { timeoutMs: 6000 }); } catch { continue; }
    if (!r || !r.ok) continue;
    const expected = (r.stdout ?? '').replace(/\n$/, ''); if (expected === '') continue;
    seen.add(key); cases.push({ inputs, expected, is_sample: cases.length < 2 });
  }
  if (cases.length < 8) { console.log(`  x    ${slug}: only ${cases.length} clean cases (canonical wrong?)`); failed++; continue; }
  const pyObj = { code };
  if (entry.approach && entry.approach.length > 20) pyObj.approach = entry.approach;
  if (entry.complexity && entry.complexity.time) pyObj.complexity = entry.complexity;
  if (!DRY) {
    const { error: uerr } = await sb.from('PGcode_problems').update({ solutions: { ...(data.solutions || {}), python: pyObj }, test_cases: cases }).eq('id', slug);
    if (uerr) { console.log(`  ERR  ${slug}: ${uerr.message.slice(0, 40)}`); failed++; continue; }
  }
  wrote++; totCases += cases.length;
  console.log(`  WROTE ${slug}: canonical + ${cases.length} graded cases (was all-null)`);
}
console.log(`\n${DRY ? 'would-write' : 'wrote'}: ${wrote} | failed: ${failed} | total cases: ${totCases}`);
