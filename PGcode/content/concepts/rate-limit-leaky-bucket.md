---
slug: rate-limit-leaky-bucket
module: sd-api
title: Rate Limiting — Leaky Bucket
subtitle: Smoothing bursts into a steady outflow — leaky bucket vs token bucket, when each one wins.
difficulty: Advanced
position: 42
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "High Scalability — Distributed Rate Limiting Patterns"
    url: "http://highscalability.com/blog/category/rate-limiting"
    type: blog
  - title: "Martin Fowler — Patterns of Resilience"
    url: "https://martinfowler.com/articles/patterns-of-distributed-systems/"
    type: blog
  - title: "donnemartin/system-design-primer — Rate Limiting"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A rate limiter caps how often a client can hit your service. The two canonical algorithms are leaky bucket — which forces a smooth, constant outflow regardless of how bursty the input is — and token bucket — which allows bursts up to the bucket's capacity. Both are O(1) per request and use a few bytes of state per client; the choice between them is a UX decision, not a performance one.

## whyItMatters
Without a limiter, a single misbehaving client can saturate your downstream. Without the right limiter, you reject legitimate burst traffic that your system is actually capable of handling. Leaky bucket protects downstream systems that genuinely cannot tolerate bursts (legacy databases, third-party APIs with per-second caps, payment processors). Token bucket protects systems that can absorb bursts and prefer to let users experience occasional high throughput.

## intuition
Leaky bucket: imagine a bucket with a small hole in the bottom. Requests drip in from the top at any rate; they leak out the bottom at a fixed rate `r`. If the bucket overflows, you drop the request. Output is perfectly smooth no matter how chaotic the input.

Token bucket: a bucket holds up to `B` tokens, refilled at rate `r`. Each request consumes one token. If the bucket is empty, the request is rejected (or queued). When idle, the bucket fills up — so the next burst can spend its way through `B` requests instantly, then is throttled to the steady rate `r`.

## visualization
Set `r = 1 req/sec`, `B = 5`. A client idle for 5 seconds then sends 8 requests at t=10: token bucket admits the first 5 instantly (the saved-up tokens) then 1 per second; the 6th-8th requests are admitted at t=11, t=12, t=13. Leaky bucket admits 1 immediately and drops the next 7 (bucket overflows) — or, if the bucket is a queue of size 5, it admits 1 and queues 5, dropping 2; the queue drains at one per second.

## bruteForce
Track a hash map of `{client_id: count}` and reset it every second. Works for low scale but has two flaws: (1) the "window edge" exploit — a client can fire `2 × limit` requests across the boundary of two windows, and (2) you reset the map atomically across all clients, causing a thundering herd. Fixed-window counters are the rate-limiting equivalent of bubble sort: easy to write, never used in production.

## optimal
Leaky bucket as a queue: store `(last_check_time, water_level)` per client. On request: compute leaked amount = `(now - last_check) * leak_rate`, subtract from water level (floor at 0), then if `water + 1 ≤ capacity`, add 1 and accept; else reject. O(1) time, O(1) state. Token bucket is the mirror: store `(last_refill_time, tokens)`, refill = `(now - last_refill) * refill_rate`, cap at `B`, deduct one or reject.

Distribute across a cluster by keeping the state in Redis with atomic Lua scripts — the read-modify-write must be single-threaded against the same key.

## complexity
time: O(1) per request — two arithmetic ops, one compare, one write.
space: O(1) per client — a 64-bit timestamp and a small float, ~16 bytes.
notes: Distributed deployments pay the cost of a Redis round-trip (~1ms intra-AZ). Local-shard limiters are faster but allow each shard's quota to be spent independently — a `n × limit` blowup if you don't pre-divide.

## pitfalls
- Storing `count` instead of `(timestamp, count)` — you lose the ability to compute leakage and get fixed-window behavior.
- Forgetting that clock skew between rate-limiter shards causes leak-rate drift. Use a monotonic clock and synchronize via NTP.
- Setting bucket size = 1 and calling it a leaky bucket — that's just a fixed-interval limiter and reject-most-requests user experience.
- Letting the rate limiter become a single point of failure. Fail-open (allow the request if Redis is down) for non-critical limits; fail-closed (reject) for billing/abuse paths.
- Per-IP limits on services behind a CDN — you'll limit the CDN itself. Use `X-Forwarded-For` parsed safely, or limit per API key.

## interviewTips
- Lead with the two-algorithm trade-off: leaky bucket = smooth output, token bucket = bursty tolerance. Pick by the downstream's tolerance.
- Be ready to draw the state machine: timestamp + counter, update formula on each request.
- Mention distributed scaling: Redis + Lua for atomicity, or per-shard local limiters with a quota divided by shard count.
- Volunteer the failure modes: clock skew, fail-open vs fail-closed, CDN/IP confusion.
- Bonus: sliding-window counters are a hybrid that smooths out fixed-window edges by storing two adjacent buckets and weighting them.

## code.python
```python
import time

class LeakyBucket:
    def __init__(self, capacity, leak_per_sec):
        self.cap = capacity
        self.rate = leak_per_sec
        self.water = 0.0
        self.last = time.monotonic()

    def allow(self):
        now = time.monotonic()
        leaked = (now - self.last) * self.rate
        self.water = max(0.0, self.water - leaked)
        self.last = now
        if self.water + 1 <= self.cap:
            self.water += 1
            return True
        return False
```

## code.javascript
```javascript
class LeakyBucket {
  constructor(capacity, leakPerSec) {
    this.cap = capacity;
    this.rate = leakPerSec;
    this.water = 0;
    this.last = performance.now() / 1000;
  }
  allow() {
    const now = performance.now() / 1000;
    const leaked = (now - this.last) * this.rate;
    this.water = Math.max(0, this.water - leaked);
    this.last = now;
    if (this.water + 1 <= this.cap) { this.water += 1; return true; }
    return false;
  }
}
```

## code.java
```java
public final class LeakyBucket {
    private final double cap, rate;
    private double water = 0;
    private long lastNanos = System.nanoTime();

    public LeakyBucket(double capacity, double leakPerSec) {
        this.cap = capacity; this.rate = leakPerSec;
    }
    public synchronized boolean allow() {
        long now = System.nanoTime();
        double leaked = (now - lastNanos) / 1e9 * rate;
        water = Math.max(0, water - leaked);
        lastNanos = now;
        if (water + 1 <= cap) { water += 1; return true; }
        return false;
    }
}
```

## code.cpp
```cpp
#include <chrono>
#include <mutex>

class LeakyBucket {
    double cap, rate, water = 0;
    std::chrono::steady_clock::time_point last;
    std::mutex m;
public:
    LeakyBucket(double c, double r) : cap(c), rate(r), last(std::chrono::steady_clock::now()) {}
    bool allow() {
        std::lock_guard<std::mutex> g(m);
        auto now = std::chrono::steady_clock::now();
        double dt = std::chrono::duration<double>(now - last).count();
        water = std::max(0.0, water - dt * rate);
        last = now;
        if (water + 1 <= cap) { water += 1; return true; }
        return false;
    }
};
```
