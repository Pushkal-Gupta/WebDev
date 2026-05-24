---
slug: endianness-explained
module: cs-core
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
Endianness mismatches are silent: code that ran perfectly on your x86 laptop will produce garbage on a network packet, an embedded device, or an old PowerPC. Every binary file format, network protocol, and inter-process serialization scheme must specify a byte order. Forgetting to swap is a top source of "works on my machine" bugs.

## intuition
Big-endian is like writing a number left-to-right in the natural human order: thousands digit first, then hundreds, tens, ones. Little-endian is the reverse: ones digit first. Neither is "right" — they are conventions. x86 and ARM (in its common mode) are little-endian; most network protocols and older RISC systems are big-endian.

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
