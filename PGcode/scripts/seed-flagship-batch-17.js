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
    id: 'power-of-three',
    method_name: 'isPowerOfThree',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'bool',
    hints: [
      'n is a power of 3 iff n > 0 AND repeatedly dividing by 3 reaches 1 exactly.',
      'Loop: while n % 3 == 0, n /= 3. Then check n == 1.',
      'O(1) trick: the largest 32-bit power of 3 is 3^19 = 1162261467. If 1162261467 % n == 0, n is a power of 3.',
      'Logarithm-based check is unreliable due to floating point.',
      'O(log_3 n) for the loop; O(1) for the divisor trick.',
    ],
    tags: ['math', 'recursion'],
    constraints: '-2^31 ≤ n ≤ 2^31 − 1',
    follow_up: '"Power of Four" — also has a bit trick: power of 2 AND set bit is in an "even" position.',
    pattern: 'repeated-division',
    test_cases: [
      { inputs: ['27'], expected: 'true' },
      { inputs: ['0'], expected: 'false' },
      { inputs: ['9'], expected: 'true' },
      { inputs: ['45'], expected: 'false' },
      { inputs: ['1'], expected: 'true' },
      { inputs: ['3'], expected: 'true' },
      { inputs: ['81'], expected: 'true' },
      { inputs: ['243'], expected: 'true' },
      { inputs: ['1162261467'], expected: 'true' },
      { inputs: ['-3'], expected: 'false' },
      { inputs: ['-27'], expected: 'false' },
      { inputs: ['6'], expected: 'false' },
      { inputs: ['12'], expected: 'false' },
      { inputs: ['18'], expected: 'false' },
      { inputs: ['2147483647'], expected: 'false' },
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
