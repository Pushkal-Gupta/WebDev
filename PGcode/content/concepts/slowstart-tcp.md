---
slug: slowstart-tcp
module: cs-core
title: TCP Congestion Control
subtitle: Slow start, AIMD, fast retransmit, fast recovery — how TCP probes the network for spare capacity without collapsing it.
difficulty: Intermediate
position: 45
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Remzi Arpaci-Dusseau — OSTEP (Operating Systems: Three Easy Pieces)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "TCP Congestion Control — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/computer-networks/tcp-congestion-control/"
    type: blog
  - title: "TheAlgorithms/Python — networking implementations"
    url: "https://github.com/TheAlgorithms/Python/tree/master/networking_flow"
    type: repo
status: published
---

## intro
TCP doesn't know the available bandwidth on a path. It discovers it by **probing**: send a little, see if it gets through, send more. The probing schedule is congestion control. The classical algorithm — **slow start + AIMD (additive increase, multiplicative decrease)** — was designed by Van Jacobson in 1988 after the Internet's first congestion collapse, and remains the default behavior of TCP Reno and the baseline of TCP Cubic / BBR.

## whyItMatters
Without congestion control, a fast sender on a shared link overwhelms slower receivers and routers; queues fill, packets drop, retransmissions pile on top of the existing flood — the network goes into **congestion collapse** (throughput drops to near zero). Slow start and AIMD give every flow a fair, stable share without central coordination. Modern variants (Cubic, BBR, BBRv2) refine the curves but inherit the structure.

## intuition
Two state variables per connection:
- **cwnd** (congestion window): how many unacked bytes the sender may have in flight.
- **ssthresh** (slow start threshold): the boundary between "slow start" and "congestion avoidance" phases.

The sender's effective window is `min(cwnd, receiver's advertised window)`. cwnd grows when ACKs arrive and shrinks when loss is inferred. The growth schedule is the entire game.

## visualization
```
cwnd (MSS units)
  │
  │                           ╱╲           ╱╲
12│                          ╱  ╲         ╱  ╲      ← congestion avoidance: +1 / RTT
  │                         ╱    ╲       ╱    ╲
 8│                        ╱      ╲     ╱      ╲
  │                       ╱        ╲   ╱        ╲
 4│                      ╱          ╲ ╱          ╲
  │                  ╱──╱            X            X   ← loss events: cut cwnd / set ssthresh
 2│              ╱──╱              (timeout)   (3 dup ACKs)
 1│  ╱──╱──╱──╱
  └─────────────────────────────────────────────────────────► RTTs
   slow start     congestion        fast retransmit + fast recovery
   (exponential)  avoidance         (cwnd = ssthresh, no slow start)
```

## bruteForce
"Just send as fast as you can." The 1986 NSFNet experienced exactly this and saw throughput drop from 32 kb/s to 40 b/s (a 1000× collapse) on the Berkeley-LBL link. Some form of feedback is mandatory.

## optimal
**Slow start** (when cwnd < ssthresh):
- Start with cwnd = 1 MSS (one segment).
- For each ACK received, `cwnd += 1 MSS`.
- Per RTT, this doubles cwnd — exponential growth.
- Continues until cwnd >= ssthresh or loss.

**Congestion avoidance** (when cwnd >= ssthresh):
- For each RTT, `cwnd += 1 MSS` (per-ACK approximation: `cwnd += MSS · MSS / cwnd`).
- Linear growth — the "additive increase" in AIMD.

**Loss inference**:
- **Timeout** (RTO fires before ACK): assume serious congestion. `ssthresh = cwnd / 2`; `cwnd = 1 MSS`; re-enter slow start.
- **3 duplicate ACKs** (fast retransmit): single packet lost, network still flowing. `ssthresh = cwnd / 2`; `cwnd = ssthresh`; enter fast recovery (skip slow start). This is the "multiplicative decrease."

**RTO calculation** (Karn/Jacobson):
- `SRTT = (1 - α) · SRTT + α · sample` with α = 1/8.
- `RTTVAR = (1 - β) · RTTVAR + β · |SRTT - sample|` with β = 1/4.
- `RTO = SRTT + 4 · RTTVAR` (clamped to a min of 1 second by RFC 6298, often less in practice).

**Variants worth naming**: Tahoe (only slow start on any loss), Reno (adds fast recovery), New Reno (multiple losses per window), Cubic (cubic curve replacing linear AIMD — Linux default), BBR (model-based, not loss-based — Google default).

## complexity
- **Convergence to steady state**: O(log BDP) RTTs from cold start to fill the bandwidth-delay product.
- **Fairness**: AIMD provably converges to equal shares between flows sharing a bottleneck (Chiu-Jain plot).
- **Throughput**: in steady state with loss probability p, classic Reno gives throughput ≈ `MSS / (RTT · √p)` — the "TCP throughput formula."

## pitfalls
- **Confusing cwnd with the receiver window (rwnd)**: rwnd is flow control (don't overrun the receiver); cwnd is congestion control (don't overrun the network). The sender uses the min.
- **Forgetting that slow start is *exponential*, not slow**: the name is historical — it's slow only relative to "send everything at once."
- **AIMD only works under random loss**: on wireless / lossy links, non-congestion losses trigger multiplicative decrease and tank throughput. This is why mobile networks layer retransmission below TCP, or use BBR.
- **Bufferbloat**: deep router buffers absorb congestion *without* dropping, so loss-based TCP never backs off; latency balloons. BBR's solution: model the bottleneck bandwidth and RTT directly.
- **Spurious timeouts after RTO**: if the ACK arrives just after RTO, you re-enter slow start unnecessarily. F-RTO and timestamps mitigate this.

## interviewTips
- Trigger phrases: "how does TCP avoid congestion?", "why does throughput drop after a packet loss?", "AIMD," "explain slow start."
- Sketch the cwnd-over-time graph from memory — it's the visual interviewers expect.
- Always distinguish cwnd from rwnd; sloppy answers conflate them.
- For modern systems, mention **Cubic** (Linux default since 2.6.19) and **BBR** (Google data centers, YouTube). Knowing BBR is *model-based* (estimates BDP) rather than loss-based signals depth.
- Mention **fair queueing / AQM (RED, CoDel)** as the router-side complement.
- For a system-design twist: explain why HTTP/2 multiplexing helped (avoid head-of-line blocking) and why QUIC ditched TCP entirely (handshake latency, head-of-line blocking at the transport layer).

## code.python
```python
class TcpReno:
    def __init__(self, mss=1460):
        self.mss = mss
        self.cwnd = mss
        self.ssthresh = 64 * 1024
        self.in_flight = 0
        self.dup_acks = 0
        self.state = "slow_start"

    def on_ack(self, acked_bytes):
        self.in_flight = max(0, self.in_flight - acked_bytes)
        self.dup_acks = 0
        if self.cwnd < self.ssthresh:
            self.cwnd += self.mss
            self.state = "slow_start"
        else:
            self.cwnd += self.mss * self.mss // self.cwnd
            self.state = "congestion_avoidance"

    def on_dup_ack(self):
        self.dup_acks += 1
        if self.dup_acks == 3:
            self.ssthresh = max(self.cwnd // 2, 2 * self.mss)
            self.cwnd = self.ssthresh + 3 * self.mss
            self.state = "fast_recovery"

    def on_timeout(self):
        self.ssthresh = max(self.cwnd // 2, 2 * self.mss)
        self.cwnd = self.mss
        self.dup_acks = 0
        self.state = "slow_start"

    def can_send(self):
        return self.in_flight + self.mss <= self.cwnd
```

## code.javascript
```javascript
class TcpReno {
  constructor(mss = 1460) {
    this.mss = mss;
    this.cwnd = mss;
    this.ssthresh = 64 * 1024;
    this.inFlight = 0;
    this.dupAcks = 0;
    this.state = "slow_start";
  }
  onAck(ackedBytes) {
    this.inFlight = Math.max(0, this.inFlight - ackedBytes);
    this.dupAcks = 0;
    if (this.cwnd < this.ssthresh) {
      this.cwnd += this.mss;
      this.state = "slow_start";
    } else {
      this.cwnd += Math.floor(this.mss * this.mss / this.cwnd);
      this.state = "congestion_avoidance";
    }
  }
  onDupAck() {
    if (++this.dupAcks === 3) {
      this.ssthresh = Math.max(Math.floor(this.cwnd / 2), 2 * this.mss);
      this.cwnd = this.ssthresh + 3 * this.mss;
      this.state = "fast_recovery";
    }
  }
  onTimeout() {
    this.ssthresh = Math.max(Math.floor(this.cwnd / 2), 2 * this.mss);
    this.cwnd = this.mss;
    this.dupAcks = 0;
    this.state = "slow_start";
  }
  canSend() { return this.inFlight + this.mss <= this.cwnd; }
}
```

## code.java
```java
class TcpReno {
    int mss = 1460, cwnd = mss, ssthresh = 64 * 1024, inFlight = 0, dupAcks = 0;
    String state = "slow_start";
    void onAck(int acked) {
        inFlight = Math.max(0, inFlight - acked);
        dupAcks = 0;
        if (cwnd < ssthresh) { cwnd += mss; state = "slow_start"; }
        else { cwnd += mss * mss / cwnd; state = "congestion_avoidance"; }
    }
    void onDupAck() {
        if (++dupAcks == 3) {
            ssthresh = Math.max(cwnd / 2, 2 * mss);
            cwnd = ssthresh + 3 * mss;
            state = "fast_recovery";
        }
    }
    void onTimeout() {
        ssthresh = Math.max(cwnd / 2, 2 * mss);
        cwnd = mss; dupAcks = 0; state = "slow_start";
    }
    boolean canSend() { return inFlight + mss <= cwnd; }
}
```

## code.cpp
```cpp
#include <algorithm>
#include <string>
struct TcpReno {
    int mss = 1460, cwnd = 1460, ssthresh = 64 * 1024, inFlight = 0, dupAcks = 0;
    std::string state = "slow_start";
    void onAck(int acked) {
        inFlight = std::max(0, inFlight - acked);
        dupAcks = 0;
        if (cwnd < ssthresh) { cwnd += mss; state = "slow_start"; }
        else { cwnd += mss * mss / cwnd; state = "congestion_avoidance"; }
    }
    void onDupAck() {
        if (++dupAcks == 3) {
            ssthresh = std::max(cwnd / 2, 2 * mss);
            cwnd = ssthresh + 3 * mss;
            state = "fast_recovery";
        }
    }
    void onTimeout() {
        ssthresh = std::max(cwnd / 2, 2 * mss);
        cwnd = mss; dupAcks = 0; state = "slow_start";
    }
    bool canSend() const { return inFlight + mss <= cwnd; }
};
```
