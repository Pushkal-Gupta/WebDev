#!/usr/bin/env node
// Seed PGcode_roadmap_nodes for the Grind 75 sequence roadmap. Each week is a
// `section` milestone, followed by 9-10 `problem` nodes matched by name.

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
const DRY = process.argv.includes('--dry');

// Yangshun Tay's Grind 75 — 8-week sequence. Each entry: { title, problems[] }.
const GRIND_75 = [
  { title: 'Week 1 — Arrays, hashing, two pointers', problems: [
    'Two Sum', 'Valid Parentheses', 'Merge Two Sorted Lists', 'Best Time to Buy and Sell Stock',
    'Valid Palindrome', 'Invert Binary Tree', 'Valid Anagram', 'Binary Search',
    'Flood Fill', 'Lowest Common Ancestor of a Binary Search Tree',
  ]},
  { title: 'Week 2 — Search & sliding window', problems: [
    'Balanced Binary Tree', 'Linked List Cycle', 'Implement Queue using Stacks',
    'First Bad Version', 'Ransom Note', 'Climbing Stairs', 'Longest Palindrome',
    'Reverse Linked List', 'Majority Element', 'Add Binary',
  ]},
  { title: 'Week 3 — Trees & traversal', problems: [
    'Diameter of Binary Tree', 'Middle of the Linked List', 'Maximum Depth of Binary Tree',
    'Contains Duplicate', 'Maximum Subarray', 'Insert Interval',
    '01 Matrix', 'K Closest Points to Origin', '3Sum', 'Binary Tree Level Order Traversal',
  ]},
  { title: 'Week 4 — More trees, BFS, intervals', problems: [
    'Clone Graph', 'Evaluate Reverse Polish Notation', 'Course Schedule',
    'Implement Trie (Prefix Tree)', 'Coin Change', 'Product of Array Except Self',
    'Min Stack', 'Validate Binary Search Tree', 'Number of Islands', 'Rotting Oranges',
  ]},
  { title: 'Week 5 — Backtracking + DP basics', problems: [
    'Search in Rotated Sorted Array', 'Combination Sum', 'Permutations',
    'Merge Intervals', 'Lowest Common Ancestor of a Binary Tree',
    'Time Based Key-Value Store', 'Accounts Merge', 'Sort Colors',
    'Word Break', 'Partition Equal Subset Sum',
  ]},
  { title: 'Week 6 — Strings & advanced trees', problems: [
    'String to Integer (atoi)', 'Spiral Matrix', 'Subsets', 'Binary Tree Right Side View',
    'Longest Palindromic Substring', 'Unique Paths', 'Construct Binary Tree from Preorder and Inorder Traversal',
    'Container With Most Water', 'Letter Combinations of a Phone Number',
    'Word Search',
  ]},
  { title: 'Week 7 — Hard DP, heap, design', problems: [
    'Find All Anagrams in a String', 'Minimum Height Trees',
    'Task Scheduler', 'LRU Cache', 'Kth Smallest Element in a BST',
    'Daily Temperatures', 'House Robber', 'Gas Station',
    'Next Permutation', 'Valid Sudoku',
  ]},
  { title: 'Week 8 — Hardest, broad coverage', problems: [
    'Group Anagrams', 'Maximum Product Subarray', 'Design Add and Search Words Data Structure',
    'Pacific Atlantic Water Flow', 'Remove Nth Node From End of List',
    'Shortest Path in Binary Matrix', 'Combination Sum IV',
    'Find Median from Data Stream', 'Word Ladder', 'Basic Calculator',
  ]},
];

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

const { data: problems } = await sb.from('PGcode_problems').select('id,name');
const byNorm = new Map();
for (const p of problems) byNorm.set(norm(p.name), p);
console.log(`Loaded ${problems.length} problems.\n`);

const rows = [];
let position = 0;
let matched = 0, missing = 0;

for (const week of GRIND_75) {
  rows.push({
    roadmap_slug: 'grind-75', position: position++,
    node_type: 'section', ref_id: null, title: week.title, description: null,
  });
  for (const name of week.problems) {
    const p = byNorm.get(norm(name));
    if (p) {
      rows.push({
        roadmap_slug: 'grind-75', position: position++,
        node_type: 'problem', ref_id: p.id, title: p.name, description: null,
      });
      matched++;
    } else {
      console.log(`  miss: ${name}`);
      missing++;
    }
  }
}

console.log(`\n${matched} problems matched, ${missing} unmatched. ${rows.length} total rows.`);
if (DRY) process.exit(0);

// Wipe existing grind-75 rows then insert fresh (no upsert; insertion order matters).
await sb.from('PGcode_roadmap_nodes').delete().eq('roadmap_slug', 'grind-75');
const { error } = await sb.from('PGcode_roadmap_nodes').insert(rows);
if (error) { console.error(error.message); process.exit(1); }
console.log('Seeded.');
