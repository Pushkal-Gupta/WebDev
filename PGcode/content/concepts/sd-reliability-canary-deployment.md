---
slug: sd-reliability-canary-deployment
module: sd-reliability
title: Canary Deployment
subtitle: Route a small slice of traffic (1% → 10% → 50% → 100%) to the new build, watch metrics, halt + rollback on regression. The deploy strategy with the lowest blast radius.
difficulty: Intermediate
position: 71
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Martin Fowler — CanaryRelease"
    url: "https://martinfowler.com/bliki/CanaryRelease.html"
    type: blog
  - title: "Google SRE Book — Release engineering"
    url: "https://sre.google/sre-book/release-engineering/"
    type: blog
  - title: "argoproj/argo-rollouts — progressive delivery for k8s"
    url: "https://github.com/argoproj/argo-rollouts"
    type: repo
status: published
---

## intro
A **canary deployment** rolls out a new version to a small fraction of users first, observes real-traffic metrics, and gates further rollout on those metrics being healthy. Named after coal miners' canaries — if the canary dies, you stop. Standard at Netflix, Google, Stripe, Spotify. Lower blast radius than blue-green (which switches 100% at once) at the cost of more sophisticated traffic-routing infrastructure.

## whyItMatters
- **Bug containment**: a bug that ships at 100% impacts every user; at 1% only impacts 1%.
- **Real-traffic validation**: pre-production tests miss subtle issues (real data shapes, cache behavior, dependency interactions).
- **Faster rollback**: detect regression at 1%, halt + revert before propagation.
- **Statistical confidence**: with enough canary time, compare A/B metrics with significance — bake in the result.

## intuition
**Phases**:
1. **Deploy** new build to canary instances alongside production (separate pool).
2. **Route** a small % of traffic to canary (1% typical start). Load balancer / service mesh handles split.
3. **Observe** metrics: error rate, latency, business KPIs. Compare canary vs control.
4. **Decide**:
   - Healthy → bump to next % (10% → 50% → 100%).
   - Unhealthy → halt + rollback (route all traffic back to old build).
5. **Bake** — wait at each % for enough traffic to see slow-burn issues.

**Comparison axes**:
- **Blue-green**: 0 → 100% switch. Fast rollback (DNS/router flip) but no real-traffic validation phase.
- **Canary**: gradual %. Real-traffic validation; slower full rollout.
- **Feature flag**: code-level toggle independent of deploy. Often combined with canary.

## visualization
```
Phase 0 (before):
  100% traffic → v1 (3 pods)

Phase 1 (1% canary):
  99% → v1   (3 pods)
   1% → v2   (1 pod) ← canary, observing metrics

Phase 2 (10% canary, bake 30 min):
  90% → v1
  10% → v2

Phase 3 (50/50):
  50% → v1
  50% → v2

Phase 4 (full):
  100% → v2  (4 pods)
  Old v1 pods drained + removed.

Auto-rollback on metric breach:
  metric: error_rate > 1% for 5 min
  metric: p99_latency > baseline * 1.5 for 5 min
  metric: business KPI (orders/sec) drops > 10% vs control

  if ANY breach: halt rollout, return all traffic to v1, alert.
```

## bruteForce
**Big-bang deploy** (`kubectl apply` + 100% traffic): bug ships to all users instantly.

**Manual % adjustment by ops**: works but slow + error-prone + doesn't auto-rollback.

**Tests-only**: pre-prod tests miss real-traffic bugs.

Automated canary is the standard.

## optimal
**Infrastructure pieces**:
- **Traffic splitter**: service mesh (Istio, Linkerd) OR load balancer with weighted backend OR feature flag at the app layer.
- **Metric collector**: Prometheus / Datadog / CloudWatch capturing per-version metrics.
- **Analyzer**: compares canary vs control; emits health verdict.
- **Orchestrator**: Argo Rollouts, Flagger, Spinnaker — drives the % rollup based on analyzer verdict.

**Tagging traffic for analysis**:
- Inject `x-version: v2` header at LB → metrics tagged by version → easy comparison.
- For statistical rigor, use **deterministic routing** by user_id hash so the same user always sees the same version (avoids confusion + improves comparison).

**Auto-rollback triggers**:
- Error rate breach.
- Latency p99 breach.
- Business KPI regression (conversion, orders/sec).
- Anomaly detection (statistical, not threshold).

**Manual override**:
- Always have a "FAST FORWARD" + "ROLLBACK" big red button. Ops trumps automation.

**Per-region staggering**:
- Roll out canary in one region first; bake; then propagate to others. Cuts blast radius further.

**For stateful changes** (DB migrations, schema): canary doesn't help — those need expand/contract patterns. Decouple schema changes from code deploys.

## complexity
- **Deploy time**: stretched (hours to days), much longer than blue-green.
- **Operational overhead**: orchestrator + metric pipelines + on-call awareness.
- **Cost during rollout**: 2× capacity briefly (both versions running).

## pitfalls
- **No analyzer / human-gated only.** Ops gets paged at 3am to manually approve each step — slow, error-prone. Fix: define metric SLOs and let the orchestrator auto-promote/-rollback; humans only for edge cases.
- **Routing by random per-request hash.** Same user sees v1 then v2 then v1 → confused state, broken sessions. Fix: hash by stable user_id or session_id; same user pinned to same version for the rollout window.
- **Canary too small to be statistically meaningful.** 1% of low-traffic service = 5 events in 30 min — noise dominates. Fix: increase canary % OR extend bake time; for very low traffic, accept that canary doesn't add much value.
- **Comparing canary to absolute thresholds instead of control.** Background variation (time of day, day of week) trips alerts. Fix: compare canary to control (v1) measured at the same time, not to historical baseline.
- **Deploy includes schema migration.** Rolling back code is easy; rolling back a destructive migration is not. Fix: split deploys — migration first (expand), then code, then migration cleanup (contract); each phase independently rollback-able.
- **No "no canary" override.** Emergency security patch must ship to 100% immediately; canary process blocks. Fix: support an emergency flag that bypasses gradual rollout; gate with audit log + approval.

## interviewTips
- For "how do you deploy safely" → canary with metric-gated auto-promotion.
- Cite **Argo Rollouts** (k8s) and **Flagger** as modern open-source tools; **Spinnaker** for the heavyweight option.
- For senior interviews, discuss **per-region staggering**, **automated analysis windows**, **canary for stateful services**, **expand-contract DB migrations**.

## code.python
```python
# Conceptual: a minimal canary controller
import time, statistics
class CanaryController:
    def __init__(self, lb, metrics, stages=(1, 10, 50, 100), bake=300):
        self.lb, self.metrics, self.stages, self.bake = lb, metrics, stages, bake
    def run(self, new_version):
        for pct in self.stages:
            self.lb.set_weight(new_version, pct)
            time.sleep(self.bake)
            canary_err = self.metrics.error_rate(version=new_version)
            control_err = self.metrics.error_rate(version='v1')
            if canary_err > control_err * 1.5 + 0.01:
                self.lb.set_weight(new_version, 0)   # rollback
                raise CanaryFailed(f'err {canary_err} vs control {control_err}')
        return 'promoted'
```

## code.javascript
```javascript
// Flagger CRD example (declarative)
// apiVersion: flagger.app/v1beta1
// kind: Canary
// metadata: { name: my-service }
// spec:
//   targetRef: { apiVersion: apps/v1, kind: Deployment, name: my-service }
//   analysis:
//     interval: 1m
//     threshold: 5         # rollback after 5 failed checks
//     stepWeight: 10       # +10% per analysis round
//     metrics:
//       - name: request-success-rate
//         threshold: 99
```

## code.java
```java
// Spring Cloud Gateway weighted routing example
@Bean
public RouteLocator routes(RouteLocatorBuilder b) {
    return b.routes()
        .route("canary",
            r -> r.weight("my-service", 10)            // 10% to v2
                  .uri("http://my-service-v2"))
        .route("stable",
            r -> r.weight("my-service", 90)
                  .uri("http://my-service-v1"))
        .build();
}
```

## code.cpp
```cpp
// Conceptual analyzer comparing canary vs control metrics
struct MetricSnapshot { double error_rate; double p99_latency; };
bool isHealthy(const MetricSnapshot& canary, const MetricSnapshot& control) {
    if (canary.error_rate > control.error_rate * 1.5 + 0.01) return false;
    if (canary.p99_latency > control.p99_latency * 1.3) return false;
    return true;
}
```
