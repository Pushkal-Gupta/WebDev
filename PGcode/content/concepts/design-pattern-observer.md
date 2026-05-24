---
slug: design-pattern-observer
module: foundations
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
Hard-wiring a subject to its consumers (`order.notifyEmail(); order.notifySlack(); order.updateDashboard();`) couples them forever and forces the subject to know every downstream side effect. Each new listener edits the subject. With Observer the subject only fires `notify(event)` and any registered listener reacts. UI frameworks (React state, Vue reactivity, Swing listeners), domain events in DDD, browser DOM events, and Kafka consumers all build on this pattern.

## intuition
Think of a YouTube channel. The channel posts a video; every subscriber gets a notification; the channel has no idea which subscribers exist or what they do with the alert. New subscribers can join anytime; existing ones can unsubscribe. The channel's job is to push the event; the subscribers' job is to react.

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
Define an `Observer` interface with an `update(event)` method. Give the `Subject` a list of observers plus `attach(observer)` and `detach(observer)`. On state change, iterate the list and call `update`. Choose between *push* (subject sends the full event payload) and *pull* (observer asks the subject for details). For thread-safety, copy the listener list before iteration. For unbounded async fanout, prefer an event bus or message broker, which is the same pattern at a different scale.

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
