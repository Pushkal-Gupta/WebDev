#!/usr/bin/env node
// Sweep PGcode_problems: parse each problem's `constraints`, validate every
// test_case against the parsed bounds, and report (or prune) cases that fall
// CLEARLY outside the stated constraints. An out-of-constraint case can wrongly
// FAIL a correct solution that legitimately assumes the constraints — a false
// negative. We only touch cases that violate an EXPLICITLY-parsed bound.
//
// Usage:
//   node scripts/check-constraints.mjs                  # REPORT only (default)
//   node scripts/check-constraints.mjs --max 200        # first 200 problems
//   node scripts/check-constraints.mjs --max 200 --offset 200
//   node scripts/check-constraints.mjs --prune          # remove violating cases
//   node scripts/check-constraints.mjs --prune --verbose
//
// --prune never drops a problem below 2 cases: if pruning would, it leaves the
// problem untouched and flags it for regeneration instead.
//
// Creds from .env via process.env (service role). Keys are NEVER printed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parseBounds, validateInputs } from './lib/constraint-bounds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
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

const argv = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};
const PRUNE = !!arg('prune');
const VERBOSE = !!arg('verbose');
const MAX = arg('max') != null ? Number(arg('max')) : Infinity;
const OFFSET = Number(arg('offset') || 0);
const MIN_CASES = 2; // never drop a problem below this

async function fetchProblems() {
  const out = [];
  let page = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id, params, constraints, test_cases')
      .order('id', { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const r of data) {
      if (!r.constraints || !String(r.constraints).trim()) continue;
      if (!Array.isArray(r.test_cases) || r.test_cases.length === 0) continue;
      if (!Array.isArray(r.params) || r.params.length === 0) continue;
      out.push(r);
    }
    if (data.length < PAGE) break;
    page++;
  }
  return out;
}

async function main() {
  console.log(`check-constraints ${PRUNE ? '(PRUNE — writes back)' : '(REPORT only)'}`);
  console.log('Loading problems with constraints + test_cases + params...');
  let problems = await fetchProblems();
  console.log(`Found ${problems.length} candidate problems.`);

  problems = problems.slice(OFFSET, OFFSET + (MAX === Infinity ? problems.length : MAX));
  console.log(`Scanning ${problems.length} this run (offset=${OFFSET}${MAX === Infinity ? '' : `, max=${MAX}`}).\n`);

  let scanned = 0;
  let withViolations = 0;
  let totalViolatingCases = 0;
  let totalCasesScanned = 0;
  let pruned = 0;
  let flaggedNoPrune = 0; // would drop below MIN_CASES — left for regeneration
  let problemsParsedSomeBound = 0;
  const flagged = [];

  for (const p of problems) {
    scanned++;
    const bounds = parseBounds(p.constraints, p.params);
    const hasBound = Object.keys(bounds.perParam).length > 0 || Object.keys(bounds.scalars).length > 0;
    if (hasBound) problemsParsedSomeBound++;

    const cases = p.test_cases;
    const keep = [];
    const drop = [];
    for (const tc of cases) {
      totalCasesScanned++;
      const inputs = Array.isArray(tc?.inputs) ? tc.inputs : null;
      if (!inputs) { keep.push(tc); continue; }
      const v = validateInputs(inputs, p.params, bounds);
      if (v.ok) keep.push(tc);
      else { drop.push({ tc, violations: v.violations }); }
    }

    if (drop.length === 0) continue;

    withViolations++;
    totalViolatingCases += drop.length;
    flagged.push({ id: p.id, total: cases.length, bad: drop.length, sample: drop[0].violations });

    if (VERBOSE || !PRUNE) {
      console.log(`  ${p.id}: ${drop.length}/${cases.length} cases violate`);
      for (const d of drop.slice(0, 3)) {
        console.log(`     - inputs=${JSON.stringify(d.tc.inputs)} :: ${d.violations.join('; ')}`);
      }
    }

    if (PRUNE) {
      if (keep.length < MIN_CASES) {
        flaggedNoPrune++;
        console.log(`  ${p.id}: SKIP prune (would leave ${keep.length} < ${MIN_CASES}) — flag for regeneration`);
        continue;
      }
      const { error } = await sb.from('PGcode_problems').update({ test_cases: keep }).eq('id', p.id);
      if (error) {
        console.log(`  ${p.id}: prune write FAILED (${error.message.slice(0, 80)})`);
      } else {
        pruned += drop.length;
        if (VERBOSE) console.log(`  ${p.id}: pruned ${drop.length} (${cases.length} -> ${keep.length})`);
      }
    }
  }

  console.log('\n──────────── SUMMARY ────────────');
  console.log(`Problems scanned:               ${scanned}`);
  console.log(`Problems with parsed bounds:    ${problemsParsedSomeBound}`);
  console.log(`Test cases scanned:             ${totalCasesScanned}`);
  console.log(`Problems with >=1 violation:    ${withViolations} (${scanned ? (withViolations / scanned * 100).toFixed(1) : 0}%)`);
  console.log(`Total violating cases:          ${totalViolatingCases}`);
  if (PRUNE) {
    console.log(`Cases pruned:                   ${pruned}`);
    console.log(`Problems flagged for regen:     ${flaggedNoPrune} (would have dropped below ${MIN_CASES})`);
  } else {
    console.log(`(REPORT only — re-run with --prune to remove violating cases)`);
  }
  if (!PRUNE && flagged.length) {
    console.log('\nTop offenders:');
    flagged.sort((a, b) => b.bad - a.bad).slice(0, 15)
      .forEach((f) => console.log(`  ${f.id}: ${f.bad}/${f.total}  e.g. ${f.sample.join('; ').slice(0, 90)}`));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
