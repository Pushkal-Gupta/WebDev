#!/usr/bin/env node
// Batch 15: easy classics that everyone solves first day.

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
    id: 'roman-to-integer',
    method_name: 'romanToInt',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Map every symbol to its value: I=1, V=5, X=10, L=50, C=100, D=500, M=1000.',
      'If a smaller value precedes a larger one (IV, IX, XL, XC, CD, CM), it\'s subtracted.',
      'Walk left-to-right: if value[i] < value[i+1], subtract; else add.',
      'O(n) time, O(1) space (small fixed alphabet).',
      'Equivalent two-pass: replace IV→IIII (or special-case pairs first).',
    ],
    tags: ['string', 'hash-map', 'math'],
    constraints: '1 ≤ s.length ≤ 15\ns consists of I, V, X, L, C, D, M\nGuaranteed valid roman numeral 1..3999.',
    follow_up: '"Integer to Roman" — greedy: subtract the largest piece you can each step.',
    pattern: 'lookup-table',
    test_cases: [
      { inputs: ['"III"'], expected: '3' },
      { inputs: ['"LVIII"'], expected: '58' },
      { inputs: ['"MCMXCIV"'], expected: '1994' },
      { inputs: ['"I"'], expected: '1' },
      { inputs: ['"V"'], expected: '5' },
      { inputs: ['"IV"'], expected: '4' },
      { inputs: ['"IX"'], expected: '9' },
      { inputs: ['"XL"'], expected: '40' },
      { inputs: ['"XC"'], expected: '90' },
      { inputs: ['"CD"'], expected: '400' },
      { inputs: ['"CM"'], expected: '900' },
      { inputs: ['"M"'], expected: '1000' },
      { inputs: ['"MMMCMXCIX"'], expected: '3999' },
      { inputs: ['"MMXXIV"'], expected: '2024' },
      { inputs: ['"DCCC"'], expected: '800' },
      { inputs: ['"XXIV"'], expected: '24' },
      { inputs: ['"XLII"'], expected: '42' },
    ],
  },
  {
    id: 'longest-common-prefix',
    method_name: 'longestCommonPrefix',
    params: [{ name: 'strs', type: 'List[str]' }],
    return_type: 'str',
    hints: [
      'Vertical scan: for each column index i, check that strs[k][i] is the same across all k.',
      'Stop at the first mismatch or first string that\'s shorter than i.',
      'Alternative: sort strings; compare only first and last (lex extremes share the prefix).',
      'O(n · L) time, O(1) extra (vertical scan).',
      'Empty array → empty prefix.',
    ],
    tags: ['string', 'trie'],
    constraints: '1 ≤ strs.length ≤ 200\n0 ≤ strs[i].length ≤ 200',
    follow_up: 'Trie-based — insert each string; common prefix is the depth at which the trie first branches.',
    pattern: 'vertical-scan',
    test_cases: [
      { inputs: ['["flower","flow","flight"]'], expected: 'fl' },
      { inputs: ['["dog","racecar","car"]'], expected: '' },
      { inputs: ['["a"]'], expected: 'a' },
      { inputs: ['[""]'], expected: '' },
      { inputs: ['["",""]'], expected: '' },
      { inputs: ['["abc"]'], expected: 'abc' },
      { inputs: ['["abc","abc","abc"]'], expected: 'abc' },
      { inputs: ['["abc","abd","abe"]'], expected: 'ab' },
      { inputs: ['["abc","def"]'], expected: '' },
      { inputs: ['["leets","leetcode","leet","leeds"]'], expected: 'lee' },
      { inputs: ['["interstellar","internet","internal","intersection"]'], expected: 'inte' },
      { inputs: ['["a","ab","abc","abcd"]'], expected: 'a' },
      { inputs: ['["aaa","aa","a"]'], expected: 'a' },
      { inputs: ['["c","c"]'], expected: 'c' },
      { inputs: ['["throne","throne","throne"]'], expected: 'throne' },
    ],
  },
  {
    id: 'plus-one',
    method_name: 'plusOne',
    params: [{ name: 'digits', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Walk from the end. Add 1 to the last digit; propagate carry.',
      'If a digit becomes 10, set it to 0 and carry 1 to the next.',
      'After the loop, if carry remains, prepend a new leading 1 (handles 999 → 1000).',
      'O(n) time, O(1) extra (mutate in place).',
      'Done with arrays of digits because the actual number could exceed 64-bit integer.',
    ],
    tags: ['array', 'math'],
    constraints: '1 ≤ digits.length ≤ 100\n0 ≤ digits[i] ≤ 9\nNo leading zeros except the value 0 itself.',
    follow_up: '"Plus K" — same idea with K instead of 1; iterate carry propagation accordingly.',
    pattern: 'array-arithmetic',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '[1,2,4]' },
      { inputs: ['[4,3,2,1]'], expected: '[4,3,2,2]' },
      { inputs: ['[9]'], expected: '[1,0]' },
      { inputs: ['[0]'], expected: '[1]' },
      { inputs: ['[9,9]'], expected: '[1,0,0]' },
      { inputs: ['[9,9,9]'], expected: '[1,0,0,0]' },
      { inputs: ['[1,9,9]'], expected: '[2,0,0]' },
      { inputs: ['[9,8,9]'], expected: '[9,9,0]' },
      { inputs: ['[1]'], expected: '[2]' },
      { inputs: ['[1,0,0]'], expected: '[1,0,1]' },
      { inputs: ['[9,9,9,9]'], expected: '[1,0,0,0,0]' },
      { inputs: ['[5,5,5,5]'], expected: '[5,5,5,6]' },
      { inputs: ['[2,0,0,0,0]'], expected: '[2,0,0,0,1]' },
    ],
  },
  {
    id: 'sqrtx',
    method_name: 'mySqrt',
    params: [{ name: 'x', type: 'int' }],
    return_type: 'int',
    hints: [
      'Return ⌊√x⌋ — integer square root, no floating point.',
      'Binary search lo=0, hi=x. mid*mid vs x.',
      'Watch overflow: use mid <= x / mid instead of mid*mid <= x.',
      'Newton\'s method also works: x ← (x + n/x) / 2 converges quickly.',
      'O(log x) for binary search, O(log log x) for Newton.',
    ],
    tags: ['math', 'binary-search'],
    constraints: '0 ≤ x ≤ 2^31 − 1',
    follow_up: 'Floating-point precision sqrt — Newton converges to the exact float root.',
    pattern: 'binary-search-on-value',
    test_cases: [
      { inputs: ['4'], expected: '2' },
      { inputs: ['8'], expected: '2' },
      { inputs: ['0'], expected: '0' },
      { inputs: ['1'], expected: '1' },
      { inputs: ['2'], expected: '1' },
      { inputs: ['3'], expected: '1' },
      { inputs: ['9'], expected: '3' },
      { inputs: ['16'], expected: '4' },
      { inputs: ['25'], expected: '5' },
      { inputs: ['100'], expected: '10' },
      { inputs: ['10000'], expected: '100' },
      { inputs: ['2147395599'], expected: '46339' },
      { inputs: ['2147483647'], expected: '46340' },
      { inputs: ['50'], expected: '7' },
      { inputs: ['99'], expected: '9' },
      { inputs: ['10'], expected: '3' },
    ],
  },
  {
    id: 'single-number',
    method_name: 'singleNumber',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Every number appears twice except one. Find that one in O(n) time, O(1) space.',
      'XOR-fold: a ^ a = 0, a ^ 0 = a. XOR all elements and you\'re left with the unique one.',
      'Hashset approach: O(n) space — works but doesn\'t hit the constraint.',
      'Math: 2 * sum(unique) - sum(nums) = the lone one. Also O(n) space (for the set).',
      'XOR is the slickest answer.',
    ],
    tags: ['array', 'bit-manipulation'],
    constraints: '1 ≤ nums.length ≤ 3·10^4\n-3·10^4 ≤ nums[i] ≤ 3·10^4\nExactly one element appears once; all others appear exactly twice.',
    follow_up: '"Single Number II" — all others appear THREE times. Bit-count modulo 3 trick.',
    pattern: 'xor-fold',
    test_cases: [
      { inputs: ['[2,2,1]'], expected: '1' },
      { inputs: ['[4,1,2,1,2]'], expected: '4' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[7,3,7]'], expected: '3' },
      { inputs: ['[0,0,5]'], expected: '5' },
      { inputs: ['[-1,-1,-2]'], expected: '-2' },
      { inputs: ['[10,20,10,30,30]'], expected: '20' },
      { inputs: ['[100]'], expected: '100' },
      { inputs: ['[5,5,5,5,1]'], expected: '1' },
      { inputs: ['[1,2,3,2,1]'], expected: '3' },
      { inputs: ['[-1,-1,42]'], expected: '42' },
      { inputs: ['[1000,-1000,1000]'], expected: '-1000' },
      { inputs: ['[1,1,2,2,3,3,4]'], expected: '4' },
      { inputs: ['[5,3,5,3,7]'], expected: '7' },
    ],
  },
  {
    id: 'excel-column-number',
    method_name: 'titleToNumber',
    params: [{ name: 'columnTitle', type: 'str' }],
    return_type: 'int',
    hints: [
      'Base-26 with letters A-Z as digits 1-26 (no zero — bijective base-26).',
      'Process the string left-to-right: result = result * 26 + (letter - "A" + 1).',
      '"A"=1, "AA"=27, "AZ"=52, "BA"=53, etc.',
      'O(n) time, O(1) space.',
      'Reverse problem: "Excel Sheet Column Title" — repeatedly subtract 1 then mod 26.',
    ],
    tags: ['string', 'math'],
    constraints: '1 ≤ columnTitle.length ≤ 7\nA-Z only\nReturn value ≤ 2^31 − 1',
    follow_up: 'Sheet column TITLE from number — careful with the off-by-one because there\'s no "zero" letter.',
    pattern: 'base-conversion',
    test_cases: [
      { inputs: ['"A"'], expected: '1' },
      { inputs: ['"AB"'], expected: '28' },
      { inputs: ['"ZY"'], expected: '701' },
      { inputs: ['"Z"'], expected: '26' },
      { inputs: ['"AA"'], expected: '27' },
      { inputs: ['"AZ"'], expected: '52' },
      { inputs: ['"BA"'], expected: '53' },
      { inputs: ['"ZZ"'], expected: '702' },
      { inputs: ['"AAA"'], expected: '703' },
      { inputs: ['"FXSHRXW"'], expected: '2147483647' },
      { inputs: ['"AMZN"'], expected: '17784' },
      { inputs: ['"B"'], expected: '2' },
      { inputs: ['"DT"'], expected: '124' },
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
