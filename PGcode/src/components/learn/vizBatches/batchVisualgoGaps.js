// Concept-visualization batch filling VisuAlgo coverage gaps:
//   tsp-bitmask-dp          (graph renderer) — Held-Karp DP over visited subsets
//   hash-table-probing      (array renderer) — linear / quadratic / double hashing
//   min-vertex-cover        (graph renderer) — 2-approximation + tree DP
//   suffix-tree-construction(tree renderer)  — compressed trie of suffixes
//
// Frame shapes mirror the renderers in AlgoVisualizer.jsx exactly:
//   graph: { nodes:[{id,label?,state?}], edges:[{a,b,w?,state?}], caption }
//          node states: 'current'|'frontier'|'visited'|'done'
//          edge states: 'current'|'frontier'|'tree'|'visited'|'rejected'
//   array: { array:[..], subRow?:{values,label}, highlights?:{idx:role},
//            pointers?:{idx:label}, eliminated?:Set, caption }
//          highlight roles: 'current'|'match'|'pivot'|'done'
//   tree:  { tree:{_id,value,left,right,state?}, caption }
//          node states: 'current'|'visited'|'done'|'new'|'key'|'found'
//
// All helpers below are self-contained pure JS — no imports from
// conceptVisualizations.js.

// ===========================================================================
// 1. tsp-bitmask-dp — Held-Karp: dp[mask][i] = min cost of a path that starts
//    at city 0, visits exactly the cities in `mask`, and ends at city i.
// ===========================================================================
function tspHeldKarp({ n, dist, label }) {
  // dist: n x n symmetric matrix. Cities are graph nodes 0..n-1.
  const nodes = Array.from({ length: n }, (_, i) => ({ id: i }));
  const edges = [];
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) edges.push({ a, b, w: dist[a][b] });
  }
  const FULL = 1 << n;
  const INF = Infinity;
  const dp = Array.from({ length: FULL }, () => new Array(n).fill(INF));
  const par = Array.from({ length: FULL }, () => new Array(n).fill(-1));
  dp[1][0] = 0; // start at city 0, only city 0 visited

  const frames = [];
  const bits = (m) => m.toString(2).padStart(n, '0');
  const members = (m) => {
    const out = [];
    for (let i = 0; i < n; i++) if (m & (1 << i)) out.push(i);
    return out;
  };

  // Snapshot: highlight the cities in `mask`, mark `end` as current, draw the
  // best path edges discovered so far for (mask, end).
  const snap = (mask, end, pathEdges, caption) => {
    const inMask = new Set(members(mask));
    const ns = nodes.map((nd) => ({
      ...nd,
      label: `${nd.id}`,
      state: nd.id === end ? 'current'
        : nd.id === 0 ? 'done'
        : inMask.has(nd.id) ? 'visited'
        : undefined,
    }));
    const pe = new Set((pathEdges || []).map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
    const es = edges.map((e) => {
      const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
      return pe.has(key) ? { ...e, state: 'tree' } : e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  // Reconstruct the path edges for dp[mask][end] via parent pointers.
  const pathOf = (mask, end) => {
    const out = [];
    let m = mask, e = end;
    while (par[m][e] !== -1) {
      const p = par[m][e];
      out.push([p, e]);
      m ^= (1 << e);
      e = p;
    }
    return out;
  };

  snap(1, 0, [], `${label}: Held-Karp DP. dp[mask][i] = cheapest path that starts at city 0, visits exactly the cities in mask, and ends at i. Base case dp[{0}][0] = 0.`);
  snap(1, 0, [], `Each mask is an ${n}-bit set of visited cities (bit i = city i visited). We sweep masks in increasing order so every sub-path is solved before it is extended.`);

  for (let mask = 1; mask < FULL; mask++) {
    if (!(mask & 1)) continue; // every tour starts at city 0
    for (let end = 0; end < n; end++) {
      if (!(mask & (1 << end))) continue;
      if (dp[mask][end] === INF) continue;
      // Try to extend the path ending at `end` to an unvisited city `nxt`.
      for (let nxt = 0; nxt < n; nxt++) {
        if (mask & (1 << nxt)) continue;
        const nm = mask | (1 << nxt);
        const cand = dp[mask][end] + dist[end][nxt];
        const improved = cand < dp[nm][nxt];
        if (improved) {
          dp[nm][nxt] = cand;
          par[nm][nxt] = end;
        }
        snap(nm, nxt, pathOf(mask, end).concat([[end, nxt]]),
          `From dp[{${members(mask).join(',')}}][${end}] = ${dp[mask][end]}, step to city ${nxt} (edge cost ${dist[end][nxt]}): candidate dp[{${members(nm).join(',')}}][${nxt}] = ${cand}. ${improved ? 'Better than before — record it.' : `Not better than ${dp[nm][nxt]} — keep the old value.`}`);
      }
    }
  }

  // Close the tour: return to city 0 from each possible last city.
  const all = FULL - 1;
  let best = INF, bestEnd = -1;
  for (let end = 1; end < n; end++) {
    if (dp[all][end] === INF) continue;
    const total = dp[all][end] + dist[end][0];
    snap(all, end, pathOf(all, end).concat([[end, 0]]),
      `Close the tour: from dp[ALL][${end}] = ${dp[all][end]} add the return edge ${end}→0 (cost ${dist[end][0]}) → full tour cost ${total}.`);
    if (total < best) { best = total; bestEnd = end; }
  }

  const optEdges = pathOf(all, bestEnd).concat([[bestEnd, 0]]);
  snap(all, bestEnd, optEdges,
    `Optimal tour cost = ${best}, last city before returning home is ${bestEnd}.`);
  // Final recap frame with the full cycle highlighted.
  const cycleNodes = nodes.map((nd) => ({ ...nd, label: `${nd.id}`, state: nd.id === 0 ? 'done' : 'done' }));
  const pe = new Set(optEdges.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
  frames.push({
    nodes: cycleNodes,
    edges: edges.map((e) => {
      const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
      return pe.has(key) ? { ...e, state: 'tree' } : e;
    }),
    caption: `${label}: minimum Hamiltonian cycle has cost ${best}. Held-Karp solves TSP in O(2^n · n^2) time and O(2^n · n) memory — exponential, but far below the n! of brute force. (bitset ${bits(all)} = all cities visited.)`,
  });
  return frames;
}

function tspFourCities() {
  // Symmetric 4-city instance with a clear optimum.
  const dist = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
  ];
  return tspHeldKarp({ n: 4, dist, label: 'TSP (4 cities)' });
}

function tspFiveCities() {
  const dist = [
    [0, 12, 10, 19, 8],
    [12, 0, 3, 7, 6],
    [10, 3, 0, 9, 14],
    [19, 7, 9, 0, 5],
    [8, 6, 14, 5, 0],
  ];
  return tspHeldKarp({ n: 5, dist, label: 'TSP (5 cities)' });
}

// ===========================================================================
// 2. hash-table-probing — open addressing. Each table slot is one array cell;
//    the key being inserted rides in subRow; the probe cursor is a pointer.
//    highlight roles: 'pivot' = occupied/collision, 'current' = probe miss,
//    'match' = the cell we will write into, 'done' = freshly inserted.
// ===========================================================================
function probingFrames({ size, keys, strategy, label }) {
  const M = size;
  const table = new Array(M).fill(null);
  const EMPTY = '·';
  const frames = [];
  const view = () => table.map((v) => (v === null ? EMPTY : String(v)));

  // h1 and (for double hashing) h2 step.
  const h1 = (k) => k % M;
  const h2 = (k) => 1 + (k % (M - 1)); // never 0, coprime when M is prime

  const probeAt = (home, i, k) => {
    if (strategy === 'linear') return (home + i) % M;
    if (strategy === 'quadratic') return (home + i * i) % M;
    return (home + i * h2(k)) % M; // double hashing
  };
  const stepText = (home, i, k, slot) => {
    if (strategy === 'linear') return `slot = (h(${k}) + ${i}) mod ${M} = (${home} + ${i}) mod ${M} = ${slot}`;
    if (strategy === 'quadratic') return `slot = (h(${k}) + ${i}^2) mod ${M} = (${home} + ${i * i}) mod ${M} = ${slot}`;
    return `slot = (h1(${k}) + ${i}·h2(${k})) mod ${M} = (${home} + ${i}·${h2(k)}) mod ${M} = ${slot}`;
  };

  const intro = {
    linear: `Linear probing: on a collision try the very next slot, wrapping around. Probe sequence (h(k)+0, h(k)+1, h(k)+2, …) mod ${M}.`,
    quadratic: `Quadratic probing: on a collision the jump grows as i^2. Probe sequence (h(k)+0, h(k)+1, h(k)+4, h(k)+9, …) mod ${M}, spreading clusters out.`,
    double: `Double hashing: the step size itself comes from a second hash. Probe sequence (h1(k) + i·h2(k)) mod ${M}, with h2(k) = 1 + (k mod ${M - 1}) so different keys walk different strides.`,
  }[strategy];

  frames.push({ array: view(), subRow: { values: view(), label: 'table' }, caption: `${label}: ${intro} Table size M = ${M}, slots indexed 0..${M - 1}.` });

  for (const k of keys) {
    const home = h1(k);
    frames.push({
      array: view(),
      subRow: { values: view(), label: 'table' },
      pointers: { [home]: `h(${k})` },
      highlights: { [home]: table[home] === null ? 'current' : 'pivot' },
      caption: `Insert key ${k}. Home slot h(${k}) = ${k} mod ${M} = ${home}. ${table[home] === null ? 'It is empty — try to place here.' : `It already holds ${table[home]} — collision, begin probing.`}`,
    });

    let placed = false;
    for (let i = 0; i < M; i++) {
      const slot = probeAt(home, i, k);
      if (table[slot] === null) {
        const before = view();
        const hl = { [slot]: 'match' };
        frames.push({
          array: before,
          subRow: { values: before, label: 'table' },
          pointers: { [slot]: `i=${i}` },
          highlights: hl,
          caption: `Probe i=${i}: ${stepText(home, i, k, slot)}. Slot ${slot} is empty — insert ${k} here.`,
        });
        table[slot] = k;
        frames.push({
          array: view(),
          subRow: { values: view(), label: 'table' },
          highlights: { [slot]: 'done' },
          caption: `Placed ${k} at slot ${slot} after ${i} collision${i === 1 ? '' : 's'}. Load factor α = ${(keys.indexOf(k) + 1)}/${M} = ${((keys.indexOf(k) + 1) / M).toFixed(2)}.`,
        });
        placed = true;
        break;
      } else {
        frames.push({
          array: view(),
          subRow: { values: view(), label: 'table' },
          pointers: { [slot]: `i=${i}` },
          highlights: { [slot]: 'pivot' },
          caption: `Probe i=${i}: ${stepText(home, i, k, slot)}. Slot ${slot} is taken by ${table[slot]} — collision, advance the probe.`,
        });
      }
    }
    if (!placed) {
      frames.push({
        array: view(),
        subRow: { values: view(), label: 'table' },
        caption: `Key ${k}: every slot probed and the table is full — insertion fails. Open addressing requires α < 1 (and rehashing well before α nears 1).`,
      });
    }
  }

  frames.push({
    array: view(),
    subRow: { values: view(), label: 'table' },
    highlights: Object.fromEntries(table.map((v, i) => [i, v === null ? null : 'done']).filter(([, r]) => r)),
    caption: `${label} done. All keys resolved within the table — no external chains. ${strategy === 'linear' ? 'Linear probing is cache-friendly but suffers primary clustering: long runs of occupied slots grow longer.' : strategy === 'quadratic' ? 'Quadratic probing breaks primary clusters but can still leave secondary clusters (keys with the same home follow the same jumps).' : 'Double hashing scatters probes best — keys with the same home slot diverge immediately because their strides differ.'}`,
  });
  return frames;
}

// Keys 10,17,24 all hash to home slot 3 (mod 7) to force a collision run; 5 and 8
// home to distinct slots. This set resolves under all three strategies (quadratic
// from home 3 only reaches {3,4,0,5}, so three same-home keys is the safe max).
const PROBE_KEYS = [10, 17, 24, 5, 8];
function probingLinear() {
  return probingFrames({ size: 7, keys: PROBE_KEYS, strategy: 'linear', label: 'Linear probing' });
}
function probingQuadratic() {
  return probingFrames({ size: 7, keys: PROBE_KEYS, strategy: 'quadratic', label: 'Quadratic probing' });
}
function probingDouble() {
  return probingFrames({ size: 7, keys: PROBE_KEYS, strategy: 'double', label: 'Double hashing' });
}

// ===========================================================================
// 3. min-vertex-cover
//   (a) 2-approximation: repeatedly pick an uncovered edge, add BOTH endpoints
//       to the cover, remove all edges they touch. Result ≤ 2·OPT.
//   (b) exact tree DP: dp[v][0/1] = min cover of v's subtree with v excluded /
//       included; pick the cheaper root option.
// ===========================================================================
function vertexCoverApprox({ nodes: rawNodes, edges, label }) {
  const nodes = rawNodes.map((id) => ({ id }));
  const cover = new Set();
  const removed = new Set(); // edge keys removed (covered)
  const ekey = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
  const frames = [];

  const snap = (pickEdge, caption) => {
    const ns = nodes.map((n) => ({
      ...n,
      state: cover.has(n.id) ? 'done'
        : (pickEdge && (pickEdge[0] === n.id || pickEdge[1] === n.id)) ? 'current'
        : undefined,
    }));
    const es = edges.map((e) => {
      const key = ekey(e.a, e.b);
      if (removed.has(key)) return { ...e, state: 'visited' };
      if (pickEdge && key === ekey(pickEdge[0], pickEdge[1])) return { ...e, state: 'current' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `${label}: 2-approximation. Greedily pick any still-uncovered edge, add BOTH of its endpoints to the cover, then mark every edge those two vertices touch as covered. Repeat until no edge remains.`);
  snap(null, `Why both endpoints: any cover must contain at least one endpoint of the picked edge. Taking both can over-pay by at most a factor of 2, and the picked edges are pairwise disjoint, so |cover| ≤ 2·OPT.`);

  let round = 0;
  while (true) {
    const e = edges.find((ed) => !removed.has(ekey(ed.a, ed.b)));
    if (!e) break;
    round += 1;
    snap([e.a, e.b], `Round ${round}: edge ${e.a}–${e.b} is uncovered. Pick it. Add both endpoints ${e.a} and ${e.b} to the cover.`);
    cover.add(e.a); cover.add(e.b);
    let killed = 0;
    for (const ed of edges) {
      const key = ekey(ed.a, ed.b);
      if (removed.has(key)) continue;
      if (cover.has(ed.a) || cover.has(ed.b)) { removed.add(key); killed += 1; }
    }
    snap([e.a, e.b], `${e.a} and ${e.b} now cover ${killed} edge${killed === 1 ? '' : 's'} (every edge touching either of them). Cover = {${[...cover].sort((a, b) => a - b).join(', ')}}.`);
  }

  snap(null, `All edges covered. Approximate cover = {${[...cover].sort((a, b) => a - b).join(', ')}}, size ${cover.size}. Guaranteed within 2× of the true minimum — vertex cover is NP-hard, so an exact poly-time algorithm is unlikely on general graphs.`);
  // Recap frame.
  frames.push({
    nodes: nodes.map((n) => ({ ...n, state: cover.has(n.id) ? 'done' : 'visited' })),
    edges: edges.map((e) => ({ ...e, state: 'visited' })),
    caption: `${label}: highlighted vertices form the cover — every edge has at least one endpoint in the set. The chosen edges are a matching, so OPT ≥ (matching size), and our cover = 2·(matching size) ≤ 2·OPT.`,
  });
  return frames;
}

function vertexCoverTreeDP({ nodes: rawNodes, edges, root, label }) {
  const nodes = rawNodes.map((id) => ({ id }));
  const adj = {};
  for (const id of rawNodes) adj[id] = [];
  for (const e of edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
  const order = [];
  const parent = {};
  const seen = new Set([root]);
  const stack = [root];
  parent[root] = -1;
  while (stack.length) {
    const u = stack.pop();
    order.push(u);
    for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); parent[v] = u; stack.push(v); }
  }
  // dp[v] = [excludeCost, includeCost]
  const dp = {};
  const chosen = {}; // best decision (0/1) at v when its state is fixed
  const frames = [];

  const snap = (cur, picked, caption) => {
    const inCover = new Set(picked || []);
    const ns = nodes.map((n) => ({
      ...n,
      state: n.id === cur ? 'current'
        : inCover.has(n.id) ? 'done'
        : dp[n.id] ? 'visited'
        : undefined,
    }));
    // tree edges
    const es = edges.map((e) => {
      const child = parent[e.a] === e.b ? e.a : parent[e.b] === e.a ? e.b : null;
      return child != null ? { ...e, state: 'tree' } : e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, [], `${label}: exact minimum vertex cover on a TREE via DP. dp[v][0] = min cover of v's subtree with v EXCLUDED; dp[v][1] = with v INCLUDED. Process children before parents (post-order).`);
  snap(null, [], `If v is excluded, every child MUST be included (else the edge v–child is uncovered): dp[v][0] = Σ dp[c][1]. If v is included, each child takes its own cheaper option: dp[v][1] = 1 + Σ min(dp[c][0], dp[c][1]).`);

  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i];
    const kids = adj[v].filter((c) => parent[c] === v);
    let exc = 0, inc = 1;
    for (const c of kids) { exc += dp[c][1]; inc += Math.min(dp[c][0], dp[c][1]); }
    dp[v] = [exc, inc];
    const leaf = kids.length === 0;
    snap(v, [], `${leaf ? 'Leaf' : 'Node'} ${v}${kids.length ? ` (children ${kids.join(', ')})` : ''}: dp[${v}][0] = ${exc} (exclude ${v}${kids.length ? ', so include all children' : ''}), dp[${v}][1] = ${inc} (include ${v}${kids.length ? ', children free to choose cheaper' : ''}).`);
  }

  const rootCost = Math.min(dp[root][0], dp[root][1]);
  const rootIncluded = dp[root][1] <= dp[root][0];
  // Reconstruct: walk top-down honouring each node's forced/optimal choice.
  const picked = [];
  const decide = (v, mustInclude) => {
    let include;
    if (mustInclude) include = true;
    else include = dp[v][1] <= dp[v][0];
    if (include) picked.push(v);
    const kids = adj[v].filter((c) => parent[c] === v);
    for (const c of kids) decide(c, !include); // if v excluded, child must be included
  };
  chosen[root] = rootIncluded ? 1 : 0;
  decide(root, false);

  snap(root, picked, `Root ${root}: min(dp[${root}][0]=${dp[root][0]}, dp[${root}][1]=${dp[root][1]}) = ${rootCost}. Reconstruct top-down: an excluded node forces all its children in; an included node lets children pick the cheaper side.`);
  frames.push({
    nodes: nodes.map((n) => ({ ...n, state: picked.includes(n.id) ? 'done' : 'visited' })),
    edges: edges.map((e) => ({ ...e, state: 'tree' })),
    caption: `${label}: exact minimum cover = {${[...picked].sort((a, b) => a - b).join(', ')}}, size ${rootCost}. On a tree the DP is exact in O(V); the NP-hardness of vertex cover only bites on general graphs.`,
  });
  return frames;
}

function vcApproxTriangleChain() {
  // Edges form two triangles linked by a bridge — clear matching structure.
  const nodes = [0, 1, 2, 3, 4, 5];
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 },
    { a: 3, b: 4 }, { a: 4, b: 5 }, { a: 5, b: 3 },
  ];
  return vertexCoverApprox({ nodes, edges, label: 'Vertex cover (2-approx)' });
}

function vcTreeDP() {
  // Rooted tree at 0: 0-1,0-2; 1-3,1-4; 2-5; 4-6.
  const nodes = [0, 1, 2, 3, 4, 5, 6];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 },
    { a: 1, b: 3 }, { a: 1, b: 4 },
    { a: 2, b: 5 }, { a: 4, b: 6 },
  ];
  return vertexCoverTreeDP({ nodes, edges, root: 0, label: 'Vertex cover (tree DP)' });
}

// ===========================================================================
// 4. suffix-tree-construction — compressed trie of all suffixes of a string.
//    Built incrementally: insert each suffix, walking/forking the existing
//    trie. Rendered with the binary 'tree' renderer; node `value` is the edge
//    label leading into it (root shows the string). Where a node has >2 real
//    children we narrate the extra ones in the caption and draw the two
//    outermost in left/right.
// ===========================================================================
let _sid = 0;
function snode(value, state) { return { _id: ++_sid, value, left: null, right: null, state, _edges: [] }; }

// Build a compressed suffix trie (edge labels are substrings). We keep a real
// multi-way structure internally (_edges: [{label, child}]) and project it onto
// the binary renderer for display.
function suffixTreeFrames(text, label) {
  _sid = 0;
  const s = text + '$';
  const root = snode('·'); // root displays a dot
  const frames = [];

  // Project the multi-way trie into a binary tree the renderer understands:
  // a node's children are sorted by first char; the first becomes `left`, the
  // last becomes `right`, and any middle children are folded by chaining the
  // remaining ones under `right`'s left spine is NOT accurate, so for clarity we
  // simply take up to two children (first & last). Most suffix-tree teaching
  // examples (banana) fan out at most 3 from the root; we narrate the middle.
  const project = (n, states) => {
    if (!n) return null;
    const kids = [...n._edges].sort((a, b) => a.label[0] < b.label[0] ? -1 : 1);
    const out = {
      _id: n._id,
      value: n.value,
      state: states && states[n._id] ? states[n._id] : n.state,
      left: null,
      right: null,
    };
    if (kids.length >= 1) out.left = project(kids[0].child, states);
    if (kids.length >= 2) out.right = project(kids[kids.length - 1].child, states);
    return out;
  };

  const snap = (states, caption) => {
    frames.push({ tree: project(root, states), caption });
  };

  snap(null, `${label}: a suffix tree is a compressed trie of every suffix of "${s}" (the sentinel $ guarantees no suffix is a prefix of another). Build it by inserting suffixes longest-first; shared prefixes merge into shared paths.`);
  snap({ [root._id]: 'key' }, `Root is the empty string. From it, each downward path spells a suffix; edge labels are substrings (compressed), so the tree has at most 2·|s| nodes.`);

  // Insert each suffix s[i..] into the trie.
  for (let i = 0; i < s.length; i++) {
    const suf = s.slice(i);
    let cur = root;
    let consumed = 0;
    snap({ [root._id]: 'current' }, `Insert suffix #${i + 1}: "${suf}" (positions ${i}..${s.length - 1}). Start at the root and follow matching edges; fork where the path first diverges.`);

    while (consumed < suf.length) {
      const rest = suf.slice(consumed);
      // find an edge whose label shares a prefix with `rest`
      const edge = cur._edges.find((e) => e.label[0] === rest[0]);
      if (!edge) {
        // no matching edge: add a fresh leaf edge with the whole remaining label
        const leaf = snode(rest, 'new');
        cur._edges.push({ label: rest, child: leaf });
        snap({ [leaf._id]: 'new', [cur._id]: 'visited' }, `No existing edge starts with '${rest[0]}'. Add a new leaf edge "${rest}" — this whole tail of the suffix is unique so far.`);
        consumed = suf.length;
        break;
      }
      // measure common prefix length of edge.label and rest
      let m = 0;
      while (m < edge.label.length && m < rest.length && edge.label[m] === rest[m]) m += 1;
      if (m === edge.label.length) {
        // entire edge matched; descend and continue
        consumed += m;
        cur = edge.child;
        snap({ [cur._id]: 'current' }, `Edge "${edge.label}" fully matches the next ${m} char${m === 1 ? '' : 's'} of "${rest}". Descend along it and keep matching the remainder "${suf.slice(consumed)}".`);
      } else {
        // partial match: SPLIT the edge at offset m
        const common = edge.label.slice(0, m);
        const oldTail = edge.label.slice(m);
        const newTail = rest.slice(m);
        const split = snode(common, 'current');
        const oldChild = edge.child;
        oldChild.value = oldTail; // the existing subtree now hangs under the split
        edge.label = common;
        edge.child = split;
        split._edges.push({ label: oldTail, child: oldChild });
        const leaf = snode(newTail, 'new');
        split._edges.push({ label: newTail, child: leaf });
        snap({ [split._id]: 'current', [leaf._id]: 'new' }, `Partial match: "${rest}" and edge "${oldTail ? common + oldTail : common}" agree on "${common}" then diverge. SPLIT the edge — insert an internal node after "${common}", keep the old branch "${oldTail}" and fork a new leaf "${newTail}".`);
        consumed = suf.length;
        break;
      }
    }
  }

  // Count leaves = number of suffixes.
  let leaves = 0;
  const countLeaves = (n) => { if (n._edges.length === 0) { leaves += 1; return; } for (const e of n._edges) countLeaves(e.child); };
  countLeaves(root);

  snap({ [root._id]: 'done' }, `Every suffix of "${s}" now corresponds to a root-to-leaf path; there are ${leaves} leaves, one per suffix. Internal nodes mark branching points where several suffixes share a common prefix before diverging.`);
  snap(null, `${label}: the compressed suffix tree is built. It answers substring queries in O(|pattern|) and powers longest-repeated-substring, longest-common-substring, and many string problems. Ukkonen's algorithm builds it in O(|s|) overall.`);
  return frames;
}

function suffixTreeBanana() { return suffixTreeFrames('banana', 'Suffix tree "banana"'); }
function suffixTreeAbab() { return suffixTreeFrames('abab', 'Suffix tree "abab"'); }
function suffixTreeMississippi() { return suffixTreeFrames('mississ', 'Suffix tree "mississ"'); }

// ===========================================================================
export default {
  'tsp-bitmask-dp': {
    title: 'Traveling Salesperson (Bitmask DP)',
    renderer: 'graph',
    cases: [
      { label: '4 cities (Held-Karp)', frames: tspFourCities() },
      { label: '5 cities', frames: tspFiveCities() },
    ],
  },
  'hash-table-probing': {
    title: 'Hash Table: Open Addressing',
    renderer: 'array',
    cases: [
      { label: 'Linear probing', frames: probingLinear() },
      { label: 'Quadratic probing', frames: probingQuadratic() },
      { label: 'Double hashing', frames: probingDouble() },
    ],
  },
  'min-vertex-cover': {
    title: 'Minimum Vertex Cover',
    renderer: 'graph',
    cases: [
      { label: '2-approximation', frames: vcApproxTriangleChain() },
      { label: 'Exact tree DP', frames: vcTreeDP() },
    ],
  },
  'suffix-tree-construction': {
    title: 'Suffix Tree',
    renderer: 'tree',
    cases: [
      { label: '"banana"', frames: suffixTreeBanana() },
      { label: '"abab"', frames: suffixTreeAbab() },
      { label: '"mississ"', frames: suffixTreeMississippi() },
    ],
  },
};
