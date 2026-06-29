---
slug: py-functions-scope
module: python-language
title: Functions and Scope
subtitle: Packaging code into reusable functions — parameters and defaults, return values, *args/**kwargs, lambdas, and the LEGB rule that decides which variable a name refers to.
difficulty: Beginner
position: 3
estimatedReadMinutes: 13
prereqs: [py-variables-types, py-control-flow]
relatedProblems: []
references:
  - title: "The Python Tutorial — Defining Functions"
    url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions"
    type: docs
  - title: "Python docs — Python Scopes and Namespaces"
    url: "https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces"
    type: docs
  - title: "Real Python — Defining Your Own Python Function"
    url: "https://realpython.com/defining-your-own-python-function/"
    type: article
  - title: "Real Python — Python Scope & the LEGB Rule"
    url: "https://realpython.com/python-scope-legb-rule/"
    type: article
status: published
---

## intro
A **function** is a named, reusable block of code: you `def` it once, then **call** it with arguments whenever you need it, and it can hand a result back with `return`. Functions take **parameters** (with optional **defaults**), can absorb any number of extra arguments via `*args` and `**kwargs`, and can be written inline as tiny **lambdas**. Crucially, each function call gets its own private workspace — its **local scope** — and Python uses the **LEGB rule** to decide which variable a bare name refers to. Functions plus scope are how programs stay organized instead of collapsing into one giant script.

## whyItMatters
Functions are the unit of reuse and the unit of thought. Without them, every program is a wall of top-level statements where the same logic is copy-pasted, a fix in one copy never reaches the others, and there is no way to name an idea. Wrap that logic in a function and you get a single place to change it, a name that documents intent, and a boundary you can test in isolation. Scope is the other half of the deal: because a function's local variables are invisible outside it, two functions can both use a variable named `i` without colliding, and you can reason about a function by reading only its own body. Get scope wrong, though, and you hit the bugs that genuinely confuse beginners — a function that "can't see" a variable you're sure exists, an `UnboundLocalError` on a name you only meant to read, a mutable default argument that mysteriously remembers values across calls. Understanding parameters, returns, and LEGB is what makes functions predictable.

## intuition
Calling a function is like handing a worker a job slip. The **parameters** are the blanks on the slip; the **arguments** are what you write in those blanks when you call. `def greet(name, greeting="Hello")` has two blanks, and the second comes pre-filled — that is a **default**, used only when the caller leaves it out. The worker does the job in a private back room (the **local scope**), and whatever they `return` is the result they slide back to you; a function with no `return` slides back `None`. The back room is torn down when the call ends, so its local variables vanish — which is exactly why one call can't accidentally clobber another's locals.

Sometimes you don't know how many arguments will arrive. `*args` is a catch-all that gathers any extra **positional** arguments into a tuple; `**kwargs` gathers any extra **keyword** arguments into a dict. So `summarize(1, 2, 3, unit="cm")` lands as `args = (1, 2, 3)` and `kwargs = {"unit": "cm"}`. A **lambda** is just a one-expression function with no name — `lambda x: x + 1` — handy where you need a quick function as an argument, like a sort key. And because functions are themselves ordinary values (**first-class**), you can store them in variables, pass them to other functions, and return them.

Now the part everyone trips on: when Python sees a bare name like `total`, how does it know *which* `total`? It searches scopes in a fixed order, **LEGB**: **L**ocal (names assigned in the current function), then **E**nclosing (any function wrapped around this one), then **G**lobal (the module's top level), then **B**uilt-in (`len`, `print`, `range`...). It stops at the first scope that defines the name. The sharp edge: **assigning** to a name anywhere in a function makes that name *local for the entire function*, even on lines before the assignment. So a function that does `counter = counter + 1` without declaring `counter` as `global` treats `counter` as local, finds it unbound on the right-hand side, and raises `UnboundLocalError`. To actually rebind a module-level variable from inside a function you must say `global counter` (or `nonlocal` for an enclosing function's variable). Reading a global is automatic; *rebinding* one requires that explicit declaration — a guard rail that stops functions from silently stomping on outer state.

## visualization
```
CALL FRAME for greet("Ada")          LEGB name lookup for a bare `total`
  parameters become locals:
    name     = "Ada"                   ┌─ L  Local      (this function's assigns)
    greeting = "Hello"  (default)      │  ↓ not found
  body runs in this private room       ├─ E  Enclosing  (wrapping function)
  return  "Hello, Ada!"  ──────────▶   │  ↓ not found
  room torn down; locals vanish        ├─ G  Global     (module top level)  ✓ found
                                       └─ B  Built-in    (len, print, range)

  *args  → extra positionals  → tuple   (1, 2, 3)
  **kwargs → extra keywords   → dict    {"unit": "cm"}
  Rebinding a global from inside a function needs:  global counter
```

## bruteForce
Skip functions and you write a flat script: the same validation pasted at three call sites, a calculation duplicated wherever it's needed, and every variable living at the top level where any line can read or overwrite it. It runs, but it does not scale past a page. Fixing a bug means hunting down every copy; one stray reassignment to a shared top-level name corrupts logic far away; and nothing has a name, so the only way to understand the code is to read all of it. The naive way to "share" a value is a global that everything touches — which is exactly the tangle that scope was invented to prevent.

## optimal
Write small functions with clear inputs and outputs, and let scope keep them isolated. **Prefer parameters and return values over globals**: a function that takes what it needs as arguments and hands back a result is testable, reusable, and free of spooky action at a distance. Give parameters **sensible defaults** so common calls stay short (`greet("Ada")`), and pass arguments by **keyword** at the call site when it improves readability (`connect(timeout=30)`). Use **`*args`/`**kwargs`** when a function genuinely must accept a variable number of inputs or forward arguments to another call — not as a lazy substitute for naming the parameters you actually expect.

Treat globals as read-mostly. Reading a module-level constant inside a function is fine and automatic; *rebinding* one should be rare and must be spelled out with `global` (or `nonlocal` to rebind an enclosing function's variable), precisely so the mutation is visible to anyone reading the code. Lean on **first-class functions**: pass a `lambda` or a named function as a `key=`, a callback, or a strategy, which often replaces a sprawling `if`/`elif` chain with a clean lookup. Keep lambdas to a single, simple expression — the moment one needs a statement, a conditional with side effects, or a name to aid debugging, promote it to a `def`. And learn the one default-argument rule that bites everyone: **never use a mutable default** like `def f(items=[])`. The default object is created **once** when the function is defined and then *shared across every call*, so appends accumulate between calls; use `def f(items=None)` and set `items = items or []` inside. The mental model to carry: functions are isolated workspaces connected to the outside world only through their parameters and their return value, and LEGB tells you exactly which variable any name resolves to — local first, built-in last.

## complexity
time: Defining a function is O(1); calling one adds a small constant overhead (building the call frame, binding arguments) on top of whatever the body does. A name lookup walks at most four scopes (L→E→G→B), each a fast dictionary probe, so resolving a name is effectively O(1).
space: Each active call uses a stack frame holding its locals and arguments — O(1) per simple call, but **recursion stacks frames**, so a recursion depth of d costs O(d) stack space (Python caps this near 1000 by default to catch runaway recursion).
notes: `*args` builds a new tuple and `**kwargs` a new dict per call, sized to the extra arguments — usually tiny, but real allocation. Default-argument objects are created once at definition time and reused, which is the whole reason a mutable default leaks state across calls.

## pitfalls
- **Mutable default arguments.** `def add(x, bucket=[])` shares one list across all calls, so `bucket` keeps growing. Use `bucket=None` then `bucket = bucket if bucket is not None else []` inside.
- **`UnboundLocalError` from assigning a global.** Any assignment to a name inside a function makes it local for the *whole* function. `counter = counter + 1` without `global counter` reads an unbound local on the right side and crashes. Declare `global` (or `nonlocal`) to rebind outer state.
- **Forgetting `return`.** A function that computes a value but never `return`s it yields `None`. `result = compute()` then `result.something` fails with `AttributeError: 'NoneType'` — the missing `return` is the real culprit.
- **Overusing globals for sharing.** Passing state through module-level variables couples functions invisibly and breaks tests. Pass arguments and return results instead; reserve globals for genuine constants.
- **Lambdas doing too much.** A lambda is one expression; cramming logic, side effects, or a long conditional into it hurts readability and can't be `pdb`-stepped. If it needs a name or a statement, write a `def`.

## interviewTips
- Recite LEGB and the assignment rule together: "Bare names resolve Local → Enclosing → Global → Built-in, first match wins; and assigning to a name *anywhere* in a function makes it local for the whole function, which is why rebinding a global needs the `global` keyword." This answers most scope questions in one breath.
- When asked about `*args`/`**kwargs`, define them precisely — "`*args` collects extra positional arguments into a tuple, `**kwargs` extra keyword arguments into a dict" — and mention argument forwarding (`other(*args, **kwargs)`) as the common real use.
- Volunteer the mutable-default-argument gotcha before being asked; recognizing it signals real Python experience. Give the `None` sentinel fix.

## keyTakeaways
- A function packages reusable logic behind a name; it takes parameters (optionally with defaults), runs in a private local scope, and hands back a value with `return` (or `None` if it doesn't).
- `*args` and `**kwargs` absorb a variable number of positional and keyword arguments; lambdas are one-expression anonymous functions; functions are first-class values you can pass and return.
- Name resolution follows LEGB (Local → Enclosing → Global → Built-in); reading an outer name is automatic, but *rebinding* a global or enclosing variable from inside a function requires `global` / `nonlocal`.

## code.python
```python
# def with a default parameter and a return value.
def greet(name, greeting="Hello"):
    return greeting + ", " + name + "!"

print(greet("Ada"))             # Hello, Ada!
print(greet("Ada", "Hi"))       # Hi, Ada!

# *args collects extra positionals (tuple); **kwargs collects keywords (dict).
def summarize(*args, **kwargs):
    return sum(args), dict(kwargs)

print(summarize(1, 2, 3, unit="cm", scale=2))   # (6, {'unit': 'cm', 'scale': 2})

# Local vs global scope: assignment inside a function makes a NEW local
# unless you declare the name global.
counter = 0
def bump_local():
    counter = 99          # a local; the global 'counter' is untouched
def bump_global():
    global counter
    counter = counter + 1 # rebinds the module-level name

bump_local()
print("after bump_local:", counter)         # 0
bump_global(); bump_global()
print("after two bump_global:", counter)    # 2

# A lambda is a one-expression function — handy as a sort key.
pairs = [("pen", 3), ("notebook", 1), ("eraser", 2)]
pairs.sort(key=lambda item: item[1])
print("sorted by price:", pairs)            # [('notebook', 1), ('eraser', 2), ('pen', 3)]

# Functions are first-class values: pass them around like any other value.
def apply_twice(f, x):
    return f(f(x))
print("apply_twice:", apply_twice(lambda n: n + 3, 10))   # 16
```

## code.javascript
```javascript
function greet(name, greeting = "Hello") {
  return greeting + ", " + name + "!";
}
console.log(greet("Ada"));        // Hello, Ada!
console.log(greet("Ada", "Hi"));  // Hi, Ada!

// Rest parameters are JS's *args; a trailing options object stands in for **kwargs.
function summarize(...args) {
  return args.reduce((a, b) => a + b, 0);
}
console.log("sum:", summarize(1, 2, 3));   // 6

let counter = 0;
function bumpLocal() { let counter = 99; return counter; } // shadows outer
function bumpGlobal() { counter = counter + 1; }
bumpLocal();
console.log("after bumpLocal:", counter);        // 0
bumpGlobal(); bumpGlobal();
console.log("after two bumpGlobal:", counter);   // 2

const pairs = [["pen", 3], ["notebook", 1], ["eraser", 2]];
pairs.sort((a, b) => a[1] - b[1]);
console.log("sorted by price:", pairs);

const applyTwice = (f, x) => f(f(x));
console.log("applyTwice:", applyTwice((n) => n + 3, 10));  // 16
```

## code.java
```java
import java.util.*;

public class Funcs {
    static int counter = 0;

    static String greet(String name, String greeting) { return greeting + ", " + name + "!"; }
    static String greet(String name) { return greet(name, "Hello"); }  // default via overload

    static int sumAll(int... args) {   // varargs ~ *args
        int s = 0;
        for (int a : args) s += a;
        return s;
    }
    static void bumpGlobal() { counter = counter + 1; }  // rebinds the static field

    public static void main(String[] args) {
        System.out.println(greet("Ada"));        // Hello, Ada!
        System.out.println(greet("Ada", "Hi"));  // Hi, Ada!
        System.out.println("sum: " + sumAll(1, 2, 3));   // 6

        bumpGlobal(); bumpGlobal();
        System.out.println("after two bumpGlobal: " + counter);  // 2

        List<int[]> pairs = new ArrayList<>(List.of(new int[]{3}, new int[]{1}, new int[]{2}));
        pairs.sort((a, b) -> a[0] - b[0]);       // lambda as comparator
        StringBuilder sb = new StringBuilder("sorted prices:");
        for (int[] p : pairs) sb.append(" ").append(p[0]);
        System.out.println(sb);                   // 1 2 3
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;

int counter = 0;
string greet(const string& name, const string& greeting = "Hello") {
    return greeting + ", " + name + "!";
}
void bump_global() { counter = counter + 1; }

int main() {
    cout << greet("Ada") << "\n";        // Hello, Ada!
    cout << greet("Ada", "Hi") << "\n";  // Hi, Ada!

    bump_global(); bump_global();
    cout << "after two bump_global: " << counter << "\n";  // 2

    vector<pair<string,int>> pairs = {{"pen",3},{"notebook",1},{"eraser",2}};
    sort(pairs.begin(), pairs.end(),
         [](const auto& a, const auto& b){ return a.second < b.second; });  // lambda comparator
    cout << "sorted by price:";
    for (auto& p : pairs) cout << " " << p.first;
    cout << "\n";                        // notebook eraser pen
    return 0;
}
```
