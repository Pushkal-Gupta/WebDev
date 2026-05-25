---
slug: rate-limiter-token-bucket
module: sd-api
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
- **Stripe's API rate limiter** (their famous 2017 engineering blog post "Scaling your API with rate limiters" is the canonical production reference), **AWS API Gateway, GitHub API, Twitter API, Cloudflare** all use token bucket variants.
- **Linux `tc` (traffic control)** uses token bucket for **HTB (Hierarchical Token Bucket)** and **TBF (Token Bucket Filter)** queueing disciplines; **cgroups `cpu.cfs_quota_us`** uses the same algorithm for per-process CPU shaping.
- **Envoy's local rate limit filter, Istio rate limiting, NGINX `limit_req`** all implement token bucket; **Guava's `RateLimiter`** is the JVM reference implementation.
- **Compared to fixed-window counter** (allows 2x burst at boundary — 60 reqs at 0:59 + 60 at 1:00 = 120 in 1 second) and **leaky bucket** (smooths to constant rate, no burst tolerance), token bucket gives the best of "predictable long-term average + tolerates short bursts" — the sweet spot for most API workloads.

## intuition
Rate-limiting solves a fundamental problem: how do you protect a service from being overloaded by a single client (or class of clients) sending too many requests? The answer that emerged in the 1980s for network traffic shaping, and now governs every public API, is the **token bucket** algorithm — a beautifully simple mechanism that allows controlled bursting on top of a strict long-term rate.

The bucket has three fields: `tokens` (current count, fractional ok), `capacity` (max tokens it can hold), and `rate` (refill in tokens per second). On each request:
1. **Refill lazily** — compute `elapsed = now - last_refill`, add `elapsed * rate` tokens, cap at `capacity`, update `last_refill = now`.
2. **Consume** — if `tokens >= cost`, decrement `tokens` by `cost` and allow the request; otherwise reject (or queue).

Two design choices fall out. The **capacity sets the burst size** — a bucket of capacity 100 with rate 10/sec allows the client to send 100 requests instantly when full, then sustain only 10/sec thereafter. The **rate sets the long-term average** — over any sufficiently long window, throughput cannot exceed `rate`. This combination is exactly what production APIs want: friendly to occasional bursts (page load with 50 parallel image requests), strict against sustained abuse (a scraper trying to download a million records per minute).

Two operational variants matter. **Hard reject** when empty (return HTTP 429 with `Retry-After: <seconds>` header) — the API-gateway default; easy for clients to reason about. **Queue + wait** (block until tokens are available) — used in network traffic shapers (Linux tc, AQM) where smoothing out bursts is more important than rejecting them.

The mental model versus alternatives: **Leaky bucket** outputs at a constant rate regardless of input — perfect for traffic shaping but unfriendly to legitimate bursts. **Fixed-window counter** (count requests per minute, reset on boundary) is trivial but has the **boundary-burst exploit**: 60 requests at 0:59 plus 60 at 1:00 means 120 requests in one second. **Sliding-window log** (store every timestamp, count recent ones) is accurate but O(n) memory per user. **Token bucket** wins on operational simplicity (O(1) state per user, O(1) per request), burst friendliness, and predictability — Stripe's, AWS's, and Cloudflare's choice.

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
The right architecture is **lazy in-memory token bucket for single-instance, Redis-backed Lua-atomic bucket for distributed, and multi-tier layering (per-user + per-IP + per-endpoint) for production API gateways**. The Stripe engineering blog post "Scaling your API with rate limiters" (2017) codifies this pattern.

```python
import time
import redis

# Single-instance: O(1) per request, in-memory.
class TokenBucket:
    def __init__(self, capacity: int, rate: float):
        self.capacity = capacity                  # max tokens (burst size)
        self.rate = rate                          # refill per second
        self.tokens = capacity                    # start full (or 0 for stricter shaping)
        self.last = time.time()

    def allow(self, cost: int = 1) -> bool:
        now = time.time()
        # Lazy refill: only update when checked, no background timer needed.
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False

# Distributed: Lua script for atomic refill + consume in Redis.
# Critical: refill and consume must be one atomic operation across replicas.
DISTRIBUTED_BUCKET_LUA = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'last')
local tokens = tonumber(bucket[1]) or capacity
local last = tonumber(bucket[2]) or now

-- Lazy refill, capped at capacity.
local elapsed = math.max(0, now - last)
tokens = math.min(capacity, tokens + elapsed * rate)

if tokens >= cost then
    tokens = tokens - cost
    redis.call('HMSET', key, 'tokens', tokens, 'last', now)
    redis.call('EXPIRE', key, 3600)             -- evict idle buckets after 1h
    return 1                                     -- allowed
else
    redis.call('HMSET', key, 'tokens', tokens, 'last', now)
    return 0                                     -- rejected
end
"""

class DistributedTokenBucket:
    def __init__(self, redis_client, capacity: int, rate: float):
        self.r = redis_client
        self.capacity = capacity
        self.rate = rate
        self.script = self.r.register_script(DISTRIBUTED_BUCKET_LUA)

    def allow(self, key: str, cost: int = 1) -> bool:
        return bool(self.script(keys=[f"bucket:{key}"],
                                args=[self.capacity, self.rate, cost, time.time()]))

# Multi-tier rate limiter — first rejecter wins. Each tier protects a different layer.
class MultiTierLimiter:
    def __init__(self, redis_client):
        self.per_user_bucket = DistributedTokenBucket(redis_client, capacity=100, rate=10)
        self.per_ip_bucket = DistributedTokenBucket(redis_client, capacity=1000, rate=100)
        self.per_endpoint_bucket = DistributedTokenBucket(redis_client, capacity=50000, rate=5000)

    def allow(self, user_id: str, ip: str, endpoint: str, cost: int = 1) -> bool:
        # Check most-specific tier first; reject early to save Redis round-trips.
        if not self.per_user_bucket.allow(user_id, cost): return False
        if not self.per_ip_bucket.allow(ip, cost): return False
        if not self.per_endpoint_bucket.allow(endpoint, cost): return False
        return True
```

Why this is right: the **single-instance bucket is O(1) per request** with zero background work (lazy refill on access, not on a timer). The **distributed bucket uses a Lua script** because Redis evaluates Lua atomically — without it, the get-modify-set race between replicas would silently allow over-the-limit traffic. The **multi-tier layering** protects different abuse vectors independently: per-user catches account abuse, per-IP catches scraper farms, per-endpoint catches stampedes on a hot resource.

**Production disciplines that matter**:
- **Return 429 with `Retry-After: <seconds>` header** — clients use this to back off; without it, they hammer immediately and burn through your rejection budget too.
- **Per-route cost (cost=1 vs cost=N)**: expose weighted costs so an expensive `/search` endpoint consumes 10 tokens while `/health` consumes 1.
- **Cold-start burst risk**: starting `tokens = capacity` allows immediate full burst at process restart. For stricter shaping (no warm-up bursts), start at 0 and let it refill.
- **Storage choice**: in-memory map only works for single-instance services. For multi-instance, **Redis with Lua scripts** (default) or **DynamoDB with conditional writes** (for AWS-native stacks). Memcached lacks atomic compound ops; do not use.
- **Clock skew across replicas**: small drift is fine (sub-second); large drift means clients hit different buckets with different refill amounts. Use Redis's `TIME` command for the canonical clock if strict.
- **Cap at capacity explicitly** — without `min(capacity, tokens + refill)` the tokens grow unbounded and become an "infinite burst" exploit at the next request.
- **Sliding-window-counter alternative** (Cloudflare's chosen algorithm): O(1) state per user, more accurate than fixed-window, slightly less burst-friendly than token bucket. Pick based on whether you need burst tolerance.

**Adjacent and complementary patterns**:
- **Leaky bucket** (Linux tc, ATM networks): smooths output to constant rate; no burst tolerance — use for traffic shaping where smoothness matters more than burst.
- **Adaptive concurrency limit** (Netflix's `concurrency-limits` library, derived from TCP Vegas): limits concurrent in-flight requests instead of rate; reacts to upstream latency.
- **Circuit breaker**: trips when downstream is failing; complementary to rate limiting (rate limiting protects you from clients; circuit breakers protect you from downstreams).
- **Distributed-rate-limit services**: AWS API Gateway throttling, Envoy's global rate-limit service (gRPC-based), Cloudflare's Workers + Durable Objects.

**At scale**: Cloudflare reports billions of rate-limit decisions per day via their Workers; Stripe's published architecture has multi-tier buckets in Redis Cluster with sub-millisecond p99. The key operational metric is **rejection rate** — track it per tier and alert when it spikes (could be abuse, could be a misconfigured client).

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
