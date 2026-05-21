#!/usr/bin/env node
// Batch 21: marquee hards + linked list classics.

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
    id: 'trapping-rain-water',
    method_name: 'trap',
    params: [{ name: 'height', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Water on top of column i = min(maxLeft[i], maxRight[i]) − height[i].',
      'Precompute maxLeft and maxRight arrays → O(n) time, O(n) space.',
      'Two-pointer O(1) space: keep maxL and maxR; whichever side\'s height is smaller, we know its bound — accumulate that side\'s contribution and step inward.',
      'Stack approach: monotonic decreasing stack of indices. On a taller bar, pop and compute trapped water above the popped index.',
      'O(n) time, O(1) space with two-pointer.',
    ],
    tags: ['array', 'two-pointers', 'stack', 'dp'],
    constraints: '0 ≤ height.length ≤ 2·10^4\n0 ≤ height[i] ≤ 10^4',
    follow_up: '"Trapping Rain Water II" (2D) — uses a min-heap from the border inward.',
    pattern: 'two-pointer-prefix-max',
    test_cases: [
      { inputs: ['[0,1,0,2,1,0,1,3,2,1,2,1]'], expected: '6' },
      { inputs: ['[4,2,0,3,2,5]'], expected: '9' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,2]'], expected: '0' },
      { inputs: ['[2,1]'], expected: '0' },
      { inputs: ['[3,0,3]'], expected: '3' },
      { inputs: ['[5,0,5]'], expected: '5' },
      { inputs: ['[0,0,0]'], expected: '0' },
      { inputs: ['[1,1,1,1,1]'], expected: '0' },
      { inputs: ['[5,4,3,2,1]'], expected: '0' },
      { inputs: ['[1,2,3,4,5]'], expected: '0' },
      { inputs: ['[5,4,1,2]'], expected: '1' },
      { inputs: ['[3,1,2,4]'], expected: '2' },
      { inputs: ['[0,1,0,2,1,0,3,1,0,1,2]'], expected: '8' },
      { inputs: ['[6,4,2,0,3,2,0,3,1,4,5,3,2,7,5,3,0,1,2,1,3,4,6,8,1,3]'], expected: '83' },
    ],
  },
  {
    id: 'palindrome-linked-list',
    method_name: 'isPalindrome',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Naive: copy values to array, two-pointer check → O(n) space.',
      'O(1) space: find middle (slow/fast), reverse second half, compare halves node-by-node.',
      'Restore the list afterward if asked (re-reverse the second half).',
      'Watch odd/even length: for odd, skip the middle node when comparing.',
      'O(n) time, O(1) space.',
    ],
    tags: ['linked-list', 'two-pointers'],
    constraints: '1 ≤ list length ≤ 10^5\n0 ≤ Node.val ≤ 9',
    follow_up: 'Allow O(n) space → just collect into an array. The interview point is the O(1)-space trick.',
    pattern: 'reverse-half-then-compare',
    test_cases: [
      { inputs: ['[1,2,2,1]'], expected: 'true' },
      { inputs: ['[1,2]'], expected: 'false' },
      { inputs: ['[1]'], expected: 'true' },
      { inputs: ['[]'], expected: 'true' },
      { inputs: ['[1,1]'], expected: 'true' },
      { inputs: ['[1,2,1]'], expected: 'true' },
      { inputs: ['[1,2,3,2,1]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5]'], expected: 'false' },
      { inputs: ['[1,2,2]'], expected: 'false' },
      { inputs: ['[1,0,0,1]'], expected: 'true' },
      { inputs: ['[9,9,9,9,9]'], expected: 'true' },
      { inputs: ['[1,2,3,4,3,2,1]'], expected: 'true' },
      { inputs: ['[1,2,3,4,4,3,2,1]'], expected: 'true' },
      { inputs: ['[1,2,3,4,4,3,2]'], expected: 'false' },
    ],
  },
  {
    id: 'linked-list-cycle',
    method_name: 'hasCycle',
    params: [{ name: 'values', type: 'List[int]' }, { name: 'pos', type: 'int' }],
    return_type: 'bool',
    hints: [
      'Floyd\'s tortoise & hare: slow steps 1, fast steps 2.',
      'If they meet, there is a cycle. If fast hits null, no cycle.',
      'Why? Inside a cycle, fast gains 1 step on slow every iteration; collision is inevitable.',
      'O(n) time, O(1) space.',
      'Hashset approach: insert each visited node; if you see one again, cycle exists. O(n) space.',
    ],
    tags: ['linked-list', 'two-pointers', 'floyd-cycle'],
    constraints: '0 ≤ list length ≤ 10^4\npos = -1 (no cycle) or 0..length-1',
    follow_up: '"Linked List Cycle II" — return the entrance node of the cycle. Continue Floyd from head and the meeting point.',
    pattern: 'tortoise-hare',
    test_cases: [
      { inputs: ['[3,2,0,-4]', '1'], expected: 'true' },
      { inputs: ['[1,2]', '0'], expected: 'true' },
      { inputs: ['[1]', '-1'], expected: 'false' },
      { inputs: ['[]', '-1'], expected: 'false' },
      { inputs: ['[1,2,3,4,5]', '-1'], expected: 'false' },
      { inputs: ['[1,2,3,4,5]', '0'], expected: 'true' },
      { inputs: ['[1,2,3,4,5]', '4'], expected: 'true' },
      { inputs: ['[1]', '0'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '7'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10]', '-1'], expected: 'false' },
      { inputs: ['[0,0]', '-1'], expected: 'false' },
      { inputs: ['[0,0]', '0'], expected: 'true' },
      { inputs: ['[-1,-2,-3]', '2'], expected: 'true' },
    ],
  },
  {
    id: 'remove-nth-from-end',
    method_name: 'removeNthFromEnd',
    params: [{ name: 'head', type: 'List[int]' }, { name: 'n', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'Single pass with two pointers separated by n.',
      'Move `fast` n steps first. Then move both until `fast.next == null`.',
      '`slow` now sits at the node before the one to remove.',
      'Use a dummy node so removing the head is the same code path.',
      'O(L) time, O(1) space.',
    ],
    tags: ['linked-list', 'two-pointers'],
    constraints: '1 ≤ list length ≤ 30\n0 ≤ Node.val ≤ 100\n1 ≤ n ≤ list length',
    follow_up: 'Two-pass version: count length, then remove the (length - n + 1)-th from front. Equivalent.',
    pattern: 'two-pointer-with-gap',
    test_cases: [
      { inputs: ['[1,2,3,4,5]', '2'], expected: '[1,2,3,5]' },
      { inputs: ['[1]', '1'], expected: '[]' },
      { inputs: ['[1,2]', '1'], expected: '[1]' },
      { inputs: ['[1,2]', '2'], expected: '[2]' },
      { inputs: ['[1,2,3]', '3'], expected: '[2,3]' },
      { inputs: ['[1,2,3]', '1'], expected: '[1,2]' },
      { inputs: ['[1,2,3]', '2'], expected: '[1,3]' },
      { inputs: ['[1,2,3,4,5]', '1'], expected: '[1,2,3,4]' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '[2,3,4,5]' },
      { inputs: ['[1,2,3,4,5]', '3'], expected: '[1,2,4,5]' },
      { inputs: ['[10,20,30,40,50,60]', '4'], expected: '[10,20,40,50,60]' },
      { inputs: ['[10,20,30,40,50,60]', '1'], expected: '[10,20,30,40,50]' },
      { inputs: ['[100]', '1'], expected: '[]' },
    ],
  },
  {
    id: 'valid-sudoku',
    method_name: 'isValidSudoku',
    params: [{ name: 'board', type: 'List[List[str]]' }],
    return_type: 'bool',
    hints: [
      'Three constraints: each row, column, and 3×3 box must have unique digits 1-9 (ignoring \'.\').',
      'Use three arrays of 9 sets (or bitmasks): rows[9], cols[9], boxes[9].',
      'Box index = (i / 3) * 3 + (j / 3).',
      'Single pass O(81) over the board.',
      'Doesn\'t need to be solvable — only valid against current placements.',
    ],
    tags: ['matrix', 'hash-set'],
    constraints: 'board is 9×9\nboard[i][j] is a digit 1-9 or \'.\'',
    follow_up: 'Solve Sudoku — backtracking on each empty cell using the same row/col/box tracking.',
    pattern: 'row-col-box-sets',
    test_cases: [
      { inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'], expected: 'true' },
      { inputs: ['[["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'], expected: 'false' },
      { inputs: ['[[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]'], expected: 'true' },
      { inputs: ['[["1",".",".",".",".",".",".",".","."],[".","1",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]'], expected: 'true' },
      { inputs: ['[["1","1",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]'], expected: 'false' },
      { inputs: ['[["1",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],["1",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."]]'], expected: 'false' },
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
