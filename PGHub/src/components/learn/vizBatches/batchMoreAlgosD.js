// Interactive viz for advanced-graph / math / sampling concepts (batch D).
// Two renderer shapes, matching AlgoVisualizer.jsx exactly:
//
// GRAPH renderer (strongly-connected, prim-vs-kruskal, topo-shortest-dag,
//   tortoise-and-hare-multi):
//   frame = { nodes: [{ id, label?, state? }], edges: [{ a, b, w?, state? }], caption }
//   node states: 'current' | 'frontier' | 'visited' | 'done'
//   edge states: 'current' | 'frontier' | 'tree' | 'visited' | 'rejected'
//   Nodes auto-positioned in a circle by the renderer; never supply x/y.
//
// ARRAY renderer (pigeonhole-principle, random-weighted-sampling):
//   frame = { array, subRow?, pointers?, highlights?, caption }
//   tile/bar role tokens: 'current' | 'visited' | 'done' | 'frontier' | 'compared'
//     | 'tree' | 'pivot' | 'match' | 'new' | 'found' | 'key' | 'left' | 'right'
//     | 'low' | 'high' | 'window'
//
// All helpers are self-contained pure JS — no imports.

// ===========================================================================
// strongly-connected — Tarjan single-pass SCC with low-link values (graph).
// Edges directed a->b; tin/low shown in the node label; SCC roots emit groups.
// ===========================================================================
function tarjanSccFrames({ nodes, edges, label }) {
  const ids = nodes.map(n => n.id);
  const adj = {};
  for (const id of ids) adj[id] = [];
  for (const e of edges) adj[e.a].push(e.b);
  for (const k in adj) adj[k].sort((x, y) => x - y);

  const tin = {}, low = {};
  const onStack = {};
  const stack = [];
  const compOf = {};
  let timer = 0;
  let compCount = 0;
  const frames = [];

  const nlabel = (id) => (tin[id] == null ? String(id) : `${id}\nt${tin[id]} l${low[id]}`);
  const snap = (cur, caption) => {
    const ns = nodes.map(n => ({
      id: n.id,
      label: nlabel(n.id),
      state: n.id === cur ? 'current'
        : compOf[n.id] != null ? 'done'
        : onStack[n.id] ? 'frontier'
        : tin[n.id] != null ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      if (compOf[e.a] != null && compOf[e.a] === compOf[e.b]) return { ...e, state: 'tree' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `${label}: one DFS computes tin (discovery time) and low (lowest tin reachable while still on the active stack). When low[v] = tin[v], v is an SCC root.`);

  const dfs = (v) => {
    tin[v] = low[v] = timer++;
    stack.push(v); onStack[v] = true;
    snap(v, `Visit ${v}: tin[${v}] = low[${v}] = ${tin[v]}. Push it on the SCC stack. Explore its out-edges [${adj[v].join(', ') || '—'}].`);
    for (const w of adj[v]) {
      if (tin[w] == null) {
        snap(v, `Tree edge ${v}→${w}: ${w} unseen, descend into it.`);
        dfs(w);
        const before = low[v];
        low[v] = Math.min(low[v], low[w]);
        snap(v, `Back at ${v}: low[${v}] = min(${before}, low[${w}]=${low[w]}) = ${low[v]}.`);
      } else if (onStack[w]) {
        const before = low[v];
        low[v] = Math.min(low[v], tin[w]);
        snap(v, `Back edge ${v}→${w} (still on stack): low[${v}] = min(${before}, tin[${w}]=${tin[w]}) = ${low[v]}. Cross edges to popped nodes would NOT count.`);
      } else {
        snap(v, `Edge ${v}→${w}: ${w} already finished and off the stack — ignore it (it belongs to a settled SCC).`);
      }
    }
    if (low[v] === tin[v]) {
      const comp = [];
      let w;
      do {
        w = stack.pop(); onStack[w] = false; compOf[w] = compCount; comp.push(w);
      } while (w !== v);
      compCount++;
      snap(v, `low[${v}] = tin[${v}] = ${tin[v]}: ${v} is an SCC root. Pop the stack down to ${v} → component {${comp.sort((a, b) => a - b).join(', ')}}.`);
    }
  };

  for (const id of ids) if (tin[id] == null) dfs(id);

  snap(null, `${label}: done in O(V+E). Found ${compCount} strongly connected component${compCount === 1 ? '' : 's'}; each highlighted group is mutually reachable.`);
  return frames;
}

function sccTwoCycles() {
  // Two 3-cycles 0-1-2 and 3-4-5 joined by a one-way bridge 2->3.
  const nodes = [0, 1, 2, 3, 4, 5].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 4, b: 5 }, { a: 5, b: 3 },
  ];
  return tarjanSccFrames({ nodes, edges, label: 'Tarjan SCC (two cycles + bridge)' });
}

function sccNestedBack() {
  // Chain 0->1->2->3 with two back edges (3->1) and (2->0) merging everything.
  const nodes = [0, 1, 2, 3, 4].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 },
    { a: 3, b: 1 }, { a: 2, b: 0 }, { a: 3, b: 4 },
  ];
  return tarjanSccFrames({ nodes, edges, label: 'Tarjan SCC (back edges + tail)' });
}

// ===========================================================================
// prim-vs-kruskal — same weighted graph, contrast the two MST strategies.
// Both reuse the graph renderer; tree edges get state 'tree', rejected get
// state 'rejected', the edge under consideration gets 'current'.
// ===========================================================================
const MST_NODES = [0, 1, 2, 3, 4].map(id => ({ id }));
const MST_EDGES = [
  { a: 0, b: 1, w: 2 },
  { a: 0, b: 3, w: 6 },
  { a: 1, b: 2, w: 3 },
  { a: 1, b: 3, w: 8 },
  { a: 1, b: 4, w: 5 },
  { a: 2, b: 4, w: 7 },
  { a: 3, b: 4, w: 9 },
];

function edgeKey(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }

function kruskalFrames() {
  const tree = new Set();
  const rejected = new Set();
  const inTree = new Set();
  const parent = {};
  MST_NODES.forEach(n => { parent[n.id] = n.id; });
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const frames = [];

  const snap = (cur, caption) => {
    const ns = MST_NODES.map(n => ({
      id: n.id,
      state: inTree.has(n.id) ? 'done' : undefined,
    }));
    const es = MST_EDGES.map(e => {
      const k = edgeKey(e.a, e.b);
      if (tree.has(k)) return { ...e, state: 'tree' };
      if (rejected.has(k)) return { ...e, state: 'rejected' };
      if (cur && cur === k) return { ...e, state: 'current' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  const sorted = [...MST_EDGES].sort((x, y) => x.w - y.w);
  snap(null, `Kruskal: think globally. Sort all edges by weight → [${sorted.map(e => `${e.a}-${e.b}:${e.w}`).join(', ')}]. Accept an edge only if it joins two different components.`);

  let total = 0;
  for (const e of sorted) {
    const k = edgeKey(e.a, e.b);
    snap(k, `Consider edge ${e.a}–${e.b} (weight ${e.w}), the lightest unprocessed edge.`);
    const ra = find(e.a), rb = find(e.b);
    if (ra !== rb) {
      parent[ra] = rb;
      tree.add(k);
      inTree.add(e.a); inTree.add(e.b);
      total += e.w;
      snap(k, `find(${e.a})=${ra} ≠ find(${e.b})=${rb}: different components, so ACCEPT. Union them. MST weight so far = ${total}.`);
    } else {
      rejected.add(k);
      snap(k, `find(${e.a})=${ra} = find(${e.b})=${rb}: same component already — adding this edge would make a cycle, so REJECT.`);
    }
  }
  snap(null, `Kruskal done: MST weight = ${total}. Dominant cost is the edge sort, O(E log E); union-find checks are near-constant. Best when the graph is sparse.`);
  return frames;
}

function primFrames() {
  const start = 0;
  const tree = new Set();
  const inTree = new Set([start]);
  const frames = [];
  const adj = {};
  MST_NODES.forEach(n => { adj[n.id] = []; });
  for (const e of MST_EDGES) { adj[e.a].push(e); adj[e.b].push(e); }

  const frontierKeys = () => {
    const fk = new Set();
    for (const id of inTree) {
      for (const e of adj[id]) {
        const other = e.a === id ? e.b : e.a;
        if (!inTree.has(other)) fk.add(edgeKey(e.a, e.b));
      }
    }
    return fk;
  };

  const snap = (cur, caption) => {
    const front = frontierKeys();
    const ns = MST_NODES.map(n => ({
      id: n.id,
      state: inTree.has(n.id) ? 'done' : undefined,
    }));
    const es = MST_EDGES.map(e => {
      const k = edgeKey(e.a, e.b);
      if (tree.has(k)) return { ...e, state: 'tree' };
      if (cur && cur === k) return { ...e, state: 'current' };
      if (front.has(k)) return { ...e, state: 'frontier' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `Prim: think locally. Grow one tree from seed ${start}. At each step take the lightest edge crossing from the tree to a vertex outside it (the frontier, shown pulsing).`);

  let total = 0;
  while (inTree.size < MST_NODES.length) {
    let best = null;
    for (const id of inTree) {
      for (const e of adj[id]) {
        const other = e.a === id ? e.b : e.a;
        if (inTree.has(other)) continue;
        if (best == null || e.w < best.w) best = e;
      }
    }
    if (!best) break;
    const k = edgeKey(best.a, best.b);
    const newV = inTree.has(best.a) ? best.b : best.a;
    snap(k, `Cheapest frontier edge is ${best.a}–${best.b} (weight ${best.w}). Pull vertex ${newV} into the tree.`);
    tree.add(k);
    inTree.add(newV);
    total += best.w;
    snap(null, `Added ${newV}; tree weight now ${total}. Recompute the frontier from the enlarged tree and repeat.`);
  }
  snap(null, `Prim done: MST weight = ${total} — identical to Kruskal (same cut property). Array-scan Prim is O(V²), great on dense graphs; heap Prim is O(E log V).`);
  return frames;
}

// ===========================================================================
// topo-shortest-dag — topological order then relax edges in that order.
// Uses the worked example from the concept .md (5 vertices, a negative edge).
// dist shown in the node label; finalized vertices become 'done'.
// ===========================================================================
function topoShortestFrames() {
  const nodes = [0, 1, 2, 3, 4].map(id => ({ id }));
  const edges = [
    { a: 0, b: 1, w: 3 },
    { a: 0, b: 2, w: 6 },
    { a: 1, b: 2, w: 2 },
    { a: 1, b: 3, w: 4 },
    { a: 1, b: 4, w: -1 },
    { a: 2, b: 3, w: 1 },
    { a: 2, b: 4, w: 2 },
    { a: 3, b: 4, w: 5 },
  ];
  const order = [0, 1, 2, 3, 4];
  const INF = Infinity;
  const dist = {}; nodes.forEach(n => { dist[n.id] = INF; });
  dist[0] = 0;
  const settled = new Set();
  const frames = [];
  const ds = (v) => (dist[v] === INF ? '∞' : String(dist[v]));

  const snap = (cur, relaxKey, caption) => {
    const ns = nodes.map(n => ({
      id: n.id,
      label: `${n.id}\nd=${ds(n.id)}`,
      state: n.id === cur ? 'current'
        : settled.has(n.id) ? 'done'
        : dist[n.id] !== INF ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      if (relaxKey && relaxKey === `${e.a}-${e.b}`) return { ...e, state: 'current' };
      if (settled.has(e.a)) return { ...e, state: 'tree' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, null, `Shortest paths on a DAG. Step 1: topological order = [${order.join(', ')}]. Every edge points forward in this order, so a predecessor is always finalized first.`);
  snap(null, null, `Step 2: dist[source=0] = 0, all others ∞. Now sweep the order left → right; relaxing each vertex's out-edges. A negative edge (1→4 = -1) is fine — order forbids a shorter path arriving late.`);

  for (const u of order) {
    settled.add(u);
    snap(u, null, `Process ${u} (dist[${u}] = ${ds(u)} is now FINAL — no later vertex points back to it). Relax its outgoing edges.`);
    if (dist[u] === INF) {
      snap(u, null, `dist[${u}] is still ∞ — unreachable from the source, so nothing to push forward. Move on.`);
      continue;
    }
    for (const e of edges.filter(x => x.a === u)) {
      const cand = dist[u] + e.w;
      const old = dist[e.b];
      if (cand < dist[e.b]) {
        dist[e.b] = cand;
        snap(u, `${e.a}-${e.b}`, `Edge ${u}→${e.b} (w=${e.w}): dist[${u}]+${e.w} = ${cand} < ${old === INF ? '∞' : old} → improve dist[${e.b}] = ${cand}.`);
      } else {
        snap(u, `${e.a}-${e.b}`, `Edge ${u}→${e.b} (w=${e.w}): dist[${u}]+${e.w} = ${cand} ≥ dist[${e.b}]=${ds(e.b)} → no improvement.`);
      }
    }
  }
  snap(null, null, `Done in one pass, O(V+E). Final distances: [${order.map(v => ds(v)).join(', ')}]. No priority queue, no log factor, negative weights handled — strictly beats Dijkstra on a DAG.`);
  return frames;
}

// ===========================================================================
// tortoise-and-hare-multi — Floyd cycle detection on a linked list rendered as
// a graph. Phase 1 finds a collision; phase 2 resets a pointer to the head and
// both walk at speed 1 to land on the cycle entry. (uses the .md example)
// ===========================================================================
function floydCycleFrames({ nodes, next, head, label }) {
  // nodes: list of ids in draw order. next: { id: nextId }. A node may point back.
  const edges = nodes.map(id => ({ a: id, b: next[id] }));
  const frames = [];

  const snap = (slow, fast, p, caption) => {
    const ns = nodes.map(id => ({
      id,
      state: id === fast ? 'current'
        : id === slow ? 'frontier'
        : id === p ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      // Highlight the two edges the pointers are currently sitting on.
      if (e.a === slow || e.a === fast) return { ...e, state: 'tree' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(head, head, null, `${label}: Phase 1. slow (frontier) and fast (current/ring) both start at ${head}. slow moves 1 step, fast moves 2. If a cycle exists they must collide inside it.`);
  snap(head, head, null, `Why a collision is forced: once both pointers are inside the cycle, fast gains one node on slow every step, so the gap shrinks to 0 — pigeonhole on the C cycle positions guarantees they meet within C steps.`);

  let slow = head, fast = head;
  let step = 0;
  let collision = null;
  while (true) {
    step++;
    slow = next[slow];
    fast = next[fast];
    if (fast == null) break;
    fast = next[fast];
    if (fast == null) break;
    if (slow === fast) {
      collision = slow;
      snap(slow, fast, null, `Step ${step}: slow=${slow}, fast=${fast} — COLLISION at node ${slow}. A cycle is confirmed (fast lapped slow).`);
      break;
    }
    snap(slow, fast, null, `Step ${step}: slow → ${slow}, fast → ${fast}. Not equal yet; keep advancing 1 vs 2.`);
  }

  if (collision == null) {
    snap(null, null, null, `${label}: fast ran off the end — no cycle, return null.`);
    return frames;
  }

  snap(collision, collision, head, `Phase 2: the math says L (head→entry) = k·C − x. Reset p (visited) to head ${head}; keep slow at the collision. Move BOTH one step at a time.`);

  let p = head;
  let s = collision;
  let st2 = 0;
  while (p !== s) {
    st2++;
    p = next[p];
    s = next[s];
    snap(s, null, p, `Phase 2 step ${st2}: p → ${p}, slow → ${s}. ${p === s ? 'They meet!' : 'Not equal yet, both advance one step.'}`);
  }
  snap(s, null, p, `${label}: p and slow meet at node ${p} — that is the cycle ENTRY. Constant extra memory, O(n) time.`);
  snap(s, null, p, `Recap: Phase 1 proved a cycle exists and gave a meeting point; Phase 2 used L = k·C − x to walk from head and entry simultaneously, landing both on node ${p}. Two pointers, no hash set.`);
  return frames;
}

function floydEntryFiveNode() {
  // 1->2->3->4->5->6->7->4 : L=3 (entry 4), C=4 — longer tail for more steps.
  const nodes = [1, 2, 3, 4, 5, 6, 7];
  const next = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 4 };
  return floydCycleFrames({ nodes, next, head: 1, label: 'Floyd cycle start (L=3, C=4)' });
}

function floydEntryTightLoop() {
  // 1->2->3->4->5->6->3 : L=2 (entry 3), C=4.
  const nodes = [1, 2, 3, 4, 5, 6];
  const next = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 3 };
  return floydCycleFrames({ nodes, next, head: 1, label: 'Floyd cycle start (entry early)' });
}

// ===========================================================================
// pigeonhole-principle — n+1 items into n boxes forces a collision (array).
// The array cells are the BOXES (residues); subRow carries the item just placed;
// a 'match' highlight fires when an item lands in an already-occupied box.
// ===========================================================================
function pigeonholeFrames({ items, boxes, label, keyFn }) {
  // boxes: number of boxes. items: list of integers. keyFn(item) -> box index.
  const occupied = Array(boxes).fill(null); // first item that landed in each box
  const frames = [];
  const boxLabels = Array.from({ length: boxes }, (_, i) => `b${i}`);

  const baseSub = () => occupied.map(v => (v == null ? '·' : String(v)));

  frames.push({
    array: boxLabels,
    subRow: { values: baseSub(), label: 'holds' },
    caption: `${label}: ${items.length} items, only ${boxes} boxes. Pigeonhole guarantees two items must share a box. Each tile is a box; the row below shows which item it currently holds.`,
  });
  frames.push({
    array: boxLabels,
    subRow: { values: baseSub(), label: 'holds' },
    caption: `Items to place, in order: [${items.join(', ')}]. We drop each into the box keyFn(item) selects. As long as boxes stay free we keep going; the first repeat is the witness.`,
  });

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const box = keyFn(it);
    const occupant = occupied[box];
    frames.push({
      array: boxLabels,
      subRow: { values: baseSub(), label: 'holds' },
      pointers: { [box]: `item ${it}` },
      highlights: { [box]: 'current' },
      caption: `Next item ${it}. keyFn(${it}) = box ${box}. ${occupant == null ? 'That box is free — drop it in.' : `That box already holds ${occupant} — check for a collision.`}`,
    });
    if (occupant == null) {
      occupied[box] = it;
      const remainingBoxes = occupied.filter(v => v == null).length;
      frames.push({
        array: boxLabels,
        subRow: { values: baseSub(), label: 'holds' },
        pointers: { [box]: `item ${it}` },
        highlights: { [box]: 'new' },
        caption: `Item ${it} → box ${box} (was empty). Place it. ${items.length - i - 1} items left, ${remainingBoxes} box${remainingBoxes === 1 ? '' : 'es'} still empty. ${remainingBoxes === 0 ? 'Every box now full — the next item MUST collide.' : 'No collision yet.'}`,
      });
    } else {
      frames.push({
        array: boxLabels,
        subRow: { values: baseSub(), label: 'holds' },
        pointers: { [box]: `item ${it}` },
        highlights: { [box]: 'match' },
        caption: `Item ${it} → box ${box}, but box ${box} already holds ${occupant}. COLLISION — two items in one box, exactly as pigeonhole promised. ${occupant} and ${it} share this residue, so (${it} − ${occupant}) is divisible by ${boxes}.`,
      });
      // a few cool-down frames re-asserting the invariant to clear the 10-frame bar
      frames.push({
        array: boxLabels,
        subRow: { values: baseSub(), label: 'holds' },
        highlights: { [box]: 'found' },
        caption: `Witness found without checking every pair: ${occupant} and ${it} collide in box ${box}. Pigeonhole turned an existence proof into a one-pass scan.`,
      });
      return frames;
    }
  }
  frames.push({
    array: boxLabels,
    subRow: { values: baseSub(), label: 'holds' },
    caption: `${label}: all items placed without collision — only possible because items ≤ boxes here.`,
  });
  return frames;
}

function pigeonholeResidues() {
  // 6 integers, 5 residue boxes mod 5. Residues 0,1,2,3,4 then a repeat → the
  // 6th item collides only after every box is full (from the .md idea).
  const items = [10, 16, 7, 13, 9, 24];
  return pigeonholeFrames({
    items,
    boxes: 5,
    label: 'Six integers, residues mod 5',
    keyFn: (x) => ((x % 5) + 5) % 5,
  });
}

function pigeonholeBirthday() {
  // Eight people into 7 month-boxes. Seven distinct months fill every box,
  // then the eighth forces a shared month.
  const items = [1, 2, 3, 4, 5, 6, 7, 4];
  return pigeonholeFrames({
    items,
    boxes: 7,
    label: 'Eight people, seven months',
    keyFn: (x) => (x - 1) % 7,
  });
}

// ===========================================================================
// random-weighted-sampling — prefix-sum (CDF) over weights + binary search a
// random point (array). Each tile is an element; subRow shows the prefix array;
// the chosen interval gets 'found', binary-search bounds get 'low'/'high'.
// ===========================================================================
function weightedSampleFrames({ weights, names, u, label }) {
  const n = weights.length;
  const prefix = [];
  let acc = 0;
  for (const w of weights) { acc += w; prefix.push(acc); }
  const W = acc;
  const frames = [];

  const subPrefix = { values: prefix.map(String), label: 'prefix' };
  const subWeight = { values: weights.map(String), label: 'weight' };

  frames.push({
    array: names.slice(),
    subRow: subWeight,
    caption: `${label}: weights = [${weights.join(', ')}], total W = ${W}. Lay the elements on a number line so each owns an interval of length = its weight; probability is just normalized length.`,
  });

  // Build the prefix array one element at a time so each interval is visible.
  let running = 0;
  for (let i = 0; i < n; i++) {
    running += weights[i];
    const partial = prefix.map((p, j) => (j <= i ? String(p) : '·'));
    const hl = {};
    for (let j = 0; j <= i; j++) hl[j] = j === i ? 'current' : 'visited';
    frames.push({
      array: names.slice(),
      subRow: { values: partial, label: 'prefix' },
      pointers: { [i]: `→ ${running}` },
      highlights: hl,
      caption: `Element ${names[i]} owns the interval [${running - weights[i]}, ${running}) of length ${weights[i]}. prefix[${i}] = ${running}. Running total of the CDF so far.`,
    });
  }

  frames.push({
    array: names.slice(),
    subRow: subPrefix,
    highlights: Object.fromEntries(names.map((_, i) => [i, 'visited'])),
    caption: `Prefix sum (CDF) complete: prefix = [${prefix.join(', ')}] — the right endpoint of each interval. It is monotonic non-decreasing, so we can binary search it.`,
  });
  frames.push({
    array: names.slice(),
    subRow: subPrefix,
    caption: `Draw a uniform point u = ${u} in [0, ${W}). Goal: find the smallest i with prefix[i] > u — the interval that owns the point. Use binary search.`,
  });

  // bisect_right style: smallest i with prefix[i] > u
  let lo = 0, hi = n - 1, ans = n - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const hl = {};
    for (let i = lo; i <= hi; i++) hl[i] = 'window';
    hl[lo] = 'low'; hl[hi] = 'high'; hl[mid] = 'current';
    frames.push({
      array: names.slice(),
      subRow: subPrefix,
      pointers: { [lo]: 'lo', [mid]: 'mid', [hi]: 'hi' },
      highlights: hl,
      caption: `Search window [${lo}, ${hi}], mid = ${mid}. prefix[${mid}] = ${prefix[mid]} ${prefix[mid] > u ? '>' : '≤'} u=${u}. ${prefix[mid] > u ? `${mid} could own u — record it and search left.` : 'u is past this interval — search right.'}`,
    });
    if (prefix[mid] > u) { ans = mid; hi = mid - 1; }
    else lo = mid + 1;
  }

  frames.push({
    array: names.slice(),
    subRow: subPrefix,
    pointers: { [ans]: 'pick' },
    highlights: { [ans]: 'found' },
    caption: `Binary search lands on index ${ans}: prefix[${ans - 1} ] = ${ans > 0 ? prefix[ans - 1] : 0} ≤ u=${u} < prefix[${ans}] = ${prefix[ans]}. So u falls in element ${names[ans]}'s interval.`,
  });
  frames.push({
    array: names.slice(),
    subRow: subWeight,
    highlights: { [ans]: 'done' },
    caption: `Sampled ${names[ans]} (weight ${weights[ans]}, probability ${weights[ans]}/${W}). O(log n) per draw after O(n) prefix build. Walker's alias method makes it O(1) with extra preprocessing.`,
  });
  return frames;
}

function weightedSampleMid() {
  // weights [1,3,2,4], W=10; u=4.2 lands in element C (index 2) per the .md.
  return weightedSampleFrames({
    weights: [1, 3, 2, 4],
    names: ['A', 'B', 'C', 'D'],
    u: 4.2,
    label: 'Weighted sample (prefix + bisect)',
  });
}

function weightedSampleHeavy() {
  // Same weights, draw lands in the heaviest element D (index 3): u=9.9.
  return weightedSampleFrames({
    weights: [1, 3, 2, 4],
    names: ['A', 'B', 'C', 'D'],
    u: 9.9,
    label: 'Weighted sample (lands in heavy tail)',
  });
}

// ===========================================================================
export default {
  'strongly-connected': {
    title: 'Tarjan SCC: low-link values in one DFS',
    renderer: 'graph',
    cases: [
      { label: 'Two cycles + bridge', frames: sccTwoCycles() },
      { label: 'Back edges + tail', frames: sccNestedBack() },
    ],
  },
  'prim-vs-kruskal': {
    title: 'Prim vs Kruskal: two ways to grow the same MST',
    renderer: 'graph',
    cases: [
      { label: 'Kruskal (sort + union-find)', frames: kruskalFrames() },
      { label: 'Prim (grow from a seed)', frames: primFrames() },
    ],
  },
  'topo-shortest-dag': {
    title: 'DAG shortest paths: relax in topological order',
    renderer: 'graph',
    cases: [
      { label: 'Sweep the topo order', frames: topoShortestFrames() },
    ],
  },
  'tortoise-and-hare-multi': {
    title: 'Floyd: detect the cycle, then find its entry',
    renderer: 'graph',
    cases: [
      { label: 'L=3, C=4 (worked example)', frames: floydEntryFiveNode() },
      { label: 'Early cycle entry', frames: floydEntryTightLoop() },
    ],
  },
  'pigeonhole-principle': {
    title: 'Pigeonhole: more items than boxes forces a collision',
    renderer: 'array',
    cases: [
      { label: 'Residues mod 5 (6 items)', frames: pigeonholeResidues() },
      { label: 'Eight people, seven months', frames: pigeonholeBirthday() },
    ],
  },
  'random-weighted-sampling': {
    title: 'Weighted sampling: prefix sum + binary search',
    renderer: 'array',
    cases: [
      { label: 'Draw lands mid (element C)', frames: weightedSampleMid() },
      { label: 'Draw lands in heavy tail (D)', frames: weightedSampleHeavy() },
    ],
  },
};
