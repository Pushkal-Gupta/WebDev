// Graph-traversal / structure visualizations (graph renderer).
// Frame shape mirrors GraphRenderer in AlgoVisualizer.jsx:
//   frame = { nodes: [{ id, label, state? }], edges: [{ a, b, w?, state? }], caption }
//   node states: 'current' | 'frontier' | 'visited' | 'done'
//   edge states: 'current' | 'frontier' | 'tree' | 'visited' | 'rejected'
// Nodes are auto-positioned in a circle by the renderer; we never supply x/y.
// All helpers below are self-contained pure JS — no imports from conceptVisualizations.js.

// ---------------------------------------------------------------------------
// BFS — layer-by-layer queue traversal with a visited set.
// ---------------------------------------------------------------------------
function bfsFrames({ nodes, edges, source, label }) {
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  for (const k in adj) adj[k].sort((x, y) => x - y);
  const frames = [];
  const visited = new Set([source]);
  const queue = [source];
  const tree = new Set();
  const dist = { [source]: 0 };

  const snap = (currentId, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: n.id in dist ? `${n.id}\nd=${dist[n.id]}` : String(n.id),
      state: n.id === currentId ? 'current'
        : queue.includes(n.id) ? 'frontier'
        : visited.has(n.id) ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      if (tree.has(`${e.a}-${e.b}`) || tree.has(`${e.b}-${e.a}`)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(source, `${label}: enqueue source ${source}, mark it visited at distance 0. queue = [${source}].`);
  let step = 0;
  while (queue.length) {
    const u = queue.shift();
    step += 1;
    snap(u, `Step ${step}: dequeue ${u} (distance ${dist[u]}). Scan its neighbors [${(adj[u] || []).join(', ')}] for unvisited nodes.`);
    let discovered = 0;
    for (const v of adj[u] || []) {
      if (!visited.has(v)) {
        visited.add(v);
        dist[v] = dist[u] + 1;
        queue.push(v);
        tree.add(`${u}-${v}`);
        discovered += 1;
        snap(u, `Discover ${v} along edge ${u}–${v}: first time seen, so dist[${v}] = ${dist[v]}. Enqueue it. queue = [${queue.join(', ')}].`);
      }
    }
    if (!discovered) snap(u, `All neighbors of ${u} are already visited — nothing new to enqueue. Continue draining the queue.`);
  }
  snap(null, `${label}: queue empty. Every reached node carries its shortest hop-distance from ${source}; highlighted edges form the BFS tree.`);
  return frames;
}

function bfsConnected() {
  const nodes = [0, 1, 2, 3, 4, 5, 6].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 1, b: 3 },
    { a: 1, b: 4 }, { a: 2, b: 5 }, { a: 4, b: 6 }, { a: 5, b: 6 },
  ];
  return bfsFrames({ nodes, edges, source: 0, label: 'BFS (connected)' });
}

function bfsDisconnected() {
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 1, b: 3 },
    { a: 4, b: 5 },
  ];
  const frames = bfsFrames({ nodes, edges, source: 0, label: 'BFS (disconnected)' });
  frames.push({
    nodes: nodes.map(n => ({ ...n, state: [0, 1, 2, 3].includes(n.id) ? 'done' : undefined })),
    edges,
    caption: `One BFS from 0 reached {0,1,2,3}; nodes 4 and 5 sit in a separate component. To cover every node, restart BFS from any still-unvisited node.`,
  });
  return frames;
}

function bfsShortestPath() {
  // Two routes from 0 to 5: BFS finds the fewest-edge route first.
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 5 },
    { a: 0, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 5 },
  ];
  return bfsFrames({ nodes, edges, source: 0, label: 'BFS shortest path' });
}

// ---------------------------------------------------------------------------
// A* — best-first search ordered by f = g + h with an admissible heuristic.
// ---------------------------------------------------------------------------
function astarFrames({ nodes, edges, source, goal, h, label }) {
  const adj = {};
  for (const e of edges) {
    (adj[e.a] ||= []).push([e.b, e.w]);
    (adj[e.b] ||= []).push([e.a, e.w]);
  }
  const g = {}; for (const n of nodes) g[n.id] = Infinity;
  g[source] = 0;
  const closed = new Set();
  const open = [source];
  const parent = {};
  const tree = new Set();
  const frames = [];
  const f = (id) => g[id] === Infinity ? Infinity : g[id] + h[id];
  const fstr = (id) => g[id] === Infinity ? '∞' : `${g[id]}+${h[id]}=${f(id)}`;

  const snap = (currentId, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: `${n.id}\nf=${g[n.id] === Infinity ? '∞' : f(n.id)}`,
      state: n.id === currentId ? 'current'
        : closed.has(n.id) ? 'done'
        : open.includes(n.id) ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      if (tree.has(`${e.a}-${e.b}`) || tree.has(`${e.b}-${e.a}`)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(source, `${label}: start at ${source}, g=0, h=${h[source]}, so f=${f(source)}. Goal is ${goal}. Open set = {${source}}.`);
  snap(source, `Rule: always expand the open node with the smallest f = g + h. Because h never overestimates the true remaining cost, the first time we pop the goal its path is optimal.`);
  let step = 0;
  while (open.length) {
    open.sort((a, b) => f(a) - f(b) || a - b);
    const u = open.shift();
    step += 1;
    if (u === goal) {
      closed.add(u);
      snap(u, `Step ${step}: pop ${u} = goal with f=${f(u)}. Since h is admissible, g[${u}]=${g[u]} is the optimal cost. Stop — reconstruct the path via parent links.`);
      break;
    }
    closed.add(u);
    snap(u, `Step ${step}: pop ${u} (lowest f=${fstr(u)}). Move it to the closed set and relax its edges.`);
    for (const [v, w] of adj[u] || []) {
      if (closed.has(v)) continue;
      const tentative = g[u] + w;
      if (tentative < g[v]) {
        const improved = g[v] !== Infinity;
        g[v] = tentative;
        parent[v] = u;
        for (const key of [...tree]) if (key.endsWith(`-${v}`) || key.startsWith(`${v}-`)) tree.delete(key);
        tree.add(`${u}-${v}`);
        if (!open.includes(v)) open.push(v);
        snap(u, `Edge ${u}–${v} (cost ${w}): g[${v}] ${improved ? 'improves' : 'set'} to ${g[u]}+${w}=${tentative}, f[${v}]=${fstr(v)}. ${open.includes(v) ? 'Keep' : 'Add'} ${v} in the open set.`);
      } else {
        snap(u, `Edge ${u}–${v} (cost ${w}): g[${u}]+${w}=${tentative} does not beat g[${v}]=${g[v]} — no improvement, skip.`);
      }
    }
  }
  // Reconstruct.
  const path = [];
  let cur = goal;
  if (g[goal] !== Infinity) { while (cur !== undefined) { path.unshift(cur); cur = parent[cur]; } }
  snap(goal, `${label}: optimal path ${path.join(' → ')} with cost ${g[goal]}. A* expanded fewer nodes than blind search because h steered it toward ${goal}.`);
  return frames;
}

function astarGuided() {
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 1 }, { a: 0, b: 2, w: 4 },
    { a: 1, b: 3, w: 2 }, { a: 2, b: 3, w: 1 },
    { a: 3, b: 5, w: 3 }, { a: 2, b: 4, w: 5 }, { a: 4, b: 5, w: 1 },
  ];
  // Admissible heuristic (lower bounds on remaining cost toward goal 5).
  const h = { 0: 4, 1: 3, 2: 2, 3: 2, 4: 1, 5: 0 };
  return astarFrames({ nodes, edges, source: 0, goal: 5, h, label: 'A* (guided)' });
}

function astarZeroHeuristic() {
  // h = 0 everywhere → A* degenerates to Dijkstra (still correct, less focused).
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 5 },
    { a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 4 },
    { a: 2, b: 4, w: 2 }, { a: 3, b: 4, w: 1 },
  ];
  const h = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  return astarFrames({ nodes, edges, source: 0, goal: 4, h, label: 'A* (h=0 = Dijkstra)' });
}

// ---------------------------------------------------------------------------
// Articulation points & bridges — Tarjan low-link DFS in one pass.
// ---------------------------------------------------------------------------
function tarjanFrames({ nodes, edges, root, label }) {
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  for (const k in adj) adj[k].sort((x, y) => x - y);
  const disc = {}, low = {};
  const treeEdges = new Set();
  const bridges = new Set();
  const artic = new Set();
  let timer = 0;
  const frames = [];

  const snap = (currentId, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: disc[n.id] != null ? `${n.id}\nd${disc[n.id]} l${low[n.id]}` : String(n.id),
      state: n.id === currentId ? 'current'
        : artic.has(n.id) ? 'done'
        : disc[n.id] != null ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      if (bridges.has(`${e.a}-${e.b}`) || bridges.has(`${e.b}-${e.a}`)) return { ...e, state: 'rejected' };
      if (treeEdges.has(`${e.a}-${e.b}`) || treeEdges.has(`${e.b}-${e.a}`)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(root, `${label}: DFS from root ${root}. Each node gets a discovery time disc and a low-link low = earliest disc reachable via its subtree plus one back-edge.`);

  const dfs = (u, parent) => {
    timer += 1;
    disc[u] = low[u] = timer;
    snap(u, `Visit ${u}: disc[${u}] = low[${u}] = ${timer}. Explore unvisited neighbors as tree edges; revisits become back edges.`);
    let children = 0;
    for (const v of adj[u] || []) {
      if (v === parent) continue;
      if (disc[v] == null) {
        children += 1;
        treeEdges.add(`${u}-${v}`);
        snap(u, `Tree edge ${u}→${v}: descend into child ${v}.`);
        dfs(v, u);
        const before = low[u];
        low[u] = Math.min(low[u], low[v]);
        if (low[u] !== before) snap(u, `Back from ${v}: low[${u}] = min(${before}, low[${v}]=${low[v]}) = ${low[u]}. Child can climb above ${u}.`);
        if (low[v] > disc[u]) {
          bridges.add(`${u}-${v}`);
          snap(u, `low[${v}]=${low[v]} > disc[${u}]=${disc[u]}: subtree at ${v} has no back-edge above ${u}, so edge ${u}–${v} is a BRIDGE.`);
        }
        if (parent !== -1 && low[v] >= disc[u]) {
          artic.add(u);
          snap(u, `low[${v}]=${low[v]} ≥ disc[${u}]=${disc[u]}: removing ${u} would strand ${v}'s subtree, so ${u} is an ARTICULATION point.`);
        }
      } else {
        const before = low[u];
        low[u] = Math.min(low[u], disc[v]);
        snap(u, `Back edge ${u}→${v} (already visited): low[${u}] = min(${before}, disc[${v}]=${disc[v]}) = ${low[u]}.`);
      }
    }
    if (parent === -1 && children > 1) {
      artic.add(u);
      snap(u, `Root ${u} has ${children} DFS-tree children — removing it splits the graph, so the root is an ARTICULATION point.`);
    }
  };
  dfs(root, -1);
  snap(null, `${label}: done. Articulation points = {${[...artic].sort((a, b) => a - b).join(', ') || '—'}}; bridges highlighted. One DFS, O(V+E).`);
  return frames;
}

function tarjanChainBridges() {
  // A chain with a side cycle: the bare chain edges are bridges.
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 2, b: 4 },
  ];
  return tarjanFrames({ nodes, edges, root: 0, label: 'Bridges (chain + cycle)' });
}

function tarjanCutVertex() {
  // Two triangles sharing a single hub vertex → hub is an articulation point.
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 2 },
  ];
  return tarjanFrames({ nodes, edges, root: 0, label: 'Cut vertex (two triangles)' });
}

// ---------------------------------------------------------------------------
// Kuhn's algorithm — augmenting-path maximum bipartite matching.
// ---------------------------------------------------------------------------
function kuhnFrames({ left, right, edges, label }) {
  // edges: pairs [l, r]. Node ids: left and right sets are disjoint integers.
  const nodes = [...left, ...right].map(id => ({ id }));
  const adj = {};
  for (const [l, r] of edges) (adj[l] ||= []).push(r);
  for (const k in adj) adj[k].sort((x, y) => x - y);
  const matchR = {}; // right node -> matched left node
  const frames = [];

  const matchedEdgeSet = () => {
    const s = new Set();
    for (const r in matchR) { s.add(`${matchR[r]}-${r}`); }
    return s;
  };

  const snap = (currentId, tryEdge, caption) => {
    const matched = matchedEdgeSet();
    const matchedNodes = new Set();
    for (const r in matchR) { matchedNodes.add(Number(r)); matchedNodes.add(matchR[r]); }
    const ns = nodes.map(n => ({
      ...n,
      state: n.id === currentId ? 'current'
        : matchedNodes.has(n.id) ? 'done'
        : undefined,
    }));
    const es = edges.map(([l, r]) => {
      const e = { a: l, b: r };
      if (matched.has(`${l}-${r}`)) return { ...e, state: 'tree' };
      if (tryEdge && tryEdge[0] === l && tryEdge[1] === r) return { ...e, state: 'current' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, null, `${label}: left = {${left.join(', ')}}, right = {${right.join(', ')}}. Add each left node, augmenting along an alternating path when its targets are taken.`);

  let matches = 0;
  for (const u of left) {
    const seen = new Set();
    snap(u, null, `Process left node ${u}. Search for an augmenting path: a free right node, or one whose current partner can be rerouted.`);
    const tryKuhn = (x) => {
      for (const r of adj[x] || []) {
        if (seen.has(r)) continue;
        seen.add(r);
        snap(x, [x, r], `Try edge ${x}–${r}. ${matchR[r] == null ? `Right ${r} is free.` : `Right ${r} is taken by ${matchR[r]} — recurse to reroute ${matchR[r]}.`}`);
        if (matchR[r] == null || tryKuhn(matchR[r])) {
          matchR[r] = x;
          snap(x, null, `Match ${x}↔${r}. Augmenting path completed; matching size grows.`);
          return true;
        }
      }
      return false;
    };
    if (tryKuhn(u)) { matches += 1; snap(u, null, `Left ${u} successfully matched. Current matching size = ${matches}.`); }
    else snap(u, null, `No augmenting path for ${u} — it stays unmatched. Matching size still ${matches}.`);
  }
  snap(null, null, `${label}: maximum matching size = ${matches}. Highlighted edges form the matching; the rest stay unmatched.`);
  return frames;
}

function kuhnPerfectMatch() {
  // Left {0,1,2} right {3,4,5}: admits a perfect matching, with one reroute.
  return kuhnFrames({
    left: [0, 1, 2],
    right: [3, 4, 5],
    edges: [[0, 3], [0, 4], [1, 3], [2, 4], [2, 5]],
    label: 'Kuhn (perfect matching)',
  });
}

function kuhnPartialMatch() {
  // A contended right node forces one left node to stay unmatched.
  return kuhnFrames({
    left: [0, 1, 2],
    right: [3, 4],
    edges: [[0, 3], [1, 3], [2, 3], [1, 4]],
    label: 'Kuhn (partial matching)',
  });
}

// ---------------------------------------------------------------------------
// Binary lifting for LCA — climb 2^k ancestors to align depths, then together.
// ---------------------------------------------------------------------------
function binaryLiftingFrames({ parent, depth, a, b, label }) {
  // parent: { node: directParent | -1 }. Build up[k][node] tables.
  const ids = Object.keys(parent).map(Number).sort((x, y) => x - y);
  const LOG = Math.max(1, Math.ceil(Math.log2(ids.length)) + 1);
  const up = Array.from({ length: LOG }, () => ({}));
  for (const v of ids) up[0][v] = parent[v];
  for (let k = 1; k < LOG; k++) {
    for (const v of ids) {
      const mid = up[k - 1][v];
      up[k][v] = mid === -1 ? -1 : up[k - 1][mid];
    }
  }
  // Tree edges for drawing.
  const treeEdges = [];
  for (const v of ids) if (parent[v] !== -1) treeEdges.push({ a: parent[v], b: v });

  const frames = [];
  const snap = (highlight, path, caption) => {
    const onPath = new Set(path || []);
    const ns = ids.map(id => ({
      id,
      label: `${id}\nh=${depth[id]}`,
      state: id === highlight ? 'current'
        : onPath.has(id) ? 'frontier'
        : undefined,
    }));
    frames.push({ nodes: ns, edges: treeEdges.map(e => ({ ...e })), caption });
  };

  snap(null, [], `${label}: LCA(${a}, ${b}). up[k][v] = the 2^k-th ancestor of v; built so a node can jump 1,2,4,… steps up in O(log n).`);
  snap(null, [], `Preprocess level 0: up[0][v] is each node's direct parent — read straight off the tree edges.`);
  for (let k = 1; k < LOG; k++) {
    snap(null, [], `Preprocess level ${k}: up[${k}][v] = up[${k - 1}][ up[${k - 1}][v] ]. Two 2^${k - 1}-step hops compose into one 2^${k}-step jump. Table now answers any ancestor jump in O(log n).`);
  }
  snap(a, [a, b], `Tables ready. Query LCA(${a}, ${b}): node ${a} is at depth ${depth[a]}, node ${b} at depth ${depth[b]}.`);

  let u = a, v = b;
  if (depth[u] < depth[v]) { const t = u; u = v; v = t; }
  snap(u, [u, v], `Make ${u} the deeper node (depth ${depth[u]} ≥ depth ${depth[v]}). First lift ${u} up to ${v}'s level.`);

  let diff = depth[u] - depth[v];
  for (let k = LOG - 1; k >= 0; k--) {
    if (diff & (1 << k)) {
      const before = u;
      u = up[k][u];
      diff -= (1 << k);
      snap(u, [u, v], `Depth gap has bit 2^${k}=${1 << k}: jump ${before} up to up[${k}][${before}] = ${u}. Remaining gap to close: ${diff}.`);
    }
  }
  if (u === v) {
    snap(u, [u], `After aligning depths, both pointers meet at ${u}. One node was an ancestor of the other, so LCA(${a}, ${b}) = ${u}.`);
    snap(u, [u], `${label}: LCA(${a}, ${b}) = ${u}. The whole query ran in O(log n) jumps over the precomputed tables.`);
    return frames;
  }
  snap(u, [u, v], `Now ${u} and ${v} sit at the same depth but still differ. Climb both together by the largest 2^k that keeps them apart.`);
  for (let k = LOG - 1; k >= 0; k--) {
    if (up[k][u] !== up[k][v] && up[k][u] !== -1) {
      const bu = u, bv = v;
      u = up[k][u]; v = up[k][v];
      snap(u, [u, v], `up[${k}][${bu}]=${u} ≠ up[${k}][${bv}]=${v}: still below the LCA, so jump both up 2^${k}=${1 << k} steps.`);
    }
  }
  const lca = up[0][u];
  snap(lca, [u, v, lca], `Pointers now sit just below the meeting point: up[0][${u}] = up[0][${v}] = ${lca}. That shared parent is the LCA.`);
  snap(lca, [lca], `${label}: LCA(${a}, ${b}) = ${lca}. Whole query ran in O(log n) jumps over the precomputed tables.`);
  return frames;
}

function lcaTwoBranches() {
  // Tree: 0 root; 0-1,0-2; 1-3,1-4; 3-5,3-6; 2-7.
  const parent = { 0: -1, 1: 0, 2: 0, 3: 1, 4: 1, 5: 3, 6: 3, 7: 2 };
  const depth = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 2 };
  return binaryLiftingFrames({ parent, depth, a: 5, b: 4, label: 'Binary lifting LCA' });
}

function lcaAncestorChain() {
  // Query where one node is an ancestor of the other (depth-align reveals it).
  const parent = { 0: -1, 1: 0, 2: 0, 3: 1, 4: 1, 5: 3, 6: 3, 7: 2 };
  const depth = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 2 };
  return binaryLiftingFrames({ parent, depth, a: 6, b: 1, label: 'Binary lifting LCA (ancestor)' });
}

// ---------------------------------------------------------------------------
export default {
  'bfs-algorithm': {
    title: 'BFS: layer-by-layer queue traversal',
    renderer: 'graph',
    cases: [
      { label: 'Connected graph', frames: bfsConnected() },
      { label: 'Disconnected graph', frames: bfsDisconnected() },
      { label: 'Shortest path (edges)', frames: bfsShortestPath() },
    ],
  },
  'astar-search': {
    title: 'A*: best-first search with f = g + h',
    renderer: 'graph',
    cases: [
      { label: 'Heuristic-guided', frames: astarGuided() },
      { label: 'h = 0 (= Dijkstra)', frames: astarZeroHeuristic() },
    ],
  },
  'articulation-bridges': {
    title: 'Tarjan: articulation points & bridges',
    renderer: 'graph',
    cases: [
      { label: 'Bridges (chain + cycle)', frames: tarjanChainBridges() },
      { label: 'Cut vertex (two triangles)', frames: tarjanCutVertex() },
    ],
  },
  'bipartite-matching-kuhn': {
    title: "Kuhn: augmenting-path bipartite matching",
    renderer: 'graph',
    cases: [
      { label: 'Perfect matching', frames: kuhnPerfectMatch() },
      { label: 'Partial matching', frames: kuhnPartialMatch() },
    ],
  },
  'binary-lifting-lca': {
    title: 'Binary lifting: LCA via 2^k ancestor jumps',
    renderer: 'graph',
    cases: [
      { label: 'Two distinct branches', frames: lcaTwoBranches() },
      { label: 'Ancestor query', frames: lcaAncestorChain() },
    ],
  },
};
