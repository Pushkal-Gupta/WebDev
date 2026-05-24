---
slug: design-pattern-iterator
module: foundations
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
Once a codebase has more than one collection type, traversal logic tends to leak everywhere. Adding a new container forces rewrites of every loop. An iterator gives a stable interface so producers and consumers can evolve independently. It also unlocks lazy evaluation: results are computed only when requested, which keeps memory usage bounded for large or infinite sequences.

## intuition
Imagine a librarian who hands you one book at a time from a shelf. You do not need to know the shelving system, the catalogue, or whether more books exist in a back room. You ask "next?" and either get a book or learn that you are done. The librarian is the iterator; the library is the aggregate.

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
