---
slug: py-iterators-generators
module: python-language
title: Iterators & Generators
subtitle: How Python's for-loop really works — the iterator protocol, generator functions with yield, and lazy evaluation that produces values one at a time instead of building a whole list.
difficulty: Intermediate
position: 8
estimatedReadMinutes: 14
prereqs: [py-functions-scope, py-data-structures]
relatedProblems: []
references:
  - title: "The Python Tutorial — Iterators"
    url: "https://docs.python.org/3/tutorial/classes.html#iterators"
    type: docs
  - title: "Python docs — Generator types / yield expressions"
    url: "https://docs.python.org/3/reference/expressions.html#yield-expressions"
    type: docs
  - title: "Real Python — Python Generators 101"
    url: "https://realpython.com/introduction-to-python-generators/"
    type: article
  - title: "Real Python — Python 'for' Loops (Iterators & the Iterator Protocol)"
    url: "https://realpython.com/python-for-loop/"
    type: article
status: published
---

## intro
Every `for` loop in Python rides on a tiny, two-method contract. An **iterable** is anything you can loop over — a list, a string, a file, a dict. An **iterator** is the object that actually walks through it, handing back one value each time you ask and remembering where it left off. A **generator** is the easiest way to write your own iterator: an ordinary-looking function that uses `yield` instead of `return`, pausing its execution between values. Together they let you process data **one item at a time**, lazily, without ever holding the whole sequence in memory.

## whyItMatters
Generators are how you process data too large to fit in memory: a multi-gigabyte log file, an infinite stream of sensor readings, the rows of a database cursor. Instead of building a million-element list up front and paying for all of it at once, a generator produces each value on demand and forgets it after use — constant memory regardless of length. They also make pipelines composable: you can chain `map`-like and `filter`-like generator stages so data flows through one element at a time, with no intermediate lists between steps. Understanding the iterator protocol underneath demystifies the `for` loop, explains why a file object or a `zip` is "consumed" once, and unlocks `itertools`, comprehensions, and async iteration. It is core Python fluency that shows up constantly in real systems and interviews.

## intuition
Picture a physical book. The **iterable** is the book itself — all the pages, sitting there, ready to be read in order. The **iterator** is a **bookmark**: it points at exactly one page, and its only trick is "advance to the next page." Crucially, the book is not the bookmark. You can have several bookmarks in the same book, each at a different page, and the book doesn't change as you read. When you write `for line in book:`, Python quietly asks the book for a fresh bookmark (`iter(book)`), then repeatedly asks that bookmark for the next page (`next(...)`) until the bookmark falls off the end and signals "done" by raising `StopIteration`.

Now a **generator** is a different kind of beast: a function that behaves like a bookmark that *generates* the next page only when asked. A normal function runs top to bottom and `return`s once, discarding all its local state. A generator function contains `yield`, and calling it doesn't run the body at all — it hands you back a generator object, paused at the very top. Each time you call `next()` on it, the function **runs until it hits a `yield`**, emits that value, and then **freezes in place** — local variables, the instruction pointer, everything preserved. The next `next()` thaws it and continues from exactly after the `yield`. It is a function with a pause button.

That pausing is what makes generators **lazy**. "Lazy" means *produce-on-demand*: nothing is computed until someone asks for it, and only as much as they ask for is computed. Compare two ways to get the first three squares. The **eager** way builds the entire list `[0, 1, 4, 9, 16, ...]` in memory first, then you take three. The **lazy** way computes `0`, hands it over, pauses; computes `1`, hands it over, pauses; and stops the moment you've taken your three — the rest of the sequence is never computed and never stored. This is why a generator can represent an *infinite* sequence (the natural numbers, say) without an infinite amount of memory: at any instant it only holds the single value it's working on right now, plus enough state to compute the next one.

## visualization
```
EAGER LIST  squares = [n*n for n in range(5)]   — built ALL AT ONCE
  step 0:  compute every value first ........ [0, 1, 4, 9, 16]  ← 5 ints in memory
  consume: read 0, read 1, read 4 ...        (the whole list already exists)
  memory held:  O(n)  — all 5 boxes alive at the same time

LAZY GENERATOR  squares = (n*n for n in range(5)) — produced ONE AT A TIME
  next() #1:  run to yield -> 0   .. PAUSE ..  memory held: just [0]
  next() #2:  resume -> yield 1   .. PAUSE ..  memory held: just [1]
  next() #3:  resume -> yield 4   .. PAUSE ..  memory held: just [4]
  ...                                          (nothing past here computed yet)
  StopIteration when range is exhausted       memory held: O(1) — one value
```

## bruteForce
The naive approach materializes everything before consuming any of it. To sum the squares of a million numbers you might first build `squares = [n*n for n in range(1_000_000)]` and then call `sum(squares)`. That list allocates a million integers all at once — tens of megabytes — even though `sum` only ever needs one value at a time and immediately discards it. For a file you might do `lines = open("huge.log").readlines()`, pulling the entire file into a list of strings before processing line one. It works on toy inputs and falls over on real ones: memory balloons, and you pay the full construction cost up front before producing a single result. The whole list exists only to be walked once and thrown away.

## optimal
The fix is the **iterator protocol** and the generators built on it. An object is an **iterator** if it implements two methods: `__iter__` (returns the iterator itself) and `__next__` (returns the next value, or raises `StopIteration` when there are none left). An **iterable** only needs `__iter__`, which returns a *fresh* iterator. The built-ins `iter(obj)` and `next(it)` are just calls to these methods. A `for` loop is pure sugar over them — `for x in seq:` desugars to: get `it = iter(seq)`, then loop calling `x = next(it)`, running the body each time, and stopping cleanly when `StopIteration` fires. That single mechanism powers every loop, comprehension, `zip`, `map`, unpacking (`a, b = pair`), and `in` test in the language.

Writing `__iter__`/`__next__` by hand is tedious, so Python gives you **generator functions**: put `yield` in a function body and calling it returns a generator object that *is* an iterator — `__iter__` and `__next__` are supplied for free, and `StopIteration` is raised automatically when the function body falls off the end or hits a bare `return`. Each `yield` produces a value and freezes execution with all locals intact; the next `next()` resumes right after it. **Generator expressions** are the inline form — `(n*n for n in range(5))` — identical to a list comprehension but with parentheses, producing a lazy generator instead of a full list.

Laziness is the payoff: a generator holds **O(1)** state and computes each value only when pulled, so `sum(n*n for n in range(1_000_000))` runs in constant memory. Generators also **chain** into pipelines — `evens = (x for x in nums if x % 2 == 0)`, then `squared = (x*x for x in evens)` — where data flows one element at a time through every stage with no intermediate lists. The one cost to remember: a generator is **single-pass**. Once exhausted it stays exhausted; iterating it again yields nothing. When you need to traverse the data twice, either keep the underlying iterable (call the generator again to get a fresh one) or materialize once with `list(...)`.

## complexity
time: Producing each value is O(1) amortized for a simple generator (the cost of one `next()`); iterating all n values is O(n), the same as building and walking a list. Generators add no asymptotic time — they change *when* the work happens (on demand) and *whether* you pay for values you never consume (you don't), not the total cost of a full pass.
space: A generator holds **O(1)** auxiliary memory — just its frozen frame and the single value in flight — versus **O(n)** to materialize the whole sequence as a list. This is the headline win: constant memory regardless of sequence length, which is what lets generators stream gigabyte files and represent infinite sequences.
notes: Laziness can also save time when you stop early: `next(g)` or `any(...)`/`itertools.takewhile` over a generator computes only up to the value that satisfies the condition, never the tail. The trade-off is no random access (`g[3]` is a `TypeError`) and no length (`len(g)` fails) — a generator only knows "next," not "how many" or "which index."

## pitfalls
- **Generators exhaust once and can't be reused.** After `list(g)` drains a generator, a second `for x in g:` iterates zero times — it's already at the end. To loop twice, rebuild it by calling the generator function again, or materialize once with `data = list(g)` and reuse the list. Reassigning a fresh generator is cheap; "rewinding" one is impossible.
- **You can't `len()` or index a generator.** `len(g)` and `g[0]` both raise `TypeError` — a generator has no stored length and no positions, only a forward "next." If you genuinely need `len` or `g[i]`, you've outgrown a generator; convert with `list(g)` first (and accept the O(n) memory that implies).
- **A generator expression is not a list — don't expect list behavior.** `(x*x for x in data)` gives a one-shot lazy object, while `[x*x for x in data]` gives a reusable, indexable, len-able list. Use the generator form for streaming/large or piped data; reach for the list form when you need to traverse, index, or measure it more than once.
- **Forgetting it's lazy: side effects don't run until consumed.** Because the body doesn't execute until pulled, code like `g = (do_work(x) for x in items)` runs *nothing* — `do_work` fires only as you iterate `g`. Building a generator "to kick off" side effects is a no-op; if you need the work done now, iterate it (`list(g)` / a `for` loop) or use eager code.
- **Holding a reference to every produced value defeats the memory win.** If you append each yielded value into a list (`seen = [x for x in g]`), you're back to O(n) memory — the generator's laziness buys nothing once you retain everything. Keep generators streaming: process and discard each value, don't accumulate.

## interviewTips
- Be able to recite the desugaring: "`for x in seq` calls `iter(seq)` once, then `next()` repeatedly until `StopIteration`." Naming the protocol (`__iter__`, `__next__`, `StopIteration`) signals you understand the loop, not just how to write one.
- Lead with the memory argument: "A generator is O(1) space because it yields one value at a time and never materializes the full sequence, so it can stream a file bigger than RAM or represent an infinite sequence." That trade — constant memory, single-pass, no indexing — is the answer they want.
- Know when *not* to use one: if you need to iterate the data multiple times, index it, or take its length, a list is the right call. Stating the trade-off both ways shows judgment rather than reflex.

## keyTakeaways
- An **iterable** has `__iter__` (hands out a fresh iterator); an **iterator** has `__iter__` + `__next__` and raises `StopIteration` when done. A `for` loop is just `iter()` once then `next()` until `StopIteration`.
- A **generator function** (uses `yield`) and a **generator expression** (`(... for ...)`) are the easy way to build a lazy iterator: each value is computed on demand, execution pauses at `yield`, and memory stays **O(1)** instead of the **O(n)** of a full list.
- Generators are **single-pass** — once exhausted they yield nothing, you can't `len()` or index them, and their work doesn't run until you consume them; reach for a list when you need to traverse, measure, or index more than once.

## code.python
```python
# 1) MANUAL ITERATOR — iter() gives a bookmark; next() advances it.
nums = [10, 20, 30]
it = iter(nums)                 # iterator over the list
print(next(it))                 # 10
print(next(it))                 # 20
print(next(it))                 # 30
print(next(it, "done"))         # done   (default avoids StopIteration crash)

# Handling StopIteration explicitly instead of a default:
it2 = iter([1, 2])
while True:
    try:
        print("got", next(it2))  # got 1   then   got 2
    except StopIteration:
        print("exhausted")       # exhausted
        break

# 2) GENERATOR FUNCTION — yield pauses and resumes, keeping local state.
def first_squares(n):
    for i in range(n):
        yield i * i             # emit, then freeze here until next()

squares = first_squares(4)
print(list(squares))            # [0, 1, 4, 9]

def countdown(start):
    while start > 0:
        yield start
        start -= 1              # state survives across yields
print(list(countdown(3)))       # [3, 2, 1]

# 3) GENERATOR EXPRESSION — lazy, O(1) memory; sum pulls one value at a time.
total = sum(x * x for x in range(5))   # 0+1+4+9+16, no list built
print("sum of squares:", total)        # sum of squares: 30

# 4) ONE-SHOT EXHAUSTION — a generator is consumed once.
g = (c for c in "ab")
print("first pass:", list(g))   # first pass: ['a', 'b']
print("second pass:", list(g))  # second pass: []   (already exhausted)
```

## code.javascript
```javascript
// JS generators use function* and yield; iterate with for...of or .next().
function firstSquares(n) {
  return (function* () {
    for (let i = 0; i < n; i++) yield i * i;
  })();
}
console.log("squares:", [...firstSquares(4)]); // [0, 1, 4, 9]

function* countdown(start) {
  while (start > 0) { yield start; start -= 1; }
}
console.log("countdown:", [...countdown(3)]);  // [3, 2, 1]

// Manual protocol: an iterator exposes next() -> { value, done }.
const it = firstSquares(2);
console.log(it.next());  // { value: 0, done: false }
console.log(it.next());  // { value: 1, done: false }
console.log(it.next());  // { value: undefined, done: true }

// Lazy sum — pull one value at a time, no array materialized.
let total = 0;
for (const x of (function* () { for (let i = 0; i < 5; i++) yield i * i; })()) {
  total += x;
}
console.log("sum of squares:", total);         // 30

// One-shot exhaustion: a generator object is consumed once.
const g = countdown(2);
console.log("first:", [...g]);                 // [2, 1]
console.log("second:", [...g]);                // []  (already exhausted)
```

## code.java
```java
import java.util.*;

public class Iterators {
    // Java has no yield; an Iterator that lazily produces squares one at a time.
    static Iterator<Integer> squares(final int n) {
        return new Iterator<>() {
            int i = 0;                       // state preserved across next()
            public boolean hasNext() { return i < n; }
            public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                int sq = i * i;
                i++;
                return sq;
            }
        };
    }

    public static void main(String[] args) {
        Iterator<Integer> it = squares(4);
        List<Integer> out = new ArrayList<>();
        while (it.hasNext()) out.add(it.next());   // pull until exhausted
        System.out.println("squares: " + out);     // squares: [0, 1, 4, 9]

        int total = 0;                              // lazy sum, one value at a time
        Iterator<Integer> s = squares(5);
        while (s.hasNext()) total += s.next();
        System.out.println("sum of squares: " + total); // sum of squares: 30

        // One-shot: the same iterator is consumed once.
        Iterator<Integer> g = squares(2);
        while (g.hasNext()) g.next();
        System.out.println("second pass empty: " + !g.hasNext()); // true
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <vector>
using namespace std;

// C++ (pre-C++20) has no yield; a stateful generator-like struct that
// produces one square per next() call and reports when it's exhausted.
struct Squares {
    int i = 0, n;
    explicit Squares(int n_) : n(n_) {}
    bool has_next() const { return i < n; }
    int next() { int sq = i * i; ++i; return sq; }  // state survives calls
};

int main() {
    Squares g(4);
    cout << "squares:";
    while (g.has_next()) cout << " " << g.next();    // 0 1 4 9
    cout << "\n";

    long total = 0;                                   // lazy sum, one at a time
    Squares s(5);
    while (s.has_next()) total += s.next();
    cout << "sum of squares: " << total << "\n";      // sum of squares: 30

    // One-shot: g is already exhausted from the loop above.
    cout << "second pass empty: " << (g.has_next() ? "false" : "true") << "\n";
    return 0;
}
```
