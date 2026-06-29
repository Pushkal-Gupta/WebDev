#!/usr/bin/env node
// Batch 3: 20 more virtual contests across every topic + themed/difficulty rounds,
// pulled from the live catalog. Idempotent (deterministic pick + upsert on slug).

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

function pick(arr, n, salt) {
  const out = arr.slice();
  let seed = 0;
  for (const c of salt) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n);
}

async function idsBy(topics, difficulties) {
  const { data, error } = await sb
    .from('PGcode_problems')
    .select('id, topic_id, difficulty')
    .not('method_name', 'is', null)
    .in('topic_id', topics)
    .in('difficulty', difficulties);
  if (error) { console.error('Catalog query error:', error.message); return []; }
  return (data || []).map(r => r.id);
}

const POINTS_BY_DIFF = { Easy: 100, Medium: 250, Hard: 450 };
async function pointMap(ids) {
  if (!ids.length) return {};
  const { data } = await sb.from('PGcode_problems').select('id, difficulty').in('id', ids);
  const map = {};
  for (const r of data || []) map[r.id] = POINTS_BY_DIFF[r.difficulty] || 200;
  return map;
}

const ALL = ['Easy', 'Medium', 'Hard'];
const CONTESTS = [
  { slug: 'dp-gauntlet', name: 'DP Gauntlet', description: 'A 24-problem run through dynamic programming — memoization, tabulation, and the classic state-transition patterns.', duration_minutes: 150, difficulty: 'Advanced', is_featured: true, position: 13, pickN: 24, topics: ['dp', '2d-dp'], difficulties: ALL },
  { slug: 'graph-odyssey', name: 'Graph Odyssey', description: 'Traverse 24 graph problems — BFS/DFS, shortest paths, connectivity, and the advanced graph toolkit.', duration_minutes: 150, difficulty: 'Advanced', is_featured: true, position: 14, pickN: 24, topics: ['graphs', 'advanced-graphs'], difficulties: ALL },
  { slug: 'greedy-grind', name: 'Greedy Grind', description: '22 greedy and interval-scheduling problems. Make the locally optimal choice — and prove it works.', duration_minutes: 120, difficulty: 'Intermediate', is_featured: false, position: 15, pickN: 22, topics: ['greedy', 'intervals'], difficulties: ALL },
  { slug: 'stack-queue-rumble', name: 'Stack & Queue Rumble', description: '22 LIFO/FIFO problems — monotonic stacks, expression parsing, and queue-driven simulations.', duration_minutes: 120, difficulty: 'Intermediate', is_featured: false, position: 16, pickN: 22, topics: ['stack', 'queue'], difficulties: ALL },
  { slug: 'backtracking-bonanza', name: 'Backtracking Bonanza', description: '20 search-and-prune problems — permutations, combinations, subsets, and constraint puzzles.', duration_minutes: 130, difficulty: 'Advanced', is_featured: true, position: 17, pickN: 20, topics: ['backtracking', 'recursion'], difficulties: ALL },
  { slug: 'tree-traversal-trials', name: 'Tree Traversal Trials', description: '21 binary-tree and BST problems — traversals, path sums, ancestors, and reconstruction.', duration_minutes: 120, difficulty: 'Intermediate', is_featured: false, position: 18, pickN: 21, topics: ['trees'], difficulties: ALL },
  { slug: 'bit-manipulation-bash', name: 'Bit Manipulation Bash', description: '20 bitwise brain-teasers — masks, XOR tricks, and counting set bits at speed.', duration_minutes: 100, difficulty: 'Intermediate', is_featured: false, position: 19, pickN: 20, topics: ['bit-manipulation'], difficulties: ALL },
  { slug: 'sliding-window-sprint', name: 'Sliding Window Sprint', description: '20 fixed- and variable-window problems. Expand, contract, and track the invariant.', duration_minutes: 100, difficulty: 'Intermediate', is_featured: false, position: 20, pickN: 20, topics: ['sliding-window'], difficulties: ALL },
  { slug: 'trie-and-text', name: 'Trie & Text', description: '20 trie and string problems — prefix trees, autocomplete, and pattern matching.', duration_minutes: 120, difficulty: 'Advanced', is_featured: false, position: 21, pickN: 20, topics: ['tries', 'strings'], difficulties: ALL },
  { slug: 'geometry-grand-prix', name: 'Geometry Grand Prix', description: '20 computational-geometry and coordinate-math problems — points, lines, and areas.', duration_minutes: 120, difficulty: 'Advanced', is_featured: false, position: 22, pickN: 20, topics: ['geometry', 'math'], difficulties: ALL },
  { slug: 'intervals-invitational', name: 'Intervals Invitational', description: '18 interval problems — merging, scheduling, and sweep-line thinking.', duration_minutes: 100, difficulty: 'Intermediate', is_featured: false, position: 23, pickN: 18, topics: ['intervals'], difficulties: ALL },
  { slug: 'matrix-dp-marathon', name: 'Matrix DP Marathon', description: '20 grid and 2D-DP problems — paths, regions, and table-filling on matrices.', duration_minutes: 140, difficulty: 'Advanced', is_featured: true, position: 24, pickN: 20, topics: ['2d-dp', 'dp'], difficulties: ['Medium', 'Hard'] },
  { slug: 'advanced-graphs-arena', name: 'Advanced Graphs Arena', description: '20 hard graph problems — MST, SCC, max-flow, and shortest-path variants.', duration_minutes: 150, difficulty: 'Advanced', is_featured: true, position: 25, pickN: 20, topics: ['advanced-graphs'], difficulties: ['Medium', 'Hard'] },
  { slug: 'arrays-all-stars', name: 'Arrays All-Stars', description: '25 array problems — prefix sums, in-place tricks, and the patterns every interview leans on.', duration_minutes: 140, difficulty: 'Mixed', is_featured: false, position: 26, pickN: 25, topics: ['arrays'], difficulties: ALL },
  { slug: 'beginner-bootcamp', name: 'Beginner Bootcamp', description: '20 Easy problems across arrays, strings, and math — your on-ramp to competitive practice.', duration_minutes: 90, difficulty: 'Beginner', is_featured: true, position: 27, pickN: 20, topics: ['arrays', 'strings', 'math'], difficulties: ['Easy'] },
  { slug: 'hard-mode-marathon', name: 'Hard Mode Marathon', description: '18 Hard-only problems spanning DP, graphs, and advanced structures. For the fearless.', duration_minutes: 180, difficulty: 'Advanced', is_featured: true, position: 28, pickN: 18, topics: ['dp', 'graphs', 'advanced-graphs', '2d-dp'], difficulties: ['Hard'] },
  { slug: 'speed-round-sprint', name: 'Speed Round Sprint', description: '15 quick Easy/Medium problems in 45 minutes. Pure pattern-recognition velocity.', duration_minutes: 45, difficulty: 'Intermediate', is_featured: false, position: 29, pickN: 15, topics: ['arrays', 'strings', 'two-pointers', 'math'], difficulties: ['Easy', 'Medium'] },
  { slug: 'interview-warmup', name: 'Interview Warm-Up', description: '20 Medium staples that show up in real interviews — arrays, strings, hashing, and pointers.', duration_minutes: 120, difficulty: 'Intermediate', is_featured: true, position: 30, pickN: 20, topics: ['arrays', 'strings', 'two-pointers', 'binary-search'], difficulties: ['Medium'] },
  { slug: 'heap-and-greedy-duel', name: 'Heap & Greedy Duel', description: '20 problems where a priority queue or a greedy invariant cracks it open.', duration_minutes: 120, difficulty: 'Advanced', is_featured: false, position: 31, pickN: 20, topics: ['heap', 'greedy'], difficulties: ['Medium', 'Hard'] },
  { slug: 'the-grand-mix', name: 'The Grand Mix', description: '30 problems drawn from every corner of the catalog — the championship gauntlet.', duration_minutes: 180, difficulty: 'Mixed', is_featured: true, position: 32, pickN: 30, topics: ['arrays', 'dp', 'graphs', 'strings', 'greedy', 'trees', 'heap', 'backtracking', 'binary-search'], difficulties: ALL },
];

const now = new Date();
let contestsSeeded = 0, problemsSeeded = 0;

for (const c of CONTESTS) {
  const candidates = await idsBy(c.topics, c.difficulties);
  if (candidates.length === 0) { console.error(`  ${c.slug}: no candidates`); continue; }
  const chosen = pick(candidates, Math.min(c.pickN, candidates.length), c.slug);
  const points = await pointMap(chosen);
  const contestRow = {
    slug: c.slug, name: c.name, description: c.description,
    duration_minutes: c.duration_minutes,
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + 60 * 86400000).toISOString(),
    difficulty: c.difficulty, is_featured: c.is_featured, position: c.position,
  };
  const { error: cErr } = await sb.from('PGcode_contests').upsert(contestRow, { onConflict: 'slug' });
  if (cErr) { console.error(`  ERROR ${c.slug}: ${cErr.message}`); continue; }
  contestsSeeded += 1;
  const linkRows = chosen.map((pid, i) => ({ contest_slug: c.slug, problem_id: pid, position: i + 1, points: points[pid] || 200 }));
  if (linkRows.length) {
    const { error: lErr } = await sb.from('PGcode_contest_problems').upsert(linkRows, { onConflict: 'contest_slug,problem_id' });
    if (lErr) { console.error(`  link error ${c.slug}: ${lErr.message}`); continue; }
    problemsSeeded += linkRows.length;
  }
  console.log(`  ${c.slug}  - ${linkRows.length} problems (${c.difficulty}, ${c.duration_minutes}m)`);
}
console.log(`\nDone. ${contestsSeeded} contests, ${problemsSeeded} problem links.`);
