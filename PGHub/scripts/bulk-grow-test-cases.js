#!/usr/bin/env node
// Bulk-grow test_cases on every PGcode_problems row that has a real Python
// reference solution (solutions.python.code or solutions.python as string)
// up to a configurable target (default 50). Mirrors the canonical approach
// from grow-test-cases.js: wrap the Python with the shared driver, ship the
// generated stdin through Judge0 public CE, and capture the printed output
// as the expected value.
//
// Usage:
//   node scripts/bulk-grow-test-cases.js --dry --slug contains-duplicate    # 3-case dry-run
//   node scripts/bulk-grow-test-cases.js --max 20                           # first 20 candidates
//   node scripts/bulk-grow-test-cases.js --max 50 --resume                  # next chunk, skip done
//   node scripts/bulk-grow-test-cases.js --target 50 --addCap 30            # default tuning
//
// Notes
// - Curated flagships (the 16 in RICH_CONTENT) are owned by grow-test-cases.js
//   and are skipped here unless --include-curated is set.
// - Stub-only Python solutions (just `pass` / `return None` / `...`) are
//   detected and skipped — no point in running them through Judge0.
// - Default cap is 30 new cases per problem (not 50) to be conservative on
//   Judge0 quota; existing samples cover the rest of the target.
// - Log is persisted to /tmp/bulk-grow-log.json so --resume knows what to skip.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';

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

// ── args ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};
const onlySlug = arg('slug');
const isDry = !!arg('dry');
const TARGET = Number(arg('target') || 50);
const ADD_CAP = Number(arg('addCap') || 30);
const MAX_PROBLEMS = Number(arg('max') || 50);
const PAUSE_MS = Number(arg('pause') || 450);
const RESUME = !!arg('resume');
const INCLUDE_CURATED = !!arg('include-curated');
const JUDGE0_URL = arg('judge0') || process.env.JUDGE0_URL || 'https://ce.judge0.com';
// Self-hosted Judge0 protects its API with an X-Auth-Token header; the public CE
// needs none. Set JUDGE0_AUTH_TOKEN in the env to point this drive at a local
// instance (unlimited submissions, no rate limit).
const JUDGE0_AUTH = arg('auth') || process.env.JUDGE0_AUTH_TOKEN || '';
const J0_HEADERS = JUDGE0_AUTH
  ? { 'content-type': 'application/json', 'X-Auth-Token': JUDGE0_AUTH }
  : { 'content-type': 'application/json' };
const PYTHON_LANG_ID = 71;

const LOG_PATH = '/tmp/bulk-grow-log.json';

// Slugs the curated grow-test-cases.js agent owns — defer to it unless asked otherwise.
const CURATED_SLUGS = new Set([
  'two-sum', 'contains-duplicate', 'valid-anagram', 'valid-palindrome',
  'two-sum-ii-input-array-is-sorted', 'max-subarray', 'maximum-subarray',
  'valid-parentheses', 'climbing-stairs', 'reverse-linked-list', 'binary-search',
  'binary-tree-level-order-traversal-ii', 'convert-sorted-array-to-binary-search-tree',
  'product-of-array-except-self', 'house-robber', 'best-time-to-buy-and-sell-stock',
  'coin-change',
]);

// ── log helpers ──────────────────────────────────────────────────────────────
function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')); }
  catch { return { runs: [], processed: {} }; }
}
function saveLog(log) {
  try { fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2)); }
  catch (e) { console.warn(`log save failed: ${e.message}`); }
}

// ── stub detection ───────────────────────────────────────────────────────────
function isStubSolution(code) {
  if (!code || !code.trim()) return true;
  const lines = code.split('\n');
  const bodyLines = lines.filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (t.startsWith('#')) return false;
    if (t.startsWith('from ') || t.startsWith('import ')) return false;
    if (t.startsWith('class ') || t.startsWith('def ')) return false;
    return true;
  });
  if (bodyLines.length === 0) return true;
  // If every body line is a stub keyword, it's a stub.
  const stubLine = (s) => {
    const t = s.trim();
    if (t === 'pass' || t === '...' || t === 'return') return true;
    if (/^return\s+None\b/.test(t)) return true;
    if (/^return\s*\(\s*\)\s*$/.test(t)) return true;
    return false;
  };
  return bodyLines.every(stubLine);
}

// ── RNG helpers ──────────────────────────────────────────────────────────────
const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const choice = (xs) => xs[rand(0, xs.length - 1)];
const randFloat = (lo, hi) => Math.random() * (hi - lo) + lo;

function randIntArr(len, lo, hi) {
  return Array.from({ length: len }, () => rand(lo, hi));
}

// ── per-type input generator ─────────────────────────────────────────────────
// Returns a JSON-stringified value suitable for the driver's `json.loads(line)`.
function genForType(type, _name) {
  const t = String(type || '').trim();

  // Scalar int — bias to small + edges, but expand to 10^4 range occasionally.
  if (t === 'int' || t === 'integer' || t === 'long') {
    const edge = [0, 1, 2, -1, -2, 5, 10, 100];
    if (Math.random() < 0.25) return String(choice(edge));
    if (Math.random() < 0.2) return String(rand(-50, 50));
    if (Math.random() < 0.7) return String(rand(1, 100));
    return String(rand(-1000, 1000));
  }
  if (t === 'float' || t === 'double') {
    if (Math.random() < 0.2) return String(choice([0, 1, -1, 0.5, -0.5]));
    return randFloat(-100, 100).toFixed(4);
  }
  if (t === 'bool' || t === 'boolean') {
    return Math.random() < 0.5 ? 'true' : 'false';
  }

  // String — rotate the CHARSET across attempts so domain-specific problems
  // (binary strings, digit strings, parentheses, uppercase, etc.) get inputs
  // their canonical solution actually accepts. A random a-z string makes a
  // binary-addition or digit-parsing solution error and the case gets dropped;
  // by sometimes drawing from "01", "0-9", "()[]{}", "A-Z" we let SOME attempts
  // satisfy each problem's alphabet, and the retry budget collects enough.
  if (t === 'str' || t === 'string') {
    const CHARSETS = [
      'abcdefghijklmnopqrstuvwxyz',  // lowercase English (most common)
      'abcdefghijklmnopqrstuvwxyz',  // weight lowercase ~2x
      '01',                          // binary strings
      '0123456789',                  // digit strings
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',  // uppercase
      'abcABC123',                   // mixed alphanumeric
      '()[]{}',                      // bracket/parenthesis problems
      'ab',                          // tiny alphabet (high collision / pattern)
    ];
    const pool = choice(CHARSETS);
    // Length distribution: bias short with edges (empty + single char) but reach 18.
    const lenRoll = Math.random();
    const len = lenRoll < 0.12 ? 0 : lenRoll < 0.22 ? 1 : rand(2, 18);
    let s = '';
    for (let i = 0; i < len; i++) s += pool[rand(0, pool.length - 1)];
    return JSON.stringify(s);
  }

  // List[int]
  if (t === 'List[int]' || t === 'int[]' || t === 'Array<int>' || t === 'List<int>') {
    const len = (Math.random() < 0.1) ? 0 : rand(1, 15);
    // 30% sorted, 10% all-same, 60% random
    let arr;
    const r = Math.random();
    if (r < 0.1 && len > 0) {
      const v = rand(-20, 20);
      arr = Array.from({ length: len }, () => v);
    } else {
      arr = randIntArr(len, -50, 50);
      if (r < 0.4) arr.sort((a, b) => a - b);
    }
    return JSON.stringify(arr);
  }
  if (t === 'List[bool]') {
    const len = rand(0, 12);
    return JSON.stringify(Array.from({ length: len }, () => Math.random() < 0.5));
  }
  if (t === 'List[float]') {
    const len = rand(1, 8);
    return JSON.stringify(Array.from({ length: len }, () => parseFloat(randFloat(-50, 50).toFixed(3))));
  }
  if (t === 'List[str]' || t === 'string[]') {
    const len = (Math.random() < 0.1) ? 0 : rand(1, 8);
    // One charset per array so the whole list shares an alphabet (words, binary
    // codes, digit tokens) the way real problems present them.
    const pool = choice([
      'abcdefghijklmnopqrstuvwxyz',
      'abcdefghijklmnopqrstuvwxyz',
      '01',
      '0123456789',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ]);
    const strs = Array.from({ length: len }, () => {
      const L = rand(1, 6);
      let s = '';
      for (let i = 0; i < L; i++) s += pool[rand(0, pool.length - 1)];
      return s;
    });
    return JSON.stringify(strs);
  }

  // List[List[int]] — matrices / edge lists / interval lists. 2..5 rows, 2..4 cols.
  // Also covers bare List[List] (untyped inner) — default the inner to ints.
  if (t === 'List[List[int]]' || t === 'int[][]' || t === 'matrix' || t === 'List[List]') {
    const rows = rand(1, 5);
    const cols = rand(1, 4);
    const grid = Array.from({ length: rows }, () => randIntArr(cols, -10, 20));
    return JSON.stringify(grid);
  }
  // List[Any] — untyped list; default to a small int list (the common case).
  if (t === 'List[Any]' || t === 'List' || t === 'Array' || t === 'list') {
    const len = (Math.random() < 0.1) ? 0 : rand(1, 12);
    return JSON.stringify(randIntArr(len, -30, 30));
  }
  if (t === 'List[List[str]]') {
    const rows = rand(1, 4);
    const cols = rand(1, 4);
    const alpha = 'abcdefghij';
    const grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => {
        const L = rand(1, 3);
        let s = '';
        for (let i = 0; i < L; i++) s += alpha[rand(0, alpha.length - 1)];
        return s;
      }),
    );
    return JSON.stringify(grid);
  }
  if (t === 'List[List[List[int]]]') {
    const a = rand(1, 3), b = rand(1, 3), c = rand(1, 3);
    const cube = Array.from({ length: a }, () =>
      Array.from({ length: b }, () => randIntArr(c, -10, 10)),
    );
    return JSON.stringify(cube);
  }

  // Linked list / tree are passed as level-order arrays; driver converts them.
  if (t === 'ListNode' || t === 'Optional[ListNode]') {
    const len = rand(0, 12);
    return JSON.stringify(randIntArr(len, -50, 50));
  }
  if (t === 'TreeNode' || t === 'Optional[TreeNode]') {
    // small valid tree shapes including empty
    if (Math.random() < 0.15) return JSON.stringify([]);
    const size = rand(1, 12);
    const out = [rand(-20, 20)];
    let nonNull = 1;
    for (let i = 1; i < size * 2; i++) {
      if (out.length >= size + 4) break;
      if (Math.random() < 0.75 && nonNull > 0) {
        out.push(rand(-20, 20));
        nonNull++;
      } else {
        out.push(null);
        nonNull--;
        if (nonNull <= 0) break;
      }
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return JSON.stringify(out);
  }

  // Dict[str, int] / map-like — small string-keyed integer maps.
  if (t === 'Dict[str, int]' || t === 'Dict[str,int]' || t === 'dict' || t === 'Dict' ||
      t === 'Map<str, int>' || t === 'HashMap') {
    const keys = 'abcdefghijklmnopqrstuvwxyz';
    const n = rand(0, 5);
    const obj = {};
    const used = new Set();
    for (let i = 0; i < n; i++) {
      let k = keys[rand(0, 25)];
      while (used.has(k)) k = keys[rand(0, 25)];
      used.add(k);
      obj[k] = rand(-20, 50);
    }
    return JSON.stringify(obj);
  }
  if (t === 'Dict[int, int]' || t === 'Dict[int,int]') {
    const n = rand(0, 5);
    const obj = {};
    for (let i = 0; i < n; i++) obj[String(rand(0, 30))] = rand(-20, 50);
    return JSON.stringify(obj);
  }

  // Any / Table / truly unknown — give up cleanly.
  return null;
}

// Build a full input row (one stringified value per param).
function genInputs(params) {
  const out = [];
  for (const p of params) {
    const v = genForType(p.type, p.name);
    if (v === null) return null;
    out.push(v);
  }
  return out;
}

// Cross-parameter sanity hooks. Some signatures have an implicit constraint
// (e.g. target ≤ sum(coins); k ≤ nums.length) that random generation will
// frequently violate, leading to trivial "no result" outputs. These are best-
// effort: if a hook decides the case is silly, return null and we retry.
function sanityHookOk(params, inputs) {
  if (!params || !inputs) return true;
  // (params, target int) — like binary-search target, two-sum etc — random ints OK.
  // (List[int] nums, int k) — clamp k to 1..len.
  if (params.length === 2 && params[0].type === 'List[int]' &&
      params[1].type === 'int' && (params[1].name === 'k' || params[1].name === 'K')) {
    try {
      const arr = JSON.parse(inputs[0]);
      const k = parseInt(inputs[1], 10);
      if (!Number.isFinite(k)) return false;
      if (arr.length === 0) return false;
      if (k < 1 || k > arr.length) return false;
    } catch { return false; }
  }
  return true;
}

// ── Judge0 client ────────────────────────────────────────────────────────────
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function judgeRun(sourceCode, stdin) {
  const url = `${JUDGE0_URL.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: J0_HEADERS,
        body: JSON.stringify({
          language_id: PYTHON_LANG_ID,
          source_code: sourceCode,
          stdin,
          cpu_time_limit: 5,
          wall_time_limit: 8,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${body.slice(0, 100)}`);
      }
      const data = await res.json();
      const status = (data?.status?.description || '').toLowerCase();
      const ok = status === 'accepted' || status === '';
      if (!ok) {
        const detail = (data.stderr || data.compile_output || data.message || status).toString().slice(0, 120);
        throw new Error(`${data?.status?.description || 'error'}: ${detail}`);
      }
      return (data.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
    } catch (e) {
      lastErr = e;
      await sleep(500 * attempt * attempt);
    }
  }
  throw lastErr;
}

// ── per-problem grow loop ───────────────────────────────────────────────────
async function growForProblem(problem, opts = {}) {
  const { id, method_name, params, return_type, test_cases } = problem;

  if (!Array.isArray(params) || params.length === 0) {
    return { id, before: 0, after: 0, added: 0, dedupd: 0, skipped: 'no params' };
  }

  const pyEntry = problem.solutions?.python;
  const py = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
  if (!py) return { id, before: 0, after: 0, added: 0, dedupd: 0, skipped: 'no python solution' };
  if (isStubSolution(py)) {
    return { id, before: (test_cases || []).length, after: (test_cases || []).length, added: 0, dedupd: 0, skipped: 'stub python solution' };
  }

  // Confirm every param type has a generator.
  if (params.some(p => genForType(p.type, p.name) === null)) {
    return { id, before: (test_cases || []).length, after: (test_cases || []).length, added: 0, dedupd: 0, skipped: `unsupported param type (${params.map(p => p.type).join(', ')})` };
  }

  const existing = Array.isArray(test_cases) ? test_cases : [];
  const beforeCount = existing.length;
  const target = opts.dryCount ? beforeCount + opts.dryCount : TARGET;
  if (!opts.dryCount && beforeCount >= target) {
    return { id, before: beforeCount, after: beforeCount, added: 0, dedupd: 0, skipped: `already >= ${target}` };
  }

  const need = Math.min(opts.dryCount || (target - beforeCount), ADD_CAP);
  if (need <= 0) {
    return { id, before: beforeCount, after: beforeCount, added: 0, dedupd: 0, skipped: 'nothing needed' };
  }

  // Parse-check the canonical Python: if it doesn't compile, we can't trust any
  // output it produces. Drop the whole problem rather than write bogus cases.
  try {
    const parseProbe = `import ast, sys\ntry:\n    ast.parse(sys.stdin.read())\n    print("OK")\nexcept SyntaxError as e:\n    print("ERR:" + str(e))\n    sys.exit(2)\n`;
    const parseResult = await judgeRun(parseProbe, py);
    if (!parseResult.startsWith('OK')) {
      return { id, before: beforeCount, after: beforeCount, added: 0, dedupd: 0, skipped: `python parse failed: ${parseResult.slice(0, 80)}` };
    }
  } catch (e) {
    return { id, before: beforeCount, after: beforeCount, added: 0, dedupd: 0, skipped: `python parse probe failed: ${e.message.slice(0, 80)}` };
  }

  let wrapped;
  try {
    wrapped = wrapWithDriver(py, 'python', method_name, params, return_type);
  } catch (e) {
    return { id, before: beforeCount, after: beforeCount, added: 0, dedupd: 0, skipped: `driver wrap error: ${e.message.slice(0, 80)}` };
  }

  const seen = new Set(existing.map(tc => JSON.stringify(tc.inputs)));
  const newCases = [];
  let dedupd = 0;
  let droppedVerify = 0;
  let consecutiveFails = 0;
  const maxAttempts = need * 8 + 16;

  for (let attempt = 0; attempt < maxAttempts && newCases.length < need; attempt++) {
    const inputs = genInputs(params);
    if (!inputs) break;
    if (!sanityHookOk(params, inputs)) { dedupd++; continue; }
    const key = JSON.stringify(inputs);
    if (seen.has(key)) { dedupd++; continue; }
    seen.add(key);

    const stdin = buildStdin(inputs) + '\n';
    try {
      const expected = await judgeRun(wrapped, stdin);
      if (expected === '' || expected.length > 4000) {
        consecutiveFails++;
        if (consecutiveFails > 12) break;
        continue;
      }
      // VERIFY GATE — re-run the canonical solution against the same inputs and
      // confirm we get a byte-identical result. Drops any case where the solution
      // is non-deterministic, flaky, or otherwise can't be trusted.
      await sleep(PAUSE_MS);
      let verifyOutput;
      try {
        verifyOutput = await judgeRun(wrapped, stdin);
      } catch (verr) {
        droppedVerify++;
        if (opts.verbose) console.log(`    drop verify-error inputs=${JSON.stringify(inputs)} (${verr.message.slice(0, 80)})`);
        consecutiveFails++;
        if (consecutiveFails > 12) break;
        continue;
      }
      if (verifyOutput !== expected) {
        droppedVerify++;
        if (opts.verbose) console.log(`    drop mismatch inputs=${JSON.stringify(inputs)} expected=${expected.slice(0, 40)} verify=${verifyOutput.slice(0, 40)}`);
        consecutiveFails++;
        if (consecutiveFails > 12) break;
        continue;
      }
      consecutiveFails = 0;
      newCases.push({ inputs, expected });
      if (opts.onCase) opts.onCase({ inputs, expected });
    } catch (e) {
      consecutiveFails++;
      if (opts.verbose) console.log(`    skip (${e.message.slice(0, 80)})`);
      // Bail early if every case errors — solution likely broken or types don't match.
      if (consecutiveFails > 10) break;
    }
    await sleep(PAUSE_MS);
  }

  const merged = [...existing, ...newCases];
  if (!opts.dryCount && newCases.length > 0) {
    const { error } = await sb.from('PGcode_problems').update({ test_cases: merged }).eq('id', id);
    if (error) {
      return { id, before: beforeCount, after: beforeCount, added: 0, dedupd, droppedVerify, skipped: `db write failed: ${error.message}` };
    }
  }
  return { id, before: beforeCount, after: merged.length, added: newCases.length, dedupd, droppedVerify };
}

// ── candidate fetcher ────────────────────────────────────────────────────────
async function fetchCandidates() {
  const out = [];
  let page = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id, method_name, params, return_type, solutions, test_cases, difficulty')
      .order('id', { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const r of data) {
      if (!INCLUDE_CURATED && CURATED_SLUGS.has(r.id)) continue;
      const pyEntry = r.solutions?.python;
      const code = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
      if (!code) continue;
      if (isStubSolution(code)) continue;
      if (!r.method_name) continue;
      if (!Array.isArray(r.params) || r.params.length === 0) continue;
      const tc = Array.isArray(r.test_cases) ? r.test_cases.length : 0;
      if (tc >= TARGET) continue;
      out.push(r);
    }
    if (data.length < PAGE) break;
    page++;
  }
  return out;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  // Single-slug dry mode.
  if (isDry && onlySlug) {
    const { data, error } = await sb.from('PGcode_problems')
      .select('id, method_name, params, return_type, solutions, test_cases, difficulty')
      .eq('id', onlySlug)
      .maybeSingle();
    if (error || !data) { console.error('not found'); process.exit(1); }
    console.log(`DRY RUN: ${onlySlug} — generating 3 sample cases (no DB write)\n`);
    const result = await growForProblem(data, {
      dryCount: 3,
      verbose: true,
      onCase: ({ inputs, expected }) => {
        console.log(`  inputs=${JSON.stringify(inputs)}`);
        console.log(`  expected=${expected}`);
        console.log('');
      },
    });
    console.log(`DRY RUN done: ${result.added} cases generated, ${result.dedupd} dedupd${result.skipped ? `, skipped=${result.skipped}` : ''}`);
    return;
  }

  console.log('Loading candidate problems from Supabase...');
  let candidates = await fetchCandidates();
  console.log(`Found ${candidates.length} candidate problems (real Python solution, < ${TARGET} cases).`);

  const log = loadLog();
  if (RESUME) {
    const done = new Set(Object.keys(log.processed).filter(k => log.processed[k].after >= TARGET));
    const before = candidates.length;
    candidates = candidates.filter(c => !done.has(c.id));
    console.log(`Resume: ${before - candidates.length} already-complete skipped.`);
  }

  if (onlySlug) {
    candidates = candidates.filter(c => c.id === onlySlug);
  }

  const slice = candidates.slice(0, MAX_PROBLEMS);
  console.log(`Processing ${slice.length} this run (max=${MAX_PROBLEMS}, target=${TARGET}, addCap=${ADD_CAP}, pause=${PAUSE_MS}ms).\n`);

  const runStart = new Date().toISOString();
  let totalAdded = 0;
  const results = [];
  for (const p of slice) {
    process.stdout.write(`${p.id.padEnd(55)} `);
    let r;
    try {
      r = await growForProblem(p);
    } catch (e) {
      r = { id: p.id, before: (p.test_cases || []).length, after: (p.test_cases || []).length, added: 0, dedupd: 0, skipped: `crash: ${e.message.slice(0, 100)}` };
    }
    results.push(r);
    totalAdded += r.added || 0;

    if (r.skipped) {
      console.log(`SKIP (${r.skipped})`);
    } else {
      console.log(`${String(r.before).padStart(3)} -> ${String(r.after).padStart(3)}  (+${r.added})${r.dedupd ? ` [${r.dedupd} dedup]` : ''}`);
    }

    log.processed[r.id] = { before: r.before, after: r.after, added: r.added, dedupd: r.dedupd, skipped: r.skipped || null, at: new Date().toISOString() };
    saveLog(log);
  }

  log.runs.push({
    started_at: runStart,
    finished_at: new Date().toISOString(),
    processed: slice.length,
    total_added: totalAdded,
    target: TARGET,
    addCap: ADD_CAP,
  });
  saveLog(log);

  const skipped = results.filter(r => r.skipped);
  console.log(`\nTOTAL: ${slice.length} problems processed, ${totalAdded} new cases added.`);
  if (skipped.length) {
    console.log(`Skipped: ${skipped.length}`);
    const reasons = {};
    for (const r of skipped) {
      const k = (r.skipped || 'unknown').replace(/^db write failed:.*$/, 'db write failed').replace(/^driver wrap error:.*$/, 'driver wrap error').replace(/^unsupported param type.*$/, 'unsupported param type').replace(/^crash:.*$/, 'crash');
      reasons[k] = (reasons[k] || 0) + 1;
    }
    for (const [k, v] of Object.entries(reasons)) console.log(`  ${k}: ${v}`);
  }
  console.log(`Log: ${LOG_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
