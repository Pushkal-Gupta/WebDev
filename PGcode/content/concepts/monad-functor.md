---
slug: monad-functor
module: foundations
title: Functors and Monads
subtitle: map and flatMap as design patterns — Maybe, Either, Future, and why they all share the same shape.
difficulty: Advanced
position: 10
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Monads — martinfowler.com"
    url: "https://martinfowler.com/bliki/CollectionPipeline.html"
    type: blog
  - title: "Functional Programming in JavaScript — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/dsa/functional-programming-paradigm/"
    type: blog
  - title: "TheAlgorithms/Python — functional patterns"
    url: "https://github.com/TheAlgorithms/Python/tree/master/maths"
    type: repo
status: published
---

## intro
A functor is any container type that exposes `map`: given a value of type `F<A>` and a function `A -> B`, you get back an `F<B>` without unwrapping. A monad is a functor plus `flatMap` (also called `bind` or `then`): given `F<A>` and `A -> F<B>`, you get `F<B>` without ending up with a nested `F<F<B>>`. Functors compose, monads chain. Once you see the pattern, you stop writing nested if-checks for `null`, nested try-catch for errors, and nested `.then().then()` for async — you `map` and `flatMap` instead.

## whyItMatters
Three of the most painful sources of bugs — null checks, error handling, and async coordination — are all the same shape: "I have a value that may or may not be there; I want to run a function on it; the function may also produce that same kind of uncertainty." Monads collapse all three into one vocabulary. Promise / Task is the async monad; Maybe / Option is the null monad; Either / Result is the error monad. Languages without first-class monads (Java, Go, Python) still ship them as `Optional`, `CompletableFuture`, and so on — because the pattern is too useful to skip.

## intuition
Picture a `Maybe<Int>` as a box containing either a number or nothing. `map(f)` peeks inside: if there's a value, apply `f`; otherwise stay empty. That works perfectly until `f` itself returns `Maybe<Int>` — now `map` would hand you `Maybe<Maybe<Int>>`. `flatMap` is just `map` followed by flattening one layer. Same idea for `Future`: `then` is `flatMap` over time; the chain stays a single `Future` instead of nesting. Same for `Either<Error, A>`: `flatMap` short-circuits on the first error without explicit checks.

## visualization
```
Without monads:                     With monad:
user = getUser(id)                  getUser(id)
if user is None: return None          .flatMap(getAddress)
addr = getAddress(user)               .flatMap(geocodeCity)
if addr is None: return None          .map(formatLatLng)
geo = geocodeCity(addr)
if geo is None: return None
return formatLatLng(geo)

Five lines of "if x is None: return None" disappear. The branching lives in flatMap.
```

## bruteForce
Without functors, you re-implement the unwrap-check-rewrap dance every time. Code looks like a staircase of `if` and `try/except`, each level handling the same failure mode. It works, but the business logic is buried under defensive scaffolding. Every reader of the code has to mentally re-derive: "is this null-check necessary, or did the previous step already handle it?" The brute-force approach also forces sequential code on every async chain — `.then()` callbacks nest until they form the pyramid of doom.

## optimal
Implement a small protocol:
- `Functor.map(fa, f) -> fb` where `f: A -> B`
- `Monad.flatMap(fa, f) -> fb` where `f: A -> F<B>`
- `Monad.of(a) -> fa` (lift a plain value into the monad)

Then satisfy the laws: left identity (`flatMap(of(a), f) == f(a)`), right identity (`flatMap(m, of) == m`), and associativity (`flatMap(flatMap(m, f), g) == flatMap(m, x => flatMap(f(x), g))`). Laws are the contract that makes refactors safe: any chain of `flatMap` can be regrouped without changing meaning.

```
class Maybe:
    of(a) -> Just(a)
    map(self, f) -> Just(f(value)) if Just else Nothing
    flatMap(self, f) -> f(value) if Just else Nothing
```

## complexity
time: per-step cost is whatever `f` costs, plus O(1) overhead per `map` / `flatMap`. The pattern itself adds nothing to algorithmic complexity.
space: one wrapper object per intermediate value. With deep chains, fusion / lazy lists eliminate the allocations.
notes: Real wins are in clarity and bug count, not in big-O. The benchmark is "fewer null-checks", not "faster code". Monad-comprehensions (do-notation, async/await, for-comprehensions) compile down to the same `flatMap` chain.

## pitfalls
- Confusing `map` with `flatMap` — using `map` when the inner function returns a monad gives you a nested wrapper.
- Treating monad laws as theoretical: they actually justify common refactors like `Promise.all` reordering or pulling expensive work out of a chain.
- Re-inventing `Maybe` per project — most ecosystems have one already (`Optional`, `Option`, `?` operator) and re-rolling fragments adoption.
- Async-await hides flatMap but does not eliminate it: `await` inside `await` is still sequential, and `Promise.all` is parallel because it `flatMap`s after all promises resolve.
- Mixing monad types accidentally — `Either<E, Maybe<A>>` and `Maybe<Either<E, A>>` are different shapes and you cannot trivially convert.

## interviewTips
- When asked about error handling in modern languages: name Rust's `Result`, Scala's `Either`, Haskell's `Maybe`, and JS Promises as four flavours of the same monad pattern.
- "Why is async/await better than callbacks?" — because it desugars to `flatMap`, which preserves the linear flow.
- Be ready to write a 10-line `Maybe` class with `of`, `map`, `flatMap`. Interviewers grade on whether you remember to handle the `Nothing` case in both methods.
- Skip the category theory deep dive unless asked. "Monad" in code means "thing with `of` and `flatMap` obeying the three laws" — that is enough.

## code.python
```python
class Maybe:
    @staticmethod
    def of(value): return Just(value)
    def map(self, f): raise NotImplementedError
    def flat_map(self, f): raise NotImplementedError

class Just(Maybe):
    def __init__(self, value): self.value = value
    def map(self, f): return Just(f(self.value))
    def flat_map(self, f): return f(self.value)
    def __repr__(self): return f"Just({self.value!r})"

class Nothing(Maybe):
    _instance = None
    def __new__(cls):
        if cls._instance is None: cls._instance = super().__new__(cls)
        return cls._instance
    def map(self, f): return self
    def flat_map(self, f): return self
    def __repr__(self): return "Nothing"

def safe_div(a, b):
    return Nothing() if b == 0 else Just(a / b)

result = Just(20).flat_map(lambda x: safe_div(x, 4)).map(lambda x: x + 1)
```

## code.javascript
```javascript
class Maybe {
  static of(v) { return v == null ? new Nothing() : new Just(v); }
}
class Just extends Maybe {
  constructor(v) { super(); this.value = v; }
  map(f) { return Maybe.of(f(this.value)); }
  flatMap(f) { return f(this.value); }
  toString() { return `Just(${this.value})`; }
}
class Nothing extends Maybe {
  map() { return this; }
  flatMap() { return this; }
  toString() { return "Nothing"; }
}

const safeDiv = (a, b) => b === 0 ? new Nothing() : new Just(a / b);

const result = new Just(20)
  .flatMap(x => safeDiv(x, 4))
  .map(x => x + 1);
```

## code.java
```java
import java.util.Optional;
import java.util.function.Function;

public class MonadDemo {
    static Optional<Double> safeDiv(double a, double b) {
        return b == 0 ? Optional.empty() : Optional.of(a / b);
    }

    public static void main(String[] args) {
        Optional<Double> result = Optional.of(20.0)
            .flatMap(x -> safeDiv(x, 4))
            .map(x -> x + 1);
        result.ifPresent(System.out::println);
    }

    static <A, B> Optional<B> bind(Optional<A> m, Function<A, Optional<B>> f) {
        return m.flatMap(f);
    }
}
```

## code.cpp
```cpp
#include <optional>
#include <functional>
#include <iostream>

template <typename A, typename F>
auto map(const std::optional<A>& m, F&& f) -> std::optional<decltype(f(*m))> {
    if (m) return f(*m);
    return std::nullopt;
}

template <typename A, typename F>
auto flat_map(const std::optional<A>& m, F&& f) -> decltype(f(*m)) {
    if (m) return f(*m);
    return std::nullopt;
}

std::optional<double> safe_div(double a, double b) {
    if (b == 0) return std::nullopt;
    return a / b;
}

int main() {
    auto r = flat_map(std::optional<double>{20.0},
                      [](double x) { return safe_div(x, 4); });
    auto s = map(r, [](double x) { return x + 1; });
    if (s) std::cout << *s << "\n";
}
```
