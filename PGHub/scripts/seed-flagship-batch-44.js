#!/usr/bin/env node
// Batch 44: backtracking heavies.

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
    id: 'sudoku-solver',
    method_name: 'solveSudoku',
    params: [{ name: 'board', type: 'List[List[str]]' }],
    return_type: 'List[List[str]]',
    hints: [
      'Track sets per row, column, and 3×3 box (or bitmasks for speed).',
      'Recursive backtracking: find an empty cell; try 1..9 that don\'t violate constraints; recurse; undo on failure.',
      'Order cells by fewest options first for big speedups.',
      'Bitmask trick: each constraint set is a 9-bit mask; legal digits = ~(rowMask | colMask | boxMask) & 0x1FF.',
      'O(9^k) worst (k = empty cells) — fast in practice with pruning.',
    ],
    tags: ['matrix', 'backtracking', 'hash-set', 'bitmask'],
    constraints: 'board is 9×9\nEach \'.\' is empty; digits 1-9 otherwise\nGuaranteed solvable, unique solution',
    follow_up: 'Variant sized Sudoku (4×4 or 16×16). Same algorithm with adjusted box size.',
    pattern: 'backtracking-with-constraints',
    test_cases: [
      { inputs: ['[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]'], expected: '[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]' },
    ],
  },
  {
    id: 'remove-invalid-parentheses',
    method_name: 'removeInvalidParentheses',
    params: [{ name: 's', type: 'str' }],
    return_type: 'List[str]',
    hints: [
      'Count excess (and ) to remove (single left-to-right scan).',
      'Backtracking: at each position, choose to keep or skip; only skip up to the remaining excess for that direction.',
      'Use a set to dedupe; or skip consecutive duplicates of the same paren in the same step.',
      'Track running open count to prune branches that go negative.',
      'BFS variant: try every "remove one char" until you get a valid string.',
    ],
    tags: ['string', 'backtracking', 'bfs'],
    constraints: '1 ≤ s.length ≤ 25\ns contains lower-case English letters and parentheses\nat most 20 parentheses',
    follow_up: 'Print only ONE solution with min removals — short-circuit at first hit.',
    pattern: 'backtracking-with-prune',
    test_cases: [
      { inputs: ['"()())()"'], expected: '["(())()","()()()"]' },
      { inputs: ['"(a)())()"'], expected: '["(a())()","(a)()()"]' },
      { inputs: ['")("'], expected: '[""]' },
      { inputs: ['""'], expected: '[""]' },
      { inputs: ['"("'], expected: '[""]' },
      { inputs: ['")"'], expected: '[""]' },
      { inputs: ['"()"'], expected: '["()"]' },
      { inputs: ['"(("'], expected: '[""]' },
      { inputs: ['"))"'], expected: '[""]' },
      { inputs: ['"a"'], expected: '["a"]' },
      { inputs: ['"abc"'], expected: '["abc"]' },
      { inputs: ['"(((((((((((((((((("'], expected: '[""]' },
    ],
  },
  {
    id: 'expression-add-operators',
    method_name: 'addOperators',
    params: [{ name: 'num', type: 'str' }, { name: 'target', type: 'int' }],
    return_type: 'List[str]',
    hints: [
      'Backtrack: choose an operator (or nothing) between each adjacent pair of digits.',
      'Track current expression, running value, and last operand (for multiplication backout).',
      'For multiplication: new value = (cur - lastOp) + (lastOp * x).',
      'Skip numbers with leading zeros (unless single zero).',
      'O(4^n) leaves where n = digits.',
    ],
    tags: ['string', 'backtracking', 'math'],
    constraints: '1 ≤ num.length ≤ 10\nnum contains only digits\n-2^31 ≤ target ≤ 2^31 − 1',
    follow_up: 'Allow parentheses too — much harder. Worst-case exponential blowup.',
    pattern: 'backtracking-with-last-operand-track',
    test_cases: [
      { inputs: ['"123"', '6'], expected: '["1+2+3","1*2*3"]' },
      { inputs: ['"232"', '8'], expected: '["2*3+2","2+3*2"]' },
      { inputs: ['"3456237490"', '9191'], expected: '[]' },
      { inputs: ['"0"', '0'], expected: '["0"]' },
      { inputs: ['"00"', '0'], expected: '["0+0","0-0","0*0"]' },
      { inputs: ['"105"', '5'], expected: '["1*0+5","10-5"]' },
      { inputs: ['"123456789"', '45'], expected: '["1+2+3+4+5+6+7+8+9","1+2+34-5-6-7-8-9","1+23-4+5+6+7-8-9","1-2-3+4-5+6+7+8*9","12-3-4+5-6+7-8-9","12+3+4*5+6-7+8-9","12+3+4-5+6-7-8*9","12-3+4*5-6-7+8+9","12-3-4+5*6+7+8-9","12+3*4-5-6-7+8*9","12-3-4-5+6+7+8*9","12-3-4+5*6+7+8-9","12+3+4*5+6-7+8-9","12+3+4-5+6-7-8*9","12*3-4+5+6-7+8+9","12*3-4*5-6-7+8-9","12-3-4+5*6-7+8-9","12+3*4+5-6+7-8+9","12-3+4-5+6-7+8+9*5","12-3-4+5+6*7-8-9","12+3-4*5+6*7-8+9","12*3-4-5+6+7-8+9","12*3-4-5+6-7+8-9","12-3*4-5-6-7+8*9"]' },
    ],
  },
  {
    id: 'permutations',
    method_name: 'permute',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'There are n! permutations.',
      'Backtracking with a `used` boolean array.',
      'At each step, iterate every unused num, mark used, recurse, undo.',
      'Or swap-based: at depth d, swap each i in [d, n-1] with d, recurse, swap back.',
      'O(n · n!) time.',
    ],
    tags: ['array', 'backtracking'],
    constraints: '1 ≤ nums.length ≤ 6\n-10 ≤ nums[i] ≤ 10\nAll values unique',
    follow_up: 'Permutations II — duplicates. Sort + skip-if-prev-unused.',
    pattern: 'backtracking',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' },
      { inputs: ['[0,1]'], expected: '[[0,1],[1,0]]' },
      { inputs: ['[1]'], expected: '[[1]]' },
      { inputs: ['[1,2]'], expected: '[[1,2],[2,1]]' },
      { inputs: ['[1,2,3,4]'], expected: '[[1,2,3,4],[1,2,4,3],[1,3,2,4],[1,3,4,2],[1,4,2,3],[1,4,3,2],[2,1,3,4],[2,1,4,3],[2,3,1,4],[2,3,4,1],[2,4,1,3],[2,4,3,1],[3,1,2,4],[3,1,4,2],[3,2,1,4],[3,2,4,1],[3,4,1,2],[3,4,2,1],[4,1,2,3],[4,1,3,2],[4,2,1,3],[4,2,3,1],[4,3,1,2],[4,3,2,1]]' },
      { inputs: ['[5]'], expected: '[[5]]' },
      { inputs: ['[-1,0]'], expected: '[[-1,0],[0,-1]]' },
    ],
  },
  {
    id: 'letter-combinations',
    method_name: 'letterCombinations',
    params: [{ name: 'digits', type: 'str' }],
    return_type: 'List[str]',
    hints: [
      'Phone keypad mapping: 2→abc, 3→def, …, 9→wxyz.',
      'Backtracking: for each digit, try every letter, recurse.',
      'Iterative: start with [""]; for each digit, expand every current string with each letter for that digit.',
      'Empty input → empty result.',
      'O(4^n · n) — output dominates.',
    ],
    tags: ['string', 'backtracking', 'hash-map'],
    constraints: '0 ≤ digits.length ≤ 4\ndigits[i] is 2-9',
    follow_up: 'Restrict to "must be in dictionary" — Trie prune as you build.',
    pattern: 'backtracking-cartesian',
    test_cases: [
      { inputs: ['"23"'], expected: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' },
      { inputs: ['""'], expected: '[]' },
      { inputs: ['"2"'], expected: '["a","b","c"]' },
      { inputs: ['"3"'], expected: '["d","e","f"]' },
      { inputs: ['"7"'], expected: '["p","q","r","s"]' },
      { inputs: ['"9"'], expected: '["w","x","y","z"]' },
      { inputs: ['"22"'], expected: '["aa","ab","ac","ba","bb","bc","ca","cb","cc"]' },
      { inputs: ['"234"'], expected: '["adg","adh","adi","aeg","aeh","aei","afg","afh","afi","bdg","bdh","bdi","beg","beh","bei","bfg","bfh","bfi","cdg","cdh","cdi","ceg","ceh","cei","cfg","cfh","cfi"]' },
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
