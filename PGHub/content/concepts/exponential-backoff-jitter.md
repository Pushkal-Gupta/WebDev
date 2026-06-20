---
slug: exponential-backoff-jitter
module: sd-reliability
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
Retry storms cause real outages. AWS Architecture Blog (2015, Marc Brooker) credits the lack of jitter for the periodic spikes that prolonged the 2012 EBS event; the same pattern reappeared during the 2017 S3 outage when client libraries with naive backoff re-synchronized and pummelled the recovering service. Every major SDK now ships exponential-backoff-with-jitter as the default: AWS SDK v3, the Google Cloud client libraries, the Stripe SDKs, gRPC's built-in retry policy (RFC 8478-style), Envoy's `retry_policy`, and Kubernetes' `client-go` rate limiter all derive directly from Brooker's post. RFC 5681 (TCP congestion control) and RFC 7232 (HTTP conditional requests) reference the same principle. Designing rate-limit-friendly clients without it is an interview red flag.

## intuition
If `N` clients fail at the same instant and all retry after exactly `2^k` seconds, they fail together again at `t = 2^k`, and again at `t = 2^{k+1}` — a perfectly synchronized stampede that keeps the dependent service down. Backoff alone (waiting longer between retries) helps but does not cure the synchronization. The fix is to add randomness so the retries spread out across a window instead of landing on the same instant.

Three shapes are common. **Full jitter** picks the wait uniformly between 0 and `cap_or_2^k` seconds and is the AWS recommendation for most workloads — it spreads load most evenly and minimizes total time-to-completion. **Equal jitter** waits half the deterministic backoff plus a uniform random of the other half; useful when you want a floor to prevent immediate retries on transient errors. **Decorrelated jitter** computes the next wait as `min(cap, random(base, prev * 3))`, which avoids the long-tail of full-jitter when failures cluster.

Always pair jitter with an absolute cap (typically 30s for user-facing requests, several minutes for background jobs) and an idempotency key so duplicate writes do not double-charge anyone. Without idempotency, retries that succeed silently after a network blip create the very inconsistencies you were trying to avoid.

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
Use full jitter unless you have a specific reason not to: wait a random duration sampled uniformly from `[0, min(cap, base * 2^attempt)]`. Combine with a maximum attempt count, a circuit breaker for sustained failures, and an idempotency key so retried writes are safe.

```python
import random, time

def call_with_backoff(fn, *, base=0.1, cap=30, max_attempts=8):
    for attempt in range(max_attempts):
        try:
            return fn()
        except TransientError:
            if attempt == max_attempts - 1:
                raise
            sleep = random.uniform(0, min(cap, base * (2 ** attempt)))
            time.sleep(sleep)
```

The critical line is `random.uniform(0, min(cap, base * (2 ** attempt)))`. The cap prevents waits from growing past what users will tolerate (typically 30 s); the exponential `2 ** attempt` doubles the window each round, which gives the downstream service exponentially more room to recover; the `uniform(0, ...)` randomization is what breaks the synchronization. AWS published measurements (Brooker 2015) showing full-jitter completes a `N=10000` retry burst in roughly a quarter of the wall time of unjittered exponential backoff, with peak load reduced by 4x. For long-running daemons add a half-life decay on the attempt counter so a process that has been up for a week does not keep wide-window retries forever after one transient failure. Pair the policy with a circuit breaker (Netflix's Hystrix, the Resilience4j family, Envoy's outlier detection) so that sustained downstream failure trips the breaker and fails fast instead of consuming retry budgets that will not help recover the dependent service.

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
