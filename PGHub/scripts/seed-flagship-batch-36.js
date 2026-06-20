#!/usr/bin/env node
// Batch 36: linked list classics — reorder, partition, rotate, add-two, odd-even.

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
    id: 'add-two-numbers',
    method_name: 'addTwoNumbers',
    params: [{ name: 'l1', type: 'List[int]' }, { name: 'l2', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Digits stored in reverse order, so the head is the LEAST significant digit.',
      'Walk both lists adding digit + digit + carry; emit (sum % 10), carry = sum / 10.',
      'When lists are different lengths, treat missing digits as 0.',
      'If carry remains after both lists end, append a node with carry value.',
      'O(max(m, n)) time, O(max(m, n)) space for the result.',
    ],
    tags: ['linked-list', 'math'],
    constraints: '1 ≤ list length ≤ 100\n0 ≤ Node.val ≤ 9\nNo leading zeros (except number 0 itself)',
    follow_up: '"Add Two Numbers II" — digits are stored most-significant-first. Reverse the lists or use a stack.',
    pattern: 'linked-list-arithmetic',
    test_cases: [
      { inputs: ['[2,4,3]', '[5,6,4]'], expected: '[7,0,8]' },
      { inputs: ['[0]', '[0]'], expected: '[0]' },
      { inputs: ['[9,9,9,9,9,9,9]', '[9,9,9,9]'], expected: '[8,9,9,9,0,0,0,1]' },
      { inputs: ['[1]', '[9,9,9]'], expected: '[0,0,0,1]' },
      { inputs: ['[5]', '[5]'], expected: '[0,1]' },
      { inputs: ['[1,2]', '[3,4]'], expected: '[4,6]' },
      { inputs: ['[9]', '[1]'], expected: '[0,1]' },
      { inputs: ['[1,2,3]', '[1,2,3]'], expected: '[2,4,6]' },
      { inputs: ['[0,1]', '[0,1]'], expected: '[0,2]' },
      { inputs: ['[9,9]', '[1]'], expected: '[0,0,1]' },
      { inputs: ['[1,8]', '[0]'], expected: '[1,8]' },
      { inputs: ['[7,2,4,3]', '[5,6,4]'], expected: '[2,9,8,3]' },
    ],
  },
  {
    id: 'reorder-list',
    method_name: 'reorderList',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Three steps: (1) find middle; (2) reverse second half; (3) interleave.',
      'Middle: slow/fast pointers.',
      'Reverse: standard pointer-flip.',
      'Interleave: walk both halves, splicing one node from each.',
      'O(n) time, O(1) extra space.',
    ],
    tags: ['linked-list', 'two-pointers', 'stack'],
    constraints: '1 ≤ list length ≤ 5·10^4\n1 ≤ Node.val ≤ 1000',
    follow_up: 'Variant: reorder L0 → Ln → L1 → Ln-1 → … (the standard problem) vs. interleaving from both ends with a step.',
    pattern: 'split-reverse-merge',
    test_cases: [
      { inputs: ['[1,2,3,4]'], expected: '[1,4,2,3]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[1,5,2,4,3]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3]'], expected: '[1,3,2]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1,2,3,4,5,6]'], expected: '[1,6,2,5,3,4]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[1,7,2,6,3,5,4]' },
      { inputs: ['[10,20]'], expected: '[10,20]' },
      { inputs: ['[1,1,1,1,1]'], expected: '[1,1,1,1,1]' },
    ],
  },
  {
    id: 'partition-list',
    method_name: 'partition',
    params: [{ name: 'head', type: 'List[int]' }, { name: 'x', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'Two dummy heads: `less` and `geq`.',
      'Walk original. Append nodes to `less` if val < x, else to `geq`.',
      'Connect less.tail → geq.head. Terminate geq.tail.next = null.',
      'Preserves relative order within each partition.',
      'O(n) time, O(1) extra space.',
    ],
    tags: ['linked-list', 'two-pointers'],
    constraints: '0 ≤ list length ≤ 200\n-100 ≤ Node.val ≤ 100\n-200 ≤ x ≤ 200',
    follow_up: 'Three-way partition for QuickSelect-on-linked-list. Same dummy-heads trick with three buckets.',
    pattern: 'two-dummy-lists',
    test_cases: [
      { inputs: ['[1,4,3,2,5,2]', '3'], expected: '[1,2,2,4,3,5]' },
      { inputs: ['[2,1]', '2'], expected: '[1,2]' },
      { inputs: ['[]', '0'], expected: '[]' },
      { inputs: ['[1]', '2'], expected: '[1]' },
      { inputs: ['[1]', '0'], expected: '[1]' },
      { inputs: ['[5,4,3,2,1]', '3'], expected: '[2,1,5,4,3]' },
      { inputs: ['[1,2,3,4,5]', '3'], expected: '[1,2,3,4,5]' },
      { inputs: ['[3,3,3,1,1,1]', '3'], expected: '[1,1,1,3,3,3]' },
      { inputs: ['[1,1,1]', '0'], expected: '[1,1,1]' },
      { inputs: ['[5,5,5]', '0'], expected: '[5,5,5]' },
    ],
  },
  {
    id: 'rotate-list',
    method_name: 'rotateRight',
    params: [{ name: 'head', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'Find length n. Reduce k mod n.',
      'Connect tail to head making a cycle.',
      'Walk (n - k) steps from head to find the new tail; the next node is the new head.',
      'Break the cycle at the new tail.',
      'O(n) time, O(1) space.',
    ],
    tags: ['linked-list', 'two-pointers'],
    constraints: '0 ≤ list length ≤ 500\n-100 ≤ Node.val ≤ 100\n0 ≤ k ≤ 2·10^9',
    follow_up: 'Rotate LEFT — symmetric: new head is at index (k % n) from the front.',
    pattern: 'cycle-then-break',
    test_cases: [
      { inputs: ['[1,2,3,4,5]', '2'], expected: '[4,5,1,2,3]' },
      { inputs: ['[0,1,2]', '4'], expected: '[2,0,1]' },
      { inputs: ['[]', '0'], expected: '[]' },
      { inputs: ['[1]', '1'], expected: '[1]' },
      { inputs: ['[1]', '99'], expected: '[1]' },
      { inputs: ['[1,2]', '1'], expected: '[2,1]' },
      { inputs: ['[1,2]', '2'], expected: '[1,2]' },
      { inputs: ['[1,2]', '3'], expected: '[2,1]' },
      { inputs: ['[1,2,3]', '0'], expected: '[1,2,3]' },
      { inputs: ['[1,2,3,4,5]', '0'], expected: '[1,2,3,4,5]' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '[1,2,3,4,5]' },
      { inputs: ['[1,2,3,4,5]', '10'], expected: '[1,2,3,4,5]' },
    ],
  },
  {
    id: 'odd-even-linked-list',
    method_name: 'oddEvenList',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Group odd-indexed nodes first, then even-indexed nodes; preserve relative order within each group.',
      'Two chains: `odd` starting at head, `even` starting at head.next.',
      'Walk: odd.next = even.next; advance odd; even.next = odd.next; advance even.',
      'Stop when even or even.next is null. Then odd.next = evenHead.',
      'O(n) time, O(1) extra space.',
    ],
    tags: ['linked-list'],
    constraints: '0 ≤ list length ≤ 10^4\n-10^6 ≤ Node.val ≤ 10^6',
    follow_up: 'Generalize to "group by mod k" — same algorithm with k chains.',
    pattern: 'interleave-chains',
    test_cases: [
      { inputs: ['[1,2,3,4,5]'], expected: '[1,3,5,2,4]' },
      { inputs: ['[2,1,3,5,6,4,7]'], expected: '[2,3,6,7,1,5,4]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3]'], expected: '[1,3,2]' },
      { inputs: ['[1,2,3,4]'], expected: '[1,3,2,4]' },
      { inputs: ['[10,20,30,40,50,60]'], expected: '[10,30,50,20,40,60]' },
      { inputs: ['[1,1,1,1,1]'], expected: '[1,1,1,1,1]' },
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
