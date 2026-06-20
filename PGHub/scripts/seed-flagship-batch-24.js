#!/usr/bin/env node
// Batch 24: classics — fibonacci, hanoi, decode string, eval-rpn, jump games, valid palindrome.

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
    id: 'fibonacci-number',
    method_name: 'fib',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2).',
      'Naive recursion is O(2^n) — see the call-tree visualization for why.',
      'Iterative DP with two variables is O(n) time, O(1) space.',
      'Matrix exponentiation: [[1,1],[1,0]]^n gives [[F(n+1), F(n)],[F(n), F(n-1)]]. O(log n).',
      'Closed form (Binet): involves √5; not exact in floating point for large n.',
    ],
    tags: ['math', 'dp', 'recursion'],
    constraints: '0 ≤ n ≤ 30',
    follow_up: 'Compute F(n) mod p efficiently — matrix power mod p in O(log n).',
    pattern: '1d-dp-rolling-pair',
    test_cases: [
      { inputs: ['0'], expected: '0' },
      { inputs: ['1'], expected: '1' },
      { inputs: ['2'], expected: '1' },
      { inputs: ['3'], expected: '2' },
      { inputs: ['4'], expected: '3' },
      { inputs: ['5'], expected: '5' },
      { inputs: ['10'], expected: '55' },
      { inputs: ['15'], expected: '610' },
      { inputs: ['20'], expected: '6765' },
      { inputs: ['25'], expected: '75025' },
      { inputs: ['30'], expected: '832040' },
      { inputs: ['6'], expected: '8' },
      { inputs: ['7'], expected: '13' },
      { inputs: ['8'], expected: '21' },
      { inputs: ['9'], expected: '34' },
    ],
  },
  {
    id: 'tower-of-hanoi',
    method_name: 'towerOfHanoi',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'Classic recurrence: move(n) = 2 * move(n-1) + 1.',
      'Closed form: 2^n - 1 moves to transfer n disks.',
      'Recursive recipe: move(n-1, src, aux, dst); move disk n src→dst; move(n-1, aux, dst, src).',
      'O(2^n) moves is optimal — proof via the recurrence.',
      'For the move COUNT only: (1 << n) - 1 is O(1).',
    ],
    tags: ['math', 'recursion'],
    constraints: '1 ≤ n ≤ 20',
    follow_up: 'Print the actual moves: emit "from → to" at each recursion base.',
    pattern: 'classic-recursion',
    test_cases: [
      { inputs: ['1'], expected: '1' },
      { inputs: ['2'], expected: '3' },
      { inputs: ['3'], expected: '7' },
      { inputs: ['4'], expected: '15' },
      { inputs: ['5'], expected: '31' },
      { inputs: ['6'], expected: '63' },
      { inputs: ['7'], expected: '127' },
      { inputs: ['10'], expected: '1023' },
      { inputs: ['15'], expected: '32767' },
      { inputs: ['20'], expected: '1048575' },
    ],
  },
  {
    id: 'decode-string',
    method_name: 'decodeString',
    params: [{ name: 's', type: 'str' }],
    return_type: 'str',
    hints: [
      'Use two stacks: counts and partial strings (or one stack of pairs).',
      'Walk the string. Digit → build the current number. `[` → push (currentString, currentNumber); reset.',
      '`]` → pop (prev, count) and append currentString repeated count times to prev.',
      'Letters → append to currentString.',
      'O(maxK · n) time where the result length dominates.',
    ],
    tags: ['string', 'stack', 'recursion'],
    constraints: '1 ≤ s.length ≤ 30\nk is between 1 and 300\nLowercase English letters and digits only',
    follow_up: 'Nested encoding "3[a2[c]]" → "accaccacc". Same algorithm handles nesting naturally with the stack.',
    pattern: 'stack-of-counts-and-strings',
    test_cases: [
      { inputs: ['"3[a]2[bc]"'], expected: 'aaabcbc' },
      { inputs: ['"3[a2[c]]"'], expected: 'accaccacc' },
      { inputs: ['"2[abc]3[cd]ef"'], expected: 'abcabccdcdcdef' },
      { inputs: ['"abc"'], expected: 'abc' },
      { inputs: ['"1[a]"'], expected: 'a' },
      { inputs: ['"10[a]"'], expected: 'aaaaaaaaaa' },
      { inputs: ['"100[a]"'], expected: 'a'.repeat(100) || 'a'.repeat(100) },
      { inputs: ['"2[2[a]]"'], expected: 'aaaa' },
      { inputs: ['"3[a]"'], expected: 'aaa' },
      { inputs: ['"3[abc]"'], expected: 'abcabcabc' },
      { inputs: ['"2[a3[b]]"'], expected: 'abbbabbb' },
      { inputs: ['""'], expected: '' },
    ].map(c => c.expected === 'a'.repeat(100) ? { inputs: c.inputs, expected: 'a'.repeat(100) } : c),
  },
  {
    id: 'eval-rpn',
    method_name: 'evalRPN',
    params: [{ name: 'tokens', type: 'List[str]' }],
    return_type: 'int',
    hints: [
      'RPN (postfix) is built for stacks. Each operator pops 2 operands.',
      'Walk left-to-right. Number → push. Operator → pop b, pop a, push (a op b).',
      'Division: integer division TOWARD ZERO (not floor) — important for negatives.',
      'Final stack value is the answer.',
      'O(n) time, O(n) space.',
    ],
    tags: ['array', 'stack', 'math'],
    constraints: '1 ≤ tokens.length ≤ 10^4\nEach token is +, -, *, /, or an integer in [-200, 200]',
    follow_up: 'Infix → postfix conversion (Shunting-Yard). Same stack-based mindset, different goal.',
    pattern: 'stack-evaluation',
    test_cases: [
      { inputs: ['["2","1","+","3","*"]'], expected: '9' },
      { inputs: ['["4","13","5","/","+"]'], expected: '6' },
      { inputs: ['["10","6","9","3","+","-11","*","/","*","17","+","5","+"]'], expected: '22' },
      { inputs: ['["3","4","+"]'], expected: '7' },
      { inputs: ['["5"]'], expected: '5' },
      { inputs: ['["1","2","-"]'], expected: '-1' },
      { inputs: ['["2","1","-"]'], expected: '1' },
      { inputs: ['["10","2","/"]'], expected: '5' },
      { inputs: ['["7","-3","/"]'], expected: '-2' },
      { inputs: ['["-7","3","/"]'], expected: '-2' },
      { inputs: ['["10","-5","*"]'], expected: '-50' },
      { inputs: ['["3","11","5","+","-"]'], expected: '-13' },
      { inputs: ['["100","200","+","300","*"]'], expected: '90000' },
    ],
  },
  {
    id: 'jump-game-ii',
    method_name: 'jump',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'BFS view: from index 0, you can reach any index in [1, nums[0]]. Each "level" is one jump.',
      'Greedy: track currentEnd (farthest reachable in current jump) and farthest (best next-jump end).',
      'When i passes currentEnd, you must jump — increment jumps, set currentEnd = farthest.',
      'O(n) time, O(1) space.',
      'DP is O(n²) — too slow at n=10^4.',
    ],
    tags: ['array', 'greedy', 'bfs', 'dp'],
    constraints: '1 ≤ nums.length ≤ 10^4\n0 ≤ nums[i] ≤ 1000\nThe last index is always reachable.',
    follow_up: 'Reconstruct the actual jumps — track parent pointers in the BFS.',
    pattern: 'greedy-bfs-level',
    test_cases: [
      { inputs: ['[2,3,1,1,4]'], expected: '2' },
      { inputs: ['[2,3,0,1,4]'], expected: '2' },
      { inputs: ['[1,1,1,1]'], expected: '3' },
      { inputs: ['[0]'], expected: '0' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[2,1]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[5,1,1,1,1]'], expected: '1' },
      { inputs: ['[1,2,3]'], expected: '2' },
      { inputs: ['[2,1,1,1,1,1]'], expected: '3' },
      { inputs: ['[10,9,8,7,6,5,4,3,2,1,1,0]'], expected: '2' },
      { inputs: ['[7,0,9,6,9,6,1,7,9,0,1,2,9,0,3]'], expected: '2' },
      { inputs: ['[3,2,1]'], expected: '1' },
    ],
  },
  {
    id: 'valid-palindrome',
    method_name: 'isPalindrome',
    params: [{ name: 's', type: 'str' }],
    return_type: 'bool',
    hints: [
      'Ignore non-alphanumerics, case-fold. Then check if the string is a palindrome.',
      'Two pointers from both ends. Skip non-alnum chars; compare lowercased chars.',
      'Stop when l ≥ r.',
      'O(n) time, O(1) extra space.',
      'Build a cleaned string first → O(n) extra space; works but is less elegant.',
    ],
    tags: ['string', 'two-pointers'],
    constraints: '1 ≤ s.length ≤ 2·10^5\nASCII printable',
    follow_up: '"Valid Palindrome II" — allowed to delete at most one character. Modify the two-pointer to skip-and-recheck once.',
    pattern: 'two-pointer-skip',
    test_cases: [
      { inputs: ['"A man, a plan, a canal: Panama"'], expected: 'true' },
      { inputs: ['"race a car"'], expected: 'false' },
      { inputs: ['" "'], expected: 'true' },
      { inputs: ['""'], expected: 'true' },
      { inputs: ['"a"'], expected: 'true' },
      { inputs: ['"."'], expected: 'true' },
      { inputs: ['",.;:!?"'], expected: 'true' },
      { inputs: ['"0P"'], expected: 'false' },
      { inputs: ['"ab"'], expected: 'false' },
      { inputs: ['"aba"'], expected: 'true' },
      { inputs: ['"abba"'], expected: 'true' },
      { inputs: ['"Was it a car or a cat I saw?"'], expected: 'true' },
      { inputs: ['"Madam, I\'m Adam."'], expected: 'true' },
      { inputs: ['"abc"'], expected: 'false' },
      { inputs: ['"Race car"'], expected: 'true' },
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
