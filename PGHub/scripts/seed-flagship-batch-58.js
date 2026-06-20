#!/usr/bin/env node
// Batch 58: BST + tree heavies.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const FLAGSHIPS = [
  {
    id: 'validate-bst',
    method_name: 'isValidBST',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Pass running (lo, hi) bounds through recursion.',
      'At each node: val must satisfy lo < val < hi. Else false.',
      'Recurse left with (lo, val); right with (val, hi).',
      'Empty subtree → true.',
      'Iterative in-order: every successive value must be strictly increasing.',
    ],
    tags: ['tree', 'bst', 'dfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 10^4\n-2^31 ≤ Node.val ≤ 2^31 − 1',
    follow_up: 'Recover BST — two nodes were swapped; restore them. Morris in-order in O(1) space.',
    pattern: 'dfs-with-bounds',
    test_cases: [
      { inputs: ['[2,1,3]'], expected: 'true' },
      { inputs: ['[5,1,4,null,null,3,6]'], expected: 'false' },
      { inputs: ['[]'], expected: 'true' },
      { inputs: ['[1]'], expected: 'true' },
      { inputs: ['[1,1]'], expected: 'false' },
      { inputs: ['[1,2]'], expected: 'false' },
      { inputs: ['[2,1]'], expected: 'true' },
      { inputs: ['[5,4,6,null,null,3,7]'], expected: 'false' },
      { inputs: ['[2147483647]'], expected: 'true' },
      { inputs: ['[-2147483648,null,2147483647]'], expected: 'true' },
    ],
  },
  {
    id: 'diameter-binary-tree',
    method_name: 'diameterOfBinaryTree',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'For each node, longest path through it = left depth + right depth.',
      'Global answer = max over all nodes.',
      'Single DFS: return depth; update answer using L + R.',
      'Empty subtree depth = 0.',
      'O(n) time, O(h) recursion.',
    ],
    tags: ['tree', 'dfs', 'recursion'],
    constraints: '1 ≤ nodes ≤ 10^4\n-100 ≤ Node.val ≤ 100',
    follow_up: 'Diameter weighted by edge values — track sum, not count.',
    pattern: 'dfs-postorder-with-side-effect',
    test_cases: [
      { inputs: ['[1,2,3,4,5]'], expected: '3' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,2,3]'], expected: '2' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '4' },
      { inputs: ['[4,-7,-3,null,null,-9,-3,9,-7,-4,null,6,null,-6,-6,null,null,0,6,5,null,9,null,null,-1,-4,null,null,null,-2]'], expected: '8' },
      { inputs: ['[1,null,2,null,3,null,4]'], expected: '3' },
    ],
  },
  {
    id: 'kth-smallest-bst',
    method_name: 'kthSmallest',
    params: [{ name: 'root', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'In-order traversal of a BST yields sorted values.',
      'Iterative: push left spine; pop; decrement k; if k==0 return val. Else push right and continue.',
      'Recursive variant with a counter.',
      'Morris traversal: O(1) extra space.',
      'O(h + k) — early exit.',
    ],
    tags: ['tree', 'bst', 'dfs', 'in-order'],
    constraints: '1 ≤ k ≤ n ≤ 10^4\n0 ≤ Node.val ≤ 10^4',
    follow_up: 'Frequent updates — augment with subtree size; O(log n) per query.',
    pattern: 'inorder-counter',
    test_cases: [
      { inputs: ['[3,1,4,null,2]', '1'], expected: '1' },
      { inputs: ['[5,3,6,2,4,null,null,1]', '3'], expected: '3' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[2,1,3]', '2'], expected: '2' },
      { inputs: ['[2,1,3]', '3'], expected: '3' },
      { inputs: ['[5,3,6,2,4,null,null,1]', '6'], expected: '6' },
      { inputs: ['[5,3,6,2,4,null,null,1]', '1'], expected: '1' },
      { inputs: ['[10,5,15,3,7,12,20]', '4'], expected: '10' },
    ],
  },
  {
    id: 'invert-tree',
    method_name: 'invertTree',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Recursive: swap children at each node, then recurse.',
      'Or iterative BFS: pop, swap children, enqueue both.',
      'Both O(n) time, O(h) or O(w) space.',
      'Empty subtree → null/empty.',
      'Famously the "Homebrew interview" problem.',
    ],
    tags: ['tree', 'dfs', 'bfs'],
    constraints: '0 ≤ nodes ≤ 100\n-100 ≤ Node.val ≤ 100',
    follow_up: 'Mirror-equality check — recurse left.left vs right.right and left.right vs right.left.',
    pattern: 'recursive-tree-transform',
    test_cases: [
      { inputs: ['[4,2,7,1,3,6,9]'], expected: '[4,7,2,9,6,3,1]' },
      { inputs: ['[2,1,3]'], expected: '[2,3,1]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,null,2]' },
      { inputs: ['[1,null,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3,4]'], expected: '[1,3,2,null,null,null,4]' },
    ],
  },
  {
    id: 'flatten-tree',
    method_name: 'flatten',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Pre-order traversal: root, left-flatten, right-flatten.',
      'Recursive post-order: flatten right (returns last), flatten left (returns last). Connect node.right = left.head, last(left).right = right.head, set left=null.',
      'Iterative: at each node, if left exists, find rightmost of left subtree, attach current right to it; set node.right = node.left; node.left = null. Move to node.right.',
      'O(n) time, O(1) extra with iterative pointer chase.',
      'Result is a "linked-list" tree: all left pointers null, right is the pre-order successor.',
    ],
    tags: ['tree', 'dfs', 'linked-list'],
    constraints: '0 ≤ nodes ≤ 2000\n-1000 ≤ Node.val ≤ 1000',
    follow_up: 'Flatten to a DOUBLY-linked list — keep left as predecessor.',
    pattern: 'right-side-rotate-traversal',
    test_cases: [
      { inputs: ['[1,2,5,3,4,null,6]'], expected: '[1,null,2,null,3,null,4,null,5,null,6]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[0]'], expected: '[0]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,null,2]' },
      { inputs: ['[1,null,2]'], expected: '[1,null,2]' },
      { inputs: ['[1,2,3]'], expected: '[1,null,2,null,3]' },
    ],
  },
];

let updated = 0;
for (const f of FLAGSHIPS) {
  const { data: existing } = await sb.from('PGcode_problems').select('*').eq('id', f.id).maybeSingle();
  if (!existing) { console.log(`  SKIP ${f.id} (not in DB)`); continue; }
  const row = {
    id: f.id,
    name: existing.name,
    topic_id: existing.topic_id,
    difficulty: existing.difficulty,
    description: existing.description,
    roadmap_set: existing.roadmap_set || '100',
    method_name: f.method_name,
    params: f.params,
    return_type: f.return_type,
    hints: f.hints,
    tags: f.tags,
    constraints: f.constraints,
    follow_up: f.follow_up,
    pattern: f.pattern,
    test_cases: f.test_cases,
  };
  const { error } = await sb.from('PGcode_problems').upsert(row, { onConflict: 'id' });
  if (error) { console.error(`  ERROR ${f.id}: ${error.message}`); continue; }
  console.log(`  ${f.id}  - ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
