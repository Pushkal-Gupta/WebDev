---
slug: observability
module: system-design
title: Observability — SLI, SLO, SLA
subtitle: Measure what users actually experience, set targets, and earn a budget for risk.
difficulty: Intermediate
position: 10
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
Observability is being able to answer "what's wrong, and why?" about a running system without shipping new code. Three pillars: **metrics** (numbers over time), **logs** (timestamped events), **traces** (causal chains across services). On top sits the SLI/SLO/SLA stack: how you express "is the service working?" as a number, set a goal, and (for paying customers) make a contract.

## whyItMatters
Without metrics + alerts, you find out the site is down from Twitter. Without logs + traces, you spend the next two hours guessing which microservice in a 50-service mesh introduced the regression. Without SLOs, every engineer has a different opinion on "is this latency OK?" — and you ship features when you should be paying down reliability, or vice versa. SLOs turn reliability into a budget you spend.

## intuition
- **SLI** (indicator): the measurement. "99.2% of HTTP requests this week returned 2xx within 500ms."
- **SLO** (objective): the target. "99.5% of HTTP requests should succeed within 500ms over any 30-day window."
- **SLA** (agreement): the contract, usually with money attached. "If SLO breaks by more than 0.5% in a month, we refund 10% of the bill."

The gap between current SLI and the SLO is your **error budget**. Each failed request "spends" budget. If you have budget left, ship faster. If you've spent it, slow down, harden, freeze risky deploys until the next window.

## visualization
```
┌─────────────────────────────────────────────────┐
│ SLO: 99.9% successful requests / 30 days        │
│ Error budget: 0.1% = ~43 minutes/month          │
│                                                 │
│ Spent so far:   ████████░░░░  37 of 43 minutes  │
│ Remaining:      6 minutes — be cautious         │
└─────────────────────────────────────────────────┘
```

## bruteForce
Print statements + tail the logs + Slack channel for "is anything broken?" Works for a 2-person startup; collapses the moment you have 5+ services or a paying user who notices before you do.

## optimal
**Metrics**: Prometheus, Datadog, Cloud-native (CloudWatch/Stackdriver). Counter (monotonically increasing — requests, errors), gauge (current value — connections open, memory used), histogram (distribution — latency p50, p95, p99). Tag by route, method, status. **Always look at p95/p99**, not just the mean — average latency hides the bad experience of 5% of users.

**Logs**: Structured (JSON, not free text), centralized (ELK, Loki, Splunk, CloudWatch Logs), with request-id + user-id + trace-id on every line. Searchable, filterable, retention policy.

**Traces**: OpenTelemetry → Jaeger/Tempo/Honeycomb. Propagate a trace context (W3C `traceparent`) across services so you can follow one request from edge to DB and back.

**RED method** for services: **R**ate, **E**rror rate, **D**uration. Capture these three for every endpoint and you've got 80% of useful observability.

**USE method** for resources: **U**tilization, **S**aturation, **E**rrors. For CPU, memory, disk, network.

**Define SLIs that match user experience**:
- Availability: `successful_requests / total_requests` (NOT uptime — a returned-500 service is "up" but broken).
- Latency: `requests_under_threshold / total_requests`.
- Freshness for data pipelines: `now() - last_successful_run < target_lag`.

**Alert on burn rate, not raw count**: "we'll burn 100% of our monthly budget in 1 hour at this rate" pages someone immediately; "we just had 1 error this week" doesn't.

## complexity
- **Metrics cardinality**: every label combination is a series. Don't tag by user-id (millions of series) — that's logs/traces work.
- **Log volume**: 1KB/request × 10k req/sec × 86k sec = ~860GB/day. Sample non-critical logs.
- **Trace sampling**: head-based (1% of all traces) or tail-based (keep traces with errors / high latency). Tail-based gives the rare anomalies, costs more to implement.

## pitfalls
- **Vanity SLOs**: "five nines" sounds great until you realize it's 5 minutes of downtime per year — and you cannot ship if your release process burns 5 minutes.
- **Alert fatigue**: 100 alerts/day are 100 alerts ignored. Page only on user-facing breakage; everything else is a ticket.
- **Logging secrets**: PII / API keys leaking into logs is a P0 compliance breach. Sanitize at the logger, not in code review.
- **Untagged latency**: aggregated p99 across all endpoints tells you nothing — one slow endpoint can hide behind a fast majority.
- **Sampling away the bug**: 1% trace sampling means you might never see the failing request. Tail-based sampling or always-sample-errors is the fix.

## interviewTips
- For any system-design question, bring up observability before you finish — interviewers expect "and we'd alert on the error budget burn rate."
- Distinguish **metrics vs logs vs traces** explicitly. Knowing what goes in which is senior-level rigour.
- Mention **RED method** for services and **USE method** for resources — both are interview-friendly mnemonics.
- For senior-level, talk about **error budgets as a release-velocity governor** — when budget is spent, deploys freeze.

## code.python
```python
# Prometheus client for the RED metrics on a single endpoint.
from prometheus_client import Counter, Histogram, generate_latest
import time

REQ = Counter('http_requests_total', 'Total HTTP requests', ['route', 'status'])
LAT = Histogram('http_request_duration_seconds', 'Latency', ['route'])

def handle(route, fn):
    start = time.time()
    try:
        result = fn()
        REQ.labels(route, 'success').inc()
        return result
    except Exception:
        REQ.labels(route, 'error').inc()
        raise
    finally:
        LAT.labels(route).observe(time.time() - start)
```

## code.javascript
```javascript
// Tiny middleware that captures RED.
const counts = { ok: 0, err: 0 };
const latencies = [];
function red(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    latencies.push(Date.now() - start);
    (res.statusCode < 500 ? counts.ok++ : counts.err++);
  });
  next();
}
// Compute p95 on demand:
function p95() { const s = [...latencies].sort((a,b)=>a-b); return s[Math.floor(0.95 * s.length)]; }
```

## code.java
```java
import io.micrometer.core.instrument.*;
class Red {
    private final Counter requests;
    private final Counter errors;
    private final Timer latency;
    Red(MeterRegistry r, String route) {
        requests = Counter.builder("http_requests_total").tag("route", route).register(r);
        errors = Counter.builder("http_errors_total").tag("route", route).register(r);
        latency = Timer.builder("http_latency").tag("route", route).register(r);
    }
    <T> T record(java.util.function.Supplier<T> work) {
        return latency.record(() -> {
            try { requests.increment(); return work.get(); }
            catch (RuntimeException e) { errors.increment(); throw e; }
        });
    }
}
```

## code.cpp
```cpp
#include <atomic>
#include <chrono>
struct Red {
    std::atomic<long long> total{0}, errors{0}, latencyNsSum{0};
    template<class F> auto record(F work) -> decltype(work()) {
        auto t0 = std::chrono::steady_clock::now();
        total++;
        try {
            auto r = work();
            latencyNsSum += std::chrono::duration_cast<std::chrono::nanoseconds>(
                std::chrono::steady_clock::now() - t0).count();
            return r;
        } catch (...) { errors++; throw; }
    }
};
```
