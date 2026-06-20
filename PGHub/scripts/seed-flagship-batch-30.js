#!/usr/bin/env node
// Batch 30: greedy + intervals.

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
    id: 'gas-station',
    method_name: 'canCompleteCircuit',
    params: [{ name: 'gas', type: 'List[int]' }, { name: 'cost', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'If total gas < total cost → impossible (return -1).',
      'Otherwise a unique start exists. Greedy: walk the array tracking tank.',
      'When tank goes negative at station i, the answer can\'t be in [start, i]. Reset start = i+1, tank = 0.',
      'O(n) time, O(1) space.',
      'Proof: any failing prefix can\'t contain the start, so jump past it.',
    ],
    tags: ['array', 'greedy'],
    constraints: 'n == gas.length == cost.length\n1 ≤ n ≤ 10^5\n0 ≤ gas[i], cost[i] ≤ 10^4',
    follow_up: 'Brute force: try every start with simulation — O(n²). Greedy is asymptotically optimal.',
    pattern: 'one-pass-reset',
    test_cases: [
      { inputs: ['[1,2,3,4,5]', '[3,4,5,1,2]'], expected: '3' },
      { inputs: ['[2,3,4]', '[3,4,3]'], expected: '-1' },
      { inputs: ['[5,1,2,3,4]', '[4,4,1,5,1]'], expected: '4' },
      { inputs: ['[1]', '[1]'], expected: '0' },
      { inputs: ['[1]', '[2]'], expected: '-1' },
      { inputs: ['[5,5,5]', '[5,5,5]'], expected: '0' },
      { inputs: ['[2,2,2,2]', '[1,2,3,2]'], expected: '0' },
      { inputs: ['[3,3,4]', '[3,4,4]'], expected: '-1' },
      { inputs: ['[3,1,1]', '[1,2,2]'], expected: '0' },
      { inputs: ['[1,2,3,4,5,6]', '[6,5,4,3,2,1]'], expected: '-1' },
      { inputs: ['[6,5,4,3,2,1]', '[1,2,3,4,5,6]'], expected: '0' },
    ],
  },
  {
    id: 'candy',
    method_name: 'candy',
    params: [{ name: 'ratings', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Two-pass greedy.',
      'Pass 1 (left → right): if ratings[i] > ratings[i-1], candy[i] = candy[i-1] + 1.',
      'Pass 2 (right → left): if ratings[i] > ratings[i+1], candy[i] = max(candy[i], candy[i+1] + 1).',
      'Sum candy[].',
      'O(n) time, O(n) space.',
    ],
    tags: ['array', 'greedy', 'two-pass'],
    constraints: 'n == ratings.length\n1 ≤ n ≤ 2·10^4\n0 ≤ ratings[i] ≤ 2·10^4',
    follow_up: 'O(1) space single-pass using slope counting.',
    pattern: 'two-pass-greedy',
    test_cases: [
      { inputs: ['[1,0,2]'], expected: '5' },
      { inputs: ['[1,2,2]'], expected: '4' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '3' },
      { inputs: ['[2,1]'], expected: '3' },
      { inputs: ['[1,2,3,4,5]'], expected: '15' },
      { inputs: ['[5,4,3,2,1]'], expected: '15' },
      { inputs: ['[1,1,1,1]'], expected: '4' },
      { inputs: ['[1,3,2,2,1]'], expected: '7' },
      { inputs: ['[1,2,87,87,87,2,1]'], expected: '13' },
      { inputs: ['[1,3,4,5,2]'], expected: '11' },
      { inputs: ['[1,2,3,1,0]'], expected: '9' },
    ],
  },
  {
    id: 'partition-labels',
    method_name: 'partitionLabels',
    params: [{ name: 's', type: 'str' }],
    return_type: 'List[int]',
    hints: [
      'Each letter must end up in exactly one partition. Track last index of every letter.',
      'Greedy: extend the current partition\'s end as you walk. When i reaches end, close partition.',
      'O(n) time, O(1) space (26-letter alphabet).',
      'Output: list of partition lengths.',
      'Classic interval-merging pattern in disguise.',
    ],
    tags: ['string', 'greedy', 'two-pointers', 'hash-map'],
    constraints: '1 ≤ s.length ≤ 500\nLowercase English letters',
    follow_up: 'Generalization to "max partitions where each letter appears in exactly k" — same idea with frequency.',
    pattern: 'greedy-extend-window',
    test_cases: [
      { inputs: ['"ababcbacadefegdehijhklij"'], expected: '[9,7,8]' },
      { inputs: ['"eccbbbbdec"'], expected: '[10]' },
      { inputs: ['"a"'], expected: '[1]' },
      { inputs: ['"ab"'], expected: '[1,1]' },
      { inputs: ['"aba"'], expected: '[3]' },
      { inputs: ['"aabb"'], expected: '[2,2]' },
      { inputs: ['"aabbcc"'], expected: '[2,2,2]' },
      { inputs: ['"abcdef"'], expected: '[1,1,1,1,1,1]' },
      { inputs: ['"abcabc"'], expected: '[6]' },
      { inputs: ['"abcabcabc"'], expected: '[9]' },
      { inputs: ['"caedbdedda"'], expected: '[1,9]' },
    ],
  },
  {
    id: 'meeting-rooms-ii',
    method_name: 'minMeetingRooms',
    params: [{ name: 'intervals', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Sort intervals by start. Use a min-heap of end times.',
      'For each interval, if its start ≥ heap top, pop (reuse the room). Push its end.',
      'Heap size at the end = peak concurrent meetings = rooms needed.',
      'Alternative: split into start[] and end[] sorted; two-pointer sweep counting overlaps.',
      'O(n log n) for the sort.',
    ],
    tags: ['array', 'sorting', 'heap', 'greedy'],
    constraints: '0 ≤ intervals.length ≤ 10^4\nintervals[i].length == 2\n0 ≤ start ≤ end ≤ 10^6',
    follow_up: 'Maximum concurrent events / "Meeting Rooms III" with priorities — same sweep with augmented metadata.',
    pattern: 'sweep-line-or-heap',
    test_cases: [
      { inputs: ['[[0,30],[5,10],[15,20]]'], expected: '2' },
      { inputs: ['[[7,10],[2,4]]'], expected: '1' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[[1,5]]'], expected: '1' },
      { inputs: ['[[1,5],[2,3]]'], expected: '2' },
      { inputs: ['[[1,5],[6,10]]'], expected: '1' },
      { inputs: ['[[1,5],[5,10]]'], expected: '1' },
      { inputs: ['[[1,10],[2,9],[3,8],[4,7],[5,6]]'], expected: '5' },
      { inputs: ['[[0,5],[5,10],[10,15],[15,20]]'], expected: '1' },
      { inputs: ['[[1,3],[1,3],[1,3]]'], expected: '3' },
      { inputs: ['[[1,2],[3,4],[1,4]]'], expected: '2' },
      { inputs: ['[[2,11],[6,16],[11,16]]'], expected: '2' },
    ],
  },
  {
    id: 'interval-list-intersections',
    method_name: 'intervalIntersection',
    params: [{ name: 'firstList', type: 'List[List[int]]' }, { name: 'secondList', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Both lists are sorted by start and non-overlapping internally.',
      'Two pointers, one per list. Compute intersection of current pair: [max(a.start, b.start), min(a.end, b.end)].',
      'If start ≤ end, it\'s a valid intersection — add to result.',
      'Advance whichever interval ends earlier.',
      'O(m + n) time.',
    ],
    tags: ['array', 'intervals', 'two-pointers'],
    constraints: '0 ≤ firstList.length, secondList.length ≤ 1000\n0 ≤ start ≤ end ≤ 10^9',
    follow_up: 'Intersection of K sorted interval lists — sweep with a priority queue.',
    pattern: 'two-pointer-sweep',
    test_cases: [
      { inputs: ['[[0,2],[5,10],[13,23],[24,25]]', '[[1,5],[8,12],[15,24],[25,26]]'], expected: '[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]' },
      { inputs: ['[[1,3],[5,9]]', '[]'], expected: '[]' },
      { inputs: ['[]', '[]'], expected: '[]' },
      { inputs: ['[]', '[[1,2]]'], expected: '[]' },
      { inputs: ['[[1,5]]', '[[2,3]]'], expected: '[[2,3]]' },
      { inputs: ['[[1,5]]', '[[6,8]]'], expected: '[]' },
      { inputs: ['[[1,5]]', '[[5,8]]'], expected: '[[5,5]]' },
      { inputs: ['[[1,5],[10,15]]', '[[3,7],[12,20]]'], expected: '[[3,5],[12,15]]' },
      { inputs: ['[[1,3],[5,9]]', '[[2,4]]'], expected: '[[2,3]]' },
      { inputs: ['[[1,7]]', '[[3,10]]'], expected: '[[3,7]]' },
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
