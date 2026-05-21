#!/usr/bin/env node
// Batch 19: heap, linked-list, and array classics.

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
    id: 'kth-largest-element',
    method_name: 'findKthLargest',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Sort then index from the end → O(n log n). Always works.',
      'Min-heap of size k: push everything; the root is the k-th largest. O(n log k).',
      'Quickselect: partition around a pivot, recurse only into the side that contains the (n - k)-th index. O(n) average, O(n^2) worst.',
      'Randomized pivot kills the O(n^2) adversarial input.',
      'Counting-sort variant works only if the value range is small.',
    ],
    tags: ['array', 'heap', 'quickselect', 'divide-and-conquer'],
    constraints: '1 ≤ k ≤ nums.length ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4',
    follow_up: '"Kth Largest in a Stream" — maintain a min-heap of size k as elements arrive.',
    pattern: 'quickselect',
    test_cases: [
      { inputs: ['[3,2,1,5,6,4]', '2'], expected: '5' },
      { inputs: ['[3,2,3,1,2,4,5,5,6]', '4'], expected: '4' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[1,2]', '1'], expected: '2' },
      { inputs: ['[1,2]', '2'], expected: '1' },
      { inputs: ['[7,6,5,4,3,2,1]', '3'], expected: '5' },
      { inputs: ['[1,2,3,4,5,6,7]', '3'], expected: '5' },
      { inputs: ['[5,5,5,5,5]', '3'], expected: '5' },
      { inputs: ['[-1,-2,-3,-4,-5]', '2'], expected: '-2' },
      { inputs: ['[10000,-10000,0]', '1'], expected: '10000' },
      { inputs: ['[10000,-10000,0]', '3'], expected: '-10000' },
      { inputs: ['[2,1]', '2'], expected: '1' },
      { inputs: ['[99,99,99,99,99,99,99]', '5'], expected: '99' },
      { inputs: ['[3,3,3,3,4,4,4,5,5,6]', '1'], expected: '6' },
      { inputs: ['[3,3,3,3,4,4,4,5,5,6]', '10'], expected: '3' },
    ],
  },
  {
    id: 'max-product-subarray',
    method_name: 'maxProduct',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Like Kadane\'s but products can flip sign — a big negative * negative = big positive.',
      'Track both the max and min products ending at the current index.',
      'On each step: tmp = max; new_max = max(num, max*num, min*num); new_min = min(num, tmp*num, min*num).',
      'Update global best = max(best, max).',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'dp'],
    constraints: '1 ≤ nums.length ≤ 2·10^4\n-10 ≤ nums[i] ≤ 10\nProduct of any prefix or suffix fits in 32-bit int.',
    follow_up: '"Maximum Product Subarray III" — segment with constraints on length.',
    pattern: 'kadane-with-two-states',
    test_cases: [
      { inputs: ['[2,3,-2,4]'], expected: '6' },
      { inputs: ['[-2,0,-1]'], expected: '0' },
      { inputs: ['[-2,3,-4]'], expected: '24' },
      { inputs: ['[0,2]'], expected: '2' },
      { inputs: ['[-2]'], expected: '-2' },
      { inputs: ['[2]'], expected: '2' },
      { inputs: ['[0]'], expected: '0' },
      { inputs: ['[1,2,3,4]'], expected: '24' },
      { inputs: ['[-1,-2,-3,-4]'], expected: '24' },
      { inputs: ['[-1,-2,-3]'], expected: '6' },
      { inputs: ['[2,-5,-2,-4,3]'], expected: '24' },
      { inputs: ['[0,0,0]'], expected: '0' },
      { inputs: ['[6,-3,-10,0,2]'], expected: '180' },
      { inputs: ['[-2,-3,7]'], expected: '42' },
      { inputs: ['[1,0,-1,2,3,-5,-2]'], expected: '60' },
      { inputs: ['[3,-1,4]'], expected: '4' },
      { inputs: ['[-3,-1,-1]'], expected: '3' },
    ],
  },
  {
    id: 'swap-nodes-pairs',
    method_name: 'swapPairs',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Use a dummy node so the head swap doesn\'t need a special case.',
      'Maintain `prev` pointing to the node before the pair being swapped.',
      'Each iteration: a = prev.next, b = a.next. Reorder prev → b → a → b.next.',
      'Advance prev to a (which is now after b). Stop when prev.next is null or single.',
      'O(n) time, O(1) space.',
    ],
    tags: ['linked-list', 'recursion'],
    constraints: '0 ≤ list length ≤ 100\n0 ≤ Node.val ≤ 100',
    follow_up: '"Reverse Nodes in k-Group" — same idea but reverse k at a time.',
    pattern: 'linked-list-rewire',
    test_cases: [
      { inputs: ['[1,2,3,4]'], expected: '[2,1,4,3]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[2,1]' },
      { inputs: ['[1,2,3]'], expected: '[2,1,3]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[2,1,4,3,5]' },
      { inputs: ['[1,2,3,4,5,6]'], expected: '[2,1,4,3,6,5]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[2,1,4,3,6,5,7]' },
      { inputs: ['[0,0]'], expected: '[0,0]' },
      { inputs: ['[1,1,2,2,3,3]'], expected: '[1,1,2,2,3,3]' },
      { inputs: ['[5,4,3,2,1]'], expected: '[4,5,2,3,1]' },
      { inputs: ['[100,200]'], expected: '[200,100]' },
      { inputs: ['[1,2,3,4,5,6,7,8]'], expected: '[2,1,4,3,6,5,8,7]' },
    ],
  },
  {
    id: 'find-the-duplicate-number',
    method_name: 'findDuplicate',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'n+1 numbers in 1..n; exactly one is duplicated. No modification, O(1) extra space.',
      'Sort → O(n log n), but modifies the array.',
      'Hashset → O(n) space.',
      'Floyd\'s tortoise & hare on the function f(i) = nums[i]. The "cycle entrance" is the duplicate.',
      'O(n) time, O(1) space — the standard answer.',
    ],
    tags: ['array', 'two-pointers', 'binary-search', 'floyd-cycle'],
    constraints: '1 ≤ n ≤ 10^5\nnums.length == n + 1\n1 ≤ nums[i] ≤ n\nExactly one value appears two or more times.',
    follow_up: 'Binary search on the value range — count nums ≤ mid; if > mid, duplicate is in [1, mid].',
    pattern: 'floyd-cycle-on-index',
    test_cases: [
      { inputs: ['[1,3,4,2,2]'], expected: '2' },
      { inputs: ['[3,1,3,4,2]'], expected: '3' },
      { inputs: ['[1,1]'], expected: '1' },
      { inputs: ['[1,1,2]'], expected: '1' },
      { inputs: ['[2,2,2,2,2]'], expected: '2' },
      { inputs: ['[1,2,3,4,4]'], expected: '4' },
      { inputs: ['[1,4,4,2,4,3]'], expected: '4' },
      { inputs: ['[5,4,3,2,1,1]'], expected: '1' },
      { inputs: ['[1,3,4,2,5,5]'], expected: '5' },
      { inputs: ['[2,5,9,6,9,3,8,9,7,1]'], expected: '9' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,1]'], expected: '1' },
      { inputs: ['[3,3,3,3]'], expected: '3' },
      { inputs: ['[5,1,2,3,4,5]'], expected: '5' },
    ],
  },
  {
    id: 'merge-two-sorted',
    method_name: 'mergeTwoLists',
    params: [{ name: 'list1', type: 'List[int]' }, { name: 'list2', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Dummy node + tail pointer. Pick the smaller head, append, advance.',
      'When one list is exhausted, append the rest of the other.',
      'Iterative is cleanest; recursive works too: pick smaller head, recurse on the rest.',
      'O(m + n) time, O(1) extra space (iterative).',
      'No need to allocate new nodes — splice the existing ones.',
    ],
    tags: ['linked-list', 'recursion', 'merge'],
    constraints: '0 ≤ list1.length, list2.length ≤ 50\n-100 ≤ Node.val ≤ 100\nBoth lists are sorted ascending.',
    follow_up: '"Merge k Sorted Lists" — generalize with a min-heap or divide-and-conquer.',
    pattern: 'two-pointer-merge',
    test_cases: [
      { inputs: ['[1,2,4]', '[1,3,4]'], expected: '[1,1,2,3,4,4]' },
      { inputs: ['[]', '[]'], expected: '[]' },
      { inputs: ['[]', '[0]'], expected: '[0]' },
      { inputs: ['[1]', '[]'], expected: '[1]' },
      { inputs: ['[1]', '[2]'], expected: '[1,2]' },
      { inputs: ['[2]', '[1]'], expected: '[1,2]' },
      { inputs: ['[1,3,5]', '[2,4,6]'], expected: '[1,2,3,4,5,6]' },
      { inputs: ['[1,1,1]', '[2,2,2]'], expected: '[1,1,1,2,2,2]' },
      { inputs: ['[-3,-1,2]', '[-2,0,4]'], expected: '[-3,-2,-1,0,2,4]' },
      { inputs: ['[1,2,3,4,5]', '[6,7,8,9,10]'], expected: '[1,2,3,4,5,6,7,8,9,10]' },
      { inputs: ['[5,6,7]', '[1,2,3]'], expected: '[1,2,3,5,6,7]' },
      { inputs: ['[0,0,0]', '[0,0]'], expected: '[0,0,0,0,0]' },
      { inputs: ['[-100,100]', '[-50,50]'], expected: '[-100,-50,50,100]' },
      { inputs: ['[1,3,5,7,9]', '[2,4,6,8,10]'], expected: '[1,2,3,4,5,6,7,8,9,10]' },
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
