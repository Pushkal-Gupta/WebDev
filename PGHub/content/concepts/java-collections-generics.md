---
slug: java-collections-generics
module: java-language
title: Collections and Generics
subtitle: Stop reinventing resizable arrays and lookup tables — the Collections framework hands you List, Set, and Map, and generics stamp them so only the right type gets in.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 13
prereqs: [java-classes-objects]
relatedProblems: []
references:
  - title: "The Java Tutorials — Introduction to Collections"
    url: "https://docs.oracle.com/javase/tutorial/collections/intro/index.html"
    type: docs
  - title: "The Java Tutorials — The Map Interface"
    url: "https://docs.oracle.com/javase/tutorial/collections/interfaces/map.html"
    type: docs
  - title: "The Java Tutorials — Generic Types"
    url: "https://docs.oracle.com/javase/tutorial/java/generics/types.html"
    type: docs
  - title: "Baeldung — Java Collections Guide"
    url: "https://www.baeldung.com/java-collections"
    type: article
  - title: "Baeldung — A Guide to Java HashMap"
    url: "https://www.baeldung.com/java-hashmap"
    type: article
status: published
---

## intro
Almost every non-trivial Java program needs to hold a group of values: a list of orders, a lookup from username to account, a set of visited pages. The Collections framework is the standard library's answer — a small family of interfaces (`List`, `Set`, `Map`) with battle-tested implementations (`ArrayList`, `HashSet`, `HashMap`) that you compose instead of hand-rolling resizable arrays and hash tables. Generics — the angle-bracket `<T>` you see everywhere — stamp each container with the element type so the compiler guarantees only that type goes in and comes out. Learn the three interfaces and the `<T>` stamp and most day-to-day Java data handling clicks into place.

## whyItMatters
Choosing the right collection is one of the highest-leverage decisions in everyday code. It sets your Big-O: looking up a value in an `ArrayList` is O(n), but the same lookup in a `HashMap` is O(1) on average — the difference between a page that loads instantly and one that times out under load. Generics are what make these containers safe to use: before Java 5 you stored `Object` and cast on the way out, so a wrong type slipped through and blew up as a `ClassCastException` at runtime, deep in production. With `List<String>` the compiler rejects the mistake at build time and the cast disappears entirely. Interviewers lean on this constantly because it exposes whether you actually understand hashing, ordering, and where time goes.

## intuition
Think of the three interfaces as three physical ways to store things, each answering a different question.

A `List` is an **ordered, indexed shelf**. Items sit in the order you put them, duplicates are allowed, and every slot has a number. `ArrayList` — the one you reach for 90% of the time — backs that shelf with a single contiguous array, so `get(3)` is instant: the machine computes `base + 3 * width` and reads one memory cell in O(1). The cost is that finding a value by *content* (`contains`) means scanning slot by slot, O(n), and inserting in the middle shifts everything after it.

A `Set` is a **bag that refuses duplicates**. It answers exactly one question well: "have I seen this already?" `HashSet` does it by hashing each element to a bucket; to check membership it hashes the query and looks in just that one bucket instead of scanning everything, so `contains` is O(1) on average. Order is not preserved — the bucket a value lands in has nothing to do with when you added it.

A `Map` is a wall of **labeled pigeonholes**: each entry is a key paired with a value, and you fetch by key, not by position. `HashMap` runs the key through `hashCode()` to pick a bucket, then stores the key-value pair there; `get(key)` re-hashes and lands on the same bucket in O(1) average. It is the workhorse for any "look something up by name/id" task — word counts, caches, indexes.

Generics are the **stamp on the container's mouth**. `List<String>` tells the compiler "only `String` enters, only `String` leaves." No casts on the way out, no wrong type on the way in, and mistakes become red squiggles instead of runtime crashes. Pair generics with the habit of **programming to the interface** — `List<String> names = new ArrayList<>();` — so your code depends on the capability (a list) and you can swap the implementation (say, `LinkedList`) without touching anything else.

## visualization
```
ArrayList<String> — contiguous, indexed, O(1) get(i)
 index:   0        1        2        3
        +--------+--------+--------+--------+
        | "ann"  | "bob"  | "cy"   | "dee"  |    get(2) -> jump straight to slot 2 -> "cy"
        +--------+--------+--------+--------+

HashMap<String,Integer> — key -> hashCode() -> bucket
   put("cat", 3):  "cat".hashCode() % 4 = 1  -> bucket[1]
   put("dog", 5):  "dog".hashCode() % 4 = 3  -> bucket[3]
   put("ant", 9):  "ant".hashCode() % 4 = 1  -> bucket[1] COLLISION -> chain
     bucket:  0        1              2        3
            +----+  +----------+   +----+  +----------+
            |    |  | cat=3 -> |   |    |  | dog=5    |
            |    |  | ant=9    |   |    |  |          |
            +----+  +----------+   +----+  +----------+
   get("cat"): hash -> bucket[1] -> walk short chain -> 3   (O(1) avg)

HashSet<Integer> — add rejects a duplicate
   add(7) -> bucket[3] empty -> stored, size 1..2..3
   add(7) again -> hash -> bucket[3] -> already present -> REJECTED, size stays 3
```

## bruteForce
The naive, pre-generics instinct is to store everything as `Object` (or raw types like a bare `List`) and cast on the way out — which trades every compile-time guarantee for a runtime gamble: put a `String` where an `Integer` was expected and you get a `ClassCastException` at the cast site, far from the bug. Worse is reinventing the containers themselves: using a plain `String[]`, tracking a manual `size`, writing your own grow-and-copy when it fills, and implementing `contains` as an O(n) linear scan and a "unique keys" table as parallel arrays you search linearly. It works for ten elements and collapses at ten thousand — every membership test and lookup is O(n) instead of O(1).

## optimal
The correct model has three moves: **pick the interface by the question you're answering, program to that interface, and parameterize it with generics.**

First, choose by need. Need order and duplicates and index access? `List` (`ArrayList`). Need only uniqueness / fast membership? `Set` (`HashSet`). Need to fetch a value by a key? `Map` (`HashMap`). This single decision fixes your performance profile.

Second, know the Big-O so the choice is deliberate. `ArrayList`: `get(i)` and `add` at the end are O(1) amortized, but `contains` and middle-insert are O(n). `HashMap`: `get`, `put`, and `containsKey` are O(1) on average, degrading to O(n) only in the pathological case where everything collides into one bucket (modern `HashMap` even treeifies long chains to O(log n)). `HashSet` is a `HashMap` under the hood, so `add`/`contains` are O(1) average too.

Third, program to the interface and stamp it: `Map<String, Integer> counts = new HashMap<>();`. The variable's type is the interface (`Map`), the object is the implementation (`HashMap`), and the diamond `<>` on the right infers the type arguments. Now the compiler enforces `String` keys and `Integer` values, `get` returns an `Integer` with no cast, and you can swap in a `LinkedHashMap` (insertion-ordered) or `TreeMap` (sorted) by changing one word.

Fourth, iterate idiomatically — a for-each loop (`for (String s : list)`) for the common case, an explicit `Iterator` when you must `remove()` mid-traversal, and streams (`list.stream().filter(...).count()`) for declarative pipelines. Finally, whenever you use a **custom class as a `HashMap` key or `HashSet` element, override both `hashCode()` and `equals()`** — the hash decides the bucket and `equals` confirms the match; skip them and two "equal" objects scatter into different buckets and lookups silently miss.

## complexity
time: `ArrayList` — `get(i)`/`set(i)` O(1), `add` at end O(1) amortized, `contains`/`indexOf`/middle-insert O(n). `HashMap` and `HashSet` — `get`/`put`/`containsKey`/`add`/`contains` O(1) average, O(n) worst case when every key collides into one bucket (O(log n) once a bucket treeifies).
space: O(n) for the elements plus slack: `ArrayList` keeps a backing array with spare capacity (grows ~1.5x on resize); `HashMap`/`HashSet` keep a bucket array sized by the load factor (default 0.75), so they hold extra empty buckets to keep collisions rare.
notes: Generics are enforced only at compile time and **erased at runtime** (type erasure) — a `List<String>` and a `List<Integer>` are the same `List` class to the JVM, which is why you cannot write `new T[]` or check `x instanceof List<String>`.

## pitfalls
- **Custom key without `hashCode`/`equals`.** Use your own class as a `HashMap` key or `HashSet` element and forget to override both, and Java uses identity — two logically equal objects land in different buckets, so `get`/`contains` silently return null/false. Fix: override `hashCode()` and `equals()` together (or use a `record`, which generates both).
- **`ConcurrentModificationException`.** Calling `list.remove(x)` inside a `for (x : list)` loop mutates the collection mid-iteration and throws. Fix: iterate with an explicit `Iterator` and call `it.remove()`, or use `list.removeIf(predicate)`.
- **Autoboxing overhead.** A `List<Integer>` or `Map<Integer,Integer>` boxes every primitive `int` into a heap `Integer` object — extra memory and pointer chasing in hot loops. Fix: for large primitive-heavy workloads use primitive arrays or a specialized primitive-collections library.
- **Assuming `HashMap` preserves insertion order.** Iterating a `HashMap` yields buckets in an arbitrary, version-dependent order, not the order you inserted. Fix: use `LinkedHashMap` for insertion order or `TreeMap` for sorted-by-key order.
- **Raw types defeat generics.** Declaring `List list = new ArrayList();` (no `<>`) drops all type checking — you're back to casts and `ClassCastException`. Fix: always parameterize (`List<String>`), and treat any raw-type warning as an error.

## interviewTips
- Lead with the decision tree: "`List` for ordered/indexed with duplicates, `Set` for uniqueness, `Map` for key-value lookup" — then justify with Big-O (`ArrayList.contains` O(n) vs `HashSet.contains` O(1) average). It shows you pick data structures on purpose, not by habit.
- Be able to explain how `HashMap` works end to end: `hashCode()` picks a bucket, collisions chain (and treeify past a threshold), and `get`/`put` are O(1) average but O(n) worst case — and why overriding `hashCode`/`equals` on custom keys is mandatory.
- Know that generics are erased at runtime (type erasure) and state a concrete consequence — you cannot do `new T[]`, `instanceof List<String>`, or overload on `List<String>` vs `List<Integer>`. Interviewers use this to separate people who memorized syntax from people who understand it.

## keyTakeaways
- Pick the interface by the question: `List` (ordered, indexed, duplicates → `ArrayList`), `Set` (unique membership → `HashSet`), `Map` (fetch by key → `HashMap`). That choice sets your Big-O.
- Program to the interface and stamp it with generics: `Map<String,Integer> m = new HashMap<>();` gives compile-time type safety, no casts, and a swappable implementation.
- `HashMap`/`HashSet` are O(1) average via hashing but require correct `hashCode()`/`equals()` on custom keys; generics are compile-time only and erased at runtime.

## code.python
```python
# Python's built-ins map cleanly onto Java's List / Map / Set.
names = ["ann", "bob", "cy"]          # list  ~ ArrayList
names.append("dee")
print("index 2:", names[2], "| size:", len(names))   # O(1) index

counts = {}                            # dict  ~ HashMap
for w in "cat dog cat ant cat".split():
    counts[w] = counts.get(w, 0) + 1   # .get(k, default) ~ getOrDefault
print("counts:", counts, "| cat?", "cat" in counts)

seen = set()                           # set   ~ HashSet
for x in [7, 7, 9]:
    seen.add(x)                        # duplicate 7 is ignored
print("set:", seen, "| size:", len(seen), "| has 7:", 7 in seen)
```

## code.javascript
```javascript
// JS: Array ~ List, Map ~ HashMap (insertion-ordered), Set ~ HashSet.
const names = ["ann", "bob", "cy"];        // Array ~ ArrayList
names.push("dee");
console.log("index 2:", names[2], "| size:", names.length);

const counts = new Map();                  // Map ~ HashMap
for (const w of "cat dog cat ant cat".split(" ")) {
  counts.set(w, (counts.get(w) ?? 0) + 1); // get()??default ~ getOrDefault
}
console.log("counts:", [...counts], "| cat?", counts.has("cat"));

const seen = new Set();                     // Set ~ HashSet
for (const x of [7, 7, 9]) seen.add(x);     // duplicate 7 ignored
console.log("set:", [...seen], "| size:", seen.size, "| has 7:", seen.has(7));
```

## code.java
```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Main {
    public static void main(String[] args) {
        // LIST: ordered, indexed, allows duplicates. Program to the interface.
        List<String> names = new ArrayList<>();
        names.add("ann");
        names.add("bob");
        names.add("cy");
        names.add("dee");
        System.out.println("index 2: " + names.get(2) + " | size: " + names.size());
        for (String n : names) {
            System.out.print(n + " ");
        }
        System.out.println();

        // MAP: fetch a value by key. Small word-count with getOrDefault.
        Map<String, Integer> counts = new HashMap<>();
        String[] words = {"cat", "dog", "cat", "ant", "cat"};
        for (String w : words) {
            counts.put(w, counts.getOrDefault(w, 0) + 1);
        }
        System.out.println("cat count: " + counts.get("cat"));
        System.out.println("has 'dog'? " + counts.containsKey("dog"));
        System.out.println("counts: " + counts);

        // SET: unique membership. Adding a duplicate is rejected.
        Set<Integer> seen = new HashSet<>();
        seen.add(7);
        seen.add(7); // duplicate: does not grow the set
        seen.add(9);
        System.out.println("set size: " + seen.size());   // 2, not 3
        System.out.println("contains 7? " + seen.contains(7));
    }
}
```

## code.cpp
```cpp
// C++ STL: vector ~ ArrayList, unordered_map ~ HashMap, unordered_set ~ HashSet.
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
using namespace std;

int main() {
    vector<string> names = {"ann", "bob", "cy", "dee"};   // ~ ArrayList
    cout << "index 2: " << names[2] << " | size: " << names.size() << "\n";

    unordered_map<string, int> counts;                     // ~ HashMap
    for (const string& w : {"cat", "dog", "cat", "ant", "cat"}) {
        counts[w]++;                                       // auto-inserts, defaults 0
    }
    cout << "cat count: " << counts["cat"]
         << " | has dog? " << counts.count("dog") << "\n";

    unordered_set<int> seen;                               // ~ HashSet
    seen.insert(7);
    seen.insert(7);                                        // duplicate ignored
    seen.insert(9);
    cout << "set size: " << seen.size()
         << " | contains 7? " << seen.count(7) << "\n";
    return 0;
}
```
