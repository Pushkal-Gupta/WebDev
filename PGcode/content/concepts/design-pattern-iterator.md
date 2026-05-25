---
slug: design-pattern-iterator
module: foundations-patterns
title: Iterator Pattern
subtitle: Lazy traversal that hides collection structure
difficulty: Intermediate
position: 401
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - https://refactoring.guru/design-patterns/iterator
  - https://martinfowler.com/eaaCatalog/iterator.html
  - https://github.com/DovAmir/awesome-design-patterns
status: published
---

## intro
The Iterator pattern provides a uniform way to walk through the elements of a collection without exposing how that collection stores them. The consumer asks for the next element; the iterator handles bookkeeping. This separation lets the same client code traverse arrays, trees, linked lists, paginated APIs, or infinite streams.

## whyItMatters
- **Every language's `for` loop**: Python `for x in coll`, JS `for (const x of coll)`, Java `for (X x : coll)`, C++ range-for — all sugar over an Iterator protocol. Implementing the protocol on a custom container makes it work with every language-level loop construct.
- **Database cursors (Postgres, MySQL, MongoDB)**: a query that returns 10 million rows doesn't load them all into memory; the driver returns an iterator that fetches the next batch on demand. Without iterators, you'd OOM on every analytics query.
- **Paginated APIs (GitHub, Twitter, Stripe)**: client SDKs expose `octokit.paginate(...)` as an iterator that hides the `?page=2&page=3` mechanics. Consumer code looks like a simple loop; the SDK handles HTTP, rate limits, and back-pressure underneath.
- **Stream processing (Java Streams, .NET LINQ, Kafka consumers, RxJS)**: pipelines of `map`, `filter`, `take` are iterator transformations that compose lazily, processing infinite streams with bounded memory.
- **File system traversal (`os.walk`, `Files.walk`, `std::filesystem::recursive_directory_iterator`)**: walking a 1M-file directory tree returns one entry at a time so the caller controls memory and can short-circuit.
- **Generators in Python and JavaScript**: `def gen(): yield ...` and `function*` are language-level Iterator pattern — coroutines that resume on each `next()` call.

The pattern is so foundational that modern languages have made it implicit in their grammar. Knowing the manual form lets you build custom iterators for novel data sources (a B-tree, a paginated remote resource, a streaming JSON parser) and make them feel like first-class collections.

## intuition
The pattern exists to solve two problems with one move: hide the internal structure of a collection from consumers, and decouple "produce the next element" from "consume the next element" in time, so consumption can be lazy.

Without the pattern, traversal logic leaks into every consumer. To walk an array you use indices; to walk a linked list you follow `next` pointers; to walk a tree you choose preorder/inorder/postorder and either recurse or maintain a stack; to consume a paginated API you call `getPage(n)` until you get an empty response. Each consumer learns the quirks of each container, and switching the storage from array to tree forces edits to every loop in the codebase. The aggregate operations get tangled with the storage details.

The Iterator move is to factor "walk this collection" into a tiny interface — `hasNext()` and `next()`, or in Python's protocol just `__next__` that raises `StopIteration` when done. The collection's `iterator()` method returns a fresh cursor object that carries the position state internally. Consumers don't see indices, pointers, or page numbers; they see only "give me the next thing" and "are we done". The collection can rearrange its internal storage without breaking a single consumer.

The lazy-evaluation property falls out for free. The iterator computes the next element only when asked, so a `filter` that wraps an iterator doesn't have to materialise the full filtered list — it just lazily skips items as the consumer pulls them. Composing lazy iterators with `map`, `filter`, `take` produces a pipeline that processes one element at a time end-to-end, with O(1) intermediate memory regardless of how big the source is. This is what makes Java Streams, .NET LINQ, Python generators, Rust iterator adapters, and RxJS work — all the same underlying pattern with different syntactic skins.

External vs internal iteration is a real choice the pattern surfaces. External iteration (`while it.hasNext()`) puts the consumer in charge — they decide when to advance, when to stop, when to branch. Internal iteration (`coll.forEach(fn)`) puts the collection in charge — the consumer hands in a function to apply to each element. External is more flexible (you can interleave two iterators, short-circuit on a condition the collection doesn't know about); internal is more concise and sometimes parallelisable. Most modern languages offer both flavours and convert between them.

The librarian metaphor captures the encapsulation: you ask "next book please?" and either get one or get "no more". You never see the shelving system, the catalogue numbering, the back-room overflow. The librarian is the iterator; the library is the aggregate. Swap the library for a database and the same protocol still works — that's the win.

## optimal
Define a minimal `Iterator` interface — `hasNext()` and `next()`, or just `__next__` raising `StopIteration` in Python. The collection returns a fresh iterator object per call so multiple traversals can run concurrently with independent cursors. Modern languages have built-in protocols (Python `__iter__`/`__next__`, JS `Symbol.iterator`, Java `Iterable`/`Iterator`, C++ input iterators) so `for x in coll` syntax just works.

```python
from typing import Iterator, Iterable, TypeVar
T = TypeVar("T")

class BinaryTree(Iterable[int]):
    def __init__(self, value, left=None, right=None):
        self.value, self.left, self.right = value, left, right
    def __iter__(self):
        # Iterative in-order traversal — encapsulates the stack, hides recursion.
        stack, node = [], self
        while stack or node is not None:
            while node is not None:
                stack.append(node)
                node = node.left
            node = stack.pop()
            yield node.value         # generator handles state pause/resume
            node = node.right

def paginated(fetch_page, page_size=100):
    """Wrap a paginated API as a flat iterator. Hides HTTP / pagination."""
    page = 0
    while True:
        batch = fetch_page(page, page_size)
        if not batch:
            return
        yield from batch              # lazily yield items; caller controls advance
        page += 1

def lazy_pipeline():
    """Compose iterators: O(1) memory regardless of source size."""
    source = paginated(github_repos)
    starred = (r for r in source if r["stargazers_count"] > 1000)
    names = (r["name"] for r in starred)
    top_ten = []
    for name in names:
        top_ten.append(name)
        if len(top_ten) == 10:
            break                    # iterator stops mid-stream; nothing else fetched
    return top_ten
```

Why optimal: the lower bound for a full traversal is Ω(n) — you must touch each element at least once. The Iterator pattern hits that bound with O(1) amortised work per `next()` call and O(1) memory for the iterator state itself (some traversals like tree in-order need O(h) for an auxiliary stack; this is unavoidable for the underlying algorithm, not the pattern). The pattern adds *no* asymptotic overhead — one virtual call per advance — and unlocks lazy composition that the eager alternative cannot match.

Implementation discipline that distinguishes good iterators from leaky ones: (1) return a *fresh* iterator from `__iter__` so multiple concurrent traversals don't share state — the standard mistake is returning `self`, which works for a single pass but corrupts when two consumers iterate in parallel; (2) document the behaviour under concurrent modification — Java's "fail-fast" iterators throw `ConcurrentModificationException`, Python's dict iterators raise `RuntimeError`, C++ STL iterators give undefined behaviour; pick a policy and surface it; (3) for iterators that hold resources (file handles, DB cursors, network connections), implement `__enter__`/`__exit__` (Python) or `AutoCloseable` (Java) so `with` / `try-with-resources` cleans up even on early exit; (4) generators (Python `yield`, JS `function*`) are almost always preferable to hand-rolled iterator classes — they're shorter, handle state pause/resume automatically, and compose cleanly with `yield from`; (5) for the classic Nested List Iterator interview problem, the right answer is an iterator that lazily descends into nested lists on each `next()` call, not one that flattens up front — flattening defeats the entire point of the pattern.

## visualization
Picture a cursor sliding across a sequence of slots. At each step the cursor reports the current value and advances. When it falls off the end, hasNext returns false. The underlying storage could be contiguous memory, linked nodes, or a generator function pulling pages from a server.

## bruteForce
The naive approach exposes the internal structure: callers index into arrays, follow next pointers, or call paginate(page) themselves. Each new collection forces every consumer to learn its quirks. Tests duplicate traversal logic. Switching from array to tree breaks every loop in the codebase.

## optimal
Define a small Iterator interface with hasNext and next. The collection returns an iterator object that captures position state internally. Callers never see indices or pointers. Languages with built-in iterator protocols (Python's __iter__, JavaScript's Symbol.iterator, Java's Iterable, C++ input iterators) let language constructs like for-of work uniformly across any custom container.

## complexity
Time is whatever the underlying traversal costs, typically O(n) for the full walk and O(1) amortized per step. Space is O(1) for the iterator state itself, though some traversals (tree in-order via explicit stack) require O(h) for the auxiliary structure.

## pitfalls
Mutating the underlying collection while iterating leads to undefined behavior or fail-fast exceptions. External iterators leak state if not exhausted. Multiple iterators on the same source need independent cursors. Forgetting to close iterators that hold resources (file handles, DB cursors) leaks them.

## interviewTips
Talk about hasNext/next as the minimal contract. Mention that generators in Python and JavaScript are syntactic sugar for the same idea. If asked to flatten nested structures, propose an iterator that lazily descends — this is a classic Nested List Iterator interview problem.

## code.python
```python
class RangeIterator:
    def __init__(self, start, stop, step=1):
        self.current, self.stop, self.step = start, stop, step

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.stop:
            raise StopIteration
        value = self.current
        self.current += self.step
        return value

for n in RangeIterator(0, 5):
    print(n)
```

## code.javascript
```javascript
function rangeIterator(start, stop, step = 1) {
  let current = start;
  return {
    [Symbol.iterator]() { return this; },
    next() {
      if (current >= stop) return { value: undefined, done: true };
      const value = current;
      current += step;
      return { value, done: false };
    }
  };
}

for (const n of rangeIterator(0, 5)) console.log(n);
```

## code.java
```java
import java.util.Iterator;

class Range implements Iterable<Integer> {
    private final int start, stop, step;
    Range(int start, int stop, int step) { this.start = start; this.stop = stop; this.step = step; }

    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            int current = start;
            public boolean hasNext() { return current < stop; }
            public Integer next() { int v = current; current += step; return v; }
        };
    }
}
```

## code.cpp
```cpp
#include <iterator>

class RangeIter {
    int current, step;
public:
    RangeIter(int c, int s) : current(c), step(s) {}
    int operator*() const { return current; }
    RangeIter& operator++() { current += step; return *this; }
    bool operator!=(const RangeIter& other) const { return current < other.current; }
};

class Range {
    int start, stop, step;
public:
    Range(int a, int b, int s = 1) : start(a), stop(b), step(s) {}
    RangeIter begin() const { return {start, step}; }
    RangeIter end() const { return {stop, step}; }
};
```
