#!/usr/bin/env node
// Batch 37: matrix + 2D classics.

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
    id: 'search-2d-matrix',
    method_name: 'searchMatrix',
    params: [{ name: 'matrix', type: 'List[List[int]]' }, { name: 'target', type: 'int' }],
    return_type: 'bool',
    hints: [
      'Each row is sorted; each row\'s last element < next row\'s first → treat as one sorted 1D array.',
      'Binary search the flattened indices. Index k maps to row k/cols, col k%cols.',
      'O(log(m·n)) time, O(1) space.',
      'Alternative: binary search rows by row[0]/row[-1], then binary search within.',
      'Don\'t treat it as 2D BFS — that\'s the harder "Search a 2D Matrix II".',
    ],
    tags: ['matrix', 'binary-search'],
    constraints: '1 ≤ m, n ≤ 100\n-10^4 ≤ matrix[i][j] ≤ 10^4',
    follow_up: '"Search a 2D Matrix II" — each row AND each column sorted, but no cross-row guarantee. Saddle-back search in O(m + n).',
    pattern: 'flatten-to-1d-binary-search',
    test_cases: [
      { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '3'], expected: 'true' },
      { inputs: ['[[1,3,5,7],[10,11,16,20],[23,30,34,60]]', '13'], expected: 'false' },
      { inputs: ['[[1]]', '1'], expected: 'true' },
      { inputs: ['[[1]]', '2'], expected: 'false' },
      { inputs: ['[[1,3]]', '3'], expected: 'true' },
      { inputs: ['[[1,3]]', '2'], expected: 'false' },
      { inputs: ['[[1],[3]]', '3'], expected: 'true' },
      { inputs: ['[[1],[3]]', '2'], expected: 'false' },
      { inputs: ['[[-10,-5,0,5],[10,15,20,25]]', '-5'], expected: 'true' },
      { inputs: ['[[1,2,3,4,5]]', '5'], expected: 'true' },
      { inputs: ['[[1,2,3,4,5]]', '6'], expected: 'false' },
      { inputs: ['[[1],[2],[3],[4],[5]]', '3'], expected: 'true' },
    ],
  },
  {
    id: 'spiral-matrix-ii',
    method_name: 'generateMatrix',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'List[List[int]]',
    hints: [
      'Fill 1..n² in spiral order.',
      'Same bounds (top, bottom, left, right) as Spiral Matrix; write instead of read.',
      'Increment a running counter; shrink bounds after each side.',
      'Stop when counter > n².',
      'O(n²) time, O(n²) for the output.',
    ],
    tags: ['array', 'matrix', 'simulation'],
    constraints: '1 ≤ n ≤ 20',
    follow_up: 'Generate a spiral order specific to a path traversal (e.g., reverse spiral).',
    pattern: 'matrix-fill-with-bounds',
    test_cases: [
      { inputs: ['1'], expected: '[[1]]' },
      { inputs: ['2'], expected: '[[1,2],[4,3]]' },
      { inputs: ['3'], expected: '[[1,2,3],[8,9,4],[7,6,5]]' },
      { inputs: ['4'], expected: '[[1,2,3,4],[12,13,14,5],[11,16,15,6],[10,9,8,7]]' },
      { inputs: ['5'], expected: '[[1,2,3,4,5],[16,17,18,19,6],[15,24,25,20,7],[14,23,22,21,8],[13,12,11,10,9]]' },
    ],
  },
  {
    id: 'pascals-triangle',
    method_name: 'generate',
    params: [{ name: 'numRows', type: 'int' }],
    return_type: 'List[List[int]]',
    hints: [
      'Row i has i+1 elements; ends are 1; middle = sum of two parents.',
      'Build row by row from previous.',
      'O(numRows²) time.',
      'Combinatorial: row i, col j = C(i, j). Useful for "Pascal\'s Triangle II".',
      'Each row is symmetric.',
    ],
    tags: ['array', 'dp', 'math'],
    constraints: '1 ≤ numRows ≤ 30',
    follow_up: '"Pascal\'s Triangle II" — only the k-th row. O(k²) time, O(k) space.',
    pattern: 'row-by-row-build',
    test_cases: [
      { inputs: ['5'], expected: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]' },
      { inputs: ['1'], expected: '[[1]]' },
      { inputs: ['2'], expected: '[[1],[1,1]]' },
      { inputs: ['3'], expected: '[[1],[1,1],[1,2,1]]' },
      { inputs: ['4'], expected: '[[1],[1,1],[1,2,1],[1,3,3,1]]' },
      { inputs: ['6'], expected: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1]]' },
      { inputs: ['7'], expected: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1],[1,5,10,10,5,1],[1,6,15,20,15,6,1]]' },
    ],
  },
  {
    id: 'transpose-of-matrix',
    method_name: 'transpose',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'result[j][i] = matrix[i][j].',
      'Dimensions flip: m × n becomes n × m.',
      'Allocate the result; copy element-wise.',
      'For SQUARE matrices, in-place is possible: swap matrix[i][j] with matrix[j][i] for i < j.',
      'O(m·n) time, O(m·n) space (or O(1) for in-place square).',
    ],
    tags: ['array', 'matrix'],
    constraints: '1 ≤ m, n ≤ 1000\n-10^9 ≤ matrix[i][j] ≤ 10^9',
    follow_up: 'Sparse matrix transpose — store only non-zero (row, col, val) triples.',
    pattern: 'index-swap',
    test_cases: [
      { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[[1,4,7],[2,5,8],[3,6,9]]' },
      { inputs: ['[[1,2,3],[4,5,6]]'], expected: '[[1,4],[2,5],[3,6]]' },
      { inputs: ['[[1]]'], expected: '[[1]]' },
      { inputs: ['[[1,2]]'], expected: '[[1],[2]]' },
      { inputs: ['[[1],[2]]'], expected: '[[1,2]]' },
      { inputs: ['[[1,2,3]]'], expected: '[[1],[2],[3]]' },
      { inputs: ['[[1],[2],[3]]'], expected: '[[1,2,3]]' },
      { inputs: ['[[0,0],[0,0]]'], expected: '[[0,0],[0,0]]' },
      { inputs: ['[[-1,2,-3],[4,-5,6]]'], expected: '[[-1,4],[2,-5],[-3,6]]' },
    ],
  },
  {
    id: 'median-of-two-sorted-arrays',
    method_name: 'findMedianSortedArrays',
    params: [{ name: 'nums1', type: 'List[int]' }, { name: 'nums2', type: 'List[int]' }],
    return_type: 'number',
    hints: [
      'Trivial: merge → O(m + n) time.',
      'Optimal: binary search on the SHORTER array for the partition that splits the combined array in half.',
      'Partition cuts: i in nums1 and j = (m + n + 1)/2 - i in nums2.',
      'Conditions: nums1[i-1] ≤ nums2[j] AND nums2[j-1] ≤ nums1[i]. Then median is from max(lefts) / min(rights).',
      'O(log min(m, n)) time, O(1) space.',
    ],
    tags: ['array', 'binary-search', 'divide-and-conquer'],
    constraints: '0 ≤ m, n ≤ 1000\nm + n ≥ 1\n-10^6 ≤ nums[i] ≤ 10^6',
    follow_up: '"Kth Smallest in Two Sorted Arrays" — generalize the partition; same log-min technique.',
    pattern: 'binary-search-partition',
    test_cases: [
      { inputs: ['[1,3]', '[2]'], expected: '2' },
      { inputs: ['[1,2]', '[3,4]'], expected: '2.5' },
      { inputs: ['[]', '[1]'], expected: '1' },
      { inputs: ['[1]', '[]'], expected: '1' },
      { inputs: ['[]', '[2,3]'], expected: '2.5' },
      { inputs: ['[1,2,3]', '[4,5,6]'], expected: '3.5' },
      { inputs: ['[1,5,8]', '[2,3,4]'], expected: '3.5' },
      { inputs: ['[1,2]', '[3]'], expected: '2' },
      { inputs: ['[-1,-2]', '[-3,-4]'], expected: '-2.5' },
      { inputs: ['[0,0]', '[0,0]'], expected: '0' },
      { inputs: ['[1,1,1]', '[1,1,1]'], expected: '1' },
      { inputs: ['[2]', '[1,3,5,7,9]'], expected: '3.5' },
      { inputs: ['[100]', '[1,2,3,4,5,6,7,8,9]'], expected: '5.5' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '[11]'], expected: '6' },
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
