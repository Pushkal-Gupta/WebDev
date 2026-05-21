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
status: published
---

## intro
Sliding window solves "find the best contiguous subarray/substring satisfying X" problems in O(n) by maintaining a window `[l, r]` that expands by moving `r` forward and contracts by moving `l` forward — never backward. Each element enters the window at most once and leaves at most once, giving 2n total operations.

## whyItMatters
A huge class of array/string problems are about contiguous subranges: longest substring without repeats, minimum window substring, max sum subarray of size k, longest repeating character replacement, fruit-into-baskets, max consecutive ones III. Brute force is O(n² × k); sliding window is O(n). Recognizing the pattern is the single highest-leverage skill for the medium-to-hard string section of any interview.

## intuition
Open a window by moving `r`. Track whatever the problem cares about (sum, character counts, distinct elements). When the window violates the invariant, shrink it by moving `l` until it's valid again. Record the best answer at each valid state. Because pointers only move forward, total work is O(n).

There are two flavors:
- **Fixed-size window:** `r = l + k - 1`; slide both forward together.
- **Variable-size window:** expand `r` greedily; contract `l` lazily when the window goes invalid.

## visualization
**Longest substring without repeating characters** in `"abcabcbb"`:
- Window `"a"`, "ab", "abc" — all valid. Best = 3.
- Add `a` → conflict with `arr[0]`. Move `l` past the duplicate: window becomes `"bca"`.
- Continue: `"bcab"` invalid → `"cab"`. Then `"abc"`. Then `"abcb"` invalid → `"cb"` then `"b"`. Etc.

Pointers only move forward; total 2n character visits.

## bruteForce
Enumerate every (l, r) pair and check validity. O(n²) or O(n³) depending on how you check. Sliding window cuts to O(n) by reusing work between adjacent windows.

## optimal
General template:
```
l = 0
for r in range(n):
    add arr[r] to window state
    while window state violates invariant:
        remove arr[l] from window state
        l += 1
    update answer with current window (l..r)
```

The "window state" depends on the problem: a hash-map character count, a running sum, a distinct-element counter, a deque (for monotonic-window problems like max sliding window).

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
