#!/usr/bin/env node
// Batch 38: advanced graphs — MST, bipartite, critical connections, all-paths.

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
    id: 'min-cost-connect-points',
    method_name: 'minCostConnectPoints',
    params: [{ name: 'points', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Minimum spanning tree on a complete graph where edge weights are Manhattan distances.',
      'Prim\'s: pick any starting point, repeatedly add the cheapest edge to an unvisited vertex.',
      'Kruskal\'s: sort all C(n,2) edges; union-find to avoid cycles.',
      'For small n (≤ 1000), Prim with O(n²) is simplest.',
      'For sparse graphs, Kruskal is better; for dense ones, Prim with arrays beats it.',
    ],
    tags: ['graph', 'minimum-spanning-tree', 'union-find'],
    constraints: '1 ≤ points.length ≤ 1000\n-10^6 ≤ xi, yi ≤ 10^6\nAll points are unique.',
    follow_up: 'Online MST (incremental edge additions) — link-cut trees.',
    pattern: 'mst-prim-or-kruskal',
    test_cases: [
      { inputs: ['[[0,0],[2,2],[3,10],[5,2],[7,0]]'], expected: '20' },
      { inputs: ['[[3,12],[-2,5],[-4,1]]'], expected: '18' },
      { inputs: ['[[0,0]]'], expected: '0' },
      { inputs: ['[[0,0],[1,1]]'], expected: '2' },
      { inputs: ['[[0,0],[3,0],[0,4]]'], expected: '7' },
      { inputs: ['[[0,0],[1,0],[2,0],[3,0]]'], expected: '3' },
      { inputs: ['[[0,0],[2,2]]'], expected: '4' },
      { inputs: ['[[-1000000,-1000000],[1000000,1000000]]'], expected: '4000000' },
    ],
  },
  {
    id: 'is-graph-bipartite',
    method_name: 'isBipartite',
    params: [{ name: 'graph', type: 'List[List[int]]' }],
    return_type: 'bool',
    hints: [
      'Bipartite iff the graph is 2-colorable.',
      'BFS or DFS: color start node A; color neighbors B; their neighbors A; etc.',
      'Conflict (a node and its neighbor have the same color) → not bipartite.',
      'Disconnected graph: try every uncolored start.',
      'O(V + E).',
    ],
    tags: ['graph', 'bfs', 'dfs', 'union-find'],
    constraints: '1 ≤ graph.length ≤ 100\ngraph[u] is the adjacency list of node u',
    follow_up: 'Union-find variant: union u with "complement of v"; check for inconsistency.',
    pattern: '2-coloring-bfs-dfs',
    test_cases: [
      { inputs: ['[[1,2,3],[0,2],[0,1,3],[0,2]]'], expected: 'false' },
      { inputs: ['[[1,3],[0,2],[1,3],[0,2]]'], expected: 'true' },
      { inputs: ['[[]]'], expected: 'true' },
      { inputs: ['[]'], expected: 'true' },
      { inputs: ['[[1],[0]]'], expected: 'true' },
      { inputs: ['[[1,2],[0,2],[0,1]]'], expected: 'false' },
      { inputs: ['[[1],[0,2],[1]]'], expected: 'true' },
      { inputs: ['[[2,4],[2,3,4],[0,1],[1],[0,1]]'], expected: 'false' },
      { inputs: ['[[1],[0],[3],[2]]'], expected: 'true' },
      { inputs: ['[[]]'], expected: 'true' },
    ],
  },
  {
    id: 'critical-connections',
    method_name: 'criticalConnections',
    params: [{ name: 'n', type: 'int' }, { name: 'connections', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Critical edge = bridge: removing it disconnects the graph.',
      'Tarjan\'s bridge-finding: DFS tracking discovery time `disc[v]` and `low[v]`.',
      'low[v] = min discovery time reachable from v\'s subtree via at most ONE back edge.',
      'For tree edge (u, v): if low[v] > disc[u], (u, v) is a bridge.',
      'O(V + E) — single DFS.',
    ],
    tags: ['graph', 'dfs', 'tarjan', 'bridge'],
    constraints: '2 ≤ n ≤ 10^5\nn − 1 ≤ connections.length ≤ 10^5',
    follow_up: 'Articulation points: same DFS, slightly different condition (children handling).',
    pattern: 'tarjan-bridges',
    test_cases: [
      { inputs: ['4', '[[0,1],[1,2],[2,0],[1,3]]'], expected: '[[1,3]]' },
      { inputs: ['2', '[[0,1]]'], expected: '[[0,1]]' },
      { inputs: ['5', '[[0,1],[1,2],[2,3],[3,4]]'], expected: '[[0,1],[1,2],[2,3],[3,4]]' },
      { inputs: ['4', '[[0,1],[1,2],[2,3],[3,0]]'], expected: '[]' },
      { inputs: ['6', '[[0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[2,3]]'], expected: '[[2,3]]' },
      { inputs: ['3', '[[0,1],[1,2],[2,0]]'], expected: '[]' },
      { inputs: ['5', '[[1,0],[2,0],[3,2],[4,2],[4,3],[3,0],[4,0]]'], expected: '[[1,0]]' },
    ],
  },
  {
    id: 'all-paths-source-target',
    method_name: 'allPathsSourceTarget',
    params: [{ name: 'graph', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'DAG from 0 to n-1.',
      'DFS or BFS enumerating every distinct path.',
      'Append to path on entry, pop on backtrack.',
      'At n-1, record current path.',
      'O(n · 2^n) worst case — exponential paths.',
    ],
    tags: ['graph', 'dfs', 'bfs', 'backtracking'],
    constraints: '2 ≤ n ≤ 15\nGraph is a DAG with edges only forward in indexing',
    follow_up: 'Memoize "list of paths from u to target" — useful when starts vary but graph is fixed.',
    pattern: 'dfs-enumerate-paths',
    test_cases: [
      { inputs: ['[[1,2],[3],[3],[]]'], expected: '[[0,1,3],[0,2,3]]' },
      { inputs: ['[[4,3,1],[3,2,4],[3],[4],[]]'], expected: '[[0,4],[0,3,4],[0,1,3,4],[0,1,2,3,4],[0,1,4]]' },
      { inputs: ['[[1],[]]'], expected: '[[0,1]]' },
      { inputs: ['[[1,2,3],[],[],[]]'], expected: '[[0,3]]' },
      { inputs: ['[[1,2],[3],[3],[]]'], expected: '[[0,1,3],[0,2,3]]' },
      { inputs: ['[[1,3],[2],[3],[]]'], expected: '[[0,1,2,3],[0,3]]' },
    ],
  },
  {
    id: 'swim-in-water',
    method_name: 'swimInWater',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Find min max-edge weight on a path from (0,0) to (n-1, n-1).',
      'Modified Dijkstra: priority = max elevation seen along path.',
      'Pop the cell with smallest "current max". When you pop the target, return its max.',
      'Alternative: binary search on the answer t; BFS to check connectivity with cells ≤ t.',
      'Union-find: process cells in elevation order; answer = elevation when (0,0) and target first share a root.',
    ],
    tags: ['matrix', 'graph', 'dijkstra', 'binary-search', 'union-find'],
    constraints: 'n == grid.length == grid[i].length\n1 ≤ n ≤ 50\nValues are a permutation of [0, n²-1]',
    follow_up: 'Generalize to "minimum maximum-edge" between any two nodes (bottleneck shortest path).',
    pattern: 'min-max-path',
    test_cases: [
      { inputs: ['[[0,2],[1,3]]'], expected: '3' },
      { inputs: ['[[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]'], expected: '16' },
      { inputs: ['[[0]]'], expected: '0' },
      { inputs: ['[[0,1],[1,0]]'], expected: '1' },
      { inputs: ['[[3,2],[0,1]]'], expected: '3' },
      { inputs: ['[[0,2,5],[1,3,4],[6,7,8]]'], expected: '8' },
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
