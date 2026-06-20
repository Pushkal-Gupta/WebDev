---
slug: http3-streams-and-multiplexing
module: cs-network-protocols
title: HTTP/3 Streams, QPACK, and Datagrams
subtitle: How HTTP/3 maps onto QUIC — unidirectional vs bidirectional streams, QPACK encoder/decoder streams, priority, and the RFC 9221 datagram extension.
difficulty: Advanced
position: 72
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "RFC 9114 — HTTP/3"
    url: "https://datatracker.ietf.org/doc/html/rfc9114"
    type: spec
  - title: "RFC 9204 — QPACK: Field Compression for HTTP/3"
    url: "https://datatracker.ietf.org/doc/html/rfc9204"
    type: spec
  - title: "RFC 9221 — An Unreliable Datagram Extension to QUIC"
    url: "https://datatracker.ietf.org/doc/html/rfc9221"
    type: spec
  - title: "Cloudflare — HTTP/3: the past, the present, and the future"
    url: "https://blog.cloudflare.com/http3-the-past-present-and-future/"
    type: blog
status: published
---

## intro
HTTP/3 is the mapping of HTTP semantics onto QUIC streams. Where HTTP/2 invented its own frame layer and stream IDs because TCP gave it one byte stream, HTTP/3 inherits streams directly from QUIC and only defines what each stream type carries. Request/response pairs live on client-initiated bidirectional streams; control, encoder, and decoder traffic live on unidirectional streams. QPACK replaces HPACK because HPACK's stateful index table required strict ordering — exactly what QUIC's per-stream loss recovery breaks.

## whyItMatters
The HTTP/2-to-HTTP/3 transition is not a wire-format facelift — it is a re-mapping that touches header compression, priority, push, and connection-level binding. Knowing which stream a SETTINGS frame goes on, why QPACK has two separate encoder/decoder streams, and how datagrams (RFC 9221) let you tunnel UDP through HTTP/3 without paying for stream reliability is exactly what platform-team interviews probe. Cloudflare, Meta, Google, and Apple ship HTTP/3 by default on hot paths; WebTransport, MASQUE, and tunneling proxies all build on the same primitives.

## intuition
QUIC gives you four flavors of streams identified by the two least-significant bits of the stream ID: client-initiated bidirectional (`...00`), server-initiated bidirectional (`...01`), client-initiated unidirectional (`...10`), and server-initiated unidirectional (`...11`). HTTP/3 uses client-initiated bidirectional streams for one request/response each — open a new stream, send `HEADERS` then `DATA`, the server sends `HEADERS` then `DATA` back, both halves close. Each request is its own stream, so loss on one does not stall another. Server push and control plane live on unidirectional streams.

Every endpoint opens three persistent unidirectional streams at the start: the control stream (type 0x00), the QPACK encoder stream (type 0x02), and the QPACK decoder stream (type 0x03). The control stream carries `SETTINGS`, `GOAWAY`, and `PRIORITY_UPDATE` frames. The two QPACK streams carry dynamic-table updates and acknowledgments. They are unidirectional because the protocol direction is fixed by stream type — a client's encoder stream feeds the server's decoder, and vice versa.

QPACK is the heart of the mapping problem. HPACK in HTTP/2 used a shared dynamic table indexed by insertion order, and headers on stream N could reference table entries added by a frame on stream M earlier in the byte stream. That ordering does not exist in HTTP/3 — stream M's update might arrive after stream N's reference. QPACK fixes this by allowing the encoder to insert into the dynamic table without blocking; references are tagged with the *required insert count*, and a decoder that receives a header block referencing entries it has not yet seen *blocks that single stream* until the encoder-stream update catches up. The other streams keep flowing. The encoder may also choose to never reference the dynamic table for a given block, eliminating blocking entirely at the cost of more bytes.

HTTP/2 priority was a tree of weighted nodes — a complex spec that almost nobody implemented correctly. HTTP/3 deprecated it and added `Priority` headers plus `PRIORITY_UPDATE` frames (RFC 9218) that signal urgency (0–7) and incremental (yes/no) per stream. Simpler, smaller, actually deployed.

Datagrams (RFC 9221) add a non-stream message type. A `DATAGRAM` frame inside a QUIC packet is unreliable — no retransmission, no per-message ordering — but it inherits the connection's encryption and congestion control. HTTP/3 datagrams (RFC 9297) layer onto this to give you UDP-like semantics inside an HTTP/3 connection. MASQUE proxies, WebTransport sessions, and real-time media all use this to avoid the latency of stream reliability when the payload itself is loss-tolerant.

## visualization
```
  QUIC connection (one client → one server)
  ┌─────────────────────────────────────────────────────────────────┐
  │  Stream 0  (client-init bidi)  : Request 1 — HEADERS, DATA       │
  │  Stream 4  (client-init bidi)  : Request 2 — HEADERS, DATA       │
  │  Stream 8  (client-init bidi)  : Request 3 — HEADERS, DATA       │
  │                                                                   │
  │  Stream 2  (client-init uni)   : control       — SETTINGS, GOAWAY │
  │  Stream 6  (client-init uni)   : QPACK encoder — inserts          │
  │  Stream 10 (client-init uni)   : QPACK decoder — acks/cancels     │
  │                                                                   │
  │  Stream 3  (server-init uni)   : server control                   │
  │  Stream 7  (server-init uni)   : server QPACK encoder             │
  │  Stream 11 (server-init uni)   : server QPACK decoder             │
  │                                                                   │
  │  DATAGRAM frames (RFC 9221)    : unreliable, no stream            │
  └─────────────────────────────────────────────────────────────────┘
        ↑ packet loss on Stream 4 does NOT block Streams 0 or 8
```

## bruteForce
The brute-force alternative is HTTP/2 over TCP+TLS, which is what most of the web ran until 2022. It multiplexes streams at the HTTP layer but rides on a single TCP byte stream, so one lost segment blocks delivery of every stream past that segment's offset. HPACK references the dynamic table by insertion order, which works only because TCP guarantees in-order delivery. Priority is a complex weighted tree most implementations got wrong. PUSH_PROMISE exists but is being deprecated because nobody got cache invalidation right. The whole stack works but each layer is fighting against the transport beneath it.

## optimal
HTTP/3's optimization is to push every stream-level concern down into QUIC and only define what the bytes mean. Each request is one QUIC stream, full stop — loss on one stream does not stall another, and stream-level flow control is QUIC's `MAX_STREAM_DATA` mechanism. The HTTP/3 frame types are minimal: `HEADERS` carries QPACK-encoded headers, `DATA` carries body bytes, `SETTINGS` carries connection-level parameters (control stream only), `GOAWAY` signals shutdown, `PUSH_PROMISE` carries server push (with a stream ID for the pushed response), `MAX_PUSH_ID` and `CANCEL_PUSH` manage push, and `RESERVED` slots forbid grease values from being mistaken for new frame types.

QPACK's encoder/decoder split is the cleverest piece. The encoder controls the dynamic table — it inserts entries on its encoder stream, and the decoder acknowledges them on its decoder stream so the encoder knows when an entry has been received and can be referenced without blocking. A header block can either reference only the static table (61 entries shared by all HTTP/3 implementations) plus literals (zero blocking risk), or reference dynamic-table entries with a "required insert count" that says "before decoding this block, ensure the dynamic table has at least N entries." If the decoder has not yet processed those inserts, only *that one stream* blocks — every other stream keeps decoding. Implementations choose how aggressively to use the dynamic table: aggressive saves bytes, conservative avoids HoL within a stream.

Datagrams shift the design space further. A WebTransport session is one bidirectional stream plus a flow of datagrams, all sharing the connection's congestion controller and encryption. The application chooses whether a payload goes on the reliable stream or the unreliable datagram channel. For game state updates or audio frames, datagrams give you UDP semantics without giving up the connection's authentication or NAT-traversal properties.

## complexity
QPACK encoding is O(n + h) per header block where n is the static-table lookup (constant 61 entries via a precomputed hash) and h is the number of headers in the block. Dynamic-table inserts are O(1) amortized. Decoder blocking is bounded by the encoder-stream backlog. Frame parsing is O(L) in the payload bytes. Per-connection memory is dominated by the dynamic table (`SETTINGS_QPACK_MAX_TABLE_CAPACITY`, often 4–16KB), per-stream buffers, and the congestion controller. Throughput on a single connection scales with `min(BDP, sum of stream credits)`, just like QUIC underneath. Datagram delivery is O(1) per frame — no retransmit, no ordering buffer.

## pitfalls
- Sending HTTP/3 frames on the wrong stream type — `SETTINGS` belongs on the control stream only; sending it on a request stream is a protocol violation that closes the connection.
- Aggressive QPACK dynamic-table use creating per-stream HoL — if every header block requires inserts the decoder has not seen yet, every stream blocks until the encoder stream catches up. Tune dynamic-table aggressiveness based on observed RTT and loss.
- Treating HTTP/3 datagrams as reliable — they are not. Build retry / sequencing into the application if you need it. RFC 9221 is explicit: no retransmission, no ordering between datagrams.
- Forgetting that connection-level flow control still applies — opening 1000 streams does not give you unlimited throughput; the peer's `MAX_DATA` and `MAX_STREAMS` cap you.
- Assuming HTTP/2's PUSH_PROMISE semantics carry over — HTTP/3 push exists but is increasingly disabled by browsers (Chrome removed support in 2022). Do not design around server push.
- Misunderstanding stream ID parity — the low two bits encode initiator and bidi-ness, so consecutive IDs jump by 4, not by 1. A naive counter is wrong.

## interviewTips
- Enumerate the four stream types from the low two bits of the stream ID and which one carries requests.
- Explain why QPACK needed to replace HPACK: HPACK's insertion-order indexing assumes in-order delivery; QUIC's per-stream loss recovery breaks that.
- Know what `Priority` headers and `PRIORITY_UPDATE` frames do, and that HTTP/3 deprecated HTTP/2's dependency-tree priority.

## code
### python
```python
def encode_stream_id(initiator, direction, sequence):
    # initiator: 0=client, 1=server
    # direction: 0=bidi,    1=uni
    return (sequence << 2) | (direction << 1) | initiator

class Http3Connection:
    CONTROL_STREAM_TYPE = 0x00
    QPACK_ENCODER_TYPE  = 0x02
    QPACK_DECODER_TYPE  = 0x03

    def __init__(self, quic):
        self.quic = quic
        self.control_stream = quic.open_unidirectional()
        self.qpack_enc = quic.open_unidirectional()
        self.qpack_dec = quic.open_unidirectional()
        for s, t in [(self.control_stream, self.CONTROL_STREAM_TYPE),
                     (self.qpack_enc, self.QPACK_ENCODER_TYPE),
                     (self.qpack_dec, self.QPACK_DECODER_TYPE)]:
            s.send_varint(t)
        self.send_settings()

    def send_request(self, method, path, headers, body=b""):
        stream = self.quic.open_bidirectional()
        encoded, required_insert = qpack_encode(headers + [(":method", method),
                                                           (":path", path)])
        stream.send_frame(0x01, encoded)  # HEADERS
        if body:
            stream.send_frame(0x00, body)  # DATA
        return stream
```

### javascript
```javascript
function encodeStreamId(initiator, direction, seq) {
  return (BigInt(seq) << 2n) | (BigInt(direction) << 1n) | BigInt(initiator);
}

class Http3Connection {
  constructor(quic) {
    this.quic = quic;
    this.control = quic.openUnidirectional();
    this.qpackEnc = quic.openUnidirectional();
    this.qpackDec = quic.openUnidirectional();
    this.control.sendVarint(0x00);
    this.qpackEnc.sendVarint(0x02);
    this.qpackDec.sendVarint(0x03);
    this.sendSettings();
  }

  sendRequest(method, path, headers, body = new Uint8Array()) {
    const stream = this.quic.openBidirectional();
    const { encoded, requiredInsert } = qpackEncode([
      [':method', method],
      [':path', path],
      ...headers,
    ]);
    stream.sendFrame(0x01, encoded);
    if (body.length) stream.sendFrame(0x00, body);
    return stream;
  }
}
```

### java
```java
class Http3Connection {
    static final long CONTROL_STREAM_TYPE = 0x00;
    static final long QPACK_ENCODER_TYPE  = 0x02;
    static final long QPACK_DECODER_TYPE  = 0x03;

    final QuicConnection quic;
    final QuicStream control, qpackEnc, qpackDec;

    Http3Connection(QuicConnection quic) {
        this.quic = quic;
        this.control = quic.openUnidirectional();
        this.qpackEnc = quic.openUnidirectional();
        this.qpackDec = quic.openUnidirectional();
        control.sendVarint(CONTROL_STREAM_TYPE);
        qpackEnc.sendVarint(QPACK_ENCODER_TYPE);
        qpackDec.sendVarint(QPACK_DECODER_TYPE);
        sendSettings();
    }

    QuicStream sendRequest(String method, String path,
                           List<Header> headers, byte[] body) {
        QuicStream s = quic.openBidirectional();
        QpackEncoded e = Qpack.encode(headers, method, path);
        s.sendFrame(0x01, e.payload);
        if (body != null && body.length > 0) s.sendFrame(0x00, body);
        return s;
    }
}
```

### cpp
```cpp
constexpr uint64_t CONTROL_STREAM_TYPE = 0x00;
constexpr uint64_t QPACK_ENCODER_TYPE  = 0x02;
constexpr uint64_t QPACK_DECODER_TYPE  = 0x03;

struct Http3Connection {
    QuicConnection& quic;
    QuicStream control, qpack_enc, qpack_dec;

    explicit Http3Connection(QuicConnection& q)
      : quic(q),
        control(q.open_unidirectional()),
        qpack_enc(q.open_unidirectional()),
        qpack_dec(q.open_unidirectional())
    {
        control.send_varint(CONTROL_STREAM_TYPE);
        qpack_enc.send_varint(QPACK_ENCODER_TYPE);
        qpack_dec.send_varint(QPACK_DECODER_TYPE);
        send_settings();
    }

    QuicStream send_request(const std::string& method,
                            const std::string& path,
                            const std::vector<Header>& headers,
                            const std::vector<uint8_t>& body) {
        auto s = quic.open_bidirectional();
        auto encoded = qpack::encode(headers, method, path);
        s.send_frame(0x01, encoded);
        if (!body.empty()) s.send_frame(0x00, body);
        return s;
    }
};
```
