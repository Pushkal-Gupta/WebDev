---
slug: design-pattern-strategy
module: foundations-patterns
title: Strategy Pattern
subtitle: Encapsulate a family of algorithms behind a common interface and swap them at runtime — the cleanest cure for the giant if/else.
difficulty: Beginner
position: 92
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Strategy — Refactoring Guru"
    url: "https://refactoring.guru/design-patterns/strategy"
    type: book
  - title: "Replace Conditional With Polymorphism — Martin Fowler"
    url: "https://refactoring.com/catalog/replaceConditionalWithPolymorphism.html"
    type: blog
  - title: "DovAmir/awesome-design-patterns — Strategy"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
The Strategy pattern defines a family of algorithms, puts each one behind the same interface, and lets a client pick the implementation at runtime. Instead of a method that branches on a type tag to decide what to do, the caller hands over an object that already knows how to do it. The result reads top-down, scales to dozens of variants without growing a switch, and tests each strategy in isolation.

## whyItMatters
- **Java's `Comparator<T>`**, **JavaScript's `Array.prototype.sort(cmp)`**, **Python's `key=` argument**, and **C++'s `std::sort` with a comparator** are all Strategy at the language level — the comparator is the pluggable algorithm.
- **Spring's `PasswordEncoder`** (BCrypt, Argon2, PBKDF2 implementations), **`AuthenticationProvider`**, **`Resilience4j`'s retry/circuit-breaker strategies**, and **Hibernate's `Dialect`** (per-database SQL dialect) are textbook Strategy applications.
- **gRPC's `LoadBalancingPolicy`** (round-robin, pick-first, weighted), **Envoy's load-balancing strategies**, **Kubernetes' scheduler plugins** all swap algorithms at runtime via a common interface.
- **Image processing pipelines** (Pillow, OpenCV's filter operators), **A/B-test variants** (Optimizely, LaunchDarkly experiment buckets), **compression formats** (gzip, brotli, zstd) — every system that lets the caller pick an algorithm at runtime is using Strategy.

## intuition
Algorithmic variety appears everywhere in software: payment processors (Stripe, PayPal, Adyen), compression formats (gzip, brotli, zstd), ranking functions (TF-IDF, BM25, learning-to-rank), retry policies (fixed, exponential-backoff, jittered), image filters (blur, sharpen, edge-detect). The naive approach stuffs all variants into one method behind an `if/elif/else` ladder keyed on a type tag. Every new variant means editing that method, re-testing every branch, and risking regressions in unrelated code. The class accumulates dependencies on every algorithm's libraries; unit tests need to set up state for branches they do not exercise.

The Strategy pattern observes: **the variable part of the work — the algorithm itself — is the unit of change**. Extract it. Define an interface that captures the common contract (`charge(amount)`, `compress(bytes)`, `rank(query, doc)`), implement each variant as its own class (one file, one focused unit test), and have the caller hold a reference to the interface, picking the concrete strategy at construction time. The caller is **closed for modification** (Open/Closed Principle), every strategy is **independently testable**, and adding a new variant is a **pure addition** — no existing code changes.

This is the textbook refactor for "Replace Conditional with Polymorphism" (Martin Fowler, *Refactoring*, 1999). The if/else ladder gets replaced with a runtime dispatch table; the dispatch is a single virtual-method call rather than a chain of branch predictions, so performance is comparable, and the structural win — maintainability, testability, single-responsibility per file — dominates.

The travel-planner analogy: you always have a "go from A to B" goal, but the algorithm changes — drive, fly, take a train. The trip planner does not care which one; it just calls `route.travel(a, b)`. Each transport mode is its own strategy with its own pricing, timing, and constraints; the planner is decoupled from all of them. Strategy in code is the same shape: a context object holds a `Strategy` reference and delegates the variable part of the work to it, and the choice of concrete strategy is made once at the **composition root** (CLI flag, config file, user choice) and passed in via dependency injection.

## visualization
Picture a `PaymentProcessor` with a `PaymentStrategy` field. Three concrete strategies — `StripeStrategy`, `PayPalStrategy`, `CryptoStrategy` — all implement `charge(amount)`. At runtime you build the processor with whichever strategy matches the user's choice, then call `processor.checkout(99.00)`. The processor code is identical regardless; the strategy box plugged into its slot decides the behavior.

## bruteForce
The pre-strategy code is a long `switch` keyed on a string or enum:
```
if method == "stripe": stripe_charge(...)
elif method == "paypal": paypal_charge(...)
elif method == "crypto": ...
```
Every variant lives in one giant file, every change touches the same hot region, and unit tests cannot easily target a single branch without dragging the others along. It compiles, it ships, and it rots.

## optimal
The right structure is **a Strategy interface, one concrete implementation per algorithm, a Context class that holds the interface via constructor injection, and a composition root that picks the concrete Strategy once at startup**. This is the canonical "Replace Conditional with Polymorphism" refactor and aligns with the Open/Closed and Single-Responsibility principles in SOLID.

```python
from abc import ABC, abstractmethod

# 1. Strategy interface: one method capturing the variable behavior.
class PaymentStrategy(ABC):
    @abstractmethod
    def charge(self, amount: float, currency: str) -> ChargeResult: ...

# 2. Concrete strategies: one per algorithm, each independently testable.
class StripeStrategy(PaymentStrategy):
    def __init__(self, api_key: str): self.client = stripe.Client(api_key)
    def charge(self, amount, currency):
        return self.client.charges.create(amount_cents=int(amount*100), currency=currency)

class PayPalStrategy(PaymentStrategy):
    def __init__(self, oauth_token: str): self.client = paypal.Client(oauth_token)
    def charge(self, amount, currency):
        return self.client.payments.create(amount, currency)

class AdyenStrategy(PaymentStrategy):
    def charge(self, amount, currency):
        return adyen_sdk.authorize(amount, currency, merchant_account="...")

# 3. Context: depends on the interface, not on any concrete strategy.
class Checkout:
    def __init__(self, strategy: PaymentStrategy):
        self.strategy = strategy
    def pay(self, amount: float, currency: str = "USD") -> ChargeResult:
        return self.strategy.charge(amount, currency)

# 4. Composition root: pick the strategy once, based on config or input.
def build_checkout(config) -> Checkout:
    strategies = {                                     # registry > switch
        "stripe": lambda: StripeStrategy(config.stripe_key),
        "paypal": lambda: PayPalStrategy(config.paypal_token),
        "adyen":  lambda: AdyenStrategy(),
    }
    factory = strategies.get(config.payment_provider)
    if not factory:
        raise ValueError(f"unknown provider: {config.payment_provider}")
    return Checkout(factory())
```

Why this is right: (1) **Each strategy is its own file** with focused dependencies — `StripeStrategy` only pulls in the Stripe SDK, `PayPalStrategy` only the PayPal SDK. (2) **Unit tests target one strategy at a time** without setting up state for irrelevant branches; mocking is trivial because `Checkout` depends on the interface. (3) **Adding a new payment provider** requires zero changes to `Checkout` — drop in a new class and register it in the factory map (pure addition, Open/Closed). (4) **The composition root is the single place where the algorithm choice lives**, making the architecture self-documenting; an engineer reading `build_checkout` sees every supported provider in one block.

**Production refinements**:
- **Registry over switch**: prefer the `strategies` dict over `if/elif`; it scales linearly in code review pain and makes the supported set discoverable.
- **DI container integration**: Spring's `@Component` + `@Qualifier`, Guice's `@Provides`, Dagger's `@Module`, and Angular's `@Injectable` all express Strategy at the container level — no hand-rolled registry needed.
- **Stateless strategies are thread-safe**; if a strategy holds mutable state, document the threading contract or use a fresh instance per request.
- **Strategy + Decorator combine cleanly**: wrap a `StripeStrategy` with `RetryDecorator(StripeStrategy)` and `LoggingDecorator(...)` to add retries and logging without touching the strategy itself.

**When Strategy is wrong**:
- **Only one implementation**: premature; wait for the second variant before introducing the pattern. YAGNI applies.
- **Strategies that need to call each other**: you have rebuilt the switch with extra steps. Refactor to a Chain-of-Responsibility or a Visitor.
- **State machines** (where the algorithm changes based on the object's own lifecycle): use State pattern, not Strategy.

**Comparison with adjacent patterns**: **Factory** chooses which class to instantiate; **Strategy** chooses which algorithm a single class delegates to. **Template Method** fixes the algorithm's structure and lets subclasses override hooks; Strategy swaps the entire algorithm. **Command** wraps a request as an object so it can be queued, logged, undone; Strategy is purely about algorithm selection. Mixing these up is the most common interview confusion.

## complexity
time: O(1) dispatch overhead per call (one virtual lookup)
space: O(1) per strategy instance — usually shared
notes: Strategy has the same asymptotic cost as a switch but trades a branch predictor hit for a vtable lookup. The win is structural: maintenance and testability, not microseconds.

## pitfalls
- Premature strategy: introducing the pattern when only one algorithm exists creates noise. Wait for the second variant.
- Leaking strategy choice everywhere: pick the strategy at the composition root, not inside every method.
- Strategies that depend on each other: if `StrategyA` needs to call `StrategyB`, you've rebuilt the switch with extra steps.
- Stateful strategies shared across threads: prefer immutable strategy instances or document the threading contract.
- Confusing Strategy with State — State swaps based on the object's own lifecycle; Strategy is chosen externally.

## interviewTips
- Mention Strategy when an interviewer's design has a switch over a type code — it is the textbook refactor.
- Pair it with Dependency Injection: "Inject the Strategy at construction so the class stays closed for modification."
- Real-world examples land well: comparator functions, Spring's `PasswordEncoder`, JavaScript array `sort(cmp)`, Python's `key=` argument — all are Strategies.

## code.python
```python
from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def charge(self, amount: float) -> str: ...

class StripeStrategy(PaymentStrategy):
    def charge(self, amount): return f"stripe charged ${amount:.2f}"

class PayPalStrategy(PaymentStrategy):
    def charge(self, amount): return f"paypal charged ${amount:.2f}"

class CryptoStrategy(PaymentStrategy):
    def charge(self, amount): return f"BTC equivalent of ${amount:.2f}"

class Checkout:
    def __init__(self, strategy: PaymentStrategy):
        self.strategy = strategy
    def pay(self, amount):
        return self.strategy.charge(amount)

for s in (StripeStrategy(), PayPalStrategy(), CryptoStrategy()):
    print(Checkout(s).pay(42.5))
```

## code.javascript
```javascript
class StripeStrategy { charge(a) { return `stripe charged $${a.toFixed(2)}`; } }
class PayPalStrategy { charge(a) { return `paypal charged $${a.toFixed(2)}`; } }
class CryptoStrategy { charge(a) { return `BTC equivalent of $${a.toFixed(2)}`; } }

class Checkout {
  constructor(strategy) { this.strategy = strategy; }
  pay(amount) { return this.strategy.charge(amount); }
}

for (const s of [new StripeStrategy(), new PayPalStrategy(), new CryptoStrategy()]) {
  console.log(new Checkout(s).pay(42.5));
}
```

## code.java
```java
interface PaymentStrategy { String charge(double amount); }

class StripeStrategy implements PaymentStrategy {
    public String charge(double a) { return "stripe charged $" + a; }
}
class PayPalStrategy implements PaymentStrategy {
    public String charge(double a) { return "paypal charged $" + a; }
}

class Checkout {
    private final PaymentStrategy strategy;
    public Checkout(PaymentStrategy s) { this.strategy = s; }
    public String pay(double a) { return strategy.charge(a); }
}

class App {
    public static void main(String[] args) {
        System.out.println(new Checkout(new StripeStrategy()).pay(42.5));
        System.out.println(new Checkout(new PayPalStrategy()).pay(42.5));
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <memory>
#include <string>

struct PaymentStrategy {
    virtual std::string charge(double amount) = 0;
    virtual ~PaymentStrategy() = default;
};

struct StripeStrategy : PaymentStrategy {
    std::string charge(double a) override { return "stripe charged $" + std::to_string(a); }
};

struct PayPalStrategy : PaymentStrategy {
    std::string charge(double a) override { return "paypal charged $" + std::to_string(a); }
};

class Checkout {
    std::unique_ptr<PaymentStrategy> s_;
public:
    explicit Checkout(std::unique_ptr<PaymentStrategy> s) : s_(std::move(s)) {}
    std::string pay(double a) { return s_->charge(a); }
};
```
