#!/usr/bin/env node
// Batch 22: arrays, hashing, hard interview classics.

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
    id: 'set-matrix-zeroes',
    method_name: 'setZeroes',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Naive: collect (row, col) of every 0; then zero those rows/cols. O(m+n) extra.',
      'O(1) extra space: use first row + first col as marker arrays.',
      'Pre-scan to remember whether first row/col originally contained a zero.',
      'For each (i,j) with a 0, set matrix[i][0] = matrix[0][j] = 0.',
      'Second pass: zero out cells whose row or column marker is 0. Finally, zero first row/col if needed.',
    ],
    tags: ['array', 'matrix'],
    constraints: '1 ≤ m, n ≤ 200\n-2^31 ≤ matrix[i][j] ≤ 2^31 − 1',
    follow_up: 'O(1) extra space without overwriting markers — use a sentinel value distinct from any data value.',
    pattern: 'in-place-marker',
    test_cases: [
      { inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'], expected: '[[1,0,1],[0,0,0],[1,0,1]]' },
      { inputs: ['[[0,1,2,0],[3,4,5,2],[1,3,1,5]]'], expected: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' },
      { inputs: ['[[1]]'], expected: '[[1]]' },
      { inputs: ['[[0]]'], expected: '[[0]]' },
      { inputs: ['[[1,2],[3,4]]'], expected: '[[1,2],[3,4]]' },
      { inputs: ['[[0,0],[0,0]]'], expected: '[[0,0],[0,0]]' },
      { inputs: ['[[1,0],[0,1]]'], expected: '[[0,0],[0,0]]' },
      { inputs: ['[[1,2,3,4,5]]'], expected: '[[1,2,3,4,5]]' },
      { inputs: ['[[1,2,3,4,0]]'], expected: '[[0,0,0,0,0]]' },
      { inputs: ['[[1],[2],[3],[0]]'], expected: '[[0],[0],[0],[0]]' },
      { inputs: ['[[2,1,1],[0,1,1],[1,1,1]]'], expected: '[[0,1,1],[0,0,0],[0,1,1]]' },
    ],
  },
  {
    id: 'longest-consecutive',
    method_name: 'longestConsecutive',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Sort + scan → O(n log n). Acceptable.',
      'O(n): put everything in a hashset.',
      'For each num, only START a count from it if (num - 1) is NOT in the set.',
      'Then walk num, num+1, num+2, … incrementing count.',
      'Total work is O(n) because each value is the body of exactly one walk.',
    ],
    tags: ['array', 'hash-set', 'union-find'],
    constraints: '0 ≤ nums.length ≤ 10^5\n-10^9 ≤ nums[i] ≤ 10^9',
    follow_up: 'Reachable also by union-find: union i and i+1 if both present.',
    pattern: 'hashset-streak',
    test_cases: [
      { inputs: ['[100,4,200,1,3,2]'], expected: '4' },
      { inputs: ['[0,3,7,2,5,8,4,6,0,1]'], expected: '9' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,2,0,1]'], expected: '3' },
      { inputs: ['[9,1,4,7,3,-1,0,5,8,-1,6]'], expected: '7' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]'], expected: '10' },
      { inputs: ['[10,9,8,7,6,5,4,3,2,1]'], expected: '10' },
      { inputs: ['[5,5,5,5,5]'], expected: '1' },
      { inputs: ['[1,1,2,2,3,3,4,4]'], expected: '4' },
      { inputs: ['[-1,-2,-3,-4,-5]'], expected: '5' },
      { inputs: ['[100,200,300,400]'], expected: '1' },
      { inputs: ['[1,3,5,7,9]'], expected: '1' },
    ],
  },
  {
    id: 'next-permutation',
    method_name: 'nextPermutation',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Find the largest i such that nums[i] < nums[i+1]. Everything after i is non-increasing.',
      'If no such i exists, the sequence is the last permutation — reverse to get the first.',
      'Otherwise find the largest j > i with nums[j] > nums[i]; swap them.',
      'Reverse the suffix after i to make it ascending (the smallest possible after the swap).',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'two-pointers'],
    constraints: '1 ≤ nums.length ≤ 100\n0 ≤ nums[i] ≤ 100',
    follow_up: 'Previous permutation — mirror of the algorithm with > swapped to <.',
    pattern: 'swap-then-reverse-suffix',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '[1,3,2]' },
      { inputs: ['[3,2,1]'], expected: '[1,2,3]' },
      { inputs: ['[1,1,5]'], expected: '[1,5,1]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[2,1]' },
      { inputs: ['[2,1]'], expected: '[1,2]' },
      { inputs: ['[1,3,2]'], expected: '[2,1,3]' },
      { inputs: ['[2,3,1]'], expected: '[3,1,2]' },
      { inputs: ['[1,5,1]'], expected: '[5,1,1]' },
      { inputs: ['[5,1,1]'], expected: '[1,1,5]' },
      { inputs: ['[1,1,1]'], expected: '[1,1,1]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[1,2,3,5,4]' },
      { inputs: ['[5,4,3,2,1]'], expected: '[1,2,3,4,5]' },
      { inputs: ['[1,2,4,3]'], expected: '[1,3,2,4]' },
      { inputs: ['[2,3,4,1]'], expected: '[2,4,1,3]' },
    ],
  },
  {
    id: 'binary-tree-maximum-path-sum',
    method_name: 'maxPathSum',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Path: any sequence of connected nodes — does NOT have to pass through root.',
      'DFS returning the best "downward gain" from a node: node.val + max(0, max(left, right)).',
      'In the same recursion, update a global best = node.val + max(0, left) + max(0, right).',
      'max(0, ...) lets you discard negative subtrees.',
      'O(n) time, O(h) recursion.',
    ],
    tags: ['tree', 'dfs', 'recursion', 'dp'],
    constraints: '1 ≤ nodes ≤ 3·10^4\n-1000 ≤ Node.val ≤ 1000',
    follow_up: 'Reconstruct the actual path — track which children were used at the node that hit the max.',
    pattern: 'tree-postorder-global-track',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '6' },
      { inputs: ['[-10,9,20,null,null,15,7]'], expected: '42' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[-3]'], expected: '-3' },
      { inputs: ['[2,-1]'], expected: '2' },
      { inputs: ['[-2,-1]'], expected: '-1' },
      { inputs: ['[5,4,8,11,null,13,4,7,2,null,null,null,1]'], expected: '48' },
      { inputs: ['[1,-2,-3]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '3' },
      { inputs: ['[1,2,3,4,5]'], expected: '11' },
      { inputs: ['[-1,2,3]'], expected: '4' },
      { inputs: ['[1000]'], expected: '1000' },
      { inputs: ['[-1000]'], expected: '-1000' },
    ],
  },
  {
    id: 'minimum-size-subarray-sum',
    method_name: 'minSubArrayLen',
    params: [{ name: 'target', type: 'int' }, { name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'All nums are positive — sliding window applies.',
      'Maintain a window with running sum. Expand right; whenever sum ≥ target, try to shrink left.',
      'Track the minimum window length seen.',
      'O(n) time, O(1) space.',
      'If no valid window, return 0.',
    ],
    tags: ['array', 'sliding-window', 'binary-search', 'prefix-sum'],
    constraints: '1 ≤ target ≤ 10^9\n1 ≤ nums.length ≤ 10^5\n1 ≤ nums[i] ≤ 10^4',
    follow_up: 'If nums can be negative, sliding window breaks — use prefix sum + monotonic deque or sort.',
    pattern: 'sliding-window-expand-shrink',
    test_cases: [
      { inputs: ['7', '[2,3,1,2,4,3]'], expected: '2' },
      { inputs: ['4', '[1,4,4]'], expected: '1' },
      { inputs: ['11', '[1,1,1,1,1,1,1,1]'], expected: '0' },
      { inputs: ['15', '[1,2,3,4,5]'], expected: '5' },
      { inputs: ['100', '[]'], expected: '0' },
      { inputs: ['1', '[1]'], expected: '1' },
      { inputs: ['2', '[1]'], expected: '0' },
      { inputs: ['5', '[5]'], expected: '1' },
      { inputs: ['6', '[10,2,3]'], expected: '1' },
      { inputs: ['10', '[1,2,3,4,5]'], expected: '4' },
      { inputs: ['11', '[1,2,3,4,5]'], expected: '3' },
      { inputs: ['3', '[1,1,1,1,1,1,1]'], expected: '3' },
      { inputs: ['100', '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]'], expected: '12' },
      { inputs: ['50', '[10,20,30,40,50]'], expected: '1' },
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
