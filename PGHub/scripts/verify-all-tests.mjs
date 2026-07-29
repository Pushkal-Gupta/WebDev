#!/usr/bin/env node
// QA HARNESS (read-only): grade each problem's canonical Python solution against EVERY
// one of its test cases via the run-code (Judge0) edge function, and report where the
// canonical solution FAILS a real case — a P0 per CLAUDE.md ("if a wrong solution slips
// through our grader, that's a P0 incident"). Never mutates the DB (unlike
// verify-prune-tests.js). Reuses the same driver harness + normalized comparison.
//
// Usage:
//   node scripts/verify-all-tests.mjs [--limit 75] [--offset 0] [--random]
//                                     [--concurrency 4] [--out report.json] [--fail-on-p0]
//
// Requires .env: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_ANON_KEY.

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
const LIMIT = parseInt(arg('limit', '75'), 10);
const OFFSET = parseInt(arg('offset', '0'), 10);
const RANDOM = !!arg('random');
const CONCURRENCY = Math.max(1, parseInt(arg('concurrency', '4'), 10));
const OUT = arg('out');
const FAIL_ON_P0 = !!arg('fail-on-p0');
const STDIN_CHUNK = 25; // cases per run-code call

// ---- driver harness (identical to verify-prune-tests.js) ----
function buildHarness(solutionPy, methodName, params) {
  const cycledInput = params.length === 2
    && params[0]?.type === 'List[int]' && params[0]?.name === 'values'
    && params[1]?.type === 'int' && params[1]?.name === 'pos';
  const isListNode = (t) => t === 'ListNode' || t === 'Optional[ListNode]';
  const isTreeNode = (t) => t === 'TreeNode' || t === 'Optional[TreeNode]';
  const readLine = (t) => {
    const lt = String(t).toLowerCase();
    if (lt.includes('list') || lt.includes('[') || lt.includes('matrix')) return `json.loads(sys.stdin.readline().strip())`;
    if (lt === 'int' || lt === 'integer' || lt === 'long') return `int(sys.stdin.readline().strip())`;
    if (lt === 'bool' || lt === 'boolean') return `sys.stdin.readline().strip().lower() == 'true'`;
    return `sys.stdin.readline().rstrip('\\n')`;
  };
  let argParse, argList;
  if (cycledInput) {
    argParse = `_vals = ${readLine('List[int]')}\n_pos = ${readLine('int')}\narg0 = _to_list_cycle(_vals, _pos)`;
    argList = 'arg0';
  } else {
    argParse = params.map((p, i) => {
      if (isListNode(p.type)) return `_raw${i} = json.loads(sys.stdin.readline().strip())\narg${i} = _to_list(_raw${i})`;
      if (isTreeNode(p.type)) return `_raw${i} = json.loads(sys.stdin.readline().strip())\narg${i} = _to_tree(_raw${i})`;
      return `arg${i} = ${readLine(p.type)}`;
    }).join('\n');
    argList = params.map((_, i) => `arg${i}`).join(', ');
  }
  const usesClassSolution = /\bclass\s+Solution\b/.test(solutionPy);
  const callExpr = usesClassSolution ? `Solution().${methodName}(${argList})` : `${methodName}(${argList})`;
  const PY_HELPERS = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val; self.next = next
def _to_list(arr):
    if not arr: return None
    h = ListNode(arr[0]); c = h
    for v in arr[1:]:
        c.next = ListNode(v); c = c.next
    return h
def _to_list_cycle(arr, pos):
    if not arr: return None
    ns = [ListNode(v) for v in arr]
    for i in range(len(ns)-1): ns[i].next = ns[i+1]
    if pos is not None and 0 <= pos < len(ns): ns[-1].next = ns[pos]
    return ns[0]
def _from_list(h):
    out = []; seen = set()
    while h and id(h) not in seen:
        seen.add(id(h)); out.append(h.val); h = h.next
    return out
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right
def _to_tree(arr):
    if not arr or arr[0] is None: return None
    root = TreeNode(arr[0]); q = [root]; i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root
def _from_tree(root):
    if not root: return []
    out, q = [], [root]
    while q:
        n = q.pop(0)
        if n is None: out.append(None); continue
        out.append(n.val); q.append(n.left); q.append(n.right)
    while out and out[-1] is None: out.pop()
    return out
`;
  return `from __future__ import annotations
import sys, json
${PY_HELPERS}
${solutionPy}

${argParse}
res = ${callExpr}
if res.__class__.__name__ == 'ListNode':
    res = _from_list(res)
if res.__class__.__name__ == 'TreeNode':
    res = _from_tree(res)
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

function normalize(s) {
  let t = String(s).trim();
  if (t === 'True') t = 'true';
  else if (t === 'False') t = 'false';
  try { return JSON.stringify(JSON.parse(t)); } catch { return t.replace(/\s+/g, ''); }
}
const toJson = (s) => { let t = String(s).trim(); if (t === 'True') t = 'true'; else if (t === 'False') t = 'false'; return JSON.parse(t); };
// LeetCode grades floating-point answers within a tolerance — so compare numbers loosely
// (rel/abs 1e-6) and recurse through arrays/objects, so precision-only diffs aren't false P0s.
const numClose = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
function deepEq(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return numClose(a, b);
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEq(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEq(a[k], b[k]));
  }
  return a === b;
}
function outputsEqual(a, e) {
  if (a === e) return true;
  if (normalize(a) === normalize(e)) return true;
  try { return deepEq(toJson(a), toJson(e)); } catch { return false; }
}

async function runCode(source, stdins) {
  const res = await fetch(`${URL}/functions/v1/run-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ language: 'python', code: source, stdins }),
  });
  if (!res.ok) throw new Error(`run-code ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  return data.results || [];
}

const pySolution = (p) => { const e = p.solutions?.python; return typeof e === 'string' ? e : e?.code; };

async function gradeProblem(p) {
  const py = pySolution(p);
  const cases = Array.isArray(p.test_cases) ? p.test_cases : [];
  if (!py) return { id: p.id, name: p.name, skipped: 'no python solution' };
  if (!p.method_name || !Array.isArray(p.params) || p.params.length === 0) return { id: p.id, name: p.name, skipped: 'no driver metadata' };
  if (cases.length === 0) return { id: p.id, name: p.name, skipped: 'no test cases' };

  let harness;
  try { harness = buildHarness(py, p.method_name, p.params); }
  catch (e) { return { id: p.id, name: p.name, error: `harness: ${e.message.slice(0, 80)}` }; }

  const stdins = cases.map((tc) => (Array.isArray(tc.inputs) ? tc.inputs : []).join('\n') + '\n');
  const results = [];
  for (let i = 0; i < stdins.length; i += STDIN_CHUNK) {
    try { results.push(...await runCode(harness, stdins.slice(i, i + STDIN_CHUNK))); }
    catch (e) { return { id: p.id, name: p.name, error: `run-code: ${e.message.slice(0, 80)}` }; }
  }

  const failures = [];
  for (let i = 0; i < cases.length; i++) {
    const r = results[i] || {};
    const ok = r.status === 'success' || r.status === 'Accepted' || !r.status;
    const actual = (r.output || '').trim();
    const expected = String(cases[i].expected ?? '').trim();
    if (!ok || !outputsEqual(actual, expected)) {
      failures.push({ i, inputs: cases[i].inputs, expected, actual: actual.slice(0, 60), status: r.status || 'ok' });
    }
  }
  return { id: p.id, name: p.name, total: cases.length, passed: cases.length - failures.length, failures };
}

// pooled concurrency
async function pool(items, n, fn, onDone) {
  const q = items.slice(); const out = [];
  await Promise.all(Array.from({ length: n }, async () => {
    while (q.length) { const it = q.shift(); const r = await fn(it); out.push(r); onDone?.(r, out.length, items.length); }
  }));
  return out;
}

async function main() {
  // Pull a batch of candidate problems (gradeable: has method_name + solutions). test_cases
  // presence is checked client-side.
  let query = sb.from('PGcode_problems')
    .select('id, name, method_name, params, return_type, solutions, test_cases, frequency_score')
    .not('method_name', 'is', null)
    .not('solutions', 'is', null);
  query = RANDOM ? query.limit(Math.max(LIMIT * 3, 200)) : query.order('frequency_score', { ascending: false, nullsFirst: false }).range(OFFSET, OFFSET + LIMIT * 3);
  const { data, error } = await query;
  if (error) { console.error(error.message); process.exit(1); }

  let pool0 = (data || []).filter((p) => Array.isArray(p.test_cases) && p.test_cases.length > 0 && pySolution(p));
  if (RANDOM) pool0 = pool0.sort(() => Math.random() - 0.5);
  const sample = pool0.slice(0, LIMIT);

  console.log(`\nQA test-case sweep — ${sample.length} problems (limit ${LIMIT}, concurrency ${CONCURRENCY})\n`);

  const results = await pool(sample, CONCURRENCY, gradeProblem, (r, done, total) => {
    const mark = r.skipped ? 's' : r.error ? 'E' : r.failures.length ? 'x' : '.';
    process.stdout.write(mark);
    if (done % 60 === 0) process.stdout.write(` ${done}/${total}\n`);
  });
  process.stdout.write('\n\n');

  const p0 = results.filter((r) => r.failures && r.failures.length > 0);
  const errored = results.filter((r) => r.error);
  const skipped = results.filter((r) => r.skipped);
  const clean = results.filter((r) => r.failures && r.failures.length === 0);

  console.log('=== QA SUMMARY ===');
  console.log(`checked (graded):  ${clean.length + p0.length}`);
  console.log(`clean:             ${clean.length}`);
  console.log(`P0 (solution fails a real case):  ${p0.length}`);
  console.log(`errored (harness/run-code):       ${errored.length}`);
  console.log(`skipped (no sol/meta/cases):      ${skipped.length}`);

  if (p0.length) {
    console.log('\n=== P0 INCIDENTS (canonical solution fails its own test cases) ===');
    for (const r of p0.slice(0, 40)) {
      console.log(`\n  [${r.id}] ${r.name} — ${r.passed}/${r.total} passed, ${r.failures.length} FAIL`);
      for (const f of r.failures.slice(0, 3)) {
        console.log(`     inputs=${JSON.stringify(f.inputs).slice(0, 70)} expected=${String(f.expected).slice(0, 34)} actual=${f.actual}${f.status !== 'ok' ? ` [${f.status}]` : ''}`);
      }
      if (r.failures.length > 3) console.log(`     ... +${r.failures.length - 3} more failing cases`);
    }
    if (p0.length > 40) console.log(`\n  ... and ${p0.length - 40} more P0 problems`);
  }
  if (errored.length) {
    console.log('\n=== ERRORED (could not grade) ===');
    for (const r of errored.slice(0, 20)) console.log(`  [${r.id}] ${r.name}: ${r.error}`);
  }

  if (OUT) {
    fs.writeFileSync(OUT, JSON.stringify({ generatedForSample: sample.length, clean: clean.length, p0: p0.map((r) => ({ id: r.id, name: r.name, passed: r.passed, total: r.total, failures: r.failures })), errored: errored.map((r) => ({ id: r.id, name: r.name, error: r.error })), skipped: skipped.length }, null, 2));
    console.log(`\nJSON report written to ${OUT}`);
  }

  console.log(`\n${p0.length === 0 ? 'No P0 incidents in this sample.' : `${p0.length} P0 incident(s) — fix these (wrong solution OR wrong test case).`}`);
  if (FAIL_ON_P0 && p0.length > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
