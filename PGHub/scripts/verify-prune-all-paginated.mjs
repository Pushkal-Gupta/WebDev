#!/usr/bin/env node
// Paginated sweep wrapper around scripts/verify-prune-tests.js.
//
// Pages through PGcode_problems 1000 rows at a time (PostgREST cap), spawns
// the existing per-slug verify script for each problem, captures stdout, and
// aggregates a single JSON report.
//
// Usage:
//   node scripts/verify-prune-all-paginated.mjs [--dry] [--apply]
//     [--difficulty Easy|Medium|Hard]
//     [--page-size 1000] [--limit N]
//     [--out logs/verify-prune-all-paginated.json]
//     [--summary-every 50]
//
// Defaults: --dry mode (does NOT modify DB). Pass --apply to invoke the per-slug
// script without --dry (the underlying script then performs the prune writes).

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');

try {
  for (const line of fs.readFileSync(path.join(REPO, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SVC) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(SUPA_URL, SVC);

const args = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};
const hasFlag = (name) => args.includes(`--${name}`);

const apply = hasFlag('apply');
const dry = !apply || hasFlag('dry'); // default to dry; only --apply turns it off
const difficulty = arg('difficulty', null);
const pageSize = parseInt(arg('page-size', '1000'), 10);
const totalLimit = parseInt(arg('limit', '0'), 10);
const summaryEvery = parseInt(arg('summary-every', '50'), 10);
const outPath = arg('out', path.join(REPO, 'logs', 'verify-prune-all-paginated.json'));

// ---------- pagination ----------

async function fetchAllProblemIds() {
  const slugs = [];
  let offset = 0;
  while (true) {
    let q = sb.from('PGcode_problems')
      .select('id, difficulty')
      .not('method_name', 'is', null)
      .not('test_cases', 'is', null)
      .not('solutions', 'is', null)
      .order('id')
      .range(offset, offset + pageSize - 1);
    if (difficulty) q = q.eq('difficulty', difficulty);

    const { data, error } = await q;
    if (error) throw new Error(`page ${offset}: ${error.message}`);
    const rows = data || [];
    for (const r of rows) slugs.push(r.id);
    console.log(`  fetched page offset=${offset} size=${rows.length} (running total=${slugs.length})`);
    if (rows.length < pageSize) break;
    offset += pageSize;
    if (totalLimit > 0 && slugs.length >= totalLimit) break;
  }
  return totalLimit > 0 ? slugs.slice(0, totalLimit) : slugs;
}

// ---------- per-slug spawn ----------

function classifyPattern(stdout) {
  // Heuristic classification of bad-case patterns based on per-slug stdout.
  // The underlying script prints "Pruned cases:" with `inputs=... expected=... actual=... [status]`.
  const patterns = new Map();
  const bump = (k) => patterns.set(k, (patterns.get(k) || 0) + 1);
  const lines = stdout.split('\n');
  let inPruned = false;
  for (const ln of lines) {
    if (ln.startsWith('Pruned cases:')) { inPruned = true; continue; }
    if (!inPruned) continue;
    const trimmed = ln.trim();
    if (!trimmed.startsWith('inputs=')) continue;
    const statusMatch = trimmed.match(/\[(.+?)\]\s*$/);
    if (statusMatch) {
      const s = statusMatch[1];
      if (/IndexError/i.test(s)) bump('runtime:IndexError');
      else if (/KeyError/i.test(s)) bump('runtime:KeyError');
      else if (/ValueError/i.test(s)) bump('runtime:ValueError');
      else if (/TypeError/i.test(s)) bump('runtime:TypeError');
      else if (/Recursion/i.test(s)) bump('runtime:Recursion');
      else if (/Timeout|timed out/i.test(s)) bump('runtime:Timeout');
      else if (/JSONDecodeError|json/i.test(s)) bump('runtime:JSONDecode');
      else if (/err:/i.test(s)) bump('runtime:other');
      else bump(`runtime:${s.slice(0, 30)}`);
    } else {
      // Output mismatch (no [status] block) — likely wrong expected
      bump('mismatch:wrong-expected');
    }
  }
  return Array.from(patterns.entries()).map(([type, count]) => ({ type, count }));
}

function runOne(slug) {
  const childArgs = ['scripts/verify-prune-tests.js', '--slug', slug];
  if (dry) childArgs.push('--dry');
  const r = spawnSync('node', childArgs, {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 600_000,
  });
  return r;
}

// ---------- main ----------

const startTs = Date.now();
console.log(`\n=== verify-prune-all-paginated (mode=${dry ? 'dry' : 'APPLY'} difficulty=${difficulty || 'any'} page-size=${pageSize} limit=${totalLimit || 'none'}) ===\n`);
console.log('Fetching slug list (paginated)...');
const slugs = await fetchAllProblemIds();
console.log(`\nTotal slugs to scan: ${slugs.length}\n`);

const perProblem = [];
let scanned = 0;
let withBad = 0;
let totalCases = 0;
let totalBad = 0;
let errored = 0;

function printRunningSummary(i) {
  const elapsedSec = (Date.now() - startTs) / 1000;
  const rate = scanned > 0 ? scanned / elapsedSec : 0;
  const remaining = slugs.length - i;
  const etaSec = rate > 0 ? remaining / rate : 0;
  const fmt = (s) => {
    if (s < 60) return `${Math.round(s)}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    return `${(s / 3600).toFixed(1)}h`;
  };
  console.log(
    `[progress ${i}/${slugs.length}] scanned=${scanned} bad-problems=${withBad} ` +
    `cases=${totalCases} bad-cases=${totalBad} errored=${errored} ` +
    `elapsed=${fmt(elapsedSec)} eta=${fmt(etaSec)}`
  );
}

for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const r = runOne(slug);
  const out = r.stdout || '';
  const err = r.stderr || '';

  const origMatch = out.match(/original_count:\s*(\d+)/);
  const prunedMatch = out.match(/pruned_count:\s*(\d+)/);

  if (!origMatch || !prunedMatch) {
    const skipReason = (out.match(/^(No Python solution.*|Problem .* not found|Problem has no test_cases.*|Problem missing method_name.*)/m) || [])[1]
      || (err.split('\n').find(l => l.trim()) || '').slice(0, 120)
      || '(no parse)';
    errored++;
    perProblem.push({ slug, badCases: 0, totalCases: 0, patterns: [], error: skipReason });
    if ((i + 1) % summaryEvery === 0 || i === slugs.length - 1) printRunningSummary(i + 1);
    continue;
  }

  const total = parseInt(origMatch[1], 10);
  const bad = parseInt(prunedMatch[1], 10);
  const patterns = bad > 0 ? classifyPattern(out) : [];

  perProblem.push({ slug, badCases: bad, totalCases: total, patterns });

  scanned++;
  totalCases += total;
  totalBad += bad;
  if (bad > 0) withBad++;

  if ((i + 1) % summaryEvery === 0 || i === slugs.length - 1) printRunningSummary(i + 1);
}

const totalElapsedSec = (Date.now() - startTs) / 1000;

// ---------- output ----------

const top20 = [...perProblem]
  .filter(p => p.badCases > 0)
  .sort((a, b) => {
    const aPct = a.totalCases ? a.badCases / a.totalCases : 0;
    const bPct = b.totalCases ? b.badCases / b.totalCases : 0;
    if (b.badCases !== a.badCases) return b.badCases - a.badCases;
    return bPct - aPct;
  })
  .slice(0, 20);

// Aggregate pattern counts
const patternAgg = new Map();
for (const p of perProblem) {
  for (const pat of p.patterns || []) {
    patternAgg.set(pat.type, (patternAgg.get(pat.type) || 0) + pat.count);
  }
}
const patternsSorted = Array.from(patternAgg.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => ({ type, count }));

const report = {
  timestamp: new Date().toISOString(),
  mode: dry ? 'dry' : 'apply',
  difficulty: difficulty || 'all',
  pageSize,
  limit: totalLimit || null,
  elapsedSec: Math.round(totalElapsedSec),
  summary: {
    slugsConsidered: slugs.length,
    scanned,
    problemsWithBad: withBad,
    totalCases,
    totalBad,
    errored,
  },
  patternAggregate: patternsSorted,
  top20Worst: top20,
  perProblem,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log('\n=== SWEEP COMPLETE ===');
console.log(`mode:               ${dry ? 'dry (no DB writes)' : 'APPLY (DB pruned)'}`);
console.log(`slugs_considered:   ${slugs.length}`);
console.log(`scanned_ok:         ${scanned}`);
console.log(`problems_with_bad:  ${withBad}`);
console.log(`test_cases_total:   ${totalCases}`);
console.log(`test_cases_bad:     ${totalBad}`);
console.log(`errored_or_skipped: ${errored}`);
console.log(`elapsed_sec:        ${Math.round(totalElapsedSec)}`);
console.log(`output_json:        ${outPath}`);

if (patternsSorted.length) {
  console.log('\n=== TOP PATTERNS ===');
  for (const { type, count } of patternsSorted.slice(0, 10)) {
    console.log(`  ${type.padEnd(32)} ${count}`);
  }
}

console.log('\n=== TOP 20 WORST OFFENDERS (by bad-case count) ===');
for (const p of top20) {
  const pct = p.totalCases ? Math.round((p.badCases / p.totalCases) * 100) : 0;
  const topPat = (p.patterns || []).slice(0, 2).map(x => `${x.type}=${x.count}`).join(' ');
  console.log(`  ${p.slug.padEnd(40)} bad=${String(p.badCases).padStart(4)}/${String(p.totalCases).padEnd(4)} (${pct}%)  ${topPat}`);
}
