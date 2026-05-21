---
slug: mos-algorithm
module: arrays-searching
title: Mo's Algorithm
subtitle: Reorder offline range queries to answer all of them in O((n + q) * sqrt(n)).
difficulty: Advanced
position: 30
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Mo's Algorithm — Codeforces Tutorial"
    url: ""
status: published
---

## intro
Mo's algorithm answers q range queries on a static array offline by sorting the queries in a clever order and sweeping two pointers across the array, paying only O(sqrt(n)) amortized movements per query. It's the rescue tactic when you face range queries like "distinct count" or "k-th frequency" where no segment-tree monoid exists.

## whyItMatters
Range frequency, "count distinct values in [l, r]", "mode of subarray", "sum of squares of frequencies" — none of these compose nicely under a segment tree because the operation isn't associative on partial aggregates. The textbook fallback is O(n) per query. Mo's algorithm trades the right to answer in order for an O((n + q) * sqrt(n)) total cost — typically the difference between a TLE and an accepted solution, and a strong signal in interviews that you know the offline toolkit.

## intuition
You have a moving window [L, R]. As you slide its endpoints by one, an `add(x)` or `remove(x)` callback updates whatever aggregate you maintain. If queries arrive in arbitrary order, those endpoints will jitter across the array repeatedly — O(n) per query worst case. But if you sort queries by their left endpoint's block (block size sqrt(n)), and within a block by right endpoint, the right pointer marches monotonically inside each block while the left pointer drifts only within one block. Total pointer movement: O((n + q) * sqrt(n)).

## visualization
```
n = 16, sqrt(n) = 4 -> blocks of size 4: [0..3], [4..7], [8..11], [12..15]

queries (l,r): (1,9), (5,12), (2,15), (6,8), (0,4), (10,14)

sort by (block(l), r):
  block 0 (l in 0..3): (0,4) r=4, (1,9) r=9, (2,15) r=15
  block 1 (l in 4..7): (6,8) r=8, (5,12) r=12
  block 2 (l in 8..11): (10,14) r=14

Within each block r only grows. L moves at most sqrt(n) per query.
```

## bruteForce
For each query (l, r) recompute the answer in O(r - l + 1) by scanning. Total O(n * q). For n = q = 10^5, that's 10^10 — far past time limits. Caching prefix structures doesn't help because the aggregate (e.g. distinct count) isn't decomposable as prefix[r] - prefix[l-1].

## optimal
Offline, sort the q queries with the comparator: primary key `l / block`, secondary key `r` (ascending if block index is even, descending if odd — the "Hilbert-order" optimization shaves a constant factor; plain ascending is fine for interviews). Initialize L = 0, R = -1, and an empty multiset/aggregate. For each query in sorted order:
1. While R < r: R++, add(arr[R]).
2. While R > r: remove(arr[R]), R--.
3. While L > l: L--, add(arr[L]).
4. While L < l: remove(arr[L]), L++.
5. Record the answer for that query's original index.

`add` and `remove` typically run in O(1) using a frequency array plus an auxiliary counter (e.g. number of distinct values currently in the window). Re-emit answers in original query order.

## complexity
- time: O((n + q) * sqrt(n)) assuming O(1) add/remove. With O(log n) add/remove, multiply by log.
- space: O(n + q) for the frequency map and query array.
- tradeoff: must be offline (all queries known up front), and the array must be static. Updates demand "Mo's with updates" — a three-pointer variant with O(n^{5/3}) cost.

## pitfalls
- Block size: sqrt(n) is optimal in theory, but tuning to a fixed value like 320..700 often runs faster due to cache effects. Compute as `max(1, int(sqrt(n)))`.
- Forgetting to remember the original index — sort a list of (l, r, idx) and write answers into an output array indexed by idx.
- Initializing R = -1, L = 0 so the very first add/remove dance is correct; getting L = R = 0 and pre-adding arr[0] is a common off-by-one.
- Updating the "distinct count" auxiliary: increment when freq goes 0 -> 1, decrement when freq goes 1 -> 0. Easy to invert.
- Don't use Mo's for online problems (each query depends on the previous answer); use persistent segment trees or wavelet trees instead.

## interviewTips
- Trigger phrases: "range distinct count", "range mode", "queries on a static array, you may read them all first", "k-th smallest in range with frequencies", "powerful array problem".
- Open with: "These queries aren't decomposable, so segment tree won't help. But they're offline, so I can use Mo's algorithm to answer all q queries in O((n + q) * sqrt(n))."
- Explicitly mention block size and sort comparator. Interviewers love when you say "I'll sort by (l / block, r)."
- If asked about updates: note that vanilla Mo's is static-only and gesture at Mo's-with-updates (`O(n^{5/3})`) as the extension.

## code.python
```python
from math import isqrt

def mos(arr, queries):
    n = len(arr)
    block = max(1, isqrt(n))
    indexed = [(l, r, i) for i, (l, r) in enumerate(queries)]
    indexed.sort(key=lambda q: (q[0] // block, q[1]))
    freq = [0] * (max(arr) + 2)
    distinct = 0
    ans = [0] * len(queries)
    L, R = 0, -1
    for l, r, i in indexed:
        while R < r:
            R += 1
            if freq[arr[R]] == 0: distinct += 1
            freq[arr[R]] += 1
        while R > r:
            freq[arr[R]] -= 1
            if freq[arr[R]] == 0: distinct -= 1
            R -= 1
        while L > l:
            L -= 1
            if freq[arr[L]] == 0: distinct += 1
            freq[arr[L]] += 1
        while L < l:
            freq[arr[L]] -= 1
            if freq[arr[L]] == 0: distinct -= 1
            L += 1
        ans[i] = distinct
    return ans
```

## code.javascript
```javascript
function mos(arr, queries) {
  const n = arr.length;
  const block = Math.max(1, Math.floor(Math.sqrt(n)));
  const idx = queries.map(([l, r], i) => [l, r, i]);
  idx.sort((a, b) => {
    const ba = Math.floor(a[0] / block), bb = Math.floor(b[0] / block);
    return ba !== bb ? ba - bb : a[1] - b[1];
  });
  const maxV = Math.max(...arr) + 2;
  const freq = new Int32Array(maxV);
  let distinct = 0;
  const ans = new Array(queries.length);
  let L = 0, R = -1;
  for (const [l, r, i] of idx) {
    while (R < r) { R++; if (freq[arr[R]]++ === 0) distinct++; }
    while (R > r) { if (--freq[arr[R]] === 0) distinct--; R--; }
    while (L > l) { L--; if (freq[arr[L]]++ === 0) distinct++; }
    while (L < l) { if (--freq[arr[L]] === 0) distinct--; L++; }
    ans[i] = distinct;
  }
  return ans;
}
```

## code.java
```java
public int[] mos(int[] arr, int[][] queries) {
    int n = arr.length, q = queries.length;
    int block = Math.max(1, (int) Math.sqrt(n));
    Integer[] order = new Integer[q];
    for (int i = 0; i < q; i++) order[i] = i;
    Arrays.sort(order, (a, b) -> {
        int ba = queries[a][0] / block, bb = queries[b][0] / block;
        return ba != bb ? ba - bb : queries[a][1] - queries[b][1];
    });
    int maxV = 0;
    for (int x : arr) maxV = Math.max(maxV, x);
    int[] freq = new int[maxV + 2];
    int[] ans = new int[q];
    int L = 0, R = -1, distinct = 0;
    for (int i : order) {
        int l = queries[i][0], r = queries[i][1];
        while (R < r) { R++; if (freq[arr[R]]++ == 0) distinct++; }
        while (R > r) { if (--freq[arr[R]] == 0) distinct--; R--; }
        while (L > l) { L--; if (freq[arr[L]]++ == 0) distinct++; }
        while (L < l) { if (--freq[arr[L]] == 0) distinct--; L++; }
        ans[i] = distinct;
    }
    return ans;
}
```

## code.cpp
```cpp
vector<int> mos(vector<int>& arr, vector<pair<int,int>>& queries) {
    int n = arr.size(), q = queries.size();
    int block = max(1, (int) sqrt(n));
    vector<int> order(q);
    iota(order.begin(), order.end(), 0);
    sort(order.begin(), order.end(), [&](int a, int b) {
        int ba = queries[a].first / block, bb = queries[b].first / block;
        return ba != bb ? ba < bb : queries[a].second < queries[b].second;
    });
    int maxV = *max_element(arr.begin(), arr.end()) + 2;
    vector<int> freq(maxV, 0), ans(q);
    int L = 0, R = -1, distinct = 0;
    for (int i : order) {
        int l = queries[i].first, r = queries[i].second;
        while (R < r) { R++; if (freq[arr[R]]++ == 0) distinct++; }
        while (R > r) { if (--freq[arr[R]] == 0) distinct--; R--; }
        while (L > l) { L--; if (freq[arr[L]]++ == 0) distinct++; }
        while (L < l) { if (--freq[arr[L]] == 0) distinct--; L++; }
        ans[i] = distinct;
    }
    return ans;
}
```
