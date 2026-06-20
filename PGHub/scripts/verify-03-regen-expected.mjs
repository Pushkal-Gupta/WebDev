#!/usr/bin/env node
// Regenerate `expected` for all test cases of given problem IDs by actually
// running the canonical Python solution against each input. Eliminates further
// iteration on problems where authors hand-guessed expected values.

import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const TARGETS = process.argv.slice(2);
if (!TARGETS.length) {
  console.error('Usage: node scripts/verify-03-regen-expected.mjs <problem-id> [<problem-id>...]');
  process.exit(1);
}

function dbQuery(sql) {
  const r = spawnSync('supabase', ['db', 'query', '--linked', sql], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  const o = r.stdout;
  return JSON.parse(o.slice(o.indexOf('{'), o.lastIndexOf('}') + 1));
}

const PY_HELPERS = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val; self.next = next
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right
def _to_list(arr):
    if not arr: return None
    h = ListNode(arr[0]); c = h
    for v in arr[1:]: c.next = ListNode(v); c = c.next
    return h
def _from_list(h):
    r = []
    while h: r.append(h.val); h = h.next
    return r
def _to_tree(arr):
    if not arr: return None
    root = TreeNode(arr[0]); q = [root]; i = 1
    while q and i < len(arr):
        n = q.pop(0)
        if i < len(arr) and arr[i] is not None: n.left = TreeNode(arr[i]); q.append(n.left)
        i += 1
        if i < len(arr) and arr[i] is not None: n.right = TreeNode(arr[i]); q.append(n.right)
        i += 1
    return root
def _from_tree(root):
    if not root: return []
    r = []; q = [root]
    while q:
        n = q.pop(0)
        if n is None: r.append(None)
        else: r.append(n.val); q.append(n.left); q.append(n.right)
    while r and r[-1] is None: r.pop()
    return r
`;

const isLN = (t) => t === 'ListNode' || t === 'Optional[ListNode]';
const isTN = (t) => t === 'TreeNode' || t === 'Optional[TreeNode]';

function wrap(code, m, params, rt) {
  const args = (params || []).map(p => p.name).join(', ');
  const parsing = (params || []).map((p, i) => {
    if (isLN(p.type)) return `${p.name} = _to_list(json.loads(_lines[${i}]))`;
    if (isTN(p.type)) return `${p.name} = _to_tree(json.loads(_lines[${i}]))`;
    return `${p.name} = json.loads(_lines[${i}])`;
  }).join('\n');
  let outBlock;
  if (isLN(rt)) outBlock = 'print(json.dumps(_from_list(_result)))';
  else if (isTN(rt)) outBlock = 'print(json.dumps(_from_tree(_result)))';
  else outBlock = 'if isinstance(_result, bool):\n    print(str(_result).lower())\nelif _result is None:\n    print("null")\nelse:\n    print(json.dumps(_result))';
  return ['import sys, json', 'from typing import List, Optional, Dict, Tuple, Set', PY_HELPERS, code, '', '_lines = sys.stdin.read().strip().split("\\n")', parsing, '_sol = Solution()', `_result = _sol.${m}(${args})`, outBlock].join('\n');
}

function runPy(code, stdin) {
  return new Promise((res) => {
    const p = spawn('python3', ['-c', code]);
    let o = '', e = '';
    p.stdout.on('data', d => o += d);
    p.stderr.on('data', d => e += d);
    p.on('close', (c) => res({ out: o, err: e, code: c }));
    p.stdin.write(stdin); p.stdin.end();
  });
}

const sql = `SELECT p.id, p.method_name, p.params, p.return_type, p.test_cases,
   (SELECT code_python FROM public."PGcode_solution_approaches" sa WHERE sa.problem_id = p.id ORDER BY approach_number LIMIT 1) AS code_python
   FROM public."PGcode_problems" p WHERE p.id IN (${TARGETS.map(t => `'${t}'`).join(',')});`;
const { rows } = dbQuery(sql);

const out = ['-- Auto-regenerated expected outputs', 'BEGIN;', ''];
for (const p of rows) {
  console.error(`[${p.id}] ${p.test_cases.length} cases`);
  const code = wrap(p.code_python, p.method_name, p.params, p.return_type);
  const newCases = [];
  for (const tc of p.test_cases) {
    const r = await runPy(code, (tc.inputs || []).join('\n'));
    if (r.code !== 0) {
      console.error(`  ERR: ${r.err.slice(0, 200)}`);
      newCases.push(tc);
      continue;
    }
    newCases.push({ inputs: tc.inputs, expected: r.out.trim() });
  }
  out.push(`-- ${p.id}: ${newCases.length} cases regenerated`);
  out.push(`UPDATE public."PGcode_problems" SET test_cases = '${JSON.stringify(newCases).replace(/'/g, "''")}'::jsonb WHERE id = '${p.id}';`);
  out.push('');
}
out.push('COMMIT;');

writeFileSync('scripts/fix-04-round4.sql', out.join('\n') + '\n');
console.error('Wrote scripts/fix-04-round4.sql');
