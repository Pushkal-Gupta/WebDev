---
slug: database-connection-pool
module: cs-db-transactions
title: Database Connection Pool
subtitle: Reuse N persistent DB connections across many app requests — avoid the 50ms+ TCP+TLS+auth per new connection.
difficulty: Intermediate
position: 20
estimatedReadMinutes: 5
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Persistence chapter (clients + I/O)"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Brandur — Postgres at scale: pgbouncer + connection pools"
    url: "https://brandur.org/postgres-connections"
    type: blog
  - title: "brettwooldridge/HikariCP — popular JVM pool implementation"
    url: "https://github.com/brettwooldridge/HikariCP"
    type: repo
status: published
---

## intro
Opening a DB connection costs **50-200ms** (TCP handshake + TLS handshake + authentication + session setup). At 10k req/s, the app can't afford a fresh connection per request. **Connection pooling** keeps N long-lived connections in a pool; each request borrows one, runs queries, returns it. Reduces per-query latency from 100ms+ to <1ms in the steady state.

## whyItMatters
Every production app hits this:
- **Postgres**: ~5 MB RAM per backend process; opening too many = OOM. Pool caps connection count.
- **MySQL**: similar.
- **JDBC / Spring**: HikariCP defaults to 10 connections.
- **Python**: psycopg2 + SQLAlchemy pool, or pgbouncer in front.
- **Serverless**: Lambda functions face cold starts re-opening connections — use RDS Proxy / pgbouncer.

Wrong pool config → 5xx storms (pool exhausted, requests time out) OR memory pressure on the DB (too many backends).

## intuition
Two layers:
1. **App-side pool** (HikariCP / SQLAlchemy / pg-pool / Tokio sqlx): keeps connections per app instance. Cap = `max_pool_size`.
2. **External pooler** (PgBouncer / RDS Proxy / Pgpool): sits between app + DB. Multiple app instances share its pool. Critical when app fleet is auto-scaled.

Pool size = max_concurrent_db_queries the app can issue. Setting it too high = DB overload. Too low = requests block in the queue.

## visualization
```
Without pooling:
  Request 1: [TCP][TLS][AUTH][QUERY][CLOSE]  = 200ms
  Request 2: [TCP][TLS][AUTH][QUERY][CLOSE]  = 200ms

With pooling (10 connections):
  Request 1: [BORROW][QUERY][RETURN]  = 5ms
  Request 2: [BORROW][QUERY][RETURN]  = 5ms
  ...
  Request N (pool exhausted): [WAIT for free conn][QUERY][RETURN] = wait + 5ms

PgBouncer (transaction pooling mode):
  100 app workers ─► PgBouncer (1000 client connections)
                        │ holds 20 actual DB connections
                        ▼
                  Postgres (20 backends)
  Per-transaction connection assignment — many clients share few backends.
```

## bruteForce
**One connection per request**: 50-200ms overhead per query. Crippling at scale.

**One global connection**: serialized — only 1 query at a time. Useless for concurrent app.

**Unbounded pool**: connections grow until DB OOMs.

Pooling is the only sane answer.

## optimal
**Pool config tuning** (rules of thumb):
- `pool_size = num_app_cores * 2` if queries are mostly I/O-bound.
- For CPU-bound queries: `pool_size = num_DB_cores * 2` (because the DB itself bottlenecks).
- Total connections across all app replicas ≤ DB's `max_connections` × 0.8.
- Connection timeout: 1-5s (block waiting for free conn).
- Idle timeout: 30s-5min (recycle connections to detect dead DBs).

**PgBouncer modes**:
- **Session pooling**: one client = one backend for the connection's lifetime. Allows `SET`, prepared statements.
- **Transaction pooling**: backend assigned per transaction; freed on commit. Massive multiplexing; can't use session-level features.
- **Statement pooling**: backend per statement. Maximum multiplexing; no transactions.

Most setups use transaction pooling: 10× connection reduction with minimal app changes.

**Connection lifecycle**:
1. App requests → pool.borrow() → returns idle conn or creates new (up to max).
2. App runs queries → pool.return() → conn goes back to pool.
3. Idle for > idle_timeout → pool closes connection.
4. Validates conn before use (cheap PING) to catch dead connections.

## complexity
- **Per request**: O(1) borrow + O(1) return.
- **Memory**: pool_size × per-connection-overhead (typically 5-50 MB on Postgres backend).
- **Throughput**: bounded by min(pool_size, DB capacity).

## pitfalls
- **Holding a connection across blocking I/O**: borrowing a conn → calling an external HTTP API while holding it → pool exhausts. Always: query → return → external call.
- **Transactions across requests**: in transaction pooling mode, you can't `BEGIN` in one request and `COMMIT` in another — different backends.
- **Prepared statements in transaction pooling**: server-side prepared statements are per-backend; transaction pooling rotates backends. Use client-side preparation (PgJDBC's `prepareThreshold=0`) or session pooling.
- **Serverless cold starts**: each Lambda invocation may open new connections → DB OOM under traffic burst. Use RDS Proxy / pgbouncer as a buffer.
- **No connection validation**: dead connections after network blips poison the pool. Use a `validation_query` (`SELECT 1`).

## interviewTips
- For "how do you handle high concurrent DB load" — connection pool + PgBouncer in front.
- Mention the **session vs transaction pooling tradeoff** (key gotcha).
- For senior: discuss **per-microservice connection budget** (total across replicas) and **cold-start mitigation** in serverless.

## code.python
```python
# psycopg2 + SQLAlchemy pool
from sqlalchemy import create_engine
engine = create_engine('postgresql://user:pass@host/db',
                       pool_size=10,            # steady-state connections
                       max_overflow=20,         # burst above pool_size
                       pool_timeout=5,          # block 5s waiting for a free conn
                       pool_recycle=1800)       # recycle conns every 30 min
with engine.connect() as conn:
    result = conn.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

## code.javascript
```javascript
// node-postgres
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

## code.java
```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
HikariConfig cfg = new HikariConfig();
cfg.setJdbcUrl("jdbc:postgresql://host/db");
cfg.setMaximumPoolSize(20);
cfg.setConnectionTimeout(5000);
cfg.setIdleTimeout(600_000);
HikariDataSource ds = new HikariDataSource(cfg);
try (Connection c = ds.getConnection();
     PreparedStatement ps = c.prepareStatement("SELECT * FROM users WHERE id = ?")) {
    ps.setLong(1, userId);
    try (ResultSet rs = ps.executeQuery()) { /* ... */ }
}
```

## code.cpp
```cpp
// libpqxx + custom pool (or use a wrapper like soci)
// Production C++: most teams use a shared pool class with mutex + condition_variable
// Or run PgBouncer in front and just open connections per worker thread.
```
