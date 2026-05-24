---
slug: metrics-vs-logs-vs-traces
module: system-design
title: Metrics vs Logs vs Traces (Three Pillars)
subtitle: Different observability signals — metrics for trends, logs for narrative, traces for causality. Pick by cardinality + query pattern.
difficulty: Intermediate
position: 31
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "Charity Majors — Observability Engineering (Honeycomb)"
    url: "https://www.honeycomb.io/observability-engineering-oreilly-book-2022"
    type: book
  - title: "Brendan Gregg — Systems performance methodology"
    url: "https://www.brendangregg.com/methodology.html"
    type: blog
  - title: "open-telemetry/opentelemetry-collector"
    url: "https://github.com/open-telemetry/opentelemetry-collector"
    type: repo
status: published
---

## intro
The three pillars of observability:
- **Metrics**: numeric time series (CPU%, request count, p95 latency). Aggregated, low cardinality, cheap. Query: "what's the trend?"
- **Logs**: textual events with context (`{"ts": ..., "level": "error", "msg": "...", "user_id": ...}`). High cardinality, mid cost. Query: "what happened?"
- **Traces**: structured request-flow with parent/child spans across services. Highest cardinality, highest cost. Query: "why was THIS request slow?"

Each answers different questions. World-class teams use all three plus continuous profiling.

## whyItMatters
Wrong tool → wasted ops dollars + slow debugging:
- Storing high-cardinality user_id as a metric label → explodes Prometheus.
- Logging every HTTP request without sampling → terabytes of egress.
- Tracing every request without tail sampling → broken collector.

The pattern: **metrics for SLO dashboards + alerting**, **logs for incident forensics**, **traces for latency investigation**.

## intuition
| Question | Best signal |
|---|---|
| "Is p95 latency rising?" | Metric |
| "How many 5xx in the last hour?" | Metric |
| "What did the auth service log around 14:23?" | Log |
| "Show me every error stack trace for user 7" | Log |
| "Why is this checkout taking 2s?" | Trace |
| "Which downstream service is the slowest in this flow?" | Trace |

Mix: alert fires on a metric → click into the linked dashboard → pivot to logs for the affected service → pivot to traces for slow requests.

## visualization
```
                   ┌──────────────┐
                   │  Application │
                   └──────┬───────┘
                          │ emit
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌─────────┐      ┌─────────┐       ┌─────────┐
   │ Metric  │      │   Log   │       │  Span   │
   │ counter │      │  JSON   │       │ parent/ │
   │ gauge   │      │  line   │       │ child   │
   └────┬────┘      └────┬────┘       └────┬────┘
        │                │                  │
        ▼                ▼                  ▼
   Prometheus         Loki/ELK           Jaeger/Tempo
   Grafana                                Honeycomb
```

## bruteForce
**All-logs approach**: emit everything as JSON logs, search later. Cheap to start, terrible to scale (TB/day, slow queries).

**Metrics only**: cheap + queryable but loses per-request context. Can't answer "why was THIS specific request slow."

**Just APM agents**: works but locks you into one vendor. OpenTelemetry standardizes the wire format.

## optimal
**Setup**:
1. **Metrics**: Prometheus scrape `/metrics` on each service. Grafana dashboards. Alertmanager for paging.
2. **Logs**: structured JSON to stdout → log shipper (Fluentbit / Vector) → Loki / Elasticsearch / S3. Use trace_id field for cross-correlation.
3. **Traces**: OpenTelemetry SDK → OTel collector → Jaeger / Tempo / Honeycomb.

**Cardinality rules**:
- Metrics labels: low cardinality only (region, service, http_status). NEVER user_id, request_id, full URL path.
- Logs: any cardinality OK; structured fields for fast filtering.
- Traces: highest detail; sample at the collector to control cost.

**Cross-correlation**:
- Every log line includes the active `trace_id` + `span_id`. Click from a slow trace to "show all logs for this trace."
- Metric exemplars: Prometheus 2.26+ supports linking a sampled metric value to a representative trace_id.

**Cost tiers** (typical):
- Metrics: $0.10/GB ingested.
- Logs: $1/GB ingested.
- Traces (tail-sampled): $5/GB ingested.

## complexity
- **App overhead**: <1% CPU for metrics + logs; ~1% for tracing.
- **Storage**: metrics ~1 byte/data point, logs ~100 bytes/line, spans ~1KB.
- **Query latency**: metrics ms, logs seconds, traces seconds (with right index).

## pitfalls
- **High-cardinality labels in metrics**: kills Prometheus. Use Histograms (`http_request_duration_seconds_bucket`) instead of `_p95` per-user.
- **Unstructured log strings**: `printf("user %s failed at %s", ...)` — unparseable. Use `logger.error('failed', user_id=u, step=s)`.
- **No trace_id in logs**: can't correlate. Make it a default field.
- **Sampling at the wrong layer**: head-sample at the SDK → consistent sampling per trace. Tail-sample at collector → smarter decisions (keep all errors).
- **Treating traces as logs**: traces are EXPENSIVE per byte. Don't dump huge request bodies in spans.

## interviewTips
- For "how would you debug production X" → metrics for trends + logs for forensics + traces for latency.
- For "design observability for a microservice fleet" → OpenTelemetry SDK + collector + per-pillar backend.
- Mention **the cardinality trap** — most observability failures come from too-detailed metric labels.

## code.python
```python
# Metrics with prometheus_client
from prometheus_client import Counter, Histogram, start_http_server
requests = Counter('http_requests_total', 'total', ['method', 'status'])
latency = Histogram('http_duration_seconds', 'latency')

# Logs with structlog
import structlog
log = structlog.get_logger()
log.error('checkout_failed', user_id=u, step='payment', trace_id=current_trace_id())

# Traces with OpenTelemetry SDK (see distributed-tracing concept)
```

## code.javascript
```javascript
// Metrics
const promClient = require('prom-client');
const requests = new promClient.Counter({ name: 'http_requests_total', help: '...', labelNames: ['method', 'status'] });

// Logs
const pino = require('pino')();
pino.error({ user_id: u, trace_id: traceId, err }, 'checkout failed');

// Traces — OpenTelemetry SDK
```

## code.java
```java
// Micrometer for metrics
Counter.builder("http.requests").tag("method", "POST").register(registry).increment();
// SLF4J + Logback for structured JSON logs
log.error("checkout failed user_id={} trace_id={}", u, traceId);
```

## code.cpp
```cpp
// Prometheus C++ client + spdlog + opentelemetry-cpp
// Each pillar has a C++ ecosystem; integration is similar in shape.
```
