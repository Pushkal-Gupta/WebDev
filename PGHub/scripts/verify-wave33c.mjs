#!/usr/bin/env node
// Verify the 54 WAVE 33C-34J canonical Python solutions against their bundled
// test cases (from src/content/problemContent.js, NOT the DB) via the run-code
// edge function (Judge0). Mirrors scripts/verify-prune-tests.js for the harness
// build + output normalization.
//
// Usage: node scripts/verify-wave33c.mjs
// Writes scripts/report-wave33c-verify.json and prints a summary table.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env optional */ }

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
if (!URL || !ANON) {
  console.error('Need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const CONTENT_PATH = path.join(ROOT, 'src', 'content', 'problemContent.js');
const START_MARK = '// ===== WAVE 33C-34J (resumed from stash, deduped+validated) START =====';
const END_MARK = '// ===== WAVE 33C-34J END =====';
const PER_PROBLEM_BUDGET_MS = 90_000;
const PER_CASE_TIMEOUT_MS = 25_000;
const SLEEP_MS = 250;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseWaveSlugs() {
  const text = fs.readFileSync(CONTENT_PATH, 'utf8');
  const s = text.indexOf(START_MARK);
  const e = text.indexOf(END_MARK);
  if (s === -1 || e === -1) throw new Error('Could not find WAVE 33C-34J markers');
  const region = text.slice(s + START_MARK.length, e);
  const slugs = [];
  const seen = new Set();
  const re = /RICH_CONTENT\[\s*(["'])((?:\\.|(?!\1).)*)\1\s*\]\s*=/g;
  let m;
  while ((m = re.exec(region)) !== null) {
    const slug = m[2];
    if (!seen.has(slug)) { seen.add(slug); slugs.push(slug); }
  }
  return slugs;
}

// --- Harness build (mirrors verify-prune-tests.js) -------------------------
function buildHarness(solutionPy, methodName, params) {
  const cycledInput = params.length === 2
    && params[0]?.type === 'List[int]' && params[0]?.name === 'values'
    && params[1]?.type === 'int' && params[1]?.name === 'pos';
  const isListNode = (t) => t === 'ListNode' || t === 'Optional[ListNode]';
  const isTreeNode = (t) => t === 'TreeNode' || t === 'Optional[TreeNode]';
  const readLine = (t) => {
    const lt = String(t).toLowerCase();
    if (lt.includes('list') || lt.includes('[') || lt.includes('matrix'))
      return `json.loads(sys.stdin.readline().strip())`;
    if (lt === 'int' || lt === 'integer' || lt === 'long')
      return `int(sys.stdin.readline().strip())`;
    if (lt === 'bool' || lt === 'boolean')
      return `sys.stdin.readline().strip().lower() == 'true'`;
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
  const callExpr = usesClassSolution
    ? `Solution().${methodName}(${argList})`
    : `${methodName}(${argList})`;

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
    out = []
    seen = set()
    while h and id(h) not in seen:
        seen.add(id(h)); out.append(h.val); h = h.next
    return out
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right
def _to_tree(arr):
    if not arr or arr[0] is None: return None
    root = TreeNode(arr[0])
    q = [root]; i = 1
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
        out.append(n.val)
        q.append(n.left); q.append(n.right)
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
  try {
    return JSON.stringify(JSON.parse(t));
  } catch {
    return t.replace(/\s+/g, '');
  }
}
function outputsEqual(actual, expected) {
  if (actual === expected) return true;
  return normalize(actual) === normalize(expected);
}

async function runOnce(source, stdin) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PER_CASE_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${URL}/functions/v1/run-code`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ language: 'python', code: source, stdins: [stdin] }),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    throw new Error(e.name === 'AbortError' ? 'case-timeout' : e.message);
  }
  clearTimeout(timer);
  if (!res.ok) {
    const body = await res.text().then((t) => t.slice(0, 120)).catch(() => '');
    throw new Error(`run-code ${res.status}: ${body}`);
  }
  const data = await res.json();
  const first = (data.results || [])[0];
  if (!first) throw new Error('no result');
  if (first.status && first.status !== 'success' && first.status !== 'Accepted') {
    throw new Error(`${first.status}: ${(first.output || '').slice(0, 80)}`);
  }
  return (first.output || '').trim();
}

function pyOf(entry) {
  const e = entry?.solutions?.python;
  return typeof e === 'string' ? e : e?.code;
}

async function main() {
  const slugs = parseWaveSlugs();
  console.log(`Parsed ${slugs.length} WAVE 33C-34J slugs from problemContent.js\n`);

  const mod = await import(pathToFileURL(CONTENT_PATH).href);
  const RICH = mod.RICH_CONTENT || mod.default?.RICH_CONTENT;
  if (!RICH) throw new Error('RICH_CONTENT not exported');

  const report = [];
  const outPath = path.join(__dirname, 'report-wave33c-verify.json');
  const flush = () => fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), totalSlugs: slugs.length, completed: report.length, results: report }, null, 2));
  const pushAndFlush = (rec) => { report.push(rec); flush(); };

  for (let si = 0; si < slugs.length; si++) {
    const slug = slugs[si];
    const entry = RICH[slug];
    const prefix = `[${si + 1}/${slugs.length}] ${slug}`;

    if (!entry) { pushAndFlush({ slug, status: 'error', reason: 'no RICH_CONTENT entry', total: 0, passed: 0, failed: 0, failures: [] }); console.log(`${prefix}  ERROR no entry`); continue; }

    const py = pyOf(entry);
    const cases = Array.isArray(entry.test_cases) ? entry.test_cases : [];
    if (!py) { pushAndFlush({ slug, status: 'error', reason: 'no python solution', total: cases.length, passed: 0, failed: 0, failures: [] }); console.log(`${prefix}  ERROR no python`); continue; }
    if (!entry.method_name || !Array.isArray(entry.params) || entry.params.length === 0) { pushAndFlush({ slug, status: 'error', reason: 'missing method_name/params', total: cases.length, passed: 0, failed: 0, failures: [] }); console.log(`${prefix}  ERROR missing method_name/params`); continue; }
    if (cases.length === 0) { pushAndFlush({ slug, status: 'error', reason: 'no test_cases', total: 0, passed: 0, failed: 0, failures: [] }); console.log(`${prefix}  ERROR no test_cases`); continue; }

    const harness = buildHarness(py, entry.method_name, entry.params);
    const deadline = Date.now() + PER_PROBLEM_BUDGET_MS;

    let passed = 0;
    const failures = [];
    let timedOut = false;

    for (let i = 0; i < cases.length; i++) {
      if (Date.now() > deadline) { timedOut = true; break; }
      const tc = cases[i];
      const inputs = Array.isArray(tc.inputs) ? tc.inputs : [];
      const expected = String(tc.expected ?? '').trim();
      const stdin = inputs.join('\n') + '\n';
      let actual = '';
      let runStatus = 'ok';
      try {
        actual = await runOnce(harness, stdin);
      } catch (e) {
        runStatus = `err:${e.message.slice(0, 80)}`;
      }
      const match = runStatus === 'ok' && outputsEqual(actual, expected);
      if (match) { passed++; process.stdout.write('.'); }
      else { failures.push({ index: i, inputs, expected, actual, runStatus }); process.stdout.write('x'); }
      await sleep(SLEEP_MS);
    }

    const status = timedOut ? 'timeout' : (failures.length === 0 ? 'PASS' : 'FAIL');
    pushAndFlush({ slug, status, total: cases.length, passed, failed: failures.length, timedOut, failures });
    console.log(`  ${prefix}  ${status}  ${passed}/${cases.length}${timedOut ? ' (TIMEOUT, partial)' : ''}`);
  }

  flush();

  // Summary table
  console.log('\n\n===== SUMMARY (slug | total | passed | failed | status) =====');
  for (const r of report) {
    console.log(`${r.slug.padEnd(44)} ${String(r.total).padStart(4)} ${String(r.passed).padStart(4)} ${String(r.failed).padStart(4)}  ${r.status}`);
  }
  const fails = report.filter((r) => r.status !== 'PASS');
  console.log(`\nPASS: ${report.length - fails.length}/${report.length}`);
  if (fails.length) {
    console.log('\nNON-PASS:');
    for (const r of fails) {
      const reason = r.reason || (r.failures && r.failures[0]
        ? `case ${r.failures[0].index}: exp=${String(r.failures[0].expected).slice(0, 30)} act=${String(r.failures[0].actual).slice(0, 30)}${r.failures[0].runStatus !== 'ok' ? ' [' + r.failures[0].runStatus + ']' : ''}`
        : r.status);
      console.log(`  ${r.slug}: ${r.status} - ${reason}`);
    }
  }
  console.log(`\nReport: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
