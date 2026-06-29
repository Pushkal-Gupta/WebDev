---
slug: db-indexing-btree
module: databases
title: Indexing and the B+ Tree
subtitle: How a database finds one row among a billion in a handful of disk reads — and when an index quietly makes things slower.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 13
prereqs: [db-relational-model]
relatedProblems: []
references:
  - title: "CMU 15-445 — Tree Indexes / B+ Trees (Lecture 8)"
    url: "https://15445.courses.cs.cmu.edu/fall2023/notes/08-trees.pdf"
    type: course
  - title: "PostgreSQL Documentation — Index Types"
    url: "https://www.postgresql.org/docs/current/indexes-types.html"
    type: docs
  - title: "Use The Index, Luke! — Anatomy of an Index"
    url: "https://use-the-index-luke.com/sql/anatomy"
    type: article
status: published
---

## intro
An index is a separate, sorted data structure the database keeps alongside a table so it can find rows by a column's value without scanning every row. Without one, answering "find the customer with email `ada@x.com`" means a **full table scan** — read every page, check every row — which is O(n). With an index on `email`, the same lookup is O(log n): a few hops down a tree instead of a million row comparisons. The structure that makes this work in virtually every relational database is the **B+ tree**, a balanced, high-fan-out tree designed specifically for the reality that data lives on disk, where a random read is thousands of times slower than a comparison in memory.

## whyItMatters
Indexes are the single biggest lever on database performance, and the most common cause of both dazzling speedups and baffling slowdowns. A query that takes ten minutes with a sequential scan can take ten milliseconds with the right index; a missing index on a foreign key can turn a join into an O(R × S) catastrophe. But indexes are not free: every index must be updated on every `INSERT`, `UPDATE`, and `DELETE`, so an over-indexed table writes slowly, and each index consumes storage and memory. Understanding the B+ tree tells you *which* queries an index can accelerate (equality and range lookups on the leading columns, sorted scans, covering reads) and which it cannot (leading wildcard `LIKE '%x'`, functions over the column, low-selectivity predicates). Knowing the structure is what separates "add an index and hope" from deliberately shaping the access path. It is the difference between a database that scales and one that grinds to a halt at production load.

## intuition
Imagine a phone book for a city of a million people, but unsorted — names in arrival order. Finding "Turing" means reading every entry: a full scan. Now sort the book by surname. Suddenly you do not read a million entries; you open to the middle, see you have gone too far or not far enough, and halve the search each time — binary search, about 20 comparisons. A B+ tree is this idea built for disk.

The data does not live as one flat sorted list, because keeping a million-entry list sorted under inserts is expensive. Instead the keys are spread across a shallow, bushy tree. **Leaf nodes** hold the actual keys in sorted order, each paired with a pointer to the full row (or, in a clustered index, the row itself), and the leaves are **chained left-to-right** in a linked list so a range scan ("all orders from March") walks them sequentially. **Internal nodes** hold only separator keys and child pointers — they are signposts, not data — saying "keys less than 50 go left, 50 to 90 go middle, 90+ go right." Because a disk page is large (say 8 KB) and a separator key is small, one internal node can point to *hundreds* of children. That huge fan-out is the whole trick: with fan-out 100, three levels address a hundred million leaves. So a lookup is: read the root page, pick a child, read that page, pick a child, read the leaf — **three or four disk reads** to find one row among a hundred million, versus reading every page in a scan.

The tree stays balanced automatically. When you insert a key into a full leaf, the leaf **splits** into two half-full leaves and a separator key is pushed up to the parent; if the parent overflows it splits too, possibly all the way to the root, which grows the tree by one level. Because growth happens only at the root, every leaf is always the same distance from the root — every lookup costs the same O(log n), with no degenerate worst case. Deletes merge under-full nodes symmetrically. This self-balancing under churn, combined with the disk-friendly high fan-out and the chained leaves for ranges, is exactly why the B+ tree, not a binary search tree or a hash table, is the default database index.

## visualization
```
                       +-----------------+
                       |   [ 30 | 60 ]   |        root (separators only)
                       +--+------+-----+--+
              keys<30 /     30..60|        \ keys>=60
                     v            v         v
            +-------+      +-----------+     +---------+
            |10 20|       | 30 40 50  |     | 60 70 90|        leaf nodes
            +--+--+       +-----+-----+     +----+----+
               |               |                |
               +-->+-----------+--------------->+---->  (leaves chained for range scans)

search 50:  root -> "50 is in 30..60" -> middle leaf -> found.  3 reads.
full scan:  read all 8 keys (here) / all 1,000,000 rows (real). O(n).

insert 25 into full leaf [10 20] -> split -> [10] [20 25], push separator 20 up.
```

## bruteForce
The baseline is the **full table scan**: to find rows matching a predicate, read every page of the table from disk and test every row. It is O(n) in rows and, more importantly for databases, O(n / rows-per-page) in *disk I/O* — and disk I/O dominates. For a point lookup ("the row with id 7,401,233") this is wasteful: you read millions of irrelevant rows to return one. A scan is the right tool only when you genuinely need most of the rows (an aggregate over the whole table, a query with no selective predicate) or when the table is tiny enough to fit in a page or two. The naive alternative people reach for — keeping the whole table sorted by the search key as a flat array — gives O(log n) binary search but O(n) inserts, because inserting one row shifts everything after it. That write cost is unacceptable for a table under constant mutation, which is exactly the gap the B+ tree fills.

## optimal
The optimal structure is the **B+ tree index**: a balanced tree with a fan-out chosen so each node fills one disk page, giving a height of about \(\log_f n\) for fan-out \(f\) (typically 3–4 levels for hundreds of millions of rows). A point lookup costs O(height) = O(log n) disk reads; a range query descends once to the start key then walks the chained leaves, costing O(log n + k) for k matching rows. Inserts and deletes are O(log n) because a split or merge propagates at most up one root-to-leaf path, and the tree rebalances itself so performance never degrades. Crucially, the index also serves **sorted output for free** (an `ORDER BY` on the indexed column needs no sort) and can be a **covering index** — if every column the query needs is in the index, the engine answers entirely from the index without touching the table at all. The discipline: index the columns you filter and join on, put the most selective / most-used column first in a composite index, and remember that the leftmost-prefix rule means an index on `(a, b)` helps queries on `a` and on `a, b` but not on `b` alone.

```sql
-- Without an index this is a full scan; with one it is a few page reads.
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'ada@x.com';          -- O(log n) point lookup

-- A range query descends once then walks chained leaves: O(log n + k).
CREATE INDEX idx_orders_created ON orders(created_at);
SELECT * FROM orders WHERE created_at >= '2024-03-01'
                       AND created_at <  '2024-04-01';   -- index range scan

-- Composite index: leftmost-prefix rule. Helps (status) and (status, created_at),
-- but NOT a query filtering on created_at alone.
CREATE INDEX idx_orders_status_date ON orders(status, created_at);

-- Inspect the plan to confirm the index is actually used:
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'ada@x.com';
```

## complexity
time: Point lookup O(log_f n) disk reads (height of the tree, f = fan-out per page). Range scan O(log_f n + k) for k results via chained leaves. Insert / delete / update O(log_f n) including a possible split or merge along one path.
space: O(n) extra storage for the index — roughly one entry per row plus internal-node overhead. Each index also adds write amplification: every row mutation updates every index on the table.
notes: Height is ~3-4 for hundreds of millions of rows because fan-out is in the hundreds. A full scan is O(n) and wins only for low-selectivity queries or tiny tables. Hash indexes give O(1) equality but no range or sort support.

## pitfalls
- Indexing a low-selectivity column. An index on a boolean or a `status` with three values rarely helps — if a predicate matches 40% of rows, the planner correctly prefers a sequential scan, and the index just slows writes. Index columns where each value points to few rows.
- Wrapping the indexed column in a function. `WHERE lower(email) = 'x'` or `WHERE date(created_at) = '2024-03-01'` cannot use a plain index on the raw column; the engine must compute the function per row. Use an expression index or rewrite the predicate as a range.
- Leading wildcard LIKE. `WHERE name LIKE '%son'` cannot use a B+ tree, because the tree is sorted by prefix and an unknown prefix gives no starting point. `LIKE 'son%'` (trailing wildcard) can.
- Violating the leftmost-prefix rule. An index on `(a, b, c)` does not accelerate a query that filters only on `b` or `c`; the leading column must be constrained. Order composite-index columns by how queries actually filter.
- Over-indexing write-heavy tables. Every extra index is paid on every INSERT/UPDATE/DELETE. A table with ten indexes can have its write throughput cut several-fold. Index for the reads you actually run, not speculatively.

## interviewTips
- Anchor on disk: "a B+ tree has huge fan-out so each node is one page; three or four reads find any row among hundreds of millions, versus a full O(n) scan." The disk-I/O framing is what interviewers want.
- Explain why B+ tree over a binary tree or hash: high fan-out shrinks height (fewer disk reads), chained leaves give cheap range scans and sorted output, and it self-balances under inserts — a hash index gives O(1) equality but no ranges.
- Know when an index hurts: low selectivity, functions over the column, leading wildcards, and write amplification on mutation-heavy tables. Saying "I'd EXPLAIN it first" signals real experience.

## keyTakeaways
- A B+ tree index turns an O(n) full table scan into an O(log n) lookup by keeping keys in a shallow, high-fan-out, self-balancing tree whose leaves are chained for range scans — built for disk, where reads dominate.
- Inserts split full nodes and pull a separator up (deletes merge under-full nodes), so the tree stays balanced and every lookup costs the same height regardless of insertion order.
- Indexes are not free: they help equality / range / sort queries on leading columns but hurt low-selectivity predicates, function-wrapped columns, leading wildcards, and write-heavy tables — always check the plan.

## code.sql
```sql
-- Create, use, and verify a B+ tree index.
CREATE INDEX idx_users_email ON users(email);

-- Point lookup: O(log n) instead of a full scan.
SELECT id, name FROM users WHERE email = 'ada@x.com';

-- Range scan rides the chained leaves; no separate sort needed for ORDER BY.
CREATE INDEX idx_orders_created ON orders(created_at);
SELECT * FROM orders
WHERE created_at >= DATE '2024-03-01'
  AND created_at <  DATE '2024-04-01'
ORDER BY created_at;

-- Confirm the planner uses the index, not a Seq Scan:
EXPLAIN ANALYZE SELECT id, name FROM users WHERE email = 'ada@x.com';
```

## code.python
```python
# A minimal B+ tree-flavoured search to show the O(log n) descent vs an O(n) scan.
import bisect

class Leaf:
    def __init__(self, keys, rows): self.keys, self.rows, self.next = keys, rows, None

def descend(root_separators, children, key):
    """root_separators=[30,60]; children=[leaf0, leaf1, leaf2]. Pick the child."""
    idx = bisect.bisect_right(root_separators, key)   # one comparison set per level
    return children[idx]

def index_lookup(root_sep, children, key):
    leaf = descend(root_sep, children, key)            # O(log n) levels (here, 1)
    i = bisect.bisect_left(leaf.keys, key)             # binary search inside the leaf
    return leaf.rows[i] if i < len(leaf.keys) and leaf.keys[i] == key else None

def full_scan(all_rows, key):                          # O(n): the thing we avoid
    return next((r for r in all_rows if r["k"] == key), None)

l0 = Leaf([10, 20], [{"k": 10}, {"k": 20}])
l1 = Leaf([30, 40, 50], [{"k": 30}, {"k": 40}, {"k": 50}])
l2 = Leaf([60, 70, 90], [{"k": 60}, {"k": 70}, {"k": 90}])
print(index_lookup([30, 60], [l0, l1, l2], 50))        # {'k': 50} in 2 hops
```

## code.javascript
```javascript
// Same idea: descend separators, then binary-search the leaf. O(log n), not O(n).
function bisectRight(arr, x) {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m + 1; else hi = m; }
  return lo;
}
function indexLookup(separators, leaves, key) {
  const leaf = leaves[bisectRight(separators, key)];   // pick the child (one level)
  let lo = 0, hi = leaf.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (leaf[m] < key) lo = m + 1; else hi = m; }
  return leaf[lo] === key ? leaf[lo] : null;           // found, or null
}

const leaves = [[10, 20], [30, 40, 50], [60, 70, 90]];
console.log(indexLookup([30, 60], leaves, 50)); // 50, found in two hops
```
