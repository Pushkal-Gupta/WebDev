#!/usr/bin/env node
// Grade authored Python solutions for stub-targets slice [450,500) against the
// PRESERVED stored test_cases via local Judge0, then read-modify-write
// PGcode_problems.solutions.python ONLY (preserving other langs) on 100% pass.
//
// Authored Python lives in scripts/sol-batches/stub-slice-450-500.mjs keyed by id.
//
//   node scripts/run-stub-slice.mjs --dry            # grade, no write
//   node scripts/run-stub-slice.mjs                  # grade + write on full pass
//   node scripts/run-stub-slice.mjs --only id1,id2   # subset
//   node scripts/run-stub-slice.mjs --sample 0       # grade ALL cases (default: all)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart, ORDER_INSENSITIVE } from './sol-batches/grade-helpers.mjs';
import AUTHORED from './sol-batches/stub-slice-450-500.mjs';

// Slice-local order-insensitive ids (results valid in any order).
ORDER_INSENSITIVE.add('different-ways-to-add-parentheses');
ORDER_INSENSITIVE.add('double-modular-exponentiation');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SVC) { console.error('Need supabase creds in .env'); process.exit(1); }
const sb = createClient(SUPA_URL, SVC);

const argv = process.argv.slice(2);
const has = (n) => argv.includes(`--${n}`);
const val = (n, d = null) => { const i = argv.indexOf(`--${n}`); if (i === -1) return d; const v = argv[i + 1]; return (v && !v.startsWith('--')) ? v : d; };
const DRY = has('dry');
const ONLY = val('only') ? val('only').split(',').map(s => s.trim()).filter(Boolean) : null;
const JUDGE0_URL = (val('judge0') || process.env.JUDGE0_URL || 'http://localhost:2358').replace(/\/$/, '');
const JUDGE0_AUTH = val('auth') || process.env.JUDGE0_AUTH_TOKEN || '';
const J0_HEADERS = JUDGE0_AUTH ? { 'content-type': 'application/json', 'X-Auth-Token': JUDGE0_AUTH } : { 'content-type': 'application/json' };
const PAUSE_MS = Number(val('pause') || 60);
const SAMPLE = Number(val('sample') ?? 0); // 0 = ALL cases (default for trust)
const PY_ID = 71;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function judgeRun(sourceCode, stdin) {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST', headers: J0_HEADERS,
        body: JSON.stringify({ language_id: PY_ID, source_code: sourceCode, stdin, cpu_time_limit: 8, wall_time_limit: 15 }),
      });
      if (!res.ok) { const b = await res.text().catch(() => ''); throw new Error(`HTTP ${res.status} ${b.slice(0, 120)}`); }
      const data = await res.json();
      const status = (data?.status?.description || '').toLowerCase();
      if (status && status !== 'accepted') {
        const detail = (data.stderr || data.compile_output || data.message || status).toString().slice(0, 260);
        return { ok: false, stdout: '', error: `${data?.status?.description}: ${detail}` };
      }
      return { ok: true, stdout: (data.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, ''), error: null };
    } catch (e) { lastErr = e; await sleep(500 * attempt * attempt); }
  }
  return { ok: false, stdout: '', error: `judge0 unreachable: ${lastErr?.message || 'unknown'}` };
}

function pickIdxs(n) {
  if (SAMPLE <= 0 || n <= SAMPLE) return [...Array(n).keys()];
  const head = [0, 1, 2].filter(i => i < n);
  const rest = SAMPLE - head.length; const spread = [];
  for (let k = 0; k < rest; k++) spread.push(3 + Math.round((k * (n - 4)) / Math.max(1, rest - 1)));
  return [...new Set([...head, ...spread])].sort((a, b) => a - b);
}

async function gradePython(problem, code) {
  const { method_name, params, return_type } = problem;
  let wrapped;
  try { wrapped = wrapWithDriver(code, 'python', method_name, params, return_type); }
  catch (e) { return { pass: false, passed: 0, total: 0, reason: `wrap error: ${e.message.slice(0, 100)}` }; }
  const cases = Array.isArray(problem.test_cases) ? problem.test_cases : [];
  const idxs = pickIdxs(cases.length);
  let passed = 0, skipped = 0;
  const corrupted = [];
  for (const i of idxs) {
    const tc = cases[i];
    // Ungradeable cases: null / empty-string / missing expected. Treat as corrupted,
    // not as a wrong answer — they cannot validate a correct solution.
    if (!tc || tc.expected === null || tc.expected === undefined || String(tc.expected).trim() === '') {
      skipped++; corrupted.push({ i, inputs: tc?.inputs, expected: tc?.expected });
      continue;
    }
    const stdin = buildStdin(tc.inputs) + '\n';
    const r = await judgeRun(wrapped, stdin);
    if (!r.ok) return { pass: false, passed, total: idxs.length, skipped, corrupted, reason: `case ${i}: ${r.error?.slice(0, 180)}`, failInputs: tc.inputs };
    if (!compareOutputSmart(r.stdout, tc.expected, { orderInsensitive: ORDER_INSENSITIVE.has(problem.id) }))
      return { pass: false, passed, total: idxs.length, skipped, corrupted, reason: `case ${i} WA: got ${JSON.stringify(r.stdout).slice(0, 80)} want ${JSON.stringify(tc.expected).slice(0, 80)}`, failInputs: tc.inputs };
    passed++; await sleep(PAUSE_MS);
  }
  return { pass: true, passed, total: idxs.length, skipped, corrupted, reason: null };
}

async function processOne(id) {
  const { data: problem, error } = await sb.from('PGcode_problems')
    .select('id, name, description, constraints, method_name, params, return_type, test_cases, solutions').eq('id', id).maybeSingle();
  if (error || !problem) return { id, status: 'error', note: error?.message || 'not found' };
  const cases = Array.isArray(problem.test_cases) ? problem.test_cases : [];
  if (cases.length < 2) return { id, status: 'skip-no-tests', note: `only ${cases.length} test cases` };
  const allNull = cases.every(c => !c || c.expected === null || c.expected === undefined);
  if (allNull) return { id, status: 'skip-null-expected', note: 'all expected are null' };
  const code = AUTHORED[id];
  if (!code) return { id, status: 'no-authored', note: 'no authored python yet' };

  const g = await gradePython(problem, code);
  if (!g.pass) return { id, status: 'FAIL', note: `${g.passed}/${g.total} — ${g.reason}`, failInputs: g.failInputs, corrupted: g.corrupted };

  const cnote = g.skipped ? ` (+${g.skipped} corrupted skipped)` : '';
  if (DRY) return { id, status: 'PASS-dry', note: `${g.passed}/${g.total}${cnote}`, corrupted: g.corrupted };

  // read-modify-write: re-read solutions, preserve other langs
  const { data: fresh } = await sb.from('PGcode_problems').select('solutions').eq('id', id).maybeSingle();
  const existing = (fresh?.solutions && typeof fresh.solutions === 'object') ? fresh.solutions : {};
  const merged = { ...existing, python: { code, approach: AUTHORED[`__approach_${id}`] || '', complexity: AUTHORED[`__complexity_${id}`] || '' } };
  const { error: upErr } = await sb.from('PGcode_problems').update({ solutions: merged }).eq('id', id);
  if (upErr) return { id, status: 'db-error', note: upErr.message };
  return { id, status: 'WRITTEN', note: `${g.passed}/${g.total}${cnote}`, corrupted: g.corrupted };
}

async function main() {
  const all = JSON.parse(fs.readFileSync(path.join(__dirname, 'stub-targets.json'), 'utf8'));
  const corrupt = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'stub-corrupted-expected.json'), 'utf8')));
  let slice = all.slice(450, 500).filter(s => !corrupt.has(s));
  if (ONLY) slice = slice.filter(s => ONLY.includes(s));
  console.log(`run-stub-slice ${DRY ? '(DRY)' : '(LIVE)'} | Judge0 ${JUDGE0_URL} | sample=${SAMPLE || 'ALL'} | targets ${slice.length}\n`);
  const results = [];
  for (const id of slice) {
    process.stdout.write(`▶ ${id.padEnd(58)} `);
    const r = await processOne(id);
    results.push(r);
    console.log(`${r.status}  ${r.note || ''}`);
  }
  console.log('\n================ SUMMARY ================');
  const by = {};
  for (const r of results) { (by[r.status] ??= []).push(r.id); }
  for (const [st, ids] of Object.entries(by)) console.log(`${st.padEnd(20)} ${ids.length}`);
  fs.writeFileSync('/tmp/stub_slice_results.json', JSON.stringify(results, null, 2));
  console.log('\nresults -> /tmp/stub_slice_results.json');
}
main().catch(e => { console.error(e); process.exit(1); });
