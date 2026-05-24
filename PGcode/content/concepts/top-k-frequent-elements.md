---
slug: top-k-frequent-elements
module: heaps
title: Top K Frequent Elements
subtitle: Surface the K most common values using a frequency map plus a size-K min-heap or bucket sort.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Top K Frequent Elements — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/find-k-numbers-occurrences-given-array/"
    type: blog
  - title: "Princeton algs4 — Priority Queues"
    url: "https://algs4.cs.princeton.edu/24pq/"
    type: book
  - title: "TheAlgorithms/Python — heap.py"
    url: "https://github.com/TheAlgorithms/Python/blob/master/data_structures/heap/heap.py"
    type: repo
status: published
---

## intro
Given an array and an integer K, return the K elements that appear most often. The straightforward path is to count frequencies and sort, but a min-heap of size K — or bucket sort keyed by frequency — beats the full sort and turns this into a canonical "top-K" interview pattern.

## intuition
Counting frequencies is mandatory; the only question is how to extract the K largest counts. A min-heap of size K keeps the K best seen so far: push, and if the heap exceeds K pop the smallest, leaving the K most frequent at the end. Bucket sort exploits a stronger fact: any frequency is bounded by n, so an array of n+1 buckets — index = frequency, value = list of elements with that frequency — can be scanned from the high end in O(n).

## visualization
Take `nums = [1,1,1,2,2,3]`, K = 2. Frequency map: `{1:3, 2:2, 3:1}`. Buckets indexed by frequency: `bucket[3]=[1]`, `bucket[2]=[2]`, `bucket[1]=[3]`. Walk buckets from index 6 down: collect 1, then 2 — two elements, done. Heap variant: push `(3,1)`, `(2,2)`, `(1,3)` keeping size 2 — final heap holds `(2,2)` and `(3,1)`, the two answers.

## bruteForce
Count frequencies with a hashmap, dump entries into a list, sort by frequency descending, return the first K keys. O(n log n) time, O(n) space. Honest baseline, and for small n it is the fastest thing to write — but interviewers usually want sub-`n log n` since K can be much smaller than n.

## optimal
Two competitive approaches:
- **Min-heap of size K.** Iterate frequencies, push each as `(freq, value)`; if heap size exceeds K, pop the smallest. O(n log K) time, O(n + K) space — strictly better than full sort when K << n.
- **Bucket sort.** Build `buckets[0..n]` where `buckets[f]` lists elements with frequency `f`. Walk from `f = n` downward, collecting until K elements are gathered. O(n) time, O(n) space — optimal when you can spare the buckets.

## complexity
time: O(n log K) heap, O(n) bucket
space: O(n + K) heap, O(n) bucket
notes: The frequency map is O(n) for both. The heap variant trades a log factor for a smaller working set; bucket sort wins on raw asymptotics but uses one array of length n+1 regardless of K.

## pitfalls
- Using a max-heap of size n: works but is O(n log n) — no better than just sorting.
- Forgetting that bucket indices must reach `n` (not the number of distinct values) — a single element repeated n times demands `buckets[n]`.
- Returning frequencies instead of values, or vice versa — read the prompt.
- Ties: the problem usually says any valid order is acceptable; clarify if it matters.

## interviewTips
- Sketch both heap and bucket approaches and let the interviewer pick — signals breadth.
- Call out the asymptotic split: bucket is O(n) but allocates an n-sized array; heap is O(n log K) and lighter on memory when K is small.
- Mention that this pattern generalizes to streaming top-K with a fixed-size min-heap as the data source grows.

## code.python
```python
import heapq
from collections import Counter

def top_k_frequent_heap(nums, k):
    freq = Counter(nums)
    heap = []
    for val, f in freq.items():
        heapq.heappush(heap, (f, val))
        if len(heap) > k:
            heapq.heappop(heap)
    return [val for _, val in heap]

def top_k_frequent_bucket(nums, k):
    freq = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]
    for val, f in freq.items():
        buckets[f].append(val)
    out = []
    for f in range(len(buckets) - 1, 0, -1):
        for val in buckets[f]:
            out.append(val)
            if len(out) == k:
                return out
    return out
```

## code.javascript
```javascript
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const x of nums) freq.set(x, (freq.get(x) || 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [val, f] of freq) buckets[f].push(val);
  const out = [];
  for (let f = buckets.length - 1; f > 0 && out.length < k; f--) {
    for (const val of buckets[f]) {
      out.push(val);
      if (out.length === k) return out;
    }
  }
  return out;
}
```

## code.java
```java
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int x : nums) freq.merge(x, 1, Integer::sum);
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    for (var e : freq.entrySet()) {
        heap.offer(new int[]{e.getValue(), e.getKey()});
        if (heap.size() > k) heap.poll();
    }
    int[] out = new int[k];
    for (int i = k - 1; i >= 0; i--) out[i] = heap.poll()[1];
    return out;
}
```

## code.cpp
```cpp
vector<int> topKFrequent(vector<int>& nums, int k) {
    unordered_map<int, int> freq;
    for (int x : nums) freq[x]++;
    using P = pair<int, int>;
    priority_queue<P, vector<P>, greater<P>> heap;
    for (auto& [val, f] : freq) {
        heap.push({f, val});
        if ((int)heap.size() > k) heap.pop();
    }
    vector<int> out(k);
    for (int i = k - 1; i >= 0; i--) { out[i] = heap.top().second; heap.pop(); }
    return out;
}
```
