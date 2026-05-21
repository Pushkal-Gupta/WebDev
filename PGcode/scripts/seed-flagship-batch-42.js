#!/usr/bin/env node
// Batch 42: tree traversals + paths.

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
    id: 'binary-tree-zigzag-level-order',
    method_name: 'zigzagLevelOrder',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Same BFS as level-order traversal.',
      'Per level, reverse the collected values when level index is odd.',
      'Alternative: use a deque; alternate appending to front / back.',
      'O(n) time, O(w) space.',
      'Recursive DFS variant: pass depth and odd-parity flag.',
    ],
    tags: ['tree', 'bfs', 'queue'],
    constraints: '0 ≤ nodes ≤ 2000\n-100 ≤ Node.val ≤ 100',
    follow_up: 'Spiral order over level-order pairs — output left-to-right on level 0, right-to-left on level 1, etc.',
    pattern: 'level-bfs-alternate-direction',
    test_cases: [
      { inputs: ['[3,9,20,null,null,15,7]'], expected: '[[3],[20,9],[15,7]]' },
      { inputs: ['[1]'], expected: '[[1]]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1,2,3]'], expected: '[[1],[3,2]]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[[1],[3,2],[4,5]]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[[1],[3,2],[4,5,6,7]]' },
      { inputs: ['[1,null,2]'], expected: '[[1],[2]]' },
      { inputs: ['[10,5,15,3,7,12,20]'], expected: '[[10],[15,5],[3,7,12,20]]' },
      { inputs: ['[1,2,3,4,null,null,5]'], expected: '[[1],[3,2],[4,5]]' },
    ],
  },
  {
    id: 'binary-tree-paths',
    method_name: 'binaryTreePaths',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[str]',
    hints: [
      'Recursive DFS carrying the path as a string or list.',
      'At a leaf, append the joined path to the result.',
      'Format with "->" between values.',
      'O(n · h) time (each path joined separately).',
      'Equivalent iterative version: BFS with parallel "path so far" queue.',
    ],
    tags: ['tree', 'dfs', 'backtracking', 'string'],
    constraints: '1 ≤ nodes ≤ 100\n-100 ≤ Node.val ≤ 100',
    follow_up: '"Path Sum II" — paths whose values sum to a target. Same traversal + accumulator.',
    pattern: 'dfs-path-accumulator',
    test_cases: [
      { inputs: ['[1,2,3,null,5]'], expected: '["1->2->5","1->3"]' },
      { inputs: ['[1]'], expected: '["1"]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1,2]'], expected: '["1->2"]' },
      { inputs: ['[1,null,2]'], expected: '["1->2"]' },
      { inputs: ['[1,2,3]'], expected: '["1->2","1->3"]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '["1->2->4","1->2->5","1->3->6","1->3->7"]' },
      { inputs: ['[-1,-2,-3]'], expected: '["-1->-2","-1->-3"]' },
    ],
  },
  {
    id: 'sum-root-to-leaf-numbers',
    method_name: 'sumNumbers',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'DFS carrying running value `cur = cur * 10 + node.val`.',
      'At a leaf, add cur to the total.',
      'Watch the leaf check: both children null.',
      'O(n) time, O(h) recursion.',
      'Iterative version: stack of (node, value) pairs.',
    ],
    tags: ['tree', 'dfs', 'recursion'],
    constraints: '1 ≤ nodes ≤ 1000\n0 ≤ Node.val ≤ 9\nThe answer is guaranteed to fit in a 32-bit integer.',
    follow_up: 'Compute the BINARY value (or some other base) — generalize the multiplier.',
    pattern: 'dfs-running-value',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '25' },
      { inputs: ['[4,9,0,5,1]'], expected: '1026' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[0]'], expected: '0' },
      { inputs: ['[1,2]'], expected: '12' },
      { inputs: ['[1,2,3,4,5]'], expected: '262' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '522' },
      { inputs: ['[9,0]'], expected: '90' },
      { inputs: ['[5,4,7,3,null,2,null,-1,null,9]'], expected: '0' },
    ],
  },
  {
    id: 'boundary-traversal',
    method_name: 'boundaryOfBinaryTree',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Boundary = root + left boundary (top-down, excluding leaves) + all leaves (left-to-right) + right boundary (bottom-up, excluding leaves).',
      'Left boundary: from root.left, prefer left child; if null, go right; stop at leaf.',
      'Right boundary: mirror, then reverse.',
      'Leaves: in-order or any DFS, collecting leaves only.',
      'O(n) time, O(h) recursion.',
    ],
    tags: ['tree', 'dfs', 'traversal'],
    constraints: '1 ≤ nodes ≤ 10^4\n-1000 ≤ Node.val ≤ 1000',
    follow_up: 'Recursive single-pass version with parameters indicating "on left boundary" / "on right boundary".',
    pattern: 'three-phase-traversal',
    test_cases: [
      { inputs: ['[1,null,2,3,4]'], expected: '[1,3,4,2]' },
      { inputs: ['[1,2,3,4,5,6,null,null,null,7,8,9,10]'], expected: '[1,2,4,7,8,9,10,6,3]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[1,null,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3]'], expected: '[1,2,3]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[1,2,4,5,6,7,3]' },
    ],
  },
  {
    id: 'minimum-depth-binary-tree',
    method_name: 'minDepth',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Min depth = shortest root-to-LEAF path (NOT shortest path to any node!).',
      'Edge case: a node with one missing child uses the OTHER child\'s depth — not min(left, right).',
      'BFS is naturally early-exiting: return level the moment you hit a leaf.',
      'DFS: recurse; if both children exist, return 1 + min(left, right). Else return 1 + the existing side.',
      'O(n) worst, faster with BFS short-circuit.',
    ],
    tags: ['tree', 'bfs', 'dfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 10^5\n-1000 ≤ Node.val ≤ 1000',
    follow_up: 'Find the actual shortest path nodes — track parents during BFS.',
    pattern: 'bfs-find-first-leaf',
    test_cases: [
      { inputs: ['[3,9,20,null,null,15,7]'], expected: '2' },
      { inputs: ['[2,null,3,null,4,null,5,null,6]'], expected: '5' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '2' },
      { inputs: ['[1,null,2]'], expected: '2' },
      { inputs: ['[1,2,3]'], expected: '2' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '3' },
      { inputs: ['[1,2,null,3,null,4]'], expected: '4' },
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
