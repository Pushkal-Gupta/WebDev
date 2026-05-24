---
slug: design-pattern-decorator
module: foundations
title: Decorator Pattern
subtitle: Wrap an object in another that shares its interface — add behavior at runtime without touching the original class.
difficulty: Intermediate
position: 95
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Decorator — Refactoring Guru"
    url: "https://refactoring.guru/design-patterns/decorator"
    type: book
  - title: "Prefer Composition Over Inheritance — Martin Fowler"
    url: "https://martinfowler.com/bliki/CompositionOverInheritance.html"
    type: blog
  - title: "DovAmir/awesome-design-patterns — Decorator"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
The Decorator pattern attaches new responsibilities to an object dynamically by wrapping it in another object that implements the same interface. The wrapper delegates to the inner object and adds behavior before, after, or around the call. Stacks of decorators compose like Lego — logging around caching around rate limiting around the real service — without subclass explosion.

## whyItMatters
Inheritance forces every combination of behaviors into its own subclass: `CachedLoggedService`, `LoggedCachedService`, `RateLimitedLoggedService` — quadratic blowup. Decorator collapses that to one base implementation plus N independent wrappers you can stack in any order. Java I/O streams (`BufferedReader(new FileReader(...))`), Python's `@functools.lru_cache`, Express/Koa middleware, ASP.NET filters, and Spring AOP are all instances of this pattern.

## intuition
Think of a coffee order: espresso, then milk, then caramel, then a lid. Each "step" wraps the previous one; the final drink still answers "what are you?" with "a coffee," but every wrap added cost and flavor. In code, each decorator wraps a service that has the same interface, delegates to it, and contributes its own slice of behavior.

## visualization
Imagine `interface DataSource { read(); write(data); }` and a `FileDataSource` implementation. Three decorators — `EncryptionDecorator`, `CompressionDecorator`, `LoggingDecorator` — each implement the same interface, hold a `DataSource` field, and forward calls while adding their own work. `new LoggingDecorator(new EncryptionDecorator(new CompressionDecorator(new FileDataSource("a.txt"))))` produces a chain where every `read()` flows through log, encrypt, compress, file — and back.

## bruteForce
Subclass per combination: `LoggedFileDataSource`, `EncryptedLoggedFileDataSource`, `CompressedEncryptedLoggedFileDataSource`. Adding a fourth behavior doubles the class count. Inheritance also locks composition order at compile time — you cannot reorder logging and encryption without writing two more classes. The Decorator pattern fixes both problems at once.

## optimal
Define a base interface that every wrapped service implements. Implement the core service once. For each cross-cutting concern (logging, caching, retries, rate limiting, encryption), write a class that implements the same interface and accepts an instance of it via constructor. The class delegates the real work to its inner reference and adds its own behavior. Compose decorators at the composition root in whatever order makes sense; the client sees only the outer wrapper and never knows the chain underneath.

## complexity
time: O(d) per call where d is the depth of the decorator chain
space: O(d) for the wrapper objects (typically constant; d is small)
notes: Each wrap adds one method call to the dispatch chain — negligible at typical depths. The wins are structural composability and Open/Closed conformance, not raw speed.

## pitfalls
- Mismatched interface: a decorator that adds a method the inner type doesn't have changes the contract — clients can't treat the chain transparently.
- Equality / `instanceof` checks downstream: callers that ask "are you exactly a `FileDataSource`?" break the moment you wrap one. Use the interface only.
- Order-sensitive stacks: cache around encrypt vs. encrypt around cache produce wildly different results. Document the intended order at the composition root.
- Deep chains kill stack traces: keep decorator depth manageable and meaningful.
- Don't confuse with Python's `@decorator` syntactic sugar — same idea applied to functions, but the GoF pattern is about objects.

## interviewTips
- Mention Java I/O (`BufferedReader(new InputStreamReader(new FileInputStream(...)))`) as the canonical example.
- Contrast with Proxy: Proxy controls access; Decorator adds behavior. Same structure, different intent.
- Connect to middleware in web frameworks — interviewers love when you bridge a GoF pattern to something real.

## code.python
```python
from abc import ABC, abstractmethod

class DataSource(ABC):
    @abstractmethod
    def read(self) -> str: ...
    @abstractmethod
    def write(self, data: str) -> None: ...

class InMemoryDataSource(DataSource):
    def __init__(self): self.buf = ""
    def read(self): return self.buf
    def write(self, data): self.buf = data

class LoggingDecorator(DataSource):
    def __init__(self, wrapped: DataSource): self._w = wrapped
    def read(self):
        print("read called"); return self._w.read()
    def write(self, data):
        print(f"write called: {data[:20]}"); self._w.write(data)

class UpperDecorator(DataSource):
    def __init__(self, wrapped: DataSource): self._w = wrapped
    def read(self): return self._w.read().upper()
    def write(self, data): self._w.write(data)

src = LoggingDecorator(UpperDecorator(InMemoryDataSource()))
src.write("hello")
print(src.read())
```

## code.javascript
```javascript
class InMemoryDataSource {
  constructor() { this.buf = ""; }
  read() { return this.buf; }
  write(data) { this.buf = data; }
}

class LoggingDecorator {
  constructor(wrapped) { this.w = wrapped; }
  read() { console.log("read"); return this.w.read(); }
  write(data) { console.log("write:", data); this.w.write(data); }
}

class UpperDecorator {
  constructor(wrapped) { this.w = wrapped; }
  read() { return this.w.read().toUpperCase(); }
  write(data) { this.w.write(data); }
}

const src = new LoggingDecorator(new UpperDecorator(new InMemoryDataSource()));
src.write("hello");
console.log(src.read());
```

## code.java
```java
interface DataSource { String read(); void write(String data); }

class InMemoryDataSource implements DataSource {
    private String buf = "";
    public String read() { return buf; }
    public void write(String data) { this.buf = data; }
}

class LoggingDecorator implements DataSource {
    private final DataSource w;
    public LoggingDecorator(DataSource w) { this.w = w; }
    public String read() { System.out.println("read"); return w.read(); }
    public void write(String data) { System.out.println("write:" + data); w.write(data); }
}

class UpperDecorator implements DataSource {
    private final DataSource w;
    public UpperDecorator(DataSource w) { this.w = w; }
    public String read() { return w.read().toUpperCase(); }
    public void write(String data) { w.write(data); }
}
```

## code.cpp
```cpp
#include <iostream>
#include <memory>
#include <string>
#include <algorithm>

struct DataSource {
    virtual std::string read() = 0;
    virtual void write(const std::string&) = 0;
    virtual ~DataSource() = default;
};

class InMemoryDataSource : public DataSource {
    std::string buf;
public:
    std::string read() override { return buf; }
    void write(const std::string& d) override { buf = d; }
};

class LoggingDecorator : public DataSource {
    std::unique_ptr<DataSource> w;
public:
    explicit LoggingDecorator(std::unique_ptr<DataSource> x) : w(std::move(x)) {}
    std::string read() override { std::cout << "read\n"; return w->read(); }
    void write(const std::string& d) override { std::cout << "write:" << d << "\n"; w->write(d); }
};
```
