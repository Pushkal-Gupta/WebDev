#!/usr/bin/env node
// Second batch of test cases. Covers the next-most-common Tutorial problems
// across topics: bit manipulation, string ops, array transforms, tree traversal.

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

const CASES = [
  // Math
  { id: 'closest-number', method_name: 'closestNumber', params: [{ name: 'n', type: 'int' }, { name: 'm', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['13', '4'], expected: '12' },
      { inputs: ['-15', '6'], expected: '-12' },
      { inputs: ['0', '7'], expected: '0' },
    ] },
  { id: 'lcm', method_name: 'lcm', params: [{ name: 'a', type: 'int' }, { name: 'b', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['4', '6'], expected: '12' },
      { inputs: ['7', '13'], expected: '91' },
      { inputs: ['10', '20'], expected: '20' },
    ] },
  { id: 'sum-of-divisors', method_name: 'sumOfDivisors', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['6'], expected: '12' },   // 1+2+3+6
      { inputs: ['12'], expected: '28' },  // 1+2+3+4+6+12
      { inputs: ['1'], expected: '1' },
    ] },
  // Bit
  { id: 'count-set-bits', method_name: 'countSetBits', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['7'], expected: '3' },
      { inputs: ['1024'], expected: '1' },
      { inputs: ['0'], expected: '0' },
      { inputs: ['255'], expected: '8' },
    ] },
  { id: 'is-power-of-two', method_name: 'isPowerOfTwo', params: [{ name: 'n', type: 'int' }], return_type: 'bool',
    test_cases: [
      { inputs: ['1'], expected: 'true' },
      { inputs: ['16'], expected: 'true' },
      { inputs: ['1024'], expected: 'true' },
      { inputs: ['0'], expected: 'false' },
      { inputs: ['18'], expected: 'false' },
    ] },
  { id: 'single-number', method_name: 'singleNumber', params: [{ name: 'arr', type: 'List[int]' }], return_type: 'int',
    test_cases: [
      { inputs: ['[2,2,1]'], expected: '1' },
      { inputs: ['[4,1,2,1,2]'], expected: '4' },
      { inputs: ['[1]'], expected: '1' },
    ] },
  // String
  { id: 'longest-substring', method_name: 'lengthOfLongestSubstring', params: [{ name: 's', type: 'str' }], return_type: 'int',
    test_cases: [
      { inputs: ['"abcabcbb"'], expected: '3' },
      { inputs: ['"bbbbb"'], expected: '1' },
      { inputs: ['"pwwkew"'], expected: '3' },
      { inputs: ['""'], expected: '0' },
    ] },
  { id: 'first-non-repeating-character', method_name: 'firstUniqChar', params: [{ name: 's', type: 'str' }], return_type: 'int',
    test_cases: [
      { inputs: ['"leetcode"'], expected: '0' },
      { inputs: ['"loveleetcode"'], expected: '2' },
      { inputs: ['"aabb"'], expected: '-1' },
    ] },
  // Array
  { id: 'two-sum', method_name: 'twoSum', params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }], return_type: 'List[int]',
    test_cases: [
      { inputs: ['[2,7,11,15]', '9'], expected: '[0,1]' },
      { inputs: ['[3,2,4]', '6'], expected: '[1,2]' },
      { inputs: ['[3,3]', '6'], expected: '[0,1]' },
    ] },
  { id: 'max-subarray', method_name: 'maxSubArray', params: [{ name: 'nums', type: 'List[int]' }], return_type: 'int',
    test_cases: [
      { inputs: ['[-2,1,-3,4,-1,2,1,-5,4]'], expected: '6' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[5,4,-1,7,8]'], expected: '23' },
    ] },
  { id: 'rotate-array', method_name: 'rotate', params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }], return_type: 'List[int]',
    test_cases: [
      { inputs: ['[1,2,3,4,5,6,7]', '3'], expected: '[5,6,7,1,2,3,4]' },
      { inputs: ['[-1,-100,3,99]', '2'], expected: '[3,99,-1,-100]' },
      { inputs: ['[1]', '0'], expected: '[1]' },
    ] },
  { id: 'move-zeroes', method_name: 'moveZeroes', params: [{ name: 'nums', type: 'List[int]' }], return_type: 'List[int]',
    test_cases: [
      { inputs: ['[0,1,0,3,12]'], expected: '[1,3,12,0,0]' },
      { inputs: ['[0]'], expected: '[0]' },
      { inputs: ['[1,2,3]'], expected: '[1,2,3]' },
    ] },
  // Recursion / classic
  { id: 'tower-of-hanoi', method_name: 'towerOfHanoi', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['1'], expected: '1' },
      { inputs: ['3'], expected: '7' },
      { inputs: ['5'], expected: '31' },
      { inputs: ['10'], expected: '1023' },
    ] },
];

const { data: existing } = await sb.from('PGcode_problems').select('id,name,topic_id,difficulty,description').in('id', CASES.map(c => c.id));
const meta = Object.fromEntries((existing || []).map(r => [r.id, r]));
const rows = CASES
  .filter(c => meta[c.id]) // only update problems that already exist as stubs
  .map(c => ({
    id: c.id,
    name: meta[c.id].name,
    topic_id: meta[c.id].topic_id,
    difficulty: meta[c.id].difficulty,
    description: meta[c.id].description,
    method_name: c.method_name,
    params: c.params,
    return_type: c.return_type,
    test_cases: c.test_cases,
  }));

console.log(`Will attach test cases to ${rows.length} of ${CASES.length} problems (${CASES.length - rows.length} not yet seeded as stubs).`);
if (rows.length === 0) process.exit(0);

const { error } = await sb.from('PGcode_problems').upsert(rows, { onConflict: 'id' });
if (error) { console.error(error.message); process.exit(1); }
console.log(`Done. ${rows.length} more problems now auto-grade.`);
