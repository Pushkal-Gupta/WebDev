---
slug: db-relational-model
module: databases
title: The Relational Model
subtitle: Why data lives in tables of rows and columns — and how SQL turns "the questions you ask" into joins, filters, and groups.
difficulty: Beginner
position: 1
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "CMU 15-445 — Relational Model & Relational Algebra (Lecture 1)"
    url: "https://15445.courses.cs.cmu.edu/fall2023/notes/01-relationalmodel.pdf"
    type: course
  - title: "PostgreSQL Documentation — Joins Between Tables"
    url: "https://www.postgresql.org/docs/current/tutorial-join.html"
    type: docs
  - title: "E. F. Codd — A Relational Model of Data for Large Shared Data Banks (1970)"
    url: "https://www.seas.upenn.edu/~zives/03f/cis550/codd.pdf"
    type: paper
status: published
---

## intro
The relational model says: store your data as a set of **tables** (relations), where each table is a set of **rows** (tuples) and each row has a fixed set of named **columns** (attributes) drawn from a declared type. That is the whole foundation, and it is deceptively powerful. The radical idea Codd introduced in 1970 was *logical–physical independence*: you describe **what** data you have and **what** questions you want answered, and the database engine decides **how** to lay bytes on disk and **how** to execute the query. You never write a loop over a file; you declare a relationship and let the system find the rows.

## whyItMatters
Almost every application that outlives a weekend ends up needing a relational database. The model is the lingua franca of data: Postgres, MySQL, SQLite, SQL Server, and Oracle all speak it, and SQL is one of the most portable skills in software. The reason it endures is the separation of concerns. Because queries are declarative, the same `SELECT` runs whether the table holds a hundred rows or a billion — the planner picks an index scan, a hash join, or a sequential scan based on statistics, and your code does not change. Because relationships are expressed through **keys** rather than pointers, you can add an index, shard a table, or rewrite the storage engine without touching application logic. Constraints (primary keys, foreign keys, uniqueness, checks) let the database itself guarantee data integrity, so a bug in one service cannot leave an order pointing at a customer who does not exist. Mastering the relational model is the difference between fighting your data layer and having it do the heavy lifting for you.

## intuition
Picture a spreadsheet, but with rules that a spreadsheet does not enforce. Each table is one *kind* of thing: a `customers` table, an `orders` table. Every row is one instance of that thing — one customer, one order. Every column stores one fact about that instance, and every cell holds a single atomic value, never a list. So far this is just a grid.

The magic is in **keys**. A **primary key** is a column (or set of columns) whose value is unique for every row — it is the row's name, the thing you point at when you mean *this exact customer*. A **foreign key** is a column in one table that holds the primary key of a row in another table; it is how rows reference each other. `orders.customer_id` holding the value `42` *means* "this order belongs to the customer whose id is 42." There are no pointers, no object references — relationships are values, and values can be indexed, compared, and joined.

Now the questions. **Relational algebra** is the small, closed set of operations you compose to answer any query, and every operation takes relations in and gives a relation out (so you can chain them). **Selection** (σ) keeps the rows matching a predicate — "orders over $100." **Projection** (π) keeps only certain columns — "just the names." The **join** (⋈) is the workhorse: it pairs each row of one table with the matching rows of another based on a condition, usually a foreign-key match, gluing related facts back together into one wide row. **Grouping with aggregation** collapses many rows into summary rows — "total revenue per customer." SQL is essentially a friendlier spelling of this algebra: `WHERE` is selection, the `SELECT` list is projection, `JOIN ... ON` is the join, and `GROUP BY` with `SUM`/`COUNT` is grouping. Once you see SQL as *composed algebra over sets of rows*, the language stops feeling like a grab-bag of keywords and starts feeling like a calculator for questions.

## visualization
```
customers                      orders
+----+--------+                +-----+-------------+--------+
| id | name   |                | id  | customer_id | amount |
+----+--------+                +-----+-------------+--------+
| 1  | Ada    |  <--- FK ----  | 101 |     1       |   40   |
| 2  | Linus  |  <--- FK ----  | 102 |     1       |   75   |
| 3  | Grace  |                | 103 |     2       |  120   |
+----+--------+                +-----+-------------+--------+
                                              (no order references id=3)

SELECT c.name, SUM(o.amount) AS spent     -- projection + aggregation
FROM customers c
JOIN orders o ON o.customer_id = c.id      -- join on the FK
GROUP BY c.name;                           -- collapse rows per customer

  result:  Ada -> 115     Linus -> 120     (Grace dropped: INNER JOIN, no match)
```

## bruteForce
Before relational databases, applications stored data in flat files or navigational/hierarchical stores and *walked* them by hand: open the orders file, loop over every record, and for each one open the customers file and scan it to find the matching name. This is the equivalent of a **nested-loop join written in application code** — O(R × S) comparisons for tables of size R and S, with the program hard-coding the access path. It works, but every new question means new procedural code, the "how" is welded to the "what," and changing the file layout breaks every program that touched it. There is no query planner to swap a slow strategy for a fast one, no constraint engine to stop you inserting an order for a nonexistent customer, and no shared abstraction two teams can agree on. The relational model exists precisely to retire this hand-rolled traversal.

## optimal
The optimal approach is to declare the schema and let the engine plan. You define tables with primary and foreign keys, build indexes on the columns you filter and join by, and express questions in SQL. The planner then chooses an execution strategy using table statistics: a **hash join** builds a hash table on the smaller relation and probes it with the larger (roughly O(R + S) instead of O(R × S)); a **merge join** exploits sorted inputs; a **nested-loop join** with an index on the inner table becomes O(R · log S). You did not pick any of these — you wrote one `JOIN ... ON` and the optimizer chose based on data size and available indexes. The same declarative query scales from prototype to production because the *strategy* is decoupled from the *intent*. The lesson: model the entities and their keys correctly, index what you query, and trust the engine to find the efficient access path — your job is to ask the right question, not to write the loop.

```sql
-- Schema with declared relationships the engine can enforce and optimize.
CREATE TABLE customers (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  amount      NUMERIC NOT NULL
);
CREATE INDEX idx_orders_customer ON orders(customer_id);  -- speeds the join

-- One declarative question; the planner picks hash vs merge vs index-nested-loop.
SELECT c.name, COUNT(*) AS n_orders, SUM(o.amount) AS spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.amount > 50
GROUP BY c.name
HAVING SUM(o.amount) > 100
ORDER BY spent DESC;
```

## complexity
time: A join is O(R + S) with hashing or sorted-merge, O(R · log S) with an index on the inner table, and O(R × S) for an unindexed nested loop. GROUP BY is O(n) by hashing or O(n log n) by sorting. The planner picks per query.
space: O(min(R, S)) to hold the build-side hash table for a hash join; O(n) for a hash-based GROUP BY's intermediate aggregates.
notes: Logical–physical independence means the same SQL runs on different physical plans. Indexes change time complexity without changing the query. INNER JOIN drops unmatched rows; LEFT JOIN keeps them with NULLs — choose deliberately.

## pitfalls
- Confusing INNER and OUTER joins. An INNER JOIN silently drops rows with no match (Grace disappears above); a LEFT JOIN keeps every left row, filling missing right columns with NULL. Picking the wrong one quietly loses or invents data.
- Filtering an outer join in WHERE instead of ON. Putting a condition on the right table in `WHERE` after a LEFT JOIN turns it back into an inner join, because NULLs fail the predicate — put right-side conditions in the `ON` clause.
- Selecting non-aggregated columns that are not in GROUP BY. In strict SQL this is an error; in lax modes it returns an arbitrary row's value, giving silently wrong results.
- Treating NULL as a value. `NULL = NULL` is unknown, not true; comparisons with NULL yield NULL, which acts like false in filters. Use `IS NULL` / `IS NOT NULL`, and remember `COUNT(col)` skips NULLs while `COUNT(*)` does not.
- Storing a list in a single cell (comma-separated tags). This breaks the atomic-value rule (first normal form) and makes joins, indexes, and constraints impossible — model it as a separate related table.

## interviewTips
- Define the model crisply: "a relation is a set of tuples over named, typed attributes; primary keys identify rows, foreign keys reference them." Then say SQL is relational algebra with friendly syntax.
- Map keywords to algebra out loud: WHERE = selection (σ), the SELECT list = projection (π), JOIN ON = join (⋈), GROUP BY + agg = grouping. It shows you understand the *why*, not just the syntax.
- When asked to optimize a query, talk indexes and join strategy: "index the join and filter columns; the planner can then use an index-nested-loop or hash join instead of a full O(R×S) scan."

## keyTakeaways
- Data lives in tables of rows and columns; relationships are expressed as values (foreign keys referencing primary keys), not as pointers — which is what lets the engine index, optimize, and enforce them.
- SQL is declarative relational algebra: WHERE selects rows, the SELECT list projects columns, JOIN pairs related rows, and GROUP BY with aggregates collapses many rows into summaries.
- Logical–physical independence is the payoff: you state the question, the planner picks the access path, so the same query scales from a hundred rows to a billion without code changes.

## code.sql
```sql
-- The four core operations, composed.
-- selection (WHERE), projection (SELECT list), join (JOIN ON), grouping (GROUP BY).
SELECT
  c.name,                              -- projection
  COUNT(*)        AS n_orders,         -- aggregation
  SUM(o.amount)   AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id  -- join on the foreign key
WHERE o.amount > 50                    -- selection: keep big orders
GROUP BY c.name                        -- one summary row per customer
HAVING SUM(o.amount) > 100             -- filter the groups
ORDER BY total_spent DESC;

-- LEFT JOIN keeps customers with no matching orders (NULL totals):
SELECT c.name, COALESCE(SUM(o.amount), 0) AS spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;
```

## code.python
```python
# A nested-loop INNER JOIN + GROUP BY in plain Python — what the engine does for you.
customers = [{"id": 1, "name": "Ada"}, {"id": 2, "name": "Linus"}, {"id": 3, "name": "Grace"}]
orders = [
    {"id": 101, "customer_id": 1, "amount": 40},
    {"id": 102, "customer_id": 1, "amount": 75},
    {"id": 103, "customer_id": 2, "amount": 120},
]

# JOIN: pair each order with its customer (hash the smaller table for O(R+S)).
by_id = {c["id"]: c for c in customers}
joined = [
    {"name": by_id[o["customer_id"]]["name"], "amount": o["amount"]}
    for o in orders if o["customer_id"] in by_id
]

# GROUP BY name, SUM(amount):
totals = {}
for row in joined:
    totals[row["name"]] = totals.get(row["name"], 0) + row["amount"]

print(totals)  # {'Ada': 115, 'Linus': 120}  -- Grace dropped: no matching order
```

## code.javascript
```javascript
// Same INNER JOIN + GROUP BY in JS using a hash join (Map) for O(R + S).
const customers = [{ id: 1, name: "Ada" }, { id: 2, name: "Linus" }, { id: 3, name: "Grace" }];
const orders = [
  { id: 101, customerId: 1, amount: 40 },
  { id: 102, customerId: 1, amount: 75 },
  { id: 103, customerId: 2, amount: 120 },
];

const byId = new Map(customers.map((c) => [c.id, c]));
const totals = new Map();
for (const o of orders) {
  const c = byId.get(o.customerId);
  if (!c) continue;                               // INNER JOIN: skip unmatched
  totals.set(c.name, (totals.get(c.name) ?? 0) + o.amount);
}

console.log(Object.fromEntries(totals)); // { Ada: 115, Linus: 120 }
```
