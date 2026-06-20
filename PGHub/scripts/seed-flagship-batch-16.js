#!/usr/bin/env node
// Batch 16: tree + dp classics.

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
    id: 'path-sum',
    method_name: 'hasPathSum',
    params: [{ name: 'root', type: 'List[int]' }, { name: 'targetSum', type: 'int' }],
    return_type: 'bool',
    hints: [
      'Path = root to LEAF (not any node). A leaf has both children null.',
      'DFS: at each node, subtract its value from the remaining target.',
      'At a leaf, check if remaining target == node.val.',
      'Recurse into left OR right; return true if either branch succeeds.',
      'O(n) time, O(h) recursion.',
    ],
    tags: ['tree', 'dfs', 'recursion'],
    constraints: '0 ≤ nodes ≤ 5000\n-1000 ≤ Node.val ≤ 1000\n-1000 ≤ targetSum ≤ 1000',
    follow_up: '"Path Sum II" returns ALL such paths. "Path Sum III" counts any subpath (root-to-leaf is not required).',
    pattern: 'tree-dfs',
    test_cases: [
      { inputs: ['[5,4,8,11,null,13,4,7,2,null,null,null,1]', '22'], expected: 'true' },
      { inputs: ['[1,2,3]', '5'], expected: 'false' },
      { inputs: ['[]', '0'], expected: 'false' },
      { inputs: ['[1]', '1'], expected: 'true' },
      { inputs: ['[1]', '2'], expected: 'false' },
      { inputs: ['[1,2]', '1'], expected: 'false' },
      { inputs: ['[1,2]', '3'], expected: 'true' },
      { inputs: ['[1,-2,-3]', '-1'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7]', '7'], expected: 'true' },
      { inputs: ['[1,2,3,4,5,6,7]', '100'], expected: 'false' },
      { inputs: ['[0]', '0'], expected: 'true' },
      { inputs: ['[5,4,8,11,null,13,4,7,2,null,null,5,1]', '22'], expected: 'true' },
      { inputs: ['[-2,null,-3]', '-5'], expected: 'true' },
      { inputs: ['[1,null,2,null,3,null,4]', '10'], expected: 'true' },
    ],
  },
  {
    id: 'diameter-binary-tree',
    method_name: 'diameterOfBinaryTree',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'int',
    hints: [
      'Diameter = number of EDGES on the longest path between any two nodes (not necessarily through root).',
      'For each node, the longest path through it = depth(left) + depth(right).',
      'Recurse to compute depths; in the same recursion, update a global "best diameter".',
      'Return value of recursion is depth (1 + max child depth); the diameter is tracked separately.',
      'O(n) time, O(h) recursion.',
    ],
    tags: ['tree', 'dfs', 'recursion'],
    constraints: '1 ≤ nodes ≤ 10^4\n-100 ≤ Node.val ≤ 100',
    follow_up: '"Diameter of N-ary Tree" — for each node, take the two largest child depths.',
    pattern: 'tree-postorder-global-track',
    test_cases: [
      { inputs: ['[1,2,3,4,5]'], expected: '3' },
      { inputs: ['[1,2]'], expected: '1' },
      { inputs: ['[1]'], expected: '0' },
      { inputs: ['[1,2,3]'], expected: '2' },
      { inputs: ['[1,null,2]'], expected: '1' },
      { inputs: ['[1,2,3,4,null,null,5,6,null,null,7]'], expected: '5' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '4' },
      { inputs: ['[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]'], expected: '6' },
      { inputs: ['[4,-7,-3,null,null,-9,-3,9,-7,-4,null,6,null,-6,-6,null,null,0,6,5,null,9,null,null,-1,-4,null,null,null,-2]'], expected: '8' },
      { inputs: ['[1,2,null,3]'], expected: '2' },
      { inputs: ['[1,null,2,null,3,null,4]'], expected: '3' },
    ],
  },
  {
    id: 'level-order-traversal',
    method_name: 'levelOrder',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[List[int]]',
    hints: [
      'BFS with a queue. Each iteration processes one level.',
      'Capture queue.length at the start of each level so you know when the level ends.',
      'Push the values of that level to a new sublist; enqueue children.',
      'O(n) time, O(w) extra space where w = max width.',
      'Recursive DFS also works: pass current depth, append to result[depth].',
    ],
    tags: ['tree', 'bfs'],
    constraints: '0 ≤ nodes ≤ 2000\n-1000 ≤ Node.val ≤ 1000',
    follow_up: '"Zigzag Level Order" — alternate left-to-right / right-to-left per level.',
    pattern: 'bfs-by-level',
    test_cases: [
      { inputs: ['[3,9,20,null,null,15,7]'], expected: '[[3],[9,20],[15,7]]' },
      { inputs: ['[1]'], expected: '[[1]]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1,2,3]'], expected: '[[1],[2,3]]' },
      { inputs: ['[1,2]'], expected: '[[1],[2]]' },
      { inputs: ['[1,null,2]'], expected: '[[1],[2]]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[[1],[2,3],[4,5,6,7]]' },
      { inputs: ['[1,2,3,4,null,null,5]'], expected: '[[1],[2,3],[4,5]]' },
      { inputs: ['[1,null,2,null,3,null,4]'], expected: '[[1],[2],[3],[4]]' },
      { inputs: ['[10,5,15,3,7,12,20]'], expected: '[[10],[5,15],[3,7,12,20]]' },
    ],
  },
  {
    id: 'binary-tree-inorder-traversal',
    method_name: 'inorderTraversal',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'In-order = left, root, right.',
      'Recursive: traverse(left), visit, traverse(right). One line.',
      'Iterative with stack: push the entire left chain, pop + visit + go right, repeat.',
      'Morris traversal: O(1) space using threading — clever but rarely needed.',
      'O(n) time, O(h) space (recursive or stack).',
    ],
    tags: ['tree', 'dfs', 'stack'],
    constraints: '0 ≤ nodes ≤ 100\n-100 ≤ Node.val ≤ 100',
    follow_up: 'Variants: pre-order (visit, left, right), post-order (left, right, visit). All same data structure, different visit timing.',
    pattern: 'in-order-traversal',
    test_cases: [
      { inputs: ['[1,null,2,3]'], expected: '[1,3,2]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2,3]'], expected: '[2,1,3]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[4,2,5,1,3]' },
      { inputs: ['[5,3,7,2,4,6,8]'], expected: '[2,3,4,5,6,7,8]' },
      { inputs: ['[1,null,2]'], expected: '[1,2]' },
      { inputs: ['[2,1]'], expected: '[1,2]' },
      { inputs: ['[1,2,null,3]'], expected: '[3,2,1]' },
      { inputs: ['[1,2,3,4,5,6,7]'], expected: '[4,2,5,1,6,3,7]' },
      { inputs: ['[10,5,15,3,7,12,20]'], expected: '[3,5,7,10,12,15,20]' },
    ],
  },
  {
    id: 'binary-tree-right-side',
    method_name: 'rightSideView',
    params: [{ name: 'root', type: 'List[int]' }],
    return_type: 'List[int]',
    hints: [
      'You see the rightmost node at each level.',
      'BFS level-by-level: take the last node of each level.',
      'DFS variant: visit root, right, left. Track depth. First node seen at each new depth = the right view.',
      'O(n) time, O(w) for BFS or O(h) for DFS.',
      'Equivalently, left side view = first node at each level.',
    ],
    tags: ['tree', 'bfs', 'dfs'],
    constraints: '0 ≤ nodes ≤ 100\n-100 ≤ Node.val ≤ 100',
    follow_up: '"Boundary of Binary Tree" — combines left-view, leaves, and reverse right-view.',
    pattern: 'right-most-per-level',
    test_cases: [
      { inputs: ['[1,2,3,null,5,null,4]'], expected: '[1,3,4]' },
      { inputs: ['[1,null,3]'], expected: '[1,3]' },
      { inputs: ['[]'], expected: '[]' },
      { inputs: ['[1]'], expected: '[1]' },
      { inputs: ['[1,2,3,4,5]'], expected: '[1,3,5]' },
      { inputs: ['[1,2]'], expected: '[1,2]' },
      { inputs: ['[1,2,3]'], expected: '[1,3]' },
      { inputs: ['[1,2,3,4,null,null,5]'], expected: '[1,3,5]' },
      { inputs: ['[1,null,2,null,3,null,4]'], expected: '[1,2,3,4]' },
      { inputs: ['[10,5,15,null,7,12,20]'], expected: '[10,15,20]' },
    ],
  },
  {
    id: 'palindromic-substrings',
    method_name: 'countSubstrings',
    params: [{ name: 's', type: 'str' }],
    return_type: 'int',
    hints: [
      'Count of palindromic substrings (counting each distinct location once).',
      'Expand around centers — n centers for odd palindromes + n-1 for even = 2n-1 centers.',
      'For each, expand while characters match; each successful expansion counts as one palindrome.',
      'O(n²) time, O(1) space.',
      'Manacher\'s O(n) is the optimization most people don\'t need.',
    ],
    tags: ['string', 'dp', 'expand-around-center'],
    constraints: '1 ≤ s.length ≤ 1000\ns consists of lowercase English letters.',
    follow_up: '"Longest Palindromic Substring" — same expansion; just track the longest seen.',
    pattern: 'expand-around-center',
    test_cases: [
      { inputs: ['"abc"'], expected: '3' },
      { inputs: ['"aaa"'], expected: '6' },
      { inputs: ['"a"'], expected: '1' },
      { inputs: ['""'], expected: '0' },
      { inputs: ['"aaaa"'], expected: '10' },
      { inputs: ['"aba"'], expected: '4' },
      { inputs: ['"abba"'], expected: '6' },
      { inputs: ['"abab"'], expected: '5' },
      { inputs: ['"abcd"'], expected: '4' },
      { inputs: ['"abacaba"'], expected: '12' },
      { inputs: ['"racecar"'], expected: '10' },
      { inputs: ['"abcba"'], expected: '7' },
      { inputs: ['"madam"'], expected: '7' },
      { inputs: ['"xyz"'], expected: '3' },
      { inputs: ['"xxxx"'], expected: '10' },
    ],
  },
  {
    id: 'palindrome-linked-list',
    method_name: 'isPalindrome',
    params: [{ name: 'head', type: 'List[int]' }],
    return_type: 'bool',
    hints: [
      'Naive: copy values to array, two-pointer check. O(n) time + space.',
      'O(1) space: find middle (slow+fast), reverse second half, compare halves.',
      'Restore the list afterward if you mutated it (interview etiquette).',
      'Equal-length and odd-length lists both work — the middle node is whichever side absorbs it.',
      'O(n) time, O(1) extra space (with reverse trick).',
    ],
    tags: ['linked-list', 'two-pointers', 'recursion'],
    constraints: '1 ≤ list length ≤ 10^5\n0 ≤ Node.val ≤ 9',
    follow_up: 'Why is this harder than palindrome string? You can\'t random-access the list.',
    pattern: 'reverse-second-half',
    test_cases: [
      { inputs: ['[1,2,2,1]'], expected: 'true' },
      { inputs: ['[1,2]'], expected: 'false' },
      { inputs: ['[1]'], expected: 'true' },
      { inputs: ['[]'], expected: 'true' },
      { inputs: ['[1,1]'], expected: 'true' },
      { inputs: ['[1,2,1]'], expected: 'true' },
      { inputs: ['[1,2,3,2,1]'], expected: 'true' },
      { inputs: ['[1,2,3,4,5]'], expected: 'false' },
      { inputs: ['[1,2,3,3,2,1]'], expected: 'true' },
      { inputs: ['[1,3,2,4,3,2,1]'], expected: 'false' },
      { inputs: ['[5,5,5,5]'], expected: 'true' },
      { inputs: ['[9,8,7,8,9]'], expected: 'true' },
      { inputs: ['[0,1,0]'], expected: 'true' },
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
