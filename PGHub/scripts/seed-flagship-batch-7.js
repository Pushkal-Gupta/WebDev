#!/usr/bin/env node
// Batch 7: 5 more flagships beyond the curated 30 — top-k-frequent, subsets,
// permutations, combination-sum, group-anagrams.

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
    id: 'top-k-frequent',
    method_name: 'topKFrequent',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'Count frequencies with a hashmap.',
      'Sort by frequency — O(n log n). Can you do better?',
      'Min-heap of size k → O(n log k).',
      'Bucket sort: an array indexed by frequency. Walk from high freq down. O(n) overall.',
      'Return the first k elements of whichever ordering you build.',
    ],
    tags: ['array', 'hash-map', 'heap', 'bucket-sort'],
    constraints: '1 ≤ nums.length ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4\n1 ≤ k ≤ number of unique elements',
    follow_up: '"Top K Frequent Words" — same idea but with lex tie-break.',
    pattern: 'frequency-count + heap-or-bucket',
    test_cases: [
      { inputs: ['[1,1,1,2,2,3]', '2'], expected: '[1,2]' },
      { inputs: ['[1]', '1'], expected: '[1]' },
      { inputs: ['[1,2]', '2'], expected: '[1,2]' },
      { inputs: ['[4,1,-1,2,-1,2,3]', '2'], expected: '[-1,2]' },
      { inputs: ['[1,1,2,2,3,3,4,4]', '4'], expected: '[1,2,3,4]' },
      { inputs: ['[5,5,5,5]', '1'], expected: '[5]' },
      { inputs: ['[3,0,1,0]', '1'], expected: '[0]' },
      { inputs: ['[1,2,3,4,5]', '3'], expected: '[1,2,3]' },
      { inputs: ['[-1,-1,-2,-2,-3]', '2'], expected: '[-1,-2]' },
      { inputs: ['[7,7,7,7,7,7,7]', '1'], expected: '[7]' },
      { inputs: ['[1,2,2,3,3,3,4,4,4,4]', '2'], expected: '[4,3]' },
      { inputs: ['[10,20,30,10,20,10]', '2'], expected: '[10,20]' },
      { inputs: ['[100]', '1'], expected: '[100]' },
      { inputs: ['[1,1,2]', '1'], expected: '[1]' },
      { inputs: ['[1,1,1,2,2,3,3,3,3]', '2'], expected: '[3,1]' },
      { inputs: ['[5,1,2,3,4,5,5]', '1'], expected: '[5]' },
      { inputs: ['[1,2,3,4,5,6,7]', '7'], expected: '[1,2,3,4,5,6,7]' },
    ],
  },
  {
    id: 'subsets',
    method_name: 'subsets',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'There are 2^n subsets — every element is either in or out.',
      'Iterative: start with [[]]. For each new element, append a copy with the element added.',
      'Recursive (backtracking): at each index decide take or skip, recurse, undo.',
      'Bitmask: for mask 0..2^n−1, include nums[i] iff bit i is set.',
      'O(n · 2^n) time and space (the output itself dominates).',
    ],
    tags: ['array', 'backtracking', 'bitmask'],
    constraints: '1 ≤ nums.length ≤ 10\n-10 ≤ nums[i] ≤ 10\nAll values are unique.',
    follow_up: '"Subsets II" handles duplicates — sort first, then skip duplicates at each backtrack level.',
    pattern: 'backtracking-or-iterative-double',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' },
      { inputs: ['[0]'], expected: '[[],[0]]' },
      { inputs: ['[]'], expected: '[[]]' },
      { inputs: ['[1]'], expected: '[[],[1]]' },
      { inputs: ['[1,2]'], expected: '[[],[1],[2],[1,2]]' },
      { inputs: ['[-1,0,1]'], expected: '[[],[-1],[0],[-1,0],[1],[-1,1],[0,1],[-1,0,1]]' },
      { inputs: ['[5]'], expected: '[[],[5]]' },
      { inputs: ['[1,2,3,4]'], expected: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3],[4],[1,4],[2,4],[1,2,4],[3,4],[1,3,4],[2,3,4],[1,2,3,4]]' },
      { inputs: ['[10,20]'], expected: '[[],[10],[20],[10,20]]' },
      { inputs: ['[-3]'], expected: '[[],[-3]]' },
    ],
  },
  {
    id: 'permutations',
    method_name: 'permute',
    params: [{ name: 'nums', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'There are n! permutations.',
      'Backtracking: at each step, try each unused element, recurse, undo.',
      'Use a "used" boolean array, or swap in place (Heap\'s algorithm variant).',
      'Iterative: insertion — given perms of n−1 elements, insert the n-th at every position.',
      'O(n · n!) time.',
    ],
    tags: ['array', 'backtracking'],
    constraints: '1 ≤ nums.length ≤ 6\n-10 ≤ nums[i] ≤ 10\nAll values are unique.',
    follow_up: '"Permutations II" — duplicates allowed. Sort first; skip a number if the previous identical number is unused.',
    pattern: 'backtracking',
    test_cases: [
      { inputs: ['[1,2,3]'], expected: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' },
      { inputs: ['[0,1]'], expected: '[[0,1],[1,0]]' },
      { inputs: ['[1]'], expected: '[[1]]' },
      { inputs: ['[1,2]'], expected: '[[1,2],[2,1]]' },
      { inputs: ['[1,2,3,4]'], expected: '[[1,2,3,4],[1,2,4,3],[1,3,2,4],[1,3,4,2],[1,4,2,3],[1,4,3,2],[2,1,3,4],[2,1,4,3],[2,3,1,4],[2,3,4,1],[2,4,1,3],[2,4,3,1],[3,1,2,4],[3,1,4,2],[3,2,1,4],[3,2,4,1],[3,4,1,2],[3,4,2,1],[4,1,2,3],[4,1,3,2],[4,2,1,3],[4,2,3,1],[4,3,1,2],[4,3,2,1]]' },
      { inputs: ['[5]'], expected: '[[5]]' },
      { inputs: ['[-1,0]'], expected: '[[-1,0],[0,-1]]' },
      { inputs: ['[7,8,9]'], expected: '[[7,8,9],[7,9,8],[8,7,9],[8,9,7],[9,7,8],[9,8,7]]' },
    ],
  },
  {
    id: 'combination-sum',
    method_name: 'combinationSum',
    params: [{ name: 'candidates', type: 'List[int]' }, { name: 'target', type: 'int' }],
    return_type: 'List[List[int]]',
    hints: [
      'Backtracking. At each step, try every candidate ≥ a starting index (to avoid duplicate combos).',
      'Subtract from target. Stop when target == 0 (record path) or target < 0 (prune).',
      'Allow reuse of the same candidate — pass i, not i+1, to the recursive call.',
      'Sort candidates first so you can break early when candidate > remaining target.',
      'Worst case is exponential; the sort + early-break keeps practical inputs fast.',
    ],
    tags: ['array', 'backtracking'],
    constraints: '1 ≤ candidates.length ≤ 30\n2 ≤ candidates[i] ≤ 40\nAll candidates are unique.\n1 ≤ target ≤ 40',
    follow_up: '"Combination Sum II" — each number may be used once. Sort + skip-duplicates pattern.',
    pattern: 'backtracking-prune',
    test_cases: [
      { inputs: ['[2,3,6,7]', '7'], expected: '[[2,2,3],[7]]' },
      { inputs: ['[2,3,5]', '8'], expected: '[[2,2,2,2],[2,3,3],[3,5]]' },
      { inputs: ['[2]', '1'], expected: '[]' },
      { inputs: ['[1]', '1'], expected: '[[1]]' },
      { inputs: ['[1]', '2'], expected: '[[1,1]]' },
      { inputs: ['[3,5,7]', '10'], expected: '[[3,7],[5,5]]' },
      { inputs: ['[2,4,6]', '6'], expected: '[[2,2,2],[2,4],[6]]' },
      { inputs: ['[7]', '7'], expected: '[[7]]' },
      { inputs: ['[5,10,15]', '20'], expected: '[[5,5,5,5],[5,5,10],[5,15],[10,10]]' },
      { inputs: ['[2,3]', '5'], expected: '[[2,3]]' },
      { inputs: ['[4,8]', '8'], expected: '[[4,4],[8]]' },
      { inputs: ['[3]', '7'], expected: '[]' },
      { inputs: ['[2,3,5]', '7'], expected: '[[2,2,3],[2,5]]' },
      { inputs: ['[6,7,8]', '20'], expected: '[[6,6,8]]' },
    ],
  },
  {
    id: 'group-anagrams',
    method_name: 'groupAnagrams',
    params: [{ name: 'strs', type: 'List[str]' }],
    return_type: 'List[List[str]]',
    hints: [
      'Two strings are anagrams iff they have the same character counts.',
      'Use the sorted string as a canonical key — group by it.',
      'Faster key: a 26-int frequency tuple serialized as string.',
      'O(n · k log k) with sort-key, O(n · k) with count-key (k = max string length).',
      'Output order doesn\'t matter; sort each group for stable comparison if needed.',
    ],
    tags: ['array', 'hash-map', 'string', 'sorting'],
    constraints: '1 ≤ strs.length ≤ 10^4\n0 ≤ strs[i].length ≤ 100\nLowercase English letters only.',
    follow_up: 'Stream processing — keep a rolling hashmap of canonical-key → list of indices.',
    pattern: 'group-by-key',
    test_cases: [
      { inputs: ['["eat","tea","tan","ate","nat","bat"]'], expected: '[["eat","tea","ate"],["tan","nat"],["bat"]]' },
      { inputs: ['[""]'], expected: '[[""]]' },
      { inputs: ['["a"]'], expected: '[["a"]]' },
      { inputs: ['["abc","bca","cab","xyz"]'], expected: '[["abc","bca","cab"],["xyz"]]' },
      { inputs: ['["",""]'], expected: '[["",""]]' },
      { inputs: ['["a","b","c"]'], expected: '[["a"],["b"],["c"]]' },
      { inputs: ['["listen","silent","enlist","tinsel"]'], expected: '[["listen","silent","enlist","tinsel"]]' },
      { inputs: ['["abc","def","ghi"]'], expected: '[["abc"],["def"],["ghi"]]' },
      { inputs: ['["abc","cba","bac","acb"]'], expected: '[["abc","cba","bac","acb"]]' },
      { inputs: ['["aa","bb","cc","aa"]'], expected: '[["aa","aa"],["bb"],["cc"]]' },
      { inputs: ['["abcd","dcba","aaaa"]'], expected: '[["abcd","dcba"],["aaaa"]]' },
      { inputs: ['["x","y","x","y"]'], expected: '[["x","x"],["y","y"]]' },
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
