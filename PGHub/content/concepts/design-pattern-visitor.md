---
slug: design-pattern-visitor
module: foundations-patterns
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
- **LLVM / Clang AST passes**: every optimisation pass (dead-code elimination, constant folding, vectoriser) is a Visitor over the IR tree; adding a pass means writing one class, never touching `Instruction.h`.
- **Roslyn (C# compiler)**: `CSharpSyntaxWalker` and `CSharpSyntaxRewriter` are visitors; analysers and refactorings ship as new visitor classes loaded into Visual Studio without rebuilding the compiler.
- **Babel / SWC / TypeScript transformers**: plugins are visitors over the AST. The same source tree gets walked by hundreds of independently-authored visitors at compile time.
- **3D scene graphs (Unity, Godot, Three.js)**: render passes, raycasters, physics queries, bounding-box collectors all visit the same scene hierarchy without modifying `Node`.
- **Document object models (Microsoft Word OOXML, Apple Pages, Pandoc)**: export-to-PDF, export-to-Markdown, spellcheck, accessibility audit — each is a visitor over the same paragraph/run/table tree.
- **SQL query planners (Postgres, DuckDB, Calcite)**: cost estimation, predicate pushdown, join reordering are all visitor passes over the relational plan tree.

The lesson: when a data structure is stable in shape but unstable in operations, Visitor pays for itself the third time you add a new operation. Compilers are the canonical case because new analysis passes ship monthly while the AST evolves on a multi-year cadence.

## intuition
Visitor exists to solve the "expression problem": when you have a hierarchy of N data types and M operations on them, you want to add both new types and new operations without modifying existing code. Most languages let you do one but not the other. Object-oriented inheritance makes adding new types easy (subclass and override) but adding new operations hard (you must edit every existing class to add the method). Functional pattern-matching makes adding new operations easy (write a new function with cases) but adding new types hard (every existing function must be extended). Visitor picks the OO side: types are stable, operations are open.

The mechanical trick is double dispatch. Single dispatch (the normal virtual call) selects a method based on the runtime type of one object — `shape.area()` picks `Circle.area` or `Square.area` based on what `shape` is. But we want to pick a method based on *two* runtime types: the element AND the operation. Languages without true multi-methods (Java, C++, C#, TS, Python without external libs) can't do that directly. The workaround is two single-dispatch calls in sequence.

Here's how it works. The element exposes one method, `accept(visitor)`. Inside `accept`, the element knows its own concrete type (it's running its own method) and calls the visitor's type-specific method: `Circle.accept(v)` calls `v.visitCircle(self)`. Now the visitor's method body knows both types — it knows it's running `visitCircle` (so element type is Circle) and it knows `self` is the visitor's concrete type. Two single-dispatch calls in a row = the method body sees both runtime types. That's double dispatch.

The boilerplate (`accept` in every element, `visitX` in every visitor) is the price of simulating multi-methods. In return you get a free pass over the structure (write the recursive walk once in a base Visitor) and clean separation: a new operation is a new visitor class touching nothing else. Compilers exploit this so hard that LLVM's `Pass` infrastructure is essentially a registry of visitors.

Where Visitor's tradeoff bites: adding a new element type forces every existing visitor to gain a new `visitNewType` method, or risk runtime errors. So Visitor is the right call only when the type hierarchy is *more stable* than the operation set. For compilers, scene graphs, and document models that condition holds — AST node kinds change every few years while passes ship continuously. For domains where new types arrive faster than new operations, Strategy or polymorphic methods on the data classes themselves are the better fit.

## optimal
Define a `Visitor` interface with one method per concrete element type. Each element class implements `accept(visitor)` by calling the matching `visit` method on the visitor. The structure walk happens either in the visitor (visitor-driven) or in the elements (element-driven via accept that recurses into children before/after calling visitor).

```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar

T = TypeVar("T")

class Expr(ABC):
    @abstractmethod
    def accept(self, v: "Visitor[T]") -> T: ...

class Num(Expr):
    def __init__(self, value): self.value = value
    def accept(self, v): return v.visit_num(self)

class Add(Expr):
    def __init__(self, left, right): self.left, self.right = left, right
    def accept(self, v): return v.visit_add(self)

class Mul(Expr):
    def __init__(self, left, right): self.left, self.right = left, right
    def accept(self, v): return v.visit_mul(self)

class Visitor(Generic[T], ABC):
    @abstractmethod
    def visit_num(self, n: Num) -> T: ...
    @abstractmethod
    def visit_add(self, n: Add) -> T: ...
    @abstractmethod
    def visit_mul(self, n: Mul) -> T: ...

class Evaluator(Visitor[int]):
    def visit_num(self, n): return n.value
    def visit_add(self, n): return n.left.accept(self) + n.right.accept(self)
    def visit_mul(self, n): return n.left.accept(self) * n.right.accept(self)

class Printer(Visitor[str]):
    def visit_num(self, n): return str(n.value)
    def visit_add(self, n): return f"({n.left.accept(self)} + {n.right.accept(self)})"
    def visit_mul(self, n): return f"({n.left.accept(self)} * {n.right.accept(self)})"

# Adding "compile to bytecode" = one new Visitor class. Zero edits to Num/Add/Mul.
```

Why optimal: each traversal is O(N) in elements with O(1) dispatch per node (two virtual calls — accept then visit — but both are constant). Memory is O(depth) for recursion on tree structures. Adding a new operation is O(types) effort once (write a new visitor with one method per type); adding a new visitor after that is structurally free. The pattern is asymptotically optimal because you cannot do better than visiting each node once.

Implementation discipline that distinguishes good visitors from rituals: (1) parameterise the visitor's return type with generics (`Visitor<T>`) so the same skeleton produces evaluators returning `int`, printers returning `str`, validators returning `List[Error]` — without it you erase type information and need casts everywhere; (2) when many visitors share the recursive walk, provide a `DefaultVisitor` with `visit_X` implementations that recurse into children — concrete visitors only override the nodes they care about; (3) in modern languages with sealed hierarchies and pattern matching (Scala, Kotlin, Java 21 switch, Rust enums), the boilerplate collapses to a single `match` expression — the *idea* of Visitor (separate operations from data, dispatch on type) survives, only the syntactic ceremony changes; (4) the "Acyclic Visitor" variant (Robert Martin) breaks the requirement that every visitor implement every method by splitting the visitor interface per element, trading some compile-time safety for the ability to add new element types without breaking existing visitors.

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
