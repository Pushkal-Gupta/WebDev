---
slug: materialized-view-maintenance
module: sd-storage
title: Materialized View Maintenance
subtitle: Pre-compute the expensive query once, then keep it fresh — incrementally, on a schedule, or on demand.
difficulty: Advanced
position: 2
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "PostgreSQL Docs — Materialized Views"
    url: "https://www.postgresql.org/docs/current/rules-materializedviews.html"
    type: book
  - title: "Wikipedia — Materialized View"
    url: "https://en.wikipedia.org/wiki/Materialized_view"
    type: blog
  - title: "PostgreSQL Wiki — Incremental View Maintenance"
    url: "https://wiki.postgresql.org/wiki/Incremental_View_Maintenance"
    type: blog
status: published
---

## intro
A materialized view stores the result of a query as if it were a table — the rows are computed once and persisted, so subsequent reads skip the join, aggregate, or window function that produced them. The hard part is not creating the view; it is keeping it consistent with the base tables as they change. Three strategies dominate: full refresh, incremental maintenance, and lazy (on-read) computation. Pick the wrong one and you either ship stale data or burn CPU recomputing every minute.

## whyItMatters
Every analytics dashboard, every leaderboard, every "trending now" widget, every aggregation that hits a billion-row fact table at user-request time has this problem. Without materialization, your dashboard times out at p99. With naive nightly full refresh, you ship 24-hour-stale numbers. With incremental maintenance, you ship freshness in seconds but pay the cost of tracking deltas. Snowflake, BigQuery, Materialize, ksqlDB, Flink SQL, ClickHouse, Postgres + pg_ivm, Oracle MViews, and SQL Server indexed views all exist because this trade-off shows up in nearly every production data system. System-design interviews touching read-heavy analytics, OLAP, real-time aggregations, or CQRS land here every time.

## intuition
Three strategies, three trade-offs. The mental model that organizes them: how much work do you do at write time, at refresh time, and at read time, and how stale is the data you serve?

**Full refresh (PostgreSQL `REFRESH MATERIALIZED VIEW`).** Write-time cost: zero. Refresh-time cost: rerun the entire defining query. Read-time cost: O(1) — it is just a table read. Staleness: as stale as the time between refreshes. This is the simplest strategy. It is correct as long as the defining query is deterministic. It falls over when the view is large and the refresh interval is short, because you redo the same join twenty times an hour. CONCURRENTLY refresh lets reads continue but doubles the storage during the swap.

**Incremental view maintenance (IVM).** Write-time cost: each base-table change emits a delta; the view is patched with that delta. Refresh-time cost: amortized into the writes. Read-time cost: O(1). Staleness: near-zero. The math is the algebra of relations: if the view is `SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id`, an INSERT of `(c=7, amount=5)` translates to `view[7] += 5`. A DELETE translates to `view[7] -= 5`. Joins are harder — you have to join the delta against the OPPOSITE base table to find new view rows, and remember the multiplicities. The general theory is bag-relational algebra with insert/delete deltas (DBToaster, the original Postgres IVM patches, Materialize's "differential dataflow", Flink's changelog stream). It is fast at read but expensive to engineer.

**Lazy / on-demand.** Compute on first read, cache the answer with a TTL, return the cached answer thereafter. Refresh-time cost: shifted to whichever read triggers the miss. Staleness: TTL-bounded. This is what almost every Redis-backed dashboard actually is — even when the team calls it a "materialized view," they have re-invented a cache. The pitfalls are stampede (many cold readers all rebuilding at once — fix with single-flight) and dogpiling on TTL expiration.

The right pick depends on the read-to-write ratio, the freshness requirement, and the query shape. A 100:1 read:write ratio with seconds-of-freshness requirement and a SUM-of-groups query is the textbook IVM win. A 1000:1 ratio with daily freshness and a 14-way join is full refresh nightly. A 5:1 ratio with eventual consistency and a complex query no one wants to maintain a delta function for is lazy with TTL.

## visualization
```
Base table: orders(customer_id, amount)
View V = SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id

--- FULL REFRESH ---
   orders changes ----> nothing
   on REFRESH:  drop V's contents, re-scan all orders, rebuild V
   cost = O(N) per refresh, regardless of how much changed

--- INCREMENTAL ---
   orders INSERT (c=7, +5) --> delta = {7: +5}
   apply delta to V:           V[7] = V[7] + 5
   orders DELETE (c=7, -5) --> delta = {7: -5}
   apply delta:                V[7] = V[7] - 5
   cost = O(delta) per change

--- LAZY (TTL cache) ---
   first read of V -> compute, cache for 60s, return
   subsequent reads -> return cached answer
   read after 60s   -> recompute (single-flight to avoid stampede)
```

## bruteForce
Re-run the defining query on every read. Correct, always fresh, and the simplest code you can ship — but the dashboard times out and the database CPU pegs. This is what you do when you have no choice (one-off ad-hoc query) and what you escape from the moment a second user hits the same view.

## optimal
Pick the strategy from the read-pattern and freshness budget; do not pick "the fancy one" by default. The decision tree most teams should follow:

**1. How fresh does the answer need to be?** If "minutes is fine," start with full refresh on a schedule. PostgreSQL's `REFRESH MATERIALIZED VIEW CONCURRENTLY` runs the query in the background, swaps the result atomically, and lets readers keep reading the old version during the rebuild. Snowflake, BigQuery, Redshift all offer the same primitive with different names.

**2. How fast does the view need to update?** If you need sub-second freshness on a high-churn base table, switch to IVM. The view must be expressible as a deltable algebraic expression — joins, aggregates, filters, unions are fine; window functions and recursive CTEs are usually not. The implementation pattern: on every base-table commit, derive the delta (in PG via trigger + CDC, in Flink via the changelog stream, in Materialize via persisted timely dataflow), then push the delta through the view's algebraic plan. SUM, COUNT, MIN/MAX with monotone inputs are cheap. AVG decomposes into SUM and COUNT. DISTINCT is hard. Joins multiply: a delta of size d on table A, joined against table B of size n, produces up to d*n new view rows.

**3. What's the read-to-write ratio?** If reads dominate by 100x or more, even an expensive IVM is worth it. If writes dominate, lazy with TTL is usually correct — paying per-write to keep the view fresh is wasted when most updates never get read.

**4. Does the view need transactional consistency with the base?** If yes, IVM in the same transaction (deferred trigger) or a synchronous update via the changelog. If "eventually correct in a few seconds" is acceptable, an async IVM consumer reading the WAL gives you the same answer at lower latency cost.

**Real-world templates.**
- "Top-N posts last 24h" on a social feed: IVM with a sliding-window aggregate, persisted in Redis or a denormalized table, updated from the post-write changelog. p99 read < 5ms; freshness < 2s.
- "Daily revenue by product category": nightly full refresh of a materialized view in the warehouse. p99 read < 100ms; freshness 24h.
- "User's notification count": lazy, cached in Redis with TTL = 30s, recomputed on miss. p99 read < 5ms; freshness 30s.
- "Real-time leaderboard with ties broken by timestamp": Redis sorted set updated synchronously on each score write — a hand-rolled IVM for a single query shape.

**Anti-pattern to avoid.** A trigger that re-runs the entire defining SELECT on every base-table write. This is full refresh disguised as incremental — write amplification proportional to the view size. If a view's update logic does not decompose cleanly into a delta, the view is not a good IVM candidate; use full refresh on a schedule instead.

The interview answer: "Three options — full refresh, incremental, lazy. Pick by read-to-write ratio and freshness budget. Default to full refresh on a schedule; reach for IVM only when sub-second freshness on a high-read view justifies the engineering."

## complexity
time: full refresh O(N) per refresh where N is the size of the defining query's output; incremental O(delta) per change with delta-vs-N savings amortized over reads; lazy O(N) on miss, O(1) on hit.
space: O(view-size) for the materialized result, plus O(delta-buffer) for IVM staging.
notes: For joins, IVM's per-change cost is O(d * |opposing side|) and can blow up with skew; this is why ksqlDB and Flink emphasize keyed joins.

## pitfalls
- **Full refresh without CONCURRENTLY blocks readers.** PostgreSQL's plain `REFRESH MATERIALIZED VIEW` takes an exclusive lock until done. Use `CONCURRENTLY` and create a unique index on the view, or accept the read outage.
- **IVM joins explode with skew.** A 1-row delta on the small side of a join with a 1M-row hot key produces 1M new view rows. Fix: pre-aggregate on the hot side, or bound the join's keyspace.
- **Lazy + TTL = cache stampede.** On TTL expiry, every reader recomputes simultaneously. Fix: single-flight (one rebuild, others wait) or jittered TTL with early-refresh.
- **Non-deterministic queries break refresh.** `CURRENT_TIMESTAMP`, `RANDOM()`, or volatile UDFs in the defining query mean every refresh returns different results unrelated to base-table changes. Treat the view as `IMMUTABLE` only if the query truly is.
- **Treating a refresh schedule as fresh data.** "Updated every hour" sounds fresh until your CEO opens the dashboard at minute 59. Set expectations in the UI — show "Last refreshed: 11:00 AM" alongside the numbers.

## interviewTips
- Frame the choice in one breath: "Full refresh is the simplest, IVM is the freshest, lazy + TTL is the cheapest — pick by read:write ratio and freshness budget."
- Be ready to derive the delta for SUM, COUNT, AVG, and a simple join. Interviewers love asking "what happens to your view when we INSERT this row?"
- Name the production failure modes: lock-during-refresh, cache stampede, join blow-up under skew. Showing you've operated this is what separates senior from staff.

## code.python
```python
from collections import defaultdict
from threading import Lock
import time

class FullRefreshMV:
    def __init__(self, query_fn):
        self.query_fn = query_fn; self.cache = None
    def refresh(self): self.cache = self.query_fn()
    def read(self): return self.cache

class IncrementalSumMV:
    """View: SELECT key, SUM(value) FROM base GROUP BY key."""
    def __init__(self):
        self.totals = defaultdict(int)
    def on_insert(self, key, value): self.totals[key] += value
    def on_delete(self, key, value): self.totals[key] -= value
    def on_update(self, key, old, new):
        self.on_delete(key, old); self.on_insert(key, new)
    def read(self, key): return self.totals[key]

class LazyTTLMV:
    def __init__(self, query_fn, ttl_seconds):
        self.query_fn = query_fn; self.ttl = ttl_seconds
        self.cache = None; self.expires_at = 0
        self.lock = Lock()
    def read(self):
        now = time.time()
        if self.cache is not None and now < self.expires_at:
            return self.cache
        with self.lock:                          # single-flight
            if self.cache is None or time.time() >= self.expires_at:
                self.cache = self.query_fn()
                self.expires_at = time.time() + self.ttl
        return self.cache
```

## code.javascript
```javascript
class FullRefreshMV {
  constructor(queryFn) { this.queryFn = queryFn; this.cache = null; }
  async refresh() { this.cache = await this.queryFn(); }
  read() { return this.cache; }
}

class IncrementalSumMV {
  constructor() { this.totals = new Map(); }
  onInsert(key, value) { this.totals.set(key, (this.totals.get(key) || 0) + value); }
  onDelete(key, value) { this.totals.set(key, (this.totals.get(key) || 0) - value); }
  onUpdate(key, oldV, newV) { this.onDelete(key, oldV); this.onInsert(key, newV); }
  read(key) { return this.totals.get(key) || 0; }
}

class LazyTTLMV {
  constructor(queryFn, ttlMs) {
    this.queryFn = queryFn; this.ttlMs = ttlMs;
    this.cache = null; this.expiresAt = 0; this.inflight = null;
  }
  async read() {
    const now = Date.now();
    if (this.cache !== null && now < this.expiresAt) return this.cache;
    if (this.inflight) return this.inflight;     // single-flight
    this.inflight = (async () => {
      this.cache = await this.queryFn();
      this.expiresAt = Date.now() + this.ttlMs;
      this.inflight = null;
      return this.cache;
    })();
    return this.inflight;
  }
}
```

## code.java
```java
import java.util.*;
import java.util.concurrent.locks.*;
import java.util.function.*;

class IncrementalSumMV<K> {
    private final Map<K, Long> totals = new HashMap<>();
    public void onInsert(K key, long v) { totals.merge(key, v, Long::sum); }
    public void onDelete(K key, long v) { totals.merge(key, -v, Long::sum); }
    public void onUpdate(K key, long oldV, long newV) { onDelete(key, oldV); onInsert(key, newV); }
    public long read(K key) { return totals.getOrDefault(key, 0L); }
}

class LazyTTLMV<T> {
    private final Supplier<T> queryFn;
    private final long ttlMs;
    private final ReentrantLock lock = new ReentrantLock();
    private T cache; private long expiresAt;
    public LazyTTLMV(Supplier<T> q, long ttl) { this.queryFn = q; this.ttlMs = ttl; }
    public T read() {
        long now = System.currentTimeMillis();
        if (cache != null && now < expiresAt) return cache;
        lock.lock();
        try {
            if (cache == null || System.currentTimeMillis() >= expiresAt) {
                cache = queryFn.get();
                expiresAt = System.currentTimeMillis() + ttlMs;
            }
            return cache;
        } finally { lock.unlock(); }
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <functional>
#include <mutex>
#include <chrono>

template <typename K>
class IncrementalSumMV {
    std::unordered_map<K, long long> totals;
public:
    void on_insert(const K& k, long long v) { totals[k] += v; }
    void on_delete(const K& k, long long v) { totals[k] -= v; }
    void on_update(const K& k, long long old_v, long long new_v) {
        on_delete(k, old_v); on_insert(k, new_v);
    }
    long long read(const K& k) {
        auto it = totals.find(k); return it == totals.end() ? 0 : it->second;
    }
};

template <typename T>
class LazyTTLMV {
    std::function<T()> query_fn;
    std::chrono::milliseconds ttl;
    std::mutex mu;
    T cache; bool has = false;
    std::chrono::steady_clock::time_point expires_at;
public:
    LazyTTLMV(std::function<T()> q, std::chrono::milliseconds t) : query_fn(q), ttl(t) {}
    T read() {
        auto now = std::chrono::steady_clock::now();
        std::lock_guard<std::mutex> g(mu);
        if (!has || now >= expires_at) {
            cache = query_fn();
            expires_at = std::chrono::steady_clock::now() + ttl;
            has = true;
        }
        return cache;
    }
};
```
