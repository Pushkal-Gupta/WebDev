---
slug: dp-recursion-vs-iteration
module: dp-classical
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
- Pandas' rolling DP for time-series (`.expanding().sum()`, `.rolling().apply()`) uses bottom-up because top-down recursion on a 10M-row DataFrame would blow Python's 1000-frame default.
- TensorFlow and JAX trace bottom-up computation graphs (XLA optimizer) precisely because the topological order is explicit; top-down memoization would force runtime dispatch that defeats kernel fusion.
- Production code paths that DP a string of length 10,000+ (regex compilers, JSON parsers, LSP servers) overflow Python's recursion limit and segfault C++ stacks if they stay top-down — every mature compiler eventually converts to iteration.
- Top-down is faster to write and matches the recursive recurrence one-to-one — perfect for whiteboards. Bottom-up is faster at runtime (no call overhead, better cache locality) and immune to stack overflow on deep inputs.
- Choosing wrong costs interview time or a production incident — both LeetCode TLEs and PagerDuty alerts trace back to "should have been bottom-up."

## intuition
Every DP problem has a dependency graph: each subproblem depends on a small set of others. Two control flows traverse that graph. Top-down (recursion + memo) starts at the target and recurses down toward base cases, caching results to avoid repeated work. Bottom-up (tabulation) starts at the base cases and iterates forward in dependency order, filling a table cell by cell. Both touch each subproblem exactly once, so asymptotic time is identical. The differences are operational. Top-down preserves the mathematical shape of the recurrence — write `fib(n) = fib(n-1) + fib(n-2)` and you are done. The cost is one function-call frame per subproblem (Python and the JVM measure this in hundreds of nanoseconds with GC pressure to match), plus a recursion stack that grows linearly with the deepest subproblem. CPython's default limit is 1000 frames; raising it buys you a few thousand more before the C stack itself collapses around 10000-100000 frames. Bottom-up pays no call overhead, has zero recursion depth, and walks memory in cache-friendly forward order — typically 2-5x faster in compiled languages and 5-10x in Python. The cost is that you must explicitly figure out the topological order before writing the loop, which can be annoying for recurrences with non-obvious dependencies. The deep lesson is to use top-down to discover the recurrence (it matches the math), then port to bottom-up when (a) recursion depth could exceed safe limits, (b) you need the tight runtime constant, or (c) you want rolling-array space optimization — collapsing `dp[i] = f(dp[i-1], dp[i-2])` to two scalars requires explicit forward iteration and is impossible to do cleanly top-down.

## visualization
Recursion tree for `fib(5)`: depth-5 tree with overlapping subproblems. Top-down trims the tree to a DAG by short-circuiting on memo hits — the dashed lines mark cache hits. Bottom-up draws a horizontal arrow from `dp[0]` to `dp[5]`, computing each cell from the two prior cells. Same arithmetic, different control flow.

## bruteForce
Pure recursion with no memo — recomputes the same subproblem exponentially many times. `fib(40)` does roughly 200M calls. Useful only to motivate why DP exists. The brute-force trap in interviews is writing the recursion, getting a TLE, and not realizing you only need one cache line to fix it.

## optimal
Use top-down memoization to discover and validate the recurrence — it mirrors the math one-to-one and minimizes interview-time bugs. Once correct, convert to bottom-up tabulation when recursion depth could exceed safe limits (~10000 frames), when runtime constants matter (typical 2-10x speedup), or when you want to apply rolling-array space optimization. Bottom-up makes the dependency order explicit, which is what enables `dp[i] = dp[i-1] + dp[i-2]` to collapse from O(n) memory to two scalar variables. Both forms hit the optimal O(states) time bound — each subproblem is solved exactly once.

```python
# Top-down: matches the recurrence, easy to write, recursion-stack bound.
from functools import lru_cache

@lru_cache(maxsize=None)
def fib_top_down(n):
    if n < 2:
        return n
    return fib_top_down(n - 1) + fib_top_down(n - 2)

# Bottom-up: explicit dependency order, no recursion, O(1) space via rolling pair.
def fib_bottom_up(n):
    if n < 2:
        return n
    a, b = 0, 1                          # represents fib(0), fib(1)
    for _ in range(n - 1):
        a, b = b, a + b                  # slide the window forward by one
    return b
```

The top-down version reads like the math but pays one stack frame per call plus a hash lookup per recursion. The bottom-up version walks the dependency DAG in forward topological order — for Fibonacci that is just left-to-right — and collapses the table to a rolling pair `(a, b)`, achieving O(1) space. The pattern generalizes: any DP whose recurrence depends only on the last k entries can collapse from O(n) memory to O(k) by rolling, but only the bottom-up form makes the windowing natural to write.

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
