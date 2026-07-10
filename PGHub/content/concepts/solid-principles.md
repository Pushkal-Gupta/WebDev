---
slug: solid-principles
module: foundations-analysis
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
The reframe that makes all five click: SOLID is really one idea seen from five angles — *isolate the things that change independently, and let them meet only through a stable seam.* A seam is any place you can swap one implementation for another without editing the caller: an interface, an injected dependency, a polymorphic method. Every principle below is a rule about where to put a seam and how to keep it clean.

Walk a concrete story. You inherit an `Order` class that formats invoices, emails customers, writes to the database, and computes tax — 600 lines, one file. A PDF-format request lands. Because formatting and persistence live in the same class, your edit to the formatter risks the save path, and the test for it boots a real database. That single class has *four reasons to change*, and every reason is now entangled with the other three. SOLID untangles them one seam at a time.

- **S** — A class should have one reason to change. If marketing rewrites the invoice format and accounting rewrites the tax engine, those are two reasons; split the class.
- **O** — Code should be open to extension, closed to modification. Add a new payment provider by writing a new class, not by editing the switch statement.
- **L** — A subclass must be usable wherever its parent is. If `Square extends Rectangle` breaks `rect.setWidth(5); rect.setHeight(10); assert area == 50`, the hierarchy is wrong.
- **I** — Many small interfaces beat one fat one. A `Printer` should not be forced to implement `Fax`.
- **D** — Depend on abstractions, not concretions. High-level policy should not import low-level driver code.

What's actually happening across all five: you are trading a handful of extra type declarations for the ability to change any one behavior in isolation. S decides *what* becomes its own unit; O and L govern *how a unit is extended and subtyped* without breaking callers; I keeps the *seam narrow* so implementers aren't forced to stub methods; D *points the dependency arrow at the abstraction* so the high-level policy never names a concrete driver. Get the seams right and a new feature becomes a new file, not a scar across a dozen old ones.

## visualization
Each letter maps to a smell you can spot in review and a mechanical fix:

```
Ltr  Principle              Violation symptom seen in code        Refactor move
 --  ---------              ------------------------------        -------------
 S   Single Responsibility  class does format + save + email      extract one collaborator per reason
 O   Open/Closed            switch(type){...} edited per new case  add subclass; dispatch polymorphically
 L   Liskov Substitution    override throws NotSupported / no-op    drop inheritance; prefer composition
 I   Interface Segregation  implementers stub methods they ignore  split fat interface by client need
 D   Dependency Inversion   high-level module does new DbClient()   depend on interface; inject at root
 --  ---------              ------------------------------        -------------
 all= one idea: isolate what changes independently, meet at a stable seam (interface/injection)
```

Before/after trace on the `Order` god-class from the intuition story:

```
BEFORE (violates S, O, D)
  class Order:
    def total(): ...
    def to_pdf(): ...              # reason-to-change #2
    def save(): db = DbClient()    # reason-to-change #3, hard dep
    def email(): SmtpClient()...   # reason-to-change #4

AFTER (seams added)
  class Order:            data only, one reason to change
  InvoiceFormatter(iface) -> {PdfFormatter, HtmlFormatter}   # O: new fmt = new class
  Repository(iface)       -> injected into InvoiceService     # D: no concrete DbClient
  service = InvoiceService(formatter=Pdf, repo=SqlRepo)       # wired at composition root
    render(order) -> formatter.format(order)   # swap Pdf<->Html w/o touching service
```

## bruteForce
The pre-SOLID approach is a "god class": one type that owns persistence, formatting, validation, and notification, with concrete `new` calls for every collaborator. It ships fast and breaks faster. Every new requirement means editing the same monster; every bug fix risks regressing an unrelated feature; tests must spin up the database to verify formatting logic. This is the codebase you inherit and resent.

## optimal
Apply SOLID incrementally, driven by pain rather than prophecy. Whenever a class grows past ~200 lines or absorbs a second reason to change, extract a collaborator. Whenever a `switch` statement keys on a type tag, replace it with polymorphism (OCP). Whenever a subclass overrides a method to "do nothing" or "throw NotSupported," your hierarchy is violating LSP — prefer composition. Whenever an interface gains a method most implementers stub out, split it (ISP). Whenever a high-level module imports a database driver directly, introduce a repository interface and inject it (DIP). The endgame: small classes, depending on interfaces, wired at a composition root.

Why this order and this discipline is correct: the guiding invariant is that **a change should touch exactly the units that own the changed reason, and nothing else.** SRP names the units; the other four keep the seams between them from leaking. If you apply the principles speculatively — an interface for every class before a second implementation exists — you pay the cost (indirection, more files, harder navigation) without the benefit, which is the over-engineering pitfall. So the tradeoff is explicit: each seam buys isolation at the price of indirection, and you only add a seam once a real second implementation, a real test double, or a real second reason-to-change has appeared.

Step by step on a legacy class: (1) list the reasons it changes — each becomes a candidate unit; (2) extract the most volatile reason first, behind an interface; (3) invert the dependency so the original class receives the collaborator instead of constructing it; (4) repeat until each unit changes for one reason; (5) wire the concrete choices in a single composition root (a factory or `main`). The complexity intuition: you are not reducing total code, you are reducing the *fan-out of a single change* from "many files" to "one" — measured in future edit cost, not lines saved today.

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
