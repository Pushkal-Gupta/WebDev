---
slug: design-pattern-chain-of-responsibility
module: foundations-patterns
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
- **Express / Koa / Connect middleware**: every Node.js HTTP server is a Chain — `app.use(logger).use(auth).use(rateLimit).use(router)`. Each middleware decides whether to handle, mutate, or forward via `next()`.
- **Java Servlet Filters and ASP.NET Core middleware pipeline**: same pattern, different language. Each filter is a handler; `chain.doFilter()` is the forward.
- **DOM event bubbling and capturing**: a click on a button propagates up through every ancestor until one calls `stopPropagation` — Chain of Responsibility codified as a browser primitive.
- **Logging frameworks (Log4j, Python `logging`, Serilog)**: log records pass through filters → formatters → appenders, each deciding whether to emit, transform, or drop.
- **Customer support escalation (Zendesk, Salesforce Service Cloud)**: tier 1 → tier 2 → engineering → product manager. Each tier resolves what it can; the rest forwards. Routing is data, not code.
- **AWS Lambda function URL middleware (Powertools, Middy)**: handler composition built on chained `before/after` hooks, lifting the Chain pattern into serverless.
- **Java exception handling (`try/catch` stacks)**: the JVM walks up the call chain looking for a handler that matches — built-in CoR at language level.

The economic argument is the same in every case: ordered, optional processing where the set of stages evolves independently of the dispatcher. Without the pattern, adding rate-limiting to an existing pipeline means editing the dispatch function, redeploying, and risking regressions in unrelated stages. With it, you append one new handler and the dispatcher never changes.

## intuition
The pattern exists to decompose ordered, optional processing into discrete units that compose. Without it, a typical implementation is a single function with nested if-else: "if request needs auth, check token; if auth passes, log it; if logging succeeds, rate-limit; if rate-limit allows, route". The function grows linearly with stages, each conditional couples to its neighbours, and inserting a new stage between any two existing ones is surgery on a shared bracket-structure that nobody wants to review.

Chain of Responsibility's move is to factor each stage into an independent handler with a single contract: receive a request, decide whether to handle it / forward it / both, return a response (or null to indicate "I didn't handle it"). The chain is just a sequence of these handlers, wired head-to-tail via a `next` pointer. The sender hands a request to the head; the head decides; if it forwards, the next handler decides; and so on. Each handler is locally complete — you can unit-test it in isolation with a stub `next`, and you can reorder handlers by changing the wiring without editing handler code.

Two flavours exist and they have different contracts. The strict "first-match-wins" form short-circuits as soon as a handler responds — used by routers, ACL matchers, exception handlers. The "everyone gets a turn" pipeline form always forwards, with each handler enriching or transforming the request as it passes — used by middleware, logging filters, ETL pipelines. Express middleware is hybrid: handlers choose between `next()` (forward) and `res.send()` (terminate). Recognising which flavour you need before writing the chain prevents the most common bug: handlers that should short-circuit but forward, double-processing the request.

The escalation metaphor that everyone uses (purchase request flowing up an org chart) captures the strict form. The pipeline metaphor (washing → rinsing → drying in a car wash) captures the everyone-handles form. Both are valid templates for the same structural pattern; you pick by what your handlers need to do with the request after forwarding.

The pattern shines when stages are independent (no handler needs to know about another's existence), when the order can change without breaking semantics, when the set of stages is open (third parties may add their own), and when you want each stage testable in isolation. Web request handling has all four properties, which is why every web framework eventually converges on this design.

## optimal
Define a `Handler` interface with `handle(request)` and a `next` reference. Each concrete handler implements its logic, calling `next.handle()` to forward. A fluent builder wires the chain. The base class provides the default forward so concrete handlers only implement the interesting bit.

```python
from abc import ABC, abstractmethod
from typing import Optional

class Handler(ABC):
    def __init__(self):
        self._next: Optional["Handler"] = None

    def then(self, h: "Handler") -> "Handler":      # fluent wiring
        self._next = h
        return h

    def handle(self, req) -> Optional[dict]:
        return self._next.handle(req) if self._next else None

class AuthHandler(Handler):
    def handle(self, req):
        if not req.get("token"):
            return {"status": 401, "body": "missing token"}
        req["user_id"] = decode(req["token"])
        return super().handle(req)                   # forward enriched request

class RateLimitHandler(Handler):
    def __init__(self, limit_per_min=60):
        super().__init__()
        self.limit = limit_per_min
        self.counts = {}                             # in prod: Redis
    def handle(self, req):
        uid = req["user_id"]
        if self.counts.get(uid, 0) >= self.limit:
            return {"status": 429, "body": "rate limited", "retry_after": 60}
        self.counts[uid] = self.counts.get(uid, 0) + 1
        return super().handle(req)

class RouteHandler(Handler):
    def handle(self, req):
        return {"status": 200, "body": f"served {req['path']} for user {req['user_id']}"}

# Build chain once; reuse for every request
chain = AuthHandler()
chain.then(RateLimitHandler(limit_per_min=60)).then(RouteHandler())
response = chain.handle({"token": "abc", "path": "/home"})
```

Why optimal: a request traverses at most k handlers, so per-request time is O(k) and memory is O(k) for the chain itself plus O(1) per call (when handlers are stateless). The pattern hits the asymptotic floor — you cannot do better than visiting each relevant handler once — and it makes adding a new handler an O(1) operation in terms of code change (one new class, one wiring line, no edits to existing handlers).

Implementation discipline that distinguishes good chains from drift-prone ones: (1) always include a default tail handler — falling off the end with no handler producing a response is a bug, and a "404 Not Found" or "validation passed" tail makes the behaviour explicit; (2) handlers that mutate the request must document what they add (`AuthHandler` adds `user_id`, downstream handlers depend on it) — type the request as a TypedDict / dataclass and update its fields as it flows; (3) log the path the request took (`handler_chain: auth → rate_limit → route`) in production — invaluable for debugging "which middleware ate my response" tickets; (4) for the broadcast variant (everyone runs, even after a hit), return a list of responses or accumulate side effects rather than short-circuiting — the choice between strict and broadcast must be designed in, not bolted on; (5) handlers should be stateless or use thread-safe state — they're shared across concurrent requests in any real web server.

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
