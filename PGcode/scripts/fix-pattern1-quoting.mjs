#!/usr/bin/env node
// fix-pattern1-quoting.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Bug being repaired:
//   During initial test-case import, string-typed inputs got JSON-encoded
//   BEFORE storage. The stored cell ended up holding the 3-char string `"0"`
//   (with literal double-quote chars) instead of the 1-char string `0`.
//   The grade-submission driver reads `type === "str"` params via plain
//   `input()` / `lines.shift()` — i.e. it takes the line VERBATIM. So the
//   canonical receives `"0"` (3 chars) when it expects `0` (1 char) and
//   reports the case as failing.
//
//   Fix: for every problem whose params include a `str` (or `string`) field,
//   for every stored test-case, if the value at that index starts AND ends
//   with a literal `"`, strip one outer pair. Same fix applied to `expected`
//   when `return_type` is also `str`/`string`.
//
// Modes:
//   (default)  dry-run — print every proposed fix, never write
//   --apply    actually persist the corrected test_cases back to the DB
//   --slug X   restrict to one problem id
//   --limit N  process at most N problems (after filtering)
//   --no-verify  skip the Judge0 canonical pre-flight (faster, less safe)
//
// Safety:
//   Before writing back any fixed problem, run its canonical Python solution
//   against the first 3 corrected test_cases via the `run-code` edge function
//   and confirm each one matches expected. Any mismatch → skip the entire
//   problem and add it to a manual-review log. Never silently corrupt cases.
//
// Audit trail:
//   Every change (proposed or applied) is written to
//   `scripts/_fix-pattern1-quoting.log.json` so the user has a full record.
// ─────────────────────────────────────────────────────────────────────────────

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
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC || !ANON) {
  console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const sb = createClient(URL, SVC);

const args = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};
const SLUG = arg('slug');
const APPLY = !!arg('apply');
const LIMIT = Number(arg('limit') || 0);
const NO_VERIFY = !!arg('no-verify');

const LOG_PATH = path.join(__dirname, '_fix-pattern1-quoting.log.json');

// ── Detector / fixer ────────────────────────────────────────────────────────
const isStringType = (t) => {
  const s = String(t || '').trim().toLowerCase();
  return s === 'str' || s === 'string';
};

// Test if a stored cell looks like a JSON-double-quoted string, i.e. the
// JS value itself begins and ends with a literal `"` character. We require
// at least two extra chars so `""` (legitimately the empty string)
// becomes the 0-char string — that's actually the correct unwrap.
const looksWrapped = (v) => typeof v === 'string'
  && v.length >= 2
  && v.charCodeAt(0) === 34   // "
  && v.charCodeAt(v.length - 1) === 34;

const unwrapOnce = (v) => {
  // Prefer JSON.parse so escape sequences inside the string are honoured
  // (e.g. `"a\\nb"` → `a\nb`). Fall back to a naive strip on parse failure
  // since some stored values aren't strictly valid JSON.
  try {
    const parsed = JSON.parse(v);
    if (typeof parsed === 'string') return parsed;
  } catch { /* fall through */ }
  return v.slice(1, -1);
};

// Compute a fixed test_cases array. Returns { fixed, changes } where
// `changes` is a per-case diff descriptor and `fixed` is the new array.
function planFix(problem) {
  const { params, return_type, test_cases } = problem;
  const tc = Array.isArray(test_cases) ? test_cases : [];
  const stringIdxs = (params || []).map((p, i) => (isStringType(p?.type) ? i : -1)).filter(i => i >= 0);
  const returnIsString = isStringType(return_type);
  if (stringIdxs.length === 0 && !returnIsString) return { fixed: null, changes: [] };

  const fixed = [];
  const changes = [];
  let anyChange = false;
  for (let ci = 0; ci < tc.length; ci++) {
    const orig = tc[ci];
    if (!orig || !Array.isArray(orig.inputs)) { fixed.push(orig); continue; }
    const newInputs = orig.inputs.slice();
    const caseChanges = [];
    for (const idx of stringIdxs) {
      const v = newInputs[idx];
      if (looksWrapped(v)) {
        const u = unwrapOnce(v);
        if (u !== v) {
          newInputs[idx] = u;
          caseChanges.push({ kind: 'input', case: ci, idx, before: v, after: u });
        }
      }
    }
    let newExpected = orig.expected;
    if (returnIsString && looksWrapped(newExpected)) {
      const u = unwrapOnce(newExpected);
      if (u !== newExpected) {
        caseChanges.push({ kind: 'expected', case: ci, before: newExpected, after: u });
        newExpected = u;
      }
    }
    if (caseChanges.length) {
      anyChange = true;
      changes.push(...caseChanges);
      fixed.push({ ...orig, inputs: newInputs, expected: newExpected });
    } else {
      fixed.push(orig);
    }
  }
  return { fixed: anyChange ? fixed : null, changes };
}

// ── Judge0 pre-flight ───────────────────────────────────────────────────────
function buildPythonHarness(code, methodName, params) {
  // Mirrors grade-submission/index.ts behaviour for type=str: raw input().
  const reads = (params || []).map((p, i) => {
    const t = String(p?.type || '').toLowerCase();
    if (t === 'str' || t === 'string') return `    arg${i} = input()`;
    if (t === 'int' || t === 'integer' || t === 'long') return `    arg${i} = int(input().strip())`;
    if (t === 'bool' || t === 'boolean') return `    arg${i} = input().strip().lower() == 'true'`;
    return `    arg${i} = __import__('ast').literal_eval(input())`;
  }).join('\n');
  const argList = (params || []).map((_, i) => `arg${i}`).join(', ');
  const usesClass = /\bclass\s+Solution\b/.test(code);
  const callExpr = usesClass
    ? `Solution().${methodName}(${argList})`
    : `${methodName}(${argList})`;
  return `from __future__ import annotations
${code}

import sys
def _fmt(v):
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (list, tuple)): return '[' + ','.join(_fmt(x) for x in v) + ']'
    if isinstance(v, str): return v
    return str(v)
if __name__ == '__main__':
${reads}
    r = ${callExpr}
    print(_fmt(r))
`;
}

async function runOnce(source, stdin) {
  const res = await fetch(`${URL}/functions/v1/run-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ language: 'python', code: source, stdins: [stdin] }),
  });
  if (!res.ok) throw new Error(`run-code ${res.status}: ${await res.text().then(t => t.slice(0, 160))}`);
  const data = await res.json();
  const first = (data.results || [])[0];
  if (!first) throw new Error('no result');
  if (first.status && first.status !== 'success' && first.status !== 'Accepted') {
    throw new Error(`${first.status}: ${(first.output || '').slice(0, 120)}`);
  }
  return (first.output || '').replace(/\s+$/, '');
}

async function preflightCanonical(problem, fixedCases) {
  const { method_name, params, solutions } = problem;
  const pyEntry = solutions?.python;
  const py = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
  if (!py || !method_name || !Array.isArray(params) || params.length === 0) {
    return { ok: false, reason: 'missing solutions.python / method_name / params' };
  }
  const sample = fixedCases.slice(0, 3);
  if (sample.length === 0) return { ok: true, reason: 'no fixed cases to check' };
  const harness = buildPythonHarness(py, method_name, params);
  for (let i = 0; i < sample.length; i++) {
    const tc = sample[i];
    const stdin = (tc.inputs || []).join('\n') + '\n';
    let out;
    try { out = await runOnce(harness, stdin); }
    catch (e) { return { ok: false, reason: `case ${i} runtime: ${e.message.slice(0, 120)}` }; }
    const exp = String(tc.expected ?? '').replace(/\s+$/, '');
    if (out !== exp) {
      return { ok: false, reason: `case ${i} mismatch: got=${JSON.stringify(out).slice(0, 80)} expected=${JSON.stringify(exp).slice(0, 80)}` };
    }
  }
  return { ok: true };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function fetchCandidates() {
  if (SLUG) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, method_name, params, return_type, solutions, test_cases')
      .eq('id', SLUG);
    if (error) throw error;
    return data || [];
  }
  const out = [];
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, method_name, params, return_type, solutions, test_cases')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function main() {
  console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}${NO_VERIFY ? ' (no pre-flight)' : ''}`);
  if (SLUG) console.log(`slug filter: ${SLUG}`);
  if (LIMIT) console.log(`limit: ${LIMIT}`);

  const rows = await fetchCandidates();
  console.log(`loaded ${rows.length} problem rows`);

  // First pass: which rows have at least one string-typed param/return and at
  // least one stored input that looks JSON-wrapped?
  const targets = [];
  for (const p of rows) {
    const { fixed, changes } = planFix(p);
    if (fixed && changes.length) targets.push({ row: p, fixed, changes });
  }
  console.log(`problems with proposed fixes: ${targets.length}`);
  const sliced = LIMIT ? targets.slice(0, LIMIT) : targets;
  if (LIMIT) console.log(`processing first ${sliced.length} after --limit`);

  const log = {
    mode: APPLY ? 'apply' : 'dry-run',
    started: new Date().toISOString(),
    totals: { rows_scanned: rows.length, candidates: targets.length, processed: sliced.length },
    applied: [],
    skipped_manual_review: [],
    dry_run: [],
  };

  let totalCaseFixes = 0;
  let totalProblemsFixed = 0;
  const writes = [];

  for (const { row, fixed, changes } of sliced) {
    totalCaseFixes += changes.length;
    const caseIdxs = new Set(changes.map(c => c.case));
    console.log(`\n[${row.id}] ${changes.length} field-level fixes across ${caseIdxs.size} cases`);
    for (const c of changes.slice(0, 4)) {
      const which = c.kind === 'input' ? `inputs[${c.idx}]` : 'expected';
      console.log(`    case ${c.case} ${which}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)}`);
    }
    if (changes.length > 4) console.log(`    … +${changes.length - 4} more`);

    if (!APPLY) {
      log.dry_run.push({ id: row.id, changes });
      totalProblemsFixed += 1;
      continue;
    }

    // Pre-flight: only the cases we actually changed.
    const changedCases = [...caseIdxs].sort((a, b) => a - b).map(i => fixed[i]);
    let preflight = { ok: true };
    if (!NO_VERIFY) {
      preflight = await preflightCanonical(row, changedCases);
    }
    if (!preflight.ok) {
      console.log(`    pre-flight FAILED: ${preflight.reason} — skip`);
      log.skipped_manual_review.push({ id: row.id, reason: preflight.reason, changes });
      continue;
    }
    writes.push({ id: row.id, fixed, changes });
  }

  if (APPLY) {
    for (const w of writes) {
      const { error } = await sb.from('PGcode_problems').update({ test_cases: w.fixed }).eq('id', w.id);
      if (error) {
        console.log(`  [${w.id}] write FAILED: ${error.message}`);
        log.skipped_manual_review.push({ id: w.id, reason: `db write: ${error.message}`, changes: w.changes });
        continue;
      }
      console.log(`  [${w.id}] wrote ${w.fixed.length} test_cases (fixed ${w.changes.length} fields)`);
      log.applied.push({ id: w.id, field_fixes: w.changes.length, changes: w.changes });
      totalProblemsFixed += 1;
    }
  }

  log.totals.problems_fixed = totalProblemsFixed;
  log.totals.field_level_fixes = totalCaseFixes;
  log.finished = new Date().toISOString();
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));

  console.log(`\n──────────────────────────────────────────────`);
  console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`candidate problems: ${targets.length}`);
  console.log(`processed: ${sliced.length}`);
  console.log(`fixed (problems): ${totalProblemsFixed}`);
  console.log(`field-level changes: ${totalCaseFixes}`);
  if (log.skipped_manual_review.length) console.log(`manual-review skips: ${log.skipped_manual_review.length}`);
  console.log(`log: ${LOG_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
