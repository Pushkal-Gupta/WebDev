---
slug: design-pattern-state
module: foundations
title: State Pattern
subtitle: Object behavior that changes with internal mode
difficulty: Intermediate
position: 403
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - https://refactoring.guru/design-patterns/state
  - https://martinfowler.com/bliki/StateMachine.html
  - https://github.com/DovAmir/awesome-design-patterns
status: published
---

## intro
The State pattern lets an object change its behavior when its internal state changes, making it appear to change class. Each state is represented by its own object that implements the same interface, and the context delegates calls to the current state. The pattern replaces sprawling if-else chains keyed off a status field with polymorphic dispatch.

## whyItMatters
Domain objects often go through lifecycles: an order moves draft, paid, shipped, delivered; a connection cycles closed, opening, open, closing. Encoding transitions as scattered conditionals causes bugs because invariants per state are not localized. The State pattern co-locates the rules of each state, making illegal transitions impossible to express.

## intuition
A traffic light is the textbook example. Red, yellow, and green each define what cars should do and what the next state is. The intersection does not care which color it currently is; it just asks "what now?" and the light replies. Replacing the bulb does not require teaching the intersection new physics.

## visualization
Draw a graph of nodes (states) and labeled edges (transitions triggered by events). The context holds a pointer to one node. When an event fires, the current node decides what to do and which node to become next. The pattern turns this diagram directly into code.

## bruteForce
A single class with a status enum and switch statements scattered across every method. Adding a new state requires editing every switch. Forgetting one creates silent bugs. Invariants spread across the file. Testing state-specific behavior requires setting up the whole context.

## optimal
Define a State interface with the operations the context exposes. Implement each concrete state as a class. The context holds a reference to the current state and delegates calls. Transitions happen by replacing the state reference, either inside state methods or via context-level helpers. Hierarchical states and entry/exit hooks can be added when complexity grows.

## complexity
Operations are O(1) dispatch through polymorphism. Memory per context is constant — one state pointer. Total state classes scale linearly with distinct behaviors, but each class is small and focused, which is the whole point.

## pitfalls
Tightly coupling states to each other forms a directed graph that becomes hard to refactor. Prefer transitions handled by the context. Sharing mutable data across states needs careful design — either the context owns it, or states use a shared memento. Beware infinite transition loops if entry hooks themselves trigger transitions.

## interviewTips
Compare with Strategy: both delegate to swappable objects, but State implies awareness of the lifecycle and transitions between siblings, while Strategy is stateless and chosen externally. Mention TCP connections, vending machines, and game character AI as canonical examples.

## code.python
```python
class State:
    def insert_coin(self, machine): ...
    def dispense(self, machine): ...

class Idle(State):
    def insert_coin(self, machine):
        machine.state = HasCoin()

class HasCoin(State):
    def dispense(self, machine):
        print("dispensing")
        machine.state = Idle()

class VendingMachine:
    def __init__(self):
        self.state = Idle()

    def insert_coin(self): self.state.insert_coin(self)
    def dispense(self): self.state.dispense(self)
```

## code.javascript
```javascript
class Idle {
  insertCoin(machine) { machine.state = new HasCoin(); }
  dispense() {}
}

class HasCoin {
  insertCoin() {}
  dispense(machine) { console.log("dispensing"); machine.state = new Idle(); }
}

class VendingMachine {
  constructor() { this.state = new Idle(); }
  insertCoin() { this.state.insertCoin(this); }
  dispense() { this.state.dispense(this); }
}
```

## code.java
```java
interface State {
    default void insertCoin(VendingMachine m) {}
    default void dispense(VendingMachine m) {}
}

class Idle implements State {
    public void insertCoin(VendingMachine m) { m.setState(new HasCoin()); }
}

class HasCoin implements State {
    public void dispense(VendingMachine m) { System.out.println("dispensing"); m.setState(new Idle()); }
}

class VendingMachine {
    private State state = new Idle();
    void setState(State s) { state = s; }
    void insertCoin() { state.insertCoin(this); }
    void dispense() { state.dispense(this); }
}
```

## code.cpp
```cpp
#include <iostream>
#include <memory>

class VendingMachine;
struct State {
    virtual void insertCoin(VendingMachine&) {}
    virtual void dispense(VendingMachine&) {}
    virtual ~State() = default;
};

class VendingMachine {
    std::unique_ptr<State> state;
public:
    VendingMachine();
    void setState(std::unique_ptr<State> s) { state = std::move(s); }
    void insertCoin() { state->insertCoin(*this); }
    void dispense() { state->dispense(*this); }
};

struct HasCoin : State {
    void dispense(VendingMachine& m) override;
};

struct Idle : State {
    void insertCoin(VendingMachine& m) override { m.setState(std::make_unique<HasCoin>()); }
};

void HasCoin::dispense(VendingMachine& m) { std::cout << "dispensing\n"; m.setState(std::make_unique<Idle>()); }
VendingMachine::VendingMachine() : state(std::make_unique<Idle>()) {}
```
