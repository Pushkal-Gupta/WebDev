#!/usr/bin/env node
// Stage-3 test-coverage drive: mutation testing.
//
// For each problem, take the canonical Python solution, programmatically
// generate ~15-25 syntactically-distinct *mutations* (off-by-one, flipped
// comparators, dropped edges, wrong defaults, skipped step, broken loop),
// then grade each mutation against the problem's current test_cases through
// the Judge0 edge function (run-code).
//
// Pass criteria for the TEST SET (not the mutation):
//   - Every non-equivalent mutation must fail >=1 test case.
//   - If a mutation passes ALL tests, the test set is INSUFFICIENT — try to
//     synthesize a counterexample (an input on which canonical and mutation
//     disagree); if found and --augment is set, append it to test_cases.
//
// Mutations that are *semantically equivalent* to the canonical (e.g. 0->False
// in a Boolean context) are pre-filtered: we run the mutation on a small
// sample of inputs and skip if outputs match the canonical exactly.
//
// Usage:
//   node scripts/mutation-test.js --slug two-sum [--dry] [--max-mutations 25] [--augment]
//   node scripts/mutation-test.js --all [--difficulty Easy] [--max-mutations 20]
//
// Requires .env with VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY +
// VITE_SUPABASE_ANON_KEY.

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
const arg = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return (v && !v.startsWith('--')) ? v : true;
};
const slug = arg('slug');
const all = arg('all');
const difficulty = arg('difficulty');
const dry = !!arg('dry');
const augment = !!arg('augment');
const resume = !!arg('resume');
const resultsPathArg = arg('results-path');
const maxMutations = Number(arg('max-mutations') || 25);

if (!slug && !all) {
  console.error('Pass --slug <id> or --all [--difficulty Easy]');
  process.exit(1);
}

// Where incremental results are persisted. Single-slug runs default to a slug
// scoped file so they don't clobber the full-sweep state.
const RESULTS_PATH = resultsPathArg && typeof resultsPathArg === 'string'
  ? path.resolve(resultsPathArg)
  : path.join(__dirname, '..', 'logs', slug ? `mutation-test-${slug}.json` : 'mutation-test-results.json');

function loadExistingResults() {
  try {
    const raw = fs.readFileSync(RESULTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.report)) return parsed;
  } catch { /* missing or unreadable — start fresh */ }
  return { report: [], processedIds: [] };
}

function saveResults(state) {
  try {
    fs.mkdirSync(path.dirname(RESULTS_PATH), { recursive: true });
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error(`  results-write failed: ${e.message}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Resilient fetch — Judge0/Edge-function calls intermittently fail with
// undici HeadersTimeoutError, ECONNRESET, or 5xx during long sweeps. Retry
// with exponential backoff (2s, 4s, 8s) before giving up.
// ──────────────────────────────────────────────────────────────────────────
const TRANSIENT_CODES = new Set(['UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN']);

function isTransientError(err) {
  if (!err) return false;
  const code = err.code || err.cause?.code;
  if (code && TRANSIENT_CODES.has(code)) return true;
  const name = err.cause?.name || err.name || '';
  if (name === 'HeadersTimeoutError' || name === 'ConnectTimeoutError' || name === 'SocketError') return true;
  return false;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url, options, label = 'run-code') {
  const MAX_ATTEMPTS = 3;
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status >= 500 && res.status < 600 && attempt < MAX_ATTEMPTS) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`    ${label} ${res.status} — retry ${attempt}/${MAX_ATTEMPTS - 1} in ${delay}ms`);
        await sleep(delay);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      const transient = isTransientError(err);
      if (transient && attempt < MAX_ATTEMPTS) {
        const delay = Math.pow(2, attempt) * 1000;
        const code = err.code || err.cause?.code || err.cause?.name || err.name;
        console.warn(`    ${label} ${code} — retry ${attempt}/${MAX_ATTEMPTS - 1} in ${delay}ms`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error(`${label}: exhausted retries`);
}

// ──────────────────────────────────────────────────────────────────────────
// Harness — mirrors verify-prune-tests.js so the mutated code is graded
// identically to the canonical.
// ──────────────────────────────────────────────────────────────────────────
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
  try { return JSON.stringify(JSON.parse(t)); }
  catch { return t.replace(/\s+/g, ''); }
}
const outputsEqual = (a, b) => a === b || normalize(a) === normalize(b);

async function runBatch(source, stdins) {
  // run-code accepts arrays — batch up to ~20 at a time.
  const out = [];
  const BATCH = 20;
  for (let i = 0; i < stdins.length; i += BATCH) {
    const slice = stdins.slice(i, i + BATCH);
    let res;
    try {
      res = await fetchWithRetry(`${URL}/functions/v1/run-code`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ language: 'python', code: source, stdins: slice }),
      }, 'run-code');
    } catch (err) {
      const code = err.code || err.cause?.code || err.cause?.name || err.name || 'unknown';
      console.warn(`    run-code batch fetch failed after retries: ${code}`);
      for (let j = 0; j < slice.length; j++) out.push({ ok: false, status: `fetch_${code}`, output: '' });
      continue;
    }
    if (!res.ok) { for (let j = 0; j < slice.length; j++) out.push({ ok: false, status: `http_${res.status}`, output: '' }); continue; }
    const data = await res.json();
    for (const r of (data.results || [])) {
      const ok = !r.status || r.status === 'success' || r.status === 'Accepted';
      out.push({ ok, status: ok ? 'ok' : r.status, output: (r.output || '').trim() });
    }
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Body extraction: we only want to mutate the body of the user's method, not
// signatures, decorators, or imports. We carve out the contiguous line range
// inside `def <methodName>(...)` and only consider those lines for mutation.
// Anything outside that range is left verbatim.
// ──────────────────────────────────────────────────────────────────────────
function locateMethodBody(src, methodName) {
  const lines = src.split('\n');
  const defRe = new RegExp(`^(\\s*)def\\s+${methodName}\\s*\\(`);
  let startLine = -1;
  let indent = '';
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(defRe);
    if (m) { startLine = i; indent = m[1]; break; }
  }
  if (startLine === -1) return null;
  // Body starts after the line that closes the def's parentheses + colon.
  let headerEnd = startLine;
  let opened = 0, closed = 0;
  for (let i = startLine; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '(') opened++; else if (ch === ')') closed++; }
    if (opened > 0 && opened === closed && /:\s*(#.*)?$/.test(lines[i])) { headerEnd = i; break; }
  }
  const bodyIndent = indent + (indent.includes('\t') ? '\t' : '    ');
  let endLine = lines.length - 1;
  for (let i = headerEnd + 1; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.trim() === '') continue;
    // First line that's not indented at least `bodyIndent` deep ends the body.
    if (!ln.startsWith(bodyIndent) && !ln.startsWith(indent + ' ') && !ln.startsWith(indent + '\t')) {
      endLine = i - 1; break;
    }
  }
  return { startLine, headerEnd, endLine, indent, bodyIndent };
}

function isDocstringOrBlank(line) {
  const t = line.trim();
  if (t === '') return true;
  if (t.startsWith('#')) return true;
  if (t.startsWith('"""') || t.startsWith("'''")) return true;
  if (t.startsWith('"') && t.endsWith('"') && t.length > 1) return true;
  return false;
}

// ──────────────────────────────────────────────────────────────────────────
// Mutation operators. Each takes the source string + located body range and
// returns either { code, label } for a single applicable variant, or null.
// We bias toward producing AT MOST ONE distinct variant per operator call so
// the suite stays small and human-traceable.
// ──────────────────────────────────────────────────────────────────────────
function mutInRange(src, range, replacer) {
  if (!range) return null;
  const lines = src.split('\n');
  const out = lines.slice();
  let applied = null;
  for (let i = range.headerEnd + 1; i <= range.endLine; i++) {
    const r = replacer(out[i], i);
    if (r != null) { out[i] = r; applied = i; break; }
  }
  return applied == null ? null : out.join('\n');
}

// Apply a regex replacement to a string but skip matches inside string/comment.
// Quick-and-dirty: strip strings/comments for the search, then translate
// the match index back into the original. Good enough for canonical Python.
function safeReplaceFirst(line, regex, replacement) {
  const stripped = line
    .replace(/"""[\s\S]*?"""/g, m => ' '.repeat(m.length))
    .replace(/'''[\s\S]*?'''/g, m => ' '.repeat(m.length))
    .replace(/"(?:[^"\\]|\\.)*"/g, m => ' '.repeat(m.length))
    .replace(/'(?:[^'\\]|\\.)*'/g, m => ' '.repeat(m.length))
    .replace(/#.*$/, m => ' '.repeat(m.length));
  const m = stripped.match(regex);
  if (!m) return null;
  const idx = stripped.indexOf(m[0]);
  if (idx === -1) return null;
  return line.slice(0, idx) + replacement(m) + line.slice(idx + m[0].length);
}

const OPERATORS = [
  {
    name: 'cmp_lt_to_le',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /(?<![<>=!])<(?!=)/, () => '<='));
    },
  },
  {
    name: 'cmp_gt_to_ge',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /(?<![<>=!])>(?!=)/, () => '>='));
    },
  },
  {
    name: 'cmp_lt_to_gt',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /(?<![<>=!])<(?!=)/, () => '>'));
    },
  },
  {
    name: 'cmp_gt_to_lt',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /(?<![<>=!])>(?!=)/, () => '<'));
    },
  },
  {
    name: 'cmp_eq_to_ne',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /==/, () => '!='));
    },
  },
  {
    name: 'cmp_le_to_lt',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /<=/, () => '<'));
    },
  },
  {
    name: 'cmp_ge_to_gt',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, />=/, () => '>'));
    },
  },
  {
    name: 'logic_and_to_or',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /\band\b/, () => 'or'));
    },
  },
  {
    name: 'logic_or_to_and',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /\bor\b/, () => 'and'));
    },
  },
  {
    name: 'range_off_by_one_plus',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /range\(\s*([A-Za-z_][A-Za-z0-9_]*|len\([^)]+\))\s*\)/, (m) => `range(${m[1]} + 1)`));
    },
  },
  {
    name: 'range_off_by_one_minus',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /range\(\s*([A-Za-z_][A-Za-z0-9_]*|len\([^)]+\))\s*\)/, (m) => `range(${m[1]} - 1)`));
    },
  },
  {
    name: 'drop_empty_guard',
    apply(src, range) {
      if (!range) return null;
      const lines = src.split('\n');
      for (let i = range.headerEnd + 1; i <= range.endLine; i++) {
        if (/^\s*if\s+not\s+\w+\s*:\s*return\b/.test(lines[i])) {
          const out = lines.slice();
          out[i] = ' '.repeat(lines[i].length - lines[i].trimStart().length) + 'pass';
          return out.join('\n');
        }
      }
      return null;
    },
  },
  {
    name: 'return_to_none',
    apply(src, range) {
      if (!range) return null;
      const lines = src.split('\n');
      // Find the LAST return statement in the body (most likely the main answer).
      for (let i = range.endLine; i > range.headerEnd; i--) {
        const m = lines[i].match(/^(\s*)return\s+\S/);
        if (m) {
          const out = lines.slice();
          out[i] = `${m[1]}return None`;
          return out.join('\n');
        }
      }
      return null;
    },
  },
  {
    name: 'min_to_max',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /\bmin\(/, () => 'max('));
    },
  },
  {
    name: 'max_to_min',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /\bmax\(/, () => 'min('));
    },
  },
  {
    name: 'literal_0_to_1',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /(?<![\w.])0(?![\w.])/, () => '1'));
    },
  },
  {
    name: 'literal_1_to_0',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /(?<![\w.])1(?![\w.])/, () => '0'));
    },
  },
  {
    name: 'true_to_false',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /\bTrue\b/, () => 'False'));
    },
  },
  {
    name: 'false_to_true',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /\bFalse\b/, () => 'True'));
    },
  },
  {
    name: 'empty_list_to_zero',
    apply(src, range) {
      return mutInRange(src, range, line => safeReplaceFirst(line, /\[\]/, () => '[0]'));
    },
  },
  {
    name: 'skip_middle_step',
    apply(src, range) {
      if (!range) return null;
      const lines = src.split('\n');
      const body = [];
      for (let i = range.headerEnd + 1; i <= range.endLine; i++) {
        const t = lines[i].trim();
        if (isDocstringOrBlank(lines[i])) continue;
        if (/^return\b/.test(t)) continue;
        if (/^def\s/.test(t)) continue;
        if (/^class\s/.test(t)) continue;
        if (t.endsWith(':')) continue;     // skip block heads; commenting would orphan a suite
        body.push(i);
      }
      if (body.length < 2) return null;
      const mid = body[Math.floor(body.length / 2)];
      const out = lines.slice();
      const orig = out[mid];
      const ind = orig.length - orig.trimStart().length;
      out[mid] = ' '.repeat(ind) + '# ' + orig.trimStart();
      // If the commented line was the only body of a suite, add a `pass` placeholder.
      const prev = out[mid - 1] || '';
      const prevTrim = prev.trim();
      if (prevTrim.endsWith(':')) {
        const prevInd = prev.length - prev.trimStart().length;
        out.splice(mid, 0, ' '.repeat(prevInd + 4) + 'pass');
      }
      return out.join('\n');
    },
  },
  {
    name: 'for_skip_first',
    apply(src, range) {
      return mutInRange(src, range, line => {
        // for x in EXPR:
        const m = line.match(/^(\s*for\s+[\w,\s()]+\s+in\s+)([^\s:]+(?:\([^)]*\))?)\s*:\s*(#.*)?$/);
        if (!m) return null;
        return `${m[1]}${m[2]}[1:]:${m[3] ? ' ' + m[3] : ''}`;
      });
    },
  },
  {
    name: 'for_skip_last',
    apply(src, range) {
      return mutInRange(src, range, line => {
        const m = line.match(/^(\s*for\s+[\w,\s()]+\s+in\s+)([^\s:]+(?:\([^)]*\))?)\s*:\s*(#.*)?$/);
        if (!m) return null;
        return `${m[1]}${m[2]}[:-1]:${m[3] ? ' ' + m[3] : ''}`;
      });
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Counterexample generation: build a small pool of inputs to compare
// canonical vs mutation on. Reuses multiply-test-cases.js's heuristics.
// ──────────────────────────────────────────────────────────────────────────
const rand = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randArr = (n, lo, hi) => Array.from({ length: n }, () => rand(lo, hi));

function generateForType(type) {
  const t = String(type).toLowerCase().replace(/\s+/g, '');
  if (t === 'int' || t === 'integer' || t === 'long') {
    return [0, 1, -1, 2, 10, 100, rand(2, 50), rand(50, 500)];
  }
  if (t === 'list[int]' || t === 'int[]' || t === 'list<int>' || t === 'array<int>') {
    return [[], [0], [1], [-1], [5, 5, 5], [1, 2, 3], [3, 1, 2],
      randArr(4, -10, 10), randArr(6, 0, 50), randArr(8, -50, 50)];
  }
  if (t === 'list[list[int]]' || t === 'int[][]' || t === 'matrix') {
    return [[[1]], [[1, 2], [3, 4]], Array.from({ length: 3 }, () => randArr(3, 0, 9))];
  }
  if (t === 'string' || t === 'str') {
    return ['', 'a', 'ab', 'aaaa', 'abc', 'abba', 'racecar', randStr(5), randStr(8)];
  }
  if (t === 'list[string]' || t === 'string[]') {
    return [[], ['a'], ['ab', 'cd'], ['abc', 'abd']];
  }
  if (t === 'bool' || t === 'boolean') return [true, false];
  return null;
}
function randStr(n) {
  const letters = 'abcdefgh';
  let s = '';
  for (let i = 0; i < n; i++) s += letters[rand(0, letters.length - 1)];
  return s;
}
function stringifyInput(v) {
  return typeof v === 'string' ? v : JSON.stringify(v);
}
function buildInputCombos(params, cap = 30) {
  const pools = params.map(p => generateForType(p.type));
  if (pools.some(p => !p)) return [];
  const combos = [];
  const recurse = (i, acc) => {
    if (combos.length >= cap) return;
    if (i === pools.length) { combos.push(acc); return; }
    for (const v of pools[i]) {
      if (combos.length >= cap) return;
      recurse(i + 1, [...acc, v]);
    }
  };
  recurse(0, []);
  return combos.map(c => c.map(stringifyInput));
}

// ──────────────────────────────────────────────────────────────────────────
// Per-problem run.
// ──────────────────────────────────────────────────────────────────────────
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
  const py = typeof pyEntry === 'string' ? pyEntry : pyEntry?.code;
  return py || null;
}

async function processProblem(problem) {
  const { id, method_name, params, test_cases } = problem;
  const py = await resolveSolution(problem);
  if (!py) return { id, skipped: 'no_solution' };
  if (!method_name || !Array.isArray(params) || params.length === 0)
    return { id, skipped: 'no_params' };
  const cases = Array.isArray(test_cases) ? test_cases : [];
  if (cases.length === 0) return { id, skipped: 'no_tests' };

  const range = locateMethodBody(py, method_name);
  if (!range) return { id, skipped: 'method_not_found' };

  // Generate up to maxMutations variants — dedupe by source string.
  const variants = [];
  const seen = new Set();
  for (const op of OPERATORS) {
    if (variants.length >= maxMutations) break;
    let mutated;
    try { mutated = op.apply(py, range); }
    catch { mutated = null; }
    if (!mutated || mutated === py || seen.has(mutated)) continue;
    seen.add(mutated);
    variants.push({ name: op.name, code: mutated });
  }

  if (variants.length === 0) return { id, skipped: 'no_applicable_mutations' };

  console.log(`  ${id}: ${variants.length} mutation variants (${cases.length} test cases)`);

  // 1. Run canonical on test cases once, cache outputs (for equivalence + grading).
  const harnessCanonical = buildHarness(py, method_name, params);
  const stdins = cases.map(tc => (Array.isArray(tc.inputs) ? tc.inputs : []).join('\n') + '\n');
  const canonicalOnTests = await runBatch(harnessCanonical, stdins);

  // 2. Build a fresh sample pool for equivalence pre-filter + counterexample search.
  const sample = buildInputCombos(params, 20);
  const sampleStdins = sample.map(arr => arr.join('\n') + '\n');
  const canonicalOnSample = sample.length ? await runBatch(harnessCanonical, sampleStdins) : [];

  const insufficient = [];
  const caught = [];
  let augmentedCount = 0;
  let augmentedCases = cases.slice();

  for (const variant of variants) {
    const harnessMut = buildHarness(variant.code, method_name, params);

    // Equivalence pre-filter: mutation that matches canonical on every sample
    // input is effectively a no-op (e.g. `0 -> False` in a boolean context).
    if (sample.length) {
      const mutOnSample = await runBatch(harnessMut, sampleStdins);
      let equivalent = true;
      for (let i = 0; i < sample.length; i++) {
        const a = canonicalOnSample[i];
        const b = mutOnSample[i];
        if (!a?.ok || !b?.ok) { equivalent = false; break; }
        if (!outputsEqual(a.output, b.output)) { equivalent = false; break; }
      }
      if (equivalent) {
        // Semantic no-op — skip (per CLAUDE.md pre-filter requirement).
        continue;
      }
    }

    // 3. Grade against the actual test set.
    const mutOnTests = await runBatch(harnessMut, stdins);
    let failedAtLeastOne = false;
    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const expected = String(tc.expected ?? '').trim();
      const r = mutOnTests[i];
      if (!r) { failedAtLeastOne = true; break; }
      if (!r.ok) { failedAtLeastOne = true; break; }
      if (!outputsEqual(r.output, expected)) { failedAtLeastOne = true; break; }
    }

    if (failedAtLeastOne) {
      caught.push(variant.name);
      continue;
    }

    // INSUFFICIENT: mutation passed every test case.
    console.log(`    INSUFFICIENT: ${id} — mutation ${variant.name} passed all ${cases.length} tests`);

    // Try to synthesize a counterexample from the sample pool we already ran.
    let counter = null;
    if (sample.length) {
      const mutOnSample = await runBatch(harnessMut, sampleStdins);
      for (let i = 0; i < sample.length; i++) {
        const a = canonicalOnSample[i];
        const b = mutOnSample[i];
        if (!a?.ok || !b?.ok) continue;
        if (a.output.length > 2000 || !a.output) continue;
        if (!outputsEqual(a.output, b.output)) {
          counter = { inputs: sample[i], expected: a.output };
          break;
        }
      }
    }

    insufficient.push({ mutation: variant.name, counterexample: counter });

    if (counter && augment && !dry) {
      // Append + persist immediately so subsequent mutations are graded against
      // the augmented set.
      augmentedCases = [...augmentedCases, counter];
      const { error } = await sb.from('PGcode_problems').update({ test_cases: augmentedCases }).eq('id', id);
      if (!error) {
        augmentedCount++;
        console.log(`      added counterexample: inputs=${JSON.stringify(counter.inputs).slice(0, 60)} expected=${counter.expected.slice(0, 40)}`);
        // Recompute canonicalOnTests so downstream mutations include the new case.
        stdins.push(counter.inputs.join('\n') + '\n');
        canonicalOnTests.push({ ok: true, status: 'ok', output: counter.expected });
        cases.push(counter);
      } else {
        console.log(`      counterexample write failed: ${error.message}`);
      }
    } else if (counter) {
      console.log(`      counterexample (not applied; pass --augment): inputs=${JSON.stringify(counter.inputs).slice(0, 60)}`);
    }
  }

  return {
    id,
    variants: variants.length,
    caught: caught.length,
    insufficient,
    augmentedCount,
  };
}

async function fetchAllProblems() {
  // PostgREST caps single SELECT at 1000 — paginate explicitly so --all sees
  // the whole catalog (matches the trap documented in docs/llm-wiki/judge0-and-backgrounds.md).
  const PAGE = 1000;
  let offset = 0;
  const out = [];
  for (;;) {
    let q = sb.from('PGcode_problems').select('id, method_name, params, return_type, solutions, test_cases, difficulty').order('id', { ascending: true }).range(offset, offset + PAGE - 1);
    if (slug) q = q.eq('id', slug);
    if (all && difficulty) q = q.eq('difficulty', difficulty);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
    if (slug) break;
  }
  return out;
}

async function main() {
  let data;
  try { data = await fetchAllProblems(); }
  catch (e) { console.error(e.message); process.exit(1); }
  if (!data?.length) { console.error('No problems matched'); process.exit(1); }

  const state = resume ? loadExistingResults() : { report: [], processedIds: [] };
  const processedSet = new Set(state.processedIds || []);
  if (resume && processedSet.size) {
    console.log(`Resume: ${processedSet.size} problem(s) already processed in ${RESULTS_PATH}\n`);
  }

  console.log(`Mutation-testing ${data.length} problem(s); max ${maxMutations} mutations each; dry=${dry}; augment=${augment}; resume=${resume}\n`);

  const report = state.report.slice();
  let checked = report.length;
  let totalInsufficient = report.reduce((a, r) => a + (r.insufficient?.length || 0), 0);
  let totalAdded = report.reduce((a, r) => a + (r.augmentedCount || 0), 0);
  let saveCounter = 0;

  for (const p of data) {
    if (resume && processedSet.has(p.id)) continue;
    let r;
    try {
      r = await processProblem(p);
    } catch (err) {
      const code = err?.code || err?.cause?.code || err?.cause?.name || err?.name || 'unknown';
      console.error(`  ${p.id}: FAILED after retries (${code}) — skipping`);
      processedSet.add(p.id);
      state.processedIds = Array.from(processedSet);
      state.report = report;
      saveResults(state);
      continue;
    }
    processedSet.add(r.id);
    if (r.skipped) {
      console.log(`  ${r.id}: skip (${r.skipped})`);
    } else {
      checked++;
      totalInsufficient += r.insufficient.length;
      totalAdded += r.augmentedCount;
      report.push(r);
    }
    // Persist incrementally so a crash mid-sweep doesn't lose progress.
    if (++saveCounter % 5 === 0 || r.skipped !== undefined) {
      state.processedIds = Array.from(processedSet);
      state.report = report;
      saveResults(state);
    }
  }

  state.processedIds = Array.from(processedSet);
  state.report = report;
  saveResults(state);

  console.log('\n──────── Mutation-test report ────────');
  console.log(`Problems checked:        ${checked}`);
  console.log(`Insufficient mutations:  ${totalInsufficient}`);
  console.log(`Test cases added:        ${totalAdded}`);
  console.log(`Results JSON:            ${RESULTS_PATH}`);
  if (totalInsufficient > 0) {
    console.log('\nInsufficient by problem:');
    for (const r of report) {
      if (!r.insufficient || r.insufficient.length === 0) continue;
      const types = r.insufficient.map(x => x.mutation + (x.counterexample ? '*' : '')).join(', ');
      console.log(`  ${r.id}: ${types}`);
    }
    console.log('  (* = counterexample synthesized)');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
