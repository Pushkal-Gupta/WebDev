---
slug: observability-slo
module: system-design
title: SLO / SLI / SLA / Error Budgets
subtitle: Define reliability quantitatively — SLI measures, SLO is the target, SLA is the contract, error budget = (1 − SLO) × time.
difficulty: Intermediate
position: 48
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Google SRE Workbook — SLOs"
    url: "https://sre.google/workbook/implementing-slos/"
    type: book
  - title: "Honeycomb — Service Level Objectives in practice"
    url: "https://www.honeycomb.io/blog/service-level-objectives-slo-explained"
    type: blog
  - title: "google/oss-sli-tools — open-source SLO toolkit"
    url: "https://github.com/google/oss-sli-tools"
    type: repo
status: published
---

## intro
**SLI** (Service Level Indicator): a measurement. "95% of requests in <200ms over the past 28 days."

**SLO** (Service Level Objective): the target for that measurement. "We commit to p95 latency < 200ms over any 28-day window."

**SLA** (Service Level Agreement): the customer contract. "If we miss the SLO, we refund 10% of monthly fee." Usually 1-2 nines BELOW the internal SLO.

**Error budget**: `(1 − SLO_decimal) × time`. A 99.9% SLO over a 30-day month = 43.2 minutes of allowed downtime.

These primitives let engineering teams decide objectively when to ship features vs prioritize reliability.

## whyItMatters
SRE practice (Google, Slack, Stripe) is built on SLOs:
- **Burn alerts** fire when error budget consumes faster than the time window. Not "is this metric high right now?" but "are we on pace to miss this month?".
- **Error budget gates deploys**: if you've burned 100% of your monthly budget, feature deploys pause until the next budget refresh.
- **Aligns incentives**: product team understands "you can't ship if reliability is below target."

Without SLOs: every incident is high-pressure, every alert is "fire everything," no objective deploy gating.

## intuition
**SLI candidates**: latency p50/p95/p99, error rate, request count, availability.

**Good SLOs** use **success-based** metrics: "ratio of successful requests" rather than "is the system up." Successful = `200 || (3xx && not 304 ratelimit)` AND duration < threshold.

**Error budget**:
- 99.9% SLO → 0.1% errors allowed → 43.2 min/month error budget.
- 99.95% SLO → 21.6 min/month.
- 99.99% SLO → 4.3 min/month — typically requires multi-region failover.

Don't over-commit. 99.99% has dramatically higher engineering cost than 99.9%. Pick what users actually need.

## visualization
```
SLO: 99.9% success over 30 days

Day 1-15:                 99.95% success → budget remains 56%.
Day 16: bad deploy →    98%   success for 6 hours → burns 30% of budget.
Day 17-28:               99.92% success → budget remains 22%.
Day 29: brief outage →  burns 25% of budget → OVER budget.
                        Error-budget alert fires.
                        Deploys frozen; reliability work prioritized.

Burn-rate alerting:
  "If we keep burning at this rate, we'll exhaust the 28-day budget in 24h."
  → page on-call (multi-window: e.g. 5min rate AND 1h rate both elevated).

  Slower burn ("budget exhausted in 7 days") → ticket, not page.
```

## bruteForce
**Alert on individual metrics**: "p95 > 300ms" → fires constantly, causes alert fatigue.

**"Five nines or bust"**: 99.999% target → impossibly expensive to maintain → team blamed for missing arbitrary number.

**No SLOs**: every outage is panic. No objective measure of "how reliable are we?"

The SRE answer: define SLOs, alert on burn rate, gate deploys on error budget.

## optimal
**Choosing SLIs**:
- **User-facing API**: success rate of HTTP requests + p95 latency. Two SLOs.
- **Background job**: completion rate within deadline.
- **Storage**: durability + read availability separately.

Use the **menu method**: ask the product team "what % of failures is acceptable?" Get a number, derive SLO.

**Burn-rate alerts** (Google SRE Workbook style):
- **2% of budget in 1h** → page on-call (catastrophic burn).
- **5% of budget in 6h** → page on-call (fast burn).
- **10% of budget in 3 days** → ticket (slow burn).

Multi-window prevents both flap (false positives) and miss (slow burns).

**SLO compliance dashboard**: rolling 28-day window, burn rate, remaining budget. Visible to engineering + product.

**Error budget policy** (written agreement):
- Budget remaining > 50%: full speed feature work.
- Budget 25-50%: reliability investments prioritized.
- Budget < 25%: deploys gated by reliability work.
- Budget exhausted: feature freeze; postmortems mandatory.

## complexity
- **SLI computation**: O(events) — typically Prometheus / Grafana queries.
- **Burn-rate alert evaluation**: O(1) per minute via pre-computed ratios.
- **Operational complexity**: requires a culture commitment to honor the policy.

## pitfalls
- **SLO at 100%**: impossible; allows zero failure. Pick 99.9% or 99.95%.
- **SLO == SLA**: missing the SLO triggers refunds. Set SLO 1-2 nines tighter than SLA so you have internal warning.
- **Alerting on individual metrics, not SLIs**: alert fatigue.
- **Not honoring the budget**: SLO becomes a vanity number. Engineering ignores it.
- **One global SLO for many endpoints**: hides per-endpoint reliability. Define per-critical-flow SLO.
- **Maintenance windows counted as downtime**: usually they're not (planned), but be explicit in the SLO definition.

## interviewTips
- For "design observability for X" — SLOs + error budgets + burn-rate alerts.
- For "how do you balance reliability vs features" — error-budget policy.
- For senior interviews, discuss **multi-window burn alerts**, **SLO refinement** (start broad, narrow), **per-tier SLOs** (free vs paid tier).

## code.python
```python
# Prometheus query for success-ratio SLI
# sum(rate(http_requests_total{status!~"5.."}[28d])) /
# sum(rate(http_requests_total[28d]))

# Burn-rate alert in PromQL (Google SRE multiwindow style):
# 14.4× burn rate over 1h AND 14.4× over 5m
# ((1 - sli_5m) / (1 - slo)) > 14.4
# AND
# ((1 - sli_1h) / (1 - slo)) > 14.4
```

## code.javascript
```javascript
// Compute remaining error budget for the dashboard
function errorBudget(slo, errorsInWindow, totalInWindow) {
  const allowedErrors = totalInWindow * (1 - slo);
  const remainingBudget = allowedErrors - errorsInWindow;
  const consumedPct = (errorsInWindow / allowedErrors) * 100;
  return { allowed: allowedErrors, remaining: remainingBudget, consumed: consumedPct };
}
```

## code.java
```java
// Micrometer counter for success rate
Counter okCounter = Counter.builder("http.requests").tag("status", "ok").register(registry);
Counter errCounter = Counter.builder("http.requests").tag("status", "error").register(registry);
// SLO query: okCounter.count() / (okCounter.count() + errCounter.count())
```

## code.cpp
```cpp
// Prometheus C++ client: counter per outcome class
// counter_family.Add({{"status", "ok"}}).Increment();
// counter_family.Add({{"status", "error"}}).Increment();
// Compute ratio in PromQL.
```
