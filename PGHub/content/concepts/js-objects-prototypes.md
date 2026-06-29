---
slug: js-objects-prototypes
module: javascript-language
title: Objects & Prototypes
subtitle: Objects as key-value bags, the hidden prototype link every object carries, how a property lookup walks the chain, and why class is just sugar over all of it.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: [js-functions-closures]
relatedProblems: []
references:
  - title: "MDN — Inheritance and the prototype chain"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain"
    type: docs
  - title: "MDN — Classes"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes"
    type: docs
  - title: "javascript.info — Prototypal inheritance"
    url: "https://javascript.info/prototype-inheritance"
    type: article
  - title: "javascript.info — Class basic syntax"
    url: "https://javascript.info/class"
    type: article
status: published
---

## intro
An object in JavaScript is a bag of **key-value pairs** — `{ name: "Rex", legs: 4 }` — and that's most of what you use day to day. But every object also carries a hidden link to another object, its **prototype**, and that link is the entire inheritance system: when you read a property the object doesn't have, JavaScript follows the link to the prototype, then *its* prototype, walking a chain until it finds the property or hits `null`. The `class` keyword you'll write looks like classical inheritance, but it's a thin layer of sugar over this prototype chain. Understand the chain and classes become obvious.

## whyItMatters
Prototypes are JavaScript's one inheritance mechanism, so they're behind everything: why `[].map` works even though you never put `map` on your array, why `"abc".toUpperCase()` resolves, why two instances of a class share one copy of each method instead of carrying their own. Misunderstand it and you get real bugs — a property accidentally shared across all instances because you put it on the prototype, a method that's `undefined` because `this` was lost, a surprising `for…in` loop that walks inherited keys. Interviewers love prototype questions precisely because they separate people who memorized `class` syntax from people who know what it compiles to. And modern frameworks lean on this model constantly, so reading it fluently pays off everywhere.

## intuition
Think of every object as having a secret arrow pointing to another object — its prototype. Your `dog` object holds its own properties (`name`, `legs`), and its arrow points to some `animal` object that holds shared behavior (`describe`). When you write `dog.describe()`, JavaScript first checks `dog` itself: no `describe` here. So it follows the arrow to `animal`: found it. The method runs with `this` bound to `dog` — the object you started the lookup from — which is why `this.name` correctly reads `"Rex"`. That's the whole trick: **own properties first, then walk up the prototype chain**, and `this` is always the object the lookup began on, not the object where the method was found.

The chain has an end. A plain object's prototype is `Object.prototype` (which is why every object has `hasOwnProperty` and `toString` — they live there), and `Object.prototype`'s own prototype is `null`. So a lookup for a property that doesn't exist anywhere walks `dog → animal → Object.prototype → null` and finally returns `undefined`. Setting a property, by contrast, never walks the chain — `dog.color = "brown"` always creates an *own* property on `dog`, even if a `color` exists higher up; assignment writes locally, only reads inherit.

Now `class`. A class declaration creates a constructor function plus a prototype object, and the methods you write inside the class body are placed on that prototype — so all instances **share one copy** of each method rather than each carrying its own. `extends` simply links one prototype to another, building the chain; `super.method()` reaches up to the parent's version; `new` creates a fresh object whose prototype arrow points at the class's prototype, then runs the constructor with `this` set to that new object. None of this is a different mechanism from the `dog`/`animal` example — `class` is the readable spelling of "make a prototype, put methods on it, link the chain." Knowing that, you can predict exactly what any class does by translating it back to objects and arrows.

## visualization
```
property lookup walks UP the chain (own properties first):

   dog  { name: "Rex", legs: 4 }          dog.describe()  -> not here, follow arrow
     │  [[Prototype]]                      dog.name        -> found here (own)
     ▼
   animal  { describe() {...} }            describe FOUND here; runs with this = dog
     │  [[Prototype]]
     ▼
   Object.prototype  { hasOwnProperty, toString }   shared by every object
     │  [[Prototype]]
     ▼
   null                                    end of chain — missing prop -> undefined

   class Square extends Shape  ==  Square.prototype --[[Prototype]]--> Shape.prototype
```

## bruteForce
Without inheritance you'd copy shared behavior into every object. Build a hundred `dog` objects and give each its own `describe` function and you've made a hundred identical functions, wasting memory and guaranteeing that fixing a bug means editing every copy. The pre-class way to avoid that was raw constructor functions plus manual prototype wiring: write a `function Dog(){}`, hang methods off `Dog.prototype` by hand, and chain inheritance with the fiddly `Child.prototype = Object.create(Parent.prototype)` dance, remembering to reset `constructor`. It works and it's exactly what classes do underneath, but the boilerplate is error-prone and the intent is buried — one forgotten line and the chain breaks silently.

## optimal
Reach for `class` syntax for the common case — it's the clear, standard way to define a type with shared methods and an inheritance chain, and it compiles to exactly the prototype wiring you'd otherwise write by hand. Put **shared behavior in methods** (which land on the prototype, shared by all instances) and **per-instance data on `this`** in the constructor. That split is the whole discipline: state that differs per object goes on the instance; behavior that's identical across objects goes on the prototype, defined once. Use `extends` to build a chain and `super` to call up to a parent's constructor or method rather than duplicating its logic.

When you don't need a full type, plain object literals with a shared prototype via `Object.create(proto)` give you the same inheritance with less ceremony — useful for one-off objects or configuration. Prefer `Object.create(null)` for a pure dictionary you'll use as a hash map, because it has *no* prototype and therefore no inherited keys like `toString` to collide with your data. Be deliberate about where a property lives: read `obj.hasOwnProperty(key)` (or `Object.hasOwn(obj, key)`) when you need to distinguish own properties from inherited ones, and iterate with `Object.keys`/`for…of` over entries rather than `for…in`, which walks inherited enumerable keys too. Avoid mutating an object's prototype after creation (`Object.setPrototypeOf` on a live object) — engines optimize for a stable shape, and changing the chain at runtime is slow; set the prototype at creation instead. The throughline: let `class` express the structure, keep shared methods on the prototype and mutable state on the instance, and always know which level of the chain a given property lives on.

## complexity
time: Reading an own property is O(1). Reading an inherited property is O(d) in the depth of the prototype chain — each miss walks one link up — but real chains are shallow (typically 2-4 links), so it's effectively constant. Writing a property is always O(1): assignment creates an own property and never walks the chain.
space: Methods on a prototype are stored **once** and shared by every instance, so N instances of a class cost O(N) for their own data plus O(1) for the shared methods — versus O(N·m) if each instance carried its own copy of m methods. That sharing is the main efficiency win of the prototype model.
notes: `instanceof` walks the prototype chain to check membership, so it's O(d) in chain depth. Mutating a live object's prototype (`Object.setPrototypeOf`) is slow because it deoptimizes the engine's shape assumptions — set the prototype at creation, not after.

## pitfalls
- **Assignment never inherits.** `obj.x = 1` always creates an *own* property on `obj`, even if `x` exists up the chain. Only *reads* walk the prototype chain; writes are local — a frequent source of "why didn't the parent's value change?" confusion.
- **`this` is lost when a method is detached.** `const f = obj.method; f()` calls `f` with no receiver, so `this` is `undefined`/global and the lookup breaks. Bind it or wrap it in an arrow — the prototype found the method, but `this` is set by the call.
- **Putting mutable state on the prototype shares it.** A `class` field that's an object/array placed on the prototype (or a shared object) is shared across all instances — push to it from one and every instance sees the change. Per-instance state belongs on `this` in the constructor.
- **`for…in` walks inherited keys.** It iterates enumerable properties up the whole chain, not just own ones, so it can surprise you with inherited keys. Use `Object.keys(obj)`/`for…of` over `Object.entries`, or guard with `Object.hasOwn(obj, key)`.
- **Using a plain object as a hash map collides with inherited keys.** A key like `"toString"` or `"constructor"` already exists on `Object.prototype`, so `if (map["toString"])` is truthy even when you never set it. Use a real `Map`, or `Object.create(null)` for a prototype-less dictionary.

## interviewTips
- Trace a lookup out loud: "check own properties, then follow `[[Prototype]]` up the chain to `Object.prototype`, then `null`; `this` stays bound to the object the lookup started on." That single sentence answers most prototype questions.
- Say plainly that `class` is sugar: "a class is a constructor function plus a prototype object; methods go on the prototype and are shared, `extends` links the chain, `super` reaches the parent." It shows you know what compiles underneath.
- Distinguish own vs inherited and reads vs writes: "reads inherit, writes are always local; `hasOwnProperty`/`Object.hasOwn` tells the difference." Mentioning `Object.create(null)` for map-like objects is a nice depth signal.

## keyTakeaways
- Every object has a hidden prototype link; reading a missing property walks up the chain (`obj → prototype → Object.prototype → null`) until found, while `this` stays bound to the object the lookup began on.
- `class` is syntax sugar over prototypes: methods live on the shared prototype (one copy for all instances), per-instance state lives on `this`, `extends` links the chain, and `super` calls the parent.
- Reads inherit but writes are always local; use `Object.hasOwn` to tell own from inherited properties, and `Map` or `Object.create(null)` when you need a clean dictionary.

## code.javascript
```javascript
// An object is a bag of key -> value properties.
const dog = { name: "Rex", legs: 4 };
console.log("name:", dog.name, "| legs:", dog.legs); // Rex 4

// Every object has a hidden [[Prototype]] link. A missing property is looked up
// by walking UP that chain until it's found (or reaching null).
const animal = {
  describe() {
    return this.name + " has " + this.legs + " legs"; // this = the lookup's start
  },
};
Object.setPrototypeOf(dog, animal);
console.log("describe:", dog.describe());                      // Rex has 4 legs (found on animal)
console.log("own name?", dog.hasOwnProperty("name"));         // true
console.log("own describe?", dog.hasOwnProperty("describe")); // false (inherited)

// `class` is syntax sugar over this same prototype machinery.
class Shape {
  constructor(sides) {
    this.sides = sides;
  }
  describe() {
    return "a shape with " + this.sides + " sides";
  }
}
class Square extends Shape {
  constructor() {
    super(4);
  }
  describe() {
    return "square: " + super.describe(); // reach up to the parent's method
  }
}
const sq = new Square();
console.log("square:", sq.describe());           // square: a shape with 4 sides
console.log("is a Shape?", sq instanceof Shape); // true

// The method lives once on the prototype, shared by all instances (not copied).
console.log(
  "shared method?",
  Object.getPrototypeOf(sq).describe === Square.prototype.describe
); // true
```

## code.python
```python
# Python objects are class instances; attribute lookup walks the class chain (MRO).
class Animal:
    def __init__(self, name, legs):
        self.name = name
        self.legs = legs
    def describe(self):
        return f"{self.name} has {self.legs} legs"

class Dog(Animal):
    def describe(self):                       # override, then call the parent's version
        return "dog: " + super().describe()

rex = Dog("Rex", 4)
print("name:", rex.name, "| legs:", rex.legs)         # Rex 4
print("describe:", rex.describe())                    # dog: Rex has 4 legs
print("is Animal?", isinstance(rex, Animal))          # True

# 'name' is an instance attribute; 'describe' lives on the class, shared by all.
print("own attr?", "name" in rex.__dict__)            # True
print("inherited?", "describe" not in rex.__dict__)   # True
print("chain:", [c.__name__ for c in Dog.__mro__])    # ['Dog', 'Animal', 'object']
```

## code.java
```java
public class Shapes {
    static class Shape {
        int sides;
        Shape(int sides) { this.sides = sides; }
        String describe() { return "a shape with " + sides + " sides"; }
    }
    static class Square extends Shape {
        Square() { super(4); }
        @Override String describe() { return "square: " + super.describe(); }
    }

    public static void main(String[] args) {
        Square sq = new Square();
        System.out.println("sides: " + sq.sides);                  // 4
        System.out.println("describe: " + sq.describe());          // square: a shape with 4 sides
        System.out.println("is a Shape? " + (sq instanceof Shape)); // true
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <string>
using namespace std;

struct Shape {
    int sides;
    Shape(int s) : sides(s) {}
    virtual string describe() const {
        return "a shape with " + to_string(sides) + " sides";
    }
    virtual ~Shape() = default;
};

struct Square : Shape {
    Square() : Shape(4) {}
    string describe() const override {
        return "square: " + Shape::describe();   // call the parent's version
    }
};

int main() {
    Square sq;
    cout << "sides: " << sq.sides << "\n";           // 4
    cout << "describe: " << sq.describe() << "\n";   // square: a shape with 4 sides

    Shape* p = &sq;                                  // base pointer -> derived object
    cout << "via base ptr: " << p->describe() << "\n"; // square: ... (virtual dispatch)
    return 0;
}
```
