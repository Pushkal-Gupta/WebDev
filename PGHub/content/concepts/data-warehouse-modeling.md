---
slug: data-warehouse-modeling
module: data-engineering
title: Data Warehouse Modeling
subtitle: Shape analytical data for fast aggregate queries — OLTP versus OLAP, star schemas of facts and dimensions, columnar storage, and partitioning.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 17
prereqs: [data-etl-pipelines]
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 3: Storage and Retrieval (OLTP vs OLAP, column stores)"
    url: "https://dataintensive.net/"
    type: book
  - title: "Kimball Group — Dimensional modeling techniques (star schema, facts, dimensions)"
    url: "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/"
    type: article
  - title: "Google BigQuery — Partitioned tables"
    url: "https://cloud.google.com/bigquery/docs/partitioned-tables"
    type: docs
  - title: "Apache Parquet — Columnar storage format"
    url: "https://parquet.apache.org/docs/file-format/"
    type: docs
  - title: "The Snowflake Elastic Data Warehouse (SIGMOD 2016)"
    url: "https://dl.acm.org/doi/10.1145/2882903.2903741"
    type: article
status: published
---

## intro

A data warehouse stores data for analysis, and analysis asks different questions than an application does. An app looks up one order by id and updates one row; an analyst sums revenue across ten million orders sliced by region and month. Those workloads want opposite physical layouts, so a warehouse is modeled deliberately: a **star schema** of a big central fact table surrounded by descriptive dimension tables, stored **columnar** so a query touches only the columns it needs, and **partitioned** so it scans only the slice of rows it needs. Get the model right and a billion-row aggregate returns in seconds on a laptop-sized cluster; get it wrong and the same query melts a warehouse that costs by the byte scanned.

## whyItMatters

Every dashboard, every board-deck number, every ML training feature is a query against this model, and the model decides whether that query is cheap and fast or slow and expensive. Cloud warehouses bill by data scanned, so a table that forces a full scan for a one-day report costs real money on every refresh. A schema that copies a customer's name into every one of their million order rows is not just wasteful — when the customer changes their name you must rewrite a million rows or live with inconsistency. The difference between a warehouse people trust and query freely and one they avoid because "it's too slow and I'll get yelled at for the bill" is almost entirely modeling: the right normalization, the right storage format, the right partition key. This is the foundation the whole analytics stack sits on.

## intuition

Start with the two workloads. **OLTP** (online transaction processing) is the application database: many tiny reads and writes, each touching a few rows by primary key, latency measured in milliseconds, correctness guarded by transactions. **OLAP** (online analytical processing) is the warehouse: few but enormous queries that scan and aggregate huge row counts over a handful of columns. Same data, opposite access pattern — so the warehouse is built for the second, not the first.

The **star schema** is how you organize it. Put the measurements in a central **fact table**: one row per business event (a sale, a click, a shipment), holding numeric measures (amount, quantity) plus foreign keys to context. Put the context in **dimension tables**: `dim_customer`, `dim_product`, `dim_date`, `dim_store` — descriptive attributes you slice and filter by. Drawn out, the fact sits in the middle with dimensions radiating outward like a star. A query "revenue by product category last quarter" joins the fact to `dim_product` (for category) and `dim_date` (for quarter) and sums. Dimensions are small and denormalized on purpose; the fact is tall and narrow.

**Columnar storage** is why this flies. A row store keeps each row's fields together, so summing one column drags every other column off disk. A column store keeps each column together, so a query reading 3 of 40 columns reads 3/40ths of the data — and because a column holds one data type with repeated values, it compresses hard (run-length, dictionary encoding). **Partitioning** adds the final cut: physically split the fact table by a key like date, so `WHERE date = '2026-07-01'` skips every partition but one — partition pruning — instead of scanning history. Columns cut *which fields*, partitions cut *which rows*; together they turn a billion-row scan into reading a thin sliver.

## visualization

```
                        +-------------------+
                        |    dim_date       |
                        |  date_key (PK)    |
                        |  day, month, qtr  |
                        +---------+---------+
                                  |
       +-------------+            |            +--------------+
       | dim_product |           (FK)          | dim_customer |
       | product_key +---(FK)--+  |  +--(FK)---+ customer_key |
       | name, cat   |         |  |  |         | name, region |
       +-------------+     +---v--v--v---+     +--------------+
                           |  fact_sales |
                           |  date_key   |  <- foreign keys
                           |  product_key|
                           |  cust_key   |
                           |  store_key  |
                           |  amount     |  <- numeric measures
                           |  quantity   |
                           +------+------+
                                  | (FK)
                           +------v------+
                           |  dim_store  |
                           +-------------+
   columnar: reads only [amount, product_key]   partition by date_key
```

## bruteForce

The naive analytics model is one giant flat table: every order row carries the customer's full name and region, the product's name and category, the store's address — everything denormalized into one wide row store, the same engine and layout the application uses. It answers simple lookups fine, which is why teams reach for it, but it fails analytics on every axis. Storing it as rows means a `SUM(amount)` query reads all 40 columns off disk to touch one, so aggregates are I/O-bound on data they never use. Repeating the customer's name in every order row bloats storage and, worse, makes updates a nightmare — a renamed product means rewriting millions of fact rows. With no partitioning, a one-day report scans all of history because the engine cannot tell which rows are relevant. And running heavy scans on the OLTP database contends with live application traffic, so the analyst's query slows down customer checkouts. It looks fine at a thousand rows and collapses at a billion.

## optimal

Model dimensionally, store columnar, partition by the common filter, and separate OLAP from OLTP. Split the flat table into a narrow **fact table** of foreign keys plus numeric measures and a set of small **dimension tables** holding descriptive attributes. Now a product rename updates one row in `dim_product`, not millions of facts, and the fact table stays dense with the numbers analysts aggregate. This is the Kimball star: deliberately denormalized *within* each dimension (so a query joins few tables, not the dozen a fully normalized snowflake would) but factored *between* fact and dimensions (so context lives once).

Store the fact table in a **columnar** format (Parquet, ORC, or a native column store like BigQuery/Snowflake/Redshift). A query summing `amount` grouped by `dim_product.category` reads only the `amount` and `product_key` columns of the fact plus the tiny product dimension — a fraction of total bytes — and columnar compression (dictionary, run-length) shrinks that further, which matters directly because cloud warehouses bill by bytes scanned. Layer **partitioning** on top: physically bucket the fact by `date_key` (and optionally cluster/sort within a partition by a secondary key) so time-bounded queries prune to the relevant partitions and skip the rest. For slowly changing dimensions — a customer moves regions — use a Type-2 pattern (a new dimension row with validity dates and a surrogate key) so historical facts still join to the region that was true when the event happened, preserving point-in-time correctness. Finally, keep this in a warehouse physically separate from the transactional database, fed by the ETL/ELT pipeline, so analytical scans never contend with live application writes. The result: a model where the expensive queries touch only the columns and rows they need, updates are cheap and consistent, and history is queryable as it actually was.

## complexity

- **time:** A star-schema aggregate is dominated by bytes scanned, not join count — columnar reads only the referenced columns and partition pruning only the referenced partitions, so a well-partitioned query is roughly proportional to (selected columns) × (selected partitions), not total table size. Dimension joins are cheap because dimensions are small and often broadcast.
- **space:** Factoring context into dimensions removes the massive redundancy of the flat table; columnar compression cuts fact storage further (often 3-10x). The cost is some duplication inside denormalized dimensions and extra rows for Type-2 history — a deliberate, bounded trade for query speed and update sanity.
- **notes:** The knobs that matter are the partition key (match it to the dominant filter, usually time) and clustering/sort order within partitions (match it to the secondary filter). Over-partitioning into tiny files hurts (metadata and small-file overhead); under-partitioning forces full scans. Denormalizing dimensions trades storage for fewer joins.

## pitfalls

- **One giant denormalized flat table.** Repeating dimension attributes in every fact row bloats storage and turns any attribute change into a mass row-rewrite. Fix: split into a narrow fact plus small dimensions so context lives once and updates touch one row.
- **Row storage for analytical scans.** A row store reads every column to aggregate one, making scans I/O-bound on unused data. Fix: store facts columnar (Parquet/ORC or a native column store) so a query reads only the columns it references.
- **No partitioning on the fact table.** Every time-bounded report scans all of history. Fix: partition by the dominant filter key (usually date) so the engine prunes to the relevant partitions; cluster within partitions by the secondary filter.
- **Over-partitioning into tiny files.** Partitioning by a high-cardinality key (or by hour when day suffices) creates millions of small files whose metadata overhead swamps the savings. Fix: choose a coarse-enough partition key and compact small files.
- **Mutating dimensions in place, losing history.** Overwriting a customer's region rewrites the past — old facts now join to the new region. Fix: use Type-2 slowly changing dimensions with surrogate keys and validity dates so facts join to the attribute that was true at event time.
- **Running OLAP on the OLTP database.** Heavy analytical scans contend with live application writes and slow both. Fix: land data in a separate warehouse via the ETL/ELT pipeline; keep transactional and analytical workloads on different systems.

## interviewTips

- Open by contrasting OLTP (many tiny keyed reads/writes, row-oriented, transactional) with OLAP (few huge column-aggregating scans, columnar, partitioned) — the physical layout follows directly from the access pattern, and naming that link shows you understand *why* the star schema exists.
- Explain columnar and partitioning as orthogonal cuts: columns reduce *which fields* you read, partitions reduce *which rows*. Interviewers love the follow-up "why is a column store faster for `SUM`" — answer with I/O and compression, not hand-waving.
- Bring up slowly changing dimensions unprompted. Describing Type-2 (new row, surrogate key, validity dates) for point-in-time correctness signals you have modeled real history, not just a textbook diagram.

## keyTakeaways

- OLTP and OLAP are opposite access patterns on the same data; a warehouse is modeled for OLAP — few enormous column-aggregating scans — not for keyed transactional reads.
- The star schema factors data into a narrow central fact table (measures + foreign keys) and small descriptive dimensions, so joins stay few, context lives once, and updates are cheap.
- Columnar storage cuts which columns a query reads (and compresses hard) while partitioning cuts which rows it scans; together they make billion-row aggregates cheap, which matters because warehouses bill by bytes scanned.

## code.sql

```sql
-- Star-schema DDL + a typical analytical query.
-- The fact table is narrow (keys + measures) and partitioned by date so
-- time-bounded reports prune to the relevant days; dimensions are small and
-- descriptive. Compare this to selecting from one giant flat orders table.

-- Descriptive dimensions: context lives ONCE, not in every fact row.
CREATE TABLE dim_product (
  product_key  INT PRIMARY KEY,
  name         TEXT,
  category     TEXT,
  brand        TEXT
);

CREATE TABLE dim_customer (
  customer_key INT PRIMARY KEY,   -- surrogate key
  name         TEXT,
  region       TEXT,
  valid_from   DATE,              -- Type-2 SCD: history preserved
  valid_to     DATE,
  is_current   BOOLEAN
);

-- Narrow fact table: foreign keys + numeric measures, partitioned by date.
CREATE TABLE fact_sales (
  date_key     DATE,
  product_key  INT REFERENCES dim_product(product_key),
  customer_key INT REFERENCES dim_customer(customer_key),
  store_key    INT,
  amount       DECIMAL(10, 2),
  quantity     INT
) PARTITION BY RANGE (date_key);   -- partition pruning on WHERE date_key ...

-- Revenue by product category for Q2 2026: a columnar engine reads only
-- amount + product_key from the fact and prunes to the Q2 partitions.
SELECT p.category,
       SUM(f.amount)   AS revenue,
       SUM(f.quantity) AS units
FROM   fact_sales f
JOIN   dim_product p ON p.product_key = f.product_key
WHERE  f.date_key BETWEEN '2026-04-01' AND '2026-06-30'
GROUP  BY p.category
ORDER  BY revenue DESC;
```

## code.python

```python
"""Why columnar + partition pruning beats a flat row scan, made concrete.

Models a fact table two ways and counts the "cells" each aggregate must read.
A row store reads every column of every scanned row; a column store reads only
the referenced columns; partitioning prunes rows before either. The cell counts
mirror why cloud warehouses (billed by bytes scanned) reward this layout.
"""

COLUMNS = ["date_key", "product_key", "customer_key",
           "store_key", "amount", "quantity"]  # 6 columns per fact row


def cells_row_store(num_rows, partitions_scanned, total_partitions):
    # Row store: to aggregate ANY column you drag ALL columns off disk,
    # and without pruning you scan every partition.
    rows = num_rows * (partitions_scanned / total_partitions)
    return int(rows) * len(COLUMNS)


def cells_column_store(num_rows, referenced_cols, partitions_scanned,
                       total_partitions):
    # Column store: read only the referenced columns, only in pruned partitions.
    rows = num_rows * (partitions_scanned / total_partitions)
    return int(rows) * len(referenced_cols)


def compare(num_rows=1_000_000_000, total_partitions=365):
    # Query: SUM(amount) GROUP BY product_key for a single day.
    referenced = {"amount", "product_key"}   # 2 of 6 columns
    partitions_scanned = 1                    # one day out of a year

    flat = cells_row_store(num_rows, total_partitions, total_partitions)
    star = cells_column_store(num_rows, referenced,
                              partitions_scanned, total_partitions)
    return {
        "flat_row_full_scan_cells": flat,
        "columnar_pruned_cells": star,
        "reduction_x": round(flat / star, 1),
    }


if __name__ == "__main__":
    print(compare())  # ~1095x fewer cells read: (6/2 columns) x (365/1 partitions)
```
