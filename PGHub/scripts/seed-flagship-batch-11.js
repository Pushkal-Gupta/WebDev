#!/usr/bin/env node
// Batch 11: intervals + graph weighted + word search.

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
    id: 'merge-intervals',
    method_name: 'merge',
    params: [{ name: 'intervals', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Sort intervals by start time.',
      'Walk the sorted list. If the current interval overlaps the last in the result (start ≤ last.end), extend last.end = max(last.end, current.end).',
      'Otherwise push the current interval to the result.',
      'O(n log n) for the sort dominates; the merge pass is O(n).',
      'Intervals like [1,4] and [4,5] are touching — usually treated as merging (problem-dependent).',
    ],
    tags: ['array', 'sorting', 'intervals'],
    constraints: '1 ≤ intervals.length ≤ 10^4\nintervals[i].length == 2\n0 ≤ start ≤ end ≤ 10^4',
    follow_up: 'Online merging (intervals arrive one at a time) — interval tree (TreeMap of starts).',
    pattern: 'sort-then-sweep',
    test_cases: [
      { inputs: ['[[1,3],[2,6],[8,10],[15,18]]'], expected: '[[1,6],[8,10],[15,18]]' },
      { inputs: ['[[1,4],[4,5]]'], expected: '[[1,5]]' },
      { inputs: ['[[1,4]]'], expected: '[[1,4]]' },
      { inputs: ['[[1,4],[2,3]]'], expected: '[[1,4]]' },
      { inputs: ['[[1,4],[0,4]]'], expected: '[[0,4]]' },
      { inputs: ['[[1,4],[0,0]]'], expected: '[[0,0],[1,4]]' },
      { inputs: ['[[2,3],[2,2],[3,3],[1,3],[5,7],[2,2],[4,6]]'], expected: '[[1,3],[4,7]]' },
      { inputs: ['[[1,2],[3,4],[5,6]]'], expected: '[[1,2],[3,4],[5,6]]' },
      { inputs: ['[[1,10],[2,3],[4,5],[6,7]]'], expected: '[[1,10]]' },
      { inputs: ['[[1,3]]'], expected: '[[1,3]]' },
      { inputs: ['[[5,5]]'], expected: '[[5,5]]' },
      { inputs: ['[[1,2],[2,3]]'], expected: '[[1,3]]' },
      { inputs: ['[[1,4],[5,6]]'], expected: '[[1,4],[5,6]]' },
      { inputs: ['[[0,2],[5,10],[13,23],[24,25]]'], expected: '[[0,2],[5,10],[13,23],[24,25]]' },
      { inputs: ['[[1,3],[2,6],[8,10],[15,18]]'], expected: '[[1,6],[8,10],[15,18]]' },
    ],
  },
  {
    id: 'insert-interval',
    method_name: 'insert',
    params: [{ name: 'intervals', type: 'List[List[int]]' }, { name: 'newInterval', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Intervals are already sorted. You don\'t need to re-sort.',
      'Three phases: (1) push intervals ending before newInterval starts; (2) merge all overlapping into newInterval; (3) push the rest.',
      'O(n) — single linear pass.',
      'Edge cases: empty intervals, newInterval before all, newInterval after all.',
      'Touching intervals (end == start) usually merge.',
    ],
    tags: ['array', 'intervals'],
    constraints: '0 ≤ intervals.length ≤ 10^4\nintervals is sorted by start, non-overlapping.',
    follow_up: 'Online version with frequent inserts — interval tree.',
    pattern: 'three-phase-sweep',
    test_cases: [
      { inputs: ['[[1,3],[6,9]]', '[2,5]'], expected: '[[1,5],[6,9]]' },
      { inputs: ['[[1,2],[3,5],[6,7],[8,10],[12,16]]', '[4,8]'], expected: '[[1,2],[3,10],[12,16]]' },
      { inputs: ['[]', '[5,7]'], expected: '[[5,7]]' },
      { inputs: ['[[1,5]]', '[2,3]'], expected: '[[1,5]]' },
      { inputs: ['[[1,5]]', '[6,8]'], expected: '[[1,5],[6,8]]' },
      { inputs: ['[[1,5]]', '[0,0]'], expected: '[[0,0],[1,5]]' },
      { inputs: ['[[1,5]]', '[0,3]'], expected: '[[0,5]]' },
      { inputs: ['[[1,5]]', '[6,7]'], expected: '[[1,5],[6,7]]' },
      { inputs: ['[[3,5],[12,15]]', '[6,6]'], expected: '[[3,5],[6,6],[12,15]]' },
      { inputs: ['[[1,3],[5,7],[8,12]]', '[2,6]'], expected: '[[1,7],[8,12]]' },
      { inputs: ['[[1,2]]', '[0,3]'], expected: '[[0,3]]' },
      { inputs: ['[[1,2],[5,6],[7,9],[10,12]]', '[3,11]'], expected: '[[1,2],[3,12]]' },
      { inputs: ['[]', '[]'], expected: '[[]]' },
    ],
  },
  {
    id: 'non-overlapping-intervals',
    method_name: 'eraseOverlapIntervals',
    params: [{ name: 'intervals', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Greedy: sort by END time.',
      'Walk through; keep the interval if it starts ≥ the last kept end. Otherwise count as a removal.',
      'Sorting by end (not start) ensures you keep the interval that leaves the most room for the rest.',
      'O(n log n) for sort, O(n) for the sweep.',
      'Equivalent to "activity selection": max non-overlapping count = total − removals.',
    ],
    tags: ['array', 'greedy', 'intervals', 'dp'],
    constraints: '1 ≤ intervals.length ≤ 10^5\nintervals[i].length == 2',
    follow_up: '"Maximum Length of Pair Chain" — same algorithm, slightly different framing.',
    pattern: 'greedy-by-end-time',
    test_cases: [
      { inputs: ['[[1,2],[2,3],[3,4],[1,3]]'], expected: '1' },
      { inputs: ['[[1,2],[1,2],[1,2]]'], expected: '2' },
      { inputs: ['[[1,2],[2,3]]'], expected: '0' },
      { inputs: ['[[1,2]]'], expected: '0' },
      { inputs: ['[]'], expected: '0' },
      { inputs: ['[[0,2],[1,3],[2,4],[3,5],[4,6]]'], expected: '2' },
      { inputs: ['[[1,5],[2,3]]'], expected: '1' },
      { inputs: ['[[1,100],[11,22],[1,11],[2,12]]'], expected: '2' },
      { inputs: ['[[0,1],[3,4],[1,2]]'], expected: '0' },
      { inputs: ['[[1,2],[7,8],[4,5]]'], expected: '0' },
      { inputs: ['[[1,2],[2,3],[3,4],[4,5]]'], expected: '0' },
      { inputs: ['[[1,10],[2,9],[3,8],[4,7],[5,6]]'], expected: '4' },
    ],
  },
  {
    id: 'word-search',
    method_name: 'exist',
    params: [{ name: 'board', type: 'List[List[str]]' }, { name: 'word', type: 'str' }],
    return_type: 'bool',
    hints: [
      'DFS from every cell. At each step, match the next char of word.',
      'Mark cells as visited by overwriting (e.g., set to "#") so the same cell isn\'t reused on the same path.',
      'Restore on backtrack so other DFS branches can use it.',
      'Prune: stop if board[i][j] doesn\'t match word[k].',
      'O(N · 3^L) worst case — 3 because you don\'t go back the way you came.',
    ],
    tags: ['matrix', 'backtracking', 'dfs'],
    constraints: '1 ≤ rows, cols ≤ 6\n1 ≤ word.length ≤ 15\nboard and word contain only lowercase + uppercase English letters.',
    follow_up: '"Word Search II" — search many words at once. Build a Trie of words; DFS through trie nodes during board traversal.',
    pattern: 'backtracking-grid-dfs',
    test_cases: [
      { inputs: ['[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]', '"ABCCED"'], expected: 'true' },
      { inputs: ['[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]', '"SEE"'], expected: 'true' },
      { inputs: ['[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]', '"ABCB"'], expected: 'false' },
      { inputs: ['[["A"]]', '"A"'], expected: 'true' },
      { inputs: ['[["A"]]', '"B"'], expected: 'false' },
      { inputs: ['[["A","B"],["C","D"]]', '"ABDC"'], expected: 'true' },
      { inputs: ['[["A","B"],["C","D"]]', '"AB"'], expected: 'true' },
      { inputs: ['[["A","B"],["C","D"]]', '"ABCD"'], expected: 'false' },
      { inputs: ['[["a","b"]]', '"ba"'], expected: 'true' },
      { inputs: ['[["a","b"]]', '"bab"'], expected: 'false' },
      { inputs: ['[["A","A","A"],["A","A","A"],["A","A","A"]]', '"AAAA"'], expected: 'true' },
      { inputs: ['[["A","A","A"],["A","A","A"],["A","A","A"]]', '"AAAAAAAAAA"'], expected: 'false' },
      { inputs: ['[["c","a","a"],["a","a","a"],["b","c","d"]]', '"aab"'], expected: 'true' },
    ],
  },
  {
    id: 'min-cost-connect-points',
    method_name: 'minCostConnectPoints',
    params: [{ name: 'points', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Build an MST. Edge weights are Manhattan distances between every pair of points.',
      'Prim\'s algorithm: from any starting point, repeatedly add the cheapest edge to a not-yet-connected point.',
      'With a min-heap of pending edges: O(E log V).',
      'Kruskal\'s: sort all edges, add each if endpoints aren\'t already connected (Union-Find).',
      'O(n²) edges for n points; Prim with adjacency matrix is O(n²) which is fine for n ≤ 1000.',
    ],
    tags: ['graph', 'mst', 'prim', 'kruskal', 'union-find'],
    constraints: '1 ≤ points.length ≤ 1000\n-10^6 ≤ xi, yi ≤ 10^6',
    follow_up: 'Real-world: cell-tower networks. Euclidean MST has O(n log n) algorithms via Delaunay.',
    pattern: 'mst-prim',
    test_cases: [
      { inputs: ['[[0,0],[2,2],[3,10],[5,2],[7,0]]'], expected: '20' },
      { inputs: ['[[3,12],[-2,5],[-4,1]]'], expected: '18' },
      { inputs: ['[[0,0]]'], expected: '0' },
      { inputs: ['[[0,0],[1,1]]'], expected: '2' },
      { inputs: ['[[0,0],[3,4]]'], expected: '7' },
      { inputs: ['[[1,0],[0,1]]'], expected: '2' },
      { inputs: ['[[0,0],[1,1],[2,2],[3,3]]'], expected: '6' },
      { inputs: ['[[-1000000,-1000000],[1000000,1000000]]'], expected: '4000000' },
      { inputs: ['[[0,0],[1,0],[2,0],[3,0]]'], expected: '3' },
      { inputs: ['[[0,0],[0,1],[0,2],[0,3]]'], expected: '3' },
      { inputs: ['[[2,-3],[-17,-8],[13,8],[-17,-15]]'], expected: '53' },
    ],
  },
  {
    id: 'network-delay',
    method_name: 'networkDelayTime',
    params: [{ name: 'times', type: 'List[List[int]]' }, { name: 'n', type: 'int' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Single-source shortest path on a directed weighted graph from node k.',
      'Dijkstra\'s algorithm: priority queue keyed by distance.',
      'After Dijkstra, the answer = max(distances). If any node is unreachable, return -1.',
      'O((V + E) log V) with a binary heap.',
      'Bellman-Ford also works in O(V·E) and handles negative edges (not needed here).',
    ],
    tags: ['graph', 'shortest-path', 'dijkstra'],
    constraints: '1 ≤ n ≤ 100\n1 ≤ times.length ≤ 6000\nsource, target ∈ [1, n], weight ∈ [0, 100]',
    follow_up: 'What if some times are negative? Bellman-Ford. With negative cycles → no solution.',
    pattern: 'dijkstra',
    test_cases: [
      { inputs: ['[[2,1,1],[2,3,1],[3,4,1]]', '4', '2'], expected: '2' },
      { inputs: ['[[1,2,1]]', '2', '1'], expected: '1' },
      { inputs: ['[[1,2,1]]', '2', '2'], expected: '-1' },
      { inputs: ['[[1,2,1],[2,3,2],[3,4,3]]', '4', '1'], expected: '6' },
      { inputs: ['[[1,2,1],[2,1,3]]', '2', '2'], expected: '3' },
      { inputs: ['[[1,2,1],[2,3,2],[3,4,1]]', '4', '3'], expected: '-1' },
      { inputs: ['[[1,2,1],[2,3,7],[1,3,4],[2,1,2]]', '3', '1'], expected: '4' },
      { inputs: ['[[1,2,1]]', '2', '2'], expected: '-1' },
      { inputs: ['[[1,2,1],[1,3,4],[2,3,2]]', '3', '1'], expected: '3' },
      { inputs: ['[[1,2,9],[2,3,1],[1,3,5]]', '3', '1'], expected: '5' },
      { inputs: ['[[1,2,1]]', '1', '1'], expected: '0' },
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
