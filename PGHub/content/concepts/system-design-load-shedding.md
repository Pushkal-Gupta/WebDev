---
slug: system-design-load-shedding
module: sd-reliability
title: Load Shedding
subtitle: Drop low-priority requests on purpose when overloaded — controlled degradation beats cascading collapse. The pattern AWS, Netflix, Stripe all run.
difficulty: Advanced
position: 65
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Reliability under load"
    url: "https://dataintensive.net/"
    type: book
  - title: "AWS Builders' Library — Using load shedding to avoid overload"
    url: "https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/"
    type: blog
  - title: "Netflix/concurrency-limits — adaptive load-shedding library"
    url: "https://github.com/Netflix/concurrency-limits"
    type: repo
status: published
---

## intro
When a server's request rate exceeds its safe processing rate, the choice is: queue (latency spikes + memory bloat), crash (everyone loses), or **shed** (drop the lowest-priority requests fast and serve the rest). Load shedding is **controlled degradation** — you choose who loses so the system survives. Universal pattern at AWS, Netflix, Stripe, Cloudflare.

## whyItMatters
Without shedding:
- Queue grows unboundedly → memory exhausted → process crash.
- Tail latency explodes → upstream clients time out → retry storm → death spiral.
- One overloaded host poisons load balancer → cascading failure across the fleet.

With shedding:
- Bounded queue → bounded latency.
- Reject *fast* (give the client a clean 503 in 1ms vs hanging for 30s).
- Preserve capacity for high-priority traffic (paying customers > batch jobs).

## intuition
Detect overload via one of:
- **Queue depth** exceeds a threshold.
- **CPU utilization** > 80%.
- **Response latency** p99 > SLO.
- **Active concurrent requests** > capacity (adaptive concurrency).

When overloaded, **shed**:
- Reject lowest-priority first (free-tier > paid > enterprise).
- Reject newest first (LIFO) — old requests already have sunk cost / impatient client.
- Reject randomly — fair, simple, prevents pattern lock-in.

Critical: the rejected client must back off (HTTP 429 with `Retry-After`) or it'll just retry harder, amplifying the storm.

## visualization
```
Without shedding, under 2× capacity:
  Inbound rate: 200 rps
  Process rate: 100 rps
  Queue grows by 100/s → 6000 in 60s
  Latency for queued request: 60s+
  Memory: GBs of queued requests
  Eventually: OOM kill, all 6000 dropped, fleet cascade.

With shedding at 110% queue depth:
  Inbound rate: 200 rps
  Process rate: 100 rps
  Accept 100, shed 100 with HTTP 429 + Retry-After: 5s
  Queue stays bounded at threshold.
  Sheddees retry after 5s; gradual relief as load eases.
  No cascade. SLO holds for the 100/s accepted.

Priority-aware shedding (free=1, paid=10, ent=100):
  Inbound: 200 rps mixed (40 ent, 60 paid, 100 free)
  Shed bottom-up: drop 100 free → 100 rps remain (all paid + ent)
  Process rate matches. Ent SLO held; paid SLO held; free degraded gracefully.
```

## bruteForce
**Unbounded queue + hope**: cascades.

**Hard rate limit at LB**: blunt — can't distinguish priority or current capacity.

**Auto-scale**: necessary but slow (minutes); shedding handles seconds-scale spikes.

**Rely on client timeouts**: clients hold connections / sockets open; you still spend resources accepting them.

Load shedding fills the gap between rate limiting (input control) and auto-scaling (capacity control).

## optimal
**Token-bucket per priority**:
- Allocate tokens to high-pri, then medium, then low.
- Free-tier exhausts its tokens first → shed first.

**Adaptive concurrency control** (Netflix/concurrency-limits):
- Track current request latency.
- If latency rising → reduce allowed concurrency.
- If latency stable → increase concurrency.
- AIMD (additive increase / multiplicative decrease) like TCP.

**Stop-the-line shedding** (AWS):
- Server measures its own queue depth or in-flight count.
- Above threshold → reject all new requests with 503 + Retry-After.
- Bypasses LB; happens locally on each host.

**Cost-aware shedding** (Stripe, Lyft):
- Estimate request cost (DB calls, compute).
- High-cost requests rejected first under load.

**Always include backoff signal**:
- HTTP 429 + Retry-After header.
- Or 503 Service Unavailable + Retry-After.
- gRPC: `RESOURCE_EXHAUSTED` status with retry-info.

**Health-check exception**: never shed health checks; otherwise LB takes you out of rotation, accelerating the spiral.

## complexity
- **Per-request overhead** of shedding decision: ~microseconds (counter increment + threshold compare).
- **Recovery time** after spike subsides: instant once queue drains.
- **Capacity headroom required**: typically 20-30% over baseline to absorb bursts without immediate shedding.

## pitfalls
- **No backoff signal.** A bare 503 with no `Retry-After` invites clients to retry immediately, amplifying the storm. Fix: always include `Retry-After` (or gRPC `RetryInfo`) and have clients exponentially back off with jitter on receipt.
- **Health checks shed.** Dropping health-check probes makes the load balancer mark the instance unhealthy, redirecting *more* traffic to the surviving hosts. Fix: whitelist health-check paths in the shedding decision so probes always succeed regardless of inflight count.
- **Single FIFO for all priorities.** A FIFO that mixes priorities lets a flood of low-priority requests starve high-priority ones. Fix: maintain per-priority queues (or token buckets) and drain in strict priority order; shed only from the lowest non-empty bucket.
- **Synchronised fleet thresholds.** Every host shedding at exactly 80% CPU produces a coordinated wave of 429s that spikes retries simultaneously. Fix: add jitter to per-host thresholds (e.g., random in `[75%, 85%]`) and use locally-measured latency percentiles rather than a global clock.
- **Self-shed instead of pushing back upstream.** If the upstream dependency is the bottleneck, shedding inbound requests just hides the real problem. Fix: detect upstream slowness with circuit breakers and propagate backpressure through the call chain (e.g., gRPC `RESOURCE_EXHAUSTED`).
- **Shedding invisible to ops.** Without metrics, you only learn about shedding from angry customers. Fix: emit a counter like `requests_shed_total{reason,priority}` and dashboard the shed rate; alert when the rate stays above 1% for >5 minutes.

## interviewTips
- For "how do you handle a traffic spike that exceeds capacity" → load shedding with priority-aware policy.
- Cite **adaptive concurrency control** (Netflix Zuul, concurrency-limits) as the modern automated form.
- For senior interviews, discuss **stop-the-line shedding**, **cost-aware shedding**, **circuit-breakers vs shedding** (CB is for upstream failure; shedding is for self-overload).

## code.python
```python
import time, threading

class LoadShedder:
    def __init__(self, max_inflight=100):
        self.max_inflight = max_inflight
        self.inflight = 0
        self.lock = threading.Lock()

    def accept(self, priority='low'):
        with self.lock:
            limit = self.max_inflight if priority == 'high' else int(self.max_inflight * 0.7)
            if self.inflight >= limit:
                return False
            self.inflight += 1
            return True

    def release(self):
        with self.lock:
            self.inflight -= 1

shedder = LoadShedder(max_inflight=100)
def handle(req):
    if not shedder.accept(priority=req.priority):
        return ('429', {'Retry-After': '5'})
    try:
        return do_work(req)
    finally:
        shedder.release()
```

## code.javascript
```javascript
// Express middleware
let inflight = 0;
const MAX = 100;
function shed(req, res, next) {
  const pri = req.headers['x-priority'] || 'low';
  const limit = pri === 'high' ? MAX : Math.floor(MAX * 0.7);
  if (inflight >= limit) {
    res.setHeader('Retry-After', '5');
    return res.status(429).json({ error: 'overloaded' });
  }
  inflight++;
  res.on('finish', () => { inflight--; });
  next();
}
```

## code.java
```java
// Spring filter with AtomicInteger
@Component
public class LoadShedFilter implements Filter {
    private final AtomicInteger inflight = new AtomicInteger();
    private static final int MAX = 100;
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) {
        String pri = ((HttpServletRequest) req).getHeader("X-Priority");
        int limit = "high".equals(pri) ? MAX : (int) (MAX * 0.7);
        if (inflight.get() >= limit) {
            HttpServletResponse r = (HttpServletResponse) resp;
            r.setStatus(429); r.setHeader("Retry-After", "5"); return;
        }
        inflight.incrementAndGet();
        try { chain.doFilter(req, resp); }
        finally { inflight.decrementAndGet(); }
    }
}
```

## code.cpp
```cpp
// Single-process atomic counter
std::atomic<int> inflight{0};
constexpr int MAX = 100;
bool tryAccept(const std::string& priority) {
    int limit = (priority == "high") ? MAX : static_cast<int>(MAX * 0.7);
    int cur = inflight.fetch_add(1);
    if (cur >= limit) { inflight.fetch_sub(1); return false; }
    return true;
}
void release() { inflight.fetch_sub(1); }
```
