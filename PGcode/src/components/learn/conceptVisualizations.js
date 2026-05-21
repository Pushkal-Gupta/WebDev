// Pre-baked visualization frame sets, keyed by concept slug.
// Used by ConceptPage to embed an interactive walkthrough next to the concept's
// "Intuition" section.

// Binary search for target 11 in [1,3,5,7,9,11,13,15,17,19].
function binarySearchFrames(arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], target = 11) {
  const frames = [];
  let lo = 0, hi = arr.length - 1;
  const eliminated = new Set();

  frames.push({
    array: arr,
    eliminated: new Set(eliminated),
    caption: `Binary search needs the array to be sorted. Here we have ${arr.length} elements: [${arr.join(', ')}].`,
  });
  frames.push({
    array: arr,
    highlights: { [lo]: 'low', [hi]: 'high' },
    eliminated: new Set(eliminated),
    caption: `Goal: locate ${target}. Set lo = 0 (first index), hi = ${hi} (last index). The "active range" is everything between them.`,
  });
  frames.push({
    array: arr,
    highlights: { [lo]: 'low', [hi]: 'high' },
    eliminated: new Set(eliminated),
    caption: `Idea: check the middle element. If it matches, done. Otherwise the sorted order tells us which half to discard.`,
  });
  frames.push({
    array: arr,
    highlights: { [lo]: 'low', [hi]: 'high' },
    eliminated: new Set(eliminated),
    caption: `Why this is O(log n): every step at least halves the active range. For n=${arr.length} that's ≤ ${Math.ceil(Math.log2(arr.length + 1))} comparisons — versus up to ${arr.length} for linear scan.`,
  });

  let stepNum = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    stepNum += 1;
    frames.push({
      array: arr,
      highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' },
      eliminated: new Set(eliminated),
      caption: `Step ${stepNum}: mid = (${lo} + ${hi}) / 2 = ${mid}. arr[${mid}] = ${arr[mid]}. ${arr[mid] === target ? 'Match!' : arr[mid] < target ? 'Too small — target must be to the right.' : 'Too big — target must be to the left.'}`,
    });
    if (arr[mid] === target) {
      frames.push({
        array: arr,
        highlights: { [mid]: 'match' },
        eliminated: new Set(eliminated),
        caption: `Found ${target} at index ${mid} in ${stepNum} comparison${stepNum === 1 ? '' : 's'} (vs up to ${arr.length} for linear scan).`,
      });
      break;
    }
    if (arr[mid] < target) {
      for (let k = lo; k <= mid; k++) eliminated.add(k);
      lo = mid + 1;
      frames.push({
        array: arr,
        highlights: { [lo]: 'low', [hi]: 'high' },
        eliminated: new Set(eliminated),
        caption: `Discard indices 0..${mid}. New range: lo = ${lo}, hi = ${hi}. Range halved — that's the O(log n) magic.`,
      });
    } else {
      for (let k = mid; k <= hi; k++) eliminated.add(k);
      hi = mid - 1;
      frames.push({
        array: arr,
        highlights: { [lo]: 'low', [hi]: 'high' },
        eliminated: new Set(eliminated),
        caption: `Discard indices ${mid}..${arr.length - 1}. New range: lo = ${lo}, hi = ${hi}. Range halved — that's the O(log n) magic.`,
      });
    }
  }
  // If we fell out of the loop without a match, report not-found.
  const last = frames[frames.length - 1];
  if (!last || !/Found/.test(last.caption || '')) {
    frames.push({
      array: arr,
      highlights: {},
      eliminated: new Set(eliminated),
      caption: `Not found. After ${frames.length - 1} steps, lo > hi → ${target} is not in the array.`,
    });
  }
  return frames;
}

// BFS on a small connected graph starting from node 0.
function bfsFrames() {
  // 5 nodes in a circle; edges: 0-1, 0-2, 1-3, 2-3, 3-4
  const nodes = [
    { id: 0, label: '0' },
    { id: 1, label: '1' },
    { id: 2, label: '2' },
    { id: 3, label: '3' },
    { id: 4, label: '4' },
  ];
  const edges = [
    { a: 0, b: 1 }, { a: 0, b: 2 },
    { a: 1, b: 3 }, { a: 2, b: 3 },
    { a: 3, b: 4 },
  ];
  const adj = { 0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2, 4], 4: [3] };

  const frames = [];
  const visited = new Set([0]);
  const queue = [0];

  const snapshot = (currentId, treeEdges, caption) => {
    const ns = nodes.map(n => ({
      ...n,
      state: n.id === currentId ? 'current'
        : visited.has(n.id) ? (queue.includes(n.id) ? 'frontier' : 'visited')
        : undefined,
    }));
    const es = edges.map(e => {
      const key1 = `${e.a}-${e.b}`, key2 = `${e.b}-${e.a}`;
      if (treeEdges.has(key1) || treeEdges.has(key2)) return { ...e, state: 'tree' };
      return e;
    });
    frames.push({ nodes: ns, edges: es, caption });
  };

  const tree = new Set();
  snapshot(0, tree, 'Start BFS at node 0. Queue = [0]. Visited = {0}.');

  while (queue.length) {
    const u = queue.shift();
    snapshot(u, tree, `Pop ${u}. Look at its neighbors.`);
    for (const v of adj[u]) {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
        tree.add(`${u}-${v}`);
        snapshot(u, tree, `Discover ${v} from ${u}. Push to queue. Queue now = [${queue.join(', ')}].`);
      }
    }
  }
  snapshot(null, tree, `BFS complete. All nodes visited in order of distance from source.`);
  return frames;
}

// Sliding window: longest substring without repeats over "abcabcbb".
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
    caption: `Find the longest substring of "${str}" with all distinct characters. Two pointers: l (left), r (right).`,
  });

  for (let r = 0; r < arr.length; r++) {
    const ch = arr[r];
    if (seen.has(ch) && seen.get(ch) >= l) {
      const prev = seen.get(ch);
      l = prev + 1;
      seen.set(ch, r);
      frames.push({
        array: arr,
        window: [l, r],
        caption: `'${ch}' repeats — shrink window. Move l to ${l}. Window = "${str.slice(l, r + 1)}".`,
      });
    } else {
      seen.set(ch, r);
      const len = r - l + 1;
      if (len > best) { best = len; bestRange = [l, r]; }
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Extend r to ${r} ('${ch}' new). Window = "${str.slice(l, r + 1)}" (length ${len}).${len === best ? ' New best!' : ''}`,
      });
    }
  }
  frames.push({
    array: arr,
    window: bestRange,
    caption: `Done. Longest substring without repeats = "${str.slice(bestRange[0], bestRange[1] + 1)}" (length ${best}).`,
  });
  return frames;
}

// Two-pointers: pair sum to target on a sorted array.
function twoPointersFrames(arr = [1, 2, 4, 7, 8, 11, 12, 15, 18, 20], target = 23) {
  if (arr.length < 2) return [{ array: arr, caption: 'Need at least 2 elements.' }];
  const frames = [];
  let l = 0, r = arr.length - 1;
  frames.push({
    array: arr,
    caption: `Two-pointers needs a sorted array. Here: [${arr.join(', ')}] (${arr.length} elements). Goal: a pair summing to ${target}.`,
  });
  frames.push({
    array: arr,
    window: [l, r],
    caption: `Place l at the start (index ${l}) and r at the end (index ${r}). sum = arr[${l}] + arr[${r}] = ${arr[l]} + ${arr[r]} = ${arr[l] + arr[r]}.`,
  });
  frames.push({
    array: arr,
    window: [l, r],
    caption: `Trick: because the array is sorted, if sum is too small we must move l right; if too big we must move r left. Each step shrinks the window — O(n) total.`,
  });
  let stepNum = 0;
  while (l < r) {
    stepNum += 1;
    const sum = arr[l] + arr[r];
    if (sum === target) {
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Step ${stepNum}: arr[${l}] + arr[${r}] = ${arr[l]} + ${arr[r]} = ${target}. Found the pair.`,
      });
      break;
    }
    if (sum < target) {
      const oldL = l; l += 1;
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Step ${stepNum}: sum = ${arr[oldL]} + ${arr[r]} = ${sum} < ${target}. Need bigger — advance l from ${oldL} to ${l}.`,
      });
    } else {
      const oldR = r; r -= 1;
      frames.push({
        array: arr,
        window: [l, r],
        caption: `Step ${stepNum}: sum = ${arr[l]} + ${arr[oldR]} = ${sum} > ${target}. Need smaller — retreat r from ${oldR} to ${r}.`,
      });
    }
  }
  if (l >= r) {
    frames.push({
      array: arr,
      caption: `Pointers crossed — no pair sums to ${target}. Total steps: ${stepNum}.`,
    });
  }
  return frames;
}

// Kadane's: running max-ending-here / max-so-far on an array with negatives.
function kadaneFrames(arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]) {
  if (!arr.length) return [{ array: [], caption: 'Empty array — no subarray.' }];
  const frames = [];
  let cur = arr[0], best = arr[0], bestStart = 0, bestEnd = 0, curStart = 0;
  frames.push({
    array: arr,
    highlights: { 0: 'mid' },
    caption: `Initialize: cur = best = arr[0] = ${arr[0]}. Walk left-to-right.`,
  });
  for (let i = 1; i < arr.length; i++) {
    if (cur + arr[i] < arr[i]) {
      cur = arr[i];
      curStart = i;
    } else {
      cur = cur + arr[i];
    }
    const elim = new Set();
    for (let k = 0; k < curStart; k++) elim.add(k);
    let beat = false;
    if (cur > best) { best = cur; bestStart = curStart; bestEnd = i; beat = true; }
    frames.push({
      array: arr,
      highlights: { [i]: 'mid', [curStart]: 'low' },
      eliminated: elim,
      caption: `i=${i}: cur = ${cur} (running sum from index ${curStart}). best = ${best}.${beat ? ' New maximum!' : ''}`,
    });
  }
  const elim = new Set();
  for (let k = 0; k < arr.length; k++) if (k < bestStart || k > bestEnd) elim.add(k);
  frames.push({
    array: arr,
    highlights: Object.fromEntries(Array.from({ length: bestEnd - bestStart + 1 }, (_, k) => [bestStart + k, 'match'])),
    eliminated: elim,
    caption: `Maximum subarray = arr[${bestStart}..${bestEnd}] with sum ${best}.`,
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

// Dijkstra: shortest paths from source 0 on a small weighted graph.
function dijkstraFrames() {
  // 5 nodes; edges with weights.
  const nodes = [
    { id: 0, label: '0' },
    { id: 1, label: '1' },
    { id: 2, label: '2' },
    { id: 3, label: '3' },
    { id: 4, label: '4' },
  ];
  const edges = [
    { a: 0, b: 1, w: 2 }, { a: 0, b: 2, w: 5 },
    { a: 1, b: 2, w: 1 }, { a: 1, b: 3, w: 6 },
    { a: 2, b: 3, w: 3 }, { a: 2, b: 4, w: 9 },
    { a: 3, b: 4, w: 2 },
  ];
  const adj = {};
  for (const e of edges) {
    (adj[e.a] ||= []).push([e.b, e.w]);
    (adj[e.b] ||= []).push([e.a, e.w]);
  }
  const dist = { 0: 0, 1: Infinity, 2: Infinity, 3: Infinity, 4: Infinity };
  const visited = new Set();
  const frames = [];

  const labelOf = (id) => `${id}\n${dist[id] === Infinity ? '∞' : dist[id]}`;

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

  snapshot(0, null, `Dijkstra from node 0. dist[0]=0; all others = ∞.`);

  while (true) {
    let u = -1, best = Infinity;
    for (const id of [0, 1, 2, 3, 4]) {
      if (!visited.has(id) && dist[id] < best) { best = dist[id]; u = id; }
    }
    if (u === -1) break;
    visited.add(u);
    snapshot(u, null, `Pick unvisited node with smallest dist: node ${u} (dist=${dist[u]}). Mark visited. Relax its neighbors.`);
    for (const [v, w] of adj[u] || []) {
      if (visited.has(v)) continue;
      const cand = dist[u] + w;
      if (cand < dist[v]) {
        dist[v] = cand;
        snapshot(u, { from: u, to: v }, `Relax edge ${u}→${v} (w=${w}). New dist[${v}] = ${dist[u]} + ${w} = ${cand}.`);
      }
    }
  }
  snapshot(null, null, `All shortest distances finalized: [${[0,1,2,3,4].map(i => dist[i]).join(', ')}].`);
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
function manacherFrames(input = 'babcbabcabbabcd') {
  const s = String(input ?? '');
  if (!s.length) return [{ array: [], caption: 'Empty string — no palindrome.' }];
  // Transform: ^#a#b#c#$
  const t = ['^'];
  for (const ch of s) { t.push('#'); t.push(ch); }
  t.push('#'); t.push('$');
  const p = new Array(t.length).fill(0);
  let center = 0, right = 0, bestI = 0;
  const frames = [];

  frames.push({ array: s.split(''), caption: `Manacher's algorithm finds the longest palindromic substring in O(n). Transform "${s}" with separators to handle even-length palindromes uniformly, then maintain a center/right-boundary and reuse past results.` });
  frames.push({ array: t.slice(1, -1), caption: `Transformed string with '#' separators (length ${t.length - 2}). p[i] = radius of the palindrome centered at i in transformed coords.` });

  for (let i = 1; i < t.length - 1; i += 1) {
    const mirror = 2 * center - i;
    if (i < right) p[i] = Math.min(right - i, p[mirror]);
    while (t[i + p[i] + 1] === t[i - p[i] - 1]) p[i] += 1;
    if (i + p[i] > right) { center = i; right = i + p[i]; }
    if (p[i] > p[bestI]) bestI = i;

    if (i % Math.max(1, Math.floor((t.length - 2) / 12)) === 0 || p[i] >= p[bestI] - 1) {
      const sIdxApprox = Math.floor((i - 1) / 2);
      const hi = {};
      if (sIdxApprox >= 0 && sIdxApprox < s.length) hi[sIdxApprox] = 'mid';
      frames.push({
        array: s.split(''),
        highlights: hi,
        caption: `i=${i} (≈ original index ${sIdxApprox}): p[i]=${p[i]}. Current center=${center}, right=${right}. Best radius so far = ${p[bestI]}.`,
      });
    }
  }

  const startInS = Math.floor((bestI - p[bestI]) / 2);
  const lenInS = p[bestI];
  const hl = {};
  for (let i = startInS; i < startInS + lenInS && i < s.length; i += 1) hl[i] = 'match';
  frames.push({
    array: s.split(''),
    highlights: hl,
    caption: `Longest palindromic substring: "${s.slice(startInS, startInS + lenInS)}" (length ${lenInS}, starts at index ${startInS}). Total time O(n).`,
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
  frames.push({ array: [], caption: `Treap: a randomised BST that is also a max-heap on priorities. Each node stores (key, priority). Keys obey BST order left→right; priorities obey heap order top-down.` });
  frames.push({ array: [], caption: `Insert(key): BST-insert as a leaf with a random priority, then rotate that leaf upward while it violates the heap order. Each frame shows in-order layout "key|p=priority".` });
  frames.push({ array: [], caption: `Expected height O(log n) because random priorities behave like a random permutation — equivalent to inserting in random order into a plain BST.` });

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

export const VISUALIZATIONS = {
  'binary-search': {
    title: 'Binary search walkthrough', renderer: 'array',
    cases: [
      { label: 'Found in middle',   frames: binarySearchFrames([1, 3, 5, 7, 9, 11, 13, 15, 17, 19], 11) },
      { label: 'Found at end',      frames: binarySearchFrames([2, 4, 8, 16, 32, 64, 128, 256], 256) },
      { label: 'Not found',         frames: binarySearchFrames([1, 4, 7, 10, 13, 16, 19], 8) },
    ],
    build: ({ array, target }) => binarySearchFrames(array, target),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Sorted array', type: 'intArray', default: [1, 3, 5, 7, 9, 11, 13, 15], placeholder: '1, 3, 5, 7…' },
        { name: 'target', label: 'Target', type: 'int', default: 7 },
      ],
    },
  },
  'bfs-dfs':         { title: 'BFS walkthrough',              frames: bfsFrames(),           renderer: 'graph' },
  'sliding-window': {
    title: 'Sliding window walkthrough', renderer: 'window',
    cases: [
      { label: 'Mixed repeats',    frames: slidingWindowFrames('abcabcbb') },
      { label: 'Late repeat',      frames: slidingWindowFrames('pwwkew') },
      { label: 'All same chars',   frames: slidingWindowFrames('bbbbb') },
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
    title: 'Heap sift-down walkthrough', renderer: 'array',
    cases: [
      { label: 'Random',         frames: heapSiftDownFrames([3, 10, 8, 5, 7, 6, 1]) },
      { label: 'Already a heap', frames: heapSiftDownFrames([10, 8, 6, 5, 7, 3, 1]) },
      { label: 'Reverse sorted', frames: heapSiftDownFrames([1, 3, 5, 6, 7, 8, 10]) },
    ],
    build: ({ array }) => heapSiftDownFrames(array),
    inputSchema: {
      fields: [
        { name: 'array', label: 'Array', type: 'intArray', default: [3, 10, 8, 5, 7, 6, 1], placeholder: '3, 10, 8…' },
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
};
