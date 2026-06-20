#!/usr/bin/env node
// Batch 14: rotting oranges, number of provinces, valid sudoku, etc.

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
    id: 'rotting-oranges',
    method_name: 'orangesRotting',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Multi-source BFS. All initial rotten cells are level 0.',
      'Each BFS layer rots all 4-adjacent fresh oranges; track levels.',
      'After BFS, if any fresh remain → return -1.',
      'Otherwise return the last level reached.',
      'O(R·C) time and space.',
    ],
    tags: ['matrix', 'bfs', 'graph'],
    constraints: '1 ≤ rows, cols ≤ 10\ngrid[i][j] ∈ {0 (empty), 1 (fresh), 2 (rotten)}',
    follow_up: '"01 Matrix" — same multi-source BFS template, asking for distance to nearest 0.',
    pattern: 'multi-source-bfs',
    test_cases: [
      { inputs: ['[[2,1,1],[1,1,0],[0,1,1]]'], expected: '4' },
      { inputs: ['[[2,1,1],[0,1,1],[1,0,1]]'], expected: '-1' },
      { inputs: ['[[0,2]]'], expected: '0' },
      { inputs: ['[[2]]'], expected: '0' },
      { inputs: ['[[0]]'], expected: '0' },
      { inputs: ['[[1]]'], expected: '-1' },
      { inputs: ['[[2,1],[1,1]]'], expected: '2' },
      { inputs: ['[[1,2]]'], expected: '1' },
      { inputs: ['[[2,2,2,2]]'], expected: '0' },
      { inputs: ['[[2,1,1,1,1]]'], expected: '4' },
      { inputs: ['[[2,1,1,1,1,1,1,1,1,1]]'], expected: '9' },
      { inputs: ['[[0,0,0],[0,0,0]]'], expected: '0' },
      { inputs: ['[[1,1],[1,2]]'], expected: '2' },
      { inputs: ['[[2,1,0],[0,1,2]]'], expected: '1' },
    ],
  },
  {
    id: 'number-of-provinces',
    method_name: 'findCircleNum',
    params: [{ name: 'isConnected', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Count connected components in an undirected graph given as adjacency matrix.',
      'DFS / BFS each unvisited node; increment a counter once per component.',
      'Union-Find: union every connected pair, return the count of roots.',
      'DFS is the cleanest interview answer here.',
      'O(n²) since you read the n×n matrix once.',
    ],
    tags: ['graph', 'dfs', 'bfs', 'union-find'],
    constraints: '1 ≤ n ≤ 200\nisConnected[i][i] = 1\nisConnected is symmetric.',
    follow_up: '"Number of Connected Components in an Undirected Graph" — given an edge list instead of a matrix.',
    pattern: 'connected-components',
    test_cases: [
      { inputs: ['[[1,1,0],[1,1,0],[0,0,1]]'], expected: '2' },
      { inputs: ['[[1,0,0],[0,1,0],[0,0,1]]'], expected: '3' },
      { inputs: ['[[1]]'], expected: '1' },
      { inputs: ['[[1,1],[1,1]]'], expected: '1' },
      { inputs: ['[[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]]'], expected: '1' },
      { inputs: ['[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]'], expected: '4' },
      { inputs: ['[[1,1,0,0,0],[1,1,0,0,0],[0,0,1,1,0],[0,0,1,1,0],[0,0,0,0,1]]'], expected: '3' },
      { inputs: ['[[1,0],[0,1]]'], expected: '2' },
      { inputs: ['[[1,1,1],[1,1,0],[1,0,1]]'], expected: '1' },
      { inputs: ['[[1,1,0,1],[1,1,0,0],[0,0,1,0],[1,0,0,1]]'], expected: '2' },
    ],
  },
  {
    id: 'longest-palindrome',
    method_name: 'longestPalindrome',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'You can rearrange letters; just need the longest palindrome possible.',
      'Pair-counts contribute fully. One odd center allowed at most.',
      'Count character frequencies. Sum even counts plus (count // 2) * 2 for odd counts.',
      'If any count was odd, add 1 (the center).',
      'O(n) time, O(alphabet) space.',
    ],
    tags: ['string', 'hash-map', 'greedy'],
    constraints: '1 ≤ s.length ≤ 2000\ns contains only uppercase and lowercase letters.',
    follow_up: '"Longest Palindromic Substring" — different problem (no rearrangement).',
    pattern: 'frequency-count',
    test_cases: [
      { inputs: ['"abccccdd"'], expected: '7' },
      { inputs: ['"a"'], expected: '1' },
      { inputs: ['"bb"'], expected: '2' },
      { inputs: ['"abc"'], expected: '1' },
      { inputs: ['""'], expected: '0' },
      { inputs: ['"aa"'], expected: '2' },
      { inputs: ['"aaabbbb"'], expected: '7' },
      { inputs: ['"abcdef"'], expected: '1' },
      { inputs: ['"Aa"'], expected: '1' },
      { inputs: ['"AaBb"'], expected: '1' },
      { inputs: ['"ccc"'], expected: '3' },
      { inputs: ['"ccccc"'], expected: '5' },
      { inputs: ['"aabbccdd"'], expected: '8' },
      { inputs: ['"aaabbbccc"'], expected: '7' },
      { inputs: ['"AABBcc"'], expected: '5' },
    ],
  },
  {
    id: 'happy-number',
    method_name: 'isHappy',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'bool',
    hints: [
      'Compute sum-of-squares of digits repeatedly. Either reach 1 (happy) or loop.',
      'Detect the loop with a hashset of seen values.',
      'O(1) space variant: Floyd\'s tortoise-and-hare on the sequence (slow takes 1 step, fast 2).',
      'Unhappy numbers all converge to the 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 cycle.',
      'Numbers ≤ 9-digit max iterations stays small in practice.',
    ],
    tags: ['math', 'hash-set', 'two-pointers'],
    constraints: '1 ≤ n ≤ 2^31 − 1',
    follow_up: 'Generalize to "happy number" in other bases — same algorithm, different digit-sum.',
    pattern: 'cycle-detection',
    test_cases: [
      { inputs: ['19'], expected: 'true' },
      { inputs: ['2'], expected: 'false' },
      { inputs: ['1'], expected: 'true' },
      { inputs: ['7'], expected: 'true' },
      { inputs: ['4'], expected: 'false' },
      { inputs: ['10'], expected: 'true' },
      { inputs: ['100'], expected: 'true' },
      { inputs: ['1000'], expected: 'true' },
      { inputs: ['111'], expected: 'false' },
      { inputs: ['23'], expected: 'true' },
      { inputs: ['44'], expected: 'false' },
      { inputs: ['68'], expected: 'true' },
      { inputs: ['97'], expected: 'true' },
      { inputs: ['13'], expected: 'true' },
    ],
  },
  {
    id: 'valid-sudoku',
    method_name: 'isValidSudoku',
    params: [{ name: 'board', type: 'List[List[str]]' }],
    return_type: 'bool',
    hints: [
      'Three sets per row, column, and 3×3 box.',
      'For each filled cell, check that the digit isn\'t already in its row/col/box set; insert.',
      'Box index: (r/3)*3 + (c/3).',
      'Skip "." cells.',
      'O(81) — constant time.',
    ],
    tags: ['matrix', 'hash-set'],
    constraints: 'board is 9 x 9\nboard[i][j] is a digit "1"-"9" or "."',
    follow_up: '"Sudoku Solver" — backtracking + the same row/col/box constraint structures.',
    pattern: 'cross-set-validation',
    test_cases: [
      { inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'], expected: 'true' },
      { inputs: ['[["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'], expected: 'false' },
      { inputs: ['[[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]'], expected: 'true' },
      { inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","5"]]'], expected: 'false' },
      { inputs: ['[["1","2","3","4","5","6","7","8","9"],["4","5","6","7","8","9","1","2","3"],["7","8","9","1","2","3","4","5","6"],["2","3","1","5","6","4","8","9","7"],["5","6","4","8","9","7","2","3","1"],["8","9","7","2","3","1","5","6","4"],["3","1","2","6","4","5","9","7","8"],["6","4","5","9","7","8","3","1","2"],["9","7","8","3","1","2","6","4","5"]]'], expected: 'true' },
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
