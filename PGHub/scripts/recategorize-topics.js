#!/usr/bin/env node
// Re-infer topic_id for every PGcode_problem using keyword priority over
// tags + name + description + pattern + existing topic_id (as low-priority
// fallback). Only writes when the inferred id is materially better than the
// current one (e.g. moves a problem from generic "arrays" to specific "dp").
//
// Usage: node scripts/recategorize-topics.js [--dry]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const dry = process.argv.includes('--dry');

// Topic-priority rules. First match wins. Specific topics outrank generic
// catch-alls (arrays/strings are last).
// Each rule: { topic, keywords: [...], priority: 1..10 } — higher priority
// wins. Run order: priority desc, then list order.
const VALID_TOPICS = new Set([
  'arrays', 'strings', 'stack', 'queue', 'linkedlist', 'recursion',
  'two-pointers', 'binary-search', 'sliding-window', 'trees', 'graphs',
  'heap', 'tries', 'dp', 'backtracking', 'greedy', 'intervals', '2d-dp',
  'advanced-graphs', 'first-order', 'math', 'bit-manipulation', 'geometry',
]);

const RULES = [
  { p: 10, topic: 'tries',           kw: ['trie', 'prefix tree', 'autocomplete'] },
  { p: 10, topic: 'advanced-graphs', kw: ['union find', 'disjoint set', 'topological', 'kruskal', 'prim', 'bellman', 'floyd', 'minimum spanning', 'tarjan', 'scc ', 'strongly connected', 'articulation', 'bridge'] },
  { p: 9,  topic: 'sliding-window',  kw: ['sliding window', 'subarray sum at most', 'longest substring', 'fixed window'] },
  { p: 9,  topic: 'backtracking',    kw: ['backtrack', 'permutation', 'permutations', 'combinations', 'subsets', 'n-queens', 'sudoku', 'word search', 'generate parenthes'] },
  { p: 8,  topic: 'heap',            kw: ['priority queue', 'heap', 'kth largest', 'kth smallest', 'top k', 'k closest', 'merge k '] },
  { p: 8,  topic: '2d-dp',           kw: ['2d dp', '2-d dp', 'longest common subsequence', 'edit distance', 'distinct subsequences', 'interleav', 'palindromic substring', 'unique paths', 'minimum path sum'] },
  { p: 8,  topic: 'dp',              kw: ['dynamic programming', ' dp ', 'memoiz', 'tabulation', 'knapsack', 'house robber', 'coin change', 'longest increasing', 'word break', 'climbing stairs', 'decode way', 'partition equal'] },
  { p: 7,  topic: 'intervals',       kw: ['interval', 'merge intervals', 'meeting room', 'non-overlapping', 'insert interval'] },
  { p: 7,  topic: 'binary-search',   kw: ['binary search', 'rotated sorted', 'find peak', 'search in matrix', 'kth element in sorted'] },
  { p: 7,  topic: 'two-pointers',    kw: ['two pointer', 'two-pointer', 'three sum', '3sum', '4sum', 'container with most water', 'trapping rain water'] },
  { p: 7,  topic: 'graphs',          kw: ['graph', 'vertex', 'vertices', 'edges', 'bfs', 'dfs', 'shortest path', 'dijkstra', 'connected component', 'island', 'rotting', 'word ladder', 'clone graph', 'course schedule', 'pacific atlantic'] },
  { p: 6,  topic: 'trees',           kw: ['binary tree', 'binary search tree', ' bst ', 'tree node', 'treenode', 'lowest common ancestor', 'level order', 'serialize tree', 'invert tree', 'tree traversal', 'in-order', 'pre-order', 'post-order', 'kth smallest in bst'] },
  { p: 6,  topic: 'linkedlist',      kw: ['linked list', 'linkedlist', 'listnode', 'reverse list', 'cycle', 'merge two sorted', 'lru cache', 'lfu cache'] },
  { p: 6,  topic: 'stack',           kw: ['monotonic stack', 'valid parenthes', 'evaluate reverse polish', 'min stack', 'next greater', 'daily temperature', 'largest rectangle'] },
  { p: 6,  topic: 'queue',           kw: ['queue', 'deque', 'sliding window maximum', 'design hit counter'] },
  { p: 5,  topic: 'greedy',          kw: ['greedy', 'jump game', 'gas station', 'task scheduler', 'partition labels', 'queue reconstruction'] },
  { p: 5,  topic: 'bit-manipulation', kw: ['bit', 'xor', 'bitwise', 'binary representation', 'hamming', 'single number', 'counting bits', 'missing number'] },
  { p: 5,  topic: 'recursion',       kw: ['recursion', 'recursive', 'tower of hanoi', 'fibonacci'] },
  { p: 4,  topic: 'math',            kw: ['math', 'prime', 'gcd', 'lcm', 'modular', 'pow(', 'sqrt', 'integer to', 'roman', 'happy number', 'plus one', 'factor', 'palindrome number'] },
  { p: 4,  topic: 'geometry',        kw: ['geometry', 'rectangle', 'polygon', 'line segment', 'convex hull'] },
  { p: 3,  topic: 'strings',         kw: ['string', 'substring', 'palindrome', 'anagram', 'isomorphic', 'group strings', 'longest palindrom', 'reverse string', 'roman to integer'] },
  { p: 1,  topic: 'arrays',          kw: ['array', 'matrix', 'subarray'] },
];

function inferTopic(p) {
  const hay = [
    p.name || '',
    p.pattern || '',
    Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || ''),
    (p.description || '').slice(0, 800),
  ].join(' ').toLowerCase();

  let best = null;
  for (const r of RULES) {
    if (!VALID_TOPICS.has(r.topic)) continue;
    if (r.kw.some(k => hay.includes(k))) {
      if (!best || r.p > best.p) best = r;
    }
  }
  return best ? best.topic : null;
}

const all = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,name,topic_id,tags,pattern,description')
    .range(from, from + 999);
  if (error) throw error;
  if (!data.length) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`Loaded ${all.length} problems`);

const changes = [];
const dist = {};
for (const p of all) {
  const inferred = inferTopic(p);
  if (!inferred) continue;
  if (inferred === p.topic_id) continue;
  // Only override "arrays" generic when we have a stronger specific match,
  // and override anything else only when current is also weak. Be conservative.
  const current = p.topic_id;
  const generic = (current === 'arrays' || current === 'strings' || !current);
  if (!generic) continue; // skip overriding specific assignments
  changes.push({ id: p.id, from: current, to: inferred });
  dist[inferred] = (dist[inferred] || 0) + 1;
}

console.log(`Proposed reassignments: ${changes.length}`);
console.log('Distribution:', JSON.stringify(dist, null, 2));

if (dry) {
  console.log('Sample (10):');
  console.log(JSON.stringify(changes.slice(0, 10), null, 2));
  process.exit(0);
}

let ok = 0, fail = 0;
for (const c of changes) {
  const { error } = await sb.from('PGcode_problems').update({ topic_id: c.to }).eq('id', c.id);
  if (error) { fail++; console.error(c.id, error.message); }
  else ok++;
}
console.log(JSON.stringify({ reassigned: ok, failed: fail }, null, 2));
