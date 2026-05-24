---
slug: zero-downtime-deploys
module: system-design
title: Zero-Downtime Deploys
subtitle: Roll new code without dropping connections — health checks + readiness probes + draining + graceful shutdown.
difficulty: Intermediate
position: 37
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Kubernetes — Rolling update strategies"
    url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"
    type: book
  - title: "AWS Builders' Library — Reliability, constant work"
    url: "https://aws.amazon.com/builders-library/"
    type: blog
  - title: "kubernetes/kubernetes — graceful shutdown handling"
    url: "https://github.com/kubernetes/kubernetes"
    type: repo
status: published
---

## intro
A user clicks "Submit" right as you deploy v2. Naive flow: kill v1, start v2, user gets `502 Bad Gateway`. **Zero-downtime deploys** keep traffic served continuously across the transition by combining **rolling updates** + **readiness/liveness probes** + **connection draining** + **graceful shutdown** + (often) **blue-green** or **canary** for the cutover.

## whyItMatters
Modern apps deploy 10-1000+ times per day. Each deploy must be invisible to users:
- Stripe, Slack, GitHub — multi-deploy-per-hour cadence with no scheduled downtime.
- Mobile apps with always-on long-polling/WebSocket connections need especially careful handling.
- Enterprise SaaS with strict SLAs (99.99% = 52 min/year) — even one bad deploy blows the budget.

The piece every deploy pipeline ships with.

## intuition
Five primitives, working together:

1. **Rolling update**: stop one instance at a time, start the new one, repeat. Never < N-1 alive.
2. **Readiness probe**: new instance answers `GET /readyz` only after it's loaded config, opened DB pool, warmed JIT. Load balancer routes traffic only to ready instances.
3. **Liveness probe**: distinct from readiness; restarts the instance if it deadlocks. Don't confuse the two.
4. **Connection draining**: when shutting down, instance stops accepting NEW requests but finishes in-flight ones (typically 30-60s grace period).
5. **Graceful shutdown**: process SIGTERM handler: deregister from LB, drain, close DB pool, exit. Don't `os.exit(0)` mid-request.

Total flow: LB removes shutting-down instance from rotation → instance finishes in-flight requests → process exits → new instance starts → passes readiness → LB adds back to rotation.

## visualization
```
Rolling update (3 replicas, deploy v2):

[v1] [v1] [v1]   ← LB sends traffic to all 3
   │
   ▼ orchestrator: kill instance #1
[--] [v1] [v1]   ← LB removes #1 (drains 30s)
   │
   ▼ start v2 instance #1
[v2] [v1] [v1]   ← v2 #1 starts, /readyz fails initially
   │
   ▼ /readyz passes (warmed up)
[v2*] [v1] [v1]  ← LB routes to v2 #1 now
   │
   ▼ repeat for #2, #3
[v2*] [v2*] [v2*]

Throughout: no instant where 0 instances served traffic.
```

## bruteForce
**Stop all + restart**: 30-60s of 5xx. Acceptable only for hobby projects.

**Blue-green at LB level alone**: works (cutover atomic) but needs 2x infra during deploy. Combine with rolling for cost.

**No graceful shutdown**: existing requests get RST. Users see partial responses.

The combination of the 5 primitives above is the modern standard.

## optimal
**Kubernetes Deployment spec**:
```yaml
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # at most 6 pods during rollout
      maxUnavailable: 0    # never less than 5 ready
  template:
    spec:
      terminationGracePeriodSeconds: 60   # drain window
      containers:
      - name: app
        readinessProbe:
          httpGet: { path: /readyz, port: 8080 }
          initialDelaySeconds: 5
          periodSeconds: 5
        livenessProbe:
          httpGet: { path: /healthz, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 30
        lifecycle:
          preStop:
            exec:
              command: ["sleep", "10"]   # let LB notice we're going away
```

**App-side graceful shutdown**:
```js
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, draining...');
  server.close();                  // stop accepting new
  await drainExistingRequests();   // wait for in-flight
  await db.end();                  // close DB pool
  process.exit(0);
});
```

**Connection draining**: most LBs (AWS ALB, GCP, nginx ingress, Envoy) accept a "deregistration delay" — keep sending in-flight responses to the draining backend, send NEW requests elsewhere.

**Long-lived connections** (WebSocket, gRPC streams): send a `GoAway` frame so clients know to reconnect.

## complexity
- **Rollout duration**: `replicas * (start_time + grace_period)`. For 10 replicas at 30s each = 5 min total.
- **Per-deploy 5xx budget**: 0 with proper draining; <0.01% with WebSocket reconnect.
- **2x peak capacity** during rollout if `maxSurge=replicas` (faster but expensive). Tune.

## pitfalls
- **Conflating readiness vs liveness**: liveness fails → pod restarted (kept in service if liveness passes but readiness fails). Mixing them → restart loops.
- **Grace period too short**: app SIGKILL'd mid-request. Set `terminationGracePeriodSeconds` ≥ slowest expected request.
- **No `preStop` hook**: LB doesn't notice pod is going away → routes new requests to dying pod → 502. The `sleep 10` `preStop` gives LB time to deregister.
- **Stateful migrations during deploy**: schema change that breaks v1 BEFORE v2 takes over → broken windows. Use expand-contract.
- **Cron jobs / background workers**: also need SIGTERM handling. Don't forget non-HTTP workloads.

## interviewTips
- For "design a zero-downtime deploy pipeline" — list the 5 primitives.
- Cite **expand-contract** for schema changes during a rolling deploy.
- For senior interviews, discuss **rolling vs blue-green vs canary** tradeoffs.

## code.python
```python
# Flask + signal handler
import signal, sys, time
draining = False

@app.route('/readyz')
def ready():
    if draining: return '', 503
    if not db.healthy(): return '', 503
    return '', 200

def shutdown(signum, frame):
    global draining
    draining = True
    time.sleep(10)             # let LB notice via /readyz
    db.close()
    sys.exit(0)

signal.signal(signal.SIGTERM, shutdown)
```

## code.javascript
```javascript
// Node + Express
let draining = false;
app.get('/readyz', (req, res) => res.status(draining ? 503 : 200).end());

process.on('SIGTERM', async () => {
  draining = true;
  setTimeout(async () => {
    server.close();
    await db.end();
    process.exit(0);
  }, 10_000);
});
```

## code.java
```java
// Spring Boot — graceful shutdown built-in
// application.yml:
// server:
//   shutdown: graceful
// spring:
//   lifecycle:
//     timeout-per-shutdown-phase: 60s
```

## code.cpp
```cpp
// std::signal SIGTERM + atomic shutdown flag + drain loop
static std::atomic<bool> draining{false};
std::signal(SIGTERM, [](int){ draining = true; });
while (!draining) { server.poll(); }
// Drain in-flight requests, close connections, exit.
```
