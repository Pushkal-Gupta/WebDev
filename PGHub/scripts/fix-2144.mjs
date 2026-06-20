import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGcode';
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SLUG = 'minimum-cost-of-buying-candies-with-discount';

// Canonical solution
function minimumCost(cost) {
  const sorted = [...cost].sort((a, b) => b - a);
  let total = 0;
  for (let i = 0; i < sorted.length; i += 3) {
    total += sorted[i];
    if (i + 1 < sorted.length) total += sorted[i + 1];
  }
  return total;
}

// 20+ test cases covering edges
const inputs = [
  [1, 2, 3],
  [6, 5, 7, 9, 2, 2],
  [5, 5],
  [10],
  [1],
  [100, 90, 80, 70, 60, 50],
  [4, 4, 4],
  [1, 1, 1, 1, 1, 1],
  [50, 50, 50, 50],
  [1, 1, 1],
  [2, 1],
  [7, 3, 5, 4, 8, 1, 6, 2],
  [100],
  [100, 1],
  [100, 1, 1],
  [100, 100, 1],
  [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  [3, 3, 3, 3, 3, 3, 3, 3, 3],
  [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88],
  [25, 75, 50],
  [1, 100],
  [1, 100, 50, 25, 75, 10, 90],
  [5, 5, 5, 5, 5],
  [8, 6, 7, 5, 3, 0, 9],
];

const samples = new Set([0, 1, 2]); // first 3 are sample
const test_cases = inputs.map((arr, i) => ({
  inputs: [JSON.stringify(arr)],
  expected: String(minimumCost(arr)),
  sample: samples.has(i),
}));

console.log(`Computed ${test_cases.length} cases:`);
for (const tc of test_cases) console.log(`  ${tc.inputs[0]} -> ${tc.expected}${tc.sample ? ' [sample]' : ''}`);

// Ensure the canonical solution is in DB.solutions.python so verify-prune uses it
const { data: existing, error: fetchErr } = await sb
  .from('PGcode_problems')
  .select('id, solutions, test_cases')
  .eq('id', SLUG)
  .maybeSingle();

if (fetchErr) { console.error(fetchErr); process.exit(1); }
if (!existing) { console.error('Problem not found'); process.exit(1); }

const canonicalPy = `class Solution:
    def minimumCost(self, cost):
        cost.sort(reverse=True)
        total = 0
        for i in range(0, len(cost), 3):
            total += cost[i]
            if i + 1 < len(cost):
                total += cost[i + 1]
        return total
`;

const solutions = { ...(existing.solutions || {}) };
solutions.python = canonicalPy;

const { error: upErr } = await sb
  .from('PGcode_problems')
  .update({ test_cases, solutions })
  .eq('id', SLUG);

if (upErr) { console.error(upErr); process.exit(1); }
console.log(`Updated DB: ${test_cases.length} cases + canonical python solution.`);
