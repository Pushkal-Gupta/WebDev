#!/usr/bin/env node
// Batch 46: array + geometry classics.

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
    id: 'remove-element',
    method_name: 'removeElement',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'val', type: 'int' }],
    return_type: 'int',
    hints: [
      'Two-pointer in-place. Slow pointer for write index; fast scans.',
      'When nums[fast] != val, copy to nums[slow] and bump slow.',
      'Return slow (length of compacted prefix).',
      'O(n) time, O(1) space.',
      'Variant: swap with end pointer — fewer writes when val is rare.',
    ],
    tags: ['array', 'two-pointers'],
    constraints: '0 ≤ nums.length ≤ 100\n0 ≤ nums[i], val ≤ 50',
    follow_up: 'Stable order preservation is required here — verify your two-pointer doesn\'t reorder.',
    pattern: 'slow-fast-pointer-compact',
    test_cases: [
      { inputs: ['[3,2,2,3]', '3'], expected: '2' },
      { inputs: ['[0,1,2,2,3,0,4,2]', '2'], expected: '5' },
      { inputs: ['[]', '0'], expected: '0' },
      { inputs: ['[1]', '1'], expected: '0' },
      { inputs: ['[1]', '2'], expected: '1' },
      { inputs: ['[1,1,1,1]', '1'], expected: '0' },
      { inputs: ['[1,2,3]', '4'], expected: '3' },
      { inputs: ['[3,3,3]', '3'], expected: '0' },
      { inputs: ['[2,3,2,3,2]', '2'], expected: '2' },
      { inputs: ['[0,0,0,1]', '0'], expected: '1' },
      { inputs: ['[1,2,3,4,5]', '3'], expected: '4' },
    ],
  },
  {
    id: 'merge-intervals',
    method_name: 'merge',
    params: [{ name: 'intervals', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Sort intervals by start.',
      'Walk: if current overlaps the last merged (current.start ≤ last.end), extend last.end.',
      'Else push current.',
      'O(n log n) sort dominates.',
      'Touching intervals (end == next start) usually merge — confirm requirement.',
    ],
    tags: ['array', 'intervals', 'sorting'],
    constraints: '1 ≤ intervals.length ≤ 10^4\nintervals[i].length == 2\n0 ≤ start ≤ end ≤ 10^4',
    follow_up: 'Online merge (intervals arrive one at a time) — TreeMap / sorted-set data structure.',
    pattern: 'sort-then-sweep',
    test_cases: [
      { inputs: ['[[1,3],[2,6],[8,10],[15,18]]'], expected: '[[1,6],[8,10],[15,18]]' },
      { inputs: ['[[1,4],[4,5]]'], expected: '[[1,5]]' },
      { inputs: ['[[1,4]]'], expected: '[[1,4]]' },
      { inputs: ['[[1,4],[2,3]]'], expected: '[[1,4]]' },
      { inputs: ['[[1,4],[0,4]]'], expected: '[[0,4]]' },
      { inputs: ['[[1,4],[0,0]]'], expected: '[[0,0],[1,4]]' },
      { inputs: ['[[1,2],[3,4],[5,6]]'], expected: '[[1,2],[3,4],[5,6]]' },
      { inputs: ['[[1,10],[2,3],[4,5],[6,7]]'], expected: '[[1,10]]' },
      { inputs: ['[[5,5]]'], expected: '[[5,5]]' },
      { inputs: ['[[1,2],[2,3]]'], expected: '[[1,3]]' },
      { inputs: ['[[0,2],[5,10],[13,23],[24,25]]'], expected: '[[0,2],[5,10],[13,23],[24,25]]' },
      { inputs: ['[[2,3],[2,2],[3,3],[1,3],[5,7],[2,2],[4,6]]'], expected: '[[1,3],[4,7]]' },
    ],
  },
  {
    id: 'container-with-most-water',
    method_name: 'maxArea',
    params: [{ name: 'height', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Two pointers starting at both ends.',
      'Area = min(h[l], h[r]) * (r - l).',
      'Always advance the pointer at the shorter wall — keeping the taller one cannot grow the min.',
      'Track max as you go.',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'two-pointers', 'greedy'],
    constraints: '2 ≤ height.length ≤ 10^5\n0 ≤ height[i] ≤ 10^4',
    follow_up: 'Online updates to heights — segment tree or sparse table.',
    pattern: 'two-pointer-from-ends',
    test_cases: [
      { inputs: ['[1,8,6,2,5,4,8,3,7]'], expected: '49' },
      { inputs: ['[1,1]'], expected: '1' },
      { inputs: ['[4,3,2,1,4]'], expected: '16' },
      { inputs: ['[1,2,1]'], expected: '2' },
      { inputs: ['[2,3,4,5,18,17,6]'], expected: '17' },
      { inputs: ['[1,2,3,4,5]'], expected: '6' },
      { inputs: ['[5,4,3,2,1]'], expected: '6' },
      { inputs: ['[100,100]'], expected: '100' },
      { inputs: ['[0,0,0,0]'], expected: '0' },
      { inputs: ['[1,3]'], expected: '1' },
      { inputs: ['[1,1,1,1,1]'], expected: '4' },
      { inputs: ['[1,1000,1]'], expected: '2' },
      { inputs: ['[1000,1,1000]'], expected: '2000' },
    ],
  },
  {
    id: 'max-points-on-a-line',
    method_name: 'maxPoints',
    params: [{ name: 'points', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'For each point, count how many other points share a slope through it.',
      'Slope (dy/dx) stored as a normalized (dy, dx) pair — divide by gcd, fix sign.',
      'Hashmap: slope → count. Track max + the anchor itself (so add 1).',
      'O(n²) time.',
      'Watch vertical lines (dx = 0) and identical points (dx = dy = 0).',
    ],
    tags: ['array', 'hash-map', 'math', 'geometry'],
    constraints: '1 ≤ points.length ≤ 300\npoints[i] = [x, y]\n-10^4 ≤ x, y ≤ 10^4',
    follow_up: 'Floating-point slopes risk precision bugs — use the normalized (dy, dx) pair instead.',
    pattern: 'pairwise-slope-count',
    test_cases: [
      { inputs: ['[[1,1],[2,2],[3,3]]'], expected: '3' },
      { inputs: ['[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]'], expected: '4' },
      { inputs: ['[[0,0]]'], expected: '1' },
      { inputs: ['[[0,0],[1,1]]'], expected: '2' },
      { inputs: ['[[1,1],[1,1],[1,1]]'], expected: '3' },
      { inputs: ['[[0,0],[1,1],[1,-1]]'], expected: '2' },
      { inputs: ['[[1,1],[2,2],[3,3],[4,4]]'], expected: '4' },
      { inputs: ['[[0,0],[1,0],[2,0],[3,0]]'], expected: '4' },
      { inputs: ['[[0,0],[0,1],[0,2],[0,3]]'], expected: '4' },
    ],
  },
  {
    id: 'shortest-common-supersequence',
    method_name: 'shortestCommonSupersequence',
    params: [{ name: 'str1', type: 'str' }, { name: 'str2', type: 'str' }],
    return_type: 'str',
    hints: [
      'LCS-length DP first: dp[i][j] = LCS of prefixes.',
      'Walk back from (m, n) reconstructing the merged sequence.',
      'If chars match → take it, move diagonally.',
      'Else take whichever side has larger DP value; emit that char.',
      'Final length = m + n - LCS_length.',
    ],
    tags: ['string', 'dp', 'reconstruction'],
    constraints: '1 ≤ str1.length, str2.length ≤ 1000',
    follow_up: 'Shortest common SUPERstring (allowing overlap) — NP-hard in general; greedy approximation.',
    pattern: '2d-dp-with-trace-back',
    test_cases: [
      { inputs: ['"abac"', '"cab"'], expected: 'cabac' },
      { inputs: ['"aaa"', '"aaa"'], expected: 'aaa' },
      { inputs: ['"a"', '"b"'], expected: 'ab' },
      { inputs: ['"abc"', '"abc"'], expected: 'abc' },
      { inputs: ['"abc"', '"def"'], expected: 'abcdef' },
      { inputs: ['""', '""'], expected: '' },
      { inputs: ['"a"', '""'], expected: 'a' },
      { inputs: ['""', '"a"'], expected: 'a' },
      { inputs: ['"abcd"', '"acbd"'], expected: 'abcbd' },
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
