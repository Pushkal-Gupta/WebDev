---
slug: java-classes-objects
module: java-language
title: Classes and Objects
subtitle: A class is the cookie-cutter and each object is a stamped cookie — same shape, its own filling — while static members live on the cutter itself.
difficulty: Beginner
position: 2
estimatedReadMinutes: 12
prereqs: [java-basics-types]
relatedProblems: []
references:
  - title: "Oracle Java Tutorials — Classes"
    url: "https://docs.oracle.com/javase/tutorial/java/javaOO/classes.html"
    type: docs
  - title: "Oracle Java Tutorials — Creating Objects"
    url: "https://docs.oracle.com/javase/tutorial/java/javaOO/objectcreation.html"
    type: docs
  - title: "Oracle Java Tutorials — Using the this Keyword"
    url: "https://docs.oracle.com/javase/tutorial/java/javaOO/thiskey.html"
    type: docs
  - title: "Oracle Java Tutorials — Class Variables (static)"
    url: "https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html"
    type: docs
  - title: "Baeldung — A Guide to Java Classes and Objects"
    url: "https://www.baeldung.com/java-classes-objects"
    type: article
status: published
---

## intro
A class in Java is a blueprint: it declares what a thing *is* (its fields) and what it can *do* (its methods), but it holds no data of its own. An object is a concrete thing built from that blueprint — a specific `BankAccount` with a real owner and a real balance. When you write `new BankAccount("Alice", 100)`, Java allocates memory on the heap, runs the constructor to fill in that instance's fields, and hands you a reference to it. The class is written once; you can stamp out as many independent objects from it as you like, each carrying its own separate state.

## whyItMatters
Classes and objects are the unit of organization for essentially all Java code — collections, streams, Android views, Spring beans, and every library you will import are classes you instantiate. Getting the blueprint-versus-instance distinction right is what lets you reason about state: which data is shared, which is per-object, and who is allowed to change it. Encapsulation — private fields guarded by public methods — is how large programs stay maintainable, because a class controls its own invariants instead of trusting every caller to poke at raw fields. Interviews lean on this constantly: "what's the difference between static and instance," "why make fields private," "what does `this` refer to." Master the model here and object-oriented design, inheritance, and interfaces all build on solid ground.

## intuition
Think of a class as a **cookie-cutter** stamped from sheet metal. The cutter defines the *shape* — a `name` slot, a `balance` slot — but it is not itself a cookie and you cannot eat it. Every time you press it into dough with `new`, you get a fresh **cookie**: same outline, but its own filling. One cookie can be `Alice` with a balance of `100`; the next can be `Bob` with `50`. Change Bob's balance and Alice's is untouched — they occupy separate memory. That separateness is the whole point of an instance: `alice.balance` and `bob.balance` are two different boxes that merely happen to share a shape.

Now imagine a little **tally counter bolted onto the handle of the cutter itself**, not onto any cookie. Every time you stamp a new cookie, you click the counter up by one. That counter belongs to the *cutter* — to the class — so all cookies see the same value, and there is exactly one of it no matter how many cookies exist. That is a **static field**: `static int count` lives on `BankAccount` the class, shared across every instance, accessed as `BankAccount.count`. Instance fields answer "what is true of *this* object"; static fields answer "what is true of the *type as a whole*."

The **constructor** is the stamping ritual. `new BankAccount("Alice", 100)` doesn't just carve out memory — it runs the constructor body, which assigns the arguments into this specific instance's fields and can bump the shared counter. Inside that body, the keyword **`this`** is the cookie currently being stamped: `this.name = name` means "store the parameter `name` into *this* instance's `name` field," disambiguating the field from the identically named parameter. Without `this`, `name = name` would just assign the parameter to itself and the field would stay empty. So: the class is the shape, each object is a stamped copy with its own filling, the constructor fills that copy in, `this` points at the copy being filled, and static members hang off the cutter for everyone to share.

## visualization
```
        class BankAccount            <- blueprint (cookie-cutter)
        +----------------------+
        | field: name : String |     template only, no values
        | field: balance:double|
        | static count : int   |=====> shared on the CLASS: [ 3 ]
        +----------------------+           ^        ^        ^
              | new              stamped    |        |        |
              v                            each new() clicks +1
   +--------------+  +--------------+  +--------------+
   | obj #1       |  | obj #2       |  | obj #3       |
   | name = Alice |  | name = Bob   |  | name = Cara  |
   | balance= 100 |  | balance= 50  |  | balance= 75  |
   +--------------+  +--------------+  +--------------+
   each object owns its OWN name/balance; all see the ONE count
```

## bruteForce
The naive mental model, common when arriving from scripting languages, is to treat a class as nothing more than a bag of public fields — a plain struct or a dictionary you read and write directly (`acct.balance = -999` from anywhere). Under this model there is no gatekeeper: any code can set a balance negative, leave a field null, or break an invariant the class was supposed to protect. Beginners also blur static and instance, imagining every object shares one `balance`, or that a `static` counter belongs to each object separately. Both mistakes come from ignoring that each instance has its own copy of instance fields while static data is shared once. The result is fragile code where state can be corrupted from a distance and where "how many were created" is either wrong or impossible to answer.

## optimal
The correct model has four moving parts working together. **First, make instance fields `private`** and expose behavior through public methods. `private double balance` means only the class's own methods can touch it, so the class enforces its invariants — a `deposit(amount)` method can reject negatives, a `withdraw` can refuse overdrafts. Callers get controlled access through getters/setters (`getBalance()`, or a validating `setName`) instead of raw field pokes. This is **encapsulation**: the class owns and guards its data.

**Second, the constructor initializes instance state.** `BankAccount(String name, double balance)` runs once per `new`, assigning the arguments into this object's fields with the `this.field = field` pattern. Because a field and a constructor parameter often share a name, `this.balance = balance` says "the instance field on the left, the parameter on the right" — `this` is a reference to the object currently being built. Always initialize every field in the constructor rather than relying on Java's defaults (`0`, `null`, `false`), so an object is never born in a half-valid state.

**Third, use `static` for what belongs to the type, not the instance.** A `static int count` incremented in the constructor tracks how many accounts exist across the whole program; it lives on the class and is read as `BankAccount.count`. A `static` method (like a factory or a utility) can be called without any object but cannot touch instance fields, because there is no `this` in a static context.

**Fourth, keep the two accesses straight.** Instance members are reached through an object reference (`alice.getBalance()`); static members through the class (`BankAccount.count`). Read code by asking "is this per-object or per-class?" and the rest follows. Encapsulation plus a disciplined constructor plus a clear static/instance split gives you objects that are always valid and a class that answers questions about the whole population.

## complexity
time: Constructing an object with `new` is O(1) amortized — the JVM bumps a heap pointer, zeroes the fields, and runs the constructor body (itself O(1) for simple field assignments). Method and field access are O(1): a field read is a single memory offset from the object's base address, a virtual method call is one indirection through the class's method table.
space: Each instance costs roughly the sum of its field widths plus a fixed object header (about 12–16 bytes on the HotSpot JVM for the mark word and class pointer, then alignment padding to an 8-byte boundary). N objects cost N times that. A `static` field is stored once with the class metadata regardless of how many instances exist — a shared counter adds no per-object memory.
notes: References themselves are typically 4 bytes (compressed oops) or 8 bytes; the object they point to lives on the heap and is reclaimed by the garbage collector once unreachable. Static data lives for the lifetime of the loaded class, so avoid stuffing large mutable state into statics.

## pitfalls
- **Shadowing a field by forgetting `this`.** Writing `name = name;` in a constructor whose parameter is also `name` assigns the parameter to itself and leaves the field null. Fix: use `this.name = name;` so the left side is unambiguously the instance field.
- **Public mutable fields break encapsulation.** Exposing `public double balance` lets any caller set it to an invalid value, bypassing your checks. Fix: make fields `private` and mutate them only through validating methods (`deposit`, `withdraw`) or setters that enforce invariants.
- **Accessing an instance member from a static context.** A `static` method has no `this`, so referring to an instance field or calling an instance method directly is a compile error ("non-static ... cannot be referenced from a static context"). Fix: take or create an instance and access the member through it, or make the member static if it truly belongs to the class.
- **Relying on default field values instead of initializing.** Leaving a field unset means it silently starts at `0`/`null`/`false`, which often is not a valid state (a null `name`, a zero balance you meant to require). Fix: initialize every field in the constructor and validate the arguments before assigning.

## interviewTips
- Define the split in one line: "A class is a blueprint with no data; an object is an instance with its own copy of the instance fields. Static members belong to the class and are shared across all instances." That single sentence answers most static-vs-instance questions.
- Explain `this` precisely: it is a reference to the current object, used to disambiguate a field from a same-named parameter (`this.x = x`) and to pass the current instance to other methods. Be ready to note a static method has no `this`.
- Justify encapsulation concretely: private fields plus public methods let the class enforce invariants (no negative balance, no null name) in one place, so state can't be corrupted from a distance — this is why libraries hide their internals behind methods.

## keyTakeaways
- The class is the cookie-cutter (shape, no data); each object stamped with `new` owns its own copy of the instance fields, independent of every other object.
- `static` members live on the class itself and are shared by all instances — use them for type-wide data like a creation counter, accessed as `ClassName.member`; a static context has no `this`.
- Encapsulate with private fields plus a constructor that runs `this.field = field` to initialize state, exposing controlled getters/setters so the class always guards its own invariants.

## code.python
```python
# Python: class as blueprint, __init__ constructor, self, and a class variable.
class BankAccount:
    count = 0                       # class variable — shared by ALL instances

    def __init__(self, name, balance):
        self.name = name            # instance field: this object's own copy
        self.balance = balance
        BankAccount.count += 1      # bump the shared counter on the class

    def deposit(self, amount):
        if amount > 0:
            self.balance += amount

    def __str__(self):
        return f"{self.name}: {self.balance}"

alice = BankAccount("Alice", 100)
bob = BankAccount("Bob", 50)
alice.deposit(25)

print(alice)                        # Alice: 125
print(bob)                          # Bob: 50
print("accounts created:", BankAccount.count)   # 2  (shared)
```

## code.javascript
```javascript
// JS: class with a constructor, private-ish fields, and a static field.
class BankAccount {
  static count = 0;                 // static: one copy on the class

  constructor(name, balance) {
    this.name = name;               // per-instance field
    this.balance = balance;
    BankAccount.count += 1;         // increment the shared counter
  }

  deposit(amount) {
    if (amount > 0) this.balance += amount;
  }

  toString() {
    return `${this.name}: ${this.balance}`;
  }
}

const alice = new BankAccount("Alice", 100);
const bob = new BankAccount("Bob", 50);
alice.deposit(25);

console.log(alice.toString());      // Alice: 125
console.log(bob.toString());        // Bob: 50
console.log("accounts created:", BankAccount.count);   // 2
```

## code.java
```java
// Java: a package-private helper class + a public Main that uses it.
// Only ONE public class per file (Main); the helper is package-private.

class BankAccount {
    private String name;               // private instance fields (encapsulated)
    private double balance;
    private static int count = 0;      // static: shared across ALL instances

    BankAccount(String name, double balance) {
        this.name = name;              // 'this' disambiguates field from parameter
        this.balance = balance;
        count++;                       // click the shared counter on the class
    }

    void deposit(double amount) {       // instance method: guards the invariant
        if (amount > 0) {
            this.balance += amount;
        }
    }

    String getName() { return name; }   // getter: controlled read access
    double getBalance() { return balance; }

    static int getCount() {             // static method: no 'this', reads static field
        return count;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount alice = new BankAccount("Alice", 100.0);
        BankAccount bob = new BankAccount("Bob", 50.0);
        BankAccount cara = new BankAccount("Cara", 75.0);

        alice.deposit(25.0);           // Alice's own balance changes, others untouched

        System.out.println(alice.getName() + ": " + alice.getBalance());   // Alice: 125.0
        System.out.println(bob.getName() + ": " + bob.getBalance());       // Bob: 50.0
        System.out.println(cara.getName() + ": " + cara.getBalance());     // Cara: 75.0

        // static count read through the CLASS, not an instance:
        System.out.println("accounts created: " + BankAccount.getCount()); // 3
    }
}
```

## code.cpp
```cpp
// C++: class with a constructor, private members, and a static member.
#include <iostream>
#include <string>
using namespace std;

class BankAccount {
    string name;                       // private by default in a class
    double balance;
public:
    static int count;                  // static member: shared by all instances

    BankAccount(string n, double b) : name(n), balance(b) {  // constructor
        count++;                       // bump the shared counter
    }

    void deposit(double amount) {
        if (amount > 0) balance += amount;
    }

    string getName() const { return name; }
    double getBalance() const { return balance; }
};

int BankAccount::count = 0;            // define the static member once

int main() {
    BankAccount alice("Alice", 100.0);
    BankAccount bob("Bob", 50.0);
    alice.deposit(25.0);

    cout << alice.getName() << ": " << alice.getBalance() << "\n";   // Alice: 125
    cout << bob.getName() << ": " << bob.getBalance() << "\n";       // Bob: 50
    cout << "accounts created: " << BankAccount::count << "\n";      // 2
    return 0;
}
```
