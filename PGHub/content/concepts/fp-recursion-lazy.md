---
slug: fp-recursion-lazy
module: functional-programming
title: Recursion & Lazy Evaluation
subtitle: How functional programs loop without mutable counters, why tail calls turn recursion back into iteration, and how laziness lets you compute with infinite data.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 14
prereqs: [fp-higher-order-functions]
relatedProblems: []
references:
  - title: "Structure and Interpretation of Computer Programs — Section 1.2: Procedures and the Processes They Generate"
    url: "https://web.mit.edu/6.001/6.037/sicp.pdf"
    type: book
  - title: "Haskell Wiki — Tail recursion"
    url: "https://wiki.haskell.org/Tail_recursion"
    type: article
  - title: "Haskell Wiki — Lazy evaluation"
    url: "https://wiki.haskell.org/Lazy_evaluation"
    type: article
  - title: "MDN Web Docs — Recursion"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Recursion"
    type: docs
status: published
---

## intro

**Recursion** is how functional programs repeat work: instead of a mutable counter and a loop body that reassigns variables, a function calls *itself* on a smaller piece of the problem until it hits a **base case** that needs no further calls. Every recursive definition has two halves — the **base case** that stops the descent and the **recursive case** that shrinks the input and defers to itself. Two other ideas ride alongside it. **Tail-call optimization (TCO)** recognizes when a recursive call is the very last thing a function does and reuses the current stack frame instead of stacking a new one, so recursion runs in constant space like a loop. **Lazy evaluation** delays computing a value until something actually demands it, wrapping the pending work in a **thunk** — which is what lets a functional language build and manipulate genuinely *infinite* data structures.

## whyItMatters

Loops in imperative code lean on mutation: a counter you increment, an accumulator you overwrite. Functional programming forbids that mutation, so recursion is not a stylistic preference — it is the native control structure for repetition. Understanding it changes how you read and write code: you learn to spot the base case first, trust the recursive call on the smaller input, and reason by structural induction rather than by tracing a loop counter. Tail calls matter because naive recursion silently consumes stack space and blows up on large inputs — knowing which shape avoids that is the difference between elegant code and a `RecursionError`. Laziness matters because it decouples *how you produce* data from *how much you consume*: you can define "all the natural numbers" once and let each consumer take only what it needs. Together these ideas underpin streams, generators, and the composable pipelines that make functional code feel like plumbing rather than bookkeeping.

## intuition

Start with the simplest recursive function, factorial. To compute `factorial(4)` you say: 4 times `factorial(3)`, and to get `factorial(3)` you need `factorial(2)`, and so on down to `factorial(0)`, which is defined outright as `1`. That final line is the **base case** — the floor the recursion stands on. Everything above it is the **recursive case**, each layer waiting on the answer from below before it can finish its own multiplication. The mental model is a stack of paused computations: each call parks its `4 *`, its `3 *`, its `2 *` on the **call stack**, and only when the base case returns `1` does the whole tower collapse back upward, multiplying as it unwinds. This is beautiful and correct, but notice the cost: every pending multiplication occupies a stack frame, so the memory used grows with the depth of the recursion. Feed it `factorial(100000)` and the stack overflows.

The fix is to restructure the recursion so nothing is left pending. Carry the running answer *down* the recursion in an extra argument — an **accumulator** — instead of building it up on the way back. Now each call's last act is simply to call itself; there is no `4 *` waiting to be applied to the result. When the recursive call is the final operation with nothing to do afterward, the call is in **tail position**, and a compiler can perform **tail-call optimization**: it overwrites the current frame rather than pushing a new one. The recursion executes in constant stack space, exactly like a `while` loop — because at the machine level it *is* one. This is why "make it tail-recursive with an accumulator" is the standard move for turning a stack-hungry recursion into a safe loop.

**Lazy evaluation** attacks a different problem: doing work you might not need. In a strict language, arguments are fully evaluated before a function runs. In a lazy language, an expression is wrapped in a **thunk** — a suspended computation — and only forced into a real value when a consumer inspects it. This tiny delay has an outsized consequence: you can define **infinite** data. `[1..]` is every natural number; `fibs` is the entire Fibonacci sequence. Neither is ever computed in full — `take 5 [1..]` forces only the first five thunks and leaves the rest suspended. Laziness lets a *producer* describe an unbounded stream and a *consumer* decide how much to pull, and the two compose cleanly without either knowing the other's bounds. That producer/consumer separation is the deep payoff: generation and consumption become independent, reusable pieces.

## visualization

```
NON-TAIL factorial(4): each frame parks a pending "*" -> stack grows to depth 4
  push fact(4)   -> 4 * fact(3)      [waiting]
  push fact(3)   -> 3 * fact(2)      [waiting]
  push fact(2)   -> 2 * fact(1)      [waiting]
  push fact(1)   -> 1 * fact(0)      [waiting]
  push fact(0)   -> 1                (base case, returns)
  unwind: 1 -> 1*1 -> 2*1 -> 3*2 -> 4*6 = 24     (5 frames alive at peak)

TAIL factorial(4, acc=1): nothing pending -> reuse ONE frame (TCO)
  fact(4,1) -> fact(3,4) -> fact(2,12) -> fact(1,24) -> fact(0,24) -> 24

LAZY stream, naturals = [0,1,2,3,...]  (thunks in <>, forced -> value)
  nats     : 0 : <1..>            take 3 nats  forces ->  0
  force    : 0 : 1 : <2..>                                0 1
  force    : 0 : 1 : 2 : <3..>                            0 1 2   (stop; rest stays <thunk>)
```

## bruteForce

The imperative instinct is a mutable loop: initialize `result = 1`, run `for i in range(1, n+1): result *= i`, return `result`. It works and it is stack-safe, but it leans entirely on reassigning `result` — exactly the mutation functional code avoids, and the reason it does not translate to a pure setting. When people first reach for recursion instead, they typically write the *non-tail* version (`return n * factorial(n-1)`), which reads cleanly but quietly stacks a frame per call and crashes on large `n`. The eager, mutable style also cannot express infinite sequences at all: to work with "the Fibonacci numbers" you must decide up front how many to materialize into a list, tangling the generation logic with the consumption limit. Want the first prime above a million? You precompute a big-enough list and hope. Every consumer that needs a different amount forces you to re-run or over-generate. The shortcut works for small, bounded, mutation-friendly cases and fights you everywhere else.

## optimal

Lean on recursion, tail calls, and laziness as a coordinated toolkit rather than three separate tricks.

**Write recursion base-case-first and trust the smaller call.** State the terminating case explicitly, then handle the general case by reducing the input and delegating to yourself. Reasoning becomes induction: if the base case is right and each step shrinks toward it, the whole thing is right. This is the readable, declarative shape functional code is known for.

**Convert to tail recursion with an accumulator when depth is unbounded.** Thread the partial result through an argument so the recursive call is the function's last action. In a language with **TCO** (Scheme, Haskell, most functional runtimes, and Scala via `@tailrec`) this runs in **O(1) stack space** — a loop in disguise. Where the host lacks TCO (CPython deliberately omits it), fall back to an explicit loop or an explicit stack, but keep the accumulator discipline so the transformation is mechanical.

**Reach for laziness to separate producers from consumers.** Define data by *how each element follows from the last*, not by how many you want. An infinite stream — `[1..]`, `fibs = 0 : 1 : zipWith (+) fibs (tail fibs)` — costs nothing until forced. Consumers like `take`, `head`, `takeWhile`, and `find` pull exactly as many thunks as they need and leave the rest suspended. This gives **modular composition**: a generator and a filter and a limit can each be written independently and glued together, and only the demanded values are ever computed. It also enables self-referential definitions (a stream defined in terms of itself) that would loop forever under strict evaluation.

**Mind the shared cost.** Laziness trades predictable timing for flexibility: forcing happens on demand, so you must watch for retained thunks that pile up (a **space leak**) and force strictness at the right spot (`seq`, strict folds) when you need it. Used deliberately, the payoff is code that is both provably terminating (tail recursion) and boundlessly general (lazy streams) without ever mutating a variable.

## complexity

- **time:** Recursion does the same total work as the equivalent loop — `factorial(n)` is O(n) multiplications either way; tail vs non-tail changes *space*, not asymptotic time. Lazy evaluation never speeds a computation you fully consume, but forcing only a prefix (`take k` of an infinite stream) costs only O(k) — you pay strictly for what you demand, which can turn a would-be-infinite computation into a finite one.
- **space:** Non-tail recursion uses O(d) stack space for recursion depth d — this is what overflows. Tail-recursive calls under TCO use **O(1) stack**. Laziness adds heap for un-forced **thunks**; usually a small win, but retained thunks that never get forced accumulate into a space leak, turning an expected O(1) into O(n) memory.
- **notes:** TCO is a language/runtime guarantee, not universal — Scheme and Haskell provide it, JavaScript engines mostly dropped it, CPython omits it on purpose (hence its default recursion-limit guard). Infinite structures are only safe under laziness; force one fully (e.g. `length [1..]`) and it never returns.

## pitfalls

- **Missing or unreachable base case.** No base case (or a recursive case that does not shrink toward it) means the recursion never stops and the stack overflows. Fix: write the base case first and verify every recursive call moves strictly closer to it.
- **Assuming tail-call optimization exists.** Writing deep tail recursion in a runtime without TCO (JavaScript, CPython) still overflows — the tail-position rewrite only helps if the compiler honors it. Fix: confirm your language guarantees TCO; if not, use an explicit loop or an explicit stack while keeping the accumulator logic.
- **Accidental non-tail recursion.** A call that looks final but still has pending work — `return n * f(n-1)`, or `f(...) + 1`, or being inside a `try` — is not in tail position and will not be optimized. Fix: move the pending operation into an accumulator argument so the self-call is genuinely last.
- **Space leaks from unforced thunks.** Lazy accumulators (e.g. a lazy left fold) build a tower of deferred additions that only collapses when forced, spiking memory. Fix: force intermediate results with `seq` or use a strict fold (`foldl'`) where you know you will consume everything.
- **Forcing an infinite structure fully.** Calling `length`, `sum`, or `sort` on `[1..]` demands every element and hangs forever. Fix: always bound infinite streams with a lazy consumer (`take`, `takeWhile`, `find`) before any operation that forces the whole thing.

## interviewTips

- When asked to "make this recursion safe for large input," reach immediately for the accumulator/tail-call rewrite and name TCO — then note whether the target language actually provides it (say "CPython doesn't, so I'd loop; Scheme does, so tail recursion is fine"). Showing you know it is runtime-dependent signals depth.
- Be able to explain *why* non-tail recursion uses O(depth) space: draw the call stack, point at the pending operation each frame holds, and contrast it with the single reused frame of the tail version. The picture answers "why does one overflow and the other doesn't?" instantly.
- Bring up laziness as the mechanism behind infinite streams and generators, and connect it to producer/consumer separation. If asked the tradeoff, mention space leaks and forcing (`seq`, strict folds) — the fact that laziness has a cost is exactly what interviewers probe.

## keyTakeaways

- Recursion is functional programming's native loop: a base case that stops and a recursive case that shrinks the input; reason about it by induction, not by tracing a counter.
- Tail recursion with an accumulator puts the self-call in the last position, letting a TCO-capable runtime reuse one stack frame — O(1) space instead of O(depth) — but the guarantee depends on the language.
- Lazy evaluation defers work into thunks and enables infinite data structures; consumers force only what they demand, which cleanly separates producers from consumers at the cost of watching for space leaks.

## code.python

```python
"""Recursion, an explicit tail-style accumulator, and a lazy infinite stream.

CPython has no TCO and a default recursion limit, so deep recursion overflows.
The accumulator version below is *shaped* like a tail call; in a TCO language it
would run in O(1) stack. Generators give us Python's version of lazy streams.
"""
import sys
from itertools import count, islice


def factorial_naive(n):
    # non-tail: the "n *" is pending, so each call parks a frame
    if n == 0:
        return 1
    return n * factorial_naive(n - 1)


def factorial_tail(n, acc=1):
    # tail-shaped: the recursive call is the last action (acc carries the answer)
    if n == 0:
        return acc
    return factorial_tail(n - 1, acc * n)


def naturals():
    # lazy infinite stream: yields on demand, never fully materialized
    yield from count(0)


def fibs():
    a, b = 0, 1
    while True:            # infinite, but each value is produced only when pulled
        yield a
        a, b = b, a + b


if __name__ == "__main__":
    print("factorial_naive(5) =", factorial_naive(5))
    print("factorial_tail(5)  =", factorial_tail(5))
    # force only a prefix of two infinite streams:
    print("first 5 naturals   =", list(islice(naturals(), 5)))
    print("first 8 fibs       =", list(islice(fibs(), 8)))
    print("recursion limit    =", sys.getrecursionlimit(), "(why naive overflows)")
```

## code.javascript

```javascript
// Non-tail vs accumulator recursion, plus a lazy stream via a generator.
// Note: modern JS engines dropped tail-call optimization, so deep recursion
// still overflows here -- the accumulator form is shown for shape, and the
// generator gives us laziness (values produced only when pulled).

function factorialNaive(n) {
  if (n === 0) return 1;          // base case
  return n * factorialNaive(n - 1); // "n *" is pending -> not a tail call
}

function factorialTail(n, acc = 1) {
  if (n === 0) return acc;        // accumulator carries the running product
  return factorialTail(n - 1, acc * n); // last action -> tail-shaped
}

function* fibs() {
  let [a, b] = [0, 1];
  while (true) {                  // infinite; each yield is lazy
    yield a;
    [a, b] = [b, a + b];
  }
}

function take(n, gen) {
  const out = [];
  for (const x of gen) {          // pulls exactly n thunks, then stops
    if (out.length === n) break;
    out.push(x);
  }
  return out;
}

console.log("factorialNaive(5) =", factorialNaive(5));
console.log("factorialTail(5)  =", factorialTail(5));
console.log("first 8 fibs      =", take(8, fibs()));
```

## code.haskell

```haskell
-- Haskell has TCO and is lazy by default, so this is the natural home for
-- these ideas: tail recursion runs in constant stack, and infinite lists are
-- ordinary values that cost nothing until forced.

module Main where

-- non-tail: the (n *) waits on the recursive result
factorialNaive :: Integer -> Integer
factorialNaive 0 = 1
factorialNaive n = n * factorialNaive (n - 1)

-- tail-recursive with an accumulator: the self-call is the last action
factorialTail :: Integer -> Integer
factorialTail n = go n 1
  where
    go 0 acc = acc
    go k acc = go (k - 1) (acc * k)

-- infinite streams: laziness makes these finite to *use*
naturals :: [Integer]
naturals = [0 ..]

fibs :: [Integer]
fibs = 0 : 1 : zipWith (+) fibs (tail fibs)  -- self-referential, only works lazily

main :: IO ()
main = do
  print (factorialNaive 5)      -- 120
  print (factorialTail 5)       -- 120
  print (take 5 naturals)       -- [0,1,2,3,4]  (rest stays unforced)
  print (take 8 fibs)           -- [0,1,1,2,3,5,8,13]
```
