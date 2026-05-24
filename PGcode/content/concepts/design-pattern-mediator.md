---
slug: design-pattern-mediator
module: foundations
title: Mediator Pattern
subtitle: Centralize communication between decoupled components
difficulty: Intermediate
position: 407
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - https://refactoring.guru/design-patterns/mediator
  - https://martinfowler.com/eaaCatalog/
  - https://github.com/DovAmir/awesome-design-patterns
status: published
---

## intro
Mediator extracts the rules of how a set of components interact into a single coordinator object. Instead of each component holding direct references to every other, they all talk only to the mediator. The mediator translates events from one component into commands for others, keeping the components themselves ignorant of the larger choreography.

## whyItMatters
Without a mediator, every new component must learn every other component it might affect. The graph of references grows quadratically, and small changes cascade. Mediator caps each component's knowledge at one collaborator (itself plus the mediator), turning a tangled mesh into a hub-and-spoke graph that is easy to understand and modify.

## intuition
Air traffic control is the canonical metaphor. Pilots do not coordinate directly with every other plane. They radio the tower, which sees the whole picture and issues instructions. Add a new plane and only the tower needs updating; existing pilots keep flying their assigned headings.

## visualization
Draw N components arranged in a circle with arrows pointing inward to one central node, the mediator. Compare to the same diagram without a mediator, where every component connects to every other — an O(N²) tangle. The mediator collapses it to O(N) connections.

## bruteForce
Components hold references to each other and call methods directly. A login form's submit button knows about the validator, the spinner, the error label, the API client, and the navigation router. Reusing the button elsewhere is impossible. Changing the flow means editing many components.

## optimal
Define a Mediator interface with a notify(sender, event) method. Each component holds a reference to its mediator and reports events through it. The mediator decides what to do. Concrete mediators encapsulate one specific dialog or workflow. Components stay reusable across different mediators.

## complexity
Each event triggers O(1) mediator dispatch and however much work the mediator does to coordinate. Memory is O(N) for component references inside the mediator. Compared to direct connections the asymptotic gain is from O(N²) potential edges down to O(N) actual edges.

## pitfalls
The mediator can grow into a god object that knows everything — split mediators by concern when they get too large. Bidirectional knowledge (component knows mediator, mediator knows component) still couples them; aim for events flowing one way. Avoid leaking component types into the mediator interface; pass opaque event names instead.

## interviewTips
UI dialogs are the textbook example. Mention chat rooms, event buses, and Redux/Flux stores as scaled-up mediators. Compare with Observer: Observer is one-to-many broadcast with no coordination logic; Mediator is many-to-many with centralized rules. Both can be combined — mediator that also publishes events.

## code.python
```python
class Mediator:
    def notify(self, sender, event): ...

class DialogMediator(Mediator):
    def __init__(self, button, checkbox):
        self.button, self.checkbox = button, checkbox
        button.mediator = self
        checkbox.mediator = self

    def notify(self, sender, event):
        if sender is self.checkbox and event == "toggle":
            self.button.enabled = self.checkbox.checked

class Button:
    def __init__(self):
        self.enabled = False
        self.mediator = None

class Checkbox:
    def __init__(self):
        self.checked = False
        self.mediator = None

    def toggle(self):
        self.checked = not self.checked
        self.mediator.notify(self, "toggle")
```

## code.javascript
```javascript
class DialogMediator {
  constructor(button, checkbox) {
    this.button = button;
    this.checkbox = checkbox;
    button.mediator = this;
    checkbox.mediator = this;
  }
  notify(sender, event) {
    if (sender === this.checkbox && event === "toggle") {
      this.button.enabled = this.checkbox.checked;
    }
  }
}

class Button { constructor() { this.enabled = false; } }
class Checkbox {
  constructor() { this.checked = false; }
  toggle() { this.checked = !this.checked; this.mediator.notify(this, "toggle"); }
}
```

## code.java
```java
interface Mediator {
    void notify(Object sender, String event);
}

class Button { boolean enabled; Mediator mediator; }
class Checkbox {
    boolean checked;
    Mediator mediator;
    void toggle() { checked = !checked; mediator.notify(this, "toggle"); }
}

class DialogMediator implements Mediator {
    private final Button button;
    private final Checkbox checkbox;
    DialogMediator(Button b, Checkbox c) { this.button = b; this.checkbox = c; b.mediator = this; c.mediator = this; }
    public void notify(Object sender, String event) {
        if (sender == checkbox && event.equals("toggle")) button.enabled = checkbox.checked;
    }
}
```

## code.cpp
```cpp
#include <string>

class Mediator {
public:
    virtual void notify(void* sender, const std::string& event) = 0;
    virtual ~Mediator() = default;
};

struct Button { bool enabled = false; Mediator* mediator = nullptr; };
struct Checkbox {
    bool checked = false;
    Mediator* mediator = nullptr;
    void toggle() { checked = !checked; mediator->notify(this, "toggle"); }
};

class DialogMediator : public Mediator {
    Button& button;
    Checkbox& checkbox;
public:
    DialogMediator(Button& b, Checkbox& c) : button(b), checkbox(c) { b.mediator = this; c.mediator = this; }
    void notify(void* sender, const std::string& event) override {
        if (sender == &checkbox && event == "toggle") button.enabled = checkbox.checked;
    }
};
```
