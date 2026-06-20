---
slug: leaky-bucket
module: sd-reliability
title: Leaky Bucket
subtitle: A rate limiter that paces requests at a fixed outflow — bursts queue, the downstream sees a steady stream.
difficulty: Intermediate
position: 54
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Wikipedia — Leaky bucket"
    url: "https://en.wikipedia.org/wiki/Leaky_bucket"
    type: docs
  - title: "Stripe Engineering — Scaling your API with rate limiters"
    url: "https://stripe.com/blog/rate-limiters"
    type: blog
  - title: "Cloudflare — Counting things at scale (rate limiting)"
    url: "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/"
    type: blog
  - title: "Envoy — Rate Limit filter"
    url: "https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/rate_limit_filter"
    type: docs
status: published
---

## intro
A **leaky bucket** rate limiter models requests as water flowing into a bucket with a small hole in the bottom. The hole leaks at a constant rate — that's your guaranteed downstream service rate. The bucket has a fixed capacity; pour faster than it can leak and the bucket overflows, which means the request is either rejected or queued. The output side sees a perfectly smooth stream regardless of how spiky the input is. Compare with the [[rate-limiter-token-bucket]] cousin: token bucket allows bursts up to capacity; leaky bucket flattens them.

## whyItMatters
A leaky bucket is the right pick whenever the downstream cannot absorb bursts. SMS gateways, payment processors, third-party APIs with strict per-second limits, legacy mainframes with fragile thread pools — all need a smooth feed, not a flood. Stripe's outbound webhook delivery uses a leaky-bucket pacer per merchant so a single noisy merchant cannot starve quieter ones. Network shapers (token bucket policer + leaky bucket shaper) on every cloud egress link enforce contracted bitrates. Envoy, NGINX, and HAProxy all ship leaky-bucket implementations as their default "max requests per second" knob because the smoothing is what downstreams actually want.

## intuition
Token bucket says "you have N free passes, spend them however you like, refill at rate R". A user can hit zero, wait an hour, then burst N requests in a millisecond — the limiter is happy because the long-term average is met. Downstream, however, just took N hits simultaneously and might have died.

Leaky bucket says "I will service exactly R requests per second, period". You can submit faster, but I'll queue the excess up to a small buffer and discard anything beyond that. The downstream never sees more than R req/s no matter what the caller does. The price is added latency for queued requests; the prize is a downstream that never has to absorb spikes.

Mechanically you can implement leaky bucket two ways:

**As a queue**: literally a FIFO of pending requests. A worker pulls one every 1/R seconds and forwards it. Bucket "full" means the queue is at capacity; further arrivals get rejected. This is the textbook version.

**As a counter** (GCRA — generic cell rate algorithm): track the time the next request is allowed to be served — call it the **theoretical arrival time** (TAT). Each accepted request advances TAT by 1/R. If a new request arrives before TAT — burst — push it to TAT + 1/R only if TAT - now is within burst tolerance, else reject. This is what Cloudflare and Stripe deploy because it's O(1) memory and lock-free.

Either way, the externally observable behavior is identical: smooth output at exactly R req/s, bounded queue depth, deterministic latency-vs-throughput tradeoff.

## visualization
```
Token bucket (allows bursts):
  input:    XXXXXXXX____________XXXXXXXX____
  output:   XXXXXXXX____________XXXXXXXX____   <- same bursts pass through

Leaky bucket (smooths bursts):
  input:    XXXXXXXX____________XXXXXXXX____
  bucket:   [####....] fills/drains
  output:   X_X_X_X_X_X_X_X_X_X_X_X_X_X_____  <- steady drip at rate R

Overflow case (bucket capacity 4, drip rate 1/sec):
  arrival:  A A A A A A   (6 in 1 sec)
  bucket:   [#][##][###][####][####][####]
  served:   _  _  _  _   X   _   (one served, two rejected)
```

## bruteForce
Cap requests with a sliding-window counter: "max 100 in any 60-second window". Works for billing but does nothing for downstream smoothness — 100 requests can still arrive in the first 100ms of the window and crush a fragile dependency. You've enforced an average, not a rate.

The hand-rolled queue-and-sleep version (a `time.sleep(1/rate)` between dequeued requests) is the leaky bucket — but if you implement it naively with one Python thread per limiter, you eat a thread per tenant and lose precision when the OS scheduler jitters.

## optimal
**GCRA implementation** (recommended). Per limiter (often per user/tenant), store one float: TAT, the timestamp at which the next request would be exactly on schedule.

On request arrival at time `now`:
- `increment = 1 / rate` (seconds per request).
- `burst_tolerance = capacity × increment` (how far ahead of schedule we let callers run).
- `new_tat = max(TAT, now) + increment`.
- `allow_at = new_tat - burst_tolerance`.
- If `now >= allow_at`: accept, set `TAT = new_tat`.
- Else: reject (or wait until `allow_at`).

Why this works: `TAT - now` measures "how far ahead of the schedule the caller currently sits". If they're within `burst_tolerance` ahead, we let them in and push TAT forward. If they're further ahead, the bucket is "full" — reject. Zero queue, O(1) state per limiter, lock-free with `CAS` on the single TAT value.

**Queue variant** for cases where you must not drop. A blocking queue of bounded size with a single drainer firing every `1/R` seconds. New arrivals `put` with a `tryPut(timeout)` — timeout becomes the maximum latency you'll add before signaling backpressure to the caller. Combine with a 429 response and a `Retry-After` header so callers know to slow down rather than pile up.

**Distributed leaky bucket**: store TAT in Redis as a single key per (route, user). Use Redis 7+ `CL.THROTTLE` (from RedisCell) or a Lua script that does the GCRA update atomically. One round-trip per request; no hot-key contention until the same user fires faster than 100k req/s on a single shard.

**Pairing with token bucket**: deploy token bucket at the edge to do per-customer billing limits (allows their burst quota), and leaky bucket at the inner-tier boundary to protect the fragile downstream. The two stack cleanly.

## complexity
- **Per-request work**: O(1) — two arithmetic ops and a compare.
- **Memory per limiter**: 8-16 bytes (one float + maybe a generation counter).
- **Latency overhead in accept path**: nanoseconds for in-process; ~1 RTT for Redis-backed.
- **Maximum sustained throughput**: exactly `rate` regardless of input pressure.

## pitfalls
- **Using wall-clock time without monotonic guard**. NTP steps backward and your TAT lands in the future; the limiter rejects everything for hours. Use a monotonic clock for TAT math.
- **Confusing capacity with rate**. Capacity is "how far ahead of schedule we tolerate" (a count); rate is "drip speed" (per-second). Conflate them and you'll set 100 capacity for a 1 req/s limiter and accidentally allow a 100x burst.
- **Per-request log lines**. At 10k req/s the rejection logs alone become the bottleneck. Sample logs or aggregate to counters.
- **Sharing limiter state across processes without atomicity**. Two processes both reading `TAT`, both updating, last write wins — limiter leaks. Use atomic CAS in-process or Lua scripts in Redis.
- **Reject-only with no signal to caller**. Returning 429 with no `Retry-After` and no metric leaves the caller to retry on its own schedule, often making things worse. Always include backoff guidance.
- **Forgetting clock skew across nodes**. A distributed limiter using local clocks for the same key drifts; tie TAT updates to a single Redis instance's monotonic clock or use logical time.

## interviewTips
- Always contrast with **token bucket** up front: "token bucket allows bursts up to capacity; leaky bucket smooths to a constant rate". The interviewer is checking whether you know the tradeoff.
- For "design Stripe's webhook delivery / SMS sender / payment-gateway proxy" — leaky bucket. The downstream limit is the constraint.
- Mention **GCRA** by name; it's the modern O(1) implementation used in Envoy, RedisCell, Cloudflare. The textbook queue version is a teaching device.
- For **distributed limiters**, propose **Redis + Lua/CL.THROTTLE** with sharded keys per user. Mention the hot-key problem and how you'd shard around it.

## code.python
```python
# Leaky bucket via GCRA. Atomic via threading.Lock; for distributed, replace
# with Redis Lua. Accepts a request if it arrives within burst tolerance.
import time
import threading

class LeakyBucket:
    def __init__(self, rate_per_sec: float, capacity: int):
        # capacity = max burst size in requests; rate = sustained drip rate.
        self.increment = 1.0 / rate_per_sec
        self.burst_tolerance = capacity * self.increment
        self.tat = time.monotonic()
        self._lock = threading.Lock()

    def try_admit(self) -> tuple[bool, float]:
        """Returns (accepted, retry_after_seconds)."""
        with self._lock:
            now = time.monotonic()
            new_tat = max(self.tat, now) + self.increment
            allow_at = new_tat - self.burst_tolerance
            if now >= allow_at:
                self.tat = new_tat
                return True, 0.0
            return False, allow_at - now

# Usage
bucket = LeakyBucket(rate_per_sec=10, capacity=5)
ok, retry_after = bucket.try_admit()
if not ok:
    print(f'rate limited; retry in {retry_after:.3f}s')
```

## code.javascript
```javascript
// GCRA leaky bucket. Single class per (route, user). Lock-free in JS thanks
// to the single-threaded event loop; for cluster mode, store TAT in Redis.
class LeakyBucket {
  constructor({ ratePerSec, capacity }) {
    this.increment = 1 / ratePerSec;
    this.burstTolerance = capacity * this.increment;
    this.tat = performance.now() / 1000;
  }
  tryAdmit() {
    const now = performance.now() / 1000;
    const newTat = Math.max(this.tat, now) + this.increment;
    const allowAt = newTat - this.burstTolerance;
    if (now >= allowAt) {
      this.tat = newTat;
      return { accepted: true, retryAfter: 0 };
    }
    return { accepted: false, retryAfter: allowAt - now };
  }
}

// Per-user limiter registry.
const limiters = new Map();
function admit(userId) {
  let b = limiters.get(userId);
  if (!b) {
    b = new LeakyBucket({ ratePerSec: 5, capacity: 10 });
    limiters.set(userId, b);
  }
  return b.tryAdmit();
}
```

## code.java
```java
// Thread-safe GCRA leaky bucket using AtomicLong CAS for lock-free updates.
import java.util.concurrent.atomic.AtomicLong;

public class LeakyBucket {
    private final long incrementNanos;
    private final long burstToleranceNanos;
    private final AtomicLong tatNanos;

    public LeakyBucket(double ratePerSec, int capacity) {
        this.incrementNanos = (long) (1_000_000_000L / ratePerSec);
        this.burstToleranceNanos = (long) capacity * incrementNanos;
        this.tatNanos = new AtomicLong(System.nanoTime());
    }

    public Result tryAdmit() {
        while (true) {
            long now = System.nanoTime();
            long cur = tatNanos.get();
            long newTat = Math.max(cur, now) + incrementNanos;
            long allowAt = newTat - burstToleranceNanos;
            if (now >= allowAt) {
                if (tatNanos.compareAndSet(cur, newTat)) {
                    return new Result(true, 0L);
                }
                // CAS lost; retry.
            } else {
                return new Result(false, allowAt - now);
            }
        }
    }

    public record Result(boolean accepted, long retryAfterNanos) {}
}
```

## code.cpp
```cpp
// Lock-free GCRA leaky bucket via std::atomic compare-exchange.
#include <atomic>
#include <chrono>

class LeakyBucket {
public:
    LeakyBucket(double rate_per_sec, int capacity)
        : increment_(static_cast<long long>(1e9 / rate_per_sec)),
          burst_tolerance_(static_cast<long long>(capacity) * increment_),
          tat_(now_ns()) {}

    struct Result { bool accepted; long long retry_after_ns; };

    Result try_admit() {
        long long current = tat_.load(std::memory_order_acquire);
        while (true) {
            long long now = now_ns();
            long long new_tat = std::max(current, now) + increment_;
            long long allow_at = new_tat - burst_tolerance_;
            if (now < allow_at) return { false, allow_at - now };
            if (tat_.compare_exchange_weak(current, new_tat,
                    std::memory_order_acq_rel)) {
                return { true, 0 };
            }
        }
    }

private:
    static long long now_ns() {
        return std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::steady_clock::now().time_since_epoch()).count();
    }
    const long long increment_;
    const long long burst_tolerance_;
    std::atomic<long long> tat_;
};
```
