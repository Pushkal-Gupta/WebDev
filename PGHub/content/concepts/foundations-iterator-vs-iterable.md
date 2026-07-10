---
slug: foundations-iterator-vs-iterable
module: foundations-analysis
title: Iterable vs Iterator
subtitle: An iterable produces an iterator; an iterator produces values. Confusion between them causes "for loop ran zero times" bugs in every language.
difficulty: Beginner
position: 37
estimatedReadMinutes: 4
prereqs: []
relatedProblems: []
references:
  - title: "Python docs — Iterators & Generators (PEP 234)"
    url: "https://docs.python.org/3/howto/functional.html"
    type: book
  - title: "MDN — JavaScript iteration protocols"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols"
    type: blog
  - title: "TheAlgorithms/Python — Iterator examples"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
The two terms sound identical but mean different things. An **iterable** is "something you can iterate" — a list, a string, a generator function, anything with an `__iter__` / `Symbol.iterator` method. An **iterator** is "the cursor that produces values" — the stateful object returned by calling `iter(iterable)`. Iterators are usually single-use; iterables can produce a fresh iterator each time.

## whyItMatters
- The most common Python / JS bug after `off-by-one`: re-iterating an iterator and getting zero results because the previous loop exhausted it.
- Generators are iterators, not iterables-of-generators — re-running `for x in gen` after a complete loop yields nothing.
- File handles, database cursors, network streams all behave as iterators — single-use; tee-ing requires explicit duplication.
- Understanding this clarifies `itertools.tee`, `zip`, `map`, async iteration, and most "lazy sequence" libraries.

## intuition
Reframe it as a book and a bookmark. The **iterable** is the book — it holds the content and can be read as many times as you like. The **iterator** is a bookmark placed in that book — it remembers exactly one position and advances as you read. Asking the book for a reader (`iter(iterable)`) hands you a brand-new bookmark parked at page one. Ask twice and you get two independent bookmarks that move on their own. But a bookmark is not a book: once it reaches the last page it stays there, and asking a bookmark for "a reader" just gives you back the same bookmark, still at the end.

**Iterable**: an object whose `__iter__()` returns a fresh iterator each call. Stateless from the caller's view; iterable can be looped multiple times.

**Iterator**: an object with `__next__()` that produces values until raising StopIteration. Stateful — every `next(it)` consumes one value. Iterating again only continues from where you left off.

Concrete micro-example. Take the list `[10, 20, 30]`. It is an iterable, so `iter([10,20,30])` gives a bookmark `it`; `next(it)` returns 10, again 20, again 30, and a fourth call raises `StopIteration`. Now the subtle part — what's actually happening when you write `for x in [10,20,30]` twice: each `for` silently calls `iter()` on the LIST, getting a fresh bookmark, so both loops see all three values. But if you write `g = (x for x in [10,20,30])`, `g` is already a bookmark, not a book. The first `for x in g` walks it to exhaustion; the second `for x in g` calls `iter(g)`, which for an iterator returns `g` itself — still parked at the end — so the loop body never runs and you silently get zero iterations. That single distinction is the root cause of nearly every "my loop ran once and then stopped working" bug.

```
iterable = [1, 2, 3]    # list IS an iterable
it = iter(iterable)     # iter() returns an iterator
next(it)  # 1
next(it)  # 2
next(it)  # 3
next(it)  # raises StopIteration

it2 = iter(iterable)    # fresh iterator
next(it2)  # 1 again — iterable produces independent cursors
```

A generator's resulting object is an iterator (not iterable-of-generators):
```
def gen(): yield 1; yield 2

g = gen()       # g is an iterator
list(g)         # [1, 2]
list(g)         # [] — already exhausted!
```

## visualization
```
Iterable (a list):                  Iterator (the cursor):

  [10, 20, 30]                       it = iter([10, 20, 30])
   ^                                  position --> ^
   |                                                |  next() → 10
   |                                                ^      position advances
   |                                                |  next() → 20
   |                                                ^
   iter(iterable)                                   |  next() → 30
   produces a fresh                                 ^
   iterator each time                               |  next() → StopIteration

Multiple iterators on same iterable:
  it1 = iter(L)   it2 = iter(L)   it1 and it2 are INDEPENDENT cursors
  next(it1) → 10  next(it2) → 10
  next(it1) → 20  next(it2) → 20

Single iterator (e.g., a generator):
  gen()  → returns ITERATOR g
  list(g) → [10, 20, 30]
  list(g) → []                — g is exhausted; no "iter(g)" gives fresh
```

## bruteForce
**Wrap in list() everywhere** to "convert" iterators to iterables: works but defeats the purpose of lazy iteration (materializes everything in memory).

**Always re-create the generator**: works but verbose: `gen_factory()` each time.

**Wrap a generator in a class with a fresh `__iter__`**: lazy AND re-iterable.

## optimal
The reliable design rule: **if you want something re-iterable, expose an iterable (a fresh-bookmark factory), not a bare iterator.** The key tradeoff is laziness versus repeatability. A raw generator is maximally lazy — it computes values on demand and holds no history — but that same statelessness is exactly why it cannot be replayed. Wrapping the generator inside a class whose `__iter__` builds a NEW generator each call buys you both: still lazy per pass, yet every pass starts clean. That is why `Squares` and `CountUp` below can be `list()`-ed twice, while the bare `count_up_gen(3)` gives `[0,1,2]` then `[]`.

Why the wrapper is correct: `for` and `list()` always begin by calling `iter()` on their argument. When that argument is a factory whose `__iter__` returns a freshly-constructed generator, the loop can never observe a partially-drained cursor — each consumer gets its own. When the argument is already an iterator, `iter()` returns the same object, so consumers share and race over one cursor.

Step-by-step recognizing the two: an object with `__iter__` but no `__next__` is an iterable (list, str, dict, the `Squares` wrapper); an object with BOTH, whose `__iter__` returns `self`, is an iterator (generators, file handles, `zip`/`map` objects, DB cursors). Complexity intuition: one full iteration is O(N) either way; the difference is that an iterable's second pass is another O(N) of real work, whereas an iterator's second pass is O(1) and yields nothing. `tee` trades memory to fake repeatability — it buffers every value until all branches consume it, so if consumers drift apart it can hold O(N) in memory.

**Test if something is iterable**: `hasattr(obj, '__iter__')` in Python; `Symbol.iterator in obj` in JS.

**Test if something is an iterator**: in Python, iterators must have BOTH `__iter__` AND `__next__`. An iterator's `__iter__` returns itself.

**Make an iterable that returns fresh iterators**:
```python
class Squares:
    def __init__(self, n): self.n = n
    def __iter__(self):
        return iter(i * i for i in range(self.n))   # new generator each call

s = Squares(5)
list(s)   # [0, 1, 4, 9, 16]
list(s)   # [0, 1, 4, 9, 16] — works again!
```

**Splitting an iterator** (so multiple consumers can read the same stream):
```python
from itertools import tee
gen = (x*x for x in range(5))
a, b = tee(gen, 2)
list(a)   # [0, 1, 4, 9, 16]
list(b)   # [0, 1, 4, 9, 16]   — but cost: tee buffers all consumed values
```

**JavaScript equivalent**:
```js
const iterable = [1, 2, 3];
const iter1 = iterable[Symbol.iterator]();
const iter2 = iterable[Symbol.iterator]();
// independent

function* gen() { yield 1; yield 2; }
const g = gen();
[...g];   // [1, 2]
[...g];   // [] — exhausted
```

## complexity
- **Iterable iteration**: O(N) per pass, repeatable.
- **Iterator iteration**: O(N) total — second pass yields nothing.
- **tee() cost**: buffers values until all consumers have read; could be O(N) memory if consumers drift.

## pitfalls
- **Re-using an exhausted iterator.** Calling `list(gen)` twice gives `[items]` then `[]`. Fix: wrap the generator in a class with a fresh `__iter__`, or call the generator factory anew (`gen_factory()`).
- **Confusing `for x in iter:` with `for i, x in enumerate(iter):`.** Both work, but inner `for` loops over the same iterator advance it. Fix: convert to list if you need random / repeated access.
- **`zip(it1, it2)` consumes both.** Even on early termination, `zip` may have pulled an extra element from one. Fix: use `zip_longest` if you care, or use a generator-based zip that explicitly checks.
- **`for x in xs: for y in xs:` with `xs` a generator.** Inner loop drains the generator on first outer iteration; subsequent outer iterations see empty. Fix: convert outer or inner `xs` to list, or use two separate generators.
- **Assuming `iter(it)` returns a copy of the iterator.** In Python, `iter(it)` for an iterator returns `it` itself (same cursor). Fix: use `itertools.tee` to split.
- **JS `for...in` vs `for...of`.** `for...in` iterates *keys* of an object (including inherited); `for...of` invokes the iteration protocol. Fix: use `for...of` for arrays / iterables; `for...in` only for plain object keys.

## interviewTips
- For "iterate twice but only got once" → exhausted iterator. Wrap in iterable.
- Cite **`iter()` returns iterator from iterable; iterator's `__iter__` returns self** as the spec.
- For senior interviews, discuss **async iterators** (`async for`), **generator delegation** (`yield from`), **iterator helpers** TC39 proposal, **Java Stream pipeline** semantics.

## code.python
```python
# A custom iterable that's re-iterable
class CountUp:
    def __init__(self, n): self.n = n
    def __iter__(self):
        i = 0
        while i < self.n:
            yield i
            i += 1

c = CountUp(3)
print(list(c))   # [0, 1, 2]
print(list(c))   # [0, 1, 2] — works again

# A generator (NOT re-iterable)
def count_up_gen(n):
    i = 0
    while i < n:
        yield i
        i += 1

g = count_up_gen(3)
print(list(g))   # [0, 1, 2]
print(list(g))   # [] — exhausted
```

## code.javascript
```javascript
// Iterable: has Symbol.iterator
const it = {
  *[Symbol.iterator]() {
    yield 1; yield 2; yield 3;
  }
};
console.log([...it]);   // [1, 2, 3]
console.log([...it]);   // [1, 2, 3] — re-iterable

// Iterator from a generator: NOT re-iterable
function* gen() { yield 1; yield 2; }
const g = gen();
console.log([...g]);   // [1, 2]
console.log([...g]);   // []
```

## code.java
```java
// Iterable produces fresh iterators
List<Integer> list = List.of(1, 2, 3);
list.forEach(System.out::println);   // works
list.forEach(System.out::println);   // works again

// Stream is one-shot
Stream<Integer> s = list.stream();
s.forEach(System.out::println);          // works
s.forEach(System.out::println);          // throws IllegalStateException
```

## code.cpp
```cpp
// Containers are iterable via begin()/end() — return fresh iterators each call
std::vector<int> v = {1, 2, 3};
for (int x : v) std::cout << x;   // 1 2 3
for (int x : v) std::cout << x;   // 1 2 3

// Manually obtain an iterator — single-use cursor
auto it = v.begin();
while (it != v.end()) { std::cout << *it; ++it; }
// now it == v.end(); to re-iterate, get a fresh one with v.begin()
```
