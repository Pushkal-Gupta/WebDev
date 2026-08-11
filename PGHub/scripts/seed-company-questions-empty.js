#!/usr/bin/env node
// Seed PGcode_company_problems for companies that have a row in PGcode_companies but no
// question links yet (the seed-companies-expand.js additions — Zerodha, Stripe-tier fintech,
// dev-tools, security, chips, gaming, consumer, AI, international). Each empty company gets a
// curated set: a universal CORE that every company asks + a domain-flavored bucket, with a
// descending frequency gradient. Every problem_id is verified to exist in PGcode_problems
// first, so no link ever dangles. Idempotent: per-company delete-then-insert, so re-runs are
// safe and only ever reflect the current curation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry');
if (!URL || !KEY) { console.error('Missing SUPABASE env'); process.exit(1); }
const sb = createClient(URL, KEY);

// Universal — asked across essentially every software interview.
const CORE = [
  'two-sum', 'valid-parentheses', 'best-time-to-buy-sell-stock', 'reverse-linked-list',
  'merge-two-sorted', 'longest-substr-no-repeat', 'valid-palindrome', 'maximum-subarray',
  'climbing-stairs', 'num-islands', 'top-k-frequent', 'group-anagrams', 'lru-cache', '3sum',
];

// Domain-flavored additions (all ids drawn from the proven junction pool).
const DOMAIN = {
  fintech: ['merge-intervals', 'meeting-rooms', 'find-median-data-stream', 'subarray-sum-equals-k',
    'min-stack', 'insert-delete-getrandom-o1', 'task-scheduler', 'kth-largest-element',
    'trapping-rain-water', 'min-window-substring', 'design-hashmap', 'sliding-window-maximum'],
  devtools: ['course-schedule', 'clone-graph', 'word-break', 'min-stack', 'design-browser-history',
    'lfu-cache', 'serialize-deserialize-tree', 'decode-string', 'alien-dictionary',
    'encode-decode-strings', 'design-add-search-words', 'rotting-oranges'],
  security: ['word-search-ii', 'design-add-search-words', 'number-of-1-bits', 'single-number',
    'clone-graph', 'min-window-substring', 'longest-repeating-character-replacement',
    'product-of-array-except-self', 'reverse-bits', 'course-schedule', 'rotting-oranges', 'valid-anagram'],
  chips: ['reverse-bits', 'number-of-1-bits', 'single-number', 'power-of-two', 'missing-number',
    'product-of-array-except-self', 'spiral-matrix', 'rotate-image', 'maximum-product-subarray',
    'bitwise-and-of-numbers-range', 'game-of-life', 'first-missing-positive'],
  gaming: ['flood-fill', 'rotting-oranges', 'word-search', 'unique-paths', 'house-robber-ii',
    'game-of-life', 'spiral-matrix', 'max-area-of-island', 'subsets', 'permutations',
    'maximal-square-2d', 'level-order-traversal'],
  consumer: ['valid-anagram', 'top-k-frequent-words', 'design-browser-history',
    'serialize-deserialize-tree', 'word-break', 'min-window-substring', 'isomorphic-strings',
    'edit-distance', 'decode-string', 'level-order-traversal', 'course-schedule', 'meeting-rooms'],
  ai: ['product-of-array-except-self', 'spiral-matrix', 'find-median-data-stream', 'longest-increasing-subseq',
    'kth-largest-element', 'matrix-diagonal-sort', 'edit-distance', 'unique-paths',
    'subarray-sum-equals-k', 'k-closest-points-to-origin', 'maximum-product-subarray', 'task-scheduler'],
  general: ['merge-intervals', 'course-schedule', 'min-stack', 'word-break', 'sliding-window-maximum',
    'serialize-deserialize-tree', 'trapping-rain-water', 'rotting-oranges', 'design-hashmap',
    'meeting-rooms', 'kth-largest-element', 'clone-graph'],
};

// Which bucket each empty company draws from.
const COMPANY_DOMAIN = {
  plaid: 'fintech', wise: 'fintech', revolut: 'fintech', klarna: 'fintech', brex: 'fintech',
  ramp: 'fintech', zerodha: 'fintech', 'nubank': 'fintech', mercadolibre: 'fintech', dream11: 'gaming',
  confluent: 'devtools', twilio: 'devtools', vercel: 'devtools', jetbrains: 'devtools',
  postman: 'devtools', sap: 'devtools',
  crowdstrike: 'security', 'palo-alto': 'security', okta: 'security', zscaler: 'security',
  arm: 'chips', tsmc: 'chips', micron: 'chips',
  'riot-games': 'gaming', nintendo: 'gaming',
  reddit: 'consumer', discord: 'consumer', duolingo: 'consumer', grammarly: 'consumer',
  huggingface: 'ai',
  grab: 'general', sea: 'general',
};

function curatedFor(slug) {
  const bucket = DOMAIN[COMPANY_DOMAIN[slug] || 'general'] || DOMAIN.general;
  const seen = new Set(); const list = [];
  for (const id of [...CORE, ...bucket]) { if (!seen.has(id)) { seen.add(id); list.push(id); } }
  return list; // ~24 problems
}

// Descending frequency gradient: leading (core) problems asked most, tail less.
function freqFor(rank, total) {
  const hi = 86, lo = 46;
  return Math.round(hi - (hi - lo) * (rank / Math.max(1, total - 1)));
}

async function main() {
  const { data: comps } = await sb.from('PGcode_companies').select('slug,name');
  const bySlug = Object.fromEntries((comps || []).map((c) => [c.slug, c.name]));
  // which companies are empty
  const have = new Set(); let from = 0;
  for (;;) {
    const { data, error } = await sb.from('PGcode_company_problems').select('company_slug').range(from, from + 999);
    if (error) { console.error(error.message); break; }
    if (!data.length) break;
    for (const r of data) have.add(r.company_slug);
    if (data.length < 1000) break; from += 1000;
  }
  const targets = Object.keys(COMPANY_DOMAIN).filter((s) => bySlug[s] && !have.has(s));
  console.log(`empty companies to seed: ${targets.length} ->`, targets.join(', '));

  // Validate every problem_id we intend to use actually exists.
  const allIds = [...new Set(targets.flatMap((s) => curatedFor(s)))];
  const valid = new Set();
  for (let i = 0; i < allIds.length; i += 100) {
    const { data } = await sb.from('PGcode_problems').select('id').in('id', allIds.slice(i, i + 100));
    for (const p of (data || [])) valid.add(p.id);
  }
  const missing = allIds.filter((id) => !valid.has(id));
  if (missing.length) console.log(`WARNING dropping ${missing.length} unknown ids:`, missing.join(', '));

  let inserted = 0;
  for (const slug of targets) {
    const ids = curatedFor(slug).filter((id) => valid.has(id));
    const rows = ids.map((problem_id, i) => ({
      company_slug: slug, problem_id,
      frequency_score: freqFor(i, ids.length), role: 'sde', last_asked_year: null,
    }));
    if (DRY) { console.log(`  ${slug}: ${rows.length} problems (dry)`); continue; }
    await sb.from('PGcode_company_problems').delete().eq('company_slug', slug);
    const { error } = await sb.from('PGcode_company_problems').insert(rows);
    if (error) { console.error(`  ${slug} INSERT FAILED:`, error.message); continue; }
    inserted += rows.length;
    console.log(`  ${slug} (${bySlug[slug]}): ${rows.length} problems`);
  }
  console.log(DRY ? 'DRY run — nothing written.' : `Done. Inserted ${inserted} links across ${targets.length} companies.`);
}
main();
