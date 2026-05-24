---
slug: ip-vs-domain-routing
module: cs-core
title: IP vs Domain Routing
subtitle: Anycast IP routing routes packets at the network layer; DNS-based routing decides at name-resolution time. When to pick which and why most large platforms use both.
difficulty: Intermediate
position: 61
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "highscalability.com — Anycast vs GSLB"
    url: "http://highscalability.com/"
    type: blog
  - title: "GeeksforGeeks — Anycast Addressing"
    url: "https://www.geeksforgeeks.org/what-is-anycast/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
There are two ways to send a user to the *nearest* of N datacenters. The first is *anycast IP routing*: announce the same IP prefix from every datacenter via BGP, and the internet's existing routing protocol carries the user's packet to whichever location is fewest hops away. The second is *DNS-based routing* (also called GSLB — Global Server Load Balancing): publish different A records for the same hostname based on the resolver's location, so each user resolves the name to a region-specific unicast IP. Both achieve "send the user to the nearest pop," differently.

## whyItMatters
This is the foundational choice for every global service — CDNs, DNS providers, public APIs. Cloudflare, Google DNS (8.8.8.8), and AWS's `1.1.1.1` use anycast. AWS Route 53 latency routing, Akamai, and most legacy CDNs use DNS. Each has a different failure mode, a different latency profile, and a different cost. Senior infra interviews ask "how would you route a global request" expecting you to compare them, not pick one blindly.

## intuition
- **Anycast** = "the network picks for me." You announce `192.0.2.0/24` from 50 datacenters; BGP convergence delivers each user's packet to the closest one (by AS-path, not necessarily geographic distance). Stateless protocols (DNS, HTTP/3 over UDP) love this.
- **DNS-based** = "I pick at name lookup time." When `api.example.com` is resolved, the authoritative DNS server looks at the resolver's IP (or EDNS-Client-Subnet) and returns the nearest region's unicast IP. The connection then goes directly to that region.

The big difference: anycast routing can *change mid-connection* if BGP reconverges, which is catastrophic for TCP (the new endpoint has no idea about your session). DNS routing pins you for the TTL of the record, which is great for TCP but terrible for failover (clients keep hitting a dead region until TTL expires).

## visualization
```
Anycast:
  User in Tokyo -> packet for 1.1.1.1 -> Tokyo PoP (10 ms)
  User in Berlin -> packet for 1.1.1.1 -> Frankfurt PoP (5 ms)
  Same IP, same TCP port. BGP picks the path.

  Risk: mid-flow BGP reconvergence flips Tokyo -> Hong Kong; TCP resets.

DNS-based (GSLB):
  User in Tokyo:   dig api.example.com -> 35.1.2.3 (ap-northeast-1)
  User in Berlin:  dig api.example.com -> 18.4.5.6 (eu-central-1)
  Different IPs, direct unicast.

  Risk: region failure -> all DNS clients cached old IP until TTL (60s).
        EDNS-Client-Subnet missing -> resolver location != user location.
```

## bruteForce
"Just put one datacenter in us-east-1 and let the rest of the world deal with the latency." For a small product this is fine. Past about 100 ms p95 from your largest user pool, conversion drops measurably (Amazon's classic "100 ms = 1% revenue" stat). A single region also has no failover — one AWS regional outage equals total downtime.

## optimal
- **Use anycast for**: stateless protocols (DNS, NTP, QUIC), DDoS absorption (BGP naturally distributes the attack across PoPs), and CDN edge IPs.
- **Use DNS-based for**: stateful TCP services (databases, websockets, long-lived gRPC), region-pinned data (GDPR locality), and weighted traffic shifting (blue/green, canary).
- Most large platforms use *both* layered: DNS routes to a regional anycast prefix; anycast routes to a specific edge within the region.
- Keep DNS TTLs short (30-60s) for the latency-routing record so failover finishes inside a minute.
- Use BGP communities to drain traffic from a region without yanking the prefix (graceful failover).

## complexity
time: Anycast adds zero latency over plain unicast — packets take the BGP-shortest path natively. DNS-routing adds one DNS lookup (cached at the resolver after first hit).
space: Anycast: O(1) IP record globally. DNS: O(regions) A records plus latency-table state on the DNS provider.
notes: BGP convergence on prefix changes is 30 seconds to a few minutes globally — anycast failover is fast for *receiver* changes but slow for *announcement* changes. DNS failover speed is bounded by TTL plus resolver caching behavior.

## pitfalls
- Using anycast for TCP without ECMP stickiness — mid-flow path flips drop the connection.
- TTL set to a day "to reduce DNS load" — region failure leaves users in the dead PoP for 24 hours.
- Forgetting EDNS-Client-Subnet — central resolvers (8.8.8.8) without ECS make every Google user look like they are in Mountain View. Both your auth DNS and the resolver must support ECS.
- Anycast IPs lighting up in only some PoPs — you announce the prefix but firewall rules block port 443 at one site; users in that region see 100% failure.
- BGP route leak — your /24 gets accidentally re-advertised by a customer AS, sucking traffic into a wrong PoP.
- DNS-based load balancer with one region way oversubscribed because your weight math forgot that resolvers cache differently than users.

## interviewTips
- One-line summary: "Anycast is fast for stateless; DNS routing is safe for stateful."
- Name real users: Cloudflare 1.1.1.1 = anycast. AWS Route 53 latency routing = DNS-based.
- Mention DDoS absorption as a non-obvious anycast win.
- Know TTL is the failover floor for DNS; BGP convergence is the floor for anycast.
- For "design a global edge": anycast IPs land at the nearest PoP, DNS pins the user to a region for backend stateful calls.

## code.python
```python
# Resolve a hostname and print each resolver's view — useful when debugging GSLB.
import dns.resolver

for ns in ["8.8.8.8", "1.1.1.1", "9.9.9.9"]:
    r = dns.resolver.Resolver(); r.nameservers = [ns]
    ans = r.resolve("api.example.com", "A")
    print(ns, "->", [str(a) for a in ans])

# Anycast test: traceroute from N vantage points to the same anycast IP returns N different paths.
# Hand-roll with scapy or use a service like RIPE Atlas / Looking Glass.
```

## code.javascript
```javascript
// Node: see what your local resolver returns vs forcing a different one.
import { Resolver } from "node:dns/promises";

async function compare(hostname) {
  for (const ns of ["8.8.8.8", "1.1.1.1", "9.9.9.9"]) {
    const r = new Resolver();
    r.setServers([ns]);
    const addrs = await r.resolve4(hostname);
    console.log(ns, "->", addrs);
  }
}
compare("api.example.com");
```

## code.java
```java
import javax.naming.directory.*;
import java.util.Hashtable;

void compare(String host) throws Exception {
    for (String ns : new String[]{"8.8.8.8", "1.1.1.1", "9.9.9.9"}) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("java.naming.provider.url", "dns://" + ns);
        DirContext ctx = new InitialDirContext(env);
        Attributes a = ctx.getAttributes(host, new String[]{"A"});
        System.out.println(ns + " -> " + a.get("A"));
    }
}
```

## code.cpp
```cpp
// POSIX getaddrinfo uses the system resolver; for per-resolver queries use libresolv or libldns.
#include <ldns/ldns.h>
#include <iostream>

void resolve_with(const char* ns, const char* host) {
    ldns_resolver* r;
    ldns_resolver_new_frm_file(&r, nullptr);
    ldns_rdf* nsaddr = ldns_rdf_new_frm_str(LDNS_RDF_TYPE_A, ns);
    ldns_resolver_push_nameserver(r, nsaddr);
    ldns_rdf* dn = ldns_dname_new_frm_str(host);
    ldns_pkt* pkt = ldns_resolver_query(r, dn, LDNS_RR_TYPE_A,
                                        LDNS_RR_CLASS_IN, LDNS_RD);
    ldns_rr_list* answers = ldns_pkt_rr_list_by_type(pkt, LDNS_RR_TYPE_A, LDNS_SECTION_ANSWER);
    char* s = ldns_rr_list2str(answers);
    std::cout << ns << " -> " << s << "\n";
    free(s); ldns_pkt_free(pkt); ldns_resolver_deep_free(r);
}
```
