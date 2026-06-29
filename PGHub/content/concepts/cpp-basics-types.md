---
slug: cpp-basics-types
module: cpp-language
title: Fundamental Types and Declarations
subtitle: In C++ a variable is a fixed-size box stamped with a type at compile time — and choosing that box width is your job, not the language's.
difficulty: Beginner
position: 1
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "LearnCpp — Fundamental data types"
    url: "https://www.learncpp.com/cpp-tutorial/fundamental-data-types/"
    type: article
  - title: "LearnCpp — Const variables and symbolic constants"
    url: "https://www.learncpp.com/cpp-tutorial/const-variables-and-symbolic-constants/"
    type: article
  - title: "LearnCpp — Type deduction for objects using the auto keyword"
    url: "https://www.learncpp.com/cpp-tutorial/type-deduction-for-objects-using-the-auto-keyword/"
    type: article
  - title: "cppreference — Fundamental types"
    url: "https://en.cppreference.com/w/cpp/language/types"
    type: docs
status: published
---

## intro
In C++ a variable really is the box that Python pretends not to have. When you write `int n = 42;`, the compiler reserves a fixed slab of memory — typically 4 bytes — stamps it with the type `int`, and from then on that box can only ever hold an `int`. The type is decided at **compile time** and never changes. The four fundamental types you reach for constantly are `int` (whole numbers), `double` (decimals), `char` (a single byte/character), and `bool` (`true`/`false`). Get the fixed-box mental model right and declarations, sizes, `const`, and `auto` all click into place.

## whyItMatters
Every C++ variable occupies a known number of bytes that you, not the runtime, are responsible for choosing. That single fact drives most of what separates C++ from Python: there is no boxing, no per-value type tag, no garbage collector — just typed memory laid out exactly as you declared it. Picking `int` versus `double` versus `char` decides how much memory you use, how fast arithmetic runs, what range of values fits before it silently overflows, and whether `5 / 2` gives you `2` or `2.5`. The compiler enforces these types up front, so a whole class of bugs that Python only discovers at runtime becomes a compile error in C++ — but in exchange you must say what you mean. Understanding fixed sizes, `const` correctness, and `auto` deduction is what lets you read a declaration and know precisely what memory it costs and what operations are legal on it.

## intuition
Picture memory as a long shelf of one-byte cubbies, numbered by address. In Python a variable was a *name tag* you hung on a value-object floating somewhere on a wall; the object carried its own type. In C++ a variable is the opposite — it **owns a fixed group of adjacent cubbies on the shelf**, and the type written in the declaration decides how many cubbies it claims and how to interpret the bits inside them. `char c = 'A';` claims exactly **one** cubby and stores the number `65`. `bool b = true;` also claims **one** cubby. `int n = 42;` claims a contiguous block of **four** cubbies. `double d = 3.14;` claims **eight**. The type is a lens: the same byte pattern read as a `char` is a letter, read as part of an `int` is a number, read as part of a `double` is a fraction.

Because the size is fixed and known before the program runs, the compiler can compute the exact address of every variable in advance — no lookups, no tags, no allocation dance. That is why C++ is fast and why `sizeof(int)` is a compile-time constant you can print. It is also why a type cannot change: the cubby `n` lives in is permanently `int`-shaped, so `n = "hi";` is not "dynamic typing," it is a **compile error**. To hold text you declare a *different* box of a *different* type (`std::string s = "hi";`).

This fixed-width nature is double-edged. Each type has a finite range — a 4-byte `int` holds roughly -2.1 billion to +2.1 billion — and pushing past the edge **wraps around** silently instead of growing like a Python `int`. Division inherits the type of its operands: `5 / 2` is `int / int`, so the fractional part is *thrown away* and you get `2`; only `5.0 / 2` involves a `double` and yields `2.5`. Two tools tame all this. `const` stamps a box as read-only so the compiler rejects any accidental write — declare what must not change and let the compiler guard it. `auto` asks the compiler to **deduce** the type from the initializer (`auto x = 3.14;` makes `x` a `double`), saving you from spelling out a verbose type while keeping it fully static — `auto` is still resolved at compile time, it just infers instead of you stating it.

## visualization
```
type     bytes   memory layout (1 cell = 1 byte)   example value
-------  ------  --------------------------------   --------------------
char       1     [A]                                'A'  -> 65
bool       1     [1]                                true -> 1
int        4     [..][..][..][..]                   42
double     8     [..][..][..][..][..][..][..][..]   3.14
-------  ------  --------------------------------   --------------------

memory shelf as declarations land (byte offsets grow left -> right):

  offset:  0     1     2 .. 5            6 .. 13
          [ c ] [ b ] [   n: int   ]   [    d: double    ]
           'A'  true       42                 3.14
           1B    1B         4B                  8B
```

## bruteForce
Coming from Python, the naive instinct is to treat every number as one universal "number" type and every variable as a name that can hold anything. Under that wrong model you assume `5 / 2` is `2.5`, that an `int` grows without limit, that you can reassign `n` to a string later, and that you never have to think about how many bytes anything takes. C++ punishes each assumption: integer division truncates to `2`, a `double` was needed for the fraction, overflow wraps a 4-byte `int` around to a negative number instead of growing it, and reassigning a type is a compile error, not a clever trick. The "all numbers are the same" mental model quietly produces wrong answers.

## optimal
The correct model is **types are fixed-size contracts resolved at compile time; you choose the width, the compiler enforces the rules**. Internalize four habits and the rest follows.

First, **pick the right type for the value's range and precision**. Use `int` for counts and indices, `double` for measurements and anything with a fractional part, `char` for a single byte or character, `bool` for true/false flags. When range matters, reach for sized aliases (`long long`, `std::int64_t`) and check `sizeof` rather than assuming — `sizeof(int)` is 4 on virtually every modern platform, `sizeof(double)` is 8, but the standard only guarantees minimums. Knowing the width tells you the range, and the range tells you when overflow will bite.

Second, **mind the type of every operation, especially division**. `5 / 2` is integer division (`2`); to get `2.5` at least one operand must be floating point (`5.0 / 2`, or cast: `static_cast<double>(a) / b`). Mixed arithmetic promotes toward the wider type, so an `int` plus a `double` is a `double`.

Third, **be `const`-correct**. If a value should never change after initialization, declare it `const` (`const double PI = 3.14159;`). The compiler then rejects any write to it, documenting intent and catching accidental mutation at compile time for free. Prefer `const` by default and drop it only where you genuinely need to reassign.

Fourth, **let `auto` deduce when the type is obvious or verbose**. `auto it = v.begin();` is far cleaner than spelling the iterator type, and `auto x = 3.14;` is unmistakably a `double`. `auto` keeps everything statically typed — it deduces the exact type from the initializer at compile time — so you lose no safety, only keystrokes. Always initialize, because an uninitialized fundamental type holds garbage, and `auto` requires an initializer anyway. Trace a program by reading each declaration's type and size; the layout is fixed and knowable, never guessed.

## complexity
time: Declaring and reading a fundamental-type variable is O(1) — the compiler knows its address ahead of time, so access is a single memory load or store with no lookup, no tag check, no allocation. `sizeof` is resolved entirely at compile time and costs nothing at runtime.
space: Each variable costs exactly its type's width — `char`/`bool` 1 byte, `int` 4, `double` 8 (plus possible alignment padding between them). There is no per-value type tag or object header as in Python, so a million `int`s is about 4 MB flat.
notes: Sizes are platform-defined with standard minimums; `sizeof(int)` is 4 almost everywhere but check rather than assume. Overflow of a signed integer is undefined behavior, not a guaranteed wrap, so never rely on it.

## pitfalls
- **Integer division truncates.** `5 / 2` is `2`, not `2.5`, because both operands are `int` and the remainder is discarded. Fix: make one operand floating point — `5.0 / 2` or `static_cast<double>(a) / b`.
- **Silent integer overflow.** A 4-byte `int` maxes near 2.1 billion; `INT_MAX + 1` wraps to a large negative number (and is technically undefined behavior). Fix: use `long long`/`std::int64_t` for big values and validate ranges before arithmetic.
- **Narrowing conversions lose data.** `int n = 3.99;` silently truncates to `3`, and assigning a `double` into an `int` or a large `int` into a `char` quietly drops bits. Fix: use brace-init (`int n{3.99};`) which makes narrowing a compile error, and cast explicitly when you really mean to narrow.
- **Uninitialized variables hold garbage.** `int n;` then reading `n` yields an indeterminate value and undefined behavior — there is no implicit zero like Python. Fix: always initialize at declaration (`int n = 0;` or `int n{};`).
- **Comparing floating-point with `==`.** `0.1 + 0.2 == 0.3` is `false` because `double` is a binary approximation. Fix: compare within a tolerance, e.g. `std::abs(a - b) < 1e-9`.

## interviewTips
- State the contrast in one line: "C++ is statically typed — a variable's type and byte width are fixed at compile time, so there's no runtime type tag and no garbage collector, unlike Python where the type lives on the value." That frames most "static vs dynamic typing" questions.
- Be ready to explain integer division and overflow precisely: `5/2 == 2` because of `int/int` truncation, and signed overflow is undefined behavior — interviewers probe whether you know it's UB, not a guaranteed wrap.
- Know what `auto` does and does not do: it deduces a concrete static type from the initializer at compile time (zero runtime cost, full type safety) — it is not Python-style dynamic typing and the deduced type can never change afterward.

## keyTakeaways
- A C++ variable is a fixed-size, fixed-type box decided at compile time: `char`/`bool` 1 byte, `int` 4, `double` 8 — you choose the width and the compiler enforces it.
- Operations inherit operand types: `5 / 2` truncates to `2` while `5.0 / 2` is `2.5`; mind division, overflow, and narrowing because there is no automatic promotion to an unbounded number.
- Use `const` for values that must not change (compiler-enforced) and `auto` to deduce verbose or obvious types — both stay fully static, resolved before the program ever runs.

## code.python
```python
# Python contrast: no fixed sizes, ints grow unbounded, '/' always gives float.
import sys

n = 42            # int (arbitrary precision, no fixed byte width)
d = 3.14          # float (double precision under the hood)
c = 'A'           # just a 1-char string; no char type
b = True          # bool

print("int   value:", n, "size(bytes):", sys.getsizeof(n))   # ~28, not 4
print("float value:", d, "size(bytes):", sys.getsizeof(d))   # ~24, not 8
print("char  value:", c)
print("bool  value:", b)

print("5 / 2  =", 5 / 2)     # 2.5  -> true division ALWAYS gives float
print("5 // 2 =", 5 // 2)    # 2    -> floor division is the opt-in here
print("5.0/ 2 =", 5.0 / 2)   # 2.5

PI = 3.14159                 # convention-only 'const' (nothing enforces it)
x = 3.14                     # type is inferred, but it can be rebound later
print("PI:", PI, " x:", x, type(x).__name__)
```

## code.javascript
```javascript
// JS contrast: one 'number' type (64-bit float) for everything; no fixed int.
const n = 42;        // number
const d = 3.14;      // number (same type as n)
const c = "A";       // 1-char string; no char type
const b = true;      // boolean

console.log("int-ish value:", n, "type:", typeof n);   // number
console.log("double value:", d, "type:", typeof d);    // number
console.log("char  value:", c, "type:", typeof c);     // string
console.log("bool  value:", b, "type:", typeof b);     // boolean

console.log("5 / 2   =", 5 / 2);                 // 2.5  -> always float division
console.log("5/2|0   =", (5 / 2) | 0);           // 2    -> truncate via bit-or
console.log("5.0 / 2 =", 5.0 / 2);               // 2.5

const PI = 3.14159;          // const = cannot rebind, but type is still dynamic
let x = 3.14;                // type inferred; could be reassigned to a string
console.log("PI:", PI, " x:", x, typeof x);
```

## code.java
```java
// Java is statically typed like C++: fixed widths, declared types.
public class Types {
    public static void main(String[] args) {
        int n = 42;          // 4 bytes
        double d = 3.14;     // 8 bytes
        char c = 'A';        // 2 bytes in Java (UTF-16), prints as letter
        boolean b = true;    // 1 logical bit

        System.out.println("int    bytes=" + Integer.BYTES + " value=" + n);     // 4
        System.out.println("double bytes=" + Double.BYTES + " value=" + d);      // 8
        System.out.println("char   value=" + c + " code=" + (int) c);            // A 65
        System.out.println("bool   value=" + b);

        System.out.println("5 / 2   = " + (5 / 2));     // 2   integer division
        System.out.println("5.0 / 2 = " + (5.0 / 2));   // 2.5 floating division

        final double PI = 3.14159;     // final = const: cannot reassign
        var x = 3.14;                  // 'var' deduces double (Java 10+)
        System.out.println("PI=" + PI + " x=" + x);
    }
}
```

## code.cpp
```cpp
// C++ is statically typed: each variable is a fixed-size box decided at compile time.
#include <iostream>
using namespace std;

int main() {
    int    n = 42;          // whole number
    double d = 3.14;        // decimal (double precision)
    char   c = 'A';         // single byte; stores the code 65
    bool   b = true;        // true/false

    // sizeof is a COMPILE-TIME constant: how many bytes each box claims.
    cout << "char   size=" << sizeof(c) << "  value=" << c
         << "  code=" << static_cast<int>(c) << "\n";   // size=1  value=A  code=65
    cout << "bool   size=" << sizeof(b) << "  value=" << b << "\n";   // size=1  value=1
    cout << "int    size=" << sizeof(n) << "  value=" << n << "\n";   // size=4  value=42
    cout << "double size=" << sizeof(d) << "  value=" << d << "\n";   // size=8  value=3.14

    // Division inherits operand types: int/int truncates, double/.. does not.
    cout << "5 / 2   = " << (5 / 2) << "\n";       // 2    (fraction discarded)
    cout << "5.0 / 2 = " << (5.0 / 2) << "\n";     // 2.5  (one operand is double)

    const double PI = 3.14159;   // const: compiler rejects any write to PI
    cout << "const PI = " << PI << "\n";           // 3.14159

    auto x = 3.14;               // auto deduces double from the initializer
    auto k = 7;                  // auto deduces int
    cout << "auto x size=" << sizeof(x) << " (double)  "
         << "auto k size=" << sizeof(k) << " (int)\n"; // 8 (double)  4 (int)

    return 0;
}
```
