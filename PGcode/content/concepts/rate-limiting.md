---
slug: rate-limiting
module: system-design
title: Rate Limiting
subtitle: Cap how many requests a client can make per window so one caller can't starve the rest.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — Architecture & enterprise patterns"
    url: "https://martinfowler.com/tags/application%20architecture.html"
    type: book
  - title: "High Scalability — All-time greatest hits"
    url: "http://highscalability.com/all-time-favorites/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A rate limiter rejects or delays requests that exceed a per-caller threshold (e.g., 100 req/min per API key). It protects downstream systems from being crushed by one noisy client, gives you a price-discrimination knob between tiers, and is the first line of defense against credential-stuffing and scraping.

## whyItMatters
Without a limiter, a single misbehaving client (or attacker) can saturate your DB connection pool, exhaust thread workers, or drive the bill on a downstream metered API. With one, you fail fast at the edge — return 429 — and the rest of your traffic continues serving. It also gives product teams a clean way to say "the free tier gets 100 req/day" without rewriting handlers.

## intuition
Imagine a bouncer at a club door with a clicker. Each visitor (per IP / API key / user-id) is counted. Once the club hits its hourly cap for that visitor, the bouncer turns them away with a "try again in N minutes" sign. The cap, the window, and how forgiving the bouncer is on bursts (a "let two in at once if they've been polite all night" rule) are the design knobs.

## visualization
```
Client A ─► [Limiter: 100/min] ─► allow 100 ─► backend
Client A ─► [Limiter]            ─► 429 Too Many Requests for the next requests this minute
Client B ─► [Limiter]            ─► independent quota, still serving
```

## bruteForce
No limiter — let everything through. Works at toy scale; fails as soon as one client misbehaves or you publish to a wider audience.

## optimal
Pick an algorithm by the burst behavior you want:

- **Fixed window**: count requests in `floor(now / windowSize)`. Simple, but bursts at window edges (twice the limit in 2 seconds at the boundary).
- **Sliding window log**: keep timestamps of recent requests; count how many in the last `windowSize`. Smoothest but most memory.
- **Sliding window counter**: combine current + previous window counts weighted by overlap. Good approximation, cheap.
- **Token bucket**: a bucket holds up to N tokens, refilled at R per second. Each request consumes one. Allows bursts up to N, sustained rate R. Most popular for APIs.
- **Leaky bucket**: requests join a fixed-rate queue; overflow is dropped. Smooths bursts into a steady output.

Pick a **scope**: per-IP (cheap, easy), per-user/API-key (correct for authenticated APIs), per-endpoint (different limits per route), tiered (free=100/min, pro=1000/min).

Run the counter in a **shared store** (Redis is canonical) so all your API nodes see the same count. Use atomic ops (`INCR` + `EXPIRE`, or Lua scripts for token bucket) to avoid races.

Return **structured rejection**: HTTP 429, `Retry-After` header, `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` headers so clients can back off intelligently.

## complexity
- **Per-request cost**: 1 Redis round-trip (~1ms in same DC).
- **Memory**: O(active clients) — keys auto-expire after the window.
- **Failure mode**: if Redis is down, fail open (allow) or fail closed (reject) — choose per your risk profile and document loudly.

## pitfalls
- **In-process counters with many nodes**: each node has its own count, so a 100/min limit becomes 100×N/min. Always use a shared store for multi-instance services.
- **IP-only limits behind a CDN**: you'll see the CDN's IP, not the real client. Use `X-Forwarded-For` carefully.
- **No per-user fallback**: an attacker who can churn IPs (residential proxies) bypasses pure IP limits.
- **Counting failed requests against the limit**: legitimate retries on a server error get punished. Either don't count 5xx or have a separate budget.
- **Hardcoded limits in code**: makes it impossible to dial up/down without a deploy. Make limits config-driven.
- **Forgetting to test the limiter itself** — easy to ship a "limiter" that quietly allows everything.

## interviewTips
- Always specify scope ("per API key, per minute") and algorithm ("token bucket") up front.
- Mention the **distributed counter problem** and Redis as the standard solution.
- Bring up the **429 + Retry-After + X-RateLimit-* headers** without prompting — it's the modern API contract.
- For senior-level questions, discuss **fail-open vs fail-closed** during Redis outage and **leaky vs token bucket** for shaping bursty workloads.

## code.python
```python
# Token bucket using Redis with a Lua script for atomicity.
import time, redis
r = redis.Redis()

LUA = """
local now = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local cap = tonumber(ARGV[3])
local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'updated')
local tokens = tonumber(bucket[1]) or cap
local updated = tonumber(bucket[2]) or now
tokens = math.min(cap, tokens + (now - updated) * rate)
if tokens < 1 then
  redis.call('HMSET', KEYS[1], 'tokens', tokens, 'updated', now)
  return 0
end
redis.call('HMSET', KEYS[1], 'tokens', tokens - 1, 'updated', now)
redis.call('EXPIRE', KEYS[1], 3600)
return 1
"""

def allow(api_key, rate=100/60, cap=100):
    return r.eval(LUA, 1, f"rl:{api_key}", time.time(), rate, cap) == 1
```

## code.javascript
```javascript
// Simple in-memory token bucket per key (single-process only).
class TokenBucket {
  constructor(rate, capacity) { this.rate = rate; this.cap = capacity; this.buckets = new Map(); }
  allow(key) {
    const now = Date.now() / 1000;
    const b = this.buckets.get(key) || { tokens: this.cap, updated: now };
    b.tokens = Math.min(this.cap, b.tokens + (now - b.updated) * this.rate);
    b.updated = now;
    if (b.tokens < 1) { this.buckets.set(key, b); return false; }
    b.tokens -= 1; this.buckets.set(key, b); return true;
  }
}
```

## code.java
```java
import java.util.concurrent.ConcurrentHashMap;
class TokenBucket {
    static class Bucket { double tokens; double updated; }
    private final double rate, capacity;
    private final ConcurrentHashMap<String, Bucket> map = new ConcurrentHashMap<>();
    TokenBucket(double rate, double cap) { this.rate = rate; this.capacity = cap; }
    public synchronized boolean allow(String key) {
        double now = System.currentTimeMillis() / 1000.0;
        Bucket b = map.computeIfAbsent(key, k -> { Bucket x = new Bucket(); x.tokens = capacity; x.updated = now; return x; });
        b.tokens = Math.min(capacity, b.tokens + (now - b.updated) * rate);
        b.updated = now;
        if (b.tokens < 1) return false;
        b.tokens -= 1; return true;
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <chrono>
#include <string>
struct TokenBucket {
    double rate, cap;
    struct B { double tokens; double updated; };
    std::unordered_map<std::string, B> map;
    TokenBucket(double r, double c) : rate(r), cap(c) {}
    bool allow(const std::string& key) {
        using namespace std::chrono;
        double now = duration<double>(steady_clock::now().time_since_epoch()).count();
        auto& b = map[key];
        if (b.updated == 0) { b.tokens = cap; b.updated = now; }
        b.tokens = std::min(cap, b.tokens + (now - b.updated) * rate);
        b.updated = now;
        if (b.tokens < 1) return false;
        b.tokens -= 1; return true;
    }
};
```
