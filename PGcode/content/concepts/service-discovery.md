---
slug: service-discovery
module: system-design
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
In a monolith, "service A calls service B" is a function call — no addressing required. In microservices, B has dozens of replicas across hosts, pods, or regions, and the set changes every few seconds. Without discovery you fall back to static host lists or DNS with multi-minute TTLs, neither of which can keep up with autoscaling or zone failures. A correct discovery story is what makes a deploy a non-event instead of an outage.

## intuition
Think of a hotel. Client-side discovery is asking the concierge for room 412's number and then walking there yourself — fast once you have the number, but you carry the lookup logic in every guest. Server-side discovery is calling the front desk and saying "connect me to whoever handles billing"; the desk dispatches you. The former is faster and language-agnostic in spirit but couples every client to the registry protocol; the latter centralizes intelligence at the cost of an extra network hop.

## visualization
Eureka cluster holds a map: `payments → [10.0.1.4:8080, 10.0.1.7:8080, 10.0.2.3:8080]`. Each payment instance heartbeats every 30s. A `checkout` pod fetches the list, caches it for 30s, and picks an instance with a round-robin or zone-aware policy. Contrast with an AWS ALB: `checkout` resolves `payments.internal` once, ALB owns the routing table, returns 503 on no healthy targets.

## bruteForce
Hardcode an array of hostnames in config and redeploy when it changes. Or rely on DNS with a 60-second TTL and hope no instance dies mid-window. Both work in a five-instance hobby app and fall over the moment autoscaling, blue/green, or zone failover enter the picture. DNS caching at the JVM or libc layer makes this worse — old IPs can be cached for hours.

## optimal
Pick the model that matches your platform. Kubernetes gives you server-side discovery for free via `Service` + kube-proxy: clients hit a virtual IP, kube-proxy steers to a healthy pod. Outside Kubernetes, Consul or Eureka with a sidecar (or smart client) gives client-side discovery with sub-second propagation, zone affinity, and weighted routing. In both cases, health-check semantics and registration TTLs matter more than the lookup protocol — a "discovered" but dead instance is worse than a missing one.

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
