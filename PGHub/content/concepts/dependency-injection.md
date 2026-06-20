---
slug: dependency-injection
module: foundations-analysis
title: Dependency Injection
subtitle: Invert control of object wiring so classes receive collaborators instead of constructing them — the keystone of testable architecture.
difficulty: Intermediate
position: 90
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Inversion of Control Containers and the Dependency Injection pattern — Martin Fowler"
    url: "https://martinfowler.com/articles/injection.html"
    type: blog
  - title: "Dependency Injection — Refactoring Guru"
    url: "https://refactoring.guru/design-patterns/dependency-injection"
    type: book
  - title: "DovAmir/awesome-design-patterns — Dependency Injection section"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
Dependency Injection (DI) is the practice of supplying a class with the objects it needs rather than letting it create them internally. The class declares what it depends on through its constructor, a setter, or an interface; a separate piece of code (often a container) decides which concrete implementation to hand over. The result is loose coupling, swap-in test doubles, and code that reads like a wiring diagram instead of a tangle.

## whyItMatters
Hard-coded `new` calls bind a class to a specific implementation forever. Want to swap a real payment gateway for a sandbox? Mock a database in a unit test? Run the same service against Postgres in prod and SQLite in CI? Without DI you patch globals, monkey-patch imports, or refactor every caller. With DI those swaps are one line of configuration. Frameworks like Spring (Java), Angular (TypeScript), ASP.NET Core (C#), NestJS (Node), Dagger (Android), and FastAPI (Python) are built on this idea because it scales to thousands of objects. Martin Fowler's 2004 essay *Inversion of Control Containers and the Dependency Injection pattern* is the canonical reference; Robert Martin's SOLID principles put the Dependency-Inversion Principle as the D, because it is the one that lets the other four breathe.

## intuition
A class needs collaborators — a logger, a database client, a payment gateway, a clock. If the class constructs them inside its own constructor (`self.db = PostgresClient("prod-host")`), it is now bound to that exact implementation and configuration. Tests have to spin up a real Postgres; staging has to ship the prod host; a new gateway requires editing every call site. The class secretly knows too much.

Dependency injection flips the relationship: the class declares what it needs (often as constructor parameters) and an outside party provides instances. The class no longer constructs anything; it only consumes. Now tests can inject a fake database, staging can inject a staging gateway, and the class itself never changes. The outside party that wires real implementations into real classes is called the *composition root* (typically `main()` or a framework startup hook). Everything else is just plain code that takes parameters.

The three flavors differ only in how dependencies arrive. **Constructor injection** passes them at construction time and is the safest because the object is immutable once built. **Setter injection** passes them after construction via mutators — useful when frameworks need to instantiate first and configure later. **Interface injection** is rare; the dependency itself calls an `inject(client)` method on the consumer. Constructor injection is the default in every modern framework.

## visualization
Picture a `ReportService` that needs an `EmailSender`. Without DI: `ReportService` calls `new SmtpEmailSender(...)` inside its constructor — the two boxes are welded together. With DI: `ReportService` declares `EmailSender sender` as a constructor parameter. A composition root (or container) draws the arrow from `SmtpEmailSender` into that parameter at startup. In tests, the same arrow is redrawn from `FakeEmailSender` — without touching `ReportService` source.

## bruteForce
The non-DI baseline is the Service Locator or plain `new`. A class either instantiates its dependencies directly (`this.db = new PostgresClient()`) or fetches them from a global registry (`this.db = ServiceLocator.get("db")`). Both work, both feel simple, both rot quickly: every consumer learns the concrete type or the registry key, tests become harder than the code they cover, and configuration leaks into business logic. It is acceptable for tiny scripts and unacceptable for anything you intend to keep.

## optimal
Constructor-inject everything a class needs, declared as interface types (or `Protocol` types in Python, traits in Rust). Wire concrete implementations in one composition root at process startup. Do not reach for a full DI container until the wiring code grows past a hundred lines or you need scope-bound lifecycles (per-request database connections, singleton config). For libraries, never assume a DI container; accept dependencies as plain parameters so callers can wire however they like.

```python
from typing import Protocol

class PaymentGateway(Protocol):
    def charge(self, amount_cents: int, token: str) -> str: ...

class Checkout:
    def __init__(self, gateway: PaymentGateway, clock):
        self.gateway = gateway
        self.clock = clock
    def run(self, cart, token):
        charge_id = self.gateway.charge(cart.total_cents, token)
        return Receipt(charge_id, self.clock.now())

# Composition root (one place, at process boot)
gateway = StripeGateway(api_key=os.environ['STRIPE_KEY'])
checkout = Checkout(gateway=gateway, clock=SystemClock())
```

The critical pattern is the `Protocol` declaration plus constructor parameters: `Checkout` knows nothing about Stripe, so a test can pass an in-memory `FakeGateway`, an integration suite can pass a Stripe sandbox client, and the prod composition root passes the real client. The wiring is centralized; the consumer is decoupled. For larger systems use a container (Spring's `@Component`, NestJS's `@Injectable`, FastAPI's `Depends`) to resolve transitive graphs automatically, but resist over-engineering: a plain `main()` that constructs and passes objects is often the most maintainable wiring you can write.

## complexity
time: O(1) per resolution after container build
space: O(n) where n is the number of registered services
notes: Container startup cost is paid once. Runtime resolution of a constructor graph is linear in the number of dependencies. The real "complexity" of DI is cognitive: a deep graph can be hard to trace without tooling.

## pitfalls
- Service Locator anti-pattern: hiding dependencies behind a global getter defeats the readability win.
- Constructor explosion: more than five parameters usually signals the class is doing too much — split it before reaching for DI tricks.
- Circular dependencies: A needs B, B needs A. Containers usually detect this; fix it by extracting a third type rather than using setter injection as a workaround.
- Injecting concrete types instead of interfaces: keeps the coupling, just adds boilerplate.
- Over-eager DI in tiny apps — wiring a 4-class script through a container is pure ceremony.

## interviewTips
- Be ready to contrast Service Locator vs. constructor injection; interviewers love this trade-off.
- Mention that DI enables the Liskov Substitution Principle and the "D" in SOLID.
- If asked to design a system (URL shortener, rate limiter), declare the storage layer as an injected interface so you can casually say "swap Redis for an in-memory map in tests."
- Know the three flavors: constructor, setter, interface — and why constructor wins in most cases.

## code.python
```python
from abc import ABC, abstractmethod

class EmailSender(ABC):
    @abstractmethod
    def send(self, to: str, body: str) -> None: ...

class SmtpEmailSender(EmailSender):
    def send(self, to, body):
        print(f"SMTP -> {to}: {body}")

class FakeEmailSender(EmailSender):
    def __init__(self):
        self.sent = []
    def send(self, to, body):
        self.sent.append((to, body))

class ReportService:
    def __init__(self, sender: EmailSender):
        self._sender = sender
    def email_report(self, user, report):
        self._sender.send(user, report)

if __name__ == "__main__":
    service = ReportService(SmtpEmailSender())
    service.email_report("a@b.com", "Q3 numbers")

    fake = FakeEmailSender()
    ReportService(fake).email_report("t@b.com", "test")
    assert fake.sent == [("t@b.com", "test")]
```

## code.javascript
```javascript
class SmtpEmailSender {
  send(to, body) { console.log(`SMTP -> ${to}: ${body}`); }
}

class FakeEmailSender {
  constructor() { this.sent = []; }
  send(to, body) { this.sent.push([to, body]); }
}

class ReportService {
  constructor(sender) { this.sender = sender; }
  emailReport(user, report) { this.sender.send(user, report); }
}

const service = new ReportService(new SmtpEmailSender());
service.emailReport("a@b.com", "Q3 numbers");

const fake = new FakeEmailSender();
new ReportService(fake).emailReport("t@b.com", "test");
console.assert(fake.sent[0][1] === "test");
```

## code.java
```java
interface EmailSender { void send(String to, String body); }

class SmtpEmailSender implements EmailSender {
    public void send(String to, String body) {
        System.out.println("SMTP -> " + to + ": " + body);
    }
}

class FakeEmailSender implements EmailSender {
    final java.util.List<String> sent = new java.util.ArrayList<>();
    public void send(String to, String body) { sent.add(to + "|" + body); }
}

class ReportService {
    private final EmailSender sender;
    public ReportService(EmailSender sender) { this.sender = sender; }
    public void emailReport(String user, String report) { sender.send(user, report); }
}

class App {
    public static void main(String[] args) {
        new ReportService(new SmtpEmailSender()).emailReport("a@b.com", "Q3");
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct EmailSender {
    virtual void send(const std::string& to, const std::string& body) = 0;
    virtual ~EmailSender() = default;
};

struct SmtpEmailSender : EmailSender {
    void send(const std::string& to, const std::string& body) override {
        std::cout << "SMTP -> " << to << ": " << body << "\n";
    }
};

struct FakeEmailSender : EmailSender {
    std::vector<std::pair<std::string,std::string>> sent;
    void send(const std::string& to, const std::string& body) override {
        sent.emplace_back(to, body);
    }
};

class ReportService {
    std::shared_ptr<EmailSender> sender_;
public:
    explicit ReportService(std::shared_ptr<EmailSender> s) : sender_(std::move(s)) {}
    void emailReport(const std::string& u, const std::string& r) { sender_->send(u, r); }
};
```
