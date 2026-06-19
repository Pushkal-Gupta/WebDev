// Interactive viz for advanced-algorithm concepts (batch B).
// Two renderer shapes are used, one per concept:
//   array renderer (misra-gries, master-theorem):
//     frame = { array: (string|number)[], subRow?: { values, label },
//               highlights?: { [i]: role }, pointers?: { [i]: string }, caption }
//     valid tile roles: current | visited | done | frontier | compared | tree |
//                       pivot | match | new | found | key | left | right | low | high
//   graph renderer (mo-on-trees, mst-rerooting, network-bridge-finding):
//     frame = { nodes: [{ id, label, state? }], edges: [{ a, b, w?, state? }], caption }
//     valid node states: current | frontier | visited | done
//     valid edge states: current | frontier | tree | visited | rejected
// All helpers are self-contained pure JS — no imports from conceptVisualizations.js.

// ===========================================================================
// misra-gries — k-1 counter heavy hitters over a stream (array renderer).
// The array is the input stream; the active element is 'current', already-read
// elements are 'visited'. A subRow narrates the running counter slots so the
// reader sees the cancellation bookkeeping cell-by-cell.
// ===========================================================================
function misraGriesFrames({ stream, k, label }) {
  const frames = [];
  const slots = new Map();

  const slotText = () => {
    if (slots.size === 0) return '(empty)';
    return [...slots.entries()].map(([key, c]) => `${key}:${c}`).join('  ');
  };
  const snap = (i, role, caption) => {
    const highlights = {};
    for (let j = 0; j < stream.length; j++) {
      if (j === i) highlights[j] = role;
      else if (i === null || j < i) highlights[j] = 'visited';
    }
    frames.push({
      array: stream.slice(),
      subRow: { values: stream.map(() => ''), label: `slots (k-1=${k - 1}): ${slotText()}` },
      highlights,
      pointers: i === null || i === undefined ? {} : { [i]: 'x' },
      caption,
    });
  };

  snap(undefined, undefined,
    `${label}: scan the stream once keeping at most k-1 = ${k - 1} (item, count) slots. An item over n/${k} of the stream must survive the cancellations.`);

  for (let i = 0; i < stream.length; i++) {
    const x = stream[i];
    if (slots.has(x)) {
      slots.set(x, slots.get(x) + 1);
      snap(i, 'match', `Read ${x} at index ${i}: it already holds a slot, so increment its count. slots = { ${slotText()} }.`);
    } else if (slots.size < k - 1) {
      slots.set(x, 1);
      snap(i, 'new', `Read ${x} at index ${i}: a slot is free, so claim it with count 1. slots = { ${slotText()} }.`);
    } else {
      snap(i, 'pivot', `Read ${x} at index ${i}: every slot is full and none match ${x}. Decrement ALL counts by 1 (a k-way cancellation) and drop any that hit zero.`);
      const drop = [];
      for (const key of slots.keys()) {
        slots.set(key, slots.get(key) - 1);
        if (slots.get(key) === 0) drop.push(key);
      }
      for (const key of drop) slots.delete(key);
      snap(i, 'pivot', `After cancelling: slots = { ${slotText() || '(empty)'} }. ${x} itself is discarded this round — it never gets a slot.`);
    }
  }

  snap(null, undefined,
    `${label}: surviving keys { ${[...slots.keys()].join(', ') || '(none)'} } are the candidates for > n/${k} occurrences. A second pass over the stream verifies their true counts and removes false positives.`);
  return frames;
}

function misraGriesK3() {
  return misraGriesFrames({ stream: [1, 2, 1, 3, 1, 4, 2, 1, 5, 1], k: 3, label: 'Misra-Gries (k=3)' });
}

function misraGriesK2() {
  // k=2 collapses to Boyer-Moore majority: a single slot.
  return misraGriesFrames({ stream: [3, 3, 4, 2, 3, 3, 3, 1, 3], k: 2, label: 'Boyer-Moore (k=2)' });
}

function misraGriesNoMajority() {
  return misraGriesFrames({ stream: [1, 2, 3, 4, 1, 2, 3, 4], k: 3, label: 'Misra-Gries (no heavy hitter)' });
}

// ===========================================================================
// master-theorem — recursion-tree cost per level (array renderer).
// Each tile is one level of the recursion tree; the value is the total work
// Θ(n^k)·(a/b^k)^level at that level. We compare the per-level cost against the
// leaf cost n^{log_b a} and highlight which level (root vs leaves vs all) wins.
// ===========================================================================
function masterFrames({ a, b, c, name, label }) {
  // f(n) = Θ(n^c). nLog = log_b a. ratio = a / b^c decides which level dominates.
  const nLog = Math.log(a) / Math.log(b);
  const ratio = a / Math.pow(b, c);
  const levels = 6;
  const frames = [];

  // Work at level i (relative to root cost = 1) is ratio^i.
  const rel = [];
  for (let i = 0; i < levels; i++) rel.push(Math.pow(ratio, i));
  const fmt = (x) => (x >= 100 || x <= 0.01 ? x.toExponential(1) : x.toFixed(2));
  const cells = rel.map((r, i) => `L${i}\n${fmt(r)}`);

  const caseNum = c < nLog - 1e-9 ? 1 : c > nLog + 1e-9 ? 3 : 2;
  const result =
    caseNum === 1 ? `Θ(n^${nLog.toFixed(3)})`
      : caseNum === 2 ? `Θ(n^${nLog.toFixed(3)} · log n)`
        : `Θ(n^${c})`;

  frames.push({
    array: cells,
    caption: `${label}: recurrence T(n) = ${a}·T(n/${b}) + f(n) with f(n) = Θ(n^${c}). Each tile is one level of the recursion tree; the number is that level's total work relative to the root (= 1).`,
  });
  frames.push({
    array: cells,
    subRow: { values: cells.map(() => ''), label: `log_b a = log_${b}(${a}) = ${nLog.toFixed(3)} (the leaf-cost exponent)` },
    caption: `Compute n^{log_b a}: split into a = ${a} subproblems of size n/${b}, so the leaf count grows as n^${nLog.toFixed(3)}. Compare f(n)'s exponent c = ${c} against ${nLog.toFixed(3)}.`,
  });

  // Per-level walk highlighting how cost changes.
  for (let i = 0; i < levels; i++) {
    const hl = {};
    for (let j = 0; j < levels; j++) {
      if (j < i) hl[j] = 'visited';
      else if (j === i) hl[j] = 'current';
    }
    const dir = ratio > 1.0001 ? 'grows toward the leaves' : ratio < 0.9999 ? 'shrinks toward the leaves' : 'stays constant across levels';
    frames.push({
      array: cells,
      subRow: { values: cells.map(() => ''), label: `a/b^c = ${a}/${b}^${c} = ${ratio.toFixed(3)} ⇒ work ${dir}` },
      highlights: hl,
      pointers: { [i]: `L${i}` },
      caption: `Level ${i}: there are ${a}^${i} subproblems each of size n/${b}^${i}, contributing ${fmt(rel[i])}× the root work. The geometric ratio per level is a/b^c = ${ratio.toFixed(3)}.`,
    });
  }

  // Cumulative cost across the levels — the geometric series that decides the case.
  const total = rel.reduce((s, r) => s + r, 0);
  frames.push({
    array: cells,
    subRow: { values: cells.map(() => ''), label: `Σ level work = ${fmt(total)}× root (geometric, ratio ${ratio.toFixed(3)})` },
    highlights: Object.fromEntries(cells.map((_, j) => [j, 'compared'])),
    caption: `Sum the per-level costs: a geometric series with ratio ${ratio.toFixed(3)}. ${ratio > 1.0001 ? 'Ratio > 1 ⇒ the last (leaf) term dominates the sum.' : ratio < 0.9999 ? 'Ratio < 1 ⇒ the first (root) term dominates the sum.' : 'Ratio = 1 ⇒ all log n terms are equal, so the sum is (n^log_b a)·log n.'}`,
  });

  // Highlight the dominating level set.
  const finalHl = {};
  if (caseNum === 1) {
    for (let j = 0; j < levels; j++) finalHl[j] = j === levels - 1 ? 'found' : 'visited';
  } else if (caseNum === 3) {
    for (let j = 0; j < levels; j++) finalHl[j] = j === 0 ? 'found' : 'visited';
  } else {
    for (let j = 0; j < levels; j++) finalHl[j] = 'found';
  }
  const where =
    caseNum === 1 ? 'the leaves dominate (work piles up at the bottom) — Case 1'
      : caseNum === 3 ? 'the root dominates (combine work dwarfs the subproblems) — Case 3'
        : 'every level contributes equally, so the log n levels each add n^{log_b a} — Case 2';
  frames.push({
    array: cells,
    subRow: { values: cells.map(() => ''), label: `c = ${c} vs log_b a = ${nLog.toFixed(3)} ⇒ Case ${caseNum}` },
    highlights: finalHl,
    caption: `${name}: since c ${caseNum === 1 ? '<' : caseNum === 3 ? '>' : '='} log_b a, ${where}. Total ⇒ ${result}.`,
  });
  return frames;
}

function masterMergeSort() {
  return masterFrames({ a: 2, b: 2, c: 1, name: 'Merge sort', label: 'Master Theorem · merge sort' });
}

function masterKaratsuba() {
  return masterFrames({ a: 3, b: 2, c: 1, name: 'Karatsuba multiplication', label: 'Master Theorem · Karatsuba' });
}

function masterRootDominates() {
  // a=2, b=2, c=2: f(n)=n^2 dominates -> Case 3, Θ(n^2).
  return masterFrames({ a: 2, b: 2, c: 2, name: 'Combine-heavy divide & conquer', label: 'Master Theorem · Case 3' });
}

// ===========================================================================
// Graph helpers (mo-on-trees, mst-rerooting, network-bridge-finding).
// ===========================================================================

// ---------------------------------------------------------------------------
// network-bridge-finding — Tarjan low-link DFS (graph renderer).
// Walk the DFS tree marking disc/low; an edge (u,v) is a bridge iff low[v]>disc[u].
// Bridge edges end as 'rejected' (the brittle single-points-of-failure); the
// DFS-tree edges that survive in a cycle end as 'tree'.
// ---------------------------------------------------------------------------
function bridgeFrames({ nodes, edges, label }) {
  const n = nodes.length;
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  for (const k in adj) adj[k].sort((x, y) => x - y);

  const disc = new Array(n).fill(0);
  const low = new Array(n).fill(0);
  const visited = new Array(n).fill(false);
  const treeEdges = new Set();
  const bridges = new Set();
  let timer = 1;
  const frames = [];

  const ek = (x, y) => `${Math.min(x, y)}-${Math.max(x, y)}`;
  const snap = (cur, caption) => {
    const ns = nodes.map(node => ({
      id: node.id,
      label: visited[node.id] ? `${node.id}\nd${disc[node.id]} l${low[node.id]}` : String(node.id),
      state: node.id === cur ? 'current'
        : visited[node.id] ? 'visited'
          : undefined,
    }));
    const es = edges.map(e => {
      const key = ek(e.a, e.b);
      if (bridges.has(key)) return { ...e, state: 'rejected' };
      if (treeEdges.has(key)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(undefined, `${label}: a bridge is an edge whose removal splits the graph. Run one DFS, tracking disc[v] (visit order) and low[v] (highest ancestor reachable from v's subtree).`);

  const dfs = (u, parent) => {
    visited[u] = true;
    disc[u] = low[u] = timer++;
    snap(u, `Visit ${u}: stamp disc[${u}] = low[${u}] = ${disc[u]}. low starts at disc and only ever drops via back edges.`);
    for (const v of adj[u]) {
      if (v === parent) continue;
      if (visited[v]) {
        const before = low[u];
        low[u] = Math.min(low[u], disc[v]);
        snap(u, `Back edge ${u}–${v}: ${v} is an already-visited ancestor (disc ${disc[v]}). Pull low[${u}] down to min(${before}, ${disc[v]}) = ${low[u]} — an escape route around ${u}.`);
      } else {
        treeEdges.add(ek(u, v));
        snap(u, `Tree edge ${u}→${v}: ${v} is unvisited, so descend into it. This edge is part of the DFS tree.`);
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) {
          bridges.add(ek(u, v));
          snap(u, `Back at ${u}: low[${v}] = ${low[v]} > disc[${u}] = ${disc[u]}. Nothing in ${v}'s subtree climbs past ${u}, so edge ${u}–${v} is a BRIDGE — cutting it isolates ${v}'s subtree.`);
        } else {
          snap(u, `Back at ${u}: low[${v}] = ${low[v]} ≤ disc[${u}] = ${disc[u]}. ${v}'s subtree has a back edge around ${u}, so edge ${u}–${v} is safe (not a bridge). low[${u}] = ${low[u]}.`);
        }
      }
    }
  };

  for (let i = 0; i < n; i++) if (!visited[i]) dfs(i, -1);

  snap(null, `${label}: red edges are bridges (single points of failure); blue edges sit inside a cycle, so an alternate path survives their removal.`);
  return frames;
}

function bridgeChainCycle() {
  // 0-1-2-3 chain, with 3-4-5-3 forming a triangle at the end.
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 4, b: 5 }, { a: 5, b: 3 },
  ];
  return bridgeFrames({ nodes, edges, label: 'Bridges · chain + triangle' });
}

function bridgeTwoCycles() {
  // Two triangles joined by a single bridge edge 2-3.
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 4, b: 5 }, { a: 5, b: 3 },
  ];
  return bridgeFrames({ nodes, edges, label: 'Bridges · two cycles' });
}

// ---------------------------------------------------------------------------
// mst-rerooting — rerooting DP for sum-of-distances (graph renderer).
// Phase 1: post-order fills down[v] (subtree distance sum) bottom-up. Phase 2:
// pre-order slides the root across each edge, adjusting the answer in O(1).
// Node labels carry the running answer; the active edge is 'current'.
// ---------------------------------------------------------------------------
function rerootFrames({ nodes, edges, root, label }) {
  const n = nodes.length;
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  for (const k in adj) adj[k].sort((x, y) => x - y);

  const size = new Array(n).fill(1);
  const down = new Array(n).fill(0);
  const ans = new Array(n).fill(null);
  const frames = [];
  const ek = (x, y) => `${Math.min(x, y)}-${Math.max(x, y)}`;

  const snap = (cur, activeEdge, caption, doneSet) => {
    const ns = nodes.map(node => ({
      id: node.id,
      label: ans[node.id] != null ? `${node.id}\nans=${ans[node.id]}` : String(node.id),
      state: node.id === cur ? 'current'
        : doneSet && doneSet.has(node.id) ? 'done'
          : ans[node.id] != null ? 'visited'
            : undefined,
    }));
    const es = edges.map(e => {
      if (activeEdge && ek(e.a, e.b) === activeEdge) return { ...e, state: 'current' };
      return { ...e, state: 'tree' };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(undefined, null, `${label}: report the sum of distances from EVERY node to all others. Naively that is O(n²); rerooting does all n answers in O(n) with two passes.`);

  // Phase 1: post-order DFS for size + down.
  const order = [];
  const seen = new Array(n).fill(false);
  const stack = [[root, -1, 0]];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const [v, p, idx] = top;
    if (idx === 0) seen[v] = true;
    const kids = (adj[v] || []).filter(w => w !== p);
    if (idx < kids.length) {
      top[2] += 1;
      stack.push([kids[idx], v, 0]);
    } else {
      order.push([v, p]);
      stack.pop();
    }
  }
  for (const [v, p] of order) {
    if (p !== -1) { size[p] += size[v]; down[p] += down[v] + size[v]; }
    frames.push({
      nodes: nodes.map(node => ({
        id: node.id,
        label: `${node.id}\nd${down[node.id]} s${size[node.id]}`,
        state: node.id === v ? 'current' : seen[node.id] ? 'visited' : undefined,
      })),
      edges: edges.map(e => ({ ...e, state: 'tree' })),
      caption: `Phase 1 (post-order from root ${root}): finalize node ${v} — subtree size = ${size[v]}, down[${v}] = ${down[v]} (sum of distances within ${v}'s subtree).`,
    });
  }

  ans[root] = down[root];
  snap(root, null, `Root ${root}'s global answer is just down[${root}] = ${down[root]} — nothing sits "above" the root. Now Phase 2 slides the root outward edge by edge.`);

  // Phase 2: pre-order BFS sliding the root.
  const done = new Set([root]);
  const q = [root];
  while (q.length) {
    const v = q.shift();
    for (const c of (adj[v] || [])) {
      if (ans[c] != null) continue;
      ans[c] = ans[v] - size[c] + (n - size[c]);
      snap(c, ek(v, c),
        `Reroot across edge ${v}→${c}: ${size[c]} nodes in ${c}'s subtree move one step closer (−${size[c]}), the other ${n - size[c]} move one farther (+${n - size[c]}). ans[${c}] = ${ans[v]} − ${size[c]} + ${n - size[c]} = ${ans[c]}.`,
        done);
      done.add(c);
      q.push(c);
    }
  }

  snap(null, null, `${label}: every node now carries its sum-of-distances answer in O(n) total. Each adjacent pair of roots differed by only the single flipped edge — that is the rerooting payoff.`);
  return frames;
}

function rerootPath() {
  // Path 0-1-2-3-4: symmetric answers [10,7,6,7,10] mirror the lesson example.
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 }];
  return rerootFrames({ nodes, edges, root: 0, label: 'Rerooting · path graph' });
}

function rerootStar() {
  // Star: center 0 with leaves 1..4, plus one leaf extended.
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [{ a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 }, { a: 3, b: 4 }];
  return rerootFrames({ nodes, edges, root: 0, label: 'Rerooting · branching tree' });
}

// ---------------------------------------------------------------------------
// mo-on-trees — Euler tour flattening + Mo's pointer shifts (graph renderer).
// Phase A walks the tree pre/post order assigning Euler positions (node label
// carries in/out). Phase B shows two example path queries mapping to a tour
// subrange; the path edges light up as 'current'. Caption narrates the L/R
// pointer ordering and the LCA add-back.
// ---------------------------------------------------------------------------
function moTreeFrames({ nodes, edges, root, queries, label }) {
  const n = nodes.length;
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  for (const k in adj) adj[k].sort((x, y) => x - y);

  const inPos = new Array(n).fill(-1);
  const outPos = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  const depth = new Array(n).fill(0);
  const tour = [];
  const frames = [];
  const ek = (x, y) => `${Math.min(x, y)}-${Math.max(x, y)}`;

  const baseEdges = () => edges.map(e => ({ ...e, state: 'tree' }));
  const labelOf = (id) => (inPos[id] >= 0 ? `${id}\n[${inPos[id]},${outPos[id]}]` : String(id));

  frames.push({
    nodes: nodes.map(node => ({ id: node.id, label: String(node.id), state: node.id === root ? 'current' : undefined })),
    edges: baseEdges(),
    caption: `${label}: lift Mo's algorithm from arrays to tree paths. First flatten the tree with an Euler tour so every path (u,v) maps to a contiguous tour range.`,
  });

  // Iterative pre/post Euler walk.
  const stack = [[root, -1, 0]];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const [v, p, idx] = top;
    if (idx === 0) {
      parent[v] = p;
      inPos[v] = tour.length; tour.push(v);
      frames.push({
        nodes: nodes.map(node => ({ id: node.id, label: labelOf(node.id), state: node.id === v ? 'current' : inPos[node.id] >= 0 ? 'visited' : undefined })),
        edges: baseEdges(),
        caption: `Enter ${v}: assign in[${v}] = ${inPos[v]} (Euler position ${inPos[v]}). The tour records each node once on entry and once on exit.`,
      });
    }
    const kids = (adj[v] || []).filter(w => w !== p);
    if (idx < kids.length) {
      top[2] += 1;
      depth[kids[idx]] = depth[v] + 1;
      stack.push([kids[idx], v, 0]);
    } else {
      outPos[v] = tour.length; tour.push(v);
      stack.pop();
      frames.push({
        nodes: nodes.map(node => ({ id: node.id, label: labelOf(node.id), state: node.id === v ? 'current' : 'visited' })),
        edges: baseEdges(),
        caption: `Exit ${v}: assign out[${v}] = ${outPos[v]}. Subtree of ${v} occupies tour positions [in,out] = [${inPos[v]}, ${outPos[v]}].`,
      });
    }
  }

  const lca = (u, v) => {
    while (depth[u] > depth[v]) u = parent[u];
    while (depth[v] > depth[u]) v = parent[v];
    while (u !== v) { u = parent[u]; v = parent[v]; }
    return u;
  };
  const pathNodes = (u, v) => {
    const a = lca(u, v);
    const up = (x) => { const s = []; while (x !== a) { s.push(x); x = parent[x]; } return s; };
    return [...up(u), a, ...up(v).reverse()];
  };

  for (const [u, v] of queries) {
    const w = lca(u, v);
    const pn = new Set(pathNodes(u, v));
    const isAnc = (w === u || w === v);
    const pathEdgeSet = new Set();
    const arr = pathNodes(u, v);
    for (let i = 0; i + 1 < arr.length; i++) pathEdgeSet.add(ek(arr[i], arr[i + 1]));

    frames.push({
      nodes: nodes.map(node => ({
        id: node.id,
        label: labelOf(node.id),
        state: node.id === w ? 'current' : pn.has(node.id) ? 'frontier' : 'visited',
      })),
      edges: edges.map(e => pathEdgeSet.has(ek(e.a, e.b)) ? { ...e, state: 'current' } : { ...e, state: 'tree' }),
      caption: `Query path (${u}, ${v}): LCA = ${w}. ${isAnc ? `${w} is an ancestor, so use tour range [in[${w === u ? u : v}] .. in[${w === u ? v : u}]].` : `Neither endpoint is the ancestor, so use range [out[${inPos[u] <= inPos[v] ? u : v}] .. in[${inPos[u] <= inPos[v] ? v : u}]] and add the LCA ${w} separately.`}`,
    });
    frames.push({
      nodes: nodes.map(node => ({
        id: node.id,
        label: labelOf(node.id),
        state: pn.has(node.id) ? 'done' : 'visited',
      })),
      edges: edges.map(e => pathEdgeSet.has(ek(e.a, e.b)) ? { ...e, state: 'current' } : { ...e, state: 'tree' }),
      caption: `Inside that range, a node visited twice (enter + exit) toggles off via XOR, leaving exactly the path's nodes: { ${arr.join(', ')} }. Mo's L/R pointers shift over the tour to reuse work between sorted queries.`,
    });
  }

  frames.push({
    nodes: nodes.map(node => ({ id: node.id, label: labelOf(node.id), state: 'visited' })),
    edges: baseEdges(),
    caption: `${label}: with queries sorted by (block of L, R) using block size ≈ sqrt(2N), the two pointers travel O((N+Q)·sqrt N) total — the offline path-query bound.`,
  });
  return frames;
}

function moTreeSmall() {
  // Root 0; children 1,2; 1 has children 3,4. Mirrors the lesson's tree.
  const nodes = [0, 1, 2, 3, 4].map(i => ({ id: i }));
  const edges = [{ a: 0, b: 1 }, { a: 0, b: 2 }, { a: 1, b: 3 }, { a: 1, b: 4 }];
  return moTreeFrames({ nodes, edges, root: 0, queries: [[3, 4], [3, 2]], label: "Mo's on trees · 5-node" });
}

function moTreeChain() {
  // A deeper tree to show the ancestor case clearly.
  const nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i }));
  const edges = [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 1, b: 3 }, { a: 3, b: 4 }, { a: 3, b: 5 }];
  return moTreeFrames({ nodes, edges, root: 0, queries: [[2, 5], [0, 4]], label: "Mo's on trees · 6-node" });
}

export default {
  'misra-gries': {
    title: 'Misra-Gries Heavy Hitters',
    renderer: 'array',
    cases: [
      { label: 'k = 3 (one heavy hitter)', frames: misraGriesK3() },
      { label: 'k = 2 (Boyer-Moore majority)', frames: misraGriesK2() },
      { label: 'No element over n/3', frames: misraGriesNoMajority() },
    ],
  },
  'master-theorem': {
    title: 'Master Theorem Recursion Tree',
    renderer: 'array',
    cases: [
      { label: 'Merge sort (Case 2)', frames: masterMergeSort() },
      { label: 'Karatsuba (Case 1, leaves)', frames: masterKaratsuba() },
      { label: 'Combine-heavy (Case 3, root)', frames: masterRootDominates() },
    ],
  },
  'network-bridge-finding': {
    title: 'Tarjan Bridge Finding',
    renderer: 'graph',
    cases: [
      { label: 'Chain + triangle', frames: bridgeChainCycle() },
      { label: 'Two cycles, one bridge', frames: bridgeTwoCycles() },
    ],
  },
  'mst-rerooting': {
    title: 'Rerooting DP (Sum of Distances)',
    renderer: 'graph',
    cases: [
      { label: 'Path graph (symmetric)', frames: rerootPath() },
      { label: 'Branching tree', frames: rerootStar() },
    ],
  },
  'mo-on-trees': {
    title: "Mo's Algorithm on Trees",
    renderer: 'graph',
    cases: [
      { label: '5-node tree', frames: moTreeSmall() },
      { label: '6-node tree', frames: moTreeChain() },
    ],
  },
};
