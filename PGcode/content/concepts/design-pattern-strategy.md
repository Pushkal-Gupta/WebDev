---
slug: design-pattern-strategy
module: foundations
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
Algorithmic variety is everywhere: payment processors, compression formats, ranking functions, retry policies, image filters, A/B-test variants. The naive version stuffs them all into one method behind an `if/elif/else` ladder. Every new variant means editing that method, retesting every branch, and risking regressions in unrelated code. Strategy flips the relationship: each algorithm is its own file, the caller is closed for modification, and adding a new variant is a pure addition.

## intuition
Think of choosing how to travel between cities. You always have a "go from A to B" goal, but the algorithm changes — drive, fly, take a train. The trip planner doesn't care which one; it just calls `route.travel(a, b)`. Strategy is the same pattern in code: a context object holds a `Strategy` reference and delegates the variable part of the work to it.

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
Define an interface (`Strategy`) with one method describing the variable behavior. Implement each algorithm as its own class. Give the client (`Context`) a field of the interface type and a constructor or setter to inject the strategy. Choose the strategy once at the edge of the system (CLI flag, config file, user choice) and pass it down. The context is closed for modification, every strategy is unit-testable on its own, and new variants are pure additions — exactly the Open/Closed Principle in action.

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
