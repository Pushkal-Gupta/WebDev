#!/usr/bin/env node
// Batch 35: string algorithms + queue/stack designs.

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
    id: 'kmp',
    method_name: 'kmpSearch',
    params: [{ name: 'text', type: 'str' }, { name: 'pattern', type: 'str' }],
    return_type: 'List[int]',
    hints: [
      'Naive O(n·m) checks each text position against the whole pattern.',
      'Build the failure function (LPS array) of pattern in O(m).',
      'Use LPS during search: on mismatch, instead of restarting the pattern, jump to LPS[k-1].',
      'O(n + m) overall.',
      'Return all starting indices where pattern occurs.',
    ],
    tags: ['string', 'kmp', 'pattern-matching'],
    constraints: '0 ≤ text.length ≤ 10^5\n0 ≤ pattern.length ≤ 10^4',
    follow_up: 'Z-algorithm — also O(n) with a different state. Useful for some problems where KMP isn\'t obvious.',
    pattern: 'failure-function-lps',
    test_cases: [
      { inputs: ['"abcabcabc"', '"abc"'], expected: '[0,3,6]' },
      { inputs: ['"hello world"', '"o"'], expected: '[4,7]' },
      { inputs: ['"aabaaabaaac"', '"aabaaac"'], expected: '[4]' },
      { inputs: ['"abc"', '"d"'], expected: '[]' },
      { inputs: ['""', '""'], expected: '[0]' },
      { inputs: ['""', '"a"'], expected: '[]' },
      { inputs: ['"abc"', '""'], expected: '[0,1,2,3]' },
      { inputs: ['"aaaa"', '"aa"'], expected: '[0,1,2]' },
      { inputs: ['"mississippi"', '"issi"'], expected: '[1,4]' },
      { inputs: ['"abcde"', '"abcde"'], expected: '[0]' },
      { inputs: ['"abcde"', '"abcdef"'], expected: '[]' },
    ],
  },
  {
    id: 'implement-queue-stacks',
    method_name: 'queueOps',
    params: [{ name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[int]',
    hints: [
      'Two stacks: `in` and `out`.',
      'push x → push to `in`.',
      'pop/peek → if `out` is empty, move everything from `in` to `out` (reversing). Then pop/peek from `out`.',
      'Amortized O(1) per operation — each element moves at most once between stacks.',
      'empty → both stacks empty.',
    ],
    tags: ['stack', 'design', 'queue'],
    constraints: '1 ≤ x ≤ 9\nAt most 100 calls\nMethods called in arbitrary valid order',
    follow_up: 'Implement stack using queues — symmetric trick using two queues or one with rotations.',
    pattern: 'two-stacks-amortized',
    test_cases: [
      { inputs: ['[["push","1"],["push","2"],["peek"],["pop"],["empty"]]'], expected: '[1,1,0]' },
      { inputs: ['[["push","5"],["pop"],["empty"]]'], expected: '[5,1]' },
      { inputs: ['[["empty"]]'], expected: '[1]' },
      { inputs: ['[["push","1"],["push","2"],["push","3"],["pop"],["pop"],["pop"],["empty"]]'], expected: '[1,2,3,1]' },
      { inputs: ['[["push","7"],["peek"],["peek"],["pop"],["empty"]]'], expected: '[7,7,7,1]' },
      { inputs: ['[["push","1"],["push","2"],["peek"],["push","3"],["peek"],["pop"],["peek"]]'], expected: '[1,1,1,2]' },
    ],
  },
  {
    id: 'implement-stack-using-queues',
    method_name: 'stackOps',
    params: [{ name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[int]',
    hints: [
      'Approach A — push costly: enqueue x, then rotate (queue.size - 1) times so x is at the front.',
      'Approach B — pop costly: enqueue normally; on pop, dequeue all but the last into a second queue, then dequeue the last.',
      'Approach A gives O(1) pop/peek, O(n) push.',
      'Both still meet "use only standard queue ops".',
      'Single-queue rotation is the elegant version.',
    ],
    tags: ['queue', 'design', 'stack'],
    constraints: '1 ≤ x ≤ 9\nAt most 100 calls\nMethods called in arbitrary valid order',
    follow_up: 'Make BOTH push and pop O(1) amortized — switching role per call. Not possible with two queues; needs richer ops.',
    pattern: 'queue-rotation',
    test_cases: [
      { inputs: ['[["push","1"],["push","2"],["top"],["pop"],["empty"]]'], expected: '[2,2,0]' },
      { inputs: ['[["push","3"],["pop"],["empty"]]'], expected: '[3,1]' },
      { inputs: ['[["empty"]]'], expected: '[1]' },
      { inputs: ['[["push","1"],["push","2"],["push","3"],["pop"],["pop"],["pop"]]'], expected: '[3,2,1]' },
      { inputs: ['[["push","5"],["top"],["top"],["pop"],["empty"]]'], expected: '[5,5,5,1]' },
      { inputs: ['[["push","1"],["push","2"],["top"],["push","3"],["top"],["pop"],["top"]]'], expected: '[2,3,3,2]' },
    ],
  },
  {
    id: 'reverse-string',
    method_name: 'reverseString',
    params: [{ name: 's', type: 'List[str]' }],
    return_type: 'List[str]',
    hints: [
      'Two pointers from both ends, swap inward.',
      'Stop when l ≥ r.',
      'O(n/2) swaps = O(n) time.',
      'O(1) extra space — IN PLACE.',
      'Recursive variant works but uses O(n) stack.',
    ],
    tags: ['string', 'two-pointers', 'recursion'],
    constraints: '1 ≤ s.length ≤ 10^5\nASCII printable',
    follow_up: 'Reverse string in chunks of size k (LC 541).',
    pattern: 'two-pointer-swap',
    test_cases: [
      { inputs: ['["h","e","l","l","o"]'], expected: '["o","l","l","e","h"]' },
      { inputs: ['["H","a","n","n","a","h"]'], expected: '["h","a","n","n","a","H"]' },
      { inputs: ['["a"]'], expected: '["a"]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['["a","b"]'], expected: '["b","a"]' },
      { inputs: ['["a","b","c"]'], expected: '["c","b","a"]' },
      { inputs: ['["1","2","3","4"]'], expected: '["4","3","2","1"]' },
      { inputs: ['["x","y","z","x","y","z"]'], expected: '["z","y","x","z","y","x"]' },
      { inputs: ['[" ","a"," "]'], expected: '[" ","a"," "]' },
    ],
  },
  {
    id: 'longest-common-substring',
    method_name: 'longestCommonSubstring',
    params: [{ name: 'a', type: 'str' }, { name: 'b', type: 'str' }],
    return_type: 'int',
    hints: [
      'Subsequence vs substring: substring requires contiguous match.',
      'dp[i][j] = length of common substring ENDING at (i-1, j-1).',
      'Match: dp[i][j] = dp[i-1][j-1] + 1. Mismatch: 0.',
      'Track the global max.',
      'O(m·n) time, O(min(m,n)) space (one row).',
    ],
    tags: ['string', 'dp'],
    constraints: '0 ≤ a.length, b.length ≤ 1000',
    follow_up: 'Generalized suffix tree gets it to O(m + n) but is heavy machinery.',
    pattern: '2d-dp-on-suffix',
    test_cases: [
      { inputs: ['"abcde"', '"ace"'], expected: '1' },
      { inputs: ['"abcde"', '"abc"'], expected: '3' },
      { inputs: ['"abc"', '"def"'], expected: '0' },
      { inputs: ['"abc"', '"abc"'], expected: '3' },
      { inputs: ['""', '""'], expected: '0' },
      { inputs: ['"abcdef"', '"zcdemf"'], expected: '3' },
      { inputs: ['"GeeksforGeeks"', '"GeeksQuiz"'], expected: '5' },
      { inputs: ['"abcdxyz"', '"xyzabcd"'], expected: '4' },
      { inputs: ['"zxabcdezy"', '"yzabcdezx"'], expected: '6' },
      { inputs: ['"OldSite:GeeksforGeeks.org"', '"NewSite:GeeksQuiz.com"'], expected: '10' },
      { inputs: ['"aaaa"', '"aa"'], expected: '2' },
      { inputs: ['"a"', '"a"'], expected: '1' },
      { inputs: ['"a"', '"b"'], expected: '0' },
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
