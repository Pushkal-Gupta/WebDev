---
slug: dp-recursion-vs-iteration
module: dp
title: DP — Recursion vs Iteration
subtitle: Top-down memoization versus bottom-up tables — readability, stack, and cache trade-offs.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Chapter 15: Dynamic Programming"
    url: "https://walkccc.me/CLRS/Chap15/15.1/"
    type: book
  - title: "Tabulation vs Memoization — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/tabulation-vs-memoization/"
    type: blog
  - title: "TheAlgorithms/Python — dynamic_programming"
    url: "https://github.com/TheAlgorithms/Python/tree/master/dynamic_programming"
    type: repo
status: published
---

## intro
Every dynamic-programming problem can be written two ways: top-down (recursive function plus a memo table) or bottom-up (an explicit loop filling an array in dependency order). They have the same asymptotic complexity but very different runtime constants, memory footprints, and failure modes. Knowing when to pick which is what separates "I memorized the LeetCode pattern" from "I can ship this in production."

## whyItMatters
Top-down is faster to write and matches the recursive recurrence one-to-one — perfect for whiteboard problems. Bottom-up is faster at runtime (no call overhead, better cache locality) and immune to stack overflow on deep inputs. Production code paths that DP a string of length 10,000+ overflow Python's default recursion limit and segfault C++ if you stay top-down. Choosing wrong costs you either interview time or a production incident.

## intuition
Picture Fibonacci. Top-down: `fib(n) = fib(n-1) + fib(n-2)` with a dict memo — you start at the answer and recurse down, caching as you go. Bottom-up: start at `fib(0)`, `fib(1)`, fill a length-n array in a single forward sweep. Both touch each subproblem once. The difference: top-down's call stack grows to depth n; bottom-up's loop has constant stack depth.

## visualization
Recursion tree for `fib(5)`: depth-5 tree with overlapping subproblems. Top-down trims the tree to a DAG by short-circuiting on memo hits — the dashed lines mark cache hits. Bottom-up draws a horizontal arrow from `dp[0]` to `dp[5]`, computing each cell from the two prior cells. Same arithmetic, different control flow.

## bruteForce
Pure recursion with no memo — recomputes the same subproblem exponentially many times. `fib(40)` does roughly 200M calls. Useful only to motivate why DP exists. The brute-force trap in interviews is writing the recursion, getting a TLE, and not realizing you only need one cache line to fix it.

## optimal
Start top-down to discover the recurrence — it mirrors the mathematical statement. Once it works, convert to bottom-up if (a) recursion depth could exceed ~10,000, (b) you need the tightest possible runtime, or (c) you want to apply rolling-array space optimization (keep only the last k rows). Bottom-up makes the dependency order explicit, which is what enables `dp[i] = dp[i-1] + dp[i-2]` to collapse to two scalar variables — O(1) space instead of O(n).

## complexity
time: O(states) for both — each subproblem solved once.
space: top-down O(states + recursion depth); bottom-up O(states), reducible to O(1 row) with rolling arrays.
notes: Top-down's hidden constant — function call, hash lookup, GC pressure — is typically 2-5x bottom-up in compiled languages and 5-10x in Python.

## pitfalls
- Setting Python's recursion limit higher to "fix" stack overflow — buys a little time but blows the C stack at ~10k frames anyway. Convert to iteration.
- Memoizing on mutable state (lists, dicts) without freezing — every call hashes to a new key and the memo never hits.
- Bottom-up in the wrong order — `dp[i]` reading `dp[i+1]` before it's filled. Sketch the dependency arrows before writing the loop.
- Premature rolling-array optimization that loses the path information needed to reconstruct the actual solution (LCS, edit distance backtraces).

## interviewTips
- Always write the recurrence first, then say "I'll memoize this top-down" — fastest path to a correct answer.
- After it works, say "If recursion depth is a concern, here's the bottom-up version" — shows you know both.
- For follow-ups asking for space optimization, you almost always need bottom-up. Top-down with rolling memo is awkward.

## code.python
```python
import sys
from functools import lru_cache

@lru_cache(maxsize=None)
def fib_top_down(n):
    if n < 2:
        return n
    return fib_top_down(n - 1) + fib_top_down(n - 2)

def fib_bottom_up(n):
    if n < 2:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b
```

## code.javascript
```javascript
function fibTopDown(n, memo = new Map()) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fibTopDown(n - 1, memo) + fibTopDown(n - 2, memo);
  memo.set(n, v);
  return v;
}

function fibBottomUp(n) {
  if (n < 2) return n;
  let a = 0, b = 1;
  for (let i = 1; i < n; i++) [a, b] = [b, a + b];
  return b;
}
```

## code.java
```java
import java.util.HashMap;
import java.util.Map;

public class FibDP {
    private final Map<Integer, Long> memo = new HashMap<>();

    public long fibTopDown(int n) {
        if (n < 2) return n;
        if (memo.containsKey(n)) return memo.get(n);
        long v = fibTopDown(n - 1) + fibTopDown(n - 2);
        memo.put(n, v);
        return v;
    }

    public long fibBottomUp(int n) {
        if (n < 2) return n;
        long a = 0, b = 1;
        for (int i = 1; i < n; i++) { long t = a + b; a = b; b = t; }
        return b;
    }
}
```

## code.cpp
```cpp
#include <unordered_map>

class FibDP {
    std::unordered_map<int, long long> memo;
public:
    long long fibTopDown(int n) {
        if (n < 2) return n;
        auto it = memo.find(n);
        if (it != memo.end()) return it->second;
        long long v = fibTopDown(n - 1) + fibTopDown(n - 2);
        memo[n] = v;
        return v;
    }
    long long fibBottomUp(int n) {
        if (n < 2) return n;
        long long a = 0, b = 1;
        for (int i = 1; i < n; i++) { long long t = a + b; a = b; b = t; }
        return b;
    }
};
```
