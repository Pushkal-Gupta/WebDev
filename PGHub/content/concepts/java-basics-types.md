---
slug: java-basics-types
module: java-language
title: Primitives and Objects
subtitle: In Java a variable is either a raw value sitting in a stack slot or an arrow pointing at an object on the heap — knowing which is everything.
difficulty: Beginner
position: 1
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Oracle Java Tutorials — Primitive Data Types"
    url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html"
    type: docs
  - title: "Oracle Java Tutorials — Variables"
    url: "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/variables.html"
    type: docs
  - title: "Baeldung — Java Primitives Versus Objects"
    url: "https://www.baeldung.com/java-primitives-vs-objects"
    type: article
  - title: "Baeldung — Autoboxing and Unboxing"
    url: "https://www.baeldung.com/java-autoboxing-unboxing"
    type: article
  - title: "Baeldung — Java 10 Local Variable Type Inference"
    url: "https://www.baeldung.com/java-10-local-variable-type-inference"
    type: article
status: published

---

## intro
Java splits the world in two. On one side are the eight **primitives** — `int`, `double`, `boolean`, `char`, `long`, `short`, `byte`, `float` — raw values that live directly inside their variable's slot with no wrapper around them. On the other side is everything else: **objects**, which live on the heap while your variable holds only a *reference* (an address) pointing to them. A `String`, an array, an `ArrayList`, your own classes — all references. Get this split right and assignment, `==`, `null`, and autoboxing stop being mysteries and become obvious consequences of where the bytes actually sit.

## whyItMatters
Almost every confusing Java bug for a beginner traces back to not knowing whether they are holding a value or a reference. Does assigning one variable to another copy the data or share it? Does `==` compare contents or identity? Why does `String a == b` sometimes lie? Why does a boxed `Integer` throw a `NullPointerException` when a primitive `int` never could? Each answer falls out of one fact: primitives *are* their value, objects are *pointed at*. This also drives performance — a million `int`s is a flat block of memory, while a million `Integer` objects is a million heap allocations plus pointers. Knowing which world you are in tells you what a line of code costs, what it copies, and what it compares.

## intuition
Picture the call stack as a wall of labeled pigeonholes, each just big enough for one small fixed value. When you write `int n = 42;`, the number `42` is placed **directly** into the pigeonhole named `n`. Nothing else exists — no object, no wrapper, no arrow. The slot *is* the value. The same holds for `double d = 3.14;`, `boolean b = true;`, and `char c = 'A';` (which secretly stores the number 65). Copy that slot with `int m = n;` and you get a brand-new, independent 42; changing `m` never touches `n`, because they are two separate pigeonholes each holding their own value.

Now write `String s = "hello";`. The text `"hello"` is far too big and too structured to sit in a pigeonhole, so Java builds a **String object out on the heap** — a separate open field of memory — and drops only its *address* into the slot named `s`. The slot holds an arrow, not the letters. Assign `String t = s;` and you copy the *arrow*, so `s` and `t` now point at the **same** heap object. This is why identity (`==`, "same arrow?") and equality (`.equals`, "same letters?") are genuinely different questions for objects but collapse into one for primitives.

Java keeps a special **String pool**: string literals with identical text are deduplicated into one shared heap object, so `"hi"` written twice may yield two slots holding the *same* arrow. That is a memory optimization, not a rule you should lean on for comparison.

Finally, **autoboxing** bridges the two worlds. Sometimes Java needs an object where you have a primitive — a `List` can only store objects, never a raw `int`. So it silently **wraps** the primitive: `Integer boxed = 42;` builds a little `Integer` *object* on the heap holding 42 and points your variable at it. Unboxing is the reverse — reaching back into the object to pull the raw value out. Convenient, but each box is a real heap allocation with real object identity, which is exactly where the surprises begin.

## visualization
```
             STACK (fixed-size slots, value lives here)        HEAP (objects live here)
             +----------------------------+                    +---------------------------+
   int n     |            42              |                    |  String  "hello"          |
   double d  |           3.14             |          +-------> |  (char data, length, ...) |
   boolean b |           true             |          |         +---------------------------+
   char c    |        65  ('A')           |          |                 ^  String pool
   String s  |     ref ---------------------------- +                  |
   Integer x |     ref ------------------------+                       |
             +----------------------------+    |         +---------------------------+
                                               +-------> |  Integer  { value: 42 }   |
   primitives HOLD the value.                            +---------------------------+
   references HOLD an address (arrow) to a heap object.
```

## bruteForce
Coming from Python, the tempting shortcut is "in Java, like in Python, everything is an object, so every variable is just a name pointing at some value-object." That single wrong model quietly breaks things. It makes you expect `==` to always compare contents (it does not — for objects it compares arrows), expect assignment to always share (it does not — primitives copy their value), and expect a numeric variable to never be `null` (an `Integer` can be, and unboxing it explodes). It also hides the cost of boxing, so you scatter `Integer` where `int` would do and pay for a heap object every time. "Everything is an object" is comforting and wrong; Java's whole surface behaves differently once primitives enter.

## optimal
The correct model has two categories and a bridge. **Primitives are raw values that ARE the contents of their slot.** The eight of them — `int`, `double`, `boolean`, `char`, `long`, `short`, `byte`, `float` — cannot be `null`, are copied by value on assignment, and are compared by value with `==`. When you write `int m = n;`, `m` is an independent copy; when you write `a == b` for two `int`s, you are literally asking "are these two numbers equal?"

**Objects live on the heap and your variable holds a reference to them.** A `String`, array, or any class instance is reached through an address. Assignment copies the *reference*, so two variables can point at one shared object. Crucially, for objects `==` asks **"same object?" (identity)**, while `.equals()` asks **"same contents?" (equality)**. For strings this is the classic trap: `s1 == s2` may be `false` even when the text matches, so always use `s1.equals(s2)` to compare text. Two references are `==` only when they point at the very same heap object.

**Autoboxing bridges the gap** by wrapping a primitive in its wrapper class (`int` to `Integer`, `double` to `Double`, `boolean` to `Boolean`) whenever an object is required, and unboxing reverses it. It is convenient but not free: each box is a heap allocation, and a boxed value now carries object identity and can be `null`. Prefer primitives in hot loops and numeric work; reach for wrappers only when the API demands objects (generics, collections, nullable fields).

Finally, **`var` (Java 10+) is inference, not dynamism.** `var x = 42;` still makes `x` a `int` fixed at compile time — Java just reads the type off the initializer to save you typing. It changes nothing about the value-versus-reference split; it only removes redundant type names on the left. Use it where the type is obvious from the right-hand side, and spell the type out when it aids readability.

## complexity
time: Reading or copying a primitive is O(1) — a single value load or store, no indirection. Following a reference to an object is also O(1) but adds one pointer hop; allocating a new object (including each autobox) costs an O(1) heap allocation plus eventual garbage-collection pressure.
space: A primitive costs exactly its fixed width — `byte` 1, `short`/`char` 2, `int`/`float` 4, `long`/`double` 8 bytes — sitting in the slot. An object costs a heap block (fields plus a header, typically 12-16 bytes of overhead) *plus* the reference pointing at it, so a boxed `Integer` is far larger than a raw `int`.
notes: Primitives never trigger garbage collection; objects do. Boxing in tight loops silently multiplies allocations. `var` has zero runtime cost — it is pure compile-time inference and disappears after compilation.

## pitfalls
- **Integer cache `==` trap.** Java caches boxed `Integer` values from -128 to 127, so `Integer a = 127, b = 127;` gives `a == b` true (same cached object) but `Integer c = 200, d = 200;` gives `c == d` false (two distinct objects). Fix: never compare wrappers with `==`; use `a.equals(b)` or unbox to `int` first.
- **`==` vs `.equals()` on String.** `new String("hi") == "hi"` is false because they are different heap objects even though the text matches; pooled literals may compare true and mislead you. Fix: always compare string contents with `.equals()` (or `Objects.equals()` when either side may be null).
- **Null unboxing NullPointerException.** Unboxing a `null` wrapper — e.g. `Integer x = null; int y = x;` — throws `NullPointerException` at the hidden `x.intValue()` call. Fix: null-check before unboxing, or keep the value as a primitive so it can never be null.
- **Primitive default values differ from null.** Uninitialized *fields* default to `0`/`0.0`/`false`/`''` for primitives but to `null` for object references — mixing them up leads to surprise nulls or surprise zeros. Fix: initialize explicitly, and remember a primitive field is never null while a wrapper field can be.

## interviewTips
- Frame it in one sentence: "Primitives store the value directly in the stack slot and compare by value; objects live on the heap and the variable holds a reference, so `==` compares identity and `.equals()` compares contents."
- Be ready to explain the `Integer` cache precisely — the -128..127 range, why `127 == 127` but `200 != 200` for boxed values — it is a favourite gotcha and interviewers want to hear "never use `==` on wrappers."
- Know that `var` is compile-time type inference with zero runtime effect and does not make Java dynamically typed; the deduced type is fixed and cannot change.

## keyTakeaways
- A primitive IS its value living in the slot (copied by value, never null, compared by `==` as value); an object is reached through a reference on the heap (assignment copies the arrow, `==` compares identity, `.equals()` compares contents).
- Autoboxing wraps a primitive into a heap wrapper object — convenient but a real allocation with identity and nullability; the `Integer` -128..127 cache makes `==` on wrappers dangerous.
- `var` is compile-time inference only: `var x = 42;` is still an `int` fixed forever — it saves keystrokes, not type safety, and never blurs the value-versus-reference line.

## code.python
```python
# Python contrast: there are no primitives — EVERYTHING is an object.
n = 42          # an int object; the name 'n' references it
d = 3.14        # a float object
b = True        # a bool object
s = "hello"     # a str object

# 'is' compares identity (same object); '==' compares value.
a = 256
c = 256
print("a == c:", a == c)     # True  (equal value)
print("a is c:", a is c)     # True here only due to CPython's small-int cache

big1 = 1000
big2 = 1000
print("big1 == big2:", big1 == big2)   # True  (value)
print("big1 is big2:", big1 is big2)   # False (distinct objects, like Java's cache quirk)

print("type of n:", type(n).__name__)  # int — a full object, not a raw value
```

## code.javascript
```javascript
// JS contrast: primitives (number/string/boolean/...) vs objects, checked with typeof.
const n = 42;          // number primitive
const d = 3.14;        // number primitive (same type)
const b = true;        // boolean primitive
const s = "hello";     // string primitive
const arr = [1, 2, 3]; // object (reference)

console.log("typeof n:", typeof n);       // number
console.log("typeof s:", typeof s);       // string
console.log("typeof arr:", typeof arr);   // object

// primitives compare by value; objects compare by reference (identity).
console.log("42 === 42:", 42 === 42);                 // true (value)
console.log("[1] === [1]:", [1] === [1]);             // false (two different objects)
const ref = arr;
console.log("arr === ref:", arr === ref);             // true  (same object)
```

## code.java
```java
// Java splits primitives (raw values) from objects (references on the heap).
public class Main {
    public static void main(String[] args) {
        // --- primitives: the value lives directly in the slot ---
        int n = 42;
        double d = 3.14;
        boolean b = true;
        char ch = 'A';
        System.out.println("int n     = " + n);
        System.out.println("double d  = " + d);
        System.out.println("boolean b = " + b);
        System.out.println("char ch   = " + ch + "  (code " + (int) ch + ")");

        // --- an object: the variable holds a reference to a heap String ---
        String s = "hello";
        System.out.println("String s  = " + s + "  (length " + s.length() + ")");

        // --- var (Java 10+): compile-time inference, still a fixed static type ---
        var inferred = 3.14;          // inferred as double
        System.out.println("var inferred = " + inferred + "  (a double)");

        // --- autoboxing: wrap an int into an Integer object, then unbox back ---
        Integer boxed = n;            // autobox: int 42 -> Integer object
        int backToPrimitive = boxed;  // unbox: Integer -> int 42
        System.out.println("boxed = " + boxed + ", unboxed = " + backToPrimitive);

        // --- the Integer cache == quirk (cached range -128..127) ---
        Integer a1 = 127, a2 = 127;   // same cached object
        Integer c1 = 200, c2 = 200;   // two distinct objects
        System.out.println("127 == 127 : " + (a1 == a2));          // true  (cached)
        System.out.println("200 == 200 : " + (c1 == c2));          // false (distinct objects)
        System.out.println("200 .equals 200 : " + c1.equals(c2));  // true  (equal value)

        // --- primitive default vs reference default ---
        int defaultInt = new Holder().primitive;    // 0
        String defaultRef = new Holder().reference;  // null
        System.out.println("primitive default = " + defaultInt);
        System.out.println("reference default = " + defaultRef);
    }

    // fields (not locals) get default values: primitives -> 0/false, references -> null
    static class Holder {
        int primitive;
        String reference;
    }
}
```

## code.cpp
```cpp
// C++ contrast: value types live inline; pointers hold an address to heap memory.
#include <iostream>
#include <string>
using namespace std;

int main() {
    int n = 42;              // value type: the int lives right here
    double d = 3.14;         // value type
    bool b = true;           // value type

    int m = n;               // COPY by value: m is an independent 42
    m = 99;
    cout << "n=" << n << " m=" << m << "\n";   // n=42 m=99 (independent)

    // a pointer holds an address to a heap-allocated object
    string* s = new string("hello");
    string* alias = s;       // copies the pointer: both point at the same object
    cout << "*s=" << *s << " same object? " << (s == alias) << "\n"; // 1 (same address)

    delete s;                // manual heap cleanup (no garbage collector)
    return 0;
}
```
