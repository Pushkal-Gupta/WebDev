// Concept-visualization batch for the dynamic-programming concepts:
//   dp-bitmask                 — Held-Karp dp[mask][last] over visited subsets
//   dp-interval-mcm            — matrix-chain dp[i][j] over intervals by length
//   dp-tree                    — post-order dp[u][0/1] largest independent set
//   dp-digit                   — count_up_to(N) digit-by-digit (pos,rem,tight)
//   dp-game-theory             — Sprague-Grundy mex over reachable states
//   dp-optimal-bst             — range dp[i][j] over interval length
//   dp-job-scheduling          — weighted interval scheduling dp[i] + predecessor
//   dp-longest-arithmetic-seq  — per-index dp[i][diff] over all pairs
//
// All frames target the ARRAY renderer in tile mode (string cell values force the
// labeled-tile layout, which shows distinct DP-table entries with per-cell roles
// instead of distorting magnitudes into bars). Frame shape mirrors
// AlgoVisualizer.jsx ArrayRenderer EXACTLY:
//   { array: (string)[],
//     highlights?: { [index]: 'current'|'match'|'pivot'|'visited'|'done'|'compared'|'low'|'high'|'mid' },
//     pointers?:   { [index]: string },           // labels above the row
//     subRow?:     { values: (string|number)[], label?: string },
//     chip?:       { label, value },
//     caption }
// Role legend used throughout (semantic flags only — NO colors in data):
//   'current'  = the cell being computed this step
//   'pivot'    = a dependency cell the recurrence reads (left/sub-state)
//   'compared' = a second dependency cell (right/other sub-state)
//   'done'     = a cell already finalized earlier
//   'match'    = the final answer cell
//   'visited'  = context cell (input / boundary)
// Every helper is self-contained pure JS — no imports from conceptVisualizations.js.

const DOT = '·';
const fmt = (v) => (v === Infinity || v === undefined || v === null ? DOT : String(v));

// ===========================================================================
// 1. dp-bitmask — Held-Karp TSP. dp[mask][i] = cheapest path starting at city 0,
//    visiting exactly the cities in `mask`, ending at city i. We render the dp
//    table as a flat row-major array (rows = masks, cols = last-city i) and
//    highlight the state being relaxed plus the predecessor it reads.
// ===========================================================================
function bitmaskHeldKarp({ n, dist, label }) {
  const FULL = 1 << n;
  const INF = Infinity;
  const dp = Array.from({ length: FULL }, () => new Array(n).fill(INF));
  dp[1][0] = 0;
  const frames = [];

  const members = (m) => {
    const out = [];
    for (let i = 0; i < n; i++) if (m & (1 << i)) out.push(i);
    return out;
  };
  const maskLabel = (m) => `{${members(m).join(',') || '∅'}}`;
  // Show only the reachable masks (those containing city 0) to keep the row short.
  const rows = [];
  for (let m = 1; m < FULL; m++) if (m & 1) rows.push(m);
  const idxOf = (m, i) => rows.indexOf(m) * n + i;

  const view = () => {
    const arr = [];
    for (const m of rows) for (let i = 0; i < n; i++) arr.push(fmt(dp[m][i]));
    return arr;
  };
  const rowPointers = () => {
    const p = {};
    rows.forEach((m, r) => { p[r * n] = maskLabel(m); });
    return p;
  };
  const snap = (highlights, caption) => {
    frames.push({ array: view(), highlights: highlights || {}, pointers: rowPointers(), caption });
  };

  snap({ [idxOf(1, 0)]: 'visited' },
    `${label}: Held-Karp. Each row is a visited-set mask (label at its left); each of the ${n} columns is the last city. dp[mask][i] = cheapest path that starts at city 0, visits exactly mask, and ends at i. Base: dp[{0}][0] = 0.`);
  snap({ [idxOf(1, 0)]: 'done' },
    `Masks are swept in increasing integer order. Because mask | (1<<j) > mask, every predecessor state is already final before we read it — no cycles, single pass.`);

  for (const mask of rows) {
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i)) || dp[mask][i] === INF) continue;
      for (let j = 0; j < n; j++) {
        if (mask & (1 << j)) continue;
        const nm = mask | (1 << j);
        const cand = dp[mask][i] + dist[i][j];
        const improved = cand < dp[nm][j];
        const hl = { [idxOf(mask, i)]: 'pivot', [idxOf(nm, j)]: 'current' };
        snap(hl,
          `Relax from dp[${maskLabel(mask)}][${i}] = ${dp[mask][i]} by stepping to city ${j} (edge ${i}→${j} costs ${dist[i][j]}). Candidate dp[${maskLabel(nm)}][${j}] = ${dp[mask][i]} + ${dist[i][j]} = ${cand}. ${improved ? `Beats the old ${fmt(dp[nm][j])} — record ${cand}.` : `Old value ${fmt(dp[nm][j])} is already as good — keep it.`}`);
        if (improved) dp[nm][j] = cand;
      }
    }
  }

  const all = FULL - 1;
  let best = INF, bestEnd = -1;
  for (let i = 1; i < n; i++) {
    if (dp[all][i] === INF) continue;
    const total = dp[all][i] + dist[i][0];
    snap({ [idxOf(all, i)]: 'pivot' },
      `Close the tour: from dp[ALL][${i}] = ${dp[all][i]} add the return edge ${i}→0 (cost ${dist[i][0]}) → full cycle cost ${total}.`);
    if (total < best) { best = total; bestEnd = i; }
  }
  snap({ [idxOf(all, bestEnd)]: 'match' },
    `${label}: minimum tour cost = ${best}, last city before home is ${bestEnd}. Held-Karp runs in O(2^n · n^2) time, O(2^n · n) memory — far below the n! of brute force.`);
  return frames;
}

function bitmaskFourCities() {
  const dist = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
  ];
  return bitmaskHeldKarp({ n: 4, dist, label: 'TSP (4 cities)' });
}
function bitmaskFourCitiesB() {
  const dist = [
    [0, 8, 5, 12],
    [8, 0, 9, 4],
    [5, 9, 0, 7],
    [12, 4, 7, 0],
  ];
  return bitmaskHeldKarp({ n: 4, dist, label: 'TSP (4 cities, B)' });
}

// ===========================================================================
// 2. dp-interval-mcm — matrix-chain. dp[i][j] = min scalar multiplications for
//    A_i..A_j. Filled by increasing interval length. We render the upper
//    triangle as a flat array (n*n) and highlight dp[i][k] + dp[k+1][j].
// ===========================================================================
function mcmFrames({ p, label }) {
  const n = p.length - 1; // matrices A_1..A_n, matrix i is p[i-1] x p[i]
  const dp = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  const frames = [];

  // Flat 1-indexed (i,j) projected onto an n*n array; cell (i,j) -> (i-1)*n+(j-1).
  const idx = (i, j) => (i - 1) * n + (j - 1);
  const view = () => {
    const arr = new Array(n * n).fill(DOT);
    for (let i = 1; i <= n; i++) for (let j = i; j <= n; j++) arr[idx(i, j)] = fmt(dp[i][j]);
    return arr;
  };
  const rowPointers = () => {
    const ptr = {};
    for (let i = 1; i <= n; i++) ptr[idx(i, i)] = `i=${i}`;
    return ptr;
  };
  const snap = (highlights, caption) => {
    frames.push({ array: view(), highlights: highlights || {}, pointers: rowPointers(), caption });
  };

  const dims = Array.from({ length: n }, (_, k) => `A${k + 1}(${p[k]}×${p[k + 1]})`).join('  ');
  snap({}, `${label}: chain ${dims}. dp[i][j] = fewest scalar multiplications to multiply A_i..A_j. Diagonal base case dp[i][i] = 0 (one matrix needs no work). The row label i marks each interval start.`);
  snap({}, `Recurrence: dp[i][j] = min over split k of dp[i][k] + dp[k+1][j] + p[i-1]·p[k]·p[j]. Fill by increasing interval length so both sub-intervals are ready before the longer one is computed.`);

  for (let len = 2; len <= n; len++) {
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      let best = Infinity, bestK = i;
      snap({ [idx(i, j)]: 'current' },
        `Interval length ${len}: compute dp[${i}][${j}] (multiplying A${i}..A${j}). Try every split point k in [${i}..${j - 1}].`);
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j];
        const hl = { [idx(i, j)]: 'current', [idx(i, k)]: 'pivot', [idx(k + 1, j)]: 'compared' };
        const improved = cost < best;
        snap(hl,
          `Split at k=${k}: dp[${i}][${k}] (=${dp[i][k]}) + dp[${k + 1}][${j}] (=${dp[k + 1][j]}) + p[${i - 1}]·p[${k}]·p[${j}] (=${p[i - 1]}·${p[k]}·${p[j]}=${p[i - 1] * p[k] * p[j]}) = ${cost}. ${improved ? `New best for dp[${i}][${j}].` : `Not better than ${best}.`}`);
        if (improved) { best = cost; bestK = k; }
      }
      dp[i][j] = best;
      snap({ [idx(i, j)]: 'done' },
        `dp[${i}][${j}] = ${best}, achieved by splitting at k=${bestK}: (A${i}..A${bestK})(A${bestK + 1}..A${j}). Cell finalized.`);
    }
  }
  snap({ [idx(1, n)]: 'match' },
    `${label}: optimal cost = ${dp[1][n]} scalar multiplications, stored in dp[1][${n}]. Interval DP runs in O(n^3) time, O(n^2) space; the split index table reconstructs the full parenthesization.`);
  return frames;
}
function mcmFour() { return mcmFrames({ p: [40, 20, 30, 10, 30], label: 'Matrix chain (4 matrices)' }); }
function mcmThree() { return mcmFrames({ p: [10, 30, 5, 60], label: 'Matrix chain (3 matrices)' }); }

// ===========================================================================
// 3. dp-tree — largest independent set on a rooted tree. dp[u][0] = best with u
//    excluded, dp[u][1] = best with u included. Post-order DFS. Rendered as two
//    rows (dp[*][0] then dp[*][1]) over the nodes.
// ===========================================================================
function treeLISFrames({ n, edges, root, label }) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  // Post-order via iterative DFS.
  const parent = new Array(n).fill(-1);
  const order = [];
  const seen = new Array(n).fill(false);
  const stack = [root];
  seen[root] = true;
  while (stack.length) {
    const u = stack.pop();
    order.push(u);
    for (const v of adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; stack.push(v); }
  }
  const dp = Array.from({ length: n }, () => [null, null]); // [exclude, include]
  const frames = [];

  // Flat array: first n cells = dp[u][0], next n cells = dp[u][1].
  const view = () => {
    const arr = [];
    for (let u = 0; u < n; u++) arr.push(dp[u][0] === null ? DOT : String(dp[u][0]));
    for (let u = 0; u < n; u++) arr.push(dp[u][1] === null ? DOT : String(dp[u][1]));
    return arr;
  };
  const labels = () => {
    const p = {};
    for (let u = 0; u < n; u++) { p[u] = `dp[${u}][0]`; p[n + u] = `dp[${u}][1]`; }
    return p;
  };
  const snap = (highlights, caption) => {
    frames.push({ array: view(), highlights: highlights || {}, pointers: labels(), caption });
  };

  const edgeStr = edges.map(([a, b]) => `${a}-${b}`).join(' ');
  snap({}, `${label}: largest independent set on a tree rooted at ${root} (edges ${edgeStr}). Top row is dp[u][0] = best subtree value with u EXCLUDED; bottom row dp[u][1] = with u INCLUDED. No two chosen nodes may share an edge.`);
  snap({}, `Process nodes in post-order so every child is final before its parent. Recurrence: dp[u][1] = 1 + Σ dp[c][0] (pick u → children must be skipped); dp[u][0] = Σ max(dp[c][0], dp[c][1]) (skip u → children free).`);

  for (let t = order.length - 1; t >= 0; t--) {
    const u = order[t];
    const kids = adj[u].filter((c) => parent[c] === u);
    let exc = 0, inc = 1;
    const depHl = {};
    for (const c of kids) { depHl[c] = 'pivot'; depHl[n + c] = 'compared'; }
    if (kids.length) {
      snap({ ...depHl, [u]: 'current', [n + u]: 'current' },
        `Node ${u} (children ${kids.join(', ')}): read each child's two finalized values to aggregate.`);
    }
    for (const c of kids) { exc += Math.max(dp[c][0], dp[c][1]); inc += dp[c][0]; }
    dp[u][0] = exc; dp[u][1] = inc;
    snap({ [u]: 'done', [n + u]: 'done' },
      `${kids.length ? 'Node' : 'Leaf'} ${u}: dp[${u}][0] = ${exc}${kids.length ? ` (Σ max over children)` : ' (exclude → 0)'}, dp[${u}][1] = ${inc}${kids.length ? ` (1 + Σ dp[c][0])` : ' (include → 1)'}. Both cells finalized.`);
  }
  const ans = Math.max(dp[root][0], dp[root][1]);
  const ansIdx = dp[root][1] >= dp[root][0] ? n + root : root;
  snap({ [ansIdx]: 'match' },
    `${label}: answer = max(dp[${root}][0]=${dp[root][0]}, dp[${root}][1]=${dp[root][1]}) = ${ans}. One post-order DFS gives O(n) — the tree's cycle-free structure means each subtree merges into its parent with no double counting.`);
  return frames;
}
function treeStar() {
  // Root 0 with leaves 1..6 — classic star, answer = 6 (take all leaves).
  return treeLISFrames({ n: 7, edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]], root: 0, label: 'Independent set (star)' });
}
function treePath() {
  // Path 0-1-2-3-4, answer = 3 (nodes 0,2,4).
  return treeLISFrames({ n: 5, edges: [[0, 1], [1, 2], [2, 3], [3, 4]], root: 0, label: 'Independent set (path)' });
}

// ===========================================================================
// 4. dp-digit — count_up_to(N) of integers in [0,N] divisible by k, built digit
//    by digit. We render the running prefix as a row of chosen digits and use a
//    chip for (pos, rem, tight, count). State key = (pos, rem) when not tight.
// ===========================================================================
function digitDPFrames({ N, k, label }) {
  const digits = String(N).split('').map(Number);
  const D = digits.length;
  const frames = [];
  // Recursive count with full narration. We surface the digit-choice loop.
  const blanks = () => new Array(D).fill('_');

  const snap = (prefix, highlights, chip, caption) => {
    frames.push({
      array: prefix.map((d) => (d === null ? '_' : String(d))),
      highlights: highlights || {},
      pointers: Object.fromEntries(prefix.map((_, i) => [i, `pos ${i}`])),
      chip,
      caption,
    });
  };

  snap(blanks().map(() => null), {},
    { label: 'target N', value: String(N) },
    `${label}: count integers in [0, ${N}] divisible by ${k}. Build the number left-to-right across ${D} positions; each cell is a chosen digit. State carries (pos, rem = running value mod ${k}, tight = prefix still equals N's prefix).`);
  snap(digits.map((d) => d), Object.fromEntries(digits.map((_, i) => [i, 'visited'])),
    { label: 'tight path', value: digits.join('') },
    `The tight path follows N's own digits ${digits.join('')}. At each position, choosing a digit strictly below N's digit frees every later position (tight becomes false); choosing equal keeps it tight.`);

  // Walk the tight prefix one position at a time, showing the digit choices.
  let rem = 0;
  let count = 0;
  // Helper: count length-`len` suffixes (free digits) whose total value ≡ targetRem.
  // value mod k of a free suffix with starting remainder r: enumerate via DP table.
  const freeCount = (startRem, len) => {
    // dp over positions: number of ways to reach each remainder, then those ≡0 at end.
    let cur = new Array(k).fill(0);
    cur[startRem % k] = 1;
    for (let s = 0; s < len; s++) {
      const next = new Array(k).fill(0);
      for (let r = 0; r < k; r++) {
        if (!cur[r]) continue;
        for (let d = 0; d <= 9; d++) next[(r * 10 + d) % k] += cur[r];
      }
      cur = next;
    }
    return cur[0];
  };

  for (let pos = 0; pos < D; pos++) {
    const cap = digits[pos];
    const prefixSoFar = digits.slice(0, pos).concat(new Array(D - pos).fill(null));
    snap(prefixSoFar, { [pos]: 'current' },
      { label: 'rem', value: rem },
      `Position ${pos}: tight prefix is ${digits.slice(0, pos).join('') || '(empty)'} with rem = ${rem}. N's digit here is ${cap}, so a tight choice may use any digit 0..${cap}.`);
    // Digits strictly below cap branch into "free" suffixes.
    let added = 0;
    for (let d = 0; d < cap; d++) {
      const newRem = (rem * 10 + d) % k;
      const ways = freeCount(newRem, D - pos - 1);
      added += ways;
      const pre = digits.slice(0, pos).concat([d], new Array(D - pos - 1).fill(null));
      snap(pre, { [pos]: 'pivot' },
        { label: 'subtotal', value: count + added },
        `Choose digit ${d} (< ${cap}) at position ${pos}: the remaining ${D - pos - 1} position${D - pos - 1 === 1 ? '' : 's'} are now FREE (any 0..9). Of those, ${ways} suffix${ways === 1 ? '' : 'es'} make the whole number divisible by ${k}. These are memoized on (pos, rem) — independent of N.`);
    }
    count += added;
    // Continue tight: pick d == cap.
    rem = (rem * 10 + cap) % k;
  }
  // After consuming all digits tightly, N itself is included iff rem == 0.
  if (rem === 0) count += 1;
  snap(digits.map((d) => d), { [D - 1]: 'done' },
    { label: 'total', value: count },
    `Finish the tight path = N itself (${N}); its value mod ${k} is ${rem}, so N ${rem === 0 ? 'IS' : 'is NOT'} counted.`);
  snap(digits.map((d) => d), Object.fromEntries(digits.map((_, i) => [i, 'match'])),
    { label: 'answer', value: count },
    `${label}: ${count} integers in [0, ${N}] are divisible by ${k}. Digit DP runs in O(D · states · 10) — here ${D} positions × ${k} remainders × 10 digits — instead of enumerating ${N + 1} integers.`);
  return frames;
}
function digitDivisible() { return digitDPFrames({ N: 25, k: 3, label: 'Digit DP (÷3 in [0,25])' }); }
function digitDivisible5() { return digitDPFrames({ N: 47, k: 5, label: 'Digit DP (÷5 in [0,47])' }); }

// ===========================================================================
// 5. dp-game-theory — Sprague-Grundy. Subtraction game: from a pile of size s a
//    player removes 1, 2, or 3 stones. g(s) = mex of { g(s-m) : m in moves }.
//    Render the Grundy table g[0..N]; XOR of piles decides the winner.
// ===========================================================================
function grundyFrames({ N, moves, label }) {
  const g = new Array(N + 1).fill(null);
  const frames = [];
  const view = () => g.map((v) => (v === null ? DOT : String(v)));
  const ptr = () => Object.fromEntries(g.map((_, s) => [s, `s=${s}`]));
  const snap = (highlights, caption, chip) => {
    frames.push({ array: view(), highlights: highlights || {}, pointers: ptr(), chip, caption });
  };

  snap({ 0: 'current' },
    `${label}: subtraction game — remove ${moves.join(', ')} stones from a pile. g(s) = Grundy number of a pile of size s = mex{ g(s−m) : valid moves m }. g(s)=0 means the player to move LOSES (a P-position).`);
  g[0] = 0;
  snap({ 0: 'done' },
    `Base: g(0) = 0. With no stones the player to move cannot move and loses, so size-0 is a losing position — Grundy value 0.`,
    { label: 'g(0)', value: 0 });

  for (let s = 1; s <= N; s++) {
    const reach = [];
    const depHl = {};
    for (const m of moves) if (s - m >= 0) { reach.push(g[s - m]); depHl[s - m] = 'pivot'; }
    // mex
    const set = new Set(reach);
    let mex = 0;
    while (set.has(mex)) mex += 1;
    g[s] = mex;
    snap({ ...depHl, [s]: 'current' },
      `g(${s}): from size ${s} you can reach sizes ${moves.filter((m) => s - m >= 0).map((m) => s - m).join(', ')} with Grundy values {${reach.join(', ')}}. mex = smallest non-negative integer not in that set = ${mex}.`,
      { label: `g(${s})`, value: mex });
  }
  const losing = [];
  for (let s = 0; s <= N; s++) if (g[s] === 0) losing.push(s);
  snap(Object.fromEntries(losing.map((s) => [s, 'done'])),
    `Losing (P-)positions are exactly where g(s) = 0: sizes ${losing.join(', ')}. The pattern repeats with period ${moves.length + 1} for the take-1..${Math.max(...moves)} game.`,
    { label: 'P-positions', value: losing.length });
  // Multi-pile example via XOR.
  const piles = [3, 4, 5].filter((x) => x <= N);
  const xorAll = piles.reduce((a, p) => a ^ g[p], 0);
  snap(Object.fromEntries(piles.map((p) => [p, 'match'])),
    `${label}: combine independent piles by XOR. Piles ${piles.join(', ')} → g = ${piles.map((p) => g[p]).join(' XOR ')} = ${xorAll}. ${xorAll === 0 ? 'XOR is 0 → the player to move LOSES.' : 'XOR is non-zero → the player to move WINS with optimal play.'}`,
    { label: 'XOR', value: xorAll });
  return frames;
}
function grundyTake123() { return grundyFrames({ N: 9, moves: [1, 2, 3], label: 'Grundy (take 1–3)' }); }
function grundyTake12() { return grundyFrames({ N: 9, moves: [1, 2], label: 'Grundy (take 1–2)' }); }

// ===========================================================================
// 6. dp-optimal-bst — dp[i][j] = min expected search cost of an optimal BST on
//    keys i..j with frequencies freq[]. Filled by increasing interval length.
//    Render the upper triangle; highlight dp[i][r-1] + dp[r+1][j] + rangeSum.
// ===========================================================================
function optimalBSTFrames({ freq, label }) {
  const n = freq.length;
  const pref = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) pref[i + 1] = pref[i] + freq[i];
  const rng = (i, j) => pref[j + 1] - pref[i];
  const dp = Array.from({ length: n }, () => new Array(n).fill(null));
  const frames = [];

  const idx = (i, j) => i * n + j;
  const view = () => {
    const arr = new Array(n * n).fill(DOT);
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) arr[idx(i, j)] = dp[i][j] === null ? DOT : String(dp[i][j]);
    return arr;
  };
  const ptr = () => {
    const p = {};
    for (let i = 0; i < n; i++) p[idx(i, i)] = `i=${i}`;
    return p;
  };
  const snap = (highlights, caption, chip) => {
    frames.push({ array: view(), highlights: highlights || {}, pointers: ptr(), chip, caption });
  };

  snap({}, `${label}: keys 0..${n - 1} with access frequencies [${freq.join(', ')}]. dp[i][j] = minimum expected comparisons for an optimal BST over keys i..j. Hot keys want to sit near the root.`);
  for (let i = 0; i < n; i++) dp[i][i] = freq[i];
  snap(Object.fromEntries(Array.from({ length: n }, (_, i) => [idx(i, i), 'done'])),
    `Base: single-key trees dp[i][i] = freq[i] (one comparison, weighted by access). Recurrence: dp[i][j] = (Σ freq[i..j]) + min over root r of dp[i][r−1] + dp[r+1][j] — choosing root r pushes every key in the range one level deeper, adding the whole range's frequency.`);

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      const sum = rng(i, j);
      let best = Infinity, bestR = i;
      snap({ [idx(i, j)]: 'current' },
        `Interval length ${len}: compute dp[${i}][${j}] over keys ${i}..${j}. Range frequency Σ = ${sum}. Try each key r in [${i}..${j}] as the root.`);
      for (let r = i; r <= j; r++) {
        const left = r > i ? dp[i][r - 1] : 0;
        const right = r < j ? dp[r + 1][j] : 0;
        const cost = sum + left + right;
        const hl = { [idx(i, j)]: 'current' };
        if (r > i) hl[idx(i, r - 1)] = 'pivot';
        if (r < j) hl[idx(r + 1, j)] = 'compared';
        const improved = cost < best;
        snap(hl,
          `Root r=${r}: left dp[${i}][${r - 1}] (=${left}) + right dp[${r + 1}][${j}] (=${right}) + range Σ (=${sum}) = ${cost}. ${improved ? 'New best.' : `Not better than ${best}.`}`,
          { label: 'best so far', value: improved ? cost : best });
        if (improved) { best = cost; bestR = r; }
      }
      dp[i][j] = best;
      snap({ [idx(i, j)]: 'done' },
        `dp[${i}][${j}] = ${best}, optimal root = key ${bestR}. Cell finalized.`);
    }
  }
  snap({ [idx(0, n - 1)]: 'match' },
    `${label}: minimum expected cost = ${dp[0][n - 1]}, in dp[0][${n - 1}]. Naive fill is O(n^3); Knuth's monotone-root bound root[i][j−1] ≤ root[i][j] ≤ root[i+1][j] telescopes it to O(n^2).`);
  return frames;
}
function obstThree() { return optimalBSTFrames({ freq: [34, 8, 50], label: 'Optimal BST (3 keys)' }); }
function obstFour() { return optimalBSTFrames({ freq: [4, 2, 6, 3], label: 'Optimal BST (4 keys)' }); }

// ===========================================================================
// 7. dp-job-scheduling — weighted interval scheduling. Sort by end time; dp[i] =
//    best profit using jobs 1..i. dp[i] = max(dp[i-1], profit_i + dp[p(i)]),
//    p(i) = latest job ending ≤ start_i. Render dp[] across jobs.
// ===========================================================================
function jobSchedulingFrames({ jobs: raw, label }) {
  const jobs = [...raw].sort((a, b) => a.end - b.end);
  const n = jobs.length;
  const ends = jobs.map((j) => j.end);
  const dp = new Array(n + 1).fill(null);
  const frames = [];

  const view = () => dp.map((v) => (v === null ? DOT : String(v)));
  const ptr = () => {
    const p = { 0: 'dp[0]' };
    for (let i = 1; i <= n; i++) p[i] = `[${jobs[i - 1].start},${jobs[i - 1].end}]·${jobs[i - 1].profit}`;
    return p;
  };
  const snap = (highlights, caption, chip) => {
    frames.push({ array: view(), highlights: highlights || {}, pointers: ptr(), chip, caption });
  };

  const jobStr = jobs.map((j) => `[${j.start},${j.end}]→${j.profit}`).join('  ');
  snap({}, `${label}: jobs sorted by END time: ${jobStr}. dp[i] = best profit achievable using jobs 1..i. The left cell dp[0] = 0 is the empty schedule.`);
  dp[0] = 0;
  snap({ 0: 'done' },
    `Recurrence per job i: dp[i] = max( dp[i−1] (skip job i),  profit_i + dp[p(i)] (take it) ), where p(i) = the latest job whose end ≤ job i's start. Sorting by end lets a binary search find p(i) in O(log n).`,
    { label: 'dp[0]', value: 0 });

  // bisect_right(ends, start) - 1
  const pOf = (start) => {
    let lo = 0, hi = n;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (ends[mid] <= start) lo = mid + 1; else hi = mid; }
    return lo - 1; // index in 0-based jobs; predecessor dp index = (that)+1
  };

  for (let i = 1; i <= n; i++) {
    const job = jobs[i - 1];
    const pIdx = pOf(job.start); // 0-based job index, or -1
    const predDp = pIdx >= 0 ? dp[pIdx + 1] : 0;
    const take = job.profit + predDp;
    const skip = dp[i - 1];
    const hl = { [i]: 'current', [i - 1]: 'compared' };
    if (pIdx >= 0) hl[pIdx + 1] = 'pivot';
    snap(hl,
      `Job ${i} = [${job.start},${job.end}] profit ${job.profit}. Predecessor p(${i}) = latest job ending ≤ ${job.start} → ${pIdx >= 0 ? `job ${pIdx + 1} (dp = ${dp[pIdx + 1]})` : 'none (dp = 0)'}. Take = ${job.profit} + ${predDp} = ${take}; skip = dp[${i - 1}] = ${skip}.`,
      { label: 'take vs skip', value: `${take} vs ${skip}` });
    dp[i] = Math.max(skip, take);
    snap({ [i]: 'done' },
      `dp[${i}] = max(${skip}, ${take}) = ${dp[i]}. ${take >= skip ? 'Taking job ' + i + ' wins.' : 'Skipping job ' + i + ' wins.'} Cell finalized.`,
      { label: `dp[${i}]`, value: dp[i] });
  }
  snap({ [n]: 'match' },
    `${label}: maximum profit = ${dp[n]}, in dp[${n}]. Sorting (O(n log n)) plus a binary-search predecessor per job (O(log n)) gives an overall O(n log n) DP — far better than the O(n^2) backward scan.`);
  return frames;
}
function jobsFive() {
  return jobSchedulingFrames({
    jobs: [
      { start: 1, end: 3, profit: 50 },
      { start: 3, end: 5, profit: 20 },
      { start: 6, end: 19, profit: 100 },
      { start: 2, end: 100, profit: 200 },
      { start: 5, end: 7, profit: 30 },
    ],
    label: 'Weighted scheduling (5 jobs)',
  });
}
function jobsFour() {
  return jobSchedulingFrames({
    jobs: [
      { start: 1, end: 2, profit: 50 },
      { start: 3, end: 5, profit: 20 },
      { start: 6, end: 19, profit: 100 },
      { start: 2, end: 100, profit: 200 },
    ],
    label: 'Weighted scheduling (4 jobs)',
  });
}

// ===========================================================================
// 8. dp-longest-arithmetic-seq — dp[i][d] = longest AP ending at index i with
//    common difference d. For each pair (j,i): d = nums[i]-nums[j];
//    dp[i][d] = dp[j].get(d, 1) + 1. Render the nums array, highlight (j,i) and
//    a chip carrying the difference and the running best.
// ===========================================================================
function lasFrames({ nums, label }) {
  const n = nums.length;
  const dp = Array.from({ length: n }, () => new Map());
  const frames = [];
  const ptr = () => Object.fromEntries(nums.map((_, i) => [i, `i=${i}`]));
  const snap = (highlights, caption, chip) => {
    frames.push({ array: nums.map(String), highlights: highlights || {}, pointers: ptr(), chip, caption });
  };

  snap({}, `${label}: nums = [${nums.join(', ')}]. Find the longest arithmetic subsequence (constant common difference). State dp[i][d] = length of the longest AP ending at index i with common difference d — a hashmap per index because d is unbounded (negative, zero, or large).`);
  snap({}, `For each pair (j, i) with j < i, the difference d = nums[i] − nums[j] is forced. Extend the best AP ending at j with that same d: dp[i][d] = dp[j].get(d, 1) + 1. The default 1 is the single-element AP at j; +1 appends nums[i].`);

  let best = Math.min(2, n);
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const d = nums[i] - nums[j];
      const prev = dp[j].get(d) ?? 1;
      const val = prev + 1;
      dp[i].set(d, Math.max(dp[i].get(d) ?? 0, val));
      best = Math.max(best, dp[i].get(d));
      snap({ [j]: 'pivot', [i]: 'current' },
        `Pair (j=${j}, i=${i}): d = nums[${i}] − nums[${j}] = ${nums[i]} − ${nums[j]} = ${d}. dp[${j}] ${dp[j].has(d) ? `already had d=${d} with length ${prev}` : `had no d=${d}, default 1`}, so dp[${i}][${d}] = ${prev} + 1 = ${val}. Running best = ${best}.`,
        { label: `diff ${d}`, value: val });
    }
  }
  // Find the index achieving best for the final highlight.
  let bi = 0, bd = 0;
  for (let i = 0; i < n; i++) for (const [d, v] of dp[i]) if (v === best) { bi = i; bd = d; }
  snap({ [bi]: 'match' },
    `${label}: longest arithmetic subsequence length = ${best} (ending at index ${bi}, common difference ${bd}). All O(n^2) pairs processed in O(1) each → O(n^2) time and space, optimal without extra input structure.`);
  return frames;
}
function lasFiveA() { return lasFrames({ nums: [3, 6, 9, 12, 15], label: 'Longest AP (constant step)' }); }
function lasFiveB() { return lasFrames({ nums: [9, 4, 7, 2, 10], label: 'Longest AP (mixed signs)' }); }

// ===========================================================================
export default {
  'dp-bitmask': {
    title: 'Bitmask DP (Held-Karp)',
    renderer: 'array',
    cases: [
      { label: 'TSP, 4 cities', frames: bitmaskFourCities() },
      { label: 'TSP, 4 cities (variant)', frames: bitmaskFourCitiesB() },
    ],
  },
  'dp-interval-mcm': {
    title: 'Interval DP: Matrix Chain',
    renderer: 'array',
    cases: [
      { label: '3 matrices', frames: mcmThree() },
      { label: '4 matrices', frames: mcmFour() },
    ],
  },
  'dp-tree': {
    title: 'Tree DP: Independent Set',
    renderer: 'array',
    cases: [
      { label: 'Star tree', frames: treeStar() },
      { label: 'Path tree', frames: treePath() },
    ],
  },
  'dp-digit': {
    title: 'Digit DP',
    renderer: 'array',
    cases: [
      { label: 'Divisible by 3 in [0,25]', frames: digitDivisible() },
      { label: 'Divisible by 5 in [0,47]', frames: digitDivisible5() },
    ],
  },
  'dp-game-theory': {
    title: 'Game Theory: Sprague-Grundy',
    renderer: 'array',
    cases: [
      { label: 'Take 1–3 stones', frames: grundyTake123() },
      { label: 'Take 1–2 stones', frames: grundyTake12() },
    ],
  },
  'dp-optimal-bst': {
    title: 'Optimal BST',
    renderer: 'array',
    cases: [
      { label: '3 keys', frames: obstThree() },
      { label: '4 keys', frames: obstFour() },
    ],
  },
  'dp-job-scheduling': {
    title: 'Weighted Interval Scheduling',
    renderer: 'array',
    cases: [
      { label: '4 jobs', frames: jobsFour() },
      { label: '5 jobs', frames: jobsFive() },
    ],
  },
  'dp-longest-arithmetic-seq': {
    title: 'Longest Arithmetic Subsequence',
    renderer: 'array',
    cases: [
      { label: 'Constant step', frames: lasFiveA() },
      { label: 'Mixed signs', frames: lasFiveB() },
    ],
  },
};
