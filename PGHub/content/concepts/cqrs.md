---
slug: cqrs
module: sd-storage
title: CQRS — Command Query Responsibility Segregation
subtitle: Separate write model from read model — scale, optimize, and evolve each independently, usually paired with event sourcing.
difficulty: Advanced
position: 71
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — CQRS"
    url: "https://martinfowler.com/bliki/CQRS.html"
    type: blog
  - title: "Greg Young — CQRS Documents (PDF)"
    url: "https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf"
    type: paper
  - title: "Microsoft — Cloud Design Patterns: CQRS"
    url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs"
    type: docs
  - title: "Microservices.io — CQRS pattern"
    url: "https://microservices.io/patterns/data/cqrs.html"
    type: docs
status: published
---

## intro
**CQRS** (Command Query Responsibility Segregation) splits a domain into two models: a **write model** that accepts commands (`PlaceOrder`, `CancelShipment`, `AdjustPrice`) and a **read model** that answers queries (`GetOrderSummary`, `SearchInventory`, `RenderDashboard`). The two can use different schemas, different stores, even different consistency guarantees. Writes update the write store; an event stream or CDC pipeline projects changes into one or more read stores tuned for query shape. Coined by Greg Young in 2010, popularized by Martin Fowler, productionized by every event-sourced system at scale.

## whyItMatters
A single ORM-backed entity that handles both writes and reads collapses under two conflicting pressures: writes want a normalized model with strict invariants and transactional integrity; reads want denormalized, pre-joined, paginated, search-indexed shapes that vary per screen. As the product grows, your `Order` aggregate sprouts 40 query methods and 200 joins, and every read hits the same row-locked write path. CQRS resolves the tension by giving each side its own model and its own store. Event-sourced systems (EventStoreDB, Axon, Kafka-as-source-of-truth designs) naturally lead into CQRS because the events are the input to projections, and projections are read models. Microsoft used it in Azure Service Fabric reference architectures; Uber, Booking, and Walmart all run variants at scale.

## intuition
Think of a bank. The **write side** cares about correctness: every debit must have a matching credit, no overdraft, balance never goes negative. It runs against a normalized ledger with row-level locks and ACID transactions. Operations are small ("post a transfer") but tightly invariant.

The **read side** cares about presentation: "show me the customer's last 30 days of transactions grouped by category, with running balance, ranked by spend". That's a wide, denormalized projection. Running it against the write schema requires joins across `accounts`, `transactions`, `categories`, plus a window function for running balance — fine at 100 customers, brutal at 10 million.

CQRS gives you both. The write store stays the lean ledger. After every successful command, an event (`MoneyTransferred`) lands on a bus. A **projector** consumes the event and updates one or more read-side stores: a Postgres materialized view tuned for transaction lists, an Elasticsearch index for full-text search, a Redis sorted set for "top 10 merchants this month". Each read model is built specifically for the screen that consumes it; the write model is built specifically for the invariant it protects.

The mental model shift: stop treating "the database" as one thing. The write store is your **source of truth**. The read stores are **derived state** — disposable, re-buildable from events. If you change a read schema, you replay events and rebuild. If you add a new screen, you spin up a new projector. The read side becomes plural; the write side stays singular and small.

The optional but common pairing: **event sourcing**. Instead of storing the current state of an `Account`, store the full history of events (`Opened`, `Deposited`, `Withdrew`). Current state is a fold of the events. Read models are also folds — different shape, same input. You get audit history, time travel, and the ability to rebuild any read model from scratch as a free side effect.

## visualization
```
Client
  |
  | command: PlaceOrder(...)
  v
+----------------+        +---------+
| Command Handler|--TX--->| Write   |
|  (validates    |        | Store   |
|   invariants)  |        | (orders)|
+--------+-------+        +----+----+
         |  publishes            |  outbox / CDC
         |  OrderPlaced event    |
         v                       v
   +-----+--------- event bus -----------+
                    |       |       |
                    v       v       v
              +--------+ +------+ +-------+
              |Projector A | B  | |   C   |
              | (summary)  |(srch)|(metric)|
              +-----+------+------++--+----+
                    |       |        |
                    v       v        v
              Read store  ES idx   Redis
                    \       |       /
                     \      |      /
                      v     v     v
                  +-------------+
                  | Query API   |
                  | (read-only) |
                  +------+------+
                         |
                         v
                       Client
```

## bruteForce
One model, one database, every method on the same aggregate. Reads run against the write tables; queries grow joins; the same ORM hydrates `Order` whether you're updating a status or rendering a CSV export. It scales until it doesn't — usually at the moment a marketing dashboard query starts row-locking the order-placement path during business hours. The pragmatic stopgap is read replicas: same schema, async copy. That buys read throughput but not read *shape* — you still pay the join cost on every page load, just on a different node.

## optimal
**Write side**:
- One canonical write store (Postgres, Aurora, EventStore). Normalized, strict, transactional.
- Commands are typed objects (`PlaceOrder`, `CancelOrder`) with explicit validation. Reject invalid commands at the boundary.
- Each command handler runs in a transaction: validate, mutate the write model, emit one or more domain events to an **outbox** table *in the same TX*. This is the durable atomic step.
- A relay (Debezium, custom poller, or transactional outbox shipper) reads the outbox and pushes events to Kafka / Kinesis / NATS.

**Read side**:
- Multiple read stores, each shaped for a specific query family. Postgres materialized view for "order list", Elasticsearch for search, Redis sorted set for leaderboards, ClickHouse for analytics.
- **Projectors** are consumers that read events and update read stores idempotently. Track the last-processed event offset per (projector, partition).
- Queries are read-only; they never mutate. Cache aggressively; rebuild whenever the schema changes by replaying from offset 0.

**Consistency model**:
- Within the write side: strong, transactional.
- Across write-to-read: eventually consistent. Typical lag is 10ms-2s depending on the bus.
- Within a single read store: whatever that store guarantees (Postgres MV refresh is atomic; ES index updates are near-real-time).

**UX patterns for eventual consistency**:
- **Optimistic UI**: show the new state immediately after the command succeeds, then reconcile against the read side.
- **Command-then-read pattern**: return the new state from the command handler so the client doesn't need to re-query.
- **Read-your-writes via session sticky**: route the requesting user's subsequent reads to the freshest projection for ~5s.

**When to reach for it**:
- Read-heavy domain with screens that demand different shapes.
- Need for audit trail / time travel → CQRS + event sourcing.
- Multi-region read scaling: project events into regional read stores.
- Skip CQRS if your read shape is one-to-one with your write shape — you're paying complexity tax for nothing.

## complexity
- **Read latency**: lower — denormalized fetch, no joins, often cache-warmed.
- **Write latency**: same as before plus the outbox insert (one row in the same TX).
- **End-to-end lag**: 10ms-2s typical from command to read-side reflection.
- **Storage cost**: 2-5x the write store (one write store + N read stores + event log).
- **Operational cost**: bus, projectors, replay tooling, monitoring per projector lag. Real ops surface.

## pitfalls
- **Non-idempotent projectors**. Events get redelivered after a crash; a non-idempotent projector double-counts. Track a `processed_event_ids` set per projector or use an idempotency key derived from the event ID.
- **Out-of-order events between projector partitions**. If `OrderPlaced` and `OrderShipped` route to different partitions, the projector might apply Shipped before Placed. Partition by aggregate ID so per-aggregate order is preserved.
- **Unbounded outbox**. Never garbage-collect the outbox and it grows forever. Sweep on a TTL after the relay confirms delivery.
- **CQRS without event sourcing**. You can do it, but rebuilding a read store now requires CDC replay from a point-in-time backup; with event sourcing you replay events from offset 0. Most teams that adopt CQRS regret skipping ES six months later.
- **Skipping the eventual-consistency UX work**. Your dashboard shows stale data for 800ms after a write, users assume the action didn't take, they retry, and you've doubled the invariants you have to enforce. Build optimistic UI and "submitted, syncing…" affordances *before* the first CQRS rollout, not after the first complaint.
- **Over-engineering**. A CRUD app with 50 users does not need CQRS. The two-store cost (operational, cognitive, latency) only pays off when read and write shapes diverge meaningfully and one side is the bottleneck.

## interviewTips
- For "design an audit-compliant ledger / event-sourced order system / multi-screen dashboard" — CQRS is the answer; volunteer it.
- Always mention the **outbox pattern** as the atomic write-to-event bridge. Without it, you have dual-writes and possible state divergence.
- Know **CQRS vs read replicas**. Read replicas scale throughput, not shape. CQRS lets each read store be a different *kind* of database. Senior interviewers want both terms in your answer.
- Discuss the **eventual-consistency UX** explicitly — optimistic UI, command-then-read response shape, read-your-writes session affinity. Architecture diagrams alone aren't enough.

## code.python
```python
# Command handler with transactional outbox + idempotent projector.
import json
import uuid

# WRITE SIDE
def place_order(cmd: dict) -> str:
    order_id = str(uuid.uuid4())
    with db.transaction():                                # atomic write + outbox
        db.execute(
            "INSERT INTO orders (id, customer_id, total, status) VALUES (%s,%s,%s,'PLACED')",
            (order_id, cmd['customer_id'], cmd['total']),
        )
        db.execute(
            "INSERT INTO outbox (id, aggregate_id, event_type, payload, created_at) "
            "VALUES (%s, %s, %s, %s, NOW())",
            (str(uuid.uuid4()), order_id, 'OrderPlaced', json.dumps(cmd)),
        )
    return order_id

# RELAY (separate process)
def relay_outbox():
    for row in db.fetch("SELECT * FROM outbox WHERE delivered = FALSE ORDER BY created_at LIMIT 100"):
        bus.publish('orders', row['payload'], key=row['aggregate_id'])
        db.execute("UPDATE outbox SET delivered = TRUE WHERE id = %s", (row['id'],))

# READ SIDE PROJECTOR
def project_order_placed(event_id: str, event: dict) -> None:
    # Idempotency: skip if already applied.
    if db.fetch_one("SELECT 1 FROM projector_offsets WHERE event_id = %s", (event_id,)):
        return
    with db.transaction():
        db.execute(
            "INSERT INTO order_summary_view (order_id, customer_id, total, status) "
            "VALUES (%s,%s,%s,'PLACED') "
            "ON CONFLICT (order_id) DO UPDATE SET status = EXCLUDED.status",
            (event['order_id'], event['customer_id'], event['total']),
        )
        db.execute("INSERT INTO projector_offsets (event_id) VALUES (%s)", (event_id,))

# QUERY SIDE (read-only)
def get_order_summary(order_id: str) -> dict:
    return db.fetch_one("SELECT * FROM order_summary_view WHERE order_id = %s", (order_id,))
```

## code.javascript
```javascript
// Command/query split with explicit handlers; outbox pattern as TX.
import { randomUUID } from 'node:crypto';

// COMMAND HANDLER
async function placeOrder(cmd, db) {
  const orderId = randomUUID();
  await db.tx(async (t) => {
    await t.query(
      'INSERT INTO orders (id, customer_id, total, status) VALUES ($1,$2,$3,$4)',
      [orderId, cmd.customerId, cmd.total, 'PLACED'],
    );
    await t.query(
      'INSERT INTO outbox (id, aggregate_id, event_type, payload) VALUES ($1,$2,$3,$4)',
      [randomUUID(), orderId, 'OrderPlaced', JSON.stringify({ ...cmd, orderId })],
    );
  });
  return orderId;
}

// PROJECTOR (idempotent via event_id)
async function projectOrderPlaced(eventId, event, db) {
  const already = await db.query('SELECT 1 FROM projector_offsets WHERE event_id=$1', [eventId]);
  if (already.rowCount) return;
  await db.tx(async (t) => {
    await t.query(
      `INSERT INTO order_summary_view (order_id, customer_id, total, status)
       VALUES ($1,$2,$3,'PLACED')
       ON CONFLICT (order_id) DO UPDATE SET total = EXCLUDED.total`,
      [event.orderId, event.customerId, event.total],
    );
    await t.query('INSERT INTO projector_offsets (event_id) VALUES ($1)', [eventId]);
  });
}

// QUERY HANDLER (read-only)
async function getOrderSummary(orderId, db) {
  const { rows } = await db.query('SELECT * FROM order_summary_view WHERE order_id=$1', [orderId]);
  return rows[0];
}
```

## code.java
```java
// Command + query handler interfaces. The write store and read store are
// distinct beans; commands never reach the read repository.
public interface Command {}
public interface Query<T> {}

public record PlaceOrder(String customerId, long totalCents) implements Command {}
public record GetOrderSummary(String orderId) implements Query<OrderSummaryDto> {}

public class PlaceOrderHandler {
    private final WriteRepo writes;
    private final OutboxRepo outbox;
    public PlaceOrderHandler(WriteRepo w, OutboxRepo o) { this.writes = w; this.outbox = o; }

    @Transactional
    public String handle(PlaceOrder cmd) {
        String id = java.util.UUID.randomUUID().toString();
        writes.insertOrder(id, cmd.customerId(), cmd.totalCents(), "PLACED");
        outbox.append("OrderPlaced", id, Map.of(
            "orderId", id, "customerId", cmd.customerId(), "total", cmd.totalCents()
        ));
        return id;
    }
}

public class GetOrderSummaryHandler {
    private final ReadRepo reads;     // distinct datasource
    public GetOrderSummaryHandler(ReadRepo r) { this.reads = r; }
    public OrderSummaryDto handle(GetOrderSummary q) {
        return reads.findSummary(q.orderId());
    }
}
```

## code.cpp
```cpp
// CQRS sketch in C++: command bus dispatches to write handlers; query bus
// dispatches to read handlers. Distinct repositories per side.
#include <string>
#include <variant>
#include <unordered_map>
#include <functional>

struct PlaceOrder      { std::string customer_id; long total_cents; };
struct GetOrderSummary { std::string order_id; };

struct OrderSummary    { std::string order_id; std::string status; long total_cents; };

class WriteRepo;  class ReadRepo;  class OutboxRepo;

class CommandBus {
public:
    std::string handle(const PlaceOrder& c, WriteRepo& w, OutboxRepo& o);
};

class QueryBus {
public:
    OrderSummary handle(const GetOrderSummary& q, ReadRepo& r);
};

// Implementation (sketch)
std::string CommandBus::handle(const PlaceOrder& c, WriteRepo& w, OutboxRepo& o) {
    auto id = new_uuid();
    auto tx = w.begin();
    w.insert_order(tx, id, c.customer_id, c.total_cents, "PLACED");
    o.append(tx, "OrderPlaced", id, /* payload json */ {});
    tx.commit();
    return id;
}

OrderSummary QueryBus::handle(const GetOrderSummary& q, ReadRepo& r) {
    return r.find_summary(q.order_id);
}
```
