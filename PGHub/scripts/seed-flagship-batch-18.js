#!/usr/bin/env node
// Batch 18: linked list + array classics.

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
    id: 'detect-cycle-ii',
    method_name: 'detectCycle',
    params: [{ name: 'values', type: 'List[int]' }, { name: 'pos', type: 'int' }],
    return_type: 'int',
    hints: [
      'Floyd\'s tortoise & hare. Phase 1: detect a cycle exists (slow == fast).',
      'Phase 2: reset one pointer to head. Walk both at speed 1.',
      'They meet at the cycle entrance. Math proof: distances work out.',
      'If fast hits null at any point, no cycle → return -1 (or null in language).',
      'O(n) time, O(1) space.',
    ],
    tags: ['linked-list', 'two-pointers'],
    constraints: '0 ≤ list length ≤ 10^4\npos is -1 (no cycle) or 0..length-1',
    follow_up: 'Without modifying the list, no O(1) algorithm other than Floyd\'s exists.',
    pattern: 'floyd-cycle-detection',
    test_cases: [
      { inputs: ['[3,2,0,-4]', '1'], expected: '1' },
      { inputs: ['[1,2]', '0'], expected: '0' },
      { inputs: ['[1]', '-1'], expected: '-1' },
      { inputs: ['[]', '-1'], expected: '-1' },
      { inputs: ['[1,2,3,4,5]', '-1'], expected: '-1' },
      { inputs: ['[1,2,3,4,5]', '0'], expected: '0' },
      { inputs: ['[1,2,3,4,5]', '4'], expected: '4' },
      { inputs: ['[1,2,3,4,5]', '2'], expected: '2' },
      { inputs: ['[7]', '0'], expected: '0' },
      { inputs: ['[1,2]', '-1'], expected: '-1' },
      { inputs: ['[1,1,1,1]', '0'], expected: '0' },
      { inputs: ['[10,20,30,40,50]', '3'], expected: '3' },
      { inputs: ['[1,2,3,4,5,6,7]', '6'], expected: '6' },
    ],
  },
  {
    id: 'remove-duplicates-sorted',
    method_name: 'removeDuplicates',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Array is sorted. Two-pointer technique.',
      'Slow pointer marks the position for the next unique element.',
      'Fast pointer scans. When nums[fast] != nums[slow], copy and bump slow.',
      'Return slow + 1 (length of unique prefix).',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'two-pointers'],
    constraints: '1 ≤ nums.length ≤ 3·10^4\n-100 ≤ nums[i] ≤ 100\nnums is sorted in non-decreasing order.',
    follow_up: '"Remove Duplicates from Sorted Array II" — keep at most two of each value.',
    pattern: 'two-pointer-in-place',
    test_cases: [
      { inputs: ['[1,1,2]'], expected: '2' },
      { inputs: ['[0,0,1,1,1,2,2,3,3,4]'], expected: '5' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,1]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '2' },
      { inputs: ['[1,2,3]'], expected: '3' },
      { inputs: ['[1,1,1,1]'], expected: '1' },
      { inputs: ['[1,2,3,4,5]'], expected: '5' },
      { inputs: ['[-3,-1,0,0,0,3,3]'], expected: '4' },
      { inputs: ['[-100,-50,0,50,100]'], expected: '5' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[5,5,5,5,5,5,5,5,5,5]'], expected: '1' },
      { inputs: ['[1,1,2,2,3,3,4,4,5,5]'], expected: '5' },
    ],
  },
  {
    id: 'remove-duplicates-from-sorted-list',
    method_name: 'deleteDuplicates',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'List is sorted, so duplicates are always adjacent.',
      'Walk with one pointer cur. If cur.val == cur.next.val, splice cur.next out.',
      'Otherwise advance cur.',
      'Watch for null cur.next at the end of list.',
      'O(n) time, O(1) space.',
    ],
    tags: ['linked-list'],
    constraints: '0 ≤ list length ≤ 300\n-100 ≤ Node.val ≤ 100\nList is sorted ascending.',
    follow_up: '"Remove Duplicates from Sorted List II" — remove ALL duplicates (don\'t even keep one).',
    pattern: 'linked-list-splice',
    test_cases: [
      { inputs: ['[1,1,2]'], expected: '[1,2]' },
      { inputs: ['[1,1,2,3,3]'], expected: '[1,2,3]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,1]'], expected: '[1]' },
      { inputs: ['[1,1,1,1]'], expected: '[1]' },
      { inputs: ['[1,2,3]'], expected: '[1,2,3]' },
      { inputs: ['[1,1,2,2,3,3]'], expected: '[1,2,3]' },
      { inputs: ['[-100,-50,0,50,100]'], expected: '[-100,-50,0,50,100]' },
      { inputs: ['[-100,-100,-50,0,0]'], expected: '[-100,-50,0]' },
      { inputs: ['[0]'], expected: '[0]' },
      { inputs: ['[5,5,5,5,5,5,5]'], expected: '[5]' },
    ],
  },
  {
    id: 'majority-element',
    method_name: 'majorityElement',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Majority appears > n/2 times. So a count-then-sort gives it as the median or the max-count entry.',
      'O(n log n) sort, return nums[n/2].',
      'O(n) Boyer-Moore vote: counter += 1 when match, -= 1 when mismatch, reset candidate when counter == 0.',
      'Hashmap of counts works too; O(n) time and space.',
      'Boyer-Moore is O(n) time, O(1) space — the canonical answer.',
    ],
    tags: ['array', 'hash-map', 'boyer-moore'],
    constraints: '1 ≤ nums.length ≤ 5·10^4\n-10^9 ≤ nums[i] ≤ 10^9\nA majority element always exists.',
    follow_up: '"Majority Element II" — return all elements appearing > n/3 times. Boyer-Moore with two candidates.',
    pattern: 'boyer-moore-voting',
    test_cases: [
      { inputs: ['[3,2,3]'], expected: '3' },
      { inputs: ['[2,2,1,1,1,2,2]'], expected: '2' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,1]'], expected: '1' },
      { inputs: ['[1,1,1]'], expected: '1' },
      { inputs: ['[1,2,1,2,1]'], expected: '1' },
      { inputs: ['[-1,-1,-1,-2]'], expected: '-1' },
      { inputs: ['[5,5,5,5,5,5,5,5,5,1]'], expected: '5' },
      { inputs: ['[1,1,1,2,3]'], expected: '1' },
      { inputs: ['[6,5,5]'], expected: '5' },
      { inputs: ['[8,8,7,7,7]'], expected: '7' },
      { inputs: ['[0,0,0]'], expected: '0' },
      { inputs: ['[1000000000,1000000000,2]'], expected: '1000000000' },
      { inputs: ['[3,3,4]'], expected: '3' },
    ],
  },
  {
    id: 'squares-sorted-array',
    method_name: 'sortedSquares',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Squaring may shuffle the order — e.g., [-7,-3,2,3,11] → [49,9,4,9,121].',
      'Naive: square each then sort → O(n log n).',
      'Better: two pointers. Largest square comes from one of the ends.',
      'Place results from the back of an output array. Move whichever end has the bigger absolute value.',
      'O(n) time, O(n) space (output).',
    ],
    tags: ['array', 'two-pointers'],
    constraints: '1 ≤ nums.length ≤ 10^4\n-10^4 ≤ nums[i] ≤ 10^4\nnums is sorted ascending.',
    follow_up: 'In-place version is possible if you can use a deque or write right-to-left into the same array.',
    pattern: 'two-pointer-merge',
    test_cases: [
      { inputs: ['[-4,-1,0,3,10]'], expected: '[0,1,9,16,100]' },
      { inputs: ['[-7,-3,2,3,11]'], expected: '[4,9,9,49,121]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[-1]'], expected: '[1]' },
      { inputs: ['[0]'], expected: '[0]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[1,4,9,16,25]' },
      { inputs: ['[-5,-4,-3,-2,-1]'], expected: '[1,4,9,16,25]' },
      { inputs: ['[-2,-1,0,1,2]'], expected: '[0,1,1,4,4]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[-10000,-100,0,100,10000]'], expected: '[0,10000,10000,100000000,100000000]' },
      { inputs: ['[-1,0,1]'], expected: '[0,1,1]' },
      { inputs: ['[-3,-2,-1]'], expected: '[1,4,9]' },
      { inputs: ['[3,3,3]'], expected: '[9,9,9]' },
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
