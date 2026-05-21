#!/usr/bin/env node
// Batch 27: graph weighted + heap + topo.

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
    id: 'network-delay',
    method_name: 'networkDelayTime',
    params: [{ name: 'times', type: 'List[List[int]]' }, { name: 'n', type: 'int' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Dijkstra from source k. Answer = max(dist[i]) over all i; -1 if any unreachable.',
      'Build adjacency list of (neighbor, weight).',
      'Priority queue keyed by current distance.',
      'Pop smallest, relax neighbors, push.',
      'O((V + E) log V) with a binary heap.',
    ],
    tags: ['graph', 'dijkstra', 'heap'],
    constraints: '1 ≤ n ≤ 100\n1 ≤ times.length ≤ 6000\nAll edge weights are positive',
    follow_up: 'Bellman-Ford (O(V·E)) supports negative weights but is slower for non-negative.',
    pattern: 'dijkstra-shortest-path',
    test_cases: [
      { inputs: ['[[2,1,1],[2,3,1],[3,4,1]]', '4', '2'], expected: '2' },
      { inputs: ['[[1,2,1]]', '2', '1'], expected: '1' },
      { inputs: ['[[1,2,1]]', '2', '2'], expected: '-1' },
      { inputs: ['[[1,2,1],[2,3,2],[1,3,4]]', '3', '1'], expected: '3' },
      { inputs: ['[[1,2,1],[2,1,3]]', '2', '2'], expected: '3' },
      { inputs: ['[[1,2,1]]', '3', '1'], expected: '-1' },
      { inputs: ['[]', '1', '1'], expected: '0' },
      { inputs: ['[[1,2,2],[2,3,1],[1,3,4]]', '3', '1'], expected: '3' },
      { inputs: ['[[1,2,1],[2,3,1],[3,4,1],[4,5,1]]', '5', '1'], expected: '4' },
      { inputs: ['[[1,2,1],[1,3,1],[1,4,1]]', '4', '1'], expected: '1' },
    ],
  },
  {
    id: 'cheapest-flights',
    method_name: 'findCheapestPrice',
    params: [{ name: 'n', type: 'int' }, { name: 'flights', type: 'List[List[int]]' }, { name: 'src', type: 'int' }, { name: 'dst', type: 'int' }, { name: 'k', type: 'int' }],
    return_type: 'int',
    hints: [
      'Constrained shortest path: at most K stops between src and dst.',
      'Bellman-Ford-style: relax edges K+1 times.',
      'Each round, compute new distances from previous-round distances (NOT in-place — use a snapshot).',
      'Dijkstra alone doesn\'t respect the stop count; modified Dijkstra with (node, stops) state works.',
      'O(K · E) time.',
    ],
    tags: ['graph', 'bellman-ford', 'dp', 'dijkstra'],
    constraints: '1 ≤ n ≤ 100\n0 ≤ flights.length ≤ (n × (n − 1))\n0 ≤ src, dst, k < n',
    follow_up: 'Print the actual cheapest path — track predecessor per state.',
    pattern: 'k-relaxation',
    test_cases: [
      { inputs: ['4', '[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]', '0', '3', '1'], expected: '700' },
      { inputs: ['3', '[[0,1,100],[1,2,100],[0,2,500]]', '0', '2', '1'], expected: '200' },
      { inputs: ['3', '[[0,1,100],[1,2,100],[0,2,500]]', '0', '2', '0'], expected: '500' },
      { inputs: ['2', '[]', '0', '1', '0'], expected: '-1' },
      { inputs: ['2', '[[0,1,5]]', '0', '1', '0'], expected: '5' },
      { inputs: ['2', '[[0,1,5]]', '1', '0', '0'], expected: '-1' },
      { inputs: ['5', '[[0,1,1],[1,2,1],[2,3,1],[3,4,1]]', '0', '4', '3'], expected: '4' },
      { inputs: ['5', '[[0,1,1],[1,2,1],[2,3,1],[3,4,1]]', '0', '4', '2'], expected: '-1' },
      { inputs: ['4', '[[0,1,1],[0,2,5],[1,2,1],[2,3,1]]', '0', '3', '1'], expected: '7' },
      { inputs: ['4', '[[0,1,1],[0,2,5],[1,2,1],[2,3,1]]', '0', '3', '2'], expected: '3' },
    ],
  },
  {
    id: 'find-median-data-stream',
    method_name: 'findMedian',
    params: [{ name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[number]',
    hints: [
      'Two heaps: max-heap "lower" (smaller half), min-heap "upper" (larger half).',
      'Maintain |lower| − |upper| ∈ {0, 1}.',
      'addNum: push to lower, then move its top to upper, then rebalance if upper is larger.',
      'findMedian: if sizes equal → average of tops; else → top of lower.',
      'O(log n) per add, O(1) per query.',
    ],
    tags: ['heap', 'design', 'two-heaps'],
    constraints: '1 ≤ number of calls ≤ 5·10^4\n-10^5 ≤ num ≤ 10^5',
    follow_up: '"Sliding Window Median" — same two-heaps idea + lazy deletion.',
    pattern: 'two-heaps',
    test_cases: [
      { inputs: ['[["addNum","1"],["addNum","2"],["findMedian"],["addNum","3"],["findMedian"]]'], expected: '[1.5,2]' },
      { inputs: ['[["addNum","5"],["findMedian"]]'], expected: '[5]' },
      { inputs: ['[["addNum","1"],["findMedian"],["addNum","2"],["findMedian"],["addNum","3"],["findMedian"]]'], expected: '[1,1.5,2]' },
      { inputs: ['[["addNum","-1"],["addNum","-2"],["findMedian"],["addNum","-3"],["findMedian"]]'], expected: '[-1.5,-2]' },
      { inputs: ['[["addNum","6"],["addNum","10"],["addNum","2"],["addNum","4"],["findMedian"]]'], expected: '[5]' },
      { inputs: ['[["addNum","0"],["addNum","0"],["findMedian"]]'], expected: '[0]' },
      { inputs: ['[["addNum","1"],["addNum","1"],["addNum","1"],["findMedian"]]'], expected: '[1]' },
      { inputs: ['[["addNum","100000"],["addNum","-100000"],["findMedian"]]'], expected: '[0]' },
    ],
  },
  {
    id: 'course-schedule-ii',
    method_name: 'findOrder',
    params: [{ name: 'numCourses', type: 'int' }, { name: 'prerequisites', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    hints: [
      'Topological sort. Kahn\'s algorithm with in-degree.',
      'Build graph + in-degree count.',
      'Queue all nodes with in-degree 0. Pop, append to result, decrement neighbors\' in-degree, push when zero.',
      'If result has fewer than numCourses nodes → cycle → return [].',
      'O(V + E).',
    ],
    tags: ['graph', 'topological-sort', 'bfs', 'dfs'],
    constraints: '1 ≤ numCourses ≤ 2000\n0 ≤ prerequisites.length ≤ 2000',
    follow_up: 'Lexicographically smallest topo order — replace queue with a min-heap.',
    pattern: 'kahn-topological-sort',
    test_cases: [
      { inputs: ['2', '[[1,0]]'], expected: '[0,1]' },
      { inputs: ['4', '[[1,0],[2,0],[3,1],[3,2]]'], expected: '[0,1,2,3]' },
      { inputs: ['1', '[]'], expected: '[0]' },
      { inputs: ['2', '[[1,0],[0,1]]'], expected: '[]' },
      { inputs: ['3', '[[1,0],[2,1]]'], expected: '[0,1,2]' },
      { inputs: ['3', '[[1,0],[2,1],[0,2]]'], expected: '[]' },
      { inputs: ['5', '[]'], expected: '[0,1,2,3,4]' },
      { inputs: ['6', '[[1,0],[2,1],[3,2],[4,3],[5,4]]'], expected: '[0,1,2,3,4,5]' },
      { inputs: ['4', '[[0,1],[1,2],[2,3]]'], expected: '[3,2,1,0]' },
      { inputs: ['4', '[[0,1],[1,2],[2,3],[3,0]]'], expected: '[]' },
    ],
  },
  {
    id: 'redundant-connection',
    method_name: 'findRedundantConnection',
    params: [{ name: 'edges', type: 'List[List[int]]' }],
    return_type: 'List[int]',
    hints: [
      'Start with a tree (no cycle); one extra edge introduces exactly one cycle.',
      'Process edges in order. Use Union-Find: if both endpoints already share a root, this edge closes a cycle — return it.',
      'Otherwise union them.',
      'Path compression + union by rank → near O(1) per op.',
      'DFS variant: for each edge (u,v), see if v is reachable from u without using this edge.',
    ],
    tags: ['graph', 'union-find', 'dfs'],
    constraints: 'n == edges.length\n3 ≤ n ≤ 1000\nedges[i].length == 2',
    follow_up: '"Redundant Connection II" — directed version; subtler because a single cycle isn\'t always the answer.',
    pattern: 'union-find-cycle-detect',
    test_cases: [
      { inputs: ['[[1,2],[1,3],[2,3]]'], expected: '[2,3]' },
      { inputs: ['[[1,2],[2,3],[3,4],[1,4],[1,5]]'], expected: '[1,4]' },
      { inputs: ['[[1,2],[2,3],[1,3]]'], expected: '[1,3]' },
      { inputs: ['[[1,2],[3,1],[3,2]]'], expected: '[3,2]' },
      { inputs: ['[[1,4],[3,4],[1,3],[1,2],[4,5]]'], expected: '[1,3]' },
      { inputs: ['[[1,2],[2,3],[3,4],[4,1]]'], expected: '[4,1]' },
      { inputs: ['[[1,2],[3,4],[2,4],[3,1],[1,4]]'], expected: '[1,4]' },
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
