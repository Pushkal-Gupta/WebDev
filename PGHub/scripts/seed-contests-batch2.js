#!/usr/bin/env node
// Batch 2: Seed 6 additional virtual contests with 20-25 problems each,
// pulled from the live catalog by topic + difficulty filters.

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

// Deterministic shuffle so re-runs link the same problems (idempotent feel).
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
  if (error) {
    console.error('Catalog query error:', error.message);
    return [];
  }
  return (data || []).map(r => r.id);
}

const POINTS_BY_DIFF = { Easy: 100, Medium: 250, Hard: 450 };

async function pointMap(ids) {
  if (!ids.length) return {};
  const { data } = await sb
    .from('PGcode_problems')
    .select('id, difficulty')
    .in('id', ids);
  const map = {};
  for (const r of data || []) map[r.id] = POINTS_BY_DIFF[r.difficulty] || 200;
  return map;
}

const CONTESTS = [
  {
    slug: 'binary-search-blitz',
    name: 'Binary Search Blitz',
    description: 'Sharpen your search instincts across 22 binary-search and divide-and-conquer puzzles.',
    duration_minutes: 120,
    difficulty: 'Intermediate',
    is_featured: true,
    position: 7,
    pickN: 22,
    topics: ['binary-search', 'arrays'],
    difficulties: ['Easy', 'Medium', 'Hard'],
  },
  {
    slug: 'two-pointer-tournament',
    name: 'Two-Pointer Tournament',
    description: '20 two-pointer and sliding-window classics. Master the art of converging indices.',
    duration_minutes: 110,
    difficulty: 'Intermediate',
    is_featured: true,
    position: 8,
    pickN: 20,
    topics: ['two-pointers', 'sliding-window'],
    difficulties: ['Easy', 'Medium', 'Hard'],
  },
  {
    slug: 'string-master',
    name: 'String Master',
    description: '23 string-manipulation and trie problems. From parsing to pattern matching.',
    duration_minutes: 130,
    difficulty: 'Mixed',
    is_featured: false,
    position: 9,
    pickN: 23,
    topics: ['strings', 'tries'],
    difficulties: ['Easy', 'Medium', 'Hard'],
  },
  {
    slug: 'linked-list-night',
    name: 'Linked List Night',
    description: '20 pointer-juggling problems on singly and doubly linked lists.',
    duration_minutes: 100,
    difficulty: 'Beginner',
    is_featured: false,
    position: 10,
    pickN: 20,
    topics: ['linkedlist'],
    difficulties: ['Easy', 'Medium', 'Hard'],
  },
  {
    slug: 'heap-haven',
    name: 'Heap Haven',
    description: '21 heap, priority-queue, and top-k problems. A guided tour through the priority heap.',
    duration_minutes: 110,
    difficulty: 'Advanced',
    is_featured: true,
    position: 11,
    pickN: 21,
    topics: ['heap', 'queue'],
    difficulties: ['Easy', 'Medium', 'Hard'],
  },
  {
    slug: 'math-mayhem',
    name: 'Math Mayhem',
    description: '25 math, bit-manipulation, and geometry brain-teasers. Pure problem-solving stamina.',
    duration_minutes: 150,
    difficulty: 'Mixed',
    is_featured: false,
    position: 12,
    pickN: 25,
    topics: ['math', 'bit-manipulation', 'geometry'],
    difficulties: ['Easy', 'Medium', 'Hard'],
  },
];

const now = new Date();
const tomorrow = new Date(now.getTime() + 86400000);

let contestsSeeded = 0;
let problemsSeeded = 0;

for (const c of CONTESTS) {
  const candidates = await idsBy(c.topics, c.difficulties);
  if (candidates.length === 0) {
    console.error(`  ${c.slug}: no candidates found for topics ${c.topics.join(',')}`);
    continue;
  }

  const chosen = pick(candidates, Math.min(c.pickN, candidates.length), c.slug);
  const points = await pointMap(chosen);

  const contestRow = {
    slug: c.slug,
    name: c.name,
    description: c.description,
    duration_minutes: c.duration_minutes,
    starts_at: now.toISOString(),
    ends_at: new Date(tomorrow.getTime() + 30 * 86400000).toISOString(),
    difficulty: c.difficulty,
    is_featured: c.is_featured,
    position: c.position,
  };
  const { error: cErr } = await sb.from('PGcode_contests').upsert(contestRow, { onConflict: 'slug' });
  if (cErr) { console.error(`  ERROR ${c.slug}: ${cErr.message}`); continue; }
  contestsSeeded += 1;

  const linkRows = chosen.map((pid, i) => ({
    contest_slug: c.slug,
    problem_id: pid,
    position: i + 1,
    points: points[pid] || 200,
  }));

  if (linkRows.length > 0) {
    const { error: lErr } = await sb.from('PGcode_contest_problems').upsert(linkRows, { onConflict: 'contest_slug,problem_id' });
    if (lErr) { console.error(`  problem link error for ${c.slug}: ${lErr.message}`); continue; }
    problemsSeeded += linkRows.length;
  }

  console.log(`  ${c.slug}  - ${linkRows.length} problems linked (${c.difficulty}, ${c.duration_minutes}m)`);
}

console.log(`\nDone. ${contestsSeeded} contests, ${problemsSeeded} problem links.`);
