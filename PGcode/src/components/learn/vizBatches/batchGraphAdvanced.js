// Advanced-graph concept visualizations (graph renderer).
// Frame shape mirrors GraphRenderer in AlgoVisualizer.jsx:
//   frame = { nodes: [{ id, label, state? }], edges: [{ a, b, w?, state? }], caption }
//   node states: 'current' | 'frontier' | 'visited' | 'done'
//   edge states: 'current' | 'frontier' | 'tree' | 'visited' | 'rejected'
// Nodes are auto-positioned in a circle by the renderer; we never supply x/y.
// All helpers below are self-contained pure JS — no imports from conceptVisualizations.js.

const INF = '∞'; // ∞ glyph for unreachable distances

// ---------------------------------------------------------------------------
// Floyd-Warshall — triple loop relaxing dist[i][j] through intermediate k.
// Rendered on the graph: nodes carry no per-node label change; each relaxation
// frame highlights the path i→k→j (edges current) and the improved i→j edge.
// ---------------------------------------------------------------------------
function floydWarshallFrames({ n, edges, label }) {
  // edges: directed [{ a, b, w }]. dist is full V×V matrix.
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const e of edges) dist[e.a][e.b] = Math.min(dist[e.a][e.b], e.w);

  const baseNodes = Array.from({ length: n }, (_, i) => ({ id: i }));
  const dstr = (v) => (v === Infinity ? INF : String(v));

  const frames = [];
  const snap = ({ k, i, j, current, improved, caption }) => {
    const ns = baseNodes.map(nd => ({
      ...nd,
      state: nd.id === k ? 'current'
        : (nd.id === i || nd.id === j) ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      const onLeg = current && ((e.a === i && e.b === k) || (e.a === k && e.b === j));
      const onImproved = improved && e.a === i && e.b === j;
      if (onImproved) return { ...e, state: 'tree' };
      if (onLeg) return { ...e, state: 'current' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap({ caption: `${label}: dp[k][i][j] = shortest i→j path using only vertices 0..k as intermediates. Outer loop k is the DP dimension; relax every (i,j) through it.` });
  snap({ caption: `Initialise: dist[i][i] = 0, dist[i][j] = direct edge weight (or ${INF} if none). The triple loop will fold in longer routes one intermediate at a time.` });

  for (let k = 0; k < n; k++) {
    snap({ k, caption: `k = ${k}: allow vertex ${k} as an intermediate. For every ordered pair (i, j), test whether routing through ${k} beats the current dist[i][j].` });
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j || i === k || j === k) continue;
        const via = dist[i][k] + dist[k][j];
        if (via < dist[i][j]) {
          const old = dist[i][j];
          dist[i][j] = via;
          snap({
            k, i, j, current: true, improved: true,
            caption: `Relax (${i},${j}) via ${k}: dist[${i}][${k}]+dist[${k}][${j}] = ${dstr(dist[i][k])}+${dstr(dist[k][j])} = ${via} < ${dstr(old)}. Update dist[${i}][${j}] = ${via}.`,
          });
        }
      }
    }
    snap({ k, caption: `After k = ${k}: every shortest path that uses only vertices 0..${k} is now correct. Carry the matrix into the next k.` });
  }
  snap({ caption: `${label}: all intermediates folded in. dist[i][j] now holds the true all-pairs shortest path. If any dist[v][v] < 0, a negative cycle exists. O(V³).` });
  return frames;
}

function floydSmallDirected() {
  // 4-vertex directed graph from the concept's worked example.
  const edges = [
    { a: 0, b: 1, w: 3 }, { a: 0, b: 3, w: 7 },
    { a: 1, b: 0, w: 8 }, { a: 1, b: 2, w: 2 },
    { a: 2, b: 0, w: 5 }, { a: 2, b: 3, w: 1 },
    { a: 3, b: 2, w: 2 },
  ];
  return floydWarshallFrames({ n: 4, edges, label: 'Floyd-Warshall (4 vertices)' });
}

function floydChainRelax() {
  // A near-linear chain where multi-hop relaxations matter the most.
  const edges = [
    { a: 0, b: 1, w: 4 }, { a: 1, b: 2, w: 1 }, { a: 2, b: 3, w: 2 },
    { a: 0, b: 2, w: 8 }, { a: 1, b: 3, w: 7 },
  ];
  return floydWarshallFrames({ n: 4, edges, label: 'Floyd-Warshall (chain)' });
}

// ---------------------------------------------------------------------------
// Tarjan SCC — single DFS with disc / low-link + an on-stack vertex stack.
// ---------------------------------------------------------------------------
function tarjanSccFrames({ n, edges, label }) {
  const adj = {};
  for (let i = 0; i < n; i++) adj[i] = [];
  for (const e of edges) adj[e.a].push(e.b);
  for (const k in adj) adj[k].sort((x, y) => x - y);

  const disc = {}, low = {};
  const onStack = new Set();
  const stack = [];
  const compOf = {}; // node -> scc index once popped
  let timer = 0, sccCount = 0;
  const frames = [];

  const snap = (currentId, caption) => {
    const ns = Array.from({ length: n }, (_, id) => ({
      id,
      label: disc[id] != null ? `${id}\nd${disc[id]} l${low[id]}` : String(id),
      state: id === currentId ? 'current'
        : compOf[id] != null ? 'done'
        : onStack.has(id) ? 'frontier'
        : disc[id] != null ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      if (compOf[e.a] != null && compOf[e.a] === compOf[e.b]) return { ...e, state: 'tree' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `${label}: one DFS. disc[v] = discovery time, low[v] = smallest disc reachable from v's subtree via tree edges + one back edge. Keep visited vertices on a stack.`);

  const go = (u) => {
    disc[u] = low[u] = timer++;
    stack.push(u); onStack.add(u);
    snap(u, `Visit ${u}: disc[${u}] = low[${u}] = ${disc[u]}. Push onto the stack. Explore out-neighbours [${adj[u].join(', ') || '—'}].`);
    for (const v of adj[u]) {
      if (disc[v] == null) {
        snap(u, `Tree edge ${u}→${v}: ${v} is unvisited, recurse into it.`);
        go(v);
        const before = low[u];
        low[u] = Math.min(low[u], low[v]);
        snap(u, `Return from ${v}: low[${u}] = min(${before}, low[${v}]=${low[v]}) = ${low[u]}.`);
      } else if (onStack.has(v)) {
        const before = low[u];
        low[u] = Math.min(low[u], disc[v]);
        snap(u, `Back edge ${u}→${v} (${v} still on stack): low[${u}] = min(${before}, disc[${v}]=${disc[v]}) = ${low[u]}.`);
      } else {
        snap(u, `Cross edge ${u}→${v}: ${v} already lives in a finished SCC (off-stack), so it contributes nothing to low[${u}].`);
      }
    }
    if (low[u] === disc[u]) {
      const members = [];
      let w;
      do {
        w = stack.pop(); onStack.delete(w); compOf[w] = sccCount; members.push(w);
      } while (w !== u);
      snap(u, `low[${u}] = disc[${u}] = ${disc[u]}: ${u} is an SCC ROOT. Pop the stack down to ${u} — SCC #${sccCount} = {${members.sort((a, b) => a - b).join(', ')}}.`);
      sccCount++;
    }
  };

  for (let s = 0; s < n; s++) if (disc[s] == null) go(s);
  snap(null, `${label}: done in O(V+E). ${sccCount} strongly connected components found; each colored block is one SCC where every vertex reaches every other.`);
  return frames;
}

function tarjanTwoCycles() {
  // {1,2,3} cycle and {4,5} cycle, linked 3→4. Ids shifted to 0-based: 0..4.
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 3 },
  ];
  return tarjanSccFrames({ n: 5, edges, label: 'Tarjan SCC (two cycles)' });
}

function tarjanDagPlusCycle() {
  // A 4-cycle feeding into a single sink — every singleton is its own SCC.
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 1 },
    { a: 2, b: 4 }, { a: 4, b: 5 },
  ];
  return tarjanSccFrames({ n: 6, edges, label: 'Tarjan SCC (cycle + tail)' });
}

// ---------------------------------------------------------------------------
// Eulerian path / circuit — degree check + Hierholzer's stack construction.
// ---------------------------------------------------------------------------
function eulerianFrames({ n, edges, label }) {
  // edges: directed [{ a, b }]. Multigraph supported (each edge consumed once).
  const inDeg = Array(n).fill(0), outDeg = Array(n).fill(0);
  for (const e of edges) { outDeg[e.a]++; inDeg[e.b]++; }

  const frames = [];
  const labelDeg = (id) => `${id}\nin${inDeg[id]} out${outDeg[id]}`;

  const baseSnap = (state, edgeState, caption) => {
    const ns = Array.from({ length: n }, (_, id) => ({
      id, label: labelDeg(id), state: state(id),
    }));
    const es = edges.map((e, idx) => ({ a: e.a, b: e.b, ...edgeState(idx) }));
    frames.push({ nodes: ns, edges: es, caption });
  };

  // Degree analysis.
  let start = 0, startCount = 0, endCount = 0, ok = true;
  for (let v = 0; v < n; v++) {
    if (outDeg[v] - inDeg[v] === 1) { start = v; startCount++; }
    else if (inDeg[v] - outDeg[v] === 1) { endCount++; }
    else if (inDeg[v] !== outDeg[v]) { ok = false; }
  }
  const isCircuit = startCount === 0 && endCount === 0;
  const isPath = startCount === 1 && endCount === 1;
  ok = ok && (isCircuit || isPath);

  baseSnap(() => undefined, () => ({}), `${label}: an Eulerian walk uses every edge exactly once. First decide existence from in/out degrees of each vertex.`);
  baseSnap(
    (id) => (inDeg[id] === outDeg[id] ? undefined : 'frontier'),
    () => ({}),
    isCircuit
      ? `Every vertex has in-degree = out-degree, so an Eulerian CIRCUIT exists (start = end). Begin Hierholzer at vertex ${start}.`
      : isPath
        ? `Exactly one vertex has out−in = 1 and one has in−out = 1: an Eulerian PATH exists, starting at ${start}.`
        : `Degree conditions fail — no Eulerian walk. (Need all balanced for a circuit, or one +1/one −1 for a path.)`,
  );

  if (!ok) {
    baseSnap(() => undefined, () => ({}), `${label}: degree test rejects this graph. No further construction.`);
    return frames;
  }

  // Hierholzer with adjacency pointers.
  const adj = Array.from({ length: n }, () => []);
  edges.forEach((e, idx) => adj[e.a].push({ to: e.b, idx }));
  const ptr = Array(n).fill(0);
  const usedEdge = new Set();
  const stack = [start];
  const path = [];

  const hsnap = (top, lastEdgeIdx, tryIdx, caption) => {
    const onStack = new Set(stack);
    const ns = Array.from({ length: n }, (_, id) => ({
      id, label: labelDeg(id),
      state: id === top ? 'current'
        : onStack.has(id) ? 'frontier'
        : path.includes(id) ? 'visited'
        : undefined,
    }));
    const es = edges.map((e, idx) => {
      if (usedEdge.has(idx)) return { a: e.a, b: e.b, state: 'tree' };
      if (idx === tryIdx) return { a: e.a, b: e.b, state: 'current' };
      return { a: e.a, b: e.b };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  hsnap(start, null, null, `Hierholzer: push start ${start}. While the stack is non-empty, follow an unused out-edge of the top vertex; if none remain, pop it onto the path.`);

  while (stack.length) {
    const u = stack[stack.length - 1];
    if (ptr[u] < adj[u].length) {
      const { to, idx } = adj[u][ptr[u]];
      ptr[u]++;
      usedEdge.add(idx);
      hsnap(u, null, idx, `At ${u}: take unused edge ${u}→${to}, mark it consumed, and walk to ${to}. Stack = [${[...stack, to].join(', ')}].`);
      stack.push(to);
    } else {
      const popped = stack.pop();
      path.push(popped);
      hsnap(stack[stack.length - 1] ?? popped, null, null, `${popped} has no unused out-edges left. Pop it and prepend to the trail. Path so far (reversed) = [${[...path].reverse().join(' → ')}].`);
    }
  }
  const route = [...path].reverse();
  baseSnap(
    () => 'done',
    () => ({ state: 'tree' }),
    `${label}: reverse the popped order → Eulerian ${isCircuit ? 'circuit' : 'path'} ${route.join(' → ')}. Every one of the ${edges.length} edges used exactly once. O(V+E).`,
  );
  return frames;
}

function eulerianCircuit() {
  // A->B->C->A plus A->D->A : balanced, circuit. 0=A,1=B,2=C,3=D.
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 0, b: 3 }, { a: 3, b: 0 },
  ];
  return eulerianFrames({ n: 4, edges, label: 'Eulerian circuit' });
}

function eulerianPath() {
  // out-in = +1 at 0, in-out = +1 at 3: an open Eulerian path 0..3.
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 0, b: 3 },
  ];
  return eulerianFrames({ n: 4, edges, label: 'Eulerian path' });
}

// ---------------------------------------------------------------------------
// Greedy graph coloring (Welsh-Powell) — degree-descending order, smallest free color.
// ---------------------------------------------------------------------------
function greedyColorFrames({ n, edges, label }) {
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
  for (let v = 0; v < n; v++) adj[v].sort((a, b) => a - b);

  const order = Array.from({ length: n }, (_, i) => i)
    .sort((a, b) => adj[b].length - adj[a].length || a - b);

  const color = Array(n).fill(-1);
  const COLOR_NAMES = ['c0', 'c1', 'c2', 'c3', 'c4'];
  // Map color index to a node-state so distinct colors read visually distinct.
  const stateForColor = (ci) =>
    ci === -1 ? undefined
      : ci === 0 ? 'visited'
      : ci === 1 ? 'frontier'
      : ci === 2 ? 'done'
      : 'current';

  const frames = [];
  const snap = (activeId, blockedEdges, caption) => {
    const ns = Array.from({ length: n }, (_, id) => ({
      id,
      label: color[id] === -1 ? String(id) : `${id}\ncolor ${color[id]}`,
      state: id === activeId ? 'current' : stateForColor(color[id]),
    }));
    const es = edges.map(e => {
      const blocked = blockedEdges && (blockedEdges.has(`${e.a}-${e.b}`) || blockedEdges.has(`${e.b}-${e.a}`));
      if (blocked) return { ...e, state: 'rejected' };
      if (color[e.a] !== -1 && color[e.b] !== -1) return { ...e, state: 'tree' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  const degList = order.map(v => `${v}(deg ${adj[v].length})`).join(', ');
  snap(null, null, `${label}: Welsh-Powell. Process the most-constrained vertices first. Degree-descending order: ${degList}.`);

  for (const v of order) {
    const used = new Set();
    const blockEdges = new Set();
    for (const u of adj[v]) if (color[u] !== -1) { used.add(color[u]); blockEdges.add(`${v}-${u}`); }
    snap(v, blockEdges, `Take ${v} (degree ${adj[v].length}). Colored neighbours block colors {${[...used].sort((a, b) => a - b).join(', ') || '—'}}. Highlighted edges mark those conflicts.`);
    let c = 0;
    while (used.has(c)) c++;
    color[v] = c;
    snap(v, null, `Assign ${v} the smallest free color = ${c}. ${used.size ? `Colors ${[...used].sort((a, b) => a - b).join(', ')} were taken by neighbours.` : 'No neighbour colored yet, so color 0.'}`);
  }
  const k = Math.max(...color) + 1;
  const maxDeg = Math.max(...adj.map(a => a.length));
  snap(null, null, `${label}: done with ${k} colors (guaranteed ≤ Δ+1 = ${maxDeg + 1}). No edge joins two same-colored vertices — a valid coloring.`);
  return frames;
}

function greedyColorBase() {
  // A(deg4) B C(deg3) D(deg2) E(deg1) -> mirrors the concept's worked example. 0=A..4=E.
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 }, { a: 0, b: 4 },
    { a: 1, b: 2 }, { a: 1, b: 3 }, { a: 2, b: 3 },
  ];
  return greedyColorFrames({ n: 5, edges, label: 'Greedy coloring' });
}

function greedyColorCycle() {
  // An odd cycle (5-cycle) forces 3 colors — greedy reaches it.
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 0 },
  ];
  return greedyColorFrames({ n: 5, edges, label: 'Greedy coloring (odd cycle)' });
}

// ---------------------------------------------------------------------------
// Bipartite 2-coloring — BFS assigning alternating colors; same-color edge = conflict.
// ---------------------------------------------------------------------------
function bipartiteFrames({ n, edges, label }) {
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
  for (let v = 0; v < n; v++) adj[v].sort((a, b) => a - b);

  const color = Array(n).fill(-1);
  const frames = [];
  let conflictEdge = null;

  const snap = (currentId, queue, treeEdge, caption) => {
    const inQ = new Set(queue || []);
    const ns = Array.from({ length: n }, (_, id) => ({
      id,
      label: color[id] === -1 ? String(id) : `${id}\ncolor ${color[id]}`,
      state: id === currentId ? 'current'
        : inQ.has(id) ? 'frontier'
        : color[id] === 0 ? 'visited'
        : color[id] === 1 ? 'done'
        : undefined,
    }));
    const es = edges.map(e => {
      if (conflictEdge && ((e.a === conflictEdge[0] && e.b === conflictEdge[1]) || (e.a === conflictEdge[1] && e.b === conflictEdge[0])))
        return { ...e, state: 'rejected' };
      if (treeEdge && ((e.a === treeEdge[0] && e.b === treeEdge[1]) || (e.a === treeEdge[1] && e.b === treeEdge[0])))
        return { ...e, state: 'current' };
      if (color[e.a] !== -1 && color[e.b] !== -1) return { ...e, state: 'tree' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, [], null, `${label}: 2-color via BFS. Color any start 0, alternate to 1 across each edge. A graph is bipartite iff no edge joins two same-colored vertices (no odd cycle).`);
  snap(null, [], null, `Traversing any edge must flip the color. Walk an odd-length cycle and you return to the start with the opposite color of itself — impossible. So odd cycle ⇔ not bipartite.`);

  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const q = [s];
    snap(s, q, null, `New component: color start ${s} with 0. Enqueue it. queue = [${s}].`);
    while (q.length) {
      const u = q.shift();
      snap(u, q, null, `Dequeue ${u} (color ${color[u]}). Visit neighbours [${adj[u].join(', ')}], giving each the opposite color ${1 - color[u]}.`);
      for (const v of adj[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];
          q.push(v);
          snap(u, q, [u, v], `Edge ${u}–${v}: ${v} uncolored → set color[${v}] = ${color[v]} (opposite of ${u}). Enqueue ${v}. queue = [${q.join(', ')}].`);
        } else if (color[v] === color[u]) {
          conflictEdge = [u, v];
          snap(u, q, null, `Edge ${u}–${v}: ${v} already color ${color[v]} = color[${u}]. SAME color across an edge — CONFLICT. Not bipartite (an odd cycle exists).`);
          snap(null, [], null, `${label}: rejected. The highlighted edge closes an odd-length cycle, so no valid 2-coloring exists.`);
          return frames;
        } else {
          snap(u, q, null, `Edge ${u}–${v}: ${v} already color ${color[v]} = opposite of ${u}. Consistent, no action.`);
        }
      }
    }
  }
  const sideA = color.map((c, i) => (c === 0 ? i : null)).filter(x => x != null);
  const sideB = color.map((c, i) => (c === 1 ? i : null)).filter(x => x != null);
  snap(null, [], null, `${label}: bipartite. Partition into {${sideA.join(', ')}} and {${sideB.join(', ')}}; every edge crosses between the two sides. O(V+E).`);
  return frames;
}

function bipartiteEvenCycle() {
  // 4-cycle 0-1-2-3-0: bipartite into {0,2} / {1,3}.
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 0 },
  ];
  return bipartiteFrames({ n: 4, edges, label: 'Bipartite check (even cycle)' });
}

function bipartiteOddConflict() {
  // Triangle 0-1-2: odd cycle, must fail.
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
  ];
  return bipartiteFrames({ n: 3, edges, label: 'Bipartite check (triangle)' });
}

// ---------------------------------------------------------------------------
// 2-SAT — build the implication graph, run SCC, read off the assignment.
// Literal node encoding: variable i has node 2i = x_i, node 2i+1 = ¬x_i.
// Node labels show the human literal (x, ¬x, ...).
// ---------------------------------------------------------------------------
function twoSatFrames({ vars, clauses, label }) {
  // vars: array of variable names. clauses: [[litA, litB]] where a literal is
  // { v: varIndex, neg: bool }. Node id = 2*v + (neg ? 1 : 0).
  const N = 2 * vars.length;
  const litId = (lit) => 2 * lit.v + (lit.neg ? 1 : 0);
  const negId = (id) => id ^ 1;
  const litName = (id) => (id % 2 === 0 ? vars[id >> 1] : `¬${vars[id >> 1]}`);

  // Build implication edges: (a ∨ b) => ¬a → b and ¬b → a.
  const edges = [];
  const seen = new Set();
  const addEdge = (a, b) => {
    const key = `${a}-${b}`;
    if (!seen.has(key)) { seen.add(key); edges.push({ a, b }); }
  };
  const adj = Array.from({ length: N }, () => []);

  const frames = [];
  const baseNodes = () => Array.from({ length: N }, (_, id) => ({ id, label: litName(id) }));

  const snap = (statefn, edgefn, caption) => {
    const ns = baseNodes().map(nd => ({ ...nd, state: statefn(nd.id) }));
    const es = edges.map((e, idx) => ({ ...e, ...edgefn(e, idx) }));
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(() => undefined, () => ({}), `${label}: each variable becomes two literal nodes (x and ¬x). A clause (a ∨ b) adds the implications ¬a→b and ¬b→a. Satisfiable iff no x and ¬x share an SCC.`);

  for (const [la, lb] of clauses) {
    const a = litId(la), b = litId(lb);
    snap(
      (id) => (id === a || id === b) ? 'frontier' : undefined,
      () => ({}),
      `Read clause (${litName(a)} ∨ ${litName(b)}): at least one of ${litName(a)}, ${litName(b)} must hold. Encode it as two implications next.`,
    );
    addEdge(negId(a), b);
    addEdge(negId(b), a);
    adj[negId(a)].push(b);
    adj[negId(b)].push(a);
    const lastTwo = new Set([`${negId(a)}-${b}`, `${negId(b)}-${a}`]);
    snap(
      (id) => (id === a || id === b || id === negId(a) || id === negId(b)) ? 'frontier' : undefined,
      (e) => lastTwo.has(`${e.a}-${e.b}`) ? { state: 'current' } : {},
      `Clause (${litName(a)} ∨ ${litName(b)}): add ${litName(negId(a))}→${litName(b)} and ${litName(negId(b))}→${litName(a)}. "If one literal is false, the other must be true."`,
    );
  }
  snap(() => undefined, () => ({}), `Implication graph complete: ${N} literal nodes, ${edges.length} directed edges. Now find strongly connected components.`);

  // Tarjan SCC over the implication graph.
  const disc = {}, low = {}, compOf = {};
  const onStack = new Set(), stack = [];
  let timer = 0, sccCount = 0;
  const sccGo = (u) => {
    disc[u] = low[u] = timer++;
    stack.push(u); onStack.add(u);
    for (const v of adj[u]) {
      if (disc[v] == null) { sccGo(v); low[u] = Math.min(low[u], low[v]); }
      else if (onStack.has(v)) low[u] = Math.min(low[u], disc[v]);
    }
    if (low[u] === disc[u]) {
      let w; const members = [];
      do { w = stack.pop(); onStack.delete(w); compOf[w] = sccCount; members.push(w); } while (w !== u);
      const sccSnapState = (id) => compOf[id] != null ? 'visited' : (disc[id] != null ? 'frontier' : undefined);
      snap(
        (id) => members.includes(id) ? 'current' : sccSnapState(id),
        (e) => (compOf[e.a] != null && compOf[e.a] === compOf[e.b]) ? { state: 'tree' } : {},
        `SCC #${sccCount} = {${members.map(litName).join(', ')}}. These literals mutually imply each other, so any assignment must make them all equal.`,
      );
      sccCount++;
    }
  };
  for (let s = 0; s < N; s++) if (disc[s] == null) sccGo(s);

  // Satisfiability + assignment.
  let unsat = -1;
  for (let i = 0; i < vars.length; i++) {
    if (compOf[2 * i] === compOf[2 * i + 1]) { unsat = i; break; }
  }
  if (unsat !== -1) {
    snap(
      (id) => (id === 2 * unsat || id === 2 * unsat + 1) ? 'current' : undefined,
      () => ({}),
      `${label}: ${vars[unsat]} and ¬${vars[unsat]} fell in the SAME SCC (comp ${compOf[2 * unsat]}). The formula forces ${vars[unsat]} = ¬${vars[unsat]} — UNSATISFIABLE.`,
    );
    return frames;
  }

  // Tarjan emits SCCs in reverse topological order, so x = true iff comp[x] < comp[¬x].
  const assign = [];
  for (let i = 0; i < vars.length; i++) assign.push(compOf[2 * i] < compOf[2 * i + 1]);
  const assignStr = vars.map((nm, i) => `${nm}=${assign[i] ? 'T' : 'F'}`).join(', ');
  snap(
    (id) => assign[id >> 1] === (id % 2 === 0) ? 'done' : undefined,
    () => ({}),
    `Read the assignment: with Tarjan's reverse-topological order, set x = true when comp[x] < comp[¬x]. ${assignStr}.`,
  );
  snap(
    (id) => assign[id >> 1] === (id % 2 === 0) ? 'done' : undefined,
    () => ({}),
    `${label}: SATISFIABLE. No variable shares an SCC with its negation. The highlighted "true" literals satisfy every clause. O(n+m).`,
  );
  return frames;
}

function twoSatSatisfiable() {
  // (x ∨ y) ∧ (¬x ∨ z) ∧ (¬y ∨ ¬z) — the concept's worked example.
  const vars = ['x', 'y', 'z'];
  const clauses = [
    [{ v: 0, neg: false }, { v: 1, neg: false }], // x ∨ y
    [{ v: 0, neg: true }, { v: 2, neg: false }],  // ¬x ∨ z
    [{ v: 1, neg: true }, { v: 2, neg: true }],   // ¬y ∨ ¬z
  ];
  return twoSatFrames({ vars, clauses, label: '2-SAT (satisfiable)' });
}

function twoSatUnsatisfiable() {
  // (x ∨ x) ∧ (¬x ∨ ¬x) forces x and ¬x into one SCC — contradiction.
  const vars = ['x', 'y'];
  const clauses = [
    [{ v: 0, neg: false }, { v: 1, neg: false }], // x ∨ y
    [{ v: 0, neg: false }, { v: 1, neg: true }],  // x ∨ ¬y
    [{ v: 0, neg: true }, { v: 1, neg: false }],  // ¬x ∨ y
    [{ v: 0, neg: true }, { v: 1, neg: true }],   // ¬x ∨ ¬y  -> x & ¬x same SCC
  ];
  return twoSatFrames({ vars, clauses, label: '2-SAT (unsatisfiable)' });
}

// ---------------------------------------------------------------------------
export default {
  'graph-floyd-warshall': {
    title: 'Floyd-Warshall: all-pairs shortest paths via intermediate k',
    renderer: 'graph',
    cases: [
      { label: 'Directed (4 vertices)', frames: floydSmallDirected() },
      { label: 'Chain relaxation', frames: floydChainRelax() },
    ],
  },
  'graph-tarjan-scc': {
    title: "Tarjan: strongly connected components via low-link",
    renderer: 'graph',
    cases: [
      { label: 'Two cycles', frames: tarjanTwoCycles() },
      { label: 'Cycle + tail', frames: tarjanDagPlusCycle() },
    ],
  },
  'graph-eulerian': {
    title: 'Eulerian path / circuit: degree test + Hierholzer',
    renderer: 'graph',
    cases: [
      { label: 'Eulerian circuit', frames: eulerianCircuit() },
      { label: 'Eulerian path', frames: eulerianPath() },
    ],
  },
  'graph-coloring-greedy': {
    title: 'Welsh-Powell greedy coloring: smallest free color',
    renderer: 'graph',
    cases: [
      { label: 'Mixed degrees', frames: greedyColorBase() },
      { label: 'Odd cycle (3 colors)', frames: greedyColorCycle() },
    ],
  },
  'graph-bipartite-coloring': {
    title: 'Bipartite check: BFS 2-coloring',
    renderer: 'graph',
    cases: [
      { label: 'Even cycle (bipartite)', frames: bipartiteEvenCycle() },
      { label: 'Triangle (conflict)', frames: bipartiteOddConflict() },
    ],
  },
  'graph-2sat': {
    title: '2-SAT: implication graph + SCC',
    renderer: 'graph',
    cases: [
      { label: 'Satisfiable', frames: twoSatSatisfiable() },
      { label: 'Unsatisfiable', frames: twoSatUnsatisfiable() },
    ],
  },
};
