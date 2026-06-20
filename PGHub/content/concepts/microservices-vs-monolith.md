---
slug: microservices-vs-monolith
module: sd-microservices
title: Microservices vs Monolith
subtitle: Two opposite architectures. Monolith for speed of iteration; microservices for independent scaling + team autonomy. Pick by team size + domain complexity.
difficulty: Intermediate
position: 42
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Microservices"
    url: "https://martinfowler.com/articles/microservices.html"
    type: book
  - title: "Microservices.io — full pattern catalog"
    url: "https://microservices.io/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A **monolith** is one process with one database — all features compiled / packaged together. **Microservices** decompose the same app into N independent services, each with its own database, deployed independently. Both are valid; pick by team size, deployment cadence, and domain boundaries. The widespread "microservices everywhere" trend was a reaction to monoliths that grew unbounded — but monoliths done well (modular monoliths) outperform poorly-bounded microservices.

## whyItMatters
The default architectural decision for any new system:
- 1-10 engineers, 1 product → monolith wins. Less ops, faster iteration.
- 50+ engineers, multiple product lines → microservices win. Independent deploys + team autonomy.
- In between → modular monolith with clear internal boundaries, ready to split when needed.

Wrong choice = years of pain. "Premature distributed monolith" is a common antipattern: services exist but call each other synchronously like function calls.

## intuition
**Monolith**: single codebase, single deploy pipeline, single DB. Function calls between modules are cheap. Refactoring is easy (one repo). Deploying half the system = impossible — all-or-nothing.

**Microservices**: each service owns its data + business logic + deploy. Calls between services are network hops (10× slower). Each service can use a different language, DB, scaling. Schema changes require coordination across services.

**Modular monolith**: one process + one DB but enforced internal module boundaries (Java packages, Rust crates, separate Python packages). Splits cleanly into microservices later.

## visualization
```
MONOLITH                            MICROSERVICES
┌────────────────────────┐         ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Order   Auth   Inventory│         │ Order    │  │ Auth     │  │ Inventory│
│ Payment Notify Search   │         │ svc      │  │ svc      │  │ svc      │
│         │                │         └────┬─────┘  └────┬─────┘  └────┬─────┘
│         ▼                │              │             │              │
│   ┌─────────────┐        │         ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│   │  ONE DB     │        │         │ orders   │  │ auth     │  │ inventory│
│   └─────────────┘        │         │ DB       │  │ DB       │  │ DB       │
└────────────────────────┘         └──────────┘  └──────────┘  └──────────┘

  One process                         N processes, N DBs
  Function calls                      Network calls (HTTP/gRPC)
  ACID across all features            Distributed transactions (saga)
  Deploy all together                 Deploy independently
```

## bruteForce
**Monolith without modules**: ball-of-mud. Every module touches every other → can't refactor. The "we need microservices" trigger.

**Microservices without bounded contexts**: services exist but share databases / call each other synchronously like function calls → all the cost of microservices, none of the benefits ("distributed monolith").

**One database for many services**: one DB schema = coupling. Schema migrations require coordinating all consumers. Defeats the point of microservices.

## optimal
**Microservices when**:
- Different teams own different services (independent deploys = team autonomy).
- Different parts have wildly different scaling needs (search = 10x reads, payments = strict consistency).
- Different domains within the org (org chart matches service map — Conway's Law).
- Polyglot needs (ML team in Python, infra team in Go).

**Monolith when**:
- Small team, single domain, fast iteration.
- Strong consistency needed across most operations.
- Cheaper / faster to ship.

**Strangler fig pattern** to migrate monolith → microservices:
1. Build a thin API gateway in front of the monolith.
2. Carve off one feature into a new service; gateway routes that feature's URLs.
3. Repeat until monolith shrinks to nothing.

**Key infrastructure for microservices**:
- **Service discovery** (DNS, Consul, k8s services).
- **Communication**: REST / gRPC / async messaging (Kafka).
- **Tracing** (OpenTelemetry).
- **Centralized logging + metrics**.
- **CI/CD per service**.
- **Per-service DB** (no shared schema).
- **Saga pattern** for cross-service transactions.

## complexity
| | Monolith | Microservices |
|---|---|---|
| Inter-module call | O(1) function | O(network) ~1-10ms |
| Deploy time | All-or-nothing | Per service, parallel |
| Schema changes | Single migration | Coordinated across services |
| Local dev | `./run.sh` | docker-compose + 20 services |
| Ops complexity | Low | High (mesh, tracing, k8s) |
| Team scaling | ~20 engineers max | ~200+ engineers |

## pitfalls
- **Premature microservices**: 5-engineer team with 20 services → ops nightmare.
- **Shared database across "microservices"**: not microservices. Schema coupling defeats independence.
- **Synchronous chains**: A → B → C → D. One slow service = the chain stalls. Use async messaging where possible.
- **Distributed transactions via 2PC**: brittle. Use saga pattern.
- **No service ownership**: which team owns "payments service"? Ambiguity = stale code.
- **Forgetting backward compatibility**: deploying service B's breaking change before A migrates → 5xx storm.

## interviewTips
- For "should we split into microservices" — interrogate team size + deploy cadence + scaling needs. Default to modular monolith.
- For "design X" — start with a modular monolith; identify the seams where microservices would help.
- For senior interviews, discuss **bounded contexts** (DDD), **Conway's Law**, **saga + outbox** for cross-service consistency.

## code.python
```python
# Modular monolith: enforce boundaries via Python packages
# /src/orders/  - exposes Orders public API
# /src/payments/ - exposes Payments public API
# Cross-module imports allowed only from /<module>/api.py
from orders.api import place_order
from payments.api import charge

def checkout(user_id, cart):
    order_id = place_order(user_id, cart)
    charge(user_id, cart.total, order_id)
    return order_id
```

## code.javascript
```javascript
// Microservices: HTTP call across service boundary
const fetch = require('node-fetch');
async function checkout(userId, cart) {
  const order = await fetch('http://order-svc/orders', { method: 'POST', body: JSON.stringify({ userId, cart }) }).then(r => r.json());
  await fetch('http://payment-svc/charge', { method: 'POST', body: JSON.stringify({ userId, amount: cart.total, orderId: order.id }) });
  return order.id;
}
```

## code.java
```java
// Spring + Feign client for inter-service calls
@FeignClient(name = "order-svc")
interface OrderClient {
    @PostMapping("/orders")
    OrderDto place(@RequestBody PlaceOrderCmd cmd);
}
```

## code.cpp
```cpp
// C++ HTTP client via cpr or Boost.Beast
// Each service is its own process. Use gRPC for typed contracts.
// grpc::CreateChannel("order-svc:9090", grpc::InsecureChannelCredentials());
```
