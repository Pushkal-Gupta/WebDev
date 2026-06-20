---
slug: service-discovery
module: sd-microservices
title: Service Discovery
subtitle: How clients find ever-shifting service instances — client-side registries vs server-side load balancers.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Microservices.io — Service Discovery patterns"
    url: "https://microservices.io/patterns/service-registry.html"
    type: book
  - title: "Martin Fowler — Microservices"
    url: "https://martinfowler.com/articles/microservices.html"
    type: blog
  - title: "donnemartin/system-design-primer — Service discovery"
    url: "https://github.com/donnemartin/system-design-primer#service-discovery"
    type: repo
status: published
---

## intro
Service discovery is the mechanism a caller uses to find the network location (IP, port) of a service whose instances come and go because of autoscaling, failures, and rolling deploys. Two dominant flavors exist: client-side discovery (the client queries a registry like Eureka and picks an instance itself) and server-side discovery (the client hits a stable load balancer endpoint that owns the lookup). The choice ripples through resilience, latency, and operational complexity.

## whyItMatters
- **Netflix Eureka** (the canonical client-side registry from the Netflix OSS suite) and **HashiCorp Consul** (with its built-in DNS and HTTP APIs) defined the modern service-discovery landscape.
- **Kubernetes Services + kube-proxy + CoreDNS** give server-side discovery for free in every k8s cluster; **Istio + Envoy xDS** layer L7 discovery with traffic splitting on top.
- **AWS Cloud Map**, **Azure Service Discovery**, **GCP Service Directory** are managed cloud equivalents; **etcd, ZooKeeper, ZeroConf/mDNS, DNS SRV records** are the lower-level primitives different ecosystems build on.
- **The "Service Discovery" chapter in Sam Newman's *Building Microservices*** and **Chris Richardson's microservices.io patterns** define the trade-offs; every microservices interview at FAANG-tier companies probes "client-side vs server-side" understanding.

## intuition
In a monolith, "service A calls service B" is a function call — no addressing required. In microservices, service B has dozens of replicas across hosts, pods, or regions, and the set changes every few seconds because of autoscaling, rolling deploys, and zone failures. Without a discovery mechanism, callers fall back to static host lists in config (requires redeploy on every topology change) or DNS with multi-minute TTLs (cannot keep up with autoscaling, and OS/JVM caches commonly ignore TTLs altogether). A correct discovery story is what makes a deploy a non-event instead of an outage.

Two dominant architectural flavors exist:

**Client-side discovery**: the caller queries a registry (Eureka, Consul, etcd) for the current list of healthy instances of a service, caches the list, and picks one itself (round-robin, random, weighted, zone-aware). The lookup is in-process — sub-millisecond after the first call. The caller carries discovery, load-balancing, and circuit-breaking logic; this is "fat client." Netflix popularized this with Ribbon + Eureka; gRPC's built-in load balancing follows the same model.

**Server-side discovery**: the caller hits a stable load balancer endpoint (AWS ALB, Kubernetes ClusterIP, Envoy, HAProxy) that owns the discovery itself; the LB queries the registry, selects an instance, and forwards. The caller knows only one URL; the LB is the "smart" middlebox. Kubernetes' default model: clients hit `payments.default.svc.cluster.local`, kube-proxy + iptables/IPVS steers to a healthy pod. Adds one network hop but centralizes policy.

The hotel analogy: client-side discovery is **asking the concierge for room 412's number and then walking there yourself** — fast once you have the number, but every guest carries the lookup logic. Server-side discovery is **calling the front desk and saying "connect me to whoever handles billing"**; the desk dispatches you. The former is faster (no extra hop) and language-flexible in spirit but couples every client to the registry protocol; the latter centralizes intelligence at the cost of an extra hop and a tier-zero LB dependency.

Modern service meshes (**Istio, Linkerd, Consul Connect, AWS App Mesh**) hybrid: each service has a **sidecar proxy** (Envoy) that intercepts every outbound call, consults the control plane's xDS API for the latest topology, and load-balances locally. The application code thinks it is doing server-side discovery (one URL), but the actual lookup happens client-side in the sidecar. Best of both worlds: zero application changes, sub-second propagation, rich policy.

## visualization
Eureka cluster holds a map: `payments → [10.0.1.4:8080, 10.0.1.7:8080, 10.0.2.3:8080]`. Each payment instance heartbeats every 30s. A `checkout` pod fetches the list, caches it for 30s, and picks an instance with a round-robin or zone-aware policy. Contrast with an AWS ALB: `checkout` resolves `payments.internal` once, ALB owns the routing table, returns 503 on no healthy targets.

## bruteForce
Hardcode an array of hostnames in config and redeploy when it changes. Or rely on DNS with a 60-second TTL and hope no instance dies mid-window. Both work in a five-instance hobby app and fall over the moment autoscaling, blue/green, or zone failover enter the picture. DNS caching at the JVM or libc layer makes this worse — old IPs can be cached for hours.

## optimal
The right architecture is **platform-matched: Kubernetes gives server-side discovery for free, service meshes give the sidecar-hybrid model, and stand-alone Consul / Eureka serve everything else**. In all cases, **health-check semantics and registration TTLs matter more than the lookup protocol** — a "discovered" but dead instance is worse than a missing one.

```python
# Stand-alone Eureka-style client-side discovery with health-check filtering.
import random, time, requests
from typing import List

class EurekaClient:
    def __init__(self, registry_url: str, service: str, ttl_seconds: int = 30):
        self.registry_url = registry_url
        self.service = service
        self.ttl = ttl_seconds
        self.cache: List[str] = []
        self.fetched_at = 0.0
        self.last_known_good: List[str] = []     # fall back if registry is down

    def _refresh(self) -> None:
        try:
            r = requests.get(f"{self.registry_url}/apps/{self.service}", timeout=2.0)
            r.raise_for_status()
            self.cache = [
                f"{i['ipAddr']}:{i['port']}"
                for i in r.json().get("instances", [])
                if i.get("status") == "UP"        # health-check filter
            ]
            if self.cache:                         # only update LKG on success
                self.last_known_good = self.cache
            self.fetched_at = time.time()
        except Exception:
            # Registry outage -> serve from last-known-good instead of failing.
            self.cache = self.last_known_good

    def instances(self) -> List[str]:
        if time.time() - self.fetched_at > self.ttl:
            self._refresh()
        return self.cache

    def call(self, path: str):
        ins = self.instances()
        if not ins:
            raise RuntimeError("no healthy instance")
        # Random selection is simplest; round-robin needs shared state.
        # For zone affinity, filter `ins` by zone first.
        host = random.choice(ins)
        return requests.get(f"http://{host}{path}", timeout=1.0)
```

Why this is right: it implements the three production disciplines that separate a working registry from a broken one. **Health filtering at refresh time** — only `UP` instances enter the cache, so calls cannot hit pods that the registry already marked dead. **Last-known-good fallback** — when the registry itself is unreachable, the client serves from the previous cache rather than failing every request; this is what saves you when Eureka has a hiccup. **TTL'd cache** keeps lookups in-process and sub-millisecond after the first fetch.

**Platform-specific best fits**:
- **Kubernetes**: native `Service` + `kube-proxy` + `CoreDNS` give server-side discovery for free. Clients hit `myservice.namespace.svc.cluster.local`, kube-proxy steers to a healthy pod via iptables/IPVS/eBPF. Readiness probes drive registration. For richer policy (zone affinity, traffic splitting, mTLS), add Istio/Linkerd.
- **HashiCorp Consul**: stand-alone registry with DNS, HTTP, and gRPC APIs; ships with Connect (mTLS), KV, and ACL. Works in and outside k8s.
- **Netflix Eureka**: AP-leaning registry built for AWS auto-scaling; classic Spring Cloud stack.
- **AWS Cloud Map / Azure Service Discovery / GCP Service Directory**: managed alternatives that integrate with cloud LBs and IAM.
- **gRPC's xDS client**: gRPC clients can speak Envoy's xDS API directly, getting sidecar-style discovery without a sidecar.

**Production disciplines that matter** (often overlooked):
- **Registration TTL + heartbeat interval**: typical Eureka default is 30s heartbeat, 90s eviction — meaning a dead pod stays in the registry for up to 90 seconds. Aggressive: 5s heartbeat, 15s eviction. Trade propagation latency against registry load.
- **Health probe truth**: a pod that responds to TCP but cannot serve real traffic (DB connection dead, JVM in long GC) must be marked unhealthy. Implement a real `/healthz` endpoint that touches downstream dependencies, not just `return 200`.
- **Graceful shutdown**: on `SIGTERM`, deregister from the registry first, wait for propagation (30+ seconds), then stop accepting connections. Without this, in-flight requests fail during deploy.
- **Zone awareness**: prefer same-AZ instances when possible (Eureka, Envoy, Istio all support this) — cuts latency and cross-AZ traffic charges.
- **Registry in the data path?** No. Cache results; the registry should never be synchronously consulted per request. Sub-second refresh via push (Eureka push, Consul blocking queries, etcd watch) is the right pattern.

## complexity
time: O(1) per lookup once cached
space: O(n) registry rows for n instances
notes: The cost is not Big-O; it is propagation delay (how long after a pod dies before all clients stop calling it) and lookup-path latency (extra hop for server-side vs in-process for client-side). Eureka defaults give ~90s removal under churn — usually acceptable, sometimes catastrophic.

## pitfalls
- Trusting DNS TTL for fast failover; OS and JVM caches commonly ignore it.
- Forgetting that a registered instance can be unhealthy — pair registration with a real readiness probe.
- Letting client-side discovery hide a registry outage: clients keep using the stale cache for hours.
- Mixing discovery models in one service mesh, so half the traffic bypasses the load balancer.
- Putting the registry in the data path; if every request asks "where is X" synchronously, the registry becomes the bottleneck.

## interviewTips
- Volunteer the trade-off: client-side = lower latency, fatter clients; server-side = simpler clients, one more hop, single point of policy.
- Mention concrete tech: Eureka, Consul, etcd, ZooKeeper, Kubernetes Services, AWS Cloud Map, Envoy xDS.
- Tie discovery to health checks and circuit breakers — they are one story, not three.
- If asked to design "service mesh," lead with sidecar (Envoy) + xDS control plane (Istio, Linkerd) doing discovery for you.

## code.python
```python
import random, time, requests

class EurekaClient:
    def __init__(self, registry_url, service, ttl=30):
        self.registry_url = registry_url
        self.service = service
        self.ttl = ttl
        self.cache = []
        self.fetched_at = 0

    def instances(self):
        if time.time() - self.fetched_at > self.ttl:
            r = requests.get(f"{self.registry_url}/apps/{self.service}")
            self.cache = [i["ipAddr"] + ":" + str(i["port"]) for i in r.json()["instances"] if i["status"] == "UP"]
            self.fetched_at = time.time()
        return self.cache

    def call(self, path):
        ins = self.instances()
        if not ins:
            raise RuntimeError("no healthy instance")
        return requests.get(f"http://{random.choice(ins)}{path}")
```

## code.javascript
```javascript
class DiscoveryClient {
  constructor(registryUrl, service, ttlMs = 30000) {
    this.registryUrl = registryUrl;
    this.service = service;
    this.ttlMs = ttlMs;
    this.cache = [];
    this.fetchedAt = 0;
  }

  async instances() {
    if (Date.now() - this.fetchedAt > this.ttlMs) {
      const res = await fetch(`${this.registryUrl}/apps/${this.service}`);
      const json = await res.json();
      this.cache = json.instances.filter(i => i.status === 'UP').map(i => `${i.ipAddr}:${i.port}`);
      this.fetchedAt = Date.now();
    }
    return this.cache;
  }

  async call(path) {
    const list = await this.instances();
    if (!list.length) throw new Error('no healthy instance');
    const host = list[Math.floor(Math.random() * list.length)];
    return fetch(`http://${host}${path}`);
  }
}
```

## code.java
```java
public class DiscoveryClient {
    private final String registryUrl;
    private final String service;
    private final long ttlMs;
    private List<String> cache = List.of();
    private long fetchedAt = 0;

    public DiscoveryClient(String registryUrl, String service, long ttlMs) {
        this.registryUrl = registryUrl;
        this.service = service;
        this.ttlMs = ttlMs;
    }

    public synchronized List<String> instances() {
        if (System.currentTimeMillis() - fetchedAt > ttlMs) {
            cache = RegistryHttp.fetchUp(registryUrl, service);
            fetchedAt = System.currentTimeMillis();
        }
        return cache;
    }

    public HttpResponse call(String path) {
        List<String> list = instances();
        if (list.isEmpty()) throw new IllegalStateException("no healthy instance");
        String host = list.get(ThreadLocalRandom.current().nextInt(list.size()));
        return Http.get("http://" + host + path);
    }
}
```

## code.cpp
```cpp
class DiscoveryClient {
    std::string registry, service;
    long ttl_ms;
    std::vector<std::string> cache;
    long fetched_at = 0;
public:
    DiscoveryClient(std::string r, std::string s, long t) : registry(std::move(r)), service(std::move(s)), ttl_ms(t) {}

    const std::vector<std::string>& instances() {
        long now = now_ms();
        if (now - fetched_at > ttl_ms) {
            cache = registry_fetch_up(registry, service);
            fetched_at = now;
        }
        return cache;
    }

    HttpResponse call(const std::string& path) {
        const auto& list = instances();
        if (list.empty()) throw std::runtime_error("no healthy instance");
        const auto& host = list[rand() % list.size()];
        return http_get("http://" + host + path);
    }
};
```
