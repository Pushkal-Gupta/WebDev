---
slug: tcp-congestion-control-deep
module: cs-network-protocols
title: TCP Congestion Control Deep — Reno, CUBIC, BBR
subtitle: Reno's AIMD, CUBIC's bandwidth-scaling cubic curve, BBR's model-based pacing — plus Karn's algorithm for RTT, fast retransmit, SACK, and Fast Open.
difficulty: Advanced
position: 71
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "RFC 5681 — TCP Congestion Control"
    url: "https://www.rfc-editor.org/rfc/rfc5681"
    type: spec
  - title: "RFC 6298 — Computing TCP's Retransmission Timer (Karn's algorithm)"
    url: "https://www.rfc-editor.org/rfc/rfc6298"
    type: spec
  - title: "RFC 2018 — TCP Selective Acknowledgment Options"
    url: "https://datatracker.ietf.org/doc/html/rfc2018"
    type: spec
  - title: "RFC 7413 — TCP Fast Open"
    url: "https://datatracker.ietf.org/doc/html/rfc7413"
    type: spec
  - title: "BBR: Congestion-Based Congestion Control — Cardwell et al."
    url: "https://research.google/pubs/bbr-congestion-based-congestion-control/"
    type: paper
status: published
---

## intro
Reno halves the window on loss and adds one MSS per RTT in steady state. CUBIC replaces that linear growth with a cubic curve anchored at the last congestion point, so it scales to high-bandwidth paths without the conservatism of Reno. BBR throws the loss signal out entirely and models the bottleneck bandwidth and round-trip propagation time directly. Around all three sit the supporting cast: Karn's algorithm for unambiguous RTT samples, fast retransmit triggered by three duplicate ACKs, SACK for selectively repairing holes, and Fast Open for skipping the handshake on repeat visits.

## whyItMatters
The choice of congestion controller decides how a connection behaves on a long-haul lossy path, on a deep buffer, and on a wireless link with bursty losses. Reno underutilizes 100ms+ paths. CUBIC fixes that and is the Linux default since 2007. BBR — deployed across YouTube, Google Search, and Spotify — beats CUBIC on high-BDP paths but contends unfairly with loss-based flows. The supporting protocols matter just as much: a wrong Karn calculation gives you spiraling RTOs after a single loss, no SACK means a single drop forces a full retransmit of the window's tail, and Fast Open shaves an entire RTT off every repeat TLS handshake.

## intuition
Start with the steady-state picture. Reno keeps a congestion window `cwnd` and increases it by one MSS per RTT in the congestion-avoidance phase. On a triple-duplicate-ACK (fast retransmit), it halves `cwnd` and continues. On a timeout, it crashes back to one MSS and re-enters slow start. The AIMD curve sawtooths between `cwnd/2` and `cwnd`. Throughput is bounded by `cwnd / RTT`, and because Reno only grows linearly, recovering after a loss on a 100ms path with 1Gbps capacity takes minutes. That is the high-BDP failure mode CUBIC was designed for.

CUBIC replaces the linear growth with `W(t) = C(t - K)^3 + W_max`, where `W_max` is the window size right before the last loss and `K` is the time it would take to grow back to `W_max` if growth were unconstrained by network conditions. The cubic shape grows aggressively while far from `W_max`, plateaus near it, then pushes past in case the path has more capacity. The function is independent of RTT, so flows on different RTTs converge to a fair share faster than Reno's RTT-biased AIMD. Linux default; FreeBSD default; Windows default since Server 2019.

BBR is a model, not a reaction. It estimates two things continuously: the bottleneck bandwidth (`BtlBw` = max delivered bytes/sec over a recent window) and the minimum round-trip propagation time (`RTprop` = min RTT observed over a longer window). The product `BDP = BtlBw * RTprop` is the optimal in-flight data. BBR paces sends at `BtlBw` and caps in-flight at `BDP` plus a small headroom. It does not interpret loss as congestion — it interprets *queueing* (RTT above `RTprop`) as congestion. On clean fiber paths this gives 2–10x higher throughput than CUBIC. The trade-off is fairness: BBR happily takes all available bandwidth against a CUBIC flow.

Karn's algorithm fixes the RTT-sample ambiguity around retransmissions. If you send segment X, time out, retransmit, and an ACK arrives — was it for the original or the retransmission? You cannot tell, so you cannot use that sample for RTT estimation. Karn's rule: discard the sample, and double the RTO (exponential backoff) until a clean sample arrives. RFC 6298 codifies this. Without Karn, a single timeout poisons the RTT estimator and the RTO spirals.

SACK lets the receiver tell the sender which non-contiguous byte ranges have arrived. Without it, a single loss looks like "everything past byte N is missing" to a cumulative-ACK sender, who then retransmits the entire tail. With SACK, the sender retransmits only the actual holes. Fast Open piggybacks application data on the SYN of a repeat connection, validated by a server-issued cookie — saving a full RTT on every reconnect to the same origin.

## visualization
```
  cwnd (MSS)
    │
    │            Reno                CUBIC                BBR
    │             ╱╲                  ╱──╲                ───────  pace at BtlBw
    │            ╱  ╲                ╱    ╲              ╱
    │           ╱    ╲              ╱      ╲           ╱
    │          ╱      ╲←drop      ╱  loss   ╲       ╱  RTT > RTprop
    │         ╱        ╲         ╱           ╲    ╱   → drain
    │        ╱          ╲       ╱             ╲
    │ slow  ╱            ╲     ╱cubic curve    ╲
    │ start                   centered at W_max
    └──────────────────────────────────────────── time

  Fast retransmit (Reno/CUBIC):
    sender                            receiver
      │── seg 1 ──────────────────▶│
      │── seg 2 (LOST)  ✗          │
      │── seg 3 ──────────────────▶│ ack 2  (dup, expects 2)
      │── seg 4 ──────────────────▶│ ack 2  (dup #2)
      │── seg 5 ──────────────────▶│ ack 2  (dup #3) → fast retransmit
      │── retransmit seg 2 ───────▶│ ack 6  (SACK: 3-5 already have)
```

## bruteForce
The pre-1988 brute-force scheme was no congestion control at all — TCP just sent what flow control allowed. In October 1986 the NSFNET backbone dropped from 32 kbps to 40 bps for hours under congestion collapse: retransmissions piled on top of the original load, queues overflowed, every flow contributed to a feedback loop. Van Jacobson's 1988 paper added slow start and AIMD as a back-pressure mechanism. Modern variants refine the response curves, but every one of them rests on the same closed-loop idea: probe up, back off on a congestion signal, never assume you know the bandwidth in advance.

## optimal
Modern stacks treat congestion control as pluggable per-connection, and each algorithm targets a different network class. CUBIC is the default for general traffic because its growth function is RTT-independent and recovers from loss on high-BDP paths within seconds rather than minutes. The cubic curve has two distinct regions: a concave region where `cwnd` grows aggressively after the back-off, and a convex region past `W_max` where it pushes for new bandwidth slowly. Together they make CUBIC scale linearly with link capacity rather than logarithmically.

BBR sidesteps the loss-as-congestion assumption. It runs four phases on a cycle: STARTUP (slow-start equivalent, growing pacing rate by `2/ln(2)` per RTT until `BtlBw` plateaus), DRAIN (pace below `BtlBw` to flush the queue STARTUP built), PROBE_BW (cycle pacing gain through `[1.25, 0.75, 1, 1, 1, 1, 1, 1]` to keep an updated `BtlBw` estimate), PROBE_RTT (drop in-flight to four packets briefly to re-measure `RTprop`). On fiber paths with shallow buffers and random loss, BBR runs near link capacity where CUBIC backs off uselessly. On shared paths with CUBIC flows, BBR's lack of loss response means it crowds CUBIC out — a known fairness problem that BBRv2 partially addresses by adding a loss reaction.

Karn's algorithm is one rule but it carries the entire RTO calculation: never sample RTT on a retransmitted segment, and double the RTO on every timeout. SACK turns retransmission from "send everything past the cumulative ACK" into "send these specific ranges," which is critical when the loss window is large. Fast Open uses a cryptographic cookie issued on the first connection so subsequent SYNs can carry up to ~1KB of HTTP request data — the server processes it eagerly, response comes one RTT sooner.

## complexity
Reno's per-ACK work is O(1) (increment `cwnd`); on loss it does O(1) work to halve and re-enter recovery. CUBIC computes `W(t) = C(t - K)^3 + W_max` in O(1) per ACK; the cube is a few multiplies. BBR keeps a max-bandwidth-filter (windowed max over ~10 RTTs) and a min-RTT-filter (windowed min over ~10 sec), each O(1) per sample with a monotonic-deque or windowed-max. Throughput is bounded by `cwnd / RTT` for window-based controllers and by `BtlBw` directly for BBR. RFC 6298's RTO is `srtt + max(G, 4*rttvar)` updated O(1) per sample. SACK processing is O(k) per ACK for k SACK blocks (capped at 4 blocks by the option-space limit in the TCP header).

## pitfalls
- Sampling RTT on retransmitted segments — violates Karn and poisons the RTO estimator. Always discard ambiguous samples and only resume sampling after a clean ACK.
- Assuming loss equals congestion on wireless paths — random radio losses trigger Reno/CUBIC back-off needlessly. Either use BBR or ECN, or accept the throughput hit.
- Mixing BBR and CUBIC flows on the same bottleneck — BBR will take more than its fair share. Be aware of this when rolling out BBR to public-facing services.
- Forgetting SACK is negotiated at handshake — if either side disables it, you fall back to cumulative ACKs and recovery slows dramatically. Verify `tcp_sack=1` on Linux.
- Sending non-idempotent data in Fast Open — the SYN can be replayed by a middlebox or attacker, just like 0-RTT in TLS. Restrict TFO to idempotent operations.
- Tuning `initial_window` too high in the name of "performance" — RFC 6928 caps it at 10 MSS for a reason; going higher causes immediate loss on slow paths.

## interviewTips
- Be ready to draw all three throughput-over-time curves (Reno sawtooth, CUBIC plateau, BBR flat-with-probes) and explain what differs.
- Know Karn's algorithm by name and explain why retransmitted samples are ambiguous.
- Distinguish fast retransmit (3 dup ACKs) from fast recovery (don't crash `cwnd` to 1, halve and continue) — these are two separate mechanisms RFC 5681 defines.

## code
### python
```python
class RenoController:
    def __init__(self):
        self.cwnd = INITIAL_WINDOW   # MSS
        self.ssthresh = float('inf')
        self.state = 'slow_start'
        self.dup_acks = 0

    def on_ack(self, acked_bytes):
        if self.state == 'slow_start':
            self.cwnd += acked_bytes  # exponential
            if self.cwnd >= self.ssthresh:
                self.state = 'congestion_avoidance'
        else:
            self.cwnd += MSS * MSS / self.cwnd  # +1 MSS per RTT
        self.dup_acks = 0

    def on_dup_ack(self):
        self.dup_acks += 1
        if self.dup_acks == 3:
            self.ssthresh = max(self.cwnd // 2, 2 * MSS)
            self.cwnd = self.ssthresh + 3 * MSS
            self.state = 'fast_recovery'
            return 'retransmit'

    def on_timeout(self):
        self.ssthresh = max(self.cwnd // 2, 2 * MSS)
        self.cwnd = MSS
        self.state = 'slow_start'

class RttEstimator:
    def __init__(self):
        self.srtt = None; self.rttvar = None; self.rto = 1.0
    def on_sample(self, rtt, is_retransmit):
        if is_retransmit:
            return  # Karn: discard ambiguous samples
        if self.srtt is None:
            self.srtt = rtt; self.rttvar = rtt / 2
        else:
            self.rttvar = 0.75 * self.rttvar + 0.25 * abs(self.srtt - rtt)
            self.srtt = 0.875 * self.srtt + 0.125 * rtt
        self.rto = max(self.srtt + 4 * self.rttvar, 0.2)
    def on_timeout(self):
        self.rto = min(self.rto * 2, 60.0)  # exponential backoff
```

### javascript
```javascript
class RenoController {
  constructor() {
    this.cwnd = INITIAL_WINDOW;
    this.ssthresh = Infinity;
    this.state = 'slow_start';
    this.dupAcks = 0;
  }
  onAck(ackedBytes) {
    if (this.state === 'slow_start') {
      this.cwnd += ackedBytes;
      if (this.cwnd >= this.ssthresh) this.state = 'congestion_avoidance';
    } else {
      this.cwnd += (MSS * MSS) / this.cwnd;
    }
    this.dupAcks = 0;
  }
  onDupAck() {
    if (++this.dupAcks === 3) {
      this.ssthresh = Math.max(this.cwnd / 2, 2 * MSS);
      this.cwnd = this.ssthresh + 3 * MSS;
      this.state = 'fast_recovery';
      return 'retransmit';
    }
  }
  onTimeout() {
    this.ssthresh = Math.max(this.cwnd / 2, 2 * MSS);
    this.cwnd = MSS;
    this.state = 'slow_start';
  }
}
```

### java
```java
class RenoController {
    enum State { SLOW_START, CONGESTION_AVOIDANCE, FAST_RECOVERY }
    double cwnd = INITIAL_WINDOW;
    double ssthresh = Double.POSITIVE_INFINITY;
    State state = State.SLOW_START;
    int dupAcks = 0;

    void onAck(int ackedBytes) {
        if (state == State.SLOW_START) {
            cwnd += ackedBytes;
            if (cwnd >= ssthresh) state = State.CONGESTION_AVOIDANCE;
        } else {
            cwnd += (double)(MSS * MSS) / cwnd;
        }
        dupAcks = 0;
    }

    String onDupAck() {
        if (++dupAcks == 3) {
            ssthresh = Math.max(cwnd / 2, 2 * MSS);
            cwnd = ssthresh + 3 * MSS;
            state = State.FAST_RECOVERY;
            return "retransmit";
        }
        return null;
    }

    void onTimeout() {
        ssthresh = Math.max(cwnd / 2, 2 * MSS);
        cwnd = MSS;
        state = State.SLOW_START;
    }
}
```

### cpp
```cpp
struct RenoController {
    enum class State { SlowStart, CongestionAvoidance, FastRecovery };
    double cwnd = INITIAL_WINDOW;
    double ssthresh = std::numeric_limits<double>::infinity();
    State state = State::SlowStart;
    int dup_acks = 0;

    void on_ack(int acked_bytes) {
        if (state == State::SlowStart) {
            cwnd += acked_bytes;
            if (cwnd >= ssthresh) state = State::CongestionAvoidance;
        } else {
            cwnd += (double)(MSS * MSS) / cwnd;
        }
        dup_acks = 0;
    }

    bool on_dup_ack() {
        if (++dup_acks == 3) {
            ssthresh = std::max(cwnd / 2.0, 2.0 * MSS);
            cwnd = ssthresh + 3 * MSS;
            state = State::FastRecovery;
            return true;
        }
        return false;
    }

    void on_timeout() {
        ssthresh = std::max(cwnd / 2.0, 2.0 * MSS);
        cwnd = MSS;
        state = State::SlowStart;
    }
};
```
