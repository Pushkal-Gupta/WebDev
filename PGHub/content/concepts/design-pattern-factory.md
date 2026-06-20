---
slug: design-pattern-factory
module: foundations-patterns
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
- **`java.sql.DriverManager.getConnection(url)`** is the JDBC factory — `url` decides whether you get a Postgres, MySQL, or Oracle connection, and your code never names a concrete driver class.
- **`Logger.getLogger(name)`** in `java.util.logging`, **SLF4J's `LoggerFactory`**, and **Python's `logging.getLogger(name)`** all return cached, configured logger instances — callers never call `new ConsoleLogger()`.
- **Spring's `@Bean` methods**, **`@Component` + `ApplicationContext.getBean`**, and **Google Guice's `@Provides`** are factories at the DI-container layer; **React's `useContext` + provider** is the same shape on the frontend.
- **`socket.socket(AF_INET, SOCK_STREAM)`**, **`open(path, mode)`**, **`urllib3.PoolManager().request()`** are factories that hide whether you get an IPv4 socket, a file vs a pipe, or a pooled vs new connection — the GoF book (1994) named the pattern but `iostream` and `printf` had been doing it since the 1970s.

## intuition
Direct `new ConcreteClass(...)` calls scattered across a codebase cement the implementation choice at every call site. The moment you want to switch the JSON library, the database driver, or the logger, you face a global sweep across hundreds of files — and any one missed call leaks the old implementation forever. The Factory pattern observes: object **creation** is a separate concern from object **use**, and centralizing creation in one place lets you change implementations, add caching, validate inputs, or pick environment-specific variants without touching call sites.

There are two flavors. **Factory Method** centralizes the choice of one product family — `LoggerFactory.create(env)` returns a `ConsoleLogger` in dev and a `FileLogger` in prod, but always returns the `Logger` interface. **Abstract Factory** goes one step further: it returns a **family of related products** that must belong together — `MacOSWidgetFactory` returns Mac-style buttons, scrollbars, and menus; `WindowsWidgetFactory` returns the Windows equivalents, and the application logic never mixes them. The pizzeria analogy is useful: `nyFactory.makePizza("cheese")` returns a New York slice; `chicagoFactory.makePizza("cheese")` returns deep dish. The caller's code is identical; the factory determines the dialect.

The deeper benefit is **inversion of dependencies** (the "D" in SOLID). Without a factory, high-level business logic depends on concrete low-level classes (logger, parser, driver), making it untestable and platform-locked. With a factory injected at the boundary, the high-level code depends only on interfaces, and the concrete implementation is chosen at configuration time — DI containers (Spring, Guice, Dagger) automate this. Factories also enable constructor privacy: hide the constructor, expose only the factory, and you can return cached instances, pooled instances, or `null` for invalid inputs without breaking callers.

## visualization
Picture a `Logger` interface with two implementations, `ConsoleLogger` and `FileLogger`. A `LoggerFactory.create(env)` method returns a `Logger`: console for `dev`, file for `prod`. Callers receive the interface, call `log.info("started")`, and never see the concrete type. To add a `CloudLogger`, you add one class and one branch inside the factory — every caller automatically benefits.

## bruteForce
Without a factory, every consumer does its own `new ConsoleLogger()` or `new FileLogger()`, each repeating the environment check. A migration to a new logger means a global find-and-replace; a misspelling silently leaves one caller behind. Configuration scatters; testing requires monkey-patching; subclasses sneak into call sites that should not know they exist.

## optimal
The right structure is **a product interface, package-private (or convention-private) concrete classes, and a single creation method** that picks the concrete type based on input, configuration, or environment. Prefer a **registry-of-suppliers** map over a giant `switch` — the registry pattern is open for extension (drop a new entry to support a new product) without modifying the factory itself, satisfying the Open/Closed Principle.

```python
from abc import ABC, abstractmethod
from typing import Callable

class Logger(ABC):
    @abstractmethod
    def log(self, msg: str) -> None: ...

class ConsoleLogger(Logger):
    def log(self, msg): print(f"console: {msg}")

class FileLogger(Logger):
    def __init__(self, path: str): self.path = path
    def log(self, msg):
        with open(self.path, "a") as f: f.write(msg + "\n")

class CloudLogger(Logger):
    def __init__(self, endpoint: str): self.endpoint = endpoint
    def log(self, msg): _post(self.endpoint, msg)

class LoggerFactory:
    _registry: dict[str, Callable[[], Logger]] = {
        "dev":   lambda: ConsoleLogger(),
        "prod":  lambda: FileLogger("/var/log/app.log"),
        "cloud": lambda: CloudLogger("https://logs.example.com/ingest"),
    }
    @classmethod
    def register(cls, env: str, supplier: Callable[[], Logger]) -> None:
        cls._registry[env] = supplier            # open for extension
    @classmethod
    def create(cls, env: str) -> Logger:
        supplier = cls._registry.get(env)
        if not supplier:
            raise ValueError(f"unknown env: {env}")
        return supplier()
```

Why this is right: the registry replaces the brittle `switch` (which grows quadratically in code review pain), it makes every product implementation discoverable in one place, and it composes naturally with DI containers — Spring's `@Bean` registration, Guice's `bind().toProvider()`, and Dagger's `@Provides` are all registry-of-suppliers under the hood. For **Abstract Factory** (family of related products), promote the registry value to a class implementing `create_chair()`, `create_sofa()`, `create_table()`, and select one factory instance based on theme.

**When to use what**: For one implementation, plain `new` is fine — do not over-engineer. For two implementations with a flag-based choice, a static factory method (`Logger.forEnv("prod")`) is enough. For many implementations or runtime-extensible plugins, use the registry pattern. For DI-heavy frameworks (Spring, Angular), let the container be your factory and inject the interface directly — manual factories duplicate work.

**Production cautions**: hidden global state in factories (a static cache) causes cross-test contamination; make caches explicit or use a fresh container per test. Returning concrete types defeats the abstraction — always return the interface. Factories that allocate expensive resources (DB connections, threads) should pool them; `ForkJoinPool.commonPool()` is exactly this — a factory returning a shared pooled instance.

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
