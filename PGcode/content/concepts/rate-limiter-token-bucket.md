---
slug: rate-limiter-token-bucket
module: system-design
title: Token Bucket Rate Limiter
subtitle: Allow N requests per interval with bursting — tokens refill at a steady rate, each request consumes one.
difficulty: Intermediate
position: 22
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Rate limiting patterns"
    url: "https://martinfowler.com/tags/application%20architecture.html"
    type: book
  - title: "Stripe Engineering — Scaling your API with rate limiters"
    url: "https://stripe.com/blog/rate-limiters"
    type: blog
  - title: "envoyproxy/envoy — local rate limiter filter"
    url: "https://github.com/envoyproxy/envoy"
    type: repo
status: published
---

## intro
A **token bucket** is the most common rate-limiting algorithm. A bucket holds up to `capacity` tokens; tokens refill at `rate` per second; each request consumes one token. If the bucket is empty, the request is rejected (or queued). Allows controlled **bursting** up to `capacity` while enforcing a long-term average of `rate` requests/sec.

## whyItMatters
Used everywhere:
- **API gateways** (Stripe, AWS, GitHub) — per-user / per-key rate limits.
- **CDN edge** — block abusive crawlers.
- **Service mesh** (Envoy, Istio) — local + global rate limiting.
- **CPU schedulers** (cgroups), **network shaping** (Linux tc).

Compared to a leaky bucket (smooths to constant output) or fixed-window counter (boundary bursts), token bucket gives the best of "predictable average + tolerates short bursts."

## intuition
Bucket has 3 fields: `tokens` (current count), `capacity` (max), `rate` (refill per second). On each request:
1. **Refill**: based on time elapsed since last update, add `elapsed * rate` tokens, capped at `capacity`.
2. **Consume**: if `tokens >= 1`, decrement and allow. Else reject.

Cheap O(1) per request. Two clean variants:
- **Hard reject** when empty: API gateway typical.
- **Queue + wait**: smooth out bursts. Used in network shapers.

## visualization
```
capacity = 5, rate = 1 token/sec

t=0   tokens=5    [TTTTT]   request → allow → tokens=4
t=0.5 tokens=4    [TTTT.]   request → allow → tokens=3
t=1   tokens=4    [TTTT.]   refill: 0.5s passed, +0.5 → still 4 (capped reasoning)
                              actually: 3 + (1.0 elapsed * 1/sec) = 4
                              request → allow → tokens=3
t=2   tokens=4    refill: 2 elapsed * 1/sec → cap at 5 → tokens=5
... 5 rapid requests → tokens=0, all 5 allowed (burst)
t=3   tokens=0    request → REJECT (no tokens)
t=4   tokens=1    refill → request → allow
```

## bruteForce
**Fixed-window counter** (e.g., 60 requests per minute, reset on minute boundary): trivial but allows 2× burst at the boundary (60 at 0:59 + 60 at 1:00 = 120 in 1 second).

**Sliding-window log**: store every request timestamp; count recent ones. Accurate but O(n) memory per user.

Token bucket: O(1) per user, smooth + burst-tolerant.

## optimal
```
class TokenBucket:
    def __init__(self, capacity, rate):
        self.capacity = capacity
        self.rate = rate            # tokens per second
        self.tokens = capacity      # start full
        self.last = time.time()

    def allow(self, cost=1):
        now = time.time()
        elapsed = now - self.last
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.last = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False
```

**Distributed token bucket** (across replicas): store `(tokens, last_refill)` in Redis with Lua script for atomic refill+consume. Pattern: `eval` script that does both in one round-trip.

**Multi-tier**: per-user + per-IP + per-endpoint buckets layered. First rejecter wins.

## complexity
- **Per request**: O(1).
- **Memory**: O(1) per bucket (tokens + last_refill).
- **Distributed overhead**: 1 Redis round-trip per request (~1ms p50, ~5ms p99).

## pitfalls
- **Clock skew across replicas**: if two replicas have different `now`, refill amounts diverge. Use a central clock (Redis TIME command) or accept tiny drift.
- **Cold-start burst**: initializing `tokens = capacity` allows immediate full burst. For stricter shaping, start at 0 and let it refill.
- **Storage choice**: in-memory map only works for single-instance services. For multi-instance, use Redis or DynamoDB with conditional writes.
- **Cost = 1** vs **cost = N** (weighted requests): expose a per-route cost so expensive endpoints consume more tokens.
- **Forgetting to cap at capacity**: tokens can grow unbounded if you skip the `min(capacity, ...)`. Bug becomes a "infinite burst" exploit.

## interviewTips
- For "design rate limiter" → token bucket is the canonical answer.
- Compare with **leaky bucket** (smooths to constant rate, no burst) and **fixed-window** (boundary burst exploit).
- For senior interviews: mention **Redis Lua script** for atomic distributed refill+consume, and how Stripe/Cloudflare implement multi-tier limits.
- Mention **graceful degradation**: return `429 Too Many Requests` with `Retry-After: <seconds>` header, not 500.

## code.python
```python
import time
class TokenBucket:
    def __init__(self, capacity, rate):
        self.capacity, self.rate = capacity, rate
        self.tokens = capacity
        self.last = time.time()
    def allow(self, cost=1):
        now = time.time()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False

bucket = TokenBucket(capacity=5, rate=1)   # 5 max, 1/sec refill
for i in range(10):
    print(i, bucket.allow())   # first 5 True, rest False until refill
```

## code.javascript
```javascript
class TokenBucket {
  constructor(capacity, rate) {
    this.capacity = capacity; this.rate = rate;
    this.tokens = capacity; this.last = Date.now() / 1000;
  }
  allow(cost = 1) {
    const now = Date.now() / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) * this.rate);
    this.last = now;
    if (this.tokens >= cost) { this.tokens -= cost; return true; }
    return false;
  }
}
```

## code.java
```java
class TokenBucket {
    private final int capacity;
    private final double rate;
    private double tokens;
    private long lastNanos;
    public TokenBucket(int capacity, double rate) {
        this.capacity = capacity; this.rate = rate;
        this.tokens = capacity; this.lastNanos = System.nanoTime();
    }
    public synchronized boolean allow(int cost) {
        long now = System.nanoTime();
        double elapsed = (now - lastNanos) / 1e9;
        tokens = Math.min(capacity, tokens + elapsed * rate);
        lastNanos = now;
        if (tokens >= cost) { tokens -= cost; return true; }
        return false;
    }
}
```

## code.cpp
```cpp
#include <chrono>
class TokenBucket {
    int capacity;
    double rate;
    double tokens;
    std::chrono::steady_clock::time_point last;
public:
    TokenBucket(int c, double r) : capacity(c), rate(r), tokens(c), last(std::chrono::steady_clock::now()) {}
    bool allow(int cost = 1) {
        auto now = std::chrono::steady_clock::now();
        double elapsed = std::chrono::duration<double>(now - last).count();
        tokens = std::min((double)capacity, tokens + elapsed * rate);
        last = now;
        if (tokens >= cost) { tokens -= cost; return true; }
        return false;
    }
};
```
