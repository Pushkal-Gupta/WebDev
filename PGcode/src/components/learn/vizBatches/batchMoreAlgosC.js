// Interactive viz for range-structure / selection / streaming concepts.
// All slugs use the 'array' renderer (tile row + optional subRow + pointers +
// highlights + eliminated + caption). Multi-row structures (sparse table, 2D
// prefix grid) are walked one active row at a time: the main `array` carries the
// row under construction/inspection, the subRow carries the source/reference row,
// and the caption narrates the full table state. Only documented state tokens are
// used (current, visited, done, frontier, compared, tree, pivot, match, new,
// found, key, left, right, low, high, window).

// ---------------------------------------------------------------------------
// selection-sort-algorithm — find min of unsorted suffix, swap to its front
// ---------------------------------------------------------------------------
function selectionSortFrames(input = [5, 2, 9, 1, 6, 3]) {
  const a = input.slice();
  const n = a.length;
  if (n === 0) return [{ array: [], caption: 'Empty array — already sorted, no passes needed.' }];
  const frames = [];
  const doneSet = (upTo) => new Set(Array.from({ length: upTo }, (_, j) => j));

  frames.push({
    array: a.slice(),
    caption: `Selection sort on [${a.join(', ')}]. Each pass scans the unsorted suffix for its minimum, then swaps that minimum into the first unsorted slot. After n-1 passes the array is sorted with only n-1 writes — the fewest of any comparison sort.`,
  });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    frames.push({
      array: a.slice(),
      pointers: { [i]: 'i' },
      highlights: { [i]: 'current' },
      eliminated: doneSet(i),
      caption: `Pass ${i + 1}: positions 0..${i - 1} are already final (dimmed). Assume the minimum of the suffix a[${i}..${n - 1}] is at index ${i} (value ${a[i]}); scan the rest to confirm or beat it.`,
    });

    for (let j = i + 1; j < n; j++) {
      const beats = a[j] < a[minIdx];
      const hl = { [i]: 'current', [minIdx]: 'key', [j]: beats ? 'match' : 'compared' };
      frames.push({
        array: a.slice(),
        pointers: { [i]: 'i', [j]: 'j', [minIdx]: 'min' },
        highlights: hl,
        eliminated: doneSet(i),
        caption: `Compare a[${j}] = ${a[j]} against the running min a[${minIdx}] = ${a[minIdx]}. ${beats ? `${a[j]} < ${a[minIdx]} → new minimum is index ${j}.` : `${a[j]} >= ${a[minIdx]} → min stays at index ${minIdx}.`}`,
      });
      if (beats) minIdx = j;
    }

    if (minIdx !== i) {
      frames.push({
        array: a.slice(),
        pointers: { [i]: 'i', [minIdx]: 'min' },
        highlights: { [i]: 'pivot', [minIdx]: 'match' },
        eliminated: doneSet(i),
        caption: `Suffix minimum is a[${minIdx}] = ${a[minIdx]}. Swap it with a[${i}] = ${a[i]} — one write places the correct value at position ${i}.`,
      });
      const t = a[i]; a[i] = a[minIdx]; a[minIdx] = t;
    } else {
      frames.push({
        array: a.slice(),
        pointers: { [i]: 'i' },
        highlights: { [i]: 'done' },
        eliminated: doneSet(i),
        caption: `Suffix minimum is already at position ${i} (value ${a[i]}). No swap needed — but note selection sort still scanned the whole suffix, so it is not adaptive.`,
      });
    }
    frames.push({
      array: a.slice(),
      highlights: { [i]: 'done' },
      eliminated: doneSet(i + 1),
      caption: `Position ${i} is now final (a[${i}] = ${a[i]}). The sorted prefix grows to a[0..${i}]; continue with the smaller suffix.`,
    });
  }

  frames.push({
    array: a.slice(),
    eliminated: doneSet(n),
    highlights: { [n - 1]: 'done' },
    caption: `Sorted: [${a.join(', ')}]. Comparisons were always n(n-1)/2 = ${(n * (n - 1)) / 2}, but writes were at most n-1 = ${n - 1} — the property that makes selection sort win when writes are expensive.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// sparse-table-rmq — precompute 2^k-range mins, answer query via two overlaps
// ---------------------------------------------------------------------------
function sparseTableFrames(input = [3, 1, 4, 1, 5, 9, 2, 6], L = 2, R = 6) {
  const arr = input.slice();
  const n = arr.length;
  if (n === 0) return [{ array: [], caption: 'Empty array — no ranges to precompute.' }];
  const maxK = Math.floor(Math.log2(n));
  // st[k][i] = min of arr[i .. i + 2^k - 1]
  const st = [arr.slice()];
  for (let k = 1; k <= maxK; k++) {
    const row = [];
    const span = 1 << k;
    const half = 1 << (k - 1);
    for (let i = 0; i + span <= n; i++) row[i] = Math.min(st[k - 1][i], st[k - 1][i + half]);
    st[k] = row;
  }

  const frames = [];
  frames.push({
    array: arr.slice(),
    caption: `Sparse table for range-min on [${arr.join(', ')}]. Precompute st[k][i] = min of the length-2^k window starting at i. Min is idempotent (min(x,x)=x), so any query splits into two power-of-two windows that may overlap without double-counting — O(1) per query after O(n log n) build.`,
  });
  frames.push({
    array: st[0].slice(),
    subRow: { values: arr.map(String), label: 'arr' },
    highlights: Object.fromEntries(arr.map((_, i) => [i, 'tree'])),
    caption: `Level k=0: st[0][i] = arr[i] (length-1 windows). This is the base row of the table — every higher level merges two windows of the level below.`,
  });

  for (let k = 1; k <= maxK; k++) {
    const span = 1 << k;
    const half = 1 << (k - 1);
    for (let i = 0; i + span <= n; i++) {
      const left = st[k - 1][i];
      const right = st[k - 1][i + half];
      const chosen = Math.min(left, right);
      frames.push({
        array: st[k].slice(),
        subRow: { values: st[k - 1].map((v) => (v === undefined ? '' : String(v))), label: `st[${k - 1}]` },
        pointers: { [i]: 'i', [i + half]: 'i+2^(k-1)' },
        highlights: { [i]: 'compared', [i + half]: 'compared', ...(i + span - 1 < n ? { [i + span - 1]: 'window' } : {}) },
        caption: `Build st[${k}][${i}] = min(st[${k - 1}][${i}], st[${k - 1}][${i + half}]) = min(${left}, ${right}) = ${chosen}. It covers arr[${i}..${i + span - 1}] (length ${span}) by merging two length-${half} windows.`,
      });
    }
    frames.push({
      array: st[k].slice(),
      highlights: Object.fromEntries(st[k].map((_, i) => [i, 'tree'])),
      caption: `Level k=${k} complete: each entry is the min of a length-${span} window. The table now answers any window whose length is exactly ${span} in one lookup.`,
    });
  }

  // Query [L, R]
  const lo = Math.max(0, Math.min(L, n - 1));
  const hi = Math.max(lo, Math.min(R, n - 1));
  const len = hi - lo + 1;
  const k = Math.floor(Math.log2(len));
  const aStart = lo;
  const bStart = hi - (1 << k) + 1;
  const ansA = st[k][aStart];
  const ansB = st[k][bStart];
  const ans = Math.min(ansA, ansB);

  frames.push({
    array: arr.slice(),
    pointers: { [lo]: 'L', [hi]: 'R' },
    highlights: Object.fromEntries(arr.map((_, i) => [i, i >= lo && i <= hi ? 'window' : null]).filter(([, r]) => r)),
    caption: `Query min of arr[${lo}..${hi}] (length len = ${len}). Pick k = floor(log2(${len})) = ${k}; two windows of length 2^${k} = ${1 << k} cover the range: one anchored at L, one ending at R. They may overlap — that is fine.`,
  });
  frames.push({
    array: arr.slice(),
    pointers: { [aStart]: 'A', [aStart + (1 << k) - 1]: 'A_end' },
    highlights: Object.fromEntries(arr.map((_, i) => [i, i >= aStart && i <= aStart + (1 << k) - 1 ? 'match' : (i >= lo && i <= hi ? 'window' : null)]).filter(([, r]) => r)),
    caption: `Window A = arr[${aStart}..${aStart + (1 << k) - 1}], its min is st[${k}][${aStart}] = ${ansA}. One table lookup, no scanning.`,
  });
  frames.push({
    array: arr.slice(),
    pointers: { [bStart]: 'B', [bStart + (1 << k) - 1]: 'B_end' },
    highlights: Object.fromEntries(arr.map((_, i) => [i, i >= bStart && i <= bStart + (1 << k) - 1 ? 'compared' : (i >= lo && i <= hi ? 'window' : null)]).filter(([, r]) => r)),
    caption: `Window B = arr[${bStart}..${bStart + (1 << k) - 1}], its min is st[${k}][${bStart}] = ${ansB}. A and B together cover [${lo}..${hi}]; the overlap costs nothing because min(x,x)=x.`,
  });
  frames.push({
    array: arr.slice(),
    pointers: { [lo]: 'L', [hi]: 'R' },
    highlights: Object.fromEntries(arr.map((v, i) => [i, (i >= lo && i <= hi && v === ans) ? 'found' : (i >= lo && i <= hi ? 'window' : null)]).filter(([, r]) => r)),
    caption: `Answer = min(st[${k}][${aStart}], st[${k}][${bStart}]) = min(${ansA}, ${ansB}) = ${ans}. Two lookups, O(1) — the entire query. For sum (not idempotent) this trick fails; use a Fenwick/segment tree instead.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// range-sum-2d — build 2D prefix grid, O(1) rectangle sum via inclusion-exclusion
// ---------------------------------------------------------------------------
function rangeSum2DFrames(matrix = [[3, 1, 4], [1, 5, 9], [2, 6, 5]], r1 = 1, c1 = 1, r2 = 2, c2 = 2) {
  const m = matrix.length;
  const cols = m ? matrix[0].length : 0;
  if (m === 0 || cols === 0) return [{ array: [], caption: 'Empty matrix — nothing to prefix.' }];
  // P has a sentinel zero band: (m+1) x (cols+1)
  const P = Array.from({ length: m + 1 }, () => new Array(cols + 1).fill(0));
  const frames = [];
  const flat = matrix.flat();

  frames.push({
    array: flat,
    caption: `2D prefix sum on a ${m}x${cols} matrix (shown row-major: [${matrix.map((r) => '[' + r.join(',') + ']').join(', ')}]). Build P[i][j] = sum of every cell north-and-west of (i,j) with a sentinel zero row/col, then answer any rectangle in four lookups via inclusion-exclusion.`,
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= cols; j++) {
      const cell = matrix[i - 1][j - 1];
      P[i][j] = cell + P[i - 1][j] + P[i][j - 1] - P[i - 1][j - 1];
      const flatIdx = (i - 1) * cols + (j - 1);
      const hl = { [flatIdx]: 'current' };
      if (i - 1 >= 1) hl[(i - 2) * cols + (j - 1)] = 'compared'; // cell above (in matrix terms)
      if (j - 1 >= 1) hl[(i - 1) * cols + (j - 2)] = 'compared'; // cell left
      if (i - 1 >= 1 && j - 1 >= 1) hl[(i - 2) * cols + (j - 2)] = 'pivot'; // diagonal removed once
      frames.push({
        array: flat,
        pointers: { [flatIdx]: `(${i - 1},${j - 1})` },
        highlights: hl,
        caption: `P[${i}][${j}] = matrix(${i - 1},${j - 1})=${cell} + P[${i - 1}][${j}]=${P[i - 1][j]} (north) + P[${i}][${j - 1}]=${P[i][j - 1]} (west) - P[${i - 1}][${j - 1}]=${P[i - 1][j - 1]} (double-counted NW corner) = ${P[i][j]}.`,
      });
    }
  }

  frames.push({
    array: flat,
    highlights: Object.fromEntries(flat.map((_, i) => [i, 'tree'])),
    caption: `Prefix grid built in O(rows x cols). Bottom-right P[${m}][${cols}] = ${P[m][cols]} is the sum of the whole matrix. Now any rectangle answers in O(1).`,
  });

  // Query rectangle inclusive corners (r1,c1)..(r2,c2)
  const R1 = Math.max(0, Math.min(r1, m - 1));
  const C1 = Math.max(0, Math.min(c1, cols - 1));
  const R2 = Math.max(R1, Math.min(r2, m - 1));
  const C2 = Math.max(C1, Math.min(c2, cols - 1));
  const inRect = (i) => {
    const r = Math.floor(i / cols), c = i % cols;
    return r >= R1 && r <= R2 && c >= C1 && c <= C2;
  };
  const total = P[R2 + 1][C2 + 1];
  const top = P[R1][C2 + 1];
  const leftW = P[R2 + 1][C1];
  const corner = P[R1][C1];
  const ans = total - top - leftW + corner;

  frames.push({
    array: flat,
    highlights: Object.fromEntries(flat.map((_, i) => [i, inRect(i) ? 'window' : null]).filter(([, r]) => r)),
    caption: `Query rectangle rows ${R1}..${R2}, cols ${C1}..${C2} (highlighted). Inclusion-exclusion: big NW wedge - wedge above - wedge left + small corner wedge (added back, removed twice).`,
  });
  frames.push({
    array: flat,
    highlights: Object.fromEntries(flat.map((_, i) => [i, inRect(i) ? 'window' : null]).filter(([, r]) => r)),
    caption: `Four lookups: total = P[${R2 + 1}][${C2 + 1}] = ${total}, above = P[${R1}][${C2 + 1}] = ${top}, left = P[${R2 + 1}][${C1}] = ${leftW}, corner = P[${R1}][${C1}] = ${corner}.`,
  });
  frames.push({
    array: flat,
    highlights: Object.fromEntries(flat.map((_, i) => [i, inRect(i) ? 'found' : null]).filter(([, r]) => r)),
    caption: `Rectangle sum = ${total} - ${top} - ${leftW} + ${corner} = ${ans}. Constant time regardless of rectangle size — the integral-image trick behind Viola-Jones face detection.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// range-update-range-query — difference array: O(1) range add, prefix-sum once
// ---------------------------------------------------------------------------
function diffArrayFrames(size = 6, updates = [[1, 3, 3], [0, 4, 5], [2, 5, 2]]) {
  const n = Math.max(1, size | 0);
  const d = new Array(n + 1).fill(0); // extra slot for r+1
  const frames = [];

  frames.push({
    array: new Array(n).fill(0),
    subRow: { values: new Array(n).fill(0).map(String), label: 'diff' },
    caption: `Difference array on an all-zero array of length ${n}. To add x over [l, r] in O(1): d[l] += x and d[r+1] -= x. Apply every update first, then one prefix-sum reconstructs the final array — offline range-update, range-query.`,
  });

  updates.forEach(([l0, r0, x], idx) => {
    const l = Math.max(0, Math.min(l0, n - 1));
    const r = Math.max(l, Math.min(r0, n - 1));
    d[l] += x;
    d[r + 1] -= x;
    const view = d.slice(0, n);
    const hl = { [l]: 'match' };
    if (r + 1 < n) hl[r + 1] = 'pivot';
    frames.push({
      array: view,
      subRow: { values: view.map(String), label: 'diff' },
      pointers: { [l]: 'l', ...(r + 1 < n ? { [r + 1]: 'r+1' } : {}) },
      highlights: hl,
      caption: `Update ${idx + 1}: add ${x} to [${l}..${r}]. Stamp d[${l}] += ${x} (start of the bump) and d[${r + 1}] -= ${x} (cancel just past the end). Only two writes — the range length is irrelevant.`,
    });
  });

  // Prefix sum reconstruction
  const out = new Array(n).fill(0);
  let run = 0;
  for (let i = 0; i < n; i++) {
    run += d[i];
    out[i] = run;
    frames.push({
      array: out.slice(),
      subRow: { values: d.slice(0, n).map(String), label: 'diff' },
      pointers: { [i]: 'i' },
      highlights: { [i]: 'current', ...(i > 0 ? { [i - 1]: 'done' } : {}) },
      caption: `Prefix-sum the diff array: running total += d[${i}] = ${d[i]} → ${run}. arr[${i}] = ${run}. Each +x stamp turns the array on; each -x stamp turns it back off, so the bumps reconstruct exactly.`,
    });
  }

  frames.push({
    array: out.slice(),
    highlights: Object.fromEntries(out.map((_, i) => [i, 'done'])),
    caption: `Final array = [${out.join(', ')}]. All ${updates.length} range updates cost O(1) each, reconstruction is one O(n) pass. For interleaved online updates+queries instead use a segment tree with lazy propagation (O(log n) each).`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
// topk-streaming — min-heap of size K over a stream; root is the K-th largest
// ---------------------------------------------------------------------------
function topkStreamFrames(stream = [5, 1, 8, 3, 9, 2, 7], K = 3) {
  const k = Math.max(1, K | 0);
  const heap = []; // simple sorted-ascending model; heap[0] is the min (root)
  const frames = [];

  const heapInsert = (v) => { heap.push(v); heap.sort((a, b) => a - b); };
  const heapView = () => heap.slice();

  frames.push({
    array: stream.slice(),
    caption: `Top-${k} from a stream: keep a min-heap of size ${k}. The heap root is the smallest of the current top-${k}, so any new item only matters if it beats the root. O(${k}) memory — the stream itself is never stored.`,
  });
  frames.push({
    array: stream.slice(),
    caption: `Three cases per arriving item: (1) heap has fewer than ${k} items → push it; (2) item > root → pop the root and push it; (3) item <= root → discard. Sorting or quick-select would need all n items; the heap needs only ${k}.`,
  });

  for (let i = 0; i < stream.length; i++) {
    const v = stream[i];
    const eliminated = new Set(Array.from({ length: i }, (_, j) => j));
    if (heap.length < k) {
      heapInsert(v);
      frames.push({
        array: stream.slice(),
        subRow: { values: heapView().map(String), label: 'min-heap' },
        pointers: { [i]: 'stream' },
        highlights: { [i]: 'match' },
        eliminated,
        caption: `Item ${i}: ${v}. Heap has ${heap.length - 1} < ${k} items → push. Heap (min-first) = [${heapView().join(', ')}]; root = ${heap[0]}.`,
      });
    } else if (v > heap[0]) {
      const popped = heap[0];
      heap.shift();
      heapInsert(v);
      frames.push({
        array: stream.slice(),
        subRow: { values: heapView().map(String), label: 'min-heap' },
        pointers: { [i]: 'stream' },
        highlights: { [i]: 'found' },
        eliminated,
        caption: `Item ${i}: ${v} > root ${popped} → pop the smallest (${popped}, evicted) and push ${v}. Heap = [${heapView().join(', ')}]; new root = ${heap[0]}.`,
      });
    } else {
      frames.push({
        array: stream.slice(),
        subRow: { values: heapView().map(String), label: 'min-heap' },
        pointers: { [i]: 'stream' },
        highlights: { [i]: 'pivot' },
        eliminated,
        caption: `Item ${i}: ${v} <= root ${heap[0]} → discard. It cannot belong to the top-${k} because at least ${k} items already beat or tie it. Heap unchanged = [${heapView().join(', ')}].`,
      });
    }
  }

  frames.push({
    array: stream.slice(),
    subRow: { values: heapView().map(String), label: 'top-K' },
    eliminated: new Set(stream.map((_, j) => j)),
    highlights: Object.fromEntries(stream.map((v, i) => [i, heap.includes(v) ? 'done' : null]).filter(([, r]) => r)),
    caption: `Stream consumed. The heap holds the top-${k}: [${heapView().slice().sort((a, b) => b - a).join(', ')}] (largest first). One pass, O(n log k) time, O(k) space — exact top-K without ever storing the whole stream.`,
  });
  return frames;
}

// ---------------------------------------------------------------------------
export default {
  'selection-sort-algorithm': {
    title: 'Selection sort: find min, swap to front',
    renderer: 'array',
    cases: [
      { label: 'Random [5,2,9,1,6,3]', frames: selectionSortFrames([5, 2, 9, 1, 6, 3]) },
      { label: 'Reverse-sorted [5,4,3,2,1]', frames: selectionSortFrames([5, 4, 3, 2, 1]) },
      { label: 'Already sorted [1,2,3,4]', frames: selectionSortFrames([1, 2, 3, 4]) },
    ],
    build: ({ nums }) => selectionSortFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'array (comma-separated)', type: 'string', default: '5,2,9,1,6,3', max: 40, placeholder: '5,2,9,1,6,3' },
      ],
    },
  },
  'sparse-table-rmq': {
    title: 'Sparse table: O(1) range-min via 2^k windows',
    renderer: 'array',
    cases: [
      { label: 'min of arr[2..6]', frames: sparseTableFrames([3, 1, 4, 1, 5, 9, 2, 6], 2, 6) },
      { label: 'min of arr[0..4]', frames: sparseTableFrames([7, 2, 5, 8, 1, 6, 3], 0, 4) },
      { label: 'min of arr[3..7]', frames: sparseTableFrames([9, 4, 6, 2, 8, 1, 5, 7], 3, 7) },
    ],
    build: ({ nums, L, R }) => sparseTableFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
      Number(L), Number(R),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'array (comma-separated)', type: 'string', default: '3,1,4,1,5,9,2,6', max: 32, placeholder: '3,1,4,1,5,9,2,6' },
        { name: 'L', label: 'query L', type: 'number', default: 2, min: 0, max: 31 },
        { name: 'R', label: 'query R', type: 'number', default: 6, min: 0, max: 31 },
      ],
    },
  },
  'range-sum-2d': {
    title: '2D prefix sum: O(1) rectangle queries',
    renderer: 'array',
    cases: [
      { label: '3x3, rect (1,1)-(2,2)', frames: rangeSum2DFrames([[3, 1, 4], [1, 5, 9], [2, 6, 5]], 1, 1, 2, 2) },
      { label: '3x3, rect (0,0)-(1,1)', frames: rangeSum2DFrames([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 0, 1, 1) },
      { label: '2x4, rect (0,1)-(1,3)', frames: rangeSum2DFrames([[2, 0, 3, 1], [1, 4, 2, 5]], 0, 1, 1, 3) },
    ],
    inputSchema: { fields: [] },
  },
  'range-update-range-query': {
    title: 'Difference array: O(1) range add',
    renderer: 'array',
    cases: [
      { label: '3 overlapping updates', frames: diffArrayFrames(6, [[1, 3, 3], [0, 4, 5], [2, 5, 2]]) },
      { label: 'Disjoint ranges', frames: diffArrayFrames(7, [[0, 1, 4], [3, 4, 2], [5, 6, 9]]) },
      { label: 'Nested ranges', frames: diffArrayFrames(6, [[0, 5, 1], [1, 4, 2], [2, 3, 3]]) },
    ],
    inputSchema: { fields: [] },
  },
  'topk-streaming': {
    title: 'Top-K stream: min-heap of size K',
    renderer: 'array',
    cases: [
      { label: 'K=3, stream of 7', frames: topkStreamFrames([5, 1, 8, 3, 9, 2, 7], 3) },
      { label: 'K=2, descending arrivals', frames: topkStreamFrames([9, 7, 5, 8, 6, 10, 4], 2) },
      { label: 'K=4, mixed stream', frames: topkStreamFrames([3, 1, 4, 1, 5, 9, 2, 6, 8, 7], 4) },
    ],
    build: ({ nums, K }) => topkStreamFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
      Number(K),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'stream (comma-separated)', type: 'string', default: '5,1,8,3,9,2,7', max: 50, placeholder: '5,1,8,3,9,2,7' },
        { name: 'K', label: 'K', type: 'number', default: 3, min: 1, max: 8 },
      ],
    },
  },
};
