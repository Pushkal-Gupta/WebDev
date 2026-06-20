#!/usr/bin/env node
// Batch 34: bit manipulation classics.

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
    id: 'single-number-ii',
    method_name: 'singleNumber',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Every number appears 3 times except one. Find the one.',
      'Bit by bit: for each of 32 bit positions, count how many nums have it set. (count % 3) is the answer\'s bit.',
      'Two-counter trick: maintain `ones` and `twos`. ones = (ones ^ x) & ~twos; twos = (twos ^ x) & ~ones.',
      'Final ones contains the unique value.',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'bit-manipulation'],
    constraints: '1 ≤ nums.length ≤ 3·10^4\n-2^31 ≤ nums[i] ≤ 2^31 − 1\nEvery number except one appears exactly three times.',
    follow_up: 'k-times generalization: same bit-counting in mod k.',
    pattern: 'bit-counter-mod3',
    test_cases: [
      { inputs: ['[2,2,3,2]'], expected: '3' },
      { inputs: ['[0,1,0,1,0,1,99]'], expected: '99' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[-1,-1,-1,-2]'], expected: '-2' },
      { inputs: ['[-2,-2,-2,-1]'], expected: '-1' },
      { inputs: ['[10,10,10,5]'], expected: '5' },
      { inputs: ['[1,1,1,2,2,2,3]'], expected: '3' },
      { inputs: ['[7,7,7,8,9,9,9]'], expected: '8' },
      { inputs: ['[1000000,1000000,1000000,5]'], expected: '5' },
      { inputs: ['[-100,-100,-100,42]'], expected: '42' },
    ],
  },
  {
    id: 'single-number-iii',
    method_name: 'singleNumber',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Two unique numbers a and b; everyone else appears twice.',
      'XOR everything: result = a ^ b ≠ 0.',
      'Pick any set bit of (a ^ b) — call it `diff`. a and b differ in this bit.',
      'Partition nums by `(num & diff) != 0`. XOR each partition separately to recover a and b.',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'bit-manipulation'],
    constraints: '2 ≤ nums.length ≤ 3·10^4\n-2^31 ≤ nums[i] ≤ 2^31 − 1\nExactly two numbers appear once; all others appear exactly twice.',
    follow_up: 'k unique numbers — partition recursively. O(n log k).',
    pattern: 'xor-partition-by-bit',
    test_cases: [
      { inputs: ['[1,2,1,3,2,5]'], expected: '[3,5]' },
      { inputs: ['[-1,0]'], expected: '[-1,0]' },
      { inputs: ['[0,1]'], expected: '[0,1]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[10,20]'], expected: '[10,20]' },
      { inputs: ['[7,7,8,9]'], expected: '[8,9]' },
      { inputs: ['[1,2,3,2,1,5,6,5,6,7]'], expected: '[3,7]' },
      { inputs: ['[-2,-1]'], expected: '[-2,-1]' },
      { inputs: ['[100,200,100,300]'], expected: '[200,300]' },
    ],
  },
  {
    id: 'reverse-bits',
    method_name: 'reverseBits',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'Build result 32 bits at a time. Pull LSB of n, shift result left, place LSB.',
      'result = (result << 1) | (n & 1); n >>= 1.',
      'For repeated calls, cache 8-bit blocks (256-entry lookup).',
      'Treat n as 32-bit unsigned.',
      'O(1) time (32 iterations).',
    ],
    tags: ['bit-manipulation', 'math'],
    constraints: '0 ≤ n ≤ 2^32 − 1',
    follow_up: 'Reverse bits of a 64-bit number — same algorithm, 64 iterations.',
    pattern: 'bit-pluck-place',
    test_cases: [
      { inputs: ['43261596'], expected: '964176192' },
      { inputs: ['4294967293'], expected: '3221225471' },
      { inputs: ['0'], expected: '0' },
      { inputs: ['1'], expected: '2147483648' },
      { inputs: ['2147483648'], expected: '1' },
      { inputs: ['4294967295'], expected: '4294967295' },
      { inputs: ['2'], expected: '1073741824' },
      { inputs: ['1073741824'], expected: '2' },
      { inputs: ['255'], expected: '4278190080' },
      { inputs: ['4278190080'], expected: '255' },
    ],
  },
  {
    id: 'bitwise-and-of-numbers-range',
    method_name: 'rangeBitwiseAnd',
    params: [{ name: 'left', type: 'int' }, { name: 'right', type: 'int' }],
    return_type: 'int',
    hints: [
      'AND over [l, r] = common prefix of l and r in binary.',
      'Trick: while l < r, drop the lowest bit of r (r &= r - 1). Final r is the answer.',
      'Or: right-shift both until they match, count shifts, left-shift back.',
      'O(log right) time, O(1) space.',
      'Equivalent intuition: any bit position where some number in the range flips → 0 in the AND.',
    ],
    tags: ['bit-manipulation'],
    constraints: '0 ≤ left ≤ right ≤ 2^31 − 1',
    follow_up: 'OR over a range — symmetric: set every bit that appears in any number → bit set iff (left>>k != right>>k OR (left>>k) is odd).',
    pattern: 'common-prefix-strip',
    test_cases: [
      { inputs: ['5', '7'], expected: '4' },
      { inputs: ['0', '0'], expected: '0' },
      { inputs: ['1', '2147483647'], expected: '0' },
      { inputs: ['1', '1'], expected: '1' },
      { inputs: ['1', '2'], expected: '0' },
      { inputs: ['6', '7'], expected: '6' },
      { inputs: ['10', '15'], expected: '8' },
      { inputs: ['100', '200'], expected: '0' },
      { inputs: ['12', '15'], expected: '12' },
      { inputs: ['65535', '65535'], expected: '65535' },
      { inputs: ['8', '11'], expected: '8' },
      { inputs: ['16', '31'], expected: '16' },
    ],
  },
  {
    id: 'maximum-xor-of-two-numbers',
    method_name: 'findMaximumXOR',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Brute force: O(n²) pairs → too slow for n=2·10^5.',
      'Trie on bits, MSB first. Walk each number through the trie taking the OPPOSITE branch when possible to maximize XOR.',
      'Insert numbers into the trie; for each number, find its "best partner".',
      'O(n · 32) time and space.',
      'Greedy bit-by-bit alternative: try setting each high bit; check if any pair achieves it (using a hashset).',
    ],
    tags: ['array', 'bit-manipulation', 'trie', 'hash-set'],
    constraints: '1 ≤ nums.length ≤ 2·10^5\n0 ≤ nums[i] ≤ 2^31 − 1',
    follow_up: '"Maximum XOR With Element From Array" — offline queries; sort + trie.',
    pattern: 'bit-trie',
    test_cases: [
      { inputs: ['[3,10,5,25,2,8]'], expected: '28' },
      { inputs: ['[0]'], expected: '0' },
      { inputs: ['[8,1,2,12,7,6]'], expected: '15' },
      { inputs: ['[14,70,53,83,49,91,36,80,92,51,66,70]'], expected: '127' },
      { inputs: ['[1,2]'], expected: '3' },
      { inputs: ['[0,0,0]'], expected: '0' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,1,1,1]'], expected: '0' },
      { inputs: ['[1,2,3,4,5]'], expected: '7' },
      { inputs: ['[32,16,8,4,2,1]'], expected: '48' },
      { inputs: ['[2147483647,0]'], expected: '2147483647' },
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
