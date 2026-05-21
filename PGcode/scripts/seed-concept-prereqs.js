#!/usr/bin/env node
// Seed PGcode_concept_prereqs so each concept page can show "Before this, learn X".

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

// Pairs of (concept_slug, requires_slug). Order = recommended visit order.
const PREREQS = [
  ['sliding-window',       'two-pointers'],
  ['topological-sort',     'bfs-dfs'],
  ['kruskals-mst',         'union-find'],
  ['dijkstras-algorithm',  'bfs-dfs'],
  ['bellman-ford',         'dijkstras-algorithm'],
  ['loop-detection',       'two-pointers'],
  ['huffman-coding',       'heap-sort'],
  // Second batch — push the graph deeper
  ['segment-tree',         'binary-search'],
  ['n-queens',             'bfs-dfs'],          // backtracking uses DFS frame
  ['zero-one-knapsack',    'kadanes-algorithm'], // intro DP linearity
  ['manachers-algorithm',  'sliding-window'],
  ['trie',                 'bfs-dfs'],
  ['kadanes-algorithm',    'two-pointers'],
  ['heap-sort',            'binary-search'],     // logn pre-requisite framing
  ['sieve-of-eratosthenes','euclidean-gcd'],
];

const rows = PREREQS.map(([concept_slug, requires_slug]) => ({ concept_slug, requires_slug }));
console.log(`${rows.length} prereq rows to upsert.`);
if (DRY) { console.log(rows); process.exit(0); }

const { error } = await sb.from('PGcode_concept_prereqs').upsert(rows, { onConflict: 'concept_slug,requires_slug' });
if (error) { console.error(error.message); process.exit(1); }
console.log('Upserted.');
