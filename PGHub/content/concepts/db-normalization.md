---
slug: db-normalization
module: databases
title: Normalization
subtitle: Why one fat table breeds update bugs — and how functional dependencies tell you exactly where to split it apart.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 12
prereqs: [db-relational-model]
relatedProblems: []
references:
  - title: "CMU 15-445 — Database Design & Normalization"
    url: "https://15445.courses.cs.cmu.edu/fall2023/notes/01-relationalmodel.pdf"
    type: course
  - title: "PostgreSQL Documentation — Constraints (keys, uniqueness, foreign keys)"
    url: "https://www.postgresql.org/docs/current/ddl-constraints.html"
    type: docs
  - title: "E. F. Codd — Further Normalization of the Data Base Relational Model (1971)"
    url: "https://forum.thethirdmanifesto.com/wp-content/uploads/asgarosforum/987737/00-efc-further-normalization.pdf"
    type: paper
status: published
---

## intro
Normalization is the process of organizing columns into tables so that each fact is stored **exactly once**. When you cram everything into one wide table — orders, the customer's name, the customer's city, the product's price — you end up repeating the same fact across many rows, and repetition is the root of corruption. Change a customer's city in one row and forget the others, and your database now disagrees with itself. Normalization uses a precise tool, the **functional dependency**, to find this redundancy and a small ladder of **normal forms** (1NF, 2NF, 3NF) to systematically decompose the fat table into smaller related tables where every fact has a single home. The payoff is a schema that cannot drift into contradiction.

## whyItMatters
The cost of a denormalized schema is paid not when you read it but when you change it, and it shows up as three named diseases. An **update anomaly**: a fact stored in many rows must be changed in all of them at once, and any miss leaves the data inconsistent. An **insertion anomaly**: you cannot record one fact without inventing another — you cannot add a new product to the catalog if products only exist as columns inside orders, because there is no order yet. A **deletion anomaly**: removing one row destroys an unrelated fact — delete the last order for a customer and you lose the customer's address entirely. These are not hypothetical; they are the most common source of "the data is wrong and nobody knows why" incidents in production systems. Normalization is the discipline that designs them out by construction. It is also the language interviewers and senior engineers use to discuss schema quality, so being able to say "this violates 3NF because city transitively depends on the key through zip" is a core fluency. The flip side — knowing when to deliberately *denormalize* for read performance — is just as important and only makes sense once you understand what you are trading away.

## intuition
Start with the tool. A **functional dependency** \(X \to Y\) means "the value of X determines the value of Y" — if two rows agree on X, they must agree on Y. In a table of orders, `customer_id → customer_name` (the same customer always has the same name) and `zip → city` (a zip code determines its city). The **key** of a table is a minimal set of columns that functionally determines every other column. Redundancy is precisely a dependency whose left side is *not* the key: if `zip → city` holds but `zip` is not the table's key, then `city` is stored redundantly, repeated once per row that shares a zip.

Now the ladder, each rung removing a kind of redundancy. **First normal form (1NF)** demands atomic values: no lists, no repeating groups, no comma-separated `tags` cell — one value per cell, so each row is a clean tuple. **Second normal form (2NF)** applies when the key is composite (several columns): no non-key column may depend on only *part* of the key. In an `(order_id, product_id)` line-items table, `product_name` depends on `product_id` alone — half the key — so it is a partial dependency and must move to a `products` table. **Third normal form (3NF)** removes **transitive dependencies**: no non-key column may depend on another non-key column. If the key is `order_id` and `order_id → zip → city`, then `city` depends on the key only *through* `zip`, a non-key column — so `city` (and the `zip → city` mapping) belongs in its own table.

The mechanical recipe for each violation is the same: take the dependency \(X \to Y\) whose left side is not a key, pull \(X\) and \(Y\) out into a new table with \(X\) as its primary key, and leave \(X\) behind in the original table as a **foreign key**. This is a *lossless* decomposition — joining the pieces back reconstructs the original exactly — and it replaces the repeated fact with a single row referenced by a key. After decomposing to 3NF, each fact lives in exactly one place: change a city in one row of the `zips` table and every order in that zip sees the new value instantly, because they all point at it. The anomalies are gone because the redundancy that caused them is gone.

## visualization
```
DENORMALIZED orders (zip -> city repeated; UPDATE ANOMALY in the box):
+----------+--------+-------+----------+
| order_id | cust   | zip   | city     |
+----------+--------+-------+----------+
| 1        | Ada    | 10001 | New York |
| 2        | Ada    | 10001 | New York |   <- change city here only and the
| 3        | Linus  | 90210 | Beverly  |      two NYC rows now disagree: BUG
+----------+--------+-------+----------+

Functional dependencies:  order_id -> cust, zip      zip -> city  (transitive!)

DECOMPOSE to 3NF (lossless: a JOIN on zip rebuilds the original):
  orders                          zips
  +----------+-------+------+     +-------+----------+
  | order_id | cust  | zip  |     | zip   | city     |
  +----------+-------+------+     +-------+----------+
  | 1        | Ada   |10001 | FK->| 10001 | New York |   one row per city.
  | 2        | Ada   |10001 |     | 90210 | Beverly  |   change it ONCE.
  | 3        | Linus |90210 |     +-------+----------+
  +----------+-------+------+
```

## bruteForce
The "brute force" schema is the single denormalized mega-table: one wide row holding every fact about an event and all the entities it touches. It is seductive because reads are trivial — no joins, everything is right there in one row, so a report query is a flat `SELECT`. This is exactly why denormalization exists as a deliberate technique for read-heavy analytical workloads. But as a *default*, the fat table is a trap: every shared fact is duplicated across rows, so writes must touch many rows to keep the duplicates in sync, and any missed row corrupts the data. It cannot represent a fact that does not yet have a host row (insertion anomaly), and deleting a row can erase facts you meant to keep (deletion anomaly). The redundancy also bloats storage and slows writes. The fat table trades a one-time read convenience for a permanent integrity hazard.

## optimal
The optimal default is a **3NF schema**: decompose until every non-key column depends on the key, the whole key, and nothing but the key. Concretely, list the functional dependencies, find the ones whose left side is not a candidate key, and split each into its own table keyed on that left side, linked back by a foreign key. The result eliminates update, insertion, and deletion anomalies because each fact has exactly one home, and foreign-key constraints let the database *enforce* referential integrity. The decomposition is lossless and dependency-preserving, so you reconstruct any original view with a join. The deliberate exception is **denormalization**: when a read path is hot and the joins are measurably too slow, you may copy a column into another table or precompute an aggregate — but you do it consciously, knowing you have reintroduced redundancy that you must now keep consistent (with triggers, application logic, or accepting staleness). The rule of thumb: **normalize until it hurts, denormalize until it works** — design for integrity first, then relax specific spots under real, measured read pressure, never speculatively.

```sql
-- 3NF target: each fact stored once, relationships via foreign keys.
CREATE TABLE zips (
  zip  TEXT PRIMARY KEY,
  city TEXT NOT NULL              -- zip -> city lives here, one row per zip
);
CREATE TABLE customers (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  zip         TEXT    NOT NULL REFERENCES zips(zip)   -- FK, not a copied city
);

-- One write fixes a city everywhere, because it is stored once:
UPDATE zips SET city = 'NYC' WHERE zip = '10001';

-- Reconstruct the original wide view losslessly when you need it:
SELECT o.order_id, c.name, o.zip, z.city
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN zips z      ON z.zip = o.zip;
```

## complexity
time: Normalized reads cost more joins (each join is O(R + S) with indexes), but writes touch one row instead of many. Denormalized reads are join-free but writes fan out across every duplicated copy.
space: Normalization removes duplicated facts, shrinking storage roughly by the duplication factor. Denormalization trades storage and write cost for fewer read-time joins.
notes: Decomposition to 3NF is lossless (a join rebuilds the original) and should be dependency-preserving. BCNF is a slightly stricter form for overlapping candidate keys. The guiding metric is the functional-dependency set, not intuition about "related" columns.

## pitfalls
- Storing repeating groups or comma-separated values in one cell. This violates 1NF and makes filtering, joining, indexing, and constraining the individual values impossible — model them as a related child table with one row each.
- Decomposing without preserving the dependencies. A careless split can make the original un-reconstructable (a lossy decomposition) or unable to enforce a dependency without a join. Verify the split is lossless: the common column must be a key of at least one resulting table.
- Treating a surrogate id as if it removes a transitive dependency. Adding an auto-increment primary key does not fix `zip → city` redundancy; the dependency among the *other* columns still holds and still duplicates the city. Normalize on the real functional dependencies, not just the key column.
- Denormalizing speculatively. Copying columns "for performance" before measuring a slow join reintroduces every anomaly for no proven gain. Normalize first; denormalize only a specific hot path under real, profiled read pressure.
- Forgetting that denormalized copies need a sync mechanism. Once you duplicate a fact, something (a trigger, the application, a batch job) must keep the copies consistent — or you are back to update anomalies, now self-inflicted.

## interviewTips
- Lead with the anomaly, not the rule: "this column is duplicated, so updating it risks inconsistency — an update anomaly — which is what normalization removes." Then name the normal form being violated.
- Use functional dependencies as the diagnostic: "1NF = atomic cells, 2NF = no partial dependency on part of a composite key, 3NF = no transitive dependency through a non-key column." Saying `zip → city` makes city transitively dependent shows you reason from FDs, not memorized definitions.
- Show judgment on denormalization: "I normalize to 3NF by default for integrity, then denormalize a specific hot read path only after measuring, and add a way to keep the copies in sync." That balance is what senior interviewers look for.

## keyTakeaways
- Redundancy — the same fact stored in many rows — causes update, insertion, and deletion anomalies; normalization removes redundancy so each fact lives in exactly one place.
- Functional dependencies (X → Y: X determines Y) are the diagnostic tool: 1NF demands atomic cells, 2NF forbids partial dependencies on part of a composite key, 3NF forbids transitive dependencies through a non-key column. Each violation is fixed by splitting the dependency into its own table linked by a foreign key.
- Decomposition is lossless (a join rebuilds the original). Normalize to 3NF by default; denormalize a specific hot read path only after measuring, and only with a plan to keep the duplicated copies in sync.

## code.sql
```sql
-- Spot the violation: zip -> city is a transitive dependency (3NF violation).
-- Fix it by pulling zip -> city into its own table, leaving zip as a foreign key.

-- BEFORE (denormalized, anomaly-prone):
-- orders(order_id PK, customer_name, zip, city)   -- city duplicated per zip

-- AFTER (3NF):
CREATE TABLE zips (
  zip  TEXT PRIMARY KEY,
  city TEXT NOT NULL
);
CREATE TABLE orders (
  order_id      INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  zip           TEXT NOT NULL REFERENCES zips(zip)
);

-- Now a city change is one row, and the FK forbids an order with an unknown zip.
UPDATE zips SET city = 'New York City' WHERE zip = '10001';
```

## code.python
```python
# Detect a redundancy-causing functional dependency, then decompose losslessly.
rows = [
    {"order_id": 1, "cust": "Ada",   "zip": "10001", "city": "New York"},
    {"order_id": 2, "cust": "Ada",   "zip": "10001", "city": "New York"},
    {"order_id": 3, "cust": "Linus", "zip": "90210", "city": "Beverly"},
]

def holds(rows, lhs, rhs):
    """Check whether the functional dependency lhs -> rhs holds in the data."""
    seen = {}
    for r in rows:
        key = r[lhs]
        if key in seen and seen[key] != r[rhs]:
            return False                     # same lhs, different rhs -> not a FD
        seen[key] = r[rhs]
    return True

print(holds(rows, "zip", "city"))            # True: zip -> city, a redundancy source

# Decompose: pull zip -> city into its own table (one row per zip), keep zip as FK.
zips = {r["zip"]: r["city"] for r in rows}                       # {'10001': 'New York', ...}
orders = [{"order_id": r["order_id"], "cust": r["cust"], "zip": r["zip"]} for r in rows]

# Lossless: re-join reconstructs the original wide rows exactly.
rebuilt = [{**o, "city": zips[o["zip"]]} for o in orders]
print(rebuilt == rows)                       # True
```

## code.javascript
```javascript
// Same: verify the FD that signals redundancy, then split it out losslessly.
const rows = [
  { orderId: 1, cust: "Ada", zip: "10001", city: "New York" },
  { orderId: 2, cust: "Ada", zip: "10001", city: "New York" },
  { orderId: 3, cust: "Linus", zip: "90210", city: "Beverly" },
];

function holds(rows, lhs, rhs) {
  const seen = new Map();
  for (const r of rows) {
    if (seen.has(r[lhs]) && seen.get(r[lhs]) !== r[rhs]) return false;
    seen.set(r[lhs], r[rhs]);
  }
  return true;
}
console.log(holds(rows, "zip", "city")); // true: zip -> city is redundant in this table

// Decompose into a zips lookup + slimmed orders; join rebuilds the original.
const zips = new Map(rows.map((r) => [r.zip, r.city]));
const orders = rows.map(({ orderId, cust, zip }) => ({ orderId, cust, zip }));
const rebuilt = orders.map((o) => ({ ...o, city: zips.get(o.zip) }));
console.log(JSON.stringify(rebuilt) === JSON.stringify(rows.map(({ orderId, cust, zip, city }) =>
  ({ orderId, cust, zip, city })))); // true (lossless)
```
