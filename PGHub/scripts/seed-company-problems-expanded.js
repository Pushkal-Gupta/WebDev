#!/usr/bin/env node
// Expand PGcode_company_problems so each company has a meaningful catalog.
// For every slug we pick favored topics + difficulty bands, pull a random slice
// of graded problems, and upsert with ON CONFLICT DO NOTHING via composite PK.

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

const TIERS = {
  faang: { target: 28 },
  big:   { target: 22 },
  mid:   { target: 14 },
  small: { target: 8 },
};

// company_slug → { tier, topics: [...], difficulties: [...] }
const PROFILES = {
  google:          { tier: 'faang', topics: ['arrays', 'dp', 'graphs', '2d-dp', 'strings', 'trees', 'backtracking'], difficulties: ['Medium', 'Hard'] },
  meta:            { tier: 'faang', topics: ['dp', 'two-pointers', 'trees', 'graphs', 'arrays', 'sliding-window', 'strings'], difficulties: ['Medium', 'Hard'] },
  amazon:          { tier: 'faang', topics: ['arrays', 'dp', 'trees', 'graphs', 'heap', 'strings', 'intervals'], difficulties: ['Medium', 'Hard'] },
  microsoft:       { tier: 'faang', topics: ['arrays', 'strings', 'linkedlist', 'trees', 'dp', 'backtracking', 'binary-search'], difficulties: ['Easy', 'Medium', 'Hard'] },
  apple:           { tier: 'faang', topics: ['arrays', 'strings', 'trees', 'dp', 'linkedlist', 'two-pointers', 'heap'], difficulties: ['Medium', 'Hard'] },
  netflix:         { tier: 'big',   topics: ['heap', 'intervals', 'sliding-window', 'dp', 'graphs', 'arrays'], difficulties: ['Medium', 'Hard'] },
  uber:            { tier: 'big',   topics: ['graphs', 'heap', 'arrays', 'intervals', 'trees', 'dp'], difficulties: ['Medium', 'Hard'] },
  bloomberg:       { tier: 'big',   topics: ['arrays', 'strings', 'stack', 'trees', 'linkedlist', 'heap'], difficulties: ['Easy', 'Medium'] },
  adobe:           { tier: 'big',   topics: ['arrays', 'strings', 'dp', 'trees', 'linkedlist', '2d-dp'], difficulties: ['Easy', 'Medium', 'Hard'] },
  atlassian:       { tier: 'big',   topics: ['arrays', 'strings', 'trees', 'graphs', 'intervals', 'dp'], difficulties: ['Medium', 'Hard'] },
  oracle:          { tier: 'big',   topics: ['arrays', 'strings', 'linkedlist', 'trees', 'stack', 'two-pointers'], difficulties: ['Easy', 'Medium'] },
  paypal:          { tier: 'mid',   topics: ['arrays', 'strings', 'trees', 'linkedlist', 'dp'], difficulties: ['Easy', 'Medium'] },
  intuit:          { tier: 'mid',   topics: ['arrays', 'strings', 'trees', 'dp', 'two-pointers'], difficulties: ['Easy', 'Medium'] },
  servicenow:      { tier: 'mid',   topics: ['arrays', 'strings', 'linkedlist', 'stack', 'trees'], difficulties: ['Easy', 'Medium'] },
  samsung:         { tier: 'mid',   topics: ['arrays', 'strings', 'recursion', 'backtracking', 'math'], difficulties: ['Easy', 'Medium'] },
  flipkart:        { tier: 'big',   topics: ['arrays', 'strings', 'trees', 'dp', 'graphs', 'sliding-window'], difficulties: ['Medium', 'Hard'] },
  swiggy:          { tier: 'mid',   topics: ['arrays', 'strings', 'trees', 'graphs', 'dp'], difficulties: ['Medium'] },
  zomato:          { tier: 'mid',   topics: ['arrays', 'strings', 'dp', 'trees', 'sliding-window'], difficulties: ['Medium'] },
  razorpay:        { tier: 'mid',   topics: ['arrays', 'strings', 'stack', 'trees', 'linkedlist'], difficulties: ['Easy', 'Medium'] },
  cred:            { tier: 'small', topics: ['arrays', 'strings', 'dp', 'trees'], difficulties: ['Medium'] },
  meesho:          { tier: 'small', topics: ['arrays', 'strings', 'trees', 'dp'], difficulties: ['Easy', 'Medium'] },
  walmart:         { tier: 'mid',   topics: ['arrays', 'strings', 'trees', 'dp', 'graphs'], difficulties: ['Medium', 'Hard'] },
  infosys:         { tier: 'small', topics: ['arrays', 'strings', 'math', 'recursion'], difficulties: ['Easy', 'Medium'] },
  tcs:             { tier: 'small', topics: ['arrays', 'strings', 'math', 'recursion'], difficulties: ['Easy', 'Medium'] },
  wipro:           { tier: 'small', topics: ['arrays', 'strings', 'math', 'recursion'], difficulties: ['Easy', 'Medium'] },
  zoho:            { tier: 'small', topics: ['arrays', 'strings', 'math', 'two-pointers'], difficulties: ['Easy', 'Medium'] },
  'goldman-sachs': { tier: 'big',   topics: ['arrays', 'math', 'dp', 'heap', 'intervals', 'binary-search'], difficulties: ['Medium', 'Hard'] },
  'de-shaw':       { tier: 'big',   topics: ['math', 'dp', 'heap', 'arrays', 'binary-search', 'recursion'], difficulties: ['Medium', 'Hard'] },
  'tower-research':{ tier: 'mid',   topics: ['math', 'dp', 'arrays', 'heap', 'sliding-window'], difficulties: ['Medium', 'Hard'] },
};

const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const { data: gradedProblems, error: probErr } = await sb
  .from('PGcode_problems')
  .select('id, topic_id, difficulty')
  .not('method_name', 'is', null);
if (probErr) {
  console.error('Failed loading problems:', probErr.message);
  process.exit(1);
}

const byTopicDiff = new Map();
for (const p of gradedProblems || []) {
  const key = `${p.topic_id}|${p.difficulty}`;
  if (!byTopicDiff.has(key)) byTopicDiff.set(key, []);
  byTopicDiff.get(key).push(p.id);
}

const { data: existingLinks } = await sb
  .from('PGcode_company_problems')
  .select('company_slug, problem_id');
const existing = new Map();
for (const row of existingLinks || []) {
  if (!existing.has(row.company_slug)) existing.set(row.company_slug, new Set());
  existing.get(row.company_slug).add(row.problem_id);
}

const rows = [];
let totalPlanned = 0;

for (const [slug, prof] of Object.entries(PROFILES)) {
  const target = TIERS[prof.tier].target;
  const have = existing.get(slug) || new Set();
  const need = Math.max(0, target - have.size);
  if (need === 0) continue;

  const pool = [];
  for (const topic of prof.topics) {
    for (const diff of prof.difficulties) {
      const list = byTopicDiff.get(`${topic}|${diff}`) || [];
      for (const id of list) if (!have.has(id)) pool.push(id);
    }
  }

  const picked = shuffle([...new Set(pool)]).slice(0, need);
  for (const pid of picked) {
    rows.push({
      company_slug: slug,
      problem_id: pid,
      role: 'SDE',
      frequency_score: rand(1, 10),
    });
    have.add(pid);
    totalPlanned++;
  }
}

if (rows.length === 0) {
  console.log('Nothing to add — every company already meets its target.');
  process.exit(0);
}

const chunkSize = 500;
let inserted = 0;
for (let i = 0; i < rows.length; i += chunkSize) {
  const chunk = rows.slice(i, i + chunkSize);
  const { error, count } = await sb
    .from('PGcode_company_problems')
    .upsert(chunk, { onConflict: 'company_slug,problem_id,role', ignoreDuplicates: true, count: 'exact' });
  if (error) {
    console.error('Upsert error:', error.message);
    process.exit(1);
  }
  inserted += count ?? chunk.length;
}

console.log(`Planned ${totalPlanned} new links across ${Object.keys(PROFILES).length} companies; upserted ${inserted}.`);
