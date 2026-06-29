import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { wrapWithDriver, buildStdin } from '../src/lib/driverCode.js';
import { compareOutputSmart } from './sol-batches/grade-helpers.mjs';
import CANON from './sol-batches/wave-stubpy-A1.mjs';

// per-problem grading flags + solution metadata
const META = {
  'arithmetic-subarrays': { approach: 'For each query, check the subarray sorts into an arithmetic progression via min/max and a membership set.', complexity: 'O(Q * n) time / O(n) space' },
  'average-of-levels-in-binary-tree': { approach: 'Level-order BFS over the level-order array, averaging each level.', complexity: 'O(n) time / O(n) space' },
  'avoid-flood-in-the-city': { approach: 'Greedy: track full lakes and dry days; on a repeat rain, drain at the earliest available dry day after it last filled (binary search).', complexity: 'O(n log n) time / O(n) space' },
  'balanced-binary-tree': { approach: 'Post-order height check; bubble up -1 the moment a subtree is unbalanced.', complexity: 'O(n) time / O(h) space' },
  'balanced-k-factor-decomposition': { approach: 'Recursively peel off divisors into k factors, tracking the split with minimal max-min spread.', complexity: 'O(d^k) time / O(k) space' },
  'battleships-in-a-board': { approach: 'Count each ship once by only counting its top-left cell (no X above or to the left).', complexity: 'O(mn) time / O(1) space' },
  'beautiful-arrangement': { approach: 'Backtracking placement of 1..n where position p takes a value divisible-by/dividing p.', complexity: 'O(k) time (k arrangements) / O(n) space' },
  'beautiful-arrangement-ii': { approach: 'Emit 1..n-k in order, then zig-zag the tail to produce exactly k distinct adjacent differences.', complexity: 'O(n) time / O(n) space' },
  'beautiful-towers-i': { approach: 'For each peak, expand left and right taking running minima of allowed heights and sum.', complexity: 'O(n^2) time / O(1) space' },
  'best-poker-hand': { approach: 'Flush if one suit; otherwise classify by the maximum rank frequency.', complexity: 'O(1) time / O(1) space' },
  'best-reachable-tower': { approach: 'Scan reachable towers (Manhattan <= radius), keeping max quality with lexicographic tie-break.', complexity: 'O(n) time / O(1) space' },
  'best-team-with-no-conflicts': { approach: 'Sort by (age, score); longest-increasing-subsequence-style DP maximizing summed score.', complexity: 'O(n^2) time / O(n) space' },
  'best-time-to-buy-and-sell-stock-using-strategy': { approach: 'Prefix sums of strategy*price and of price; try each window, swapping the held half for the sold half.', complexity: 'O(n) time / O(n) space' },
  'best-time-to-buy-and-sell-stock-v': { approach: 'DP over k transactions with long/short hold and cash states updated per day.', complexity: 'O(n*k) time / O(k) space' },
  'binary-prefix-divisible-by-5': { approach: 'Roll the running value mod 5 as bits stream in.', complexity: 'O(n) time / O(1) space' },
  'binary-string-with-substrings-representing-1-to-n': { approach: 'Check each 1..n binary form is a substring of s.', complexity: 'O(n * len) time / O(1) space' },
  'binary-tree-coloring-game': { approach: 'Find x; player 2 wins if the parent side or either child subtree exceeds half the nodes.', complexity: 'O(n) time / O(h) space' },
  'binary-tree-maximum-path-sum': { approach: 'Post-order: each node returns its best downward gain; update global best with both children joined.', complexity: 'O(n) time / O(h) space' },
  'binary-tree-paths': { approach: 'DFS collecting root-to-leaf paths.', complexity: 'O(n^2) time / O(n) space', oi: true },
  'binary-tree-postorder-traversal': { approach: 'Recursive post-order (left, right, node).', complexity: 'O(n) time / O(h) space' },
  'binary-trees-with-factors': { approach: 'Sort, DP counting trees rooted at each value as product of factor-pair subtree counts.', complexity: 'O(n^2) time / O(n) space' },
  'bitwise-or-of-even-numbers-in-an-array': { approach: 'OR together all even elements.', complexity: 'O(n) time / O(1) space' },
  'bitwise-ors-of-subarrays': { approach: 'Maintain the set of ORs of subarrays ending at each index; union into a global set.', complexity: 'O(n * 32) time / O(n) space' },
  'bitwise-xor-of-all-pairings': { approach: 'Each element appears len(other) times; XOR a side in only when the other length is odd.', complexity: 'O(n + m) time / O(1) space' },
  'block-placement-queries': { approach: 'Maintain sorted obstacles; for a query scan gaps up to x for one wide enough.', complexity: 'O(q * n) time / O(n) space' },
  'break-a-palindrome': { approach: 'Lower the first non-a in the left half to a; if none, set the last char to b.', complexity: 'O(n) time / O(n) space' },
  'brace-expansion-ii': { approach: 'Recursive-descent parse producing union of concatenated factor sets, returned sorted.', complexity: 'O(N log N) time / O(N) space' },
  'brick-wall': { approach: 'Tally interior edge positions; the best cut crosses the fewest bricks.', complexity: 'O(total bricks) time / O(width) space' },
  'bricks-falling-when-hit': { approach: 'Reverse the hits and union-find: re-add each brick, counting newly-attached-to-top bricks.', complexity: 'O((mn + h) * a) time / O(mn) space' },
  'broken-calculator': { approach: 'Work backwards from target, halving when even and incrementing when odd, then close the gap.', complexity: 'O(log target) time / O(1) space' },
  'build-an-array-with-stack-operations': { approach: 'Walk 1..max; Push every number, Pop the ones not in target.', complexity: 'O(max) time / O(max) space' },
  'build-array-from-permutation': { approach: 'Direct double indexing ans[i] = nums[nums[i]].', complexity: 'O(n) time / O(n) space' },
  'build-array-where-you-can-find-the-maximum-exactly-k-comparisons': { approach: 'DP over length, current max, and search-cost using prefix sums to fold the smaller-max transitions.', complexity: 'O(n * m * k) time / O(m * k) space' },
  'building-boxes': { approach: 'Fill complete triangular floors greedily, then add the minimal extra column to cover the remainder.', complexity: 'O(cbrt(n)) time / O(1) space' },
};

for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const JUDGE0_URL = (process.env.JUDGE0_URL || 'http://localhost:2358').replace(/\/$/, '');
const TOK = process.env.JUDGE0_AUTH_TOKEN || '';
const HEAD = TOK ? { 'content-type': 'application/json', 'X-Auth-Token': TOK } : { 'content-type': 'application/json' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1].split(',') : null;

async function j0(code, stdin) {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  let last;
  for (let a = 1; a <= 4; a++) {
    try {
      const res = await fetch(url, { method: 'POST', headers: HEAD, body: JSON.stringify({ language_id: 71, source_code: code, stdin, cpu_time_limit: 6, wall_time_limit: 12 }) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text().catch(()=>'')).slice(0,120)}`);
      const data = await res.json();
      const st = (data?.status?.description || '').toLowerCase();
      if (st && st !== 'accepted') return { ok: false, stdout: '', error: `${data?.status?.description}: ${(data.stderr || data.compile_output || data.message || '').toString().slice(0,200)}` };
      return { ok: true, stdout: (data.stdout || '').replace(/\r\n/g, '\n').replace(/\n$/, '') };
    } catch (e) { last = e; await sleep(500 * a); }
  }
  return { ok: false, stdout: '', error: `judge0 unreachable: ${last?.message}` };
}

// Problems whose stored test cases are confirmed corrupt (wrong expected on real
// cases) — leave the stub, do not write. See report.
const CORRUPT = new Set(['arithmetic-subarrays', 'binary-tree-coloring-game', 'binary-tree-maximum-path-sum']);

async function gradeAll(prob, code, oi) {
  const wrapped = wrapWithDriver(code, 'python', prob.method_name, prob.params, prob.return_type);
  const cases = prob.test_cases;
  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const r = await j0(wrapped, buildStdin(tc.inputs) + '\n');
    if (!r.ok) return { pass: false, i, reason: r.error, inputs: tc.inputs };
    if (!compareOutputSmart(r.stdout, tc.expected, { orderInsensitive: oi })) return { pass: false, i, reason: `WA got ${JSON.stringify(r.stdout).slice(0,80)} want ${JSON.stringify(tc.expected).slice(0,80)}`, inputs: tc.inputs };
  }
  return { pass: true, total: cases.length };
}

const slugs = ONLY || Object.keys(CANON);
const report = [];
for (const slug of slugs) {
  const canon = CANON[slug];
  if (!canon?.python) { report.push({ slug, status: 'no-canon' }); continue; }
  if (CORRUPT.has(slug)) { report.push({ slug, status: 'skip-corrupt', note: 'real cases have wrong expected' }); console.log(`SKIP-CORRUPT ${slug}`); continue; }
  const meta = META[slug] || {};
  const { data: prob, error } = await sb.from('PGcode_problems')
    .select('id, name, method_name, params, return_type, test_cases, solutions')
    .eq('id', slug).maybeSingle();
  if (error || !prob) { report.push({ slug, status: 'db-miss', note: error?.message }); continue; }
  const cases = Array.isArray(prob.test_cases) ? prob.test_cases : [];
  if (cases.length < 2 || cases.every(c => c.expected == null || c.expected === '')) {
    report.push({ slug, status: 'skip-nocases', note: `cases=${cases.length}` }); continue;
  }
  prob.test_cases = cases;
  const g = await gradeAll(prob, canon.python, !!meta.oi);
  if (!g.pass) { report.push({ slug, status: 'FAIL', note: `case ${g.i}: ${g.reason}`, inputs: g.inputs }); console.log(`FAIL ${slug} case ${g.i}: ${g.reason}`); continue; }
  if (DRY) { report.push({ slug, status: 'PASS-dry', note: `${g.total} cases` }); console.log(`PASS ${slug} (${g.total})`); continue; }
  // read-modify-write
  const { data: fresh } = await sb.from('PGcode_problems').select('solutions').eq('id', slug).maybeSingle();
  const existing = (fresh?.solutions && typeof fresh.solutions === 'object') ? fresh.solutions : {};
  const merged = { ...existing, python: { code: canon.python, approach: meta.approach || '', complexity: meta.complexity || '' } };
  const { error: upErr } = await sb.from('PGcode_problems').update({ solutions: merged }).eq('id', slug);
  if (upErr) { report.push({ slug, status: 'db-error', note: upErr.message }); continue; }
  report.push({ slug, status: 'WRITTEN', note: `${g.total} cases` });
  console.log(`WRITTEN ${slug} (${g.total})`);
}
fs.writeFileSync('/tmp/stubpy_A1_report.json', JSON.stringify(report, null, 2));
console.log('\n=== SUMMARY ===');
const by = {};
for (const r of report) by[r.status] = (by[r.status] || 0) + 1;
console.log(by);
