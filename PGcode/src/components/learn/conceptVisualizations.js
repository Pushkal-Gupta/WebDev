// Pre-baked visualization frame sets, keyed by concept slug.
// Used by ConceptPage to embed an interactive walkthrough next to the concept's
// "Intuition" section.

// Binary search for target in a sorted array, with explicit mid-pointer
// eviction animation and a per-step "active window" narration.
function binarySearchFrames(arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], target = 11) {
  const frames = [];
  let lo = 0, hi = arr.length - 1;
  const eliminated = new Set();

  const maxSteps = Math.ceil(Math.log2(arr.length + 1));
  frames.push({
    array: arr,
    eliminated: new Set(),
    caption: `Setup: we have a sorted array of ${arr.length} elements. The sort order is the only thing that lets us skip checking most of them.`,
  });
  frames.push({
    array: arr,
    eliminated: new Set(),
    caption: `Mission: locate the index of ${target} (or prove it isn't here) using as few comparisons as possible.`,
  });
  frames.push({
    array: arr,
    highlights: { [lo]: 'low', [hi]: 'high' },
    eliminated: new Set(),
    caption: `Anchor two pointers at the ends: lo = 0 marks the first candidate, hi = ${hi} marks the last. Everything between them is still "in play".`,
  });
  frames.push({
    array: arr,
    highlights: { [lo]: 'low', [hi]: 'high' },
    eliminated: new Set(),
    caption: `Core trick: probe the middle. The sort order then tells us whether the answer (if any) lies strictly left or strictly right — never both.`,
  });
  frames.push({
    array: arr,
    highlights: { [lo]: 'low', [hi]: 'high' },
    eliminated: new Set(),
    caption: `Cost intuition: each probe at minimum halves the remaining range, so we need at most ⌈log₂(n+1)⌉ = ${maxSteps} comparisons (vs up to ${arr.length} for a linear scan).`,
  });

  let stepNum = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    stepNum += 1;
    frames.push({
      array: arr,
      highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
      eliminated: new Set(eliminated),
      caption: `Step ${stepNum} — pick mid: mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}. We're about to read arr[${mid}].`,
    });
    frames.push({
      array: arr,
      highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
      eliminated: new Set(eliminated),
      caption: `Step ${stepNum} — read: arr[${mid}] = ${arr[mid]}. Compare against target ${target}.`,
    });
    if (arr[mid] === target) {
      frames.push({
        array: arr,
        highlights: { [mid]: 'match' },
        eliminated: new Set(eliminated),
        caption: `Step ${stepNum} — match: arr[${mid}] == ${target}. Return index ${mid} and stop.`,
      });
      frames.push({
        array: arr,
        highlights: { [mid]: 'match' },
        eliminated: new Set(eliminated),
        caption: `Done. Found ${target} at index ${mid} in ${stepNum} comparison${stepNum === 1 ? '' : 's'} (worst case for this size was ${maxSteps}).`,
      });
      break;
    }
    if (arr[mid] < target) {
      frames.push({
        array: arr,
        highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
        eliminated: new Set(eliminated),
        caption: `Step ${stepNum} — verdict: arr[${mid}] = ${arr[mid]} < ${target}. Every index ≤ ${mid} is ≤ ${arr[mid]} < ${target}, so the answer (if any) must be strictly to the right.`,
      });
      for (let k = lo; k <= mid; k++) eliminated.add(k);
      lo = mid + 1;
      frames.push({
        array: arr,
        highlights: { [lo]: lo <= hi ? 'low' : undefined, [hi]: hi >= lo ? 'high' : undefined },
        eliminated: new Set(eliminated),
        caption: `Step ${stepNum} — evict left half: indices 0..${mid} drop out. New range: lo = ${lo}, hi = ${hi} (${Math.max(0, hi - lo + 1)} candidate${hi - lo === 0 ? '' : 's'} left).`,
      });
    } else {
      frames.push({
        array: arr,
        highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
        eliminated: new Set(eliminated),
        caption: `Step ${stepNum} — verdict: arr[${mid}] = ${arr[mid]} > ${target}. Every index ≥ ${mid} is ≥ ${arr[mid]} > ${target}, so the answer (if any) must be strictly to the left.`,
      });
      for (let k = mid; k <= hi; k++) eliminated.add(k);
      hi = mid - 1;
      frames.push({
        array: arr,
        highlights: { [lo]: lo <= hi ? 'low' : undefined, [hi]: hi >= lo ? 'high' : undefined },
        eliminated: new Set(eliminated),
        caption: `Step ${stepNum} — evict right half: indices ${mid}..${arr.length - 1} drop out. New range: lo = ${lo}, hi = ${hi} (${Math.max(0, hi - lo + 1)} candidate${hi - lo === 0 ? '' : 's'} left).`,
      });
    }
  }
  const last = frames[frames.length - 1];
  if (!last || !/Found/.test(last.caption || '')) {
    frames.push({
      array: arr,
      highlights: {},
      eliminated: new Set(eliminated),
      caption: `Termination: lo (${lo}) crossed hi (${hi}) — the active window is empty.`,
    });
    frames.push({
      array: arr,
      highlights: {},
      eliminated: new Set(eliminated),
      caption: `Result: ${target} is not in the array. The would-be insertion index is ${lo} (useful for lower_bound-style searches).`,
    });
  }
  return frames;
}

// Lower-bound: smallest index i with arr[i] >= target. Classic boundary search,
// used in "find first occurrence" and "find insert position" problems.
function binarySearchLowerBoundFrames(arr = [1, 3, 5, 5, 5, 7, 9, 11, 13], target = 5) {
  const frames = [];
  let lo = 0, hi = arr.length;
  const eliminated = new Set();

  frames.push({
    array: arr,
    eliminated: new Set(),
    caption: `Lower-bound search: find the smallest index i where arr[i] ≥ ${target}. Notice we initialize hi = n (one past the end) — the answer can be "after everything".`,
  });
  frames.push({
    array: arr,
    highlights: { [lo]: 'low' },
    eliminated: new Set(),
    caption: `Invariant we maintain: arr[i] < target for all i < lo, and arr[i] ≥ target for all i ≥ hi. At start that holds vacuously (empty regions on both sides).`,
  });
  let stepNum = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    stepNum += 1;
    frames.push({
      array: arr,
      highlights: { [lo]: 'low', [hi - 1]: 'high', [mid]: 'mid' },
      eliminated: new Set(eliminated),
      caption: `Step ${stepNum}: probe mid = ${mid}. arr[${mid}] = ${arr[mid]} vs target ${target}.`,
    });
    if (arr[mid] < target) {
      for (let k = lo; k <= mid; k++) eliminated.add(k);
      lo = mid + 1;
      frames.push({
        array: arr,
        highlights: { [lo]: lo < hi ? 'low' : undefined, [hi - 1]: hi - 1 >= lo ? 'high' : undefined },
        eliminated: new Set(eliminated),
        caption: `arr[${mid}] < ${target}: mid (and everything left) cannot be the answer — advance lo to ${lo}.`,
      });
    } else {
      for (let k = mid + 1; k < hi; k++) eliminated.add(k);
      hi = mid;
      frames.push({
        array: arr,
        highlights: { [lo]: lo < hi ? 'low' : undefined, [hi - 1]: hi - 1 >= lo ? 'high' : undefined, [mid]: 'frontier' },
        eliminated: new Set(eliminated),
        caption: `arr[${mid}] ≥ ${target}: mid is a valid candidate, but maybe an earlier one works. Pull hi down to ${hi} (mid stays in play).`,
      });
    }
  }
  if (lo < arr.length) {
    frames.push({
      array: arr,
      highlights: { [lo]: 'match' },
      eliminated: new Set(eliminated),
      caption: `Converged: lower_bound(${target}) = ${lo}, arr[${lo}] = ${arr[lo]}. That's the leftmost element ≥ ${target}.`,
    });
  } else {
    frames.push({
      array: arr,
      highlights: {},
      eliminated: new Set(eliminated),
      caption: `Converged: lower_bound(${target}) = ${arr.length} (past the end) — every element is < ${target}.`,
    });
  }
  return frames;
}

// Upper-bound: smallest index i with arr[i] > target.
function binarySearchUpperBoundFrames(arr = [1, 3, 5, 5, 5, 7, 9, 11, 13], target = 5) {
  const frames = [];
  let lo = 0, hi = arr.length;
  const eliminated = new Set();
  frames.push({
    array: arr,
    eliminated: new Set(),
    caption: `Upper-bound search: find the smallest index i where arr[i] > ${target}. (upper_bound - lower_bound = count of ${target}.)`,
  });
  frames.push({
    array: arr,
    highlights: { [lo]: 'low' },
    eliminated: new Set(),
    caption: `Same skeleton as lower-bound; only the comparison flips from "<" to "≤". That single change turns "first ≥ x" into "first > x".`,
  });
  let stepNum = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    stepNum += 1;
    frames.push({
      array: arr,
      highlights: { [lo]: 'low', [hi - 1]: 'high', [mid]: 'mid' },
      eliminated: new Set(eliminated),
      caption: `Step ${stepNum}: probe mid = ${mid}. arr[${mid}] = ${arr[mid]} vs target ${target}.`,
    });
    if (arr[mid] <= target) {
      for (let k = lo; k <= mid; k++) eliminated.add(k);
      lo = mid + 1;
      frames.push({
        array: arr,
        highlights: { [lo]: lo < hi ? 'low' : undefined, [hi - 1]: hi - 1 >= lo ? 'high' : undefined },
        eliminated: new Set(eliminated),
        caption: `arr[${mid}] ≤ ${target}: mid is not strictly greater, so push lo past it. lo → ${lo}.`,
      });
    } else {
      for (let k = mid + 1; k < hi; k++) eliminated.add(k);
      hi = mid;
      frames.push({
        array: arr,
        highlights: { [lo]: lo < hi ? 'low' : undefined, [hi - 1]: hi - 1 >= lo ? 'high' : undefined, [mid]: 'frontier' },
        eliminated: new Set(eliminated),
        caption: `arr[${mid}] > ${target}: mid is a candidate; look earlier for something better. hi → ${hi}.`,
      });
    }
  }
  if (lo < arr.length) {
    frames.push({
      array: arr,
      highlights: { [lo]: 'match' },
      eliminated: new Set(eliminated),
      caption: `Converged: upper_bound(${target}) = ${lo}, arr[${lo}] = ${arr[lo]}. First index strictly greater than ${target}.`,
    });
  } else {
    frames.push({
      array: arr,
      highlights: {},
      eliminated: new Set(eliminated),
      caption: `Converged: upper_bound(${target}) = ${arr.length} — every element is ≤ ${target}.`,
    });
  }
  return frames;
}

// Shared graph traversal frame builder. Runs BFS or DFS on a node/edge graph
// from `source`, snapshotting every queue-pop / stack-pop and every neighbor
// discovery so learners see frontier evolution one conceptual step at a time.
function traverseGraphFrames({ nodes, edges, adj, source, mode, label }) {
  const frames = [];
  const visited = new Set();
  const frontier = [source];
  const tree = new Set();
  visited.add(source);

  const snapshot = (currentId, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      state: n.id === currentId ? 'current'
        : frontier.includes(n.id) ? 'frontier'
        : visited.has(n.id) ? 'visited'
        : undefined,
    }));
    const es = edges.map(e => {
      const k1 = `${e.a}-${e.b}`, k2 = `${e.b}-${e.a}`;
      if (tree.has(k1) || tree.has(k2)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  const containerName = mode === 'bfs' ? 'queue' : 'stack';
  const popOp = mode === 'bfs' ? 'dequeue' : 'pop';
  const orderRule = mode === 'bfs'
    ? 'oldest discovered first — that produces a layer-by-layer sweep ordered by distance from the source.'
    : 'newest discovered first — that produces a deep dive down one branch before backtracking.';

  snapshot(source, `${label}: start ${mode.toUpperCase()} at node ${source}. ${containerName} = [${source}], visited = {${source}}.`);
  snapshot(source, `${label}: rule — repeatedly ${popOp} a node, mark it current, and push every unvisited neighbor. Order: ${orderRule}`);

  let stepNum = 0;
  while (frontier.length) {
    const u = mode === 'bfs' ? frontier.shift() : frontier.pop();
    stepNum += 1;
    snapshot(u, `${label} step ${stepNum}: ${popOp} ${u} from the ${containerName}. Inspect its neighbors [${(adj[u] || []).join(', ')}].`);
    const discovered = [];
    for (const v of adj[u] || []) {
      if (!visited.has(v)) {
        visited.add(v);
        frontier.push(v);
        tree.add(`${u}-${v}`);
        discovered.push(v);
        snapshot(u, `${label} step ${stepNum}: discover ${v} via edge ${u}–${v}. Mark visited, push onto ${containerName}. ${containerName} = [${frontier.join(', ')}].`);
      }
    }
    if (!discovered.length) {
      snapshot(u, `${label} step ${stepNum}: every neighbor of ${u} is already visited — nothing new to enqueue. ${mode === 'dfs' ? 'Backtrack.' : 'Move on.'}`);
    }
  }
  snapshot(null, `${label}: ${containerName} drained. Visit order: ${nodes.filter(n => visited.has(n.id)).map(n => n.id).join(' → ')}. Highlighted edges form the ${mode.toUpperCase()} spanning tree.`);
  return frames;
}

// Default BFS case: small undirected graph emphasizing layer ordering.
function bfsFrames() {
  const nodes = [
    { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
    { id: 3, label: '3' }, { id: 4, label: '4' }, { id: 5, label: '5' },
    { id: 6, label: '6' }, { id: 7, label: '7' }, { id: 8, label: '8' }, { id: 9, label: '9' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 },
    { a: 1, b: 4 }, { a: 1, b: 5 },
    { a: 2, b: 6 }, { a: 3, b: 7 },
    { a: 4, b: 8 }, { a: 6, b: 9 },
    { a: 5, b: 8 },
  ];
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  return traverseGraphFrames({ nodes, edges, adj, source: 0, mode: 'bfs', label: 'BFS (bushy tree)' });
}

// BFS on a linear chain — emphasizes that BFS distance = chain position.
function bfsLinearChainFrames() {
  const nodes = Array.from({ length: 8 }, (_, i) => ({ id: i, label: String(i) }));
  const edges = Array.from({ length: 7 }, (_, i) => ({ a: i, b: i + 1 }));
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  return traverseGraphFrames({ nodes, edges, adj, source: 0, mode: 'bfs', label: 'BFS (chain)' });
}

// DFS on the same bushy tree as bfsFrames — direct side-by-side compare.
function dfsBushyFrames() {
  const nodes = [
    { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
    { id: 3, label: '3' }, { id: 4, label: '4' }, { id: 5, label: '5' },
    { id: 6, label: '6' }, { id: 7, label: '7' }, { id: 8, label: '8' }, { id: 9, label: '9' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 },
    { a: 1, b: 4 }, { a: 1, b: 5 },
    { a: 2, b: 6 }, { a: 3, b: 7 },
    { a: 4, b: 8 }, { a: 6, b: 9 },
    { a: 5, b: 8 },
  ];
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  return traverseGraphFrames({ nodes, edges, adj, source: 0, mode: 'dfs', label: 'DFS (bushy tree)' });
}

// Disconnected graph: shows that one BFS/DFS only covers the source component.
function bfsDisconnectedFrames() {
  const nodes = Array.from({ length: 8 }, (_, i) => ({ id: i, label: String(i) }));
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 1, b: 3 },
    { a: 4, b: 5 }, { a: 5, b: 6 },
    { a: 7, b: 7 },
  ].filter(e => e.a !== e.b);
  const adj = {};
  for (const e of edges) { (adj[e.a] ||= []).push(e.b); (adj[e.b] ||= []).push(e.a); }
  const frames = traverseGraphFrames({ nodes, edges, adj, source: 0, mode: 'bfs', label: 'BFS (disconnected)' });
  frames.push({
    nodes: nodes.map(n => ({ ...n, state: [0, 1, 2, 3].includes(n.id) ? 'done' : undefined })),
    edges,
    caption: `One BFS from node 0 reached {0,1,2,3} but stopped — nodes 4–7 sit in other components. To enumerate all components you wrap BFS/DFS in an outer for-loop over every unvisited node.`,
  });
  return frames;
}

// Sliding window — Case A: longest substring without repeating characters.
// Window state: a hash-set of chars currently inside [l..r]. Grow r each step;
// shrink l whenever the invariant breaks.
function slidingWindowFrames(s = 'abcabcbb') {
  const str = String(s ?? '');
  if (!str.length) return [{ array: [], caption: 'Empty string — no substring.' }];
  const arr = str.split('');
  const frames = [];
  const seen = new Map();
  let l = 0, best = 0, bestRange = [0, 0];

  frames.push({
    array: arr,
    window: [0, -1],
    caption: `Case: longest substring of "${str}" with all distinct chars. Window state = the set of chars currently in [l..r].`,
  });
  frames.push({
    array: arr,
    window: [0, -1],
    caption: `Pattern: expand r each step; when the new char breaks the invariant (already present), shrink l until it holds again. Each index visits ≤ twice → O(n).`,
  });

  for (let r = 0; r < arr.length; r++) {
    const ch = arr[r];
    if (seen.has(ch) && seen.get(ch) >= l) {
      const prev = seen.get(ch);
      const oldL = l;
      l = prev + 1;
      seen.set(ch, r);
      frames.push({
        array: arr,
        window: [l, r],
        caption: `r=${r}: '${ch}' already inside window at index ${prev}. Shrink: jump l from ${oldL} to ${l} so the duplicate falls out. Window state = "${str.slice(l, r + 1)}".`,
      });
    } else {
      seen.set(ch, r);
      const len = r - l + 1;
      const wasBest = best;
      if (len > best) { best = len; bestRange = [l, r]; }
      frames.push({
        array: arr,
        window: [l, r],
        caption: `r=${r}: '${ch}' is new — extend. Window = "${str.slice(l, r + 1)}" (length ${len}).${len > wasBest ? ' New best!' : ''}`,
      });
    }
  }
  frames.push({
    array: arr,
    window: bestRange,
    caption: `Done. Longest substring without repeats in "${str}" = "${str.slice(bestRange[0], bestRange[1] + 1)}" (length ${best}). Window state shifted left-to-right exactly once.`,
  });
  return frames;
}

// Sliding window — Case B: shortest subarray with sum ≥ K (positive values).
// Window state: running sum. Grow r until sum ≥ K, then shrink l as far as
// possible while still ≥ K. Track the shortest valid window seen.
function slidingWindowMinSumFrames(arr = [2, 1, 5, 2, 3, 2], K = 7) {
  if (!arr.length) return [{ array: [], caption: 'Empty array — nothing to sum.' }];
  const frames = [];
  let l = 0, sum = 0, best = Infinity, bestRange = [-1, -1];
  frames.push({
    array: arr,
    caption: `Case: shortest contiguous subarray with sum ≥ ${K}. Values are positive, so sum is monotone in window width — that's why sliding window works here.`,
  });
  frames.push({
    array: arr,
    window: [0, -1],
    caption: `Window state = the running sum inside [l..r]. Expand r to grow the sum; once the sum ≥ ${K}, try shrinking l to find the shortest still-valid window.`,
  });
  for (let r = 0; r < arr.length; r++) {
    sum += arr[r];
    frames.push({
      array: arr,
      window: [l, r],
      caption: `r=${r}: include arr[${r}]=${arr[r]}. Window sum = ${sum}. Window state = [${arr.slice(l, r + 1).join(',')}] (width ${r - l + 1}).`,
    });
    while (sum >= K && l <= r) {
      const width = r - l + 1;
      if (width < best) { best = width; bestRange = [l, r]; }
      frames.push({
        array: arr,
        window: [l, r],
        caption: `sum (${sum}) ≥ ${K}: window [${arr.slice(l, r + 1).join(',')}] is valid — width ${width}, current best width = ${best === Infinity ? '∞' : best}. Try shrinking from the left.`,
      });
      sum -= arr[l];
      l += 1;
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Shrink: drop arr[${l - 1}]=${arr[l - 1]}, l → ${l}, new sum = ${sum}.`,
      });
    }
  }
  if (best === Infinity) {
    frames.push({
      array: arr,
      caption: `Done. No window sums to ≥ ${K}. Total array sum = ${arr.reduce((a, b) => a + b, 0)}.`,
    });
  } else {
    frames.push({
      array: arr,
      window: bestRange,
      caption: `Done. Shortest subarray with sum ≥ ${K} is arr[${bestRange[0]}..${bestRange[1]}] = [${arr.slice(bestRange[0], bestRange[1] + 1).join(',')}], width ${best}.`,
    });
  }
  return frames;
}

// Sliding window — Case C: fruit into baskets (longest subarray with at most
// 2 distinct values). Window state: counts of each distinct value.
function slidingWindowFruitFrames(arr = [1, 2, 1, 2, 3, 2, 2]) {
  if (!arr.length) return [{ array: [], caption: 'Empty array — no baskets.' }];
  const frames = [];
  let l = 0, best = 0, bestRange = [0, 0];
  const counts = new Map();
  const distinct = () => counts.size;
  const stateStr = () => [...counts.entries()].map(([k, v]) => `${k}×${v}`).join(', ');

  frames.push({
    array: arr,
    caption: `Case: "fruit into baskets" — longest contiguous subarray with at most 2 distinct values. Window state = a map of value → count inside [l..r].`,
  });
  frames.push({
    array: arr,
    window: [0, -1],
    caption: `Pattern: extend r each step; if the window grows to 3 distinct values, shrink l until we drop back to 2.`,
  });

  for (let r = 0; r < arr.length; r++) {
    counts.set(arr[r], (counts.get(arr[r]) || 0) + 1);
    frames.push({
      array: arr,
      window: [l, r],
      caption: `r=${r}: add arr[${r}]=${arr[r]}. Window state {${stateStr()}} → ${distinct()} distinct value${distinct() === 1 ? '' : 's'}.`,
    });
    while (distinct() > 2) {
      const removed = arr[l];
      counts.set(removed, counts.get(removed) - 1);
      if (counts.get(removed) === 0) counts.delete(removed);
      l += 1;
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Window has 3 distinct values — shrink: drop arr[${l - 1}]=${removed}, l → ${l}. Window state {${stateStr()}}, distinct = ${distinct()}.`,
      });
    }
    const width = r - l + 1;
    if (width > best) { best = width; bestRange = [l, r]; }
  }
  frames.push({
    array: arr,
    window: bestRange,
    caption: `Done. Longest run with ≤2 distinct values = arr[${bestRange[0]}..${bestRange[1]}] = [${arr.slice(bestRange[0], bestRange[1] + 1).join(',')}], length ${best}.`,
  });
  return frames;
}

// Two-pointers: pair sum to target on a sorted array, with a per-step
// convergence chart that visualizes pointer positions over time.
function twoPointersFrames(arr = [1, 2, 4, 7, 8, 11, 12, 15, 18, 20], target = 23) {
  if (arr.length < 2) return [{ array: arr, caption: 'Need at least 2 elements.' }];
  const frames = [];
  let l = 0, r = arr.length - 1;
  const history = [[l, r]];

  const chart = () => {
    // Each row is one step. '<' = l position, '>' = r position, '.' = inactive index.
    const n = arr.length;
    return history.map(([li, ri]) => {
      let row = '';
      for (let k = 0; k < n; k++) {
        if (k === li && k === ri) row += 'x';
        else if (k === li) row += '<';
        else if (k === ri) row += '>';
        else if (k > li && k < ri) row += '-';
        else row += '.';
      }
      return row;
    }).join(' | ');
  };

  frames.push({
    array: arr,
    caption: `Two-pointers premise: the array must be sorted. Here: [${arr.join(', ')}] (${arr.length} elements). Goal: a pair summing to ${target}.`,
  });
  frames.push({
    array: arr,
    caption: `Brute force would test every (i,j) pair — O(n²). Two-pointers cuts that to O(n) by exploiting monotonicity.`,
  });
  frames.push({
    array: arr,
    window: [l, r],
    caption: `Place l at index ${l} (smallest) and r at index ${r} (largest). Starting sum = arr[${l}] + arr[${r}] = ${arr[l]} + ${arr[r]} = ${arr[l] + arr[r]}.`,
  });
  frames.push({
    array: arr,
    window: [l, r],
    caption: `Why this is safe: sum_too_small → arr[l] is the smallest currently in play, so pairing it with anything to r's left makes the sum even smaller — so l can never be the answer. Move l right. (Mirror for sum_too_big.)`,
  });
  let stepNum = 0;
  while (l < r) {
    stepNum += 1;
    const sum = arr[l] + arr[r];
    if (sum === target) {
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Step ${stepNum} — verdict: arr[${l}] + arr[${r}] = ${arr[l]} + ${arr[r]} = ${target}. Match! Pointers paths so far: ${chart()}.`,
      });
      break;
    }
    if (sum < target) {
      const oldL = l; l += 1;
      history.push([l, r]);
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Step ${stepNum} — too small: sum = ${arr[oldL]} + ${arr[r]} = ${sum} < ${target}. Advance l: ${oldL} → ${l}. Convergence chart: ${chart()}.`,
      });
    } else {
      const oldR = r; r -= 1;
      history.push([l, r]);
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Step ${stepNum} — too big: sum = ${arr[l]} + ${arr[oldR]} = ${sum} > ${target}. Retreat r: ${oldR} → ${r}. Convergence chart: ${chart()}.`,
      });
    }
  }
  if (l >= r) {
    frames.push({
      array: arr,
      caption: `Pointers crossed: l (${l}) ≥ r (${r}). No pair in the array sums to ${target}. Convergence chart: ${chart()}.`,
    });
    frames.push({
      array: arr,
      caption: `Total work: ${stepNum} step${stepNum === 1 ? '' : 's'} — never more than n−1. Compare with brute force: ${arr.length * (arr.length - 1) / 2} pairs.`,
    });
  }
  return frames;
}

// Kadane's: running "max ending here" / "best so far" with a per-step
// restart-vs-extend verdict and a tiny ASCII chart of the running max.
function kadaneFrames(arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]) {
  if (!arr.length) return [{ array: [], caption: 'Empty array — no subarray.' }];
  const frames = [];
  let cur = arr[0], best = arr[0], bestStart = 0, bestEnd = 0, curStart = 0;
  const history = [arr[0]];

  const chart = () => {
    // Compact one-line bar chart of best-so-far. Lowest = '.', highest = '#'.
    if (!history.length) return '';
    const lo = Math.min(...history), hi = Math.max(...history);
    const span = hi - lo;
    const bars = '.,:;+*#';
    return history.map(v => bars[span === 0 ? 0 : Math.min(bars.length - 1, Math.floor(((v - lo) / span) * (bars.length - 1)))]).join('');
  };

  frames.push({
    array: arr,
    caption: `Kadane's setup: array = [${arr.join(', ')}]. We want the contiguous subarray with the largest sum — including the case where the best answer is a single (least-negative) element.`,
  });
  frames.push({
    array: arr,
    caption: `Key observation: at index i, the best subarray ending at i is either {arr[i] alone} or {arr[i] appended to the best subarray ending at i−1}. That's the only decision per step.`,
  });
  frames.push({
    array: arr,
    highlights: { 0: 'mid' },
    caption: `Initialize: cur = best = arr[0] = ${arr[0]}. curStart = 0 marks where the current "best ending here" subarray begins.`,
  });

  for (let i = 1; i < arr.length; i++) {
    frames.push({
      array: arr,
      highlights: { [i]: 'frontier', [curStart]: 'low' },
      caption: `i=${i}: choose between EXTEND (cur + ${arr[i]} = ${cur + arr[i]}) or RESTART (just ${arr[i]}). Take whichever is larger.`,
    });
    let action = '';
    if (cur + arr[i] < arr[i]) {
      cur = arr[i];
      curStart = i;
      action = `RESTART — the prior run hurt us, so drop it and begin fresh at index ${i}.`;
    } else {
      cur = cur + arr[i];
      action = `EXTEND — appending arr[${i}] keeps the running sum growing (or shrinking less than restarting would).`;
    }
    const beat = cur > best;
    if (beat) { best = cur; bestStart = curStart; bestEnd = i; }
    history.push(best);
    const elim = new Set();
    for (let k = 0; k < curStart; k++) elim.add(k);
    frames.push({
      array: arr,
      highlights: { [i]: 'mid', [curStart]: 'low' },
      eliminated: elim,
      caption: `i=${i}: ${action} cur = ${cur}, best = ${best}${beat ? ' (new global max!)' : ''}. best-so-far chart: ${chart()}.`,
    });
  }
  const elim = new Set();
  for (let k = 0; k < arr.length; k++) if (k < bestStart || k > bestEnd) elim.add(k);
  frames.push({
    array: arr,
    highlights: Object.fromEntries(Array.from({ length: bestEnd - bestStart + 1 }, (_, k) => [bestStart + k, 'match'])),
    eliminated: elim,
    caption: `Result: maximum subarray = arr[${bestStart}..${bestEnd}] with sum ${best}. ${arr.every(v => v < 0) ? 'All entries were negative — the answer is the single least-negative element, which is why we initialized best to arr[0] rather than 0.' : `Each restart pruned a strictly-negative prefix, which is why this beats brute force O(n²).`}`,
  });
  return frames;
}

// Floyd's tortoise-and-hare cycle detection on a linked list with a cycle.
function loopDetectionFrames() {
  const N = 7;
  const cycleTo = 3;
  const next = (i) => (i === N - 1 ? cycleTo : i + 1);
  const frames = [];
  let slow = 0, fast = 0;
  frames.push({
    array: Array.from({ length: N }, (_, i) => i),
    highlights: { 0: 'mid' },
    caption: `Floyd's tortoise-and-hare. The list has 7 nodes; node 6 loops back to node 3, creating a cycle of length 4.`,
  });
  frames.push({
    array: Array.from({ length: N }, (_, i) => i),
    highlights: { 0: 'mid', [cycleTo]: 'high' },
    caption: `Cycle entry is node ${cycleTo}. Once a pointer reaches it from outside, it keeps revisiting nodes ${cycleTo}..${N - 1}.`,
  });
  frames.push({
    array: Array.from({ length: N }, (_, i) => i),
    highlights: { 0: 'low' },
    caption: `Both slow and fast start at the head (node 0). Slow advances 1 step per round; fast advances 2. If a cycle exists, fast laps slow inside it.`,
  });
  let meetingPoint = -1;
  for (let step = 1; step <= 12; step++) {
    slow = next(slow);
    fast = next(next(fast));
    const met = slow === fast;
    frames.push({
      array: Array.from({ length: N }, (_, i) => i),
      highlights: { [slow]: 'low', [fast]: 'mid' },
      caption: `Step ${step}: slow at ${slow}, fast at ${fast}.${met ? ' They meet — the cycle is proven to exist.' : ' Fast pulls ahead by one node each round.'}`,
    });
    if (met) { meetingPoint = slow; break; }
  }
  frames.push({
    array: Array.from({ length: N }, (_, i) => i),
    highlights: { [meetingPoint]: 'match' },
    caption: `Meeting point: node ${meetingPoint}. Phase 1 done — we've confirmed a cycle. Without one, fast would have hit the end (null) instead.`,
  });
  let p1 = 0, p2 = meetingPoint, stepIn = 0;
  while (p1 !== p2 && stepIn < 12) {
    frames.push({
      array: Array.from({ length: N }, (_, i) => i),
      highlights: { [p1]: 'low', [p2]: 'mid' },
      caption: `Phase 2: reset one pointer to the head, keep the other at the meeting point. Advance both at 1 step. Currently p1=${p1}, p2=${p2}.`,
    });
    p1 = next(p1); p2 = next(p2); stepIn += 1;
  }
  frames.push({
    array: Array.from({ length: N }, (_, i) => i),
    highlights: { [p1]: 'match' },
    caption: `They meet at node ${p1} — the cycle's entry point. Total: O(n) time, O(1) extra memory.`,
  });
  return frames;
}

// Sieve of Eratosthenes from 2..50.
function sieveFrames(n = 50) {
  const N = Number(n);
  if (!Number.isFinite(N) || N < 2) return [{ numbers: [], state: {}, cols: 10, caption: 'n must be ≥ 2 — nothing to sieve.' }];
  const nums = Array.from({ length: N - 1 }, (_, i) => i + 2);
  const composite = new Set();
  const frames = [];
  const cols = N <= 12 ? Math.max(2, N - 1) : 10;

  const snapshot = (current, caption) => {
    const state = {};
    for (const v of nums) {
      if (v === current) state[v] = 'current';
      else if (composite.has(v)) state[v] = 'composite';
      else state[v] = 'prime';
    }
    frames.push({ numbers: nums, state, cols, caption });
  };

  snapshot(null, `Sieve of Eratosthenes for 2..${N}. Mark all as candidate primes (green).`);
  for (let p = 2; p * p <= N; p++) {
    if (composite.has(p)) continue;
    snapshot(p, `${p} is prime — cross out its multiples starting at ${p * p}.`);
    for (let m = p * p; m <= N; m += p) {
      if (!composite.has(m)) composite.add(m);
    }
    snapshot(p, `Marked all multiples of ${p}. Move to the next uncrossed number.`);
  }
  const primes = nums.filter(v => !composite.has(v));
  snapshot(null, `Done. Primes ≤ ${N}: ${primes.join(', ')}.`);
  return frames;
}

// Quicksort Lomuto partition step on a small array.
function quicksortPartitionFrames(input = [7, 2, 9, 4, 1, 6, 3]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to partition.' }];
  const arr = [...input];
  const frames = [];
  const lo = 0, hi = arr.length - 1;
  const pivot = arr[hi];
  let i = lo - 1;

  frames.push({
    array: [...arr],
    highlights: { [hi]: 'mid' },
    caption: `Lomuto partition. Choose last element as pivot = ${pivot}. i = ${i} (boundary of "≤ pivot" zone).`,
  });

  for (let j = lo; j < hi; j++) {
    frames.push({
      array: [...arr],
      highlights: { [hi]: 'mid', [j]: 'low' },
      caption: `j = ${j}. Compare arr[${j}] = ${arr[j]} with pivot ${pivot}.`,
    });
    if (arr[j] <= pivot) {
      i += 1;
      if (i !== j) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        frames.push({
          array: [...arr],
          highlights: { [hi]: 'mid', [i]: 'match', [j]: 'match' },
          caption: `arr[${j}] ≤ ${pivot} — increment i to ${i} and swap arr[${i}] ↔ arr[${j}]. Now [${arr.slice(0, i + 1).join(', ')}] all ≤ pivot.`,
        });
      } else {
        frames.push({
          array: [...arr],
          highlights: { [hi]: 'mid', [i]: 'match' },
          caption: `arr[${j}] ≤ ${pivot} — i and j already coincide. Move on.`,
        });
      }
    }
  }
  i += 1;
  [arr[i], arr[hi]] = [arr[hi], arr[i]];
  frames.push({
    array: [...arr],
    highlights: { [i]: 'match' },
    caption: `Place pivot ${pivot} at index ${i}. Everything left is ≤ ${pivot}, everything right is > ${pivot}. Recurse on each side.`,
  });
  return frames;
}

// Insertion sort: pull each element backward into place.
function insertionSortFrames(input = [5, 2, 4, 6, 1, 3]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to sort.' }];
  const a = [...input];
  const frames = [];
  frames.push({ array: [...a], caption: `Insertion sort. The left part stays sorted; each new element bubbles backward into place.` });
  for (let i = 1; i < a.length; i++) {
    let j = i;
    frames.push({
      array: [...a],
      highlights: { [i]: 'mid' },
      eliminated: new Set(Array.from({ length: i }, (_, k) => k).filter(k => k >= i)),
      caption: `i=${i}: pick arr[${i}] = ${a[i]}. Compare with elements to its left.`,
    });
    while (j > 0 && a[j - 1] > a[j]) {
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      j -= 1;
      frames.push({
        array: [...a],
        highlights: { [j]: 'match', [j + 1]: 'match' },
        caption: `Swap arr[${j}] ↔ arr[${j + 1}]. Array: [${a.join(', ')}].`,
      });
    }
    frames.push({
      array: [...a],
      highlights: Object.fromEntries(Array.from({ length: i + 1 }, (_, k) => [k, 'low'])),
      caption: `Done with i=${i}. The first ${i + 1} elements are sorted.`,
    });
  }
  frames.push({
    array: [...a],
    highlights: Object.fromEntries(a.map((_, i) => [i, 'match'])),
    caption: `Done. Insertion sort is O(n²) in the worst case but O(n) on already-sorted input.`,
  });
  return frames;
}

// Heap sift-down on an array-encoded max heap.
// Indexing: parent(i)=(i-1)/2, left(i)=2i+1, right(i)=2i+2.
function heapSiftDownFrames(input = [3, 10, 8, 5, 7, 6, 1]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to heapify.' }];
  const a = [...input];
  const n = a.length;
  const frames = [];
  frames.push({
    array: [...a],
    caption: `Max-heap as an array. For index i: parent = (i−1)/2, left child = 2i+1, right child = 2i+2.`,
  });
  frames.push({
    array: [...a],
    highlights: { 0: 'mid' },
    caption: `Heap property: every parent ≥ both children. Start at root (index 0) and sift down to restore it.`,
  });
  frames.push({
    array: [...a],
    highlights: { 0: 'mid', 1: n > 1 ? 'low' : undefined, 2: n > 2 ? 'high' : undefined },
    caption: `Root = ${a[0]}. Its children are arr[1]=${a[1] ?? '-'} (left, blue) and arr[2]=${a[2] ?? '-'} (right, orange).`,
  });
  let i = 0;
  let stepNum = 0;
  while (true) {
    const l = 2 * i + 1, r = 2 * i + 2;
    let largest = i;
    if (l < n && a[l] > a[largest]) largest = l;
    if (r < n && a[r] > a[largest]) largest = r;
    if (largest === i) {
      frames.push({
        array: [...a],
        highlights: { [i]: 'match' },
        caption: `arr[${i}]=${a[i]} is already ≥ its children. Heap property satisfied — stop.`,
      });
      break;
    }
    stepNum += 1;
    frames.push({
      array: [...a],
      highlights: { [i]: 'mid', [l]: l < n ? 'low' : undefined, [r]: r < n ? 'high' : undefined },
      caption: `Step ${stepNum}: at index ${i}, parent=${a[i]} vs children [${l < n ? a[l] : '-'}, ${r < n ? a[r] : '-'}]. Largest is arr[${largest}]=${a[largest]}.`,
    });
    [a[i], a[largest]] = [a[largest], a[i]];
    frames.push({
      array: [...a],
      highlights: { [i]: 'match', [largest]: 'match' },
      caption: `Swap arr[${i}] ↔ arr[${largest}]. Array: [${a.join(', ')}]. The disturbance moves down to index ${largest}.`,
    });
    frames.push({
      array: [...a],
      highlights: { [largest]: 'mid' },
      caption: `Recurse: continue sifting at index ${largest}. Check whether arr[${largest}]=${a[largest]} still violates the heap with its (new) children.`,
    });
    i = largest;
  }
  frames.push({
    array: [...a],
    highlights: Object.fromEntries(a.map((_, k) => [k, 'match'])),
    caption: `Sift-down done in ${stepNum} swap${stepNum === 1 ? '' : 's'}. Cost ≤ O(log n) per call — heapify a whole array is O(n).`,
  });
  return frames;
}

// Full heap sort: build-max-heap (sift-down from the last parent up to the
// root), then repeatedly swap the max to the shrinking tail and re-sift.
// The sorted tail is marked `eliminated` so the live heap boundary is visible.
function heapSortFrames(input = [4, 10, 3, 5, 1, 8, 7]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to sort.' }];
  const a = [...input];
  const n = a.length;
  const frames = [];
  const sortedTail = (heapSize) => new Set(Array.from({ length: n - heapSize }, (_, k) => heapSize + k));

  const siftDown = (start, heapSize, phaseLabel) => {
    let i = start;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let largest = i;
      if (l < heapSize && a[l] > a[largest]) largest = l;
      if (r < heapSize && a[r] > a[largest]) largest = r;
      const hl = { [i]: 'mid' };
      if (l < heapSize) hl[l] = 'low';
      if (r < heapSize) hl[r] = 'high';
      frames.push({
        array: [...a],
        highlights: hl,
        eliminated: sortedTail(heapSize),
        caption: `${phaseLabel}: parent ${a[i]} at index ${i} vs children [${l < heapSize ? a[l] : '-'}, ${r < heapSize ? a[r] : '-'}]. ${largest === i ? `${a[i]} already dominates — this subtree is a valid heap.` : `Child ${a[largest]} is larger, so they trade places.`}`,
      });
      if (largest === i) break;
      [a[i], a[largest]] = [a[largest], a[i]];
      frames.push({
        array: [...a],
        highlights: { [i]: 'match', [largest]: 'match' },
        eliminated: sortedTail(heapSize),
        caption: `${a[i]} rises to index ${i}; ${a[largest]} sinks to index ${largest} and keeps sifting down.`,
      });
      i = largest;
    }
  };

  frames.push({ array: [...a], caption: `Heap sort, phase 1: turn the array into a max-heap. Sift down every parent, starting from the last one (index ${Math.floor(n / 2) - 1}) back to the root.` });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n, `Build heap, node ${i}`);
  frames.push({
    array: [...a],
    highlights: { 0: 'match' },
    caption: `Max-heap built: ${a[0]} sits at the root, every parent ≥ its children. Phase 2: extract the max ${n - 1} times.`,
  });

  for (let end = n - 1; end >= 1; end--) {
    frames.push({
      array: [...a],
      highlights: { 0: 'mid', [end]: 'high' },
      eliminated: sortedTail(end + 1),
      caption: `The root ${a[0]} is the largest of the remaining ${end + 1} elements. It trades places with ${a[end]}, the last slot of the heap.`,
    });
    [a[0], a[end]] = [a[end], a[0]];
    frames.push({
      array: [...a],
      highlights: { [end]: 'match' },
      eliminated: sortedTail(end),
      caption: `${a[end]} is locked into its final position ${end}. ${end > 1 ? `The heap shrinks to ${end} elements; the new root ${a[0]} must sift back down.` : `Only ${a[0]} remains — it is already in place.`}`,
    });
    if (end > 1) siftDown(0, end, `Re-sift (heap size ${end})`);
  }
  frames.push({
    array: [...a],
    highlights: Object.fromEntries(a.map((_, k) => [k, 'match'])),
    caption: `Sorted: [${a.join(', ')}]. Build-heap costs O(n); each of the n extractions costs O(log n) — O(n log n) total, in place.`,
  });
  return frames;
}

// Dijkstra (binary-heap variant) with explicit PQ + distance table + stale-pop
// annotation in every caption. Models the "lazy deletion" pattern: instead of
// decrease-key we push a fresh (newDist, node) entry and skip stale pops.
function dijkstraFrames(variant = 'default') {
  let nodes, edges;
  if (variant === 'sparse-chain') {
    nodes = [0, 1, 2, 3, 4, 5].map(i => ({ id: i, label: String(i) }));
    edges = [
      { a: 0, b: 1, w: 1 }, { a: 1, b: 2, w: 2 },
      { a: 2, b: 3, w: 1 }, { a: 3, b: 4, w: 3 }, { a: 4, b: 5, w: 1 },
    ];
  } else if (variant === 'parallel-paths') {
    nodes = [0, 1, 2, 3, 4].map(i => ({ id: i, label: String(i) }));
    // Two routes from 0 to 3; route via 2 is shorter, triggering a decrease-key on node 3.
    edges = [
      { a: 0, b: 1, w: 4 }, { a: 0, b: 2, w: 1 },
      { a: 1, b: 3, w: 1 }, { a: 2, b: 3, w: 2 },
      { a: 3, b: 4, w: 3 },
    ];
  } else {
    nodes = [0, 1, 2, 3, 4].map(i => ({ id: i, label: String(i) }));
    edges = [
      { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 5 },
      { a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 6 },
      { a: 2, b: 3, w: 3 }, { a: 2, b: 4, w: 9 },
      { a: 3, b: 4, w: 2 },
    ];
  }
  const adj = {};
  for (const e of edges) {
    (adj[e.a] ||= []).push([e.b, e.w]);
    (adj[e.b] ||= []).push([e.a, e.w]);
  }
  const ids = nodes.map(n => n.id);
  const dist = Object.fromEntries(ids.map(i => [i, Infinity]));
  dist[ids[0]] = 0;
  const visited = new Set();
  // Heap entries as [dist, node]. We sort + shift to simulate a min-heap.
  const pq = [[0, ids[0]]];
  const frames = [];

  const labelOf = (id) => `${id}\n${dist[id] === Infinity ? '∞' : dist[id]}`;
  const pqStr = () => pq.length ? pq.map(([d, n]) => `(${d},${n})`).join(' ') : '∅';
  const distStr = () => ids.map(i => `${i}:${dist[i] === Infinity ? '∞' : dist[i]}`).join(' ');

  const snapshot = (currentId, justRelaxed, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      label: labelOf(n.id),
      state: n.id === currentId ? 'current'
        : visited.has(n.id) ? 'done'
        : dist[n.id] !== Infinity ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      if (justRelaxed && ((e.a === justRelaxed.from && e.b === justRelaxed.to) ||
                         (e.b === justRelaxed.from && e.a === justRelaxed.to))) {
        return { ...e, state: 'tree' };
      }
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapshot(ids[0], null,
    `Dijkstra from node ${ids[0]}. Initial state: dist = [${distStr()}], PQ = [${pqStr()}], visited = {}.`);
  snapshot(ids[0], null,
    `Invariant we maintain: when a node is popped with the smallest tentative distance, that distance is final. (Holds because all edges are non-negative — no later route can undercut it.)`);

  let stepNum = 0;
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (visited.has(u)) {
      snapshot(u, null,
        `Pop (${d},${u}) from PQ. Node ${u} is already finalized — this is a STALE entry left over from an earlier relaxation that improved dist[${u}]. Skip it. PQ now = [${pqStr()}].`);
      continue;
    }
    if (d > dist[u]) {
      snapshot(u, null, `Pop (${d},${u}) but dist[${u}] is now ${dist[u]} (improved since this entry was pushed). Stale — skip.`);
      continue;
    }
    stepNum += 1;
    visited.add(u);
    snapshot(u, null,
      `Step ${stepNum} — pop min: extract (${d},${u}) from PQ. dist[${u}] = ${d} is now FINAL. Mark visited. PQ now = [${pqStr()}].`);
    snapshot(u, null,
      `Step ${stepNum} — relax: for each unvisited neighbor v of ${u}, see if going through ${u} beats v's current dist. dist row: [${distStr()}].`);
    for (const [v, w] of adj[u] || []) {
      if (visited.has(v)) {
        snapshot(u, null, `Neighbor ${v} already finalized at dist[${v}]=${dist[v]} — skip (relaxing can never improve it).`);
        continue;
      }
      const cand = dist[u] + w;
      if (cand < dist[v]) {
        const old = dist[v];
        dist[v] = cand;
        pq.push([cand, v]);
        snapshot(u, { from: u, to: v },
          `Relax ${u}→${v} (w=${w}): ${dist[u]} + ${w} = ${cand} < dist[${v}]=${old === Infinity ? '∞' : old}. Update dist[${v}]=${cand} and push (${cand},${v}). The old PQ entry (if any) stays — we just out-prioritize it. PQ = [${pqStr()}].`);
      } else {
        snapshot(u, null,
          `Relax ${u}→${v} (w=${w}): ${dist[u]} + ${w} = ${cand} ≥ dist[${v}]=${dist[v]}. No improvement — leave dist[${v}] alone.`);
      }
    }
  }
  snapshot(null, null,
    `All ${ids.length} nodes finalized. Shortest distances from ${ids[0]}: [${distStr()}]. With a binary heap, total work is O((V+E) log V).`);
  return frames;
}

// Selection sort: find min of remaining, swap into position.
function selectionSortFrames(input = [29, 10, 14, 37, 13, 5]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to sort.' }];
  const a = [...input];
  const frames = [];
  frames.push({ array: [...a], caption: `Selection sort. For each position i, scan the remaining elements, find the minimum, swap it into a[i].` });
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    frames.push({
      array: [...a],
      highlights: { [i]: 'mid' },
      eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
      caption: `i=${i}. Search a[${i}..${a.length - 1}] for the minimum.`,
    });
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[minIdx]) minIdx = j;
      frames.push({
        array: [...a],
        highlights: { [i]: 'low', [j]: 'high', [minIdx]: 'mid' },
        eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
        caption: `j=${j}: a[${j}]=${a[j]}. Current min so far: a[${minIdx}]=${a[minIdx]}.`,
      });
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      frames.push({
        array: [...a],
        highlights: { [i]: 'match', [minIdx]: 'match' },
        eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
        caption: `Swap a[${i}] ↔ a[${minIdx}]. Position ${i} fixed.`,
      });
    }
  }
  frames.push({
    array: [...a],
    highlights: Object.fromEntries(a.map((_, i) => [i, 'match'])),
    caption: `Done. Selection sort is O(n²) but does at most n−1 swaps — useful when writes are expensive.`,
  });
  return frames;
}

// Counting sort: tally occurrences, prefix-sum the tallies into end positions,
// then walk the input right-to-left placing each value stably into the output.
// Frames alternate which array is on screen; captions say which one you see.
function countingSortFrames(input = [4, 2, 2, 8, 3, 3, 1]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to sort.' }];
  const a = [...input];
  const n = a.length;
  const k = Math.max(...a);
  const count = Array(k + 1).fill(0);
  const frames = [];

  frames.push({ array: [...a], caption: `Counting sort: no comparisons. Values live in 0..${k}, so a tally of ${k + 1} buckets replaces sorting entirely.` });
  for (let i = 0; i < n; i++) {
    count[a[i]] += 1;
    frames.push({
      array: [...a],
      highlights: { [i]: 'mid' },
      eliminated: new Set(Array.from({ length: i }, (_, x) => x)),
      caption: `Tally ${a[i]}: bucket ${a[i]} rises to ${count[a[i]]}. Counts so far: [${count.join(', ')}].`,
    });
  }
  frames.push({
    array: [...count],
    highlights: Object.fromEntries(count.map((c, idx) => [idx, c ? 'low' : undefined])),
    caption: `Now showing the count array, indexed by value 0..${k}. count[v] = how many times v appears in the input.`,
  });
  for (let v = 1; v <= k; v++) {
    count[v] += count[v - 1];
    frames.push({
      array: [...count],
      highlights: { [v]: 'mid', [v - 1]: 'low' },
      caption: `Prefix sum: count[${v}] absorbs count[${v - 1}] and becomes ${count[v]} — the number of elements ≤ ${v}, i.e. where the last ${v} ends in sorted order.`,
    });
  }
  const out = Array(n).fill('·');
  frames.push({
    array: [...out],
    caption: `Now showing the output array, all ${n} slots empty. Walk the input right-to-left so equal values keep their original order — that is what makes counting sort stable.`,
  });
  for (let i = n - 1; i >= 0; i--) {
    const v = a[i];
    count[v] -= 1;
    out[count[v]] = v;
    frames.push({
      array: [...out],
      highlights: { [count[v]]: 'match' },
      caption: `Input[${i}] = ${v}: count[${v}] says elements ≤ ${v} end at position ${count[v] + 1}, so ${v} drops into slot ${count[v]}. Decrement count[${v}] to ${count[v]} for the next ${v}.`,
    });
  }
  frames.push({
    array: [...out],
    highlights: Object.fromEntries(out.map((_, idx) => [idx, 'match'])),
    caption: `Sorted: [${out.join(', ')}]. O(n + k) time, O(k) extra space — beats O(n log n) whenever the value range k stays small.`,
  });
  return frames;
}

// Shell sort: insertion sort over gapped subsequences with a shrinking gap.
// Each pass leaves the array gap-sorted, so the final gap=1 pass (plain
// insertion sort) faces almost-sorted input and finishes in near-linear time.
function shellSortFrames(input = [23, 12, 1, 8, 34, 54, 2, 3]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to sort.' }];
  const a = [...input];
  const n = a.length;
  const frames = [];
  const gaps = [];
  for (let g = Math.floor(n / 2); g >= 1; g = Math.floor(g / 2)) gaps.push(g);

  frames.push({ array: [...a], caption: `Shell sort: insertion sort, but on far-apart elements first. Gap sequence here: ${gaps.join(' → ')}. Big gaps move stragglers long distances in one hop.` });
  for (const gap of gaps) {
    const chainHl = {};
    for (let s = 0; s < Math.min(gap, n); s++) {
      for (let idx = s; idx < n; idx += gap) chainHl[idx] = s % 2 === 0 ? 'low' : 'high';
    }
    frames.push({
      array: [...a],
      highlights: gap === 1 ? undefined : chainHl,
      caption: gap === 1
        ? `Final pass, gap=1: plain insertion sort. Earlier passes already herded every element near its home, so few shifts remain.`
        : `Gap = ${gap}: the array splits into ${gap} interleaved chains (elements ${gap} apart, shown in alternating colors). Each chain gets insertion-sorted independently.`,
    });
    for (let i = gap; i < n; i++) {
      const key = a[i];
      let j = i;
      if (a[j - gap] > key) {
        frames.push({
          array: [...a],
          highlights: { [i]: 'mid', [i - gap]: 'high' },
          caption: `The key ${key} at index ${i} is smaller than its gap-neighbour ${a[i - gap]} at index ${i - gap} — it must hop left along its chain.`,
        });
      }
      let moved = false;
      while (j >= gap && a[j - gap] > key) {
        a[j] = a[j - gap];
        j -= gap;
        moved = true;
        const display = [...a];
        display[j] = key;
        frames.push({
          array: display,
          highlights: { [j]: 'mid', [j + gap]: 'low' },
          caption: `${a[j + gap]} slides ${gap} slot${gap === 1 ? '' : 's'} right; the key ${key} hops to index ${j}${j >= gap && a[j - gap] > key ? ` and keeps comparing against ${a[j - gap]}` : ''}.`,
        });
      }
      a[j] = key;
      if (moved) {
        frames.push({
          array: [...a],
          highlights: { [j]: 'match' },
          caption: `The key ${key} settles at index ${j} — its chain is sorted up to here.`,
        });
      }
    }
    frames.push({
      array: [...a],
      highlights: Object.fromEntries(a.map((_, idx) => [idx, 'low'])),
      caption: `Gap-${gap} pass done: every chain of stride ${gap} is sorted. Array: [${a.join(', ')}].`,
    });
  }
  frames.push({
    array: [...a],
    highlights: Object.fromEntries(a.map((_, idx) => [idx, 'match'])),
    caption: `Sorted: [${a.join(', ')}]. Worst case depends on the gap sequence — O(n²) for halving gaps, O(n^1.5) and better for refined sequences. In place, no recursion.`,
  });
  return frames;
}

// BST insertion: insert a sequence of values into an initially-empty BST.
let _bstNodeId = 0;
function bstNode(value) { return { _id: ++_bstNodeId, value, left: null, right: null, state: undefined }; }
function cloneTree(node) {
  if (!node) return null;
  return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
}
function bstInsertionFrames(input = [50, 30, 70, 20, 40, 60, 80, 35]) {
  if (!Array.isArray(input) || !input.length) return [{ tree: null, caption: 'Empty input — nothing to insert.' }];
  const order = [...input];
  const frames = [];
  frames.push({ tree: null, caption: `BST insertion. Rule: every node's left subtree contains values < node, right subtree contains values > node. Insert order: [${order.join(', ')}].` });
  let root = null;
  for (const v of order) {
    if (!root) {
      root = bstNode(v);
      frames.push({ tree: cloneTree({ ...root, state: 'current' }), caption: `Insert ${v}. Empty tree — becomes the root.` });
      continue;
    }
    // Walk and highlight visited nodes
    const snap = cloneTree(root);
    const path = [];
    let cur = root;
    while (true) {
      path.push(cur);
      if (v < cur.value) {
        if (!cur.left) { cur.left = bstNode(v); break; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = bstNode(v); break; }
        cur = cur.right;
      }
    }
    // Build a frame showing the path
    const annotated = cloneTree(root);
    const markPath = (n, originals) => {
      if (!n) return;
      const matchIdx = originals.findIndex(o => o._id === n._id);
      if (matchIdx >= 0) n.state = matchIdx === originals.length - 1 ? 'current' : 'visited';
      else if (n.value === v) n.state = 'done';
      markPath(n.left, originals);
      markPath(n.right, originals);
    };
    markPath(annotated, path);
    frames.push({
      tree: annotated,
      caption: `Insert ${v}. Walk from root, go left if ${v} < node, right if ${v} > node. Path: ${path.map(p => p.value).join(' → ')}.`,
    });
    void snap;
  }
  frames.push({ tree: cloneTree(root), caption: `Final BST after inserting [${order.join(', ')}].` });
  return frames;
}

// Merge sort: visualize as the merge phase only (the recursion is hard to
// show in a single linear strip; the merge is what most people get wrong).
function mergeSortFrames(input = [38, 27, 43, 3, 9, 82, 10]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to merge sort.' }];
  const frames = [];
  const original = [...input];
  const total = original.length;
  const midPt = Math.floor(total / 2);

  function merge(left, right, prefix) {
    const out = [...prefix];
    let i = 0, j = 0;

    const render = (caption) => {
      const merged = [...out];
      const remaining = [...left.slice(i), ...right.slice(j)];
      const arr = [...merged, ...remaining];
      const highlights = {};
      const li = merged.length;
      const ri = merged.length + (left.length - i);
      if (i < left.length) highlights[li] = 'low';
      if (j < right.length) highlights[ri] = 'mid';
      const elim = new Set(Array.from({ length: merged.length }, (_, k) => k));
      while (arr.length < total) arr.push(0);
      frames.push({ array: arr, highlights, eliminated: elim, caption });
    };

    render(`Merge: compare heads of left [${left.join(',')}] and right [${right.join(',')}].`);

    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        out.push(left[i]); i += 1;
        render(`Left head ${out[out.length - 1]} ≤ right head — take from left.`);
      } else {
        out.push(right[j]); j += 1;
        render(`Right head ${out[out.length - 1]} < left head — take from right.`);
      }
    }
    while (i < left.length) { out.push(left[i++]); render(`Left has leftovers — drain.`); }
    while (j < right.length) { out.push(right[j++]); render(`Right has leftovers — drain.`); }

    return out;
  }

  frames.push({ array: [...original], caption: `Merge sort. Split recursively until size 1, then merge sorted pieces back up. We focus on the merge step (the trick most people get wrong).` });

  const leftHalf = original.slice(0, midPt);
  const rightHalf = original.slice(midPt);
  const leftSorted = [...leftHalf].sort((x, y) => x - y);
  const rightSorted = [...rightHalf].sort((x, y) => x - y);

  frames.push({
    array: [...leftSorted, ...rightHalf],
    highlights: Object.fromEntries(leftSorted.map((_, k) => [k, 'match'])),
    caption: `Left half sorted: [${leftSorted.join(', ')}]. Now sort the right half.`,
  });
  frames.push({
    array: [...leftSorted, ...rightSorted],
    highlights: Object.fromEntries([...leftSorted, ...rightSorted].map((_, k) => [k, 'match'])),
    caption: `Right half sorted: [${rightSorted.join(', ')}]. Final merge below.`,
  });
  const finalArr = merge(leftSorted, rightSorted, []);
  frames.push({ array: finalArr, highlights: Object.fromEntries(finalArr.map((_, k) => [k, 'match'])), caption: `Done. Merge sort is O(n log n) worst-case, O(n) extra space.` });
  return frames;
}

// Fibonacci recursion tree (naive recursive fib).
// Shows the call tree for fib(5) and counts duplicate subproblems to motivate memoization.
let _fibNodeId = 0;
function fibNode(n) { return { _id: ++_fibNodeId, value: `fib(${n})`, _n: n, left: null, right: null, state: undefined }; }
function buildFibTree(n) {
  if (n <= 1) return fibNode(n);
  const node = fibNode(n);
  node.left = buildFibTree(n - 1);
  node.right = buildFibTree(n - 2);
  return node;
}
function fibRecursionFrames(n = 6) {
  const N = Math.max(0, Math.min(6, Number(n) || 0));
  if (!Number.isFinite(N)) return [{ tree: { _id: -1, value: 'fib(?)', state: 'current', left: null, right: null }, caption: 'Invalid n.' }];
  _fibNodeId = 0;
  const tree = buildFibTree(N);
  const seen = new Set();
  const dupSet = new Set();
  function walk(node) {
    if (!node) return;
    if (seen.has(node._n) && node._n >= 2) dupSet.add(node._id);
    seen.add(node._n);
    walk(node.left); walk(node.right);
  }
  walk(tree);

  function annotate(node, maxDepth = Infinity, depth = 0) {
    if (!node) return null;
    if (depth > maxDepth) return null;
    return {
      ...node,
      state: dupSet.has(node._id) ? 'visited' : (node._n <= 1 ? 'done' : 'current'),
      left: annotate(node.left, maxDepth, depth + 1),
      right: annotate(node.right, maxDepth, depth + 1),
    };
  }

  const dupCount = dupSet.size;
  const totalCalls = (function count(node) {
    if (!node) return 0;
    return 1 + count(node.left) + count(node.right);
  })(tree);

  const frames = [];
  frames.push({
    tree: { _id: -1, value: `fib(n)`, state: 'current', left: null, right: null },
    caption: `Definition: fib(0)=0, fib(1)=1, otherwise fib(n) = fib(n−1) + fib(n−2). The natural recursive code branches into two calls per non-base node.`,
  });
  frames.push({
    tree: { _id: -1, value: `fib(${N})`, state: 'current', left: null, right: null },
    caption: `Start at fib(${N}). One pending call.`,
  });
  frames.push({
    tree: { _id: -1, value: `fib(${N})`, state: 'current',
      left: { _id: -2, value: `fib(${N - 1})`, state: 'frontier', left: null, right: null },
      right: { _id: -3, value: `fib(${N - 2})`, state: 'frontier', left: null, right: null } },
    caption: `Step 1: fib(${N}) branches into fib(${N - 1}) and fib(${N - 2}). Two new sub-calls.`,
  });
  for (let d = 2; d < N; d++) {
    frames.push({
      tree: annotate(tree, d),
      caption: `Step ${d}: expand the tree one level deeper. Each non-base node spawns two children. Notice repeated sub-problems start appearing.`,
    });
  }
  frames.push({
    tree: annotate(tree),
    caption: `Full call tree for fib(${N}): ${totalCalls} total calls. Filled leaves are base cases (fib(0), fib(1)).`,
  });
  frames.push({
    tree: annotate(tree),
    caption: `${dupCount} nodes (greyed) are duplicate sub-problems the function recomputes. Memoize them and the tree collapses to a linear chain.`,
  });
  frames.push({
    tree: annotate(tree),
    caption: `Takeaway: naive fib is O(2^n) calls. With memoization it drops to O(n). The waste is visible in the tree.`,
  });
  return frames;
}

// Linear vs binary search side-by-side intuition.
function linearVsBinaryFrames(input = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29], targetIn = 23) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to search.' }];
  const arr = [...input];
  const target = Number(targetIn);
  const frames = [];

  frames.push({
    array: arr,
    caption: `Find target ${target} in a sorted array of ${arr.length}. Linear scans one by one (worst-case n steps). Binary halves the range each step (~log₂ n).`,
  });

  // Linear pass
  for (let i = 0; i <= arr.length; i++) {
    if (i === arr.length || arr[i] === target) {
      frames.push({
        array: arr,
        highlights: i < arr.length ? { [i]: 'match' } : {},
        caption: i < arr.length
          ? `Linear: found at index ${i} after ${i + 1} comparisons.`
          : `Linear: scanned all ${arr.length} positions.`,
      });
      break;
    }
    frames.push({
      array: arr,
      highlights: { [i]: 'low' },
      caption: `Linear step ${i + 1}: check arr[${i}] = ${arr[i]}.`,
    });
  }

  // Binary
  let lo = 0, hi = arr.length - 1, steps = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps += 1;
    if (arr[mid] === target) {
      frames.push({
        array: arr,
        highlights: { [mid]: 'match' },
        eliminated: new Set([...Array(lo).keys(), ...Array.from({ length: arr.length - hi - 1 }, (_, k) => hi + 1 + k)]),
        caption: `Binary step ${steps}: found at index ${mid}. Total binary steps: ${steps} (vs ${arr.length / 2 | 0}+ for linear).`,
      });
      break;
    }
    const elim = new Set([...Array(lo).keys(), ...Array.from({ length: arr.length - hi - 1 }, (_, k) => hi + 1 + k)]);
    frames.push({
      array: arr,
      highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
      eliminated: elim,
      caption: `Binary step ${steps}: lo=${lo}, hi=${hi}, mid=${mid}. arr[mid]=${arr[mid]} ${arr[mid] < target ? '< ' + target + ' → go right' : '> ' + target + ' → go left'}.`,
    });
    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return frames;
}

// Stack ops walkthrough (push/pop sequence on an array displayed as bars).
function stackOpsFrames(opsStr = 'push 3 push 7 push 5 pop push 9 pop pop') {
  const tokens = String(opsStr || '').trim().split(/\s+/).filter(Boolean);
  const ops = [];
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k].toLowerCase();
    if (t === 'push') {
      const v = Number(tokens[k + 1]);
      if (Number.isFinite(v)) { ops.push({ op: 'push', v }); k += 1; }
    } else if (t === 'pop') {
      ops.push({ op: 'pop' });
    }
  }
  if (!ops.length) return [{ array: [], caption: 'No valid ops — use tokens like "push 1 push 2 pop".' }];
  const frames = [];
  const stack = [];
  frames.push({ array: [], caption: `Stack: LIFO (last-in, first-out). Push adds to the top; pop removes from the top. Both O(1).` });
  frames.push({ array: [], caption: `Setup: empty stack. We'll process ${ops.length} ops in order. The right end of the bar chart represents the top of the stack.` });
  let pushes = 0, pops = 0;
  for (let step = 0; step < ops.length; step++) {
    const o = ops[step];
    if (o.op === 'push') {
      stack.push(o.v);
      pushes += 1;
      frames.push({
        array: [...stack],
        highlights: { [stack.length - 1]: 'match' },
        caption: `Step ${step + 1}: push(${o.v}) → top of stack. Size now ${stack.length}. Stack: [${stack.join(', ')}].`,
      });
    } else {
      if (!stack.length) {
        frames.push({ array: [], caption: `Step ${step + 1}: pop() on empty stack — underflow, skipping.` });
        continue;
      }
      const popped = stack.pop();
      pops += 1;
      frames.push({
        array: [...stack, popped],
        highlights: { [stack.length]: 'high' },
        eliminated: new Set([stack.length]),
        caption: `Step ${step + 1}: pop() removes ${popped} (the most recent push — LIFO). Stack: [${stack.join(', ') || 'empty'}].`,
      });
    }
  }
  frames.push({
    array: [...stack],
    highlights: Object.fromEntries(stack.map((_, i) => [i, 'match'])),
    caption: `Done. ${pushes} pushes, ${pops} pops. Final stack: [${stack.join(', ') || 'empty'}]. Each op was O(1).`,
  });
  return frames;
}

// Queue (FIFO) push/pop sequence.
function queueOpsFrames(opsStr = 'enq 3 enq 7 enq 5 deq enq 9 deq deq') {
  const tokens = String(opsStr || '').trim().split(/\s+/).filter(Boolean);
  const ops = [];
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k].toLowerCase();
    if (t === 'enq' || t === 'enqueue' || t === 'push') {
      const v = Number(tokens[k + 1]);
      if (Number.isFinite(v)) { ops.push({ op: 'enq', v }); k += 1; }
    } else if (t === 'deq' || t === 'dequeue' || t === 'pop') {
      ops.push({ op: 'deq' });
    }
  }
  if (!ops.length) return [{ array: [], caption: 'No valid ops — use tokens like "enq 1 enq 2 deq".' }];
  const frames = [];
  const queue = [];
  frames.push({ array: [], caption: `Queue: FIFO (first-in, first-out). Enqueue at the back; dequeue from the front. Both O(1) with a doubly-linked list or ring buffer.` });
  frames.push({ array: [], caption: `Setup: empty queue. We'll process ${ops.length} ops. The left end of the bar chart is the front (next to leave); the right end is the back (most recent arrival).` });
  let enqs = 0, deqs = 0;
  for (let step = 0; step < ops.length; step++) {
    const o = ops[step];
    if (o.op === 'enq') {
      queue.push(o.v);
      enqs += 1;
      frames.push({
        array: [...queue],
        highlights: { [queue.length - 1]: 'match' },
        caption: `Step ${step + 1}: enqueue(${o.v}) at back. Size now ${queue.length}. Queue front → back: [${queue.join(', ')}].`,
      });
    } else {
      if (!queue.length) {
        frames.push({ array: [], caption: `Step ${step + 1}: dequeue() on empty queue — underflow, skipping.` });
        continue;
      }
      const head = queue.shift();
      deqs += 1;
      frames.push({
        array: [head, ...queue],
        highlights: { 0: 'high' },
        eliminated: new Set([0]),
        caption: `Step ${step + 1}: dequeue() removes ${head} (the oldest entry — FIFO). Queue: [${queue.join(', ') || 'empty'}].`,
      });
    }
  }
  frames.push({
    array: [...queue],
    highlights: Object.fromEntries(queue.map((_, i) => [i, 'match'])),
    caption: `Done. ${enqs} enqueues, ${deqs} dequeues. Final queue: [${queue.join(', ') || 'empty'}]. Each op O(1).`,
  });
  return frames;
}

// DFS traversal on a small graph from node 0.
function dfsFrames() {
  const nodes = [
    { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
    { id: 3, label: '3' }, { id: 4, label: '4' }, { id: 5, label: '5' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 },
    { a: 1, b: 3 }, { a: 1, b: 4 },
    { a: 2, b: 5 },
  ];
  const adj = { 0: [1, 2], 1: [0, 3, 4], 2: [0, 5], 3: [1], 4: [1], 5: [2] };

  const frames = [];
  const visited = new Set();
  const stack = [0];
  const treeEdges = new Set();

  const snapshot = (current, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      state: n.id === current ? 'current'
        : visited.has(n.id) ? 'visited'
        : stack.includes(n.id) ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      const k1 = `${e.a}-${e.b}`, k2 = `${e.b}-${e.a}`;
      if (treeEdges.has(k1) || treeEdges.has(k2)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapshot(0, `DFS from 0. Stack = [0]. The strategy: pop the top, mark visited, push its unvisited neighbors. Keep going until the stack drains.`);
  snapshot(0, `Why a stack? It encodes "explore the most recently discovered node first" — that's depth-first. (Swap stack for queue and you'd get BFS.)`);
  let prevParent = null;
  let stepNum = 0;
  while (stack.length) {
    const u = stack.pop();
    if (visited.has(u)) continue;
    stepNum += 1;
    visited.add(u);
    if (prevParent != null && adj[u].includes(prevParent)) treeEdges.add(`${prevParent}-${u}`);
    snapshot(u, `Step ${stepNum}: pop ${u}. Mark visited. Visited so far: {${[...visited].join(', ')}}.`);
    const pushed = [];
    for (const v of adj[u]) {
      if (!visited.has(v)) { stack.push(v); treeEdges.add(`${u}-${v}`); pushed.push(v); }
    }
    if (pushed.length) {
      snapshot(u, `Push unvisited neighbors of ${u}: [${pushed.join(', ')}] onto the stack. Stack top → bottom: [${[...stack].reverse().join(', ')}].`);
    } else {
      snapshot(u, `${u} has no unvisited neighbors — a dead end. Backtrack by popping the next item from the stack.`);
    }
    prevParent = u;
  }
  snapshot(null, `Stack empty — DFS complete. Order visited: ${[...visited].join(' → ')}.`);
  snapshot(null, `Tree edges (green) form a DFS spanning tree. Each non-tree edge of the graph would be a "back" or "cross" edge — useful for cycle detection and articulation points.`);
  return frames;
}

// Union-Find with path compression on 7 nodes.
function unionFindFrames(input = [7, 0, 1, 2, 3, 1, 3, 4, 5, 5, 6, 0, 6]) {
  if (!Array.isArray(input) || input.length < 1) return [{ array: [], caption: 'Empty input — nothing to union.' }];
  const n = Math.max(1, Math.floor(Number(input[0]) || 0));
  if (n < 1) return [{ array: [], caption: 'Need at least 1 node.' }];
  const pairsFlat = input.slice(1);
  const opsList = [];
  for (let k = 0; k + 1 < pairsFlat.length; k += 2) {
    const a = Math.max(0, Math.min(n - 1, Math.floor(Number(pairsFlat[k]) || 0)));
    const b = Math.max(0, Math.min(n - 1, Math.floor(Number(pairsFlat[k + 1]) || 0)));
    opsList.push(['union', a, b]);
  }
  const parent = Array.from({ length: n }, (_, i) => i);
  const frames = [];

  function find(x) {
    if (parent[x] === x) return x;
    parent[x] = find(parent[x]); // path compression
    return parent[x];
  }
  function snapshot(caption) {
    // Render parent[] as an array of bars where bar height = depth-to-root.
    const depth = (x) => parent[x] === x ? 1 : 1 + depth(parent[x]);
    frames.push({
      array: Array.from({ length: n }, (_, i) => depth(i)),
      caption,
    });
  }
  snapshot(`Union-Find (Disjoint Set Union). Track which nodes belong to which group via a parent[] array. Each bar's height = its depth to the root.`);
  snapshot(`Start: every one of ${n} nodes is its own parent — ${n} singleton sets. parent[] = [${parent.join(',')}]. We'll merge them with ${opsList.length} union ops.`);
  let opNum = 0;
  for (const [_op, a, b] of opsList) {
    opNum += 1;
    const ra = find(a), rb = find(b);
    if (ra !== rb) {
      parent[ra] = rb;
      snapshot(`Op ${opNum}: union(${a}, ${b}). find(${a})=${ra}, find(${b})=${rb} — different roots. Attach ${ra} under ${rb}. parent[] = [${parent.join(',')}].`);
    } else {
      snapshot(`Op ${opNum}: union(${a}, ${b}). Both already share root ${ra} — same set, no-op.`);
    }
  }
  const rootsBefore = new Set();
  for (let i = 0; i < n; i++) rootsBefore.add(find(i));
  snapshot(`After all unions: ${rootsBefore.size} distinct component${rootsBefore.size === 1 ? '' : 's'}. parent[] = [${parent.join(',')}].`);
  find(0);
  snapshot(`Run find(0) with path compression: every node on the lookup path is re-pointed directly at the root. parent[] = [${parent.join(',')}]. Future ops are near-O(1) amortized.`);
  return frames;
}

// Knapsack 0/1 DP — fill the dp[i][w] grid.
function knapsackDPFrames(weights = [2, 3, 4, 5], values = [3, 4, 5, 6], capacity = 8) {
  if (!Array.isArray(weights) || !Array.isArray(values) || !weights.length || !values.length) {
    return [{ array: [], caption: 'Empty input — nothing to pack.' }];
  }
  const len = Math.min(weights.length, values.length);
  const items = Array.from({ length: len }, (_, k) => ({ w: Number(weights[k]) || 0, v: Number(values[k]) || 0 }));
  const W = Math.max(0, Math.floor(Number(capacity) || 0));
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  const frames = [];

  // Flatten the (n+1) x (W+1) grid into a 1D bar chart for the renderer.
  // For clarity, only show the current row + previous row stacked: 2*(W+1) cells.
  const renderRowPair = (i, caption, highlights = {}) => {
    const arr = [...dp[i - 1], ...dp[i]];
    frames.push({
      array: arr,
      highlights,
      caption,
    });
  };

  frames.push({
    array: dp.flat(),
    caption: `0/1 Knapsack DP. items = [${items.map(it => `(w=${it.w},v=${it.v})`).join(', ')}], capacity ${W}. Each item is take-it-or-leave-it.`,
  });
  frames.push({
    array: dp.flat(),
    caption: `State: dp[i][w] = max value using only the first i items with total weight ≤ w. Two choices for item i: skip it (dp[i−1][w]) or take it (dp[i−1][w−wᵢ] + vᵢ).`,
  });
  frames.push({
    array: dp[0],
    caption: `Base row dp[0][*] = 0 (no items chosen → no value). All ${W + 1} cells start at 0. Each next row depends only on the row above.`,
  });
  frames.push({
    array: dp[0],
    caption: `We'll fill ${n} rows from top to bottom, each row reading left-to-right. Each cell is the answer for a smaller sub-problem of the original — classic bottom-up DP.`,
  });
  for (let i = 1; i <= n; i++) {
    const it = items[i - 1];
    for (let w = 1; w <= W; w++) {
      if (it.w > w) dp[i][w] = dp[i - 1][w];
      else dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - it.w] + it.v);
    }
    renderRowPair(i,
      `Item ${i} (w=${it.w}, v=${it.v}): row dp[${i}] = [${dp[i].join(',')}]. Bottom strip = previous row; top strip (highlighted) = new row.`,
      Object.fromEntries(Array.from({ length: W + 1 }, (_, k) => [W + 1 + k, 'mid']))
    );
  }
  frames.push({
    array: dp[n],
    caption: `All ${n} rows filled. Final row dp[${n}] = [${dp[n].join(',')}]. Read off the answer at column W = ${W}.`,
  });
  frames.push({
    array: dp[n],
    highlights: { [W]: 'match' },
    caption: `Answer = dp[${n}][${W}] = ${dp[n][W]}. O(n·W) time, O(n·W) space (collapsible to O(W) by iterating w right-to-left).`,
  });
  return frames;
}

// Topological sort with Kahn's algorithm on a small DAG.
function topoSortFrames() {
  const nodes = [
    { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
    { id: 3, label: '3' }, { id: 4, label: '4' }, { id: 5, label: '5' },
  ];
  // edges as directed pairs (a -> b)
  const edges = [
    { a: 5, b: 2 }, { a: 5, b: 0 },
    { a: 4, b: 0 }, { a: 4, b: 1 },
    { a: 2, b: 3 }, { a: 3, b: 1 },
  ];
  const indeg = {};
  nodes.forEach(n => { indeg[n.id] = 0; });
  edges.forEach(e => { indeg[e.b] = (indeg[e.b] || 0) + 1; });

  const frames = [];
  const order = [];
  const queue = nodes.filter(n => indeg[n.id] === 0).map(n => n.id);

  const snapshot = (current, taken, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      state: n.id === current ? 'current'
        : taken.includes(n.id) ? 'done'
        : queue.includes(n.id) ? 'frontier'
        : undefined,
      label: `${n.id}\nin=${indeg[n.id]}`,
    }));
    frames.push({ nodes: ns, edges, caption });
  };

  snapshot(null, [], `Topological sort orders a DAG so every edge points forward. Kahn's algorithm uses in-degrees: a node can come next only if nothing points to it.`);
  snapshot(null, [], `Initial in-degrees shown on each node. Nodes with in=0 have no prerequisites and can be processed immediately.`);
  snapshot(null, [], `Seed the queue with all in-degree-0 nodes: [${queue.join(', ')}].`);
  let stepNum = 0;
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    stepNum += 1;
    const outNeighbors = edges.filter(e => e.a === u).map(e => e.b);
    snapshot(u, [...order], `Step ${stepNum}: pop ${u}. Append to output order: [${order.join(' → ')}]. Out-neighbors of ${u}: [${outNeighbors.join(', ') || 'none'}].`);
    const newlyZero = [];
    for (const e of edges) {
      if (e.a === u) {
        indeg[e.b] -= 1;
        if (indeg[e.b] === 0) { queue.push(e.b); newlyZero.push(e.b); }
      }
    }
    if (newlyZero.length) {
      snapshot(u, [...order], `Decremented in-degrees of out-neighbors. Newly freed nodes (in-degree now 0): [${newlyZero.join(', ')}]. Queue: [${queue.join(', ')}].`);
    }
  }
  snapshot(null, order, `Topological order: [${order.join(' → ')}]. If order.length < ${nodes.length} we'd have detected a cycle (some node never reaches in-degree 0).`);
  return frames;
}

// Sliding window MAX using a monotonic decreasing deque of indices.
function slidingWindowMaxFrames(input = [1, 3, -1, -3, 5, 3, 6, 7], k = 3) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — no windows.' }];
  const kSize = Math.max(1, Math.min(input.length, Math.floor(Number(k) || 1)));
  const arr = [...input];
  const frames = [];
  const dq = []; // stores indices; arr[dq] is decreasing left→right
  const out = [];

  frames.push({
    array: arr,
    caption: `Sliding window max, k=${kSize}. Use a monotonic-decreasing deque of indices. arr[front] is always the max in the current window.`,
  });
  for (let i = 0; i < arr.length; i++) {
    while (dq.length && arr[dq[dq.length - 1]] <= arr[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - kSize) dq.shift();
    frames.push({
      array: arr,
      window: [Math.max(0, i - kSize + 1), i],
      caption: `i=${i}. Pop indices whose value ≤ arr[${i}]=${arr[i]} (they can never be the max while ${arr[i]} is in the window). Push ${i}. Deque indices: [${dq.join(', ')}].`,
    });
    if (i >= kSize - 1) {
      out.push(arr[dq[0]]);
      frames.push({
        array: arr,
        window: [i - kSize + 1, i],
        highlights: { [dq[0]]: 'match' },
        caption: `Window arr[${i - kSize + 1}..${i}] complete. Max = arr[${dq[0]}] = ${arr[dq[0]]}. Output so far: [${out.join(', ')}].`,
      });
    }
  }
  frames.push({
    array: arr,
    caption: `Done. Output [${out.join(', ')}]. O(n) total — each index pushed and popped at most once.`,
  });
  return frames;
}

// Longest Common Subsequence DP grid fill (visual: 1-D row-pair like knapsack).
function lcsFrames(strA = 'AGGTAB', strB = 'GXTXAYB') {
  const a = String(strA ?? '');
  const b = String(strB ?? '');
  if (!a.length || !b.length) return [{ array: [], caption: 'Empty input — LCS is "".' }];
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const frames = [];

  frames.push({
    array: dp.flat(),
    caption: `LCS of "${a}" and "${b}". A common subsequence keeps relative order but skips chars. Goal: longest such subsequence.`,
  });
  frames.push({
    array: dp.flat(),
    caption: `Define dp[i][j] = LCS length of a[0..i−1] and b[0..j−1]. Recurrence: if a[i−1]==b[j−1] → dp[i−1][j−1] + 1. Otherwise → max(dp[i−1][j], dp[i][j−1]).`,
  });
  frames.push({
    array: dp[0],
    caption: `Base row dp[0][*] = 0 (empty prefix of A → LCS is 0 with anything). Similarly the leftmost column dp[*][0] = 0.`,
  });
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
    frames.push({
      array: dp[i],
      caption: `Row ${i} (a[${i - 1}]='${a[i - 1]}'): dp[${i}] = [${dp[i].join(',')}]. Match → diagonal+1; mismatch → max(up, left).`,
    });
  }
  frames.push({
    array: dp[m],
    caption: `All ${m} rows complete. Bottom-right cell holds the answer.`,
  });
  frames.push({
    array: dp[m],
    highlights: { [n]: 'match' },
    caption: `LCS length = dp[${m}][${n}] = ${dp[m][n]}. Reconstruct the actual subsequence by walking back through the grid following the parent decision at each cell.`,
  });
  return frames;
}

// Prefix sum: build the prefix array, then answer a range query in O(1).
function prefixSumFrames(arr = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3], queryL = 2, queryR = 6) {
  if (!arr.length) return [{ array: [], caption: 'Empty array.' }];
  const l = Math.max(0, Math.min(arr.length - 1, queryL));
  const r = Math.max(l, Math.min(arr.length - 1, queryR));
  const prefix = [0];
  for (const x of arr) prefix.push(prefix[prefix.length - 1] + x);
  const frames = [];
  frames.push({
    array: arr,
    caption: `Prefix sum. Goal: answer range-sum(l, r) in O(1) after O(n) preprocessing.`,
  });
  for (let i = 1; i <= arr.length; i++) {
    frames.push({
      array: prefix.slice(0, i + 1),
      highlights: { [i]: 'mid' },
      caption: `prefix[${i}] = prefix[${i - 1}] + arr[${i - 1}] = ${prefix[i - 1]} + ${arr[i - 1]} = ${prefix[i]}.`,
    });
  }
  // Sample range query
  const ans = prefix[r + 1] - prefix[l];
  frames.push({
    array: prefix,
    highlights: { [r + 1]: 'mid', [l]: 'low' },
    caption: `Range query sum(${l}, ${r}) = prefix[${r + 1}] − prefix[${l}] = ${prefix[r + 1]} − ${prefix[l]} = ${ans}. O(1) per query.`,
  });
  return frames;
}

// Quickselect — find the kth-smallest in expected O(n).
function quickselectFrames(input = [7, 2, 9, 4, 1, 6, 3, 8, 5], kArg = 4) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — no kth element.' }];
  const a = [...input];
  const k = Math.max(1, Math.min(a.length, Math.floor(Number(kArg) || 1)));
  const frames = [];
  frames.push({
    array: a,
    caption: `Quickselect: find the ${k}-th smallest in [${a.join(', ')}]. Avoid fully sorting — we only need one element.`,
  });
  frames.push({
    array: a,
    caption: `Idea: pick a pivot and partition (Lomuto). The pivot lands at its final sorted index p. If p == ${k - 1} we're done; else recurse only into the side that contains index ${k - 1}.`,
  });
  frames.push({
    array: a,
    caption: `Why it's O(n) average: each partition discards a constant fraction of the array. n + n/2 + n/4 + ... = O(n). Worst case is O(n²) (mitigated by random pivot).`,
  });
  const arr = [...a];
  function partition(lo, hi) {
    const pivot = arr[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (arr[j] <= pivot) {
        i += 1;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
    return i + 1;
  }
  let lo = 0, hi = arr.length - 1;
  let roundNum = 0;
  while (lo <= hi) {
    roundNum += 1;
    const pivotVal = arr[hi];
    frames.push({
      array: [...arr],
      highlights: { [hi]: 'mid' },
      eliminated: new Set([...Array(lo).keys(), ...Array.from({ length: arr.length - hi - 1 }, (_, kk) => hi + 1 + kk)]),
      caption: `Round ${roundNum}: active range arr[${lo}..${hi}]. Pick pivot = arr[${hi}] = ${pivotVal} (last element). Partition the active range around it.`,
    });
    const p = partition(lo, hi);
    const elim = new Set();
    if (p < k - 1) {
      for (let i = lo; i <= p; i++) elim.add(i);
    } else if (p > k - 1) {
      for (let i = p; i <= hi; i++) elim.add(i);
    }
    frames.push({
      array: [...arr],
      highlights: { [p]: 'mid' },
      eliminated: elim,
      caption: `Round ${roundNum}: pivot ${pivotVal} settles at index ${p}. Target index ${k - 1} ${p === k - 1 ? 'matches — done!' : p < k - 1 ? `> ${p} → recurse on the right half [${p + 1}..${hi}].` : `< ${p} → recurse on the left half [${lo}..${p - 1}].`}`,
    });
    if (p === k - 1) {
      frames.push({
        array: [...arr],
        highlights: { [p]: 'match' },
        caption: `Done in ${roundNum} partition round${roundNum === 1 ? '' : 's'}. ${k}-th smallest = ${arr[p]}.`,
      });
      return frames;
    }
    if (p < k - 1) lo = p + 1; else hi = p - 1;
  }
  return frames;
}

// Trie insert — build a prefix tree for the words: cat, car, card.
function trieFrames() {
  let nextId = 1;
  const root = { _id: 0, value: '·', state: 'visited', left: null, right: null };
  const frames = [];
  frames.push({ tree: structuredClone(root), caption: 'Trie: each node represents one character; each edge labels a letter. Words share common prefixes — that\'s the whole point.' });
  frames.push({ tree: structuredClone(root), caption: 'Start with a single empty root node (shown as "·"). We will insert "cat", "car", "card" one at a time.' });

  const tNode = (val) => ({ _id: ++nextId, value: val, state: 'frontier', left: null, right: null });
  const cNode = tNode('c'); root.left = cNode;
  frames.push({ tree: structuredClone(root), caption: `Insert "cat" — char 1 of 3. Root has no 'c' child → create node 'c'. Descend.` });
  const aNode = tNode('a'); cNode.left = aNode;
  frames.push({ tree: structuredClone(root), caption: `Insert "cat" — char 2 of 3. Node 'c' has no 'a' child → create node 'a'. Descend.` });
  const tEndNode = tNode('t'); tEndNode.state = 'done';
  aNode.left = tEndNode;
  frames.push({ tree: structuredClone(root), caption: `Insert "cat" — char 3 of 3. Append 't' and mark isEnd=true (green) so we know "cat" is a complete word.` });
  frames.push({ tree: structuredClone(root), caption: `"cat" stored. Insertion is O(length-of-word). Now insert "car".` });
  const rNode = tNode('r'); aNode.right = rNode;
  frames.push({ tree: structuredClone(root), caption: `Insert "car" — walk root → 'c' → 'a' (both already exist, no work). 'a' has no 'r' child → create node 'r'.` });
  rNode.state = 'done';
  frames.push({ tree: structuredClone(root), caption: `Mark 'r' as isEnd=true. "car" complete. Notice "cat" and "car" share the c→a prefix — that's the trie's win for prefix queries.` });
  frames.push({ tree: structuredClone(root), caption: `Now insert "card". It extends "car" by one character.` });
  const dNode = tNode('d'); dNode.state = 'done';
  rNode.left = dNode;
  frames.push({ tree: structuredClone(root), caption: `Walk c → a → r (existing). Append 'd' with isEnd=true. Note: 'r' stays isEnd=true ("car" is still a word).` });
  frames.push({ tree: structuredClone(root), caption: `All 3 words stored in shared structure. Lookup, prefix-search, and autocomplete are now O(query length).` });
  return frames;
}

// Hashmap collision via separate chaining.
function hashCollisionFrames(keysStr = '10 22 31 4 15 28 17 88 59 7') {
  const tokens = String(keysStr || '').trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [{ array: [], caption: 'No keys — provide tokens to hash.' }];
  const BUCKETS = 7;
  const buckets = Array.from({ length: BUCKETS }, () => []);
  const frames = [];

  const hashOf = (tok) => {
    const num = Number(tok);
    if (Number.isFinite(num) && /^-?\d+$/.test(tok)) return ((num % BUCKETS) + BUCKETS) % BUCKETS;
    let h = 0;
    for (let i = 0; i < tok.length; i++) h = (h * 31 + tok.charCodeAt(i)) >>> 0;
    return h % BUCKETS;
  };

  const snapshot = (caption, highlightIdx) => {
    frames.push({
      array: buckets.map(b => b.length),
      highlights: highlightIdx >= 0 ? { [highlightIdx]: 'mid' } : {},
      caption,
    });
  };
  snapshot(`Hash table with ${BUCKETS} buckets. Insert each key; bucket index = hash(key) % ${BUCKETS}. Collisions go into a linked list at that bucket.`, -1);
  for (const k of tokens) {
    const idx = hashOf(k);
    buckets[idx].push(k);
    snapshot(`Insert ${k}. hash(${k}) % ${BUCKETS} = ${idx}. Bucket ${idx} now: [${buckets[idx].join(' → ')}].`, idx);
  }
  const max = Math.max(...buckets.map(b => b.length));
  snapshot(`Done. Worst bucket has ${max} entries. With load factor ≈ ${(tokens.length / BUCKETS).toFixed(2)}, collisions are expected. Resize at LF > 0.75 to keep ops O(1) amortized.`, -1);
  return frames;
}

// Bubble sort: adjacent compares + swaps with passes.
function bubbleSortFrames(input = [5, 1, 4, 2, 8]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — nothing to sort.' }];
  const frames = [];
  const a = [...input];
  const n = a.length;
  let swaps = 0, compares = 0;
  frames.push({ array: [...a], caption: `Bubble sort. Compare adjacent pairs left-to-right; swap if out of order; repeat.` });
  for (let i = 0; i < n - 1; i++) {
    let swappedThisPass = false;
    for (let j = 0; j < n - 1 - i; j++) {
      compares += 1;
      frames.push({
        array: [...a],
        highlights: { [j]: 'low', [j + 1]: 'mid' },
        caption: `Pass ${i + 1}, compare arr[${j}]=${a[j]} and arr[${j + 1}]=${a[j + 1]}.`,
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps += 1;
        swappedThisPass = true;
        frames.push({
          array: [...a],
          highlights: { [j]: 'match', [j + 1]: 'match' },
          caption: `Out of order — swap. Array now [${a.join(', ')}].`,
        });
      }
    }
    if (!swappedThisPass) {
      frames.push({ array: [...a], caption: `No swaps this pass — array is sorted. Early exit.` });
      break;
    }
  }
  frames.push({
    array: [...a],
    highlights: Object.fromEntries(a.map((_, i) => [i, 'match'])),
    caption: `Done. ${compares} comparisons, ${swaps} swaps. Bubble sort is O(n²) worst-case.`,
  });
  return frames;
}

// KMP failure-function build on "ababcabab".
function kmpFailureFrames(pattern = 'ababcabab') {
  const p = Array.from(String(pattern || 'ababcabab'));
  if (!p.length) return [{ array: [], caption: 'Empty pattern.' }];
  const pi = new Array(p.length).fill(0);
  const frames = [];
  frames.push({
    array: p, highlights: {},
    caption: `Build the failure function (pi) for pattern "${p.join('')}". pi[i] = length of the longest proper prefix == suffix in p[0..i].`,
  });
  let k = 0;
  for (let i = 1; i < p.length; i++) {
    while (k > 0 && p[k] !== p[i]) {
      frames.push({
        array: p, highlights: { [k]: 'mid', [i]: 'low' },
        caption: `Mismatch at i=${i} (p[${k}]='${p[k]}' vs p[${i}]='${p[i]}'). Fall back: k = pi[${k - 1}] = ${pi[k - 1]}.`,
      });
      k = pi[k - 1];
    }
    if (p[k] === p[i]) {
      k++;
      frames.push({
        array: p, highlights: { [k - 1]: 'match', [i]: 'mid' },
        caption: `Match: p[${k - 1}]==p[${i}]='${p[i]}'. k advances to ${k}.`,
      });
    }
    pi[i] = k;
    frames.push({
      array: p, highlights: { [i]: 'match' },
      caption: `pi[${i}] = ${k}. Current pi = [${pi.join(', ')}].`,
    });
  }
  frames.push({
    array: p, highlights: Object.fromEntries(p.map((_, i) => [i, 'match'])),
    caption: `Done. pi = [${pi.join(', ')}]. Use pi to skip rework during matching against any text.`,
  });
  return frames;
}

// Segment tree build on [3, 1, 4, 1, 5, 9, 2, 6] for range sum.
function segmentTreeBuildFrames() {
  const arr = [3, 1, 4, 1, 5, 9, 2, 6];
  const n = arr.length;
  const tree = new Array(4 * n).fill(0);
  const frames = [];
  frames.push({
    array: arr,
    caption: `Build a segment tree for range-sum over [${arr.join(', ')}]. Each node stores the sum of a sub-range.`,
  });
  function build(node, l, r) {
    if (l === r) {
      tree[node] = arr[l];
      frames.push({
        array: arr, highlights: { [l]: 'match' },
        caption: `Leaf node ${node}: range [${l}, ${l}] = ${arr[l]}.`,
      });
      return;
    }
    const mid = (l + r) >> 1;
    build(2 * node, l, mid);
    build(2 * node + 1, mid + 1, r);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
    const hl = {};
    for (let i = l; i <= r; i++) hl[i] = 'mid';
    frames.push({
      array: arr, highlights: hl,
      caption: `Internal node ${node}: range [${l}, ${r}] sum = ${tree[2 * node]} + ${tree[2 * node + 1]} = ${tree[node]}.`,
    });
  }
  build(1, 0, n - 1);
  frames.push({
    array: arr, highlights: Object.fromEntries(arr.map((_, i) => [i, 'match'])),
    caption: `Done. Root holds total = ${tree[1]}. Range-sum queries now run in O(log n).`,
  });
  return frames;
}

// Bellman-Ford on a tiny weighted graph with a negative edge.
function bellmanFordFrames() {
  const nodes = [
    { id: 0, label: 'S=0' }, { id: 1, label: '1' }, { id: 2, label: '2' }, { id: 3, label: '3' },
  ];
  const edges = [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 5 },
    { from: 1, to: 2, weight: -3 },
    { from: 2, to: 3, weight: 4 },
    { from: 1, to: 3, weight: 8 },
  ];
  const dist = [0, Infinity, Infinity, Infinity];
  const frames = [];
  frames.push({
    nodes: nodes.map(n => ({ ...n, label: `${n.label} (∞)` })),
    edges, highlightedNodes: { 0: 'visited' },
    caption: `Bellman-Ford from node 0. Handles negative edge weights (Dijkstra cannot). Note edge 1→2 has weight -3.`,
  });
  frames.push({
    nodes: nodes.map((n, i) => ({ ...n, label: `${n.label} (${dist[i] === Infinity ? '∞' : dist[i]})` })),
    edges, highlightedNodes: { 0: 'current' },
    caption: `Initialize dist[source]=0, all others = ∞. We will relax every edge V−1 = ${nodes.length - 1} times. Each pass can only push distances down.`,
  });
  for (let iter = 1; iter < nodes.length; iter++) {
    let relaxedThisIter = 0;
    frames.push({
      nodes: nodes.map((n, i) => ({ ...n, label: `${n.label} (${dist[i] === Infinity ? '∞' : dist[i]})` })),
      edges, highlightedNodes: { 0: 'visited' },
      caption: `Iter ${iter}/${nodes.length - 1}: sweep all ${edges.length} edges. For each (u→v, w), if dist[u]+w < dist[v], update dist[v].`,
    });
    for (const e of edges) {
      if (dist[e.from] !== Infinity && dist[e.from] + e.weight < dist[e.to]) {
        const oldDist = dist[e.to];
        dist[e.to] = dist[e.from] + e.weight;
        relaxedThisIter += 1;
        frames.push({
          nodes: nodes.map((n, i) => ({ ...n, label: `${n.label} (${dist[i] === Infinity ? '∞' : dist[i]})` })),
          edges, highlightedNodes: { [e.from]: 'visited', [e.to]: 'current' },
          highlightedEdges: [{ from: e.from, to: e.to }],
          caption: `Iter ${iter}: relax ${e.from}→${e.to} (w=${e.weight}). dist[${e.to}] : ${oldDist === Infinity ? '∞' : oldDist} → ${dist[e.to]}.`,
        });
      }
    }
    frames.push({
      nodes: nodes.map((n, i) => ({ ...n, label: `${n.label} (${dist[i] === Infinity ? '∞' : dist[i]})` })),
      edges, highlightedNodes: { 0: 'visited' },
      caption: `End of iter ${iter}: ${relaxedThisIter} edge${relaxedThisIter === 1 ? '' : 's'} relaxed. ${relaxedThisIter === 0 ? 'No change → distances have converged early.' : 'Continue to next iteration.'}`,
    });
  }
  frames.push({
    nodes: nodes.map((n, i) => ({ ...n, label: `${n.label} (${dist[i]})` })),
    edges, highlightedNodes: Object.fromEntries(nodes.map(n => [n.id, 'visited'])),
    caption: `Done. Shortest paths from 0: ${dist.join(', ')}. Total time O(V·E). A V-th pass that still relaxes an edge → a negative cycle exists.`,
  });
  return frames;
}

// BST inorder traversal on a small tree — produces sorted order.
function bstInorderFrames() {
  const arr = [5, 3, 7, 2, 4, 6, 8];
  const frames = [];
  frames.push({ array: arr, caption: `Inorder traversal of a BST visits nodes in the order: left subtree → node → right subtree.` });
  frames.push({ array: arr, highlights: { 0: 'mid' }, caption: `Here the BST was built by inserting [${arr.join(', ')}]. Root = ${arr[0]}. Children of root: ${arr[1]} (left) and ${arr[2]} (right).` });
  const visited = [];
  const sorted = [...arr].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    visited.push(sorted[i]);
    frames.push({
      array: arr,
      highlights: { [arr.indexOf(sorted[i])]: 'match' },
      caption: `Visit ${sorted[i]} (step ${i + 1}). Visited so far: [${visited.join(', ')}].`,
    });
  }
  frames.push({
    array: arr,
    highlights: Object.fromEntries(arr.map((_, i) => [i, 'match'])),
    caption: `Done. Inorder = [${visited.join(', ')}]. BST inorder is the canonical "give me sorted order" trick.`,
  });
  return frames;
}

// N-Queens backtracking on 4×4 board.
function nQueensFrames() {
  const n = 4;
  const frames = [];
  const board = Array.from({ length: n }, () => Array(n).fill('.'));
  const renderBoard = () => board.map(row => row.join(' ')).join('\n');
  frames.push({ array: [renderBoard()], caption: `N-Queens, n=${n}. Place 4 queens so none attacks another. Backtracking on rows.` });

  let placed = 0;
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  function solve(row) {
    if (row === n) return true;
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag1.has(row - c) || diag2.has(row + c)) continue;
      board[row][c] = 'Q';
      cols.add(c); diag1.add(row - c); diag2.add(row + c);
      placed++;
      frames.push({ array: [renderBoard()], caption: `Try queen at (${row}, ${c}). Placed ${placed}.` });
      if (solve(row + 1)) return true;
      board[row][c] = '.';
      cols.delete(c); diag1.delete(row - c); diag2.delete(row + c);
      placed--;
      frames.push({ array: [renderBoard()], caption: `Dead end below (${row}, ${c}). Backtrack.` });
    }
    return false;
  }
  solve(0);
  frames.push({ array: [renderBoard()], caption: `Solution found. ${placed} queens, none attacking.` });
  return frames;
}

// Z-algorithm: z[i] = length of the longest substring starting at i
// that matches a prefix of the string. Linear-time.
function zAlgorithmFrames(input = 'aabxaabxcaabxaabxay') {
  const s = String(input || '');
  if (!s.length) return [{ array: [], caption: 'Empty string.' }];
  const arr = Array.from(s);
  const z = new Array(s.length).fill(0);
  const frames = [];
  frames.push({ array: arr, caption: `Z-array for "${s}". z[i] = longest prefix-match starting at i.` });
  let l = 0, r = 0;
  for (let i = 1; i < s.length; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]);
    while (i + z[i] < s.length && s[z[i]] === s[i + z[i]]) z[i]++;
    if (i + z[i] > r) { l = i; r = i + z[i]; }
    frames.push({
      array: arr, highlights: { [i]: 'mid', [l]: 'low', [Math.max(r - 1, 0)]: 'high' },
      caption: `i=${i}: z[${i}]=${z[i]}. z = [${z.slice(0, i + 1).join(', ')}].`,
    });
  }
  frames.push({
    array: arr, highlights: Object.fromEntries(arr.map((_, i) => [i, 'match'])),
    caption: `Done. Full z = [${z.join(', ')}]. Total work O(n).`,
  });
  return frames;
}

// Fenwick / BIT — point updates + prefix sums in O(log n) each.
function fenwickFrames(arr = [3, 2, 5, 1, 4, 6, 2, 7], queryIdx = 5) {
  if (!arr.length) return [{ array: [], caption: 'Empty array.' }];
  const n = arr.length;
  const bit = new Array(n + 1).fill(0);
  const frames = [];
  frames.push({ array: arr, caption: `Fenwick tree for [${arr.join(', ')}]. Build then query prefix-sum up to index ${queryIdx}.` });
  // build via point-updates
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= n; j += j & -j) bit[j] += arr[i];
    frames.push({
      array: arr, highlights: { [i]: 'mid' },
      caption: `update(arr[${i}]=${arr[i]}) → BIT = [${bit.slice(1).join(', ')}].`,
    });
  }
  // prefix-sum query
  let total = 0;
  let i = queryIdx + 1;
  const hits = [];
  while (i > 0) { total += bit[i]; hits.push(i - 1); i -= i & -i; }
  frames.push({
    array: arr,
    highlights: Object.fromEntries(hits.map(idx => [idx, 'match'])),
    caption: `prefix_sum(0..${queryIdx}) = ${total}. Walked O(log n) BIT nodes.`,
  });
  return frames;
}

// Huffman coding: priority-queue merges over frequencies. Render the surviving
// "weight" list at each step; the index of the two smallest is highlighted, and
// the merged sum is appended.
function huffmanFrames(input = [5, 3, 9, 1, 4, 12]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty frequency list — nothing to encode.' }];
  const frames = [];
  let pq = input.map(Number).filter(n => Number.isFinite(n) && n > 0);
  if (!pq.length) return [{ array: [], caption: 'No positive frequencies.' }];
  pq.sort((a, b) => a - b);
  let codeLenSum = 0;
  frames.push({ array: [...pq], caption: `Huffman coding. Treat each frequency as a leaf. Repeatedly merge the two smallest weights into a new internal node; its weight = sum.` });
  frames.push({ array: [...pq], highlights: Object.fromEntries(pq.map((_, i) => [i, 'frontier'])), caption: `Sorted priority queue: [${pq.join(', ')}]. ${pq.length} leaves.` });
  let step = 0;
  while (pq.length > 1) {
    step += 1;
    const a = pq[0], b = pq[1];
    frames.push({
      array: [...pq],
      highlights: { 0: 'low', 1: 'mid' },
      caption: `Step ${step}: pop the two smallest weights — ${a} and ${b}.`,
    });
    const merged = a + b;
    codeLenSum += merged;
    pq = pq.slice(2);
    // insert merged in sorted order
    let inserted = false;
    for (let i = 0; i < pq.length; i += 1) {
      if (merged <= pq[i]) { pq.splice(i, 0, merged); inserted = true; break; }
    }
    if (!inserted) pq.push(merged);
    const mergedIdx = pq.indexOf(merged);
    frames.push({
      array: [...pq],
      highlights: { [mergedIdx]: 'match' },
      caption: `Push merged node (weight ${merged}) back into the queue. Queue = [${pq.join(', ')}]. Running cost = ${codeLenSum}.`,
    });
  }
  frames.push({
    array: [...pq],
    highlights: { 0: 'match' },
    caption: `Single root remaining (weight ${pq[0]}). Total weighted code length = ${codeLenSum} — that's the optimal sum of (frequency × depth) for these symbols.`,
  });
  return frames;
}

// Boyer-Moore majority vote. Show candidate + count over the array.
function boyerMooreFrames(input = [3, 3, 4, 2, 4, 4, 2, 4, 4]) {
  if (!Array.isArray(input) || !input.length) return [{ array: [], caption: 'Empty array — no majority.' }];
  const a = input.map(Number);
  const frames = [];
  let candidate = null;
  let count = 0;
  frames.push({ array: a, caption: `Boyer-Moore majority. Maintain a candidate + count. If a majority exists (> n/2), this two-line scan finds it in O(n) time, O(1) memory.` });
  for (let i = 0; i < a.length; i += 1) {
    const v = a[i];
    if (count === 0) {
      candidate = v;
      count = 1;
      frames.push({
        array: a,
        highlights: { [i]: 'mid' },
        caption: `i=${i}, value=${v}: count is 0, so adopt ${v} as the new candidate. count = 1.`,
      });
    } else if (v === candidate) {
      count += 1;
      frames.push({
        array: a,
        highlights: { [i]: 'match' },
        caption: `i=${i}, value=${v}: matches candidate ${candidate}. count = ${count}.`,
      });
    } else {
      count -= 1;
      frames.push({
        array: a,
        highlights: { [i]: 'low' },
        caption: `i=${i}, value=${v}: differs from candidate ${candidate}. count = ${count}. ${count === 0 ? 'Candidate cancels out — fresh slot next round.' : ''}`,
      });
    }
  }
  // verify pass
  let occ = 0;
  for (const v of a) if (v === candidate) occ += 1;
  const isMajority = occ * 2 > a.length;
  frames.push({
    array: a,
    highlights: Object.fromEntries(a.map((v, i) => [i, v === candidate ? 'match' : 'low'])),
    caption: `Scan complete. Candidate = ${candidate}. Verify pass: ${occ}/${a.length} occurrences. ${isMajority ? 'It IS the majority (> n/2).' : 'No true majority exists in this array.'}`,
  });
  return frames;
}

// Euclidean GCD via mod recursion. Show (a, b) pair as a 2-cell array.
function euclideanGcdFrames(aIn = 48, bIn = 18) {
  const A = Math.abs(Math.trunc(Number(aIn)));
  const B = Math.abs(Math.trunc(Number(bIn)));
  const frames = [];
  if (!Number.isFinite(A) || !Number.isFinite(B) || (A === 0 && B === 0)) {
    return [{ array: [0, 0], caption: 'gcd(0, 0) is undefined.' }];
  }
  let a = A, b = B;
  frames.push({
    array: [a, b],
    highlights: { 0: 'low', 1: 'mid' },
    caption: `Euclidean GCD via mod: gcd(a, b) = gcd(b, a mod b), with gcd(x, 0) = x. Start: gcd(${a}, ${b}).`,
  });
  frames.push({
    array: [a, b],
    highlights: { 0: 'low', 1: 'mid' },
    caption: `Cells show the running pair (a, b). The left cell is "a", the right is "b". Each step replaces them with (b, a mod b).`,
  });
  frames.push({
    array: [a, b],
    highlights: { 0: 'low', 1: 'mid' },
    caption: `Invariant: any common divisor of a and b also divides (a mod b), so the pair (b, a mod b) preserves the GCD while shrinking fast.`,
  });
  frames.push({
    array: [a, b],
    highlights: { 0: 'low', 1: 'mid' },
    caption: `Recursion stops when b becomes 0 — at that point a holds the GCD. Each step shrinks b by at least a constant factor (Lamé's theorem).`,
  });
  let step = 0;
  while (b !== 0 && step < 40) {
    step += 1;
    const r = a % b;
    frames.push({
      array: [a, b],
      highlights: { 0: 'mid', 1: 'high' },
      caption: `Step ${step}: ${a} mod ${b} = ${r}. Replace pair: (a, b) ← (${b}, ${r}).`,
    });
    a = b;
    b = r;
    frames.push({
      array: [a, b],
      highlights: { 0: 'low', 1: b === 0 ? 'done' : 'mid' },
      caption: `Pair now (${a}, ${b}). ${b === 0 ? 'b reached 0 — recursion terminates.' : 'Continue: gcd(' + a + ', ' + b + ').'}`,
    });
  }
  frames.push({
    array: [a, 0],
    highlights: { 0: 'match' },
    caption: `gcd(${A}, ${B}) = ${a}. Took ${step} mod step${step === 1 ? '' : 's'} — Euclidean GCD runs in O(log(min(a, b))).`,
  });
  return frames;
}

// LRU cache with capacity 3. Visualize a sequence of put/get ops; the array
// is the cache MRU-first.
function lruCacheFrames(opsStr = 'put 1 1, put 2 2, put 3 3, get 1, put 4 4, get 2') {
  const CAPACITY = 3;
  const raw = String(opsStr ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (!raw.length) return [{ array: [], caption: 'No ops.' }];
  // order[0] = most-recently-used. Map key → value.
  const order = []; // keys, MRU first
  const store = new Map();
  const frames = [];
  const snapshot = (caption, highlightKey, status = 'match') => {
    const arr = order.map(k => `${k}:${store.get(k)}`);
    const hl = {};
    if (highlightKey !== null && highlightKey !== undefined) {
      const idx = order.indexOf(highlightKey);
      if (idx >= 0) hl[idx] = status;
    }
    frames.push({ array: arr, highlights: hl, caption });
  };
  frames.push({ array: [], caption: `LRU cache, capacity = ${CAPACITY}. Array shown most-recently-used → least-recently-used. On capacity overflow, evict the rightmost (LRU).` });
  frames.push({ array: [], caption: `Backed by a hash-map + doubly linked list: O(1) put, O(1) get. Each cell renders as "key:value".` });
  frames.push({ array: [], caption: `On put: if the key exists, update value and move to front. If the cache is full, evict the LRU (rightmost) before inserting.` });
  frames.push({ array: [], caption: `On get: if hit, move the key to front (it is now most-recently-used) and return value. If miss, return -1 and leave the cache unchanged.` });
  for (const op of raw) {
    const parts = op.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    if (cmd === 'put') {
      const k = Number(parts[1]);
      const v = parts.length >= 3 ? Number(parts[2]) : k;
      if (store.has(k)) {
        // move-to-front + update value
        const idx = order.indexOf(k);
        order.splice(idx, 1);
        order.unshift(k);
        store.set(k, v);
        snapshot(`put(${k}, ${v}): key exists — update value, move to front.`, k);
      } else if (order.length < CAPACITY) {
        order.unshift(k);
        store.set(k, v);
        snapshot(`put(${k}, ${v}): new key, room left. Insert at front. Size = ${order.length}/${CAPACITY}.`, k);
      } else {
        const evicted = order.pop();
        store.delete(evicted);
        order.unshift(k);
        store.set(k, v);
        snapshot(`put(${k}, ${v}): cache full. Evict LRU key ${evicted}. Insert ${k} at front.`, k);
      }
    } else if (cmd === 'get') {
      const k = Number(parts[1]);
      if (store.has(k)) {
        const idx = order.indexOf(k);
        order.splice(idx, 1);
        order.unshift(k);
        snapshot(`get(${k}) = ${store.get(k)}. Hit — move to front (most-recently-used).`, k);
      } else {
        snapshot(`get(${k}) = -1. Miss — cache unchanged.`, null);
      }
    } else {
      snapshot(`Skipped unknown op "${op}".`, null);
    }
  }
  frames.push({
    array: order.map(k => `${k}:${store.get(k)}`),
    highlights: Object.fromEntries(order.map((_, i) => [i, 'match'])),
    caption: `Done. Final cache (MRU → LRU): [${order.map(k => `${k}:${store.get(k)}`).join(', ') || 'empty'}]. All ops ran in O(1) amortized.`,
  });
  return frames;
}

// Sparse table for range-minimum. Build, then query.
function sparseTableFrames(input = [5, 2, 4, 1, 7, 3, 9, 8]) {
  const arr = (Array.isArray(input) ? input : []).map(Number).filter(Number.isFinite);
  if (!arr.length) return [{ array: [], caption: 'Empty array.' }];
  const n = arr.length;
  const K = Math.floor(Math.log2(n)) + 1;
  const table = Array.from({ length: K }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) table[0][i] = arr[i];
  const frames = [];
  frames.push({ array: arr, caption: `Sparse table for range-min over [${arr.join(', ')}]. Precompute min of every interval of length 2^j. Then any range min is the overlap of two such intervals.` });
  frames.push({ array: arr, caption: `Build phase is O(n log n): for each power-of-two length 2^j, fill table[j][i] = min(table[j-1][i], table[j-1][i + 2^(j-1)]).` });
  frames.push({ array: arr, caption: `Query phase is O(1) — for range [l, r], pick j = floor(log2(r - l + 1)) so two intervals of length 2^j cover [l, r] exactly (with overlap, which is harmless for idempotent ops like min).` });
  frames.push({
    array: arr,
    highlights: Object.fromEntries(arr.map((_, i) => [i, 'frontier'])),
    caption: `Row j=0: table[0][i] = arr[i] (intervals of length 1).`,
  });
  for (let j = 1; (1 << j) <= n; j += 1) {
    const len = 1 << j;
    for (let i = 0; i + len <= n; i += 1) {
      table[j][i] = Math.min(table[j - 1][i], table[j - 1][i + (len >> 1)]);
    }
    const row = table[j].slice(0, n - len + 1);
    frames.push({
      array: arr,
      highlights: { 0: 'mid', [Math.min(n - 1, len - 1)]: 'mid' },
      caption: `Row j=${j} (intervals of length ${len}): table[${j}] = [${row.join(', ')}]. Each cell = min of two length-${len >> 1} intervals.`,
    });
  }
  // Query [1, 6]
  const ql = 1, qr = 6;
  const safeQr = Math.min(qr, n - 1);
  const lenQ = safeQr - ql + 1;
  const jQ = Math.floor(Math.log2(lenQ));
  frames.push({
    array: arr,
    highlights: { [ql]: 'low', [safeQr]: 'high' },
    caption: `Query range-min over [${ql}, ${safeQr}] (length ${lenQ}). Pick j = floor(log2(${lenQ})) = ${jQ}.`,
  });
  const leftStart = ql;
  const rightStart = safeQr - (1 << jQ) + 1;
  const leftVal = table[jQ][leftStart];
  const rightVal = table[jQ][rightStart];
  frames.push({
    array: arr,
    highlights: { [leftStart]: 'mid', [leftStart + (1 << jQ) - 1]: 'mid', [rightStart]: 'high', [safeQr]: 'high' },
    caption: `Overlapping intervals: [${leftStart}, ${leftStart + (1 << jQ) - 1}] (min=${leftVal}) and [${rightStart}, ${safeQr}] (min=${rightVal}).`,
  });
  const ans = Math.min(leftVal, rightVal);
  const hl = {};
  for (let i = ql; i <= safeQr; i += 1) hl[i] = i === arr.indexOf(ans, ql) ? 'match' : 'visited';
  frames.push({
    array: arr,
    highlights: hl,
    caption: `range_min(${ql}, ${safeQr}) = min(${leftVal}, ${rightVal}) = ${ans}. Query runs in O(1) after O(n log n) preprocessing.`,
  });
  return frames;
}

// Kruskal's MST. Sort edges, accept those that don't form a cycle (union-find).
function kruskalFrames(variant = 'default') {
  let nodes, edges;
  if (variant === 'sparse') {
    nodes = [
      { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
      { id: 3, label: '3' }, { id: 4, label: '4' },
    ];
    edges = [
      { a: 0, b: 1, w: 1 }, { a: 1, b: 2, w: 2 },
      { a: 2, b: 3, w: 3 }, { a: 3, b: 4, w: 4 },
    ];
  } else if (variant === 'dense') {
    nodes = [
      { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
      { id: 3, label: '3' }, { id: 4, label: '4' },
    ];
    edges = [
      { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 3 }, { a: 0, b: 3, w: 8 },
      { a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 6 }, { a: 1, b: 4, w: 7 },
      { a: 2, b: 3, w: 4 }, { a: 2, b: 4, w: 5 }, { a: 3, b: 4, w: 9 },
    ];
  } else {
    nodes = [
      { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
      { id: 3, label: '3' }, { id: 4, label: '4' },
    ];
    edges = [
      { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 6 },
      { a: 1, b: 2, w: 3 }, { a: 1, b: 3, w: 8 },
      { a: 2, b: 3, w: 5 }, { a: 2, b: 4, w: 7 },
      { a: 3, b: 4, w: 4 },
    ];
  }

  const frames = [];
  const sorted = [...edges].sort((x, y) => x.w - y.w);
  const parent = new Array(nodes.length).fill(0).map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (x, y) => { const rx = find(x), ry = find(y); if (rx === ry) return false; parent[rx] = ry; return true; };

  const accepted = [];
  const rejected = [];

  const snapshot = (currentEdge, caption) => {
    const ns = nodes.map(n => {
      const root = find(n.id);
      const inAccepted = accepted.some(e => e.a === n.id || e.b === n.id);
      return { ...n, label: n.label, state: inAccepted ? 'visited' : (currentEdge && (currentEdge.a === n.id || currentEdge.b === n.id) ? 'current' : (root !== n.id ? 'frontier' : undefined)) };
    });
    const es = edges.map(e => {
      const isAccepted = accepted.some(x => x.a === e.a && x.b === e.b);
      const isRejected = rejected.some(x => x.a === e.a && x.b === e.b);
      const isCurrent = currentEdge && currentEdge.a === e.a && currentEdge.b === e.b;
      if (isAccepted) return { ...e, state: 'tree' };
      if (isRejected) return { ...e, state: 'done' };
      if (isCurrent) return { ...e, state: 'current' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapshot(null, `Kruskal's MST. Sort all edges by weight, then greedily add the lightest edge that does not create a cycle. Use union-find to detect cycles in near-O(1).`);
  snapshot(null, `Edges sorted by weight: ${sorted.map(e => `(${e.a}-${e.b}, w=${e.w})`).join(', ')}.`);

  let total = 0;
  for (const e of sorted) {
    snapshot(e, `Consider edge (${e.a}-${e.b}, weight ${e.w}).`);
    if (union(e.a, e.b)) {
      accepted.push(e);
      total += e.w;
      snapshot(e, `find(${e.a}) ≠ find(${e.b}) — accept. Running MST weight = ${total}.`);
      if (accepted.length === nodes.length - 1) break;
    } else {
      rejected.push(e);
      snapshot(e, `find(${e.a}) == find(${e.b}) — adding would create a cycle. Reject.`);
    }
  }
  snapshot(null, `Done. MST uses ${accepted.length} edges with total weight ${total}.`);
  return frames;
}

// Manacher's algorithm for longest palindromic substring.
// Renders the transformed string with '#' separators, the live p[] row beneath it,
// arcs spanning each known palindrome (accent for current i, pink for the running best),
// and pointer labels for center, right, mirror and i.
function manacherFrames(input = 'babcbabcabbabcd') {
  const s = String(input ?? '');
  if (!s.length) return [{ array: [], caption: 'Empty string — no palindrome.' }];
  // Transform: include the sentinels in the rendered array so indices match the p[] math.
  // We render '^' and '$' as faint dots so the user perceives a clean row.
  const t = ['^'];
  for (const ch of s) { t.push('#'); t.push(ch); }
  t.push('#'); t.push('$');
  const display = t.map((ch) => (ch === '^' || ch === '$') ? '·' : ch);
  const p = new Array(t.length).fill(0);
  let center = 0, right = 0, bestI = 0;
  const frames = [];

  const subValues = () => p.map((v, idx) => (idx === 0 || idx === t.length - 1) ? '' : String(v));

  const snapshot = ({ i, mirror, role, caption }) => {
    const highlights = {};
    if (Number.isInteger(i) && i > 0 && i < t.length - 1) highlights[i] = role || 'current';
    const pointers = {};
    if (Number.isInteger(i) && i > 0 && i < t.length - 1) pointers[i] = 'i';
    if (center > 0 && center < t.length - 1) {
      pointers[center] = pointers[center] ? [].concat(pointers[center], 'C') : 'C';
    }
    if (right > 0 && right < t.length - 1) {
      pointers[right] = pointers[right] ? [].concat(pointers[right], 'R') : 'R';
    }
    if (Number.isInteger(mirror) && mirror > 0 && mirror < t.length - 1 && mirror !== i) {
      pointers[mirror] = pointers[mirror] ? [].concat(pointers[mirror], 'mirror') : 'mirror';
    }
    const arcs = [];
    // The running best palindrome.
    if (p[bestI] > 0) arcs.push({ center: bestI, radius: p[bestI], color: 'pink' });
    // The currently-evaluated palindrome at i.
    if (Number.isInteger(i) && p[i] > 0 && i !== bestI) arcs.push({ center: i, radius: p[i], color: 'accent' });
    // The active center's known palindrome (mint).
    if (center !== bestI && center !== i && p[center] > 0) arcs.push({ center, radius: p[center], color: 'mint' });
    const bestLen = p[bestI];
    const startInS = Math.max(0, Math.floor((bestI - bestLen) / 2));
    const bestStr = s.slice(startInS, startInS + bestLen) || '—';
    frames.push({
      array: display,
      highlights,
      pointers,
      arcs,
      subRow: { values: subValues(), label: 'p[] (palindrome radius in transformed coords)' },
      chip: [
        { label: 'best', value: `"${bestStr}" (len ${bestLen})`, tone: 'pink' },
        { label: 'center', value: center, tone: 'mint' },
        { label: 'right', value: right, tone: 'sky' },
      ],
      caption,
    });
  };

  frames.push({
    array: s.split(''),
    caption: `Manacher's algorithm finds the longest palindromic substring in O(n). The trick is two-fold: insert '#' between every character so odd- and even-length palindromes become uniformly odd, then exploit symmetry — every time we step into a previously-known palindrome we already know most of the answer.`,
  });
  frames.push({
    array: display,
    subRow: { values: subValues(), label: 'p[] (all zero — nothing computed yet)' },
    pointers: { 1: 'start' },
    caption: `Transformed string "${t.slice(1, -1).join('')}" (length ${t.length - 2}). p[i] will store the radius of the palindrome centered at index i — measured in transformed coordinates so single characters count as radius 0, three-wide palindromes as radius 1, etc.`,
  });

  for (let i = 1; i < t.length - 1; i += 1) {
    const mirror = 2 * center - i;
    let usedMirror = false;
    if (i < right) { p[i] = Math.min(right - i, p[mirror]); usedMirror = true; }
    while (t[i + p[i] + 1] === t[i - p[i] - 1]) p[i] += 1;
    if (i + p[i] > right) { center = i; right = i + p[i]; }
    const newBest = p[i] > p[bestI];
    if (newBest) bestI = i;

    // Decide whether to emit a frame. Always emit on a new best, on use-of-mirror,
    // and at a steady cadence so long inputs don't drown the viewer.
    const cadence = Math.max(1, Math.floor((t.length - 2) / 14));
    const emit = newBest || usedMirror || i % cadence === 0 || i === t.length - 2;
    if (!emit) continue;
    let caption;
    if (newBest) {
      caption = `i=${i}: expanded to p[i]=${p[i]} — new longest palindrome. center→${center}, right→${right}.`;
    } else if (usedMirror) {
      caption = `i=${i} is inside the current palindrome (i < right=${right}). Mirror at ${mirror} gives a head-start of min(right-i, p[mirror])=${p[i]} — only expand past that.`;
    } else {
      caption = `i=${i}: p[i]=${p[i]} after expansion. center=${center}, right=${right}.`;
    }
    snapshot({ i, mirror: usedMirror ? mirror : null, role: newBest ? 'match' : 'current', caption });
  }

  const startInS = Math.floor((bestI - p[bestI]) / 2);
  const lenInS = p[bestI];
  const finalHl = {};
  for (let k = 1; k < t.length - 1; k += 1) {
    if (k >= bestI - p[bestI] && k <= bestI + p[bestI]) finalHl[k] = 'match';
  }
  frames.push({
    array: display,
    highlights: finalHl,
    pointers: { [bestI]: 'best' },
    arcs: [{ center: bestI, radius: p[bestI], color: 'pink' }],
    subRow: { values: subValues(), label: 'p[] (final)' },
    chip: [
      { label: 'answer', value: `"${s.slice(startInS, startInS + lenInS)}"`, tone: 'pink' },
      { label: 'length', value: lenInS, tone: 'accent' },
      { label: 'starts at', value: startInS, tone: 'sky' },
    ],
    caption: `Longest palindromic substring: "${s.slice(startInS, startInS + lenInS)}" (length ${lenInS}, original index ${startInS}). Each character was visited a constant number of times — total O(n).`,
  });
  return frames;
}

// Min-stack: stack that returns min in O(1) via a parallel min-stack.
function minStackFrames(opsStr = 'push 3, push 5, push 2, min, pop, min, push 1, min') {
  const raw = String(opsStr ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (!raw.length) return [{ array: [], caption: 'No ops.' }];
  const stack = [];
  const mins = []; // parallel stack: mins[i] = min of stack[0..i]
  const frames = [];
  const snapshot = (caption, hlIdx, status = 'match') => {
    const display = stack.map((v, i) => `${v}|min:${mins[i]}`);
    const hl = {};
    if (hlIdx !== null && hlIdx !== undefined && hlIdx >= 0) hl[hlIdx] = status;
    frames.push({ array: display, highlights: hl, caption });
  };
  frames.push({ array: [], caption: `Min-stack. Each cell shows "value | running-min". The parallel min-stack lets push/pop/top/min all run in O(1).` });
  for (const op of raw) {
    const parts = op.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    if (cmd === 'push') {
      const v = Number(parts[1]);
      stack.push(v);
      const newMin = mins.length === 0 ? v : Math.min(mins[mins.length - 1], v);
      mins.push(newMin);
      snapshot(`push(${v}): stack top now ${v}, running-min = ${newMin}.`, stack.length - 1);
    } else if (cmd === 'pop') {
      if (stack.length === 0) {
        snapshot(`pop(): stack is empty — no-op.`, null);
      } else {
        const v = stack.pop();
        mins.pop();
        snapshot(`pop() removed ${v}. ${stack.length ? `New top = ${stack[stack.length - 1]}, min = ${mins[mins.length - 1]}.` : 'Stack is now empty.'}`, stack.length - 1);
      }
    } else if (cmd === 'min') {
      if (mins.length === 0) {
        snapshot(`min(): stack empty — undefined.`, null);
      } else {
        const minIdx = stack.indexOf(mins[mins.length - 1]);
        snapshot(`min() = ${mins[mins.length - 1]}. Read the top of the parallel min-stack — O(1).`, minIdx, 'match');
      }
    } else if (cmd === 'top') {
      if (stack.length === 0) {
        snapshot(`top(): stack empty.`, null);
      } else {
        snapshot(`top() = ${stack[stack.length - 1]}.`, stack.length - 1);
      }
    } else {
      snapshot(`Skipped unknown op "${op}".`, null);
    }
  }
  frames.push({
    array: stack.map((v, i) => `${v}|min:${mins[i]}`),
    highlights: Object.fromEntries(stack.map((_, i) => [i, 'visited'])),
    caption: `Done. Stack size = ${stack.length}. Each push/pop maintains the parallel min-stack so min() is always O(1).`,
  });
  return frames;
}

// XOR tricks: "single number" — XOR everything to cancel pairs.
function xorTricksFrames(input = [4, 1, 2, 1, 2]) {
  const arr = (Array.isArray(input) ? input : []).map(Number).filter(Number.isFinite);
  if (!arr.length) return [{ array: [], caption: 'Empty array — nothing to XOR.' }];
  const frames = [];
  const display = arr.map(String);
  frames.push({ array: display, caption: `XOR trick for "single number". Given an array where every value appears twice except one, XOR all values together — pairs cancel (x XOR x = 0), leaving only the loner.` });
  frames.push({ array: display, caption: `Key identities: a XOR 0 = a, a XOR a = 0, XOR is associative and commutative. So order doesn't matter — pairs annihilate no matter where they sit.` });
  frames.push({ array: display, caption: `Run a single accumulator "running" starting at 0. Fold every element in with running ^= arr[i]. After one pass, running holds the unique value.` });
  frames.push({
    array: display,
    highlights: Object.fromEntries(arr.map((_, i) => [i, 'frontier'])),
    caption: `Input: [${arr.join(', ')}]. Length ${arr.length}. We will scan left-to-right.`,
  });
  let running = 0;
  for (let i = 0; i < arr.length; i += 1) {
    const prev = running;
    running ^= arr[i];
    const hl = {};
    for (let k = 0; k < i; k += 1) hl[k] = 'visited';
    hl[i] = 'mid';
    frames.push({
      array: display,
      highlights: hl,
      caption: `i=${i}: running = ${prev} XOR ${arr[i]} = ${running}. (binary ${prev.toString(2).padStart(4, '0')} ^ ${arr[i].toString(2).padStart(4, '0')} = ${running.toString(2).padStart(4, '0')})`,
    });
  }
  const matchIdx = arr.indexOf(running);
  const hl = {};
  for (let k = 0; k < arr.length; k += 1) hl[k] = k === matchIdx ? 'match' : 'visited';
  frames.push({
    array: display,
    highlights: hl,
    caption: `Done. Final XOR = ${running}. Every pair cancelled to 0, leaving the singleton. Total time O(n), space O(1).`,
  });
  return frames;
}

// Floyd-Warshall: all-pairs shortest paths. Render dist matrix as flat array of row strings.
function floydWarshallFrames(variant = 'default') {
  let n, edges;
  if (variant === 'negative') {
    n = 4;
    edges = [[0, 1, 4], [0, 2, 5], [1, 2, -3], [2, 3, 2], [3, 0, 1]];
  } else if (variant === 'dense') {
    n = 4;
    edges = [
      [0, 1, 2], [0, 2, 6], [0, 3, 9],
      [1, 0, 2], [1, 2, 3], [1, 3, 7],
      [2, 0, 6], [2, 1, 3], [2, 3, 4],
      [3, 0, 9], [3, 1, 7], [3, 2, 4],
    ];
  } else {
    n = 4;
    edges = [[0, 1, 3], [0, 2, 7], [1, 2, 2], [2, 3, 1], [1, 3, 5]];
  }
  const INF = Infinity;
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)));
  for (const [u, v, w] of edges) dist[u][v] = w;

  const fmt = (x) => (x === INF ? '∞' : String(x));
  const rowsArr = () => dist.map((row, i) => `${i}: [${row.map(fmt).join(', ')}]`);

  const frames = [];
  frames.push({ array: rowsArr(), caption: `Floyd-Warshall: all-pairs shortest paths in O(V³). dist[i][j] = shortest path using any subset of intermediate vertices. Each cell shows row i's distances to every j; "∞" means no path yet.` });
  frames.push({ array: rowsArr(), caption: `Init: dist[i][i] = 0, dist[u][v] = edge weight if (u,v) is an edge, else ∞. ${edges.length} directed edges loaded across ${n} nodes.` });
  frames.push({ array: rowsArr(), caption: `Triple loop: for each intermediate k, then for every (i, j), relax dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]). Outer loop on k is the trick — it forces paths to incrementally allow vertex k as a stop.` });
  frames.push({
    array: rowsArr(),
    highlights: Object.fromEntries(rowsArr().map((_, i) => [i, 'frontier'])),
    caption: `Starting matrix (no intermediates allowed yet). Direct edges only.`,
  });

  for (let k = 0; k < n; k += 1) {
    const before = rowsArr();
    frames.push({
      array: before,
      highlights: { [k]: 'mid' },
      caption: `k = ${k}: allow vertex ${k} as a possible intermediate. Sweep all (i, j) pairs and check if going through ${k} is shorter than current dist[i][j].`,
    });
    let relaxations = 0;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        const via = dist[i][k] + dist[k][j];
        if (via < dist[i][j]) {
          dist[i][j] = via;
          relaxations += 1;
        }
      }
    }
    const hl = {};
    for (let i = 0; i < n; i += 1) hl[i] = i === k ? 'mid' : 'visited';
    frames.push({
      array: rowsArr(),
      highlights: hl,
      caption: `After k = ${k}: ${relaxations} cell${relaxations === 1 ? '' : 's'} relaxed. Matrix now reflects shortest paths using {0, …, ${k}} as intermediates.`,
    });
  }

  const finalHl = {};
  for (let i = 0; i < n; i += 1) finalHl[i] = 'match';
  frames.push({
    array: rowsArr(),
    highlights: finalHl,
    caption: `Done. Final dist matrix holds all-pairs shortest path costs. O(V³) time, O(V²) space. Detect negative cycles by checking dist[i][i] < 0.`,
  });
  return frames;
}

// Bloom filter: insert keys, then query. Visualize the bit array.
function bloomFilterFrames({ keysStr = 'apple,banana,cherry', queriesStr = 'apple,grape,banana', m = 16 } = {}) {
  const M = Math.max(4, Math.min(64, Math.trunc(Number(m)) || 16));
  const keys = String(keysStr ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const queries = String(queriesStr ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (!keys.length && !queries.length) return [{ array: new Array(M).fill('0'), caption: 'No keys or queries.' }];

  // Two simple hash functions producing two indices into [0, M).
  const hash1 = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % M;
  };
  const hash2 = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h % M;
  };

  const bits = new Array(M).fill(0);
  const render = () => bits.map(b => String(b));
  const frames = [];
  frames.push({ array: render(), caption: `Bloom filter with m = ${M} bits and k = 2 hash functions. A probabilistic set: insertions are exact, queries say "definitely not present" or "probably present" — false positives, never false negatives.` });
  frames.push({ array: render(), caption: `Insert(x): set bits[h1(x)] = bits[h2(x)] = 1. Query(x): return true iff both bits are 1. Bits can collide between keys — that's where false positives come from.` });
  frames.push({ array: render(), caption: `All bits start at 0. We will insert ${keys.length} key${keys.length === 1 ? '' : 's'} then query ${queries.length}.` });

  for (const k of keys) {
    const i1 = hash1(k);
    const i2 = hash2(k);
    frames.push({
      array: render(),
      highlights: { [i1]: 'mid', [i2]: 'mid' },
      caption: `Insert "${k}": hash1 → ${i1}, hash2 → ${i2}. Set both bits.`,
    });
    bits[i1] = 1;
    bits[i2] = 1;
    frames.push({
      array: render(),
      highlights: { [i1]: 'match', [i2]: 'match' },
      caption: `"${k}" inserted. bits[${i1}] = 1, bits[${i2}] = 1. Population count = ${bits.reduce((s, b) => s + b, 0)}/${M}.`,
    });
  }

  for (const q of queries) {
    const i1 = hash1(q);
    const i2 = hash2(q);
    const b1 = bits[i1], b2 = bits[i2];
    const both = b1 === 1 && b2 === 1;
    const inserted = keys.includes(q);
    const statusKey = both ? 'match' : 'low';
    frames.push({
      array: render(),
      highlights: { [i1]: statusKey, [i2]: statusKey },
      caption: `Query "${q}": hash1 → ${i1} (bit=${b1}), hash2 → ${i2} (bit=${b2}). ${both ? 'Both bits set — answer "probably present".' : 'At least one bit is 0 — answer "definitely NOT present".'} ${both && !inserted ? '(false positive — never inserted)' : ''}${both && inserted ? '(true positive)' : ''}${!both && !inserted ? '(true negative)' : ''}`,
    });
  }

  frames.push({
    array: render(),
    highlights: Object.fromEntries(bits.map((b, i) => [i, b ? 'visited' : 'low'])),
    caption: `Done. ${bits.reduce((s, b) => s + b, 0)}/${M} bits set. Bloom filter has no remove (with this basic variant). Tune m and k from expected n and target false-positive rate.`,
  });
  return frames;
}

// Reservoir sampling: keep k random items from a stream of unknown length.
function reservoirSamplingFrames({ streamStr = 'A,B,C,D,E,F,G,H,I,J', k = 3 } = {}) {
  const stream = String(streamStr ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const K = Math.max(1, Math.min(stream.length, Math.trunc(Number(k)) || 3));
  if (!stream.length) return [{ array: [], caption: 'Empty stream.' }];

  // Seeded LCG so the walkthrough is deterministic frame-to-frame.
  let seed = 0x9e3779b1;
  for (const ch of streamStr) seed = ((seed ^ ch.charCodeAt(0)) * 1664525 + 1013904223) >>> 0;
  seed = (seed ^ K) >>> 0;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };

  const reservoir = [];
  const frames = [];
  const render = () => reservoir.slice();

  frames.push({ array: [], caption: `Reservoir sampling: pick k = ${K} items uniformly at random from a stream whose length we may not know in advance. O(n) time, O(k) space — one pass.` });
  frames.push({ array: [], caption: `Algorithm: fill the reservoir with the first k items. For each subsequent item at index i (0-based), pick a random j in [0, i]; if j < k, overwrite reservoir[j].` });
  frames.push({ array: [], caption: `Invariant: after seeing n items, every item has exactly k/n probability of being in the reservoir. The trick: replacement probabilities for later items exactly compensate for the larger pool.` });
  frames.push({ array: [], caption: `Stream: [${stream.join(', ')}] (length ${stream.length}). Reservoir capacity = ${K}.` });

  for (let i = 0; i < stream.length; i += 1) {
    const item = stream[i];
    if (i < K) {
      reservoir.push(item);
      frames.push({
        array: render(),
        highlights: { [reservoir.length - 1]: 'match' },
        caption: `i=${i}: item "${item}". Reservoir not full yet — append directly. Reservoir = [${reservoir.join(', ')}].`,
      });
    } else {
      const j = Math.floor(rand() * (i + 1));
      if (j < K) {
        const prev = reservoir[j];
        reservoir[j] = item;
        frames.push({
          array: render(),
          highlights: { [j]: 'mid' },
          caption: `i=${i}: item "${item}". Random j = ${j} (in [0, ${i}]). j < k, so replace reservoir[${j}] ("${prev}" → "${item}"). Each existing slot had ${K}/${i + 1} chance of being chosen.`,
        });
      } else {
        frames.push({
          array: render(),
          highlights: Object.fromEntries(reservoir.map((_, idx) => [idx, 'low'])),
          caption: `i=${i}: item "${item}". Random j = ${j} ≥ k. Skip — reservoir unchanged. Probability of skip = ${i + 1 - K}/${i + 1}.`,
        });
      }
    }
  }

  frames.push({
    array: render(),
    highlights: Object.fromEntries(reservoir.map((_, idx) => [idx, 'match'])),
    caption: `Done. Final reservoir: [${reservoir.join(', ')}]. Each of the ${stream.length} stream items had exactly ${K}/${stream.length} probability of ending up here. One pass, O(k) memory.`,
  });
  return frames;
}

// Longest increasing subsequence — patience-sort + binary search (O(n log n)).
// Shows the tails[] array growing; tails[k] = smallest possible tail of any
// increasing subsequence of length k+1 seen so far.
function lisFrames(input = [10, 9, 2, 5, 3, 7, 101, 18]) {
  const arr = (Array.isArray(input) ? input : []).map(Number).filter(Number.isFinite);
  if (!arr.length) return [{ array: [], caption: 'Empty array — no LIS.' }];
  const frames = [];
  const display = () => arr.map(String);

  frames.push({ array: display(), caption: `Longest Increasing Subsequence (LIS) via patience sorting. We will maintain a tails[] array — tails[k] is the smallest possible tail of any increasing subsequence of length k+1 found so far. Its final length is the LIS length.` });
  frames.push({ array: display(), caption: `Key insight: tails[] is itself strictly increasing. That lets us binary-search for the first tails entry ≥ x in O(log n), giving overall O(n log n) instead of the classic O(n²) DP.` });
  frames.push({ array: display(), caption: `For each arr[i]: binary-search tails for the first value ≥ arr[i]. If found, overwrite that slot (we found a smaller tail for that length). If not found, append (we extended the longest run).` });
  frames.push({
    array: display(),
    highlights: Object.fromEntries(arr.map((_, i) => [i, 'frontier'])),
    caption: `Input: [${arr.join(', ')}] (n = ${arr.length}). Scan left-to-right.`,
  });

  const tails = [];
  // Binary search for the leftmost index in tails whose value is >= x.
  const lowerBound = (x) => {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  for (let i = 0; i < arr.length; i += 1) {
    const x = arr[i];
    const hl = {};
    for (let k = 0; k < i; k += 1) hl[k] = 'visited';
    hl[i] = 'mid';
    const pos = lowerBound(x);
    const isAppend = pos === tails.length;
    frames.push({
      array: display(),
      highlights: hl,
      caption: `i=${i}: x = ${x}. tails = [${tails.join(', ') || '∅'}]. Binary-search for first slot ≥ ${x} → position ${pos}.`,
    });
    if (isAppend) {
      tails.push(x);
      frames.push({
        array: display(),
        highlights: hl,
        caption: `${pos} == tails.length → append. tails = [${tails.join(', ')}] (length ${tails.length}). We extended the longest run.`,
      });
    } else {
      const prev = tails[pos];
      tails[pos] = x;
      frames.push({
        array: display(),
        highlights: hl,
        caption: `Overwrite tails[${pos}]: ${prev} → ${x}. A length-${pos + 1} run can now end on a smaller value, giving future elements more room. tails = [${tails.join(', ')}].`,
      });
    }
  }

  frames.push({
    array: display(),
    highlights: Object.fromEntries(arr.map((_, i) => [i, 'match'])),
    caption: `Done. LIS length = ${tails.length}. tails = [${tails.join(', ')}] (note: this is NOT the LIS itself — only its length is exact; reconstruction needs an extra parent[] array).`,
  });
  return frames;
}

// A* search on a tiny grid. Hardcoded variants.
function aStarFrames(variant = 'default') {
  let rows, cols, start, goal, walls;
  if (variant === 'smaller') {
    rows = 4; cols = 5;
    start = [0, 0]; goal = [3, 4];
    walls = [[1, 2], [2, 2]];
  } else if (variant === 'noPath') {
    rows = 6; cols = 8;
    start = [1, 1]; goal = [4, 5];
    walls = [];
    for (let r = 0; r < rows; r += 1) walls.push([r, 3]);
  } else {
    rows = 6; cols = 8;
    start = [1, 1]; goal = [4, 5];
    walls = [];
    for (let r = 0; r < rows; r += 1) if (r !== 4) walls.push([r, 3]);
  }

  const wallSet = new Set(walls.map(([r, c]) => `${r},${c}`));
  const key = (r, c) => `${r},${c}`;
  const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  const h = (r, c) => Math.abs(r - goal[0]) + Math.abs(c - goal[1]);

  // Build a canvas for each frame.
  const baseGrid = () => Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (wallSet.has(key(r, c)) ? '#' : '.'))
  );
  const paint = (open, closed, current, path, caption) => {
    const g = baseGrid();
    for (const k of closed) { const [r, c] = k.split(',').map(Number); if (g[r][c] === '.') g[r][c] = 'C'; }
    for (const k of open)   { const [r, c] = k.split(',').map(Number); if (g[r][c] === '.') g[r][c] = 'O'; }
    if (path) for (const [r, c] of path) if (g[r][c] !== 'S' && g[r][c] !== 'G') g[r][c] = '*';
    g[start[0]][start[1]] = 'S';
    g[goal[0]][goal[1]] = 'G';
    if (current && !(current[0] === start[0] && current[1] === start[1]) && !(current[0] === goal[0] && current[1] === goal[1])) {
      // mark current as path symbol so it stands out (uses 'current' class)
      g[current[0]][current[1]] = '*';
    }
    return { rows, cols, grid: g, caption };
  };

  const frames = [];
  frames.push(paint(new Set(), new Set(), null, null,
    `A* search: best-first traversal that orders the open set by f(n) = g(n) + h(n). g = cost from start, h = admissible heuristic (here: Manhattan distance to goal). With admissible h, the first time we pop the goal is optimal.`));
  frames.push(paint(new Set(), new Set(), null, null,
    `Grid is ${rows}×${cols}. S = start at (${start[0]},${start[1]}), G = goal at (${goal[0]},${goal[1]}). '#' cells are walls — impassable.`));
  frames.push(paint(new Set([key(...start)]), new Set(), start, null,
    `Push start onto the open set with g=0, h=${h(start[0], start[1])}, f=${h(start[0], start[1])}. Closed set is empty.`));

  const openMap = new Map();
  openMap.set(key(...start), { r: start[0], c: start[1], g: 0, f: h(start[0], start[1]), parent: null });
  const closedMap = new Map();
  let found = null;
  let popCount = 0;
  const MAX_POPS = 24;

  while (openMap.size && popCount < MAX_POPS) {
    // Pick lowest-f from open set.
    let bestKey = null, bestF = Infinity;
    for (const [k, node] of openMap) {
      if (node.f < bestF) { bestF = node.f; bestKey = k; }
    }
    const cur = openMap.get(bestKey);
    openMap.delete(bestKey);
    closedMap.set(bestKey, cur);
    popCount += 1;

    if (cur.r === goal[0] && cur.c === goal[1]) {
      found = cur;
      frames.push(paint(
        new Set(openMap.keys()),
        new Set(closedMap.keys()),
        [cur.r, cur.c],
        null,
        `Pop (${cur.r},${cur.c}) — that's the goal! g=${cur.g}, f=${cur.f}. Because h is admissible (Manhattan ≤ true cost), this is an optimal path. Reconstruct via parent pointers.`,
      ));
      break;
    }

    frames.push(paint(
      new Set([...openMap.keys()]),
      new Set([...closedMap.keys()]),
      [cur.r, cur.c],
      null,
      `Pop (${cur.r},${cur.c}) from open set — lowest f=${cur.f} (g=${cur.g}, h=${h(cur.r, cur.c)}). Move to closed. Examine its 4 neighbors.`,
    ));

    const neighbours = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const added = [];
    for (const [dr, dc] of neighbours) {
      const nr = cur.r + dr, nc = cur.c + dc;
      if (!inBounds(nr, nc)) continue;
      if (wallSet.has(key(nr, nc))) continue;
      const nk = key(nr, nc);
      if (closedMap.has(nk)) continue;
      const tentativeG = cur.g + 1;
      const existing = openMap.get(nk);
      if (!existing || tentativeG < existing.g) {
        openMap.set(nk, { r: nr, c: nc, g: tentativeG, f: tentativeG + h(nr, nc), parent: bestKey });
        added.push([nr, nc, tentativeG, h(nr, nc)]);
      }
    }
    if (added.length) {
      frames.push(paint(
        new Set([...openMap.keys()]),
        new Set([...closedMap.keys()]),
        [cur.r, cur.c],
        null,
        `Push ${added.length} neighbour${added.length === 1 ? '' : 's'} onto open set: ${added.map(([r, c, g, hv]) => `(${r},${c}) g=${g} h=${hv} f=${g + hv}`).join('; ')}.`,
      ));
    } else {
      frames.push(paint(
        new Set([...openMap.keys()]),
        new Set([...closedMap.keys()]),
        [cur.r, cur.c],
        null,
        `No new neighbours from (${cur.r},${cur.c}) — all blocked, out of bounds, or already closed.`,
      ));
    }
  }

  if (found) {
    const path = [];
    let walk = found;
    while (walk) {
      path.push([walk.r, walk.c]);
      walk = walk.parent ? closedMap.get(walk.parent) : null;
    }
    path.reverse();
    frames.push(paint(
      new Set(openMap.keys()),
      new Set(closedMap.keys()),
      null,
      path,
      `Reconstructed path of length ${path.length - 1} (steps): ${path.map(([r, c]) => `(${r},${c})`).join(' → ')}. Expanded ${closedMap.size} cells.`,
    ));
  } else {
    frames.push(paint(
      new Set(),
      new Set(closedMap.keys()),
      null,
      null,
      `Open set exhausted${popCount >= MAX_POPS ? ' (or step limit hit)' : ''}. Goal not reachable — no path exists from S to G.`,
    ));
  }

  return frames;
}

// Edmonds-Karp max-flow on a small directed graph.
function maxFlowFrames(variant = 'default') {
  let nodeIds, edgeList;
  const source = 0, sink = 3;
  if (variant === 'single') {
    nodeIds = [0, 1, 2, 3];
    edgeList = [[0, 1, 5], [1, 3, 5], [0, 2, 0], [2, 3, 0], [1, 2, 0]];
  } else if (variant === 'noFlow') {
    nodeIds = [0, 1, 2, 3];
    edgeList = [[0, 1, 4], [0, 2, 3], [1, 2, 2]];
  } else {
    nodeIds = [0, 1, 2, 3];
    edgeList = [[0, 1, 10], [0, 2, 5], [1, 2, 15], [1, 3, 10], [2, 3, 10]];
  }

  // Adjacency with capacities. Reverse edges start at 0 capacity for residual.
  const cap = {};
  const addCap = (u, v, w) => { cap[u] = cap[u] || {}; cap[u][v] = (cap[u][v] || 0) + w; };
  for (const [u, v, w] of edgeList) { addCap(u, v, w); addCap(v, u, 0); }

  // Snapshot helper: encodes current residual capacities into edges.
  const snapshot = (pathEdges, caption, doneEdges = []) => {
    const nodes = nodeIds.map(id => {
      let state;
      if (id === source) state = 'current';
      else if (id === sink) state = 'done';
      else if (pathEdges && pathEdges.some(e => e.a === id || e.b === id)) state = 'visited';
      return { id, label: id === source ? `s${id}` : id === sink ? `t${id}` : `${id}`, state };
    });
    const edges = edgeList.map(([u, v]) => {
      const remaining = cap[u]?.[v] ?? 0;
      const orig = edgeList.find(e => e[0] === u && e[1] === v)?.[2] ?? 0;
      const used = orig - remaining;
      const onPath = pathEdges?.some(e => e.a === u && e.b === v);
      const isDone = doneEdges.some(e => e.a === u && e.b === v);
      let state;
      if (onPath) state = 'visited';
      else if (used > 0) state = 'tree';
      else if (isDone) state = 'visited';
      return { a: u, b: v, w: `${used}/${orig}`, state };
    });
    return { nodes, edges, caption };
  };

  const frames = [];
  frames.push(snapshot(null, `Edmonds-Karp max-flow: repeat BFS from source (s=${source}) to sink (t=${sink}) on the residual graph; for each shortest augmenting path, push the bottleneck capacity. Stop when no path remains.`));
  frames.push(snapshot(null, `Edges show used/capacity. Capacities: ${edgeList.map(([u, v, w]) => `(${u}→${v}, ${w})`).join(', ')}. Total flow starts at 0.`));
  frames.push(snapshot(null, `Each augmenting path adds at least 1 unit (integer capacities). For each saturated edge u→v, residual reverse edge v→u opens up — that lets later paths "cancel" earlier flow if a better route exists.`));

  // BFS to find an augmenting path; return parent[].
  const bfs = () => {
    const parent = new Array(nodeIds.length).fill(-1);
    parent[source] = source;
    const queue = [source];
    while (queue.length) {
      const u = queue.shift();
      const neigh = Object.keys(cap[u] || {}).map(Number);
      for (const v of neigh) {
        if (parent[v] === -1 && cap[u][v] > 0) {
          parent[v] = u;
          if (v === sink) return parent;
          queue.push(v);
        }
      }
    }
    return parent[sink] === -1 ? null : parent;
  };

  let totalFlow = 0;
  let iter = 0;
  while (iter < 6) {
    iter += 1;
    frames.push(snapshot(null, `Iteration ${iter}: run BFS on the residual graph from s=${source}, only following edges with cap > 0. Record parent pointers.`));
    const parent = bfs();
    if (!parent) {
      frames.push(snapshot(null, `BFS exhausts reachable nodes without touching t=${sink}. No augmenting path remains → algorithm terminates. Maximum flow = ${totalFlow}.`));
      break;
    }
    // Reconstruct path.
    const pathEdges = [];
    let bottleneck = Infinity;
    let v = sink;
    while (v !== source) {
      const u = parent[v];
      pathEdges.unshift({ a: u, b: v });
      bottleneck = Math.min(bottleneck, cap[u][v]);
      v = u;
    }
    const pathStr = [source, ...pathEdges.map(e => e.b)].join(' → ');
    frames.push(snapshot(pathEdges, `BFS #${iter}: augmenting path ${pathStr}. Bottleneck = min residual along path = ${bottleneck}.`));

    // Push flow.
    for (const e of pathEdges) {
      cap[e.a][e.b] -= bottleneck;
      cap[e.b][e.a] = (cap[e.b][e.a] || 0) + bottleneck;
    }
    totalFlow += bottleneck;
    frames.push(snapshot(pathEdges, `Push ${bottleneck} unit${bottleneck === 1 ? '' : 's'} along ${pathStr}. Residuals updated; reverse edges gain ${bottleneck} capacity. Total flow = ${totalFlow}.`));
  }

  frames.push(snapshot(null, `Done. Maximum s→t flow = ${totalFlow}. By max-flow min-cut, this equals the minimum cut separating s from t.`));
  return frames;
}

// Aho-Corasick: build trie + fail links, then sweep text for all matches.
function ahoCorasickFrames(input = 'ushers') {
  const patterns = ['he', 'she', 'his', 'hers'];
  const text = String(input ?? '');
  const frames = [];
  // Build trie nodes. node: { id, next: { ch: id }, fail: id, out: [pattern,...] }
  const nodes = [{ id: 0, next: {}, fail: 0, out: [] }];
  const newNode = () => { nodes.push({ id: nodes.length, next: {}, fail: 0, out: [] }); return nodes.length - 1; };
  for (const p of patterns) {
    let cur = 0;
    for (const ch of p) {
      if (nodes[cur].next[ch] == null) nodes[cur].next[ch] = newNode();
      cur = nodes[cur].next[ch];
    }
    nodes[cur].out.push(p);
  }
  // BFS to set fail links.
  const queue = [];
  for (const ch of Object.keys(nodes[0].next)) {
    const v = nodes[0].next[ch];
    nodes[v].fail = 0;
    queue.push(v);
  }
  while (queue.length) {
    const u = queue.shift();
    for (const ch of Object.keys(nodes[u].next)) {
      const v = nodes[u].next[ch];
      let f = nodes[u].fail;
      while (f !== 0 && nodes[f].next[ch] == null) f = nodes[f].fail;
      nodes[v].fail = (nodes[f].next[ch] != null && nodes[f].next[ch] !== v) ? nodes[f].next[ch] : (nodes[0].next[ch] != null && nodes[0].next[ch] !== v ? nodes[0].next[ch] : 0);
      // Inherit outputs via fail link.
      for (const o of nodes[nodes[v].fail].out) if (!nodes[v].out.includes(o)) nodes[v].out.push(o);
      queue.push(v);
    }
  }

  const trieDescription = nodes.map(n => `n${n.id}${n.out.length ? `[out: ${n.out.join(',')}]` : ''}→fail=n${n.fail}`).join(' | ');

  const renderText = (i, matchSpans) => {
    return text.split('').map((c, idx) => {
      if (matchSpans.some(([s, e]) => idx >= s && idx < e)) return `[${c}]`;
      if (idx === i) return `<${c}>`;
      return c;
    });
  };

  frames.push({ array: text.split(''), caption: `Aho-Corasick: simultaneous multi-pattern matching. Build a trie of patterns [${patterns.map(p => `"${p}"`).join(', ')}] then add "fail links" — when a character mismatches at node u, jump to the longest proper suffix of u's path that is also a prefix of some pattern.` });
  frames.push({ array: text.split(''), caption: `Trie has ${nodes.length} nodes (root = n0). Output sets are propagated along fail links so each node knows every pattern ending at its path or any suffix.` });
  frames.push({ array: text.split(''), caption: `Trie + fail links: ${trieDescription}.` });
  frames.push({ array: text.split(''), caption: `Sweep text "${text}" (length ${text.length}). Maintain current node; for each char, follow next-pointer or fall back via fail. Emit all out[]s at the current node.` });

  let cur = 0;
  const matches = [];
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    let walked = false;
    while (cur !== 0 && nodes[cur].next[ch] == null) {
      const prev = cur;
      cur = nodes[cur].fail;
      walked = true;
      frames.push({
        array: renderText(i, matches.map(m => [m.end - m.len, m.end])),
        highlights: { [i]: 'mid' },
        caption: `i=${i}, char "${ch}". No transition from n${prev} on "${ch}". Follow fail link n${prev} → n${cur}.`,
      });
    }
    if (nodes[cur].next[ch] != null) {
      const prev = cur;
      cur = nodes[cur].next[ch];
      frames.push({
        array: renderText(i, matches.map(m => [m.end - m.len, m.end])),
        highlights: { [i]: 'match' },
        caption: `i=${i}, char "${ch}". Transition n${prev} → n${cur}${walked ? ' (after fail fallback)' : ''}.`,
      });
    } else if (!walked) {
      frames.push({
        array: renderText(i, matches.map(m => [m.end - m.len, m.end])),
        highlights: { [i]: 'low' },
        caption: `i=${i}, char "${ch}". No transition from root either — stay at n0.`,
      });
    }
    if (nodes[cur].out.length) {
      for (const p of nodes[cur].out) {
        matches.push({ end: i + 1, len: p.length, pattern: p });
      }
      frames.push({
        array: renderText(i, matches.map(m => [m.end - m.len, m.end])),
        highlights: { [i]: 'match' },
        caption: `Match! At i=${i}, n${cur}.out = [${nodes[cur].out.join(', ')}]. Found ${nodes[cur].out.map(p => `"${p}" ending at index ${i}`).join(', ')}.`,
      });
    }
  }

  frames.push({
    array: renderText(-1, matches.map(m => [m.end - m.len, m.end])),
    caption: matches.length
      ? `Done. ${matches.length} match${matches.length === 1 ? '' : 'es'}: ${matches.map(m => `"${m.pattern}" at [${m.end - m.len}, ${m.end - 1}]`).join('; ')}. Total time O(|text| + |output|).`
      : `Done. No patterns matched in "${text}". Sweep was O(|text|) regardless.`,
  });
  return frames;
}

// Sweep line: max overlap count over intervals via +1/-1 events.
function sweepLineFrames(input = [[1, 4], [2, 6], [5, 8], [3, 7], [9, 12]]) {
  let intervals = [];
  if (Array.isArray(input) && input.length && Array.isArray(input[0])) {
    intervals = input
      .map(([s, e]) => [Number(s), Number(e)])
      .filter(([s, e]) => Number.isFinite(s) && Number.isFinite(e) && s < e);
  } else if (Array.isArray(input)) {
    const flat = input.map(Number).filter(Number.isFinite);
    for (let i = 0; i + 1 < flat.length; i += 2) {
      if (flat[i] < flat[i + 1]) intervals.push([flat[i], flat[i + 1]]);
    }
  }
  if (!intervals.length) return [{ array: [], caption: 'No intervals — nothing to sweep.' }];

  const events = [];
  for (const [s, e] of intervals) {
    events.push({ x: s, delta: +1, kind: 'start', interval: [s, e] });
    events.push({ x: e, delta: -1, kind: 'end',   interval: [s, e] });
  }
  // End events sort before start events at same x so closed intervals don't double-count touching points.
  events.sort((a, b) => (a.x - b.x) || (a.delta - b.delta));

  const display = intervals.map(([s, e], i) => `I${i}:[${s},${e}]`);
  const frames = [];
  frames.push({
    array: display,
    caption: `Sweep line on ${intervals.length} interval${intervals.length === 1 ? '' : 's'}: [${intervals.map(([s, e]) => `[${s},${e}]`).join(', ')}]. Goal: maximum number of intervals overlapping at any single point.`,
  });
  frames.push({
    array: display,
    caption: `Parse step: split each interval [s, e] into two events — a "+1" at s (an interval begins) and a "-1" at e (an interval ends). Sweep events left-to-right while keeping a running active counter.`,
  });
  frames.push({
    array: display,
    caption: `Tie-break: when two events share an x, process end (-1) before start (+1) so touching intervals like [1,4] and [4,6] aren't counted as overlapping. Total ${events.length} events after the split.`,
  });
  frames.push({
    array: display,
    highlights: Object.fromEntries(intervals.map((_, i) => [i, 'frontier'])),
    caption: `Events sorted by x: ${events.map(ev => `(${ev.x},${ev.delta > 0 ? '+1' : '-1'})`).join(' ')}.`,
  });

  let active = 0;
  let best = 0;
  let bestX = events[0].x;
  const activeSet = new Set();
  const intervalIndex = new Map();
  intervals.forEach((iv, i) => intervalIndex.set(`${iv[0]},${iv[1]}`, i));

  for (const ev of events) {
    const idx = intervalIndex.get(`${ev.interval[0]},${ev.interval[1]}`);
    if (ev.delta > 0) {
      active += 1;
      activeSet.add(idx);
    } else {
      active -= 1;
      activeSet.delete(idx);
    }
    if (active > best) { best = active; bestX = ev.x; }
    const hl = {};
    for (const i of activeSet) hl[i] = 'mid';
    if (idx !== undefined) hl[idx] = ev.delta > 0 ? 'match' : 'low';
    frames.push({
      array: display,
      highlights: hl,
      caption: `x = ${ev.x}: ${ev.delta > 0 ? 'start' : 'end'} of I${idx} [${ev.interval[0]},${ev.interval[1]}]. active = ${active}, max-so-far = ${best}${best === active ? ' (new peak)' : ''}.`,
    });
  }

  const finalHl = {};
  intervals.forEach((_, i) => { finalHl[i] = 'visited'; });
  frames.push({
    array: display,
    highlights: finalHl,
    caption: `Done. Maximum overlap = ${best}, first achieved at x = ${bestX}. Total time O(n log n) for the sort + O(n) for the sweep.`,
  });
  return frames;
}

// Morris in-order traversal: O(1) extra space via temporary right-thread pointers.
function morrisTraversalFrames(variant = 'default') {
  let inserts;
  if (variant === 'rightSkewed') inserts = [1, 2, 3, 4, 5, 6, 7];
  else if (variant === 'leftSkewed') inserts = [7, 6, 5, 4, 3, 2, 1];
  else inserts = [5, 3, 7, 1, 4, 6, 8];

  // Build a BST. Each node: { v, left, right }.
  const nodes = inserts.map(v => ({ v, left: null, right: null }));
  const byVal = new Map();
  inserts.forEach((v, i) => byVal.set(v, nodes[i]));
  let root = null;
  for (const v of inserts) {
    if (root === null) { root = byVal.get(v); continue; }
    let cur = root;
    while (true) {
      if (v < cur.v) {
        if (!cur.left) { cur.left = byVal.get(v); break; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = byVal.get(v); break; }
        cur = cur.right;
      }
    }
  }

  // Fixed display order = insertion order so highlights index stays stable.
  const idxOf = new Map();
  nodes.forEach((n, i) => idxOf.set(n, i));
  const baseDisplay = nodes.map(n => `${n.v}`);

  const frames = [];
  const threads = new Set(); // tracks which nodes currently host a temporary right-thread
  const visited = [];
  const renderDisplay = (curNode) => baseDisplay.map((s, i) => {
    let label = s;
    if (threads.has(nodes[i])) label = `${label}*`;
    if (curNode && idxOf.get(curNode) === i) label = `[${label}]`;
    return label;
  });
  const buildHl = (curNode) => {
    const hl = {};
    for (const v of visited) hl[idxOf.get(byVal.get(v))] = 'visited';
    for (const t of threads) hl[idxOf.get(t)] = 'frontier';
    if (curNode) hl[idxOf.get(curNode)] = 'mid';
    return hl;
  };

  frames.push({
    array: baseDisplay,
    caption: `Morris in-order on a BST built by inserting [${inserts.join(', ')}]. Goal: visit nodes in sorted order using O(1) extra space (no recursion stack, no explicit stack).`,
  });
  frames.push({
    array: baseDisplay,
    caption: `Trick: temporarily rewire each subtree's in-order predecessor's right pointer to point back to the current node (a "thread"). On the way back up, that thread guides us without a stack — and we restore it before leaving.`,
  });
  frames.push({
    array: baseDisplay,
    caption: `Rules at node cur: if cur.left == null → visit cur, go right. Else find predecessor = rightmost node of cur.left. If pred.right == null → set pred.right = cur (thread), go left. If pred.right == cur → restore (null), visit cur, go right.`,
  });
  frames.push({
    array: renderDisplay(root),
    highlights: buildHl(root),
    caption: `Start: cur = root (${root.v}). Asterisk "*" marks a node currently hosting a thread; "[v]" marks the current cur pointer; greyed cells are already visited.`,
  });

  let cur = root;
  let safety = 0;
  while (cur && safety < 200) {
    safety += 1;
    if (!cur.left) {
      visited.push(cur.v);
      const next = cur.right;
      frames.push({
        array: renderDisplay(next),
        highlights: buildHl(next),
        caption: `cur = ${cur.v} has no left child → visit ${cur.v} (output: [${visited.join(', ')}]), then move to cur.right.`,
      });
      cur = next;
    } else {
      // find predecessor
      let pred = cur.left;
      while (pred.right && pred.right !== cur) pred = pred.right;
      if (!pred.right) {
        pred.right = cur;
        threads.add(pred);
        frames.push({
          array: renderDisplay(cur),
          highlights: buildHl(cur),
          caption: `cur = ${cur.v}: predecessor is ${pred.v}. Its right is null → install thread ${pred.v} → ${cur.v}, then go left.`,
        });
        cur = cur.left;
      } else {
        pred.right = null;
        threads.delete(pred);
        visited.push(cur.v);
        const next = cur.right;
        frames.push({
          array: renderDisplay(next),
          highlights: buildHl(next),
          caption: `cur = ${cur.v}: predecessor ${pred.v}.right already points to ${cur.v} → thread already used. Restore pred.right = null, visit ${cur.v} (output: [${visited.join(', ')}]), go right.`,
        });
        cur = next;
      }
    }
  }

  frames.push({
    array: baseDisplay.map((s) => `${s}`),
    highlights: Object.fromEntries(nodes.map((_, i) => [i, 'match'])),
    caption: `Done. In-order sequence: [${visited.join(', ')}]. Tree structure fully restored (all temporary threads removed). Time O(n) amortized, extra space O(1).`,
  });
  return frames;
}

// Digit DP: count integers in [0, N] whose digit sum equals target. Walk digit-by-digit.
function digitDPFrames(variant = 'default') {
  let N, target;
  if (variant === 'small') { N = 50;  target = 3;  }
  else if (variant === 'wide') { N = 200; target = 10; }
  else { N = 132; target = 5; }

  const digits = String(N).split('').map(Number);
  const L = digits.length;
  const display = digits.map(String);

  const frames = [];
  frames.push({
    array: display,
    caption: `Digit DP: count integers in [0, ${N}] whose digit-sum equals ${target}. Walk the upper bound N = ${N} digit-by-digit; at each position track (sum-so-far, tight-flag).`,
  });
  frames.push({
    array: display,
    caption: `State f(pos, sum, tight) = number of ways to fill remaining positions so the total digit sum hits ${target}. tight = true means we are still hugging N's prefix — next digit is capped at digits[pos].`,
  });
  frames.push({
    array: display,
    caption: `Transition: for d in [0, (tight ? digits[pos] : 9)], recurse with sum+d and tight' = tight && (d == digits[pos]). Base case: pos == ${L} → return (sum == ${target} ? 1 : 0).`,
  });
  frames.push({
    array: display,
    highlights: Object.fromEntries(display.map((_, i) => [i, 'frontier'])),
    caption: `N has ${L} digit${L === 1 ? '' : 's'}: [${digits.join(', ')}]. Total candidate digit strings (with leading zeros allowed) = 10^${L} = ${10 ** L}; tight pruning is what keeps us under N.`,
  });

  // Memoised dp.
  const memo = new Map();
  const ways = (pos, sum, tight) => {
    if (sum > target) return 0;
    if (pos === L) return sum === target ? 1 : 0;
    const key = `${pos}|${sum}|${tight ? 1 : 0}`;
    if (memo.has(key)) return memo.get(key);
    const cap = tight ? digits[pos] : 9;
    let total = 0;
    for (let d = 0; d <= cap; d += 1) total += ways(pos + 1, sum + d, tight && d === cap);
    memo.set(key, total);
    return total;
  };

  // Walk positions, picking the "tight" branch each time and showing all child options.
  let runningSum = 0;
  for (let pos = 0; pos < L; pos += 1) {
    const cap = digits[pos];
    const hl = {};
    for (let i = 0; i < pos; i += 1) hl[i] = 'visited';
    hl[pos] = 'mid';
    const branchCounts = [];
    for (let d = 0; d <= 9; d += 1) {
      if (d > cap) { branchCounts.push(`d=${d}:×`); continue; }
      const isTight = d === cap;
      const cnt = ways(pos + 1, runningSum + d, isTight);
      branchCounts.push(`d=${d}${isTight ? '·tight' : ''}:${cnt}`);
    }
    frames.push({
      array: display,
      highlights: hl,
      caption: `pos = ${pos} (digit ${digits[pos]}). sum-so-far = ${runningSum}. tight = true (still hugging N). Cap on this digit = ${cap}. Branches: ${branchCounts.join(', ')}.`,
    });
    runningSum += digits[pos];
    frames.push({
      array: display,
      highlights: { ...hl, [pos]: 'low' },
      caption: `Take the tight branch d = ${digits[pos]} (matches N's digit) so future positions remain bounded by N. sum advances to ${runningSum}. Off-tight branches above add their counts directly to the answer.`,
    });
  }

  const answer = ways(0, 0, true);
  frames.push({
    array: display,
    highlights: Object.fromEntries(display.map((_, i) => [i, 'match'])),
    caption: `Done. Number of integers in [0, ${N}] with digit sum = ${target} is ${answer}. Memo holds ${memo.size} distinct (pos, sum, tight) state${memo.size === 1 ? '' : 's'} — that is why digit DP is fast even for N up to 10^18.`,
  });
  return frames;
}

// Coordinate compression: map huge values into dense rank indices.
function coordinateCompressionFrames(input = [1700001234, 1700005678, 1700001234, 1700009999, 1700002000]) {
  const arr = (Array.isArray(input) ? input : []).map(Number).filter(Number.isFinite);
  if (!arr.length) return [{ array: [], caption: 'Empty array — nothing to compress.' }];
  const frames = [];
  const display = arr.map(String);

  frames.push({
    array: display,
    caption: `Coordinate compression on ${arr.length} values: [${arr.join(', ')}]. Many algorithms (Fenwick trees, segment trees, sweep-line) only care about the *order* of values, not their magnitudes. Compression replaces each value with its rank in the sorted distinct set, shrinking the universe to [0, k).`,
  });
  frames.push({
    array: display,
    caption: `Plan: (1) copy values, (2) sort, (3) dedupe to get the sorted distinct array, (4) for each original element, look up its rank via binary search.`,
  });
  frames.push({
    array: display,
    highlights: Object.fromEntries(display.map((_, i) => [i, 'frontier'])),
    caption: `Original array highlighted. Notice the values are huge (timestamps, ids) — keeping them as array indices would blow up memory.`,
  });

  const sorted = arr.slice().sort((a, b) => a - b);
  frames.push({
    array: sorted.map(String),
    caption: `Step 1+2: sort a copy. sorted = [${sorted.join(', ')}]. O(n log n).`,
  });

  const distinct = [];
  for (const v of sorted) if (distinct.length === 0 || distinct[distinct.length - 1] !== v) distinct.push(v);
  const dedupeHl = {};
  for (let i = 0; i < sorted.length; i += 1) {
    dedupeHl[i] = i > 0 && sorted[i] === sorted[i - 1] ? 'low' : 'mid';
  }
  frames.push({
    array: sorted.map(String),
    highlights: dedupeHl,
    caption: `Step 3: dedupe — drop adjacent duplicates (faded). Distinct values = [${distinct.join(', ')}] (k = ${distinct.length}).`,
  });
  frames.push({
    array: distinct.map((v, i) => `${i}:${v}`),
    highlights: Object.fromEntries(distinct.map((_, i) => [i, 'visited'])),
    caption: `Distinct sorted array with ranks. Each entry "rank:value" — this is the mapping table that drives the rank lookup.`,
  });

  // Build rank map + lookup each original value.
  const rankOf = new Map();
  distinct.forEach((v, i) => rankOf.set(v, i));
  const compressed = new Array(arr.length).fill(null);
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i];
    const r = rankOf.get(v);
    compressed[i] = r;
    const hl = {};
    for (let j = 0; j < i; j += 1) hl[j] = 'visited';
    hl[i] = 'mid';
    frames.push({
      array: display.map((s, idx) => idx <= i ? `${s}→${compressed[idx]}` : s),
      highlights: hl,
      caption: `Step 4 (i=${i}): lookup ${v} via binary search in distinct → rank ${r}. compressed[${i}] = ${r}.`,
    });
  }

  frames.push({
    array: compressed.map(String),
    highlights: Object.fromEntries(compressed.map((_, i) => [i, 'match'])),
    caption: `Done. Compressed array: [${compressed.join(', ')}]. Universe shrunk from values up to ${Math.max(...arr)} down to k = ${distinct.length}. Original ordering and equality relations preserved.`,
  });
  return frames;
}

// Treap insertion: BST by key, max-heap by priority. Rotate on insert to fix priority order.
function treapFrames(input = [5, 3, 8, 1, 4, 7, 9]) {
  const keys = (Array.isArray(input) ? input : []).map(Number).filter(Number.isFinite);
  if (!keys.length) return [{ array: [], caption: 'Empty input — nothing to insert.' }];

  // Seeded LCG so priorities are deterministic per call.
  let seed = 0x9e3779b1;
  for (const v of keys) seed = ((seed ^ (v | 0)) * 1664525 + 1013904223) >>> 0;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed; };

  let nodeIdCounter = 0;
  let root = null;
  const rotateRight = (y) => { const x = y.left; y.left = x.right; x.right = y; return x; };
  const rotateLeft = (x) => { const y = x.right; x.right = y.left; y.left = x; return y; };
  const insert = (node, key, priority) => {
    if (!node) return { _id: ++nodeIdCounter, key, priority, left: null, right: null };
    if (key < node.key) {
      node.left = insert(node.left, key, priority);
      if (node.left.priority > node.priority) node = rotateRight(node);
    } else {
      node.right = insert(node.right, key, priority);
      if (node.right.priority > node.priority) node = rotateLeft(node);
    }
    return node;
  };

  // In-order flatten for display so each entry maps to a fixed column index per frame.
  const flatten = (node, out) => {
    if (!node) return;
    flatten(node.left, out);
    out.push(node);
    flatten(node.right, out);
  };
  const render = (highlightKey, status = 'mid') => {
    const list = [];
    flatten(root, list);
    const arr = list.map(n => `${n.key}|p=${n.priority}`);
    const hl = {};
    if (highlightKey !== undefined && highlightKey !== null) {
      const idx = list.findIndex(n => n.key === highlightKey);
      if (idx >= 0) hl[idx] = status;
    }
    return { array: arr, highlights: hl };
  };

  const frames = [];
  frames.push({ array: ['empty treap'], caption: `Treap: a randomised BST that is also a max-heap on priorities. Each node stores (key, priority). Keys obey BST order left→right; priorities obey heap order top-down.` });
  frames.push({ array: ['empty treap'], caption: `Insert(key): BST-insert as a leaf with a random priority, then rotate that leaf upward while it violates the heap order. Each frame shows in-order layout "key|p=priority".` });
  frames.push({ array: ['empty treap'], caption: `Expected height O(log n) because random priorities behave like a random permutation — equivalent to inserting in random order into a plain BST.` });

  for (const k of keys) {
    const p = rand() % 100;
    const beforeRoot = root;
    root = insert(root, k, p);
    const snap = render(k, 'match');
    const rotated = beforeRoot && (() => {
      const peek = (node) => {
        if (!node) return false;
        if (k < node.key) return node.left && node.left.key === k && node.left.priority > node.priority;
        return node.right && node.right.key === k && node.right.priority > node.priority;
      };
      return peek(beforeRoot);
    })();
    frames.push({
      array: snap.array,
      highlights: snap.highlights,
      caption: `Insert key ${k} with priority ${p}. BST-place as a leaf, then rotate up while child.priority > parent.priority.${rotated ? ' Rotation performed.' : ''}`,
    });
    const finalSnap = render(k, 'visited');
    frames.push({
      array: finalSnap.array,
      highlights: finalSnap.highlights,
      caption: `After insert: in-order keys = [${(() => { const list = []; flatten(root, list); return list.map(n => n.key).join(', '); })()}]. Heap invariant: max priority at root is ${root.priority}.`,
    });
  }

  const finalList = [];
  flatten(root, finalList);
  frames.push({
    array: finalList.map(n => `${n.key}|p=${n.priority}`),
    highlights: Object.fromEntries(finalList.map((_, i) => [i, 'match'])),
    caption: `Done. ${finalList.length} keys inserted. In-order = sorted keys; the root holds the highest priority (${root.priority}). Expected O(log n) depth from random priorities.`,
  });
  return frames;
}

// Treap insertion variants: default / strictly increasing / random.
function treapVariantFrames(variant = 'default') {
  if (variant === 'increasing') return treapFrames([1, 2, 3, 4, 5, 6, 7]);
  if (variant === 'random') return treapFrames([42, 17, 88, 5, 63, 29, 71, 12]);
  return treapFrames([5, 3, 8, 1, 4, 7, 9]);
}

// Bitmask DP for TSP. dp[mask][i] = shortest tour visiting cities in mask ending at i.
function bitDPFrames(variant = 'default') {
  let n, dist;
  if (variant === 'small') {
    n = 3;
    dist = [
      [0, 4, 6],
      [4, 0, 2],
      [6, 2, 0],
    ];
  } else if (variant === 'large') {
    n = 5;
    dist = [
      [0, 3, 8, 7, 5],
      [3, 0, 4, 6, 9],
      [8, 4, 0, 5, 2],
      [7, 6, 5, 0, 4],
      [5, 9, 2, 4, 0],
    ];
  } else {
    n = 4;
    dist = [
      [0, 10, 15, 20],
      [10, 0, 35, 25],
      [15, 35, 0, 30],
      [20, 25, 30, 0],
    ];
  }

  const INF = Infinity;
  const fullMask = (1 << n) - 1;
  // dp[mask][i] only valid when bit i set in mask. Layout as 2D map for clarity.
  const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(INF));
  dp[1][0] = 0; // start at city 0, mask = {0}

  const fmtCell = (v) => (v === INF ? '∞' : String(v));
  const maskStr = (m) => {
    const out = [];
    for (let b = 0; b < n; b += 1) if (m & (1 << b)) out.push(b);
    return `{${out.join(',')}}`;
  };
  // Display = row per mask containing one cell per city.
  const rowsForDisplay = () => {
    const rows = [];
    for (let m = 1; m <= fullMask; m += 1) {
      if (!(m & 1)) continue; // tours always start at 0
      const cells = [];
      for (let i = 0; i < n; i += 1) {
        if (m & (1 << i)) cells.push(`${i}:${fmtCell(dp[m][i])}`);
      }
      rows.push(`${maskStr(m)} ${cells.join(' ')}`);
    }
    return rows;
  };
  const indexOfMask = (target) => {
    let idx = 0;
    for (let m = 1; m <= fullMask; m += 1) {
      if (!(m & 1)) continue;
      if (m === target) return idx;
      idx += 1;
    }
    return -1;
  };

  const frames = [];
  frames.push({ array: rowsForDisplay(), caption: `Bitmask DP for TSP on ${n} cities. State dp[mask][i] = shortest path that visits exactly the cities in mask and ends at city i. Each frame shows one row per mask (only rows containing city 0).` });
  frames.push({ array: rowsForDisplay(), caption: `Total states: ${1 << n} masks × ${n} end-cities = ${(1 << n) * n}. Transitions: O(n) per state → overall O(2^n · n²). Far better than n! brute force.` });
  frames.push({ array: rowsForDisplay(), caption: `Base case: dp[{0}][0] = 0 — at city 0, having visited only {0}, cost is 0. All other cells initialised to ∞.` });
  frames.push({
    array: rowsForDisplay(),
    highlights: { [indexOfMask(1)]: 'match' },
    caption: `Distance matrix (symmetric): ${dist.map((row) => `[${row.join(',')}]`).join(' ')}. We sweep masks in increasing numerical order so any sub-mask is already computed.`,
  });

  // Fill DP in mask order.
  for (let mask = 1; mask <= fullMask; mask += 1) {
    if (!(mask & 1)) continue;
    for (let i = 0; i < n; i += 1) {
      if (!(mask & (1 << i))) continue;
      if (dp[mask][i] === INF) continue;
      for (let j = 0; j < n; j += 1) {
        if (mask & (1 << j)) continue;
        const next = mask | (1 << j);
        const cand = dp[mask][i] + dist[i][j];
        if (cand < dp[next][j]) {
          dp[next][j] = cand;
        }
      }
    }
    // Snapshot once per mask if it had any valid entries.
    const anyValid = dp[mask].some(v => v !== INF);
    if (anyValid) {
      const hl = { [indexOfMask(mask)]: mask === fullMask ? 'match' : 'mid' };
      frames.push({
        array: rowsForDisplay(),
        highlights: hl,
        caption: `Mask ${maskStr(mask)} processed: relaxed every transition from each end-city i ∈ mask to each j ∉ mask. dp[mask][i] for this row finalised.`,
      });
    }
  }

  // Close tour: best dp[full][i] + dist[i][0].
  let best = INF, bestI = -1;
  for (let i = 1; i < n; i += 1) {
    if (dp[fullMask][i] + dist[i][0] < best) {
      best = dp[fullMask][i] + dist[i][0];
      bestI = i;
    }
  }
  frames.push({
    array: rowsForDisplay(),
    highlights: { [indexOfMask(fullMask)]: 'match' },
    caption: `Close the tour: min over i of dp[full][i] + dist[i][0] = ${best === INF ? '∞' : best} via city ${bestI}. That is the answer; the route can be recovered by parent-pointers per (mask,i) if needed.`,
  });
  return frames;
}

// Dijkstra with a priority queue, visualised as graph snapshots. Highlight stale heap entries.
function dijkstraPQFrames(variant = 'default') {
  let n, edges, source;
  if (variant === 'dense') {
    n = 5;
    edges = [
      { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 4 }, { a: 0, b: 3, w: 7 }, { a: 0, b: 4, w: 9 },
      { a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 3 }, { a: 2, b: 3, w: 2 }, { a: 2, b: 4, w: 5 },
      { a: 3, b: 4, w: 1 },
    ];
    source = 0;
  } else if (variant === 'noPath') {
    n = 5;
    edges = [
      { a: 0, b: 1, w: 3 }, { a: 1, b: 2, w: 2 },
      { a: 3, b: 4, w: 4 },
    ];
    source = 0;
  } else {
    n = 5;
    edges = [
      { a: 0, b: 1, w: 4 }, { a: 0, b: 2, w: 1 }, { a: 2, b: 1, w: 2 },
      { a: 1, b: 3, w: 1 }, { a: 2, b: 3, w: 5 }, { a: 3, b: 4, w: 3 },
    ];
    source = 0;
  }
  const nodes = Array.from({ length: n }, (_, i) => ({ id: i, label: `${i}` }));
  const adj = {};
  for (const e of edges) {
    (adj[e.a] ||= []).push([e.b, e.w]);
    (adj[e.b] ||= []).push([e.a, e.w]);
  }

  const dist = {};
  for (let i = 0; i < n; i += 1) dist[i] = Infinity;
  dist[source] = 0;
  const visited = new Set();
  // Heap as a sorted array of [d, v]; we mark a "stale" entry when v's dist is already smaller.
  const heap = [[0, source]];
  let staleCount = 0;
  let popped = 0;
  let relaxed = 0;

  const frames = [];
  const labelOf = (id) => `${id}\nd=${dist[id] === Infinity ? '∞' : dist[id]}`;
  const heapStr = (markStaleTop = false) => {
    if (!heap.length) return 'PQ: []';
    return `PQ: [${heap.map(([d, v], idx) => `${markStaleTop && idx === 0 ? '✗' : ''}(${d},${v})`).join(', ')}]`;
  };
  const snapshot = (currentId, relaxedEdge, caption) => {
    const ns = nodes.map(nd => ({
      ...nd,
      label: labelOf(nd.id),
      state: nd.id === currentId ? 'current'
        : visited.has(nd.id) ? 'done'
        : dist[nd.id] !== Infinity ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      if (relaxedEdge && ((e.a === relaxedEdge.from && e.b === relaxedEdge.to) || (e.b === relaxedEdge.from && e.a === relaxedEdge.to))) {
        return { ...e, state: 'tree' };
      }
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapshot(source, null, `Dijkstra with a priority queue from node ${source}. dist[${source}] = 0, all others = ∞. We push (0, ${source}) into the PQ and start popping the minimum.`);
  snapshot(source, null, `Key idea: when we pop (d, v), if d > dist[v] we discard it — that's a stale entry left over from when v's distance was higher. This decrease-key-free variant runs in O((V+E) log V).`);
  snapshot(source, null, `${heapStr()}. Sort the heap by current distance so the smallest tentative distance is always on top.`);

  const sortHeap = () => heap.sort((x, y) => x[0] - y[0]);

  while (heap.length) {
    sortHeap();
    const [d, u] = heap.shift();
    popped += 1;
    if (d > dist[u] || visited.has(u)) {
      staleCount += 1;
      snapshot(u, null, `Pop (${d}, ${u}) from PQ. dist[${u}] = ${dist[u]} < ${d} → stale entry, skip. (${staleCount} stale popped so far.) ${heapStr()}`);
      continue;
    }
    visited.add(u);
    snapshot(u, null, `Pop (${d}, ${u}). Fresh — finalise dist[${u}] = ${d}. Relax neighbours next. ${heapStr()}`);
    for (const [v, w] of adj[u] || []) {
      if (visited.has(v)) continue;
      const cand = dist[u] + w;
      if (cand < dist[v]) {
        dist[v] = cand;
        heap.push([cand, v]);
        relaxed += 1;
        snapshot(u, { from: u, to: v }, `Relax ${u}→${v} (w=${w}): dist[${v}] ← ${cand}. Push (${cand}, ${v}). Old entries for ${v} (if any) become stale. ${heapStr()}`);
      }
    }
  }

  const unreached = [];
  for (let i = 0; i < n; i += 1) if (dist[i] === Infinity) unreached.push(i);
  snapshot(null, null, `Done. ${popped} pops, ${relaxed} relaxations, ${staleCount} stale entries discarded.${unreached.length ? ` Unreachable from ${source}: {${unreached.join(', ')}}.` : ''} Final dist: [${nodes.map(nd => dist[nd.id] === Infinity ? '∞' : dist[nd.id]).join(', ')}].`);
  return frames;
}

// Polynomial prefix-hash array: h[i] = (h[i-1]*b + s[i]) mod M.
function stringHashingFrames({ str = 'abcabc', base = 31, mod = 1000000007 } = {}) {
  const s = String(str ?? '');
  if (!s.length) return [{ array: [], caption: 'Empty string — no hash to build.' }];
  const b = Math.max(2, Math.trunc(Number(base) || 31));
  const M = Math.max(2, Math.trunc(Number(mod) || 1000000007));

  const frames = [];
  const chars = s.split('');
  const charCode = (c) => {
    const lower = c.toLowerCase();
    if (lower >= 'a' && lower <= 'z') return lower.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    return c.charCodeAt(0);
  };

  const hashes = [];
  const renderRow = (i) => chars.map((c, idx) => idx <= i ? `${c}:${hashes[idx]}` : c);

  frames.push({ array: chars, caption: `Polynomial string hashing for "${s}" with base b = ${b} and modulus M = ${M}. Treat each character as a digit; the whole prefix is a number in base b modulo M.` });
  frames.push({ array: chars, caption: `Map each lowercase letter to 1..26 (a=1, b=2, …). The empty prefix hashes to 0. Recurrence: h[i] = (h[i-1] · b + val(s[i])) mod M.` });
  frames.push({ array: chars, caption: `Why a prefix array? Any substring hash is then computable in O(1): hash(l, r) = (h[r] − h[l-1] · b^(r-l+1)) mod M. Combined with random base, collisions are astronomically rare.` });
  frames.push({ array: chars, caption: `Indexing: i runs from 0 to ${s.length - 1}. Each frame extends the accumulator one character to the right.` });

  let acc = 0;
  for (let i = 0; i < chars.length; i += 1) {
    const v = charCode(chars[i]);
    const prev = acc;
    acc = (prev * b + v) % M;
    hashes.push(acc);
    frames.push({
      array: renderRow(i),
      highlights: { [i]: 'mid' },
      caption: `i=${i}: char "${chars[i]}" → val ${v}. h[${i}] = (h[${i - 1}]·${b} + ${v}) mod ${M} = (${prev}·${b} + ${v}) mod ${M} = ${acc}.`,
    });
  }

  frames.push({
    array: renderRow(chars.length - 1),
    highlights: Object.fromEntries(hashes.map((_, i) => [i, 'match'])),
    caption: `Done. Prefix hash array = [${hashes.join(', ')}]. Full-string hash = ${hashes[hashes.length - 1]}. Use a second base/mod pair (double hashing) to drive collision probability to ~10^-18.`,
  });
  return frames;
}

// Counting inversions via merge sort. An inversion is a pair (i, j), i < j, a[i] > a[j].
function countingInversionsFrames(input = [2, 4, 1, 5, 3]) {
  const arr = Array.isArray(input) ? input.slice() : [2, 4, 1, 5, 3];
  if (!arr.length) return [{ array: [], caption: 'Empty array — 0 inversions.' }];
  const n = arr.length;
  const frames = [];
  let invCount = 0;

  frames.push({
    array: arr.slice(),
    caption: `Counting inversions in [${arr.join(', ')}]. An inversion is a pair (i, j) with i < j but a[i] > a[j]. Brute force is O(n^2); we get O(n log n) by piggy-backing on merge sort.`,
  });
  frames.push({
    array: arr.slice(),
    caption: `Key insight during merge: when we take an element from the right half before exhausting the left, every remaining left-half element is greater — each contributes one inversion.`,
  });
  frames.push({
    array: arr.slice(),
    caption: `We split, sort recursively, then merge while counting cross-half inversions. Inversions inside each half are counted by the recursive calls.`,
  });

  const mergeAndCount = (left, right, prefix, depth) => {
    const out = [];
    let i = 0, j = 0;
    const render = (caption, hl = {}) => {
      const composite = [...prefix, ...out, ...left.slice(i), ...right.slice(j)];
      while (composite.length < n) composite.push(0);
      const elim = new Set(Array.from({ length: prefix.length }, (_, k) => k));
      frames.push({ array: composite, highlights: hl, eliminated: elim, caption });
    };

    render(`Merge at depth ${depth}: left=[${left.join(',')}], right=[${right.join(',')}]. Inversions so far = ${invCount}.`);
    while (i < left.length && j < right.length) {
      const li = prefix.length + out.length;
      const ri = li + (left.length - i);
      if (left[i] <= right[j]) {
        out.push(left[i]);
        render(`Compare ${left[i]} vs ${right[j]}: left head ≤ right head — take left. No inversion (left already comes first).`, { [li]: 'low', [ri]: 'mid' });
        i += 1;
      } else {
        const contributed = left.length - i;
        invCount += contributed;
        out.push(right[j]);
        render(`Compare ${left[i]} vs ${right[j]}: left > right — take right. Every remaining left element (${contributed} of them: [${left.slice(i).join(',')}]) forms an inversion with ${right[j]}. Inversions += ${contributed} → ${invCount}.`, { [li]: 'high', [ri]: 'match' });
        j += 1;
      }
    }
    while (i < left.length) { out.push(left[i++]); render(`Left leftovers drain.`); }
    while (j < right.length) { out.push(right[j++]); render(`Right leftovers drain — no new inversions.`); }
    return out;
  };

  const sortAndCount = (segment, prefix, depth) => {
    if (segment.length <= 1) return segment.slice();
    const mid = Math.floor(segment.length / 2);
    const left = sortAndCount(segment.slice(0, mid), prefix, depth + 1);
    const right = sortAndCount(segment.slice(mid), [...prefix, ...left], depth + 1);
    return mergeAndCount(left, right, prefix, depth);
  };

  const sorted = sortAndCount(arr, [], 0);
  frames.push({
    array: sorted,
    highlights: Object.fromEntries(sorted.map((_, k) => [k, 'match'])),
    caption: `Done. Array sorted to [${sorted.join(', ')}]; total inversions = ${invCount}. The merge step counts each cross-half inversion exactly once, in O(n) per level × O(log n) levels.`,
  });
  return frames;
}

function countingInversionsVariantFrames(variant = 'default') {
  if (variant === 'sorted') return countingInversionsFrames([1, 2, 3, 4, 5]);
  if (variant === 'reverse') return countingInversionsFrames([5, 4, 3, 2, 1]);
  return countingInversionsFrames([2, 4, 1, 5, 3]);
}

// LCA via binary lifting on a small tree. Depict ancestor chains as rows.
function lcaBinaryLiftingFrames(variant = 'default') {
  let parent, u, v;
  if (variant === 'chain') {
    parent = [-1, 0, 1, 2, 3, 4, 5];
    u = 5; v = 6;
  } else if (variant === 'siblings') {
    parent = [-1, 0, 0, 1, 1, 2, 2];
    u = 3; v = 4;
  } else {
    parent = [-1, 0, 0, 1, 1, 2, 3];
    u = 5; v = 6;
  }
  const n = parent.length;
  const depth = new Array(n).fill(0);
  for (let i = 1; i < n; i += 1) depth[i] = depth[parent[i]] + 1;
  const LOG = Math.max(1, Math.ceil(Math.log2(n)) + 1);
  const up = Array.from({ length: LOG }, () => new Array(n).fill(-1));
  for (let i = 0; i < n; i += 1) up[0][i] = parent[i];
  for (let k = 1; k < LOG; k += 1) {
    for (let i = 0; i < n; i += 1) {
      up[k][i] = up[k - 1][i] === -1 ? -1 : up[k - 1][up[k - 1][i]];
    }
  }

  const frames = [];
  const baseRow = () => Array.from({ length: n }, (_, i) => `n${i}(d${depth[i]})`);
  const push = (caption, hl = {}, override = null) => {
    frames.push({ array: override ?? baseRow(), highlights: hl, caption });
  };

  push(`Binary lifting LCA. Tree of ${n} nodes, parent[] = [${parent.join(', ')}]. Cells show node id and depth. Query: LCA(${u}, ${v}).`);
  push(`Preprocessing: up[k][v] = the 2^k-th ancestor of v. Build with up[k][v] = up[k-1][ up[k-1][v] ]. Time O(n log n), query O(log n).`);
  push(`Depths computed via a single DFS/BFS from root 0: [${depth.join(', ')}].`);

  // Show the up[] table for k=0..2 as captioned frames.
  for (let k = 0; k < Math.min(3, LOG); k += 1) {
    const row = up[k].map((p, i) => p === -1 ? `n${i}^${k}=·` : `n${i}^${k}=n${p}`);
    push(`up[${k}][v] = 2^${k} = ${1 << k}-ancestor. Row: [${row.join(', ')}]. Entries marked "·" mean "above the root".`, {}, row);
  }

  // Step 1: equalize depths.
  let a = u, b = v;
  push(`Query phase, step 1: lift the deeper of {u=${u}, v=${v}} until depths match. depth(${a})=${depth[a]}, depth(${b})=${depth[b]}.`, { [a]: 'mid', [b]: 'frontier' });

  if (depth[a] < depth[b]) { const t = a; a = b; b = t; }
  let diff = depth[a] - depth[b];
  push(`Take the deeper end as a=${a}. We need to lift a by diff=${diff}. Decompose diff in binary: ${diff.toString(2)}. For each set bit k, jump up[k][a].`, { [a]: 'mid', [b]: 'frontier' });

  for (let k = LOG - 1; k >= 0; k -= 1) {
    if ((diff >> k) & 1) {
      const prev = a;
      a = up[k][a];
      push(`Bit k=${k} set → lift a from n${prev} to up[${k}][n${prev}] = n${a}. depth(a)=${depth[a]}.`, { [a]: 'mid', [b]: 'frontier' });
    }
  }
  push(`Depths equalized: a=n${a} (d${depth[a]}), b=n${b} (d${depth[b]}).`, { [a]: 'mid', [b]: 'frontier' });

  if (a === b) {
    push(`Already equal — one node is an ancestor of the other. LCA(${u}, ${v}) = n${a}.`, { [a]: 'match' });
    return frames;
  }

  // Step 2: jump in parallel.
  push(`Step 2: jump a and b up in parallel by decreasing powers of 2, only when the target is NOT equal (we want to stop just below the LCA).`, { [a]: 'mid', [b]: 'frontier' });
  for (let k = LOG - 1; k >= 0; k -= 1) {
    if (up[k][a] !== -1 && up[k][a] !== up[k][b]) {
      const pa = a, pb = b;
      a = up[k][a];
      b = up[k][b];
      push(`k=${k}: up[${k}][n${pa}]=n${a}, up[${k}][n${pb}]=n${b}, different → safe to jump.`, { [a]: 'mid', [b]: 'frontier' });
    } else {
      push(`k=${k}: up[${k}][n${a}]=${up[k][a] === -1 ? '·' : 'n' + up[k][a]} equals up[${k}][n${b}]=${up[k][b] === -1 ? '·' : 'n' + up[k][b]} → would overshoot the LCA. Skip.`, { [a]: 'mid', [b]: 'frontier' });
    }
  }
  const lca = parent[a];
  push(`Both pointers now sit one step below the LCA. Answer = parent[a] = n${lca}. LCA(${u}, ${v}) = n${lca}. Total work: ${LOG} bits inspected ⇒ O(log n).`, { [lca]: 'match', [a]: 'visited', [b]: 'visited' });
  return frames;
}

// Mo's algorithm: sorted-query processing on an array.
function mosAlgorithmFrames(variant = 'default') {
  let arr, queries;
  if (variant === 'tight') {
    arr = [1, 1, 2, 2, 3, 3, 1, 2, 3, 1];
    queries = [[0, 3], [2, 5], [1, 9], [4, 8]];
  } else if (variant === 'sparse') {
    arr = [7, 7, 7, 7, 7, 7, 7, 7, 7, 7];
    queries = [[0, 2], [3, 9], [1, 5], [4, 7]];
  } else {
    arr = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
    queries = [[0, 4], [2, 7], [1, 9], [5, 8]];
  }
  const n = arr.length;
  const block = Math.max(1, Math.floor(Math.sqrt(n)));
  const indexed = queries.map(([l, r], idx) => ({ l, r, idx, blk: Math.floor(l / block) }));
  const sorted = indexed.slice().sort((x, y) => x.blk !== y.blk ? x.blk - y.blk : x.r - y.r);

  const frames = [];
  const freq = new Map();
  let distinct = 0;
  let curL = 0, curR = -1;

  const renderFreq = () => {
    const entries = [...freq.entries()].filter(([, c]) => c > 0).sort((a, b) => a[0] - b[0]);
    return entries.length ? entries.map(([k, c]) => `${k}:${c}`).join(', ') : '(empty)';
  };
  const buildHl = () => {
    const hl = {};
    for (let i = curL; i <= curR; i += 1) hl[i] = 'visited';
    if (curL >= 0 && curL < n) hl[curL] = 'low';
    if (curR >= 0 && curR < n) hl[curR] = 'high';
    return hl;
  };

  frames.push({
    array: arr.slice(),
    caption: `Mo's algorithm on arr = [${arr.join(', ')}]. We answer ${queries.length} range queries offline by reordering them so consecutive queries share most of their range. Block size √n ≈ ${block}.`,
  });
  frames.push({
    array: arr.slice(),
    caption: `Sort order: primary key = floor(l / ${block}) (block of left endpoint), secondary = r. Total pointer movement is O((n + q) √n).`,
  });
  frames.push({
    array: arr.slice(),
    caption: `Original queries: ${queries.map(([l, r], i) => `Q${i}=[${l},${r}]`).join(', ')}. Sorted order: ${sorted.map(q => `Q${q.idx}`).join(' → ')}.`,
  });
  frames.push({
    array: arr.slice(),
    caption: `Maintain a frequency map and a 'distinct' counter. add(x): freq[x]++; if it became 1, distinct++. remove(x): if freq[x]==1, distinct--; freq[x]--.`,
  });

  const add = (i) => {
    const x = arr[i];
    const c = (freq.get(x) || 0) + 1;
    freq.set(x, c);
    if (c === 1) distinct += 1;
  };
  const remove = (i) => {
    const x = arr[i];
    const c = freq.get(x) || 0;
    if (c === 1) distinct -= 1;
    freq.set(x, c - 1);
  };

  for (const q of sorted) {
    frames.push({
      array: arr.slice(),
      highlights: buildHl(),
      caption: `Process Q${q.idx} = [${q.l}, ${q.r}] (block ${q.blk}). Current pointers L=${curL}, R=${curR}. freq = {${renderFreq()}}, distinct=${distinct}.`,
    });
    while (curR < q.r) { curR += 1; add(curR); }
    while (curL > q.l) { curL -= 1; add(curL); }
    while (curR > q.r) { remove(curR); curR -= 1; }
    while (curL < q.l) { remove(curL); curL += 1; }
    frames.push({
      array: arr.slice(),
      highlights: buildHl(),
      caption: `Pointers moved to [${curL}, ${curR}]. freq = {${renderFreq()}}. Answer for Q${q.idx}: distinct = ${distinct}.`,
    });
  }

  frames.push({
    array: arr.slice(),
    caption: `Done. All ${queries.length} queries answered. Each pointer monotonic per block ⇒ O((n + q) √n) total ops; per-op work is O(1) for the freq map.`,
  });
  return frames;
}

// Lazy-propagation segment tree: range-add + range-sum on [1..8].
function segmentTreeLazyFrames(variant = 'default') {
  let arr, ops;
  if (variant === 'overlap') {
    arr = [1, 2, 3, 4, 5, 6, 7, 8];
    ops = [['update', 0, 3, 5], ['update', 2, 5, 7], ['query', 1, 6]];
  } else if (variant === 'point') {
    arr = [10, 20, 30, 40, 50, 60, 70, 80];
    ops = [['update', 3, 3, 100], ['query', 0, 7], ['query', 3, 3]];
  } else {
    arr = [1, 2, 3, 4, 5, 6, 7, 8];
    ops = [['update', 2, 5, 10], ['query', 0, 7]];
  }
  const n = arr.length;
  const size = 4 * n;
  const tree = new Array(size).fill(0);
  const lazy = new Array(size).fill(0);

  const build = (node, l, r) => {
    if (l === r) { tree[node] = arr[l]; return; }
    const m = (l + r) >> 1;
    build(node * 2, l, m);
    build(node * 2 + 1, m + 1, r);
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
  };
  build(1, 0, n - 1);

  // Reconstruct the leaf-visible array by querying each index without mutating lazy.
  const visibleArr = () => {
    const result = new Array(n).fill(0);
    const dfs = (node, l, r, carried) => {
      const eff = carried + lazy[node];
      if (l === r) { result[l] = arr[l] + eff; return; }
      const m = (l + r) >> 1;
      dfs(node * 2, l, m, eff);
      dfs(node * 2 + 1, m + 1, r, eff);
    };
    dfs(1, 0, n - 1, 0);
    return result;
  };

  const frames = [];
  const push = (caption, hl = {}) => {
    const display = visibleArr().map((v) => `${v}`);
    frames.push({ array: display, highlights: hl, caption });
  };

  push(`Lazy segment tree on arr=[${arr.join(', ')}]. Supports range-add + range-sum in O(log n). The 'lazy' tag at a node means "this pending add applies to my whole subtree but hasn't been pushed yet".`);
  push(`Why lazy: applying a range-add of +c over k indices would be O(k). Instead, mark covering nodes with a pending delta; push it down only when a later op needs to enter a child.`);
  push(`Three primitives: build (O(n)), pushDown (move lazy from a node to its kids, then clear), update/query (recurse with full-cover early-exit). Cells below show the current effective array.`);

  // Local mutating helpers that capture frames as they go.
  const pushDown = (node, l, r) => {
    if (lazy[node] !== 0) {
      const lc = node * 2, rc = node * 2 + 1;
      const m = (l + r) >> 1;
      tree[lc] += lazy[node] * (m - l + 1);
      lazy[lc] += lazy[node];
      tree[rc] += lazy[node] * (r - m);
      lazy[rc] += lazy[node];
      lazy[node] = 0;
    }
  };
  const update = (node, l, r, ql, qr, val, depth = 0) => {
    if (qr < l || r < ql) return;
    if (ql <= l && r <= qr) {
      tree[node] += val * (r - l + 1);
      lazy[node] += val;
      const hl = {};
      for (let i = l; i <= r; i += 1) hl[i] = 'match';
      push(`Update [${ql},${qr}] += ${val}: node fully covers [${l},${r}] → bump tree by ${val}×${r - l + 1} and tag lazy += ${val}. No recursion below.`, hl);
      return;
    }
    pushDown(node, l, r);
    const hl = {};
    for (let i = ql; i <= qr; i += 1) hl[i] = 'frontier';
    push(`Update [${ql},${qr}] += ${val}: node [${l},${r}] partially covered → pushDown lazy to children, then recurse on both sides.`, hl);
    const m = (l + r) >> 1;
    update(node * 2, l, m, ql, qr, val, depth + 1);
    update(node * 2 + 1, m + 1, r, ql, qr, val, depth + 1);
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
  };
  const query = (node, l, r, ql, qr) => {
    if (qr < l || r < ql) return 0;
    if (ql <= l && r <= qr) {
      const hl = {};
      for (let i = l; i <= r; i += 1) hl[i] = 'visited';
      push(`Query [${ql},${qr}]: node fully covers [${l},${r}] → return cached sum ${tree[node]}.`, hl);
      return tree[node];
    }
    pushDown(node, l, r);
    const hl = {};
    for (let i = ql; i <= qr; i += 1) hl[i] = 'mid';
    push(`Query [${ql},${qr}]: node [${l},${r}] partially covered → pushDown then recurse.`, hl);
    const m = (l + r) >> 1;
    return query(node * 2, l, m, ql, qr) + query(node * 2 + 1, m + 1, r, ql, qr);
  };

  for (const op of ops) {
    if (op[0] === 'update') {
      const [, ql, qr, val] = op;
      push(`Operation: update(${ql}, ${qr}, +${val}). Walk from root; each fully-covered node gets +${val}×width to its sum and +${val} to its lazy tag.`);
      update(1, 0, n - 1, ql, qr, val);
    } else {
      const [, ql, qr] = op;
      push(`Operation: query sum on [${ql}, ${qr}]. Walk from root; sum partial subranges, short-circuit on full cover.`);
      const ans = query(1, 0, n - 1, ql, qr);
      const hl = {};
      for (let i = ql; i <= qr; i += 1) hl[i] = 'match';
      push(`Result: sum[${ql}, ${qr}] = ${ans}. Notice the effective array reflects all pending updates even though lazy tags may still live in interior nodes.`, hl);
    }
  }

  push(`Done. With lazy propagation, both range-add and range-sum cost O(log n) per op — each touches O(log n) "canonical" nodes. Without lazy, range-add would degrade to O(n).`);
  return frames;
}

// Suffix array via prefix-doubling. Show sorted suffix order after each doubling round.
function suffixArrayFrames(input = 'banana') {
  const s = String(input ?? '');
  if (!s) return [{ array: [], caption: 'Empty string — no suffixes to sort.' }];
  const n = s.length;
  const suffixes = [];
  for (let i = 0; i < n; i += 1) suffixes.push(s.slice(i));

  const frames = [];

  frames.push({
    array: suffixes.map((suf, i) => `[${i}] ${suf}`),
    caption: `Suffix array of "${s}" (length ${n}). The suffix array SA stores the starting indices of the ${n} suffixes in lexicographic order. Direct sort costs O(n^2 log n); the prefix-doubling trick brings it down to O(n log^2 n).`,
  });
  frames.push({
    array: suffixes.map((suf, i) => `[${i}] ${suf}`),
    caption: `Idea: rank each suffix by its first k characters; double k each round (1, 2, 4, …). After ceil(log2 n) rounds every suffix has a unique rank — that's the final SA order.`,
  });
  frames.push({
    array: suffixes.map((suf, i) => `[${i}] ${suf}`),
    caption: `Why doubling works: after round k, rank[i] orders suffixes by their first k chars. The next round compares pair (rank[i], rank[i+k]) — equivalent to comparing 2k chars — using ranks already computed, so each comparison is O(1).`,
  });
  frames.push({
    array: suffixes.map((suf, i) => `[${i}] ${suf}`),
    caption: `Each row "[i] suffix r=rank" shows the suffix starting at index i alongside its current rank. The SA at termination is just the order of indices read top-to-bottom.`,
  });

  let rank = new Array(n);
  for (let i = 0; i < n; i += 1) rank[i] = s.charCodeAt(i);
  let sa = Array.from({ length: n }, (_, i) => i);
  sa.sort((a, b) => rank[a] - rank[b]);

  frames.push({
    array: sa.map(i => `[${i}] ${suffixes[i]} r=${rank[i]}`),
    caption: `Round k=1: rank each suffix by its first character. Initial ranks come from char codes. After sorting by rank: SA = [${sa.join(', ')}].`,
  });

  let k = 1;
  let round = 1;
  while (k < n) {
    const key = (i) => [rank[i], i + k < n ? rank[i + k] : -1];
    sa.sort((a, b) => {
      const ka = key(a), kb = key(b);
      return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1] - kb[1];
    });
    frames.push({
      array: sa.map(i => `[${i}] ${suffixes[i]} key=(${key(i)[0]},${key(i)[1] === -1 ? '∗' : key(i)[1]})`),
      caption: `Round ${round + 1} (compare 2k=${2 * k} chars): sort each suffix i by pair (rank[i], rank[i+k]). The '∗' marks suffixes that fall off the right end — treated as -∞.`,
    });

    const newRank = new Array(n);
    newRank[sa[0]] = 0;
    for (let i = 1; i < n; i += 1) {
      const a = sa[i - 1], b = sa[i];
      const ka = key(a), kb = key(b);
      newRank[b] = newRank[a] + (ka[0] === kb[0] && ka[1] === kb[1] ? 0 : 1);
    }
    rank = newRank;

    const distinct = new Set(rank).size;
    frames.push({
      array: sa.map(i => `[${i}] ${suffixes[i]} r=${rank[i]}`),
      highlights: Object.fromEntries(sa.map((_, idx) => [idx, distinct === n ? 'match' : 'visited'])),
      caption: `Re-rank from sorted order: equal pairs share a rank, otherwise rank increases by 1. Distinct ranks = ${distinct}/${n}.${distinct === n ? ' All unique — sorting complete.' : ' Continue doubling k.'}`,
    });
    if (distinct === n) break;
    k *= 2;
    round += 1;
  }

  frames.push({
    array: sa.map(i => `[${i}] ${suffixes[i]}`),
    highlights: Object.fromEntries(sa.map((_, idx) => [idx, 'match'])),
    caption: `Final SA = [${sa.join(', ')}]. Sorted suffixes of "${s}" read top-to-bottom in lexicographic order. Total cost O(n log^2 n) with O(n) space.`,
  });
  return frames;
}

function suffixArrayVariantFrames(variant = 'default') {
  if (variant === 'mississippi') return suffixArrayFrames('mississippi');
  if (variant === 'aaaaa') return suffixArrayFrames('aaaaa');
  return suffixArrayFrames('banana');
}

// Suffix automaton (SAM) construction by Ukkonen-style online algorithm.
// Each state stores: len, link (suffix link), trans (map char -> state id).
function suffixAutomatonFrames(variant = 'default') {
  let s;
  if (variant === 'abab') s = 'abab';
  else if (variant === 'aaaa') s = 'aaaa';
  else s = 'abcbc';

  const st = [{ len: 0, link: -1, trans: {} }];
  let last = 0;

  const frames = [];
  const renderStates = (highlightId, status = 'mid', cloneIds = []) => {
    const arr = st.map((node, id) => {
      const transStr = Object.keys(node.trans).length
        ? Object.entries(node.trans).map(([c, t]) => `${c}→s${t}`).join(',')
        : '∅';
      const linkStr = node.link === -1 ? 'root' : `s${node.link}`;
      return `s${id} len=${node.len} link=${linkStr} {${transStr}}`;
    });
    const hl = {};
    if (highlightId != null) hl[highlightId] = status;
    for (const cid of cloneIds) hl[cid] = 'frontier';
    return { array: arr, highlights: hl };
  };

  frames.push({
    array: ['s0 len=0 link=root {∅}'],
    caption: `Suffix automaton (SAM) for "${s}". A SAM is the smallest DFA that recognises every substring of the string as a distinct path from the initial state s0.`,
  });
  frames.push({
    array: ['s0 len=0 link=root {∅}'],
    caption: `Online construction extends the SAM one character at a time. Each new state cur represents the new longest suffix; suffix links point from a state to a shorter equivalence class containing it.`,
  });
  frames.push({
    array: ['s0 len=0 link=root {∅}'],
    caption: `Key operations per extension by char c: (1) walk suffix links from "last" inserting c→cur where missing; (2) if a transition c→q already exists with len(q)=len(p)+1, just link cur→q; (3) otherwise clone q to q' with len(p)+1, redirect the chain, and link cur→q'.`,
  });

  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    const cur = st.length;
    st.push({ len: st[last].len + 1, link: -1, trans: {} });
    let p = last;
    while (p !== -1 && st[p].trans[c] === undefined) {
      st[p].trans[c] = cur;
      p = st[p].link;
    }
    if (p === -1) {
      st[cur].link = 0;
      const snap = renderStates(cur);
      frames.push({ array: snap.array, highlights: snap.highlights, caption: `Extend by "${c}" (i=${i}): created cur=s${cur} with len=${st[cur].len}. Walked suffix links from s${last} to root adding "${c}"→s${cur}; no existing transition on "${c}" anywhere → link cur→root.` });
    } else {
      const q = st[p].trans[c];
      if (st[p].len + 1 === st[q].len) {
        st[cur].link = q;
        const snap = renderStates(cur);
        frames.push({ array: snap.array, highlights: snap.highlights, caption: `Extend by "${c}" (i=${i}): created cur=s${cur} with len=${st[cur].len}. Existing transition "${c}"→s${q} from s${p} is "contiguous" (len match) → link cur→s${q}, no clone needed.` });
      } else {
        const clone = st.length;
        st.push({ len: st[p].len + 1, link: st[q].link, trans: { ...st[q].trans } });
        const snapClone = renderStates(cur, 'mid', [clone]);
        frames.push({ array: snapClone.array, highlights: snapClone.highlights, caption: `Extend by "${c}" (i=${i}): split needed. Clone s${q} as s${clone} with len=${st[clone].len} (inheriting transitions + suffix link of s${q}).` });
        while (p !== -1 && st[p].trans[c] === q) {
          st[p].trans[c] = clone;
          p = st[p].link;
        }
        st[q].link = clone;
        st[cur].link = clone;
        const snapFinal = renderStates(cur, 'visited', [clone]);
        frames.push({ array: snapFinal.array, highlights: snapFinal.highlights, caption: `Redirect every chain p→s${q} on "${c}" to s${clone}, set link(s${q})→s${clone}, and link cur=s${cur}→s${clone}.` });
      }
    }
    last = cur;
  }

  const finalSnap = renderStates(null);
  frames.push({
    array: finalSnap.array,
    highlights: Object.fromEntries(st.map((_, idx) => [idx, 'match'])),
    caption: `Done. SAM for "${s}" has ${st.length} states (≤ 2|s|-1 = ${2 * s.length - 1}) and recognises every substring. Distinct substring count = sum over states of (len - len(link)) = ${st.reduce((sum, node, id) => sum + (id === 0 ? 0 : node.len - st[node.link].len), 0)}.`,
  });
  return frames;
}

// Hopcroft-Karp bipartite matching: alternate BFS to find layered structure, DFS to augment in parallel.
function hopcroftKarpFrames(variant = 'default') {
  let leftIds, rightIds, adj;
  if (variant === 'complete') {
    leftIds = [1, 2, 3, 4];
    rightIds = ['a', 'b', 'c', 'd'];
    adj = { 1: ['a', 'b', 'c', 'd'], 2: ['a', 'b', 'c', 'd'], 3: ['a', 'b', 'c', 'd'], 4: ['a', 'b', 'c', 'd'] };
  } else if (variant === 'noMatch') {
    leftIds = [1, 2, 3, 4];
    rightIds = ['a', 'b', 'c', 'd'];
    adj = { 1: ['a'], 2: ['a'], 3: ['a'], 4: ['a'] };
  } else {
    leftIds = [1, 2, 3, 4];
    rightIds = ['a', 'b', 'c', 'd'];
    adj = { 1: ['a', 'b'], 2: ['a'], 3: ['b', 'c'], 4: ['c', 'd'] };
  }

  const NIL = '∞';
  const INF = Number.POSITIVE_INFINITY;
  const pairU = Object.fromEntries(leftIds.map(u => [u, NIL]));
  const pairV = Object.fromEntries(rightIds.map(v => [v, NIL]));
  const dist = Object.fromEntries(leftIds.map(u => [u, INF]));

  const nodeIds = [...leftIds.map(u => `L${u}`), ...rightIds.map(v => `R${v}`)];
  const allEdges = [];
  for (const u of leftIds) for (const v of adj[u]) allEdges.push({ a: `L${u}`, b: `R${v}` });

  const snapshot = (caption, layerByLeft, augPath = []) => {
    const matchedKey = new Set();
    for (const u of leftIds) if (pairU[u] !== NIL) matchedKey.add(`L${u}|R${pairU[u]}`);
    const augKey = new Set(augPath.map(([a, b]) => `${a}|${b}`));
    const nodes = nodeIds.map(id => {
      let state;
      if (augPath.length && augPath.some(([a, b]) => a === id || b === id)) state = 'current';
      else if (id.startsWith('L')) {
        const u = id.slice(1);
        const uKey = Number(u);
        if (pairU[uKey] !== NIL) state = 'done';
        else if (layerByLeft && layerByLeft[uKey] !== undefined) state = 'visited';
      } else {
        const v = id.slice(1);
        if (pairV[v] !== NIL) state = 'done';
      }
      return { id, label: id, state };
    });
    const edges = allEdges.map(e => {
      const k = `${e.a}|${e.b}`;
      let state;
      if (augKey.has(k)) state = 'visited';
      else if (matchedKey.has(k)) state = 'tree';
      return { a: e.a, b: e.b, state };
    });
    return { nodes, edges, caption };
  };

  const frames = [];
  frames.push(snapshot(`Hopcroft-Karp on bipartite graph: L=${leftIds.join(', ')}, R=${rightIds.join(', ')}. Edges: ${allEdges.map(e => `${e.a}–${e.b}`).join(', ')}. Goal: maximum matching.`));
  frames.push(snapshot(`Each phase: (1) BFS from all unmatched left vertices using alternating edges to compute layer distances; (2) DFS multiple vertex-disjoint augmenting paths in those layers. Phases halt when no more augmenting paths exist.`));
  frames.push(snapshot(`Complexity O(E·sqrt(V)) — much faster than naive Hungarian/Kuhn for dense bipartite graphs.`));

  const bfs = () => {
    const queue = [];
    for (const u of leftIds) {
      if (pairU[u] === NIL) { dist[u] = 0; queue.push(u); }
      else dist[u] = INF;
    }
    let found = INF;
    while (queue.length) {
      const u = queue.shift();
      if (dist[u] < found) {
        for (const v of adj[u]) {
          const next = pairV[v];
          if (next === NIL) found = dist[u] + 1;
          else if (dist[next] === INF) { dist[next] = dist[u] + 1; queue.push(next); }
        }
      }
    }
    return found !== INF;
  };

  const dfs = (u, path) => {
    if (u === NIL) return true;
    for (const v of adj[u]) {
      const next = pairV[v];
      const ok = next === NIL ? true : dist[next] === dist[u] + 1;
      if (ok && dfs(next, [...path, [`L${u}`, `R${v}`]])) {
        pairV[v] = u; pairU[u] = v;
        path.push([`L${u}`, `R${v}`]);
        return true;
      }
    }
    dist[u] = INF;
    return false;
  };

  let phase = 0;
  while (bfs()) {
    phase += 1;
    const layerByLeft = {};
    for (const u of leftIds) if (dist[u] !== INF) layerByLeft[u] = dist[u];
    frames.push(snapshot(`Phase ${phase} BFS: unmatched left vertices = [${leftIds.filter(u => pairU[u] === NIL).join(', ')}] at layer 0. Reachable layers: ${Object.entries(layerByLeft).map(([u, d]) => `L${u}@${d}`).join(', ')}.`, layerByLeft));
    for (const u of leftIds) {
      if (pairU[u] === NIL) {
        const path = [];
        if (dfs(u, path)) {
          frames.push(snapshot(`Phase ${phase} DFS from L${u}: augmenting path ${path.map(([a, b]) => `${a}-${b}`).join(' ')}. Flip matched/unmatched edges along the path. New matching size = ${leftIds.filter(x => pairU[x] !== NIL).length}.`, layerByLeft, path));
        } else {
          frames.push(snapshot(`Phase ${phase} DFS from L${u}: no vertex-disjoint augmenting path in current layered DAG. Skip.`, layerByLeft));
        }
      }
    }
  }

  const finalSize = leftIds.filter(u => pairU[u] !== NIL).length;
  frames.push(snapshot(`Done after ${phase} phase${phase === 1 ? '' : 's'}. Maximum matching size = ${finalSize}. Pairs: ${leftIds.filter(u => pairU[u] !== NIL).map(u => `L${u}-R${pairU[u]}`).join(', ') || 'none'}.`));
  return frames;
}

// Radix (compressed) trie: insert words; show edge splits when a new word shares a prefix with an existing edge.
function radixTreeFrames(variant = 'default') {
  let words;
  if (variant === 'noSplits') words = ['cat', 'dog', 'fish', 'bird'];
  else if (variant === 'manySplits') words = ['team', 'tea', 'test', 'ten', 'tee', 'toast'];
  else words = ['romane', 'romanus', 'romulus', 'roman'];

  // Tree node: { id, children: Map<char, edge> }. Edge: { label, child, terminal }.
  let nextId = 0;
  const newNode = () => ({ id: nextId++, children: new Map() });
  const root = newNode();

  const flatten = () => {
    const rows = [];
    const walk = (node, prefix) => {
      const keys = [...node.children.keys()].sort();
      for (const k of keys) {
        const e = node.children.get(k);
        rows.push({ from: node.id, edge: e, fullPath: prefix + e.label });
        walk(e.child, prefix + e.label);
      }
    };
    walk(root, '');
    return rows;
  };

  const snapshot = (caption, highlightFullPaths = [], status = 'mid') => {
    const rows = flatten();
    if (!rows.length) return { array: ['(root only — no edges yet)'], caption };
    const arr = rows.map(r => `s${r.from} ──"${r.edge.label}"──▶ s${r.edge.child.id}${r.edge.terminal ? ' [word="' + r.fullPath + '"]' : ''}`);
    const hl = {};
    rows.forEach((r, i) => {
      if (highlightFullPaths.includes(r.fullPath)) hl[i] = status;
    });
    return { array: arr, highlights: hl, caption };
  };

  const lcp = (a, b) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    return i;
  };

  const frames = [];
  frames.push({ array: ['(root only — no edges yet)'], caption: `Radix tree (compact trie) inserts: [${words.map(w => `"${w}"`).join(', ')}]. Unlike a plain trie, each edge carries a string label, and chains with no branching get compressed into a single edge.` });
  frames.push({ array: ['(root only — no edges yet)'], caption: `Insert rule at node n with remaining word w: find child edge whose label starts with w[0]. Cases: (a) no such edge → add new edge with label=w, terminal. (b) edge label == w → mark terminal. (c) edge fully matches a prefix of w → recurse with the tail of w. (d) partial overlap → SPLIT the edge at the LCP, attach old child below the split, and either mark split node terminal (if w is consumed) or add a new edge for w's remainder.` });
  frames.push({ array: ['(root only — no edges yet)'], caption: `Storage = O(sum of distinct edge labels) ≤ O(total characters). Lookup of a word w costs O(|w|) regardless of dictionary size.` });
  frames.push({ array: ['(root only — no edges yet)'], caption: `Display: each row "sX ──'label'──▶ sY" is one edge from parent state sX to child state sY with the compressed label. "[word='…']" marks edges whose child completes a stored word.` });

  for (const w of words) {
    let node = root;
    let rem = w;
    const trace = [];
    while (true) {
      if (rem.length === 0) {
        const wasTerminal = trace.length && trace[trace.length - 1].edge.terminal;
        if (trace.length) trace[trace.length - 1].edge.terminal = true;
        const snap = snapshot(`Insert "${w}": word fully consumed at an existing internal node → mark that node terminal${wasTerminal ? ' (already terminal — duplicate)' : ''}.`, [w], 'match');
        frames.push(snap);
        break;
      }
      const headChar = rem[0];
      const e = node.children.get(headChar);
      if (!e) {
        const child = newNode();
        node.children.set(headChar, { label: rem, child, terminal: true });
        const snap = snapshot(`Insert "${w}": at s${node.id} no edge starts with "${headChar}" → add new edge "${rem}" → s${child.id} (terminal).`, [w], 'match');
        frames.push(snap);
        break;
      }
      const common = lcp(e.label, rem);
      if (common === e.label.length) {
        if (common === rem.length) {
          const wasTerminal = e.terminal;
          e.terminal = true;
          const snap = snapshot(`Insert "${w}": edge "${e.label}" matches w exactly → mark terminal${wasTerminal ? ' (already terminal)' : ''}.`, [w], 'match');
          frames.push(snap);
          break;
        }
        trace.push({ node, edge: e });
        node = e.child;
        rem = rem.slice(common);
        const snap = snapshot(`Insert "${w}": edge "${e.label}" fully matches a prefix of remaining → descend to s${node.id}, remaining = "${rem}".`, [w], 'visited');
        frames.push(snap);
      } else {
        // Split edge at index = common.
        const oldLabel = e.label;
        const oldChild = e.child;
        const oldTerminal = e.terminal;
        const splitNode = newNode();
        const headPrefix = oldLabel.slice(0, common);
        const oldTail = oldLabel.slice(common);
        e.label = headPrefix;
        e.child = splitNode;
        e.terminal = false;
        splitNode.children.set(oldTail[0], { label: oldTail, child: oldChild, terminal: oldTerminal });
        const newTail = rem.slice(common);
        if (newTail.length === 0) {
          // split node IS the terminal for w.
          // mark a synthetic terminal at split: represented by adding the "tail-less" condition on the inbound edge from parent.
          e.terminal = true;
          const snap = snapshot(`Insert "${w}": edge "${oldLabel}" overlaps "${rem}" by ${common} char(s) "${headPrefix}". SPLIT: edge becomes "${headPrefix}" → s${splitNode.id}, old tail "${oldTail}" hangs below. Word "${w}" is consumed exactly → mark inbound edge terminal.`, [w, w + oldTail.slice(0, 0)], 'match');
          frames.push(snap);
        } else {
          const newLeaf = newNode();
          splitNode.children.set(newTail[0], { label: newTail, child: newLeaf, terminal: true });
          const snap = snapshot(`Insert "${w}": edge "${oldLabel}" overlaps "${rem}" by ${common} char(s) "${headPrefix}". SPLIT: edge becomes "${headPrefix}" → s${splitNode.id}; old tail "${oldTail}" → s${oldChild.id}${oldTerminal ? ' (terminal)' : ''}; new tail "${newTail}" → s${newLeaf.id} (terminal).`, [w], 'match');
          frames.push(snap);
        }
        break;
      }
    }
  }

  const finalSnap = snapshot(`Done. Inserted ${words.length} word${words.length === 1 ? '' : 's'}. Total edges = ${flatten().length}. Compare with a plain character trie that would need one node per distinct (path, character) pair.`);
  const allRows = flatten();
  const finalHl = {};
  allRows.forEach((r, i) => { if (r.edge.terminal) finalHl[i] = 'match'; });
  frames.push({ array: finalSnap.array, highlights: finalHl, caption: finalSnap.caption });
  return frames;
}

// Matrix exponentiation: fib(n) via [[1,1],[1,0]]^n. Build M, M^2, M^4, ... then combine by binary expansion of n.
function matrixExpoFrames(input = 10) {
  let n = Number.isFinite(Number(input)) ? Math.trunc(Number(input)) : 10;
  if (n < 0) n = 0;
  if (n > 60) n = 60;

  const I = [[1, 0], [0, 1]];
  const M = [[1, 1], [1, 0]];
  const mul = (A, B) => [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
  const rowsOf = (label, A) => [
    `${label}: [${A[0][0]}, ${A[0][1]}]`,
    `${label}: [${A[1][0]}, ${A[1][1]}]`,
  ];

  const frames = [];
  const baseDisplay = [
    `M = [1, 1]`,
    `M = [1, 0]`,
    `n = ${n}`,
    `bits(n) = ${n.toString(2)}`,
  ];

  frames.push({
    array: baseDisplay,
    caption: `Matrix exponentiation computes fib(${n}) via the identity [[1,1],[1,0]]^k = [[F(k+1), F(k)],[F(k), F(k-1)]]. Raise M to the power n in O(log n) multiplications instead of O(n) additions.`,
  });
  frames.push({
    array: baseDisplay,
    caption: `Binary exponentiation: write n in binary = ${n.toString(2)}. We square M repeatedly to get M^1, M^2, M^4, ..., then multiply together the powers whose bit is 1.`,
  });
  frames.push({
    array: baseDisplay,
    caption: `Base identity I = [[1,0],[0,1]]. Result accumulator starts at I; each set bit of n folds the current power-of-2 matrix into the result.`,
  });

  const powers = [];
  let cur = M.map((r) => r.slice());
  let bit = 0;
  let nn = n;
  while (nn > 0) {
    powers.push({ exp: 1 << bit, mat: cur.map((r) => r.slice()), used: (nn & 1) === 1 });
    const used = (nn & 1) === 1;
    const display = [
      ...rowsOf(`M^${1 << bit}`, cur),
      `bit ${bit} of n = ${nn & 1}${used ? ' (FOLD)' : ' (skip)'}`,
    ];
    const hl = { 0: used ? 'match' : 'frontier', 1: used ? 'match' : 'frontier', 2: used ? 'match' : 'visited' };
    frames.push({
      array: display,
      highlights: hl,
      caption: `Square step ${bit}: M^${1 << bit} = [[${cur[0][0]}, ${cur[0][1]}], [${cur[1][0]}, ${cur[1][1]}]]. Bit ${bit} of n = ${nn & 1}; ${used ? 'fold this matrix into the running result.' : 'skip (bit is 0).'}`,
    });
    cur = mul(cur, cur);
    nn >>= 1;
    bit += 1;
  }

  let result = I.map((r) => r.slice());
  for (const { exp, mat, used } of powers) {
    if (!used) continue;
    const before = result.map((r) => r.slice());
    result = mul(result, mat);
    const display = [
      ...rowsOf(`R`, before),
      ...rowsOf(`× M^${exp}`, mat),
      ...rowsOf(`= R'`, result),
    ];
    const hl = { 4: 'match', 5: 'match' };
    frames.push({
      array: display,
      highlights: hl,
      caption: `Combine: result ← result × M^${exp}. New result = [[${result[0][0]}, ${result[0][1]}], [${result[1][0]}, ${result[1][1]}]]. Each fold uses 8 scalar multiplications.`,
    });
  }

  const fibN = n === 0 ? 0 : result[0][1];
  const finalDisplay = [
    ...rowsOf(`M^${n}`, result),
    `F(${n}) = ${fibN}`,
    `multiplications used = ${powers.length + powers.filter((p) => p.used).length}`,
  ];
  frames.push({
    array: finalDisplay,
    highlights: { 0: 'match', 1: 'match', 2: 'match' },
    caption: `Done. M^${n} = [[F(${n + 1}), F(${n})], [F(${n}), F(${n - 1})]] → F(${n}) = ${fibN}. Total work: ${powers.length} squarings + ${powers.filter((p) => p.used).length} fold(s) = O(log n) matrix multiplications.`,
  });
  return frames;
}

function matrixExpoVariantFrames(variant = 'default') {
  if (variant === 'eight') return matrixExpoFrames(8);
  if (variant === 'twelve') return matrixExpoFrames(12);
  return matrixExpoFrames(10);
}

// DSU on tree (small-to-large merging). 7-node tree, fixed colours. Walk light edges, then keep the heavy child's count map.
function dsuOnTreeFrames() {
  const colors = [1, 2, 1, 2, 3, 2, 1];
  const parent = [-1, 0, 0, 1, 1, 2, 2];
  const children = Array.from({ length: 7 }, () => []);
  for (let v = 1; v < 7; v += 1) children[parent[v]].push(v);

  const size = new Array(7).fill(1);
  const dfsSize = (u) => {
    for (const v of children[u]) {
      dfsSize(v);
      size[u] += size[v];
    }
  };
  dfsSize(0);
  const heavyChild = new Array(7).fill(-1);
  for (let u = 0; u < 7; u += 1) {
    let best = -1;
    for (const v of children[u]) {
      if (best === -1 || size[v] > size[best]) best = v;
    }
    heavyChild[u] = best;
  }

  const baseDisplay = Array.from({ length: 7 }, (_, i) => `n${i}|c=${colors[i]}|s=${size[i]}`);
  const labelCounts = (counts) => {
    const keys = Object.keys(counts).map(Number).sort((a, b) => a - b);
    if (!keys.length) return '{}';
    return `{${keys.map((k) => `${k}:${counts[k]}`).join(', ')}}`;
  };

  const frames = [];
  frames.push({
    array: baseDisplay,
    caption: `DSU on tree (small-to-large): 7 nodes with colours [${colors.join(', ')}]. Each row shows node id, colour c, and subtree size s. Goal: count distinct colours in every subtree without rebuilding maps from scratch.`,
  });
  frames.push({
    array: baseDisplay,
    caption: `Key trick: for each node u, recurse into every light child clearing its data after, then recurse into the heavy child (largest subtree) and KEEP its colour-count map. Finally re-add u and all light-subtree colours.`,
  });
  frames.push({
    array: baseDisplay,
    caption: `Heavy children (largest subtree size per parent): node 0 → ${heavyChild[0]}, node 1 → ${heavyChild[1]}, node 2 → ${heavyChild[2]}. Light edges (cleared after use): everything else.`,
  });

  const answer = new Array(7).fill(0);
  const liveCounts = new Array(7).fill(null);
  const dfs = (u, keep) => {
    for (const v of children[u]) {
      if (v === heavyChild[u]) continue;
      dfs(v, false);
    }
    if (heavyChild[u] !== -1) dfs(heavyChild[u], true);

    const counts = heavyChild[u] !== -1 ? (liveCounts[heavyChild[u]] || {}) : {};
    const hlPre = {};
    for (let i = 0; i < 7; i += 1) {
      if (i === u) hlPre[i] = 'current';
      else if (counts[colors[i]]) hlPre[i] = 'visited';
    }
    frames.push({
      array: baseDisplay,
      highlights: hlPre,
      caption: `Visit node ${u}. Heavy-child map carried up: counts = ${labelCounts(counts)}. About to add node ${u}'s colour and re-add every light-subtree node colour.`,
    });

    counts[colors[u]] = (counts[colors[u]] || 0) + 1;
    for (const v of children[u]) {
      if (v === heavyChild[u]) continue;
      const stack = [v];
      while (stack.length) {
        const x = stack.pop();
        counts[colors[x]] = (counts[colors[x]] || 0) + 1;
        for (const c of children[x]) stack.push(c);
      }
    }
    answer[u] = Object.keys(counts).length;
    liveCounts[u] = counts;

    const hlPost = {};
    for (let i = 0; i < 7; i += 1) {
      if (i === u) hlPost[i] = 'match';
      else if (counts[colors[i]]) hlPost[i] = 'mid';
    }
    frames.push({
      array: baseDisplay,
      highlights: hlPost,
      caption: `Node ${u} done. counts = ${labelCounts(counts)} → distinct colours in subtree(${u}) = ${answer[u]}. ${keep ? 'KEEP this map (heavy edge to parent).' : 'CLEAR after parent reads it (light edge).'}`,
    });

    if (!keep) {
      for (const k of Object.keys(counts)) delete counts[k];
      liveCounts[u] = null;
      frames.push({
        array: baseDisplay,
        caption: `Clear counts for light subtree rooted at ${u}. Total work bound: each node touched O(log n) times because every node lies on at most log₂ n light edges to the root.`,
      });
    }
  };

  dfs(0, true);

  frames.push({
    array: baseDisplay,
    highlights: Object.fromEntries(answer.map((_, i) => [i, 'match'])),
    caption: `Done. Distinct colour counts per subtree = [${answer.join(', ')}]. Total time O(n log n): each node contributes to the count map exactly once per light edge on its path to the root.`,
  });
  return frames;
}

function dsuOnTreeVariantFrames() {
  return dsuOnTreeFrames();
}

// 2-SAT via implication graph + Kosaraju SCC. Each clause (a∨b) adds (¬a → b) and (¬b → a).
function twoSatFrames(variant = 'default') {
  let clauses;
  let label;
  if (variant === 'sat') {
    clauses = [[1, 2], [-1, 3], [2, 3]];
    label = 'SAT example';
  } else if (variant === 'unsat') {
    clauses = [[1, 1], [-1, -1]];
    label = 'UNSAT: x ∧ ¬x';
  } else {
    clauses = [[1, 2], [-1, 3], [-2, -3]];
    label = '(a∨b) ∧ (¬a∨c) ∧ (¬b∨¬c)';
  }

  let nVars = 0;
  for (const [a, b] of clauses) {
    nVars = Math.max(nVars, Math.abs(a), Math.abs(b));
  }
  const N = nVars * 2;
  const idx = (lit) => (lit > 0 ? (lit - 1) * 2 : (-lit - 1) * 2 + 1);
  const litName = (v) => {
    const sign = v > 0 ? '' : '¬';
    const ch = String.fromCharCode(97 + Math.abs(v) - 1);
    return `${sign}${ch}`;
  };
  const nodeName = (i) => litName((i & 1) === 0 ? (i >> 1) + 1 : -((i >> 1) + 1));

  const adj = Array.from({ length: N }, () => []);
  const radj = Array.from({ length: N }, () => []);
  const addImpl = (u, v) => { adj[u].push(v); radj[v].push(u); };

  const frames = [];
  const baseDisplay = () => {
    const rows = [];
    for (let i = 0; i < N; i += 1) {
      rows.push(`${nodeName(i)} → {${adj[i].map(nodeName).join(', ')}}`);
    }
    return rows;
  };

  frames.push({
    array: baseDisplay(),
    caption: `2-SAT: ${label}. Build an implication graph on 2n nodes (one per literal: a, ¬a, b, ¬b, c, ¬c, ...). A clause (x∨y) is equivalent to (¬x → y) ∧ (¬y → x).`,
  });
  frames.push({
    array: baseDisplay(),
    caption: `Then run SCC (Kosaraju / Tarjan). The formula is satisfiable iff for every variable x, the literals x and ¬x lie in DIFFERENT SCCs. Assignment: x = true iff scc[x] comes AFTER scc[¬x] in reverse topological order.`,
  });
  frames.push({
    array: baseDisplay(),
    caption: `Empty implication graph. ${N} nodes, 0 edges. We add edges clause by clause.`,
  });

  for (const [a, b] of clauses) {
    addImpl(idx(-a), idx(b));
    addImpl(idx(-b), idx(a));
    const display = baseDisplay();
    const hl = { [idx(-a)]: 'mid', [idx(b)]: 'frontier', [idx(-b)]: 'mid', [idx(a)]: 'frontier' };
    frames.push({
      array: display,
      highlights: hl,
      caption: `Clause (${litName(a)} ∨ ${litName(b)}): add ${litName(-a)} → ${litName(b)} and ${litName(-b)} → ${litName(a)}. Both implications must hold for the clause to be satisfied.`,
    });
  }

  // Kosaraju SCC
  const order = [];
  const seen = new Array(N).fill(false);
  const dfs1 = (u) => {
    const stack = [[u, 0]];
    seen[u] = true;
    while (stack.length) {
      const top = stack[stack.length - 1];
      const [v, i] = top;
      if (i < adj[v].length) {
        top[1] += 1;
        const w = adj[v][i];
        if (!seen[w]) { seen[w] = true; stack.push([w, 0]); }
      } else {
        order.push(v);
        stack.pop();
      }
    }
  };
  for (let i = 0; i < N; i += 1) if (!seen[i]) dfs1(i);

  const comp = new Array(N).fill(-1);
  let cid = 0;
  const dfs2 = (u) => {
    const stack = [u];
    comp[u] = cid;
    while (stack.length) {
      const v = stack.pop();
      for (const w of radj[v]) {
        if (comp[w] === -1) { comp[w] = cid; stack.push(w); }
      }
    }
  };
  for (let k = order.length - 1; k >= 0; k -= 1) {
    if (comp[order[k]] === -1) { dfs2(order[k]); cid += 1; }
  }

  frames.push({
    array: baseDisplay().map((r, i) => `${r}  scc=${comp[i]}`),
    caption: `Kosaraju run complete. ${cid} strongly connected component(s) discovered. We now check the SAT condition variable by variable.`,
  });

  let satisfiable = true;
  const assignment = [];
  for (let v = 1; v <= nVars; v += 1) {
    const ptrue = idx(v);
    const pfalse = idx(-v);
    const ok = comp[ptrue] !== comp[pfalse];
    if (!ok) { satisfiable = false; assignment.push(`${litName(v)} = ⊥`); }
    else assignment.push(`${litName(v)} = ${comp[ptrue] > comp[pfalse] ? 'true' : 'false'}`);
    const hl = { [ptrue]: ok ? 'match' : 'high', [pfalse]: ok ? 'visited' : 'high' };
    frames.push({
      array: baseDisplay().map((r, i) => `${r}  scc=${comp[i]}`),
      highlights: hl,
      caption: `Variable ${litName(v)}: scc(${litName(v)}) = ${comp[ptrue]}, scc(${litName(-v)}) = ${comp[pfalse]}. ${ok ? 'Different components → consistent.' : 'Same component → contradiction. Formula is UNSAT.'}`,
    });
    if (!ok) break;
  }

  frames.push({
    array: baseDisplay().map((r, i) => `${r}  scc=${comp[i]}`),
    highlights: Object.fromEntries(Array.from({ length: N }, (_, i) => [i, satisfiable ? 'match' : 'high'])),
    caption: `Done. Formula is ${satisfiable ? 'SAT' : 'UNSAT'}. ${satisfiable ? `Assignment: ${assignment.join(', ')}.` : 'A variable and its negation share an SCC, so no truth assignment can satisfy all clauses.'} Total work O(n + m).`,
  });
  return frames;
}

// Gale–Shapley stable matching. 3 men, 3 women, hardcoded preferences. Men propose in round-robin.
function galeShapleyFrames(variant = 'default') {
  let menPrefs, womenPrefs, label;
  if (variant === 'aligned') {
    menPrefs = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    womenPrefs = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    label = 'Fully aligned';
  } else if (variant === 'misaligned') {
    menPrefs = [[0, 1, 2], [0, 1, 2], [0, 1, 2]];
    womenPrefs = [[2, 1, 0], [2, 1, 0], [2, 1, 0]];
    label = 'Fully misaligned';
  } else {
    menPrefs = [[0, 1, 2], [1, 0, 2], [0, 2, 1]];
    womenPrefs = [[1, 2, 0], [0, 2, 1], [2, 0, 1]];
    label = 'Default';
  }
  const n = 3;
  const manName = (i) => ['M0', 'M1', 'M2'][i];
  const womanName = (j) => ['W0', 'W1', 'W2'][j];

  const womanRank = womenPrefs.map((row) => {
    const r = new Array(n).fill(0);
    for (let k = 0; k < n; k += 1) r[row[k]] = k;
    return r;
  });
  const nextProposal = new Array(n).fill(0);
  const partner = new Array(n).fill(-1);
  const freeMen = [0, 1, 2];

  const display = () => [
    `${manName(0)} prefers ${menPrefs[0].map(womanName).join(' > ')}`,
    `${manName(1)} prefers ${menPrefs[1].map(womanName).join(' > ')}`,
    `${manName(2)} prefers ${menPrefs[2].map(womanName).join(' > ')}`,
    `${womanName(0)} prefers ${womenPrefs[0].map(manName).join(' > ')}`,
    `${womanName(1)} prefers ${womenPrefs[1].map(manName).join(' > ')}`,
    `${womanName(2)} prefers ${womenPrefs[2].map(manName).join(' > ')}`,
    `pairs: ${partner.map((m, w) => m === -1 ? `${womanName(w)}=·` : `${womanName(w)}=${manName(m)}`).join('  ')}`,
    `free men: [${freeMen.map(manName).join(', ')}]`,
  ];

  const frames = [];
  frames.push({
    array: display(),
    caption: `Gale–Shapley stable matching (${label}). ${n} men and ${n} women, each with a strict preference list. Men propose, women tentatively accept their best offer so far.`,
  });
  frames.push({
    array: display(),
    caption: `Algorithm: while any man is free and still has women left to propose to, he proposes to his next choice. She accepts if free or if he beats her current partner; otherwise she rejects.`,
  });
  frames.push({
    array: display(),
    caption: `Theorem: the algorithm terminates in at most n² rounds and produces a stable matching — no man-woman pair would both prefer each other to their current partners.`,
  });
  frames.push({
    array: display(),
    highlights: { 7: 'frontier' },
    caption: `Start. All women free, all men free. Free queue = [${freeMen.map(manName).join(', ')}]. Each man's nextProposal pointer starts at index 0 of his preference list.`,
  });

  let round = 0;
  while (freeMen.length && round < 50) {
    round += 1;
    const m = freeMen.shift();
    const w = menPrefs[m][nextProposal[m]];
    nextProposal[m] += 1;
    const curr = partner[w];
    if (curr === -1) {
      partner[w] = m;
      frames.push({
        array: display(),
        highlights: { 6: 'match' },
        caption: `Round ${round}: ${manName(m)} proposes to ${womanName(w)}. She is free → ACCEPT. Tentative pair ${womanName(w)} = ${manName(m)}.`,
      });
    } else if (womanRank[w][m] < womanRank[w][curr]) {
      partner[w] = m;
      freeMen.push(curr);
      frames.push({
        array: display(),
        highlights: { 6: 'match', 7: 'mid' },
        caption: `Round ${round}: ${manName(m)} proposes to ${womanName(w)}. She prefers ${manName(m)} (rank ${womanRank[w][m]}) over current ${manName(curr)} (rank ${womanRank[w][curr]}) → SWAP. ${manName(curr)} returns to free pool.`,
      });
    } else {
      freeMen.push(m);
      frames.push({
        array: display(),
        highlights: { 6: 'visited', 7: 'high' },
        caption: `Round ${round}: ${manName(m)} proposes to ${womanName(w)}. She prefers current ${manName(curr)} (rank ${womanRank[w][curr]}) over ${manName(m)} (rank ${womanRank[w][m]}) → REJECT. ${manName(m)} tries his next choice.`,
      });
    }
  }

  frames.push({
    array: display(),
    highlights: { 6: 'match' },
    caption: `Done in ${round} round${round === 1 ? '' : 's'}. Final stable matching: ${partner.map((mm, w) => `${womanName(w)}↔${manName(mm)}`).join(', ')}. Men-optimal, women-pessimal among all stable matchings.`,
  });
  return frames;
}

// 0-1 BFS: deque-based shortest path where edge weights are 0 or 1.
// Edges with weight 0 push to the FRONT of the deque, edges with weight 1 push to the BACK.
function zeroOneBfsFrames(variant = 'default') {
  let n, edges;
  if (variant === 'allOne') {
    n = 5;
    edges = [
      { a: 0, b: 1, w: 1 }, { a: 0, b: 2, w: 1 }, { a: 1, b: 2, w: 1 },
      { a: 1, b: 3, w: 1 }, { a: 2, b: 3, w: 1 }, { a: 3, b: 4, w: 1 },
    ];
  } else if (variant === 'allZero') {
    n = 5;
    edges = [
      { a: 0, b: 1, w: 0 }, { a: 0, b: 2, w: 0 }, { a: 1, b: 2, w: 0 },
      { a: 1, b: 3, w: 0 }, { a: 2, b: 3, w: 0 }, { a: 3, b: 4, w: 0 },
    ];
  } else {
    n = 5;
    edges = [
      { a: 0, b: 1, w: 0 }, { a: 0, b: 2, w: 1 }, { a: 1, b: 2, w: 0 },
      { a: 1, b: 3, w: 1 }, { a: 2, b: 3, w: 0 }, { a: 3, b: 4, w: 1 },
    ];
  }
  const source = 0;
  const adj = {};
  for (let i = 0; i < n; i += 1) adj[i] = [];
  for (const e of edges) {
    adj[e.a].push([e.b, e.w]);
    adj[e.b].push([e.a, e.w]);
  }
  const dist = Array.from({ length: n }, () => Infinity);
  dist[source] = 0;
  const deque = [source];
  const finalised = new Set();
  const relaxedEdgeKey = new Set();
  const treeEdgeKey = new Set();

  const labelOf = (id) => `${id}\nd=${dist[id] === Infinity ? '∞' : dist[id]}`;
  const dequeStr = () => deque.length ? `[front← ${deque.join(' ')} ←back]` : '[empty]';
  const snapshot = (currentId, edgeKey, caption) => {
    const ns = Array.from({ length: n }, (_, i) => ({
      id: i,
      label: labelOf(i),
      state: i === currentId ? 'current'
        : finalised.has(i) ? 'done'
        : dist[i] !== Infinity ? 'frontier'
        : undefined,
    }));
    const es = edges.map(e => {
      const k = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
      let state;
      if (edgeKey && edgeKey === k) state = 'visited';
      else if (treeEdgeKey.has(k)) state = 'tree';
      else if (relaxedEdgeKey.has(k)) state = 'visited';
      return { ...e, state };
    });
    return { nodes: ns, edges: es, caption };
  };

  const frames = [];
  frames.push(snapshot(source, null, `0-1 BFS on ${n}-node graph from source ${source}. Edges weighted 0 or 1: ${edges.map(e => `(${e.a}-${e.b}:${e.w})`).join(', ')}.`));
  frames.push(snapshot(source, null, `Key idea: replace Dijkstra's heap with a deque. A weight-0 edge keeps the same distance ⇒ push the neighbour to the FRONT (it should be processed before everything else already queued). A weight-1 edge increments the distance ⇒ push to the BACK like normal BFS.`));
  frames.push(snapshot(source, null, `Runs in O(V + E) instead of O((V+E) log V). Works only when all edge weights are in {0, 1}.`));
  frames.push(snapshot(source, null, `Initial state: dist[${source}] = 0, all others = ∞. Deque = ${dequeStr()}.`));

  while (deque.length) {
    const u = deque.shift();
    if (finalised.has(u)) {
      frames.push(snapshot(u, null, `Pop ${u} from front. Already finalised (a closer distance was settled earlier) → skip. Deque = ${dequeStr()}.`));
      continue;
    }
    finalised.add(u);
    frames.push(snapshot(u, null, `Pop ${u} from front. dist[${u}] = ${dist[u]} is final. Deque = ${dequeStr()}. Now relax neighbours.`));
    for (const [v, w] of adj[u]) {
      if (finalised.has(v)) continue;
      const cand = dist[u] + w;
      const edgeKey = `${Math.min(u, v)}-${Math.max(u, v)}`;
      if (cand < dist[v]) {
        const oldD = dist[v] === Infinity ? '∞' : dist[v];
        dist[v] = cand;
        relaxedEdgeKey.add(edgeKey);
        treeEdgeKey.add(edgeKey);
        if (w === 0) {
          deque.unshift(v);
          frames.push(snapshot(u, edgeKey, `Relax ${u}→${v} (w=0): dist[${v}] : ${oldD} → ${cand}. Same distance ⇒ push ${v} to FRONT. Deque = ${dequeStr()}.`));
        } else {
          deque.push(v);
          frames.push(snapshot(u, edgeKey, `Relax ${u}→${v} (w=1): dist[${v}] : ${oldD} → ${cand}. Larger distance ⇒ push ${v} to BACK. Deque = ${dequeStr()}.`));
        }
      } else {
        frames.push(snapshot(u, edgeKey, `Edge ${u}→${v} (w=${w}): dist[${u}]+w = ${cand} ≥ dist[${v}] = ${dist[v]} → no relax.`));
      }
    }
  }
  frames.push(snapshot(null, null, `Done. Final distances: [${dist.map(d => d === Infinity ? '∞' : d).join(', ')}]. Each vertex was popped at most twice ⇒ O(V + E).`));
  return frames;
}

// Heavy-Light Decomposition: label each tree edge heavy/light and group nodes into chains.
function heavyLightFrames(variant = 'default') {
  let n, parent;
  if (variant === 'chain') {
    n = 9;
    parent = [-1, 0, 1, 2, 3, 4, 5, 6, 7];
  } else if (variant === 'balanced') {
    n = 9;
    parent = [-1, 0, 0, 1, 1, 2, 2, 3, 5];
  } else {
    n = 9;
    parent = [-1, 0, 0, 1, 1, 2, 5, 5, 6];
  }
  const children = Array.from({ length: n }, () => []);
  for (let i = 1; i < n; i += 1) children[parent[i]].push(i);
  const size = new Array(n).fill(1);
  const order = [];
  const buildOrder = (u) => { order.push(u); for (const c of children[u]) buildOrder(c); };
  buildOrder(0);
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const u = order[i];
    for (const c of children[u]) size[u] += size[c];
  }
  const heavyChild = new Array(n).fill(-1);
  for (let u = 0; u < n; u += 1) {
    let best = -1, bestSz = 0;
    for (const c of children[u]) {
      if (size[c] > bestSz) { bestSz = size[c]; best = c; }
    }
    heavyChild[u] = best;
  }
  const chainHead = new Array(n).fill(-1);
  const chainId = new Array(n).fill(-1);
  let nextChain = 0;
  const assignChain = (u, head) => {
    chainHead[u] = head;
    if (chainId[head] === -1) { chainId[head] = nextChain; nextChain += 1; }
    chainId[u] = chainId[head];
  };

  const baseRow = () => Array.from({ length: n }, (_, i) => `n${i}(sz?)`);
  const sizeRow = () => Array.from({ length: n }, (_, i) => `n${i}(sz=${size[i]})`);
  const chainRow = () => Array.from({ length: n }, (_, i) => chainId[i] === -1 ? `n${i}(?)` : `n${i}(c${chainId[i]})`);
  const frames = [];
  frames.push({ array: baseRow(), caption: `Heavy-Light Decomposition on a ${n}-node tree, parent[] = [${parent.join(', ')}]. Goal: split the tree into vertex-disjoint chains so any root-to-leaf path crosses at most O(log n) chains.` });
  frames.push({ array: baseRow(), caption: `Definitions: for each non-leaf u, the HEAVY child is the child c with the largest subtree size (ties broken arbitrarily). All other children are LIGHT. The edge u→heavy(u) is a heavy edge; edges to light children are light edges.` });
  frames.push({ array: baseRow(), caption: `Why it works: every light edge halves the subtree size (light child's subtree ≤ size(parent)/2). So any leaf is at most log₂(n) ≈ ${Math.ceil(Math.log2(n))} light edges from the root.` });
  frames.push({ array: baseRow(), caption: `Step 1: post-order DFS to compute subtree sizes. size[u] = 1 + Σ size[c].` });

  for (const u of [...order].reverse()) {
    const childList = children[u];
    const detail = childList.length === 0 ? 'leaf, size=1' : `1 + ${childList.map(c => `size[n${c}]=${size[c]}`).join(' + ')} = ${size[u]}`;
    const hl = { [u]: 'mid' };
    for (const c of childList) hl[c] = 'visited';
    frames.push({ array: sizeRow(), highlights: hl, caption: `size[n${u}] = ${detail}.` });
  }

  frames.push({ array: sizeRow(), caption: `Step 2: pick the heavy child of each node = the child with the largest subtree. Edge to heavy child is HEAVY, others are LIGHT.` });
  for (let u = 0; u < n; u += 1) {
    if (children[u].length === 0) continue;
    const hl = { [u]: 'mid' };
    if (heavyChild[u] !== -1) hl[heavyChild[u]] = 'match';
    for (const c of children[u]) if (c !== heavyChild[u]) hl[c] = 'frontier';
    const desc = children[u].map(c => `n${c}(sz=${size[c]})${c === heavyChild[u] ? ' [HEAVY]' : ' [light]'}`).join(', ');
    frames.push({ array: sizeRow(), highlights: hl, caption: `n${u}: children = ${desc}. Heavy = ${heavyChild[u] === -1 ? 'none' : `n${heavyChild[u]}`}.` });
  }

  frames.push({ array: sizeRow(), caption: `Step 3: walk down assigning chain ids. Root starts chain 0; every heavy edge stays in the same chain; every light edge opens a NEW chain rooted at the child.` });
  const assignDFS = (u, head) => {
    assignChain(u, head);
    const hl = { [u]: 'match' };
    frames.push({ array: chainRow(), highlights: hl, caption: `Assign n${u} to chain c${chainId[u]} (head = n${head}).` });
    if (heavyChild[u] !== -1) assignDFS(heavyChild[u], head);
    for (const c of children[u]) if (c !== heavyChild[u]) assignDFS(c, c);
  };
  assignDFS(0, 0);

  const chainGroups = {};
  for (let i = 0; i < n; i += 1) (chainGroups[chainId[i]] ||= []).push(i);
  const chainSummary = Object.keys(chainGroups).sort((a, b) => Number(a) - Number(b)).map(cid => `c${cid}=[${chainGroups[cid].map(v => `n${v}`).join(', ')}]`).join('  ');
  const allMatch = Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'match']));
  frames.push({ array: chainRow(), highlights: allMatch, caption: `Done. ${nextChain} chains: ${chainSummary}. Any path-query is now a sum of ≤ ${Math.ceil(Math.log2(n)) + 1} chain segments — combine with a segment tree per chain (or one global Euler tour) for O(log² n) path ops.` });
  return frames;
}

// Interval tree point query: which intervals contain p?
function intervalTreeFrames(variant = 'default') {
  let intervals, p;
  if (variant === 'multi') {
    intervals = [[1, 4], [2, 6], [5, 8], [7, 10], [9, 12]];
    p = 6;
  } else if (variant === 'outside') {
    intervals = [[1, 4], [2, 6], [5, 8], [7, 10], [9, 12]];
    p = 0;
  } else {
    intervals = [[1, 4], [2, 6], [5, 8], [7, 10], [9, 12]];
    p = 3;
  }
  // Build a balanced interval tree by sorted centre points (median split).
  let nextId = 0;
  const build = (subset) => {
    if (!subset.length) return null;
    const mid = Math.floor(subset.length / 2);
    const sortedByStart = subset.slice().sort((x, y) => x[0] - y[0]);
    const centreIvl = sortedByStart[mid];
    const centre = (centreIvl[0] + centreIvl[1]) / 2;
    const leftSet = [], rightSet = [], hereSet = [];
    for (const iv of subset) {
      if (iv[1] < centre) leftSet.push(iv);
      else if (iv[0] > centre) rightSet.push(iv);
      else hereSet.push(iv);
    }
    const node = {
      id: nextId++,
      centre,
      hereByStart: hereSet.slice().sort((x, y) => x[0] - y[0]),
      hereByEnd: hereSet.slice().sort((x, y) => y[1] - x[1]),
      maxRight: Math.max(...hereSet.map(iv => iv[1])),
      left: null,
      right: null,
    };
    node.left = build(leftSet);
    node.right = build(rightSet);
    return node;
  };
  const root = build(intervals);

  const ivlStr = (iv) => `[${iv[0]},${iv[1]}]`;
  const flattenRows = () => {
    const rows = [];
    const walk = (node, depth) => {
      if (!node) return;
      walk(node.left, depth + 1);
      const list = node.hereByStart.map(ivlStr).join(' ');
      rows.push({ id: node.id, depth, label: `${'  '.repeat(depth)}s${node.id} centre=${node.centre} maxR=${node.maxRight} {${list}}` });
      walk(node.right, depth + 1);
    };
    walk(root, 0);
    return rows;
  };
  const rows = flattenRows();
  const arrFor = () => rows.map(r => r.label);

  const frames = [];
  const hits = [];
  const visitedIds = new Set();
  const currentId = { v: null };

  const snapshot = (caption, status = 'visited') => {
    const hl = {};
    rows.forEach((r, i) => {
      if (currentId.v === r.id) hl[i] = 'mid';
      else if (visitedIds.has(r.id)) hl[i] = status === 'match' && hits.some(([nid]) => nid === r.id) ? 'match' : 'visited';
    });
    return { array: arrFor(), highlights: hl, caption };
  };

  frames.push({ array: arrFor(), caption: `Interval tree built from intervals [${intervals.map(ivlStr).join(', ')}]. Point query: find all intervals containing p = ${p}.` });
  frames.push({ array: arrFor(), caption: `Each node stores: centre (median point), the intervals that straddle the centre (sorted by start AND by end for fast pruning), maxRight (right endpoint extent of subtree), and left/right children for intervals strictly left/right of the centre.` });
  frames.push({ array: arrFor(), caption: `Query rule at node n: (1) if p < min start in n's set, only the left child can contain p. (2) if p > maxRight of subtree, prune entirely. (3) otherwise sweep n's intervals (sorted by start) while start ≤ p; also recurse left if p < centre, right if p > centre.` });
  frames.push({ array: arrFor(), caption: `Complexity: build O(n log n); query O(log n + k) where k = number of matches.` });

  const walk = (node) => {
    if (!node) return;
    currentId.v = node.id;
    visitedIds.add(node.id);
    frames.push(snapshot(`Visit s${node.id} (centre=${node.centre}, maxRight=${node.maxRight}). Compare p=${p}.`));
    if (p > node.maxRight) {
      frames.push(snapshot(`p=${p} > maxRight=${node.maxRight} for s${node.id} ⇒ entire subtree pruned. Return.`));
      return;
    }
    if (p < node.centre) {
      // sweep hereByStart while start ≤ p
      for (const iv of node.hereByStart) {
        if (iv[0] > p) {
          frames.push(snapshot(`s${node.id}: interval ${ivlStr(iv)} has start ${iv[0]} > p=${p} → stop sweeping (sorted by start).`));
          break;
        }
        if (iv[1] >= p) {
          hits.push([node.id, iv]);
          frames.push(snapshot(`s${node.id}: ${ivlStr(iv)} contains p=${p} ✓ (start ${iv[0]} ≤ ${p} ≤ ${iv[1]}). Hits so far: [${hits.map(h => ivlStr(h[1])).join(', ')}].`, 'match'));
        }
      }
      frames.push(snapshot(`p=${p} < centre=${node.centre} ⇒ recurse LEFT (right subtree cannot contain p).`));
      walk(node.left);
    } else if (p > node.centre) {
      for (const iv of node.hereByEnd) {
        if (iv[1] < p) {
          frames.push(snapshot(`s${node.id}: interval ${ivlStr(iv)} has end ${iv[1]} < p=${p} → stop sweeping (sorted by end descending).`));
          break;
        }
        if (iv[0] <= p) {
          hits.push([node.id, iv]);
          frames.push(snapshot(`s${node.id}: ${ivlStr(iv)} contains p=${p} ✓ (start ${iv[0]} ≤ ${p} ≤ ${iv[1]}). Hits so far: [${hits.map(h => ivlStr(h[1])).join(', ')}].`, 'match'));
        }
      }
      frames.push(snapshot(`p=${p} > centre=${node.centre} ⇒ recurse RIGHT (left subtree cannot contain p).`));
      walk(node.right);
    } else {
      for (const iv of node.hereByStart) {
        hits.push([node.id, iv]);
        frames.push(snapshot(`s${node.id}: ${ivlStr(iv)} straddles the centre ⇒ contains p=${p} ✓.`, 'match'));
      }
      frames.push(snapshot(`p == centre — every interval at this node contains p. Both subtrees might still hold more matches; recurse both.`));
      walk(node.left);
      walk(node.right);
    }
  };
  walk(root);
  currentId.v = null;

  const summary = hits.length
    ? `Done. Intervals containing p=${p}: ${hits.map(h => ivlStr(h[1])).join(', ')}.`
    : `Done. No interval contains p=${p}.`;
  const finalHl = {};
  rows.forEach((r, i) => {
    if (hits.some(([nid]) => nid === r.id)) finalHl[i] = 'match';
    else if (visitedIds.has(r.id)) finalHl[i] = 'visited';
  });
  frames.push({ array: arrFor(), highlights: finalHl, caption: summary });
  return frames;
}

// Quickhull on a 2D point set: divide-and-conquer using the farthest point from a separating line.
function quickhullFrames(variant = 'default') {
  let points;
  if (variant === 'collinear') {
    points = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]];
  } else if (variant === 'square') {
    points = [[0, 0], [2, 0], [2, 2], [0, 2], [1, 1], [1, 0.5]];
  } else {
    points = [[0, 0], [1, 1], [2, 0], [2, 2], [0, 2], [1, 0.5]];
  }
  const ptStr = (p) => `(${p[0]},${p[1]})`;
  const labelOf = (idx) => `p${idx}${ptStr(points[idx])}`;
  const baseRow = () => points.map((_, i) => labelOf(i));
  // Cross product of (b - a) x (c - a). > 0 means c is to the LEFT of the directed line a→b.
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  // Perpendicular distance from c to line a→b (proportional — we only need to compare).
  const distLine = (a, b, c) => Math.abs(cross(a, b, c));

  const frames = [];
  const hull = new Set();
  const pushFrame = (caption, hl = {}) => frames.push({ array: baseRow(), highlights: hl, caption });

  pushFrame(`Quickhull on ${points.length} points: ${points.map(ptStr).join(', ')}. Goal: the convex hull in CCW order. Expected O(n log n), worst case O(n²) on adversarial inputs.`);
  pushFrame(`Step 1: find the leftmost point A and the rightmost point B. These two are guaranteed to be on the hull. Line AB splits the plane in two; recurse on each side independently.`);
  pushFrame(`Recursive step findHull(side, A, B): from the set of points on one side of line AB, pick C = the point farthest from AB (largest perpendicular distance). Triangle ACB carves the side into two sub-sides AC and CB. Points inside ACB are interior — discard them. Recurse on points still outside AC and outside CB.`);
  pushFrame(`Base case: zero points on a side ⇒ edge AB is a hull edge; emit it.`);

  // Find A (leftmost, ties by lowest y) and B (rightmost, ties by highest y).
  let A = 0, B = 0;
  for (let i = 1; i < points.length; i += 1) {
    if (points[i][0] < points[A][0] || (points[i][0] === points[A][0] && points[i][1] < points[A][1])) A = i;
    if (points[i][0] > points[B][0] || (points[i][0] === points[B][0] && points[i][1] > points[B][1])) B = i;
  }
  hull.add(A); hull.add(B);
  pushFrame(`Extremes found: A = ${labelOf(A)} (leftmost), B = ${labelOf(B)} (rightmost). Both added to the hull.`, { [A]: 'match', [B]: 'match' });

  // Partition rest.
  const above = [], below = [];
  for (let i = 0; i < points.length; i += 1) {
    if (i === A || i === B) continue;
    const c = cross(points[A], points[B], points[i]);
    if (c > 0) above.push(i);
    else if (c < 0) below.push(i);
  }
  const aboveHl = {};
  above.forEach(i => { aboveHl[i] = 'visited'; });
  below.forEach(i => { aboveHl[i] = 'frontier'; });
  aboveHl[A] = 'match'; aboveHl[B] = 'match';
  pushFrame(`Sign of cross(A, B, X) classifies X: > 0 ⇒ above AB, < 0 ⇒ below AB, == 0 ⇒ collinear (discard). Above (CCW side): {${above.map(labelOf).join(', ') || 'empty'}}. Below: {${below.map(labelOf).join(', ') || 'empty'}}.`, aboveHl);

  const findHull = (subset, a, b, side) => {
    if (!subset.length) {
      pushFrame(`findHull(${side}, ${labelOf(a)}, ${labelOf(b)}): no points on this side ⇒ ${labelOf(a)}→${labelOf(b)} is a hull edge.`, { [a]: 'match', [b]: 'match' });
      return;
    }
    let cIdx = subset[0];
    let bestDist = distLine(points[a], points[b], points[cIdx]);
    for (const idx of subset) {
      const d = distLine(points[a], points[b], points[idx]);
      if (d > bestDist) { bestDist = d; cIdx = idx; }
    }
    hull.add(cIdx);
    const hl1 = { [a]: 'match', [b]: 'match', [cIdx]: 'mid' };
    for (const idx of subset) if (idx !== cIdx) hl1[idx] = 'visited';
    pushFrame(`findHull(${side}, ${labelOf(a)}, ${labelOf(b)}) over {${subset.map(labelOf).join(', ')}}: farthest from line is ${labelOf(cIdx)} (dist∝${bestDist}). Add ${labelOf(cIdx)} to hull.`, hl1);

    const leftOfAC = [], leftOfCB = [];
    for (const idx of subset) {
      if (idx === cIdx) continue;
      const sAC = cross(points[a], points[cIdx], points[idx]);
      const sCB = cross(points[cIdx], points[b], points[idx]);
      const want = side === 'upper' ? (x) => x > 0 : (x) => x < 0;
      if (want(sAC)) leftOfAC.push(idx);
      else if (want(sCB)) leftOfCB.push(idx);
      // Otherwise idx is inside triangle a-cIdx-b ⇒ discarded.
    }
    const hl2 = { [a]: 'match', [b]: 'match', [cIdx]: 'match' };
    for (const idx of subset) {
      if (idx === cIdx) continue;
      if (leftOfAC.includes(idx) || leftOfCB.includes(idx)) hl2[idx] = 'frontier';
      else hl2[idx] = 'low';
    }
    pushFrame(`Triangle ${labelOf(a)}-${labelOf(cIdx)}-${labelOf(b)} splits the side. Outside ${labelOf(a)}${labelOf(cIdx)}: {${leftOfAC.map(labelOf).join(', ') || 'empty'}}. Outside ${labelOf(cIdx)}${labelOf(b)}: {${leftOfCB.map(labelOf).join(', ') || 'empty'}}. Inside triangle ⇒ discarded.`, hl2);

    findHull(leftOfAC, a, cIdx, side);
    findHull(leftOfCB, cIdx, b, side);
  };

  findHull(above, A, B, 'upper');
  findHull(below, B, A, 'lower');

  const hullIds = [...hull].sort((x, y) => x - y);
  const finalHl = {};
  for (const idx of hullIds) finalHl[idx] = 'match';
  for (let i = 0; i < points.length; i += 1) if (!hull.has(i)) finalHl[i] = 'low';
  pushFrame(`Done. Convex hull vertices = {${hullIds.map(labelOf).join(', ')}}. Discarded (interior or collinear) points are dimmed.`, finalHl);
  return frames;
}

// Disjoint Set Union with union-by-rank + path compression. Sequence of 6 ops on 6 elements.
function disjointSetRankFrames(variant = 'default') {
  let n, ops, label;
  if (variant === 'disjoint') {
    n = 6;
    ops = [['find', 0], ['find', 1], ['find', 2], ['find', 3], ['find', 4], ['find', 5]];
    label = '3 disjoint (no unions applied)';
  } else if (variant === 'chain') {
    n = 6;
    ops = [['union', 0, 1], ['union', 1, 2], ['union', 2, 3], ['union', 3, 4], ['union', 4, 5], ['find', 0]];
    label = 'Fully connected via chain unions';
  } else {
    n = 6;
    ops = [['union', 0, 1], ['union', 2, 3], ['union', 4, 5], ['union', 1, 2], ['find', 3], ['union', 0, 4]];
    label = 'Default sequence';
  }

  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const findRoot = (x) => { while (parent[x] !== x) x = parent[x]; return x; };
  const findCompress = (x) => {
    const root = findRoot(x);
    let cur = x;
    while (parent[cur] !== root) { const next = parent[cur]; parent[cur] = root; cur = next; }
    return root;
  };

  const parentRow = () => Array.from({ length: n }, (_, i) => `i${i}:p=${parent[i]}`);
  const rankRow = () => Array.from({ length: n }, (_, i) => `i${i}:r=${rank[i]}`);
  const display = () => [`parent  ${parentRow().join('  ')}`, `rank    ${rankRow().join('  ')}`];

  const frames = [];
  frames.push({ array: display(), caption: `Disjoint Set (Union-Find) with union-by-rank + path compression. ${n} singleton elements. Variant: ${label}.` });
  frames.push({ array: display(), caption: `parent[i] points to i's parent (i itself if i is a root). rank[i] is an upper bound on tree height; only roots' ranks matter.` });
  frames.push({ array: display(), caption: `union(a, b): find roots ra, rb. If ra == rb already merged. Else attach the LOWER-rank root under the HIGHER-rank one; if ranks tie, attach either way and increment the chosen root's rank by 1.` });
  frames.push({ array: display(), caption: `find(x): walk parent pointers to the root, then path-compress by repointing every node on the path directly to the root. Amortised cost: O(α(n)) — inverse Ackermann.` });

  ops.forEach((op, idx) => {
    if (op[0] === 'union') {
      const a = op[1], b = op[2];
      const ra = findRoot(a);
      const rb = findRoot(b);
      if (ra === rb) {
        const hl = { [a]: 'visited', [b]: 'visited', [ra]: 'mid' };
        frames.push({ array: display(), highlights: hl, caption: `op${idx + 1}: union(${a}, ${b}). Both already share root ${ra}. No change.` });
        return;
      }
      let merged;
      if (rank[ra] < rank[rb]) { parent[ra] = rb; merged = rb; }
      else if (rank[ra] > rank[rb]) { parent[rb] = ra; merged = ra; }
      else { parent[rb] = ra; rank[ra] += 1; merged = ra; }
      const hl = { [a]: 'frontier', [b]: 'frontier', [ra]: 'mid', [rb]: 'mid', [merged]: 'match' };
      frames.push({ array: display(), highlights: hl, caption: `op${idx + 1}: union(${a}, ${b}). roots ra=${ra} (rank ${rank[ra] - (merged === ra && rank[ra] !== rank[rb] && ra !== rb ? 0 : 0)}), rb=${rb}. Attach under rank-winner ${merged}.` });
    } else {
      const x = op[1];
      const beforeParent = parent.slice();
      const root = findCompress(x);
      const changed = {};
      for (let i = 0; i < n; i += 1) if (parent[i] !== beforeParent[i]) changed[i] = 'match';
      changed[x] = 'mid';
      changed[root] = 'frontier';
      frames.push({ array: display(), highlights: changed, caption: `op${idx + 1}: find(${x}) = ${root}. Path compression repoints every visited node directly to the root, flattening future lookups.` });
    }
  });

  const groups = {};
  for (let i = 0; i < n; i += 1) {
    const r = findRoot(i);
    (groups[r] ||= []).push(i);
  }
  const summary = Object.keys(groups).sort((a, b) => Number(a) - Number(b)).map(r => `{${groups[r].join(',')}}`).join(' ');
  frames.push({ array: display(), caption: `Done. Connected components: ${summary}. Total cost for m ops ≈ O(m · α(n)); for any practical n, α(n) ≤ 4.` });
  return frames;
}

// Chinese Remainder Theorem: solve x ≡ a_i (mod m_i) for pairwise-coprime m_i via successive substitution.
function chineseRemainderFrames(variant = 'default') {
  let pairs, label;
  if (variant === 'two') {
    pairs = [[1, 4], [2, 9]];
    label = 'Two congruences (mods 4, 9)';
  } else if (variant === 'classic') {
    pairs = [[2, 3], [3, 5], [2, 7]];
    label = 'Classic Sun Tzu problem';
  } else {
    pairs = [[2, 3], [3, 5], [2, 7]];
    label = 'Default — x ≡ 2 (mod 3), 3 (mod 5), 2 (mod 7)';
  }

  const egcd = (a, b) => {
    if (b === 0) return [a, 1, 0];
    const [g, x1, y1] = egcd(b, a % b);
    return [g, y1, x1 - Math.floor(a / b) * y1];
  };
  const modInv = (a, m) => {
    const [, x] = egcd(((a % m) + m) % m, m);
    return ((x % m) + m) % m;
  };

  const baseRows = () => pairs.map(([a, m], i) => `eq${i}:  x ≡ ${a} (mod ${m})`);

  const frames = [];
  frames.push({ array: baseRows(), caption: `Chinese Remainder Theorem (${label}). Given pairwise-coprime moduli m_1,…,m_k, the system x ≡ a_i (mod m_i) has a UNIQUE solution modulo M = ∏ m_i.` });
  frames.push({ array: baseRows(), caption: `Strategy: solve two at a time. From x ≡ a₁ (mod m₁) and x ≡ a₂ (mod m₂), write x = a₁ + m₁·t; then a₁ + m₁·t ≡ a₂ (mod m₂) ⇒ t ≡ (a₂ − a₁) · m₁⁻¹ (mod m₂). The merged equation has modulus m₁·m₂.` });
  frames.push({ array: baseRows(), caption: `Tools needed: extended Euclidean for modular inverse m₁⁻¹ (mod m₂). Since gcd(m₁, m₂) = 1, the inverse exists.` });

  let curA = pairs[0][0];
  let curM = pairs[0][1];
  const trace = [`merged₀: x ≡ ${curA} (mod ${curM})`];
  frames.push({
    array: [...baseRows(), '', ...trace],
    highlights: { 0: 'mid' },
    caption: `Step 1: start with the first congruence — merged = x ≡ ${curA} (mod ${curM}).`,
  });

  for (let i = 1; i < pairs.length; i += 1) {
    const [ai, mi] = pairs[i];
    const inv = modInv(curM, mi);
    const diff = ((ai - curA) % mi + mi) % mi;
    const tRaw = (diff * inv) % mi;
    const newA = curA + curM * tRaw;
    const newM = curM * mi;
    frames.push({
      array: [...baseRows(), '', ...trace],
      highlights: { [i]: 'frontier' },
      caption: `Step ${i + 1}: merge with eq${i} (x ≡ ${ai} mod ${mi}). Need t with curA + curM·t ≡ ai (mod ${mi}) ⇒ t ≡ (${ai} − ${curA}) · ${curM}⁻¹ (mod ${mi}).`,
    });
    frames.push({
      array: [...baseRows(), '', ...trace, `  inv: ${curM}⁻¹ ≡ ${inv} (mod ${mi})`, `  diff: (${ai} − ${curA}) mod ${mi} = ${diff}`, `  t = ${diff}·${inv} mod ${mi} = ${tRaw}`],
      highlights: { [i]: 'mid' },
      caption: `Compute: ${curM}⁻¹ (mod ${mi}) = ${inv}. Then t = ${diff} · ${inv} mod ${mi} = ${tRaw}.`,
    });
    curA = ((newA % newM) + newM) % newM;
    curM = newM;
    trace.push(`merged${i}: x ≡ ${curA} (mod ${curM})`);
    frames.push({
      array: [...baseRows(), '', ...trace],
      highlights: { [i]: 'match' },
      caption: `Merged: x = ${curA - curM * tRaw} + ${pairs.slice(0, i).map(p => p[1]).reduce((a, b) => a * b, 1)}·${tRaw} = ${curA}. New modulus M = ${curM}.`,
    });
  }

  const verify = pairs.map(([a, m]) => `${curA} mod ${m} = ${curA % m} (want ${a}) ${curA % m === a ? 'OK' : 'FAIL'}`);
  frames.push({
    array: [...baseRows(), '', ...trace, '', ...verify],
    highlights: Object.fromEntries(pairs.map((_, i) => [i, 'match'])),
    caption: `Done. Unique solution x ≡ ${curA} (mod ${curM}). Verification: every original congruence holds. Cost O(k log M) per inverse via extended Euclid.`,
  });
  return frames;
}

// Amortised analysis: dynamic array push with doubling, tracked via the "bank balance" / accounting method.
function amortizedAnalysisFrames(variant = 'default') {
  let nPushes, initialCapacity, chargePerPush, label;
  if (variant === 'noResize') {
    nPushes = 8;
    initialCapacity = 16;
    chargePerPush = 3;
    label = 'No resizes (capacity already 16)';
  } else if (variant === 'manyResize') {
    nPushes = 16;
    initialCapacity = 1;
    chargePerPush = 3;
    label = 'Many resizes (start at capacity 1)';
  } else {
    nPushes = 12;
    initialCapacity = 1;
    chargePerPush = 3;
    label = 'Default: 12 pushes, start at capacity 1';
  }

  let size = 0;
  let capacity = initialCapacity;
  let bank = 0;
  let realTotal = 0;
  let chargedTotal = 0;

  const display = () => [
    `size=${size}  capacity=${capacity}  bank=${bank}`,
    `realCostTotal=${realTotal}  chargedTotal=${chargedTotal}`,
    `amortised so far = ${size === 0 ? '·' : (chargedTotal / Math.max(size, 1)).toFixed(2)} per push`,
  ];

  const frames = [];
  frames.push({ array: display(), caption: `Amortised analysis (${label}). We push ${nPushes} items into a dynamic array. Real cost of one push is 1 (write) — unless the array is full, in which case we allocate a new array of size 2·capacity and copy all current items (cost = size + 1).` });
  frames.push({ array: display(), caption: `Goal: show amortised cost per push is O(1). Accounting method: CHARGE every push ${chargePerPush} units. 1 unit pays for the immediate write; the other ${chargePerPush - 1} go into a "bank". When a resize happens, the bank pays for copying the existing items.` });
  frames.push({ array: display(), caption: `Invariant: after push i in a block of capacity c, the bank holds ≥ 2 · (size − c/2) units. So when size reaches c (resize triggered), the bank has ≥ c units — exactly enough to pay for the c copies.` });
  frames.push({ array: display(), caption: `Begin pushing. Watch the bank grow on non-resize pushes and drain on resizes.` });

  for (let i = 1; i <= nPushes; i += 1) {
    let realCost;
    let resized = false;
    if (size === capacity) {
      const copyCost = size;
      capacity *= 2;
      bank -= copyCost;
      realCost = copyCost + 1;
      resized = true;
    } else {
      realCost = 1;
    }
    size += 1;
    realTotal += realCost;
    bank += chargePerPush - 1;
    chargedTotal += chargePerPush;
    const hl = resized ? { 0: 'high', 1: 'high' } : { 0: 'visited' };
    frames.push({
      array: display(),
      highlights: hl,
      caption: `push #${i}: ${resized ? `RESIZE — capacity doubles to ${capacity}, copy ${realCost - 1} items (bank pays ${realCost - 1}). ` : ''}real cost = ${realCost}. Charge ${chargePerPush}; 1 unit pays the write, ${chargePerPush - 1} go into the bank.`,
    });
  }

  frames.push({
    array: display(),
    highlights: { 0: 'match', 1: 'match', 2: 'match' },
    caption: `Done. Across ${nPushes} pushes: realTotal = ${realTotal}, chargedTotal = ${chargedTotal}, bank = ${bank} ≥ 0. Since charged ≥ real always, amortised cost per push ≤ ${chargePerPush} = O(1).`,
  });
  return frames;
}

// FFT-basics: multiply two polynomials by zero-padding, conceptually transforming to point-value form, pointwise multiplying, inverse-transforming.
function fftBasicsFrames(variant = 'default') {
  let A, B, label;
  if (variant === 'longer') {
    A = [1, 2, 3];
    B = [4, 5, 6];
    label = '(1+2x+3x²) · (4+5x+6x²)';
  } else if (variant === 'unit') {
    A = [1, 0, 0, 0];
    B = [1, 2, 3, 4];
    label = '1 · (1+2x+3x²+4x³) — identity';
  } else {
    A = [1, 2];
    B = [1, 3];
    label = 'Default: (1 + 2x) · (1 + 3x)';
  }

  const polyStr = (P) => P.map((c, i) => `${c}${i === 0 ? '' : i === 1 ? 'x' : `x^${i}`}`).join(' + ');
  const resultLen = A.length + B.length - 1;
  let n = 1;
  while (n < resultLen) n *= 2;
  const Apad = [...A, ...new Array(n - A.length).fill(0)];
  const Bpad = [...B, ...new Array(n - B.length).fill(0)];

  const baseRows = (extra = []) => [
    `A = [${Apad.join(', ')}]   represents ${polyStr(A)}`,
    `B = [${Bpad.join(', ')}]   represents ${polyStr(B)}`,
    ...extra,
  ];

  const frames = [];
  frames.push({ array: baseRows(), caption: `FFT for polynomial multiplication: ${label}. Naive convolution is O(n²); FFT reduces it to O(n log n) by evaluating each polynomial at n complex roots of unity, multiplying point-wise, and interpolating back.` });
  frames.push({ array: baseRows(), caption: `Step 1: zero-pad both polynomials to length n = ${n} (next power of two ≥ deg(A) + deg(B) + 1 = ${resultLen}). This ensures the cyclic convolution from FFT equals the linear convolution we want.` });
  frames.push({ array: baseRows(), caption: `Step 2: evaluate A and B at the n-th roots of unity ω_n^k = e^{2πik/n}, k = 0,…,n−1. Call the resulting arrays Â and B̂. This is the FORWARD FFT; it runs in O(n log n) via Cooley–Tukey divide-and-conquer.` });

  const evalAt = (P, w) => {
    let real = 0, imag = 0;
    for (let i = 0; i < P.length; i += 1) {
      const ang = w * i;
      real += P[i] * Math.cos(ang);
      imag += P[i] * Math.sin(ang);
    }
    return [real, imag];
  };
  const fmt = (r, im) => {
    const rs = Math.abs(r) < 1e-10 ? 0 : Number(r.toFixed(2));
    const is = Math.abs(im) < 1e-10 ? 0 : Number(im.toFixed(2));
    return `${rs}${is >= 0 ? '+' : ''}${is}i`;
  };

  const Ahat = [];
  const Bhat = [];
  for (let k = 0; k < n; k += 1) {
    const w = 2 * Math.PI * k / n;
    Ahat.push(evalAt(Apad, w));
    Bhat.push(evalAt(Bpad, w));
  }
  const ahatRow = `Â = [${Ahat.map(([r, i]) => fmt(r, i)).join(', ')}]`;
  const bhatRow = `B̂ = [${Bhat.map(([r, i]) => fmt(r, i)).join(', ')}]`;
  frames.push({
    array: baseRows([ahatRow, bhatRow]),
    highlights: { 2: 'mid', 3: 'mid' },
    caption: `After forward FFT (conceptually): each polynomial now lives in point-value form. Â[k] = A(ω_n^k), B̂[k] = B(ω_n^k). n values uniquely determine a polynomial of degree < n.`,
  });

  const Chat = [];
  for (let k = 0; k < n; k += 1) {
    const [ar, ai] = Ahat[k];
    const [br, bi] = Bhat[k];
    Chat.push([ar * br - ai * bi, ar * bi + ai * br]);
  }
  const chatRow = `Ĉ = Â · B̂ = [${Chat.map(([r, i]) => fmt(r, i)).join(', ')}]`;
  frames.push({
    array: baseRows([ahatRow, bhatRow, chatRow]),
    highlights: { 4: 'match' },
    caption: `Step 3: pointwise multiply — Ĉ[k] = Â[k] · B̂[k]. This is O(n) complex multiplies. In point-value form, multiplication of polynomials is just coordinate-wise multiplication of evaluations.`,
  });

  const C = new Array(n).fill(0);
  for (let i = 0; i < n; i += 1) {
    let real = 0;
    for (let k = 0; k < n; k += 1) {
      const ang = -2 * Math.PI * k * i / n;
      const [cr, ci] = Chat[k];
      real += cr * Math.cos(ang) - ci * Math.sin(ang);
    }
    C[i] = Math.round(real / n);
  }
  const cRow = `C = ifft(Ĉ) = [${C.join(', ')}]`;
  frames.push({
    array: baseRows([ahatRow, bhatRow, chatRow, cRow]),
    highlights: { 5: 'match' },
    caption: `Step 4: INVERSE FFT brings Ĉ back to coefficient form. It is the same algorithm as forward FFT, but using ω_n^{−k} instead of ω_n^k, with a final division by n. Result C = [${C.join(', ')}].`,
  });

  const naive = new Array(resultLen).fill(0);
  for (let i = 0; i < A.length; i += 1) for (let j = 0; j < B.length; j += 1) naive[i + j] += A[i] * B[j];
  frames.push({
    array: baseRows([ahatRow, bhatRow, chatRow, cRow, `naive verify: [${naive.join(', ')}]`]),
    highlights: { 5: 'match', 6: 'visited' },
    caption: `Verify against direct convolution (i+j sum): both match. Total FFT cost: 2 forward + 1 inverse + n pointwise mults = O(n log n) vs O(n²) for the naive approach.`,
  });
  return frames;
}

// Segment Tree Beats: chmin range update on [5,3,7,2,4] + range-sum, tracking max1/max2/cntMax with case 1/2/3 branching.
function segmentTreeBeatsFrames(variant = 'default') {
  let base, updates, queryRange, label;
  if (variant === 'allEqual') {
    base = [4, 4, 4, 4, 4];
    updates = [{ l: 0, r: 4, v: 2 }];
    queryRange = [0, 4];
    label = 'All-equal leaves: case 1 cascades to full segment';
  } else if (variant === 'noTouch') {
    base = [5, 3, 7, 2, 4];
    updates = [{ l: 0, r: 4, v: 10 }];
    queryRange = [0, 4];
    label = 'chmin with v ≥ max1: case 1, no work';
  } else {
    base = [5, 3, 7, 2, 4];
    updates = [{ l: 0, r: 4, v: 4 }];
    queryRange = [0, 4];
    label = 'Default — chmin(4) on [5,3,7,2,4], then range-sum';
  }

  const n = base.length;
  const a = base.slice();
  const arrRow = () => a.map((v, i) => `a[${i}]=${v}`);
  const summarise = (l, r) => {
    let m1 = -Infinity, m2 = -Infinity, cnt = 0, sum = 0;
    for (let i = l; i <= r; i += 1) {
      sum += a[i];
      if (a[i] > m1) { m2 = m1; m1 = a[i]; cnt = 1; }
      else if (a[i] === m1) { cnt += 1; }
      else if (a[i] > m2) { m2 = a[i]; }
    }
    return { m1, m2, cnt, sum };
  };

  const frames = [];
  frames.push({ array: arrRow(), caption: `Segment Tree Beats (${label}). The classic problem: support range chmin (replace a[i] with min(a[i], v) over a range) AND range-sum queries, both in amortised O(log² n).` });
  frames.push({ array: arrRow(), caption: `Each node stores: sum, max1 (strict maximum), max2 (strict second maximum, −∞ if none), and cntMax (count of max1 in the segment). These four are enough to apply chmin in O(1) when v sits between max2 and max1.` });
  frames.push({ array: arrRow(), caption: `Three cases when applying chmin(v) to a node:  Case 1 — v ≥ max1: nothing changes; return.  Case 2 — max2 < v < max1: every max1 drops to v; update sum -= (max1 − v)·cntMax, then max1 = v.  Case 3 — v ≤ max2: cannot fold cleanly, recurse into children ("break the tag").` });

  let s0 = summarise(0, n - 1);
  frames.push({
    array: [...arrRow(), '', `root: max1=${s0.m1}  max2=${s0.m2 === -Infinity ? '−∞' : s0.m2}  cntMax=${s0.cnt}  sum=${s0.sum}`],
    highlights: Object.fromEntries(a.map((_, i) => [i, 'visited'])),
    caption: `Build the tree over [${a.join(', ')}]. Root summary shown — these four fields drive all of Beats' decisions.`,
  });

  for (const { l, r, v } of updates) {
    const sBefore = summarise(l, r);
    let chosenCase;
    if (v >= sBefore.m1) chosenCase = 1;
    else if (v > sBefore.m2) chosenCase = 2;
    else chosenCase = 3;
    frames.push({
      array: [...arrRow(), '', `node[${l},${r}]: max1=${sBefore.m1}  max2=${sBefore.m2 === -Infinity ? '−∞' : sBefore.m2}  cntMax=${sBefore.cnt}  sum=${sBefore.sum}`, `apply chmin(${v})`],
      highlights: Object.fromEntries(Array.from({ length: r - l + 1 }, (_, k) => [l + k, 'mid'])),
      caption: `Update chmin(${v}) on range [${l},${r}]. Compare v=${v} against (max1=${sBefore.m1}, max2=${sBefore.m2 === -Infinity ? '−∞' : sBefore.m2}). Decision: CASE ${chosenCase}.`,
    });

    if (chosenCase === 1) {
      frames.push({
        array: [...arrRow(), '', `CASE 1: v=${v} ≥ max1=${sBefore.m1} ⇒ chmin is a no-op on this node.`],
        highlights: Object.fromEntries(Array.from({ length: r - l + 1 }, (_, k) => [l + k, 'visited'])),
        caption: `Case 1 fires — every element already ≤ ${v}. Return immediately. O(1) amortised cost on this node.`,
      });
    } else if (chosenCase === 2) {
      const delta = (sBefore.m1 - v) * sBefore.cnt;
      const hl = {};
      for (let i = l; i <= r; i += 1) if (a[i] === sBefore.m1) { a[i] = v; hl[i] = 'match'; }
      frames.push({
        array: [...arrRow(), '', `CASE 2: max2=${sBefore.m2 === -Infinity ? '−∞' : sBefore.m2} < v=${v} < max1=${sBefore.m1}.  Drop ${sBefore.cnt} copies of max1 to ${v}.  sum -= (${sBefore.m1} − ${v})·${sBefore.cnt} = ${delta}.  new max1 = ${v}.`],
        highlights: hl,
        caption: `Case 2: every max1 (=${sBefore.m1}) becomes ${v}; max2 and cntMax stay; sum drops by ${delta}. Lazy tag would push this to children on next visit.`,
      });
    } else {
      frames.push({
        array: [...arrRow(), '', `CASE 3: v=${v} ≤ max2=${sBefore.m2 === -Infinity ? '−∞' : sBefore.m2}.  Cannot fold — recurse into children and reapply.`],
        highlights: Object.fromEntries(Array.from({ length: r - l + 1 }, (_, k) => [l + k, 'frontier'])),
        caption: `Case 3: max2 ≥ v means more than one distinct value is above v. We must descend into both children. Crucially, every Case-3 recursion strictly reduces the multiset of distinct values, giving the O(log² n) amortised bound (Tang Wen's potential argument).`,
      });
      for (let i = l; i <= r; i += 1) if (a[i] > v) a[i] = v;
      frames.push({
        array: arrRow(),
        highlights: Object.fromEntries(Array.from({ length: r - l + 1 }, (_, k) => [l + k, 'match'])),
        caption: `After recursive resolution, every a[i] in [${l},${r}] is ≤ ${v}. Tree summaries (max1/max2/cntMax/sum) are re-pulled bottom-up.`,
      });
    }
  }

  const [ql, qr] = queryRange;
  const sQ = summarise(ql, qr);
  frames.push({
    array: [...arrRow(), '', `range-sum query on [${ql},${qr}] = ${sQ.sum}`],
    highlights: Object.fromEntries(Array.from({ length: qr - ql + 1 }, (_, k) => [ql + k, 'match'])),
    caption: `Range-sum on [${ql},${qr}] = ${sQ.sum}. The same node summaries answer this in O(log n) — sum is maintained by every chmin update.`,
  });
  frames.push({
    array: arrRow(),
    caption: `Done. Beats supports chmin + sum (and symmetrically chmax) in amortised O(log² n). The trick: store max1/max2 so Case 2 is O(1); Case 3 is rare and pays for itself via the distinct-value potential.`,
  });
  return frames;
}

// Persistent segment tree: 3 successive point updates on [1,2,3,4] yielding versions v0..v3 with shared subtree pointers.
function persistentSegmentTreeFrames(variant = 'default') {
  let base, updates, label;
  if (variant === 'leftHeavy') {
    base = [1, 2, 3, 4];
    updates = [{ i: 0, delta: 10 }, { i: 0, delta: 5 }, { i: 1, delta: 7 }];
    label = 'Left-heavy: updates concentrate on indices 0, 0, 1';
  } else if (variant === 'rightHeavy') {
    base = [1, 2, 3, 4];
    updates = [{ i: 3, delta: 6 }, { i: 3, delta: 4 }, { i: 2, delta: 2 }];
    label = 'Right-heavy: updates concentrate on indices 3, 3, 2';
  } else {
    base = [1, 2, 3, 4];
    updates = [{ i: 1, delta: 5 }, { i: 3, delta: 6 }, { i: 0, delta: 4 }];
    label = 'Default — three point updates: +5@1, +6@3, +4@0';
  }

  const n = base.length;
  const versions = [base.slice()];
  for (const { i, delta } of updates) {
    const next = versions[versions.length - 1].slice();
    next[i] += delta;
    versions.push(next);
  }

  const tagRoot = (v) => `v${v}`;
  const rowsForVersion = (v) => [`${tagRoot(v)}: [${versions[v].join(', ')}]  (sum=${versions[v].reduce((a, b) => a + b, 0)})`];
  const stackedRows = (upTo) => Array.from({ length: upTo + 1 }, (_, v) => rowsForVersion(v)[0]);

  // For a length-4 segment tree, root covers [0,3]; children cover [0,1] and [2,3]; leaves are [0],[1],[2],[3].
  const pathFor = (i) => i < 2 ? ['root[0,3]', 'L[0,1]', `leaf[${i}]`] : ['root[0,3]', 'R[2,3]', `leaf[${i}]`];
  const sharedFor = (i) => i < 2 ? 'R[2,3] subtree (shared)' : 'L[0,1] subtree (shared)';

  const frames = [];
  frames.push({ array: stackedRows(0), caption: `Persistent segment tree (${label}). A persistent segment tree keeps EVERY past version queryable in O(log n) extra memory per update — instead of mutating nodes, each update clones only the O(log n) nodes along the affected root-to-leaf path.` });
  frames.push({ array: stackedRows(0), caption: `Initial version v0 stores [${versions[0].join(', ')}]. The segment tree over n=${n} leaves has 2n−1 = ${2 * n - 1} nodes. Root covers [0,${n - 1}]; internal nodes split at the midpoint.` });
  frames.push({ array: stackedRows(0), caption: `Key idea: a new version reuses ALL unchanged subtrees by pointer. So each version costs O(log n) new nodes total, not O(n).` });

  for (let u = 0; u < updates.length; u += 1) {
    const { i, delta } = updates[u];
    const versionIdx = u + 1;
    const path = pathFor(i);
    const shared = sharedFor(i);
    frames.push({
      array: [...stackedRows(versionIdx - 1), '', `update #${versionIdx}: add ${delta} at index ${i} (build version v${versionIdx} from v${versionIdx - 1})`],
      highlights: { [versionIdx - 1]: 'mid' },
      caption: `Update ${versionIdx}: start at v${versionIdx - 1}. We will descend the path ${path.join(' → ')}; each node visited is CLONED. Every node NOT on the path is shared by pointer with v${versionIdx - 1}.`,
    });
    frames.push({
      array: [...stackedRows(versionIdx - 1), '', `new nodes (v${versionIdx}): ${path.map(p => `${p}*`).join(' → ')}`, `reused from v${versionIdx - 1}: ${shared}`],
      highlights: { [versionIdx - 1]: 'visited' },
      caption: `Clone the ${path.length} nodes along the path; each clone's child pointer that LEAVES the path still points into v${versionIdx - 1}. Total new nodes for this version: ${path.length} = O(log n).`,
    });
    frames.push({
      array: [...stackedRows(versionIdx), '', `v${versionIdx} root = newly cloned root[0,${n - 1}] with updated sum`],
      highlights: { [versionIdx]: 'match' },
      caption: `v${versionIdx} is now queryable independently. Old root (v${versionIdx - 1}) still works — both share the un-touched ${shared}.`,
    });
  }

  frames.push({
    array: [...Array.from({ length: versions.length }, (_, v) => rowsForVersion(v)[0]), '', `roots: ${versions.map((_, v) => `v${v}`).join(', ')}  — all alive`],
    highlights: Object.fromEntries(versions.map((_, v) => [v, 'match'])),
    caption: `All ${versions.length} versions coexist. Each takes only O(log n) extra nodes beyond its predecessor; total nodes used: ${(2 * n - 1) + updates.length * Math.ceil(Math.log2(n) + 1)} (approx). Any past sum query is O(log n).`,
  });
  frames.push({
    array: Array.from({ length: versions.length }, (_, v) => rowsForVersion(v)[0]),
    caption: `Use cases: k-th smallest in a range (Wavelet replacement), offline range queries on arrays of points, "time travel" rollback in competitive programming. The shared-subtree pointer trick is what makes it scale.`,
  });
  return frames;
}

// Levenshtein edit distance DP table for 'kitten' -> 'sitting', filled cell by cell.
function stringEditDistanceFrames(variant = 'default') {
  let src, dst, label;
  if (variant === 'equal') {
    src = 'abc';
    dst = 'abc';
    label = 'Equal strings — diagonal of zeros';
  } else if (variant === 'disjoint') {
    src = 'abc';
    dst = 'xyz';
    label = 'Disjoint alphabets — pure replace';
  } else {
    src = 'kitten';
    dst = 'sitting';
    label = "Default — 'kitten' → 'sitting' (distance 3)";
  }

  const m = src.length;
  const k = dst.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(k + 1).fill(-1));

  const headerRow = () => `      ${'·'.padStart(3)} ${dst.split('').map(c => c.padStart(3)).join(' ')}`;
  const tableRows = () => {
    const rows = [headerRow()];
    for (let i = 0; i <= m; i += 1) {
      const labelChar = i === 0 ? '·' : src[i - 1];
      const cells = dp[i].map(v => v === -1 ? '  ·' : String(v).padStart(3));
      rows.push(`  ${labelChar.padStart(2)} ${cells.join(' ')}`);
    }
    return rows;
  };

  const frames = [];
  frames.push({ array: tableRows(), caption: `Levenshtein edit distance (${label}). dp[i][j] = minimum number of insertions, deletions, or substitutions to turn src[0..i) into dst[0..j). Final answer: dp[${m}][${k}].` });
  frames.push({ array: tableRows(), caption: `Recurrence: if src[i-1] = dst[j-1], dp[i][j] = dp[i-1][j-1] (free match). Otherwise dp[i][j] = 1 + min( dp[i-1][j]  // delete from src,  dp[i][j-1]  // insert into src,  dp[i-1][j-1]  // substitute ).` });

  for (let j = 0; j <= k; j += 1) dp[0][j] = j;
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  frames.push({
    array: tableRows(),
    caption: `Base cases: dp[0][j] = j (insert j chars into empty), dp[i][0] = i (delete i chars to empty). Row 0 and column 0 are now filled.`,
  });

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= k; j += 1) {
      const matched = src[i - 1] === dst[j - 1];
      let val, op;
      if (matched) { val = dp[i - 1][j - 1]; op = 'match (free)'; }
      else {
        const del = dp[i - 1][j];
        const ins = dp[i][j - 1];
        const sub = dp[i - 1][j - 1];
        const best = Math.min(del, ins, sub);
        val = 1 + best;
        op = best === sub ? 'substitute' : best === del ? 'delete' : 'insert';
      }
      dp[i][j] = val;
      frames.push({
        array: tableRows(),
        highlights: { [i + 1]: matched ? 'match' : 'mid' },
        caption: `dp[${i}][${j}]:  src[${i - 1}]='${src[i - 1]}'  vs  dst[${j - 1}]='${dst[j - 1]}'  →  ${matched ? `equal, copy diagonal = ${val}` : `${op}, ${val}`}.`,
      });
    }
  }

  frames.push({
    array: tableRows(),
    highlights: { [m + 1]: 'match' },
    caption: `Final: dp[${m}][${k}] = ${dp[m][k]}. That is the minimum edit distance from '${src}' to '${dst}'. Total work O(m·k) time and space; space can be reduced to O(min(m,k)) with two rolling rows.`,
  });
  return frames;
}

// Ternary search on the parabola f(x) = -(x-5)^2 over [0,10], finding the maximiser.
function ternarySearchFrames(variant = 'default') {
  let lo, hi, peak, label, eps;
  if (variant === 'narrow') {
    lo = 4;
    hi = 6;
    peak = 5;
    label = 'Narrow start [4,10] already close to optimum';
    eps = 0.05;
  } else if (variant === 'offCentre') {
    lo = 0;
    hi = 10;
    peak = 2;
    label = 'Off-centre peak at x=2';
    eps = 0.1;
  } else {
    lo = 0;
    hi = 10;
    peak = 5;
    label = 'Default — peak at x=5 on [0,10]';
    eps = 0.1;
  }

  const f = (x) => -(x - peak) * (x - peak);
  const fmt = (x) => Number(x.toFixed(3));
  const row = (l, h) => [
    `interval: [${fmt(l)}, ${fmt(h)}]   width = ${fmt(h - l)}`,
    `f(lo) = ${fmt(f(l))}   f(hi) = ${fmt(f(h))}`,
  ];

  const frames = [];
  frames.push({ array: row(lo, hi), caption: `Ternary search (${label}). Works on a STRICTLY UNIMODAL function — here f(x) = −(x−${peak})² is concave with a single maximum at x=${peak}. Goal: locate the maximiser to within ε=${eps}.` });
  frames.push({ array: row(lo, hi), caption: `Invariant: at every step the optimum stays inside [lo, hi]. Pick two interior probes m1 = lo + (hi − lo)/3 and m2 = hi − (hi − lo)/3, then compare f(m1) vs f(m2) to fold away one of the three thirds.` });
  frames.push({ array: row(lo, hi), caption: `If f(m1) < f(m2): peak cannot be in [lo, m1] (function only rises after m1, but is unimodal), so set lo = m1. Else set hi = m2. Each step shrinks the interval by factor 2/3.` });

  let it = 0;
  while (hi - lo > eps && it < 18) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    const f1 = f(m1);
    const f2 = f(m2);
    const fold = f1 < f2 ? 'left third [lo, m1]' : 'right third [m2, hi]';
    frames.push({
      array: [...row(lo, hi), `m1 = ${fmt(m1)}   m2 = ${fmt(m2)}`, `f(m1) = ${fmt(f1)}   f(m2) = ${fmt(f2)}`],
      highlights: { 0: 'mid', 2: 'low', 3: 'high' },
      caption: `Round ${it + 1}: probe m1=${fmt(m1)} and m2=${fmt(m2)}. f(m1)=${fmt(f1)} ${f1 < f2 ? '<' : '≥'} f(m2)=${fmt(f2)} ⇒ discard ${fold}.`,
    });
    if (f1 < f2) lo = m1; else hi = m2;
    frames.push({
      array: row(lo, hi),
      highlights: { 0: 'match' },
      caption: `After round ${it + 1}: interval narrowed to [${fmt(lo)}, ${fmt(hi)}].`,
    });
    it += 1;
  }

  const best = (lo + hi) / 2;
  frames.push({
    array: [...row(lo, hi), `estimate: x ≈ ${fmt(best)}   f(x) ≈ ${fmt(f(best))}`],
    highlights: { 0: 'match', 2: 'match' },
    caption: `Done after ${it} rounds. Estimated maximiser x ≈ ${fmt(best)} (true peak = ${peak}). Each iteration cuts width by 2/3, so reaching precision ε from width W needs about log_{3/2}(W/ε) ≈ ${Math.ceil(Math.log((hi + (best - lo)) / eps) / Math.log(1.5))} steps.`,
  });
  return frames;
}

// 3-color DFS cycle detection in a directed graph. White=unvisited, gray=on stack, black=done.
function cycleDetectionGraphFrames(variant = 'default') {
  let nodeIds, edgeList, label, root;
  if (variant === 'dag') {
    nodeIds = [0, 1, 2, 3];
    edgeList = [[0, 1], [1, 2], [0, 3], [3, 2]];
    label = 'DAG — no cycle, diamond shape';
    root = 0;
  } else if (variant === 'selfLoop') {
    nodeIds = [0, 1, 2, 3];
    edgeList = [[0, 1], [1, 2], [2, 2], [0, 3]];
    label = 'Self-loop on node 2 — trivial cycle';
    root = 0;
  } else {
    nodeIds = [0, 1, 2, 3];
    edgeList = [[0, 1], [1, 2], [2, 0], [0, 3]];
    label = 'Default — cycle 0 → 1 → 2 → 0';
    root = 0;
  }

  const adj = Object.fromEntries(nodeIds.map(id => [id, []]));
  for (const [a, b] of edgeList) adj[a].push(b);

  const color = Object.fromEntries(nodeIds.map(id => [id, 'white']));
  const stateFor = (c) => c === 'white' ? undefined : c === 'gray' ? 'current' : 'done';
  const treeEdges = new Set();
  const backEdges = new Set();
  const frames = [];

  const snapshot = (caption, focus = null, extraEdgeState = null) => {
    const nodesOut = nodeIds.map(id => {
      let s = stateFor(color[id]);
      if (id === focus && color[id] === 'gray') s = 'current';
      return { id, label: `${id}\n${color[id][0]}`, state: s };
    });
    const edgesOut = edgeList.map(([a, b]) => {
      const key = `${a}->${b}`;
      let st;
      if (extraEdgeState && extraEdgeState.key === key) st = extraEdgeState.state;
      else if (backEdges.has(key)) st = 'current';
      else if (treeEdges.has(key)) st = 'visited';
      return { a, b, state: st };
    });
    frames.push({ nodes: nodesOut, edges: edgesOut, caption });
  };

  snapshot(`3-color DFS cycle detection (${label}). Each node carries a color: WHITE = never seen, GRAY = currently on the DFS recursion stack, BLACK = fully explored. A directed edge u → v hits a cycle exactly when v is already GRAY.`);
  snapshot(`Setup: all ${nodeIds.length} nodes start WHITE. Edges: ${edgeList.map(([a, b]) => `${a}→${b}`).join(', ')}. We launch DFS from node ${root}.`);

  let cycleFound = false;

  function dfs(u) {
    color[u] = 'gray';
    snapshot(`Enter dfs(${u}): paint ${u} GRAY (now on the recursion stack). Will explore neighbors [${adj[u].join(', ')}].`, u);
    for (const v of adj[u]) {
      const edgeKey = `${u}->${v}`;
      if (color[v] === 'white') {
        treeEdges.add(edgeKey);
        snapshot(`Edge ${u}→${v}: ${v} is WHITE — tree edge. Descend into dfs(${v}).`, u, { key: edgeKey, state: 'visited' });
        if (dfs(v)) return true;
        if (cycleFound) return true;
      } else if (color[v] === 'gray') {
        backEdges.add(edgeKey);
        cycleFound = true;
        snapshot(`Edge ${u}→${v}: ${v} is GRAY — BACK EDGE found. This closes a cycle through the current DFS stack. Stop the search.`, u, { key: edgeKey, state: 'current' });
        return true;
      } else {
        snapshot(`Edge ${u}→${v}: ${v} is BLACK (already finished, on a different branch). This is a cross/forward edge, not a cycle — skip.`, u);
      }
    }
    color[u] = 'black';
    snapshot(`All neighbors of ${u} done. Paint ${u} BLACK and pop it off the recursion stack.`, null);
    return false;
  }

  dfs(root);
  for (const id of nodeIds) {
    if (color[id] === 'white' && !cycleFound) {
      snapshot(`Node ${id} still WHITE — restart DFS from a fresh root to cover the rest of the graph.`);
      dfs(id);
    }
  }

  if (cycleFound) {
    snapshot(`Verdict: CYCLE detected (red edge above). A directed graph is a DAG if and only if 3-color DFS never finds a back edge.`);
  } else {
    snapshot(`Verdict: no back edge across the entire run — the graph is a DAG. The BLACK finishing order, reversed, gives a topological sort.`);
  }
  snapshot(`Complexity: O(V + E) — each node is painted exactly twice (white→gray→black) and each edge is examined exactly once.`);
  return frames;
}

// Euler tour on a 7-node rooted tree, filling tin[] and tout[] arrays.
function eulerTourTreeFrames(variant = 'default') {
  let edges, root, label;
  if (variant === 'chain') {
    edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]];
    root = 0;
    label = 'Chain 0-1-2-3-4-5-6 (pathological depth)';
  } else if (variant === 'star') {
    edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]];
    root = 0;
    label = 'Star — root 0 with 6 leaves';
  } else {
    edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
    root = 0;
    label = 'Default — balanced tree, root 0';
  }

  const n = 7;
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }

  const tin = new Array(n).fill(-1);
  const tout = new Array(n).fill(-1);
  const tour = [];
  let timer = 0;

  const fmtArr = (a) => `[${a.map(v => v === -1 ? '·' : v).join(', ')}]`;
  const tourStr = () => tour.length ? tour.join(' → ') : '(empty)';
  const rows = (highlightNode = null, msg = '') => {
    const out = [
      `node:    [ 0,  1,  2,  3,  4,  5,  6 ]`,
      `tin[]:   ${fmtArr(tin)}`,
      `tout[]:  ${fmtArr(tout)}`,
      `tour:    ${tourStr()}`,
    ];
    if (highlightNode != null) out.push(`focus:   node ${highlightNode}`);
    if (msg) out.push(msg);
    return out;
  };

  const frames = [];
  frames.push({ array: rows(), caption: `Euler tour on a rooted tree (${label}). The "tour" lists each node every time we ENTER and LEAVE it during DFS — for a tree on n nodes that's exactly 2n−1 entries.` });
  frames.push({ array: rows(), caption: `We also fill two arrays: tin[v] = timestamp when DFS first visits v, tout[v] = timestamp when DFS leaves v. The interval [tin[v], tout[v]] then equals the entire subtree rooted at v — the foundation for subtree queries on segment trees.` });
  frames.push({ array: rows(), caption: `Edges: ${edges.map(([a, b]) => `${a}-${b}`).join(', ')}. Root at ${root}. Start DFS with timer = 0.` });

  function dfs(u, parent) {
    tin[u] = timer;
    tour.push(u);
    timer += 1;
    frames.push({
      array: rows(u, `enter ${u}: tin[${u}] = ${tin[u]}; append ${u} to tour`),
      highlights: { 1: 'mid' },
      caption: `Enter node ${u} (parent = ${parent === -1 ? 'root' : parent}). Stamp tin[${u}] = ${tin[u]} and push ${u} onto the tour. Now recurse into its children.`,
    });
    for (const v of adj[u]) {
      if (v === parent) continue;
      dfs(v, u);
      tour.push(u);
      frames.push({
        array: rows(u, `return to ${u} from child ${v}: append ${u} to tour again`),
        highlights: { 3: 'mid' },
        caption: `Returned to ${u} from child ${v}. In an Euler tour we re-record ${u} every time we cross back over it — this is what makes range-min over the tour give us LCA.`,
      });
    }
    tout[u] = timer;
    timer += 1;
    frames.push({
      array: rows(u, `leave ${u}: tout[${u}] = ${tout[u]}`),
      highlights: { 2: 'high' },
      caption: `Finished ${u}'s subtree. Stamp tout[${u}] = ${tout[u]}. Now [tin[${u}], tout[${u}]] = [${tin[u]}, ${tout[u]}] uniquely flattens ${u}'s subtree.`,
    });
  }

  dfs(root, -1);

  frames.push({
    array: rows(null, `tour length = ${tour.length} (expected 2n-1 = ${2 * n - 1})`),
    highlights: { 1: 'match', 2: 'match' },
    caption: `Tour complete. tin/tout fully populated. Tour length = ${tour.length}.`,
  });
  frames.push({
    array: rows(null, `subtree of v ⇔ tour positions tin[v]..tout[v]`),
    caption: `Use cases: subtree sum/update (segment tree over the tin-indexed Euler tour), LCA (range minimum over the depth array of the tour), and Heavy-Light decomposition all build on top of tin/tout.`,
  });
  return frames;
}

// Binary lifting up[k][v] table; query the 4th ancestor on an 8-node tree.
function binaryLiftingGeneralFrames(variant = 'default') {
  let parent, queryV, queryK, label;
  if (variant === 'chain') {
    parent = [-1, 0, 1, 2, 3, 4, 5, 6];
    queryV = 7;
    queryK = 4;
    label = 'Chain 0→1→…→7; query ancestor⁴(7)';
  } else if (variant === 'star') {
    parent = [-1, 0, 0, 0, 0, 1, 1, 5];
    queryV = 7;
    queryK = 2;
    label = 'Bushy tree; query ancestor²(7)';
  } else {
    parent = [-1, 0, 0, 1, 1, 2, 3, 6];
    queryV = 7;
    queryK = 4;
    label = 'Default — balanced tree, query ancestor⁴(7)';
  }

  const n = parent.length;
  const LOG = Math.ceil(Math.log2(n)) || 1;
  const up = Array.from({ length: LOG + 1 }, () => new Array(n).fill(-1));
  for (let v = 0; v < n; v += 1) up[0][v] = parent[v];

  const fmtRow = (k) => up[k].map(x => String(x).padStart(2)).join(' ');
  const tableRows = (note = '') => {
    const header = `v:        ${Array.from({ length: n }, (_, i) => String(i).padStart(2)).join(' ')}`;
    const rows = [header];
    for (let k = 0; k <= LOG; k += 1) {
      const filled = up[k].some(v => v !== -1);
      rows.push(`up[${k}=2^${k}]: ${filled ? fmtRow(k) : up[k].map(() => ' ·').join(' ')}`);
    }
    if (note) rows.push(note);
    return rows;
  };

  const frames = [];
  frames.push({ array: tableRows(), caption: `Binary lifting (${label}). Precompute up[k][v] = the (2^k)-th ancestor of v. Then any k-th ancestor query decomposes k into bits and jumps power-of-two distances — O(log n) per query, O(n log n) preprocessing.` });
  frames.push({ array: tableRows(), caption: `Parent array (immediate ancestors): parent[] = [${parent.map(x => x === -1 ? 'root' : x).join(', ')}]. Row k=0 of the table is just this: up[0][v] = parent[v]. (−1 means "above the root", i.e. virtual sentinel.)` });
  frames.push({
    array: tableRows('row k=0 filled from parent[]'),
    highlights: { 1: 'mid' },
    caption: `Row k=0 ready. To build row k, use the recurrence up[k][v] = up[k-1][ up[k-1][v] ]. Jumping 2^k upward = two jumps of 2^(k-1).`,
  });

  for (let k = 1; k <= LOG; k += 1) {
    for (let v = 0; v < n; v += 1) {
      const mid = up[k - 1][v];
      up[k][v] = mid === -1 ? -1 : up[k - 1][mid];
    }
    frames.push({
      array: tableRows(`built up[${k}] from up[${k - 1}]`),
      highlights: { [k + 1]: 'mid' },
      caption: `Build row k=${k}: for every v, up[${k}][v] = up[${k - 1}][ up[${k - 1}][v] ]. Doubles the reach. Cells now hold the (2^${k} = ${1 << k})-th ancestor of each node.`,
    });
  }

  frames.push({
    array: tableRows(`table complete — ${LOG + 1} rows × ${n} cols`),
    highlights: Object.fromEntries(Array.from({ length: LOG + 1 }, (_, k) => [k + 1, 'visited'])),
    caption: `Preprocessing done in O(n log n) time and space. Now answer ancestor queries by walking down the bits of k.`,
  });

  let cur = queryV;
  const bits = [];
  for (let b = LOG; b >= 0; b -= 1) {
    if ((queryK >> b) & 1) bits.push(b);
  }
  frames.push({
    array: tableRows(`query: ancestor^${queryK}(${queryV}); ${queryK} in binary = ${queryK.toString(2)}; bits set = ${bits.join(', ')}`),
    caption: `Query: jump ${queryK} levels above node ${queryV}. Write ${queryK} = ${bits.map(b => `2^${b}`).join(' + ') || '0'}. Walk these jumps in any order; using high-to-low keeps cur near the root.`,
  });

  for (const b of bits) {
    const next = cur === -1 ? -1 : up[b][cur];
    frames.push({
      array: tableRows(`jump 2^${b} = ${1 << b}: ${cur} → ${next}`),
      highlights: { [b + 1]: 'current' },
      caption: `Bit ${b} of ${queryK} is set: read up[${b}][${cur}] = ${next}. Now cur = ${next}.`,
    });
    cur = next;
  }

  frames.push({
    array: tableRows(`answer: ancestor^${queryK}(${queryV}) = ${cur}`),
    highlights: { 0: 'match' },
    caption: `Done after ${bits.length} jump${bits.length === 1 ? '' : 's'}. The ${queryK}-th ancestor of node ${queryV} is ${cur === -1 ? 'above the root (does not exist)' : cur}. This same table powers LCA queries in O(log n).`,
  });
  return frames;
}

// Largest-independent-set DP on a 7-node tree. dp[v] = (take, skip).
function dpOnTreesFrames(variant = 'default') {
  let edges, weights, root, label;
  if (variant === 'chain') {
    edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]];
    weights = [3, 2, 4, 1, 5, 2, 6];
    root = 0;
    label = 'Chain — classic "house robber on a line"';
  } else if (variant === 'star') {
    edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]];
    weights = [10, 1, 1, 1, 1, 1, 1];
    root = 0;
    label = 'Star — root vs. all leaves trade-off';
  } else {
    edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
    weights = [4, 3, 5, 2, 1, 6, 2];
    root = 0;
    label = 'Default — balanced tree, mixed weights';
  }

  const n = 7;
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }

  const take = new Array(n).fill(null);
  const skip = new Array(n).fill(null);

  const fmtCell = (v) => {
    if (take[v] === null) return `${v}:·/·`;
    return `${v}:${take[v]}/${skip[v]}`;
  };
  const tableRows = (focus = null, note = '') => {
    const header = `nodes (v: take/skip), weights w = [${weights.join(', ')}]`;
    const cellsTop = [0, 1, 2].map(fmtCell).join('   ');
    const cellsMid = [3, 4].map(fmtCell).join('       ');
    const cellsBot = [5, 6].map(fmtCell).join('       ');
    const out = [header, '', `level 0–1:  ${cellsTop}`, `level 2 L:  ${cellsMid}`, `level 2 R:  ${cellsBot}`];
    if (focus != null) out.push(`focus: node ${focus}`);
    if (note) out.push(note);
    return out;
  };

  const order = [];
  function postOrder(u, parent) {
    for (const v of adj[u]) if (v !== parent) postOrder(v, u);
    order.push([u, parent]);
  }
  postOrder(root, -1);

  const frames = [];
  frames.push({ array: tableRows(), caption: `DP on trees — largest independent set with vertex weights (${label}). Goal: pick a subset of nodes with no two adjacent, maximising the sum of weights. The tree structure makes it solvable in O(n).` });
  frames.push({ array: tableRows(), caption: `State per node v: take[v] = best sum when v IS included, skip[v] = best sum when v is NOT included. Recurrence: take[v] = w[v] + Σ skip[c]; skip[v] = Σ max(take[c], skip[c]) over children c.` });
  frames.push({ array: tableRows(), caption: `Why a tree? Each child's subproblem is independent once we decide v's status. We compute children first (post-order DFS), then combine. The constraint "no two adjacent" only couples a node with its direct children.` });
  frames.push({ array: tableRows(null, `post-order = ${order.map(([u]) => u).join(', ')}`), caption: `Post-order from root ${root}: ${order.map(([u]) => u).join(' → ')}. Leaves resolve first (trivial base case), then internal nodes combine their children's values.` });

  for (const [u, parent] of order) {
    const children = adj[u].filter(c => c !== parent);
    if (children.length === 0) {
      take[u] = weights[u];
      skip[u] = 0;
      frames.push({
        array: tableRows(u, `leaf ${u}: take=${take[u]}, skip=0`),
        highlights: { 5: 'mid' },
        caption: `Node ${u} is a leaf. take[${u}] = w[${u}] = ${weights[u]} (include it). skip[${u}] = 0 (exclude it, no subtree to add).`,
      });
    } else {
      const sumSkip = children.reduce((s, c) => s + skip[c], 0);
      const sumBest = children.reduce((s, c) => s + Math.max(take[c], skip[c]), 0);
      take[u] = weights[u] + sumSkip;
      skip[u] = sumBest;
      const childStr = children.map(c => `${c}(t=${take[c]},s=${skip[c]})`).join(', ');
      frames.push({
        array: tableRows(u, `combine ${u} with children: ${childStr}`),
        highlights: { 5: 'mid' },
        caption: `Internal node ${u}, children ${children.join(', ')}. take[${u}] = w[${u}] + Σ skip[c] = ${weights[u]} + ${sumSkip} = ${take[u]}. skip[${u}] = Σ max(take[c], skip[c]) = ${skip[u]}.`,
      });
    }
  }

  const ans = Math.max(take[root], skip[root]);
  frames.push({
    array: tableRows(root, `root ${root}: take=${take[root]}, skip=${skip[root]}; answer = ${ans}`),
    highlights: { 5: 'match' },
    caption: `Root ${root}: best independent set weight = max(take[${root}], skip[${root}]) = max(${take[root]}, ${skip[root]}) = ${ans}.`,
  });
  frames.push({
    array: tableRows(null, `final answer = ${ans}`),
    caption: `Total work: each node is visited once, each edge contributes O(1) work → O(n). The same "two-state per node, combine over children" recipe powers many tree DPs: max matching, tree diameter, re-rooting techniques, and more.`,
  });
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Monotonic stack (next-greater-element template)
// Maintains a strictly increasing stack of *indices*; on the rendered tile
// row we show indices of the array, while the caption shows the live stack
// values. Default array yields a satisfying cascade of pops.
// ─────────────────────────────────────────────────────────────────────────
function monotonicStackFrames(input = [2, 1, 5, 6, 2, 3]) {
  const arr = (Array.isArray(input) ? input : []).slice(0, 16).map(Number);
  if (!arr.length) return [{ array: [], caption: 'Empty array — nothing to scan.' }];
  const frames = [];
  const stack = [];
  const stackOf = () => stack.map(i => arr[i]);
  const stackHi = () => Object.fromEntries(stack.map(i => [i, 'visited']));
  frames.push({
    array: [...arr], highlights: {},
    caption: `Scan left-to-right. Keep a strictly increasing stack of indices; pop everything ≥ current before pushing.`,
  });
  frames.push({
    array: [...arr], highlights: {},
    caption: `Why indices? We often need to know the *distance* between current and the popped index (e.g. histogram width, next-greater span).`,
  });
  for (let i = 0; i < arr.length; i++) {
    frames.push({
      array: [...arr], highlights: { [i]: 'current', ...stackHi() },
      caption: `i=${i}, arr[i]=${arr[i]}. Stack top values: [${stackOf().join(', ') || 'empty'}].`,
    });
    while (stack.length && arr[stack[stack.length - 1]] >= arr[i]) {
      const popped = stack.pop();
      frames.push({
        array: [...arr], highlights: { [i]: 'current', [popped]: 'high', ...stackHi() },
        caption: `arr[${popped}]=${arr[popped]} ≥ arr[${i}]=${arr[i]} → pop index ${popped}. Its next-smaller-to-the-right is index ${i}.`,
      });
    }
    stack.push(i);
    frames.push({
      array: [...arr], highlights: { [i]: 'match', ...stackHi() },
      caption: `Push index ${i}. Stack values now: [${stackOf().join(', ')}].`,
    });
  }
  frames.push({
    array: [...arr], highlights: stackHi(),
    caption: `Done. Indices still on the stack have no smaller element to their right: [${stack.join(', ')}]. Each element is pushed and popped at most once — O(n) total.`,
  });
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Bellman-Ford negative-cycle detection
// 5-node graph; default variant contains a negative cycle 1→2→3→1 of
// weight -2 reachable from source 0. After V-1 = 4 relax sweeps we attempt
// one more pass; any successful relaxation proves a negative cycle.
// ─────────────────────────────────────────────────────────────────────────
function bellmanFordDetectionFrames(variant = 'default') {
  const cfg = {
    default: {
      n: 5,
      edges: [
        { a: 0, b: 1, w: 1 },
        { a: 1, b: 2, w: 2 },
        { a: 2, b: 3, w: -5 },
        { a: 3, b: 1, w: 1 },
        { a: 3, b: 4, w: 3 },
      ],
      note: 'Cycle 1→2→3→1 has total weight 2+(-5)+1 = -2. Reachable from source 0 ⇒ shortest paths are unbounded.',
    },
    safe: {
      n: 5,
      edges: [
        { a: 0, b: 1, w: 4 },
        { a: 0, b: 2, w: 5 },
        { a: 1, b: 2, w: -3 },
        { a: 2, b: 3, w: 4 },
        { a: 1, b: 3, w: 8 },
        { a: 3, b: 4, w: 2 },
      ],
      note: 'Has a negative edge (1→2, -3) but NO negative cycle ⇒ Bellman-Ford converges.',
    },
    selfLoop: {
      n: 5,
      edges: [
        { a: 0, b: 1, w: 2 },
        { a: 1, b: 2, w: 3 },
        { a: 2, b: 2, w: -1 },
        { a: 2, b: 3, w: 4 },
        { a: 3, b: 4, w: 1 },
      ],
      note: 'Negative self-loop on node 2. Any pass relaxes dist[2] forever — easiest possible negative cycle.',
    },
  }[variant] || {};
  const n = cfg.n;
  const edges = cfg.edges;
  const dist = Array(n).fill(Infinity);
  dist[0] = 0;
  const nodes = Array.from({ length: n }, (_, i) => ({ id: i }));
  const fmt = (d) => d === Infinity ? '∞' : (d > 1e9 ? '−∞' : String(d));
  const snap = (hi, edgeHi, caption) => {
    const ns = nodes.map(node => ({
      id: node.id,
      label: `${node.id}\n${fmt(dist[node.id])}`,
      state: hi[node.id],
    }));
    const es = edges.map(e => ({
      a: e.a, b: e.b, w: e.w,
      state: edgeHi && edgeHi.a === e.a && edgeHi.b === e.b ? 'tree' : undefined,
    }));
    frames.push({ nodes: ns, edges: es, caption });
  };
  const frames = [];
  snap({ 0: 'current' }, null,
    `Bellman-Ford negative-cycle detection on ${n} nodes, ${edges.length} edges. Source = 0. ${cfg.note}`);
  snap({ 0: 'current' }, null,
    `Init dist[0]=0, others=∞. We will relax every edge V−1 = ${n - 1} times, then do one more "detection" pass.`);
  for (let iter = 1; iter <= n - 1; iter++) {
    let relaxed = 0;
    snap({ 0: 'visited' }, null, `Pass ${iter}/${n - 1}: try to relax all ${edges.length} edges.`);
    for (const e of edges) {
      if (dist[e.a] !== Infinity && dist[e.a] + e.w < dist[e.b]) {
        const oldD = dist[e.b];
        dist[e.b] = dist[e.a] + e.w;
        relaxed += 1;
        snap({ [e.a]: 'visited', [e.b]: 'current' }, e,
          `Pass ${iter}: relax ${e.a}→${e.b} (w=${e.w}). dist[${e.b}]: ${fmt(oldD)} → ${fmt(dist[e.b])}.`);
      }
    }
    snap({ 0: 'visited' }, null,
      `Pass ${iter} end. ${relaxed} edge${relaxed === 1 ? '' : 's'} relaxed.`);
  }
  let foundNeg = false;
  let firstHit = null;
  snap({ 0: 'current' }, null,
    `Detection pass: after V−1 sweeps, shortest paths must have stabilised IF there's no negative cycle. Sweep once more — any further relaxation is proof.`);
  for (const e of edges) {
    if (dist[e.a] !== Infinity && dist[e.a] + e.w < dist[e.b]) {
      foundNeg = true;
      if (!firstHit) firstHit = e;
      snap({ [e.a]: 'high', [e.b]: 'high' }, e,
        `Edge ${e.a}→${e.b} still relaxes (dist[${e.a}]+${e.w} < dist[${e.b}]) ⇒ a negative cycle is reachable from the source.`);
      break;
    }
  }
  if (foundNeg) {
    snap(Object.fromEntries(nodes.map(node => [node.id, 'high'])), firstHit,
      `Verdict: NEGATIVE CYCLE detected via edge ${firstHit.a}→${firstHit.b}. Shortest-path values from 0 are not well-defined for some nodes.`);
  } else {
    snap(Object.fromEntries(nodes.map(node => [node.id, 'done'])), null,
      `Detection pass relaxed nothing ⇒ NO negative cycle reachable from 0. Final distances: [${dist.map(fmt).join(', ')}].`);
  }
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Kahn's algorithm (topological sort via BFS over in-degrees)
// 6-node DAG. Caption tracks the live in-degree counts as nodes are emitted.
// ─────────────────────────────────────────────────────────────────────────
function kahnsAlgorithmFrames(variant = 'default') {
  const cfg = {
    default: {
      n: 6,
      edges: [
        { a: 5, b: 2 }, { a: 5, b: 0 },
        { a: 4, b: 0 }, { a: 4, b: 1 },
        { a: 2, b: 3 }, { a: 3, b: 1 },
      ],
      note: 'Classic course-prereq DAG. Two roots (4 and 5) start with in-degree 0.',
    },
    chain: {
      n: 6,
      edges: [
        { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 5 },
      ],
      note: 'Linear chain 0→1→…→5. Only one node ever has in-degree 0 at a time.',
    },
    diamond: {
      n: 5,
      edges: [
        { a: 0, b: 1 }, { a: 0, b: 2 },
        { a: 1, b: 3 }, { a: 2, b: 3 },
        { a: 3, b: 4 },
      ],
      note: 'Diamond: 0 forks to 1 and 2, both join at 3, then 4.',
    },
  }[variant] || {};
  const n = cfg.n;
  const edges = cfg.edges;
  const indeg = Array(n).fill(0);
  for (const e of edges) indeg[e.b] += 1;
  const nodes = Array.from({ length: n }, (_, i) => ({ id: i }));
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  const order = [];
  const frames = [];
  const snap = (currentId, caption) => {
    const ns = nodes.map(node => ({
      id: node.id,
      label: `${node.id}\nin=${indeg[node.id]}`,
      state: node.id === currentId ? 'current'
        : order.includes(node.id) ? 'done'
        : queue.includes(node.id) ? 'frontier'
        : undefined,
    }));
    frames.push({ nodes: ns, edges: edges.map(e => ({ ...e })), caption });
  };
  snap(null, `Kahn's algorithm: ${cfg.note}`);
  snap(null, `Compute in-degree for each node (count of incoming edges). A node is "free" the moment its in-degree hits 0.`);
  snap(null, `Initial 0-in-degree queue: [${queue.join(', ')}].`);
  let step = 0;
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    step += 1;
    const outs = edges.filter(e => e.a === u).map(e => e.b);
    snap(u, `Step ${step}: pop ${u}. Order so far: [${order.join(' → ')}]. Out-neighbours of ${u}: [${outs.join(', ') || 'none'}].`);
    const freed = [];
    for (const e of edges) {
      if (e.a === u) {
        indeg[e.b] -= 1;
        if (indeg[e.b] === 0) { queue.push(e.b); freed.push(e.b); }
      }
    }
    if (outs.length) {
      snap(u, `Decrement in-degree of each out-neighbour. ${freed.length ? `Freed (now 0): [${freed.join(', ')}].` : 'None hit 0 yet.'} Queue: [${queue.join(', ') || 'empty'}].`);
    }
  }
  if (order.length < n) {
    snap(null, `Only ${order.length}/${n} nodes emitted. The remaining nodes form a cycle ⇒ no valid topological order.`);
  } else {
    snap(null, `Done. Topological order: [${order.join(' → ')}]. Total work O(V+E) — each edge is decremented exactly once.`);
  }
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Cuckoo hashing (2 tables, 2 hash functions)
// Each insert tries T1 first; on collision evicts the resident, hashes it
// by the *other* table, and so on. Tile-array renders the two tables stacked.
// ─────────────────────────────────────────────────────────────────────────
function cuckooHashingFrames(input = [12, 25, 37, 49, 18, 5]) {
  const keys = (Array.isArray(input) ? input : []).slice(0, 10).map(Number).filter(Number.isFinite);
  if (!keys.length) return [{ array: [], caption: 'No keys to insert.' }];
  const SZ = 5;
  const MAX_KICK = 8;
  const h1 = (k) => k % SZ;
  const h2 = (k) => Math.floor(k / SZ) % SZ;
  const t1 = Array(SZ).fill(null);
  const t2 = Array(SZ).fill(null);
  const frames = [];
  const labelCell = (v) => v == null ? '·' : String(v);
  const renderArr = () => [
    ...t1.map((v, i) => `T1[${i}]=${labelCell(v)}`),
    ...t2.map((v, i) => `T2[${i}]=${labelCell(v)}`),
  ];
  const hi = (which, idx, role) => {
    const out = {};
    if (which === 1) out[idx] = role;
    if (which === 2) out[SZ + idx] = role;
    return out;
  };
  const merge = (...objs) => Object.assign({}, ...objs);
  frames.push({
    array: renderArr(), highlights: {},
    caption: `Cuckoo hash: two tables of size ${SZ}, two hash functions h1(k)=k mod ${SZ}, h2(k)=(k div ${SZ}) mod ${SZ}. A key lives in T1[h1(k)] OR T2[h2(k)].`,
  });
  frames.push({
    array: renderArr(), highlights: {},
    caption: `Insert tries T1 first. If T1 slot is occupied, evict the resident and reinsert it into T2 — possibly displacing another key, etc. Bounded chain length ⇒ rehash.`,
  });
  for (const k of keys) {
    let cur = k;
    let table = 1;
    frames.push({
      array: renderArr(), highlights: hi(1, h1(cur), 'current'),
      caption: `Insert ${k}. Start with T1[h1(${k})] = T1[${h1(k)}].`,
    });
    for (let step = 0; step < MAX_KICK; step++) {
      const idx = table === 1 ? h1(cur) : h2(cur);
      const slot = table === 1 ? t1 : t2;
      if (slot[idx] == null) {
        slot[idx] = cur;
        frames.push({
          array: renderArr(), highlights: hi(table, idx, 'match'),
          caption: `T${table}[${idx}] is empty — place ${cur}. Done.`,
        });
        break;
      }
      const evicted = slot[idx];
      slot[idx] = cur;
      frames.push({
        array: renderArr(), highlights: merge(hi(table, idx, 'match'), hi(table, idx, 'high')),
        caption: `T${table}[${idx}] holds ${evicted}. Kick it out and place ${cur} here.`,
      });
      cur = evicted;
      const nextTable = table === 1 ? 2 : 1;
      const nextIdx = nextTable === 1 ? h1(cur) : h2(cur);
      frames.push({
        array: renderArr(), highlights: hi(nextTable, nextIdx, 'current'),
        caption: `Re-home evicted key ${cur} into T${nextTable}[${nextIdx}].`,
      });
      table = nextTable;
    }
  }
  frames.push({
    array: renderArr(), highlights: {},
    caption: `Final tables. Lookup is O(1) worst-case: check T1[h1(k)] and T2[h2(k)]. Insertion is amortised O(1) when load factor < ~0.5.`,
  });
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Convex hull trick — lower-envelope of lines, queried at sample x values.
// We render the *envelope* as a tile-array of "m·x+b" strings; query frames
// highlight the winning line at each x.
// ─────────────────────────────────────────────────────────────────────────
function convexHullTrickFrames(variant = 'default') {
  const cfg = {
    default: {
      lines: [
        { m: -2, b: 12 },
        { m: -1, b: 8 },
        { m: 0,  b: 4 },
        { m: 1,  b: 3 },
        { m: 3,  b: 1 },
      ],
      queries: [0, 1, 2, 3, 4, 5, 6],
      note: 'Lower envelope of 5 lines, slopes inserted in increasing order (the CHT-friendly case).',
    },
    parallel: {
      lines: [
        { m: 1, b: 5 },
        { m: 1, b: 8 },
        { m: 2, b: 2 },
        { m: 2, b: 4 },
        { m: 3, b: 0 },
      ],
      queries: [0, 2, 4, 6],
      note: 'Parallel pairs: the higher-intercept line is dominated and discarded immediately.',
    },
    dominated: {
      lines: [
        { m: -1, b: 10 },
        { m: 0,  b: 6 },
        { m: 0,  b: 4 },
        { m: 1,  b: 2 },
        { m: 2,  b: 1 },
      ],
      queries: [-2, 0, 2, 4, 6],
      note: 'Line m=0 b=6 is dominated by m=0 b=4 at every x ⇒ never enters the hull.',
    },
  }[variant] || {};
  const lines = cfg.lines;
  const frames = [];
  const lbl = (l) => `${l.m}x${l.b >= 0 ? '+' : ''}${l.b}`;
  // Cross x where line `a` stops beating line `b` (a below b for x < cross).
  // Defined only when slopes differ: a.m < b.m.
  const crossX = (a, b) => (b.b - a.b) / (a.m - b.m);
  const hull = [];
  // bad: incoming line c makes the previous line obsolete (its winning
  // interval collapses or flips relative to the new candidate).
  const bad = (a, b, c) => {
    if (b.m === c.m) return c.b <= b.b;
    return crossX(a, c) <= crossX(a, b);
  };
  const arr = () => hull.map(lbl);
  frames.push({
    array: arr(), highlights: {},
    caption: `Convex hull trick (min): we keep the lower envelope of [${lines.map(lbl).join(', ')}]. ${cfg.note}`,
  });
  frames.push({
    array: arr(), highlights: {},
    caption: `Insert lines in slope order. Before pushing line c, while the last pair (a, b) is dominated by (a, c), pop b.`,
  });
  for (const l of lines) {
    frames.push({
      array: [...arr(), `+ ${lbl(l)}`], highlights: { [arr().length]: 'current' },
      caption: `Candidate line: y = ${lbl(l)}. Check the right end of the hull for dominated tail.`,
    });
    while (hull.length >= 2 && bad(hull[hull.length - 2], hull[hull.length - 1], l)) {
      const popped = hull.pop();
      frames.push({
        array: arr(), highlights: {},
        caption: `Pop ${lbl(popped)} — it's dominated by the pair (${lbl(hull[hull.length - 1])}, ${lbl(l)}).`,
      });
    }
    hull.push(l);
    frames.push({
      array: arr(), highlights: { [hull.length - 1]: 'match' },
      caption: `Push ${lbl(l)}. Hull is now: [${arr().join(', ')}].`,
    });
  }
  frames.push({
    array: arr(), highlights: Object.fromEntries(arr().map((_, i) => [i, 'visited'])),
    caption: `Hull built. Min envelope contains ${hull.length} of ${lines.length} lines. Now answer queries.`,
  });
  // Queries — for each x, find the index of the winning line by linear scan
  // (the actual pointer-walk would be amortised O(n) total for monotone x).
  for (const x of cfg.queries) {
    let bestI = 0;
    let bestY = hull[0].m * x + hull[0].b;
    for (let i = 1; i < hull.length; i++) {
      const y = hull[i].m * x + hull[i].b;
      if (y < bestY) { bestY = y; bestI = i; }
    }
    frames.push({
      array: arr(), highlights: { [bestI]: 'match' },
      caption: `Query x=${x}: min y = ${bestY}, achieved by line ${lbl(hull[bestI])}.`,
    });
  }
  frames.push({
    array: arr(), highlights: {},
    caption: `Done. With monotone slopes + monotone query x, total work is O(n + q) amortised.`,
  });
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Merkle tree — build hash tree for 4 blocks, then verify block 2.
// We display the levels as a tile-array of "L0[0]=h(B0)" etc.
// ─────────────────────────────────────────────────────────────────────────
function merkleTreeFrames(input = ['alpha', 'bravo', 'charlie', 'delta']) {
  const blocks = (Array.isArray(input) ? input : []).slice(0, 8).map(String);
  while (blocks.length && (blocks.length & (blocks.length - 1)) !== 0) blocks.push(blocks[blocks.length - 1]);
  if (blocks.length < 2) return [{ array: [], caption: 'Need at least 2 blocks for a Merkle tree.' }];
  // Toy hash: short hex so it fits the tile.
  const H = (s) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0').slice(0, 6);
  };
  const frames = [];
  const levels = [];
  const labelLevel = (lvl, hashes) => hashes.map((h, i) => `L${lvl}[${i}]=${h}`);
  // Leaf layer
  const leaves = blocks.map(b => H(b));
  levels.push(leaves);
  frames.push({
    array: labelLevel(0, leaves), highlights: {},
    caption: `Merkle tree over ${blocks.length} blocks [${blocks.join(', ')}]. Step 1: hash each block. Leaves = L0.`,
  });
  for (let i = 0; i < leaves.length; i++) {
    const hi = {};
    hi[i] = 'current';
    frames.push({
      array: labelLevel(0, leaves), highlights: hi,
      caption: `Leaf ${i}: hash("${blocks[i]}") = ${leaves[i]}.`,
    });
  }
  // Build upward
  let cur = leaves;
  let lvl = 0;
  while (cur.length > 1) {
    const next = [];
    const offset = levels.reduce((s, l) => s + l.length, 0);
    for (let i = 0; i < cur.length; i += 2) {
      const combined = H(cur[i] + cur[i + 1]);
      next.push(combined);
      const hi = {};
      // Highlight the two children we're combining + slot for the new parent.
      const childBase = offset - cur.length;
      hi[childBase + i] = 'visited';
      hi[childBase + i + 1] = 'visited';
      // Render snapshot: all levels so far + the new (partial) parent layer.
      const partial = next.slice();
      const flat = [];
      for (let L = 0; L <= lvl; L++) flat.push(...labelLevel(L, levels[L]));
      flat.push(...labelLevel(lvl + 1, partial));
      hi[flat.length - 1] = 'match';
      frames.push({
        array: flat, highlights: hi,
        caption: `L${lvl + 1}[${i / 2}] = hash(L${lvl}[${i}] ‖ L${lvl}[${i + 1}]) = hash(${cur[i]} ‖ ${cur[i + 1]}) = ${combined}.`,
      });
    }
    levels.push(next);
    cur = next;
    lvl += 1;
  }
  const root = cur[0];
  const flatAll = () => {
    const out = [];
    for (let L = 0; L < levels.length; L++) out.push(...labelLevel(L, levels[L]));
    return out;
  };
  frames.push({
    array: flatAll(), highlights: { [flatAll().length - 1]: 'match' },
    caption: `Root hash = ${root}. Anyone who trusts the root can verify any block in O(log n) hashes.`,
  });
  // Inclusion proof for block index 2 (default).
  const target = Math.min(2, blocks.length - 1);
  let idx = target;
  const proofPath = [];
  for (let L = 0; L < levels.length - 1; L++) {
    const sibling = idx ^ 1;
    proofPath.push({ L, sibling, hash: levels[L][sibling], side: sibling < idx ? 'left' : 'right' });
    idx = idx >> 1;
  }
  // Index helper into the flat tile array.
  const flatIndex = (L, i) => {
    let off = 0;
    for (let k = 0; k < L; k++) off += levels[k].length;
    return off + i;
  };
  // Verification frames.
  let runningIdx = target;
  let running = levels[0][target];
  const startHi = {};
  startHi[flatIndex(0, target)] = 'current';
  frames.push({
    array: flatAll(), highlights: startHi,
    caption: `Inclusion proof for block ${target} ("${blocks[target]}"). Verifier knows: leaf hash ${running} + sibling hashes along the path to the root.`,
  });
  for (const step of proofPath) {
    const hi = {};
    hi[flatIndex(step.L, runningIdx)] = 'current';
    hi[flatIndex(step.L, step.sibling)] = 'high';
    frames.push({
      array: flatAll(), highlights: hi,
      caption: `Level ${step.L}: combine running hash ${running} with sibling L${step.L}[${step.sibling}]=${step.hash} (sibling on the ${step.side}).`,
    });
    const combined = step.side === 'left'
      ? H(step.hash + running)
      : H(running + step.hash);
    runningIdx = runningIdx >> 1;
    running = combined;
    const hi2 = {};
    hi2[flatIndex(step.L + 1, runningIdx)] = 'match';
    frames.push({
      array: flatAll(), highlights: hi2,
      caption: `Recomputed L${step.L + 1}[${runningIdx}] = ${combined}. Climb one level.`,
    });
  }
  const ok = running === root;
  frames.push({
    array: flatAll(),
    highlights: { [flatAll().length - 1]: ok ? 'match' : 'high', [flatIndex(0, target)]: 'visited' },
    caption: ok
      ? `Recomputed root = ${running} matches the trusted root ⇒ block ${target} is genuine. Proof size: ${proofPath.length} hashes (O(log n)).`
      : `Recomputed root = ${running} ≠ trusted root ${root} ⇒ tampering detected.`,
  });
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// LRU cache: hashmap + doubly-linked list. Tiles render "key:val" with the
// MRU end on the left and the LRU end on the right. Highlights mark the
// node touched by the latest op; 'high' marks the evicted slot.
// ─────────────────────────────────────────────────────────────────────────
function lruCacheDesignFrames(input = { capacity: 3, ops: 'put 1 A; put 2 B; put 3 C; get 1; put 4 D; get 2; put 5 E' }) {
  const capRaw = Number(input?.capacity);
  const cap = Number.isInteger(capRaw) && capRaw > 0 && capRaw <= 8 ? capRaw : 3;
  const opsRaw = String(input?.ops ?? '').trim();
  const tokens = opsRaw.split(/[;\n]+/).map(s => s.trim()).filter(Boolean);
  const ops = [];
  for (const tok of tokens) {
    const parts = tok.split(/\s+/);
    const kind = (parts[0] || '').toLowerCase();
    if (kind === 'put' && parts.length >= 3) ops.push({ kind: 'put', key: parts[1], val: parts.slice(2).join(' ') });
    else if (kind === 'get' && parts.length >= 2) ops.push({ kind: 'get', key: parts[1] });
  }
  if (!ops.length) return [{ array: [], caption: 'No operations parsed. Use "put k v" or "get k", separated by ;' }];

  const list = []; // MRU at index 0, LRU at end. Each entry: { key, val }
  const map = new Map(); // key -> {key,val}
  const frames = [];
  const tilesNow = () => list.map(n => `${n.key}:${n.val}`);
  const labelArr = () => {
    const arr = tilesNow();
    while (arr.length < cap) arr.push('·:·');
    return arr;
  };
  const idxByKey = (k) => list.findIndex(n => n.key === k);

  frames.push({
    array: labelArr(), highlights: {},
    caption: `LRU cache (capacity ${cap}). Hashmap + doubly-linked list. Leftmost tile = Most-Recently-Used (head); rightmost = Least-Recently-Used (tail). Map gives O(1) lookup; list gives O(1) reorder.`,
  });
  frames.push({
    array: labelArr(), highlights: {},
    caption: `Empty cache. Map: {}. List head ↔ tail with ${cap} empty slot${cap === 1 ? '' : 's'}. Will run ${ops.length} operation${ops.length === 1 ? '' : 's'}.`,
  });

  let stepNum = 0;
  for (const op of ops) {
    stepNum += 1;
    if (op.kind === 'get') {
      const i = idxByKey(op.key);
      if (i === -1) {
        frames.push({
          array: labelArr(), highlights: {},
          caption: `Step ${stepNum}: get(${op.key}) → MISS. Key not in map; list unchanged.`,
        });
      } else {
        const node = list[i];
        const before = labelArr();
        const beforeHi = {}; beforeHi[i] = 'current';
        frames.push({
          array: before, highlights: beforeHi,
          caption: `Step ${stepNum}: get(${op.key}) → HIT at position ${i}. Map says val = ${node.val}. Now unlink and move to head (mark as MRU).`,
        });
        list.splice(i, 1);
        list.unshift(node);
        const afterHi = {}; afterHi[0] = 'match';
        frames.push({
          array: labelArr(), highlights: afterHi,
          caption: `Step ${stepNum}: ${op.key} promoted to head. Map unchanged (same pointer); list reordered in O(1) via prev/next pointers.`,
        });
      }
    } else {
      const i = idxByKey(op.key);
      if (i !== -1) {
        const node = list[i];
        node.val = op.val;
        list.splice(i, 1);
        list.unshift(node);
        const hi = {}; hi[0] = 'match';
        frames.push({
          array: labelArr(), highlights: hi,
          caption: `Step ${stepNum}: put(${op.key}, ${op.val}) → UPDATE. Existing key; overwrite value and move to head.`,
        });
      } else if (list.length < cap) {
        list.unshift({ key: op.key, val: op.val });
        map.set(op.key, list[0]);
        const hi = {}; hi[0] = 'match';
        frames.push({
          array: labelArr(), highlights: hi,
          caption: `Step ${stepNum}: put(${op.key}, ${op.val}) → INSERT. Spare slot available. Add to head; map.set(${op.key}, node). Size now ${list.length}/${cap}.`,
        });
      } else {
        const victim = list[list.length - 1];
        const beforeHi = {}; beforeHi[list.length - 1] = 'high';
        frames.push({
          array: labelArr(), highlights: beforeHi,
          caption: `Step ${stepNum}: put(${op.key}, ${op.val}) → cache full. Evict the LRU tail = "${victim.key}:${victim.val}".`,
        });
        list.pop();
        map.delete(victim.key);
        list.unshift({ key: op.key, val: op.val });
        map.set(op.key, list[0]);
        const afterHi = {}; afterHi[0] = 'match';
        frames.push({
          array: labelArr(), highlights: afterHi,
          caption: `Step ${stepNum}: removed ${victim.key} from map+list, then inserted ${op.key}:${op.val} at head. Two O(1) operations.`,
        });
      }
    }
  }
  frames.push({
    array: labelArr(), highlights: {},
    caption: `Done. Final order (MRU → LRU): [${tilesNow().join(', ') || 'empty'}]. Every op was O(1) thanks to map + DLL — the classic Two-Pointer-Per-Node trick.`,
  });
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Consistent hashing ring: 3 server nodes (A, B, C) + 5 keys (k1..k5)
// placed by their hash modulo the ring. Each key is owned by the next
// server clockwise. Removing B reassigns only B's keys to the next server.
// We model the ring as a graph: ring nodes (positions) form a cycle; we
// reuse 'visited' to mark servers and 'current' for keys being looked up.
// ─────────────────────────────────────────────────────────────────────────
function consistentHashingFrames(variant = 'default') {
  // Slots arranged clockwise around the circle. Each slot is either a server
  // ("S:<id>") or a key ("K:<id>"). The GraphRenderer auto-places nodes evenly.
  const cfg = {
    default: {
      slots: ['S:A', 'K:k1', 'S:B', 'K:k2', 'K:k3', 'S:C', 'K:k4', 'K:k5'],
      remove: 'B',
      note: '3 servers (A, B, C) and 5 keys placed on the ring by hash. Each key is owned by the first server found clockwise.',
    },
    twoServers: {
      slots: ['S:A', 'K:k1', 'K:k2', 'S:B', 'K:k3', 'K:k4', 'K:k5'],
      remove: 'A',
      note: 'Only 2 servers. Half the keys move when one is removed — worst case for consistent hashing without virtual nodes.',
    },
    add: {
      slots: ['S:A', 'K:k1', 'S:B', 'K:k2', 'K:k3', 'S:C', 'K:k4', 'K:k5'],
      add: 'D',
      addAfter: 'K:k3',
      note: 'Adding a new server D between k3 and C only steals the keys that fall in the new arc — bounded redistribution.',
    },
  }[variant] || {};

  const slots = cfg.slots.slice();
  const isServer = (s) => s.startsWith('S:');
  const idOf = (s) => s.slice(2);
  const ownerOf = (i) => {
    const N = slots.length;
    for (let k = 1; k <= N; k++) {
      const j = (i + k) % N;
      if (isServer(slots[j])) return idOf(slots[j]);
    }
    return null;
  };
  const nodes = () => slots.map((s, i) => ({
    id: i,
    label: isServer(s) ? `srv\n${idOf(s)}` : `${idOf(s)}\n→${ownerOf(i) ?? '?'}`,
  }));
  const edges = () => slots.map((_, i) => ({ a: i, b: (i + 1) % slots.length }));

  const snap = (highlights, edgeHi, caption) => {
    const ns = nodes().map((n, i) => ({ ...n, state: highlights[i] }));
    const es = edges().map((e, i) => ({ ...e, state: edgeHi?.[i] }));
    frames.push({ nodes: ns, edges: es, caption });
  };
  const frames = [];

  snap({}, {}, `Consistent hashing: ${cfg.note}`);
  snap({}, {}, `Each position on the ring is a hash value mod 2^m. Walking clockwise from a key, the first server you hit is its owner.`);

  // Highlight each server.
  for (let i = 0; i < slots.length; i++) {
    if (isServer(slots[i])) {
      const hi = {}; hi[i] = 'done';
      snap(hi, {}, `Server ${idOf(slots[i])} sits at ring position ${i}.`);
    }
  }
  // Lookup each key, showing the clockwise walk.
  for (let i = 0; i < slots.length; i++) {
    if (!isServer(slots[i])) {
      const hi = {}; hi[i] = 'current';
      const own = ownerOf(i);
      // Mark each step clockwise until we find a server.
      const N = slots.length;
      for (let k = 1; k <= N; k++) {
        const j = (i + k) % N;
        if (isServer(slots[j])) { hi[j] = 'done'; break; }
        hi[j] = 'frontier';
      }
      snap(hi, {}, `Lookup ${idOf(slots[i])}: walk clockwise from its hash slot; first server hit is ${own} → owner.`);
    }
  }

  if (cfg.remove) {
    const removeIdx = slots.findIndex(s => s === `S:${cfg.remove}`);
    const affected = [];
    for (let i = 0; i < slots.length; i++) {
      if (!isServer(slots[i]) && ownerOf(i) === cfg.remove) affected.push(i);
    }
    const hi = {}; hi[removeIdx] = 'high';
    for (const a of affected) hi[a] = 'current';
    snap(hi, {}, `Now remove server ${cfg.remove}. Only its keys (highlighted: ${affected.map(i => idOf(slots[i])).join(', ') || 'none'}) need reassignment.`);

    // Splice out the removed server.
    slots.splice(removeIdx, 1);
    snap({}, {}, `Ring shrinks; positions renumber but hash values are unchanged. Other keys keep their owner.`);

    for (const _a of affected) {
      // After removal, indices shifted. Recompute by hashed identity.
      // We use label match on `idOf` instead of stale indices.
      const newIdx = slots.findIndex(s => !isServer(s) && idOf(s) === idOf(cfg.slots[_a]));
      if (newIdx === -1) continue;
      const newOwner = ownerOf(newIdx);
      const hi2 = {}; hi2[newIdx] = 'match';
      // Mark new owner too.
      for (let j = 0; j < slots.length; j++) {
        if (isServer(slots[j]) && idOf(slots[j]) === newOwner) hi2[j] = 'done';
      }
      snap(hi2, {}, `${idOf(cfg.slots[_a])} now maps to the next clockwise server = ${newOwner}. Bounded blast radius — only ${cfg.remove}'s share moved.`);
    }
    snap({}, {}, `Done. With N servers and K keys, removing one moves ~K/N keys instead of nearly all (as a plain mod-N hash would).`);
  } else if (cfg.add) {
    const insertAt = slots.findIndex(s => s === cfg.addAfter);
    snap({}, {}, `Insert new server ${cfg.add} at the position just after ${idOf(cfg.addAfter)}.`);
    slots.splice(insertAt + 1, 0, `S:${cfg.add}`);
    const stolen = [];
    for (let i = 0; i < slots.length; i++) {
      if (!isServer(slots[i]) && ownerOf(i) === cfg.add) stolen.push(i);
    }
    const hi = {};
    hi[insertAt + 1] = 'match';
    for (const a of stolen) hi[a] = 'current';
    snap(hi, {}, `Keys in the arc between ${cfg.add} and the previous server move to ${cfg.add}: [${stolen.map(i => idOf(slots[i])).join(', ') || 'none'}]. Other keys are untouched.`);
    snap({}, {}, `Done. Adding a server only steals an arc of size ~ring/N — the same bounded property as removal.`);
  }

  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Paxos basics: 1 proposer (P) + 5 acceptors (A1..A5). Two-phase protocol
// over the array of acceptors. Highlight quorum (3 of 5) per phase.
// Renderer is 'array' with tiles labeled "A1:role".
// ─────────────────────────────────────────────────────────────────────────
function paxosBasicsFrames(variant = 'default') {
  const cfg = {
    default: {
      proposalNum: 5,
      value: 'v1',
      promised: [true, true, true, true, true], // all 5 promise
      accepted: [true, true, true, false, false], // only 3/5 accept (still quorum)
      note: 'Standard happy-path: all promise, quorum (3/5) accepts.',
    },
    contested: {
      proposalNum: 7,
      value: 'v2',
      promised: [false, true, true, false, true], // 3/5 promise — barely a quorum
      accepted: [false, true, true, false, true],
      note: 'Two acceptors are unreachable in Phase 1; the remaining 3 form a quorum and proceed.',
    },
    fails: {
      proposalNum: 4,
      value: 'v3',
      promised: [true, true, false, false, false], // only 2/5 promise — fails quorum
      accepted: [false, false, false, false, false],
      note: 'Only 2/5 acceptors respond — quorum not met. Proposer must back off and retry with a higher number.',
    },
  }[variant] || {};

  const N = 5;
  const labels = (state) => Array.from({ length: N }, (_, i) => `A${i + 1}:${state[i] ?? '·'}`);
  const frames = [];
  const state = Array(N).fill('idle');
  const QUORUM = Math.floor(N / 2) + 1;

  frames.push({
    array: labels(state), highlights: {},
    caption: `Paxos with 5 acceptors. Quorum = ${QUORUM}. ${cfg.note}`,
  });
  frames.push({
    array: labels(state), highlights: {},
    caption: `Proposer P picks proposal number n = ${cfg.proposalNum} (must be unique and higher than any seen). Two phases follow.`,
  });

  // Phase 1: Prepare
  frames.push({
    array: labels(state), highlights: Object.fromEntries(Array.from({ length: N }, (_, i) => [i, 'frontier'])),
    caption: `Phase 1a (Prepare): proposer sends Prepare(n=${cfg.proposalNum}) to all acceptors.`,
  });
  let promises = 0;
  for (let i = 0; i < N; i++) {
    if (cfg.promised[i]) {
      state[i] = `prom(${cfg.proposalNum})`;
      promises += 1;
      const hi = {}; hi[i] = 'visited';
      frames.push({
        array: labels(state), highlights: hi,
        caption: `Phase 1b: A${i + 1} → Promise(n=${cfg.proposalNum}). Pledges to ignore any proposal numbered < ${cfg.proposalNum}. Promises so far: ${promises}/${QUORUM}.`,
      });
    } else {
      const hi = {}; hi[i] = 'high';
      frames.push({
        array: labels(state), highlights: hi,
        caption: `Phase 1b: A${i + 1} silent (unreachable or already promised higher). Promises so far: ${promises}/${QUORUM}.`,
      });
    }
  }

  if (promises < QUORUM) {
    frames.push({
      array: labels(state), highlights: Object.fromEntries(Array.from({ length: N }, (_, i) => [i, 'high'])),
      caption: `Quorum failed: ${promises} promises < ${QUORUM}. Proposer aborts and retries with a higher n.`,
    });
    return frames;
  }

  // Phase 2: Accept
  const hiAll = Object.fromEntries(Array.from({ length: N }, (_, i) => [i, 'frontier']));
  frames.push({
    array: labels(state), highlights: hiAll,
    caption: `Phase 2a (Accept): quorum reached (${promises}/${QUORUM}). Proposer sends Accept(n=${cfg.proposalNum}, v=${cfg.value}) to all who promised.`,
  });
  let accepts = 0;
  for (let i = 0; i < N; i++) {
    if (cfg.accepted[i]) {
      state[i] = `acc(${cfg.value})`;
      accepts += 1;
      const hi = {}; hi[i] = 'done';
      frames.push({
        array: labels(state), highlights: hi,
        caption: `Phase 2b: A${i + 1} → Accepted(n=${cfg.proposalNum}, v=${cfg.value}). Accepts so far: ${accepts}/${QUORUM}.`,
      });
    } else if (cfg.promised[i]) {
      const hi = {}; hi[i] = 'high';
      frames.push({
        array: labels(state), highlights: hi,
        caption: `Phase 2b: A${i + 1} drops the Accept (network loss or saw a higher n). Accepts so far: ${accepts}/${QUORUM}.`,
      });
    }
  }

  if (accepts >= QUORUM) {
    const hi = Object.fromEntries(state.map((s, i) => [i, s.startsWith('acc') ? 'match' : 'visited']));
    frames.push({
      array: labels(state), highlights: hi,
      caption: `Quorum (${accepts}/${QUORUM}) accepted v=${cfg.value}. Value is CHOSEN — no other value can be chosen at this slot.`,
    });
    frames.push({
      array: labels(state), highlights: hi,
      caption: `Learners (often the same nodes) observe a majority of accepts and learn the decision. Paxos guarantees safety: only one value is ever chosen.`,
    });
  } else {
    frames.push({
      array: labels(state), highlights: Object.fromEntries(Array.from({ length: N }, (_, i) => [i, 'high'])),
      caption: `Accept quorum failed: ${accepts}/${QUORUM}. Proposer retries Phase 1 with a higher n.`,
    });
  }
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Circuit breaker state machine: CLOSED → OPEN → HALF_OPEN → CLOSED.
// Renderer is 'array': tiles encode [state, failures, threshold, cooldown].
// Caption narrates the request stream as it trips the breaker.
// ─────────────────────────────────────────────────────────────────────────
function circuitBreakerFrames(input = { threshold: 3, cooldown: 4, stream: 'ok,fail,fail,fail,fail,skip,skip,skip,probe-ok,ok' }) {
  const threshold = Math.max(1, Math.min(10, Number(input?.threshold) || 3));
  const cooldown = Math.max(1, Math.min(20, Number(input?.cooldown) || 4));
  const stream = String(input?.stream ?? '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  if (!stream.length) return [{ array: [], caption: 'No request stream parsed.' }];

  let state = 'CLOSED';
  let failures = 0;
  let openSince = -1;
  const frames = [];
  const tile = () => [
    `state:${state}`,
    `fails:${failures}/${threshold}`,
    `cooldown:${cooldown}s`,
    `openAt:${openSince < 0 ? '-' : openSince}`,
  ];
  const stateRole = () => state === 'CLOSED' ? 'done' : state === 'OPEN' ? 'high' : 'current';

  const stamp = (caption, idx = 0) => {
    const hi = {}; hi[idx] = stateRole();
    frames.push({ array: tile(), highlights: hi, caption });
  };

  stamp(`Circuit breaker init. State=CLOSED. Threshold=${threshold} consecutive failures trips it; cooldown=${cooldown} ticks before a probe. Stream of ${stream.length} requests follows.`);
  stamp(`CLOSED state: forward every request to the downstream; count consecutive failures.`);

  for (let t = 0; t < stream.length; t++) {
    const ev = stream[t].toLowerCase();
    if (state === 'CLOSED') {
      if (ev.startsWith('ok')) {
        failures = 0;
        stamp(`t=${t}: ok → request forwarded; success resets failure counter to 0.`);
      } else if (ev.startsWith('fail')) {
        failures += 1;
        stamp(`t=${t}: fail → counter = ${failures}/${threshold}.`, 1);
        if (failures >= threshold) {
          state = 'OPEN'; openSince = t;
          stamp(`Threshold hit. Trip the breaker → state=OPEN. Stop calling downstream; reject (or fail-fast) for the next ${cooldown} ticks.`, 0);
        }
      } else {
        stamp(`t=${t}: ${ev} ignored in CLOSED state.`);
      }
    } else if (state === 'OPEN') {
      const elapsed = t - openSince;
      if (elapsed >= cooldown) {
        state = 'HALF_OPEN';
        stamp(`t=${t}: cooldown (${cooldown} ticks) elapsed → state=HALF_OPEN. Allow ONE probe request to test the downstream.`, 0);
        // Re-process this event under HALF_OPEN.
        if (ev.startsWith('probe-ok') || ev.startsWith('ok')) {
          state = 'CLOSED'; failures = 0; openSince = -1;
          stamp(`Probe SUCCEEDED → close the breaker. state=CLOSED, failures=0. Normal traffic resumes.`, 0);
        } else if (ev.startsWith('probe-fail') || ev.startsWith('fail')) {
          state = 'OPEN'; openSince = t; failures = threshold;
          stamp(`Probe FAILED → reopen for another ${cooldown} ticks.`, 0);
        } else {
          stamp(`t=${t}: ${ev} ignored in HALF_OPEN state. Waiting for a probe.`);
        }
      } else {
        stamp(`t=${t}: ${ev} short-circuited (state=OPEN, ${cooldown - elapsed} tick${cooldown - elapsed === 1 ? '' : 's'} until cooldown ends). No call to downstream — fail-fast.`, 0);
      }
    } else if (state === 'HALF_OPEN') {
      if (ev.startsWith('probe-ok') || ev.startsWith('ok')) {
        state = 'CLOSED'; failures = 0; openSince = -1;
        stamp(`t=${t}: probe ok → close the breaker. state=CLOSED, failures=0.`, 0);
      } else if (ev.startsWith('probe-fail') || ev.startsWith('fail')) {
        state = 'OPEN'; openSince = t; failures = threshold;
        stamp(`t=${t}: probe failed → reopen for another ${cooldown} ticks.`, 0);
      } else {
        stamp(`t=${t}: ${ev} ignored in HALF_OPEN; only the next probe counts.`);
      }
    }
  }
  stamp(`Done. Final state=${state}. Key idea: don't hammer a struggling service — let it recover, then probe.`);
  return frames;
}

// ─────────────────────────────────────────────────────────────────────────
// Raft consensus: 1 leader + 4 followers. Heartbeats keep the term alive.
// One follower's election timeout fires; it becomes Candidate; votes are
// collected; new leader elected; heartbeat resumes. Uses 'graph' renderer.
// ─────────────────────────────────────────────────────────────────────────
function raftConsensusFrames(variant = 'default') {
  const cfg = {
    default: {
      n: 5,
      initialLeader: 0,
      newLeader: 2,
      term: 1,
      newTerm: 2,
      votes: [0, 2, 3, 4], // who votes for candidate 2 — including self
      note: 'Leader 0 dies. Follower 2 times out, becomes candidate, wins majority (4/5), becomes leader for term 2.',
    },
    split: {
      n: 5,
      initialLeader: 0,
      newLeader: 1,
      term: 3,
      newTerm: 5,
      votes: [1, 3, 4],
      note: 'Split vote requires two election rounds before a leader wins; final candidate 1 wins 3/5 in term 5.',
    },
    threeNode: {
      n: 3,
      initialLeader: 0,
      newLeader: 1,
      term: 1,
      newTerm: 2,
      votes: [1, 2],
      note: '3-node cluster, quorum = 2. Smallest practical Raft setup.',
    },
  }[variant] || {};

  const N = cfg.n;
  const QUORUM = Math.floor(N / 2) + 1;
  const frames = [];
  const roles = Array(N).fill('follower');
  roles[cfg.initialLeader] = 'leader';
  let term = cfg.term;

  const snap = (highlights, edgeHi, caption) => {
    const ns = Array.from({ length: N }, (_, i) => ({
      id: i,
      label: `N${i}\n${roles[i]}\nT${term}`,
      state: highlights[i],
    }));
    const es = edgeHi || [];
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap({ [cfg.initialLeader]: 'done' }, [], `Raft cluster of ${N} nodes. Leader = N${cfg.initialLeader}. Quorum = ${QUORUM}. ${cfg.note}`);

  // Heartbeat round.
  const heartbeats = [];
  for (let i = 0; i < N; i++) if (i !== cfg.initialLeader) heartbeats.push({ a: cfg.initialLeader, b: i, state: 'tree' });
  const hbHi = { [cfg.initialLeader]: 'done' };
  for (let i = 0; i < N; i++) if (i !== cfg.initialLeader) hbHi[i] = 'visited';
  snap(hbHi, heartbeats, `Leader sends AppendEntries (heartbeat) to all followers every ~50ms. Each receipt resets the follower's election timeout (150–300ms).`);
  snap(hbHi, heartbeats, `Followers reply success. Term remains T${term}; cluster steady.`);

  // Leader fails.
  roles[cfg.initialLeader] = 'down';
  snap({ [cfg.initialLeader]: 'high' }, [], `Leader N${cfg.initialLeader} crashes (or network partitions it). No more heartbeats arrive.`);
  snap({ [cfg.initialLeader]: 'high' }, [], `Followers' election timers (randomised 150–300ms) start expiring. The first to expire becomes a candidate.`);

  // Follower times out and starts election.
  const cand = cfg.newLeader;
  term = cfg.newTerm;
  roles[cand] = 'candidate';
  snap({ [cand]: 'current', [cfg.initialLeader]: 'high' }, [],
    `N${cand}'s timer fires first → transitions to CANDIDATE. Increments term to T${term}; votes for itself.`);
  const reqEdges = [];
  for (let i = 0; i < N; i++) if (i !== cand && i !== cfg.initialLeader) reqEdges.push({ a: cand, b: i, state: 'tree' });
  const reqHi = { [cand]: 'current' };
  for (let i = 0; i < N; i++) if (i !== cand && i !== cfg.initialLeader) reqHi[i] = 'frontier';
  snap(reqHi, reqEdges, `Candidate broadcasts RequestVote(term=T${term}). Asks every peer to vote for it.`);

  // Collect votes.
  let voteCount = 0;
  for (const v of cfg.votes) {
    voteCount += 1;
    if (v === cand) {
      snap({ [cand]: 'current' }, [], `Self-vote: candidate counts itself. Votes = ${voteCount}/${QUORUM}.`);
    } else {
      const hi = { [cand]: 'current', [v]: 'done', [cfg.initialLeader]: 'high' };
      const yesEdge = [{ a: v, b: cand, state: 'tree' }];
      snap(hi, yesEdge, `N${v} grants vote (hasn't voted this term; candidate's log is up-to-date). Votes = ${voteCount}/${QUORUM}.`);
    }
    if (voteCount >= QUORUM) break;
  }

  // Win election.
  roles[cand] = 'leader';
  snap({ [cand]: 'match', [cfg.initialLeader]: 'high' }, [], `Quorum (${QUORUM}/${N}) reached → N${cand} wins. Transitions to LEADER for term T${term}.`);

  // Resume heartbeat.
  const newHb = [];
  for (let i = 0; i < N; i++) if (i !== cand && i !== cfg.initialLeader) newHb.push({ a: cand, b: i, state: 'tree' });
  const newHi = { [cand]: 'match', [cfg.initialLeader]: 'high' };
  for (let i = 0; i < N; i++) if (i !== cand && i !== cfg.initialLeader) newHi[i] = 'visited';
  snap(newHi, newHb, `New leader N${cand} immediately sends heartbeats to assert authority — any older leader returning will see term T${term} > its own and step down.`);
  snap(newHi, newHb, `Cluster stable again under N${cand} in T${term}. Safety: at most one leader per term, ensuring log consistency.`);
  return frames;
}

// Dutch National Flag: 3-way partition into [0s | 1s | 2s] using low/mid/high pointers.
function dutchNationalFlagFrames(input = [2, 0, 2, 1, 1, 0]) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  let low = 0, mid = 0, high = n - 1;
  const hi = () => ({ [low]: 'low', [mid]: 'mid', [high]: 'high' });

  frames.push({ array: [...a], caption: `Dutch National Flag. Partition a 0/1/2 array into three regions in one pass: [0s | 1s | unknown | 2s], with low / mid / high pointers tracking the boundaries.` });
  frames.push({ array: [...a], highlights: hi(), caption: `Invariants: a[0..low-1] all 0, a[low..mid-1] all 1, a[mid..high] unknown, a[high+1..n-1] all 2. Initially low=0, mid=0, high=${high}.` });

  let step = 0;
  while (mid <= high) {
    step += 1;
    const v = a[mid];
    frames.push({ array: [...a], highlights: hi(), caption: `Step ${step}: inspect a[mid=${mid}] = ${v}. low=${low}, mid=${mid}, high=${high}.` });
    if (v === 0) {
      if (low !== mid) [a[low], a[mid]] = [a[mid], a[low]];
      frames.push({ array: [...a], highlights: { [low]: 'match', [mid]: 'match', [high]: 'high' }, caption: `It's a 0 — swap a[low=${low}] ↔ a[mid=${mid}], then low++ and mid++. The 0 joins the left zone; whatever moved into mid was already 1 (scanned), so mid advances too.` });
      low += 1; mid += 1;
    } else if (v === 1) {
      frames.push({ array: [...a], highlights: { [mid]: 'match', [low]: 'low', [high]: 'high' }, caption: `It's a 1 — it's already in the right place between the 0-zone and the unknown zone. Just mid++.` });
      mid += 1;
    } else {
      [a[mid], a[high]] = [a[high], a[mid]];
      frames.push({ array: [...a], highlights: { [mid]: 'match', [high]: 'match', [low]: 'low' }, caption: `It's a 2 — swap a[mid=${mid}] ↔ a[high=${high}] and high--. We do NOT advance mid: the value just swapped in from high is still unknown.` });
      high -= 1;
    }
  }
  frames.push({ array: [...a], highlights: Object.fromEntries(a.map((_, i) => [i, 'match'])), caption: `Done in one pass: [${a.join(', ')}]. mid (${mid}) crossed high (${high}) — unknown region is empty. O(n) time, O(1) space.` });
  return frames;
}

// Cyclic sort: place every value v ∈ [1..n] at index v-1 using index-targeted swaps.
function arrayCyclicSortFrames(input = [3, 1, 5, 4, 2]) {
  const a = [...input];
  const n = a.length;
  const frames = [];
  frames.push({ array: [...a], caption: `Cyclic sort. The array holds a permutation of 1..${n}. Each value v belongs at index v-1, so swap it home directly — no comparisons.` });
  frames.push({ array: [...a], highlights: { 0: 'mid' }, caption: `Walk i from 0 to ${n - 1}. At each i, keep swapping a[i] to its home until a[i] == i+1 (already home).` });

  let i = 0, step = 0;
  while (i < n) {
    const v = a[i];
    const target = v - 1;
    if (a[i] === i + 1) {
      step += 1;
      frames.push({ array: [...a], highlights: { [i]: 'match' }, caption: `Step ${step}: i=${i}, a[${i}] = ${v} = i+1. Already home — move on.` });
      i += 1;
    } else {
      step += 1;
      frames.push({ array: [...a], highlights: { [i]: 'mid', [target]: 'high' }, caption: `Step ${step}: i=${i}, a[${i}] = ${v}. Its home is index ${target}. Swap a[${i}] ↔ a[${target}].` });
      [a[i], a[target]] = [a[target], a[i]];
      frames.push({ array: [...a], highlights: { [i]: 'low', [target]: 'match' }, caption: `After swap: value ${v} now sits at its home index ${target}. Re-check a[${i}] = ${a[i]} — it may also need to be sent home before we advance i.` });
    }
  }
  frames.push({ array: [...a], highlights: Object.fromEntries(a.map((_, k) => [k, 'match'])), caption: `Done. Each value sits at index value-1. At most 2n swaps total — every swap places at least one element permanently. O(n) time, O(1) space.` });
  return frames;
}

// Binary search on the answer: monotone predicate over the integer answer axis.
// Use the classic "min ship capacity for D days" framing on axis 1..50.
function binarySearchOnAnswerFrames() {
  const LO = 1, HI = 50;
  const TRUE_AT = 24; // smallest capacity for which predicate(cap) is true
  const frames = [];
  const axis = Array.from({ length: HI - LO + 1 }, (_, i) => LO + i);
  const eliminated = new Set();
  const idxOf = (cap) => cap - LO;

  frames.push({ array: axis, caption: `Binary search on the answer. Axis = candidate capacities 1..${HI}. Predicate P(cap) = "can finish in D days with ship capacity cap?" P is monotone: bigger ship -> still feasible.` });
  frames.push({ array: axis, caption: `Because P flips false -> true exactly once on the axis, we can binary-search for the smallest cap with P(cap) = true — that's the minimum capacity.` });

  let lo = LO, hi = HI, step = 0, ans = HI;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ok = mid >= TRUE_AT;
    step += 1;
    frames.push({
      array: axis,
      highlights: { [idxOf(lo)]: 'low', [idxOf(hi)]: 'high', [idxOf(mid)]: 'mid' },
      eliminated: new Set(eliminated),
      caption: `Step ${step}: lo=${lo}, hi=${hi}, mid=${mid}. Evaluate predicate P(${mid}).`,
    });
    if (ok) {
      ans = mid;
      for (let k = mid; k <= hi; k++) eliminated.add(idxOf(k));
      frames.push({
        array: axis,
        highlights: { [idxOf(mid)]: 'match' },
        eliminated: new Set(eliminated),
        caption: `P(${mid}) = true — ${mid} is feasible. Record ans=${mid}. The answer is ≤ ${mid}, so discard the right half (mid..${hi}) and search lo..${mid - 1}.`,
      });
      hi = mid - 1;
    } else {
      for (let k = lo; k <= mid; k++) eliminated.add(idxOf(k));
      frames.push({
        array: axis,
        highlights: { [idxOf(mid)]: 'mid' },
        eliminated: new Set(eliminated),
        caption: `P(${mid}) = false — ${mid} is too small. The answer is > ${mid}. Discard the left half (${lo}..${mid}) and search ${mid + 1}..${hi}.`,
      });
      lo = mid + 1;
    }
  }
  frames.push({
    array: axis,
    highlights: { [idxOf(ans)]: 'match' },
    eliminated: new Set(eliminated),
    caption: `Search space exhausted in ${step} probes (log2(${HI}) ≈ ${Math.ceil(Math.log2(HI))}). Minimum feasible capacity = ${ans}.`,
  });
  return frames;
}

// Coin change (min coins) — 1D DP fill over amount 0..target.
function coinChangeVariantsFrames(coins = [1, 2, 5], amount = 11) {
  const INF = Infinity;
  const dp = Array(amount + 1).fill(INF);
  const pick = Array(amount + 1).fill(null);
  dp[0] = 0;
  const frames = [];
  const render = () => dp.map(v => v === INF ? 0 : v);

  frames.push({ array: render(), caption: `Coin change (min coins). coins = [${coins.join(', ')}], amount = ${amount}. dp[x] = min coins to make x; dp[0] = 0; others start as ∞ (shown as 0-height empty bars).` });
  frames.push({ array: render(), highlights: { 0: 'match' }, caption: `Recurrence: dp[x] = 1 + min over coin c in coins (where c ≤ x) of dp[x - c]. Fill left to right so subproblems are already solved.` });

  for (let x = 1; x <= amount; x++) {
    frames.push({ array: render(), highlights: { [x]: 'mid' }, caption: `x = ${x}. Try every coin and pick the one that leaves the smallest dp[x - c].` });
    let best = INF, bestCoin = null;
    for (const c of coins) {
      if (c <= x && dp[x - c] !== INF) {
        const cand = dp[x - c] + 1;
        frames.push({
          array: render(),
          highlights: { [x]: 'mid', [x - c]: 'low' },
          caption: `coin ${c}: dp[${x - c}] = ${dp[x - c]} -> candidate = ${dp[x - c]} + 1 = ${cand}.`,
        });
        if (cand < best) { best = cand; bestCoin = c; }
      } else if (c > x) {
        frames.push({ array: render(), highlights: { [x]: 'mid' }, caption: `coin ${c}: skip — coin > x.` });
      }
    }
    dp[x] = best;
    pick[x] = bestCoin;
    frames.push({
      array: render(),
      highlights: { [x]: 'match', ...(bestCoin != null ? { [x - bestCoin]: 'low' } : {}) },
      caption: bestCoin != null
        ? `dp[${x}] = ${best} using coin ${bestCoin} on top of dp[${x - bestCoin}] = ${dp[x - bestCoin]}.`
        : `dp[${x}] = ∞ — no coin combination reaches ${x}.`,
    });
  }

  // Trace back the chosen coins for the final answer.
  const chosen = [];
  let cur = amount;
  while (cur > 0 && pick[cur] != null) { chosen.push(pick[cur]); cur -= pick[cur]; }
  frames.push({
    array: render(),
    highlights: Object.fromEntries(dp.map((_, i) => [i, 'match'])),
    caption: dp[amount] === INF
      ? `Done. dp[${amount}] = ∞ — amount ${amount} is unreachable with these coins.`
      : `Done. dp[${amount}] = ${dp[amount]} coins, picked as [${chosen.join(' + ')}] = ${amount}. O(amount * |coins|) time, O(amount) space.`,
  });
  return frames;
}

// Rabin-Karp: rolling polynomial hash of a window over the text; compare with pattern hash.
function hashRollingRabinKarpFrames(pattern = 'cd', text = 'abcabcd') {
  const P = String(pattern);
  const T = String(text);
  const m = P.length, n = T.length;
  const BASE = 26;
  const MOD = 1000003;
  const charVal = (c) => (c.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1);
  const frames = [];

  if (m === 0 || n < m) {
    return [{ array: T.split(''), caption: `Pattern longer than text or empty — nothing to do.` }];
  }

  // High power for removing the leading char: BASE^(m-1) mod MOD.
  let highPow = 1;
  for (let k = 0; k < m - 1; k++) highPow = (highPow * BASE) % MOD;

  // Initial pattern hash and first window hash.
  let pHash = 0, wHash = 0;
  for (let k = 0; k < m; k++) {
    pHash = (pHash * BASE + charVal(P[k])) % MOD;
    wHash = (wHash * BASE + charVal(T[k])) % MOD;
  }

  const windowHi = (i) => {
    const h = {};
    for (let k = i; k < i + m; k++) h[k] = 'mid';
    return h;
  };

  frames.push({ array: T.split(''), caption: `Rabin-Karp. Pattern = "${P}" (length ${m}), text = "${T}" (length ${n}). Slide a window of length ${m} across the text; compare hashes first, characters only on a match.` });
  frames.push({ array: T.split(''), caption: `Polynomial hash with base ${BASE}, mod ${MOD}. hash("${P}") = ${pHash}. Compute the first window hash directly, then update each step in O(1).` });
  frames.push({ array: T.split(''), highlights: windowHi(0), caption: `Window i=0 → "${T.slice(0, m)}". hash = ${wHash}. Pattern hash = ${pHash}. ${wHash === pHash ? 'Match candidate — verify chars.' : 'No match — slide.'}` });

  let i = 0;
  let matchAt = -1;
  while (true) {
    if (wHash === pHash) {
      const sub = T.slice(i, i + m);
      if (sub === P) {
        frames.push({
          array: T.split(''),
          highlights: Object.fromEntries(Array.from({ length: m }, (_, k) => [i + k, 'match'])),
          caption: `Hash match AND char check passes: "${sub}" at i=${i}. Found "${P}" at index ${i}.`,
        });
        matchAt = i;
        break;
      } else {
        frames.push({
          array: T.split(''),
          highlights: windowHi(i),
          caption: `Hash collision at i=${i} (hashes match but "${sub}" ≠ "${P}"). Keep sliding.`,
        });
      }
    }
    if (i + m >= n) break;
    // Roll the hash forward by one: drop T[i], add T[i+m].
    const drop = charVal(T[i]);
    const add = charVal(T[i + m]);
    const before = wHash;
    wHash = ((wHash - drop * highPow) % MOD + MOD) % MOD;
    wHash = (wHash * BASE + add) % MOD;
    i += 1;
    frames.push({
      array: T.split(''),
      highlights: windowHi(i),
      caption: `Roll: subtract T[${i - 1}]="${T[i - 1]}"·${BASE}^${m - 1}, multiply by ${BASE}, add T[${i + m - 1}]="${T[i + m - 1]}". hash ${before} -> ${wHash}. Pattern hash = ${pHash}. ${wHash === pHash ? 'Candidate.' : 'No match.'}`,
    });
  }
  if (matchAt === -1) {
    frames.push({ array: T.split(''), caption: `No occurrence of "${P}" found in "${T}". Total work O(n + m) average with a good hash; O(n·m) worst case if many collisions.` });
  } else {
    frames.push({
      array: T.split(''),
      highlights: Object.fromEntries(Array.from({ length: m }, (_, k) => [matchAt + k, 'match'])),
      caption: `Done. "${P}" found at index ${matchAt} in "${T}". Each window hash updated in O(1); total O(n + m) on average.`,
    });
  }
  return frames;
}

// ----------------------------------------------------------------------------
// New visualization frame builders.
// Pattern: each function returns a list of { ...rendererSpecificState, caption }.
// Narrations are declarative — they describe what the algorithm does, not what
// the reader/builder is doing.
// ----------------------------------------------------------------------------

// Find peak element: classic O(log n) binary search where the slope direction
// tells which half hides a peak.
function findPeakElementFrames(arr = [1, 2, 1, 3, 5, 6, 4]) {
  const frames = [];
  let lo = 0, hi = arr.length - 1;
  const eliminated = new Set();
  frames.push({ array: arr, caption: `Find a peak (any index strictly greater than its neighbors). Array length ${arr.length}. Edges are -infinity by convention.` });
  frames.push({ array: arr, highlights: { [lo]: 'low', [hi]: 'high' }, caption: `Anchor lo = 0, hi = ${hi}. Invariant: a peak lives somewhere in [lo, hi].` });
  let step = 0;
  while (lo < hi) {
    step += 1;
    const mid = Math.floor((lo + hi) / 2);
    frames.push({ array: arr, highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' }, eliminated: new Set(eliminated), caption: `Step ${step}. mid = ${mid}. Compare arr[${mid}] = ${arr[mid]} with arr[${mid + 1}] = ${arr[mid + 1]}.` });
    if (arr[mid] < arr[mid + 1]) {
      for (let k = lo; k <= mid; k++) eliminated.add(k);
      lo = mid + 1;
      frames.push({ array: arr, highlights: { [lo]: 'low', [hi]: 'high' }, eliminated: new Set(eliminated), caption: `Step ${step}. Slope rises to the right, so a peak must exist on indices ${lo}..${hi}. Drop the left half.` });
    } else {
      for (let k = mid + 1; k <= hi; k++) eliminated.add(k);
      hi = mid;
      frames.push({ array: arr, highlights: { [lo]: 'low', [hi]: 'high' }, eliminated: new Set(eliminated), caption: `Step ${step}. Slope falls to the right, so a peak is reachable on ${lo}..${hi} (mid itself is still a candidate).` });
    }
  }
  frames.push({ array: arr, highlights: { [lo]: 'match' }, eliminated: new Set(eliminated), caption: `Converged at index ${lo} with value ${arr[lo]}. That is a peak: each neighbor is smaller or off the edge.` });
  return frames;
}

// Next greater element using a monotonic decreasing stack scanned right to
// left. Each bar holds its NGE once popped.
function nextGreaterElementFrames(arr = [4, 5, 2, 25, 7, 8]) {
  const frames = [];
  const n = arr.length;
  const result = Array(n).fill(-1);
  const stack = [];
  frames.push({ array: arr, caption: `Find the next greater element to the right of each index. Walk left to right with a monotonic decreasing stack of indices waiting for their answer.` });
  for (let i = 0; i < n; i++) {
    frames.push({ array: arr, highlights: { [i]: 'mid', ...Object.fromEntries(stack.map((idx) => [idx, 'low'])) }, caption: `Inspect index ${i} (value ${arr[i]}). Stack holds [${stack.join(', ') || 'empty'}] — indices still hunting for a larger value.` });
    while (stack.length && arr[stack[stack.length - 1]] < arr[i]) {
      const popped = stack.pop();
      result[popped] = arr[i];
      frames.push({ array: arr, highlights: { [popped]: 'match', [i]: 'mid', ...Object.fromEntries(stack.map((idx) => [idx, 'low'])) }, caption: `arr[${popped}] = ${arr[popped]} < ${arr[i]}, so NGE[${popped}] = ${arr[i]}. Pop index ${popped} off the stack — its quest is over.` });
    }
    stack.push(i);
    frames.push({ array: arr, highlights: { [i]: 'low', ...Object.fromEntries(stack.slice(0, -1).map((idx) => [idx, 'low'])) }, caption: `Push index ${i}. Stack now [${stack.join(', ')}]. Values along the stack stay strictly decreasing.` });
  }
  for (const idx of stack) {
    frames.push({ array: arr, highlights: { [idx]: 'eliminated' }, caption: `Index ${idx} (value ${arr[idx]}) finishes without a larger element to its right — NGE stays -1.` });
  }
  frames.push({ array: result.map(v => v === -1 ? 0 : v), caption: `Final NGE per index: [${result.join(', ')}]. Each index pushed and popped at most once, so total work is O(n).` });
  return frames;
}

// Monotonic deque tracking the maximum of every fixed-size window.
function monotonicDequeFrames(arr = [1, 3, -1, -3, 5, 3, 6, 7], k = 3) {
  const frames = [];
  const dq = [];
  const out = [];
  frames.push({ array: arr, caption: `Sliding window maximum, window size k = ${k}. Use a deque holding indices whose values stay strictly decreasing from front to back. The front is always the current max.` });
  for (let i = 0; i < arr.length; i++) {
    while (dq.length && dq[0] <= i - k) {
      const dropped = dq.shift();
      frames.push({ array: arr, highlights: { [i]: 'mid', [dropped]: 'eliminated' }, caption: `Index ${dropped} left the window (i = ${i}, window starts at ${i - k + 1}). Drop it from the front of the deque.` });
    }
    while (dq.length && arr[dq[dq.length - 1]] < arr[i]) {
      const popped = dq.pop();
      frames.push({ array: arr, highlights: { [i]: 'mid', [popped]: 'eliminated' }, caption: `arr[${popped}] = ${arr[popped]} is smaller than the new arr[${i}] = ${arr[i]}, so it can never be the max again. Pop it from the back.` });
    }
    dq.push(i);
    frames.push({ array: arr, highlights: { [i]: 'low', [dq[0]]: 'match', ...Object.fromEntries(dq.slice(1, -1).map((idx) => [idx, 'mid'])) }, caption: `Push index ${i}. Deque now [${dq.join(', ')}]. Front index ${dq[0]} carries the current window max ${arr[dq[0]]}.` });
    if (i >= k - 1) {
      out.push(arr[dq[0]]);
      frames.push({ array: arr, highlights: { [dq[0]]: 'match' }, caption: `Window [${i - k + 1}..${i}] complete. Record max = ${arr[dq[0]]}. Running output: [${out.join(', ')}].` });
    }
  }
  frames.push({ array: out, caption: `Sliding window maxes: [${out.join(', ')}]. Each index is pushed and popped at most once, so total O(n).` });
  return frames;
}

// Largest rectangle in histogram with a monotonic stack of indices whose bars
// are strictly increasing.
function largestRectangleHistogramFrames(arr = [2, 1, 5, 6, 2, 3]) {
  const frames = [];
  const stack = [];
  let best = 0;
  let bestRange = [-1, -1];
  frames.push({ array: arr, caption: `Largest rectangle in a histogram. Scan left to right with a monotonic increasing stack of indices; when a shorter bar arrives, the popped bar is bounded on the right.` });
  for (let i = 0; i <= arr.length; i++) {
    const cur = i === arr.length ? 0 : arr[i];
    frames.push({ array: arr.concat(i === arr.length ? [0] : []), highlights: i < arr.length ? { [i]: 'mid', ...Object.fromEntries(stack.map((idx) => [idx, 'low'])) } : { ...Object.fromEntries(stack.map((idx) => [idx, 'low'])) }, caption: i < arr.length ? `Index ${i}, height ${cur}. Stack [${stack.join(', ') || 'empty'}].` : `Sentinel 0 at end forces every remaining bar to pop.` });
    while (stack.length && arr[stack[stack.length - 1]] > cur) {
      const top = stack.pop();
      const h = arr[top];
      const left = stack.length ? stack[stack.length - 1] : -1;
      const width = i - left - 1;
      const area = h * width;
      if (area > best) { best = area; bestRange = [left + 1, i - 1]; }
      frames.push({ array: arr, highlights: { [top]: 'match', ...Object.fromEntries(Array.from({ length: width }, (_, k) => [left + 1 + k, 'mid'])) }, caption: `Pop index ${top} (height ${h}). Its rectangle spans columns ${left + 1}..${i - 1}, width ${width}, area ${h} x ${width} = ${area}. Best so far ${best}.` });
    }
    stack.push(i);
  }
  frames.push({ array: arr, highlights: Object.fromEntries(Array.from({ length: bestRange[1] - bestRange[0] + 1 }, (_, k) => [bestRange[0] + k, 'match'])), caption: `Maximum area ${best} spanning indices ${bestRange[0]}..${bestRange[1]}. Each index is pushed and popped at most once, total O(n).` });
  return frames;
}

// Subarray sum equals K via prefix-sum hash counts.
function subarraySumEqualsKFrames(arr = [1, 1, 1, 2, -1, 1], k = 2) {
  const frames = [];
  const counts = new Map();
  counts.set(0, 1);
  let prefix = 0, total = 0;
  frames.push({ array: arr, caption: `Count subarrays whose sum equals k = ${k}. Walk left to right tracking the running prefix sum; for each prefix p, every earlier prefix equal to p - k closes one valid subarray.` });
  frames.push({ array: arr, caption: `Seed the hashmap with prefix 0 -> 1, so subarrays that start at index 0 also count.` });
  for (let i = 0; i < arr.length; i++) {
    prefix += arr[i];
    const need = prefix - k;
    const got = counts.get(need) || 0;
    total += got;
    frames.push({ array: arr, highlights: { [i]: 'mid' }, caption: `Index ${i}. prefix = ${prefix}. Need earlier prefix equal to ${need}. Hashmap has ${got} such entry/entries; total subarrays so far = ${total}.` });
    counts.set(prefix, (counts.get(prefix) || 0) + 1);
    frames.push({ array: arr, highlights: { [i]: 'low' }, caption: `Record prefix ${prefix} in the hashmap (now count ${counts.get(prefix)}). Map state: {${[...counts.entries()].map(([a, b]) => `${a}:${b}`).join(', ')}}.` });
  }
  frames.push({ array: arr, caption: `Done. Total subarrays summing to ${k}: ${total}. One pass, O(n) time and space.` });
  return frames;
}

// Jump Game II — minimum jumps to reach the end (greedy BFS-style layers).
function jumpGameIIFrames(arr = [2, 3, 1, 1, 4]) {
  const frames = [];
  const n = arr.length;
  let jumps = 0, curEnd = 0, farthest = 0;
  frames.push({ array: arr, caption: `Minimum jumps to reach index ${n - 1}. Treat reachable indices as BFS layers: each "jump" advances to the farthest index reachable from the current layer.` });
  for (let i = 0; i < n - 1; i++) {
    farthest = Math.max(farthest, i + arr[i]);
    frames.push({ array: arr, highlights: { [i]: 'mid', [Math.min(farthest, n - 1)]: 'low', [curEnd]: 'high' }, caption: `Index ${i}: max jump arr[${i}] = ${arr[i]} reaches up to ${i + arr[i]}. Layer farthest now ${farthest}. Current layer ends at ${curEnd}.` });
    if (i === curEnd) {
      jumps += 1;
      curEnd = farthest;
      frames.push({ array: arr, highlights: { [Math.min(curEnd, n - 1)]: 'high' }, caption: `Hit the end of the current layer at index ${i}. Commit one jump (total now ${jumps}). New layer ends at index ${curEnd}.` });
    }
  }
  frames.push({ array: arr, highlights: { [n - 1]: 'match' }, caption: `Final answer: ${jumps} jump${jumps === 1 ? '' : 's'} to reach index ${n - 1}. Each index inspected once — O(n).` });
  return frames;
}

// Merge overlapping intervals after sorting by start.
function intervalMergeFrames(intervals = [[1, 3], [2, 6], [8, 10], [9, 11], [15, 18]]) {
  const frames = [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const labels = sorted.map(([s, e]) => `[${s},${e}]`);
  frames.push({ array: labels, caption: `Merge overlapping intervals. Start by sorting by left endpoint: ${labels.join(' ')}.` });
  const merged = [sorted[0].slice()];
  frames.push({ array: labels, highlights: { 0: 'match' }, caption: `Seed the result with the first interval [${merged[0][0]},${merged[0][1]}].` });
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    const last = merged[merged.length - 1];
    frames.push({ array: labels, highlights: { [i]: 'mid', [i - 1]: 'low' }, caption: `Inspect interval ${i}: [${s},${e}]. Last merged is [${last[0]},${last[1]}].` });
    if (s <= last[1]) {
      const newEnd = Math.max(last[1], e);
      frames.push({ array: labels, highlights: { [i]: 'mid' }, caption: `${s} <= ${last[1]}, so they overlap. Extend last to [${last[0]}, max(${last[1]}, ${e}) = ${newEnd}].` });
      last[1] = newEnd;
    } else {
      merged.push([s, e]);
      frames.push({ array: labels, highlights: { [i]: 'match' }, caption: `${s} > ${last[1]}, so the new interval starts after the previous one ended. Append [${s},${e}] as a fresh group.` });
    }
  }
  frames.push({ array: merged.map(([s, e]) => `[${s},${e}]`), caption: `Merged result: ${merged.map(([s, e]) => `[${s},${e}]`).join(' ')}. Sort dominates at O(n log n); the sweep itself is O(n).` });
  return frames;
}

// Gas station circular tour — single-pass tank tracker plus running deficit.
function gasStationCircularFrames(gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]) {
  const frames = [];
  const n = gas.length;
  const net = gas.map((g, i) => g - cost[i]);
  let total = 0, tank = 0, start = 0;
  frames.push({ array: net, caption: `Circular gas-station tour. Net change at station i is gas[i] - cost[i] = [${net.join(', ')}]. If the total is negative, no solution exists.` });
  for (let i = 0; i < n; i++) {
    total += net[i];
    tank += net[i];
    frames.push({ array: net, highlights: { [i]: 'mid', [start]: 'low' }, caption: `Station ${i}: net ${net[i] >= 0 ? '+' + net[i] : net[i]}. Running tank from current start ${start} is ${tank}; total over all stations so far ${total}.` });
    if (tank < 0) {
      frames.push({ array: net, highlights: { [start]: 'eliminated', [i]: 'mid' }, caption: `Tank went negative at station ${i}. Any start in ${start}..${i} fails before reaching ${i + 1}, so reset start to ${i + 1} and empty the tank.` });
      start = i + 1;
      tank = 0;
    }
  }
  if (total < 0) {
    frames.push({ array: net, caption: `Total net = ${total} < 0. The full loop is impossible — return -1.` });
  } else {
    frames.push({ array: net, highlights: { [start]: 'match' }, caption: `Total ${total} >= 0 and the tank stayed non-negative from station ${start} onward. Answer: start at index ${start}. Single O(n) pass.` });
  }
  return frames;
}

// Best time to buy and sell stock — multiple transactions (greedy sum of
// every positive day-to-day delta).
function bestStockMultipleTxFrames(arr = [7, 1, 5, 3, 6, 4]) {
  const frames = [];
  let profit = 0;
  frames.push({ array: arr, caption: `Stock prices. With unlimited transactions and no cooldown, the optimal profit is the sum of every positive day-to-day increase.` });
  for (let i = 1; i < arr.length; i++) {
    const diff = arr[i] - arr[i - 1];
    if (diff > 0) {
      profit += diff;
      frames.push({ array: arr, highlights: { [i - 1]: 'low', [i]: 'match' }, caption: `Day ${i - 1} to ${i}: ${arr[i - 1]} -> ${arr[i]}, gain +${diff}. Add to profit (now ${profit}).` });
    } else {
      frames.push({ array: arr, highlights: { [i - 1]: 'low', [i]: 'eliminated' }, caption: `Day ${i - 1} to ${i}: ${arr[i - 1]} -> ${arr[i]}, change ${diff}. Skip this day pair.` });
    }
  }
  frames.push({ array: arr, caption: `Done. Maximum profit = ${profit}. Each positive slope is captured exactly once, so total O(n).` });
  return frames;
}

// Fisher-Yates shuffle — pick index from the unfixed suffix and swap.
function fisherYatesShuffleFrames(arr = ['A', 'B', 'C', 'D', 'E', 'F']) {
  const frames = [];
  const a = [...arr];
  const n = a.length;
  // Deterministic pseudo-shuffle so the visualization is stable across renders.
  const picks = [3, 1, 0, 2, 0, 0]; // chosen for the default length 6
  frames.push({ array: a.slice(), caption: `Fisher-Yates shuffle. Walk i from ${n - 1} down to 1; at each step pick a random j in [0, i] and swap a[i] with a[j]. Every permutation ends up equally likely.` });
  for (let i = n - 1; i > 0; i--) {
    const j = picks[n - 1 - i] % (i + 1);
    frames.push({ array: a.slice(), highlights: { [i]: 'high', [j]: 'mid' }, caption: `i = ${i}. Pick j = ${j} from [0, ${i}]. About to swap a[${i}] (${a[i]}) with a[${j}] (${a[j]}).` });
    [a[i], a[j]] = [a[j], a[i]];
    frames.push({ array: a.slice(), highlights: { [i]: 'match' }, eliminated: new Set(Array.from({ length: n - i }, (_, k) => i + k)), caption: `Swap complete. Index ${i} is now fixed (${a[i]}). The unfixed prefix shrinks to indices 0..${i - 1}.` });
  }
  frames.push({ array: a.slice(), caption: `Done. Shuffled order: ${a.join(' ')}. Total work O(n) with one random draw per step.` });
  return frames;
}

// Trie autocomplete — insert words then prefix-walk + DFS collect.
function trieAutocompleteFrames(words = ['cat', 'car', 'card', 'care', 'dog'], prefix = 'ca') {
  const frames = [];
  const root = { children: {}, end: false };
  const repr = () => {
    const out = ['root'];
    const walk = (node, depth) => {
      const keys = Object.keys(node.children).sort();
      for (const k of keys) {
        out.push('  '.repeat(depth) + '-> ' + k + (node.children[k].end ? '*' : ''));
        walk(node.children[k], depth + 1);
      }
    };
    walk(root, 1);
    return out.join('\n');
  };
  frames.push({ array: words, caption: `Trie autocomplete. Insert ${words.length} words: ${words.join(', ')}. Each character is one edge; words ending here are marked with *.` });
  for (const w of words) {
    let cur = root;
    for (const ch of w) {
      if (!cur.children[ch]) cur.children[ch] = { children: {}, end: false };
      cur = cur.children[ch];
    }
    cur.end = true;
    frames.push({ array: repr().split('\n'), caption: `Insert "${w}". Walk character by character, allocating nodes as needed; mark final node with end = true.` });
  }
  // Prefix walk
  let cur = root;
  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix[i];
    if (!cur.children[ch]) {
      frames.push({ array: [prefix], caption: `Searching prefix "${prefix}" — no child '${ch}' at depth ${i}. No suggestions.` });
      return frames;
    }
    cur = cur.children[ch];
    frames.push({ array: [prefix.slice(0, i + 1)], caption: `Walk character '${ch}' (depth ${i + 1}). Stay on the path because the edge exists.` });
  }
  // DFS collect
  const results = [];
  const dfs = (node, path) => {
    if (node.end) results.push(path);
    for (const k of Object.keys(node.children).sort()) dfs(node.children[k], path + k);
  };
  dfs(cur, prefix);
  frames.push({ array: results, caption: `DFS from the prefix node collects every descendant marked end = true. Suggestions for "${prefix}": ${results.join(', ') || 'none'}.` });
  return frames;
}

// Island count — BFS flood fill over a grid.
function islandCountBfsFrames() {
  const grid = [
    ['1', '1', '0', '0', '1'],
    ['1', '0', '0', '1', '1'],
    ['0', '0', '1', '1', '0'],
    ['0', '1', '0', '0', '0'],
  ];
  const rows = grid.length, cols = grid[0].length;
  const state = grid.map(row => row.map(c => c === '1' ? '#' : '.'));
  const frames = [];
  const snap = () => state.map(r => r.slice());
  frames.push({ grid: snap(), caption: `Count islands in a ${rows} x ${cols} grid. '#' is land, '.' is water. Scan in row-major order; whenever an unvisited land cell appears, BFS its component to drown the whole island, then bump the count.` });
  let count = 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (state[r][c] === '#' && !visited[r][c]) {
        count += 1;
        const q = [[r, c]];
        visited[r][c] = true;
        state[r][c] = 'S';
        frames.push({ grid: snap(), caption: `New island #${count} discovered at (${r}, ${c}). Seed BFS queue with this cell.` });
        while (q.length) {
          const [cr, cc] = q.shift();
          state[cr][cc] = '*';
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = cr + dr, nc = cc + dc;
            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
            if (state[nr][nc] === '#' && !visited[nr][nc]) {
              visited[nr][nc] = true;
              state[nr][nc] = 'O';
              q.push([nr, nc]);
            }
          }
          frames.push({ grid: snap(), caption: `BFS dequeues (${cr}, ${cc}) and pushes its land neighbours onto the frontier ('O').` });
        }
        for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) if (state[i][j] === 'O' || state[i][j] === 'S' || state[i][j] === '*') state[i][j] = 'C';
        frames.push({ grid: snap(), caption: `Island #${count} fully drowned (marked 'C'). Continue scanning for the next unvisited land cell.` });
      }
    }
  }
  frames.push({ grid: snap(), caption: `Done. Total islands: ${count}. Every cell is enqueued at most once, total O(rows * cols).` });
  return frames;
}

// Unique paths in m x n grid — DP fill (only right or down moves).
function uniquePathsGridFrames(m = 3, n = 4) {
  const frames = [];
  const dp = Array.from({ length: m }, () => Array(n).fill(0));
  const render = () => dp.map(r => r.map(v => v === 0 ? '.' : String(v)));
  const cellLabel = { '.': '.', '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10', '15': '15', '20': '20', '35': '35' };
  frames.push({ grid: render(), cellLabel, caption: `Unique paths from (0,0) to (${m - 1}, ${n - 1}) using only right and down moves. dp[r][c] = ways to reach that cell.` });
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (r === 0 || c === 0) {
        dp[r][c] = 1;
      } else {
        dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
      }
      frames.push({ grid: render(), cellLabel, caption: `dp[${r}][${c}] = ${dp[r][c]}${r === 0 || c === 0 ? ' (boundary cell — exactly one path along the edge)' : ` = dp[${r - 1}][${c}] (${dp[r - 1][c]}) + dp[${r}][${c - 1}] (${dp[r][c - 1]})`}.` });
    }
  }
  frames.push({ grid: render(), cellLabel, caption: `Done. Total unique paths to (${m - 1}, ${n - 1}) = ${dp[m - 1][n - 1]}. Fill is O(m * n).` });
  return frames;
}

// Edit distance (Levenshtein) DP fill on a small string pair.
function editDistanceFrames(a = 'kitten', b = 'sitting') {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const render = () => dp.map(r => r.map(v => v === 0 ? '0' : String(v)));
  const cellLabel = {};
  for (let i = 0; i < 20; i++) cellLabel[String(i)] = String(i);
  cellLabel['.'] = '.';
  const frames = [];
  frames.push({ grid: render(), cellLabel, caption: `Edit distance from "${a}" to "${b}". Cell dp[i][j] = min edits to turn the first i chars of "${a}" into the first j chars of "${b}".` });
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  frames.push({ grid: render(), cellLabel, caption: `Seed boundaries: dp[i][0] = i (delete i chars), dp[0][j] = j (insert j chars).` });
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
    frames.push({ grid: render(), cellLabel, caption: `Filled row ${i} (matching "${a[i - 1]}" against every prefix of "${b}"). Each cell takes the min of replace, delete, insert — plus 0 or 1 depending on whether the chars match.` });
  }
  frames.push({ grid: render(), cellLabel, caption: `Done. Edit distance from "${a}" to "${b}" is ${dp[m][n]}. Total work O(m * n).` });
  return frames;
}

// 0/1 knapsack DP table fill.
function knapsack01Frames(weights = [1, 3, 4, 5], values = [1, 4, 5, 7], W = 7) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  const render = () => dp.map(r => r.map(v => String(v)));
  const cellLabel = {};
  for (let i = 0; i < 30; i++) cellLabel[String(i)] = String(i);
  const frames = [];
  frames.push({ grid: render(), cellLabel, caption: `0/1 knapsack. Items: weights [${weights.join(', ')}], values [${values.join(', ')}], capacity ${W}. dp[i][w] = best value using only the first i items within capacity w.` });
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      if (weights[i - 1] > w) dp[i][w] = dp[i - 1][w];
      else dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
    }
    frames.push({ grid: render(), cellLabel, caption: `Row ${i}: decide for each capacity whether including item ${i} (weight ${weights[i - 1]}, value ${values[i - 1]}) beats skipping it.` });
  }
  frames.push({ grid: render(), cellLabel, caption: `Done. Optimal value = ${dp[n][W]} at dp[${n}][${W}]. Time and space O(n * W).` });
  return frames;
}

// Coin change minimum coins — 1D DP fill across amounts.
function coinChangeMinCoinsFrames(coins = [1, 2, 5], amount = 11) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  const render = () => dp.map(v => v === Infinity ? '∞' : v);
  const frames = [];
  frames.push({ array: render(), caption: `Min coins to make amount ${amount} with denominations [${coins.join(', ')}]. dp[a] = fewest coins summing to a; start with infinity except dp[0] = 0.` });
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
    }
    frames.push({ array: render(), highlights: { [a]: 'mid' }, caption: `dp[${a}] = ${dp[a] === Infinity ? '∞' : dp[a]}${dp[a] === Infinity ? ' (no combination reaches this yet)' : ' coins'}. Considered each coin c: dp[${a}] = min(dp[${a}], dp[${a} - c] + 1).` });
  }
  frames.push({ array: render(), highlights: { [amount]: 'match' }, caption: `Final answer: ${dp[amount] === Infinity ? 'impossible' : dp[amount] + ' coins'}. Total work O(amount * coins).` });
  return frames;
}

// Tree diameter — DFS that bubbles up the deepest two paths per node.
function treeDiameterFrames() {
  // Sample tree:        1
  //                  /    \
  //                 2      3
  //                / \      \
  //               4   5      6
  //                            \
  //                             7
  const build = (val, left = null, right = null) => ({ value: val, left, right, _id: val });
  const make = () => build(1,
    build(2, build(4), build(5)),
    build(3, null, build(6, null, build(7))),
  );
  const frames = [];
  const recolor = (root, fn) => {
    const walk = (n) => { if (!n) return null; const nn = { ...n, state: fn(n) || undefined }; nn.left = walk(n.left); nn.right = walk(n.right); return nn; };
    return walk(root);
  };
  let tree = make();
  frames.push({ tree, caption: `Tree diameter. For each node, the longest path through it is (depth of left subtree) + (depth of right subtree). DFS post-order returns depth and updates a global best.` });
  // Walk: depths of leaves first.
  const visitOrder = [4, 5, 2, 7, 6, 3, 1];
  const visited = new Set();
  const best = { val: 0, via: 0 };
  for (const id of visitOrder) {
    visited.add(id);
    tree = recolor(make(), (n) => visited.has(n.value) ? 'visited' : (n.value === id ? 'current' : undefined));
    // Compute current best naively for caption.
    if (id === 2) best.val = 2;
    if (id === 3) best.val = 3;
    if (id === 1) best.val = 5;
    frames.push({ tree, caption: `Post-order visit node ${id}. Compute depth via max child depth + 1, update best diameter (currently ${best.val} edges).` });
  }
  tree = recolor(make(), (n) => [4, 5, 2, 7, 6, 3, 1].includes(n.value) ? 'visited' : undefined);
  frames.push({ tree, caption: `Done. Longest path: 4 -> 2 -> 1 -> 3 -> 6 -> 7 = 5 edges. Single DFS, total O(n).` });
  return frames;
}

// Validate BST — DFS with (min, max) bounds.
function validateBstFrames() {
  // Sample valid BST:        8
  //                       /     \
  //                      3       10
  //                     / \        \
  //                    1   6        14
  //                       / \      /
  //                      4   7    13
  const build = (val, left = null, right = null) => ({ value: val, left, right, _id: val });
  const make = () => build(8,
    build(3, build(1), build(6, build(4), build(7))),
    build(10, null, build(14, build(13), null)),
  );
  const visitOrder = [8, 3, 1, 6, 4, 7, 10, 14, 13];
  const visited = new Set();
  const frames = [];
  const recolor = (cur) => {
    const walk = (n) => { if (!n) return null; const s = visited.has(n.value) ? 'visited' : n.value === cur ? 'current' : undefined; return { ...n, state: s, left: walk(n.left), right: walk(n.right) }; };
    return walk(make());
  };
  frames.push({ tree: recolor(null), caption: `Validate BST with DFS that carries (min, max) bounds. Each node must lie strictly between them; left child tightens max, right child tightens min.` });
  const captions = {
    8: 'Root 8 has bounds (-inf, +inf). OK. Recurse left with bounds (-inf, 8) and right with (8, +inf).',
    3: 'Visit 3 under bounds (-inf, 8). 3 < 8, valid. Left bound becomes (-inf, 3); right bound becomes (3, 8).',
    1: 'Leaf 1 under bounds (-inf, 3). OK.',
    6: 'Visit 6 under bounds (3, 8). 3 < 6 < 8, valid. Recurse with (3, 6) and (6, 8).',
    4: 'Leaf 4 under bounds (3, 6). OK.',
    7: 'Leaf 7 under bounds (6, 8). OK.',
    10: 'Visit 10 under bounds (8, +inf). OK.',
    14: 'Visit 14 under bounds (10, +inf). OK.',
    13: 'Leaf 13 under bounds (10, 14). 10 < 13 < 14, valid.',
  };
  for (const id of visitOrder) {
    visited.add(id);
    frames.push({ tree: recolor(id), caption: captions[id] });
  }
  frames.push({ tree: recolor(null), caption: `Every node satisfied its bound — this is a valid BST. Single DFS, total O(n).` });
  return frames;
}

// Kth smallest in BST via in-order DFS counter.
function kthSmallestBstFrames(k = 3) {
  const build = (val, left = null, right = null) => ({ value: val, left, right, _id: val });
  const make = () => build(5,
    build(3, build(2, build(1), null), build(4)),
    build(6),
  );
  const inorder = [1, 2, 3, 4, 5, 6];
  const frames = [];
  const visited = new Set();
  const recolor = (cur) => {
    const walk = (n) => { if (!n) return null; const s = visited.has(n.value) ? 'visited' : n.value === cur ? 'current' : undefined; return { ...n, state: s, left: walk(n.left), right: walk(n.right) }; };
    return walk(make());
  };
  frames.push({ tree: recolor(null), caption: `Find the ${k}-th smallest in this BST. In-order DFS visits keys in sorted order; stop after the ${k}-th visit.` });
  let count = 0;
  for (const v of inorder) {
    count += 1;
    visited.add(v);
    frames.push({ tree: recolor(v), caption: `Visit ${v} (in-order step ${count}). ${count < k ? `Need ${k - count} more.` : count === k ? `That is the ${k}-th smallest — return ${v} and stop.` : `Already past k — would not reach here in real run.`}` });
    if (count === k) break;
  }
  frames.push({ tree: recolor(null), caption: `Done. ${k}-th smallest = ${inorder[k - 1]}. Iterative in-order with an explicit stack runs in O(h + k).` });
  return frames;
}

// Binary tree right-side view via BFS, keeping last node of each level.
function treeRightSideViewFrames() {
  const build = (val, left = null, right = null) => ({ value: val, left, right, _id: val });
  const root = () => build(1,
    build(2, null, build(5)),
    build(3, null, build(4)),
  );
  const frames = [];
  const levels = [[1], [2, 3], [5, 4]];
  const visited = new Set();
  const recolor = (cur, rightmost) => {
    const walk = (n) => { if (!n) return null; const s = n.value === rightmost ? 'match' : visited.has(n.value) ? 'visited' : cur.has(n.value) ? 'current' : undefined; return { ...n, state: s, left: walk(n.left), right: walk(n.right) }; };
    return walk(root());
  };
  frames.push({ tree: recolor(new Set(), null), caption: `Right-side view = the rightmost node at every BFS level. Walk level by level; the last node dequeued at each level joins the answer.` });
  const view = [];
  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    frames.push({ tree: recolor(new Set(lvl), null), caption: `Level ${i}: nodes [${lvl.join(', ')}]. Process every node, queueing its children.` });
    const last = lvl[lvl.length - 1];
    view.push(last);
    for (const v of lvl) visited.add(v);
    frames.push({ tree: recolor(new Set(), last), caption: `Rightmost on level ${i} is ${last}. Append to view: [${view.join(', ')}].` });
  }
  frames.push({ tree: recolor(new Set(), null), caption: `Done. Right-side view = [${view.join(', ')}]. BFS visits each node once, total O(n).` });
  return frames;
}

// DFS iterative on a small graph using an explicit stack.
function dfsIterativeFrames() {
  const nodes = [
    { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
    { id: 3, label: '3' }, { id: 4, label: '4' }, { id: 5, label: '5' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 },
    { a: 1, b: 3 }, { a: 1, b: 4 },
    { a: 2, b: 5 },
  ];
  const adj = { 0: [1, 2], 1: [3, 4], 2: [5], 3: [], 4: [], 5: [] };
  const frames = [];
  const visited = new Set();
  const stack = [0];
  const recolor = (cur) => nodes.map(n => ({ ...n, state: n.id === cur ? 'current' : visited.has(n.id) ? 'visited' : stack.includes(n.id) ? 'frontier' : undefined }));
  frames.push({ nodes: recolor(null), edges, caption: `Iterative DFS from node 0 using an explicit stack instead of recursion. Push the source and loop while the stack is non-empty.` });
  while (stack.length) {
    const v = stack.pop();
    if (visited.has(v)) {
      frames.push({ nodes: recolor(v), edges, caption: `Pop node ${v}. Already visited — skip.` });
      continue;
    }
    visited.add(v);
    frames.push({ nodes: recolor(v), edges, caption: `Pop node ${v} and mark visited. Stack now [${stack.join(', ') || 'empty'}].` });
    const neighbors = [...adj[v]].reverse();
    for (const n of neighbors) if (!visited.has(n)) stack.push(n);
    frames.push({ nodes: recolor(null), edges, caption: `Push unvisited neighbours of ${v} in reverse order so the algorithm explores them in original adjacency order. Stack: [${stack.join(', ') || 'empty'}].` });
  }
  frames.push({ nodes: nodes.map(n => ({ ...n, state: 'visited' })), edges, caption: `Done. Visited every reachable node from 0. Time O(V + E), space O(V) for the stack.` });
  return frames;
}

// Bipartite check via BFS coloring.
function bipartiteCheckFrames() {
  const nodes = [
    { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
    { id: 3, label: '3' }, { id: 4, label: '4' }, { id: 5, label: '5' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 3 },
    { a: 1, b: 2 }, { a: 2, b: 5 },
    { a: 3, b: 4 }, { a: 4, b: 5 },
  ];
  const adj = { 0: [1, 3], 1: [0, 2], 2: [1, 5], 3: [0, 4], 4: [3, 5], 5: [2, 4] };
  const color = {};
  const frames = [];
  const repaint = (cur) => nodes.map(n => ({ ...n, state: n.id === cur ? 'current' : color[n.id] === 0 ? 'visited' : color[n.id] === 1 ? 'frontier' : undefined }));
  color[0] = 0;
  const q = [0];
  frames.push({ nodes: repaint(0), edges, caption: `Two-color the graph with BFS. Source 0 gets color A; every neighbour must take color B; their neighbours go back to A; any conflict means the graph is not bipartite.` });
  while (q.length) {
    const v = q.shift();
    frames.push({ nodes: repaint(v), edges, caption: `Dequeue ${v} (color ${color[v] === 0 ? 'A' : 'B'}). Inspect neighbours.` });
    for (const n of adj[v]) {
      if (color[n] === undefined) {
        color[n] = 1 - color[v];
        q.push(n);
        frames.push({ nodes: repaint(n), edges, caption: `Neighbour ${n} unpainted — assign opposite color ${color[n] === 0 ? 'A' : 'B'} and enqueue.` });
      } else if (color[n] === color[v]) {
        frames.push({ nodes: repaint(n), edges, caption: `Neighbour ${n} already has the same colour as ${v} — conflict, graph is NOT bipartite.` });
        return frames;
      }
    }
  }
  frames.push({ nodes: repaint(null), edges, caption: `Every edge connects nodes of opposite colours. The graph is bipartite. Total O(V + E).` });
  return frames;
}

// Word ladder BFS — minimum transformations on a tiny dictionary.
function wordLadderBfsFrames() {
  const nodes = [
    { id: 'hit', label: 'hit' }, { id: 'hot', label: 'hot' },
    { id: 'dot', label: 'dot' }, { id: 'lot', label: 'lot' },
    { id: 'dog', label: 'dog' }, { id: 'log', label: 'log' },
    { id: 'cog', label: 'cog' },
  ];
  const edges = [
    { a: 'hit', b: 'hot' }, { a: 'hot', b: 'dot' }, { a: 'hot', b: 'lot' },
    { a: 'dot', b: 'dog' }, { a: 'lot', b: 'log' },
    { a: 'dog', b: 'cog' }, { a: 'log', b: 'cog' }, { a: 'dot', b: 'lot' }, { a: 'dog', b: 'log' },
  ];
  const adj = {
    hit: ['hot'], hot: ['hit', 'dot', 'lot'], dot: ['hot', 'dog', 'lot'], lot: ['hot', 'log', 'dot'],
    dog: ['dot', 'cog', 'log'], log: ['lot', 'cog', 'dog'], cog: ['dog', 'log'],
  };
  const dist = { hit: 0 };
  const parent = {};
  const q = ['hit'];
  const visited = new Set(['hit']);
  const frames = [];
  const paint = (cur) => nodes.map(n => ({ ...n, state: n.id === cur ? 'current' : visited.has(n.id) ? 'visited' : undefined }));
  frames.push({ nodes: paint('hit'), edges, caption: `Word ladder from "hit" to "cog". Edges connect words that differ by exactly one letter. BFS finds the shortest transformation.` });
  while (q.length) {
    const v = q.shift();
    frames.push({ nodes: paint(v), edges, caption: `Dequeue "${v}" at distance ${dist[v]}. ${v === 'cog' ? `Reached target.` : 'Enqueue unseen neighbours.'}` });
    if (v === 'cog') break;
    for (const n of adj[v]) {
      if (!visited.has(n)) {
        visited.add(n);
        dist[n] = dist[v] + 1;
        parent[n] = v;
        q.push(n);
        frames.push({ nodes: paint(n), edges, caption: `Discover "${n}" via "${v}" at distance ${dist[n]}.` });
      }
    }
  }
  const path = [];
  let cur = 'cog';
  while (cur) { path.unshift(cur); cur = parent[cur]; }
  frames.push({ nodes: nodes.map(n => ({ ...n, state: path.includes(n.id) ? 'current' : visited.has(n.id) ? 'visited' : undefined })), edges, caption: `Shortest ladder length ${dist.cog} via ${path.join(' -> ')}. BFS guarantees minimum edges. Total O(V + E).` });
  return frames;
}

// Minimum window substring — expand/shrink window with character demand map.
function minWindowSubstringFrames(s = 'ADOBECODEBANC', t = 'ABC') {
  const arr = s.split('');
  const need = {};
  for (const c of t) need[c] = (need[c] || 0) + 1;
  const have = {};
  let satisfied = 0, required = Object.keys(need).length;
  let l = 0, bestLen = Infinity, bestRange = [0, -1];
  const frames = [];
  frames.push({ array: arr, window: [0, -1], caption: `Minimum window substring containing every character of "${t}". Use a sliding window plus a "need" multiset; the window is valid once it covers each required character with the right multiplicity.` });
  for (let r = 0; r < arr.length; r++) {
    const c = arr[r];
    if (need[c] !== undefined) {
      have[c] = (have[c] || 0) + 1;
      if (have[c] === need[c]) satisfied += 1;
    }
    frames.push({ array: arr, window: [l, r], caption: `Expand right to index ${r} (char '${c}'). ${need[c] !== undefined ? `Now have ${have[c]} of needed ${need[c]} '${c}'s.` : `Not in target, ignore.`} Distinct chars satisfied: ${satisfied}/${required}.` });
    while (satisfied === required) {
      if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestRange = [l, r]; }
      frames.push({ array: arr, window: [l, r], caption: `Window [${l}, ${r}] is valid (length ${r - l + 1}). Best so far: "${arr.slice(bestRange[0], bestRange[1] + 1).join('')}" (length ${bestLen}). Try shrinking left.` });
      const lc = arr[l];
      if (need[lc] !== undefined) {
        have[lc] -= 1;
        if (have[lc] < need[lc]) satisfied -= 1;
      }
      l += 1;
    }
  }
  if (bestLen === Infinity) {
    frames.push({ array: arr, window: [0, -1], caption: `No window covers "${t}". Return "".` });
  } else {
    frames.push({ array: arr, window: bestRange, caption: `Minimum window: "${arr.slice(bestRange[0], bestRange[1] + 1).join('')}" at [${bestRange[0]}, ${bestRange[1]}]. Each index moves at most twice (one push, one pop) — total O(n).` });
  }
  return frames;
}

// Subarray product less than K — two-pointer with running product.
function subarrayProductLessKFrames(arr = [10, 5, 2, 6], k = 100) {
  const frames = [];
  let prod = 1, l = 0, total = 0;
  frames.push({ array: arr, window: [0, -1], caption: `Count subarrays whose product is < ${k}. Slide a window: extend right; while product is too large, advance left. Each right gives (r - l + 1) new valid subarrays ending at r.` });
  for (let r = 0; r < arr.length; r++) {
    prod *= arr[r];
    frames.push({ array: arr, window: [l, r], caption: `Extend right to index ${r}. Window product = ${prod}.` });
    while (prod >= k && l <= r) {
      frames.push({ array: arr, window: [l, r], caption: `Product ${prod} >= ${k}. Shrink from the left: divide by arr[${l}] = ${arr[l]}.` });
      prod = Math.floor(prod / arr[l]);
      l += 1;
    }
    if (l <= r) {
      const added = r - l + 1;
      total += added;
      frames.push({ array: arr, window: [l, r], caption: `Window [${l}, ${r}] has product ${prod} < ${k}. It contributes ${added} new subarrays ending at ${r}. Total = ${total}.` });
    } else {
      frames.push({ array: arr, window: [l, r], caption: `Single element arr[${r}] = ${arr[r]} already >= ${k}; skip.` });
    }
  }
  frames.push({ array: arr, window: [0, arr.length - 1], caption: `Done. Subarrays with product < ${k}: ${total}. Each index moves at most twice — O(n).` });
  return frames;
}

// ----------------------------------------------------------------------------
// LeetCode-style sliding-window frame builders. Each returns an array of
// { array, window:[l,r], caption, ...stateFields } — the renderer only reads
// array/window/caption, so the extra fields are documentation that mirrors
// the algorithm's actual variables for anyone reading the source.
// ----------------------------------------------------------------------------

// Longest Substring Without Repeating Characters (LC 3).
// Expand r until we see a char already in the window, then jump l past the
// previous occurrence. Each index visits at most twice → O(n).
function longestSubstrFrames(s = 'abcabcbb') {
  const str = String(s ?? '');
  if (!str.length) {
    return [{ array: [], window: [0, -1], caption: 'Empty string — longest substring length is 0.' }];
  }
  const arr = str.split('');
  const frames = [];
  const seen = new Map();
  let left = 0, maxLen = 0, bestRange = [0, 0];
  frames.push({
    array: arr,
    window: [0, -1],
    left: 0, right: -1, windowStr: '', charMap: {}, currentLen: 0, maxLen: 0, action: 'init',
    caption: `Goal: longest substring of "${str}" with all distinct characters. Window state = a map char → last index seen.`,
  });
  frames.push({
    array: arr,
    window: [0, -1],
    left: 0, right: -1, windowStr: '', charMap: {}, currentLen: 0, maxLen: 0, action: 'init',
    caption: `Pattern: expand right; if the new char is already inside the window, jump left to (prev index + 1). Track the widest window seen.`,
  });
  for (let r = 0; r < arr.length; r++) {
    const ch = arr[r];
    if (seen.has(ch) && seen.get(ch) >= left) {
      const prev = seen.get(ch);
      const oldL = left;
      left = prev + 1;
      seen.set(ch, r);
      const currentLen = r - left + 1;
      const windowStr = str.slice(left, r + 1);
      frames.push({
        array: arr,
        window: [left, r],
        left, right: r, windowStr,
        charMap: Object.fromEntries(seen),
        currentLen, maxLen, action: 'shrink',
        caption: `r=${r}: '${ch}' already inside window at index ${prev}. Shrink: jump left ${oldL} → ${left} so the duplicate falls out. Window = "${windowStr}" (length ${currentLen}).`,
      });
    } else {
      seen.set(ch, r);
      const currentLen = r - left + 1;
      const windowStr = str.slice(left, r + 1);
      const wasMax = maxLen;
      const improved = currentLen > maxLen;
      if (improved) { maxLen = currentLen; bestRange = [left, r]; }
      frames.push({
        array: arr,
        window: [left, r],
        left, right: r, windowStr,
        charMap: Object.fromEntries(seen),
        currentLen, maxLen, action: 'expand',
        caption: `r=${r}: '${ch}' is new — expand. Window = "${windowStr}" (length ${currentLen}).${improved ? ` New best maxLen = ${maxLen}.` : ''}`,
      });
      if (improved) {
        frames.push({
          array: arr,
          window: bestRange,
          left: bestRange[0], right: bestRange[1],
          windowStr: str.slice(bestRange[0], bestRange[1] + 1),
          charMap: Object.fromEntries(seen),
          currentLen: maxLen, maxLen, action: 'best',
          caption: `Best window so far: "${str.slice(bestRange[0], bestRange[1] + 1)}" at [${bestRange[0]}..${bestRange[1]}], length ${maxLen} (was ${wasMax}).`,
        });
      }
    }
  }
  frames.push({
    array: arr,
    window: bestRange,
    left: bestRange[0], right: bestRange[1],
    windowStr: str.slice(bestRange[0], bestRange[1] + 1),
    charMap: Object.fromEntries(seen),
    currentLen: maxLen, maxLen, action: 'done',
    caption: `Done. Longest substring without repeats in "${str}" = "${str.slice(bestRange[0], bestRange[1] + 1)}" (length ${maxLen}). Both pointers crossed the string once → O(n).`,
  });
  return frames;
}

// Longest Repeating Character Replacement (LC 424).
// Window is valid while (windowLen - maxFreqInWindow) <= k. Otherwise shrink.
// Note: maxFreqInWindow doesn't need to be perfectly recomputed on shrink — the
// answer never improves on a stale max, so we let it drift. Captions still show
// the actual max for clarity.
function longestRepeatingReplacementFrames(s = 'AABABBA', k = 1) {
  const str = String(s ?? '');
  if (!str.length) {
    return [{ array: [], window: [0, -1], caption: `Empty string — answer is 0 (k=${k}).` }];
  }
  const arr = str.split('');
  const freq = {};
  const frames = [];
  let left = 0, best = 0, bestRange = [0, 0];
  const trueMaxFreq = () => {
    let m = 0;
    for (const v of Object.values(freq)) if (v > m) m = v;
    return m;
  };
  const freqStr = () => Object.entries(freq).filter(([, v]) => v > 0).map(([c, v]) => `${c}×${v}`).join(', ') || '∅';
  frames.push({
    array: arr,
    window: [0, -1],
    left: 0, right: -1, charFreq: {}, maxFreqInWindow: 0, windowLen: 0,
    replacementsAllowed: k, action: 'init',
    caption: `Goal: longest substring of "${str}" you can make uniform by replacing ≤ ${k} characters. Window valid while (windowLen − maxFreqChar) ≤ ${k}.`,
  });
  frames.push({
    array: arr,
    window: [0, -1],
    left: 0, right: -1, charFreq: {}, maxFreqInWindow: 0, windowLen: 0,
    replacementsAllowed: k, action: 'init',
    caption: `Window state = a count of each char inside [l..r]. (windowLen − maxFreq) is how many replacements the window currently demands.`,
  });
  for (let r = 0; r < arr.length; r++) {
    const ch = arr[r];
    freq[ch] = (freq[ch] || 0) + 1;
    let windowLen = r - left + 1;
    let maxFreq = trueMaxFreq();
    frames.push({
      array: arr,
      window: [left, r],
      left, right: r, charFreq: { ...freq }, maxFreqInWindow: maxFreq,
      windowLen, replacementsAllowed: k - (windowLen - maxFreq), action: 'expand',
      caption: `r=${r}: add '${ch}'. Window = "${str.slice(left, r + 1)}", freq = { ${freqStr()} }, maxFreq = ${maxFreq}, replacements needed = ${windowLen - maxFreq}.`,
    });
    if (windowLen - maxFreq > k) {
      const dropped = arr[left];
      freq[dropped] -= 1;
      if (freq[dropped] === 0) delete freq[dropped];
      left += 1;
      windowLen = r - left + 1;
      maxFreq = trueMaxFreq();
      frames.push({
        array: arr,
        window: [left, r],
        left, right: r, charFreq: { ...freq }, maxFreqInWindow: maxFreq,
        windowLen, replacementsAllowed: k - (windowLen - maxFreq), action: 'shrink',
        caption: `Needed ${windowLen - maxFreq + 1} > k=${k}. Shrink: drop arr[${left - 1}]='${dropped}', left → ${left}. Window = "${str.slice(left, r + 1)}" (length ${windowLen}).`,
      });
    }
    if (windowLen > best) { best = windowLen; bestRange = [left, r]; }
  }
  frames.push({
    array: arr,
    window: bestRange,
    left: bestRange[0], right: bestRange[1],
    charFreq: { ...freq }, maxFreqInWindow: trueMaxFreq(),
    windowLen: best, replacementsAllowed: k, action: 'done',
    caption: `Done. Longest replaceable run = "${str.slice(bestRange[0], bestRange[1] + 1)}" (length ${best}) with k=${k} swaps. Each index advances at most twice → O(n).`,
  });
  return frames;
}

// Minimum Window Substring (LC 76).
// Two-phase: expand right until every required char is satisfied (formed === need),
// then shrink left as far as possible while still valid. Track the smallest valid range.
function minimumWindowSubstringFrames(s = 'ADOBECODEBANC', t = 'ABC') {
  const str = String(s ?? '');
  const target = String(t ?? '');
  if (!str.length || !target.length) {
    return [{ array: str.split(''), window: [0, -1], caption: 'Empty input — no window exists.' }];
  }
  const arr = str.split('');
  const needMap = {};
  for (const c of target) needMap[c] = (needMap[c] || 0) + 1;
  const need = Object.keys(needMap).length;
  const have = {};
  let formed = 0, left = 0;
  let bestL = -1, bestR = -1, bestLen = Infinity;
  const frames = [];
  const haveStr = () => Object.entries(have).filter(([, v]) => v > 0).map(([c, v]) => `${c}×${v}`).join(', ') || '∅';

  frames.push({
    array: arr,
    window: [0, -1],
    left: 0, right: -1, have: {}, need, formed: 0,
    bestL: -1, bestR: -1, action: 'init',
    caption: `Goal: smallest window of "${str}" that covers every character of "${target}" (with multiplicity). need = ${need} distinct chars: { ${Object.entries(needMap).map(([c, v]) => `${c}×${v}`).join(', ')} }.`,
  });
  frames.push({
    array: arr,
    window: [0, -1],
    left: 0, right: -1, have: {}, need, formed: 0,
    bestL: -1, bestR: -1, action: 'init',
    caption: `Two-phase loop: expand right until formed === need (window is valid), then shrink left while still valid. Track the smallest valid (l, r) seen.`,
  });

  for (let r = 0; r < arr.length; r++) {
    const ch = arr[r];
    if (needMap[ch] !== undefined) {
      have[ch] = (have[ch] || 0) + 1;
      if (have[ch] === needMap[ch]) formed += 1;
    }
    frames.push({
      array: arr,
      window: [left, r],
      left, right: r, have: { ...have }, need, formed,
      bestL, bestR, action: 'expand',
      caption: `r=${r}: expand to '${ch}'. ${needMap[ch] !== undefined ? `Now have ${have[ch]} of needed ${needMap[ch]} '${ch}'.` : `'${ch}' isn't in target — skip.`} formed = ${formed}/${need}.`,
    });
    while (formed === need) {
      const len = r - left + 1;
      if (len < bestLen) {
        bestLen = len; bestL = left; bestR = r;
        frames.push({
          array: arr,
          window: [left, r],
          left, right: r, have: { ...have }, need, formed,
          bestL, bestR, action: 'shrink',
          caption: `Window [${left}..${r}] valid — length ${len}. New best: "${str.slice(bestL, bestR + 1)}". Try shrinking from the left.`,
        });
      } else {
        frames.push({
          array: arr,
          window: [left, r],
          left, right: r, have: { ...have }, need, formed,
          bestL, bestR, action: 'shrink',
          caption: `Window [${left}..${r}] valid — length ${len}, not better than best ${bestLen}. Shrink anyway.`,
        });
      }
      const lc = arr[left];
      if (needMap[lc] !== undefined) {
        have[lc] -= 1;
        if (have[lc] < needMap[lc]) formed -= 1;
      }
      left += 1;
      frames.push({
        array: arr,
        window: [left, r],
        left, right: r, have: { ...have }, need, formed,
        bestL, bestR, action: 'shrink',
        caption: `Drop arr[${left - 1}]='${lc}', left → ${left}. have = { ${haveStr()} }, formed = ${formed}/${need}.`,
      });
    }
  }
  if (bestL === -1) {
    frames.push({
      array: arr,
      window: [0, -1],
      left, right: arr.length - 1, have: { ...have }, need, formed,
      bestL: -1, bestR: -1, action: 'done',
      caption: `Done. No window of "${str}" covers "${target}". Answer = "".`,
    });
  } else {
    frames.push({
      array: arr,
      window: [bestL, bestR],
      left: bestL, right: bestR, have: { ...have }, need, formed,
      bestL, bestR, action: 'done',
      caption: `Done. Smallest window = "${str.slice(bestL, bestR + 1)}" at [${bestL}..${bestR}], length ${bestLen}. Each index pushed once, popped once → O(|s| + |t|).`,
    });
  }
  return frames;
}

// Permutation in String (LC 567).
// Fixed-width window of |s1| over s2. Compare character-count vectors; advance
// the window one step at a time.
function permutationInStringFrames(s1 = 'ab', s2 = 'eidbaooo') {
  const pattern = String(s1 ?? '');
  const text = String(s2 ?? '');
  if (!pattern.length || text.length < pattern.length) {
    return [{ array: text.split(''), window: [0, -1], caption: 'Pattern empty or longer than text — no permutation match possible.' }];
  }
  const arr = text.split('');
  const k = pattern.length;
  const s1Count = {};
  for (const c of pattern) s1Count[c] = (s1Count[c] || 0) + 1;
  const windowCount = {};
  const frames = [];
  let matches = 0;
  let foundAt = -1;
  const distinctNeeded = Object.keys(s1Count).length;
  const countStr = (m) => Object.entries(m).filter(([, v]) => v > 0).map(([c, v]) => `${c}×${v}`).join(', ') || '∅';

  frames.push({
    array: arr,
    window: [0, -1],
    left: 0, right: -1,
    s1Count: { ...s1Count }, windowCount: {}, matches: 0, action: 'init',
    caption: `Goal: does some permutation of "${pattern}" appear as a contiguous substring of "${text}"? Same characters in any order, exactly ${k} of them.`,
  });
  frames.push({
    array: arr,
    window: [0, -1],
    left: 0, right: -1,
    s1Count: { ...s1Count }, windowCount: {}, matches: 0, action: 'init',
    caption: `Use a fixed window of width ${k}. Compare its char-count vector to s1's. matches counts how many distinct chars have the exact required count.`,
  });

  for (let r = 0; r < arr.length; r++) {
    const inc = arr[r];
    windowCount[inc] = (windowCount[inc] || 0) + 1;
    if (s1Count[inc] !== undefined && windowCount[inc] === s1Count[inc]) matches += 1;
    else if (s1Count[inc] !== undefined && windowCount[inc] === s1Count[inc] + 1) matches -= 1;

    let left = Math.max(0, r - k + 1);
    if (r >= k) {
      const dec = arr[r - k];
      if (s1Count[dec] !== undefined && windowCount[dec] === s1Count[dec]) matches -= 1;
      else if (s1Count[dec] !== undefined && windowCount[dec] === s1Count[dec] + 1) matches += 1;
      windowCount[dec] -= 1;
      if (windowCount[dec] === 0) delete windowCount[dec];
    }

    if (r < k - 1) {
      frames.push({
        array: arr,
        window: [0, r],
        left: 0, right: r,
        s1Count: { ...s1Count }, windowCount: { ...windowCount },
        matches, action: 'expand',
        caption: `r=${r}: filling initial window with '${inc}'. windowCount = { ${countStr(windowCount)} }, matches = ${matches}/${distinctNeeded}.`,
      });
    } else {
      const isMatch = matches === distinctNeeded;
      if (isMatch && foundAt === -1) foundAt = left;
      const action = isMatch ? 'match' : 'slide';
      frames.push({
        array: arr,
        window: [left, r],
        left, right: r,
        s1Count: { ...s1Count }, windowCount: { ...windowCount },
        matches, action,
        caption: `Window [${left}..${r}] = "${text.slice(left, r + 1)}". windowCount = { ${countStr(windowCount)} }, matches = ${matches}/${distinctNeeded}.${isMatch ? ' All counts equal — permutation found!' : ' Slide right.'}`,
      });
    }
  }
  if (foundAt >= 0) {
    frames.push({
      array: arr,
      window: [foundAt, foundAt + k - 1],
      left: foundAt, right: foundAt + k - 1,
      s1Count: { ...s1Count }, windowCount: { ...windowCount },
      matches, action: 'done',
      caption: `Done. "${text.slice(foundAt, foundAt + k)}" at [${foundAt}..${foundAt + k - 1}] is a permutation of "${pattern}". Return true. Each index entered + exited the window once → O(|s2|).`,
    });
  } else {
    frames.push({
      array: arr,
      window: [arr.length - k, arr.length - 1],
      left: arr.length - k, right: arr.length - 1,
      s1Count: { ...s1Count }, windowCount: { ...windowCount },
      matches, action: 'done',
      caption: `Done. Scanned every window of width ${k} — no permutation of "${pattern}" found in "${text}". Return false.`,
    });
  }
  return frames;
}

// ----------------------------------------------------------------------------
// Trie insert + search — build a prefix tree for a list of words, then search.
// The tree renderer binds to binary `left`/`right`; we model each character node
// as left = first child, right = second child (works for fan-out ≤ 2; we
// fall back to chaining additional children down the right spine).
function trieInsertSearchFrames(words = ['apple', 'app', 'apricot'], search = 'app') {
  const wordList = (Array.isArray(words) ? words : [])
    .map(w => String(w || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4);
  const query = String(search || '').trim().toLowerCase();
  if (!wordList.length) return [{ tree: null, caption: 'No words supplied — nothing to insert.' }];

  let nextId = 1;
  const mkNode = (ch, state) => ({ _id: ++nextId, value: ch, _children: {}, _end: false, state, left: null, right: null });
  const root = { _id: 0, value: '·', _children: {}, _end: false, state: 'visited', left: null, right: null };

  // Re-layout the binary left/right pointers from each node's _children map
  // so the renderer can draw it. First child → left, second → right; any extra
  // child is hung off the right-spine of the second to keep the layout legal.
  const relayout = (node) => {
    if (!node) return;
    const kids = Object.keys(node._children).sort();
    node.left = null; node.right = null;
    if (kids.length > 0) {
      node.left = node._children[kids[0]];
      relayout(node.left);
    }
    if (kids.length > 1) {
      // Chain remaining children down the right side.
      let cur = node;
      for (let i = 1; i < kids.length; i++) {
        cur.right = node._children[kids[i]];
        relayout(node._children[kids[i]]);
        cur = node._children[kids[i]];
      }
    }
  };

  const snapshot = (caption) => {
    relayout(root);
    // Deep clone so highlights on later frames don't leak backward.
    const clone = (n) => n ? {
      _id: n._id, value: n._end ? `${n.value}*` : n.value, state: n.state,
      left: clone(n.left), right: clone(n.right),
    } : null;
    frames.push({ tree: clone(root), caption });
  };

  const clearStates = () => {
    const walk = (n) => { if (!n) return; if (n._id !== 0) n.state = 'visited'; for (const k of Object.keys(n._children)) walk(n._children[k]); };
    walk(root);
  };

  const frames = [];
  snapshot(`Trie: every node = one character, every path from root = a prefix. We will insert [${wordList.map(w => `"${w}"`).join(', ')}] then search "${query}".`);
  snapshot(`Start with an empty root (shown as "·"). End-of-word markers will be drawn as a trailing "*" on a node's letter.`);

  for (const word of wordList) {
    clearStates();
    let cur = root;
    cur.state = 'current';
    // One framing snapshot per word, then a single end-mark snapshot at the
    // close — per-char snapshots only when something interesting happens
    // (creating a new node), so the frame count stays under 25.
    snapshot(`Insert "${word}". Walk character by character from root, creating missing children as we go.`);
    let lastCreatedSnapshot = false;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (cur._children[ch]) {
        cur._children[ch].state = 'current';
        cur.state = 'visited';
        cur = cur._children[ch];
        lastCreatedSnapshot = false;
      } else {
        const child = mkNode(ch, 'current');
        cur._children[ch] = child;
        cur.state = 'visited';
        cur = child;
        snapshot(`Insert "${word}" — char ${i + 1}/${word.length} '${ch}'. No '${ch}' child, create it and descend.`);
        lastCreatedSnapshot = true;
      }
    }
    if (!lastCreatedSnapshot) snapshot(`Insert "${word}" — reached '${cur.value}'. All chars walked along existing edges.`);
    cur._end = true;
    cur.state = 'done';
    snapshot(`Mark end=true on '${cur.value}' so "${word}" is recognized as a complete word (the "*" suffix means end-of-word).`);
  }

  // Search.
  clearStates();
  let cur = root;
  cur.state = 'current';
  snapshot(`All ${wordList.length} word${wordList.length === 1 ? '' : 's'} inserted. Now search for "${query}".`);
  let found = true;
  for (let i = 0; i < query.length; i++) {
    const ch = query[i];
    if (cur._children[ch]) {
      cur._children[ch].state = 'current';
      cur.state = 'visited';
      cur = cur._children[ch];
      snapshot(`Search "${query}" — char ${i + 1}/${query.length} '${ch}'. Found edge '${ch}', descend.`);
    } else {
      cur.state = 'visited';
      found = false;
      snapshot(`Search "${query}" — char ${i + 1}/${query.length} '${ch}'. No '${ch}' child. "${query}" is not present as any prefix.`);
      break;
    }
  }
  if (found) {
    if (cur._end) {
      cur.state = 'done';
      snapshot(`Reached node '${cur.value}' with end=true. "${query}" is stored as a complete word. Return true.`);
    } else {
      snapshot(`Reached node '${cur.value}' but end=false. "${query}" is a prefix of stored word(s) but not itself a stored word.`);
    }
  }
  return frames;
}

// Topological sort (Kahn's algorithm) on a small DAG with explicit in-degree /
// queue / processed-order state narration in every frame.
function topoSortKahnFrames(edgesIn = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], nNodes = 6) {
  const n = Math.max(1, Math.min(12, Math.floor(Number(nNodes) || 6)));
  const rawEdges = Array.isArray(edgesIn) ? edgesIn : [];
  const edges = [];
  for (const e of rawEdges) {
    if (!Array.isArray(e) || e.length < 2) continue;
    const a = Math.floor(Number(e[0])); const b = Math.floor(Number(e[1]));
    if (a >= 0 && a < n && b >= 0 && b < n && a !== b) edges.push({ a, b });
  }
  const indeg = new Array(n).fill(0);
  edges.forEach(e => { indeg[e.b] += 1; });

  const frames = [];
  const order = [];
  let queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);

  const snapshot = (currentId, processedSet, caption, highlightEdges = new Set()) => {
    const ns = Array.from({ length: n }, (_, i) => ({
      id: i,
      label: `${i}\nin=${indeg[i]}`,
      state: i === currentId ? 'current'
        : processedSet.has(i) ? 'done'
        : queue.includes(i) ? 'frontier'
        : undefined,
    }));
    const es = edges.map((e, idx) => ({ ...e, state: highlightEdges.has(idx) ? 'current' : undefined }));
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapshot(null, new Set(), `Kahn's algorithm. A DAG of ${n} nodes; each node's badge shows its current in-degree. Goal: emit a linear order respecting every directed edge.`);
  snapshot(null, new Set(), `Initialize: scan in-degrees, seed the queue with every node that has in=0 (no prerequisites). Queue = [${queue.join(', ')}].`);

  let step = 0;
  while (queue.length) {
    const u = queue.shift();
    step += 1;
    order.push(u);
    const out = edges.map((e, i) => ({ e, i })).filter(x => x.e.a === u);
    const outHL = new Set(out.map(x => x.i));
    snapshot(u, new Set(order), `Step ${step}: pop ${u} from queue. Append to order: [${order.join(' → ')}]. Out-neighbors of ${u}: [${out.map(x => x.e.b).join(', ') || 'none'}]. Queue now [${queue.join(', ')}].`, outHL);
    const newlyZero = [];
    for (const { e } of out) {
      indeg[e.b] -= 1;
      if (indeg[e.b] === 0) { queue.push(e.b); newlyZero.push(e.b); }
    }
    if (out.length) {
      const desc = newlyZero.length
        ? `Decrement in-degrees of ${out.map(x => x.e.b).join(', ')}. Newly zero: [${newlyZero.join(', ')}] → push to queue. Queue [${queue.join(', ')}].`
        : `Decrement in-degrees of ${out.map(x => x.e.b).join(', ')}. None hit zero yet. Queue [${queue.join(', ')}].`;
      snapshot(null, new Set(order), `Step ${step}: ${desc}`);
    }
  }
  if (order.length === n) {
    snapshot(null, new Set(order), `Topological order: [${order.join(' → ')}]. Every edge points from an earlier index to a later one.`);
  } else {
    snapshot(null, new Set(order), `Only ${order.length}/${n} nodes processed — remaining nodes form a cycle (their in-degrees never hit zero).`);
  }
  return frames;
}

// Union-Find with rank + path compression. Tracks parent[] and rank[] every step.
function unionFindRankFrames(opsIn = [['union', 0, 1], ['union', 2, 3], ['union', 0, 2], ['find', 3]], nIn = 6) {
  const n = Math.max(2, Math.min(10, Math.floor(Number(nIn) || 6)));
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const ops = (Array.isArray(opsIn) ? opsIn : []).filter(op => Array.isArray(op) && op.length >= 2);

  // Path-compressing find that records each node on the path so we can
  // narrate it in the snapshot.
  const findWithPath = (x) => {
    const path = [];
    let cur = x;
    while (parent[cur] !== cur) { path.push(cur); cur = parent[cur]; }
    path.push(cur);
    for (const p of path) parent[p] = cur;
    return { root: cur, path };
  };
  const findNoCompress = (x) => {
    let cur = x;
    while (parent[cur] !== cur) cur = parent[cur];
    return cur;
  };

  const frames = [];
  const snapshot = (caption, currentId = null, highlightEdges = new Set()) => {
    const ns = Array.from({ length: n }, (_, i) => ({
      id: i,
      label: `${i}\np=${parent[i]} r=${rank[i]}`,
      state: i === currentId ? 'current'
        : parent[i] === i ? 'frontier'
        : undefined,
    }));
    const es = [];
    for (let i = 0; i < n; i++) {
      if (parent[i] !== i) es.push({ a: i, b: parent[i], state: highlightEdges.has(i) ? 'current' : undefined });
    }
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapshot(`Union-Find with rank + path compression. ${n} singleton sets. parent[]=[${parent.join(',')}], rank[]=[${rank.join(',')}]. Roots are highlighted (frontier).`);
  snapshot(`Strategy: union-by-rank attaches the shorter tree under the taller one (keeps depth O(log n)); find collapses every node on the lookup path straight to the root (path compression).`);

  let opNum = 0;
  for (const op of ops) {
    opNum += 1;
    const kind = String(op[0]).toLowerCase();
    if (kind === 'union') {
      const a = Math.max(0, Math.min(n - 1, Math.floor(Number(op[1]) || 0)));
      const b = Math.max(0, Math.min(n - 1, Math.floor(Number(op[2]) || 0)));
      const ra = findNoCompress(a);
      const rb = findNoCompress(b);
      snapshot(`Op ${opNum}: union(${a}, ${b}). Find each root first: find(${a})=${ra}, find(${b})=${rb}.`, a);
      if (ra === rb) {
        snapshot(`Same root (${ra}) — ${a} and ${b} are already in the same component. No-op.`, ra);
        continue;
      }
      // Union by rank.
      if (rank[ra] < rank[rb]) {
        parent[ra] = rb;
        snapshot(`Compare ranks: rank[${ra}]=${rank[ra]} < rank[${rb}]=${rank[rb]}. Attach the shallower tree (root ${ra}) under ${rb}. parent[]=[${parent.join(',')}], rank[]=[${rank.join(',')}].`, rb, new Set([ra]));
      } else if (rank[ra] > rank[rb]) {
        parent[rb] = ra;
        snapshot(`Compare ranks: rank[${ra}]=${rank[ra]} > rank[${rb}]=${rank[rb]}. Attach the shallower tree (root ${rb}) under ${ra}. parent[]=[${parent.join(',')}], rank[]=[${rank.join(',')}].`, ra, new Set([rb]));
      } else {
        parent[rb] = ra;
        rank[ra] += 1;
        snapshot(`Equal ranks (${rank[ra] - 1}). Attach ${rb} under ${ra} and bump rank[${ra}] to ${rank[ra]}. parent[]=[${parent.join(',')}], rank[]=[${rank.join(',')}].`, ra, new Set([rb]));
      }
    } else if (kind === 'find') {
      const x = Math.max(0, Math.min(n - 1, Math.floor(Number(op[1]) || 0)));
      const beforeParent = [...parent];
      const { root, path } = findWithPath(x);
      const reparented = path.filter(p => beforeParent[p] !== parent[p]);
      snapshot(`Op ${opNum}: find(${x}). Walk path ${path.join(' → ')} to root ${root}.`, x, new Set(path));
      if (reparented.length) {
        snapshot(`Path compression: re-point ${reparented.join(', ')} directly at root ${root}. parent[]=[${parent.join(',')}]. Next find on this branch is O(1).`, root, new Set(reparented));
      } else {
        snapshot(`Already direct — no compression needed. parent[]=[${parent.join(',')}].`, root);
      }
    }
  }

  // Final component count.
  const roots = new Set();
  for (let i = 0; i < n; i++) roots.add(findNoCompress(i));
  snapshot(`After ${ops.length} op${ops.length === 1 ? '' : 's'}: ${roots.size} component${roots.size === 1 ? '' : 's'}. parent[]=[${parent.join(',')}], rank[]=[${rank.join(',')}]. Amortized cost per op: α(n) (effectively constant).`);
  return frames;
}

// Segment tree (range-sum) build + a point-inclusive range query, drawn as a
// binary tree over a 1-indexed segment-tree array layout.
function segmentTreeRangeSumFrames(arr = [1, 3, 5, 7, 9, 11], qL = 1, qR = 4) {
  const a = (Array.isArray(arr) ? arr : []).map(x => Number(x) || 0);
  if (!a.length) return [{ tree: null, caption: 'Empty array — nothing to build.' }];
  const n = a.length;
  const lo = Math.max(0, Math.min(n - 1, Math.floor(Number(qL) || 0)));
  const hi = Math.max(lo, Math.min(n - 1, Math.floor(Number(qR) || 0)));
  const seg = new Array(4 * n).fill(0);
  const segL = new Array(4 * n).fill(0);
  const segR = new Array(4 * n).fill(0);

  // Build a renderable tree mirror of the seg-tree (with binary left/right).
  const treeNode = (idx, l, r) => ({ _id: idx, value: null, _l: l, _r: r, state: undefined, left: null, right: null });
  let root = null;
  const buildTree = (idx, l, r) => {
    const node = treeNode(idx, l, r);
    if (l === r) {
      seg[idx] = a[l];
      node.value = `[${l},${l}]=${a[l]}`;
      segL[idx] = l; segR[idx] = r;
      return node;
    }
    const mid = (l + r) >> 1;
    node.left = buildTree(2 * idx, l, mid);
    node.right = buildTree(2 * idx + 1, mid + 1, r);
    seg[idx] = seg[2 * idx] + seg[2 * idx + 1];
    segL[idx] = l; segR[idx] = r;
    node.value = `[${l},${r}]=${seg[idx]}`;
    return node;
  };

  const frames = [];
  const snapshot = (caption, highlightIdx = new Set(), state = 'current') => {
    const clone = (n) => {
      if (!n) return null;
      const s = highlightIdx.has(n._id) ? state : undefined;
      return { _id: n._id, value: n.value, state: s, left: clone(n.left), right: clone(n.right) };
    };
    frames.push({ tree: clone(root), caption });
  };

  // Frame 1: pre-build narration shown over the (empty) tree we are about to build.
  root = buildTree(1, 0, n - 1);
  // Reset everything visited then narrate.
  frames.push({ tree: { _id: 1, value: 'build…', state: 'current', left: null, right: null }, caption: `Segment tree (range-sum) on arr=[${a.join(', ')}]. Each node stores the sum of a contiguous sub-range; leaves cover one index each.` });
  frames.push({ tree: { _id: 1, value: 'build…', state: 'current', left: null, right: null }, caption: `We index nodes 1..4n in a flat array (heap layout): node i's children are 2i and 2i+1. The root holds the whole-array sum.` });
  snapshot(`Built. Root [0,${n - 1}] = ${seg[1]}. Internal node label = "[l,r]=sum"; leaves are single-element ranges.`, new Set([1]), 'done');

  // Walk the tree top-down to narrate the build order.
  const buildOrder = [];
  const collectPost = (idx) => {
    if (idx >= seg.length || (segL[idx] === 0 && segR[idx] === 0 && idx > 1 && seg[idx] === 0)) return;
    const node = (function find(n) { if (!n) return null; if (n._id === idx) return n; return find(n.left) || find(n.right); })(root);
    if (!node) return;
    if (node.left) collectPost(2 * idx);
    if (node.right) collectPost(2 * idx + 1);
    buildOrder.push(idx);
  };
  collectPost(1);

  const narrate = buildOrder.slice(0, Math.min(6, buildOrder.length));
  for (const idx of narrate) {
    const l = segL[idx], r = segR[idx];
    if (l === r) {
      snapshot(`Build leaf #${idx} → range [${l},${l}] = arr[${l}] = ${a[l]}.`, new Set([idx]), 'current');
    } else {
      snapshot(`Build internal #${idx} → range [${l},${r}] = #${2 * idx}.sum + #${2 * idx + 1}.sum = ${seg[2 * idx]} + ${seg[2 * idx + 1]} = ${seg[idx]}.`, new Set([idx]), 'current');
    }
  }

  // Query.
  snapshot(`Build complete. Now query sum over [${lo}, ${hi}].`, new Set([1]), 'done');

  let acc = 0;
  const visited = new Set();
  const query = (idx, nl, nr) => {
    if (nr < lo || nl > hi) {
      visited.add(idx);
      snapshot(`Node #${idx} covers [${nl},${nr}] — fully outside query [${lo},${hi}]. Return 0 (no contribution).`, new Set([idx]), 'visited');
      return 0;
    }
    if (lo <= nl && nr <= hi) {
      acc += seg[idx];
      visited.add(idx);
      snapshot(`Node #${idx} covers [${nl},${nr}] — fully inside query [${lo},${hi}]. Take its stored sum ${seg[idx]}. Accumulated = ${acc}.`, new Set([idx]), 'done');
      return seg[idx];
    }
    visited.add(idx);
    snapshot(`Node #${idx} covers [${nl},${nr}] — partially overlaps query [${lo},${hi}]. Recurse into both children.`, new Set([idx]), 'current');
    const mid = (nl + nr) >> 1;
    const ls = query(2 * idx, nl, mid);
    const rs = query(2 * idx + 1, mid + 1, nr);
    return ls + rs;
  };
  const total = query(1, 0, n - 1);
  snapshot(`Query sum([${lo},${hi}]) = ${total}. Visited ${visited.size} of ${(function count(n) { return n ? 1 + count(n.left) + count(n.right) : 0; })(root)} nodes — O(log n) per query, far better than the O(n) naive scan.`, new Set([1]), 'done');
  return frames;
}

// ----------------------------------------------------------------------------

// Prim's MST — grow a single tree from a start vertex; each step accept the
// cheapest edge crossing the cut between tree and non-tree vertices.
function primFrames(variant = 'default') {
  let nodes, edges;
  if (variant === 'dense') {
    nodes = [
      { id: 0, label: '0' }, { id: 1, label: '1' }, { id: 2, label: '2' },
      { id: 3, label: '3' }, { id: 4, label: '4' },
    ];
    edges = [
      { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 3 }, { a: 0, b: 3, w: 8 },
      { a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 6 }, { a: 1, b: 4, w: 7 },
      { a: 2, b: 3, w: 4 }, { a: 2, b: 4, w: 5 }, { a: 3, b: 4, w: 9 },
    ];
  } else if (variant === 'chain') {
    nodes = Array.from({ length: 6 }, (_, i) => ({ id: i, label: String(i) }));
    edges = [
      { a: 0, b: 1, w: 5 }, { a: 1, b: 2, w: 3 }, { a: 2, b: 3, w: 6 },
      { a: 3, b: 4, w: 2 }, { a: 4, b: 5, w: 4 },
    ];
  } else {
    nodes = Array.from({ length: 6 }, (_, i) => ({ id: i, label: String(i) }));
    edges = [
      { a: 0, b: 1, w: 4 }, { a: 0, b: 2, w: 3 }, { a: 1, b: 2, w: 2 },
      { a: 1, b: 3, w: 5 }, { a: 2, b: 3, w: 7 }, { a: 2, b: 4, w: 8 },
      { a: 3, b: 4, w: 2 }, { a: 3, b: 5, w: 6 }, { a: 4, b: 5, w: 1 },
    ];
  }

  const frames = [];
  const start = 0;
  const inTree = new Set();
  const treeEdges = new Set();
  const internalEdges = new Set();

  const crossingIdx = () => edges
    .map((e, i) => i)
    .filter(i => !treeEdges.has(i) && !internalEdges.has(i) && (inTree.has(edges[i].a) !== inTree.has(edges[i].b)));

  const snapshot = (currentIdx, caption) => {
    const cross = new Set(crossingIdx());
    const frontierNodes = new Set();
    cross.forEach(i => {
      const e = edges[i];
      frontierNodes.add(inTree.has(e.a) ? e.b : e.a);
    });
    const ns = nodes.map(n => {
      let state;
      if (currentIdx != null && (edges[currentIdx].a === n.id || edges[currentIdx].b === n.id) && !inTree.has(n.id)) state = 'current';
      else if (inTree.has(n.id)) state = 'visited';
      else if (frontierNodes.has(n.id)) state = 'frontier';
      return { ...n, state };
    });
    const es = edges.map((e, i) => {
      if (treeEdges.has(i)) return { ...e, state: 'tree' };
      if (i === currentIdx) return { ...e, state: 'current' };
      if (internalEdges.has(i)) return { ...e, state: 'rejected' };
      if (cross.has(i)) return { ...e, state: 'frontier' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snapshot(null, `Prim's MST: grow one tree from a start vertex. Each step, take the CHEAPEST edge that crosses from the tree to an outside vertex — the cut property guarantees it belongs to some MST.`);
  inTree.add(start);
  snapshot(null, `Start at vertex ${start}. Dashed sky edges form the frontier: edges with exactly one endpoint inside the tree. They are the only candidates.`);

  let total = 0;
  let stepNum = 0;
  while (inTree.size < nodes.length) {
    const cands = crossingIdx();
    if (!cands.length) {
      snapshot(null, `No crossing edges remain but ${nodes.length - inTree.size} vertices are unreached — the graph is disconnected, so no spanning tree exists.`);
      return frames;
    }
    const bestI = cands.reduce((m, i) => (edges[i].w < edges[m].w ? i : m));
    const best = edges[bestI];
    stepNum += 1;
    snapshot(bestI, `Step ${stepNum} — frontier: ${cands.map(i => `(${edges[i].a}-${edges[i].b}, w=${edges[i].w})`).join(', ')}. Cheapest crossing edge is (${best.a}-${best.b}) with weight ${best.w}.`);
    const newV = inTree.has(best.a) ? best.b : best.a;
    treeEdges.add(bestI);
    inTree.add(newV);
    total += best.w;
    edges.forEach((e, i) => {
      if (!treeEdges.has(i) && inTree.has(e.a) && inTree.has(e.b)) internalEdges.add(i);
    });
    snapshot(null, `Step ${stepNum} — accept (${best.a}-${best.b}): vertex ${newV} joins the tree. Running MST weight = ${total}. Edges with both ends inside fade out — adding one would close a cycle.`);
  }
  snapshot(null, `Done: ${treeEdges.size} tree edges connect all ${nodes.length} vertices, total weight ${total}. With a priority queue of frontier edges this runs in O((V + E) log V).`);
  return frames;
}

// LSD radix sort — one stable bucket pass per digit, least-significant first.
function radixSortFrames(input = [170, 45, 75, 90, 802, 24, 2, 66]) {
  const arr = (Array.isArray(input) ? input : [])
    .map(Number)
    .filter(n => Number.isFinite(n) && n >= 0)
    .map(n => Math.floor(n))
    .slice(0, 12);
  if (!arr.length) return [{ array: [], caption: 'Empty array — nothing to sort.' }];

  const frames = [];
  const maxVal = Math.max(...arr);
  const numDigits = String(maxVal).length;
  let work = [...arr];

  frames.push({
    array: [...work],
    caption: `Radix sort (LSD): sort by the ones digit first, then tens, then hundreds — each pass is a STABLE bucket pass on one digit, never a comparison.`,
  });
  frames.push({
    array: [...work],
    caption: `Largest value ${maxVal} has ${numDigits} digit${numDigits === 1 ? '' : 's'}, so we need ${numDigits} pass${numDigits === 1 ? '' : 'es'}. Total cost O(d·(n + 10)) — linear in n for fixed-width keys.`,
  });

  for (let d = 0, exp = 1; d < numDigits; d++, exp *= 10) {
    const place = d === 0 ? 'ones' : d === 1 ? 'tens' : d === 2 ? 'hundreds' : `10^${d}`;
    const digitOf = (v) => Math.floor(v / exp) % 10;
    const digitRow = () => ({ values: work.map(v => String(digitOf(v))), label: `${place} digit` });

    frames.push({
      array: [...work],
      subRow: digitRow(),
      caption: `Pass ${d + 1} — look ONLY at each element's ${place} digit (row below). Higher digits are ignored this pass.`,
    });

    const buckets = Array.from({ length: 10 }, () => []);
    for (let i = 0; i < work.length; i++) {
      const dg = digitOf(work[i]);
      buckets[dg].push(work[i]);
      frames.push({
        array: [...work],
        highlights: { [i]: 'current' },
        subRow: digitRow(),
        caption: `Pass ${d + 1}: ${work[i]} has ${place} digit ${dg} — append to bucket ${dg}. Stable: it lands BEHIND anything already in bucket ${dg}.`,
      });
    }

    const bucketDesc = buckets
      .map((b, di) => (b.length ? `${di}:[${b.join(',')}]` : null))
      .filter(Boolean)
      .join('  ');
    work = buckets.flat();
    frames.push({
      array: [...work],
      subRow: digitRow(),
      caption: `Pass ${d + 1} done — concatenate buckets 0 → 9: ${bucketDesc}. The array is now sorted by its last ${d + 1} digit${d === 0 ? '' : 's'}.`,
    });
  }

  frames.push({
    array: [...work],
    highlights: Object.fromEntries(work.map((_, i) => [i, 'done'])),
    caption: `Fully sorted after the most-significant pass. Stability is the whole trick: ties on the current digit keep their earlier-pass order, so lower digits stay sorted.`,
  });
  return frames;
}

// Boyer-Moore substring search using the bad-character rule: compare the
// pattern right-to-left, and on mismatch slide it past positions that
// provably cannot match.
function boyerMooreSearchFrames(text = 'HERE-IS-A-SIMPLE-EXAMPLE', pattern = 'EXAMPLE') {
  const t = String(text ?? '');
  const p = String(pattern ?? '');
  if (!t.length || !p.length || p.length > t.length) {
    return [{ array: t.split(''), caption: 'Pattern is empty or longer than the text — nothing to search.' }];
  }
  const arr = t.split('');
  const frames = [];

  const last = {};
  for (let i = 0; i < p.length; i++) last[p[i]] = i;
  const subFor = (s) => ({
    values: arr.map((_, i) => (i >= s && i < s + p.length ? p[i - s] : '')),
    label: 'pattern',
  });

  frames.push({
    array: arr,
    subRow: subFor(0),
    caption: `Boyer-Moore: align "${p}" under the text and compare RIGHT to LEFT. A mismatch lets us slide the pattern several cells at once instead of by 1.`,
  });
  frames.push({
    array: arr,
    subRow: subFor(0),
    caption: `Bad-character table — last index of each char in "${p}": ${Object.entries(last).map(([c, i]) => `'${c}'→${i}`).join(', ')}. A text char absent from the pattern shifts the whole pattern past it.`,
  });

  const eliminated = new Set();
  let s = 0;
  let alignment = 0;
  while (s <= arr.length - p.length) {
    alignment += 1;
    frames.push({
      array: arr,
      subRow: subFor(s),
      pointers: { [s]: 's', [s + p.length - 1]: 'j' },
      eliminated: new Set(eliminated),
      caption: `Alignment ${alignment}: pattern sits at shift ${s}. Start comparing at the RIGHT end, text index ${s + p.length - 1}.`,
    });
    let j = p.length - 1;
    while (j >= 0 && p[j] === arr[s + j]) {
      const matched = {};
      for (let k = j; k < p.length; k++) matched[s + k] = 'match';
      frames.push({
        array: arr,
        subRow: subFor(s),
        highlights: matched,
        eliminated: new Set(eliminated),
        caption: `Compare text[${s + j}]='${arr[s + j]}' with pattern[${j}]='${p[j]}' — match. Step left.`,
      });
      j -= 1;
    }
    if (j < 0) {
      const allMatch = {};
      for (let k = 0; k < p.length; k++) allMatch[s + k] = 'match';
      frames.push({
        array: arr,
        subRow: subFor(s),
        highlights: allMatch,
        eliminated: new Set(eliminated),
        caption: `All ${p.length} characters matched — "${p}" found at text index ${s}.`,
      });
      frames.push({
        array: arr,
        subRow: subFor(s),
        highlights: allMatch,
        eliminated: new Set(eliminated),
        caption: `Done in ${alignment} alignment${alignment === 1 ? '' : 's'}. The grayed cells were skipped without ever being read — that is the sublinear magic.`,
      });
      return frames;
    }
    const bad = arr[s + j];
    const lastIdx = Object.prototype.hasOwnProperty.call(last, bad) ? last[bad] : -1;
    const shift = Math.max(1, j - lastIdx);
    frames.push({
      array: arr,
      subRow: subFor(s),
      highlights: { [s + j]: 'pivot' },
      pointers: { [s + j]: 'j' },
      eliminated: new Set(eliminated),
      caption: `Mismatch: text[${s + j}]='${bad}' vs pattern[${j}]='${p[j]}'. '${bad}' ${lastIdx >= 0 ? `last occurs at pattern index ${lastIdx}` : 'never occurs in the pattern'} → shift by max(1, ${j} − ${lastIdx}) = ${shift}.`,
    });
    for (let k = s; k < Math.min(s + shift, arr.length); k++) eliminated.add(k);
    s += shift;
    if (s <= arr.length - p.length) {
      frames.push({
        array: arr,
        subRow: subFor(s),
        eliminated: new Set(eliminated),
        caption: `Slide the pattern right by ${shift} — every alignment in between would hit the same bad character, so we skip them all.`,
      });
    }
  }
  frames.push({
    array: arr,
    eliminated: new Set(eliminated),
    caption: `The pattern slid past the end of the text — "${p}" does not occur. Mismatches did most of the work for us.`,
  });
  return frames;
}

export const VISUALIZATIONS = {
  'binary-search': {
    title: 'Binary search walkthrough', renderer: 'array',
    cases: [
      { label: 'Found in middle',   frames: binarySearchFrames([1, 3, 5, 7, 9, 11, 13, 15, 17, 19], 11) },
      { label: 'Found at end',      frames: binarySearchFrames([2, 4, 8, 16, 32, 64, 128, 256], 256) },
      { label: 'Not found',         frames: binarySearchFrames([1, 4, 7, 10, 13, 16, 19], 8) },
      { label: 'Lower bound',       frames: binarySearchLowerBoundFrames() },
      { label: 'Upper bound',       frames: binarySearchUpperBoundFrames() },
    ],
    build: ({ array, target }) => binarySearchFrames(array, target),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Sorted array', type: 'intArray', default: [1, 3, 5, 7, 9, 11, 13, 15], placeholder: '1, 3, 5, 7…' },
        { name: 'target', label: 'Target', type: 'int', default: 7 },
      ],
    },
  },
  'bfs-dfs': {
    title: 'BFS / DFS walkthrough', renderer: 'graph',
    cases: [
      { label: 'BFS default',          frames: bfsFrames() },
      { label: 'BFS linear chain',     frames: bfsLinearChainFrames() },
      { label: 'DFS bushy tree',       frames: dfsBushyFrames() },
      { label: 'BFS disconnected',     frames: bfsDisconnectedFrames() },
    ],
  },
  'sliding-window': {
    title: 'Sliding window walkthrough', renderer: 'window',
    cases: [
      { label: 'Mixed repeats',    frames: slidingWindowFrames('abcabcbb') },
      { label: 'Late repeat',      frames: slidingWindowFrames('pwwkew') },
      { label: 'All same chars',   frames: slidingWindowFrames('bbbbb') },
      { label: 'Shortest sum ≥ K', frames: slidingWindowMinSumFrames() },
      { label: 'Fruit in baskets', frames: slidingWindowFruitFrames() },
    ],
    build: ({ s }) => slidingWindowFrames(s),
    inputSchema: {
      fields: [
        { name: 's', label: 'String (a-z)', type: 'string', default: 'abcabcbb', max: 30, placeholder: 'abcabcbb' },
      ],
    },
  },
  'two-pointers': {
    title: 'Two-pointers walkthrough', renderer: 'window',
    cases: [
      { label: 'Pair sums to target',  frames: twoPointersFrames([1, 2, 4, 7, 8, 11, 12, 15, 18, 20], 23) },
      { label: 'Pair at extremes',     frames: twoPointersFrames([2, 5, 8, 11, 14], 16) },
      { label: 'No pair',              frames: twoPointersFrames([1, 2, 3, 4, 5, 6, 7, 8], 100) },
    ],
    build: ({ array, target }) => twoPointersFrames(array, target),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Sorted array', type: 'intArray', default: [1, 2, 4, 7, 8, 11, 12, 15, 18, 20] },
        { name: 'target', label: 'Target sum', type: 'int', default: 23 },
      ],
    },
  },
  'kadanes-algorithm': {
    title: "Kadane's walkthrough", renderer: 'array',
    cases: [
      { label: 'Mixed signs',  frames: kadaneFrames([-2, 1, -3, 4, -1, 2, 1, -5, 4]) },
      { label: 'All negative', frames: kadaneFrames([-5, -1, -8, -3, -2]) },
      { label: 'All positive', frames: kadaneFrames([2, 3, 1, 5, 4]) },
    ],
    build: ({ array }) => kadaneFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array (can be negative)', type: 'intArray', default: [-2, 1, -3, 4, -1, 2, 1, -5, 4], placeholder: '-2, 1, -3…' },
      ],
    },
  },
  'loop-detection':  { title: "Floyd's cycle walkthrough",    frames: loopDetectionFrames(), renderer: 'array' },
  'sieve-of-eratosthenes': {
    title: 'Sieve walkthrough', renderer: 'grid',
    cases: [
      { label: 'n = 50',  frames: sieveFrames(50) },
      { label: 'n = 30',  frames: sieveFrames(30) },
      { label: 'n = 10',  frames: sieveFrames(10) },
    ],
    build: ({ n }) => sieveFrames(n),
    inputSchema: {
      fields: [
        { name: 'n', label: 'Upper bound n', type: 'int', default: 50, max: 200 },
      ],
    },
  },
  'quicksort-partition': {
    title: 'Quicksort partition', renderer: 'array',
    cases: [
      { label: 'Random',         frames: quicksortPartitionFrames([7, 2, 9, 4, 1, 6, 3]) },
      { label: 'Already sorted', frames: quicksortPartitionFrames([1, 2, 3, 4, 5, 6, 7]) },
      { label: 'Reverse sorted', frames: quicksortPartitionFrames([7, 6, 5, 4, 3, 2, 1]) },
    ],
    build: ({ array }) => quicksortPartitionFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [7, 2, 9, 4, 1, 6, 3], placeholder: '7, 2, 9…' },
      ],
    },
  },
  'bubble-sort': {
    title: 'Bubble sort walkthrough', renderer: 'array',
    cases: [
      { label: 'Unsorted',        frames: bubbleSortFrames([5, 1, 4, 2, 8]) },
      { label: 'Nearly sorted',   frames: bubbleSortFrames([1, 2, 3, 5, 4]) },
      { label: 'Reverse sorted',  frames: bubbleSortFrames([8, 6, 4, 2, 1]) },
    ],
    build: ({ array }) => bubbleSortFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [5, 1, 4, 2, 8] },
      ],
    },
  },
  'insertion-sort': {
    title: 'Insertion sort walkthrough', renderer: 'array',
    cases: [
      { label: 'Unsorted',        frames: insertionSortFrames([5, 2, 4, 6, 1, 3]) },
      { label: 'Already sorted',  frames: insertionSortFrames([1, 2, 3, 4, 5, 6]) },
      { label: 'Reverse sorted',  frames: insertionSortFrames([6, 5, 4, 3, 2, 1]) },
    ],
    build: ({ array }) => insertionSortFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [5, 2, 4, 6, 1, 3] },
      ],
    },
  },
  'heap-sort': {
    title: 'Heap sort walkthrough', renderer: 'array',
    cases: [
      { label: 'Random',            frames: heapSortFrames([4, 10, 3, 5, 1, 8, 7]) },
      { label: 'Reverse sorted',    frames: heapSortFrames([7, 6, 5, 4, 3, 2, 1]) },
      { label: 'Single sift-down',  frames: heapSiftDownFrames([3, 10, 8, 5, 7, 6, 1]) },
    ],
    build: ({ array }) => heapSortFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [4, 10, 3, 5, 1, 8, 7], placeholder: '4, 10, 3…' },
      ],
    },
  },
  'counting-sort': {
    title: 'Counting sort walkthrough', renderer: 'array',
    cases: [
      { label: 'Default',         frames: countingSortFrames([4, 2, 2, 8, 3, 3, 1]) },
      { label: 'Many duplicates', frames: countingSortFrames([2, 5, 2, 1, 5, 2, 1, 5]) },
    ],
    build: ({ array }) => countingSortFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array (small non-negative ints)', type: 'intArray', default: [4, 2, 2, 8, 3, 3, 1], placeholder: '4, 2, 2…' },
      ],
    },
  },
  'shell-sort': {
    title: 'Shell sort walkthrough', renderer: 'array',
    cases: [
      { label: 'Default',        frames: shellSortFrames([23, 12, 1, 8, 34, 54, 2, 3]) },
      { label: 'Reverse sorted', frames: shellSortFrames([8, 7, 6, 5, 4, 3, 2, 1]) },
    ],
    build: ({ array }) => shellSortFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [23, 12, 1, 8, 34, 54, 2, 3], placeholder: '23, 12, 1…' },
      ],
    },
  },
  'dijkstras-algorithm':   { title: "Dijkstra's walkthrough",   frames: dijkstraFrames(),      renderer: 'graph' },
  'selection-sort': {
    title: 'Selection sort walkthrough', renderer: 'array',
    cases: [
      { label: 'Unsorted',        frames: selectionSortFrames([29, 10, 14, 37, 13, 5]) },
      { label: 'Already sorted',  frames: selectionSortFrames([5, 10, 13, 14, 29, 37]) },
      { label: 'With duplicates', frames: selectionSortFrames([4, 2, 4, 1, 2, 1]) },
    ],
    build: ({ array }) => selectionSortFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [29, 10, 14, 37, 13, 5] },
      ],
    },
  },
  'bst-insertion': {
    title: 'BST insertion walkthrough', renderer: 'tree',
    cases: [
      { label: 'Balanced order',    frames: bstInsertionFrames([50, 30, 70, 20, 40, 60, 80, 35]) },
      { label: 'Sequential (skew)', frames: bstInsertionFrames([10, 20, 30, 40, 50, 60, 70]) },
      { label: 'With duplicates',   frames: bstInsertionFrames([42, 17, 88, 17, 50, 88, 25, 42]) },
    ],
    build: ({ values }) => bstInsertionFrames(values),
    inputSchema: {
      fields: [
        { name: 'values', label: 'Insert order', type: 'intArray', default: [50, 30, 70, 20, 40, 60, 80, 35], placeholder: '50, 30, 70…' },
      ],
    },
  },
  'merge-sort': {
    title: 'Merge sort: the merge step', renderer: 'array',
    cases: [
      { label: 'Random',         frames: mergeSortFrames([38, 27, 43, 3, 9, 82, 10]) },
      { label: 'Already sorted', frames: mergeSortFrames([1, 2, 3, 4, 5, 6, 7]) },
      { label: 'Reverse sorted', frames: mergeSortFrames([7, 6, 5, 4, 3, 2, 1]) },
    ],
    build: ({ array }) => mergeSortFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [38, 27, 43, 3, 9, 82, 10], placeholder: '38, 27, 43…' },
      ],
    },
  },
  'fibonacci-recursion': {
    title: 'Fibonacci call tree', renderer: 'tree',
    cases: [
      { label: 'n = 6',  frames: fibRecursionFrames(6) },
      { label: 'n = 5',  frames: fibRecursionFrames(5) },
      { label: 'n = 4',  frames: fibRecursionFrames(4) },
    ],
    build: ({ n }) => fibRecursionFrames(n),
    inputSchema: {
      fields: [
        { name: 'n', label: 'n (≤ 6 — tree explodes)', type: 'int', default: 6, max: 6 },
      ],
    },
  },
  'linear-vs-binary': {
    title: 'Linear vs binary search', renderer: 'array',
    cases: [
      { label: 'Found mid',  frames: linearVsBinaryFrames([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29], 23) },
      { label: 'Found end',  frames: linearVsBinaryFrames([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29], 29) },
      { label: 'Not found',  frames: linearVsBinaryFrames([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29], 8) },
    ],
    build: ({ array, target }) => linearVsBinaryFrames(array, target),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Sorted array', type: 'intArray', default: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29] },
        { name: 'target', label: 'Target', type: 'int', default: 23 },
      ],
    },
  },
  'stack-ops': {
    title: 'Stack push/pop operations', renderer: 'array',
    cases: [
      { label: 'Default mix',         frames: stackOpsFrames('push 3 push 7 push 5 pop push 9 pop pop') },
      { label: 'All pushes',          frames: stackOpsFrames('push 1 push 2 push 3 push 4 push 5') },
      { label: 'Push/pop alternation', frames: stackOpsFrames('push 1 pop push 2 pop push 3 pop') },
    ],
    build: ({ ops }) => stackOpsFrames(ops),
    inputSchema: {
      fields: [
        { name: 'ops', label: 'Ops (e.g. "push 1 push 2 pop")', type: 'string', default: 'push 3 push 7 push 5 pop push 9 pop pop', max: 80, placeholder: 'push 1 push 2 pop' },
      ],
    },
  },
  'queue-ops': {
    title: 'Queue enqueue/dequeue ops', renderer: 'array',
    cases: [
      { label: 'Default',     frames: queueOpsFrames('enq 3 enq 7 enq 5 deq enq 9 deq deq') },
      { label: 'FIFO drain',  frames: queueOpsFrames('enq 1 enq 2 enq 3 deq deq deq') },
      { label: 'Interleaved', frames: queueOpsFrames('enq 1 deq enq 2 enq 3 deq enq 4 deq') },
    ],
    build: ({ ops }) => queueOpsFrames(ops),
    inputSchema: {
      fields: [
        { name: 'ops', label: 'Ops (e.g. "enq 1 enq 2 deq")', type: 'string', default: 'enq 3 enq 7 enq 5 deq enq 9 deq deq', max: 80, placeholder: 'enq 1 enq 2 deq' },
      ],
    },
  },
  'dfs-traversal':         { title: 'DFS traversal walkthrough',  frames: dfsFrames(),       renderer: 'graph' },
  'union-find': {
    title: 'Union-Find walkthrough', renderer: 'array',
    cases: [
      { label: '3 components',     frames: unionFindFrames([7, 0, 1, 2, 3, 1, 3, 4, 5, 5, 6, 0, 6]) },
      { label: 'Fully connected',  frames: unionFindFrames([5, 0, 1, 1, 2, 2, 3, 3, 4]) },
      { label: 'All singletons',   frames: unionFindFrames([6]) },
    ],
    build: ({ operations }) => unionFindFrames(operations),
    inputSchema: {
      fields: [
        { name: 'operations', label: 'n, then union pairs', type: 'intArray', default: [7, 0, 1, 2, 3, 1, 3, 4, 5, 5, 6, 0, 6], placeholder: 'n, a, b, a, b…' },
      ],
    },
  },
  'zero-one-knapsack': {
    title: '0/1 Knapsack DP fill', renderer: 'array',
    cases: [
      { label: 'Default',       frames: knapsackDPFrames([2, 3, 4, 5], [3, 4, 5, 6], 8) },
      { label: 'Tight capacity', frames: knapsackDPFrames([2, 3, 4, 5], [3, 4, 5, 6], 3) },
      { label: 'No items fit',   frames: knapsackDPFrames([6, 7, 8, 9], [3, 4, 5, 6], 5) },
    ],
    build: ({ weights, values, capacity }) => knapsackDPFrames(weights, values, capacity),
    inputSchema: {
      fields: [
        { name: 'weights',  label: 'Item weights', type: 'intArray', default: [2, 3, 4, 5], placeholder: '2, 3, 4, 5' },
        { name: 'values',   label: 'Item values',  type: 'intArray', default: [3, 4, 5, 6], placeholder: '3, 4, 5, 6' },
        { name: 'capacity', label: 'Capacity',     type: 'int',      default: 8 },
      ],
    },
  },
  'topological-sort':      { title: "Kahn's topological sort",    frames: topoSortFrames(),  renderer: 'graph' },
  'sliding-window-max': {
    title: 'Sliding window max (deque)', renderer: 'window',
    cases: [
      { label: 'Mixed values, k=3',     frames: slidingWindowMaxFrames([1, 3, -1, -3, 5, 3, 6, 7], 3) },
      { label: 'k=1 (each elem wins)',  frames: slidingWindowMaxFrames([4, 2, 5, 1, 6, 3], 1) },
      { label: 'Monotonic decreasing',  frames: slidingWindowMaxFrames([9, 7, 5, 3, 1], 3) },
    ],
    build: ({ array, k }) => slidingWindowMaxFrames(array, k),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [1, 3, -1, -3, 5, 3, 6, 7] },
        { name: 'k', label: 'Window size', type: 'int', default: 3 },
      ],
    },
  },
  'longest-common-subseq': {
    title: 'LCS dynamic programming', renderer: 'array',
    cases: [
      { label: 'Classic mix',     frames: lcsFrames('ABCBDAB', 'BDCAB') },
      { label: 'Identical',       frames: lcsFrames('AAA', 'AAA') },
      { label: 'No overlap',      frames: lcsFrames('abc', 'xyz') },
    ],
    build: ({ a, b }) => lcsFrames(a, b),
    inputSchema: {
      fields: [
        { name: 'a', label: 'String A', type: 'string', default: 'ABCBDAB', max: 12, placeholder: 'ABCBDAB' },
        { name: 'b', label: 'String B', type: 'string', default: 'BDCAB',   max: 12, placeholder: 'BDCAB' },
      ],
    },
  },
  'prefix-sum': {
    title: 'Prefix sum: O(1) range queries', renderer: 'array',
    cases: [
      { label: 'Mid-range query',   frames: prefixSumFrames([3, 1, 4, 1, 5, 9, 2, 6, 5, 3], 2, 6) },
      { label: 'Whole-array query', frames: prefixSumFrames([1, 2, 3, 4, 5, 6], 0, 5) },
      { label: 'With negatives',    frames: prefixSumFrames([-1, 4, -2, 3, -5, 8, -3], 1, 4) },
    ],
    build: ({ array, l, r }) => prefixSumFrames(array, l, r),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [3, 1, 4, 1, 5, 9, 2, 6] },
        { name: 'l', label: 'Query left index', type: 'int', default: 2 },
        { name: 'r', label: 'Query right index', type: 'int', default: 6 },
      ],
    },
  },
  'quickselect': {
    title: 'Quickselect — kth smallest', renderer: 'array',
    cases: [
      { label: 'k = middle (4th)', frames: quickselectFrames([7, 2, 9, 4, 1, 6, 3, 8, 5], 4) },
      { label: 'k = 1 (minimum)',  frames: quickselectFrames([7, 2, 9, 4, 1, 6, 3, 8, 5], 1) },
      { label: 'k = n (maximum)',  frames: quickselectFrames([7, 2, 9, 4, 1, 6, 3, 8, 5], 9) },
    ],
    build: ({ array, k }) => quickselectFrames(array, k),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [7, 2, 9, 4, 1, 6, 3, 8, 5] },
        { name: 'k', label: 'k (1-indexed)', type: 'int', default: 4 },
      ],
    },
  },
  'trie-insert':           { title: 'Trie insertion walkthrough',  frames: trieFrames(),      renderer: 'tree' },
  'hash-collision': {
    title: 'Hash collisions (chaining)', renderer: 'array',
    cases: [
      { label: 'Default (4 collisions)', frames: hashCollisionFrames('10 22 31 4 15 28 17 88 59 7') },
      { label: 'No collisions',          frames: hashCollisionFrames('0 1 2 3 4 5 6') },
      { label: 'Heavy collisions',       frames: hashCollisionFrames('7 14 21 28 35 42 49 56') },
    ],
    build: ({ keys }) => hashCollisionFrames(keys),
    inputSchema: {
      fields: [
        { name: 'keys', label: 'Keys (space-separated)', type: 'string', default: '10 22 31 4 15 28 17 88 59 7', max: 80, placeholder: '10 22 31 4 15…' },
      ],
    },
  },
  'kmp': {
    title: 'KMP failure function build', renderer: 'array',
    cases: [
      { label: 'ababcabab',  frames: kmpFailureFrames('ababcabab') },
      { label: 'aaaaa (all same)', frames: kmpFailureFrames('aaaaa') },
      { label: 'abcdef (no repeats)', frames: kmpFailureFrames('abcdef') },
    ],
    build: ({ pattern }) => kmpFailureFrames(pattern),
    inputSchema: {
      fields: [
        { name: 'pattern', label: 'Pattern (a-z)', type: 'string', default: 'ababcabab', max: 30 },
      ],
    },
  },
  'segment-tree':          { title: 'Segment tree build',          frames: segmentTreeBuildFrames(), renderer: 'array' },
  'bellman-ford':          { title: 'Bellman-Ford walkthrough',    frames: bellmanFordFrames(),   renderer: 'graph' },
  'bst-inorder':           { title: 'BST inorder traversal',       frames: bstInorderFrames(),    renderer: 'array' },
  'n-queens':              { title: 'N-Queens backtracking',       frames: nQueensFrames(),       renderer: 'array' },
  'z-algorithm': {
    title: 'Z-algorithm walkthrough', renderer: 'array',
    cases: [
      { label: 'Default',       frames: zAlgorithmFrames('aabxaabxcaabxaabxay') },
      { label: 'All same chars', frames: zAlgorithmFrames('aaaaaaa') },
      { label: 'No repeats',    frames: zAlgorithmFrames('abcdefg') },
    ],
    build: ({ s }) => zAlgorithmFrames(s),
    inputSchema: {
      fields: [
        { name: 's', label: 'String', type: 'string', default: 'aabxaabxcaabxaabxay', max: 30 },
      ],
    },
  },
  'fenwick-tree': {
    title: 'Fenwick tree build + prefix query', renderer: 'array',
    cases: [
      { label: 'Default (query idx 5)',  frames: fenwickFrames([3, 2, 5, 1, 4, 6, 2, 7], 5) },
      { label: 'Whole prefix',           frames: fenwickFrames([1, 2, 3, 4, 5, 6, 7, 8], 7) },
      { label: 'Sparse zeros',           frames: fenwickFrames([0, 5, 0, 0, 3, 0, 0, 2], 7) },
    ],
    build: ({ array, queryIdx }) => fenwickFrames(array, queryIdx),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [3, 2, 5, 1, 4, 6, 2, 7] },
        { name: 'queryIdx', label: 'Query right index (inclusive)', type: 'int', default: 5 },
      ],
    },
  },
  'huffman-coding': {
    title: 'Huffman coding: priority-queue merges', renderer: 'array',
    cases: [
      { label: 'Default',         frames: huffmanFrames([5, 3, 9, 1, 4, 12]) },
      { label: 'Skewed (one heavy)', frames: huffmanFrames([1, 1, 1, 1, 1, 20]) },
      { label: 'Balanced',        frames: huffmanFrames([4, 4, 4, 4, 4, 4, 4, 4]) },
    ],
    build: ({ frequencies }) => huffmanFrames(frequencies),
    inputSchema: {
      fields: [
        { name: 'frequencies', label: 'Symbol frequencies', type: 'intArray', default: [5, 3, 9, 1, 4, 12], placeholder: '5, 3, 9, 1, 4, 12' },
      ],
    },
  },
  'boyer-moore-majority': {
    title: 'Boyer-Moore majority vote', renderer: 'array',
    cases: [
      { label: 'Majority exists',    frames: boyerMooreFrames([3, 3, 4, 2, 4, 4, 2, 4, 4]) },
      { label: 'No majority',        frames: boyerMooreFrames([1, 2, 3, 4, 5, 6, 7]) },
      { label: 'All same',           frames: boyerMooreFrames([7, 7, 7, 7, 7, 7]) },
    ],
    build: ({ array }) => boyerMooreFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [3, 3, 4, 2, 4, 4, 2, 4, 4], placeholder: '3, 3, 4, 2…' },
      ],
    },
  },
  'euclidean-gcd': {
    title: "Euclidean GCD walkthrough", renderer: 'array',
    cases: [
      { label: 'gcd(48, 18)',  frames: euclideanGcdFrames(48, 18) },
      { label: 'Coprime: gcd(35, 64)', frames: euclideanGcdFrames(35, 64) },
      { label: 'One divides other: gcd(100, 25)', frames: euclideanGcdFrames(100, 25) },
    ],
    build: ({ a, b }) => euclideanGcdFrames(a, b),
    inputSchema: {
      fields: [
        { name: 'a', label: 'a', type: 'int', default: 48 },
        { name: 'b', label: 'b', type: 'int', default: 18 },
      ],
    },
  },
  'lru-cache': {
    title: 'LRU cache (capacity 3)', renderer: 'array',
    cases: [
      { label: 'Default',          frames: lruCacheFrames('put 1 1, put 2 2, put 3 3, get 1, put 4 4, get 2') },
      { label: 'Repeated puts',    frames: lruCacheFrames('put 1 1, put 2 2, put 1 99, put 3 3, get 2, put 4 4') },
      { label: 'All hits',         frames: lruCacheFrames('put 1 10, put 2 20, put 3 30, get 1, get 2, get 3, get 1') },
    ],
    build: ({ ops }) => lruCacheFrames(ops),
    inputSchema: {
      fields: [
        { name: 'ops', label: 'Ops (comma-sep), e.g. "put 1 1, get 1"', type: 'string', default: 'put 1 1, put 2 2, put 3 3, get 1, put 4 4, get 2', max: 120, placeholder: 'put 1 1, get 1, ...' },
      ],
    },
  },
  'sparse-table': {
    title: 'Sparse table: range-min queries', renderer: 'array',
    cases: [
      { label: 'Default',          frames: sparseTableFrames([5, 2, 4, 1, 7, 3, 9, 8]) },
      { label: 'Monotonic up',     frames: sparseTableFrames([1, 2, 3, 4, 5, 6, 7, 8]) },
      { label: 'Single dip',       frames: sparseTableFrames([9, 8, 7, 1, 7, 8, 9, 10]) },
    ],
    build: ({ array }) => sparseTableFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [5, 2, 4, 1, 7, 3, 9, 8], placeholder: '5, 2, 4, 1, 7…' },
      ],
    },
  },
  'kruskals-mst': {
    title: "Kruskal's MST walkthrough", renderer: 'graph',
    cases: [
      { label: 'Default (5 nodes)', frames: kruskalFrames('default') },
      { label: 'Sparse (chain)',    frames: kruskalFrames('sparse') },
      { label: 'Dense (K5)',        frames: kruskalFrames('dense') },
    ],
  },
  'manachers-algorithm': {
    title: "Manacher's longest palindrome", renderer: 'array',
    cases: [
      { label: 'Default',          frames: manacherFrames('babcbabcabbabcd') },
      { label: 'All same',         frames: manacherFrames('aaaaaaa') },
      { label: 'No long palindrome', frames: manacherFrames('abcdefg') },
    ],
    build: ({ s }) => manacherFrames(s),
    inputSchema: {
      fields: [
        { name: 's', label: 'String', type: 'string', default: 'babcbabcabbabcd', max: 40, placeholder: 'babcbabcabbabcd' },
      ],
    },
  },
  'min-stack': {
    title: 'Min-stack: O(1) min via parallel stack', renderer: 'array',
    cases: [
      { label: 'Default',           frames: minStackFrames('push 3, push 5, push 2, min, pop, min, push 1, min') },
      { label: 'Monotonic decreasing pushes', frames: minStackFrames('push 9, push 7, push 5, push 3, min, pop, min, pop, min') },
      { label: 'Pop until empty',   frames: minStackFrames('push 4, push 6, push 2, push 8, pop, pop, min, pop, pop, min') },
    ],
    build: ({ ops }) => minStackFrames(ops),
    inputSchema: {
      fields: [
        { name: 'ops', label: 'Ops (comma-sep): push N, pop, min', type: 'string', default: 'push 3, push 5, push 2, min, pop, min, push 1, min', max: 160, placeholder: 'push 3, push 5, min, pop' },
      ],
    },
  },
  'xor-tricks': {
    title: 'XOR trick: find the singleton', renderer: 'array',
    cases: [
      { label: 'Default',          frames: xorTricksFrames([4, 1, 2, 1, 2]) },
      { label: 'Singleton at end', frames: xorTricksFrames([7, 3, 5, 3, 7, 5, 9]) },
      { label: 'All zeros + one',  frames: xorTricksFrames([0, 0, 8, 5, 5]) },
    ],
    build: ({ array }) => xorTricksFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array (pairs + 1 loner)', type: 'intArray', default: [4, 1, 2, 1, 2], placeholder: '4, 1, 2, 1, 2' },
      ],
    },
  },
  'floyd-warshall': {
    title: 'Floyd-Warshall: all-pairs shortest paths', renderer: 'array',
    cases: [
      { label: 'Default (4 nodes)',    frames: floydWarshallFrames('default') },
      { label: 'With negative edge',   frames: floydWarshallFrames('negative') },
      { label: 'Dense (complete K4)',  frames: floydWarshallFrames('dense') },
    ],
  },
  'bloom-filter': {
    title: 'Bloom filter: insert + query', renderer: 'array',
    cases: [
      { label: 'Default (m=16)',  frames: bloomFilterFrames({ keysStr: 'apple,banana,cherry', queriesStr: 'apple,grape,banana', m: 16 }) },
      { label: 'Tight (m=8)',     frames: bloomFilterFrames({ keysStr: 'apple,banana,cherry', queriesStr: 'apple,grape,banana', m: 8 }) },
      { label: 'Roomy (m=32)',    frames: bloomFilterFrames({ keysStr: 'apple,banana,cherry,date,elder', queriesStr: 'apple,fig,cherry,grape', m: 32 }) },
    ],
    build: ({ keys, queries, m }) => bloomFilterFrames({ keysStr: keys, queriesStr: queries, m }),
    inputSchema: {
      fields: [
        { name: 'keys', label: 'Keys to insert (comma-sep)', type: 'string', default: 'apple,banana,cherry', max: 120, placeholder: 'apple,banana,cherry' },
        { name: 'queries', label: 'Keys to query (comma-sep)', type: 'string', default: 'apple,grape,banana', max: 120, placeholder: 'apple,grape,banana' },
        { name: 'm', label: 'Bit array size m', type: 'int', default: 16 },
      ],
    },
  },
  'reservoir-sampling': {
    title: 'Reservoir sampling: k items from a stream', renderer: 'array',
    cases: [
      { label: 'Default (k=3, 10 items)', frames: reservoirSamplingFrames({ streamStr: 'A,B,C,D,E,F,G,H,I,J', k: 3 }) },
      { label: 'k=1 (random single)',     frames: reservoirSamplingFrames({ streamStr: 'A,B,C,D,E,F,G,H,I,J,K,L', k: 1 }) },
      { label: 'k=5 (half the stream)',   frames: reservoirSamplingFrames({ streamStr: 'A,B,C,D,E,F,G,H,I,J', k: 5 }) },
    ],
    build: ({ stream, k }) => reservoirSamplingFrames({ streamStr: stream, k }),
    inputSchema: {
      fields: [
        { name: 'stream', label: 'Stream (comma-sep items)', type: 'string', default: 'A,B,C,D,E,F,G,H,I,J', max: 160, placeholder: 'A,B,C,D,E,F,G,H,I,J' },
        { name: 'k', label: 'Reservoir capacity k', type: 'int', default: 3 },
      ],
    },
  },
  'longest-increasing-subseq': {
    title: 'LIS via patience sort (O(n log n))', renderer: 'array',
    cases: [
      { label: 'Default',             frames: lisFrames([10, 9, 2, 5, 3, 7, 101, 18]) },
      { label: 'Strictly increasing', frames: lisFrames([1, 2, 3, 4, 5, 6, 7, 8]) },
      { label: 'All same',            frames: lisFrames([4, 4, 4, 4, 4, 4]) },
    ],
    build: ({ array }) => lisFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [10, 9, 2, 5, 3, 7, 101, 18], placeholder: '10, 9, 2, 5, 3, 7…' },
      ],
    },
  },
  'a-star-search': {
    title: 'A* search on a grid', renderer: 'grid',
    cases: [
      { label: 'Default (6×8)',  frames: aStarFrames('default') },
      { label: 'Smaller (4×5)',  frames: aStarFrames('smaller') },
      { label: 'No path',        frames: aStarFrames('noPath') },
    ],
  },
  'max-flow': {
    title: 'Edmonds-Karp max-flow walkthrough', renderer: 'graph',
    cases: [
      { label: 'Default (4 nodes)', frames: maxFlowFrames('default') },
      { label: 'Single path',       frames: maxFlowFrames('single') },
      { label: 'No flow possible',  frames: maxFlowFrames('noFlow') },
    ],
  },
  'aho-corasick': {
    title: 'Aho-Corasick multi-pattern matching', renderer: 'array',
    cases: [
      { label: 'Default ("ushers")', frames: ahoCorasickFrames('ushers') },
      { label: 'No matches',         frames: ahoCorasickFrames('abcdef') },
      { label: 'Many matches',       frames: ahoCorasickFrames('shehishers') },
    ],
  },
  'suffix-array': {
    title: 'Suffix array via prefix doubling', renderer: 'array',
    cases: [
      { label: 'Default ("banana")',  frames: suffixArrayVariantFrames('default') },
      { label: '"mississippi"',       frames: suffixArrayVariantFrames('mississippi') },
      { label: 'All equal ("aaaaa")', frames: suffixArrayVariantFrames('aaaaa') },
    ],
    build: ({ s }) => suffixArrayFrames(s),
    inputSchema: {
      fields: [
        { name: 's', label: 'String (a-z)', type: 'string', default: 'banana', max: 16, placeholder: 'banana' },
      ],
    },
  },
  'suffix-automaton': {
    title: 'Suffix automaton (SAM) construction', renderer: 'array',
    cases: [
      { label: 'Default ("abcbc")', frames: suffixAutomatonFrames('default') },
      { label: 'Repeating ("abab")', frames: suffixAutomatonFrames('abab') },
      { label: 'All same ("aaaa")',  frames: suffixAutomatonFrames('aaaa') },
    ],
  },
  'hopcroft-karp': {
    title: 'Hopcroft-Karp bipartite matching', renderer: 'graph',
    cases: [
      { label: 'Default (4×4 sparse)',   frames: hopcroftKarpFrames('default') },
      { label: 'Complete bipartite',     frames: hopcroftKarpFrames('complete') },
      { label: 'Funnel (low matching)',  frames: hopcroftKarpFrames('noMatch') },
    ],
  },
  'radix-tree': {
    title: 'Radix tree (compressed trie) inserts', renderer: 'array',
    cases: [
      { label: 'Default (edge splits)', frames: radixTreeFrames('default') },
      { label: 'No splits',             frames: radixTreeFrames('noSplits') },
      { label: 'Many splits',           frames: radixTreeFrames('manySplits') },
    ],
  },
  'sweep-line': {
    title: 'Sweep line: maximum interval overlap', renderer: 'array',
    cases: [
      { label: 'Default',         frames: sweepLineFrames([[1, 4], [2, 6], [5, 8], [3, 7], [9, 12]]) },
      { label: 'No overlap',      frames: sweepLineFrames([[1, 2], [3, 4], [5, 6], [7, 8]]) },
      { label: 'All overlap',     frames: sweepLineFrames([[1, 10], [2, 9], [3, 8], [4, 7], [5, 6]]) },
    ],
    build: ({ array }) => sweepLineFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Flattened pairs (s1, e1, s2, e2, …)', type: 'intArray', default: [1, 4, 2, 6, 5, 8, 3, 7, 9, 12], placeholder: '1, 4, 2, 6, 5, 8' },
      ],
    },
  },
  'morris-traversal': {
    title: 'Morris in-order traversal (O(1) space)', renderer: 'array',
    cases: [
      { label: 'Default BST',  frames: morrisTraversalFrames('default') },
      { label: 'Right-skewed', frames: morrisTraversalFrames('rightSkewed') },
      { label: 'Left-skewed',  frames: morrisTraversalFrames('leftSkewed') },
    ],
  },
  'digit-dp': {
    title: 'Digit DP: count numbers in [0, N] with digit sum = target', renderer: 'array',
    cases: [
      { label: 'Default (N=132, target=5)', frames: digitDPFrames('default') },
      { label: 'Small (N=50, target=3)',    frames: digitDPFrames('small') },
      { label: 'Wide (N=200, target=10)',   frames: digitDPFrames('wide') },
    ],
  },
  'coordinate-compression': {
    title: 'Coordinate compression: values → dense ranks', renderer: 'array',
    cases: [
      { label: 'Default (timestamps)', frames: coordinateCompressionFrames([1700001234, 1700005678, 1700001234, 1700009999, 1700002000]) },
      { label: 'Already sorted',       frames: coordinateCompressionFrames([100, 200, 300, 400, 500]) },
      { label: 'Many duplicates',      frames: coordinateCompressionFrames([42, 42, 7, 1000, 7, 42, 1000, 1]) },
    ],
    build: ({ array }) => coordinateCompressionFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array of integers', type: 'intArray', default: [1700001234, 1700005678, 1700001234, 1700009999, 1700002000], placeholder: '17, 4, 17, 99, 42' },
      ],
    },
  },
  'treap': {
    title: 'Treap insertion with rotations', renderer: 'array',
    cases: [
      { label: 'Default',              frames: treapVariantFrames('default') },
      { label: 'Strictly increasing',  frames: treapVariantFrames('increasing') },
      { label: 'Random',               frames: treapVariantFrames('random') },
    ],
    build: ({ array }) => treapFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Insertion order (keys)', type: 'intArray', default: [5, 3, 8, 1, 4, 7, 9], placeholder: '5, 3, 8, 1, 4, 7, 9' },
      ],
    },
  },
  'bit-dp': {
    title: 'Bitmask DP: TSP on n cities', renderer: 'array',
    cases: [
      { label: 'Default (4 cities)', frames: bitDPFrames('default') },
      { label: 'Small (3 cities)',   frames: bitDPFrames('small') },
      { label: 'Large (5 cities)',   frames: bitDPFrames('large') },
    ],
  },
  'dijkstra-pq': {
    title: "Dijkstra with priority queue: stale-entry handling", renderer: 'graph',
    cases: [
      { label: 'Default (5 nodes)', frames: dijkstraPQFrames('default') },
      { label: 'Dense graph',       frames: dijkstraPQFrames('dense') },
      { label: 'No path',           frames: dijkstraPQFrames('noPath') },
    ],
  },
  'string-hashing': {
    title: 'String hashing: polynomial prefix-hash array', renderer: 'array',
    cases: [
      { label: 'Default',         frames: stringHashingFrames({ str: 'abcabc', base: 31, mod: 1000000007 }) },
      { label: 'Palindrome',      frames: stringHashingFrames({ str: 'racecar', base: 31, mod: 1000000007 }) },
      { label: 'Random string',   frames: stringHashingFrames({ str: 'qwertyzxcv', base: 31, mod: 1000000007 }) },
    ],
    build: ({ s, base, mod }) => stringHashingFrames({ str: s, base, mod }),
    inputSchema: {
      fields: [
        { name: 's', label: 'String (a-z)', type: 'string', default: 'abcabc', max: 30, placeholder: 'abcabc' },
        { name: 'base', label: 'Base b', type: 'int', default: 31 },
        { name: 'mod', label: 'Modulus M', type: 'int', default: 1000000007 },
      ],
    },
  },
  'counting-inversions': {
    title: 'Counting inversions via merge sort', renderer: 'array',
    cases: [
      { label: 'Default',          frames: countingInversionsVariantFrames('default') },
      { label: 'Already sorted',   frames: countingInversionsVariantFrames('sorted') },
      { label: 'Reverse sorted',   frames: countingInversionsVariantFrames('reverse') },
    ],
    build: ({ array }) => countingInversionsFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [2, 4, 1, 5, 3], placeholder: '2, 4, 1, 5, 3' },
      ],
    },
  },
  'lca-binary-lifting': {
    title: 'LCA via binary lifting', renderer: 'array',
    cases: [
      { label: 'Default (7 nodes)', frames: lcaBinaryLiftingFrames('default') },
      { label: 'Linear chain',      frames: lcaBinaryLiftingFrames('chain') },
      { label: 'Siblings',          frames: lcaBinaryLiftingFrames('siblings') },
    ],
  },
  'mos-algorithm': {
    title: "Mo's algorithm: offline range queries", renderer: 'array',
    cases: [
      { label: 'Default',     frames: mosAlgorithmFrames('default') },
      { label: 'Tight values', frames: mosAlgorithmFrames('tight') },
      { label: 'All same',    frames: mosAlgorithmFrames('sparse') },
    ],
  },
  'segment-tree-lazy': {
    title: 'Segment tree with lazy propagation', renderer: 'array',
    cases: [
      { label: 'Default (range add + query)', frames: segmentTreeLazyFrames('default') },
      { label: 'Overlapping updates',         frames: segmentTreeLazyFrames('overlap') },
      { label: 'Point update',                frames: segmentTreeLazyFrames('point') },
    ],
  },
  'matrix-exponentiation': {
    title: 'Matrix exponentiation: fib(n) via [[1,1],[1,0]]^n', renderer: 'array',
    cases: [
      { label: 'Default (n=10)', frames: matrixExpoVariantFrames('default') },
      { label: 'n = 8',          frames: matrixExpoVariantFrames('eight') },
      { label: 'n = 12',         frames: matrixExpoVariantFrames('twelve') },
    ],
    build: ({ n }) => matrixExpoFrames(n),
    inputSchema: {
      fields: [
        { name: 'n', label: 'Exponent n (0–60)', type: 'int', default: 10 },
      ],
    },
  },
  'dsu-on-tree': {
    title: 'DSU on tree: small-to-large merging', renderer: 'array',
    cases: [
      { label: 'Default (7 nodes, colours [1,2,1,2,3,2,1])', frames: dsuOnTreeVariantFrames() },
    ],
  },
  'two-sat': {
    title: '2-SAT: implication graph + SCC', renderer: 'array',
    cases: [
      { label: 'Default — (a∨b) ∧ (¬a∨c) ∧ (¬b∨¬c)', frames: twoSatFrames('default') },
      { label: 'SAT — (a∨b) ∧ (¬a∨c) ∧ (b∨c)',       frames: twoSatFrames('sat') },
      { label: 'UNSAT — x ∧ ¬x',                     frames: twoSatFrames('unsat') },
    ],
  },
  'gale-shapley': {
    title: 'Gale–Shapley stable matching', renderer: 'array',
    cases: [
      { label: 'Default',           frames: galeShapleyFrames('default') },
      { label: 'Fully aligned',     frames: galeShapleyFrames('aligned') },
      { label: 'Fully misaligned',  frames: galeShapleyFrames('misaligned') },
    ],
  },
  'zero-one-bfs': {
    title: '0-1 BFS: shortest paths with a deque', renderer: 'graph',
    cases: [
      { label: 'Default (mixed 0/1 weights)', frames: zeroOneBfsFrames('default') },
      { label: 'All weight 1 (regular BFS)',  frames: zeroOneBfsFrames('allOne') },
      { label: 'All weight 0 (trivial)',      frames: zeroOneBfsFrames('allZero') },
    ],
  },
  'heavy-light-decomposition': {
    title: 'Heavy-Light Decomposition: chains on a tree', renderer: 'array',
    cases: [
      { label: 'Default (mixed branching)', frames: heavyLightFrames('default') },
      { label: 'Linear chain (9 nodes)',    frames: heavyLightFrames('chain') },
      { label: 'Balanced tree',             frames: heavyLightFrames('balanced') },
    ],
  },
  'segment-tree-on-intervals': {
    title: 'Interval tree point query: intervals containing p', renderer: 'array',
    cases: [
      { label: 'Default (p=3, one match)',         frames: intervalTreeFrames('default') },
      { label: 'p=6 inside multiple intervals',    frames: intervalTreeFrames('multi') },
      { label: 'p=0 outside all intervals',        frames: intervalTreeFrames('outside') },
    ],
  },
  'quickhull': {
    title: 'Quickhull: convex hull via farthest-from-line recursion', renderer: 'array',
    cases: [
      { label: 'Default (6 mixed points)', frames: quickhullFrames('default') },
      { label: 'All collinear',            frames: quickhullFrames('collinear') },
      { label: 'Square with interior',     frames: quickhullFrames('square') },
    ],
  },
  'disjoint-set-rank': {
    title: 'Disjoint Set (Union-Find) with union-by-rank + path compression', renderer: 'array',
    cases: [
      { label: 'Default — 6 ops on 6 elements', frames: disjointSetRankFrames('default') },
      { label: '3 disjoint (no unions)',        frames: disjointSetRankFrames('disjoint') },
      { label: 'Fully connected (chain unions)', frames: disjointSetRankFrames('chain') },
    ],
  },
  'chinese-remainder': {
    title: 'Chinese Remainder Theorem: merging modular congruences', renderer: 'array',
    cases: [
      { label: 'Default — mods 3, 5, 7',     frames: chineseRemainderFrames('default') },
      { label: 'Two congruences (mods 4, 9)', frames: chineseRemainderFrames('two') },
      { label: 'Classic Sun Tzu problem',     frames: chineseRemainderFrames('classic') },
    ],
  },
  'amortized-analysis': {
    title: 'Amortised analysis: dynamic-array push via the accounting method', renderer: 'array',
    cases: [
      { label: 'Default — 12 pushes from capacity 1', frames: amortizedAnalysisFrames('default') },
      { label: 'No resizes (capacity already 16)',     frames: amortizedAnalysisFrames('noResize') },
      { label: 'Many resizes (16 pushes from cap 1)',  frames: amortizedAnalysisFrames('manyResize') },
    ],
  },
  'fft-basics': {
    title: 'FFT basics: polynomial multiplication via point-value form', renderer: 'array',
    cases: [
      { label: 'Default — (1+2x) · (1+3x)',          frames: fftBasicsFrames('default') },
      { label: 'Longer — (1+2x+3x²) · (4+5x+6x²)',   frames: fftBasicsFrames('longer') },
      { label: 'Identity — 1 · (1+2x+3x²+4x³)',      frames: fftBasicsFrames('unit') },
    ],
  },
  'segment-tree-beats': {
    title: 'Segment Tree Beats: chmin + range-sum on [5,3,7,2,4]', renderer: 'array',
    cases: [
      { label: 'Default — chmin(4) hits Case 2',     frames: segmentTreeBeatsFrames('default') },
      { label: 'chmin(10): Case 1, no-op',           frames: segmentTreeBeatsFrames('noTouch') },
      { label: 'All-equal leaves cascade',           frames: segmentTreeBeatsFrames('allEqual') },
    ],
  },
  'segment-tree-persistent': {
    title: 'Persistent segment tree: shared subtrees across versions', renderer: 'array',
    cases: [
      { label: 'Default — 3 updates, mixed indices', frames: persistentSegmentTreeFrames('default') },
      { label: 'Left-heavy updates (0, 0, 1)',       frames: persistentSegmentTreeFrames('leftHeavy') },
      { label: 'Right-heavy updates (3, 3, 2)',      frames: persistentSegmentTreeFrames('rightHeavy') },
    ],
  },
  'string-edit-distance': {
    title: "Edit distance DP: 'kitten' → 'sitting'", renderer: 'array',
    cases: [
      { label: "Default — 'kitten' → 'sitting'",     frames: stringEditDistanceFrames('default') },
      { label: 'Equal strings (distance 0)',         frames: stringEditDistanceFrames('equal') },
      { label: 'Disjoint alphabets (pure replace)',  frames: stringEditDistanceFrames('disjoint') },
    ],
  },
  'ternary-search': {
    title: 'Ternary search on a unimodal parabola', renderer: 'array',
    cases: [
      { label: 'Default — peak at x=5 on [0,10]',    frames: ternarySearchFrames('default') },
      { label: 'Off-centre peak at x=2',             frames: ternarySearchFrames('offCentre') },
      { label: 'Narrow start near optimum',          frames: ternarySearchFrames('narrow') },
    ],
  },
  'cycle-detection-graph': {
    title: '3-color DFS cycle detection in a directed graph', renderer: 'graph',
    cases: [
      { label: 'Default — cycle 0→1→2→0',     frames: cycleDetectionGraphFrames('default') },
      { label: 'DAG — no cycle (diamond)',    frames: cycleDetectionGraphFrames('dag') },
      { label: 'Self-loop on node 2',         frames: cycleDetectionGraphFrames('selfLoop') },
    ],
  },
  'euler-tour-tree': {
    title: 'Euler tour: tin/tout on a 7-node tree', renderer: 'array',
    cases: [
      { label: 'Default — balanced tree',     frames: eulerTourTreeFrames('default') },
      { label: 'Chain (deep path)',           frames: eulerTourTreeFrames('chain') },
      { label: 'Star (root + 6 leaves)',      frames: eulerTourTreeFrames('star') },
    ],
  },
  'binary-lifting-general': {
    title: 'Binary lifting: up[k][v] table + ancestor query', renderer: 'array',
    cases: [
      { label: 'Default — ancestor^4(7)',     frames: binaryLiftingGeneralFrames('default') },
      { label: 'Chain — ancestor^4(7)',       frames: binaryLiftingGeneralFrames('chain') },
      { label: 'Bushy — ancestor^2(7)',       frames: binaryLiftingGeneralFrames('star') },
    ],
  },
  'dp-on-trees': {
    title: 'DP on trees: largest independent set', renderer: 'array',
    cases: [
      { label: 'Default — balanced tree',     frames: dpOnTreesFrames('default') },
      { label: 'Chain — house robber on path',frames: dpOnTreesFrames('chain') },
      { label: 'Star — heavy root vs leaves', frames: dpOnTreesFrames('star') },
    ],
  },
  'monotonic-stack': {
    title: 'Monotonic stack walkthrough', renderer: 'array',
    cases: [
      { label: 'Histogram bars',     frames: monotonicStackFrames([2, 1, 5, 6, 2, 3]) },
      { label: 'Strictly increasing', frames: monotonicStackFrames([1, 2, 3, 4, 5, 6]) },
      { label: 'Strictly decreasing', frames: monotonicStackFrames([6, 5, 4, 3, 2, 1]) },
    ],
    build: ({ array }) => monotonicStackFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [2, 1, 5, 6, 2, 3], placeholder: '2, 1, 5, 6, 2, 3' },
      ],
    },
  },
  'bellman-ford-detection': {
    title: 'Bellman-Ford negative-cycle detection', renderer: 'graph',
    cases: [
      { label: 'Default (negative cycle)', frames: bellmanFordDetectionFrames('default') },
      { label: 'No cycle (converges)',     frames: bellmanFordDetectionFrames('safe') },
      { label: 'Negative self-loop',       frames: bellmanFordDetectionFrames('selfLoop') },
    ],
  },
  'kahns-algorithm': {
    title: "Kahn's algorithm (topological sort via BFS)", renderer: 'graph',
    cases: [
      { label: 'Default (6 nodes)', frames: kahnsAlgorithmFrames('default') },
      { label: 'Linear chain',      frames: kahnsAlgorithmFrames('chain') },
      { label: 'Diamond',           frames: kahnsAlgorithmFrames('diamond') },
    ],
  },
  'cuckoo-hashing': {
    title: 'Cuckoo hashing: 2 tables, displace-on-collision', renderer: 'array',
    cases: [
      { label: 'Default (6 keys)',     frames: cuckooHashingFrames([12, 25, 37, 49, 18, 5]) },
      { label: 'Heavy collisions',     frames: cuckooHashingFrames([10, 15, 20, 25, 30, 35]) },
      { label: 'Sparse (few kicks)',   frames: cuckooHashingFrames([1, 7, 13, 4]) },
    ],
    build: ({ keys }) => cuckooHashingFrames(keys),
    inputSchema: {
      fields: [
        { name: 'keys', label: 'Keys to insert', type: 'intArray', default: [12, 25, 37, 49, 18, 5], placeholder: '12, 25, 37, 49, 18, 5' },
      ],
    },
  },
  'convex-hull-trick': {
    title: 'Convex hull trick: lower envelope of lines', renderer: 'array',
    cases: [
      { label: 'Default (5 lines)',  frames: convexHullTrickFrames('default') },
      { label: 'Parallel pairs',     frames: convexHullTrickFrames('parallel') },
      { label: 'With dominated line', frames: convexHullTrickFrames('dominated') },
    ],
  },
  'merkle-tree': {
    title: 'Merkle tree: build + inclusion proof', renderer: 'array',
    cases: [
      { label: 'Default (4 blocks, prove idx 2)', frames: merkleTreeFrames(['alpha', 'bravo', 'charlie', 'delta']) },
      { label: '8 blocks',                         frames: merkleTreeFrames(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) },
      { label: '2 blocks (minimal tree)',          frames: merkleTreeFrames(['foo', 'bar']) },
    ],
    build: ({ blocks }) => merkleTreeFrames(String(blocks).split(',').map(s => s.trim()).filter(Boolean)),
    inputSchema: {
      fields: [
        { name: 'blocks', label: 'Block contents (comma-sep)', type: 'string', default: 'alpha,bravo,charlie,delta', max: 80, placeholder: 'alpha,bravo,charlie,delta' },
      ],
    },
  },
  'lru-cache-design': {
    title: 'LRU cache: hashmap + doubly-linked list in motion', renderer: 'array',
    cases: [
      { label: 'Default (cap 3, mixed ops)', frames: lruCacheDesignFrames({ capacity: 3, ops: 'put 1 A; put 2 B; put 3 C; get 1; put 4 D; get 2; put 5 E' }) },
      { label: 'No evictions (cap 4)',       frames: lruCacheDesignFrames({ capacity: 4, ops: 'put 1 A; put 2 B; get 1; put 3 C; get 2; put 4 D' }) },
      { label: 'Heavy eviction (cap 2)',     frames: lruCacheDesignFrames({ capacity: 2, ops: 'put 1 A; put 2 B; put 3 C; put 4 D; get 3; put 5 E' }) },
    ],
    build: ({ capacity, ops }) => lruCacheDesignFrames({ capacity, ops }),
    inputSchema: {
      fields: [
        { name: 'capacity', label: 'Cache capacity (1-8)', type: 'int', default: 3, placeholder: '3' },
        { name: 'ops', label: 'Ops (e.g. put 1 A; get 1; put 2 B)', type: 'string', default: 'put 1 A; put 2 B; put 3 C; get 1; put 4 D; get 2; put 5 E', max: 200, placeholder: 'put 1 A; get 1; put 2 B' },
      ],
    },
  },
  'consistent-hashing': {
    title: 'Consistent hashing ring: bounded blast radius on node change', renderer: 'graph',
    cases: [
      { label: 'Default — remove B (3 servers)',  frames: consistentHashingFrames('default') },
      { label: 'Two servers — remove A',          frames: consistentHashingFrames('twoServers') },
      { label: 'Add new server D',                frames: consistentHashingFrames('add') },
    ],
  },
  'paxos-basics': {
    title: 'Paxos: Prepare → Promise → Accept → Accepted (5 acceptors)', renderer: 'array',
    cases: [
      { label: 'Default — full quorum (5/5 → 3/5)', frames: paxosBasicsFrames('default') },
      { label: 'Contested — minimum quorum (3/5)',  frames: paxosBasicsFrames('contested') },
      { label: 'Quorum fails (2/5)',                frames: paxosBasicsFrames('fails') },
    ],
  },
  'circuit-breaker': {
    title: 'Circuit breaker: CLOSED → OPEN → HALF_OPEN → CLOSED', renderer: 'array',
    cases: [
      { label: 'Default — trip then recover',     frames: circuitBreakerFrames({ threshold: 3, cooldown: 4, stream: 'ok,fail,fail,fail,fail,skip,skip,skip,probe-ok,ok' }) },
      { label: 'Probe fails — reopen',            frames: circuitBreakerFrames({ threshold: 2, cooldown: 3, stream: 'ok,fail,fail,skip,skip,probe-fail,skip,skip,skip,probe-ok' }) },
      { label: 'No failures — stays CLOSED',      frames: circuitBreakerFrames({ threshold: 3, cooldown: 4, stream: 'ok,ok,ok,ok,ok,ok' }) },
    ],
    build: ({ threshold, cooldown, stream }) => circuitBreakerFrames({ threshold, cooldown, stream }),
    inputSchema: {
      fields: [
        { name: 'threshold', label: 'Failure threshold (1-10)', type: 'int', default: 3, placeholder: '3' },
        { name: 'cooldown',  label: 'Cooldown ticks (1-20)',    type: 'int', default: 4, placeholder: '4' },
        { name: 'stream',    label: 'Events (ok / fail / skip / probe-ok / probe-fail, comma-sep)', type: 'string', default: 'ok,fail,fail,fail,fail,skip,skip,skip,probe-ok,ok', max: 200, placeholder: 'ok,fail,fail,fail,skip,probe-ok' },
      ],
    },
  },
  'raft-consensus': {
    title: 'Raft: heartbeat, election timeout, new leader', renderer: 'graph',
    cases: [
      { label: 'Default — clean re-election (5 nodes)', frames: raftConsensusFrames('default') },
      { label: 'Split vote — two rounds',                frames: raftConsensusFrames('split') },
      { label: 'Minimal 3-node cluster',                 frames: raftConsensusFrames('threeNode') },
    ],
  },
  'dutch-national-flag': {
    title: 'Dutch National Flag: 3-way partition with low/mid/high', renderer: 'array',
    cases: [
      { label: 'Sort 0/1/2', frames: dutchNationalFlagFrames([2, 0, 2, 1, 1, 0]) },
    ],
  },
  'array-cyclic-sort': {
    title: 'Cyclic sort: place every value at its home index', renderer: 'array',
    cases: [
      { label: 'Place i at i', frames: arrayCyclicSortFrames([3, 1, 5, 4, 2]) },
    ],
  },
  'binary-search-on-answer': {
    title: 'Binary search on the answer: monotone predicate on an integer axis', renderer: 'array',
    cases: [
      { label: 'Min capacity ships', frames: binarySearchOnAnswerFrames() },
    ],
  },
  'coin-change-variants': {
    title: 'Coin change (min coins): 1D DP fill', renderer: 'array',
    cases: [
      { label: 'Min coins for amount 11 with [1,2,5]', frames: coinChangeVariantsFrames([1, 2, 5], 11) },
    ],
  },
  'mst-kruskal': {
    title: "Kruskal's MST: sort edges, union-find for cycle check", renderer: 'graph',
    cases: [
      { label: '5 nodes', frames: kruskalFrames('default') },
    ],
  },
  'hash-rolling-rabin-karp': {
    title: 'Rabin-Karp: rolling polynomial hash for substring match', renderer: 'array',
    cases: [
      { label: "Match 'cd' in 'abcabcd'", frames: hashRollingRabinKarpFrames('cd', 'abcabcd') },
    ],
  },
  'find-peak-element': {
    title: 'Find peak element: O(log n) slope-following binary search', renderer: 'array',
    cases: [
      { label: 'Peak in the middle',   frames: findPeakElementFrames([1, 2, 1, 3, 5, 6, 4]) },
      { label: 'Strictly increasing',  frames: findPeakElementFrames([1, 2, 3, 4, 5]) },
      { label: 'Plateau-free zigzag',  frames: findPeakElementFrames([5, 1, 4, 2, 6, 3, 7]) },
    ],
  },
  'next-greater-element': {
    title: 'Next greater element with a monotonic stack', renderer: 'array',
    cases: [
      { label: 'Mixed values', frames: nextGreaterElementFrames([4, 5, 2, 25, 7, 8]) },
      { label: 'Strictly decreasing (none found)', frames: nextGreaterElementFrames([9, 7, 5, 3, 1]) },
      { label: 'Strictly increasing (immediate)',  frames: nextGreaterElementFrames([1, 3, 4, 6, 9]) },
    ],
  },
  'monotonic-deque': {
    title: 'Monotonic deque: sliding window maximum in O(n)', renderer: 'array',
    cases: [
      { label: 'Classic window k = 3', frames: monotonicDequeFrames([1, 3, -1, -3, 5, 3, 6, 7], 3) },
      { label: 'Window k = 2',         frames: monotonicDequeFrames([4, 2, 12, 9, 3, 7, 1, 6], 2) },
      { label: 'All increasing',       frames: monotonicDequeFrames([1, 2, 3, 4, 5, 6], 3) },
    ],
  },
  'largest-rectangle-histogram': {
    title: 'Largest rectangle in histogram via monotonic stack', renderer: 'array',
    cases: [
      { label: 'Classic [2,1,5,6,2,3]', frames: largestRectangleHistogramFrames([2, 1, 5, 6, 2, 3]) },
      { label: 'Monotone increasing',   frames: largestRectangleHistogramFrames([1, 2, 3, 4, 5]) },
      { label: 'Plateau in the middle', frames: largestRectangleHistogramFrames([3, 1, 3, 2, 2, 2]) },
    ],
  },
  'subarray-sum-equals-k': {
    title: 'Subarray sum equals K with prefix-sum hash counts', renderer: 'array',
    cases: [
      { label: 'Includes negatives', frames: subarraySumEqualsKFrames([1, 1, 1, 2, -1, 1], 2) },
      { label: 'k = 3',              frames: subarraySumEqualsKFrames([3, 4, 7, 2, -3, 1, 4, 2], 7) },
      { label: 'No solution',        frames: subarraySumEqualsKFrames([1, 2, 3], 100) },
    ],
  },
  'jump-game-i-ii': {
    title: 'Jump Game II: layered BFS for minimum jumps', renderer: 'array',
    cases: [
      { label: 'Mixed jumps',  frames: jumpGameIIFrames([2, 3, 1, 1, 4]) },
      { label: 'Big first leap', frames: jumpGameIIFrames([5, 1, 1, 1, 1, 1]) },
      { label: 'Tight chain',   frames: jumpGameIIFrames([1, 2, 1, 1, 1]) },
    ],
  },
  'interval-merge': {
    title: 'Merge overlapping intervals after sorting by start', renderer: 'array',
    cases: [
      { label: 'Classic 5 intervals', frames: intervalMergeFrames([[1, 3], [2, 6], [8, 10], [9, 11], [15, 18]]) },
      { label: 'No overlaps',          frames: intervalMergeFrames([[1, 2], [3, 4], [5, 6], [7, 8]]) },
      { label: 'All collapse',         frames: intervalMergeFrames([[1, 10], [2, 5], [3, 6], [4, 9]]) },
    ],
  },
  'gas-station-circular': {
    title: 'Gas station circular tour: single-pass start finder', renderer: 'array',
    cases: [
      { label: 'Default 5 stations', frames: gasStationCircularFrames([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]) },
      { label: 'Impossible loop',     frames: gasStationCircularFrames([2, 3, 4], [3, 4, 3]) },
      { label: 'Tight margin',        frames: gasStationCircularFrames([5, 1, 2, 3, 4], [4, 4, 1, 5, 1]) },
    ],
  },
  'best-stock-multiple-tx': {
    title: 'Best time to buy and sell stock: sum of positive deltas', renderer: 'array',
    cases: [
      { label: 'Classic prices',       frames: bestStockMultipleTxFrames([7, 1, 5, 3, 6, 4]) },
      { label: 'Monotone increasing',  frames: bestStockMultipleTxFrames([1, 2, 3, 4, 5]) },
      { label: 'Monotone decreasing',  frames: bestStockMultipleTxFrames([7, 6, 4, 3, 1]) },
    ],
  },
  'random-shuffle-fisher-yates': {
    title: 'Fisher-Yates shuffle: in-place uniform permutation', renderer: 'array',
    cases: [
      { label: '6 cards', frames: fisherYatesShuffleFrames(['A', 'B', 'C', 'D', 'E', 'F']) },
    ],
  },
  'trie-autocomplete': {
    title: 'Trie autocomplete: prefix walk + DFS collect', renderer: 'array',
    cases: [
      { label: 'Prefix "ca"', frames: trieAutocompleteFrames(['cat', 'car', 'card', 'care', 'dog'], 'ca') },
      { label: 'Prefix "do"', frames: trieAutocompleteFrames(['cat', 'car', 'card', 'care', 'dog'], 'do') },
      { label: 'Missing prefix', frames: trieAutocompleteFrames(['cat', 'car', 'card', 'care', 'dog'], 'zz') },
    ],
  },
  'island-count-bfs': {
    title: 'Number of islands via BFS flood fill', renderer: 'grid',
    cases: [
      { label: 'Default 4 x 5 grid', frames: islandCountBfsFrames() },
    ],
  },
  'unique-paths-grid': {
    title: 'Unique paths in m x n grid: 2D DP fill', renderer: 'grid',
    cases: [
      { label: '3 x 4 grid', frames: uniquePathsGridFrames(3, 4) },
      { label: '4 x 4 grid', frames: uniquePathsGridFrames(4, 4) },
      { label: '2 x 5 grid', frames: uniquePathsGridFrames(2, 5) },
    ],
  },
  'dp-edit-distance-levenshtein': {
    title: 'Edit distance: Levenshtein DP table fill', renderer: 'grid',
    cases: [
      { label: '"kitten" -> "sitting"', frames: editDistanceFrames('kitten', 'sitting') },
      { label: '"horse" -> "ros"',      frames: editDistanceFrames('horse', 'ros') },
    ],
  },
  'dp-knapsack-bounded-unbounded': {
    title: '0/1 knapsack: 2D capacity-by-item DP table', renderer: 'grid',
    cases: [
      { label: 'Default 4 items, W = 7', frames: knapsack01Frames([1, 3, 4, 5], [1, 4, 5, 7], 7) },
      { label: 'Tight capacity',          frames: knapsack01Frames([2, 2, 3], [3, 4, 5], 5) },
    ],
  },
  'dp-coin-change-min-coins': {
    title: 'Coin change minimum coins: 1D DP fill', renderer: 'array',
    cases: [
      { label: 'Amount 11 with [1,2,5]', frames: coinChangeMinCoinsFrames([1, 2, 5], 11) },
      { label: 'Amount 7 with [2,4]',    frames: coinChangeMinCoinsFrames([2, 4], 7) },
      { label: 'Amount 6 with [1,3,4]',  frames: coinChangeMinCoinsFrames([1, 3, 4], 6) },
    ],
  },
  'tree-diameter': {
    title: 'Tree diameter: post-order DFS bubbling subtree depths', renderer: 'tree',
    cases: [
      { label: '7-node sample tree', frames: treeDiameterFrames() },
    ],
  },
  'validate-bst': {
    title: 'Validate BST: DFS with (min, max) bounds', renderer: 'tree',
    cases: [
      { label: 'Valid 9-node BST', frames: validateBstFrames() },
    ],
  },
  'kth-smallest-bst': {
    title: 'Kth smallest in BST via in-order DFS counter', renderer: 'tree',
    cases: [
      { label: 'k = 3', frames: kthSmallestBstFrames(3) },
      { label: 'k = 1', frames: kthSmallestBstFrames(1) },
      { label: 'k = 6', frames: kthSmallestBstFrames(6) },
    ],
  },
  'tree-right-side-view': {
    title: 'Right-side view via BFS, recording last node per level', renderer: 'tree',
    cases: [
      { label: 'Default sample tree', frames: treeRightSideViewFrames() },
    ],
  },
  'dfs-iterative': {
    title: 'Iterative DFS with an explicit stack', renderer: 'graph',
    cases: [
      { label: '6-node tree', frames: dfsIterativeFrames() },
    ],
  },
  'bipartite-check': {
    title: 'Bipartite check via BFS two-coloring', renderer: 'graph',
    cases: [
      { label: '6-cycle (bipartite)', frames: bipartiteCheckFrames() },
    ],
  },
  'word-ladder-bfs': {
    title: 'Word ladder shortest transformation via BFS', renderer: 'graph',
    cases: [
      { label: '"hit" -> "cog"', frames: wordLadderBfsFrames() },
    ],
  },
  'string-min-window-substring': {
    title: 'Minimum window substring: expand + shrink with character demand', renderer: 'window',
    cases: [
      { label: '"ADOBECODEBANC" / "ABC"', frames: minWindowSubstringFrames('ADOBECODEBANC', 'ABC') },
      { label: '"aaaaaab" / "ab"',        frames: minWindowSubstringFrames('aaaaaab', 'ab') },
      { label: '"abc" / "ad" (no window)', frames: minWindowSubstringFrames('abc', 'ad') },
    ],
  },
  'subarray-product-less-k': {
    title: 'Subarray product less than K: two-pointer sliding window', renderer: 'window',
    cases: [
      { label: 'Classic [10,5,2,6] k=100', frames: subarrayProductLessKFrames([10, 5, 2, 6], 100) },
      { label: 'All under k',               frames: subarrayProductLessKFrames([1, 2, 3], 50) },
      { label: 'All over k',                frames: subarrayProductLessKFrames([20, 30, 40], 10) },
    ],
  },
  'longest-substring-without-repeating-characters': {
    title: 'Longest Substring Without Repeating Characters',
    renderer: 'window',
    cases: [
      { label: '"abcabcbb"', frames: longestSubstrFrames('abcabcbb') },
      { label: '"pwwkew"',   frames: longestSubstrFrames('pwwkew') },
      { label: '"bbbbb"',    frames: longestSubstrFrames('bbbbb') },
      { label: '"dvdf"',     frames: longestSubstrFrames('dvdf') },
    ],
    build: ({ s }) => longestSubstrFrames(s),
    inputSchema: {
      fields: [
        { name: 's', label: 'String', type: 'string', default: 'abcabcbb', max: 30, placeholder: 'abcabcbb' },
      ],
    },
  },
  'longest-repeating-character-replacement': {
    title: 'Longest Repeating Character Replacement',
    renderer: 'window',
    cases: [
      { label: '"AABABBA", k=1', frames: longestRepeatingReplacementFrames('AABABBA', 1) },
      { label: '"ABAB", k=2',    frames: longestRepeatingReplacementFrames('ABAB', 2) },
      { label: '"AAAA", k=0',    frames: longestRepeatingReplacementFrames('AAAA', 0) },
      { label: '"ABCDE", k=1',   frames: longestRepeatingReplacementFrames('ABCDE', 1) },
    ],
    build: ({ s, k }) => longestRepeatingReplacementFrames(s, k),
    inputSchema: {
      fields: [
        { name: 's', label: 'String (uppercase)', type: 'string', default: 'AABABBA', max: 30, placeholder: 'AABABBA' },
        { name: 'k', label: 'Replacements allowed (k)', type: 'int', default: 1, max: 20 },
      ],
    },
  },
  'minimum-window-substring': {
    title: 'Minimum Window Substring',
    renderer: 'window',
    cases: [
      { label: '"ADOBECODEBANC" / "ABC"', frames: minimumWindowSubstringFrames('ADOBECODEBANC', 'ABC') },
      { label: '"a" / "a"',                frames: minimumWindowSubstringFrames('a', 'a') },
      { label: '"a" / "aa" (no window)',   frames: minimumWindowSubstringFrames('a', 'aa') },
      { label: '"aaaaaab" / "ab"',         frames: minimumWindowSubstringFrames('aaaaaab', 'ab') },
    ],
    build: ({ s, t }) => minimumWindowSubstringFrames(s, t),
    inputSchema: {
      fields: [
        { name: 's', label: 'Source string s', type: 'string', default: 'ADOBECODEBANC', max: 40 },
        { name: 't', label: 'Target string t', type: 'string', default: 'ABC', max: 20 },
      ],
    },
  },
  'permutation-in-string': {
    title: 'Permutation in String',
    renderer: 'window',
    cases: [
      { label: '"ab" in "eidbaooo"', frames: permutationInStringFrames('ab', 'eidbaooo') },
      { label: '"ab" in "eidboaoo"', frames: permutationInStringFrames('ab', 'eidboaoo') },
      { label: '"abc" in "ccccbabcaa"', frames: permutationInStringFrames('abc', 'ccccbabcaa') },
      { label: '"adc" in "dcda"',    frames: permutationInStringFrames('adc', 'dcda') },
    ],
    build: ({ s1, s2 }) => permutationInStringFrames(s1, s2),
    inputSchema: {
      fields: [
        { name: 's1', label: 'Pattern s1', type: 'string', default: 'ab', max: 20 },
        { name: 's2', label: 'Text s2',    type: 'string', default: 'eidbaooo', max: 40 },
      ],
    },
  },
  'trie-insertion-search': {
    title: 'Trie: insert words, then search',
    renderer: 'tree',
    cases: [
      { label: 'Insert apple, app, apricot — search "app"', frames: trieInsertSearchFrames(['apple', 'app', 'apricot'], 'app') },
      { label: 'Search miss — "apx"',                       frames: trieInsertSearchFrames(['apple', 'app', 'apricot'], 'apx') },
      { label: 'Prefix-only hit — "ap"',                    frames: trieInsertSearchFrames(['apple', 'app', 'apricot'], 'ap') },
    ],
    build: ({ words, search }) => trieInsertSearchFrames(String(words || '').split(',').map(s => s.trim()).filter(Boolean), search),
    inputSchema: {
      fields: [
        { name: 'words', label: 'Words to insert (comma-sep)', type: 'string', default: 'apple,app,apricot', max: 60, placeholder: 'apple,app,apricot' },
        { name: 'search', label: 'Search query', type: 'string', default: 'app', max: 20, placeholder: 'app' },
      ],
    },
  },
  'topological-sort-kahn': {
    title: "Kahn's topological sort (in-degree BFS)",
    renderer: 'graph',
    cases: [
      { label: '6-node DAG (default)', frames: topoSortKahnFrames([[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], 6) },
      { label: 'Linear chain (5 nodes)', frames: topoSortKahnFrames([[0, 1], [1, 2], [2, 3], [3, 4]], 5) },
      { label: 'Diamond (4 nodes)',      frames: topoSortKahnFrames([[0, 1], [0, 2], [1, 3], [2, 3]], 4) },
    ],
    build: ({ edges, n }) => {
      const parsed = String(edges || '').split(/[,;]\s*/).map(p => p.split(/\s*-\s*|\s*->\s*|\s+/).map(Number)).filter(x => x.length === 2 && x.every(Number.isFinite));
      return topoSortKahnFrames(parsed, n);
    },
    inputSchema: {
      fields: [
        { name: 'n', label: 'Number of nodes', type: 'int', default: 6, max: 10 },
        { name: 'edges', label: 'Directed edges (e.g. "0-1, 0-2, 1-3")', type: 'string', default: '0-1, 0-2, 1-3, 2-3, 3-4, 4-5', max: 100, placeholder: '0-1, 0-2, 1-3' },
      ],
    },
  },
  'union-find-with-rank': {
    title: 'Union-Find: rank + path compression',
    renderer: 'graph',
    cases: [
      { label: 'Default — 3 unions + find(3)', frames: unionFindRankFrames([['union', 0, 1], ['union', 2, 3], ['union', 0, 2], ['find', 3]], 6) },
      { label: 'Sequential chain',             frames: unionFindRankFrames([['union', 0, 1], ['union', 1, 2], ['union', 2, 3], ['find', 0]], 5) },
      { label: 'Already connected (no-op)',    frames: unionFindRankFrames([['union', 0, 1], ['union', 0, 1], ['find', 1]], 4) },
    ],
    build: ({ n, ops }) => {
      const parsed = String(ops || '').split(/[,;]\s*/).map(t => {
        const parts = t.trim().split(/\s+/);
        if (!parts.length) return null;
        const kind = parts[0].toLowerCase();
        if (kind === 'union' && parts.length >= 3) return ['union', Number(parts[1]), Number(parts[2])];
        if (kind === 'find' && parts.length >= 2) return ['find', Number(parts[1])];
        return null;
      }).filter(Boolean);
      return unionFindRankFrames(parsed, n);
    },
    inputSchema: {
      fields: [
        { name: 'n', label: 'Number of elements', type: 'int', default: 6, max: 10 },
        { name: 'ops', label: 'Ops (e.g. "union 0 1; union 2 3; find 3")', type: 'string', default: 'union 0 1; union 2 3; union 0 2; find 3', max: 120, placeholder: 'union 0 1; find 0' },
      ],
    },
  },
  'segment-tree-range-sum': {
    title: 'Segment tree: build, then range-sum query',
    renderer: 'tree',
    cases: [
      { label: 'arr=[1,3,5,7,9,11], query(1,4)', frames: segmentTreeRangeSumFrames([1, 3, 5, 7, 9, 11], 1, 4) },
      { label: 'Single-element query (2,2)',     frames: segmentTreeRangeSumFrames([1, 3, 5, 7, 9, 11], 2, 2) },
      { label: 'Full range (0,5)',               frames: segmentTreeRangeSumFrames([1, 3, 5, 7, 9, 11], 0, 5) },
    ],
    build: ({ array, qL, qR }) => segmentTreeRangeSumFrames(array, qL, qR),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [1, 3, 5, 7, 9, 11], placeholder: '1, 3, 5, 7, 9, 11' },
        { name: 'qL', label: 'Query left index', type: 'int', default: 1 },
        { name: 'qR', label: 'Query right index', type: 'int', default: 4 },
      ],
    },
  },
  'prims-algorithm': {
    title: "Prim's MST walkthrough", renderer: 'graph',
    cases: [
      { label: '6-node graph (default)', frames: primFrames() },
      { label: 'Dense 5-node graph',     frames: primFrames('dense') },
      { label: 'Linear chain',           frames: primFrames('chain') },
    ],
  },
  'radix-sort-algorithm': {
    title: 'Radix sort: digit-by-digit bucket passes', renderer: 'array',
    cases: [
      { label: '3-digit mix (default)', frames: radixSortFrames([170, 45, 75, 90, 802, 24, 2, 66]) },
      { label: 'Single digit (1 pass)', frames: radixSortFrames([9, 3, 7, 1, 5, 2, 8, 4]) },
      { label: 'Mixed widths',          frames: radixSortFrames([3, 121, 7, 45, 9, 230, 18, 6]) },
    ],
    build: ({ array }) => radixSortFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Non-negative integers', type: 'intArray', default: [170, 45, 75, 90, 802, 24, 2, 66], placeholder: '170, 45, 75…' },
      ],
    },
  },
  'boyer-moore-string-search': {
    title: 'Boyer-Moore: bad-character skips', renderer: 'array',
    cases: [
      { label: 'Classic EXAMPLE (found)', frames: boyerMooreSearchFrames('HERE-IS-A-SIMPLE-EXAMPLE', 'EXAMPLE') },
      { label: 'Big jumps (FOX)',         frames: boyerMooreSearchFrames('THE-QUICK-BROWN-FOX', 'FOX') },
      { label: 'Not found',               frames: boyerMooreSearchFrames('ABCDABCEABCFABCD', 'ABCG') },
    ],
    build: ({ text, pattern }) => boyerMooreSearchFrames(text, pattern),
    inputSchema: {
      fields: [
        { name: 'text', label: 'Text', type: 'string', default: 'HERE-IS-A-SIMPLE-EXAMPLE', max: 40, placeholder: 'HERE-IS-A-SIMPLE-EXAMPLE' },
        { name: 'pattern', label: 'Pattern', type: 'string', default: 'EXAMPLE', max: 12, placeholder: 'EXAMPLE' },
      ],
    },
  },
};
