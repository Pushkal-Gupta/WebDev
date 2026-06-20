#!/usr/bin/env node
// Batch 43: binary search classics.

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
    id: 'first-bad-version',
    method_name: 'firstBadVersion',
    params: [{ name: 'n', type: 'int' }, { name: 'firstBad', type: 'int' }],
    return_type: 'int',
    hints: [
      'Versions are sequential. Once bad, all later are bad.',
      'Binary search on [1, n] looking for the leftmost bad version.',
      'lo = 1, hi = n. mid = lo + (hi - lo) / 2. If isBad(mid), hi = mid; else lo = mid + 1.',
      'Loop until lo == hi. Return lo.',
      'O(log n) API calls.',
    ],
    tags: ['binary-search', 'interactive'],
    constraints: '1 ≤ firstBad ≤ n ≤ 2^31 − 1',
    follow_up: 'Adaptive search — exponential probe first if firstBad is expected near 1.',
    pattern: 'binary-search-leftmost',
    test_cases: [
      { inputs: ['5', '4'], expected: '4' },
      { inputs: ['1', '1'], expected: '1' },
      { inputs: ['10', '1'], expected: '1' },
      { inputs: ['10', '10'], expected: '10' },
      { inputs: ['10', '5'], expected: '5' },
      { inputs: ['100', '50'], expected: '50' },
      { inputs: ['1000', '1'], expected: '1' },
      { inputs: ['1000', '1000'], expected: '1000' },
      { inputs: ['2147483647', '1702766719'], expected: '1702766719' },
      { inputs: ['7', '5'], expected: '5' },
      { inputs: ['2', '1'], expected: '1' },
      { inputs: ['2', '2'], expected: '2' },
    ],
  },
  {
    id: 'search-insert-position',
    method_name: 'searchInsert',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'int',
    hints: [
      'Find leftmost index i where nums[i] >= target.',
      'lo = 0, hi = n. While lo < hi: if nums[mid] < target, lo = mid+1 else hi = mid.',
      'Return lo.',
      'O(log n) time, O(1) space.',
      'Edge: target > all elements → return n.',
    ],
    tags: ['array', 'binary-search'],
    constraints: '1 ≤ nums.length ≤ 10^4\n-10^4 ≤ nums[i], target ≤ 10^4\nnums is sorted ascending and contains distinct integers.',
    follow_up: '"Find First and Last Position" — two binary searches (leftmost and rightmost).',
    pattern: 'binary-search-leftmost-gte',
    test_cases: [
      { inputs: ['[1,3,5,6]', '5'], expected: '2' },
      { inputs: ['[1,3,5,6]', '2'], expected: '1' },
      { inputs: ['[1,3,5,6]', '7'], expected: '4' },
      { inputs: ['[1,3,5,6]', '0'], expected: '0' },
      { inputs: ['[1]', '0'], expected: '0' },
      { inputs: ['[1]', '1'], expected: '0' },
      { inputs: ['[1]', '2'], expected: '1' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5'], expected: '4' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '11'], expected: '10' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '0'], expected: '0' },
      { inputs: ['[-5,-3,-1,0,2,4]', '-2'], expected: '2' },
      { inputs: ['[-5,-3,-1,0,2,4]', '4'], expected: '5' },
      { inputs: ['[-5,-3,-1,0,2,4]', '5'], expected: '6' },
    ],
  },
  {
    id: 'koko-eating-bananas',
    method_name: 'minEatingSpeed',
    params: [{ name: 'piles', type: 'List[int]' }, { name: 'h', type: 'int' }],
    return_type: 'int',
    hints: [
      'Binary search on the answer (speed K).',
      'Check function: hoursAt(K) = sum over piles of ceil(p / K). Valid iff ≤ h.',
      'lo = 1, hi = max(piles). Find leftmost K with hoursAt(K) ≤ h.',
      'O(n log max(piles)) time.',
      'ceil(a/b) without floats: (a + b - 1) / b.',
    ],
    tags: ['array', 'binary-search'],
    constraints: '1 ≤ piles.length ≤ 10^4\npiles.length ≤ h ≤ 10^9\n1 ≤ piles[i] ≤ 10^9',
    follow_up: '"Capacity to Ship Packages Within D Days" — same parametric binary search.',
    pattern: 'binary-search-on-answer',
    test_cases: [
      { inputs: ['[3,6,7,11]', '8'], expected: '4' },
      { inputs: ['[30,11,23,4,20]', '5'], expected: '30' },
      { inputs: ['[30,11,23,4,20]', '6'], expected: '23' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[1]', '2'], expected: '1' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '5' },
      { inputs: ['[1,2,3,4,5]', '15'], expected: '1' },
      { inputs: ['[1000000000]', '1'], expected: '1000000000' },
      { inputs: ['[1000000000]', '2'], expected: '500000000' },
      { inputs: ['[805306368,805306368,805306368]', '1000000000'], expected: '3' },
      { inputs: ['[1,1,1,1,1]', '10'], expected: '1' },
      { inputs: ['[100,200,300]', '3'], expected: '300' },
      { inputs: ['[100,200,300]', '6'], expected: '100' },
    ],
  },
  {
    id: 'split-array-largest-sum',
    method_name: 'splitArray',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Binary search on the answer (max-subarray-sum after split).',
      'lo = max(nums); hi = sum(nums).',
      'Check function: greedy partition starting fresh whenever running sum exceeds candidate. Count splits.',
      'If splits ≤ k, candidate works; lower the upper bound. Else raise the lower bound.',
      'O(n log sum) time.',
    ],
    tags: ['array', 'binary-search', 'dp', 'greedy'],
    constraints: '1 ≤ nums.length ≤ 1000\n0 ≤ nums[i] ≤ 10^6\n1 ≤ k ≤ min(50, nums.length)',
    follow_up: 'DP version: dp[i][k] = min over splits. O(n²k) — too slow for n=1000.',
    pattern: 'binary-search-on-answer',
    test_cases: [
      { inputs: ['[7,2,5,10,8]', '2'], expected: '18' },
      { inputs: ['[1,2,3,4,5]', '2'], expected: '9' },
      { inputs: ['[1,4,4]', '3'], expected: '4' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '5' },
      { inputs: ['[1,2,3,4,5]', '1'], expected: '15' },
      { inputs: ['[10,10,10]', '3'], expected: '10' },
      { inputs: ['[10,10,10]', '1'], expected: '30' },
      { inputs: ['[0,0,0]', '2'], expected: '0' },
      { inputs: ['[1000000]', '1'], expected: '1000000' },
      { inputs: ['[7,2,5,10,8]', '3'], expected: '14' },
      { inputs: ['[7,2,5,10,8]', '5'], expected: '10' },
    ],
  },
  {
    id: 'aggressive-cows',
    method_name: 'aggressiveCows',
    params: [{ name: 'stalls', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Place k cows in stalls so that the minimum distance between any two cows is MAXIMIZED.',
      'Sort stalls. Binary search the answer d.',
      'Check: greedily place a cow at the first stall, then at the next stall ≥ last + d. Count placements.',
      'If placements ≥ k, d works; try larger. Else smaller.',
      'O(n log range) time.',
    ],
    tags: ['array', 'binary-search', 'greedy'],
    constraints: '2 ≤ stalls.length ≤ 10^5\n2 ≤ k ≤ stalls.length\n0 ≤ stalls[i] ≤ 10^9',
    follow_up: 'Variant: minimize the maximum distance instead — same binary-search trick with flipped check.',
    pattern: 'binary-search-on-answer-greedy-check',
    test_cases: [
      { inputs: ['[1,2,4,8,9]', '3'], expected: '3' },
      { inputs: ['[10,1,2,7,5]', '3'], expected: '4' },
      { inputs: ['[1,2,3,4,7]', '3'], expected: '3' },
      { inputs: ['[1,2]', '2'], expected: '1' },
      { inputs: ['[1,5]', '2'], expected: '4' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5'], expected: '2' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '2'], expected: '9' },
      { inputs: ['[0,100,200]', '3'], expected: '100' },
      { inputs: ['[0,3,5,8,12,18]', '4'], expected: '4' },
      { inputs: ['[1,2,5,9,12]', '2'], expected: '11' },
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
