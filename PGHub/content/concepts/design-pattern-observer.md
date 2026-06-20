---
slug: design-pattern-observer
module: foundations-patterns
title: Observer Pattern
subtitle: Publish/subscribe between objects — one subject notifies many observers without knowing who they are.
difficulty: Beginner
position: 93
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Observer — Refactoring Guru"
    url: "https://refactoring.guru/design-patterns/observer"
    type: book
  - title: "Event Collaboration — Martin Fowler"
    url: "https://martinfowler.com/eaaDev/EventCollaboration.html"
    type: blog
  - title: "DovAmir/awesome-design-patterns — Observer"
    url: "https://github.com/DovAmir/awesome-design-patterns"
    type: repo
status: published
---

## intro
The Observer pattern lets one object — the subject — broadcast state changes to any number of observers that have registered interest, without the subject knowing who they are or what they do with the news. The relationship is one-to-many and dynamic: observers may attach or detach at any time. Observer is the structural backbone of event systems, MVC view updates, reactive frameworks, and pub/sub middleware.

## whyItMatters
- **React's `useState` / `useReducer`** schedules re-renders on every subscribed component when state changes; **Vue's `ref` and `reactive`** wire `Proxy` traps to observer lists; **Svelte's stores** and **RxJS `Subject`** are the same pattern at different layers.
- **Java's `java.beans.PropertyChangeSupport`** and **Swing's listener model** ship Observer in the JDK; Spring's `ApplicationEventPublisher` and `@EventListener` make it the default for in-process domain events.
- **DOM's `addEventListener`**, **Node's `EventEmitter`**, and **PostgreSQL's `LISTEN/NOTIFY`** are Observer variants — fan-out from one source to many sinks without the source knowing them.
- **Apache Kafka consumer groups**, **Redis Pub/Sub**, and **AWS SNS** scale the pattern across processes; the original Gang of Four book (Gamma, Helm, Johnson, Vlissides, 1994) defined it for in-process Smalltalk MVC, but the shape generalizes to every messaging system since.

## intuition
The problem Observer solves: an object's state change has many consequences, and you do not want the changing object to enumerate them. A YouTube channel uploading a video should not need a hand-coded list of every subscriber's email; it should fire one event and let the platform fan it out. A spreadsheet cell that changes should not know which dependent cells need recomputing; it should publish "I changed" and let the dependency graph propagate. A network packet arriving should not know which application handlers want to inspect it; it should hit a dispatch table.

The mental shift is from **imperative push** (caller knows every callee by name) to **registration plus broadcast** (caller knows nothing about callees; callees opt in). This inverts the dependency arrow: instead of the subject depending on the concrete observers, the observers depend on the subject's event contract. The Hollywood Principle — "don't call us, we'll call you" — captures it.

The trade you make: visibility for flexibility. With direct calls, you can read the source and see every consequence at the call site. With Observer, that consequence list is built at runtime from `attach()` calls scattered across the codebase. You gain the ability to add a fifth side effect without touching the subject (a closed-for-modification, open-for-extension boundary, in SOLID terms), but you lose static call-graph clarity. Frameworks fight this with event-bus instrumentation, devtools (React DevTools, Vue Devtools), and naming conventions.

## visualization
Draw a `Subject` with three methods — `attach`, `detach`, `notify` — and a list of observer references. Three observers — `EmailObserver`, `SlackObserver`, `MetricsObserver` — each implement `update(event)`. When `subject.notify("order placed")` runs, the loop calls `update` on every observer in turn. Add or remove a listener by appending/removing from the list; the subject does not change.

## bruteForce
Without Observer the subject calls each listener by name:
```
def place_order(self):
    save_to_db()
    send_email()
    post_to_slack()
    update_dashboard()
```
Adding a fifth side effect means editing this method. Removing one for tests means commenting it out. The Single Responsibility Principle is broken and the method becomes a list of imports from every corner of the system.

## optimal
The right structure is a **Subject** holding a registry of observers, plus `attach()`, `detach()`, and `notify()` methods. On state change, iterate a **snapshot** of the registry (not the live list) and call each observer's `update(event)`. The snapshot is critical — observers commonly detach themselves or attach new ones mid-notification, and mutating the list while iterating throws `ConcurrentModificationException` in Java or skips elements in Python. Defensive copy is one line; the bug is hours to debug.

Choose **push** versus **pull**: push sends the full event payload (`update(event)`), pull sends a reference to the subject (`update(subject)`) so observers query what they need. Push is simpler and is what React, Redux, and Kafka use. Pull is more flexible when observers want different slices of subject state. Hybrid (event with a "fetch more from subject" handle) is common in DOM events — `event.target` lets handlers query the source.

```python
import weakref

class Subject:
    def __init__(self):
        self._observers: list = []
        self._notifying = False

    def attach(self, fn):
        self._observers.append(weakref.WeakMethod(fn) if hasattr(fn, "__self__") else fn)

    def detach(self, fn):
        self._observers = [o for o in self._observers if o != fn]

    def notify(self, event):
        if self._notifying:                  # cycle guard
            return
        self._notifying = True
        try:
            for obs in list(self._observers):  # snapshot
                ref = obs() if isinstance(obs, weakref.WeakMethod) else obs
                if ref is None:
                    continue
                try:
                    ref(event)
                except Exception as e:
                    log.exception("observer failed", extra={"err": e})
        finally:
            self._notifying = False
```

Why this is right: it handles the four classical pitfalls in one structure. **Memory leaks** (observers held forever) are solved by `WeakMethod` references — Microsoft's WPF and Qt both ship this pattern. **Cyclic notification** (observer mutates subject, re-firing notify) is guarded by `_notifying`. **Observer exceptions** crashing the broadcast are caught per-listener and logged. **Iteration-time mutation** is avoided by the snapshot. For cross-process fan-out, the same shape scales to a message broker — Kafka topics, Redis Pub/Sub, AWS SNS, and Google Pub/Sub are Observer at infrastructure scale, with the broker owning the registry and guaranteeing at-least-once delivery.

## complexity
time: O(k) per notification where k is the number of observers
space: O(k) for the observer registry
notes: Each notify call walks the registered listeners. Synchronous Observer chains can become a hidden bottleneck or — worse — a cycle if an observer mutates the subject. Asynchronous bus variants trade latency for decoupling.

## pitfalls
- Memory leaks: observers that forget to detach hold references forever. JavaScript and Java both suffer this — use weak references or scoped subscriptions.
- Notification order surprises: most implementations are insertion-ordered, but don't rely on it across processes.
- Observers that throw: one bad observer should not break the broadcast. Wrap each `update` call.
- Cyclic notifications: observer A's update mutates the subject, re-firing notify, calling A again. Guard with a "currently notifying" flag.
- Hidden control flow: a single state change can ripple into ten side effects you can't see at the call site. Document the events.

## interviewTips
- Tie Observer to MVC: the model is the subject, views are observers.
- Mention that React's `useState` rerender, Redux subscribers, RxJS, and DOM `addEventListener` are all Observer at different layers.
- Be ready to discuss push vs pull, and when an event bus is the better answer (cross-process, async fanout).

## code.python
```python
class Subject:
    def __init__(self):
        self._observers = []
    def attach(self, fn): self._observers.append(fn)
    def detach(self, fn): self._observers.remove(fn)
    def notify(self, event):
        for fn in list(self._observers):
            fn(event)

class OrderService:
    def __init__(self):
        self.events = Subject()
    def place(self, order_id):
        self.events.notify({"type": "ORDER_PLACED", "id": order_id})

service = OrderService()
service.events.attach(lambda e: print("email:", e))
service.events.attach(lambda e: print("slack:", e))
service.place(42)
```

## code.javascript
```javascript
class Subject {
  constructor() { this.listeners = []; }
  attach(fn) { this.listeners.push(fn); }
  detach(fn) { this.listeners = this.listeners.filter(l => l !== fn); }
  notify(event) { for (const fn of [...this.listeners]) fn(event); }
}

class OrderService {
  constructor() { this.events = new Subject(); }
  place(id) { this.events.notify({ type: "ORDER_PLACED", id }); }
}

const svc = new OrderService();
svc.events.attach(e => console.log("email:", e));
svc.events.attach(e => console.log("slack:", e));
svc.place(42);
```

## code.java
```java
import java.util.*;
import java.util.function.Consumer;

class Subject<T> {
    private final List<Consumer<T>> listeners = new ArrayList<>();
    public void attach(Consumer<T> l) { listeners.add(l); }
    public void detach(Consumer<T> l) { listeners.remove(l); }
    public void notify(T event) {
        for (Consumer<T> l : new ArrayList<>(listeners)) l.accept(event);
    }
}

class OrderService {
    public final Subject<String> events = new Subject<>();
    public void place(int id) { events.notify("ORDER_PLACED:" + id); }
}
```

## code.cpp
```cpp
#include <functional>
#include <iostream>
#include <string>
#include <vector>

template <class T>
class Subject {
    std::vector<std::function<void(const T&)>> listeners;
public:
    void attach(std::function<void(const T&)> l) { listeners.push_back(std::move(l)); }
    void notify(const T& event) {
        auto snapshot = listeners;
        for (auto& fn : snapshot) fn(event);
    }
};

class OrderService {
public:
    Subject<std::string> events;
    void place(int id) { events.notify("ORDER_PLACED:" + std::to_string(id)); }
};
```
