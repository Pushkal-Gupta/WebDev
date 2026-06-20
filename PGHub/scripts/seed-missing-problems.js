#!/usr/bin/env node
// Insert the canonical LeetCode problems that the Blind-75 / Grind-75 / concept
// seeders couldn't find. Each becomes a placeholder PGcode_problems row that
// users can solve via the standard solver flow.

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

const ROWS = [
  { id: 'lca-bst', topic_id: 'trees', name: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'Medium',
    description: '<p>Given a BST and two nodes, return the lowest common ancestor. Exploit the BST property: walk down from root, going left when both targets are smaller and right when both are larger; otherwise the current node is the LCA.</p>',
    leetcode_url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/',
  },
  { id: 'first-bad-version', topic_id: 'binary-search', name: 'First Bad Version', difficulty: 'Easy',
    description: '<p>Versions 1..n; given an API <code>isBadVersion(v)</code> that becomes true at some point and stays true, find the first bad version with the fewest API calls. Binary search on the answer.</p>',
    leetcode_url: 'https://leetcode.com/problems/first-bad-version/',
  },
  { id: 'ransom-note', topic_id: 'strings', name: 'Ransom Note', difficulty: 'Easy',
    description: '<p>Given two strings <code>ransomNote</code> and <code>magazine</code>, return true iff <code>ransomNote</code> can be constructed from the characters of <code>magazine</code> (each magazine character can be used at most once). Count frequencies.</p>',
    leetcode_url: 'https://leetcode.com/problems/ransom-note/',
  },
  { id: 'longest-palindrome', topic_id: 'strings', name: 'Longest Palindrome', difficulty: 'Easy',
    description: '<p>Given a string of letters, return the length of the longest palindrome that can be built using those letters. Take every pair-count + at most one odd center.</p>',
    leetcode_url: 'https://leetcode.com/problems/longest-palindrome/',
  },
  { id: 'implement-trie', topic_id: 'tries', name: 'Implement Trie (Prefix Tree)', difficulty: 'Medium',
    description: '<p>Implement a Trie supporting <code>insert(word)</code>, <code>search(word)</code>, and <code>startsWith(prefix)</code> in O(L) where L is the string length. Each node has 26 children (one per lowercase letter) plus an <code>isEnd</code> flag.</p>',
    leetcode_url: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
  },
  { id: 'design-add-search-words', topic_id: 'tries', name: 'Design Add and Search Words Data Structure', difficulty: 'Medium',
    description: '<p>Design a data structure supporting <code>addWord(word)</code> and <code>search(word)</code>. <code>word</code> in search may contain <code>.</code> which matches any single letter. Trie + DFS for the wildcard.</p>',
    leetcode_url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/',
  },
  { id: 'serialize-deserialize-tree', topic_id: 'trees', name: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard',
    description: '<p>Design <code>serialize(root)</code> → string and <code>deserialize(string)</code> → tree such that a tree round-trips through serialization. Pre-order DFS with a null sentinel is the standard answer.</p>',
    leetcode_url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/',
  },
  { id: 'connecting-cities-min-cost', topic_id: 'graphs', name: 'Connecting Cities With Minimum Cost', difficulty: 'Medium',
    description: '<p>n cities, weighted connections; return the min cost to connect all of them, or -1 if not possible. Minimum spanning tree (Kruskal or Prim).</p>',
    leetcode_url: 'https://leetcode.com/problems/connecting-cities-with-minimum-cost/',
  },
  { id: 'maximum-frequency-stack', topic_id: 'stack', name: 'Maximum Frequency Stack', difficulty: 'Hard',
    description: '<p>Stack that supports <code>push(x)</code> and <code>pop()</code> that always pops the most-frequent element (most-recently pushed breaks ties). Hash-map of frequency-stack lists + max frequency counter.</p>',
    leetcode_url: 'https://leetcode.com/problems/maximum-frequency-stack/',
  },
  { id: 'range-sum-query-mutable', topic_id: 'advanced-graphs', name: 'Range Sum Query - Mutable', difficulty: 'Medium',
    description: '<p>Support <code>update(i, val)</code> and <code>sumRange(l, r)</code> efficiently on a mutable integer array. Segment tree or Fenwick (BIT) in O(log n) per op.</p>',
    leetcode_url: 'https://leetcode.com/problems/range-sum-query-mutable/',
  },
  { id: 'count-smaller-after-self', topic_id: 'advanced-graphs', name: 'Count of Smaller Numbers After Self', difficulty: 'Hard',
    description: '<p>For each index i, return how many <code>nums[j] &lt; nums[i]</code> for <code>j &gt; i</code>. Merge sort with index tracking or a BIT over compressed values.</p>',
    leetcode_url: 'https://leetcode.com/problems/count-of-smaller-numbers-after-self/',
  },
  { id: 'last-stone-weight-ii', topic_id: 'dp', name: 'Last Stone Weight II', difficulty: 'Medium',
    description: '<p>Partition stones into two groups so the absolute difference of their sums is minimized. 0/1 knapsack over half the total weight.</p>',
    leetcode_url: 'https://leetcode.com/problems/last-stone-weight-ii/',
  },
  { id: 'gcd-strings', topic_id: 'math', name: 'Greatest Common Divisor of Strings', difficulty: 'Easy',
    description: '<p>Find the largest string that divides both inputs (where division means repeated concatenation). gcd-of-lengths if and only if <code>a+b == b+a</code>.</p>',
    leetcode_url: 'https://leetcode.com/problems/greatest-common-divisor-of-strings/',
  },
];

const { error } = await sb.from('PGcode_problems').upsert(ROWS, { onConflict: 'id' });
if (error) { console.error(error.message); process.exit(1); }
console.log(`Upserted ${ROWS.length} problem rows.`);
