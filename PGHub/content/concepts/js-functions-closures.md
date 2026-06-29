---
slug: js-functions-closures
module: javascript-language
title: Functions & Closures
subtitle: Declarations, expressions, and arrow functions; how a closure captures the variables around it; and the one rule for this — that it's decided by how a function is called.
difficulty: Beginner
position: 2
estimatedReadMinutes: 14
prereqs: [js-variables-scoping]
relatedProblems: []
references:
  - title: "MDN — Closures"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures"
    type: docs
  - title: "MDN — Arrow function expressions"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions"
    type: docs
  - title: "MDN — this"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this"
    type: docs
  - title: "javascript.info — Closure"
    url: "https://javascript.info/closure"
    type: article
status: published
---

## intro
In JavaScript, functions are values: you can store one in a variable, pass it to another function, and return it from a call. That single fact powers the two ideas that trip people up most — **closures**, where a returned function keeps using the variables it was born among, and **`this`**, the keyword whose value is decided not by where a function is written but by how it's called. Add the three ways to write a function (declaration, expression, arrow) and you have the toolkit behind callbacks, modules, and almost every JavaScript pattern.

## whyItMatters
Closures are not an exotic feature you can skip — they're how event handlers remember which button they belong to, how a module hides private state, how `setTimeout` keeps a value alive until it fires. Every time you write a callback that uses a variable from the surrounding function, you're using a closure, and understanding it is the difference between code that works and code that mysteriously sees the wrong value. `this` is the other half: arrow functions exist largely because the old `this` rules surprised people so often, and knowing why `this` is `undefined` in a detached method is a perennial interview question and a real bug you'll hit. Master these and callbacks, higher-order functions, and class methods all stop being mysterious.

## intuition
Start with the three shapes. A **function declaration** — `function f() {}` — is hoisted, meaning the whole function is available before its line in the file, so you can call it from above. A **function expression** — `const f = function () {}` — is just a value assigned to a name, so it only exists after that line runs. An **arrow function** — `const f = () => …` — is the compact form: a single-expression body needs no `return` and no braces, and crucially it has **no `this` of its own**.

Now the big idea: a **closure**. When a function is created, it doesn't just capture a snapshot of the variables around it — it captures the *living variables themselves*. So if an outer function declares `count` and returns an inner function that reads and writes `count`, that inner function keeps `count` alive even after the outer function has returned and its call frame is gone. Each call to the inner function sees and updates the same `count`. This is how you build a counter, a private cache, or a function pre-loaded with configuration: the captured variables become hidden state that only the returned function can touch. Picture the outer call frame popping off the stack, but a little bubble of captured variables floating away, still tethered to the function that closed over them.

Finally, **`this`**. The rule is short and the exceptions are what confuse people: for a normal function, `this` is whatever is to the *left of the dot* at the call site — `obj.method()` makes `this` be `obj`. Call the same function with no object (`const f = obj.method; f()`) and `this` is lost. Arrow functions opt out of this game entirely: they have no own `this`, so they use the `this` of the scope where they were *defined*. That's exactly why an arrow is the right tool for a callback inside a method — it keeps the method's `this` instead of getting its own. The whole `this` story reduces to: normal functions get `this` from the call, arrows inherit it from their birthplace.

## visualization
```
THREE function shapes               CLOSURE: the variable outlives the call
  function f(){}   hoisted             makeCounter() returns inner fn
  const g = fn     after its line      ┌ outer frame ─────────┐
  const h = ()=>…  no own `this`       │ let count = 0        │  frame returns,
                                       └──────────┬───────────┘  pops off stack
`this` = left of the dot:                         │  but count
  obj.method()  -> this = obj           ╭─────────▼──────────╮  survives in a
  const m = obj.method; m()  -> lost    │ closure: count = 3 │  captured bubble
  arrow -> this from where it's DEFINED ╰──── next() reads ──╯  next():1,2,3...
```

## bruteForce
Without closures you'd fake private state with conventions and globals. Need a counter that persists across calls? Put `count` in an outer scope or a global and hope nothing else touches it — now any code can read or clobber it, and two counters share one variable. Need a callback that remembers a value? Stash it on a shared object and thread it through manually. As for `this`, the old workaround was `const self = this;` at the top of a method so inner functions could reach the outer `this` through a renamed variable, or sprinkling `.bind(this)` on every callback. It works, but it's noisy boilerplate that exists only because the inner function couldn't naturally see the right scope.

## optimal
Use closures deliberately as your private-state mechanism. A factory function that declares some variables and returns one or more functions closing over them gives you encapsulation for free: the returned functions are the only code that can see those variables, so you get true privacy without classes or naming conventions. This is the heart of the module pattern, of memoized functions that cache results in a captured `Map`, and of "partial application" where you bake an argument into a function by capturing it. Keep the captured state minimal and intentional — a closure that accidentally captures a huge object keeps it alive as long as the function lives, so be aware that closures can extend a variable's lifetime (and memory footprint).

For `this`, adopt one rule and the confusion evaporates: **use arrow functions for callbacks, regular functions (or method shorthand) for methods**. A method needs its own `this` so it can act on the object it's called on — write it as a normal method. A callback inside that method should keep the method's `this` — write it as an arrow, and it inherits `this` automatically, no `self` variable or `.bind` needed. The one place not to use an arrow is an object method that must refer to the object via `this`, because an arrow there would capture the surrounding scope's `this` (often the module or `undefined`) instead of the object. When you genuinely need to pin `this` to a specific value, `.bind(value)` returns a new function permanently bound to it — useful for passing a method as a standalone callback. The combined heuristic: arrows inherit `this` and can't be rebound; normal functions get `this` from the call and can be bound — pick the one whose `this` behavior you actually want.

## complexity
time: Calling a function is O(1) plus the work inside it; creating a closure is O(1) — the engine links the new function to its surrounding scope rather than copying anything. Resolving `this` at a call site is also O(1). None of these add algorithmic cost.
space: A closure keeps its captured variables alive for as long as the closure itself is reachable, so it holds O(k) memory for the k variables it captures — even variables you stop using stay alive if the closure can still see them. This is the one real cost: closures can extend a variable's lifetime well past the call that created it.
notes: Each call to a factory like `makeCounter()` produces an independent closure with its own captured variables, so two counters never share state. That independence is a feature, but it means N counters hold N copies of the captured state.

## pitfalls
- **`var` in a loop shares one variable across closures.** `for (var i …)` makes every callback close over the same `i`, so they all see the final value. Use `let`, which gives each iteration a fresh binding, so each closure captures its own `i`.
- **Detaching a method loses `this`.** `const f = obj.method; f();` calls `f` with no receiver, so `this` is `undefined` (strict mode) or the global object — `this.value` then throws or reads garbage. Bind it (`obj.method.bind(obj)`) or wrap it in an arrow (`() => obj.method()`).
- **An arrow as an object method captures the wrong `this`.** `const o = { v: 1, get: () => this.v }` — the arrow takes `this` from the surrounding scope, not `o`, so `o.get()` won't see `v`. Use method shorthand (`get() { return this.v; }`) for methods.
- **Closures can leak memory.** A closure keeps every captured variable alive. Capture a large array or DOM node you no longer need and it can't be garbage-collected while the closure lives. Capture only what you use.
- **Confusing capture with copy.** A closure captures the live variable, not a snapshot — if the outer code later changes that variable, the closure sees the new value. When you need a frozen value, capture a copy (e.g. a parameter or a `const` inside the loop body).

## interviewTips
- Define a closure in one breath: "a function bundled with the variables from the scope where it was created, which stay alive as long as the function does." Then show a counter to prove it.
- Explain the `var`-vs-`let` loop bug and its fix — it's the single most common closure interview question, and the answer ("`let` gives each iteration a fresh binding") shows you understand capture.
- State the `this` rule as "it's set by how the function is called, not where it's defined — except arrows, which inherit `this` from where they're defined." Mention `bind` as the way to pin it explicitly.

## keyTakeaways
- Functions are values; a closure is an inner function that captures and keeps alive the live variables of the scope it was created in — the basis of private state.
- `this` in a normal function is whatever is left of the dot at the call site; detaching a method loses it, and `bind` pins it.
- Arrow functions have no own `this` (they inherit it) and can't be rebound — ideal for callbacks, wrong for object methods that need `this`.

## code.javascript
```javascript
// A function DECLARATION is hoisted — callable before its line in the file.
console.log("sum(2, 3):", sum(2, 3)); // 5
function sum(a, b) {
  return a + b;
}

// A function EXPRESSION is a value bound to a name (usable after its line).
const triple = function (n) {
  return n * 3;
};
console.log("triple(4):", triple(4)); // 12

// Arrow functions are compact; a single-expression body needs no return.
const square = (n) => n * n;
console.log("square(5):", square(5)); // 25

// CLOSURE: the inner function captures `count` and keeps it alive across calls.
function makeCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}
const next = makeCounter();
console.log("counter:", next(), next(), next()); // 1 2 3

// `this` is decided by HOW a function is called, not where it's written.
const obj = {
  value: 10,
  inc() {                        // method: `this` is obj when called as obj.inc()
    this.value += 1;
    return this.value;
  },
  incTwice() {
    const bump = () => { this.value += 1; }; // arrow keeps incTwice's `this`
    bump();
    bump();
    return this.value;
  },
};
console.log("inc:", obj.inc());           // 11
console.log("incTwice:", obj.incTwice()); // 13
```

## code.python
```python
# Python functions are first-class values; def for statements, lambda for expressions.
def sum_(a, b):
    return a + b
print("sum(2, 3):", sum_(2, 3))            # 5

triple = lambda n: n * 3                    # an expression-bodied function
print("triple(4):", triple(4))             # 12

square = lambda n: n * n
print("square(5):", square(5))             # 25

# Closure: the inner function captures count; `nonlocal` lets it rebind it.
def make_counter():
    count = 0
    def step():
        nonlocal count
        count += 1
        return count
    return step
nxt = make_counter()
print("counter:", nxt(), nxt(), nxt())     # 1 2 3

# Python's nearest analog to `this` is an explicit `self` parameter on methods.
class Obj:
    def __init__(self):
        self.value = 10
    def inc(self):
        self.value += 1
        return self.value
o = Obj()
print("inc:", o.inc())                     # 11
print("inc again:", o.inc())               # 12
```

## code.java
```java
import java.util.function.*;

public class Functions {
    int value = 10;

    int inc() {
        this.value += 1;
        return this.value;
    }

    static Supplier<Integer> makeCounter() {
        int[] count = {0};                 // a mutable cell the lambda can capture
        return () -> {
            count[0] += 1;
            return count[0];
        };
    }

    public static void main(String[] args) {
        IntBinaryOperator sum = (a, b) -> a + b;
        System.out.println("sum(2, 3): " + sum.applyAsInt(2, 3)); // 5

        IntUnaryOperator triple = n -> n * 3;
        System.out.println("triple(4): " + triple.applyAsInt(4)); // 12

        Supplier<Integer> next = makeCounter();
        System.out.println("counter: " + next.get() + " " + next.get() + " " + next.get()); // 1 2 3

        Functions f = new Functions();
        System.out.println("inc: " + f.inc());       // 11
        System.out.println("inc again: " + f.inc()); // 12
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <functional>
#include <memory>
using namespace std;

function<int()> makeCounter() {
    auto count = make_shared<int>(0);      // shared so it outlives this call
    return [count]() {
        *count += 1;
        return *count;
    };
}

struct Obj {
    int value = 10;
    int inc() {
        this->value += 1;
        return this->value;
    }
};

int main() {
    auto sum = [](int a, int b) { return a + b; };
    cout << "sum(2, 3): " << sum(2, 3) << "\n"; // 5

    auto triple = [](int n) { return n * 3; };
    cout << "triple(4): " << triple(4) << "\n"; // 12

    auto next = makeCounter();
    cout << "counter:";
    cout << " " << next();
    cout << " " << next();
    cout << " " << next() << "\n";              // 1 2 3

    Obj o;
    cout << "inc: " << o.inc() << "\n";         // 11
    cout << "inc again: " << o.inc() << "\n";   // 12
    return 0;
}
```
