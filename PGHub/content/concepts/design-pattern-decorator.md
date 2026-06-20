---
slug: design-pattern-decorator
module: foundations-patterns
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
- **Java I/O** is the canonical example: `new BufferedReader(new InputStreamReader(new GZIPInputStream(new FileInputStream("x.gz"))))` stacks buffering, charset decoding, and decompression around a raw file — each layer implements `InputStream`/`Reader` and adds one concern.
- **Express, Koa, Fastify, ASP.NET MVC, Django**, and **Rails Rack middleware** are Decorator at the request/response level — each middleware wraps the next, adding auth, logging, compression, or CORS.
- **Python's `@functools.lru_cache`, `@retry`, `@contextmanager`** and **Spring AOP `@Transactional`, `@Cacheable`** decorate methods to add caching, retries, or transaction boundaries without touching method bodies.
- **gRPC interceptors**, **HTTP client middlewares (Axios interceptors, Go's `RoundTripper` chain, Rust's tower `Layer`)**, and **Envoy filters** are Decorator at the network layer; the GoF book (1994) defined the structural pattern that every one of these systems instantiates.

## intuition
Inheritance is the wrong tool for "I want to combine these orthogonal behaviors." If you have a `Service` and want to add logging, caching, retries, and rate limiting, inheritance forces a class per combination: `LoggedService`, `CachedService`, `LoggedCachedService`, `RetryingLoggedCachedService`, and so on. Four orthogonal behaviors mean 2^4 = 16 subclasses to cover every order. Worse, inheritance fixes composition at compile time — you cannot reorder logging and caching without writing a different class.

The Decorator pattern observes: each cross-cutting behavior is a wrapper around the next layer, sharing the same interface as the thing it wraps. Logging takes a `Service`, exposes a `Service`, and logs around each call. Caching takes a `Service`, exposes a `Service`, and consults a cache before delegating. Retries take a `Service`, exposes a `Service`, and retries on failure. Because every wrapper has the same shape as the wrapped object, you can stack them in any order at runtime: `new Logging(new Caching(new Retries(new RealService())))` or any permutation. The client only sees `Service`; the chain is invisible.

The mental image is a coffee order. Espresso, then steamed milk, then caramel syrup, then a lid. Each step wraps the previous; the final drink still answers "what are you?" with "a coffee," but every wrap contributed cost and flavor. You can reorder (caramel first, then milk) and the customer still gets "a coffee." This is exactly how the wrapping chain composes — each layer is transparent to the outside, decisive on the inside. Composition replaces inheritance; the explosion of subclasses collapses to N + 1 classes (one per concern, plus the base).

## visualization
Imagine `interface DataSource { read(); write(data); }` and a `FileDataSource` implementation. Three decorators — `EncryptionDecorator`, `CompressionDecorator`, `LoggingDecorator` — each implement the same interface, hold a `DataSource` field, and forward calls while adding their own work. `new LoggingDecorator(new EncryptionDecorator(new CompressionDecorator(new FileDataSource("a.txt"))))` produces a chain where every `read()` flows through log, encrypt, compress, file — and back.

## bruteForce
Subclass per combination: `LoggedFileDataSource`, `EncryptedLoggedFileDataSource`, `CompressedEncryptedLoggedFileDataSource`. Adding a fourth behavior doubles the class count. Inheritance also locks composition order at compile time — you cannot reorder logging and encryption without writing two more classes. The Decorator pattern fixes both problems at once.

## optimal
The right structure: **a base interface, one core implementation, and N wrappers that each implement the interface and hold an instance of it**. Each wrapper delegates the actual work to its inner reference and adds its own slice of behavior before, after, or around the delegation. Composition happens at the **composition root** — the single place in your application (usually `main()`, the DI container config, or `App.tsx`) where the chain is built.

```python
from abc import ABC, abstractmethod
import time, hashlib, logging

class Service(ABC):
    @abstractmethod
    def fetch(self, key: str) -> str: ...

class RealService(Service):
    def fetch(self, key): return _slow_remote_call(key)

class LoggingDecorator(Service):
    def __init__(self, inner: Service): self.inner = inner
    def fetch(self, key):
        t0 = time.time()
        try:
            return self.inner.fetch(key)
        finally:
            logging.info("fetch", extra={"key": key, "ms": (time.time()-t0)*1000})

class CachingDecorator(Service):
    def __init__(self, inner: Service, ttl: int = 60):
        self.inner = inner; self.ttl = ttl; self.cache = {}
    def fetch(self, key):
        h = hashlib.sha256(key.encode()).hexdigest()
        if h in self.cache and time.time() - self.cache[h][1] < self.ttl:
            return self.cache[h][0]
        val = self.inner.fetch(key)
        self.cache[h] = (val, time.time())
        return val

class RetryDecorator(Service):
    def __init__(self, inner: Service, attempts: int = 3):
        self.inner = inner; self.attempts = attempts
    def fetch(self, key):
        for i in range(self.attempts):
            try: return self.inner.fetch(key)
            except Exception:
                if i == self.attempts - 1: raise
                time.sleep(0.1 * (2 ** i))

# Composition root — order matters:
svc = LoggingDecorator(CachingDecorator(RetryDecorator(RealService())))
```

Why this is right: it satisfies the **Open/Closed Principle** (open for extension via new decorators, closed for modification of existing ones), avoids the **inheritance explosion** (N + 1 classes vs 2^N subclasses), and lets you **reorder behaviors at runtime** without recompiling. The order matters semantically — cache around retry means a cached value is served without retries (good); retry around cache means cache misses trigger retries (also reasonable but different). Document the intended order at the composition root.

Two production cautions: **deep chains crush stack traces** (limit to 4-5 layers and name them clearly), and **`instanceof` / equality checks break transparency** (callers must use the interface, never test for the concrete inner type). Spring AOP and gRPC interceptors both ship explicit support for ordered decorator chains — when you need framework-level guarantees, prefer those over hand-rolled wrapping.

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
