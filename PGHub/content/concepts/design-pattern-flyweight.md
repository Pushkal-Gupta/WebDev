---
slug: design-pattern-flyweight
module: foundations-patterns
title: Flyweight Pattern
subtitle: Share intrinsic state across many instances to save memory
difficulty: Advanced
position: 408
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - https://refactoring.guru/design-patterns/flyweight
  - https://martinfowler.com/eaaCatalog/valueObject.html
  - https://github.com/DovAmir/awesome-design-patterns
status: published
---

## intro
Flyweight reduces memory footprint by sharing common state across many similar objects. Each object is split into intrinsic state (shared, immutable, hashable) and extrinsic state (unique per use, passed in by callers). A factory caches one instance per distinct intrinsic value, so millions of usages may collapse to a handful of actual objects.

## whyItMatters
- **Java String interning (`String.intern()`)**: the JVM maintains a global table so duplicate literals share one object — a 10MB JSON dump with 100k repeated field names allocates the names once.
- **Python integer caching**: CPython interns small ints (`-5` to `256`) so `a = 100; b = 100; a is b` is true. Same trick for short interned strings.
- **Boolean.TRUE / Boolean.FALSE in Java, Integer.valueOf(0..127)**: pre-allocated flyweights that prevent allocator churn for hot values.
- **Glyph caches in font renderers (FreeType, CoreText, DirectWrite)**: rasterised glyph bitmaps cached by (font, size, codepoint); one cache entry serves every appearance of the letter across millions of UI strings.
- **Game-engine particle and tile systems (Unreal Niagara, Minecraft block instancing)**: thousands of identical particles share one mesh+material; only position/velocity is per-instance — without this, a single explosion would blow the GPU memory budget.
- **Database query plans (Postgres, MySQL)**: parsed-and-planned PreparedStatements cached by SQL text so a million executions of `SELECT * FROM users WHERE id=?` share one plan object.

The memory math: 100k particles at 256 bytes each = 25MB; flyweighted to 50 shared types at 256 bytes plus 100k × 16-byte references = 13KB + 1.6MB = ~1.6MB. A 15× reduction with zero behaviour change. The pattern only pays off when intrinsic repetition is high — measure before deploying.

## intuition
The pattern exists for one situation: you have so many small objects that their *count* dominates memory cost, but most of those objects carry duplicate state. Naive object-orientation allocates a new instance per use, even when 99% of the bytes are identical to existing instances. A forest of one million trees, each with the same species, color, and texture (~80 bytes of shared state) plus a unique (x, y) position (16 bytes), naively costs 96MB. The duplicate-shared portion is the waste — 80MB of identical bytes scattered across the heap.

Flyweight's move is to split each object into two zones with sharply different lifetimes. Intrinsic state is immutable, hashable, and identical across many uses — the "shape" of the object. Extrinsic state is unique per use, the "position" passed in by the caller. Intrinsic state is interned through a factory: equal intrinsic values return the same in-memory object. Extrinsic state stays where it naturally lives (on the caller, on the page, in the simulation grid). The object you thought of as one thing is actually two collaborating pieces.

Three properties make the pattern safe. First, intrinsic state must be immutable — if any shared instance were mutated, every user of it would silently observe the change. Second, intrinsic state must implement value-equality (and value-hashing); the factory needs to recognise "I've seen this combination before" by content, not by reference. Third, the split between intrinsic and extrinsic must respect the access pattern — if extrinsic state is read on a hot path, the indirection becomes a cache-miss penalty that can erase the memory win.

The metaphor that nails the pattern is movable-type printing. A typesetter's tray holds one die per glyph — one for 'e', one for 'a', one for 'space'. The position of each letter on the page is the extrinsic state, owned by the page. The shape of each letter is intrinsic, owned by the die. The book never allocates a fresh 'e' per occurrence; it points at the shared die and remembers where on the page that occurrence sits. Centuries of printing exploit the same observation video-game engines exploit today: repeated visual elements share their pixels, only their coordinates differ.

Flyweight is *not* a cache. A cache speeds up repeated work by storing results; the cache can evict and recompute without breaking correctness. Flyweight reduces memory by guaranteeing at most one instance per value; if the factory ever returned a new instance for a known value, identity-comparison code (`a is b` in Python, `==` on references in Java) would break. The two patterns look similar but serve different goals and have different correctness contracts.

## optimal
Identify which fields are shared and which are unique. Move shared fields into an immutable Flyweight class. Create a FlyweightFactory that interns instances by their intrinsic state — equal inputs return the same object. Callers store the flyweight reference plus their own extrinsic state.

```python
from dataclasses import dataclass
from functools import lru_cache

@dataclass(frozen=True)              # immutable + hashable; enables interning
class TreeType:
    name: str
    color: tuple                     # tuple, not list, because hashable
    texture: str
    mesh_bytes: bytes                # the heavy shared payload

class TreeFactory:
    _cache: dict = {}

    @classmethod
    def get(cls, name, color, texture, mesh_bytes):
        key = (name, color, texture)              # hash only the lightweight identity
        existing = cls._cache.get(key)
        if existing is not None:
            return existing
        flyweight = TreeType(name, color, texture, mesh_bytes)
        cls._cache[key] = flyweight
        return flyweight

@dataclass
class Tree:                          # 16 bytes per instance instead of 96
    x: int
    y: int
    type: TreeType                   # reference, not a copy

# A forest of 1,000,000 trees with 30 distinct species costs ~16MB instead of ~96MB
forest = [
    Tree(x, y, TreeFactory.get("oak", (40, 120, 30), "bark.png", LOADED_MESH))
    for x in range(1000) for y in range(1000)
]
```

Why optimal: factory lookup is O(1) amortised via hashing, and storage drops from O(N·S) to O(K·I + N·E) where N is total uses, S is per-object size, K is distinct flyweights, I is intrinsic size, E is extrinsic size. When K is much smaller than N — the only situation where the pattern is worth deploying — the space saving is dramatic and the time cost is one extra hashmap lookup per construction (zero per use).

Implementation discipline that distinguishes good flyweights from leaky abstractions: (1) freeze the intrinsic state — Python's `@dataclass(frozen=True)`, Java's `final` fields plus no setters, C++ `const` members — accidental mutation poisons every user; (2) the factory's cache must be bounded in long-lived processes (`weakref.WeakValueDictionary` in Python, `WeakHashMap` in Java) so dead flyweights can be collected; (3) align `__hash__` and `__eq__` exactly with the intrinsic state — drift breaks interning silently and you end up with multiple "equal" flyweights, defeating the purpose; (4) for thread safety, either intern only at startup (read-mostly factory) or guard the factory with a lock and accept the contention; double-checked locking is the standard idiom in Java; (5) measure before deploying — if intrinsic uniqueness is high (low K/N ratio), the pattern adds indirection without saving memory and you should not use it.

## visualization
Picture a wall of millions of trees, each labeled with a species and a position. Behind the wall, a pool holds only the distinct species — maybe twenty entries. Each tree on the wall points into the pool for its appearance data and carries its own position separately. Visual fidelity stays the same; memory drops by orders of magnitude.

## bruteForce
Every object carries all its fields. A million particles each store their texture, color, mass, and position individually. Memory equals object count times object size. Cache locality suffers because identical-looking objects scatter across the heap.

## optimal
Identify which fields are shared and which are unique. Move shared fields into a Flyweight class that is immutable. Create a FlyweightFactory that interns instances by their intrinsic state — equal inputs return the same object. Callers store only the flyweight reference plus their own extrinsic state. Hash maps keyed by intrinsic state ensure O(1) lookup.

## complexity
Time per lookup is O(1) amortized via hashing. Space drops from O(N × S) to O(K × I + N × E), where N is the count, S is per-object size, K is the number of distinct flyweights, I is intrinsic size, and E is extrinsic size. When K is much smaller than N, savings are dramatic.

## pitfalls
Sharing only pays off when intrinsic state actually repeats — measure first. Mutable flyweights destroy the invariant. Forgetting to clear the cache leaks memory in long-lived apps. Equality and hashing must align with the intrinsic state exactly. Thread safety needs explicit attention since flyweights are shared.

## interviewTips
String interning in Java and Python, glyph caches in text engines, Boolean.TRUE in Java, and ECS architectures in game engines are real flyweights. Distinguish from caching: caching speeds up repeated work; Flyweight reduces memory by ensuring at most one instance per value. Mention the read-only invariant — it is what makes sharing safe.

## code.python
```python
class TreeType:
    def __init__(self, name, color, texture):
        self.name, self.color, self.texture = name, color, texture

class TreeFactory:
    _cache = {}

    @classmethod
    def get(cls, name, color, texture):
        key = (name, color, texture)
        if key not in cls._cache:
            cls._cache[key] = TreeType(name, color, texture)
        return cls._cache[key]

class Tree:
    def __init__(self, x, y, type_):
        self.x, self.y, self.type = x, y, type_

forest = [Tree(x, y, TreeFactory.get("oak", "green", "bark.png")) for x in range(100) for y in range(100)]
```

## code.javascript
```javascript
class TreeType {
  constructor(name, color, texture) { this.name = name; this.color = color; this.texture = texture; }
}

const cache = new Map();
function getType(name, color, texture) {
  const key = `${name}|${color}|${texture}`;
  if (!cache.has(key)) cache.set(key, new TreeType(name, color, texture));
  return cache.get(key);
}

class Tree {
  constructor(x, y, type) { this.x = x; this.y = y; this.type = type; }
}
```

## code.java
```java
import java.util.HashMap;
import java.util.Map;

class TreeType {
    final String name, color, texture;
    TreeType(String n, String c, String t) { name = n; color = c; texture = t; }
}

class TreeFactory {
    private static final Map<String, TreeType> CACHE = new HashMap<>();
    static TreeType get(String name, String color, String texture) {
        String key = name + "|" + color + "|" + texture;
        return CACHE.computeIfAbsent(key, k -> new TreeType(name, color, texture));
    }
}

class Tree {
    final int x, y;
    final TreeType type;
    Tree(int x, int y, TreeType t) { this.x = x; this.y = y; this.type = t; }
}
```

## code.cpp
```cpp
#include <string>
#include <unordered_map>
#include <memory>

struct TreeType {
    std::string name, color, texture;
    TreeType(std::string n, std::string c, std::string t) : name(std::move(n)), color(std::move(c)), texture(std::move(t)) {}
};

class TreeFactory {
    static std::unordered_map<std::string, std::shared_ptr<TreeType>> cache;
public:
    static std::shared_ptr<TreeType> get(const std::string& name, const std::string& color, const std::string& texture) {
        std::string key = name + "|" + color + "|" + texture;
        auto it = cache.find(key);
        if (it != cache.end()) return it->second;
        auto t = std::make_shared<TreeType>(name, color, texture);
        cache[key] = t;
        return t;
    }
};

std::unordered_map<std::string, std::shared_ptr<TreeType>> TreeFactory::cache;

struct Tree {
    int x, y;
    std::shared_ptr<TreeType> type;
};
```
