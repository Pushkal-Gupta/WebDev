// Apply agent-proposed test-case INPUTS by grading each against the canonical Python
// (the oracle) and appending only those that run cleanly. The agent supplies in-domain
// inputs (it understands the problem's real constraints); THIS script computes the
// `expected` via the canonical solution — the agent never sets expected, so a wrong or
// out-of-domain input can only be dropped, never mis-graded. Deduped, capped at --target.
//
// Input JSON: { slug: [ [inputStr, inputStr, ...], ... ] }
//   each inner array = one test case's positional param values, each a JSON string
//   (e.g. a List[int] param -> "[1,2,3]", a str param -> "\"abc\"", an int -> "5").
//
//   node scripts/apply-grown-cases.mjs --in /tmp/gc/out-0.json --target 50
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
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const IN = arg('in'); const TARGET = Number(arg('target', 50)); const DRY = process.argv.includes('--dry');
if (!IN) { console.error('need --in'); process.exit(1); }
const codeOf = (e) => !e ? '' : (typeof e === 'string' ? e : e.code || '');

const map = JSON.parse(fs.readFileSync(IN, 'utf8'));
let grown = 0, added = 0, skipped = 0;
for (const slug of Object.keys(map)) {
  const cand = map[slug]; if (!Array.isArray(cand) || !cand.length) { skipped++; continue; }
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,test_cases,solutions').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); skipped++; continue; }
  const code = codeOf(data.solutions?.python);
  if (!code || code.length < 15) { console.log(`  -    ${slug}: no python`); skipped++; continue; }
  const existing = Array.isArray(data.test_cases) ? data.test_cases : [];
  if (existing.length >= TARGET) { console.log(`  =    ${slug}: already ${existing.length}`); continue; }
  const wrapped = wrapWithDriver(code, 'python', data.method_name, data.params, data.return_type);
  const seen = new Set(existing.map((c) => JSON.stringify(c.inputs)));
  const cases = [...existing];
  let a = 0, bad = 0;
  for (const tuple of cand) {
    if (cases.length >= TARGET) break;
    if (!Array.isArray(tuple)) continue;
    const inputs = tuple.map((v) => String(v));
    const key = JSON.stringify(inputs);
    if (seen.has(key)) continue;
    let r; try { r = runLocal('python', wrapped, buildStdin(inputs) + '\n', { timeoutMs: 6000 }); } catch { bad++; continue; }
    if (!r || !r.ok) { bad++; continue; }
    const expected = (r.stdout ?? '').replace(/\n$/, '');
    if (expected === '') { bad++; continue; }
    seen.add(key); cases.push({ inputs, expected, is_sample: false }); a++;
  }
  if (a === 0) { console.log(`  x    ${slug}: 0 valid (of ${cand.length}, ${bad} rejected by canonical)`); skipped++; continue; }
  if (!DRY) { const { error: uerr } = await sb.from('PGcode_problems').update({ test_cases: cases }).eq('id', slug); if (uerr) { console.log(`  ERR  ${slug}: ${uerr.message.slice(0, 40)}`); skipped++; continue; } }
  grown++; added += a;
  console.log(`  GROW ${slug}: ${existing.length} -> ${cases.length} (+${a}${bad ? `, ${bad} rejected` : ''})`);
}
console.log(`\ngrown: ${grown} problems | cases added: ${added} | skipped: ${skipped}`);
