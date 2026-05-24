---
slug: design-pattern-flyweight
module: foundations
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
Games, text renderers, particle systems, and analytics dashboards sometimes need millions of small objects. Naive instantiation blows the memory budget. Most of those objects share characteristics — the same glyph repeats across a page, the same tree species appears across a forest. Flyweight exploits that redundancy without changing the conceptual model.

## intuition
Printing a book does not allocate a fresh letter "e" for each occurrence. There is one die per glyph in the typesetter's tray, used wherever needed. The position of each letter on the page is the extrinsic state, kept on the page; the shape of the letter is intrinsic, kept on the die.

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
