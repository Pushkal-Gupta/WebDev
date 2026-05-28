#!/usr/bin/env node
// Read-only quality audit for every row in PGcode_problems.
// Emits a CSV at /tmp/problems-audit.csv plus a stdout summary so content-fill
// agents know which rows to target first.

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
if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(URL, KEY);

const PLACEHOLDER_RX = /\b(coming soon|placeholder|todo|tbd|lorem ipsum)\b/i;
const FLAGSHIP_LANGS = ['python', 'javascript', 'js', 'java', 'cpp', 'c++'];
const CSV_OUT = '/tmp/problems-audit.csv';

async function fetchAll() {
  const all = [];
  const BATCH = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, name, roadmap_set, description, params, test_cases, hints, solutions, method_name, return_type')
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

function extractExamples(description) {
  if (!description || typeof description !== 'string') return [];
  const out = [];
  const preRx = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  let m;
  while ((m = preRx.exec(description)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text) out.push(text);
  }
  if (out.length === 0) {
    const blocks = description.split(/example\s*\d*[:.)]/i).slice(1);
    for (const b of blocks) {
      const text = b.replace(/<[^>]+>/g, '').trim();
      if (text.length >= 20) out.push(text);
    }
  }
  return out;
}

function evaluate(row) {
  const gaps = [];

  const desc = (row.description || '').trim();
  if (!desc) gaps.push('description_missing');
  else if (desc.length < 80) gaps.push('description_too_short');
  else if (PLACEHOLDER_RX.test(desc)) gaps.push('description_placeholder');

  const examples = extractExamples(row.description);
  const hasShortExample = examples.length > 0 && examples.every(e => e.length < 20);
  if (examples.length === 0) gaps.push('examples_missing');
  else if (hasShortExample) gaps.push('examples_too_short');

  const params = row.params;
  const paramsEmpty = !params || (Array.isArray(params) && params.length === 0);
  const hasDriver = !!row.method_name;
  if (paramsEmpty && !hasDriver) gaps.push('params_missing');

  const tc = Array.isArray(row.test_cases) ? row.test_cases : [];
  if (tc.length === 0) gaps.push('test_cases_missing');
  else if (tc.length < 10) gaps.push('test_cases_under_10');

  const hints = Array.isArray(row.hints) ? row.hints : [];
  if (hints.length < 3) gaps.push('hints_under_3');

  const sol = row.solutions;
  const solKeys =
    sol && typeof sol === 'object' && !Array.isArray(sol) ? Object.keys(sol) : [];
  const hasAnyLang = solKeys.some(k => FLAGSHIP_LANGS.includes(k.toLowerCase()));
  if (!hasAnyLang) gaps.push('solutions_missing');

  if (hasDriver) {
    if (!row.method_name) gaps.push('method_name_missing');
    if (!row.return_type) gaps.push('return_type_missing');
  } else {
    if (!row.method_name) gaps.push('method_name_missing_flagship');
    if (!row.return_type) gaps.push('return_type_missing_flagship');
  }

  return gaps;
}

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function bucketKey(r) {
  if (r == null) return 'none';
  return String(r);
}

const rows = await fetchAll();
console.log(`Fetched ${rows.length} problem rows.`);

const buckets = {};
const gapTypeTally = {};
const completePerBucket = {};
const distribution = {};

const csvLines = ['id,name,roadmap_set,gaps_count,gaps_list'];

for (const row of rows) {
  const gaps = evaluate(row);
  const bucket = bucketKey(row.roadmap_set);
  buckets[bucket] = (buckets[bucket] || 0) + 1;

  for (const g of gaps) gapTypeTally[g] = (gapTypeTally[g] || 0) + 1;

  if (gaps.length === 0) completePerBucket[bucket] = (completePerBucket[bucket] || 0) + 1;

  const tier = gaps.length === 0 ? '0' : gaps.length === 1 ? '1' : gaps.length === 2 ? '2' : '3+';
  distribution[bucket] = distribution[bucket] || { '0': 0, '1': 0, '2': 0, '3+': 0, total: 0 };
  distribution[bucket][tier] += 1;
  distribution[bucket].total += 1;

  csvLines.push([
    csvEscape(row.id),
    csvEscape(row.name),
    csvEscape(row.roadmap_set ?? ''),
    csvEscape(gaps.length),
    csvEscape(gaps.join('|')),
  ].join(','));
}

fs.writeFileSync(CSV_OUT, csvLines.join('\n'), 'utf8');

const fmt = n => String(n).padStart(5);
const orderedBuckets = ['100', '200', '300', '400', '500', 'all', 'none']
  .filter(b => b in distribution)
  .concat(Object.keys(distribution).filter(b => !['100', '200', '300', '400', '500', 'all', 'none'].includes(b)));

console.log('\n=== PGcode problem-quality audit ===');
console.log(`Total problems: ${rows.length}`);
console.log(`CSV: ${CSV_OUT}`);

console.log('\n-- Gap distribution by roadmap_set --');
console.log(`bucket   total    0gap    1gap    2gap   3+gap   complete%`);
for (const b of orderedBuckets) {
  const d = distribution[b];
  const pct = d.total ? ((d['0'] / d.total) * 100).toFixed(1) : '0.0';
  console.log(`${b.padEnd(8)}${fmt(d.total)}${fmt(d['0'])}${fmt(d['1'])}${fmt(d['2'])}${fmt(d['3+'])}     ${pct}%`);
}

console.log('\n-- Top gap types --');
const ranked = Object.entries(gapTypeTally).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [k, v] of ranked) console.log(`  ${v.toString().padStart(5)}  ${k}`);

console.log('\n-- Complete (zero-gap) per roadmap bucket --');
for (const b of ['100', '200', '300', '400', '500']) {
  const c = completePerBucket[b] || 0;
  const t = distribution[b]?.total || 0;
  console.log(`  roadmap-${b}: ${c} / ${t} complete`);
}
console.log('');
