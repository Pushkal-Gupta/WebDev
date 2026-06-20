// MST & SCC visualizations (graph renderer).
// Frame shape mirrors GraphRenderer in AlgoVisualizer.jsx:
//   frame = { nodes: [{ id, label, state? }], edges: [{ a, b, w?, state? }], caption }
//   node states: 'current' | 'frontier' | 'visited' | 'done'
//   edge states: 'current' | 'frontier' | 'tree' | 'visited' | 'rejected'
// Nodes are auto-positioned in a circle by the renderer; we never supply x/y.
// All helpers below are self-contained pure JS — no imports from conceptVisualizations.js.

const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// ---------------------------------------------------------------------------
// Prim's MST — grow one connected tree from a seed via the cheapest crossing edge.
// ---------------------------------------------------------------------------
function primFrames({ nodes, edges, start, label }) {
  const adj = {};
  for (const e of edges) {
    (adj[e.a] ||= []).push([e.b, e.w]);
    (adj[e.b] ||= []).push([e.a, e.w]);
  }
  const inTree = new Set();
  const tree = new Set();      // chosen MST edge keys
  const rejected = new Set();  // edges skipped because both endpoints in tree
  const frames = [];
  let totalW = 0;

  const crossingList = () => {
    const out = [];
    for (const u of inTree) {
      for (const [v, w] of adj[u] || []) {
        if (!inTree.has(v)) out.push({ u, v, w });
      }
    }
    out.sort((p, q) => p.w - q.w || p.v - q.v);
    return out;
  };

  const snap = (currentId, frontierEdges, caption) => {
    const fSet = new Set((frontierEdges || []).map(({ u, v }) => edgeKey(u, v)));
    const ns = nodes.map(n => ({
      ...n,
      state: n.id === currentId ? 'current'
        : inTree.has(n.id) ? 'done'
        : undefined,
    }));
    const es = edges.map(e => {
      const k = edgeKey(e.a, e.b);
      if (tree.has(k)) return { ...e, state: 'tree' };
      if (rejected.has(k)) return { ...e, state: 'rejected' };
      if (fSet.has(k)) return { ...e, state: 'frontier' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  inTree.add(start);
  snap(start, crossingList(), `${label}: seed the tree with vertex ${start}. The "frontier" is every edge with exactly one endpoint inside the tree.`);

  while (inTree.size < nodes.length) {
    const cross = crossingList();
    if (!cross.length) break;
    snap(null, cross, `Frontier crossing edges: ${cross.map(c => `${c.u}-${c.v}(${c.w})`).join(', ')}. By the cut property, the cheapest one is safe to add.`);
    const best = cross[0];
    const k = edgeKey(best.u, best.v);
    tree.add(k);
    totalW += best.w;
    snap(best.v, cross, `Cheapest crossing edge is ${best.u}-${best.v} (weight ${best.w}). Add it; vertex ${best.v} joins the tree. Running total = ${totalW}.`);
    inTree.add(best.v);
    // Mark any now-internal frontier edges as rejected (both endpoints inside).
    for (const e of edges) {
      const ek = edgeKey(e.a, e.b);
      if (!tree.has(ek) && inTree.has(e.a) && inTree.has(e.b)) rejected.add(ek);
    }
    snap(best.v, crossingList(), `Vertex ${best.v} absorbed. Edges now wholly inside the tree are dropped — adding them would close a cycle.`);
  }

  snap(null, [], `${label}: tree spans all ${nodes.length} vertices with ${tree.size} edges, total weight ${totalW}. Highlighted edges form the MST.`);
  return frames;
}

function primDense() {
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 1 }, { a: 0, b: 2, w: 4 },
    { a: 1, b: 2, w: 2 }, { a: 1, b: 3, w: 5 },
    { a: 2, b: 3, w: 3 }, { a: 3, b: 4, w: 2 }, { a: 2, b: 4, w: 6 },
  ];
  return primFrames({ nodes, edges, start: 0, label: "Prim (seed 0)" });
}

function primTieBreak() {
  // Several equal-weight crossing edges to show deterministic tie-break.
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 2 },
    { a: 1, b: 3, w: 3 }, { a: 2, b: 3, w: 1 },
    { a: 3, b: 4, w: 4 }, { a: 4, b: 5, w: 2 }, { a: 2, b: 5, w: 5 },
  ];
  return primFrames({ nodes, edges, start: 0, label: "Prim (ties)" });
}

// ---------------------------------------------------------------------------
// Kruskal's MST — sort edges, union with cycle-skip via disjoint-set.
// ---------------------------------------------------------------------------
function kruskalFrames({ nodes, edges, label }) {
  const parent = {};
  for (const n of nodes) parent[n.id] = n.id;
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };

  const sorted = [...edges].map((e, i) => ({ ...e, _i: i })).sort((p, q) => p.w - q.w || p._i - q._i);
  const tree = new Set();
  const rejected = new Set();
  const frames = [];
  let totalW = 0;
  let accepted = 0;

  const snap = (currentEdge, caption) => {
    const ck = currentEdge ? edgeKey(currentEdge.a, currentEdge.b) : null;
    const treeNodes = new Set();
    for (const e of edges) if (tree.has(edgeKey(e.a, e.b))) { treeNodes.add(e.a); treeNodes.add(e.b); }
    const ns = nodes.map(n => ({ ...n, state: treeNodes.has(n.id) ? 'done' : undefined }));
    const es = edges.map(e => {
      const k = edgeKey(e.a, e.b);
      if (tree.has(k)) return { ...e, state: 'tree' };
      if (rejected.has(k)) return { ...e, state: 'rejected' };
      if (k === ck) return { ...e, state: 'current' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `${label}: sort all edges by weight → ${sorted.map(e => `${e.a}-${e.b}(${e.w})`).join(', ')}. Scan lightest first; accept an edge only if it joins two different components.`);

  for (const e of sorted) {
    snap(e, `Consider ${e.a}-${e.b} (weight ${e.w}). find(${e.a}) vs find(${e.b}): are they already connected?`);
    const ra = find(e.a), rb = find(e.b);
    const k = edgeKey(e.a, e.b);
    if (ra === rb) {
      rejected.add(k);
      snap(e, `Both endpoints already share a component (root ${ra}). Adding ${e.a}-${e.b} would close a cycle — by the cycle property it is the heaviest in that cycle, so skip it.`);
    } else {
      parent[ra] = rb;
      tree.add(k);
      totalW += e.w;
      accepted += 1;
      snap(e, `Different components — union them. Accept ${e.a}-${e.b}. MST edges = ${accepted}, total weight = ${totalW}.`);
      if (accepted === nodes.length - 1) {
        snap(null, `Accepted V-1 = ${nodes.length - 1} edges — the tree is complete, remaining heavier edges are irrelevant.`);
        break;
      }
    }
  }

  snap(null, `${label}: MST has ${tree.size} edges, total weight ${totalW}. Highlighted edges were accepted; dashed ones were cycle-closing rejects.`);
  return frames;
}

function kruskalBasic() {
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 1 }, { a: 0, b: 2, w: 4 },
    { a: 1, b: 2, w: 2 }, { a: 1, b: 3, w: 5 },
    { a: 2, b: 3, w: 3 }, { a: 3, b: 4, w: 2 }, { a: 2, b: 4, w: 6 },
  ];
  return kruskalFrames({ nodes, edges, label: "Kruskal" });
}

function kruskalCycleHeavy() {
  // Triangle with a heavy third edge — shows the heaviest-in-cycle reject clearly.
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 1 }, { a: 1, b: 2, w: 2 }, { a: 0, b: 2, w: 7 },
    { a: 2, b: 3, w: 3 }, { a: 3, b: 4, w: 1 }, { a: 4, b: 5, w: 2 }, { a: 3, b: 5, w: 6 },
  ];
  return kruskalFrames({ nodes, edges, label: "Kruskal (cycle skip)" });
}

// ---------------------------------------------------------------------------
// Borůvka's MST — each round every component adds its cheapest outgoing edge.
// ---------------------------------------------------------------------------
function boruvkaFrames({ nodes, edges, label }) {
  const parent = {};
  for (const n of nodes) parent[n.id] = n.id;
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };

  const indexed = edges.map((e, i) => ({ ...e, _i: i }));
  const tree = new Set();
  const frames = [];
  let totalW = 0;
  let round = 0;

  const compOf = (id) => find(id);

  const snap = (highlightEdges, currentEdge, caption) => {
    const hSet = new Set((highlightEdges || []).map(e => edgeKey(e.a, e.b)));
    const ck = currentEdge ? edgeKey(currentEdge.a, currentEdge.b) : null;
    const treeNodes = new Set();
    for (const e of edges) if (tree.has(edgeKey(e.a, e.b))) { treeNodes.add(e.a); treeNodes.add(e.b); }
    const ns = nodes.map(n => ({ ...n, state: treeNodes.has(n.id) ? 'done' : undefined }));
    const es = edges.map(e => {
      const k = edgeKey(e.a, e.b);
      if (tree.has(k)) return { ...e, state: 'tree' };
      if (k === ck) return { ...e, state: 'current' };
      if (hSet.has(k)) return { ...e, state: 'frontier' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  const numComponents = () => new Set(nodes.map(n => find(n.id))).size;

  snap([], null, `${label}: every vertex starts as its own component (${nodes.length} of them). Each round, every component picks its single cheapest outgoing edge — all at once.`);

  while (numComponents() > 1) {
    round += 1;
    // Cheapest outgoing edge per component (tie-break on edge index).
    const cheapest = {};
    for (const e of indexed) {
      const ca = compOf(e.a), cb = compOf(e.b);
      if (ca === cb) continue;
      for (const [c, other] of [[ca, e], [cb, e]]) {
        if (!cheapest[c] || e.w < cheapest[c].w || (e.w === cheapest[c].w && e._i < cheapest[c]._i)) {
          cheapest[c] = other;
        }
      }
    }
    const picks = Object.entries(cheapest);
    snap(picks.map(([, e]) => e), null, `Round ${round}: scan all edges, find each component's cheapest crossing edge. Candidates: ${picks.map(([c, e]) => `comp${c}→${e.a}-${e.b}(${e.w})`).join(', ')}.`);

    for (const [, e] of picks) {
      const k = edgeKey(e.a, e.b);
      const ra = find(e.a), rb = find(e.b);
      if (ra === rb) {
        snap([], e, `${e.a}-${e.b} was chosen by two components that already merged this round — tie-break index dedupes it, so skip.`);
        continue;
      }
      parent[ra] = rb;
      if (!tree.has(k)) { tree.add(k); totalW += e.w; }
      snap([], e, `Add cheapest edge ${e.a}-${e.b} (weight ${e.w}) — its two components fuse into one. Running total = ${totalW}.`);
    }
    snap([], null, `End of round ${round}: ${numComponents()} component(s) remain. Each round at least halves the count, so this finishes in O(log V) rounds.`);
  }

  snap([], null, `${label}: one component left — the MST is complete with ${tree.size} edges, total weight ${totalW}.`);
  return frames;
}

function boruvkaTwoRounds() {
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 1 }, { a: 2, b: 3, w: 1 }, { a: 4, b: 5, w: 1 },
    { a: 1, b: 2, w: 3 }, { a: 3, b: 4, w: 4 },
    { a: 0, b: 5, w: 8 }, { a: 1, b: 4, w: 6 },
  ];
  return boruvkaFrames({ nodes, edges, label: "Borůvka" });
}

function boruvkaParallel() {
  const nodes = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1, w: 2 }, { a: 2, b: 3, w: 1 }, { a: 4, b: 5, w: 2 }, { a: 6, b: 7, w: 1 },
    { a: 1, b: 2, w: 5 }, { a: 3, b: 4, w: 6 }, { a: 5, b: 6, w: 5 },
    { a: 0, b: 7, w: 9 },
  ];
  return boruvkaFrames({ nodes, edges, label: "Borůvka (parallel rounds)" });
}

// ---------------------------------------------------------------------------
// Kosaraju's SCC — Pass 1 finish order, Pass 2 DFS on transpose.
// (directed edges drawn as undirected pairs; caption narrates direction)
// ---------------------------------------------------------------------------
function kosarajuFrames({ nodes, edges, label }) {
  const adj = {}, radj = {};
  for (const n of nodes) { adj[n.id] = []; radj[n.id] = []; }
  for (const e of edges) { adj[e.a].push(e.b); radj[e.b].push(e.a); }
  for (const k in adj) adj[k].sort((x, y) => x - y);
  for (const k in radj) radj[k].sort((x, y) => x - y);

  const frames = [];
  const order = [];        // finish order (pass 1)
  const visited1 = new Set();
  const comp = {};         // node -> component index
  let compCount = 0;

  const sccNodeStates = (currentId, activeSet) => nodes.map(n => ({
    ...n,
    state: n.id === currentId ? 'current'
      : activeSet && activeSet.has(n.id) ? 'frontier'
      : comp[n.id] != null ? 'done'
      : visited1.has(n.id) ? 'visited'
      : undefined,
  }));

  const snap1 = (currentId, activeSet, caption) => {
    frames.push({ nodes: sccNodeStates(currentId, activeSet), edges: edges.map(e => ({ ...e })), caption });
  };

  const snap2 = (currentId, activeSet, treeKeys, caption) => {
    const es = edges.map(e => treeKeys.has(`${e.a}->${e.b}`) ? { ...e, state: 'tree' } : { ...e });
    frames.push({ nodes: sccNodeStates(currentId, activeSet), edges: es, caption });
  };

  snap1(null, null, `${label}: Pass 1 — DFS on the original graph, pushing each vertex onto a stack when its call finishes. Finish order reveals a topological order on the SCC condensation.`);

  // Pass 1: iterative DFS recording finish order.
  for (const s of nodes.map(n => n.id)) {
    if (visited1.has(s)) continue;
    const stack = [[s, 0]];
    visited1.add(s);
    snap1(s, new Set([s]), `Pass 1: start DFS at ${s} (unvisited). Explore as deep as possible before recording finishes.`);
    while (stack.length) {
      const top = stack[stack.length - 1];
      const [u, idx] = top;
      if (idx < adj[u].length) {
        top[1] += 1;
        const v = adj[u][idx];
        if (!visited1.has(v)) {
          visited1.add(v);
          stack.push([v, 0]);
          snap1(v, new Set(stack.map(s2 => s2[0])), `Pass 1: edge ${u}→${v}, descend into ${v}. DFS stack = [${stack.map(s2 => s2[0]).join(', ')}].`);
        }
      } else {
        stack.pop();
        order.push(u);
        snap1(u, new Set(stack.map(s2 => s2[0])), `Pass 1: ${u} has no unexplored out-edges — it finishes. Push ${u} to the order stack → [${order.join(', ')}].`);
      }
    }
  }

  snap1(null, null, `Pass 1 done. Finish order (last to finish first) = [${[...order].reverse().join(', ')}]. The last-finishing vertex sits in a source SCC of the condensation.`);

  // Pass 2: DFS on transpose in reverse finish order.
  const treeKeys = new Set();
  const visited2 = new Set();
  for (let i = order.length - 1; i >= 0; i--) {
    const s = order[i];
    if (visited2.has(s)) continue;
    compCount += 1;
    const members = [];
    const stack = [s];
    visited2.add(s);
    snap2(s, new Set([s]), treeKeys, `Pass 2: pop ${s} (latest finish, still unvisited). Start SCC #${compCount} via DFS on the transposed graph (edges reversed).`);
    while (stack.length) {
      const u = stack.pop();
      members.push(u);
      comp[u] = compCount;
      for (const v of radj[u]) {
        if (!visited2.has(v)) {
          visited2.add(v);
          stack.push(v);
          treeKeys.add(`${v}->${u}`); // original edge v->u becomes transpose edge u->v
          snap2(v, new Set([...members, ...stack]), treeKeys, `Pass 2: transpose edge ${u}→${v} (original ${v}→${u}) reaches new vertex ${v} — it belongs to SCC #${compCount}.`);
        }
      }
    }
    snap2(null, null, treeKeys, `SCC #${compCount} sealed: {${members.sort((a, b) => a - b).join(', ')}}. The transpose DFS could not escape this component.`);
  }

  snap2(null, null, treeKeys, `${label}: found ${compCount} strongly connected component(s). Every vertex is colored by its SCC; two DFS passes ran in O(V+E).`);
  return frames;
}

function kosarajuTwoSCC() {
  // Two cycles linked one-way: {0,1,2} and {3,4,5}, edge 2->3 only.
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 4, b: 5 }, { a: 5, b: 3 },
  ];
  return kosarajuFrames({ nodes, edges, label: "Kosaraju (two SCCs)" });
}

function kosarajuThreeSCC() {
  // {0,1} cycle, {2} singleton, {3,4} cycle, with one-way links forming a DAG condensation.
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 0 },
    { a: 1, b: 2 },
    { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 4, b: 3 },
  ];
  return kosarajuFrames({ nodes, edges, label: "Kosaraju (three SCCs)" });
}

// ---------------------------------------------------------------------------
// Tarjan's SCC — single DFS, disc/low + an on-stack set; emit SCC when low==disc.
// ---------------------------------------------------------------------------
function tarjanSccFrames({ nodes, edges, label }) {
  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) adj[e.a].push(e.b);
  for (const k in adj) adj[k].sort((x, y) => x - y);

  const disc = {}, low = {};
  const onStack = new Set();
  const stack = [];
  const comp = {};
  let timer = 0, compCount = 0;
  const frames = [];

  const snap = (currentId, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: disc[n.id] != null ? `${n.id}\nd${disc[n.id]} l${low[n.id]}` : String(n.id),
      state: n.id === currentId ? 'current'
        : comp[n.id] != null ? 'done'
        : onStack.has(n.id) ? 'frontier'
        : disc[n.id] != null ? 'visited'
        : undefined,
    }));
    frames.push({ nodes: ns, edges: edges.map(e => ({ ...e })), caption });
  };

  snap(null, `${label}: single DFS. Each vertex gets a discovery index disc and a lowlink low = smallest disc reachable via tree edges plus one back/cross edge to a stack-resident vertex.`);

  const dfs = (u) => {
    disc[u] = low[u] = ++timer;
    stack.push(u);
    onStack.add(u);
    snap(u, `Visit ${u}: disc[${u}] = low[${u}] = ${timer}. Push ${u} onto the SCC stack → [${stack.join(', ')}].`);
    for (const v of adj[u]) {
      if (disc[v] == null) {
        snap(u, `Tree edge ${u}→${v}: ${v} is unvisited, recurse into it.`);
        dfs(v);
        const before = low[u];
        low[u] = Math.min(low[u], low[v]);
        if (low[u] !== before) snap(u, `Back from ${v}: low[${u}] = min(${before}, low[${v}]=${low[v]}) = ${low[u]}. The subtree can climb above ${u}.`);
      } else if (onStack.has(v)) {
        const before = low[u];
        low[u] = Math.min(low[u], disc[v]);
        snap(u, `Back/cross edge ${u}→${v} and ${v} is on the stack: low[${u}] = min(${before}, disc[${v}]=${disc[v]}) = ${low[u]}.`);
      } else {
        snap(u, `Edge ${u}→${v} leads to a vertex already in a finished SCC (off-stack) — ignore it for lowlink.`);
      }
    }
    if (low[u] === disc[u]) {
      compCount += 1;
      const members = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        comp[w] = compCount;
        members.push(w);
      } while (w !== u);
      snap(u, `low[${u}] = disc[${u}] = ${disc[u]}: ${u} is an SCC root. Pop the stack down to ${u} → SCC #${compCount} = {${members.sort((a, b) => a - b).join(', ')}}.`);
    }
  };

  for (const s of nodes.map(n => n.id)) if (disc[s] == null) dfs(s);

  snap(null, `${label}: ${compCount} SCC(s) found in one pass. Each vertex is colored by its component; total work O(V+E).`);
  return frames;
}

function tarjanSccTwo() {
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 4, b: 5 }, { a: 5, b: 3 },
  ];
  return tarjanSccFrames({ nodes, edges, label: "Tarjan SCC (two)" });
}

function tarjanSccNested() {
  // A source singleton feeding into one big cycle plus a back-link sink.
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 },
    { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 1 },
    { a: 3, b: 4 },
  ];
  return tarjanSccFrames({ nodes, edges, label: "Tarjan SCC (mixed)" });
}

// ---------------------------------------------------------------------------
// Tarjan's articulation points & bridges — undirected, single DFS, disc/low.
// ---------------------------------------------------------------------------
function articulationFrames({ nodes, edges, root, label }) {
  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
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
      const k = edgeKey(e.a, e.b);
      if (bridges.has(k)) return { ...e, state: 'rejected' };
      if (treeEdges.has(k)) return { ...e, state: 'tree' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(root, `${label}: DFS from ${root}. disc = first-visit time, low = earliest disc reachable from the subtree via one back edge. Bridges and cut vertices fall out of comparing them.`);

  const dfs = (u, parent) => {
    disc[u] = low[u] = ++timer;
    snap(u, `Visit ${u}: disc[${u}] = low[${u}] = ${timer}.`);
    let children = 0;
    for (const v of adj[u]) {
      if (v === parent) continue;
      if (disc[v] == null) {
        children += 1;
        treeEdges.add(edgeKey(u, v));
        snap(u, `Tree edge ${u}–${v}: descend into ${v}.`);
        dfs(v, u);
        const before = low[u];
        low[u] = Math.min(low[u], low[v]);
        if (low[u] !== before) snap(u, `Back from ${v}: low[${u}] = min(${before}, low[${v}]=${low[v]}) = ${low[u]}.`);
        if (low[v] > disc[u]) {
          bridges.add(edgeKey(u, v));
          snap(u, `low[${v}]=${low[v]} > disc[${u}]=${disc[u]}: ${v}'s subtree has no back edge above ${u}, so edge ${u}–${v} is a BRIDGE.`);
        }
        if (parent !== -1 && low[v] >= disc[u]) {
          artic.add(u);
          snap(u, `low[${v}]=${low[v]} ≥ disc[${u}]=${disc[u]}: removing ${u} would strand ${v}'s subtree, so ${u} is an ARTICULATION point.`);
        }
      } else {
        const before = low[u];
        low[u] = Math.min(low[u], disc[v]);
        if (low[u] !== before) snap(u, `Back edge ${u}–${v} (${v} already visited): low[${u}] = min(${before}, disc[${v}]=${disc[v]}) = ${low[u]}.`);
        else snap(u, `Back edge ${u}–${v}: disc[${v}]=${disc[v]} is no smaller than low[${u}]=${low[u]} — no change.`);
      }
    }
    if (parent === -1 && children > 1) {
      artic.add(u);
      snap(u, `Root ${u} has ${children} DFS-tree children — removing it splits the graph, so the root is an ARTICULATION point.`);
    }
  };
  dfs(root, -1);

  snap(null, `${label}: done. Articulation points = {${[...artic].sort((a, b) => a - b).join(', ') || '—'}}; bridges shown dashed. One DFS, O(V+E).`);
  return frames;
}

function articulationChain() {
  // Triangle 0-1-2 then a tail 2-3-4 of bridges (matches concept visualization).
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 }, { a: 3, b: 4 },
  ];
  return articulationFrames({ nodes, edges, root: 0, label: "Cut vertices (triangle + tail)" });
}

function articulationHub() {
  // Two triangles sharing hub vertex 2 → hub is the only articulation point, no bridges.
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 2 },
  ];
  return articulationFrames({ nodes, edges, root: 0, label: "Hub cut vertex (two triangles)" });
}

// ---------------------------------------------------------------------------
export default {
  'mst-prim': {
    title: "Prim's MST: grow one tree via the cheapest crossing edge",
    renderer: 'graph',
    cases: [
      { label: 'Dense graph (seed 0)', frames: primDense() },
      { label: 'Tie-broken crossings', frames: primTieBreak() },
    ],
  },
  'kruskals-algorithm': {
    title: "Kruskal's MST: sort edges, union with cycle-skip",
    renderer: 'graph',
    cases: [
      { label: 'Basic run', frames: kruskalBasic() },
      { label: 'Cycle-skip (heaviest in cycle)', frames: kruskalCycleHeavy() },
    ],
  },
  'mst-boruvka': {
    title: "Borůvka's MST: parallel cheapest-edge-per-component rounds",
    renderer: 'graph',
    cases: [
      { label: 'Two rounds', frames: boruvkaTwoRounds() },
      { label: 'Parallel rounds (8 vertices)', frames: boruvkaParallel() },
    ],
  },
  'kosaraju-2pass': {
    title: "Kosaraju: two-pass SCC (finish order, then transpose)",
    renderer: 'graph',
    cases: [
      { label: 'Two SCCs', frames: kosarajuTwoSCC() },
      { label: 'Three SCCs', frames: kosarajuThreeSCC() },
    ],
  },
  'tarjan-scc-algorithm': {
    title: "Tarjan SCC: one DFS with lowlink + stack",
    renderer: 'graph',
    cases: [
      { label: 'Two SCCs', frames: tarjanSccTwo() },
      { label: 'Mixed components', frames: tarjanSccNested() },
    ],
  },
  'tarjan-articulation': {
    title: "Tarjan: articulation points & bridges via disc/low",
    renderer: 'graph',
    cases: [
      { label: 'Triangle + bridge tail', frames: articulationChain() },
      { label: 'Hub cut vertex', frames: articulationHub() },
    ],
  },
};
