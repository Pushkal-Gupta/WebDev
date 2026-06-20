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
    id: 'prime-number-of-set-bits-in-binary-representation',
    method_name: 'countPrimeSetBits',
    params: [{ name: 'left', type: 'int' }, { name: 'right', type: 'int' }],
    return_type: 'int',
    pattern: 'Bit Manipulation + Number Theory',
    tags: ['bit-manipulation', 'math', 'number-theory', 'popcount'],
    companies: ["amazon","meta","microsoft","google","apple"],
    constraints: [
      '1 <= left <= right <= 10^6',
      '0 <= right - left <= 10^4',
    ],
    follow_up: 'Can you precompute primes once and reuse for many queries? What about Brian Kernighan popcount vs builtin?',
    hints: [
      'For each n in [left, right], count the number of set bits (popcount).',
      'Then check whether that count is a prime number.',
      'Since right <= 10^6, the popcount of n fits in at most 20 bits, so primes are tiny.',
      'You only need to know primality for values 0..20. Precompute a small set: {2,3,5,7,11,13,17,19}.',
      'Brian Kernighan trick: n &= n - 1 clears the lowest set bit; loop until n == 0 counting iterations.',
    ],
    test_cases: [
      { inputs: ['6', '10'], expected: '4' },
      { inputs: ['10', '15'], expected: '5' },
      { inputs: ['1', '1'], expected: '0' },
      { inputs: ['2', '2'], expected: '1' },
      { inputs: ['3', '3'], expected: '1' },
      { inputs: ['842', '888'], expected: '23' },
      { inputs: ['567', '607'], expected: '21' },
      { inputs: ['1', '10'], expected: '6' },
      { inputs: ['100', '200'], expected: '52' },
      { inputs: ['999990', '1000000'], expected: '6' },
    ],
    visualization: {
      type: 'array',
      frames: [
        { array: [6,7,8,9,10], highlights: [], pointers: {}, status: 'Range [6,10]. For each n compute popcount, then check primality.' },
        { array: [6,7,8,9,10], highlights: [0], pointers: { n: 0 }, status: 'n=6 = 0b110 -> popcount=2. 2 is prime -> count=1.' },
        { array: [6,7,8,9,10], highlights: [1], pointers: { n: 1 }, status: 'n=7 = 0b111 -> popcount=3. 3 is prime -> count=2.' },
        { array: [6,7,8,9,10], highlights: [2], pointers: { n: 2 }, status: 'n=8 = 0b1000 -> popcount=1. 1 is NOT prime -> skip.' },
        { array: [6,7,8,9,10], highlights: [3], pointers: { n: 3 }, status: 'n=9 = 0b1001 -> popcount=2. 2 is prime -> count=3.' },
        { array: [6,7,8,9,10], highlights: [4], pointers: { n: 4 }, status: 'n=10 = 0b1010 -> popcount=2. 2 is prime -> count=4.' },
        { array: [6,7,8,9,10], highlights: [], pointers: {}, status: 'Brian Kernighan: n &= n-1 strips lowest set bit. 10=0b1010 -> 0b1000 -> 0 (2 iterations).' },
        { array: [6,7,8,9,10], highlights: [], pointers: {}, status: 'Primes in popcount range (1..20): {2,3,5,7,11,13,17,19}. Lookup is O(1).' },
        { array: [6,7,8,9,10], highlights: [], pointers: {}, status: 'Time O((R-L) * log R). Space O(1).' },
        { array: [6,7,8,9,10], highlights: [], pointers: {}, status: 'Answer = 4. Numbers with prime-popcount: 6, 7, 9, 10.' },
      ],
    },
    solutions: [
      {
        language: 'python',
        approach: 'Popcount + small prime set',
        code: `class Solution:
    def countPrimeSetBits(self, left: int, right: int) -> int:
        primes = {2, 3, 5, 7, 11, 13, 17, 19}
        count = 0
        for n in range(left, right + 1):
            if bin(n).count('1') in primes:
                count += 1
        return count`,
      },
      {
        language: 'javascript',
        approach: 'Brian Kernighan popcount',
        code: `/**
 * @param {number} left
 * @param {number} right
 * @return {number}
 */
var countPrimeSetBits = function(left, right) {
    const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19]);
    let count = 0;
    for (let n = left; n <= right; n++) {
        let bits = 0, x = n;
        while (x) { x &= x - 1; bits++; }
        if (primes.has(bits)) count++;
    }
    return count;
};`,
      },
      {
        language: 'java',
        approach: 'Integer.bitCount + small prime set',
        code: `class Solution {
    public int countPrimeSetBits(int left, int right) {
        // Bitmask: bit i set means i is prime. Covers 0..21.
        int primeMask = (1 << 2) | (1 << 3) | (1 << 5) | (1 << 7)
                      | (1 << 11) | (1 << 13) | (1 << 17) | (1 << 19);
        int count = 0;
        for (int n = left; n <= right; n++) {
            int bits = Integer.bitCount(n);
            if ((primeMask & (1 << bits)) != 0) count++;
        }
        return count;
    }
}`,
      },
      {
        language: 'cpp',
        approach: '__builtin_popcount + prime mask',
        code: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int countPrimeSetBits(int left, int right) {
        int primeMask = (1<<2)|(1<<3)|(1<<5)|(1<<7)|(1<<11)|(1<<13)|(1<<17)|(1<<19);
        int count = 0;
        for (int n = left; n <= right; ++n) {
            int bits = __builtin_popcount(n);
            if (primeMask & (1 << bits)) ++count;
        }
        return count;
    }
};`,
      },
      {
        language: 'go',
        approach: 'bits.OnesCount + prime set',
        code: `import "math/bits"

func countPrimeSetBits(left int, right int) int {
    primes := map[int]bool{2: true, 3: true, 5: true, 7: true, 11: true, 13: true, 17: true, 19: true}
    count := 0
    for n := left; n <= right; n++ {
        if primes[bits.OnesCount(uint(n))] {
            count++
        }
    }
    return count
}`,
      },
      {
        language: 'rust',
        approach: 'count_ones + prime set',
        code: `use std::collections::HashSet;

impl Solution {
    pub fn count_prime_set_bits(left: i32, right: i32) -> i32 {
        let primes: HashSet<u32> = [2u32, 3, 5, 7, 11, 13, 17, 19].into_iter().collect();
        let mut count = 0;
        for n in left..=right {
            if primes.contains(&(n as u32).count_ones()) {
                count += 1;
            }
        }
        count
    }
}`,
      },
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
