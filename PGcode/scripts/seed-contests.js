#!/usr/bin/env node
// Seed PGcode_contests + PGcode_contest_problems with 6 virtual contests.

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

const CONTESTS = [
  {
    slug: 'warmup-arrays',
    name: 'Warm-up: Arrays Sprint',
    description: '4 easy-to-medium array problems. Perfect for a 90-minute focused session.',
    duration_minutes: 90,
    difficulty: 'Beginner',
    is_featured: true,
    position: 1,
    problems: [
      ['two-sum', 100],
      ['best-time-to-buy-sell-stock', 150],
      ['merge-intervals', 200],
      ['max-product-subarray', 250],
    ],
  },
  {
    slug: 'sliding-window-attack',
    name: 'Sliding Window Attack',
    description: 'Four classic sliding-window problems. Patterns from easy to hard in 100 minutes.',
    duration_minutes: 100,
    difficulty: 'Intermediate',
    is_featured: true,
    position: 2,
    problems: [
      ['longest-substr-no-repeat', 150],
      ['sliding-window-maximum', 250],
      ['min-window-substring', 350],
      ['trapping-rain-water', 400],
    ],
  },
  {
    slug: 'graph-grind',
    name: 'Graph Grind',
    description: 'Topological sort, BFS, DFS, union-find. The full graph toolkit in 2 hours.',
    duration_minutes: 120,
    difficulty: 'Intermediate',
    is_featured: false,
    position: 3,
    problems: [
      ['number-of-islands', 150],
      ['course-schedule', 250],
      ['word-ladder', 350],
      ['evaluate-division', 400],
    ],
  },
  {
    slug: 'dp-marathon',
    name: 'DP Marathon',
    description: 'Five DP problems escalating from 1D to interval DP. Three-hour endurance round.',
    duration_minutes: 180,
    difficulty: 'Advanced',
    is_featured: true,
    position: 4,
    problems: [
      ['house-robber', 100],
      ['coin-change', 200],
      ['edit-distance', 300],
      ['regular-expression-matching', 450],
      ['burst-balloons', 500],
    ],
  },
  {
    slug: 'tree-tour',
    name: 'Tree Tour',
    description: 'BFS, DFS, BST validation, LCA, diameter. Trees in every angle.',
    duration_minutes: 90,
    difficulty: 'Intermediate',
    is_featured: false,
    position: 5,
    problems: [
      ['level-order-traversal', 100],
      ['validate-bst', 200],
      ['lowest-common-ancestor', 250],
      ['diameter-binary-tree', 300],
    ],
  },
  {
    slug: 'mock-faang-round',
    name: 'Mock FAANG Onsite (60 min)',
    description: 'Two-problem round mimicking a Google/Meta onsite slot. One medium, one hard.',
    duration_minutes: 60,
    difficulty: 'Advanced',
    is_featured: true,
    position: 6,
    problems: [
      ['lru-cache', 200],
      ['median-of-two-sorted-arrays', 400],
    ],
  },
];

const now = new Date();
const tomorrow = new Date(now.getTime() + 86400000);

let contestsSeeded = 0;
let problemsSeeded = 0;

const { data: existingProblems } = await sb.from('PGcode_problems').select('id').not('method_name', 'is', null);
const validIds = new Set((existingProblems || []).map(p => p.id));

for (const c of CONTESTS) {
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

  const linkRows = c.problems
    .filter(([pid]) => validIds.has(pid))
    .map(([pid, points], i) => ({
      contest_slug: c.slug,
      problem_id: pid,
      position: i + 1,
      points,
    }));

  if (linkRows.length > 0) {
    const { error: lErr } = await sb.from('PGcode_contest_problems').upsert(linkRows, { onConflict: 'contest_slug,problem_id' });
    if (lErr) { console.error(`  problem link error for ${c.slug}: ${lErr.message}`); continue; }
    problemsSeeded += linkRows.length;
  }

  console.log(`  ${c.slug}  - ${linkRows.length}/${c.problems.length} problems linked`);
}

console.log(`\nDone. ${contestsSeeded} contests, ${problemsSeeded} problem links.`);
