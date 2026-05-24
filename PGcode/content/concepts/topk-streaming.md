---
slug: topk-streaming
module: arrays-searching
title: Top-K from a Stream
subtitle: Min-heap of size K for exact top-K; Misra-Gries / Count-Min for approximate streaming counts.
difficulty: Intermediate
position: 34
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Algorithms, 4th Edition — Priority Queues"
    url: "https://algs4.cs.princeton.edu/24pq/"
    type: book
  - title: "Top K Frequent Elements — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/top-k-frequent-elements-in-an-array/"
    type: blog
  - title: "highscalability.com — Sketches and Approximate Algorithms"
    url: "http://highscalability.com/blog/2012/4/5/big-data-counting-how-to-count-a-billion-distinct-objects-us.html"
    type: blog
status: published
---

## intro
"Top K" means: from a sequence of n items, return the K with the largest scores. When n fits in memory, sort or quick-select. When n is a stream — billions of clicks, tweets, log lines — neither approach works because you cannot hold n at once. The streaming answer is a min-heap of size K that keeps only the current top-K, replacing the smallest when a larger item arrives. For approximate counting of frequent items in a stream, Misra-Gries gives K-1 counters that surface every "heavy hitter."

## whyItMatters
Top-K is the shape of the most common analytics queries: top trending hashtags, top 10 slowest endpoints in the last hour, top 100 most-viewed pages today. A list of n = 10^10 events does not fit, but a list of K = 100 results does. The min-heap pattern is one of the canonical interview questions ("Top K Frequent Elements", "K closest points to origin") and the streaming variants (Misra-Gries, Space-Saving, Count-Min Sketch) are how real systems (Redis TOP-K, Twitter Heron, Apache Kafka Streams) actually compute it.

## intuition
For exact top-K from n items with n in memory: a heap of size K. Walk the items. If the heap has fewer than K, push. Else if the current item beats the heap's smallest (the root), pop and push. After n items, the heap holds exactly the top K. For a true stream where you cannot revisit, this is still optimal in space: O(K) instead of O(n). For approximate frequent items, Misra-Gries keeps K-1 (item, count) slots: on a hit increment the count, on a miss either fill an empty slot or decrement every existing count by 1.

## visualization
```
K=3, items arrive: 5, 1, 8, 3, 9, 2, 7
After 5: heap [5]
After 1: heap [1, 5]
After 8: heap [1, 5, 8]
After 3: 3 > 1 -> pop 1, push 3 -> heap [3, 5, 8]
After 9: 9 > 3 -> pop 3, push 9 -> heap [5, 8, 9]
After 2: 2 < 5 -> skip
After 7: 7 > 5 -> pop 5, push 7 -> heap [7, 8, 9]
Result: top 3 are 7, 8, 9.
```

## bruteForce
Sort all n items in O(n log n), take the last K. Or quick-select in expected O(n). Both require holding all n items. They are fine when n fits in memory; they are non-starters when n is unbounded or sharded across machines. Even on bounded inputs, when K is much smaller than n, the heap method's O(n log K) beats O(n log n) sorting for cache-friendly K (think K = 100, n = 10^9).

## optimal
Exact in one pass over a finite array or stream: min-heap of size K.
```
top_k(stream, K):
    h = []
    for x in stream:
        if len(h) < K: push(h, x)
        elif x > h[0]: replace_root(h, x)
    return sorted(h, reverse=True)
```

Approximate frequent items (Misra-Gries) — find all items with frequency > n/K:
```
misra_gries(stream, K):
    counters = {}
    for x in stream:
        if x in counters: counters[x] += 1
        elif len(counters) < K - 1: counters[x] = 1
        else:
            for k in list(counters): counters[k] -= 1
            counters = {k: v for k, v in counters.items() if v > 0}
    return counters  # candidates; verify with a second pass for exact counts
```

For top-K by frequency on a finite array: count with a hash map, then heap the (count, key) pairs.

## complexity
time: O(n log K) for the min-heap approach (each item is one O(log K) compare-and-replace). Misra-Gries is O(n) per element amortized — decrement-all looks like O(K) but happens at most n/K times.
space: O(K) auxiliary in both cases.
notes: For top-K frequencies with bounded value range, bucket-sort by count beats both at O(n). Quick-select on count pairs gets you exact top-K in expected O(n) time and O(distinct) space.

## pitfalls
- Using a max-heap by mistake: you want to discard the smallest of the current top-K, so the root must be the smallest — that means min-heap.
- Misra-Gries returns candidates, not exact counts. A second pass through the stream is needed if you need true frequencies.
- For top-K frequent elements, common bug: counting with a heap of size K but comparing by key instead of count.
- Stream order matters for approximate algorithms: Space-Saving is more accurate than Misra-Gries on skewed streams.
- Forgetting that ties on the boundary break determinism — two items with the same count compete for the last slot and the heap will pick whichever arrived first.

## interviewTips
- The classic prompt is "Top K Frequent Elements" — answer with min-heap of size K over (count, value) pairs in O(n log K), then mention bucket sort as the O(n) alternative.
- For "K closest points to origin", same template: min-heap of size K over (-distance, point).
- When the interviewer says "stream", switch vocabulary: mention min-heap if the stream is finite and you need exact, or Misra-Gries / Count-Min Sketch if it is unbounded and approximate is acceptable.
- Mention real systems: Redis TOPK uses HeavyKeeper; Spark uses TreeMap; Kafka Streams uses min-heaps inside a windowed aggregation.

## code.python
```python
import heapq
from collections import Counter

def top_k_stream(stream, k):
    h = []
    for x in stream:
        if len(h) < k:
            heapq.heappush(h, x)
        elif x > h[0]:
            heapq.heapreplace(h, x)
    return sorted(h, reverse=True)

def top_k_frequent(nums, k):
    counts = Counter(nums)
    h = []
    for val, cnt in counts.items():
        if len(h) < k: heapq.heappush(h, (cnt, val))
        elif cnt > h[0][0]: heapq.heapreplace(h, (cnt, val))
    return [v for _, v in sorted(h, reverse=True)]

def misra_gries(stream, k):
    counters = {}
    for x in stream:
        if x in counters: counters[x] += 1
        elif len(counters) < k - 1: counters[x] = 1
        else:
            for key in list(counters):
                counters[key] -= 1
                if counters[key] == 0: del counters[key]
    return counters
```

## code.javascript
```javascript
class MinHeap {
  constructor() { this.h = []; }
  size() { return this.h.length; }
  peek() { return this.h[0]; }
  push(x) {
    this.h.push(x);
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p] <= this.h[i]) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p;
    }
  }
  pop() {
    const top = this.h[0], last = this.h.pop();
    if (this.h.length) {
      this.h[0] = last;
      let i = 0;
      for (;;) {
        const l = 2*i+1, r = 2*i+2; let m = i;
        if (l < this.h.length && this.h[l] < this.h[m]) m = l;
        if (r < this.h.length && this.h[r] < this.h[m]) m = r;
        if (m === i) break;
        [this.h[m], this.h[i]] = [this.h[i], this.h[m]]; i = m;
      }
    }
    return top;
  }
}

function topKStream(stream, k) {
  const heap = new MinHeap();
  for (const x of stream) {
    if (heap.size() < k) heap.push(x);
    else if (x > heap.peek()) { heap.pop(); heap.push(x); }
  }
  return heap.h.sort((a, b) => b - a);
}

function misraGries(stream, k) {
  const counters = new Map();
  for (const x of stream) {
    if (counters.has(x)) counters.set(x, counters.get(x) + 1);
    else if (counters.size < k - 1) counters.set(x, 1);
    else {
      for (const [key, v] of counters) {
        if (v - 1 === 0) counters.delete(key);
        else counters.set(key, v - 1);
      }
    }
  }
  return counters;
}
```

## code.java
```java
import java.util.*;

public class TopK {
    public static int[] topKStream(int[] stream, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int x : stream) {
            if (heap.size() < k) heap.offer(x);
            else if (x > heap.peek()) { heap.poll(); heap.offer(x); }
        }
        int[] out = new int[heap.size()];
        for (int i = out.length - 1; i >= 0; i--) out[i] = heap.poll();
        return out;
    }

    public static int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int x : nums) counts.merge(x, 1, Integer::sum);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        for (var e : counts.entrySet()) {
            int[] pair = { e.getValue(), e.getKey() };
            if (heap.size() < k) heap.offer(pair);
            else if (pair[0] > heap.peek()[0]) { heap.poll(); heap.offer(pair); }
        }
        int[] out = new int[heap.size()];
        for (int i = out.length - 1; i >= 0; i--) out[i] = heap.poll()[1];
        return out;
    }

    public static Map<Integer, Integer> misraGries(int[] stream, int k) {
        Map<Integer, Integer> counters = new HashMap<>();
        for (int x : stream) {
            if (counters.containsKey(x)) counters.merge(x, 1, Integer::sum);
            else if (counters.size() < k - 1) counters.put(x, 1);
            else {
                Iterator<Map.Entry<Integer, Integer>> it = counters.entrySet().iterator();
                while (it.hasNext()) {
                    var e = it.next();
                    if (e.getValue() - 1 == 0) it.remove();
                    else e.setValue(e.getValue() - 1);
                }
            }
        }
        return counters;
    }
}
```

## code.cpp
```cpp
#include <queue>
#include <unordered_map>
#include <vector>
#include <algorithm>

std::vector<int> topKStream(const std::vector<int>& stream, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> heap;
    for (int x : stream) {
        if ((int)heap.size() < k) heap.push(x);
        else if (x > heap.top()) { heap.pop(); heap.push(x); }
    }
    std::vector<int> out;
    while (!heap.empty()) { out.push_back(heap.top()); heap.pop(); }
    std::reverse(out.begin(), out.end());
    return out;
}

std::vector<int> topKFrequent(const std::vector<int>& nums, int k) {
    std::unordered_map<int, int> counts;
    for (int x : nums) counts[x]++;
    using P = std::pair<int, int>;
    std::priority_queue<P, std::vector<P>, std::greater<P>> heap;
    for (auto& [val, cnt] : counts) {
        if ((int)heap.size() < k) heap.push({cnt, val});
        else if (cnt > heap.top().first) { heap.pop(); heap.push({cnt, val}); }
    }
    std::vector<int> out;
    while (!heap.empty()) { out.push_back(heap.top().second); heap.pop(); }
    std::reverse(out.begin(), out.end());
    return out;
}

std::unordered_map<int, int> misraGries(const std::vector<int>& stream, int k) {
    std::unordered_map<int, int> counters;
    for (int x : stream) {
        if (counters.count(x)) counters[x]++;
        else if ((int)counters.size() < k - 1) counters[x] = 1;
        else {
            for (auto it = counters.begin(); it != counters.end(); ) {
                if (--(it->second) == 0) it = counters.erase(it);
                else ++it;
            }
        }
    }
    return counters;
}
```
