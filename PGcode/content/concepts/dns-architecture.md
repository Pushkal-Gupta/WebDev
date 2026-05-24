---
slug: dns-architecture
module: system-design
title: DNS Architecture
subtitle: Hierarchical name → IP lookup — root servers → TLD → authoritative → resolver caches. Sub-50ms with caching, every web request depends on it.
difficulty: Intermediate
position: 33
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "RFC 1034 + 1035 — DNS protocol specifications"
    url: "https://datatracker.ietf.org/doc/html/rfc1035"
    type: book
  - title: "Cloudflare Learning — How DNS works"
    url: "https://www.cloudflare.com/learning/dns/what-is-dns/"
    type: blog
  - title: "miekg/dns — Go DNS library used by CoreDNS / Caddy"
    url: "https://github.com/miekg/dns"
    type: repo
status: published
---

## intro
**DNS** (Domain Name System) is the distributed phone book of the internet — translates human-readable names (`api.stripe.com`) into IP addresses (`52.31.107.4`). Each lookup traverses a hierarchy: **root servers** → **TLD servers** (.com, .io) → **authoritative servers** for the domain → returns A/AAAA/CNAME records. Aggressive caching at every layer keeps p50 latency under 50ms for hot names.

## whyItMatters
Every HTTP request, every email, every API call begins with a DNS lookup. DNS failures look like the internet is broken:
- **Slow DNS** = slow page load (visible to users).
- **DNS misconfig** = traffic black-holed (the 2021 Facebook outage).
- **DNS-based load balancing** (Route 53 latency routing, GeoDNS) is how CDNs route users to nearby edges.

Understanding DNS unlocks: zero-downtime deployments (TTL planning), multi-region failover, custom domains for SaaS, mTLS naming, ACME cert provisioning.

## intuition
- **Recursive resolver** (your ISP / 1.1.1.1 / 8.8.8.8): the client-facing DNS server that does the whole walk on your behalf.
- **Root servers** (13 logical, ~1000 anycast instances): know which servers run each TLD.
- **TLD servers**: know which authoritative nameservers run each domain.
- **Authoritative servers** (Route 53, NS1, your own bind): return the actual records.

Every layer caches by **TTL**. A typical resolution:
1. Browser cache miss → OS cache miss → resolver cache check.
2. Resolver caches miss → query root → "ask .com servers."
3. Resolver queries .com → "ask `ns1.stripe.com`."
4. Resolver queries `ns1.stripe.com` → returns A record for `api.stripe.com`.
5. Resolver caches the answer for TTL seconds. Subsequent queries: 0 network calls.

## visualization
```
Browser asks: api.stripe.com?

┌──────────┐   ┌──────────┐
│ Browser  │ → │ OS cache │ ──── miss ────┐
└──────────┘   └──────────┘                ▼
                                    ┌──────────────┐
                                    │ Recursive    │ ── cache miss ──┐
                                    │ Resolver     │                 ▼
                                    │ (1.1.1.1)    │           ┌──────────┐
                                    └──────────────┘           │ Root NS  │
                                                                └────┬─────┘
                                                  "ask .com NS" ◄────┘
                                                ┌──────────┐
                                                │ .com NS  │
                                                └────┬─────┘
                                "ask ns1.stripe.com" ◄┘
                                                ┌────────────────┐
                                                │ ns1.stripe.com │
                                                └────┬───────────┘
                                          A record ◄─┘
                                                │
                                                ▼
                                       Resolver caches + returns to Browser
                                       Cached for `TTL` seconds (e.g. 300s)
```

## bruteForce
**Static `/etc/hosts`**: manual, doesn't scale beyond a single machine.

**Single central DNS**: 1 server for the whole internet → single point of failure + unscalable.

The hierarchical + cached design is what makes DNS scale to 10^10 lookups/day.

## optimal
**TTL strategy**:
- Long TTL (24h): cheap on resolvers, slow to propagate changes.
- Short TTL (30s): fast propagation for blue-green deploys but more resolver traffic.
- Pattern: low TTL during deploys, raise after stabilizing.

**Record types**:
- **A** — IPv4 address.
- **AAAA** — IPv6.
- **CNAME** — alias to another name (e.g. `www.example.com → example.com`).
- **MX** — mail server.
- **TXT** — arbitrary text (SPF, DKIM, ACME challenge).
- **NS** — delegate a subdomain to other authoritative servers.
- **SOA** — start-of-authority + TTL defaults.

**DNS-based load balancing**:
- Round-robin: return multiple A records; client picks.
- Latency-based (Route 53): return the IP of the nearest healthy backend.
- Health checks: remove dead backends from responses.

**ACME for free certs**: Let's Encrypt uses DNS-01 challenge — TXT record proves you control the domain.

**Modern improvements**: DoH (DNS over HTTPS), DoT (DNS over TLS) — encrypt the resolver query. EDNS Client Subnet for GeoDNS accuracy.

## complexity
- **Cold lookup**: 4 round-trips (root → TLD → auth → resolver → client). ~50-200ms.
- **Cached lookup**: 0 network. <1ms (OS cache).
- **TTL propagation**: changes take up to TTL seconds to be seen worldwide.
- **Anycast routing**: requests to 8.8.8.8 hit the nearest physical server automatically.

## pitfalls
- **TTL too long during incidents**: can't fail over quickly. Plan migration with lowered TTLs.
- **CNAME at apex (`example.com`)**: forbidden by RFC. Use ALIAS / ANAME (Route 53, Cloudflare extension) or A records.
- **DNS rebinding attacks**: malicious DNS returns first an internal IP after the initial check. Pin DNS results in security-sensitive code.
- **Race between cert provisioning + DNS propagation**: ACME DNS-01 needs the TXT record visible to the validator. Wait + verify before requesting cert.
- **Negative caching** (NXDOMAIN): "this name doesn't exist" is cached too. A misconfigured record can take ages to "appear."

## interviewTips
- For "design a global service with regional routing" — DNS-based latency routing (Route 53) + GeoDNS + health checks.
- For "design zero-downtime deployment" — TTL planning + blue-green at DNS level.
- For senior: discuss **anycast vs unicast** for the resolver fleet, **DoH/DoT for privacy**, **DNS rebinding mitigations**.

## code.python
```python
# Resolve a name with dnspython
import dns.resolver
answer = dns.resolver.resolve('api.stripe.com', 'A')
for rdata in answer:
    print(rdata.to_text(), 'TTL =', answer.rrset.ttl)
```

## code.javascript
```javascript
// Node — dns/promises (uses OS resolver)
const dns = require('dns/promises');
const records = await dns.resolve4('api.stripe.com');
console.log(records);
```

## code.java
```java
// JDK built-in
InetAddress[] addrs = InetAddress.getAllByName("api.stripe.com");
for (InetAddress a : addrs) System.out.println(a.getHostAddress());
```

## code.cpp
```cpp
// getaddrinfo via <netdb.h>
#include <netdb.h>
#include <arpa/inet.h>
struct addrinfo hints = {}, *res;
hints.ai_family = AF_INET;
getaddrinfo("api.stripe.com", nullptr, &hints, &res);
char buf[INET_ADDRSTRLEN];
inet_ntop(AF_INET, &((sockaddr_in*)res->ai_addr)->sin_addr, buf, sizeof(buf));
printf("%s\n", buf);
freeaddrinfo(res);
```
