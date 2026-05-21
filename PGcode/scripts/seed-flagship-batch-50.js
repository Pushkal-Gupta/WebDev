#!/usr/bin/env node
// Batch 50: classic 1D DP (coin change, house robber, perfect squares, longest valid).

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
    id: 'coin-change',
    method_name: 'coinChange',
    params: [{ name: 'coins', type: 'List[int]' }, { name: 'amount', type: 'int' }],
    return_type: 'int',
    hints: [
      'dp[a] = min coins to make amount a.',
      'Base: dp[0] = 0. Else dp[a] = 1 + min over coins c (where c <= a) of dp[a-c].',
      'Unreachable amounts stay at +infinity. Return dp[amount] or -1 if infinity.',
      'O(amount · |coins|) time, O(amount) space.',
      'BFS variant: layer-by-layer over reachable amounts.',
    ],
    tags: ['array', 'dp', 'bfs'],
    constraints: '1 ≤ coins.length ≤ 12\n1 ≤ coins[i] ≤ 2^31 − 1\n0 ≤ amount ≤ 10^4',
    follow_up: 'Coin Change II — count the number of ways to make the amount. Iterate coins outer, amount inner.',
    pattern: 'unbounded-knapsack',
    test_cases: [
      { inputs: ['[1,2,5]', '11'], expected: '3' },
      { inputs: ['[2]', '3'], expected: '-1' },
      { inputs: ['[1]', '0'], expected: '0' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[1]', '2'], expected: '2' },
      { inputs: ['[2,5,10,1]', '27'], expected: '4' },
      { inputs: ['[186,419,83,408]', '6249'], expected: '20' },
      { inputs: ['[1,2,5]', '100'], expected: '20' },
      { inputs: ['[1,2,5]', '0'], expected: '0' },
      { inputs: ['[3,5]', '7'], expected: '-1' },
      { inputs: ['[1,2,5,10]', '30'], expected: '3' },
      { inputs: ['[7,11]', '14'], expected: '2' },
    ],
  },
  {
    id: 'house-robber',
    method_name: 'rob',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'At each house: rob (cur + dp[i-2]) or skip (dp[i-1]).',
      'dp[i] = max(dp[i-1], dp[i-2] + nums[i]).',
      'O(n) time, O(1) space — only need the last two values.',
      'Base: dp[-1] = 0, dp[-2] = 0.',
      'Variant House Robber II (circular): solve twice — exclude first OR exclude last.',
    ],
    tags: ['array', 'dp'],
    constraints: '1 ≤ nums.length ≤ 100\n0 ≤ nums[i] ≤ 400',
    follow_up: 'House Robber III — tree-shaped. DFS returns (rob this, skip this).',
    pattern: 'linear-dp-2-back',
    test_cases: [
      { inputs: ['[1,2,3,1]'], expected: '4' },
      { inputs: ['[2,7,9,3,1]'], expected: '12' },
      { inputs: ['[0]'], expected: '0' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[1,2]'], expected: '2' },
      { inputs: ['[2,1,1,2]'], expected: '4' },
      { inputs: ['[5,5,10,100,10,5]'], expected: '110' },
      { inputs: ['[1,1,1,1,1,1]'], expected: '3' },
      { inputs: ['[100,1,1,100]'], expected: '200' },
      { inputs: ['[2,3,2]'], expected: '4' },
    ],
  },
  {
    id: 'perfect-squares',
    method_name: 'numSquares',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'dp[i] = least squares summing to i.',
      'dp[i] = 1 + min over j (1..sqrt(i)) of dp[i - j*j].',
      'O(n·sqrt(n)) time.',
      'Lagrange\'s four-square theorem: answer is always 1-4. Closed-form O(sqrt(n)) check.',
      'BFS over reachable numbers — first hit of n is the answer.',
    ],
    tags: ['math', 'dp', 'bfs'],
    constraints: '1 ≤ n ≤ 10^4',
    follow_up: 'Reduce constant factor by checking Lagrange conditions first.',
    pattern: 'classic-dp',
    test_cases: [
      { inputs: ['12'], expected: '3' },
      { inputs: ['13'], expected: '2' },
      { inputs: ['1'], expected: '1' },
      { inputs: ['4'], expected: '1' },
      { inputs: ['9'], expected: '1' },
      { inputs: ['16'], expected: '1' },
      { inputs: ['7'], expected: '4' },
      { inputs: ['28'], expected: '4' },
      { inputs: ['100'], expected: '1' },
      { inputs: ['43'], expected: '3' },
      { inputs: ['10000'], expected: '1' },
      { inputs: ['9999'], expected: '4' },
    ],
  },
  {
    id: 'longest-valid-parentheses',
    method_name: 'longestValidParentheses',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Stack approach: push indices. Push -1 initially as a sentinel.',
      'For \'(\' push i. For \')\' pop. If stack empty after pop, push i as new sentinel. Else length = i - stack.top().',
      'Two-pass O(1)-space: scan left-to-right with counters open, close. When open==close, len = 2*close. If close > open, reset both. Scan right-to-left mirror to catch leading-unbalanced patterns.',
      'DP: dp[i] = longest valid ending at i.',
      'O(n) time.',
    ],
    tags: ['string', 'stack', 'dp'],
    constraints: '0 ≤ s.length ≤ 3·10^4\ns contains only ( and )',
    follow_up: 'Return the actual longest substring — track start index when computing length.',
    pattern: 'stack-with-sentinel',
    test_cases: [
      { inputs: ['"(()"'], expected: '2' },
      { inputs: ['")()()"'], expected: '4' },
      { inputs: ['""'], expected: '0' },
      { inputs: ['"("'], expected: '0' },
      { inputs: ['")"'], expected: '0' },
      { inputs: ['"()"'], expected: '2' },
      { inputs: ['"()(()"'], expected: '2' },
      { inputs: ['"(()(((()"'], expected: '2' },
      { inputs: ['"()(())"'], expected: '6' },
      { inputs: ['"(())(()"'], expected: '4' },
      { inputs: ['"((()))"'], expected: '6' },
      { inputs: ['"()()()()"'], expected: '8' },
    ],
  },
  {
    id: 'palindrome-partitioning',
    method_name: 'partition',
    params: [{ name: 's', type: 'str' }],
    return_type: 'List[List[str]]',
    hints: [
      'Backtrack: at each index, try every prefix that\'s a palindrome.',
      'Recurse on the suffix; collect partial partition.',
      'Precompute pal[i][j] in O(n²) for O(1) palindrome checks.',
      'Output can be exponential — store partition copies, not references.',
      'O(n · 2^n) worst.',
    ],
    tags: ['string', 'backtracking', 'dp'],
    constraints: '1 ≤ s.length ≤ 16\nLowercase English',
    follow_up: 'Palindrome Partitioning II — minimum cuts. DP only on counts.',
    pattern: 'backtracking-with-palindrome-precompute',
    test_cases: [
      { inputs: ['"aab"'], expected: '[["a","a","b"],["aa","b"]]' },
      { inputs: ['"a"'], expected: '[["a"]]' },
      { inputs: ['"ab"'], expected: '[["a","b"]]' },
      { inputs: ['"aba"'], expected: '[["a","b","a"],["aba"]]' },
      { inputs: ['"aaa"'], expected: '[["a","a","a"],["a","aa"],["aa","a"],["aaa"]]' },
      { inputs: ['"abc"'], expected: '[["a","b","c"]]' },
      { inputs: ['"abba"'], expected: '[["a","b","b","a"],["a","bb","a"],["abba"]]' },
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
