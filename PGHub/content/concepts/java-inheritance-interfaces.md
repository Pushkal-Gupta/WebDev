---
slug: java-inheritance-interfaces
module: java-language
title: Inheritance and Interfaces
subtitle: A base-type reference can point at any subclass object, and the object it points at — not the declared type — decides which method runs.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 13
prereqs: [java-classes-objects]
relatedProblems: []
references:
  - title: "Oracle Java Tutorials — Inheritance (subclasses & superclasses)"
    url: "https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html"
    type: docs
  - title: "Oracle Java Tutorials — Using the Keyword super"
    url: "https://docs.oracle.com/javase/tutorial/java/IandI/super.html"
    type: docs
  - title: "Oracle Java Tutorials — Abstract Methods and Classes"
    url: "https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html"
    type: docs
  - title: "Oracle Java Tutorials — Defining an Interface"
    url: "https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html"
    type: docs
  - title: "Oracle Java Tutorials — Polymorphism"
    url: "https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html"
    type: docs
  - title: "Baeldung — Inheritance in Java"
    url: "https://www.baeldung.com/java-inheritance"
    type: article
  - title: "Baeldung — Polymorphism in Java"
    url: "https://www.baeldung.com/java-polymorphism"
    type: article
status: published
---

## intro
Inheritance lets one class build on another instead of restating it: a subclass written with `extends` inherits every field and method of its superclass and then adds or replaces what it needs. An interface goes further and describes only a *capability* — a list of method signatures any class can promise to fulfill with `implements`. Together they unlock polymorphism: a single reference typed as the superclass or interface can point at many different concrete objects, and Java calls the right overridden method for whichever object is actually there. This is the backbone of reusable, extensible Java design.

## whyItMatters
Almost every Java framework you touch — collections, streams, servlets, Spring, JDBC — hands you a supertype and quietly runs your subtype behind it. `List<String> names` might really be an `ArrayList` or a `LinkedList`; you code against `List` and never care which. That indirection is inheritance and interfaces at work, and it is why you can swap implementations without rewriting callers. Understanding how a base-type reference dispatches to the real object's method — dynamic dispatch — is what separates copy-paste code from designs that extend cleanly. Get it wrong and you end up with brittle `instanceof` ladders and duplicated logic; get it right and adding a new type means writing one class, touching nothing else.

## intuition
The core relationship is **is-a**. A `Dog` *is an* `Animal`. A `SavingsAccount` *is an* `Account`. When `class Dog extends Animal`, a `Dog` object literally contains everything an `Animal` has — its fields, its methods — plus whatever the `Dog` adds. So anywhere the code expects an `Animal`, a `Dog` fits, because a `Dog` can do everything an `Animal` can. Inheritance is not "sharing code" as an afterthought; it is a promise that the subtype is a fully valid stand-in for the supertype.

Now picture a reference variable as a **labeled window** onto an object. `Animal ref` is a narrow window: through it you may only touch the `Animal`-shaped parts. But the object on the other side of that window can be a full `Dog`, a full `Cat`, a full `Cow` — the window's label restricts what you can *ask for*, not what the object *is*. When you call `ref.speak()`, Java does not look at the window's label to decide which code to run. It looks at the **actual object** and runs *that* class's `speak()`. This is dynamic dispatch: the object, not the declared type, chooses the method at runtime. Mechanically, each object carries a hidden pointer to its class's method table (a vtable), and the call is a lookup in that table — so a `Dog` behind an `Animal` window still barks.

An **interface** is the same idea reduced to a pure contract. `interface Comparable { int compareTo(Object o); }` says nothing about fields or how the work is done — it only declares "any class that implements me promises to provide `compareTo`." A class can implement many interfaces (many capabilities) even though it can extend only one class. An **abstract class** sits in between: a partial blueprint with some methods written and some left `abstract` for subclasses to fill in. You cannot instantiate it directly — `new Shape()` is illegal when `Shape` is abstract — because it is deliberately incomplete. You instantiate a concrete subclass that finishes the blueprint. Reference, contract, blueprint: three views of the same "program to the general, run the specific" idea.

## visualization
```
              INHERITANCE TREE (is-a)              INTERFACE (a capability contract)

                   Animal                              <<interface>> Speaker
                 (speak())                                  speak(): String
                  /      \                              /        |         \
                 /        \                            /         |          \
              Dog          Cat                      Dog         Cat         Robot
          speak()=Woof  speak()=Meow             implements  implements   implements

  DYNAMIC DISPATCH — the window vs the object

     Animal ref  --------->  [ Dog object ]   ref.speak()  =>  "Woof"
     (declared type)          (actual type)        ^
                                                    |
                          declared type = window (what you may call)
                          actual object = decides WHICH speak() runs  <-- highlighted
```

## bruteForce
The naive way to get different behavior per type is to avoid inheritance entirely. You might give every object a `String type` field and write one giant method: `if (type.equals("dog")) return "Woof"; else if (type.equals("cat")) return "Meow"; ...`. Or you copy-paste a nearly identical `speak()` into `Dog`, `Cat`, and `Cow` classes that share nothing. Or you sprinkle `instanceof` checks at every call site to figure out what you are holding before acting. All three "work" for two types, then rot: every new animal forces you to hunt down and edit every `if`-ladder and every `instanceof` chain, and any one you miss becomes a silent bug.

## optimal
The correct model is **program to the supertype, override in the subtypes, and let dynamic dispatch pick the method for you**. Instead of asking "what type is this?", you call the method and trust the object to answer correctly.

Start by naming the shared capability on a supertype — a base class when there is real shared state or partial behavior, an interface when you only need a contract. Put the general method there: `abstract String speak();` in `abstract class Animal`, or `String speak();` in `interface Speaker`. Each concrete subclass then supplies its own version with `@Override`. That annotation is not decoration: it makes the compiler verify you are genuinely overriding a supertype method with a matching signature. Drop a `@Override` and mistype the name or parameters, and you have silently written a brand-new *overloaded* method that never gets called — `@Override` turns that mistake into a compile error.

With the hierarchy in place, callers hold the supertype: `Animal a = new Dog();` or a whole `Animal[] zoo = { new Dog(), new Cat(), new Cow() };`. Looping and calling `a.speak()` dispatches to each real object's override — the `Dog` barks, the `Cat` meows — with zero `instanceof`, zero type fields, zero branching. Adding a `Sheep` is one new class implementing the contract; every existing loop picks it up untouched. That is the open/closed payoff.

Use **abstract classes** when subtypes share fields or a partial algorithm (a template method that calls abstract steps). Use **interfaces** when unrelated classes need the same capability, or when a class must advertise several capabilities at once — a class implements many interfaces but extends one class. When inheritance would force an awkward is-a ("a `Stack` is-a `Vector`?"), prefer **composition**: hold the helper as a field and delegate, rather than inheriting its whole surface. Reach for `super` to call the parent's constructor (`super(name)` must be the first statement) or to invoke the parent's version of an overridden method (`super.speak()`).

## complexity
time: A virtual (overridden) method call is effectively O(1): the object holds a pointer to its class's method table, and the call is a single indexed lookup plus jump — a constant-cost indirection versus a direct call, not a search. `instanceof` and downcasts are also O(1) type checks.
space: Each class has one shared method table (vtable) in memory regardless of how many objects exist; each object carries a small hidden header pointing at its class. So behavior costs one table per class, not per object.
notes: Java allows single inheritance of classes (one `extends`) but multiple inheritance of interfaces (many `implements`). Default methods let interfaces carry behavior, which is why a class can inherit method bodies from several interfaces without the classic diamond ambiguity — conflicts must be resolved explicitly.

## pitfalls
- **Forgetting `@Override` and accidentally overloading.** Writing `boolean equals(MyType o)` instead of `boolean equals(Object o)` compiles fine but never overrides `Object.equals` — collections keep calling the real one. Fix: always annotate intended overrides with `@Override` so the compiler rejects a signature that does not match a supertype method.
- **Missing or misordered `super(...)` calls.** If the superclass has no no-arg constructor, every subclass constructor must explicitly call `super(args)` as its **first** statement; otherwise the code won't compile. Fix: call `super(...)` first, before any other subclass initialization.
- **Downcasting without checking.** `Animal a = new Cat(); Dog d = (Dog) a;` compiles but throws `ClassCastException` at runtime. Fix: guard with `if (a instanceof Dog d)` (pattern matching) before casting, or redesign so the cast is unnecessary.
- **Fragile base class / deep hierarchies.** A change in a superclass silently alters every subclass, and 5-level-deep trees become impossible to reason about. Fix: keep hierarchies shallow, favor composition over inheritance, and mark classes/methods `final` when they must not be extended or overridden.
- **Trying to instantiate an abstract class or leaving abstract methods unimplemented.** `new Shape()` is illegal when `Shape` is abstract, and a concrete subclass that skips an abstract method won't compile. Fix: instantiate a concrete subclass and implement every abstract method it inherits.

## interviewTips
- Define overriding vs overloading crisply: overriding replaces a supertype method with the *same* signature (resolved at runtime by the object — dynamic dispatch); overloading is *different* parameters resolved at compile time by the declared types. Interviewers love the `equals(Object)` vs `equals(MyType)` trap.
- Be ready to contrast abstract class vs interface: abstract class = "is-a" with shared state/partial implementation and single inheritance; interface = "can-do" capability with multiple inheritance and (since Java 8) default methods. State when you'd choose each.
- Explain dynamic dispatch mechanically — the object carries a method-table pointer and the JVM looks up the override at call time — and note that `static`, `private`, and `final` methods are *not* dynamically dispatched (they bind at compile time), which is a common follow-up.

## keyTakeaways
- `extends` gives a subclass everything its superclass has plus more (is-a); `implements` promises to fulfill an interface's contract. A class extends one class but implements many interfaces.
- A base-type reference can point at any subclass object, and calling an overridden method dispatches to the **actual object's** version at runtime — this is polymorphism, and `@Override` guards you against silently overloading instead.
- Program to the supertype (class or interface) and let dynamic dispatch choose the method — adding a new subtype then means writing one class and editing no existing callers.

## code.python
```python
# Python has no interfaces keyword — a base class plus duck typing does the job.
from abc import ABC, abstractmethod

class Animal(ABC):                 # abstract base: can't instantiate directly
    def __init__(self, name):
        self.name = name
    @abstractmethod
    def speak(self):               # subclasses must override
        ...

class Dog(Animal):
    def speak(self):               # override
        return "Woof"

class Cat(Animal):
    def speak(self):               # override
        return "Meow"

# A list of the base type holding different subclass objects -> dynamic dispatch.
zoo = [Dog("Rex"), Cat("Milo")]
for a in zoo:
    print(a.name, "says", a.speak())   # the ACTUAL object decides speak()

# Duck typing: anything with speak() fits, no shared base needed.
class Robot:
    def speak(self):
        return "Beep"
print("Robot says", Robot().speak())
```

## code.javascript
```javascript
// JS uses prototypal classes: extends + super + method override.
class Animal {
  constructor(name) { this.name = name; }
  speak() { return "..."; }          // base version
}

class Dog extends Animal {
  speak() { return "Woof"; }         // override
}

class Cat extends Animal {
  constructor(name) { super(name); } // super() calls the parent constructor
  speak() { return "Meow"; }         // override
}

// A base-type array holding different subclass objects: dispatch by real type.
const zoo = [new Dog("Rex"), new Cat("Milo")];
for (const a of zoo) {
  console.log(`${a.name} says ${a.speak()}`);  // Dog -> Woof, Cat -> Meow
}
```

## code.java
```java
// Abstract base + two overriding subclasses + an interface capability.
// Only Main is public; the helper types are package-private in the same file (legal).
interface Named {                       // a capability contract
    String name();
}

abstract class Animal implements Named { // partial blueprint, cannot be instantiated
    private final String name;
    Animal(String name) { this.name = name; }

    @Override
    public String name() { return name; } // shared, concrete

    abstract String speak();               // each subclass must supply this
}

class Dog extends Animal {
    Dog(String name) { super(name); }      // super(...) calls the base constructor
    @Override
    String speak() { return "Woof"; }      // override
}

class Cat extends Animal {
    Cat(String name) { super(name); }
    @Override
    String speak() { return "Meow"; }      // override
}

class Cow extends Animal {
    Cow(String name) { super(name); }
    @Override
    String speak() { return "Moo"; }       // override
}

public class Main {
    public static void main(String[] args) {
        // A base-type array holding different subclass objects.
        Animal[] zoo = { new Dog("Rex"), new Cat("Milo"), new Cow("Daisy") };

        // The reference is typed Animal, but each real object decides speak().
        for (Animal ref : zoo) {           // dynamic dispatch in action
            System.out.println(ref.name() + " says " + ref.speak());
        }

        // Same object, base-type window: still runs the Dog override.
        Animal a = new Dog("Buddy");
        System.out.println(a.name() + " (declared Animal) says " + a.speak());
    }
}
```

## code.cpp
```cpp
// C++ needs 'virtual' for dynamic dispatch; 'override' is the checked opt-in.
#include <iostream>
#include <string>
#include <vector>
#include <memory>
using namespace std;

struct Animal {
    string name;
    Animal(string n) : name(move(n)) {}
    virtual string speak() const = 0;   // pure virtual -> abstract base
    virtual ~Animal() = default;
};

struct Dog : Animal {
    Dog(string n) : Animal(move(n)) {}
    string speak() const override { return "Woof"; }  // override
};

struct Cat : Animal {
    Cat(string n) : Animal(move(n)) {}
    string speak() const override { return "Meow"; }  // override
};

int main() {
    // Base pointers holding different subclass objects: dispatch by real type.
    vector<unique_ptr<Animal>> zoo;
    zoo.push_back(make_unique<Dog>("Rex"));
    zoo.push_back(make_unique<Cat>("Milo"));

    for (const auto& ref : zoo)                     // Animal* window
        cout << ref->name << " says " << ref->speak() << "\n";
    return 0;
}
```
