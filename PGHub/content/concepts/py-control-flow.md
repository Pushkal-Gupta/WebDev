---
slug: py-control-flow
module: python-language
title: Control Flow
subtitle: How a program decides and repeats — if/elif/else, for and while loops, range, break and continue, and the comprehension that compresses a loop into one line.
difficulty: Beginner
position: 2
estimatedReadMinutes: 12
prereqs: [py-variables-types]
relatedProblems: []
references:
  - title: "The Python Tutorial — More Control Flow Tools"
    url: "https://docs.python.org/3/tutorial/controlflow.html"
    type: docs
  - title: "Real Python — Conditional Statements in Python"
    url: "https://realpython.com/python-conditional-statements/"
    type: article
  - title: "Real Python — Python for Loops (Definite Iteration)"
    url: "https://realpython.com/python-for-loop/"
    type: article
  - title: "Real Python — When to Use a List Comprehension in Python"
    url: "https://realpython.com/list-comprehension-python/"
    type: article
status: published
---

## intro
Straight-line code runs top to bottom, once. **Control flow** is how a program breaks out of that single track: it **decides** which lines to run with `if`/`elif`/`else`, and it **repeats** lines with `for` and `while` loops. Two small keywords — `break` to leave a loop early and `continue` to skip to the next iteration — give you fine control inside a loop. And Python's signature shortcut, the **comprehension**, folds a whole build-a-list loop into a single readable expression. Together these are the verbs that turn data into behavior.

## whyItMatters
A program with no branches and no loops can only do exactly one fixed thing. The moment you want it to react ("if the balance is negative, decline") or to handle many items ("for every row in the file, validate it"), you need control flow — which is why it shows up in essentially every function you will ever write. Loops are also where beginners burn the most time: an off-by-one in a `range`, a `while` whose condition never flips so it spins forever, a `continue` that skips the wrong line. And because Python leans on **indentation** rather than braces to mark which statements belong to a branch or loop body, a single misaligned line silently changes what your program does. Reading control flow fluently — tracing exactly which lines run, in what order, with what variable values — is the core skill behind debugging anything.

## intuition
Think of execution as a single pointer walking down your code, one statement at a time. Normally it just steps to the next line. Control-flow statements let that pointer **jump**.

An `if`/`elif`/`else` chain is a fork in the road with guard rails. Python checks each condition from the top; the **first** one that is true wins, its indented block runs, and every other branch is skipped entirely — including later `elif`s that might also have been true. The `else` is the catch-all that runs only when no condition matched. Order matters: put the most specific test first, because once a branch is taken the pointer leaves the whole chain. This is why a misordered chain (general case before the special case) silently swallows the case you cared about.

A `for` loop is **definite iteration**: it walks a known sequence of items — a list, a string's characters, or the numbers from `range(start, stop, step)` — binding the loop variable to each in turn and running the body once per item. `range(1, 8)` yields `1, 2, 3, 4, 5, 6, 7` (the stop is excluded — the classic off-by-one trap). A `while` loop is **indefinite iteration**: it repeats *as long as* a condition stays true, so the body must eventually do something that makes the condition false, or the loop never ends.

Inside a loop, two keywords reshape the walk. `break` ejects the pointer out of the loop immediately, abandoning the rest of the iterations — perfect for "stop at the first match." `continue` does a partial skip: it abandons the *rest of the current iteration's body* and jumps straight to the next item. Picture `continue` as "never mind this one, next," and `break` as "I'm done, leave the loop." Finally, a **list comprehension** — `[expr for item in seq if cond]` — is a `for` loop that builds a list, rewritten as one expression: it reads left to right as "collect `expr` for each `item`, keeping only those where `cond`," and it is both shorter and faster than the equivalent append loop.

## visualization
```
if / elif / else  —  the pointer takes the FIRST true branch, skips the rest
    n = 6
    ┌─ n % 6 == 0 ? ── True ──▶ run "six"  ──┐
    │  n % 2 == 0 ? (skipped, already matched)│──▶ continue after the chain
    └─ else        (skipped)                  ┘

for n in range(1, 5):        while k*k <= 20:        comprehension
    ┌─────────────┐              ┌────────────┐        [n*n for n in range(1,6)]
    │ n = 1  body │              │ check cond │           builds: 1 4 9 16 25
    │ n = 2  body │  continue──▶ │ true: run  │           (a for-loop in one line)
    │ n = 3  body │  break ────▶ │ body, loop │
    └─────────────┘  leaves loop └────────────┘  false ─▶ exit
```

## bruteForce
You can technically get far with only `if` and `while`. Need to repeat over a list? Keep an index variable, test `while i < len(items)`, read `items[i]`, and remember to bump `i` yourself every pass. Need to build a transformed list? Create an empty list, loop, and `append` inside. It works, but it is verbose and fragile: the manual index is one fat-fingered `i += 1` away from an infinite loop or an `IndexError`, and the intent ("square every number") is buried under loop bookkeeping. This style ports the habits of a lower-level language straight into Python without using anything Python gives you.

## optimal
Idiomatic Python picks the construct that matches the **shape** of the repetition and lets the language handle the bookkeeping. Reach for a **`for` loop over the iterable itself** — `for item in items:` — not a hand-rolled index; if you genuinely need the position, ask for it explicitly with `enumerate(items)`, which hands you `(index, item)` pairs. Use **`range`** only when you truly want a sequence of numbers, and remember its stop is exclusive so `range(n)` is `0..n-1`. Choose a **`while` loop** only for *indefinite* iteration — "keep going until some condition flips" — and make sure the body changes a variable the condition depends on, so termination is obvious at a glance.

Order your `if`/`elif`/`else` from most specific to most general, since the first true branch wins; a clean chain reads like a decision table. Use **`break`** to express "stop at the first hit" instead of a flag variable you check on every pass, and **`continue`** to skip the uninteresting items early ("guard clause") so the main body stays unindented and readable. When a loop exists purely to *build a collection*, prefer a **comprehension**: `[n * n for n in range(1, 6)]` for a list, `{w for w in words}` for a set, `{k: v for k, v in pairs}` for a dict. Comprehensions are not just shorter — they signal "I'm transforming a sequence into a new one," run faster than the append-in-a-loop equivalent, and keep the transformation in one place. The rule of thumb: a `for` for definite iteration, a `while` for indefinite, `break`/`continue` to sculpt the loop, and a comprehension whenever the loop's whole job is to produce a list, set, or dict. Reserve full loops for when there are real side effects or the logic is too involved to read as one expression.

## complexity
time: A loop costs the number of iterations times the work per iteration — looping once over `n` items is O(n); a loop nested inside another is O(n·m). `if`/`elif`/`else` adds only the constant cost of the few comparisons it makes. A comprehension has the same big-O as the loop it replaces — it is a constant-factor speedup, not an algorithmic one.
space: `if` and a plain `for`/`while` that mutate existing variables use O(1) extra space. A comprehension that builds a new list/set/dict allocates O(k) space for its k results — the same as appending in a loop would.
notes: `range` is lazy — it does not materialize all the numbers, it generates them on demand — so `for i in range(10**9)` uses O(1) memory even though it iterates a billion times. A `while True:` with no reachable `break` (or a condition that never flips) is an infinite loop; the cost is "forever."

## pitfalls
- **Off-by-one with `range`.** `range(1, 5)` is `1, 2, 3, 4` — the stop is **excluded**. Looping `range(len(a))` to read `a[i]` is fine, but `range(1, len(a))` quietly skips index 0. When in doubt, iterate the items directly.
- **Infinite `while`.** If the loop body never changes the variable the condition tests (forgot `k += 1`), the loop spins forever. Every `while` needs a clear path to making its condition false — or a reachable `break`.
- **`continue` skipping the update.** In a `while` loop, a `continue` placed *before* the line that advances the counter jumps back to the condition with the counter unchanged — an instant infinite loop. Advance the counter before any `continue`, or use a `for`.
- **Misordered `if`/`elif`.** Because the first true branch wins, putting a broad test (`n % 2 == 0`) before a specific one (`n % 6 == 0`) means the specific case never runs. Order from most specific to most general.
- **Indentation, not braces.** Python decides a block's membership by indentation. A line dedented one level too far silently falls *outside* the loop or `if` and runs once instead of every pass — a bug with no syntax error. Keep indentation consistent (4 spaces, never tabs-mixed).

## interviewTips
- Name the two iteration kinds: "`for` is definite iteration over a known sequence; `while` is indefinite — repeat until a condition flips." It frames why you'd pick each.
- Distinguish `break` from `continue` crisply: "`break` leaves the loop entirely; `continue` skips the rest of *this* iteration and goes to the next." Interviewers love this because candidates mix them up.
- When asked to transform a list, reach for a comprehension and say why: "It's the idiomatic, faster way to build a list from a sequence, and it reads as a single transformation." Then show the loop equivalent to prove you understand what it compiles to.

## keyTakeaways
- `if`/`elif`/`else` runs the **first** true branch and skips the rest, so order conditions from most specific to most general.
- Use `for` for definite iteration over a sequence (and `enumerate` when you need the index); use `while` for indefinite iteration, ensuring the condition can eventually become false.
- `break` exits a loop immediately, `continue` skips to the next iteration, and a comprehension (`[expr for x in seq if cond]`) compresses a build-a-collection loop into one faster, readable expression.

## code.python
```python
# if / elif / else inside a for loop — the FIRST true branch wins.
for n in range(1, 8):           # 1..7  (stop 8 is excluded)
    if n % 6 == 0:
        print(n, "six")
    elif n % 2 == 0:
        print(n, "even")
    elif n % 3 == 0:
        print(n, "three")
    else:
        print(n, "odd")

# while + break: stop at the first k whose square exceeds 20.
k = 1
while True:
    if k * k > 20:
        break
    k = k + 1
print("first k with k*k > 20:", k)          # 5

# continue: skip the rest of the body for multiples of 3.
total = 0
for n in range(1, 11):
    if n % 3 == 0:
        continue
    total = total + n
print("sum skipping multiples of 3:", total) # 37

# comprehensions: a build-a-list loop in one expression.
squares = [n * n for n in range(1, 6)]
evens = [n for n in range(10) if n % 2 == 0]
print("squares:", squares)                   # [1, 4, 9, 16, 25]
print("evens:", evens)                       # [0, 2, 4, 6, 8]
```

## code.javascript
```javascript
for (let n = 1; n < 8; n++) {
  if (n % 6 === 0) console.log(n, "six");
  else if (n % 2 === 0) console.log(n, "even");
  else if (n % 3 === 0) console.log(n, "three");
  else console.log(n, "odd");
}

let k = 1;
while (true) {
  if (k * k > 20) break;
  k++;
}
console.log("first k with k*k > 20:", k);      // 5

let total = 0;
for (let n = 1; n <= 10; n++) {
  if (n % 3 === 0) continue;
  total += n;
}
console.log("sum skipping multiples of 3:", total); // 37

// map/filter are JS's closest answer to comprehensions.
const squares = Array.from({ length: 5 }, (_, i) => (i + 1) * (i + 1));
const evens = Array.from({ length: 10 }, (_, i) => i).filter((n) => n % 2 === 0);
console.log("squares:", squares);              // [1, 4, 9, 16, 25]
console.log("evens:", evens);                  // [0, 2, 4, 6, 8]
```

## code.java
```java
import java.util.*;
import java.util.stream.*;

public class Flow {
    public static void main(String[] args) {
        for (int n = 1; n < 8; n++) {
            if (n % 6 == 0) System.out.println(n + " six");
            else if (n % 2 == 0) System.out.println(n + " even");
            else if (n % 3 == 0) System.out.println(n + " three");
            else System.out.println(n + " odd");
        }

        int k = 1;
        while (true) {
            if (k * k > 20) break;
            k++;
        }
        System.out.println("first k with k*k > 20: " + k);      // 5

        int total = 0;
        for (int n = 1; n <= 10; n++) {
            if (n % 3 == 0) continue;
            total += n;
        }
        System.out.println("sum skipping multiples of 3: " + total); // 37

        // Streams are Java's comprehension analog.
        List<Integer> squares = IntStream.rangeClosed(1, 5)
                .map(n -> n * n).boxed().collect(Collectors.toList());
        List<Integer> evens = IntStream.range(0, 10)
                .filter(n -> n % 2 == 0).boxed().collect(Collectors.toList());
        System.out.println("squares: " + squares);   // [1, 4, 9, 16, 25]
        System.out.println("evens: " + evens);        // [0, 2, 4, 6, 8]
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    for (int n = 1; n < 8; n++) {
        if (n % 6 == 0) cout << n << " six\n";
        else if (n % 2 == 0) cout << n << " even\n";
        else if (n % 3 == 0) cout << n << " three\n";
        else cout << n << " odd\n";
    }

    int k = 1;
    while (true) {
        if (k * k > 20) break;
        k++;
    }
    cout << "first k with k*k > 20: " << k << "\n";   // 5

    int total = 0;
    for (int n = 1; n <= 10; n++) {
        if (n % 3 == 0) continue;
        total += n;
    }
    cout << "sum skipping multiples of 3: " << total << "\n"; // 37

    vector<int> squares;
    for (int n = 1; n <= 5; n++) squares.push_back(n * n);
    cout << "squares:";
    for (int s : squares) cout << " " << s;
    cout << "\n";                                     // 1 4 9 16 25
    return 0;
}
```
