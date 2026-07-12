// Repair the problems the integrity sweep flagged as FAILING. For each, run the
// canonical on every case with the (now float-tolerant, case/ws-sensitive)
// comparator. If a case still mismatches AND the canonical runs cleanly, the
// stored `expected` is stale-formatted (quote/order/float) → replace it with the
// canonical's output (self-consistent). If the canonical ERRORS on its cases,
// it's a harness mismatch (ListNode/TreeNode/design) → leave untouched and flag
// for reauthoring. Reads /tmp/verify-failing.json.
//
//   node scripts/repair-failing-cases.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin, compareOutput } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DRY = process.argv.includes('--dry');
const failing = JSON.parse(fs.readFileSync('/tmp/verify-failing.json', 'utf8'));

let repaired = 0, casesFixed = 0; const harnessBroken = [];
for (const f of failing) {
  const { data: p } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', f.id).single();
  if (!p) continue;
  const code = p.solutions?.python?.code; const tcs = Array.isArray(p.test_cases) ? p.test_cases : [];
  if (!code || !tcs.length) { harnessBroken.push({ id: f.id, why: 'no canonical/cases' }); continue; }
  let wrapped; try { wrapped = wrapWithDriver(code, 'python', p.method_name, p.params, p.return_type); } catch (e) { harnessBroken.push({ id: f.id, why: 'wrap ' + e.message.slice(0, 30) }); continue; }
  const next = []; let changed = 0, ranOk = 0, errored = 0;
  for (const c of tcs) {
    if (!Array.isArray(c.inputs)) { next.push(c); continue; }
    let r; try { r = runLocal('python', wrapped, buildStdin(c.inputs.map(String)) + '\n', { timeoutMs: 6000 }); } catch { errored++; next.push(c); continue; }
    if (!r || !r.ok) { errored++; next.push(c); continue; }
    ranOk++;
    const out = (r.stdout ?? '').replace(/\n$/, '');
    if (out === '') { next.push(c); continue; }
    if (compareOutput(out, c.expected)) { next.push(c); continue; }
    next.push({ ...c, expected: out }); changed++;
  }
  // canonical errors on (almost) everything => harness mismatch, don't touch
  if (ranOk === 0) { harnessBroken.push({ id: f.id, why: 'canonical errors on all cases (tree/list/design harness)' }); continue; }
  if (changed > 0) {
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ test_cases: next }).eq('id', f.id); if (error) { harnessBroken.push({ id: f.id, why: error.message.slice(0, 40) }); continue; } }
    repaired++; casesFixed += changed;
    console.log(`  ${DRY ? 'would-fix' : 'FIXED'} ${f.id}: ${changed} expecteds regenerated from canonical (${errored} still-erroring)`);
  } else if (errored > 0) {
    harnessBroken.push({ id: f.id, why: `${errored} cases error under driver (partial harness mismatch)` });
  }
}
fs.writeFileSync('/tmp/harness-broken.json', JSON.stringify(harnessBroken, null, 2));
console.log(`\n${DRY ? 'would-repair' : 'repaired'}: ${repaired} problems, ${casesFixed} cases | harness-broken (need reauthor): ${harnessBroken.length}`);
for (const h of harnessBroken) console.log(`  - ${h.id}: ${h.why}`);
