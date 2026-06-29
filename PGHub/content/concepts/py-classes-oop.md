---
slug: py-classes-oop
module: python-language
title: Classes & OOP
subtitle: Bundle data and the behaviour that acts on it into one type — instances, methods, inheritance, and the dunder hooks that make your objects feel built-in.
difficulty: Intermediate
position: 5
estimatedReadMinutes: 14
prereqs: [py-functions-scope, py-data-structures]
relatedProblems: []
references:
  - title: "The Python Tutorial — Classes"
    url: "https://docs.python.org/3/tutorial/classes.html"
    type: docs
  - title: "Python docs — Data model (special/dunder methods)"
    url: "https://docs.python.org/3/reference/datamodel.html"
    type: docs
  - title: "Real Python — Object-Oriented Programming (OOP) in Python 3"
    url: "https://realpython.com/python3-object-oriented-programming/"
    type: article
  - title: "Real Python — Inheritance and Composition: A Python OOP Guide"
    url: "https://realpython.com/inheritance-composition-python/"
    type: article
status: published
---

## intro
A **class** packages data and the functions that act on that data into a single named type. Define `class Account:` once, and every `Account()` you create is an **instance** — a self-contained object carrying its own values while sharing the class's behaviour. `__init__` sets up each new instance, `self` is how a method refers to the instance it was called on, and methods are just functions that live on the class. On top of that, **inheritance** lets one class build on another, and **dunder methods** (`__repr__`, `__eq__`, `__len__`) let your objects plug into Python's own syntax.

## whyItMatters
Once a program grows past a handful of values, passing loose variables around stops scaling: you end up with `update_balance(name, balance, owner, history, ...)` calls where every function must be handed every field, and nothing stops one function from leaving the data in an inconsistent state. A class fixes the data and its operations together, so a `Account` *knows* how to deposit into itself and guards its own invariants. That bundling is the backbone of almost every real codebase, framework, and standard-library type you'll touch — files, exceptions, data classes, ORM models are all classes. Interviews lean on it too: "model this system" questions are really "design the classes" questions, and dunder methods come up constantly.

## intuition
Think of a class as a **blueprint** and each instance as a **house built from it**. The blueprint specifies the rooms every house will have — but it isn't a house you can live in; it's the plan. When you call `Account("Ada", 100)`, you *build* one house from that plan: a real object sitting at its own address in memory, with its own front-door key and its own furniture. Build three houses from the same blueprint and you get three independent objects. Painting the walls of one ("Ada's balance is now 250") doesn't touch the others, because each instance carries its **own** copy of the per-house data.

That per-house data is an **instance attribute**, created by assigning to `self.something` — almost always inside `__init__`, the setup routine Python runs automatically the moment a new object is built. The mysterious `self` is simply the house being worked on: when you write `account.deposit(50)`, Python quietly passes `account` in as the first argument, so inside `deposit`, `self` *is* that exact account. Forget to write `self` and the method has no way to reach the object's data.

Some things, though, belong to the blueprint itself, not to any one house — a **class attribute**, defined directly in the class body. Every instance sees the same shared value (a default interest rate, a running count of how many accounts exist). Reading it through an instance falls back to the class; assigning through an instance creates a *new* instance attribute that shadows it. Keep the distinction sharp: "every house gets its own" → instance attribute in `__init__`; "one value the whole type shares" → class attribute.

**Inheritance** is drawing a new, more specialised blueprint that says "same as the Account blueprint, plus these extras." A `SavingsAccount` *is an* `Account`, so it gets every method for free and can **override** the ones it wants to change — calling `super()` to reuse the parent's version rather than copy-pasting it. **Dunder methods** are the named hooks Python looks for: define `__repr__` and `repr(obj)` and the debugger use it; define `__eq__` and `==` compares by value; define `__len__` and `len(obj)` works. Your object stops being a black box and starts behaving like a native type.

## visualization
```
class Account            <-- the BLUEPRINT (defines structure + shared behaviour)
  class attr: count = 0        one value shared by every instance
  method: deposit(self, amt)   code shared by every instance
  method: __repr__(self)       dunder hook -> repr(obj)
      |
      |  Account("Ada", 100)            Account("Bo", 40)
      v  builds an instance             builds another instance
  +------------------------+        +------------------------+
  | instance  a            |        | instance  b            |
  |  name  = "Ada"         |        |  name  = "Bo"          |   <-- OWN attributes
  |  bal   = 100           |        |  bal   = 40            |
  |  deposit -> Account.deposit      deposit -> Account.deposit |  <-- SHARED methods
  +------------------------+        +------------------------+
      |
      v  class Savings(Account)  -- inherits all, OVERRIDES deposit() via super()
  +------------------------+
  | Savings  is-an Account |  gets name/bal/count for free, adds interest
  +------------------------+
```

## bruteForce
Before classes, you model an account as a bare dict — `acct = {"name": "Ada", "bal": 100}` — and write free functions like `deposit(acct, amt)` that mutate it. It works for one or two fields, but the data and the logic drift apart: nothing guarantees every account dict has a `bal` key, any code anywhere can scribble a bad value in, and a typo'd key fails silently at 3am instead of at definition time. There's also no shared identity — you can't ask "is this a savings account?" or give two related kinds of account shared-but-customised behaviour without a tangle of `if acct["type"] == ...` branches.

## optimal
Reach for a class when a clump of data and the operations on it belong together, especially when you'll create many of the thing or need variants that share behaviour. The shape is mechanical: `class Name:` opens the blueprint, `__init__(self, ...)` stores each instance's data on `self`, and every method takes `self` first so it can read and update that data. Keep **instance** state (unique per object) in `__init__` via `self.x = ...`, and put genuinely **shared** constants or defaults as **class** attributes in the class body — but make class attributes immutable (a number, a string, a tuple), never a mutable list or dict, or every instance ends up sharing and mutating the one object.

Use **inheritance** when a new type genuinely *is a* kind of the old one and wants most of its behaviour: `class Savings(Account)` inherits every method, and you **override** only what differs. Inside an override, call `super().method(...)` to run the parent's version and extend it rather than duplicating its body — and crucially, an overriding `__init__` should call `super().__init__(...)` so the parent's setup still runs and the base attributes exist. When the relationship is "has a" rather than "is a" (an account *has a* transaction log), prefer **composition** — store the other object as an attribute — over inheritance.

Finally, make your objects feel native with **dunder methods**. `__repr__` gives a useful, unambiguous string for debugging and the REPL (the single highest-leverage dunder to add). `__eq__` defines what value-equality means so `==` compares contents instead of identity; pair it with `__hash__` if instances must go in sets or dict keys. `__len__`, `__getitem__`, `__iter__`, `__lt__`, and the arithmetic dunders let `len()`, indexing, iteration, sorting, and `+` work on your type. Define the hooks your object should answer to, and the rest of Python's syntax cooperates for free.

## complexity
time: Object creation and attribute access are O(1) — an instance is essentially a dict (`__dict__`) under the hood, so reading `self.x` is a hashed lookup. Method dispatch walks the class's MRO (method-resolution order) to find the method, which is O(depth of the inheritance chain), effectively constant for normal hierarchies. The cost of a method body itself is whatever algorithm you wrote.
space: Each instance stores its own attributes (O(number of instance attributes) per object); methods and class attributes are stored once on the class and shared, not copied per instance. Defining `__slots__` replaces the per-instance dict with a fixed array, cutting memory when you create very many small objects.
notes: OOP organises code; it doesn't change asymptotics. "Bundle data with behaviour" is a design win, not a speed one — the Big-O of your operations is set by the data structures and algorithms inside the methods, not by wrapping them in a class.

## pitfalls
- **Mutable class attribute shared across instances.** A `class Cart: items = []` declared in the class body is **one list** shared by every instance — `a.items.append(x)` shows up in `b.items`. Per-instance mutable state must be created in `__init__` (`self.items = []`); keep class attributes immutable (numbers, strings, tuples).
- **Forgetting `self`.** Defining `def deposit(amt):` (no `self`) or calling `deposit(50)` instead of `self.deposit(50)` raises `TypeError: deposit() takes 1 positional argument but 2 were given`, because Python always passes the instance as the first argument. Every instance method's first parameter is `self`.
- **Overriding `__init__` without `super()`.** A subclass `__init__` that doesn't call `super().__init__(...)` skips the parent's setup, so the base-class attributes never get created and later `self.bal` lookups blow up with `AttributeError`. Override, then immediately delegate to the parent.
- **`is` vs `==` / missing `__eq__`.** `is` tests *identity* (same object in memory); `==` tests *value* — but only if you've defined `__eq__`. Without it, `==` falls back to identity, so two distinct objects with identical data compare unequal. Use `is` only for `None`/singletons; define `__eq__` for value-equality.

## interviewTips
- Say the four words out loud when modelling: "A class is a blueprint, an instance is built from it, `self` is the instance, `__init__` is the constructor." It signals you understand the mechanism, not just the syntax.
- Distinguish instance vs class attributes precisely — "per-object state goes in `__init__` on `self`; shared values go in the class body, and they must be immutable or every instance mutates the same object." The mutable-default trap is a classic gotcha question.
- Know `is` vs `==` cold and tie it to `__eq__`: "`is` is identity, `==` is value-equality and only works if I define `__eq__`." Mention `__repr__` as the first dunder you'd add to any class for debuggability.

## keyTakeaways
- A class is a blueprint; each `ClassName()` builds an independent instance. `__init__` sets up per-instance state on `self`, methods take `self` to reach that state, and instance attributes are per-object while class attributes are shared by the whole type.
- Inheritance models "is-a": a subclass gets every parent method for free, overrides only what differs, and calls `super()` (especially `super().__init__`) to reuse rather than duplicate the parent's behaviour; use composition for "has-a".
- Dunder methods wire your object into Python's syntax — `__repr__` for debuggable output, `__eq__` for value-equality (`==` vs identity `is`), `__len__`/`__getitem__`/`__iter__` for built-in operations — so custom types behave like native ones.

## code.python
```python
class Animal:
    kingdom = "Animalia"                     # CLASS attribute — shared by every instance

    def __init__(self, name, sound="..."):   # constructor: runs on each new object
        self.name = name                     # INSTANCE attributes — one set per object
        self.sound = sound

    def speak(self):                         # instance method — self IS the object
        return f"{self.name} says {self.sound}"

    def __repr__(self):                      # dunder -> controls repr(obj) / debugger
        return f"Animal(name={self.name!r}, sound={self.sound!r})"

    def __eq__(self, other):                 # dunder -> defines == by value
        return (isinstance(other, Animal)
                and self.name == other.name
                and self.sound == other.sound)


class Dog(Animal):                           # Dog IS-A Animal (inheritance)
    def __init__(self, name):
        super().__init__(name, sound="Woof") # reuse the parent's setup

    def speak(self):                         # OVERRIDE the parent's method
        return super().speak() + " (and wags its tail)"  # extend via super()


a = Animal("Generic", "Hmm")
d = Dog("Rex")

print(a.speak())              # Generic says Hmm
print(d.speak())              # Rex says Woof (and wags its tail)

print(a.kingdom, d.kingdom)   # Animalia Animalia   (class attr shared, even by Dog)
print(a.name, d.name)         # Generic Rex         (instance attrs differ per object)
print(isinstance(d, Animal))  # True                (Dog is-a Animal)

print(repr(d))                # Animal(name='Rex', sound='Woof')   (__repr__)

d2 = Dog("Rex")
print(d == d2)                # True   (__eq__ compares by value)
print(d is d2)                # False  (is compares identity — different objects)
```

## code.javascript
```javascript
class Animal {
  static kingdom = "Animalia";          // static (class) field — shared

  constructor(name, sound = "...") {     // ~ __init__
    this.name = name;                    // instance fields
    this.sound = sound;
  }

  speak() {                              // instance method (this ~ self)
    return `${this.name} says ${this.sound}`;
  }

  toString() {                           // ~ __repr__
    return `Animal(name='${this.name}', sound='${this.sound}')`;
  }

  equals(other) {                        // JS has no == hook; use a method
    return other instanceof Animal
      && this.name === other.name && this.sound === other.sound;
  }
}

class Dog extends Animal {               // inheritance
  constructor(name) { super(name, "Woof"); }      // reuse parent setup
  speak() { return super.speak() + " (and wags its tail)"; }  // override + super
}

const a = new Animal("Generic", "Hmm");
const d = new Dog("Rex");

console.log(a.speak());                  // Generic says Hmm
console.log(d.speak());                  // Rex says Woof (and wags its tail)
console.log(Animal.kingdom, Dog.kingdom);// Animalia Animalia
console.log(a.name, d.name);             // Generic Rex
console.log(d instanceof Animal);        // true
console.log(d.toString());               // Animal(name='Rex', sound='Woof')

const d2 = new Dog("Rex");
console.log(d.equals(d2));               // true   (value equality)
console.log(d === d2);                   // false  (identity)
```

## code.java
```java
public class Oop {
    static class Animal {
        static String kingdom = "Animalia";        // class attribute — shared
        String name, sound;                         // instance attributes

        Animal(String name, String sound) {         // ~ __init__
            this.name = name;
            this.sound = sound;
        }

        String speak() { return name + " says " + sound; }   // instance method

        @Override public String toString() {        // ~ __repr__
            return "Animal(name='" + name + "', sound='" + sound + "')";
        }

        @Override public boolean equals(Object o) { // ~ __eq__
            if (!(o instanceof Animal other)) return false;
            return name.equals(other.name) && sound.equals(other.sound);
        }
    }

    static class Dog extends Animal {               // inheritance
        Dog(String name) { super(name, "Woof"); }   // reuse parent setup
        @Override String speak() {                  // override + super
            return super.speak() + " (and wags its tail)";
        }
    }

    public static void main(String[] args) {
        Animal a = new Animal("Generic", "Hmm");
        Dog d = new Dog("Rex");

        System.out.println(a.speak());              // Generic says Hmm
        System.out.println(d.speak());              // Rex says Woof (and wags its tail)
        System.out.println(Animal.kingdom + " " + Dog.kingdom); // Animalia Animalia
        System.out.println(a.name + " " + d.name);  // Generic Rex
        System.out.println(d instanceof Animal);    // true
        System.out.println(d);                      // Animal(name='Rex', sound='Woof')

        Dog d2 = new Dog("Rex");
        System.out.println(d.equals(d2));           // true  (value)
        System.out.println(d == d2);                // false (identity)
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <string>
using namespace std;

struct Animal {
    static string kingdom;                   // class attribute — shared
    string name, sound;                      // instance attributes

    Animal(string name, string sound = "...") : name(name), sound(sound) {}  // ~ __init__

    virtual string speak() const {           // instance method (virtual -> overridable)
        return name + " says " + sound;
    }
    string repr() const {                    // ~ __repr__
        return "Animal(name='" + name + "', sound='" + sound + "')";
    }
    bool operator==(const Animal& o) const { // ~ __eq__ (value equality)
        return name == o.name && sound == o.sound;
    }
};
string Animal::kingdom = "Animalia";

struct Dog : Animal {                        // inheritance
    Dog(string name) : Animal(name, "Woof") {}          // reuse parent setup
    string speak() const override {                     // override + base call
        return Animal::speak() + " (and wags its tail)";
    }
};

int main() {
    Animal a("Generic", "Hmm");
    Dog d("Rex");

    cout << a.speak() << "\n";                           // Generic says Hmm
    cout << d.speak() << "\n";                           // Rex says Woof (and wags its tail)
    cout << Animal::kingdom << " " << Dog::kingdom << "\n"; // Animalia Animalia
    cout << a.name << " " << d.name << "\n";             // Generic Rex
    cout << d.repr() << "\n";                            // Animal(name='Rex', sound='Woof')

    Dog d2("Rex");
    cout << (d == d2) << "\n";                           // 1  (value equality)
    return 0;
}
```
