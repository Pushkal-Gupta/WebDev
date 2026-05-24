---
slug: observability-otel
module: system-design
title: OpenTelemetry End-to-End
subtitle: One SDK, three signals (metrics, logs, traces) — wire-protocol standardized (OTLP) so any backend works. Replaces APM lock-in.
difficulty: Advanced
position: 56
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "OpenTelemetry — concepts overview"
    url: "https://opentelemetry.io/docs/concepts/"
    type: book
  - title: "Charity Majors — Observability 2.0"
    url: "https://charity.wtf/2024/01/15/wide-events/"
    type: blog
  - title: "open-telemetry/opentelemetry-collector"
    url: "https://github.com/open-telemetry/opentelemetry-collector"
    type: repo
status: published
---

## intro
**OpenTelemetry (OTel)** is the CNCF graduated standard for application telemetry — one SDK per language, one wire format (**OTLP** = gRPC/HTTP+protobuf), one collector binary. Apps emit metrics + logs + traces via the SDK; the collector receives, processes (sampling, redaction, batching), and exports to ANY backend (Jaeger, Tempo, Honeycomb, Datadog, Grafana Cloud, New Relic). Replaces proprietary APM agents — no vendor lock-in.

## whyItMatters
Before OTel: every observability vendor (Datadog, New Relic, Splunk) had their own SDK. Switching cost = re-instrument every service. Now: instrument ONCE with OTel; swap backends by changing the collector config.

Adopted by every major cloud + APM vendor. Industry standard since 2021. The only future-proof choice for new services.

## intuition
Two layers:
1. **Application SDK**: app calls `tracer.start_span(...)`, `meter.create_counter(...)`. SDK buffers + batches; sends to collector via OTLP.
2. **Collector**: separate process / sidecar / k8s daemonset. Receives OTLP, applies processors (tail sampling, attribute redaction, batching), exports to backends.

Decoupling app from backend = swap-friendly. Decoupling collector from backend = multi-export (send to Honeycomb AND Datadog during migration).

**Semantic conventions** standardize attribute names: `http.method`, `db.statement`, `messaging.system` — so dashboards built on `http.method` work across any language.

## visualization
```
App (any language)
   │
   ├── tracer.start_span("checkout")  → spans
   ├── meter.create_counter("orders")  → metrics
   └── logger.info(..., trace_id=...)  → logs
                 │
                 ▼ OTLP (gRPC or HTTP) batched
   ┌──────────────────────────────────┐
   │       OTel Collector             │
   │  receivers: otlp                 │
   │  processors:                     │
   │     - batch                      │
   │     - tail_sampling              │
   │     - attributes/redact (PII)    │
   │  exporters:                      │
   │     - jaeger (traces)            │
   │     - prometheus (metrics)       │
   │     - loki (logs)                │
   │     - datadog (mirror, optional) │
   └──────────────────────────────────┘
            │       │        │
            ▼       ▼        ▼
        Jaeger  Prom     Loki
```

## bruteForce
**Vendor SDK per service** (Datadog SDK + New Relic SDK + ...): lock-in. Migration = re-instrument everything.

**Roll-your-own**: build telemetry from scratch — months of work, missing semantic conventions, no collector ecosystem.

**Prometheus alone**: metrics only. Misses traces + logs correlation.

OTel = unified instrumentation across all three pillars.

## optimal
**Per-language SDK setup**:
- **Python**: `opentelemetry-distro` + auto-instrumentation for Flask / Django / requests / SQLAlchemy.
- **Node**: `@opentelemetry/auto-instrumentations-node` — patches `http`, `pg`, `redis`, `express`.
- **Java**: javaagent (`-javaagent:opentelemetry-javaagent.jar`) — zero code change.
- **Go**: import + manual instrumentation via `otel.Tracer()`.

**Collector deployment**:
- Sidecar per pod: low latency, isolated.
- Daemonset per node: shared collector saves resources.
- Gateway: centralized cluster behind a load balancer; processes aggregate traffic.

Most setups: app → sidecar → gateway → backend.

**Processors** (collector pipeline):
- `batch`: aggregate before export (efficiency).
- `tail_sampling`: keep all errors + slow traces + 1% normal.
- `attributes/redact`: PII scrubbing (regex match credit cards, emails).
- `memory_limiter`: drop on overload to prevent OOM.

**Sampling strategies**:
- **Head sampling** (SDK side): decide at trace start. Cheap. Loses interesting tail events.
- **Tail sampling** (collector): hold trace, decide at end. Catches all errors. Needs buffer per trace.

**Cost control**: tail sampling at 1% normal + 100% errors → 99% reduction in span volume without losing debug value.

## complexity
- **SDK overhead**: ~1% CPU.
- **Collector throughput**: ~1M spans/sec per medium VM with batching.
- **Backend cost**: largest variable; tail sampling shrinks 10-100×.

## pitfalls
- **PII in span attributes**: HTTP URLs may contain tokens; DB queries may include emails. ALWAYS run redaction processor.
- **Cardinality explosion on metrics**: tagging by user_id → millions of time series. Use Histograms not per-user gauges.
- **Sampling at SDK only**: loses errors that pop in the 99% you dropped. Tail sampling fixes.
- **Forgetting to propagate trace_id across async boundaries** (Kafka messages, queues): trace chain breaks. Use OTel context propagators for each transport.
- **Collector buffer overrun**: tail sampling needs RAM proportional to (trace_count × duration). Tune.
- **Vendor "OTel compatibility" varies**: some lose semantic attributes on export. Test before committing.

## interviewTips
- For "design observability for X" → OTel SDK + collector + backend(s) of choice.
- Mention **tail sampling** + **PII scrubbing** + **semantic conventions** as the three operational must-haves.
- For senior interviews, discuss **multi-region collector topology**, **cost vs sampling rate trade-off**, **migrating from vendor SDKs**.

## code.python
```python
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

resource = Resource.create({'service.name': 'checkout-svc', 'service.version': '1.4.2'})
provider = TracerProvider(resource=resource)
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint='collector:4317')))
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

@app.post('/checkout')
def checkout():
    with tracer.start_as_current_span('handle_checkout') as span:
        span.set_attribute('user.id', user_id_safe)
        ...
```

## code.javascript
```javascript
// NodeSDK with auto-instrumentations
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'http://collector:4317' }),
  instrumentations: [getNodeAutoInstrumentations()],
  resource: { 'service.name': 'checkout-svc' },
}).start();
```

## code.java
```java
// -javaagent:opentelemetry-javaagent.jar
// -Dotel.service.name=checkout-svc -Dotel.exporter.otlp.endpoint=http://collector:4317
// Zero code change — agent auto-instruments Spring, JDBC, gRPC, etc.
```

## code.cpp
```cpp
// open-telemetry/opentelemetry-cpp
// auto provider = opentelemetry::trace::Provider::GetTracerProvider();
// auto tracer = provider->GetTracer("checkout-svc");
// auto span = tracer->StartSpan("handle_checkout");
// span->SetAttribute("user.id", uid);
// span->End();
```
