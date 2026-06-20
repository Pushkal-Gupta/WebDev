#!/usr/bin/env node
// Re-assign topic_id for LeetCode-imported problems using an improved tag
// priority list. The original importer used "first tag wins" which dumped
// 60% of problems into 'arrays' because LC often lists 'array' or 'hash-table'
// first even when the real topic is dp / graph / sliding-window etc.
//
// Improvement: a single sorted priority list. Walk it in order and the first
// tag the problem has wins. 'arrays' / 'strings' / 'math' are at the bottom
// (catch-all). Specific topics (sliding-window, two-pointers, dp) win.

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
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) { console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, SVC);

const LC_TAG_PRIORITY = [
  ['sliding-window', 'sliding-window'],
  ['two-pointers', 'two-pointers'],
  ['binary-search', 'binary-search'],
  ['monotonic-stack', 'stack'],
  ['monotonic-queue', 'queue'],
  ['stack', 'stack'],
  ['queue', 'queue'],
  ['heap-priority-queue', 'heap'],
  ['trie', 'tries'],
  ['union-find', 'graphs'],
  ['shortest-path', 'advanced-graphs'],
  ['strongly-connected-component', 'advanced-graphs'],
  ['topological-sort', 'advanced-graphs'],
  ['eulerian-circuit', 'advanced-graphs'],
  ['minimum-spanning-tree', 'advanced-graphs'],
  ['biconnected-component', 'advanced-graphs'],
  ['depth-first-search', 'graphs'],
  ['breadth-first-search', 'graphs'],
  ['graph', 'graphs'],
  ['binary-tree', 'trees'],
  ['binary-search-tree', 'trees'],
  ['tree', 'trees'],
  ['segment-tree', 'trees'],
  ['binary-indexed-tree', 'arrays'],
  ['dynamic-programming', 'dp'],
  ['memoization', 'dp'],
  ['backtracking', 'backtracking'],
  ['recursion', 'recursion'],
  ['greedy', 'greedy'],
  ['bit-manipulation', 'bit-manipulation'],
  ['bitmask', 'bit-manipulation'],
  ['linked-list', 'linkedlist'],
  ['doubly-linked-list', 'linkedlist'],
  ['interval', 'intervals'],
  ['geometry', 'geometry'],
  ['divide-and-conquer', 'binary-search'],
  ['number-theory', 'math'],
  ['combinatorics', 'math'],
  ['probability-and-statistics', 'math'],
  ['game-theory', 'math'],
  ['rolling-hash', 'strings'],
  ['suffix-array', 'strings'],
  ['string-matching', 'strings'],
  ['matrix', 'arrays'],
  ['array', 'arrays'],
  ['string', 'strings'],
  ['hash-table', 'arrays'],
  ['math', 'math'],
  ['sorting', 'arrays'],
  ['counting', 'arrays'],
  ['simulation', 'arrays'],
  ['design', 'arrays'],
];

function pickTopic(tags) {
  if (!Array.isArray(tags) || !tags.length) return 'arrays';
  const tagSet = new Set(tags);
  for (const [tag, topic] of LC_TAG_PRIORITY) {
    if (tagSet.has(tag)) return topic;
  }
  return 'arrays';
}

const OUT_DIR = path.join(__dirname, '..', 'content', 'leetcode');
const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.json') && f !== '_index.json');
console.log(`Re-categorizing ${files.length} scraped problems...`);

const updates = [];
for (const f of files) {
  const blob = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8'));
  const topic = pickTopic(blob.tags);
  updates.push({ id: blob.slug, topic_id: topic });
}

// Pull existing rows to skip flagships (which had manually-curated topic_ids).
// We treat "flagship" as "row has solutions populated".
const protected_ids = new Set();
{
  let page = 0;
  while (true) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id, solutions, method_name')
      .not('solutions', 'is', null)
      .range(page * 1000, page * 1000 + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data?.length) break;
    for (const r of data) {
      if (r.solutions && Object.keys(r.solutions).length > 0) protected_ids.add(r.id);
      else if (r.method_name) protected_ids.add(r.id);
    }
    if (data.length < 1000) break;
    page++;
  }
}
console.log(`Protecting ${protected_ids.size} flagship rows.`);

const eligible = updates.filter(u => !protected_ids.has(u.id));
console.log(`Updating ${eligible.length} LC-imported rows (skipping protected flagships)...`);

// Batch update via individual UPDATEs (no native bulk-update with-different-values in Supabase JS).
let ok = 0, fail = 0;
for (let i = 0; i < eligible.length; i++) {
  const u = eligible[i];
  const { error } = await sb.from('PGcode_problems').update({ topic_id: u.topic_id }).eq('id', u.id);
  if (error) { fail++; if (fail < 5) console.log(`  ${u.id}: ${error.message.slice(0, 100)}`); }
  else ok++;
  if ((i + 1) % 200 === 0) console.log(`  ${i + 1}/${eligible.length}`);
}
console.log(`\nDone: ${ok} re-categorized, ${fail} failed.`);
