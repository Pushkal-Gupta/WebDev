#!/usr/bin/env node
// Seed the Blind 75 list mapping by matching canonical problem names to
// PGcode_problems.name. Idempotent: re-running upserts.
//
// Usage:
//   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-blind-75.js
//   (or pass --dry to preview without writing)

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const DRY = process.argv.includes('--dry');
const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY && (!URL || !KEY)) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --dry to preview.');
  process.exit(1);
}

// The canonical Blind 75 list (Yangshun Tay). We match against problem names
// (case-insensitive, ignoring punctuation) so the same script works whether
// your problems are named "Two Sum" or "two-sum".
const BLIND_75 = [
  // Arrays & Hashing (9)
  'Two Sum',
  'Best Time to Buy and Sell Stock',
  'Contains Duplicate',
  'Product of Array Except Self',
  'Maximum Subarray',
  'Maximum Product Subarray',
  'Find Minimum in Rotated Sorted Array',
  'Search in Rotated Sorted Array',
  '3Sum',
  'Container With Most Water',

  // Binary (5)
  'Sum of Two Integers',
  'Number of 1 Bits',
  'Counting Bits',
  'Missing Number',
  'Reverse Bits',

  // Dynamic Programming (11)
  'Climbing Stairs',
  'Coin Change',
  'Longest Increasing Subsequence',
  'Longest Common Subsequence',
  'Word Break',
  'Combination Sum',
  'House Robber',
  'House Robber II',
  'Decode Ways',
  'Unique Paths',
  'Jump Game',

  // Graph (8)
  'Clone Graph',
  'Course Schedule',
  'Pacific Atlantic Water Flow',
  'Number of Islands',
  'Longest Consecutive Sequence',
  'Alien Dictionary',
  'Graph Valid Tree',
  'Number of Connected Components in an Undirected Graph',

  // Interval (5)
  'Insert Interval',
  'Merge Intervals',
  'Non-overlapping Intervals',
  'Meeting Rooms',
  'Meeting Rooms II',

  // Linked List (6)
  'Reverse Linked List',
  'Linked List Cycle',
  'Merge Two Sorted Lists',
  'Merge k Sorted Lists',
  'Remove Nth Node From End of List',
  'Reorder List',

  // Matrix (4)
  'Set Matrix Zeroes',
  'Spiral Matrix',
  'Rotate Image',
  'Word Search',

  // String (10)
  'Longest Substring Without Repeating Characters',
  'Longest Repeating Character Replacement',
  'Minimum Window Substring',
  'Valid Anagram',
  'Group Anagrams',
  'Valid Parentheses',
  'Valid Palindrome',
  'Longest Palindromic Substring',
  'Palindromic Substrings',
  'Encode and Decode Strings',

  // Tree (14)
  'Maximum Depth of Binary Tree',
  'Same Tree',
  'Invert Binary Tree',
  'Binary Tree Maximum Path Sum',
  'Binary Tree Level Order Traversal',
  'Serialize and Deserialize Binary Tree',
  'Subtree of Another Tree',
  'Construct Binary Tree from Preorder and Inorder Traversal',
  'Validate Binary Search Tree',
  'Kth Smallest Element in a BST',
  'Lowest Common Ancestor of a Binary Search Tree',
  'Implement Trie (Prefix Tree)',
  'Add and Search Word - Data structure design',
  'Word Search II',

  // Heap (3)
  'Top K Frequent Elements',
  'Find Median from Data Stream',
  'Merge k Sorted Lists',  // intentional dup with Linked List section
];

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

async function main() {
  if (DRY) {
    console.log(`--dry run: ${BLIND_75.length} canonical names.`);
    BLIND_75.forEach((n, i) => console.log(`  ${(i + 1).toString().padStart(2)}. ${n}  →  match key "${normalize(n)}"`));
    console.log('\nNo write performed.');
    return;
  }

  const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

  // Pull all problems with their names + ids
  const { data: problems, error: e1 } = await supabase
    .from('PGcode_problems')
    .select('id, name');
  if (e1) { console.error('Fetch problems failed:', e1); process.exit(1); }

  const byNorm = new Map();
  (problems || []).forEach(p => byNorm.set(normalize(p.name), p));

  const seen = new Set();
  const rows = [];
  const misses = [];
  BLIND_75.forEach((name, i) => {
    const key = normalize(name);
    const p = byNorm.get(key);
    if (!p || seen.has(p.id)) {
      if (!p) misses.push(name);
      return;
    }
    seen.add(p.id);
    rows.push({ list_slug: 'blind-75', problem_id: p.id, position: i });
  });

  console.log(`Matched ${rows.length} / ${BLIND_75.length} Blind 75 problems against your dataset.`);
  if (misses.length > 0) {
    console.log(`\nUnmatched (no PGcode_problems row with a name like these):`);
    misses.forEach(n => console.log(`  - ${n}`));
    console.log('\nAdd them to PGcode_problems (with matching names) and re-run, or edit BLIND_75 in this file.');
  }

  if (rows.length === 0) {
    console.log('\nNothing to insert.');
    return;
  }

  // Idempotent reset
  await supabase.from('PGcode_list_problems').delete().eq('list_slug', 'blind-75');
  const { error: e2 } = await supabase.from('PGcode_list_problems').insert(rows);
  if (e2) { console.error('Insert failed:', e2); process.exit(1); }

  await supabase.from('PGcode_lists').update({ problem_count: rows.length }).eq('slug', 'blind-75');

  console.log(`\n✓ Inserted ${rows.length} PGcode_list_problems rows for blind-75.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
