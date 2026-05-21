#!/usr/bin/env node
// Batch 52: matrix / array classics.

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
    id: 'valid-sudoku',
    method_name: 'isValidSudoku',
    params: [{ name: 'board', type: 'List[List[str]]' }],
    return_type: 'bool',
    hints: [
      'Three sets per row, per col, per 3x3 box.',
      'For each non-empty cell, build keys ("row1-5", "col3-5", "box01-5"). Reject on duplicate.',
      'Box index: (r/3) * 3 + (c/3).',
      'O(81) time, O(81) space.',
      'Bitmask alternative: int[9] for rows/cols/boxes; bit i for digit i+1.',
    ],
    tags: ['matrix', 'hash-set'],
    constraints: 'board is 9x9\nEach cell is digit 1-9 or "."',
    follow_up: 'Sudoku Solver — backtracking + same constraint sets for pruning.',
    pattern: 'constraint-tracking-sets',
    test_cases: [
      { inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'], expected: 'true' },
      { inputs: ['[["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'], expected: 'false' },
      { inputs: ['[[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]'], expected: 'true' },
    ],
  },
  {
    id: 'rotate-image',
    method_name: 'rotate',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      '90 degrees clockwise = transpose, then reverse each row.',
      'Transpose: swap matrix[i][j] with matrix[j][i] for j > i.',
      'Reverse: two-pointer per row.',
      'O(n²) time, O(1) space — in place.',
      'Or layer-by-layer 4-cycle swap: for each ring, swap 4 cells at a time.',
    ],
    tags: ['matrix', 'in-place'],
    constraints: '1 ≤ n ≤ 20\n-1000 ≤ matrix[i][j] ≤ 1000',
    follow_up: 'Counter-clockwise: transpose then reverse columns; OR reverse rows then transpose.',
    pattern: 'transpose-then-reverse',
    test_cases: [
      { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[[7,4,1],[8,5,2],[9,6,3]]' },
      { inputs: ['[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]'], expected: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]' },
      { inputs: ['[[1]]'], expected: '[[1]]' },
      { inputs: ['[[1,2],[3,4]]'], expected: '[[3,1],[4,2]]' },
      { inputs: ['[[0,0],[0,0]]'], expected: '[[0,0],[0,0]]' },
      { inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]'], expected: '[[13,9,5,1],[14,10,6,2],[15,11,7,3],[16,12,8,4]]' },
    ],
  },
  {
    id: 'spiral-matrix',
    method_name: 'spiralOrder',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    hints: [
      'Track four bounds: top, bottom, left, right.',
      'Each pass: top row L→R; right col T→B; bottom row R→L (if rows remain); left col B→T (if cols remain).',
      'Shrink bounds after each pass.',
      'Stop when top > bottom or left > right.',
      'O(mn) time, O(1) extra space.',
    ],
    tags: ['matrix', 'simulation'],
    constraints: '1 ≤ m, n ≤ 10\n-100 ≤ matrix[i][j] ≤ 100',
    follow_up: 'Spiral Matrix II — fill with 1..n² in spiral order.',
    pattern: 'four-bound-spiral',
    test_cases: [
      { inputs: ['[[1,2,3],[4,5,6],[7,8,9]]'], expected: '[1,2,3,6,9,8,7,4,5]' },
      { inputs: ['[[1,2,3,4],[5,6,7,8],[9,10,11,12]]'], expected: '[1,2,3,4,8,12,11,10,9,5,6,7]' },
      { inputs: ['[[1]]'], expected: '[1]' },
      { inputs: ['[[1,2]]'], expected: '[1,2]' },
      { inputs: ['[[1],[2]]'], expected: '[1,2]' },
      { inputs: ['[[1,2,3]]'], expected: '[1,2,3]' },
      { inputs: ['[[1],[2],[3]]'], expected: '[1,2,3]' },
      { inputs: ['[[1,2],[3,4]]'], expected: '[1,2,4,3]' },
    ],
  },
  {
    id: 'set-matrix-zeroes',
    method_name: 'setZeroes',
    params: [{ name: 'matrix', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Brute: track zero rows/cols in sets — O(m+n) space.',
      'O(1) trick: use first row + first column as "zero flags".',
      'Track separately whether row 0 / col 0 themselves had any zero.',
      'Pass 1: scan; for each 0 at (i,j), mark matrix[i][0] = matrix[0][j] = 0.',
      'Pass 2: zero out flagged rows/cols. Finally clear row 0 and col 0 if flagged.',
    ],
    tags: ['matrix', 'in-place'],
    constraints: '1 ≤ m, n ≤ 200\n-2^31 ≤ matrix[i][j] ≤ 2^31 − 1',
    follow_up: 'Set ones from zeros — opposite operation, same template.',
    pattern: 'first-row-col-as-flag',
    test_cases: [
      { inputs: ['[[1,1,1],[1,0,1],[1,1,1]]'], expected: '[[1,0,1],[0,0,0],[1,0,1]]' },
      { inputs: ['[[0,1,2,0],[3,4,5,2],[1,3,1,5]]'], expected: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' },
      { inputs: ['[[1]]'], expected: '[[1]]' },
      { inputs: ['[[0]]'], expected: '[[0]]' },
      { inputs: ['[[1,2],[3,4]]'], expected: '[[1,2],[3,4]]' },
      { inputs: ['[[0,0],[0,0]]'], expected: '[[0,0],[0,0]]' },
      { inputs: ['[[1,0],[0,1]]'], expected: '[[0,0],[0,0]]' },
      { inputs: ['[[1,1,1],[0,1,2]]'], expected: '[[0,1,1],[0,0,0]]' },
    ],
  },
  {
    id: 'next-permutation',
    method_name: 'nextPermutation',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'Scan from right: find first i with nums[i] < nums[i+1] (the "pivot").',
      'If no pivot, the array is fully descending — reverse to get the smallest perm.',
      'Else scan right of pivot for the smallest value > nums[pivot]; swap them.',
      'Reverse the suffix after pivot (it was descending; reversing makes it ascending).',
      'O(n) time, O(1) space.',
    ],
    tags: ['array', 'in-place'],
    constraints: '1 ≤ nums.length ≤ 100\n0 ≤ nums[i] ≤ 100',
    follow_up: 'Previous permutation — mirror the algorithm.',
    pattern: 'pivot-swap-reverse',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '[1,3,2]' },
      { inputs: ['[3,2,1]'], expected: '[1,2,3]' },
      { inputs: ['[1,1,5]'], expected: '[1,5,1]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2]'], expected: '[2,1]' },
      { inputs: ['[2,1]'], expected: '[1,2]' },
      { inputs: ['[1,3,2]'], expected: '[2,1,3]' },
      { inputs: ['[2,3,1]'], expected: '[3,1,2]' },
      { inputs: ['[1,5,1]'], expected: '[5,1,1]' },
      { inputs: ['[5,1,1]'], expected: '[1,1,5]' },
      { inputs: ['[1,2,3,4]'], expected: '[1,2,4,3]' },
      { inputs: ['[4,3,2,1]'], expected: '[1,2,3,4]' },
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
