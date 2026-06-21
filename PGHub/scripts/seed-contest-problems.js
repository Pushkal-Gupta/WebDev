#!/usr/bin/env node
// Backfill PGcode_contest_problems for contests that were inserted as empty
// shells (no problem links). Each contest is mapped to a topic + difficulty
// filter and a target size derived from its description; the actual problems
// are pulled live from PGcode_problems and picked DETERMINISTICALLY via a
// mulberry32 PRNG seeded on the contest slug, so re-runs are stable.
//
// Idempotent: only INSERTS links that are missing. Never deletes/overwrites.
// Service-role key + URL come from .env (no secrets in source).

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

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}
const sb = createClient(url, key);

// --- deterministic PRNG (mulberry32, NEVER Math.random) ---------------------
function strSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Deterministic Fisher-Yates pick of n items, keyed on salt.
function pickDeterministic(arr, n, salt) {
  const out = arr.slice();
  const rnd = mulberry32(strSeed(salt));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, Math.min(n, out.length));
}

const POINTS_BY_DIFF = { Easy: 100, Medium: 250, Hard: 450 };

// The contests that exist in PGcode_contests but have no linked problems.
// Topics/difficulties/sizes follow each contest's own description.
const PLANS = [
  {
    slug: 'warmup-30',
    pickN: 4,
    topics: ['arrays', 'strings', 'math'],
    difficulties: ['Easy'],
  },
  {
    slug: 'arrays-sprint',
    pickN: 6,
    topics: ['arrays'],
    difficulties: ['Easy', 'Medium'],
  },
  {
    slug: 'dp-deep-dive',
    pickN: 5,
    topics: ['dp', '2d-dp'],
    difficulties: ['Medium', 'Hard'],
  },
  {
    slug: 'graphs-mock-oa',
    pickN: 5,
    topics: ['graphs', 'advanced-graphs'],
    difficulties: ['Easy', 'Medium', 'Hard'],
  },
  {
    slug: 'classic-interview',
    pickN: 5,
    topics: ['arrays', 'strings', 'two-pointers', 'stack'],
    difficulties: ['Easy', 'Medium'],
  },
  {
    slug: 'hard-grind',
    pickN: 3,
    topics: ['dp', 'graphs', 'binary-search', 'heap'],
    difficulties: ['Hard'],
  },
];

async function catalog(topics, difficulties) {
  // Paginate past PostgREST's 1000-row cap so the pool is COMPLETE and the
  // seeded shuffle is reproducible (an arbitrary capped slice would differ
  // between runs and break idempotency).
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, topic_id, difficulty')
      .not('method_name', 'is', null)
      .in('topic_id', topics)
      .in('difficulty', difficulties)
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) { console.error('  catalog error:', error.message); return []; }
    all.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  // Already id-ordered, but sort defensively so the pool is fully deterministic.
  return all.sort((a, b) => a.id.localeCompare(b.id));
}

let totalInserted = 0;

for (const plan of PLANS) {
  // Verify the contest exists; skip silently if not.
  const { data: contest } = await sb
    .from('PGcode_contests').select('slug').eq('slug', plan.slug).maybeSingle();
  if (!contest) { console.log(`  ${plan.slug}: contest row missing, skipped`); continue; }

  // Which links already exist? Idempotent: only add missing ones.
  const { data: existing } = await sb
    .from('PGcode_contest_problems').select('problem_id').eq('contest_slug', plan.slug);
  const have = new Set((existing || []).map(r => r.problem_id));

  const pool = await catalog(plan.topics, plan.difficulties);
  if (!pool.length) { console.log(`  ${plan.slug}: empty catalog for ${plan.topics.join('/')}`); continue; }

  const chosen = pickDeterministic(pool, plan.pickN, plan.slug);

  const rows = chosen
    .filter(p => !have.has(p.id))
    .map((p, i) => ({
      contest_slug: plan.slug,
      problem_id: p.id,
      position: have.size + i + 1,
      points: POINTS_BY_DIFF[p.difficulty] || 200,
    }));

  if (!rows.length) {
    console.log(`  ${plan.slug}: already has ${have.size} links, nothing to add`);
    continue;
  }

  const { error } = await sb
    .from('PGcode_contest_problems')
    .upsert(rows, { onConflict: 'contest_slug,problem_id', ignoreDuplicates: true });
  if (error) { console.error(`  ${plan.slug}: insert error: ${error.message}`); continue; }

  totalInserted += rows.length;
  console.log(`  ${plan.slug}: +${rows.length} links (target ${plan.pickN}, pool ${pool.length})`);
}

console.log(`\nDone. ${totalInserted} new problem links inserted.`);
