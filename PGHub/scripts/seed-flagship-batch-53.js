#!/usr/bin/env node
// Batch 53: stock + subarray heavies.

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
    id: 'best-time-to-buy-sell-stock',
    method_name: 'maxProfit',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Track lowest price seen so far.',
      'For each day, profit candidate = price - lowest_so_far.',
      'Update answer with max of candidate; update lowest with min(lowest, price).',
      'O(n) time, O(1) space.',
      'Equivalent to "max delta in a 1-pass scan" — Kadane variant.',
    ],
    tags: ['array', 'dp', 'greedy'],
    constraints: '1 ≤ prices.length ≤ 10^5\n0 ≤ prices[i] ≤ 10^4',
    follow_up: 'Stock II (multiple transactions): sum every positive diff. Stock III/IV: state DP. Cooldown: DP with rest state.',
    pattern: 'single-pass-min-tracker',
    test_cases: [
      { inputs: ['[7,1,5,3,6,4]'], expected: '5' },
      { inputs: ['[7,6,4,3,1]'], expected: '0' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[2,1]'], expected: '0' },
      { inputs: ['[1,2,3,4,5]'], expected: '4' },
      { inputs: ['[5,4,3,2,1]'], expected: '0' },
      { inputs: ['[3,2,6,5,0,3]'], expected: '4' },
      { inputs: ['[2,1,2,1,0,1,2]'], expected: '2' },
      { inputs: ['[1,1,1,1,1]'], expected: '0' },
      { inputs: ['[10000,1]'], expected: '0' },
      { inputs: ['[1,10000]'], expected: '9999' },
    ],
  },
  {
    id: 'max-product-subarray',
    method_name: 'maxProduct',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Track BOTH max and min running products — a negative * min flips into a large max.',
      'For each x: new_max = max(x, max*x, min*x). new_min = min(x, max*x, min*x).',
      'Track global answer across all positions.',
      'O(n) time, O(1) space.',
      'Watch zeros: they reset both running products.',
    ],
    tags: ['array', 'dp', 'greedy'],
    constraints: '1 ≤ nums.length ≤ 2·10^4\n-10 ≤ nums[i] ≤ 10\nProduct fits 32-bit',
    follow_up: 'k-element max product — sort + handle negatives carefully.',
    pattern: 'kadane-track-min-max',
    test_cases: [
      { inputs: ['[2,3,-2,4]'], expected: '6' },
      { inputs: ['[-2,0,-1]'], expected: '0' },
      { inputs: ['[-2,3,-4]'], expected: '24' },
      { inputs: ['[0,2]'], expected: '2' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[-1]'], expected: '-1' },
      { inputs: ['[0,0,0]'], expected: '0' },
      { inputs: ['[1,1,1,1]'], expected: '1' },
      { inputs: ['[2,-5,-2,-4,3]'], expected: '24' },
      { inputs: ['[-4,-3,-2]'], expected: '12' },
      { inputs: ['[-2,-3,7]'], expected: '42' },
    ],
  },
  {
    id: 'trapping-rain-water',
    method_name: 'trap',
    params: [{ name: 'height', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Water at i = min(maxLeft[i], maxRight[i]) - height[i] if positive.',
      'Prefix arrays: O(n) time, O(n) space.',
      'Two-pointer O(1) space: move whichever side has smaller cap; that side\'s cap stays valid.',
      'Stack-based: pop bars to compute trapped water layer by layer.',
      'O(n) time best.',
    ],
    tags: ['array', 'two-pointers', 'stack', 'dp'],
    constraints: '1 ≤ height.length ≤ 2·10^4\n0 ≤ height[i] ≤ 10^5',
    follow_up: 'Trapping Rain Water II — 2D priority-queue BFS from boundary inward.',
    pattern: 'two-pointer-bounded',
    test_cases: [
      { inputs: ['[0,1,0,2,1,0,1,3,2,1,2,1]'], expected: '6' },
      { inputs: ['[4,2,0,3,2,5]'], expected: '9' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,2]'], expected: '0' },
      { inputs: ['[2,1]'], expected: '0' },
      { inputs: ['[3,0,3]'], expected: '3' },
      { inputs: ['[5,4,3,2,1]'], expected: '0' },
      { inputs: ['[1,2,3,4,5]'], expected: '0' },
      { inputs: ['[2,0,2]'], expected: '2' },
      { inputs: ['[0,0,0]'], expected: '0' },
      { inputs: ['[5,2,1,2,1,5]'], expected: '14' },
    ],
  },
  {
    id: 'find-min-rotated',
    method_name: 'findMin',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Binary search for the inflection (unique minimum).',
      'lo, hi pointers. Mid: compare nums[mid] with nums[hi].',
      'If nums[mid] > nums[hi]: pivot is to the right; lo = mid + 1.',
      'Else pivot is mid or to the left; hi = mid.',
      'O(log n) time. Returns nums[lo].',
    ],
    tags: ['array', 'binary-search'],
    constraints: '1 ≤ nums.length ≤ 5000\nAll elements distinct\nArray was rotated 0..n-1 times',
    follow_up: 'With duplicates — worst case O(n); shrink hi when nums[mid] == nums[hi].',
    pattern: 'binary-search-inflection',
    test_cases: [
      { inputs: ['[3,4,5,1,2]'], expected: '1' },
      { inputs: ['[4,5,6,7,0,1,2]'], expected: '0' },
      { inputs: ['[11,13,15,17]'], expected: '11' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[2,1]'], expected: '1' },
      { inputs: ['[1,2,3,4,5]'], expected: '1' },
      { inputs: ['[5,1,2,3,4]'], expected: '1' },
      { inputs: ['[2,3,4,5,1]'], expected: '1' },
      { inputs: ['[3,1,2]'], expected: '1' },
      { inputs: ['[5,6,7,8,9,1,2,3,4]'], expected: '1' },
    ],
  },
  {
    id: 'search-in-rotated-sorted-array',
    method_name: 'search',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'int',
    hints: [
      'Binary search with extra "which side is sorted" check.',
      'If nums[lo..mid] is sorted (nums[lo] <= nums[mid]):',
      '  Target in [nums[lo], nums[mid]) → hi = mid - 1; else lo = mid + 1.',
      'Else nums[mid..hi] is sorted:',
      '  Target in (nums[mid], nums[hi]] → lo = mid + 1; else hi = mid - 1.',
      'O(log n) time. Distinct values assumed.',
    ],
    tags: ['array', 'binary-search'],
    constraints: '1 ≤ nums.length ≤ 5000\nAll values distinct\n-10^4 ≤ nums[i], target ≤ 10^4',
    follow_up: 'With duplicates — worst case O(n).',
    pattern: 'binary-search-with-pivot',
    test_cases: [
      { inputs: ['[4,5,6,7,0,1,2]', '0'], expected: '4' },
      { inputs: ['[4,5,6,7,0,1,2]', '3'], expected: '-1' },
      { inputs: ['[1]', '0'], expected: '-1' },
      { inputs: ['[1]', '1'], expected: '0' },
      { inputs: ['[1,3]', '3'], expected: '1' },
      { inputs: ['[3,1]', '1'], expected: '1' },
      { inputs: ['[5,1,3]', '5'], expected: '0' },
      { inputs: ['[5,1,3]', '1'], expected: '1' },
      { inputs: ['[5,1,3]', '3'], expected: '2' },
      { inputs: ['[5,1,3]', '4'], expected: '-1' },
      { inputs: ['[6,7,0,1,2,4,5]', '0'], expected: '2' },
      { inputs: ['[6,7,0,1,2,4,5]', '6'], expected: '0' },
      { inputs: ['[6,7,0,1,2,4,5]', '5'], expected: '6' },
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
