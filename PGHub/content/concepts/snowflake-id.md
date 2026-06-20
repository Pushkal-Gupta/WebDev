---
slug: snowflake-id
module: sd-storage
title: Snowflake ID
subtitle: Twitter's 64-bit composable identifier — 41 bits of timestamp, 10 bits of node, 12 bits of sequence — generated without coordination at 4096 IDs per millisecond per node.
difficulty: Advanced
position: 33
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "twitter-archive/snowflake — original 2010 implementation"
    url: "https://github.com/twitter-archive/snowflake"
    type: repo
  - title: "RFC 9562 — UUID formats including UUIDv7"
    url: "https://www.rfc-editor.org/rfc/rfc9562.html"
    type: spec
  - title: "ulid/spec — Universally Unique Lexicographically Sortable Identifier"
    url: "https://github.com/ulid/spec"
    type: spec
status: published
---

## intro
A Snowflake ID is a 64-bit integer composed of three fields: a 41-bit millisecond timestamp (epoch-relative), a 10-bit node ID, and a 12-bit per-millisecond sequence counter. Every node assembles IDs locally by combining its current millisecond, its assigned node ID, and an incrementing counter that resets each millisecond. The result is a unique, roughly time-ordered, 64-bit number generated in nanoseconds without any coordination across nodes.

## whyItMatters
Auto-increment columns in a sharded database mean every insert hits the same shard for ID assignment — a write bottleneck and a single point of failure. UUIDs solve the coordination problem but cost 128 bits, defeat clustered-index locality (random insert positions blow up B-tree write amplification), and are unfriendly to humans debugging logs. Snowflake-style IDs are the standard answer in production sharded systems: Twitter (original), Discord, Instagram (its own variant), Sony, Mastodon, and any DynamoDB-backed system that needs sortable partition keys. They fit in a 64-bit signed integer (so they survive JSON's 53-bit safe-integer limit if you generate post-2010 IDs and stay under signed bounds) and they sort approximately by creation time without any extra metadata. The Snowflake idea generalised — UUIDv7 (RFC 9562) and ULID are the modern direct descendants.

## intuition
The design pressure on a distributed ID generator is uncomfortable: you want IDs to be unique across thousands of machines, you want them to fit in a register-sized integer, you want them sortable so a database B-tree index appends rather than randomly inserts, and you want zero coordination on the hot path because every API request needs one. Each constraint kills a naive approach. A central allocator gives you unique sortable IDs but becomes a single point of failure. UUIDs give you no coordination but are 128 bits and randomly ordered. A per-node counter gives you locality but collides across nodes. The Snowflake reframe is to compose the ID from three fields, each solving one constraint independently. The 41-bit timestamp delivers temporal sortability and gives ~69 years of address space from a custom epoch (2010 in the original Twitter design, so it runs out in 2079). The 10-bit node ID supports 1024 distinct generators — one per shard, one per microservice instance — assigned at boot via Zookeeper or a config file. The 12-bit sequence handles within-millisecond bursts: 4096 IDs per node per millisecond, or 4 million per node per second, enough that even the busiest API service rarely overflows. The layout matters: timestamp goes in the high bits so numeric comparison is time comparison; node ID separates concurrent millisecond-equal generations across nodes; sequence is the low bits and increments only when the timestamp is identical to the previous ID's. The clock-skew handling is the subtle bit. If the system clock jumps backward — NTP correction, leap second, VM pause — emitting an ID with the smaller timestamp would risk a duplicate against an already-emitted ID at the same node-and-sequence combination. The standard fix is to stall the generator: if the new millisecond is less than the previously-emitted millisecond, sleep until it catches up, or refuse to emit and surface an error. Forward jumps are fine — they just waste address space, no correctness issue. Once you internalise the layout, every variation makes sense. Discord drops the epoch to 2015 and uses 5 worker bits + 5 process bits inside the node field. Mastodon stretches the timestamp to microseconds. UUIDv7 adopts the same layout in 128 bits with a longer timestamp and a random tail. ULID is the case-insensitive base32 string encoding of the same idea. The Snowflake pattern is the modern primitive for distributed identity, and once you can derive it from the constraints, every variant is a transparent tuning choice.

## visualization
```
64-bit Snowflake ID layout (high bits -> low bits)

| 1 bit | 41 bits           | 10 bits | 12 bits   |
| sign  | timestamp_ms      | node id | sequence  |
|   0   | (since custom ep) | (0-1023)| (0-4095)  |

Example ID = 1234605616738598912 binary:
0  00010001001010110001010110001011000000  0000001010  000000000000
   |                                       |           |
   ts = 1184562507352 ms                   node = 10   seq = 0

Time-sortable because timestamp is high bits.
Node ID guarantees uniqueness across the 1024-worker fleet.
Sequence handles up to 4096 IDs per node per millisecond.
```

## bruteForce
A central ID server (e.g. a single Postgres row with `SELECT ... FOR UPDATE`) gives you globally unique sortable IDs but introduces a network round trip on every write and a single point of failure. Mitigations like batching (allocate 1000 IDs at a time per client) trade availability for throughput but still don't survive the central server going down. Instagram's pre-Snowflake setup did exactly this and hit walls during the 2010 hyper-growth — which is why the company adopted a Snowflake-shaped scheme in MySQL stored procedures.

## optimal
The canonical Snowflake generator runs as a per-process struct holding (epoch, node_id, last_ts, sequence). On each `next()` call, read the current millisecond. If it equals `last_ts`, increment the sequence; if the sequence overflows 4095, busy-wait until the next millisecond. If the current ms is greater than `last_ts`, reset sequence to 0 and update `last_ts`. If the current ms is less than `last_ts`, the clock went backward — either sleep until it catches up or raise an error; never emit an ID with the smaller timestamp. Pack the three fields with bit shifts: `(ts << 22) | (node_id << 12) | seq`. The node ID is assigned at boot from a config service (Zookeeper ephemeral node, etcd lease) so two crashed-and-restarted nodes never share the same worker number; persisting the last-emitted timestamp to disk on shutdown lets a node refuse to start until wall-clock advances past it, defending against clock-rewind on restart. Throughput is single-digit-microsecond per ID; a Java implementation on a modern CPU hits tens of millions per second per node without contention.

```python
import time, threading

class SnowflakeGenerator:
    EPOCH_MS = 1288834974657  # Twitter epoch: 2010-11-04T01:42:54.657Z
    NODE_BITS = 10
    SEQ_BITS = 12
    NODE_MAX = (1 << NODE_BITS) - 1
    SEQ_MAX = (1 << SEQ_BITS) - 1

    def __init__(self, node_id: int):
        if not 0 <= node_id <= self.NODE_MAX:
            raise ValueError("node_id out of range")
        self.node_id = node_id
        self.last_ts = -1
        self.seq = 0
        self.lock = threading.Lock()

    def _now_ms(self) -> int:
        return int(time.time() * 1000)

    def next_id(self) -> int:
        with self.lock:
            ts = self._now_ms()
            if ts < self.last_ts:
                raise RuntimeError(f"clock rewound by {self.last_ts - ts}ms; refusing to emit")
            if ts == self.last_ts:
                self.seq = (self.seq + 1) & self.SEQ_MAX
                if self.seq == 0:
                    while ts <= self.last_ts:
                        ts = self._now_ms()
            else:
                self.seq = 0
            self.last_ts = ts
            return ((ts - self.EPOCH_MS) << 22) | (self.node_id << 12) | self.seq
```

## complexity
- `next_id`: O(1) amortized — three integer ops, one mutex acquire. Hits a busy-wait only when the per-millisecond sequence overflows (4096 IDs in one ms on one node).
- Memory: a single struct per generator; the 1024-node fleet is implicit in the address space, not stored.
- Comparison to UUIDv4: same uniqueness guarantee, double the bytes (128 vs 64), random insertion order destroys B-tree write locality. Comparison to UUIDv7: same time-sortable design, 128 bits gives larger address space at the cost of column width. Comparison to ULID: same layout philosophy, 26-char base32 string encoding for human readability.

## pitfalls
- **Reusing a node ID across two live processes.** Two generators with the same node ID will collide within the same millisecond as soon as both hit the same sequence value. Fix: assign node IDs via a coordination service (Zookeeper ephemeral nodes, etcd lease) so a crashed node's ID is reclaimable only after the old session expires. Persisting node_id in a config file without a registry is a foot-gun during cluster scaling.
- **Ignoring clock rewind.** NTP corrections, leap-second smearing, and VM pauses can rewind the system clock by tens of milliseconds. Emitting an ID with a smaller timestamp on a node that already emitted a higher one risks duplicate IDs. Fix: persist `last_ts` on shutdown and refuse to start until wall-clock exceeds it; on runtime rewind, either sleep or raise. Mastodon uses a microsecond-resolution stored last_ts for exactly this.
- **Letting the timestamp overflow.** A 41-bit ms field from a 2010 epoch runs out in 2079. Long-lived systems (banking, government) need to plan a rollover or a different layout. Fix: use 42 or 43 bits if you can afford to shrink node/sequence; or migrate to UUIDv7 which gives 48 bits of timestamp.
- **Assuming strict total ordering.** Two IDs from different nodes generated in the same millisecond have an unspecified order — node-bit ordering breaks tie-but-isn't-causal. Don't use Snowflake IDs as a causal ordering primitive (use Lamport or HLC). The sortability is "good enough for B-tree clustering", not "happens-before".
- **Serialising as JSON numbers in JavaScript.** JS Number is a 64-bit float; safe integers cap at 2^53 - 1. Snowflake IDs past ~285341 years from the epoch (or just IDs with the high sign bit close) silently lose precision in the browser. Fix: serialise as string in the API response and parse to BigInt on the client.

## interviewTips
- **Lead with the three-field layout and the constraints each one solves.** Interviewers ranking candidates on systems literacy want to hear "timestamp gives sortability, node ID gives no-coordination uniqueness, sequence gives intra-ms burst capacity" inside the first minute.
- **Volunteer the clock-skew failure mode before being asked.** "What happens if the clock goes backward?" is the standard follow-up; surfacing the answer (refuse to emit, persist last_ts) signals real production thinking.
- **Compare against UUIDv7, ULID, and KSUID.** All three are post-Snowflake refinements; naming them shows breadth. UUIDv7 is the IETF-standardised version; ULID is the string-encoded variant; KSUID is Segment's 27-byte alternative with stronger random tail.

## code
### python
```python
import time, threading

class SnowflakeGenerator:
    EPOCH_MS = 1288834974657
    NODE_BITS = 10
    SEQ_BITS = 12
    NODE_MAX = (1 << NODE_BITS) - 1
    SEQ_MAX = (1 << SEQ_BITS) - 1

    def __init__(self, node_id: int) -> None:
        if not 0 <= node_id <= self.NODE_MAX:
            raise ValueError("node_id out of range")
        self.node_id = node_id
        self.last_ts = -1
        self.seq = 0
        self.lock = threading.Lock()

    def next_id(self) -> int:
        with self.lock:
            ts = int(time.time() * 1000)
            if ts < self.last_ts:
                raise RuntimeError("clock rewound; refusing to emit")
            if ts == self.last_ts:
                self.seq = (self.seq + 1) & self.SEQ_MAX
                if self.seq == 0:
                    while ts <= self.last_ts:
                        ts = int(time.time() * 1000)
            else:
                self.seq = 0
            self.last_ts = ts
            return ((ts - self.EPOCH_MS) << 22) | (self.node_id << 12) | self.seq
```

### javascript
```javascript
class SnowflakeGenerator {
  static EPOCH_MS = 1288834974657n;
  static NODE_MAX = 1023;
  static SEQ_MAX = 4095n;

  constructor(nodeId) {
    if (nodeId < 0 || nodeId > SnowflakeGenerator.NODE_MAX) throw new Error("node_id out of range");
    this.nodeId = BigInt(nodeId);
    this.lastTs = -1n;
    this.seq = 0n;
  }

  _now() { return BigInt(Date.now()); }

  nextId() {
    let ts = this._now();
    if (ts < this.lastTs) throw new Error("clock rewound; refusing to emit");
    if (ts === this.lastTs) {
      this.seq = (this.seq + 1n) & SnowflakeGenerator.SEQ_MAX;
      if (this.seq === 0n) {
        while (ts <= this.lastTs) ts = this._now();
      }
    } else {
      this.seq = 0n;
    }
    this.lastTs = ts;
    return ((ts - SnowflakeGenerator.EPOCH_MS) << 22n) | (this.nodeId << 12n) | this.seq;
  }
}
```

### java
```java
public class SnowflakeGenerator {
    private static final long EPOCH_MS = 1288834974657L;
    private static final long NODE_BITS = 10;
    private static final long SEQ_BITS = 12;
    private static final long NODE_MAX = (1L << NODE_BITS) - 1;
    private static final long SEQ_MAX = (1L << SEQ_BITS) - 1;

    private final long nodeId;
    private long lastTs = -1;
    private long seq = 0;

    public SnowflakeGenerator(long nodeId) {
        if (nodeId < 0 || nodeId > NODE_MAX) throw new IllegalArgumentException("node_id out of range");
        this.nodeId = nodeId;
    }

    public synchronized long nextId() {
        long ts = System.currentTimeMillis();
        if (ts < lastTs) throw new IllegalStateException("clock rewound; refusing to emit");
        if (ts == lastTs) {
            seq = (seq + 1) & SEQ_MAX;
            if (seq == 0) {
                while (ts <= lastTs) ts = System.currentTimeMillis();
            }
        } else {
            seq = 0;
        }
        lastTs = ts;
        return ((ts - EPOCH_MS) << 22) | (nodeId << 12) | seq;
    }
}
```

### cpp
```cpp
#include <chrono>
#include <mutex>
#include <stdexcept>

class SnowflakeGenerator {
    static constexpr long long EPOCH_MS = 1288834974657LL;
    static constexpr long long NODE_MAX = (1LL << 10) - 1;
    static constexpr long long SEQ_MAX = (1LL << 12) - 1;

    long long node_id;
    long long last_ts = -1;
    long long seq = 0;
    std::mutex mu;

    static long long now_ms() {
        using namespace std::chrono;
        return duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
    }

public:
    explicit SnowflakeGenerator(long long id) : node_id(id) {
        if (id < 0 || id > NODE_MAX) throw std::invalid_argument("node_id out of range");
    }

    long long next_id() {
        std::lock_guard<std::mutex> lk(mu);
        long long ts = now_ms();
        if (ts < last_ts) throw std::runtime_error("clock rewound; refusing to emit");
        if (ts == last_ts) {
            seq = (seq + 1) & SEQ_MAX;
            if (seq == 0) { while (ts <= last_ts) ts = now_ms(); }
        } else {
            seq = 0;
        }
        last_ts = ts;
        return ((ts - EPOCH_MS) << 22) | (node_id << 12) | seq;
    }
};
```
