---
slug: data-lake-warehouse
module: sd-storage
title: Data Lake vs Warehouse vs Lakehouse
subtitle: Raw schema-on-read storage vs modeled schema-on-write — and the hybrid that wins.
difficulty: Intermediate
position: 63
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Kleppmann"
    url: "https://dataintensive.net"
    type: book
  - title: "Martin Fowler — Data Lake"
    url: "https://martinfowler.com/bliki/DataLake.html"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
A **data lake** is cheap object storage of raw, multi-format data — you decide schema when you read it. A **warehouse** is structured, modeled, columnar storage tuned for BI — schema enforced on write. A **lakehouse** (Delta, Iceberg, Hudi) puts ACID + schema on top of lake files, getting both. Most modern stacks land here.

## whyItMatters
Pick the wrong tier and you either pay a fortune (warehousing terabytes of clickstream JSON nobody queries) or you bleed performance (running BI dashboards directly over S3 JSON with 30-second p95 latency). Lake for raw plus cheap plus ML; warehouse for fast plus curated; lakehouse for both. Every modern data team at Netflix, Uber, Airbnb, LinkedIn, and Pinterest runs some flavor of this stack; the canonical references are the Netflix Iceberg paper (Yin et al. 2017), Databricks's Delta Lake paper (Armbrust et al. 2020), and Uber's Hudi blog series. Snowflake, BigQuery, Redshift, and Databricks SQL Warehouse all support reading open table formats from S3 directly, so the lake-warehouse boundary has blurred into the lakehouse architecture most large companies now use.

## intuition
**Lake** = S3 / GCS / ADLS plus Parquet / JSON / CSV / Avro files. No engine, no enforcement. Anyone can dump anything. Query with Spark, Trino (formerly PrestoSQL), Athena, or DuckDB. Pros: cheap (around 2-3 cents per GiB per month on S3 Standard), every format supported, infinite horizontal scale, the canonical source of truth. Cons: no schema enforcement, no transactions, easy to make a data swamp where nobody knows what is where.

**Warehouse** = Snowflake, BigQuery, Redshift, ClickHouse, Databricks SQL. Columnar storage, query optimizer, schema enforced, ACID transactions, role-based access control, mature BI tooling. Pros: 100 ms BI queries, ACID, RBAC, deep ecosystem (Looker, Tableau, dbt). Cons: expensive at scale (dollars per TB scanned for serverless, fixed warehouse costs otherwise), ingest pipelines must clean and model first, some vendor lock-in.

**Lakehouse** = open table format (Delta, Iceberg, Hudi) on object storage plus a query engine (Databricks, Trino, BigQuery External Tables, Snowflake's Iceberg integration). Adds ACID transactions, time travel, schema evolution, and MERGE/UPSERT to a lake. One copy of data serves SQL BI plus Spark ML plus streaming. The Iceberg table-format spec gives you snapshot isolation across engines, so Trino can read tables that Spark is writing without seeing partial state.

## visualization
```
LAKE                       WAREHOUSE                  LAKEHOUSE
+-------------+           +------------+              +----------------+
| S3 / Parquet|           | Snowflake  |              | S3 + Iceberg   |
| JSON / Avro |           | columnar   |              | manifests+log  |
|  no schema  |           | strict DDL |              | ACID + schema  |
+------+------+           +-----+------+              +--------+-------+
       |                        ^                              |
   schema-on-read            ETL/ELT                      schema-on-write
       |                        |                              |
   Spark / Trino            BI / dbt                    Spark + Trino + BI
```

Typical pipeline:
```
sources --> bronze (lake, raw)
        --> silver (lake, cleaned)
        --> gold   (warehouse OR lakehouse table for BI)
```

## bruteForce
**Warehouse-only**: every event landed in Snowflake costs storage + compute on ingest. Petabyte JSON archives bankrupt small companies.

**Lake-only**: BI tool queries Parquet on S3 -> 20s dashboards, frustrated execs, no governance, "data swamp" within a year.

## optimal
Medallion architecture (bronze / silver / gold) on a lakehouse. Each layer is a directory in object storage backed by an open table format (Iceberg or Delta), with progressively cleaner schemas and stronger guarantees as data flows downstream.

```
s3://lake/bronze/clickstream/dt=2026-05-25/...  # raw append, immutable
s3://lake/silver/clickstream/                  # cleaned, deduped, Iceberg/Delta
s3://lake/gold/daily_active_users/             # aggregates served to BI
```

```sql
-- Silver: CDC merge from a Kafka source into an Iceberg table
MERGE INTO silver.orders t USING bronze.orders_cdc s
  ON t.order_id = s.order_id
WHEN MATCHED AND s.op = 'd' THEN DELETE
WHEN MATCHED AND s.op = 'u' THEN UPDATE SET *
WHEN NOT MATCHED AND s.op = 'c' THEN INSERT *;

-- Gold: nightly aggregate served to dashboards in seconds
CREATE OR REPLACE TABLE gold.dau AS
SELECT date(event_ts) AS day, COUNT(DISTINCT user_id) AS dau
FROM silver.events
GROUP BY 1;
```

The critical pattern is the open table format (Delta or Iceberg) between bronze and silver — it gives you ACID merges, schema evolution, and snapshot isolation, none of which raw Parquet on S3 provides. Schedule small-file compaction nightly (`OPTIMIZE` for Delta, `rewrite_data_files` for Iceberg) so query engines do not spend their time opening tens of thousands of tiny files. When pure warehouse still wins: under 10 TiB of structured data, mostly BI, small team that does not want to operate Spark or Trino — just buy Snowflake or BigQuery and stop. When pure lake still wins: archive / compliance store, ML feature store with custom binary formats, ad-hoc analytics with no SLA. For everything in between, the lakehouse is the production default in 2026.

## complexity
- **Lake scan**: O(files touched). Without partition pruning, full-table scan.
- **Warehouse query**: columnar + clustering + materialized views -> sub-second on TB.
- **Lakehouse**: warehouse-class perf when manifest + Z-ordering tuned; otherwise lake-like.

## pitfalls
- **No catalog** -> nobody knows what's in the lake. Use Glue/Unity/Hive Metastore.
- **Tiny files problem**: streaming dumps 1KB files; queries spend 90% on file listing. Compact hourly.
- **No partitioning strategy** (or over-partitioning by user_id with 10M values).
- **Schema drift on bronze**: producer adds a field, downstream silver job crashes silently.
- **Treating lakehouse as drop-in warehouse**: cold queries are still slower than Snowflake cache.
- **PII in raw**: GDPR delete-by-user becomes impossible without a deletes table or row-level upsert (Iceberg/Delta).

## interviewTips
- Name the architecture as **bronze/silver/gold** or **medallion** — interviewers recognize it.
- When asked "lake or warehouse?" — answer "lakehouse + a warehouse for the gold layer" for the senior signal.
- Mention **Iceberg/Delta/Hudi** by name and the killer feature each adds (time travel, MERGE, schema evolution).
- For ML workloads, mention **feature stores** built on the silver tier.

## code.python
```python
def pick_tier(query):
    if query.get('latency_ms_p95', 5000) < 500 and query.get('sql_bi'):
        return 'warehouse_or_gold_table'
    if query.get('ad_hoc_ml') or query.get('raw_payload_needed'):
        return 'lake_bronze'
    return 'lakehouse_silver'
```

## code.javascript
```javascript
function pickTier(q) {
  if ((q.latencyMsP95 ?? 5000) < 500 && q.sqlBi) return 'warehouse';
  if (q.adHocMl || q.rawPayloadNeeded) return 'lake_bronze';
  return 'lakehouse_silver';
}
```

## code.java
```java
static String pickTier(Map<String, Object> q) {
    int p95 = ((Number) q.getOrDefault("latencyMsP95", 5000)).intValue();
    if (p95 < 500 && Boolean.TRUE.equals(q.get("sqlBi"))) return "warehouse";
    if (Boolean.TRUE.equals(q.get("adHocMl"))) return "lake_bronze";
    return "lakehouse_silver";
}
```

## code.cpp
```cpp
// std::string pickTier(const Query& q) {
//     if (q.latencyP95Ms < 500 && q.sqlBi) return "warehouse";
//     if (q.adHocMl || q.rawPayloadNeeded) return "lake_bronze";
//     return "lakehouse_silver";
// }
```
