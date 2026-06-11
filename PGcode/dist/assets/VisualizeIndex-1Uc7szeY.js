const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./InteractiveVisualizer-B3oViWIy.js","./vendor-query-FJdQ8OJm.js","./vendor-monaco-BrjDLSos.js","./AlgoVisualizer-D2YimVKa.js","./vendor-icons-BfDdlEw9.js","./AlgoVisualizer-X_Dudo9z.css","./index-CQIsoIaQ.js","./vendor-react-firagBrd.js","./vendor-supabase-ClVc2H6D.js","./index-BI9wvhGy.css","./conceptVisualizations-CrRwO7-N.js","./achievements-mHPdJrNV.js","./InteractiveVisualizer-DaD-Uvgc.css","./Learn-C_DSYUA7.css"])))=>i.map(i=>d[i]);
import{_ as D}from"./index-CQIsoIaQ.js";import{r as u,j as e}from"./vendor-query-FJdQ8OJm.js";import{A as F,G as R,S as P,N as z,T as H,a as L}from"./AlgoVisualizer-D2YimVKa.js";import{V as S}from"./conceptVisualizations-CrRwO7-N.js";import{r as M}from"./achievements-mHPdJrNV.js";/* empty css              */import{u as K,L as w}from"./vendor-react-firagBrd.js";import{am as G,c as q,v as T,A as V,u as W,X as _,k as U}from"./vendor-icons-BfDdlEw9.js";const r={};r["binary-search"]={title:"Binary search",description:"Halve the search space at every step. Edit the code, change the target, watch the pointers move.",renderer:"array",initialInput:{array:[1,3,5,7,9,11,13,15,17,19],target:11},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'lo'|'hi'|'mid'|'match' }, eliminated?: number[] }`,initialCode:`// Binary search. Call step(state, caption) to record a frame.
const { array, target } = input;
let lo = 0, hi = array.length - 1;
const eliminated = [];

step({ array, highlights: { [lo]: 'low', [hi]: 'high' }, eliminated: [...eliminated] },
  \`Anchor lo=\${lo}, hi=\${hi}\`);

while (lo <= hi) {
  const mid = (lo + hi) >> 1;
  step(
    { array, highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' }, eliminated: [...eliminated] },
    \`Probe arr[\${mid}] = \${array[mid]} vs target \${target}\`,
  );
  if (array[mid] === target) {
    step({ array, highlights: { [mid]: 'match' }, eliminated: [...eliminated] },
      \`Match at index \${mid}\`);
    log('found', mid);
    return;
  }
  if (array[mid] < target) {
    for (let k = lo; k <= mid; k++) eliminated.push(k);
    lo = mid + 1;
  } else {
    for (let k = mid; k <= hi; k++) eliminated.push(k);
    hi = mid - 1;
  }
}
step({ array, highlights: {}, eliminated: [...eliminated] }, 'Target not present');
log('not found');
`};r.bfs={title:"Breadth-first search",description:"Frontier expansion from a source vertex. Edit the adjacency list and the start node.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","B"],["A","C"],["B","D"],["C","D"],["C","E"],["D","F"],["E","F"]],start:"A"},stateHint:`// GraphRenderer frame:
// { nodes: [{ id, label, state? }], edges: [{ a, b, state? }] }
// state values that paint nicely: 'current' | 'visited' | 'frontier' | 'done'`,initialCode:`// BFS from input.start. Use a queue.
const { nodes, edges, start } = input;
const adj = Object.fromEntries(nodes.map(n => [n, []]));
for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }

function frame(visited, frontier, current, caption) {
  step({
    nodes: nodes.map(n => ({
      id: n, label: n,
      state: n === current ? 'current'
        : visited.has(n) ? 'visited'
        : frontier.has(n) ? 'frontier' : undefined,
    })),
    edges: edges.map(([a, b]) => ({ a, b })),
  }, caption);
}

const visited = new Set([start]);
const queue = [start];
frame(visited, new Set(queue), start, \`Enqueue source \${start}\`);

while (queue.length) {
  const u = queue.shift();
  frame(visited, new Set(queue), u, \`Visit \${u}\`);
  for (const v of adj[u]) {
    if (!visited.has(v)) {
      visited.add(v);
      queue.push(v);
      frame(visited, new Set(queue), u, \`Discover \${v} via \${u}\`);
    }
  }
}
frame(visited, new Set(), null, 'BFS complete');
`};r.dfs={title:"Depth-first search",description:"Recursive descent. Track call-stack frames as you go deeper, then back out.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","B"],["A","C"],["B","D"],["C","E"],["D","F"],["E","F"]],start:"A"},stateHint:"// GraphRenderer frame, same shape as BFS.",initialCode:`// Iterative DFS using an explicit stack.
const { nodes, edges, start } = input;
const adj = Object.fromEntries(nodes.map(n => [n, []]));
for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }

function frame(visited, stack, current, caption) {
  step({
    nodes: nodes.map(n => ({
      id: n, label: n,
      state: n === current ? 'current'
        : visited.has(n) ? 'visited'
        : stack.includes(n) ? 'frontier' : undefined,
    })),
    edges: edges.map(([a, b]) => ({ a, b })),
  }, caption);
}

const visited = new Set();
const stack = [start];
frame(visited, stack, start, \`Push source \${start}\`);

while (stack.length) {
  const u = stack.pop();
  if (visited.has(u)) continue;
  visited.add(u);
  frame(visited, stack, u, \`Visit \${u}\`);
  for (const v of adj[u]) {
    if (!visited.has(v)) {
      stack.push(v);
      frame(visited, stack, u, \`Push neighbour \${v}\`);
    }
  }
}
frame(visited, [], null, 'DFS complete');
`};r.dijkstra={title:"Dijkstra's shortest path",description:"Relaxation with a (simulated) priority queue. Edit weights to see paths reshuffle.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E"],edges:[["A","B",4],["A","C",2],["B","C",1],["B","D",5],["C","D",8],["C","E",10],["D","E",2]],source:"A"},stateHint:`// GraphRenderer frame with weighted edges:
// edges entries: { a, b, w, state? }
// Node label can include the running distance, e.g. 'A\\n0'`,initialCode:`// Dijkstra from input.source on an undirected weighted graph.
const { nodes, edges, source } = input;
const adj = Object.fromEntries(nodes.map(n => [n, []]));
for (const [a, b, w] of edges) {
  adj[a].push([b, w]);
  adj[b].push([a, w]);
}
const dist = Object.fromEntries(nodes.map(n => [n, n === source ? 0 : Infinity]));
const settled = new Set();

function frame(current, caption) {
  step({
    nodes: nodes.map(n => ({
      id: n,
      label: \`\${n}\\n\${dist[n] === Infinity ? '∞' : dist[n]}\`,
      state: n === current ? 'current'
        : settled.has(n) ? 'done'
        : dist[n] !== Infinity ? 'frontier' : undefined,
    })),
    edges: edges.map(([a, b, w]) => ({ a, b, w })),
  }, caption);
}

frame(source, \`Init: dist[\${source}] = 0, all others ∞\`);

while (settled.size < nodes.length) {
  let u = null, best = Infinity;
  for (const n of nodes) {
    if (!settled.has(n) && dist[n] < best) { best = dist[n]; u = n; }
  }
  if (u == null) break;
  settled.add(u);
  frame(u, \`Settle \${u} with distance \${dist[u]}\`);
  for (const [v, w] of adj[u]) {
    if (settled.has(v)) continue;
    if (dist[u] + w < dist[v]) {
      dist[v] = dist[u] + w;
      frame(u, \`Relax \${u}→\${v} (w=\${w}): dist[\${v}] = \${dist[v]}\`);
    }
  }
}
frame(null, 'All vertices settled');
log('distances', dist);
`};r["heap-insert"]={title:"Min-heap insertion",description:"Push to the back, then sift up while smaller than the parent. Edit the values to push.",renderer:"array",initialInput:{initial:[],pushes:[7,3,9,1,5,4,8,2]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'current'|'mid'|'match' } }`,initialCode:`// Min-heap insertions. The heap is stored as an array (1-indexed via formulas).
const { initial, pushes } = input;
const heap = [...initial];

function snap(caption, hot) {
  const highlights = {};
  if (hot != null) highlights[hot] = 'mid';
  step({ array: [...heap], highlights }, caption);
}

snap('Empty heap');

for (const v of pushes) {
  heap.push(v);
  let i = heap.length - 1;
  snap(\`Push \${v} to the back at index \${i}\`, i);
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (heap[parent] <= heap[i]) break;
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    snap(\`Sift up: swap with parent at \${parent}\`, parent);
    i = parent;
  }
  snap(\`Settled \${v}\`, i);
}
log('final heap', heap);
`};r["two-pointers"]={title:"Two pointers",description:"Find a pair summing to the target on a sorted array. O(n).",renderer:"array",initialInput:{array:[1,2,4,6,8,11,14,18],target:12},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'match' } }`,initialCode:`// Two pointers from the ends, converging.
const { array, target } = input;
let l = 0, r = array.length - 1;
step({ array, highlights: { [l]: 'low', [r]: 'high' } },
  \`Start: l=\${l}, r=\${r}\`);

while (l < r) {
  const s = array[l] + array[r];
  step({ array, highlights: { [l]: 'low', [r]: 'high' } },
    \`Sum arr[\${l}] + arr[\${r}] = \${s}\`);
  if (s === target) {
    step({ array, highlights: { [l]: 'match', [r]: 'match' } },
      \`Found pair (\${array[l]}, \${array[r]})\`);
    log('pair', [array[l], array[r]]);
    return;
  }
  if (s < target) l++; else r--;
}
step({ array, highlights: {} }, 'No pair sums to target');
`};r["sliding-window"]={title:"Sliding window",description:"Longest substring without repeating chars. Expand right; contract left on duplicates.",renderer:"window",initialInput:{s:"abcabcbb"},stateHint:`// SlidingWindowRenderer frame:
// { array: any[], window: [leftIdx, rightIdx] }   // rightIdx inclusive; -1 when empty`,initialCode:`// Variable-size window over a string.
const { s } = input;
const arr = s.split('');
const seen = new Map();
let l = 0, best = 0, bestRange = [0, -1];

step({ array: arr, window: [0, -1] }, 'Empty window');

for (let r = 0; r < arr.length; r++) {
  const ch = arr[r];
  if (seen.has(ch) && seen.get(ch) >= l) {
    step({ array: arr, window: [l, r - 1] },
      \`Duplicate '\${ch}' — about to slide l past index \${seen.get(ch)}\`);
    l = seen.get(ch) + 1;
  }
  seen.set(ch, r);
  step({ array: arr, window: [l, r] },
    \`Expand to r=\${r}; window length \${r - l + 1}\`);
  if (r - l + 1 > best) {
    best = r - l + 1;
    bestRange = [l, r];
  }
}
step({ array: arr, window: bestRange },
  \`Longest unique window length = \${best}\`);
log('best length', best);
`};r["quicksort-partition"]={title:"Quicksort partition (Lomuto)",description:"Pivot at the end; sweep i; swap smaller items into the front; finally place pivot.",renderer:"array",initialInput:{array:[7,2,9,4,1,6,8,3,5]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Lomuto partition on the entire array. Pivot = last element.
const arr = [...input.array];
const lo = 0, hi = arr.length - 1;
const pivot = arr[hi];
let i = lo - 1;

step({ array: [...arr], highlights: { [hi]: 'mid' } },
  \`Pivot = arr[\${hi}] = \${pivot}\`);

for (let j = lo; j < hi; j++) {
  step({ array: [...arr], highlights: { [hi]: 'mid', [j]: 'low', [Math.max(i, 0)]: 'high' } },
    \`Scan j=\${j}, arr[j]=\${arr[j]}\`);
  if (arr[j] <= pivot) {
    i++;
    if (i !== j) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      step({ array: [...arr], highlights: { [hi]: 'mid', [i]: 'high', [j]: 'low' } },
        \`Swap into low region at index \${i}\`);
    }
  }
}
[arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
step({ array: [...arr], highlights: { [i + 1]: 'match' } },
  \`Place pivot at index \${i + 1}; partition done\`);
log('pivot index', i + 1, 'result', arr);
`};r["merge-sort"]={title:"Merge sort (merge step)",description:"Take from the smaller head of two sorted halves until both drain. The hot loop of merge sort.",renderer:"array",initialInput:{left:[1,4,6,9],right:[2,3,5,8,10]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Merge two sorted arrays. The render shows: [...left] [merged] [...right].
const { left, right } = input;
const a = [...left], b = [...right];
let i = 0, j = 0;
const out = [];

function snap(caption) {
  const display = [...a.slice(i), ...out, ...b.slice(j)];
  const highlights = {};
  // mark the next pick on each side
  if (i < a.length) highlights[0] = 'low';
  const rightStart = (a.length - i) + out.length;
  if (j < b.length) highlights[rightStart] = 'high';
  // last appended element
  if (out.length) highlights[(a.length - i) + out.length - 1] = 'match';
  step({ array: display, highlights }, caption);
}

snap('Two sorted halves ready to merge');

while (i < a.length && j < b.length) {
  if (a[i] <= b[j]) {
    out.push(a[i]);
    snap(\`Take \${a[i]} from left\`);
    i++;
  } else {
    out.push(b[j]);
    snap(\`Take \${b[j]} from right\`);
    j++;
  }
}
while (i < a.length) { out.push(a[i++]); snap('Drain left tail'); }
while (j < b.length) { out.push(b[j++]); snap('Drain right tail'); }

step({ array: out, highlights: {} }, 'Merge complete');
log('merged', out);
`};r.kadanes={title:"Kadane's algorithm",description:"Maximum subarray sum in a single pass. Reset the running sum whenever it goes negative.",renderer:"array",initialInput:{array:[-2,1,-3,4,-1,2,1,-5,4]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Kadane's algorithm.
const { array } = input;
let best = -Infinity, here = 0;
let bestL = 0, bestR = 0, curL = 0;

step({ array, highlights: {} }, 'Start. here=0, best=-∞');

for (let i = 0; i < array.length; i++) {
  if (here + array[i] < array[i]) {
    here = array[i];
    curL = i;
  } else {
    here = here + array[i];
  }
  const highlights = { [i]: 'mid', [curL]: 'low' };
  step({ array, highlights }, \`i=\${i}: here = \${here}, window starts at \${curL}\`);
  if (here > best) {
    best = here;
    bestL = curL;
    bestR = i;
    const h2 = { [i]: 'match', [curL]: 'match' };
    step({ array, highlights: h2 }, \`New best = \${best} on [\${bestL}..\${bestR}]\`);
  }
}
const finalH = {};
for (let k = bestL; k <= bestR; k++) finalH[k] = 'match';
step({ array, highlights: finalH }, \`Max subarray sum = \${best}\`);
log('max sum', best, 'range', [bestL, bestR]);
`};r["bubble-sort"]={title:"Bubble sort",description:"Repeatedly swap adjacent out-of-order pairs. After pass k the last k elements are settled.",renderer:"array",initialInput:{array:[5,2,8,1,4,7,3,6]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Bubble sort with early-exit when a pass makes no swaps.
const arr = [...input.array];
const n = arr.length;
step({ array: [...arr], highlights: {} }, 'Unsorted input');

for (let i = 0; i < n - 1; i++) {
  let swapped = false;
  for (let j = 0; j < n - 1 - i; j++) {
    step({ array: [...arr], highlights: { [j]: 'low', [j + 1]: 'high' } },
      \`Compare arr[\${j}]=\${arr[j]} vs arr[\${j + 1}]=\${arr[j + 1]}\`);
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      swapped = true;
      step({ array: [...arr], highlights: { [j]: 'mid', [j + 1]: 'mid' } },
        \`Swap adjacent pair at \${j}, \${j + 1}\`);
    }
  }
  const done = {};
  for (let k = n - 1 - i; k < n; k++) done[k] = 'match';
  step({ array: [...arr], highlights: done },
    \`Pass \${i + 1} done. Tail of length \${i + 1} settled.\`);
  if (!swapped) break;
}
const all = {};
for (let k = 0; k < n; k++) all[k] = 'match';
step({ array: [...arr], highlights: all }, 'Sorted');
log('sorted', arr);
`};r["insertion-sort"]={title:"Insertion sort",description:"Grow a sorted prefix on the left by shifting each new element backward into place.",renderer:"array",initialInput:{array:[7,3,5,1,8,2,6,4]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Insertion sort. Sorted region grows one element per outer pass.
const arr = [...input.array];
const n = arr.length;
step({ array: [...arr], highlights: { [0]: 'match' } }, 'Prefix of length 1 is trivially sorted');

for (let i = 1; i < n; i++) {
  const key = arr[i];
  step({ array: [...arr], highlights: { [i]: 'mid' } },
    \`Pick key arr[\${i}] = \${key}\`);
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    step({ array: [...arr], highlights: { [j]: 'high', [j + 1]: 'low' } },
      \`Shift arr[\${j}]=\${arr[j]} one slot right\`);
    j--;
  }
  arr[j + 1] = key;
  const done = {};
  for (let k = 0; k <= i; k++) done[k] = 'match';
  step({ array: [...arr], highlights: done },
    \`Drop key at \${j + 1}; prefix of length \${i + 1} sorted\`);
}
log('sorted', arr);
`};r["selection-sort"]={title:"Selection sort",description:"Each pass finds the min of the unsorted suffix and swaps it into the front.",renderer:"array",initialInput:{array:[9,4,6,2,7,1,8,3]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Selection sort. At most n-1 swaps total.
const arr = [...input.array];
const n = arr.length;
step({ array: [...arr], highlights: {} }, 'Start');

for (let i = 0; i < n - 1; i++) {
  let minIdx = i;
  step({ array: [...arr], highlights: { [i]: 'low', [minIdx]: 'mid' } },
    \`Scan suffix starting at \${i}; current min index = \${minIdx}\`);
  for (let j = i + 1; j < n; j++) {
    step({ array: [...arr], highlights: { [i]: 'low', [j]: 'high', [minIdx]: 'mid' } },
      \`Probe arr[\${j}] = \${arr[j]} vs min arr[\${minIdx}] = \${arr[minIdx]}\`);
    if (arr[j] < arr[minIdx]) {
      minIdx = j;
      step({ array: [...arr], highlights: { [i]: 'low', [minIdx]: 'mid' } },
        \`New min found at \${minIdx}\`);
    }
  }
  if (minIdx !== i) {
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    step({ array: [...arr], highlights: { [i]: 'match' } },
      \`Swap min into position \${i}\`);
  } else {
    step({ array: [...arr], highlights: { [i]: 'match' } },
      \`Already in place at \${i}\`);
  }
}
log('sorted', arr);
`};r["heap-sort"]={title:"Heap sort",description:"Build a max-heap in place, then repeatedly swap root with the last unsorted slot.",renderer:"array",initialInput:{array:[4,10,3,5,1,7,8,2,9,6]},stateHint:"// Heap stored as array. highlights show the active node and swap target.",initialCode:`// Heap sort: max-heapify then extract.
const arr = [...input.array];
const n = arr.length;

function siftDown(end, root, label) {
  let i = root;
  while (true) {
    const l = 2 * i + 1, r = 2 * i + 2;
    let largest = i;
    if (l < end && arr[l] > arr[largest]) largest = l;
    if (r < end && arr[r] > arr[largest]) largest = r;
    step({ array: [...arr], highlights: { [i]: 'low', [largest]: 'mid' } },
      \`\${label}: parent \${i}=\${arr[i]}, largest=\${largest}=\${arr[largest]}\`);
    if (largest === i) return;
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    step({ array: [...arr], highlights: { [largest]: 'mid' } },
      \`Swap down to index \${largest}\`);
    i = largest;
  }
}

step({ array: [...arr], highlights: {} }, 'Start. Build max-heap bottom-up.');
for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(n, i, 'Heapify');

const sorted = {};
for (let end = n - 1; end > 0; end--) {
  [arr[0], arr[end]] = [arr[end], arr[0]];
  sorted[end] = 'match';
  step({ array: [...arr], highlights: { ...sorted, [0]: 'high' } },
    \`Move max to index \${end}; heap shrinks to \${end}\`);
  siftDown(end, 0, 'Sift root');
}
sorted[0] = 'match';
step({ array: [...arr], highlights: sorted }, 'Sorted');
log('sorted', arr);
`};r["counting-sort"]={title:"Counting sort",description:"Tally occurrences of each key, then write keys back in order. O(n + k) for small key ranges.",renderer:"array",initialInput:{array:[4,2,2,8,3,3,1,4,0,5]},stateHint:"// ArrayBarRenderer frame. Counts are shown as a separate snapshot via display = [...arr, ...counts].",initialCode:`// Counting sort over non-negative integers.
const arr = [...input.array];
const max = Math.max(...arr);
const counts = new Array(max + 1).fill(0);

step({ array: [...arr], highlights: {} }, \`Input. Key range 0..\${max}.\`);

for (let i = 0; i < arr.length; i++) {
  counts[arr[i]]++;
  step({ array: [...counts], highlights: { [arr[i]]: 'mid' } },
    \`Tally arr[\${i}] = \${arr[i]}; counts[\${arr[i]}] = \${counts[arr[i]]}\`);
}

const out = [];
for (let v = 0; v <= max; v++) {
  for (let k = 0; k < counts[v]; k++) {
    out.push(v);
    step({ array: [...out], highlights: { [out.length - 1]: 'match' } },
      \`Emit \${v} (occurrence \${k + 1} of \${counts[v]})\`);
  }
}
step({ array: out, highlights: {} }, 'Sorted output');
log('sorted', out);
`};r["linear-search"]={title:"Linear search",description:"Walk left-to-right comparing each element to the target. O(n).",renderer:"array",initialInput:{array:[14,7,22,3,9,18,5,11,25,6],target:18},stateHint:"// ArrayBarRenderer frame: highlights mark the probe and any match.",initialCode:`// Linear search.
const { array, target } = input;
step({ array, highlights: {} }, \`Searching for \${target}\`);

for (let i = 0; i < array.length; i++) {
  step({ array, highlights: { [i]: 'mid' } },
    \`Probe arr[\${i}] = \${array[i]}\`);
  if (array[i] === target) {
    step({ array, highlights: { [i]: 'match' } },
      \`Match at index \${i}\`);
    log('found', i);
    return;
  }
}
step({ array, highlights: {} }, \`\${target} is not present\`);
log('not found');
`};r["union-find"]={title:"Union-Find with path compression",description:"Disjoint-set forest stored as a parent array. Each find flattens the chain it walks.",renderer:"array",initialInput:{n:8,ops:[["union",0,1],["union",2,3],["union",4,5],["union",6,7],["union",1,3],["union",5,7],["find",0],["union",3,5]]},stateHint:"// ArrayBarRenderer frame: parent[] as bars; highlights mark the walked path.",initialCode:`// Union-find with path compression. parent[i] = i means i is a root.
const { n, ops } = input;
const parent = Array.from({ length: n }, (_, i) => i);

step({ array: [...parent], highlights: {} },
  \`Init: \${n} singletons. parent[i] = i for every i.\`);

function find(x) {
  const path = [];
  let cur = x;
  while (parent[cur] !== cur) { path.push(cur); cur = parent[cur]; }
  const root = cur;
  const hl = Object.fromEntries(path.map(i => [i, 'low']));
  hl[root] = 'mid';
  step({ array: [...parent], highlights: hl },
    \`find(\${x}): walk to root \${root} via [\${path.join(' → ')}]\`);
  for (const node of path) parent[node] = root;
  if (path.length) {
    step({ array: [...parent], highlights: { ...hl, [root]: 'match' } },
      \`Path-compress: every node on the path now points directly to \${root}\`);
  }
  return root;
}

for (const op of ops) {
  if (op[0] === 'union') {
    const [, a, b] = op;
    const ra = find(a), rb = find(b);
    if (ra === rb) {
      step({ array: [...parent], highlights: { [ra]: 'match' } },
        \`union(\${a}, \${b}): already same component (root \${ra})\`);
    } else {
      parent[ra] = rb;
      step({ array: [...parent], highlights: { [ra]: 'high', [rb]: 'match' } },
        \`union(\${a}, \${b}): attach root \${ra} under root \${rb}\`);
    }
  } else if (op[0] === 'find') {
    find(op[1]);
  }
}
log('parent', parent);
`};r["kruskal-mst"]={title:"Kruskal's MST",description:"Sort edges by weight, add each that does not close a cycle (tested via union-find).",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","B",4],["A","F",2],["B","C",6],["B","F",5],["C","D",3],["C","F",1],["D","E",2],["E","F",4]]},stateHint:"// GraphRenderer frame. Edge state 'done' = picked, 'current' = considering, 'visited' = rejected.",initialCode:`// Kruskal: greedy edge picks with DSU cycle check.
const { nodes, edges } = input;
const idx = Object.fromEntries(nodes.map((n, i) => [n, i]));
const parent = nodes.map((_, i) => i);
const find = (x) => parent[x] === x ? x : (parent[x] = find(parent[x]));

const sorted = [...edges].sort((a, b) => a[2] - b[2]);
const picked = new Set(), rejected = new Set();

function frame(consideringIdx, caption) {
  step({
    nodes: nodes.map(n => ({ id: n, label: n })),
    edges: edges.map((e, i) => {
      const k = \`\${e[0]}-\${e[1]}\`;
      let state;
      if (picked.has(k)) state = 'done';
      else if (rejected.has(k)) state = 'visited';
      else if (i === consideringIdx) state = 'current';
      return { a: e[0], b: e[1], w: e[2], state };
    }),
  }, caption);
}

frame(-1, \`Sorted edges by weight: \${sorted.map(e => e[0] + '-' + e[1] + '(' + e[2] + ')').join(', ')}\`);

for (const e of sorted) {
  const origIdx = edges.indexOf(e);
  const [a, b, w] = e;
  const key = \`\${a}-\${b}\`;
  frame(origIdx, \`Consider \${a}-\${b} (w=\${w})\`);
  const ra = find(idx[a]), rb = find(idx[b]);
  if (ra === rb) {
    rejected.add(key);
    frame(origIdx, \`Reject \${a}-\${b}: would close a cycle\`);
  } else {
    parent[ra] = rb;
    picked.add(key);
    frame(origIdx, \`Pick \${a}-\${b}: unions components\`);
  }
}
frame(-1, \`MST complete with \${picked.size} edges\`);
log('mst edges', [...picked]);
`};r["prim-mst"]={title:"Prim's MST",description:"Grow the tree from a seed vertex by repeatedly absorbing the cheapest crossing edge.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","B",4],["A","F",2],["B","C",6],["B","F",5],["C","D",3],["C","F",1],["D","E",2],["E","F",4]],start:"A"},stateHint:"// GraphRenderer frame, weighted edges. Node state 'done' = in tree, 'frontier' = reachable.",initialCode:`// Prim's algorithm (no heap; scan crossing edges each round for clarity).
const { nodes, edges, start } = input;
const adj = Object.fromEntries(nodes.map(n => [n, []]));
for (const [a, b, w] of edges) { adj[a].push([b, w]); adj[b].push([a, w]); }

const inTree = new Set([start]);
const treeEdges = new Set();

function frame(currentEdge, caption) {
  step({
    nodes: nodes.map(n => ({
      id: n, label: n,
      state: inTree.has(n) ? 'done' : adj[n].some(([v]) => inTree.has(v)) ? 'frontier' : undefined,
    })),
    edges: edges.map(([a, b, w]) => ({
      a, b, w,
      state: treeEdges.has(\`\${a}-\${b}\`)
        ? 'done'
        : (currentEdge && a === currentEdge[0] && b === currentEdge[1] ? 'current' : undefined),
    })),
  }, caption);
}

frame(null, \`Seed tree with \${start}\`);

while (inTree.size < nodes.length) {
  let best = null, bestW = Infinity, bestU = null;
  for (const u of inTree) {
    for (const [v, w] of adj[u]) {
      if (inTree.has(v)) continue;
      if (w < bestW) { bestW = w; bestU = u; best = v; }
    }
  }
  if (best == null) { frame(null, 'Graph disconnected'); break; }
  const edgeKey = edges.find(([a, b]) => (a === bestU && b === best) || (a === best && b === bestU));
  frame(edgeKey, \`Cheapest crossing edge: \${bestU}-\${best} (w=\${bestW})\`);
  treeEdges.add(\`\${edgeKey[0]}-\${edgeKey[1]}\`);
  inTree.add(best);
  frame(null, \`Absorb \${best} into the tree\`);
}
frame(null, 'MST complete');
log('tree edges', [...treeEdges]);
`};r["topological-sort-kahn"]={title:"Kahn's topological sort",description:"Emit any in-degree-0 vertex, decrement its out-neighbours, repeat until the graph drains.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","C"],["B","C"],["B","D"],["C","E"],["D","E"],["E","F"]]},stateHint:"// GraphRenderer frame. State: 'done' emitted, 'frontier' in queue, 'current' being processed.",initialCode:`// Kahn's algorithm. Directed edges a → b.
const { nodes, edges } = input;
const indeg = Object.fromEntries(nodes.map(n => [n, 0]));
const out = Object.fromEntries(nodes.map(n => [n, []]));
for (const [a, b] of edges) { out[a].push(b); indeg[b]++; }

const order = [];
const queue = nodes.filter(n => indeg[n] === 0);

function frame(current, caption) {
  step({
    nodes: nodes.map(n => ({
      id: n, label: \`\${n}\\nin=\${indeg[n]}\`,
      state: n === current ? 'current'
        : order.includes(n) ? 'done'
        : queue.includes(n) ? 'frontier' : undefined,
    })),
    edges: edges.map(([a, b]) => ({ a, b })),
  }, caption);
}

frame(null, \`Init queue with in-degree-0 nodes: [\${queue.join(', ')}]\`);

while (queue.length) {
  const u = queue.shift();
  order.push(u);
  frame(u, \`Emit \${u}\`);
  for (const v of out[u]) {
    indeg[v]--;
    frame(u, \`Decrement in-degree of \${v} → \${indeg[v]}\`);
    if (indeg[v] === 0) {
      queue.push(v);
      frame(u, \`\${v} now has in-degree 0; enqueue\`);
    }
  }
}
frame(null, order.length === nodes.length
  ? \`Topological order: \${order.join(' → ')}\`
  : 'Cycle detected — not all nodes emitted');
log('order', order);
`};r["floyd-cycle-detection"]={title:"Floyd's cycle detection",description:"Tortoise steps 1, hare steps 2. They meet inside the cycle — or the hare hits null first.",renderer:"array",initialInput:{values:[3,7,4,5,9,2,6,8],cycleStart:3},stateHint:"// ArrayBarRenderer frame: highlights mark slow (low) and fast (high). Treat cycleStart=-1 as no cycle.",initialCode:`// Floyd's tortoise-and-hare. The list is modelled as an array of values
// where cycleStart says which index the tail loops back to (-1 for none).
const { values, cycleStart } = input;
const n = values.length;
const nextIdx = (i) => (i === n - 1 && cycleStart >= 0) ? cycleStart : (i + 1 < n ? i + 1 : -1);

let slow = 0, fast = 0;
step({ array: values, highlights: { [slow]: 'low', [fast]: 'high' } },
  \`Init slow=\${slow}, fast=\${fast}\`);

let meetIdx = -1;
for (let s = 0; s < n * 3; s++) {
  slow = nextIdx(slow);
  fast = nextIdx(fast);
  if (fast === -1) {
    step({ array: values, highlights: { [slow]: 'low' } }, 'Hare hit null — no cycle');
    log('no cycle');
    return;
  }
  fast = nextIdx(fast);
  if (fast === -1) {
    step({ array: values, highlights: { [slow]: 'low' } }, 'Hare hit null — no cycle');
    log('no cycle');
    return;
  }
  step({ array: values, highlights: { [slow]: 'low', [fast]: 'high' } },
    \`Advance: slow → \${slow}, fast → \${fast}\`);
  if (slow === fast) { meetIdx = slow; break; }
}

if (meetIdx === -1) {
  step({ array: values, highlights: {} }, 'Search limit exceeded');
  return;
}

step({ array: values, highlights: { [meetIdx]: 'match' } },
  \`Meet inside the cycle at index \${meetIdx}\`);

let a = 0, b = meetIdx;
while (a !== b) {
  a = nextIdx(a);
  b = nextIdx(b);
  step({ array: values, highlights: { [a]: 'low', [b]: 'high' } },
    \`Walk in lockstep: a=\${a}, b=\${b}\`);
}
step({ array: values, highlights: { [a]: 'match' } },
  \`Cycle entry at index \${a}\`);
log('cycle entry', a);
`};r["kmp-pattern-matching"]={title:"KMP pattern matching",description:"Precompute the failure function, then scan the text without ever rewinding.",renderer:"array",initialInput:{text:"abxabcabcaby",pattern:"abcaby"},stateHint:"// ArrayBarRenderer frame over text chars (tile mode). highlights mark i (high) and i-j+1 alignment.",initialCode:`// KMP. Build LPS, then match.
const { text, pattern } = input;
const m = pattern.length, n = text.length;

const lps = new Array(m).fill(0);
let len = 0;
step({ array: pattern.split(''), highlights: {} }, 'Build LPS for the pattern');
for (let i = 1; i < m; ) {
  if (pattern[i] === pattern[len]) {
    len++;
    lps[i] = len;
    step({ array: pattern.split(''), highlights: { [i]: 'match', [len - 1]: 'low' } },
      \`pattern[\${i}] matches pattern[\${len - 1}]; lps[\${i}] = \${len}\`);
    i++;
  } else if (len > 0) {
    step({ array: pattern.split(''), highlights: { [i]: 'high', [len - 1]: 'low' } },
      \`Mismatch — fall back via lps[\${len - 1}] = \${lps[len - 1]}\`);
    len = lps[len - 1];
  } else {
    lps[i] = 0;
    step({ array: pattern.split(''), highlights: { [i]: 'high' } },
      \`No prefix match; lps[\${i}] = 0\`);
    i++;
  }
}

step({ array: text.split(''), highlights: {} }, \`LPS = [\${lps.join(', ')}]. Begin scan.\`);

let i = 0, j = 0;
while (i < n) {
  step({ array: text.split(''), highlights: { [i]: 'high', [i - j]: 'low' } },
    \`Align pattern at \${i - j}; compare text[\${i}]='\${text[i]}' vs pattern[\${j}]='\${pattern[j]}'\`);
  if (text[i] === pattern[j]) {
    i++; j++;
    if (j === m) {
      const hl = {};
      for (let k = i - m; k < i; k++) hl[k] = 'match';
      step({ array: text.split(''), highlights: hl },
        \`Match at index \${i - m}\`);
      log('match at', i - m);
      j = lps[j - 1];
    }
  } else if (j > 0) {
    j = lps[j - 1];
  } else {
    i++;
  }
}
`};r["rabin-karp"]={title:"Rabin-Karp rolling hash",description:"Maintain a rolling polynomial hash over a window; verify on hash hits.",renderer:"array",initialInput:{text:"abracadabra",pattern:"cad",base:31,mod:1000000007},stateHint:"// ArrayBarRenderer over text chars. highlights mark the active window.",initialCode:`// Rabin-Karp with a polynomial rolling hash.
const { text, pattern, base, mod } = input;
const n = text.length, m = pattern.length;
const code = (ch) => ch.charCodeAt(0);

let basePow = 1;
for (let k = 0; k < m - 1; k++) basePow = (basePow * base) % mod;

let patHash = 0, winHash = 0;
for (let k = 0; k < m; k++) {
  patHash = (patHash * base + code(pattern[k])) % mod;
  winHash = (winHash * base + code(text[k])) % mod;
}

const hl = (l, r, role) => {
  const o = {};
  for (let k = l; k <= r; k++) o[k] = role;
  return o;
};

step({ array: text.split(''), highlights: hl(0, m - 1, 'mid') },
  \`Pattern hash = \${patHash}; first window hash = \${winHash}\`);

for (let i = 0; i <= n - m; i++) {
  if (winHash === patHash) {
    let ok = true;
    for (let k = 0; k < m; k++) if (text[i + k] !== pattern[k]) { ok = false; break; }
    if (ok) {
      step({ array: text.split(''), highlights: hl(i, i + m - 1, 'match') },
        \`Hash hit AND chars match at index \${i}\`);
      log('match at', i);
    } else {
      step({ array: text.split(''), highlights: hl(i, i + m - 1, 'high') },
        \`Hash hit at \${i} but chars differ — spurious\`);
    }
  } else {
    step({ array: text.split(''), highlights: hl(i, i + m - 1, 'low') },
      \`Window hash \${winHash} ≠ \${patHash}; slide\`);
  }
  if (i < n - m) {
    winHash = ((winHash - code(text[i]) * basePow) * base + code(text[i + m])) % mod;
    if (winHash < 0) winHash += mod;
  }
}
`};r["trie-insert"]={title:"Trie insertion",description:"Walk character by character, creating children on first visit. End-of-word marks the terminal node.",renderer:"tree",initialInput:{words:["cat","car","cart","do","dog"]},stateHint:`// TreeRenderer frame: { tree: { value, state?, left, right } }
// Trie is projected via left-child / right-sibling so multi-way children fit a binary layout.`,initialCode:`// Build a trie one word at a time. The renderer is binary, so we project
// each node's children using the left-child / right-sibling convention:
//   .left  → first child
//   .right → next sibling at the same level
const { words } = input;
const root = { ch: '*', kids: {}, end: false };

function project(node, currentPath, nextSibling) {
  const childKeys = Object.keys(node.kids).sort();
  let firstChild = null;
  for (let i = childKeys.length - 1; i >= 0; i--) {
    const childNode = node.kids[childKeys[i]];
    firstChild = project(childNode, currentPath, firstChild);
  }
  return {
    value: node.ch + (node.end ? '$' : ''),
    state: currentPath.includes(node) ? 'current' : node.end ? 'visited' : undefined,
    left: firstChild,
    right: nextSibling,
  };
}

function snap(currentPath, caption) {
  step({ tree: project(root, currentPath, null) }, caption);
}

snap([root], 'Empty trie — only the * root sentinel');

for (const word of words) {
  let cur = root;
  const path = [cur];
  snap(path, \`Insert "\${word}": start at root\`);
  for (const ch of word) {
    if (!cur.kids[ch]) {
      cur.kids[ch] = { ch, kids: {}, end: false };
      path.push(cur.kids[ch]);
      snap(path, \`Create child '\${ch}' under '\${cur.ch}'\`);
    } else {
      path.push(cur.kids[ch]);
      snap(path, \`Walk into existing child '\${ch}'\`);
    }
    cur = cur.kids[ch];
  }
  cur.end = true;
  snap(path, \`Mark '\${cur.ch}' as end of word\`);
}
snap([], 'Trie built');
`};r["segment-tree-build"]={title:"Segment tree build (sum)",description:"Recursively partition the range; each parent holds the sum of its two children.",renderer:"array",initialInput:{array:[2,1,5,3,4,7,2,6]},stateHint:"// ArrayBarRenderer frame over the segment-tree storage (4n long, 1-indexed).",initialCode:`// Build a sum segment tree stored as a 1-indexed array of length 4n.
const { array } = input;
const n = array.length;
const tree = new Array(4 * n).fill(0);

function build(node, l, r) {
  if (l === r) {
    tree[node] = array[l];
    step({ array: [...tree], highlights: { [node]: 'match' } },
      \`Leaf node \${node} covers [\${l},\${l}] = \${array[l]}\`);
    return;
  }
  const mid = (l + r) >> 1;
  step({ array: [...tree], highlights: { [node]: 'mid' } },
    \`Visit node \${node} covering [\${l},\${r}]; split at \${mid}\`);
  build(2 * node, l, mid);
  build(2 * node + 1, mid + 1, r);
  tree[node] = tree[2 * node] + tree[2 * node + 1];
  step({ array: [...tree], highlights: { [node]: 'match', [2 * node]: 'low', [2 * node + 1]: 'high' } },
    \`Combine: tree[\${node}] = \${tree[2 * node]} + \${tree[2 * node + 1]} = \${tree[node]}\`);
}

step({ array: [...tree], highlights: {} }, \`Empty tree (length \${tree.length}). Begin build.\`);
build(1, 0, n - 1);
step({ array: [...tree], highlights: { [1]: 'match' } },
  \`Root = \${tree[1]} = sum of whole input\`);
log('tree', tree);
`};r["fenwick-prefix-sum"]={title:"Fenwick tree prefix sums",description:"Binary-indexed tree updates climb via i += i & -i; prefix queries descend via i -= i & -i.",renderer:"array",initialInput:{array:[3,2,5,1,4,6,2,8],queries:[["prefix",5],["update",2,3],["prefix",5],["prefix",7]]},stateHint:"// ArrayBarRenderer frame over the BIT (1-indexed). highlights mark touched indices.",initialCode:`// Fenwick tree. BIT is 1-indexed; bit[0] unused.
const { array, queries } = input;
const n = array.length;
const bit = new Array(n + 1).fill(0);

function update(i, delta, label) {
  const touched = [];
  for (let k = i; k <= n; k += k & -k) {
    bit[k] += delta;
    touched.push(k);
    step({ array: [...bit], highlights: Object.fromEntries(touched.map(x => [x, 'mid'])) },
      \`\${label}: bit[\${k}] += \${delta} → \${bit[k]}\`);
  }
}

function prefix(i) {
  let sum = 0;
  const touched = [];
  for (let k = i; k > 0; k -= k & -k) {
    sum += bit[k];
    touched.push(k);
    step({ array: [...bit], highlights: Object.fromEntries(touched.map(x => [x, 'low'])) },
      \`prefix(\${i}): add bit[\${k}] = \${bit[k]}; running sum = \${sum}\`);
  }
  step({ array: [...bit], highlights: Object.fromEntries(touched.map(x => [x, 'match'])) },
    \`prefix(\${i}) = \${sum}\`);
  return sum;
}

step({ array: [...bit], highlights: {} }, 'Empty BIT. Seed by pointwise updates.');
for (let i = 0; i < n; i++) update(i + 1, array[i], \`Seed index \${i + 1} (value \${array[i]})\`);

for (const q of queries) {
  if (q[0] === 'prefix') prefix(q[1]);
  else update(q[1], q[2], \`update(+\${q[2]} at \${q[1]})\`);
}
log('bit', bit);
`};r["bst-insert"]={title:"BST insertion",description:"Compare with the current node; go left if smaller, right if larger. Insert at the first empty slot.",renderer:"tree",initialInput:{values:[50,30,70,20,40,60,80,35,75]},stateHint:"// TreeRenderer frame: { tree: recursive { value, left, right, state? } }",initialCode:`// Build a BST by repeated insertion.
const { values } = input;
let root = null;

function project(node, path) {
  if (!node) return null;
  return {
    value: node.value,
    state: path.includes(node)
      ? (node === path[path.length - 1] ? 'current' : 'visited')
      : undefined,
    left: project(node.left, path),
    right: project(node.right, path),
  };
}

function snap(path, caption) {
  step({ tree: root ? project(root, path) : { value: '∅', left: null, right: null } }, caption);
}

snap([], 'Empty BST');

for (const v of values) {
  if (!root) {
    root = { value: v, left: null, right: null };
    snap([root], \`Insert \${v} as root\`);
    continue;
  }
  let cur = root;
  const path = [cur];
  snap(path, \`Insert \${v}: start at root \${cur.value}\`);
  while (true) {
    if (v < cur.value) {
      snap(path, \`\${v} < \${cur.value} → go left\`);
      if (!cur.left) {
        cur.left = { value: v, left: null, right: null };
        path.push(cur.left);
        snap(path, \`Left slot empty — insert \${v} here\`);
        break;
      }
      cur = cur.left;
      path.push(cur);
    } else {
      snap(path, \`\${v} ≥ \${cur.value} → go right\`);
      if (!cur.right) {
        cur.right = { value: v, left: null, right: null };
        path.push(cur.right);
        snap(path, \`Right slot empty — insert \${v} here\`);
        break;
      }
      cur = cur.right;
      path.push(cur);
    }
  }
}
`};r["bst-search"]={title:"BST search",description:"Halve the search at every level: left if smaller, right if larger. O(log n) on a balanced tree.",renderer:"tree",initialInput:{structure:[50,30,70,20,40,60,80,35,45,75],target:45},stateHint:"// TreeRenderer frame. Path nodes marked 'visited', the cursor 'current', match 'done'.",initialCode:`// Build a BST from a level-order-ish insertion list, then search.
const { structure, target } = input;
let root = null;
function insert(v) {
  if (!root) { root = { value: v, left: null, right: null }; return; }
  let cur = root;
  while (true) {
    if (v < cur.value) {
      if (!cur.left) { cur.left = { value: v, left: null, right: null }; return; }
      cur = cur.left;
    } else {
      if (!cur.right) { cur.right = { value: v, left: null, right: null }; return; }
      cur = cur.right;
    }
  }
}
for (const v of structure) insert(v);

function project(node, path, found) {
  if (!node) return null;
  let state;
  if (found && node === found) state = 'done';
  else if (node === path[path.length - 1]) state = 'current';
  else if (path.includes(node)) state = 'visited';
  return {
    value: node.value,
    state,
    left: project(node.left, path, found),
    right: project(node.right, path, found),
  };
}

function snap(path, found, caption) {
  step({ tree: project(root, path, found) }, caption);
}

snap([root], \`Searching for \${target}, start at root \${root.value}\`);
let cur = root;
const path = [cur];
while (cur) {
  if (cur.value === target) {
    snap(path, cur, \`Found \${target} at depth \${path.length - 1}\`);
    log('found at depth', path.length - 1);
    return;
  }
  if (target < cur.value) {
    snap(path, null, \`\${target} < \${cur.value} → go left\`);
    cur = cur.left;
  } else {
    snap(path, null, \`\${target} > \${cur.value} → go right\`);
    cur = cur.right;
  }
  if (cur) path.push(cur);
}
snap(path, null, \`\${target} not present\`);
log('not found');
`};r["bellman-ford"]={title:"Bellman-Ford shortest paths",description:"Relax every edge V-1 times. One more relaxation that succeeds proves a negative cycle.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E"],edges:[["A","B",6],["A","C",7],["B","C",8],["B","D",5],["B","E",-4],["C","D",-3],["C","E",9],["D","B",-2],["E","D",7]],source:"A"},stateHint:"// GraphRenderer frame, weighted directed edges. Node label embeds running distance.",initialCode:`// Bellman-Ford on a directed weighted graph (may include negative edges).
const { nodes, edges, source } = input;
const dist = Object.fromEntries(nodes.map(n => [n, n === source ? 0 : Infinity]));

function frame(activeEdge, caption) {
  step({
    nodes: nodes.map(n => ({
      id: n,
      label: \`\${n}\\n\${dist[n] === Infinity ? '∞' : dist[n]}\`,
      state: n === source ? 'done' : dist[n] !== Infinity ? 'frontier' : undefined,
    })),
    edges: edges.map(([a, b, w]) => ({
      a, b, w,
      state: activeEdge && a === activeEdge[0] && b === activeEdge[1] ? 'current' : undefined,
    })),
  }, caption);
}

frame(null, \`Init: dist[\${source}] = 0, all others ∞\`);

for (let pass = 1; pass < nodes.length; pass++) {
  let changed = false;
  for (const [u, v, w] of edges) {
    if (dist[u] === Infinity) continue;
    frame([u, v], \`Pass \${pass}: relax \${u}→\${v} (w=\${w})\`);
    if (dist[u] + w < dist[v]) {
      dist[v] = dist[u] + w;
      changed = true;
      frame([u, v], \`Update dist[\${v}] = \${dist[v]}\`);
    }
  }
  if (!changed) {
    frame(null, \`Pass \${pass} changed nothing — early exit\`);
    break;
  }
}

let negCycle = false;
for (const [u, v, w] of edges) {
  if (dist[u] !== Infinity && dist[u] + w < dist[v]) { negCycle = true; break; }
}
frame(null, negCycle
  ? 'Negative cycle reachable from source'
  : 'Distances finalized');
log('dist', dist);
`};r["floyd-warshall"]={title:"Floyd-Warshall all-pairs shortest paths",description:"For every intermediate vertex k, see if going i→k→j beats the current i→j distance.",renderer:"grid",initialInput:{nodes:["A","B","C","D"],edges:[["A","B",5],["A","D",10],["B","C",3],["C","D",1],["D","B",2]]},stateHint:`// NumberGridRenderer 2D frame: { grid: char[][], cellLabel }.
// Each cell uses a unique character so cellLabel can map it to the live distance.`,initialCode:`// Floyd-Warshall. The grid renderer styles cells by their character via the
// default mapping ('.', '#', 'S', 'O', '*'). We assign each cell a unique
// character so cellLabel can provide its current distance string.
const { nodes, edges } = input;
const n = nodes.length;
const idx = Object.fromEntries(nodes.map((v, i) => [v, i]));
const INF = Infinity;

const d = Array.from({ length: n }, (_, i) =>
  Array.from({ length: n }, (_, j) => i === j ? 0 : INF));
for (const [u, v, w] of edges) { d[idx[u]][idx[v]] = w; }

// 25 unique chars cover up to a 5x5 matrix; rotate the legend roles into them.
const cellChar = (i, j) => String.fromCharCode(0x41 + i * n + j);

function snap(active, rowK, colK, caption) {
  const grid = [];
  const cellLabel = {};
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const ch = cellChar(i, j);
      cellLabel[ch] = d[i][j] === INF ? '∞' : String(d[i][j]);
      row.push(ch);
    }
    grid.push(row);
  }
  // Overlay styling by replacing the active cell's char with a styled token.
  // The renderer's defaultMap recognises 'S' (current), 'O' (frontier), '#' (composite).
  if (active) {
    const [i, j] = active;
    grid[i][j] = 'S';
    cellLabel['S'] = d[i][j] === INF ? '∞' : String(d[i][j]);
  }
  if (rowK != null) {
    for (let j = 0; j < n; j++) {
      if (active && active[0] === rowK && active[1] === j) continue;
      grid[rowK][j] = 'O';
    }
    cellLabel['O'] = 'via k';
  }
  if (colK != null) {
    for (let i = 0; i < n; i++) {
      if (active && active[0] === i && active[1] === colK) continue;
      if (grid[i][colK] !== 'O') grid[i][colK] = 'O';
    }
  }
  step({ grid, cellLabel }, caption);
}

snap(null, null, null, 'Initial distance matrix. Diagonal = 0, missing edges = ∞.');

for (let k = 0; k < n; k++) {
  snap(null, k, k, \`Round k = \${nodes[k]}: try \${nodes[k]} as an intermediate stop\`);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (d[i][k] === INF || d[k][j] === INF) continue;
      if (d[i][k] + d[k][j] < d[i][j]) {
        d[i][j] = d[i][k] + d[k][j];
        snap([i, j], k, k,
          \`Relax d[\${nodes[i]}][\${nodes[j]}] via \${nodes[k]} → \${d[i][j]}\`);
      }
    }
  }
}
snap(null, null, null, 'All-pairs distances finalized');
log('dist matrix', d);
`};const O=r,Q=u.lazy(()=>D(()=>import("./InteractiveVisualizer-B3oViWIy.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]),import.meta.url)),$={"binary-search":"binary-search","bfs-dfs":"bfs","dfs-traversal":"dfs","dijkstras-algorithm":"dijkstra","two-pointers":"two-pointers","sliding-window":"sliding-window","quicksort-partition":"quicksort-partition","merge-sort":"merge-sort","kadanes-algorithm":"kadanes","bubble-sort":"bubble-sort","insertion-sort":"insertion-sort","selection-sort":"selection-sort","heap-sort":"heap-sort","union-find":"union-find","kruskals-mst":"kruskal-mst","topological-sort":"topological-sort-kahn","kahns-algorithm":"topological-sort-kahn","loop-detection":"floyd-cycle-detection",kmp:"kmp-pattern-matching","hash-rolling-rabin-karp":"rabin-karp","trie-insert":"trie-insert","segment-tree":"segment-tree-build","fenwick-tree":"fenwick-prefix-sum","bst-insertion":"bst-insert","bellman-ford":"bellman-ford","floyd-warshall":"floyd-warshall"},j={"a-star-search":{module:"graphs-shortest-paths",blurb:"Greedy best-first with a heuristic guiding relaxation toward the goal."},"aho-corasick":{module:"strings-matching",blurb:"Multi-pattern matching via a trie augmented with failure links."},"amortized-analysis":{module:"foundations-analysis",blurb:"Aggregate, accounting, potential — three lenses on average cost."},"array-cyclic-sort":{module:"arrays-pointers-windows",blurb:"Place each value at its index in one pass; O(n) for 1..n arrays."},"best-stock-multiple-tx":{module:"arrays-pointers-windows",blurb:"Greedy sum of every upward delta captures maximum profit."},"bellman-ford":{module:"graphs-shortest-paths",blurb:"V−1 relaxation passes find shortest paths even with negative edges."},"bellman-ford-detection":{module:"graphs",blurb:"Run V−1 relax passes, then one more; any further relaxation proves a negative cycle."},"bfs-dfs":{module:"trees",blurb:"Breadth-first traversal frontier expansion."},"binary-lifting-general":{module:"trees-advanced-queries",blurb:"Precompute 2^k jumps for O(log n) ancestor and path queries."},"binary-search":{module:"arrays-binary-search",blurb:"Halve the search space at every step."},"binary-search-on-answer":{module:"arrays-binary-search",blurb:"Binary-search a monotone predicate instead of a value."},"bipartite-check":{module:"graphs-traversal",blurb:"Two-color BFS detects odd cycles and proves bipartiteness."},"bit-dp":{module:"dp-advanced",blurb:"State as a subset bitmask; classic for travelling-salesman style DP."},"bloom-filter":{module:"cs-tools-encodings",blurb:'k hashes flip bits; queries say "definitely not" or "probably yes".'},"boyer-moore-majority":{module:"strings-matching",blurb:"Cancel pairs to find a strict majority element in O(n), O(1) space."},"bst-insertion":{module:"trees",blurb:"Walk left or right comparing the key; new node lands at the first null slot."},"bst-inorder":{module:"trees-traversal-bst",blurb:"Inorder walk visits BST keys in sorted order."},"bubble-sort":{module:null,blurb:"Adjacent compares + swaps. Canonical O(n²)."},"chinese-remainder":{module:"math-number-theory",blurb:"Stitch residues mod coprime moduli into a single residue."},"circuit-breaker":{module:"system-design",blurb:"Fail-fast state machine: CLOSED counts failures, OPEN short-circuits, HALF_OPEN probes for recovery."},"coin-change-variants":{module:"dp-classical",blurb:"Count ways or minimize coins via 1D DP over the amount axis."},"consistent-hashing":{module:"system-design",blurb:"Place servers + keys on a hash ring; removing a node only reshuffles its arc of keys."},"convex-hull-trick":{module:"dp",blurb:"Maintain the lower envelope of m·x+b lines; min queries become O(1) amortised."},"coordinate-compression":{module:"foundations-patterns",blurb:"Replace sparse coordinates with their sorted ranks."},"counting-inversions":{module:"sorting-strings",blurb:"Merge-sort piggybacks on its merge step to count out-of-order pairs."},"cuckoo-hashing":{module:"hashing",blurb:"Two tables, two hash functions. Inserts displace residents until everyone finds a home."},"cycle-detection-graph":{module:"graphs-traversal",blurb:"DFS colors detect back-edges that close a cycle."},"dfs-iterative":{module:"graphs-traversal",blurb:"Explicit stack replays recursive DFS without blowing the call stack."},"dfs-traversal":{module:"graphs",blurb:"Stack-based DFS expansion with spanning-tree edges highlighted."},"digit-dp":{module:"dp-advanced",blurb:"Walk number digits with tight/loose state to count constrained integers."},"dijkstra-pq":{module:"graphs-shortest-paths",blurb:"Min-heap version of Dijkstra runs in O((V+E) log V)."},"dijkstras-algorithm":{module:"graphs",blurb:"Shortest paths from source with relaxation, distance labels live."},"disjoint-set-rank":{module:"graphs-union-find",blurb:"Union by rank keeps the DSU forest near-flat."},"dp-coin-change-min-coins":{module:"dp-classical",blurb:"Fill dp[amount] = min over coins of dp[amount−coin] + 1."},"dp-edit-distance-levenshtein":{module:"dp-classical",blurb:"Insert, delete, substitute — minimum operations between two strings."},"dp-knapsack-bounded-unbounded":{module:"dp-classical",blurb:"Two table orientations switch between 0/1 and unbounded knapsack."},"dp-on-trees":{module:"trees-advanced-queries",blurb:"Post-order combines children answers into parents."},"dsu-on-tree":{module:"trees-advanced-queries",blurb:"Small-to-large merging answers subtree queries in O(n log n)."},"dutch-national-flag":{module:"arrays-pointers-windows",blurb:"Three-way partition sorts {0,1,2} arrays in one pass."},"euclidean-gcd":{module:"math-number-theory",blurb:"gcd(a,b) = gcd(b, a mod b) — terminates in O(log min)."},"euler-tour-tree":{module:"trees-advanced-queries",blurb:"Flatten a tree into an array so subtrees become contiguous ranges."},"fenwick-tree":{module:"trees-advanced-queries",blurb:"Binary-indexed tree gives O(log n) prefix sums and point updates."},"fft-basics":{module:"math-geom-sampling",blurb:"Divide-and-conquer evaluation of polynomials at roots of unity."},"fibonacci-recursion":{module:null,blurb:"See the exponential call tree of naive fib — and why memoization collapses it."},"find-peak-element":{module:"arrays-binary-search",blurb:"Binary-search the half whose neighbour rises — a peak must live there."},"floyd-warshall":{module:"graphs-shortest-paths",blurb:"Triple loop relaxes through every intermediate vertex."},"gale-shapley":{module:"graphs-advanced",blurb:"Stable matching via deferred-acceptance proposals."},"gas-station-circular":{module:"arrays-pointers-windows",blurb:"Greedy linear scan finds the start index for the circular tour."},"hash-collision":{module:null,blurb:"Bars = bucket length. Watch collisions cluster, then notice when resizing would kick in."},"hash-rolling-rabin-karp":{module:"strings-matching",blurb:"Roll a polynomial hash window to find substring matches in O(n+m)."},"heap-sort":{module:"heaps",blurb:"Sift-down on a max-heap array, parent ↔ larger child."},"heavy-light-decomposition":{module:"trees-advanced-queries",blurb:"Chain heavy edges so path queries hit at most O(log n) segments."},"hopcroft-karp":{module:"graphs-advanced",blurb:"BFS layers + DFS augmenting paths give O(E√V) bipartite matching."},"huffman-coding":{module:"strings-matching",blurb:"Greedy merge of lowest-frequency nodes builds an optimal prefix code."},"insertion-sort":{module:null,blurb:"Bubble each new element backward into the sorted prefix."},"interval-merge":{module:"arrays-range-structures",blurb:"Sort by start, then sweep merging any overlap with the running interval."},"island-count-bfs":{module:"graphs-traversal",blurb:"BFS floods each unvisited land cell to count grid components."},"jump-game-i-ii":{module:"arrays-pointers-windows",blurb:"Greedy reach tracking solves can-jump and min-jumps in O(n)."},"kadanes-algorithm":{module:"dp",blurb:"Maximum subarray sum, single linear pass."},"kahns-algorithm":{module:"graphs",blurb:"Topological sort via BFS: emit any in-degree-0 node, decrement its out-neighbours, repeat."},kmp:{module:"strings-matching",blurb:"Failure function skips redundant comparisons for O(n+m) matching."},"kruskals-mst":{module:"graphs-mst",blurb:"Sort edges, add the cheapest that does not close a cycle via DSU."},"kth-smallest-bst":{module:"trees-traversal-bst",blurb:"Inorder traversal stops at the k-th visited node."},"largest-rectangle-histogram":{module:"stacks-queues",blurb:"Monotonic stack of indices finds the maximal-area rectangle in O(n)."},"lca-binary-lifting":{module:"trees-advanced-queries",blurb:"Precomputed jumps answer lowest-common-ancestor queries in O(log n)."},"linear-vs-binary":{module:"arrays-binary-search",blurb:"Side-by-side: linear scan vs binary halving on the same sorted array."},"longest-common-subseq":{module:"dp",blurb:"Match → diagonal+1, mismatch → max(up, left). Classic 2D DP."},"longest-increasing-subseq":{module:"dp-classical",blurb:"Patience-sorting piles give the LIS length in O(n log n)."},"loop-detection":{module:"linked-lists",blurb:"Floyd's tortoise-and-hare cycle detection."},"lru-cache":{module:"cs-tools-encodings",blurb:"Hashmap + doubly-linked list give O(1) get and put with LRU eviction."},"lru-cache-design":{module:"hashing",blurb:"Hashmap for O(1) lookup, doubly-linked list for O(1) reorder; tail is the eviction victim."},"manachers-algorithm":{module:"strings-matching",blurb:"Find every palindromic substring in linear time using mirror reuse."},"matrix-exponentiation":{module:"math-number-theory",blurb:"Fast-power a transition matrix to leap linear recurrences in O(log n)."},"max-flow":{module:"graphs-advanced",blurb:"Ford-Fulkerson pushes flow along augmenting paths in the residual graph."},"merge-sort":{module:null,blurb:"The merge step: take from the smaller head of two sorted halves until both drain."},"merkle-tree":{module:"system-design",blurb:"Hash-pair upward to a single root; verify any block in O(log n) with a sibling-hash path."},"min-stack":{module:"stacks-queues",blurb:"Auxiliary stack of running minima makes getMin O(1)."},"monotonic-deque":{module:"stacks-queues",blurb:"Decreasing deque of indices answers window-max queries in O(1) amortised."},"monotonic-stack":{module:"stacks-queues",blurb:"Strictly increasing stack of indices; each element is pushed and popped at most once."},"morris-traversal":{module:"trees-traversal-bst",blurb:"Thread predecessor links so inorder walks run in O(1) space."},"mos-algorithm":{module:"arrays-range-structures",blurb:"Block-sorted offline queries amortise to O((n+q)√n)."},"mst-kruskal":{module:"graphs-mst",blurb:"Sorted edges plus union-find build the minimum spanning tree."},"n-queens":{module:"recursion-bt",blurb:"Backtracking places queens column by column, pruning attacked squares."},"next-greater-element":{module:"stacks-queues",blurb:"Right-to-left monotonic stack answers every next-greater query in O(n)."},"paxos-basics":{module:"system-design",blurb:"Two phases — Prepare/Promise then Accept/Accepted — over a quorum of acceptors."},"prefix-sum":{module:"arrays-range-structures",blurb:"O(n) preprocessing for O(1) range-sum queries."},"queue-ops":{module:"stacks-queues",blurb:"Enqueue at the back, dequeue from the front. FIFO in motion."},quickhull:{module:"math-geom-sampling",blurb:"Divide-and-conquer picks the farthest point off each hull edge."},quickselect:{module:"sorting-strings",blurb:"Partition like quicksort, recurse only on the side containing the answer."},"quicksort-partition":{module:null,blurb:"Lomuto partition: pivot, swap, place."},"radix-tree":{module:"cs-tools-encodings",blurb:"Compressed trie collapses single-child chains into edge labels."},"raft-consensus":{module:"system-design",blurb:"Leader heartbeats keep followers calm; one timeout fires, election runs, new leader takes term+1."},"random-shuffle-fisher-yates":{module:"math-geom-sampling",blurb:"Swap each index with a random later index for a uniform permutation."},"reservoir-sampling":{module:"math-geom-sampling",blurb:"Pick k uniform samples from a stream of unknown length in one pass."},"segment-tree":{module:"trees-advanced-queries",blurb:"Recursive halves answer range queries and point updates in O(log n)."},"segment-tree-beats":{module:"trees-advanced-queries",blurb:"Tag each node with second-max to support chmin / chmax range updates."},"segment-tree-lazy":{module:"trees-advanced-queries",blurb:"Lazy propagation pushes pending range updates only when needed."},"segment-tree-on-intervals":{module:"trees-advanced-queries",blurb:"Index by interval endpoints to answer overlap and stabbing queries."},"segment-tree-persistent":{module:"trees-advanced-queries",blurb:"Each update clones a thin O(log n) path, preserving every version."},"selection-sort":{module:null,blurb:"Find min of remaining, swap into place. At most n−1 swaps."},"sieve-of-eratosthenes":{module:"math",blurb:"All primes up to N by crossing out multiples."},"sliding-window":{module:"arrays-pointers-windows",blurb:"Longest substring without repeating chars."},"sliding-window-max":{module:"arrays-pointers-windows",blurb:"Monotonic-decreasing deque keeps the window max at the front in O(n)."},"sparse-table":{module:"trees-advanced-queries",blurb:"Precompute idempotent range queries for O(1) lookups after O(n log n) prep."},"stack-ops":{module:"stacks-queues",blurb:"Push, pop, peek — LIFO semantics in motion."},"string-edit-distance":{module:"strings-matching",blurb:"DP table of insert / delete / substitute costs between two strings."},"string-hashing":{module:"strings-matching",blurb:"Polynomial hashes give O(1) substring comparison after O(n) prep."},"string-min-window-substring":{module:"strings-matching",blurb:"Sliding window plus a need-count hash finds the smallest covering window."},"subarray-product-less-k":{module:"arrays-pointers-windows",blurb:"Shrink the window whenever the running product hits k."},"subarray-sum-equals-k":{module:"arrays-range-structures",blurb:"Prefix-sum hashmap counts subarrays that sum to k in O(n)."},"suffix-array":{module:"strings-advanced",blurb:"Sorted suffix indices enable O(log n) substring search."},"suffix-automaton":{module:"strings-advanced",blurb:"Minimal DFA accepting every substring; linear-size index of a string."},"sweep-line":{module:"math-geom-sampling",blurb:"Process events in x-order to count overlaps or intersections."},"ternary-search":{module:"math-geom-sampling",blurb:"Trisect a unimodal range to find its extremum in O(log n)."},"topological-sort":{module:"graphs",blurb:"Kahn's algorithm: repeatedly remove 0-in-degree nodes."},treap:{module:"trees-balanced-disk",blurb:"Random priorities + BST keys keep heights logarithmic in expectation."},"tree-diameter":{module:"trees-traversal-bst",blurb:"Two BFS passes from opposite ends find the longest path."},"tree-right-side-view":{module:"trees-traversal-bst",blurb:"Level-order traversal records the rightmost node of each depth."},"trie-autocomplete":{module:"cs-tools-encodings",blurb:"Walk to the prefix node, then DFS the subtree for completions."},"trie-insert":{module:null,blurb:"Insert characters one by one; share prefixes; mark word ends."},"two-pointers":{module:"arrays-pointers-windows",blurb:"Pair sum on a sorted array, O(n)."},"two-sat":{module:"graphs-advanced",blurb:"Implication graph + SCCs decide 2-SAT formulas in linear time."},"union-find":{module:"graphs",blurb:"Disjoint-set forest with path compression. Depth bars shrink as queries flatten the trees."},"unique-paths-grid":{module:"dp-classical",blurb:"2D DP counts lattice paths under blocked-cell constraints."},"validate-bst":{module:"trees-traversal-bst",blurb:"Carry min/max bounds down each recursion to verify BST order."},"word-ladder-bfs":{module:"graphs-traversal",blurb:"BFS over one-letter transformations finds the shortest word chain."},"xor-tricks":{module:"bitwise",blurb:"XOR pairs cancel — single-number and missing-number tricks fall out."},"z-algorithm":{module:"strings-matching",blurb:"Z-array gives substring matches and palindrome work in linear time."},"zero-one-bfs":{module:"graphs-shortest-paths",blurb:"Deque BFS handles 0/1-weighted graphs in O(V+E)."},"zero-one-knapsack":{module:"dp",blurb:"Fill the n×W table row by row; final cell is the optimal value."}};function E(a){if(Array.isArray(a==null?void 0:a.frames))return a.frames.length;const s=a==null?void 0:a.cases;return Array.isArray(s)&&s[0]&&Array.isArray(s[0].frames)?s[0].frames.length:0}function X(a,s){var l;const d=(l=S[a])==null?void 0:l.renderer;return d==="graph"?e.jsx(R,{frame:s}):d==="window"?e.jsx(P,{frame:s}):d==="grid"?e.jsx(z,{frame:s}):d==="tree"?e.jsx(H,{frame:s}):e.jsx(L,{frame:s})}function J(){const{slug:a}=K(),[s,d]=u.useState("walkthrough");if(u.useEffect(()=>{a&&M("viz",a),d("walkthrough")},[a]),a){const l=S[a];if(!l)return e.jsxs("div",{className:"learn-container",children:[e.jsxs("div",{className:"learn-header",children:[e.jsx("h1",{className:"learn-title",children:"Not found"}),e.jsxs("p",{className:"learn-sub",children:['No visualization exists for "',a,'".']})]}),e.jsx("div",{className:"learn-breadcrumbs",children:e.jsx(w,{to:"/visualize",children:"All visualizations"})})]});const p=j[a]||{},f=$[a],y=!!(f&&O[f]);return e.jsxs("div",{className:"learn-container",children:[e.jsxs("div",{className:"learn-breadcrumbs",children:[e.jsx(w,{to:"/visualize",children:"Visualizations"}),e.jsx("span",{children:"/"}),e.jsx("span",{children:l.title})]}),e.jsxs("div",{className:"learn-header",children:[e.jsx("h1",{className:"learn-title",children:l.title}),p.blurb&&e.jsx("p",{className:"learn-sub",children:p.blurb}),y&&e.jsxs("div",{className:"viz-mode-tabs",role:"tablist","aria-label":"Visualization mode",children:[e.jsxs("button",{type:"button",role:"tab","aria-selected":s==="walkthrough",className:`viz-mode-tab${s==="walkthrough"?" active":""}`,onClick:()=>d("walkthrough"),children:[e.jsx(G,{size:13})," Walkthrough"]}),e.jsxs("button",{type:"button",role:"tab","aria-selected":s==="interactive",className:`viz-mode-tab${s==="interactive"?" active":""}`,onClick:()=>d("interactive"),children:[e.jsx(q,{size:13})," Interactive"]})]})]}),s==="walkthrough"&&e.jsx(F,{frames:l.frames,cases:l.cases,build:l.build,inputSchema:l.inputSchema,render:g=>X(a,g),autoPlay:!0}),s==="interactive"&&y&&e.jsx(u.Suspense,{fallback:e.jsx("div",{style:{padding:"2rem",textAlign:"center",color:"var(--text-dim)"},children:"Loading editor…"}),children:e.jsx(Q,{slug:f})}),p.module&&e.jsxs("p",{style:{marginTop:"1.25rem",fontFamily:"var(--mono)",fontSize:"0.75rem",color:"var(--text-dim)"},children:["See the full concept page —"," ",e.jsxs(w,{to:`/learn/${p.module}/${a}`,style:{color:"var(--accent)"},children:["/learn/",p.module,"/",a," ",e.jsx(T,{size:12,style:{verticalAlign:"middle"}})]})]})]})}return e.jsx(Z,{})}const x={"arrays-searching":"Arrays & Searching","arrays-binary-search":"Binary Search","arrays-counting-select":"Counting & Selection","arrays-pointers-windows":"Two Pointers & Sliding Window","arrays-range-structures":"Range Structures",bitwise:"Bitwise","cs-core":"CS Core","cs-db-transactions":"Databases & Transactions","cs-network-protocols":"Network Protocols","cs-os-concurrency":"OS & Concurrency","cs-tools-encodings":"Tools & Encodings",dp:"Dynamic Programming","dp-advanced":"Dynamic Programming — Advanced","dp-classical":"Dynamic Programming — Classical",foundations:"Foundations","foundations-analysis":"Foundations — Analysis","foundations-patterns":"Foundations — Patterns",graphs:"Graphs","graphs-advanced":"Graphs — Advanced","graphs-flow-grids":"Graphs — Flow & Grids","graphs-mst":"Graphs — MST","graphs-shortest-paths":"Graphs — Shortest Paths","graphs-traversal":"Graphs — Traversal","graphs-union-find":"Graphs — Union-Find",greedy:"Greedy",hashing:"Hashing",heaps:"Heaps","linked-lists":"Linked Lists",math:"Math","math-geom-sampling":"Math — Geometry & Sampling","math-number-theory":"Math — Number Theory","recursion-bt":"Recursion & Backtracking","sorting-strings":"Sorting & Strings","stacks-queues":"Stacks & Queues","strings-advanced":"Strings — Advanced","strings-matching":"Strings — Pattern Matching","system-design":"System Design",trees:"Trees","trees-advanced-queries":"Trees — Advanced Queries","trees-balanced-disk":"Balanced & Disk-backed Trees","trees-traversal-bst":"Trees & BST",other:"Other"},b=["var(--hue-violet)","var(--hue-sky)","var(--hue-pink)","var(--hue-mint)"];function Z(){const[a,s]=u.useState(""),[d,l]=u.useState(null),p=u.useRef(null),{groups:f,orderedKeys:y}=u.useMemo(()=>{var o;const t=Object.entries(S),i={};for(const[c,m]of t){const k=((o=j[c])==null?void 0:o.module)||"other";i[k]||(i[k]=[]),i[k].push([c,m])}const n=Object.keys(x).filter(c=>{var m;return(m=i[c])==null?void 0:m.length});return{groups:i,orderedKeys:n}},[]),g=a.trim().toLowerCase(),v=u.useMemo(()=>{if(!g)return f;const t={};for(const i of y){const n=f[i].filter(([o,c])=>{var A;const m=(((A=j[o])==null?void 0:A.blurb)||"").toLowerCase();return(c.title||"").toLowerCase().includes(g)||m.includes(g)||o.includes(g)});n.length&&(t[i]=n)}return t},[g,f,y]),h=u.useMemo(()=>y.filter(t=>{var i;return(i=v[t])==null?void 0:i.length}),[y,v]),I=h.reduce((t,i)=>t+v[i].length,0),N=h.join("|"),C=d&&h.includes(d)?d:h[0]||null;u.useEffect(()=>{if(!h.length)return;const t=new IntersectionObserver(i=>{const n=i.filter(o=>o.isIntersecting).sort((o,c)=>o.boundingClientRect.top-c.boundingClientRect.top);n[0]&&l(n[0].target.dataset.mod)},{root:p.current||null,rootMargin:"-30% 0px -55% 0px",threshold:[0,.1,.5,1]});return h.forEach(i=>{const n=document.getElementById(`viz-group-${i}`);n&&t.observe(n)}),()=>t.disconnect()},[N]);const B=t=>i=>{i.preventDefault();const n=document.getElementById(`viz-group-${t}`);if(!n)return;const o=p.current;if(o){const c=n.getBoundingClientRect().top-o.getBoundingClientRect().top+o.scrollTop-12;o.scrollTo({top:c,behavior:"smooth"})}else n.scrollIntoView({behavior:"smooth",block:"start"});l(t)};return e.jsxs("div",{className:"learn-container viz-index-container",ref:p,children:[e.jsxs("div",{className:"learn-header",children:[e.jsxs(w,{to:"/learning",className:"learn-crumb",children:[e.jsx(V,{size:13})," ",e.jsx("span",{children:"Learning"}),e.jsx("span",{className:"learn-crumb-sep",children:"/"}),e.jsx("span",{className:"learn-crumb-here",children:"Visualize"})]}),e.jsx("h1",{className:"learn-title",children:"Visualize"}),e.jsx("p",{className:"learn-sub",children:"Step through algorithms frame by frame."}),e.jsxs("div",{className:"viz-search",children:[e.jsx(W,{size:14,className:"viz-search-icon","aria-hidden":"true"}),e.jsx("input",{type:"text",value:a,onChange:t=>s(t.target.value),placeholder:"Search by title or description…",className:"viz-search-input","aria-label":"Filter visualizations"}),a&&e.jsx("button",{type:"button",className:"viz-search-clear",onClick:()=>s(""),"aria-label":"Clear search",children:e.jsx(_,{size:14})})]}),g&&e.jsxs("p",{className:"viz-search-meta",children:[I," match",I===1?"":"es"," across ",h.length," group",h.length===1?"":"s","."]})]}),e.jsx("nav",{className:"viz-chip-bar","aria-label":"Jump to group",children:h.map((t,i)=>e.jsxs("button",{type:"button",onClick:B(t),className:`viz-chip${C===t?" active":""}`,style:{"--chip-accent":b[i%b.length]},children:[e.jsx("span",{className:"viz-chip-dot","aria-hidden":"true"}),e.jsx("span",{className:"viz-chip-label",children:x[t]}),e.jsx("span",{className:"viz-chip-count",children:v[t].length})]},t))}),e.jsxs("div",{className:"viz-index-layout",children:[e.jsx("aside",{className:"viz-side","aria-label":"Groups",children:e.jsxs("nav",{className:"viz-side-nav",children:[e.jsx("h3",{className:"viz-side-title",children:"Groups"}),e.jsx("ul",{className:"viz-side-list",children:h.map((t,i)=>e.jsx("li",{children:e.jsxs("a",{href:`#viz-group-${t}`,onClick:B(t),className:`viz-side-link${C===t?" active":""}`,style:{"--side-accent":b[i%b.length]},children:[e.jsx("span",{className:"viz-side-rail","aria-hidden":"true"}),e.jsx("span",{className:"viz-side-label",children:x[t]}),e.jsx("span",{className:"viz-side-count",children:v[t].length})]})},t))})]})}),e.jsxs("div",{className:"viz-index-main",children:[h.length===0&&e.jsxs("div",{className:"viz-empty",children:[e.jsxs("p",{children:['No visualizations match "',a,'".']}),e.jsx("button",{type:"button",className:"viz-empty-clear",onClick:()=>s(""),children:"Clear search"})]}),h.map((t,i)=>e.jsxs("section",{id:`viz-group-${t}`,"data-mod":t,className:"learn-group viz-group",style:{"--group-accent":b[i%b.length]},children:[e.jsxs("h2",{className:"learn-group-title viz-group-title",children:[e.jsx("span",{className:"viz-group-dot","aria-hidden":"true"}),x[t],e.jsxs("span",{className:"learn-group-count",children:["(",v[t].length,")"]})]}),e.jsx("div",{className:"learn-module-grid",children:v[t].map(([n,o])=>{const c=j[n]||{},m=!!($[n]&&O[$[n]]);return e.jsxs(w,{to:`/visualize/${n}`,className:"learn-module-card viz-card",style:{"--card-accent":b[i%b.length]},children:[e.jsxs("div",{className:"learn-module-card-head",children:[e.jsx(U,{size:16}),e.jsx("span",{className:"learn-module-card-title",children:o.title}),m&&e.jsxs("span",{title:"Has Interactive mode — edit the code and re-run",style:{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:"0.25rem",fontFamily:"var(--mono)",fontSize:"0.62rem",fontWeight:700,padding:"0.12rem 0.42rem",borderRadius:"4px",background:"rgba(var(--accent-rgb), 0.12)",color:"var(--accent)",border:"1px solid rgba(var(--accent-rgb), 0.35)",letterSpacing:"0.04em",textTransform:"uppercase"},children:[e.jsx(q,{size:10})," Live"]})]}),e.jsx("p",{className:"learn-module-card-desc",children:c.blurb||`${E(o)} steps.`}),e.jsxs("div",{className:"learn-module-card-foot",children:[e.jsxs("span",{className:"learn-module-count",children:[E(o)," steps"]}),e.jsx(T,{size:14})]})]},n)})})]},t))]})]})]})}const oe=Object.freeze(Object.defineProperty({__proto__:null,default:J},Symbol.toStringTag,{value:"Module"}));export{O as I,oe as V};
