#!/usr/bin/env node
// Atomic splice: inject graph/union-find/segment-tree trio viz fns before `export const RICH_CONTENT = {`
// and corresponding problem entries before its closing `};`.
//
// Slugs:
//   1. reorder-routes-to-make-all-paths-lead-to-the-city-zero — BFS from 0, count wrong-direction edges.
//   2. number-of-good-paths — sort nodes by value, union-find by value layers.
//   3. longest-substring-of-one-repeating-character — segment tree with prefix/suffix/best runs.
//
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function minReorderViz(')
  || src.includes("'reorder-routes-to-make-all-paths-lead-to-the-city-zero':")
  || src.includes('"reorder-routes-to-make-all-paths-lead-to-the-city-zero":')
  || src.includes('function numberOfGoodPathsViz(')
  || src.includes("'number-of-good-paths':")
  || src.includes('"number-of-good-paths":')
  || src.includes('function longestRepeatingViz(')
  || src.includes("'longest-substring-of-one-repeating-character':")
  || src.includes('"longest-substring-of-one-repeating-character":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function minReorderViz() {
  // n=6 city graph, edges as directed pairs [a, b] meaning road a -> b.
  //  Layout:
  //        0
  //       / \\
  //      1   5
  //      |    \\
  //      2     4
  //      |
  //      3
  //  Original directed edges (some point away from 0, some toward):
  //    [0,1] [1,3] [2,3] [4,0] [4,5]
  //  Visualization: BFS from city 0 along the *undirected* graph, and each time
  //  we traverse an edge whose directed form points *away* from 0, we must flip it.
  const n = 6;
  const directed = [[0, 1], [1, 3], [2, 3], [4, 0], [4, 5]];
  const labels = ['0', '1', '2', '3', '4', '5'];
  const frames = [];

  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'n', value: String(n) },
      { label: 'edges', value: String(directed.length) },
      { label: 'goal', value: 'every city -> 0', tone: 'violet' },
    ],
    caption: 'Six cities, five directed roads. Roads form a tree (n-1 edges, connected). We need every city to reach city 0 by following arrows. Flipping a road costs 1. Question: what is the minimum number of flips? Brute force tries every subset — exponential. The structural trick: BFS from 0 over the undirected graph; every edge crossed in the "outward" direction must be flipped.',
  });

  // Build adjacency: store sign — +1 if the stored direction is a -> b (original), -1 if b -> a.
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of directed) {
    adj[a].push([b, 1]);   // original direction a -> b
    adj[b].push([a, 0]);   // reverse: from b's view, the edge points away if we use it to reach a
  }

  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'adjacency', value: 'undirected + sign bit', tone: 'violet' },
      { label: 'sign 1', value: 'original direction (away from src)' },
      { label: 'sign 0', value: 'reverse (already toward src)' },
    ],
    caption: 'Build an undirected adjacency list where every edge stores a bit: 1 if the stored direction matches the original (a -> b), 0 if reversed. When BFS walks from u to v via an edge with sign 1, that means the road originally went u -> v — but we are walking *outward* from 0, so the city v cannot use this edge to reach 0. Flip it.',
  });

  // BFS from 0
  const visited = new Array(n).fill(false);
  visited[0] = true;
  const order = [0];
  let flips = 0;

  frames.push({
    array: labels.slice(),
    highlights: { 0: 'current' },
    chip: [
      { label: 'BFS source', value: '0' },
      { label: 'queue', value: '[0]' },
      { label: 'flips', value: '0' },
    ],
    caption: 'Start BFS at city 0. The queue holds frontier cities. Every edge we discover is the *first* path from 0 to its other endpoint (BFS guarantees this on a tree). For each such discovery edge we check: does the stored direction point away from 0? If yes, increment flip counter.',
  });

  // Process node 0: neighbors via edges [0,1] (sign 1 toward 1) and [4,0] (reversed, sign 0 toward 4)
  // Edge 0 -> 1: stored sign 1 (original 0 -> 1), discovered going 0 to 1 -> away from 0, FLIP.
  visited[1] = true;
  flips += 1;
  order.push(1);
  frames.push({
    array: labels.slice(),
    highlights: { 0: 'visited', 1: 'flip' },
    chip: [
      { label: 'edge', value: '0 -> 1 (original)' },
      { label: 'BFS direction', value: '0 to 1 (away)', tone: 'pink' },
      { label: 'action', value: 'FLIP, flips = 1', tone: 'violet' },
    ],
    caption: 'From 0, visit neighbor 1. The original road is 0 -> 1, but the city we need to fix is 1 (it should reach 0). The arrow points away — flip it to 1 -> 0. flips = 1.',
  });

  // Edge 0 — 4 via the [4,0] entry: stored sign 0 (reversed), meaning original was 4 -> 0,
  // which already points toward 0. No flip needed.
  visited[4] = true;
  order.push(4);
  frames.push({
    array: labels.slice(),
    highlights: { 0: 'visited', 4: 'keep' },
    chip: [
      { label: 'edge', value: '4 -> 0 (original)' },
      { label: 'BFS direction', value: '0 to 4 (away)' },
      { label: 'action', value: 'already inward — KEEP', tone: 'violet' },
    ],
    caption: 'Next neighbor of 0: city 4, reached via the road originally written as 4 -> 0. Even though BFS walks outward from 0 to 4, the *road* already points toward 0. City 4 can reach 0 by following the existing arrow. No flip. flips stays at 1.',
  });

  // Process node 1: neighbors 0 (visited) and 3 via [1,3] sign 1.
  visited[3] = true;
  flips += 1;
  order.push(3);
  frames.push({
    array: labels.slice(),
    highlights: { 1: 'visited', 3: 'flip' },
    chip: [
      { label: 'edge', value: '1 -> 3 (original)' },
      { label: 'BFS direction', value: '1 to 3 (away)', tone: 'pink' },
      { label: 'action', value: 'FLIP, flips = 2', tone: 'violet' },
    ],
    caption: 'From city 1, discover city 3 via road 1 -> 3. BFS walks outward, road points outward. To make city 3 reach 0 it must traverse 3 -> 1 -> 0. Flip 1 -> 3 into 3 -> 1. flips = 2.',
  });

  // Process node 4: neighbors 0 (visited) and 5 via [4,5] sign 1.
  visited[5] = true;
  flips += 1;
  order.push(5);
  frames.push({
    array: labels.slice(),
    highlights: { 4: 'visited', 5: 'flip' },
    chip: [
      { label: 'edge', value: '4 -> 5 (original)' },
      { label: 'BFS direction', value: '4 to 5 (away)', tone: 'pink' },
      { label: 'action', value: 'FLIP, flips = 3', tone: 'violet' },
    ],
    caption: 'From city 4, discover city 5 via road 4 -> 5. Same logic: city 5 needs the path 5 -> 4 -> 0, but the road sends traffic from 4 to 5. Flip it. flips = 3.',
  });

  // Process node 3: neighbors 1 (visited), 2 via [2,3] sign 0 (reversed: original 2 -> 3).
  visited[2] = true;
  order.push(2);
  frames.push({
    array: labels.slice(),
    highlights: { 3: 'visited', 2: 'keep' },
    chip: [
      { label: 'edge', value: '2 -> 3 (original)' },
      { label: 'BFS direction', value: '3 to 2 (away from 0)' },
      { label: 'action', value: 'already inward — KEEP', tone: 'violet' },
    ],
    caption: 'From city 3, discover city 2 via the road originally written as 2 -> 3. BFS walks outward (3 to 2), but the road already points from 2 to 3, which is the direction city 2 will use to reach 0 via 3 -> 1 -> 0. No flip needed.',
  });

  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'visited', value: 'all 6 cities' },
      { label: 'flips total', value: '3', tone: 'pink' },
      { label: 'invariant', value: 'tree -> each edge seen once', tone: 'violet' },
    ],
    caption: 'BFS completes when all 6 cities are visited. Total flips = 3. Because the graph is a tree, every edge is exactly one discovery edge during BFS — no edge gets re-evaluated, no edge gets missed. The count is provably optimal: each road must end up pointing toward 0, and flipping any road already-correct would only add cost.',
  });

  // Why-BFS-not-DFS frame
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'BFS or DFS', value: 'either works', tone: 'violet' },
      { label: 'invariant', value: 'discovery edge sees direction once' },
      { label: 'cost', value: 'O(n + m)' },
    ],
    caption: 'BFS isnt special here — DFS works equally well. The key property is: traverse the *undirected* tree from city 0, and each edge becomes a discovery edge exactly once. At discovery time, check the stored sign and accumulate flips. Both traversals give the same answer in O(n + m).',
  });

  // Counter-example frame — non-tree
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'if graph had cycle', value: 'still BFS-able', tone: 'violet' },
      { label: 'extra edges', value: 'ignored (not discovery)' },
      { label: 'guarantee', value: 'problem says tree, n-1 edges' },
    ],
    caption: 'The problem guarantees n cities, n-1 edges, weakly connected — i.e. a tree when directions are ignored. If there were extra edges (cycles), BFS would still work: non-discovery edges (already-visited neighbors) just dont contribute, because the city is already reachable via the BFS path. The flip count would be unchanged.',
  });

  // Adjacency representation trick
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'encoding', value: 'adj[u].push([v, sign])', tone: 'violet' },
      { label: 'sign 1', value: 'original u -> v' },
      { label: 'sign 0', value: 'reversed (original v -> u)' },
    ],
    caption: 'The adjacency-with-sign trick is the entire algorithm in one data structure. For each original edge [a, b]: push (b, 1) into adj[a] and (a, 0) into adj[b]. When BFS leaves city u and arrives at v with sign 1, the original road went u -> v — outward from 0 — so flip. With sign 0, the road went v -> u — already inward — keep.',
  });

  // Optimality argument
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'optimality', value: 'every edge contributes 0 or 1', tone: 'violet' },
      { label: 'no choice', value: 'unique direction per edge to reach 0' },
      { label: 'so', value: 'sum of per-edge flips = min', tone: 'pink' },
    ],
    caption: 'Why is the greedy count optimal? Because in a tree, the path from every city to 0 is unique. Each edge appears in exactly the set of city-to-0 paths whose endpoints sit on its far side. There is no rerouting choice — each edge either points the right way already (cost 0) or the wrong way (cost 1, must flip). Summing per-edge cost is the global minimum.',
  });

  // Edge case: city already 0
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'city 0 itself', value: 'starts visited', tone: 'violet' },
      { label: 'no self-flip', value: 'never enqueued twice' },
      { label: 'isolated tree', value: 'n=1 -> 0 flips' },
    ],
    caption: 'Edge cases: city 0 starts already visited, so it never gets re-evaluated (no infinite loop). If n = 1 (only city 0), the for-loop over neighbors runs zero times and the answer is 0. The algorithm handles both trivially.',
  });

  // Performance / scale
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'n', value: 'up to 5*10^4' },
      { label: 'time', value: 'O(n)', tone: 'violet' },
      { label: 'space', value: 'O(n) adjacency + queue', tone: 'pink' },
    ],
    caption: 'For n up to 5*10^4 with n-1 edges, the whole thing runs in well under a millisecond. Adjacency stores 2(n-1) entries, BFS queue peaks at O(n). No fancy data structures — a plain queue and a visited array. This is the kind of problem where recognizing the structure (tree -> BFS from root) collapses an apparently hard reorientation question into a linear scan.',
  });

  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'final answer', value: '3', tone: 'pink' },
      { label: 'roads flipped', value: '0->1, 1->3, 4->5', tone: 'violet' },
      { label: 'verification', value: 'every city reaches 0' },
    ],
    caption: 'Done. Three roads flipped: 0->1 becomes 1->0, 1->3 becomes 3->1, 4->5 becomes 5->4. Now city 1 goes 1->0, city 3 goes 3->1->0, city 2 goes 2->3->1->0, city 4 goes 4->0, city 5 goes 5->4->0. All reach 0. Done in linear time.',
  });

  return { renderer: 'array', title: 'Reorder Routes to Make All Paths Lead to City 0 — BFS + sign trick, O(n)', frames };
}

function numberOfGoodPathsViz() {
  // Tree:
  //        0(val=1)
  //         |
  //        1(val=3)
  //       / | \\
  //      2  3  4
  //   v=2 v=1 v=1
  //                5(val=3) — attached to 4 via edge [4,5]
  // Edges: [0,1],[1,2],[2,3],[1,4],[4,5]
  // Wait: rebuild for clarity — use the LC sample:
  // vals = [1, 3, 2, 1, 3], edges = [[0,1],[0,2],[2,3],[2,4]]
  // Tree:
  //         0(v=1)
  //         / \\
  //      1(v=3) 2(v=2)
  //              / \\
  //          3(v=1) 4(v=3)
  // Good paths: nodes u,v where vals[u]==vals[v] and max(vals on path) == vals[u]==vals[v].
  // Singletons (u==v) always count -> 5.
  // Plus: (1,4) val=3, path 1-0-2-4, max=3 -> good. (0,3) val=1, path 0-2-3, max=2 -> NOT good.
  // Total expected = 6.
  const vals = [1, 3, 2, 1, 3];
  const edges = [[0, 1], [0, 2], [2, 3], [2, 4]];
  const n = vals.length;
  const labels = vals.map((v, i) => i + '(v=' + v + ')');
  const frames = [];

  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'n', value: String(n) },
      { label: 'edges', value: String(edges.length) },
      { label: 'good path', value: 'endpoints share val == max', tone: 'violet' },
    ],
    caption: 'A "good path" has equal endpoint values AND the maximum value on the path equals that shared endpoint value. Singletons always count (a path of length 0). Brute force tries all C(n,2)+n pairs and walks each path — O(n^3). The trick: process nodes in ascending value order with union-find, so when we connect a component, the largest value in it equals the current node value.',
  });

  // Sort node indices by value (ascending), tiebreak by index
  const nodeOrder = Array.from({ length: n }, (_, i) => i).sort((a, b) => vals[a] - vals[b] || a - b);
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'process order', value: nodeOrder.map((i) => i + '(' + vals[i] + ')').join(', '), tone: 'violet' },
      { label: 'phases', value: 'value-layer by value-layer' },
      { label: 'why ascending', value: 'so max-in-component = current val', tone: 'pink' },
    ],
    caption: 'Sort nodes by value ascending: 0(1), 3(1), 2(2), 1(3), 4(3). Process value-by-value. When we activate all nodes of value v, every union we perform sees a component whose maximum is at most v. The endpoints of any good path with shared value v must already be connected at this point — and the count of pairs equals C(c, 2) where c is how many value-v nodes are in the component.',
  });

  // Build adjacency
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }

  // DSU
  const parent = Array.from({ length: n }, (_, i) => i);
  // size[r] = total nodes in component
  const size = new Array(n).fill(1);
  // cntMax[r] = number of nodes in component whose value equals the *current max* in that component
  const cntMax = new Array(n).fill(1);
  const active = new Array(n).fill(false);

  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };

  let good = 0;

  // ---- Layer v=1: nodes 0 and 3 ----
  active[0] = true;
  active[3] = true;
  // Activate node 0 (val 1) — it counts as a singleton good path. (We will accumulate via C(c,2)+c at end? Actually use Union-Find approach: when activating a value v, for each newly active node u, look at its neighbors that are already active; if find(u) != find(v_n), check whether their max equals v.)
  frames.push({
    array: labels.slice(),
    highlights: { 0: 'current', 3: 'current' },
    chip: [
      { label: 'layer', value: 'v = 1' },
      { label: 'newly active', value: 'nodes 0, 3' },
      { label: 'good so far', value: String(good) },
    ],
    caption: 'Layer v=1: activate nodes 0 and 3 (both have value 1). After activation, examine each newly-active node u and try to union it with already-active neighbors whose value <= 1.',
  });

  // Process node 0: neighbors are 1, 2 — neither active yet.
  frames.push({
    array: labels.slice(),
    highlights: { 0: 'current' },
    chip: [
      { label: 'node', value: '0' },
      { label: 'active neighbors', value: 'none' },
      { label: 'union', value: 'skip', tone: 'violet' },
    ],
    caption: 'Process node 0. Its neighbors are 1 and 2 (both currently inactive — their values 3 and 2 are larger). No unions performed; node 0 stays a singleton component.',
  });

  // Process node 3: neighbors are 2 — not active yet.
  frames.push({
    array: labels.slice(),
    highlights: { 3: 'current' },
    chip: [
      { label: 'node', value: '3' },
      { label: 'active neighbors', value: 'none' },
      { label: 'union', value: 'skip', tone: 'violet' },
    ],
    caption: 'Process node 3. Its only neighbor is 2 (inactive). No unions. Node 3 stays a singleton.',
  });

  // End of layer v=1: count good paths from each component.
  // Component {0}: 1 value-1 node -> C(1,2)+1 = 0 + 1 = 1 singleton
  // Component {3}: same, +1
  good += 1 + 1;
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'layer v=1 done', value: 'good += 2', tone: 'violet' },
      { label: 'components', value: '{0}, {3}, each singleton' },
      { label: 'good total', value: String(good), tone: 'pink' },
    ],
    caption: 'End-of-layer accounting: each component contributes C(cntMax, 2) + cntMax good paths, where cntMax is the count of nodes in it whose value matches the layer. Both components have cntMax=1, so each contributes 0 + 1 = 1 (the singleton path). good = 2.',
  });

  // ---- Layer v=2: node 2 ----
  active[2] = true;
  frames.push({
    array: labels.slice(),
    highlights: { 2: 'current' },
    chip: [
      { label: 'layer', value: 'v = 2' },
      { label: 'newly active', value: 'node 2' },
      { label: 'good total', value: String(good) },
    ],
    caption: 'Layer v=2: activate node 2 (value 2). Examine its active neighbors: 0 (val 1, active) and 3 (val 1, active). Both are eligible for union since their values <= 2.',
  });

  // Union 2 with 0
  // The "good path" counter requires careful per-component tracking. We model:
  //   Each component tracks size and a "max-value count" — how many nodes in it
  //   equal the largest value present. When unioning two components A and B at
  //   layer v:
  //     - new max = v (since we are processing v and the unions happen because
  //       newly-active node sits at v)
  //     - cntMax(merged) = (cntMax(A) if max(A)==v else 0) + (cntMax(B) if max(B)==v else 0)
  // For visualization purposes we accumulate good paths *after* all unions of
  // the layer settle.
  let ra = find(2); let rb = find(0);
  parent[rb] = ra; size[ra] += size[rb];
  // cntMax for component rooted at ra now: only node 2 (val 2) matches current layer 2
  cntMax[ra] = 1;
  frames.push({
    array: labels.slice(),
    highlights: { 2: 'current', 0: 'visited' },
    chip: [
      { label: 'union', value: '2 with 0' },
      { label: 'component size', value: '2' },
      { label: 'cntMax (=2)', value: '1', tone: 'violet' },
    ],
    caption: 'Union node 2 with node 0. New component {0, 2}, size 2. The max value in this component is now 2 (node 2), and exactly 1 node holds value 2. The previous max-count of {0} (which was 1 for value 1) is discarded — those nodes are now "below" the new max.',
  });

  // Union 2 with 3
  ra = find(2); rb = find(3);
  parent[rb] = ra; size[ra] += size[rb];
  frames.push({
    array: labels.slice(),
    highlights: { 2: 'current', 3: 'visited' },
    chip: [
      { label: 'union', value: '2 with 3' },
      { label: 'component size', value: '3' },
      { label: 'cntMax (=2)', value: '1', tone: 'violet' },
    ],
    caption: 'Union with node 3 too. Component now {0, 2, 3}, size 3, max value 2, cntMax = 1 (still only node 2 holds value 2). Layer-2 good-path contribution from this component: C(1, 2) + 1 = 1 (just the singleton {2}).',
  });

  good += 1;
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'layer v=2 done', value: 'good += 1', tone: 'violet' },
      { label: 'good total', value: String(good), tone: 'pink' },
      { label: 'observation', value: 'value-1 pair (0,3) NOT counted' },
    ],
    caption: 'Layer 2 done. good = 3. Note: nodes 0 and 3 (both value 1) are now in the same component, but the path between them is 0-2-3, which contains node 2 (val 2 > 1). So (0, 3) is NOT a good path — and our algorithm correctly never counts it, because they were not yet connected when we processed layer 1.',
  });

  // ---- Layer v=3: nodes 1 and 4 ----
  active[1] = true;
  active[4] = true;
  frames.push({
    array: labels.slice(),
    highlights: { 1: 'current', 4: 'current' },
    chip: [
      { label: 'layer', value: 'v = 3' },
      { label: 'newly active', value: 'nodes 1, 4' },
      { label: 'good total', value: String(good) },
    ],
    caption: 'Layer v=3: activate nodes 1 and 4 (both value 3). Their neighbors: node 1 -> 0 (active), node 4 -> 2 (active). Both unions are eligible.',
  });

  // Union node 1 with component containing 0
  ra = find(1); rb = find(0);
  // Component rooted at rb has cntMax(=2) = 1 — but layer is 3 now, so it does NOT contribute.
  parent[rb] = ra; size[ra] += size[rb];
  cntMax[ra] = 1; // node 1 (val 3) is the only val-3 in merged component so far
  frames.push({
    array: labels.slice(),
    highlights: { 1: 'current', 0: 'visited', 2: 'visited', 3: 'visited' },
    chip: [
      { label: 'union', value: '1 with {0, 2, 3}' },
      { label: 'merged size', value: '4' },
      { label: 'cntMax (=3)', value: '1', tone: 'violet' },
    ],
    caption: 'Union node 1 (val 3) with the existing component {0, 2, 3}. The merged component {0, 1, 2, 3} has new max 3, and cntMax = 1 (only node 1). The old cntMax of value 2 is overwritten — anything with value <= 2 in this component cannot start any future good path through this component without exceeding the value.',
  });

  // Union node 4 (val 3) with component containing 2 — same merged root
  ra = find(4); rb = find(2);
  // Before union, ra is {4} singleton with cntMax(=3) = 1.
  // rb is {0,1,2,3} with cntMax(=3) = 1.
  // Both at value 3 -> merged cntMax = 1 + 1 = 2.
  parent[ra] = rb; size[rb] += size[ra];
  cntMax[rb] = 2;
  frames.push({
    array: labels.slice(),
    highlights: { 4: 'current', 1: 'match' },
    chip: [
      { label: 'union', value: '4 with mega-component' },
      { label: 'merged size', value: '5 (all nodes)' },
      { label: 'cntMax (=3)', value: '2 (nodes 1 and 4)', tone: 'pink' },
    ],
    caption: 'Union node 4 (val 3) into the mega-component {0, 1, 2, 3}. Both sides have max = 3, so we sum their value-3 counts: 1 + 1 = 2. The merged component holds 2 nodes of value 3 (nodes 1 and 4).',
  });

  // Layer-3 contribution: C(2,2) + 2 = 1 + 2 = 3 (the singletons {1}, {4}, and pair (1,4)).
  good += 3;
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'layer v=3 done', value: 'good += C(2,2)+2 = 3', tone: 'violet' },
      { label: 'pair (1,4)', value: 'path 1-0-2-4, max=3 -> good', tone: 'pink' },
      { label: 'good total', value: String(good) },
    ],
    caption: 'Layer 3 contribution: cntMax = 2, so we add C(2, 2) + 2 = 1 + 2 = 3 good paths. The 2 singletons {1} and {4}, plus the pair (1, 4) — the path 1-0-2-4 has values 3, 1, 2, 3 with max 3 matching the endpoints. Good. good = 6.',
  });

  // Final tally
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'good (singletons)', value: '5' },
      { label: 'good (pairs)', value: '1 (only (1,4))' },
      { label: 'total', value: '6', tone: 'pink' },
    ],
    caption: 'Final answer: 6 good paths. 5 trivial (one per node) + 1 non-trivial (the (1, 4) pair). Note we never enumerated paths — the union-find layer-by-layer simulation guarantees that any pair counted has its connecting path entirely <= the shared value.',
  });

  // Why ascending order works
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'invariant', value: 'when processing layer v', tone: 'violet' },
      { label: 'every active edge', value: 'connects nodes with val <= v' },
      { label: 'so', value: 'any path in DSU has max <= v', tone: 'pink' },
    ],
    caption: 'Invariant: when processing layer v, the DSU contains only nodes with value <= v, and unions are performed only along edges where both endpoints are active (both <= v). Therefore the path between any two connected nodes has max value <= v. If two value-v nodes are connected at this moment, their path max = v -> good.',
  });

  // Complexity frame
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'sort nodes', value: 'O(n log n)' },
      { label: 'union-find', value: 'O((n + m) alpha(n))' },
      { label: 'total', value: 'O(n log n + m alpha(n))', tone: 'pink' },
    ],
    caption: 'Complexity: O(n log n) to sort nodes by value, plus O((n + m) alpha(n)) for the union-find operations (alpha is the near-constant inverse Ackermann). For a tree m = n-1, so the bound is effectively O(n log n). Compare to O(n^3) brute force.',
  });

  // Edge enumeration trick
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'alt: sort edges', value: 'by max-endpoint-value', tone: 'violet' },
      { label: 'process edges in order', value: 'union lazily' },
      { label: 'same answer', value: 'O(m log m) variant' },
    ],
    caption: 'Equivalent formulation: sort edges by max(vals[a], vals[b]) ascending; process each edge in order, union its endpoints; when all edges with max-value equal to v have been processed, count contributions from each component with at least one value-v node. Same complexity, sometimes cleaner to implement.',
  });

  // Common bug
  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'pitfall', value: 'cntMax overwrite, not sum', tone: 'pink' },
      { label: 'when sums?', value: 'only if both maxes == current v' },
      { label: 'else', value: 'reset to the new-node count' },
    ],
    caption: 'Common bug: when unioning, blindly adding cntMax values. Wrong — sum only when both components have max == current layer v. If one component had max < v (older value), its cntMax is now irrelevant; reset. The cleanest implementation tracks per-root max-value alongside cntMax.',
  });

  frames.push({
    array: labels.slice(),
    chip: [
      { label: 'final answer', value: '6', tone: 'pink' },
      { label: 'layers processed', value: '3 (v=1, v=2, v=3)' },
      { label: 'union ops', value: '4', tone: 'violet' },
    ],
    caption: 'Done. 6 good paths found via 4 union operations across 3 value layers. The algorithm never visits the same edge twice and never enumerates a path explicitly — all the geometry collapses into the union-find sequence.',
  });

  return { renderer: 'array', title: 'Number of Good Paths — sort by value + union-find, O(n log n)', frames };
}

function longestRepeatingViz() {
  // Segment tree over s = "babacc". Two queries: replace s[3] with 'b' -> "babbcc"; then s[1] with 'b' -> "bbbbcc".
  // Each segtree node stores: prefix run, suffix run, best run, leftChar, rightChar, length.
  const s0 = 'babacc';
  const queryChars = 'bb';
  const queryIdx = [3, 1];
  const frames = [];

  frames.push({
    array: s0.split(''),
    chip: [
      { label: 's', value: '"' + s0 + '"' },
      { label: 'queries', value: '2' },
      { label: 'answer', value: 'longest 1-char run per query', tone: 'violet' },
    ],
    caption: 'Given a string and a sequence of point updates, after each update report the length of the longest substring consisting of a single repeating character. Naively re-scan after every update -> O(q * n). For q = n = 10^5, thats 10^10 ops. A segment tree augmented with prefix/suffix/best runs answers each query in O(log n) by merging adjacent segment summaries.',
  });

  // Initial scan baseline
  frames.push({
    array: s0.split(''),
    chip: [
      { label: 'naive scan', value: '"b a b a c c"' },
      { label: 'runs', value: '1, 1, 1, 1, 2', tone: 'violet' },
      { label: 'longest', value: '2 ("cc")', tone: 'pink' },
    ],
    caption: 'Baseline naive scan of "babacc": run lengths are b=1, a=1, b=1, a=1, cc=2. Longest = 2. We will reproduce this with a segment tree before any updates, then incrementally answer after each char swap.',
  });

  // Segment tree structure
  frames.push({
    array: s0.split(''),
    chip: [
      { label: 'node stores', value: 'pref, suff, best, lch, rch, len', tone: 'violet' },
      { label: 'merge', value: 'glue when rch(L) == lch(R)' },
      { label: 'size', value: '4n nodes (~24 here)' },
    ],
    caption: 'Each segment-tree node stores 6 fields: prefix-run length, suffix-run length, best-run length, leftmost char, rightmost char, segment length. Merge rule: parent.best = max(left.best, right.best, gluedRun) where gluedRun = left.suffix + right.prefix iff left.rightChar == right.leftChar.',
  });

  // Build leaf level
  frames.push({
    array: s0.split(''),
    highlights: { 0: 'leaf', 1: 'leaf', 2: 'leaf', 3: 'leaf', 4: 'leaf', 5: 'leaf' },
    chip: [
      { label: 'leaves', value: '6 nodes' },
      { label: 'each leaf', value: 'pref=suff=best=1', tone: 'violet' },
      { label: 'lch=rch', value: 's[i]' },
    ],
    caption: 'Build phase, leaf level: 6 leaves, one per character. Each leaf: prefix = suffix = best = 1, leftChar = rightChar = s[i], len = 1.',
  });

  // Merge pairs at level 1: [b,a], [b,a], [c,c]
  frames.push({
    array: s0.split(''),
    highlights: { 0: 'merge', 1: 'merge', 2: 'merge', 3: 'merge', 4: 'match', 5: 'match' },
    chip: [
      { label: 'merge [b,a]', value: 'best=1, pref=1, suff=1', tone: 'violet' },
      { label: 'merge [b,a]', value: 'best=1, pref=1, suff=1' },
      { label: 'merge [c,c]', value: 'best=2, pref=2, suff=2', tone: 'pink' },
    ],
    caption: 'Level 1 merges: [b, a] -> different chars, no glue, best=1, prefix=1, suffix=1. [b, a] -> same. [c, c] -> SAME chars, glue! prefix = 1 + 1 = 2, suffix = 1 + 1 = 2, best = 2. This is where the "cc" run gets discovered.',
  });

  // Level 2: merge [ba][ba] and [cc]
  frames.push({
    array: s0.split(''),
    highlights: { 0: 'merge', 1: 'merge', 2: 'merge', 3: 'merge' },
    chip: [
      { label: 'merge [ba][ba]', value: 'rch=a, lch=b -> no glue' },
      { label: 'result [baba]', value: 'best=1, pref=1, suff=1', tone: 'violet' },
      { label: '[cc] unchanged', value: 'best=2' },
    ],
    caption: 'Level 2: merge [ba][ba] -> right char of left is "a", left char of right is "b", different, no glue. Result [baba]: best = max(1, 1) = 1. [cc] stays at best = 2.',
  });

  // Root: merge [baba][cc]
  frames.push({
    array: s0.split(''),
    chip: [
      { label: 'root merge [baba][cc]', value: 'rch=a, lch=c -> no glue', tone: 'violet' },
      { label: 'root.best', value: 'max(1, 2) = 2', tone: 'pink' },
      { label: 'answer[0] before queries', value: '2' },
    ],
    caption: 'Root merge [baba][cc]: right char "a" vs left char "c", no glue. root.best = max(left.best=1, right.best=2) = 2. Initial longest run = 2 — matches the naive scan.',
  });

  // Query 1: s[3] = 'b' -> "babbcc"
  const s1 = s0.split('');
  s1[3] = 'b';
  frames.push({
    array: s1.slice(),
    highlights: { 3: 'flip' },
    chip: [
      { label: 'query 1', value: 's[3] = b' },
      { label: 's becomes', value: '"' + s1.join('') + '"' },
      { label: 'recompute on path', value: 'leaf 3 -> root, O(log n)', tone: 'violet' },
    ],
    caption: 'Query 1: replace s[3] with "b". String becomes "babbcc". Update the leaf at index 3, then re-merge along the path back to the root — O(log n) = 3 levels in this tree.',
  });

  // Update leaf 3: now char 'b'
  frames.push({
    array: s1.slice(),
    highlights: { 3: 'leaf' },
    chip: [
      { label: 'leaf 3', value: 'lch=rch=b, best=1' },
      { label: 'sibling leaf 2', value: 'lch=rch=b, best=1' },
      { label: 're-merge [s2,s3]', value: 'both b -> glue', tone: 'pink' },
    ],
    caption: 'Leaf 3 now stores char "b". Sibling leaf 2 already had "b". Re-merge them: same chars, glue! prefix=2, suffix=2, best=2 for the segment covering indices 2..3.',
  });

  // Re-merge level 2 left: [ba][bb]
  frames.push({
    array: s1.slice(),
    highlights: { 0: 'merge', 1: 'merge', 2: 'merge', 3: 'merge' },
    chip: [
      { label: 're-merge [ba][bb]', value: 'rch=a vs lch=b -> no glue' },
      { label: 'left.suff=1, right.pref=2', value: 'best=max(1,2)=2', tone: 'violet' },
      { label: 'segment [baba->babb]', value: 'best=2' },
    ],
    caption: 'Level 2 left half: merge [ba] with [bb]. Right char of left is "a", left char of right is "b" — no glue across the boundary. But the right child has best=2 internally (the "bb"). Segment [0..3] best = max(1, 2) = 2.',
  });

  // Re-merge root
  frames.push({
    array: s1.slice(),
    chip: [
      { label: 'root re-merge', value: '[babb][cc]', tone: 'violet' },
      { label: 'rch=b vs lch=c', value: 'no glue' },
      { label: 'root.best', value: 'max(2, 2) = 2', tone: 'pink' },
    ],
    caption: 'Root re-merge: [babb][cc]. Right char "b" vs left char "c" — no glue. root.best = max(2, 2) = 2. Answer after query 1 is 2.',
  });

  // Query 2: s[1] = 'b' -> "bbbbcc"
  const s2 = s1.slice();
  s2[1] = 'b';
  frames.push({
    array: s2.slice(),
    highlights: { 1: 'flip' },
    chip: [
      { label: 'query 2', value: 's[1] = b' },
      { label: 's becomes', value: '"' + s2.join('') + '"' },
      { label: 'expect', value: '"bbbb" -> best = 4', tone: 'pink' },
    ],
    caption: 'Query 2: replace s[1] with "b". String becomes "bbbbcc". We expect the longest run to jump to 4 (the new "bbbb" prefix).',
  });

  // Update leaf 1, re-merge [bb] at level 1
  frames.push({
    array: s2.slice(),
    highlights: { 0: 'merge', 1: 'merge' },
    chip: [
      { label: 'leaf 1', value: 'now b' },
      { label: 're-merge [s0,s1]', value: 'both b -> glue', tone: 'pink' },
      { label: 'segment [bb]', value: 'pref=2, suff=2, best=2' },
    ],
    caption: 'Leaf 1 updated to "b". Merge [s0, s1]: both "b", glue. Segment 0..1: prefix=2, suffix=2, best=2, lch=b, rch=b.',
  });

  // Re-merge level 2 left: [bb][bb]
  frames.push({
    array: s2.slice(),
    highlights: { 0: 'merge', 1: 'merge', 2: 'merge', 3: 'merge' },
    chip: [
      { label: 're-merge [bb][bb]', value: 'rch=b == lch=b -> GLUE!', tone: 'pink' },
      { label: 'left.suff + right.pref', value: '2 + 2 = 4', tone: 'violet' },
      { label: 'segment [0..3]', value: 'pref=4, suff=4, best=4' },
    ],
    caption: 'Level 2 left: merge [bb][bb]. Right char of left is "b", left char of right is "b" — GLUE. Glued run = left.suffix(2) + right.prefix(2) = 4. Since both children are entirely "b", the prefix and suffix of the parent also become 4. segment[0..3].best = max(2, 2, 4) = 4.',
  });

  // Re-merge root
  frames.push({
    array: s2.slice(),
    chip: [
      { label: 'root re-merge', value: '[bbbb][cc]' },
      { label: 'rch=b vs lch=c', value: 'no glue' },
      { label: 'root.best', value: 'max(4, 2) = 4', tone: 'pink' },
    ],
    caption: 'Root re-merge: [bbbb][cc]. Right char "b" of left vs left char "c" of right — no glue. root.best = max(4, 2) = 4. Answer after query 2 is 4.',
  });

  // Why merging works
  frames.push({
    array: s2.slice(),
    chip: [
      { label: 'merge invariant', value: 'best is one of 3 things', tone: 'violet' },
      { label: '1) entirely in left', value: 'left.best' },
      { label: '2) entirely in right', value: 'right.best' },
      { label: '3) spans the boundary', value: 'left.suff + right.pref iff chars match', tone: 'pink' },
    ],
    caption: 'Merge correctness: any single-char run in the parent segment is one of three forms — entirely inside the left child (covered by left.best), entirely inside the right child (right.best), or spanning the boundary (only possible when left.rightChar == right.leftChar, length = left.suffix + right.prefix). Take the max. Prefix/suffix at the parent need similar care: parent.prefix = left.prefix, *plus* right.prefix if left is monochromatic and the chars match.',
  });

  // Complexity
  frames.push({
    array: s2.slice(),
    chip: [
      { label: 'build', value: 'O(n)' },
      { label: 'per update', value: 'O(log n)' },
      { label: 'q updates', value: 'O(n + q log n)', tone: 'pink' },
    ],
    caption: 'Complexity: O(n) to build the tree, O(log n) per update (one leaf write + log n re-merges along the path). Total: O(n + q log n). For n = q = 10^5, thats ~10^6 ops — comfortable.',
  });

  // Edge case
  frames.push({
    array: s2.slice(),
    chip: [
      { label: 'no-op update', value: 's[i] = same char', tone: 'violet' },
      { label: 'still O(log n)', value: 'unchanged work upward' },
      { label: 'safe to skip', value: 'small constant win' },
    ],
    caption: 'Edge case: if queryChar[k] equals the current s[queryIdx[k]], nothing changes and the answer is the previous one. Detecting and skipping is a small constant-factor win — the algorithm is correct either way.',
  });

  // Implementation note
  frames.push({
    array: s2.slice(),
    chip: [
      { label: 'iterative segtree', value: '~half the constant', tone: 'violet' },
      { label: 'leaves at idx >= n', value: 'pad n to next power of 2' },
      { label: 'merge by parent = i >> 1', value: 'bottom-up update' },
    ],
    caption: 'Implementation tip: iterative bottom-up segment trees beat recursive by roughly 2x in practice. Allocate 2 * next_pow_of_2(n) slots, leaves at indices n..2n-1, build top-down by merging pairs, update by overwriting a leaf and re-merging parents via parent = i >> 1 until you hit the root.',
  });

  frames.push({
    array: s2.slice(),
    chip: [
      { label: 'answers', value: '[2, 4]', tone: 'pink' },
      { label: 'total ops', value: '~12 merges over 2 queries' },
      { label: 'vs naive', value: '2 * 6 = 12 here; gap widens at scale', tone: 'violet' },
    ],
    caption: 'Final result: answers = [2, 4]. At n = 6 the segment tree barely beats the naive scan; the asymptotic win shows up at n = 10^5 where naive does 10^10 ops and the tree does ~10^6. This is the canonical "augmented segment tree" pattern — store enough per-node state to merge incrementally.',
  });

  return { renderer: 'array', title: 'Longest Substring of One Repeating Character — segment tree, O((n+q) log n)', frames };
}

`;

const ENTRY_BLOCK = `  'reorder-routes-to-make-all-paths-lead-to-the-city-zero': {
    tags: ['graph', 'breadth-first-search', 'depth-first-search', 'tree'],
    companies: ['amazon', 'google', 'microsoft', 'meta', 'apple', 'uber', 'bloomberg'],
    viz: minReorderViz(),
    solutions: {
      python: {
        code: \`from collections import deque

class Solution:
    def minReorder(self, n, connections):
        # adj[u] = list of (v, sign): sign=1 means original edge u -> v (outward from u)
        adj = [[] for _ in range(n)]
        for a, b in connections:
            adj[a].append((b, 1))
            adj[b].append((a, 0))

        visited = [False] * n
        visited[0] = True
        q = deque([0])
        flips = 0
        while q:
            u = q.popleft()
            for v, sign in adj[u]:
                if visited[v]:
                    continue
                visited[v] = True
                flips += sign  # sign=1 -> wrong direction, must flip
                q.append(v)
        return flips\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'BFS from city 0 on the undirected graph. Encode each edge with a sign bit: 1 if the stored direction matches the original (outward when discovered from u), 0 if reversed. Every discovery edge contributes its sign to the flip count. Tree structure guarantees each edge is a discovery edge exactly once, so the greedy sum is optimal.',
      },
      javascript: {
        code: \`function minReorder(n, connections) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of connections) {
    adj[a].push([b, 1]);
    adj[b].push([a, 0]);
  }
  const visited = new Array(n).fill(false);
  visited[0] = true;
  const queue = [0];
  let flips = 0;
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    for (const [v, sign] of adj[u]) {
      if (visited[v]) continue;
      visited[v] = true;
      flips += sign;
      queue.push(v);
    }
  }
  return flips;
}\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Array-as-queue with an index pointer beats Array.prototype.shift (which is O(n) per call in V8). The sign bit on adjacency entries is the entire algorithm — no explicit direction tracking needed during BFS.',
      },
      java: {
        code: \`import java.util.*;

class Solution {
    public int minReorder(int n, int[][] connections) {
        List<int[]>[] adj = new List[n];
        for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
        for (int[] e : connections) {
            adj[e[0]].add(new int[]{e[1], 1});
            adj[e[1]].add(new int[]{e[0], 0});
        }
        boolean[] visited = new boolean[n];
        visited[0] = true;
        Deque<Integer> queue = new ArrayDeque<>();
        queue.offer(0);
        int flips = 0;
        while (!queue.isEmpty()) {
            int u = queue.poll();
            for (int[] nb : adj[u]) {
                if (visited[nb[0]]) continue;
                visited[nb[0]] = true;
                flips += nb[1];
                queue.offer(nb[0]);
            }
        }
        return flips;
    }
}\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'ArrayDeque outperforms LinkedList for BFS queues — better cache locality, no per-node allocation. Edge stored as int[2] to avoid boxing.',
      },
      cpp: {
        code: \`#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    int minReorder(int n, vector<vector<int>>& connections) {
        vector<vector<pair<int,int>>> adj(n);
        for (auto& e : connections) {
            adj[e[0]].push_back({e[1], 1});
            adj[e[1]].push_back({e[0], 0});
        }
        vector<bool> visited(n, false);
        visited[0] = true;
        queue<int> q;
        q.push(0);
        int flips = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (auto& [v, sign] : adj[u]) {
                if (visited[v]) continue;
                visited[v] = true;
                flips += sign;
                q.push(v);
            }
        }
        return flips;
    }
};\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Structured binding (auto& [v, sign]) keeps the inner loop terse. std::queue over deque gives FIFO semantics with cheap push/pop. vector<bool> is the compact specialization — fine here since we never take addresses.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <stdbool.h>

typedef struct { int v; int sign; } Edge;
typedef struct { Edge* arr; int cap; int len; } EdgeList;

static void push_edge(EdgeList* l, int v, int sign) {
    if (l->len == l->cap) {
        l->cap = l->cap ? l->cap * 2 : 4;
        l->arr = (Edge*)realloc(l->arr, l->cap * sizeof(Edge));
    }
    l->arr[l->len++] = (Edge){v, sign};
}

int minReorder(int n, int** connections, int connectionsSize, int* connectionsColSize) {
    EdgeList* adj = (EdgeList*)calloc(n, sizeof(EdgeList));
    for (int i = 0; i < connectionsSize; i++) {
        int a = connections[i][0], b = connections[i][1];
        push_edge(&adj[a], b, 1);
        push_edge(&adj[b], a, 0);
    }
    bool* visited = (bool*)calloc(n, sizeof(bool));
    int* queue = (int*)malloc(n * sizeof(int));
    int head = 0, tail = 0;
    visited[0] = true;
    queue[tail++] = 0;
    int flips = 0;
    while (head < tail) {
        int u = queue[head++];
        for (int j = 0; j < adj[u].len; j++) {
            int v = adj[u].arr[j].v, sign = adj[u].arr[j].sign;
            if (visited[v]) continue;
            visited[v] = true;
            flips += sign;
            queue[tail++] = v;
        }
    }
    for (int i = 0; i < n; i++) free(adj[i].arr);
    free(adj); free(visited); free(queue);
    return flips;
}\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Manual adjacency growth via doubling realloc — same amortized O(1) push as C++ vector. Fixed-size queue allocated to n upfront (BFS on a tree never exceeds n entries).',
      },
      go: {
        code: \`func minReorder(n int, connections [][]int) int {
    type edge struct{ to, sign int }
    adj := make([][]edge, n)
    for _, e := range connections {
        adj[e[0]] = append(adj[e[0]], edge{e[1], 1})
        adj[e[1]] = append(adj[e[1]], edge{e[0], 0})
    }
    visited := make([]bool, n)
    visited[0] = true
    queue := []int{0}
    flips := 0
    for len(queue) > 0 {
        u := queue[0]
        queue = queue[1:]
        for _, nb := range adj[u] {
            if visited[nb.to] {
                continue
            }
            visited[nb.to] = true
            flips += nb.sign
            queue = append(queue, nb.to)
        }
    }
    return flips
}\`,
        complexity: { time: 'O(n)', space: 'O(n)' },
        approach: 'Local struct type for edges — compact and avoids any heap escape for the pair. Slice-as-queue with queue[1:] resliced each pop; Go runtime reuses the underlying array so this is cheap in practice.',
      },
    },
  },
  'number-of-good-paths': {
    tags: ['array', 'tree', 'graph', 'union-find', 'sorting'],
    companies: ['amazon', 'google', 'meta', 'microsoft', 'bloomberg', 'apple'],
    viz: numberOfGoodPathsViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def numberOfGoodPaths(self, vals, edges):
        n = len(vals)
        adj = [[] for _ in range(n)]
        for a, b in edges:
            adj[a].append(b)
            adj[b].append(a)

        parent = list(range(n))
        # cnt[r] = how many nodes in component rooted at r equal the component's max value
        cnt = [1] * n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        # Sort node indices by value ascending
        order = sorted(range(n), key=lambda i: vals[i])

        good = 0
        # Group by value (process all nodes with the same value together)
        i = 0
        while i < n:
            j = i
            v = vals[order[i]]
            while j < n and vals[order[j]] == v:
                j += 1
            # Activate nodes order[i..j-1] all at value v
            for k in range(i, j):
                u = order[k]
                for nb in adj[u]:
                    if vals[nb] <= v:  # neighbor already activated (or same layer)
                        ru, rn = find(u), find(nb)
                        if ru != rn:
                            # Merge: new cnt = sum of contributors that have max == v
                            new_cnt = 0
                            if vals[ru] if False else True:  # ru's max is v (since ru is u itself or merged into v-layer)
                                pass
                            # Track max-value per root via parent's vals[root] proxy:
                            # the root index's val == component max because we only merge
                            # into roots whose val <= current v, and we always set root = node with larger val (or current v).
                            # Simpler model: re-anchor root to have val == v.
                            parent[rn] = ru
                            # If the other root already had max == v, sum counts; else reset to current.
                            if vals[rn] == v:
                                cnt[ru] += cnt[rn]
                            # else cnt[ru] keeps its current value (rn's contribution was for a smaller max, irrelevant now)
            # End of layer: tally good paths from each distinct root that contains a value-v node
            seen_roots = set()
            for k in range(i, j):
                r = find(order[k])
                if r in seen_roots:
                    continue
                seen_roots.add(r)
                c = cnt[r]
                good += c * (c + 1) // 2  # C(c, 2) + c = c*(c-1)/2 + c
            i = j
        return good\`,
        complexity: { time: 'O(n log n alpha(n))', space: 'O(n)' },
        approach: 'Process nodes in ascending value order. Maintain a union-find where each root tracks how many of its nodes equal the current layers value. When activating layer v, union each new nodes already-active neighbors (their values <= v). After unions settle, each distinct root that contains at least one value-v node contributes C(c, 2) + c good paths where c is its value-v count. Trees with smaller max-values in the same merged component get their counts reset, because future good paths through them must have shared value > v.',
      },
      javascript: {
        code: \`function numberOfGoodPaths(vals, edges) {
  const n = vals.length;
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }

  const parent = Array.from({ length: n }, (_, i) => i);
  const rootMax = vals.slice();   // root's component max value
  const cntMax = new Array(n).fill(1);

  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };

  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => vals[a] - vals[b]);
  let good = 0;
  let i = 0;
  while (i < n) {
    let j = i;
    const v = vals[order[i]];
    while (j < n && vals[order[j]] === v) j++;
    for (let k = i; k < j; k++) {
      const u = order[k];
      for (const nb of adj[u]) {
        if (vals[nb] > v) continue;
        const ru = find(u), rn = find(nb);
        if (ru === rn) continue;
        // Union — make ru the parent
        parent[rn] = ru;
        const sum = (rootMax[ru] === v ? cntMax[ru] : 0) + (rootMax[rn] === v ? cntMax[rn] : 0);
        rootMax[ru] = v;
        cntMax[ru] = sum;
      }
    }
    const seen = new Set();
    for (let k = i; k < j; k++) {
      const r = find(order[k]);
      if (seen.has(r)) continue;
      seen.add(r);
      const c = cntMax[r];
      good += c * (c + 1) / 2;
    }
    i = j;
  }
  return good;
}\`,
        complexity: { time: 'O(n log n alpha(n))', space: 'O(n)' },
        approach: 'rootMax[r] stores each components current max value; cntMax[r] stores how many nodes in it equal that max. On union, if both sides have max == current v, sum their cntMax; otherwise reset to the contributing side. The C(c, 2) + c = c*(c+1)/2 closed form counts singletons + pairs in one expression.',
      },
      java: {
        code: \`import java.util.*;

class Solution {
    int[] parent, rootMax, cntMax;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    public int numberOfGoodPaths(int[] vals, int[][] edges) {
        int n = vals.length;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        parent = new int[n];
        rootMax = vals.clone();
        cntMax = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; cntMax[i] = 1; }
        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> Integer.compare(vals[a], vals[b]));
        int good = 0;
        int i = 0;
        while (i < n) {
            int j = i, v = vals[order[i]];
            while (j < n && vals[order[j]] == v) j++;
            for (int k = i; k < j; k++) {
                int u = order[k];
                for (int nb : adj.get(u)) {
                    if (vals[nb] > v) continue;
                    int ru = find(u), rn = find(nb);
                    if (ru == rn) continue;
                    parent[rn] = ru;
                    int sum = (rootMax[ru] == v ? cntMax[ru] : 0) + (rootMax[rn] == v ? cntMax[rn] : 0);
                    rootMax[ru] = v;
                    cntMax[ru] = sum;
                }
            }
            Set<Integer> seen = new HashSet<>();
            for (int k = i; k < j; k++) {
                int r = find(order[k]);
                if (!seen.add(r)) continue;
                int c = cntMax[r];
                good += c * (c + 1) / 2;
            }
            i = j;
        }
        return good;
    }
}\`,
        complexity: { time: 'O(n log n alpha(n))', space: 'O(n)' },
        approach: 'Integer[] boxed-array sort lets us use a comparator on values without writing index-by-value lookup. cntMax / rootMax kept as primitive int[] for speed — DSU operations are hot loop.',
      },
      cpp: {
        code: \`#include <vector>
#include <numeric>
#include <algorithm>
#include <unordered_set>
using namespace std;

class Solution {
public:
    vector<int> parent, rootMax, cntMax;
    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    int numberOfGoodPaths(vector<int>& vals, vector<vector<int>>& edges) {
        int n = vals.size();
        vector<vector<int>> adj(n);
        for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
        parent.resize(n); iota(parent.begin(), parent.end(), 0);
        rootMax = vals;
        cntMax.assign(n, 1);
        vector<int> order(n); iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b){ return vals[a] < vals[b]; });
        int good = 0;
        int i = 0;
        while (i < n) {
            int j = i, v = vals[order[i]];
            while (j < n && vals[order[j]] == v) j++;
            for (int k = i; k < j; k++) {
                int u = order[k];
                for (int nb : adj[u]) {
                    if (vals[nb] > v) continue;
                    int ru = find(u), rn = find(nb);
                    if (ru == rn) continue;
                    parent[rn] = ru;
                    int sum = (rootMax[ru] == v ? cntMax[ru] : 0) + (rootMax[rn] == v ? cntMax[rn] : 0);
                    rootMax[ru] = v;
                    cntMax[ru] = sum;
                }
            }
            unordered_set<int> seen;
            for (int k = i; k < j; k++) {
                int r = find(order[k]);
                if (!seen.insert(r).second) continue;
                int c = cntMax[r];
                good += c * (c + 1) / 2;
            }
            i = j;
        }
        return good;
    }
};\`,
        complexity: { time: 'O(n log n alpha(n))', space: 'O(n)' },
        approach: 'iota fills sequential ranges; sort with a lambda on vals orders nodes by value. unordered_set::insert returns a pair where .second is the inserted flag — concise dedupe of layer roots.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <string.h>

static int* g_vals;
static int cmp_idx(const void* a, const void* b) {
    int ia = *(const int*)a, ib = *(const int*)b;
    return g_vals[ia] - g_vals[ib];
}

static int* g_parent;
static int find(int x) {
    while (g_parent[x] != x) { g_parent[x] = g_parent[g_parent[x]]; x = g_parent[x]; }
    return x;
}

int numberOfGoodPaths(int* vals, int valsSize, int** edges, int edgesSize, int* edgesColSize) {
    int n = valsSize;
    int** adj = (int**)calloc(n, sizeof(int*));
    int* adjLen = (int*)calloc(n, sizeof(int));
    int* adjCap = (int*)calloc(n, sizeof(int));
    for (int i = 0; i < edgesSize; i++) {
        int a = edges[i][0], b = edges[i][1];
        if (adjLen[a] == adjCap[a]) { adjCap[a] = adjCap[a] ? adjCap[a]*2 : 4; adj[a] = (int*)realloc(adj[a], adjCap[a]*sizeof(int)); }
        adj[a][adjLen[a]++] = b;
        if (adjLen[b] == adjCap[b]) { adjCap[b] = adjCap[b] ? adjCap[b]*2 : 4; adj[b] = (int*)realloc(adj[b], adjCap[b]*sizeof(int)); }
        adj[b][adjLen[b]++] = a;
    }
    g_parent = (int*)malloc(n*sizeof(int));
    int* rootMax = (int*)malloc(n*sizeof(int));
    int* cntMax = (int*)malloc(n*sizeof(int));
    for (int i = 0; i < n; i++) { g_parent[i] = i; rootMax[i] = vals[i]; cntMax[i] = 1; }
    int* order = (int*)malloc(n*sizeof(int));
    for (int i = 0; i < n; i++) order[i] = i;
    g_vals = vals;
    qsort(order, n, sizeof(int), cmp_idx);
    int good = 0;
    int* seen = (int*)malloc(n*sizeof(int));
    int i = 0;
    while (i < n) {
        int j = i, v = vals[order[i]];
        while (j < n && vals[order[j]] == v) j++;
        for (int k = i; k < j; k++) {
            int u = order[k];
            for (int t = 0; t < adjLen[u]; t++) {
                int nb = adj[u][t];
                if (vals[nb] > v) continue;
                int ru = find(u), rn = find(nb);
                if (ru == rn) continue;
                g_parent[rn] = ru;
                int sum = (rootMax[ru] == v ? cntMax[ru] : 0) + (rootMax[rn] == v ? cntMax[rn] : 0);
                rootMax[ru] = v;
                cntMax[ru] = sum;
            }
        }
        int seenLen = 0;
        for (int k = i; k < j; k++) {
            int r = find(order[k]);
            int dup = 0;
            for (int t = 0; t < seenLen; t++) if (seen[t] == r) { dup = 1; break; }
            if (dup) continue;
            seen[seenLen++] = r;
            int c = cntMax[r];
            good += c * (c + 1) / 2;
        }
        i = j;
    }
    for (int k = 0; k < n; k++) free(adj[k]);
    free(adj); free(adjLen); free(adjCap);
    free(g_parent); free(rootMax); free(cntMax); free(order); free(seen);
    return good;
}\`,
        complexity: { time: 'O(n log n alpha(n))', space: 'O(n)' },
        approach: 'Globals for comparator + find avoid passing them through qsorts function-pointer protocol. Per-layer dedupe uses linear scan because layer sizes are typically tiny — adding a hashset for asymptotic safety would balloon the code without measurable gain on LC-sized inputs.',
      },
      go: {
        code: \`import "sort"

func numberOfGoodPaths(vals []int, edges [][]int) int {
    n := len(vals)
    adj := make([][]int, n)
    for _, e := range edges {
        adj[e[0]] = append(adj[e[0]], e[1])
        adj[e[1]] = append(adj[e[1]], e[0])
    }
    parent := make([]int, n)
    rootMax := make([]int, n)
    cntMax := make([]int, n)
    for i := 0; i < n; i++ {
        parent[i] = i
        rootMax[i] = vals[i]
        cntMax[i] = 1
    }
    var find func(int) int
    find = func(x int) int {
        for parent[x] != x {
            parent[x] = parent[parent[x]]
            x = parent[x]
        }
        return x
    }
    order := make([]int, n)
    for i := 0; i < n; i++ { order[i] = i }
    sort.Slice(order, func(a, b int) bool { return vals[order[a]] < vals[order[b]] })
    good := 0
    i := 0
    for i < n {
        j, v := i, vals[order[i]]
        for j < n && vals[order[j]] == v { j++ }
        for k := i; k < j; k++ {
            u := order[k]
            for _, nb := range adj[u] {
                if vals[nb] > v { continue }
                ru, rn := find(u), find(nb)
                if ru == rn { continue }
                parent[rn] = ru
                sum := 0
                if rootMax[ru] == v { sum += cntMax[ru] }
                if rootMax[rn] == v { sum += cntMax[rn] }
                rootMax[ru] = v
                cntMax[ru] = sum
            }
        }
        seen := make(map[int]bool)
        for k := i; k < j; k++ {
            r := find(order[k])
            if seen[r] { continue }
            seen[r] = true
            c := cntMax[r]
            good += c * (c + 1) / 2
        }
        i = j
    }
    return good
}\`,
        complexity: { time: 'O(n log n alpha(n))', space: 'O(n)' },
        approach: 'sort.Slice with a closure on vals keeps the comparator clean. Per-layer map allocation is acceptable — layer sizes are small on average. find is a closure so it captures parent without globals.',
      },
    },
  },
  'longest-substring-of-one-repeating-character': {
    tags: ['string', 'segment-tree', 'ordered-set'],
    companies: ['google', 'amazon', 'meta', 'microsoft', 'apple', 'bytedance'],
    viz: longestRepeatingViz(),
    solutions: {
      python: {
        code: \`class Solution:
    def longestRepeating(self, s, queryCharacters, queryIndices):
        n = len(s)
        arr = list(s)
        # Each tree node: [prefLen, sufLen, bestLen, lch, rch, segLen]
        size = 1
        while size < n:
            size *= 2
        # Flat array: index 1 = root, 2k/2k+1 children
        tree = [None] * (2 * size)

        def make_leaf(c):
            return [1, 1, 1, c, c, 1]

        def merge(left, right):
            if left is None: return right
            if right is None: return left
            lp, ls, lb, llch, lrch, llen = left
            rp, rs, rb, rlch, rrch, rlen = right
            new_pref = lp + (rp if lp == llen and lrch == rlch else 0)
            new_suf = rs + (ls if rs == rlen and lrch == rlch else 0)
            best = max(lb, rb)
            if lrch == rlch:
                best = max(best, ls + rp)
            return [new_pref, new_suf, best, llch, rrch, llen + rlen]

        # Build
        for i in range(n):
            tree[size + i] = make_leaf(arr[i])
        for i in range(size - 1, 0, -1):
            tree[i] = merge(tree[2 * i], tree[2 * i + 1])

        def update(i, c):
            arr[i] = c
            pos = size + i
            tree[pos] = make_leaf(c)
            pos //= 2
            while pos:
                tree[pos] = merge(tree[2 * pos], tree[2 * pos + 1])
                pos //= 2

        out = []
        for c, i in zip(queryCharacters, queryIndices):
            update(i, c)
            out.append(tree[1][2])  # root's bestLen
        return out\`,
        complexity: { time: 'O((n + q) log n)', space: 'O(n)' },
        approach: 'Iterative segment tree where each node stores six fields: prefix run, suffix run, best run, left char, right char, length. Merge: best = max(left.best, right.best, left.suffix + right.prefix iff chars match). Build in O(n), point update via overwrite-leaf + log-n re-merges back to root. Query just reads root.best.',
      },
      javascript: {
        code: \`function longestRepeating(s, queryCharacters, queryIndices) {
  const n = s.length;
  let size = 1;
  while (size < n) size *= 2;
  const tree = new Array(2 * size).fill(null);
  const makeLeaf = (c) => [1, 1, 1, c, c, 1];
  const merge = (L, R) => {
    if (!L) return R;
    if (!R) return L;
    const [lp, ls, lb, llch, lrch, llen] = L;
    const [rp, rs, rb, rlch, rrch, rlen] = R;
    const glue = lrch === rlch;
    const newPref = lp + (lp === llen && glue ? rp : 0);
    const newSuf = rs + (rs === rlen && glue ? ls : 0);
    let best = Math.max(lb, rb);
    if (glue) best = Math.max(best, ls + rp);
    return [newPref, newSuf, best, llch, rrch, llen + rlen];
  };
  for (let i = 0; i < n; i++) tree[size + i] = makeLeaf(s[i]);
  for (let i = size - 1; i > 0; i--) tree[i] = merge(tree[2 * i], tree[2 * i + 1]);
  const update = (i, c) => {
    let pos = size + i;
    tree[pos] = makeLeaf(c);
    pos >>= 1;
    while (pos) {
      tree[pos] = merge(tree[2 * pos], tree[2 * pos + 1]);
      pos >>= 1;
    }
  };
  const out = [];
  for (let k = 0; k < queryIndices.length; k++) {
    update(queryIndices[k], queryCharacters[k]);
    out.push(tree[1][2]);
  }
  return out;
}\`,
        complexity: { time: 'O((n + q) log n)', space: 'O(n)' },
        approach: 'Iterative bottom-up segment tree avoids recursion overhead — pure for-loops. Six-field node stored as a fixed-shape array for V8 hidden-class stability (faster than objects with named keys when nodes are recreated on every update).',
      },
      java: {
        code: \`class Solution {
    int size;
    int[][] tree; // each node: [pref, suf, best, lch, rch, len]

    private int[] leaf(int c) { return new int[]{1, 1, 1, c, c, 1}; }
    private int[] merge(int[] L, int[] R) {
        if (L == null) return R;
        if (R == null) return L;
        boolean glue = L[4] == R[3];
        int newPref = L[0] + (L[0] == L[5] && glue ? R[0] : 0);
        int newSuf = R[1] + (R[1] == R[5] && glue ? L[1] : 0);
        int best = Math.max(L[2], R[2]);
        if (glue) best = Math.max(best, L[1] + R[0]);
        return new int[]{newPref, newSuf, best, L[3], R[4], L[5] + R[5]};
    }

    public int[] longestRepeating(String s, String queryCharacters, int[] queryIndices) {
        int n = s.length();
        size = 1;
        while (size < n) size *= 2;
        tree = new int[2 * size][];
        for (int i = 0; i < n; i++) tree[size + i] = leaf(s.charAt(i));
        for (int i = size - 1; i > 0; i--) tree[i] = merge(tree[2*i], tree[2*i+1]);
        int q = queryIndices.length;
        int[] out = new int[q];
        for (int k = 0; k < q; k++) {
            int pos = size + queryIndices[k];
            tree[pos] = leaf(queryCharacters.charAt(k));
            pos >>= 1;
            while (pos > 0) {
                tree[pos] = merge(tree[2*pos], tree[2*pos+1]);
                pos >>= 1;
            }
            out[k] = tree[1][2];
        }
        return out;
    }
}\`,
        complexity: { time: 'O((n + q) log n)', space: 'O(n)' },
        approach: 'int[][] keeps each node as a 6-int row — minimum allocator pressure compared to object-per-node. char values stored as ints to avoid Character autoboxing in the merge condition.',
      },
      cpp: {
        code: \`#include <vector>
#include <string>
#include <algorithm>
using namespace std;

struct Node { int pref, suf, best, lch, rch, len; };

class Solution {
public:
    int sz;
    vector<Node> tree;
    Node leaf(int c) { return {1, 1, 1, c, c, 1}; }
    Node merge(const Node& L, const Node& R) {
        if (L.len == 0) return R;
        if (R.len == 0) return L;
        bool glue = (L.rch == R.lch);
        Node out;
        out.pref = L.pref + ((L.pref == L.len && glue) ? R.pref : 0);
        out.suf = R.suf + ((R.suf == R.len && glue) ? L.suf : 0);
        out.best = max(L.best, R.best);
        if (glue) out.best = max(out.best, L.suf + R.pref);
        out.lch = L.lch;
        out.rch = R.rch;
        out.len = L.len + R.len;
        return out;
    }
    vector<int> longestRepeating(string s, string queryCharacters, vector<int>& queryIndices) {
        int n = s.size();
        sz = 1;
        while (sz < n) sz *= 2;
        tree.assign(2 * sz, {0, 0, 0, 0, 0, 0});
        for (int i = 0; i < n; i++) tree[sz + i] = leaf(s[i]);
        for (int i = sz - 1; i > 0; i--) tree[i] = merge(tree[2*i], tree[2*i+1]);
        vector<int> out;
        out.reserve(queryIndices.size());
        for (size_t k = 0; k < queryIndices.size(); k++) {
            int pos = sz + queryIndices[k];
            tree[pos] = leaf(queryCharacters[k]);
            for (pos >>= 1; pos > 0; pos >>= 1) {
                tree[pos] = merge(tree[2*pos], tree[2*pos+1]);
            }
            out.push_back(tree[1].best);
        }
        return out;
    }
};\`,
        complexity: { time: 'O((n + q) log n)', space: 'O(n)' },
        approach: 'POD struct Node stays inline in the vector — no pointer chasing, ideal cache behavior. Empty-node sentinel uses len == 0; legitimate leaves always have len = 1.',
      },
      c: {
        code: \`#include <stdlib.h>
#include <string.h>

typedef struct { int pref, suf, best, lch, rch, len; } Node;

static int sz;
static Node* tree;

static Node make_leaf(int c) { Node n = {1, 1, 1, c, c, 1}; return n; }
static Node merge(Node L, Node R) {
    if (L.len == 0) return R;
    if (R.len == 0) return L;
    int glue = (L.rch == R.lch);
    Node out;
    out.pref = L.pref + ((L.pref == L.len && glue) ? R.pref : 0);
    out.suf = R.suf + ((R.suf == R.len && glue) ? L.suf : 0);
    out.best = L.best > R.best ? L.best : R.best;
    if (glue) {
        int g = L.suf + R.pref;
        if (g > out.best) out.best = g;
    }
    out.lch = L.lch;
    out.rch = R.rch;
    out.len = L.len + R.len;
    return out;
}

int* longestRepeating(char* s, char* queryCharacters, int* queryIndices, int queryIndicesSize, int* returnSize) {
    int n = strlen(s);
    sz = 1; while (sz < n) sz *= 2;
    tree = (Node*)calloc(2 * sz, sizeof(Node));
    for (int i = 0; i < n; i++) tree[sz + i] = make_leaf(s[i]);
    for (int i = sz - 1; i > 0; i--) tree[i] = merge(tree[2*i], tree[2*i+1]);
    int* out = (int*)malloc(queryIndicesSize * sizeof(int));
    for (int k = 0; k < queryIndicesSize; k++) {
        int pos = sz + queryIndices[k];
        tree[pos] = make_leaf(queryCharacters[k]);
        for (pos >>= 1; pos > 0; pos >>= 1) {
            tree[pos] = merge(tree[2*pos], tree[2*pos+1]);
        }
        out[k] = tree[1].best;
    }
    *returnSize = queryIndicesSize;
    free(tree);
    return out;
}\`,
        complexity: { time: 'O((n + q) log n)', space: 'O(n)' },
        approach: 'Stack-allocated Node returned by value — modern compilers RVO this so theres zero copy cost. Tree freed before return; the result int* is heap-allocated for the caller.',
      },
      go: {
        code: \`func longestRepeating(s string, queryCharacters string, queryIndices []int) []int {
    type Node struct{ pref, suf, best, lch, rch, length int }
    n := len(s)
    sz := 1
    for sz < n { sz *= 2 }
    tree := make([]Node, 2*sz)
    makeLeaf := func(c byte) Node { return Node{1, 1, 1, int(c), int(c), 1} }
    merge := func(L, R Node) Node {
        if L.length == 0 { return R }
        if R.length == 0 { return L }
        glue := L.rch == R.lch
        out := Node{lch: L.lch, rch: R.rch, length: L.length + R.length}
        out.pref = L.pref
        if L.pref == L.length && glue { out.pref += R.pref }
        out.suf = R.suf
        if R.suf == R.length && glue { out.suf += L.suf }
        out.best = L.best
        if R.best > out.best { out.best = R.best }
        if glue && L.suf+R.pref > out.best { out.best = L.suf + R.pref }
        return out
    }
    for i := 0; i < n; i++ { tree[sz+i] = makeLeaf(s[i]) }
    for i := sz - 1; i > 0; i-- { tree[i] = merge(tree[2*i], tree[2*i+1]) }
    out := make([]int, len(queryIndices))
    for k := 0; k < len(queryIndices); k++ {
        pos := sz + queryIndices[k]
        tree[pos] = makeLeaf(queryCharacters[k])
        for pos >>= 1; pos > 0; pos >>= 1 {
            tree[pos] = merge(tree[2*pos], tree[2*pos+1])
        }
        out[k] = tree[1].best
    }
    return out
}\`,
        complexity: { time: 'O((n + q) log n)', space: 'O(n)' },
        approach: 'Local struct + closures keep the whole solution self-contained. Go strings are immutable byte slices — direct s[i] access is O(1) and gives a byte, perfect for the leaf constructor.',
      },
    },
  },
`;

const VIZ_ANCHOR = "export const RICH_CONTENT = {";
const vizIdx = src.indexOf(VIZ_ANCHOR);
if (vizIdx < 0) {
  console.error('Could not find RICH_CONTENT anchor.');
  process.exit(1);
}

const openBracePos = src.indexOf('{', vizIdx);
let depth = 0, closeIdx = -1;
let p = openBracePos;
while (p < src.length) {
  const ch = src[p];
  const ch2 = src[p + 1];
  if (ch === '/' && ch2 === '/') {
    const nl = src.indexOf('\n', p + 2);
    p = nl < 0 ? src.length : nl + 1;
    continue;
  }
  if (ch === '/' && ch2 === '*') {
    const end = src.indexOf('*/', p + 2);
    p = end < 0 ? src.length : end + 2;
    continue;
  }
  if (ch === "'" || ch === '"') {
    const quote = ch;
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === quote) { p++; break; }
      p++;
    }
    continue;
  }
  if (ch === '`') {
    p++;
    while (p < src.length) {
      if (src[p] === '\\') { p += 2; continue; }
      if (src[p] === '`') { p++; break; }
      if (src[p] === '$' && src[p + 1] === '{') {
        p += 2;
        let nest = 1;
        while (p < src.length && nest > 0) {
          const c = src[p];
          if (c === '\\') { p += 2; continue; }
          if (c === "'" || c === '"') {
            const q = c; p++;
            while (p < src.length) {
              if (src[p] === '\\') { p += 2; continue; }
              if (src[p] === q) { p++; break; }
              p++;
            }
            continue;
          }
          if (c === '`') {
            p++;
            while (p < src.length && src[p] !== '`') {
              if (src[p] === '\\') { p += 2; continue; }
              p++;
            }
            p++;
            continue;
          }
          if (c === '{') nest++;
          else if (c === '}') nest--;
          p++;
        }
        continue;
      }
      p++;
    }
    continue;
  }
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) { closeIdx = p; break; }
  }
  p++;
}
if (closeIdx < 0) {
  console.error('Could not match RICH_CONTENT closing brace.');
  process.exit(1);
}

const before = src.slice(0, vizIdx);
const richBody = src.slice(openBracePos + 1, closeIdx);
const after = src.slice(closeIdx);

const out = before + VIZ_BLOCK + VIZ_ANCHOR + richBody + ENTRY_BLOCK + after;

fs.writeFileSync(FILE, out, 'utf8');
console.log('Spliced viz fns + 3 entries (reorder-routes, number-of-good-paths, longest-substring-of-one-repeating-character) into ' + path.basename(FILE));
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
