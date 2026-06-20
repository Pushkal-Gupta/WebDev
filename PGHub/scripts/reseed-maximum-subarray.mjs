import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function kadane(nums) {
  let best = nums[0];
  let cur = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}

function stringifyArr(arr) {
  return '[' + arr.map(x => String(x)).join(',') + ']';
}

// Curated inputs
const curated = [
  [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  [1],
  [5, 4, -1, 7, 8],
  [-1],
  [-2, -1],
  [1, 2, 3, 4, 5],
  [-1, -2, -3],
  [0, 0, 0],
  [100, -99, 100],
  [-2, -3, 4, -1, -2, 1, 5, -3],
  [2, -1, 2, 3, 4, -5],
];

// Deterministic PRNG (mulberry32) for reproducibility
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260601);

function randInt(a, b) {
  return Math.floor(rand() * (b - a + 1)) + a;
}

const randomCount = 25 - curated.length;
const randomInputs = [];
for (let i = 0; i < randomCount; i++) {
  const len = randInt(2, 15);
  const arr = [];
  for (let j = 0; j < len; j++) arr.push(randInt(-50, 50));
  randomInputs.push(arr);
}

const allInputs = [...curated, ...randomInputs];

const test_cases = allInputs.map((arr, i) => ({
  inputs: [stringifyArr(arr)],
  expected: String(kadane(arr)),
  sample: i < 3,
}));

const PY_SOLUTION = `class Solution:
    def maxSubArray(self, nums):
        best = cur = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)
            best = max(best, cur)
        return best
`;

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

console.log(`maximum-subarray: ${test_cases.length} cases`);
for (const tc of test_cases.slice(0, 5)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);
for (const tc of test_cases.slice(-3)) console.log(`  ${tc.inputs[0]} -> ${tc.expected}`);

const r = await reseed('maximum-subarray', test_cases, PY_SOLUTION);

console.log('\n--- Results ---');
if (r) console.log(`${r.slug}: prior=${r.prior}, now=${r.now}`);
