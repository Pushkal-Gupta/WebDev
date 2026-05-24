---
slug: cqrs-pattern
module: system-design
title: CQRS — Command Query Responsibility Segregation
subtitle: Separate the write model (commands) from the read model (queries) — each can scale, optimize, and evolve independently.
difficulty: Advanced
position: 28
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — CQRS"
    url: "https://martinfowler.com/bliki/CQRS.html"
    type: book
  - title: "Microservices.io — CQRS pattern"
    url: "https://microservices.io/patterns/data/cqrs.html"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
**CQRS** (Command Query Responsibility Segregation) splits an app's data model into two: a **write model** that handles commands (`PlaceOrder`, `UpdatePrice`) and a **read model** that handles queries (`GetOrderSummary`, `SearchProducts`). The two can use different schemas, different databases, even different consistency guarantees. Commands write to the write store; events or change-data-capture sync the read store; queries hit the read store.

## whyItMatters
CQRS is the standard pattern when:
- **Read load >> write load** by orders of magnitude (e.g., e-commerce: 1 write, 1000 reads per product view).
- **Queries need denormalized shape** that's expensive to compute on the write side.
- **Compliance / audit** requires the write side to be a tamper-evident log of intent.
- **Microservices** where one service owns writes, others compose read projections.

Paired with **event sourcing** it becomes nearly a default for ledger-style systems (payments, bookings, inventory).

## intuition
- **Command side**: tightly normalized, single source of truth, ACID transactions. Slow per-op but consistent.
- **Read side**: one denormalized table per query view ("product list with thumbnails," "user timeline"). Eventually consistent. Fast.
- **Sync**: commands emit events (or CDC reads write log) → projectors update read tables.

Reads are now **lag-tolerant** (UI shows "Your order was placed; details syncing…" for ~100ms) but **massively cheaper** to serve.

## visualization
```
WRITE SIDE                         READ SIDE
┌───────────────────────────┐     ┌────────────────────────────┐
│ POST /orders               │     │ GET /orders/123 (cached)   │
│ → Order.placeOrder()       │     │ → SELECT * FROM order_view │
│ → DB: insert orders, items │     │   WHERE id=123             │
│ → emit OrderPlaced event   │     └────────────────────────────┘
└───────────────────────────┘                ▲
              │                              │
              ▼                              │
       ┌──────────────┐                      │
       │   Event Bus  │ ──────►  Projector ──┘
       │   (Kafka)    │          (rebuilds order_view + product_view + customer_view)
       └──────────────┘
```

## bruteForce
**Single model** for reads + writes: simple but locks you into one schema. Read-heavy workloads hammer the write database; query optimization fights write performance.

**Just add read replicas**: helps with read scale but read schema = write schema, so denormalized queries are still slow.

**Just add a cache**: invalidation is hard; doesn't handle complex denormalized queries.

CQRS gives independent schemas + independent scaling.

## optimal
**Write side**:
- Normalized RDBMS (Postgres, MySQL) optimized for transactional integrity.
- Aggregates enforce business invariants (e.g., "can't ship an order that's not paid").
- Commands return success/failure, NOT the full new state — clients re-query the read side.

**Event emission**:
- **Outbox pattern**: atomic DB write + event insert in same TX; relay publishes to bus.
- **CDC** (Debezium): WAL → Kafka. No app code changes; works as long as projectors can interpret the WAL.

**Read side**:
- Per-query denormalized tables in Postgres / Elasticsearch / Redis.
- Eventual consistency window: typically 10ms-1s.
- Projectors are idempotent — re-running rebuilds the view.

**Eventual consistency UX**:
- After command, show a "Saved" toast immediately, navigate to read-side view.
- For read-your-writes, queue the new state client-side and merge with read-side response.

## complexity
- **Write latency**: same as before (write to write store + event emit, both in one TX via outbox).
- **Read latency**: lower (denormalized fetch, no joins).
- **Storage**: 2-5x write store size (multiple read projections).
- **Operational complexity**: 2 stores, 1 event bus, N projectors. Real ops cost.

## pitfalls
- **Forgetting idempotent projectors**: events may be redelivered. Use `processed_event_ids` table.
- **Reasoning about staleness**: client may see "old" data milliseconds after a write. UX must accommodate.
- **Rebuild cost**: changing a read schema requires re-projecting all events; can take hours.
- **CQRS without event sourcing**: harder to rebuild read sides from scratch (need full WAL replay).
- **Over-engineering**: a 100-user app doesn't need CQRS. The write/read split adds operational cost.

## interviewTips
- For "design read-heavy domain with complex queries" → CQRS.
- For "design audit-compliant ledger" → CQRS + event sourcing.
- Mention **outbox pattern** as the typical event emission mechanism.
- For senior interviews, discuss **eventual consistency UX**: optimistic UI, "Your action was saved" toasts, server-confirmed merges.

## code.python
```python
# Command handler (write side)
def handle_place_order(cmd):
    with db.transaction():
        order_id = db.insert('orders', cmd.fields)
        db.insert('outbox', {
            'event_type': 'OrderPlaced',
            'aggregate_id': str(order_id),
            'payload': json.dumps(cmd.fields),
        })
    return order_id

# Projector (read side)
def project_order_placed(event):
    db.execute(
        "INSERT INTO order_view (order_id, total, items_count, customer_name) "
        "VALUES (%s, %s, %s, %s) ON CONFLICT (order_id) DO UPDATE SET total = EXCLUDED.total",
        (event['order_id'], event['total'], len(event['items']), event['customer_name']),
    )

# Query (read side)
def get_order_summary(order_id):
    return db.fetch_one('SELECT * FROM order_view WHERE order_id = %s', (order_id,))
```

## code.javascript
```javascript
// Write command
async function placeOrder(cmd) {
  await db.transaction(async (tx) => {
    const { id } = await tx.one('INSERT INTO orders (...) VALUES (...) RETURNING id', cmd);
    await tx.none('INSERT INTO outbox (event_type, payload) VALUES ($1, $2)',
                  ['OrderPlaced', JSON.stringify(cmd)]);
  });
}
// Read query
async function getOrderSummary(orderId) {
  return db.one('SELECT * FROM order_view WHERE order_id = $1', orderId);
}
```

## code.java
```java
@Service
class OrderCommandHandler {
    @Transactional
    public Long placeOrder(PlaceOrderCommand cmd) {
        Long id = orderRepo.save(new Order(cmd));
        outboxRepo.save(new OutboxEvent("OrderPlaced", id, toJson(cmd)));
        return id;
    }
}
@Repository
interface OrderViewRepository extends JpaRepository<OrderView, Long> {}
```

## code.cpp
```cpp
// In-app CQRS without a framework — pair with outbox + Kafka relay
void place_order(Database& db, const PlaceOrderCommand& cmd) {
    auto tx = db.begin();
    auto id = tx.insert("orders", cmd.fields);
    tx.insert("outbox", {{"event_type", "OrderPlaced"}, {"aggregate_id", std::to_string(id)},
                         {"payload", cmd.to_json()}});
    tx.commit();
}
```
