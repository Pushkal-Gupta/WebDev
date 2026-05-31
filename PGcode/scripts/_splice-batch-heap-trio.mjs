#!/usr/bin/env node
// Atomic splice: inject heap-trio viz fns before `export const RICH_CONTENT = {`
// and corresponding problem entries before its closing `};`.
// Skips top-k-frequent-elements — that slug already lives in the file with
// a bucket-sort solution; touching it would clobber existing work.
// Re-runnable: detects already-spliced state and exits cleanly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'src', 'content', 'problemContent.js');

const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('function kthLargestStreamViz(')
  || src.includes("'kth-largest-element-in-a-stream':")
  || src.includes('"kth-largest-element-in-a-stream":')
  || src.includes('function lastStoneWeightViz(')
  || src.includes("'last-stone-weight':")
  || src.includes('"last-stone-weight":')) {
  console.log('Already spliced — nothing to do.');
  process.exit(0);
}

const VIZ_BLOCK = `function kthLargestStreamViz() {
  const k = 3;
  const initial = [4, 5, 8, 2];
  const stream = [3, 5, 10, 9, 4];
  const frames = [];

  frames.push({
    array: initial,
    chip: [
      { label: 'k', value: String(k) },
      { label: 'init', value: '[' + initial.join(',') + ']' },
      { label: 'stream', value: '[' + stream.join(',') + ']', tone: 'violet' },
    ],
    caption: 'KthLargest maintains a min-heap of size k. The root is always the kth-largest seen so far: only the top k values are kept, and among those the smallest sits at the root — that is exactly the kth largest overall.',
  });

  const heap = [];
  const heapView = () => '[' + heap.slice().sort((a, b) => a - b).join(',') + ']';
  const push = (v) => {
    heap.push(v);
    heap.sort((a, b) => a - b);
  };
  const pop = () => heap.shift();

  for (let i = 0; i < initial.length; i++) {
    const v = initial[i];
    if (heap.length < k) {
      push(v);
      frames.push({
        array: initial,
        highlights: { [i]: 'current' },
        chip: [
          { label: 'add', value: String(v) },
          { label: 'heap', value: heapView() },
          { label: 'size', value: heap.length + '/' + k, tone: 'violet' },
        ],
        caption: 'Constructor pass: heap not yet full (size ' + heap.length + '/' + k + '). Push ' + v + ' unconditionally — we still need more elements before we can start evicting.',
      });
    } else {
      if (v > heap[0]) {
        const evicted = pop();
        push(v);
        frames.push({
          array: initial,
          highlights: { [i]: 'match' },
          chip: [
            { label: 'add', value: String(v) },
            { label: 'evict', value: String(evicted), tone: 'pink' },
            { label: 'heap', value: heapView() },
          ],
          caption: 'Heap full. ' + v + ' > root ' + evicted + ', so ' + v + ' belongs in the top-k. Pop ' + evicted + ', push ' + v + '. New root = ' + heap[0] + ' is the running kth largest.',
        });
      } else {
        frames.push({
          array: initial,
          highlights: { [i]: 'current' },
          chip: [
            { label: 'add', value: String(v) },
            { label: 'root', value: String(heap[0]) },
            { label: 'heap', value: heapView() },
          ],
          caption: v + ' <= root ' + heap[0] + ' — it can never reach the top-k, discard. Heap unchanged.',
        });
      }
    }
  }

  frames.push({
    array: initial,
    chip: [
      { label: 'init done', value: 'kth largest = ' + heap[0], tone: 'violet' },
      { label: 'heap', value: heapView() },
    ],
    caption: 'Constructor finished. The root of the min-heap is the kth largest of all values seen so far. Now process the add() stream.',
  });

  for (let i = 0; i < stream.length; i++) {
    const v = stream[i];
    if (heap.length < k) {
      push(v);
      frames.push({
        array: stream,
        highlights: { [i]: 'current' },
        chip: [
          { label: 'add(' + v + ')', value: 'push' },
          { label: 'heap', value: heapView() },
          { label: 'return', value: String(heap[0]), tone: 'pink' },
        ],
        caption: 'add(' + v + ') with heap still under capacity — push directly. Return current root = ' + heap[0] + '.',
      });
    } else if (v > heap[0]) {
      const evicted = pop();
      push(v);
      frames.push({
        array: stream,
        highlights: { [i]: 'match' },
        chip: [
          { label: 'add(' + v + ')', value: 'evict ' + evicted },
          { label: 'heap', value: heapView() },
          { label: 'return', value: String(heap[0]), tone: 'pink' },
        ],
        caption: 'add(' + v + '): beats root ' + evicted + '. Pop ' + evicted + ', push ' + v + ', heap restructures in O(log k). Return new root = ' + heap[0] + '.',
      });
    } else {
      frames.push({
        array: stream,
        highlights: { [i]: 'current' },
        chip: [
          { label: 'add(' + v + ')', value: 'skip' },
          { label: 'heap', value: heapView() },
          { label: 'return', value: String(heap[0]), tone: 'pink' },
        ],
        caption: 'add(' + v + '): ' + v + ' <= root ' + heap[0] + '. Cannot enter top-k. Heap unchanged, return root = ' + heap[0] + '.',
      });
    }
  }

  frames.push({
    array: stream,
    chip: [
      { label: 'final kth largest', value: String(heap[0]), tone: 'pink' },
      { label: 'heap', value: heapView() },
      { label: 'cost', value: 'O(log k) per add, O(n log k) build', tone: 'violet' },
    ],
    caption: 'Stream consumed. Min-heap of size k is the optimal data structure here: a sorted list would cost O(k) per insert; a max-heap would force scanning all entries each call. The root-as-answer trick collapses every add() to a single O(log k) operation.',
  });

  return { renderer: 'array', title: 'Kth Largest in a Stream — min-heap of size k', frames };
}

function lastStoneWeightViz() {
  const stones = [2, 7, 4, 1, 8, 1];
  const frames = [];

  frames.push({
    array: stones.slice(),
    chip: [
      { label: 'stones', value: '[' + stones.join(',') + ']' },
      { label: 'rule', value: 'smash two heaviest each round', tone: 'violet' },
      { label: 'goal', value: 'weight of the last stone (0 if none)' },
    ],
    caption: 'Each round: pick the two heaviest stones x >= y. If x == y both vanish; else a new stone of weight (x - y) goes back in. Repeat until 0 or 1 stones remain. A max-heap makes "two heaviest" an O(log n) operation per round.',
  });

  const heap = stones.slice().sort((a, b) => b - a);
  const heapView = () => '[' + heap.slice().sort((a, b) => b - a).join(',') + ']';

  frames.push({
    array: heap.slice(),
    chip: [
      { label: 'max-heap', value: heapView(), tone: 'violet' },
      { label: 'size', value: String(heap.length) },
    ],
    caption: 'Heapify all stones into a max-heap in O(n). Sibling order inside the heap is unspecified — only the root is guaranteed to be the maximum, which is all we need.',
  });

  let round = 1;
  while (heap.length > 1) {
    heap.sort((a, b) => b - a);
    const x = heap.shift();
    const y = heap.shift();
    frames.push({
      array: heap.slice(),
      chip: [
        { label: 'round', value: String(round) },
        { label: 'x', value: String(x), tone: 'pink' },
        { label: 'y', value: String(y), tone: 'violet' },
      ],
      caption: 'Round ' + round + ': pop the two heaviest stones x=' + x + ' and y=' + y + '. Two heap-pops cost O(log n) each.',
    });
    if (x !== y) {
      const diff = x - y;
      heap.push(diff);
      heap.sort((a, b) => b - a);
      frames.push({
        array: heap.slice(),
        highlights: { 0: 'match' },
        chip: [
          { label: 'smash', value: x + ' vs ' + y },
          { label: 'survivor', value: String(diff), tone: 'pink' },
          { label: 'heap', value: heapView() },
        ],
        caption: 'x > y, so the lighter stone is destroyed and the heavier loses y weight. Push the survivor (' + diff + ') back into the heap — another O(log n).',
      });
    } else {
      frames.push({
        array: heap.slice(),
        chip: [
          { label: 'smash', value: x + ' == ' + y, tone: 'pink' },
          { label: 'result', value: 'both stones destroyed' },
          { label: 'heap', value: heapView() },
        ],
        caption: 'Equal weights cancel out — both stones evaporate, nothing pushed back. Heap shrinks by 2.',
      });
    }
    round++;
  }

  const ans = heap.length === 0 ? 0 : heap[0];
  frames.push({
    array: heap.slice(),
    chip: [
      { label: 'answer', value: String(ans), tone: 'pink' },
      { label: 'remaining', value: heap.length === 0 ? 'none' : String(heap[0]) },
      { label: 'total cost', value: 'O(n log n)', tone: 'violet' },
    ],
    caption: 'Loop terminates with 0 or 1 stones. Return ' + ans + '. Each of up to n-1 rounds does O(log n) heap work, totaling O(n log n) — beats the O(n^2) per-round linear-scan baseline cleanly.',
  });

  return { renderer: 'array', title: 'Last Stone Weight — max-heap pairwise smash', frames };
}

`;

const ENTRY_BLOCK = `  'kth-largest-element-in-a-stream': {
    tags: ['heap', 'priority-queue', 'design', 'stream', 'data-stream'],
    companies: ['amazon', 'meta', 'google', 'microsoft', 'apple', 'bloomberg', 'uber'],
    viz: kthLargestStreamViz(),
    solutions: {
      python: {
        code: \`import heapq

class KthLargest:
    def __init__(self, k: int, nums: list[int]):
        self.k = k
        self.heap = []
        for v in nums:
            self.add(v)

    def add(self, val: int) -> int:
        if len(self.heap) < self.k:
            heapq.heappush(self.heap, val)
        elif val > self.heap[0]:
            heapq.heapreplace(self.heap, val)
        return self.heap[0]\`,
        complexity: { time: 'O(log k) per add, O(n log k) construct', space: 'O(k)' },
        approach: 'Min-heap of size k. heapreplace combines pop + push in a single sift, faster than separate heappop + heappush. Constructor reuses add() so the invariant is established by one code path.',
      },
      javascript: {
        code: \`class MinHeap {
  constructor() { this.a = []; }
  size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(v) {
    this.a.push(v);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p] <= this.a[i]) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  pop() {
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length) {
      this.a[0] = last;
      let i = 0, n = this.a.length;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let s = i;
        if (l < n && this.a[l] < this.a[s]) s = l;
        if (r < n && this.a[r] < this.a[s]) s = r;
        if (s === i) break;
        [this.a[s], this.a[i]] = [this.a[i], this.a[s]];
        i = s;
      }
    }
    return top;
  }
}

class KthLargest {
  constructor(k, nums) {
    this.k = k;
    this.heap = new MinHeap();
    for (const v of nums) this.add(v);
  }
  add(val) {
    if (this.heap.size() < this.k) {
      this.heap.push(val);
    } else if (val > this.heap.peek()) {
      this.heap.pop();
      this.heap.push(val);
    }
    return this.heap.peek();
  }
}\`,
        complexity: { time: 'O(log k) per add, O(n log k) construct', space: 'O(k)' },
        approach: 'JS lacks a built-in heap, so a 7-line binary-heap class earns its keep. push/pop both sift via bit-shift index math; swap-via-destructure stays terse without losing speed.',
      },
      java: {
        code: \`import java.util.PriorityQueue;

class KthLargest {
    private final PriorityQueue<Integer> heap;
    private final int k;

    public KthLargest(int k, int[] nums) {
        this.k = k;
        this.heap = new PriorityQueue<>(k);
        for (int v : nums) add(v);
    }

    public int add(int val) {
        if (heap.size() < k) {
            heap.offer(val);
        } else if (val > heap.peek()) {
            heap.poll();
            heap.offer(val);
        }
        return heap.peek();
    }
}\`,
        complexity: { time: 'O(log k) per add, O(n log k) construct', space: 'O(k)' },
        approach: 'PriorityQueue is a min-heap by default — exactly what we need. Sized at k so the underlying array does not grow past the working set. peek() before poll() avoids unnecessary heap work when val cannot displace the root.',
      },
      cpp: {
        code: \`#include <queue>
#include <vector>
using namespace std;

class KthLargest {
public:
    priority_queue<int, vector<int>, greater<int>> heap;
    int k;
    KthLargest(int k, vector<int>& nums) : k(k) {
        for (int v : nums) add(v);
    }
    int add(int val) {
        if ((int)heap.size() < k) {
            heap.push(val);
        } else if (val > heap.top()) {
            heap.pop();
            heap.push(val);
        }
        return heap.top();
    }
};\`,
        complexity: { time: 'O(log k) per add, O(n log k) construct', space: 'O(k)' },
        approach: 'priority_queue with greater<int> flips the default max-heap into a min-heap. Member-init list initializes k before the loop runs — the loop relies on this->k being set.',
      },
      c: {
        code: \`#include <stdlib.h>

typedef struct {
    int* a;
    int size;
    int cap;
    int k;
} KthLargest;

static void siftUp(int* a, int i) {
    while (i > 0) {
        int p = (i - 1) / 2;
        if (a[p] <= a[i]) break;
        int t = a[p]; a[p] = a[i]; a[i] = t;
        i = p;
    }
}

static void siftDown(int* a, int n, int i) {
    while (1) {
        int l = 2 * i + 1, r = 2 * i + 2, s = i;
        if (l < n && a[l] < a[s]) s = l;
        if (r < n && a[r] < a[s]) s = r;
        if (s == i) break;
        int t = a[s]; a[s] = a[i]; a[i] = t;
        i = s;
    }
}

int kthLargestAdd(KthLargest* obj, int val) {
    if (obj->size < obj->k) {
        obj->a[obj->size++] = val;
        siftUp(obj->a, obj->size - 1);
    } else if (val > obj->a[0]) {
        obj->a[0] = val;
        siftDown(obj->a, obj->size, 0);
    }
    return obj->a[0];
}

KthLargest* kthLargestCreate(int k, int* nums, int numsSize) {
    KthLargest* obj = (KthLargest*)malloc(sizeof(KthLargest));
    obj->k = k;
    obj->size = 0;
    obj->cap = k;
    obj->a = (int*)malloc(sizeof(int) * k);
    for (int i = 0; i < numsSize; i++) kthLargestAdd(obj, nums[i]);
    return obj;
}

void kthLargestFree(KthLargest* obj) {
    free(obj->a);
    free(obj);
}\`,
        complexity: { time: 'O(log k) per add, O(n log k) construct', space: 'O(k)' },
        approach: 'Manual binary heap on a fixed-size array of length k. Replace-root then siftDown saves an allocation vs pop-then-push. Caller owns lifetime via kthLargestFree to prevent leaks.',
      },
      go: {
        code: \`import "container/heap"

type IntHeap []int

func (h IntHeap) Len() int            { return len(h) }
func (h IntHeap) Less(i, j int) bool  { return h[i] < h[j] }
func (h IntHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *IntHeap) Push(x interface{}) { *h = append(*h, x.(int)) }
func (h *IntHeap) Pop() interface{} {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

type KthLargest struct {
    k    int
    heap *IntHeap
}

func Constructor(k int, nums []int) KthLargest {
    h := &IntHeap{}
    heap.Init(h)
    kl := KthLargest{k: k, heap: h}
    for _, v := range nums {
        kl.Add(v)
    }
    return kl
}

func (kl *KthLargest) Add(val int) int {
    if kl.heap.Len() < kl.k {
        heap.Push(kl.heap, val)
    } else if val > (*kl.heap)[0] {
        (*kl.heap)[0] = val
        heap.Fix(kl.heap, 0)
    }
    return (*kl.heap)[0]
}\`,
        complexity: { time: 'O(log k) per add, O(n log k) construct', space: 'O(k)' },
        approach: 'Implement heap.Interface on IntHeap, then container/heap does the sift work. heap.Fix(h, 0) after overwriting the root is a heap.Pop + heap.Push combined — one sift instead of two.',
      },
    },
  },
  'last-stone-weight': {
    tags: ['array', 'heap', 'priority-queue', 'simulation', 'greedy'],
    companies: ['amazon', 'google', 'microsoft', 'meta', 'apple', 'bloomberg'],
    viz: lastStoneWeightViz(),
    solutions: {
      python: {
        code: \`import heapq

class Solution:
    def lastStoneWeight(self, stones: list[int]) -> int:
        heap = [-s for s in stones]
        heapq.heapify(heap)
        while len(heap) > 1:
            x = -heapq.heappop(heap)
            y = -heapq.heappop(heap)
            if x != y:
                heapq.heappush(heap, -(x - y))
        return -heap[0] if heap else 0\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'Python only ships a min-heap. Negate every weight to fake a max-heap: smallest negative == largest positive. heapify is O(n); each round does two pops and an optional push, each O(log n).',
      },
      javascript: {
        code: \`class MaxHeap {
  constructor(arr = []) {
    this.a = arr.slice();
    for (let i = (this.a.length >> 1) - 1; i >= 0; i--) this._sift(i);
  }
  size() { return this.a.length; }
  push(v) {
    this.a.push(v);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p] >= this.a[i]) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  pop() {
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length) { this.a[0] = last; this._sift(0); }
    return top;
  }
  _sift(i) {
    const n = this.a.length;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let s = i;
      if (l < n && this.a[l] > this.a[s]) s = l;
      if (r < n && this.a[r] > this.a[s]) s = r;
      if (s === i) break;
      [this.a[s], this.a[i]] = [this.a[i], this.a[s]];
      i = s;
    }
  }
}

function lastStoneWeight(stones) {
  const h = new MaxHeap(stones);
  while (h.size() > 1) {
    const x = h.pop();
    const y = h.pop();
    if (x !== y) h.push(x - y);
  }
  return h.size() ? h.pop() : 0;
}\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'Constructor heapifies in O(n) by sifting from the last non-leaf down to 0. Each smash is two pops + at most one push — O(log n). The empty-heap branch returns 0 when stones perfectly cancel.',
      },
      java: {
        code: \`import java.util.PriorityQueue;
import java.util.Collections;

class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : stones) heap.offer(s);
        while (heap.size() > 1) {
            int x = heap.poll();
            int y = heap.poll();
            if (x != y) heap.offer(x - y);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }
}\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'Collections.reverseOrder() flips PriorityQueue into a max-heap. Building via per-element offer is O(n log n); heapify-from-array via PriorityQueue(Collection) would be O(n) but requires a List of Integer.',
      },
      cpp: {
        code: \`#include <queue>
#include <vector>
using namespace std;

class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        priority_queue<int> heap(stones.begin(), stones.end());
        while (heap.size() > 1) {
            int x = heap.top(); heap.pop();
            int y = heap.top(); heap.pop();
            if (x != y) heap.push(x - y);
        }
        return heap.empty() ? 0 : heap.top();
    }
};\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'priority_queue defaults to max-heap. Constructing from an iterator range runs make_heap in O(n) — strictly better than per-element push. top() then pop() because pop() returns void in the STL.',
      },
      c: {
        code: \`#include <stdlib.h>

static void siftDown(int* a, int n, int i) {
    while (1) {
        int l = 2 * i + 1, r = 2 * i + 2, m = i;
        if (l < n && a[l] > a[m]) m = l;
        if (r < n && a[r] > a[m]) m = r;
        if (m == i) break;
        int t = a[m]; a[m] = a[i]; a[i] = t;
        i = m;
    }
}

static void siftUp(int* a, int i) {
    while (i > 0) {
        int p = (i - 1) / 2;
        if (a[p] >= a[i]) break;
        int t = a[p]; a[p] = a[i]; a[i] = t;
        i = p;
    }
}

int lastStoneWeight(int* stones, int stonesSize) {
    int* h = (int*)malloc(sizeof(int) * stonesSize);
    int n = stonesSize;
    for (int i = 0; i < n; i++) h[i] = stones[i];
    for (int i = n / 2 - 1; i >= 0; i--) siftDown(h, n, i);
    while (n > 1) {
        int x = h[0];
        h[0] = h[--n];
        siftDown(h, n, 0);
        int y = h[0];
        h[0] = h[--n];
        siftDown(h, n, 0);
        if (x != y) {
            h[n++] = x - y;
            siftUp(h, n - 1);
        }
    }
    int ans = n == 0 ? 0 : h[0];
    free(h);
    return ans;
}\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'In-place binary heap on a malloced copy of stones. Bottom-up heapify costs O(n). Reusing the same buffer for push-after-pop means no realloc ever fires inside the smash loop.',
      },
      go: {
        code: \`import "container/heap"

type MaxHeap []int

func (h MaxHeap) Len() int            { return len(h) }
func (h MaxHeap) Less(i, j int) bool  { return h[i] > h[j] }
func (h MaxHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *MaxHeap) Push(x interface{}) { *h = append(*h, x.(int)) }
func (h *MaxHeap) Pop() interface{} {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func lastStoneWeight(stones []int) int {
    h := MaxHeap(append([]int(nil), stones...))
    heap.Init(&h)
    for h.Len() > 1 {
        x := heap.Pop(&h).(int)
        y := heap.Pop(&h).(int)
        if x != y {
            heap.Push(&h, x-y)
        }
    }
    if h.Len() == 0 {
        return 0
    }
    return h[0]
}\`,
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        approach: 'Reverse the Less comparator to get a max-heap. heap.Init is O(n). Copy stones up front so the caller-owned slice is not mutated by the in-place heapify.',
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
// Tokenizer: skip over string literals (', ", `) and // / /* */ comments
// so braces inside template strings do not throw off the count.
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
console.log('Spliced viz fns + 2 entries (kth-largest-stream, last-stone-weight) into ' + path.basename(FILE));
console.log('  skipped top-k-frequent-elements — slug already present in file');
console.log('  before: ' + src.length + ' bytes');
console.log('  after:  ' + out.length + ' bytes');
