// Concept-visualization batch: heaps, priority queues, and the two-stack queue.
//
// Renderers used (AlgoVisualizer.jsx):
//   'tree'  — heap-binary: a min/max binary heap drawn as a complete tree. Frame
//             shape is the recursive { _id, value, left, right, state? } the
//             TreeRenderer walks; state in { 'current','visited','done','new',
//             'unbalanced','found','key' } maps to a CSS class. Also reads
//             frame.caption and frame.chip.
//   'array' — heap-sort-algorithm (heap-as-array with sift swaps + sorted tail),
//             priority-queue-array (sorted-array PQ ops), queue-using-stacks
//             (in/out stacks laid out as one row). ArrayBarRenderer reads
//             frame.array (numeric -> bars), frame.highlights[idx] (role),
//             frame.pointers[idx], frame.subRow, frame.chip, frame.eliminated,
//             frame.caption.
//
// Self-contained: no imports from conceptVisualizations.js. Pure JS.

// ---------------------------------------------------------------------------
// Tree helpers (heap drawn as a complete binary tree)
// ---------------------------------------------------------------------------
let _nid = 0;
function nextId() { return ++_nid; }

// Build a recursive tree node for heap array `a` rooted at array index `i`.
// `states` maps array-index -> state flag; size bounds the live region.
function heapNode(a, i, size, states) {
  if (i >= size) return null;
  return {
    _id: nextId(),
    value: a[i],
    state: states && states[i],
    left: heapNode(a, 2 * i + 1, size, states),
    right: heapNode(a, 2 * i + 2, size, states),
  };
}
// One tree frame from the current array contents.
function treeFrame(a, size, states, caption, chip) {
  _nid = 0;
  const f = { tree: heapNode(a, 0, size, states), caption };
  if (chip) f.chip = chip;
  return f;
}

// ---------------------------------------------------------------------------
// heap-binary — push (sift-up) then pop (sift-down) on a MIN-heap, drawn as tree
// ---------------------------------------------------------------------------
function heapBinaryFrames(seq = [5, 3, 8, 1, 9, 2]) {
  const vals = seq.map((x) => x | 0);
  const a = [];
  const frames = [];
  frames.push(treeFrame(a, 0,
    {}, `Min-heap invariant: every parent <= both children, stored in a flat array where node i has children 2i+1 and 2i+2. We will push [${vals.join(', ')}] one at a time, then pop the minimum.`,
    { label: 'size', value: 0 }));

  for (const v of vals) {
    // append at the end
    a.push(v);
    let i = a.length - 1;
    const seat = {}; seat[i] = 'new';
    frames.push(treeFrame(a, a.length, seat,
      `Push ${v}: append it as the next leaf at array index ${i} to keep the tree complete, then sift it up while it is smaller than its parent.`,
      { label: 'size', value: a.length }));
    // sift-up
    while (i > 0) {
      const parent = (i - 1) >> 1;
      const cmp = {}; cmp[i] = 'current'; cmp[parent] = 'key';
      frames.push(treeFrame(a, a.length, cmp,
        `Compare ${a[i]} with parent ${a[parent]} (index ${parent}). ${a[i] < a[parent] ? `${a[i]} < ${a[parent]} -> violates min-heap, swap them up.` : `${a[i]} >= ${a[parent]} -> heap order holds, stop sifting.`}`,
        { label: 'size', value: a.length }));
      if (a[i] < a[parent]) {
        const tmp = a[i]; a[i] = a[parent]; a[parent] = tmp;
        const sw = {}; sw[parent] = 'done';
        frames.push(treeFrame(a, a.length, sw,
          `Swapped: ${a[parent]} bubbles toward the root. A push touches at most one node per level, so sift-up is O(log n).`,
          { label: 'size', value: a.length }));
        i = parent;
      } else break;
    }
  }
  frames.push(treeFrame(a, a.length, { 0: 'found' },
    `All pushes done. The root (index 0) holds the global minimum ${a[0]} — that is the whole point of a heap: the smallest element is always one O(1) read away.`,
    { label: 'min', value: a[0] }));

  // pop: remove root, move last to root, sift-down
  const last = a.length - 1;
  const popMark = {}; popMark[0] = 'pivot'; popMark[last] = 'new';
  frames.push(treeFrame(a, a.length, popMark,
    `Pop the min ${a[0]}: we cannot just delete the root. Move the LAST leaf ${a[last]} into the root slot, drop the tail, then sift the new root down.`,
    { label: 'min', value: a[0] }));
  a[0] = a[last];
  a.pop();
  let size = a.length;
  frames.push(treeFrame(a, size, { 0: 'current' },
    `Root is now ${a[0]} (the former last leaf). It likely violates the heap order, so sink it: repeatedly swap with the SMALLER child until both children are >= it.`,
    { label: 'size', value: size }));
  let i = 0;
  while (true) {
    const l = 2 * i + 1; const r = 2 * i + 2;
    let smallest = i;
    if (l < size && a[l] < a[smallest]) smallest = l;
    if (r < size && a[r] < a[smallest]) smallest = r;
    const look = {}; look[i] = 'current';
    if (l < size) look[l] = look[l] || 'key';
    if (r < size) look[r] = look[r] || 'key';
    frames.push(treeFrame(a, size, look,
      `At index ${i} (value ${a[i]}): smallest of {${a[i]}${l < size ? `, ${a[l]}` : ''}${r < size ? `, ${a[r]}` : ''}} is ${a[smallest]}. ${smallest === i ? 'Parent already smallest -> heap restored, stop.' : `Swap down with child ${a[smallest]}.`}`,
      { label: 'size', value: size }));
    if (smallest === i) break;
    const tmp = a[i]; a[i] = a[smallest]; a[smallest] = tmp;
    const sw = {}; sw[smallest] = 'done';
    frames.push(treeFrame(a, size, sw,
      `Swapped ${a[i]} down: ${a[smallest]} sank one level. Sift-down also touches one node per level — pop is O(log n).`,
      { label: 'size', value: size }));
    i = smallest;
  }
  frames.push(treeFrame(a, size, { 0: 'found' },
    `Pop complete. New minimum at the root is ${a.length ? a[0] : 'none'}. Push and pop are both O(log n); peek-min is O(1) — the heap's signature trade-off.`,
    { label: 'min', value: a.length ? a[0] : 0 }));
  return frames;
}

// ---------------------------------------------------------------------------
// heap-sort-algorithm — array renderer: build max-heap then extract to tail
// ---------------------------------------------------------------------------
// Roles: 'current' active node, 'key' child under comparison, 'pivot' the root
// being swapped out, 'done' the sorted tail. `eliminated` marks the locked
// sorted suffix so it visually recedes.
function heapSortFrames(seq = [4, 10, 3, 5, 1, 8, 7]) {
  const a = seq.map((x) => x | 0);
  const n = a.length;
  const frames = [];
  const sorted = () => new Set(); // populated as we lock the tail

  frames.push({
    array: a.slice(),
    caption: `Heap sort, in place: input [${a.join(', ')}]. Phase 1 builds a MAX-heap so the largest element sits at index 0; phase 2 repeatedly swaps that max to the back and shrinks the heap.`,
    chip: { label: 'phase', value: 'start' },
  });

  // sift-down within a[0..size-1]
  const siftDown = (arr, i, size, locked, phaseLabel, extra) => {
    while (true) {
      const l = 2 * i + 1; const r = 2 * i + 2;
      let largest = i;
      if (l < size && arr[l] > arr[largest]) largest = l;
      if (r < size && arr[r] > arr[largest]) largest = r;
      const hl = {}; hl[i] = 'current';
      if (l < size) hl[l] = hl[l] || 'key';
      if (r < size) hl[r] = hl[r] || 'key';
      frames.push({
        array: arr.slice(),
        highlights: hl,
        eliminated: new Set(locked),
        caption: `${extra}At index ${i} (value ${arr[i]}): largest of {${arr[i]}${l < size ? `, ${arr[l]}` : ''}${r < size ? `, ${arr[r]}` : ''}} is ${arr[largest]}. ${largest === i ? 'Parent already largest -> stop sinking.' : `Swap down with the larger child ${arr[largest]}.`}`,
        chip: { label: 'phase', value: phaseLabel },
      });
      if (largest === i) break;
      const t = arr[i]; arr[i] = arr[largest]; arr[largest] = t;
      const sw = {}; sw[largest] = 'done';
      frames.push({
        array: arr.slice(),
        highlights: sw,
        eliminated: new Set(locked),
        caption: `Swapped: ${arr[largest]} sinks one level toward the leaves. Each sink is O(log n).`,
        chip: { label: 'phase', value: phaseLabel },
      });
      i = largest;
    }
  };

  // Phase 1: build-heap, sift-down from last parent to root.
  const lastParent = (n >> 1) - 1;
  frames.push({
    array: a.slice(),
    eliminated: sorted(),
    caption: `Build-heap starts at the last parent index ${lastParent} (= floor(n/2)-1) and walks down to 0. Leaves (the back half) are already trivial heaps, so we skip them — this is why build-heap is O(n), not O(n log n).`,
    chip: { label: 'phase', value: 'build' },
  });
  for (let i = lastParent; i >= 0; i--) {
    siftDown(a, i, n, [], 'build', `Build-heap: sift node ${i} down. `);
  }
  frames.push({
    array: a.slice(),
    highlights: { 0: 'found' },
    eliminated: new Set(),
    caption: `Max-heap built: the largest element ${a[0]} is now at index 0. Phase 2 repeatedly moves the root to the sorted tail.`,
    chip: { label: 'phase', value: 'extract' },
  });

  // Phase 2: repeatedly swap root to position size-1, shrink, sift-down.
  const locked = [];
  for (let size = n; size > 1; size--) {
    const last = size - 1;
    const pre = {}; pre[0] = 'pivot'; pre[last] = 'new';
    frames.push({
      array: a.slice(),
      highlights: pre,
      eliminated: new Set(locked),
      caption: `Extract max: swap the root ${a[0]} with the last heap slot ${a[last]} (index ${last}). The max lands in its final sorted position; the heap shrinks to size ${size - 1}.`,
      chip: { label: 'heap size', value: size - 1 },
    });
    const t = a[0]; a[0] = a[last]; a[last] = t;
    locked.unshift(last); // index `last` is now sorted
    frames.push({
      array: a.slice(),
      highlights: { [last]: 'done' },
      eliminated: new Set(locked),
      caption: `${a[last]} is locked into the sorted tail. The new root ${a[0]} probably breaks the heap order, so sift it back down over the first ${size - 1} cells.`,
      chip: { label: 'heap size', value: size - 1 },
    });
    siftDown(a, 0, size - 1, locked, `size ${size - 1}`, '');
  }
  locked.unshift(0);
  frames.push({
    array: a.slice(),
    highlights: Object.fromEntries(a.map((_, i) => [i, 'done'])),
    eliminated: new Set(),
    caption: `Done: [${a.join(', ')}] is sorted ascending. Build-heap O(n) + n-1 extracts each O(log n) = O(n log n) worst case, in place, no extra memory.`,
    chip: { label: 'phase', value: 'sorted' },
  });
  return frames;
}

// ---------------------------------------------------------------------------
// priority-queue-array — sorted-array priority queue: insert (shift) + pop-min
// ---------------------------------------------------------------------------
// The array stays sorted ascending so extract-min is O(1) at the front, at the
// cost of O(n) insert. Roles: 'current' scan cursor, 'key' insertion gap,
// 'new' freshly inserted, 'pivot' the element being popped, 'done' the result.
function pqArrayFrames(inserts = [7, 2, 9, 4], pops = 2) {
  const ins = inserts.map((x) => x | 0);
  const a = [];
  const frames = [];
  frames.push({
    array: a.slice(),
    caption: `Sorted-array priority queue: keep elements ascending so the minimum is always at index 0. extract-min is O(1); the cost moves to insert, which must shift to find the sorted slot. For tiny n this beats a heap on constant factors and cache locality. Inserting [${ins.join(', ')}].`,
    chip: { label: 'size', value: 0 },
  });

  for (const v of ins) {
    // find insertion position via linear scan from the right (shift bigger ones)
    let pos = a.length;
    // visualize the scan: walk from the end while a[pos-1] > v
    frames.push({
      array: a.slice(),
      highlights: a.length ? { [a.length - 1]: 'current' } : {},
      caption: `Insert ${v}: scan from the back to find where ${v} fits in sorted order. Elements greater than ${v} slide one slot right to open a gap.`,
      chip: { label: 'size', value: a.length },
    });
    while (pos > 0 && a[pos - 1] > v) {
      pos -= 1;
      const hl = {}; hl[pos] = 'current';
      frames.push({
        array: a.slice(),
        highlights: hl,
        pointers: { [pos]: 'scan' },
        caption: `a[${pos}] = ${a[pos]} > ${v}, so it must sit to the RIGHT of the new value. Keep scanning left toward the insertion point.`,
        chip: { label: 'size', value: a.length },
      });
    }
    a.splice(pos, 0, v);
    const placed = {}; placed[pos] = 'new';
    frames.push({
      array: a.slice(),
      highlights: placed,
      pointers: { [pos]: 'ins' },
      caption: `Place ${v} at index ${pos}; everything to its right shifted up by one. The array is sorted again. Insert cost is O(n) from the shift — the deliberate trade for O(1) min.`,
      chip: { label: 'size', value: a.length },
    });
  }
  frames.push({
    array: a.slice(),
    highlights: { 0: 'found' },
    caption: `Build complete: [${a.join(', ')}] sorted ascending. The minimum ${a[0]} sits at the front, readable in O(1) with no sift required.`,
    chip: { label: 'min', value: a[0] },
  });

  // pop-min: read + remove front
  const popped = [];
  for (let p = 0; p < pops && a.length; p++) {
    const front = a[0];
    frames.push({
      array: a.slice(),
      highlights: { 0: 'pivot' },
      caption: `extract-min #${p + 1}: the smallest element ${front} is already at index 0 — return it directly, no tree to sink. This O(1) front read is the sorted array's whole advantage.`,
      chip: { label: 'min', value: front },
    });
    a.shift();
    popped.push(front);
    frames.push({
      array: a.slice(),
      highlights: a.length ? { 0: 'done' } : {},
      caption: `Removed ${front}; index 0 now holds the next-smallest ${a.length ? a[0] : '(empty)'}. Removed so far: [${popped.join(', ')}]. A heap would need an O(log n) sift-down here — the array does not.`,
      chip: { label: 'size', value: a.length },
    });
  }
  frames.push({
    array: a.slice(),
    caption: `Net result: extracted [${popped.join(', ')}] in sorted order, remaining [${a.join(', ') || 'empty'}]. Use a sorted array when n is small or inserts are batched up front; reach for a binary heap when n is large with interleaved inserts and pops.`,
    chip: { label: 'size', value: a.length },
  });
  return frames;
}

// ---------------------------------------------------------------------------
// queue-using-stacks — two stacks (in / out) simulate FIFO; lazy transfer.
// ---------------------------------------------------------------------------
// Single array row: indices 0..in.length-1 are the IN stack (top at the right
// end), the rest are the OUT stack (top at the LEFT of the out region = right
// end of the row reversed). To keep it readable we render [ ...IN | ...OUT ]
// with a subRow labeling which stack each cell belongs to and pointers marking
// the two tops. Roles: 'current' the active op cell, 'new' just pushed,
// 'pivot' being transferred, 'done' dequeued.
function queueTwoStacksFrames(ops = [['enq', 1], ['enq', 2], ['deq'], ['enq', 3], ['deq'], ['deq']]) {
  const inStack = [];
  const outStack = []; // top of out is the LAST element
  const frames = [];

  // Render: row = inStack (bottom->top) then a separator, then outStack reversed
  // so the out TOP appears adjacent. We encode separator via subRow labels.
  const snapshot = (caption, roleMap, chip) => {
    // roleMap: { in: {idx:role}, out:{idx:role} } over each stack's own indexing
    const row = [];
    const labels = [];
    const highlights = {};
    const pointers = {};
    inStack.forEach((v, i) => {
      const idx = row.length;
      row.push(v);
      labels.push('in');
      if (roleMap.in && roleMap.in[i]) highlights[idx] = roleMap.in[i];
      if (i === inStack.length - 1) pointers[idx] = 'in-top';
    });
    // out stack: top is last element; show bottom..top so the top is rightmost
    outStack.forEach((v, i) => {
      const idx = row.length;
      row.push(v);
      labels.push('out');
      if (roleMap.out && roleMap.out[i]) highlights[idx] = roleMap.out[i];
      if (i === outStack.length - 1) pointers[idx] = 'out-top';
    });
    const f = {
      array: row,
      highlights,
      pointers,
      subRow: { values: labels, label: 'stack' },
      caption,
    };
    if (chip) f.chip = chip;
    return f;
  };

  frames.push(snapshot(
    `Goal: a FIFO queue from two LIFO stacks. enqueue pushes onto the IN stack; dequeue serves from the OUT stack. Popping IN into OUT reverses the order, turning newest-on-top into oldest-on-top.`,
    {}, { label: 'op', value: 'start' }));

  let qLabel = [];
  for (const op of ops) {
    if (op[0] === 'enq') {
      const v = op[1] | 0;
      inStack.push(v);
      qLabel.push(v);
      frames.push(snapshot(
        `enqueue(${v}): push straight onto the IN stack top. Always O(1). Logical queue order so far: [${qLabel.join(', ')}] (front = leftmost).`,
        { in: { [inStack.length - 1]: 'new' } }, { label: 'op', value: `enq ${v}` }));
    } else { // deq
      if (outStack.length === 0) {
        // transfer: pop all of IN into OUT
        frames.push(snapshot(
          `dequeue(): OUT stack is empty, so first TRANSFER. Pop every IN element and push it onto OUT — this reverses the order so the oldest enqueued item ends up on top of OUT.`,
          { in: Object.fromEntries(inStack.map((_, i) => [i, 'pivot'])) },
          { label: 'op', value: 'transfer' }));
        while (inStack.length) {
          const moved = inStack.pop();
          outStack.push(moved);
          frames.push(snapshot(
            `Move ${moved} from IN top to OUT top. After all moves, the element enqueued FIRST sits on OUT's top — ready to be served front-first.`,
            { out: { [outStack.length - 1]: 'new' } },
            { label: 'op', value: 'transfer' }));
        }
      }
      const served = outStack.pop();
      qLabel = qLabel.slice(1);
      frames.push(snapshot(
        `dequeue() -> ${served}: pop OUT's top, which is the oldest un-served element. Each item is pushed and popped on each stack at most once, so dequeue is amortized O(1). Remaining queue: [${qLabel.join(', ') || 'empty'}].`,
        { out: outStack.length ? { [outStack.length - 1]: 'done' } : {} },
        { label: 'served', value: served }));
    }
  }
  frames.push(snapshot(
    `Done. The lazy transfer is the key: we only reverse IN into OUT when OUT runs dry, so a run of dequeues after a run of enqueues pays the reversal once and amortizes it across all of them — amortized O(1) per operation.`,
    {}, { label: 'op', value: 'end' }));
  return frames;
}

// ---------------------------------------------------------------------------
// Export map
// ---------------------------------------------------------------------------
export default {
  'heap-binary': {
    title: 'Binary Heap — Push & Pop',
    renderer: 'tree',
    cases: [
      { label: 'Build by push, then pop-min', frames: heapBinaryFrames([5, 3, 8, 1, 9, 2]) },
      { label: 'Ascending pushes [1..6]', frames: heapBinaryFrames([1, 2, 3, 4, 5, 6]) },
      { label: 'Descending pushes [9..4]', frames: heapBinaryFrames([9, 8, 7, 6, 5, 4]) },
    ],
    build: ({ seq }) => heapBinaryFrames(
      String(seq ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
    ),
    inputSchema: {
      fields: [
        { name: 'seq', label: 'push order (comma-separated)', type: 'string', default: '5,3,8,1,9,2', max: 40, placeholder: '5,3,8,1,9,2' },
      ],
    },
  },
  'heap-sort-algorithm': {
    title: 'Heap Sort — build-heap then extract',
    renderer: 'array',
    cases: [
      { label: 'Random [4,10,3,5,1,8,7]', frames: heapSortFrames([4, 10, 3, 5, 1, 8, 7]) },
      { label: 'Reverse-sorted [8,7,6,5,4,3,2,1]', frames: heapSortFrames([8, 7, 6, 5, 4, 3, 2, 1]) },
      { label: 'Already sorted [1,2,3,4,5,6]', frames: heapSortFrames([1, 2, 3, 4, 5, 6]) },
    ],
    build: ({ nums }) => heapSortFrames(
      String(nums ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
    ),
    inputSchema: {
      fields: [
        { name: 'nums', label: 'array (comma-separated)', type: 'string', default: '4,10,3,5,1,8,7', max: 40, placeholder: '4,10,3,5,1,8,7' },
      ],
    },
  },
  'priority-queue-array': {
    title: 'Sorted-Array Priority Queue',
    renderer: 'array',
    cases: [
      { label: 'Insert [7,2,9,4], pop 2', frames: pqArrayFrames([7, 2, 9, 4], 2) },
      { label: 'Insert [5,1,8,3,6], pop 3', frames: pqArrayFrames([5, 1, 8, 3, 6], 3) },
      { label: 'Descending [9,7,5,3,1], pop 2', frames: pqArrayFrames([9, 7, 5, 3, 1], 2) },
    ],
    build: ({ inserts, pops }) => pqArrayFrames(
      String(inserts ?? '').split(',').map((s) => parseInt(s.trim(), 10)).filter((x) => Number.isFinite(x)),
      Number(pops),
    ),
    inputSchema: {
      fields: [
        { name: 'inserts', label: 'inserts (comma-separated)', type: 'string', default: '7,2,9,4', max: 40, placeholder: '7,2,9,4' },
        { name: 'pops', label: 'pop count', type: 'number', default: 2, min: 0, max: 10 },
      ],
    },
  },
  'queue-using-stacks': {
    title: 'Queue From Two Stacks',
    renderer: 'array',
    cases: [
      { label: 'enq 1,2 · deq · enq 3 · deq · deq', frames: queueTwoStacksFrames([['enq', 1], ['enq', 2], ['deq'], ['enq', 3], ['deq'], ['deq']]) },
      { label: 'Batch enq then drain', frames: queueTwoStacksFrames([['enq', 5], ['enq', 6], ['enq', 7], ['deq'], ['deq'], ['deq']]) },
      { label: 'Interleaved enq/deq', frames: queueTwoStacksFrames([['enq', 1], ['deq'], ['enq', 2], ['enq', 3], ['deq'], ['enq', 4], ['deq'], ['deq']]) },
    ],
  },
};
