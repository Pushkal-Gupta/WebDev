#!/usr/bin/env node
// Batch 6: Close out the curated 30 + grab a couple more tree classics.
// validate-bst-stub (Validate Binary Search Tree), pacific-atlantic,
// word-ladder, balanced-binary-tree, + dedup the validate-bst stub by
// upserting onto it (it's the only one in DB).

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
    id: 'validate-bst-stub',
    method_name: 'isValidBST',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Just checking node.val > left.val and node.val < right.val is NOT enough — it misses ancestors.',
      'Carry (min, max) bounds down the recursion.',
      'Root: (−∞, +∞). Going left: tighten max to current val. Going right: tighten min.',
      'If val violates the bounds, return false. If both subtrees pass, return true.',
      'In-order traversal is another way — the values must come out strictly increasing.',
    ],
    tags: ['tree', 'bst', 'dfs', 'recursion'],
    constraints: '1 ≤ nodes ≤ 10^4\n-2^31 ≤ Node.val ≤ 2^31 − 1',
    follow_up: 'Iterative in-order with a stack avoids the recursion-depth pitfall on skewed trees.',
    pattern: 'tree-bounds-recursion',
    test_cases: [
      { inputs: ['[2,1,3]'], expected: 'true' },
      { inputs: ['[5,1,4,null,null,3,6]'], expected: 'false' },
      { inputs: ['[]'], expected: 'true' },
      { inputs: ['[1]'], expected: 'true' },
      { inputs: ['[2,1,3,0]'], expected: 'true' },
      { inputs: ['[5,4,6,null,null,3,7]'], expected: 'false' },
      { inputs: ['[10,5,15,null,null,6,20]'], expected: 'false' },
      { inputs: ['[10,5,15,null,null,11,20]'], expected: 'true' },
      { inputs: ['[1,1]'], expected: 'false' },
      { inputs: ['[3,1,5,0,2,4,6]'], expected: 'true' },
      { inputs: ['[3,1,5,0,2,4,6,null,null,null,3]'], expected: 'false' },
      { inputs: ['[2,2,2]'], expected: 'false' },
      { inputs: ['[5,1,7]'], expected: 'true' },
      { inputs: ['[5,7,1]'], expected: 'false' },
      { inputs: ['[2147483647]'], expected: 'true' },
      { inputs: ['[-2147483648]'], expected: 'true' },
      { inputs: ['[1,null,2,null,3,null,4]'], expected: 'true' },
      { inputs: ['[4,null,3,null,2,null,1]'], expected: 'false' },
      { inputs: ['[20,10,30,5,15,25,35]'], expected: 'true' },
      { inputs: ['[20,10,30,5,15,25,35,null,null,12,17]'], expected: 'true' },
      { inputs: ['[20,10,30,5,15,25,35,null,null,12,17,null,null,null,null,3]'], expected: 'true' },
      { inputs: ['[8,4,12,2,6,10,14]'], expected: 'true' },
      { inputs: ['[8,12,4]'], expected: 'false' },
    ],
  },
  {
    id: 'pacific-atlantic',
    method_name: 'pacificAtlantic',
    params: [{ name: 'heights', type: 'List[List[int]]' }],
    return_type: 'List[List[int]]',
    hints: [
      'Water flows from a cell to any equal-or-lower 4-neighbor. The two oceans border the grid on opposite edges.',
      'Brute force: for each cell, run DFS/BFS checking if it can reach both oceans → O((R·C)²).',
      'Reverse the problem: from each ocean\'s border, walk INWARD to cells with equal-or-higher value.',
      'Maintain two visited sets (one per ocean). Cells in the intersection are the answer.',
      'O(R·C) time, O(R·C) space.',
    ],
    tags: ['graph', 'matrix', 'dfs', 'bfs'],
    constraints: '1 ≤ rows, cols ≤ 200\n0 ≤ heights[i][j] ≤ 10^5',
    follow_up: 'What if water can only flow strictly downward? Adjust the visit-condition to strictly higher (this is the harder "Pour Water" family of problems).',
    pattern: 'reverse-bfs-from-borders',
    test_cases: [
      { inputs: ['[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]'], expected: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]' },
      { inputs: ['[[1]]'], expected: '[[0,0]]' },
      { inputs: ['[[1,1],[1,1]]'], expected: '[[0,0],[0,1],[1,0],[1,1]]' },
      { inputs: ['[[2,1],[1,2]]'], expected: '[[0,0],[0,1],[1,0],[1,1]]' },
      { inputs: ['[[1,2,3],[8,9,4],[7,6,5]]'], expected: '[[0,2],[1,2],[2,2],[2,1],[2,0],[1,0],[0,0]]' },
      { inputs: ['[[10,10,10],[10,1,10],[10,10,10]]'], expected: '[[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]]' },
      { inputs: ['[[1]]'], expected: '[[0,0]]' },
      { inputs: ['[[5,5,5,5,5]]'], expected: '[[0,0],[0,1],[0,2],[0,3],[0,4]]' },
      { inputs: ['[[5],[5],[5],[5],[5]]'], expected: '[[0,0],[1,0],[2,0],[3,0],[4,0]]' },
      { inputs: ['[[1,2],[4,3]]'], expected: '[[0,0],[0,1],[1,0],[1,1]]' },
      { inputs: ['[[3,3,3,3,3,3],[3,0,0,0,0,3],[3,0,0,0,0,3],[3,3,3,3,3,3]]'], expected: '[[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,0],[1,5],[2,0],[2,5],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5]]' },
      { inputs: ['[[1,2,3,4,5]]'], expected: '[[0,4]]' },
      { inputs: ['[[5,4,3,2,1]]'], expected: '[[0,0]]' },
    ],
  },
  {
    id: 'word-ladder',
    method_name: 'ladderLength',
    params: [{ name: 'beginWord', type: 'str' }, { name: 'endWord', type: 'str' }, { name: 'wordList', type: 'List[str]' }],
    return_type: 'int',
    hints: [
      'Treat each word as a graph node; edge iff the two words differ in exactly one letter.',
      'BFS from beginWord; shortest path length (in edges) + 1 is the answer.',
      'Building the graph naively is O(N²·L). Better: pattern-bucket — for "hot" generate "*ot", "h*t", "ho*".',
      'During BFS, expand each word into all its 1-letter-off patterns, look up the bucket.',
      'O(N·L²) time, O(N·L) space.',
    ],
    tags: ['graph', 'bfs', 'hash-set'],
    constraints: '1 ≤ beginWord.length ≤ 10\nbeginWord.length == endWord.length == wordList[i].length\n1 ≤ wordList.length ≤ 5000',
    follow_up: '"Word Ladder II" — return ALL shortest transformation sequences. Combine BFS to find distances + DFS to reconstruct paths.',
    pattern: 'bfs-pattern-bucket',
    test_cases: [
      { inputs: ['"hit"', '"cog"', '["hot","dot","dog","lot","log","cog"]'], expected: '5' },
      { inputs: ['"hit"', '"cog"', '["hot","dot","dog","lot","log"]'], expected: '0' },
      { inputs: ['"a"', '"c"', '["a","b","c"]'], expected: '2' },
      { inputs: ['"hot"', '"dog"', '["hot","dog"]'], expected: '0' },
      { inputs: ['"hot"', '"dog"', '["hot","dog","dot"]'], expected: '3' },
      { inputs: ['"red"', '"tax"', '["ted","tex","red","tax","tad","den","rex","pee"]'], expected: '4' },
      { inputs: ['"leet"', '"code"', '["lest","leet","lose","code","lode","robe","lost"]'], expected: '6' },
      { inputs: ['"qa"', '"sq"', '["si","go","se","cm","so","ph","mt","db","mb","sb","kr","ln","tm","le","av","sm","ar","ci","ca","br","ti","ba","to","ra","fa","yo","ow","sn","ya","cr","po","fe","ho","ma","re","or","rn","au","ur","rh","sr","tc","lt","lo","as","fr","nb","yb","if","pb","ge","th","pm","rb","sh","co","ga","li","ha","hz","no","bi","di","hi","qa","pi","os","uh","wm","an","me","mo","na","la","st","er","sc","ne","mn","mi","am","ex","pt","io","be","fm","ta","tb","ni","mr","pa","he","lr","sq","ye"]'], expected: '5' },
      { inputs: ['"hot"', '"dog"', '[]'], expected: '0' },
      { inputs: ['"a"', '"a"', '["a"]'], expected: '0' },
      { inputs: ['"hot"', '"hot"', '["hot"]'], expected: '0' },
      { inputs: ['"abc"', '"def"', '["abc","abd","abe","abf","def"]'], expected: '0' },
      { inputs: ['"cat"', '"hat"', '["hat"]'], expected: '2' },
      { inputs: ['"cat"', '"hat"', '["cot","cat","hat"]'], expected: '2' },
      { inputs: ['"cat"', '"dog"', '["cot","cog","dog","cag","dat","dog"]'], expected: '0' },
    ],
  },
  {
    id: 'balanced-binary-tree',
    method_name: 'isBalanced',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Naive: at every node compute height(left) and height(right) — O(n²).',
      'Better: bottom-up. Return the height of each subtree, OR a sentinel (-1) if it\'s unbalanced.',
      'If either child returns -1, propagate -1 upward.',
      'If |left - right| > 1 at current node, return -1.',
      'O(n) time, O(h) recursion space.',
    ],
    tags: ['tree', 'dfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 5000\n-10^4 ≤ Node.val ≤ 10^4',
    follow_up: 'Define "balanced" as max depth-diff is k instead of 1 — the algorithm extends trivially.',
    pattern: 'bottom-up-tree-recursion',
    test_cases: [
      { inputs: ['[3,9,20,null,null,15,7]'], expected: 'true' },
      { inputs: ['[1,2,2,3,3,null,null,4,4]'], expected: 'false' },
      { inputs: ['[]'], expected: 'true' },
      { inputs: ['[1]'], expected: 'true' },
      { inputs: ['[1,2]'], expected: 'true' },
      { inputs: ['[1,null,2]'], expected: 'true' },
      { inputs: ['[1,2,3]'], expected: 'true' },
      { inputs: ['[1,2,3,4]'], expected: 'true' },
      { inputs: ['[1,2,null,3]'], expected: 'true' },
      { inputs: ['[1,2,null,3,null,4]'], expected: 'false' },
      { inputs: ['[1,null,2,null,3]'], expected: 'false' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]'], expected: 'true' },
      { inputs: ['[1,2,2,3,3,3,3,4,4,4,4,4,4,4,4]'], expected: 'true' },
      { inputs: ['[1,2,2,3,null,null,3,4,null,null,4]'], expected: 'false' },
      { inputs: ['[10,5,15,3,7,12,20]'], expected: 'true' },
      { inputs: ['[10,5,15,3,null,null,20]'], expected: 'true' },
      { inputs: ['[10,5,15,3,null,null,20,1]'], expected: 'true' },
      { inputs: ['[5,3,8,1,4,7,9,null,2]'], expected: 'true' },
      { inputs: ['[100]'], expected: 'true' },
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
