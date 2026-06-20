#!/usr/bin/env node
// Batch 48: graph + topo hardies.

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
    id: 'course-schedule',
    method_name: 'canFinish',
    params: [{ name: 'numCourses', type: 'int' }, { name: 'prerequisites', type: 'List[List[int]]' }],
    return_type: 'bool',
    hints: [
      'Detect a cycle in a directed graph.',
      'Kahn\'s algorithm: build in-degree array, push 0-degree to queue, peel layer by layer.',
      'If all nodes get peeled, no cycle; otherwise cycle exists.',
      'DFS variant: 3-color (white/gray/black). Gray-on-gray edge = cycle.',
      'O(V + E) time and space.',
    ],
    tags: ['graph', 'topological-sort', 'bfs', 'dfs'],
    constraints: '1 ≤ numCourses ≤ 2000\n0 ≤ prerequisites.length ≤ 5000\nprerequisites[i] = [a, b] means take b before a',
    follow_up: 'Course Schedule II — return the actual order. Append to result as you peel.',
    pattern: 'kahn-bfs-toposort',
    test_cases: [
      { inputs: ['2', '[[1,0]]'], expected: 'true' },
      { inputs: ['2', '[[1,0],[0,1]]'], expected: 'false' },
      { inputs: ['1', '[]'], expected: 'true' },
      { inputs: ['3', '[[1,0],[2,1]]'], expected: 'true' },
      { inputs: ['3', '[[1,0],[2,1],[0,2]]'], expected: 'false' },
      { inputs: ['4', '[[1,0],[2,1],[3,2]]'], expected: 'true' },
      { inputs: ['5', '[[1,4],[2,4],[3,1],[3,2]]'], expected: 'true' },
      { inputs: ['7', '[[1,0],[0,3],[0,2],[3,2],[2,5],[4,5],[5,6],[2,4]]'], expected: 'true' },
      { inputs: ['8', '[[1,0],[2,6],[1,7],[6,4],[7,0],[0,5]]'], expected: 'true' },
      { inputs: ['100', '[]'], expected: 'true' },
    ],
  },
  {
    id: 'alien-dictionary',
    method_name: 'alienOrder',
    params: [{ name: 'words', type: 'List[str]' }],
    return_type: 'str',
    hints: [
      'Build a directed graph from comparing adjacent words.',
      'For each pair (w1, w2), find the first differing char — that gives an edge w1[i] → w2[i].',
      'If w2 is a prefix of w1 (and longer), invalid: return "".',
      'Topological sort the graph. Cycle → return "".',
      'O(C) where C = total chars across all words.',
    ],
    tags: ['graph', 'topological-sort', 'string'],
    constraints: '1 ≤ words.length ≤ 100\n1 ≤ words[i].length ≤ 100\nLowercase English',
    follow_up: 'Multiple valid orderings exist — your topo sort returns one; any is accepted.',
    pattern: 'graph-build-toposort',
    test_cases: [
      { inputs: ['["wrt","wrf","er","ett","rftt"]'], expected: 'wertf' },
      { inputs: ['["z","x"]'], expected: 'zx' },
      { inputs: ['["z","x","z"]'], expected: '' },
      { inputs: ['["abc","ab"]'], expected: '' },
      { inputs: ['["a"]'], expected: 'a' },
      { inputs: ['["ab","cd","ef"]'], expected: 'acebdf' },
      { inputs: ['["a","b","a"]'], expected: '' },
      { inputs: ['["aaa","aa","aaaa"]'], expected: '' },
    ],
  },
  {
    id: 'word-ladder',
    method_name: 'ladderLength',
    params: [{ name: 'beginWord', type: 'str' }, { name: 'endWord', type: 'str' }, { name: 'wordList', type: 'List[str]' }],
    return_type: 'int',
    hints: [
      'BFS over words. Each transformation = one edge.',
      'Naive O(N²·L) — compare every pair. Better: build a pattern→words map using wildcards (h*t, *ot, ho*).',
      'For each frontier word, generate all wildcard patterns; visit every matching word.',
      'Bidirectional BFS halves the explored frontier.',
      'Return level + 1 when you reach endWord; 0 if unreachable.',
    ],
    tags: ['bfs', 'string', 'graph'],
    constraints: '1 ≤ beginWord.length ≤ 10\nendWord.length == beginWord.length\n1 ≤ wordList.length ≤ 5000',
    follow_up: 'Word Ladder II — return every shortest path. Track parents during BFS, DFS rebuild.',
    pattern: 'bfs-with-wildcard-bucket',
    test_cases: [
      { inputs: ['"hit"', '"cog"', '["hot","dot","dog","lot","log","cog"]'], expected: '5' },
      { inputs: ['"hit"', '"cog"', '["hot","dot","dog","lot","log"]'], expected: '0' },
      { inputs: ['"a"', '"c"', '["a","b","c"]'], expected: '2' },
      { inputs: ['"hot"', '"dog"', '["hot","dog"]'], expected: '0' },
      { inputs: ['"hot"', '"dog"', '["hot","dog","dot"]'], expected: '3' },
      { inputs: ['"talk"', '"tail"', '["talk","tons","fall","tail","gale","hall","negs"]'], expected: '0' },
      { inputs: ['"leet"', '"code"', '["lest","leet","lose","code","lode","robe","lost"]'], expected: '6' },
      { inputs: ['"qa"', '"sq"', '["si","go","se","cm","so","ph","mt","db","mb","sb","kr","ln","tm","le","av","sm","ar","ci","ca","br","ti","ba","to","ra","fa","yo","ow","sn","ya","cr","po","fe","ho","ma","re","or","rn","au","ur","rh","sr","tc","lt","lo","as","fr","nb","yb","if","pb","ge","th","pm","rb","sh","co","ga","li","ha","hz","no","bi","di","hi","qa","pi","os","uh","wm","an","me","mo","na","la","st","er","sc","ne","mn","mi","am","ex","pt","io","be","fm","ta","tb","ni","mr","pa","he","lr","sq","ye"]'], expected: '5' },
    ],
  },
  {
    id: 'evaluate-division',
    method_name: 'calcEquation',
    params: [
      { name: 'equations', type: 'List[List[str]]' },
      { name: 'values', type: 'List[float]' },
      { name: 'queries', type: 'List[List[str]]' },
    ],
    return_type: 'List[float]',
    hints: [
      'Model as a weighted graph: edge a → b with weight v means a/b = v.',
      'Add reverse edges b → a with weight 1/v.',
      'For each query (x, y), DFS/BFS from x; multiply edge weights along the path.',
      'If x or y unseen, return -1.0. If x == y AND x is known, return 1.0.',
      'Union-Find with ratios is even cleaner — group by component, store ratio to representative.',
    ],
    tags: ['graph', 'dfs', 'bfs', 'union-find'],
    constraints: '1 ≤ equations.length ≤ 20\nValues are positive doubles\nNo division by zero',
    follow_up: 'Online queries — Union-Find with ratios. Path compression carries the ratio product.',
    pattern: 'weighted-graph-traversal',
    test_cases: [
      { inputs: ['[["a","b"],["b","c"]]', '[2.0,3.0]', '[["a","c"],["b","a"],["a","e"],["a","a"],["x","x"]]'], expected: '[6.00000,0.50000,-1.00000,1.00000,-1.00000]' },
      { inputs: ['[["a","b"],["b","c"],["bc","cd"]]', '[1.5,2.5,5.0]', '[["a","c"],["c","b"],["bc","cd"],["cd","bc"]]'], expected: '[3.75000,0.40000,5.00000,0.20000]' },
      { inputs: ['[["a","b"]]', '[0.5]', '[["a","b"],["b","a"],["a","c"],["x","y"]]'], expected: '[0.50000,2.00000,-1.00000,-1.00000]' },
    ],
  },
  {
    id: 'graph-valid-tree',
    method_name: 'validTree',
    params: [{ name: 'n', type: 'int' }, { name: 'edges', type: 'List[List[int]]' }],
    return_type: 'bool',
    hints: [
      'A tree on n nodes has exactly n-1 edges and is connected.',
      'If edges.length != n-1, not a tree.',
      'Union-Find: process each edge; if both ends already share a root, cycle → not a tree.',
      'Else union them. Finally check all in one component (count roots).',
      'O(E·α(N)) with path compression and union by rank.',
    ],
    tags: ['graph', 'union-find', 'dfs'],
    constraints: '1 ≤ n ≤ 2000\nedges[i] = [u, v]\nNo duplicate or self edges',
    follow_up: '"Number of Connected Components" — count roots after union all.',
    pattern: 'union-find-cycle-detect',
    test_cases: [
      { inputs: ['5', '[[0,1],[0,2],[0,3],[1,4]]'], expected: 'true' },
      { inputs: ['5', '[[0,1],[1,2],[2,3],[1,3],[1,4]]'], expected: 'false' },
      { inputs: ['1', '[]'], expected: 'true' },
      { inputs: ['2', '[[0,1]]'], expected: 'true' },
      { inputs: ['2', '[]'], expected: 'false' },
      { inputs: ['3', '[[0,1],[0,2],[1,2]]'], expected: 'false' },
      { inputs: ['4', '[[0,1],[2,3]]'], expected: 'false' },
      { inputs: ['4', '[[0,1],[1,2],[2,3]]'], expected: 'true' },
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
