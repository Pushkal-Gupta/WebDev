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

// Mirror harness _from_tree: BFS including null markers, trim trailing nulls
function fromTree(root) {
  if (!root) return [];
  const out = [];
  const q = [root];
  while (q.length) {
    const n = q.shift();
    if (n === null) { out.push(null); continue; }
    out.push(n.val);
    q.push(n.left); q.push(n.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

function stringifyArr(arr) {
  return '[' + arr.map(x => x == null ? 'null' : String(x)).join(',') + ']';
}

// Compact JSON like Python json.dumps(separators=(',',':')) and outputsEqual normalize
function jsonOut(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return '[' + v.map(jsonOut).join(',') + ']';
  return JSON.stringify(v);
}

// ====================== delete-node-in-a-bst ======================

function deleteNode(root, key) {
  if (!root) return null;
  if (key < root.val) root.left = deleteNode(root.left, key);
  else if (key > root.val) root.right = deleteNode(root.right, key);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let t = root.right;
    while (t.left) t = t.left;
    root.val = t.val;
    root.right = deleteNode(root.right, t.val);
  }
  return root;
}

const DELETE_INPUTS = [
  { arr: [5,3,6,2,4,null,7], key: 3 },
  { arr: [5,3,6,2,4,null,7], key: 0 },
  { arr: [], key: 0 },
  { arr: [0], key: 0 },
  { arr: [1], key: 0 },
  { arr: [2,1,3], key: 2 },
  { arr: [4,2,7,1,3,6,9], key: 4 },
  { arr: [4,2,7,1,3,6,9], key: 7 },
  { arr: [4,2,7,1,3,6,9], key: 1 },
  { arr: [4,2,7,1,3,6,9], key: 9 },
  { arr: [10,5,15,3,7,12,18], key: 5 },
  { arr: [10,5,15,3,7,12,18], key: 15 },
  { arr: [10,5,15,3,7,12,18], key: 10 },
  { arr: [50,30,70,20,40,60,80], key: 50 },
  { arr: [50,30,70,20,40,60,80], key: 30 },
  { arr: [50,30,70,20,40,60,80], key: 100 },
  { arr: [8,3,10,1,6,null,14,null,null,4,7,13], key: 6 },
  { arr: [8,3,10,1,6,null,14,null,null,4,7,13], key: 3 },
  { arr: [8,3,10,1,6,null,14,null,null,4,7,13], key: 14 },
  { arr: [1,null,2], key: 1 },
  { arr: [2,1], key: 2 },
  { arr: [-5,-10,0,-15,-7,-3,5], key: -10 },
  { arr: [-5,-10,0,-15,-7,-3,5], key: 0 },
  { arr: [20,10,30,5,15,25,35], key: 20 },
  { arr: [20,10,30,5,15,25,35], key: 30 },
];

function buildDeleteCases() {
  return DELETE_INPUTS.map(({ arr, key }, i) => {
    const root = buildTree(arr.slice());
    const result = deleteNode(root, key);
    // Mirror harness: if res is None -> "null"; if TreeNode -> _from_tree then JSON dump
    const expected = result === null ? 'null' : jsonOut(fromTree(result));
    return {
      inputs: [stringifyArr(arr), String(key)],
      expected,
      sample: i < 3,
    };
  });
}

const PY_DELETE = `class Solution:
    def deleteNode(self, root, key):
        if not root:
            return None
        if key < root.val:
            root.left = self.deleteNode(root.left, key)
        elif key > root.val:
            root.right = self.deleteNode(root.right, key)
        else:
            if not root.left:
                return root.right
            if not root.right:
                return root.left
            t = root.right
            while t.left:
                t = t.left
            root.val = t.val
            root.right = self.deleteNode(root.right, t.val)
        return root
`;

// ====================== count-good-nodes-in-binary-tree ======================

function goodNodes(root) {
  if (!root) return 0;
  const stack = [[root, root.val]];
  let cnt = 0;
  while (stack.length) {
    const [node, mx] = stack.pop();
    if (node.val >= mx) cnt++;
    const nm = Math.max(mx, node.val);
    if (node.left) stack.push([node.left, nm]);
    if (node.right) stack.push([node.right, nm]);
  }
  return cnt;
}

const GOOD_INPUTS = [
  [3, 1, 4, 3, null, 1, 5],
  [3, 3, null, 4, 2],
  [1],
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
  [42, 17, 55, 8, 25, 50, 80],
];

function buildGoodCases() {
  return GOOD_INPUTS.map((arr, i) => {
    const root = buildTree(arr.slice());
    const ans = goodNodes(root);
    return {
      inputs: [stringifyArr(arr)],
      expected: String(ans),
      sample: i < 3,
    };
  });
}

const PY_GOOD = `class Solution:
    def goodNodes(self, root):
        if not root:
            return 0
        stack = [(root, root.val)]
        cnt = 0
        while stack:
            node, mx = stack.pop()
            if node.val >= mx:
                cnt += 1
            nm = mx if mx > node.val else node.val
            if node.left:
                stack.append((node.left, nm))
            if node.right:
                stack.append((node.right, nm))
        return cnt
`;

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
  const { error: upErr } = await sb
    .from('PGcode_problems')
    .update({ test_cases, solutions, method_name, params, return_type })
    .eq('id', slug);
  if (upErr) { console.error(slug, upErr); return null; }
  return { slug, prior, now: test_cases.length };
}

const deleteCases = buildDeleteCases();
console.log(`\ndelete-node-in-a-bst: ${deleteCases.length} cases`);
for (const tc of deleteCases) console.log(`  ${tc.inputs[0]}, key=${tc.inputs[1]} -> ${tc.expected}`);

const goodCases = buildGoodCases();
console.log(`\ncount-good-nodes-in-binary-tree: ${goodCases.length} cases`);
for (const tc of goodCases) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);

const r1 = await reseed(
  'delete-node-in-a-bst',
  deleteCases,
  PY_DELETE,
  'deleteNode',
  [{ name: 'root', type: 'Optional[TreeNode]' }, { name: 'key', type: 'int' }],
  'Optional[TreeNode]',
);
const r2 = await reseed(
  'count-good-nodes-in-binary-tree',
  goodCases,
  PY_GOOD,
  'goodNodes',
  [{ name: 'root', type: 'Optional[TreeNode]' }],
  'int',
);

console.log('\n--- Results ---');
if (r1) console.log(`${r1.slug}: prior=${r1.prior}, now=${r1.now}`);
if (r2) console.log(`${r2.slug}: prior=${r2.prior}, now=${r2.now}`);
