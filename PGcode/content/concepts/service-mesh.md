---
slug: service-mesh
module: sd-microservices
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
- **Istio** (Google, IBM, Lyft) and **Linkerd** (Buoyant, CNCF graduate) are the dominant service-mesh platforms; **Consul Connect (HashiCorp)**, **AWS App Mesh**, and **Cilium Service Mesh (eBPF-based)** are the major alternatives.
- **Envoy** (Lyft, 2016) is the de facto data-plane proxy — used by Istio, AWS App Mesh, gRPC's xDS support, and as a standalone L7 load balancer at Lyft, Reddit, Pinterest, Spotify.
- **The xDS API** (LDS/RDS/CDS/EDS — Listener/Route/Cluster/Endpoint Discovery Service) is the cross-vendor standard for control-plane to data-plane communication; gRPC clients now speak xDS directly without a sidecar.
- **SPIFFE/SPIRE** (the workload-identity standard backing mesh mTLS) and **William Morgan's "What's a service mesh?" blog series** are the canonical references; every senior microservices interview probes "why a mesh vs an API gateway" understanding.

## intuition
The mesh exists because **cross-cutting service-to-service concerns** — mTLS, retries, timeouts, circuit-breaking, traffic shifting, distributed tracing, telemetry — were being re-implemented in every microservice, in every language, by every team. Each repo configures retry budgets and circuit-breaker thresholds differently; a Go service and a Node service drift apart over quarters; SREs lose any global view; rotating a CA certificate requires a coordinated rebuild of every container image. Hystrix (Netflix, Java), Resilience4j (JVM), Polly (.NET), `go-resilience`, `tenacity` (Python) all exist for the same reason — and all live in application code.

A service mesh moves all of that **out of application code and into a sidecar proxy** that runs next to every service. The application talks plain HTTP to `localhost:15001`; the sidecar (typically **Envoy**) intercepts the call, applies policy (JWT auth, rate limits, retries with budget), opens an **mTLS** connection to the destination's sidecar, and forwards. Both ends authenticate via short-lived **SPIFFE certs** issued by the control plane. Application code never sees TLS, never retries, never emits Prometheus counters by hand — the sidecar does, uniformly across the entire fleet.

The architecture splits cleanly into **control plane** (Istiod, Linkerd Destination, Consul) and **data plane** (Envoy sidecars). The control plane pushes config via the **xDS API** family — Listener Discovery Service (LDS), Route Discovery Service (RDS), Cluster Discovery Service (CDS), Endpoint Discovery Service (EDS) — and aggregates telemetry (metrics, traces, logs) pulled from every sidecar. The data plane enforces the config on every connection, hot-reloading without dropping live traffic.

The mental model: every pod has a tiny load-balancer-and-firewall pinned to its hip. Cross-cutting policy lives in one place per pod (the sidecar) and is configured centrally (the control plane), so security postures (mTLS everywhere), progressive delivery (canary, mirror, blue-green), and resilience policies (timeout = p99.9 + jitter, max-retries = 2, retry-on = 5xx) become global knobs the platform team can flip without code changes.

The trade-off: every request now traverses two extra TCP/TLS terminations (one per sidecar), adding ~1 ms p50 / ~3 ms p99 per hop. For latency-critical workloads at scale, eBPF-based meshes (Cilium) bypass the userspace proxy by enforcing policy in the Linux kernel, recovering most of the overhead.

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

```yaml
# Istio VirtualService: canary traffic split with retries and timeouts.
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: billing }
spec:
  hosts: [billing]
  http:
    - route:
        - destination: { host: billing, subset: v1 }
          weight: 95                              # 95% to stable
        - destination: { host: billing, subset: v2 }
          weight: 5                               # 5% canary
      timeout: 2s
      retries:
        attempts: 2
        perTryTimeout: 500ms
        retryOn: 5xx,reset,connect-failure,refused-stream
```

Why this architecture is right: the **control plane / data plane split** matches the natural separation between policy (rarely changes, lives in Git, code-reviewed) and enforcement (every request, must be fast). Envoy as the data plane is a battle-tested L7 proxy with first-class HTTP/2, gRPC, mTLS, and observability support; the xDS API family (LDS/RDS/CDS/EDS) is the industry-standard control plane protocol that gRPC clients can now speak directly. SPIFFE/SPIRE for workload identity replaces fragile shared secrets with short-lived (1-hour TTL) certificates rotated automatically.

**Production disciplines that matter**:
- **Retries are not free**: a 3-retry policy at every hop multiplicatively amplifies load during partial failures, causing **retry storms**. Use a **global retry budget** (Envoy supports `retry_budget` percentage) and exponential backoff with jitter.
- **Timeouts must shrink as requests fan in**: child timeout > parent timeout invites cascading hangs. Set timeouts top-down: edge=10s, mid-tier=3s, leaf=1s.
- **mTLS strict, not permissive**: Istio's `PeerAuthentication` defaults to `PERMISSIVE` (allows both mTLS and plaintext); always set `mode: STRICT` in production. Permissive leaves plaintext fallback enabled and undetected by audits.
- **Sidecar tail latency**: a slow xDS push can blackhole new endpoints for seconds. Monitor sidecar config propagation lag as an SLI.
- **Circuit breakers per upstream**: Envoy's `outlier_detection` ejects unhealthy backends from the load balancer pool; consecutive 5xx for N seconds = eject for M seconds.

**When NOT to use a mesh**:
- **Adding a mesh to fix bad service boundaries** — the mesh hides architectural problems behind retries; fix the design first.
- **Low service count (<10)** — operational complexity of running Istio outweighs the benefits; gRPC built-in retries plus a simpler service discovery suffice.
- **Latency-critical paths** — the 1-3 ms sidecar overhead matters; use eBPF-based meshes (**Cilium**) that enforce policy in the kernel and bypass userspace proxies.

**Alternatives and the future**:
- **gRPC xDS support**: gRPC clients can now talk to Istio's control plane directly without a sidecar, getting most of the mesh benefits with zero proxy overhead. Used at Google internally; becoming the default for gRPC-heavy fleets.
- **Cilium Service Mesh** (CNCF): eBPF-based, runs policy enforcement in the Linux kernel; ~10x lower latency than Envoy-based meshes.
- **Linkerd**: lighter than Istio (Rust-based `linkerd2-proxy` instead of C++ Envoy), simpler ops, smaller feature surface; good fit for teams that want a mesh without Istio's complexity.
- **API-gateway-only architecture** (no mesh): suitable for north-south traffic (client-to-edge) without east-west complexity; pair with gRPC retries for internal calls.

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
