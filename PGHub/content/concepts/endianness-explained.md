---
slug: endianness-explained
module: cs-tools-encodings
title: Endianness Explained
subtitle: Big-endian vs little-endian byte order, network byte order, and the htonl/ntohl family.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Operating Systems: Three Easy Pieces — Persistence chapters"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Little and Big Endian — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/computer-organization-architecture/little-and-big-endian-mystery/"
    type: blog
  - title: "TheAlgorithms/Python — bit manipulation"
    url: "https://github.com/TheAlgorithms/Python/tree/master/bit_manipulation"
    type: repo
status: published
---

## intro
A 32-bit integer like `0x12345678` is four bytes. The question "which byte comes first in memory?" has two reasonable answers. Big-endian stores the most significant byte first (`12 34 56 78`). Little-endian stores the least significant byte first (`78 56 34 12`). The choice is called endianness, and it matters whenever bytes cross machines, files, or protocols.

## whyItMatters
- **Every TCP/UDP packet on the public internet**: IP headers, port numbers, sequence numbers are all big-endian ("network byte order") per RFC 1700. A web server that forgets `htons()` on its bound port silently listens on a different port than configured.
- **Binary file formats**: PNG, ZIP, JPEG, ELF, Wave, MP4 — each spec pins byte order explicitly. PNG is big-endian, ZIP is little-endian; mismatching produces "file is corrupt" errors on cross-platform reads.
- **Java cross-platform binary I/O**: `DataInputStream.readInt` is big-endian by spec, regardless of host CPU, so JVM bytecode produced on x86 reads identically on ARM and PowerPC. Forgetting this when interop'ing with C produces silent corruption.
- **Database storage engines (Postgres, MySQL, SQLite)**: write integer keys in fixed endian (Postgres uses big-endian for B-tree comparison so `memcmp` orders correctly); a database file moved from x86 to PowerPC without conversion is unreadable.
- **Embedded systems and IoT**: ARM, x86 are little-endian; MIPS, PowerPC, SPARC default big-endian. Firmware that talks to multiple devices must convert at every boundary.
- **WebSockets binary frames, gRPC, MessagePack, CBOR**: protocol specs all pin byte order; a hand-rolled serialiser that skips the swap "because it works in dev" breaks in production the first time the receiver runs on different hardware.

The bug class is uniquely insidious because endianness mismatches are silent — the bytes parse, the integers just have the wrong value, and the symptom appears far from the cause.

## intuition
A 32-bit integer like `0x12345678` occupies four bytes in memory, but the standard does not dictate which byte goes first. The most-significant byte is `0x12`, the least-significant is `0x78`. Big-endian stores them in the human-reading order: `12 34 56 78` at addresses 0-1-2-3. Little-endian stores them reversed: `78 56 34 12`. Both representations encode the same number; the difference is purely about layout.

Why the disagreement exists is historical and architectural. Big-endian was the natural choice for early minicomputers (PDP-10, IBM System/360, Motorola 68k) because it matched how humans write numbers and made hex dumps readable. Little-endian (DEC PDP-11, Intel 8086, ARM in its default mode) won the x86 market and made arithmetic-circuit design slightly easier: low-byte first means addition can start from the LSB without knowing the word length. Neither is technically superior; the conventions persisted because changing them silently breaks every binary file on the planet.

The trap is that endianness is invisible until bytes cross a boundary. Within a single CPU, an `int*` dereference gives the correct value regardless of internal byte order — the CPU loads four bytes and reassembles them per its rules. When bytes leave the CPU — written to disk, sent over a socket, shared via memory-mapped IPC, parsed by a different process — the receiver must apply *its* rules, which may not match. Code that ran flawlessly for years on x86 produces nonsense the first day someone deploys it to a big-endian system (less common today but still found in mainframes, some routers, and certain embedded chips).

The mental model that helps most: treat byte order as a *boundary concern*, not a *type concern*. Inside your program, just use `int`. At the boundary — `fwrite`, `send`, `mmap`, `memcpy` to/from a serialised buffer — convert to the canonical order for that boundary's protocol. The networking world standardised on big-endian (called "network byte order" in BSD sockets) precisely because consistency at the boundary matters more than matching the host. The `htonl` / `htons` / `ntohl` / `ntohs` family hides the conversion: on little-endian hosts these are byte swaps (compiled to a single `bswap` instruction); on big-endian hosts they are no-ops the compiler elides entirely. Either way the code reads the same and runs correctly everywhere.

Bit-order within a byte is a separate question and almost never matters: normal CPU loads always present bits in the same order. Endianness only describes byte order. Don't confuse the two.

## optimal
At every byte-order boundary — disk, network, IPC, memory-mapped serialised buffers — convert to a canonical byte order. For network protocols, that canonical order is big-endian, codified as "network byte order" and exposed via `htonl` / `htons` / `ntohl` / `ntohs` in POSIX. For file formats, follow the format spec (PNG = big-endian, ZIP = little-endian). Inside your program, just use native types.

```python
import struct, socket

def write_u32_be(buf: bytearray, value: int) -> None:
    buf.extend(struct.pack(">I", value))         # ">" = big-endian, "I" = unsigned 32-bit

def read_u32_be(data: bytes, offset: int) -> int:
    return struct.unpack_from(">I", data, offset)[0]

def write_u32_le(buf: bytearray, value: int) -> None:
    buf.extend(struct.pack("<I", value))         # "<" = little-endian; ZIP, BMP, MP3 ID3

def network_send_port(sock, port: int) -> None:
    # socket.htons handles host-to-network swap; no manual bit-shifts needed
    sock.sendall(struct.pack("!H", port))        # "!" is alias for ">" (network = BE)

def bswap32(x: int) -> int:
    """Single-instruction byte swap on x86 — compiler emits BSWAP. Keep as fallback."""
    return ((x >> 24) & 0xFF) | ((x >> 8) & 0xFF00) \
         | ((x << 8) & 0xFF0000) | ((x << 24) & 0xFF000000)
```

Why optimal: the standard library functions delegate to single-cycle `bswap` (x86), `rev` (ARM), or `lwbrx`/`stwbrx` (PowerPC) instructions on modern CPUs, so the runtime cost is effectively zero — one CPU cycle on a pipelined load. Using `struct.pack`/`unpack` in Python (or `DataView` in JS, `ByteBuffer.order(ByteOrder.BIG_ENDIAN)` in Java) makes the byte order *explicit at the call site*, which is the only way to prevent the "works on my machine" class of bugs. The cost of explicit conversion is one extra CPU instruction per integer; the cost of skipping it is a multi-day debugging session on a customer's PowerPC server.

Three discipline rules that prevent the entire bug class: (1) at every boundary, *always* specify the byte order — never `int.to_bytes(4)` without an explicit `byteorder=` argument, never `memcpy` from an integer to a network buffer without conversion; (2) treat `htonl` / `ntohl` as idempotent at compile time on big-endian hosts (the compiler removes them); using them costs nothing in production and saves you the day someone deploys to MIPS; (3) for floats and doubles, IEEE 754 layouts also have endianness — `struct.pack(">d", x)` and `struct.pack("<d", x)` produce different byte sequences for the same value, and forgetting this corrupts cross-platform binary scientific data; (4) for cross-language IPC, prefer self-describing formats (Protobuf, MessagePack, CBOR) over hand-rolled binary — they encode endianness in the format spec, not in your code. JSON, XML, and other text formats sidestep the issue entirely; only binary formats force the question, and they all force it.

## visualization
Store the 32-bit integer `0x0A0B0C0D` at memory address 1000. Big-endian: address 1000=0x0A, 1001=0x0B, 1002=0x0C, 1003=0x0D. Little-endian: address 1000=0x0D, 1001=0x0C, 1002=0x0B, 1003=0x0A. Reading byte 1000 on the wrong endian machine gives you 0x0A vs 0x0D — different numbers entirely.

## bruteForce
Ignore endianness and just write your integers to disk or socket with a raw `memcpy`. Works perfectly until the day a file moves between platforms or a packet hits a different CPU. The fix is then a painful audit of every binary read in the codebase.

## optimal
At every boundary, convert to a canonical byte order. The network choice is big-endian, codified as "network byte order," with the `htonl` (host-to-network long), `htons` (short), `ntohl`, `ntohs` functions in POSIX. On little-endian hosts these are byte swaps; on big-endian hosts they are no-ops. Equivalent: Python's `struct.pack(">I", x)`, Java's `DataOutputStream.writeInt` (which is big-endian), JS's `DataView.setUint32(0, x, false)`.

## complexity
time: O(1) per word — a single `bswap` instruction on x86.
space: O(1).
notes: Modern CPUs have hardware byte-swap instructions; the cost is essentially zero.

## pitfalls
- Casting a `char*` to `int*` and dereferencing — endian-dependent results.
- Assuming `htonl` is a no-op because "my machine is fine" — works in dev, breaks when a teammate runs on different hardware (or just on a future port).
- Mixing endianness within a single record: classic bug in old file formats.
- Forgetting that `float`/`double` also need byte-swapping; IEEE 754 layouts have endianness too.
- Bit order vs byte order — byte order varies, bit order within a byte does not (for normal CPU access).

## interviewTips
- Be ready to write a one-line `bswap32` in your favorite language during a systems interview.
- Know that JVM bytecode and Java's `DataInput`/`DataOutput` are big-endian by spec, regardless of host.
- Mention that JSON, XML, and other text formats sidestep the issue entirely — only binary formats and protocols force the question.

## code.python
```python
def bswap32(x: int) -> int:
    return (
        ((x & 0xFF000000) >> 24) |
        ((x & 0x00FF0000) >> 8)  |
        ((x & 0x0000FF00) << 8)  |
        ((x & 0x000000FF) << 24)
    ) & 0xFFFFFFFF

import sys
def host_is_little_endian() -> bool:
    return sys.byteorder == "little"

def htonl(x: int) -> int:
    return bswap32(x) if host_is_little_endian() else x
```

## code.javascript
```javascript
export function bswap32(x) {
  return (
    ((x & 0xff000000) >>> 24) |
    ((x & 0x00ff0000) >>> 8)  |
    ((x & 0x0000ff00) << 8)   |
    ((x & 0x000000ff) << 24)
  ) >>> 0;
}

const LE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
export const htonl = (x) => (LE ? bswap32(x) : x >>> 0);
```

## code.java
```java
public class Endian {
    public static int bswap32(int x) {
        return ((x >>> 24) & 0xFF) |
               ((x >>> 8)  & 0xFF00) |
               ((x << 8)   & 0xFF0000) |
               ((x << 24)  & 0xFF000000);
    }
    public static int htonl(int x) {
        return java.nio.ByteOrder.nativeOrder() == java.nio.ByteOrder.LITTLE_ENDIAN
                ? bswap32(x) : x;
    }
}
```

## code.cpp
```cpp
#include <cstdint>

uint32_t bswap32(uint32_t x) {
    return ((x & 0xFF000000u) >> 24) |
           ((x & 0x00FF0000u) >> 8)  |
           ((x & 0x0000FF00u) << 8)  |
           ((x & 0x000000FFu) << 24);
}

bool hostIsLittleEndian() {
    uint16_t v = 1;
    return reinterpret_cast<uint8_t*>(&v)[0] == 1;
}

uint32_t htonl_portable(uint32_t x) {
    return hostIsLittleEndian() ? bswap32(x) : x;
}
```
