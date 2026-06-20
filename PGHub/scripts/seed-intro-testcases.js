#!/usr/bin/env node
// Add method_name + params + return_type + test_cases to the 31 intro
// problems so the solver can auto-grade Run/Submit. The Workspace uses these
// to generate templates and validate output.

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
  { id: 'factorial', method_name: 'factorial', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['0'], expected: '1' },
      { inputs: ['1'], expected: '1' },
      { inputs: ['5'], expected: '120' },
      { inputs: ['10'], expected: '3628800' },
    ] },
  { id: 'gcd', method_name: 'gcd', params: [{ name: 'a', type: 'int' }, { name: 'b', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['48', '18'], expected: '6' },
      { inputs: ['100', '75'], expected: '25' },
      { inputs: ['7', '13'], expected: '1' },
      { inputs: ['0', '5'], expected: '5' },
    ] },
  { id: 'fibonacci', method_name: 'fibonacci', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['0'], expected: '0' },
      { inputs: ['1'], expected: '1' },
      { inputs: ['10'], expected: '55' },
      { inputs: ['20'], expected: '6765' },
    ] },
  { id: 'sum-of-naturals', method_name: 'sumOfNaturals', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['1'], expected: '1' },
      { inputs: ['5'], expected: '15' },
      { inputs: ['100'], expected: '5050' },
    ] },
  { id: 'power', method_name: 'power', params: [{ name: 'x', type: 'int' }, { name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['2', '10'], expected: '1024' },
      { inputs: ['3', '5'], expected: '243' },
      { inputs: ['5', '0'], expected: '1' },
      { inputs: ['1', '100'], expected: '1' },
    ] },
  { id: 'prime-testing', method_name: 'isPrime', params: [{ name: 'n', type: 'int' }], return_type: 'bool',
    test_cases: [
      { inputs: ['2'], expected: 'true' },
      { inputs: ['17'], expected: 'true' },
      { inputs: ['100'], expected: 'false' },
      { inputs: ['1'], expected: 'false' },
    ] },
  { id: 'count-digits', method_name: 'countDigits', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['0'], expected: '1' },
      { inputs: ['7'], expected: '1' },
      { inputs: ['12345'], expected: '5' },
      { inputs: ['1000000'], expected: '7' },
    ] },
  { id: 'all-divisors', method_name: 'allDivisors', params: [{ name: 'n', type: 'int' }], return_type: 'List[int]',
    test_cases: [
      { inputs: ['1'], expected: '[1]' },
      { inputs: ['12'], expected: '[1,2,3,4,6,12]' },
      { inputs: ['36'], expected: '[1,2,3,4,6,9,12,18,36]' },
    ] },
  { id: 'prime-factors', method_name: 'primeFactors', params: [{ name: 'n', type: 'int' }], return_type: 'List[int]',
    test_cases: [
      { inputs: ['12'], expected: '[2,2,3]' },
      { inputs: ['60'], expected: '[2,2,3,5]' },
      { inputs: ['97'], expected: '[97]' },
    ] },
  { id: 'even-or-odd', method_name: 'evenOrOdd', params: [{ name: 'n', type: 'int' }], return_type: 'str',
    test_cases: [
      { inputs: ['4'], expected: 'even' },
      { inputs: ['7'], expected: 'odd' },
      { inputs: ['0'], expected: 'even' },
    ] },
  { id: 'leap-year', method_name: 'isLeapYear', params: [{ name: 'y', type: 'int' }], return_type: 'bool',
    test_cases: [
      { inputs: ['2024'], expected: 'true' },
      { inputs: ['2023'], expected: 'false' },
      { inputs: ['1900'], expected: 'false' },
      { inputs: ['2000'], expected: 'true' },
    ] },
  { id: 'armstrong-number', method_name: 'isArmstrong', params: [{ name: 'n', type: 'int' }], return_type: 'bool',
    test_cases: [
      { inputs: ['153'], expected: 'true' },
      { inputs: ['9'], expected: 'true' },
      { inputs: ['10'], expected: 'false' },
      { inputs: ['371'], expected: 'true' },
    ] },
  { id: 'trailing-zeros', method_name: 'trailingZeros', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['5'], expected: '1' },
      { inputs: ['10'], expected: '2' },
      { inputs: ['25'], expected: '6' },
      { inputs: ['100'], expected: '24' },
    ] },
  { id: 'reverse-a-number', method_name: 'reverseNumber', params: [{ name: 'n', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['123'], expected: '321' },
      { inputs: ['1200'], expected: '21' },
      { inputs: ['0'], expected: '0' },
    ] },
  { id: 'palindrome-number', method_name: 'isPalindrome', params: [{ name: 'n', type: 'int' }], return_type: 'bool',
    test_cases: [
      { inputs: ['121'], expected: 'true' },
      { inputs: ['-121'], expected: 'false' },
      { inputs: ['10'], expected: 'false' },
      { inputs: ['0'], expected: 'true' },
    ] },
  { id: 'happy-number', method_name: 'isHappy', params: [{ name: 'n', type: 'int' }], return_type: 'bool',
    test_cases: [
      { inputs: ['19'], expected: 'true' },
      { inputs: ['2'], expected: 'false' },
      { inputs: ['1'], expected: 'true' },
    ] },
  { id: 'reverse-string', method_name: 'reverseString', params: [{ name: 's', type: 'str' }], return_type: 'str',
    test_cases: [
      { inputs: ['"hello"'], expected: 'olleh' },
      { inputs: ['"a"'], expected: 'a' },
      { inputs: ['"PGcode"'], expected: 'edocGP' },
    ] },
  { id: 'check-anagram', method_name: 'isAnagram', params: [{ name: 's', type: 'str' }, { name: 't', type: 'str' }], return_type: 'bool',
    test_cases: [
      { inputs: ['"anagram"', '"nagaram"'], expected: 'true' },
      { inputs: ['"rat"', '"car"'], expected: 'false' },
      { inputs: ['"abc"', '"cba"'], expected: 'true' },
    ] },
  { id: 'valid-parentheses', method_name: 'isValid', params: [{ name: 's', type: 'str' }], return_type: 'bool',
    test_cases: [
      { inputs: ['"()"'], expected: 'true' },
      { inputs: ['"()[]{}"'], expected: 'true' },
      { inputs: ['"(]"'], expected: 'false' },
      { inputs: ['"((("'], expected: 'false' },
    ] },
  { id: 'binary-search-iterative', method_name: 'binarySearch', params: [{ name: 'arr', type: 'List[int]' }, { name: 'target', type: 'int' }], return_type: 'int',
    test_cases: [
      { inputs: ['[1,3,5,7,9,11]', '7'], expected: '3' },
      { inputs: ['[1,3,5,7,9,11]', '4'], expected: '-1' },
      { inputs: ['[]', '1'], expected: '-1' },
      { inputs: ['[5]', '5'], expected: '0' },
    ] },
];

const rows = CASES.map(c => ({
  id: c.id,
  method_name: c.method_name,
  params: c.params,
  return_type: c.return_type,
  test_cases: c.test_cases,
}));

// Fetch all NOT NULL columns we don't want to clobber.
const { data: existing } = await sb.from('PGcode_problems').select('id,name,topic_id,difficulty,description').in('id', rows.map(r => r.id));
const meta = Object.fromEntries((existing || []).map(r => [r.id, r]));
for (const r of rows) {
  r.name = meta[r.id]?.name || r.id;
  r.topic_id = meta[r.id]?.topic_id || 'math';
  r.difficulty = meta[r.id]?.difficulty || 'Easy';
  r.description = meta[r.id]?.description || `<p>${r.name}</p>`;
}

const { error } = await sb.from('PGcode_problems').upsert(rows, { onConflict: 'id' });
if (error) { console.error(error.message); process.exit(1); }
console.log(`Attached test cases + metadata to ${rows.length} problems.`);
