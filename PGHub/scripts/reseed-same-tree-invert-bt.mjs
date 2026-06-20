import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------- Tree helpers ----------
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

function serializeTree(root) {
  if (!root) return [];
  const out = [];
  const q = [root];
  while (q.length) {
    const n = q.shift();
    if (!n) { out.push(null); continue; }
    out.push(n.val);
    q.push(n.left);
    q.push(n.right);
  }
  while (out.length && out[out.length - 1] == null) out.pop();
  return out;
}

function stringifyArr(arr) {
  return '[' + arr.map(x => x == null ? 'null' : String(x)).join(',') + ']';
}

function invert(root) {
  if (!root) return null;
  const tmp = root.left;
  root.left = invert(root.right);
  root.right = invert(tmp);
  return root;
}

function sameTree(p, q) {
  if (!p && !q) return true;
  if (!p || !q) return false;
  if (p.val !== q.val) return false;
  return sameTree(p.left, q.left) && sameTree(p.right, q.right);
}

// ---------- Cases ----------

// invert-binary-tree: 25 inputs. Empty case expected = "null" (driver prints "null" for None)
const invertInputs = [
  [],
  [1],
  [4, 2, 7, 1, 3, 6, 9],
  [1, 2],
  [1, null, 2],
  [1, 2, 3],
  [1, 2, null, 3, null, 4],
  [1, 2, null, 3, null, 4, null, 5],
  [1, null, 2, null, 3],
  [1, null, 2, null, 3, null, 4],
  [1, null, 2, null, 3, null, 4, null, 5],
  [1, 2, 3, 4, 5, 6, 7],
  [10, 5, 15, 3, 7, 12, 18],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [-1, -2, -3],
  [-10, -20, -30, -40, -50, -60, -70],
  [0, -1, 1],
  [5, 3, 8, 1, 4, 7, 9],
  [1, 2, 3, null, 4, null, 5],
  [1, 2, 3, 4, null, null, 5],
  [50],
  [100, 50, 150],
  [-5, -10, 0, -15, -7, -3, 5],
  [1, 2, 2, 3, 4, 4, 3],
  [9, 6, 12, 3, 7, null, 15],
];

// same-tree: 25 pairs. Expecteds as lowercase 'true' / 'false' (driver lowercases bool prints)
const sameInputs = [
  [[], []],
  [[1], [1]],
  [[1], []],
  [[], [1]],
  [[1], [2]],
  [[1, 2], [1, 2]],
  [[1, 2], [1, null, 2]],
  [[1, 2, 3], [1, 2, 3]],
  [[1, 2, 3], [1, 2, 4]],
  [[1, 2, 3], [1, 3, 2]],
  [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
  [[1, 2, 3, 4, 5], [1, 2, 3, 4, 6]],
  [[4, 2, 7, 1, 3, 6, 9], [4, 2, 7, 1, 3, 6, 9]],
  [[4, 2, 7, 1, 3, 6, 9], [4, 7, 2, 9, 6, 3, 1]],
  [[1, null, 2], [1, null, 2]],
  [[1, null, 2], [1, 2]],
  [[-1, -2, -3], [-1, -2, -3]],
  [[-1, -2, -3], [-1, -2, -4]],
  [[0], [0]],
  [[1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7]],
  [[1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 8]],
  [[10, 5, 15], [10, 5, 15]],
  [[10, 5, 15, 3, 7, 12, 18], [10, 5, 15, 3, 7, 12, 19]],
  [[1, 2, 2, 3, 4, 4, 3], [1, 2, 2, 3, 4, 4, 3]],
  [[1, 2, 2, 3, 4, 4, 3], [1, 2, 2, null, 3, null, 3]],
];

// ---------- Build test_cases ----------

function buildInvertCases() {
  return invertInputs.map((arr, i) => {
    const root = buildTree(arr.slice());
    const inverted = invert(root);
    // Empty tree case: driver prints "null" via `if res is None: print("null")`
    const expected = inverted == null ? 'null' : stringifyArr(serializeTree(inverted));
    return {
      inputs: [stringifyArr(arr)],
      expected,
      sample: i < 3,
    };
  });
}

function buildSameCases() {
  return sameInputs.map(([a, b], i) => {
    const p = buildTree(a.slice());
    const q = buildTree(b.slice());
    const eq = sameTree(p, q);
    return {
      inputs: [stringifyArr(a), stringifyArr(b)],
      expected: eq ? 'true' : 'false',
      sample: i < 3,
    };
  });
}

// ---------- Canonical Python solutions ----------

const PY_INVERT = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def invertTree(self, root):
        if not root:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
`;

const PY_SAME = `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:
    def isSameTree(self, p, q):
        if not p and not q:
            return True
        if not p or not q:
            return False
        return p.val == q.val and self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)
`;

// ---------- Apply ----------

async function reseed(slug, test_cases, python, method_name, params, return_type) {
  const { data: existing, error: fetchErr } = await sb
    .from('PGcode_problems')
    .select('id, solutions, test_cases')
    .eq('id', slug)
    .maybeSingle();
  if (fetchErr) { console.error(slug, fetchErr); return null; }
  if (!existing) { console.error('Not found:', slug); return null; }
  const prior = Array.isArray(existing.test_cases) ? existing.test_cases.length : 0;
  const solutions = { ...(existing.solutions || {}), python };
  const update = { test_cases, solutions, method_name, params, return_type };
  const { error: upErr } = await sb
    .from('PGcode_problems')
    .update(update)
    .eq('id', slug);
  if (upErr) { console.error(slug, upErr); return null; }
  return { slug, prior, now: test_cases.length };
}

const invertCases = buildInvertCases();
const sameCases = buildSameCases();

console.log(`invert-binary-tree: ${invertCases.length} cases`);
for (const tc of invertCases.slice(0, 3)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);
console.log(`same-tree: ${sameCases.length} cases`);
for (const tc of sameCases.slice(0, 3)) console.log(`  ${tc.inputs[0]} + ${tc.inputs[1]} -> ${tc.expected}`);

const r1 = await reseed(
  'invert-binary-tree',
  invertCases,
  PY_INVERT,
  'invertTree',
  [{ name: 'root', type: 'Optional[TreeNode]' }],
  'Optional[TreeNode]'
);
const r2 = await reseed(
  'same-tree',
  sameCases,
  PY_SAME,
  'isSameTree',
  [{ name: 'p', type: 'Optional[TreeNode]' }, { name: 'q', type: 'Optional[TreeNode]' }],
  'bool'
);

console.log('\n--- Results ---');
for (const r of [r1, r2]) {
  if (!r) continue;
  console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
}
