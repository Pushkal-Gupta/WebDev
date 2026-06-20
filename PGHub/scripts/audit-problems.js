#!/usr/bin/env node
// Health audit over every row in PGcode_problems.
//
// For each problem, score it against 12 axes (description depth, constraints,
// hints, topic linkage, tags, test-case count, solutions, viz frames, harness
// metadata, difficulty, leetcode_number, companies). Emits a CSV at
// /tmp/pgcode-audit.csv and a console summary listing the lowest-scoring
// problems first so the bulk-fix work has a prioritized worklist.

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

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const sb = createClient(URL, KEY);

const CSV_OUT = '/tmp/pgcode-audit.csv';
const BATCH = 1000;

async function fetchAllProblems() {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, leetcode_number, name, difficulty, description, constraints, hints, topic_id, tags, test_cases, solutions, viz_steps, method_name, params, return_type')
      .order('id')
      .range(from, from + BATCH - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return all;
}

async function fetchAllTopicIds() {
  const ids = new Set();
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_topics')
      .select('id')
      .range(from, from + BATCH - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) ids.add(r.id);
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return ids;
}

async function fetchCompanyCounts() {
  // PGcode_company_problems is the canonical join table (see migrate-18).
  // Aggregate counts per problem_id in one pass.
  const counts = new Map();
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_company_problems')
      .select('problem_id')
      .range(from, from + BATCH - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) {
      counts.set(r.problem_id, (counts.get(r.problem_id) || 0) + 1);
    }
    if (data.length < BATCH) break;
    from += BATCH;
  }
  return counts;
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function evaluateRow(row, topicIdSet, companyCounts) {
  const desc = typeof row.description === 'string' ? row.description : '';
  const constraints = typeof row.constraints === 'string' ? row.constraints : '';
  const hints = asArray(row.hints);
  const tags = asArray(row.tags);
  const tc = asArray(row.test_cases);

  const hasDesc = !!desc && desc.length >= 200;
  const hasConstraints = !!constraints && constraints.length >= 30;

  const goodHints = hints.filter(h => typeof h === 'string' && h.trim().length >= 20);
  const hintsCount = goodHints.length;
  const hasHints = hintsCount >= 3;

  const hasTopic = row.topic_id != null && topicIdSet.has(row.topic_id);

  const tagsCount = tags.length;
  const hasTags = tagsCount >= 1;

  const testCasesCount = tc.length;
  const hasTestCases = testCasesCount >= 50;

  let hasSolutionPy = false;
  const sol = row.solutions;
  if (sol && typeof sol === 'object' && !Array.isArray(sol)) {
    const py = sol.python || sol.Python || sol.PYTHON;
    if (py) {
      if (typeof py === 'string') {
        hasSolutionPy = py.trim().length > 0;
      } else if (typeof py === 'object') {
        // Accept either {approach, complexity, code} or {approaches: [...]} shape.
        const hasApproach = !!(py.approach || py.explanation || py.intuition ||
          (Array.isArray(py.approaches) && py.approaches.length > 0));
        const hasComplexity = !!(py.complexity || py.time || py.timeComplexity ||
          (Array.isArray(py.approaches) && py.approaches.some(a => a && (a.complexity || a.time))));
        hasSolutionPy = hasApproach && hasComplexity;
      }
    }
  }

  let vizFrames = 0;
  const viz = row.viz_steps;
  if (viz) {
    if (Array.isArray(viz)) {
      vizFrames = viz.length;
    } else if (typeof viz === 'object') {
      if (Array.isArray(viz.frames)) vizFrames = viz.frames.length;
      else if (Array.isArray(viz.steps)) vizFrames = viz.steps.length;
      else if (Array.isArray(viz.cases)) {
        // Sum frame counts across cases when grouped.
        for (const c of viz.cases) {
          if (Array.isArray(c?.frames)) vizFrames += c.frames.length;
        }
      }
    }
  }
  const hasViz = vizFrames >= 15;

  const params = asArray(row.params);
  const hasMethodMeta = !!row.method_name && params.length > 0 && !!row.return_type;

  const diff = typeof row.difficulty === 'string' ? row.difficulty.trim() : '';
  const hasDifficulty = diff === 'Easy' || diff === 'Medium' || diff === 'Hard';

  const hasLeetcode = row.leetcode_number != null && Number.isFinite(Number(row.leetcode_number));

  const companies = companyCounts.get(row.id) || 0;
  const hasCompanies = companies >= 1;

  const checks = {
    has_desc: hasDesc,
    has_constraints: hasConstraints,
    has_hints: hasHints,
    has_topic: hasTopic,
    has_tags: hasTags,
    has_test_cases: hasTestCases,
    has_solution_py: hasSolutionPy,
    has_viz: hasViz,
    has_method_meta: hasMethodMeta,
    has_difficulty: hasDifficulty,
    has_leetcode: hasLeetcode,
    has_companies: hasCompanies,
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    checks,
    score,
    metrics: {
      desc_len: desc.length,
      constraints_len: constraints.length,
      hints_count: hintsCount,
      tags_count: tagsCount,
      test_cases_count: testCasesCount,
      viz_frames: vizFrames,
      companies,
    },
  };
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function quantile(sortedNums, q) {
  if (sortedNums.length === 0) return 0;
  const pos = (sortedNums.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const lo = sortedNums[base];
  const hi = sortedNums[Math.min(base + 1, sortedNums.length - 1)];
  return lo + (hi - lo) * rest;
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? 0,
    median: quantile(sorted, 0.5),
    p90: quantile(sorted, 0.9),
    p99: quantile(sorted, 0.99),
    max: sorted[sorted.length - 1] ?? 0,
  };
}

console.log('Fetching problems, topics, and company links...');
const [problems, topicIds, companyCounts] = await Promise.all([
  fetchAllProblems(),
  fetchAllTopicIds(),
  fetchCompanyCounts(),
]);
console.log(`Fetched ${problems.length} problems, ${topicIds.size} topics, ${companyCounts.size} problems-with-companies.`);

const evaluated = problems.map(row => ({
  row,
  ...evaluateRow(row, topicIds, companyCounts),
}));

const total = evaluated.length;

const axisTally = {
  has_desc: 0,
  has_constraints: 0,
  has_hints: 0,
  has_topic: 0,
  has_tags: 0,
  has_test_cases: 0,
  has_solution_py: 0,
  has_viz: 0,
  has_method_meta: 0,
  has_difficulty: 0,
  has_leetcode: 0,
  has_companies: 0,
};
for (const e of evaluated) {
  for (const k of Object.keys(axisTally)) {
    if (e.checks[k]) axisTally[k] += 1;
  }
}

const csvLines = [
  'id,leetcode_number,name,difficulty,has_desc,has_constraints,hints_count,has_topic,tags_count,test_cases_count,has_solution_py,viz_frames,has_method_meta,score,total_problems_in_set',
];
for (const e of evaluated) {
  csvLines.push([
    csvEscape(e.row.id),
    csvEscape(e.row.leetcode_number ?? ''),
    csvEscape(e.row.name ?? ''),
    csvEscape(e.row.difficulty ?? ''),
    csvEscape(e.checks.has_desc ? 1 : 0),
    csvEscape(e.checks.has_constraints ? 1 : 0),
    csvEscape(e.metrics.hints_count),
    csvEscape(e.checks.has_topic ? 1 : 0),
    csvEscape(e.metrics.tags_count),
    csvEscape(e.metrics.test_cases_count),
    csvEscape(e.checks.has_solution_py ? 1 : 0),
    csvEscape(e.metrics.viz_frames),
    csvEscape(e.checks.has_method_meta ? 1 : 0),
    csvEscape(e.score),
    csvEscape(total),
  ].join(','));
}
fs.writeFileSync(CSV_OUT, csvLines.join('\n'), 'utf8');

// Stats.
const descLens = evaluated.map(e => e.metrics.desc_len);
const constraintsLens = evaluated.map(e => e.metrics.constraints_len);
const hintsCounts = evaluated.map(e => e.metrics.hints_count);
const tagsCounts = evaluated.map(e => e.metrics.tags_count);
const testCounts = evaluated.map(e => e.metrics.test_cases_count);
const vizCounts = evaluated.map(e => e.metrics.viz_frames);
const companiesCounts = evaluated.map(e => e.metrics.companies);
const scoreCounts = evaluated.map(e => e.score);

const fmt = n => String(n).padStart(6);
const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '0.0%';

console.log('\n=== PGcode problem health audit ===');
console.log(`Total problems: ${total}`);
console.log(`CSV: ${CSV_OUT}`);

console.log('\n-- Pass count per axis --');
const axisLabel = {
  has_desc: 'description >= 200 chars',
  has_constraints: 'constraints >= 30 chars',
  has_hints: 'hints: >=3 entries, each >=20 chars',
  has_topic: 'topic_id resolves to a real topic',
  has_tags: 'tags: >=1 entry',
  has_test_cases: 'test_cases: >=50 entries',
  has_solution_py: 'solutions.python with approach + complexity',
  has_viz: 'viz_steps with >=15 frames',
  has_method_meta: 'method_name + params + return_type set',
  has_difficulty: 'difficulty in {Easy, Medium, Hard}',
  has_leetcode: 'leetcode_number set',
  has_companies: '>=1 company linkage',
};
for (const k of Object.keys(axisTally)) {
  console.log(`  ${fmt(axisTally[k])} / ${total}  (${pct(axisTally[k], total).padStart(6)})  ${axisLabel[k]}`);
}

console.log('\n-- Score distribution (0..12, higher = healthier) --');
const scoreHist = new Array(13).fill(0);
for (const s of scoreCounts) scoreHist[s] = (scoreHist[s] || 0) + 1;
for (let s = 0; s <= 12; s++) {
  console.log(`  score=${String(s).padStart(2)}  ${fmt(scoreHist[s])}  (${pct(scoreHist[s], total)})`);
}

console.log('\n-- Numeric metric stats (min / median / p90 / p99 / max) --');
const rowStats = [
  ['description length', stats(descLens)],
  ['constraints length', stats(constraintsLens)],
  ['hints count', stats(hintsCounts)],
  ['tags count', stats(tagsCounts)],
  ['test_cases count', stats(testCounts)],
  ['viz_steps frames', stats(vizCounts)],
  ['companies linked', stats(companiesCounts)],
  ['score', stats(scoreCounts)],
];
for (const [label, s] of rowStats) {
  const fmtN = n => String(Math.round(n)).padStart(7);
  console.log(`  ${label.padEnd(22)}  min=${fmtN(s.min)}  median=${fmtN(s.median)}  p90=${fmtN(s.p90)}  p99=${fmtN(s.p99)}  max=${fmtN(s.max)}`);
}

console.log('\n-- Top 50 worst problems (lowest score first) --');
console.log('  score  id                                            lc#    difficulty  name');
const worst = [...evaluated].sort((a, b) => {
  if (a.score !== b.score) return a.score - b.score;
  // Secondary: prefer the ones with the least test-case coverage.
  if (a.metrics.test_cases_count !== b.metrics.test_cases_count) {
    return a.metrics.test_cases_count - b.metrics.test_cases_count;
  }
  return String(a.row.id).localeCompare(String(b.row.id));
}).slice(0, 50);

for (const e of worst) {
  const id = String(e.row.id || '').padEnd(44).slice(0, 44);
  const lc = String(e.row.leetcode_number ?? '').padEnd(5).slice(0, 5);
  const dif = String(e.row.difficulty || '').padEnd(10).slice(0, 10);
  const name = String(e.row.name || '').slice(0, 60);
  console.log(`  ${String(e.score).padStart(5)}  ${id}  ${lc}  ${dif}  ${name}`);
}

console.log('');
