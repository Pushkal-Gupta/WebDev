---
slug: py-data-structures
module: python-language
title: Core Data Structures
subtitle: List, tuple, dict, and set — what each one is good at, the operations you use daily, and the mutability rules that decide which one to reach for.
difficulty: Beginner
position: 4
estimatedReadMinutes: 13
prereqs: [py-variables-types, py-control-flow]
relatedProblems: []
references:
  - title: "The Python Tutorial — Data Structures"
    url: "https://docs.python.org/3/tutorial/datastructures.html"
    type: docs
  - title: "Python docs — Built-in Types (sequences, mappings, sets)"
    url: "https://docs.python.org/3/library/stdtypes.html"
    type: docs
  - title: "Real Python — Lists and Tuples in Python"
    url: "https://realpython.com/python-lists-tuples/"
    type: article
  - title: "Real Python — Dictionaries in Python"
    url: "https://realpython.com/python-dicts/"
    type: article
status: published
---

## intro
Python ships four built-in collections that cover most of what you'll ever store. A **list** is an ordered, indexable, editable sequence (`[3, 1, 4]`). A **tuple** is an ordered sequence too, but **immutable** — fixed once created (`(2, 5)`). A **dict** maps **keys to values** for instant lookup by key (`{"pen": 3}`). A **set** is an unordered bag of **unique** items with fast membership tests (`{1, 2, 3}`). Picking the right one is less about syntax and more about a single question: how will you *look things up* and *change them*?

## whyItMatters
Choosing the right collection is the difference between code that's clear and fast and code that's slow and error-prone. Need to check "have I seen this before?" a million times? A set does it in roughly one step each; a list does it by scanning every element, turning a fast program into a crawling one. Need to fetch a user's record by id? A dict goes straight to it; a list of records makes you loop. Need a value that must never change — coordinates, a date, a key into a dict? A tuple's immutability both signals intent and unlocks uses a list can't have. These four structures show up in every interview and every real program, and the mutability rules among them are the source of the most common shared-state bugs in Python. Knowing each one's strengths is core fluency, not trivia.

## intuition
Sort the four by two questions: **is order meaningful, and can it change?**

A **list** is a numbered shelf. Items sit in positions `0, 1, 2, …`; you read by index (`shelf[0]`), append to the end cheaply, insert in the middle (which shoves everything after it up by one), sort it, and store duplicates freely. It is the default "a bunch of things in order" container, and it is **mutable** — methods like `append`, `insert`, `sort`, and `pop` change the list in place. Use a list whenever order matters and the contents will grow, shrink, or change.

A **tuple** is a list that has been welded shut. Same ordered, indexable layout, but **immutable**: no `append`, no item assignment. That sounds like a limitation, but it's a feature — a tuple says "this group belongs together and won't change," which is perfect for a fixed record like a `(latitude, longitude)` pair or a function returning several values. Immutability is also why a tuple can be a **dict key** or a **set member** while a list cannot: hashing requires the contents never change. Tuples also power Python's clean **unpacking**: `x, y = point`.

A **dict** is a labeled filing cabinet: instead of numbered slots, each value is filed under a **key** you choose. `prices["pen"]` jumps straight to the value with no scanning, because the key is **hashed** into a location — average O(1) lookup, insert, and update. Keys are unique (assigning to an existing key overwrites), and since Python 3.7 a dict remembers insertion order. Reach for a dict whenever you look things up *by name* rather than by position.

A **set** is a guest list with a bouncer: every member is **unique**, there's no inherent order, and the one thing it's superb at is answering "is this in here?" in average O(1). Adding a duplicate is a silent no-op — sets **dedupe** automatically — which makes `set(my_list)` the one-liner for removing duplicates. Sets also do mathematical operations: union (`|`), intersection (`&`), difference (`-`). The flip side: because they're unordered and store only membership, you can't index a set or store duplicates in it.

## visualization
```
LIST  — ordered, indexed, mutable, duplicates ok
   idx:  0    1    2          append(40) → adds at the end (idx 3)
        [10] [20] [30]        insert(1,15) → [10][15][20][30]  (others shift right)

TUPLE — ordered, IMMUTABLE        DICT — key → value, O(1) lookup, unique keys
        ( 2 , 5 )                       "pen"      → 4      d["pen"] jumps straight here
        x,y = point  (unpack)           "notebook" → 1      d["c"] = 3  adds a pair
        can be a dict key / set member  "eraser"   → 2

SET   — unordered, UNIQUE, fast "in"
        { 3 , 7 , 1 }    add(7) → already present, no change (dedupe)
                         add(9) → { 3, 7, 1, 9 }      "7 in s" → True (≈ O(1))
```

## bruteForce
Reach for a list for everything and it shows. Membership checks (`if x in big_list`) scan the whole list — O(n) each — so a loop that tests membership inside it silently becomes O(n²) and grinds to a halt on real data. Deduping by hand means a nested loop comparing every pair. Looking up a record "by id" means iterating until you find the matching field, every single time. Using a mutable list where a fixed pair belongs invites accidental edits and rules out using it as a dict key. The list isn't wrong — it's just the one tool used for four jobs, and three of them have a far better tool.

## optimal
Match the structure to the access pattern. **List** when order matters and you'll index, append, or mutate a sequence — the workhorse for "things in a row." **Tuple** when the group is fixed and small and should be protected from change, when you want to return or unpack several values at once, or when you need a **hashable** composite to use as a dict key or set element. **Dict** when you look up *by a key* rather than a position: it turns an O(n) scan into an average O(1) jump, so any "find the record for this id / count occurrences of each word / map name to value" task wants a dict (`collections.Counter` and `dict.get(key, default)` make the common cases one line). **Set** when you only care whether something is present or you need uniqueness: membership and insertion are average O(1), `set(seq)` dedupes in one call, and `&`/`|`/`-` express overlap, combination, and difference directly.

Two operational rules keep you out of trouble. First, **mind mutability and sharing.** Lists, dicts, and sets are mutable, so `b = a` makes `b` *another name for the same object* — mutating through one is visible through the other. When you need an independent copy, say so: `a[:]` or `list(a)` for a shallow copy, `copy.deepcopy(a)` when nested objects must be copied too. Tuples, being immutable, are safe to share freely. Second, **respect hashability.** Dict keys and set members must be hashable (immutable): numbers, strings, and tuples-of-immutables qualify; lists, dicts, and sets do not, which is exactly why a tuple can key a dict and a list cannot. With those two rules and the access-pattern map above, choosing a collection becomes mechanical: by position → list (or tuple if fixed); by key → dict; by membership/uniqueness → set.

## complexity
time: List — index and append are average O(1); `insert`/`remove`/`x in list` are O(n) because elements shift or get scanned. Dict and set — lookup, insert, and delete are average O(1) via hashing (worst case O(n) under pathological collisions). Tuple — index is O(1); it has no mutating operations. Building any of them from n items is O(n).
space: All four store O(n) for n elements. Dicts and sets carry extra overhead per entry for the hash table (and keep spare capacity to stay fast), so they use more memory per item than a tight list or tuple.
notes: The O(1) on dict/set is *average* and assumes good hashing; it's the reason membership and counting tasks should use them over a list's O(n) scan. `append` is *amortized* O(1) — an occasional resize copies the backing array, but the average stays constant.

## pitfalls
- **Slow membership in a list.** `if x in big_list` is O(n); doing it inside a loop is O(n²). If you only need "is it present?", build a `set` first and test against that.
- **Aliasing a mutable container.** `b = a` (list/dict/set) shares one object — `b.append(...)` changes `a` too. Copy explicitly with `a[:]`, `list(a)`, `dict(a)`, `set(a)`, or `copy.deepcopy` for nested data.
- **Unhashable keys/members.** `d[[1, 2]] = x` or `{[1, 2]}` raises `TypeError: unhashable type: 'list'`. Use a tuple (`d[(1, 2)] = x`) — only immutable, hashable values can key a dict or join a set.
- **`KeyError` on a missing key.** `d[k]` raises if `k` is absent. Use `d.get(k)` (returns `None`), `d.get(k, default)`, or `collections.defaultdict` when keys may not exist yet.
- **Expecting order from a set.** Sets are unordered — you can't index one, and iteration order isn't the insertion order. If you need both uniqueness *and* order, dedupe while preserving order (`list(dict.fromkeys(seq))`).

## interviewTips
- Map structures to access patterns out loud: "By position → list; fixed group → tuple; by key → dict; membership/uniqueness → set." Interviewers want to hear you pick the container *because* of how it's accessed.
- Know the complexities cold: list membership and insert are O(n); dict/set lookup, insert, delete are average O(1). The single most common interview optimization is "replace an O(n) `in list` with an O(1) `in set`."
- Tie mutability to hashability: "Lists are mutable so they can't be dict keys; tuples are immutable and hashable, so they can." That one sentence demonstrates you understand *why* the rules exist, not just that they do.

## keyTakeaways
- List = ordered, indexed, mutable (duplicates ok); tuple = ordered but immutable (great for fixed records, unpacking, and as hashable keys); dict = key→value with average O(1) lookup; set = unordered, unique, average O(1) membership.
- Choose by access pattern: by position → list/tuple, by key → dict, by membership/uniqueness → set; replacing an O(n) `in list` with an O(1) `in set` is the classic speedup.
- Lists, dicts, and sets are mutable, so `b = a` aliases the same object — copy explicitly when you need independence; only immutable (hashable) values can be dict keys or set members.

## code.python
```python
# LIST — ordered, indexable, mutable, duplicates allowed.
nums = [3, 1, 4, 1, 5]
nums.append(9)
nums.sort()
print("list:", nums, "| first:", nums[0])      # [1, 1, 3, 4, 5, 9] | first: 1

# TUPLE — ordered but IMMUTABLE; great for fixed records and unpacking.
point = (2, 5)
x, y = point                                    # unpacking
print("tuple:", point, "| x + y:", x + y)       # (2, 5) | x + y: 7

# DICT — key -> value, fast lookup by key, keys unique.
prices = {"pen": 3, "notebook": 1}
prices["eraser"] = 2          # add a new pair
prices["pen"] = 4             # update an existing key
print("dict:", prices, "| pen:", prices["pen"]) # {'pen': 4, ...} | pen: 4
print("has eraser?", "eraser" in prices)        # True

# SET — unordered, UNIQUE items; fast membership; dedupes automatically.
tags = {"red", "blue", "red", "green"}          # the duplicate 'red' is dropped
tags.add("blue")                                # already present -> no change
print("set size:", len(tags))                   # 3
print("blue in tags?", "blue" in tags)          # True

# MUTABILITY: lists are shared by reference, not copied.
a = [1, 2, 3]
b = a                         # same list object, NOT a copy
b.append(4)
print("a is now:", a)         # [1, 2, 3, 4]  -- b changed it too
c = a[:]                      # a real (shallow) copy
c.append(99)
print("a unchanged by c:", a) # [1, 2, 3, 4]
```

## code.javascript
```javascript
// Array ~ list; [a, b] ~ tuple; Map ~ dict; Set ~ set.
const nums = [3, 1, 4, 1, 5];
nums.push(9);
nums.sort((p, q) => p - q);
console.log("array:", nums, "| first:", nums[0]);

const point = [2, 5];           // JS has no tuple; a fixed array stands in
const [x, y] = point;
console.log("pair:", point, "| x + y:", x + y);

const prices = new Map([["pen", 3], ["notebook", 1]]);
prices.set("eraser", 2);
prices.set("pen", 4);
console.log("map pen:", prices.get("pen"), "| has eraser:", prices.has("eraser"));

const tags = new Set(["red", "blue", "red", "green"]); // dedupes
tags.add("blue");                                      // no change
console.log("set size:", tags.size, "| blue in tags:", tags.has("blue"));

const a = [1, 2, 3];
const b = a;                    // same array reference
b.push(4);
console.log("a is now:", a);    // [1, 2, 3, 4]
const c = [...a];               // a copy
c.push(99);
console.log("a unchanged by c:", a);
```

## code.java
```java
import java.util.*;

public class Structures {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(List.of(3, 1, 4, 1, 5));
        nums.add(9);
        Collections.sort(nums);
        System.out.println("list: " + nums + " | first: " + nums.get(0));

        int[] point = {2, 5};   // a fixed-size pair (Java has no tuple literal)
        System.out.println("pair: (" + point[0] + ", " + point[1] + ") | sum: "
                + (point[0] + point[1]));

        Map<String, Integer> prices = new LinkedHashMap<>();
        prices.put("pen", 3);
        prices.put("notebook", 1);
        prices.put("eraser", 2);
        prices.put("pen", 4);   // update
        System.out.println("map: " + prices + " | pen: " + prices.get("pen"));

        Set<String> tags = new HashSet<>(List.of("red", "blue", "red", "green"));
        tags.add("blue");
        System.out.println("set size: " + tags.size() + " | blue in tags: "
                + tags.contains("blue"));

        List<Integer> a = new ArrayList<>(List.of(1, 2, 3));
        List<Integer> b = a;    // same reference
        b.add(4);
        System.out.println("a is now: " + a);   // [1, 2, 3, 4]
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <utility>
#include <algorithm>
#include <string>
using namespace std;

int main() {
    vector<int> nums = {3, 1, 4, 1, 5};        // ~ list
    nums.push_back(9);
    sort(nums.begin(), nums.end());
    cout << "vector first: " << nums[0] << " size: " << nums.size() << "\n";

    pair<int,int> point = {2, 5};              // ~ tuple
    cout << "pair sum: " << point.first + point.second << "\n";

    map<string,int> prices;                    // ~ dict
    prices["pen"] = 3;
    prices["notebook"] = 1;
    prices["eraser"] = 2;
    prices["pen"] = 4;                         // update
    cout << "pen: " << prices["pen"] << " has eraser: " << prices.count("eraser") << "\n";

    set<string> tags = {"red", "blue", "red", "green"};  // ~ set, dedupes
    tags.insert("blue");                       // no change
    cout << "set size: " << tags.size() << " blue in: " << tags.count("blue") << "\n";
    return 0;
}
```
