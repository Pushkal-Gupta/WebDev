#!/usr/bin/env node
// fix-pattern1-quoting.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Pattern-1 quoting bug (docs/llm-wiki/pattern-1-quoting-bug.md).
//
// String-param test inputs carry an extra layer of JSON quoting. The deployed
// grade-submission driver reads a `str`/`string` param VERBATIM from its stdin
// line (Python `input()`, JS `lines.shift()`, Java `sc.nextLine()` — see
// supabase/functions/grade-submission/index.ts:71). So a value stored as the
// 3-char string  "11"  (leading + trailing literal double-quote) is fed to the
// canonical as  "11"  WITH the quotes — `int("11")` then raises, and the case
// reports a false failure. The correct stored form for a str param is the bare
// string  11 .
//
// Fix: for each problem whose params include a str/string field, for each test
// case, if the stored value at that param index begins AND ends with a literal
// double-quote, strip exactly one JSON layer (JSON.parse, which also honours
// inner escapes). Never touch a value that is not double-quote-wrapped — that
// rules out legitimately-escaped structured inputs (`[1,2]`, `{...}`, bare
// numerics) which never start with `"`.
//
// Modes:
//   (default)  DRY-RUN — scan, preflight a sample, write the report, no DB write
//   --apply    persist corrected test_cases for preflight-passed problems
//
// Preflight (Judge0 is a shared bottleneck — kept light): the first
// PREFLIGHT_LIMIT affected problems are graded through the run-code edge
// function against their first 3 CORRECTED cases. Any failure marks the problem
// SKIP, and --apply never writes a skipped (or un-preflighted) problem.
//
// Report: scripts/report-pattern1-dryrun.json — full audit trail.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
const APPLY = args.includes('--apply');
const preflightArg = args.find((a) => a.startsWith('--preflight='));
const PREFLIGHT_LIMIT = preflightArg ? Math.max(0, parseInt(preflightArg.split('=')[1], 10) || 0) : 20; // light Judge0 use — shared bottleneck
const REPORT_PATH = path.join(__dirname, 'report-pattern1-dryrun.json');

// ── Detector / fixer ────────────────────────────────────────────────────────
const isStringType = (t) => {
  const s = String(t || '').trim().toLowerCase();
  return s === 'str' || s === 'string';
};

// Pattern-1 shape: a JS string value that begins AND ends with a literal
// double-quote char. Anything else (structured `[...]`/`{...}`, bare numerics,
// already-bare strings) is left untouched.
const looksWrapped = (v) => typeof v === 'string'
  && v.length >= 2
  && v.charCodeAt(0) === 34
  && v.charCodeAt(v.length - 1) === 34;

// Strip exactly one JSON quote layer. JSON.parse honours inner escapes
// (`"a\\nb"` → `a\nb`); fall back to a naive strip if the value isn't strict
// JSON but is still quote-wrapped.
const unwrapOnce = (v) => {
  try {
    const parsed = JSON.parse(v);
    if (typeof parsed === 'string') return parsed;
  } catch { /* fall through */ }
  return v.slice(1, -1);
};

// Returns { changed, newCases, changes:[{caseIndex,paramIndex,before,after}] }.
// paramIndex is the numeric input index, or the literal 'expected' for a
// string-RETURN problem whose stored `expected` carries the same wrapping.
// The driver prints a str return verbatim (_fmt: `if isinstance(v, str): return v`),
// so a wrapped `expected` like  "134"  can never match the bare  134  the
// canonical emits — it needs the identical one-layer strip.
function planFix(problem) {
  const params = Array.isArray(problem.params) ? problem.params : [];
  const stringIdx = params.map((p, i) => (isStringType(p?.type) ? i : -1)).filter((i) => i >= 0);
  const returnsString = isStringType(problem.return_type);
  const cases = Array.isArray(problem.test_cases) ? problem.test_cases : [];
  const changes = [];
  const newCases = cases.map((tc) => ({
    ...tc,
    inputs: Array.isArray(tc.inputs) ? tc.inputs.slice() : tc.inputs,
  }));
  if (stringIdx.length === 0 && !returnsString) return { changed: false, newCases, changes };

  for (let ci = 0; ci < cases.length; ci++) {
    const inputs = Array.isArray(cases[ci].inputs) ? cases[ci].inputs : [];
    for (const pi of stringIdx) {
      if (pi >= inputs.length) continue;
      const v = inputs[pi];
      if (!looksWrapped(v)) continue;
      const u = unwrapOnce(v);
      if (u !== v) {
        newCases[ci].inputs[pi] = u;
        changes.push({ caseIndex: ci, paramIndex: pi, before: v, after: u });
      }
    }
    if (returnsString) {
      const ev = cases[ci].expected;
      if (looksWrapped(ev)) {
        const eu = unwrapOnce(ev);
        if (eu !== ev) {
          newCases[ci].expected = eu;
          changes.push({ caseIndex: ci, paramIndex: 'expected', before: ev, after: eu });
        }
      }
    }
  }
  return { changed: changes.length > 0, newCases, changes };
}

// ── Judge0 preflight (mirrors the deployed grade-submission driver) ──────────
function buildPythonHarness(code, methodName, params) {
  const reads = (params || []).map((p, i) => {
    const t = String(p?.type || '').toLowerCase();
    if (t === 'str' || t === 'string') return `    arg${i} = input()`;
    if (t === 'int' || t === 'integer' || t === 'long') return `    arg${i} = int(input().strip())`;
    if (t === 'bool' || t === 'boolean') return `    arg${i} = input().strip().lower() == 'true'`;
    return `    arg${i} = __import__('ast').literal_eval(input())`;
  }).join('\n');
  const argList = (params || []).map((_, i) => `arg${i}`).join(', ');
  const usesClass = /\bclass\s+Solution\b/.test(code);
  const callExpr = usesClass ? `Solution().${methodName}(${argList})` : `${methodName}(${argList})`;
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
  if (!res.ok) throw new Error(`run-code ${res.status}`);
  const data = await res.json();
  const first = (data.results || [])[0];
  if (!first) throw new Error('no result');
  if (first.status && first.status !== 'success' && first.status !== 'Accepted') {
    throw new Error(String(first.status));
  }
  return (first.output || '').replace(/\s+$/, '');
}

async function resolveSolution(problem) {
  try {
    const mod = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'content', 'problemContent.js')).href);
    const rich = mod.RICH_CONTENT || mod.default?.RICH_CONTENT;
    const entry = rich?.[problem.id];
    const pyEntry = entry?.solutions?.python;
    const py = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
    if (py) return py;
  } catch { /* fall through */ }
  const pyEntry = problem.solutions?.python;
  return typeof pyEntry === 'string' ? pyEntry : (pyEntry?.code || null);
}

// Grade canonical against the first 3 CORRECTED cases. { ok, reason? }.
async function preflight(problem, newCases) {
  const py = await resolveSolution(problem);
  if (!py) return { ok: false, reason: 'no canonical python' };
  if (!problem.method_name || !Array.isArray(problem.params) || problem.params.length === 0) {
    return { ok: false, reason: 'missing method_name/params' };
  }
  const sample = (Array.isArray(newCases) ? newCases : []).slice(0, 3);
  if (sample.length === 0) return { ok: false, reason: 'no cases' };
  const harness = buildPythonHarness(py, problem.method_name, problem.params);
  for (let i = 0; i < sample.length; i++) {
    const tc = sample[i];
    const stdin = (Array.isArray(tc.inputs) ? tc.inputs : []).join('\n') + '\n';
    let out;
    try { out = await runOnce(harness, stdin); }
    catch (e) { return { ok: false, reason: `case ${i} judge0: ${String(e.message).slice(0, 60)}` }; }
    const exp = String(tc.expected ?? '').replace(/\s+$/, '');
    if (out !== exp) {
      return { ok: false, reason: `case ${i} mismatch got=${out.slice(0, 24)} exp=${exp.slice(0, 24)}` };
    }
  }
  return { ok: true };
}

async function fetchAllProblems() {
  const out = [];
  let from = 0;
  const PAGE = 1000; // PostgREST caps a single SELECT at 1000 — paginate.
  for (;;) {
    const { data, error } = await sb
      .from('PGcode_problems')
      .select('id, method_name, params, return_type, solutions, test_cases')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function main() {
  console.log(`Pattern-1 quoting fix — mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  const problems = await fetchAllProblems();
  const scanned = problems.length;
  console.log(`Scanned ${scanned} problems.`);

  let stringParamProblems = 0;
  let totalCasesToUnwrap = 0;
  let expectedFixes = 0;
  const affected = []; // { id, method_name, params, solutions, newCases, changes }

  for (const p of problems) {
    const params = Array.isArray(p.params) ? p.params : [];
    const hasStringParam = params.some((pp) => isStringType(pp?.type));
    const returnsString = isStringType(p.return_type);
    if (!hasStringParam && !returnsString) continue;
    if (hasStringParam) stringParamProblems++;

    const { changed, newCases, changes } = planFix(p);
    if (!changed) continue;
    const casesTouched = new Set(changes.map((c) => c.caseIndex)).size;
    totalCasesToUnwrap += casesTouched;
    expectedFixes += changes.filter((c) => c.paramIndex === 'expected').length;
    affected.push({
      id: p.id,
      method_name: p.method_name,
      params: p.params,
      return_type: p.return_type,
      solutions: p.solutions,
      newCases,
      changes,
    });
  }

  console.log(`Problems with string params: ${stringParamProblems}`);
  console.log(`Expected-field unwraps (string-return): ${expectedFixes}`);
  console.log(`Problems with >=1 Pattern-1 case: ${affected.length}`);
  console.log(`Total cases that would be unwrapped: ${totalCasesToUnwrap}`);

  // Preflight only the first PREFLIGHT_LIMIT affected problems.
  const sample = affected.slice(0, PREFLIGHT_LIMIT);
  const passed = new Set();
  const skips = []; // { id, reason }
  console.log(`\nPreflighting first ${sample.length} affected problem(s) through run-code...`);
  for (const a of sample) {
    process.stdout.write(`  ${a.id} ... `);
    const r = await preflight(a, a.newCases);
    if (r.ok) { passed.add(a.id); console.log('ok'); }
    else { skips.push({ id: a.id, reason: r.reason }); console.log(`SKIP (${r.reason})`); }
  }
  const notPreflighted = affected.slice(PREFLIGHT_LIMIT).map((a) => a.id);

  const report = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    preflightLimit: PREFLIGHT_LIMIT,
    counts: {
      scanned,
      stringParamProblems,
      pattern1AffectedProblems: affected.length,
      totalCasesToUnwrap,
      expectedFixes,
      preflightSampled: sample.length,
      preflightPassed: passed.size,
      preflightSkipped: skips.length,
      notPreflighted: notPreflighted.length,
    },
    preflightSkips: skips,
    notPreflighted,
    affectedProblems: affected.map((a) => ({
      id: a.id,
      preflight: passed.has(a.id) ? 'pass' : (skips.find((s) => s.id === a.id) ? 'skip' : 'not-sampled'),
      casesTouched: new Set(a.changes.map((c) => c.caseIndex)).size,
      changeCount: a.changes.length,
      changes: a.changes,
    })),
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport written: ${REPORT_PATH}`);
  console.log(`Preflight: ${passed.size} passed, ${skips.length} skipped (${notPreflighted.length} not sampled).`);

  if (!APPLY) {
    console.log('\n(DRY-RUN — DB NOT written. Re-run with --apply to persist preflight-passed problems.)');
    return;
  }

  // --apply: write only preflight-passed problems. Skipped and un-sampled
  // problems are never written — we never persist an unverified correction.
  let written = 0;
  for (const a of affected) {
    if (!passed.has(a.id)) continue;
    const { error } = await sb.from('PGcode_problems').update({ test_cases: a.newCases }).eq('id', a.id);
    if (error) console.log(`  ${a.id}: write failed: ${error.message.slice(0, 80)}`);
    else { written++; console.log(`  ${a.id}: updated (${a.changes.length} field fixes)`); }
  }
  console.log(`\nApplied: ${written} problem(s) updated.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
