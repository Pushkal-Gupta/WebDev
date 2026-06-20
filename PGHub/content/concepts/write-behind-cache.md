---
slug: write-behind-cache
module: sd-storage
title: Write-Behind Cache
subtitle: Write to the cache, ack the client, flush to the database asynchronously — speed in exchange for a durability window.
difficulty: Advanced
position: 47
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Microsoft Azure — Cache-Aside Pattern (covers write-through and write-behind)"
    url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside"
    type: book
  - title: "AWS — Caching Best Practices (write-through, lazy loading)"
    url: "https://aws.amazon.com/caching/best-practices/"
    type: blog
  - title: "AWS ElastiCache — Caching Strategies"
    url: "https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/Strategies.html"
    type: book
  - title: "Ehcache 3 — Write-Behind Configuration"
    url: "https://www.ehcache.org/documentation/3.10/writers.html"
    type: book
status: published
---

## intro
A write-behind cache (also called write-back) takes a write request, updates the cache, returns success immediately, and then asynchronously flushes the change to the backing database in the background. The client never waits on disk. The trade-off is sharp: if the cache node dies before the flush completes, those acknowledged writes are gone. Compared to write-through (synchronous DB write) and write-around (skip cache on write), write-behind is the highest-throughput, lowest-latency, lowest-durability point on the spectrum.

## whyItMatters
- **Latency budget**. Returning a write in 200 microseconds (Redis RAM) versus 10 milliseconds (Postgres + replication) is the difference between a snappy product and a sluggish one. High-volume counters, leaderboards, view counts, session updates, and analytics events almost always end up in some form of write-behind tier.
- **Throughput multiplier**. Coalescing 1,000 cache writes for the same key into one database write cuts disk IOPS by 1000x. Reactive batching means the database sees aggregated work, not raw load.
- **Operational reality**. MySQL InnoDB's buffer pool, Postgres's WAL + checkpoint cycle, Linux's page cache, every CPU's L1/L2/L3 — they are all write-behind systems internally. The pattern shows up at every layer; the question is always "how long is the durability window and what fails if power cuts now."
- **Interview frequency**. Designing Twitter's timeline cache, Uber's surge multiplier, a metrics pipeline, a session store, or a write-heavy social feed almost always lands on this trade-off. Knowing when to pick write-behind (and when not to) separates senior from junior answers.

## intuition
Three patterns, one decision: where does the write land first, and when does the client get told "done"?

**Write-through** is the safe path. The application writes to the cache and the database in the same request; both must succeed before the client gets an ack. Cache and database are kept in lock-step. The cost is straightforward — every write pays the database's latency. A 10 ms database write means a 10 ms minimum client-visible write, even if the cache itself is microsecond-fast. The benefit is that no acknowledged write is ever at risk; if the cache disappears, the database is already current.

**Write-around** punts. The application writes directly to the database and either skips the cache or invalidates the relevant key. The next read suffers a cache miss and refills. This is what you want when writes vastly outnumber reads of the same item (logs, audit trails) — caching them on write would just churn the cache for no benefit. Latency is still bounded by database write speed; cache stays cool but reads pay miss penalties on freshly written data.

**Write-behind** sells durability for speed. The application writes to the cache only. The cache acks immediately. A background worker — sometimes called a write coalescer, sometimes a flusher — pulls dirty entries from the cache and writes them to the database in batches. The cache holds the system's true state for that brief window. Throughput climbs because batching turns thousands of small DB writes into one large one; latency drops because the request path never touches the database. The price is the *durability window*: if the cache dies between the ack and the flush, those writes are lost. There is no log to replay, no journal to recover from, unless you build one.

How long is the window? That is the entire tuning knob. Flush every 50 ms and you risk only 50 ms of writes per failure. Flush every 5 seconds and you can lose 5 seconds of acknowledged writes. Some systems mitigate by writing to a durable log (Kafka, an append-only file) before acking — this is no longer pure write-behind, it is write-behind-with-a-WAL, which is what every production database actually does. The cache becomes a fast in-memory index over a durable log.

The decision rule for the interview: if a lost write would corrupt money, identity, or auth state, use write-through. If lost writes would only mean a slightly stale counter, a missed metric, or a forgotten session click, write-behind is on the table — pair it with a durable log if you cannot tolerate ANY loss.

## visualization
```
write-through (sync, safe, slow)
  client --write--> [cache] --write--> [db]
                          \---------> ack
  every write pays db latency; cache + db in lock-step

write-around (skip cache on write)
  client --write--> [db]   (cache invalidated)
                       \-> ack
  cold cache for the key; reads after a write miss + refill

write-behind (async, fast, risky)
  client --write--> [cache] ---ack (microseconds)
                       |
                  [dirty queue]
                       |
                       v
                 [flusher worker] --batch--> [db]
  ack returns before db sees the write
  if cache dies before flush -> writes lost
```

## bruteForce
The naive write path is the safest: write the database synchronously, invalidate or update the cache, then return success. Every acknowledged write is on disk before the client moves on. This is write-through with cache-aside semantics. It is correct and easy to reason about but the request thread blocks on disk for every single write. Under load, write latency tracks database latency, and the cache provides zero throughput benefit on the write path. For write-heavy workloads, the database becomes the bottleneck and the cache is essentially decorative for writes.

## optimal
**Write-behind with bounded durability window** is the high-throughput answer. The application writes to the cache, the cache marks the entry dirty and returns immediately, and a flusher thread drains the dirty set into the backing store on a schedule.

```python
import time, threading, queue

class WriteBehindCache:
    def __init__(self, db, flush_interval_ms=100, batch_size=500):
        self.store = {}                  # key -> value
        self.dirty = {}                  # key -> value pending flush
        self.lock = threading.Lock()
        self.db = db
        self.flush_interval = flush_interval_ms / 1000
        self.batch_size = batch_size
        threading.Thread(target=self._flush_loop, daemon=True).start()

    def put(self, key, value):
        with self.lock:
            self.store[key] = value
            self.dirty[key] = value      # latest value wins; coalesces repeats

    def get(self, key):
        with self.lock:
            return self.store.get(key)

    def _flush_loop(self):
        while True:
            time.sleep(self.flush_interval)
            with self.lock:
                batch = list(self.dirty.items())[: self.batch_size]
                for k, _ in batch:
                    del self.dirty[k]
            if batch:
                try:
                    self.db.bulk_upsert(batch)
                except Exception:
                    with self.lock:
                        for k, v in batch:
                            self.dirty.setdefault(k, v)   # retry next tick
```

Why this is the right shape: the dirty set is a map (not a list), so a thousand writes to the same hot key coalesce into one database write — the database sees the latest value, not the history. The flush is bounded by `batch_size` to keep latency spikes off the critical path, and by `flush_interval` to bound the durability window. On flush failure, dirty entries are re-queued; nothing is silently dropped. To survive cache death, prepend a write to an append-only log (a Kafka topic, a local WAL file) before returning the ack — recovery replays the log on cache restart.

**Coalescing math**: if a key is written N times per flush interval, the database sees 1 write instead of N. For a hot counter under 10,000 increments per second with a 100 ms flush window, the database sees 10 writes per second instead of 10,000 — a 1000x reduction.

**Where this loses**: writes that must be durable on ack (payments, auth state, audit logs) — use write-through. Writes whose latest value is not the "right" merge (event streams where every write matters, append-only logs) — coalescing loses data, so use a real event queue. Multi-writer caches on the same key with strict ordering requirements — flush-order vs write-order can differ; you need a versioned merge or a single-writer per key.

**Production refinements**: write to a Kafka topic synchronously, then update the cache asynchronously — Kafka becomes the durable log, the cache is just a fast read tier. Or use Redis with AOF persistence + `appendfsync everysec` for a ~1-second durability window without an external log.

## complexity
time: O(1) per write (cache update + dirty-set insert); O(batch_size) per flush tick; O(B/k) database writes per second for k coalescible hot keys vs B writes/s raw.
space: O(N) for the cache + O(D) for the dirty set, where D <= N is the number of unflushed keys; durability window <= flush_interval.

## pitfalls
- **Losing writes on cache crash**. The defining failure mode. Without a durable log between client and cache, every unflushed write is gone if the cache process dies. Fix: write to a WAL or Kafka topic before acking, or accept the loss and pick a tiny flush interval (10-50 ms) and replication for the cache.
- **Flusher falling behind**. If write rate exceeds flush rate (slow database, large batch), the dirty set grows without bound and the durability window stretches. Fix: cap the dirty-set size and apply backpressure (reject new writes or fall back to write-through) when the queue exceeds threshold.
- **Read-your-writes inconsistency across cache and database**. A reader querying the database directly will see stale data until the flush completes. Fix: always read through the cache, or accept eventual consistency and document it.
- **Lost coalescing on overflow**. If the dirty set evicts under memory pressure before flushing, those writes vanish without ever reaching the database. Fix: never evict dirty entries; only evict clean (already-flushed) ones, and surface "dirty cache full" as a hard backpressure signal.
- **Ordering violations across keys**. A write-behind flush might batch keys in an order different from the write order. If two keys have a foreign-key dependency, the database may see a child before its parent. Fix: order the flush by write timestamp or constrain dependent writes to use write-through.

## interviewTips
- Name the three strategies (write-through, write-around, write-behind) and the axis they trade on (latency vs durability). The interviewer wants the trade-off articulated, not just the chosen pattern.
- For any "design a write-heavy system" question, ask "how much loss is acceptable on cache failure?" before picking write-behind. If the answer is "zero," reach for write-through or a WAL-fronted write-behind.
- Mention coalescing as the throughput unlock — "1,000 writes to the same key become one DB write at flush time" — it is the concrete benefit that separates this from naive async writes.

## code.python
```python
import threading, time

class WriteBehindCache:
    def __init__(self, db, flush_ms=100, batch=500):
        self.store, self.dirty = {}, {}
        self.lock = threading.Lock()
        self.db, self.flush_ms, self.batch = db, flush_ms, batch
        threading.Thread(target=self._loop, daemon=True).start()

    def put(self, k, v):
        with self.lock:
            self.store[k] = v
            self.dirty[k] = v

    def get(self, k):
        with self.lock:
            return self.store.get(k)

    def _loop(self):
        while True:
            time.sleep(self.flush_ms / 1000)
            with self.lock:
                items = list(self.dirty.items())[: self.batch]
                for k, _ in items:
                    del self.dirty[k]
            if items:
                try:
                    self.db.bulk_upsert(items)
                except Exception:
                    with self.lock:
                        for k, v in items:
                            self.dirty.setdefault(k, v)
```

## code.javascript
```javascript
class WriteBehindCache {
  constructor(db, { flushMs = 100, batch = 500 } = {}) {
    this.store = new Map();
    this.dirty = new Map();
    this.db = db;
    this.batch = batch;
    this.timer = setInterval(() => this._flush(), flushMs);
  }
  put(k, v) {
    this.store.set(k, v);
    this.dirty.set(k, v);
  }
  get(k) {
    return this.store.get(k);
  }
  async _flush() {
    if (this.dirty.size === 0) return;
    const items = [...this.dirty.entries()].slice(0, this.batch);
    for (const [k] of items) this.dirty.delete(k);
    try {
      await this.db.bulkUpsert(items);
    } catch {
      for (const [k, v] of items) if (!this.dirty.has(k)) this.dirty.set(k, v);
    }
  }
  stop() { clearInterval(this.timer); }
}
```

## code.java
```java
import java.util.*;
import java.util.concurrent.*;

public class WriteBehindCache<K, V> {
    private final Map<K, V> store = new ConcurrentHashMap<>();
    private final Map<K, V> dirty = new ConcurrentHashMap<>();
    private final Database<K, V> db;
    private final int batch;

    public WriteBehindCache(Database<K, V> db, long flushMs, int batch) {
        this.db = db;
        this.batch = batch;
        Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "writebehind-flush");
            t.setDaemon(true);
            return t;
        }).scheduleAtFixedRate(this::flush, flushMs, flushMs, TimeUnit.MILLISECONDS);
    }

    public void put(K k, V v) {
        store.put(k, v);
        dirty.put(k, v);
    }

    public V get(K k) { return store.get(k); }

    private void flush() {
        if (dirty.isEmpty()) return;
        List<Map.Entry<K, V>> items = new ArrayList<>();
        Iterator<Map.Entry<K, V>> it = dirty.entrySet().iterator();
        while (it.hasNext() && items.size() < batch) {
            items.add(it.next());
            it.remove();
        }
        try {
            db.bulkUpsert(items);
        } catch (Exception e) {
            for (Map.Entry<K, V> e2 : items) dirty.putIfAbsent(e2.getKey(), e2.getValue());
        }
    }

    public interface Database<K, V> { void bulkUpsert(List<Map.Entry<K, V>> items); }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <mutex>
#include <thread>
#include <chrono>
#include <vector>
#include <functional>

template <typename K, typename V>
class WriteBehindCache {
public:
    using Flusher = std::function<void(const std::vector<std::pair<K, V>>&)>;

    WriteBehindCache(Flusher f, int flush_ms = 100, int batch = 500)
        : flush_(f), flush_ms_(flush_ms), batch_(batch), running_(true) {
        worker_ = std::thread([this] { loop(); });
    }

    ~WriteBehindCache() {
        running_ = false;
        if (worker_.joinable()) worker_.join();
    }

    void put(const K& k, const V& v) {
        std::lock_guard<std::mutex> lk(m_);
        store_[k] = v;
        dirty_[k] = v;
    }

    bool get(const K& k, V& out) {
        std::lock_guard<std::mutex> lk(m_);
        auto it = store_.find(k);
        if (it == store_.end()) return false;
        out = it->second;
        return true;
    }

private:
    void loop() {
        while (running_) {
            std::this_thread::sleep_for(std::chrono::milliseconds(flush_ms_));
            std::vector<std::pair<K, V>> items;
            {
                std::lock_guard<std::mutex> lk(m_);
                for (auto it = dirty_.begin(); it != dirty_.end() && (int)items.size() < batch_; ) {
                    items.emplace_back(it->first, it->second);
                    it = dirty_.erase(it);
                }
            }
            if (!items.empty()) {
                try { flush_(items); }
                catch (...) {
                    std::lock_guard<std::mutex> lk(m_);
                    for (auto& p : items) dirty_.emplace(p.first, p.second);
                }
            }
        }
    }

    std::unordered_map<K, V> store_, dirty_;
    std::mutex m_;
    Flusher flush_;
    int flush_ms_, batch_;
    std::thread worker_;
    bool running_;
};
```
