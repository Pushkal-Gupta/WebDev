---
slug: py-variables-types
module: python-language
title: Variables and Types
subtitle: A name is a label that points at a value object — not a box you pour data into. Why that distinction explains dynamic typing, reassignment, and conversion.
difficulty: Beginner
position: 1
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "The Python Tutorial — An Informal Introduction to Python (numbers, strings)"
    url: "https://docs.python.org/3/tutorial/introduction.html"
    type: docs
  - title: "Python docs — Built-in Types"
    url: "https://docs.python.org/3/library/stdtypes.html"
    type: docs
  - title: "Real Python — Variables in Python"
    url: "https://realpython.com/python-variables/"
    type: article
  - title: "Real Python — Basic Data Types in Python"
    url: "https://realpython.com/python-data-types/"
    type: article
status: published
---

## intro
A variable in Python is not a box that holds a value — it is a **name** stuck like a sticky label onto a value object that lives in memory. When you write `count = 7`, Python creates an integer object `7` and binds the name `count` to it. The four building-block types you will reach for constantly are `int` (whole numbers), `float` (decimals), `str` (text), and `bool` (`True`/`False`). Get the label-versus-box mental model right and assignment, reassignment, and type conversion all stop being surprising.

## whyItMatters
Almost every line of Python you ever write names a value and does something with it, so the rules for how names bind to values are the bedrock under everything else — loops, functions, data structures, classes. The label model is exactly what makes Python *dynamically typed*: the same name can point at an `int` on one line and a `str` on the next, because the type lives on the value, not on the name. That flexibility is why Python feels fast to write, and it is also the root of a whole family of beginner bugs — passing a string where a number was expected, two names accidentally sharing one mutable object, comparing a number typed by the user (still a string) against an integer. Understanding types and conversion up front is what lets you read an error message like `TypeError: can only concatenate str (not "int") to str` and know instantly what went wrong.

## intuition
Picture memory as a wall, and every value you create — the number `7`, the text `"widgets"`, the boolean `True` — as a small framed object hanging on that wall. A variable is a **name tag on a string** that you hook onto one of those frames. `price = 3.5` hangs a tag reading `price` on a float object `3.5`. The tag is not the value; it merely points at it. This is why `y = x` does **not** copy anything: it just hangs a second tag, `y`, on the very same frame that `x` already points to. Two names, one object.

Now reassign: `x = "hi"`. Python does not erase the old object or change its type — it makes a brand-new string object `"hi"` and **moves the `x` tag** over to it. The original number is still hanging there (and if no tag points at it anymore, Python's garbage collector quietly removes it). The name `x` has happily gone from pointing at an `int` to pointing at a `str` without complaint. That is **dynamic typing** in one picture: the type is a property of the framed object, so a name's type is simply whatever it currently points at.

The four core types behave like different kinds of frames. An `int` is an exact whole number with no size limit in Python. A `float` is a decimal stored in binary, so `0.1 + 0.2` is famously a hair off `0.3`. A `str` is an immutable sequence of characters — you can read or slice it but never edit a character in place. A `bool` is really a tiny `int` in disguise: `True` equals `1` and `False` equals `0`, which is why `True + True` is `2`. **Conversion** (casting) builds a *new* object of a different type from an old one: `int("42")` reads the digits of a string and produces the integer `42`; `str(3.5)` produces the text `"3.5"`. The original is untouched; you get a fresh frame of the target type.

## visualization
```
NAMES (labels)                 VALUES (objects on the memory wall)

  count ──────────────▶  [ int   7        ]
  price ──────────────▶  [ float 3.5      ]
  label ──────────────▶  [ str  "widgets" ]
  in_stock ───────────▶  [ bool  True     ]

  y = x        ── two tags, ONE object ──┐
  x ──┐                                  │
      ├────────────────▶ [ str "hi" ]    │   (no copy made)
  y ──┘  (after y = x, both point here)  │

  x = "bye"    ── x's tag MOVES to a new object; old one may be collected
```

## bruteForce
The naive instinct, especially coming from a typed language, is to treat a Python name as a typed container — to believe `count = 7` reserves an "integer slot" that can only ever hold integers, and that `y = x` duplicates the data into a second independent slot. Under that wrong model you expect reassigning `x` to leave `y` changed too, you are baffled when a name silently switches from number to string, and you reach for needless manual copies. It mostly limps along for simple immutable values precisely because you can't tell a copy from a shared reference when nothing is mutated.

## optimal
The correct, idiomatic model is **names bind to objects; types live on the objects**. Internalize three rules and the rest follows. First, **assignment binds a name** — `name = value` evaluates the right side to an object and points the name at it; `=` is a binding, never a copy. Second, **reassignment rebinds** — pointing a name at a new object never alters the old one, so two names that shared an object diverge the moment you rebind (not mutate) one of them. Third, **types belong to values**, so `type(x)` reports whatever `x` currently points at, and you change a name's type simply by binding it to a different object.

Conversion is explicit and intentional in good Python. When data crosses a boundary — user input, a file, a network response — it usually arrives as a `str`, and you convert it once at the edge: `age = int(input())`, `price = float(field)`. Pick the constructor that names the target type: `int()`, `float()`, `str()`, `bool()`, and let it fail loudly on bad input rather than guessing. Lean on Python's truthiness rules deliberately: empty string, `0`, `0.0`, empty containers, and `None` are *falsy*, everything else is *truthy*, so `if items:` reads cleaner than `if len(items) > 0`. And respect immutability: numbers, strings, and booleans are immutable, so "changing" one always produces a new object — which is exactly why sharing them between names is perfectly safe while sharing mutable objects (lists, dicts) is not. The payoff is that you predict program behavior by tracing which name points at which object, never by imagining values being poured between boxes.

## complexity
time: Binding a name (`x = value`) and reading it are O(1) — Python just updates or follows a pointer in a namespace dictionary. Conversions cost as much as the data they scan: `int("12345")` is O(d) in the number of digits, `str(n)` is O(d) in the resulting length; converting a single scalar is effectively constant.
space: Each distinct value is one object on the heap; multiple names pointing at the same object add only a pointer each, not a copy. A conversion allocates one new object of the target type.
notes: Small integers (−5 to 256) and short strings are *interned* — cached and reused — so two names set to `100` may point at the exact same object. Never rely on this for equality; use `==` for value equality and reserve `is` for identity (chiefly `is None`).

## pitfalls
- **Treating `=` as a copy.** After `b = a` where `a` is a list, `b.append(x)` changes what `a` sees too — they are one object. Use `a[:]`, `list(a)`, or `copy.deepcopy` when you genuinely need an independent copy. (For immutable ints/strings this never bites, which is why the misconception survives.)
- **Forgetting that input is text.** `input()` and most file/JSON fields hand you a `str`. `"3" + 4` raises `TypeError`, and `"10" > "9"` compares lexically (False!). Convert at the boundary: `int(...)` / `float(...)`.
- **Comparing floats with `==`.** `0.1 + 0.2 == 0.3` is `False` because floats are binary approximations. Compare with a tolerance (`math.isclose`) instead of exact equality.
- **Confusing `is` with `==`.** `is` tests whether two names point at the *same object*; `==` tests equal *value*. `a == b` is what you almost always want; `is` is for `None` and other singletons.
- **Assuming `bool` is separate from `int`.** Because `True == 1`, a stray boolean can sneak into arithmetic or be used as a list index — usually a sign of a logic slip, not a feature to exploit.

## interviewTips
- State the model in one sentence: "In Python a variable is a name bound to an object; the type lives on the object, so the same name can be rebound to a different type." That single line answers most "is Python pass-by-value or reference?" questions.
- When asked why `y = x` then mutating `x` sometimes affects `y` and sometimes not, separate **rebinding** (`x = ...`, never affects `y`) from **mutation** (`x.append(...)`, affects `y` only if the object is mutable and shared).
- If asked about `is` vs `==`, give the rule and the one safe use of `is`: identity vs equality, and "use `is` only for `None`." Mention small-int interning as the trap that makes `is` *seem* to work on numbers.

## keyTakeaways
- A variable is a name bound to a value object, not a container that holds the value; assignment binds, it never copies.
- Python is dynamically typed because the type lives on the object — the same name can point at an `int`, then a `str`, with no declaration.
- The four core types are `int`, `float`, `str`, `bool` (booleans are a subtype of `int`); convert between them explicitly with `int()`, `float()`, `str()`, `bool()`, usually right where untyped data enters your program.

## code.python
```python
# A variable is a NAME bound to a value object; the type lives on the object.
count = 7                  # int
price = 3.5                # float
label = "widgets"          # str
in_stock = True            # bool

print(count, type(count).__name__)        # 7 int
print(price, type(price).__name__)        # 3.5 float
print(label, type(label).__name__)        # widgets str
print(in_stock, type(in_stock).__name__)  # True bool

# Dynamic typing: rebind the same name to a different type — no complaint.
count = "seven"
print(count, type(count).__name__)        # seven str

# Conversion (casting) builds a NEW object of the target type.
qty = int("42") + 8                        # str -> int, then add  -> 50
total = qty * price                        # int * float -> float  -> 175.0
print("qty:", qty)
print("total:", total)
print("receipt:", str(total) + " for " + label)   # 175.0 for widgets

# bool is a subclass of int: True is 1, False is 0.
print("True + True + False =", True + True + False)   # 2
```

## code.javascript
```javascript
// JavaScript is also dynamically typed, but numbers are one "number" type.
let count = 7;
let price = 3.5;
let label = "widgets";
let inStock = true;
console.log(count, typeof count);     // 7 number
console.log(price, typeof price);     // 3.5 number  (no separate int/float)
console.log(label, typeof label);     // widgets string
console.log(inStock, typeof inStock); // true boolean

count = "seven";                      // rebind to a different type
console.log(count, typeof count);     // seven string

const qty = parseInt("42", 10) + 8;   // string -> number
const total = qty * price;            // 175
console.log("qty:", qty);
console.log("total:", total);
console.log("receipt:", String(total) + " for " + label);
console.log("true + true + false =", true + true + false); // 2
```

## code.java
```java
// Java is STATICALLY typed: a variable's type is fixed, so a new type needs a new name.
public class Types {
    public static void main(String[] args) {
        int count = 7;
        double price = 3.5;
        String label = "widgets";
        boolean inStock = true;
        System.out.println(count + " int");
        System.out.println(price + " double");
        System.out.println(label + " String");
        System.out.println(inStock + " boolean");

        String countWord = "seven"; // cannot rebind 'count' to text; use a new name
        System.out.println(countWord + " String");

        int qty = Integer.parseInt("42") + 8;   // "42" -> 42, then +8 -> 50
        double total = qty * price;             // 175.0
        System.out.println("qty: " + qty);
        System.out.println("total: " + total);
        System.out.println("receipt: " + total + " for " + label);
    }
}
```

## code.cpp
```cpp
// C++ is statically typed; each value has a declared type known at compile time.
#include <iostream>
#include <string>
using namespace std;

int main() {
    int count = 7;
    double price = 3.5;
    string label = "widgets";
    bool in_stock = true;
    cout << count << " int\n";
    cout << price << " double\n";
    cout << label << " string\n";
    cout << in_stock << " bool\n";       // prints 1 for true

    string count_word = "seven";          // a new name for the new type
    cout << count_word << " string\n";

    int qty = stoi("42") + 8;             // "42" -> 42, then +8 -> 50
    double total = qty * price;           // 175
    cout << "qty: " << qty << "\n";
    cout << "total: " << total << "\n";
    return 0;
}
```
