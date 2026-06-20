#!/usr/bin/env node
// Batch 57: combinatorics + tree classics.

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
    id: 'subsets',
    method_name: 'subsets',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'There are 2^n subsets.',
      'Backtracking: at each index, choose include or skip; collect partial on every node.',
      'Iterative: start with [[]]; for each num, append num to every existing subset and add to result.',
      'Bitmask: for mask in 0..2^n-1, pick nums where bit i is set.',
      'O(n · 2^n) time.',
    ],
    tags: ['array', 'backtracking', 'bitmask'],
    constraints: '1 ≤ nums.length ≤ 10\n-10 ≤ nums[i] ≤ 10\nAll values unique',
    follow_up: 'Subsets II — duplicates allowed; sort + skip-if-prev-not-included.',
    pattern: 'backtracking-include-exclude',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]' },
      { inputs: ['[0]'], expected: '[[],[0]]' },
      { inputs: ['[1]'], expected: '[[],[1]]' },
      { inputs: ['[1,2]'], expected: '[[],[1],[1,2],[2]]' },
      { inputs: ['[1,2,3,4]'], expected: '[[],[1],[1,2],[1,2,3],[1,2,3,4],[1,2,4],[1,3],[1,3,4],[1,4],[2],[2,3],[2,3,4],[2,4],[3],[3,4],[4]]' },
      { inputs: ['[-1]'], expected: '[[],[-1]]' },
    ],
  },
  {
    id: 'combinations',
    method_name: 'combine',
    params: [{ name: 'n', type: 'int' }, { name: 'k', type: 'int' }],
    return_type: 'List[List[int]]',
    hints: [
      'C(n, k) combinations.',
      'Backtrack: choose next number from [start..n]; recurse with smaller k.',
      'Prune: if (n - start + 1) < remaining_k, can\'t complete — abort early.',
      'O(C(n,k) · k) time.',
      'Iterative variant: lexicographic increment of indices.',
    ],
    tags: ['backtracking', 'combinatorics'],
    constraints: '1 ≤ n ≤ 20\n1 ≤ k ≤ n',
    follow_up: 'Combination Sum (numbers repeat, sums to target) — same backtracking template.',
    pattern: 'backtracking-with-prune',
    test_cases: [
      { inputs: ['4', '2'], expected: '[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]' },
      { inputs: ['1', '1'], expected: '[[1]]' },
      { inputs: ['3', '3'], expected: '[[1,2,3]]' },
      { inputs: ['3', '1'], expected: '[[1],[2],[3]]' },
      { inputs: ['5', '2'], expected: '[[1,2],[1,3],[1,4],[1,5],[2,3],[2,4],[2,5],[3,4],[3,5],[4,5]]' },
      { inputs: ['5', '5'], expected: '[[1,2,3,4,5]]' },
    ],
  },
  {
    id: 'level-order-traversal',
    method_name: 'levelOrder',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'BFS with a queue. Process level-by-level by tracking queue size at each iteration.',
      'For each level: pop size nodes, collect their values, enqueue non-null children.',
      'Recursive variant: DFS with depth parameter; append to result[depth].',
      'O(n) time, O(w) space (max width).',
      'Empty tree → empty result.',
    ],
    tags: ['tree', 'bfs'],
    constraints: '0 ≤ nodes ≤ 2000\n-1000 ≤ Node.val ≤ 1000',
    follow_up: 'Level Order Bottom-Up — same BFS, just reverse the final list.',
    pattern: 'bfs-level-size',
    test_cases: [
      { inputs: ['[3,9,20,null,null,15,7]'], expected: '[[3],[9,20],[15,7]]' },
      { inputs: ['[1]'], expected: '[[1]]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1,2,3]'], expected: '[[1],[2,3]]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[[1],[2,3],[4,5,6,7]]' },
      { inputs: ['[1,null,2]'], expected: '[[1],[2]]' },
      { inputs: ['[1,2]'], expected: '[[1],[2]]' },
      { inputs: ['[1,null,2,null,3]'], expected: '[[1],[2],[3]]' },
    ],
  },
  {
    id: 'binary-tree-right-side',
    method_name: 'rightSideView',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'BFS level-by-level; for each level the LAST node enqueued is the right side.',
      'DFS preorder visiting right first: when depth == result.length, append node.val.',
      'Either approach is O(n) time, O(h) space.',
      'Empty tree → empty result.',
      'Watch: the "rightmost at level" may come via a left child of a right subtree.',
    ],
    tags: ['tree', 'bfs', 'dfs'],
    constraints: '0 ≤ nodes ≤ 100\n-100 ≤ Node.val ≤ 100',
    follow_up: 'Left Side View — mirror.',
    pattern: 'bfs-last-of-level',
    test_cases: [
      { inputs: ['[1,2,3,null,5,null,4]'], expected: '[1,3,4]' },
      { inputs: ['[1,null,3]'], expected: '[1,3]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2,3]'], expected: '[1,3]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3,4]'], expected: '[1,3,4]' },
      { inputs: ['[1,2,null,3]'], expected: '[1,2,3]' },
      { inputs: ['[1,2,3,4,null,null,5,6]'], expected: '[1,3,5,6]' },
    ],
  },
  {
    id: 'lowest-common-ancestor',
    method_name: 'lowestCommonAncestor',
    params: [{ name: 'root', type: 'List[int]' }, { name: 'p', type: 'int' }, { name: 'q', type: 'int' }],
    return_type: 'int',
    hints: [
      'Recursive DFS. Base: if root is null or matches p or q, return root.',
      'Recurse into left and right children.',
      'If both sides return non-null, current root is the LCA.',
      'If only one side returns non-null, propagate it up.',
      'O(n) time, O(h) stack.',
    ],
    tags: ['tree', 'dfs', 'recursion'],
    constraints: '2 ≤ nodes ≤ 10^5\n-10^9 ≤ Node.val ≤ 10^9\np, q exist in the tree and are distinct',
    follow_up: 'For a BST: use the BST property directly — O(h) without examining whole tree.',
    pattern: 'dfs-post-order-LCA',
    test_cases: [
      { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '5', '1'], expected: '3' },
      { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '5', '4'], expected: '5' },
      { inputs: ['[1,2]', '1', '2'], expected: '1' },
      { inputs: ['[1,2,3]', '2', '3'], expected: '1' },
      { inputs: ['[1,2,3]', '2', '2'], expected: '2' },
      { inputs: ['[2,1]', '2', '1'], expected: '2' },
      { inputs: ['[6,2,8,0,4,7,9,null,null,3,5]', '2', '8'], expected: '6' },
      { inputs: ['[6,2,8,0,4,7,9,null,null,3,5]', '3', '5'], expected: '4' },
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
