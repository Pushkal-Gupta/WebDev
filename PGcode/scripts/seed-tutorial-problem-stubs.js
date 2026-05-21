#!/usr/bin/env node
// Fill the Tutorial gap: it has 506 problem items but only ~57 match real
// PGcode_problems rows. The other 449 show as "Lock · soon". This script
// generates skeleton problem rows for the missing names so the Tutorial
// becomes clickable. Each skeleton has a slug id, name, inferred topic_id,
// difficulty estimate, and a minimal description placeholder.
//
// Skeletons have NO test_cases / templates / leetcode_url — the solver opens
// in scratch mode (no auto-grading). Users can still write + run code.

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

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

// Heuristic topic-id inference from keywords in the item label.
function inferTopic(label) {
  const l = label.toLowerCase();
  if (/(linked\s*list|node|reverse list|cycle list)/.test(l)) return 'linkedlist';
  if (/(stack|monotonic stack|nge|previous greater)/.test(l)) return 'stack';
  if (/(queue|deque|dequeue|enqueue)/.test(l)) return 'queue';
  if (/(trie|prefix tree|autocomplete)/.test(l)) return 'tries';
  if (/(graph|dijkstra|topo|bellman|kruskal|prim|union find|disjoint|articulation|bridge|scc|mst)/.test(l)) return 'advanced-graphs';
  if (/(bfs|dfs|island|connected components|matrix island|word ladder)/.test(l)) return 'graphs';
  if (/(tree|binary tree|bst|inorder|preorder|postorder|level order|lca|ancestor|leaf)/.test(l)) return 'trees';
  if (/(heap|priority|kth largest|kth smallest|merge k|median stream)/.test(l)) return 'heap';
  if (/(palindrome|anagram|substring|character|atoi|reverse string|valid parentheses)/.test(l)) return 'strings';
  if (/(window|substring|longest k|fruit|max consecutive|min in window)/.test(l)) return 'sliding-window';
  if (/(two pointer|3sum|4sum|container|trap rain|sort colors)/.test(l)) return 'two-pointers';
  if (/(binary search|find peak|search in rotated|sqrt|koko|allocate|painter)/.test(l)) return 'binary-search';
  if (/(backtrack|n.queen|sudoku|permutation|combination|subset|word search|generate parentheses|letter combination)/.test(l)) return 'backtracking';
  if (/(dp|knapsack|coin change|edit distance|longest common|matrix chain|partition|paint|stair|jump game|robber)/.test(l)) return 'dp';
  if (/(grid|2d dp|unique path|min path|maximal square|maximal rectangle)/.test(l)) return '2d-dp';
  if (/(greedy|interval|gas station|jump|jump game|huffman|reorganize)/.test(l)) return 'greedy';
  if (/(interval|merge interval|insert interval|meeting room)/.test(l)) return 'intervals';
  if (/(prime|factor|gcd|lcm|sieve|modular|power|fast pow|fibonacci|pascal|ugly|happy|armstrong|sqrt|pyramid|pattern|print)/.test(l)) return 'math';
  if (/(bit|xor|and|or|set bit|count bits|hamming|gray|single number)/.test(l)) return 'bit-manipulation';
  if (/(recursion|recursive|tower of hanoi|factorial)/.test(l)) return 'recursion';
  if (/(geometry|polygon|circle|rectangle|hollow|solid|diamond|butterfly|line)/.test(l)) return 'geometry';
  if (/(hash|set|map|frequency|count|duplicate|distinct|intersection|union)/.test(l)) return 'arrays';
  return 'arrays';
}

function inferDifficulty(label) {
  const l = label.toLowerCase();
  // simple "print / count / sum" intro patterns → Easy
  if (/(print|count|sum of|reverse a|gcd|prime|factorial|fibonacci|odd|even|leap|swap)/.test(l)) return 'Easy';
  // hard markers
  if (/(maximum|kth|median|matrix|cycle|topological|dijkstra|bellman|hard|trapping|skyline|wildcard|edit distance|word ladder ii|kmp)/.test(l)) return 'Hard';
  return 'Medium';
}

async function main() {
  const norm2id = new Map();
  const { data: existing } = await sb.from('PGcode_problems').select('id,name');
  for (const p of existing) norm2id.set(norm(p.name), p.id);

  // Extract all problem-kind labels from dsaTutorial.js
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'content', 'dsaTutorial.js'), 'utf8');
  const re = /kind:\s*'problem'[\s\S]*?label:\s*['"]([^'"]+)['"]/g;
  const labels = [...new Set([...src.matchAll(re)].map(m => m[1]))];

  // Filter to missing only
  const missing = labels.filter(l => !norm2id.has(norm(l)));
  console.log(`${labels.length} distinct problem labels in tutorial; ${missing.length} missing.`);

  // Build slug → name map, dedupe slugs
  const rows = [];
  const slugSeen = new Set();
  for (const label of missing) {
    let slug = slugify(label);
    if (!slug) continue;
    let i = 2;
    while (slugSeen.has(slug)) { slug = `${slugify(label)}-${i++}`; }
    slugSeen.add(slug);
    rows.push({
      id: slug,
      name: label,
      topic_id: inferTopic(label),
      difficulty: inferDifficulty(label),
      description: `<p>${label} — open the solver to write and run code. Detailed prompt + test cases coming soon.</p>`,
      roadmap_set: '500',
    });
  }

  console.log(`Will upsert ${rows.length} skeleton rows.`);
  if (DRY) {
    console.log('Sample rows:', rows.slice(0, 5));
    return;
  }
  // Chunk to avoid payload limits
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await sb.from('PGcode_problems').upsert(chunk, { onConflict: 'id' });
    if (error) { console.error('error chunk', i, error.message); process.exit(1); }
    process.stdout.write(`.`);
  }
  console.log(`\nUpserted ${rows.length} skeleton problems.`);
}

await main();
