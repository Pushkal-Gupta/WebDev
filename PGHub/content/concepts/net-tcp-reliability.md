---
slug: net-tcp-reliability
module: computer-networks
title: TCP — Reliable Byte Streams
subtitle: How TCP turns a lossy, reordering packet network into an ordered, acknowledged byte stream — handshake, sequence numbers, retransmission, and windows.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 14
prereqs: [net-osi-tcpip-layers]
relatedProblems: []
references:
  - title: "Kurose & Ross — Computer Networking: A Top-Down Approach (companion site)"
    url: "https://gaia.cs.umass.edu/kurose_ross/index.php"
    type: book
  - title: "Cloudflare Learning Center — What is a TCP/IP handshake?"
    url: "https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/"
    type: article
  - title: "RFC 9293 — Transmission Control Protocol (TCP)"
    url: "https://www.rfc-editor.org/rfc/rfc9293"
    type: spec
  - title: "RFC 5681 — TCP Congestion Control"
    url: "https://www.rfc-editor.org/rfc/rfc5681"
    type: spec
status: published
---

## intro
The Internet's lower layers make no promises. IP forwards individual packets on a best-effort basis: any packet can be dropped by a congested router, duplicated, delayed, or delivered out of order, and nothing tells the sender it happened. Yet when you load a page or stream a file, the bytes arrive complete and in order. **TCP** is the layer that buys that guarantee. It sits between your application and the raw packet network and turns an unreliable datagram service into a **reliable, ordered, full-duplex byte stream** — using nothing but sequence numbers, acknowledgements, timers, and retransmission. This lesson works through exactly how it does that.

## whyItMatters
Almost everything you think of as "the web" rides on TCP: HTTP/1.1 and HTTP/2, TLS, SSH, SMTP, most database wire protocols. When a page loads slowly, when a download stalls and resumes, when a connection "hangs" for thirty seconds before failing — you are watching TCP's retransmission timers, congestion control, and connection setup at work. Understanding it lets you reason about real failures: why a far-away server feels laggy even on a fast link (round-trip time bounds the window), why one lossy Wi-Fi hop tanks throughput (loss is read as congestion), why a half-open connection lingers. The same ideas — acknowledged delivery, windows, backoff — reappear in application-level protocols, message queues, and distributed-systems replication, so the mechanics transfer well past the kernel socket.

## intuition
Think of TCP as a careful conversation where every spoken sentence gets a written receipt. Before anyone talks, both sides agree on where counting starts — that is the **three-way handshake**. The client sends a **SYN** ("let's talk; my bytes will be numbered starting at x"). The server replies with a **SYN-ACK** ("agreed, I heard you up through x+1; my bytes start at y"). The client sends a final **ACK** ("I heard you up through y+1"). Now both sides know each other's starting sequence numbers and the channel is open in both directions.

The key insight is what a **sequence number** and an **acknowledgement number** actually mean. The sequence number labels the position in the byte stream of the *first* byte in a segment. The ACK number is the position of the *next* byte the receiver expects — equivalently, "I have everything below this." So ACKs are **cumulative**: a single ACK for byte 5000 confirms every byte up to 4999 at once, even if earlier ACKs were lost.

Walk a tiny example. Suppose after the handshake the client's sequence counter sits at 1000 and it sends 500 bytes of data. That segment carries seq = 1000 and covers bytes 1000–1499. The server receives it, and replies with ACK = 1500, meaning "send me byte 1500 next." The client advances to seq = 1500 and sends another 500 bytes; the server answers ACK = 2000. Each receipt slides the conversation forward. If a segment never arrives, the receiver keeps acknowledging the last in-order byte it has, and the sender — seeing no progress, either by a timer firing or by repeated duplicate ACKs — resends the missing piece. Nothing is ever assumed delivered until its receipt comes back.

## visualization
```
time   CLIENT                                SERVER
  |    --- SYN  seq=1000 ----------------->        (open: pick start seq)
  |    <-- SYN-ACK seq=5000 ack=1001 ------        (agree; my seq=5000)
  |    --- ACK  seq=1001 ack=5001 -------->        (handshake done)
  |
  |    --- DATA seq=1001 len=500 --------->        (bytes 1001..1500)
  |    <-- ACK  ack=1501 -----------------         ("have up to 1500")
  |
  |    --- DATA seq=1501 len=500 ---X              (LOST in the network)
  |        ...retransmit timer counting down...
  |    --- DATA seq=1501 len=500 --------->        (timeout -> resend)
  |    <-- ACK  ack=2001 -----------------         (recovered, in order)
  v
```

## bruteForce
The naive approach is "just send and hope" — hand each chunk to the network as a bare datagram and assume it arrives, which is essentially what **UDP** does. There is no connection setup, no sequence numbering, no acknowledgement, and no retransmission: a packet that a router drops is simply gone, and packets that take different paths can arrive out of order or duplicated with the receiver none the wiser. For a voice call or a game tick that is often fine — a stale packet is worth less than a late one — but for a file, a web page, or a database query it is unusable: you would silently lose bytes and corrupt the stream. UDP is the honest baseline that shows exactly which guarantees TCP has to add by hand.

## optimal
TCP layers four mechanisms on top of best-effort IP. **Connection setup** is the three-way handshake, which synchronizes both directions' starting sequence numbers (randomized, to resist spoofing) before any data flows. **Reliable in-order delivery** comes from sequence numbers plus **cumulative ACKs**: the receiver buffers out-of-order segments and only advances its ACK to the highest contiguous byte it holds, so a single ACK can confirm a large run of bytes and lost ACKs self-heal. **Retransmission** handles loss two ways. A per-connection **retransmission timeout (RTO)**, derived from a smoothed estimate of the round-trip time, fires if an ACK does not arrive in time and resends the oldest unacknowledged segment. Faster, **fast retransmit** treats three duplicate ACKs (the receiver repeating "still want byte N") as a strong signal that segment N was lost and resends it immediately, without waiting for the timer.

Two windows govern *how much* is in flight. **Flow control** stops a fast sender from overrunning a slow receiver: every ACK carries an **advertised receive window** (rwnd) — the free space in the receiver's buffer — and the sender keeps unacknowledged bytes ≤ rwnd. This is the **sliding window**: as ACKs arrive the window's left edge advances and new bytes become sendable. **Congestion control** protects the *network*. The sender maintains a **congestion window (cwnd)** and may have at most \(\min(\text{cwnd}, \text{rwnd})\) bytes outstanding. It starts small and ramps via **slow start**, doubling cwnd each round-trip until a threshold, then switches to **congestion avoidance**, the additive-increase / multiplicative-decrease (**AIMD**) regime: each RTT without loss adds one segment, \[ \text{cwnd} \mathrel{+}= \text{MSS}, \] and a loss event halves it, \[ \text{cwnd} \leftarrow \tfrac{1}{2}\,\text{cwnd}. \] AIMD makes competing flows converge toward a fair share while continuously probing for spare bandwidth.

## complexity
time: Per-segment work is O(1): match an ACK against the send buffer, slide the window, update cwnd. Loss recovery is bounded by the round-trip time — a timeout costs at least one RTO, fast retransmit about one RTT.
space: O(W) buffering on each side, where W is the window in bytes — the sender holds unacknowledged data for possible resend, the receiver holds out-of-order segments until the gap fills.
notes: Throughput is roughly window ÷ RTT, so a high round-trip time caps speed even on a fast link until the window grows (the bandwidth-delay product). Treating non-congestion loss (lossy Wi-Fi) as congestion needlessly halves cwnd.

## pitfalls
- Confusing the sequence number with the ACK number. Seq labels the first byte *in this segment*; ACK is the *next* byte the receiver wants (everything below it is confirmed). Off-by-one here — forgetting the SYN itself consumes one sequence number, so the first ACK is seq+1 — breaks every hand-traced example.
- Assuming ACKs are per-segment. They are **cumulative**: an ACK for byte 5000 confirms all bytes below 5000 at once, and a lost ACK is covered by the next one. Do not model a missing ACK as a missing segment.
- Believing TCP guarantees timing or message boundaries. It guarantees ordered, complete *bytes* — not low latency, and not that one `send()` maps to one `recv()`. The stream can be re-chunked arbitrarily; application framing is your job.
- Treating all packet loss as congestion. TCP's congestion control halves cwnd on loss, so a lossy wireless link (loss unrelated to load) silently cripples throughput. This is a real-world performance trap, not a correctness bug.
- Forgetting flow control and congestion control are separate limits. Bytes in flight are bounded by \(\min(\text{rwnd}, \text{cwnd})\) — a huge receive window does nothing if cwnd is small after a loss, and vice versa.

## interviewTips
- Be able to draw the three-way handshake with concrete numbers and explain why it is three messages, not two: both directions must synchronize sequence numbers and confirm the other side is reachable before data flows.
- When asked how TCP detects loss, name both paths — the retransmission timeout (RTO, timer-based, slower) and fast retransmit on three duplicate ACKs (faster, no timer) — and say which is quicker and why.
- Contrast TCP and UDP in one breath: TCP gives ordered, reliable, flow- and congestion-controlled byte streams at the cost of setup latency and head-of-line blocking; UDP gives bare, unordered datagrams with no guarantees but minimal overhead — right for real-time media, DNS, and games.

## keyTakeaways
- The three-way handshake (SYN, SYN-ACK, ACK) synchronizes both sides' starting sequence numbers; from then on, sequence numbers label byte positions and cumulative ACKs confirm "everything below this byte arrived."
- Reliability comes from retransmission on a timeout (RTO) or on three duplicate ACKs (fast retransmit); the sliding window plus the receiver's advertised window provide ordered delivery and flow control.
- Bytes in flight are capped by \(\min(\text{cwnd}, \text{rwnd})\); congestion control ramps cwnd via slow start then AIMD (add one segment per RTT, halve on loss), converging toward a fair, network-friendly rate.

## code.python
```python
# A tiny sliding-window / seq-ack simulator: sender, lossy channel, cumulative-ACK receiver.
def simulate(data_len, mss=500, lose=frozenset()):
    # bytes are numbered 1..data_len; segment k covers [1+(k-1)*mss, k*mss]
    n_segs = (data_len + mss - 1) // mss
    expected = 1            # receiver: next in-order byte it wants
    delivered = 0
    rounds = 0
    seg = 1
    while expected <= data_len:
        rounds += 1
        seq = 1 + (seg - 1) * mss
        length = min(mss, data_len - seq + 1)
        if seg in lose:
            # packet dropped: receiver still wants `expected`, sender will retransmit
            lose = lose - {seg}          # assume it gets through on retry
            continue
        if seq == expected:              # in order -> advance cumulative ACK
            expected = seq + length
            delivered = expected - 1
            seg += 1
        ack = expected                   # what the receiver reports back
        print(f"seq={seq:<5} len={length:<4} -> ACK={ack}")
    return delivered, rounds

got, rounds = simulate(2000, mss=500, lose={3})  # lose the 3rd segment once
print(f"delivered {got} bytes in {rounds} transmissions")
```

## code.javascript
```javascript
// Minimal TCP echo server + client using Node's net module (real sockets, real handshake).
const net = require('net');

const server = net.createServer((sock) => {
  // each `sock` is a reliable ordered byte stream; chunks may not equal sends
  sock.on('data', (buf) => sock.write(`echo:${buf.toString()}`));
});

server.listen(9009, () => {
  const client = net.connect(9009, '127.0.0.1', () => {
    client.write('hello');           // TCP numbers, acks, and retransmits for us
    client.write('world');
  });
  client.on('data', (buf) => {
    console.log('client got', buf.toString());
    client.end();
    server.close();
  });
});
```

## code.java
```java
// Blocking TCP echo: ServerSocket accepts a connection, Socket carries the byte stream.
import java.io.*;
import java.net.*;

public class TcpEcho {
    public static void main(String[] args) throws IOException {
        try (ServerSocket server = new ServerSocket(9010)) {
            // client side, started inline so the demo is self-contained
            new Thread(() -> {
                try (Socket c = new Socket("127.0.0.1", 9010)) {   // 3-way handshake here
                    c.getOutputStream().write("ping\n".getBytes());
                    c.getOutputStream().flush();
                    byte[] buf = new byte[64];
                    int n = c.getInputStream().read(buf);
                    System.out.println("client got: " + new String(buf, 0, n).trim());
                } catch (IOException e) { e.printStackTrace(); }
            }).start();

            try (Socket conn = server.accept()) {
                int b; var out = conn.getOutputStream();
                while ((b = conn.getInputStream().read()) != -1) {
                    out.write(b);                                  // echo each byte back
                    if (b == '\n') break;
                }
                out.flush();
            }
        }
    }
}
```

## code.cpp
```cpp
// The Internet checksum (RFC 1071): 16-bit one's-complement sum, used by TCP/IP headers.
#include <cstdint>
#include <cstddef>
#include <iostream>

uint16_t checksum(const uint8_t* data, size_t len) {
    uint32_t sum = 0;
    for (size_t i = 0; i + 1 < len; i += 2)                 // sum 16-bit words
        sum += (uint32_t(data[i]) << 8) | data[i + 1];
    if (len & 1) sum += uint32_t(data[len - 1]) << 8;       // odd trailing byte
    while (sum >> 16) sum = (sum & 0xFFFF) + (sum >> 16);   // fold carries back in
    return uint16_t(~sum);                                  // one's complement
}

int main() {
    uint8_t segment[] = {0x45, 0x00, 0x00, 0x28, 0x1c, 0x46};
    std::cout << std::hex << checksum(segment, sizeof segment) << "\n";
    // receiver recomputes over header+data; a non-zero result means corruption -> drop
}
```
