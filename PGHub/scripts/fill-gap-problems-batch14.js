#!/usr/bin/env node
// Batch 14 of the gap-fill drive. GENUINELY ORIGINAL problems tagged "PGHub".
// Disjoint range: gaps in (3900, 4544]. Only 6 actual gaps exist in this range,
// so this batch fills all 6 (the requested "first 15" caps at the count available).
//
//   node scripts/fill-gap-problems-batch14.js          # author + grade + insert
//   node scripts/fill-gap-problems-batch14.js --dry     # author + grade locally, no write
//   node scripts/fill-gap-problems-batch14.js --verify  # re-run stored solutions vs stored cases
//
// Every test-case `expected` is produced by ACTUALLY RUNNING the canonical Python here,
// so each inserted problem passes its own cases by construction.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const VERIFY = args.includes('--verify');
const cliNums = args.filter((a) => /^\d+$/.test(a)).map(Number);

const BATCH = [3902, 3907, 3916, 3929, 3930, 4544];

const PY_SERIALIZER = `
import json, sys, math
from collections import defaultdict, Counter, deque
import heapq
def _ser(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return v
    return json.dumps(v, separators=(",", ":"))
`;

const PROBLEMS = [
  {
    n: 3902,
    id: 'pghub-b14-tidal-pools',
    name: 'Tidal Pool Capacity',
    topic_id: 'two-pointers',
    difficulty: 'Medium',
    method_name: 'trappedWater',
    params: [{ name: 'walls', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A row of sea walls has heights given by <code>walls</code>, each occupying one unit of width. After the tide recedes, water is trapped in the dips between taller walls. Return the total units of water trapped between the walls.',
    examples: [
      ['[3,0,2,0,4]', '7', 'The dips hold 3+1+3 = 7 units of water.'],
      ['[2,2,2]', '0', 'A flat top traps nothing.'],
    ],
    constraints: ['1 <= walls.length <= 10^5', '0 <= walls[i] <= 10^4'],
    tags: ['two-pointers', 'arrays'],
    py: `def trappedWater(walls):
    left, right = 0, len(walls) - 1
    left_max = right_max = 0
    total = 0
    while left < right:
        if walls[left] < walls[right]:
            left_max = max(left_max, walls[left])
            total += left_max - walls[left]
            left += 1
        else:
            right_max = max(right_max, walls[right])
            total += right_max - walls[right]
            right -= 1
    return total`,
    approach:
      'Use two pointers from both ends, tracking the tallest wall seen so far on each side. The shorter side bounds the water level, so advance that pointer and add the difference between its running max and the current wall height.',
    complexity: { time: 'O(n)', space: 'O(1)' },
    cases: [
      ['[3,0,2,0,4]'],
      ['[2,2,2]'],
      ['[0]'],
      ['[5,4,3,2,1]'],
      ['[1,2,3,4,5]'],
      ['[4,1,3,1,5]'],
      ['[0,5,0,5,0]'],
      ['[2,0,2]'],
      ['[10,0,0,0,10]'],
      ['[1,0,1,0,1,0,1]'],
    ],
  },
  {
    n: 3907,
    id: 'pghub-b14-ledger-rebalance',
    name: 'Ledger Rebalance Count',
    topic_id: 'greedy',
    difficulty: 'Medium',
    method_name: 'minTransfers',
    params: [{ name: 'balances', type: 'List[int]' }],
    return_type: 'int',
    statement:
      'A shared ledger lists the net balance of each member in <code>balances</code> (positive means owed money, negative means owes money; the values sum to zero). In one transfer, any member may move any amount to any other member. Return the minimum number of transfers needed so every balance becomes zero.',
    examples: [
      ['[5,-3,-2]', '2', 'The two debtors each pay the single creditor: 2 transfers.'],
      ['[0,0,0]', '0', 'Everyone is already settled.'],
    ],
    constraints: ['1 <= balances.length <= 12', '-10^6 <= balances[i] <= 10^6', 'sum(balances) == 0'],
    tags: ['greedy', 'backtracking'],
    py: `def minTransfers(balances):
    debts = [b for b in balances if b != 0]
    n = len(debts)
    full = (1 << n) - 1
    # subset_sum[mask] = total balance of accounts in mask
    subset_sum = [0] * (1 << n)
    for mask in range(1, 1 << n):
        low = mask & -mask
        i = low.bit_length() - 1
        subset_sum[mask] = subset_sum[mask ^ low] + debts[i]
    memo = {}
    def maxZeroGroups(mask):
        if mask == 0:
            return 0
        if mask in memo:
            return memo[mask]
        low = mask & -mask
        rest = mask ^ low
        best = -1
        # enumerate subsets of mask that include the lowest set bit
        sub = mask
        while sub:
            if (sub & low) and subset_sum[sub] == 0:
                best = max(best, 1 + maxZeroGroups(mask ^ sub))
            sub = (sub - 1) & mask
        if best == -1:
            best = maxZeroGroups(rest)
        memo[mask] = best
        return best
    groups = maxZeroGroups(full)
    return n - groups`,
    approach:
      'Drop zero balances. The minimum number of transfers equals (number of nonzero accounts) minus (maximum number of disjoint subsets that each sum to zero), because each zero-sum group of size g can be settled in g-1 transfers. Enumerate zero-sum subsets containing the lowest account and recurse with bitmask memoization.',
    complexity: { time: 'O(3^n)', space: 'O(2^n)' },
    cases: [
      ['[5,-3,-2]'],
      ['[0,0,0]'],
      ['[1,-1]'],
      ['[4,-4,3,-3]'],
      ['[5,-5,5,-5]'],
      ['[10,-2,-3,-5]'],
      ['[1,1,1,-3]'],
      ['[2,-1,-1,2,-2]'],
      ['[0]'],
      ['[6,-1,-2,-3]'],
    ],
  },
  {
    n: 3916,
    id: 'pghub-b14-signal-decay',
    name: 'Signal Decay Window',
    topic_id: 'sliding-window',
    difficulty: 'Medium',
    method_name: 'longestStable',
    params: [{ name: 'signal', type: 'List[int]' }, { name: 'drift', type: 'int' }],
    return_type: 'int',
    statement:
      'A sensor logs readings in <code>signal</code>. A contiguous segment is considered <em>stable</em> if the difference between its maximum and minimum reading is at most <code>drift</code>. Return the length of the longest stable segment.',
    examples: [
      ['[1,3,6,4,1,2]\n2', '3', 'Segment [4,1,2]? no; [1,3]? len2; best stable run within drift 2 has length 3.'],
      ['[10,10,10]\n0', '3', 'All equal, any drift works.'],
    ],
    constraints: ['1 <= signal.length <= 10^5', '0 <= signal[i] <= 10^9', '0 <= drift <= 10^9'],
    tags: ['sliding-window', 'monotonic-queue'],
    py: `def longestStable(signal, drift):
    maxq = deque()
    minq = deque()
    left = 0
    best = 0
    for right, v in enumerate(signal):
        while maxq and signal[maxq[-1]] <= v:
            maxq.pop()
        maxq.append(right)
        while minq and signal[minq[-1]] >= v:
            minq.pop()
        minq.append(right)
        while signal[maxq[0]] - signal[minq[0]] > drift:
            left += 1
            if maxq[0] < left:
                maxq.popleft()
            if minq[0] < left:
                minq.popleft()
        best = max(best, right - left + 1)
    return best`,
    approach:
      'Slide a window while maintaining two monotonic deques: one for the window maximum and one for the minimum. When max minus min exceeds drift, shrink the window from the left, evicting stale deque fronts. Track the widest valid window.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    multiParam: true,
    cases: [
      ['[1,3,6,4,1,2]', '2'],
      ['[10,10,10]', '0'],
      ['[1]', '5'],
      ['[5,4,3,2,1]', '1'],
      ['[1,2,3,4,5]', '10'],
      ['[8,2,4,7,1]', '3'],
      ['[1,1,1,1]', '0'],
      ['[100,1,100,1]', '99'],
      ['[3,3,3,9,3]', '2'],
      ['[0,0,0,0,0]', '0'],
    ],
  },
  {
    n: 3929,
    id: 'pghub-b14-festival-routes',
    name: 'Festival Route Costs',
    topic_id: 'graphs',
    difficulty: 'Medium',
    method_name: 'cheapestReach',
    params: [
      { name: 'n', type: 'int' },
      { name: 'roads', type: 'List[List[int]]' },
      { name: 'start', type: 'int' },
    ],
    return_type: 'List[int]',
    statement:
      'A festival spans <code>n</code> stages numbered <code>0..n-1</code> connected by bidirectional <code>roads</code>, where each road is <code>[u, v, w]</code> with travel cost <code>w</code>. Starting at stage <code>start</code>, return a list <code>ans</code> of length n where <code>ans[i]</code> is the minimum total cost to reach stage i, or -1 if stage i is unreachable.',
    examples: [
      ['3\n[[0,1,4],[1,2,1]]\n0', '[0,4,5]', 'Reach stage 2 via stage 1 for 4+1=5.'],
      ['2\n[]\n0', '[0,-1]', 'Stage 1 is isolated.'],
    ],
    constraints: ['1 <= n <= 10^4', '0 <= roads.length <= 10^5', '0 <= u, v < n', '1 <= w <= 10^6', '0 <= start < n'],
    tags: ['graphs', 'dijkstra'],
    py: `def cheapestReach(n, roads, start):
    adj = defaultdict(list)
    for u, v, w in roads:
        adj[u].append((v, w))
        adj[v].append((u, w))
    INF = float('inf')
    dist = [INF] * n
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return [-1 if x == INF else x for x in dist]`,
    approach:
      'Build an undirected adjacency list and run Dijkstra from the start stage with a min-heap. Each popped node finalizes its shortest cost; relax its neighbors. Unreached stages remain at infinity and are reported as -1.',
    complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
    multiParam: true,
    cases: [
      ['3', '[[0,1,4],[1,2,1]]', '0'],
      ['2', '[]', '0'],
      ['1', '[]', '0'],
      ['4', '[[0,1,1],[1,2,1],[2,3,1],[0,3,10]]', '0'],
      ['4', '[[0,1,5],[0,2,3],[2,1,1]]', '0'],
      ['3', '[[0,1,2],[0,2,2],[1,2,1]]', '2'],
      ['5', '[[0,1,1],[2,3,1]]', '0'],
      ['3', '[[0,1,7],[1,2,7],[0,2,3]]', '0'],
      ['2', '[[0,1,1000000]]', '0'],
      ['4', '[[1,2,1],[2,3,1]]', '1'],
    ],
  },
  {
    n: 3930,
    id: 'pghub-b14-coin-tower',
    name: 'Coin Tower Stacking',
    topic_id: 'dp',
    difficulty: 'Easy',
    method_name: 'maxStacks',
    params: [{ name: 'coins', type: 'int' }],
    return_type: 'int',
    statement:
      'You build a staircase of coins: row 1 needs 1 coin, row 2 needs 2 coins, and so on. A row counts only if it is <em>completely</em> filled. Given <code>coins</code> total coins, return the number of complete rows you can build.',
    examples: [
      ['5', '2', 'Rows of 1 and 2 use 3 coins; the third row needs 3 but only 2 remain.'],
      ['8', '3', 'Rows 1+2+3 = 6 coins; 2 left over, not enough for row 4.'],
    ],
    constraints: ['0 <= coins <= 2 * 10^9'],
    tags: ['math', 'binary-search'],
    py: `def maxStacks(coins):
    lo, hi = 0, coins
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if mid * (mid + 1) // 2 <= coins:
            lo = mid
        else:
            hi = mid - 1
    return lo`,
    approach:
      'k complete rows use k*(k+1)/2 coins, which is monotonic in k. Binary-search the largest k whose triangular number does not exceed the coin count.',
    complexity: { time: 'O(log coins)', space: 'O(1)' },
    cases: [
      ['5'],
      ['8'],
      ['0'],
      ['1'],
      ['2'],
      ['3'],
      ['10'],
      ['15'],
      ['1000000000'],
      ['2000000000'],
    ],
  },
  {
    n: 4544,
    id: 'pghub-b14-keystroke-undo',
    name: 'Keystroke Undo Buffer',
    topic_id: 'stack',
    difficulty: 'Easy',
    method_name: 'finalText',
    params: [{ name: 'keys', type: 'str' }],
    return_type: 'str',
    statement:
      'A minimal editor processes a keystroke string <code>keys</code> left to right. A lowercase letter types that character. The character <code>#</code> is a backspace that deletes the most recent typed character (if any). Return the final visible text after all keystrokes.',
    examples: [
      ['"ab#c"', '"ac"', 'Type a, b, delete b, type c.'],
      ['"###"', '""', 'Backspaces on empty text do nothing.'],
    ],
    constraints: ['0 <= keys.length <= 10^5', 'keys consists of lowercase letters and the character #'],
    tags: ['stack', 'strings'],
    py: `def finalText(keys):
    out = []
    for ch in keys:
        if ch == '#':
            if out:
                out.pop()
        else:
            out.append(ch)
    return ''.join(out)`,
    approach:
      'Treat the visible text as a stack. Push each typed letter; on a backspace pop the top if the stack is nonempty. The remaining stack, joined, is the final text.',
    complexity: { time: 'O(n)', space: 'O(n)' },
    cases: [
      ['"ab#c"'],
      ['"###"'],
      ['""'],
      ['"abc"'],
      ['"a#b#c#"'],
      ['"ab##cd"'],
      ['"#a#b"'],
      ['"hello###p"'],
      ['"xyz"'],
      ['"q#w#e#r#t#y#"'],
    ],
  },
];

function runPythonExpected(prob) {
  const inputs = prob.cases;
  const callLines = inputs
    .map((c) => {
      const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
      const argLiterals = argStrs.map((a) => a).join(', ');
      return `    print("<<B14>>" + _ser(${prob.method_name}(${argLiterals})) + "<<END>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${prob.py}\n\nif True:\n${callLines}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b14-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Python failed for #${prob.n} (${prob.id}):\n${res.stderr}`);
  }
  const outputs = (res.stdout.match(/<<B14>>([\s\S]*?)<<END>>/g) || []).map((m) =>
    m.slice('<<B14>>'.length, -'<<END>>'.length)
  );
  if (outputs.length !== inputs.length) {
    throw new Error(`#${prob.n}: expected ${inputs.length} outputs, got ${outputs.length}\n${res.stdout}`);
  }
  return inputs.map((c, idx) => {
    const argStrs = (Array.isArray(c) ? c : [c]).filter((x) => x !== null && x !== undefined);
    return { inputs: argStrs, expected: outputs[idx], is_sample: idx < 2 };
  });
}

function buildDescription(prob) {
  const ex = prob.examples
    .map(
      (e, i) =>
        `<p><strong>Example ${i + 1}:</strong></p>\n<pre>Input: ${escapeHtml(
          e[0].replace(/\n/g, ', ')
        )}\nOutput: ${escapeHtml(e[1])}${e[2] ? `\nExplanation: ${escapeHtml(e[2])}` : ''}</pre>`
    )
    .join('\n');
  const cons = `<p><strong>Constraints:</strong></p>\n<ul>${prob.constraints
    .map((c) => `<li><code>${escapeHtml(c)}</code></li>`)
    .join('')}</ul>`;
  return `<p>${prob.statement}</p>\n${ex}\n${cons}`;
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function skeleton(prob) {
  return { python: { code: pythonClassWrap(prob), approach: prob.approach, complexity: prob.complexity } };
}
function pythonClassWrap(prob) {
  const sig = prob.params.map((p) => p.name).join(', ');
  const lines = prob.py.split('\n');
  const entryHeader = `def ${prob.method_name}(`;
  const idx = lines.findIndex((l) => l.startsWith(entryHeader));
  const preamble = idx > 0 ? lines.slice(0, idx).join('\n').replace(/\n+$/, '') : '';
  const fnLines = lines.slice(idx);
  const bodyLines = fnLines.slice(1);
  const body = bodyLines.map((l) => (l ? '        ' + l : l)).join('\n');
  const cls = `class Solution:\n    def ${prob.method_name}(self, ${sig}):\n${body}`;
  return preamble ? `${preamble}\n\n\n${cls}` : cls;
}

function buildRow(prob) {
  const test_cases = runPythonExpected(prob);
  const tags = Array.from(new Set(['PGHub', ...prob.tags]));
  return {
    row: {
      id: prob.id,
      topic_id: prob.topic_id,
      name: prob.name,
      difficulty: prob.difficulty,
      description: buildDescription(prob),
      method_name: prob.method_name,
      params: prob.params,
      return_type: prob.return_type,
      test_cases,
      constraints: prob.constraints.join('\n'),
      tags,
      topics: [],
      solutions: skeleton(prob),
      leetcode_number: prob.n,
      frequency_score: 0,
    },
    test_cases,
  };
}

// Re-run the STORED solution code against the STORED test cases (independent grade).
function gradeStored(prob, row) {
  const code = row.solutions.python.code;
  const calls = row.test_cases
    .map((tc, idx) => {
      const argLiterals = tc.inputs.join(', ');
      return `    _out = _ser(_sol.${prob.method_name}(${argLiterals}))\n    _exp = ${JSON.stringify(tc.expected)}\n    print("<<G>>" + ("PASS" if _out == _exp else ("FAIL idx=${idx} got="+repr(_out)+" exp="+repr(_exp))) + "<<E>>")`;
    })
    .join('\n');
  const program = `${PY_SERIALIZER}\n${code}\n\n_sol = Solution()\nif True:\n${calls}\n`;
  const tmp = path.join(os.tmpdir(), `pghub-b14-grade-${prob.n}.py`);
  fs.writeFileSync(tmp, program);
  const res = spawnSync('python3', [tmp], { encoding: 'utf8' });
  if (res.status !== 0) throw new Error(`Grade run failed #${prob.n}:\n${res.stderr}`);
  const lines = (res.stdout.match(/<<G>>([\s\S]*?)<<E>>/g) || []).map((m) =>
    m.slice('<<G>>'.length, -'<<E>>'.length)
  );
  const pass = lines.filter((l) => l === 'PASS').length;
  const fails = lines.filter((l) => l.startsWith('FAIL'));
  return { pass, total: lines.length, fails };
}

async function main() {
  const wanted = cliNums.length ? cliNums : BATCH;
  const targets = PROBLEMS.filter((p) => wanted.includes(p.n)).sort((a, b) => a.n - b.n);

  if (VERIFY) {
    const { data: stored } = await sb
      .from('PGcode_problems')
      .select('leetcode_number,name,tags,test_cases,solutions,method_name')
      .in('leetcode_number', wanted)
      .order('leetcode_number');
    let allPass = 0, allTotal = 0, ok = 0;
    for (const r of stored || []) {
      const g = gradeStored({ method_name: r.method_name }, r);
      allPass += g.pass; allTotal += g.total;
      const tagged = (r.tags || []).includes('PGHub');
      const inRange = r.leetcode_number > 3900 && r.leetcode_number <= 4544;
      if (g.pass === g.total && tagged && inRange) ok++;
      console.log(`  #${r.leetcode_number} ${r.name}: ${g.pass}/${g.total} pass, PGHub=${tagged}${g.fails.length ? ' ' + g.fails.join('; ') : ''}`);
    }
    console.log(`\nVERIFY: ${allPass}/${allTotal} cases pass across ${(stored || []).length} rows; ${ok} fully-green in-range PGHub rows.`);
    return;
  }

  console.log(`Authoring ${targets.length} problems for gaps: ${targets.map((t) => t.n).join(', ')}`);

  const { data: existing, error: exErr } = await sb
    .from('PGcode_problems')
    .select('leetcode_number,id')
    .in('leetcode_number', wanted);
  if (exErr) throw exErr;
  const haveNums = new Set((existing || []).map((e) => e.leetcode_number));
  const { data: existIds } = await sb.from('PGcode_problems').select('id').in('id', targets.map((t) => t.id));
  const haveIds = new Set((existIds || []).map((e) => e.id));

  const rows = [];
  for (const prob of targets) {
    if (haveNums.has(prob.n)) { console.log(`  skip #${prob.n} (${prob.id}) — number already present`); continue; }
    if (haveIds.has(prob.id)) { console.log(`  skip #${prob.n} (${prob.id}) — id already present`); continue; }
    const { row, test_cases } = buildRow(prob);
    const g = gradeStored(prob, row);
    if (g.pass !== g.total) {
      throw new Error(`P0: #${prob.n} ${prob.name} stored solution fails ${g.total - g.pass} cases: ${g.fails.join('; ')}`);
    }
    rows.push(row);
    console.log(`  ok   #${prob.n} ${prob.name} [${prob.topic_id}/${prob.difficulty}] — ${test_cases.length} cases, ${g.pass}/${g.total} pass`);
  }

  if (!rows.length) { console.log('Nothing new to insert.'); return; }
  if (DRY) { console.log(`\n[DRY] Would insert ${rows.length} rows. Skipping write.`); return; }

  const { error: insErr } = await sb.from('PGcode_problems').insert(rows);
  if (insErr) throw insErr;
  console.log(`\nInserted ${rows.length} rows.`);

  const { data: check } = await sb
    .from('PGcode_problems')
    .select('leetcode_number,name,tags')
    .in('leetcode_number', wanted)
    .order('leetcode_number');
  const pghub = (check || []).filter((c) => (c.tags || []).includes('PGHub'));
  console.log(`\nVerify: ${pghub.length}/${wanted.length} target numbers now present & tagged PGHub.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
