---
slug: design-pattern-factory
module: foundations
title: Factory Pattern
subtitle: Centralize object creation behind a method so callers depend on the interface, not on concrete classes — Factory Method and Abstract Factory.
difficulty: Beginner
position: 96
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Factory Method — Refactoring Guru"
    url: "https://refactoring.guru/design-patterns/factory-method"
    type: book
  - title: "Replace Constructor With Factory Function — Martin Fowler"
    url: "https://refactoring.com/catalog/replaceConstructorWithFactoryFunction.html"
    type: blog
  - title: "DovAmir/awesome-design-patterns — Factory"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
The Factory pattern hides the decision of *which* class to instantiate behind a method call. Callers ask for "a parser" or "a logger" by capability, and the factory decides whether to return a JSON parser or an XML parser, a console logger or a file logger. There are two flavors in the GoF playbook: Factory Method (one factory per product family, subclass to swap) and Abstract Factory (one factory that returns a *family* of related products).

## whyItMatters
Direct `new ConcreteClass(...)` calls scattered across a codebase cement the choice of implementation everywhere. Switching the JSON library or the database driver becomes a sweep over hundreds of files. A factory localizes that decision to one method: change the factory, change the whole system. Factories also let constructors stay private, validate inputs, return cached instances, or pick implementations based on environment (cloud vs. on-prem) and feature flags.

## intuition
Think of a pizzeria with regional menus: ask `nyFactory.makePizza("cheese")` and you get a New York slice; ask `chicagoFactory.makePizza("cheese")` and you get deep dish. The caller's code does not change; the factory determines the concrete product. Abstract Factory extends this to "make me a chair, a sofa, and a table from the same furniture line" — guaranteeing the products belong together.

## visualization
Picture a `Logger` interface with two implementations, `ConsoleLogger` and `FileLogger`. A `LoggerFactory.create(env)` method returns a `Logger`: console for `dev`, file for `prod`. Callers receive the interface, call `log.info("started")`, and never see the concrete type. To add a `CloudLogger`, you add one class and one branch inside the factory — every caller automatically benefits.

## bruteForce
Without a factory, every consumer does its own `new ConsoleLogger()` or `new FileLogger()`, each repeating the environment check. A migration to a new logger means a global find-and-replace; a misspelling silently leaves one caller behind. Configuration scatters; testing requires monkey-patching; subclasses sneak into call sites that should not know they exist.

## optimal
Define a product interface. Make constructors of concrete products package-private (or convention-private). Expose a single creation method — `Factory.create(...)` for Factory Method, or a class with multiple creators for Abstract Factory. Decide concrete type once, based on configuration, environment, or input. For language-level factories, simple static methods (`Logger.forEnv("prod")`) often suffice. Reach for the full pattern when the family of related products grows or when DI containers cannot resolve the choice automatically.

## complexity
time: O(1) per creation (plus the cost of the chosen constructor)
space: O(1) per instance; factories themselves are usually stateless
notes: Factories add one indirection. The cost is structural — slightly more code — and the benefit is decoupling. Cached / pooled factories trade space for the cost of repeated construction.

## pitfalls
- Factory that grows a giant switch on a string key — the very anti-pattern Strategy and OCP teach you to avoid. Use a registry or map of suppliers.
- Returning concrete types from the factory: defeats the abstraction. Always return the interface.
- Hidden global state inside the factory (a static cache): can cause cross-test contamination. Make caches explicit or use a DI container.
- Confusing Factory Method (single product, subclass to vary) with Abstract Factory (family of products, instance to vary).
- Overusing in tiny apps — when there is only one implementation, plain `new` is fine.

## interviewTips
- Be ready to name three real factories: `Calendar.getInstance()`, `Logger.getLogger(name)`, `Connection` from `DriverManager.getConnection()`.
- Contrast Factory Method vs Abstract Factory in one breath: "Method = one product, subclass picks; Abstract = family, instance picks."
- Mention how factories enable testing — return a `FakeLogger` in tests without changing call sites.

## code.python
```python
from abc import ABC, abstractmethod

class Logger(ABC):
    @abstractmethod
    def log(self, msg: str) -> None: ...

class ConsoleLogger(Logger):
    def log(self, msg): print(f"console: {msg}")

class FileLogger(Logger):
    def __init__(self, path): self.path = path
    def log(self, msg):
        with open(self.path, "a") as f:
            f.write(msg + "\n")

class LoggerFactory:
    @staticmethod
    def create(env: str) -> Logger:
        if env == "prod":
            return FileLogger("/tmp/app.log")
        if env == "dev":
            return ConsoleLogger()
        raise ValueError(f"unknown env {env}")

log = LoggerFactory.create("dev")
log.log("ready")
```

## code.javascript
```javascript
class ConsoleLogger { log(msg) { console.log("console:", msg); } }
class HttpLogger {
  constructor(url) { this.url = url; }
  log(msg) { /* fetch(this.url, ...) */ console.log("http ->", this.url, msg); }
}

class LoggerFactory {
  static create(env) {
    switch (env) {
      case "dev": return new ConsoleLogger();
      case "prod": return new HttpLogger("https://logs.example.com");
      default: throw new Error(`unknown env ${env}`);
    }
  }
}

const log = LoggerFactory.create("dev");
log.log("ready");
```

## code.java
```java
interface Logger { void log(String msg); }

class ConsoleLogger implements Logger {
    public void log(String msg) { System.out.println("console: " + msg); }
}

class FileLogger implements Logger {
    private final String path;
    public FileLogger(String path) { this.path = path; }
    public void log(String msg) { /* append to file */ System.out.println("file(" + path + "): " + msg); }
}

class LoggerFactory {
    public static Logger create(String env) {
        return switch (env) {
            case "dev" -> new ConsoleLogger();
            case "prod" -> new FileLogger("/tmp/app.log");
            default -> throw new IllegalArgumentException("unknown env " + env);
        };
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>

struct Logger {
    virtual void log(const std::string& msg) = 0;
    virtual ~Logger() = default;
};

struct ConsoleLogger : Logger {
    void log(const std::string& msg) override { std::cout << "console: " << msg << "\n"; }
};

struct FileLogger : Logger {
    std::string path;
    explicit FileLogger(std::string p) : path(std::move(p)) {}
    void log(const std::string& msg) override { std::cout << "file(" << path << "): " << msg << "\n"; }
};

class LoggerFactory {
public:
    static std::unique_ptr<Logger> create(const std::string& env) {
        if (env == "dev") return std::make_unique<ConsoleLogger>();
        if (env == "prod") return std::make_unique<FileLogger>("/tmp/app.log");
        throw std::invalid_argument("unknown env " + env);
    }
};
```
