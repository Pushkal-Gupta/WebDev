---
slug: exponential-backoff-jitter
module: system-design
title: Exponential Backoff with Jitter
subtitle: Retry failed calls with `base * 2^attempt` delay PLUS randomized jitter — prevents thundering-herd retries collapsing the upstream.
difficulty: Intermediate
position: 32
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "AWS Architecture Blog — Exponential backoff and jitter"
    url: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/"
    type: book
  - title: "High Scalability — retry storms"
    url: "http://highscalability.com/"
    type: blog
  - title: "aws-amplify/amplify-js — equal-jitter retry implementation"
    url: "https://github.com/aws-amplify/amplify-js"
    type: repo
status: published
---

## intro
Naive retry on a transient failure: 1000 clients all see a 503 and retry simultaneously → upstream gets hammered with 1000 retries at the same instant → it falls over harder. **Exponential backoff** spreads retries over time: 1s, 2s, 4s, 8s, ... **Jitter** randomizes within that envelope so clients don't all retry at the SAME exponential offset. The pair is the standard retry primitive in distributed systems.

## whyItMatters
Retry storms cause real outages:
- 2017 AWS S3 outage — clients without proper backoff slowed recovery.
- Any service mesh / API client should ship with it (Envoy, gRPC, AWS SDK, Stripe SDK all do).

Without jitter: clients re-synchronize after each retry round, creating periodic spike traffic — same throughput-killer.

## intuition
- **Exponential** spread: delay grows as `base * 2^attempt`, capped at `max_delay`.
- **Jitter** breaks synchronization. Three flavors:
  - **Full jitter**: `delay = random(0, base * 2^attempt)` — pick uniformly in the window.
  - **Equal jitter**: `delay = (window/2) + random(0, window/2)` — keeps a baseline.
  - **Decorrelated jitter**: `delay = random(base, prev * 3)` — AWS recommendation.

Full jitter has the best dispersion across many clients.

## visualization
```
1000 clients see a 503 at t=0.

Naive retry (no backoff, no jitter):
  t=0    1000 retries hit upstream → SAME FAILURE
  t=1    1000 retries again → SAME FAILURE
  ...

Exponential backoff (no jitter):
  t=1    1000 retries (all wait exactly 1s) → still synchronized!
  t=3    1000 retries (all wait 2s more)
  ...

Exponential + full jitter:
  t in [0,1]   1000 retries spread uniformly → upstream sees ~1000/sec instead of 1000/0sec
  t in [0,2]   surviving 600 retries spread over 2 sec
  t in [0,4]   surviving 200 retries spread over 4 sec
  ...
  → upstream sees a manageable smooth retry rate
```

## bruteForce
**Immediate retry loop**: kills the upstream.

**Fixed delay**: doesn't escalate; long outages cause continuous hammering at 1s intervals.

**Exponential without jitter**: still synchronizes retry waves.

Exponential + jitter is the canonical fix.

## optimal
```
def exponential_backoff_with_jitter(attempt, base=0.1, max_delay=60.0):
    """Full jitter: returns delay in [0, min(max, base * 2^attempt)]."""
    window = min(max_delay, base * (2 ** attempt))
    return random.uniform(0, window)

def retry(fn, max_attempts=8):
    for attempt in range(max_attempts):
        try:
            return fn()
        except RetryableError:
            if attempt == max_attempts - 1: raise
            time.sleep(exponential_backoff_with_jitter(attempt))
```

**Retry budget** (separate concept): cap retries to N% of regular traffic so retries never become the majority of upstream load.

**Idempotency**: combine with idempotency keys so a retry can't double-charge / double-send.

**Circuit breaker** + backoff: when failure rate is high, the breaker opens entirely; backoff helps when the breaker is half-open probing.

## complexity
- **Per-retry overhead**: O(1).
- **Max wait**: `sum(base * 2^k for k in range(N))` ≈ `base * 2^N` — cap with `max_delay`.
- **Worst-case attempts**: `max_attempts` × longest possible delay.

## pitfalls
- **No max cap**: delay grows to hours; user gives up. Always cap.
- **Sync `time.sleep` blocking the event loop** (Node, asyncio): use the framework's async sleep.
- **Retrying non-idempotent operations**: pay-per-retry is bad. Combine with idempotency keys.
- **Counting attempts wrong**: `attempt=0` should not wait at all in some implementations. Be consistent.
- **Per-attempt timeout**: each retry should have its own request timeout — otherwise a hung request blocks all retries.

## interviewTips
- For "how do you handle transient failures" — exponential backoff + jitter + idempotency + circuit breaker.
- Cite AWS's "decorrelated jitter" research as the gold standard.
- For senior interviews, discuss **retry budgets** and **retry amplification across service layers** (one client retry → 3 layers → 27 backend calls).

## code.python
```python
import time, random
def backoff_with_jitter(attempt, base=0.1, max_delay=60.0):
    return random.uniform(0, min(max_delay, base * (2 ** attempt)))

def retry(fn, *, max_attempts=8, retryable=(Exception,)):
    for attempt in range(max_attempts):
        try: return fn()
        except retryable as e:
            if attempt == max_attempts - 1: raise
            time.sleep(backoff_with_jitter(attempt))
```

## code.javascript
```javascript
async function retry(fn, { maxAttempts = 8, base = 100, maxDelay = 60_000 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (attempt === maxAttempts - 1) throw e;
      const window = Math.min(maxDelay, base * 2 ** attempt);
      await new Promise(r => setTimeout(r, Math.random() * window));
    }
  }
}
```

## code.java
```java
import java.util.concurrent.ThreadLocalRandom;
class Retry {
    static <T> T withBackoff(Supplier<T> fn, int maxAttempts, long baseMs, long maxMs) throws Exception {
        for (int i = 0; i < maxAttempts; i++) {
            try { return fn.get(); }
            catch (Exception e) {
                if (i == maxAttempts - 1) throw e;
                long window = Math.min(maxMs, baseMs * (1L << i));
                Thread.sleep(ThreadLocalRandom.current().nextLong(0, window));
            }
        }
        throw new IllegalStateException();
    }
}
```

## code.cpp
```cpp
#include <chrono>
#include <random>
#include <thread>
template<class F>
auto retry_with_backoff(F fn, int max_attempts = 8, double base = 0.1, double max_delay = 60.0) {
    std::mt19937 rng(std::random_device{}());
    for (int i = 0; i < max_attempts; ++i) {
        try { return fn(); }
        catch (...) {
            if (i == max_attempts - 1) throw;
            double window = std::min(max_delay, base * (1 << i));
            std::uniform_real_distribution<double> d(0, window);
            std::this_thread::sleep_for(std::chrono::duration<double>(d(rng)));
        }
    }
    throw std::runtime_error("unreachable");
}
```
