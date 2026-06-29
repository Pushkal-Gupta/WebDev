---
slug: cpp-pointers-references
module: cpp-language
title: Pointers and References
subtitle: A pointer is a labeled slip of paper holding the street address of a value — follow the address and you reach the thing it names.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 12
prereqs: [cpp-basics-types]
relatedProblems: []
references:
  - title: "LearnCpp — Introduction to Pointers"
    url: "https://www.learncpp.com/cpp-tutorial/introduction-to-pointers/"
    type: article
  - title: "LearnCpp — Null Pointers"
    url: "https://www.learncpp.com/cpp-tutorial/null-pointers/"
    type: article
  - title: "LearnCpp — Lvalue References"
    url: "https://www.learncpp.com/cpp-tutorial/lvalue-references/"
    type: article
  - title: "cppreference — Pointer declaration"
    url: "https://en.cppreference.com/w/cpp/language/pointer"
    type: docs
  - title: "cppreference — Reference declaration"
    url: "https://en.cppreference.com/w/cpp/language/reference"
    type: docs
status: published
---

## intro
Every variable in C++ lives somewhere in memory, at a numbered location called its **address**. A **pointer** is itself a variable, but the value it stores is not a number or a string — it is an *address*: it tells you where some other value lives. The address-of operator `&` reads a variable's address (`&x`), and the dereference operator `*` follows a pointer to the value it points at (`*p`). A **reference** is a second, simpler tool: a permanent alias — another name for an existing variable. Master both and indirection stops being scary.

## whyItMatters
Indirection is the engine under almost everything serious in C++. Passing a large object **by reference** instead of copying it turns an expensive copy into a cheap address hand-off, which is why function signatures across the standard library take `const T&`. Pointers are how linked lists, trees, and graphs link one node to the next — a node literally stores the address of its neighbour. They are how `new`/`delete` and the containers built on them manage heap memory, how polymorphism dispatches through a base-class pointer, and how output parameters let a function write back into a caller's variable. Misunderstand them and you get the two most infamous C++ crashes: dereferencing a null pointer and chasing a dangling pointer into freed memory. Understanding them is the difference between code that quietly corrupts and code you can reason about.

## intuition
Think of memory as a long street of numbered houses. Every variable you declare moves into one of those houses; the house number is its **address**. A normal variable like `int x = 10;` is a house with the value `10` sitting inside it.

A **pointer** is a labeled slip of paper. Instead of holding a value, it holds the *street address* of a house. When you write `int* p = &x;`, you read the address of `x`'s house with `&x` ("address-of x") and write that address onto the slip named `p`. Now `p` does not contain `10` — it contains something like `0x100`, the location where `10` lives. The slip *points at* the house.

To actually use the value, you **follow the address**. That is what `*p` means — "the value at the address written on `p`". Reading `*p` walks down the street to house `0x100` and reports back `10`. Writing `*p = 20` walks to the same house and changes what is inside, so afterwards `x` is `20` even though you never named `x` directly. The pointer gave you a second way to reach the same house.

Two operators, exact opposites: `&` turns a variable into its address (house → slip-of-paper), and `*` turns an address back into the variable it names (slip-of-paper → house). `p` is the slip; `*p` is the house it points to.

A **reference** is different and simpler: it is a *permanent nickname* for a house that already exists. `int& ref = x;` does not make a new house or a slip of paper — it just says "from now on, `ref` is another name for `x`." There is no `*` to follow and no address to manage; touching `ref` *is* touching `x`. A reference must be bound the instant it is created and can never be re-aimed at a different variable. A pointer is a slip you can erase and rewrite to point elsewhere; a reference is a nickname welded on for life.

## visualization
```
ADDRESS   HOUSE (variable)            POINTER (slip of paper)

 0x100    x: [   10   ]  <───────┐
                                 │
 0x200    p: [  0x100  ] ────────┘   p holds x's address; *p follows it to 10

 write *p = 20:
 0x100    x: [   20   ]  <─────────  the house changes; x is now 20

 reference (no new house, just a second name):
 0x100    x / ref: [  20  ]          ref IS x — same house, two name-plates
```

## bruteForce
The naive habit, especially coming from a value-only mindset, is to copy whole objects around and never reach for indirection. You pass a big `std::vector` or `struct` **by value**, so every call silently duplicates every byte; you return large objects the same way; you keep parallel copies in sync by hand. It "works" for tiny types, which is exactly why the cost hides — copying an `int` is free, so you assume copying a 10,000-element vector is too. You also can't build a linked structure at all this way: without an address to store, a node has no way to refer to "the next node." The missing idea is that you can hand around a small *address* instead of a large *value*.

## optimal
The disciplined approach is to reach for the *right* indirection tool deliberately. **References** are the default for "I want to refer to an existing variable without copying it." Pass big objects as `const T&` to get cheap, read-only access — no copy, and the `const` promises you won't mutate the caller's data. Use a non-const `T&` when a function genuinely needs to write back into the caller's variable (an output parameter, a swap). References are safest because they cannot be null and cannot be re-seated, so a reference parameter is a hard guarantee that a real object is behind it.

**Pointers** are the tool when you need what a reference cannot give: the ability to point at *nothing* (`nullptr`), to be *re-pointed* during the object's life, or to walk a data structure where each node stores the address of the next. A linked-list node holds a `Node*`; a tree node holds child pointers. The price of that power is responsibility. Always initialize a pointer — an uninitialized "wild" pointer holds garbage and dereferencing it is undefined behaviour. Use `nullptr` (not `0` or `NULL`) for "points at nothing," and **check before you dereference**: `if (p) { use(*p); }`. The deadliest hazard is the **dangling pointer** — a pointer that still holds an address whose house has been demolished, either because it was `delete`d or because it was a local variable that went out of scope. Reading through a dangling pointer reads freed memory: sometimes the old value, sometimes garbage, sometimes a crash, always a bug. Avoid it by never returning the address of a local, by setting a pointer to `nullptr` right after `delete`, and in modern C++ by preferring smart pointers (`std::unique_ptr`, `std::shared_ptr`) and references that make ownership and lifetime explicit. Rule of thumb: **reference when it can't be null and never changes target; pointer when it can be null or must be re-aimed.**

## complexity
time: Taking an address (`&x`), copying a pointer, and dereferencing (`*p`) are all O(1) — a single memory read or pointer follow. Passing by reference or pointer is O(1) regardless of object size, versus O(n) to copy an n-byte object by value.
space: A pointer or reference occupies one machine word (typically 8 bytes on 64-bit), independent of the size of the thing it refers to — that fixed, tiny footprint is exactly why indirection is cheap.
notes: References are usually implemented as pointers under the hood but carry compile-time guarantees (non-null, bound once). Dereferencing a null, dangling, or wild pointer is *undefined behaviour*, not a guaranteed crash — it may appear to work and corrupt silently.

## pitfalls
- **Dereferencing a null pointer.** `int* p = nullptr; int v = *p;` is undefined behaviour and typically crashes. Always guard: `if (p != nullptr) v = *p;` before following a pointer that might be null.
- **Dangling pointer to freed or out-of-scope memory.** Returning `&local` from a function, or using a pointer after `delete`, leaves it aimed at demolished memory. The fix: never return the address of a local; set the pointer to `nullptr` immediately after `delete`; prefer smart pointers for owned memory.
- **Uninitialized wild pointer.** `int* p;` (no initializer) holds garbage; `*p` reads or writes a random address. Always initialize — to a real address or to `nullptr` — at declaration.
- **Confusing `*p` with `p`.** `p` is the address (the slip); `*p` is the value at that address (the house). Assigning `p = &y` re-aims the pointer; assigning `*p = 5` changes the pointed-to value. Mixing them up either moves the wrong thing or fails to compile.
- **Forgetting a reference must be initialized.** `int& r;` is a compile error — a reference has to be bound to an existing object the moment it is declared, and once bound it can never be re-seated to refer to a different variable.

## interviewTips
- State the one-liner: "A pointer is a variable that stores an address; `&` reads an address, `*` follows one. A reference is an alias — a second name for an existing variable, bound once and never null." That frames every follow-up.
- When asked "pointer or reference?", give the decision rule: reference when the thing always exists and never needs re-aiming (cheap parameter passing, especially `const T&`); pointer when it can be null or must be re-pointed (optional values, linked structures, manual memory).
- Be ready to name and prevent the three classic faults — null deref, dangling pointer, uninitialized wild pointer — and tie the fixes to modern C++: initialize always, check before deref, prefer references and smart pointers over raw owning pointers.

## keyTakeaways
- A pointer stores an *address*, not a value: `&x` reads where `x` lives, `*p` follows the stored address to the value it names; `p` is the slip of paper, `*p` is the house.
- A reference is a permanent alias for an existing variable — no `*`, can't be null, must be initialized at declaration, and can never be re-seated; use it for cheap, safe pass-by-reference (`const T&`).
- The power of pointers (null, re-pointing, building linked structures) comes with the duty to avoid null dereferences, dangling pointers, and wild uninitialized pointers — initialize, guard, and prefer smart pointers.

## code.python
```python
# Python has no raw addresses, but mutable objects model indirection:
# a list holding one item is a "house" multiple names can reach and mutate.
x = [10]                     # a mutable box; think of it as a house holding 10
p = x                        # p is another name reaching the SAME object (like a pointer copy)

print("x value:", x[0])      # 10
print("p reaches x:", p is x)   # True  -- both names, one object
print("*p reads:", p[0])     # 10  -- follow the reference to the value

p[0] = 20                    # write through the shared reference
print("x after *p=20:", x[0])   # 20  -- x sees the change

# Re-point p at a different object (like p = &y); x is untouched.
y = [99]
p = y
print("x still:", x[0], "| p now:", p[0])   # 20 | 99

# A "null pointer" is None; guard before you use it.
p = None
print("p is null:", p is None)
if p is not None:
    print(p[0])              # skipped -- avoids the null dereference
else:
    print("skip deref: p points at nothing")
```

## code.javascript
```javascript
// JS objects are reference types: a variable holds a handle to the object,
// which behaves like a pointer you can copy, follow, and re-point.
const x = { val: 10 };       // a "house" holding 10
let p = x;                   // p references the SAME object (pointer copy)

console.log("x value:", x.val);     // 10
console.log("p reaches x:", p === x);  // true -- one object, two handles
console.log("*p reads:", p.val);    // 10 -- follow the handle to the value

p.val = 20;                  // write through the shared reference
console.log("x after write:", x.val);  // 20 -- x sees it

// Re-point p at a different object (like p = &y); x is untouched.
const y = { val: 99 };
p = y;
console.log("x still:", x.val, "| p now:", p.val);  // 20 | 99

// A "null pointer" is null; guard before dereferencing.
p = null;
console.log("p is null:", p === null);
if (p !== null) {
  console.log(p.val);        // skipped
} else {
  console.log("skip deref: p points at nothing");
}
```

## code.java
```java
// Java object variables are references (handles), much like pointers without
// the address arithmetic. Primitives are values; objects are referred to.
public class Indirection {
    static class Box { int val; Box(int v) { val = v; } }

    public static void main(String[] args) {
        Box x = new Box(10);     // a "house" holding 10
        Box p = x;               // p references the SAME object (pointer copy)

        System.out.println("x value: " + x.val);       // 10
        System.out.println("p reaches x: " + (p == x)); // true -- one object
        System.out.println("*p reads: " + p.val);       // 10 -- follow the handle

        p.val = 20;              // write through the shared reference
        System.out.println("x after write: " + x.val);  // 20 -- x sees it

        Box y = new Box(99);     // re-point p (like p = &y); x untouched
        p = y;
        System.out.println("x still: " + x.val + " | p now: " + p.val); // 20 | 99

        p = null;                // the "null pointer"; guard before use
        System.out.println("p is null: " + (p == null));
        if (p != null) {
            System.out.println(p.val);   // skipped
        } else {
            System.out.println("skip deref: p points at nothing");
        }
    }
}
```

## code.cpp
```cpp
// Pointers store addresses; references are aliases. Output is deterministic:
// we print LABELS and booleans, never the raw address value (which varies).
#include <iostream>
using namespace std;

int main() {
    int x = 10;            // a value living at some address
    int* p = &x;           // p stores the ADDRESS of x ( &x = "address-of x" )

    cout << "x = " << x << "\n";                 // x = 10
    cout << "p points at x: " << (p == &x) << "\n";  // 1 (true) -- stable, not the address
    cout << "*p = " << *p << "\n";               // *p = 10 -- follow p to the value

    *p = 20;               // write THROUGH the pointer into x's house
    cout << "x after *p = 20: " << x << "\n";    // x after *p = 20: 20

    int& ref = x;          // ref is a permanent alias -- another name for x
    ref = 30;              // touching ref IS touching x (no * needed)
    cout << "x after ref = 30: " << x << "\n";   // x after ref = 30: 30

    int y = 99;            // re-aim the pointer at a different variable
    p = &y;
    cout << "p points at y: " << (p == &y) << ", *p = " << *p << "\n"; // 1, *p = 99

    int* np = nullptr;     // a null pointer -- points at nothing
    if (np != nullptr) {
        cout << "value: " << *np << "\n";        // skipped -- avoids null deref
    } else {
        cout << "np is null: skip dereference\n";
    }

    return 0;
}
```
