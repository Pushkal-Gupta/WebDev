// Interactive viz for advanced string / greedy / DP concepts.
//
// Array-renderer frames mirror the learn shape used in batchStringMatch.js:
//   { array, subRow?, pointers?, highlights?, eliminated?, caption }
//   - array:      cells displayed left-to-right
//   - subRow:     { values:[...], label } second row riding under the array
//   - pointers:   { index: 'name' } small labels above a cell
//   - highlights: { index: 'match'|'current'|'pivot'|'done' } semantic flags
//   - eliminated: Set of indices greyed out (settled / out of window)
//   - caption:    narration string
//
// Graph-renderer frames mirror GraphRenderer in AlgoVisualizer.jsx:
//   { nodes:[{id,label,state?}], edges:[{a,b,w?,state?}], caption }
//   node states: 'current' | 'frontier' | 'visited' | 'done'
//   edge states: 'current' | 'frontier' | 'tree' | 'visited' | 'rejected'
//
// All helpers are self-contained pure JS — no imports from conceptVisualizations.js.
// No emoji, no hardcoded colors: only semantic state flags in frame data.

// ===========================================================================
// Z-function — prefix-match array build with the [L, R] window.
// ===========================================================================
function zFunctionFrames(input = 'aabcaabxaaaz') {
  const s = String(input ?? '');
  if (!s.length) return [{ array: [], caption: 'Empty string — no Z-array to build.' }];
  const arr = s.split('');
  const n = arr.length;
  const z = new Array(n).fill(0);
  const frames = [];

  const subFromZ = () => ({
    values: z.map((v, i) => (i === 0 ? '·' : String(v))),
    label: 'Z',
  });

  frames.push({
    array: arr,
    subRow: subFromZ(),
    caption: `Z-function of "${s}": Z[i] = length of the longest prefix of the string that also starts at position i. Z[0] is left undefined (·). We sweep i = 1..${n - 1} keeping a window [L,R] — the rightmost prefix-match found so far.`,
  });

  let L = 0;
  let R = 0;
  for (let i = 1; i < n; i++) {
    if (i < R) {
      const mirror = i - L;
      const cap = R - i;
      const seed = Math.min(z[mirror], cap);
      frames.push({
        array: arr,
        subRow: subFromZ(),
        pointers: { [i]: 'i', [L]: 'L', [Math.min(R, n - 1)]: 'R' },
        highlights: { [i]: 'current', [mirror]: 'pivot' },
        caption: `i=${i} sits inside the window [L=${L}, R=${R}). Its mirror is i−L=${mirror}, whose Z is ${z[mirror]}. Seed Z[${i}] = min(Z[${mirror}]=${z[mirror]}, R−i=${cap}) = ${seed} for free — no character comparisons yet.`,
      });
      z[i] = seed;
    } else {
      frames.push({
        array: arr,
        subRow: subFromZ(),
        pointers: { [i]: 'i' },
        highlights: { [i]: 'current' },
        caption: `i=${i} is at or past R=${R} — outside the known window. No mirror to reuse, so start Z[${i}] = 0 and extend by direct comparison (the rare slow path).`,
      });
      z[i] = 0;
    }

    let extended = false;
    while (i + z[i] < n && arr[z[i]] === arr[i + z[i]]) {
      z[i] += 1;
      extended = true;
    }
    if (extended) {
      const matched = {};
      for (let k = 0; k < z[i]; k++) {
        matched[i + k] = 'match';
        matched[k] = 'done';
      }
      frames.push({
        array: arr,
        subRow: subFromZ(),
        pointers: { [i]: 'i' },
        highlights: matched,
        caption: `Extend past the seed: compare prefix char arr[k] with arr[${i}+k] while they agree. Z[${i}] grows to ${z[i]} — "${s.slice(i, i + z[i])}" matches the prefix "${s.slice(0, z[i])}".`,
      });
    }

    if (i + z[i] > R) {
      const oldL = L;
      const oldR = R;
      L = i;
      R = i + z[i];
      frames.push({
        array: arr,
        subRow: subFromZ(),
        pointers: { [L]: 'L', [Math.min(R - 1, n - 1)]: 'R' },
        eliminated: new Set(Array.from({ length: i }, (_, k) => k)),
        caption: `Match reaches index ${i + z[i] - 1} ≥ old R=${oldR - 1 < 0 ? oldR : oldR}. Slide the window forward: [L,R] = [${oldL},${oldR}) → [${L},${R}). R only ever moves right, which is why the whole build is amortised O(n).`,
      });
    } else {
      frames.push({
        array: arr,
        subRow: subFromZ(),
        pointers: { [i]: 'i', [L]: 'L', [Math.min(R, n - 1)]: 'R' },
        caption: `Z[${i}] = ${z[i]}; the match stays inside the existing window [L=${L}, R=${R}), so the window is unchanged. Move to i=${i + 1}.`,
      });
    }
  }

  frames.push({
    array: arr,
    subRow: subFromZ(),
    eliminated: new Set(arr.map((_, k) => k)),
    caption: `Done. Z = [${z.join(', ')}]. For pattern matching you build Z over "pattern$text" once — every position with Z[i] ≥ |pattern| is an occurrence, all in O(n+m).`,
  });
  return frames;
}

// ===========================================================================
// Sliding-window median — two heaps (lo max-heap, hi min-heap) over the window.
// We narrate the running median; the array row shows the data, the subRow shows
// which side (lo/hi) each in-window element belongs to.
// ===========================================================================
function slidingMedianFrames(values = [1, 3, -1, -3, 5, 3, 6, 7], k = 3) {
  const nums = Array.isArray(values) ? values.map(Number) : [];
  const K = Math.max(1, Math.min(Number(k) || 1, nums.length));
  if (!nums.length) return [{ array: [], caption: 'Empty array — no windows to scan.' }];
  const arr = nums.map((v) => String(v));
  const frames = [];

  const medianOf = (windowVals) => {
    const sorted = [...windowVals].sort((a, b) => a - b);
    const m = sorted.length;
    if (m % 2 === 1) return sorted[(m - 1) / 2];
    return (sorted[m / 2 - 1] + sorted[m / 2]) / 2;
  };

  // Build the lo/hi side labels for the current window [start, start+K).
  const sideRow = (start, medVal) => {
    const values2 = arr.map((_, idx) => {
      if (idx < start || idx >= start + K) return '';
      const v = nums[idx];
      if (v < medVal) return 'lo';
      if (v > medVal) return 'hi';
      return 'med';
    });
    return { values: values2, label: 'heap' };
  };

  frames.push({
    array: arr,
    caption: `Sliding-window median, window size k=${K}. Naively re-sorting each window is O(n·k log k). Instead keep two heaps: a max-heap "lo" for the smaller half and a min-heap "hi" for the larger half, balanced so their tops straddle the median.`,
  });

  for (let start = 0; start + K <= nums.length; start++) {
    const winIdx = Array.from({ length: K }, (_, j) => start + j);
    const winVals = winIdx.map((idx) => nums[idx]);
    const med = medianOf(winVals);

    // Frame A: highlight the window entering.
    const enterHl = {};
    for (const idx of winIdx) enterHl[idx] = 'current';
    if (start === 0) {
      frames.push({
        array: arr,
        highlights: enterHl,
        eliminated: new Set(Array.from({ length: start }, (_, x) => x)),
        caption: `Fill the first window [${winVals.join(', ')}]. Push each value into the heaps, rebalancing so lo.size = hi.size or lo.size = hi.size+1.`,
      });
    } else {
      const enter = start + K - 1;
      const leave = start - 1;
      frames.push({
        array: arr,
        pointers: { [enter]: 'in', [leave]: 'out' },
        highlights: enterHl,
        eliminated: new Set(Array.from({ length: start }, (_, x) => x)),
        caption: `Slide right: ${nums[enter]} enters, ${nums[leave]} leaves. Insert ${nums[enter]} into the correct heap, lazily mark ${nums[leave]} as removed, then rebalance — O(log k) per step instead of re-sorting.`,
      });
    }

    // Frame B: show heap-side labels + the median readout.
    const medHl = {};
    for (const idx of winIdx) {
      if (nums[idx] === med) medHl[idx] = 'match';
    }
    frames.push({
      array: arr,
      subRow: sideRow(start, med),
      highlights: medHl,
      eliminated: new Set(Array.from({ length: start }, (_, x) => x)),
      caption: `Window [${winVals.join(', ')}]: "lo" half holds values below the median, "hi" half above. The heap tops give the median = ${med}${K % 2 === 0 ? ` (average of the two middle values)` : ''}.`,
    });
  }

  frames.push({
    array: arr,
    eliminated: new Set(arr.map((_, k2) => k2)),
    caption: `All ${nums.length - K + 1} windows processed. Each slide does O(log k) heap work plus lazy deletion, so the whole sweep is O(n log k) — far better than re-sorting every window.`,
  });
  return frames;
}

// ===========================================================================
// dp-state-compression — 0/1 knapsack rolling 1D array, capacity iterated
// from W down to weight so dp[w-weight] still refers to the OLD row.
// The array row IS the dp[] table; the subRow tags which cell is being updated.
// ===========================================================================
function knapsackCompressFrames(weights = [3, 2, 4], vals = [3, 4, 5], W = 7) {
  const ws = Array.isArray(weights) ? weights.map(Number) : [];
  const vs = Array.isArray(vals) ? vals.map(Number) : [];
  const cap = Math.max(1, Number(W) || 1);
  if (!ws.length) return [{ array: [], caption: 'No items — knapsack value is 0.' }];

  const dp = new Array(cap + 1).fill(0);
  const arr = () => dp.map((v) => String(v));
  const labels = () => ({ values: dp.map((_, i) => String(i)), label: 'cap' });
  const frames = [];

  frames.push({
    array: arr(),
    subRow: labels(),
    caption: `0/1 knapsack with a single rolling row dp[0..${cap}]. The 2D table needs n·W cells; here we keep just one row. Key trick: iterate capacity DOWNWARD so dp[w−weight] still holds the value WITHOUT the current item.`,
  });

  for (let i = 0; i < ws.length; i++) {
    const wt = ws[i];
    const val = vs[i];
    frames.push({
      array: arr(),
      subRow: labels(),
      caption: `Item ${i} (weight=${wt}, value=${val}). Sweep w from ${cap} down to ${wt}. Going downward guarantees dp[w−${wt}] hasn't been touched yet this round, so it still describes the table BEFORE item ${i} — that is what keeps each item 0/1.`,
    });
    for (let w = cap; w >= wt; w--) {
      const without = dp[w];
      const withItem = dp[w - wt] + val;
      const take = withItem > without;
      frames.push({
        array: arr(),
        subRow: labels(),
        pointers: { [w]: 'w', [w - wt]: 'w−wt' },
        highlights: take
          ? { [w]: 'current', [w - wt]: 'pivot' }
          : { [w]: 'current' },
        eliminated: new Set(Array.from({ length: wt }, (_, x) => x)),
        caption: `dp[${w}] = max(skip=${without}, take=dp[${w - wt}]+${val}=${withItem}) = ${Math.max(without, withItem)}.${take ? ` Taking item ${i} wins.` : ` Skipping keeps the old value.`}`,
      });
      dp[w] = Math.max(without, withItem);
    }
    frames.push({
      array: arr(),
      subRow: labels(),
      caption: `After item ${i}: dp = [${dp.join(', ')}]. One reused row captures the whole sub-problem space — memory dropped from O(n·W) to O(W).`,
    });
  }

  frames.push({
    array: arr(),
    subRow: labels(),
    highlights: { [cap]: 'match' },
    eliminated: new Set(dp.map((_, x) => (x === cap ? undefined : x)).filter((x) => x !== undefined)),
    caption: `Best value within capacity ${cap} is dp[${cap}] = ${dp[cap]}. Same answer as the 2D DP, computed in O(n·W) time but only O(W) space — the state-compression payoff.`,
  });
  return frames;
}

// ===========================================================================
// Interval scheduling — greedy by earliest finish time (array renderer, each
// interval is a row-cell labelled by its [start,end]).
// ===========================================================================
function intervalScheduleFrames(intervals) {
  const raw = Array.isArray(intervals) && intervals.length
    ? intervals
    : [[1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11], [8, 12], [2, 14]];
  // Sort ascending by finish time; keep an original-name letter for narration.
  const named = raw.map((iv, idx) => ({ s: iv[0], e: iv[1], name: String.fromCharCode(65 + idx) }));
  const sorted = [...named].sort((a, b) => a.e - b.e || a.s - b.s);
  const arr = sorted.map((iv) => `${iv.name}[${iv.s},${iv.e}]`);
  const frames = [];

  frames.push({
    array: arr,
    caption: `Activity selection: choose the largest set of pairwise non-overlapping intervals. Wrong rules: shortest-first and earliest-start-first both fail. The correct greedy is sort by FINISH time ascending (shown), then sweep.`,
  });

  const chosen = new Set();
  let lastEnd = -Infinity;
  const settled = new Set();

  for (let i = 0; i < sorted.length; i++) {
    const iv = sorted[i];
    const fits = iv.s >= lastEnd;
    const hl = {};
    if (fits) hl[i] = 'current';
    else hl[i] = 'pivot';
    // Keep all chosen highlighted as done.
    for (const c of chosen) hl[c] = 'done';

    frames.push({
      array: arr,
      pointers: { [i]: 'i' },
      highlights: hl,
      eliminated: new Set(settled),
      caption: fits
        ? `${iv.name}[${iv.s},${iv.e}]: start ${iv.s} ≥ last finish ${lastEnd === -Infinity ? '−∞' : lastEnd} — no overlap, so PICK it. Earliest finish leaves the most room for what's next.`
        : `${iv.name}[${iv.s},${iv.e}]: start ${iv.s} < last finish ${lastEnd} — overlaps the current selection, so SKIP it.`,
    });

    if (fits) {
      chosen.add(i);
      lastEnd = iv.e;
      const hl2 = {};
      for (const c of chosen) hl2[c] = 'done';
      frames.push({
        array: arr,
        highlights: hl2,
        eliminated: new Set(settled),
        caption: `Selected ${iv.name}. Advance last finish to ${lastEnd}. Selection so far: {${[...chosen].map((c) => sorted[c].name).join(', ')}}.`,
      });
    } else {
      settled.add(i);
    }
  }

  frames.push({
    array: arr,
    highlights: (() => { const h = {}; for (const c of chosen) h[c] = 'match'; return h; })(),
    eliminated: new Set(arr.map((_, i) => (chosen.has(i) ? undefined : i)).filter((x) => x !== undefined)),
    caption: `Maximum compatible set = {${[...chosen].map((c) => sorted[c].name).join(', ')}}, size ${chosen.size}. The exchange argument proves greedy's i-th pick finishes no later than any optimum's i-th — so it is optimal.`,
  });
  return frames;
}

// ===========================================================================
// Set cover — greedy pick max-uncovered (array renderer: universe row + a
// subRow naming the set that covers each element on each pick).
// ===========================================================================
function setCoverFrames(universe, family) {
  const U = Array.isArray(universe) && universe.length ? universe : [1, 2, 3, 4, 5];
  const sets = Array.isArray(family) && family.length
    ? family
    : [[1, 2, 3], [2, 4], [3, 4, 5], [5]];
  const names = sets.map((_, i) => `S${i + 1}`);
  const arr = U.map((x) => String(x));
  const idxOf = {};
  U.forEach((x, i) => { idxOf[x] = i; });
  const frames = [];

  const setsAsSet = sets.map((s) => new Set(s));
  const remaining = new Set(U);
  const covered = new Set();
  const coveredBy = {}; // element -> set name

  frames.push({
    array: arr,
    caption: `Set cover over universe {${U.join(', ')}} with sets ${names.map((n, i) => `${n}={${sets[i].join(',')}}`).join(', ')}. Exact cover is NP-hard; the greedy "repeatedly take the set covering the most still-uncovered elements" is within H(n)≈ln n of optimal.`,
  });

  const chosen = [];
  let round = 0;
  while (remaining.size > 0) {
    round += 1;
    // Compute gains.
    let bestIdx = -1;
    let bestGain = -1;
    const gains = setsAsSet.map((s) => {
      let g = 0;
      for (const e of s) if (remaining.has(e)) g += 1;
      return g;
    });
    for (let i = 0; i < gains.length; i++) {
      if (gains[i] > bestGain) { bestGain = gains[i]; bestIdx = i; }
    }
    if (bestGain <= 0) break;

    // Per-set evaluation frames — narrate the gain of each candidate set.
    for (let i = 0; i < setsAsSet.length; i++) {
      const hlEval = {};
      for (const e of setsAsSet[i]) {
        if (remaining.has(e)) hlEval[idxOf[e]] = 'current';
      }
      frames.push({
        array: arr,
        subRow: { values: U.map((x) => (coveredBy[x] ? coveredBy[x] : '')), label: 'by' },
        highlights: hlEval,
        eliminated: new Set([...covered].map((e) => idxOf[e])),
        caption: `Round ${round}, evaluate ${names[i]}={${sets[i].join(',')}}: it would newly cover ${gains[i]} of the uncovered elements ${gains[i] ? `{${[...setsAsSet[i]].filter((e) => remaining.has(e)).join(', ')}}` : '(none — fully redundant)'}.`,
      });
    }

    // Frame: announce the winner.
    const hlScan = {};
    for (const e of setsAsSet[bestIdx]) if (remaining.has(e)) hlScan[idxOf[e]] = 'pivot';
    frames.push({
      array: arr,
      subRow: { values: U.map((x) => (coveredBy[x] ? coveredBy[x] : '')), label: 'by' },
      highlights: hlScan,
      eliminated: new Set([...covered].map((e) => idxOf[e])),
      caption: `Round ${round}: gains = ${names.map((n, i) => `${n}:${gains[i]}`).join(', ')}. Pick ${names[bestIdx]} — it covers the most uncovered (${bestGain}).`,
    });

    // Apply the pick.
    const newlyHl = {};
    for (const e of setsAsSet[bestIdx]) {
      if (remaining.has(e)) {
        remaining.delete(e);
        covered.add(e);
        coveredBy[e] = names[bestIdx];
        newlyHl[idxOf[e]] = 'done';
      }
    }
    chosen.push(bestIdx);
    frames.push({
      array: arr,
      subRow: { values: U.map((x) => (coveredBy[x] ? coveredBy[x] : '')), label: 'by' },
      highlights: newlyHl,
      eliminated: new Set([...covered].map((e) => idxOf[e])),
      caption: `Took ${names[bestIdx]}={${sets[bestIdx].join(',')}}. Remaining uncovered: {${[...remaining].join(', ') || '∅'}}. Cover so far: {${chosen.map((c) => names[c]).join(', ')}}.`,
    });
  }

  frames.push({
    array: arr,
    subRow: { values: U.map((x) => (coveredBy[x] ? coveredBy[x] : '')), label: 'by' },
    eliminated: new Set(arr.map((_, i) => i)),
    caption: `Cover complete: {${chosen.map((c) => names[c]).join(', ')}}, ${chosen.length} sets. Greedy never beats OPT by more than the H(n) factor — here it matches the optimum.`,
  });
  return frames;
}

// ===========================================================================
// Eulerian path / circuit — degree check + Hierholzer's algorithm (graph
// renderer). Edges are consumed one at a time; the route is highlighted as a
// trail.
// ===========================================================================
function eulerFrames({ nodes, edges, label }) {
  // Build undirected adjacency with edge ids so each physical edge is used once.
  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  edges.forEach((e, idx) => {
    adj[e.a].push({ to: e.b, id: idx });
    adj[e.b].push({ to: e.a, id: idx });
  });
  for (const k in adj) adj[k].sort((x, y) => x.to - y.to);

  const degree = {};
  for (const n of nodes) degree[n.id] = (adj[n.id] || []).length;
  const odd = nodes.filter((n) => degree[n.id] % 2 === 1).map((n) => n.id);

  const frames = [];
  const edgeKey = (idx) => idx;
  const used = new Set();

  const snap = (currentId, trailEdgeIds, caption, doneNodes) => {
    const trail = new Set(trailEdgeIds || []);
    const ns = nodes.map((n) => ({
      id: n.id,
      label: `${labelFor(n.id)}\ndeg=${degree[n.id]}`,
      state: n.id === currentId ? 'current'
        : (doneNodes && doneNodes.has(n.id)) ? 'done'
        : odd.includes(n.id) ? 'frontier'
        : undefined,
    }));
    const es = edges.map((e, idx) => {
      if (used.has(idx)) return { ...e, state: 'rejected' }; // consumed
      if (trail.has(idx)) return { ...e, state: 'current' };
      return { ...e };
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  const labelFor = (id) => {
    const n = nodes.find((x) => x.id === id);
    return n && n.label != null ? n.label : String(id);
  };

  // Degree intro frame.
  snap(null, [], `${label}: an Eulerian trail walks every edge exactly once. Undirected rule — circuit needs ALL degrees even; a path needs exactly 0 or 2 odd-degree vertices.`);

  // Per-vertex degree inspection so the parity test is visible step by step.
  for (const n of nodes) {
    const parity = degree[n.id] % 2 === 0 ? 'even' : 'ODD';
    snap(n.id, [], `Check degree of ${labelFor(n.id)} = ${degree[n.id]} → ${parity}. ${parity === 'ODD' ? 'An odd vertex must be a trail endpoint.' : 'Even vertices can be passed through freely.'}`);
  }

  let start;
  if (odd.length === 0) {
    start = nodes[0].id;
    snap(start, [], `Odd-degree vertices: none → an Eulerian CIRCUIT exists (start = end). Begin Hierholzer from any vertex, here ${labelFor(start)}.`);
  } else if (odd.length === 2) {
    start = Math.min(odd[0], odd[1]) === odd[0] ? odd[0] : odd[1];
    start = odd[0];
    snap(start, [], `Odd-degree vertices: {${odd.map(labelFor).join(', ')}} (exactly 2) → an Eulerian PATH exists. It must start at one odd vertex and end at the other. Start at ${labelFor(start)}.`);
  } else {
    snap(null, [], `Tally complete. Odd-degree vertices: {${odd.map(labelFor).join(', ')}} — ${odd.length} of them.`);
    snap(null, [], `Why ${odd.length} odd vertices blocks a trail: every time you pass through a vertex you use two of its edges (one in, one out), so interior vertices need even degree. Only the two endpoints may be odd.`);
    snap(null, [], `With ${odd.length} > 2 odd vertices there is no way to pair them as a single trail's endpoints. NO Eulerian path or circuit exists — Hierholzer is not even attempted. (A handshake-style fix would add edges to pair up the odd vertices first.)`);
    return frames;
  }

  // Hierholzer (iterative): stack-based, emit postorder, reverse for the trail.
  const stack = [start];
  const circuit = [];
  const localAdjPtr = {};
  for (const k in adj) localAdjPtr[k] = 0;

  while (stack.length) {
    const v = stack[stack.length - 1];
    // find an unused edge from v
    let found = -1;
    let toNode = -1;
    while (localAdjPtr[v] < adj[v].length) {
      const cand = adj[v][localAdjPtr[v]];
      localAdjPtr[v] += 1;
      if (!used.has(cand.id)) { found = cand.id; toNode = cand.to; break; }
    }
    if (found === -1) {
      circuit.push(v);
      stack.pop();
      snap(v, [], `Vertex ${labelFor(v)} has no unused edges left — emit it to the output trail and back up the stack.`, new Set([v]));
    } else {
      used.add(found);
      snap(toNode, [edgeKey(found)], `Walk edge ${labelFor(v)}–${labelFor(toNode)} (consume it, mark used) and advance to ${labelFor(toNode)}. Stack: [${stack.map(labelFor).join(' → ')} → ${labelFor(toNode)}].`);
      stack.push(toNode);
    }
  }

  circuit.reverse();
  snap(null, [], `${label}: all ${edges.length} edges used exactly once. Reverse the emitted postorder → Eulerian trail: ${circuit.map(labelFor).join(' → ')}. Hierholzer runs in O(V+E).`, new Set(nodes.map((n) => n.id)));
  return frames;
}

function eulerPathGraph() {
  // A-B-C-D square with diagonal D-A and pendant D-E. Degrees: A2 B2 C2 D3 E1.
  // Odd = {D, E} → Eulerian path.
  const nodes = [
    { id: 0, label: 'A' }, { id: 1, label: 'B' }, { id: 2, label: 'C' },
    { id: 3, label: 'D' }, { id: 4, label: 'E' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 },
    { a: 3, b: 0 }, { a: 3, b: 4 },
  ];
  return eulerFrames({ nodes, edges, label: 'Eulerian path (2 odd vertices)' });
}

function eulerCircuitGraph() {
  // Triangle 0-1-2 plus triangle 2-3-4 sharing vertex 2 — every degree even.
  const nodes = [
    { id: 0, label: 'A' }, { id: 1, label: 'B' }, { id: 2, label: 'C' },
    { id: 3, label: 'D' }, { id: 4, label: 'E' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 0 },
    { a: 2, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 2 },
  ];
  return eulerFrames({ nodes, edges, label: 'Eulerian circuit (all even)' });
}

function eulerNoTrailGraph() {
  // Two pendant edges off a path: degrees give four odd vertices → no trail.
  // Edges: A-B, A-C, A-D, E-F, E-A. Degrees: A=4, B=1, C=1, D=1, E=2, F=1.
  // Odd vertices = {B, C, D, F} → 4 odd → no Eulerian trail exists.
  const nodes = [
    { id: 0, label: 'A' }, { id: 1, label: 'B' }, { id: 2, label: 'C' },
    { id: 3, label: 'D' }, { id: 4, label: 'E' }, { id: 5, label: 'F' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 },
    { a: 4, b: 5 }, { a: 4, b: 0 },
  ];
  return eulerFrames({ nodes, edges, label: 'No Eulerian trail (4 odd)' });
}

// ===========================================================================
export default {
  'string-z-function': {
    title: 'Z-function: prefix-match window build',
    renderer: 'array',
    cases: [
      { label: 'Classic "aabcaabxaaaz"', frames: zFunctionFrames('aabcaabxaaaz') },
      { label: 'All-equal "aaaaa"', frames: zFunctionFrames('aaaaa') },
      { label: 'Pattern$Text "ab$ababab"', frames: zFunctionFrames('ab$ababab') },
    ],
    build: ({ s }) => zFunctionFrames(s),
    inputSchema: {
      fields: [
        { name: 's', label: 'String', type: 'string', default: 'aabcaabxaaaz', max: 24, placeholder: 'aabcaabxaaaz' },
      ],
    },
  },
  'sliding-window-medians': {
    title: 'Sliding-window median: two balanced heaps',
    renderer: 'array',
    cases: [
      { label: 'k=3 mixed', frames: slidingMedianFrames([1, 3, -1, -3, 5, 3, 6, 7], 3) },
      { label: 'k=4 even window', frames: slidingMedianFrames([2, 4, 6, 8, 10, 1, 3], 4) },
      { label: 'k=2 small', frames: slidingMedianFrames([5, 15, 1, 3, 8, 9], 2) },
    ],
  },
  'dp-state-compression': {
    title: 'State compression: rolling 1D knapsack',
    renderer: 'array',
    cases: [
      { label: 'Items (3,3)(2,4)(4,5) W=7', frames: knapsackCompressFrames([3, 2, 4], [3, 4, 5], 7) },
      { label: 'Two items W=5', frames: knapsackCompressFrames([1, 3], [1, 4], 5) },
      { label: 'Tight capacity W=4', frames: knapsackCompressFrames([2, 3, 4], [3, 4, 6], 4) },
    ],
  },
  'interval-scheduling': {
    title: 'Interval scheduling: earliest-finish greedy',
    renderer: 'array',
    cases: [
      {
        label: '10 intervals',
        frames: intervalScheduleFrames([[1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11], [8, 12], [2, 14]]),
      },
      {
        label: 'Shortest-first trap',
        frames: intervalScheduleFrames([[1, 10], [2, 3], [3, 5], [4, 7], [6, 11], [8, 12]]),
      },
      {
        label: 'Chained tight',
        frames: intervalScheduleFrames([[0, 2], [1, 3], [2, 4], [3, 5], [4, 6]]),
      },
    ],
  },
  'set-cover-greedy': {
    title: 'Set cover: greedy max-uncovered pick',
    renderer: 'array',
    cases: [
      {
        label: 'Universe {1..5}',
        frames: setCoverFrames([1, 2, 3, 4, 5], [[1, 2, 3], [2, 4], [3, 4, 5], [5]]),
      },
      {
        label: 'Overlapping {1..6}',
        frames: setCoverFrames([1, 2, 3, 4, 5, 6], [[1, 2, 3, 4], [4, 5], [5, 6], [1, 6]]),
      },
      {
        label: 'Greedy vs OPT {1..8}',
        frames: setCoverFrames([1, 2, 3, 4, 5, 6, 7, 8], [[1, 2, 3, 4, 5], [6, 7, 8], [1, 2, 6], [3, 4, 7], [5, 8]]),
      },
    ],
  },
  'graph-eulerian-path-circuit': {
    title: 'Eulerian trail: degree check + Hierholzer',
    renderer: 'graph',
    cases: [
      { label: 'Eulerian path (2 odd)', frames: eulerPathGraph() },
      { label: 'Eulerian circuit (all even)', frames: eulerCircuitGraph() },
      { label: 'No trail (4 odd)', frames: eulerNoTrailGraph() },
    ],
  },
};
