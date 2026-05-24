---
slug: service-mesh
module: system-design
title: Service Mesh
subtitle: Sidecar proxies (Envoy) handling mTLS, retries, traffic shaping, and observability.
difficulty: Advanced
position: 23
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Service Mesh pattern"
    url: "https://microservices.io/patterns/deployment/service-mesh.html"
    type: book
  - title: "What do you mean by Service Mesh? — Martin Fowler"
    url: "https://martinfowler.com/articles/service-mesh.html"
    type: blog
  - title: "envoyproxy/envoy"
    url: "https://github.com/envoyproxy/envoy"
    type: repo
status: published
---

## intro
A service mesh moves the cross-cutting concerns of service-to-service communication — mTLS, retries, timeouts, circuit-breaking, traffic shifting, telemetry — out of application code and into a sidecar proxy that sits next to every service. The control plane (Istio, Linkerd, Consul) pushes config; the data plane (typically Envoy) enforces it on every connection.

## whyItMatters
Without a mesh, every service team re-implements the same five resiliency patterns in five languages, gets at least one of them wrong, and ships subtle production incidents. A mesh standardizes the runtime behavior across polyglot fleets and gives platform teams a single knob for security (mTLS everywhere) and progressive delivery (canary, mirror, blue-green) without code changes.

## intuition
Picture every pod as having a tiny load-balancer-and-firewall pinned to its hip. The app talks plain HTTP to `localhost:15001`; the sidecar terminates that, applies policy (auth, retries, rate limits), opens an mTLS connection to the destination's sidecar, and forwards. Both ends authenticate via short-lived SPIFFE certs issued by the control plane. Application code never sees TLS, never retries, never emits Prometheus counters by hand — the sidecar does.

## visualization
```
        Pod A                        Pod B
   +---------------+            +---------------+
   |   app:8080    |            |   app:8080    |
   |       ^       |            |       ^       |
   |       | http  |            |       | http  |
   |       v       |            |       v       |
   |  envoy:15001  |== mTLS ==> |  envoy:15001  |
   +-------|-------+            +-------|-------+
           |                            |
           +------- control plane ------+
                  (Pilot / Istiod)
                push: routes, certs, policy
                pull: metrics, traces, logs
```

## bruteForce
Bake retries, TLS, timeouts, and metrics into every microservice using language-specific libraries (Hystrix, Resilience4j, polly). Each repo configures them differently; a Go service's retry budget and a Node service's circuit-breaker threshold drift apart over quarters; an SRE has no global view; rotating a CA cert requires a coordinated rebuild of every image. Works for small fleets, collapses at 50+ services.

## optimal
Deploy a sidecar mesh:
```
control plane:
  - issue short-lived workload certs (SPIFFE IDs) to every sidecar
  - distribute routing tables + policy via xDS (LDS / RDS / CDS / EDS)
  - aggregate telemetry into Prometheus + Jaeger
data plane (per pod):
  - intercept inbound + outbound traffic via iptables
  - terminate mTLS, apply L7 policy (JWT auth, rate-limit, retry budget)
  - emit metrics (request_total, request_duration_seconds, upstream_rq_retry)
  - hot-reload config without dropping connections
```
Pick traffic-shifting at the route level: `canary: 5%`, `mirror: 100% to v2 shadow`. Combine with timeout = p99.9 + jitter, max-retries = 2, retry-on = 5xx,gateway-error,connect-failure. Set per-service circuit-breaker on consecutive 5xx.

## complexity
time: adds ~1 ms p50 / ~3 ms p99 hop per request (two extra TCP/TLS terminations per RPC)
space: ~50–150 MB resident per sidecar; one sidecar per pod
notes: CPU cost rises with TLS handshake rate; offload to session resumption + h2 connection pools.

## pitfalls
- Treating retries as free — a 3-retry policy at every hop multiplicatively amplifies load during partial failures (retry storms). Use a global retry budget.
- Forgetting that timeouts must shrink as requests fan in — child timeout > parent timeout invites cascading hangs.
- mTLS on, mTLS-permissive off, by mistake — leaves plaintext fallback enabled and undetected by audits.
- Ignoring sidecar tail-latency — a slow xDS push can blackhole new endpoints for seconds.
- Adding a mesh to fix bad service boundaries — the mesh hides architectural problems behind retries; fix the design first.

## interviewTips
- Name the layers cleanly: control plane (config), data plane (sidecars).
- Be specific about Envoy's xDS APIs: LDS for listeners, RDS for routes, CDS for clusters, EDS for endpoints.
- Compare to API-gateway-only architectures: mesh handles east-west, gateway handles north-south.
- Mention the alternatives honestly: gRPC built-in retry/load-balancing, eBPF-based meshes (Cilium) that skip the userspace proxy.

## code.python
```python
import httpx

async def call_billing(order_id: str) -> dict:
    async with httpx.AsyncClient(base_url="http://localhost:15001") as client:
        response = await client.get(
            f"/billing/charge/{order_id}",
            headers={"x-request-id": new_request_id()},
            timeout=2.0,
        )
        response.raise_for_status()
        return response.json()
```

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: billing }
spec:
  hosts: [billing]
  http:
    - route:
        - destination: { host: billing, subset: v1 }
          weight: 95
        - destination: { host: billing, subset: v2 }
          weight: 5
      timeout: 2s
      retries: { attempts: 2, perTryTimeout: 500ms, retryOn: 5xx,connect-failure }
```

## code.javascript
```javascript
import fetch from 'node-fetch';

export async function callBilling(orderId) {
  const res = await fetch(`http://localhost:15001/billing/charge/${orderId}`, {
    headers: { 'x-request-id': newRequestId() },
    timeout: 2000,
  });
  if (!res.ok) throw new Error(`billing ${res.status}`);
  return res.json();
}
```

## code.java
```java
HttpRequest req = HttpRequest.newBuilder()
    .uri(URI.create("http://localhost:15001/billing/charge/" + orderId))
    .timeout(Duration.ofSeconds(2))
    .header("x-request-id", newRequestId())
    .GET()
    .build();

HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
if (res.statusCode() >= 400) throw new IOException("billing " + res.statusCode());
return parse(res.body());
```

## code.cpp
```cpp
#include <cpr/cpr.h>

cpr::Response callBilling(const std::string& orderId) {
    auto res = cpr::Get(
        cpr::Url{"http://localhost:15001/billing/charge/" + orderId},
        cpr::Header{{"x-request-id", newRequestId()}},
        cpr::Timeout{2000}
    );
    if (res.status_code >= 400) throw std::runtime_error("billing failed");
    return res;
}
```
