import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class TreeNode {
  constructor(val) { this.val = val; this.left = null; this.right = null; }
}

function buildTree(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  if (arr[0] == null) return null;
  const root = new TreeNode(arr[0]);
  const q = [root];
  let i = 1;
  while (q.length && i < arr.length) {
    const node = q.shift();
    if (i < arr.length) {
      const v = arr[i++];
      if (v != null) { node.left = new TreeNode(v); q.push(node.left); }
    }
    if (i < arr.length) {
      const v = arr[i++];
      if (v != null) { node.right = new TreeNode(v); q.push(node.right); }
    }
  }
  return root;
}

function stringifyArr(arr) {
  return '[' + arr.map(x => x == null ? 'null' : String(x)).join(',') + ']';
}

function goodNodes(root) {
  function dfs(node, mx) {
    if (!node) return 0;
    const cnt = node.val >= mx ? 1 : 0;
    const nextMx = Math.max(mx, node.val);
    return cnt + dfs(node.left, nextMx) + dfs(node.right, nextMx);
  }
  return dfs(root, -Infinity);
}

const inputs = [
  [3, 1, 4, 3, null, 1, 5],
  [3, 3, null, 4, 2],
  [1],
  [],
  [2, null, 4, 10, 8, null, null, 4],
  [9, null, 3, 6],
  [-1, 5, 3],
  [1, 2, 3, 4, 5, 6, 7],
  [10, 5, 15, 3, 7, 12, 18],
  [1, 1, 1, 1, 1, 1, 1],
  [5, 4, 5, 1, 1, null, 5],
  [-10, -20, -30, -5],
  [0, -1, 1, -2, -1, 0, 2],
  [100],
  [50, 25, 75, 10, 30, 60, 90],
  [7, 3, 9, 1, 5, 8, 10],
  [1, null, 2, null, 3, null, 4, null, 5],
  [5, null, 4, null, 3, null, 2, null, 1],
  [3, 1, 4, 1, null, 1, 5, null, 1],
  [10, 9, 8, 7, 6, 5, 4],
  [1, 2, 3, 4, null, null, 5, 6],
  [-5, -10, 0, -15, -7, -3, 5],
  [20, 10, 30, 5, 15, 25, 35, 1, 7, 12, 18, 22, 28, 32, 40],
  [3, 3, 3, 3, 3],
  [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13],
];

function buildCases() {
  return inputs.map((arr, i) => {
    const root = buildTree(arr.slice());
    const ans = goodNodes(root);
    return {
      inputs: [stringifyArr(arr)],
      expected: String(ans),
      sample: i < 3,
    };
  });
}

const PY_GOOD = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _build(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr):
            v = arr[i]; i += 1
            if v is not None:
                node.left = TreeNode(v); q.append(node.left)
        if i < len(arr):
            v = arr[i]; i += 1
            if v is not None:
                node.right = TreeNode(v); q.append(node.right)
    return root

class Solution:
    def goodNodes(self, root):
        if isinstance(root, list):
            root = _build(root)
        def dfs(node, mx):
            if not node:
                return 0
            cnt = 1 if node.val >= mx else 0
            nm = max(mx, node.val)
            return cnt + dfs(node.left, nm) + dfs(node.right, nm)
        return dfs(root, float('-inf'))
`;

async function reseed(slug, test_cases, python) {
  const { data: existing, error: fetchErr } = await sb
    .from('PGcode_problems')
    .select('id, solutions, test_cases')
    .eq('id', slug)
    .maybeSingle();
  if (fetchErr) { console.error(slug, fetchErr); return null; }
  if (!existing) { console.error('Not found:', slug); return null; }
  const prior = Array.isArray(existing.test_cases) ? existing.test_cases.length : 0;
  const solutions = { ...(existing.solutions || {}), python };
  const { error: upErr } = await sb
    .from('PGcode_problems')
    .update({
      test_cases,
      solutions,
      method_name: 'goodNodes',
      params: [{ name: 'root', type: 'Optional[TreeNode]' }],
      return_type: 'int',
    })
    .eq('id', slug);
  if (upErr) { console.error(slug, upErr); return null; }
  return { slug, prior, now: test_cases.length };
}

const cases = buildCases();
console.log(`count-good-nodes-in-binary-tree: ${cases.length} cases`);
for (const tc of cases) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);

const r = await reseed('count-good-nodes-in-binary-tree', cases, PY_GOOD);
console.log('\n--- Results ---');
if (r) console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
