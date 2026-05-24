---
slug: database-indexing
module: system-design
title: Database Indexing
subtitle: Trade write-time + storage for read-time — B-tree, hash, GIN, BRIN, partial, composite. Pick by query shape.
difficulty: Intermediate
position: 41
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Use The Index, Luke! (Markus Winand)"
    url: "https://use-the-index-luke.com/"
    type: book
  - title: "PostgreSQL docs — Index types"
    url: "https://www.postgresql.org/docs/current/indexes-types.html"
    type: blog
  - title: "postgres/postgres — built-in B-tree, GIN, BRIN, SP-GiST"
    url: "https://github.com/postgres/postgres"
    type: repo
status: published
---

## intro
A **database index** is a precomputed structure that maps column values to the rows that contain them — turning O(n) full-table scans into O(log n) lookups. Different index types target different query shapes: **B-tree** for ordered/range queries (default), **hash** for equality only, **GIN** for full-text + JSON containment, **BRIN** for huge sequential tables, **partial** for filtering subsets, **composite** for multi-column queries.

## whyItMatters
The single most impactful optimization in a DB. Right index = 100ms vs 100s; wrong index = wasted write throughput + storage. Most "slow DB" problems are missing or wrong indexes.

Production realities:
- **Insertions slow down** with index count: each index updated on every INSERT/UPDATE.
- **Storage cost**: indexes can equal or exceed table size.
- **Wrong index unused**: query optimizer ignores it. `EXPLAIN ANALYZE` is the truth.

## intuition
**B-tree** (default in Postgres / MySQL InnoDB): sorted, supports `=`, `<`, `>`, `BETWEEN`, `LIKE 'prefix%'`, `ORDER BY`. The 99% case.

**Hash**: O(1) equality lookup only. Doesn't support range queries. Rarely needed in Postgres (B-tree is fast enough).

**GIN** (Generalized Inverted): for arrays, JSONB, full-text search. Each "element" inside the column gets an entry pointing to rows containing it. Fast for "contains" queries; slow to update.

**BRIN** (Block Range Index): tiny index summarizing min/max per disk block. Great for tables sorted on disk by the indexed column (e.g., time-series). 1000× smaller than B-tree.

**Composite index** `(col_a, col_b, col_c)`: efficient for queries filtering on a prefix of those columns in order. `WHERE col_a = X AND col_b = Y` uses it; `WHERE col_b = Y` alone does NOT.

**Partial index** `WHERE deleted_at IS NULL`: index only the rows matching the predicate. Smaller + faster for queries filtering by the same predicate.

**Covering index** (`INCLUDE`): include extra non-key columns so queries can be served entirely from the index without hitting the table.

## visualization
```
B-tree on (user_id, created_at):
                  [user_id]
                /     |     \
          [u3,u7]  [u15,u20]  [u30]
            /          |         \
         [...sorted by created_at within each leaf...]

Query: WHERE user_id = 7 AND created_at > '2024-01-01'
  → walk B-tree root → middle child → leaf with u7 entries
  → scan forward in leaf until created_at > threshold
  → return row pointers

Without index: full table scan = O(n)
With B-tree:   O(log n) + O(matched-rows)
```

## bruteForce
**No index**: full table scan on every WHERE. Acceptable for tables < 10k rows; catastrophic past 1M.

**Index every column**: writes slow to a crawl, storage explodes, optimizer confuses itself. Only index columns that appear in WHERE / ORDER BY / JOIN.

**Wrong index order**: `(country, city)` won't help `WHERE city = ...` queries. Match composite order to query predicates.

## optimal
**Workflow**:
1. Run the query.
2. `EXPLAIN ANALYZE` it. Look for "Seq Scan" (bad on big tables) vs "Index Scan" (good).
3. If "Seq Scan", create the right index, re-test.
4. Drop unused indexes (`pg_stat_user_indexes` shows usage counts).

**Choosing index type by query**:
| Query | Index |
|---|---|
| `WHERE user_id = ?` | B-tree on `(user_id)` |
| `WHERE created_at BETWEEN ? AND ?` | B-tree on `(created_at)` |
| `WHERE user_id = ? AND created_at > ?` | Composite on `(user_id, created_at)` |
| `WHERE tags @> ARRAY['python']` | GIN on `(tags)` |
| `WHERE jsonb_col @> '{"key": "val"}'` | GIN on `(jsonb_col jsonb_path_ops)` |
| `WHERE to_tsvector('en', body) @@ ...` | GIN on `(to_tsvector(...))` |
| `WHERE created_at > now() - '7 days'` on TB-table | BRIN on `(created_at)` |
| `WHERE active = true` (10% of rows) | Partial B-tree `WHERE active = true` |

**Composite order rules**:
- **Equality columns first**, then range columns.
- `(user_id, created_at)` for `user_id = X AND created_at BETWEEN Y AND Z`.
- NOT `(created_at, user_id)` — `created_at` is range, can't seek to specific `user_id` after.

**Covering** (Postgres 11+):
```sql
CREATE INDEX idx_users_email_inc ON users (email) INCLUDE (name, created_at);
-- Query: SELECT name, created_at FROM users WHERE email = ?
-- Served entirely from index (no heap fetch).
```

## complexity
- **B-tree lookup**: O(log n).
- **B-tree insert**: O(log n) per index.
- **GIN insert**: O(k log n) where k = elements in column.
- **Storage**: B-tree ≈ table size; GIN can exceed it.
- **VACUUM cost**: indexes increase autovacuum work.

## pitfalls
- **Index not used because of type mismatch**: `WHERE id = '7'` (string) on `id INT` skips index — implicit cast.
- **`LIKE '%abc%'`** can't use B-tree (no fixed prefix). Use trigram index (`pg_trgm`) for substring search.
- **Too many indexes**: writes slow down. Drop unused ones (`pg_stat_user_indexes`).
- **Hot updates blocking index update**: Postgres HOT (Heap-Only Tuple) updates skip index update if indexed column unchanged. Use it.
- **Functional indexes need exact function match**: `CREATE INDEX ON x (LOWER(email))` only helps `WHERE LOWER(email) = ?`, not `WHERE email = ?`.
- **Bloat**: index pages get fragmented; `REINDEX CONCURRENTLY` to rebuild without locking.

## interviewTips
- For "slow query" — `EXPLAIN ANALYZE` first; add index if "Seq Scan" + selective predicate.
- Distinguish **composite vs separate single-column indexes** — composite wins for AND'd filters.
- For senior: discuss **index-only scans** (covering), **partial indexes**, **GIN for JSONB / arrays**, **BRIN for time-series**.

## code.python
```python
# Postgres index creation via psycopg2
cur.execute("""
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created
    ON orders (user_id, created_at)
    WHERE status != 'cancelled'  -- partial index
""")
```

## code.javascript
```javascript
// Prisma schema
// model User {
//   id        Int      @id @default(autoincrement())
//   email     String   @unique
//   createdAt DateTime
//
//   @@index([email, createdAt])
// }
```

## code.java
```java
// JPA annotation
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_user_created", columnList = "user_id,created_at")
})
class Order { /* ... */ }
```

## code.cpp
```cpp
// SQL DDL via libpqxx
// pqxx::nontransaction nt(conn);
// nt.exec("CREATE INDEX CONCURRENTLY ON orders (user_id, created_at)");
```
