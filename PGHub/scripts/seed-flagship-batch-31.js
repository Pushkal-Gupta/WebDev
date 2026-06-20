#!/usr/bin/env node
// Batch 31: math + string heavy classics.

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
    id: 'string-to-integer',
    method_name: 'myAtoi',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Skip leading spaces.',
      'Optional sign. Then read decimal digits until non-digit.',
      'Clamp to [-2^31, 2^31 - 1] on overflow.',
      'Watch for "abc" (no number) → 0; "+-3" → 0.',
      'O(n) time, O(1) space.',
    ],
    tags: ['string', 'parsing', 'math'],
    constraints: '0 ≤ s.length ≤ 200\nASCII printable',
    follow_up: 'Locale-aware parsing (commas, decimal separators) — same state machine with more states.',
    pattern: 'state-machine-parse',
    test_cases: [
      { inputs: ['"42"'], expected: '42' },
      { inputs: ['"   -42"'], expected: '-42' },
      { inputs: ['"4193 with words"'], expected: '4193' },
      { inputs: ['"words and 987"'], expected: '0' },
      { inputs: ['"-91283472332"'], expected: '-2147483648' },
      { inputs: ['"91283472332"'], expected: '2147483647' },
      { inputs: ['""'], expected: '0' },
      { inputs: ['" "'], expected: '0' },
      { inputs: ['"0"'], expected: '0' },
      { inputs: ['"00000-42a1234"'], expected: '0' },
      { inputs: ['"+1"'], expected: '1' },
      { inputs: ['"-1"'], expected: '-1' },
      { inputs: ['"+-12"'], expected: '0' },
      { inputs: ['"   +0 123"'], expected: '0' },
      { inputs: ['"21474836460"'], expected: '2147483647' },
      { inputs: ['"-21474836460"'], expected: '-2147483648' },
    ],
  },
  {
    id: 'pow-x-n',
    method_name: 'myPow',
    params: [{ name: 'x', type: 'number' }, { name: 'n', type: 'int' }],
    return_type: 'number',
    hints: [
      'Naive: multiply x by itself n times → O(n).',
      'Fast exponentiation by squaring: x^n = (x^(n/2))² for even n; x · x^(n-1) for odd n.',
      'O(log n) recursion.',
      'Negative n: compute 1 / pow(x, -n). Watch INT_MIN — convert via long before negation.',
      'Iterative version: loop while n > 0, multiply result by x when low bit set, square x, shift n.',
    ],
    tags: ['math', 'recursion', 'divide-and-conquer'],
    constraints: '-100 < x < 100\n-2^31 ≤ n ≤ 2^31 − 1',
    follow_up: 'Modular pow: (x^n) mod p in O(log n). Same algorithm with `result = result * x % p`.',
    pattern: 'binary-exponentiation',
    test_cases: [
      { inputs: ['2.0', '10'], expected: '1024' },
      { inputs: ['2.1', '3'], expected: '9.261' },
      { inputs: ['2.0', '-2'], expected: '0.25' },
      { inputs: ['1.0', '100'], expected: '1' },
      { inputs: ['-1.0', '100'], expected: '1' },
      { inputs: ['-1.0', '99'], expected: '-1' },
      { inputs: ['0.0', '5'], expected: '0' },
      { inputs: ['5.0', '0'], expected: '1' },
      { inputs: ['2.0', '5'], expected: '32' },
      { inputs: ['3.0', '4'], expected: '81' },
      { inputs: ['2.0', '-3'], expected: '0.125' },
      { inputs: ['10.0', '3'], expected: '1000' },
      { inputs: ['10.0', '-3'], expected: '0.001' },
    ],
  },
  {
    id: 'integer-to-roman',
    method_name: 'intToRoman',
    params: [{ name: 'num', type: 'int' }],
    return_type: 'str',
    hints: [
      'Greedy: scan a table of (value, symbol) pairs from largest to smallest.',
      'Include subtractive forms: 900=CM, 400=CD, 90=XC, 40=XL, 9=IX, 4=IV.',
      'For each pair, while num >= value, append symbol and subtract value.',
      'O(1) time (constant table size).',
      'Output is at most 15 chars.',
    ],
    tags: ['math', 'hash-map', 'greedy'],
    constraints: '1 ≤ num ≤ 3999',
    follow_up: '"Roman to Integer" is the reverse — same table, scan with subtraction handling.',
    pattern: 'greedy-table-scan',
    test_cases: [
      { inputs: ['1'], expected: 'I' },
      { inputs: ['3'], expected: 'III' },
      { inputs: ['4'], expected: 'IV' },
      { inputs: ['9'], expected: 'IX' },
      { inputs: ['58'], expected: 'LVIII' },
      { inputs: ['1994'], expected: 'MCMXCIV' },
      { inputs: ['40'], expected: 'XL' },
      { inputs: ['90'], expected: 'XC' },
      { inputs: ['400'], expected: 'CD' },
      { inputs: ['900'], expected: 'CM' },
      { inputs: ['1000'], expected: 'M' },
      { inputs: ['3999'], expected: 'MMMCMXCIX' },
      { inputs: ['2024'], expected: 'MMXXIV' },
      { inputs: ['500'], expected: 'D' },
      { inputs: ['44'], expected: 'XLIV' },
      { inputs: ['99'], expected: 'XCIX' },
    ],
  },
  {
    id: 'ugly-number-ii',
    method_name: 'nthUglyNumber',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'Ugly number: only 2, 3, 5 as prime factors.',
      'Naive: trial-test integers — too slow.',
      'Generate in order with 3 pointers. ugly[i] = min(ugly[i2]*2, ugly[i3]*3, ugly[i5]*5).',
      'Advance whichever pointer(s) produced the min (could be more than one — keep order).',
      'O(n) time, O(n) space.',
    ],
    tags: ['math', 'dp', 'heap'],
    constraints: '1 ≤ n ≤ 1690',
    follow_up: '"Super Ugly Number" — arbitrary prime set; same approach with more pointers (or a min-heap).',
    pattern: 'multi-pointer-merge',
    test_cases: [
      { inputs: ['1'], expected: '1' },
      { inputs: ['2'], expected: '2' },
      { inputs: ['3'], expected: '3' },
      { inputs: ['4'], expected: '4' },
      { inputs: ['5'], expected: '5' },
      { inputs: ['6'], expected: '6' },
      { inputs: ['7'], expected: '8' },
      { inputs: ['8'], expected: '9' },
      { inputs: ['9'], expected: '10' },
      { inputs: ['10'], expected: '12' },
      { inputs: ['11'], expected: '15' },
      { inputs: ['12'], expected: '16' },
      { inputs: ['13'], expected: '18' },
      { inputs: ['1407'], expected: '2123366400' },
      { inputs: ['1690'], expected: '2123366400' },
    ],
  },
  {
    id: 'fraction-to-decimal',
    method_name: 'fractionToDecimal',
    params: [{ name: 'numerator', type: 'int' }, { name: 'denominator', type: 'int' }],
    return_type: 'str',
    hints: [
      'Sign: XOR of signs of numerator and denominator.',
      'Integer part: |num| / |den|. Remainder: |num| % |den|.',
      'If remainder is 0, done. Otherwise emit ".".',
      'Long division: at each step, multiply remainder by 10. Track remainders in a hashmap → if seen again, you have a repeating cycle.',
      'Wrap the repeating part in parentheses.',
    ],
    tags: ['math', 'string', 'hash-map'],
    constraints: '-2^31 ≤ numerator, denominator ≤ 2^31 - 1\ndenominator ≠ 0',
    follow_up: '"Repeating Decimal Detection" — detect cycle length using the same map.',
    pattern: 'long-division-with-cycle-detection',
    test_cases: [
      { inputs: ['1', '2'], expected: '0.5' },
      { inputs: ['2', '1'], expected: '2' },
      { inputs: ['4', '333'], expected: '0.(012)' },
      { inputs: ['1', '3'], expected: '0.(3)' },
      { inputs: ['1', '5'], expected: '0.2' },
      { inputs: ['0', '5'], expected: '0' },
      { inputs: ['1', '6'], expected: '0.1(6)' },
      { inputs: ['-1', '2'], expected: '-0.5' },
      { inputs: ['1', '-2'], expected: '-0.5' },
      { inputs: ['-50', '8'], expected: '-6.25' },
      { inputs: ['7', '12'], expected: '0.58(3)' },
      { inputs: ['1', '7'], expected: '0.(142857)' },
      { inputs: ['10', '4'], expected: '2.5' },
      { inputs: ['100', '7'], expected: '14.(285714)' },
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
