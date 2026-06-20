---
slug: two-phase-locking
module: cs-db-transactions
title: Two-Phase Locking
subtitle: The classical concurrency control protocol — grow then shrink, with strict variants that prevent cascading aborts.
difficulty: Advanced
position: 41
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — concurrency control chapter (Kleppmann)"
    url: "https://martinkleppmann.com/2017/03/27/designing-data-intensive-applications.html"
    type: book
  - title: "Two-Phase Locking (2PL) Concurrency Control — GeeksforGeeks"
    url: "https://www.geeksforgeeks.org/two-phase-locking-2-pl-concurrency-control-protocol-set-1/"
    type: blog
  - title: "donnemartin/system-design-primer — concurrency notes"
    url: "https://github.com/donnemartin/system-design-primer#consistency-patterns"
    type: repo
status: published
---

## intro
Two-Phase Locking (2PL) is a concurrency-control protocol that splits every transaction into a **growing phase** (only acquires locks) and a **shrinking phase** (only releases locks). Once any lock is released, no new lock can ever be acquired. This single rule is sufficient to guarantee **conflict-serializable** schedules — the strongest correctness property short of full serializability.

## whyItMatters
Concurrent transactions that touch the same rows can interleave reads and writes in ways that violate invariants: lost updates, dirty reads, non-repeatable reads, phantom rows. 2PL is the textbook answer used by MySQL InnoDB (default), SQL Server (default at non-snapshot isolations), DB2, and many embedded engines. Even systems that prefer MVCC (Postgres, Oracle) fall back to range locks or predicate locks for SERIALIZABLE — same family of techniques. ANSI SQL isolation levels (Read Committed, Repeatable Read, Serializable) map directly onto 2PL variants: hold S-locks until end of statement vs end of transaction, hold X-locks until commit vs end of statement.

## intuition
The challenge of concurrent transactions is that interleaved reads and writes can produce schedules that no serial execution could ever produce — violating invariants like account balance conservation, foreign-key integrity, or read-your-writes consistency. Two-Phase Locking's correctness guarantee rests on a single discipline: every transaction has a growing phase (only acquires locks) and a shrinking phase (only releases locks), and once any lock is released the growing phase is over forever. This prevents a transaction from acquiring a lock after releasing one, which is the structural property that makes the resulting schedule conflict-serializable — equivalent to some serial order. Concretely, locks come in two modes: shared (S, multiple holders allowed, only for reads) and exclusive (X, single holder, required for writes). The compatibility table is the standard reader-writer: S and S coexist, X conflicts with everything. The serializability proof works by considering the wait-for graph: transactions are nodes, edges encode "T_i is blocked waiting for T_j's lock." Under 2PL, no cycle in this graph survives without deadlock detection forcing one transaction to abort, so the surviving schedule has a topological order that is exactly the conflict-serializable order. The library analogy: every book has a checkout card; readers stamp out (S-lock), writers need everyone cleared before stamping (X-lock); once you start putting any card back, you cannot stamp out a new one for the rest of your session. Plain 2PL allows cascading aborts (T1 releases a lock, T2 reads, T1 aborts, T2 must also abort), so production engines use stricter variants: Strict 2PL holds X-locks until commit (prevents cascades on writes), Rigorous 2PL holds all locks until commit (simpler, what InnoDB and SQL Server use). The deep insight is that correctness in concurrent systems often comes from discipline on *when* you give things up, not just on *what* you grab.

## visualization
Two transactions, T1 transferring $10 from A to B, T2 reading A+B. Without 2PL: T1 reads A=100, T2 reads A=100, T2 reads B=50 (total=150), T1 writes A=90, T1 writes B=60, T1 commits. T2 saw a stale total — anomaly. With 2PL: T1 acquires X-lock on A and B before any release; T2 blocks on its S-lock for A until T1 commits and releases. T2 sees the post-transfer state — consistent.

## bruteForce
Run every transaction serially: take a global mutex, do the work, release. Trivially correct, terrible throughput. On a 32-core box you saturate one core and idle 31. Real systems need fine-grained locks per row/page/table so independent transactions on disjoint data run in parallel. 2PL is exactly that fine-grained discipline combined with a correctness proof.

## optimal
Production engines use Rigorous 2PL (hold all locks until commit) plus deadlock detection via a wait-for graph. Each transaction acquires locks on demand during execution; when it commits or aborts, all locks are released atomically. Deadlocks are detected by maintaining a directed graph where node T_i has an edge to T_j when T_i is blocked waiting on a lock held by T_j. A cycle in this graph is a deadlock; resolve by aborting the youngest (or some other policy) transaction to break the cycle. Lock acquisition is O(log n) with hashed lock tables; deadlock detection is O(V + E) on the wait-for graph and is typically run on a 1-second timer rather than per-acquisition.

```python
from collections import defaultdict
from threading import Lock, Condition

class LockManager:
    """Rigorous 2PL with wait-for-graph deadlock detection."""
    def __init__(self):
        self.locks = defaultdict(lambda: {"holders": {}})
        self.mu = Lock()
        self.cv = Condition(self.mu)
        self.wait_for = defaultdict(set)

    def acquire(self, tx, key, mode):
        with self.cv:
            while not self._compatible(tx, key, mode):
                # Record this transaction as waiting for current holders.
                for h in self.locks[key]["holders"]:
                    if h != tx:
                        self.wait_for[tx].add(h)
                if self._has_cycle():
                    self.wait_for.pop(tx, None)
                    raise RuntimeError(f"deadlock: aborting {tx}")
                self.cv.wait()
            self.wait_for.pop(tx, None)
            self.locks[key]["holders"][tx] = mode

    def release_all(self, tx):
        """Rigorous 2PL: release everything atomically at commit/abort."""
        with self.cv:
            for key in list(self.locks):
                self.locks[key]["holders"].pop(tx, None)
            self.cv.notify_all()
```

Throughput collapses under high contention (the "hot-row" problem). Mitigations include intent locks for table hierarchy (IS/IX) to avoid full-table-lock conflicts, lock escalation thresholds, and partition-by-key sharding. The 2PL family is the workhorse behind MySQL InnoDB, SQL Server, DB2, and serves as the SERIALIZABLE fallback in Postgres and Oracle when MVCC alone is insufficient.

## complexity
time: lock acquire/release is O(log n) hashed; deadlock detection is O(V+E) on the wait-for graph, typically run every 1s
space: O(locks_held_concurrently), bounded by lock-table memory
notes: Throughput collapses as contention rises — the "hot-row" problem. Mitigations: row-level locks, intent locks for table hierarchy, lock escalation when a transaction holds too many fine-grained locks, partition-by-key sharding.

## pitfalls
- Releasing a lock before commit (plain 2PL) — opens the door to cascading aborts.
- No deadlock detection / no timeout — a deadlock stalls progress indefinitely.
- Forgetting **intent locks** (IS, IX) at the table level — a single full-table lock then conflicts with every row-level lock taken below it.
- Lock escalation kicking in too early — large UPDATE turns into a table-lock storm that wedges OLTP.
- Predicate / phantom problem: row locks alone do not stop a concurrent INSERT into the same range. Need range locks or predicate locks for SERIALIZABLE.
- Confusing 2PL with "two-phase commit" — completely different things; 2PC is a distributed atomic-commit protocol.

## interviewTips
- Define the protocol in one sentence: "Locks acquired in a growing phase, released in a shrinking phase; once any lock is released, no new lock can be acquired."
- Be ready to draw a wait-for graph and identify the cycle.
- State the trade-off vs MVCC: 2PL blocks readers behind writers (and vice versa); MVCC lets reads see a consistent snapshot without blocking, at the cost of write-skew possibilities under snapshot isolation.
- Mention strict vs rigorous 2PL — interviewers love seeing the distinction.

## code.python
```python
from collections import defaultdict
from threading import Lock, Condition

class LockManager:
    def __init__(self):
        self.locks = defaultdict(lambda: {"holders": {}, "waiters": []})
        self.mu = Lock()
        self.cv = Condition(self.mu)
        self.wait_for = defaultdict(set)

    def acquire(self, tx, key, mode):
        with self.cv:
            while not self._compatible(tx, key, mode):
                self._record_wait(tx, key)
                if self._has_cycle():
                    self._clear_wait(tx)
                    raise RuntimeError(f"deadlock: aborting {tx}")
                self.cv.wait()
            self._clear_wait(tx)
            self.locks[key]["holders"][tx] = mode

    def _compatible(self, tx, key, mode):
        holders = self.locks[key]["holders"]
        if not holders or set(holders) == {tx}: return True
        if mode == "S" and all(m == "S" for h, m in holders.items() if h != tx):
            return True
        return False

    def _record_wait(self, tx, key):
        for h in self.locks[key]["holders"]:
            if h != tx: self.wait_for[tx].add(h)

    def _clear_wait(self, tx):
        self.wait_for.pop(tx, None)

    def _has_cycle(self):
        visited, stack = set(), set()
        def dfs(u):
            visited.add(u); stack.add(u)
            for v in self.wait_for.get(u, ()):
                if v not in visited and dfs(v): return True
                if v in stack: return True
            stack.remove(u); return False
        return any(dfs(n) for n in list(self.wait_for) if n not in visited)

    def release_all(self, tx):
        with self.cv:
            for key in list(self.locks):
                self.locks[key]["holders"].pop(tx, None)
            self.cv.notify_all()
```

## code.javascript
```javascript
class LockManager {
  constructor() { this.locks = new Map(); this.waitFor = new Map(); }

  async acquire(tx, key, mode) {
    while (!this._compatible(tx, key, mode)) {
      this._addWait(tx, key);
      if (this._hasCycle()) { this._clearWait(tx); throw new Error(`deadlock ${tx}`); }
      await new Promise(r => setTimeout(r, 5));
    }
    this._clearWait(tx);
    if (!this.locks.has(key)) this.locks.set(key, new Map());
    this.locks.get(key).set(tx, mode);
  }

  _compatible(tx, key, mode) {
    const h = this.locks.get(key);
    if (!h || h.size === 0) return true;
    if (h.size === 1 && h.has(tx)) return true;
    if (mode === 'S') {
      for (const [t, m] of h) if (t !== tx && m !== 'S') return false;
      return true;
    }
    return false;
  }

  _addWait(tx, key) {
    if (!this.waitFor.has(tx)) this.waitFor.set(tx, new Set());
    const h = this.locks.get(key);
    if (h) for (const t of h.keys()) if (t !== tx) this.waitFor.get(tx).add(t);
  }
  _clearWait(tx) { this.waitFor.delete(tx); }

  _hasCycle() {
    const visited = new Set(), stack = new Set();
    const dfs = (u) => {
      visited.add(u); stack.add(u);
      for (const v of this.waitFor.get(u) || []) {
        if (stack.has(v)) return true;
        if (!visited.has(v) && dfs(v)) return true;
      }
      stack.delete(u); return false;
    };
    for (const n of this.waitFor.keys()) if (!visited.has(n) && dfs(n)) return true;
    return false;
  }

  releaseAll(tx) {
    for (const h of this.locks.values()) h.delete(tx);
    this.waitFor.delete(tx);
  }
}
```

## code.java
```java
class LockManager {
    enum Mode { S, X }
    private final Map<String, Map<String, Mode>> locks = new HashMap<>();
    private final Map<String, Set<String>> waitFor = new HashMap<>();

    synchronized void acquire(String tx, String key, Mode mode) throws InterruptedException {
        while (!compatible(tx, key, mode)) {
            addWait(tx, key);
            if (hasCycle()) { waitFor.remove(tx); throw new RuntimeException("deadlock " + tx); }
            wait(50);
        }
        waitFor.remove(tx);
        locks.computeIfAbsent(key, k -> new HashMap<>()).put(tx, mode);
    }

    private boolean compatible(String tx, String key, Mode mode) {
        Map<String, Mode> h = locks.get(key);
        if (h == null || h.isEmpty()) return true;
        if (h.size() == 1 && h.containsKey(tx)) return true;
        if (mode == Mode.S) {
            for (var e : h.entrySet()) if (!e.getKey().equals(tx) && e.getValue() != Mode.S) return false;
            return true;
        }
        return false;
    }

    private void addWait(String tx, String key) {
        Map<String, Mode> h = locks.get(key);
        if (h == null) return;
        waitFor.computeIfAbsent(tx, k -> new HashSet<>());
        for (String t : h.keySet()) if (!t.equals(tx)) waitFor.get(tx).add(t);
    }

    private boolean hasCycle() {
        Set<String> visited = new HashSet<>(), stack = new HashSet<>();
        for (String n : waitFor.keySet())
            if (!visited.contains(n) && dfs(n, visited, stack)) return true;
        return false;
    }

    private boolean dfs(String u, Set<String> visited, Set<String> stack) {
        visited.add(u); stack.add(u);
        for (String v : waitFor.getOrDefault(u, Set.of())) {
            if (stack.contains(v)) return true;
            if (!visited.contains(v) && dfs(v, visited, stack)) return true;
        }
        stack.remove(u); return false;
    }

    synchronized void releaseAll(String tx) {
        for (var h : locks.values()) h.remove(tx);
        waitFor.remove(tx);
        notifyAll();
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <unordered_set>
#include <mutex>
#include <condition_variable>
#include <stdexcept>

class LockManager {
public:
    enum Mode { S, X };

    void acquire(const std::string& tx, const std::string& key, Mode mode) {
        std::unique_lock<std::mutex> lk(m_);
        while (!compatible(tx, key, mode)) {
            addWait(tx, key);
            if (hasCycle()) { waitFor_.erase(tx); throw std::runtime_error("deadlock"); }
            cv_.wait_for(lk, std::chrono::milliseconds(50));
        }
        waitFor_.erase(tx);
        locks_[key][tx] = mode;
    }

    void releaseAll(const std::string& tx) {
        std::lock_guard<std::mutex> lk(m_);
        for (auto& [k, h] : locks_) h.erase(tx);
        waitFor_.erase(tx);
        cv_.notify_all();
    }

private:
    std::unordered_map<std::string, std::unordered_map<std::string, Mode>> locks_;
    std::unordered_map<std::string, std::unordered_set<std::string>> waitFor_;
    std::mutex m_;
    std::condition_variable cv_;

    bool compatible(const std::string& tx, const std::string& key, Mode mode) {
        auto& h = locks_[key];
        if (h.empty()) return true;
        if (h.size() == 1 && h.count(tx)) return true;
        if (mode == S) {
            for (auto& [t, m] : h) if (t != tx && m != S) return false;
            return true;
        }
        return false;
    }

    void addWait(const std::string& tx, const std::string& key) {
        for (auto& [t, _] : locks_[key]) if (t != tx) waitFor_[tx].insert(t);
    }

    bool hasCycle() {
        std::unordered_set<std::string> visited, stack;
        std::function<bool(const std::string&)> dfs = [&](const std::string& u) {
            visited.insert(u); stack.insert(u);
            for (auto& v : waitFor_[u]) {
                if (stack.count(v)) return true;
                if (!visited.count(v) && dfs(v)) return true;
            }
            stack.erase(u); return false;
        };
        for (auto& [n, _] : waitFor_) if (!visited.count(n) && dfs(n)) return true;
        return false;
    }
};
```
