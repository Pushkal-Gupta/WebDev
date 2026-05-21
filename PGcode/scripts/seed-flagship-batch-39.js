#!/usr/bin/env node
// Batch 39: matrix DP + sequence operations.

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
    id: 'longest-increasing-path-matrix',
    method_name: 'longestIncreasingPath',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'DFS from each cell with memoization on (i, j).',
      'memo[i][j] = 1 + max over 4 neighbors with strictly larger value of memo[ni][nj].',
      'Effectively a DAG longest-path. No revisit risk because edges only go to strictly larger.',
      'O(R·C) time and space.',
      'Topological sort variant: process cells in ascending value order; relax DP per cell.',
    ],
    tags: ['matrix', 'graph', 'dfs', 'dp', 'memoization'],
    constraints: '1 ≤ R, C ≤ 200\n0 ≤ matrix[i][j] ≤ 2^31 − 1',
    follow_up: 'If "strictly larger" becomes "at least as large", cycles become possible; longest-path is NP-hard.',
    pattern: 'dfs-memoization-on-dag',
    test_cases: [
      { inputs: ['[[9,9,4],[6,6,8],[2,1,1]]'], expected: '4' },
      { inputs: ['[[3,4,5],[3,2,6],[2,2,1]]'], expected: '4' },
      { inputs: ['[[1]]'], expected: '1' },
      { inputs: ['[[0]]'], expected: '1' },
      { inputs: ['[[1,2]]'], expected: '2' },
      { inputs: ['[[2,1]]'], expected: '2' },
      { inputs: ['[[1,2,3,4,5]]'], expected: '5' },
      { inputs: ['[[1],[2],[3],[4],[5]]'], expected: '5' },
      { inputs: ['[[7,7,7],[7,7,7],[7,7,7]]'], expected: '1' },
      { inputs: ['[[1,2,3],[6,5,4],[7,8,9]]'], expected: '9' },
    ],
  },
  {
    id: 'is-subsequence',
    method_name: 'isSubsequence',
    params: [{ name: 's', type: 'str' }, { name: 't', type: 'str' }],
    return_type: 'bool',
    hints: [
      'Two pointers: i in s, j in t. Advance j always; advance i when chars match.',
      'Return true iff i == s.length at the end.',
      'O(|t|) time, O(1) space.',
      'For many queries (same t, different s), preprocess t with last-occurrence arrays for O(|s| log |t|).',
      'DP also works (LCS variant) but is overkill.',
    ],
    tags: ['string', 'two-pointers', 'dp'],
    constraints: '0 ≤ s.length ≤ 100\n0 ≤ t.length ≤ 10^4',
    follow_up: 'Match k sub-sequences against one t — precompute t\'s "next-position" table per character.',
    pattern: 'two-pointer-match',
    test_cases: [
      { inputs: ['"abc"', '"ahbgdc"'], expected: 'true' },
      { inputs: ['"axc"', '"ahbgdc"'], expected: 'false' },
      { inputs: ['""', '"abc"'], expected: 'true' },
      { inputs: ['"abc"', '""'], expected: 'false' },
      { inputs: ['""', '""'], expected: 'true' },
      { inputs: ['"a"', '"a"'], expected: 'true' },
      { inputs: ['"a"', '"b"'], expected: 'false' },
      { inputs: ['"abc"', '"abc"'], expected: 'true' },
      { inputs: ['"abc"', '"cba"'], expected: 'false' },
      { inputs: ['"acb"', '"ahbgdc"'], expected: 'false' },
      { inputs: ['"ace"', '"abcdef"'], expected: 'true' },
      { inputs: ['"aaa"', '"aaaaa"'], expected: 'true' },
      { inputs: ['"aaa"', '"aa"'], expected: 'false' },
    ],
  },
  {
    id: 'shortest-bridge',
    method_name: 'shortestBridge',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Two islands; smallest flips to connect them.',
      'Step 1: find one island via DFS/BFS; mark its cells (e.g., set to 2).',
      'Step 2: multi-source BFS from those cells through water (0s). When you reach a 1, that\'s the other island — return the BFS depth.',
      'O(R·C) time and space.',
      'Edge case: each "1" cell from the first island is depth 0 in BFS.',
    ],
    tags: ['graph', 'matrix', 'dfs', 'bfs'],
    constraints: '2 ≤ n ≤ 100\nExactly two islands in the grid',
    follow_up: 'k islands → still tractable: BFS from each one then take pairwise min.',
    pattern: 'find-then-bfs',
    test_cases: [
      { inputs: ['[[0,1],[1,0]]'], expected: '1' },
      { inputs: ['[[0,1,0],[0,0,0],[0,0,1]]'], expected: '2' },
      { inputs: ['[[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]]'], expected: '1' },
      { inputs: ['[[1,1,0,0],[0,0,0,0],[0,0,1,1]]'], expected: '2' },
      { inputs: ['[[1,0],[0,1]]'], expected: '1' },
      { inputs: ['[[1,1],[1,1]]'], expected: '0' },
    ],
  },
  {
    id: 'robot-bounded-in-circle',
    method_name: 'isRobotBounded',
    params: [{ name: 'instructions', type: 'str' }],
    return_type: 'bool',
    hints: [
      'Simulate 1 cycle of the instructions tracking (x, y, direction).',
      'After 1 cycle: if robot returned to origin OR is facing a non-north direction → bounded.',
      'Why? At worst 4 cycles bring you back. Net displacement non-zero with original heading → unbounded.',
      'O(|instructions|) time.',
      'Four directions encoded as 0..3 with dx/dy lookup.',
    ],
    tags: ['string', 'math', 'simulation'],
    constraints: '1 ≤ instructions.length ≤ 100\ninstructions[i] is \'G\', \'L\', or \'R\'',
    follow_up: 'With teleport instructions (\'T\') — track equivalence classes of state.',
    pattern: 'simulation-with-state',
    test_cases: [
      { inputs: ['"GGLLGG"'], expected: 'true' },
      { inputs: ['"GG"'], expected: 'false' },
      { inputs: ['"GL"'], expected: 'true' },
      { inputs: ['"G"'], expected: 'false' },
      { inputs: ['"L"'], expected: 'true' },
      { inputs: ['"R"'], expected: 'true' },
      { inputs: ['"LL"'], expected: 'true' },
      { inputs: ['"RR"'], expected: 'true' },
      { inputs: ['"GLGLGLGL"'], expected: 'true' },
      { inputs: ['"GGGGLLLLGGGG"'], expected: 'true' },
      { inputs: ['"GLRLLGLL"'], expected: 'true' },
      { inputs: ['"GLGLG"'], expected: 'false' },
    ],
  },
  {
    id: 'minimum-operations-reduce-x-to-zero',
    method_name: 'minOperations',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'x', type: 'int' }],
    return_type: 'int',
    hints: [
      'Reframe: instead of removing from the ends, find the LONGEST middle subarray with sum = totalSum - x.',
      'If no such subarray, return -1. Else answer = n - longest.',
      'Sliding window since nums ≥ 1.',
      'Track best window length where sum == target.',
      'O(n) time.',
    ],
    tags: ['array', 'sliding-window', 'prefix-sum', 'hash-map'],
    constraints: '1 ≤ nums.length ≤ 10^5\n1 ≤ nums[i] ≤ 10^4\n1 ≤ x ≤ 10^9',
    follow_up: 'Negative nums variant — sliding window fails; use prefix-sum + hashmap.',
    pattern: 'sliding-window-target-sum',
    test_cases: [
      { inputs: ['[1,1,4,2,3]', '5'], expected: '2' },
      { inputs: ['[5,6,7,8,9]', '4'], expected: '-1' },
      { inputs: ['[3,2,20,1,1,3]', '10'], expected: '5' },
      { inputs: ['[1,1]', '3'], expected: '-1' },
      { inputs: ['[1,1,1]', '3'], expected: '3' },
      { inputs: ['[1]', '1'], expected: '1' },
      { inputs: ['[1]', '2'], expected: '-1' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '1' },
      { inputs: ['[1,2,3,4,5]', '15'], expected: '5' },
      { inputs: ['[1,2,3,4,5]', '16'], expected: '-1' },
      { inputs: ['[10,1,5,3,2]', '15'], expected: '5' },
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
  console.log(`  ✓ ${f.id}  — ${f.test_cases.length} tests, ${f.hints.length} hints, ${f.tags.length} tags`);
  updated += 1;
}
console.log(`\nDone. ${updated}/${FLAGSHIPS.length} flagships hydrated.`);
