#!/usr/bin/env node
// Batch 12: DP + heap classics.

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
    id: 'decode-ways',
    method_name: 'numDecodings',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Build up ways[i] = number of decodings of s[0..i-1].',
      'ways[0] = 1 (empty). ways[1] = 1 if s[0] != "0" else 0.',
      'For i ≥ 2: if s[i-1] != "0", add ways[i-1]. If "10" ≤ s[i-2..i-1] ≤ "26", add ways[i-2].',
      'Result = ways[n].',
      'O(n) time, O(1) space (only last two values matter).',
    ],
    tags: ['string', 'dp'],
    constraints: '1 ≤ s.length ≤ 100\ns contains only digits and may contain leading zero.',
    follow_up: '"Decode Ways II" allows the wildcard "*" — same DP with 9x branching when * appears.',
    pattern: '1d-dp-rolling-pair',
    test_cases: [
      { inputs: ['"12"'], expected: '2' },
      { inputs: ['"226"'], expected: '3' },
      { inputs: ['"06"'], expected: '0' },
      { inputs: ['"10"'], expected: '1' },
      { inputs: ['"27"'], expected: '1' },
      { inputs: ['"11106"'], expected: '2' },
      { inputs: ['"1"'], expected: '1' },
      { inputs: ['"0"'], expected: '0' },
      { inputs: ['"123456789"'], expected: '3' },
      { inputs: ['"111"'], expected: '3' },
      { inputs: ['"1111"'], expected: '5' },
      { inputs: ['"100"'], expected: '0' },
      { inputs: ['"99"'], expected: '1' },
      { inputs: ['"26"'], expected: '2' },
      { inputs: ['"2611055971756562"'], expected: '4' },
    ],
  },
  {
    id: 'unique-paths',
    method_name: 'uniquePaths',
    params: [{ name: 'm', type: 'int' }, { name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'Robot at (0,0) wants to reach (m-1, n-1), moving only right or down.',
      'dp[i][j] = dp[i-1][j] + dp[i][j-1].',
      'Base: top row and left column all = 1.',
      'O(m·n) time and space; can compress to O(min(m,n)) with one row.',
      'Combinatorial formula: C(m+n-2, m-1). O(min(m,n)) without DP.',
    ],
    tags: ['math', 'dp', 'combinatorics'],
    constraints: '1 ≤ m, n ≤ 100\nThe answer is guaranteed to fit in a 32-bit integer.',
    follow_up: 'With obstacles ("Unique Paths II") — set obstacle cells to 0.',
    pattern: '2d-dp-grid',
    test_cases: [
      { inputs: ['3', '7'], expected: '28' },
      { inputs: ['3', '2'], expected: '3' },
      { inputs: ['1', '1'], expected: '1' },
      { inputs: ['1', '10'], expected: '1' },
      { inputs: ['10', '1'], expected: '1' },
      { inputs: ['2', '2'], expected: '2' },
      { inputs: ['7', '3'], expected: '28' },
      { inputs: ['5', '5'], expected: '70' },
      { inputs: ['10', '10'], expected: '48620' },
      { inputs: ['4', '4'], expected: '20' },
      { inputs: ['23', '12'], expected: '193536720' },
      { inputs: ['16', '16'], expected: '155117520' },
      { inputs: ['1', '100'], expected: '1' },
      { inputs: ['100', '1'], expected: '1' },
      { inputs: ['8', '5'], expected: '330' },
    ],
  },
  {
    id: 'minimum-path-sum',
    method_name: 'minPathSum',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Variant of Unique Paths but with weights — minimize the sum along the path.',
      'dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).',
      'Base: dp[0][0] = grid[0][0]; top row/left column are prefix sums.',
      'O(m·n) time. Can do it in place (mutate grid) for O(1) extra space.',
      'Use Dijkstra if you allow all 4 directions (then it\'s shortest path on a weighted graph).',
    ],
    tags: ['array', 'matrix', 'dp'],
    constraints: '1 ≤ rows, cols ≤ 200\n0 ≤ grid[i][j] ≤ 100',
    follow_up: 'Reconstruct the actual path: walk backward following the smaller predecessor at each step.',
    pattern: '2d-dp-grid',
    test_cases: [
      { inputs: ['[[1,3,1],[1,5,1],[4,2,1]]'], expected: '7' },
      { inputs: ['[[1,2,3],[4,5,6]]'], expected: '12' },
      { inputs: ['[[1]]'], expected: '1' },
      { inputs: ['[[0]]'], expected: '0' },
      { inputs: ['[[1,2],[3,4]]'], expected: '7' },
      { inputs: ['[[5]]'], expected: '5' },
      { inputs: ['[[1,1,1],[1,1,1],[1,1,1]]'], expected: '5' },
      { inputs: ['[[0,0,0],[0,0,0]]'], expected: '0' },
      { inputs: ['[[100,1,100],[100,1,100],[100,1,100]]'], expected: '203' },
      { inputs: ['[[1,2,3,4,5]]'], expected: '15' },
      { inputs: ['[[1],[2],[3],[4],[5]]'], expected: '15' },
      { inputs: ['[[9,1,4,8]]'], expected: '22' },
      { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '21' },
      { inputs: ['[[2,1,3],[6,1,2],[1,3,1]]'], expected: '7' },
    ],
  },
  {
    id: 'k-closest-points',
    method_name: 'kClosest',
    params: [{ name: 'points', type: 'List[List[int]]' }, { name: 'k', type: 'int' }],
    return_type: 'List[List[int]]',
    hints: [
      'Compare points by squared Euclidean distance (avoid sqrt).',
      'Simple: sort by distance → O(n log n). Good enough.',
      'Better: max-heap of size k. Push, pop when size > k. O(n log k).',
      'Best for unsorted data: Quickselect on distance, O(n) average.',
      'Return the first k after the chosen ordering. Order among the k doesn\'t matter.',
    ],
    tags: ['array', 'heap', 'quickselect', 'sorting'],
    constraints: '1 ≤ k ≤ points.length ≤ 10^4\n-10^4 ≤ xi, yi ≤ 10^4',
    follow_up: '"Top K Frequent Words" — similar k-selection pattern with a different metric.',
    pattern: 'k-selection',
    test_cases: [
      { inputs: ['[[1,3],[-2,2]]', '1'], expected: '[[-2,2]]' },
      { inputs: ['[[3,3],[5,-1],[-2,4]]', '2'], expected: '[[3,3],[-2,4]]' },
      { inputs: ['[[1,1]]', '1'], expected: '[[1,1]]' },
      { inputs: ['[[0,0]]', '1'], expected: '[[0,0]]' },
      { inputs: ['[[1,0],[0,1]]', '2'], expected: '[[1,0],[0,1]]' },
      { inputs: ['[[5,5],[-5,-5]]', '1'], expected: '[[5,5]]' },
      { inputs: ['[[1,1],[2,2],[3,3]]', '2'], expected: '[[1,1],[2,2]]' },
      { inputs: ['[[10,10],[-10,-10],[1,1]]', '1'], expected: '[[1,1]]' },
      { inputs: ['[[0,1],[1,0]]', '2'], expected: '[[0,1],[1,0]]' },
      { inputs: ['[[3,3],[5,-1],[-2,4],[0,0],[1,1]]', '3'], expected: '[[0,0],[1,1],[3,3]]' },
    ],
  },
  {
    id: 'sort-colors',
    method_name: 'sortColors',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Only 3 distinct values: 0, 1, 2. Two-pass: count each, overwrite.',
      'One-pass: Dutch National Flag. Three pointers — lo for 0s, mid for current, hi for 2s.',
      'Swap nums[mid] left when 0 (lo++, mid++). Right when 2 (hi--). Leave 1 (mid++).',
      'Stop when mid > hi.',
      'O(n) time, O(1) space, single pass.',
    ],
    tags: ['array', 'two-pointers', 'sorting'],
    constraints: '1 ≤ nums.length ≤ 300\nnums[i] ∈ {0, 1, 2}',
    follow_up: 'Generalize to k colors → counting sort is the natural answer for small k.',
    pattern: 'dutch-national-flag',
    test_cases: [
      { inputs: ['[2,0,2,1,1,0]'], expected: '[0,0,1,1,2,2]' },
      { inputs: ['[2,0,1]'], expected: '[0,1,2]' },
      { inputs: ['[0]'], expected: '[0]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[2]'], expected: '[2]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[0,0,0]'], expected: '[0,0,0]' },
      { inputs: ['[1,1,1]'], expected: '[1,1,1]' },
      { inputs: ['[2,2,2]'], expected: '[2,2,2]' },
      { inputs: ['[0,1,2]'], expected: '[0,1,2]' },
      { inputs: ['[2,1,0]'], expected: '[0,1,2]' },
      { inputs: ['[1,2,0]'], expected: '[0,1,2]' },
      { inputs: ['[0,1,0,1,0,1]'], expected: '[0,0,0,1,1,1]' },
      { inputs: ['[2,0,2,0,2,0]'], expected: '[0,0,0,2,2,2]' },
      { inputs: ['[0,0,1,1,2,2,0,1,2]'], expected: '[0,0,0,1,1,1,2,2,2]' },
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
