#!/usr/bin/env node
// Batch 23: design + DP + trees.

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
    id: 'lru-cache',
    method_name: 'lruCache',
    params: [{ name: 'capacity', type: 'int' }, { name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[int]',
    hints: [
      'Doubly linked list (for O(1) move-to-front + remove from tail) + hash map key→node.',
      'get(key): if absent → -1. Else: unlink the node, push to front, return value.',
      'put(key, val): if exists → update value, move to front. Else: insert at front; if over capacity, evict tail and erase from map.',
      'All four operations are O(1).',
      'Most languages have a built-in (LinkedHashMap in Java, OrderedDict in Python) — implement explicitly in interviews.',
    ],
    tags: ['design', 'hash-map', 'linked-list'],
    constraints: '1 ≤ capacity ≤ 3000\n0 ≤ key, value ≤ 10^4\nUp to 2·10^5 operations.',
    follow_up: '"LFU Cache" — track frequency too. Two-level structure: frequency buckets, each a linked list ordered by recency.',
    pattern: 'doubly-linked-list-plus-hashmap',
    test_cases: [
      { inputs: ['2', '[["put","1","1"],["put","2","2"],["get","1"],["put","3","3"],["get","2"],["put","4","4"],["get","1"],["get","3"],["get","4"]]'], expected: '[1,-1,-1,3,4]' },
      { inputs: ['1', '[["put","1","1"],["put","2","2"],["get","1"]]'], expected: '[-1]' },
      { inputs: ['2', '[["put","1","1"],["put","2","2"],["get","1"],["put","3","3"],["get","2"]]'], expected: '[1,-1]' },
      { inputs: ['3', '[["put","1","1"],["put","2","2"],["put","3","3"],["get","1"],["get","2"],["get","3"]]'], expected: '[1,2,3]' },
      { inputs: ['1', '[["put","1","1"],["get","1"]]'], expected: '[1]' },
      { inputs: ['2', '[["get","1"]]'], expected: '[-1]' },
      { inputs: ['2', '[["put","1","100"],["put","1","200"],["get","1"]]'], expected: '[200]' },
      { inputs: ['2', '[["put","1","1"],["put","2","2"],["get","1"],["get","2"],["put","3","3"],["get","1"]]'], expected: '[1,2,-1]' },
    ],
  },
  {
    id: 'perfect-squares',
    method_name: 'numSquares',
    params: [{ name: 'n', type: 'int' }],
    return_type: 'int',
    hints: [
      'dp[i] = min count to sum to i. dp[0] = 0.',
      'dp[i] = 1 + min(dp[i - k²]) for every k where k² ≤ i.',
      'Result = dp[n]. O(n √n) time.',
      'Lagrange\'s four-square theorem: every positive int is the sum of at most 4 squares.',
      'Legendre\'s three-square: n needs 4 iff n == 4^k (8m + 7). O(√n) closed form.',
    ],
    tags: ['math', 'dp', 'bfs'],
    constraints: '1 ≤ n ≤ 10^4',
    follow_up: 'BFS on values 0..n: edge n → n − k². The shortest path is the answer.',
    pattern: '1d-dp',
    test_cases: [
      { inputs: ['12'], expected: '3' },
      { inputs: ['13'], expected: '2' },
      { inputs: ['1'], expected: '1' },
      { inputs: ['2'], expected: '2' },
      { inputs: ['3'], expected: '3' },
      { inputs: ['4'], expected: '1' },
      { inputs: ['7'], expected: '4' },
      { inputs: ['9'], expected: '1' },
      { inputs: ['10'], expected: '2' },
      { inputs: ['25'], expected: '1' },
      { inputs: ['100'], expected: '1' },
      { inputs: ['28'], expected: '4' },
      { inputs: ['50'], expected: '2' },
      { inputs: ['99'], expected: '3' },
      { inputs: ['10000'], expected: '1' },
    ],
  },
  {
    id: 'longest-valid-parentheses',
    method_name: 'longestValidParentheses',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Stack: push indices of `(`. For `)`, pop a match. If the stack is empty, push the current index as a new boundary.',
      'After a successful pop, current valid length = i − stack.top.',
      'DP: dp[i] = length of the longest valid substring ENDING at i. Update via case analysis on s[i-1] and s[i].',
      'Two-pass counter: count opens vs closes left-to-right then right-to-left; record longest valid window.',
      'O(n) time, O(n) or O(1) space depending on approach.',
    ],
    tags: ['string', 'stack', 'dp'],
    constraints: '0 ≤ s.length ≤ 3·10^4\ns consists of \'(\' and \')\' only.',
    follow_up: 'Multiple bracket types: requires stack tracking each bracket — DP gets messy.',
    pattern: 'stack-with-sentinel-or-dp',
    test_cases: [
      { inputs: ['"(()"'], expected: '2' },
      { inputs: ['")()())"'], expected: '4' },
      { inputs: ['""'], expected: '0' },
      { inputs: ['"("'], expected: '0' },
      { inputs: ['")"'], expected: '0' },
      { inputs: ['"()"'], expected: '2' },
      { inputs: ['"(())"'], expected: '4' },
      { inputs: ['"()()"'], expected: '4' },
      { inputs: ['"()(())"'], expected: '6' },
      { inputs: ['"(()(((()"'], expected: '2' },
      { inputs: ['"()((()"'], expected: '2' },
      { inputs: ['"((()))((()))"'], expected: '12' },
      { inputs: ['"))(((("'], expected: '0' },
      { inputs: ['"(()))((()))"'], expected: '6' },
    ],
  },
  {
    id: 'construct-from-preorder-inorder',
    method_name: 'buildTree',
    params: [{ name: 'preorder', type: 'List[int]' }, { name: 'inorder', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'preorder[0] is the root.',
      'Find the root\'s position in inorder; everything left is the left subtree, everything right is the right.',
      'Recurse on the corresponding slices of preorder and inorder.',
      'Use a hashmap value→index in inorder for O(1) lookups → O(n) overall.',
      'Iterative with stack works but the recursive version is cleaner.',
    ],
    tags: ['tree', 'array', 'hash-map', 'recursion'],
    constraints: '1 ≤ nodes ≤ 3000\nValues are unique.',
    follow_up: 'Build from inorder + postorder — symmetric: postorder[-1] is root, slice + recurse.',
    pattern: 'divide-and-conquer-on-traversals',
    test_cases: [
      { inputs: ['[3,9,20,15,7]', '[9,3,15,20,7]'], expected: '[3,9,20,null,null,15,7]' },
      { inputs: ['[-1]', '[-1]'], expected: '[-1]' },
      { inputs: ['[1]', '[1]'], expected: '[1]' },
      { inputs: ['[1,2]', '[2,1]'], expected: '[1,2]' },
      { inputs: ['[1,2]', '[1,2]'], expected: '[1,null,2]' },
      { inputs: ['[1,2,3]', '[2,1,3]'], expected: '[1,2,3]' },
      { inputs: ['[1,2,3]', '[3,2,1]'], expected: '[1,2,null,3]' },
      { inputs: ['[5,3,2,4,7,6,8]', '[2,3,4,5,6,7,8]'], expected: '[5,3,7,2,4,6,8]' },
    ],
  },
  {
    id: 'validate-bst',
    method_name: 'isValidBST',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Just checking node.val > left.val and node.val < right.val is NOT enough.',
      'Carry (min, max) bounds down. Going left tightens max; going right tightens min.',
      'If val violates a bound, return false. Otherwise recurse.',
      'In-order traversal alternative: values must come out strictly increasing.',
      'O(n) time, O(h) recursion.',
    ],
    tags: ['tree', 'bst', 'dfs', 'recursion'],
    constraints: '1 ≤ nodes ≤ 10^4\n-2^31 ≤ Node.val ≤ 2^31 − 1',
    follow_up: 'Iterative in-order with a stack avoids recursion-depth concerns on skewed trees.',
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
      { inputs: ['[2,2,2]'], expected: 'false' },
      { inputs: ['[2147483647]'], expected: 'true' },
      { inputs: ['[-2147483648]'], expected: 'true' },
      { inputs: ['[20,10,30,5,15,25,35]'], expected: 'true' },
      { inputs: ['[20,10,30,5,15,25,35,null,null,12,17]'], expected: 'true' },
    ],
  },
  {
    id: 'implement-trie',
    method_name: 'trie',
    params: [{ name: 'ops', type: 'List[List[str]]' }],
    return_type: 'List[str]',
    hints: [
      'Each node has 26 children (lowercase English) + an `isEnd` boolean.',
      'insert(word): walk; create missing children; mark last node `isEnd = true`.',
      'search(word): walk; if a child is missing → false; final node\'s `isEnd` must be true.',
      'startsWith(prefix): walk; missing child → false; otherwise true regardless of `isEnd`.',
      'All ops O(L) where L = string length.',
    ],
    tags: ['trie', 'design', 'string'],
    constraints: 'word & prefix length 1..2000\nLowercase English\nUp to 3·10^4 calls',
    follow_up: '"Add and Search Word" — same trie with DFS for wildcards.',
    pattern: 'trie-26-children',
    test_cases: [
      { inputs: ['[["insert","apple"],["search","apple"],["search","app"],["startsWith","app"],["insert","app"],["search","app"]]'], expected: '["true","false","true","true"]' },
      { inputs: ['[["insert","a"],["search","a"],["search","ab"]]'], expected: '["true","false"]' },
      { inputs: ['[["insert","hello"],["startsWith","hel"],["startsWith","hello"],["startsWith","helloo"]]'], expected: '["true","true","false"]' },
      { inputs: ['[["search","abc"]]'], expected: '["false"]' },
      { inputs: ['[["startsWith","x"]]'], expected: '["false"]' },
      { inputs: ['[["insert","cat"],["insert","car"],["insert","card"],["search","car"],["search","cars"],["startsWith","car"]]'], expected: '["true","false","true"]' },
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
