// P0 correctness fix for explained_samples: each curated example's `expected`
// must equal what the canonical produces for its `inputs`. Many were AI-authored
// with WRONG outputs that contradict their own explanation text (e.g. a graph
// example shows output "1" while the prose concludes the answer is 3). Run the
// canonical on every sample's inputs; if it produces a clean output that differs
// from the stored `expected`, correct it. Never touch a sample whose canonical
// errors/empties (leave it for review) so we never enshrine a stub's garbage.
//
//   node scripts/fix-explained-samples-expected.mjs --dry
//   node scripts/fix-explained-samples-expected.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,explained_samples').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }
rows = rows.filter(p => Array.isArray(p.explained_samples) && p.explained_samples.length);
console.log('problems with explained_samples:', rows.length);

let fixedProblems = 0, fixedCases = 0, skipCanon = 0; const review = [];
for (const p of rows) {
  const code = p.solutions?.python?.code;
  if (!code || !/class\s+Solution/.test(code)) { skipCanon++; continue; }
  let wrapped; try { wrapped = wrapWithDriver(code, 'python', p.method_name, p.params, p.return_type); } catch { skipCanon++; continue; }
  const next = []; let changed = 0, bad = 0;
  for (const s of p.explained_samples) {
    if (!s || !Array.isArray(s.inputs) || !s.inputs.length) { next.push(s); continue; }
    const inputs = s.inputs.map(String);
    let r; try { r = runLocal('python', wrapped, buildStdin(inputs) + '\n', { timeoutMs: 6000 }); } catch { next.push(s); bad++; continue; }
    if (!r || !r.ok) { next.push(s); bad++; continue; }
    const out = (r.stdout ?? '').replace(/\n$/, '');
    if (out === '') { next.push(s); bad++; continue; }
    const cur = s.expected === undefined || s.expected === null ? '' : String(s.expected);
    if (cur !== out) { next.push({ ...s, expected: out }); changed++; }
    else next.push(s);
  }
  if (bad > 0) review.push({ id: p.id, badCanonSamples: bad });
  if (changed > 0) {
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ explained_samples: next }).eq('id', p.id); if (error) { review.push({ id: p.id, err: error.message.slice(0, 50) }); continue; } }
    fixedProblems++; fixedCases += changed;
    if (fixedProblems <= 40) console.log(`  ${DRY ? 'would-fix' : 'FIXED'} ${p.id}: ${changed} sample expecteds corrected`);
  }
}
fs.writeFileSync('/tmp/es-expected-review.json', JSON.stringify(review, null, 2));
console.log(`\n${DRY ? 'would-fix' : 'fixed'}: ${fixedProblems} problems, ${fixedCases} sample expecteds | canon-unusable skipped: ${skipCanon} | review(bad canon runs): ${review.length}`);
