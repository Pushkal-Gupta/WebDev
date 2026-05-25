import{r as y,j as e,R as te}from"./vendor-query-FJdQ8OJm.js";import{a as ae,l as ie,b as re}from"./index-D1qBnmHu.js";import{B as D,a8 as G,p as oe,X as W,x as B,w as L,ab as se,u as V,ac as le,ad as de,ae as K,af as he,a1 as ce,v as ue,ag as pe}from"./vendor-icons-BcTrezQX.js";import{L as j}from"./vendor-react-C_QCAbBo.js";import"./vendor-supabase-ClVc2H6D.js";const O=[{slug:"fundamentals",title:"Fundamentals",note:"Get comfortable with the language and the cost model before you touch real algorithms.",subsections:[{id:"programming",label:"Programming",items:[{kind:"theory",label:"Input and Output",body:{summary:'Every program is a **pipe**: bytes flow in (stdin, files, network, UI events), bytes flow out (stdout, files, sockets, the DOM). Mastering I/O early means your "Hello, world" actually reads test cases and prints the verdict the way the judge expects.',sections:[{heading:"The mental model",body:"```ascii\n  +---------+      +-----------+      +----------+\n  |  stdin  | ---> | your code | ---> |  stdout  |\n  +---------+      +-----------+      +----------+\n        ^               |                   |\n        |               v                   v\n      keyboard       memory              terminal\n      file < in.txt                      file > out.txt\n```\n\nThe shell wires programs together with `<`, `>`, and `|`. Your job is to read from stdin without assuming the source and write to stdout without assuming the sink. Online judges literally pipe a test file into your binary.\n\n> Note: **Buffered output** can swallow your last `print` if the program crashes. Always flush or end with a newline."},{heading:"Canonical operation",body:'Reading two numbers and printing their sum across the four interview languages:\n\n```py\n# Python\nimport sys\na, b = map(int, sys.stdin.read().split())\nprint(a + b)\n```\n\n```js\n// JavaScript (Node)\nconst [a, b] = require("fs").readFileSync(0, "utf8").split(/\\s+/).map(Number);\nconsole.log(a + b);\n```\n\n```java\n// Java\nimport java.util.Scanner;\nclass Main { public static void main(String[] a){ Scanner s=new Scanner(System.in); System.out.println(s.nextInt()+s.nextInt()); } }\n```\n\n```cpp\n// C++ — sync_with_stdio(false) is the speed switch interviewers love\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){ ios::sync_with_stdio(false); cin.tie(nullptr); int a,b; cin>>a>>b; cout<<a+b<<"\\n"; }\n```\n\n> Tip: For large inputs (>10^5 lines) **always** use `BufferedReader` in Java and `sys.stdin` in Python. `input()` and `Scanner` are 10x slower.'},{heading:"When to reach for it",body:"On day one, every problem. Beyond that, the choice is between **line-oriented** reading (`readline` / `getline`) when the format is row-per-record, **token-oriented** reading (`scanf` / `next()`) when whitespace separates values, and **read-everything-then-parse** when the input is small enough to slurp. Slurping is fastest and the easiest to test; reach for streaming only when the file does not fit in memory. For interactive judges, alternate `print + flush` and `input()` in lock-step — buffered output silently deadlocks otherwise."},{heading:"Variants",body:'Formatted output: `printf("%.2f", x)` (C/C++), `f"{x:.2f}"` (Python), `String.format("%.2f", x)` (Java), `x.toFixed(2)` (JS). Multi-line input often uses a sentinel (`-1` to stop), an explicit count `n`, or EOF (`while (cin >> x)`). Competitive setups read the full file with `sys.stdin.buffer.read().split()` and parse lazily. **Binary I/O** uses `open(path, "rb")` / `fread` when the data is not text. **Standard error** (`stderr` / `sys.stderr`) is a separate stream for diagnostics that does not pollute the answer. **Redirection** chains programs: `solution < tests/01.in > tests/01.out` is how every judge actually runs your code.'},{heading:"Common interview problems",body:["Read `n` then `n` integers and print their sum / max.","Read until EOF and count words / lines (`wc` clone).","Parse a matrix from stdin: first line `r c`, then `r` rows of `c` numbers.","Format currency / percentages with fixed decimals."]}],complexity:{best:"`O(n)` in the size of the input — you must touch every byte",average:"`O(n)` for read + `O(m)` for write, dominated by whichever is larger",worst:"Unbuffered I/O is `O(n)` but with a huge constant — often 10-50x slower",space:"`O(1)` streaming, `O(n)` if you slurp the file into memory first"},pitfalls:["**Slow I/O.** Python `input()` and Java `Scanner` time out on 10^6-line inputs. Fix: `sys.stdin.readline` / `BufferedReader`.","**Forgotten flush.** Interactive problems hang because output sits in the buffer. Fix: `sys.stdout.flush()` or `cout << endl` (which flushes).","**Locale-formatted numbers.** `1,234.56` parses as a tuple in some locales. Fix: parse in C locale or strip separators explicitly.",'**Trailing whitespace.** Strict judges reject `"42 "`. Fix: `print(x)` not `print(x, end=" ")`.']}},{kind:"theory",label:"Conditional Statements",body:{summary:"Branching is how a program **chooses**. The CPU evaluates a boolean expression and jumps to one of two code paths — and a modern CPU guesses which path you will take before the answer is even ready, so badly-ordered conditions are not just ugly, they are slow.",sections:[{heading:"The mental model",body:`Every conditional is a fork in the control-flow graph:

\`\`\`ascii
              +-----------+
              | cond ?    |
              +-----------+
               /         \\
           true           false
            v                v
      +---------+      +---------+
      | block A |      | block B |
      +---------+      +---------+
               \\         /
                v       v
              +-----------+
              |   merge   |
              +-----------+
\`\`\`

The CPU's **branch predictor** keeps a per-branch history. If \`cond\` is true 99% of the time, the predictor will speculate \`true\` and start executing block A before the comparison finishes. A mispredict costs ~15-20 cycles.

> Note: Put the **likely** case first when the branches are exclusive — it keeps the predictor happy and reads more naturally.`},{heading:"Canonical operation",body:`Classifying a grade with \`if / elif / else\`, a ternary, and a switch — same logic, three styles:

\`\`\`py
# Chained
def grade(s):
    if s >= 90:  return "A"
    elif s >= 80: return "B"
    elif s >= 70: return "C"
    else:         return "F"

# Ternary (good for two-way only)
status = "pass" if score >= 50 else "fail"

# Dispatch table — Python's switch
grades = {True: "A"}  # built dynamically, or use match in 3.10+
\`\`\`

\`\`\`js
switch (status) {
  case "ok":     handleOk();     break;
  case "retry":  handleRetry();  break;
  default:       handleError();
}
\`\`\`

> Tip: A long \`if / elif\` chain over a single variable is almost always clearer as a **dictionary lookup** or a \`switch\`. Three branches is the comfort limit.`},{heading:"When to reach for it",body:"Use `if` when the condition is a boolean expression with mixed operators. Use a ternary when the two branches are short expressions that return a value — never for side effects. Use `switch` (or Python `match`) when you dispatch on a single discriminator with three or more cases. Use a dictionary / lookup table when the discriminator is a value and each case is a one-liner — it is `O(1)` versus `O(n)` for an `if / elif` ladder."},{heading:"Variants",body:"**Guard clauses**: return early on edge cases (`if not nums: return 0`) to keep the happy path un-indented. **Short-circuit evaluation**: `a and b` skips `b` if `a` is falsy — use it to safely chain `if user and user.is_admin`. **Pattern matching**: Python `match / case`, JS `switch (true)`, Java `switch` expressions with `->`. **Conditional expressions** vs **conditional statements**: the first returns a value, the second runs side effects. Mixing them is a code-smell."},{heading:"Common interview problems",body:["FizzBuzz — the classic conditional warm-up.","Roman to integer — chained conditionals over character pairs.","Triangle classification (equilateral / isosceles / scalene).","Leap year detection — three nested conditions in one boolean."]}],complexity:{best:"`O(1)` — a single comparison and jump",average:"`O(k)` for `k` chained `elif`s in the worst path",worst:"Same — but mispredicted branches cost an extra ~15 cycles each",space:"`O(1)` — conditionals add no allocations"},pitfalls:["**Assignment vs equality.** `if (x = 5)` is a silent bug in C/C++/Java. Fix: enable `-Wall` or use `if (5 == x)` (Yoda condition).","**Dangling `else`.** `if (a) if (b) x; else y;` binds `else` to the inner `if`. Fix: always brace your bodies.","**Forgotten `break`.** C/Java/JS `switch` falls through by default. Fix: `break;` after every case or use arrow-form `case X -> ...`.","**Truthiness traps.** `if (list)` checks emptiness in Python but identity in Java. Fix: `if list:` vs `if (list != null && !list.isEmpty())`."]}},{kind:"theory",label:"For loop",body:{summary:"The **counted** loop: you know the bounds in advance and you want to walk through them. In modern languages it has split into two cousins — the **index loop** (`for i in range(n)`) and the **iterator loop** (`for x in xs`) — and using the wrong one is a beginner tell.",sections:[{heading:"The mental model",body:`Three moving parts: an **initializer**, a **condition**, and an **update**. The loop runs the body as long as the condition holds, applying the update after each pass.

\`\`\`ascii
        +---------------+
        |  init: i = 0  |
        +-------+-------+
                v
        +---------------+
   +--> | cond: i < n?  | --no--> exit
   |    +-------+-------+
   |            | yes
   |            v
   |    +---------------+
   |    |   body(i)     |
   |    +-------+-------+
   |            v
   |    +---------------+
   +----+  update: i++  |
        +---------------+
\`\`\`

> Note: In Python and JS, the iterator form \`for x in xs\` is **strictly preferable** when you do not need the index — it cannot go out of bounds and it works for any iterable.`},{heading:"Canonical operation",body:"Sum the squares of the first `n` integers — index-form and iterator-form:\n\n```py\n# Index form — needed when you mutate xs or want pairs (i, j)\ntotal = 0\nfor i in range(n):\n    total += i * i\n\n# Iterator form — cleaner when index is irrelevant\ntotal = sum(x * x for x in range(n))\n\n# Enumerate — when you need both\nfor i, x in enumerate(words):\n    print(i, x)\n```\n\n```cpp\n// C++ — range-for is the modern default\nint total = 0;\nfor (int x : xs) total += x * x;\n```\n\n> Tip: A `for` loop that needs `break` or `continue` on every iteration is usually a `while` loop in disguise — switch to make the exit condition explicit."},{heading:"When to reach for it",body:'Use `for` when the **number of iterations is bounded by the input size** and known at loop entry: traversing an array, walking a fixed range, iterating over a known collection. Use `while` when the exit condition depends on data computed inside the loop (binary search, two-pointers, "process until stable"). Use **recursion** or **functional combinators** (`map`, `filter`, `reduce`) when the loop body is a one-liner transformation — they read better.'},{heading:"Variants",body:'**Reverse loop**: `for i in range(n-1, -1, -1)` (Python), `for (int i=n-1; i>=0; --i)` (C/Java). **Step loops**: `for i in range(0, n, 2)` walks evens. **Nested loops**: `O(n^2)`; if both depend on `n`, you almost always need a smarter algorithm. **Loop unrolling**: hand-fusing four iterations into one for a hot inner loop — modern compilers do this for you, do not bother. **`for ... else`**: Python\'s `else` after a loop runs only if the loop completed without `break` — useful for "did we find it?" searches.'},{heading:"Common interview problems",body:["Reverse an array in place — two-index for loop with swap.","Matrix transpose — nested loops with `j > i` to avoid double-swap.","Find pairs with given sum — nested loops, then the hash-map upgrade.","Sieve of Eratosthenes — outer prime loop, inner multiple loop."]}],complexity:{best:"`O(n)` for a single linear loop; `O(1)` if you `break` immediately",average:"Loop work × iteration count — usually `O(n)`, `O(n log n)`, or `O(n^2)`",worst:"Nested loops compound: two nested `n`-loops are `O(n^2)`, three are `O(n^3)`",space:"`O(1)` — the loop itself allocates nothing; the body may"},pitfalls:['**Off-by-one.** `for i in range(1, n)` skips index 0. Fix: write the bounds out loud — "first index `0`, last index `n-1`".',"**Mutating the iterable.** `for x in xs: xs.remove(x)` skips elements. Fix: iterate over `xs.copy()` or filter into a new list.","**Closure capture in loops (JS).** `for (var i = 0; ...) setTimeout(() => log(i))` logs `n` every time. Fix: `let i` (block-scoped).",'**Accidental quadratic.** Concatenating strings inside a loop is `O(n^2)` in Java/Python. Fix: `StringBuilder` / `"".join(parts)`.']}},{kind:"theory",label:"While loop",body:{summary:'The **conditional** loop: keep going until something becomes true. Use it when the exit condition depends on values computed **inside** the loop body — binary search, "read until EOF", any "shrink until stable" pattern.',sections:[{heading:"The mental model",body:`A while loop is a guarded jump. The condition is checked **before** every iteration (pre-test) or **after** (post-test, the \`do-while\` form). The invariant you must maintain is: every iteration either makes progress toward the exit condition or sets \`break\`.

\`\`\`ascii
    +---------------+         +---------------+
    |  pre-test     |         |  post-test    |
    |  while(c) {.} |         |  do {.} while |
    +-------+-------+         +-------+-------+
            v                         v
    cond? --no--> exit         body runs once
      | yes                        v
      v                       cond? --no--> exit
    body                          | yes
      |                           v
      +-----------+               body
                                    |
                                    +-----+
\`\`\`

> Warning: If the body cannot influence the condition, you have an infinite loop. The cure is \`break\` on a sentinel — or, more honestly, a different control structure.`},{heading:"Canonical operation",body:`Binary search — the textbook while-loop because the bounds shrink based on what we observe:

\`\`\`py
def bsearch(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
\`\`\`

A deliberately infinite loop with explicit exit — common in event loops and REPLs:

\`\`\`py
while True:
    line = input()
    if line == "quit":
        break
    handle(line)
\`\`\`

> Tip: \`while True:\` + \`break\` reads more honestly than a tortured boolean condition. Use it when the exit point is mid-body.`},{heading:"When to reach for it",body:"Pick `while` when the **iteration count is data-dependent**: shrinking a search space, advancing a pointer until a condition flips, reading from a stream until EOF, retrying until success. Pick `for` when the bound is known up front. If you find yourself initializing a counter, checking it, and incrementing it around a `while`, you wanted `for`."},{heading:"Variants",body:'**`do-while`** (C, C++, Java, JS) runs the body **once** before testing — handy for "ask the user, repeat if invalid." Python and Go lack it; you fake it with `while True:` + `break`. **`break` / `continue`** jump out / skip rest. **Labeled break** in Java / Kotlin escapes nested loops. **Sentinel loops** read until a marker: `while ((line = br.readLine()) != null)`.'},{heading:"Common interview problems",body:["Binary search — the archetypal pre-test while.","Two-pointer / sliding window — advance `lo` or `hi` based on the window state.","Reverse a number with `while n > 0: n //= 10`.","Newton's method for square root — iterate until the delta is below epsilon."]}],complexity:{best:"`O(1)` if the condition is false immediately",average:"Depends entirely on the body — `O(log n)` for binary search, `O(n)` for two-pointer",worst:"Unbounded if the body fails to make progress — that is the classic infinite-loop bug",space:"`O(1)` for the loop; body may allocate"},pitfalls:["**Infinite loop.** The body must change a variable the condition reads. Fix: trace the first three iterations on paper.","**Off-by-one on the boundary.** `while lo < hi` vs `while lo <= hi` differ on whether `hi` is inclusive. Fix: commit to an invariant and pick the comparator that matches.","**Stale read of a flag.** In multithreaded code, the condition variable can be cached in a register. Fix: `volatile` (Java), `std::atomic` (C++).","**`continue` skipping the update.** `while i < n: ...; continue; i += 1` loops forever. Fix: put the update before any `continue` or use `for`."]}},{kind:"theory",label:"Function",body:{summary:"A function is a **named, reusable** block of code that takes inputs (arguments), does work, and optionally returns a value. Functions are the unit of testing, the unit of naming, and the unit of recursion — most of programming is choosing the right ones.",sections:[{heading:"The mental model",body:`A function call pushes a **stack frame** holding the arguments, the local variables, and the return address. When the function returns, the frame is popped and execution resumes at the caller.

\`\`\`ascii
   main() called factorial(3)

     +-------------------+
     | factorial(1)      |  <- top, currently running
     | n=1   ret=line 6  |
     +-------------------+
     | factorial(2)      |
     | n=2   ret=line 6  |
     +-------------------+
     | factorial(3)      |
     | n=3   ret=line 12 |
     +-------------------+
     | main              |
     +-------------------+
\`\`\`

> Note: A function with **no side effects** that always returns the same output for the same input is called **pure**. Pure functions are trivially testable, cacheable (memoization), and parallelizable.`},{heading:"Canonical operation",body:`Definition, default arguments, multiple returns, and a recursive base:

\`\`\`py
def factorial(n: int) -> int:
    """Classic recursion — base + recursive case."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def divmod_pair(a, b=10):
    """Default arg, tuple return."""
    return a // b, a % b

q, r = divmod_pair(37)        # 3, 7
\`\`\`

\`\`\`js
// JavaScript — arrow vs named, default args, rest params
const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
const greet = (name = "stranger") => \`hi, \${name}\`;
\`\`\`

> Tip: A function longer than ~30 lines is doing more than one thing. Extract the inner step into a helper with a meaningful name — naming is the documentation.`},{heading:"When to reach for it",body:'Always, the moment you find yourself **repeating** a block, **naming** a concept, or **isolating** a tricky bit for testing. The cost of a function call is roughly free (~1 ns) and a JIT will often inline it. If a snippet has a one-line comment describing what it does, it should usually be a function whose name is that comment. The right unit is "one thing well": if your function name needs an `and`, it should be two functions. Functions also create a **test boundary** — pure functions are testable without mocks, and that pressure tends to push side effects out to the edges of your program where they belong.'},{heading:"Variants",body:"**Arguments**: positional, keyword (`f(x=1)`), default (`def f(x=0)`), variadic (`*args`, `**kwargs`). **Returns**: single value, multiple (tuple unpacking), or `None`. **First-class**: pass functions as values — `map(square, xs)`, `sort(key=lambda x: x.age)`. **Closures**: a nested function captures its enclosing scope; the foundation of decorators and currying. **Recursion**: a function calling itself — tail recursion is **not** optimized in Python or JS, only in Scheme / functional langs."},{heading:"Common interview problems",body:["Factorial / Fibonacci — recursion + memoization.","Reverse a linked list — iterative vs recursive helpers.","Decorator that times a function call — first-class functions + closures.","Implement `bind` / partial application from scratch."]}],complexity:{best:"`O(1)` per call overhead — argument passing + frame setup",average:"Recursive functions: dominated by the recurrence (see Analysis of Recursion)",worst:"Deep recursion can blow the ~10^4-frame stack in Python / JS",space:"`O(depth)` for recursion; `O(1)` for iterative functions"},pitfalls:["**Mutable default arguments (Python).** `def f(xs=[]):` shares **one** list across calls. Fix: `def f(xs=None): xs = xs or []`.","**Late-binding in closures.** `[lambda: i for i in range(3)]` returns three functions that all print `2`. Fix: `lambda i=i: i`.","**Pass-by-reference surprises.** Passing a list and mutating it changes the caller's list too. Fix: pass `list.copy()` or return a new value.","**Stack overflow.** Recursing 10^5 deep in Python throws `RecursionError`. Fix: convert to iterative, or `sys.setrecursionlimit` carefully."]}},{kind:"theory",label:"Classes and Objects",body:{summary:"A **class** is a blueprint; an **object** is an instance with its own state. Objects bundle data (fields) with the operations that act on that data (methods), enforcing invariants the rest of the program can rely on without inspecting internals.",sections:[{heading:"The mental model",body:`Think of a class as a stamp and objects as the impressions it makes. Each object carries its own fields; methods are shared (one copy per class). The first parameter — \`self\` in Python, \`this\` in Java / C++ / JS — points back at the instance whose method is running.

\`\`\`ascii
   class BankAccount
   +------------------+        +-----------+      +-----------+
   | balance: number  | -----> | acc_a: $10|      | acc_b: $50|
   | deposit(amt)     | -----> | acc_a     |      | acc_b     |
   | withdraw(amt)    | -----> +-----------+      +-----------+
   +------------------+         (instance)         (instance)
\`\`\`

> Note: An object is just **state + behavior**. If you only need state, a dict / struct / record is simpler. If you only need behavior, a function is simpler. Reach for a class when an invariant ties them together.`},{heading:"Canonical operation",body:`A class with a constructor, two methods, and an invariant the methods enforce:

\`\`\`py
class BankAccount:
    def __init__(self, owner: str, opening: float = 0.0):
        if opening < 0:
            raise ValueError("opening must be non-negative")
        self.owner = owner
        self._balance = opening  # leading underscore = "private by convention"

    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self._balance += amount

    def withdraw(self, amount: float) -> None:
        if amount > self._balance:
            raise ValueError("insufficient funds")
        self._balance -= amount

    @property
    def balance(self) -> float:
        return self._balance

acc = BankAccount("Alice", 100)
acc.deposit(50)
print(acc.balance)  # 150
\`\`\`

> Tip: The invariant here is \`_balance >= 0\`. Every method either upholds it or raises — callers never need to check.`},{heading:"When to reach for it",body:"Reach for a class when (a) several functions share the same parameters and (b) those parameters obey an invariant. If the only operations are read / write, use a record / struct / namedtuple. If the operations are stateless, use module-level functions. Classes shine for **stateful machines** (parsers, sessions, connections), **polymorphism** (one interface, many implementations), and **encapsulation** of tricky invariants."},{heading:"Variants",body:'**Inheritance**: `class Savings(BankAccount):` reuses fields and methods, overrides where needed. Prefer **composition** when "is-a" feels forced. **Abstract classes / interfaces**: declare methods without implementing them — Java `interface`, Python `abc.ABC`. **Dataclasses / records**: boilerplate-free state-only classes (`@dataclass` in Python, `record` in Java 14+). **Static methods**: class-scoped helpers that do not touch instance state. **Magic methods**: `__len__`, `__eq__`, `__repr__` let your objects feel native.'},{heading:"Common interview problems",body:["LRU cache — class with `get` and `put` enforcing capacity.","Min stack — class wrapping a list with `getMin` in `O(1)`.","Tic-tac-toe state — class tracking board + winner check.","Iterator class — implement `__iter__` and `__next__`."]}],complexity:{best:"`O(1)` field access, `O(1)` method dispatch (after JIT)",average:"Method call overhead ~1-5 ns; comparable to a plain function call",worst:"Deep inheritance + dynamic dispatch can defeat inlining — rare in practice",space:"`O(fields)` per instance; methods are shared, not duplicated"},pitfalls:["**God class.** A 1000-line class with 50 methods is a procedure pretending to be an object. Fix: extract collaborators.","**Anaemic class.** Data-only class with all logic in external functions defeats encapsulation. Fix: move invariants onto the class.","**Mutable class fields shared across instances (Python).** `class C: xs = []` makes one list. Fix: assign in `__init__`.","**Forgotten `super().__init__()`.** Subclass skips parent setup, fields are missing. Fix: call `super().__init__(...)` first."]}}]},{id:"complexity",label:"Complexity Analysis",items:[{kind:"theory",label:"Order of Growth",body:{summary:"**Order of growth** is how the runtime (or memory) of an algorithm **scales** as the input grows large. We do not care about microseconds; we care about whether doubling `n` doubles, quadruples, or barely affects the cost — because that is what decides whether the algorithm survives production.",sections:[{heading:"The mental model",body:"Throw away constants and lower-order terms. `3n^2 + 100n + 7` and `n^2 / 2` have the same **order of growth**: quadratic. They differ by constant factors that vanish once `n` is big enough.\n\n```ascii\n  n        log n   n        n log n   n^2        2^n\n  ----     -----   ------   --------  ---------  -----------\n  10       3       10       33        100        1,024\n  100      7       100      664       10,000     huge\n  1,000    10      1,000    9,966     1,000,000  astronomical\n  10,000   13      10,000   132,877   10^8       impossible\n```\n\n> Note: At `n = 10^6`, the gap between `O(n log n)` (~20 million ops) and `O(n^2)` (~1 trillion ops) is the difference between **20 ms** and **20 minutes**. Order of growth is destiny."},{heading:"Canonical operation",body:`Counting operations in a nested loop reveals the order directly — no need to time anything:

\`\`\`py
# T(n) = 1 + n + (work inside outer loop) * n
# inner loop runs n times -> n * n + ... = O(n^2)
def pairs(xs):
    out = []
    for i in range(len(xs)):           # n
        for j in range(i + 1, len(xs)): # n on average
            out.append((xs[i], xs[j]))
    return out
\`\`\`

Replacing the inner loop with a hash lookup drops it to linear:

\`\`\`py
# O(n) total — one pass, O(1) per element
def two_sum(xs, t):
    seen = {}
    for i, x in enumerate(xs):
        if t - x in seen:
            return (seen[t - x], i)
        seen[x] = i
\`\`\`

> Tip: When two algorithms have the same order, **constants matter** — a \`100 * n\` algorithm beats a \`0.01 * n^2\` one only at \`n > 10,000\`. Know your input size.`},{heading:"When to reach for it",body:"Every time you write a loop, ask: how does the iteration count depend on `n`? The order of growth is the **upper bound** of what you should commit to — anything faster is a bonus, anything slower is a regression. Use it to pick between algorithms (merge sort `O(n log n)` vs bubble sort `O(n^2)`) and to set realistic input limits (`n = 10^5` is fine for `O(n log n)`, dies for `O(n^2)`)."},{heading:"Variants",body:"**Polynomial**: `n`, `n^2`, `n^3` — tractable for moderate sizes. **Logarithmic**: `log n` — search trees, divide-and-conquer. **Linearithmic**: `n log n` — best comparison-sort. **Exponential**: `2^n` — subset enumeration, brute-force. **Factorial**: `n!` — permutations; dies by `n = 12`. **Sublinear**: `sqrt(n)` — meet-in-the-middle, square-root decomposition. **Pseudo-polynomial**: depends on the **value** of input, not its length — knapsack with capacity `W` is `O(n W)`, polynomial in `W` but exponential in `log W`."},{heading:"Common interview problems",body:['"Is `O(n^2)` fast enough?" — depends on `n`. Aim for `O(n log n)` above `n = 10^4`.',"Given a piece of code, derive its complexity by counting nested loops.","Pick between merge sort (`O(n log n)`) and counting sort (`O(n + k)`).","Decide whether to memoize: `O(2^n)` recursion with overlapping subproblems → `O(n^2)` DP."]}],complexity:{best:"A constant-time algorithm `O(1)` is the gold standard",average:"Most useful algorithms land between `O(n)` and `O(n log n)`",worst:"`O(n^2)` is acceptable up to ~`10^4`; `O(2^n)` dies at ~`30`",space:"Same scale applies — `O(1)`, `O(n)`, `O(n^2)` all matter"},pitfalls:['**Hidden inner loop.** `s += "x"` in Python is `O(n)` per call (string immutability) → loop is `O(n^2)`. Fix: build a list, `"".join`.',"**Logarithmic base matters in chains.** `log2 n` vs `log10 n` are constant-factor; ignore in `O()`. But `n^log n` is **not** polynomial.","**Average vs worst.** Quicksort is `O(n log n)` average but `O(n^2)` worst — interviewers care about the worst.","**Pseudo-polynomial fools.** `O(n * W)` knapsack looks fast but `W = 10^9` is hopeless."]}},{kind:"theory",label:"Asymptotic Analysis",body:{summary:'**Asymptotic analysis** is the formal language for "as the input grows without bound." It strips away machine speed, language, and constants, leaving a function that captures the algorithm\'s scalability. Three notations — `O`, `Ω`, `Θ` — give upper, lower, and tight bounds.',sections:[{heading:"The mental model",body:'Pick any function `T(n)` describing your runtime. Asymptotic analysis asks: **for all sufficiently large `n`**, is `T(n)` eventually bounded above / below / both by `c * g(n)` for some constant `c`?\n\n```ascii\n           T(n) for various inputs of size n\n\n     |               * worst case\n     |          *\n  T  |       *           Θ band = average ± const\n  i  |     *  +----------- Ω lower bound\n  m  |   *   /\n  e  |  *   /  +--------- best case\n     | *  / / \n     |* //\n     +------------------------> n\n```\n\nFormally: `T(n) = O(g(n))` iff there exist `c > 0` and `n_0` such that `0 <= T(n) <= c * g(n)` for all `n >= n_0`.\n\n> Note: The "for all sufficiently large `n`" clause is the whole point. Small-`n` behaviour is noise; we are picking the algorithm that wins at scale.'},{heading:"Canonical operation",body:'Proving `2n + 100 = O(n)` from the definition:\n\n```\nPick c = 3 and n_0 = 100.\nFor n >= 100:  2n + 100 <= 2n + n = 3n = c * n.  QED.\n```\n\nProving `n^2 ≠ O(n)`:\n\n```\nAssume n^2 <= c * n for all n >= n_0.\nThen n <= c for all n >= n_0 — impossible for finite c.\n```\n\nIn practice you do not derive these formally each time — you use a table of known orders and the rules:\n- **Sum rule**: `O(f) + O(g) = O(max(f, g))`.\n- **Product rule**: `O(f) * O(g) = O(f * g)`.\n- **Constant rule**: `O(c * f) = O(f)` for constant `c`.\n\n> Tip: When a piece of code is "do step A then step B," the total is the max of their orders. When it is "do step B inside a loop over A," the total is the product.'},{heading:"When to reach for it",body:'Every time you compare two algorithms or argue that one is "fast enough." Asymptotic analysis is the universal language interviewers expect. Use it to **prove correctness of a complexity claim** (not "I think it is O(n)" but "it is O(n) because the outer loop runs n times and each iteration does O(1) work").'},{heading:"Variants",body:'**Big-O (`O`)**: upper bound — "no worse than." **Big-Omega (`Ω`)**: lower bound — "at least as bad as." **Big-Theta (`Θ`)**: tight bound — both. **Little-o (`o`)**: strict upper bound — `f = o(g)` means `f / g → 0`. **Little-omega (`ω`)**: strict lower. **Amortized**: average cost per operation over a sequence — `dynamic array push` is `O(1)` amortized even though some pushes are `O(n)`. **Expected**: average over random input or random algorithm choices — quicksort with random pivot is `O(n log n)` expected.'},{heading:"Common interview problems",body:["Derive the asymptotic complexity of a given piece of code.","Prove `n log n + n = Θ(n log n)` from the definition.","Explain why HashMap operations are amortized `O(1)` but worst-case `O(n)`.","Distinguish `O(n)` and `Θ(n)` — many candidates conflate them."]}],complexity:{best:'A statement like "`O(n)`" is a **claim about scaling**, not a runtime number',average:'Use `Θ` for tight bounds — "exactly this order, up to constants"',worst:'Reserve `O` for upper-bound claims; `Ω` for "no faster than" arguments',space:"The same notation describes memory growth — `O(n)` extra space, etc."},pitfalls:["**Saying `O(n)` when you mean `Θ(n)`.** Bubble sort is `O(n^2)` and also `O(n^3)`. Use `Θ` for tightness.","**Ignoring constants in practice.** `O(n)` with constant 10^6 loses to `O(n log n)` with constant 1 for any real `n`.","**Confusing worst-case with always-case.** Hash insert is `O(n)` worst but `O(1)` expected.",'**Mistaking `O(1)` for "free."** A 1000-cycle `O(1)` operation in an inner loop still hurts.']}},{kind:"theory",label:"Big-O / Θ / Ω",body:{summary:"Three notations that bound a function's growth from **above**, from **both sides**, and from **below**. Pick the strongest you can prove: `Θ` if you have it, `O` if you only have the upper bound, `Ω` to argue an algorithm cannot be faster.",sections:[{heading:"The mental model",body:'Visualise each notation as a sandwich around your runtime curve:\n\n```ascii\n    Big-O (upper bound)        Big-Omega (lower bound)        Big-Theta (tight)\n\n      c * g(n) ------\\           ---/--- c * g(n)             c1*g <= T <= c2*g\n               \\     \\          /     /                         (squeezed)\n            T(n)\\     \\        /     /T(n)                    c2*g ---\\\n                 \\     \\      /     /                                T \\\n                  ------       -----                            c1*g --/\n```\n\nFormally:\n- `T(n) = O(g(n))` iff `T(n) <= c * g(n)` eventually.\n- `T(n) = Ω(g(n))` iff `T(n) >= c * g(n)` eventually.\n- `T(n) = Θ(g(n))` iff both — equivalently `c1 * g(n) <= T(n) <= c2 * g(n)`.\n\n> Note: `Θ` is the **only** notation that lets you say "this is the right answer." `O` and `Ω` alone leave wiggle room.'},{heading:"Canonical operation",body:`Classifying common algorithms by their tightest known bound:

\`\`\`
Linear scan          Θ(n)
Binary search        Θ(log n) on a sorted array
Merge sort           Θ(n log n) — same upper and lower
Quicksort            O(n log n) average, O(n^2) worst, Ω(n log n) for any comparison sort
Hash table insert    O(1) expected, O(n) worst, Θ(1) amortized
Matrix multiplication O(n^2.373) (Strassen + improvements), Ω(n^2) (must touch the output)
\`\`\`

Why \`Ω(n log n)\` for any comparison sort: there are \`n!\` permutations and each comparison gives one bit; \`log2(n!) = Θ(n log n)\` bits needed, so at least that many comparisons.

> Tip: When asked "is X faster?", state the **bound** and the **case**: "merge sort is Θ(n log n) in the worst case; quicksort is Θ(n log n) expected but Θ(n^2) worst."`},{heading:"When to reach for it",body:'Use **Big-O** when you only need to argue "no worse than": "this solution is `O(n)`, well within the `O(n^2)` budget." Use **Big-Theta** when you can prove both directions and want to forbid future optimization claims: "the algorithm is `Θ(n log n)` — you cannot do better with comparison-only access." Use **Big-Omega** when arguing a **lower bound** for a problem (not an algorithm): "any comparison sort is `Ω(n log n)`."'},{heading:"Variants",body:'**Little-o (`o`)**: strict upper bound — `f = o(g)` iff `lim f/g = 0`. `n = o(n^2)` because `n / n^2 → 0`. **Little-omega (`ω`)**: strict lower. **`o`** says "grows strictly slower," **`O`** says "grows no faster" (could be equal). The relations: `f = o(g) ⟹ f = O(g)` but not the converse. **Soft-O (`Õ`)**: hides polylog factors — `Õ(n)` means `O(n * (log n)^k)` for some `k`. Common in advanced algorithms papers.'},{heading:"Common interview problems",body:["Explain the difference between `O(n)` and `Θ(n)` with an example.","Why is comparison-based sorting `Ω(n log n)`? — information theory argument.","Give a function that is `O(n^2)` but not `Ω(n^2)`.","Amortized vs worst-case `O(1)` for dynamic array push."]}],complexity:{best:"`Ω` is the natural notation for the best case if you bound it from below",average:'`Θ` is the standard for "expected" runtime when input is randomised',worst:'`O` is the standard for "worst case" when no matching lower bound is proven',space:"Same three notations apply to memory growth, not just time"},pitfalls:["**`O` everything.** Saying `n = O(n^2)` is technically true but useless. Tighten to `Θ` when you can.",'**Confusing `O` with average.** `O` is an **upper bound**, not "the typical case." Always state which case (best / average / worst) the bound applies to.','**Forgetting the "eventually" clause.** Small-`n` exceptions do not break the bound.',"**Mixing notations in chains.** `Θ(n) + O(n^2) = O(n^2)` — once you have an `O`, the whole expression is `O`, not `Θ`."]}},{kind:"theory",label:"Time Complexity",body:{summary:'**Time complexity** estimates the number of elementary operations an algorithm performs as a function of input size `n`. It is what we ask about when we say "is this fast enough?" — and a back-of-envelope budget of ~10^8 ops per second on a modern CPU turns abstract orders into wall-clock predictions.',sections:[{heading:"The mental model",body:`Count the operations the algorithm performs in the worst case, ignore constants, keep only the dominant term. A modern CPU does ~10^8-10^9 simple operations per second; competitive judges typically give you 1-2 seconds.

\`\`\`ascii
  n         O(1)   O(log n)  O(n)      O(n log n)  O(n^2)     O(2^n)
  -------   ----   --------  --------  ----------  ---------  -----------
  10        ok     ok        ok        ok          ok         1ms
  10^3      ok     ok        ok        ok          1ms        impossible
  10^5      ok     ok        ok        20ms        10s        impossible
  10^6      ok     ok        10ms      200ms       hours      impossible
  10^9      ok     ok        10s       4min        years      impossible
\`\`\`

> Note: This table is the single most useful chart in algorithms. Memorise it — it tells you what complexity you must hit for a given \`n\`.`},{heading:"Canonical operation",body:`Deriving the complexity of a nested loop by counting:

\`\`\`py
# Inner loop runs i times in iteration i
# Total: 0 + 1 + 2 + ... + (n-1) = n(n-1)/2 = O(n^2)
def pairs(xs):
    out = []
    for i in range(len(xs)):
        for j in range(i):
            out.append((xs[i], xs[j]))
    return out

# Outer runs n, inner doubles each time -> log n levels
# Total: n * log n = O(n log n)
def merge_sort(xs):
    if len(xs) <= 1: return xs
    m = len(xs) // 2
    return merge(merge_sort(xs[:m]), merge_sort(xs[m:]))
\`\`\`

> Tip: For recursive code, write the recurrence \`T(n) = a * T(n/b) + O(f(n))\` and apply the Master Theorem (see Analysis of Recursion).`},{heading:"When to reach for it",body:"Before writing the code, estimate the target complexity from `n`: `n <= 20` → `O(2^n)` brute-force is fine. `n <= 5000` → `O(n^2)` works. `n <= 10^5` → need `O(n log n)`. `n <= 10^7` → need `O(n)` and tight constants. `n <= 10^9` → `O(log n)` or `O(sqrt(n))` only. Match the algorithm to the budget — do not waste time golfing an `O(n^2)` solution when the input requires `O(n log n)`."},{heading:"Variants",body:"**Best case**: the input that makes the algorithm fastest (sorted input for insertion sort: `O(n)`). **Average case**: expectation over a random input distribution (quicksort: `O(n log n)`). **Worst case**: the adversarial input (quicksort worst: `O(n^2)`). **Amortized**: average over a sequence of operations (dynamic array push: `O(1)` amortized). **Output-sensitive**: complexity depends on output size too (`O(n + k)` for `k` results)."},{heading:"Common interview problems",body:["Derive the time complexity of a recursive function.","Compare insertion sort vs merge sort across input sizes.","Find the bottleneck loop in a 50-line function.","Justify amortized `O(1)` for hash-table insert."]}],complexity:{best:"`O(1)` is constant-time — the holy grail; usually only achievable for trivial queries",average:"`O(n log n)` is the comfort zone for most non-trivial problems",worst:"Above `n = 10^7`, sub-linear or `O(n)` with small constants is mandatory",space:"Time is what we usually optimise first; space comes second unless memory-bound"},pitfalls:["**Ignoring the constant when it dominates.** A `100n` algorithm beats `0.1n^2` only above `n = 1000`. Know your input size.","**Treating `O(log n)` as free.** A `log n` factor inside an `O(n)` loop is still `O(n log n)`, not `O(n)`.","**Forgetting input-parsing time.** Reading 10^7 numbers with `Scanner` in Java is the bottleneck, not your algorithm.","**Confusing pseudo-polynomial with polynomial.** Knapsack `O(n * W)` looks linear in `W` but explodes when `W` is `10^9`."]}},{kind:"theory",label:"Space Complexity",body:{summary:"**Space complexity** measures the **extra memory** an algorithm uses beyond the input itself, again as a function of `n`. The recursion stack counts. The output buffer counts. The hidden hash-map you reach for counts. Memory limits are usually 256 MB on judges — that is roughly **64 million ints** before you OOM.",sections:[{heading:"The mental model",body:`Three buckets to track:

\`\`\`ascii
  +------------------+
  | input (read-only)|   not counted in extra space
  +------------------+
  | aux structures   |   arrays, maps, sets you allocate
  +------------------+
  | call stack       |   one frame per pending recursive call
  +------------------+
  | output           |   counted if the problem asks you to return it
  +------------------+
\`\`\`

For a 256 MB limit, a rough table:
- \`10^8\` bytes ≈ \`2.5 * 10^7\` ints (4-byte) or \`1.25 * 10^7\` longs.
- A 2D \`int[10^4][10^4]\` is 400 MB — already too big.
- Python objects are ~28 bytes each; \`10^7\` Python ints uses ~280 MB.

> Note: **Recursion depth is space.** A 10^5-deep recursion uses \`10^5 * frame_size\` of stack — easily 10 MB.`},{heading:"Canonical operation",body:`Same algorithm, three space profiles:

\`\`\`py
# O(n) extra — builds a new list
def reverse_copy(xs):
    return list(reversed(xs))

# O(1) extra — in-place two-pointer swap
def reverse_inplace(xs):
    lo, hi = 0, len(xs) - 1
    while lo < hi:
        xs[lo], xs[hi] = xs[hi], xs[lo]
        lo, hi = lo + 1, hi - 1

# O(n) extra — recursion stack, even though no new list
def reverse_recursive(xs, lo=0, hi=None):
    if hi is None: hi = len(xs) - 1
    if lo >= hi: return
    xs[lo], xs[hi] = xs[hi], xs[lo]
    reverse_recursive(xs, lo + 1, hi - 1)
\`\`\`

> Tip: The iterative version is \`O(1)\` space; the recursive one is \`O(n)\` because of the call stack. Interviewers love this distinction.`},{heading:"When to reach for it",body:'Every memory-bound problem (`n = 10^8` input that does not fit). Every "in-place" requirement (LeetCode loves these — rotate array, remove duplicates from sorted array). Every embedded / mobile scenario where you cannot allocate liberally. As a tie-breaker: when two algorithms have the same time complexity, the one with less space usually wins because of cache locality.'},{heading:"Variants",body:"**In-place**: `O(1)` extra space, mutating the input — most array problems. **Auxiliary**: extra structures you allocate (`O(n)` for a visited set, `O(k)` for a heap of size `k`). **Recursion stack**: `O(depth)` — `O(log n)` for balanced divide-and-conquer, `O(n)` for linear recursion. **Output space**: counted only if the answer itself is large (returning all subsets is `O(2^n)` output, not extra). **Streaming**: `O(1)` or `O(log n)` extra; the input is consumed once and not stored."},{heading:"Common interview problems",body:["Reverse an array in `O(1)` extra space.","Detect a cycle in a linked list in `O(1)` space — Floyd's tortoise + hare.","Move zeros to the end in-place.","Find the missing number in `[0..n]` using `XOR` — `O(1)` space."]}],complexity:{best:"`O(1)` in-place algorithms — only a few pointers / counters",average:"`O(n)` aux structures are standard — hash sets, heaps, BFS queues",worst:"`O(n^2)` 2D DP tables — usually compressible to `O(n)` rolling rows",space:"The whole topic — memory is what we are measuring here"},pitfalls:['**Forgetting the recursion stack.** A "no extra space" recursive solution is `O(n)` space in disguise. Fix: convert to iterative.',"**Hidden allocations.** Python list slicing `xs[lo:hi]` copies — `O(n)` per call inside recursion is `O(n^2)`. Fix: pass indices.",'**Output counted as extra.** Returning all permutations is `O(n!)` output — not an "in-place" bug, just unavoidable.',"**Stack overflow before OOM.** Default stack is ~8 MB; 10^5 recursive frames blow it. Fix: `sys.setrecursionlimit` carefully, or iterate."]}}]}]},{slug:"maths-pattern-recursion",title:"Maths, Pattern & Recursion",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Recursion",body:{summary:"A function that calls itself on a **smaller version** of the same problem, until a base case stops the descent and the partial answers fold back up the call stack.",sections:[{heading:"The call-stack picture",body:`\`\`\`ascii
  factorial(4)
   |--> factorial(3)
   |     |--> factorial(2)
   |     |     |--> factorial(1)
   |     |     |     |--> return 1     <- base case
   |     |     |--> return 2 * 1 = 2
   |     |--> return 3 * 2 = 6
   |--> return 4 * 6 = 24
\`\`\`

> Note: Every recursive function needs **two** things — a **base case** (small enough to answer directly) and a **recursive case** (reduce + trust the smaller call).`},{heading:"Canonical operation — factorial",body:`\`\`\`py
def factorial(n):
    if n <= 1:                # base case
        return 1
    return n * factorial(n - 1)
\`\`\`

> Tip: **Trust the recursion.** Verify the base case + the combine step; do not try to trace every frame in your head.`},{heading:"When to reach for it",body:"The problem has obvious self-similarity: trees, divide-and-conquer (merge sort, quick sort), exhaustive search over choices (subsets, permutations, N-Queens), or a relation like `f(n) = f(n-1) + f(n-2)`."},{heading:"Common interview problems",body:["Reverse a linked list (recursive form), Fibonacci, factorial, tower of Hanoi.","Tree traversals and tree DP (diameter, max path sum).","Subsets, permutations, combinations, palindrome partitioning."]}],complexity:{best:"Linear recurrence `T(n) = T(n-1) + O(1)` → `O(n)`",average:"Divide-and-conquer `T(n) = 2T(n/2) + O(n)` → `O(n log n)` (merge sort)",worst:"Exhaustive search `T(n) = 2T(n-1) + O(1)` → `O(2^n)` (subsets, Hanoi)",space:"`O(depth)` for the call stack — usually `O(log n)` balanced, `O(n)` linear"},pitfalls:["Missing or wrong base case causes infinite recursion and stack overflow.","Mutating shared state inside recursive calls without restoring on return — backtracking bugs come from forgetting to undo.","Exponential blow-up when overlapping subproblems exist — that is the cue to memoize and switch to DP.","Stack-depth limits (~`10^4` in Python / JS) — convert to iterative + explicit stack when the depth is too large."]}},{kind:"theory",label:"Analysis of Recursion",body:{summary:"Recursion cost is captured by a recurrence T(n) = a·T(n/b) + f(n), or T(n) = T(n-1) + f(n) for linear recursion. You either solve the recurrence or apply the Master Theorem.",sections:[{heading:"The recursion tree mental model",body:"Draw the call tree. Sum the work at each level. The total time is the sum of (work per level) × (nodes at that level). Space is the maximum depth, not the total nodes — only the current path lives on the stack at any moment."},{heading:"Master Theorem quick reference",body:["T(n) = 2T(n/2) + O(n) → O(n log n) — merge sort.","T(n) = T(n/2) + O(1) → O(log n) — binary search.","T(n) = 2T(n-1) + O(1) → O(2^n) — subsets / Hanoi.","T(n) = T(n-1) + O(n) → O(n^2) — quicksort worst case."]},{heading:"When recursion needs help",body:"Pure recursion fails when subproblems overlap (Fibonacci recomputes f(2) exponentially many times) or when depth exceeds the stack limit (usually ~10^4 frames in Python/JS). The fix is memoization (top-down DP) or iterative conversion."}],complexity:"Use the Master Theorem or recursion-tree summation; space is O(max depth).",pitfalls:["Confusing time with space — depth is space, total work is time.","Forgetting that each recursive call also pays for its own local variables on the stack."]}}]},{id:"easy-maths",label:"Easy Maths",items:[{kind:"problem",label:"Even or Odd"},{kind:"problem",label:"Sum of Naturals"},{kind:"problem",label:"Closest Number"}]},{id:"easy-pattern",label:"Easy Pattern",items:[{kind:"problem",label:"Solid Rectangle"},{kind:"problem",label:"Floyd's Triangle"},{kind:"problem",label:"Hollow Rectangle"}]},{id:"easy-recursion",label:"Easy Recursion",items:[{kind:"problem",label:"Print 1 to n"},{kind:"problem",label:"Print n to 1"},{kind:"problem",label:"Factorial"},{kind:"problem",label:"GCD"},{kind:"problem",label:"Power"}]},{id:"medium-pattern",label:"Medium Pattern",items:[{kind:"problem",label:"Pyramid"},{kind:"problem",label:"Hollow Diamond"}]},{id:"medium-maths",label:"Medium Maths",items:[{kind:"problem",label:"Count Digits"},{kind:"problem",label:"Prime Testing"},{kind:"problem",label:"Armstrong Number"},{kind:"problem",label:"Trailing Zeros"},{kind:"problem",label:"Prime Factors"},{kind:"problem",label:"All Divisors"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Butterfly"},{kind:"problem",label:"Palindrome Number"},{kind:"problem",label:"Tower of Hanoi"},{kind:"problem",label:"Non-Attacking Knights"},{kind:"problem",label:"Josephus"},{kind:"problem",label:"Water Jug"}]}]},{slug:"array-string",title:"Array & String",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Array",body:{summary:"A contiguous block of memory holding fixed-size elements addressed by index. The contiguity is the whole point: it gives you `O(1)` random access and excellent cache locality, at the cost of `O(n)` insertion in the middle.",sections:[{heading:"Memory layout",body:"Every element sits at a fixed offset from the array base. `addr(arr[i]) = base + i × element_size`. The index arithmetic is constant-time, so reads and writes by index are `O(1)`.\n\n```ascii\nindex   0     1     2     3     4     5\n      +-----+-----+-----+-----+-----+-----+\n arr  |  7  |  3  | 14  |  9  |  2  | 11  |\n      +-----+-----+-----+-----+-----+-----+\naddr base  +4    +8   +12   +16   +20\n```\n\n> Note: Length is fixed at allocation. Dynamic arrays (`vector`, `ArrayList`, Python `list`) amortize a growable abstraction on top via doubling — append is amortized `O(1)`."},{heading:"Canonical operation — insert at index k",body:"Inserting in the middle shifts every element to the right by one slot. That is why middle-insert is `O(n)`, not `O(1)`.\n\n```py\ndef insert(arr, k, x):\n    arr.append(0)               # grow by one\n    for i in range(len(arr) - 1, k, -1):\n        arr[i] = arr[i - 1]     # shift right\n    arr[k] = x\n```\n\n> Tip: Walk **backwards** when shifting to avoid overwriting cells you still need to read."},{heading:"When to reach for it",body:"Default choice for any sequence of homogeneous data where you index, scan, or sort. Use a hash map only when lookups are by key. Use a linked list only when you genuinely need `O(1)` splice-in-the-middle, which is rare in real code."},{heading:"Common interview problems",body:["Two-pointer scans: Two Sum II, container with most water, three-sum.","In-place rewrites: remove duplicates, move zeros, next permutation.","Kadane, prefix-sum, sliding window — all assume array-style indexing."]}],complexity:{best:"Access / append amortized `O(1)`",average:"Search `O(n)` unsorted, `O(log n)` sorted with binary search",worst:"Insert / delete in the middle `O(n)` — every later element shifts",space:"`O(n)` contiguous; `O(1)` extra for most in-place operations"},pitfalls:["Off-by-one on inclusive vs exclusive bounds — pick `[l, r)` or `[l, r]` and never mix the two.","Mutating an array while iterating forward without adjusting the index — easier to walk backwards or write to a new array.","Confusing reference and value semantics across languages — Python `b = a` shares, Java arrays share, C++ `std::vector` copies.",'Assuming `arr.length` shrinks when you "remove" via assignment — most languages need an explicit `pop` / `splice` / `erase`.']}},{kind:"theory",label:"String",body:{summary:'A sequence of characters. In most interview languages strings are **immutable** (Java, Python, JS), so every "modification" allocates a new string — that is the single most important performance fact.',sections:[{heading:"Logical layout",body:"Logically a `char` array. Internally many languages add hidden state — Python interns short strings, Java caches `hashCode`, V8 stores small strings inline.\n\n```ascii\nindex   0    1    2    3    4    5\n      +----+----+----+----+----+----+\n  s   | h  | e  | l  | l  | o  | \\0 |\n      +----+----+----+----+----+----+\n        ^                    ^\n        s[0]                 s[len-1]\n```\n\n> Warning: One **user-perceived character** can be multiple code points (combining marks, family emoji). `s.length` lies on non-BMP chars in Java/JS — iterate code points, not chars, when correctness matters."},{heading:"Building strings correctly",body:'Repeated `+=` in a loop quietly turns an `O(n)` problem into `O(n^2)` because each concat allocates a fresh buffer. Always use a builder.\n\n```py\n# Bad — O(n^2)\ns = ""\nfor c in chars:\n    s += c\n\n# Good — O(n)\nparts = []\nfor c in chars:\n    parts.append(c)\nresult = "".join(parts)\n```\n\n> Tip: Java → `StringBuilder`. C++ → `std::string` reserves and appends in `O(1)` amortized. JS → push to an array and `arr.join("")`.'},{heading:"When to reach for the right tool",body:'Frequency map for anagram / permutation problems. Sliding window for "longest substring with property X." Two pointers from both ends for palindrome checks. KMP / Z / Rabin-Karp when you need substring search faster than `O(n·m)`.'},{heading:"Common interview problems",body:["Valid anagram, group anagrams, longest substring without repeating characters.","Longest palindromic substring (expand around center or Manacher).","Implement `strStr` / `find` — naive vs KMP vs rolling hash."]}],complexity:{best:"Single-char lookup `O(1)`; comparison `O(min(n, m))`",average:"Concat `O(n + m)`, substring `O(k)`",worst:"Naive substring search `O(n · m)`; building with `+=` in a loop `O(n^2)`",space:"`O(n)` for the buffer; `O(1)` extra for two-pointer scans"},pitfalls:["Repeated `+=` in a loop quietly turns an `O(n)` problem into `O(n^2)`.","Unicode: one user-perceived character can be multiple code points; `String.length` lies on non-BMP characters in Java / JS.","Comparing strings with `==` in Java compares references; use `.equals()`.","Forgetting that `substring` / slice on most languages allocates a copy — important inside tight loops."]}},{kind:"theory",label:"Matrix",body:{summary:"A 2-D array: a contiguous (or array-of-arrays) layout where each cell is addressed by `(row, col)`. The first thing to pin down in any matrix problem is the **storage order** (row-major in C / C++ / Python / Java; column-major in Fortran / MATLAB) and the **coordinate convention** (matrix `[row][col]` vs Cartesian `(x, y)` — they're transposed). Cache misses and off-by-ones both live there.",sections:[{heading:"Mental model",body:'For an `m × n` row-major matrix, `M[i][j]` sits at offset `i·n + j` from the base. Walking **row-by-row** strides by 1 — sequential memory, cache-friendly. Walking **column-by-column** strides by `n` — every access is a cache miss on a wide matrix.\n\n```ascii\n row-major M[3][4]:\n   memory:  M[0][0] M[0][1] M[0][2] M[0][3] | M[1][0] M[1][1] M[1][2] M[1][3] | ...\n   stride:    +1      +1      +1      +1       +1      +1      +1      +1\n   row scan: walks consecutive bytes (fast)\n   col scan: jumps n cells per step (slow on large n)\n\n (row, col) vs (x, y):\n   matrix M[i][j]                 Cartesian (x, y)\n   ----------------                ------------------\n   i = row (down)                  y = vertical\n   j = col (right)                 x = horizontal\n   M[2][3] = row 2, col 3          (x=3, y=2)   <- transposed!\n```\n\nAlgorithmically, the **size of the input is `m·n`**, so any "linear in input" matrix algorithm is `O(m·n)`, not `O(m + n)`. The `O(m + n)` search on a sorted matrix is sub-linear precisely because it exploits monotonicity to skip whole rows / columns.\n\n> Note: When dealing with a problem that uses Cartesian `(x, y)` (computer graphics, geometry), the matrix index is `M[y][x]`, **not** `M[x][y]`. Mixing them transposes the entire problem.'},{heading:"Canonical operation",body:`Rotate an \`n × n\` matrix 90° clockwise in place — the classic transpose-then-reverse-rows trick.

\`\`\`py
def rotate_90_cw(M):
    n = len(M)
    for i in range(n):                       # transpose along main diagonal
        for j in range(i + 1, n):
            M[i][j], M[j][i] = M[j][i], M[i][j]
    for row in M:                            # reverse each row
        row.reverse()

# Search a row-and-column-sorted matrix in O(m + n) via staircase walk.
def search_sorted_matrix(M, target):
    if not M: return False
    r, c = 0, len(M[0]) - 1                  # start at top-right corner
    while r < len(M) and c >= 0:
        if   M[r][c] == target: return True
        elif M[r][c] >  target: c -= 1       # column too big
        else:                   r += 1       # row exhausted
    return False
\`\`\`

\`\`\`cpp
// Spiral traversal — track four shrinking boundaries.
vector<int> spiralOrder(vector<vector<int>>& M) {
    vector<int> out;
    if (M.empty()) return out;
    int top = 0, bot = M.size() - 1, lef = 0, rig = M[0].size() - 1;
    while (top <= bot && lef <= rig) {
        for (int j = lef; j <= rig; ++j) out.push_back(M[top][j]);    top++;
        for (int i = top; i <= bot; ++i) out.push_back(M[i][rig]);    rig--;
        if (top <= bot)
            for (int j = rig; j >= lef; --j) out.push_back(M[bot][j]); bot--;
        if (lef <= rig)
            for (int i = bot; i >= top; --i) out.push_back(M[i][lef]); lef++;
    }
    return out;
}
\`\`\`

> Tip: For DFS / BFS on a grid, define \`dirs = [(-1,0), (1,0), (0,-1), (0,1)]\` (4-connectivity) or add the four diagonals (8-connectivity) once at the top — never inline directions in the recursion.`},{heading:"When to reach for it",body:`Reach for matrix algorithms on **grid problems** (number of islands, shortest path in a binary grid, flood fill, surrounded regions, walls and gates), **2-D DP** (unique paths, edit distance, longest common subsequence, dungeon game), **spatial simulations** (game of life, conway, sudoku, n-queens), **image operations** (rotate, transpose, spiral, set zeros, search), and **graph problems on implicit grids** (knight's shortest path, word search, snake-and-ladders). Reach for **2-D prefix sums** when the queries are submatrix aggregates. Reach for **monotonic stacks per row** when looking for "largest rectangle in matrix." Avoid materializing the matrix at all when the cells follow a formula (Pascal's triangle, multiplication table) — generate on demand.`},{heading:"Variants",body:'**Row-major vs column-major** — affects cache performance, not correctness. In Python NumPy, `np.ascontiguousarray` and `np.asfortranarray` switch between them.\n\n**Jagged / ragged matrix** — rows of different lengths; common in problems like "Pascal\'s triangle" or "irregular grids." Indexing assumptions break — check `len(M[i])` per row.\n\n**Sparse matrix** — almost all cells are zero. Store as a hash map `(r, c) -> value` or as a list of `(r, c, v)` triples (COO format). Saves memory when density is below ~5%.\n\n**4-connectivity vs 8-connectivity** — directions array decides whether diagonal neighbors count. Number of islands uses 4; surrounded regions usually 4; flood fill in image editors uses 4 or 8 by design choice.\n\n**Implicit grid** — never store the matrix; generate neighbors on demand. Standard for game-state search.\n\n**Toroidal grid** — wraps at edges (game of life on a torus); use `(r + dr + m) % m` instead of bounds checks.\n\n**Transposed view** — many algorithms get easier if you transpose first (e.g., "rotate 90° = transpose + reverse rows").\n\n**Diagonal traversal** — cells where `i + j == const` form an anti-diagonal; `i - j == const` forms a main diagonal. Useful for spiral, zig-zag, and N-queens conflict checks.'},{heading:"Common interview problems",body:["Rotate Image (LeetCode 48) — transpose + reverse rows, in place.","Set Matrix Zeroes (LeetCode 73) — use row 0 and column 0 as markers, `O(1)` extra space.","Search a 2D Matrix II (LeetCode 240) — staircase walk from top-right, `O(m + n)`.","Spiral Matrix (LeetCode 54) — four shrinking boundaries.","Number of Islands (LeetCode 200) — DFS / BFS / Union-Find on the grid.","Word Search (LeetCode 79) — DFS with backtracking, mark-as-visited via sentinel character.","Longest Increasing Path in a Matrix (LeetCode 329) — DFS + memoization on `(r, c)`.","Pacific Atlantic Water Flow (LeetCode 417) — reverse BFS from each ocean's borders."]}],complexity:{build:"`O(m·n)` to allocate and fill an `m × n` matrix",operation:"Read / write a cell `O(1)`; traverse all cells `O(m·n)`; search a sorted matrix `O(m + n)` via staircase",time:"BFS / DFS on a grid `O(m·n)`; 2-D DP `O(m·n)`; matrix multiplication `O(n^3)` naive, `O(n^{2.81})` Strassen",space:"`O(m·n)` to store the matrix; `O(m + n)` for the BFS frontier or DP row-by-row; `O(1)` for in-place transforms"},pitfalls:["**Off-the-grid indexing.** Recursing into `(-1, j)` or `(m, j)` crashes with an index error. **Fix:** guard `0 <= r < m && 0 <= c < n` at the top of every recursive call; never rely on the caller to have done it.","**Mutating cells used as input to later decisions.** Marking a visited cell to `0` and then computing a neighbor's contribution from that `0` returns wrong answers. **Fix:** either clone the matrix, mark with a sentinel value that the algorithm distinguishes, or restore the cell on the way out of the recursion.",'**Confusing `M[row][col]` with Cartesian `(x, y)`.** Plot a "pixel at (3, 5)" as `M[3][5]` instead of `M[5][3]` and the image is transposed. **Fix:** pick one convention at the top of the function and write a one-line comment; in graphics problems, prefer naming variables `y` and `x` so the order is obvious.',"**Walking column-major on a row-major language.** A column-first scan on a 10000×10000 `int` matrix is 50x slower than row-first due to cache misses. **Fix:** when scanning all cells, always go `for i in rows: for j in cols` (the natural order for row-major) unless the problem demands otherwise.","**Treating a jagged matrix as rectangular.** Assuming `len(M[0])` works for every row crashes on irregular input. **Fix:** check `len(M[i])` per row, or convert to rectangular form by padding with sentinels before processing."]}}]},{id:"easy-array",label:"Easy Array",items:[{kind:"problem",label:"Is Sorted"},{kind:"problem",label:"Multiply with Adjacent"},{kind:"problem",label:"Reverse"},{kind:"problem",label:"Reverse in Groups"},{kind:"problem",label:"Rotate"},{kind:"problem",label:"Generate All Subarrays"},{kind:"problem",label:"Arrange by Sign"},{kind:"problem",label:"Stock with 1 Transaction"},{kind:"problem",label:"Stock with Multiple Transactions"},{kind:"problem",label:"Leaders"}]},{id:"easy-string",label:"Easy String",items:[{kind:"problem",label:"Same Strings"},{kind:"problem",label:"Palindrome"},{kind:"problem",label:"Toggle Case"},{kind:"problem",label:"Remove Occurrences"},{kind:"problem",label:"Remove Spaces"},{kind:"problem",label:"Check Subsequence"},{kind:"problem",label:"First Non-Repeating"},{kind:"problem",label:"Pangram"}]},{id:"medium-array",label:"Medium Array",items:[{kind:"problem",label:"Majority Element"},{kind:"problem",label:"Majority Element II"},{kind:"problem",label:"Sorted subsequence of 3"},{kind:"problem",label:"Count Strictly Increasing Subarrays"},{kind:"problem",label:"Next Permutation"},{kind:"problem",label:"Kadane's Algorithm"},{kind:"problem",label:"Sum of all subarrays"},{kind:"problem",label:"Max Product Subarray"}]},{id:"medium-string",label:"Medium String",items:[{kind:"problem",label:"Implement atoi"},{kind:"problem",label:"URLify"},{kind:"problem",label:"Multiply Large Numbers"}]},{id:"2d-array",label:"2D Array",items:[{kind:"problem",label:"Diagonal Traversal"},{kind:"problem",label:"Magic Square"},{kind:"problem",label:"Boundary Traversal"},{kind:"problem",label:"Matrix Spiral"},{kind:"problem",label:"Toeplitz Matrix"},{kind:"problem",label:"Matrix Zig-Zag"},{kind:"problem",label:"Transpose of Matrix"},{kind:"problem",label:"Rotate a matrix by 90"},{kind:"problem",label:"Conway's Game Of Life"},{kind:"problem",label:"Queries in a Matrix"},{kind:"problem",label:"Set Matrix 0"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Max Circular Subarray Sum"},{kind:"problem",label:"Next Smallest Palindrome"},{kind:"problem",label:"Lexicographic Rank"},{kind:"problem",label:"Text Justification"}]}]},{slug:"searching",title:"Searching",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Searching",body:{summary:"Searching is the problem of locating an element (or proving its absence) inside a collection. Every interview-relevant search algorithm collapses to one of three families: **linear scan** when nothing is sorted, **binary search** when the data — or the answer space — is monotonic, and **hash-map lookup** when you can afford O(n) preprocessing for O(1) point queries afterward.",sections:[{heading:"The mental model",body:`Search reduces to one question: *what structure can you exploit?* No structure → you must inspect every element (linear, \`O(n)\`). Sorted structure → halve the candidate range each step (binary, \`O(log n)\`). Hash structure → jump directly to the bucket (\`O(1)\` average).

\`\`\`ascii
  linear:    [ 5 , 2 , 8 , 1 , 9 , 4 , 7 , 3 ]
              ^----------------->            inspect each cell

  binary:    [ 1 , 2 , 3 , 4 , 5 , 7 , 8 , 9 ]   sorted!
              L         M             R
                                                halve each step

  hash:      h("kai") = 6 ----> bucket[6] -> ("kai", 42)
                                                jump direct
\`\`\`

> Note: The choice is **never** "which is fastest" — it is "which preconditions does the input satisfy and which preprocessing budget do I have?"`},{heading:"Canonical operation — first occurrence via lower_bound",body:`When the target may repeat, you almost never want plain "is it present?" You want the **first** (or **last**) index. Lower-bound binary search is the universal building block.

\`\`\`py
def lower_bound(a, target):
    L, R = 0, len(a)            # half-open [L, R)
    while L < R:
        M = L + (R - L) // 2    # overflow-safe midpoint
        if a[M] < target:
            L = M + 1           # too small; discard left half + M
        else:
            R = M               # candidate; keep, shrink right
    return L                    # smallest index with a[i] >= target
\`\`\`

Lower-bound + upper-bound together give the full equal-range in \`O(log n)\`. Count of \`target\` = \`upper_bound - lower_bound\`. First/last occurrence problems collapse to these two calls.

> Tip: Pick **one** range convention (half-open \`[L, R)\` is cleanest) and never mix it with the inclusive form in the same function. Half the binary-search bugs in interviews come from oscillating between the two.`},{heading:"Binary search on the answer",body:`A huge family of *"minimize X such that ..."* problems are solved not by searching the data, but by **searching the answer space**. Define a predicate \`feasible(mid)\` that is monotonic — false then true (or true then false) — as \`mid\` grows. Binary search the smallest feasible \`mid\`.

The template for every "Koko / Aggressive Cows / Ship Packages / Split Array Largest Sum" problem is identical:

\`\`\`py
def min_feasible(lo, hi, feasible):
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if feasible(mid): hi = mid
        else:             lo = mid + 1
    return lo
\`\`\`

> Tip: Before writing a line of code, **prove** monotonicity. If a larger budget could possibly fail where a smaller one succeeds, binary-search-on-answer silently returns the wrong number.`},{heading:"When to reach for which family",body:"Unsorted, one-shot lookup → **linear**. Sorted, repeated lookups → **binary**. Many queries against a static set → **hash set / map**. Need ordered queries (range, predecessor, kth) → **balanced BST** or **sorted array + binary search**. Stream of inserts + extreme queries → **heap**. Stream of inserts + arbitrary deletions + ordered queries → **TreeSet** / `std::set`."},{heading:"Variants",body:'**Exponential search** doubles a probe until it overshoots, then binary-searches the bracket. Used for unbounded / infinite streams where `n` is unknown.\n\n**Ternary search** finds the extremum of a **unimodal** function in `O(log n)` by maintaining two split points instead of one. Different precondition than binary search — strictly unimodal, not monotonic.\n\n**Interpolation search** estimates the position from the value distribution; `O(log log n)` on uniformly distributed sorted data, `O(n)` worst case.\n\n**Galloping search** (used inside Timsort merges) advances by powers of two then binary-searches — fast when matches are clustered.\n\n**Fractional cascading** speeds up "binary-search the same target in many sorted arrays" from `O(k log n)` to `O(k + log n)`.'},{heading:"Common interview problems",body:["First / last occurrence of a target — lower_bound / upper_bound twin.",'Search in rotated sorted array — pivot-aware binary search with the standard "which half is sorted?" branch.',"Find peak element, find minimum in rotated sorted array.","Median of two sorted arrays — binary search on the partition, `O(log min(m,n))`.","Koko Eating Bananas, Aggressive Cows, Capacity to Ship Packages — binary search on the answer."]}],complexity:{best:"Linear `O(1)` if the target sits at the head; binary `O(1)` if it sits at the midpoint",average:"Linear `O(n)`; binary `O(log n)`; hash `O(1)` per lookup after `O(n)` build",worst:"Linear `O(n)`; binary `O(log n)`; hash `O(n)` on pathological collisions",space:"Linear / binary `O(1)`; hash `O(n)` for the table"},pitfalls:["Midpoint overflow on 32-bit integers — use `l + (r - l) / 2`, never `(l + r) / 2` (fix: also true in C++ / Java; Python ints can not overflow but the habit avoids portability bugs).","Off-by-one between `[L, R]` inclusive and `[L, R)` exclusive — pick one convention and never mix; mixing causes infinite loops or skipped indices (fix: pick half-open for new code).","Applying binary search to a non-monotonic predicate — silently returns wrong results without any runtime error (fix: prove or sketch monotonicity before writing the loop).","Forgetting that hash-set lookup needs the key type to override `hashCode` / `__hash__` consistently with `equals` / `__eq__` — equal objects must hash equal, or lookups will miss inserted keys."]}}]},{id:"linear-search",label:"Linear Search",items:[{kind:"problem",label:"Largest"},{kind:"problem",label:"Second Largest"},{kind:"problem",label:"Local Min & Max"}]},{id:"binary-search",label:"Binary Search",items:[{kind:"theory",label:"Binary Search",conceptSlug:"binary-search",body:{summary:"Halve the candidate range on every comparison against a sorted array — or against any predicate that is **monotonic** in the index or value. **`O(log n)`** by construction, **`O(1)`** extra space. The hard part is never the asymptotic — it is keeping the loop invariant honest.",sections:[{heading:"The mental model",body:`A binary search maintains a single invariant: **the answer lies inside \`[L, R)\`** at every moment. Each iteration probes the midpoint and shrinks the window by at least half. After \`ceil(log2(n))\` iterations the window has shrunk to a single index — which, by the invariant, is the answer.

\`\`\`ascii
 target = 7,  sorted array

   index:  0   1   2   3   4   5   6   7
   value: [1 , 3 , 4 , 5 , 7 , 9 ,11 ,13]
           L                M           R    answer in [L,R), mid=3
                            5 < 7 -> L = M+1

           |               L   M       R    answer in [L,R), mid=5
                               9 > 7 -> R = M

           |               L   R           answer in [L,R), mid=4
                                            7 == 7  -> found!
\`\`\`

> Note: The invariant must hold both **before** the loop starts and **after** every iteration. If your update rule can leave the answer outside \`[L, R)\`, the algorithm is wrong even if it sometimes returns the right value.`},{heading:"Canonical operation — lower_bound on a sorted array",body:'Return the smallest index `i` with `a[i] >= target`. Every other binary search (first occurrence, count, insertion point, search in rotated, etc.) is a variation on this template.\n\n```py\ndef lower_bound(a, target):\n    L, R = 0, len(a)            # half-open window [L, R)\n    while L < R:\n        M = L + (R - L) // 2    # overflow-safe midpoint\n        if a[M] < target:\n            L = M + 1           # discard [L..M] — all too small\n        else:\n            R = M               # keep M as a candidate, drop (M, R)\n    return L                    # smallest i with a[i] >= target\n```\n\nWhy `L = M + 1` but `R = M`? Because the window is half-open: `R` is **exclusive**. Setting `R = M` says "`M` is the new boundary; the answer is in `[L, M)`." Setting `L = M + 1` says "`M` is *not* a candidate; the answer is in `[M+1, R)`." Mix the two and you either loop forever (window never shrinks) or skip the answer.\n\n> Tip: When in doubt, run the loop mentally on `n = 0`, `n = 1`, and a duplicate-only input. If those three terminate with the right answer, the loop is almost certainly correct.'},{heading:"Binary search on the answer",body:'A massive family of "**minimize X such that ...**" problems are solved not by binary-searching the data but by binary-searching the *answer space*. Define a predicate `feasible(X)` that is monotonic — false-then-true as `X` grows. Binary search for the smallest feasible `X`.\n\n```py\ndef min_feasible(lo, hi, feasible):\n    while lo < hi:\n        mid = lo + (hi - lo) // 2\n        if feasible(mid): hi = mid\n        else:             lo = mid + 1\n    return lo\n```\n\nKoko Eating Bananas, Capacity to Ship Packages, Aggressive Cows, Minimum Speed to Arrive on Time, Split Array Largest Sum — all the same template with different `feasible`. The art is **choosing the predicate** and **proving monotonicity**.\n\n> Tip: Before writing code, write the sentence "as X grows, `feasible(X)` goes from ___ to ___ and never back." If you cannot fill the blanks, binary-search-on-answer does not apply.'},{heading:"When to reach for it",body:"The data is sorted (or can be sorted once and queried many times). The predicate is **monotonic** in the search variable. You need an answer in `O(log n)` and not in `O(n)`. The answer space is large but the feasibility test is cheap — turning an `O(answer × n)` brute force into `O(n log answer)`.\n\nDo **not** use binary search on unsorted data, on non-monotonic predicates, or when a single hash-map lookup would do (membership queries on a static set). For floating-point answers (square root with precision) use a bounded-iteration loop (`for _ in range(100)`) instead of `lo < hi`; floats never converge to exact equality."},{heading:"Variants",body:"**lower_bound / upper_bound**: first index ≥ target / first index > target. Together they give the equal-range in `O(log n)`.\n\n**Search in rotated sorted array**: at each midpoint, one half is sorted. Decide which half by comparing `a[L]` vs `a[M]`, then test whether the target falls inside that sorted half.\n\n**Find peak element**: compare `a[M]` with `a[M+1]`; the peak lies on the increasing side. `O(log n)` without requiring full sortedness.\n\n**Binary search on monotonic functions** (square root, integer division): treat the value range as the search space.\n\n**Exponential / galloping search**: double a probe until it overshoots, then binary search — `O(log p)` where `p` is the answer position. Used for unbounded streams.\n\n**Median of two sorted arrays**: binary search on the partition, not the values. `O(log min(m, n))` and a textbook hard problem."},{heading:"Common interview problems",body:["First / last occurrence of target — `lower_bound` and `upper_bound` twin.","Search in rotated sorted array (I and II with duplicates).","Find minimum in rotated sorted array; find peak element.","Median of two sorted arrays — binary search on partition.","Square root with precision; `n`-th root of a real number.","Koko Eating Bananas, Capacity to Ship Packages, Aggressive Cows — binary search on the answer."]}],complexity:{best:"`O(1)` — target sits at the very first midpoint",average:"`O(log n)` comparisons; binary-search-on-answer is `O(log(range) × feasible-cost)`",worst:"`O(log n)`; on floating-point answers, a fixed iteration count (~100) is standard",space:"`O(1)` — only two integer indices regardless of input size"},pitfalls:["Midpoint overflow: `(l + r) / 2` overflows int when `l + r` exceeds `INT_MAX`. Use `l + (r - l) / 2` always (the famous Joshua Bloch bug in `java.util.Arrays.binarySearch`, fixed only in 2006).","Infinite loop when `mid == l` and the update rule sets `l = mid` instead of `l = mid + 1` — the window stops shrinking. Pair `r = mid` with `l = mid + 1`, or `l = mid` with `r = mid - 1`. Never mix.","Mixing inclusive `[L, R]` and exclusive `[L, R)` boundaries in the same function — pick one convention.","Applying binary search to a non-monotonic predicate — runs silently and returns a wrong index. Always prove the monotonicity precondition before reaching for the technique."]}},{kind:"problem",label:"Insertion Position"},{kind:"problem",label:"Lower Bound"},{kind:"problem",label:"Upper Bound"},{kind:"problem",label:"Single Element"},{kind:"problem",label:"Missing Natural"},{kind:"problem",label:"Count Occurrences"},{kind:"problem",label:"2D Search"},{kind:"problem",label:"Sorted & Rotated"},{kind:"problem",label:"Sorted & Rotated II"},{kind:"problem",label:"K Closest"},{kind:"problem",label:"Search in Almost Sorted"},{kind:"problem",label:"Peak"},{kind:"problem",label:"Peak in 2D"},{kind:"problem",label:"Range based Counts"},{kind:"problem",label:"Kth Missing"},{kind:"problem",label:"Search in Row-Column Sorted"}]},{id:"search-on-answer",label:"Search on answer",items:[{kind:"problem",label:"Square Root"},{kind:"problem",label:"Nth Root"},{kind:"problem",label:"Check Power"},{kind:"problem",label:"Pick K"},{kind:"problem",label:"N trailing zeroes"},{kind:"problem",label:"Book Allocation"},{kind:"problem",label:"Koko Eating Banana"},{kind:"problem",label:"Aggressive Cows"},{kind:"problem",label:"Median in a Row Sorted"},{kind:"problem",label:"Kth Smallest in Row and Column Sorted"},{kind:"problem",label:"M bouquets"},{kind:"problem",label:"kth in Multiplication Table"},{kind:"problem",label:"Maximize Median"},{kind:"problem",label:"Min Time for Orders"},{kind:"problem",label:"Equalize Towers"}]},{id:"search-on-two",label:"Search on Two",items:[{kind:"problem",label:"Median of two sorted"},{kind:"problem",label:"Kth of two sorted"}]}]},{slug:"sorting",title:"Sorting",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Sorting",body:{summary:"Sorting rearranges a sequence into non-decreasing order under a **comparator** (or **key function**). Comparison-based sorts are bounded below by **`O(n log n)`** by an information-theoretic argument; non-comparison sorts (counting, radix, bucket) escape that bound to **`O(n)`** by exploiting the value domain.",sections:[{heading:"The mental model",body:`Sorting algorithms split into two universes by the question "**do you compare values, or do you index by value?**"

\`\`\`ascii
  Comparison-based                Non-comparison
  -------------------             -----------------------
  reads a < b only                reads numeric value of a

  lower bound O(n log n)          O(n + k) given small range k

  works on any total order        only on numeric / bounded keys
  (strings, tuples, custom)

  insertion / selection / bubble  counting sort
  merge / quick / heap            radix sort
  Timsort / introsort             bucket sort
\`\`\`

> Note: The lower bound \`Ω(n log n)\` for comparison sorts is a **theorem**, not a missing optimization. A comparison sort that beat it would prove \`P ≠ ?\` levels of impossible. Counting sort "beats" it by not being a comparison sort — it indexes by value, which requires bounded keys.`},{heading:"Canonical operation — merge step of merge sort",body:`The merge step is the engine of merge sort, Timsort, and external sort. Two cursors walk two sorted runs and emit the smaller head each iteration.

\`\`\`py
def merge(left, right):
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:           # <= (not <) preserves stability
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out
\`\`\`

> Tip: The \`<=\` (not \`<\`) inside the comparison is what makes merge sort **stable**. Flip it to \`<\` and equal elements may swap order. Tiny syntactic detail, load-bearing semantic.`},{heading:"The four sorts you must know cold",body:["**Quicksort** — average `O(n log n)`, worst `O(n^2)` on adversarial pivot, **in-place**, **not stable**. Cache-friendly, fastest in practice on random data. Backbone of C++ `std::sort` (intro-sort = quicksort with heapsort fallback) and Java `Arrays.sort` for primitives.",'**Merge sort** — guaranteed `O(n log n)`, **stable**, `O(n)` extra space. Backbone of **Timsort** (Python `sorted`, Java `Arrays.sort` for objects) and every "sort a linked list" answer.',"**Heap sort** — `O(n log n)` worst case, **in-place**, **not stable**. Rarely fastest in practice; chosen when `O(1)` extra space and hard worst-case guarantees both matter (embedded / safety-critical code, introsort fallback).",'**Counting / Radix / Bucket** — `O(n + k)` when the value range `k` is small. Counting sort directly counts each key; radix sort applies counting sort digit-by-digit. Use for "sort integers in `[0, 10^5]`" or bucket-style problems.']},{heading:"When to reach for sorting",body:'If the problem says **"find pairs / triplets,"** **"merge intervals,"** **"k-th largest,"** **"anagrams,"** **"median,"** or **"schedule"**, sorting is either the solution or the prep step. Sorting enables two-pointer scans on otherwise-unstructured arrays (3-sum, container with most water). It enables greedy on intervals (activity selection, meeting rooms). And it is the necessary first step before binary search on a list of queries.\n\nDo **not** reach for sorting when you only need the **k-th** element — quickselect / heap is `O(n)` / `O(n log k)` and avoids the full sort. Do not sort if you only need an order-insensitive aggregate (sum, min, max, count). And reach for **radix / counting** sort instead of comparison sort when keys are bounded — `O(n + k)` crushes `O(n log n)` for `k = O(n)`.'},{heading:"Variants",body:"**Timsort** (Python `sorted`, Java `Arrays.sort` for objects, Android, Swift): adaptive merge sort that detects already-sorted runs (`O(n)` on nearly-sorted input). Stable, `O(n log n)` worst case.\n\n**Introsort** (C++ `std::sort`): quicksort that monitors recursion depth; switches to heapsort when depth exceeds `2 log n`, guaranteeing `O(n log n)` worst case while keeping quicksort's average-case speed.\n\n**Pdqsort** (Rust `sort_unstable`, C++ `std::ranges::sort` in libc++): pattern-defeating quicksort — detects bad pivots, switches to insertion sort on small / nearly-sorted blocks.\n\n**Counting sort**: index by value, count occurrences, emit in order. `O(n + k)`, stable if you reconstruct via prefix sums.\n\n**Radix sort**: counting sort digit-by-digit from least-significant to most. `O(n × d)` where `d` is digit count.\n\n**External sort**: when data does not fit in memory, sort chunks in RAM then k-way merge from disk.\n\n**Topological sort**: not a comparison sort — orders a DAG's vertices, see the Graph chapter."},{heading:"Common interview problems",body:["Sort colors (Dutch National Flag) — three-way partition in one pass.","Merge intervals, meeting rooms II — sort by start, sweep.","Largest number — custom comparator on string concatenation.","Sort a (nearly) k-sorted array — min-heap of size `k+1` in `O(n log k)`.","Sort by frequency — counting sort or hash-map + sort.","Merge two sorted arrays in-place — backward merge to avoid extra space."]}],complexity:{best:"`O(n)` for adaptive sorts (Timsort, insertion) on already-sorted input",average:"`O(n log n)` comparison sorts; `O(n + k)` counting / radix",worst:"`O(n log n)` for merge / heap / introsort; `O(n^2)` for naive quicksort on adversarial input",space:"`O(1)` heap / in-place quick; `O(n)` merge / Timsort; `O(n + k)` counting"},pitfalls:["Quicksort on already-sorted input with naive (first-element) pivot — degrades to `O(n^2)`. Fix: randomize the pivot or use median-of-three.","Forgetting **stability** when sorting by composite keys via successive sorts — the second sort must be stable or the first key's order is lost.","Using a comparator that does not define a strict weak ordering (`a < b` and `b < a` both true, or `a < b < c < a`) — leads to undefined behavior in `std::sort` and `IllegalArgumentException` in Java.","Picking radix / counting sort when the key range `k` is huge — `O(n + k)` with `k = 10^9` is worse than `O(n log n)`. Counting sort wins only when `k = O(n)`."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"Wave Form"},{kind:"problem",label:"Sort by Length"},{kind:"problem",label:"Min Diff Pair"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Merge Overlapping"},{kind:"problem",label:"Form Largest"},{kind:"problem",label:"Tywin's War Strategy"},{kind:"problem",label:"Candy Cost"},{kind:"problem",label:"Meeting Rooms"},{kind:"problem",label:"Insert Merge Intervals"},{kind:"problem",label:"Minimize Moves"},{kind:"problem",label:"Max sum of i*arr[i]"}]},{id:"quick-sort",label:"Partition & Quick Sort",items:[{kind:"problem",label:"Quick Sort"},{kind:"problem",label:"Sort Binary"},{kind:"problem",label:"Zeroes to End"},{kind:"problem",label:"Sort Ternary"}]},{id:"merge-sort",label:"Merge & Merge Sort",items:[{kind:"problem",label:"Merge Sort"},{kind:"problem",label:"Union of 2 Sorted"},{kind:"problem",label:"Intersection of 2 Sorted"},{kind:"problem",label:"Merge Without Extra Space"},{kind:"problem",label:"Minimum Platforms"},{kind:"problem",label:"Inversion count"},{kind:"problem",label:"Surpasser Count"}]},{id:"cycle-sort",label:"Cycle Sort",items:[{kind:"problem",label:"Cycle Sort"},{kind:"problem",label:"Minimum Missing Positive"},{kind:"problem",label:"Min Swaps to Sort"}]}]},{slug:"bit-manipulation",title:"Bit Manipulation",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Bitwise",body:{summary:"Bit manipulation treats an integer as a **fixed-width array of bits** and uses **AND / OR / XOR / NOT / shifts** to read, set, clear, or transform individual bits in `O(1)` per op. Mastering the seven canonical moves collapses whole problem families — subset enumeration, single-number detection, power-of-two checks, compact state in DP — into a handful of one-liners. The catch: precedence, sign extension, and overflow rules differ across languages, so the same bit trick can compile to subtly different machine code in Python vs Java vs C++.",sections:[{heading:"Mental model",body:`Treat any integer as a row of bits, indexed from the right (\`bit 0\` = least significant). Every operation is bitwise — the operator applies to each column independently with no carry.

\`\`\`ascii
 x = 22 (decimal)  =  0 0 0 1 0 1 1 0   <- bit 7 ... bit 0
 y = 13 (decimal)  =  0 0 0 0 1 1 0 1

 x & y             =  0 0 0 0 0 1 0 0   = 4    (1 only where both are 1)
 x | y             =  0 0 0 1 1 1 1 1   = 31   (1 where either is 1)
 x ^ y             =  0 0 0 1 1 0 1 1   = 27   (1 where exactly one is 1)
 ~x (8-bit)        =  1 1 1 0 1 0 0 1   = 233  (flip every bit)
 x << 2            =  0 1 0 1 1 0 0 0   = 88   (shift left, multiply by 4)
 x >> 1            =  0 0 0 0 1 0 1 1   = 11   (shift right, divide by 2)
\`\`\`

The **seven moves you reuse forever**:

\`\`\`text
 check bit i:        (x >> i) & 1
 set bit i:          x | (1 << i)
 clear bit i:        x & ~(1 << i)
 toggle bit i:       x ^ (1 << i)
 lowest set bit:     x & -x              (Fenwick tree / Brian Kernighan)
 strip lowest set:   x & (x - 1)         (count set bits in O(popcount))
 XOR cancellation:   x ^ x == 0,  x ^ 0 == x
\`\`\`

> Note: \`x & -x\` works because of two's-complement: \`-x == ~x + 1\`, so the bits below the lowest set bit are all 1 in \`-x\` and clear in \`x\`; AND keeps only the lowest set bit.`},{heading:"Canonical operation",body:`Three bit-tricks every interviewer expects you to know cold.

\`\`\`py
# 1. Single number: every element appears twice except one. O(n), O(1) extra.
def single(a):
    x = 0
    for v in a: x ^= v        # XOR cancels pairs; survivor is the unique value
    return x

# 2. Brian Kernighan popcount: count set bits in O(popcount), not O(log V)
def popcount(x):
    c = 0
    while x:
        x &= x - 1            # strip the lowest set bit
        c += 1
    return c

# 3. Subset enumeration: iterate every subset of {0..n-1}
def all_subsets(elements):
    n = len(elements)
    for mask in range(1 << n):
        yield [elements[i] for i in range(n) if mask & (1 << i)]
\`\`\`

\`\`\`cpp
// Bitmask DP — TSP: shortest path visiting every city.  O(n^2 * 2^n).
int tsp(vector<vector<int>>& d) {
    int n = d.size();
    vector<vector<int>> dp(1 << n, vector<int>(n, INT_MAX));
    dp[1][0] = 0;                                       // start at city 0
    for (int mask = 1; mask < (1 << n); ++mask) {
        for (int u = 0; u < n; ++u) {
            if (!(mask & (1 << u)) || dp[mask][u] == INT_MAX) continue;
            for (int v = 0; v < n; ++v) {
                if (mask & (1 << v)) continue;          // already visited
                int nm = mask | (1 << v);
                dp[nm][v] = min(dp[nm][v], dp[mask][u] + d[u][v]);
            }
        }
    }
    int ans = INT_MAX;
    for (int u = 1; u < n; ++u) ans = min(ans, dp[(1 << n) - 1][u] + d[u][0]);
    return ans;
}
\`\`\`

> Tip: \`__builtin_popcount(x)\` (GCC / Clang) and \`Integer.bitCount(x)\` (Java) compile to a single CPU instruction on modern hardware. Use them instead of hand-rolled loops.`},{heading:"When to reach for it",body:'Reach for bit manipulation when the problem screams **subset of up to ~20 elements** (bitmask DP for TSP, "shortest superstring," partition-to-K-subsets), or when the problem has **XOR\'s pairing property** (single number I/II/III, find two single numbers, sum of all subset XORs). Reach for it on **power-of-two checks** (`x > 0 && (x & (x - 1)) == 0`), **lowest-bit operations** (Fenwick tree updates use `i += i & -i`), and **compact state** (chess piece positions on an 8×8 board in a single `uint64`). Reach for **XOR with prefix** when the problem is "subarray XOR equal to K" or "max XOR subarray" (prefix-XOR + bit trie). Avoid bit tricks when readability matters more than the constant factor — clarity beats cleverness everywhere except hot inner loops.'},{heading:"Variants",body:'**XOR tricks** — single number (one pass XOR everything), find two unique numbers in a duplicate sea (split by any differing bit), missing number in `[0, n]` (XOR all + XOR `0..n`), swap without temp (`a ^= b; b ^= a; a ^= b`).\n\n**Brian Kernighan popcount** — `x &= x - 1` strips the lowest set bit; loop counts in `O(popcount)`. Beats naive `O(log V)` on sparse numbers.\n\n**Bitmask DP** — state is a subset of `{0..n-1}` encoded in a single int. `O(n · 2^n)` for "shortest superstring," `O(n^2 · 2^n)` for TSP. Works up to `n ≈ 20`.\n\n**Submask enumeration** — iterate every submask `s` of `mask`: `for (int s = mask; s; s = (s - 1) & mask)`. Used in SOS DP and partition-into-subsets DP. Total work over all masks is `O(3^n)`, not `O(4^n)`.\n\n**Sum Over Subsets (SOS) DP** — for every subset, compute the aggregate over all its subsets in `O(n · 2^n)`. Powers OR-convolution and "number of subsets whose OR equals `X`."\n\n**Bit trie / XOR trie** — fixed-depth trie of binary representations. Powers max XOR pair and persistent XOR queries.\n\n**Bitset compression** — pack a boolean array into `uint64` words; standard `std::bitset` or hand-rolled gives 64x speedup in inner loops.'},{heading:"Common interview problems",body:["Single Number I / II / III (LeetCode 136, 137, 260) — XOR cancellation variants.","Number of 1 Bits / Hamming Weight (LeetCode 191) — Brian Kernighan.","Counting Bits (LeetCode 338) — DP `bits[i] = bits[i >> 1] + (i & 1)`.","Power of Two / Three / Four (LeetCode 231, 326, 342) — `x & (x - 1) == 0` for power of 2.","Reverse Bits (LeetCode 190) — divide-and-conquer bit reversal.","Subsets (LeetCode 78) — iterate `mask` from 0 to `2^n`.","Maximum XOR of Two Numbers in an Array (LeetCode 421) — bit trie of depth 32.","Bitwise AND of Numbers Range (LeetCode 201) — common prefix of `m` and `n` shifted back."]}],complexity:{best:"Constant `O(1)` per bit op on word-size integers",average:'`O(log V)` for whole-number operations like popcount, leading-zero count, or "walk every bit"',worst:"`O(popcount)` for Brian Kernighan; `O(2^n)` for full subset enumeration; `O(3^n)` for sum-over-submasks",space:"`O(1)` extra for most tricks; `O(2^n)` for bitmask DP state tables"},pitfalls:["**Mixing signed and unsigned right-shifts.** Right-shift on negative numbers is implementation-defined in older C / C++ and **arithmetic** in Java / JS (sign bit propagates). **Fix:** use `>>>` for logical shift in Java / JS; cast to `unsigned` in C++; in Python negative shifts work as if numbers had infinite bits, watch out when porting.","**`1 << 31` overflows signed 32-bit int.** Quietly produces `INT_MIN` or undefined behavior. **Fix:** use `1L << 31` (Java / C++) or `1u << 31` (C++) when you need bit 31 of a 32-bit word; `1 << 63` needs `1LL`.","**Operator precedence: `a & b == c` parses as `a & (b == c)`.** `==` binds tighter than `&` / `|` / `^` in every C-family language. **Fix:** always parenthesize bitwise expressions used in conditions: `(a & b) == c`.","**Forgetting that `x & -x` requires two's-complement semantics.** Python integers don't have a fixed width, so `-x` differs from C; the trick still works but for a different reason. **Fix:** when porting, test on `x = 0` (where `-x == x` and the result is `0`) and on the minimum negative value.","**Using bitmask DP for `n > 22`.** `2^25 = 33M` states already pushes memory; `2^30` is impossible. **Fix:** if `n` is larger, the problem isn't bitmask DP — look for meet-in-the-middle, polynomial DP, or a structural reduction."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"Swap without Third"},{kind:"problem",label:"Kth Set Bit"},{kind:"problem",label:"Only set bit"},{kind:"problem",label:"Power of two"},{kind:"problem",label:"Sort by Set bits"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Power of 4"},{kind:"problem",label:"Binary is palindrome"},{kind:"problem",label:"Rotate Bits"},{kind:"problem",label:"Swap Odd Even"},{kind:"problem",label:"Count Set"},{kind:"problem",label:"Count Total Set"},{kind:"problem",label:"Iterative Power"}]},{id:"bit-arrays",label:"Bit with Arrays",items:[{kind:"problem",label:"Max Consecutive 1s"},{kind:"problem",label:"Missing"},{kind:"problem",label:"One Odd"},{kind:"problem",label:"Two Odds"},{kind:"problem",label:"Palindrome Permutation"},{kind:"problem",label:"Missing & Repeating"},{kind:"problem",label:"Unique Numbers II"},{kind:"problem",label:"n-bit Gray Codes"},{kind:"problem",label:"Hamming Distance"},{kind:"problem",label:"Sum of Pair XORs"},{kind:"problem",label:"Sum of Subset XORs"},{kind:"problem",label:"Subarray XORs"},{kind:"problem",label:"Is Valid Suduko"}]},{id:"subsets",label:"Subsets",items:[{kind:"problem",label:"Subsets"},{kind:"problem",label:"Subsequences"}]}]},{slug:"hashing",title:"Hashing",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Hashing",body:{summary:"A hash function maps a key to a bucket in `O(1)`. A hash table layers collision resolution on top to give amortized `O(1)` insert, lookup, and delete — at the cost of no ordering and worst-case `O(n)` when the hash is adversarial.",sections:[{heading:"Bucket layout",body:`A good hash spreads keys uniformly across buckets and is deterministic for the same input.

\`\`\`ascii
  key  --[ hash() ]-->  index in [0, capacity)

  capacity = 8
  bucket  |  contents
  -------+--------------------
    0    |  -
    1    |  ("ada", 31)
    2    |  ("ben", 12) -> ("zoe", 7)   <- chain on collision
    3    |  -
    4    |  ("mia", 19)
    5    |  -
    6    |  ("kai", 42)
    7    |  -
\`\`\`

> Note: The table maintains a **load-factor invariant** (\`size / capacity ≤ ~0.75\`). Breaching it triggers a rehash that doubles capacity and re-inserts — \`O(n)\` once, amortized \`O(1)\`.`},{heading:"Canonical operation — two-sum via hash map",body:'```py\ndef two_sum(nums, target):\n    seen = {}                           # value -> index\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            return (seen[target - x], i)\n        seen[x] = i\n    return None\n```\n\n> Tip: One pass, `O(n)` time, `O(n)` space. The classic "trade memory for a quadratic factor of speed."'},{heading:"Collision resolution",body:["**Separate chaining**: each bucket holds a linked list / dynamic array. Simple, robust, used in Java `HashMap`.","**Open addressing** (linear / quadratic / double hashing): on collision, probe the next slot. Cache-friendly, used in Python `dict` and modern C++ flat hash maps."]},{heading:"When to reach for it",body:"Membership tests, frequency counts, deduplication, joining two arrays by key, memoization caches. Reach for an **ordered** map (`TreeMap` / `std::map`) only when you need range queries or sorted iteration."},{heading:"Common interview problems",body:["Two Sum, group anagrams, longest consecutive sequence.","Subarray sum equals `K` (prefix-sum + hash map).","LRU / LFU cache — hash map + linked list."]}],complexity:{best:"`O(1)` insert, lookup, delete on average",average:"`O(1)` per op assuming a good hash and load factor below threshold",worst:"`O(n)` per op on adversarial keys that all collide into one bucket",space:"`O(n)` for the entries + `O(capacity)` slack from the load factor"},pitfalls:['Mutating a key after insertion — the bucket no longer matches the recomputed hash; the entry is "lost."',"Defining `hashCode` without `equals` (or vice versa) — breaks the contract; identical-looking objects collide unpredictably.","Counting on iteration order in old Java `HashMap` / `unordered_map` — it is not guaranteed.","Using a mutable type (list, set) as a dict key in Python — raises `TypeError`. Use a tuple or frozenset."]}}]},{id:"basic",label:"Basic Hashing",items:[{kind:"problem",label:"Linear Probing"},{kind:"problem",label:"Separate Chaining"},{kind:"problem",label:"Quadratic Probing"},{kind:"problem",label:"Distinct in Array"},{kind:"problem",label:"Is Subset"},{kind:"problem",label:"Union"},{kind:"problem",label:"Intersection"},{kind:"problem",label:"2 Sum"},{kind:"problem",label:"Fizz Buzz"},{kind:"problem",label:"Pair Sums Divisible by k"},{kind:"problem",label:"Roman to Integer"},{kind:"problem",label:"Isomorphic Strings"}]},{id:"frequency",label:"Hashing for Frequency",items:[{kind:"problem",label:"Count Frequencies"},{kind:"problem",label:"Most Frequent"},{kind:"problem",label:"Max Subsets"},{kind:"problem",label:"Anagrams"}]},{id:"subsequence",label:"Subsequence",items:[{kind:"problem",label:"Longest Consecutive Subsequence"},{kind:"problem",label:"Consecutive Subsequence"}]}]},{slug:"two-pointer",title:"Two-Pointer",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Two-Pointer",conceptSlug:"two-pointers",body:{summary:"Maintain two indices over a (usually sorted or monotonic) sequence and move them based on a problem-specific rule — toward each other, in the same direction, or as window endpoints. Converts an apparent `O(n^2)` pair search into `O(n)`.",sections:[{heading:"The three patterns",body:`Opposing, same-direction, and window — each visualized below.

\`\`\`ascii
 Opposing (sorted):       Same-direction (slow/fast):
  L ->            <- R     S ->     F ->
 [ . . . . . . . . . ]    [ . . . . . . . . . ]
  shrink window inward     S writes, F reads ahead

 Sliding window:
  L ->        R ->
 [ . . . . . . . . . ]
  R expands; L follows when invariant breaks
\`\`\`

> Tip: The rule that moves a pointer must be a function of the **current comparison**, not the loop index.`},{heading:"Canonical operation — two-sum on a sorted array",body:`Walk inward from both ends. Move the pointer that can fix the imbalance.

\`\`\`py
def two_sum_sorted(a, target):
    L, R = 0, len(a) - 1
    while L < R:
        s = a[L] + a[R]
        if s == target: return (L, R)
        if s < target:  L += 1   # need a bigger sum
        else:           R -= 1   # need a smaller sum
    return None
\`\`\`

> Note: This works **only** because the array is sorted. On unsorted data the technique silently returns wrong answers.`},{heading:"When to reach for it",body:'Sorted input + "find a pair / triple satisfying X." In-place array partitioning. Window-with-property problems. Palindrome checks. The two-pointer technique is what you reach for when the obvious solution is `O(n^2)` and you sense the constraints allow `O(n)`.'},{heading:"Common interview problems",body:["Two Sum II (sorted), three-sum, four-sum.","Container with most water, trapping rain water.","Remove duplicates from sorted array, move zeros.","Sort colors / Dutch National Flag."]}],complexity:{best:"`O(n)` after an `O(n log n)` sort if the input is unsorted",average:"`O(n)` — each pointer advances at most `n` times",worst:"`O(n)` — never worse, by construction",space:"`O(1)` — only two indices"},pitfalls:["Forgetting to skip duplicate values when the problem asks for unique tuples (three-sum).","Moving the wrong pointer — the rule must be a function of the current comparison, not the loop index.","Two-pointer requires monotonic structure (sorted, or a one-way property); applying it to unstructured data silently gives wrong answers.","Mixing the `L < R` and `L <= R` termination conditions — pick one and stick to it."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"2 Sum in Sorted"},{kind:"problem",label:"Smallest Subarray"},{kind:"problem",label:"Unique Elements"},{kind:"problem",label:"Sentence Palindrome"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"3 Sum"},{kind:"problem",label:"Celebrity Problem"},{kind:"problem",label:"Closest Pair from 2"},{kind:"problem",label:"Container with Most Water"},{kind:"problem",label:"Common in 3"},{kind:"problem",label:"Reverse Words"},{kind:"problem",label:"Policemen catch thieves"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"4 Sum"},{kind:"problem",label:"Closest Triplet"},{kind:"problem",label:"Count Triplets"}]}]},{slug:"sliding-window",title:"Sliding Window",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Sliding Window",conceptSlug:"sliding-window",body:{summary:'A contiguous range over an array or string that slides forward, **growing on the right** and **shrinking on the left** to maintain an invariant. Turns an `O(n^2)` "examine every subarray" approach into `O(n)` with two pointers and an incrementally maintained aggregate.',sections:[{heading:"Two endpoints, one direction",body:`\`\`\`ascii
  arr:  [ 2 , 5 , 1 , 3 , 4 , 7 , 1 , 2 ]
               ^               ^
               L               R   <- window = arr[L..R]
             (left)         (right)

  expand R -> grows the window
  shrink L -> shrinks the window
\`\`\`

> Note: Each index enters and leaves the window **at most once** → total work \`O(n)\` no matter how often L and R move.`},{heading:"Canonical operation — longest substring without repeating chars",body:`Expand R unconditionally; while the window violates the invariant, contract L. The \`while\` loop is the heart of the technique.

\`\`\`py
def longest_unique(s):
    last = {}
    L = 0
    best = 0
    for R, ch in enumerate(s):
        if ch in last and last[ch] >= L:
            L = last[ch] + 1        # shrink past the duplicate
        last[ch] = R
        best = max(best, R - L + 1)
    return best
\`\`\`

> Warning: Use \`while\` to shrink, not \`if\`. A single expansion can break the invariant by more than one unit.`},{heading:"Fixed-length vs variable-length",body:"Fixed window of size `K`: precompute the aggregate of the first `K`, then slide one position at a time, adding the new right and subtracting the leaving left in `O(1)` per step. Variable window: expand right unconditionally; while the window violates the invariant, contract left."},{heading:"Common interview problems",body:["Longest substring without repeating characters.","Minimum window substring, permutation in string.","Max sum subarray of size `K`, longest subarray with sum `K`.","Subarrays with `K` distinct integers."]}],complexity:{best:"`O(n)` — both pointers march forward monotonically",average:"`O(n)` regardless of input distribution",worst:"`O(n)` — each index is touched at most twice (entry + exit)",space:"`O(window-state)`, usually `O(alphabet)` or `O(distinct values)`"},pitfalls:["Forgetting to update the aggregate when shrinking — bugs that only show up when the answer is exactly at the boundary.","Using `if` instead of `while` to shrink — fails when one expansion violates the invariant by more than one unit.","Applying sliding window to a problem where the invariant is not monotonic in window length — the technique simply does not apply.","Storing values when the eviction check needs indices (or vice versa)."]}}]},{id:"fixed",label:"Fixed-Length Window",items:[{kind:"problem",label:"Max Sum Subarray of size K"},{kind:"problem",label:"Max XOR of K size"},{kind:"problem",label:"Distinct In Every Window"},{kind:"problem",label:"MEX Of Subarrays"},{kind:"problem",label:"Min Swaps to group all 1's"},{kind:"problem",label:"First negative in every window"},{kind:"problem",label:"Chocolate Distribution"}]},{id:"variable",label:"Variable Length",items:[{kind:"problem",label:"Maximize Ones"},{kind:"problem",label:"Equal substring with cost less than K"},{kind:"problem",label:"Fruit Into Baskets"},{kind:"problem",label:"Subarray with given sum"}]},{id:"min-length",label:"Minimum length",items:[{kind:"problem",label:"Smallest subarray with sum greater than x"},{kind:"problem",label:"Minimum Window Subsequence"},{kind:"problem",label:"Minimum Window Substring"},{kind:"problem",label:"Smallest containing 0, 1 and 2"}]},{id:"count",label:"Count Subarrays",items:[{kind:"problem",label:"Subarrays with k odds"},{kind:"problem",label:"Subarrays Less Than K"},{kind:"problem",label:"Substrings with all vowels"},{kind:"problem",label:"Number of Subarrays having sum less than K"},{kind:"problem",label:"Count Subarrays with K Equal Value Pairs"}]},{id:"hashing-window",label:"Sliding Window with Hashing",items:[{kind:"problem",label:"Longest substring with distinct"},{kind:"problem",label:"Substring character replacement"},{kind:"problem",label:"Longest Substring with K Uniques"},{kind:"problem",label:"Substrings with k distinct"},{kind:"problem",label:"Smallest with all characters"},{kind:"problem",label:"Smallest distinct"},{kind:"problem",label:"Count Anagrams"},{kind:"problem",label:"Full Distinct Subarrays"}]}]},{slug:"prefix-sum",title:"Prefix Sum",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Prefix Sum",body:{summary:'Precompute a running total `P[i] = a[0] + a[1] + ... + a[i-1]` so any range sum `sum(l..r)` collapses to a single subtraction `P[r+1] - P[l]`. `O(n)` preprocessing buys you `O(1)` range queries forever after — and combined with a hash map, prefix sums solve the entire **"subarray with property X"** family by reducing it to a two-sum on prefix values.',sections:[{heading:"Mental model",body:`Think of the prefix array as a column of running totals to the **left** of each index. The sum of any contiguous slice is just **right boundary total minus left boundary total**.

\`\`\`ascii
 array a:    [ 3,  1,  4,  1,  5,  9,  2,  6 ]
 index:        0   1   2   3   4   5   6   7

 prefix P:   [ 0,  3,  4,  8,  9, 14, 23, 25, 31 ]
 index:        0   1   2   3   4   5   6   7   8

 sum(a[2..5])  =  4 + 1 + 5 + 9  =  19
              =  P[6] - P[2]    =  23 - 4   =  19      O(1)
\`\`\`

The **leading zero** at \`P[0]\` is the single most important convention — it removes the need for a special-case branch when \`l == 0\`, so every range query becomes one subtraction regardless of where the range starts.

> Note: Prefix sum is the **discrete integral**. The reverse operation — turning a difference array back into the original — is the discrete derivative. Range updates become point updates on the difference array, the perfect dual.`},{heading:"Canonical operation",body:`Build the prefix array, then answer range-sum queries in \`O(1)\` apiece.

\`\`\`py
def build_prefix(a):
    P = [0] * (len(a) + 1)
    for i, v in enumerate(a):
        P[i + 1] = P[i] + v
    return P

def range_sum(P, l, r):                  # inclusive [l, r]
    return P[r + 1] - P[l]

# 2-D prefix sum — same idea, inclusion-exclusion at four corners
def build_prefix_2d(M):
    r, c = len(M), len(M[0])
    P = [[0]*(c + 1) for _ in range(r + 1)]
    for i in range(r):
        for j in range(c):
            P[i+1][j+1] = M[i][j] + P[i][j+1] + P[i+1][j] - P[i][j]
    return P

def submatrix_sum(P, r1, c1, r2, c2):    # inclusive top-left to bottom-right
    return P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]
\`\`\`

\`\`\`cpp
// Subarray Sum Equals K — prefix + hash map. O(n).
int subarraySum(vector<int>& a, int k) {
    unordered_map<long long, int> seen{{0, 1}};   // empty-prefix seed
    long long s = 0; int cnt = 0;
    for (int x : a) {
        s += x;
        if (seen.count(s - k)) cnt += seen[s - k];
        seen[s]++;
    }
    return cnt;
}
\`\`\`

> Tip: The hash-map prefix trick generalizes beyond sums. Replace \`+\` with \`^\` (XOR), with character count vectors (anagram windows), or with parity tracking — every problem that asks "is there a subarray with property X" probably reduces to "do two prefixes agree on X."`},{heading:"When to reach for it",body:'Reach for prefix sum the moment a problem asks for **range aggregates on a static array** — sum, xor, gcd, count of even numbers, count of `1` bits, anything associative and invertible. Reach for **prefix + hash map** when the question is "count / find subarrays with sum = K," "longest subarray with sum K," "subarrays divisible by K," "subarray with given XOR," or "longest substring with equal 0s and 1s" (encode as +1/-1 then look for prefix-sum repeats). Reach for **2-D prefix sum** for submatrix-sum queries and "maximum k×k square sum." Reach for the **difference array** (the dual) when you have **range updates + point queries**: increment `d[l] += x`, `d[r+1] -= x` for each update, take one prefix scan at the end. If updates AND queries are both range-based, segment tree with lazy propagation beats prefix sum.'},{heading:"Variants",body:'**1-D prefix sum** — the base case; `O(n)` build, `O(1)` query.\n\n**2-D prefix sum** — inclusion-exclusion at four corners; `O(r·c)` build, `O(1)` submatrix query. Powers "maximum k×k square sum," "submatrix equal to target."\n\n**Difference array** — the dual: range update in `O(1)`, then a single prefix scan recovers the final array. Perfect for "apply N range increments, return the final state."\n\n**Prefix XOR** — same identity with XOR instead of sum. Range XOR `= P[r+1] ^ P[l]`. Powers "subarray with given XOR" and "max XOR subarray" (combined with a bit trie).\n\n**Prefix product (with care)** — products instead of sums; watch for zeros and overflow. Used in "product of array except self" via prefix and suffix products.\n\n**Prefix-min / prefix-max** — non-invertible aggregates, so the subtraction trick doesn\'t apply for arbitrary ranges, BUT they\'re still useful for "best price to sell after this day" style problems.\n\n**Mod prefix sum** — store prefix sums modulo `K`; two prefixes with the same residue mark a subarray sum divisible by `K` (count subarrays divisible by K).\n\n**Prefix frequency array** — for problems on characters / small alphabets, store per-character running counts.'},{heading:"Common interview problems",body:["Range Sum Query — Immutable / 2-D Immutable (LeetCode 303, 304) — textbook.","Subarray Sum Equals K (LeetCode 560) — prefix + hash map.","Continuous Subarray Sum (LeetCode 523) — prefix mod K.","Contiguous Array (LeetCode 525) — encode 0 as -1, longest subarray with sum 0 via prefix-first-seen map.","Product of Array Except Self (LeetCode 238) — prefix and suffix products in `O(n)` with `O(1)` extra.","Maximum Size Subarray Sum Equals k (LeetCode 325) — prefix + first-seen index.","Count of Smaller Numbers After Self — Fenwick tree on compressed values (prefix-sum cousin).","Range Addition (LeetCode 370) — difference array, then one prefix scan."]}],complexity:{build:"`O(n)` for 1-D, `O(r·c)` for 2-D — one pass over the input",operation:"`O(1)` per range query after build; `O(n)` to recover the original from a difference array",time:"Subarray-sum-equals-K family: `O(n)` with hash map vs `O(n^2)` brute force",space:"`O(n)` for the prefix array; `O(n)` for the hash map of seen prefix values"},pitfalls:["**Off-by-one between inclusive and exclusive bounds.** Writing `P[r] - P[l]` when `[l, r]` is inclusive gives the wrong answer because you skip `a[r]`. **Fix:** standardize on `P[r+1] - P[l]` with a leading zero in `P`; document the convention at the top of the function.","**Integer overflow on long arrays.** Summing `10^5` values each up to `10^9` exceeds 32-bit int. **Fix:** use `long` in Java / C++ and Python's arbitrary-precision int is fine, but be careful when porting.","**Forgetting to seed the hash map with prefix 0 → count 1.** Without it, you miss every subarray that starts at index 0. **Fix:** initialize `seen = {0: 1}` before the loop; verify on input `[k]` (a single element equal to `k`).","**Reusing a stale prefix sum after an update.** Prefix arrays are immutable — if the underlying array changes, the whole prefix must be rebuilt. **Fix:** switch to a Fenwick tree the moment updates are involved.","**Computing 2-D prefix sums with the wrong inclusion-exclusion signs.** Drop one term and submatrix sums silently double-count. **Fix:** memorize the four-corners formula `P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]`; verify on a 1×1 submatrix."]}}]},{id:"prefix",label:"Prefix Sum",items:[{kind:"problem",label:"Prefix Sum Array"},{kind:"problem",label:"Prefix Sum on 2D"},{kind:"problem",label:"Range Queries"},{kind:"problem",label:"Equilibrium Index"},{kind:"problem",label:"Mean of range"},{kind:"problem",label:"Split array"},{kind:"problem",label:"Largest Submatrix"},{kind:"problem",label:"Max sum rectangle"}]},{id:"prefix-suffix",label:"Prefix / Suffix Transformation",items:[{kind:"problem",label:"Product of Array Except Self"},{kind:"problem",label:"Original Array"},{kind:"problem",label:"Longest Span"}]},{id:"diff-array",label:"Difference Array",items:[{kind:"problem",label:"Diff Array"},{kind:"problem",label:"2D Diff"},{kind:"problem",label:"Max occurring in ranges"},{kind:"problem",label:"Compute before Matrix"},{kind:"problem",label:"Point Counts from Intervals"}]},{id:"prefix-hashing",label:"Prefix Sum with Hashing",items:[{kind:"problem",label:"Subarray with 0 sum"},{kind:"problem",label:"Largest with 0 sum"},{kind:"problem",label:"Largest with Equal 0s and 1s"},{kind:"problem",label:"Largest with sum divisible by k"},{kind:"problem",label:"Longest with Sum K"},{kind:"problem",label:"Count with Sum Divisible By K"},{kind:"problem",label:"Count having Sum K"},{kind:"problem",label:"Count with given XOR"}]}]},{slug:"backtracking",title:"Backtracking",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Backtracking",body:{summary:"A controlled DFS over the space of **partial solutions**. You make a choice, recurse, and on return *undo* the choice — guaranteeing the call frame returns to the same state it entered. Add **pruning** so impossible branches are abandoned early. Backtracking is what brute force becomes when you do not have time to enumerate everything.",sections:[{heading:"The mental model",body:"Imagine the search space as a tree. The root is the empty partial solution; each child applies one choice; leaves are complete solutions. Backtracking walks this tree depth-first, **applying** a choice on the way down and **undoing** it on the way up.\n\n```ascii\n                          [ ]\n             /             |             \\\n          [a]             [b]            [c]\n         / | \\           / | \\          / | \\\n      [ab][ac]        [ba][bc]        [ca][cb]\n       |  |            |  |            |  |\n     [abc][acb]      [bac][bca]     [cab][cba]   <- leaves (full perms)\n```\n\nThe defining trick is that the **call stack** stores the path from root to the current node, and the **state mutation + undo** pattern keeps a single shared data structure correct for every branch.\n\n> Note: Backtracking only exists because **undoing is cheaper than re-creating**. If your undo step is `O(n)`, the asymptotic savings collapse. Always make `apply` and `undo` `O(1)`."},{heading:"Canonical operation — permutations of a list",body:`Pick one element, recurse on the rest, undo. The standard template:

\`\`\`py
def permutations(nums):
    res, used = [], [False] * len(nums)
    path = []
    def dfs():
        if len(path) == len(nums):
            res.append(path[:])             # COPY, not reference
            return
        for i in range(len(nums)):
            if used[i]: continue
            path.append(nums[i]); used[i] = True   # apply
            dfs()                                  # recurse
            path.pop();         used[i] = False    # undo
    dfs()
    return res
\`\`\`

Notice the **three load-bearing details**: \`path[:]\` copies before recording (otherwise every result points to the same mutating list); \`used\` is a tiny boolean mask, not a set rebuilt per call; \`apply\` and \`undo\` are exactly mirrored so the function is a no-op on its own state.

> Tip: Write \`apply\` and \`undo\` as adjacent lines, in the same order. If they diverge visually, they probably diverge semantically.`},{heading:"Pruning is non-optional",body:`Naive backtracking on a 20-queen board explores \`20^20\` partials — heat death. Three pruning techniques turn it tractable:

**1. Constraint propagation**: skip any choice that immediately violates the constraint (N-Queens: skip columns under attack, tested in \`O(1)\` with three boolean arrays for columns, diag, anti-diag).

**2. Bound-and-prune (branch-and-bound)**: track the best-known answer; abandon any partial whose lower-bound exceeds it.

**3. Duplicate skipping**: sort candidates and skip \`a[i] == a[i-1]\` when \`i > start\` (subsets-II, permutations-II). Avoids generating duplicate solutions in the first place rather than deduplicating after.

\`\`\`py
# subset-sum with sorted duplicates
for i in range(start, len(nums)):
    if i > start and nums[i] == nums[i-1]:
        continue                            # skip duplicate branch
    ...
\`\`\`

> Warning: Without pruning, backtracking is just exponential brute force with extra steps. The constraint check is the algorithm.`},{heading:"When to reach for it",body:'**Exhaustive enumeration** — subsets, permutations, combinations, partitions. **Constraint satisfaction** — N-Queens, Sudoku, graph coloring, word search on a grid, crossword filling. Anywhere the problem says "**find all**," "**count the number of ways**," or "**is there an assignment such that**," and the input is small enough (`n ≤ 20` for `2^n`, `n ≤ 10` for `n!`) that exponential time is acceptable.\n\nDo **not** reach for backtracking when the problem has **optimal substructure with overlapping subproblems** — that is DP territory, exponential vs polynomial. The line: if the same partial state can be reached by multiple paths and the answer depends only on that state (not the path), memoize → DP. If every partial leaf is unique → backtracking.'},{heading:"Variants",body:"**Branch-and-bound**: backtracking + a global best-known value; prune any partial whose cost lower-bound exceeds the best. Used for the traveling salesman, integer programming, and chess engines.\n\n**Iterative deepening DFS (IDDFS)**: re-run DFS with increasing depth limits. Combines DFS's `O(d)` memory with BFS's shortest-path guarantee. The algorithm behind chess-engine search.\n\n**Constraint propagation (AC-3, forward checking)**: when you assign a variable, prune its neighbors' domains. Sudoku solvers use this to turn the `9^81` brute force into a millisecond search.\n\n**Dancing Links (DLX)**: Knuth's exact-cover algorithm — backtracking over a doubly-linked-list matrix that uncovers and re-covers columns in `O(1)`. The state-of-the-art Sudoku and pentomino solver.\n\n**Meet-in-the-middle**: split the choices in half, enumerate each half (`2^(n/2)`), then combine. Turns `O(2^n)` into `O(2^(n/2))` when the combination step is cheap."},{heading:"Common interview problems",body:["Subsets I/II, permutations I/II, combinations, combination sum I/II.","N-Queens (return count or all boards); Sudoku Solver; word search I/II.","Palindrome partitioning; restore IP addresses; expression add operators.","Generate parentheses; letter combinations of a phone number.","Word break II; partition equal subset sum; matchsticks to square."]}],complexity:{best:"`O(answer-size)` when aggressive pruning kills nearly every branch (e.g., Sudoku usually finishes in microseconds)",average:"Heavily input-dependent — typically `O(branching^depth)` minus pruning savings",worst:"`O(n!)` for permutations, `O(2^n)` for subsets, `O(k^n)` for constrained k-ary grids",space:"`O(depth)` for the recursion stack + `O(state)` for the mutated working data"},pitfalls:["Forgetting to **undo** state on return — corrupts every later branch and the bug only fires partway through the search.","Appending the mutable `path` to results instead of a copy — every recorded answer ends up pointing to the same final state. Use `path[:]` / `new ArrayList<>(path)` / `path.clone()`.","Skipping duplicates incorrectly when the input has repeats — must sort first, then skip `a[i] == a[i-1]` only when `i > start` (skipping the first occurrence too would also drop valid branches).","Choosing backtracking when the problem has overlapping subproblems — wastes exponential time on what DP solves in polynomial. Telltale sign: the same partial state appears under multiple parents."]}}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Permutations"},{kind:"problem",label:"Rat in a Maze"},{kind:"problem",label:"Word Search"}]},{id:"hard",label:"Hard",items:[{kind:"theory",label:"N-Queens",conceptSlug:"n-queens",body:{summary:"Place `N` queens on an `N × N` chessboard so that **no two attack each other** — no shared row, column, or diagonal. The canonical **backtracking + constraint propagation** problem: depth-first row-by-row placement, with three boolean arrays pruning attacked squares in `O(1)`. Counts as `Q(N)` solutions; for `N = 8` there are 92.",sections:[{heading:"The mental model",body:'Place queens **one row at a time**. Row `r` needs exactly one queen; the choice is **which column**. A queen at `(r, c)` attacks every other queen sharing `c` (column), `r - c` (one diagonal), or `r + c` (anti-diagonal). Three boolean arrays — `col[]`, `diag[]` (indexed by `r - c + N`), `anti[]` (indexed by `r + c`) — answer "is this square attacked?" in `O(1)`.\n\n```ascii\n  4-queens board, one solution:\n\n    . Q . .       columns occupied: {1}\n    . . . Q       diag (r-c): {0-1, 1-3} = {-1, -2}\n    Q . . .       anti (r+c): {0+1, 1+3} = {1, 4}\n    . . Q .\n\n  attack mask after placing row 0, col 1:\n    col[1]=true, diag[N-1]=true, anti[1]=true\n```\n\nBecause we place exactly one queen per row, row conflicts are impossible by construction — we only check column and the two diagonals. That collapses the per-square test to three boolean reads.\n\n> Note: The naive "test every pair of placed queens" check is `O(N)` per placement; the three-bitmap trick is `O(1)`. On `N = 14` the difference is seconds vs minutes.'},{heading:"Canonical operation — recursive backtracking",body:`Try every column in the current row; apply the three-array constraint check; recurse; undo.

\`\`\`py
def solve_n_queens(n):
    col  = [False] * n
    diag = [False] * (2 * n)            # index = r - c + n
    anti = [False] * (2 * n)            # index = r + c
    board, solutions = [-1] * n, []

    def place(r):
        if r == n:
            solutions.append(board[:])
            return
        for c in range(n):
            if col[c] or diag[r - c + n] or anti[r + c]:
                continue                # square attacked, skip
            col[c] = diag[r - c + n] = anti[r + c] = True
            board[r] = c                # apply
            place(r + 1)
            col[c] = diag[r - c + n] = anti[r + c] = False
            board[r] = -1               # undo

    place(0)
    return solutions
\`\`\`

> Tip: For only the **count** of solutions, replace \`board[:]\` with \`count += 1\` and skip the board bookkeeping entirely — same algorithm, half the constant.`},{heading:"When to reach for it",body:`N-Queens itself is the canonical interview question for **backtracking with constraint propagation**, but the technique generalizes anywhere you have: (a) decisions made one step at a time, (b) a fast incremental constraint check, (c) need to enumerate or count valid full assignments.

Reach for this skeleton on **Sudoku** (track row, column, box occupancy), **graph coloring** (track each neighbor color set), **knight tour** (track visited grid), **Latin squares**, **crossword fill**. Do not reach for it when the problem has **overlapping subproblems** — that is DP territory. N-Queens has no overlap (every partial board is unique by definition), so backtracking is optimal.`},{heading:"Variants",body:"**Count only** (no boards): drop the `board` array; increment a counter at the leaf. Fastest formulation.\n\n**Bitmask N-Queens**: represent `col`, `diag`, `anti` as **single integers** with bit `i` set iff column / diagonal `i` is attacked. Available-columns mask is `~(col | diag | anti) & ((1 << n) - 1)`; iterate via `bit = lowbit(mask); mask ^= bit`. About 5x faster than the boolean-array version — the standard solution at `N ≥ 14`.\n\n**Iterative deepening + symmetry pruning**: only enumerate solutions where the first-row queen is in the left half; multiply final count by 2 (subtract reflective overlaps for odd `N`). Halves the search.\n\n**N-Queens completion**: given a partial valid placement, count / enumerate completions. Same backtracker started from row `k` instead of row 0.\n\n**Min-conflicts heuristic**: stochastic local search — start with a random placement, repeatedly move the most-attacked queen to the column with fewest conflicts. Solves million-queen instances in seconds; not the right answer in an algorithms interview but worth knowing exists."},{heading:"Common interview problems",body:["N-Queens — return all distinct solutions (board strings).","N-Queens II — return only the count of distinct solutions.","Sudoku Solver — the same backtracking skeleton with 27 occupancy sets instead of 3.","Word Search II — DFS with backtracking on a grid against a trie of words.","Generate all valid placements with additional constraints (no three in a diagonal, etc.).","M-coloring problem — assign one of M colors to each vertex so no edge has matching endpoints."]}],complexity:{best:"`O(N!)` upper bound — but heavy pruning collapses it; `N = 8` finishes in microseconds",average:"Empirically `~N^N / branching` with the three-array prune; bitmask version is ~5x faster constant",worst:"`O(N!)` worst-case branching without pruning; the prune is mandatory in practice",space:"`O(N)` for the recursion stack + three `O(N)` bitmaps = `O(N)` total"},pitfalls:["Indexing the diagonal arrays without the `+ N` offset — `r - c` is negative for `c > r` and crashes the array access. Always offset by `N` to keep indices non-negative.","Forgetting to **undo** all three array flags on return — corrupts every later branch and bug only manifests deeper in the search.","Storing solutions as references to the shared `board` list instead of copies — every recorded answer ends up pointing to the same final state. Use `board[:]` / `new int[]`.","Re-validating the entire board after each placement in `O(N^2)` instead of the `O(1)` three-array check — works but turns `N = 14` from milliseconds into minutes."]}},{kind:"problem",label:"N Queen Problem"},{kind:"problem",label:"Sudoku Solver"},{kind:"problem",label:"Word Break"},{kind:"problem",label:"Knight's Tour"},{kind:"problem",label:"Palindromic Partitions"},{kind:"problem",label:"M-Coloring"}]}]},{slug:"linked-list",title:"Linked List",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Linked List",body:{summary:"A chain of nodes, each holding a value and a pointer to the next. Trades the `O(1)` random access of arrays for `O(1)` splice — insert and delete at a known position need only pointer rewiring.",sections:[{heading:"Node layout",body:'A node is `{ value, next }`. The list is identified by its `head` pointer; the tail\'s `next` is `null` (singly) or wraps back to head (circular).\n\n```ascii\n head\n  |\n  v\n +---+---+    +---+---+    +---+---+    +---+------+\n | 7 | *-+--->| 3 | *-+--->| 9 | *-+--->| 1 | null |\n +---+---+    +---+---+    +---+---+    +---+------+\n  node0        node1        node2        node3 (tail)\n```\n\n> Note: Operations never shift elements; they only **rewire pointers**. The invariant you maintain in every mutation is "every node is reachable from `head` exactly once."'},{heading:"Canonical operation — iterative reverse",body:"The classic three-pointer dance: `prev`, `curr`, `next`. Save the next link before you overwrite it, point the current node back, and step.\n\n```py\ndef reverse(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next      # save before we clobber\n        curr.next = prev     # rewire\n        prev = curr          # step prev forward\n        curr = nxt           # step curr forward\n    return prev\n```\n\n> Warning: Forget to save `curr.next` first and you lose the rest of the list permanently."},{heading:"When to reach for it",body:"Frequent splicing in the middle without indexing (LRU cache eviction). Building stacks / queues with guaranteed worst-case `O(1)` (no rehash / regrowth). Algorithms with explicit pointer manipulation: Floyd cycle detection, merge two sorted lists. In modern code you usually still prefer dynamic arrays — the constant factor and cache behavior crush linked lists for sequential work."},{heading:"Common interview problems",body:["Reverse a linked list (iterative and recursive), reverse in groups of K.","Detect cycle, find cycle start (Floyd), find middle (slow / fast).","Merge two sorted lists, merge K sorted lists.","Copy list with random pointer, LRU cache."]}],complexity:{best:"Insert / delete at a known node `O(1)` — just rewire two pointers",average:"Access by position `O(n)` — must walk from head",worst:"Search by value `O(n)`; doubly-linked deletion still `O(1)` once node is in hand",space:"`O(n)` for nodes; `O(1)` extra for traversal and most rewrite patterns"},pitfalls:["Losing the head when reversing — always save `curr.next` before rewiring.",'Off-by-one when finding "the node before the deletion target" — a dummy node before head removes the special case for deleting the head.',"Creating cycles accidentally and infinite-looping on traversal.","Not setting the new tail's `next` to `null` after a partial reverse / split."]}},{kind:"theory",label:"Singly Linked List",body:{summary:'The default linked list: each node stores **one pointer** to the next node. Forward-only traversal, `O(1)` insert / delete once the predecessor is known, **no random access**. The substrate for stacks, queues, adjacency lists, and most "linked list" interview problems.',sections:[{heading:"The mental model",body:'A node is `{ value, next }`. The list is owned by a `head` pointer; the tail\'s `next` is `null`, which is the only termination signal you get.\n\n```ascii\n head\n  |\n  v\n +---+---+    +---+---+    +---+---+    +---+------+\n | 7 | *-+--->| 3 | *-+--->| 9 | *-+--->| 1 | null |\n +---+---+    +---+---+    +---+---+    +---+------+\n```\n\nBecause each node only knows its `next`, you can walk left-to-right but never backwards. To find "the node before X" you must restart from `head` and crawl until `curr.next is X` — there is no shortcut.\n\n> Note: The invariant in every mutation is "every node is reachable from `head` exactly once, and the last node\'s `next` is `null`." Lose that and you have a leak, a cycle, or a dangling pointer.'},{heading:"Canonical operation — insert after a known node",body:'Two pointer writes, no shifts, `O(1)`. The order matters: wire the new node *first*, then update the predecessor — otherwise you lose the tail of the list.\n\n```py\ndef insert_after(prev_node, value):\n    new_node = Node(value)\n    new_node.next = prev_node.next   # 1. point new -> old next\n    prev_node.next = new_node        # 2. point prev -> new\n```\n\nFor insert-at-head you do not need a predecessor — just `new.next = head; head = new`. For insert-at-tail you must either walk to the tail (`O(n)`) or maintain a `tail` pointer alongside `head` (`O(1)`).\n\n> Tip: A **dummy head** node (sentinel) collapses the "insert/delete at head" special case into the general case. Almost every clean linked-list solution starts with `dummy = Node(0); dummy.next = head`.'},{heading:"When to reach for it",body:'When you need cheap splicing in the middle and never need random access — building a stack or queue with hard `O(1)` worst case, chaining hash-table buckets, adjacency lists in a graph, or any pattern where you carry a "current pointer" through the data (free lists in allocators, undo chains).\n\nReach for an **array** instead when iteration speed or random access matters — pointer chasing is cache-hostile, and a `vector` will outrun a `LinkedList` for sequential work by an order of magnitude despite identical big-O. Reach for a **doubly linked list** when you need O(1) delete given just the node (no predecessor) — that is the LRU-cache scenario.'},{heading:"Variants",body:"**Sentinel head**: a permanent dummy node so `head` is never `null`. Removes every special case at the cost of one wasted node.\n\n**Tail-pointer variant**: keep both `head` and `tail`. Insert-at-tail becomes `O(1)`, enabling a queue.\n\n**XOR linked list**: store `prev XOR next` in a single pointer slot to walk both ways using `O(n)` memory of a singly-linked list. Clever, rarely used, fails any GC'd language.\n\n**Skip list**: layered singly linked lists with express lanes, giving `O(log n)` search probabilistically — the linked-list answer to balanced BSTs (used in Redis, LevelDB)."},{heading:"Common interview problems",body:["Reverse a singly linked list, iteratively and recursively.","Detect a cycle and find its entry point (Floyd's tortoise and hare).","Merge two sorted lists in `O(n+m)` with a dummy head.","Remove the N-th node from the end in a single pass using two pointers."]}],complexity:{best:"Insert / delete at head (or given predecessor) `O(1)`",average:"Search by value `O(n)`; access by index `O(n)`",worst:"Insert at tail without a tail pointer `O(n)`; full traversal `O(n)`",space:"`O(n)` total — one pointer of overhead per element plus the value itself"},pitfalls:["Overwriting `prev.next` before saving the old next link, losing the tail of the list — always `nxt = curr.next` first.",'Forgetting the dummy-head trick when the operation might delete or replace the head node, then writing a separate buggy "if deleting head" branch.',"Comparing pointers with `==` in languages where it compares by reference but the test data uses value-equal nodes — use the right identity check.","Accidentally creating a cycle (e.g., `last.next = head`) and infinite-looping on the next traversal — every mutation should null-terminate the new tail."]}},{kind:"theory",label:"Doubly Linked List",body:{summary:"Each node stores **two pointers**: `prev` and `next`. Costs one extra pointer per node and pays you back with bidirectional traversal and `O(1)` delete given just a node reference (no predecessor walk). The backbone of LRU caches, deques, browser history, and `std::list`.",sections:[{heading:"The mental model",body:"A node is `{ prev, value, next }`. The list has a `head` (whose `prev` is `null`) and a `tail` (whose `next` is `null`).\n\n```ascii\n        +------+      +------+      +------+      +------+\n null<--| prev |<-----| prev |<-----| prev |<-----| prev |\n        |  A   |      |  B   |      |  C   |      |  D   |\n        | next |----->| next |----->| next |----->| next |-->null\n        +------+      +------+      +------+      +------+\n          ^                                          ^\n         head                                       tail\n```\n\nThe extra `prev` link unlocks two superpowers: walk backwards, and delete any node in `O(1)` because you can reach its predecessor through `node.prev` instead of restarting from `head`.\n\n> Note: Every mutation must update **four** pointers (the new node's `prev`/`next` and the neighbors' `next`/`prev`). Miss one and you have a one-way street through a \"doubly\" linked list — a bug that lints clean and only fires on reverse iteration."},{heading:"Canonical operation — unlink a known node in O(1)",body:"No traversal. Reroute the two neighbors around the doomed node, then clear its own pointers to help the GC and prevent dangling-iterator bugs.\n\n```py\ndef unlink(node):\n    if node.prev: node.prev.next = node.next\n    else:         self.head     = node.next   # node was head\n    if node.next: node.next.prev = node.prev\n    else:         self.tail     = node.prev   # node was tail\n    node.prev = node.next = None\n```\n\nThis is the operation that makes the LRU cache work: a hash map gives you the node in `O(1)`, then `unlink(node)` + `push_front(node)` promote it to most-recently-used — all in `O(1)`.\n\n> Tip: Use **two sentinels** — a permanent `head` dummy and a permanent `tail` dummy — and the `if node.prev` / `if node.next` branches disappear entirely. Production-grade LRU implementations always do this."},{heading:"When to reach for it",body:"When **delete-given-node** must be `O(1)` (LRU / LFU eviction, free-list compaction). When the algorithm scans in both directions (palindrome check on a list, \"is X equidistant from both ends\"). When you need a **deque** built on linked nodes for hard `O(1)` worst case (Java's `LinkedList`, C++'s `std::list`).\n\nDo **not** reach for it when memory is tight (two pointers per node is 16 bytes of overhead on 64-bit), or when sequential iteration speed is the bottleneck (arrays still win on cache locality). Skip it entirely for short-lived scratch lists — the bookkeeping overhead outweighs the win."},{heading:"Variants",body:`**Sentinel head + sentinel tail**: removes every edge case in insert / delete. The standard production implementation.

**Circular doubly linked**: head.prev = tail and tail.next = head. Eliminates the null checks entirely; iteration terminates when you return to the sentinel.

**Unrolled doubly linked list**: each node stores an array of values plus prev / next. Restores cache locality while keeping O(1) splice — used in rope data structures for text editors.

**XOR linked list**: store \`prev XOR next\` in a single pointer slot to mimic doubly linked behavior with one pointer of memory. Clever but breaks under any GC.`},{heading:"Common interview problems",body:["Design an LRU cache with `O(1)` `get` and `put` (hash map + doubly linked list).","Design an LFU cache (hash map + doubly linked list per frequency bucket).","Flatten a multilevel doubly linked list using a stack.","Implement a browser history with `back`, `forward`, and `visit(url)`."]}],complexity:{best:"Insert / delete given a node `O(1)`; head / tail access `O(1)`",average:"Search by value `O(n)`; iteration `O(n)`",worst:"Access by index `O(n)` — still must walk from an endpoint",space:"`O(n)` total, with **2 pointers** of overhead per node vs. 1 for singly linked"},pitfalls:["Updating only `next` and forgetting `prev` on insert — list looks correct walking forward but corrupts on reverse iteration. Fix: write a helper `link(a, b)` that sets both `a.next = b` and `b.prev = a`.","On unlink, forgetting to handle the case where the node is head or tail — fix with sentinel nodes so the branch disappears.","Leaving stale `prev` / `next` on the removed node — any iterator still pointing at it walks back into the list and corrupts state. Always null them after unlink.",'Confusing `node.prev` with "the previous node in iteration order" inside a reverse traversal — `prev` is structural, not directional.']}},{kind:"theory",label:"Circular Linked List",body:{summary:'A linked list where the tail\'s `next` points back to the head instead of `null`. Eliminates the "end of list" special case at the cost of a termination invariant — every loop now needs an explicit "back to start" check. Comes in singly and doubly flavors.',sections:[{heading:"The mental model",body:`There is no \`null\`. The list closes on itself; \`tail.next == head\` is the invariant that defines "circular."

\`\`\`ascii
      +-------------------------------+
      |                               |
      v                               |
   +---+---+    +---+---+    +---+---+
   | A | *-+--->| B | *-+--->| C | *-+
   +---+---+    +---+---+    +---+---+
      ^
      |
     head (and the loop-back from C lands here)
\`\`\`

This shape removes "have I reached the end?" as a concept — any traversal must instead remember its starting point and terminate when it comes around to it. The benefit is **uniformity**: every node has a successor; there is no special-case head or tail node.

> Note: Termination changes from \`while curr is not None\` to \`while True: ...; if curr is head: break\`. Forget this and you get an infinite loop on the very first traversal.`},{heading:"Canonical operation — round-robin step (Josephus)",body:`Walk \`k\` nodes forward, drop one, repeat. The list shrinks by one node each round and never needs a "wrap around" check — the circularity handles it for free.

\`\`\`py
def josephus(n, k):
    head = build_circular(range(1, n + 1))
    curr = head
    while curr.next is not curr:        # more than one node left
        for _ in range(k - 1):
            prev, curr = curr, curr.next
        prev.next = curr.next           # drop curr
        curr = prev.next
    return curr.value
\`\`\`

Notice the loop has **no special wrap-around code** — the modular arithmetic of "next, next, next" is baked into the data structure.

> Tip: Whenever you would compute \`index % length\` repeatedly inside a loop, ask whether a circular list lets you delete the modulo entirely.`},{heading:"When to reach for it",body:"Round-robin schedulers (process A, then B, then C, then A again — forever). Josephus-style elimination problems. Music players on repeat. Ring buffers where you genuinely never run out (sentinel-free deque). The classic application: an OS's ready-queue of runnable threads, where the scheduler advances one step every time slice.\n\nReach for a **plain array with modulo indexing** when the size is bounded and known — the array gives you cache locality and `O(1)` random access. Reach for a circular list only when you also need cheap splice / remove in the middle (Josephus, scheduler eviction)."},{heading:"Variants",body:"**Circular singly linked**: tail.next = head only. Simplest form; cannot walk backwards.\n\n**Circular doubly linked**: tail.next = head and head.prev = tail. Used to implement deques with no null checks — every node has both a successor and a predecessor.\n\n**Sentinel-based circular**: a permanent dummy node that is always part of the cycle; `dummy.next == dummy` represents the empty list. The cleanest production implementation, eliminating every edge case.\n\n**Ring buffer** (circular array): fixed-size array with `head` and `tail` indices walking mod-N. Same shape, contiguous memory; the array-backed alternative to a circular linked list."},{heading:"Common interview problems",body:["Josephus problem — last person standing in a circle of `n` with step `k`.","Split a circular linked list into two halves of equal (or near-equal) length.","Sorted insert into a circular sorted list (handle wrap-around and empty cases).","Detect whether a linked list is circular and find the entry point of the cycle."]}],complexity:{best:"Insert at head with a `tail` pointer `O(1)`; step / rotate `O(1)`",average:"Search and traversal `O(n)`",worst:"Insert in sorted order `O(n)` — must scan to find the position",space:"`O(n)` for nodes; `O(1)` extra for any standard traversal"},pitfalls:["Using `while curr is not None` — there is no `None`, so the loop never terminates. Fix: `while True: ...; if curr is start: break` or compare against the sentinel.",'Confusing "has cycle" (a bug in a list that should be `null`-terminated) with "circular" (a list that *should* loop). Same shape, opposite intent.',"Forgetting to update `tail.next = new_head` when inserting at the front — the cycle silently breaks and the next traversal hangs.","Counting the sentinel as a real element when reporting `size()` — off-by-one bugs in every aggregate."]}},{kind:"theory",label:"Loop Detection",conceptSlug:"loop-detection",body:{summary:"Decide whether a singly linked list contains a cycle, and — if it does — locate the node where the cycle begins. **Floyd's tortoise and hare** does both in `O(n)` time and `O(1)` extra space, with no hash set.",sections:[{heading:"The mental model",body:'Two pointers walk the list at different speeds: `slow` advances one step per iteration, `fast` advances two. If the list is acyclic, `fast` runs off the end and you return `False`. If there is a cycle, both pointers enter it eventually, and because `fast` gains one step on `slow` every iteration, the gap closes mod the cycle length — they **must** meet inside the loop.\n\n```ascii\n  acyclic                          cyclic\n  -----------------------          ---------------------\n  s -> -> -> -> -> null            s -> -> [ -> -> -> ]\n  f -> -> -> -> -> null                    [ ^         ]\n                                           [ |         ]\n                                           [ <- meet <-]\n```\n\n> Note: This is the **only** standard algorithm where two pointers moving at different speeds matter — most "two pointer" problems use equal-speed pointers. The asymmetry is the whole trick.'},{heading:"Canonical operation — detect and locate",body:"Phase 1: detect via tortoise / hare. Phase 2: reset one pointer to head, then advance both one step at a time — they meet at the cycle entry.\n\n```py\ndef detect_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            # phase 2: find the entry\n            slow = head\n            while slow is not fast:\n                slow = slow.next\n                fast = fast.next\n            return slow        # cycle entry\n    return None                # no cycle\n```\n\nWhy phase 2 works: when slow and fast first meet, slow has walked `d + k` nodes (`d` = head-to-entry, `k` = distance into the loop). Fast walked `2(d + k)`. Their difference `d + k` is a multiple of the loop length `L`. So `d` more steps from the meeting point lands on the entry — and `d` more steps from `head` also lands on the entry. Walking both at speed 1 collides exactly there.\n\n> Tip: To compute the **length of the loop**, after the first meeting just advance one pointer alone until it comes back — that count is `L`."},{heading:"When to reach for it",body:'Any time the input is a linked list that **might** contain a cycle: linked-list integrity checks, garbage-collector mark-sweep on circular data, detecting infinite functional-iterator chains (`f(f(f(x)))`). The fast/slow trick also generalizes to "find a duplicate in `O(1)` extra space" (Leetcode 287) by treating the array as a function `i -> nums[i]`.\n\nReach for a **hash set of visited nodes** only when you also need to *enumerate* the cycle, or when the list nodes are not pointer-comparable (e.g., values stored by content). Floyd wins whenever `O(1)` extra space is required — interviewers always ask for it.'},{heading:"Variants",body:"**Brent's algorithm** detects cycles in `O(n)` like Floyd but with ~36% fewer pointer dereferences on average — same memory, slightly faster constants. Used in `Pollard's rho` integer factorization.\n\n**Hash-set detection**: walk once, store seen nodes in a set, return on first repeat. `O(n)` time, `O(n)` space. Trivial to code; fails the \"constant space\" follow-up.\n\n**Cycle length without cycle entry**: phase 1 only, then count steps for one pointer to return to itself. Often asked as a standalone follow-up.\n\n**Functional-iteration cycle detection**: Floyd on `x_{n+1} = f(x_n)` instead of `node = node.next`. The math is identical; this is how you find duplicates in `[1..n]` arrays in `O(1)` space."},{heading:"Common interview problems",body:["Linked List Cycle — return true/false.","Linked List Cycle II — return the node where the cycle begins.","Find the Duplicate Number — Floyd on the array-as-function.","Length of the loop in a linked list."]}],complexity:{best:"No cycle: `fast` reaches end in `n/2` iterations — `O(n)` time, `O(1)` space",average:"`O(n)` time, `O(1)` space — total pointer movement bounded by `n + L`",worst:"`O(n)` time, `O(1)` space — phase 1 ≤ `n` steps, phase 2 ≤ `n` steps",space:"`O(1)` extra — only two pointers regardless of input size"},pitfalls:["Checking `while fast.next` without also checking `fast` — null-deref on the second `fast.next.next` for acyclic input. Fix: `while fast and fast.next`.","Comparing values (`slow.val == fast.val`) instead of node identity (`slow is fast`) — two distinct nodes with equal values falsely declared a cycle.","Forgetting to reset `slow = head` in phase 2 — you stay in the loop and the algorithm reports the meeting point, not the entry.",'Trying to detect a cycle by counting "too many" iterations and bailing — works on small inputs, fails on long acyclic lists and on cycles smaller than your threshold.']}}]},{id:"reversal",label:"Reversal Pattern",items:[{kind:"problem",label:"Reverse Singly"},{kind:"problem",label:"Reverse a Doubly"},{kind:"problem",label:"Reverse in Groups (K-group reversal)"},{kind:"problem",label:"Reorder List"}]},{id:"fast-slow",label:"Fast & Slow Pointer",items:[{kind:"problem",label:"Middle"},{kind:"problem",label:"Remove Nth from End"},{kind:"problem",label:"Check Palindrome"},{kind:"problem",label:"Detect Cycle"},{kind:"problem",label:"Length of Loop"},{kind:"problem",label:"Intersection of Y Shaped"}]},{id:"sort-merge",label:"Sorting & Merging",items:[{kind:"problem",label:"Sort 0s, 1s, 2s"},{kind:"problem",label:"Add Two Numbers"},{kind:"problem",label:"Rotate"},{kind:"problem",label:"Merge K Sorted"}]},{id:"design",label:"Design",items:[{kind:"problem",label:"Browser History"},{kind:"problem",label:"Twitter"},{kind:"problem",label:"LRU Cache"},{kind:"problem",label:"LFU Cache"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Flattening"},{kind:"problem",label:"Clone with Random Pointer"}]}]},{slug:"stack",title:"Stack",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Stack",body:{summary:"**LIFO** container. Push and pop on the same end (the top), both `O(1)`. Backed by an array or a singly linked list — the implementation rarely matters.",sections:[{heading:"Mental model",body:`A vertical pile of plates. You only touch the top. The invariant: the element returned by \`pop\` is always the **most recently pushed** un-popped element.

\`\`\`ascii
  push(4)             pop() -> 4
   |                       |
   v                       v
 +---+               +---+
 | 4 | <- top        | 4 |  (gone)
 +---+               +---+
 | 3 |               | 3 | <- top
 +---+      ===>     +---+
 | 2 |               | 2 |
 +---+               +---+
 | 1 | <- bottom     | 1 | <- bottom
 +---+               +---+
\`\`\`

> Note: The legal operations are exactly three: \`push\`, \`pop\`, \`peek\`. Anything else and it is not a stack.`},{heading:"Canonical operation — next greater element",body:`Walk the array. Keep a stack of indices waiting for a larger value. When the current element beats the top of the stack, pop and resolve.

\`\`\`py
def next_greater(nums):
    ans = [-1] * len(nums)
    stack = []  # indices, values monotonically decreasing
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            ans[stack.pop()] = x
        stack.append(i)
    return ans
\`\`\`

> Tip: Each index enters and leaves the stack at most once → amortized \`O(n)\` total.`},{heading:"When to reach for it",body:'Whenever the algorithm needs **"most recent unmatched thing."** Parentheses matching, expression evaluation (Shunting-yard / postfix), undo histories, iterative DFS, call-stack simulation. The monotonic-stack pattern solves an entire class of "next greater / next smaller" problems in `O(n)`.'},{heading:"Common interview problems",body:["Valid parentheses, min stack, evaluate Reverse Polish notation.","Largest rectangle in histogram (monotonic stack).","Daily temperatures, next greater element, trapping rain water.","Implement queue using two stacks."]}],complexity:{best:"`push`, `pop`, `peek` all `O(1)` worst case",average:"Monotonic-stack scans amortize to `O(n)` across the whole array",worst:"No `O(log n)` regressions; deep recursion via stack still `O(depth)` space",space:"`O(n)` for the stack itself; `O(1)` extra per operation"},pitfalls:["Popping from an empty stack — always guard with `isEmpty`.","Using a Python list as a stack but writing `list.pop(0)` (`O(n)`) instead of `list.pop()`.","Mixing up strictly vs. non-strictly monotonic on writes — `<` and `<=` flip whether equal elements pop.","Storing values when the eviction check needs indices (or vice versa)."]}},{kind:"theory",label:"Min Stack",conceptSlug:"min-stack",body:{summary:'A stack that supports `push`, `pop`, `top`, **and** `getMin` — every one of them in `O(1)`. The trick: don\'t recompute the minimum, **remember** it. Pair every value (or every "new minimum") with the minimum-so-far at the time it was pushed.',sections:[{heading:"The mental model",body:`A plain stack can tell you the top in \`O(1)\` but to find the min you must scan all \`n\` elements. The fix is to maintain a **parallel history of minima** — for every state of the stack, store what the minimum was at that moment. Pop restores both, so the min always reflects the current contents.

\`\`\`ascii
 main stack   min stack       getMin()
  +---+        +---+           = 1   (top of min stack)
  | 5 |        | 1 |
  +---+        +---+
  | 3 |        | 1 |
  +---+        +---+
  | 7 |        | 1 |
  +---+        +---+
  | 1 |        | 1 |
  +---+        +---+
  | 4 |        | 4 |
  +---+        +---+
\`\`\`

Notice the min stack never decreases as you go up — each level commits to "the minimum among me and everything below me."

> Note: The auxiliary structure is the entire idea. Try to be clever and store **only** the new minima and you must also remember "for how many pushes is this min current" — possible but more bookkeeping than just shadowing the main stack.`},{heading:"Canonical operation — push / pop / getMin",body:`On push, the new min is \`min(value, currentMin)\`. On pop, both stacks pop together — the previous min reappears automatically.

\`\`\`py
class MinStack:
    def __init__(self):
        self.stack = []
        self.mins  = []   # mins[i] = min of stack[0..i]

    def push(self, x):
        self.stack.append(x)
        new_min = x if not self.mins else min(x, self.mins[-1])
        self.mins.append(new_min)

    def pop(self):
        self.stack.pop()
        self.mins.pop()

    def top(self):     return self.stack[-1]
    def getMin(self):  return self.mins[-1]
\`\`\`

Every method is exactly two array operations — provably \`O(1)\`.

> Tip: For the \`O(1)\` extra-space follow-up, store **differences** from the current minimum on the main stack and keep the min in a single variable. The encoded value \`2*x - min\` lets you recover both, but it overflows in 32-bit and is rarely worth the risk in interviews. Quote the trick, then implement the clean two-stack version.`},{heading:"When to reach for it",body:'Whenever a problem asks for a stack-like structure with **any extreme query in `O(1)`** — `getMin`, `getMax`, `getMedian` (with two heaps), `getSum`. The pattern generalizes: pair every push with the running aggregate, restore it on pop.\n\nThe deeper lesson — when push/pop is the only mutation, *any* invariant that is a function of "everything below me" can be cached per level for `O(1)` access. This shows up in tree-recursion DP (carry the answer down the call stack), in undo/redo histories that snapshot derived state, and in the queue-using-two-stacks pattern. Reach for it whenever recomputing on demand would be `O(n)` and you can pay one extra `O(1)` write at insertion time.'},{heading:"Variants",body:'**Two-stack (shadow stack)**: the implementation above. Cleanest, most readable, `O(n)` extra space. Default answer in interviews.\n\n**Single-stack with pairs**: push `(value, currentMin)` tuples onto one stack. Same memory, one structure — preferred when you cannot allocate two stacks.\n\n**Single-stack with "new min only"**: push to a second stack *only* when `value <= currentMin`. Best case much less memory, but pop must check whether the popped value equals the min before also popping the min stack. The `<=` (not `<`) is the bug magnet: with `<` you lose duplicate minima.\n\n**Encoded-difference (`2*x - min`)**: stores the encoded value when a new min is set; recovers the old min on pop. `O(1)` extra space but overflow-prone — interesting trivia, dangerous in production.\n\n**Max stack** is the same structure with `max` swapped for `min`. **Min queue** is harder — uses a monotonic deque (see Deque).'},{heading:"Common interview problems",body:["Implement a stack with `getMin` in `O(1)` (the canonical problem).","Implement a stack with `getMax` in `O(1)`.","Implement a queue with `getMin` in amortized `O(1)` (two min-stacks).","Stock span problem and Online Stock Span — same pattern with running aggregates."]}],complexity:{best:"`push`, `pop`, `top`, `getMin` all `O(1)` worst case",average:"`O(1)` per operation — no amortization needed",worst:"`O(1)` per operation — the two-stack invariant holds at every step",space:"`O(n)` — one shadow entry per pushed value (or `O(1)` with the encoding trick)"},pitfalls:["Recomputing the minimum on every `getMin` — defeats the entire point and turns the API back into `O(n)`. The whole structure exists to avoid this.",'In the "new min only" variant, using `<` instead of `<=` — duplicates of the current min are silently dropped, and the min stack runs dry while the main stack still holds copies of the minimum.',"Forgetting to pop the shadow stack on every `pop` — the min stack drifts above the main stack and `getMin` returns a ghost value.","Using the encoded-difference trick with `int32` values that overflow on `2*x - min` — fails on `[INT_MIN, ...]` test cases. Either use 64-bit or stick to the two-stack version."]}}]},{id:"operations",label:"Operations",items:[{kind:"problem",label:"Reverse"},{kind:"problem",label:"Sort"}]},{id:"expression",label:"Expression",items:[{kind:"problem",label:"Check for balanced"},{kind:"problem",label:"Evaluation of Postfix Expression"},{kind:"problem",label:"Infix Evaluation"},{kind:"problem",label:"Infix to Postfix"},{kind:"problem",label:"Redundant Brackets"},{kind:"problem",label:"Longest Valid"},{kind:"problem",label:"Score of Balanced"}]},{id:"design",label:"Design",items:[{kind:"problem",label:"Stack using Queues"},{kind:"problem",label:"Two stacks in an array"},{kind:"problem",label:"K Stacks in an Array"},{kind:"problem",label:"Stack that supports getMin()"}]},{id:"monotonic",label:"Monotonic Stack",items:[{kind:"problem",label:"Lowest by removing k digits"},{kind:"problem",label:"Next Greater Element"},{kind:"problem",label:"Stock Span Problem"},{kind:"problem",label:"Buildings Facing Sun"},{kind:"problem",label:"Previous Smaller Element"},{kind:"problem",label:"Largest Rectangle in a Histogram"},{kind:"problem",label:"Max of 1s"},{kind:"problem",label:"Max of Mins of every window size"},{kind:"problem",label:"Trapping Rain Water"},{kind:"problem",label:"Subarray Range Sum"},{kind:"problem",label:"Replace Adjacent Opposite"},{kind:"problem",label:"Longest Subarray Length"}]},{id:"sim",label:"String Simulation",items:[{kind:"problem",label:"Decode String"},{kind:"problem",label:"Check Redundant Brackets"}]}]},{slug:"queue",title:"Queue",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Queue",body:{summary:'**FIFO** container. Enqueue at the back, dequeue from the front, both `O(1)`. The canonical "process things in the order they arrived" data structure.',sections:[{heading:"Mental model",body:"Two pointers (`head` and `tail`) over either a circular array or a linked list. The invariant: `dequeue` returns the **oldest still-present** element.\n\n```ascii\n         dequeue            enqueue\n            <-                ->\n         +---+---+---+---+---+\n  queue  | 1 | 2 | 3 | 4 | 5 |\n         +---+---+---+---+---+\n           ^               ^\n          head            tail\n```\n\n> Warning: A naive array-shift queue is `O(n)` per dequeue. Use a circular buffer or a linked list for true `O(1)`."},{heading:"Canonical operation — BFS over a grid",body:`Use a queue to expand outward layer by layer. The first time a cell is reached, the distance equals the layer number.

\`\`\`py
from collections import deque

def bfs(grid, start):
    q = deque([start])
    seen = {start}
    dist = {start: 0}
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = r + dr, c + dc
            if (nr, nc) in seen or not in_bounds(nr, nc):
                continue
            seen.add((nr, nc))
            dist[(nr, nc)] = dist[(r, c)] + 1
            q.append((nr, nc))
    return dist
\`\`\``},{heading:"When to reach for it",body:"Breadth-first search (shortest path in unweighted graphs, level-order tree traversal). Task scheduling / job pipelines. Sliding-window patterns where you discard old elements as the window slides. Producer / consumer buffers in concurrent code."},{heading:"Common interview problems",body:["Implement queue using stacks; implement stack using queues.","BFS over a graph or grid (number of islands, rotten oranges, shortest path in binary matrix).","Sliding window maximum (with a deque).","First non-repeating character in a stream."]}],complexity:{best:"`enqueue`, `dequeue`, `peek` all `O(1)` worst case",average:"BFS layer expansion `O(V + E)` over a graph",worst:"Iteration / search `O(n)` — a queue is not indexable",space:"`O(n)` for the buffer; BFS holds at most one frontier in memory"},pitfalls:["Implementing a queue with two array indices but never wrapping → fake-leaks memory and breaks once `tail` exceeds the array length.","Using Java `LinkedList` as `Queue` — works, but `ArrayDeque` is faster and the idiomatic choice.","Confusing queue with priority queue — a queue is FIFO; a priority queue is a heap.","Marking nodes visited at **pop** instead of **push** during BFS — same node enqueued multiple times, blowing up memory."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"Circular Queue"},{kind:"problem",label:"Queue using Stacks"},{kind:"problem",label:"FIFO Page Replacement"},{kind:"problem",label:"Reverse a Queue"},{kind:"problem",label:"Reverse First K"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Interleave Queue"},{kind:"problem",label:"K Queues in an array"},{kind:"problem",label:"First non-repeating in a stream"},{kind:"problem",label:"Min Knight steps for target"}]}]},{slug:"deque",title:"Deque",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Deque",body:{summary:"Double-ended queue — push and pop on **both** ends in `O(1)`. The most flexible linear container in the standard library, and the secret weapon for sliding-window optimization, 01-BFS, and any algorithm that needs to look at both ends of a stream.",sections:[{heading:"The mental model",body:'A queue where every operation has a mirror twin at the other end. The four core ops are `pushFront`, `pushBack`, `popFront`, `popBack`, and they are all `O(1)` worst case (with the right backing store).\n\n```ascii\n   popFront <--  +---+---+---+---+---+  --> popBack\n  pushFront -->  | A | B | C | D | E |  <-- pushBack\n                 +---+---+---+---+---+\n                  ^                 ^\n                 front              back\n```\n\nUnder the hood, the standard libraries pick one of two backings: a **circular array** with `head` / `tail` indices wrapping mod-N (Java\'s `ArrayDeque`, Python\'s `collections.deque` in chunks, C++\'s `deque` in blocks) for cache locality, or a **doubly linked list** for hard `O(1)` worst case without resizing pauses.\n\n> Note: A deque generalizes both stack (use only one end) and queue (push back, pop front). Anywhere a problem says "stack" or "queue", a deque also works — the reverse is not true.'},{heading:"Canonical operation — sliding-window maximum",body:`Maintain a deque of *indices* whose values form a strictly decreasing sequence from front to back. The front is always the current window's max.

\`\`\`py
from collections import deque

def max_sliding_window(nums, k):
    dq = deque()         # holds indices; values are monotonically decreasing
    out = []
    for i, x in enumerate(nums):
        # 1. evict indices that fell out of the window
        while dq and dq[0] <= i - k:
            dq.popleft()
        # 2. maintain monotonicity at the back
        while dq and nums[dq[-1]] < x:
            dq.pop()
        dq.append(i)
        # 3. once we have a full window, the front is the answer
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out
\`\`\`

Each index enters and leaves the deque at most once → total work \`O(n)\`, beating the naive \`O(n*k)\`.

> Tip: Store **indices**, not values — you need positions to know when an entry falls out of the window. The same trick applies to sliding-window minimum (just flip the comparator) and to "next greater element" style problems.`},{heading:"When to reach for it",body:`Reach for a deque whenever the algorithm needs **both ends** of a sequence. The flagship pattern is **monotonic deque** for sliding-window aggregates: max, min, "longest subarray with bounded difference," "shortest subarray with sum ≥ K." Also: **01-BFS** over a graph with 0/1 edge weights — push 0-weight neighbors to the front, 1-weight to the back, giving Dijkstra-quality shortest paths in \`O(V+E)\` without a priority queue.

Other uses: palindrome checks (compare front and back, then shrink), undo/redo with bounded history (push to back, drop from front when full), level-order traversals that emit nodes in alternating directions (zig-zag BFS).

Reach for a plain **queue** instead when you only need FIFO and the language's deque is heavier than a ring buffer. Reach for a **priority queue** when you need ordered extraction beyond the two endpoints.`},{heading:"Variants",body:"**Monotonic deque**: indices stored in monotonic value order. The single most common interview pattern built on a deque. Use `<` vs. `<=` deliberately — it decides whether equal-value indices stay or get evicted.\n\n**Circular array deque**: fixed-capacity ring buffer with `head` and `tail` indices walking mod-N. Constant memory, cache-friendly, but you must resize (double the array) when full — amortized `O(1)`.\n\n**Block deque** (C++ `std::deque`): array of fixed-size chunks, indexed by a map. Avoids large reallocations at the cost of one indirection per access.\n\n**Linked-list deque** (Java `LinkedList`): doubly linked list. True `O(1)` worst case, no resizing pauses, but two pointers of overhead per element and zero cache locality.\n\n**Bounded deque / sliding window**: deque with a fixed max size; pushing past capacity automatically pops the other end. Foundation of LRU sketches and rate limiters."},{heading:"Common interview problems",body:["Sliding Window Maximum (monotonic deque, the canonical problem).","Shortest Subarray with Sum at Least K (monotonic deque on the prefix-sum array).","01-BFS — shortest path in a graph with 0/1 edge weights, `O(V+E)`.","First negative number in every window of size K."]}],complexity:{best:"All endpoint ops (`pushFront`, `pushBack`, `popFront`, `popBack`, `peekFront`, `peekBack`) `O(1)`",average:"Monotonic-deque scans amortize to `O(n)` total — each index enters / leaves at most once",worst:"`O(1)` per op with a linked-list backing; amortized `O(1)` with a circular array (occasional resize)",space:"`O(n)` for stored elements; the monotonic-deque pattern uses `O(k)` for a window of size `k`"},pitfalls:["Mixing up `popFront` vs. `popBack` when implementing a monotonic deque — eviction by *age* happens at the front, monotonic-order maintenance happens at the back. Swap them and you silently lose elements.","Storing values instead of indices, then having no way to tell when an entry has aged out of the window — always store indices and read the value lazily.","Forgetting to evict expired indices from the front *before* reading the answer — the reported max is correct only after the eviction step.","Using `list.pop(0)` in Python as a deque — that is `O(n)` per call and turns the algorithm quadratic. Use `collections.deque`, where `popleft()` is `O(1)`."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"Circular Array Implementation"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Lexicographically largest permutation"},{kind:"problem",label:"Nth term of given recurrence relation"},{kind:"problem",label:"Generate Bitonic Sequence"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Sliding Window Maximum"},{kind:"problem",label:"Longest Subarray with Difference ≤ X"},{kind:"problem",label:"Max Subarray Length with K Increments"},{kind:"problem",label:"Min Deques to Sort Array"}]}]},{slug:"binary-tree",title:"Binary Tree",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Binary Tree",body:{summary:'A hierarchical structure of nodes where each node has at most **two children** (`left` and `right`). The substrate of every "tree" problem in interviews — heap-ordered, BST-ordered, expression trees, segment trees, tries, decision trees all derive from this one shape.',sections:[{heading:"The mental model",body:`A binary tree is **recursively defined**: it is either empty or a node holding a value plus two child binary trees. That recursive shape is why almost every tree algorithm is a recursive function with one base case (\`null\`) and one combine step.

\`\`\`ascii
           (1)             <- root,   level 0  (depth 0)
          /   \\
        (2)    (3)         <-         level 1
        / \\      \\
      (4) (5)    (6)       <-         level 2
             \\
             (7)           <- leaf,   level 3  (height of tree = 3)

   depth(node)  = edges from root to node
   height(node) = edges from node to its deepest descendant
   size(node)   = total nodes in subtree rooted at node
\`\`\`

Key vocabulary: a **leaf** has no children. A **balanced** tree keeps \`height = O(log n)\`. A **complete** tree has every level full except possibly the last, filled left-to-right (heaps live here). A **perfect** tree is complete *and* every internal node has two children.

> Note: When the problem says "balanced," ask **whose definition**? "Height-balanced" (AVL: \`|h_left - h_right| ≤ 1\` at every node) is stricter than "weight-balanced" (size ratio bounded) is stricter than just "non-skewed." Wrong assumption silently breaks the \`O(log n)\` claim.`},{heading:"Canonical operation — post-order DFS for height",body:"Solve children first, combine at the parent. The recursion invariant: `solve(node)` returns the answer for the **subtree** rooted at `node`, given correct answers for `solve(left)` and `solve(right)`.\n\n```py\ndef height(node):\n    if node is None:\n        return -1                      # base: empty tree height = -1\n    L = height(node.left)\n    R = height(node.right)\n    return 1 + max(L, R)               # combine: leaf -> height 0\n```\n\nThis post-order template solves **diameter** (combine `L + R + 2` for the longest path through this node), **balanced check** (return `-1` as a sentinel when imbalanced), **subtree-sum**, **count of good nodes**, **LCA**, and a dozen other problems with the same five-line skeleton.\n\n> Tip: Trust the recursion. Verify only the base case + the combine step; do not trace the whole call tree in your head. If `solve(left)` and `solve(right)` are correct, the combine step decides everything."},{heading:"Traversals you must memorize",body:["**Pre-order** (root, left, right) — serialize, clone, prefix-expression evaluation.","**In-order** (left, root, right) — yields **sorted order on a BST**. The only traversal where order matters semantically, not just structurally.","**Post-order** (left, right, root) — compute aggregates from leaves up (height, subtree sum, deletion that needs children freed first).",'**Level-order** (BFS, queue-based) — width-of-tree, right-view, zig-zag, "all nodes at distance K" — anything driven by depth.',"**Morris traversal** — `O(1)` extra space by temporarily rewiring `right` pointers. Memorize the algorithm; interviewers love asking for it as the constant-space follow-up to in-order."]},{heading:"When to reach for it",body:"Whenever the data is **hierarchical** (filesystem, DOM, organization chart), **recursively decomposable** (expression parsing, divide-and-conquer state), or **ordered with range / k-th queries** (use a BST flavor). Reach for it when an array would force you to do `O(n)` shifts for every insert.\n\nDo **not** reach for a generic binary tree when you only need a priority queue — use a **heap** (also a binary tree, but with `O(1)` peek). Do not reach for it when you need fast random access by index — use an **array**. And do not implement your own balanced BST when a stdlib `TreeMap` / `std::map` exists."},{heading:"Variants",body:"**Full / strict**: every internal node has exactly 2 children (no node with 1 child).\n\n**Complete**: every level full except possibly the last, filled left-to-right. Heaps live here — enables flat-array storage with `parent(i) = (i-1)/2`.\n\n**Perfect**: complete and every level full (`n = 2^h - 1`).\n\n**Balanced (height-balanced)**: `|h_left - h_right| ≤ 1` at every node. AVL trees maintain this via rotations on every insert / delete.\n\n**Red-Black tree**: weaker balance (factor ~2) but with fewer rotations → faster insert / delete. Backs `std::map`, Java `TreeMap`, Linux kernel's CFS scheduler.\n\n**Threaded binary tree**: leaf null pointers are reused to point to the in-order successor — enables `O(1)`-space in-order traversal (Morris).\n\n**B-tree**: each node holds `k` keys and `k+1` children. Disk-friendly; backs every relational database index.\n\n**Cartesian tree**: heap-ordered on priority, BST-ordered on key. Used in treaps and the linear-time RMQ ↔ LCA reduction."},{heading:"Common interview problems",body:["Height / depth / diameter / balanced check (post-order DFS template).","LCA of two nodes (generic and BST-specialized variants).","Serialize / deserialize, construct tree from pre-order + in-order traversals.","Level order, zig-zag, right view, vertical order, top / bottom view.","Path-sum I / II / III, max path sum, sum-root-to-leaf numbers.","Symmetric / mirror tree, invert a tree, flatten to linked list."]}],complexity:{best:"Search / insert / delete `O(log n)` on a balanced tree; `O(1)` access to root and immediate children",average:"Traversal `O(n)`; recursion depth `O(h)` on the call stack",worst:"Skewed tree degrades every operation to `O(n)` — no balancing means no `O(log n)` guarantee",space:"`O(h)` for recursion stack + `O(n)` for the nodes themselves; iterative BFS uses `O(width)` queue"},pitfalls:["Recursing into a `null` child without a guard at the top of the function — null-deref crash. Always start with `if node is None: return base_case`.",'Returning the wrong piece of information up the stack — separate "**answer to the question being asked**" from "**info the parent needs to compute its answer**." Diameter is the textbook example: you return height but track the global diameter separately.',"Mutating shared state during recursion without restoring on return — corrupts every later branch.","Assuming the tree is balanced when reporting `O(log n)` — without rotations (AVL, red-black) the worst case is `O(n)`. Always state the balance assumption explicitly."]}},{kind:"theory",label:"BFS & DFS",conceptSlug:"bfs-dfs",body:{summary:"**BFS** (breadth-first search) explores level-by-level using a **queue** — finds the shortest path in an unweighted graph or tree. **DFS** (depth-first search) explores one branch all the way down using a **stack** (or recursion) — finds whether something is reachable, detects cycles, and powers topological sort.",sections:[{heading:"The mental model",body:`Both algorithms visit every reachable node exactly once. The only difference is **the order**, which falls directly out of the **frontier data structure**: a **FIFO queue** gives breadth-first (closest-first), a **LIFO stack** gives depth-first (deepest-first).

\`\`\`ascii
         (A)                BFS order: A B C D E F G    (shells around root)
        /   \\                          1 2 2 3 3 3 3
      (B)    (C)
      / \\    / \\             DFS order: A B D E C F G    (drill into one path)
    (D) (E)(F) (G)                       1 2 3 4 5 6 7
\`\`\`

BFS finds the **shortest path** in an unweighted graph because the first time it dequeues a node, that node is at minimum distance from the source. DFS does **not** — it returns the first reachable, not the nearest. That single distinction decides every choice between them.

> Note: A "recursive DFS" is just DFS with the program's call stack as the explicit stack. Iterative DFS with an explicit \`stack\` deque is structurally identical and avoids \`RecursionError\` on deep trees.`},{heading:"Canonical operation — BFS level-order on a tree",body:`Use a queue. Each "level" pop is the current frontier; expanding it produces the next.

\`\`\`py
from collections import deque
def level_order(root):
    if root is None: return []
    q, levels = deque([root]), []
    while q:
        level = []
        for _ in range(len(q)):           # snapshot frontier size
            n = q.popleft()
            level.append(n.val)
            if n.left:  q.append(n.left)
            if n.right: q.append(n.right)
        levels.append(level)
    return levels
\`\`\`

The \`for _ in range(len(q))\` trick freezes the current level's size before appending children — that is how you separate levels without storing depths. Skip the inner loop and you get a flat traversal but lose level boundaries.

\`\`\`py
# Iterative DFS (pre-order)
def preorder(root):
    if root is None: return []
    out, stack = [], [root]
    while stack:
        n = stack.pop()
        out.append(n.val)
        if n.right: stack.append(n.right)   # push right first so left pops first
        if n.left:  stack.append(n.left)
    return out
\`\`\`

> Tip: BFS == queue == levels == shortest unweighted path. DFS == stack == reachability == backtracking. Memorize the four-way pairing and you almost never pick the wrong one.`},{heading:"When to reach for which",body:`**BFS** when: shortest path in an unweighted graph, level-by-level processing, "first one to reach goal," word ladder, rotten oranges, multi-source flood. **DFS** when: connectivity / "is X reachable from Y," cycle detection, topological sort, articulation points / bridges, backtracking enumeration, tree-shape questions (height, diameter, subtree aggregates).

Reach for **Dijkstra** instead of BFS when edges have positive weights. Reach for **0-1 BFS** (deque) when weights are only 0 or 1. Reach for **A\\*** when you have a heuristic that lower-bounds remaining cost. Reach for **iterative deepening DFS** when you need DFS's \`O(d)\` memory but BFS's shortest-path guarantee.`},{heading:"Variants",body:`**Multi-source BFS**: push all sources into the queue at once with distance 0, then run normal BFS. Rotten oranges, distance to nearest 0/1 in a grid.

**0-1 BFS**: for weights ∈ {0, 1}, use a deque — push 0-edges to the front, 1-edges to the back. \`O(V + E)\` instead of \`O((V + E) log V)\`.

**Bidirectional BFS**: search from both source and target; meet in the middle. Cuts effective branching from \`b^d\` to \`2 · b^(d/2)\`. Word Ladder II uses this.

**Iterative DFS** with explicit stack: same shape, no recursion limit.

**DFS with entry / exit times**: timestamp on enter and exit. Enables Tarjan's SCC, Euler tour, ancestor checks via interval inclusion.

**Bidirectional DFS / IDA\\***: iterative deepening combined with heuristic pruning, the workhorse of game-tree search.`},{heading:"Common interview problems",body:["Level order, zigzag level order, right view (BFS).","Number of islands, surrounded regions, flood fill (DFS / BFS).","Word ladder, open the lock, rotten oranges (multi-source BFS).","Detect cycle in directed / undirected graph (DFS with color states).","All paths from source to target; clone graph; pacific-atlantic water flow."]}],complexity:{best:"`O(1)` if the goal is the start node",average:"`O(V + E)` for both BFS and DFS — every vertex and edge touched at most twice",worst:"`O(V + E)` time. BFS shortest-path correctness only on **unweighted** graphs",space:"BFS `O(width)` for the queue; DFS `O(depth)` for the stack — pick the smaller dimension"},pitfalls:["Forgetting to mark a node **visited at enqueue time** (BFS) — duplicates pile up in the queue and the same node is processed multiple times. Mark on push, not on pop.","Using DFS to find the shortest path in an unweighted graph — DFS returns the first path found, not the shortest. Use BFS.","Stack overflow on deep recursive DFS over a long chain — switch to iterative DFS with an explicit deque.","BFS without snapshotting `len(queue)` when you need level boundaries — you lose the level structure and report wrong widths."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"Size of Tree"},{kind:"problem",label:"Depth of Tree"},{kind:"problem",label:"Max Width"},{kind:"problem",label:"Balance Check"},{kind:"problem",label:"Identical Trees"},{kind:"problem",label:"Mirror Tree"},{kind:"problem",label:"Sum Tree"},{kind:"problem",label:"Left View"},{kind:"problem",label:"Right View"},{kind:"problem",label:"Path Sum"},{kind:"problem",label:"Max Path Sum"},{kind:"problem",label:"Serialize and Deserialize"}]},{id:"iterative",label:"Iterative Traversals",items:[{kind:"problem",label:"Inorder"},{kind:"problem",label:"Preorder"},{kind:"problem",label:"Postorder"},{kind:"problem",label:"Morris Inorder"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Longest Sum"},{kind:"problem",label:"Diameter"},{kind:"problem",label:"Boundary Traversal"},{kind:"problem",label:"Tree from Preorder and Inorder"},{kind:"problem",label:"Leaf at Same Level"},{kind:"problem",label:"Connect at Same Level"},{kind:"problem",label:"Nodes without siblings"},{kind:"problem",label:"Invert Tree"},{kind:"problem",label:"Flatten Tree"},{kind:"problem",label:"Max Diff Node & Ancestor"}]},{id:"horizontal",label:"Horizontal Distance Based",items:[{kind:"problem",label:"Vertical Traversal"},{kind:"problem",label:"Bottom View"},{kind:"problem",label:"Top View"},{kind:"problem",label:"Diagonal Traversal"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Spiral Level Order"},{kind:"problem",label:"LCA"},{kind:"problem",label:"Distance K"},{kind:"problem",label:"Distributed Candies"},{kind:"problem",label:"Subtree"}]}]},{slug:"bst",title:"Binary Search Tree",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Binary Search Tree",body:{summary:"A binary tree with the **ordering invariant**: for every node, every value in the left subtree is **strictly less**, and every value in the right subtree is **strictly greater**. That single invariant turns search, insert, and delete into `O(h)` operations — `O(log n)` when balanced, `O(n)` when not. The data structure behind every ordered map / set in standard libraries.",sections:[{heading:"The mental model",body:'A BST is a binary tree whose shape is dictated by **value order**. At any node `v`, "less than `v`" lives left and "greater than `v`" lives right — recursively, for the entire subtree.\n\n```ascii\n           ( 8 )\n          /     \\\n       ( 3 )   (10 )\n       /  \\        \\\n    ( 1 )( 6 )    (14 )\n         /  \\      /\n       (4 )(7 )  (13 )\n\n  in-order traversal: 1 3 4 6 7 8 10 13 14    <- sorted!\n```\n\nThe BST property gives you **sorted iteration for free** (in-order traversal) and **ordered queries**: `floor(x)`, `ceil(x)`, `successor(x)`, `predecessor(x)`, `kth_smallest`. A hash map cannot do any of those.\n\n> Note: The invariant is **subtree-wide**, not just parent-child. A node holding `5` with right child `10` whose left grandchild is `3` is **invalid** — even though `5 < 10` locally, the `3` in the right subtree breaks the rule globally. Local checks miss this; you must pass down `min` / `max` bounds.'},{heading:"Canonical operation — recursive search and insert",body:`Both are three lines once you trust the invariant: compare with the current node, recurse into the matching side.

\`\`\`py
def search(node, key):
    if node is None or node.val == key: return node
    return search(node.left, key) if key < node.val else search(node.right, key)

def insert(node, key):
    if node is None: return Node(key)
    if   key < node.val: node.left  = insert(node.left, key)
    elif key > node.val: node.right = insert(node.right, key)
    return node                              # ignore duplicates (or count)

def validate(node, lo=float('-inf'), hi=float('inf')):
    if node is None: return True
    if not (lo < node.val < hi): return False
    return validate(node.left, lo, node.val) and validate(node.right, node.val, hi)
\`\`\`

Delete is the only operation with real shape: a node with **0 or 1 child** is unlinked directly; a node with **2 children** must be replaced by its **in-order successor** (smallest in the right subtree), then the successor recursively deleted from where it came from.

> Tip: For validation, the **min/max bounds** approach beats the in-order-traversal-and-check approach because it short-circuits on the first violation and uses \`O(h)\` instead of \`O(n)\` space.`},{heading:"When to reach for it",body:"When you need an **ordered map / set** with cheap insert *and* support for range queries, `floor` / `ceil`, predecessor / successor, k-th smallest, or sorted iteration — features a hash map cannot provide. Java `TreeMap`, C++ `std::map` / `std::set`, Python `sortedcontainers.SortedList` all expose BST-flavored APIs (red-black internally).\n\nReach for a **hash map** instead if you only need point queries (membership / lookup). Reach for a **heap** if you only need the extreme. Reach for a **sorted array + binary search** if the set is built once and queried many times without further inserts. Reach for a **Fenwick tree / segment tree** for index-based range queries on a dense numeric domain."},{heading:"Variants",body:"**AVL tree**: strictly height-balanced (`|h_left - h_right| ≤ 1` at every node). Maintained via rotations on insert / delete. Faster lookups than red-black; slightly slower writes.\n\n**Red-Black tree**: weaker balance (height ≤ `2 log(n+1)`) but with fewer rotations → faster insert / delete. Backs `std::map`, Java `TreeMap`, Linux kernel CFS scheduler.\n\n**Treap**: BST keyed on value + heap on a random priority — gives expected `O(log n)` without complex rotation logic.\n\n**Splay tree**: self-adjusting — recently accessed nodes are rotated to the root. Amortized `O(log n)`; great cache behavior for skewed access patterns.\n\n**B-tree / B+ tree**: each node holds many keys; shallow tree → disk-friendly. The structure behind every relational database index.\n\n**Order-statistic tree**: BST augmented with subtree-size at each node → `O(log n)` `kth_smallest` and `rank(x)`. Used in competitive programming via `__gnu_pbds::tree`."},{heading:"Common interview problems",body:["Validate BST (min/max bound recursion, not local comparison).","Kth smallest element in a BST (in-order traversal with early stop).","Lowest common ancestor in BST (split at root: descend left if both keys are smaller, right if both larger, else current node).","Recover BST (exactly two nodes swapped — in-order traversal finds them).","Convert sorted array to balanced BST; convert BST to sorted doubly linked list.","Insert / delete a node; range sum of BST."]}],complexity:{best:"`O(log n)` for search / insert / delete on a balanced BST",average:"`O(log n)` per op on random insertions; in-order traversal `O(n)`",worst:"`O(n)` per op on a fully skewed BST (e.g., sorted insertions without rotations)",space:"`O(n)` for the nodes; `O(h)` recursion depth for any operation"},pitfalls:["Validating a BST by checking only `node.left.val < node.val < node.right.val` **locally** — misses long-range violations where a left-subtree descendant is larger than the root. Fix: pass down `min` / `max` bounds.","Deleting a node with two children — must promote the **in-order successor** (or predecessor) and recursively delete it from where it came from. Skipping the recursive cleanup leaves duplicates or breaks the invariant.","Building a BST by repeatedly inserting **sorted** data — degenerates to a linked list, `O(n)` per op. Use a self-balancing variant or shuffle before insertion.",`Returning a node's left subtree as the "successor" — the in-order successor of a node with two children is the **minimum of the right subtree**, not anywhere in the left.`]}}]},{id:"ops",label:"Operations",items:[{kind:"problem",label:"Search"},{kind:"problem",label:"Insert"},{kind:"problem",label:"Delete"},{kind:"problem",label:"Ceil"},{kind:"problem",label:"Floor"},{kind:"problem",label:"Predecessor and Successor"}]},{id:"traversal",label:"Traversal",items:[{kind:"problem",label:"Kth Smallest Element"},{kind:"problem",label:"2 Sum in BST"}]},{id:"construction",label:"Construction",items:[{kind:"problem",label:"Sorted Array to BST"},{kind:"problem",label:"Merge two BSTs"}]},{id:"property",label:"Property",items:[{kind:"problem",label:"Validate BST"},{kind:"problem",label:"LCA"},{kind:"problem",label:"Recover BST"},{kind:"problem",label:"Largest BST Subtree"}]}]},{slug:"heap",title:"Heap",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Heap",body:{summary:"A **complete binary tree** stored as a flat array, satisfying the **heap property**: every parent is `≤` (min-heap) or `≥` (max-heap) **all** of its children. Peek the extreme in `O(1)`, push and pop in `O(log n)`, build from an unsorted array in `O(n)`. The data structure behind every priority queue.",sections:[{heading:"The mental model",body:`A heap is half tree, half array. The **completeness** invariant (every level full except possibly the last, filled left-to-right) means you never need pointers — child / parent positions are pure arithmetic on the index.

\`\`\`ascii
           [10]                array layout (0-indexed)
          /    \\
        [15]   [20]            +----+----+----+----+----+----+----+
        /  \\   /  \\            | 10 | 15 | 20 | 17 | 25 | 30 | 40 |
      [17][25][30][40]         +----+----+----+----+----+----+----+
                                  0    1    2    3    4    5    6

   parent(i) = (i - 1) / 2
   left(i)   = 2 * i + 1
   right(i)  = 2 * i + 2
\`\`\`

The heap order is **local**: each node compares only against its own children. That locality is why a single insertion or deletion only ripples \`O(log n)\` levels.

> Note: A heap is **not** a sorted set. You can only see the root. The other elements are partially ordered — iterating the array gives no useful order. Anyone who tries to "just look at index 5 for the 5th smallest" has misunderstood the structure.`},{heading:"Canonical operation — sift-up on push",body:"Append the new element at the next free slot (preserving completeness), then bubble it up: swap with its parent while it violates the heap order. At most `log n` swaps.\n\n```py\ndef push(heap, x):\n    heap.append(x)\n    i = len(heap) - 1\n    while i > 0:\n        parent = (i - 1) // 2\n        if heap[parent] <= heap[i]:    # min-heap: parent must be smaller\n            break\n        heap[i], heap[parent] = heap[parent], heap[i]\n        i = parent\n\ndef pop(heap):                          # remove the min\n    out = heap[0]\n    last = heap.pop()                   # remove physical last slot\n    if heap:\n        heap[0] = last                  # move it to the root\n        sift_down(heap, 0)              # repair downward\n    return out\n```\n\nBuilding a heap from an unsorted array of `n` elements is **`O(n)`**, not `O(n log n)`: call `sift_down` from index `n // 2 - 1` down to `0`. Most leaves do zero work; the deeper subtrees are few and small.\n\n> Tip: Use the language stdlib. Python's `heapq`, Java's `PriorityQueue`, C++'s `priority_queue` are all production-tuned. Roll your own only when you need indexed-heap features (decrease-key) the stdlib does not provide."},{heading:"When to reach for it",body:'Whenever an algorithm needs "give me the smallest / largest next" repeatedly — and the set is not static. Concrete patterns: **top-K** (maintain a heap of size K — push every element, pop when it grows past K). **K-way merge** (push the head of each sorted list, pop the smallest, advance that list). **Streaming median** (max-heap for the lower half, min-heap for the upper half; balance so sizes differ by ≤ 1). **Dijkstra\'s shortest path** (min-heap of `(distance, node)`). **Event-driven simulation** (min-heap of `(timestamp, event)`).\n\nReach for a **sorted set** (`TreeSet` / `std::set`) when you also need to delete or query arbitrary elements, not just the extreme. Reach for **quickselect** when you need the K-th element of a static array in expected `O(n)` and do not care about the other K-1.'},{heading:"Variants",body:'**Binary heap**: the array-backed structure above. The default.\n\n**d-ary heap**: each node has `d` children instead of 2. Shallower tree → faster `push` (`log_d n`) but slower `pop` (`d * log_d n` comparisons in sift-down). `d = 4` is a common sweet spot for cache locality.\n\n**Indexed heap** (a.k.a. addressable / handle-based): maps an external id to its heap position so `decrease-key` is `O(log n)`. Required for the textbook version of Dijkstra and Prim. Most stdlibs do **not** ship this — you either implement it or use the "push duplicates, lazily skip stale entries" workaround.\n\n**Fibonacci heap**: `O(1)` amortized `push` and `decrease-key`, `O(log n)` amortized `pop`. Beautiful theory; constants are so large that binary heaps win in practice except on enormous graphs.\n\n**Pairing heap**: simpler than Fibonacci with similar amortized bounds. Used in the GNU C++ `__gnu_pbds::priority_queue`.\n\n**Two-heap median trick**: max-heap (lower half) + min-heap (upper half), rebalance after each insert. `O(log n)` insert, `O(1)` median.'},{heading:"Common interview problems",body:["Kth Largest Element in an Array, Top K Frequent Elements.","Merge K Sorted Lists / sorted streams.","Find Median from Data Stream (max-heap + min-heap).","Task Scheduler, Reorganize String, Connect Ropes with Minimum Cost."]}],complexity:{best:"`peek` `O(1)`; `push` `O(1)` average (no bubble needed)",average:"`push` and `pop` `O(log n)`; building a heap from `n` items `O(n)` via Floyd",worst:"`push` and `pop` `O(log n)`; heapsort `O(n log n)`",space:"`O(n)` for the array; `O(1)` extra per operation"},pitfalls:["Treating the heap as a sorted array — iterating the underlying array does **not** yield sorted order, only the root is guaranteed extreme.","Trying to `decrease-key` on a stdlib heap that does not support it — most do not. Workaround: push a fresh `(new_priority, id)` and skip stale entries on pop using a `visited` set.","Confusing min-heap and max-heap defaults — Python `heapq` and Java `PriorityQueue` are **min-heaps**; for a max-heap, negate values or push `(-priority, id)` tuples.","Building a heap with repeated `push` calls — that's `O(n log n)`. Use `heapify` (Python `heapq.heapify`, Java `new PriorityQueue<>(list)`) for `O(n)`."]}},{kind:"theory",label:"Heap Sort",conceptSlug:"heap-sort",body:{summary:"An **in-place**, **comparison-based**, **`O(n log n)` worst-case** sorting algorithm. Build a max-heap on the input array, then repeatedly swap the root with the last unsorted slot and shrink the heap by one. No extra memory, no recursion, no quadratic blowup on adversarial input — but **not stable** and slow in practice vs. introsort / Timsort.",sections:[{heading:"The mental model",body:"Heap sort is two phases performed on the same array — no copy, no auxiliary buffer.\n\n**Phase 1 — heapify**: turn the array into a max-heap in `O(n)` using Floyd's bottom-up `sift_down` from index `n/2 - 1` down to `0`.\n\n**Phase 2 — repeated extract-max**: swap `arr[0]` (the max) with `arr[n-1]` (the last unsorted slot), shrink the heap by one, sift the new root down. Repeat until the heap has one element. The array is now sorted ascending.\n\n```ascii\n start:                heapified:            after one extract:\n [4,10,3,5,1]          [10,5,3,4,1]          [5,4,3,1, | 10]\n                                                         ^\n                                                       sorted tail\n\n          ... repeat ...\n\n end:  [1,3,4,5,10]\n```\n\n> Note: The sorted region grows from the **right** end of the array; the heap shrinks from the right boundary. This is why max-heap (not min-heap) gives ascending order — the largest element is pulled out first and parked at the back where it belongs."},{heading:"Canonical operation — in-place sort",body:`Two helpers (\`sift_down\` and \`heapify\`) and a single loop. Note \`sift_down\` takes an explicit \`size\` argument so it ignores the already-sorted tail.

\`\`\`py
def sift_down(arr, i, size):
    while True:
        l, r = 2 * i + 1, 2 * i + 2
        largest = i
        if l < size and arr[l] > arr[largest]: largest = l
        if r < size and arr[r] > arr[largest]: largest = r
        if largest == i: return
        arr[i], arr[largest] = arr[largest], arr[i]
        i = largest

def heap_sort(arr):
    n = len(arr)
    # phase 1: build max-heap, O(n)
    for i in range(n // 2 - 1, -1, -1):
        sift_down(arr, i, n)
    # phase 2: extract max one at a time
    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]   # park max at the tail
        sift_down(arr, 0, end)                # heap shrinks to size = end
\`\`\`

The second loop performs \`n - 1\` extracts, each \`O(log n)\` → \`O(n log n)\` total. The first loop is \`O(n)\`, dominated.

> Tip: For descending order use a **min-heap** instead — the smallest gets parked at the tail, sorted region ends up descending.`},{heading:"When to reach for it",body:'Use heap sort when you need **strict `O(n log n)` worst case** and **`O(1)` extra memory** with no recursion stack. Two real-world niches: **embedded / safety-critical code** where the recursion of quicksort and the buffer of mergesort are both unacceptable; and **adversarial inputs** where quicksort\'s `O(n^2)` worst case is a denial-of-service vector.\n\nDo **not** reach for it as a general-purpose sort. **Quicksort** beats it by a 2-3x constant factor on random data (better cache behavior, fewer comparisons), and modern stdlibs (Java\'s **Timsort**, C++\'s **introsort**) beat both. The stdlib `sort()` is almost always the right answer; heap sort is the right answer when the question is "implement a sort with `O(1)` extra space and provable `O(n log n)` worst case" or "the input might be adversarial."\n\nThe related technique that **does** matter in interviews is **partial heap sort**: build a heap of size K and extract K times for the top-K problem — `O(n + k log n)`, smaller constants than full sort.'},{heading:"Variants",body:"**In-place classic** (the implementation above): max-heap → repeated swap-and-shrink. The textbook version.\n\n**Floyd's sift-down with bounce**: skip the comparison step on the way down (always pick the larger child), then bubble up from the leaf if needed. Cuts comparisons by ~50% in the average case; rarely worth the complexity.\n\n**Bottom-up heapify** (phase 1 above) is `O(n)`; the alternative — `n` repeated pushes — is `O(n log n)`. Always heapify when you have the array upfront.\n\n**External heap sort**: when the input does not fit in memory, build heaps on disk chunks and merge — k-way merge of sorted runs is the actual algorithm used (this is *replacement selection* in classic external-sort literature).\n\n**Smoothsort** (Dijkstra): an adaptive variant that runs in `O(n)` on nearly-sorted input and `O(n log n)` worst case. Theoretically elegant; the constants make it unused in practice — Timsort fills the same niche better.\n\n**Heap-select / quickselect hybrids**: use heap sort's phase 1 to get an `O(n)` max-heap, then extract `K` times for top-K in `O(n + k log n)`."},{heading:"Common interview problems",body:["Implement heap sort in place using `sift_down`.","Sort a nearly-sorted (k-sorted) array in `O(n log k)` using a min-heap of size `k+1`.","Find the top K largest elements using partial heap sort.","Sort a stream of incoming elements (online sort) using a heap."]}],complexity:{best:"`O(n log n)` — heap sort does not adapt to pre-sorted input (unlike Timsort)",average:"`O(n log n)`",worst:"`O(n log n)` — the headline guarantee; no quicksort-style adversarial blowup",space:"`O(1)` extra — fully in-place, iterative, no recursion stack"},pitfalls:["Not passing the shrinking heap size to `sift_down` — the algorithm sifts into the already-sorted tail and corrupts everything. Always pass an explicit `size` parameter.","Building the heap with `n` repeated `push` calls (`O(n log n)`) instead of the bottom-up `heapify` (`O(n)`). The starting loop must run from `n/2 - 1` down to `0`.","Expecting stability — heap sort is **not stable**. Equal elements may swap relative order. Use Timsort or mergesort if stability matters.","Picking heap sort as the default general-purpose sort — on random arrays it loses to quicksort and Timsort by a meaningful constant. Choose it for `O(1)` space or hard worst-case guarantees, not for raw speed."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"Check for Heap"},{kind:"problem",label:"Heap Sort"},{kind:"problem",label:"kth Largest"},{kind:"problem",label:"K Largests"},{kind:"problem",label:"Height of a Heap"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Connect n ropes"},{kind:"problem",label:"Nearly Sorted"},{kind:"problem",label:"BST to Min Heap"},{kind:"problem",label:"K Max sum combinations"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Median in a stream"},{kind:"problem",label:"K'th largest in a stream"},{kind:"problem",label:"Merge k sorted"},{kind:"problem",label:"Range Covering K Sorted Lists"},{kind:"problem",label:"The Skyline Problem"},{kind:"problem",label:"Sort by Frequency"}]}]},{slug:"graph",title:"Graph",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Graph Representation",body:{summary:"A graph `G = (V, E)` is encoded in three standard forms: **adjacency list**, **adjacency matrix**, or **edge list**. The choice is not stylistic — it pins down every downstream complexity. Sparse graphs with traversal-heavy algorithms want adjacency list; dense graphs or all-pairs queries want matrix; algorithms that iterate edges (Kruskal, Bellman-Ford) want edge list. Picking wrong burns memory or turns an `O(V + E)` algorithm into `O(V^2)`.",sections:[{heading:"Mental model",body:"Same graph, three encodings. `V = 4`, edges `(0,1)`, `(0,2)`, `(1,2)`, `(2,3)`.\n\n```ascii\n The graph:               Adjacency list:        Adjacency matrix:\n                                                    0 1 2 3\n   (0) -- (1)              0: [1, 2]              0 [0 1 1 0]\n    |   /                  1: [0, 2]              1 [1 0 1 0]\n    | /                    2: [0, 1, 3]           2 [1 1 0 1]\n   (2) -- (3)              3: [2]                 3 [0 0 1 0]\n\n                          Edge list:\n                          [(0,1), (0,2), (1,2), (2,3)]\n```\n\nThe trade-off has two axes: **memory** (list `O(V + E)` vs matrix `O(V^2)`) and **edge-existence query cost** (list `O(deg v)` vs matrix `O(1)`). A graph with `V = 10^5` and `E = 2·10^5` consumes ~2 MB as a list and **40 GB** as a matrix — the latter is impossible. A graph with `V = 1000` and `E = 400{,}000` (near complete) is happier as a 1 MB matrix than as a hash-map-of-lists.\n\n> Note: An **undirected** edge `(u, v)` must appear in **both** `adj[u]` and `adj[v]`. Forgetting one direction is the most common graph bug — BFS/DFS silently misses half the connections."},{heading:"Canonical operation",body:`Build all three from an edge list in the four interview languages.

\`\`\`py
# Python — adjacency list via defaultdict
from collections import defaultdict
def build_list(n, edges, directed=False):
    adj = defaultdict(list)
    for u, v, *w in edges:
        adj[u].append((v, w[0] if w else 1))
        if not directed:
            adj[v].append((u, w[0] if w else 1))
    return adj

# Adjacency matrix (weighted, 0 = no edge)
def build_matrix(n, edges, directed=False):
    M = [[0]*n for _ in range(n)]
    for u, v, *w in edges:
        M[u][v] = w[0] if w else 1
        if not directed:
            M[v][u] = w[0] if w else 1
    return M
\`\`\`

\`\`\`cpp
// C++ — vector<vector<int>> is the workhorse adjacency list
vector<vector<pair<int,int>>> adj(n);   // pair = (neighbor, weight)
for (auto& [u, v, w] : edges) {
    adj[u].push_back({v, w});
    if (!directed) adj[v].push_back({u, w});
}

// CSR (Compressed Sparse Row) — fastest cache-friendly form for huge graphs
vector<int> head(n + 1, 0), to(E);
for (auto& [u, v, w] : edges) head[u + 1]++;
for (int i = 1; i <= n; ++i) head[i] += head[i - 1];
vector<int> idx = head;
for (auto& [u, v, w] : edges) to[idx[u]++] = v;
\`\`\`

\`\`\`java
// Java — ArrayList per vertex, or int[][] for known-degree graphs
List<List<int[]>> adj = new ArrayList<>();
for (int i = 0; i < n; ++i) adj.add(new ArrayList<>());
for (int[] e : edges) {
    adj.get(e[0]).add(new int[]{e[1], e[2]});
    if (!directed) adj.get(e[1]).add(new int[]{e[0], e[2]});
}
\`\`\`

> Tip: For graphs with \`E > 10^7\`, switch to **CSR** (Compressed Sparse Row) — two flat arrays, zero pointer chasing, fits in cache. The 2-3x speedup matters.`},{heading:"When to reach for which",body:'Reach for **adjacency list** as your default — every BFS, DFS, Dijkstra, Bellman-Ford, Kosaraju, Tarjan SCC algorithm consumes graphs as lists. The space and per-neighbor cost both match what those algorithms actually do. Reach for **adjacency matrix** when `V ≤ ~10^3` AND you need fast "is there an edge `(u, v)`?" queries (Floyd-Warshall, transitive closure, all-pairs shortest paths via repeated squaring, biclique detection). Reach for **edge list** when the algorithm naturally iterates edges and ignores adjacency (Kruskal\'s MST, Bellman-Ford). Reach for **CSR** for huge static graphs where cache locality matters. Reach for **implicit graph** (no stored structure, neighbors generated on demand) for grid problems and state-space search like the 15-puzzle.'},{heading:"Variants",body:'**Weighted vs unweighted** — lists store `(neighbor, weight)` tuples; matrices use `0` or `INF` for "no edge."\n\n**Directed vs undirected** — undirected edges go in both adjacency lists; directed only in the source\'s list.\n\n**Multigraph (parallel edges)** — adjacency list naturally allows; matrix needs to store counts; edge list is unchanged.\n\n**Self-loops** — `(u, u)` entries. Some algorithms tolerate them, some don\'t (Dijkstra is fine, simple-graph topological sort is not).\n\n**Bipartite** — store as two adjacency lists keyed by partition for clarity.\n\n**Implicit graph** — never materialized. Grid problems generate neighbors as `(r±1, c)`, `(r, c±1)`. Saves memory but each "edge query" pays for the validity check.\n\n**Compressed Sparse Row (CSR)** — two arrays, `head[v]` and `to[]`, neighbors of `v` sit at `to[head[v] .. head[v+1])`. Cache-friendly; standard for scientific-computing graphs.\n\n**Hash-map adjacency** — when vertex IDs are arbitrary strings or sparse integers, swap the outer array for a hash map.'},{heading:"Common interview problems",body:["Number of Islands (LeetCode 200) — implicit grid graph, DFS/BFS.","Course Schedule (LeetCode 207) — adjacency list, topological sort / cycle detection.","Clone Graph (LeetCode 133) — DFS over an adjacency-list graph, hash map to track visited.","Network Delay Time (LeetCode 743) — adjacency list, Dijkstra.","Cheapest Flights Within K Stops (LeetCode 787) — adjacency list, Bellman-Ford or modified BFS.","Reconstruct Itinerary (LeetCode 332) — adjacency list with sorted neighbors, Hierholzer's algorithm for Eulerian path.","Find the City With the Smallest Number of Neighbors at a Threshold Distance (LeetCode 1334) — adjacency matrix, Floyd-Warshall."]}],complexity:{build:"List: `O(V + E)`. Matrix: `O(V^2)`. Edge list: `O(E)`.",operation:"Edge query — list `O(deg v)`, matrix `O(1)`, edge list `O(E)`. Enumerate neighbors — list `O(deg v)`, matrix `O(V)`.",time:"BFS / DFS on list `O(V + E)`; on matrix `O(V^2)`. Dijkstra with binary heap on list `O((V + E) log V)`.",space:"List `O(V + E)`. Matrix `O(V^2)`. Edge list `O(E)`. CSR `O(V + E)` with the best constant factor."},pitfalls:['**Adding only one direction of an undirected edge.** BFS / DFS silently traverses half the graph and returns "wrong but plausible" answers. **Fix:** make `addEdge(u, v)` push to both `adj[u]` and `adj[v]` for undirected graphs; assert in tests that `v ∈ adj[u] ⇔ u ∈ adj[v]`.',"**Using a matrix when `V ≥ 10^4`.** `V = 10^5` means `10^{10}` cells — guaranteed OOM. **Fix:** default to adjacency list; reach for matrix only when `V ≤ 1000` AND the algorithm genuinely needs `O(1)` edge queries (Floyd-Warshall).","**Not deduplicating edges in problems forbidding multi-edges.** Reading the same edge twice silently doubles its weight contribution in some algorithms. **Fix:** store the edge set in a `HashSet<Pair>` first, then build the adjacency structure.","**Storing vertex IDs as arbitrary strings in an array.** Indexing into `adj[]` requires integer IDs. **Fix:** pre-process with a string-to-int map; build the graph on integers; map back only for output.","**Forgetting that `Σ deg(v) = 2E` for undirected graphs.** Sizing the inner vectors at `E` instead of `2E` for undirected edges undercounts capacity. **Fix:** when reserving up front, allocate `2E` for undirected, `E` for directed."]}},{kind:"theory",label:"BFS & DFS",conceptSlug:"bfs-dfs",body:{summary:"**BFS** (breadth-first search) explores level-by-level using a **queue** — finds the shortest path in an unweighted graph. **DFS** (depth-first search) explores one branch all the way down using a **stack** (or recursion) — detects cycles, drives topological sort, and powers connectivity / SCC algorithms.",sections:[{heading:"The mental model",body:`Both visit every reachable node exactly once. The difference is **order**, set entirely by the **frontier data structure**: a FIFO **queue** gives breadth-first (closest-first); a LIFO **stack** gives depth-first (deepest-first).

\`\`\`ascii
  graph:        (A)             BFS from A:  A -> B,C -> D,E
               /   \\
             (B)   (C)          DFS from A:  A -> B -> D -> E -> C
             / \\
           (D) (E)
\`\`\`

BFS gives **shortest unweighted path** because the first time it dequeues a node, that node is at minimum distance from the source. DFS does **not**. That single property decides the choice between them.

> Note: Always mark a node **visited at the moment you enqueue it**, not when you pop. Otherwise duplicates pile up in the queue and the same node is processed multiple times.`},{heading:"Canonical operation — BFS shortest path in an unweighted graph",body:`\`\`\`py
from collections import deque
def shortest_path(adj, src, dst):
    dist = {src: 0}
    q = deque([src])
    while q:
        u = q.popleft()
        if u == dst: return dist[u]
        for v in adj[u]:
            if v not in dist:                # mark on enqueue
                dist[v] = dist[u] + 1
                q.append(v)
    return -1

# DFS for cycle detection in a directed graph (three-color)
def has_cycle(adj):
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {u: WHITE for u in adj}
    def dfs(u):
        color[u] = GRAY
        for v in adj[u]:
            if color[v] == GRAY:    return True   # back-edge -> cycle
            if color[v] == WHITE and dfs(v): return True
        color[u] = BLACK
        return False
    return any(dfs(u) for u in adj if color[u] == WHITE)
\`\`\`

The **three-color** DFS (white / gray / black) is the workhorse of cycle detection, topological sort, and SCC algorithms in directed graphs. Gray = "on the current DFS stack"; a gray-to-gray edge is a back-edge and proves a cycle.

> Tip: BFS == queue == levels == shortest unweighted. DFS == stack == reachability == ordering. Memorize the pairing and you almost never pick the wrong tool.`},{heading:"When to reach for which",body:`**BFS**: shortest path in an unweighted graph, level-by-level processing, multi-source flood (rotten oranges, distance to nearest), word ladder, bipartite check by 2-coloring.

**DFS**: connectivity ("is X reachable from Y"), cycle detection, topological sort, articulation points / bridges (Tarjan), strongly connected components (Kosaraju / Tarjan), backtracking enumeration.

Reach for **Dijkstra** when edges have positive weights, **0-1 BFS** (deque) when weights are in {0, 1}, **A\\*** when you have a heuristic, **Bellman-Ford** when weights can be negative.`},{heading:"Variants",body:"**Multi-source BFS**: push *all* sources with distance 0, then run normal BFS. The whole-grid distance map computes in `O(V + E)`.\n\n**0-1 BFS**: deque-based; 0-edges to the front, 1-edges to the back. `O(V + E)` for weights ∈ {0, 1}.\n\n**Bidirectional BFS**: search from source and target simultaneously, meet in the middle. Cuts effective branching from `b^d` to `2 · b^(d/2)`.\n\n**Iterative DFS** with explicit stack: avoids `RecursionError` on deep graphs; identical semantics.\n\n**DFS with entry / exit timestamps**: enables Tarjan SCC, Euler tour, ancestor-check via interval inclusion.\n\n**Tarjan SCC**: single-pass DFS using lowlink values to identify strongly connected components in `O(V + E)`."},{heading:"Common interview problems",body:["Number of islands; surrounded regions; flood fill (DFS or BFS).","Rotten oranges, walls and gates (multi-source BFS).","Word ladder, open the lock (BFS, often bidirectional).","Detect cycle in directed / undirected graph; course schedule (topological sort via DFS or Kahn).","Clone graph; pacific-atlantic water flow; all paths from source to target."]}],complexity:{best:"`O(1)` if the goal is the start node",average:"`O(V + E)` for both BFS and DFS — every vertex and edge touched at most twice",worst:"`O(V + E)`. BFS shortest-path correctness only on **unweighted** graphs",space:"BFS `O(width)` for the queue; DFS `O(depth)` for the stack"},pitfalls:["Marking visited on **pop** instead of **push** in BFS — same node enqueued many times, queue blows up and complexity degrades.","Using DFS to find shortest path in an unweighted graph — DFS returns the first path found, not the shortest.","Forgetting that an undirected edge needs two adjacency entries (`adj[u].push(v)` and `adj[v].push(u)`).",'Cycle detection on a **directed** graph using the undirected pattern ("any seen neighbor that is not parent") — wrong, because directed graphs need the three-color back-edge test.']}}]},{id:"bfs-dfs",label:"BFS/DFS Traversal",items:[{kind:"problem",label:"BFS"},{kind:"problem",label:"DFS"},{kind:"problem",label:"Flood Fill"},{kind:"problem",label:"Islands"},{kind:"problem",label:"Connected Components in an Undirected Graph"},{kind:"problem",label:"Cycle in an Undirected graph"},{kind:"problem",label:"Cycle in a Directed"},{kind:"problem",label:"Bipartite"},{kind:"problem",label:"Rotten Oranges"},{kind:"problem",label:"Remove Invalid Parentheses"}]},{id:"topo",label:"Topological Sorting",items:[{kind:"theory",label:"Topological Sort",conceptSlug:"topological-sort",body:{summary:"A linear ordering of the vertices of a **directed acyclic graph (DAG)** such that for every edge `u -> v`, `u` comes **before** `v`. Exists if and only if the graph has no cycle. Two standard algorithms: **Kahn's** (BFS on in-degrees) and **DFS post-order reverse**. Both `O(V + E)`.",sections:[{heading:"The mental model",body:`Picture every edge \`u -> v\` as the constraint "**\`u\` must happen before \`v\`**." A topological sort is a schedule that satisfies every constraint simultaneously.

\`\`\`ascii
   prerequisites:                 valid orderings:
      shoes  -> tie               socks, shoes, pants, shirt, tie
      socks  -> shoes             pants, shirt, socks, shoes, tie
      pants  -> shoes             shirt, socks, pants, shoes, tie
      shirt  -> tie               (any topo order works)

       (socks)   (pants)  (shirt)
          \\        |        |
           v       v        |
           (shoes)          |
               \\            |
                v           v
                 (tie) <----
\`\`\`

The **cycle ⇔ no ordering** equivalence is the heart of the algorithm: a cycle \`a -> b -> a\` demands \`a < b\` and \`b < a\` simultaneously — contradiction.

> Note: A DAG may have **many** valid topological orderings (anywhere there is no edge between two vertices, their relative order is free). Different algorithms (Kahn vs DFS) produce different specific orderings — both correct.`},{heading:"Canonical operation — Kahn's algorithm (BFS on in-degrees)",body:`Compute in-degrees, queue every zero-in-degree vertex, repeatedly pop and decrement neighbors. If the result's length is less than \`V\`, the graph has a cycle.

\`\`\`py
from collections import deque
def topo_sort(n, edges):                       # vertices 0..n-1
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1

    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    if len(order) != n: return None             # cycle detected
    return order
\`\`\`

The DFS-based variant is even shorter: run DFS from every unvisited vertex, append each vertex to a list at the moment it finishes (post-order), then reverse the list. Cycle detection requires the three-color (white/gray/black) augmentation.

> Tip: Kahn's gives you "the natural starting points first" (sources of the DAG); DFS post-order gives you "the deepest dependencies first." Choose by what the problem reports — Kahn for "course schedule order," DFS for "build dependency tree."`},{heading:"When to reach for it",body:'Whenever the problem describes **dependencies** with a "do X before Y" constraint: course prerequisites, build systems (make, bazel), task schedulers with precedence, package managers resolving install order, deserializing types referencing other types, function call ordering in static analysis, alien dictionary character order from sorted words.\n\nReach for **strongly connected components** (Kosaraju / Tarjan) instead when the graph has cycles but you want to topologically order the *condensation* (components as super-nodes). Reach for **shortest-path DP on a DAG** when each node has a weight and you want the longest / shortest path — topological order lets you DP in `O(V + E)`.'},{heading:"Variants",body:`**Kahn's** (BFS on in-degrees): processes vertices in BFS layers; produces lexicographically smallest order if the queue is a priority queue. Naturally detects cycles by leftover vertices.

**DFS post-order reverse**: append on DFS finish, reverse the list at the end. Requires three-color cycle detection.

**Lexicographically smallest topological order**: replace Kahn's queue with a min-heap of currently-available vertices.

**All topological orderings**: backtracking — at each step, branch on every currently-zero-in-degree vertex. Exponential.

**Parallel scheduling**: each Kahn layer can run in parallel; layer count = "critical path length." Used in build systems.

**DAG DP**: after topological sort, run a single pass to compute longest path, shortest path, count of paths, etc. Each in \`O(V + E)\`.`},{heading:"Common interview problems",body:["Course Schedule I — can you finish all courses given prerequisites? (cycle check).","Course Schedule II — return a valid order, or empty if impossible.","Alien Dictionary — derive character ordering from a list of sorted words.","Minimum height trees — leaves repeatedly peeled (Kahn variant).","Parallel courses — group into semesters; depth of the DAG.","Reconstruct itinerary; build order in Cracking the Coding Interview."]}],complexity:{best:"`O(V + E)` — even on a perfectly linear DAG every vertex and edge is touched once",average:"`O(V + E)` for both Kahn and DFS variants",worst:"`O(V + E)`; lexicographically-smallest variant is `O(V log V + E)` due to the min-heap",space:"`O(V + E)` for the adjacency list and in-degree array; `O(V)` for the queue / recursion stack"},pitfalls:["Running topological sort on a graph that contains a cycle without detection — produces a partial ordering that violates the dependency invariant. Always check `len(order) == V` (Kahn) or use three-color DFS.","Computing in-degrees from `len(adj[v])` — that is the **out**-degree. In-degree must be counted by iterating every edge and incrementing the target.","Forgetting that topological order is **not unique** — tests that compare against one specific order will spuriously fail. Validate by replaying the constraints instead.",'Using BFS layer count as the answer to "minimum number of semesters" without ensuring every node is enqueued when its in-degree hits zero — off-by-one when isolated vertices exist.']}},{kind:"problem",label:"Course Schedule I"},{kind:"problem",label:"Course Schedule II"},{kind:"problem",label:"Alien Dictionary"}]},{id:"shortest",label:"Shortest Path",items:[{kind:"theory",label:"Dijkstra's Algorithm",conceptSlug:"dijkstras-algorithm",body:{summary:"Single-source shortest path on a graph with **non-negative** edge weights. Greedy: at every step, pull the unvisited vertex with the smallest tentative distance, relax its neighbors. With a binary heap: **`O((V + E) log V)`**. Fails on negative edges — use Bellman-Ford for those.",sections:[{heading:"The mental model",body:`BFS finds shortest paths in unweighted graphs because every edge costs 1 — the first time you reach a node, you reach it cheapest. **Dijkstra** generalizes this: replace the FIFO queue with a **min-heap** keyed on tentative distance, so the next vertex popped is always the one currently closest to the source.

\`\`\`ascii
   start at A, weights on edges:

          (B)----4----(D)
         / |          /
        2  1         3
       /   |        /
     (A)   |     (E)
       \\   |    /
        5  |  2
         \\ | /
          (C)

   pop order:  A(0) -> B(2) -> C(3) -> D(6) -> E(5)
                                            ^ wait
\`\`\`

The critical invariant: **when a vertex is popped, its distance is finalized**. The proof rests on non-negativity — any future path through other vertices can only get longer, never shorter, by passing through edges with non-negative cost.

> Note: With negative edges the invariant breaks — a "cheap" vertex popped early might be reachable later via a route that dips through a negative edge. Always check the precondition before reaching for Dijkstra.`},{heading:"Canonical operation — Dijkstra with a min-heap",body:`The "**lazy**" version: push every relaxation; skip stale entries on pop. Avoids needing a decrease-key operation that most heap stdlibs do not provide.

\`\`\`py
import heapq
def dijkstra(adj, src, n):
    INF = float('inf')
    dist = [INF] * n
    dist[src] = 0
    heap = [(0, src)]                        # (distance, vertex)
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue             # stale entry — skip
        for v, w in adj[u]:                  # w = weight of edge u->v
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist
\`\`\`

Every edge is relaxed at most once *per stale push* it triggers. With \`E\` edges and \`log V\` heap cost, total work is \`O((V + E) log V)\`. With a Fibonacci heap and proper decrease-key, you can hit \`O(E + V log V)\` — beautiful in theory, slower in practice due to constants.

> Tip: To recover the **actual path**, store a \`prev[v] = u\` whenever you relax \`v\` via \`u\`, then walk back from the target.`},{heading:"When to reach for it",body:`Single-source shortest path with **non-negative** edge weights — road networks (Maps), routing (OSPF), latency-aware service mesh, weighted grids (King's move with terrain cost), word-ladder with weighted transitions.

Do **not** use it when:
- Edges can be **negative** → Bellman-Ford.
- All edges have **equal weight** → plain BFS (\`O(V + E)\`, smaller constants).
- Weights are only **0 or 1** → 0-1 BFS with a deque (\`O(V + E)\`).
- You need **all-pairs** shortest paths on a dense graph → Floyd-Warshall (\`O(V^3)\`).
- You have a **good heuristic** to the goal → A* (Dijkstra with a heuristic priority).`},{heading:"Variants",body:`**Lazy Dijkstra** (above): push duplicates, skip stale on pop. Simplest, used everywhere.

**Eager Dijkstra**: indexed priority queue with \`decrease-key\`. Avoids stale entries, runs slightly faster on dense graphs.

**Bidirectional Dijkstra**: run from source and target simultaneously, terminate when frontiers meet. Cuts work dramatically on long-path queries (road networks).

**A\\***: Dijkstra with a priority of \`g(v) + h(v)\` where \`h\` is an admissible heuristic. Finds the optimal path while exploring far fewer nodes.

**Dial's algorithm**: bucket-based, \`O(V + E + maxW)\` for small integer weights.

**Dijkstra on a DAG**: replace heap with topological sort; \`O(V + E)\` and works with negative edges (no cycle ⇒ greedy stays valid).

**K-shortest paths (Yen, Eppstein)**: top-K shortest paths from source to target, not just the single best.`},{heading:"Common interview problems",body:["Network Delay Time — single-source shortest path on a directed weighted graph.","Cheapest Flights Within K Stops — Dijkstra with a state of `(node, stops)` or Bellman-Ford limited to K iterations.","Path with Minimum Effort — Dijkstra where edge cost is `max(|h1 - h2|)`.","Swim in Rising Water — Dijkstra on a grid with time-as-elevation cost.","Minimum cost path in a weighted grid; shortest path in a binary matrix (0-1 BFS).","Reconstruct shortest path itinerary; second-best shortest path."]}],complexity:{best:"`O(V + E)` if the target is popped before most of the heap is touched",average:"`O((V + E) log V)` with a binary heap; `O(V^2)` with an array (better for very dense graphs)",worst:"`O((V + E) log V)` — every edge can trigger a stale heap push",space:"`O(V + E)` for adjacency list + heap; `O(V)` for the distance array"},pitfalls:["Running Dijkstra on a graph with **negative edges** — silently returns wrong distances. The first-popped invariant breaks. Use Bellman-Ford or SPFA.","Not checking `if d > dist[u]: continue` in the lazy version — re-processes stale heap entries, complexity blows up to `O(E^2 / V)` on dense graphs.",`Using BFS's "mark visited on enqueue" mental model and skipping vertices that already have a tentative distance — must allow relaxation while in the heap. Finalize only on pop.`,"Mixing up `(distance, vertex)` and `(vertex, distance)` tuple order — Python `heapq` sorts by the first element. Distance must be first."]}},{kind:"theory",label:"Bellman-Ford",conceptSlug:"bellman-ford",body:{summary:"Single-source shortest path that **handles negative edge weights** and **detects negative cycles**. Brute-relaxes every edge `V - 1` times in **`O(V × E)`**. Slower than Dijkstra on non-negative graphs; the only correct choice when negatives are possible.",sections:[{heading:"The mental model",body:'A shortest path in a graph with `V` vertices uses **at most `V - 1` edges** (more would mean a repeated vertex, i.e., a cycle — and the only useful cycle on a shortest path would have negative total weight, which we explicitly detect).\n\nSo: after `i` rounds of "relax every edge once," `dist[v]` is **correct for any vertex reachable via at most `i` edges**. After `V - 1` rounds, every shortest path is found.\n\n```ascii\n  edges: A->B(1), B->C(-3), A->C(4)\n\n  initial:    dist = [A:0, B:inf, C:inf]\n\n  round 1:    relax A->B  -> dist[B] = 1\n              relax B->C  -> dist[C] = -2     (was inf)\n              relax A->C  -> 4 not better; skip\n\n  round 2:    no improvement -> done early\n```\n\nNotice round 1 fixed *both* `B` and `C` only because we relaxed `A->B` before `B->C`. Bellman-Ford guarantees correctness regardless of relaxation order by running enough rounds; the early-exit optimization just helps when the order happens to be good.\n\n> Note: A **negative cycle** reachable from the source means "no shortest path exists" — you could loop the cycle forever to drive cost to `-∞`. Bellman-Ford detects this by running **one extra round** (the `V`-th); any edge that still relaxes is on (or downstream of) a negative cycle.'},{heading:"Canonical operation — Bellman-Ford with negative-cycle detection",body:`\`\`\`py
def bellman_ford(n, edges, src):                # edges = [(u, v, w), ...]
    INF = float('inf')
    dist = [INF] * n
    dist[src] = 0

    # phase 1: V-1 rounds of relaxation
    for _ in range(n - 1):
        updated = False
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                updated = True
        if not updated: break                   # early exit

    # phase 2: one more round; if anything still relaxes, negative cycle exists
    for u, v, w in edges:
        if dist[u] != INF and dist[u] + w < dist[v]:
            return None                          # negative cycle detected
    return dist
\`\`\`

The **early-exit** flag (\`updated\`) is a free speedup: if a full round changes nothing, no future round will change anything either. On non-pathological inputs Bellman-Ford often finishes in far fewer than \`V - 1\` rounds.

> Tip: To **find** the negative cycle (not just detect it), run a parent-tracker during relaxation; on round \`V\`, walk back \`V\` parent pointers from any vertex that relaxed — you land inside the cycle.`},{heading:"When to reach for it",body:"When edges can be **negative** — currency arbitrage detection (negative cycle = profit opportunity), routing protocols where cost can decrease (RIP, distance-vector routing), constraint systems modeled as graphs (difference constraints), economic / financial flow networks.\n\nDo **not** reach for it on non-negative graphs — Dijkstra is `O((V + E) log V)` and beats Bellman-Ford's `O(V × E)` by a factor of `V / log V`. On a **DAG** with negative edges, topological-sort + one relaxation pass solves shortest path in `O(V + E)` (the DAG ordering replaces the `V - 1` rounds)."},{heading:"Variants",body:`**Early-exit Bellman-Ford** (above): break when a full round changes nothing.

**SPFA (Shortest Path Faster Algorithm)**: Bellman-Ford with a queue of vertices whose distance just changed. Amortized faster on most inputs, worst case still \`O(V × E)\`. Vulnerable to adversarial inputs — avoid in competitive contexts.

**Johnson's algorithm**: run Bellman-Ford once to **reweight** all edges to non-negative (using a virtual source), then run Dijkstra from every vertex. All-pairs shortest paths on a sparse graph with negative edges in \`O(V × E + V × (V + E) log V)\`.

**Constrained shortest path (≤ K edges)**: Bellman-Ford limited to \`K\` rounds — exactly what "Cheapest Flights Within K Stops" asks for.

**Negative-cycle reconstruction**: track parent pointers; on the \`V\`-th round any further relaxation traces back to the cycle.`},{heading:"Common interview problems",body:["Cheapest Flights Within K Stops — Bellman-Ford limited to `K + 1` rounds.","Detect a negative cycle in a directed graph.","Currency arbitrage — model exchange rates as a graph with edge weight `-log(rate)`; a negative cycle is a profitable arbitrage.","Network delay time with negative latency adjustments.","Find the shortest path in a graph with negative edges (no cycles).","Difference constraints: given `x_i - x_j ≤ w`, find feasible assignment via Bellman-Ford."]}],complexity:{best:"`O(V + E)` with early-exit on already-shortest input",average:"`O(V × E)` — close to worst on dense or pathological graphs",worst:"`O(V × E)` = `O(V^3)` on a dense graph",space:"`O(V)` for the distance array; `O(V + E)` if storing edges as an adjacency list"},pitfalls:['Forgetting to check `dist[u] != INF` before relaxing — `INF + w` is `INF` in floats but **overflows** in fixed-width integers, producing bogus "improvements."',"Running only `V - 1` rounds and reporting success without the `V`-th round check — silently returns wrong distances when a negative cycle exists.","Using Bellman-Ford on a graph with non-negative weights when speed matters — Dijkstra is asymptotically and practically faster.","Confusing **negative edge** with **negative cycle** — negative edges alone are fine; only reachable negative cycles make shortest-path undefined."]}},{kind:"problem",label:"Floyd Warshall"},{kind:"problem",label:"Minimizing Infection Time in a Directed Graph"},{kind:"problem",label:"Shortest path with one curved edge in an undirected Graph"},{kind:"problem",label:"Minimum Cost Path"},{kind:"problem",label:"Shortest cycle in an undirected graph"}]},{id:"multisource",label:"Multi-Source BFS",items:[{kind:"problem",label:"Distance of nearest 1"},{kind:"problem",label:"Unlock the Lock"},{kind:"problem",label:"Word Ladder"}]},{id:"mst-dsu",label:"MST / DSU",items:[{kind:"theory",label:"Kruskal's MST",conceptSlug:"kruskals-mst",body:{summary:"Build a **minimum spanning tree** (MST) of an undirected weighted graph by **sorting edges by weight** and greedily accepting each edge that connects two **different components** (detected via Union-Find). Runs in `O(E log E)`, dominated by the sort. The textbook example of a correct greedy on a non-trivial structure.",sections:[{heading:"The mental model",body:`A spanning tree picks \`V - 1\` edges that connect every vertex without forming a cycle. The MST minimizes total edge weight. Kruskal's claim: **always take the cheapest available edge whose endpoints are not yet connected**. The exchange argument proves correctness — swap any non-Kruskal edge for the cheaper one and total weight does not increase.

\`\`\`ascii
  graph (edges sorted by weight):

        (A)---1---(B)
         |  \\      |
         4   2     3
         |    \\    |
        (D)---5---(C)

  sorted edges: A-B(1), A-C(2), B-C(3), A-D(4), C-D(5)

  step 1: pick A-B(1)  -> components: {A,B} {C} {D}
  step 2: pick A-C(2)  -> components: {A,B,C} {D}
  step 3: skip B-C(3)  (same component, would form cycle)
  step 4: pick A-D(4)  -> components: {A,B,C,D}    DONE

  MST weight = 1 + 2 + 4 = 7
\`\`\`

Union-Find is what makes the "are they already connected?" check fast — \`O(α(V))\` per query. Without it, each connectivity check would cost \`O(V + E)\`, blowing the complexity to \`O(E × (V + E))\`.

> Note: **\`V - 1\` accepted edges means done**. Once the running count hits \`V - 1\`, every remaining edge is guaranteed cyclic — break the loop.`},{heading:"Canonical operation — Kruskal with DSU",body:`\`\`\`py
def kruskal(n, edges):                   # edges = [(w, u, v), ...]
    edges.sort()                         # by weight ascending
    parent = list(range(n))
    rank   = [0] * n

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]    # path halving
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx == ry: return False         # cycle; reject
        if rank[rx] < rank[ry]: rx, ry = ry, rx
        parent[ry] = rx
        if rank[rx] == rank[ry]: rank[rx] += 1
        return True

    mst_weight, mst_edges = 0, []
    for w, u, v in edges:
        if union(u, v):
            mst_weight += w
            mst_edges.append((u, v, w))
            if len(mst_edges) == n - 1: break
    return mst_weight, mst_edges
\`\`\`

> Tip: If the result count is less than \`V - 1\`, the graph is **disconnected** — no spanning tree exists; you have a **minimum spanning forest** instead. Many problems silently expect you to handle this.`},{heading:"When to reach for it",body:"Kruskal shines when the graph is **sparse** (`E` close to `V`) and edges can be iterated globally. Network design (minimum cable / pipe layout), clustering (cut the `k - 1` heaviest MST edges to get `k` clusters — single-linkage clustering), approximation algorithms (Christofides for TSP starts from an MST), image segmentation, road / utility-grid optimization.\n\nReach for **Prim's algorithm** instead when the graph is **dense** (`E ≈ V^2`) and stored as an adjacency matrix — Prim with a binary heap is also `O(E log V)`, with an array-based version hitting `O(V^2)` that beats Kruskal's sort on dense input. Reach for **Borůvka** when you need a parallelizable variant. For **maximum spanning tree**, sort edges descending — same algorithm."},{heading:"Variants",body:"**Maximum spanning tree**: sort edges descending; everything else identical.\n\n**Minimum spanning forest**: same algorithm; do not break early — accept every edge that unions distinct components. Result has `V - C` edges where `C` is the number of components.\n\n**Second-best MST**: run Kruskal; for each non-MST edge, consider swapping it in and removing the heaviest MST edge on the cycle it forms. `O(E × V)` naive, `O(E log V)` with LCA tricks.\n\n**Borůvka's algorithm**: in each round, every component picks its cheapest outgoing edge; merge. `O(E log V)` and naturally parallel — used in distributed-graph MST.\n\n**Prim's algorithm**: grow the MST from a single root by always adding the cheapest crossing edge. `O((V + E) log V)` with a heap; better cache behavior than Kruskal on dense graphs.\n\n**Bottleneck spanning tree**: minimize the **maximum** edge weight (not the sum). Kruskal works unchanged — the MST is also a min-bottleneck tree."},{heading:"Common interview problems",body:["Min Cost to Connect All Points — MST on a complete graph of pairwise Manhattan distances.","Connecting Cities With Minimum Cost — direct MST on the given edge list.","Critical and Pseudo-Critical Edges in MST — for each edge, test whether it appears in every / some MST.",'Optimize Water Distribution in a Village — MST with a virtual source vertex for "build a well at city `i`."',"Number of Operations to Make Network Connected — counts of extra edges and components, related to MST shape.","Min Cost to Repair Edges — MST over (existing free edges + repair-cost edges)."]}],complexity:{best:"`O(E log E)` even on already-sorted input — sort dominates",average:"`O(E log E)` = `O(E log V)` since `E ≤ V^2`",worst:"`O(E log E + E × α(V))` ≈ `O(E log E)`; the DSU work is effectively linear",space:"`O(V)` for the DSU arrays + `O(E)` for the edge list"},pitfalls:["Forgetting **union-by-rank / path compression** in DSU — degrades each connectivity check to `O(V)` and total complexity to `O(E × V)`.","Returning the MST without checking `len(edges_accepted) == V - 1` — silently returns a partial forest on disconnected graphs.","Sorting `(u, v, w)` instead of `(w, u, v)` — Python sorts tuples lexicographically, so the first element must be the weight.","Calling `union` without checking the return value — re-adds edges that should be rejected as cyclic, inflating the MST weight."]}},{kind:"theory",label:"Union-Find",conceptSlug:"union-find",body:{summary:'Also called **Disjoint Set Union (DSU)**. Tracks a partition of `n` elements into disjoint sets, supporting two operations: **`find(x)`** returns the representative ("root") of `x`\'s set; **`union(x, y)`** merges the two sets containing `x` and `y`. With **path compression + union-by-rank**, both run in **`O(α(n))`** amortized — effectively constant.',sections:[{heading:"The mental model",body:"Each set is represented as a **rooted tree**. The root is the set's identity; every other node has a `parent` pointer. `find(x)` walks parents to the root. `union(x, y)` finds both roots and attaches one under the other.\n\n```ascii\n  initial state (every element is its own set):\n\n    0  1  2  3  4  5  6  7\n    |  |  |  |  |  |  |  |   parent[i] = i\n\n  after union(0,1), union(2,3), union(0,2):\n\n         0\n        / \\\n       1   2          4  5  6  7    (still singletons)\n           |\n           3\n\n  find(3) -> 3 -> 2 -> 0  (walk to root)\n```\n\nThe two optimizations that make this fast:\n\n**Union-by-rank** (or **by-size**): attach the smaller tree under the larger root. Keeps the trees shallow — height stays `O(log n)`.\n\n**Path compression**: during `find`, point every visited node directly at the root. Future `find` calls are `O(1)`.\n\n> Note: Together they give **`O(α(n))`** amortized per operation, where `α` is the inverse Ackermann function. For any input fitting in this universe, `α(n) ≤ 4`. Treat it as `O(1)`."},{heading:"Canonical operation — DSU with both optimizations",body:`\`\`\`py
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank   = [0] * n
        self.count  = n                          # number of disjoint sets

    def find(self, x):
        # iterative path compression: point every node on the path to the root
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False               # already in same set
        if self.rank[rx] < self.rank[ry]: rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]: self.rank[rx] += 1
        self.count -= 1
        return True
\`\`\`

A two-line recursive \`find\` (\`if p[x] != x: p[x] = find(p[x])\`) is more elegant but blows the recursion stack on adversarial inputs. The iterative two-pass version above is bulletproof.

> Tip: Maintain a \`count\` field for "number of disjoint sets" — decrement on every successful union. Many graph problems ask exactly this quantity ("number of connected components," "number of provinces").`},{heading:"When to reach for it",body:'Whenever the problem asks "**are X and Y in the same group?**" or "**merge these two groups**" online — and you do **not** need to split groups apart. Concrete patterns: **Kruskal\'s MST** (sort edges, union endpoints, skip if already connected). **Connected components** in a stream of edges. **Friend circles / provinces / accounts merging**. **Cycle detection in undirected graphs** (cycle iff `union(u, v)` returns false). **Percolation simulation**. **Equation satisfiability** (`a == b` → union; `a != b` → check find).\n\nReach for **BFS / DFS** instead when the graph is given upfront and you only need one-shot connectivity. Reach for **Link-Cut Trees** (Sleator-Tarjan) when you need to **split** as well as union — DSU does not support split. Reach for a **segment tree** when "groups" are intervals on a number line and you need range operations.'},{heading:"Variants",body:'**Union-by-rank**: attach smaller-rank root under larger; tie-break by incrementing the winner\'s rank. The classical optimization.\n\n**Union-by-size**: attach smaller-tree root under larger; track `size[r]` instead of `rank`. Equivalent asymptotics; sometimes cleaner code.\n\n**Path compression** (full): on `find`, point every node on the path directly to the root. The standard.\n\n**Path halving / splitting**: cheaper variants that only halve the path length each call. Slightly slower but constant-time per `find` step.\n\n**Weighted Union-Find**: each node stores its weight relative to the root — enables "are X and Y in the same group, and what is `value(X) - value(Y)`?" Used in equation systems and arithmetic constraint solvers.\n\n**Persistent DSU**: every union creates a new version; supports time-travel queries. Used in offline algorithms for "answer queries about how the graph looked at time `t`."\n\n**DSU on tree (small-to-large merging)**: a technique, not a structure — when merging two sets always copy the smaller into the larger to bound work by `O(n log n)` total.'},{heading:"Common interview problems",body:["Number of Provinces / Friend Circles — count connected components after unions.","Number of Islands II — online insertion of land cells, report component count after each insertion.","Accounts Merge — union accounts sharing any email; group by root.","Redundant Connection — find the edge whose insertion creates a cycle (first failing union).","Most Stones Removed with Same Row or Column — DSU on rows and columns as nodes.","Kruskal's MST — sort edges by weight, union endpoints, accept edges that connect distinct components."]}],complexity:{best:"`O(1)` per operation when the tree is already flat (after many compressions)",average:"`O(α(n))` amortized — effectively constant for any practical `n`",worst:"`O(α(n))` amortized with both optimizations; `O(log n)` per op with only one; `O(n)` with neither",space:"`O(n)` for the parent and rank arrays"},pitfalls:["Skipping path compression — `find` degrades to `O(n)` on adversarial sequences; the headline `O(α(n))` claim disappears.","Skipping union-by-rank / size — trees grow tall, `find` becomes `O(log n)` instead of `O(α(n))`. Still fast, but you forfeit the asymptotic.",'Comparing `x == y` instead of `find(x) == find(y)` to check "same set" — must compare **roots**, not raw element ids.',"Trying to **split** a set — DSU does not support it. You would need to rebuild from scratch or use a Link-Cut Tree."]}},{kind:"problem",label:"Prim"},{kind:"problem",label:"Disjoint Set"},{kind:"problem",label:"Kruskal"},{kind:"problem",label:"Detect Cycle using DSU"},{kind:"problem",label:"Total Spanning Trees"},{kind:"problem",label:"Job Sequencing"},{kind:"problem",label:"Number of connected components"}]}]},{slug:"greedy",title:"Greedy",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Greedy",body:{summary:"Make the **locally best choice** at every step and commit — never reconsider. Greedy works only when the problem has two properties: the **greedy-choice property** (a local optimum is part of *some* global optimum) and **optimal substructure** (the remaining subproblem is the same shape). Both are easy to wave hands at and hard to actually prove, which is exactly why greedy is the most over-applied technique in interviews.",sections:[{heading:"Mental model",body:`Greedy is a one-pass shortcut around exponential search. You're betting the future doesn't punish the choice you make now. That bet pays off only when the problem has a **matroid-like structure** or admits an **exchange argument** — proof that swapping any non-greedy choice for the greedy one cannot make the answer worse.

\`\`\`ascii
 DP / search:               Greedy:
   try every option           pick locally-best
   keep the best                |
        |                       v
        v                    commit, never revisit
     global optimum             |
        ^                       v
        |                    O(n) or O(n log n)
     O(2^n) without DP
\`\`\`

The danger: many problems have an "obvious" greedy that's wrong on adversarial inputs. **Coin change with denominations \`{1, 3, 4}\` and target \`6\`** — greedy picks \`4 + 1 + 1 = 3 coins\`, but the optimum is \`3 + 3 = 2 coins\`. The exchange argument fails.

> Note: If you can't sketch a proof on the whiteboard in two sentences, your greedy is probably wrong. Default to DP whenever a counter-example takes more than 30 seconds to rule out.`},{heading:"Canonical operation",body:`Activity selection — the textbook greedy. Pick the maximum number of non-overlapping intervals.

\`\`\`py
def max_activities(intervals):
    intervals.sort(key=lambda iv: iv[1])      # sort by finish time
    count, last_end = 0, float("-inf")
    for start, end in intervals:
        if start >= last_end:
            count += 1
            last_end = end
    return count
\`\`\`

\`\`\`cpp
// Fractional knapsack — greedy on value/weight ratio
double fractional_knapsack(vector<pair<int,int>> items, int W) {
    sort(items.begin(), items.end(), [](auto& a, auto& b) {
        return (double)a.first / a.second > (double)b.first / b.second;
    });
    double total = 0;
    for (auto [v, w] : items) {
        if (W >= w) { total += v; W -= w; }
        else        { total += v * ((double)W / w); break; }
    }
    return total;
}
\`\`\`

The **exchange argument** for activity selection: assume the optimal solution picks some interval \`X\` with end time later than the greedy's pick \`G\`. Swap \`X\` for \`G\` — \`G\` ends sooner, so it leaves at least as many options for the rest. The new solution has the same count. Therefore the greedy choice is in some optimum.

> Tip: Sorting is usually the first step. The hard part is figuring out **which key** to sort by — start time, end time, ratio, deadline-minus-duration, etc. The wrong key produces a believable but incorrect greedy.`},{heading:"When to reach for it",body:`Reach for greedy on **interval problems** (activity selection, meeting rooms, merge intervals, minimum platforms, non-overlapping intervals), **scheduling with deadlines** (Johnson's algorithm, earliest-deadline-first), **MST construction** (Kruskal sorts edges by weight, Prim picks min-weight frontier edge), **Huffman coding** (always merge the two least-frequent nodes), **fractional knapsack** (sort by value/weight), and **graph shortest-path with non-negative weights** (Dijkstra's "always pick the closest unsettled node"). Greedy **never** works for **0/1 knapsack**, **coin change with arbitrary denominations**, **longest common subsequence**, or any problem where local choice constrains future choices in non-monotone ways. When in doubt, write the DP — DP is always at least as correct as greedy on these problems.`},{heading:"Variants",body:`**Exchange-argument greedy** — the bread-and-butter form: sort, scan, prove correctness by argued-swap. Activity selection, fractional knapsack, minimum-coin change (canonical coin systems only).

**Matroid greedy** — Kruskal's MST is the canonical example. Any optimization over an independence system that satisfies the matroid axioms is solvable greedily.

**Priority-queue greedy** — when "locally best" changes as you go: Dijkstra, Prim, Huffman, scheduling-with-deadlines-and-profits. The heap delivers the next best choice in \`O(log n)\`.

**Two-pointer greedy** — sorted arrays, scan from both ends: assign cookies, boats to save people, container with most water.

**Regret-based greedy** — pick a candidate, then later swap if a better one appears. The trick behind "schedule jobs with deadlines and profits" and the "minimum cost to hire \`K\` workers" family.

**Greedy + binary search** — binary-search the answer, check feasibility with a greedy scan. Standard for "minimum capacity to ship within \`D\` days," "split array largest sum," "magnetic force between balls."`},{heading:"Common interview problems",body:["Jump Game / Jump Game II (LeetCode 55, 45) — greedy on the farthest reachable index.","Gas Station (LeetCode 134) — single pass, reset start whenever the running tank goes negative.","Non-overlapping Intervals (LeetCode 435) — sort by end, count what doesn't fit.","Minimum Number of Arrows to Burst Balloons (LeetCode 452) — interval-end greedy.","Task Scheduler (LeetCode 621) — fill slots from the most-frequent task first.","Reorganize String (LeetCode 767) — priority-queue greedy on character counts.","Candy (LeetCode 135) — two-pass greedy, left-to-right then right-to-left.","Partition Labels (LeetCode 763) — track the last index of each character, close partition when reached."]}],complexity:{best:"`O(n)` when no sort is needed (e.g., single-pass over a stream)",average:"`O(n log n)` — usually dominated by the initial sort",worst:"`O(n log n)` for sort-based greedy; `O((n + m) log n)` for heap-based greedy like Dijkstra / Prim",space:"`O(1)` for in-place greedy scans; `O(n)` when a heap or auxiliary structure is needed"},pitfalls:["**Applying greedy to a problem that needs DP.** Coin change with US denominations is greedy; arbitrary denominations is not. 0/1 knapsack is never greedy. **Fix:** before committing to greedy, construct a tiny counter-example by hand. If you can't rule one out, write the DP.","**Sorting by the wrong key.** Activity selection sorts by **finish** time, not start time. Sort by start and you can lose 50% of intervals. **Fix:** prove the exchange argument first; the right key falls out of the proof.","**Ignoring tie-breaks.** When two items tie on the greedy criterion, the wrong tie-breaker can change the answer. **Fix:** spell out the secondary sort key (often by descending value or smaller index) and add a unit test that hits the tie.","**Mutating state mid-scan.** A greedy that updates the data it's iterating (e.g., decreasing remaining capacity inside the loop) is fine, but updating the **sort order** mid-loop is a silent bug. **Fix:** if the priority changes per step, use a heap; never a plain sort.",`**Confusing "always feasible" with "optimal."** A greedy may always produce *a* valid solution that's just not the best one (e.g., greedy graph coloring uses too many colors on adversarial orderings). **Fix:** verify optimality, not just feasibility, with the exchange argument.`]}},{kind:"theory",label:"Huffman Coding",conceptSlug:"huffman-coding",body:{summary:"A **prefix-free variable-length encoding** that gives each symbol a bit-string whose length is **inversely proportional to its frequency**. Built greedily by repeatedly merging the two **least-frequent nodes** with a min-heap. Optimal for symbol-by-symbol coding — no other prefix code beats it on the same alphabet + frequency distribution.",sections:[{heading:"The mental model",body:`Imagine a binary tree where every leaf is a symbol. The bit-string for symbol \`s\` is the path from the root to its leaf (left = 0, right = 1). **Prefix-free** means no leaf is the ancestor of another — guaranteed because all symbols are at leaves. Total encoded length = \`Σ freq[s] × depth[s]\`. Minimizing total length means putting **frequent symbols near the root** (short codes) and **rare symbols deep** (long codes).

\`\`\`ascii
  frequencies:  A:5  B:9  C:12  D:13  E:16  F:45

  Huffman tree (root) total = 100:

                     (100)
                    /      \\
                  F:45    (55)
                          /    \\
                       (25)    (30)
                      /   \\    /   \\
                   C:12 D:13 (14)  E:16
                            /   \\
                          A:5   B:9

  codes: F=0, C=100, D=101, A=1100, B=1101, E=111
  cost:  45*1 + 12*3 + 13*3 + 5*4 + 9*4 + 16*3 = 224 bits
\`\`\`

The greedy claim: **the two least-frequent symbols must be siblings at the deepest level of some optimal tree**. Proof by exchange — swap them with whatever pair is currently deepest and the cost cannot increase. Recursing on the merged node preserves optimality.

> Note: Huffman is **optimal among prefix codes** but not optimal overall — **arithmetic coding** and **range coding** beat it when symbol probabilities are non-power-of-2, at the cost of more complex encode / decode.`},{heading:"Canonical operation — build the tree with a min-heap",body:`Push every \`(frequency, symbol-node)\` into a heap. Repeatedly pop the two smallest, merge into a new internal node whose frequency is their sum, push back. Stop when one node remains — the root.

\`\`\`py
import heapq
class Node:
    def __init__(self, freq, sym=None, left=None, right=None):
        self.freq, self.sym, self.left, self.right = freq, sym, left, right
    def __lt__(self, other): return self.freq < other.freq

def huffman(freq):                       # freq = {symbol: count}
    heap = [Node(f, s) for s, f in freq.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        a = heapq.heappop(heap)
        b = heapq.heappop(heap)
        heapq.heappush(heap, Node(a.freq + b.freq, left=a, right=b))
    return heap[0]                       # root

def codes(root, prefix="", out=None):
    if out is None: out = {}
    if root.sym is not None:
        out[root.sym] = prefix or "0"    # single-symbol edge case
    else:
        codes(root.left,  prefix + "0", out)
        codes(root.right, prefix + "1", out)
    return out
\`\`\`

> Tip: For deterministic output, break heap ties by an insertion counter — Python's \`(freq, counter, node)\` tuple avoids \`__lt__\` ambiguity when two subtrees have equal frequency.`},{heading:"When to reach for it",body:`Lossless **compression** where symbols repeat with skewed frequencies — file compression (DEFLATE inside gzip / PNG / ZIP uses Huffman as the entropy stage), JPEG's entropy coding, fax (CCITT) standards, MP3 / AAC headers, network protocols with small alphabets.

Reach for Huffman in interviews whenever the problem says "**minimize the cost of merging**," "**combine the two cheapest**," or "**weighted external path length**." Rope-cutting / connecting-sticks / file-merge problems are Huffman in disguise — the merge cost analysis is identical.

Do **not** reach for Huffman when: symbols are nearly equiprobable (it adds overhead without compression — use fixed-width); probabilities change over time (use **adaptive Huffman** or **arithmetic coding**); you need **provably optimal** real-number-probability compression (arithmetic / range coding).`},{heading:"Variants",body:"**Canonical Huffman**: after building the tree, **reassign codes** based solely on code lengths in a deterministic way. Lets you transmit only the length table, not the tree shape — much smaller header (used by DEFLATE).\n\n**Adaptive Huffman (FGK / Vitter)**: build the tree on-the-fly as symbols stream in, no two-pass preprocessing. Encoder and decoder maintain identical trees in sync.\n\n**Length-limited Huffman (package-merge)**: enforce a maximum code length `L` (hardware decoders often cap at 15 or 16). Slightly suboptimal compression, but bounded decode complexity.\n\n**Connect ropes / merge files**: identical algorithm — cost is the sum of all internal-node weights, which equals the total weighted path length.\n\n**`k`-ary Huffman**: merge `k` nodes at a time instead of 2, building a `k`-ary tree. Used in radix coding; needs `(n - 1) mod (k - 1) == 0`, pad with zero-frequency dummies if not.\n\n**Arithmetic coding**: treats the whole message as a single fractional number in `[0, 1)`. Beats Huffman whenever symbol probabilities are not powers of `1/2`."},{heading:"Common interview problems",body:["Huffman Encoding — build the tree, output each symbol's code.","Connect Ropes to Minimize Cost / Connect N Sticks — same algorithm; sum of all merge costs is the answer.","Minimum Cost to Hire K Workers — sorted greedy, structurally similar.","File-merge cost minimization — `k`-way merge with the package-merge constraint.","Decode a string given a Huffman tree — walk left/right per bit, emit on leaf.","Validate that a given code is prefix-free."]}],complexity:{best:"`O(n)` if symbols are already sorted by frequency — use a queue-based variant that skips the heap",average:"`O(n log n)` — `n - 1` heap pops / pushes, each `O(log n)`",worst:"`O(n log n)` for `n` distinct symbols",space:"`O(n)` for the heap, tree nodes, and code table"},pitfalls:['Forgetting the **single-symbol edge case** — if the alphabet has one symbol, the tree is a single leaf with no edges, so the code is empty. Hard-code it as `"0"` of length 1.',"Comparing nodes by `__lt__` on frequency alone — ties cause Python heapq to compare full Node objects and crash. Use `(freq, counter, node)` tuples.","Using Huffman on already-encoded / random data — adds overhead with no compression gain (entropy already near the alphabet maximum).","Reporting **total code length** by summing leaf depths × frequencies but forgetting that this **equals** the sum of all internal-node frequencies — the connecting-ropes formulation uses the latter directly."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"Fractional Knapsack"},{kind:"problem",label:"Assign Cookies"},{kind:"problem",label:"Min and Max Costs to buy all"},{kind:"problem",label:"Smallest Subset Greater Sum"},{kind:"problem",label:"Min Notes with Given Sum"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Activity Selection"},{kind:"problem",label:"Huffman Coding"},{kind:"problem",label:"Jump Game"},{kind:"problem",label:"Job Sequencing"},{kind:"problem",label:"Non-Overlapping Intervals"},{kind:"problem",label:"Gas Station"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Stable Marriage"},{kind:"problem",label:"Minimize the Max Height Diff"},{kind:"problem",label:"No two adjacent are same"},{kind:"problem",label:"Minimize cash flow"},{kind:"problem",label:"Min time to finish all jobs with given constraints"},{kind:"problem",label:"Min Cost to cut into squares"}]}]},{slug:"dp",title:"Dynamic Programming",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Dynamic Programming",body:{summary:"Solve problems with **optimal substructure** and **overlapping subproblems** by computing each subproblem once and caching its answer. DP = recursion + memoization, or equivalently, a bottom-up table fill in topological order of dependencies.",sections:[{heading:"The shape of a DP table",body:`\`\`\`ascii
  dp[i][j] = best answer using first i items, capacity j

     j ->   0   1   2   3   4   5
        +----+---+---+---+---+---+
   i=0  |  0 | 0 | 0 | 0 | 0 | 0 |   <- base row
        +----+---+---+---+---+---+
   i=1  |  0 | 1 | 1 | 1 | 1 | 1 |
        +----+---+---+---+---+---+
   i=2  |  0 | 1 | 6 | 7 | 7 | 7 |   <- depends on row i-1
        +----+---+---+---+---+---+
   i=3  |  0 | 1 | 6 | 7 | 8 | 9 |
        +----+---+---+---+---+---+

  each cell reads only cells above-left → fill row by row
\`\`\`

> Note: The arrows of dependency must point **into already-filled cells**. Get the iteration order wrong and you read garbage.`},{heading:"The five-step DP recipe",body:["**1. State**: what parameters fully describe a subproblem? `dp[i]` = answer for prefix ending at `i`, or `dp[i][j]` = answer using first `i` items with capacity `j`.","**2. Transition**: how does the answer for state `S` depend on smaller states? Spell out the recurrence.","**3. Base case**: what is the smallest state's answer?","**4. Order**: in what order can the table be filled so every dependency is ready? (Topological order, usually inner→outer.)","**5. Answer**: which state's value is the final answer?"]},{heading:"Canonical operation — coin change (min coins)",body:`\`\`\`py
def coin_change(coins, amount):
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] < INF else -1
\`\`\`

> Tip: Start top-down with memoization to debug the recurrence. Convert to bottom-up tabulation once you trust it — usually faster and rollable to \`O(width)\` space.`},{heading:"Common interview problems",body:["**1-D**: climbing stairs, house robber, coin change, longest increasing subsequence.","**2-D**: edit distance, longest common subsequence, unique paths, 0/1 knapsack.","Stocks family (I, II, III, IV, with cooldown, with fee).","Partition / palindrome DP, matrix chain multiplication."]}],complexity:{best:"`O(states)` when transitions are `O(1)` — e.g. climbing stairs",average:"`O(states × work per transition)` — the standard formula",worst:"`O(n · m · k)` for triple-state problems like edit-distance variants with extra constraints",space:"`O(states)`, often rollable to `O(width)` by keeping only the previous row / two rows"},pitfalls:["Wrong state definition — if `dp[i]` depends on something not captured in `i`, the recurrence is wrong.","Iteration order that reads from a not-yet-computed cell.","Re-using the previous row in-place (1-D rolling) for a recurrence that needs the old value **and** the new one — for 0/1 knapsack iterate capacity **backwards**; for unbounded, forwards.",'Confusing "min" base case (`+inf`) with "count" base case (`0`) — wrong base silently produces wrong totals.']}},{kind:"theory",label:"Kadane's Algorithm",conceptSlug:"kadanes-algorithm",body:{summary:'Find the **maximum-sum contiguous subarray** of an integer array in **`O(n)` time, `O(1)` space**. The 1-D DP recurrence collapses to two scalars: `cur` (best subarray ending here) and `best` (best subarray seen so far). The defining example of "DP whose entire table reduces to one variable."',sections:[{heading:"The mental model",body:'Define `cur[i]` = max sum of a subarray that **ends at index `i`**. The recurrence is obvious in one breath: either extend the previous subarray, or start a new one at `i`.\n\n```ascii\n  cur[i] = max(cur[i-1] + a[i], a[i])\n  best   = max(cur[0..n-1])\n\n  array:  [ -2,  1, -3,  4, -1,  2,  1, -5,  4 ]\n  cur:    [ -2,  1, -2,  4,  3,  5,  6,  1,  5 ]\n  best:     -2   1   1   4   4   5   6   6   6  <- 6 at indices [3..6] = [4,-1,2,1]\n```\n\nThe key insight: if `cur[i-1] < 0`, extending it can only **hurt** the sum at `i` — so `cur[i] = a[i]` (start fresh). Otherwise, extend. The whole algorithm is that one decision repeated.\n\n> Note: Kadane assumes the answer is allowed to be a single element. If "**at least two elements**" is required, the recurrence changes slightly — track `cur` separately for length-≥2 subarrays.'},{heading:"Canonical operation — Kadane in five lines",body:`\`\`\`py
def max_subarray(a):
    best = cur = a[0]                    # subarray must be non-empty
    for x in a[1:]:
        cur = max(x, cur + x)            # extend or restart
        best = max(best, cur)
    return best

def max_subarray_with_indices(a):
    best = cur = a[0]
    start = end = best_l = best_r = 0
    for i in range(1, len(a)):
        if cur + a[i] < a[i]:
            cur, start = a[i], i         # restart
        else:
            cur = cur + a[i]
        if cur > best:
            best, best_l, best_r = cur, start, i
    return best, best_l, best_r
\`\`\`

> Tip: For the **all-negative** edge case, do **not** initialize \`best = 0\` — the answer must be the **least-negative single element**. Initialize \`best = cur = a[0]\` and iterate from index 1.`},{heading:"When to reach for it",body:'Whenever the problem reduces to "**maximum / minimum contiguous aggregate**" over a 1-D sequence: max subarray sum, max product subarray (with a twist), longest positive-sum subarray, max sum of a circular subarray (Kadane on `a` plus Kadane on `-a` for the wrap-around case).\n\nFor **2-D**, fix the top and bottom rows, collapse the rectangle into a 1-D column-sum array, run Kadane. Total `O(n^2 × m)` — the standard "maximum sum rectangle in a matrix."\n\nReach for **prefix sum + min-tracker** instead when you need "**number of subarrays summing to exactly `K`**" — Kadane only finds the max, not counts. Reach for **divide and conquer** on Kadane-like problems only when the input is streamed in segments you cannot combine linearly (rare in interviews).'},{heading:"Variants",body:'**Max product subarray**: track **both** the current max and current min — a negative times the previous min becomes the new max. Two scalars instead of one.\n\n**Max circular subarray sum**: answer is `max(kadane(a), total_sum - kadane(-a))` — the second term is the best contiguous subarray to **exclude** (its complement wraps around). Special-case all-negative input.\n\n**Min subarray sum**: run Kadane with `min` instead of `max`. Combined with total sum gives circular variants.\n\n**Max sum with at most `K` elements**: monotonic deque on prefix sums in `O(n)`. Kadane no longer suffices.\n\n**2-D maximum rectangle**: fix top row `t`, accumulate column sums as bottom row `b` slides down; run 1-D Kadane on the column-sum array. `O(rows^2 × cols)`.\n\n**Max sum subarray with at least one element of each "color"**: extend state with which colors have been included; usually requires sliding window or DP, not pure Kadane.'},{heading:"Common interview problems",body:["Maximum Subarray (LeetCode 53) — the canonical statement.","Maximum Product Subarray — two-scalar Kadane variant.","Maximum Sum Circular Subarray — `max(kadane(a), total - min_kadane(a))`.","Maximum Sum Rectangle in a 2D Matrix — fix top + bottom, collapse, run Kadane.","Best Time to Buy and Sell Stock — restate as Kadane over the differences array.","Maximum Absolute Sum of any Subarray — `max(kadane(a), -kadane(-a))`."]}],complexity:{best:"`O(n)` — single pass, no early exit possible",average:"`O(n)` regardless of input distribution",worst:"`O(n)` even on all-negative or all-positive input",space:"`O(1)` — two scalars; rolling-DP style"},pitfalls:["Initializing `best = 0` — fails on all-negative input by returning 0 instead of the least-negative element. Initialize `best = cur = a[0]` and start from index 1.","Forgetting the **restart** branch — without `max(x, cur + x)` the algorithm degenerates into a running sum and always returns the total. The restart **is** the algorithm.","Trying to recover indices by tracking only the global best — must track the **current** start index too, updated on every restart, then promote to `best_l` only when `cur` overtakes `best`.","Applying Kadane to a product / GCD aggregate without realizing negative numbers / multiplicative inverses break the single-scalar invariant — product needs two scalars, GCD needs a segment-tree-like structure."]}},{kind:"theory",label:"0/1 Knapsack",conceptSlug:"zero-one-knapsack",body:{summary:"Given `n` items each with **weight `w[i]`** and **value `v[i]`**, and a sack of capacity `W`, pick a subset that **maximizes total value** subject to total weight `≤ W`. Each item is either **taken once or not at all** (no fractions). Solved by 2-D DP in `O(n × W)` time, rollable to `O(W)` space.",sections:[{heading:"The mental model",body:"Define `dp[i][c]` = max value using **a subset of the first `i` items** with capacity `c`. At item `i` you have exactly two choices: **skip** (carry over `dp[i-1][c]`) or **take** if it fits (`dp[i-1][c - w[i]] + v[i]`). The recurrence is the maximum of those two.\n\n```ascii\n  items:  w = [2, 3, 4, 5]   v = [3, 4, 5, 6]   W = 5\n\n     c ->   0   1   2   3   4   5\n        +----+---+---+---+---+---+\n   i=0  |  0 | 0 | 0 | 0 | 0 | 0 |   <- no items\n        +----+---+---+---+---+---+\n   i=1  |  0 | 0 | 3 | 3 | 3 | 3 |   take item 0 (w=2,v=3) when c>=2\n        +----+---+---+---+---+---+\n   i=2  |  0 | 0 | 3 | 4 | 4 | 7 |   item 1 (w=3,v=4); 7 = 3+4 at c=5\n        +----+---+---+---+---+---+\n   i=3  |  0 | 0 | 3 | 4 | 5 | 7 |   item 2 (w=4,v=5)\n        +----+---+---+---+---+---+\n   i=4  |  0 | 0 | 3 | 4 | 5 | 7 |   item 3 (w=5,v=6); skip — 7 wins\n        +----+---+---+---+---+---+\n\n  answer = dp[n][W] = 7\n```\n\nThe state `(i, c)` is **sufficient**: once you decide which items to use among the first `i`, the future depends only on the remaining capacity. Past choices that hit the same `(i, c)` produce the same future — that is the overlapping-subproblems signature that makes DP correct.\n\n> Note: This is **pseudo-polynomial** — the runtime depends on `W` as a number, not on `log W` (its bit length). For `W = 10^9` the table is unbuildable; reach for **branch-and-bound** or **meet-in-the-middle** instead."},{heading:"Canonical operation — 1-D rolling DP",body:`The \`dp[i][c]\` row depends only on \`dp[i-1][...]\`, so a single row of length \`W + 1\` suffices — **iterated backwards in \`c\`** so that \`dp[c - w[i]]\` still holds the old (without-item-i) value.

\`\`\`py
def knapsack_01(weights, values, W):
    n = len(weights)
    dp = [0] * (W + 1)
    for i in range(n):
        wi, vi = weights[i], values[i]
        for c in range(W, wi - 1, -1):       # BACKWARDS — critical
            dp[c] = max(dp[c], dp[c - wi] + vi)
    return dp[W]

def knapsack_with_items(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        wi, vi = weights[i - 1], values[i - 1]
        for c in range(W + 1):
            dp[i][c] = dp[i - 1][c]
            if c >= wi:
                dp[i][c] = max(dp[i][c], dp[i - 1][c - wi] + vi)
    # backtrack to recover chosen items
    chosen, c = [], W
    for i in range(n, 0, -1):
        if dp[i][c] != dp[i - 1][c]:
            chosen.append(i - 1)
            c -= weights[i - 1]
    return dp[n][W], chosen[::-1]
\`\`\`

> Warning: **The backward iteration is the whole trick.** Iterating \`c\` forwards would allow item \`i\` to be picked **twice** in one row — which is the unbounded knapsack problem, not 0/1.`},{heading:"When to reach for it",body:'Anywhere the problem is "**given a budget, pick a subset maximizing some additive objective**" — capital allocation, project selection, ad slot selection under impression budget, exam-question selection under time budget, packing a backpack. The "subset-sum" family is 0/1 knapsack with `value = weight`.\n\nReach for **fractional knapsack (greedy)** when items can be split — sort by value/weight, take greedily. `O(n log n)`, no DP needed. Reach for **unbounded knapsack** when each item can be used unlimited times — iterate `c` forwards. Reach for **meet-in-the-middle** when `n ≤ 40` but `W` is enormous — split into two halves, enumerate `2^(n/2)` subsets each, combine. `O(2^(n/2) × n)`. Reach for **branch-and-bound** with LP relaxation when `n` is small enough to enumerate with aggressive pruning.'},{heading:"Variants",body:'**Unbounded knapsack** (each item unlimited): same recurrence, iterate `c` **forwards** so the same item can be re-picked. `O(n × W)`.\n\n**Bounded knapsack** (each item up to `k[i]` times): naive — duplicate item `i` `k[i]` times, run 0/1. Smarter — **binary splitting** (`1, 2, 4, ..., k[i] - sum`) reduces to `O(n × log K × W)`.\n\n**Subset sum**: `value = weight`; "can we hit exactly `W`?" Boolean DP, `O(n × W)`. Bitset speedup achieves `O(n × W / 64)`.\n\n**Partition equal subset sum**: subset sum with `target = total / 2`.\n\n**Target sum (with `+` / `-` signs)**: rearranges to subset sum on `(total + target) / 2`.\n\n**Multidimensional knapsack**: two capacities (`weight` and `volume`). DP state grows to `O(n × W × V)`.\n\n**Knapsack with mandatory items**: pre-include them and reduce `W`; run 0/1 on the rest.\n\n**Meet-in-the-middle**: split `n` items in half, enumerate each half\'s `2^(n/2)` subsets, sort one by weight, binary-search to combine. `O(2^(n/2) × n / 2)`.'},{heading:"Common interview problems",body:["0/1 Knapsack — the canonical statement.",'Subset Sum — "is there a subset summing to exactly `W`?"',"Partition Equal Subset Sum — partition into two equal-sum halves.","Target Sum — reduces to subset sum.","Last Stone Weight II — minimize `|sum(A) - sum(B)|` for any partition; subset-sum DP.","Ones and Zeroes — multi-dimensional 0/1 knapsack with two capacities.","Profitable Schemes — 0/1 knapsack with a profit floor instead of value max."]}],complexity:{best:"`O(n × W)` even on trivially-infeasible input — the table is built unconditionally",average:"`O(n × W)` time, `O(W)` space with rolling-row optimization",worst:"`O(n × W)` — pseudo-polynomial; `W = 10^9` is intractable even though `log W = 30`",space:"`O(n × W)` for the full table or `O(W)` for the rolling 1-D version"},pitfalls:["Iterating capacity **forwards** in the 1-D rolling version — silently turns 0/1 knapsack into unbounded knapsack (an item gets picked multiple times). Always iterate **backwards** from `W` to `w[i]`.","Forgetting the `c >= w[i]` guard — negative indexing crashes, or in Python silently wraps to the end of the array and returns a wrong answer.",'Reporting "pseudo-polynomial" as polynomial — `W` is a **number**, not its bit length. Doubling `W` doubles the runtime.',"Trying greedy by value/weight ratio on 0/1 — provably wrong (counter-example: `W = 50`, items `(w=30, v=120)` and `(w=20, v=100)` and `(w=20, v=100)` — greedy picks ratio-1.0 first and misses the optimum). Greedy is only correct for the **fractional** variant."]}}]},{id:"1d-dp",label:"1-D DP",items:[{kind:"problem",label:"Climbing Stairs"},{kind:"problem",label:"Count without consecutive 1s"},{kind:"problem",label:"Weighted Climbing Stairs"},{kind:"problem",label:"Frog Jump"},{kind:"problem",label:"House Robber"},{kind:"problem",label:"Max Segments"},{kind:"problem",label:"Coin Change"},{kind:"problem",label:"Possible Decodings"},{kind:"problem",label:"Word Break"},{kind:"problem",label:"Derangements"}]},{id:"2d-dp",label:"2-D DP",items:[{kind:"problem",label:"Unique Paths"},{kind:"problem",label:"Minimum cost Path"},{kind:"problem",label:"Longest Common Subsequence"},{kind:"problem",label:"Edit Distance"},{kind:"problem",label:"Distinct Subsequences"},{kind:"problem",label:"Largest Square Submatrix with All 1s"}]},{id:"subseq",label:"Subsequence",items:[{kind:"problem",label:"Partition Subset"},{kind:"problem",label:"Subset Sum"},{kind:"problem",label:"Subset Count With Sum"},{kind:"problem",label:"Target Sum"},{kind:"problem",label:"0/1 Knapsack"},{kind:"problem",label:"Coin Change II"},{kind:"problem",label:"Rod Cutting"}]},{id:"grid",label:"Grid",items:[{kind:"problem",label:"Unique Paths in a Grid"},{kind:"problem",label:"Maximum path sum in matrix"},{kind:"problem",label:"Longest Increasing Path"}]},{id:"string",label:"String",items:[{kind:"problem",label:"Longest Common Substring"},{kind:"problem",label:"Shortest Common Supersequence"},{kind:"problem",label:"Interleaving String"},{kind:"problem",label:"Wildcard Matching"},{kind:"problem",label:"Longest Palindromic Substring"}]},{id:"stock",label:"Stock",items:[{kind:"problem",label:"Buy and Sell with Cooldown"},{kind:"problem",label:"Buy and Sell – Max 2 Transactions Allowed"},{kind:"problem",label:"Buy and Sell - k Transactions"},{kind:"problem",label:"Buy and Sell with Transaction Fee"}]},{id:"lis",label:"LIS",items:[{kind:"problem",label:"Longest Increasing Subsequence"},{kind:"problem",label:"Number of LISs"},{kind:"problem",label:"Longest Bitonic"},{kind:"problem",label:"Largest Divisible"},{kind:"problem",label:"Longest String Chain"},{kind:"problem",label:"Maximum envelopes"}]},{id:"partition",label:"Partition",items:[{kind:"problem",label:"Matrix Chain Multiplication"},{kind:"problem",label:"Minimum Cost to Cut a Stick"},{kind:"problem",label:"Palindrome Partitioning"},{kind:"problem",label:"Boolean Parenthesization"},{kind:"problem",label:"Partition Array for Maximum Sum"},{kind:"problem",label:"Egg Dropping"},{kind:"problem",label:"Optimal Strategy"}]}]},{slug:"number-theory",title:"Number Theory",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Sieve of Eratosthenes",conceptSlug:"sieve-of-eratosthenes",body:{summary:'Generate **all primes up to `N`** in `O(N log log N)` time using a boolean array. Mark `is_prime[i] = true` for every `i`, then for each prime `p` starting at 2, cross off every multiple `p, 2p, 3p, ...`. The remaining `true` entries are prime. The fastest practical algorithm for "list all primes up to `N`" when `N` fits comfortably in memory.',sections:[{heading:"The mental model",body:"A number is composite **if and only if** it has a prime factor `≤ sqrt(N)`. So if you mark every multiple of every prime `≤ sqrt(N)`, every composite gets crossed off at least once; whatever remains unmarked is prime.\n\n```ascii\n  N = 30, initial: every entry true (except 0 and 1)\n\n  p=2: cross 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30\n  p=3: cross 9, 12, 15, 18, 21, 24, 27, 30   (some already crossed)\n  p=5: cross 25, 30                          (only 25, 30 new)\n  p=7: 7*7 = 49 > 30, stop\n\n  result:  2 3 5 7 11 13 17 19 23 29\n```\n\nThe **`p*p` starting trick** is the second key optimization: any multiple of `p` smaller than `p*p` already has a smaller prime factor (otherwise `p` would not be prime) and is therefore already crossed off.\n\n> Note: The `O(N log log N)` bound comes from `Σ (N / p)` over primes `p ≤ N`, which is `~N × ln ln N` by Mertens' theorem. Slower than `O(N)` linear sieves, faster than `O(N sqrt N)` trial division by orders of magnitude at scale."},{heading:"Canonical operation — classic sieve",body:'```py\ndef sieve(n):\n    is_prime = [False, False] + [True] * (n - 1)     # 0 and 1 are not prime\n    for p in range(2, int(n ** 0.5) + 1):\n        if is_prime[p]:\n            for m in range(p * p, n + 1, p):         # start at p*p\n                is_prime[m] = False\n    return [i for i, ok in enumerate(is_prime) if ok]\n\ndef smallest_prime_factor(n):\n    spf = [0] * (n + 1)\n    for i in range(2, n + 1):\n        if spf[i] == 0:                               # i is prime\n            for j in range(i, n + 1, i):\n                if spf[j] == 0:\n                    spf[j] = i\n    return spf       # spf[x] = smallest prime dividing x — enables O(log x) factorization\n```\n\nThe **smallest-prime-factor (SPF) sieve** is the workhorse extension: once `spf[]` is built, you can factor any `x ≤ N` in `O(log x)` by repeatedly dividing by `spf[x]`. Indispensable when the problem follows up with "now factor a million numbers up to `N`."\n\n> Tip: For very large `N`, use a **bitset / `bytearray`** instead of a Python list — 8x memory reduction and faster cache behavior. `bytearray(b"\\x01" * (n + 1))` indexed and assigned per element.'},{heading:"When to reach for it",body:"Whenever the problem requires **many primality / factorization queries** on numbers bounded by some `N`. Counting primes up to `N`. Generating primes for cryptographic prototypes. Pre-computing smallest-prime-factor for fast factorization. Euler's totient `phi(i)` for all `i ≤ N`. Sum / count of divisors for all `i ≤ N` (via divisor sieve).\n\nDo **not** reach for the sieve when: `N > 10^9` (memory blows up — use **segmented sieve**); you need to test a **single huge** prime (use **Miller-Rabin** in `O(log^3 N)`); the question only asks for one or two primality tests on small inputs (trial division up to `sqrt(N)` is simpler and fast enough)."},{heading:"Variants",body:"**Linear sieve (Euler sieve)**: each composite is crossed off **exactly once** — by its smallest prime factor times its largest non-spf cofactor. Achieves `O(N)`, builds `spf[]` as a byproduct.\n\n**Segmented sieve**: process the range `[L, R]` for very large `R` by first sieving primes up to `sqrt(R)`, then sieving each block `[L, L + B)` against those primes. `O((R - L) log log R)` time, `O(sqrt(R) + B)` memory.\n\n**Divisor / sigma sieve**: for each `i`, walk multiples `i, 2i, ...` and accumulate `i` into `tau[k]` or `sigma[k]` — gives divisor counts / sums for all `k ≤ N` in `O(N log N)`.\n\n**Möbius sieve**: builds `mu[i]` for inclusion-exclusion identities. Use during the linear-sieve pass.\n\n**Totient sieve**: builds `phi[i]` (count of integers ≤ `i` coprime to `i`) in `O(N log log N)`.\n\n**Sieve of Atkin**: theoretically `O(N / log log N)`, but the constant factor is brutal — Eratosthenes wins in practice up to `N ~ 10^10`.\n\n**Wheel factorization**: pre-skip multiples of small primes (2, 3, 5) — `~50%` constant-factor speedup but more bookkeeping."},{heading:"Common interview problems",body:["Count Primes — count primes strictly less than `n`.","Closest Prime Numbers in Range — sieve `[left, right]`, scan adjacent.","Prime Subtraction Operation — sieve to `max(nums)`, then greedy.","Smallest Prime Factor of every number up to `N` — SPF sieve.","Number of distinct prime factors / sum of prime factors up to `N`.","Compute Euler's totient `phi(1..n)` for problems involving coprime counts.","Print all primes between `L` and `R` for huge `R` — segmented sieve."]}],complexity:{best:"`O(N log log N)` even on already-prime input — every prime triggers its multiple-marking pass",average:"`O(N log log N)` time, `O(N)` space",worst:"`O(N log log N)` — bounded by the harmonic-prime sum",space:"`O(N)` for the boolean / bitset array; `O(N / ln N)` for the prime list output"},pitfalls:["Starting the inner loop at `2 * p` instead of `p * p` — still correct, but ~`O(N log N)` work instead of `O(N log log N)` (smaller multiples already crossed off by smaller primes).","Treating `1` as prime — must initialize `is_prime[0] = is_prime[1] = False` explicitly. Many sieve-based answers fail this off-by-one.","Allocating a Python list-of-bools for `N = 10^8` — uses gigabytes. Use `bytearray` or numpy boolean array.","Running a full sieve for a query on **one** large prime — use Miller-Rabin / trial division instead; the sieve's `O(N)` memory is wasted."]}},{kind:"theory",label:"Euclid's Algorithm",conceptSlug:"euclidean-gcd",body:{summary:"Compute **`gcd(a, b)`** — the greatest common divisor of two non-negative integers — in **`O(log min(a, b))`** time using the identity **`gcd(a, b) = gcd(b, a mod b)`**, with base case `gcd(a, 0) = a`. The extended variant additionally finds integers `x, y` such that `a*x + b*y = gcd(a, b)` — used everywhere modular inverses appear.",sections:[{heading:"The mental model",body:"Every common divisor of `a` and `b` also divides their difference (and thus their remainder). Replacing `(a, b)` with `(b, a mod b)` shrinks the problem while preserving the gcd. The remainder halves roughly every two steps — a Fibonacci-style worst case proves the `O(log min(a, b))` bound.\n\n```ascii\n  gcd(252, 105):\n     252 = 2 * 105 + 42       gcd(252, 105) = gcd(105, 42)\n     105 = 2 *  42 + 21       gcd(105,  42) = gcd( 42, 21)\n      42 = 2 *  21 +  0       gcd( 42,  21) = gcd( 21,  0) = 21\n\n  answer: 21\n```\n\nThe **bezout identity** says there exist integers `x, y` with `a*x + b*y = gcd(a, b)`. The **extended Euclidean** algorithm computes them in the same number of steps by walking the recursion back up, threading the coefficients through the substitution `a mod b = a - (a // b) * b`.\n\n> Note: The worst case is two consecutive **Fibonacci numbers** (`F(n)` and `F(n+1)`) — they take `n` steps, which is why the complexity is `O(log_phi(min(a, b)))` ≈ `O(log min(a, b))`."},{heading:"Canonical operation — recursive and iterative",body:`\`\`\`py
def gcd(a, b):                            # iterative — never overflows the stack
    a, b = abs(a), abs(b)
    while b:
        a, b = b, a % b
    return a

def gcd_recursive(a, b):                  # textbook one-liner
    return abs(a) if b == 0 else gcd_recursive(b, a % b)

def extended_gcd(a, b):
    # returns (g, x, y) with a*x + b*y = g = gcd(a, b)
    if b == 0:
        return a, 1, 0
    g, x1, y1 = extended_gcd(b, a % b)
    # back-substitute: gcd = b*x1 + (a - (a//b)*b)*y1 = a*y1 + b*(x1 - (a//b)*y1)
    return g, y1, x1 - (a // b) * y1

def modinv(a, m):                         # inverse of a mod m, if it exists
    g, x, _ = extended_gcd(a, m)
    if g != 1: return None                # inverse exists iff gcd(a, m) = 1
    return x % m

def lcm(a, b):
    return abs(a // gcd(a, b) * b)        # divide first to avoid overflow
\`\`\`

> Tip: For LCM, **divide before multiplying** (\`a // gcd(a,b) * b\`) to keep intermediate values small. Multiplying first can overflow when \`a*b\` exceeds the integer range.`},{heading:"When to reach for it",body:"Every time the problem involves **divisibility, common factors, modular arithmetic, or fractions in lowest terms**. Reducing fractions. Finding LCM via `lcm(a, b) = a / gcd(a, b) * b`. Solving linear Diophantine equations `a*x + b*y = c` (solvable iff `gcd(a, b) | c`). Computing modular inverses for problems involving \"answer mod `p`\" with division. The Chinese Remainder Theorem implementation. Cryptographic key generation (RSA needs `gcd(e, phi(n)) = 1`).\n\nReach for **Stein's binary GCD** when implementing on hardware without fast division — uses only subtractions and bit shifts. Reach for **Lehmer's GCD** for arbitrary-precision integers — speeds up large-number gcd by working on the high bits with machine-word arithmetic."},{heading:"Variants",body:'**Extended Euclidean**: returns `(g, x, y)` with `a*x + b*y = g`. Powers modular inverses, CRT, Diophantine equation solving.\n\n**Binary GCD (Stein)**: replaces `mod` with subtraction + bit shifts. Same `O(log)` complexity, faster on hardware without a fast divider. The standard in Linux kernel `__gcd`.\n\n**LCM**: `lcm(a, b) = abs(a / gcd(a, b) * b)`. Generalizes to `n` numbers by folding: `lcm(a, b, c) = lcm(lcm(a, b), c)`.\n\n**Modular inverse**: when `gcd(a, m) = 1`, the `x` from extended Euclidean is `a^(-1) mod m`. Used in RSA, hash construction, "answer mod prime" combinatorics.\n\n**Diophantine `a*x + b*y = c`**: solvable iff `gcd(a, b) | c`. Particular solution from extended Euclidean; general solution adds `k * (b / g, -a / g)` for any integer `k`.\n\n**Bezout coefficients in CRT**: combine congruences via extended Euclidean on the moduli.\n\n**GCD of an array**: fold `gcd` left-to-right. Often used for "max GCD of any subset / subarray" via segment tree of gcds.'},{heading:"Common interview problems",body:["GCD of two numbers / array of numbers.","LCM of two numbers; smallest number divisible by `1..n`.","Modular inverse (Fermat's little theorem when modulus is prime; extended Euclidean otherwise).","Solve `a*x + b*y = c` in integers — Diophantine equation.","Reduce a fraction to lowest terms.","Water Jug problem — solvable iff `gcd(x, y) | target`.","Greatest common divisor of strings — `str1 + str2 == str2 + str1` iff a common base string exists."]}],complexity:{best:"`O(1)` when `b == 0` or `a == b`",average:"`O(log min(a, b))` — `mod` shrinks the values geometrically",worst:"`O(log min(a, b))` — attained on consecutive Fibonacci numbers",space:"`O(1)` iterative; `O(log min(a, b))` recursive (stack frames)"},pitfalls:["Forgetting `abs()` on inputs — `gcd(-12, 8)` should be `4`, but `-12 % 8` semantics vary by language. Normalize to non-negative first.","Computing LCM as `(a * b) // gcd(a, b)` — overflows when `a * b` exceeds the integer range. Use `(a // gcd(a, b)) * b` instead.","Using recursive `gcd` on huge inputs without a tail-recursion compiler — Python defaults to a 1000-frame stack. Use the iterative version (Python's stdlib `math.gcd` is iterative).","Calling `modinv` when `gcd(a, m) != 1` — inverse does not exist. Always check the gcd output before using `x`."]}}]},{id:"easy",label:"Easy",items:[{kind:"problem",label:"nCr"},{kind:"problem",label:"Euler's Totient"}]},{id:"medium",label:"Medium",items:[{kind:"problem",label:"Sieve of Eratosthenes"},{kind:"problem",label:"Pascal's Triangle"},{kind:"problem",label:"Modular Exponentiation"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Segmented Sieve"}]}]},{slug:"trie",title:"Trie",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Trie",conceptSlug:"trie",body:{summary:'A rooted tree where each edge is labeled with a single character and each root-to-node path spells a prefix. Insert, search, and prefix queries all run in `O(L)` per operation — **independent of the dictionary size** `N`. That property is what makes a trie the right structure for autocomplete, dictionary lookups, multi-pattern matching, and the entire family of "longest common prefix" problems.',sections:[{heading:"Mental model",body:`Picture a tree where every edge carries one character. Two words that share a prefix share the path representing that prefix — \`"car"\`, \`"cat"\`, and \`"care"\` all walk through the same root → c → a node.

\`\`\`ascii
                    (root)
                      |
                      c
                      |
                      a
                     / \\
                    r   t*
                   / \\
                  *   e*
        (insert "car", "cat", "care")
        '*' marks isEnd = true
\`\`\`

The crucial invariant: **each stored word corresponds to exactly one root-to-flagged-node path**, and the lookup cost depends only on the word's length, not on how many other words are in the structure. The trie pays for that with memory — every distinct prefix costs at least one node.

> Note: A trie is a deterministic finite automaton over the alphabet. Adding **failure links** between nodes whose paths share a suffix turns it into the **Aho-Corasick automaton** for multi-pattern matching.`},{heading:"Canonical operation",body:`Insert + search + prefix query on a lowercase-English trie.

\`\`\`py
class TrieNode:
    __slots__ = ("kids", "end")
    def __init__(self):
        self.kids = {}            # dict is more memory-efficient than [None]*26
        self.end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.kids.setdefault(ch, TrieNode())
        node.end = True

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.end

    def startsWith(self, prefix):
        return self._walk(prefix) is not None

    def _walk(self, s):
        node = self.root
        for ch in s:
            node = node.kids.get(ch)
            if node is None: return None
        return node
\`\`\`

\`\`\`java
// Array-backed Java trie — fastest for fixed 26-letter alphabet
class Trie {
    Trie[] kids = new Trie[26];
    boolean end = false;
    void insert(String w) {
        Trie n = this;
        for (char c : w.toCharArray()) {
            int i = c - 'a';
            if (n.kids[i] == null) n.kids[i] = new Trie();
            n = n.kids[i];
        }
        n.end = true;
    }
    boolean search(String w) { Trie n = walk(w); return n != null && n.end; }
    boolean startsWith(String p) { return walk(p) != null; }
    private Trie walk(String s) {
        Trie n = this;
        for (char c : s.toCharArray()) { n = n.kids[c - 'a']; if (n == null) return null; }
        return n;
    }
}
\`\`\`

> Tip: Use a **HashMap** for sparse alphabets (Unicode, mixed case, digits + symbols) and an **array** for fixed dense alphabets (\`a-z\`). The hash map is 5-10x slower per access but a fraction of the memory when most slots would be empty.`},{heading:"When to reach for it",body:`Reach for a trie when the data is **a set of strings and queries are prefix-shaped**. Concretely: **autocomplete** ("words starting with 'pre'"), **spell-check** ("does this word exist; what are close matches"), **multi-word search in a grid** (Word Search II — trie of targets + DFS pruning instantly removes whole branches once no descendant matches), **longest common prefix** of \`N\` strings, **XOR maximum / Hamming queries** on integers (a **bit trie** of depth 32 lets you greedily pick the opposing bit at each level), and **routing tables / IP-prefix lookup** (longest matching prefix is the trie's natural answer). If queries are by **exact key**, use a hash map. If by **substring** (anywhere in the string), use a suffix automaton or suffix array, not a trie.`},{heading:"Variants",body:'**Compressed trie (radix tree / Patricia trie)** — collapse chains of single-child nodes into one edge labeled with the substring. Saves enormous memory on sparse dictionaries.\n\n**Bit trie** — alphabet `{0, 1}`, fixed depth 32 or 64. The standard tool for "maximum XOR of two numbers in an array" and persistent count-of-numbers queries.\n\n**Aho-Corasick automaton** — trie + failure links + output links. Matches all dictionary words in a text in `O(|T| + total pattern length + occurrences)`. The standard for virus signature scanning and dictionary attacks.\n\n**Suffix trie / suffix tree** — a trie of all suffixes of a single string. Ukkonen\'s algorithm builds in `O(n)` and powers longest repeated substring, longest common substring of two strings, distinct substring count.\n\n**Ternary search trie** — each node has `< / = / >` children instead of `|alphabet|`. Memory between hash-map and array tries, often a sweet spot.\n\n**Persistent trie** — every insert returns a new root sharing all unchanged nodes. `O(L)` insert; powers `k`-th smallest XOR queries.'},{heading:"Common interview problems",body:["Implement Trie (LeetCode 208) — the textbook intro.","Add and Search Word — Data Structure Design (LeetCode 211) — trie + wildcard DFS.","Word Search II (LeetCode 212) — board DFS, trie of targets, prune as soon as the current prefix is not in the trie.","Maximum XOR of Two Numbers in an Array (LeetCode 421) — bit trie of depth 32.","Replace Words (LeetCode 648) — trie of roots, walk each word until a root match.","Longest Word in Dictionary (LeetCode 720) — DFS the trie, only descend through `end` nodes.","Design Search Autocomplete System (LeetCode 642) — trie + per-node ranked suggestions."]}],complexity:{build:"`O(sum of word lengths)` to build the whole trie",operation:"`O(L)` per insert / search / prefix query — `L` is the query length",time:"`O(L)` per op; `O(L · |alphabet|)` when walking all children for autocomplete suggestions",space:"`O(N · L · |alphabet|)` array-backed worst case; closer to `O(total distinct prefixes)` with hash-map children or radix compression"},pitfalls:["**Storing children as a 26-slot array when the alphabet isn't fixed.** A Unicode word, a digit, or an uppercase letter silently crashes the indexer. **Fix:** use a `HashMap<Character, Trie>` (or Python `dict`) when the alphabet is open; reserve the 26-array for guaranteed-lowercase inputs.",'**Forgetting to set or check the `isEnd` flag.** `search("ca")` will return `true` if `"cat"` was inserted but `"ca"` was not, because the path exists. **Fix:** always test `node.end` at the end of `search`; `startsWith` is the prefix-only variant.',"**Memory blow-up on long random strings.** A trie over `10^5` random 20-character strings allocates millions of nodes — easy OOM. **Fix:** switch to a **radix / compressed trie** that stores edge labels as substrings, or use a hash set if prefix queries aren't actually needed.","**Holding strings in nodes instead of reconstructing on demand.** Storing the full word at every `end` node doubles the memory for nothing. **Fix:** if you need the word back during DFS, accumulate the path string during traversal.","**Deleting without trimming.** Marking `end = false` leaves orphan internal chains. **Fix:** post-order delete — after the recursive call returns, if a node has no children and `end == false`, free it and remove it from the parent's map."]}}]},{id:"implementation",label:"Implementation",items:[{kind:"problem",label:"Implement Trie"},{kind:"problem",label:"Longest Word With All Prefixes"},{kind:"problem",label:"Count of distinct substrings"}]},{id:"bit-trie",label:"Bit Manipulation Trie",items:[{kind:"problem",label:"Duplicates in Binary Matrix"},{kind:"problem",label:"Max XOR of Two"},{kind:"problem",label:"Maximum XOR Queries"},{kind:"problem",label:"Pairs with XOR less than K"}]},{id:"advanced",label:"Advanced Trie",items:[{kind:"problem",label:"Search Suggestions System"},{kind:"problem",label:"Palindrome Pairs"}]}]},{slug:"string-matching",title:"String Matching",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Substring",body:{summary:"String matching asks one question: does **pattern `P`** (length `m`) occur in **text `T`** (length `n`), and where? The naive scan is `O(n·m)`; **KMP**, the **Z-algorithm**, and **Rabin-Karp** each get to `O(n + m)` by exploiting structure of the pattern. Pick by what you need next: KMP and Z give you the matching positions plus useful auxiliary arrays; Rabin-Karp generalizes to multi-pattern via rolling hash.",sections:[{heading:"Mental model",body:'Every linear matcher works by **never re-comparing characters it has already aligned**. Naive search slides `P` over `T` one position at a time and restarts comparison from `P[0]` after every mismatch — that\'s where the `O(n·m)` comes from.\n\n```ascii\n Naive vs KMP after a mismatch at T[i], pattern offset j:\n\n Naive:                          KMP (using failure array fail[]):\n   T: a b a b a b c a            T: a b a b a b c a\n                  ^ mismatch                    ^ mismatch at j=5\n   P: a b a b a b d                P: a b a b a b d\n   shift by 1, restart            shift to align P[0..fail[j-1]]\n   compare P[0..] again           continue from j = fail[j-1]\n```\n\nKMP precomputes `fail[i]` = length of the longest proper prefix of `P[0..i]` that is also a suffix. On mismatch, the next alignment is set by that array — no character in `T` is ever compared twice.\n\n> Note: The pattern\'s **failure / Z array is itself the useful output** for many problems — "longest happy prefix," "count occurrences of every prefix in the string," and "period of a string" all read straight off these arrays without a separate match phase.'},{heading:"Canonical operation",body:`KMP failure-array construction + match phase. Linear in \`n + m\` with no backing up over \`T\`.

\`\`\`py
def kmp_search(text, pat):
    if not pat: return [0]
    fail = [0] * len(pat)
    k = 0
    for i in range(1, len(pat)):                # build failure array
        while k > 0 and pat[k] != pat[i]:
            k = fail[k - 1]
        if pat[k] == pat[i]:
            k += 1
        fail[i] = k

    res, j = [], 0
    for i, c in enumerate(text):                # match phase
        while j > 0 and pat[j] != c:
            j = fail[j - 1]
        if pat[j] == c:
            j += 1
        if j == len(pat):
            res.append(i - j + 1)
            j = fail[j - 1]                     # find overlapping matches
    return res
\`\`\`

\`\`\`cpp
// Rabin-Karp with rolling hash — same O(n + m) expected, multi-pattern friendly
vector<int> rabin_karp(const string& s, const string& p) {
    const long long MOD = (1LL << 61) - 1, B = 131;
    long long hp = 0, hs = 0, pw = 1;
    int m = p.size(), n = s.size();
    for (int i = 0; i < m; ++i) {
        hp = (hp * B + p[i]) % MOD;
        hs = (hs * B + s[i]) % MOD;
        if (i) pw = (pw * B) % MOD;
    }
    vector<int> hits;
    for (int i = 0; i + m <= n; ++i) {
        if (hs == hp && s.compare(i, m, p) == 0) hits.push_back(i);
        if (i + m < n)
            hs = ((hs - s[i] * pw % MOD + MOD * MOD) * B + s[i + m]) % MOD;
    }
    return hits;
}
\`\`\`

> Tip: In production you almost always want the language's built-in (\`str.find\`, \`String.indexOf\`, \`std::search\`). Implement KMP / Z when you need the **auxiliary arrays** themselves, not just match positions.`},{heading:"When to reach for it",body:"Reach for **KMP** when you need overlapping match positions or the failure array as a side product (longest happy prefix, shortest super-string, period detection). Reach for the **Z-algorithm** when the cleaner `z[i]` semantics (\"longest prefix match starting at `i`\") fits the problem (string concatenation tricks: `P + '#' + T`). Reach for **Rabin-Karp** when you need to match **many patterns simultaneously** of the same length (Aho-Corasick is faster but heavier) or when you need substring equality / hashing across the whole string. Reach for **suffix array / suffix automaton** when the queries are about **all suffixes** at once — distinct substrings, longest repeated substring, lexicographic problems. For a one-shot match in production code, just call the standard library."},{heading:"Variants",body:'**Z-algorithm** — computes `z[i]` = length of the longest substring starting at `i` matching a prefix of `s`. `O(n)` build; matching via `z` on `P + sep + T`.\n\n**Aho-Corasick** — builds a trie + failure links across many patterns. Matches all of them against `T` in `O(n + total pattern length + matches)`. Standard for "find all dictionary words in a paragraph."\n\n**Suffix array + LCP** — `O(n log n)` build; once built, every substring query reduces to binary search on suffixes. Powers "longest repeated substring," "distinct substring count," and many palindrome problems.\n\n**Suffix automaton** — `O(n)` build; minimal DFA accepting all substrings. The Swiss army knife for substring counting and online problems.\n\n**Manacher\'s algorithm** — palindrome variant: all palindromic substrings in `O(n)` (covered separately below).\n\n**String hashing (polynomial / double)** — `O(n)` preprocessing for `O(1)` substring equality. Always use **double hashing** with two mods on adversarial inputs to dodge anti-hash tests.'},{heading:"Common interview problems",body:["Implement strStr / indexOf — KMP or library call.","Longest happy prefix (LeetCode 1392) — the failure-array `fail[n-1]` is the answer.","Repeated Substring Pattern (LeetCode 459) — string period detection from the failure array.","Shortest Palindrome (LeetCode 214) — KMP on `s + '#' + reverse(s)`.","Repeated DNA Sequences (LeetCode 187) — rolling hash for 10-character windows.","Find All Anagrams in a String (LeetCode 438) — sliding-window frequency, not classical matching.","Distinct Echo Substrings — suffix automaton or hashing."]}],complexity:{best:"`O(n + m)` for KMP / Z / Rabin-Karp regardless of pattern",average:"`O(n + m)` — every character of `T` advances the matcher by one on average",worst:"`O(n·m)` for naive search; `O(n + m)` deterministic for KMP / Z; `O(n + m)` expected for Rabin-Karp (`O(n·m)` worst case if hash collides every step)",space:"`O(m)` for KMP failure array; `O(n + m)` for Z; `O(1)` extra for Rabin-Karp"},pitfalls:['**Re-running naive search inside a loop.** "For each query, scan the text" silently turns `O(n + m)` into `O(n·m·q)`. **Fix:** preprocess once (build a Z array or suffix automaton), then answer queries in `O(m)` or `O(log n)`.',"**Hash collisions in Rabin-Karp under adversarial input.** Codeforces test setters publish anti-hash strings that collide every Mersenne-prime mod. **Fix:** use **double hashing** with two large primes and randomized bases, or fall back to deterministic KMP.","**KMP failure-array off-by-one on mismatch transition.** Forgetting to handle `k = 0` separately leads to an out-of-bounds `fail[-1]` access. **Fix:** the `while k > 0` guard exists for exactly this case; never remove it.",'**Forgetting to reset the matcher after a full match.** If overlapping matches matter (`"aaaa"` containing `"aa"` 3 times), set `j = fail[j - 1]` after a hit instead of `j = 0`. **Fix:** code the reset explicitly; default to overlapping unless the problem says otherwise.',"**Using the same separator character that appears in `T` or `P`.** The Z-algorithm trick `P + '#' + T` breaks if `#` actually occurs. **Fix:** pick a sentinel guaranteed outside the alphabet (e.g., `chr(0)` for ASCII text)."]}}]},{id:"standard",label:"Standard Problems",items:[{kind:"problem",label:"Rabin-Karp"},{kind:"problem",label:"KMP"},{kind:"problem",label:"Z algorithm"},{kind:"problem",label:"Longest Prefix Suffix"},{kind:"theory",label:"Manacher's Algorithm",conceptSlug:"manachers-algorithm",body:{summary:'Find **every palindromic substring** of a string of length `n` in **`O(n)` time** by exploiting palindrome symmetry — when expanding around center `i`, reuse the radius information from the mirror center on the other side of a previously-known palindrome. The fastest known algorithm for "longest palindromic substring" and the unique-palindrome-count family.',sections:[{heading:"The mental model",body:'A palindrome has a **center** (an index for odd-length, a gap for even-length). The classic "expand around center" approach tries each of the `2n - 1` centers and expands while characters match — `O(n^2)` worst case (e.g., `"aaaaaaa"`).\n\nManacher\'s insight: if the palindrome at center `C` extends to the right boundary `R`, then for any index `i` in `[C, R)`, the palindrome at `i` is **at least as long as** the palindrome at the mirror index `2C - i` (clipped to `R - i`). That free initialization is what saves the `n` factor.\n\n```ascii\n  string s with transformed form t = "^#a#b#a#a#b#a#$"  (sentinels)\n\n  index:    0  1  2  3  4  5  6  7  8  9 10 11 12 13 14\n  char:     ^  #  a  #  b  #  a  #  a  #  b  #  a  #  $\n  radius:   0  0  1  0  3  0  1  6  1  0  3  0  1  0  0\n                          ^                ^\n                       C=4,R=7         center i=7 grows from mirror radius\n```\n\nThe `#` sentinels handle even-length palindromes uniformly — every palindrome in `t` has an **odd length** that maps cleanly back to a palindrome in `s` of length `radius`. The `^` / `$` boundary sentinels remove all bounds checks.\n\n> Note: The output `radius[i]` doubles as a complete catalog — every palindromic substring of `s` is determined by some `(i, radius[i])` pair, so the algorithm trivially produces "all palindromes," "longest palindrome," and "count of distinct palindromic substrings" with one pass.'},{heading:"Canonical operation — Manacher with transformed string",body:`\`\`\`py
def manacher(s):
    if not s: return ""
    t = "^#" + "#".join(s) + "#$"             # sentinels + separators
    n = len(t)
    p = [0] * n                                # p[i] = palindrome radius at i
    C = R = 0                                  # center and right boundary
    for i in range(1, n - 1):
        mirror = 2 * C - i
        if i < R:
            p[i] = min(R - i, p[mirror])       # free initialization
        # try to expand
        while t[i + p[i] + 1] == t[i - p[i] - 1]:
            p[i] += 1
        # update center/right if this palindrome extends further
        if i + p[i] > R:
            C, R = i, i + p[i]
    # recover longest palindrome
    max_i = max(range(n), key=lambda i: p[i])
    start = (max_i - p[max_i]) // 2            # map back to s indices
    return s[start : start + p[max_i]]
\`\`\`

The **amortized \`O(n)\` bound** comes from observing that the \`while\` loop increments \`R\` by one each iteration (because each successful expansion pushes the boundary right), and \`R\` only moves forward \`O(n)\` total.

> Tip: For "**number of distinct palindromic substrings**," use the **Eertree (palindromic tree)** instead — Manacher counts occurrences but cannot dedupe without extra hashing.`},{heading:"When to reach for it",body:"Reach for Manacher when the problem requires **all palindromes** (longest, count, enumeration) of a string with `n > ~5000` — anywhere `O(n^2)` expand-around-center will time out. Concretely: longest palindromic substring on `n = 10^5`+, count-palindromic-substrings, palindromic partitioning preprocessing, palindromic queries on a static string.\n\nReach for **expand-around-center** instead when `n ≤ ~2000` — simpler to write correctly under interview time pressure, same `O(n^2)` cap is fine. Reach for **DP `is_palindrome[i][j]`** when you need a constant-time palindrome lookup for many `(i, j)` pairs (e.g., palindrome partitioning). Reach for **Eertree** when you need **distinct** palindromic substrings or palindrome counting under insertions."},{heading:"Variants",body:'**Sentinel transformation (`#`-interleaving)**: the standard way to unify odd / even cases. The transformed string is `2n + 3` characters; map back via `start = (max_i - p[max_i]) // 2`.\n\n**Manacher without sentinels** (two arrays): keep `d1[i]` for odd-length and `d2[i]` for even-length palindromes separately. Same complexity, avoids the doubled-length string — slightly faster constants, harder to write bug-free.\n\n**Eertree (palindromic tree)**: an automaton-like structure that adds characters one at a time and tracks every distinct palindromic substring as a node. `O(n)` total. Use when distinct count matters or for online problems.\n\n**Suffix automaton + palindrome queries**: works for "does `s` contain a palindrome of length ≥ `K`?" type questions.\n\n**Generalized Manacher on multiple strings**: concatenate with unique separators (`#1#2#`) and run normally.\n\n**Count of palindromic subsequences**: a different problem entirely (not contiguous) — Manacher does not apply; use 2-D DP `O(n^2)`.'},{heading:"Common interview problems",body:["Longest Palindromic Substring (LeetCode 5) — the canonical statement.","Palindromic Substrings (LeetCode 647) — count all palindromic substrings.","Shortest Palindrome — find longest palindrome prefix of `s`, prepend the rest reversed.","Palindrome Partitioning II — minimum cuts; Manacher pre-pass enables `O(1)` palindrome check in the DP.","Number of distinct palindromic substrings — Eertree, but Manacher + hashing also works.","Longest happy palindrome / longest palindromic substring on a stream — Eertree."]}],complexity:{best:"`O(n)` even when no palindromes of length > 1 exist",average:"`O(n)` — every character enters and leaves the active palindrome boundary at most once",worst:"`O(n)` — amortized via the `R` pointer monotonically marching right",space:"`O(n)` for the transformed string `t` and the radius array `p`"},pitfalls:["Forgetting the `^` and `$` boundary sentinels — the `while` loop runs off the end of `t` and crashes. The sentinels are distinct characters that never match anything in `s`.","Off-by-one in the mapping `start = (max_i - p[max_i]) // 2` — accidentally using `// 2 + 1` or `- 1` returns a shifted substring that is *almost* the palindrome but wrong.","Updating `C` and `R` **before** the expansion loop finishes — must update only after `i + p[i] > R`, otherwise the mirror trick uses stale data.",'Re-running Manacher when only "longest palindrome of length ≤ K" is asked — easier to early-exit the radius scan once it exceeds K than to rebuild.']}},{kind:"problem",label:"Subarray Search"}]},{id:"hard",label:"Hard",items:[{kind:"problem",label:"Longest Palindromic Substring"},{kind:"problem",label:"Palindrome Substring Queries"},{kind:"problem",label:"Min Repeats for Substring"}]}]},{slug:"range-query",title:"Range Query",subsections:[{id:"theory",label:"Theory",items:[{kind:"theory",label:"Segment Tree",conceptSlug:"segment-tree",body:{summary:"A binary tree of intervals layered over an underlying array. Each node stores an **aggregate** (sum, min, max, gcd, xor, ...) of the range it covers. Both **point updates** and **range queries** run in `O(log n)`, and with **lazy propagation** range updates do too. The Swiss army knife of range problems — heavier than a Fenwick tree but far more flexible.",sections:[{heading:"Mental model",body:'Picture the input array sitting at the leaves of a complete binary tree. Every internal node owns the union of its two children\'s ranges and caches the combined aggregate. Walking down the tree splits a query range `[l, r]` into at most `O(log n)` maximal nodes that lie **entirely inside** the query — those nodes\' precomputed aggregates combine to the answer.\n\n```ascii\n array idx:    0   1   2   3   4   5   6   7\n leaves:      [5] [2] [8] [1] [9] [3] [7] [4]\n                \\_/     \\_/     \\_/     \\_/\n                 7      9       12      11           <- sum of pairs\n                  \\___/          \\___/\n                   16             23                 <- sum of quads\n                      \\__________/\n                          39                         <- root sum\n```\n\nA point update changes one leaf and re-aggregates the `O(log n)` ancestors on the path back to the root. A range query partitions `[l, r]` into the smallest set of "whole node" ranges.\n\n> Note: The aggregate function `f` must be **associative** — `f(f(a, b), c) == f(a, f(b, c))`. Sum, min, max, gcd, xor all qualify; "average" does not (combine counts and sums separately if you need it).'},{heading:"Canonical operation",body:`Iterative segment tree on a sum aggregate — half the code of the recursive version and twice as fast in practice.

\`\`\`py
class SegTree:
    def __init__(self, a):
        self.n = len(a)
        self.t = [0] * (2 * self.n)
        for i, v in enumerate(a):
            self.t[self.n + i] = v
        for i in range(self.n - 1, 0, -1):
            self.t[i] = self.t[2*i] + self.t[2*i + 1]

    def update(self, i, v):                  # point set
        i += self.n
        self.t[i] = v
        while i > 1:
            i //= 2
            self.t[i] = self.t[2*i] + self.t[2*i + 1]

    def query(self, l, r):                   # sum of [l, r)
        res = 0
        l += self.n; r += self.n
        while l < r:
            if l & 1: res += self.t[l]; l += 1
            if r & 1: r -= 1; res += self.t[r]
            l //= 2; r //= 2
        return res
\`\`\`

\`\`\`cpp
// C++ recursive — easier to extend to lazy propagation
struct Seg {
    vector<long long> t; int n;
    Seg(int n_): n(n_), t(4*n_, 0) {}
    void update(int p, int l, int r, int i, long long v) {
        if (l == r) { t[p] = v; return; }
        int m = (l + r) / 2;
        if (i <= m) update(2*p, l, m, i, v);
        else        update(2*p+1, m+1, r, i, v);
        t[p] = t[2*p] + t[2*p+1];
    }
    long long query(int p, int l, int r, int ql, int qr) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) return t[p];
        int m = (l + r) / 2;
        return query(2*p, l, m, ql, qr) + query(2*p+1, m+1, r, ql, qr);
    }
};
\`\`\`

> Tip: Always allocate \`4·n\` slots for the recursive form — the worst-case tree height plus the off-by-one slack adds up.`},{heading:"When to reach for it",body:"Reach for a segment tree the moment a Fenwick tree (BIT) can't carry the problem. Fenwick handles **prefix sum / xor** under point updates beautifully in 8 lines — use it. Move to segment tree when you need **min / max / gcd** (no inverse, so Fenwick doesn't work), **range updates + range queries** (lazy propagation), arbitrary **associative merges** (matrix product, polynomial composition), or **walking the tree** to answer \"the first index `i` such that `a[i] >= x`\" in `O(log n)`. If the operation is offline and a simple **sort + sweep + Fenwick** would do, prefer that — segment tree is the heavier tool."},{heading:"Variants",body:'**Lazy propagation** — store pending range updates at each node; push down to children only on access. Enables range-add + range-sum (or range-assign + range-min) in `O(log n)`.\n\n**Persistent segment tree** — every update produces a new `O(log n)` path while sharing the rest of the tree. Powers the classic `k`-th smallest in a range via persistent counts on values.\n\n**Merge sort tree** — each node stores its range\'s sorted copy. `O(n log n)` space; answers "how many elements in `[l, r]` are `> x`" in `O(log^2 n)` via binary search per visited node.\n\n**2-D segment tree** — segment tree of segment trees. `O(log^2 n)` per op, `O(n^2)` space; usually overkill.\n\n**Segment tree beats (Chtholly tree)** — handles `chmin` / `chmax` range ops by tracking max / second-max per node.\n\n**Implicit / dynamic segment tree** — allocates children only when touched. Use for coordinate ranges up to `10^9` without coordinate compression.'},{heading:"Common interview problems",body:["Range Sum Query — Mutable (LeetCode 307) — the textbook intro.","Count of Smaller Numbers After Self (LeetCode 315) — merge-sort tree or BIT on compressed values.","My Calendar III (LeetCode 732) — range-add, max query, lazy propagation.","Skyline Problem (LeetCode 218) — segment tree on coordinate-compressed x with lazy max.","Range Module (LeetCode 715) — interval add / remove / query, frequently solved with segment tree.","Falling Squares (LeetCode 699) — range-assign max with lazy propagation.","Number of Longest Increasing Subsequence — segment tree keyed by value."]}],complexity:{build:"`O(n)` bottom-up — every node touched once",operation:"`O(log n)` per point update or range query; `O(log n)` per range update with lazy propagation",time:"Point query / update `O(log n)`; range query / range update `O(log n)`",space:"`O(4n)` for a recursive tree; `O(2n)` for the iterative variant on power-of-two sizes"},pitfalls:["**Off-by-one on the range convention.** Mixing `[l, r]` inclusive with `[l, r)` half-open is the #1 source of bugs. **Fix:** pick the half-open form, document it in a comment at the class top, and stick to it across query, update, and recursion.","**Forgetting to push the lazy tag down before reading children.** Each `query` / `update` that descends into children must first apply the parent's pending update and clear the tag. **Fix:** write a `push(p)` helper and call it as the first line of every recursive method.",'**Reaching for segment tree when Fenwick suffices.** For pure prefix sum or xor with point updates, BIT is 8 lines, twice as fast, and bug-free. **Fix:** ask "do I need min / max / range update / something non-invertible?" If no, write a Fenwick.',"**Under-allocating the tree array.** Sizing at `2n` for the recursive form crashes on non-power-of-two `n`. **Fix:** allocate `4n` for recursive, or round `n` up to the next power of two for iterative.",'**Combining non-associative aggregates.** Segment tree silently breaks if `f` isn\'t associative (e.g., subtraction). **Fix:** verify `f(f(a,b),c) == f(a,f(b,c))` on paper before coding; for "average," store `(sum, count)` and divide at the end.']}}]},{id:"basic-seg",label:"Basic Segment Tree",items:[{kind:"problem",label:"Segment Tree"},{kind:"problem",label:"Min-Max Range Queries"},{kind:"problem",label:"Range LCM Queries"},{kind:"problem",label:"XOR of a given range"}]},{id:"lazy",label:"Segment Tree with Updates",items:[{kind:"problem",label:"Lazy Propagation"},{kind:"problem",label:"Flipping Sign"}]},{id:"app",label:"Segment Tree Applications",items:[{kind:"problem",label:"Build a segment tree for N-ary rooted tree"},{kind:"problem",label:"Maximum of all subarrays of size K using Segment Tree"}]},{id:"fenwick",label:"Fenwick Tree",items:[{kind:"problem",label:"Fenwick Tree"},{kind:"problem",label:"Sum and Update Queries on 3D Matrix"}]}]}];function I(n){return n.subsections.reduce((a,o)=>a+o.items.length,0)}function me(){return O.reduce((n,a)=>n+I(a),0)}function T(n){return(n||"").toLowerCase().replace(/[^a-z0-9]+/g,"")}function Ce({session:n}){var z;const a=(z=n==null?void 0:n.user)==null?void 0:z.id,{data:o=[]}=ae(),{data:s=[]}=ie(),{data:d}=re(a),l=y.useMemo(()=>(d==null?void 0:d.byId)||{},[d]),p=y.useMemo(()=>{const t=new Map;return o.forEach(r=>t.set(T(r.name),r)),t},[o]),g=y.useMemo(()=>{const t=new Map;return s.forEach(r=>t.set(T(r.title),r)),t},[s]),w=y.useMemo(()=>{let t=0,r=0,c=0;return O.forEach(b=>{b.subsections.forEach(v=>{v.items.forEach(k=>{var S;if(k.kind==="problem"){t++;const M=p.get(T(k.label));M&&(c++,(S=l[M.id])!=null&&S.is_completed&&r++)}})})}),{totalProblems:t,solved:r,matched:c,totalAll:me()}},[p,l]),i=y.useMemo(()=>O.map(t=>{let r=0,c=0;return t.subsections.forEach(b=>{b.items.forEach(v=>{var S;if(v.kind!=="problem")return;r+=1;const k=p.get(T(v.label));k&&((S=l[k.id])!=null&&S.is_completed)&&(c+=1)})}),{slug:t.slug,title:t.title,solved:c,total:r,pct:r?c/r:0}}),[p,l]),[h,u]=y.useState(""),m=h.trim().toLowerCase(),[x,f]=y.useState(()=>new Set(O.map(t=>t.slug))),[F,H]=y.useState("all"),[N,R]=y.useState(!1),X=t=>f(r=>{const c=new Set(r);return c.has(t)?c.delete(t):c.add(t),c}),$=()=>f(new Set(O.map(t=>t.slug))),Q=()=>f(new Set),A=y.useMemo(()=>{if(!m)return null;const t=new Map;return O.forEach(r=>{const c=r.subsections.map(b=>{const v=b.items.filter(k=>k.label.toLowerCase().includes(m));return v.length?{...b,items:v}:null}).filter(Boolean);(c.length||r.title.toLowerCase().includes(m))&&t.set(r.slug,c.length?c:r.subsections)}),t},[m]),q=y.useRef(null),[Y,Z]=y.useState(!1);y.useEffect(()=>{const t=q.current;if(!t)return;const r=()=>Z(t.scrollTop>600);return t.addEventListener("scroll",r),()=>t.removeEventListener("scroll",r)},[]);const ee=()=>{var t;(t=q.current)==null||t.scrollTo({top:0,behavior:"smooth"})},_=t=>{var c;const r=(c=q.current)==null?void 0:c.querySelector(`#tut-${t}`);r&&q.current&&q.current.scrollTo({top:r.offsetTop-20,behavior:"smooth"}),f(b=>{const v=new Set(b);return v.delete(t),v})},E=w.totalProblems?Math.round(w.solved/w.totalProblems*100):0;return e.jsxs("div",{className:"tut-container",ref:q,children:[e.jsxs("header",{className:"tut-header",children:[e.jsxs("div",{className:"tut-title-row",children:[e.jsxs("h1",{className:"tut-title",children:[e.jsx(D,{size:20,className:"tut-title-icon"})," DSA Tutorial"]}),e.jsx("div",{className:"tut-summary",children:a?e.jsxs("span",{children:[w.totalAll," items · ",O.length," topics"]}):e.jsxs("span",{children:[w.totalAll," items · ",O.length," topics"]})})]}),a&&e.jsxs("div",{className:"tut-progress",children:[e.jsxs("div",{className:"tut-progress-meta",children:[e.jsx("span",{className:"tut-progress-label",children:"Your progress"}),e.jsxs("span",{className:"tut-progress-value",children:[e.jsx("strong",{children:w.solved})," / ",w.totalProblems," solved",e.jsxs("span",{className:"tut-progress-pct",children:["· ",E,"%"]})]})]}),e.jsx("div",{className:"tut-progress-bar",children:e.jsx("div",{className:"tut-progress-fill",style:{width:`${E}%`}})})]}),e.jsxs("p",{className:"tut-sub",children:["Data structures and algorithms, top to bottom. Theory rows open the concept page; problem rows open the solver. Items marked ",e.jsx(G,{size:11,className:"tut-inline-icon"})," are coming soon."]})]}),e.jsxs("div",{className:"tut-controls",children:[e.jsxs("div",{className:"tut-search",children:[e.jsx(oe,{size:13,className:"tut-search-icon"}),e.jsx("input",{value:h,onChange:t=>u(t.target.value),placeholder:"Search across the entire syllabus..."}),h&&e.jsx("button",{className:"tut-search-clear",onClick:()=>u(""),"aria-label":"Clear",children:e.jsx(W,{size:12})})]}),e.jsx("div",{className:"tut-filters",children:[{id:"all",label:"All"},{id:"theory",label:"Theory"},{id:"problems",label:"Problems"},{id:"unsolved",label:a?"Unsolved":"Available"}].map(t=>e.jsx("button",{type:"button",className:`tut-filter-chip ${F===t.id?"active":""}`,onClick:()=>H(t.id),children:t.label},t.id))}),e.jsxs("div",{className:"tut-actions",children:[e.jsx("button",{onClick:Q,children:"Expand all"}),e.jsx("button",{onClick:$,children:"Collapse all"})]})]}),e.jsxs("div",{className:`tut-body ${N?"with-toc":""}`,children:[N&&e.jsx("button",{className:"tut-toc-overlay","aria-label":"Close contents",onClick:()=>R(!1)}),e.jsxs("aside",{className:`tut-toc ${N?"open":""}`,children:[e.jsxs("div",{className:"tut-toc-head",children:[e.jsx("h3",{className:"tut-toc-title",children:"Contents"}),e.jsx("button",{className:"tut-toc-close",onClick:()=>R(!1),"aria-label":"Close",children:e.jsx(W,{size:12})})]}),e.jsx("ol",{className:"tut-toc-list",children:O.map((t,r)=>{const c=I(t);return e.jsx("li",{children:e.jsxs("button",{onClick:()=>{_(t.slug),R(!1)},children:[e.jsx("span",{className:"tut-toc-num",children:String(r+1).padStart(2,"0")}),e.jsx("span",{className:"tut-toc-name",children:t.title}),e.jsx("span",{className:"tut-toc-count",children:c})]})},t.slug)})})]}),e.jsx("main",{className:"tut-main",children:O.map((t,r)=>{const c=A?A.get(t.slug):t.subsections;if(!c)return null;const b=x.has(t.slug)&&!A,v=I(t);return e.jsxs("section",{id:`tut-${t.slug}`,className:"tut-section",children:[e.jsxs("header",{className:"tut-section-head",onClick:()=>X(t.slug),children:[e.jsx("span",{className:"tut-section-num",children:String(r+1).padStart(2,"0")}),b?e.jsx(B,{size:14}):e.jsx(L,{size:14}),e.jsx("h2",{className:"tut-section-title",children:t.title}),e.jsx("span",{className:"tut-section-count",children:v})]}),t.note&&!b&&e.jsx("p",{className:"tut-section-note",children:t.note}),!b&&c.map(k=>{const S=k.items.filter(M=>ge(M,F,p,l));return S.length===0?null:e.jsxs("div",{className:"tut-subsection",children:[e.jsx("h3",{className:"tut-subsection-title",children:k.label}),e.jsx("ul",{className:"tut-item-list",children:S.map((M,ne)=>e.jsx(be,{item:M,problemByName:p,conceptByName:g,byId:l,highlight:m},`${k.id}-${ne}`))})]},k.id)})]},t.slug)})})]}),Y&&e.jsx("button",{className:"tut-back-top",onClick:ee,"aria-label":"Back to top",children:e.jsx(se,{size:14})}),e.jsx("nav",{className:"tut-rail","aria-label":"Sections quick access",children:i.map((t,r)=>{const c=2*Math.PI*13,b=c*t.pct;return e.jsxs("button",{className:`tut-rail-dot ${t.pct===1?"done":""}`,onClick:()=>_(t.slug),title:`${t.title} — ${t.solved}/${t.total} solved`,"aria-label":`Jump to ${t.title}, ${t.solved} of ${t.total} solved`,children:[e.jsxs("svg",{viewBox:"0 0 32 32",className:"tut-rail-svg",children:[e.jsx("circle",{cx:"16",cy:"16",r:"13",className:"tut-rail-bg"}),e.jsx("circle",{cx:"16",cy:"16",r:"13",className:"tut-rail-fg",strokeDasharray:`${b} ${c-b}`,transform:"rotate(-90 16 16)"})]}),e.jsx("span",{className:"tut-rail-num",children:r+1})]},t.slug)})})]})}function ge(n,a,o,s){var d;if(a==="all")return!0;if(a==="theory")return n.kind==="theory"||n.kind==="topic";if(a==="problems")return n.kind==="problem";if(a==="unsolved"){if(n.kind!=="problem")return!1;const l=g=>(g||"").toLowerCase().replace(/[^a-z0-9]+/g,""),p=o.get(l(n.label));return p?!((d=s[p.id])!=null&&d.is_completed):!1}return!0}function P(n,a){if(!a)return n;const s=n.toLowerCase().indexOf(a);return s===-1?n:e.jsxs(e.Fragment,{children:[n.slice(0,s),e.jsx("mark",{children:n.slice(s,s+a.length)}),n.slice(s+a.length)]})}function be({item:n,problemByName:a,conceptByName:o,byId:s,highlight:d}){var w;const[l,p]=y.useState(!1);if(n.kind==="topic"){const i=n.conceptSlug?null:o.get(T(n.label)),h=n.conceptSlug||(i==null?void 0:i.slug);let u=i==null?void 0:i.module_slug;if(h&&!u){const f=[...o.values()].find(F=>F.slug===h);f&&(u=f.module_slug)}const m=!!n.body,x=!!(h&&u);return e.jsxs("li",{className:`tut-item-theory-wrap tut-item-topic-wrap ${l?"expanded":""}`,children:[e.jsxs("button",{type:"button",className:"tut-item tut-item-topic tut-item-theory-button",onClick:()=>p(f=>!f),"aria-expanded":l,children:[e.jsx("span",{className:"tut-item-icon",children:l?e.jsx(L,{size:11}):e.jsx(B,{size:11})}),e.jsx("span",{className:"tut-item-label",children:P(n.label,d)}),e.jsx("span",{className:"tut-item-kind",children:"topic"})]}),l&&e.jsxs("div",{className:"tut-theory-body",children:[m&&e.jsx(J,{body:n.body}),x&&e.jsxs(j,{to:`/learn/${u}/${h}`,className:"tut-theory-readmore",children:[e.jsx(D,{size:11})," Open full concept page",e.jsx(V,{size:10})]}),!m&&!x&&e.jsxs("p",{className:"tut-theory-placeholder",children:[e.jsx(le,{size:10,className:"tut-inline-icon"}),"See the related concepts above for in-depth coverage."]})]})]})}if(n.kind==="theory"){const i=n.conceptSlug?null:o.get(T(n.label)),h=n.conceptSlug||(i==null?void 0:i.slug);let u=i==null?void 0:i.module_slug;if(h&&!u){const f=[...o.values()].find(F=>F.slug===h);f&&(u=f.module_slug)}const m=!!n.body,x=!!(h&&u);return m?e.jsxs("li",{className:`tut-item-theory-wrap ${l?"expanded":""}`,children:[e.jsxs("button",{type:"button",className:"tut-item tut-item-theory tut-item-theory-button",onClick:()=>p(f=>!f),"aria-expanded":l,children:[e.jsx("span",{className:"tut-item-icon",children:l?e.jsx(L,{size:11}):e.jsx(B,{size:11})}),e.jsx("span",{className:"tut-item-label",children:P(n.label,d)}),e.jsx("span",{className:"tut-item-kind",children:"theory"})]}),l&&e.jsxs("div",{className:"tut-theory-body",children:[e.jsx(J,{body:n.body}),x&&e.jsxs(j,{to:`/learn/${u}/${h}`,className:"tut-theory-readmore",children:[e.jsx(D,{size:11})," Open full concept page",e.jsx(V,{size:10})]})]})]}):x?e.jsx("li",{className:"tut-item tut-item-theory",children:e.jsxs(j,{to:`/learn/${u}/${h}`,className:"tut-item-link",children:[e.jsx("span",{className:"tut-item-icon",children:e.jsx(D,{size:11})}),e.jsx("span",{className:"tut-item-label",children:P(n.label,d)}),e.jsx("span",{className:"tut-item-kind",children:"theory"})]})}):e.jsxs("li",{className:"tut-item tut-item-theory-soft",children:[e.jsx("span",{className:"tut-item-icon",children:e.jsx(D,{size:11})}),e.jsx("span",{className:"tut-item-label",children:P(n.label,d)}),e.jsx("span",{className:"tut-item-kind",children:"theory · soon"})]})}const g=n.id?null:a.get(T(n.label));if(g){const i=s[g.id],h=i==null?void 0:i.is_completed,u=!h&&((i==null?void 0:i.status)==="attempted"||(i==null?void 0:i.is_starred)),m=h?"solved":u?"attempted":"todo";return e.jsx("li",{className:`tut-item ${h?"solved":""}`,children:e.jsxs(j,{to:`/category/${encodeURIComponent(g.topic_id)}/${encodeURIComponent(g.id)}`,className:"tut-item-link",children:[e.jsx("span",{className:`tut-bubble tut-bubble-${m}`,"aria-label":h?"solved":u?"attempted":"not started",children:h&&e.jsx(de,{size:9})}),e.jsx("span",{className:"tut-item-label",children:P(n.label,d)}),e.jsx("span",{className:`tut-item-diff tut-diff-${(w=g.difficulty)==null?void 0:w.toLowerCase()}`,children:g.difficulty})]})})}return e.jsxs("li",{className:"tut-item tut-item-soon",children:[e.jsx("span",{className:"tut-item-icon",children:e.jsx(G,{size:10})}),e.jsx("span",{className:"tut-item-label",children:P(n.label,d)}),e.jsx("span",{className:"tut-item-kind",children:"soon"})]})}function C(n,a=""){if(n==null)return null;const o=String(n);return o.includes("`")?o.split("`").map((d,l)=>l%2===1?e.jsx("code",{className:"tut-theory-code",children:d},`${a}-c-${l}`):e.jsx(te.Fragment,{children:d},`${a}-t-${l}`)):o}function fe(n){const a=/^>\s*(Note|Warning|Tip|Insight|Caution):\s*(.*)$/i.exec(n.trim());return a?{kind:a[1].toLowerCase(),text:a[2]}:null}function ye({kind:n,children:a}){const o=n==="warning"||n==="caution"?e.jsx(ce,{size:13}):n==="tip"||n==="insight"?e.jsx(ue,{size:13}):e.jsx(pe,{size:13});return e.jsxs("aside",{className:`tut-callout tut-callout-${n}`,children:[e.jsx("span",{className:"tut-callout-icon",children:o}),e.jsx("span",{className:"tut-callout-body",children:a})]})}function U(n,a){if(!n)return null;const o=n.split(`
`),s=[];let d=[],l=!1,p="",g=[];const w=()=>{if(!d.length)return;const i=d.join(`
`).trim();if(!i){d=[];return}i.split(/\n{2,}/).forEach((h,u)=>{const m=h.trim();if(!m)return;const x=fe(m);if(x){s.push(e.jsx(ye,{kind:x.kind,children:C(x.text,`${a}-cl-${s.length}`)},`${a}-cl-${s.length}-${u}`));return}s.push(e.jsx("p",{children:C(m,`${a}-p-${s.length}`)},`${a}-p-${s.length}-${u}`))}),d=[]};for(let i=0;i<o.length;i++){const h=o[i],u=/^```(\w*)\s*$/.exec(h);if(u){l?(s.push(e.jsx("pre",{className:`tut-theory-pre tut-theory-pre-${p||"plain"}`,children:e.jsx("code",{children:g.join(`
`)})},`${a}-pre-${s.length}`)),l=!1,p="",g=[]):(w(),l=!0,p=u[1]||"");continue}if(l){g.push(h);continue}d.push(h)}return l&&s.push(e.jsx("pre",{className:`tut-theory-pre tut-theory-pre-${p||"plain"}`,children:e.jsx("code",{children:g.join(`
`)})},`${a}-pre-${s.length}`)),w(),s}function we({complexity:n}){if(!n)return null;if(typeof n=="string")return e.jsxs("div",{className:"tut-theory-complexity",children:[e.jsxs("span",{className:"tut-theory-cx-label",children:[e.jsx(K,{size:11})," Complexity"]}),e.jsx("span",{className:"tut-theory-cx-value",children:C(n,"cx-str")})]});const a=[];return n.best&&a.push(["Best",n.best]),n.average&&a.push(["Average",n.average]),n.worst&&a.push(["Worst",n.worst]),n.space&&a.push(["Space",n.space]),n.notes&&a.push(["Notes",n.notes]),e.jsxs("div",{className:"tut-theory-cx-card",children:[e.jsxs("div",{className:"tut-theory-cx-head",children:[e.jsx(K,{size:12}),e.jsx("span",{children:"Complexity"})]}),e.jsx("table",{className:"tut-theory-cx-table",children:e.jsx("tbody",{children:a.map(([o,s],d)=>e.jsxs("tr",{children:[e.jsx("th",{children:o}),e.jsx("td",{children:C(s,`cxr-${d}`)})]},d))})})]})}function ve({items:n}){return!n||!n.length?null:e.jsxs("div",{className:"tut-theory-pitfalls",children:[e.jsxs("div",{className:"tut-theory-pitfalls-head",children:[e.jsx(he,{size:12}),e.jsx("span",{children:"Pitfalls"})]}),e.jsx("ul",{children:n.map((a,o)=>e.jsx("li",{children:C(a,`pf-${o}`)},o))})]})}function J({body:n}){var a;return n?typeof n=="string"?e.jsx("div",{className:"tut-theory-content",children:U(n,"str")}):e.jsxs("div",{className:"tut-theory-content",children:[n.summary&&e.jsx("p",{className:"tut-theory-summary",children:C(n.summary,"sum")}),(a=n.sections)==null?void 0:a.map((o,s)=>e.jsxs("div",{className:"tut-theory-section",children:[e.jsx("h4",{className:"tut-theory-heading",children:o.heading}),Array.isArray(o.body)?e.jsx("ul",{className:"tut-theory-list",children:o.body.map((d,l)=>e.jsx("li",{children:C(d,`sec-${s}-li-${l}`)},l))}):U(o.body,`sec-${s}`)]},s)),e.jsx(we,{complexity:n.complexity}),e.jsx(ve,{items:n.pitfalls})]}):null}export{Ce as default};
