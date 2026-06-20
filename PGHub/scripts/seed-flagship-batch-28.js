#!/usr/bin/env node
// Batch 28: BFS/DFS grid + classic dp.

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
    id: 'max-area-of-island',
    method_name: 'maxAreaOfIsland',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Treat 1s as land; islands = 4-connected components.',
      'For each cell, run DFS/BFS and count the size of the component.',
      'Mark visited in-place (set to 0) or with a separate visited matrix.',
      'Track max area across all components.',
      'O(R·C) time and space.',
    ],
    tags: ['graph', 'matrix', 'dfs', 'bfs'],
    constraints: '1 ≤ rows, cols ≤ 50\ngrid[i][j] is 0 or 1',
    follow_up: '"Number of Distinct Islands" — canonicalize shape (e.g., translate to origin) for comparison.',
    pattern: 'flood-fill-size',
    test_cases: [
      { inputs: ['[[0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,1,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,1,1,0,0,1,0,1,0,0],[0,1,0,0,1,1,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,1,1,0,0,0,0]]'], expected: '6' },
      { inputs: ['[[0,0,0,0,0,0,0,0]]'], expected: '0' },
      { inputs: ['[[1]]'], expected: '1' },
      { inputs: ['[[0]]'], expected: '0' },
      { inputs: ['[[1,1,1]]'], expected: '3' },
      { inputs: ['[[1],[1],[1]]'], expected: '3' },
      { inputs: ['[[1,0,1,0,1]]'], expected: '1' },
      { inputs: ['[[1,1],[1,1]]'], expected: '4' },
      { inputs: ['[[1,1,0,0,1,1]]'], expected: '2' },
      { inputs: ['[[0,1,0],[1,1,1],[0,1,0]]'], expected: '5' },
    ],
  },
  {
    id: 'rotting-oranges',
    method_name: 'orangesRotting',
    params: [{ name: 'grid', type: 'List[List[int]]' }],
    return_type: 'int',
    hints: [
      'Multi-source BFS. Enqueue every rotten orange (2) at time 0.',
      'Each BFS round, every fresh orange adjacent to a rotten one becomes rotten.',
      'Track elapsed minutes = the BFS level.',
      'After BFS, if any fresh orange remains, return -1.',
      'O(R·C) time and space.',
    ],
    tags: ['graph', 'matrix', 'bfs'],
    constraints: '1 ≤ rows, cols ≤ 10\ngrid[i][j] is 0, 1, or 2',
    follow_up: '"Walls and Gates" uses the same multi-source BFS pattern.',
    pattern: 'multi-source-bfs',
    test_cases: [
      { inputs: ['[[2,1,1],[1,1,0],[0,1,1]]'], expected: '4' },
      { inputs: ['[[2,1,1],[0,1,1],[1,0,1]]'], expected: '-1' },
      { inputs: ['[[0,2]]'], expected: '0' },
      { inputs: ['[[0]]'], expected: '0' },
      { inputs: ['[[2]]'], expected: '0' },
      { inputs: ['[[1]]'], expected: '-1' },
      { inputs: ['[[2,1]]'], expected: '1' },
      { inputs: ['[[1,2]]'], expected: '1' },
      { inputs: ['[[2,0,1]]'], expected: '-1' },
      { inputs: ['[[2,2,2,2],[2,1,1,2],[2,1,1,2],[2,2,2,2]]'], expected: '2' },
      { inputs: ['[[0,0,0],[0,0,0],[0,0,0]]'], expected: '0' },
    ],
  },
  {
    id: 'surrounded-regions',
    method_name: 'solve',
    params: [{ name: 'board', type: 'List[List[str]]' }],
    return_type: 'List[List[str]]',
    hints: [
      'Capture rule: \'O\' is captured iff it cannot reach the border.',
      'Reverse: start DFS from every BORDER \'O\'; mark them as "safe" (e.g., turn into \'#\').',
      'After the floods, every remaining \'O\' is captured → flip to \'X\'.',
      'Finally, flip \'#\' back to \'O\'.',
      'O(R·C) time and space.',
    ],
    tags: ['graph', 'matrix', 'dfs', 'bfs'],
    constraints: '1 ≤ rows, cols ≤ 200\nboard[i][j] is \'X\' or \'O\'',
    follow_up: 'Union-find variant: connect every border O to a virtual "border" node; flip non-connected Os.',
    pattern: 'reverse-flood-from-border',
    test_cases: [
      { inputs: ['[["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]'], expected: '[["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]' },
      { inputs: ['[["X"]]'], expected: '[["X"]]' },
      { inputs: ['[["O"]]'], expected: '[["O"]]' },
      { inputs: ['[["X","O"],["O","X"]]'], expected: '[["X","O"],["O","X"]]' },
      { inputs: ['[["O","O","O"],["O","O","O"],["O","O","O"]]'], expected: '[["O","O","O"],["O","O","O"],["O","O","O"]]' },
      { inputs: ['[["X","X","X"],["X","O","X"],["X","X","X"]]'], expected: '[["X","X","X"],["X","X","X"],["X","X","X"]]' },
      { inputs: ['[["X","X","X","X","X"],["X","O","O","O","X"],["X","X","X","X","X"]]'], expected: '[["X","X","X","X","X"],["X","X","X","X","X"],["X","X","X","X","X"]]' },
    ],
  },
  {
    id: 'walls-and-gates',
    method_name: 'wallsAndGates',
    params: [{ name: 'rooms', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Multi-source BFS from every gate (value 0) simultaneously.',
      'Each BFS level fills empty rooms with their BFS distance.',
      'Walls (-1) block; INF (2147483647) means uninitialized empty room.',
      'O(R·C) since each cell is visited once.',
      'DFS works but is slower because cells get updated multiple times.',
    ],
    tags: ['graph', 'matrix', 'bfs'],
    constraints: '1 ≤ rooms.length, rooms[0].length ≤ 250\nrooms[i][j] ∈ {-1, 0, 2147483647}',
    follow_up: 'Variant: multiple gate types, different costs — Dijkstra from each gate type.',
    pattern: 'multi-source-bfs',
    test_cases: [
      { inputs: ['[[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]'], expected: '[[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]]' },
      { inputs: ['[[-1]]'], expected: '[[-1]]' },
      { inputs: ['[[0]]'], expected: '[[0]]' },
      { inputs: ['[[2147483647,2147483647]]'], expected: '[[2147483647,2147483647]]' },
      { inputs: ['[[0,2147483647]]'], expected: '[[0,1]]' },
      { inputs: ['[[0,-1,2147483647]]'], expected: '[[0,-1,2147483647]]' },
      { inputs: ['[[0,2147483647,2147483647,2147483647]]'], expected: '[[0,1,2,3]]' },
      { inputs: ['[[2147483647,2147483647,2147483647],[2147483647,0,2147483647],[2147483647,2147483647,2147483647]]'], expected: '[[2,1,2],[1,0,1],[2,1,2]]' },
    ],
  },
  {
    id: 'min-cost-climbing-stairs',
    method_name: 'minCostClimbingStairs',
    params: [{ name: 'cost', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'You can start at index 0 OR 1. Each step pays cost[i] and lets you climb 1 or 2.',
      'dp[i] = cost to ARRIVE at step i = min(dp[i-1], dp[i-2]) + cost[i].',
      'Answer = min(dp[n-1], dp[n-2]) — top is one beyond, reachable from either of the last two.',
      'O(n) time, O(1) space — only the last two values needed.',
      'Classic single-line DP.',
    ],
    tags: ['array', 'dp'],
    constraints: '2 ≤ cost.length ≤ 1000\n0 ≤ cost[i] ≤ 999',
    follow_up: 'Generalize to: can climb up to K stairs at a time.',
    pattern: '1d-dp-rolling',
    test_cases: [
      { inputs: ['[10,15,20]'], expected: '15' },
      { inputs: ['[1,100,1,1,1,100,1,1,100,1]'], expected: '6' },
      { inputs: ['[0,0]'], expected: '0' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[2,1]'], expected: '1' },
      { inputs: ['[10,15]'], expected: '10' },
      { inputs: ['[1,1,1,1]'], expected: '2' },
      { inputs: ['[5,5,5,5,5]'], expected: '10' },
      { inputs: ['[100,1,1,100]'], expected: '2' },
      { inputs: ['[10,1,10,1,10]'], expected: '12' },
      { inputs: ['[0,1,0,1,0]'], expected: '0' },
      { inputs: ['[1,2,3,4,5]'], expected: '6' },
      { inputs: ['[999,999]'], expected: '999' },
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
