---
slug: design-pattern-builder
module: foundations
title: Builder Pattern
subtitle: Construct complex objects step by step with a fluent API — replace telescoping constructors and unreadable parameter lists.
difficulty: Beginner
position: 94
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Builder — Refactoring Guru"
    url: "https://refactoring.guru/design-patterns/builder"
    type: book
  - title: "Fluent Interface — Martin Fowler"
    url: "https://martinfowler.com/bliki/FluentInterface.html"
    type: blog
  - title: "DovAmir/awesome-design-patterns — Builder"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
The Builder pattern separates the construction of a complex object from its representation. Instead of a constructor with ten parameters or a chain of overloads, a `Builder` exposes one method per optional field and a final `build()` that returns the immutable product. Code that creates the object reads like an English sentence: `new Pizza.Builder().size("L").cheese().olives().build()`.

## whyItMatters
Configuration objects, HTTP requests, SQL queries, UI widgets, and test fixtures all suffer from constructor explosion. Six positional booleans become impossible to read at the call site — what does `new User("a", "b", true, false, null, true)` mean? The Builder fixes this with named, optional, chainable setters and produces a fully validated, immutable instance. Java's `StringBuilder`, Lombok's `@Builder`, the Guava `ImmutableMap.Builder`, and Kotlin's DSL builders are all instances.

## intuition
Think of ordering a custom burrito. The cashier takes your choices one at a time — rice, beans, protein, salsa, toppings — and only after you confirm does the line cook assemble the final product. You never have to remember the global parameter order; you describe each choice as you go. The Builder is the cashier; `build()` is "ring me up."

## visualization
Picture three classes: `Pizza` (the immutable product with private fields), `Pizza.Builder` (a mutable scratchpad with one method per field, each returning `this`), and a client that does `Pizza p = new Pizza.Builder().size("L").cheese(true).olives(true).build();`. Each setter mutates the builder and returns it so the call chain keeps flowing. `build()` validates required fields, then constructs the immutable Pizza in one shot.

## bruteForce
The baseline is either a telescoping constructor (`Pizza(String size); Pizza(String, boolean cheese); Pizza(String, boolean, boolean olives); ...`) — an O(2^n) explosion as options grow — or a single fat constructor with positional booleans nobody can read. Both make the call site unreadable and force callers to remember the field order across versions.

## optimal
Define the product class with `final`/`readonly` fields and a `private` constructor that accepts the fully populated builder. Define a nested `Builder` with a mutable field per option, one setter per field that returns `this`, and a `build()` method that validates and constructs the product. For required fields, accept them in the builder's own constructor so the type system enforces presence. For DSLs, use language features (Kotlin lambdas, Python kwargs, JS destructuring) — they often subsume the pattern.

## complexity
time: O(n) where n is the number of options set
space: O(n) for the builder's intermediate fields
notes: Builder adds one allocation (the builder) per product. Negligible cost; the win is human readability and immutability of the product.

## pitfalls
- Forgetting to validate in `build()`: half-initialized products escape into the system.
- Mutable builders shared across threads: the builder is intrinsically not thread-safe. Each thread builds its own.
- Reusing the same builder to produce different instances and being surprised when changes leak — call `build()` then discard, or clone explicitly.
- Builders that mirror every public field of an existing mutable class — at that point a plain constructor + setters is simpler.
- Hiding required fields as optional builder methods — runtime errors instead of compile errors.

## interviewTips
- Cite real APIs you've used: `StringBuilder`, OkHttp `Request.Builder`, AWS SDK builders, `ProcessBuilder`.
- Contrast with the Factory pattern: Factory chooses *which class*; Builder configures *one class*.
- Mention that records (Java 14+), data classes (Kotlin), and named arguments (Python) often eliminate the need — pick the pattern when the language can't carry the weight.

## code.python
```python
from dataclasses import dataclass, field
from typing import List

@dataclass(frozen=True)
class Pizza:
    size: str
    cheese: bool
    toppings: tuple

class PizzaBuilder:
    def __init__(self, size: str):
        self._size = size
        self._cheese = False
        self._toppings: List[str] = []
    def cheese(self):
        self._cheese = True
        return self
    def add(self, topping: str):
        self._toppings.append(topping)
        return self
    def build(self) -> Pizza:
        if self._size not in {"S", "M", "L"}:
            raise ValueError("bad size")
        return Pizza(self._size, self._cheese, tuple(self._toppings))

pizza = PizzaBuilder("L").cheese().add("olives").add("mushrooms").build()
print(pizza)
```

## code.javascript
```javascript
class Pizza {
  constructor({ size, cheese, toppings }) {
    Object.assign(this, { size, cheese, toppings: Object.freeze([...toppings]) });
    Object.freeze(this);
  }
}

class PizzaBuilder {
  constructor(size) { this.state = { size, cheese: false, toppings: [] }; }
  cheese() { this.state.cheese = true; return this; }
  add(t) { this.state.toppings.push(t); return this; }
  build() {
    if (!["S","M","L"].includes(this.state.size)) throw new Error("bad size");
    return new Pizza(this.state);
  }
}

const pizza = new PizzaBuilder("L").cheese().add("olives").build();
console.log(pizza);
```

## code.java
```java
import java.util.*;

public final class Pizza {
    public final String size;
    public final boolean cheese;
    public final List<String> toppings;

    private Pizza(Builder b) {
        this.size = b.size;
        this.cheese = b.cheese;
        this.toppings = List.copyOf(b.toppings);
    }

    public static class Builder {
        private final String size;
        private boolean cheese = false;
        private final List<String> toppings = new ArrayList<>();

        public Builder(String size) { this.size = size; }
        public Builder cheese() { this.cheese = true; return this; }
        public Builder add(String t) { this.toppings.add(t); return this; }
        public Pizza build() {
            if (!List.of("S","M","L").contains(size)) throw new IllegalStateException("bad size");
            return new Pizza(this);
        }
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

class Pizza {
public:
    std::string size;
    bool cheese;
    std::vector<std::string> toppings;
};

class PizzaBuilder {
    Pizza p_;
public:
    explicit PizzaBuilder(std::string size) { p_.size = std::move(size); p_.cheese = false; }
    PizzaBuilder& cheese() { p_.cheese = true; return *this; }
    PizzaBuilder& add(std::string t) { p_.toppings.push_back(std::move(t)); return *this; }
    Pizza build() {
        if (p_.size != "S" && p_.size != "M" && p_.size != "L") throw std::runtime_error("bad size");
        return p_;
    }
};
```
