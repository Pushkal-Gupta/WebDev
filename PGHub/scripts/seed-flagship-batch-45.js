#!/usr/bin/env node
// Batch 45: range search + array tricks.

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
    id: 'find-first-and-last-position',
    method_name: 'searchRange',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'Two binary searches: leftmost and rightmost occurrence of target.',
      'For leftmost: bisect_left semantics. For rightmost: bisect_right - 1.',
      'If nums[leftmost] != target, return [-1, -1].',
      'O(log n) time, O(1) space.',
      'Single binary-search variant: search for target ± 0.5 to find the boundaries.',
    ],
    tags: ['array', 'binary-search'],
    constraints: '0 ≤ nums.length ≤ 10^5\n-10^9 ≤ nums[i], target ≤ 10^9\nnums is sorted ascending',
    follow_up: 'Multiple targets at once — sort targets, sweep with two pointers.',
    pattern: 'left-right-binary-search',
    test_cases: [
      { inputs: ['[5,7,7,8,8,10]', '8'], expected: '[3,4]' },
      { inputs: ['[5,7,7,8,8,10]', '6'], expected: '[-1,-1]' },
      { inputs: ['[]', '0'], expected: '[-1,-1]' },
      { inputs: ['[1]', '1'], expected: '[0,0]' },
      { inputs: ['[1]', '0'], expected: '[-1,-1]' },
      { inputs: ['[2,2]', '2'], expected: '[0,1]' },
      { inputs: ['[1,2,3]', '4'], expected: '[-1,-1]' },
      { inputs: ['[1,2,3]', '0'], expected: '[-1,-1]' },
      { inputs: ['[1,1,1,1,1]', '1'], expected: '[0,4]' },
      { inputs: ['[1,2,3,4,5]', '3'], expected: '[2,2]' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '[4,4]' },
      { inputs: ['[1,2,3,4,5]', '1'], expected: '[0,0]' },
      { inputs: ['[1,1,2,2,3,3]', '2'], expected: '[2,3]' },
    ],
  },
  {
    id: 'first-missing-positive',
    method_name: 'firstMissingPositive',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Answer is in [1, n+1].',
      'In-place cyclic sort: try to put value v at index v-1 (when 1 ≤ v ≤ n).',
      'After arranging, scan; first index i where nums[i] != i+1 → return i+1.',
      'If all match, return n+1.',
      'O(n) time, O(1) extra space.',
    ],
    tags: ['array', 'hash-set', 'cyclic-sort'],
    constraints: '1 ≤ nums.length ≤ 10^5\n-2^31 ≤ nums[i] ≤ 2^31 − 1',
    follow_up: 'Sign-marking technique: mark visited indices by negating values.',
    pattern: 'cyclic-sort',
    test_cases: [
      { inputs: ['[1,2,0]'], expected: '3' },
      { inputs: ['[3,4,-1,1]'], expected: '2' },
      { inputs: ['[7,8,9,11,12]'], expected: '1' },
      { inputs: ['[1]'], expected: '2' },
      { inputs: ['[2]'], expected: '1' },
      { inputs: ['[1,2,3]'], expected: '4' },
      { inputs: ['[]'], expected: '1' },
      { inputs: ['[-1,-2,-3]'], expected: '1' },
      { inputs: ['[1,1,1,1]'], expected: '2' },
      { inputs: ['[5,4,3,2,1]'], expected: '6' },
      { inputs: ['[1,1000]'], expected: '2' },
      { inputs: ['[0,0,0]'], expected: '1' },
      { inputs: ['[2147483647]'], expected: '1' },
    ],
  },
  {
    id: 'majority-element-ii',
    method_name: 'majorityElement',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Elements appearing > n/3 times. At most 2 such elements exist.',
      'Boyer-Moore with TWO candidates: c1, count1, c2, count2.',
      'For each num: if matches c1 or c2 increment its count; else if a count is 0 set candidate; else decrement both counts.',
      'Second pass: verify candidates actually exceed n/3.',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'hash-map', 'boyer-moore'],
    constraints: '1 ≤ nums.length ≤ 5·10^4\n-10^9 ≤ nums[i] ≤ 10^9',
    follow_up: 'Generalize to > n/k — k-1 candidates Boyer-Moore.',
    pattern: 'boyer-moore-multi-candidate',
    test_cases: [
      { inputs: ['[3,2,3]'], expected: '[3]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[1,1,1,3,3,2,2,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3,4]'], expected: '[]' },
      { inputs: ['[2,2]'], expected: '[2]' },
      { inputs: ['[1,1,1,1]'], expected: '[1]' },
      { inputs: ['[3,3,4]'], expected: '[3]' },
      { inputs: ['[-1,-1,-1,1,1,1]'], expected: '[-1,1]' },
      { inputs: ['[0,0,0,0]'], expected: '[0]' },
      { inputs: ['[1,1,1,2,3,4,5,6,7,1,1,1]'], expected: '[1]' },
    ],
  },
  {
    id: 'kth-smallest-element',
    method_name: 'kthSmallest',
    params: [{ name: 'arr', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Sort + index: O(n log n). Trivial.',
      'Max-heap of size k: scan, push, pop when size > k. Top is the answer. O(n log k).',
      'Quickselect: partition around random pivot, recurse into one side. O(n) average.',
      'Use Introselect (median-of-medians) for guaranteed O(n).',
      'Counting sort works if value range is small.',
    ],
    tags: ['array', 'heap', 'quickselect'],
    constraints: '1 ≤ k ≤ arr.length ≤ 10^5\n-10^9 ≤ arr[i] ≤ 10^9',
    follow_up: '"K Closest Numbers to X" — sort by |x - val| then take first k.',
    pattern: 'quickselect',
    test_cases: [
      { inputs: ['[7,10,4,3,20,15]', '3'], expected: '7' },
      { inputs: ['[7,10,4,3,20,15]', '4'], expected: '10' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[1,2,3,4,5]', '1'], expected: '1' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '5' },
      { inputs: ['[5,4,3,2,1]', '3'], expected: '3' },
      { inputs: ['[-3,-1,-2]', '2'], expected: '-2' },
      { inputs: ['[3,3,3,3]', '2'], expected: '3' },
      { inputs: ['[1,1,2,2,3,3]', '4'], expected: '2' },
      { inputs: ['[10,20,30,40,50]', '3'], expected: '30' },
      { inputs: ['[1000000000,-1000000000]', '1'], expected: '-1000000000' },
    ],
  },
  {
    id: 'minimum-number-of-platforms',
    method_name: 'minPlatforms',
    params: [{ name: 'arrival', type: 'List[int]' }, { name: 'departure', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Classic sweep line over arrivals/departures.',
      'Sort arrivals and departures separately.',
      'Walk with two pointers; when next arrival ≤ current departure, need another platform; else free one.',
      'Track max concurrent platforms = answer.',
      'O(n log n) sort + O(n) sweep.',
    ],
    tags: ['array', 'sorting', 'greedy', 'sweep-line'],
    constraints: '1 ≤ n ≤ 10^4\n0 ≤ arrival[i], departure[i] ≤ 2359',
    follow_up: 'Heap-based: min-heap of current departure times; pop when arrival comes after top.',
    pattern: 'sweep-line-arrivals-departures',
    test_cases: [
      { inputs: ['[900,940,950,1100,1500,1800]', '[910,1200,1120,1130,1900,2000]'], expected: '3' },
      { inputs: ['[900,1100,1235]', '[1000,1200,1240]'], expected: '1' },
      { inputs: ['[100]', '[200]'], expected: '1' },
      { inputs: ['[1000,1000,1000]', '[1100,1100,1100]'], expected: '3' },
      { inputs: ['[100,200,300]', '[150,250,350]'], expected: '1' },
      { inputs: ['[100,200,300]', '[400,500,600]'], expected: '3' },
      { inputs: ['[]', '[]'], expected: '0' },
      { inputs: ['[0]', '[2359]'], expected: '1' },
      { inputs: ['[10,20,30,40,50]', '[15,25,35,45,55]'], expected: '1' },
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
