---
slug: design-pattern-visitor
module: foundations
title: Visitor Pattern
subtitle: Add operations to data structures without modifying them
difficulty: Advanced
position: 405
estimatedReadMinutes: 15
prereqs: []
relatedProblems: []
references:
  - https://refactoring.guru/design-patterns/visitor
  - https://martinfowler.com/eaaDev/AcyclicVisitor.html
  - https://github.com/DovAmir/awesome-design-patterns
status: published
---

## intro
The Visitor pattern separates an algorithm from the data it operates on. Each node in a data structure exposes an accept method that hands itself to a visitor object. The visitor implements one method per concrete node type. New operations are added by writing new visitors; the data structure stays untouched.

## whyItMatters
Composite data structures (abstract syntax trees, scene graphs, document models) are often stable in shape but unstable in the operations applied to them. A compiler adds new passes; a renderer adds new export formats. Stuffing each operation into the nodes themselves bloats them and breaks the open-closed principle. Visitor inverts the relationship.

## intuition
Imagine a museum with sculptures, paintings, and installations. Different visitors — an insurance appraiser, an art historian, a maintenance crew — each have something to say about every exhibit, but the exhibits themselves do not know about appraisal or curation. Each visitor brings its own logic and tours the same gallery.

## visualization
Draw two parallel hierarchies: the element hierarchy (Sculpture, Painting) and the visitor hierarchy (Appraiser, Historian). The element side has one method, accept(visitor), implemented per concrete class. The visitor side has one method per concrete element. At runtime accept calls visitor.visitSculpture(this), and dynamic dispatch handles both axes.

## bruteForce
Add a new method to every node class for every new operation. The hierarchy swells. Touching shared base classes risks breaking unrelated code. Adding an operation requires permission to edit every node, which is impossible for sealed third-party libraries.

## optimal
Define a Visitor interface with visit methods, one per concrete element type. Each element implements accept(visitor) by calling the matching visit method on itself. This is called double dispatch — the right method is selected based on both the element type and the visitor type. Adding a new operation now means writing one new visitor class.

## complexity
Each traversal is O(n) in elements, with O(1) dispatch per element. Memory is O(d) for recursion depth on tree structures. Adding a new visitor is O(k) effort in number of element types. Adding a new element type, however, is O(v) effort across all visitors — Visitor optimizes for stable hierarchies.

## pitfalls
Adding a new element type forces every existing visitor to be updated, the dual problem of the open-closed benefit. The accept boilerplate is repetitive — generate it when possible. Visitors that need access to private node fields tempt encapsulation breaks; favor public accessors. Recursive visitors must mind stack depth on deep trees.

## interviewTips
Bring up Visitor when asked about traversing or transforming an AST, evaluating expression trees, or implementing multiple report formats over the same model. Mention double dispatch explicitly — it impresses interviewers. Note that in languages with pattern matching (Scala, Rust, modern Java) sealed hierarchies plus switch can replace the boilerplate.

## code.python
```python
class Visitor:
    def visit_circle(self, c): ...
    def visit_square(self, s): ...

class Shape:
    def accept(self, v): ...

class Circle(Shape):
    def __init__(self, r): self.r = r
    def accept(self, v): return v.visit_circle(self)

class Square(Shape):
    def __init__(self, side): self.side = side
    def accept(self, v): return v.visit_square(self)

class AreaVisitor(Visitor):
    def visit_circle(self, c): return 3.14159 * c.r * c.r
    def visit_square(self, s): return s.side * s.side
```

## code.javascript
```javascript
class Circle {
  constructor(r) { this.r = r; }
  accept(v) { return v.visitCircle(this); }
}

class Square {
  constructor(side) { this.side = side; }
  accept(v) { return v.visitSquare(this); }
}

class AreaVisitor {
  visitCircle(c) { return Math.PI * c.r * c.r; }
  visitSquare(s) { return s.side * s.side; }
}
```

## code.java
```java
interface Visitor<T> {
    T visitCircle(Circle c);
    T visitSquare(Square s);
}

interface Shape {
    <T> T accept(Visitor<T> v);
}

class Circle implements Shape {
    final double r;
    Circle(double r) { this.r = r; }
    public <T> T accept(Visitor<T> v) { return v.visitCircle(this); }
}

class Square implements Shape {
    final double side;
    Square(double s) { this.side = s; }
    public <T> T accept(Visitor<T> v) { return v.visitSquare(this); }
}

class AreaVisitor implements Visitor<Double> {
    public Double visitCircle(Circle c) { return Math.PI * c.r * c.r; }
    public Double visitSquare(Square s) { return s.side * s.side; }
}
```

## code.cpp
```cpp
class Circle;
class Square;

struct Visitor {
    virtual double visit(Circle&) = 0;
    virtual double visit(Square&) = 0;
    virtual ~Visitor() = default;
};

struct Shape {
    virtual double accept(Visitor& v) = 0;
    virtual ~Shape() = default;
};

struct Circle : Shape {
    double r;
    Circle(double r) : r(r) {}
    double accept(Visitor& v) override { return v.visit(*this); }
};

struct Square : Shape {
    double side;
    Square(double s) : side(s) {}
    double accept(Visitor& v) override { return v.visit(*this); }
};

struct AreaVisitor : Visitor {
    double visit(Circle& c) override { return 3.14159 * c.r * c.r; }
    double visit(Square& s) override { return s.side * s.side; }
};
```
