---
slug: db-partitioning-strategies
module: sd-storage
title: Database Partitioning Strategies
subtitle: Range, hash, list, and composite partitioning in Postgres and MySQL — what each one optimizes and what it breaks.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 6: Partitioning"
    url: "https://dataintensive.net/"
    type: book
  - title: "Martin Fowler — bliki on database sharding"
    url: "https://martinfowler.com/"
    type: blog
  - title: "donnemartin/system-design-primer — Sharding section"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A table that does not fit on one disk, or that takes 30 seconds to vacuum, or whose hot rows live on one box that keeps catching fire — that table needs partitioning. The question is *how*: split by range of a timestamp, by hash of a key, by an explicit list of regions, or by some composite of those. The choice ripples through every query, every index, every maintenance job, and almost every failure mode for the lifetime of the system.

## whyItMatters
Postgres and MySQL both ship native declarative partitioning. The right strategy makes a billion-row table feel like a hundred million-row tables; the wrong one creates hot partitions where 80 percent of traffic lands on one shard. Senior interview rounds always include "how would you partition this?" because the answer reveals whether a candidate distinguishes physical layout from logical schema.

## intuition
- **Range partitioning** splits by ordered ranges — typical for time series: `2025-01`, `2025-02`, `2025-03`. Easy to drop old partitions; easy to hotspot the current month.
- **Hash partitioning** splits by `hash(key) mod N` — uniform distribution by construction, terrible for range scans (`WHERE created_at > X` reads every partition).
- **List partitioning** splits by enumerated values — `region IN ('us', 'eu', 'apac')`. Good for tenant isolation; rigid when the list grows.
- **Composite partitioning** combines two: range by month, then hash by `user_id` inside each month. Best of both, twice the operational surface area.

## visualization
Same `events` table, four strategies:

```
RANGE by created_at (monthly):
  events_2025_01  [Jan rows]
  events_2025_02  [Feb rows]
  events_2025_03  [Mar rows]    <- current month, hot

HASH by user_id (4 partitions):
  events_h0  [user_id % 4 == 0]
  events_h1  [user_id % 4 == 1]
  events_h2  [user_id % 4 == 2]
  events_h3  [user_id % 4 == 3]   <- uniform load

LIST by region:
  events_us   [region = 'us']     <- 70% of traffic
  events_eu   [region = 'eu']
  events_apac [region = 'apac']

COMPOSITE range(month) -> hash(user_id):
  events_2025_03_h0
  events_2025_03_h1
  events_2025_03_h2
  events_2025_03_h3
```

## bruteForce
One unpartitioned table: a single `CREATE INDEX` takes 4 hours under load, autovacuum cannot keep up with bloat, dropping last month's data requires `DELETE WHERE created_at < ...` followed by a `VACUUM FULL` that locks the table for hours. Backups grow linearly, restoring is all-or-nothing. Most teams hit the wall around 200–500 GB or 1 billion rows; some hit it sooner because of index bloat.

## optimal
Choose the partition key from the dominant query pattern, not the natural primary key:
- Time-series append-heavy workloads → range by month/day. Use `pg_partman` or MySQL `PARTITION BY RANGE` with monthly partitions and a scheduled `CREATE`/`DETACH`/`DROP` job.
- Multi-tenant SaaS with skewed tenant sizes → hash by `tenant_id` so big and small tenants spread evenly; if a tenant outgrows one partition, escape hatch is composite with sub-hashing.
- Globally distributed data with sovereignty constraints → list by region; pair with separate replicas per region.
- Heavy read on recent + heavy write across all users → composite (range outer, hash inner).

Always have a default partition catch-all to absorb rows whose key falls outside expected ranges, then alert when it grows. Index per-partition, not on the parent (Postgres 11+ replicates parent indexes automatically; earlier versions don't).

## complexity
time: Partition pruning turns a full table scan O(N) into a per-partition scan O(N/P). Queries that can be answered from one partition see proportional speedup; cross-partition queries either fan out (parallel) or serialize.
space: One partition per logical chunk plus its indexes. Postgres metadata overhead is ~100 KB per partition — keeps you under ~10k partitions per table in practice.
notes: Joins across partitioned tables work best when both are partitioned by the same key (partition-wise join, Postgres 12+).

## pitfalls
- Partitioning by `id` when queries filter by `created_at` — no pruning happens, every partition gets scanned.
- Forgetting `partition pruning` requires the planner to see the key in the `WHERE` clause as a literal or simple expression. `WHERE created_at = now() - interval '1 day'` is fine; `WHERE created_at = some_function()` may defeat pruning.
- Unique constraints must include the partition key — otherwise the DB cannot enforce them globally without scanning every partition.
- Hash partitioning + range queries = full fan-out scans. If you need both, composite is your friend.
- MySQL's MyISAM-era partition limit of 1024 still applies; InnoDB raised it but per-partition open-file overhead matters at scale.

## interviewTips
- Open with "the partition key is the schema." Same line works for Kafka, same line works for Postgres.
- Know the difference between *partitioning* (one DB, many physical pieces of one table) and *sharding* (many DBs, each holding a piece). Hash partitioning is the natural precursor to hash sharding.
- Mention the consistent-hashing variant (or jump hash) for sharding so adding a shard moves O(1/N) keys instead of all of them.
- When asked "design a metrics store" — range by day, with daily detach-and-drop. When asked "design a chat backend" — hash by `conversation_id` so all messages in a chat colocate.

## code.python
```python
import psycopg

conn = psycopg.connect("...")
conn.execute("""
CREATE TABLE events (
    id BIGSERIAL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    payload JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
""")

for month in ("2025-01", "2025-02", "2025-03"):
    conn.execute(f"""
    CREATE TABLE events_{month.replace('-', '_')}
    PARTITION OF events
    FOR VALUES FROM ('{month}-01') TO ('{month}-01'::date + interval '1 month');
    """)
```

## code.javascript
```javascript
import postgres from "postgres";
const sql = postgres();

await sql`
  CREATE TABLE events (
    id BIGSERIAL,
    tenant_id BIGINT NOT NULL,
    payload JSONB,
    PRIMARY KEY (id, tenant_id)
  ) PARTITION BY HASH (tenant_id)
`;

for (let i = 0; i < 8; i++) {
  await sql`
    CREATE TABLE events_h${sql(String(i))}
    PARTITION OF events FOR VALUES WITH (MODULUS 8, REMAINDER ${i})
  `;
}
```

## code.java
```java
try (Connection c = DriverManager.getConnection(url, user, pw);
     Statement s = c.createStatement()) {
    s.execute("""
      CREATE TABLE events (
        id BIGSERIAL,
        region TEXT NOT NULL,
        payload JSONB,
        PRIMARY KEY (id, region)
      ) PARTITION BY LIST (region)
    """);
    for (String r : List.of("us", "eu", "apac")) {
        s.execute("CREATE TABLE events_" + r + " PARTITION OF events FOR VALUES IN ('" + r + "')");
    }
}
```

## code.cpp
```cpp
#include <pqxx/pqxx>

int main() {
    pqxx::connection c{"..."};
    pqxx::work tx{c};
    tx.exec(R"(
        CREATE TABLE events (
            id BIGSERIAL,
            user_id BIGINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            payload JSONB,
            PRIMARY KEY (id, user_id, created_at)
        ) PARTITION BY RANGE (created_at)
    )");
    for (auto m : {"2025_01", "2025_02", "2025_03"}) {
        tx.exec("CREATE TABLE events_" + std::string(m) +
                "_p PARTITION OF events FOR VALUES FROM ('2025-01-01') TO ('2025-02-01')");
    }
    tx.commit();
}
```
