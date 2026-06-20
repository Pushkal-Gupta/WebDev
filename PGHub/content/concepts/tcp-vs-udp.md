---
slug: tcp-vs-udp
module: cs-network-protocols
title: TCP vs UDP
subtitle: TCP gives a reliable byte stream; UDP gives unreliable datagrams. Pick by what the application can tolerate.
difficulty: Beginner
position: 4
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Operating Systems: Three Easy Pieces"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Jepsen — Distributed-systems consistency analyses"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
TCP and UDP are the two transport protocols nearly every internet application uses. **TCP** turns the unreliable IP layer into a reliable, ordered, full-duplex byte stream — every byte arrives exactly once, in order, or the connection errors out. **UDP** is a thin wrapper over IP: best-effort datagrams, no ordering, no retries, minimal overhead.

## whyItMatters
You don't get to pick "fast and reliable" — those tradeoffs are baked into the choice. Web requests, SSH, DB connections, file transfers → TCP, because losing a byte ruins the response. Video calls, online games, DNS, NTP → UDP, because retransmitting a 100ms-old voice packet is worse than dropping it. Picking wrong means either head-of-line blocking or losing data the app couldn't recover.

## intuition
- **TCP** is like a phone call. You dial (handshake), the line stays open, every word gets through in order, dropped audio is retransmitted (with a delay penalty). When you hang up (FIN), the call is done.
- **UDP** is like dropping postcards in the mail. Some arrive, some don't, sometimes they arrive out of order. No setup, no teardown. Each postcard is independent. Cheap and fast — but it's on you if a postcard goes missing.

## visualization
```
TCP                                  UDP
─────────────────────                ─────────────────────
SYN ──►                              [packet 1] ──►
◄── SYN/ACK                          [packet 2] ──►   (no ACK, no retry, no order guarantee)
ACK ──►       ┐                      [packet 3] ──►
DATA stream   │ reliable, ordered
DATA stream   │
FIN ──►       ┘
◄── FIN/ACK
```

## bruteForce
Always use TCP. Works for 80% of apps. Hurts when latency matters more than reliability — video calls become a stutter-fest under packet loss because TCP refuses to deliver later bytes until lost bytes are retransmitted (head-of-line blocking).

## optimal
Pick by the question "what does a dropped packet do to my user?":

**Use TCP when**:
- Every byte matters: HTTP/1.1, SSH, DB protocols, file transfers, email.
- The application logic isn't designed to handle gaps or reorders.
- A reliable, full-duplex stream maps naturally to your conversation.

**Use UDP when**:
- Latency matters more than completeness: voice, video, gaming.
- Each message is independent and self-describing: DNS (one query, one response), NTP, mDNS, gossip protocols.
- You're building your own reliability on top (QUIC does this — it's UDP + TCP-like guarantees in user space).

**Modern hybrid (QUIC / HTTP/3)**: UDP underneath with built-in encryption, multiplexing, and reliability per stream — avoids HoL blocking while keeping TCP's guarantees per logical stream. Used by Google, Cloudflare, most modern HTTP/3 stacks.

## complexity
- **Connection setup**: TCP = 1.5 RTT handshake (SYN, SYN/ACK, ACK) before any data. UDP = 0 RTT.
- **Per-packet overhead**: TCP header 20 bytes minimum; UDP header 8 bytes.
- **Throughput**: TCP throughput is bounded by `window / RTT` — high latency hurts (use BBR / larger windows). UDP throughput is application-bounded.

## pitfalls
- **Choosing UDP and rebuilding TCP poorly**: ad-hoc retransmits, ordering, and congestion control are landmines. Use QUIC if you need both.
- **Holding TCP connections open with no traffic**: NAT timeouts drop them. Set keepalives.
- **MTU and IP fragmentation in UDP**: send packets > ~1400 bytes and they fragment, causing weird drops. Either fit under MTU or do app-level chunking.
- **Confusing "datagram" with "guaranteed delivery"** — UDP makes no such guarantee.
- **Firewalls**: many enterprise firewalls block UDP outbound — test before depending on it.

## interviewTips
- The classic frame: "TCP = reliability + order at the cost of latency; UDP = low overhead at the cost of reliability."
- Mention **head-of-line blocking** as TCP's weakness and **QUIC / HTTP/3** as the modern fix.
- For "design a video chat" — UDP for the media plane, TCP/HTTP for signaling.
- For "design DNS" — UDP for the common case (one query, one response, fits in 512 bytes), TCP fallback for large responses.

## code.python
```python
# UDP echo server — bare bones, no connection.
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.bind(("127.0.0.1", 9999))
while True:
    data, addr = s.recvfrom(1024)
    s.sendto(data, addr)
```

## code.javascript
```javascript
// TCP echo server (Node).
const net = require('net');
net.createServer(sock => {
  sock.on('data', d => sock.write(d));
}).listen(9999);
```

## code.java
```java
// UDP datagram send.
import java.net.*;
DatagramSocket s = new DatagramSocket();
byte[] buf = "hello".getBytes();
s.send(new DatagramPacket(buf, buf.length, InetAddress.getByName("127.0.0.1"), 9999));
```

## code.cpp
```cpp
// TCP client (POSIX sockets, simplified).
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
int fd = socket(AF_INET, SOCK_STREAM, 0);
sockaddr_in addr{ AF_INET, htons(9999) };
inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);
connect(fd, (sockaddr*)&addr, sizeof(addr));
write(fd, "hello", 5);
close(fd);
```
