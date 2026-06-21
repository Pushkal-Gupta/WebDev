const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./InteractiveVisualizer-Bvgtr2qc.js","./vendor-query-FJdQ8OJm.js","./vendor-monaco-BrjDLSos.js","./AlgoVisualizer-CHbaltrz.js","./vendor-icons-0t9PreTK.js","./AlgoVisualizer-DFanuhiJ.css","./index-HDhqHOdn.js","./vendor-react-firagBrd.js","./vendor-supabase-ClVc2H6D.js","./index-cbCjehPi.css","./conceptVisualizations-DkaSmZdU.js","./interactiveViz-FHWqBz8x.js","./interactiveViz-tHheWnUK.css","./achievements-aPayMaAI.js","./RunnableCodePanel-DInBJdIU.js","./codeRunner-pNzB6fKw.js","./LanguageIcon-GXin96PM.js","./RunnableCodePanel-5fsMbDU8.css","./ForgeThumb-C3VY5RL6.js","./ForgeThumb-BT6iITQn.css","./InteractiveVisualizer-DaD-Uvgc.css","./MLLesson-qPAcg8CZ.css","./Learn-Be8T_Gtk.css"])))=>i.map(i=>d[i]);
import{a3 as G,_ as U}from"./index-HDhqHOdn.js";import{r as g,j as e}from"./vendor-query-FJdQ8OJm.js";import{A as Z,G as X,S as Y,N as J,T as Q,a as ee}from"./AlgoVisualizer-CHbaltrz.js";import{V as z}from"./conceptVisualizations-DkaSmZdU.js";import{I as k}from"./interactiveViz-FHWqBz8x.js";import{r as te}from"./achievements-aPayMaAI.js";import{R as re}from"./RunnableCodePanel-DInBJdIU.js";import{F as ae}from"./ForgeThumb-C3VY5RL6.js";/* empty css                 *//* empty css              */import{u as ie,L as b}from"./vendor-react-firagBrd.js";import{j as H,aZ as O,C as w,q as j,d as N,v as se,X as ne,w as oe,Z as F,am as le,bR as de,dr as ce,Y as he,L as ue,N as pe,c_ as me,aF as ge,bW as be,aS as fe,bn as ye,ay as ve,ds as xe,bk as we,bu as ke,dt as je,b_ as $e,bS as Se,bl as Ce,bZ as Ne,aU as Be}from"./vendor-icons-0t9PreTK.js";const c={};c["binary-search"]={title:"Binary search",description:"Halve the search space at every step. Edit the code, change the target, watch the pointers move.",renderer:"array",initialInput:{array:[1,3,5,7,9,11,13,15,17,19],target:11},stateHint:`// ArrayBarRenderer frame:
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
`};c.bfs={title:"Breadth-first search",description:"Frontier expansion from a source vertex. Edit the adjacency list and the start node.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","B"],["A","C"],["B","D"],["C","D"],["C","E"],["D","F"],["E","F"]],start:"A"},stateHint:`// GraphRenderer frame:
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
`};c.dfs={title:"Depth-first search",description:"Recursive descent. Track call-stack frames as you go deeper, then back out.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","B"],["A","C"],["B","D"],["C","E"],["D","F"],["E","F"]],start:"A"},stateHint:"// GraphRenderer frame, same shape as BFS.",initialCode:`// Iterative DFS using an explicit stack.
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
`};c.dijkstra={title:"Dijkstra's shortest path",description:"Relaxation with a (simulated) priority queue. Edit weights to see paths reshuffle.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E"],edges:[["A","B",4],["A","C",2],["B","C",1],["B","D",5],["C","D",8],["C","E",10],["D","E",2]],source:"A"},stateHint:`// GraphRenderer frame with weighted edges:
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
`};c["heap-insert"]={title:"Min-heap insertion",description:"Push to the back, then sift up while smaller than the parent. Edit the values to push.",renderer:"array",initialInput:{initial:[],pushes:[7,3,9,1,5,4,8,2]},stateHint:`// ArrayBarRenderer frame:
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
`};c["two-pointers"]={title:"Two pointers",description:"Find a pair summing to the target on a sorted array. O(n).",renderer:"array",initialInput:{array:[1,2,4,6,8,11,14,18],target:12},stateHint:`// ArrayBarRenderer frame:
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
`};c["sliding-window"]={title:"Sliding window",description:"Longest substring without repeating chars. Expand right; contract left on duplicates.",renderer:"window",initialInput:{s:"abcabcbb"},stateHint:`// SlidingWindowRenderer frame:
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
`};c["quicksort-partition"]={title:"Quicksort partition (Lomuto)",description:"Pivot at the end; sweep i; swap smaller items into the front; finally place pivot.",renderer:"array",initialInput:{array:[7,2,9,4,1,6,8,3,5]},stateHint:`// ArrayBarRenderer frame:
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
`};c["merge-sort"]={title:"Merge sort (merge step)",description:"Take from the smaller head of two sorted halves until both drain. The hot loop of merge sort.",renderer:"array",initialInput:{left:[1,4,6,9],right:[2,3,5,8,10]},stateHint:`// ArrayBarRenderer frame:
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
`};c.kadanes={title:"Kadane's algorithm",description:"Maximum subarray sum in a single pass. Reset the running sum whenever it goes negative.",renderer:"array",initialInput:{array:[-2,1,-3,4,-1,2,1,-5,4]},stateHint:`// ArrayBarRenderer frame:
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
`};c["bubble-sort"]={title:"Bubble sort",description:"Repeatedly swap adjacent out-of-order pairs. After pass k the last k elements are settled.",renderer:"array",initialInput:{array:[5,2,8,1,4,7,3,6]},stateHint:`// ArrayBarRenderer frame:
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
`};c["insertion-sort"]={title:"Insertion sort",description:"Grow a sorted prefix on the left by shifting each new element backward into place.",renderer:"array",initialInput:{array:[7,3,5,1,8,2,6,4]},stateHint:`// ArrayBarRenderer frame:
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
`};c["selection-sort"]={title:"Selection sort",description:"Each pass finds the min of the unsorted suffix and swaps it into the front.",renderer:"array",initialInput:{array:[9,4,6,2,7,1,8,3]},stateHint:`// ArrayBarRenderer frame:
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
`};c["heap-sort"]={title:"Heap sort",description:"Build a max-heap in place, then repeatedly swap root with the last unsorted slot.",renderer:"array",initialInput:{array:[4,10,3,5,1,7,8,2,9,6]},stateHint:"// Heap stored as array. highlights show the active node and swap target.",initialCode:`// Heap sort: max-heapify then extract.
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
`};c["counting-sort"]={title:"Counting sort",description:"Tally occurrences of each key, then write keys back in order. O(n + k) for small key ranges.",renderer:"array",initialInput:{array:[4,2,2,8,3,3,1,4,0,5]},stateHint:"// ArrayBarRenderer frame. Counts are shown as a separate snapshot via display = [...arr, ...counts].",initialCode:`// Counting sort over non-negative integers.
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
`};c["linear-search"]={title:"Linear search",description:"Walk left-to-right comparing each element to the target. O(n).",renderer:"array",initialInput:{array:[14,7,22,3,9,18,5,11,25,6],target:18},stateHint:"// ArrayBarRenderer frame: highlights mark the probe and any match.",initialCode:`// Linear search.
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
`};c["union-find"]={title:"Union-Find with path compression",description:"Disjoint-set forest stored as a parent array. Each find flattens the chain it walks.",renderer:"array",initialInput:{n:8,ops:[["union",0,1],["union",2,3],["union",4,5],["union",6,7],["union",1,3],["union",5,7],["find",0],["union",3,5]]},stateHint:"// ArrayBarRenderer frame: parent[] as bars; highlights mark the walked path.",initialCode:`// Union-find with path compression. parent[i] = i means i is a root.
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
`};c["kruskal-mst"]={title:"Kruskal's MST",description:"Sort edges by weight, add each that does not close a cycle (tested via union-find).",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","B",4],["A","F",2],["B","C",6],["B","F",5],["C","D",3],["C","F",1],["D","E",2],["E","F",4]]},stateHint:"// GraphRenderer frame. Edge state 'done' = picked, 'current' = considering, 'visited' = rejected.",initialCode:`// Kruskal: greedy edge picks with DSU cycle check.
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
`};c["prim-mst"]={title:"Prim's MST",description:"Grow the tree from a seed vertex by repeatedly absorbing the cheapest crossing edge.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","B",4],["A","F",2],["B","C",6],["B","F",5],["C","D",3],["C","F",1],["D","E",2],["E","F",4]],start:"A"},stateHint:"// GraphRenderer frame, weighted edges. Node state 'done' = in tree, 'frontier' = reachable.",initialCode:`// Prim's algorithm (no heap; scan crossing edges each round for clarity).
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
`};c["topological-sort-kahn"]={title:"Kahn's topological sort",description:"Emit any in-degree-0 vertex, decrement its out-neighbours, repeat until the graph drains.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E","F"],edges:[["A","C"],["B","C"],["B","D"],["C","E"],["D","E"],["E","F"]]},stateHint:"// GraphRenderer frame. State: 'done' emitted, 'frontier' in queue, 'current' being processed.",initialCode:`// Kahn's algorithm. Directed edges a → b.
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
`};c["floyd-cycle-detection"]={title:"Floyd's cycle detection",description:"Tortoise steps 1, hare steps 2. They meet inside the cycle — or the hare hits null first.",renderer:"array",initialInput:{values:[3,7,4,5,9,2,6,8],cycleStart:3},stateHint:"// ArrayBarRenderer frame: highlights mark slow (low) and fast (high). Treat cycleStart=-1 as no cycle.",initialCode:`// Floyd's tortoise-and-hare. The list is modelled as an array of values
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
`};c["kmp-pattern-matching"]={title:"KMP pattern matching",description:"Precompute the failure function, then scan the text without ever rewinding.",renderer:"array",initialInput:{text:"abxabcabcaby",pattern:"abcaby"},stateHint:"// ArrayBarRenderer frame over text chars (tile mode). highlights mark i (high) and i-j+1 alignment.",initialCode:`// KMP. Build LPS, then match.
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
`};c["rabin-karp"]={title:"Rabin-Karp rolling hash",description:"Maintain a rolling polynomial hash over a window; verify on hash hits.",renderer:"array",initialInput:{text:"abracadabra",pattern:"cad",base:31,mod:1000000007},stateHint:"// ArrayBarRenderer over text chars. highlights mark the active window.",initialCode:`// Rabin-Karp with a polynomial rolling hash.
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
`};c["trie-insert"]={title:"Trie insertion",description:"Walk character by character, creating children on first visit. End-of-word marks the terminal node.",renderer:"tree",initialInput:{words:["cat","car","cart","do","dog"]},stateHint:`// TreeRenderer frame: { tree: { value, state?, left, right } }
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
`};c["segment-tree-build"]={title:"Segment tree build (sum)",description:"Recursively partition the range; each parent holds the sum of its two children.",renderer:"array",initialInput:{array:[2,1,5,3,4,7,2,6]},stateHint:"// ArrayBarRenderer frame over the segment-tree storage (4n long, 1-indexed).",initialCode:`// Build a sum segment tree stored as a 1-indexed array of length 4n.
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
`};c["fenwick-prefix-sum"]={title:"Fenwick tree prefix sums",description:"Binary-indexed tree updates climb via i += i & -i; prefix queries descend via i -= i & -i.",renderer:"array",initialInput:{array:[3,2,5,1,4,6,2,8],queries:[["prefix",5],["update",2,3],["prefix",5],["prefix",7]]},stateHint:"// ArrayBarRenderer frame over the BIT (1-indexed). highlights mark touched indices.",initialCode:`// Fenwick tree. BIT is 1-indexed; bit[0] unused.
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
`};c["bst-insert"]={title:"BST insertion",description:"Compare with the current node; go left if smaller, right if larger. Insert at the first empty slot.",renderer:"tree",initialInput:{values:[50,30,70,20,40,60,80,35,75]},stateHint:"// TreeRenderer frame: { tree: recursive { value, left, right, state? } }",initialCode:`// Build a BST by repeated insertion.
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
`};c["bst-search"]={title:"BST search",description:"Halve the search at every level: left if smaller, right if larger. O(log n) on a balanced tree.",renderer:"tree",initialInput:{structure:[50,30,70,20,40,60,80,35,45,75],target:45},stateHint:"// TreeRenderer frame. Path nodes marked 'visited', the cursor 'current', match 'done'.",initialCode:`// Build a BST from a level-order-ish insertion list, then search.
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
`};c["bellman-ford"]={title:"Bellman-Ford shortest paths",description:"Relax every edge V-1 times. One more relaxation that succeeds proves a negative cycle.",renderer:"graph",initialInput:{nodes:["A","B","C","D","E"],edges:[["A","B",6],["A","C",7],["B","C",8],["B","D",5],["B","E",-4],["C","D",-3],["C","E",9],["D","B",-2],["E","D",7]],source:"A"},stateHint:"// GraphRenderer frame, weighted directed edges. Node label embeds running distance.",initialCode:`// Bellman-Ford on a directed weighted graph (may include negative edges).
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
`};c["floyd-warshall"]={title:"Floyd-Warshall all-pairs shortest paths",description:"For every intermediate vertex k, see if going i→k→j beats the current i→j distance.",renderer:"grid",initialInput:{nodes:["A","B","C","D"],edges:[["A","B",5],["A","D",10],["B","C",3],["C","D",1],["D","B",2]]},stateHint:`// NumberGridRenderer 2D frame: { grid: char[][], cellLabel }.
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
`};c["dutch-national-flag"]={title:"Dutch national flag",description:"Three-way partition around a pivot in one pass. Edit the array, watch low/mid/high pointers sweep.",renderer:"array",initialInput:{array:[2,0,2,1,1,0,2,1,0]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Sort 0s, 1s, 2s in a single pass (Dutch national flag).
const arr = [...input.array];
let low = 0, mid = 0, high = arr.length - 1;
step({ array: [...arr], highlights: { [low]: 'low', [mid]: 'mid', [high]: 'high' } },
  \`low=\${low}, mid=\${mid}, high=\${high}\`);

while (mid <= high) {
  if (arr[mid] === 0) {
    [arr[low], arr[mid]] = [arr[mid], arr[low]];
    step({ array: [...arr], highlights: { [low]: 'match', [mid]: 'mid', [high]: 'high' } },
      \`arr[mid]=0 -> swap into low region, advance low & mid\`);
    low++; mid++;
  } else if (arr[mid] === 1) {
    step({ array: [...arr], highlights: { [low]: 'low', [mid]: 'mid', [high]: 'high' } },
      \`arr[mid]=1 -> already in middle, advance mid\`);
    mid++;
  } else {
    [arr[mid], arr[high]] = [arr[high], arr[mid]];
    step({ array: [...arr], highlights: { [low]: 'low', [mid]: 'mid', [high]: 'match' } },
      \`arr[mid]=2 -> swap into high region, shrink high\`);
    high--;
  }
}
const all = {};
for (let k = 0; k < arr.length; k++) all[k] = 'match';
step({ array: [...arr], highlights: all }, 'Partitioned: 0s | 1s | 2s');
log('sorted', arr);
`};c["boyer-moore-majority"]={title:"Boyer–Moore majority vote",description:"Find the element appearing more than n/2 times in O(1) space. Edit the array and watch the candidate flip.",renderer:"array",initialInput:{array:[2,2,1,1,1,2,2]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Boyer-Moore: maintain a candidate and a count.
const arr = input.array;
let candidate = null, count = 0;
for (let i = 0; i < arr.length; i++) {
  if (count === 0) {
    candidate = arr[i];
    step({ array: arr, highlights: { [i]: 'mid' } },
      \`count 0 -> new candidate = \${candidate}\`);
  }
  if (arr[i] === candidate) {
    count++;
    step({ array: arr, highlights: { [i]: 'match' } },
      \`arr[\${i}]=\${arr[i]} matches candidate -> count=\${count}\`);
  } else {
    count--;
    step({ array: arr, highlights: { [i]: 'high' } },
      \`arr[\${i}]=\${arr[i]} differs -> count=\${count}\`);
  }
}
step({ array: arr, highlights: {} }, \`Majority candidate = \${candidate}\`);
log('majority', candidate);
`};c["find-peak-element"]={title:"Find a peak element",description:"Binary search on the slope: move toward the higher neighbour, a peak must lie that way.",renderer:"array",initialInput:{array:[1,2,1,3,5,6,4]},stateHint:`// ArrayBarRenderer frame:
// { array, highlights: { [idx]: 'low'|'high'|'mid'|'match' }, eliminated?: number[] }`,initialCode:`// A peak is any arr[i] greater than both neighbours. O(log n) via slope.
const arr = input.array;
let lo = 0, hi = arr.length - 1;
const elim = [];
while (lo < hi) {
  const mid = (lo + hi) >> 1;
  step({ array: arr, highlights: { [lo]: 'low', [hi]: 'high', [mid]: 'mid' }, eliminated: [...elim] },
    \`Probe arr[\${mid}]=\${arr[mid]} vs arr[\${mid + 1}]=\${arr[mid + 1]}\`);
  if (arr[mid] > arr[mid + 1]) {
    for (let k = mid + 1; k <= hi; k++) elim.push(k);
    hi = mid;
    step({ array: arr, highlights: { [lo]: 'low', [hi]: 'high' }, eliminated: [...elim] },
      \`Descending -> a peak is at or left of mid, hi=\${hi}\`);
  } else {
    for (let k = lo; k <= mid; k++) elim.push(k);
    lo = mid + 1;
    step({ array: arr, highlights: { [lo]: 'low', [hi]: 'high' }, eliminated: [...elim] },
      \`Ascending -> a peak is right of mid, lo=\${lo}\`);
  }
}
step({ array: arr, highlights: { [lo]: 'match' } }, \`Peak at index \${lo}, value \${arr[lo]}\`);
log('peak index', lo);
`};c["array-cyclic-sort"]={title:"Cyclic sort",description:"Place each value 1..n at its home index by repeated swaps. Linear time, O(1) space.",renderer:"array",initialInput:{array:[3,1,5,4,2]},stateHint:`// ArrayBarRenderer frame:
// { array: number[], highlights: { [idx]: 'low'|'high'|'mid'|'match' } }`,initialCode:`// Cyclic sort for values 1..n. Each value v belongs at index v-1.
const arr = [...input.array];
let i = 0;
while (i < arr.length) {
  const home = arr[i] - 1;
  if (arr[i] !== arr[home]) {
    step({ array: [...arr], highlights: { [i]: 'mid', [home]: 'high' } },
      \`arr[\${i}]=\${arr[i]} belongs at index \${home} -> swap\`);
    [arr[i], arr[home]] = [arr[home], arr[i]];
  } else {
    step({ array: [...arr], highlights: { [i]: 'match' } },
      \`arr[\${i}]=\${arr[i]} already home -> advance\`);
    i++;
  }
}
const all = {};
for (let k = 0; k < arr.length; k++) all[k] = 'match';
step({ array: [...arr], highlights: all }, 'Sorted in place');
log('sorted', arr);
`};const v=c,Ie=g.lazy(()=>U(()=>import("./InteractiveVisualizer-Bvgtr2qc.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]),import.meta.url)),ze=[{key:"python",label:"Python"},{key:"javascript",label:"JavaScript"},{key:"java",label:"Java"},{key:"cpp",label:"C++"}];function Ae(i){if(!i||typeof i!="object")return null;for(const{key:d,label:o}of ze){const n=i[d];if(typeof n=="string"&&n.trim().length>0)return{language:d,label:o,body:n.trim()}}return null}const f={"binary-search":"binary-search","bfs-dfs":"bfs","dfs-traversal":"dfs","dijkstras-algorithm":"dijkstra","two-pointers":"two-pointers","sliding-window":"sliding-window","quicksort-partition":"quicksort-partition","merge-sort":"merge-sort","kadanes-algorithm":"kadanes","bubble-sort":"bubble-sort","insertion-sort":"insertion-sort","selection-sort":"selection-sort","heap-sort":"heap-sort","union-find":"union-find","kruskals-mst":"kruskal-mst","topological-sort":"topological-sort-kahn","kahns-algorithm":"topological-sort-kahn","loop-detection":"floyd-cycle-detection",kmp:"kmp-pattern-matching","hash-rolling-rabin-karp":"rabin-karp","trie-insert":"trie-insert","segment-tree":"segment-tree-build","fenwick-tree":"fenwick-prefix-sum","bst-insertion":"bst-insert","bellman-ford":"bellman-ford","floyd-warshall":"floyd-warshall","dijkstra-on-grid":"dijkstra","dijkstra-with-path":"dijkstra","dijkstra-stops":"dijkstra","kahn-topological-sort":"topological-sort-kahn","topological-sort-dfs":"topological-sort-kahn","mst-prim":"prim-mst","kruskals-algorithm":"kruskal-mst","union-find-data-structure":"union-find","heap-binary":"heap-insert","heap-sort-algorithm":"heap-sort","floyd-cycle-detection":"floyd-cycle-detection","kmp-failure-function":"kmp-pattern-matching","fenwick-bit":"fenwick-prefix-sum","segment-tree-merge":"segment-tree-build","binary-search-tree-operations":"bst-insert","bst-iterator-inorder":"bst-search",trie:"trie-insert","boyer-moore-voting-extended":"boyer-moore-majority","graph-floyd-warshall":"floyd-warshall"},L={"bubble-sort":"bubble-sort-algorithm","merge-sort":"merge-sort-algorithm","quicksort-partition":"quicksort-algorithm","a-star-search":"astar-search","lca-binary-lifting":"binary-lifting-lca","binary-lifting-general":"binary-lifting-lca","bloom-filter":"bloom-filter-tuning","boyer-moore-majority":"boyer-moore-voting-extended","boyer-moore-string-search":"boyer-moore-bad-char","bst-insertion":"binary-search-tree-operations","bst-inorder":"bst-iterator-inorder","xor-tricks":"bitwise-xor-properties","aho-corasick":"aho-corasick-failure","fenwick-tree":"fenwick-bit","lru-cache":"cache-eviction-policies","lru-cache-design":"cache-eviction-policies","mos-algorithm":"mo-algorithm","topological-sort-kahn":"kahn-topological-sort"};function qe(i){return k[i]||k[L[i]]||null}const x={"a-star-search":{module:"graphs-shortest-paths",blurb:"Greedy best-first with a heuristic guiding relaxation toward the goal."},"aho-corasick":{module:"strings-matching",blurb:"Multi-pattern matching via a trie augmented with failure links."},"amortized-analysis":{module:"foundations-analysis",blurb:"Aggregate, accounting, potential — three lenses on average cost."},"array-cyclic-sort":{module:"arrays-pointers-windows",blurb:"Place each value at its index in one pass; O(n) for 1..n arrays."},"best-stock-multiple-tx":{module:"arrays-pointers-windows",blurb:"Greedy sum of every upward delta captures maximum profit."},"bellman-ford":{module:"graphs-shortest-paths",blurb:"V−1 relaxation passes find shortest paths even with negative edges."},"bellman-ford-detection":{module:"graphs",blurb:"Run V−1 relax passes, then one more; any further relaxation proves a negative cycle."},"bfs-dfs":{module:"trees",blurb:"Breadth-first traversal frontier expansion."},"binary-lifting-general":{module:"trees-advanced-queries",blurb:"Precompute 2^k jumps for O(log n) ancestor and path queries."},"binary-search":{module:"arrays-binary-search",blurb:"Halve the search space at every step."},"binary-search-on-answer":{module:"arrays-binary-search",blurb:"Binary-search a monotone predicate instead of a value."},"bipartite-check":{module:"graphs-traversal",blurb:"Two-color BFS detects odd cycles and proves bipartiteness."},"bit-dp":{module:"dp-advanced",blurb:"State as a subset bitmask; classic for travelling-salesman style DP."},"bloom-filter":{module:"cs-tools-encodings",blurb:'k hashes flip bits; queries say "definitely not" or "probably yes".'},"boyer-moore-majority":{module:"strings-matching",blurb:"Cancel pairs to find a strict majority element in O(n), O(1) space."},"boyer-moore-string-search":{module:"strings-matching",blurb:"Compare right-to-left; bad-character skips slide the pattern past whole chunks of text."},"bst-insertion":{module:"trees",blurb:"Walk left or right comparing the key; new node lands at the first null slot."},"bst-inorder":{module:"trees-traversal-bst",blurb:"Inorder walk visits BST keys in sorted order."},"bubble-sort":{module:"sorting-strings",blurb:"Adjacent compares + swaps. Canonical O(n²)."},"chinese-remainder":{module:"math-number-theory",blurb:"Stitch residues mod coprime moduli into a single residue."},"circuit-breaker":{module:"system-design",blurb:"Fail-fast state machine: CLOSED counts failures, OPEN short-circuits, HALF_OPEN probes for recovery."},"coin-change-variants":{module:"dp-classical",blurb:"Count ways or minimize coins via 1D DP over the amount axis."},"consistent-hashing":{module:"system-design",blurb:"Place servers + keys on a hash ring; removing a node only reshuffles its arc of keys."},"convex-hull-trick":{module:"dp",blurb:"Maintain the lower envelope of m·x+b lines; min queries become O(1) amortised."},"coordinate-compression":{module:"foundations-patterns",blurb:"Replace sparse coordinates with their sorted ranks."},"counting-inversions":{module:"sorting-strings",blurb:"Merge-sort piggybacks on its merge step to count out-of-order pairs."},"counting-sort":{module:"sorting-strings",blurb:"Tally values, prefix-sum the counts, place stably — O(n + k), no comparisons."},"cuckoo-hashing":{module:"hashing",blurb:"Two tables, two hash functions. Inserts displace residents until everyone finds a home."},"cycle-detection-graph":{module:"graphs-traversal",blurb:"DFS colors detect back-edges that close a cycle."},"dfs-iterative":{module:"graphs-traversal",blurb:"Explicit stack replays recursive DFS without blowing the call stack."},"dfs-traversal":{module:"graphs",blurb:"Stack-based DFS expansion with spanning-tree edges highlighted."},"digit-dp":{module:"dp-advanced",blurb:"Walk number digits with tight/loose state to count constrained integers."},"dijkstra-pq":{module:"graphs-shortest-paths",blurb:"Min-heap version of Dijkstra runs in O((V+E) log V)."},"dijkstras-algorithm":{module:"graphs",blurb:"Shortest paths from source with relaxation, distance labels live."},"disjoint-set-rank":{module:"graphs-union-find",blurb:"Union by rank keeps the DSU forest near-flat."},"dp-coin-change-min-coins":{module:"dp-classical",blurb:"Fill dp[amount] = min over coins of dp[amount−coin] + 1."},"dp-edit-distance-levenshtein":{module:"dp-classical",blurb:"Insert, delete, substitute — minimum operations between two strings."},"dp-knapsack-bounded-unbounded":{module:"dp-classical",blurb:"Two table orientations switch between 0/1 and unbounded knapsack."},"dp-on-trees":{module:"trees-advanced-queries",blurb:"Post-order combines children answers into parents."},"dsu-on-tree":{module:"trees-advanced-queries",blurb:"Small-to-large merging answers subtree queries in O(n log n)."},"dutch-national-flag":{module:"arrays-pointers-windows",blurb:"Three-way partition sorts {0,1,2} arrays in one pass."},"euclidean-gcd":{module:"math-number-theory",blurb:"gcd(a,b) = gcd(b, a mod b) — terminates in O(log min)."},"euler-tour-tree":{module:"trees-advanced-queries",blurb:"Flatten a tree into an array so subtrees become contiguous ranges."},"fenwick-tree":{module:"trees-advanced-queries",blurb:"Binary-indexed tree gives O(log n) prefix sums and point updates."},"fft-basics":{module:"math-geom-sampling",blurb:"Divide-and-conquer evaluation of polynomials at roots of unity."},"fibonacci-recursion":{module:null,blurb:"See the exponential call tree of naive fib — and why memoization collapses it."},"find-peak-element":{module:"arrays-binary-search",blurb:"Binary-search the half whose neighbour rises — a peak must live there."},"floyd-warshall":{module:"graphs-shortest-paths",blurb:"Triple loop relaxes through every intermediate vertex."},"gale-shapley":{module:"graphs-advanced",blurb:"Stable matching via deferred-acceptance proposals."},"gas-station-circular":{module:"arrays-pointers-windows",blurb:"Greedy linear scan finds the start index for the circular tour."},"hash-collision":{module:null,blurb:"Bars = bucket length. Watch collisions cluster, then notice when resizing would kick in."},"hash-rolling-rabin-karp":{module:"strings-matching",blurb:"Roll a polynomial hash window to find substring matches in O(n+m)."},"heap-sort":{module:"sorting-strings",blurb:"Build a max-heap, then repeatedly swap the root to the shrinking tail."},"heavy-light-decomposition":{module:"trees-advanced-queries",blurb:"Chain heavy edges so path queries hit at most O(log n) segments."},"hopcroft-karp":{module:"graphs-advanced",blurb:"BFS layers + DFS augmenting paths give O(E√V) bipartite matching."},"huffman-coding":{module:"strings-matching",blurb:"Greedy merge of lowest-frequency nodes builds an optimal prefix code."},"insertion-sort":{module:"sorting-strings",blurb:"Bubble each new element backward into the sorted prefix."},"interval-merge":{module:"arrays-range-structures",blurb:"Sort by start, then sweep merging any overlap with the running interval."},"island-count-bfs":{module:"graphs-traversal",blurb:"BFS floods each unvisited land cell to count grid components."},"jump-game-i-ii":{module:"arrays-pointers-windows",blurb:"Greedy reach tracking solves can-jump and min-jumps in O(n)."},"kadanes-algorithm":{module:"dp",blurb:"Maximum subarray sum, single linear pass."},"kahns-algorithm":{module:"graphs",blurb:"Topological sort via BFS: emit any in-degree-0 node, decrement its out-neighbours, repeat."},kmp:{module:"strings-matching",blurb:"Failure function skips redundant comparisons for O(n+m) matching."},"kruskals-mst":{module:"graphs-mst",blurb:"Sort edges, add the cheapest that does not close a cycle via DSU."},"kth-smallest-bst":{module:"trees-traversal-bst",blurb:"Inorder traversal stops at the k-th visited node."},"largest-rectangle-histogram":{module:"stacks-queues",blurb:"Monotonic stack of indices finds the maximal-area rectangle in O(n)."},"lca-binary-lifting":{module:"trees-advanced-queries",blurb:"Precomputed jumps answer lowest-common-ancestor queries in O(log n)."},"linear-vs-binary":{module:"arrays-binary-search",blurb:"Side-by-side: linear scan vs binary halving on the same sorted array."},"longest-common-subseq":{module:"dp",blurb:"Match → diagonal+1, mismatch → max(up, left). Classic 2D DP."},"longest-increasing-subseq":{module:"dp-classical",blurb:"Patience-sorting piles give the LIS length in O(n log n)."},"loop-detection":{module:"linked-lists",blurb:"Floyd's tortoise-and-hare cycle detection."},"lru-cache":{module:"cs-tools-encodings",blurb:"Hashmap + doubly-linked list give O(1) get and put with LRU eviction."},"lru-cache-design":{module:"hashing",blurb:"Hashmap for O(1) lookup, doubly-linked list for O(1) reorder; tail is the eviction victim."},"manachers-algorithm":{module:"strings-matching",blurb:"Find every palindromic substring in linear time using mirror reuse."},"matrix-exponentiation":{module:"math-number-theory",blurb:"Fast-power a transition matrix to leap linear recurrences in O(log n)."},"max-flow":{module:"graphs-advanced",blurb:"Ford-Fulkerson pushes flow along augmenting paths in the residual graph."},"merge-sort":{module:"sorting-strings",blurb:"The merge step: take from the smaller head of two sorted halves until both drain."},"merkle-tree":{module:"system-design",blurb:"Hash-pair upward to a single root; verify any block in O(log n) with a sibling-hash path."},"min-stack":{module:"stacks-queues",blurb:"Auxiliary stack of running minima makes getMin O(1)."},"monotonic-deque":{module:"stacks-queues",blurb:"Decreasing deque of indices answers window-max queries in O(1) amortised."},"monotonic-stack":{module:"stacks-queues",blurb:"Strictly increasing stack of indices; each element is pushed and popped at most once."},"morris-traversal":{module:"trees-traversal-bst",blurb:"Thread predecessor links so inorder walks run in O(1) space."},"mos-algorithm":{module:"arrays-range-structures",blurb:"Block-sorted offline queries amortise to O((n+q)√n)."},"mst-kruskal":{module:"graphs-mst",blurb:"Sorted edges plus union-find build the minimum spanning tree."},"n-queens":{module:"recursion-bt",blurb:"Backtracking places queens column by column, pruning attacked squares."},"next-greater-element":{module:"stacks-queues",blurb:"Right-to-left monotonic stack answers every next-greater query in O(n)."},"paxos-basics":{module:"system-design",blurb:"Two phases — Prepare/Promise then Accept/Accepted — over a quorum of acceptors."},"prefix-sum":{module:"arrays-range-structures",blurb:"O(n) preprocessing for O(1) range-sum queries."},"prims-algorithm":{module:"graphs-mst",blurb:"Grow one tree from a start vertex; always take the cheapest edge crossing the cut."},"queue-ops":{module:"stacks-queues",blurb:"Enqueue at the back, dequeue from the front. FIFO in motion."},quickhull:{module:"math-geom-sampling",blurb:"Divide-and-conquer picks the farthest point off each hull edge."},quickselect:{module:"sorting-strings",blurb:"Partition like quicksort, recurse only on the side containing the answer."},"quicksort-partition":{module:"sorting-strings",blurb:"Lomuto partition: pivot, swap, place."},"radix-sort-algorithm":{module:"sorting-strings",blurb:"Stable bucket passes digit by digit sort fixed-width integers in O(d(n + k))."},"radix-tree":{module:"cs-tools-encodings",blurb:"Compressed trie collapses single-child chains into edge labels."},"raft-consensus":{module:"system-design",blurb:"Leader heartbeats keep followers calm; one timeout fires, election runs, new leader takes term+1."},"random-shuffle-fisher-yates":{module:"math-geom-sampling",blurb:"Swap each index with a random later index for a uniform permutation."},"reservoir-sampling":{module:"math-geom-sampling",blurb:"Pick k uniform samples from a stream of unknown length in one pass."},"segment-tree":{module:"trees-advanced-queries",blurb:"Recursive halves answer range queries and point updates in O(log n)."},"segment-tree-beats":{module:"trees-advanced-queries",blurb:"Tag each node with second-max to support chmin / chmax range updates."},"segment-tree-lazy":{module:"trees-advanced-queries",blurb:"Lazy propagation pushes pending range updates only when needed."},"segment-tree-on-intervals":{module:"trees-advanced-queries",blurb:"Index by interval endpoints to answer overlap and stabbing queries."},"segment-tree-persistent":{module:"trees-advanced-queries",blurb:"Each update clones a thin O(log n) path, preserving every version."},"selection-sort":{module:"sorting-strings",blurb:"Find min of remaining, swap into place. At most n−1 swaps."},"shell-sort":{module:"sorting-strings",blurb:"Gapped insertion-sort passes with a shrinking gap herd elements home fast."},"sieve-of-eratosthenes":{module:"math",blurb:"All primes up to N by crossing out multiples."},"sliding-window":{module:"arrays-pointers-windows",blurb:"Longest substring without repeating chars."},"sliding-window-max":{module:"arrays-pointers-windows",blurb:"Monotonic-decreasing deque keeps the window max at the front in O(n)."},"sparse-table":{module:"trees-advanced-queries",blurb:"Precompute idempotent range queries for O(1) lookups after O(n log n) prep."},"stack-ops":{module:"stacks-queues",blurb:"Push, pop, peek — LIFO semantics in motion."},"string-edit-distance":{module:"strings-matching",blurb:"DP table of insert / delete / substitute costs between two strings."},"string-hashing":{module:"strings-matching",blurb:"Polynomial hashes give O(1) substring comparison after O(n) prep."},"string-min-window-substring":{module:"strings-matching",blurb:"Sliding window plus a need-count hash finds the smallest covering window."},"subarray-product-less-k":{module:"arrays-pointers-windows",blurb:"Shrink the window whenever the running product hits k."},"subarray-sum-equals-k":{module:"arrays-range-structures",blurb:"Prefix-sum hashmap counts subarrays that sum to k in O(n)."},"suffix-array":{module:"strings-advanced",blurb:"Sorted suffix indices enable O(log n) substring search."},"suffix-automaton":{module:"strings-advanced",blurb:"Minimal DFA accepting every substring; linear-size index of a string."},"sweep-line":{module:"math-geom-sampling",blurb:"Process events in x-order to count overlaps or intersections."},"ternary-search":{module:"math-geom-sampling",blurb:"Trisect a unimodal range to find its extremum in O(log n)."},"topological-sort":{module:"graphs",blurb:"Kahn's algorithm: repeatedly remove 0-in-degree nodes."},treap:{module:"trees-balanced-disk",blurb:"Random priorities + BST keys keep heights logarithmic in expectation."},"tree-diameter":{module:"trees-traversal-bst",blurb:"Two BFS passes from opposite ends find the longest path."},"tree-right-side-view":{module:"trees-traversal-bst",blurb:"Level-order traversal records the rightmost node of each depth."},"trie-autocomplete":{module:"cs-tools-encodings",blurb:"Walk to the prefix node, then DFS the subtree for completions."},"trie-insert":{module:null,blurb:"Insert characters one by one; share prefixes; mark word ends."},"two-pointers":{module:"arrays-pointers-windows",blurb:"Pair sum on a sorted array, O(n)."},"two-sat":{module:"graphs-advanced",blurb:"Implication graph + SCCs decide 2-SAT formulas in linear time."},"union-find":{module:"graphs",blurb:"Disjoint-set forest with path compression. Depth bars shrink as queries flatten the trees."},"unique-paths-grid":{module:"dp-classical",blurb:"2D DP counts lattice paths under blocked-cell constraints."},"validate-bst":{module:"trees-traversal-bst",blurb:"Carry min/max bounds down each recursion to verify BST order."},"word-ladder-bfs":{module:"graphs-traversal",blurb:"BFS over one-letter transformations finds the shortest word chain."},"xor-tricks":{module:"bitwise",blurb:"XOR pairs cancel — single-number and missing-number tricks fall out."},"z-algorithm":{module:"strings-matching",blurb:"Z-array gives substring matches and palindrome work in linear time."},"zero-one-bfs":{module:"graphs-shortest-paths",blurb:"Deque BFS handles 0/1-weighted graphs in O(V+E)."},"zero-one-knapsack":{module:"dp",blurb:"Fill the n×W table row by row; final cell is the optimal value."}};function $(i){if(Array.isArray(i==null?void 0:i.frames))return i.frames.length;const d=i==null?void 0:i.cases;return Array.isArray(d)&&d[0]&&Array.isArray(d[0].frames)?d[0].frames.length:0}function Ee(i,d){var n;const o=(n=z[i])==null?void 0:n.renderer;return o==="graph"?e.jsx(X,{frame:d}):o==="window"?e.jsx(Y,{frame:d}):o==="grid"?e.jsx(J,{frame:d}):o==="tree"?e.jsx(Q,{frame:d}):e.jsx(ee,{frame:d})}function Te(){const{slug:i,category:d}=ie();return g.useEffect(()=>{i&&te("viz",i)},[i]),i?e.jsx(Oe,{slug:i}):d?e.jsx(Me,{category:d}):e.jsx(Le,{})}function Oe({slug:i}){const[d,o]=g.useState(!0),n=g.useRef(null);g.useEffect(()=>{o(!0)},[i]);const h=()=>{var T;o(!0);const y=n.current;if(!y)return;const K=(T=window.matchMedia)==null?void 0:T.call(window,"(prefers-reduced-motion: reduce)").matches;y.scrollIntoView({behavior:K?"auto":"smooth",block:"start"})},{data:r}=G(i),t=g.useMemo(()=>Ae(r==null?void 0:r.code),[r]),a=z[i];if(!a)return e.jsxs("div",{className:"learn-container",children:[e.jsx("div",{className:"learn-breadcrumbs",children:e.jsx(b,{to:"/visualize",children:"Visualizations"})}),e.jsxs("div",{className:"learn-header",children:[e.jsx("h1",{className:"learn-title",children:"Not found"}),e.jsxs("p",{className:"learn-sub",children:['No visualization exists for "',i,'".']})]})]});const l=x[i]||{},s=_(i),u=S[s],p=k[i]||k[L[i]]||null,m=v[i]?i:f[i]&&v[f[i]]?f[i]:null,A=!!m,q=$(a)>0,E=A||!!t,C=q?e.jsx(Z,{frames:a.frames,cases:a.cases,build:a.build,inputSchema:a.inputSchema,render:y=>Ee(i,y),autoPlay:!0}):null;return e.jsxs("div",{className:"learn-container viz-detail",children:[e.jsxs("div",{className:"learn-breadcrumbs",children:[e.jsx(b,{to:"/visualize",children:"Visualize"}),u&&e.jsxs(e.Fragment,{children:[e.jsx("span",{children:"/"}),e.jsx(b,{to:`/visualize/c/${s}`,children:u.label})]}),e.jsx("span",{children:"/"}),e.jsx("span",{children:a.title})]}),e.jsxs("header",{className:"viz-detail-hero",children:[e.jsxs("div",{className:"viz-detail-hero-text",children:[e.jsx("h1",{className:"viz-detail-title",children:a.title}),l.blurb&&e.jsx("p",{className:"viz-detail-blurb",children:l.blurb})]}),e.jsxs("div",{className:"viz-detail-chips",children:[p&&e.jsxs("span",{className:"viz-detail-chip primary",children:[e.jsx(H,{size:12})," Interactive"]}),q&&e.jsxs("span",{className:"viz-detail-chip",children:[e.jsx(O,{size:12})," ",$(a),"-step walkthrough"]}),E&&e.jsxs("button",{type:"button",onClick:h,className:"viz-detail-chip viz-detail-chip-link",children:[e.jsx(w,{size:12})," Editable code"]})]})]}),p?e.jsxs(e.Fragment,{children:[e.jsx("section",{className:"viz-detail-stage","aria-label":"Interactive visualization",children:e.jsx(p,{})}),C&&e.jsxs("section",{className:"viz-detail-section","aria-label":"Step-by-step walkthrough",children:[e.jsxs("div",{className:"viz-detail-section-head",children:[e.jsx(O,{size:14}),e.jsx("span",{children:"Step-by-step walkthrough"})]}),C]})]}):e.jsx("section",{className:"viz-detail-stage","aria-label":"Step-by-step walkthrough",children:C||e.jsx("p",{className:"viz-detail-empty",children:"This visualization has no frames yet."})}),E&&e.jsx("div",{ref:n,className:"viz-detail-anchor","aria-hidden":"true"}),t&&e.jsxs("section",{className:"viz-detail-section","aria-label":"Reference implementation",children:[e.jsxs("div",{className:"viz-detail-section-head",children:[e.jsx(w,{size:14}),e.jsx("span",{children:"Reference implementation — edit and run it"})]}),e.jsx(re,{code:r!=null&&r.code&&typeof r.code=="object"?r.code:t.body,lang:t.language})]}),A&&e.jsxs("details",{className:"viz-detail-advanced",open:d,onToggle:y=>o(y.currentTarget.open),children:[e.jsxs("summary",{className:"viz-detail-advanced-summary",children:[e.jsx(w,{size:14}),e.jsx("span",{children:"Trace it frame by frame — edit the visualizer code"}),e.jsx("span",{className:"viz-detail-advanced-hint",children:"JavaScript, runs in your browser"})]}),e.jsx("div",{className:"viz-detail-advanced-body",children:d&&e.jsx(g.Suspense,{fallback:e.jsx("div",{className:"viz-detail-empty",children:"Loading editor…"}),children:e.jsx(Ie,{slug:m})})})]}),l.module&&e.jsxs(b,{to:`/learn/${l.module}/${i}`,className:"viz-detail-concept-link",children:[e.jsx("span",{children:"Read the full concept — intuition, complexity, and code in four languages"}),e.jsx(j,{size:14})]})]})}const M=[{key:"sorting",label:"Sorting",preview:"bars",icon:le,blurb:"Compare, swap, partition — watch order emerge from chaos."},{key:"searching",label:"Searching",preview:"search",icon:de,blurb:"Halve the space, probe the midpoint, converge on the target."},{key:"arrays",label:"Arrays & Windows",preview:"window",icon:ce,blurb:"Two pointers, sliding windows, prefix sums over a flat sequence."},{key:"stacks",label:"Stacks & Queues",preview:"stack",icon:he,blurb:"LIFO pushes, FIFO drains, and the monotonic structures built on them."},{key:"linked",label:"Linked Lists",preview:"list",icon:ue,blurb:"Pointer chasing, cycle detection, and in-place rewiring."},{key:"trees",label:"Trees & BST",preview:"tree",icon:pe,blurb:"Ordered insertion, traversal orders, and self-balancing rotations."},{key:"heaps",label:"Heaps",preview:"heap",icon:me,blurb:"The shape + heap property that make the min or max an O(1) peek."},{key:"hashing",label:"Hashing",preview:"ring",icon:ge,blurb:"Buckets, collisions, probing rings, and membership filters."},{key:"range",label:"Range Structures",preview:"segbars",icon:be,blurb:"Segment trees, Fenwick trees, sparse tables for range queries."},{key:"graphs",label:"Graph Traversal",preview:"graph",icon:fe,blurb:"BFS frontiers, DFS spanning trees, topological order, cycles."},{key:"shortest",label:"Shortest Paths",preview:"paths",icon:ye,blurb:"Relax edges with Dijkstra, Bellman-Ford, Floyd-Warshall, A*."},{key:"mst",label:"Minimum Spanning Tree",preview:"mst",icon:ve,blurb:"Grow or merge the cheapest cycle-free edge set with Prim / Kruskal."},{key:"unionfind",label:"Union-Find (DSU)",preview:"dsu",icon:xe,blurb:"Disjoint sets with path compression and union by rank."},{key:"graphsadv",label:"Advanced Graphs",preview:"graph",icon:we,blurb:"Flow, matching, SCCs, articulation points, 2-SAT."},{key:"dp",label:"Dynamic Programming",preview:"grid",icon:ke,blurb:"Fill a table cell by cell; each answer reuses the ones before it."},{key:"recursion",label:"Recursion & Backtracking",preview:"rectree",icon:je,blurb:"Branch the search space, prune dead ends, unwind the call tree."},{key:"strings",label:"Strings & Matching",preview:"text",icon:$e,blurb:"Failure functions, rolling hashes, suffix structures for matching."},{key:"bitwise",label:"Bit Manipulation",preview:"bits",icon:Se,blurb:"XOR cancellation, masks, and subset enumeration over bits."},{key:"math",label:"Math & Geometry",preview:"numline",icon:Ce,blurb:"Number theory, sampling, sweep lines, and convex hulls."},{key:"systems",label:"Systems & Encodings",preview:"nodes",icon:Ne,blurb:"Caches, consensus, hashing rings, and the structures behind them."},{key:"misc",label:"More",preview:"cells",icon:Be,blurb:"Foundations, analysis, and everything else worth stepping through."}],W=M.map(i=>i.key),S=Object.fromEntries(M.map(i=>[i.key,i])),R={"sorting-strings":"sorting","arrays-binary-search":"searching","arrays-searching":"searching","arrays-pointers-windows":"arrays","arrays-range-structures":"range","arrays-counting-select":"sorting","stacks-queues":"stacks","linked-lists":"linked",trees:"trees","trees-traversal-bst":"trees","trees-balanced-disk":"trees","trees-advanced-queries":"range",heaps:"heaps",hashing:"hashing",graphs:"graphs","graphs-traversal":"graphs","graphs-shortest-paths":"shortest","graphs-mst":"mst","graphs-union-find":"unionfind","graphs-flow-grids":"graphsadv","graphs-advanced":"graphsadv",dp:"dp","dp-classical":"dp","dp-advanced":"dp","recursion-bt":"recursion","strings-matching":"strings","strings-advanced":"strings",bitwise:"bitwise",math:"math","math-number-theory":"math","math-geom-sampling":"math","cs-tools-encodings":"systems","system-design":"systems",foundations:"misc","foundations-analysis":"misc","foundations-patterns":"misc",greedy:"misc","cs-core":"systems","cs-db-transactions":"systems","cs-network-protocols":"systems","cs-os-concurrency":"systems"},D={"fibonacci-recursion":"recursion","hash-collision":"hashing","trie-insert":"strings","avl-tree":"trees","avl-tree-rotations":"trees","b-tree":"trees","b-tree-classic":"trees","b-plus-tree":"trees","bplus-tree-internals":"trees","bst-iterator-inorder":"trees","binary-search-tree-operations":"trees","binary-lifting-lca":"trees","bfs-algorithm":"graphs","astar-search":"shortest","articulation-bridges":"graphsadv","bipartite-matching-kuhn":"graphsadv","bit-counting-tricks":"bitwise","bitwise-xor-properties":"bitwise","bitwise-gray-code":"bitwise","bitwise-power-set-bitmask":"bitwise","bitwise-bit-manipulation-tricks":"bitwise","boyer-moore-voting-extended":"arrays","aho-corasick-failure":"strings","boyer-moore-bad-char":"strings","tsp-bitmask-dp":"graphsadv","hash-table-probing":"hashing","min-vertex-cover":"graphsadv","suffix-tree-construction":"strings","dp-bitmask":"dp","dp-interval-mcm":"dp","dp-tree":"dp","dp-digit":"dp","dp-game-theory":"dp","dp-optimal-bst":"dp","dp-job-scheduling":"dp","dp-longest-arithmetic-seq":"dp","graph-floyd-warshall":"shortest","graph-tarjan-scc":"graphsadv","graph-eulerian":"graphsadv","graph-coloring-greedy":"graphsadv","graph-bipartite-coloring":"graphs","graph-2sat":"graphsadv","string-manacher":"strings","string-rolling-hash":"strings","string-suffix-array":"strings","string-suffix-automaton":"strings","steiner-tree":"graphsadv","np-reductions":"graphsadv","heap-binary":"heaps","heap-sort-algorithm":"heaps","priority-queue-array":"heaps","queue-using-stacks":"stacks","fenwick-bit":"range","segment-tree-merge":"range","tree-morris-traversal":"trees","tree-iterative-traversals":"trees","euler-tour-flatten":"trees",trie:"strings","subsets-power-set":"recursion","permutations-backtrack":"recursion","combinations-backtrack":"recursion","n-queens-backtrack":"recursion","recursion-tail-call":"recursion","math-pow-fast-exponentiation":"math","math-modular-inverse-fermat":"math","strassen-matrix-mult":"math","dp-matrix-exponentiation":"dp","minimax-game-theory":"dp","dijkstra-on-grid":"shortest","dijkstra-with-path":"shortest","dijkstra-stops":"shortest","johnson-all-pairs":"shortest","kahn-topological-sort":"graphs","topological-sort-dfs":"graphs","mst-prim":"mst","kruskals-algorithm":"mst","mst-boruvka":"mst","kosaraju-2pass":"graphsadv","tarjan-scc-algorithm":"graphsadv","tarjan-articulation":"graphsadv","red-black-tree":"trees","splay-tree":"trees","treap-randomized-bst":"trees","skip-list":"linked","union-find-data-structure":"unionfind","quickselect-deterministic":"sorting","heaps-median-from-stream":"heaps","kmp-failure-function":"strings","lis-patience-sorting":"dp","edit-distance-algorithm":"dp","floyd-cycle-detection":"linked","random-reservoir-stream":"misc","palindrome-eertree":"strings","red-black-tree-properties":"trees","heaps-skew-leftist":"heaps","quadtree-spatial":"trees","link-cut-tree":"trees","persistent-segment-tree":"range","skiplist-concurrent":"linked","string-z-function":"strings","sliding-window-medians":"arrays","interval-scheduling":"misc","set-cover-greedy":"misc","graph-eulerian-path-circuit":"graphsadv","dp-state-compression":"dp","dijkstra-fibonacci-heap":"shortest","graph-bridges-articulation":"graphsadv","dp-recursion-vs-iteration":"dp","dp-knuth-optimization":"dp","string-trie-radix":"strings","queue-priority-fair-sched":"heaps","insertion-sort-algorithm":"sorting","kmp-deep-dive":"strings","kahn-cycle-detect":"graphs","lowest-common-ancestor-bst":"trees","median-of-medians":"sorting","meet-in-the-middle":"arrays","misra-gries":"arrays","master-theorem":"recursion","network-bridge-finding":"graphsadv","mst-rerooting":"mst","mo-on-trees":"graphsadv","selection-sort-algorithm":"sorting","sparse-table-rmq":"range","range-sum-2d":"range","range-update-range-query":"range","topk-streaming":"heaps","strongly-connected":"graphsadv","prim-vs-kruskal":"mst","topo-shortest-dag":"shortest","tortoise-and-hare-multi":"linked","pigeonhole-principle":"arrays","random-weighted-sampling":"arrays"},Fe={sorting:"bars",searching:"scatter",arrays:"bars",stacks:"bars",linked:"network",trees:"tree",heaps:"tree",hashing:"heat",range:"matrix",graphs:"network",shortest:"network",mst:"network",unionfind:"network",graphsadv:"network",dp:"matrix",recursion:"tree",strings:"bits",bitwise:"bits",math:"field",systems:"rings",misc:"scatter"},Re=[[/two.?pointer|sliding.?window|window|prefix|kadane|subarray/i,"bars"],[/binary.?search|search|peak|find/i,"scatter"],[/tree|bst|trie|heap|avl|splay|treap|b-?tree|segment|fenwick/i,"tree"],[/hash|bloom|cuckoo|probing|cache|lru/i,"heat"],[/dp|knapsack|edit.?distance|subseq|lis|lcs|matrix.?exp/i,"matrix"],[/graph|bfs|dfs|dijkstra|bellman|floyd|topolog|scc|flow|kahn|prim|kruskal|union|mst/i,"network"],[/recursion|backtrack|n-?queens|permut|combinat|subset|power.?set/i,"tree"],[/string|kmp|rabin|manacher|suffix|aho|boyer|z-?(algo|function)|palindrome/i,"bits"],[/xor|bit|gray.?code|mask/i,"bits"],[/sieve|gcd|prime|modular|number|geom|sweep|hull|sampl|reservoir|fourier|fft/i,"field"],[/sort|partition|quickselect|merge|bubble|insertion|selection|radix|counting|heap.?sort/i,"bars"]];function De(i,d){for(const[o,n]of Re)if(o.test(i))return n;return Fe[d]||"scatter"}function _(i){var o;if(D[i])return D[i];const d=(o=x[i])==null?void 0:o.module;if(d&&R[d])return R[d];if(d){if(d.startsWith("graphs"))return"graphs";if(d.startsWith("trees"))return"trees";if(d.startsWith("dp"))return"dp";if(d.startsWith("arrays"))return"arrays";if(d.startsWith("strings"))return"strings";if(d.startsWith("math"))return"math";if(d.startsWith("sorting"))return"sorting";if(d.startsWith("cs-"))return"systems"}return"misc"}const P=["var(--accent)","var(--hue-violet)","var(--hue-sky)","var(--hue-pink)","var(--hue-mint)","var(--medium)","var(--hard)","var(--warning)","var(--easy)"];function B(i){const d=W.indexOf(i);return d<0?"var(--accent)":P[d*4%P.length]}function I(i){return!!(f[i]&&v[f[i]]||qe(i))}function Pe(i){return!!(v[i]||f[i]&&v[f[i]])}function He({kind:i,accent:d}){const o=d,n="var(--text-dim)",h={width:"100%",height:"100%",preserveAspectRatio:"xMidYMid meet","aria-hidden":!0};switch(i){case"bars":{const r=[22,38,14,46,30,52,18,42];return e.jsx("svg",{viewBox:"0 0 120 60",...h,children:r.map((t,a)=>e.jsxs("rect",{x:6+a*14,y:56-t,width:"9",height:t,rx:"1.5",fill:a%2?o:n,opacity:a%2?.9:.45,children:[e.jsx("animate",{attributeName:"height",values:`${t};${t*.5};${t}`,dur:"2.4s",begin:`${a*.12}s`,repeatCount:"indefinite"}),e.jsx("animate",{attributeName:"y",values:`${56-t};${56-t*.5};${56-t}`,dur:"2.4s",begin:`${a*.12}s`,repeatCount:"indefinite"})]},a))})}case"search":{const r=[10,24,38,52,66,80,94,108];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[r.map((t,a)=>e.jsx("rect",{x:t,y:24,width:"10",height:"12",rx:"2",fill:n,opacity:"0.4"},a)),e.jsx("rect",{x:"52",y:"22",width:"10",height:"16",rx:"2",fill:o,children:e.jsx("animate",{attributeName:"x",values:"10;108;52",dur:"3s",repeatCount:"indefinite"})}),e.jsx("path",{d:"M10 48 H108",stroke:n,strokeWidth:"1",opacity:"0.3"})]})}case"window":return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[[...Array(8)].map((r,t)=>e.jsx("rect",{x:8+t*14,y:22,width:"10",height:"16",rx:"2",fill:n,opacity:"0.4"},t)),e.jsx("rect",{x:"8",y:"18",width:"38",height:"24",rx:"4",fill:"none",stroke:o,strokeWidth:"2",children:e.jsx("animate",{attributeName:"x",values:"8;64;8",dur:"3.2s",repeatCount:"indefinite"})})]});case"stack":return e.jsx("svg",{viewBox:"0 0 120 60",...h,children:[0,1,2,3].map(r=>e.jsx("rect",{x:38,y:44-r*11,width:"44",height:"9",rx:"2",fill:r===3?o:n,opacity:r===3?.95:.5,children:r===3&&e.jsx("animate",{attributeName:"y",values:"-10;11;11",dur:"2.6s",repeatCount:"indefinite"})},r))});case"list":{const r=[8,38,68,98];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[r.map((t,a)=>e.jsxs("g",{children:[e.jsx("rect",{x:t,y:22,width:"18",height:"16",rx:"3",fill:a===0?o:n,opacity:a===0?.95:.55}),a<3&&e.jsx("path",{d:`M${t+18} 30 H${t+30}`,stroke:o,strokeWidth:"1.6",opacity:"0.8"})]},a)),e.jsx("circle",{cx:"6",cy:"30",r:"3",fill:o,children:e.jsx("animate",{attributeName:"cx",values:"6;112;6",dur:"3s",repeatCount:"indefinite"})})]})}case"tree":{const r=[[60,12],[34,32],[86,32],[20,52],[48,52],[100,52]],t=[[0,1],[0,2],[1,3],[1,4],[2,5]];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[t.map(([a,l],s)=>e.jsx("line",{x1:r[a][0],y1:r[a][1],x2:r[l][0],y2:r[l][1],stroke:n,strokeWidth:"1.4",opacity:"0.5"},s)),r.map(([a,l],s)=>e.jsx("circle",{cx:a,cy:l,r:"6",fill:s===0?o:n,opacity:s===0?.95:.6,children:e.jsx("animate",{attributeName:"r",values:"6;7.5;6",dur:"2.4s",begin:`${s*.2}s`,repeatCount:"indefinite"})},s))]})}case"heap":{const r=[[60,12],[38,34],[82,34],[24,54],[52,54],[96,54]],t=[[0,1],[0,2],[1,3],[1,4],[2,5]];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[t.map(([a,l],s)=>e.jsx("line",{x1:r[a][0],y1:r[a][1],x2:r[l][0],y2:r[l][1],stroke:n,strokeWidth:"1.4",opacity:"0.5"},s)),r.map(([a,l],s)=>e.jsx("circle",{cx:a,cy:l,r:"7",fill:s===0?o:n,opacity:s===0?.95:.55},s)),e.jsxs("circle",{cx:60,cy:12,r:"7",fill:"none",stroke:o,strokeWidth:"2",children:[e.jsx("animate",{attributeName:"r",values:"7;11;7",dur:"2.2s",repeatCount:"indefinite"}),e.jsx("animate",{attributeName:"opacity",values:"0.9;0;0.9",dur:"2.2s",repeatCount:"indefinite"})]})]})}case"ring":return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[e.jsx("circle",{cx:60,cy:30,r:20,fill:"none",stroke:n,strokeWidth:"1.4",opacity:"0.4"}),[...Array(8)].map((s,u)=>{const p=u/8*Math.PI*2-Math.PI/2;return e.jsx("circle",{cx:60+Math.cos(p)*20,cy:30+Math.sin(p)*20,r:"4",fill:u%3===0?o:n,opacity:u%3===0?.9:.5},u)}),e.jsx("circle",{cx:80,cy:30,r:"4.5",fill:o,children:e.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0 60 30",to:"360 60 30",dur:"4s",repeatCount:"indefinite"})})]});case"segbars":return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[[...Array(8)].map((r,t)=>e.jsx("rect",{x:6+t*14,y:44,width:"10",height:"10",rx:"1.5",fill:n,opacity:"0.5"},t)),[...Array(4)].map((r,t)=>e.jsx("rect",{x:6+t*28,y:28,width:"24",height:"10",rx:"1.5",fill:n,opacity:"0.4"},t)),e.jsx("rect",{x:"6",y:"12",width:"108",height:"10",rx:"1.5",fill:o,opacity:"0.85",children:e.jsx("animate",{attributeName:"opacity",values:"0.4;0.9;0.4",dur:"2.4s",repeatCount:"indefinite"})})]});case"graph":{const r=[[24,16],[62,12],[98,26],[40,44],[82,48]],t=[[0,1],[1,2],[0,3],[1,3],[2,4],[3,4]];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[t.map(([a,l],s)=>e.jsx("line",{x1:r[a][0],y1:r[a][1],x2:r[l][0],y2:r[l][1],stroke:n,strokeWidth:"1.4",opacity:"0.5"},s)),r.map(([a,l],s)=>e.jsx("circle",{cx:a,cy:l,r:"6",fill:s===0?o:n,opacity:s===0?.95:.6,children:e.jsx("animate",{attributeName:"fill",values:`${n};${o};${n}`,dur:"3s",begin:`${s*.5}s`,repeatCount:"indefinite"})},s))]})}case"paths":{const r=[[14,30],[44,14],[44,46],[78,30],[106,30]],t=[[0,1],[0,2],[1,3],[2,3],[3,4]];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[t.map(([a,l],s)=>e.jsx("line",{x1:r[a][0],y1:r[a][1],x2:r[l][0],y2:r[l][1],stroke:n,strokeWidth:"1.4",opacity:"0.45"},s)),e.jsx("polyline",{points:[r[0],r[1],r[3],r[4]].map(([a,l])=>`${a},${l}`).join(" "),fill:"none",stroke:o,strokeWidth:"2.4",strokeLinecap:"round",strokeDasharray:"80",strokeDashoffset:"80",children:e.jsx("animate",{attributeName:"stroke-dashoffset",values:"80;0;0;80",dur:"3.4s",repeatCount:"indefinite"})}),r.map(([a,l],s)=>e.jsx("circle",{cx:a,cy:l,r:"5",fill:s===0||s===4?o:n,opacity:s===0||s===4?.95:.55},s))]})}case"mst":{const r=[[20,18],[58,12],[96,22],[34,48],[80,50]],t=[[0,1],[1,2],[0,3],[2,4]],a=[[1,3],[3,4]];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[a.map(([l,s],u)=>e.jsx("line",{x1:r[l][0],y1:r[l][1],x2:r[s][0],y2:r[s][1],stroke:n,strokeWidth:"1.2",opacity:"0.3",strokeDasharray:"3 3"},`e${u}`)),t.map(([l,s],u)=>e.jsx("line",{x1:r[l][0],y1:r[l][1],x2:r[s][0],y2:r[s][1],stroke:o,strokeWidth:"2.2",opacity:"0.85",children:e.jsx("animate",{attributeName:"opacity",values:"0.15;0.9;0.85",dur:"2.8s",begin:`${u*.35}s`,repeatCount:"indefinite"})},`t${u}`)),r.map(([l,s],u)=>e.jsx("circle",{cx:l,cy:s,r:"5.5",fill:o,opacity:"0.85"},u))]})}case"dsu":{const r=[[28,16],[92,16]],t=[[14,44],[40,44],[78,44],[106,44]];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[e.jsx("line",{x1:28,y1:16,x2:14,y2:44,stroke:o,strokeWidth:"1.8",opacity:"0.7"}),e.jsx("line",{x1:28,y1:16,x2:40,y2:44,stroke:o,strokeWidth:"1.8",opacity:"0.7"}),e.jsx("line",{x1:92,y1:16,x2:78,y2:44,stroke:n,strokeWidth:"1.8",opacity:"0.5"}),e.jsx("line",{x1:92,y1:16,x2:106,y2:44,stroke:n,strokeWidth:"1.8",opacity:"0.5"}),r.map(([a,l],s)=>e.jsx("circle",{cx:a,cy:l,r:"6.5",fill:s===0?o:n,opacity:s===0?.95:.6},`r${s}`)),t.map(([a,l],s)=>e.jsx("circle",{cx:a,cy:l,r:"5",fill:s<2?o:n,opacity:s<2?.7:.5},`k${s}`)),e.jsx("line",{x1:40,y1:44,x2:78,y2:44,stroke:o,strokeWidth:"1.6",strokeDasharray:"3 3",opacity:"0",children:e.jsx("animate",{attributeName:"opacity",values:"0;0.9;0",dur:"3s",repeatCount:"indefinite"})})]})}case"grid":return e.jsx("svg",{viewBox:"0 0 120 60",...h,children:[...Array(4)].map((r,t)=>[...Array(7)].map((a,l)=>{const s=t===0||l===0||t<=l&&(t+l)%3===0;return e.jsx("rect",{x:6+l*16,y:4+t*14,width:"13",height:"11",rx:"2",fill:s?o:n,opacity:s?.85:.3,children:s&&e.jsx("animate",{attributeName:"opacity",values:"0.2;0.85;0.85",dur:"2.6s",begin:`${(t+l)*.1}s`,repeatCount:"indefinite"})},`${t}-${l}`)}))});case"rectree":{const r=[[60,10],[34,30],[86,30],[20,50],[48,50],[74,50],[100,50]],t=[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[t.map(([a,l],s)=>e.jsx("line",{x1:r[a][0],y1:r[a][1],x2:r[l][0],y2:r[l][1],stroke:o,strokeWidth:"1.4",opacity:"0.4",children:e.jsx("animate",{attributeName:"opacity",values:"0.1;0.8;0.1",dur:"2.8s",begin:`${s*.18}s`,repeatCount:"indefinite"})},s)),r.map(([a,l],s)=>e.jsx("circle",{cx:a,cy:l,r:"4.5",fill:s===0?o:n,opacity:s===0?.95:.55},s))]})}case"text":{const r=["A","B","A","B","A","C","A","B"];return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[r.map((t,a)=>e.jsxs("g",{children:[e.jsx("rect",{x:6+a*14,y:20,width:"11",height:"16",rx:"2",fill:n,opacity:"0.25"}),e.jsx("text",{x:11.5+a*14,y:32,fontSize:"9",fontFamily:"var(--mono)",textAnchor:"middle",fill:n,opacity:"0.8",children:t})]},a)),e.jsx("rect",{x:"6",y:"18",width:"25",height:"20",rx:"3",fill:"none",stroke:o,strokeWidth:"2",children:e.jsx("animate",{attributeName:"x",values:"6;81;6",dur:"3.4s",repeatCount:"indefinite"})})]})}case"bits":{const r=[1,0,1,1,0,0,1,0];return e.jsx("svg",{viewBox:"0 0 120 60",...h,children:r.map((t,a)=>e.jsxs("g",{children:[e.jsx("rect",{x:6+a*14,y:20,width:"11",height:"18",rx:"2",fill:t?o:n,opacity:t?.85:.3,children:e.jsx("animate",{attributeName:"opacity",values:t?"0.85;0.35;0.85":"0.3;0.6;0.3",dur:"2.6s",begin:`${a*.15}s`,repeatCount:"indefinite"})}),e.jsx("text",{x:11.5+a*14,y:33,fontSize:"9",fontFamily:"var(--mono)",textAnchor:"middle",fill:"var(--bg)",opacity:t?.9:0,children:t})]},a))})}case"numline":return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[e.jsx("line",{x1:"8",y1:"30",x2:"112",y2:"30",stroke:n,strokeWidth:"1.4",opacity:"0.5"}),[...Array(8)].map((r,t)=>e.jsxs("g",{children:[e.jsx("line",{x1:12+t*13,y1:"26",x2:12+t*13,y2:"34",stroke:n,strokeWidth:"1.2",opacity:"0.5"}),(t===2||t===3||t===5||t===7)&&e.jsx("circle",{cx:12+t*13,cy:"30",r:"4",fill:o,opacity:"0.9",children:e.jsx("animate",{attributeName:"r",values:"2;5;2",dur:"2.4s",begin:`${t*.2}s`,repeatCount:"indefinite"})})]},t))]});case"nodes":{const s=[...Array(6)].map((u,p)=>{const m=p/6*Math.PI*2;return[60+Math.cos(m)*20,30+Math.sin(m)*20]});return e.jsxs("svg",{viewBox:"0 0 120 60",...h,children:[s.map(([u,p],m)=>e.jsx("line",{x1:60,y1:30,x2:u,y2:p,stroke:n,strokeWidth:"1.2",opacity:"0.4"},m)),s.map(([u,p],m)=>e.jsx("circle",{cx:u,cy:p,r:"4.5",fill:n,opacity:"0.6",children:e.jsx("animate",{attributeName:"fill",values:`${n};${o};${n}`,dur:"3s",begin:`${m*.4}s`,repeatCount:"indefinite"})},m)),e.jsx("circle",{cx:60,cy:30,r:"6",fill:o,opacity:"0.95"})]})}case"cells":default:return e.jsx("svg",{viewBox:"0 0 120 60",...h,children:[...Array(8)].map((r,t)=>e.jsx("rect",{x:6+t*14,y:22,width:"11",height:"16",rx:"2",fill:t%3===0?o:n,opacity:t%3===0?.85:.4,children:e.jsx("animate",{attributeName:"opacity",values:"0.3;0.85;0.3",dur:"2.6s",begin:`${t*.12}s`,repeatCount:"indefinite"})},t))})}}function V(){const i={};for(const[d,o]of Object.entries(z)){const n=_(d);(i[n]||(i[n]=[])).push([d,o])}for(const d of Object.keys(i))i[d].sort((o,n)=>(o[1].title||"").localeCompare(n[1].title||""));return i}function Le(){const[i,d]=g.useState(""),o=g.useMemo(()=>V(),[]),n=g.useMemo(()=>W.filter(t=>{var a;return(a=o[t])==null?void 0:a.length}),[o]),h=i.trim().toLowerCase(),r=g.useMemo(()=>{var a;if(!h)return null;const t=[];for(const l of n)for(const[s,u]of o[l]){const p=(((a=x[s])==null?void 0:a.blurb)||"").toLowerCase();((u.title||"").toLowerCase().includes(h)||p.includes(h)||s.includes(h))&&t.push([l,s,u])}return t},[h,n,o]);return e.jsxs("div",{className:"learn-container viz-gallery-container",children:[e.jsxs("div",{className:"learn-header",children:[e.jsxs(b,{to:"/learning",className:"learn-crumb",children:[e.jsx(N,{size:13})," ",e.jsx("span",{children:"Learning"}),e.jsx("span",{className:"learn-crumb-sep",children:"/"}),e.jsx("span",{className:"learn-crumb-here",children:"Visualize"})]}),e.jsx("h1",{className:"learn-title",children:"Visualize"}),e.jsx("p",{className:"learn-sub",children:"Pick a data structure or algorithm family and step through it frame by frame."}),e.jsxs("div",{className:"viz-search",children:[e.jsx(se,{size:14,className:"viz-search-icon","aria-hidden":"true"}),e.jsx("input",{type:"text",value:i,onChange:t=>d(t.target.value),placeholder:"Search every visualization…",className:"viz-search-input","aria-label":"Filter visualizations"}),i&&e.jsx("button",{type:"button",className:"viz-search-clear",onClick:()=>d(""),"aria-label":"Clear search",children:e.jsx(ne,{size:14})})]}),h&&e.jsxs("p",{className:"viz-search-meta",children:[r.length," match",r.length===1?"":"es"," across ",new Set(r.map(t=>t[0])).size," categor",new Set(r.map(t=>t[0])).size===1?"y":"ies","."]})]}),h?r.length===0?e.jsxs("div",{className:"viz-empty",children:[e.jsxs("p",{children:['No visualizations match "',i,'".']}),e.jsx("button",{type:"button",className:"viz-empty-clear",onClick:()=>d(""),children:"Clear search"})]}):e.jsx("div",{className:"viz-result-grid",children:r.map(([t,a,l])=>{var s;return e.jsxs(b,{to:`/visualize/${a}`,className:"viz-result-card",style:{"--card-accent":B(t)},children:[e.jsx(oe,{size:15}),e.jsx("span",{className:"viz-result-title",children:l.title}),e.jsx("span",{className:"viz-result-cat",children:(s=S[t])==null?void 0:s.label}),I(a)&&e.jsxs("span",{className:"viz-live-tag",children:[e.jsx(F,{size:9})," Live"]}),e.jsx(j,{size:14,className:"viz-result-arrow"})]},a)})}):e.jsx("div",{className:"viz-cat-grid",children:n.map(t=>{const a=S[t],l=o[t],s=l.filter(([m])=>I(m)).length,u=a.icon,p=B(t);return e.jsxs(b,{to:`/visualize/c/${t}`,className:"viz-cat-card",style:{"--card-accent":p},children:[e.jsx("span",{className:"viz-cat-stripe","aria-hidden":"true"}),e.jsx("span",{className:"viz-cat-flourish","aria-hidden":"true",children:e.jsx(He,{kind:a.preview,accent:p})}),e.jsxs("span",{className:"viz-cat-head",children:[e.jsx("span",{className:"viz-cat-iconbox",children:u&&e.jsx(u,{size:18})}),e.jsx("span",{className:"viz-cat-title",children:a.label})]}),e.jsx("span",{className:"viz-cat-blurb",children:a.blurb}),e.jsxs("span",{className:"viz-cat-tags",children:[e.jsxs("span",{className:"viz-cat-tag",children:[l.length," viz"]}),s>0&&e.jsxs("span",{className:"viz-cat-tag live",children:[e.jsx(F,{size:9})," ",s," interactive"]}),e.jsx("span",{className:"viz-cat-cta",children:e.jsx(j,{size:14})})]})]},t)})})]})}function Me({category:i}){const d=S[i],n=g.useMemo(()=>V(),[])[i]||[],h=B(i);return d?e.jsxs("div",{className:"learn-container viz-gallery-container",style:{"--card-accent":h},children:[e.jsxs("div",{className:"learn-header",children:[e.jsxs(b,{to:"/visualize",className:"learn-crumb",children:[e.jsx(N,{size:13})," ",e.jsx("span",{children:"Visualize"}),e.jsx("span",{className:"learn-crumb-sep",children:"/"}),e.jsx("span",{className:"learn-crumb-here",children:d.label})]}),e.jsx("h1",{className:"learn-title",children:d.label}),e.jsx("p",{className:"learn-sub",children:d.blurb})]}),n.length===0?e.jsxs("div",{className:"viz-empty",children:[e.jsx("p",{children:"No visualizations in this category yet."}),e.jsx(b,{to:"/visualize",className:"viz-empty-clear",children:"Back to all categories"})]}):e.jsx("div",{className:"viz-member-grid",children:n.map(([r,t])=>{var a;return e.jsxs(b,{to:`/visualize/${r}`,className:"viz-member-card",style:{"--card-accent":h},children:[e.jsx("span",{className:"viz-member-preview",children:e.jsx(ae,{seed:t.title||r,kind:De(r,i)})}),e.jsxs("span",{className:"viz-member-body",children:[e.jsx("span",{className:"viz-member-title",children:t.title}),((a=x[r])==null?void 0:a.blurb)&&e.jsx("span",{className:"viz-member-blurb",children:x[r].blurb}),e.jsxs("span",{className:"viz-member-tags",children:[I(r)&&e.jsxs("span",{className:"viz-cat-tag live",children:[e.jsx(H,{size:9})," Interactive"]}),Pe(r)&&e.jsxs("span",{className:"viz-cat-tag",children:[e.jsx(w,{size:9})," Editable code"]}),$(t)>0&&e.jsxs("span",{className:"viz-cat-tag",children:[$(t)," steps"]})]})]}),e.jsx(j,{size:15,className:"viz-member-arrow"})]},r)})})]}):e.jsx("div",{className:"learn-container viz-gallery-container",children:e.jsxs("div",{className:"learn-header",children:[e.jsxs(b,{to:"/visualize",className:"learn-crumb",children:[e.jsx(N,{size:13})," ",e.jsx("span",{children:"Visualize"}),e.jsx("span",{className:"learn-crumb-sep",children:"/"}),e.jsx("span",{className:"learn-crumb-here",children:"Not found"})]}),e.jsx("h1",{className:"learn-title",children:"Not found"}),e.jsxs("p",{className:"learn-sub",children:['No category matches "',i,'".']})]})})}const tt=Object.freeze(Object.defineProperty({__proto__:null,default:Te},Symbol.toStringTag,{value:"Module"}));export{v as I,tt as V};
