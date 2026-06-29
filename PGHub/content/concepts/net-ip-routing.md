---
slug: net-ip-routing
module: computer-networks
title: IP Addressing & Routing
subtitle: How a 32-bit IPv4 address splits into network and host, how CIDR prefixes group addresses, and how routers forward a packet hop by hop with longest-prefix match.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 14
prereqs: [net-osi-tcpip-layers]
relatedProblems: []
references:
  - title: "Kurose & Ross — Computer Networking companion site (Chapter 4: the network layer)"
    url: "https://gaia.cs.umass.edu/kurose_ross/index.php"
    type: book
  - title: "Cloudflare Learning Center — What is routing?"
    url: "https://www.cloudflare.com/learning/network-layer/what-is-routing/"
    type: article
  - title: "Cloudflare Learning Center — What is an IP address?"
    url: "https://www.cloudflare.com/learning/network-layer/what-is-an-ip-address/"
    type: article
  - title: "RFC 791 — Internet Protocol"
    url: "https://www.rfc-editor.org/rfc/rfc791"
    type: spec
  - title: "RFC 4632 — Classless Inter-Domain Routing (CIDR)"
    url: "https://www.rfc-editor.org/rfc/rfc4632"
    type: spec
status: published
---

## intro
Every device on an IP network carries a numeric address, and every packet carries a destination address in its header. The network layer's whole job is to take that address and answer one question at each step: which way out does this packet go? An IPv4 address is a single 32-bit number, written as four decimal bytes — a **dotted quad** like `192.168.10.7`. Routers do not store a route to every address individually; instead they group addresses into **prefixes** and forward by matching the destination against the most specific prefix they know. This lesson takes an address apart bit by bit, explains subnets and CIDR, and follows a packet as it hops from router to router.

## whyItMatters
Routing is the mechanism that makes the Internet one network instead of billions of disconnected machines. The same address-and-prefix logic decides whether your laptop can reach a server in another country, how a cloud VPC isolates one tenant from another, and why a misconfigured subnet mask quietly breaks connectivity for half an office. Reading an address as a network part plus a host part — and knowing that `/24` means "the first 24 bits are the network" — is the single most useful skill for debugging real connectivity problems: wrong gateway, overlapping subnets, an address outside its own subnet's range. The forwarding decision itself, **longest-prefix match**, is also a clean algorithmic problem that shows up in interviews and in the design of every router's data plane, so the intuition pays off in both operations and systems design.

## intuition
Think of an IP address as a postal address compressed into 32 bits. The high-order bits are like the **zip code** — they name a *network*, a neighborhood of machines that sit together. The low-order bits are like the **street and house number** — they name one specific *host* inside that neighborhood. The line that separates "zip code" from "street" is not fixed; it slides depending on how big the neighborhood is. That sliding line is the **subnet mask**.

A mask is itself a 32-bit number, but a special one: it is a run of `1`s followed by a run of `0`s. The `1`s mark the network bits, the `0`s mark the host bits. CIDR notation just counts the ones: `/24` means 24 leading ones, written `255.255.255.0`. To find which network an address belongs to, you bitwise-AND the address with the mask, which zeroes out every host bit and leaves the **network address**.

Work a concrete example. Take `192.168.10.37` with a `/24` mask. In binary the last byte `37` is `00100101`; the mask's last byte is `00000000`, so AND-ing wipes the host bits and the network address is `192.168.10.0`. Every host in that subnet shares the first 24 bits `192.168.10`, and the final byte ranges over the host part. With 8 host bits you get \(2^8 = 256\) addresses, of which two are reserved — `.0` is the network identifier and `.255` is the broadcast address — leaving \(2^{32-24} - 2 = 254\) usable host addresses. Slide the line to `/26` and the network grows to 26 bits, the subnet shrinks to \(2^{32-26} - 2 = 62\) hosts, and one `/24` now splits cleanly into four `/26` subnets. The mask is the only thing that decides how many machines share a neighborhood.

## visualization
```
Address  192.168.10.37   /26   (mask 255.255.255.192)

            byte3      byte2      byte1      byte0
  addr   11000000 . 10101000 . 00001010 . 00100101
  mask   11111111 . 11111111 . 11111111 . 11000000
  ----   --------------- network -------- | -host--
  net&   11000000 . 10101000 . 00001010 . 00000000   = 192.168.10.0
                                              ^^ host bits = 100101 (37)

Routing table (matched top-down by LONGEST prefix):
  destination prefix     next hop      interface
  10.2.0.0/16            R4            eth1
  10.2.7.0/24            R5            eth2     <- more specific
  192.168.10.0/24        local         eth0
  0.0.0.0/0  (default)   R1            eth3     <- catch-all gateway

  lookup 10.2.7.99  ->  matches /16 AND /24  ->  pick /24  ->  next hop R5
  lookup 8.8.8.8    ->  matches only 0.0.0.0/0 ->  next hop R1 (default)
```

## bruteForce
The naive way to forward is to keep one routing entry per reachable destination: a giant table mapping individual addresses (or individual `/24` networks) to a next hop. Inside a single small LAN this even works — a host can hold a route for every machine it talks to. But it does not scale. The IPv4 space has billions of addresses; a core Internet router cannot store a separate entry for each one, and it certainly cannot have a human maintain that table. A flat scheme also forces an update everywhere whenever a single host moves. The flooding alternative — forward every packet out every interface and let the right machine grab it — avoids tables entirely but melts the network under duplicate traffic and loops. Both baselines fail for the same reason: they treat addresses as unrelated atoms instead of exploiting the structure that lets nearby addresses share one route.

## optimal
The fix is **aggregation**: group contiguous addresses under a single prefix and store one route for the whole block. This is what CIDR (RFC 4632) formalized — a prefix like `10.2.0.0/16` covers \(2^{16}\) addresses with one table entry, and an ISP can advertise one route for an entire customer range instead of thousands. A router's table is therefore a set of `(prefix, next hop, interface)` rows at many different prefix lengths, and a destination can match several of them at once. The forwarding rule that resolves the overlap is **longest-prefix match**: among all prefixes that contain the destination, pick the one with the most network bits, because it is the most specific and most precise route. A `/24` entry beats a `/16` entry beats the `/0` default route. The special prefix `0.0.0.0/0` matches everything, so it acts as the **default gateway** — where a host sends any packet it has no better route for.

Once the next hop is chosen, the router does **per-hop forwarding**: it rewrites the layer-2 framing to reach that next hop, decrements the IP header's **TTL** (time-to-live) by one, and if the TTL hits zero it drops the packet and returns an ICMP "time exceeded" — the mechanism that kills routing loops and powers `traceroute`. The packet then arrives at the next router, which repeats the same independent lookup against *its own* table. No single router knows the whole path; each makes one local decision, and the path emerges from the chain of them. Those tables are not hand-written at scale — **routing protocols** (OSPF or IS-IS inside an organization, BGP between organizations) exchange reachability information so each router learns which prefixes lie in which direction and rebuilds its table as the topology changes. Implementations store prefixes in a **binary trie** (a Patricia/radix tree) so a lookup walks the destination's bits and returns the deepest matching prefix in time proportional to the address width, not the number of routes. IPv6 keeps the identical model — network prefix plus host, longest-prefix match, per-hop TTL (renamed hop limit) — but widens the address to 128 bits to end scarcity, while **NAT** stretches IPv4 by letting many private hosts share one public address through port translation.

## complexity
time: Longest-prefix match over a binary trie is O(W) in the address width W (32 for IPv4, 128 for IPv6), independent of the number of stored routes; a naive scan of N prefixes is O(N). Parsing a dotted quad and applying a mask are O(1).
space: O(N · W) worst case for a trie holding N prefixes, typically far less with path compression; O(N) for a flat list of prefixes.
notes: Hardware routers use TCAM to match all prefixes in parallel in roughly one cycle, trading power and cost for deterministic O(1) lookups. The address-width bound is why IPv6's longer addresses do not slow forwarding meaningfully.

## pitfalls
- Confusing the subnet mask with the network address. The mask (`255.255.255.0`) is a run of ones marking network bits; the network address (`192.168.10.0`) is the result of AND-ing an address with that mask. They are different 32-bit numbers with different roles.
- Forgetting the two reserved hosts. A `/24` holds 256 addresses but only \(2^{32-24} - 2 = 254\) usable ones — the all-zero host (network ID) and all-one host (broadcast) are not assignable. Off-by-one here breaks DHCP pools and capacity math.
- Picking the first matching route instead of the longest. Several prefixes can match one destination; forwarding must choose the *most specific* (longest prefix), not the first one encountered or the shortest. Getting this backward sends traffic to the wrong next hop.
- Assuming a host can talk to any address directly. A host only delivers locally to addresses inside its own subnet (its address AND mask equals the destination's network); everything else must go to the default gateway. A wrong mask makes a host think a remote address is local and silently drop the traffic.
- Ignoring TTL. Without the per-hop TTL decrement, a routing loop would circulate a packet forever; TTL bounds the path length and is what makes `traceroute` able to probe each hop.

## interviewTips
- Be able to compute a subnet by hand: given `192.168.10.37/26`, AND with `255.255.255.192` to get network `192.168.10.0`, broadcast `.63`, and \(2^{6} - 2 = 62\) usable hosts. Show the binary; do not just recite the formula.
- When asked how a router forwards, name longest-prefix match explicitly and explain *why* `/24` beats `/16` — it is the most specific route — then mention the `0.0.0.0/0` default as the catch-all.
- If pushed on performance, describe storing prefixes in a binary trie for O(W) lookup and note that real hardware uses TCAM for parallel matching — this signals you understand the data plane, not just the addressing.

## keyTakeaways
- An IPv4 address is 32 bits split by a subnet mask into a network part (high bits, the "neighborhood") and a host part (low bits); AND-ing the address with the mask yields the network address, and a `/p` prefix leaves \(2^{32-p} - 2\) usable hosts.
- Routers do not store per-host routes; CIDR aggregates contiguous addresses into prefixes, and forwarding picks the longest (most specific) matching prefix, falling back to the `0.0.0.0/0` default gateway.
- Each router makes one independent local decision and decrements TTL; the end-to-end path emerges from the chain of per-hop forwards, with routing protocols (OSPF, BGP) building the tables behind the scenes.

## code.python
```python
# Parse a dotted quad, apply a subnet mask, and do longest-prefix match.
def ip_to_int(dotted):
    a, b, c, d = (int(x) for x in dotted.split("."))
    return (a << 24) | (b << 16) | (c << 8) | d

def mask_of(prefix_len):
    # prefix_len leading ones, rest zeros, in 32 bits
    return (0xFFFFFFFF << (32 - prefix_len)) & 0xFFFFFFFF if prefix_len else 0

def network_of(ip_int, prefix_len):
    return ip_int & mask_of(prefix_len)

def longest_prefix_match(dest, table):
    # table: list of (prefix_str, prefix_len, next_hop)
    dest_i = ip_to_int(dest)
    best = None
    for prefix, plen, hop in table:
        if (dest_i & mask_of(plen)) == network_of(ip_to_int(prefix), plen):
            if best is None or plen > best[1]:   # keep the most specific
                best = (hop, plen)
    return best[0] if best else None

routes = [
    ("10.2.0.0", 16, "R4"),
    ("10.2.7.0", 24, "R5"),
    ("192.168.10.0", 24, "local"),
    ("0.0.0.0", 0, "R1"),   # default gateway
]
print(longest_prefix_match("10.2.7.99", routes))  # R5  (/24 beats /16)
print(longest_prefix_match("8.8.8.8", routes))    # R1  (default)
```

## code.javascript
```javascript
// Parse a dotted quad, apply a mask, longest-prefix match against a table.
const ipToInt = (dotted) =>
  dotted.split(".").reduce((acc, b) => (acc * 256 + Number(b)) >>> 0, 0);

const maskOf = (plen) =>
  plen === 0 ? 0 : (0xffffffff << (32 - plen)) >>> 0;

const networkOf = (ipInt, plen) => (ipInt & maskOf(plen)) >>> 0;

function longestPrefixMatch(dest, table) {
  const d = ipToInt(dest);
  let best = null;
  for (const { prefix, plen, hop } of table) {
    if (networkOf(d, plen) === networkOf(ipToInt(prefix), plen)) {
      if (!best || plen > best.plen) best = { hop, plen }; // most specific wins
    }
  }
  return best ? best.hop : null;
}

const routes = [
  { prefix: "10.2.0.0", plen: 16, hop: "R4" },
  { prefix: "10.2.7.0", plen: 24, hop: "R5" },
  { prefix: "192.168.10.0", plen: 24, hop: "local" },
  { prefix: "0.0.0.0", plen: 0, hop: "R1" }, // default
];
console.log(longestPrefixMatch("10.2.7.99", routes)); // R5
console.log(longestPrefixMatch("8.8.8.8", routes));   // R1
```

## code.java
```java
// Parse a dotted quad, apply a mask, longest-prefix match against a table.
import java.util.*;

public class Routing {
    record Route(String prefix, int plen, String hop) {}

    static long ipToInt(String dotted) {
        String[] p = dotted.split("\\.");
        long v = 0;
        for (String b : p) v = (v << 8) | Integer.parseInt(b);
        return v & 0xFFFFFFFFL;
    }

    static long maskOf(int plen) {
        return plen == 0 ? 0L : (0xFFFFFFFFL << (32 - plen)) & 0xFFFFFFFFL;
    }

    static String longestPrefixMatch(String dest, List<Route> table) {
        long d = ipToInt(dest);
        String hop = null;
        int bestLen = -1;
        for (Route r : table) {
            if ((d & maskOf(r.plen())) == (ipToInt(r.prefix()) & maskOf(r.plen()))) {
                if (r.plen() > bestLen) {        // keep the most specific
                    bestLen = r.plen();
                    hop = r.hop();
                }
            }
        }
        return hop;
    }

    public static void main(String[] args) {
        var routes = List.of(
            new Route("10.2.0.0", 16, "R4"),
            new Route("10.2.7.0", 24, "R5"),
            new Route("192.168.10.0", 24, "local"),
            new Route("0.0.0.0", 0, "R1"));      // default gateway
        System.out.println(longestPrefixMatch("10.2.7.99", routes)); // R5
        System.out.println(longestPrefixMatch("8.8.8.8", routes));   // R1
    }
}
```

## code.cpp
```cpp
// Parse a dotted quad, apply a mask, longest-prefix match against a table.
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

struct Route { string prefix; int plen; string hop; };

uint32_t ipToInt(const string& dotted) {
    uint32_t a, b, c, d; char dot;
    stringstream ss(dotted);
    ss >> a >> dot >> b >> dot >> c >> dot >> d;
    return (a << 24) | (b << 16) | (c << 8) | d;
}

uint32_t maskOf(int plen) {
    return plen == 0 ? 0u : (0xFFFFFFFFu << (32 - plen));
}

string longestPrefixMatch(const string& dest, const vector<Route>& table) {
    uint32_t d = ipToInt(dest);
    string hop; int bestLen = -1;
    for (const auto& r : table) {
        if ((d & maskOf(r.plen)) == (ipToInt(r.prefix) & maskOf(r.plen))) {
            if (r.plen > bestLen) { bestLen = r.plen; hop = r.hop; } // most specific
        }
    }
    return hop;
}

int main() {
    vector<Route> routes = {
        {"10.2.0.0", 16, "R4"},
        {"10.2.7.0", 24, "R5"},
        {"192.168.10.0", 24, "local"},
        {"0.0.0.0", 0, "R1"}};                 // default gateway
    cout << longestPrefixMatch("10.2.7.99", routes) << "\n"; // R5
    cout << longestPrefixMatch("8.8.8.8", routes) << "\n";   // R1
}
```
