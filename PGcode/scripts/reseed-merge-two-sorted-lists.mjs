import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SLUG = 'merge-two-sorted-lists';

// Reference merge (treat input arrays as already-sorted linked-list values)
function merge(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) { out.push(a[i]); i++; }
    else { out.push(b[j]); j++; }
  }
  while (i < a.length) { out.push(a[i]); i++; }
  while (j < b.length) { out.push(b[j]); j++; }
  return out;
}

const stringify = (arr) => '[' + arr.join(',') + ']';

const pairs = [
  // both empty
  [[], []],
  // one empty, other not
  [[], [0]],
  [[1, 2, 3], []],
  [[], [-5, -3, -1, 0, 2]],
  // same length, interleaved
  [[1, 2, 4], [1, 3, 4]],
  [[1, 3, 5], [2, 4, 6]],
  [[2, 4, 6], [1, 3, 5]],
  // different lengths
  [[1], [2, 3, 4, 5]],
  [[1, 2, 3, 4, 5], [6]],
  [[1, 5, 9], [2, 3, 4, 6, 7, 8, 10]],
  // duplicates
  [[1, 1, 1], [1, 1, 1]],
  [[2, 2, 3], [2, 2, 4]],
  [[1, 2, 2, 3], [2, 2, 3, 4]],
  // negative numbers
  [[-10, -5, 0], [-7, -3, 4]],
  [[-100, -50, -1], [-99, -49, -2]],
  [[-3, -2, -1], [1, 2, 3]],
  // single element each
  [[1], [2]],
  [[2], [1]],
  [[5], [5]],
  [[-1], [1]],
  // disjoint ranges
  [[1, 2, 3], [10, 20, 30]],
  [[10, 20, 30], [1, 2, 3]],
  // long sequences
  [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
  // zeros and mixed
  [[0, 0, 0], [0, 0, 0]],
  [[-2, 0, 2], [-1, 0, 1]],
];

const samples = new Set([4, 0, 2]); // [1,2,4]+[1,3,4], both empty, one empty
const test_cases = pairs.map(([a, b], i) => ({
  inputs: [stringify(a), stringify(b)],
  expected: stringify(merge(a, b)),
  sample: samples.has(i),
}));

console.log(`Computed ${test_cases.length} cases:`);
for (const tc of test_cases) {
  console.log(`  ${tc.inputs[0]} + ${tc.inputs[1]} -> ${tc.expected}${tc.sample ? ' [sample]' : ''}`);
}

const { data: existing, error: fetchErr } = await sb
  .from('PGcode_problems')
  .select('id, solutions, test_cases')
  .eq('id', SLUG)
  .maybeSingle();

if (fetchErr) { console.error(fetchErr); process.exit(1); }
if (!existing) { console.error('Problem not found for slug', SLUG); process.exit(1); }

const priorCount = Array.isArray(existing.test_cases) ? existing.test_cases.length : 0;

const canonicalPy = `class Solution:
    def mergeTwoLists(self, list1, list2):
        out = []
        i = j = 0
        while i < len(list1) and j < len(list2):
            if list1[i] <= list2[j]:
                out.append(list1[i]); i += 1
            else:
                out.append(list2[j]); j += 1
        out.extend(list1[i:])
        out.extend(list2[j:])
        return out
`;

const solutions = { ...(existing.solutions || {}) };
solutions.python = canonicalPy;

const { error: upErr } = await sb
  .from('PGcode_problems')
  .update({ test_cases, solutions })
  .eq('id', SLUG);

if (upErr) { console.error(upErr); process.exit(1); }

console.log(`\nPrior cases: ${priorCount}`);
console.log(`New cases:   ${test_cases.length}`);
console.log(`Pruned:      ${Math.max(0, priorCount - test_cases.length)}`);
console.log(`Added:       ${Math.max(0, test_cases.length - priorCount)}`);
console.log(`Kept:        ${test_cases.length}`);
console.log(`Updated DB row id=${SLUG}.`);
