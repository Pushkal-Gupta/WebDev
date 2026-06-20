#!/usr/bin/env node
// Batch 5: 5 more flagships — clone-graph, course-schedule, kth-smallest-bst,
// lca, same-tree.

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
    id: 'clone-graph',
    method_name: 'cloneGraph',
    params: [{ name: 'adj', type: 'List[List[int]]' }, { name: 'startVal', type: 'int' }],
    return_type: 'List[List[int]]',
    hints: [
      'Deep-copy every node + every edge. Cycles are possible — you need to remember which originals you have already cloned.',
      'Use a hashmap: original-node → clone-node.',
      'DFS or BFS. For each neighbor, if not yet cloned, clone it first and recurse/queue.',
      'Without the visited map you\'d infinite-loop on cyclic graphs.',
      'O(V + E) time, O(V) space.',
    ],
    tags: ['graph', 'dfs', 'bfs', 'hash-map'],
    constraints: '0 ≤ nodes ≤ 100\n1 ≤ Node.val ≤ 100\nGraph is connected; given as adjacency list.',
    follow_up: 'Disconnected graph — start a fresh DFS from every unvisited node.',
    pattern: 'graph-traversal-clone',
    test_cases: [
      // Inputs: adj = neighbors list per node (1-indexed), startVal = node to clone from.
      { inputs: ['[[2,4],[1,3],[2,4],[1,3]]', '1'], expected: '[[2,4],[1,3],[2,4],[1,3]]' },
      { inputs: ['[[]]', '1'], expected: '[[]]' },
      { inputs: ['[]', '0'], expected: '[]' },
      { inputs: ['[[2],[1]]', '1'], expected: '[[2],[1]]' },
      { inputs: ['[[2,3],[1,3],[1,2]]', '1'], expected: '[[2,3],[1,3],[1,2]]' },
      { inputs: ['[[2],[1,3],[2,4],[3,5],[4]]', '1'], expected: '[[2],[1,3],[2,4],[3,5],[4]]' },
      { inputs: ['[[]]', '1'], expected: '[[]]' },
      { inputs: ['[[2,3,4],[1,3,4],[1,2,4],[1,2,3]]', '1'], expected: '[[2,3,4],[1,3,4],[1,2,4],[1,2,3]]' },
      { inputs: ['[[2],[1]]', '2'], expected: '[[2],[1]]' },
      { inputs: ['[[2,5],[1,3],[2,4],[3,5],[1,4]]', '1'], expected: '[[2,5],[1,3],[2,4],[3,5],[1,4]]' },
      { inputs: ['[[2],[1,3,4],[2],[2]]', '1'], expected: '[[2],[1,3,4],[2],[2]]' },
      { inputs: ['[[2,3,4,5],[1],[1],[1],[1]]', '1'], expected: '[[2,3,4,5],[1],[1],[1],[1]]' },
      { inputs: ['[[2],[1]]', '1'], expected: '[[2],[1]]' },
      { inputs: ['[[2],[3],[4],[1]]', '1'], expected: '[[2],[3],[4],[1]]' },
      { inputs: ['[[2,4],[1,3],[2,4],[1,3]]', '3'], expected: '[[2,4],[1,3],[2,4],[1,3]]' },
    ],
  },
  {
    id: 'course-schedule',
    method_name: 'canFinish',
    params: [{ name: 'numCourses', type: 'int' }, { name: 'prerequisites', type: 'List[List[int]]' }],
    return_type: 'bool',
    hints: [
      'You can finish iff the prerequisite graph has no cycle.',
      'Build a directed graph: edge prereq[1] → prereq[0] (must take prereq[1] before prereq[0]).',
      'DFS-based: 3-color marking (unvisited/visiting/done). Cycle iff you hit a "visiting" node.',
      'Kahn\'s algorithm (BFS topological sort): repeatedly remove a node with in-degree 0. If you can remove all, no cycle.',
      'O(V + E) for both approaches.',
    ],
    tags: ['graph', 'topological-sort', 'dfs', 'bfs'],
    constraints: '1 ≤ numCourses ≤ 2000\n0 ≤ prerequisites.length ≤ 5000',
    follow_up: '"Course Schedule II" — return the actual ordering. Use Kahn\'s with a queue.',
    pattern: 'topological-sort',
    test_cases: [
      { inputs: ['2', '[[1,0]]'], expected: 'true' },
      { inputs: ['2', '[[1,0],[0,1]]'], expected: 'false' },
      { inputs: ['1', '[]'], expected: 'true' },
      { inputs: ['3', '[[1,0],[2,1]]'], expected: 'true' },
      { inputs: ['3', '[[1,0],[2,1],[0,2]]'], expected: 'false' },
      { inputs: ['4', '[[1,0],[2,0],[3,1],[3,2]]'], expected: 'true' },
      { inputs: ['5', '[]'], expected: 'true' },
      { inputs: ['5', '[[0,1],[1,2],[2,3],[3,4],[4,0]]'], expected: 'false' },
      { inputs: ['5', '[[0,1],[1,2],[2,3],[3,4]]'], expected: 'true' },
      { inputs: ['100', '[]'], expected: 'true' },
      { inputs: ['2', '[]'], expected: 'true' },
      { inputs: ['7', '[[1,0],[2,0],[3,1],[4,2],[5,3],[6,4],[6,5]]'], expected: 'true' },
      { inputs: ['7', '[[1,0],[2,0],[3,1],[4,2],[5,3],[6,4],[0,6]]'], expected: 'false' },
      { inputs: ['3', '[[0,1],[1,2]]'], expected: 'true' },
      { inputs: ['3', '[[0,1],[1,0]]'], expected: 'false' },
      { inputs: ['4', '[[0,1],[1,2],[2,3]]'], expected: 'true' },
      { inputs: ['4', '[[0,1],[1,2],[2,3],[3,0]]'], expected: 'false' },
      { inputs: ['6', '[[1,0],[2,0],[3,1],[3,2],[4,3],[5,4]]'], expected: 'true' },
      { inputs: ['2', '[[0,1]]'], expected: 'true' },
      { inputs: ['10', '[[1,0],[2,1],[3,2],[4,3],[5,4],[6,5],[7,6],[8,7],[9,8]]'], expected: 'true' },
      { inputs: ['10', '[[1,0],[2,1],[3,2],[4,3],[5,4],[6,5],[7,6],[8,7],[9,8],[0,9]]'], expected: 'false' },
      { inputs: ['1', '[[0,0]]'], expected: 'false' },
    ],
  },
  {
    id: 'kth-smallest-bst',
    method_name: 'kthSmallest',
    params: [{ name: 'root', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'In-order traversal of a BST visits nodes in sorted ascending order.',
      'Walk in-order, decrement k at each node. When k hits 0, return that node\'s value.',
      'Early-exit when found — no need to traverse the whole tree.',
      'O(h + k) where h is tree height. For balanced BST, O(log n + k).',
      'Iterative version uses a stack: push left chain, pop+process, descend right.',
    ],
    tags: ['tree', 'bst', 'dfs', 'in-order-traversal'],
    constraints: '1 ≤ nodes ≤ 10^4\n0 ≤ Node.val ≤ 10^4\n1 ≤ k ≤ number of nodes',
    follow_up: 'What if the BST is modified often and you need many kth queries? Augment each node with subtree size; O(log n) per query.',
    pattern: 'in-order-traversal',
    test_cases: [
      { inputs: ['[3,1,4,null,2]', '1'], expected: '1' },
      { inputs: ['[5,3,6,2,4,null,null,1]', '3'], expected: '3' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[2,1,3]', '2'], expected: '2' },
      { inputs: ['[2,1,3]', '1'], expected: '1' },
      { inputs: ['[2,1,3]', '3'], expected: '3' },
      { inputs: ['[5,3,7,2,4,6,8]', '4'], expected: '5' },
      { inputs: ['[5,3,7,2,4,6,8]', '1'], expected: '2' },
      { inputs: ['[5,3,7,2,4,6,8]', '7'], expected: '8' },
      { inputs: ['[10,5,15,3,8,12,20]', '3'], expected: '8' },
      { inputs: ['[20,10,30,5,15,25,35]', '5'], expected: '25' },
      { inputs: ['[8,4,12,2,6,10,14,1,3,5,7,9,11,13,15]', '8'], expected: '8' },
      { inputs: ['[8,4,12,2,6,10,14,1,3,5,7,9,11,13,15]', '1'], expected: '1' },
      { inputs: ['[8,4,12,2,6,10,14,1,3,5,7,9,11,13,15]', '15'], expected: '15' },
      { inputs: ['[6,2,8,1,4,7,9,null,null,3,5]', '6'], expected: '6' },
      { inputs: ['[6,2,8,1,4,7,9,null,null,3,5]', '5'], expected: '5' },
      { inputs: ['[10,5,15,1,7,12,20]', '2'], expected: '5' },
      { inputs: ['[50]', '1'], expected: '50' },
      { inputs: ['[3,1,4,null,2]', '4'], expected: '4' },
      { inputs: ['[3,1,4,null,2]', '3'], expected: '3' },
      { inputs: ['[3,1,4,null,2]', '2'], expected: '2' },
      { inputs: ['[7,3,9,1,5,8,10]', '4'], expected: '7' },
      { inputs: ['[7,3,9,1,5,8,10]', '7'], expected: '10' },
    ],
  },
  {
    id: 'lowest-common-ancestor',
    method_name: 'lowestCommonAncestor',
    params: [{ name: 'root', type: 'List[int]' }, { name: 'p', type: 'int' }, { name: 'q', type: 'int' }],
    return_type: 'int',
    hints: [
      'For a non-BST tree: recurse on both children. If a child returns non-null, propagate it up.',
      'Base case: null root → return null. If root == p or root == q → return root.',
      'After recursing: if both children return non-null, current node is the LCA.',
      'If only one returns non-null, propagate that one upward.',
      'O(n) time, O(h) recursion. For a BST you can do O(h) iteratively by comparing values.',
    ],
    tags: ['tree', 'dfs', 'recursion'],
    constraints: '2 ≤ nodes ≤ 10^5\n-10^9 ≤ Node.val ≤ 10^9\nAll node values are unique. p and q both exist.',
    follow_up: 'BST variant — at each node, if both p and q are smaller, recurse left; if both larger, recurse right; else current node IS the LCA.',
    pattern: 'tree-postorder',
    test_cases: [
      { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '5', '1'], expected: '3' },
      { inputs: ['[3,5,1,6,2,0,8,null,null,7,4]', '5', '4'], expected: '5' },
      { inputs: ['[1,2]', '1', '2'], expected: '1' },
      { inputs: ['[2,1]', '1', '2'], expected: '2' },
      { inputs: ['[1,2,3]', '2', '3'], expected: '1' },
      { inputs: ['[5,3,8,1,4,7,9]', '1', '4'], expected: '3' },
      { inputs: ['[5,3,8,1,4,7,9]', '7', '9'], expected: '8' },
      { inputs: ['[5,3,8,1,4,7,9]', '1', '9'], expected: '5' },
      { inputs: ['[10,5,15,3,7,12,20]', '3', '7'], expected: '5' },
      { inputs: ['[10,5,15,3,7,12,20]', '12', '20'], expected: '15' },
      { inputs: ['[1,2,3,4,5,6,7]', '4', '5'], expected: '2' },
      { inputs: ['[1,2,3,4,5,6,7]', '6', '7'], expected: '3' },
      { inputs: ['[1,2,3,4,5,6,7]', '4', '7'], expected: '1' },
      { inputs: ['[2,1,3]', '1', '3'], expected: '2' },
      { inputs: ['[6,2,8,0,4,7,9,null,null,3,5]', '2', '8'], expected: '6' },
      { inputs: ['[6,2,8,0,4,7,9,null,null,3,5]', '2', '4'], expected: '2' },
      { inputs: ['[6,2,8,0,4,7,9,null,null,3,5]', '3', '5'], expected: '4' },
      { inputs: ['[1,2,null,3]', '2', '3'], expected: '2' },
      { inputs: ['[1,null,2,null,3,null,4]'  , '2', '4'], expected: '2' },
      { inputs: ['[7,3,15,null,null,9,20]', '9', '20'], expected: '15' },
    ],
  },
  {
    id: 'same-tree',
    method_name: 'isSameTree',
    params: [{ name: 'p', type: 'List[int]' }, { name: 'q', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Recurse in parallel through both trees.',
      'Two nulls → true. One null + one non-null → false.',
      'Otherwise: same value AND same left subtree AND same right subtree.',
      'O(min(m, n)) time — short-circuit on first mismatch.',
      'Iterative version uses two queues / stacks in lockstep.',
    ],
    tags: ['tree', 'dfs', 'bfs', 'recursion'],
    constraints: '0 ≤ nodes per tree ≤ 100\n-10^4 ≤ Node.val ≤ 10^4',
    follow_up: '"Symmetric Tree" — check if a tree is its own mirror.',
    pattern: 'tree-parallel-recursion',
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
      { inputs: ['[1,null,2]', '[1,null,2]'], expected: 'true' },
      { inputs: ['[1,2,null]', '[1,null,2]'], expected: 'false' },
      { inputs: ['[5,3,8,1,4,7,9]', '[5,3,8,1,4,7,9]'], expected: 'true' },
      { inputs: ['[5,3,8,1,4,7,9]', '[5,3,8,1,4,7,10]'], expected: 'false' },
      { inputs: ['[-1,-2,-3]', '[-1,-2,-3]'], expected: 'true' },
      { inputs: ['[0]', '[-0]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7]', '[1,2,3,4,5,6,7]'], expected: 'true' },
      { inputs: ['[1,2,3,4,null,null,5]', '[1,2,3,4,null,null,5]'], expected: 'true' },
      { inputs: ['[1,2,3,4,null,null,5]', '[1,2,3,null,4,null,5]'], expected: 'false' },
      { inputs: ['[100]', '[100]'], expected: 'true' },
      { inputs: ['[100]', '[-100]'], expected: 'false' },
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
