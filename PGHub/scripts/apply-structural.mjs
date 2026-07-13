// Migrate a mistyped structural problem (Invariant 1): retype the raw-array param
// to its node type (TreeNode/ListNode/Node), install a STANDARD node-based
// canonical (what a real LeetCode solution looks like), and REGENERATE every
// test case's `expected` by running that canonical through the real driver — so
// the suite is self-consistent AND a stock LeetCode solution now passes.
//
// Input JSON: { slug: { python, paramType, paramIndex?, retType?, inputs?: [[..],..] } }
//   - paramType: 'TreeNode' | 'ListNode' | 'Node' (goes on paramIndex, default 0)
//   - retType: optional, set when the RETURN is a node type too
//   - inputs: optional re-encoded inputs (needed when the stored inputs used `-1`
//     as a null marker; agent supplies null-encoded versions). If omitted, the
//     existing test-case inputs are reused.
//
//   node scripts/apply-structural.mjs --in /tmp/struct/out-0.json [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { runLocal } from './local-grade.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const IN = arg('in'); const DRY = process.argv.includes('--dry');
if (!IN) { console.error('need --in'); process.exit(1); }
const map = JSON.parse(fs.readFileSync(IN, 'utf8'));
const VALID = new Set(['TreeNode', 'ListNode', 'Node', 'Optional[TreeNode]', 'Optional[ListNode]', 'Optional[Node]', 'List[TreeNode]']);

let wrote = 0, failed = 0, totalCases = 0;
for (const slug of Object.keys(map)) {
  const e = map[slug] || {};
  let code = (e.python || '').trim();
  // Auto-wrap a bare `def method(self, ...)` (missing `class Solution:`) — the
  // driver calls Solution().method(...), so the class is required.
  if (!/class\s+Solution/.test(code) && /^\s*def\s+\w+\s*\(\s*self\b/m.test(code)) {
    code = 'class Solution:\n' + code.split('\n').map(l => '    ' + l).join('\n');
  }
  const paramIsNode = VALID.has(e.paramType);
  const retIsNode = VALID.has(e.retType);
  // Accept a migration that retypes the input param (paramType is a node) OR one
  // that only fixes the RETURN serialization (construct-tree-from-array: input
  // stays List[int], but the method returns a TreeNode -> set retType).
  if (!/class\s+Solution/.test(code) || (!paramIsNode && !retIsNode)) { console.log(`  x    ${slug}: bad canonical/paramType`); failed++; continue; }
  const { data, error } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases').eq('id', slug).single();
  if (error || !data) { console.log(`  -    ${slug}: not found`); failed++; continue; }
  // Retype ALL structural params by name (so multi-structural problems like
  // merge-two-sorted (l1,l2) or linked-list-in-binary-tree (head+root) work), not
  // just one index. `paramType` is the primary kind; a TreeNode param on a list
  // problem (or vice-versa) is retyped to its own kind by name.
  const idx = Number.isInteger(e.paramIndex) ? e.paramIndex : 0;
  const listN = /^(head|l1|l2|list1|list2|lista|listb|heada|headb)$/i;
  const treeN = /^(root|tree|root1|root2|subroot|original|cloned)$/i;
  const naryN = /^(root|tree)$/i;
  const raw = (t) => t === 'List[int]' || t === 'List[List[int]]';
  const newParams = (data.params || []).map((p, i) => {
    if (!paramIsNode) return p; // retType-only migration: don't touch inputs
    if (i === idx) return { ...p, type: e.paramType };
    if (!raw(p?.type)) return p;
    if (e.paramType === 'ListNode' && listN.test(p.name)) return { ...p, type: 'ListNode' };
    if (e.paramType === 'TreeNode' && treeN.test(p.name)) return { ...p, type: 'TreeNode' };
    if (e.paramType === 'Node' && naryN.test(p.name)) return { ...p, type: 'Node' };
    // linked-list-in-binary-tree: a head + a root, different kinds
    if (listN.test(p.name)) return { ...p, type: 'ListNode' };
    if (treeN.test(p.name) && e.paramType !== 'Node') return { ...p, type: 'TreeNode' };
    return p;
  });
  const newRet = e.retType && VALID.has(e.retType) ? e.retType : data.return_type;
  let wrapped; try { wrapped = wrapWithDriver(code, 'python', data.method_name, newParams, newRet); } catch (err) { console.log(`  x    ${slug}: wrap ${err.message.slice(0, 40)}`); failed++; continue; }

  // candidate inputs: agent-supplied re-encoded tuples, else existing case inputs
  const cand = Array.isArray(e.inputs) && e.inputs.length ? e.inputs : (data.test_cases || []).map(c => c.inputs).filter(Array.isArray);
  const seen = new Set(); const cases = [];
  for (const tuple of cand) {
    if (!Array.isArray(tuple)) continue;
    const inputs = tuple.map(String); const key = JSON.stringify(inputs); if (seen.has(key)) continue;
    let r; try { r = runLocal('python', wrapped, buildStdin(inputs) + '\n', { timeoutMs: 6000 }); } catch { continue; }
    if (!r || !r.ok) continue;
    const expected = (r.stdout ?? '').replace(/\n$/, ''); if (expected === '') continue;
    seen.add(key); cases.push({ inputs, expected, is_sample: cases.length < 2 });
  }
  // Fallback for has-neg1 problems: the agent only re-encoded the sample inputs,
  // so we ran short. Re-encode ALL of the problem's existing inputs (-1 -> null on
  // the retyped structural param) and regenerate from those to recover full depth.
  if (cases.length < 8) {
    const structIdx = (data.params || []).findIndex((q, i) => i === idx);
    const reenc = (raw) => { try { const v = JSON.parse(raw); if (Array.isArray(v)) return JSON.stringify(v.map(x => x === -1 ? null : x)); } catch { /* */ } return raw; };
    for (const c of (data.test_cases || [])) {
      if (cases.length >= 60) break;
      if (!Array.isArray(c.inputs)) continue;
      const inputs = c.inputs.map(String);
      if (structIdx >= 0 && structIdx < inputs.length) inputs[structIdx] = reenc(inputs[structIdx]);
      const key = JSON.stringify(inputs); if (seen.has(key)) continue;
      let r; try { r = runLocal('python', wrapped, buildStdin(inputs) + '\n', { timeoutMs: 6000 }); } catch { continue; }
      if (!r || !r.ok) continue;
      const expected = (r.stdout ?? '').replace(/\n$/, ''); if (expected === '') continue;
      seen.add(key); cases.push({ inputs, expected, is_sample: cases.length < 2 });
    }
  }
  // Generate more inputs when the problem has ONLY the structural param and we
  // ran short (many list/tree problems ship with <8 cases). Random valid
  // structures; the canonical defines their expected. Only for single-param
  // problems so we never fabricate an out-of-domain value for a sibling param.
  if (cases.length < 12 && newParams.length === 1) {
    let s = 0x9e3779b9; const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const genList = () => { const n = ri(0, 16); return JSON.stringify(Array.from({ length: n }, () => ri(-1000, 1000))); };
    const genTree = () => { const n = ri(1, 15); return JSON.stringify(Array.from({ length: n }, (_, i) => (i > 0 && rnd() < 0.25) ? null : ri(-100, 100))); };
    const genIntArr = () => { const n = ri(1, 14); return JSON.stringify(Array.from({ length: n }, () => ri(-100, 100))); };
    // node-param -> random structure; List[int]-input construct-from-array -> random int array
    const gen = paramIsNode
      ? (e.paramType === 'ListNode' ? genList : (e.paramType === 'TreeNode' ? genTree : null))
      : (newParams[0].type === 'List[int]' ? genIntArr : null);
    for (let attempt = 0; gen && cases.length < 30 && attempt < 200; attempt++) {
      const inputs = [gen()]; const key = JSON.stringify(inputs); if (seen.has(key)) continue;
      let r; try { r = runLocal('python', wrapped, buildStdin(inputs) + '\n', { timeoutMs: 6000 }); } catch { continue; }
      if (!r || !r.ok) continue;
      const expected = (r.stdout ?? '').replace(/\n$/, ''); if (expected === '') continue;
      seen.add(key); cases.push({ inputs, expected, is_sample: cases.length < 2 });
    }
  }
  if (cases.length < 8) { console.log(`  x    ${slug}: only ${cases.length} clean cases (canonical/type wrong?)`); failed++; continue; }
  // Safety: the new standard canonical must AGREE with the old (validated)
  // expecteds on shared inputs — otherwise the new canonical is wrong. Skip this
  // when the agent re-encoded inputs (-1->null), since keys won't match.
  if (!process.argv.includes('--no-verify') && (!Array.isArray(e.inputs) || !e.inputs.length)) {
    const norm = (s) => { try { return JSON.stringify(JSON.parse(s)); } catch { return String(s ?? '').trim().replace(/\s+/g, ''); } };
    const oldMap = new Map();
    for (const c of (data.test_cases || [])) if (Array.isArray(c.inputs)) oldMap.set(JSON.stringify(c.inputs.map(String)), c.expected);
    let shared = 0, diverge = 0;
    for (const c of cases) { const k = JSON.stringify(c.inputs); if (oldMap.has(k)) { shared++; if (norm(c.expected) !== norm(oldMap.get(k))) diverge++; } }
    if (shared >= 4 && diverge / shared > 0.3) { console.log(`  !    ${slug}: NEW canonical diverges from old on ${diverge}/${shared} shared cases — likely wrong, SKIPPED`); failed++; continue; }
  }
  const sol = { ...(data.solutions || {}) }; sol.python = { ...(sol.python || {}), code };
  if (!DRY) { const { error: uerr } = await sb.from('PGcode_problems').update({ params: newParams, return_type: newRet, solutions: sol, test_cases: cases }).eq('id', slug); if (uerr) { console.log(`  ERR  ${slug}: ${uerr.message.slice(0, 40)}`); failed++; continue; } }
  wrote++; totalCases += cases.length;
  console.log(`  WROTE ${slug}: ${data.params?.[idx]?.type}->${e.paramType}${newRet !== data.return_type ? ' ret->' + newRet : ''}, ${cases.length} graded cases`);
}
console.log(`\n${DRY ? 'would-write' : 'wrote'}: ${wrote} | failed: ${failed} | cases: ${totalCases}`);
