#!/usr/bin/env node
// Batch 55: greedy + grid DP classics.

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
    id: 'min-cost-climbing-stairs',
    method_name: 'minCostClimbingStairs',
    params: [{ name: 'cost', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'dp[i] = min cost to REACH step i (paying cost[i] when you step on it).',
      'dp[i] = cost[i] + min(dp[i-1], dp[i-2]).',
      'Final answer = min(dp[n-1], dp[n-2]) — last step can be from either.',
      'O(n) time, O(1) space — only need last two values.',
      'Base: dp[0] = cost[0], dp[1] = cost[1].',
    ],
    tags: ['array', 'dp'],
    constraints: '2 ≤ cost.length ≤ 1000\n0 ≤ cost[i] ≤ 999',
    follow_up: 'Generalize to k-step jumps — dp[i] = cost[i] + min over j (1..k) of dp[i-j].',
    pattern: 'linear-dp-2-back',
    test_cases: [
      { inputs: ['[10,15,20]'], expected: '15' },
      { inputs: ['[1,100,1,1,1,100,1,1,100,1]'], expected: '6' },
      { inputs: ['[0,0]'], expected: '0' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[2,1]'], expected: '1' },
      { inputs: ['[100,1]'], expected: '1' },
      { inputs: ['[1,100]'], expected: '1' },
      { inputs: ['[10,20,30,40,50]'], expected: '60' },
      { inputs: ['[0,1,2,2]'], expected: '2' },
      { inputs: ['[1,1,1,1,1,1]'], expected: '3' },
    ],
  },
  {
    id: 'paint-house',
    method_name: 'minCost',
    params: [{ name: 'costs', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'dp[i][c] = min cost to paint houses 0..i where house i is color c.',
      'dp[i][c] = costs[i][c] + min(dp[i-1][c\']) over c\' != c.',
      'Base: dp[0][c] = costs[0][c].',
      'O(n · 3) = O(n). O(1) space with three rolling values.',
      'Variant Paint House II: k colors. Track min and second-min per row → O(nk).',
    ],
    tags: ['array', 'dp'],
    constraints: '1 ≤ costs.length ≤ 100\ncosts[i].length == 3\n0 ≤ costs[i][j] ≤ 20',
    follow_up: 'Paint House II — k colors. Track top-2 of previous row for O(nk).',
    pattern: 'dp-with-forbidden-state',
    test_cases: [
      { inputs: ['[[17,2,17],[16,16,5],[14,3,19]]'], expected: '10' },
      { inputs: ['[[7,6,2]]'], expected: '2' },
      { inputs: ['[[1,2,3]]'], expected: '1' },
      { inputs: ['[[1,1,1]]'], expected: '1' },
      { inputs: ['[[1,2,3],[3,2,1]]'], expected: '2' },
      { inputs: ['[[5,5,5],[5,5,5]]'], expected: '10' },
      { inputs: ['[[1,50,50],[50,1,50],[50,50,1]]'], expected: '3' },
    ],
  },
  {
    id: 'unique-paths',
    method_name: 'uniquePaths',
    params: [{ name: 'm', type: 'int' }, { name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'dp[i][j] = ways to reach (i, j) — only from above or left.',
      'dp[i][j] = dp[i-1][j] + dp[i][j-1]. Base: dp[0][*] = dp[*][0] = 1.',
      'O(mn) time, O(min(m, n)) space using a rolling 1D array.',
      'Closed-form: C(m+n-2, m-1) — but watch overflow.',
      'Unique Paths II adds obstacles — set blocked cells to 0.',
    ],
    tags: ['array', 'dp', 'math'],
    constraints: '1 ≤ m, n ≤ 100\nResult fits 32-bit signed',
    follow_up: 'Unique Paths III — collect all empty squares; backtracking with bitmask.',
    pattern: 'grid-dp',
    test_cases: [
      { inputs: ['3', '7'], expected: '28' },
      { inputs: ['3', '2'], expected: '3' },
      { inputs: ['1', '1'], expected: '1' },
      { inputs: ['1', '10'], expected: '1' },
      { inputs: ['10', '1'], expected: '1' },
      { inputs: ['2', '2'], expected: '2' },
      { inputs: ['7', '3'], expected: '28' },
      { inputs: ['10', '10'], expected: '48620' },
      { inputs: ['23', '12'], expected: '193536720' },
      { inputs: ['1', '100'], expected: '1' },
    ],
  },
  {
    id: 'candy',
    method_name: 'candy',
    params: [{ name: 'ratings', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Two passes. Initialize candies[i] = 1.',
      'Left-to-right: if ratings[i] > ratings[i-1], candies[i] = candies[i-1] + 1.',
      'Right-to-left: if ratings[i] > ratings[i+1], candies[i] = max(candies[i], candies[i+1] + 1).',
      'Sum = answer.',
      'O(n) time, O(n) space.',
    ],
    tags: ['array', 'greedy', 'dp'],
    constraints: '1 ≤ ratings.length ≤ 2·10^4\n0 ≤ ratings[i] ≤ 2·10^4',
    follow_up: 'O(1) extra space — single pass tracking up/down slope lengths.',
    pattern: 'two-pass-left-right',
    test_cases: [
      { inputs: ['[1,0,2]'], expected: '5' },
      { inputs: ['[1,2,2]'], expected: '4' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '3' },
      { inputs: ['[2,1]'], expected: '3' },
      { inputs: ['[1,2,3,4,5]'], expected: '15' },
      { inputs: ['[5,4,3,2,1]'], expected: '15' },
      { inputs: ['[1,3,2,2,1]'], expected: '7' },
      { inputs: ['[1,2,87,87,87,2,1]'], expected: '13' },
      { inputs: ['[1,1,1,1]'], expected: '4' },
    ],
  },
  {
    id: 'gas-station',
    method_name: 'canCompleteCircuit',
    params: [{ name: 'gas', type: 'List[int]' }, { name: 'cost', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'If total(gas) < total(cost), no solution. Return -1.',
      'Otherwise, scan once with running tank and current start.',
      'If tank ever goes negative, reset start = i + 1 and tank = 0.',
      'Final start is the unique answer (guaranteed when total(gas) >= total(cost)).',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'greedy'],
    constraints: 'n == gas.length == cost.length\n1 ≤ n ≤ 10^5\n0 ≤ gas[i], cost[i] ≤ 10^4',
    follow_up: 'Multiple starts work in some inputs — return all valid? Use brute force.',
    pattern: 'single-pass-greedy-reset',
    test_cases: [
      { inputs: ['[1,2,3,4,5]', '[3,4,5,1,2]'], expected: '3' },
      { inputs: ['[2,3,4]', '[3,4,3]'], expected: '-1' },
      { inputs: ['[5]', '[4]'], expected: '0' },
      { inputs: ['[5]', '[5]'], expected: '0' },
      { inputs: ['[5]', '[6]'], expected: '-1' },
      { inputs: ['[1,2]', '[2,1]'], expected: '1' },
      { inputs: ['[3,1,1]', '[1,2,2]'], expected: '0' },
      { inputs: ['[4,5,2,6,5,3]', '[3,2,7,3,2,9]'], expected: '-1' },
      { inputs: ['[5,1,2,3,4]', '[4,4,1,5,1]'], expected: '4' },
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
  console.log(`  ${f.id}  - ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
