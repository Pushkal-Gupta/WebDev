#!/usr/bin/env node
// Batch 60: linked-list classics + final polish.

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
    id: 'swap-nodes-pairs',
    method_name: 'swapPairs',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Use a dummy node pointing to head.',
      'Keep a `prev` pointer. While prev.next AND prev.next.next exist:',
      '  Let a = prev.next, b = a.next. Re-wire: prev → b → a → b.next.',
      '  Move prev to a (the new "second" of the pair).',
      'Return dummy.next.',
    ],
    tags: ['linked-list', 'recursion'],
    constraints: '0 ≤ nodes ≤ 100\n0 ≤ Node.val ≤ 100',
    follow_up: 'Reverse k consecutive nodes (k=2 is this problem).',
    pattern: 'dummy-node-swap',
    test_cases: [
      { inputs: ['[1,2,3,4]'], expected: '[2,1,4,3]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[2,1]' },
      { inputs: ['[1,2,3]'], expected: '[2,1,3]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[2,1,4,3,5]' },
      { inputs: ['[1,2,3,4,5,6]'], expected: '[2,1,4,3,6,5]' },
      { inputs: ['[1,1,1,1]'], expected: '[1,1,1,1]' },
    ],
  },
  {
    id: 'reorder-list',
    method_name: 'reorderList',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Step 1: find middle via slow/fast pointers.',
      'Step 2: reverse the second half.',
      'Step 3: merge first half and reversed second half by alternating.',
      'O(n) time, O(1) extra space.',
      'Watch off-by-one for odd-length lists — middle goes to the first half.',
    ],
    tags: ['linked-list', 'two-pointers'],
    constraints: '1 ≤ nodes ≤ 5·10^4\n0 ≤ Node.val ≤ 1000',
    follow_up: 'Reverse alternate K nodes — generalise the alternating merge.',
    pattern: 'find-middle-reverse-merge',
    test_cases: [
      { inputs: ['[1,2,3,4]'], expected: '[1,4,2,3]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[1,5,2,4,3]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3]'], expected: '[1,3,2]' },
      { inputs: ['[1,2,3,4,5,6]'], expected: '[1,6,2,5,3,4]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[1,7,2,6,3,5,4]' },
    ],
  },
  {
    id: 'delete-node-ll',
    method_name: 'deleteNode',
    params: [{ name: 'head', type: 'List[int]' }, { name: 'targetVal', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'You only have a reference to the node to delete (not the head).',
      'Trick: copy next.val into current; bypass next by setting current.next = current.next.next.',
      'Effectively delete the SUCCESSOR, but the visible value gone is the original target.',
      'Assumes target node is never the tail.',
      'O(1) time, O(1) space.',
    ],
    tags: ['linked-list'],
    constraints: '2 ≤ nodes ≤ 1000\nAll values distinct\nTarget exists and is not the tail',
    follow_up: 'If target could be the tail, you need head — or set node.val = sentinel and mark deleted.',
    pattern: 'value-copy-bypass',
    test_cases: [
      { inputs: ['[4,5,1,9]', '5'], expected: '[4,1,9]' },
      { inputs: ['[4,5,1,9]', '1'], expected: '[4,5,9]' },
      { inputs: ['[1,2]', '1'], expected: '[2]' },
      { inputs: ['[1,2,3]', '2'], expected: '[1,3]' },
      { inputs: ['[1,2,3,4,5,6]', '4'], expected: '[1,2,3,5,6]' },
      { inputs: ['[1,2,3,4,5,6]', '1'], expected: '[2,3,4,5,6]' },
    ],
  },
  {
    id: 'palindrome-partitioning',
    method_name: 'partition',
    params: [{ name: 's', type: 'str' }],
    return_type: 'List[List[str]]',
    hints: [
      'Backtrack: at each index, try every palindrome prefix.',
      'Recurse on the suffix; collect the current partition.',
      'Precompute pal[i][j] in O(n²) for O(1) checks.',
      'Append a copy when index reaches end.',
      'O(n · 2^n) worst — each cut creates exponential branches.',
    ],
    tags: ['string', 'backtracking', 'dp'],
    constraints: '1 ≤ s.length ≤ 16',
    follow_up: 'Palindrome Partitioning II — minimum cuts. DP only on counts.',
    pattern: 'backtracking-palindrome-prefix',
    test_cases: [
      { inputs: ['"aab"'], expected: '[["a","a","b"],["aa","b"]]' },
      { inputs: ['"a"'], expected: '[["a"]]' },
      { inputs: ['"ab"'], expected: '[["a","b"]]' },
      { inputs: ['"aba"'], expected: '[["a","b","a"],["aba"]]' },
      { inputs: ['"aaa"'], expected: '[["a","a","a"],["a","aa"],["aa","a"],["aaa"]]' },
      { inputs: ['"abc"'], expected: '[["a","b","c"]]' },
    ],
  },
  {
    id: 'reverse-integer',
    method_name: 'reverse',
    params: [{ name: 'x', type: 'int' }],
    return_type: 'int',
    hints: [
      'Pop last digit with x % 10; push to result with result * 10 + digit.',
      'Watch sign: handle negative naturally if you use truncation toward zero.',
      'Overflow check BEFORE multiplying: if result > INT_MAX/10 → overflow.',
      'Edge: result = INT_MAX/10 and next digit > 7 → overflow.',
      'O(log10 x) time, O(1) space.',
    ],
    tags: ['math'],
    constraints: '-2^31 ≤ x ≤ 2^31 − 1',
    follow_up: 'Reverse bits — same idea, base 2.',
    pattern: 'digit-pop-push',
    test_cases: [
      { inputs: ['123'], expected: '321' },
      { inputs: ['-123'], expected: '-321' },
      { inputs: ['120'], expected: '21' },
      { inputs: ['0'], expected: '0' },
      { inputs: ['1'], expected: '1' },
      { inputs: ['1534236469'], expected: '0' },
      { inputs: ['-2147483648'], expected: '0' },
      { inputs: ['1000'], expected: '1' },
      { inputs: ['-100'], expected: '-1' },
      { inputs: ['10'], expected: '1' },
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
