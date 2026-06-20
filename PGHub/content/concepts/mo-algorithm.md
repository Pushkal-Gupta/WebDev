---
slug: mo-algorithm
module: arrays-counting-select
title: Mo's Algorithm
subtitle: Offline range queries via sqrt(n) bucket sort plus two-pointer maintenance, in O((n+q)*sqrt(n)).
difficulty: Advanced
position: 22
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (4e), Princeton (companion site)"
    url: "https://algs4.cs.princeton.edu/home/"
    type: book
  - title: "cp-algorithms — Sqrt Decomposition and Mo's Algorithm"
    url: "https://cp-algorithms.com/data_structures/sqrt_decomposition.html"
    type: blog
  - title: "indy256/codelibrary — Mo's algorithm implementations"
    url: "https://github.com/indy256/codelibrary"
    type: repo
status: published
---

## intro
Mo's algorithm answers a batch of range queries on an array — "how many distinct values in [L, R]?", "sum of frequencies squared in [L, R]?", "XOR of [L, R]?" — without segment trees or BIT magic. It only works **offline** (all queries known in advance), but its constant factor is tiny and it handles updates that segment trees cannot easily express, like "count pairs with the same value."

## whyItMatters
For queries whose state is awkward to merge — distinct counts, mode, "number of values with frequency >= k" — segment trees become painful (you need merge functions that can be associative, which distinct-count is not without bitsets). Mo's algorithm sidesteps merging entirely by maintaining a *moving window* with cheap add/remove primitives. If add and remove are O(1), the total cost is O((n+q) * sqrt(n)). On n = q = 1e5 that's ~3 * 10^7 operations — well within a second.

## intuition
You already know two pointers can shift the window [L, R] by one position with one add or one remove. The problem with naive two-pointer over arbitrary queries is the pointers might bounce back and forth, paying O(n) per query. Mo's trick: **reorder the queries** so that consecutive queries are "close" — then the pointer total travel is bounded. Sort queries by (L / B, R), where B = sqrt(n). Within a bucket, L moves at most O(B) per query and R moves monotonically right (resetting only when the bucket changes). Total moves: O(n * sqrt(n)) for L and O(n * sqrt(n)) for R.

## visualization
```
n = 9, B = 3 (sqrt(9)). Queries (1-indexed) sorted by (L/B, R):

  Q1: L=1 R=3   bucket 0
  Q2: L=2 R=8   bucket 0
  Q3: L=4 R=5   bucket 1
  Q4: L=5 R=9   bucket 1
  Q5: L=7 R=9   bucket 2

Pointer trace (start L=1, R=0, window empty):
  Q1: add 1,2,3        -> L=1, R=3
  Q2: add 4..8, add 1->2 (advance L) -> L=2, R=8
  Q3: remove 2,3, remove 8,7,6 (R back), add 4,5 -> L=4, R=5
  Q4: add 6,7,8,9, advance L 4->5    -> L=5, R=9
  Q5: advance L 5,6 -> 7              -> L=7, R=9
```

## bruteForce
Process each query independently: for each [L, R], walk the range and compute the answer from scratch. That's O(n) per query, O(n * q) total — 10^10 for n = q = 10^5. Even with a fast O(1) per element work, that's two orders of magnitude too slow. Segment trees fix this for *mergeable* operations (sum, min, gcd) but break down on distinct-count and frequency-mode queries unless you bring in heavy machinery (merge-sort trees, wavelet trees).

## optimal
Group queries into buckets of size B = sqrt(n), sort by (L bucket, then R asc — flip R order on odd buckets for a constant-factor win), then sweep two pointers.

```
B = floor(sqrt(n))
sort queries by (L // B, R if (L//B) even else -R)

cur_l, cur_r = 0, -1
state = empty
ans = array of size q

for each query (L, R, idx) in sorted order:
    while cur_r < R: cur_r += 1; add(cur_r)
    while cur_l > L: cur_l -= 1; add(cur_l)
    while cur_r > R: remove(cur_r); cur_r -= 1
    while cur_l < L: remove(cur_l); cur_l += 1
    ans[idx] = current_answer(state)

return ans
```
Pointer-update order matters: always *expand before contracting* to avoid temporarily going negative on counts.

## complexity
time: O((n + q) * sqrt(n)) assuming O(1) add/remove. With O(log n) add/remove (e.g. balanced BST inside the window) it becomes O((n + q) * sqrt(n) * log n).
space: O(n + q) for the value-frequency table and answers.
notes: Hilbert-curve query ordering shaves the constant ~30% in practice. Mo's on trees (Euler tour + sqrt-decomp) extends to subtree and path queries; Mo's with updates ("Mo's with time") adds a third pointer and runs in O(n^(5/3)).

## pitfalls
- Off-by-one on inclusive vs exclusive R — pick a convention (`cur_r = -1` for empty) and stick to it.
- Wrong pointer-update order: contracting first can call `remove(x)` on an index outside the current window and corrupt state.
- Forgetting to flip R order on odd buckets — correctness is fine, but you lose a ~2x speedup.
- Using Mo's when an online structure (segment tree, BIT) would do — Mo's is offline-only; never use it if queries arrive interactively.
- Choosing B != sqrt(n). Smaller B blows up R sweeps; larger B blows up L sweeps. Both degrade to O(n*q) at the extreme.

## interviewTips
- Mo's is a "rare gem" interview topic — usually shown only at senior / competitive-programming-flavored interviews (Two Sigma, Jane Street, ICPC alums).
- Lead with "It's offline, with O((n+q)*sqrt(n)) cost, when add/remove of a single element is O(1)."
- Be ready to give the classic distinct-count example: maintain `freq[value]` and `distinct` counter; `add` bumps freq, bumps distinct if it became 1; `remove` decrements freq, drops distinct if it hit 0.
- Mention Mo's on trees and Mo's with updates as extensions — signals you know the family, not just the headline algorithm.

## code.python
```python
def mo_distinct(arr, queries):
    n = len(arr)
    B = max(1, int(n ** 0.5))
    indexed = [(L, R, i) for i, (L, R) in enumerate(queries)]
    indexed.sort(key=lambda q: (q[0] // B, q[1] if (q[0] // B) % 2 == 0 else -q[1]))

    freq = [0] * (max(arr) + 2)
    distinct = 0
    ans = [0] * len(queries)
    cur_l, cur_r = 0, -1

    def add(i):
        nonlocal distinct
        freq[arr[i]] += 1
        if freq[arr[i]] == 1: distinct += 1

    def remove(i):
        nonlocal distinct
        freq[arr[i]] -= 1
        if freq[arr[i]] == 0: distinct -= 1

    for L, R, idx in indexed:
        while cur_r < R: cur_r += 1; add(cur_r)
        while cur_l > L: cur_l -= 1; add(cur_l)
        while cur_r > R: remove(cur_r); cur_r -= 1
        while cur_l < L: remove(cur_l); cur_l += 1
        ans[idx] = distinct
    return ans
```

## code.javascript
```javascript
function moDistinct(arr, queries) {
  const n = arr.length;
  const B = Math.max(1, Math.floor(Math.sqrt(n)));
  const idx = queries.map(([L, R], i) => [L, R, i]);
  idx.sort((a, b) => {
    const ba = (a[0] / B) | 0, bb = (b[0] / B) | 0;
    if (ba !== bb) return ba - bb;
    return ba % 2 === 0 ? a[1] - b[1] : b[1] - a[1];
  });

  const maxV = Math.max(...arr) + 2;
  const freq = new Int32Array(maxV);
  let distinct = 0, curL = 0, curR = -1;
  const ans = new Array(queries.length);
  const add = i => { if (++freq[arr[i]] === 1) distinct++; };
  const rem = i => { if (--freq[arr[i]] === 0) distinct--; };

  for (const [L, R, i] of idx) {
    while (curR < R) add(++curR);
    while (curL > L) add(--curL);
    while (curR > R) rem(curR--);
    while (curL < L) rem(curL++);
    ans[i] = distinct;
  }
  return ans;
}
```

## code.java
```java
import java.util.*;

public class MoAlgorithm {
    public int[] distinctCounts(int[] arr, int[][] queries) {
        int n = arr.length, q = queries.length;
        int B = Math.max(1, (int) Math.sqrt(n));
        Integer[] order = new Integer[q];
        for (int i = 0; i < q; i++) order[i] = i;
        Arrays.sort(order, (a, b) -> {
            int ba = queries[a][0] / B, bb = queries[b][0] / B;
            if (ba != bb) return ba - bb;
            return (ba & 1) == 0 ? queries[a][1] - queries[b][1] : queries[b][1] - queries[a][1];
        });

        int max = 0; for (int v : arr) max = Math.max(max, v);
        int[] freq = new int[max + 2];
        int distinct = 0, curL = 0, curR = -1;
        int[] ans = new int[q];

        for (int idx : order) {
            int L = queries[idx][0], R = queries[idx][1];
            while (curR < R) { curR++; if (++freq[arr[curR]] == 1) distinct++; }
            while (curL > L) { curL--; if (++freq[arr[curL]] == 1) distinct++; }
            while (curR > R) { if (--freq[arr[curR]] == 0) distinct--; curR--; }
            while (curL < L) { if (--freq[arr[curL]] == 0) distinct--; curL++; }
            ans[idx] = distinct;
        }
        return ans;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <algorithm>
#include <cmath>

std::vector<int> mo_distinct(const std::vector<int>& arr, std::vector<std::array<int,2>> queries) {
    int n = arr.size(), q = queries.size();
    int B = std::max(1, (int)std::sqrt((double)n));
    std::vector<int> ord(q);
    for (int i = 0; i < q; i++) ord[i] = i;
    std::sort(ord.begin(), ord.end(), [&](int a, int b) {
        int ba = queries[a][0] / B, bb = queries[b][0] / B;
        if (ba != bb) return ba < bb;
        return (ba & 1) ? queries[a][1] > queries[b][1] : queries[a][1] < queries[b][1];
    });

    int maxV = 0; for (int v : arr) maxV = std::max(maxV, v);
    std::vector<int> freq(maxV + 2, 0), ans(q);
    int distinct = 0, curL = 0, curR = -1;

    for (int idx : ord) {
        int L = queries[idx][0], R = queries[idx][1];
        while (curR < R) { curR++; if (++freq[arr[curR]] == 1) distinct++; }
        while (curL > L) { curL--; if (++freq[arr[curL]] == 1) distinct++; }
        while (curR > R) { if (--freq[arr[curR]] == 0) distinct--; curR--; }
        while (curL < L) { if (--freq[arr[curL]] == 0) distinct--; curL++; }
        ans[idx] = distinct;
    }
    return ans;
}
```
