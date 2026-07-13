// Guard for GRADING_HARNESS_INVARIANTS.md Invariant 1: a param that is
// semantically a binary tree / linked list / n-ary tree MUST be typed
// TreeNode/ListNode/Node so the driver reconstructs the object, not passed as a
// raw List[int] array. Flags every problem whose CANONICAL clearly manipulates a
// node object (.left/.right, .next, .children) while the matching param is a raw
// array. Also reports the null encoding of the first input (null vs -1) so the
// migration knows whether inputs need re-encoding before retyping.
//
//   node scripts/audit-structural-types.mjs            # report
//   node scripts/audit-structural-types.mjs --json     # write /tmp/mistyped.json
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RAW = new Set(['List[int]', 'List[List[int]]']);

let from = 0, rows = [];
while (true) { const { data } = await sb.from('PGcode_problems').select('id,method_name,params,return_type,solutions,test_cases,description').range(from, from + 999); if (!data || !data.length) break; rows = rows.concat(data); if (data.length < 1000) break; from += 1000; }

const mistyped = [];
for (const p of rows) {
  const params = Array.isArray(p.params) ? p.params : [];
  const code = p.solutions?.python?.code || '';
  const desc = (p.description || '').replace(/<[^>]+>/g, ' ');
  // signal the canonical treats the first param as a node object, OR the problem
  // is clearly a tree/list problem by description (catches reauthored canonicals
  // that reconstruct-from-list and so lack node-access patterns, e.g. invert-tree).
  const p0 = (params[0]?.name || '').toLowerCase();
  const treeSig = /\broot\.(left|right|val)\b|\bTreeNode\b|def\s+\w+\(self,\s*root/.test(code) || (/binary tree|\bBST\b|binary search tree|root of a/i.test(desc) && (p0 === 'root' || p0 === 'tree'));
  const listSig = /\bhead\.next\b|\bListNode\b|def\s+\w+\(self,\s*(head|l1|l2|list1|list2)/.test(code) || (/linked[- ]list/i.test(desc) && /^(head|l1|l2|list1|list2)$/.test(p0));
  const narySig = /\.children\b|def\s+\w+\(self,\s*root:\s*'?Node'?/.test(code) || (/n-ary/i.test(desc) && (p0 === 'root' || p0 === 'tree'));
  const firstRaw = params[0] && RAW.has(params[0].type);
  if (!firstRaw) continue;
  // Cycled-list problems grade via the driver's _to_list_cycle path (params
  // [values/head/nodes:List[int], pos:int] collapse into one cyclic head), so a
  // raw List[int] first param is CORRECT here — not a mistype.
  if (params.length === 2 && /^(values|head|nodes|list)$/.test((params[0]?.name || '')) && params[1]?.type === 'int' && params[1]?.name === 'pos') continue;
  // Construct-from-array (buildTree, sortedArrayToBST, maximumBinaryTree, …): the
  // INPUT is a genuine array and only the RETURN is a node — correctly handled by
  // setting return_type to the node type. Not a mistyped input.
  if (['TreeNode', 'ListNode', 'Node', 'Optional[TreeNode]', 'Optional[ListNode]', 'Optional[Node]'].includes(p.return_type)) continue;
  let kind = null;
  if (narySig) kind = 'Node';
  else if (treeSig) kind = 'TreeNode';
  else if (listSig) kind = 'ListNode';
  if (!kind) continue;
  const inp0 = (p.test_cases || [])[0]?.inputs?.[0] || '';
  const enc = /null/.test(inp0) ? 'null' : (/-1/.test(inp0) ? 'has-neg1' : 'no-null');
  mistyped.push({ id: p.id, kind, curType: params[0].type, enc });
}
mistyped.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
const byKind = k => mistyped.filter(m => m.kind === k);
console.log('MISTYPED structural params (should be node type, currently raw array):', mistyped.length);
for (const k of ['TreeNode', 'ListNode', 'Node']) {
  const g = byKind(k);
  const nullEnc = g.filter(m => m.enc === 'null').length;
  console.log(`  ${k}: ${g.length}  (null-encoded ${nullEnc}, has-neg1 ${g.filter(m => m.enc === 'has-neg1').length}, no-null ${g.filter(m => m.enc === 'no-null').length})`);
}
if (process.argv.includes('--json')) { fs.writeFileSync('/tmp/mistyped.json', JSON.stringify(mistyped, null, 2)); console.log('-> /tmp/mistyped.json'); }
if (mistyped.length === 0) console.log('OK — no mistyped structural params.');
