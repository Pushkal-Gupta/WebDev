// Orchestrator-side auto-migration for mistyped structural problems (no agents).
// For each mistyped problem: retype the structural param(s) to their node type
// (detected by name), run the CURRENT canonical through the real driver on the
// existing inputs, and regenerate `expected`. If the current canonical is already
// standard node-based, it produces valid output and the problem migrates for free.
// If it errors (reconstruct-from-list hack, etc.), it's left untouched and logged
// as needing a hand-written standard canonical.
//
// For has-neg1 tree inputs it also tries a `-1`->null re-encoding of the
// structural arg and keeps whichever yields more clean cases.
//
//   node scripts/auto-migrate-structural.mjs [--dry]
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
const mist = JSON.parse(fs.readFileSync('/tmp/mistyped.json', 'utf8'));

// structural param detection by name
const listNames = /^(head|l1|l2|list1|list2|lista|listb|headA|headB|a|b)$/i;
const treeNames = /^(root|tree|root1|root2|p|q|original|cloned|subRoot)$/i;
function retypeParams(params, kind) {
  return params.map((p) => {
    const t = p?.type;
    if (t !== 'List[int]' && t !== 'List[List[int]]') return p;
    if (kind === 'Node') { if (/^(root|tree)$/i.test(p.name)) return { ...p, type: 'Node' }; return p; }
    if (kind === 'ListNode' && listNames.test(p.name)) return { ...p, type: 'ListNode' };
    if (kind === 'TreeNode' && treeNames.test(p.name)) return { ...p, type: 'TreeNode' };
    return p;
  });
}
const reencodeNeg1 = (raw) => { try { const v = JSON.parse(raw); if (Array.isArray(v)) return JSON.stringify(v.map(x => x === -1 ? null : x)); } catch { /* */ } return raw; };

function regen(code, method, params, ret, cases, structIdx, useReencode) {
  let wrapped; try { wrapped = wrapWithDriver(code, 'python', method, params, ret); } catch { return null; }
  const out = []; const seen = new Set();
  for (const c of cases) {
    if (!Array.isArray(c.inputs)) continue;
    const inputs = c.inputs.map(String);
    if (useReencode && structIdx >= 0 && structIdx < inputs.length) inputs[structIdx] = reencodeNeg1(inputs[structIdx]);
    const key = JSON.stringify(inputs); if (seen.has(key)) continue;
    let r; try { r = runLocal('python', wrapped, buildStdin(inputs) + '\n', { timeoutMs: 6000 }); } catch { continue; }
    if (!r || !r.ok) continue;
    const exp = (r.stdout ?? '').replace(/\n$/, ''); if (exp === '') continue;
    seen.add(key); out.push({ inputs, expected: exp, is_sample: out.length < 2 });
  }
  return out;
}

let migrated = 0, needsRewrite = 0, cases = 0; const todo = [];
for (const m of mist) {
  const { data: p } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', m.id).single();
  if (!p) continue;
  const code = p.solutions?.python?.code; const tcs = Array.isArray(p.test_cases) ? p.test_cases : [];
  if (!code || tcs.length < 3) { needsRewrite++; todo.push(m.id); continue; }
  const newParams = retypeParams(p.params || [], m.kind);
  // also retype the return if it's a raw array and the method clearly returns the same structure
  let newRet = p.return_type;
  const structIdx = newParams.findIndex((q, i) => (p.params[i]?.type === 'List[int]' || p.params[i]?.type === 'List[List[int]]') && q.type !== p.params[i].type);
  if (structIdx < 0) { needsRewrite++; todo.push(m.id); continue; }
  // try plain, then (for has-neg1) with -1->null re-encoding; keep the better
  let best = regen(code, p.method_name, newParams, newRet, tcs, structIdx, false) || [];
  if (m.enc === 'has-neg1') { const alt = regen(code, p.method_name, newParams, newRet, tcs, structIdx, true) || []; if (alt.length > best.length) best = alt; }
  if (best.length >= 8) {
    if (!DRY) { const { error } = await sb.from('PGcode_problems').update({ params: newParams, return_type: newRet, test_cases: best }).eq('id', p.id); if (error) { console.log('  ERR', p.id, error.message.slice(0, 40)); needsRewrite++; todo.push(m.id); continue; } }
    migrated++; cases += best.length;
    if (migrated <= 60) console.log(`  ${DRY ? 'would' : 'MIGRATED'} ${p.id} [${m.kind}] ${best.length} cases`);
  } else { needsRewrite++; todo.push(m.id); }
}
fs.writeFileSync('/tmp/struct-todo.json', JSON.stringify(todo, null, 2));
console.log(`\n${DRY ? 'would-migrate' : 'migrated'}: ${migrated} | needs hand-written canonical: ${needsRewrite} (-> /tmp/struct-todo.json) | cases: ${cases}`);
