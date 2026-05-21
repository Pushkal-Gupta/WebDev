#!/usr/bin/env node
// Batch 54: design heavies (LRU, LFU, min stack) + linked-list pointer tricks.

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
    id: 'lru-cache',
    method_name: 'lruOps',
    params: [{ name: 'ops', type: 'List[str]' }, { name: 'args', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    hints: [
      'Hash map + doubly-linked list = O(1) for get and put.',
      'Map key → node. List orders by recency: head = most-recent, tail = least-recent.',
      'get(k): if exists, move node to head; return value. Else -1.',
      'put(k, v): if exists, update + move to head. Else add new at head; evict tail if over capacity.',
      'Constructor args: [capacity]. Ops "put" use args[0,1]; "get" uses args[0]; -1 for missing.',
    ],
    tags: ['hash-map', 'linked-list', 'design'],
    constraints: '1 ≤ capacity ≤ 3000\n1 ≤ ops.length ≤ 2·10^5\nops[i] in {"init","get","put"}',
    follow_up: 'Use Python OrderedDict for free O(1). Or Java LinkedHashMap with removeEldestEntry.',
    pattern: 'hashmap-plus-dll',
    test_cases: [
      { inputs: ['["init","put","put","get","put","get","put","get","get","get"]', '[[2],[1,1],[2,2],[1,-1],[3,3],[2,-1],[4,4],[1,-1],[3,-1],[4,-1]]'], expected: '[1,-1,-1,3,4]' },
      { inputs: ['["init","put","get"]', '[[1],[1,10],[1,-1]]'], expected: '[10]' },
      { inputs: ['["init","get"]', '[[1],[1,-1]]'], expected: '[-1]' },
      { inputs: ['["init","put","put","put","get","get","get"]', '[[2],[1,1],[2,2],[3,3],[1,-1],[2,-1],[3,-1]]'], expected: '[-1,2,3]' },
      { inputs: ['["init","put","put","get","put","get"]', '[[2],[1,1],[2,2],[1,-1],[3,3],[1,-1]]'], expected: '[1,1]' },
    ],
  },
  {
    id: 'lfu-cache',
    method_name: 'lfuOps',
    params: [{ name: 'ops', type: 'List[str]' }, { name: 'args', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    hints: [
      'Three maps: key → (value, freq), freq → DLL of keys with that freq, key → node.',
      'minFreq tracks the smallest non-empty freq bucket.',
      'get(k): bump freq; move node from old bucket to new. If old bucket empty and was minFreq, increment minFreq.',
      'put(k, v): if at capacity, evict tail of minFreq bucket. Insert new with freq=1; reset minFreq=1.',
      'Each op is O(1).',
    ],
    tags: ['hash-map', 'linked-list', 'design'],
    constraints: '1 ≤ capacity ≤ 10^4\n1 ≤ ops.length ≤ 10^5',
    follow_up: 'Implement on top of Redis-like sorted set.',
    pattern: 'two-level-hashmap-dll',
    test_cases: [
      { inputs: ['["init","put","put","get","put","get","get","put","get","get","get"]', '[[2],[1,1],[2,2],[1,-1],[3,3],[2,-1],[3,-1],[4,4],[1,-1],[3,-1],[4,-1]]'], expected: '[1,-1,3,-1,3,4]' },
      { inputs: ['["init","get"]', '[[2],[2,-1]]'], expected: '[-1]' },
      { inputs: ['["init","put","get"]', '[[1],[1,1],[1,-1]]'], expected: '[1]' },
      { inputs: ['["init","put","put","put","get","get","get"]', '[[2],[1,1],[2,2],[3,3],[1,-1],[2,-1],[3,-1]]'], expected: '[-1,2,3]' },
    ],
  },
  {
    id: 'min-stack',
    method_name: 'minStackOps',
    params: [{ name: 'ops', type: 'List[str]' }, { name: 'args', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Auxiliary stack stores running min — push min(x, top of aux) for each push.',
      'pop pops both stacks in lockstep.',
      'getMin returns aux.top.',
      'O(1) per operation.',
      'Space-saver: store only when a new strict min comes in, with a count for repeats.',
    ],
    tags: ['stack', 'design'],
    constraints: '1 ≤ ops.length ≤ 3·10^4\nops[i] in {"push","pop","top","getMin"}\nargs[i] is value for "push", else 0',
    follow_up: 'Min queue via two min-stacks.',
    pattern: 'aux-stack',
    test_cases: [
      { inputs: ['["push","push","push","getMin","pop","top","getMin"]', '[-2,0,-3,0,0,0,0]'], expected: '[-3,0,-2]' },
      { inputs: ['["push","getMin"]', '[5,0]'], expected: '[5]' },
      { inputs: ['["push","push","getMin","pop","getMin"]', '[1,2,0,0,0]'], expected: '[1,1]' },
      { inputs: ['["push","push","push","top","getMin"]', '[3,2,1,0,0]'], expected: '[1,1]' },
      { inputs: ['["push","push","pop","top"]', '[1,2,0,0]'], expected: '[1]' },
    ],
  },
  {
    id: 'copy-list-random-pointer',
    method_name: 'copyRandomList',
    params: [
      { name: 'nodes', type: 'List[int]' },
      { name: 'randoms', type: 'List[int]' },
    ],
    return_type: 'List[List[int]]',
    hints: [
      'Pass 1: clone each node A as A\'. Splice into list: A → A\' → B → B\' ...',
      'Pass 2: set A\'.random = A.random.next (which is A.random\'s clone).',
      'Pass 3: unsplice — restore A.next = B and set A\'.next = B\'.',
      'O(n) time, O(1) extra space.',
      'Hash-map alternative: O(n) extra for old → new mapping; two passes.',
    ],
    tags: ['linked-list', 'hash-map'],
    constraints: '0 ≤ nodes.length ≤ 1000\nrandom[i] = index of random target, or -1 for null',
    follow_up: 'Generic deep-copy of arbitrary object graph — visited map essential.',
    pattern: 'interleave-clone-unsplice',
    test_cases: [
      { inputs: ['[7,13,11,10,1]', '[-1,0,4,2,0]'], expected: '[[7,-1],[13,0],[11,4],[10,2],[1,0]]' },
      { inputs: ['[1,2]', '[1,1]'], expected: '[[1,1],[2,1]]' },
      { inputs: ['[3,3,3]', '[-1,0,-1]'], expected: '[[3,-1],[3,0],[3,-1]]' },
      { inputs: ['[]', '[]'], expected: '[]' },
      { inputs: ['[1]', '[-1]'], expected: '[[1,-1]]' },
      { inputs: ['[1]', '[0]'], expected: '[[1,0]]' },
    ],
  },
  {
    id: 'median-of-two-sorted-arrays',
    method_name: 'findMedianSortedArrays',
    params: [{ name: 'nums1', type: 'List[int]' }, { name: 'nums2', type: 'List[int]' }],
    return_type: 'float',
    hints: [
      'Binary search the smaller array. We seek a partition (i, j) such that left halves combined have (m+n+1)/2 elements.',
      'Check the boundary: nums1[i-1] <= nums2[j] AND nums2[j-1] <= nums1[i].',
      'If nums1[i-1] > nums2[j], move i left; else move i right.',
      'Median: if total is odd → max(left); else (max(left) + min(right)) / 2.',
      'O(log min(m,n)) time, O(1) space.',
    ],
    tags: ['array', 'binary-search', 'divide-and-conquer'],
    constraints: '0 ≤ m, n ≤ 1000\n1 ≤ m + n ≤ 2000\n-10^6 ≤ nums[i] ≤ 10^6',
    follow_up: 'kth element of two sorted arrays — same partition trick.',
    pattern: 'partition-binary-search',
    test_cases: [
      { inputs: ['[1,3]', '[2]'], expected: '2.00000' },
      { inputs: ['[1,2]', '[3,4]'], expected: '2.50000' },
      { inputs: ['[0,0]', '[0,0]'], expected: '0.00000' },
      { inputs: ['[]', '[1]'], expected: '1.00000' },
      { inputs: ['[2]', '[]'], expected: '2.00000' },
      { inputs: ['[1,2]', '[-1,3]'], expected: '1.50000' },
      { inputs: ['[1,3,8,9,15]', '[7,11,18,19,21,25]'], expected: '11.00000' },
      { inputs: ['[1,2,3,4,5]', '[6,7,8,9,10]'], expected: '5.50000' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '[]'], expected: '5.50000' },
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
