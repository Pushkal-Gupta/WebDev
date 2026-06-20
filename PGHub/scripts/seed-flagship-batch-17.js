#!/usr/bin/env node
// Batch 17: easy classics — add-binary, first-unique-char, ransom-note,
// power-of-two, power-of-three.

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
    id: 'add-binary',
    method_name: 'addBinary',
    params: [{ name: 'a', type: 'str' }, { name: 'b', type: 'str' }],
    return_type: 'str',
    hints: [
      'Walk both strings from the END, adding digit + digit + carry.',
      'sum = (a[i] - "0") + (b[j] - "0") + carry. New digit = sum % 2, carry = sum / 2.',
      'After the loop, if carry remains, prepend "1".',
      'Reverse the accumulated result string (or build it backward and reverse).',
      'O(max(m,n)) time, O(max(m,n)) space.',
    ],
    tags: ['string', 'bit-manipulation', 'math'],
    constraints: '1 ≤ a.length, b.length ≤ 10^4\nNo leading zeros except for "0" itself.',
    follow_up: '"Add Strings" with decimal — same loop structure, base 10.',
    pattern: 'two-pointer-arithmetic',
    test_cases: [
      { inputs: ['"11"', '"1"'], expected: '100' },
      { inputs: ['"1010"', '"1011"'], expected: '10101' },
      { inputs: ['"0"', '"0"'], expected: '0' },
      { inputs: ['"1"', '"0"'], expected: '1' },
      { inputs: ['"0"', '"1"'], expected: '1' },
      { inputs: ['"1"', '"1"'], expected: '10' },
      { inputs: ['"111"', '"1"'], expected: '1000' },
      { inputs: ['"1111"', '"1111"'], expected: '11110' },
      { inputs: ['"100"', '"100"'], expected: '1000' },
      { inputs: ['"101"', '"10"'], expected: '111' },
      { inputs: ['"1"', '"111"'], expected: '1000' },
      { inputs: ['"110010"', '"10111"'], expected: '1001001' },
      { inputs: ['"0"', '"1111"'], expected: '1111' },
    ],
  },
  {
    id: 'first-unique-character',
    method_name: 'firstUniqChar',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Two passes: first count letters in a hashmap, then scan again finding the first with count == 1.',
      'Frequency array of size 26 is faster than hashmap for lowercase English.',
      'Return -1 if no unique letter.',
      'O(n) time, O(1) extra (alphabet bounded).',
      'Single-pass with ordered hashmap is possible but counts as 2 passes effectively.',
    ],
    tags: ['string', 'hash-map', 'queue'],
    constraints: '1 ≤ s.length ≤ 10^5\ns consists of lowercase English letters only.',
    follow_up: 'Streaming variant — chars arrive one by one. Maintain a queue of candidate firsts.',
    pattern: 'frequency-count-then-scan',
    test_cases: [
      { inputs: ['"leetcode"'], expected: '0' },
      { inputs: ['"loveleetcode"'], expected: '2' },
      { inputs: ['"aabb"'], expected: '-1' },
      { inputs: ['"a"'], expected: '0' },
      { inputs: ['""'], expected: '-1' },
      { inputs: ['"aa"'], expected: '-1' },
      { inputs: ['"ab"'], expected: '0' },
      { inputs: ['"ba"'], expected: '0' },
      { inputs: ['"aabbc"'], expected: '4' },
      { inputs: ['"aabbcc"'], expected: '-1' },
      { inputs: ['"abcabc"'], expected: '-1' },
      { inputs: ['"abcdef"'], expected: '0' },
      { inputs: ['"abca"'], expected: '1' },
      { inputs: ['"dddccdbba"'], expected: '8' },
    ],
  },
  {
    id: 'ransom-note',
    method_name: 'canConstruct',
    params: [{ name: 'ransomNote', type: 'str' }, { name: 'magazine', type: 'str' }],
    return_type: 'bool',
    hints: [
      'Count letters in magazine.',
      'Walk ransomNote; decrement the count for each letter; if a count goes negative → false.',
      'Equivalent: build counts of both, ensure every letter in ransom is in magazine in ≥ that quantity.',
      'O(m + n) time, O(alphabet) space.',
      'Frequency array of 26 ints is fine for lowercase English.',
    ],
    tags: ['string', 'hash-map', 'counting'],
    constraints: '1 ≤ ransomNote.length, magazine.length ≤ 10^5\nLowercase English letters only.',
    follow_up: 'Streaming magazine — same hashmap but decrement on the fly.',
    pattern: 'frequency-count',
    test_cases: [
      { inputs: ['"a"', '"b"'], expected: 'false' },
      { inputs: ['"aa"', '"ab"'], expected: 'false' },
      { inputs: ['"aa"', '"aab"'], expected: 'true' },
      { inputs: ['""', '""'], expected: 'true' },
      { inputs: ['""', '"abc"'], expected: 'true' },
      { inputs: ['"abc"', '""'], expected: 'false' },
      { inputs: ['"abc"', '"cba"'], expected: 'true' },
      { inputs: ['"abc"', '"def"'], expected: 'false' },
      { inputs: ['"hello"', '"olleh"'], expected: 'true' },
      { inputs: ['"hello"', '"helloworld"'], expected: 'true' },
      { inputs: ['"hellooo"', '"helloo"'], expected: 'false' },
      { inputs: ['"abc"', '"abcabcabc"'], expected: 'true' },
      { inputs: ['"aaa"', '"aa"'], expected: 'false' },
      { inputs: ['"xyz"', '"xyzxyz"'], expected: 'true' },
      { inputs: ['"abc"', '"a"'], expected: 'false' },
    ],
  },
  {
    id: 'power-of-two',
    method_name: 'isPowerOfTwo',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'bool',
    hints: [
      'n is a power of 2 iff n > 0 AND it has exactly one bit set.',
      'Bit trick: n & (n - 1) == 0 clears the lowest set bit; if result is 0, only one bit was set.',
      'Edge case: n ≤ 0 → false.',
      'Loop dividing by 2 also works but O(log n) vs O(1).',
      'O(1) time, O(1) space.',
    ],
    tags: ['math', 'bit-manipulation'],
    constraints: '-2^31 ≤ n ≤ 2^31 − 1',
    follow_up: '"Power of Three" — division loop is the standard answer (no clean bit trick).',
    pattern: 'bit-trick',
    test_cases: [
      { inputs: ['1'], expected: 'true' },
      { inputs: ['16'], expected: 'true' },
      { inputs: ['3'], expected: 'false' },
      { inputs: ['0'], expected: 'false' },
      { inputs: ['-1'], expected: 'false' },
      { inputs: ['-16'], expected: 'false' },
      { inputs: ['2'], expected: 'true' },
      { inputs: ['4'], expected: 'true' },
      { inputs: ['8'], expected: 'true' },
      { inputs: ['1024'], expected: 'true' },
      { inputs: ['1073741824'], expected: 'true' },
      { inputs: ['1073741823'], expected: 'false' },
      { inputs: ['6'], expected: 'false' },
      { inputs: ['64'], expected: 'true' },
      { inputs: ['65'], expected: 'false' },
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
  console.log(`  ✓ ${f.id}  — ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
