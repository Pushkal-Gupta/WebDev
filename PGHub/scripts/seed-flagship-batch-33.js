#!/usr/bin/env node
// Batch 33: backtracking variants — subsets ii, perms ii, combo sum ii, palindrome
// partitioning, restore IP.

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
    id: 'subsets-ii',
    method_name: 'subsetsWithDup',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Sort nums first so duplicates are adjacent.',
      'Backtracking: at each level, iterate i from start..n. SKIP if i > start AND nums[i] == nums[i-1] (avoids picking same value twice at the same level).',
      'Record path at every recursion entry.',
      'O(n · 2^n) — output dominates.',
      'Iterative alternative: for new values, append to all existing subsets; for duplicates, only append to those created in the previous round.',
    ],
    tags: ['array', 'backtracking', 'sorting'],
    constraints: '1 ≤ nums.length ≤ 10\n-10 ≤ nums[i] ≤ 10',
    follow_up: 'Lex-smallest order of subsets — sort first and emit in DFS order.',
    pattern: 'backtracking-skip-duplicates',
    test_cases: [
      { inputs: ['[1,2,2]'], expected: '[[],[1],[1,2],[1,2,2],[2],[2,2]]' },
      { inputs: ['[0]'], expected: '[[],[0]]' },
      { inputs: ['[1,1]'], expected: '[[],[1],[1,1]]' },
      { inputs: ['[]'], expected: '[[]]' },
      { inputs: ['[5]'], expected: '[[],[5]]' },
      { inputs: ['[1,1,1]'], expected: '[[],[1],[1,1],[1,1,1]]' },
      { inputs: ['[1,2]'], expected: '[[],[1],[1,2],[2]]' },
      { inputs: ['[4,4,4,1,4]'], expected: '[[],[1],[1,4],[1,4,4],[1,4,4,4],[1,4,4,4,4],[4],[4,4],[4,4,4],[4,4,4,4]]' },
    ],
  },
  {
    id: 'permutations-ii',
    method_name: 'permuteUnique',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Sort first.',
      'Backtracking with a `used` boolean array.',
      'Skip nums[i] if it\'s the same as nums[i-1] AND nums[i-1] is currently unused (otherwise we generate duplicates).',
      'When path.length == n, record.',
      'O(n · n!) worst.',
    ],
    tags: ['array', 'backtracking'],
    constraints: '1 ≤ nums.length ≤ 8\n-10 ≤ nums[i] ≤ 10',
    follow_up: 'Next/Prev permutation (in-place) is asymptotically better when you only need adjacent permutations.',
    pattern: 'backtracking-skip-unused-duplicate',
    test_cases: [
      { inputs: ['[1,1,2]'], expected: '[[1,1,2],[1,2,1],[2,1,1]]' },
      { inputs: ['[1,2,3]'], expected: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' },
      { inputs: ['[1]'], expected: '[[1]]' },
      { inputs: ['[1,1]'], expected: '[[1,1]]' },
      { inputs: ['[1,1,1]'], expected: '[[1,1,1]]' },
      { inputs: ['[1,2]'], expected: '[[1,2],[2,1]]' },
      { inputs: ['[2,2,1,1]'], expected: '[[1,1,2,2],[1,2,1,2],[1,2,2,1],[2,1,1,2],[2,1,2,1],[2,2,1,1]]' },
    ],
  },
  {
    id: 'combination-sum-ii',
    method_name: 'combinationSum2',
    params: [{ name: 'candidates', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'List[List[int]]',
    hints: [
      'Each number can be used at most once. Sort first.',
      'Backtracking: at each call, iterate i from start..n with the next-step start = i+1 (not i).',
      'Skip i > start AND candidates[i] == candidates[i-1] to avoid duplicate combos.',
      'Early exit when candidates[i] > remaining target.',
      'O(2^n) worst.',
    ],
    tags: ['array', 'backtracking'],
    constraints: '1 ≤ candidates.length ≤ 100\n1 ≤ candidates[i] ≤ 50\n1 ≤ target ≤ 30',
    follow_up: '"Combination Sum III" — fix count k of numbers. Bound the recursion by depth.',
    pattern: 'backtracking-no-reuse',
    test_cases: [
      { inputs: ['[10,1,2,7,6,1,5]', '8'], expected: '[[1,1,6],[1,2,5],[1,7],[2,6]]' },
      { inputs: ['[2,5,2,1,2]', '5'], expected: '[[1,2,2],[5]]' },
      { inputs: ['[1]', '1'], expected: '[[1]]' },
      { inputs: ['[1]', '2'], expected: '[]' },
      { inputs: ['[2,3,6,7]', '7'], expected: '[[7]]' },
      { inputs: ['[1,1,1,1,1]', '3'], expected: '[[1,1,1]]' },
      { inputs: ['[3,5,7]', '10'], expected: '[[3,7]]' },
      { inputs: ['[4,4,4]', '8'], expected: '[[4,4]]' },
      { inputs: ['[2,2,2,2]', '4'], expected: '[[2,2]]' },
    ],
  },
  {
    id: 'palindrome-partitioning',
    method_name: 'partition',
    params: [{ name: 's', type: 'str' }],
    return_type: 'List[List[str]]',
    hints: [
      'Backtracking: try every prefix that is a palindrome.',
      'Recurse on the rest, accumulating the current partition.',
      'O(n²) palindrome check, or precompute dp[i][j] = isPalindrome(s[i..j]) in O(n²) total.',
      'Add path when start == n.',
      'O(n · 2^n) overall worst case.',
    ],
    tags: ['string', 'backtracking', 'dp'],
    constraints: '1 ≤ s.length ≤ 16\ns is lowercase English',
    follow_up: '"Palindrome Partitioning II" — minimum CUTS to make all parts palindromes. Linear DP after precomputed palindrome table.',
    pattern: 'backtracking-with-palindrome-table',
    test_cases: [
      { inputs: ['"aab"'], expected: '[["a","a","b"],["aa","b"]]' },
      { inputs: ['"a"'], expected: '[["a"]]' },
      { inputs: ['""'], expected: '[[]]' },
      { inputs: ['"aa"'], expected: '[["a","a"],["aa"]]' },
      { inputs: ['"ab"'], expected: '[["a","b"]]' },
      { inputs: ['"aba"'], expected: '[["a","b","a"],["aba"]]' },
      { inputs: ['"abba"'], expected: '[["a","b","b","a"],["a","bb","a"],["abba"]]' },
      { inputs: ['"efe"'], expected: '[["e","f","e"],["efe"]]' },
      { inputs: ['"aaaa"'], expected: '[["a","a","a","a"],["a","a","aa"],["a","aa","a"],["a","aaa"],["aa","a","a"],["aa","aa"],["aaa","a"],["aaaa"]]' },
    ],
  },
  {
    id: 'restore-ip-addresses',
    method_name: 'restoreIpAddresses',
    params: [{ name: 's', type: 'str' }],
    return_type: 'List[str]',
    hints: [
      'IP = four octets separated by dots; each octet is 0..255, no leading zeros (except "0").',
      'Backtracking: choose octet length 1, 2, or 3 at each step.',
      'After 4 octets, must consume the whole string.',
      'Prune: octet > 255, or starts with 0 but has > 1 digit.',
      'O(1) in practice — bounded by 3^4 = 81 placements.',
    ],
    tags: ['string', 'backtracking'],
    constraints: '1 ≤ s.length ≤ 20\ns contains digits only',
    follow_up: 'IPv6 — 8 hextets separated by colons. Same backtracking with different validation.',
    pattern: 'backtracking-with-validation',
    test_cases: [
      { inputs: ['"25525511135"'], expected: '["255.255.11.135","255.255.111.35"]' },
      { inputs: ['"0000"'], expected: '["0.0.0.0"]' },
      { inputs: ['"101023"'], expected: '["1.0.10.23","1.0.102.3","10.1.0.23","10.10.2.3","101.0.2.3"]' },
      { inputs: ['""'], expected: '[]' },
      { inputs: ['"1"'], expected: '[]' },
      { inputs: ['"1111"'], expected: '["1.1.1.1"]' },
      { inputs: ['"010010"'], expected: '["0.10.0.10","0.100.1.0"]' },
      { inputs: ['"00000"'], expected: '[]' },
      { inputs: ['"255255255255"'], expected: '["255.255.255.255"]' },
      { inputs: ['"123456789"'], expected: '["1.234.56.789","12.34.56.789","12.34.567.89","123.45.6.789","123.45.67.89","123.456.7.89","123.456.78.9"]' },
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
