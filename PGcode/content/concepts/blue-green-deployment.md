---
slug: blue-green-deployment
module: system-design
title: Blue-Green & Canary Deployment
subtitle: Ship a new version without downtime — run the new version alongside the old, flip traffic when ready.
difficulty: Intermediate
position: 17
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
**Blue-green deployment**: keep two identical production environments — "blue" (live) and "green" (new). Deploy the new version to green, smoke-test it, then atomically flip the load balancer to route all traffic to green. Old version stays running for instant rollback. **Canary deployment**: gradually shift a small percentage of traffic to the new version, watch metrics, ramp up if healthy or roll back instantly if bad.

## whyItMatters
Old approach: stop the old server, deploy new version, start it. **Downtime** during the swap. Modern apps can't have that — Google, Stripe, Slack each ship hundreds of deploys per day with zero observable downtime. Blue-green and canary are the two canonical strategies. Every container orchestrator (Kubernetes, ECS), every CDN-fronted service supports both natively.

## intuition
**Blue-green** = atomic cutover. Zero traffic to the new code until you're confident, then 100% in one flip. Rollback = flip back, instant.

**Canary** = gradient. 1% → 5% → 25% → 50% → 100% over hours or minutes. Bad metrics during any step → halt and roll back. Granular failure detection at the cost of slower full rollout.

Most teams combine: canary first (catch obvious bugs), then blue-green for the final cutover (atomic, reversible).

## visualization
```
Blue-green:
                       [LB]
                         │
              ┌──────────┴──────────┐
            BLUE (live, v1)      GREEN (deploying v2)
              │                       │
            100%                    0%
                                     ↓ smoke test passes
                                     ↓ flip
              0%                    100%
              │  (still running, ready for instant rollback)

Canary:
                       [LB]
                         │
                ┌────────┴────────┐
              v1                  v2
              99% ──5min──► 95%   1%  ──5min──► 5%
              50%                 50%
              0%                  100%  (deploy complete)
                                  │
                              metric regression? roll back instantly
```

## bruteForce
"Stop old, deploy new, start it." 30+ seconds of 5xx for users. Acceptable only at hobby scale.

## optimal
**Blue-green setup**:
1. Two identical environments (BLUE and GREEN) behind a load balancer or DNS.
2. Deploy new version to the idle environment.
3. Run smoke tests against the idle environment's direct endpoint.
4. Flip traffic at the LB / DNS layer.
5. Keep the previous environment hot for 10-30 minutes for rollback.

**Canary setup** (via service mesh or LB routing rules):
1. Deploy new version to a small percentage of pods.
2. Configure traffic split (e.g., Istio VirtualService, AWS ALB weighted target groups).
3. Monitor: error rate, p95 latency, RUM (real-user monitoring) signals.
4. Automated rollback policy: if error rate exceeds baseline + N%, halt + roll back.
5. Gradually shift: 1% → 5% → 25% → 50% → 100% over a configured window.

**Schema migrations** are the hard part:
- Additive only during deploy ("expand"): add new columns, never remove.
- Both versions of code must work against the new schema.
- After cutover + soak period, drop unused columns ("contract").
- This is the **expand-contract** pattern.

**Feature flags**: orthogonal but complementary. Deploy code dark (flag off), enable per-user when ready. Decouples deploy from release.

## complexity
- **Resources**: blue-green = 2x infrastructure during deploy. Canary = N+small overhead.
- **Cutover latency**: blue-green = seconds (DNS or LB). Canary = full rollout takes minutes to hours.
- **Rollback latency**: blue-green = instant. Canary = halt + reverse traffic.

## pitfalls
- **Long-running connections (WebSockets, gRPC streams)** stick to old version. Drain gracefully or accept some disconnects.
- **Database schema migrations** during a blue-green: both code versions must coexist. Use expand-contract.
- **Stateful services** (databases, message brokers) — blue-green doesn't apply directly. Use rolling restarts + leader-election.
- **Canary metric noise**: 1% of traffic = sparse data; need 10+ minutes per step.
- **Forgetting to roll the old environment**: pay for 2x infra forever if you don't tear down BLUE after the green deploy soaks.

## interviewTips
- For "design a zero-downtime deploy pipeline" — describe both, default to blue-green for simplicity.
- Always mention **expand-contract** schema migrations.
- For canary, mention **automated rollback** triggered by metric SLOs.
- For senior interviews, mention **feature flags** as the decoupling of deploy and release.

## code.python
```yaml
# Kubernetes: canary via VirtualService (Istio)
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app-canary
spec:
  hosts: [app.example.com]
  http:
  - route:
    - destination: { host: app, subset: stable } 
      weight: 90
    - destination: { host: app, subset: canary }
      weight: 10
```

## code.javascript
```yaml
# AWS ALB weighted target groups (Terraform)
resource "aws_lb_listener_rule" "canary" {
  action {
    type = "forward"
    forward {
      target_group { arn = aws_lb_target_group.stable.arn; weight = 90 }
      target_group { arn = aws_lb_target_group.canary.arn; weight = 10 }
    }
  }
}
```

## code.java
```yaml
# Nginx weighted upstream
upstream app {
    server stable.internal weight=9;
    server canary.internal weight=1;
}
```

## code.cpp
```bash
# Manual blue-green flip via Cloudflare DNS via cli
flarectl dns record update --zone example.com --name app.example.com \
  --content blue.internal --type CNAME
# soak, smoke-test green, then:
flarectl dns record update --zone example.com --name app.example.com \
  --content green.internal --type CNAME
```
