#!/usr/bin/env node
// Ingest the public LeetCode problem-rating dataset into PGcode_lc_questions.
// Idempotent: upsert on title_slug, so re-running refreshes ratings.
//
// Requires migrate-52-lc-questions.sql applied first.
// Loads VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.

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

const SRC = 'https://raw.githubusercontent.com/zerotrac/leetcode_problem_rating/main/ratings.txt';

// Rating → difficulty bands (community-standard split for LC contest ratings).
function difficultyOf(rating) {
  if (rating < 1600) return 'easy';
  if (rating < 2100) return 'medium';
  return 'hard';
}

// "weekly-contest-408" → "Weekly Contest 408"; "biweekly-contest-92" → "Biweekly Contest 92"
function contestLabel(slug) {
  if (!slug) return null;
  return slug.split('-').map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function main() {
  console.log('Fetching ratings dataset…');
  const res = await fetch(SRC);
  if (!res.ok) { console.error('Fetch failed', res.status); process.exit(1); }
  const text = await res.text();
  const lines = text.split('\n').filter(Boolean);
  lines.shift(); // header

  const rows = [];
  for (const line of lines) {
    const c = line.split('\t');
    if (c.length < 7) continue;
    const rating = parseFloat(c[0]);
    const questionId = parseInt(c[1], 10);
    const title = c[2];
    const titleSlug = c[4];
    const contestSlug = c[5];
    const problemIndex = c[6];
    if (!titleSlug || Number.isNaN(rating)) continue;
    rows.push({
      title_slug: titleSlug,
      question_id: Number.isNaN(questionId) ? null : questionId,
      title,
      rating: Math.round(rating * 10) / 10,
      contest_slug: contestSlug || null,
      contest_label: contestLabel(contestSlug),
      problem_index: problemIndex || null,
      difficulty: difficultyOf(rating),
    });
  }
  console.log(`Parsed ${rows.length} rated problems.`);

  let done = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb.from('PGcode_lc_questions').upsert(batch, { onConflict: 'title_slug' });
    if (error) { console.error('Upsert error', error.message); process.exit(1); }
    done += batch.length;
    console.log(`  upserted ${done}/${rows.length}`);
  }
  console.log('Done.');
}

main();
