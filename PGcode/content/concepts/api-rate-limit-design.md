---
slug: api-rate-limit-design
module: sd-api
title: API Rate Limit Design
subtitle: Per-key / per-IP / per-endpoint quotas — fixed-window / sliding / token-bucket / leaky-bucket; distributed via Redis.
difficulty: Intermediate
position: 49
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Stripe — Scaling your API with rate limiters"
    url: "https://stripe.com/blog/rate-limiters"
    type: book
  - title: "Cloudflare — Architecture for rate limiting"
    url: "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/"
    type: blog
  - title: "envoyproxy/ratelimit — open-source distributed rate limiter"
    url: "https://github.com/envoyproxy/ratelimit"
    type: repo
status: published
---

## intro
Every public API needs rate limiting: prevents abuse, protects downstream services, enforces fair-use across tenants. Four families of algorithms — **fixed window**, **sliding window log**, **sliding window counter**, **token bucket** (and its variant **leaky bucket**). Distributed deployments use **Redis** with atomic Lua scripts. Granularity layers: **per-IP** (abuse) + **per-API-key** (business plan tier) + **per-endpoint** (expensive operations).

## whyItMatters
Production rate limits prevent:
- **Resource exhaustion**: one runaway client kills the service for everyone.
- **Cost overruns**: expensive AI / DB calls capped per tier.
- **Multi-tenant fairness**: noisy neighbor isolated.
- **DDoS mitigation**: complements WAF / CDN.

Stripe / Twilio / GitHub / OpenAI all expose explicit limits with `X-RateLimit-*` headers. Wrong design → false positives (legit users blocked) or false negatives (abuse not caught).

## intuition
**Fixed window** (60 req/min, reset on minute boundary):
- Simplest. Counter per key+minute.
- Boundary bug: client makes 60 at 0:59 + 60 at 1:00 = 120 in 1 sec. Twice the limit.

**Sliding window log**:
- Store every request timestamp in a sorted set; count entries in the last 60s.
- Accurate; O(N) memory per key.

**Sliding window counter** (Cloudflare's approach):
- Track current minute + previous minute counts. Estimate sliding rate via interpolation:
  `estimated = current_window * elapsed_ratio + previous_window * (1 − elapsed_ratio)`.
- Memory: 2 counters per key. Smooth + cheap.

**Token bucket** (most common in production):
- Bucket holds N tokens; refills at R tokens/sec; each request consumes 1 token.
- Allows bursting up to N tokens.
- See standalone "Token Bucket" concept.

**Leaky bucket**:
- Bucket with hole. Requests pour in; processed out at constant rate. Smooths output to constant rate (no bursts).

## visualization
```
Per-tier API rate limits:
  Free tier:   100 req/day  +  10 req/hour  +  1 req/sec
  Paid tier:   100,000 req/day + 10,000/hr + 100/sec
  Enterprise:  unlimited (with abuse circuit breaker)

Each tier = independent token bucket; ALL must allow the request.

Response headers (RateLimit RFC):
  X-RateLimit-Limit:      100
  X-RateLimit-Remaining:  47
  X-RateLimit-Reset:      1729000000
  Retry-After:            42

On exceed → 429 Too Many Requests + Retry-After header + clear error body.

Distributed via Redis:
  Each app instance → Redis INCR + EXPIRE on key like "rl:user_42:minute"
  Atomic via Lua script for compound conditions.
```

## bruteForce
**In-memory map per instance**: only enforces per-instance. Across 10 instances, client can do 10× the limit.

**Database row per request**: O(reads + writes) too slow for millions of req/sec.

**Centralized via Redis** is the standard.

## optimal
**Tier setup** (Stripe / OpenAI pattern):
- Account → plan → rate limit config.
- Plan: `{ requests_per_second: 10, requests_per_day: 10000, burst: 100 }`.
- Three-tier check: per-second + per-day + per-endpoint.

**Redis token bucket** (Lua script for atomicity):
```lua
-- KEYS[1] = bucket key
-- ARGV[1] = capacity, ARGV[2] = rate, ARGV[3] = now, ARGV[4] = cost
local capacity = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local cost     = tonumber(ARGV[4])

local data = redis.call('HMGET', KEYS[1], 'tokens', 'last')
local tokens = tonumber(data[1]) or capacity
local last   = tonumber(data[2]) or now

tokens = math.min(capacity, tokens + (now - last) * rate)
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last', now)
redis.call('EXPIRE', KEYS[1], 3600)
return { allowed, tokens }
```

App side:
```python
result = redis.eval(LUA_SCRIPT, 1, f'rl:user:{user_id}', capacity, rate, now_seconds, 1)
if result[0] == 0:
    raise RateLimitExceeded(retry_after=int((cost - result[1]) / rate))
```

**Headers** (RFC 6585 + RateLimit draft):
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` — per-window.
- `Retry-After` on 429: seconds to wait OR HTTP date.

**Hierarchical limits**: per-endpoint (e.g., expensive `/inference` capped tighter) + per-customer (plan tier).

## complexity
- **Per request**: 1 Redis Lua eval (~0.5ms p50, ~3ms p99 cross-AZ).
- **Memory**: O(active_keys) in Redis.
- **Cost per request**: $0.0000001 of Redis ops. Cheap.

## pitfalls
- **Fixed window 2× burst**: clients learn to game window boundaries. Use sliding window or token bucket.
- **Centralized Redis = SPOF**: if Redis is down, all rate-limited endpoints fail. Use fail-open (allow on Redis miss) + alert.
- **Per-IP behind NAT/proxy**: many users share IPs. Use API key as primary granularity; IP only for unauthenticated.
- **Returning 429 without `Retry-After`**: clients hammer in a tight retry loop. Always include hint.
- **No documented limits**: clients hit limits unexpectedly. Publish per-endpoint rates.
- **Rate limit applied AFTER expensive work**: useless. Check the limit first.

## interviewTips
- For "design rate limit for X" — list 4 algorithms + distributed Redis Lua + per-tier hierarchy.
- Mention **fail-open vs fail-closed** (default fail-open with circuit breaker).
- For senior interviews, discuss **multi-region rate limit consistency** (eventual) + **sliding-window-counter** (Cloudflare's clever interpolation).

## code.python
```python
# Redis token bucket helper
import time, redis
r = redis.Redis()
SCRIPT = """ ... (Lua script from above) ... """
script = r.register_script(SCRIPT)

def allow(user_id, capacity=10, rate=1):
    result = script(keys=[f'rl:{user_id}'], args=[capacity, rate, time.time(), 1])
    return result[0] == 1, result[1]

ok, remaining = allow('user_42', capacity=100, rate=10)
if not ok:
    raise RateLimitExceeded(retry_after=10)
```

## code.javascript
```javascript
// Express middleware with ioredis
const Redis = require('ioredis');
const redis = new Redis();
async function rateLimit(req, res, next) {
  const key = `rl:${req.user.id}`;
  const result = await redis.eval(LUA_SCRIPT, 1, key, 100, 10, Date.now() / 1000, 1);
  if (result[0] === 0) {
    res.setHeader('Retry-After', 10);
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  res.setHeader('X-RateLimit-Remaining', result[1]);
  next();
}
```

## code.java
```java
// Bucket4j + Redis distributed
import io.github.bucket4j.Bucket;
import io.github.bucket4j.distributed.proxy.ProxyManager;
ProxyManager<String> proxyManager = LettuceBasedProxyManager.builderFor(redisClient).build();
Bucket bucket = proxyManager.builder().build("user_42",
    () -> BucketConfiguration.builder().addLimit(
        Bandwidth.classic(100, Refill.greedy(10, Duration.ofSeconds(1)))).build());
if (!bucket.tryConsume(1)) throw new RateLimitException();
```

## code.cpp
```cpp
// hiredis with Lua eval — same protocol shape as other languages
// redisCommand(ctx, "EVAL %s 1 %s %d %d %d %d", LUA_SCRIPT, key, cap, rate, now, cost);
```
