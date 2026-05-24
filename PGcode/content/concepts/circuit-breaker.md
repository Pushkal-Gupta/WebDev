---
slug: circuit-breaker
module: system-design
title: Circuit Breaker
subtitle: Stop hammering a failing downstream — open the circuit, fail fast, retry occasionally, close when healthy.
difficulty: Intermediate
position: 16
estimatedReadMinutes: 6
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
When a downstream service starts failing, dumb retries make it worse — every caller piling on extends the outage. The **circuit breaker** pattern wraps the call: when failures cross a threshold, the breaker "trips" open and short-circuits future calls with a fast failure for a cooling period. Periodically it lets one probe through (half-open); if it succeeds, the breaker closes again.

## whyItMatters
Without circuit breakers, a slow downstream cascades:
1. Downstream gets slow → caller's threads block waiting on responses.
2. Caller's thread pool fills up → caller becomes slow.
3. Caller's caller blocks → fan-out collapse.

The breaker turns that into: "downstream slow → fail fast at the breaker → caller stays healthy and serves a degraded response." Used everywhere: Netflix Hystrix (the canonical implementation), AWS SDK, gRPC interceptors, Istio sidecars, every modern reverse proxy.

## intuition
Three states:
- **Closed** (healthy): every call passes through. Failures counted in a rolling window.
- **Open** (tripped): all calls fail fast (typically throwing a `BreakerOpenException`) without touching the downstream. Lasts for a configured cooldown.
- **Half-open** (probing): one call is allowed through after cooldown. If it succeeds, transition to closed. If it fails, stay open for another cooldown.

The breaker is a small state machine wrapping each call.

## visualization
```
Closed ──N failures in window──► Open
                                  │
                                  └─after cooldown──► Half-open
                                                       │
                                                       ├─success──► Closed
                                                       └─fail──────► Open (next cooldown)
```

## bruteForce
No breaker — retry on every failure with exponential backoff. Works for transient failures but doesn't help when downstream is actually down. Threads pile up.

## optimal
Configuration knobs:
- **Failure threshold**: e.g., 5 failures within 10 seconds → open.
- **Cooldown / open duration**: e.g., 30 seconds before half-open.
- **Half-open allowance**: 1-3 trial calls before deciding open or closed.
- **Failure classifier**: which exceptions count? Timeouts? 5xx HTTP? Connection refused? Don't count 4xx (client errors aren't downstream's fault).

Pair with:
- **Bulkhead**: limit concurrent calls per downstream so one slow service can't exhaust your whole thread pool.
- **Fallback**: when breaker is open, return a cached / degraded response instead of just failing.
- **Timeout**: never wait forever on a downstream call. The breaker won't trip if calls are pending forever.

```
state = CLOSED
failure_count = 0
opened_at = None
cooldown_seconds = 30
threshold = 5

def call(operation):
    global state, failure_count, opened_at
    if state == OPEN:
        if (now() - opened_at) > cooldown_seconds:
            state = HALF_OPEN
        else:
            raise BreakerOpenError
    try:
        result = operation()  # timeout-bounded
        if state == HALF_OPEN: state = CLOSED; failure_count = 0
        return result
    except Exception as e:
        if isinstance(e, (TimeoutError, DownstreamError)):
            failure_count += 1
            if failure_count >= threshold:
                state = OPEN; opened_at = now()
        raise
```

In multi-instance services, share breaker state via Redis OR per-instance breakers + load-balancer-level pooling.

## complexity
- **Per-call overhead**: O(1) — just a state check + counter update.
- **Memory**: O(1) per breaker.
- **Critical**: needs accurate clock for cooldown timing.

## pitfalls
- **Counting 4xx as failures**: 4xx is client error — your fault, not theirs. Don't trip the breaker.
- **No timeout on the wrapped call**: breaker can't trip if calls are pending. ALWAYS bound by a per-call timeout.
- **Breaker per call site without per-downstream coordination**: each call site has its own breaker → wastes capacity. Share per logical downstream.
- **Open for too long**: 30s cooldown is the standard. Anything > 5min and recovery becomes slow even after downstream is healthy.
- **No fallback**: if the breaker just throws, every consumer breaks too. Provide a sane default ("cached recommendations" instead of empty list).

## interviewTips
- For "how do you handle downstream service failures" — circuit breaker + timeout + bulkhead, in that order.
- Mention **Hystrix** by name as the canonical reference (even though Netflix has since moved to resilience4j / mesh-level breakers).
- Pair with **retry budget** (limit retries to N% of traffic) and **exponential backoff with jitter**.
- For senior interviews, contrast in-process breakers (one per JVM) with mesh-level (Istio / Envoy) where the sidecar handles it transparently.

## code.python
```python
import time
from enum import Enum
class State(Enum):
    CLOSED = 1; OPEN = 2; HALF_OPEN = 3

class CircuitBreaker:
    def __init__(self, threshold=5, cooldown=30):
        self.state = State.CLOSED
        self.failures = 0
        self.opened_at = 0
        self.threshold = threshold
        self.cooldown = cooldown
    def call(self, fn, *args, **kwargs):
        if self.state == State.OPEN:
            if time.time() - self.opened_at > self.cooldown:
                self.state = State.HALF_OPEN
            else:
                raise RuntimeError("circuit open")
        try:
            r = fn(*args, **kwargs)
            if self.state in (State.HALF_OPEN, State.CLOSED):
                self.state = State.CLOSED; self.failures = 0
            return r
        except Exception:
            self.failures += 1
            if self.failures >= self.threshold:
                self.state = State.OPEN
                self.opened_at = time.time()
            raise
```

## code.javascript
```javascript
class CircuitBreaker {
  constructor({ threshold = 5, cooldownMs = 30_000 } = {}) {
    this.state = 'CLOSED'; this.failures = 0; this.openedAt = 0;
    this.threshold = threshold; this.cooldownMs = cooldownMs;
  }
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt > this.cooldownMs) this.state = 'HALF_OPEN';
      else throw new Error('circuit open');
    }
    try {
      const r = await fn();
      this.state = 'CLOSED'; this.failures = 0;
      return r;
    } catch (e) {
      this.failures++;
      if (this.failures >= this.threshold) { this.state = 'OPEN'; this.openedAt = Date.now(); }
      throw e;
    }
  }
}
```

## code.java
```java
class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private State state = State.CLOSED;
    private int failures = 0;
    private long openedAt = 0;
    private final int threshold; private final long cooldownMs;
    public CircuitBreaker(int t, long c) { threshold = t; cooldownMs = c; }
    public <T> T call(java.util.concurrent.Callable<T> fn) throws Exception {
        if (state == State.OPEN) {
            if (System.currentTimeMillis() - openedAt > cooldownMs) state = State.HALF_OPEN;
            else throw new RuntimeException("circuit open");
        }
        try { T r = fn.call(); state = State.CLOSED; failures = 0; return r; }
        catch (Exception e) {
            failures++;
            if (failures >= threshold) { state = State.OPEN; openedAt = System.currentTimeMillis(); }
            throw e;
        }
    }
}
```

## code.cpp
```cpp
#include <chrono>
#include <functional>
#include <stdexcept>
class CircuitBreaker {
    enum class State { CLOSED, OPEN, HALF_OPEN };
    State state = State::CLOSED;
    int failures = 0;
    long long openedAt = 0;
    int threshold; long long cooldownMs;
public:
    CircuitBreaker(int t, long long c) : threshold(t), cooldownMs(c) {}
    template<class F> auto call(F fn) -> decltype(fn()) {
        auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now().time_since_epoch()).count();
        if (state == State::OPEN) {
            if (now - openedAt > cooldownMs) state = State::HALF_OPEN;
            else throw std::runtime_error("circuit open");
        }
        try { auto r = fn(); state = State::CLOSED; failures = 0; return r; }
        catch (...) {
            if (++failures >= threshold) { state = State::OPEN; openedAt = now; }
            throw;
        }
    }
};
```
