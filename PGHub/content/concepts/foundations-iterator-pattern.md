---
slug: foundations-iterator-pattern
module: foundations-analysis
title: Iterator Pattern
subtitle: Lazy sequence abstraction — pull next value on demand without materializing the whole collection. Python generators, JS iterables, Java's Iterator, C++ ranges.
difficulty: Beginner
position: 36
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Sedgewick & Wayne — Algorithms (Java iteration)"
    url: "https://algs4.cs.princeton.edu/13stacks/"
    type: book
  - title: "Python docs — Iterators & Generators"
    url: "https://docs.python.org/3/howto/functional.html"
    type: blog
  - title: "TheAlgorithms/Python — Iterator-based utilities"
    url: "https://github.com/TheAlgorithms/Python"
    type: repo
status: published
---

## intro
An **iterator** is an object that produces a sequence of values one at a time on demand. It decouples *what you're iterating over* from *how* — the caller writes `for x in xs:` without caring whether `xs` is a list, a file, a database cursor, or an infinite stream. The cornerstone of lazy evaluation in modern languages.

## whyItMatters
Iterators are the universal interface for sequences. Without them, you reinvent traversal for every container; with them, you write `for x in container` and the language does the work. Python's `itertools`, JavaScript's `for...of`, Java's `Iterable`/`Stream`, C++20 `ranges`, Rust's `Iterator` trait, and Go's `range` are all the same pattern with different syntax. The pattern is also the foundation of lazy evaluation: you can chain `filter -> map -> take(10)` over a billion-row file and only touch the first matching rows. Database cursors, network response streams, generator-based coroutines (`async for` in Python, async iterators in JavaScript), and the entire reactive-streams ecosystem (RxJava, Reactor, RxJS) are concrete implementations. The Gang of Four book formalized the pattern in 1994; nearly every modern language now bakes it into syntax.

## intuition
An iterator is a tiny state machine with one method: "give me the next value or tell me you are done." That contract is the smallest possible interface for a sequence and lets every consumer treat lists, files, sockets, generators, and database cursors identically.

The power comes from what the state machine can hide. A list iterator advances an integer index. A file iterator pulls one line from disk at a time, never loading the whole file. A generator iterator runs your code up to the next `yield` and pauses; the next `next()` call resumes from exactly that point. A database cursor lazily fetches rows in batches. The consumer cannot tell the difference and does not need to.

The second power is composition. Because each iterator only exposes "give me the next value," you can wrap one iterator in another that transforms or filters on the way out. `map(f, it)` is an iterator that, on each `next()`, pulls one value from `it`, applies `f`, and returns the result. `filter`, `take`, `drop`, `chain`, `zip`, `groupby` all work the same way. The pipeline is *pull-driven*: nothing executes until the consumer asks for a value. That is why `take(10)` over a billion-row generator only touches eleven values. It is also why `itertools` and the equivalent stream libraries have such small memory footprints — the entire pipeline is a chain of state machines, not an intermediate list.

## visualization
```
list = [1, 2, 3, 4, 5]
filtered = filter(lambda x: x % 2 == 0, list)   # iterator, no work yet
doubled  = map(lambda x: x * 2, filtered)       # iterator, no work yet
limited  = islice(doubled, 2)                   # iterator, no work yet

for x in limited:
    print(x)
# pull 1: limited asks doubled. doubled asks filtered. filtered asks list → 1.
#          1 is odd → filtered keeps pulling → 2 → even → return 2.
#          doubled doubles → 4. limited counts 1.
# pull 2: ... eventually emits 8.
# pull 3: limited has hit 2 items, raises StopIteration. Stops.
# Total list elements consumed: 4 (stopped at element 4, never touched 5)
```

## bruteForce
**Eager evaluation** (build full list, then filter, then map): O(N) memory + may compute work you'll never use.

**Iterator-by-hand without language support** (write a class with explicit state): possible but verbose; generators make this 1 line.

## optimal
Implement the protocol your language ships with: `__iter__` / `__next__` in Python, `Symbol.iterator` in JavaScript, `Iterable<T>` in Java, `IntoIterator` / `Iterator` in Rust. For lazy infinite or large sequences, prefer **generator functions** (Python `yield`, JS `function*`, C# `yield return`) — they give you the state machine for free and the code reads like a straight loop. Compose with standard library combinators (`itertools` in Python, `Stream` in Java, `Iterator` adapters in Rust) instead of writing your own.

```python
from typing import Iterator

def read_lines(path: str) -> Iterator[str]:
    with open(path) as f:
        for line in f:
            yield line.rstrip('\n')

def errors_only(lines: Iterator[str]) -> Iterator[str]:
    for line in lines:
        if 'ERROR' in line:
            yield line

# Pipeline: stream a 100 GB log without loading it.
pipeline = errors_only(read_lines('app.log'))
for first_ten in zip(range(10), pipeline):
    print(first_ten)
```

The critical word is `yield`: it converts a function into a generator object whose `next()` runs the function up to the yield, returns the value, and freezes execution. Memory is `O(1)` regardless of file size; the operating system streams pages on demand and the language streams values on demand. The same shape underlies async iterators (`async def` + `yield` in Python 3.6+, `async function*` in JavaScript) for network-driven sequences, and reactive streams (RxJava, Reactor) for push-driven variants. When designing an API that returns a large or expensive collection, returning an iterator is almost always the right choice — callers who need a list can call `list(it)`, but callers who only need the first few items pay only for those few.

## complexity
- **Memory:** O(1) per stage typically — only the in-flight item.
- **Time:** unchanged from eager — same number of items processed; cost amortized over pulls.
- **Cache behavior**: lazy chains may be slower per element due to function-call overhead vs vectorized loop on a list. Premature optimization vs clarity.

## pitfalls
- **Consuming a once-only iterator twice**: second loop yields nothing. Convert to list (cost = full materialization) or recreate the iterator.
- **`for x in iter` swallows the closing condition silently** if `StopIteration` leaks from inside a generator (PEP 479 fixed this in Python 3.7+).
- **Holding references to large items inside a generator's closure**: GC can't collect them. Use local variables, not captured outer ones.
- **JS `for...of` vs `for...in`**: `for...in` iterates keys, not iterator protocol. Easy bug.
- **Composing iterators that re-iterate the same source**: `for x in xs: for y in xs:` — if `xs` is a generator, the inner loop drains it on first iteration of outer.

## interviewTips
- For "stream-process a large file" → iterators / generators.
- Cite **lazy chains** as the key value proposition.
- For senior interviews, discuss **pull vs push** semantics, **coroutines** as generators++, **stream fusion** in Haskell / Rust.

## code.python
```python
# Generator
def chunks(iterable, n):
    it = iter(iterable)
    while True:
        batch = list(itertools.islice(it, n))
        if not batch: return
        yield batch

for batch in chunks(open('big.log'), 1000):
    process(batch)
```

## code.javascript
```javascript
// Generator
function* chunks(iterable, n) {
  let batch = [];
  for (const x of iterable) {
    batch.push(x);
    if (batch.length === n) { yield batch; batch = []; }
  }
  if (batch.length) yield batch;
}

for (const batch of chunks(asyncLogStream, 1000)) process(batch);
```

## code.java
```java
// Stream API
Files.lines(Path.of("big.log"))
    .filter(line -> line.contains("ERROR"))
    .limit(100)
    .forEach(System.out::println);
// Files.lines() is lazy; .filter is lazy; .limit short-circuits.
```

## code.cpp
```cpp
// C++20 ranges
#include <ranges>
#include <iostream>
auto evens = std::views::iota(1)                 // 1, 2, 3, ...
           | std::views::filter([](int x){ return x % 2 == 0; })
           | std::views::take(5);
for (int x : evens) std::cout << x << ' ';        // 2 4 6 8 10
```
