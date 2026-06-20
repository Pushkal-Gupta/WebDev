#!/usr/bin/env node
// Pushes 35 test cases + 5 hints + tags + constraints + follow_up + pattern
// for the binary-search problem to the live DB. The structured solutions
// and viz_steps are also written if migrate-28 has been applied; otherwise
// the client falls back to src/content/problemContent.js.

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

// 35 test cases — edges, boundaries, negatives, even/odd lengths, stress.
const TEST_CASES = [
  { inputs: ['[-1,0,3,5,9,12]', '9'], expected: '4' },
  { inputs: ['[-1,0,3,5,9,12]', '2'], expected: '-1' },
  { inputs: ['[5]', '5'], expected: '0' },
  { inputs: ['[5]', '-5'], expected: '-1' },
  { inputs: ['[1,2]', '1'], expected: '0' },
  { inputs: ['[1,2]', '2'], expected: '1' },
  { inputs: ['[1,2]', '0'], expected: '-1' },
  { inputs: ['[1,2]', '3'], expected: '-1' },
  { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '1'], expected: '0' },
  { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '10'], expected: '9' },
  { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5'], expected: '4' },
  { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '6'], expected: '5' },
  { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '11'], expected: '-1' },
  { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '0'], expected: '-1' },
  { inputs: ['[-10,-5,0,3,7]', '0'], expected: '2' },
  { inputs: ['[-10,-5,0,3,7]', '-10'], expected: '0' },
  { inputs: ['[-10,-5,0,3,7]', '7'], expected: '4' },
  { inputs: ['[-10,-5,0,3,7]', '-3'], expected: '-1' },
  { inputs: ['[-10,-5,0,3,7]', '8'], expected: '-1' },
  { inputs: ['[-10,-5,0,3,7]', '-11'], expected: '-1' },
  { inputs: ['[1,3,5,7,9,11,13]', '7'], expected: '3' },
  { inputs: ['[1,3,5,7,9,11,13]', '6'], expected: '-1' },
  { inputs: ['[1,3,5,7,9,11,13]', '13'], expected: '6' },
  { inputs: ['[1,3,5,7,9,11,13]', '1'], expected: '0' },
  { inputs: ['[100]', '100'], expected: '0' },
  { inputs: ['[100]', '99'], expected: '-1' },
  { inputs: ['[2,4,6,8,10,12,14,16]', '2'], expected: '0' },
  { inputs: ['[2,4,6,8,10,12,14,16]', '16'], expected: '7' },
  { inputs: ['[2,4,6,8,10,12,14,16]', '8'], expected: '3' },
  { inputs: ['[2,4,6,8,10,12,14,16]', '10'], expected: '4' },
  { inputs: ['[2,4,6,8,10,12,14,16]', '9'], expected: '-1' },
  { inputs: ['[2,4,6,8,10,12,14,16]', '17'], expected: '-1' },
  { inputs: ['[2,4,6,8,10,12,14,16]', '1'], expected: '-1' },
  { inputs: ['[' + Array.from({ length: 100 }, (_, i) => i * 2).join(',') + ']', '50'], expected: '25' },
  { inputs: ['[' + Array.from({ length: 100 }, (_, i) => i * 2).join(',') + ']', '99'], expected: '-1' },
];

const HINTS = [
  'The array is sorted — leverage that.',
  'Maintain two pointers `lo` and `hi` bracketing the active search window.',
  'Each iteration, look at the middle element; halve the window based on the comparison.',
  'Use `lo + (hi - lo) / 2` instead of `(lo + hi) / 2` to avoid integer overflow on huge arrays.',
  'When `lo > hi`, the window is empty — return -1.',
];

const TAGS = ['binary-search', 'array', 'divide-and-conquer'];

const PAYLOAD = {
  id: 'binary-search',
  hints: HINTS,
  tags: TAGS,
  constraints: '1 ≤ nums.length ≤ 10^4. -10^4 < nums[i], target < 10^4. All integers in nums are unique. nums is sorted in ascending order.',
  follow_up: 'Can you handle duplicates by returning the leftmost or rightmost occurrence? Look at "Find First and Last Position of Element in Sorted Array."',
  pattern: 'binary-search',
  test_cases: TEST_CASES,
  method_name: 'search',
  params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
  return_type: 'int',
};

// Fetch existing required columns to satisfy NOT NULL.
const { data: existing } = await sb.from('PGcode_problems').select('*').eq('id', 'binary-search').maybeSingle();
if (!existing) { console.error('binary-search row missing!'); process.exit(1); }

const row = {
  ...PAYLOAD,
  name: existing.name,
  topic_id: existing.topic_id,
  difficulty: existing.difficulty,
  description: existing.description,
  roadmap_set: existing.roadmap_set || '100',
};

const { error } = await sb.from('PGcode_problems').upsert(row, { onConflict: 'id' });
if (error) { console.error(error.message); process.exit(1); }

console.log('Binary search updated:');
console.log(`  ${TEST_CASES.length} test cases`);
console.log(`  ${HINTS.length} hints`);
console.log(`  ${TAGS.length} tags`);
console.log('  constraints + follow_up + pattern + driver metadata');
