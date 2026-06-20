#!/usr/bin/env node
// Seed topical lists (DP 50, Graph 50, Tree 50, SQL 50) and high-frequency
// company problem tags by matching canonical LeetCode names against
// PGcode_problems. Idempotent via upsert.

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

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry');
if (!URL || !KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(URL, KEY);

// Canonical LeetCode problem names — quality > quantity. Each entry will be
// matched against PGcode_problems.name with normalized comparison.
const TOPICAL_LISTS = {
  'dp-50': [
    'Climbing Stairs', 'House Robber', 'House Robber II', 'Coin Change', 'Coin Change II',
    'Longest Increasing Subsequence', 'Longest Common Subsequence', 'Edit Distance',
    'Maximum Subarray', 'Maximum Product Subarray', 'Best Time to Buy and Sell Stock',
    'Best Time to Buy and Sell Stock with Cooldown', 'Best Time to Buy and Sell Stock IV',
    'Word Break', 'Partition Equal Subset Sum', 'Target Sum', 'Decode Ways',
    'Unique Paths', 'Unique Paths II', 'Minimum Path Sum', 'Triangle',
    'Combination Sum IV', 'Perfect Squares', 'Palindromic Substrings',
    'Longest Palindromic Subsequence', 'Longest Palindromic Substring',
    'Distinct Subsequences', 'Interleaving String', 'Regular Expression Matching',
    'Wildcard Matching', 'Burst Balloons', 'Stone Game', 'Predict the Winner',
    'Maximal Square', 'Maximal Rectangle', 'Frog Jump', 'Jump Game',
    'Jump Game II', 'Cherry Pickup', 'Russian Doll Envelopes', 'Number of Longest Increasing Subsequence',
    'Minimum Cost For Tickets', 'Word Break II', 'Concatenated Words',
    'Number of Ways to Stay in the Same Place After Some Steps',
    'Count Vowels Permutation', 'Knight Probability in Chessboard',
    'Out of Boundary Paths', 'Domino and Tromino Tiling',
  ],
  'graph-50': [
    'Number of Islands', 'Max Area of Island', 'Surrounded Regions', 'Pacific Atlantic Water Flow',
    'Course Schedule', 'Course Schedule II', 'Course Schedule IV',
    'Clone Graph', 'Word Ladder', 'Word Ladder II',
    'Alien Dictionary', 'Graph Valid Tree', 'Number of Connected Components in an Undirected Graph',
    'Network Delay Time', 'Cheapest Flights Within K Stops', 'Path with Maximum Probability',
    'Find the City With the Smallest Number of Neighbors at a Threshold Distance',
    'Reconstruct Itinerary', 'Evaluate Division', 'Accounts Merge',
    'Redundant Connection', 'Redundant Connection II', 'Number of Provinces',
    'Is Graph Bipartite?', 'Possible Bipartition', 'Critical Connections in a Network',
    'Walls and Gates', 'Rotting Oranges', 'Shortest Path in Binary Matrix',
    'Shortest Path in a Grid with Obstacles Elimination',
    'Word Search', 'Word Search II', 'Number of Distinct Islands',
    'Most Stones Removed with Same Row or Column', 'Bus Routes',
    'Swim in Rising Water', 'Sliding Puzzle', 'Open the Lock',
    'Minimum Genetic Mutation', 'Snakes and Ladders', 'Minimum Knight Moves',
    'Path with Minimum Effort', 'Number of Operations to Make Network Connected',
    'Find Eventual Safe States', 'Keys and Rooms',
    'All Paths From Source to Target', 'Time Needed to Inform All Employees',
    'Longest Increasing Path in a Matrix', 'Making A Large Island',
  ],
  'tree-50': [
    'Binary Tree Inorder Traversal', 'Binary Tree Preorder Traversal', 'Binary Tree Postorder Traversal',
    'Binary Tree Level Order Traversal', 'Binary Tree Zigzag Level Order Traversal',
    'Maximum Depth of Binary Tree', 'Minimum Depth of Binary Tree',
    'Symmetric Tree', 'Invert Binary Tree', 'Same Tree', 'Subtree of Another Tree',
    'Balanced Binary Tree', 'Diameter of Binary Tree',
    'Path Sum', 'Path Sum II', 'Path Sum III', 'Binary Tree Maximum Path Sum',
    'Lowest Common Ancestor of a Binary Tree', 'Lowest Common Ancestor of a Binary Search Tree',
    'Convert Sorted Array to Binary Search Tree', 'Validate Binary Search Tree',
    'Kth Smallest Element in a BST', 'Recover Binary Search Tree',
    'Construct Binary Tree from Preorder and Inorder Traversal',
    'Construct Binary Tree from Inorder and Postorder Traversal',
    'Serialize and Deserialize Binary Tree', 'Flatten Binary Tree to Linked List',
    'Populating Next Right Pointers in Each Node', 'Binary Tree Right Side View',
    'Sum Root to Leaf Numbers', 'Count Complete Tree Nodes',
    'House Robber III', 'Binary Tree Cameras', 'Distribute Coins in Binary Tree',
    'All Nodes Distance K in Binary Tree', 'Binary Tree Pruning',
    'Increasing Order Search Tree', 'Range Sum of BST',
    'Trim a Binary Search Tree', 'Convert BST to Greater Tree',
    'Find Mode in Binary Search Tree', 'Two Sum IV - Input is a BST',
    'Average of Levels in Binary Tree', 'Vertical Order Traversal of a Binary Tree',
    'Longest Univalue Path', 'Delete Node in a BST',
    'Maximum Difference Between Node and Ancestor',
    'Smallest Subtree with all the Deepest Nodes', 'Find Bottom Left Tree Value',
    'Cousins in Binary Tree',
  ],
};

// Per-company "frequently asked" — sourced from public LeetCode frequency lists,
// best-of compilations, and well-known onsite question banks. Conservative
// 20-30 per Big Tech rather than padding with unknowns.
const COMPANY_PROBLEMS = {
  google: [
    'Two Sum', 'Longest Substring Without Repeating Characters', 'Median of Two Sorted Arrays',
    'LRU Cache', 'Word Break', 'Word Ladder', 'Number of Islands', 'Course Schedule',
    'Meeting Rooms II', 'Trapping Rain Water', 'Longest Increasing Path in a Matrix',
    'Insert Delete GetRandom O(1)', 'Decode String', 'Evaluate Division',
    'Maximum Subarray', 'Minimum Window Substring', 'Word Search II', 'Alien Dictionary',
    'Encode and Decode Strings', 'Sliding Window Maximum',
  ],
  meta: [
    'Two Sum', 'Valid Palindrome', 'Add Binary', 'Merge Intervals', 'K Closest Points to Origin',
    'Minimum Remove to Make Valid Parentheses', 'Subarray Sum Equals K', 'Move Zeroes',
    'Best Time to Buy and Sell Stock', 'Word Break', 'Verifying an Alien Dictionary',
    'Binary Tree Vertical Order Traversal', 'Random Pick with Weight',
    'Range Sum of BST', 'Diameter of Binary Tree', 'Maximum Swap', 'Pow(x, n)',
    'Lowest Common Ancestor of a Binary Tree', 'Valid Word Abbreviation',
    'Group Anagrams',
  ],
  amazon: [
    'Two Sum', 'Number of Islands', 'LRU Cache', 'Trapping Rain Water', 'Merge Intervals',
    'Word Break', 'Course Schedule', 'Top K Frequent Elements', 'Best Time to Buy and Sell Stock',
    'Reorder Data in Log Files', 'Rotting Oranges', 'K Closest Points to Origin',
    'Median of Two Sorted Arrays', 'Find Median from Data Stream', 'Word Search',
    'Subtree of Another Tree', 'Longest Palindromic Substring', 'Sliding Window Maximum',
    'Copy List with Random Pointer', 'Word Ladder',
  ],
  microsoft: [
    'Two Sum', 'Reverse Linked List', 'Add Two Numbers', 'Merge Two Sorted Lists',
    'Valid Parentheses', 'Number of Islands', 'LRU Cache', 'Spiral Matrix',
    'Rotate Image', 'Course Schedule', 'Merge Intervals', 'Best Time to Buy and Sell Stock',
    'Longest Substring Without Repeating Characters', 'Reverse Words in a String',
    'String to Integer (atoi)', 'Word Break', 'Trapping Rain Water', 'Maximum Subarray',
    'Symmetric Tree', 'Validate Binary Search Tree',
  ],
  apple: [
    'Two Sum', 'Add Two Numbers', 'LRU Cache', 'Number of Islands', 'Valid Sudoku',
    'Sudoku Solver', 'Longest Palindromic Substring', 'Word Break', 'Course Schedule',
    'Merge Intervals', 'Top K Frequent Elements', 'Best Time to Buy and Sell Stock',
    'Maximum Subarray', 'Reverse Linked List', 'Group Anagrams',
    'Climbing Stairs', 'Container With Most Water', 'Trapping Rain Water',
    'Binary Tree Level Order Traversal', 'Word Ladder',
  ],
  netflix: [
    'LRU Cache', 'LFU Cache', 'Design Add and Search Words Data Structure',
    'Word Ladder', 'Number of Islands', 'Course Schedule', 'Merge Intervals',
    'Top K Frequent Elements', 'Two Sum', 'Find Median from Data Stream',
    'Subarray Sum Equals K', 'Meeting Rooms II',
  ],
  uber: [
    'Two Sum', 'LRU Cache', 'Number of Islands', 'Merge Intervals', 'Course Schedule',
    'Word Break', 'Top K Frequent Elements', 'Trapping Rain Water', 'Maximum Subarray',
    'Find Median from Data Stream', 'Insert Delete GetRandom O(1)',
    'Best Time to Buy and Sell Stock', 'Encode and Decode Strings', 'Word Ladder',
    'Design HashMap',
  ],
  bloomberg: [
    'Two Sum', 'LRU Cache', 'Trapping Rain Water', 'Maximum Subarray',
    'Number of Islands', 'Merge Intervals', 'Word Break', 'Course Schedule',
    'Reverse Linked List', 'Add Two Numbers', 'Valid Parentheses',
    'Best Time to Buy and Sell Stock', 'Binary Tree Level Order Traversal',
    'Top K Frequent Elements', 'Subarray Sum Equals K',
  ],
  flipkart: [
    'Two Sum', 'LRU Cache', 'Number of Islands', 'Top K Frequent Elements',
    'Merge Intervals', 'Word Break', 'Best Time to Buy and Sell Stock',
    'Course Schedule', 'Trapping Rain Water', 'Maximum Subarray',
    'Subarray Sum Equals K', 'Find Median from Data Stream',
  ],
  swiggy: [
    'Two Sum', 'LRU Cache', 'Number of Islands', 'Merge Intervals', 'Course Schedule',
    'Word Break', 'Best Time to Buy and Sell Stock',
  ],
  zomato: [
    'Two Sum', 'LRU Cache', 'Number of Islands', 'Merge Intervals',
    'Best Time to Buy and Sell Stock', 'Top K Frequent Elements',
  ],
  razorpay: [
    'Two Sum', 'LRU Cache', 'Reverse Linked List', 'Number of Islands',
    'Merge Intervals', 'Top K Frequent Elements', 'Valid Parentheses',
  ],
  cred: [
    'Two Sum', 'LRU Cache', 'Add Two Numbers', 'Reverse Linked List',
    'Valid Parentheses', 'Merge Intervals',
  ],
  goldman_sachs: [],
  'goldman-sachs': [
    'Two Sum', 'Best Time to Buy and Sell Stock', 'Trapping Rain Water',
    'Longest Substring Without Repeating Characters', 'Maximum Subarray',
    'Valid Parentheses', 'Word Break', 'Number of Islands', 'LRU Cache',
    'Merge Intervals', 'Spiral Matrix', 'Pow(x, n)',
  ],
  'de-shaw': [
    'Two Sum', 'Trapping Rain Water', 'Maximum Subarray', 'Longest Substring Without Repeating Characters',
    'Best Time to Buy and Sell Stock', 'Word Break', 'Number of Islands',
    'Find Median from Data Stream', 'LRU Cache', 'Sliding Window Maximum',
  ],
  'tower-research': [
    'Two Sum', 'Trapping Rain Water', 'Best Time to Buy and Sell Stock',
    'Maximum Subarray', 'Sliding Window Maximum', 'LRU Cache',
    'Longest Substring Without Repeating Characters', 'Number of Islands',
  ],
};

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

// Fetch all problems once.
const { data: problems, error: pErr } = await sb.from('PGcode_problems').select('id,name,difficulty');
if (pErr) { console.error(pErr); process.exit(1); }
const byNorm = new Map();
for (const p of problems) byNorm.set(norm(p.name), p);
console.log(`Loaded ${problems.length} PGcode_problems.\n`);

function resolveNames(names) {
  const found = [];
  const missing = [];
  for (const n of names) {
    const p = byNorm.get(norm(n));
    if (p) found.push(p); else missing.push(n);
  }
  return { found, missing };
}

// ─── Topical lists (composite PK: list_slug + problem_id) ─────
for (const [slug, names] of Object.entries(TOPICAL_LISTS)) {
  const { found, missing } = resolveNames(names);
  console.log(`${slug.padEnd(12)}  matched ${found.length}/${names.length} (missing ${missing.length})`);
  if (DRY) continue;
  const rows = found.map((p, i) => ({ list_slug: slug, problem_id: p.id, position: i + 1 }));
  if (rows.length) {
    const { error } = await sb.from('PGcode_list_problems').upsert(rows, { onConflict: 'list_slug,problem_id' });
    if (error) console.log(`  upsert error: ${error.message}`);
  }
}

// ─── Company-problem mappings (composite PK: company_slug + problem_id + role) ─
console.log('\n--- companies ---');
let totalCompanyLinks = 0;
for (const [slug, names] of Object.entries(COMPANY_PROBLEMS)) {
  if (!names.length) continue;
  const { found, missing } = resolveNames(names);
  console.log(`${slug.padEnd(16)}  matched ${found.length}/${names.length} (missing ${missing.length})`);
  if (DRY) continue;
  const rows = found.map(p => ({
    company_slug: slug,
    problem_id: p.id,
    frequency_score: 80,
    role: 'sde',
  }));
  if (rows.length) {
    const { error } = await sb.from('PGcode_company_problems').upsert(rows, { onConflict: 'company_slug,problem_id,role' });
    if (error) console.log(`  upsert error: ${error.message}`);
    else totalCompanyLinks += rows.length;
  }
}

console.log(`\n✓ Done. ~${totalCompanyLinks} company-problem rows inserted/updated.`);
