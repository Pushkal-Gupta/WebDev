#!/usr/bin/env node
// Batch 59: math + bit-manipulation classics.

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
    id: 'count-primes',
    method_name: 'countPrimes',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'Sieve of Eratosthenes — strike multiples of each prime found.',
      'Iterate i from 2 to sqrt(n). For each prime i, mark i*i, i*i+i, ... up to n as composite.',
      'Final answer = count of remaining primes < n.',
      'O(n log log n) time, O(n) bool array.',
      'Skip even numbers for a 2x speed-up.',
    ],
    tags: ['math', 'sieve'],
    constraints: '0 ≤ n ≤ 5·10^6',
    follow_up: 'Linear sieve — O(n). Track smallest prime factor for each composite.',
    pattern: 'sieve-of-eratosthenes',
    test_cases: [
      { inputs: ['10'], expected: '4' },
      { inputs: ['0'], expected: '0' },
      { inputs: ['1'], expected: '0' },
      { inputs: ['2'], expected: '0' },
      { inputs: ['3'], expected: '1' },
      { inputs: ['100'], expected: '25' },
      { inputs: ['1000'], expected: '168' },
      { inputs: ['10000'], expected: '1229' },
      { inputs: ['499979'], expected: '41537' },
    ],
  },
  {
    id: 'happy-number',
    method_name: 'isHappy',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'bool',
    hints: [
      'Repeated digit-square-sum either lands on 1 or enters a cycle (the famous 4 cycle).',
      'Use Floyd\'s cycle detection (slow/fast pointer) — O(1) space.',
      'Or HashSet of seen values — O(log n) space.',
      'Known fact: every non-happy number eventually hits 4.',
      'O(log n) per digit sum; bounded constant cycle length.',
    ],
    tags: ['math', 'hash-set', 'two-pointers'],
    constraints: '1 ≤ n ≤ 2^31 − 1',
    follow_up: 'Sum-of-cubes happy numbers — different cycles.',
    pattern: 'cycle-detection-or-seen-set',
    test_cases: [
      { inputs: ['19'], expected: 'true' },
      { inputs: ['2'], expected: 'false' },
      { inputs: ['1'], expected: 'true' },
      { inputs: ['7'], expected: 'true' },
      { inputs: ['100'], expected: 'true' },
      { inputs: ['10'], expected: 'true' },
      { inputs: ['4'], expected: 'false' },
      { inputs: ['1000'], expected: 'true' },
      { inputs: ['12345'], expected: 'false' },
      { inputs: ['44'], expected: 'false' },
    ],
  },
  {
    id: 'single-number',
    method_name: 'singleNumber',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'XOR all elements. Pairs cancel (x ^ x = 0). The lone element remains.',
      'a ^ 0 = a. XOR is associative and commutative.',
      'O(n) time, O(1) space.',
      'Hash-set counter alternative: O(n) extra.',
      'Sum trick: 2*sum(set) - sum(nums) — risks overflow.',
    ],
    tags: ['array', 'bit-manipulation'],
    constraints: '1 ≤ nums.length ≤ 3·10^4\nEvery element appears twice except one\n-3·10^4 ≤ nums[i] ≤ 3·10^4',
    follow_up: 'Single Number II — every other appears thrice. Bit-counting modulo 3.',
    pattern: 'xor-pair-cancellation',
    test_cases: [
      { inputs: ['[2,2,1]'], expected: '1' },
      { inputs: ['[4,1,2,1,2]'], expected: '4' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[0,1,0]'], expected: '1' },
      { inputs: ['[-1,-1,-2]'], expected: '-2' },
      { inputs: ['[5,5,3,4,3,4,7]'], expected: '7' },
      { inputs: ['[100,100,200]'], expected: '200' },
      { inputs: ['[1,1,2,2,3,3,4]'], expected: '4' },
    ],
  },
  {
    id: 'missing-number',
    method_name: 'missingNumber',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'XOR trick: a ^ (a^b) = b. XOR nums with 0..n; pairs cancel.',
      'Math: sum(0..n) - sum(nums). Watch overflow on large n.',
      'Sort + scan for first index where nums[i] != i. O(n log n).',
      'Cyclic-sort: put nums[i] at index nums[i]; scan for first missing.',
      'O(n) time, O(1) space with XOR or sum.',
    ],
    tags: ['array', 'bit-manipulation', 'math'],
    constraints: 'n == nums.length\n1 ≤ n ≤ 10^4\n0 ≤ nums[i] ≤ n\nAll values distinct',
    follow_up: 'Find ALL missing numbers (when duplicates allowed) — cyclic sort.',
    pattern: 'xor-or-sum-trick',
    test_cases: [
      { inputs: ['[3,0,1]'], expected: '2' },
      { inputs: ['[0,1]'], expected: '2' },
      { inputs: ['[9,6,4,2,3,5,7,0,1]'], expected: '8' },
      { inputs: ['[0]'], expected: '1' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[0,1,2,3,4]'], expected: '5' },
      { inputs: ['[1,2,3,4,5]'], expected: '0' },
      { inputs: ['[0,2]'], expected: '1' },
      { inputs: ['[2,0]'], expected: '1' },
      { inputs: ['[1,0]'], expected: '2' },
    ],
  },
  {
    id: 'power-of-three',
    method_name: 'isPowerOfThree',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'bool',
    hints: [
      'Loop divide by 3 while divisible; final n must be 1.',
      'n must be > 0.',
      'Constant-time: 3^19 = 1162261467 is the largest power of 3 in int32. Check if 1162261467 % n == 0.',
      'Logarithm trick: log10(n) / log10(3) must be a whole number — floating-point risky.',
      'O(log_3 n) loop is the safest.',
    ],
    tags: ['math'],
    constraints: '-2^31 ≤ n ≤ 2^31 − 1',
    follow_up: 'Generalise to power of K — same loop with K.',
    pattern: 'divide-loop-or-constant',
    test_cases: [
      { inputs: ['27'], expected: 'true' },
      { inputs: ['0'], expected: 'false' },
      { inputs: ['9'], expected: 'true' },
      { inputs: ['45'], expected: 'false' },
      { inputs: ['1'], expected: 'true' },
      { inputs: ['-3'], expected: 'false' },
      { inputs: ['3'], expected: 'true' },
      { inputs: ['81'], expected: 'true' },
      { inputs: ['243'], expected: 'true' },
      { inputs: ['244'], expected: 'false' },
      { inputs: ['1162261467'], expected: 'true' },
      { inputs: ['1162261468'], expected: 'false' },
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
