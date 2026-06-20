// Interactive viz batch: more algorithms (set A).
// Renderers mirror AlgoVisualizer.jsx exactly.
//   array: { array, subRow?, pointers?, highlights?, eliminated?, caption }
//     tile states: current|visited|done|frontier|compared|tree|pivot|match|new|found|key|left|right|low|high
//   graph: { nodes:[{id,label?,state?}], edges:[{a,b,w?,state?}], caption }
//     node states: current|frontier|visited|done ; edge states: current|frontier|tree|visited|rejected
//   tree: { tree:{_id,value,left,right,state?}, caption }
//     node states: current|visited|frontier|done|key|new|unbalanced|found|pivot|match
// Self-contained pure JS — no imports from conceptVisualizations.js.

// ===========================================================================
// insertion-sort-algorithm (array) — grow a sorted prefix, shifting larger
// elements right until the key drops into place.
// ===========================================================================
function insertionSortFrames(input = [5, 2, 4, 6, 1, 3]) {
  const a = input.map((x) => x | 0);
  const n = a.length;
  const frames = [];
  if (n === 0) return [{ array: [], caption: 'Empty array — already sorted, nothing to do.' }];

  const sortedHi = (hi) => {
    const hl = {};
    for (let t = 0; t <= hi; t++) hl[t] = 'done';
    return hl;
  };

  frames.push({
    array: [...a],
    highlights: { 0: 'done' },
    caption: `Insertion sort of [${a.join(', ')}]. The prefix a[0..0] = [${a[0]}] is trivially sorted (one element). Grow it one card at a time.`,
  });

  for (let i = 1; i < n && frames.length < 78; i++) {
    const key = a[i];
    const hlTake = sortedHi(i - 1);
    hlTake[i] = 'current';
    frames.push({
      array: [...a],
      pointers: { [i]: 'key' },
      highlights: hlTake,
      caption: `i = ${i}: take key = ${key}. The sorted fan is a[0..${i - 1}] = [${a.slice(0, i).join(', ')}]. Slide ${key} left through it until the left neighbour is smaller.`,
    });

    let j = i - 1;
    let shifted = 0;
    while (j >= 0 && a[j] > key && frames.length < 78) {
      const hlCmp = sortedHi(i - 1);
      hlCmp[j] = 'compared';
      hlCmp[j + 1] = 'frontier';
      frames.push({
        array: [...a],
        pointers: { [j]: 'j' },
        highlights: hlCmp,
        caption: `Compare a[${j}] = ${a[j]} with key ${key}: ${a[j]} > ${key}, so shift a[${j}] one slot right into index ${j + 1}.`,
      });
      a[j + 1] = a[j];
      shifted += 1;
      j -= 1;
    }
    a[j + 1] = key;

    const hlDrop = sortedHi(i);
    hlDrop[j + 1] = 'match';
    const stopReason = j < 0
      ? `key ${key} is the new minimum — it travelled to the front`
      : `a[${j}] = ${a[j]} <= ${key}, so the slide stops`;
    frames.push({
      array: [...a],
      pointers: { [j + 1]: 'key' },
      highlights: hlDrop,
      caption: `Drop key ${key} into index ${j + 1} (${stopReason}). Did ${shifted} shift${shifted === 1 ? '' : 's'}. Sorted prefix is now a[0..${i}] = [${a.slice(0, i + 1).join(', ')}].`,
    });
  }

  frames.push({
    array: [...a],
    highlights: sortedHi(n - 1),
    caption: `Sorted: [${a.join(', ')}]. Total cost scales with the number of inversions — O(n) on already-sorted input, O(n^2) when reversed. In place and stable.`,
  });
  return frames;
}

// ===========================================================================
// kmp-deep-dive (array) — build the prefix function (LPS), then narrate the
// failure-chain fallback during a match.
// ===========================================================================
function kmpFrames(pattern = 'ababcababa', text = 'abababcababab') {
  const P = String(pattern);
  const m = P.length;
  const frames = [];
  if (m === 0) return [{ array: [], caption: 'Empty pattern — the prefix function is empty.' }];

  const chars = P.split('');
  const pi = new Array(m).fill(0);

  frames.push({
    array: chars,
    subRow: { values: pi.map(String), label: 'pi' },
    highlights: { 0: 'done' },
    caption: `Pattern P = "${P}". Build the prefix function pi: pi[i] = length of the longest proper prefix of P[0..i] that is also a suffix. pi[0] = 0 always (a single char has no proper prefix).`,
  });

  let k = 0;
  for (let i = 1; i < m && frames.length < 70; i++) {
    while (k > 0 && P[k] !== P[i]) {
      const hl = { [k]: 'compared', [i]: 'current' };
      frames.push({
        array: chars,
        subRow: { values: pi.map(String), label: 'pi' },
        pointers: { [i]: 'i', [k]: 'k' },
        highlights: hl,
        caption: `i = ${i}: P[k] = '${P[k]}' != P[i] = '${P[i]}'. Mismatch — walk the failure chain: k = pi[k-1] = pi[${k - 1}] = ${pi[k - 1]}. The matched prefix shrinks; i never moves back.`,
      });
      k = pi[k - 1];
    }
    if (P[k] === P[i]) {
      const hl = { [k]: 'match', [i]: 'current' };
      frames.push({
        array: chars,
        subRow: { values: pi.map(String), label: 'pi' },
        pointers: { [i]: 'i', [k]: 'k' },
        highlights: hl,
        caption: `i = ${i}: P[k] = '${P[k]}' == P[i] = '${P[i]}'. Extend the matched prefix by one: k = ${k + 1}.`,
      });
      k += 1;
    }
    pi[i] = k;
    const doneHl = {};
    for (let t = 0; t <= i; t++) doneHl[t] = 'done';
    frames.push({
      array: chars,
      subRow: { values: pi.map(String), label: 'pi' },
      pointers: { [i]: 'i' },
      highlights: doneHl,
      caption: `Set pi[${i}] = ${k}. Across the whole build k rises at most m-1 times and every fallback strictly lowers k, so total work is O(m).`,
    });
  }

  frames.push({
    array: chars,
    subRow: { values: pi.map(String), label: 'pi' },
    highlights: Object.fromEntries(chars.map((_, t) => [t, 'done'])),
    caption: `Prefix function complete: pi = [${pi.join(', ')}]. These failure links let the matcher slide the pattern without ever re-reading a text character.`,
  });

  // Match phase against the text.
  const T = String(text);
  const n = T.length;
  let q = 0;
  let matchedAt = -1;
  frames.push({
    array: T.split(''),
    subRow: { values: T.split('').map(() => '.'), label: 'T' },
    caption: `Search phase: scan T = "${T}". Keep q = number of pattern chars currently matched. The text cursor i only advances — that is the whole point of KMP.`,
  });

  for (let i = 0; i < n && frames.length < 78; i++) {
    while (q > 0 && P[q] !== T[i]) {
      frames.push({
        array: T.split(''),
        pointers: { [i]: 'i' },
        highlights: { [i]: 'compared' },
        caption: `T[${i}] = '${T[i]}' != P[q] = '${P[q]}'. Slide the pattern via the failure chain: q = pi[q-1] = ${pi[q - 1]}. i stays at ${i}.`,
      });
      q = pi[q - 1];
    }
    if (P[q] === T[i]) q += 1;
    const matchHl = {};
    for (let t = i - q + 1; t <= i; t++) if (t >= 0) matchHl[t] = 'match';
    matchHl[i] = q > 0 && P[q - 1] === T[i] ? 'current' : 'compared';
    frames.push({
      array: T.split(''),
      pointers: { [i]: 'i' },
      highlights: matchHl,
      caption: `T[${i}] = '${T[i]}': ${P[q - 1] === T[i] ? `matched, q = ${q}` : `no extend, q = ${q}`}. The matched window is the last ${q} character${q === 1 ? '' : 's'} of T.`,
    });
    if (q === m) {
      matchedAt = i - m + 1;
      const foundHl = {};
      for (let t = matchedAt; t <= i; t++) foundHl[t] = 'found';
      frames.push({
        array: T.split(''),
        pointers: { [matchedAt]: 'start' },
        highlights: foundHl,
        caption: `Full match: P occurs at text index ${matchedAt}. Continue with q = pi[q-1] = ${pi[m - 1]} to find overlapping matches without rescanning.`,
      });
      q = pi[m - 1];
    }
  }

  frames.push({
    array: T.split(''),
    caption: matchedAt >= 0
      ? `Search done. First occurrence at index ${matchedAt}. Build O(m) + search O(n) = O(n + m), optimal — every text char read at most a constant number of times.`
      : `Search done — pattern not found. Still O(n + m): the text cursor never backed up.`,
  });
  return frames;
}

// ===========================================================================
// median-of-medians (array) — deterministic O(n) selection: groups of 5,
// median of each, recurse for the pivot, partition.
// ===========================================================================
function medianOfMediansFrames(input = [12, 3, 5, 7, 4, 19, 26, 23, 2, 1, 8, 24, 0], kSmall = 4) {
  const arr = input.map((x) => x | 0);
  const n = arr.length;
  const frames = [];
  if (n === 0) return [{ array: [], caption: 'Empty array — nothing to select.' }];
  const k = Math.max(0, Math.min(n - 1, kSmall | 0));

  frames.push({
    array: [...arr],
    caption: `Find the ${k + 1}-th smallest (k = ${k}) of n = ${n} elements in O(n) worst case. Quickselect's risk is a bad pivot; median-of-medians manufactures a provably good one.`,
  });
  frames.push({
    array: [...arr],
    caption: `Plan: (1) split into groups of 5 and take each group's median, (2) recursively select the median of those medians as the pivot, (3) partition and recurse into the side that holds rank ${k}.`,
  });

  // Step 1: groups of 5, median of each.
  const groupMedians = [];
  const medianIdx = [];
  for (let g = 0; g * 5 < n && frames.length < 70; g++) {
    const lo = g * 5;
    const hi = Math.min(lo + 5, n);
    const groupHl = {};
    for (let t = lo; t < hi; t++) groupHl[t] = 'frontier';
    frames.push({
      array: [...arr],
      highlights: groupHl,
      caption: `Group ${g + 1}: indices ${lo}..${hi - 1} = [${arr.slice(lo, hi).join(', ')}]. Sort it and take the median (cheap — at most 5 items).`,
    });
    const slice = arr.slice(lo, hi).map((v, idx) => ({ v, idx: lo + idx }));
    slice.sort((p, q) => p.v - q.v);
    const med = slice[(slice.length - 1) >> 1];
    groupMedians.push(med.v);
    medianIdx.push(med.idx);
    const medHl = { ...groupHl };
    medHl[med.idx] = 'key';
    frames.push({
      array: [...arr],
      highlights: medHl,
      caption: `Sorted group = [${slice.map((s) => s.v).join(', ')}], median = ${med.v} (the 'key' cell). Collect it into the medians list: [${groupMedians.join(', ')}].`,
    });
  }

  // Step 2: pivot = median of the group medians.
  const medSorted = [...groupMedians].sort((a, b) => a - b);
  const pivot = medSorted[(medSorted.length - 1) >> 1];
  const pivotIdx = arr.indexOf(pivot);
  const pivotHl = {};
  medianIdx.forEach((mi) => { pivotHl[mi] = 'key'; });
  if (pivotIdx >= 0) pivotHl[pivotIdx] = 'pivot';
  frames.push({
    array: [...arr],
    highlights: pivotHl,
    caption: `Recursively select the median of the medians [${groupMedians.join(', ')}] -> pivot = ${pivot}. This pivot is guaranteed greater than ~30% and less than ~30% of all elements.`,
  });

  // Step 3: partition around pivot — build it element by element.
  const lo = arr.filter((x) => x < pivot);
  const eq = arr.filter((x) => x === pivot);
  frames.push({
    array: [...arr],
    highlights: { ...(pivotIdx >= 0 ? { [pivotIdx]: 'pivot' } : {}) },
    caption: `Now partition the array around pivot ${pivot}: route each element left (< ${pivot}), pivot (== ${pivot}), or right (> ${pivot}).`,
  });
  const partHl = pivotIdx >= 0 ? { [pivotIdx]: 'pivot' } : {};
  for (let idx = 0; idx < n && frames.length < 76; idx++) {
    const x = arr[idx];
    partHl[idx] = x < pivot ? 'left' : x > pivot ? 'right' : 'pivot';
    if (idx % 4 === 0 || idx === n - 1) {
      frames.push({
        array: [...arr],
        highlights: { ...partHl },
        pointers: { [idx]: 'i' },
        caption: `a[${idx}] = ${x} -> ${x < pivot ? 'LEFT' : x > pivot ? 'RIGHT' : 'PIVOT block'}. Partition so far colours indices 0..${idx}.`,
      });
    }
  }
  frames.push({
    array: [...arr],
    highlights: { ...partHl },
    caption: `Partition complete around ${pivot}: ${lo.length} smaller (left), ${eq.length} equal (pivot), ${n - lo.length - eq.length} larger (right). At least 30% land on each side, so each recursive call drops ~30%.`,
  });

  const where = k < lo.length
    ? `k = ${k} < ${lo.length} -> the answer is in the LEFT part; recurse there.`
    : k < lo.length + eq.length
      ? `k = ${k} falls in the equal block -> the answer IS the pivot ${pivot}.`
      : `k = ${k} >= ${lo.length + eq.length} -> recurse RIGHT for the (k - ${lo.length + eq.length})-th smallest there.`;
  frames.push({
    array: [...arr],
    highlights: partHl,
    caption: `Locate k against the partition. ${where} Recurrence T(n) <= T(n/5) + T(7n/10) + O(n) solves to O(n) — deterministic, no bad-pivot blowup.`,
  });
  return frames;
}

// ===========================================================================
// meet-in-the-middle (array) — split into halves, enumerate subset sums of
// each, sort one, binary-search the complement.
// ===========================================================================
function meetInMiddleFrames(input = [3, 4, 5, 2, 7, 1], target = 10) {
  const items = input.map((x) => x | 0);
  const n = items.length;
  const T = target | 0;
  const frames = [];
  if (n === 0) return [{ array: [], caption: 'Empty item set — only the empty subset, sum 0.' }];

  const half = n >> 1;
  const A = items.slice(0, half);
  const B = items.slice(half);

  const splitHl = {};
  items.forEach((_, idx) => { splitHl[idx] = idx < half ? 'left' : 'right'; });
  frames.push({
    array: [...items],
    highlights: splitHl,
    caption: `Subset-sum to T = ${T} over n = ${n} items. Brute force is 2^${n}; meet-in-the-middle splits into A = [${A.join(', ')}] (left) and B = [${B.join(', ')}] (right), each of size ~n/2.`,
  });

  const subsetSums = (xs) => {
    const out = [];
    for (let mask = 0; mask < (1 << xs.length); mask++) {
      let s = 0;
      const members = [];
      for (let i = 0; i < xs.length; i++) if (mask & (1 << i)) { s += xs[i]; members.push(xs[i]); }
      out.push({ sum: s, members });
    }
    return out;
  };

  frames.push({
    array: [...items],
    highlights: splitHl,
    caption: `Algebra: if a chosen subset sums to T, then sum(chosen-from-A) + sum(chosen-from-B) = T, i.e. sum(A part) = T - sum(B part). Enumerate each half separately and meet in the middle.`,
  });

  // Enumerate A's subset sums incrementally.
  const rawA = subsetSums(A);
  for (let i = 0; i < rawA.length && frames.length < 74; i++) {
    if (i % 2 === 0 || i === rawA.length - 1) {
      frames.push({
        array: rawA.slice(0, i + 1).map((e) => e.sum),
        caption: `Enumerate A's subsets: {${rawA[i].members.join(', ') || 'empty'}} -> sum ${rawA[i].sum}. Built ${i + 1} of 2^${A.length} A-sums so far.`,
      });
    }
  }
  const sumsA = rawA.map((e) => e.sum).sort((x, y) => x - y);
  frames.push({
    array: sumsA,
    caption: `Sort A's 2^${A.length} subset sums into the lookup table: [${sumsA.join(', ')}]. Sorting enables O(log) complement lookups. Total build O(n * 2^(n/2)).`,
  });

  const sumsB = subsetSums(B);
  frames.push({
    array: sumsB.map((e) => e.sum),
    caption: `Enumerate B's 2^${B.length} subset sums: [${sumsB.map((e) => e.sum).join(', ')}]. For each one s_B we binary-search T - s_B in A's sorted table — a hit means the two halves combine to exactly T.`,
  });

  let solution = null;
  for (let i = 0; i < sumsB.length && frames.length < 76; i++) {
    const sB = sumsB[i].sum;
    const need = T - sB;
    let lo = 0;
    let hi = sumsA.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (sumsA[mid] === need) { found = mid; break; }
      if (sumsA[mid] < need) lo = mid + 1; else hi = mid - 1;
    }
    const hl = {};
    if (found >= 0) hl[found] = 'found';
    else {
      const clamp = Math.max(0, Math.min(sumsA.length - 1, lo));
      hl[clamp] = 'compared';
    }
    frames.push({
      array: sumsA,
      highlights: hl,
      caption: `B-subset {${sumsB[i].members.join(', ') || 'empty'}} has sum ${sB}. Binary-search A for T - ${sB} = ${need}: ${found >= 0 ? `FOUND at index ${found}` : 'not present'}.`,
    });
    if (found >= 0 && !solution) {
      solution = { sB, members: sumsB[i].members };
      break;
    }
  }

  if (solution) {
    frames.push({
      array: sumsA,
      caption: `Combine: an A-subset summing to ${T - solution.sB} plus the B-subset {${solution.members.join(', ') || 'empty'}} (sum ${solution.sB}) reaches T = ${T}. Total work O(n * 2^(n/2)) — the exponent is halved.`,
    });
  } else {
    frames.push({
      array: sumsA,
      caption: `No B-sum's complement appears in A, so no subset sums to ${T}. Still only O(n * 2^(n/2)) work — far below the 2^${n} brute force.`,
    });
  }
  return frames;
}

// ===========================================================================
// kahn-cycle-detect (graph) — in-degree BFS topological sort that reports
// cycles when the queue empties before every vertex is emitted.
// ===========================================================================
function kahnFrames({ nodes, edges, label, expectCycle }) {
  const adj = {};
  const indeg = {};
  nodes.forEach((id) => { adj[id] = []; indeg[id] = 0; });
  edges.forEach((e) => { adj[e.a].push(e.b); indeg[e.b] += 1; });
  for (const kk in adj) adj[kk].sort((x, y) => x - y);

  const frames = [];
  const order = [];
  const queue = [];
  const emitted = new Set();

  const snap = (currentId, caption, treeEdgeKeys) => {
    const ns = nodes.map((id) => ({
      id,
      label: `${id}\nin=${indeg[id]}`,
      state: emitted.has(id) ? 'done'
        : id === currentId ? 'current'
          : queue.includes(id) ? 'frontier'
            : undefined,
    }));
    const es = edges.map((e) => {
      const key = `${e.a}-${e.b}`;
      if (treeEdgeKeys && treeEdgeKeys.has(key)) return { ...e, state: 'current' };
      if (emitted.has(e.a)) return { ...e, state: 'visited' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  snap(null, `${label}: compute every vertex's in-degree by scanning all edges once. Each label shows id and current in-degree (in=...).`);
  nodes.forEach((id) => { if (indeg[id] === 0) queue.push(id); });
  queue.sort((x, y) => x - y);
  snap(null, `Seed the FIFO queue with every in-degree-0 vertex: [${queue.join(', ')}] (note "every" — disconnected DAGs have several sources). order = [].`);

  let guard = 0;
  while (queue.length && guard < 60) {
    guard += 1;
    const u = queue.shift();
    emitted.add(u);
    order.push(u);
    snap(u, `Pop ${u} (in-degree 0): emit it. order = [${order.join(', ')}]. Now relax its outgoing edges one by one — each decrement marks a prerequisite satisfied.`);
    const newlyReady = [];
    const treeKeys = new Set();
    for (const v of adj[u]) {
      indeg[v] -= 1;
      treeKeys.add(`${u}-${v}`);
      const ready = indeg[v] === 0 && !emitted.has(v);
      if (ready) { queue.push(v); newlyReady.push(v); }
      queue.sort((x, y) => x - y);
      snap(u, `Relax edge ${u} -> ${v}: in[${v}] drops to ${indeg[v]}. ${ready ? `It hit 0 -> enqueue ${v}.` : `Still > 0, ${v} waits for more prerequisites.`} queue = [${queue.join(', ')}].`, new Set([`${u}-${v}`]));
    }
    if (adj[u].length === 0) {
      snap(u, `${u} has no outgoing edges — nothing to relax. queue = [${queue.join(', ')}].`, treeKeys);
    }
  }

  if (order.length === nodes.length) {
    snap(null, `Queue empty and order.length = ${order.length} == V. The graph is a DAG; [${order.join(', ')}] is one valid topological order.`);
  } else {
    const stuck = nodes.filter((id) => !emitted.has(id));
    const ns = nodes.map((id) => ({
      id,
      label: `${id}\nin=${indeg[id]}`,
      state: emitted.has(id) ? 'done' : 'current',
    }));
    const es = edges.map((e) => (!emitted.has(e.a) && !emitted.has(e.b) ? { ...e, state: 'rejected' } : (emitted.has(e.a) ? { ...e, state: 'visited' } : e)));
    frames.push({
      nodes: ns,
      edges: es,
      caption: `Queue empty but only ${order.length} of ${nodes.length} vertices emitted. The stuck set {${stuck.join(', ')}} all keep positive in-degree -> a directed cycle. ${expectCycle ? 'Cycle detected, as expected.' : ''}`,
    });
  }
  return frames;
}

function kahnDag() {
  const nodes = [0, 1, 2, 3, 4, 5];
  const edges = [
    { a: 5, b: 2 }, { a: 5, b: 0 }, { a: 4, b: 0 },
    { a: 4, b: 1 }, { a: 2, b: 3 }, { a: 3, b: 1 },
  ];
  return kahnFrames({ nodes, edges, label: 'Kahn (DAG)', expectCycle: false });
}

function kahnCycle() {
  const nodes = [0, 1, 2, 3, 4, 5];
  const edges = [
    { a: 5, b: 2 }, { a: 5, b: 0 }, { a: 4, b: 0 },
    { a: 4, b: 1 }, { a: 2, b: 3 }, { a: 3, b: 1 },
    { a: 1, b: 4 },
  ];
  return kahnFrames({ nodes, edges, label: 'Kahn (has cycle)', expectCycle: true });
}

function kahnDiamond() {
  const nodes = [0, 1, 2, 3];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 1, b: 3 }, { a: 2, b: 3 },
  ];
  return kahnFrames({ nodes, edges, label: 'Kahn (diamond DAG)', expectCycle: false });
}

// ===========================================================================
// lowest-common-ancestor-bst (tree) — descend from root, branching by value
// comparison; the first node that splits p and q is the LCA.
// ===========================================================================
let _nid = 0;
function tnode(value, left, right) { return { _id: ++_nid, value, left: left || null, right: right || null }; }
function paintTree(n, states) {
  if (!n) return null;
  return { _id: n._id, value: n.value, state: states[n._id], left: paintTree(n.left, states), right: paintTree(n.right, states) };
}
function lcaBuildTree() {
  _nid = 0;
  return tnode(8,
    tnode(4,
      tnode(2),
      tnode(6, tnode(5), tnode(7))),
    tnode(12, null, tnode(16)));
}

function lcaFrames(p, q) {
  const root = lcaBuildTree();
  const frames = [];
  const keyStates = { [findId(root, p)]: 'key', [findId(root, q)]: 'key' };

  // Mark subtree node ids (for the elimination narration).
  const subtreeIds = (n) => {
    if (!n) return [];
    return [n._id, ...subtreeIds(n.left), ...subtreeIds(n.right)];
  };

  frames.push({
    tree: paintTree(root, { ...keyStates }),
    caption: `LCA(${p}, ${q}) in this BST. The two query nodes are highlighted ('key'). The lowest common ancestor is the deepest node that has both in its subtree.`,
  });
  frames.push({
    tree: paintTree(root, { ...keyStates }),
    caption: `BST shortcut: at any node, if both queries are smaller go left, if both larger go right, otherwise they split here and this node is the LCA. One root-to-LCA walk, O(h).`,
  });
  frames.push({
    tree: paintTree(root, { ...keyStates, [root._id]: 'current' }),
    caption: `Start the descent at the root ${root.value}. We never need a second pass or a post-order — each comparison either commits to a subtree or declares the LCA.`,
  });

  let cur = root;
  let hops = 0;
  let guard = 0;
  while (cur && guard < 20) {
    guard += 1;
    const states = { ...keyStates, [cur._id]: 'current' };
    // Visit + compare frame.
    frames.push({
      tree: paintTree(root, states),
      caption: `Visit node ${cur.value}. Compare both queries against it: ${p} vs ${cur.value} and ${q} vs ${cur.value}.`,
    });
    if (p < cur.value && q < cur.value) {
      const drop = states[cur._id];
      const elimStates = { ...keyStates, [cur._id]: 'current' };
      for (const id of subtreeIds(cur.right)) if (!keyStates[id]) elimStates[id] = 'visited';
      void drop;
      frames.push({
        tree: paintTree(root, elimStates),
        caption: `Both ${p} < ${cur.value} and ${q} < ${cur.value}. Every node in ${cur.value}'s RIGHT subtree holds values > ${cur.value}, so neither query can be there — prune it ('visited').`,
      });
      frames.push({
        tree: paintTree(root, states),
        caption: `Descend into the LEFT subtree of ${cur.value}. (hop ${hops + 1})`,
      });
      cur = cur.left;
      hops += 1;
    } else if (p > cur.value && q > cur.value) {
      const elimStates = { ...keyStates, [cur._id]: 'current' };
      for (const id of subtreeIds(cur.left)) if (!keyStates[id]) elimStates[id] = 'visited';
      frames.push({
        tree: paintTree(root, elimStates),
        caption: `Both ${p} > ${cur.value} and ${q} > ${cur.value}. Every node in ${cur.value}'s LEFT subtree holds values < ${cur.value}, so neither query can be there — prune it ('visited').`,
      });
      frames.push({
        tree: paintTree(root, states),
        caption: `Descend into the RIGHT subtree of ${cur.value}. (hop ${hops + 1})`,
      });
      cur = cur.right;
      hops += 1;
    } else {
      const foundStates = { ...keyStates, [cur._id]: 'found' };
      const isAncestorCase = cur.value === p || cur.value === q;
      const reason = isAncestorCase
        ? `node ${cur.value} equals one of the queries, so it is itself an ancestor of the other`
        : `${p} sits on one side and ${q} on the other (one < ${cur.value}, one > ${cur.value})`;
      frames.push({
        tree: paintTree(root, { ...keyStates, [cur._id]: 'current' }),
        caption: `At node ${cur.value} the queries no longer agree on a direction: ${reason}.`,
      });
      frames.push({
        tree: paintTree(root, foundStates),
        caption: `${isAncestorCase ? 'Ancestor case' : 'Split point'} reached — this is where the root-to-p and root-to-q paths diverge. LCA(${p}, ${q}) = ${cur.value}.`,
      });
      frames.push({
        tree: paintTree(root, foundStates),
        caption: `LCA(${p}, ${q}) = ${cur.value}, reached in ${hops} hop${hops === 1 ? '' : 's'} from the root. O(h) time, O(1) extra space — the BST ordering does all the work in one descent.`,
      });
      break;
    }
  }
  return frames;
}

function findId(n, val) {
  if (!n) return null;
  if (n.value === val) return n._id;
  return findId(n.left, val) || findId(n.right, val);
}

// ===========================================================================
export default {
  'insertion-sort-algorithm': {
    title: 'Insertion sort: grow a sorted prefix',
    renderer: 'array',
    cases: [
      { label: 'Mixed [5,2,4,6,1,3]', frames: insertionSortFrames([5, 2, 4, 6, 1, 3]) },
      { label: 'Nearly sorted [1,2,4,3,5]', frames: insertionSortFrames([1, 2, 4, 3, 5]) },
      { label: 'Reverse [5,4,3,2,1]', frames: insertionSortFrames([5, 4, 3, 2, 1]) },
    ],
    build: ({ nums }) => insertionSortFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'array (comma-separated)', type: 'string', default: '5,2,4,6,1,3', max: 40, placeholder: '5,2,4,6,1,3' },
      ],
    },
  },
  'kmp-deep-dive': {
    title: 'KMP: prefix function + match with fallback',
    renderer: 'array',
    cases: [
      { label: 'P=ababcababa in text', frames: kmpFrames('ababcababa', 'abababcababab') },
      { label: 'P=aab in aaaaaaaab', frames: kmpFrames('aab', 'aaaaaaaab') },
      { label: 'P=abcabd (no match)', frames: kmpFrames('abcabd', 'abcabcabx') },
    ],
    build: ({ pattern, text }) => kmpFrames(String(pattern ?? 'ababcababa'), String(text ?? 'abababcababab')),
    inputSchema: {
      fields: [
        { name: 'pattern', label: 'pattern', type: 'string', default: 'ababcababa', max: 16, placeholder: 'ababcababa' },
        { name: 'text', label: 'text', type: 'string', default: 'abababcababab', max: 24, placeholder: 'abababcababab' },
      ],
    },
  },
  'median-of-medians': {
    title: 'Median of medians: deterministic pivot',
    renderer: 'array',
    cases: [
      { label: '5th smallest, 13 elems', frames: medianOfMediansFrames([12, 3, 5, 7, 4, 19, 26, 23, 2, 1, 8, 24, 0], 4) },
      { label: 'Min (k=0)', frames: medianOfMediansFrames([9, 1, 8, 2, 7, 3, 6, 4, 5, 0], 0) },
      { label: 'Median of 11', frames: medianOfMediansFrames([15, 3, 9, 8, 5, 11, 2, 7, 1, 12, 6], 5) },
    ],
    build: ({ nums, k }) => medianOfMediansFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
      Number(k),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'array (comma-separated)', type: 'string', default: '12,3,5,7,4,19,26,23,2,1,8,24,0', max: 60, placeholder: '12,3,5,7,4,19,26,23,2,1,8,24,0' },
        { name: 'k', label: 'k (0-based rank)', type: 'number', default: 4, min: 0, max: 30 },
      ],
    },
  },
  'meet-in-the-middle': {
    title: 'Meet in the middle: split, enumerate, combine',
    renderer: 'array',
    cases: [
      { label: 'T=10 over [3,4,5,2,7,1]', frames: meetInMiddleFrames([3, 4, 5, 2, 7, 1], 10) },
      { label: 'T=14 over 8 items', frames: meetInMiddleFrames([1, 8, 3, 6, 2, 9, 4, 5], 14) },
      { label: 'No subset hits T=100', frames: meetInMiddleFrames([3, 4, 5, 2, 7, 1], 100) },
    ],
    build: ({ nums, target }) => meetInMiddleFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
      Number(target),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'items (comma-separated)', type: 'string', default: '3,4,5,2,7,1', max: 40, placeholder: '3,4,5,2,7,1' },
        { name: 'target', label: 'target sum T', type: 'number', default: 10, min: 0, max: 999 },
      ],
    },
  },
  'kahn-cycle-detect': {
    title: "Kahn's algorithm: in-degree BFS + cycle detection",
    renderer: 'graph',
    cases: [
      { label: 'DAG (full topo order)', frames: kahnDag() },
      { label: 'Cycle (queue stalls)', frames: kahnCycle() },
      { label: 'Diamond DAG', frames: kahnDiamond() },
    ],
  },
  'lowest-common-ancestor-bst': {
    title: 'LCA in a BST: descend by value comparison',
    renderer: 'tree',
    cases: [
      { label: 'LCA(2, 7) = 4', frames: lcaFrames(2, 7) },
      { label: 'LCA(5, 7) = 6', frames: lcaFrames(5, 7) },
      { label: 'LCA(4, 5) = 4 (ancestor)', frames: lcaFrames(4, 5) },
    ],
  },
};
