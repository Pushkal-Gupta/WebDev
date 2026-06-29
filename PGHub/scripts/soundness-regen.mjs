#!/usr/bin/env node
// Soundness sweep: the stored canonical `solutions.python` is the ORACLE.
// For every problem with a real canonical + cases:
//   1) (optional) prune cases that fall clearly outside parsed constraints
//   2) re-grade each remaining case by RUNNING the canonical on its inputs via
//      Judge0; where canonical output != stored `expected`, REGENERATE `expected`
//      from the canonical's own output (the canonical is the oracle).
//   3) if the canonical crashes / NZECs on a valid in-constraint input, leave the
//      whole suite untouched and FLAG the problem.
// Never drops a problem below MIN_CASES.
//
// Read-modify-write PER PROBLEM (re-read test_cases immediately before writing)
// so concurrent APPEND-only watchdogs are not clobbered. We only ever (a) drop
// out-of-constraint cases we identified and (b) rewrite the `expected` of a case
// whose `inputs` still match — matched by JSON(inputs); appended cases we never
// graded are preserved as-is.
//
// Usage:
//   node scripts/soundness-regen.mjs --only angle-between-hands-of-a-clock --verbose
//   node scripts/soundness-regen.mjs --max 400 --offset 0
//   node scripts/soundness-regen.mjs --max 400 --offset 400 --prune
//   node scripts/soundness-regen.mjs --dry              # grade + report, NO write
//
// Secrets: process.env only (loaded from .env). Never printed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart, ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';
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
const has = (n) => argv.includes(`--${n}`);
const val = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = argv[i + 1];
  return (v && !v.startsWith('--')) ? v : d;
};
const DRY = has('dry');
const PRUNE = has('prune');
const VERBOSE = has('verbose');
const ONLY = val('only') ? val('only').split(',').map(s => s.trim()).filter(Boolean) : null;
const MAX = val('max') != null ? Number(val('max')) : Infinity;
const OFFSET = Number(val('offset') || 0);
const MIN_CASES = 2;
const JUDGE0_URL = (val('judge0') || process.env.JUDGE0_URL || 'http://localhost:2358').replace(/\/$/, '');
const JUDGE0_AUTH = val('auth') || process.env.JUDGE0_AUTH_TOKEN || '';
const J0_HEADERS = JUDGE0_AUTH
  ? { 'content-type': 'application/json', 'X-Auth-Token': JUDGE0_AUTH }
  : { 'content-type': 'application/json' };
const PAUSE_MS = Number(val('pause') || 0);
const LOG = val('log') || path.join(__dirname, '..', 'soundness-regen.log');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function logln(s) {
  const line = s.endsWith('\n') ? s : s + '\n';
  process.stdout.write(line);
  try { fs.appendFileSync(LOG, line); } catch { /* best effort */ }
}

const PY = 71;

function codeOf(entry) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && typeof entry.code === 'string') return entry.code;
  return '';
}
function isStub(code) {
  if (!code) return true;
  const body = code.trim();
  if (body.length < 12) return true;
  const stripped = body
    .replace(/(^|\n)\s*(#|\/\/).*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  if (stripped.length < 12) return true;
  if (/^\s*(pass|\.\.\.|return\s*(None|null|0|;)?\s*)$/i.test(stripped)) return true;
  return false;
}

async function judgeRun(sourceCode, stdin) {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: J0_HEADERS,
        body: JSON.stringify({
          language_id: PY,
          source_code: sourceCode,
          stdin,
          cpu_time_limit: 6,
          wall_time_limit: 12,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${body.slice(0, 120)}`);
      }
      const data = await res.json();
      const status = (data?.status?.description || '').toLowerCase();
      if (status && status !== 'accepted') {
        const detail = (data.stderr || data.compile_output || data.message || status).toString().slice(0, 220);
        return { ok: false, stdout: '', error: `${data?.status?.description}: ${detail}` };
      }
      return { ok: true, stdout: (data.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, ''), error: null };
    } catch (e) {
      lastErr = e;
      await sleep(400 * attempt * attempt);
    }
  }
  return { ok: false, stdout: '', error: `judge0 unreachable: ${lastErr?.message || 'unknown'}` };
}

async function fetchProblems() {
  const out = [];
  let page = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id, method_name, params, return_type, constraints, solutions, test_cases')
      .order('id', { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const r of data) out.push(r);
    if (data.length < PAGE) break;
    page++;
  }
  return out;
}

// Re-read a single problem's test_cases immediately before write (avoid clobber).
async function freshCases(id) {
  const { data, error } = await sb.from('PGcode_problems')
    .select('test_cases').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return Array.isArray(data?.test_cases) ? data.test_cases : [];
}

const stats = {
  scanned: 0,
  noCanonical: 0,
  noTests: 0,
  flaggedCrash: 0,
  prunedCases: 0,
  regenCases: 0,
  problemsTouched: 0,
  problemsSound: 0,       // canonical passes 100% of its (post-fix) cases
  problemsUnsound: 0,     // still has divergence we couldn't fix (crash flagged)
  flaggedList: [],
};

async function processProblem(p) {
  stats.scanned++;
  const id = p.id;
  const canonPy = codeOf(p.solutions?.python);
  if (!canonPy || isStub(canonPy)) { stats.noCanonical++; return; }
  if (!Array.isArray(p.test_cases) || p.test_cases.length === 0) { stats.noTests++; return; }
  if (!Array.isArray(p.params) || p.params.length === 0) { stats.noCanonical++; return; }

  let wrapped;
  try {
    wrapped = wrapWithDriver(canonPy, 'python', p.method_name, p.params, p.return_type);
  } catch (e) {
    stats.flaggedCrash++;
    stats.flaggedList.push({ id, why: `wrap-error: ${e.message.slice(0, 60)}` });
    stats.problemsUnsound++;
    if (VERBOSE) logln(`  ${id}: FLAG wrap-error ${e.message.slice(0, 60)}`);
    return;
  }

  // 1) constraint prune (in-memory; we track ids to drop by JSON(inputs))
  const bounds = parseBounds(p.constraints || '', p.params);
  const orderIns = ORDER_INSENSITIVE.has(id);

  // Grade every case: run canonical on its inputs.
  // We classify each case index as: keep-good, prune(out-of-constraint),
  // regen(canonical-ok but expected differs), crash(canonical NZEC -> flag).
  const cases = p.test_cases;
  const decisions = []; // {idx, kind, newExpected?}
  let crashed = false;
  let crashDetail = '';

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const inputs = Array.isArray(tc?.inputs) ? tc.inputs : null;
    if (!inputs) { decisions.push({ idx: i, kind: 'keep' }); continue; }

    // out-of-constraint?
    if (PRUNE) {
      const v = validateInputs(inputs, p.params, bounds);
      if (!v.ok) { decisions.push({ idx: i, kind: 'prune', why: v.violations.join('; ') }); continue; }
    }

    const stdin = buildStdin(inputs) + '\n';
    const r = await judgeRun(wrapped, stdin);
    if (PAUSE_MS) await sleep(PAUSE_MS);
    if (!r.ok) {
      // canonical crashed on a valid in-constraint input -> flag whole problem
      crashed = true;
      crashDetail = `case ${i} inputs=${JSON.stringify(inputs).slice(0, 60)} :: ${r.error?.slice(0, 90)}`;
      break;
    }
    const out = r.stdout;
    if (compareOutputSmart(out, tc.expected, { orderInsensitive: orderIns })) {
      decisions.push({ idx: i, kind: 'keep' });
    } else {
      decisions.push({ idx: i, kind: 'regen', newExpected: out });
    }
  }

  if (crashed) {
    stats.flaggedCrash++;
    stats.problemsUnsound++;
    let cat = 'canonical-crash';
    if (/has no attribute/.test(crashDetail)) cat = 'method-name-mismatch';
    else if (/Promise|async|await/i.test(p.return_type + JSON.stringify(p.params))) cat = 'async-design-class';
    else if (/object of type 'int' has no len|expected string|not subscriptable/.test(crashDetail)) cat = 'harness-deserialize';
    else if (/NoneType|attribute 'val'|attribute 'next'|ListNode|TreeNode/.test(crashDetail)) cat = 'linked-structure-input';
    stats.flaggedList.push({ id, cat, why: crashDetail });
    stats.flagCats = stats.flagCats || {};
    stats.flagCats[cat] = (stats.flagCats[cat] || 0) + 1;
    logln(`  ${id}: FLAG [${cat}] left untouched (${crashDetail.slice(0, 80)})`);
    return;
  }

  const pruneCount = decisions.filter(d => d.kind === 'prune').length;
  const regenCount = decisions.filter(d => d.kind === 'regen').length;

  if (pruneCount === 0 && regenCount === 0) {
    stats.problemsSound++;
    if (VERBOSE) logln(`  ${id}: OK (${cases.length} cases, 100% sound)`);
    return;
  }

  // Floor guard: dropping prunes must not take us below MIN_CASES.
  const keptAfterPrune = cases.length - pruneCount;
  let applyPrune = PRUNE;
  if (PRUNE && keptAfterPrune < MIN_CASES) {
    applyPrune = false; // keep the out-of-constraint cases rather than gut the suite
    logln(`  ${id}: prune skipped (would leave ${keptAfterPrune} < ${MIN_CASES}); regen only`);
  }

  // Build the index->action maps keyed by JSON(inputs) so we apply against a FRESH
  // read (concurrent appends preserved).
  const pruneKeys = new Set();
  const regenMap = new Map(); // JSON(inputs) -> newExpected
  for (const d of decisions) {
    const tc = cases[d.idx];
    const key = JSON.stringify(tc?.inputs ?? null);
    if (d.kind === 'prune' && applyPrune) pruneKeys.add(key);
    if (d.kind === 'regen') regenMap.set(key, d.newExpected);
  }

  if (DRY) {
    stats.prunedCases += applyPrune ? pruneCount : 0;
    stats.regenCases += regenCount;
    stats.problemsTouched++;
    stats.problemsSound++; // would be sound after applying
    logln(`  ${id}: [dry] prune ${applyPrune ? pruneCount : 0}, regen ${regenCount} (of ${cases.length})`);
    return;
  }

  // ── read-modify-write against a FRESH snapshot ──
  let fresh;
  try { fresh = await freshCases(id); } catch (e) {
    logln(`  ${id}: re-read FAILED (${e.message.slice(0, 60)}) — skipped`);
    return;
  }
  const next = [];
  let appliedPrune = 0, appliedRegen = 0;
  for (const tc of fresh) {
    const key = JSON.stringify(tc?.inputs ?? null);
    if (pruneKeys.has(key)) { appliedPrune++; continue; }
    if (regenMap.has(key)) {
      next.push({ ...tc, expected: regenMap.get(key) });
      appliedRegen++;
    } else {
      next.push(tc);
    }
  }
  if (next.length < MIN_CASES) {
    logln(`  ${id}: write skipped (fresh result < ${MIN_CASES} after prune)`);
    return;
  }
  const { error } = await sb.from('PGcode_problems').update({ test_cases: next }).eq('id', id);
  if (error) {
    logln(`  ${id}: WRITE FAILED ${error.message.slice(0, 80)}`);
    return;
  }
  stats.prunedCases += appliedPrune;
  stats.regenCases += appliedRegen;
  stats.problemsTouched++;
  stats.problemsSound++;
  logln(`  ${id}: fixed — pruned ${appliedPrune}, regen-expected ${appliedRegen} (${fresh.length} -> ${next.length})`);
}

async function main() {
  logln(`\n==== soundness-regen ${new Date().toISOString()} ${DRY ? '(DRY)' : ''}${PRUNE ? ' +prune' : ''} judge0=${JUDGE0_URL} ====`);
  let problems = await fetchProblems();
  logln(`Loaded ${problems.length} problems.`);
  if (ONLY) {
    problems = problems.filter(p => ONLY.includes(p.id));
    logln(`--only -> ${problems.length} problems.`);
  } else {
    problems = problems.slice(OFFSET, OFFSET + (MAX === Infinity ? problems.length : MAX));
    logln(`Window offset=${OFFSET} max=${MAX === Infinity ? 'all' : MAX} -> ${problems.length} problems.`);
  }

  for (const p of problems) {
    try { await processProblem(p); }
    catch (e) { logln(`  ${p.id}: ERROR ${e.message?.slice(0, 100)}`); }
  }

  const considered = stats.scanned - stats.noCanonical - stats.noTests;
  logln('\n──────────── SUMMARY ────────────');
  logln(`Problems scanned:            ${stats.scanned}`);
  logln(`  no real canonical:         ${stats.noCanonical}`);
  logln(`  no test cases:             ${stats.noTests}`);
  logln(`Gradeable (canon+cases):     ${considered}`);
  logln(`Out-of-constraint pruned:    ${stats.prunedCases}`);
  logln(`Cases expected-regenerated:  ${stats.regenCases}`);
  logln(`Problems touched (written):  ${stats.problemsTouched}`);
  logln(`Problems sound (100% pass):  ${stats.problemsSound}`);
  logln(`Problems FLAGGED (crash):    ${stats.flaggedCrash}`);
  if (considered > 0) {
    logln(`Soundness rate:              ${(stats.problemsSound / considered * 100).toFixed(1)}% of gradeable`);
  }
  if (stats.flagCats) {
    logln('\nFlag categories:');
    for (const [c, n] of Object.entries(stats.flagCats).sort((a, b) => b[1] - a[1])) logln(`  ${c}: ${n}`);
  }
  if (stats.flaggedList.length) {
    logln('\nFlagged ids (left untouched):');
    for (const f of stats.flaggedList.slice(0, 60)) logln(`  ${f.id} [${f.cat}]`);
    if (stats.flaggedList.length > 60) logln(`  ...and ${stats.flaggedList.length - 60} more`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
