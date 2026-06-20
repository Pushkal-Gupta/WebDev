---
slug: quic-internals
module: cs-network-protocols
title: QUIC Internals — Handshake, Streams, Migration
subtitle: 1-RTT and 0-RTT handshakes, per-stream loss recovery, the three packet number spaces, and per-path congestion control during connection migration.
difficulty: Advanced
position: 70
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "RFC 9000 — QUIC: A UDP-Based Multiplexed and Secure Transport"
    url: "https://datatracker.ietf.org/doc/html/rfc9000"
    type: spec
  - title: "RFC 9002 — QUIC Loss Detection and Congestion Control"
    url: "https://datatracker.ietf.org/doc/html/rfc9002"
    type: spec
  - title: "Cloudflare — The Road to QUIC"
    url: "https://blog.cloudflare.com/the-road-to-quic/"
    type: blog
status: published
---

## intro
QUIC is a transport that carries TLS 1.3 inside its own framing, runs on UDP, and exposes streams whose loss recovery is decoupled from each other. The interesting mechanics live below the handshake summary: how 0-RTT keys are derived from a resumption ticket, why three separate packet number spaces exist (Initial, Handshake, Application), how a stream-level FIN differs from a connection close, and what actually happens to congestion state when a client's IP changes mid-flight.

## whyItMatters
Knowing "QUIC fixes head-of-line blocking" gets you through one interview question. Knowing why connection migration starts a *fresh* congestion controller on the new path, why 0-RTT data must be idempotent, and which packet number space a `CRYPTO` frame for the handshake lives in — that is the difference between a candidate who has read about QUIC and one who can debug a production incident. Every CDN, every modern mobile API gateway, and every gRPC-over-HTTP/3 deployment now leans on these mechanics. Loss-detection tuning, anti-amplification limits, and path validation are also where most subtle bugs (and CVEs) hide.

## intuition
Think of a QUIC connection as three cryptographically separate pipes that share a wire. Each pipe is a *packet number space*: Initial, Handshake, and Application (1-RTT). Packets in each space have their own monotonically increasing numbers, their own ACK ranges, and their own keys. The Initial space carries the ClientHello and the first ServerHello; the Handshake space carries the rest of TLS; the Application space carries everything after — including all the user streams. Why split? Because keys for the later spaces do not exist when the earlier packets are sent, and because acknowledging an Initial packet must not require possession of Application keys.

Inside the Application space, QUIC layers *streams* as a higher-level abstraction. Each stream is a sequence of `STREAM` frames carrying bytes with offsets. The stream itself is reliable and ordered, but two different streams are independent — losing a `STREAM` frame on stream 4 only stalls stream 4, because the receiver can deliver bytes from stream 8 as soon as they arrive. This is the actual mechanism behind "no head-of-line blocking at the transport." TCP cannot do this because there is one byte stream and one sequence space.

0-RTT works by reusing the PSK and `early_secret` from a previous session. The client encrypts application data under keys derived from that PSK and sends it inside the very first flight. The server can read it before completing the handshake. The catch is replay: an attacker who captured the 0-RTT packets can resend them and the server cannot tell the difference, so applications must treat 0-RTT data as at-most-once-idempotent. `GET /resource` is fine; `POST /charge` is not.

Connection migration is enabled by the *connection ID*. Each endpoint advertises a pool of connection IDs the peer may use. When the client's source address changes, packets keep arriving with a known connection ID, the server initiates path validation (sends a `PATH_CHALLENGE` containing 8 random bytes, expects a `PATH_RESPONSE` with the same bytes back over the new path), and on success the new path becomes active. Crucially, RFC 9002 mandates that the congestion controller resets on the new path — the old RTT and `cwnd` estimates are not valid for a different network, so the sender starts from `IW` (initial window) and probes again. Forgetting this is a common subtle bug in homegrown QUIC stacks.

## visualization
```
  Client                                Server
    │                                     │
    │── Initial[CRYPTO(ClientHello)] ────▶│   (PN space: Initial)
    │                                     │
    │◀── Initial[CRYPTO(ServerHello)]  ───│
    │◀── Handshake[CRYPTO(EE,Cert,Fin)] ──│   (PN space: Handshake)
    │                                     │
    │── Handshake[CRYPTO(Finished)] ─────▶│
    │── 1-RTT[STREAM(GET /index)] ───────▶│   (PN space: Application)
    │                                     │
    │◀── 1-RTT[STREAM(200 OK …)] ─────────│
    │                                     │
                 ── IP change ──
    │── 1-RTT[STREAM …] from new addr ───▶│
    │◀── 1-RTT[PATH_CHALLENGE(rand8)] ────│
    │── 1-RTT[PATH_RESPONSE(rand8)] ─────▶│   cwnd, RTT reset for new path
```

## bruteForce
The "brute force" alternative to QUIC's design is what TCP + TLS already gives you: one byte stream, one congestion controller, one set of keys after a two-round-trip setup. It works, but every shortcoming QUIC fixes is on display — a single drop blocks every multiplexed request, the four-tuple binding kills the connection on any IP change, and the handshake costs 2 RTT for new sessions and 1 RTT for resumed ones. Running HTTP/2 over this stack gives you stream multiplexing at the application layer with no underlying protection from head-of-line blocking.

## optimal
QUIC's optimization is structural: separate the concerns that TCP fused. Streams get their own reliability and flow control, so loss on one does not stall others. Crypto gets its own packet number space per epoch, so handshake and application traffic can be processed independently and the early flights cannot leak into the later keys' replay-protection window. Connection identity gets its own field (the connection ID), so the IP/port tuple becomes a hint rather than a binding. Each of these is a deliberate inversion of a TCP assumption.

Loss detection in RFC 9002 is per-packet-number-space and uses a packet-threshold *and* a time-threshold to declare loss. Packets are declared lost when (a) they were sent more than `kPacketThreshold` (default 3) packets before the largest acknowledged in the same space, or (b) the time since they were sent exceeds `max(srtt + 4*rttvar, kGranularity) * timeThreshold`. This catches both reordering-tolerant losses and tail losses that ACKs alone would miss. When a path migration happens, both the RTT estimator and the congestion controller are re-initialized for the new path; the old path's state is *not* reused, because the new network's bandwidth and queueing behavior are unknown.

0-RTT is the resumption sprint. The client carries the resumed PSK and derives `early_traffic_secret` immediately, encrypts application data, and ships it in the first flight. The server replays the PSK derivation, decrypts, and processes. RFC 9001 requires servers to limit the damage from replay by either (a) keeping a strike list of 0-RTT nonces within the resumption-ticket validity window, or (b) restricting 0-RTT to idempotent application semantics. The HTTP layer (RFC 9114) takes the second path: only safe methods may go in 0-RTT, and a server may respond with `425 Too Early` to force the client to retry over 1-RTT keys.

## complexity
Per-packet cost is dominated by AEAD (AES-GCM or ChaCha20-Poly1305) at roughly O(L) in payload bytes. The handshake completes in 1 RTT (new) or 0 RTT (resumed), versus TCP+TLS 1.3 at 2 RTT or 1 RTT — the saved round trip is the latency win. Loss detection is O(1) per ACK frame because ranges are processed as deltas. Stream flow control is O(1) per stream via `MAX_STREAM_DATA` credit updates, and connection-level flow control is O(1) via `MAX_DATA`. State per connection is dominated by the congestion controller plus per-stream buffers — typically tens of KB.

## pitfalls
- Treating 0-RTT data as ordinary application data — a replay attack will resend it. Only allow idempotent operations and gate non-idempotent ones behind `425 Too Early` or a 1-RTT requirement.
- Reusing congestion state across a path migration — RFC 9002 mandates a reset because the new network's capacity is unknown; copying `cwnd` or `srtt` from the old path can cause immediate loss.
- Ignoring the anti-amplification limit during the handshake — a server may send at most three times the bytes it has received from an unvalidated address. Forgetting this lets a DDoS reflector use your server.
- Mixing packet number spaces — a `CRYPTO` frame for the handshake epoch sent in an Application packet is a protocol violation. Each space has its own keys and PNs; they are not interchangeable.
- Forgetting that `MAX_STREAMS` is a per-connection limit advertised by the peer — opening more streams than the peer will accept silently stalls them until credit arrives.

## interviewTips
- Be ready to draw the three packet number spaces and explain why each needs its own keys and ACKs.
- Know the 0-RTT replay story cold: PSK reuse, `early_traffic_secret`, idempotency requirement, `425 Too Early`.
- Explain connection migration including path validation (`PATH_CHALLENGE`/`PATH_RESPONSE`) and the congestion-controller reset.

## code
### python
```python
class QuicConnection:
    def __init__(self, role):
        self.role = role
        self.packet_spaces = {
            'initial': PacketNumberSpace(),
            'handshake': PacketNumberSpace(),
            'application': PacketNumberSpace(),
        }
        self.streams = {}
        self.cid_pool = generate_connection_ids(8)
        self.path_state = {'validated': False, 'cwnd': INITIAL_WINDOW}

    def send(self, space_name, frames):
        space = self.packet_spaces[space_name]
        pn = space.next_packet_number()
        payload = encode_frames(frames)
        sealed = aead_encrypt(space.keys, pn, payload)
        space.in_flight[pn] = (frames, monotonic_time())
        udp_send(sealed)

    def on_ack(self, space_name, ack_ranges):
        space = self.packet_spaces[space_name]
        for pn in ack_ranges.iter_packets():
            space.in_flight.pop(pn, None)
        space.detect_loss()  # RFC 9002 packet+time threshold

    def on_path_change(self, new_addr):
        challenge = os.urandom(8)
        self.send('application', [PathChallenge(challenge)])
        self.path_state = {'validated': False, 'cwnd': INITIAL_WINDOW,
                           'challenge': challenge, 'addr': new_addr}
```

### javascript
```javascript
class QuicConnection {
  constructor(role) {
    this.role = role;
    this.spaces = {
      initial: new PacketNumberSpace(),
      handshake: new PacketNumberSpace(),
      application: new PacketNumberSpace(),
    };
    this.streams = new Map();
    this.path = { validated: false, cwnd: INITIAL_WINDOW };
  }

  send(spaceName, frames) {
    const space = this.spaces[spaceName];
    const pn = space.nextPacketNumber();
    const sealed = aeadEncrypt(space.keys, pn, encodeFrames(frames));
    space.inFlight.set(pn, { frames, sentAt: performance.now() });
    udpSend(sealed);
  }

  onAck(spaceName, ranges) {
    const space = this.spaces[spaceName];
    for (const pn of ranges) space.inFlight.delete(pn);
    space.detectLoss();
  }

  onPathChange(newAddr) {
    const challenge = crypto.getRandomValues(new Uint8Array(8));
    this.send('application', [{ type: 'PATH_CHALLENGE', data: challenge }]);
    this.path = { validated: false, cwnd: INITIAL_WINDOW, challenge, addr: newAddr };
  }
}
```

### java
```java
class QuicConnection {
    enum Space { INITIAL, HANDSHAKE, APPLICATION }
    Map<Space, PacketNumberSpace> spaces = new EnumMap<>(Space.class);
    Map<Long, Stream> streams = new HashMap<>();
    PathState path = new PathState();

    void send(Space space, List<Frame> frames) {
        PacketNumberSpace s = spaces.get(space);
        long pn = s.nextPacketNumber();
        byte[] sealed = aeadEncrypt(s.keys, pn, Frame.encode(frames));
        s.inFlight.put(pn, new Sent(frames, System.nanoTime()));
        Udp.send(sealed);
    }

    void onAck(Space space, AckRanges ranges) {
        PacketNumberSpace s = spaces.get(space);
        for (long pn : ranges) s.inFlight.remove(pn);
        s.detectLoss();
    }

    void onPathChange(InetSocketAddress newAddr) {
        byte[] challenge = new byte[8];
        new SecureRandom().nextBytes(challenge);
        send(Space.APPLICATION, List.of(new PathChallenge(challenge)));
        path = new PathState(newAddr, challenge, INITIAL_WINDOW);
    }
}
```

### cpp
```cpp
struct QuicConnection {
    enum Space { Initial, Handshake, Application };
    std::array<PacketNumberSpace, 3> spaces;
    std::unordered_map<uint64_t, Stream> streams;
    PathState path;

    void send(Space sp, std::vector<Frame> frames) {
        auto& s = spaces[sp];
        uint64_t pn = s.next_packet_number();
        auto sealed = aead_encrypt(s.keys, pn, encode_frames(frames));
        s.in_flight[pn] = {frames, now()};
        udp_send(sealed);
    }

    void on_ack(Space sp, const AckRanges& r) {
        auto& s = spaces[sp];
        for (auto pn : r) s.in_flight.erase(pn);
        s.detect_loss();
    }

    void on_path_change(const Endpoint& addr) {
        std::array<uint8_t,8> challenge; csprng(challenge.data(), 8);
        send(Application, { PathChallenge{challenge} });
        path = PathState{addr, challenge, INITIAL_WINDOW};
    }
};
```
