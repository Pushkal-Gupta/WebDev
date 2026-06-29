---
slug: js-variables-scoping
module: javascript-language
title: Variables & Scoping
subtitle: let, const, and var — block scope versus function scope, hoisting, and the temporal dead zone that decides where a name is born and where it can be read.
difficulty: Beginner
position: 1
estimatedReadMinutes: 13
prereqs: []
relatedProblems: []
references:
  - title: "MDN — let"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let"
    type: docs
  - title: "MDN — Hoisting (Glossary)"
    url: "https://developer.mozilla.org/en-US/docs/Glossary/Hoisting"
    type: docs
  - title: "javascript.info — The old var"
    url: "https://javascript.info/var"
    type: article
  - title: "javascript.info — Variable scope, closure"
    url: "https://javascript.info/closure"
    type: article
status: published
---

## intro
A variable is a name bound to a value, but in JavaScript the interesting question is not *what* a name holds — it's *where* the name lives and *when* you are allowed to read it. Three keywords declare variables: `var`, the legacy one, is **function-scoped** and quietly hoisted; `let` and `const` are **block-scoped** and guarded by a temporal dead zone that makes reading-before-declaring an error instead of a silent `undefined`. `const` adds one more rule: the binding can't be reassigned. Getting scope right is what keeps a variable from leaking somewhere it shouldn't.

## whyItMatters
Scope bugs are the quiet kind — no crash, just a variable holding a value you didn't expect because it leaked out of a loop or got hoisted above the line you thought defined it. The classic interview trap (a `for (var i …)` loop whose callbacks all print the final `i`) is purely a scoping story, and it disappears the moment you switch to `let`. Beyond trick questions, every closure, every module, every event handler depends on understanding which names are visible where. Modern JavaScript style is "`const` by default, `let` when you must reassign, `var` never," and that rule only makes sense once you can see what each keyword does to scope and hoisting. Read scope fluently and a whole category of "why is this `undefined`?" bugs stops happening.

## intuition
Picture scope as a set of nested boxes. The outermost box is the module or global; every function you call opens a new box inside the current one; and with `let`/`const`, every `{ … }` block — an `if`, a `for`, even a bare pair of braces — opens its own box too. A name declared in a box is visible inside that box and any box nested within it, but **not** in the boxes around it. When you read a name, JavaScript looks in the current box, then the box around that, then the next one out, until it finds the name or runs out of boxes (a `ReferenceError`).

`var` breaks the block rule. A `var` declared anywhere inside a function belongs to the **whole function box**, ignoring any `if` or `for` braces it sits in. Worse, its *declaration* is **hoisted** to the top of that function box before any code runs — so the name exists from line one, holding `undefined`, even though the line that assigns it hasn't executed yet. That's why reading a `var` "too early" gives `undefined` instead of an error: the box already has the slot, just not the value.

`let` and `const` are hoisted too, but into a **temporal dead zone (TDZ)**: the name is reserved at the top of its block, yet any attempt to read it *before its declaration line runs* throws a `ReferenceError`. The TDZ turns a silent bug into a loud one. `const` layers on immutability of the *binding* — you can't point the name at a new value — but it does **not** freeze the object the name points to; a `const` array can still be `push`ed to, because you're mutating the object, not rebinding the name. The mental rule that falls out: the smaller and later a name's birth, the safer it is — so prefer block-scoped `const`, declared right where you first need it.

## visualization
```
function box                         lookup walks OUTWARD, box by box
┌───────────────────────────────┐
│ var v        (hoisted to top)  │   read v before its line  -> undefined
│ let outer    (block-scoped)    │   read let before its line -> TDZ error
│                                │
│   if-block box                 │
│   ┌─────────────────────────┐  │   blockLet visible here ...
│   │ var v2  -> leaks to fn   │  │   ... but NOT outside the if box
│   │ let blockLet (stays in)  │  │
│   └─────────────────────────┘  │
│                                │
│ read v2  -> works (var leaked) │
│ read blockLet -> ReferenceError│
└───────────────────────────────┘
```

## bruteForce
The pre-2015 way was `var` everywhere. It works, but it pushes the cost onto you: because `var` ignores blocks, a counter declared inside a loop is visible (and shared) across the whole function, so you constantly invent unique names or wrap code in extra functions just to get isolation. Reading a `var` before its assignment hands you `undefined` rather than complaining, so a typo or a reordered line fails silently. And nothing stops you from accidentally reassigning a value meant to be fixed. You *can* ship correct code this way, but you're fighting the language's defaults the entire time.

## optimal
Default to `const`. Reach for `let` only when you genuinely reassign the binding (a loop counter, an accumulator, a value built up across branches), and treat `var` as deprecated — there is no situation in modern code where `var` is the right answer over `let`. This single habit removes a whole class of bugs: `const` makes "this never changes" enforceable, the compiler-checked kind of documentation, and `let`'s block scope means a name declared inside an `if` or `for` simply doesn't exist outside it, so it can't leak or collide.

Declare each variable **as late as possible and as locally as possible** — right where you first need it, in the smallest block that needs it. That keeps every name's lifetime short and its meaning obvious, and it means the temporal dead zone never bites you, because you never read a name above its declaration. When you must reassign, prefer rebuilding a value with `const` and a ternary or a small helper over mutating a `let` across several branches; immutable-by-default code is easier to trace because a `const` you can see declared is a `const` you can trust hasn't changed underneath you. Remember the one limit of `const`: it freezes the *binding*, not the *value*. If you want a truly unchangeable object, reach for `Object.freeze`, and know that even that is shallow. The payoff of all this is readability: a reader scanning your function can tell, from the keyword alone, which names are fixed and which move, and from the braces alone, exactly how far each name reaches.

## complexity
time: Variable declaration, lookup, and assignment are all O(1) — resolving a name is a fixed walk up a small chain of scopes that the engine resolves to direct slots at parse time, not a search. Scope has no algorithmic cost; it's a correctness and readability concern, not a performance one.
space: Each live variable occupies O(1) space for its slot; a scope holds O(k) slots for its k declared names. Block-scoped names are reclaimed when their block exits (unless captured by a closure), so tighter scopes free memory sooner.
notes: Hoisting is a parse-time rewrite, not a runtime cost — the engine knows every declaration in a scope before the first statement runs. The TDZ is a runtime check on each early read, but it only triggers on buggy access patterns you should never ship.

## pitfalls
- **`var` leaks out of blocks.** A `var` declared inside an `if` or `for` belongs to the entire enclosing function, so it's visible (and shared) long after the block ends — the source of the classic "all my loop callbacks see the last value" bug. Use `let`, which is scoped to the block, so each iteration gets a fresh binding.
- **Reading a `let`/`const` before its line throws.** The temporal dead zone means `console.log(x); let x = 1;` is a `ReferenceError`, not `undefined`. Always declare before you use — the error is the language protecting you, not fighting you.
- **`const` doesn't freeze objects.** `const arr = [1]; arr.push(2);` is perfectly legal — `const` blocks reassigning `arr`, not mutating what it points to. For real immutability use `Object.freeze`, and remember it's shallow.
- **Re-declaring with `let` in the same block is an error.** Unlike `var` (which silently allows redeclaration), `let x` twice in one block throws a `SyntaxError`. This catches copy-paste mistakes — a feature, but a surprise if you expect `var`'s permissiveness.
- **Forgetting a keyword creates a global.** An assignment like `count = 5` with no `let`/`const`/`var` (outside strict mode) creates an accidental global that survives the function. Use `'use strict'` or modules (which are strict by default) so this throws instead.

## interviewTips
- State the rule crisply: "`var` is function-scoped and hoisted as `undefined`; `let` and `const` are block-scoped with a temporal dead zone; `const` also forbids reassignment." That one sentence answers most scoping questions.
- Be ready for the loop-callback classic. Explain that `for (var i …)` shares one `i` across all iterations, while `for (let i …)` creates a fresh `i` per iteration — then say which one fixes the bug and why.
- Clarify the limit of `const` before they ask: "`const` fixes the binding, not the value — a `const` object is still mutable." Naming the boundary unprompted signals real understanding.

## keyTakeaways
- `var` is function-scoped and hoisted to `undefined`; `let` and `const` are block-scoped and live in a temporal dead zone until their declaration line runs.
- `const` prevents reassigning the binding but not mutating the value it points to; use `Object.freeze` for shallow immutability.
- Default to `const`, use `let` only when you reassign, never use `var`, and declare every name as late and as locally as possible.

## code.javascript
```javascript
// var is function-scoped and hoisted: reading it before its line gives undefined.
function scopeDemo() {
  console.log("var before its line:", typeof v); // "undefined" (hoisted slot, no value yet)
  var v = "I am function-scoped";
  if (true) {
    var v2 = "var ignores the block — I leak to the function";
    let blockLet = "I live only inside this if-block";
    console.log("inside block, blockLet:", blockLet);
  }
  console.log("outside block, v2:", v2);          // var leaked out of the if
  console.log("v:", v);
}
scopeDemo();

// Temporal Dead Zone: a let exists in scope but can't be read before its line.
function tdzDemo() {
  try {
    console.log(early);                            // throws — early is in the TDZ
    let early = 1;
  } catch (e) {
    console.log("TDZ error:", e.constructor.name); // ReferenceError
  }
}
tdzDemo();

// const blocks reassignment of the binding...
const PI = 3.14;
try {
  PI = 3.15;
} catch (e) {
  console.log("const reassign:", e.constructor.name); // TypeError
}

// ...but it does NOT freeze the value the binding points to.
const nums = [1, 2];
nums.push(3);                                       // mutating is allowed
console.log("const array mutated:", nums);          // [ 1, 2, 3 ]
```

## code.python
```python
# Python has no block scope: names made inside if/for leak to the whole function.
def scope_demo():
    if True:
        leaked = "created in the if, still visible after"
    print("leaked:", leaked)                      # works — Python has no block scope

    # Using a local name before assignment raises (Python's nearest analog to the TDZ).
    try:
        print(early)
        early = 1
    except UnboundLocalError as e:
        print("used before assignment:", type(e).__name__)

scope_demo()

# Python has no const; UPPERCASE is only a convention and stays reassignable.
PI = 3.14
PI = 3.15                                          # allowed — nothing stops you
print("PI:", PI)

# A list is mutable even when the name is meant to be fixed.
nums = [1, 2]
nums.append(3)                                     # mutating is fine
print("nums:", nums)                               # [1, 2, 3]
```

## code.java
```java
public class Scoping {
    static void blockScope() {
        // Java is block-scoped: a name declared in a block is gone after it.
        if (true) {
            int inner = 42;
            System.out.println("inside block, inner: " + inner);
        }
        // System.out.println(inner); // would NOT compile — out of scope
        System.out.println("inner is not visible out here");
    }

    public static void main(String[] args) {
        blockScope();

        // final is Java's const: reassigning it is a compile error.
        final double PI = 3.14;
        // PI = 3.15; // compile error: cannot assign a value to final variable PI
        System.out.println("PI: " + PI);

        // A final reference can still have its object mutated.
        final int[] nums = {1, 2, 3};
        nums[0] = 9;
        System.out.println("nums[0] after mutate: " + nums[0]); // 9
    }
}
```

## code.cpp
```cpp
#include <iostream>
using namespace std;

void blockScope() {
    // C++ is block-scoped: a name declared in a block is gone after it.
    if (true) {
        int inner = 42;
        cout << "inside block, inner: " << inner << "\n";
    }
    // cout << inner; // would NOT compile — out of scope
    cout << "inner is not visible out here\n";
}

int main() {
    blockScope();

    const double PI = 3.14;
    // PI = 3.15; // compile error: assignment of read-only variable 'PI'
    cout << "PI: " << PI << "\n";

    // A const array's elements can still be non-const and mutable here.
    int nums[] = {1, 2, 3};
    nums[0] = 9;
    cout << "nums[0] after mutate: " << nums[0] << "\n"; // 9
    return 0;
}
```
