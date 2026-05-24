---
slug: db-indexes
module: cs-core
title: Database Indexes
subtitle: Add a B+tree (or hash) on the right column and queries go from O(n) scan to O(log n) lookup.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 7
prereqs: []
relatedProblems: []
references:
  - title: "OSTEP — Operating Systems: Three Easy Pieces"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    type: book
  - title: "Jepsen — Distributed-systems consistency analyses"
    url: "https://jepsen.io/"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
An index is a parallel data structure the database maintains so it can find rows by some column without scanning the whole table. The default index in nearly every relational DB is a **B+tree** — it gives O(log n) point lookups, supports range scans, and handles inserts/deletes efficiently. Picking the right indexes is the single biggest knob between "this query is fast" and "this query takes 30 seconds."

## whyItMatters
Without an index, `SELECT * FROM users WHERE email = 'x'` on a 10M-row table is a full table scan — seconds of CPU + I/O. With a B+tree index on `email`, it's an O(log n) lookup — sub-millisecond. The downside: every index slows down writes (the index also has to be updated) and consumes memory + disk. Indexing is the central tradeoff in OLTP performance.

## intuition
A book's index lets you find "binary search" without reading every page. The book's table of contents is a B-tree on chapter titles; the back-of-book index is more like a hash table on individual words pointing to page numbers. Without the index, you read every page. The downside: writing a new book means also rewriting both indexes.

## visualization
```
              [50]                        <- internal node (keys, child pointers)
            /      \
       [20]          [80]
       /  \         /  \
     ...  ...     ...  ...                <- more internal nodes
                        |
   [1 → row]→[2 → row]→[3 → row]→...     <- leaf nodes hold the actual key+ptr,
                                              linked list across leaves for ranges
```

## bruteForce
No indexes: every query is a full table scan. Fine for tables under ~10k rows or analytics workloads where you read everything anyway. Murders OLTP.

## optimal
**Choose indexes by query workload, not by intuition.**

1. **Always index columns used in `WHERE`, `JOIN ON`, and `ORDER BY`** of your hot queries.
2. **Composite indexes** for multi-column predicates: an index on `(a, b, c)` accelerates `WHERE a = ?`, `WHERE a = ? AND b = ?`, and `WHERE a = ? AND b = ? AND c = ?` — but NOT `WHERE b = ?` alone. Order matters (most selective / equality columns first).
3. **Covering indexes**: include all columns the query needs so the DB doesn't have to fetch the row at all. Postgres calls this `INDEX ... INCLUDE`.
4. **Hash indexes** (Postgres, in-memory KV stores): O(1) point lookup, no range scans. Use sparingly — B+tree wins for general workloads.
5. **Specialized indexes**: GIN/GiST for full-text and JSONB (Postgres), spatial indexes for geometry, partial indexes for "WHERE deleted = false" patterns.

Then **measure**: run `EXPLAIN ANALYZE` and confirm the planner uses the index. An index that's never picked is dead weight.

## complexity
- **Point lookup**: O(log n) with B+tree, O(1) with hash.
- **Range scan**: O(log n + k) with B+tree (k = rows returned).
- **Insert/update**: O(log n) per index. M indexes = M× write cost.
- **Storage**: 5–20% of table size per index, typically.

## pitfalls
- **Indexing every column "just in case"**: tanks write throughput, bloats disk.
- **Wrong column order in composite index**: `(b, a)` doesn't help `WHERE a = ?`.
- **Functions in predicates**: `WHERE lower(email) = ...` bypasses an index on `email`. Either index `lower(email)` (expression index) or normalize at write time.
- **`SELECT *` defeating covering indexes**: select only the columns you need.
- **LIKE prefix vs suffix**: `WHERE name LIKE 'abc%'` uses an index. `WHERE name LIKE '%abc'` does not (use trigram / full-text indexes).
- **Forgetting to ANALYZE after bulk inserts**: the planner uses stale stats and picks bad plans.

## interviewTips
- Lead with "what queries do we run?" before suggesting any index.
- Always justify the column order in a composite index — "id first because equality, status second because range".
- Mention `EXPLAIN`/`EXPLAIN ANALYZE` as the verification step.
- For senior interviews, distinguish **clustered** (data physically ordered by index, MySQL InnoDB PK) vs **secondary** (separate structure pointing back) indexes.

## code.python
```sql
-- B+tree (default in Postgres/MySQL): point + range lookups on email.
CREATE INDEX idx_users_email ON users (email);

-- Composite for "find a user's orders in a date range":
CREATE INDEX idx_orders_user_date ON orders (user_id, created_at);

-- Covering index — no extra row fetch needed.
CREATE INDEX idx_orders_lookup ON orders (user_id, created_at)
  INCLUDE (status, total);
```

## code.javascript
```sql
-- Same SQL works regardless of client language. Verify usage:
EXPLAIN ANALYZE SELECT id, status FROM orders
  WHERE user_id = 42 AND created_at >= '2024-01-01'
  ORDER BY created_at DESC;
-- Look for "Index Scan using idx_orders_user_date" in the plan.
```

## code.java
```sql
-- Partial index: only rows where soft-delete flag is false.
CREATE INDEX idx_users_active_email ON users (email)
  WHERE deleted_at IS NULL;
```

## code.cpp
```sql
-- Expression index for case-insensitive lookups.
CREATE INDEX idx_users_email_lower ON users (lower(email));
SELECT * FROM users WHERE lower(email) = lower('Hello@Example.com');
```
