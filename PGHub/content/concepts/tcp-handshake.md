---
slug: tcp-handshake
module: cs-network-protocols
title: TCP Three-Way Handshake
subtitle: SYN / SYN-ACK / ACK plus sequence numbers — how two peers agree on initial state and reject stale connections.
difficulty: Beginner
position: 46
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "Remzi Arpaci-Dusseau — OSTEP: Distributed Systems"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "TCP Connection Establishment — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/computer-networks/tcp-3-way-handshake-process/"
    type: blog
  - title: "TheAlgorithms/Python — networking implementations"
    url: "https://github.com/TheAlgorithms/Python/tree/master/networking_flow"
    type: repo
status: published
---

## intro
Before a single byte of application data crosses a TCP connection, the two peers must agree on **initial sequence numbers (ISNs)**, **window sizes**, and **optional features** (MSS, SACK, timestamps, window scale). They accomplish this with a three-segment exchange: **SYN** from the client, **SYN-ACK** from the server, **ACK** from the client. This is the famous three-way handshake.

## whyItMatters
The handshake is what makes TCP **reliable and ordered** in the face of an unreliable IP layer. ISNs let TCP detect duplicate or delayed packets from old connections (the classic "two armies problem" the protocol partially solves). Without the handshake, you'd have UDP — fine for DNS, terrible for file transfer.

For latency-sensitive systems, the handshake is also a **cost**: one full RTT before any data can flow. HTTP/2, QUIC, and TCP Fast Open exist largely to amortize or eliminate it.

## intuition
Each side picks a random initial sequence number, sends it, and waits to see the other side **acknowledge it back**. The ACK proves: (a) the other side is reachable, (b) the other side has seen our ISN. Once both directions have been ACKed, the connection is **ESTABLISHED**.

The middle segment combines the server's SYN with its ACK of the client's SYN — saving one round trip versus a naïve four-step exchange.

## visualization
```
Client                                          Server
   │                                               │
   │ ── SYN (seq = x) ─────────────────────────►   │   state: SYN_SENT
   │                                               │
   │                                          [ allocate TCB, choose ISN y ]
   │   ◄───────────── SYN-ACK (seq = y, ack = x+1) │   state: SYN_RCVD
   │                                               │
   │ ── ACK (seq = x+1, ack = y+1) ─────────────►  │
   │                                               │
   │   state: ESTABLISHED                          │   state: ESTABLISHED
   │ ── data (seq = x+1, len = L) ─────────────►   │
   │   ◄────────── ACK (ack = x+1+L) ─────────────│
   │                                               │

Header flags involved:
  SYN  = "synchronize sequence numbers" (1 bit)
  ACK  = "acknowledgment field valid"   (1 bit)
  Sequence number = byte offset of first data byte in segment
  Acknowledgment  = next sequence number the receiver expects
```

## bruteForce
"Just assume the channel is good and start sending." Result: any duplicate or reordered packet from an old connection corrupts the stream. UDP plus an application-level reliability layer is one path; TCP is the other.

A **two-way handshake** (SYN, SYN-ACK; client starts sending immediately) was tried and fails the "old duplicate SYN" attack: a stale SYN from a prior session can establish a phantom connection on the server with no way to detect it.

## optimal
The full state machine (RFC 793):
```
CLOSED  → (send SYN)        → SYN_SENT
SYN_SENT → (recv SYN-ACK)   → (send ACK) → ESTABLISHED

LISTEN  → (recv SYN)        → (send SYN-ACK) → SYN_RCVD
SYN_RCVD → (recv ACK)       → ESTABLISHED
```

**ISN selection** (RFC 6528): pseudo-random plus a 4-microsecond clock, hashed with the 4-tuple and a server-side secret. Defeats blind in-window injection.

**Window scaling** (RFC 7323): the 16-bit window field allows max 64 KB; the Window Scale option multiplies it by 2^k. Negotiated only during SYN/SYN-ACK — cannot be added later.

**MSS option**: each side advertises its max segment size in the SYN, capped by path MTU. Typical: 1460 (Ethernet 1500 - 20 IP - 20 TCP).

**TCP Fast Open** (RFC 7413): client caches a server cookie from a prior connection; subsequent SYNs carry the cookie + data, server responds with SYN-ACK + data. Removes the 1-RTT delay for repeat visits.

**Connection teardown** uses a *four-way* handshake (FIN, ACK, FIN, ACK) because each direction closes independently. The TIME_WAIT state holds the closing side for 2·MSL (~ 60 seconds) to absorb late retransmissions — a common source of `EADDRINUSE` errors on server restarts.

**SYN flood attack**: an attacker sends many SYNs from spoofed IPs; the server allocates TCBs and waits for ACKs that never come. Defense: **SYN cookies** — server encodes connection state into the ISN and doesn't allocate a TCB until the ACK arrives.

## complexity
- **Latency cost**: 1 RTT minimum before client can send data; +1 RTT for first server response (so HTTP request-response = 2 RTTs minimum).
- **Server memory per half-open**: ~250 bytes for the TCB.
- **State machine**: 11 states, ~30 transitions — small enough to memorize.

## pitfalls
- **Confusing "three-way" with "three packets"**: yes, it's three segments. But the third one (the client's ACK) can carry data (so HTTP request can ride in it — this is what TCP Fast Open exploits).
- **Sequence number wrap-around**: sequence numbers are 32-bit; at 10 Gbps a connection wraps in ~3.5 seconds. TCP Timestamps (RFC 7323 PAWS) disambiguate.
- **TIME_WAIT exhaustion**: a load balancer making many short-lived outbound connections can exhaust ephemeral ports. Mitigations: SO_REUSEADDR, connection pooling, or moving to a long-lived protocol (HTTP/2).
- **Half-open connections** after a peer crash: only detected by keepalives (off by default, 2-hour default interval) or application-level heartbeats.
- **Asymmetric routing breaking SYN cookies**: SYN cookies don't carry window scale or SACK options, so connections established under cookie defense have degraded performance.

## interviewTips
- Trigger phrases: "how does TCP establish a connection?", "why three-way and not two?", "what's in the SYN packet?", "SYN flood."
- Always name the three packets *with their flags* and *with sequence-number semantics* — not just "SYN, SYN-ACK, ACK."
- Mention the **state machine** by name; bonus points for listing SYN_SENT, SYN_RCVD, ESTABLISHED, FIN_WAIT_1/2, TIME_WAIT.
- Compare with **TLS 1.3 1-RTT handshake** (which piggybacks on TCP) and **QUIC** (which combines transport + crypto handshake into 1 RTT, or 0 RTT for repeat clients).
- For senior loops, sketch SYN cookies; explain why TIME_WAIT exists at the actively-closing peer and why it lasts 2·MSL.

## code.python
```python
import enum

class State(enum.Enum):
    CLOSED = 0
    LISTEN = 1
    SYN_SENT = 2
    SYN_RCVD = 3
    ESTABLISHED = 4

class TcpEndpoint:
    def __init__(self, name):
        self.name = name
        self.state = State.CLOSED
        self.snd_isn = None      # our chosen ISN
        self.rcv_isn = None      # peer's ISN
        self.snd_nxt = None      # next byte we will send
        self.rcv_nxt = None      # next byte we expect from peer

    def active_open(self, iss):
        assert self.state == State.CLOSED
        self.snd_isn = iss
        self.snd_nxt = iss + 1
        self.state = State.SYN_SENT
        return {"flags": "SYN", "seq": iss, "ack": None}

    def passive_open(self):
        assert self.state == State.CLOSED
        self.state = State.LISTEN

    def receive(self, seg, iss=None):
        if self.state == State.LISTEN and seg["flags"] == "SYN":
            self.rcv_isn = seg["seq"]
            self.rcv_nxt = seg["seq"] + 1
            self.snd_isn = iss
            self.snd_nxt = iss + 1
            self.state = State.SYN_RCVD
            return {"flags": "SYN+ACK", "seq": iss, "ack": self.rcv_nxt}

        if self.state == State.SYN_SENT and seg["flags"] == "SYN+ACK":
            assert seg["ack"] == self.snd_nxt
            self.rcv_isn = seg["seq"]
            self.rcv_nxt = seg["seq"] + 1
            self.state = State.ESTABLISHED
            return {"flags": "ACK", "seq": self.snd_nxt, "ack": self.rcv_nxt}

        if self.state == State.SYN_RCVD and seg["flags"] == "ACK":
            assert seg["ack"] == self.snd_nxt
            self.state = State.ESTABLISHED
            return None

client, server = TcpEndpoint("c"), TcpEndpoint("s")
server.passive_open()
s1 = client.active_open(iss=1000)
s2 = server.receive(s1, iss=5000)
s3 = client.receive(s2)
server.receive(s3)
print(client.state, server.state)   # ESTABLISHED ESTABLISHED
```

## code.javascript
```javascript
const State = { CLOSED: 0, LISTEN: 1, SYN_SENT: 2, SYN_RCVD: 3, ESTABLISHED: 4 };

class TcpEndpoint {
  constructor() { this.state = State.CLOSED; this.sndIsn = null; this.rcvIsn = null; this.sndNxt = null; this.rcvNxt = null; }
  activeOpen(iss) {
    this.sndIsn = iss; this.sndNxt = iss + 1; this.state = State.SYN_SENT;
    return { flags: "SYN", seq: iss, ack: null };
  }
  passiveOpen() { this.state = State.LISTEN; }
  receive(seg, iss = null) {
    if (this.state === State.LISTEN && seg.flags === "SYN") {
      this.rcvIsn = seg.seq; this.rcvNxt = seg.seq + 1;
      this.sndIsn = iss; this.sndNxt = iss + 1; this.state = State.SYN_RCVD;
      return { flags: "SYN+ACK", seq: iss, ack: this.rcvNxt };
    }
    if (this.state === State.SYN_SENT && seg.flags === "SYN+ACK") {
      this.rcvIsn = seg.seq; this.rcvNxt = seg.seq + 1; this.state = State.ESTABLISHED;
      return { flags: "ACK", seq: this.sndNxt, ack: this.rcvNxt };
    }
    if (this.state === State.SYN_RCVD && seg.flags === "ACK") {
      this.state = State.ESTABLISHED; return null;
    }
  }
}
```

## code.java
```java
class TcpEndpoint {
    enum State { CLOSED, LISTEN, SYN_SENT, SYN_RCVD, ESTABLISHED }
    State state = State.CLOSED;
    Integer sndIsn, rcvIsn, sndNxt, rcvNxt;
    static class Seg { String flags; int seq; Integer ack;
        Seg(String f, int s, Integer a) { flags = f; seq = s; ack = a; } }
    Seg activeOpen(int iss) {
        sndIsn = iss; sndNxt = iss + 1; state = State.SYN_SENT;
        return new Seg("SYN", iss, null);
    }
    void passiveOpen() { state = State.LISTEN; }
    Seg receive(Seg seg, Integer iss) {
        if (state == State.LISTEN && seg.flags.equals("SYN")) {
            rcvIsn = seg.seq; rcvNxt = seg.seq + 1;
            sndIsn = iss; sndNxt = iss + 1; state = State.SYN_RCVD;
            return new Seg("SYN+ACK", iss, rcvNxt);
        }
        if (state == State.SYN_SENT && seg.flags.equals("SYN+ACK")) {
            rcvIsn = seg.seq; rcvNxt = seg.seq + 1; state = State.ESTABLISHED;
            return new Seg("ACK", sndNxt, rcvNxt);
        }
        if (state == State.SYN_RCVD && seg.flags.equals("ACK")) {
            state = State.ESTABLISHED; return null;
        }
        return null;
    }
}
```

## code.cpp
```cpp
#include <string>
#include <optional>
struct Seg {
    std::string flags;
    int seq;
    std::optional<int> ack;
};
struct TcpEndpoint {
    enum class State { CLOSED, LISTEN, SYN_SENT, SYN_RCVD, ESTABLISHED };
    State state = State::CLOSED;
    std::optional<int> sndIsn, rcvIsn, sndNxt, rcvNxt;

    Seg activeOpen(int iss) {
        sndIsn = iss; sndNxt = iss + 1; state = State::SYN_SENT;
        return {"SYN", iss, std::nullopt};
    }
    void passiveOpen() { state = State::LISTEN; }
    std::optional<Seg> receive(const Seg& seg, std::optional<int> iss = std::nullopt) {
        if (state == State::LISTEN && seg.flags == "SYN") {
            rcvIsn = seg.seq; rcvNxt = seg.seq + 1;
            sndIsn = *iss; sndNxt = *iss + 1; state = State::SYN_RCVD;
            return Seg{"SYN+ACK", *iss, rcvNxt};
        }
        if (state == State::SYN_SENT && seg.flags == "SYN+ACK") {
            rcvIsn = seg.seq; rcvNxt = seg.seq + 1; state = State::ESTABLISHED;
            return Seg{"ACK", *sndNxt, rcvNxt};
        }
        if (state == State::SYN_RCVD && seg.flags == "ACK") {
            state = State::ESTABLISHED; return std::nullopt;
        }
        return std::nullopt;
    }
};
```
