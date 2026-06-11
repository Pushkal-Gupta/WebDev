#!/usr/bin/env node
// Stage 2 of the test-coverage drive: for each problem with a `leetcode_url`,
// scrape the public LeetCode GraphQL endpoint for `exampleTestcases` +
// `metaData`, convert them into the project's `test_cases` shape, run each
// case through the canonical Python solution via the `run-code` Edge Function
// to capture `expected` (and discard any case the canonical can't grade), and
// merge into `PGcode_problems.test_cases` (dedupe by JSON.stringify(inputs)).
//
// Usage:
//   node scripts/scrape-lc-testcases.js --slug two-sum [--dry]
//   node scripts/scrape-lc-testcases.js --all [--difficulty Easy] [--dry]
//
// Requires .env with VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY +
// VITE_SUPABASE_ANON_KEY.

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
const slug = arg('slug');
const all = arg('all');
const difficulty = arg('difficulty');
const dry = arg('dry');

if (!slug && !all) {
  console.error('Pass --slug <id> or --all [--difficulty Easy]');
  process.exit(1);
}

// ── LeetCode GraphQL ─────────────────────────────────────────────────────────
const LC_ENDPOINT = 'https://leetcode.com/graphql';
const LC_HEADERS = {
  'content-type': 'application/json',
  'user-agent': 'Mozilla/5.0 (compatible; PGcode-bot/1.0; +https://pushkalgupta.com/PGcode)',
  'referer': 'https://leetcode.com/',
  'accept': 'application/json',
};
const LC_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      titleSlug
      title
      exampleTestcases
      sampleTestCase
      metaData
    }
  }
`;

const CACHE_DIR = path.join(__dirname, '.lc-cache');
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch { /* */ }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Polite rate-limit: ~1 req / 2s with exponential backoff on 429/5xx.
let lastHit = 0;
async function lcFetch(titleSlug, attempt = 0) {
  const now = Date.now();
  const wait = Math.max(0, 2000 - (now - lastHit));
  if (wait > 0) await sleep(wait);
  lastHit = Date.now();
  let res;
  try {
    res = await fetch(LC_ENDPOINT, {
      method: 'POST',
      headers: LC_HEADERS,
      body: JSON.stringify({ query: LC_QUERY, variables: { titleSlug } }),
    });
  } catch (e) {
    if (attempt < 4) {
      await sleep(2000 * Math.pow(2, attempt));
      return lcFetch(titleSlug, attempt + 1);
    }
    throw e;
  }
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 4) {
      await sleep(2000 * Math.pow(2, attempt));
      return lcFetch(titleSlug, attempt + 1);
    }
    throw new Error(`LC ${res.status} after retries`);
  }
  if (!res.ok) throw new Error(`LC ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const json = await res.json();
  return json?.data?.question || null;
}

async function fetchLcQuestion(titleSlug) {
  const cachePath = path.join(CACHE_DIR, `${titleSlug}.json`);
  if (fs.existsSync(cachePath)) {
    try { return JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch { /* */ }
  }
  const q = await lcFetch(titleSlug);
  if (q) {
    try { fs.writeFileSync(cachePath, JSON.stringify(q, null, 2)); } catch { /* */ }
  }
  return q;
}

function extractTitleSlug(leetcodeUrl) {
  if (!leetcodeUrl) return null;
  const m = leetcodeUrl.match(/leetcode\.com\/problems\/([^/?#]+)/i);
  return m ? m[1].toLowerCase() : null;
}

// Split `exampleTestcases` into groups of `nParams` lines.
function parseExampleTestcases(text, nParams) {
  if (!text || nParams < 1) return [];
  const lines = String(text).split('\n');
  if (lines.length === 0 || lines.length % nParams !== 0) {
    // Some problems quote multi-line strings inside a single param. Best-effort:
    // require exact divisibility; otherwise bail and let canonical-run filter it.
    if (lines.length < nParams) return [];
  }
  const out = [];
  for (let i = 0; i + nParams <= lines.length; i += nParams) {
    const inputs = lines.slice(i, i + nParams).map((s) => String(s));
    out.push(inputs);
  }
  return out;
}

// ── Python harness (mirrors multiply-test-cases.js) ─────────────────────────
function buildHarness(solutionPy, methodName, params) {
  const argParse = params.map((p, i) => {
    const t = String(p.type).toLowerCase();
    if (t.includes('list') || t.includes('[') || t.includes('matrix')) {
      return `arg${i} = json.loads(sys.stdin.readline().strip())`;
    }
    if (t === 'int' || t === 'integer' || t === 'long') {
      return `arg${i} = int(sys.stdin.readline().strip())`;
    }
    if (t === 'bool' || t === 'boolean') {
      return `arg${i} = sys.stdin.readline().strip().lower() == 'true'`;
    }
    if (t === 'double' || t === 'float') {
      return `arg${i} = float(sys.stdin.readline().strip())`;
    }
    return `arg${i} = sys.stdin.readline().rstrip('\\n')`;
  }).join('\n');
  const argList = params.map((_, i) => `arg${i}`).join(', ');
  const usesClassSolution = /\bclass\s+Solution\b/.test(solutionPy);
  const callExpr = usesClassSolution
    ? `Solution().${methodName}(${argList})`
    : `${methodName}(${argList})`;
  return `from __future__ import annotations
${solutionPy}

import sys, json
${argParse}
res = ${callExpr}
if isinstance(res, bool):
    print(str(res).lower())
elif res is None:
    print("null")
elif isinstance(res, str):
    print(res)
else:
    print(json.dumps(res, separators=(',', ':'), default=str))
`;
}

async function runOnce(source, stdin) {
  const res = await fetch(`${URL}/functions/v1/run-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ language: 'python', code: source, stdins: [stdin] }),
  });
  if (!res.ok) throw new Error(`run-code ${res.status}: ${await res.text().then((t) => t.slice(0, 120))}`);
  const data = await res.json();
  const first = (data.results || [])[0];
  if (!first) throw new Error('no result');
  if (first.status && first.status !== 'success' && first.status !== 'Accepted') {
    throw new Error(`${first.status}: ${(first.output || '').slice(0, 80)}`);
  }
  return (first.output || '').trim();
}

function paramsLooksHarnessSafe(params) {
  if (!Array.isArray(params) || params.length === 0) return false;
  for (const p of params) {
    const t = String(p.type || '');
    // LC sometimes uses ListNode / TreeNode — multiply-style harness can't
    // serialize those from raw LC inputs. Skip cleanly.
    if (/ListNode|TreeNode/i.test(t)) return false;
  }
  return true;
}

async function processProblem(problem) {
  const { id, leetcode_url, method_name, params, solutions, test_cases: existing } = problem;
  const lcSlug = extractTitleSlug(leetcode_url);
  if (!lcSlug) { console.log(`${id}: SKIP (could not parse LC slug from ${leetcode_url})`); return null; }

  const pyEntry = solutions?.python;
  const py = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
  if (!py || !method_name || !paramsLooksHarnessSafe(params)) {
    console.log(`${id}: SKIP (missing canonical Python / method / unsupported param types)`);
    return null;
  }

  let q;
  try { q = await fetchLcQuestion(lcSlug); }
  catch (e) { console.log(`${id}: SKIP (LC fetch failed: ${e.message.slice(0, 100)})`); return null; }
  if (!q) { console.log(`${id}: SKIP (LC returned no question for ${lcSlug})`); return null; }

  let meta = {};
  try { meta = typeof q.metaData === 'string' ? JSON.parse(q.metaData) : (q.metaData || {}); }
  catch { meta = {}; }
  if (meta.systemdesign || meta.classsolution) {
    console.log(`${id}: SKIP (LC metaData flags systemdesign/classsolution — incompatible harness)`);
    return null;
  }

  const metaParams = Array.isArray(meta.params) ? meta.params : params;
  const nParams = metaParams.length || params.length;
  if (nParams !== params.length) {
    console.log(`${id}: SKIP (param-count mismatch: DB ${params.length} vs LC ${nParams})`);
    return null;
  }

  const raw = q.exampleTestcases || q.sampleTestCase || '';
  const lcGroups = parseExampleTestcases(raw, nParams);
  if (lcGroups.length === 0) {
    console.log(`${id}: SKIP (no parseable exampleTestcases for ${lcSlug})`);
    return null;
  }

  const have = Array.isArray(existing) ? existing : [];
  const haveKeys = new Set(have.map((tc) => JSON.stringify(tc.inputs)));
  const harness = buildHarness(py, method_name, params);

  const added = [];
  let attempted = 0;
  for (const inputs of lcGroups) {
    attempted += 1;
    const key = JSON.stringify(inputs);
    if (haveKeys.has(key)) continue;
    haveKeys.add(key);
    try {
      const stdin = inputs.join('\n') + '\n';
      const expected = await runOnce(harness, stdin);
      if (expected === '' || expected.length > 5000) continue;
      added.push({ inputs, expected });
    } catch (e) {
      // canonical failed → likely a parse mismatch; drop the case quietly.
      console.log(`  ${id}: drop LC case (canonical failed: ${e.message.slice(0, 80)})`);
    }
  }

  const merged = [...have, ...added];
  const verb = dry ? 'DRY' : 'merged';
  console.log(`${id}: pulled ${attempted} LC cases → ${verb} → final ${merged.length} total (+${added.length} new)`);

  if (dry || added.length === 0) return added.length || null;

  const { error } = await sb.from('PGcode_problems').update({ test_cases: merged }).eq('id', id);
  if (error) { console.log(`${id}: write failed: ${error.message}`); return null; }
  return added.length;
}

async function listProblems() {
  const cols = 'id, method_name, params, solutions, test_cases, difficulty, leetcode_url';
  if (slug) {
    const { data, error } = await sb.from('PGcode_problems').select(cols).eq('id', slug);
    if (error) throw new Error(error.message);
    return data || [];
  }
  // Page through everything with leetcode_url.
  const out = [];
  let from = 0;
  const PAGE = 1000;
  // Order by id so paging is stable.
  while (true) {
    let q = sb.from('PGcode_problems').select(cols).not('leetcode_url', 'is', null).order('id', { ascending: true }).range(from, from + PAGE - 1);
    if (difficulty) q = q.eq('difficulty', difficulty);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function main() {
  const problems = await listProblems();
  if (!problems.length) { console.error('No problems matched'); process.exit(1); }

  console.log(`Processing ${problems.length} problem(s), dry=${!!dry}`);
  let totalAdded = 0;
  let processed = 0;
  for (const p of problems) {
    try {
      const n = await processProblem(p);
      if (n) totalAdded += n;
    } catch (e) {
      console.log(`${p.id}: ERROR ${e.message.slice(0, 120)}`);
    }
    processed += 1;
    if (processed % 25 === 0) {
      console.log(`-- progress: ${processed}/${problems.length}, +${totalAdded} cases so far`);
    }
  }
  console.log(`\nDone. Added ${totalAdded} test cases across ${problems.length} problems.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
