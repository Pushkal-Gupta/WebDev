---
slug: net-osi-tcpip-layers
module: computer-networks
title: The Layered Model & Encapsulation
subtitle: How a message is wrapped in headers descending the stack and unwrapped ascending at the receiver — OSI's seven layers against the TCP/IP four, and why layering exists at all.
difficulty: Beginner
position: 1
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Kurose & Ross — Computer Networking: A Top-Down Approach (companion site)"
    url: "https://gaia.cs.umass.edu/kurose_ross/index.php"
    type: book
  - title: "Cloudflare Learning Center — What is the OSI model?"
    url: "https://www.cloudflare.com/learning/network-layer/what-is-the-osi-model/"
    type: article
  - title: "RFC 1122 — Requirements for Internet Hosts: Communication Layers"
    url: "https://www.rfc-editor.org/rfc/rfc1122"
    type: spec
  - title: "RFC 1071 — Computing the Internet Checksum"
    url: "https://www.rfc-editor.org/rfc/rfc1071"
    type: spec
  - title: "Wikipedia — OSI model"
    url: "https://en.wikipedia.org/wiki/OSI_model"
    type: article
status: published
---

## intro
A network has to move bytes between two programs that may sit on opposite sides of the planet, over wires, fibre, and radio they know nothing about. No single piece of code could sanely handle everything from "render this web page" down to "hold the voltage high for 0.1 microseconds." So the work is split into **layers**, each solving one slice of the problem and trusting the layer beneath it for the rest. This lesson walks the layered model from the application down to the physical wire, shows how a message gets wrapped in headers on the way down (**encapsulation**) and unwrapped on the way up, and maps the seven-layer OSI reference model onto the four-layer TCP/IP stack the real Internet runs on.

## whyItMatters
Layering is the single idea that lets the Internet exist at scale and keep evolving. Because each layer talks only to the one directly above and below through a fixed interface, you can swap Wi-Fi for Ethernet without rewriting your browser, deploy a new application protocol without touching any router, and let HTTPS ride unchanged over IPv4 or IPv6. Every debugging session you will ever do — "is it DNS, the firewall, the TLS handshake, or the cable?" — is really an exercise in locating which layer broke, so the model is the mental map you navigate by. Interviewers lean on it because it is concrete and compositional: name the layers, say what each adds to the packet, and explain encapsulation, and you have demonstrated that you understand the architecture rather than memorising acronyms. The same layered-with-headers pattern reappears in tunnelling, VPNs, container networking, and message queues.

## intuition
Think about mailing a physical letter through an old-fashioned company. You write the message — that is all *you* care about. You hand it to a secretary who folds it into a company envelope with a department name on it. That goes to the mailroom, which puts it inside a courier pouch addressed to a city. The courier puts the pouch into a truck with a route number. At every stage someone wraps what they received inside a new container carrying exactly the addressing *their* stage needs, and nobody opens the inner layers — the truck driver never reads your letter, they only read the route number.

A network does precisely this. Your application produces **data** ("GET /index.html"). The transport layer wraps it in a header that names the source and destination *ports* and adds a checksum, turning it into a **segment**. The network layer wraps that in a header carrying the source and destination *IP addresses*, producing a **datagram** (packet) that any router can forward across the world. The link layer wraps that in a header with the next-hop *MAC address* plus a trailer for error detection, making a **frame** that one physical hop can carry. The physical layer turns the frame into **bits** — voltages, light pulses, radio.

The beautiful part is symmetry on the receiving side. The bits arrive, the link layer reads and strips its frame header, hands the datagram up; the network layer strips the IP header, hands the segment up; the transport layer strips its header and delivers the original data to the right application by port number. Each layer at the receiver reads only the header its peer wrote and ignores everything inside — **peer layers talk to each other** as if the layers below did not exist. That illusion of a direct conversation between equals, built on top of dumb wrapping and unwrapping, is the whole trick. Add a layer, change a wire, the conversation above never notices.

## visualization
```
Sender (encapsulate, top -> down)        PDU name        adds
  Application:  [ DATA ]                  data            message
  Transport:    [Th|  DATA ]              segment         ports + checksum
  Network:      [Nh|Th|  DATA ]           datagram        src/dst IP
  Link:         [Lh|Nh|Th| DATA |Lt]      frame           MAC + CRC trailer
  Physical:      1010110100101110...      bits            signal on the wire
                         |
                    ===  wire  ===  (routers forward the datagram)
                         |
Receiver (decapsulate, bottom -> up)
  Physical:      1010110100101110...      bits
  Link:         [Lh|Nh|Th| DATA |Lt] -> strip Lh,Lt  -> datagram
  Network:      [Nh|Th|  DATA ]      -> strip Nh      -> segment
  Transport:    [Th|  DATA ]         -> strip Th      -> data
  Application:  [ DATA ]             delivered to the right port
```

## bruteForce
The naive alternative is a single monolithic program that does everything: it knows the application's intent, computes routes, drives the network card, and times the electrical signalling, all in one tangled blob. This "works" for exactly one combination of app, network, and hardware. The moment you want a second application you reimplement reliability and addressing; switch from Ethernet to Wi-Fi and you rewrite the routing logic that should not have cared; a new physical medium forces edits all the way up to the application. There is no place to slot a router, because routing assumes nothing is standardised. The monolith is the baseline that layering exists to destroy: it conflates concerns that change at wildly different rates and for different reasons, so every change ripples through the whole stack.

## optimal
Layering replaces the monolith with a stack of independent modules joined by **narrow, stable interfaces**. Each layer offers a service to the one above and consumes the service of the one below, communicating with its **peer** on the other host through a header it prepends. This is **encapsulation**: descending the stack, every layer treats the entire unit handed down to it — header and all — as opaque **payload** and wraps it in its own header (the link layer also adds a trailer). The reverse, **decapsulation**, happens on receipt: each layer reads and removes its own header, then passes the inner payload up. The named units are **Protocol Data Units (PDUs)**: at transport a **segment** (TCP) or datagram (UDP), at the network layer an IP **datagram** / packet, at the link layer a **frame**, and on the wire just **bits**.

Two models describe this. The **OSI reference model** has seven layers — Application, Presentation, Session, Transport, Network, Data Link, Physical — a teaching and standards vocabulary. The **TCP/IP model** the real Internet runs has four: **Application** (HTTP, DNS, TLS — it folds OSI's application, presentation, and session together), **Transport** (TCP/UDP, ports, reliability), **Internet/Network** (IP, routing, addressing), and **Link** (Ethernet, Wi-Fi, often shown with Physical as one). The mapping is straightforward: OSI 5-6-7 collapse into TCP/IP's application layer, OSI 1-2 into its link layer, and transport and network correspond one-to-one. Knowing which model someone is using avoids the classic confusion about how many layers "really" exist.

Why this design wins: changes are localised. Routers only ever inspect and act on the network-layer header, so they need to understand IP and nothing about HTTP. A new physical medium plugs in under the link layer with everything above untouched. A new application is just new code above an unchanged transport. The cost is small per-packet overhead (each header is bytes you must send) and the occasional **layering violation** where performance pressure leaks information across a boundary — but the modularity those interfaces buy is what let the Internet survive forty years of hardware and application churn without a redesign.

## complexity
time: Encapsulation and decapsulation are O(L) in the number of layers (a small constant, four or five) per packet — each layer does O(1) header work plus, where present, an O(n) pass over the n payload bytes to compute or verify a checksum.
space: Each layer adds a fixed-size header (and the link layer a trailer), so total overhead is O(L) bytes per packet on top of the payload; the headers shrink usable payload, which is why the link layer's MTU caps datagram size.
notes: Per-byte work like the Internet checksum dominates the constant factor; header parsing is branch-light and cheap. The dominant real cost is not CPU but the round trips and queueing the layered protocols incur, not the wrapping itself.

## pitfalls
- Confusing the OSI seven-layer model with the TCP/IP four-layer model and arguing about the "right" count. They are two descriptions of the same architecture; OSI's presentation and session layers are folded into TCP/IP's application layer, so a feature OSI puts in layer 6 lives in the application layer on the real Internet.
- Mixing up the PDU names. Data becomes a **segment** at transport, a **datagram/packet** at the network layer, and a **frame** at the link layer — calling an IP packet a "frame" or a TCP segment a "datagram" signals you have not internalised which layer adds what.
- Believing a layer reads the inner layers' headers. Each layer reads only its own peer's header and treats everything inside as opaque payload; a router inspecting the network header does not and should not parse the transport header to forward a packet.
- Forgetting that the link layer adds a **trailer** (a CRC for error detection), not just a header. Encapsulation is usually drawn as header-only, but the frame wraps the payload on both sides.
- Assuming encapsulation is free. Every layer's header costs bytes, and because the link layer's MTU bounds frame size, large transport messages must be split (segmentation / IP fragmentation) to fit — ignore this and you get silent path-MTU black holes.

## interviewTips
- When asked to "explain the network stack," go top-down and name what each layer adds: application = the data, transport = ports plus reliability, network = IP addresses and routing, link = MAC addressing and error-checking framing, physical = bits on the medium. Tie each to its PDU name.
- Define encapsulation crisply: each layer wraps the unit from above as opaque payload inside its own header, the receiver's peer layer strips exactly that header. Mention decapsulation as the symmetric ascent to show you understand both directions.
- If pushed on OSI versus TCP/IP, say the Internet runs the four-layer TCP/IP model and that OSI's presentation and session layers collapse into its application layer — then note routers operate at the network layer and switches at the link layer, which is the practical payoff of the model.

## keyTakeaways
- Networks are built as a stack of layers joined by narrow stable interfaces; each layer serves the one above, consumes the one below, and talks logically to its peer on the other host through a header it prepends.
- Encapsulation wraps the message in a header at every layer descending the stack (data to segment to datagram to frame to bits), and decapsulation strips them in reverse on receipt — each layer reading only its own header and treating the rest as opaque payload.
- OSI's seven layers and TCP/IP's four describe the same architecture; the real Internet runs TCP/IP, where application folds OSI's top three layers and link folds its bottom two, while transport and network map one-to-one.

## code.python
```python
# Build a layered packet by encapsulation, then decapsulate it back.
# Each layer prepends a header; the link layer also appends a trailer (a checksum).

def internet_checksum(data: bytes) -> int:
    # RFC 1071 one's-complement sum of 16-bit words.
    # sum = sum_i word_i, folded; result = ~sum & 0xFFFF
    if len(data) % 2:
        data += b"\x00"
    total = 0
    for i in range(0, len(data), 2):
        total += (data[i] << 8) | data[i + 1]
    while total >> 16:                      # fold carries back in
        total = (total & 0xFFFF) + (total >> 16)
    return (~total) & 0xFFFF

def encapsulate(message: str):
    data = message.encode()
    seg = b"PORT=443|" + data                       # transport -> segment
    dgram = b"SRC=10.0.0.1 DST=93.184.216.34|" + seg  # network -> datagram
    body = b"MAC=aa:bb:cc|" + dgram                  # link header
    frame = body + b"|CRC=" + format(internet_checksum(body), "04x").encode()
    return frame                                     # link -> frame (with trailer)

def decapsulate(frame: bytes) -> str:
    body, crc = frame.rsplit(b"|CRC=", 1)
    assert internet_checksum(body) == int(crc, 16), "frame corrupted"
    dgram = body.split(b"|", 1)[1]                   # strip link header
    seg = dgram.split(b"|", 1)[1]                    # strip network header
    data = seg.split(b"|", 1)[1]                     # strip transport header
    return data.decode()

frame = encapsulate("GET /index.html")
print(frame)
print(decapsulate(frame))                            # GET /index.html
```

## code.javascript
```javascript
// Encapsulate a message down the stack, then strip headers back up.
function internetChecksum(bytes) {
  // RFC 1071: one's-complement sum of 16-bit words, carries folded in.
  let total = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    const word = (bytes[i] << 8) | (bytes[i + 1] || 0);
    total += word;
    total = (total & 0xffff) + (total >> 16); // fold each step
  }
  return (~total) & 0xffff;
}

function encapsulate(message) {
  const enc = new TextEncoder();
  let unit = message; // application data
  unit = `PORT=443|${unit}`; // transport -> segment
  unit = `SRC=10.0.0.1 DST=93.184.216.34|${unit}`; // network -> datagram
  const body = `MAC=aa:bb:cc|${unit}`; // link header
  const crc = internetChecksum(enc.encode(body)).toString(16).padStart(4, "0");
  return `${body}|CRC=${crc}`; // frame (header + trailer)
}

function decapsulate(frame) {
  const cut = frame.lastIndexOf("|CRC=");
  const body = frame.slice(0, cut);
  const crc = frame.slice(cut + 5);
  const ok = internetChecksum(new TextEncoder().encode(body))
    .toString(16).padStart(4, "0") === crc;
  if (!ok) throw new Error("frame corrupted");
  // strip link, network, transport headers in turn
  return body.split("|").slice(3).join("|");
}

const frame = encapsulate("GET /index.html");
console.log(frame);
console.log(decapsulate(frame)); // GET /index.html
```

## code.java
```java
// Encapsulation down the layers + an RFC 1071 Internet checksum.
public class Encapsulation {
    static int internetChecksum(byte[] data) {
        int total = 0;
        for (int i = 0; i < data.length; i += 2) {
            int hi = data[i] & 0xFF;
            int lo = (i + 1 < data.length) ? (data[i + 1] & 0xFF) : 0;
            total += (hi << 8) | lo;
            total = (total & 0xFFFF) + (total >>> 16); // fold carries
        }
        return (~total) & 0xFFFF;
    }

    static String encapsulate(String message) {
        String seg = "PORT=443|" + message;                       // segment
        String dgram = "SRC=10.0.0.1 DST=93.184.216.34|" + seg;    // datagram
        String body = "MAC=aa:bb:cc|" + dgram;                     // link header
        String crc = String.format("%04x",
            internetChecksum(body.getBytes()));
        return body + "|CRC=" + crc;                               // frame
    }

    static String decapsulate(String frame) {
        int cut = frame.lastIndexOf("|CRC=");
        String body = frame.substring(0, cut);
        String crc = frame.substring(cut + 5);
        if (!String.format("%04x", internetChecksum(body.getBytes())).equals(crc))
            throw new IllegalStateException("frame corrupted");
        String[] parts = body.split("\\|", 4);     // drop link/net/transport
        return parts[3];
    }

    public static void main(String[] args) {
        String frame = encapsulate("GET /index.html");
        System.out.println(frame);
        System.out.println(decapsulate(frame)); // GET /index.html
    }
}
```

## code.cpp
```cpp
// Internet checksum (RFC 1071) + layered encapsulation/decapsulation.
#include <iostream>
#include <string>
#include <cstdint>
using namespace std;

uint16_t internetChecksum(const string& data) {
    uint32_t total = 0;
    for (size_t i = 0; i < data.size(); i += 2) {
        uint16_t hi = (uint8_t)data[i];
        uint16_t lo = (i + 1 < data.size()) ? (uint8_t)data[i + 1] : 0;
        total += (hi << 8) | lo;
        total = (total & 0xFFFF) + (total >> 16);  // fold carries
    }
    return (uint16_t)(~total & 0xFFFF);
}

string toHex4(uint16_t v) {
    char buf[8];
    snprintf(buf, sizeof(buf), "%04x", v);
    return string(buf);
}

string encapsulate(const string& message) {
    string seg   = "PORT=443|" + message;                      // segment
    string dgram = "SRC=10.0.0.1 DST=93.184.216.34|" + seg;    // datagram
    string body  = "MAC=aa:bb:cc|" + dgram;                    // link header
    return body + "|CRC=" + toHex4(internetChecksum(body));    // frame
}

string decapsulate(const string& frame) {
    size_t cut = frame.rfind("|CRC=");
    string body = frame.substr(0, cut);
    string crc  = frame.substr(cut + 5);
    if (toHex4(internetChecksum(body)) != crc) throw runtime_error("corrupt");
    // strip link, network, transport headers (3 leading '|' fields)
    size_t p = 0;
    for (int i = 0; i < 3; ++i) p = body.find('|', p) + 1;
    return body.substr(p);
}

int main() {
    string frame = encapsulate("GET /index.html");
    cout << frame << "\n" << decapsulate(frame) << "\n"; // GET /index.html
}
```
