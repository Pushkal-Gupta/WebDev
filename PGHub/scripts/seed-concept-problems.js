#!/usr/bin/env node
// Seed PGcode_concept_problems by mapping each published concept to a curated
// list of canonical LeetCode problems. Names matched case/punct-insensitive
// against PGcode_problems.name.

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

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry');
if (!URL || !KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(URL, KEY);

const MAP = {
  'binary-search': [
    'Binary Search', 'Search Insert Position', 'Find First and Last Position of Element in Sorted Array',
    'Search in Rotated Sorted Array', 'Find Minimum in Rotated Sorted Array', 'Find Peak Element',
    'Sqrt(x)', 'Koko Eating Bananas',
  ],
  'bfs-dfs': [
    'Number of Islands', 'Clone Graph', 'Course Schedule', 'Word Ladder',
    'Surrounded Regions', 'Pacific Atlantic Water Flow', 'Max Area of Island',
    'Rotting Oranges', 'Walls and Gates',
  ],
  'two-pointers': [
    '3Sum', 'Container With Most Water', 'Trapping Rain Water', 'Move Zeroes',
    'Remove Duplicates from Sorted Array', 'Valid Palindrome', 'Two Sum II - Input Array Is Sorted',
    'Sort Colors',
  ],
  'sliding-window': [
    'Longest Substring Without Repeating Characters', 'Minimum Window Substring',
    'Sliding Window Maximum', 'Permutation in String', 'Find All Anagrams in a String',
    'Longest Repeating Character Replacement', 'Best Time to Buy and Sell Stock',
  ],
  'kadanes-algorithm': [
    'Maximum Subarray', 'Maximum Product Subarray', 'Best Time to Buy and Sell Stock',
    'Maximum Sum Circular Subarray',
  ],
  'loop-detection': [
    'Linked List Cycle', 'Linked List Cycle II', 'Find the Duplicate Number',
    'Happy Number',
  ],
  'dijkstras-algorithm': [
    'Network Delay Time', 'Cheapest Flights Within K Stops', 'Path with Maximum Probability',
    'Swim in Rising Water', 'Path With Minimum Effort',
  ],
  'bellman-ford': [
    'Network Delay Time', 'Cheapest Flights Within K Stops',
  ],
  'kruskals-mst': [
    'Min Cost to Connect All Points', 'Connecting Cities With Minimum Cost',
    'Optimize Water Distribution in a Village',
  ],
  'topological-sort': [
    'Course Schedule', 'Course Schedule II', 'Alien Dictionary', 'Find Eventual Safe States',
  ],
  'union-find': [
    'Number of Provinces', 'Graph Valid Tree', 'Number of Connected Components in an Undirected Graph',
    'Accounts Merge', 'Redundant Connection', 'Most Stones Removed with Same Row or Column',
  ],
  'trie': [
    'Implement Trie (Prefix Tree)', 'Add and Search Word - Data structure design',
    'Word Search II', 'Replace Words', 'Design Search Autocomplete System',
  ],
  'heap-sort': [
    'Kth Largest Element in an Array', 'Top K Frequent Elements', 'K Closest Points to Origin',
    'Find Median from Data Stream', 'Last Stone Weight', 'Merge k Sorted Lists',
  ],
  'min-stack': [
    'Min Stack', 'Maximum Frequency Stack', 'Online Stock Span', 'Daily Temperatures',
  ],
  'segment-tree': [
    'Range Sum Query - Mutable', 'Count of Smaller Numbers After Self',
    'Range Sum Query 2D - Mutable',
  ],
  'n-queens': [
    'N-Queens', 'N-Queens II', 'Sudoku Solver', 'Permutations', 'Combinations', 'Word Search',
  ],
  'huffman-coding': [
    'Last Stone Weight', 'Reorganize String',
  ],
  'manachers-algorithm': [
    'Longest Palindromic Substring', 'Palindromic Substrings', 'Longest Palindromic Subsequence',
  ],
  'boyer-moore-majority': [
    'Majority Element', 'Majority Element II',
  ],
  'euclidean-gcd': [
    'Greatest Common Divisor of Strings', 'Fraction to Recurring Decimal',
  ],
  'sieve-of-eratosthenes': [
    'Count Primes', 'Ugly Number II',
  ],
  'zero-one-knapsack': [
    'Partition Equal Subset Sum', 'Target Sum', 'Coin Change II', 'Last Stone Weight II',
    'Ones and Zeroes',
  ],
};

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

const { data: problems } = await sb.from('PGcode_problems').select('id,name');
const byNorm = new Map();
for (const p of problems) byNorm.set(norm(p.name), p);
console.log(`Loaded ${problems.length} problems.\n`);

let rows = [];
let totalMatched = 0, totalMissing = 0;
for (const [conceptSlug, names] of Object.entries(MAP)) {
  const found = [], missing = [];
  for (const n of names) {
    const p = byNorm.get(norm(n));
    if (p) found.push(p); else missing.push(n);
  }
  totalMatched += found.length;
  totalMissing += missing.length;
  console.log(`${conceptSlug.padEnd(22)}  ${found.length}/${names.length} matched`);
  if (missing.length) missing.forEach(m => console.log(`    miss: ${m}`));
  found.forEach((p, i) => rows.push({ concept_slug: conceptSlug, problem_id: p.id, position: i + 1 }));
}

console.log(`\n${totalMatched} concept-problem rows ready (${totalMissing} unmatched).`);
if (DRY) process.exit(0);

const { error } = await sb.from('PGcode_concept_problems').upsert(rows, { onConflict: 'concept_slug,problem_id' });
if (error) { console.error('upsert error:', error.message); process.exit(1); }
console.log('Upserted.');
