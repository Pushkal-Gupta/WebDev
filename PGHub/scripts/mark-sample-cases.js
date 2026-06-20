#!/usr/bin/env node
// Backfill the `is_sample` flag on every PGcode_problems.test_cases entry.
//
// Rule (idempotent):
//   - If 0 cases have is_sample=true: mark cases[0..2] as is_sample=true, rest false.
//   - If 1-2 already flagged: keep those, mark additional leading cases until we have 3.
//   - If 3+ already flagged: keep the first 3 flagged-by-position, force the rest false.
//   - Every case ends with an explicit is_sample boolean (no missing field).
//
// Running twice produces the same result.

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
const dry = process.argv.includes('--dry');

const SAMPLE_TARGET = 3;

const all = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('id,test_cases')
    .order('id', { ascending: true })
    .range(from, from + 999);
  if (error) throw error;
  if (!data.length) break;
  all.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
console.log(`Fetched ${all.length} problems.`);

let updated = 0;
let unchanged = 0;
let skippedNoCases = 0;
let preservedExisting = 0;
let failed = 0;

for (const p of all) {
  const cases = Array.isArray(p.test_cases) ? p.test_cases : null;
  if (!cases || cases.length === 0) { skippedNoCases++; continue; }

  const preExistingSampleCount = cases.filter(tc => tc && tc.is_sample === true).length;
  if (preExistingSampleCount > 0 && preExistingSampleCount <= SAMPLE_TARGET) preservedExisting++;

  // Decide which indices end up as sample.
  let sampleIndices;
  if (preExistingSampleCount === 0) {
    sampleIndices = new Set();
    for (let i = 0; i < Math.min(SAMPLE_TARGET, cases.length); i++) sampleIndices.add(i);
  } else if (preExistingSampleCount >= SAMPLE_TARGET) {
    // Keep first SAMPLE_TARGET that were already flagged (preserve author intent), drop the rest.
    sampleIndices = new Set();
    let kept = 0;
    for (let i = 0; i < cases.length && kept < SAMPLE_TARGET; i++) {
      if (cases[i] && cases[i].is_sample === true) { sampleIndices.add(i); kept++; }
    }
  } else {
    // 1 or 2 existing samples — keep them, top up from leading non-sample indices.
    sampleIndices = new Set();
    cases.forEach((tc, i) => { if (tc && tc.is_sample === true) sampleIndices.add(i); });
    let i = 0;
    while (sampleIndices.size < Math.min(SAMPLE_TARGET, cases.length) && i < cases.length) {
      sampleIndices.add(i);
      i++;
    }
  }

  let changed = false;
  const next = cases.map((tc, i) => {
    const desired = sampleIndices.has(i);
    if (!tc || typeof tc !== 'object') return tc;
    if (tc.is_sample === desired) return tc;
    changed = true;
    return { ...tc, is_sample: desired };
  });

  if (!changed) { unchanged++; continue; }

  if (dry) { updated++; continue; }

  const { error } = await sb.from('PGcode_problems').update({ test_cases: next }).eq('id', p.id);
  if (error) {
    failed++;
    console.error(`  fail ${p.id}: ${error.message}`);
  } else {
    updated++;
  }
}

console.log(JSON.stringify({
  totalProblems: all.length,
  updated,
  unchanged,
  skippedNoCases,
  preservedExisting,
  failed,
  dry,
}, null, 2));
console.log(`Updated ${updated} problems, ${preservedExisting} had pre-existing samples preserved.`);
