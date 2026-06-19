// Interactive concept visualizations: advanced graphs (Dijkstra + Fibonacci-heap
// priority queue, bridges/articulation via Tarjan low-link), dynamic programming
// (recursion+memo vs bottom-up, Knuth interval-DP split-point monotonicity),
// strings (radix / compressed trie with edge-splitting) and a priority / fair
// scheduler. Each entry mirrors an AlgoVisualizer renderer shape EXACTLY:
//   'graph' -> { nodes:[{id,label,state?}], edges:[{a,b,w?,state?}], caption }
//   'array' -> { array, subRow?, pointers?, highlights?, caption }
//   'grid'  -> { grid:[[token]], cellLabel?, caption }
//   'tree'  -> recursive { _id, value, left, right, state? } + caption
// Self-contained pure JS — no imports from conceptVisualizations.js.

// ===========================================================================
// shared helpers
// ===========================================================================
const INF = Infinity;
function fmt(d) { return d === INF ? '∞' : String(d); }

// ===========================================================================
// dijkstra-fibonacci-heap  (renderer: 'graph')
// Dijkstra's shortest paths driven by a min-priority-queue; narrate the
// Fibonacci-heap operations insert / extract-min / decrease-key explicitly.
// ===========================================================================
function dijkstraFrames({ nodes, edges, source, label }) {
  const adj = {};
  for (const e of edges) {
    (adj[e.a] ||= []).push({ to: e.b, w: e.w });
    (adj[e.b] ||= []).push({ to: e.a, w: e.w });
  }
  const dist = {};
  for (const n of nodes) dist[n.id] = INF;
  dist[source] = 0;
  const settled = new Set();
  const heap = new Set([source]); // node ids currently in the priority queue
  const frames = [];

  const snap = (currentId, relaxEdge, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: `${n.id}\nd=${fmt(dist[n.id])}`,
      state: n.id === currentId ? 'current'
        : settled.has(n.id) ? 'done'
        : heap.has(n.id) ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      if (relaxEdge && ((e.a === relaxEdge.a && e.b === relaxEdge.b) || (e.a === relaxEdge.b && e.b === relaxEdge.a))) {
        return { ...e, state: relaxEdge.state };
      }
      if (settled.has(e.a) && settled.has(e.b)) return { ...e, state: 'visited' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(source, null, `${label}: insert source ${source} with key 0 (O(1) per insert). Every other node starts at d=∞. Fibonacci-heap root list = {${source}}.`);

  while (heap.size) {
    // extract-min: scan the heap for the smallest tentative distance.
    let u = null;
    for (const id of heap) if (u === null || dist[id] < dist[u]) u = id;
    heap.delete(u);
    settled.add(u);
    snap(u, null, `Extract-min pops ${u} (d=${dist[u]}) — amortized O(log V): remove the min root, then consolidate same-degree trees. ${u} is now settled; its distance is final.`);

    for (const { to: v, w } of (adj[u] || [])) {
      if (settled.has(v)) continue;
      const nd = dist[u] + w;
      if (nd < dist[v]) {
        const had = heap.has(v);
        const old = dist[v];
        dist[v] = nd;
        heap.add(v);
        snap(u, { a: u, b: v, state: 'current' },
          had
            ? `Relax edge ${u}–${v} (w=${w}): ${dist[u]}+${w}=${nd} < ${fmt(old)}, so decrease-key on ${v}. The Fibonacci heap cuts ${v} from its parent and re-roots it in O(1) amortized — the operation it was built to make cheap.`
            : `Relax edge ${u}–${v} (w=${w}): first route to ${v}, set d=${nd} and insert it into the heap (O(1)).`);
      } else {
        snap(u, { a: u, b: v, state: 'rejected' },
          `Edge ${u}–${v} (w=${w}): ${dist[u]}+${w}=${nd} ≥ ${fmt(dist[v])}, no improvement — skip. No heap operation needed.`);
      }
    }
  }
  snap(null, null, `${label}: heap empty, all nodes settled. Total cost = V extract-mins × O(log V) + E decrease-keys × O(1) = O(E + V log V). Each node's d is its shortest distance from ${source}.`);
  return frames;
}

function dijkstraSparse() {
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 4 }, { a: 0, b: 2, w: 1 },
    { a: 2, b: 1, w: 2 }, { a: 1, b: 3, w: 1 },
    { a: 2, b: 4, w: 5 }, { a: 3, b: 5, w: 3 }, { a: 4, b: 5, w: 2 },
  ];
  return dijkstraFrames({ nodes, edges, source: 0, label: 'Dijkstra (sparse graph)' });
}

function dijkstraTriangle() {
  const nodes = [0, 1, 2, 3].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 1 }, { a: 1, b: 2, w: 1 },
    { a: 0, b: 2, w: 5 }, { a: 2, b: 3, w: 2 },
  ];
  return dijkstraFrames({ nodes, edges, source: 0, label: 'Dijkstra (relaxation pays off)' });
}

// ===========================================================================
// graph-bridges-articulation  (renderer: 'graph')
// Tarjan low-link DFS: disc[] discovery time, low[] = lowest disc reachable.
//   bridge       iff  low[v] > disc[u]
//   articulation iff  (root with >=2 children) OR (non-root with low[v] >= disc[u])
// ===========================================================================
function bridgesFrames({ nodes, edges, root, label }) {
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  for (const k in adj) adj[k].sort((a, b) => a - b);

  const disc = {}; const low = {};
  const visited = new Set();
  const bridges = new Set();      // 'a-b' canonical (a<b)
  const articulation = new Set(); // node ids
  const treeEdges = new Set();    // 'u-v' in DFS order
  let timer = 0;
  const frames = [];
  const key = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;

  const snap = (currentId, hotEdge, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: visited.has(n.id) ? `${n.id}\nd=${disc[n.id]} l=${low[n.id]}` : String(n.id),
      state: n.id === currentId ? 'current'
        : articulation.has(n.id) ? 'done'
        : visited.has(n.id) ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      if (bridges.has(key(e.a, e.b))) return { ...e, state: 'rejected' };
      if (hotEdge && key(e.a, e.b) === key(hotEdge.a, hotEdge.b)) return { ...e, state: hotEdge.state };
      if (treeEdges.has(`${e.a}-${e.b}`) || treeEdges.has(`${e.b}-${e.a}`)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  function dfs(u, parent) {
    visited.add(u);
    disc[u] = low[u] = ++timer;
    snap(u, null, `Visit ${u}: stamp disc[${u}]=${disc[u]} and init low[${u}]=${disc[u]}. low tracks the earliest disc reachable from ${u}'s subtree via tree+back edges.`);
    let children = 0;
    for (const v of adj[u] || []) {
      if (v === parent) continue;
      if (!visited.has(v)) {
        children += 1;
        treeEdges.add(`${u}-${v}`);
        snap(u, { a: u, b: v, state: 'current' }, `Tree edge ${u}→${v}: ${v} unvisited, recurse into it.`);
        dfs(v, u);
        const before = low[u];
        low[u] = Math.min(low[u], low[v]);
        if (low[u] !== before) snap(u, { a: u, b: v, state: 'current' }, `Back from ${v}: low[${u}] = min(${before}, low[${v}]=${low[v]}) = ${low[u]} — ${v}'s subtree can reach that high up.`);
        if (low[v] > disc[u]) {
          bridges.add(key(u, v));
          snap(u, { a: u, b: v, state: 'rejected' }, `Bridge found: low[${v}]=${low[v]} > disc[${u}]=${disc[u]}. ${v}'s subtree has NO back edge above ${u}, so cutting ${u}–${v} disconnects it.`);
        }
        if (parent !== -1 && low[v] >= disc[u] && !articulation.has(u)) {
          articulation.add(u);
          snap(u, null, `Articulation point: ${u} is non-root and low[${v}]=${low[v]} ≥ disc[${u}]=${disc[u]} — ${v}'s subtree cannot bypass ${u} to reach an ancestor. Removing ${u} disconnects it.`);
        }
      } else {
        const before = low[u];
        low[u] = Math.min(low[u], disc[v]);
        snap(u, { a: u, b: v, state: 'frontier' }, `Back edge ${u}–${v}: ${v} already visited. low[${u}] = min(${before}, disc[${v}]=${disc[v]}) = ${low[u]}.`);
      }
    }
    if (parent === -1 && children >= 2 && !articulation.has(u)) {
      articulation.add(u);
      snap(u, null, `Root rule: ${u} is the DFS root with ${children} tree children — removing it splits the tree into ${children} pieces, so ${u} is an articulation point.`);
    }
  }

  snap(root, null, `${label}: one DFS from ${root}. Maintain disc[] (visit time) and low[] (earliest disc reachable). Bridges and articulation points fall out of low vs disc comparisons — Tarjan in O(V+E).`);
  dfs(root, -1);
  snap(null, null, `Done. Dashed/red edges are bridges (single points of link failure); highlighted nodes are articulation points (single points of node failure). A graph with zero bridges is 2-edge-connected.`);
  return frames;
}

function bridgesChain() {
  // 0-1-2 cluster, bridge 2-3, then 3-4-5 cluster. 2 and 3 are articulation.
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 }, // triangle {0,1,2}
    { a: 2, b: 3 },                                  // bridge
    { a: 3, b: 4 }, { a: 4, b: 5 }, { a: 5, b: 3 },  // triangle {3,4,5}
  ];
  return bridgesFrames({ nodes, edges, root: 0, label: 'Bridges & articulation (two clusters)' });
}

function bridgesLine() {
  // pure path 0-1-2-3: every edge a bridge, every internal node articulation.
  const nodes = [0, 1, 2, 3].map(i => ({ id: i }));
  const edges = [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }];
  return bridgesFrames({ nodes, edges, root: 0, label: 'Bridges & articulation (path graph)' });
}

// ===========================================================================
// dp-recursion-vs-iteration  (renderer: 'array')
// Same Fibonacci DP table filled two ways: top-down recursion+memo (fills cells
// out of order, on demand) vs bottom-up iteration (fills left to right). The
// array IS the memo / dp table; subRow marks which cells are computed.
// ===========================================================================
function fibState(arr) {
  return arr.map(v => (v === null ? '·' : String(v)));
}

function fibMemoFrames(n = 7) {
  const memo = new Array(n + 1).fill(null);
  const frames = [];
  const order = [];
  // simulate top-down recursion order of first computation
  function rec(k) {
    if (k <= 1) {
      if (memo[k] === null) { memo[k] = k; order.push(k); }
      return memo[k];
    }
    if (memo[k] !== null) {
      frames.push({
        array: [...memo], subRow: { values: fibState(memo), label: 'memo' },
        highlights: { [k]: 'match' }, pointers: { [k]: 'hit' },
        caption: `fib(${k}) is already in the memo (=${memo[k]}). Memo HIT — return instantly, no re-descent. This is the saving over plain recursion.`,
      });
      return memo[k];
    }
    frames.push({
      array: [...memo], subRow: { values: fibState(memo), label: 'memo' },
      highlights: { [k]: 'current' }, pointers: { [k]: 'call' },
      caption: `fib(${k}): memo miss. Recurse to compute fib(${k - 1}) and fib(${k - 2}) first, then cache the sum here.`,
    });
    const r = rec(k - 1) + rec(k - 2);
    memo[k] = r; order.push(k);
    frames.push({
      array: [...memo], subRow: { values: fibState(memo), label: 'memo' },
      highlights: { [k]: 'match' }, pointers: { [k]: 'store' },
      caption: `Store fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${r} in the memo. Filled order so far: [${order.join(', ')}] — note it is NOT left-to-right.`,
    });
    return r;
  }
  frames.push({
    array: [...memo], subRow: { values: fibState(memo), label: 'memo' },
    caption: `Top-down: memoized recursion for fib(${n}). The table starts empty (·). Cells fill lazily, deepest-first, only when a call needs them.`,
  });
  memo[0] = 0; memo[1] = 1; order.push(0, 1);
  frames.push({
    array: [...memo], subRow: { values: fibState(memo), label: 'memo' },
    highlights: { 0: 'match', 1: 'match' },
    caption: `Base cases fib(0)=0, fib(1)=1 seed the memo. Every other cell is computed exactly once thanks to caching — O(n) instead of exponential.`,
  });
  rec(n);
  frames.push({
    array: [...memo], subRow: { values: fibState(memo), label: 'memo' },
    highlights: Object.fromEntries(memo.map((_, i) => [i, 'done'])),
    caption: `Done: fib(${n}) = ${memo[n]}. Recursion + memo computed each subproblem once but in a tree-driven order — the call stack and the ragged fill order are the cost.`,
  });
  return frames;
}

function fibTabFrames(n = 7) {
  const dp = new Array(n + 1).fill(null);
  const frames = [];
  frames.push({
    array: [...dp], subRow: { values: fibState(dp), label: 'dp' },
    caption: `Bottom-up: iterative DP for fib(${n}). Same table, but we fill it strictly left to right — no recursion, no call stack.`,
  });
  dp[0] = 0; dp[1] = 1;
  frames.push({
    array: [...dp], subRow: { values: fibState(dp), label: 'dp' },
    highlights: { 0: 'match', 1: 'match' },
    caption: `Seed base cases dp[0]=0, dp[1]=1. Now every dp[i] depends only on cells already filled to its left — the recurrence is satisfiable in one forward pass.`,
  });
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
    frames.push({
      array: [...dp], subRow: { values: fibState(dp), label: 'dp' },
      highlights: { [i - 2]: 'left', [i - 1]: 'right', [i]: 'current' },
      pointers: { [i - 2]: 'i-2', [i - 1]: 'i-1', [i]: 'i' },
      caption: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}. Both inputs are already computed — a flat loop, O(n) time and (if rolled) O(1) space.`,
    });
  }
  frames.push({
    array: [...dp], subRow: { values: fibState(dp), label: 'dp' },
    highlights: Object.fromEntries(dp.map((_, i) => [i, 'done'])),
    caption: `Done: fib(${n}) = ${dp[n]}. Iteration fills the SAME table as memoization but in guaranteed dependency order — no stack overflow, better cache locality, same O(n) work.`,
  });
  return frames;
}

// ===========================================================================
// dp-knuth-optimization  (renderer: 'grid')
// Interval DP cost[i][j]; the opt[i][j] split-point grid is monotone, so the
// inner k-search shrinks from [i, j-1] to [opt[i][j-1], opt[i+1][j]]. We render
// the opt-split grid filling diagonally and show the narrowing search window.
// ===========================================================================
function knuthFrames() {
  // 5 leaves; weights for an optimal-BST-style merge. cost[i][j] over [i..j].
  const n = 5;
  const w = [4, 2, 6, 3, 5];
  const pre = [0];
  for (let i = 0; i < n; i++) pre.push(pre[i] + w[i]);
  const sum = (i, j) => pre[j + 1] - pre[i];

  const cost = Array.from({ length: n }, () => new Array(n).fill(INF));
  const opt = Array.from({ length: n }, () => new Array(n).fill(-1));
  for (let i = 0; i < n; i++) { cost[i][i] = 0; opt[i][i] = i; }

  const frames = [];
  // grid token: '.' empty (j<i), '?' not-yet-filled, number = chosen split column.
  const renderGrid = () => {
    const g = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        if (j < i) row.push('.');
        else if (opt[i][j] < 0) row.push('?');
        else row.push(String(opt[i][j]));
      }
      g.push(row);
    }
    return { grid: g };
  };

  frames.push({
    ...renderGrid(),
    caption: `Knuth opt grid: cell (i,j) holds the optimal split point opt[i][j] for interval [i..j]. Diagonal (i=i) is the base case opt=i. We fill by increasing interval length.`,
  });
  frames.push({
    ...renderGrid(),
    caption: `Naive interval DP scans every k in [i, j-1] for each cell — O(n³). Knuth's quadrangle inequality makes opt monotone: opt[i][j-1] ≤ opt[i][j] ≤ opt[i+1][j].`,
  });

  for (let len = 1; len < n; len++) {
    for (let i = 0; i + len < n; i++) {
      const j = i + len;
      const lo = opt[i][j - 1];
      const hi = j > i + 1 ? opt[i + 1][j] : j; // bound; for len handle edge
      const klo = Math.max(i, lo);
      const khi = Math.min(j - 1, hi);
      frames.push({
        ...renderGrid(),
        caption: `Fill opt[${i}][${j}] (interval [${i}..${j}], length ${len + 1}). Monotonicity bounds the split search to k ∈ [${klo}, ${khi}] instead of [${i}, ${j - 1}] — only ${khi - klo + 1} candidate(s).`,
      });
      let best = INF; let bestK = klo;
      for (let k = klo; k <= khi; k++) {
        const c = cost[i][k] + cost[k + 1][j];
        if (c < best) { best = c; bestK = k; }
      }
      cost[i][j] = best + sum(i, j);
      opt[i][j] = bestK;
      frames.push({
        ...renderGrid(),
        caption: `Best split is k=${bestK}: cost[${i}][${j}] = cost[${i}][${bestK}] + cost[${bestK + 1}][${j}] + w(${i},${j})=${sum(i, j)} = ${cost[i][j]}. Record opt[${i}][${j}]=${bestK}.`,
      });
    }
  }
  frames.push({
    ...renderGrid(),
    caption: `Filled. Each row's split points are non-decreasing and each column's too — the monotone staircase. Summed over all cells the search work telescopes to O(n²), down from O(n³). Answer cost[0][${n - 1}] = ${cost[0][n - 1]}.`,
  });
  return frames;
}

// ===========================================================================
// string-trie-radix  (renderer: 'tree')
// Radix / compressed trie: chains of single-child nodes collapse into one node
// whose value is the edge label substring. Inserting a key that shares a prefix
// SPLITS an existing edge. We narrate insert + edge-split explicitly.
// ===========================================================================
let _tid = 0;
function tnode(value, state) { return { _id: ++_tid, value, left: null, right: null, state }; }
function tpaint(n, states) {
  if (!n) return null;
  const st = states && states[n._id];
  return { _id: n._id, value: n.value, state: st, left: tpaint(n.left, states), right: tpaint(n.right, states) };
}

function radixFrames() {
  _tid = 0;
  const frames = [];
  // Build the classic radix tree for: roman, romane, romulus, rubens, ruber.
  // We model the binary renderer by placing branches in left/right slots and
  // narrating the compressed edge labels in node values.
  const root = tnode('(root)');
  frames.push({ tree: tpaint(root, {}), caption: `Radix tree (compressed trie). A standard trie spends one node per character; a radix tree merges any single-child chain into one node whose value is the whole edge substring.` });

  // insert "roman"
  const roman = tnode('roman*');
  root.left = roman;
  frames.push({ tree: tpaint(root, { [roman._id]: 'new' }), caption: `Insert "roman": empty tree, so one compressed edge "roman" hangs off the root as a single node (* marks a word end). No per-character nodes.` });

  // insert "romane" -> shares prefix "roman", split: "roman" then "e"
  const ro = tnode('roman');           // now internal, no longer a word end after split... keep word end via child
  const romanEnd = tnode('ε*');   // empty-suffix child marks "roman" itself
  const e = tnode('e*');
  ro.left = romanEnd; ro.right = e;
  root.left = ro;
  frames.push({
    tree: tpaint(root, { [ro._id]: 'current', [romanEnd._id]: 'new', [e._id]: 'new' }),
    caption: `Insert "romane": it shares the full label "roman" with the existing node. Split that node — "roman" becomes an internal branch with an ε child (word end for "roman") and a new "e" child for "romane".`,
  });

  // insert "romulus" -> shares prefix "rom" with "roman". Split "roman" -> "rom" + "an"...
  // Rebuild compactly: rom -> {an -> {ε*, e*}, ulus*}
  const rom = tnode('rom');
  const an = tnode('an');
  an.left = tnode('ε*'); an.right = tnode('e*');
  const ulus = tnode('ulus*');
  rom.left = an; rom.right = ulus;
  root.left = rom;
  frames.push({
    tree: tpaint(root, { [rom._id]: 'current', [ulus._id]: 'new' }),
    caption: `Insert "romulus": shares only "rom" with the "roman" branch. EDGE-SPLIT: cut "roman" into "rom" + "an", then add a sibling "ulus" under "rom". This split is the radix tree's core operation.`,
  });

  // insert "rubens" and "ruber" -> new "ru" branch, then "be" + {ns*, r*}
  const ru = tnode('ru');
  const be = tnode('be');
  be.left = tnode('ns*'); be.right = tnode('r*');
  ru.left = be;
  root.right = ru;
  frames.push({
    tree: tpaint(root, { [ru._id]: 'new', [be._id]: 'new' }),
    caption: `Insert "rubens" then "ruber": no shared prefix with "rom*", so a fresh "ru" branch. They share "rube", which compresses to "ru" → "be" → {"ns" for rubens, "r" for ruber}.`,
  });

  frames.push({
    tree: tpaint(root, {
      [rom._id]: 'done', [ru._id]: 'done',
    }),
    caption: `Five keys stored in far fewer nodes than a character trie: memory drops from O(Σ word lengths) to O(#words), while lookup stays O(|key|). Every internal node has ≥ 2 children — no wasted single-child chains.`,
  });

  // search "romane" — walk it edge by edge
  frames.push({
    tree: tpaint(root, { [root._id]: 'current' }),
    caption: `Search "romane": start at the root, look for a child edge whose label is a prefix of the remaining key. The "rom" branch matches the first three characters.`,
  });
  frames.push({
    tree: tpaint(root, { [rom._id]: 'current' }),
    caption: `Consume "rom" → remaining key = "ane". Among "rom"'s children, the "an" edge matches the next two characters.`,
  });
  frames.push({
    tree: tpaint(root, { [rom._id]: 'visited', [an._id]: 'current' }),
    caption: `Consume "an" → remaining key = "e". Under "an", the "e*" child matches the final character and is a word end — match!`,
  });
  frames.push({
    tree: tpaint(root, { [rom._id]: 'visited', [an._id]: 'visited' }),
    caption: `Found "romane" by consuming three compressed edges in O(|key|) work — independent of how many keys the tree holds. Edge labels mean each step skips many characters at once.`,
  });
  frames.push({
    tree: tpaint(root, { [ru._id]: 'visited', [be._id]: 'found' }),
    caption: `Miss example — search "rubik": match "ru", then "be" is NOT a prefix of "bik". No child edge matches at that point, so "rubik" is absent. Mismatched edge labels prune the search instantly.`,
  });
  return frames;
}

// ===========================================================================
// queue-priority-fair-sched  (renderer: 'array')
// Two scheduler policies. (a) Priority queue with AGING: high-priority jobs run
// first, but waiting jobs age up so low-priority work never starves. (b) Weighted
// fair / round-robin across per-tenant queues. The array holds the ready jobs.
// ===========================================================================
function priorityAgingFrames() {
  // Each job: { name, base, age, tenant }. effective priority = base + age.
  let jobs = [
    { name: 'A', base: 1, age: 0 },
    { name: 'B', base: 5, age: 0 },
    { name: 'C', base: 2, age: 0 },
    { name: 'D', base: 5, age: 0 },
    { name: 'E', base: 1, age: 0 },
  ];
  const frames = [];
  const cells = () => jobs.map(j => `${j.name}:${j.base + j.age}`);
  const subVals = () => jobs.map(j => `b${j.base}+a${j.age}`);

  frames.push({
    array: cells(), subRow: { values: subVals(), label: 'b+age' },
    caption: `Priority scheduler with aging. Ready queue holds jobs; effective priority = base + age. Higher runs first, but each wait tick ages waiting jobs up so low-base jobs (A, E) cannot starve.`,
  });

  let tick = 0;
  while (jobs.length) {
    // pick highest effective priority (ties: lowest index = arrival order)
    let bi = 0;
    for (let i = 1; i < jobs.length; i++) {
      if (jobs[i].base + jobs[i].age > jobs[bi].base + jobs[bi].age) bi = i;
    }
    const chosen = jobs[bi];
    frames.push({
      array: cells(), subRow: { values: subVals(), label: 'b+age' },
      highlights: { [bi]: 'match' }, pointers: { [bi]: 'run' },
      caption: `Tick ${tick}: pick max effective priority → ${chosen.name} (base ${chosen.base} + age ${chosen.age} = ${chosen.base + chosen.age}). Extract-max from the heap is O(log n). Run it.`,
    });
    // remove chosen, age the rest
    jobs = jobs.filter((_, i) => i !== bi).map(j => ({ ...j, age: j.age + 1 }));
    tick += 1;
    if (jobs.length) {
      frames.push({
        array: cells(), subRow: { values: subVals(), label: 'b+age' },
        highlights: Object.fromEntries(jobs.map((_, i) => [i, 'compared'])),
        caption: `${chosen.name} done. Every waiting job ages +1 (age now baked into each cell). Watch low-base jobs climb — aging guarantees they eventually win, so no starvation.`,
      });
    }
  }
  frames.push({
    array: ['(empty)'], subRow: { values: ['done'], label: 'b+age' },
    caption: `Queue drained. Without aging, B and D (base 5) could starve A and E forever; aging let the long-waiters overtake and run. Strict priority + aging = bounded wait for everyone.`,
  });
  return frames;
}

function weightedFairFrames() {
  // 3 tenants share workers; weights T1=3, T2=2, T3=1 (deficit round-robin).
  const tenants = [
    { id: 'T1', weight: 3, q: ['t1a', 't1b', 't1c'], credit: 0 },
    { id: 'T2', weight: 2, q: ['t2a', 't2b'], credit: 0 },
    { id: 'T3', weight: 1, q: ['t3a'], credit: 0 },
  ];
  const frames = [];
  const served = [];
  const cells = () => tenants.map(t => `${t.id}:[${t.q.join(',') || '—'}]`);
  const subVals = () => tenants.map(t => `w${t.weight} c${t.credit}`);

  frames.push({
    array: cells(), subRow: { values: subVals(), label: 'w/credit' },
    caption: `Weighted fair queuing: one ready queue per tenant. Weights T1=3, T2=2, T3=1 set each tenant's share. Each round every tenant gains weight-many credits; a tenant runs jobs while it has credit.`,
  });
  frames.push({
    array: cells(), subRow: { values: subVals(), label: 'w/credit' },
    highlights: { 0: 'left', 1: 'compared', 2: 'right' },
    caption: `Why not plain FIFO? A bursty tenant would monopolize the workers and starve the rest. Per-tenant queues + credit-weighted round-robin guarantee each tenant a proportional slice.`,
  });

  let round = 0;
  let guard = 0;
  while (tenants.some(t => t.q.length) && guard < 40) {
    round += 1;
    // grant credits
    for (const t of tenants) if (t.q.length) t.credit += t.weight;
    frames.push({
      array: cells(), subRow: { values: subVals(), label: 'w/credit' },
      highlights: Object.fromEntries(tenants.map((_, i) => [i, 'compared'])),
      caption: `Round ${round}: grant credits = weight to each non-empty tenant. T1 +3, T2 +2, T3 +1. Higher weight → more jobs per round → proportional share of the worker pool.`,
    });
    // each tenant runs while it has credit and jobs
    for (let i = 0; i < tenants.length; i++) {
      const t = tenants[i];
      while (t.credit > 0 && t.q.length) {
        const job = t.q.shift();
        t.credit -= 1;
        served.push(job);
        guard += 1;
        frames.push({
          array: cells(), subRow: { values: subVals(), label: 'w/credit' },
          highlights: { [i]: 'match' }, pointers: { [i]: 'run' },
          caption: `${t.id} spends 1 credit to run ${job} (${t.credit} credit left). Round-robin across tenants then weighted-by-credit — no single tenant monopolizes workers.`,
        });
        if (guard >= 40) break;
      }
    }
  }
  frames.push({
    array: cells(), subRow: { values: ['served ' + served.length], label: 'order' },
    highlights: { 0: 'done', 1: 'done', 2: 'done' },
    caption: `All tenants drained in order [${served.join(', ')}]. T1 got the most slots (weight 3), T3 the fewest (weight 1) — proportional fairness with zero starvation, the stable answer for multi-tenant queues.`,
  });
  return frames;
}

// ===========================================================================
// export
// ===========================================================================
export default {
  'dijkstra-fibonacci-heap': {
    title: 'Dijkstra with a Fibonacci-Heap Priority Queue',
    renderer: 'graph',
    cases: [
      { label: 'Sparse graph (decrease-key wins)', frames: dijkstraSparse() },
      { label: 'Relaxation finds a shorter route', frames: dijkstraTriangle() },
    ],
  },
  'graph-bridges-articulation': {
    title: 'Bridges & Articulation Points (Tarjan low-link)',
    renderer: 'graph',
    cases: [
      { label: 'Two clusters joined by a bridge', frames: bridgesChain() },
      { label: 'Path graph (every edge a bridge)', frames: bridgesLine() },
    ],
  },
  'dp-recursion-vs-iteration': {
    title: 'Top-down Memo vs Bottom-up Iteration',
    renderer: 'array',
    cases: [
      { label: 'Top-down: recursion + memo', frames: fibMemoFrames(9) },
      { label: 'Bottom-up: iterative table', frames: fibTabFrames(9) },
    ],
  },
  'dp-knuth-optimization': {
    title: "Knuth's Optimization (monotone split points)",
    renderer: 'grid',
    cases: [
      { label: 'Interval DP opt-split grid', frames: knuthFrames() },
    ],
  },
  'string-trie-radix': {
    title: 'Radix Tree / Compressed Trie (edge-splitting)',
    renderer: 'tree',
    cases: [
      { label: 'Insert with prefix-sharing splits', frames: radixFrames() },
    ],
  },
  'queue-priority-fair-sched': {
    title: 'Priority & Fair Scheduling',
    renderer: 'array',
    cases: [
      { label: 'Priority queue with aging (no starvation)', frames: priorityAgingFrames() },
      { label: 'Weighted fair queuing across tenants', frames: weightedFairFrames() },
    ],
  },
};
