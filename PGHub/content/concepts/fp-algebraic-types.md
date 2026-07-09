---
slug: fp-algebraic-types
module: functional-programming
title: Algebraic Data Types
subtitle: Model a domain out of ANDs and ORs so that pattern matching stays exhaustive and illegal states simply cannot be constructed — replacing null and exceptions with Option and Result.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: [fp-higher-order-functions]
relatedProblems: []
references:
  - title: "Haskell Wiki — Algebraic data type"
    url: "https://wiki.haskell.org/Algebraic_data_type"
    type: article
  - title: "Haskell Wiki — Pattern matching"
    url: "https://wiki.haskell.org/Pattern_matching"
    type: article
  - title: "Haskell Wiki — Maybe"
    url: "https://wiki.haskell.org/Maybe"
    type: article
  - title: "Tony Hoare — Null References: The Billion Dollar Mistake"
    url: "https://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare/"
    type: article
status: published
---

## intro

An **algebraic data type (ADT)** builds new types by combining existing ones with two operations: **product types**, which glue several fields together with AND (a `Point` is an `x` AND a `y`), and **sum types**, which offer a choice between alternatives with OR (a `Shape` is a `Circle` OR a `Rectangle`). They are called "algebraic" because the number of values a type can hold follows the algebra of multiplication (products) and addition (sums). Paired with **pattern matching** — deconstructing a value by which case it is and binding its fields — ADTs let you model a domain so precisely that the compiler can check you handled every case (**exhaustiveness**) and, done well, so that **illegal states are unrepresentable**. Two canonical sum types, **Option/Maybe** (a value or nothing) and **Result/Either** (a success or a described failure), replace null and exceptions for expected absence and expected errors.

## whyItMatters

Most bugs are not exotic — they are a `null` where you expected an object, an unhandled error path, a record that is somehow in a state the code never anticipated. ADTs attack all three at the design level. A sum type forces you to name every shape your data can take, and an exhaustive pattern match forces you to handle each one, so "I forgot the empty case" becomes a compile error instead of a 2 a.m. page. `Maybe`/`Option` makes absence a value the type system tracks, so you cannot dereference nothing by accident — the compiler makes you unwrap it. `Result`/`Either` makes failure an ordinary return value with a described reason, so error handling is visible in the type signature rather than an invisible control-flow jump. Best of all, when you model a domain as ADTs you can often make bad combinations *unconstructable* — no valid-but-meaningless object like "logged out user with a session token." The payoff is code where whole categories of runtime error are ruled out before the program ever runs.

## intuition

Think about how many distinct values a type can hold. A `Bool` has 2. A pair `(Bool, Bool)` has 2 times 2 = 4 — that multiplication is why a record of fields is a **product type**: its size is the *product* of its parts' sizes, because it holds one value from each field simultaneously (this AND that AND that). A tuple, a struct, a record, a class with fields — all products. They answer "give me all of these at once."

Now consider a type that is *either* a `Bool` *or* a `()` (the type with one value). It can hold 2 + 1 = 3 values — that addition is why a choice-between-cases is a **sum type**: its size is the *sum* of its alternatives, because a value is exactly one case at a time (this OR that OR that). An enum with data, a tagged union, `Maybe`, `Either` — all sums. They answer "give me exactly one of these." The word "algebraic" is literal: your type definitions are arithmetic on cardinalities, and this is not just cute — it tells you when two designs hold the same information and when one admits states the other forbids.

The power shows up when you combine them and then **pattern-match**. Because a sum type enumerates its cases explicitly, the compiler knows the complete list, and when you match on it, it can warn you the moment you miss one. That **exhaustiveness check** is a free correctness proof: add a new `Shape` variant later and every match that forgot to update lights up red. Compare that to the imperative world, where a new case slips silently past an `if/else` chain and manifests as a wrong answer in production.

The deepest idea is **making illegal states unrepresentable**. Suppose an account is either logged out (no data) or logged in (with a user id and a session token). Model it with a boolean `isLoggedIn` plus nullable `userId` and `token` fields, and you have created four combinations — including "logged in but no token" and "logged out but has a token" — that are *meaningless yet fully constructible*, and every function must defensively guard against them. Model it as a sum type `LoggedOut | LoggedIn(userId, token)` and those bad combinations *cannot be built at all*. The type has exactly the two states reality allows. You have pushed a whole class of bugs from "caught at runtime, maybe" to "impossible to express." That is the shift ADTs buy you: your data model stops lying about what states exist.

## visualization

```
PRODUCT (AND): value holds one from EVERY field  -> size = multiply
  Point = { x: Bool, y: Bool }        |Point| = 2 * 2 = 4
    (F,F) (F,T) (T,F) (T,T)           all four are valid

SUM (OR): value is exactly ONE case at a time     -> size = add
  Shape = Circle Double | Rect Double Double
  Result = Ok value | Err reason           Maybe = Just a | Nothing

PATTERN MATCH must cover every case (exhaustive):
  case shape of                    lookup "k" table :
    Circle r     -> pi*r*r           Just v  -> use v      -- present
    Rect  w h    -> w*h              Nothing -> default    -- absent, no null!
    (miss a case -> COMPILE WARNING)

ILLEGAL STATES UNREPRESENTABLE:
  BAD  (booleans + nulls): isLoggedIn=false, token="abc"   <- meaningless, buildable
  GOOD (sum type): Auth = LoggedOut | LoggedIn uid token   <- bad combo cannot exist
```

## bruteForce

The mainstream approach reaches for `null` and exceptions. Absence is a `null` (or `None`, `nil`, `undefined`) smuggled into a slot that is typed as if it always holds a value — so the type signature *lies*, every caller may or may not get a real object, and forgetting a single check is the `NullPointerException` Tony Hoare called his "billion dollar mistake." Expected failures — a lookup that misses, a parse that fails, a network call that times out — get thrown as **exceptions**, which are invisible in the function's type: nothing in `parse(s) -> int` tells you it can blow up, so callers routinely forget to catch, or catch too broadly and swallow real bugs. Domain modeling fares no better: state is encoded as a bag of nullable fields and boolean flags, so a `User` object can exist in combinations the business rules forbid ("active" but with a cancellation date), and every function must re-validate defensively. The through-line is that the type system is not enforcing the rules — absence, failure, and validity all live in programmer discipline and runtime checks, which is exactly where they leak. The shortcut compiles and demos fine; it fails at the edges, silently, in production.

## optimal

Model absence, failure, and domain state as data, and let pattern matching enforce the rules.

**Replace null with Option/Maybe.** A function that might not return a value returns `Maybe a` (`Just x` or `Nothing`) instead of a nullable. Now the type *tells the truth* — the caller can see absence is possible and the compiler *makes* them handle the `Nothing` case before touching the value. There is no way to dereference nothing, because there is no bare value to dereference until you have matched it out.

**Replace exceptions (for expected failure) with Result/Either.** A parse, a lookup, a validation returns `Either err ok` (or `Result`): `Ok value` on success, `Err reason` on failure, with the reason carried as data. Failure becomes an ordinary value threaded through the type signature — visible, forced to be handled, and composable (chain `Ok` steps, short-circuit on the first `Err`). Reserve real exceptions for *truly exceptional* bugs (out of memory, programmer error), not for outcomes you expect.

**Use sum types plus exhaustive matching for correctness by construction.** Enumerate a domain's genuine states as a sum type and match on it. The compiler's **exhaustiveness check** guarantees every case is handled today and flags every match when you add a case tomorrow — a refactoring safety net no `if/else` chain provides.

**Make illegal states unrepresentable.** This is the master move. Instead of booleans and nullable fields that admit meaningless combinations, design the type so only real states can be built — `LoggedOut | LoggedIn uid token` rather than `isLoggedIn` plus loose fields. Push validity into the *shape* of the data so invalid values cannot be constructed, and whole families of defensive checks and "this should never happen" branches simply vanish. The result is code where the type checker, not runtime vigilance, is the thing keeping your data honest.

## complexity

- **time:** ADTs are a compile-time modeling tool — they add no runtime cost over the equivalent tagged struct. Pattern matching is typically a constant-time tag dispatch (a jump on which case), the same work an `if/else` chain or `switch` would do. Exhaustiveness checking happens entirely at compile time and never runs in production.
- **space:** A product type stores one value per field (the sum of its fields' sizes); a sum type stores a small **tag** plus the payload of whichever case is active, so it is as large as its biggest variant plus the tag. `Maybe`/`Result` wrappers add a one-word tag — negligible next to the class of bugs they remove.
- **notes:** The real "complexity" ADTs govern is the *cardinality* of your state space: making illegal states unrepresentable literally shrinks the number of values a type can hold, which is why fewer branches and fewer defensive checks are needed. Fewer reachable states means fewer paths to test.

## pitfalls

- **Non-exhaustive pattern matches with a catch-all.** A wildcard `_ -> ...` silences the exhaustiveness checker, so when you add a new variant the compiler stays quiet and the new case falls through to wrong behavior. Fix: enumerate cases explicitly and enable exhaustiveness warnings-as-errors; use `_` only when a genuine "everything else" default is intended.
- **Unwrapping Option/Result unsafely.** Calling `fromJust`, `.unwrap()`, `.get()`, or `!` on a `Maybe`/`Result` just reintroduces the null-pointer crash you were avoiding. Fix: pattern-match or use safe combinators (`map`, `getOrElse`, `?.`, `withDefault`) so the empty/error case is always handled.
- **Boolean-blindness and stringly-typed states.** Encoding a domain as several booleans or magic strings recreates the illegal-state problem ADTs solve. Fix: replace the flag soup with a single sum type whose cases are the only legal states.
- **Using exceptions for expected outcomes.** Throwing on a missed lookup or a failed parse hides failure from the type signature and invites forgotten `catch` blocks. Fix: return `Result`/`Either` for expected failures; reserve exceptions for genuinely unexpected, unrecoverable conditions.
- **Redundant / overlapping representations.** Two fields that can contradict each other (a `status` string *and* a `isDone` boolean) let the data disagree with itself. Fix: pick one canonical sum type as the single source of truth so contradictory states cannot be expressed.

## interviewTips

- Define product vs sum crisply — "a product holds one value from every field (AND), a sum is exactly one of several cases (OR), and the value counts multiply vs add, which is why they're called algebraic." Being able to say why the word "algebraic" is literal signals you understand the model, not just the syntax.
- When a question involves a function that can fail or return nothing, propose `Option`/`Result` over null/exceptions and explain the win: the failure becomes visible in the type and the compiler forces the caller to handle it. Name Hoare's "billion dollar mistake" for the null point.
- Bring up "make illegal states unrepresentable" with a concrete example (the logged-in/logged-out auth state) and note how exhaustive matching turns adding a new variant into a compiler-guided refactor. This is the senior-level framing interviewers listen for.

## keyTakeaways

- Algebraic data types compose existing types two ways: products combine fields with AND (sizes multiply) and sums offer a choice with OR (sizes add); pattern matching deconstructs them and the compiler checks you covered every case.
- Option/Maybe replaces null and Result/Either replaces exceptions for expected failure — both move absence and error into the type system so the compiler forces you to handle them instead of trusting runtime discipline.
- The master technique is making illegal states unrepresentable: model a domain as sum types so meaningless combinations cannot be constructed, shrinking the state space and deleting whole classes of defensive checks and runtime bugs.

## code.python

```python
"""Sum types via a tagged union, plus Option and Result, with exhaustive
match. Python 3.10+ structural pattern matching gives us the deconstruction;
dataclasses give us the product/record part.
"""
from dataclasses import dataclass


# --- Sum type: a Shape is a Circle OR a Rectangle (each case is a product) ---
@dataclass
class Circle:
    radius: float

@dataclass
class Rectangle:
    width: float
    height: float

Shape = Circle | Rectangle


def area(shape: Shape) -> float:
    match shape:                      # exhaustive: every case handled
        case Circle(radius=r):
            return 3.14159 * r * r
        case Rectangle(width=w, height=h):
            return w * h


# --- Option/Maybe: absence is a value, no None smuggled into a real slot ---
def safe_div(a: float, b: float):
    return ("nothing", None) if b == 0 else ("just", a / b)


# --- Result/Either: expected failure is data, not an exception ---
def parse_int(s: str):
    return ("ok", int(s)) if s.lstrip("-").isdigit() else ("err", f"not an int: {s!r}")


if __name__ == "__main__":
    print("area circle   =", area(Circle(2)))
    print("area rectangle=", area(Rectangle(3, 4)))
    print("safe_div 10/2 =", safe_div(10, 2))
    print("safe_div 1/0  =", safe_div(1, 0))     # ('nothing', None) -- no crash
    print("parse '42'    =", parse_int("42"))
    print("parse 'oops'  =", parse_int("oops"))  # ('err', ...) -- visible failure
```

## code.javascript

```javascript
// Tagged unions as plain objects, plus Option and Result. JS has no compiler
// exhaustiveness check, so we lean on a discriminating "tag" field and a
// switch; TypeScript would make the exhaustiveness real via a never-check.

// --- Sum type: Shape is Circle OR Rect (tag discriminates the case) ---
const circle = (r) => ({ tag: "circle", r });
const rect = (w, h) => ({ tag: "rect", w, h });

function area(shape) {
  switch (shape.tag) {              // one branch per case
    case "circle": return Math.PI * shape.r * shape.r;
    case "rect":   return shape.w * shape.h;
    default:       throw new Error("unhandled shape: " + shape.tag);
  }
}

// --- Option: Some value OR None, instead of null ---
const some = (v) => ({ tag: "some", v });
const none = { tag: "none" };
const safeDiv = (a, b) => (b === 0 ? none : some(a / b));

// --- Result: Ok OR Err, instead of throwing on expected failure ---
const ok = (v) => ({ tag: "ok", v });
const err = (e) => ({ tag: "err", e });
const parseInteger = (s) =>
  /^-?\d+$/.test(s) ? ok(Number(s)) : err(`not an int: ${JSON.stringify(s)}`);

console.log("area circle    =", area(circle(2)));
console.log("area rect      =", area(rect(3, 4)));
console.log("safeDiv 1/0    =", safeDiv(1, 0));       // { tag: 'none' }
console.log("parse '42'     =", parseInteger("42"));  // { tag: 'ok', v: 42 }
console.log("parse 'oops'   =", parseInteger("oops"));// { tag: 'err', ... }
```

## code.haskell

```haskell
-- Haskell is the natural home: sum types, products, exhaustive pattern
-- matching, and Maybe/Either are all built in and compiler-checked.

module Main where

-- Sum type; each constructor is a product of its fields
data Shape
  = Circle Double
  | Rectangle Double Double

area :: Shape -> Double
area (Circle r)      = pi * r * r        -- exhaustive: GHC warns on a missing case
area (Rectangle w h) = w * h

-- Maybe replaces null: absence is a first-class value
safeDiv :: Double -> Double -> Maybe Double
safeDiv _ 0 = Nothing
safeDiv a b = Just (a / b)

-- Either replaces exceptions for expected failure; Left carries the reason
parseInt :: String -> Either String Int
parseInt s = case reads s of
  [(n, "")] -> Right n
  _         -> Left ("not an int: " ++ show s)

-- Illegal states unrepresentable: only these two auth states can be built
data Auth = LoggedOut | LoggedIn String String

main :: IO ()
main = do
  print (area (Circle 2))          -- 12.566...
  print (area (Rectangle 3 4))     -- 12.0
  print (safeDiv 10 2)             -- Just 5.0
  print (safeDiv 1 0)              -- Nothing   (no crash)
  print (parseInt "42")            -- Right 42
  print (parseInt "oops")          -- Left "not an int: ..."
```
