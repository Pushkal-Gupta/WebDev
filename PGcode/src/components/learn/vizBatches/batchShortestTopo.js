// Shortest-path + topological-sort visualizations.
//
// Two frame shapes are used, one per config (renderer is per-config, not per-case):
//   'graph'  → mirrors GraphRenderer in AlgoVisualizer.jsx:
//        frame = { nodes: [{ id, label?, state? }], edges: [{ a, b, w?, state? }], caption }
//        node states: 'current' | 'frontier' | 'visited' | 'done'
//        edge states: 'current' | 'frontier' | 'tree' | 'visited' | 'rejected'
//        Nodes auto-positioned in a circle by the renderer — never supply x/y.
//   'grid'   → mirrors NumberGridRenderer 2D form: frame = { grid: [[token]], caption }
//        tokens: '.' open, '#' wall, 'S' source, 'G' goal, 'O' frontier, 'C' closed, '*' path.
//        Per-cell numeric labels are passed via `cellLabel` on the frame.
//
// All helpers are self-contained pure JS — no imports from conceptVisualizations.js.

// ---------------------------------------------------------------------------
// A tiny binary-heap-free priority extraction: we keep a plain array of
// [cost, ...payload] and scan for the minimum. Graphs here are small enough
// that O(n) extraction keeps the narration honest about "pop the cheapest".
// ---------------------------------------------------------------------------
function popMin(pq) {
  let best = 0;
  for (let i = 1; i < pq.length; i++) {
    if (pq[i][0] < pq[best][0]) best = i;
  }
  return pq.splice(best, 1)[0];
}

// ===========================================================================
// Dijkstra on a grid — 4-neighbour relaxation on an implicit coordinate graph.
// Renderer: 'grid'. Edge weight to enter a neighbour = that cell's value.
// ===========================================================================
function gridDijkstraFrames({ weights, label }) {
  const R = weights.length;
  const C = weights[0].length;
  const INF = Infinity;
  const dist = Array.from({ length: R }, () => Array(C).fill(INF));
  const parent = Array.from({ length: R }, () => Array(C).fill(null));
  const closed = Array.from({ length: R }, () => Array(false).fill(false));
  for (let r = 0; r < R; r++) { closed[r] = Array(C).fill(false); }
  const inPq = Array.from({ length: R }, () => Array(C).fill(false));
  const key = (r, c) => `${r},${c}`;
  const goal = [R - 1, C - 1];

  const frames = [];

  // Distances are narrated in the caption; the grid carries state via tokens
  // (the renderer shares one label per token, so per-cell numbers can't ride here).
  const tokenGrid = (curR, curC, pathSet) => {
    const g = [];
    for (let r = 0; r < R; r++) {
      const row = [];
      for (let c = 0; c < C; c++) {
        let t;
        if (r === 0 && c === 0) t = 'S';
        else if (r === goal[0] && c === goal[1]) t = 'G';
        else if (pathSet && pathSet.has(key(r, c))) t = '*';
        else if (curR === r && curC === c) t = 'S';
        else if (closed[r][c]) t = 'C';
        else if (inPq[r][c]) t = 'O';
        else t = '.';
        row.push(t);
      }
      g.push(row);
    }
    return g;
  };

  const snap = (curR, curC, caption, pathSet) => {
    frames.push({ grid: tokenGrid(curR, curC, pathSet), caption });
  };

  dist[0][0] = weights[0][0];
  const pq = [[weights[0][0], 0, 0]];
  inPq[0][0] = true;
  snap(0, 0, `${label}: enter source (0,0) at cost ${weights[0][0]}. dist=${weights[0][0]}. Push it; the priority queue always yields the cheapest unsettled cell.`);

  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let reachedGoal = false;
  while (pq.length && !reachedGoal && frames.length < 70) {
    const [cost, r, c] = popMin(pq);
    inPq[r][c] = false;
    if (closed[r][c]) continue;
    closed[r][c] = true;
    if (r === goal[0] && c === goal[1]) {
      reachedGoal = true;
      snap(r, c, `Pop goal (${r},${c}) at cost ${cost}. It is now settled, so ${cost} is its true shortest cost. Stop and reconstruct.`, null);
      break;
    }
    snap(r, c, `Pop cheapest cell (${r},${c}) at cost ${cost}; settle it (closed). Relax its 4 neighbours, paying each neighbour's entry weight.`, null);
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C || closed[nr][nc]) continue;
      const nd = cost + weights[nr][nc];
      if (nd < dist[nr][nc]) {
        const improved = dist[nr][nc] !== INF;
        dist[nr][nc] = nd;
        parent[nr][nc] = [r, c];
        inPq[nr][nc] = true;
        pq.push([nd, nr, nc]);
        snap(r, c, `Neighbour (${nr},${nc}): ${cost} + entry weight ${weights[nr][nc]} = ${nd}, which ${improved ? 'beats its old distance' : 'sets its first distance'}. Update and push (${nd},${nr},${nc}).`, null);
      }
    }
  }

  // Reconstruct the path from goal back to source.
  const pathSet = new Set();
  let cur = goal;
  while (cur) {
    pathSet.add(key(cur[0], cur[1]));
    cur = parent[cur[0]][cur[1]];
  }
  snap(-1, -1, `${label}: shortest cost to (${goal[0]},${goal[1]}) is ${dist[goal[0]][goal[1]]}. Highlighted cells trace the path via parent pointers — down column 0, then across the cheap final row.`, pathSet);
  return frames;
}

function gridSmallDetour() {
  // A wall of 5s/9s pushes the path down column 0 then across the bottom.
  const weights = [
    [1, 3, 1, 1, 1],
    [1, 5, 9, 9, 1],
    [1, 5, 1, 1, 1],
    [1, 1, 1, 5, 1],
  ];
  return gridDijkstraFrames({ weights, label: 'Grid Dijkstra (cheap corridor)' });
}

function gridUniform() {
  // Near-uniform weights: every monotone path costs the same, ties broken by pops.
  const weights = [
    [1, 1, 1, 4],
    [1, 9, 1, 1],
    [1, 9, 9, 1],
    [1, 1, 1, 1],
  ];
  return gridDijkstraFrames({ weights, label: 'Grid Dijkstra (skirt the wall)' });
}

// ===========================================================================
// Dijkstra with path reconstruction — parent[] array, then walk it backward.
// Renderer: 'graph'. Node label shows id + best-known distance.
// ===========================================================================
function dijkstraPathFrames({ nodes, edges, source, target, label }) {
  const adj = {};
  for (const e of edges) (adj[e.a] ||= []).push([e.b, e.w]);
  for (const k in adj) adj[k].sort((x, y) => x[0] - y[0]);
  const dist = {}; for (const n of nodes) dist[n.id] = Infinity;
  dist[source] = 0;
  const parent = {};
  const settled = new Set();
  const inPq = new Set([source]);
  const tree = new Set(); // `${parent}-${child}` currently-best relax edges
  const frames = [];

  const distStr = (id) => dist[id] === Infinity ? '∞' : dist[id];

  const snap = (currentId, caption, pathEdges) => {
    const ns = nodes.map(n => ({
      ...n,
      label: `${n.id}\nd=${distStr(n.id)}`,
      state: n.id === currentId ? 'current'
        : settled.has(n.id) ? 'done'
        : inPq.has(n.id) ? 'frontier'
        : undefined,
    }));
    const pe = pathEdges || null;
    const es = edges.map(e => {
      if (pe && (pe.has(`${e.a}-${e.b}`))) return { ...e, state: 'visited' };
      if (tree.has(`${e.a}-${e.b}`)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(source, `${label}: dist[${source}]=0, all others ∞. parent[] empty. Push source ${source}. Every relaxation that improves dist[v] also records parent[v].`, null);

  const pq = [[0, source]];
  while (pq.length) {
    const [cost, u] = popMin(pq);
    inPq.delete(u);
    if (settled.has(u)) continue;
    settled.add(u);
    snap(u, `Pop cheapest unsettled node ${u} (dist ${cost}). Settle it — its distance is now final, so parent[${u}]${parent[u] != null ? `=${parent[u]}` : ''} is fixed on the shortest-path tree.`, null);
    for (const [v, w] of adj[u] || []) {
      if (settled.has(v)) continue;
      const nd = dist[u] + w;
      if (nd < dist[v]) {
        const improved = dist[v] !== Infinity;
        dist[v] = nd;
        // a node has at most one tree parent — drop any prior tree edge into v.
        for (const key of [...tree]) if (key.endsWith(`-${v}`)) tree.delete(key);
        parent[v] = u;
        tree.add(`${u}-${v}`);
        inPq.add(v);
        pq.push([nd, v]);
        snap(u, `Relax edge ${u}→${v} (w=${w}): ${dist[u]}+${w}=${nd} ${improved ? `improves dist[${v}], so` : 'sets dist[' + v + '], so'} parent[${v}]=${u}. Push ${v}.`, null);
      } else {
        snap(u, `Edge ${u}→${v} (w=${w}): ${dist[u]}+${w}=${nd} does not beat dist[${v}]=${distStr(v)}. No update, parent[${v}] unchanged.`, null);
      }
    }
  }

  // Reconstruct path target → source via parent.
  const path = [];
  let cur = target;
  while (cur != null) { path.unshift(cur); cur = parent[cur]; }
  const pathEdges = new Set();
  for (let i = 0; i + 1 < path.length; i++) pathEdges.add(`${path[i]}-${path[i + 1]}`);
  snap(target, `${label}: walk parent from ${target} backward → ${[...path].reverse().join(' → ')}; reverse to read ${path.join(' → ')} (cost ${distStr(target)}). Highlighted edges are the recovered route.`, pathEdges);
  return frames;
}

function dijkstraPathRerouted() {
  // A→C improves from 4 to 3 via B, then D improves from 6 to 4 via C.
  const nodes = [0, 1, 2, 3].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1, w: 1 }, { a: 0, b: 2, w: 4 },
    { a: 1, b: 2, w: 2 }, { a: 1, b: 3, w: 5 }, { a: 2, b: 3, w: 1 },
  ];
  return dijkstraPathFrames({ nodes, edges, source: 0, target: 3, label: 'Dijkstra + parent[] (0→3)' });
}

function dijkstraPathWide() {
  // A wider graph so the parent tree has clear branches.
  const nodes = [0, 1, 2, 3, 4, 5].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 5 },
    { a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 7 },
    { a: 2, b: 4, w: 2 }, { a: 3, b: 5, w: 1 }, { a: 4, b: 5, w: 3 },
  ];
  return dijkstraPathFrames({ nodes, edges, source: 0, target: 5, label: 'Dijkstra + parent[] (0→5)' });
}

// ===========================================================================
// Dijkstra with K stops — state-augmented (node, stops_used), bounded relaxation.
// Renderer: 'graph'. Node label shows id + best cost found within budget.
// ===========================================================================
function kStopsFrames({ nodes, edges, src, dst, K, label }) {
  const adj = {};
  for (const e of edges) (adj[e.a] ||= []).push([e.b, e.w]);
  // best[node][stops] table; "stops" = intermediate hops used (0..K+1 edges).
  const maxStops = K + 1; // K stops means up to K+1 edges
  const best = {};
  for (const n of nodes) best[n.id] = Array(maxStops + 1).fill(Infinity);
  best[src][0] = 0;
  const frames = [];
  let answer = Infinity;

  const labelFor = (id) => {
    let m = Infinity;
    for (const v of best[id]) m = Math.min(m, v);
    return m === Infinity ? '∞' : m;
  };

  const snap = (currentId, settledSet, caption, usedEdges) => {
    const ns = nodes.map(n => ({
      ...n,
      label: `${n.id}\ncost=${labelFor(n.id)}`,
      state: n.id === currentId ? 'current'
        : (settledSet && settledSet.has(n.id)) ? 'done'
        : labelFor(n.id) !== '∞' ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      if (usedEdges && usedEdges.has(`${e.a}-${e.b}`)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(src, new Set(), `${label}: K=${K} stops ⇒ at most ${maxStops} edges. State is (node, edges-used). best[${src}][0]=0; everything else ∞. Layered Dijkstra: edges only go from layer s to s+1.`, null);

  // pq of [cost, node, edgesUsed]; layered greedy.
  const pq = [[0, src, 0]];
  const reached = new Set([src]);
  while (pq.length && frames.length < 70) {
    const [cost, u, s] = popMin(pq);
    if (cost > best[u][s]) continue;
    if (u === dst) {
      answer = Math.min(answer, cost);
      snap(u, reached, `Reach destination ${dst} at cost $${cost} using ${s} edge${s === 1 ? '' : 's'} (≤ ${maxStops}). Legal — record candidate answer $${answer}. Keep draining in case another layer is cheaper.`, null);
      continue;
    }
    if (s === maxStops) {
      snap(u, reached, `At (${u}, ${s} edges) the hop budget is exhausted — cannot extend further. Drop this state.`, null);
      continue;
    }
    snap(u, reached, `Expand (${u}, ${s} edges) at cost $${cost}. Each outgoing edge lands in layer ${s + 1}, still within the ${maxStops}-edge cap.`, null);
    for (const [v, w] of adj[u] || []) {
      const nd = cost + w;
      if (nd < best[v][s + 1]) {
        best[v][s + 1] = nd;
        reached.add(v);
        pq.push([nd, v, s + 1]);
        snap(u, reached, `Edge ${u}→${v} ($${w}): reach (${v}, ${s + 1} edges) at $${nd}, better than before. Push the layered state. A later visit to ${v} at the same layer with higher cost is pruned.`, new Set([`${u}-${v}`]));
      } else {
        snap(u, reached, `Edge ${u}→${v} ($${w}): (${v}, ${s + 1} edges) at $${nd} is not cheaper than the recorded $${best[v][s + 1] === Infinity ? '∞' : best[v][s + 1]} — dominated, skip.`, null);
      }
    }
  }
  snap(dst, reached, `${label}: cheapest legal cost from ${src} to ${dst} within ${K} stops = ${answer === Infinity ? 'no legal path' : '$' + answer}. The hop cap can force a pricier route than the unconstrained shortest path.`, null);
  return frames;
}

function kStopsForcedDirect() {
  // Classic: 0→1→2 = 200 (1 stop, illegal at K=0); direct 0→2 = 500 is the only legal answer.
  // Extra spokes from 0 give the layered relaxation more states to expand at layer 0→1.
  const nodes = [0, 1, 2, 3, 4].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1, w: 100 }, { a: 0, b: 2, w: 500 }, { a: 0, b: 3, w: 300 }, { a: 0, b: 4, w: 250 },
    { a: 1, b: 2, w: 100 }, { a: 3, b: 2, w: 100 }, { a: 4, b: 2, w: 100 }, { a: 1, b: 3, w: 50 },
  ];
  return kStopsFrames({ nodes, edges, src: 0, dst: 2, K: 0, label: 'K=0 stops (direct only)' });
}

function kStopsOneAllowed() {
  // K=1 now permits 0→1→2 = 200, beating the direct 500.
  const nodes = [0, 1, 2, 3].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1, w: 100 }, { a: 0, b: 2, w: 500 },
    { a: 1, b: 2, w: 100 }, { a: 2, b: 3, w: 100 }, { a: 1, b: 3, w: 600 },
  ];
  return kStopsFrames({ nodes, edges, src: 0, dst: 3, K: 1, label: 'K=1 stop (one layover)' });
}

// ===========================================================================
// Kahn's topological sort — in-degree queue (BFS-style), cycle-detecting.
// Renderer: 'graph'. Node label shows id + remaining in-degree.
// ===========================================================================
function kahnFrames({ nodes, edges, label }) {
  const adj = {};
  const indeg = {};
  for (const n of nodes) { indeg[n.id] = 0; adj[n.id] = []; }
  for (const e of edges) { adj[e.a].push(e.b); indeg[e.b] += 1; }
  for (const k in adj) adj[k].sort((a, b) => a - b);

  const placed = new Set();
  const order = [];
  let queue = nodes.filter(n => indeg[n.id] === 0).map(n => n.id).sort((a, b) => a - b);
  const removed = new Set(); // edges removed (a->b) for drawing
  const frames = [];

  const snap = (currentId, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: `${n.id}\nin=${indeg[n.id]}`,
      state: n.id === currentId ? 'current'
        : placed.has(n.id) ? 'done'
        : queue.includes(n.id) ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      if (removed.has(`${e.a}-${e.b}`)) return { ...e, state: 'rejected' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `${label}: compute every in-degree. Zero-in-degree nodes have no unmet dependency — seed the queue with {${queue.join(', ')}}.`);

  let step = 0;
  while (queue.length) {
    const u = queue.shift();
    step += 1;
    placed.add(u);
    order.push(u);
    snap(u, `Step ${step}: pop ${u} (in-degree 0) and append to the order → [${order.join(', ')}]. Now remove its out-edges by decrementing each target's in-degree.`);
    const newlyFree = [];
    for (const v of adj[u]) {
      removed.add(`${u}-${v}`);
      indeg[v] -= 1;
      if (indeg[v] === 0 && !placed.has(v)) {
        newlyFree.push(v);
        snap(u, `Edge ${u}→${v} removed: in-degree[${v}] drops to 0 — ${v} just joined the wavefront. Enqueue it.`);
      } else {
        snap(u, `Edge ${u}→${v} removed: in-degree[${v}] now ${indeg[v]}${indeg[v] > 0 ? ' — still has unmet dependencies, stays put.' : '.'}`);
      }
    }
    if (newlyFree.length) {
      queue = [...queue, ...newlyFree].sort((a, b) => a - b);
    }
  }

  if (order.length === nodes.length) {
    snap(null, `${label}: emitted all ${nodes.length} nodes → topological order [${order.join(', ')}]. Every edge points from an earlier to a later node. Valid DAG.`);
  } else {
    const leftover = nodes.filter(n => !placed.has(n.id)).map(n => n.id);
    snap(null, `${label}: queue emptied after only ${order.length}/${nodes.length} nodes. The leftover {${leftover.join(', ')}} all still have in-edges from each other — a CYCLE. Topological order is undefined.`);
  }
  return frames;
}

function kahnDag() {
  // A small course-prereq DAG with a branching wavefront.
  const nodes = [0, 1, 2, 3, 4, 5].map(id => ({ id }));
  const edges = [
    { a: 0, b: 2 }, { a: 1, b: 2 }, { a: 1, b: 3 },
    { a: 2, b: 4 }, { a: 3, b: 4 }, { a: 4, b: 5 },
  ];
  return kahnFrames({ nodes, edges, label: "Kahn (DAG)" });
}

function kahnCycle() {
  // A clean prefix chain 0→1→2 drains the wavefront for several steps, then the
  // cycle 3→4→5→3 stalls the queue with nodes still unplaced.
  const nodes = [0, 1, 2, 3, 4, 5, 6].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 },
    { a: 4, b: 5 }, { a: 5, b: 6 }, { a: 6, b: 4 },
  ];
  return kahnFrames({ nodes, edges, label: "Kahn (cycle detection)" });
}

// ===========================================================================
// Topological sort via DFS — post-order finish times, reversed.
// Renderer: 'graph'. Three-color marking (white/gray/black); reverse finish order.
// ===========================================================================
function dfsTopoFrames({ nodes, edges, label }) {
  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) adj[e.a].push(e.b);
  for (const k in adj) adj[k].sort((a, b) => a - b);

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {}; for (const n of nodes) color[n.id] = WHITE;
  const treeEdges = new Set();
  const backEdges = new Set();
  const finishStack = [];
  const frames = [];

  const snap = (currentId, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: String(n.id),
      state: n.id === currentId ? 'current'
        : color[n.id] === BLACK ? 'done'
        : color[n.id] === GRAY ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      if (backEdges.has(`${e.a}-${e.b}`)) return { ...e, state: 'rejected' };
      if (treeEdges.has(`${e.a}-${e.b}`)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `${label}: WHITE = unvisited, GRAY = on the DFS stack, BLACK = finished. Push each vertex onto a stack when it finishes; reversing that stack gives the order.`);

  let hasCycle = false;
  const dfs = (u) => {
    color[u] = GRAY;
    snap(u, `Enter ${u}: mark GRAY (on the recursion stack). Explore its out-edges to ${adj[u].length ? `[${adj[u].join(', ')}]` : 'no successors'}.`);
    for (const v of adj[u]) {
      if (color[v] === WHITE) {
        treeEdges.add(`${u}-${v}`);
        snap(u, `Edge ${u}→${v}: ${v} is WHITE — tree edge, recurse into ${v} before ${u} can finish.`);
        dfs(v);
      } else if (color[v] === GRAY) {
        backEdges.add(`${u}-${v}`);
        hasCycle = true;
        snap(u, `Edge ${u}→${v}: ${v} is GRAY (still on the stack) — a BACK EDGE. That closes a cycle, so a topological order does not exist.`);
      } else {
        snap(u, `Edge ${u}→${v}: ${v} is BLACK (already finished). Cross/forward edge — its subtree finished earlier, nothing to do.`);
      }
    }
    color[u] = BLACK;
    finishStack.push(u);
    snap(u, `Finish ${u}: all descendants done. Mark BLACK and push onto the finish stack → [${finishStack.join(', ')}]. Everything reachable from ${u} already sits below it.`);
  };

  for (const n of nodes) {
    if (color[n.id] === WHITE) {
      snap(null, `Start a fresh DFS from unvisited ${n.id} (outer loop covers every component).`);
      dfs(n.id);
    }
  }

  if (hasCycle) {
    snap(null, `${label}: a back edge was found, so this graph has a cycle — no valid topological order exists.`);
  } else {
    const order = [...finishStack].reverse();
    snap(null, `${label}: reverse the finish stack → topological order [${order.join(', ')}]. Every edge runs from an earlier-finishing to an earlier-listed vertex.`);
  }
  return frames;
}

function dfsTopoDag() {
  const nodes = [0, 1, 2, 3, 4, 5].map(id => ({ id }));
  const edges = [
    { a: 5, b: 2 }, { a: 5, b: 0 }, { a: 4, b: 0 },
    { a: 4, b: 1 }, { a: 2, b: 3 }, { a: 3, b: 1 },
  ];
  return dfsTopoFrames({ nodes, edges, label: 'DFS topo sort (DAG)' });
}

function dfsTopoCycle() {
  // 0→1→2→0 cycle exposed by a GRAY-to-GRAY back edge.
  const nodes = [0, 1, 2, 3].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 }, { a: 2, b: 3 },
  ];
  return dfsTopoFrames({ nodes, edges, label: 'DFS topo sort (cycle)' });
}

// ===========================================================================
// Johnson's all-pairs — Bellman-Ford potentials, then per-source Dijkstra.
// Renderer: 'graph'. Phase 1 shows h(v) potentials; phase 2 a sample Dijkstra.
// ===========================================================================
function johnsonFrames({ nodes, edges, sampleSource, label }) {
  const ids = nodes.map(n => n.id);
  // Phase 1: Bellman-Ford from a virtual super-source with 0-weight edges to all.
  const h = {}; for (const id of ids) h[id] = 0; // super-source distance starts 0 everywhere
  const frames = [];

  const snapH = (relaxEdge, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: `${n.id}\nh=${h[n.id] === Infinity ? '∞' : h[n.id]}`,
      state: relaxEdge && (relaxEdge.a === n.id || relaxEdge.b === n.id) ? 'current' : undefined,
    }));
    const es = edges.map(e => {
      if (relaxEdge && e.a === relaxEdge.a && e.b === relaxEdge.b) return { ...e, state: 'current' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapH(null, `${label}: add a virtual super-source linked to every vertex by a 0-weight edge, so h[v]=0 initially. Bellman-Ford relaxes all real edges V−1 times to find each potential h(v).`);

  const V = ids.length;
  for (let pass = 1; pass < V; pass++) {
    let changed = false;
    for (const e of edges) {
      if (h[e.a] + e.w < h[e.b]) {
        const old = h[e.b];
        h[e.b] = h[e.a] + e.w;
        changed = true;
        snapH(e, `BF pass ${pass}: edge ${e.a}→${e.b} (w=${e.w}) — h[${e.a}]+${e.w}=${h[e.a] + e.w} < old h[${e.b}]=${old === Infinity ? '∞' : old}. Lower the potential h[${e.b}]=${h[e.b]}.`);
      }
    }
    if (!changed) {
      snapH(null, `BF pass ${pass}: no potential changed — distances have converged. Potentials h(v) are final; no negative cycle detected.`);
      break;
    }
  }

  // Phase 2: reweight and run Dijkstra from the sample source.
  const reweight = (e) => e.w + h[e.a] - h[e.b];
  snapH(null, `Reweight every edge: w'(u,v) = w(u,v) + h(u) − h(v) ≥ 0 (triangle inequality guarantees this). Potentials telescope along any path, so shortest paths are preserved.`);

  // Run Dijkstra on reweighted graph from sampleSource.
  const adj = {};
  for (const id of ids) adj[id] = [];
  for (const e of edges) adj[e.a].push([e.b, Math.max(0, reweight(e)), e.w]);
  const dPrime = {}; for (const id of ids) dPrime[id] = Infinity;
  dPrime[sampleSource] = 0;
  const settled = new Set();
  const inPq = new Set([sampleSource]);
  const tree = new Set();

  const snapD = (currentId, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: `${n.id}\nd'=${dPrime[n.id] === Infinity ? '∞' : dPrime[n.id]}`,
      state: n.id === currentId ? 'current'
        : settled.has(n.id) ? 'done'
        : inPq.has(n.id) ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      if (tree.has(`${e.a}-${e.b}`)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapD(sampleSource, `Phase 2: Dijkstra on the non-negative reweighted graph from source ${sampleSource}. d'=reweighted distance; recover true d(u,v)=d'(u,v) − h(u) + h(v) at the end.`);

  const pq = [[0, sampleSource]];
  while (pq.length) {
    const [cost, u] = popMin(pq);
    inPq.delete(u);
    if (settled.has(u)) continue;
    settled.add(u);
    snapD(u, `Settle ${u} at reweighted distance d'=${cost}. Non-negative weights make Dijkstra's greedy pop valid again — its potential-shifted distance is now final.`);
    for (const [v, wp] of adj[u]) {
      if (settled.has(v)) continue;
      const nd = dPrime[u] + wp;
      if (nd < dPrime[v]) {
        dPrime[v] = nd;
        for (const key of [...tree]) if (key.endsWith(`-${v}`)) tree.delete(key);
        tree.add(`${u}-${v}`);
        inPq.add(v);
        pq.push([nd, v]);
        snapD(u, `Relax ${u}→${v}: reweighted w'=${wp}, so d'[${v}]=${nd}. Improves — push ${v}. (True distance is recovered later by un-shifting the potentials.)`);
      }
    }
  }

  // Translate back.
  const trueDist = {};
  for (const id of ids) {
    trueDist[id] = dPrime[id] === Infinity ? Infinity
      : dPrime[id] - h[sampleSource] + h[id];
  }
  const summary = ids
    .filter(id => id !== sampleSource && trueDist[id] !== Infinity)
    .map(id => `${id}:${trueDist[id]}`)
    .join('  ');
  snapD(null, `${label}: un-shift d(${sampleSource},v)=d'(v) − h(${sampleSource}) + h(v). True distances from ${sampleSource} → ${summary}. Repeat the Dijkstra for every source to fill the all-pairs table.`);
  return frames;
}

function johnsonNegEdges() {
  // A graph with a negative edge that Dijkstra alone would mishandle.
  const nodes = [0, 1, 2, 3].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1, w: -2 }, { a: 1, b: 2, w: 3 },
    { a: 0, b: 2, w: 4 }, { a: 2, b: 3, w: 1 }, { a: 1, b: 3, w: 5 },
  ];
  return johnsonFrames({ nodes, edges, sampleSource: 0, label: "Johnson's APSP (negative edge)" });
}

function johnsonChain() {
  // Negative edges along a chain so potentials shift visibly.
  const nodes = [0, 1, 2, 3, 4].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1, w: 4 }, { a: 0, b: 2, w: 1 },
    { a: 2, b: 1, w: -2 }, { a: 1, b: 3, w: 1 }, { a: 2, b: 3, w: 5 }, { a: 3, b: 4, w: 3 },
  ];
  return johnsonFrames({ nodes, edges, sampleSource: 0, label: "Johnson's APSP (reweight chain)" });
}

// ---------------------------------------------------------------------------
export default {
  'dijkstra-on-grid': {
    title: 'Dijkstra on a grid: 4-neighbour relaxation on an implicit graph',
    renderer: 'grid',
    cases: [
      { label: 'Cheap corridor', frames: gridSmallDetour() },
      { label: 'Skirt the wall', frames: gridUniform() },
    ],
  },
  'dijkstra-with-path': {
    title: 'Dijkstra + path reconstruction via parent[]',
    renderer: 'graph',
    cases: [
      { label: 'Rerouted shortest path', frames: dijkstraPathRerouted() },
      { label: 'Wider shortest-path tree', frames: dijkstraPathWide() },
    ],
  },
  'dijkstra-stops': {
    title: 'Dijkstra with K stops: layered (node, stops-used) state',
    renderer: 'graph',
    cases: [
      { label: 'K = 0 (direct only)', frames: kStopsForcedDirect() },
      { label: 'K = 1 (one layover)', frames: kStopsOneAllowed() },
    ],
  },
  'kahn-topological-sort': {
    title: "Kahn's topological sort: in-degree wavefront queue",
    renderer: 'graph',
    cases: [
      { label: 'Valid DAG', frames: kahnDag() },
      { label: 'Cycle detection', frames: kahnCycle() },
    ],
  },
  'topological-sort-dfs': {
    title: 'Topological sort via DFS: reverse post-order finish times',
    renderer: 'graph',
    cases: [
      { label: 'DAG', frames: dfsTopoDag() },
      { label: 'Cycle (back edge)', frames: dfsTopoCycle() },
    ],
  },
  'johnson-all-pairs': {
    title: "Johnson's APSP: Bellman-Ford potentials then per-source Dijkstra",
    renderer: 'graph',
    cases: [
      { label: 'Negative edge', frames: johnsonNegEdges() },
      { label: 'Reweight chain', frames: johnsonChain() },
    ],
  },
};
