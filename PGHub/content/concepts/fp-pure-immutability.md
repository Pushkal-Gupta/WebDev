---
slug: fp-pure-immutability
module: functional-programming
title: Pure Functions & Immutability
subtitle: Why a function that depends only on its inputs and changes nothing outside itself is the quiet superpower behind testable, cacheable, parallel-safe code.
difficulty: Beginner
position: 1
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "Structure and Interpretation of Computer Programs (SICP)"
    url: "https://web.mit.edu/6.001/6.037/sicp.pdf"
    type: book
  - title: "Haskell Wiki — Functional programming"
    url: "https://wiki.haskell.org/Functional_programming"
    type: article
  - title: "Haskell Wiki — Referential transparency"
    url: "https://wiki.haskell.org/Referential_transparency"
    type: article
  - title: "MDN — Object.freeze()"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze"
    type: docs
status: published
---

## intro

A **pure function** is one whose result depends *only* on the arguments you pass it, and which changes *nothing* observable outside itself. Call it with the same inputs and you get the same output — every time, forever, no matter what else the program is doing. It reads no global state, writes no global state, prints nothing, touches no file, asks no clock, rolls no dice. Everything it does is captured in the value it returns. Closely tied to this is **immutability**: data that, once created, is never modified in place — you build new values from old ones instead of overwriting them. Together, purity and immutability turn a function into something you can trust like a mathematical formula: `square(5)` is `25` the way `5 * 5` is `25`, with no hidden ceremony. This is the bedrock idea underneath all of functional programming.

## whyItMatters

Most bugs in large programs are not wrong arithmetic — they are *surprises*: a function quietly changed a list you were still using, two threads scribbled over the same variable, a value depended on a global that some faraway code had flipped. Purity and immutability delete whole categories of these surprises by construction. A pure function is trivially **testable** — no mocks, no setup, no teardown, just `assert f(input) == expected`. It is safely **cacheable** (memoizable), because the same input always yields the same output. It is **parallelizable** for free, since functions that share no mutable state cannot race each other. And it is **reasoning-friendly**: you can understand it by reading it alone, without tracing the entire program's history. That local-reasoning property is what lets teams work on huge codebases without every change becoming a landmine hunt. Purity is not academic purity — it is the practical discipline that keeps big software comprehensible.

## intuition

Picture the difference between a **vending machine** and a **conversation**. A vending machine is pure: you put in the same code, you get the same snack, and nothing about yesterday's purchases changes today's result. A conversation is impure: the same sentence means different things depending on what was said before, who is in the room, and what mood everyone is in. Pure functions are vending machines. You can predict them completely from what you feed in, and they leave the world exactly as they found it.

The sharpest way to feel purity is **referential transparency**: the property that you can replace any function call with its result *without changing the meaning of the program*. If `add(2, 3)` is pure, then anywhere the program writes `add(2, 3)` you could substitute `5` and nothing else would shift. This is exactly how you simplify algebra — you swap `2 + 3` for `5` freely. When a call is referentially transparent, your whole program becomes something you can reason about by substitution, the way a mathematician rewrites an equation. The moment a function reads a clock, prints to a screen, or mutates a shared list, that substitution breaks: replacing the call with its "value" would silently drop the effect, so the call is *not* interchangeable with its result. That broken substitution is the precise, technical fingerprint of impurity.

Now what actually breaks purity? **Side effects** — anything a function does besides computing its return value. The usual suspects: performing input/output (printing, reading a file, hitting the network), **mutating** data that lives outside the function (a global, a field, a caller's array), reading mutable global state, and consulting nondeterministic sources like the current time or a random-number generator. Each of these ties the function's behavior to the *when* and *where* of the call, not just the *what* of its arguments. A function that returns `now().hour` gives you a different answer at 2pm than at 3pm; a function that appends to a list you passed in leaves your list changed behind your back.

**Immutability** is the natural partner. If values can never change after creation, then passing data to a function can never corrupt it — the worst a function can do is compute a *new* value and hand it back. You stop worrying "did this call scribble on my data?" because it structurally cannot. Modern languages make cheap immutable data practical through **persistent data structures** and **structural sharing**: an "updated" copy shares most of its internals with the original and only allocates the small part that actually differs, so you get value semantics without copying gigabytes. The mental model to internalize: *data is a photograph, not a whiteboard.* You never erase and rewrite — you take a new photo that happens to look mostly like the last one.

## visualization

```
IMPURE (mutates caller's data + reads a global)      PURE (inputs -> output only)

  total_tax = 0                                        def with_tax(price, rate):
  def add_item(cart, price):                               return price * (1 + rate)
      global total_tax
      total_tax += price * 0.1   <-- side effect        same call, same answer, always:
      cart.append(price)         <-- mutates arg           with_tax(100, 0.1) -> 110.0
      return cart                                          with_tax(100, 0.1) -> 110.0

  cart = [10]                                          REFERENTIAL TRANSPARENCY:
  add_item(cart, 100)   # cart now [10,100], global!     result of  with_tax(100,0.1)  == 110.0
  add_item(cart, 100)   # different global each call      so anywhere you wrote with_tax(100,0.1)
                                                          you may paste 110.0 -> program unchanged

  IMMUTABLE UPDATE (structural sharing):
     old = (1, 2, 3)                new = old + (4,)      old still (1,2,3)  new (1,2,3,4)
     old ---> [1][2][3]                                   new reuses the shared prefix,
     new ---> [1][2][3][4]   (prefix shared, tail added)  nothing overwritten in place
```

## bruteForce

The imperative default is to keep state in variables and *change it as you go*: a running total you increment, a list you push onto, an object whose fields you overwrite in place. It feels efficient and direct — one buffer, edited repeatedly. The trouble shows up the instant the program grows. A function that mutates an argument surprises every caller still holding a reference to that argument. A value pulled from a global means the function's result silently depends on whatever last wrote that global, so the same call gives different answers at different times. Tests need elaborate setup to recreate the exact world the function expects, and they break when unrelated code touches shared state. Debugging becomes archaeology: to explain a wrong value you must reconstruct the entire sequence of mutations that led to it. And the moment you add threads, two mutations to the same memory race, producing corruption that only appears under load. The efficiency was real but local; the cost is paid globally, in every hour spent asking "who changed this, and when?"

## optimal

Write functions that take everything they need as arguments, return everything they produce as a result, and touch nothing else — then push the unavoidable effects to the edges.

**Depend only on inputs.** Pass state in explicitly instead of reading globals. If a function needs the tax rate, the config, or the clock's value, make it a parameter. Now the function's behavior is fully described by its signature, and every call is reproducible. This single move is what makes a function testable without mocks and cacheable without cache-invalidation nightmares.

**Return new values; never mutate in place.** Instead of appending to the caller's list, build and return a new list. Instead of setting `obj.field = x`, produce a new object with that field changed. Callers keep their originals intact, so no call can corrupt data another part of the program is relying on. With **persistent data structures**, this is cheap: the new value shares structure with the old, allocating only the delta.

**Preserve referential transparency.** Keep calls interchangeable with their results, because that is the property that lets you reason by substitution, memoize aggressively, reorder and parallelize freely, and refactor without fear. Any expression you can replace with its value is an expression you fully understand.

**Quarantine the effects you can't avoid.** Real programs must do I/O, read clocks, and generate randomness — purity does not forbid effects, it *concentrates* them. Push printing, network calls, database writes, and time/random reads to a thin outer shell, and keep the decision-making core pure. This "functional core, imperative shell" split gives you a large, easily tested, easily parallelized center wrapped by a small, carefully reviewed edge. The payoff compounds: pure code you can trust locally, immutable data you can share fearlessly across threads, and a program whose behavior you can predict by reading it rather than running it.

## complexity

- **time:** A pure function costs the same as its impure twin to *run once*; purity is free at call time. The visible tradeoff is that immutable updates allocate a new value instead of editing in place. Naive full copying is O(n) per update, but **persistent data structures** with structural sharing bring updates down to O(log n) or amortized O(1), so the asymptotic cost usually matches mutation.
- **space:** Immutability trades some memory for safety — old and new versions coexist until the old is garbage-collected. With structural sharing, an update allocates only O(log n) or O(1) new nodes rather than a full O(n) copy, and the shared prefix is not duplicated. Memoizing a pure function costs extra space to store cached results, in exchange for skipping recomputation.
- **notes:** Purity's real "cost" is a discipline, not a runtime penalty: you must thread state through arguments and return values rather than reaching for a convenient global. What you buy is enormous — trivial testing, free memoization, safe parallelism, and local reasoning. In hot loops where a single buffer genuinely must be mutated, keep that mutation *local* (created and consumed inside one function) so the function stays pure from the outside.

## pitfalls

- **Hidden mutation of arguments.** A function that calls `list.append(x)` or `obj.field = y` on something it was passed silently changes the caller's data. Fix: build and return a new value, or defensively copy at the boundary; in JS reach for spread/`Object.freeze`, in Python return a new list/tuple instead of mutating.
- **"Pure" functions that secretly read globals or the clock.** Depending on a module-level variable, `Date.now()`, or `random()` makes the same call return different results, breaking referential transparency without any obvious mutation. Fix: pass those values in as parameters so the dependency is explicit and the function stays reproducible.
- **Shallow copies that still share mutable innards.** Copying the outer list but not its nested objects (a shallow copy) leaves the inner data shared and mutable, so an "immutable" update still leaks. Fix: use deep-copy or genuinely persistent structures for nested data, or freeze recursively.
- **Treating purity as all-or-nothing and giving up.** Concluding "my program does I/O so purity is impossible" throws away the benefit. Fix: adopt the functional-core / imperative-shell split — keep the logic pure and confine effects to a thin, well-tested edge.
- **Memoizing an impure function.** Caching results of a function that actually depends on hidden state returns stale answers when that state changes. Fix: only memoize functions you have verified are referentially transparent.

## interviewTips

- Define a pure function crisply — output depends only on inputs, and it produces no observable side effects — then give the one-line test for it: *can you replace every call with its return value without changing the program?* That is referential transparency, and naming it signals you understand the "why," not just the slogan.
- Be ready to list what breaks purity (I/O, mutating shared state, reading globals, time/random) and to explain the concrete payoffs (testability, memoization, parallelism, local reasoning). Interviewers love "why does immutability help concurrency?" — answer: data that never changes can't be raced on.
- Mention that purity doesn't ban effects, it concentrates them (functional core, imperative shell), and that immutability is made affordable by structural sharing — this shows you know the real-world engineering, not just the ideal.

## keyTakeaways

- A pure function's result depends only on its arguments and it changes nothing outside itself; the litmus test is referential transparency — you can swap any call for its value without changing the program's meaning.
- Side effects (I/O, mutating shared state, reading globals, consulting the clock or randomness) are exactly what break purity, and immutability — building new values instead of overwriting old ones, made cheap by structural sharing — is purity's natural partner.
- The payoff is practical, not academic: pure, immutable code is trivial to test, safe to cache, free to parallelize, and understandable by local reasoning; keep the logic pure and push unavoidable effects to a thin outer shell.

## code.python

```python
"""Pure vs impure: same task, two styles, plus a memoization payoff."""

from functools import lru_cache

# ---- IMPURE: mutates the caller's list and reads a global ----
DISCOUNT = 0.0  # some faraway code might change this

def add_priced_impure(cart, item, price):
    global DISCOUNT
    cart.append((item, price * (1 - DISCOUNT)))  # mutates arg
    return cart

# ---- PURE: inputs in, new value out, nothing else touched ----
def add_priced_pure(cart, item, price, discount):
    final = price * (1 - discount)
    return cart + [(item, final)]  # brand-new list; original untouched

# ---- PURE functions are safe to memoize (referential transparency) ----
@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

if __name__ == "__main__":
    original = [("apple", 1.00)]
    updated = add_priced_pure(original, "pear", 2.00, discount=0.1)
    print("original stays:", original)   # [('apple', 1.0)]  -- unchanged
    print("updated is new:", updated)     # [('apple', 1.0), ('pear', 1.8)]

    # Referential transparency: fib(30) is always the same value,
    # so caching it is always correct.
    print("fib(30):", fib(30))            # 832040, computed once, then cached
    print("fib(30) again:", fib(30))      # instant: same input -> same output
```

## code.javascript

```javascript
// Pure vs impure, plus an immutable update via structural spread.

// IMPURE: mutates the array it was given and reads an outer variable.
let taxRate = 0.1;
function addItemImpure(cart, price) {
  cart.push(price * (1 + taxRate)); // mutates caller's array
  return cart;
}

// PURE: returns a new array, takes the rate as an argument.
function addItemPure(cart, price, rate) {
  return [...cart, price * (1 + rate)]; // fresh array; original intact
}

// Object.freeze makes accidental mutation fail loudly (in strict mode).
function withField(obj, key, value) {
  return Object.freeze({ ...obj, [key]: value }); // new frozen object
}

const original = Object.freeze([10]);
const next = addItemPure(original, 100, 0.1);
console.log("original:", original); // [ 10 ]  -- unchanged
console.log("next:", next);         // [ 10, 110 ]

const user = withField({ name: "Ada" }, "role", "admin");
console.log(user);                  // { name: 'Ada', role: 'admin' }

// Referential transparency: addItemPure(original,100,0.1) IS [10,110],
// so you could paste that value anywhere the call appears.
```

## code.haskell

```haskell
-- In Haskell purity is enforced by the type system: a function with no IO
-- in its type CANNOT perform side effects. Data is immutable by default.

module Main where

-- Pure: result depends only on arguments, no effects possible.
withTax :: Double -> Double -> Double
withTax rate price = price * (1 + rate)

-- "Updating" a list means producing a new one; the old list is unchanged.
addItem :: [Double] -> Double -> [Double]
addItem cart price = cart ++ [price]

-- Effects live in IO and are visibly separated from the pure core.
main :: IO ()
main = do
  let original = [10.0]
      updated  = addItem original (withTax 0.1 100)
  putStrLn ("original: " ++ show original) -- [10.0]  -- unchanged
  putStrLn ("updated:  " ++ show updated)  -- [10.0,110.0]
  -- Referential transparency: withTax 0.1 100 is always 110.0,
  -- so it may be replaced by its value anywhere it appears.
  print (withTax 0.1 100 == 110.0)         -- True
```
