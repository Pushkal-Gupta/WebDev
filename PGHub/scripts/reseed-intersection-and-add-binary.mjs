import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------- intersection-of-two-arrays ----------

function intersection(a, b) {
  const sa = new Set(a);
  const out = new Set();
  for (const v of b) if (sa.has(v)) out.add(v);
  return [...out].sort((x, y) => x - y);
}

function stringifyIntArr(arr) {
  return '[' + arr.join(',') + ']';
}

const intersectionInputs = [
  // empty inputs
  [[], []],
  [[], [1, 2, 3]],
  [[1, 2, 3], []],
  // single elements
  [[1], [1]],
  [[1], [2]],
  [[5], [5, 5, 5]],
  // all-disjoint
  [[1, 2, 3], [4, 5, 6]],
  [[10, 20, 30], [40, 50, 60]],
  [[-1, -2, -3], [1, 2, 3]],
  // all-overlap
  [[1, 2, 3], [1, 2, 3]],
  [[4, 9, 5], [9, 4, 5]],
  [[7, 7, 7], [7]],
  // duplicates ignored
  [[1, 2, 2, 1], [2, 2]],
  [[4, 9, 5, 9, 4], [9, 4, 9, 8, 4]],
  [[1, 1, 1, 1], [1, 1]],
  [[2, 2, 3, 3, 4, 4], [3, 3, 4, 4, 5, 5]],
  // large overlap
  [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [2, 4, 6, 8, 10, 12]],
  [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5]],
  [[10, 20, 30, 40, 50], [20, 40, 60, 80]],
  // mixed sign
  [[-5, -3, 0, 3, 5], [-3, 0, 5, 7]],
  [[0, 0, 0], [0]],
  // partial
  [[1, 3, 5, 7, 9], [2, 3, 5, 8, 9]],
  [[100, 200, 300], [200, 300, 400]],
  // long disjoint
  [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]],
  // big overlap with dupes
  [[1, 2, 2, 3, 3, 3, 4, 4, 4, 4], [2, 3, 4, 5]],
];

const intersectionCases = intersectionInputs.map(([a, b], i) => ({
  inputs: [stringifyIntArr(a), stringifyIntArr(b)],
  expected: stringifyIntArr(intersection(a, b)),
  sample: i < 3,
}));

const PY_INTERSECTION = `class Solution:
    def intersection(self, nums1, nums2):
        return sorted(set(nums1) & set(nums2))
`;

// ---------- add-binary ----------

function addBinary(a, b) {
  return (BigInt('0b' + a) + BigInt('0b' + b)).toString(2);
}

const addBinaryInputs = [
  // basics
  ['0', '0'],
  ['1', '0'],
  ['0', '1'],
  ['1', '1'],
  // small carries
  ['11', '1'],
  ['10', '1'],
  ['10', '11'],
  ['111', '1'],
  ['101', '11'],
  // canonical LC examples
  ['1010', '1011'],
  ['11', '11'],
  // mismatched lengths
  ['100', '110010'],
  ['1', '11111'],
  ['1101', '101'],
  ['10101', '1'],
  // longer strings
  ['1111', '1111'],
  ['11111111', '1'],
  ['10000000', '10000000'],
  ['11111111', '11111111'],
  // mixed
  ['1010101', '0101010'],
  ['1000000', '111111'],
  ['1100110011', '1010101010'],
  ['111000111', '1010101'],
  // long
  ['10110011001100110011', '1010101010101010101'],
  ['11111111111111111111', '1'],
];

const addBinaryCases = addBinaryInputs.map(([a, b], i) => ({
  inputs: [JSON.stringify(a), JSON.stringify(b)],
  expected: JSON.stringify(addBinary(a, b)),
  sample: i < 3,
}));

const PY_ADD_BINARY = `class Solution:
    def addBinary(self, a, b):
        return bin(int(a,2)+int(b,2))[2:]
`;

// ---------- Apply ----------

async function reseed(slug, test_cases, python) {
  const { data: existing, error: fetchErr } = await sb
    .from('PGcode_problems')
    .select('id, solutions, test_cases')
    .eq('id', slug)
    .maybeSingle();
  if (fetchErr) { console.error(slug, fetchErr); return null; }
  if (!existing) { console.error('Not found:', slug); return null; }
  const prior = Array.isArray(existing.test_cases) ? existing.test_cases.length : 0;
  const solutions = { ...(existing.solutions || {}), python };
  const { error: upErr } = await sb
    .from('PGcode_problems')
    .update({ test_cases, solutions })
    .eq('id', slug);
  if (upErr) { console.error(slug, upErr); return null; }
  return { slug, prior, now: test_cases.length };
}

console.log(`intersection-of-two-arrays: ${intersectionCases.length} cases`);
for (const tc of intersectionCases.slice(0, 5)) console.log(`  ${tc.inputs[0]} ${tc.inputs[1]} -> ${tc.expected}`);
console.log(`  ...`);
for (const tc of intersectionCases.slice(-3)) console.log(`  ${tc.inputs[0]} ${tc.inputs[1]} -> ${tc.expected}`);

console.log(`\nadd-binary: ${addBinaryCases.length} cases`);
for (const tc of addBinaryCases.slice(0, 5)) console.log(`  ${tc.inputs[0]} ${tc.inputs[1]} -> ${tc.expected}`);
console.log(`  ...`);
for (const tc of addBinaryCases.slice(-3)) console.log(`  ${tc.inputs[0]} ${tc.inputs[1]} -> ${tc.expected}`);

const r1 = await reseed('intersection-of-two-arrays', intersectionCases, PY_INTERSECTION);
const r2 = await reseed('add-binary', addBinaryCases, PY_ADD_BINARY);

console.log('\n--- Results ---');
for (const r of [r1, r2]) {
  if (!r) continue;
  console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
}
