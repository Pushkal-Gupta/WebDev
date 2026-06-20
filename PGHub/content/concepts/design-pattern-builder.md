---
slug: design-pattern-builder
module: foundations-patterns
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
- **`java.lang.StringBuilder`**, **`ProcessBuilder`**, **`StringJoiner`**, and **`Stream.Builder`** are factory-standard JDK builders; **Lombok's `@Builder`** auto-generates one for any class.
- **OkHttp's `Request.Builder`** and **`Retrofit.Builder`**, **AWS SDK v2's `S3Client.builder()`** and `PutObjectRequest.builder()`, **Guava's `ImmutableMap.Builder`/`ImmutableList.Builder`** all enforce the pattern.
- **Kotlin DSL builders** (HTML DSL, Gradle's Kotlin DSL, Ktor's routing DSL), **Rust's `tokio::runtime::Builder`**, **Python's `argparse.ArgumentParser`** are language-idiomatic builders.
- **SQL query builders** — Hibernate `CriteriaBuilder`, jOOQ, Knex.js, SQLAlchemy Core — exist because raw SQL composition is the textbook case of constructor explosion; Builder turns it into a fluent API the type system can check.

## intuition
The problem Builder solves is **constructor explosion when an object has many optional or interrelated fields**. A `User` with username, email, password, isAdmin, isVerified, address, phone, plus optional profile picture URL becomes either a constructor with eight positional arguments (`new User("a", "b", true, false, null, true, "+1...", null)` — utterly unreadable) or a telescoping chain of overloads (`User(name); User(name, email); User(name, email, password); ...`), which grows quadratically in option count and forces callers to memorize parameter order across versions. Both options are hostile to readers and brittle to refactoring.

The Builder pattern observes: **object construction is a multi-step process, and the steps deserve their own grammar**. Instead of one mega-constructor, expose a mutable `Builder` with one fluent setter per field (each returning `this` to chain), and a final `build()` method that validates required fields and produces an immutable product. The product class itself gets a private constructor taking the fully-populated Builder, so the only way to construct one is through the Builder.

Three benefits stack. **Readability**: `Pizza.builder().size("L").cheese().topping("olives").build()` reads like English; the field names appear at every call site. **Immutability**: the product has `final` / `readonly` fields and no setters, so once built it is thread-safe and value-equality-friendly. **Validation**: `build()` is the one place to enforce invariants (required fields present, numeric ranges valid, mutually exclusive options rejected), and it cannot be bypassed.

The burrito-counter analogy is concrete: the cashier takes your choices one at a time (rice, beans, protein, salsa, toppings), and only after you confirm does the line cook assemble the final product. You never memorize a global parameter order; each choice is named as you go. The cashier is the Builder; `build()` is "ring me up." Modern languages with **named arguments** (Python kwargs, C# named parameters, Kotlin), **records** (Java 14+, C# records), or **data classes** often subsume the pattern — pick Builder when the language cannot carry the weight or when validation needs a dedicated step.

## visualization
Picture three classes: `Pizza` (the immutable product with private fields), `Pizza.Builder` (a mutable scratchpad with one method per field, each returning `this`), and a client that does `Pizza p = new Pizza.Builder().size("L").cheese(true).olives(true).build();`. Each setter mutates the builder and returns it so the call chain keeps flowing. `build()` validates required fields, then constructs the immutable Pizza in one shot.

## bruteForce
The baseline is either a telescoping constructor (`Pizza(String size); Pizza(String, boolean cheese); Pizza(String, boolean, boolean olives); ...`) — an O(2^n) explosion as options grow — or a single fat constructor with positional booleans nobody can read. Both make the call site unreadable and force callers to remember the field order across versions.

## optimal
The right structure is **an immutable product class with a private constructor, plus a static nested Builder with fluent setters and a validating `build()`**. Required fields go in the Builder's own constructor so the type system enforces presence at compile time; optional fields go in setter methods. Validation happens exclusively in `build()`, which is the only path to a constructed product. Effective Java Item 2 (Joshua Bloch) is the canonical reference; AWS SDK v2 and OkHttp are the production reference implementations.

```java
public final class Pizza {
    public final String size;
    public final boolean cheese;
    public final List<String> toppings;
    public final int bakeMinutes;

    private Pizza(Builder b) {                      // private — only Builder builds
        this.size = b.size;
        this.cheese = b.cheese;
        this.toppings = List.copyOf(b.toppings);    // defensive copy -> immutable
        this.bakeMinutes = b.bakeMinutes;
    }

    public static Builder builder(String size) {    // required field in entry point
        return new Builder(size);
    }

    public static final class Builder {
        private final String size;                  // required
        private boolean cheese = false;             // optional with default
        private final List<String> toppings = new ArrayList<>();
        private int bakeMinutes = 12;

        private Builder(String size) { this.size = Objects.requireNonNull(size); }

        public Builder cheese()                  { this.cheese = true; return this; }
        public Builder topping(String t)         { this.toppings.add(t); return this; }
        public Builder bakeMinutes(int m)        { this.bakeMinutes = m; return this; }

        public Pizza build() {
            if (!Set.of("S","M","L").contains(size))
                throw new IllegalStateException("size must be S, M, or L");
            if (bakeMinutes < 8 || bakeMinutes > 25)
                throw new IllegalStateException("bake minutes must be 8..25");
            if (toppings.size() > 10)
                throw new IllegalStateException("max 10 toppings");
            return new Pizza(this);                 // single validated construction
        }
    }
}

// Call site reads like English:
Pizza p = Pizza.builder("L").cheese().topping("olives").topping("mushrooms").build();
```

Why this is right: (1) **Immutability is enforced** — the product has `final` fields, defensive copies of mutable collections, and no setters. Sharing a built Pizza across threads is safe. (2) **Validation is centralized** — every invariant lives in `build()`, no half-initialized products escape. (3) **Required fields are checked at compile time** via the Builder's constructor signature, not via runtime null checks. (4) **The API is discoverable** — IDEs autocomplete the available setters at each step, and renames refactor cleanly. (5) **Defaults are explicit** — every optional field has a documented default in one place.

**Step Builder (advanced)**: for multi-stage construction where some fields must precede others (e.g., choosing a database driver before specifying connection params), use **typed builder stages** where each setter returns a different interface exposing only the next legal step. This is what Spring's `WebClient.Builder` does and what Rust's typestate-pattern crates encode. Catches more errors at compile time at the cost of more interfaces.

**When NOT to use Builder**: when the language has **records** (Java 14+), **data classes** (Kotlin), or **named arguments** (Python kwargs, C#), they often subsume the pattern with less ceremony — `record Pizza(String size, boolean cheese, List<String> toppings, int bakeMinutes) {}` plus a static factory does most of the job. Reach for the full Builder when you need step-builder semantics, complex validation, or builder reuse across many call sites.

**Production cautions**: Builders are not thread-safe (intentionally — each thread builds its own). Reusing a Builder after `build()` is a code smell — discard or clone explicitly. Avoid Builders that simply mirror every public setter of a mutable bean; at that point a plain constructor + setters is simpler.

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
