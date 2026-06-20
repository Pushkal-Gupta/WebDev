#!/usr/bin/env node
// Batch 20: hard-tier linked list + stack + array classics.

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
    id: 'sort-list',
    method_name: 'sortList',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'O(n log n) and O(1) extra space → merge sort. Quicksort on linked list is hard to do in-place.',
      'Top-down: find middle (slow/fast), split, recurse on each half, merge.',
      'Bottom-up (iterative): start with sublist length 1, merge adjacent pairs; double the size; repeat.',
      'Bottom-up is the truly O(1) extra space version — top-down uses O(log n) recursion.',
      'Merge step is identical to "Merge Two Sorted Lists".',
    ],
    tags: ['linked-list', 'merge-sort', 'divide-and-conquer'],
    constraints: '0 ≤ list length ≤ 5·10^4\n-10^5 ≤ Node.val ≤ 10^5',
    follow_up: 'Sort it in O(n log n) time AND O(1) memory — use the bottom-up iterative merge sort.',
    pattern: 'merge-sort-on-list',
    test_cases: [
      { inputs: ['[4,2,1,3]'], expected: '[1,2,3,4]' },
      { inputs: ['[-1,5,3,4,0]'], expected: '[-1,0,3,4,5]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[2,1]'], expected: '[1,2]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[5,4,3,2,1]'], expected: '[1,2,3,4,5]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[1,2,3,4,5]' },
      { inputs: ['[3,3,3,3]'], expected: '[3,3,3,3]' },
      { inputs: ['[-100,-200,-300]'], expected: '[-300,-200,-100]' },
      { inputs: ['[100,50,200,75,150]'], expected: '[50,75,100,150,200]' },
      { inputs: ['[1,1,1,2,2,2]'], expected: '[1,1,1,2,2,2]' },
      { inputs: ['[2,1,2,1,2,1]'], expected: '[1,1,1,2,2,2]' },
    ],
  },
  {
    id: 'copy-list-random-pointer',
    method_name: 'copyRandomList',
    params: [{ name: 'nodes', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Deep-copy the list where each node has next AND random pointers. Cycles or shared randoms are possible.',
      'Approach 1: hash original→clone map. Two passes — first allocates clones, second wires next/random.',
      'Approach 2 (O(1) extra space): interleave clones between originals (A→A\'→B→B\'…), then set clone.random = orig.random.next, then split.',
      'Watch nulls for random pointer.',
      'O(n) time. Hashmap version is O(n) space; interleave is O(1).',
    ],
    tags: ['linked-list', 'hash-map'],
    constraints: '0 ≤ n ≤ 1000\n-10^4 ≤ Node.val ≤ 10^4\nrandom is null or points to a node in the list',
    follow_up: 'Generalize to graphs with arbitrary pointers — same map-then-rewire pattern works.',
    pattern: 'clone-with-map-or-interleave',
    test_cases: [
      { inputs: ['[[7,null],[13,0],[11,4],[10,2],[1,0]]'], expected: '[[7,null],[13,0],[11,4],[10,2],[1,0]]' },
      { inputs: ['[[1,1],[2,1]]'], expected: '[[1,1],[2,1]]' },
      { inputs: ['[[3,null],[3,0],[3,null]]'], expected: '[[3,null],[3,0],[3,null]]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[[1,null]]'], expected: '[[1,null]]' },
      { inputs: ['[[1,0]]'], expected: '[[1,0]]' },
      { inputs: ['[[1,1],[2,0]]'], expected: '[[1,1],[2,0]]' },
      { inputs: ['[[5,null],[6,null],[7,null]]'], expected: '[[5,null],[6,null],[7,null]]' },
      { inputs: ['[[1,4],[2,4],[3,4],[4,null],[5,4]]'], expected: '[[1,4],[2,4],[3,4],[4,null],[5,4]]' },
      { inputs: ['[[10,0],[20,1],[30,2]]'], expected: '[[10,0],[20,1],[30,2]]' },
    ],
  },
  {
    id: 'rotate-image',
    method_name: 'rotate',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Rotate 90° clockwise IN PLACE.',
      'Approach 1: transpose (swap matrix[i][j] with matrix[j][i] for i < j), then reverse each row.',
      'Approach 2: rotate ring by ring, 4 elements at a time. Cleaner in C, more error-prone overall.',
      'Watch the indexing: temp = m[i][j]; m[i][j] = m[n-j-1][i]; m[n-j-1][i] = m[n-i-1][n-j-1]; etc.',
      'O(n²) time, O(1) space.',
    ],
    tags: ['array', 'matrix'],
    constraints: 'n == matrix.length == matrix[i].length\n1 ≤ n ≤ 20\n-1000 ≤ matrix[i][j] ≤ 1000',
    follow_up: 'Rotate by 180° → reverse rows then reverse each row. By 270° → transpose then reverse columns.',
    pattern: 'matrix-rotate-in-place',
    test_cases: [
      { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[[7,4,1],[8,5,2],[9,6,3]]' },
      { inputs: ['[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]'], expected: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]' },
      { inputs: ['[[1]]'], expected: '[[1]]' },
      { inputs: ['[[1,2],[3,4]]'], expected: '[[3,1],[4,2]]' },
      { inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]'], expected: '[[13,9,5,1],[14,10,6,2],[15,11,7,3],[16,12,8,4]]' },
      { inputs: ['[[0,0],[0,0]]'], expected: '[[0,0],[0,0]]' },
      { inputs: ['[[1,1,1],[2,2,2],[3,3,3]]'], expected: '[[3,2,1],[3,2,1],[3,2,1]]' },
      { inputs: ['[[-1]]'], expected: '[[-1]]' },
      { inputs: ['[[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]]'], expected: '[[21,16,11,6,1],[22,17,12,7,2],[23,18,13,8,3],[24,19,14,9,4],[25,20,15,10,5]]' },
    ],
  },
  {
    id: 'min-stack',
    method_name: 'minStack',
    params: [{ name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[int]',
    hints: [
      'Push, pop, top, getMin — all O(1).',
      'Auxiliary "min stack" that mirrors the main stack: push current min on every push.',
      'Space optimization: only push to the aux stack when the new value ≤ current min; pop aux when popped == current min.',
      'Equivalent encoding: store (value, min-so-far) pairs in a single stack.',
      'All four operations remain O(1).',
    ],
    tags: ['stack', 'design'],
    constraints: 'Up to 3·10^4 operations.\n-2^31 ≤ val ≤ 2^31 − 1\nMethods called in arbitrary valid order.',
    follow_up: 'O(1) getMax variant — symmetric. Median/quantile in O(1)? Not possible without different structure.',
    pattern: 'auxiliary-min-stack',
    test_cases: [
      { inputs: ['[["push","-2"],["push","0"],["push","-3"],["getMin"],["pop"],["top"],["getMin"]]'], expected: '[-3,0,-2]' },
      { inputs: ['[["push","1"],["push","2"],["push","3"],["top"],["pop"],["getMin"]]'], expected: '[3,1]' },
      { inputs: ['[["push","5"],["getMin"]]'], expected: '[5]' },
      { inputs: ['[["push","5"],["push","5"],["pop"],["getMin"]]'], expected: '[5]' },
      { inputs: ['[["push","2"],["push","0"],["push","3"],["push","0"],["getMin"],["pop"],["getMin"]]'], expected: '[0,0]' },
      { inputs: ['[["push","10"],["push","20"],["push","5"],["pop"],["getMin"]]'], expected: '[10]' },
      { inputs: ['[["push","-1"],["push","-2"],["top"],["getMin"]]'], expected: '[-2,-2]' },
      { inputs: ['[["push","1"],["pop"],["push","2"],["getMin"]]'], expected: '[2]' },
      { inputs: ['[["push","100"],["push","-100"],["push","0"],["pop"],["getMin"]]'], expected: '[-100]' },
      { inputs: ['[["push","3"],["push","2"],["push","1"],["pop"],["pop"],["getMin"]]'], expected: '[3]' },
    ],
  },
  {
    id: 'rotate-array',
    method_name: 'rotate',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'k could be ≥ n. Normalize: k = k % n.',
      'O(n) extra: build out = [...nums.slice(n-k), ...nums.slice(0, n-k)].',
      'O(1) extra: reverse whole array, reverse first k, reverse last n-k. Done.',
      'Cyclic-replacement variant also O(1) — track gcd-many cycles.',
      'O(n) time, O(1) space with the reverse trick.',
    ],
    tags: ['array', 'two-pointers', 'math'],
    constraints: '1 ≤ nums.length ≤ 10^5\n-2^31 ≤ nums[i] ≤ 2^31 − 1\n0 ≤ k ≤ 10^5',
    follow_up: 'Rotate left by k instead of right — same algorithm, swap the reverse-segment lengths.',
    pattern: 'array-reversal-trick',
    test_cases: [
      { inputs: ['[1,2,3,4,5,6,7]', '3'], expected: '[5,6,7,1,2,3,4]' },
      { inputs: ['[-1,-100,3,99]', '2'], expected: '[3,99,-1,-100]' },
      { inputs: ['[1]', '0'], expected: '[1]' },
      { inputs: ['[1]', '1'], expected: '[1]' },
      { inputs: ['[1,2]', '0'], expected: '[1,2]' },
      { inputs: ['[1,2]', '1'], expected: '[2,1]' },
      { inputs: ['[1,2]', '3'], expected: '[2,1]' },
      { inputs: ['[1,2,3]', '4'], expected: '[3,1,2]' },
      { inputs: ['[1,2,3,4,5]', '0'], expected: '[1,2,3,4,5]' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '[1,2,3,4,5]' },
      { inputs: ['[1,2,3,4,5]', '7'], expected: '[4,5,1,2,3]' },
      { inputs: ['[1,2,3,4,5,6]', '3'], expected: '[4,5,6,1,2,3]' },
      { inputs: ['[100,200,300]', '1'], expected: '[300,100,200]' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '10'], expected: '[1,2,3,4,5,6,7,8,9,10]' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5'], expected: '[6,7,8,9,10,1,2,3,4,5]' },
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
