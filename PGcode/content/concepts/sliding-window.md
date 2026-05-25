---
slug: sliding-window
module: stacks-queues
title: Sliding Window
subtitle: Maintain a contiguous range that grows and shrinks under an invariant.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Bags, Queues, Stacks"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "GeeksforGeeks — Stack & Queue"
    url: "https://www.geeksforgeeks.org/stack-data-structure/"
    type: blog
  - title: "TheAlgorithms/Python — data_structures/stacks/"
    url: "https://github.com/TheAlgorithms/Python/tree/master/data_structures/stacks"
    type: repo
status: published
---

## intro
Sliding window solves "find the best contiguous subarray/substring satisfying X" problems in O(n) by maintaining a window `[l, r]` that expands by moving `r` forward and contracts by moving `l` forward — never backward. Each element enters the window at most once and leaves at most once, giving 2n total operations.

## whyItMatters
- **TCP congestion control** (RFC 5681) operates exactly as a sliding window over in-flight packets; the same metaphor names the technique.
- **Real-time analytics**: Datadog, Prometheus, and Grafana compute "max value in last N seconds" via sliding-window aggregations over metric streams; many of these reduce to the monotonic-deque variant.
- **Rate limiting**: NGINX `limit_req`, Cloudflare's bot management, and Stripe's API rate limiter use sliding-window counters (and the more accurate sliding-window-log variant) to enforce per-IP request budgets.
- **Streaming SQL**: Kafka Streams, Apache Flink, and ksqlDB expose `WINDOW (RANGE INTERVAL '5' MINUTE)` clauses backed by sliding-window primitives at the engine level.
- **Bioinformatics**: k-mer sliding windows are the foundation of read alignment (BWA), genome assembly, and minimiser-based hashing in Mash and Minimap2.
- **Interview coverage**: longest substring without repeats, minimum window substring, max sum subarray of size k, longest repeating character replacement, fruit-into-baskets, max consecutive ones III. Brute force is Θ(n²·k); sliding window is Θ(n). Pattern recognition here is the single highest-leverage skill for the medium-to-hard string section.

## intuition
The technique exists because pairwise enumeration of all (l, r) sub-ranges is Θ(n²) windows, and revalidating each from scratch is another factor of n — total Θ(n³). The escape route is amortisation: maintain a *single* window `[l, r]` and observe that as r advances by one, the window state (sum, character count, distinct element count) changes by a constant amount, not by Θ(window size). So updating state is O(1) per advance, and the total work across all advances is O(n).

The decisive observation: pointers only ever move forward. When the window violates its invariant (sum too large, more than k distinct characters, duplicate character), shrink from the left until valid again. Because l only advances, each element enters the window at most once (when r reaches it) and leaves at most once (when l surpasses it), giving 2n total operations — amortised O(1) per character. This monotonic-pointer trick is the same one behind Manacher's, Z-function, KMP failure function, and any "two pointers moving in the same direction" algorithm.

Two flavours appear in practice. **Fixed-size window** (`r = l + k - 1`): slide both pointers forward together; on each step, add `arr[r]` and remove `arr[l-1]` from the state. Useful when the problem fixes a window length k in advance (max sum of size k, k-mer enumeration). **Variable-size window**: expand `r` greedily; contract `l` lazily only when the window goes invalid. Useful when "the longest/shortest window satisfying X" is the question.

For maintaining max/min over the window, plain counting doesn't work — the maximum can leave the window. The fix is a *monotonic deque*: store indices in decreasing value order; pop from the back when a larger value arrives, pop from the front when the front falls out of the window. This is the foundation of LeetCode 239 (max sliding window) and similar problems.

## visualization
**Longest substring without repeating characters** in `"abcabcbb"`:
- Window `"a"`, "ab", "abc" — all valid. Best = 3.
- Add `a` → conflict with `arr[0]`. Move `l` past the duplicate: window becomes `"bca"`.
- Continue: `"bcab"` invalid → `"cab"`. Then `"abc"`. Then `"abcb"` invalid → `"cb"` then `"b"`. Etc.

Pointers only move forward; total 2n character visits.

## bruteForce
Enumerate every (l, r) pair and check validity. O(n²) or O(n³) depending on how you check. Sliding window cuts to O(n) by reusing work between adjacent windows.

## optimal
**Technique: two-pointer monotonic sliding window with O(1) per-step state update.** O(n) time, O(k) space (k = state size). Optimal because each element enters and leaves the window at most once, capping total pointer movement at 2n; the per-step work is constant. Any algorithm that must examine every element of the input is Ω(n), so this saturates the lower bound.

```python
def longest_unique_substring(s):
    seen = {}                         # char -> most-recent index
    l = best = 0
    for r, ch in enumerate(s):
        if ch in seen and seen[ch] >= l:
            l = seen[ch] + 1          # contract: jump l past the duplicate
        seen[ch] = r                  # record/refresh the latest index
        best = max(best, r - l + 1)   # window [l, r] is now valid
    return best
```

General template:

```python
l = 0
state = init()
for r in range(n):
    add(state, arr[r])               # expand: include arr[r] in the window
    while violates(state):
        remove(state, arr[l])        # contract: drop arr[l] until valid
        l += 1
    answer = better(answer, summarize(state, l, r))
```

Key lines: the `for r in range(n)` outer loop expands the window monotonically. The `while violates(state)` inner loop contracts from the left as needed; using `while` (not `if`) is essential because a single advance of r can require multiple removals — e.g., adding a character that conflicts twice. Pointer movement is amortised O(1) per step despite the inner loop because l only ever advances forward, capping total `l += 1` operations at n.

The window-state data structure depends on the problem:
- **Running sum** for "subarray with sum >= target" (O(1) state).
- **Hash-map character counts** for "minimum window substring", "longest with k distinct" (O(σ) state where σ is alphabet size).
- **Fixed-size integer array (26 or 128 slots)** for ASCII-only problems — faster than hash map by 5–10×.
- **Monotonic deque** for "max sliding window" — store indices in decreasing value order so the max is always at the front.
- **Two heaps (median heap)** for "median sliding window" — balanced lo/hi heaps with lazy deletion.

**Why not brute force enumeration of (l, r)?** Θ(n²) windows times Θ(n) revalidation = Θ(n³); the amortisation makes the difference. **Why not prefix sums alone?** Prefix sums answer "sum of [l, r] in O(1)" but require Θ(n²) to enumerate all l, r; sliding window needs only Θ(n) because it never revisits a discarded window. **Litmus test**: "is the answer a *contiguous* range satisfying some condition?" If yes, sliding window is the first technique to try. If subarrays aren't contiguous (subsequences, subsets), sliding window doesn't apply — reach for DP or backtracking.

## complexity
time: O(n) — each pointer moves at most n times total.
space: O(k) where k is the window-state size (e.g., the distinct character count for string problems, or O(1) for sum-based windows).
notes: For fixed-size windows, swap "add then maybe shrink" for "add right + remove left in the same iteration" — even tighter than the variable template.

## pitfalls
- Forgetting to advance `l` past *all* offending elements, not just one — the `while` loop matters, not `if`.
- Updating the answer at the wrong moment (before the shrink, or only at the end) — measure when the window is valid.
- Using a hash map where a fixed array suffices (lowercase letters: array of 26 is far faster).
- Trying to apply sliding window when subarrays aren't contiguous — that's not what the technique solves.

## interviewTips
- The litmus test: "is the answer a *contiguous* range satisfying some condition?" If yes, sliding window is the first technique to try.
- Distinguish fixed vs variable up front — they have slightly different implementations and confusing them wastes time.
- For the harder variants (minimum window substring, longest with k distinct), pre-write the window-state data structure (`Counter` in Python, `int[]` in Java/C++) — the rest is template.

## code.python
```python
def longest_unique_substring(s: str) -> int:
    seen = {}
    l = best = 0
    for r, ch in enumerate(s):
        if ch in seen and seen[ch] >= l:
            l = seen[ch] + 1
        seen[ch] = r
        best = max(best, r - l + 1)
    return best
```

## code.javascript
```javascript
function longestUniqueSubstring(s) {
  const seen = new Map();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    const ch = s[r];
    if (seen.has(ch) && seen.get(ch) >= l) l = seen.get(ch) + 1;
    seen.set(ch, r);
    best = Math.max(best, r - l + 1);
  }
  return best;
}
```

## code.java
```java
public int longestUniqueSubstring(String s) {
    int[] seen = new int[128];
    Arrays.fill(seen, -1);
    int l = 0, best = 0;
    for (int r = 0; r < s.length(); r++) {
        char ch = s.charAt(r);
        if (seen[ch] >= l) l = seen[ch] + 1;
        seen[ch] = r;
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

## code.cpp
```cpp
int longestUniqueSubstring(string s) {
    vector<int> seen(128, -1);
    int l = 0, best = 0;
    for (int r = 0; r < (int) s.size(); r++) {
        char ch = s[r];
        if (seen[ch] >= l) l = seen[ch] + 1;
        seen[ch] = r;
        best = max(best, r - l + 1);
    }
    return best;
}
```
