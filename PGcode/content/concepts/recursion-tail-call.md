---
slug: recursion-tail-call
module: recursion-bt
title: Tail Call Optimization
subtitle: When the recursive call is the last thing you do — and why most languages still blow the stack.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "CLRS Solutions — Recursion and the Substitution Method"
    url: "https://walkccc.me/CLRS/Chap04/"
    type: book
  - title: "Tail Recursion — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/tail-recursion/"
    type: blog
  - title: "TheAlgorithms/Python — recursion"
    url: "https://github.com/TheAlgorithms/Python/tree/master/maths"
    type: repo
status: published
---

## intro
A recursive call is in *tail position* when it is the last action the function performs — nothing left to combine, add, or return-transform after the recursive result. A compiler that performs Tail Call Optimization (TCO) reuses the current stack frame for that call instead of pushing a new one, converting unbounded recursion into a loop in constant stack space. Most mainstream languages (Python, Java, JavaScript outside Safari) do *not* implement TCO, which means tail-recursive code still overflows on deep inputs.

## whyItMatters
Recursion is the cleanest way to express tree traversals, divide-and-conquer, and many list operations. But "clean code that crashes on 10,000-element inputs" is unshippable. Knowing which calls are tail-position and how to mechanically rewrite them as loops is the difference between a recursion that survives production and one that pages you at 3 AM. It also reframes "is this a loop or recursion problem?" as "are these forms equivalent under my language?"

## intuition
`factorial(n) = n * factorial(n - 1)` is *not* tail-recursive — after the recursive call returns, you still multiply by n. `factorial_iter(n, acc) = factorial_iter(n - 1, acc * n)` *is* tail-recursive — the recursive call is the last thing; the multiply happens *before* it. The accumulator trick turns "compute then combine" into "carry the partial answer forward," which is structurally identical to a loop's running variable.

## visualization
Frame stack for non-tail `factorial(4)`: 4 frames stacked, each waiting to multiply by its n. Frame stack for tail-recursive `factorial_iter(4, 1)`: with TCO, exactly 1 frame, mutated in place — n decrements, acc accumulates, the rest disappears. Without TCO, still 4 frames; the optimization is purely a compiler choice.

## bruteForce
Naïve recursion blows the stack at depth ~1000 in Python (configurable but C-stack-bounded at ~10,000), ~10,000-50,000 in Java, ~10,000 in V8. Brute-force fix in those languages: `sys.setrecursionlimit(100000)` or rewrite as iteration. The setrecursionlimit path is fragile because the C stack is finite — bump too high and you segfault rather than getting a Python exception.

## optimal
Two strategies. (1) Refactor to true iteration with a while loop — the most portable, no language quirks. (2) Trampoline — instead of calling yourself, return a thunk (callable) and have an outer loop invoke thunks until you return a non-thunk value. The trampoline preserves recursive *form* with iterative *substance*, useful for mutual recursion (`is_even`/`is_odd`) where straight iteration is awkward. Languages with proper TCO (Scheme, OCaml, Scala with @tailrec, Kotlin with tailrec keyword) need neither.

## complexity
time: O(n) — same as the recursive version.
space: O(1) stack with TCO or iteration; O(n) without.
notes: The win is purely in space. There is no asymptotic time difference — TCO removes a constant per-call frame overhead but adds nothing else.

## pitfalls
- Believing your language supports TCO because the spec mentions it — JavaScript spec'd it in ES2015; only Safari ever shipped it. Test before relying on it.
- Tail-position confusion: `return f(x) + 1` is not tail-position; `return f(x)` is. The +1 forces the frame to stay live.
- Mutual recursion is rarely tail-position in straight rewrites — use a trampoline.
- Trampolines hurt readability if overused — reach for iteration first; trampoline only when recursive structure is essential (interpreter, mutual recursion).

## interviewTips
- State the language's TCO behavior up front: "Python doesn't TCO, so for inputs >1000 deep I'll iterate."
- For tree problems, prefer explicit stack over recursion if the tree might be path-shaped (linked-list degenerate case).
- Show the accumulator-passing-style rewrite of a classical recursion — it signals you understand the underlying functional pattern.

## code.python
```python
import sys

def factorial_recursive(n):
    if n <= 1:
        return 1
    return n * factorial_recursive(n - 1)

def factorial_tail(n, acc=1):
    if n <= 1:
        return acc
    return factorial_tail(n - 1, acc * n)

def factorial_iter(n):
    acc = 1
    while n > 1:
        acc *= n
        n -= 1
    return acc

def trampoline(fn, *args):
    result = fn(*args)
    while callable(result):
        result = result()
    return result
```

## code.javascript
```javascript
function factorialRecursive(n) {
  if (n <= 1) return 1;
  return n * factorialRecursive(n - 1);
}

function factorialIter(n) {
  let acc = 1;
  while (n > 1) { acc *= n; n--; }
  return acc;
}

function trampoline(fn, ...args) {
  let result = fn(...args);
  while (typeof result === "function") result = result();
  return result;
}
```

## code.java
```java
public class TailRec {
    public long factorialRecursive(int n) {
        if (n <= 1) return 1;
        return (long) n * factorialRecursive(n - 1);
    }

    public long factorialIter(int n) {
        long acc = 1;
        while (n > 1) { acc *= n; n--; }
        return acc;
    }

    public interface Thunk<T> { Object apply(); }

    @SuppressWarnings("unchecked")
    public <T> T trampoline(Thunk<T> start) {
        Object result = start.apply();
        while (result instanceof Thunk) result = ((Thunk<T>) result).apply();
        return (T) result;
    }
}
```

## code.cpp
```cpp
long long factorialRecursive(int n) {
    if (n <= 1) return 1;
    return (long long) n * factorialRecursive(n - 1);
}

long long factorialIter(int n) {
    long long acc = 1;
    while (n > 1) { acc *= n; --n; }
    return acc;
}

long long factorialTail(int n, long long acc = 1) {
    while (n > 1) { acc *= n; --n; }
    return acc;
}
```
