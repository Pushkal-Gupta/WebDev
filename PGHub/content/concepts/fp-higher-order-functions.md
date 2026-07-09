---
slug: fp-higher-order-functions
module: functional-programming
title: Higher-Order Functions
subtitle: When functions become values you can pass, return, and combine, loops turn into map/filter/reduce and small pieces compose into whole programs.
difficulty: Beginner
position: 2
estimatedReadMinutes: 13
prereqs: [fp-pure-immutability]
relatedProblems: []
references:
  - title: "Structure and Interpretation of Computer Programs (SICP)"
    url: "https://web.mit.edu/6.001/6.037/sicp.pdf"
    type: book
  - title: "Haskell Wiki — Higher order function"
    url: "https://wiki.haskell.org/Higher_order_function"
    type: article
  - title: "MDN — Array.prototype.reduce()"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce"
    type: docs
  - title: "MDN — Closures"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures"
    type: docs
status: published
---

## intro

A **higher-order function** is a function that takes another function as an argument, returns a function as its result, or both. This is possible only when functions are **first-class values** — treated like any other data: stored in variables, put in lists, passed to and returned from other functions. Once functions are values, whole patterns of computation become reusable. Instead of writing a new loop every time you want to transform, keep, or combine elements of a collection, you reach for the core trio — **map**, **filter**, and **reduce** — and hand each one a small function describing *what* to do, while the higher-order function handles the *how* of iterating. Add **closures** (functions that remember the environment they were created in), **composition** (wiring functions output-to-input), and **currying** (turning a many-argument function into a chain of one-argument functions), and you have the toolkit for building programs out of small, combinable parts.

## whyItMatters

Higher-order functions are how functional programming replaces repetition with reuse. Every hand-written loop mixes two unrelated concerns: the *mechanics* of walking a collection (index bounds, accumulator, termination) and the *intent* (double each item, keep the evens, sum them up). Writing that machinery again and again is where off-by-one bugs and mutation errors breed. Map, filter, and reduce factor the mechanics out once and let you supply only the intent — so the code says what it means and the error-prone plumbing disappears. Closures let you build small, configured behaviors on the fly (a validator bound to a threshold, a logger bound to a prefix) without dragging around extra state. Composition lets you assemble large transformations from tiny, individually testable pieces, the way Unix pipes chain small tools. The result is code that reads like a description of the transformation rather than a set of instructions to a machine — shorter, more reusable, and far easier to reason about.

## intuition

Start with the idea that trips people up at first: **a function is just a value**. `double` is a thing you can hold, exactly like the number `5` or the string `"hi"`. You can put it in a variable, drop it in a list, pass it as an argument, or return it from another function. The instant you accept that, a new kind of function becomes possible — one whose *argument is behavior*. That is a higher-order function, and it is the engine of everything else here.

The clearest payoff is the **map / filter / reduce** trio, which together replace nearly every loop you would otherwise write. **Map** transforms: give it a collection and a function, and it applies that function to every element, producing a new collection of the same length — `map(double, [1,2,3])` is `[2,4,6]`. **Filter** selects: give it a predicate (a function returning true/false), and it keeps only the elements that pass — `filter(isEven, [1,2,3,4])` is `[2,4]`. **Reduce** (also called fold) collapses: give it a combining function and a starting value, and it folds the whole collection down to a single result — `reduce(add, [1,2,3,4], 0)` is `10`. The revelation is that map and filter are themselves just special cases of reduce; reduce is the universal loop, and the other two are the common patterns worth naming. Each of these takes a function as an argument — that is what makes them higher-order.

**Closures** are the next piece. When you define a function *inside* another function, the inner one "closes over" the variables of the outer one — it keeps a live reference to that environment even after the outer function has returned. This is what lets a higher-order function *return a customized function*: a `makeAdder(n)` returns a function that remembers `n` and adds it to whatever it later receives. The closure is a tiny bundle of behavior plus the data it was born with. It is how you configure functions without classes, and it is the mechanism that makes currying and partial application work at all.

**Composition** is the act of wiring functions together output-to-input: `compose(f, g)(x)` means `f(g(x))` — do `g`, then feed its result to `f`. Mathematicians write this `f . g`. Composition is how small functions become big ones without any glue code; a data-processing pipeline is just a stack of composed transformations. **Currying** supports this by turning a function of several arguments into a chain of single-argument functions, so `add(2, 3)` becomes `add(2)(3)`. That matters because a curried function that has received *some* of its arguments is itself a new function waiting for the rest — this is **partial application**, and it produces exactly the small, ready-to-compose one-argument functions that pipelines want. Taken to its natural end, you can often write functions by combining others with no explicit argument at all — **point-free style**, where `sumOfSquares = sum . map square` names the transformation, not the data flowing through it. That is the whole arc: functions as values, the map/filter/reduce trio, closures to capture context, and composition plus currying to snap the pieces together.

## visualization

```
DATA THROUGH THE TRIO                     [1, 2, 3, 4, 5]
                                                |
   map (x -> x*x)   apply to each              v   same length, transformed
                                          [1, 4, 9, 16, 25]
                                                |
   filter (x -> x>5) keep the passers          v   shorter, same elements
                                          [9, 16, 25]
                                                |
   reduce (a,b -> a+b, 0) fold to one           v   single value
                                          0+9=9 -> +16=25 -> +25=50
                                                |
                                                v
                                               50

CLOSURE captures its birth environment        COMPOSITION wires output->input
   makeAdder(10) --> fn remembers n=10           (f . g)(x) = f(g(x))
   add10 = makeAdder(10);  add10(5) -> 15        pipeline: sum . map square
   the n=10 lives on inside add10                [1,2,3] -> [1,4,9] -> 14
```

## bruteForce

The imperative way is to write an explicit loop for every transformation. Want the squares of the even numbers, summed? You declare an accumulator, write a `for` loop with an index or iterator, add an `if` to skip the odds, compute the square inside, and push or add as you go. It works, but three things go wrong as this multiplies across a codebase. First, you rewrite the same loop skeleton constantly, and each rewrite is a fresh chance for an off-by-one error, a wrong bound, or a forgotten accumulator reset. Second, the *intent* — "square the evens and sum them" — is buried inside mechanical plumbing about indices and mutation, so a reader has to decode the loop to recover the idea. Third, the loop typically **mutates** a running variable and often the source collection too, dragging in exactly the shared-state hazards that make code hard to test and unsafe under concurrency. Every loop is bespoke, so nothing is reusable: the "keep the even ones" logic can't be lifted out and reused elsewhere because it's welded to this particular loop.

## optimal

Make behavior a value and let higher-order functions carry the mechanics. Supply the *what*; let map, filter, and reduce own the *how*.

**Replace loops with the trio.** "Square the evens and sum them" becomes `reduce(add, map(square, filter(isEven, xs)), 0)` — three named operations, each doing one thing, none of them touching an index or a mutable accumulator you manage by hand. The looping machinery is written once inside the library and reused everywhere, so the off-by-one bugs simply have nowhere to live. The code now reads as the description of the transformation.

**Use closures to build configured behavior.** Instead of copy-pasting a validator with a hard-coded limit, write `makeValidator(limit)` that returns a function closing over `limit`. You mint small, purpose-built functions on demand, each carrying exactly the context it needs — no classes, no globals, no extra parameters threaded through every call.

**Compose small functions into large ones.** Build a pipeline by chaining transformations output-to-input: `pipeline = compose(sum, mapSquare, keepEven)`. Each stage is independently testable and reusable, and the whole is assembled with no glue code. This is the Unix-pipe philosophy inside your program.

**Curry to get composition-ready pieces.** A curried function fed some of its arguments returns a new function awaiting the rest — **partial application**. `add(10)` is a ready-made "add ten" function; `multiply(2)` is "double." These one-argument functions are precisely what `map`, `filter`, and `compose` want, so currying and composition reinforce each other. Pushed all the way, you reach **point-free style** — `sumOfSquares = compose(sum, map(square))` — which names the transformation rather than the data, eliminating boilerplate argument-passing. The payoff mirrors the pure-function payoff: tiny pieces you can test in isolation, reuse everywhere, and combine into whole programs that read like what they mean.

## complexity

- **time:** Map, filter, and reduce each make a single O(n) pass over the collection — identical asymptotics to the hand-written loop they replace. A pipeline of k composed passes is O(k*n); if that matters, fusing the stages (or using lazy/generator evaluation) collapses them back into a single traversal. Calling a passed-in function per element adds a small constant per-call overhead versus inlined loop bodies.
- **space:** Filter and (non-lazy) map allocate a new output collection — O(n) extra space — because they don't mutate the input, which is the immutability tradeoff again. Reduce that folds to a scalar is O(1) extra space. Each closure retains its captured variables, a small per-closure cost; a curried chain allocates one small intermediate function per applied argument.
- **notes:** The overhead is usually dwarfed by the win in clarity and correctness, and lazy evaluation (generators, iterators, Haskell's default) removes the intermediate-collection cost by streaming elements through the whole pipeline one at a time. Reserve manual loops for genuinely hot paths where per-call overhead is measured and shown to matter.

## pitfalls

- **Reduce with no (or a wrong) initial value.** Folding an empty collection without an explicit starting value throws or returns something surprising, and a mismatched initial type corrupts the accumulator. Fix: always pass an identity-like initial value (`0` for sums, `[]` for concatenation, `{}` for grouping) that matches the accumulator's type.
- **Closures capturing a loop variable by reference.** Creating functions inside a loop that all close over the *same* mutable loop variable makes them share its final value (the classic `var i` bug in JS). Fix: capture a fresh binding per iteration — use `let` instead of `var`, or pass the value into a factory that closes over a parameter.
- **Passing a function reference that carries extra arguments.** Handing `map` a function that reads a second argument (like the index or the array) can produce silent wrong results, e.g. `["1","2"].map(parseInt)`. Fix: wrap in an explicit arrow that passes only the intended argument, `map(x => parseInt(x, 10))`.
- **Mutating inside a map/filter/reduce callback.** Reaching out to mutate shared state from within a callback reintroduces exactly the side effects the trio was meant to avoid, breaking reuse and parallel-safety. Fix: keep callbacks pure — return new values, don't mutate outer state.
- **Over-composing into unreadable point-free chains.** Stacking a dozen composed functions with no names can become as opaque as the loop it replaced. Fix: name intermediate pipelines, and prefer clarity over cleverness when a point-free form obscures intent.

## interviewTips

- Define higher-order and first-class precisely — a higher-order function takes or returns a function; first-class means functions are ordinary values — then anchor it with the trio: map transforms (same length), filter selects (predicate), reduce folds to one, and *reduce is the general case* the other two specialize. Being able to implement map and filter in terms of reduce is a strong signal.
- Explain closures as "a function plus the environment it captured," and be ready for the loop-variable capture bug and how `let` fixes it. Interviewers often ask you to write `makeAdder` or a memoizer — both hinge on returning a closure.
- Connect currying, partial application, and composition: a curried function partially applied yields a small function ideal for composing into pipelines. Mention point-free style as the endpoint, but note that readability wins over cleverness in real code.

## keyTakeaways

- When functions are first-class values, higher-order functions become possible — functions that take or return other functions — and map (transform), filter (select), reduce (fold to one) replace the vast majority of hand-written loops, separating *what* to do from *how* to iterate.
- Closures are functions bundled with the environment they captured; they let higher-order functions return configured behavior, and they are the mechanism underneath currying and partial application.
- Composition wires functions output-to-input and currying yields the small one-argument pieces that compose cleanly, letting you build whole programs from tiny, independently testable parts — up to point-free style, where you name the transformation rather than the data.

## code.python

```python
"""Higher-order functions: the trio, a closure factory, and composition."""

from functools import reduce, partial

nums = [1, 2, 3, 4, 5]

# --- The core trio: what, not how ---
squares = list(map(lambda x: x * x, nums))          # transform
evens = list(filter(lambda x: x % 2 == 0, nums))     # select
total = reduce(lambda a, b: a + b, nums, 0)          # fold to one

# --- Closure factory: returns a function that remembers `n` ---
def make_adder(n):
    def add(x):
        return x + n      # closes over n
    return add

add10 = make_adder(10)

# --- Composition: wire functions output -> input ---
def compose(*fns):
    def composed(x):
        for fn in reversed(fns):
            x = fn(x)
        return x
    return composed

# sum of squares of the even numbers, as a pipeline
keep_even = partial(filter, lambda x: x % 2 == 0)
map_square = partial(map, lambda x: x * x)
sum_of_even_squares = compose(sum, list, map_square, keep_even)

if __name__ == "__main__":
    print("squares:", squares)                 # [1, 4, 9, 16, 25]
    print("evens:", evens)                      # [2, 4]
    print("total:", total)                      # 15
    print("add10(5):", add10(5))                # 15  (closure remembers 10)
    print("pipeline:", sum_of_even_squares(nums))  # 4 + 16 = 20
```

## code.javascript

```javascript
// Higher-order functions: trio, closure, currying, composition.

const nums = [1, 2, 3, 4, 5];

// The core trio built into arrays.
const squares = nums.map((x) => x * x);           // [1,4,9,16,25]
const evens = nums.filter((x) => x % 2 === 0);    // [2,4]
const total = nums.reduce((a, b) => a + b, 0);    // 15

// Closure factory: the returned function remembers `n`.
const makeAdder = (n) => (x) => x + n;            // curried by construction
const add10 = makeAdder(10);

// Compose right-to-left: compose(f, g)(x) === f(g(x)).
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

// Point-free pipeline: sum of the even numbers' squares.
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mapSquare = (xs) => xs.map((x) => x * x);
const keepEven = (xs) => xs.filter((x) => x % 2 === 0);
const sumOfEvenSquares = compose(sum, mapSquare, keepEven);

console.log("squares:", squares);
console.log("total:", total);
console.log("add10(5):", add10(5));                  // 15
console.log("pipeline:", sumOfEvenSquares(nums));    // 4 + 16 = 20
```

## code.haskell

```haskell
-- Haskell is built around higher-order functions; map/filter/foldr are core,
-- currying is the default (every function takes one argument at a time),
-- and (.) is composition.

module Main where

nums :: [Int]
nums = [1, 2, 3, 4, 5]

-- Closure factory: makeAdder n returns a function that remembers n.
makeAdder :: Int -> (Int -> Int)
makeAdder n = \x -> x + n

-- Point-free pipeline via composition (.): read right-to-left.
-- filter evens, square them, then sum.
sumOfEvenSquares :: [Int] -> Int
sumOfEvenSquares = sum . map (^ 2) . filter even

main :: IO ()
main = do
  print (map (^ 2) nums)        -- [1,4,9,16,25]
  print (filter even nums)      -- [2,4]
  print (foldr (+) 0 nums)      -- 15
  print ((makeAdder 10) 5)      -- 15  (partial application + closure)
  print (sumOfEvenSquares nums) -- 20  (4 + 16)
```
