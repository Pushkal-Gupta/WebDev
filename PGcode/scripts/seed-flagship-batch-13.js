#!/usr/bin/env node
// Batch 13: more classics — find-peak, histogram, letter-combos,
// generate-parens, partition-equal-subset.

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
    id: 'find-peak-element',
    method_name: 'findPeakElement',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'A peak is any element strictly greater than its neighbors. Multiple peaks may exist; return any.',
      'Linear: O(n) — scan for any element greater than its next neighbor.',
      'Better: O(log n) binary search. nums[i] vs nums[i+1]: if increasing, a peak lies right; otherwise left or at mid.',
      'Boundaries are treated as -∞.',
      'O(log n) time, O(1) space.',
    ],
    tags: ['array', 'binary-search'],
    constraints: '1 ≤ nums.length ≤ 1000\n-2^31 ≤ nums[i] ≤ 2^31 − 1\nnums[i] != nums[i+1] for any i.',
    follow_up: 'Generalization: 2D peak (Maximum Element in a 2D Matrix). Still solvable in O(min(m,n) log max(m,n)).',
    pattern: 'binary-search-on-shape',
    test_cases: [
      { inputs: ['[1,2,3,1]'], expected: '2' },
      { inputs: ['[1,2,1,3,5,6,4]'], expected: '5' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[2,1]'], expected: '0' },
      { inputs: ['[1,2,3,4,5]'], expected: '4' },
      { inputs: ['[5,4,3,2,1]'], expected: '0' },
      { inputs: ['[1,3,5,3,1]'], expected: '2' },
      { inputs: ['[1,5,1,5,1]'], expected: '1' },
      { inputs: ['[0,1,0,1,0]'], expected: '1' },
      { inputs: ['[100]'], expected: '0' },
      { inputs: ['[-1,-2,-3]'], expected: '0' },
      { inputs: ['[1,2,3,1,2,3,1]'], expected: '2' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[10,20,30,40,50,60,70,80,90,100]'], expected: '9' },
    ],
  },
  {
    id: 'largest-rect-histogram',
    method_name: 'largestRectangleArea',
    params: [{ name: 'heights', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Brute force: for each bar, expand left + right while height stays ≥ bar.height → O(n²).',
      'Monotonic-increasing stack of indices. Pop when a smaller height arrives.',
      'When popping, compute the rectangle: height = popped\'s height, width = current_i − stack.top − 1.',
      'Sentinel height 0 at the end forces all remaining bars to be popped.',
      'O(n) time, O(n) space.',
    ],
    tags: ['array', 'stack', 'monotonic-stack'],
    constraints: '1 ≤ heights.length ≤ 10^5\n0 ≤ heights[i] ≤ 10^4',
    follow_up: '"Maximal Rectangle" (a 2D grid) — apply this algorithm row-by-row with a running histogram.',
    pattern: 'monotonic-stack',
    test_cases: [
      { inputs: ['[2,1,5,6,2,3]'], expected: '10' },
      { inputs: ['[2,4]'], expected: '4' },
      { inputs: ['[1]'], expected: '1' },
      { inputs: ['[0]'], expected: '0' },
      { inputs: ['[5,5,5,5,5]'], expected: '25' },
      { inputs: ['[1,2,3,4,5]'], expected: '9' },
      { inputs: ['[5,4,3,2,1]'], expected: '9' },
      { inputs: ['[6,2,5,4,5,1,6]'], expected: '12' },
      { inputs: ['[2,1,2]'], expected: '3' },
      { inputs: ['[0,1,0,1,0]'], expected: '1' },
      { inputs: ['[1,1,1,1]'], expected: '4' },
      { inputs: ['[3,6,5,7,4,8,1,0]'], expected: '20' },
      { inputs: ['[2,1,5,6,2,3,1]'], expected: '10' },
      { inputs: ['[10000]'], expected: '10000' },
    ],
  },
  {
    id: 'letter-combinations',
    method_name: 'letterCombinations',
    params: [{ name: 'digits', type: 'str' }],
    return_type: 'List[str]',
    hints: [
      'Phone keypad: 2→abc, 3→def, 4→ghi, 5→jkl, 6→mno, 7→pqrs, 8→tuv, 9→wxyz.',
      'Iterative: start with [""]; for each digit, expand every string by every possible letter.',
      'Recursive backtracking: build a buffer, append a letter, recurse, pop.',
      'Empty digits → empty result.',
      'Output size = 3^n or 4^n — exponential but bounded by 3^4 × 4 = ~324 for n=4.',
    ],
    tags: ['string', 'backtracking', 'hash-map'],
    constraints: '0 ≤ digits.length ≤ 4\ndigits[i] is a digit in [2, 9]',
    follow_up: 'What if extra constraints (e.g., must be a valid word from a dictionary)? Trie-prune as you backtrack.',
    pattern: 'backtracking-cartesian',
    test_cases: [
      { inputs: ['"23"'], expected: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' },
      { inputs: ['""'], expected: '[]' },
      { inputs: ['"2"'], expected: '["a","b","c"]' },
      { inputs: ['"3"'], expected: '["d","e","f"]' },
      { inputs: ['"9"'], expected: '["w","x","y","z"]' },
      { inputs: ['"7"'], expected: '["p","q","r","s"]' },
      { inputs: ['"22"'], expected: '["aa","ab","ac","ba","bb","bc","ca","cb","cc"]' },
      { inputs: ['"234"'], expected: '["adg","adh","adi","aeg","aeh","aei","afg","afh","afi","bdg","bdh","bdi","beg","beh","bei","bfg","bfh","bfi","cdg","cdh","cdi","ceg","ceh","cei","cfg","cfh","cfi"]' },
      { inputs: ['"79"'], expected: '["pw","px","py","pz","qw","qx","qy","qz","rw","rx","ry","rz","sw","sx","sy","sz"]' },
    ],
  },
  {
    id: 'generate-parentheses',
    method_name: 'generateParenthesis',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'List[str]',
    hints: [
      'Number of valid sequences with n pairs = Catalan(n).',
      'Backtracking with two counters: open used, close used.',
      'At each step, add "(" if open < n; add ")" if close < open.',
      'When length == 2n, record the string.',
      'O(4^n / √n) — Catalan number scaling.',
    ],
    tags: ['string', 'backtracking', 'dp'],
    constraints: '1 ≤ n ≤ 8',
    follow_up: 'Iterative DP: gen(n) = concat over k in 0..n-1 of "(" + gen(k) + ")" + gen(n-1-k).',
    pattern: 'backtracking-balance-counter',
    test_cases: [
      { inputs: ['1'], expected: '["()"]' },
      { inputs: ['2'], expected: '["(())","()()"]' },
      { inputs: ['3'], expected: '["((()))","(()())","(())()","()(())","()()()"]' },
      { inputs: ['4'], expected: '["(((())))","((()()))","((())())","((()))()","(()(()))","(()()())","(()())()","(())(())","(())()()","()((()))","()(()())","()(())()","()()(())","()()()()"]' },
      { inputs: ['0'], expected: '[""]' },
    ],
  },
  {
    id: 'partition-equal-subset',
    method_name: 'canPartition',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Sum the array. If odd → false.',
      'Otherwise, find a subset with sum = total/2. Classic subset-sum DP.',
      'dp[s] = true iff some subset sums to s. dp[0] = true. For each num, iterate s = target..num and dp[s] = dp[s] || dp[s-num].',
      'O(n · target) time, O(target) space.',
      'Iterate s downward to avoid using the same num twice.',
    ],
    tags: ['array', 'dp', 'subset-sum'],
    constraints: '1 ≤ nums.length ≤ 200\n1 ≤ nums[i] ≤ 100',
    follow_up: '"Last Stone Weight II" — same DP, slightly different framing (minimize the diff).',
    pattern: '0-1-knapsack-subset-sum',
    test_cases: [
      { inputs: ['[1,5,11,5]'], expected: 'true' },
      { inputs: ['[1,2,3,5]'], expected: 'false' },
      { inputs: ['[1,1]'], expected: 'true' },
      { inputs: ['[1]'], expected: 'false' },
      { inputs: ['[2,2,2,2]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: 'true' },
      { inputs: ['[100,100]'], expected: 'true' },
      { inputs: ['[1,2,5]'], expected: 'false' },
      { inputs: ['[3,3,3,4,5]'], expected: 'true' },
      { inputs: ['[1,5,3,9]'], expected: 'true' },
      { inputs: ['[1,1,1,1,1,1,1,1,1]'], expected: 'false' },
      { inputs: ['[1,1,1,1,1,1,1,1]'], expected: 'true' },
      { inputs: ['[14,9,8,4,3,2]'], expected: 'true' },
      { inputs: ['[2,2,3,5]'], expected: 'false' },
      { inputs: ['[100]'], expected: 'false' },
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
