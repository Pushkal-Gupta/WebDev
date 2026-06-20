---
slug: optimistic-locking
module: cs-os-concurrency
title: Optimistic Locking
subtitle: Version-based concurrency control — read freely, conflict only at commit.
difficulty: Intermediate
position: 18
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Operating Systems: Three Easy Pieces — Concurrency"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Patterns of Enterprise Application Architecture — Optimistic Offline Lock"
    url: "https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html"
    type: blog
  - title: "redis/redis — WATCH / MULTI / EXEC"
    url: "https://github.com/redis/redis"
    type: repo
status: published
---

## intro
Optimistic locking lets every transaction read and modify shared state without acquiring any lock. At commit time the system checks whether the rows the transaction touched are still in the version it read; if so, commit succeeds; if not, the transaction aborts and the application retries. It assumes conflicts are rare — the optimism — and pays for that assumption only when assumption breaks.

## whyItMatters
Pessimistic locks serialize access even when no conflict would have occurred. Under low contention this is pure waste: throughput drops, tail latency climbs because of lock queues, and long-running readers stall writers. Optimistic concurrency control (Kung and Robinson, 1981) removes the lock from the hot path entirely, which is why it underlies most modern databases' MVCC (Postgres, MySQL InnoDB, Spanner, FoundationDB, CockroachDB, YugabyteDB) and most distributed primitives (CAS, ETag conditional PUT, Dynamo's vector-clock siblings, Kubernetes' resourceVersion). Stripe's payment-intent flow, Linear's collaborative state, and every collaborative-editing system at Figma scale use optimistic concurrency for the same reason — locks would either kill throughput or deadlock across regions.

## intuition
Every row gets a monotonically increasing version (or a content hash, or a timestamp). A transaction reads `(value, v)`, computes the new value, and writes back conditionally: "set value to v_new where version = v." The database increments the version atomically on success. If two transactions read the same `v` and both try to commit, exactly one wins; the loser sees "0 rows updated" and either retries the whole read-compute-write loop or surfaces a conflict to the user. No lock, no blocking; the cost is occasional re-work on the loser.

The deeper insight is that optimism trades coordination for retries. Pessimistic locking assumes conflicts are common and pays the coordination cost up front (acquire the lock, do the work, release). Optimistic locking assumes conflicts are rare and only pays a cost when one actually happens (do the work speculatively, validate at commit, retry on failure). For typical OLTP workloads — many concurrent users editing different rows — the probability of conflict on a specific row is tiny, so the average cost is far lower than pessimistic locking.

The pattern degrades when conflicts become common (hot rows like a counter incremented by every request). In that regime, optimistic retries livelock — the same row is fought over endlessly, throughput collapses. The fix is either to switch back to a short pessimistic lock for that specific path, or to redesign so the hot row no longer exists (sharded counters, append-only logs reduced offline, CRDT counters that always merge).

## visualization
```
T1 read  user(id=7) -> { balance: 100, v: 5 }
T2 read  user(id=7) -> { balance: 100, v: 5 }

T1 commit: UPDATE user SET balance=80,  v=6 WHERE id=7 AND v=5   -> 1 row, wins
T2 commit: UPDATE user SET balance=130, v=6 WHERE id=7 AND v=5   -> 0 rows, ABORT

T2 retry: read user(id=7) -> { balance: 80, v: 6 }
T2 commit: UPDATE user SET balance=110, v=7 WHERE id=7 AND v=6   -> 1 row, wins
```

## bruteForce
Read-modify-write with no version check at all (the lost-update bug). T1 reads 100, T2 reads 100, T1 writes 80, T2 writes 130 — T1's debit silently disappears. This is the canonical race that optimistic locking exists to prevent. It is not slower than the broken version; it is the same speed with a safety net.

## optimal
Read the row plus its version. Compute the new value. Issue a conditional update that requires the version to be unchanged and atomically bumps it. If zero rows were affected, the row changed under you; retry the whole loop with exponential backoff plus jitter. Cap the retry count and surface a 409 Conflict to the caller after a few rounds so the application can decide whether to re-read, merge, or ask the user.

```sql
-- SQL row version: the canonical implementation
UPDATE accounts
SET balance = $new_balance, version = version + 1
WHERE id = $id AND version = $observed_version;
-- 1 row updated => commit; 0 rows => conflict, retry
```

```python
def transfer(db, from_id, to_id, amount, max_retries=5):
    for attempt in range(max_retries):
        rows = db.execute('SELECT id, balance, version FROM accounts WHERE id IN (%s, %s)', (from_id, to_id))
        balances = {r.id: r for r in rows}
        if balances[from_id].balance < amount: raise InsufficientFunds()
        with db.transaction():
            n1 = db.execute('UPDATE accounts SET balance = balance - %s, version = version + 1 WHERE id = %s AND version = %s', (amount, from_id, balances[from_id].version))
            n2 = db.execute('UPDATE accounts SET balance = balance + %s, version = version + 1 WHERE id = %s AND version = %s', (amount, to_id, balances[to_id].version))
            if n1 == 1 and n2 == 1: return
        time.sleep(random.uniform(0, 0.05 * (2 ** attempt)))
    raise ConflictError()
```

The critical clause is `WHERE id = %s AND version = %s` — the version predicate is what makes the UPDATE conditional. Choose the version source by storage: a `version BIGINT NOT NULL` column for SQL rows, `ETag` plus `If-Match` for HTTP resources (the conditional-PUT family in RFC 7232), `WATCH`/`MULTI`/`EXEC` for Redis (EXEC fails if any watched key changed), conditional writes in DynamoDB (`condition_expression='version = :v'`), lightweight transactions in Cassandra (the `IF` clause), and `resourceVersion` plus `Update()` in the Kubernetes API. For multi-row transactions, every read row's version must appear in the predicate of its update; the commit succeeds atomically only if every check holds. Pair with backoff plus jitter to avoid livelock during contention spikes.

## complexity
time: O(work_per_attempt * expected_retries); expected retries ≈ 1 / (1 - contention_probability)
space: O(1) extra per row — one version column
notes: Throughput is excellent under low contention and collapses (livelock) above ~30% conflict rate. Switch to pessimistic locking there.

## pitfalls
- Forgetting backoff — under high contention, retries collide deterministically and never converge. Add exponential jitter.
- Treating a unique-index violation as a version conflict — it isn't; surface it as a different error.
- Wrapping the retry around side-effectful code (sending an email, charging a card) — re-execution duplicates the side effect. Make external calls idempotent or move them out of the retry loop.
- Reading at READ COMMITTED then writing with a version check — the version check works, but the *read* might see torn state across rows. Use a snapshot/MVCC isolation for the read phase.
- Bumping the version manually in application code rather than in the UPDATE — concurrent updaters can both see the same "new" version and clash silently.

## interviewTips
- Frame it as "first writer wins, late writer retries." Most interviewers want that one sentence first.
- Contrast with pessimistic locks: "OCC trades blocking for retries; pessimistic trades retries for blocking. Pick by contention rate."
- Mention real APIs: HTTP ETag/If-Match, DynamoDB ConditionExpression, Redis WATCH, Postgres MVCC.
- Be ready to design a retry strategy: cap attempts, exponential backoff with jitter, surface a 409 Conflict after the cap.

## code.python
```python
import random, time

class ConflictError(Exception): pass

def update_balance(db, user_id, delta, max_retries=5):
    for attempt in range(max_retries):
        row = db.execute("SELECT balance, version FROM users WHERE id = %s", (user_id,)).fetchone()
        new_balance = row.balance + delta
        if new_balance < 0:
            raise ValueError("insufficient funds")
        updated = db.execute(
            "UPDATE users SET balance = %s, version = version + 1 "
            "WHERE id = %s AND version = %s",
            (new_balance, user_id, row.version),
        ).rowcount
        if updated == 1:
            return new_balance
        time.sleep(min(0.1 * (2 ** attempt), 1.0) * random.random())
    raise ConflictError(f"could not commit after {max_retries} retries")
```

## code.javascript
```javascript
class ConflictError extends Error {}

export async function updateBalance(db, userId, delta, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const row = await db.one('SELECT balance, version FROM users WHERE id = $1', [userId]);
    const next = row.balance + delta;
    if (next < 0) throw new Error('insufficient funds');
    const { rowCount } = await db.result(
      'UPDATE users SET balance = $1, version = version + 1 WHERE id = $2 AND version = $3',
      [next, userId, row.version]
    );
    if (rowCount === 1) return next;
    const backoff = Math.min(100 * 2 ** attempt, 1000) * Math.random();
    await new Promise(r => setTimeout(r, backoff));
  }
  throw new ConflictError('retry limit exceeded');
}
```

## code.java
```java
public long updateBalance(long userId, long delta) throws ConflictException {
    for (int attempt = 0; attempt < 5; attempt++) {
        Row row = jdbc.queryForObject(
            "SELECT balance, version FROM users WHERE id = ?",
            (rs, i) -> new Row(rs.getLong(1), rs.getLong(2)), userId);
        long next = row.balance + delta;
        if (next < 0) throw new IllegalStateException("insufficient funds");
        int updated = jdbc.update(
            "UPDATE users SET balance = ?, version = version + 1 WHERE id = ? AND version = ?",
            next, userId, row.version);
        if (updated == 1) return next;
        try { Thread.sleep((long)(Math.min(100L << attempt, 1000L) * Math.random())); }
        catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
    }
    throw new ConflictException("retry limit exceeded");
}
```

## code.cpp
```cpp
long updateBalance(DB& db, long userId, long delta, int maxRetries = 5) {
    for (int attempt = 0; attempt < maxRetries; ++attempt) {
        auto row = db.queryOne(
            "SELECT balance, version FROM users WHERE id = ?", userId);
        long next = row.balance + delta;
        if (next < 0) throw std::runtime_error("insufficient funds");
        int updated = db.exec(
            "UPDATE users SET balance = ?, version = version + 1 "
            "WHERE id = ? AND version = ?",
            next, userId, row.version);
        if (updated == 1) return next;
        auto delay = std::min(100LL << attempt, 1000LL) * (rand() / (double)RAND_MAX);
        std::this_thread::sleep_for(std::chrono::milliseconds((long)delay));
    }
    throw std::runtime_error("retry limit exceeded");
}
```
