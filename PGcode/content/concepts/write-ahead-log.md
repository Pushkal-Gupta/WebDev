---
slug: write-ahead-log
module: cs-db-transactions
title: Write-Ahead Logging
subtitle: The durability primitive every database depends on — log first, mutate later, recover deterministically.
difficulty: Advanced
position: 40
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Crash Consistency: FSCK and Journaling"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/file-journaling.pdf"
    type: book
  - title: "Write-ahead logging — martinfowler.com / Patterns of Distributed Systems"
    url: "https://martinfowler.com/articles/patterns-of-distributed-systems/wal.html"
    type: blog
  - title: "facebook/rocksdb — wiki on WAL design"
    url: "https://github.com/facebook/rocksdb/wiki/Write-Ahead-Log"
    type: repo
status: published
---

## intro
Write-Ahead Logging (WAL) is the rule that any change to persistent state must first be recorded in an append-only log on stable storage before the in-place data page is modified. Because the log is sequential and idempotent, a crashed system can replay the tail to redo committed changes and undo in-flight ones — restoring a consistent snapshot without scanning the entire dataset.

## whyItMatters
Without WAL, a crash during a multi-page update can leave the database in an undefined hybrid state — some pages updated, some not, no way to tell. With WAL, recovery is mechanical: replay log records from the last checkpoint, redo everything marked committed, undo anything else. Postgres, MySQL InnoDB, SQLite WAL mode, RocksDB, Kafka, ext4 journal, ZFS ZIL — every serious storage system uses some flavor of this protocol.

## intuition
Think of a bank teller jotting every transaction in a paper ledger before touching account balances. If the teller faints mid-shift, the next teller reads the ledger, replays anything not yet posted, and rolls back anything obviously incomplete (no matching "committed" stamp). The ledger is append-only and sequential — fast to write and easy to replay; the actual balance book is random-access and slow, so we keep it lazy.

## visualization
Timeline of four operations: T1 BEGIN, T1 SET x=5, T1 COMMIT, T2 BEGIN, T2 SET y=9, then crash. WAL on disk: `[T1.begin][T1.x=5][T1.commit][T2.begin][T2.y=9]`. Data pages on disk still show `x=0, y=0` because the dirty-page flush had not happened. Recovery: scan WAL forward, redo T1 (apply x=5), see T2 has no commit record, undo T2 (skip). Final state: `x=5, y=0`. Durability preserved using only the log.

## bruteForce
Update data pages in place and flush them synchronously on every write. Correct but ruinously slow: each commit triggers random-write I/O proportional to the number of pages touched. A multi-row insert touching 5 pages costs 5 random fsyncs — 50 ms on spinning disk, 5 ms even on SSD. WAL collapses that into one sequential append plus one fsync, regardless of how many pages the transaction dirtied.

## optimal
Three invariants make WAL work. (1) **Log-before-data**: every log record describing a change is durable on disk before its corresponding page is flushed. (2) **Commit = log-flush**: a transaction is considered committed only after its COMMIT record is on stable storage. (3) **Checkpoints**: periodically flush all dirty pages and write a checkpoint marker so recovery only needs to replay log from the last checkpoint, not from the dawn of time. **Group commit** batches many transactions' COMMIT records into one fsync — instead of N fsyncs/sec ceiling, you get N × batch-size throughput. ARIES adds LSNs (Log Sequence Numbers) per page so recovery can skip a redo if the page already saw it.

## complexity
time: O(1) amortized per logged change (sequential append); recovery is O(log-size-since-checkpoint)
space: log grows until checkpoint truncates it; checkpoint cadence is the tunable knob
notes: Throughput is bounded by sequential write bandwidth and fsync latency. Group commit raises ceiling by amortizing fsync over many transactions. NVMe with battery-backed cache makes fsync nearly free, shifting the bottleneck to log-record serialization.

## pitfalls
- Forgetting to fsync the log before acknowledging a commit — silent data loss on power failure ("fsync lying" was the Postgres + ext4 bug of 2018).
- Writing data pages before their corresponding log record is durable — violates log-before-data, leaves unrecoverable corruption after crash.
- No checkpoint = log grows without bound = recovery takes hours.
- Treating the log as a queue instead of an append-only ring — careful truncation logic is needed or you accidentally drop records still needed for replay.
- Using a non-atomic write for the COMMIT record on a sector boundary — half-written commit looks ambiguous on recovery (write a checksum).
- Concurrent log writers without ordering — the LSN must be monotonic per log, otherwise replay is non-deterministic.

## interviewTips
- State the invariant first: "Log record is on disk before the corresponding data page touches disk."
- Distinguish redo-only (RocksDB-style) from redo+undo (ARIES/InnoDB). Redo-only is simpler but requires no in-flight transaction to ever be flushed before commit.
- Mention group commit when asked about throughput — it is the single most impactful tuning lever.
- Tie it to real systems: "Kafka's segment files are essentially a WAL exposed as the API." "Raft's log is a WAL with a consensus layer on top."

## code.python
```python
import os, struct, threading

class WAL:
    def __init__(self, path):
        self.f = open(path, "ab+")
        self.lock = threading.Lock()
        self.lsn = self._scan_max_lsn()

    def _scan_max_lsn(self):
        self.f.seek(0)
        last = 0
        while True:
            header = self.f.read(12)
            if len(header) < 12: break
            lsn, length = struct.unpack(">QI", header)
            self.f.read(length)
            last = lsn
        return last

    def append(self, payload: bytes) -> int:
        with self.lock:
            self.lsn += 1
            self.f.write(struct.pack(">QI", self.lsn, len(payload)))
            self.f.write(payload)
            self.f.flush()
            os.fsync(self.f.fileno())
            return self.lsn

    def replay(self):
        self.f.seek(0)
        while True:
            header = self.f.read(12)
            if len(header) < 12: return
            lsn, length = struct.unpack(">QI", header)
            yield lsn, self.f.read(length)

class Store:
    def __init__(self, wal):
        self.wal = wal
        self.data = {}
        self.in_flight = {}

    def begin(self, tx):
        self.wal.append(f"BEGIN:{tx}".encode())
        self.in_flight[tx] = {}

    def set(self, tx, key, value):
        self.wal.append(f"SET:{tx}:{key}:{value}".encode())
        self.in_flight[tx][key] = value

    def commit(self, tx):
        self.wal.append(f"COMMIT:{tx}".encode())
        self.data.update(self.in_flight.pop(tx))

    def recover(self):
        pending = {}
        committed = set()
        for _, rec in self.wal.replay():
            parts = rec.decode().split(":")
            if parts[0] == "BEGIN": pending[parts[1]] = {}
            elif parts[0] == "SET": pending[parts[1]][parts[2]] = parts[3]
            elif parts[0] == "COMMIT": committed.add(parts[1])
        for tx in committed:
            self.data.update(pending[tx])
```

## code.javascript
```javascript
const fs = require('fs');

class WAL {
  constructor(path) {
    this.fd = fs.openSync(path, 'a+');
    this.lsn = 0;
  }
  append(payload) {
    this.lsn += 1;
    const header = Buffer.alloc(12);
    header.writeBigUInt64BE(BigInt(this.lsn), 0);
    header.writeUInt32BE(payload.length, 8);
    fs.writeSync(this.fd, Buffer.concat([header, Buffer.from(payload)]));
    fs.fsyncSync(this.fd);
    return this.lsn;
  }
}

class Store {
  constructor(wal) { this.wal = wal; this.data = new Map(); this.tx = new Map(); }
  begin(t) { this.wal.append(`BEGIN:${t}`); this.tx.set(t, new Map()); }
  set(t, k, v) { this.wal.append(`SET:${t}:${k}:${v}`); this.tx.get(t).set(k, v); }
  commit(t) {
    this.wal.append(`COMMIT:${t}`);
    for (const [k, v] of this.tx.get(t)) this.data.set(k, v);
    this.tx.delete(t);
  }
}
```

## code.java
```java
class WAL implements Closeable {
    private final RandomAccessFile f;
    private final FileChannel ch;
    private long lsn = 0;

    WAL(String path) throws IOException {
        f = new RandomAccessFile(path, "rwd");
        ch = f.getChannel();
        f.seek(f.length());
    }

    synchronized long append(byte[] payload) throws IOException {
        lsn++;
        ByteBuffer buf = ByteBuffer.allocate(12 + payload.length);
        buf.putLong(lsn).putInt(payload.length).put(payload).flip();
        ch.write(buf);
        ch.force(false);
        return lsn;
    }

    public void close() throws IOException { f.close(); }
}
```

## code.cpp
```cpp
#include <fcntl.h>
#include <unistd.h>
#include <cstring>
#include <mutex>
#include <string>

class WAL {
public:
    WAL(const std::string& path) {
        fd_ = open(path.c_str(), O_RDWR | O_CREAT | O_APPEND, 0644);
    }
    ~WAL() { if (fd_ >= 0) close(fd_); }

    uint64_t append(const std::string& payload) {
        std::lock_guard<std::mutex> g(m_);
        ++lsn_;
        uint64_t len = payload.size();
        write(fd_, &lsn_, sizeof(lsn_));
        write(fd_, &len, sizeof(uint32_t));
        write(fd_, payload.data(), payload.size());
        fsync(fd_);
        return lsn_;
    }

private:
    int fd_;
    uint64_t lsn_ = 0;
    std::mutex m_;
};
```
