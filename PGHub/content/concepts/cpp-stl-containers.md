---
slug: cpp-stl-containers
module: cpp-language
title: STL Containers and Algorithms
subtitle: The Standard Template Library is three parts that snap together — containers that store, iterators that traverse, and algorithms that operate — so you never hand-roll an array, a sort, or a search again.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 13
prereqs: [cpp-basics-types]
relatedProblems: []
references:
  - title: "learncpp.com — Introduction to std::vector and list constructors"
    url: "https://www.learncpp.com/cpp-tutorial/introduction-to-stdvector-and-list-constructors/"
    type: article
  - title: "cppreference — std::vector"
    url: "https://en.cppreference.com/w/cpp/container/vector"
    type: docs
  - title: "cppreference — std::map"
    url: "https://en.cppreference.com/w/cpp/container/map"
    type: docs
  - title: "cppreference — std::sort"
    url: "https://en.cppreference.com/w/cpp/algorithm/sort"
    type: docs
status: published
---

## intro
The Standard Template Library (STL) is the part of C++ you reach for on almost every line of real code. Instead of declaring raw arrays and writing your own search and sort by hand, you pull a ready-made **container** off the shelf — `std::vector` for a resizable list, `std::map` for keyed lookup, `std::set` for a collection of unique values — and let battle-tested generic **algorithms** like `std::sort` and `std::find` do the work. The glue between the two is the **iterator**: a generalized pointer that lets one algorithm walk any container.

## whyItMatters
Nearly every non-trivial C++ program stores a collection of things and then does something to that collection — sort it, search it, count it, group it by key. The STL is how you express all of that without reinventing data structures or risking the off-by-one and memory bugs that come from managing raw arrays yourself. Picking the right container is also the single biggest lever you have on performance: a lookup that is O(n) in a `vector` becomes O(log n) in a `map` and O(1) on average in an `unordered_map`. Interviewers expect fluency here, and production codebases live and die by it, because the difference between the right and wrong container is the difference between a program that scales and one that crawls. Knowing the STL trinity is table stakes for writing C++ that is both correct and fast.

## intuition
Think of the STL as a triangle with three corners that fit together: **containers store**, **iterators traverse**, and **algorithms operate**. None of the three is useful alone — the power is in how cleanly they compose. You choose a container for *how your data is shaped*, the container hands you iterators that mark positions in it, and you feed those iterators to algorithms that don't care what container they came from.

A `std::vector<T>` is the workhorse: a **contiguous, resizable array**. Because the elements sit back-to-back in memory, indexing `v[i]` is O(1) — the address is just `base + i * sizeof(T)`. Appending with `push_back` is **O(1) amortized**: most pushes are instant, and only occasionally does the vector run out of room, allocate a bigger block (typically double), and copy everything over. That rare copy is spread across all the cheap pushes, so the *average* stays constant. A vector is the right default for "a list of things I mostly add to the end and read by position."

A `std::map<Key, Value>` is a **balanced binary search tree** (a red-black tree) that keeps its keys **sorted**. Insert, lookup, and erase are each **O(log n)** because you walk down the tree, halving the search space at every node. Iterating a map visits keys in sorted order for free. Reach for it when you need to look things up *by key* rather than by position — a word-count, a phone book, an id-to-object table.

A `std::set<Key>` is the same tree, but storing **only unique keys** with no associated value. Inserting a key that already exists is silently ignored, so a set is the natural tool for "the distinct things I've seen" and for fast **membership** tests in O(log n).

Tying it all together is the **iterator** — an object that behaves like a pointer: `*it` reads the element, `++it` moves to the next. Because every container exposes `begin()` and `end()` iterators with the same interface, a single algorithm like `std::sort` or `std::find` works on all of them. That decoupling — algorithms written once against iterators, not against any specific container — is the whole design.

## visualization
```
std::vector<int>  — contiguous, indexed by position, O(1) random access
   index:   0     1     2     3     4
         +-----+-----+-----+-----+-----+
   data: |  10 |  30 |  20 |  50 |  40 |   push_back appends here -->
         +-----+-----+-----+-----+-----+
                                    find(30): scan 0,1 -> hit at index 1  (O(n))

std::map<string,int>  — balanced BST, keys kept SORTED, O(log n) by key
                       ( "kiwi", 3 )
                      /             \
            ( "apple", 5 )      ( "pear", 9 )
                                /
                         ( "mango", 7 )
        lookup "mango": kiwi -> pear -> mango   (walk the path, O(log n))
```

## bruteForce
The tempting shortcut, especially coming from C, is to do it all by hand: declare a fixed `int data[100]`, track a separate `size` variable, write nested loops to sort, and scan the whole array every time you need to find something. It works for tiny inputs, but it rots fast. The fixed array overflows or wastes space; every lookup is an O(n) linear scan; your hand-written sort is usually a slow O(n^2) bubble sort with a subtle bug; and there is no notion of keyed access at all, so "count how many times each word appears" becomes a tangle of parallel arrays. You end up re-implementing — badly — exactly what the STL already ships, tested and optimized.

## optimal
The right approach is to **let the access pattern pick the container**, then lean on the standard algorithms. Start with `std::vector` as your default sequence — contiguous storage is cache-friendly and `push_back` is amortized O(1). When you know the final size, call `reserve(n)` up front so the vector allocates once instead of repeatedly doubling and copying as it grows; this is the cheapest performance win in C++.

The moment your question is "look this up *by key*," switch to an associative container. Use `std::map<K,V>` when you need keys kept **sorted** (in-order iteration, range queries, floor/ceiling) and can afford **O(log n)** per operation. Use `std::unordered_map<K,V>` when you only need fast lookup and don't care about order — it's a **hash table** with **O(1) average** access, faster than `map` in practice but with no ordering and a worst case of O(n) under bad hashing. The same split holds for `std::set` (sorted, O(log n)) versus `std::unordered_set` (hashed, O(1) average) when you want a collection of unique keys for membership testing.

Then reach for algorithms instead of loops. `std::sort(v.begin(), v.end())` sorts a vector in O(n log n) introsort; pass a comparator lambda for custom order. `std::find(v.begin(), v.end(), x)` scans for a value, returning `end()` if absent — but note it's O(n), so if you find yourself searching the same vector repeatedly, that's the signal to move the data into a `set` or `map` and search in O(log n) instead. Iterate with a **range-based for** (`for (const auto& x : v)`) for readability, and use `auto` for iterator types. The discipline is simple: shape the data with the right container, search it with the right structure, and never write a sort or a linear scan the library already provides.

## complexity
time: `std::vector` — index `v[i]` and `back()` are O(1); `push_back` is O(1) amortized; insert/erase in the middle is O(n) (elements shift); `std::find` over it is O(n). `std::map`/`std::set` (balanced BST) — insert, erase, find, and `count` are each O(log n), and iteration in sorted order is O(n) total. `std::unordered_map`/`std::unordered_set` (hash table) — insert, erase, find are O(1) **average**, O(n) worst case. `std::sort` is O(n log n).
space: All containers use O(n) space for n elements. A `vector` may hold extra unused capacity (its allocated block is often larger than its size). Tree-based `map`/`set` carry per-node pointer overhead (parent/left/right + color); hash-based containers carry bucket-array overhead.
notes: `vector` wins on cache locality because elements are contiguous; node-based `map`/`set` scatter across the heap, so even their O(log n) operations have a larger constant factor. Prefer `unordered_*` for raw lookup speed and the ordered `map`/`set` only when you actually need sorted order or range operations.

## pitfalls
- **Iterator invalidation.** A `push_back` that triggers reallocation invalidates *every* existing iterator, pointer, and reference into the vector; erasing an element invalidates iterators at and after it. Looping while modifying with stale iterators is undefined behavior. Fix: `reserve()` ahead of growth, or use the iterator returned by `erase()` (`it = v.erase(it);`) rather than blindly `++it`.
- **`map::operator[]` silently inserts.** Writing `if (counts[key] > 0)` on a `map` *inserts* `key` with a default-constructed `0` if it wasn't there, mutating the map during a read. Fix: use `counts.find(key) != counts.end()` or `counts.count(key)` to test membership without inserting.
- **`std::vector<bool>` is not a normal vector.** It's a space-optimized bit-packed specialization, so `auto& b = v[i];` does **not** give you a real `bool&` and taking addresses breaks. Fix: use `std::vector<char>` or `std::deque<bool>` when you need genuine `bool` references.
- **Forgetting the `#include`.** Each container/algorithm needs its header — `<vector>`, `<map>`, `<set>`, `<algorithm>`, `<string>`. Missing one gives confusing "not a member of std" errors even though the code looks right. Fix: include the header for every STL facility you name.
- **Using O(n) `std::find` on data you search repeatedly.** Linear-scanning a vector again and again turns an O(n) task into O(n^2). Fix: if you search the same collection many times, store it in a `set`/`unordered_set` (or `map`) and look up in O(log n) / O(1) instead.

## interviewTips
- Lead with the trinity: "The STL is containers, iterators, and algorithms — I pick the container by access pattern, and the standard algorithms operate on it through iterators." It frames every container question cleanly.
- When asked to choose a container, reason out loud about complexity: "I need keyed lookup with no ordering requirement, so `unordered_map` for O(1) average — if I needed sorted keys or range queries I'd pay O(log n) for `map`." Naming the trade-off is what they're testing.
- Know the invalidation rules cold — they're a favorite trap. Be ready to say exactly when `vector` reallocation and `erase` invalidate iterators, and how the erase-return idiom or `reserve()` avoids the bug.

## keyTakeaways
- The STL is three composable parts: containers store data, iterators mark positions, and generic algorithms (`std::sort`, `std::find`) operate on any container through its iterators.
- Choose by access pattern: `vector` for indexed sequences (O(1) index, amortized O(1) `push_back`), `map`/`set` for sorted keyed access (O(log n)), `unordered_map`/`unordered_set` for hashed lookup (O(1) average).
- Avoid the classic traps: iterator invalidation after `push_back`/`erase`, accidental insertion via `map::operator[]`, and re-scanning a vector with O(n) `std::find` when a `set`/`map` would make it O(log n).

## code.python
```python
# Python's built-in list / dict / set mirror C++ vector / map / set.

# list  ~ std::vector: ordered, index by position, append at the end
nums = [10, 30, 20]
nums.append(50)            # like push_back -> [10, 30, 20, 50]
nums.append(40)
print("nums[2] =", nums[2])             # index access -> 20
nums.sort()                             # like std::sort -> [10,20,30,40,50]
print("sorted:", nums)
print("find 30:", "found" if 30 in nums else "absent")

# dict ~ std::map: keyed lookup (sorted here for deterministic output)
prices = {"apple": 5, "kiwi": 3}
prices["pear"] = 9                      # insert
print("apple ->", prices["apple"])      # lookup
for fruit in sorted(prices):            # iterate keys in sorted order
    print(f"  {fruit} = {prices[fruit]}")

# set ~ std::set: unique keys, dedup on insert, fast membership
seen = {1, 2, 3}
seen.add(2)                             # already present -> ignored
seen.add(7)
print("set:", sorted(seen))             # [1, 2, 3, 7]
print("has 3:", 3 in seen, "| has 9:", 9 in seen)
```

## code.javascript
```javascript
// JavaScript Array / Map / Set mirror C++ vector / map / set.

// Array ~ std::vector
let nums = [10, 30, 20];
nums.push(50);                          // like push_back
nums.push(40);
console.log("nums[2] =", nums[2]);      // 20
nums.sort((a, b) => a - b);             // numeric sort -> [10,20,30,40,50]
console.log("sorted:", nums.join(","));
console.log("find 30:", nums.includes(30) ? "found" : "absent");

// Map ~ std::map (insertion-ordered; sort keys for sorted output)
const prices = new Map([["apple", 5], ["kiwi", 3]]);
prices.set("pear", 9);                  // insert
console.log("apple ->", prices.get("apple"));
for (const k of [...prices.keys()].sort()) {
  console.log(`  ${k} = ${prices.get(k)}`);
}

// Set ~ std::set: unique keys
const seen = new Set([1, 2, 3]);
seen.add(2);                            // duplicate ignored
seen.add(7);
console.log("set:", [...seen].sort((a, b) => a - b).join(","));
console.log("has 3:", seen.has(3), "| has 9:", seen.has(9));
```

## code.java
```java
// Java ArrayList / TreeMap / TreeSet mirror C++ vector / map / set.
import java.util.*;

public class StlDemo {
    public static void main(String[] args) {
        // ArrayList ~ std::vector
        List<Integer> nums = new ArrayList<>(List.of(10, 30, 20));
        nums.add(50);                       // like push_back
        nums.add(40);
        System.out.println("nums[2] = " + nums.get(2));   // 20
        Collections.sort(nums);             // like std::sort
        System.out.println("sorted: " + nums);
        System.out.println("find 30: " + (nums.contains(30) ? "found" : "absent"));

        // TreeMap ~ std::map: sorted keys, O(log n)
        TreeMap<String, Integer> prices = new TreeMap<>();
        prices.put("apple", 5);
        prices.put("kiwi", 3);
        prices.put("pear", 9);
        System.out.println("apple -> " + prices.get("apple"));
        for (Map.Entry<String, Integer> e : prices.entrySet()) {
            System.out.println("  " + e.getKey() + " = " + e.getValue());
        }

        // TreeSet ~ std::set: unique sorted keys
        TreeSet<Integer> seen = new TreeSet<>(List.of(1, 2, 3));
        seen.add(2);                        // duplicate ignored
        seen.add(7);
        System.out.println("set: " + seen);
        System.out.println("has 3: " + seen.contains(3) + " | has 9: " + seen.contains(9));
    }
}
```

## code.cpp
```cpp
// The STL trinity: containers store, iterators traverse, algorithms operate.
#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <algorithm>
#include <string>
using namespace std;

int main() {
    // std::vector — contiguous, resizable; push_back amortized O(1), index O(1)
    vector<int> nums = {10, 30, 20};
    nums.push_back(50);
    nums.push_back(40);
    cout << "nums[2] = " << nums[2] << "\n";          // 20

    sort(nums.begin(), nums.end());                   // std::sort, O(n log n)
    cout << "sorted:";
    for (int n : nums) cout << " " << n;              // 10 20 30 40 50
    cout << "\n";

    // std::find — O(n) linear scan, returns end() if absent
    auto it = find(nums.begin(), nums.end(), 30);
    cout << "find 30: " << (it != nums.end() ? "found" : "absent") << "\n";

    // std::map — balanced BST, keys kept sorted, O(log n) insert/lookup
    map<string, int> prices;
    prices["apple"] = 5;
    prices["kiwi"] = 3;
    prices["pear"] = 9;
    cout << "apple -> " << prices["apple"] << "\n";    // 5
    for (const auto& kv : prices)                      // iterates in sorted key order
        cout << "  " << kv.first << " = " << kv.second << "\n";

    // std::set — unique sorted keys; duplicate insert is ignored
    set<int> seen = {1, 2, 3};
    seen.insert(2);                                    // already present -> no-op
    seen.insert(7);
    cout << "set:";
    for (int x : seen) cout << " " << x;               // 1 2 3 7
    cout << "\n";
    cout << "has 3: " << (seen.count(3) ? "yes" : "no")
         << " | has 9: " << (seen.count(9) ? "yes" : "no") << "\n";

    return 0;
}
```
