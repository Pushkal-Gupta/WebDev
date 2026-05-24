---
slug: solid-principles
module: foundations
title: SOLID Principles
subtitle: Five object-oriented design rules — SRP, OCP, LSP, ISP, DIP — that keep large codebases changeable instead of fragile.
difficulty: Intermediate
position: 91
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Design Principles and Design Patterns — Martin Fowler"
    url: "https://martinfowler.com/bliki/SolidDesignPrinciples.html"
    type: blog
  - title: "Refactoring Guru — Design Principles"
    url: "https://refactoring.guru/design-patterns/principles"
    type: book
  - title: "DovAmir/awesome-design-patterns"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
SOLID is a five-letter acronym coined by Robert C. Martin for the most important object-oriented design principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. Each is a constraint that, when honored, keeps software flexible: adding a feature should not require ripping through a dozen unrelated classes. Treat SOLID as guidance, not religion — but know exactly which rule you are bending and why.

## whyItMatters
Most production bugs and most slow features land not in fresh code but in code that someone wrote a year ago, forgot, and now has to modify. SOLID minimizes the blast radius of a change: a class with one responsibility is read and modified in one place; an extension that opens a new file rather than editing an old one cannot break existing callers; substituting a subclass cannot surprise the parent's tests. Every legacy codebase that is painful to change violates at least three of these principles — usually all five.

## intuition
- **S** — A class should have one reason to change. If marketing rewrites the invoice format and accounting rewrites the tax engine, those are two reasons; split the class.
- **O** — Code should be open to extension, closed to modification. Add a new payment provider by writing a new class, not by editing the switch statement.
- **L** — A subclass must be usable wherever its parent is. If `Square extends Rectangle` breaks `rect.setWidth(5); rect.setHeight(10); assert area == 50`, the hierarchy is wrong.
- **I** — Many small interfaces beat one fat one. A `Printer` should not be forced to implement `Fax`.
- **D** — Depend on abstractions, not concretions. High-level policy should not import low-level driver code.

## visualization
Draw a class diagram before refactoring: one giant `Order` class with arrows to PDF, Email, DB, Tax, Audit. After SOLID: `Order` holds data, `InvoiceFormatter` is an interface with `PdfInvoiceFormatter` and `HtmlInvoiceFormatter` implementations, `Notifier` is an interface, `TaxCalculator` is injected. Same behavior, but every arrow now crosses an interface — so any leaf can be swapped or tested independently.

## bruteForce
The pre-SOLID approach is a "god class": one type that owns persistence, formatting, validation, and notification, with concrete `new` calls for every collaborator. It ships fast and breaks faster. Every new requirement means editing the same monster; every bug fix risks regressing an unrelated feature; tests must spin up the database to verify formatting logic. This is the codebase you inherit and resent.

## optimal
Apply SOLID incrementally. Whenever a class grows past ~200 lines or absorbs a second reason to change, extract a collaborator. Whenever a `switch` statement keys on a type tag, replace it with polymorphism (OCP). Whenever a subclass overrides a method to "do nothing" or "throw NotSupported," your hierarchy is violating LSP — prefer composition. Whenever an interface gains a method most implementers stub out, split it (ISP). Whenever a high-level module imports a database driver directly, introduce a repository interface and inject it (DIP). The endgame: small classes, depending on interfaces, wired at a composition root.

## complexity
time: not applicable (design principle, not algorithm)
space: not applicable
notes: SOLID trades short-term keystrokes (more files, more interfaces) for long-term changeability. Measure success in how easily a new feature lands six months from now, not in lines saved today.

## pitfalls
- Over-engineering: creating an interface for every class "just in case." Add one when a second implementation appears or a test needs a fake.
- Treating SRP as "one method per class" — the unit is one *reason to change*, not one verb.
- Misreading LSP as "any subclass that compiles is fine" — the behavioral contract matters, not just the type signature.
- Splitting interfaces by author rather than by client: ISP is about what callers need, not how the implementer organizes code.
- Quoting SOLID as dogma in code review without naming the concrete pain it prevents.

## interviewTips
- Memorize the five letters and one-sentence explanations — system-design interviews open with this.
- Be ready with a real LSP violation: the Square/Rectangle example or a `ReadOnlyList` that throws on `add`.
- Tie DIP to Dependency Injection — they are the same idea seen from two angles.
- When asked to critique code, look for fat classes (SRP), giant switch statements (OCP), and direct `new DatabaseClient()` calls (DIP). Easy wins.

## code.python
```python
from abc import ABC, abstractmethod

class InvoiceFormatter(ABC):
    @abstractmethod
    def format(self, order) -> str: ...

class HtmlInvoiceFormatter(InvoiceFormatter):
    def format(self, order):
        return f"<h1>Order {order['id']}: ${order['total']}</h1>"

class PdfInvoiceFormatter(InvoiceFormatter):
    def format(self, order):
        return f"%PDF Order {order['id']} total {order['total']}"

class InvoiceService:
    def __init__(self, formatter: InvoiceFormatter):
        self._formatter = formatter
    def render(self, order):
        return self._formatter.format(order)

order = {"id": 7, "total": 42}
print(InvoiceService(HtmlInvoiceFormatter()).render(order))
print(InvoiceService(PdfInvoiceFormatter()).render(order))
```

## code.javascript
```javascript
class HtmlInvoiceFormatter {
  format(order) { return `<h1>Order ${order.id}: $${order.total}</h1>`; }
}
class PdfInvoiceFormatter {
  format(order) { return `%PDF Order ${order.id} total ${order.total}`; }
}

class InvoiceService {
  constructor(formatter) { this.formatter = formatter; }
  render(order) { return this.formatter.format(order); }
}

const order = { id: 7, total: 42 };
console.log(new InvoiceService(new HtmlInvoiceFormatter()).render(order));
console.log(new InvoiceService(new PdfInvoiceFormatter()).render(order));
```

## code.java
```java
interface InvoiceFormatter { String format(Order o); }

class HtmlInvoiceFormatter implements InvoiceFormatter {
    public String format(Order o) { return "<h1>Order " + o.id + ": $" + o.total + "</h1>"; }
}

class PdfInvoiceFormatter implements InvoiceFormatter {
    public String format(Order o) { return "%PDF Order " + o.id + " total " + o.total; }
}

class InvoiceService {
    private final InvoiceFormatter formatter;
    public InvoiceService(InvoiceFormatter f) { this.formatter = f; }
    public String render(Order o) { return formatter.format(o); }
}

record Order(int id, double total) {}
```

## code.cpp
```cpp
#include <iostream>
#include <memory>
#include <string>

struct Order { int id; double total; };

struct InvoiceFormatter {
    virtual std::string format(const Order&) = 0;
    virtual ~InvoiceFormatter() = default;
};

struct HtmlInvoiceFormatter : InvoiceFormatter {
    std::string format(const Order& o) override {
        return "<h1>Order " + std::to_string(o.id) + ": $" + std::to_string(o.total) + "</h1>";
    }
};

struct PdfInvoiceFormatter : InvoiceFormatter {
    std::string format(const Order& o) override {
        return "%PDF Order " + std::to_string(o.id);
    }
};

class InvoiceService {
    std::unique_ptr<InvoiceFormatter> fmt_;
public:
    explicit InvoiceService(std::unique_ptr<InvoiceFormatter> f) : fmt_(std::move(f)) {}
    std::string render(const Order& o) { return fmt_->format(o); }
};
```
