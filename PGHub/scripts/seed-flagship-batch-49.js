#!/usr/bin/env node
// Batch 49: DP heavies (burst balloons, target sum, partition, jump, LIS).

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
    id: 'burst-balloons',
    method_name: 'maxCoins',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Counter-intuitive: think backwards. Which balloon is the LAST to burst in range (i, j)?',
      'Pad nums with 1 on both sides.',
      'dp[i][j] = max coins from popping every balloon strictly between i and j.',
      'For each k in (i, j): dp[i][j] = max(dp[i][k] + nums[i]*nums[k]*nums[j] + dp[k][j]).',
      'O(n³) time, O(n²) space.',
    ],
    tags: ['array', 'dp', 'interval-dp'],
    constraints: '1 ≤ nums.length ≤ 300\n0 ≤ nums[i] ≤ 100',
    follow_up: 'Variant: balloons line up in a circle. Treat as linear; pad with 1 on both sides; same DP.',
    pattern: 'interval-dp-with-last-action',
    test_cases: [
      { inputs: ['[3,1,5,8]'], expected: '167' },
      { inputs: ['[1,5]'], expected: '10' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[1,1,1,1]'], expected: '4' },
      { inputs: ['[5,4,3,2,1]'], expected: '110' },
      { inputs: ['[1,2,3,4,5]'], expected: '110' },
      { inputs: ['[7,9,8,0,7,1,3,5,5,2,3]'], expected: '3979' },
      { inputs: ['[100]'], expected: '100' },
      { inputs: ['[0,0,0]'], expected: '0' },
    ],
  },
  {
    id: 'target-sum',
    method_name: 'findTargetSumWays',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'int',
    hints: [
      'Reduce to subset-sum. Let P = positives subset, N = negatives. P + N = sum, P - N = target. So P = (sum + target) / 2.',
      'If (sum + target) is odd or |target| > sum, return 0.',
      'Then count subsets that sum to P — classic 0/1 knapsack.',
      'dp[s] = ways to make sum s. For each num, iterate s from P down to num: dp[s] += dp[s-num].',
      'O(n · P) time, O(P) space.',
    ],
    tags: ['array', 'dp', 'knapsack'],
    constraints: '1 ≤ nums.length ≤ 20\n0 ≤ nums[i] ≤ 1000\n-1000 ≤ target ≤ 1000',
    follow_up: 'Memoize (i, current_sum) — same complexity, easier to write.',
    pattern: 'subset-sum-reduction',
    test_cases: [
      { inputs: ['[1,1,1,1,1]', '3'], expected: '5' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[1]', '-1'], expected: '1' },
      { inputs: ['[1]', '0'], expected: '0' },
      { inputs: ['[1]', '2'], expected: '0' },
      { inputs: ['[0,0,0,0,0,0,0,0,1]', '1'], expected: '256' },
      { inputs: ['[1,0]', '1'], expected: '2' },
      { inputs: ['[100]', '-200'], expected: '0' },
      { inputs: ['[1,2,3,4]', '0'], expected: '2' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '5'], expected: '46' },
    ],
  },
  {
    id: 'partition-equal-subset',
    method_name: 'canPartition',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Sum the array. If odd, immediately false.',
      'Target = sum / 2. Subset sum: can we pick a subset that sums to target?',
      'dp[s] = true if some subset sums to s.',
      'For each num, iterate s from target down to num: dp[s] |= dp[s-num].',
      'O(n · sum) time, O(sum) space.',
    ],
    tags: ['array', 'dp', 'knapsack'],
    constraints: '1 ≤ nums.length ≤ 200\n1 ≤ nums[i] ≤ 100',
    follow_up: 'Partition K Equal Subsets — DP over bitmask of used elements.',
    pattern: 'subset-sum-knapsack',
    test_cases: [
      { inputs: ['[1,5,11,5]'], expected: 'true' },
      { inputs: ['[1,2,3,5]'], expected: 'false' },
      { inputs: ['[1]'], expected: 'false' },
      { inputs: ['[2,2]'], expected: 'true' },
      { inputs: ['[1,1]'], expected: 'true' },
      { inputs: ['[1,2,5]'], expected: 'false' },
      { inputs: ['[100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,99,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97]'], expected: 'false' },
      { inputs: ['[3,3,3,4,5]'], expected: 'true' },
      { inputs: ['[14,9,8,4,3,2]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: 'true' },
    ],
  },
  {
    id: 'jump-game-ii',
    method_name: 'jump',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Greedy BFS layers. Track current-end (furthest you can reach with current jumps) and next-end (furthest reachable from any index in this layer).',
      'When i passes current-end, increment jump count and set current-end = next-end.',
      'next-end = max(next-end, i + nums[i]).',
      'Loop until i == n-1 or current-end >= n-1.',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'greedy', 'bfs'],
    constraints: '1 ≤ nums.length ≤ 10^4\n0 ≤ nums[i] ≤ 1000\nGuaranteed reachable to last index',
    follow_up: 'Recover the actual sequence of jumps — track parent for each layer.',
    pattern: 'greedy-layered-bfs',
    test_cases: [
      { inputs: ['[2,3,1,1,4]'], expected: '2' },
      { inputs: ['[2,3,0,1,4]'], expected: '2' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,1]'], expected: '1' },
      { inputs: ['[2,1]'], expected: '1' },
      { inputs: ['[3,2,1,0,4]'], expected: '2' },
      { inputs: ['[5,1,1,1,1,1]'], expected: '1' },
      { inputs: ['[1,2,3]'], expected: '2' },
      { inputs: ['[10,9,8,7,6,5,4,3,2,1,1,0]'], expected: '2' },
      { inputs: ['[1,1,1,1,1,1,1,1,1,1]'], expected: '9' },
    ],
  },
  {
    id: 'longest-increasing-path-matrix',
    method_name: 'longestIncreasingPath',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'For each cell, DFS to longest strictly-increasing path starting there.',
      'Memoize: dp[i][j] = 1 + max(dp[neighbors with strictly larger value]).',
      'No visited set needed — strict increase prevents revisits.',
      'Answer = max over all cells.',
      'O(mn) time and space.',
    ],
    tags: ['matrix', 'dfs', 'dp', 'memoization'],
    constraints: '1 ≤ rows, cols ≤ 200\n0 ≤ matrix[i][j] ≤ 2^31 − 1',
    follow_up: 'Topological sort by value, then DAG DP.',
    pattern: 'memoized-dfs-on-grid',
    test_cases: [
      { inputs: ['[[9,9,4],[6,6,8],[2,1,1]]'], expected: '4' },
      { inputs: ['[[3,4,5],[3,2,6],[2,2,1]]'], expected: '4' },
      { inputs: ['[[1]]'], expected: '1' },
      { inputs: ['[[1,2,3,4,5]]'], expected: '5' },
      { inputs: ['[[5,4,3,2,1]]'], expected: '5' },
      { inputs: ['[[1],[2],[3],[4],[5]]'], expected: '5' },
      { inputs: ['[[7,7,7],[7,7,7],[7,7,7]]'], expected: '1' },
      { inputs: ['[[1,2],[4,3]]'], expected: '4' },
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
