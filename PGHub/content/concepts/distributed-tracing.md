---
slug: distributed-tracing
module: sd-reliability
title: Distributed Tracing
subtitle: Stitch a single request's spans across N services into one timeline — OpenTelemetry / Jaeger / Zipkin.
difficulty: Intermediate
position: 30
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Google Dapper paper (2010)"
    url: "https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/"
    type: book
  - title: "OpenTelemetry — semantic conventions + tracing"
    url: "https://opentelemetry.io/docs/concepts/observability-primer/"
    type: blog
  - title: "open-telemetry/opentelemetry-collector"
    url: "https://github.com/open-telemetry/opentelemetry-collector"
    type: repo
status: published
---

## intro
When a single user request fans out across 12 microservices, debugging "why is it slow?" without tracing is impossible — logs are scattered, no cross-service correlation. **Distributed tracing** instruments every service to emit **spans** (one per operation: HTTP handler, DB query, RPC call) tagged with a shared **trace_id** and parent/child **span_ids**. A collector (Jaeger / Tempo / Honeycomb / Datadog) stitches them into a single waterfall view: "this 800ms request was 200ms in API gateway → 150ms in auth → 400ms in inventory DB → 50ms in payment."

## whyItMatters
The only way to debug latency / errors in microservices at scale:
- **Pinpoint slow services** in a fan-out chain.
- **Find unexpected dependencies** ("why is service A calling service Z?").
- **Root-cause errors** that propagate across boundaries.
- **Capacity planning** — see actual call patterns vs predicted.

Standard tool: **OpenTelemetry** (vendor-neutral; replaces OpenTracing + OpenCensus). Replaces older proprietary SDKs (New Relic, Datadog, Lightstep) — they all consume OTel now.

## intuition
- **Trace** = a tree of spans for one logical request.
- **Span** = a unit of work in a single service. Has: `trace_id`, `span_id`, `parent_span_id`, `service`, `operation`, `start_ts`, `duration_ms`, `attributes` (k/v map), `events` (timestamped log lines), `status`.
- **Propagation**: when service A calls service B over HTTP, A injects headers (`traceparent: 00-<trace_id>-<span_id>-01`); B extracts them and creates a child span. Result: B's spans are children of A's call span.

Sampling: tracing every request is expensive. Use **tail-based sampling** (collect everything; downstream collector picks ~1% to persist + retains all errors).

## visualization
```
Single trace (trace_id = abc123):

GET /checkout (api-gateway)                              800 ms ─┐
   │                                                              │
   ├─ auth.verify (auth-svc)                            150 ms    │
   │                                                              │
   ├─ inventory.reserve (inventory-svc)                 400 ms    │
   │     ├─ db.query SELECT ... (postgres)             380 ms ────│ ← bottleneck!
   │     └─ cache.set ...                                15 ms    │
   │                                                              │
   └─ payment.charge (payment-svc)                       50 ms    │
         └─ stripe.create (external)                     30 ms ───┘

trace_id  span_id  parent      service       operation        duration
abc123    s1       null        api-gateway   GET /checkout    800
abc123    s2       s1          auth-svc      verify           150
abc123    s3       s1          inventory-svc reserve          400
abc123    s4       s3          postgres      query            380
abc123    s5       s3          redis         cache.set         15
abc123    s6       s1          payment-svc   charge            50
abc123    s7       s6          stripe        create.charge     30
```

## bruteForce
**Per-service logs only**: search timestamps across 12 services to correlate. Hours per incident.

**Custom request_id in app code**: better than nothing but requires manual propagation, no automatic span tree, no waterfall view.

**APM agent per service (Datadog/New Relic)**: works but vendor lock-in + per-service licensing cost.

OpenTelemetry: vendor-neutral, automatic propagation across libraries, ecosystem of exporters.

## optimal
**Instrumentation** — auto-instrument libraries via OTel SDK:
- HTTP client/server (Flask, Express, gin, Spring) → automatic span per request.
- DB drivers (Postgres, MySQL, Mongo) → automatic span per query.
- Message brokers (Kafka, RabbitMQ) → automatic produce/consume spans + propagation via headers.

**Propagation**:
- HTTP: `traceparent` + `tracestate` headers (W3C Trace Context).
- gRPC: metadata headers.
- Kafka: message headers.

**Pipeline**:
1. App emits spans → OTel SDK batches → OTLP/gRPC → Collector.
2. Collector buffers, samples, exports → Jaeger / Tempo / Honeycomb / Datadog.
3. UI shows the trace tree, time-range queries, percentile heatmaps.

**Sampling strategies**:
- **Head sampling**: decide at trace start (1% kept). Simple, deterministic, but biased.
- **Tail sampling**: collect everything, sample at collector (keep all errors + slow traces + 1% normal). More accurate.

## complexity
- **Per-request overhead**: ~50µs per span (OTel SDK is highly optimized).
- **Bandwidth**: spans are small (~1KB each). Tail sampling cuts 99% of egress.
- **Storage**: depends on retention; typically 7-30 days hot, archived to S3.

## pitfalls
- **PII in span attributes**: tracing captures HTTP URLs + DB queries. SCRUB credit cards, PII, tokens before export. OTel processors support attribute redaction.
- **Span cardinality explosion**: don't tag spans with `user_id`/`request_id` as labels — exporters can't aggregate. Put unique values as attributes (not labels).
- **Missing propagation across queues**: if you forget to inject trace headers into Kafka messages, the consumer span starts a NEW trace, breaking the chain.
- **Sampling at the wrong layer**: if API gateway samples at 1% and downstream services don't honor the decision, you get partial traces. Pass the sampling decision in `traceparent`.
- **Clock skew across services**: spans may appear out-of-order in the waterfall. Use NTP; accept ~10ms skew.

## interviewTips
- For "how would you debug latency in microservices" → distributed tracing.
- Mention **OpenTelemetry** (the standard) + **Jaeger** (the common backend).
- For senior interviews, discuss **tail-based sampling** + **PII scrubbing** + **propagation across async boundaries (Kafka/SQS)**.

## code.python
```python
# OTel auto-instrumentation
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)
tracer = trace.get_tracer(__name__)

@app.route('/checkout')
def checkout():
    with tracer.start_as_current_span('checkout-logic') as span:
        span.set_attribute('user.id', user_id_safe)
        reserve_inventory(user_id_safe)
        charge_payment(user_id_safe)
        return 'ok'
```

## code.javascript
```javascript
// Node + OpenTelemetry SDK
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
// Automatic Express + http + pg + redis spans now.
```

## code.java
```java
// Spring Boot + io.opentelemetry:opentelemetry-spring-boot-starter
// Auto-creates spans for @RestController methods and DataSource queries.
@RestController
class CheckoutController {
    @GetMapping("/checkout")
    public String checkout() { /* spans automatic */ return "ok"; }
}
```

## code.cpp
```cpp
// OpenTelemetry C++ SDK is more involved — see open-telemetry/opentelemetry-cpp
// auto tracer = opentelemetry::trace::Provider::GetTracerProvider()->GetTracer("svc");
// auto span = tracer->StartSpan("operation");
// span->SetAttribute("user.id", uid);
// span->End();
```
