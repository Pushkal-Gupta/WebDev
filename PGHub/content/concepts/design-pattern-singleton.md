---
slug: design-pattern-singleton
module: foundations-patterns
title: Singleton Pattern
subtitle: Guarantee one instance of a class with a global access point — useful, controversial, and notoriously tricky under multithreading.
difficulty: Intermediate
position: 97
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Singleton — Refactoring Guru"
    url: "https://refactoring.guru/design-patterns/singleton"
    type: book
  - title: "Singletons and the Anti-Pattern Debate — Martin Fowler"
    url: "https://martinfowler.com/bliki/InversionOfControl.html"
    type: blog
  - title: "DovAmir/awesome-design-patterns — Singleton"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
The Singleton pattern ensures a class has exactly one instance and provides a global point of access to it. It is the most well-known and most over-used pattern in the GoF catalog. Legitimate uses exist — a process-wide configuration registry, a connection pool, a logging hub — but most singletons in practice are just disguised global state that ruins testability. Use sparingly and with a clear thread-safety contract.

## whyItMatters
Some resources genuinely should not exist twice: a process-wide thread pool, a hardware driver handle, a single ID generator. Without Singleton you risk two pools fighting for the same hardware, two ID generators producing collisions, or repeated expensive initialization. With Singleton the type itself enforces the constraint and every caller gets the same instance. The danger is that the global access path hides dependencies and makes unit testing painful — which is why most modern code prefers a single instance configured by a DI container.

## intuition
Think of a country's central bank. By law there is exactly one; every commercial bank refers to the same authority. Anyone needing it asks the system for "the central bank" rather than constructing one. The single instance is created lazily on first request, lives forever, and serves every caller identically. Singletons in code follow the same shape: a `getInstance()` (or equivalent) that lazily builds and returns the lone instance.

The reframe that makes Singleton concrete is two mechanisms working together. First, you *seal off the normal door* — the constructor is made private so no caller can `new` the class directly. Second, you *open one controlled door* — a static accessor that either builds the instance the very first time or hands back the one it already built. The private constructor is the enforcement; the static field is the memory. Miss either half and you no longer have a singleton, just a convention people can break.

Walk a concrete micro-example. A `Logger` writes to one file. The first line of the program calls `Logger.getInstance()`; the static field `instance` is `null`, so the accessor opens `app.log`, constructs the object, stores the reference, and returns it. Twenty modules later, a request handler calls `Logger.getInstance()` again; this time the field is non-null, so no file is reopened — the *same* object with the *same* open file handle comes back. Every module appends to one file in order, exactly the guarantee you wanted. Now imagine two web requests hit `getInstance()` at the same microsecond on the very first call: both threads read `instance == null`, both open the file, both construct a `Logger`. You now have two file handles racing on the same path and one of the two objects silently leaks — this is the single most important failure the pattern has to defend against.

What's actually happening is that you are trading the language's normal "one object per `new`" rule for "one object per class, forever." The static field is process-global lifetime, the private constructor is the lock on the front door, and the accessor is the checkpoint that decides *build-or-return*. Every subtlety in the rest of this lesson — thread safety, serialization, reflection — is just some way that build-or-return checkpoint can be tricked into building twice.

## visualization
An access trace of `Config.getInstance()` under concurrency. Each row is one call site. Watch the `inst?` check drive build-or-return, and see rows 3-4 show the race that unsynchronized lazy init allows — two threads both read `null` and both construct, so `ref` differs:

```
CALL#  CALL SITE            THREAD  inst BEFORE  ACTION            inst AFTER   RETURNED REF
-----  -------------------  ------  -----------  ----------------  -----------  ------------
1      main() startup       T-main  null         build Config@A    Config@A     @A
2      loadDefaults()       T-main  Config@A     return existing   Config@A     @A
3      request handler      T-1     null*        build Config@B    Config@B     @B   <- RACE
4      request handler      T-2     null*        build Config@C    Config@C     @C   <- RACE
       (* both threads read null before either stored -> double init, @B and @C leak)

--- with eager init OR double-checked locking (volatile) ---
1      class load           T-JVM   -            build Config@A    Config@A     @A
2      any thread, any time T-*     Config@A     return existing   Config@A     @A
3      any thread, any time T-*     Config@A     return existing   Config@A     @A   (single ref, no race)
```

## bruteForce
The naive single-threaded version uses a static field with lazy init:
```python
class Config:
    _inst = None
    @classmethod
    def get(cls):
        if cls._inst is None:
            cls._inst = cls()
        return cls._inst
```
Works for single-threaded code. Under concurrency two threads can both see `_inst is None` and both call the constructor — silent double-initialization. This is the bug every singleton interview probes.

## optimal
For thread safety prefer one of these idioms:
- **Eager init** — assign the static field at class load time. Trivially safe, no locks. Cost: instance built whether or not it is used.
- **Double-checked locking with a volatile/atomic field** — lock only the first time. Requires a memory model that guarantees publication; in Java the field must be `volatile`.
- **Holder class idiom (Java)** — a nested static class is loaded lazily by the classloader, which guarantees one-shot initialization without explicit locks.
- **Language primitives** — Python module-level objects, Kotlin `object`, JS module-scope constants — all give you a process-wide singleton with zero ceremony.

The invariant every safe idiom protects is *build-exactly-once, publish-safely*. Two distinct hazards hide behind that phrase. The obvious one is the **race** — two threads passing the `null` check together, as rows 3-4 of the trace show. Guarding the whole accessor with a lock fixes the race but taxes every subsequent read with an uncontended mutex; double-checked locking narrows the lock to the first call by re-testing inside the critical section. The subtler hazard is **safe publication**: even after one thread constructs the instance, another thread can observe a *partially constructed* object because the constructor's writes and the field write were reordered. This is why the field must be `volatile` in Java (or an atomic in C++) — `volatile` inserts the memory barrier that guarantees a reader who sees a non-null reference also sees a fully initialized object. Drop the `volatile` and double-checked locking is not merely slower, it is *wrong*.

Step by step, choose the idiom by cost: if construction is cheap and always needed, use **eager init** and skip the whole problem. If construction is expensive or may never happen, use the **holder idiom** in Java (the classloader gives you lazy, one-shot, lock-free init for free) or a plain module-level object in Python/JS where the runtime already guarantees single evaluation. Reach for hand-written double-checked locking only when the language forces you to and lazy init is mandatory.

**When to use** a singleton at all: a genuinely process-unique resource — one log sink, one connection pool, one hardware handle. **When to avoid**: any state you want to swap in tests, vary per request, or reason about locally. For those, treat the type as one-instance-per-container rather than global — inject the instance through DI so tests can substitute a fake and the dependency stays visible in the constructor signature.

## complexity
time: O(1) per `getInstance` after initialization; first call pays construction cost
space: O(1) per process for the instance plus a few bytes for the static field
notes: Lock-based variants pay an uncontended mutex acquisition per call unless double-checked locking is used. The real "cost" is design: hidden coupling to global state across the program.

## pitfalls
- Race condition on first `getInstance` without proper synchronization or eager init.
- Serialization / deserialization in Java can create a second instance unless `readResolve` is implemented.
- Reflection can break private constructors — enums sidestep this in Java.
- Cloning, multiple classloaders, or subclassing all sneak around the one-instance guarantee.
- Singletons make unit tests order-dependent because state survives between tests. Provide a `reset()` for tests or inject via DI.
- Over-use: treating Singleton as the way to share *anything* between classes leads to global-state hell. If you need shared state, ask whether DI would express it better.

## interviewTips
- Be ready to write the double-checked locking pattern correctly — the `volatile` keyword in Java is the trap.
- Mention Joshua Bloch's recommendation: in Java, the single-element enum is the safest singleton.
- Discuss why DI is preferred today: "I'd register the type with a single-instance scope in the container rather than expose a static getInstance."
- Have a real legitimate example ready (logger, config, connection pool) so you don't sound like you're parroting the pattern.

## code.python
```python
class Config:
    _inst = None
    def __new__(cls):
        if cls._inst is None:
            cls._inst = super().__new__(cls)
            cls._inst.data = {}
        return cls._inst

a = Config(); a.data["x"] = 1
b = Config()
assert a is b and b.data["x"] == 1
```

## code.javascript
```javascript
class Config {
  constructor() {
    if (Config._inst) return Config._inst;
    this.data = {};
    Config._inst = this;
  }
}

const a = new Config(); a.data.x = 1;
const b = new Config();
console.assert(a === b && b.data.x === 1);
```

## code.java
```java
public final class Config {
    private static volatile Config instance;
    public java.util.Map<String,String> data = new java.util.HashMap<>();
    private Config() {}

    public static Config getInstance() {
        Config local = instance;
        if (local == null) {
            synchronized (Config.class) {
                local = instance;
                if (local == null) {
                    instance = local = new Config();
                }
            }
        }
        return local;
    }
}
```

## code.cpp
```cpp
#include <mutex>
#include <string>
#include <unordered_map>

class Config {
    std::unordered_map<std::string, std::string> data_;
    Config() = default;
public:
    Config(const Config&) = delete;
    Config& operator=(const Config&) = delete;

    static Config& instance() {
        static Config inst;
        return inst;
    }
    std::unordered_map<std::string, std::string>& data() { return data_; }
};
```
