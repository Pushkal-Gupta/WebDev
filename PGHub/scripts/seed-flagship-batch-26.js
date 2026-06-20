#!/usr/bin/env node
// Batch 26: tree fundamentals — same, invert, depths, balanced, subtree.

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
    id: 'same-tree',
    method_name: 'isSameTree',
    params: [{ name: 'p', type: 'List[int]' }, { name: 'q', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Two trees are the same iff (both null) OR (both non-null AND vals equal AND left subtrees same AND right subtrees same).',
      'Recursive solution is a single line.',
      'Iterative: BFS or DFS with paired queue/stack; compare positions, push nulls too.',
      'O(min(m, n)) time — short-circuits on first mismatch.',
      'O(h) recursion or O(w) BFS queue.',
    ],
    tags: ['tree', 'dfs', 'bfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 100\n-10^4 ≤ Node.val ≤ 10^4',
    follow_up: 'What if structure equality is enough (values can differ)? Same algorithm without the val check.',
    pattern: 'parallel-recursion',
    test_cases: [
      { inputs: ['[1,2,3]', '[1,2,3]'], expected: 'true' },
      { inputs: ['[1,2]', '[1,null,2]'], expected: 'false' },
      { inputs: ['[1,2,1]', '[1,1,2]'], expected: 'false' },
      { inputs: ['[]', '[]'], expected: 'true' },
      { inputs: ['[1]', '[]'], expected: 'false' },
      { inputs: ['[]', '[1]'], expected: 'false' },
      { inputs: ['[1]', '[1]'], expected: 'true' },
      { inputs: ['[1]', '[2]'], expected: 'false' },
      { inputs: ['[1,2,3,4,5]', '[1,2,3,4,5]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5]', '[1,2,3,4,6]'], expected: 'false' },
      { inputs: ['[5,3,7,2,4,6,8]', '[5,3,7,2,4,6,8]'], expected: 'true' },
      { inputs: ['[5,3,7,2,4,6,8]', '[5,3,7,2,4,6,9]'], expected: 'false' },
      { inputs: ['[1,null,2]', '[1,2]'], expected: 'false' },
    ],
  },
  {
    id: 'invert-binary-tree',
    method_name: 'invertTree',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Swap left and right children at every node.',
      'Recursive: at each node, swap children, recurse on both.',
      'Iterative: BFS with a queue; for each dequeued node, swap and enqueue both children.',
      'O(n) time, O(h) recursion or O(w) for BFS.',
      'Famous interview question — "Homebrew creator couldn\'t invert a binary tree" tweet.',
    ],
    tags: ['tree', 'dfs', 'bfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 100\n-100 ≤ Node.val ≤ 100',
    follow_up: 'In-order traversal of an inverted BST gives reverse sorted order.',
    pattern: 'tree-swap-recursion',
    test_cases: [
      { inputs: ['[4,2,7,1,3,6,9]'], expected: '[4,7,2,9,6,3,1]' },
      { inputs: ['[2,1,3]'], expected: '[2,3,1]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,null,2]' },
      { inputs: ['[1,null,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3]'], expected: '[1,3,2]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[1,3,2,7,6,5,4]' },
      { inputs: ['[10,5,15,3,7,12,20]'], expected: '[10,15,5,20,12,7,3]' },
      { inputs: ['[1,2,3,4,5,null,6]'], expected: '[1,3,2,6,null,5,4]' },
    ],
  },
  {
    id: 'max-depth-binary-tree',
    method_name: 'maxDepth',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'maxDepth(node) = 1 + max(maxDepth(left), maxDepth(right)) for non-null.',
      'Base: null → 0.',
      'BFS: level-by-level, return the last level seen.',
      'O(n) time, O(h) recursion (O(n) worst-case for skewed trees).',
      'Single-line recursive solution in most languages.',
    ],
    tags: ['tree', 'dfs', 'bfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 10^4\n-100 ≤ Node.val ≤ 100',
    follow_up: '"Minimum Depth of Binary Tree" — but ONLY count paths that end at a LEAF. Subtle nullable-child edge case.',
    pattern: 'tree-postorder-max',
    test_cases: [
      { inputs: ['[3,9,20,null,null,15,7]'], expected: '3' },
      { inputs: ['[1,null,2]'], expected: '2' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '2' },
      { inputs: ['[1,2,3]'], expected: '2' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '3' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]'], expected: '4' },
      { inputs: ['[1,null,2,null,3,null,4]'], expected: '4' },
      { inputs: ['[1,2,null,3,null,4,null,5]'], expected: '5' },
      { inputs: ['[10,5,15,3,7,12,20]'], expected: '3' },
    ],
  },
  {
    id: 'balanced-binary-tree',
    method_name: 'isBalanced',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Balanced = for every node, |height(left) − height(right)| ≤ 1.',
      'Naive O(n²): compute height at every node + check the diff.',
      'O(n): bottom-up DFS returning height. Early-exit by returning -1 on imbalance, propagating up.',
      'If any subtree returns -1, the whole tree is unbalanced.',
      'O(n) time, O(h) recursion.',
    ],
    tags: ['tree', 'dfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 5000\n-10^4 ≤ Node.val ≤ 10^4',
    follow_up: 'Self-balancing BSTs (AVL, Red-Black) maintain this invariant via rotations.',
    pattern: 'tree-height-with-early-exit',
    test_cases: [
      { inputs: ['[3,9,20,null,null,15,7]'], expected: 'true' },
      { inputs: ['[1,2,2,3,3,null,null,4,4]'], expected: 'false' },
      { inputs: ['[]'], expected: 'true' },
      { inputs: ['[1]'], expected: 'true' },
      { inputs: ['[1,2]'], expected: 'true' },
      { inputs: ['[1,2,3]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: 'true' },
      { inputs: ['[1,null,2,null,3]'], expected: 'false' },
      { inputs: ['[1,2,3,4,5,null,null,8]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,null,null,8,9]'], expected: 'false' },
      { inputs: ['[1,2,2,3,null,null,3,4,null,null,4]'], expected: 'false' },
      { inputs: ['[1,2,3]'], expected: 'true' },
    ],
  },
  {
    id: 'subtree-of-another',
    method_name: 'isSubtree',
    params: [{ name: 'root', type: 'List[int]' }, { name: 'subRoot', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Visit every node in root; at each, check sameTree(node, subRoot).',
      'sameTree is the standard parallel recursion.',
      'O(m·n) worst case.',
      'O(m+n): serialize both trees with a unique null-marker and look for substring (KMP).',
      'Watch the serialization: separator that can\'t be confused with a value, AND mark every null.',
    ],
    tags: ['tree', 'dfs', 'recursion', 'string-matching'],
    constraints: '1 ≤ root.length ≤ 2000\n1 ≤ subRoot.length ≤ 1000\n-10^4 ≤ Node.val ≤ 10^4',
    follow_up: 'Hash subtrees (Merkle-tree-style) for O(n) average matching.',
    pattern: 'tree-traversal-plus-match',
    test_cases: [
      { inputs: ['[3,4,5,1,2]', '[4,1,2]'], expected: 'true' },
      { inputs: ['[3,4,5,1,2,null,null,null,null,0]', '[4,1,2]'], expected: 'false' },
      { inputs: ['[1]', '[1]'], expected: 'true' },
      { inputs: ['[1]', '[2]'], expected: 'false' },
      { inputs: ['[1,2,3]', '[2]'], expected: 'true' },
      { inputs: ['[1,2,3]', '[3]'], expected: 'true' },
      { inputs: ['[1,2,3]', '[4]'], expected: 'false' },
      { inputs: ['[1,2,3,4,5,6,7]', '[2,4,5]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7]', '[2,4,5,8]'], expected: 'false' },
      { inputs: ['[1,2]', '[1,2]'], expected: 'true' },
      { inputs: ['[1,1,1,1,1]', '[1,1]'], expected: 'true' },
    ],
  },
  {
    id: 'merge-two-binary-trees',
    method_name: 'mergeTrees',
    params: [{ name: 'root1', type: 'List[int]' }, { name: 'root2', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Overlap nodes: sum values. Non-overlap: use whichever exists.',
      'Recursive: if either is null, return the other. Otherwise return new node with summed val + merged children.',
      'Mutating in-place avoids allocations — root1.val += root2.val; recurse.',
      'O(min(m, n)) time.',
      'BFS with a paired queue works for iterative.',
    ],
    tags: ['tree', 'dfs', 'bfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 2000\n-10^4 ≤ Node.val ≤ 10^4',
    follow_up: 'Merge K trees — apply the binary merge K-1 times, or use a priority queue traversal.',
    pattern: 'parallel-recursion-merge',
    test_cases: [
      { inputs: ['[1,3,2,5]', '[2,1,3,null,4,null,7]'], expected: '[3,4,5,5,4,null,7]' },
      { inputs: ['[1]', '[1,2]'], expected: '[2,2]' },
      { inputs: ['[]', '[1]'], expected: '[1]' },
      { inputs: ['[]', '[]'], expected: '[]' },
      { inputs: ['[1]', '[]'], expected: '[1]' },
      { inputs: ['[1,2,3]', '[4,5,6]'], expected: '[5,7,9]' },
      { inputs: ['[1,2]', '[1,null,2]'], expected: '[2,2,2]' },
      { inputs: ['[0]', '[0]'], expected: '[0]' },
      { inputs: ['[-1,-2,-3]', '[1,2,3]'], expected: '[0,0,0]' },
      { inputs: ['[1,2,3,4,5]', '[1,2,3,4,5]'], expected: '[2,4,6,8,10]' },
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
  console.log(`  ✓ ${f.id}  — ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
