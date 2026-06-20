---
slug: design-pattern-state
module: foundations-patterns
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
- **TCP connection state machine (RFC 793)**: CLOSED → LISTEN → SYN-RCVD → ESTABLISHED → FIN-WAIT → TIME-WAIT — the kernel implements this as State per socket because every transition has guards, timers, and side effects that would be unauditable in a switch statement.
- **Order lifecycles at Shopify, Stripe, DoorDash**: draft → pending_payment → paid → fulfilled → shipped → delivered (with refund / cancellation forks). Each state has its own set of legal operations; State makes "refund a draft order" structurally impossible.
- **Video player UIs (YouTube, Netflix)**: loading → buffering → playing → paused → ended — each state shows different controls and accepts different commands; encoding as a switch over a string is a known bug source.
- **Workflow engines (Temporal, AWS Step Functions, Camunda)**: every activity is a State node with explicit transitions; the engine surface is built on the pattern.
- **Game-character AI behaviour trees (Unreal AIController)**: idle, patrol, alert, combat, dead — each state defines its own update logic and which states it can transition to.

The economic argument is preventing invalid-state bugs. A switch over a status enum scatters the rules of each state across every method. A change to "what's legal when shipped?" requires editing eight files; a forgotten edit silently allows an illegal operation. With State, every legal operation lives inside one class and the rest are simply absent — the compiler enforces what comments can't.

## intuition
The pattern exists to localise the rules of each lifecycle phase. Without it, a typical implementation uses a `status` field and a switch in every method: `def cancel(self): if self.status == "draft": ...; elif self.status == "paid": ...; elif self.status == "shipped": raise IllegalOperation; ...`. Adding a new status means editing every switch. Forgetting one is silent. Worse, the invariant "what's legal when shipped?" is split across `cancel`, `refund`, `update_address`, `add_item`, `print_label` — there is no single place where "shipped" is defined.

State pattern's move is to give each state its own class that holds only the operations legal in that state. The context (`Order`, `Connection`, `Player`) holds a reference to the current state object and delegates every public method to it. Calling `order.refund()` dispatches to `current_state.refund(order)`; the `Draft` state simply doesn't implement `refund`, so the call surfaces as a clear error or no-op. The `Shipped` state implements `refund` with the actual refund-after-shipping logic. Each state's rules are co-located, auditable, and testable in isolation.

The second move is making transitions explicit. Instead of `self.status = "paid"` scattered throughout the codebase, transitions happen via `order.transition_to(Paid())`. The graph of legal transitions becomes the set of `_set_state` calls in the codebase, which is grep-able. Illegal transitions can be made literally unrepresentable: if no state's methods ever construct `Shipped`, you can't get there.

A traffic light makes the pattern click on first sight. Red, Yellow, Green each define what cars should do and what the next state is. The intersection does not track which colour it currently is in its own code; it just calls `current.tick()` and the light returns the next light. Adding "flashing red" means writing one new class, not editing the intersection. The pattern shines when the lifecycle has more than three states or when states have asymmetric behaviour. For two-state toggles (`is_active`), it's overkill. For TCP's eleven-state machine or an order's twelve transition arrows, it's the only design that stays maintainable past the first six months.

## visualization
Draw a graph of nodes (states) and labeled edges (transitions triggered by events). The context holds a pointer to one node. When an event fires, the current node decides what to do and which node to become next. The pattern turns this diagram directly into code.

## bruteForce
A single class with a status enum and switch statements scattered across every method. Adding a new state requires editing every switch. Forgetting one creates silent bugs. Invariants spread across the file. Testing state-specific behavior requires setting up the whole context.

## optimal
Define a `State` interface with the operations the context exposes. Each concrete state implements the methods that are legal in it; methods that are illegal raise (or default to no-op via interface defaults). The context holds the current state and delegates to it. Transitions happen by calling `set_state` on the context — either from inside state methods (state-driven transitions) or from a context-level coordinator (context-driven transitions).

```python
from abc import ABC

class OrderState(ABC):
    def pay(self, order):      raise IllegalTransition(f"cannot pay in {type(self).__name__}")
    def ship(self, order):     raise IllegalTransition(f"cannot ship in {type(self).__name__}")
    def cancel(self, order):   raise IllegalTransition(f"cannot cancel in {type(self).__name__}")
    def refund(self, order):   raise IllegalTransition(f"cannot refund in {type(self).__name__}")

class Draft(OrderState):
    def pay(self, order):    order._set_state(Paid())
    def cancel(self, order): order._set_state(Cancelled())

class Paid(OrderState):
    def ship(self, order):   order._set_state(Shipped()); order.fulfilment.dispatch(order.id)
    def refund(self, order): order._set_state(Refunded()); order.payment.refund(order.id)

class Shipped(OrderState):
    def refund(self, order): order._set_state(Refunded()); order.payment.refund(order.id, partial=True)

class Cancelled(OrderState): pass
class Refunded(OrderState): pass

class Order:
    def __init__(self):
        self._state = Draft()
    def _set_state(self, s): self._state = s
    def pay(self):    self._state.pay(self)
    def ship(self):   self._state.ship(self)
    def cancel(self): self._state.cancel(self)
    def refund(self): self._state.refund(self)
```

Why optimal: every legal operation is one polymorphic dispatch — O(1) per method call — and every illegal operation is structurally absent from the state class, so the type system (or the default raise) catches misuse without runtime conditionals. Adding a new state is one new class plus updates to the transition sources; adding a new operation is one new method on the interface plus implementations in the states that allow it. The cost the pattern doesn't eliminate: a new operation forces edits to every state class (the dual of Strategy's tradeoff), so State optimises for stable operation sets with evolving lifecycles, not the reverse.

Implementation discipline that distinguishes good state machines from sprawling ones: (1) prefer context-driven transitions over state-driven when the rules are simple — keeps the transition graph in one place; (2) for hierarchical states, use composition or an enum-inside-state rather than deeply nested inheritance; (3) instrument transitions with a single audit log at the `_set_state` call site — invaluable for debugging production state machines; (4) entry/exit hooks (`on_enter`, `on_exit`) are easy to add once you own the transition site, and they're where you put state-specific timers, metric increments, and external notifications.

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
