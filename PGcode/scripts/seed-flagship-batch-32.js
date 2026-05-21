#!/usr/bin/env node
// Batch 32: monotonic stack classics + stock variants.

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
    id: 'daily-temperatures',
    method_name: 'dailyTemperatures',
    params: [{ name: 'temperatures', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'For each day, find the next day with a strictly warmer temperature.',
      'Brute force: nested loops → O(n²).',
      'Monotonic-decreasing stack of indices.',
      'When today\'s temp > stack top\'s temp, pop and set answer[popped] = today - popped.',
      'O(n) time, O(n) space.',
    ],
    tags: ['array', 'stack', 'monotonic-stack'],
    constraints: '1 ≤ temperatures.length ≤ 10^5\n30 ≤ temperatures[i] ≤ 100',
    follow_up: '"Next Greater Element" family — all use the same monotonic stack pattern.',
    pattern: 'monotonic-stack-next-greater',
    test_cases: [
      { inputs: ['[73,74,75,71,69,72,76,73]'], expected: '[1,1,4,2,1,1,0,0]' },
      { inputs: ['[30,40,50,60]'], expected: '[1,1,1,0]' },
      { inputs: ['[30,60,90]'], expected: '[1,1,0]' },
      { inputs: ['[100]'], expected: '[0]' },
      { inputs: ['[100,100]'], expected: '[0,0]' },
      { inputs: ['[100,50]'], expected: '[0,0]' },
      { inputs: ['[50,100]'], expected: '[1,0]' },
      { inputs: ['[70,75,72,80,78,85]'], expected: '[1,2,1,2,1,0]' },
      { inputs: ['[34,80,80,34,34,80,80,80,80,34]'], expected: '[1,0,0,2,1,0,0,0,0,0]' },
      { inputs: ['[55,38,53,81,61,93,97,32,43,78]'], expected: '[3,1,1,2,1,1,0,1,1,0]' },
    ],
  },
  {
    id: 'asteroid-collision',
    method_name: 'asteroidCollision',
    params: [{ name: 'asteroids', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Stack of surviving asteroids. Positive = moving right, negative = moving left.',
      'A collision happens only when a right-mover (top of stack) meets a left-mover (current).',
      'Compare absolute values: equal → both destroyed; bigger top → current destroyed; smaller top → pop, retry with the new top.',
      'Push current if no collision possible.',
      'O(n) time, O(n) space.',
    ],
    tags: ['array', 'stack'],
    constraints: '2 ≤ asteroids.length ≤ 10^4\n-1000 ≤ asteroids[i] ≤ 1000, asteroids[i] ≠ 0',
    follow_up: 'Variant with masses and energies — same stack with extended state.',
    pattern: 'stack-collide-and-pop',
    test_cases: [
      { inputs: ['[5,10,-5]'], expected: '[5,10]' },
      { inputs: ['[8,-8]'], expected: '[]' },
      { inputs: ['[10,2,-5]'], expected: '[10]' },
      { inputs: ['[-2,-1,1,2]'], expected: '[-2,-1,1,2]' },
      { inputs: ['[1,-2,-2,-2]'], expected: '[-2,-2,-2]' },
      { inputs: ['[1,1,-1]'], expected: '[1]' },
      { inputs: ['[5,-5]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[-1,1]'], expected: '[-1,1]' },
      { inputs: ['[10,2,-5,-10]'], expected: '[-10]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[1,2,3,4,5]' },
      { inputs: ['[-1,-2,-3,-4,-5]'], expected: '[-1,-2,-3,-4,-5]' },
    ],
  },
  {
    id: 'next-greater-element-ii',
    method_name: 'nextGreaterElements',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Array is CIRCULAR — after the last index, indices wrap to 0.',
      'Trick: iterate 2n times with index i % n. Same monotonic stack logic.',
      'Stack stores indices of elements waiting for their next-greater.',
      'After the loop, anything still on the stack has no next-greater → -1.',
      'O(n) time, O(n) space.',
    ],
    tags: ['array', 'stack', 'monotonic-stack', 'circular'],
    constraints: '1 ≤ nums.length ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9',
    follow_up: '"Next Greater Element III" — next greater permutation of digits.',
    pattern: 'circular-monotonic-stack',
    test_cases: [
      { inputs: ['[1,2,1]'], expected: '[2,-1,2]' },
      { inputs: ['[1,2,3,4,3]'], expected: '[2,3,4,-1,4]' },
      { inputs: ['[5,4,3,2,1]'], expected: '[-1,5,5,5,5]' },
      { inputs: ['[1]'], expected: '[-1]' },
      { inputs: ['[1,1]'], expected: '[-1,-1]' },
      { inputs: ['[1,2]'], expected: '[2,-1]' },
      { inputs: ['[2,1]'], expected: '[-1,2]' },
      { inputs: ['[3,8,4,1,2]'], expected: '[8,-1,8,2,3]' },
      { inputs: ['[5,5,5,5,5]'], expected: '[-1,-1,-1,-1,-1]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[2,3,4,5,-1]' },
      { inputs: ['[1,2,3,2,1]'], expected: '[2,3,-1,3,2]' },
    ],
  },
  {
    id: 'remove-k-digits',
    method_name: 'removeKdigits',
    params: [{ name: 'num', type: 'str' }, { name: 'k', type: 'int' }],
    return_type: 'str',
    hints: [
      'Goal: smallest number after removing k digits.',
      'Monotonic increasing stack of digits. When current < top and we still have removals → pop.',
      'After scanning, if removals remain, pop from the end.',
      'Strip leading zeros. Empty string → "0".',
      'O(n) time, O(n) space.',
    ],
    tags: ['string', 'stack', 'monotonic-stack', 'greedy'],
    constraints: '1 ≤ k ≤ num.length ≤ 10^5\nnum is a non-negative integer with no leading zeros (except "0")',
    follow_up: '"Create Maximum Number" — combine two arrays into the max k-digit number.',
    pattern: 'monotonic-stack-greedy',
    test_cases: [
      { inputs: ['"1432219"', '3'], expected: '1219' },
      { inputs: ['"10200"', '1'], expected: '200' },
      { inputs: ['"10"', '2'], expected: '0' },
      { inputs: ['"9"', '1'], expected: '0' },
      { inputs: ['"1"', '0'], expected: '1' },
      { inputs: ['"123456"', '3'], expected: '123' },
      { inputs: ['"654321"', '3'], expected: '321' },
      { inputs: ['"10001"', '4'], expected: '0' },
      { inputs: ['"112"', '1'], expected: '11' },
      { inputs: ['"5337"', '2'], expected: '33' },
      { inputs: ['"100"', '1'], expected: '0' },
      { inputs: ['"100"', '2'], expected: '0' },
      { inputs: ['"123"', '1'], expected: '12' },
      { inputs: ['"321"', '1'], expected: '21' },
      { inputs: ['"1111111"', '3'], expected: '1111' },
    ],
  },
  {
    id: 'buy-and-sell-with-cooldown',
    method_name: 'maxProfit',
    params: [{ name: 'prices', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'State machine: hold, sold (just sold today), rest (cooldown or idle).',
      'hold[i] = max(hold[i-1], rest[i-1] - prices[i]).',
      'sold[i] = hold[i-1] + prices[i].',
      'rest[i] = max(rest[i-1], sold[i-1]).',
      'Answer = max(sold[n-1], rest[n-1]). O(n) time, O(1) space with rolling.',
    ],
    tags: ['array', 'dp', 'state-machine'],
    constraints: '1 ≤ prices.length ≤ 5000\n0 ≤ prices[i] ≤ 1000',
    follow_up: '"Buy and Sell with Transaction Fee" — same state machine with `- fee` on the sell transition.',
    pattern: 'state-machine-dp',
    test_cases: [
      { inputs: ['[1,2,3,0,2]'], expected: '3' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[2,1]'], expected: '0' },
      { inputs: ['[1,2,3,4,5]'], expected: '4' },
      { inputs: ['[5,4,3,2,1]'], expected: '0' },
      { inputs: ['[1,2,4]'], expected: '3' },
      { inputs: ['[3,2,6,5,0,3]'], expected: '7' },
      { inputs: ['[1,4,2]'], expected: '3' },
      { inputs: ['[5,1,5,1,5]'], expected: '8' },
      { inputs: ['[6,1,3,2,4,7]'], expected: '6' },
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
