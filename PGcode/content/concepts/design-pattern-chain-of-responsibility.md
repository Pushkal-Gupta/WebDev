---
slug: design-pattern-chain-of-responsibility
module: foundations
title: Chain of Responsibility Pattern
subtitle: Pass a request through a chain of handlers
difficulty: Intermediate
position: 406
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - https://refactoring.guru/design-patterns/chain-of-responsibility
  - https://martinfowler.com/eaaCatalog/pipesAndFilters.html
  - https://github.com/DovAmir/awesome-design-patterns
status: published
---

## intro
Chain of Responsibility passes a request along a linear sequence of handlers until one of them processes it. Each handler decides either to handle the request itself, to delegate to the next handler, or both. The sender does not know which handler will respond, and the chain can be reordered or extended without touching the sender.

## whyItMatters
Many systems run sequences of optional processing: middleware in web frameworks, event bubbling in UIs, support escalation tiers, validation pipelines. Encoding the order with conditionals in one giant function couples everything together. Chain of Responsibility makes each step a standalone object that can be added, removed, or reordered freely.

## intuition
Imagine an office where a purchase request lands on a junior manager's desk. If the amount is small, she approves it. Otherwise she sends it up to her boss, who applies the same rule. The request flows upward until someone with sufficient authority signs off. Each manager knows only the next link, not the whole org chart.

## visualization
Picture a linked list of boxes. A request enters the head. Each box runs its logic and either returns a response, forwards to next, or both. If it falls off the end, the request is unhandled — which can be an error or a default response.

## bruteForce
A single function with nested if-else branches checks every condition. Adding a new handler means editing this central function. Reordering requires careful surgery. Optional handlers turn into feature flags inside the conditional. Testing each branch in isolation is awkward because the whole function shares state.

## optimal
Define a Handler interface with handle(request) and a successor reference. Each concrete handler implements its specific logic, calling successor.handle on miss. A builder or fluent API wires the chain. Some variants always pass the request to every handler (event broadcasting) — distinguish the strict "first match wins" form from the "everyone gets a turn" pipeline.

## complexity
Each request traverses up to k handlers, so worst-case time is O(k) per request. Memory is O(k) for the chain itself plus O(1) per request. No allocation per call when handlers are stateless.

## pitfalls
A request can fall off the end unhandled — always include a default tail or explicit error. Long chains complicate debugging; logging the path helps. Stateful handlers must be thread-safe if shared. Forgetting to forward to next creates dropped requests.

## interviewTips
Cite Express/Connect middleware, Java servlet filters, and ASP.NET pipelines as production examples. Distinguish from Decorator: both wrap, but Decorator always adds behavior to the same call; Chain may short-circuit. Mention that auth, logging, rate-limiting, and caching are textbook handlers.

## code.python
```python
class Handler:
    def __init__(self):
        self.next = None

    def set_next(self, h):
        self.next = h
        return h

    def handle(self, request):
        if self.next:
            return self.next.handle(request)

class Auth(Handler):
    def handle(self, request):
        if not request.get("token"):
            return "401"
        return super().handle(request)

class Route(Handler):
    def handle(self, request):
        return f"served {request['path']}"

chain = Auth()
chain.set_next(Route())
print(chain.handle({"token": "x", "path": "/home"}))
```

## code.javascript
```javascript
class Handler {
  setNext(h) { this.next = h; return h; }
  handle(req) { return this.next ? this.next.handle(req) : null; }
}

class Auth extends Handler {
  handle(req) { return req.token ? super.handle(req) : "401"; }
}

class Route extends Handler {
  handle(req) { return `served ${req.path}`; }
}

const chain = new Auth();
chain.setNext(new Route());
console.log(chain.handle({ token: "x", path: "/home" }));
```

## code.java
```java
abstract class Handler {
    protected Handler next;
    public Handler setNext(Handler h) { this.next = h; return h; }
    public String handle(java.util.Map<String, String> req) {
        return next != null ? next.handle(req) : null;
    }
}

class Auth extends Handler {
    public String handle(java.util.Map<String, String> req) {
        if (!req.containsKey("token")) return "401";
        return super.handle(req);
    }
}

class Route extends Handler {
    public String handle(java.util.Map<String, String> req) {
        return "served " + req.get("path");
    }
}
```

## code.cpp
```cpp
#include <map>
#include <string>

class Handler {
protected:
    Handler* next = nullptr;
public:
    Handler* setNext(Handler* h) { next = h; return h; }
    virtual std::string handle(const std::map<std::string, std::string>& req) {
        return next ? next->handle(req) : "";
    }
    virtual ~Handler() = default;
};

class Auth : public Handler {
public:
    std::string handle(const std::map<std::string, std::string>& req) override {
        if (req.find("token") == req.end()) return "401";
        return Handler::handle(req);
    }
};

class Route : public Handler {
public:
    std::string handle(const std::map<std::string, std::string>& req) override {
        return "served " + req.at("path");
    }
};
```
