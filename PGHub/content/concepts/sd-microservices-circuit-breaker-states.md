---
slug: sd-microservices-circuit-breaker-states
module: sd-reliability
title: Circuit Breaker State Machine
subtitle: Closed → Open → Half-Open — the 3-state failure-isolation pattern that protects healthy services from sick dependencies. Hystrix, Polly, resilience4j.
difficulty: Intermediate
position: 67
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — CircuitBreaker"
    url: "https://martinfowler.com/bliki/CircuitBreaker.html"
    type: blog
  - title: "Microsoft — Circuit Breaker pattern"
    url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker"
    type: blog
  - title: "Netflix/Hystrix — reference implementation"
    url: "https://github.com/Netflix/Hystrix"
    type: repo
status: published
---

## intro
A downstream service goes sick — latency spikes, errors climb. If callers keep hammering it, they tie up their own threads + connection pools waiting on timeouts, propagating the failure upstream. A **circuit breaker** wraps the call: when failures exceed a threshold, it **opens** and short-circuits (fails fast). After a cooldown it goes **half-open**, lets a probe through to test recovery, then **closes** again if healthy.

## whyItMatters
- **Stops cascading failures**: a slow DB no longer blocks API workers; they return 503 in microseconds instead of timing out in seconds.
- **Gives the sick service breathing room** to recover without retry storms.
- **Provides clean failure semantics** to upstream — instead of opaque timeouts, you get explicit "circuit open."
- Standard in every microservices stack since Netflix open-sourced Hystrix.

## intuition
Three states:

1. **CLOSED** — normal operation. Calls pass through. Track failure rate.
2. **OPEN** — too many failures recently. Reject all calls immediately with a fast error. Start a timer.
3. **HALF-OPEN** — timer expired. Let *one* (or a small N) probe call through. If it succeeds → CLOSED. If it fails → back to OPEN.

The breaker is per-(caller, dependency) pair — every service tracks its own breakers per downstream.

**Failure threshold**: usually expressed as either:
- "≥5 failures in a rolling 10s window" — count-based.
- "≥50% error rate over last N calls" — rate-based. More robust under low traffic.

## visualization
```
State machine:
                  failures > threshold
       +-----------------------------------+
       |                                   v
   [ CLOSED ] ---error---> count++       [ OPEN ]
       ^                                   |
       |                                   | after timeout
       |                                   v
       |        success           [ HALF-OPEN ]
       +-------------------------------    |
                                  failure  |
                                  +--------+
                                  v
                              [ OPEN ]

Timeline example (threshold = 5 errors in 10s):
  t=0  CLOSED, errors=0
  t=1  call OK
  t=2  call FAIL (err=1)
  t=3  call FAIL (err=2)
  t=4  call FAIL (err=3)
  t=5  call FAIL (err=4)
  t=6  call FAIL (err=5) -> OPEN, timer = 30s
  t=7  call -> immediately rejected with "circuit open"
  t=8  call -> rejected
  ...
  t=36 timer expired -> HALF-OPEN
  t=36 probe call -> OK -> CLOSED, errors=0
```

## bruteForce
**No breaker, just retry**: classic retry storm — every failure becomes 3 calls, each timing out for seconds, amplifying load on the sick dependency.

**Hard rate-limit on caller**: blunt — caps traffic even when downstream is healthy.

**Manual switch**: requires ops to react in seconds; humans can't.

Circuit breaker automates the protective response.

## optimal
**Production-grade breaker** (resilience4j / Polly / Hystrix shape):

State + transition logic:
```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=30, half_open_probes=1):
        self.state = 'CLOSED'
        self.failures = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.opened_at = None
        self.probes_remaining = 0
        self.half_open_probes = half_open_probes

    def call(self, fn, *args, **kwargs):
        now = time.time()
        if self.state == 'OPEN':
            if now - self.opened_at >= self.recovery_timeout:
                self.state = 'HALF_OPEN'
                self.probes_remaining = self.half_open_probes
            else:
                raise CircuitOpenError()
        if self.state == 'HALF_OPEN' and self.probes_remaining <= 0:
            raise CircuitOpenError()
        try:
            result = fn(*args, **kwargs)
        except Exception:
            self._on_failure(now)
            raise
        self._on_success()
        return result

    def _on_success(self):
        self.failures = 0
        self.state = 'CLOSED'

    def _on_failure(self, now):
        self.failures += 1
        if self.failures >= self.failure_threshold:
            self.state = 'OPEN'
            self.opened_at = now
```

**Refinements**:
- **Rolling window** (not lifetime counter): use sliding-window counter or token bucket — failures from yesterday shouldn't count today.
- **Slow-call threshold**: count calls slower than X ms as failures even if they succeed.
- **Per-endpoint breakers**: a downstream's `/health` endpoint and `/compute` endpoint may fail independently.
- **Fallback function**: when breaker is open, optionally call a fallback (cached value, default response). Hystrix calls this `fallback()`.
- **Metrics emission**: count state transitions; alert on breakers staying OPEN >5 min.

**Bulkhead pattern**: complementary — limit concurrent calls to a downstream so one slow dep can't exhaust thread pool. Pair with circuit breaker.

## complexity
- **Per-call overhead**: O(1) — state check + increment counter. Sub-microsecond.
- **Memory**: O(1) per (caller, dependency) breaker; thousands of breakers per host trivially.
- **Recovery time after OPEN**: typically 30s default. Tunable; shorter = faster recovery but less protective.

## pitfalls
- **Threshold too low**: false trips on transient blips. Use a rolling-window rate, not absolute count.
- **No fallback**: caller sees `CircuitOpenError` and panics. Provide cached / degraded response if possible.
- **Sharing one breaker across endpoints**: one slow endpoint trips the breaker for healthy endpoints. One breaker per (downstream service, endpoint).
- **Half-open lets unlimited probes**: a flood of probes hits the still-sick downstream → re-trip immediately. Limit to 1-3 probes.
- **No timeout on the wrapped call**: breaker counts only thrown errors; a hung call never triggers it. Always pair with a per-call timeout.
- **Synchronous reset on success**: a single succeeding probe shouldn't fully close if it just happened to hit a healthy replica. Some implementations require N consecutive successes.

## interviewTips
- For "how do you protect a service from a sick dependency" → circuit breaker, 3 states.
- Cite **Hystrix** (Netflix, 2012) as the open-source reference; mention **resilience4j** as the modern successor.
- For senior interviews, discuss **bulkhead pattern** for resource isolation, **circuit breaker vs load shedding** (CB is for upstream failure; LS is for self-overload), **chaos engineering** as the validation discipline.

## code.python
```python
import time, threading
class CircuitOpenError(Exception): pass

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=30):
        self.failures = 0
        self.state = 'CLOSED'
        self.opened_at = 0
        self.threshold = failure_threshold
        self.recovery = recovery_timeout
        self.lock = threading.Lock()

    def call(self, fn, *args, **kw):
        with self.lock:
            if self.state == 'OPEN' and time.time() - self.opened_at >= self.recovery:
                self.state = 'HALF_OPEN'
            if self.state == 'OPEN':
                raise CircuitOpenError()
        try:
            result = fn(*args, **kw)
        except Exception:
            with self.lock:
                self.failures += 1
                if self.failures >= self.threshold:
                    self.state = 'OPEN'
                    self.opened_at = time.time()
            raise
        with self.lock:
            self.failures = 0
            self.state = 'CLOSED'
        return result
```

## code.javascript
```javascript
class CircuitBreaker {
  constructor({ failureThreshold = 5, recoveryTimeoutMs = 30000 } = {}) {
    this.failures = 0;
    this.state = 'CLOSED';
    this.openedAt = 0;
    this.threshold = failureThreshold;
    this.recovery = recoveryTimeoutMs;
  }
  async call(fn) {
    if (this.state === 'OPEN' && Date.now() - this.openedAt >= this.recovery) this.state = 'HALF_OPEN';
    if (this.state === 'OPEN') throw new Error('circuit open');
    try {
      const result = await fn();
      this.failures = 0;
      this.state = 'CLOSED';
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold) { this.state = 'OPEN'; this.openedAt = Date.now(); }
      throw err;
    }
  }
}
```

## code.java
```java
// resilience4j usage
import io.github.resilience4j.circuitbreaker.*;
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)
    .waitDurationInOpenState(Duration.ofSeconds(30))
    .permittedNumberOfCallsInHalfOpenState(1)
    .build();
CircuitBreaker cb = CircuitBreaker.of("payment", config);
Supplier<String> supplier = CircuitBreaker.decorateSupplier(cb, () -> paymentService.charge());
String result = supplier.get();   // throws CallNotPermittedException when open
```

## code.cpp
```cpp
// Same shape; std::mutex for thread safety
class CircuitBreaker {
    std::mutex mtx;
    int failures = 0;
    enum class State { CLOSED, OPEN, HALF_OPEN } state = State::CLOSED;
    std::chrono::steady_clock::time_point opened_at;
    int threshold;
    std::chrono::seconds recovery;
public:
    CircuitBreaker(int t = 5, int r = 30) : threshold(t), recovery(r) {}
    template<typename F>
    auto call(F&& fn) {
        std::lock_guard<std::mutex> lock(mtx);
        auto now = std::chrono::steady_clock::now();
        if (state == State::OPEN && now - opened_at >= recovery) state = State::HALF_OPEN;
        if (state == State::OPEN) throw std::runtime_error("circuit open");
        try {
            auto r = fn();
            failures = 0; state = State::CLOSED;
            return r;
        } catch (...) {
            failures++;
            if (failures >= threshold) { state = State::OPEN; opened_at = now; }
            throw;
        }
    }
};
```
