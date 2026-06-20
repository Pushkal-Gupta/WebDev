#!/usr/bin/env node
// Batch 56: heap + design heavies.

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
    id: 'find-median-data-stream',
    method_name: 'medianOps',
    params: [{ name: 'ops', type: 'List[str]' }, { name: 'args', type: 'List[int]' }],
    return_type: 'List[float]',
    hints: [
      'Two heaps: max-heap (lo) holds the smaller half; min-heap (hi) holds the upper half.',
      'Invariant: |lo| - |hi| in {0, 1}.',
      'On add: push to lo, then move lo.top to hi. If |hi| > |lo|, rebalance.',
      'Median: if equal size, average of tops; else lo.top.',
      'O(log n) per add, O(1) per find.',
    ],
    tags: ['heap', 'design', 'data-stream'],
    constraints: '1 ≤ ops.length ≤ 10^5\nops[i] in {"add", "find"}\n-10^5 ≤ args[i] ≤ 10^5\nargs[i] = -1 for "find" (ignored)',
    follow_up: 'Sliding window median — two multisets (ordered).',
    pattern: 'two-heaps-balanced',
    test_cases: [
      { inputs: ['["add","add","find","add","find"]', '[1,2,-1,3,-1]'], expected: '[1.50000,2.00000]' },
      { inputs: ['["add","find"]', '[5,-1]'], expected: '[5.00000]' },
      { inputs: ['["add","add","add","find"]', '[1,2,3,-1]'], expected: '[2.00000]' },
      { inputs: ['["add","add","add","add","find"]', '[1,2,3,4,-1]'], expected: '[2.50000]' },
      { inputs: ['["add","find","add","find","add","find"]', '[10,-1,20,-1,30,-1]'], expected: '[10.00000,15.00000,20.00000]' },
    ],
  },
  {
    id: 'sliding-window-maximum',
    method_name: 'maxSlidingWindow',
    params: [{ name: 'nums', type: 'List[int]' }, { name: 'k', type: 'int' }],
    return_type: 'List[int]',
    hints: [
      'Monotonic decreasing deque of indices.',
      'On each i: pop indices from back while nums[back] <= nums[i]. Push i.',
      'Pop front if it falls out of window (front <= i - k).',
      'When i >= k - 1, deque front is the window max — record it.',
      'O(n) amortised.',
    ],
    tags: ['array', 'sliding-window', 'deque'],
    constraints: '1 ≤ nums.length ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4\n1 ≤ k ≤ nums.length',
    follow_up: 'Sliding window minimum — flip the comparator.',
    pattern: 'monotonic-deque',
    test_cases: [
      { inputs: ['[1,3,-1,-3,5,3,6,7]', '3'], expected: '[3,3,5,5,6,7]' },
      { inputs: ['[1]', '1'], expected: '[1]' },
      { inputs: ['[1,-1]', '1'], expected: '[1,-1]' },
      { inputs: ['[9,11]', '2'], expected: '[11]' },
      { inputs: ['[4,-2]', '2'], expected: '[4]' },
      { inputs: ['[1,2,3,4,5]', '1'], expected: '[1,2,3,4,5]' },
      { inputs: ['[1,2,3,4,5]', '5'], expected: '[5]' },
      { inputs: ['[5,4,3,2,1]', '2'], expected: '[5,4,3,2]' },
      { inputs: ['[-7,-8,7,5,7,1,6,0]', '4'], expected: '[7,7,7,7,7]' },
      { inputs: ['[1,3,1,2,0,5]', '3'], expected: '[3,3,2,5]' },
    ],
  },
  {
    id: 'task-scheduler',
    method_name: 'leastInterval',
    params: [{ name: 'tasks', type: 'List[str]' }, { name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'Count task frequencies. Let max-count = M.',
      'Closed-form: (M - 1) * (n + 1) + (number of tasks with frequency == M).',
      'Take max(that, len(tasks)) — if many distinct tasks, the cycle fills naturally.',
      'Math intuition: M occurrences of the most frequent task need (M-1) gaps of size n+1 between them.',
      'O(N) time, O(26) space (for lowercase task names).',
    ],
    tags: ['array', 'heap', 'greedy', 'math'],
    constraints: '1 ≤ tasks.length ≤ 10^4\ntasks[i] is upper-case English\n0 ≤ n ≤ 100',
    follow_up: 'Reconstruct an actual schedule — priority queue simulation.',
    pattern: 'frequency-math-or-pq',
    test_cases: [
      { inputs: ['["A","A","A","B","B","B"]', '2'], expected: '8' },
      { inputs: ['["A","A","A","B","B","B"]', '0'], expected: '6' },
      { inputs: ['["A","A","A","A","A","A","B","C","D","E","F","G"]', '2'], expected: '16' },
      { inputs: ['["A"]', '0'], expected: '1' },
      { inputs: ['["A","A","B","B"]', '2'], expected: '5' },
      { inputs: ['["A","B","C","D","E","F","G","H"]', '2'], expected: '8' },
      { inputs: ['["A","A","A","B","C","D"]', '2'], expected: '7' },
      { inputs: ['["X","X","X","Y","Y","Z"]', '1'], expected: '6' },
    ],
  },
  {
    id: 'implement-trie',
    method_name: 'trieOps',
    params: [{ name: 'ops', type: 'List[str]' }, { name: 'words', type: 'List[str]' }],
    return_type: 'List[bool]',
    hints: [
      'Each node has 26 child slots and an isEnd flag.',
      'insert(w): walk/create children; mark final node\'s isEnd.',
      'search(w): walk; return true only if final node exists AND isEnd.',
      'startsWith(p): walk; return true if any path exists.',
      'O(L) per operation where L = word length.',
    ],
    tags: ['trie', 'string', 'design'],
    constraints: '1 ≤ ops.length ≤ 10^4\nops[i] in {"insert", "search", "startsWith"}\nLowercase English only',
    follow_up: 'Compress the trie (radix/Patricia) for sparse data.',
    pattern: 'trie-with-26-array',
    test_cases: [
      { inputs: ['["insert","search","search","startsWith","insert","search"]', '["apple","apple","app","app","app","app"]'], expected: '[true,false,true,false,true]' },
      { inputs: ['["insert","search"]', '["a","a"]'], expected: '[true]' },
      { inputs: ['["search"]', '["x"]'], expected: '[false]' },
      { inputs: ['["startsWith"]', '["x"]'], expected: '[false]' },
      { inputs: ['["insert","insert","startsWith","startsWith","search","search"]', '["abc","abd","ab","abx","ab","abc"]'], expected: '[true,false,false,true]' },
    ],
  },
  {
    id: 'word-search',
    method_name: 'exist',
    params: [{ name: 'board', type: 'List[List[str]]' }, { name: 'word', type: 'str' }],
    return_type: 'bool',
    hints: [
      'DFS from every cell that matches word[0].',
      'Mark visited in-place by writing a sentinel char; restore on backtrack.',
      'Recurse 4 directions; return true if word[idx+1..] found.',
      'Prune if cell out of bounds, visited, or char mismatch.',
      'O(M·N·4^L) worst.',
    ],
    tags: ['matrix', 'backtracking', 'dfs'],
    constraints: '1 ≤ rows, cols ≤ 6\n1 ≤ word.length ≤ 15\nLowercase English',
    follow_up: 'Word Search II — Trie of words + single DFS walk over the grid.',
    pattern: 'backtracking-grid',
    test_cases: [
      { inputs: ['[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]', '"ABCCED"'], expected: 'true' },
      { inputs: ['[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]', '"SEE"'], expected: 'true' },
      { inputs: ['[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]', '"ABCB"'], expected: 'false' },
      { inputs: ['[["a"]]', '"a"'], expected: 'true' },
      { inputs: ['[["a"]]', '"b"'], expected: 'false' },
      { inputs: ['[["a","b"]]', '"ab"'], expected: 'true' },
      { inputs: ['[["a","b"]]', '"ba"'], expected: 'true' },
      { inputs: ['[["a","b"]]', '"abc"'], expected: 'false' },
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
