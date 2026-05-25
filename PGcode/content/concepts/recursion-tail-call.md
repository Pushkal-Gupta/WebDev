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
A function call needs a stack frame because, after the callee returns, the caller still has work to do — combine the result with a local variable, apply a transformation, return it from inside another expression. A tail call is one where the callee's return value *is* the caller's return value, with nothing further to compute. In that case the caller's stack frame is dead weight — its locals will never be read again, its return address can be skipped over, and the callee can simply reuse the same frame. That is Tail Call Optimization (TCO): the compiler detects a tail-position call and emits a jump-with-argument-update instead of a true call-and-return. The classical demonstration is factorial. `def fact(n): return n * fact(n - 1) if n > 1 else 1` is not tail-recursive — after the recursive call returns, the caller still has to multiply by `n`, so its frame must stay alive to hold `n` and the pending multiply. `def fact_tail(n, acc=1): return fact_tail(n - 1, acc * n) if n > 1 else acc` is tail-recursive — the recursive call is the last action, the multiply is folded into the accumulator argument *before* the call, and the caller's frame has no live state to preserve. The accumulator trick is structurally identical to a loop's running variable: "compute and pass forward" instead of "recurse and combine on return." Languages with proper TCO (Scheme, OCaml, Erlang, Scala with `@tailrec`, Kotlin with `tailrec`, Lua) collapse the entire recursion into a constant-stack loop at zero runtime cost. Most mainstream languages (Python, JVM, V8 outside Safari, CPython, Ruby) do *not* implement TCO and treat tail calls identically to non-tail calls — the recursion still stacks frames and crashes at the language's depth limit. The deep insight is that tail-recursion is a syntactic property the *programmer* writes, but stack-frame elimination is an *implementation* choice the compiler makes; the two only line up in TCO-supporting languages.

## visualization
Frame stack for non-tail `factorial(4)`: 4 frames stacked, each waiting to multiply by its n. Frame stack for tail-recursive `factorial_iter(4, 1)`: with TCO, exactly 1 frame, mutated in place — n decrements, acc accumulates, the rest disappears. Without TCO, still 4 frames; the optimization is purely a compiler choice.

## bruteForce
Naïve recursion blows the stack at depth ~1000 in Python (configurable but C-stack-bounded at ~10,000), ~10,000-50,000 in Java, ~10,000 in V8. Brute-force fix in those languages: `sys.setrecursionlimit(100000)` or rewrite as iteration. The setrecursionlimit path is fragile because the C stack is finite — bump too high and you segfault rather than getting a Python exception.

## optimal
Two language-agnostic strategies for surviving deep tail-recursive structure without TCO. First, refactor to a true `while` loop — the most portable solution and the one you should reach for in production Python, Java, or non-Safari JavaScript. Replace the recursive call with a parameter update inside the loop body; the structure of the loop mirrors the tail-call transformation a TCO-capable compiler would have done automatically. Second, use a trampoline — instead of calling yourself recursively, return a thunk (a zero-argument callable that, when invoked, performs the next step). An outer driver loop invokes thunks until a non-thunk value is returned. The trampoline preserves recursive *form* — the function still looks like it is calling itself — but the *substance* is iterative because no recursive call ever happens on the stack. Trampolines are most valuable for mutual recursion (the classic `is_even`/`is_odd` example) where straight iteration is awkward.

```python
# Non-tail recursion: stack overflows around n=1000 in Python.
def fact_recursive(n):
    if n <= 1:
        return 1
    return n * fact_recursive(n - 1)            # NOT tail position: multiply pending

# Tail-recursive in shape, but Python ignores TCO — still overflows at depth ~1000.
def fact_tail(n, acc=1):
    if n <= 1:
        return acc
    return fact_tail(n - 1, acc * n)            # tail position, but no TCO

# Production-safe: explicit while loop. Constant stack, identical semantics.
def fact_iter(n):
    acc = 1
    while n > 1:
        acc *= n                                # accumulator mirrors tail-call's acc argument
        n -= 1
    return acc

# Trampoline: useful for mutual recursion where straight iteration is awkward.
def trampoline(fn, *args):
    result = fn(*args)
    while callable(result):
        result = result()
    return result
```

The `fact_iter` version is the canonical TCO-by-hand transformation — the while loop and accumulator update do exactly what a TCO-capable compiler would emit. Always check your language's TCO behavior before relying on tail-call form; treat tail-recursion as a documentation aid, not a performance guarantee, in any mainstream language.

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
