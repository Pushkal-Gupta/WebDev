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
Pick the wrong tier and you either pay a fortune (warehousing terabytes of clickstream JSON nobody queries) or you bleed performance (running BI dashboards directly over S3 JSON with 30-second p95). Lake for raw + cheap + ML; warehouse for fast + curated; lakehouse for both.

## intuition
**Lake** = S3/GCS/ADLS + Parquet/JSON/CSV/Avro. No engine, no enforcement. Anyone can dump anything. Read with Spark, Trino, Athena.
- Pros: cheap ($23/TB/mo on S3), all formats, infinite scale, source of truth.
- Cons: no schema enforcement, no transactions, easy to make a "data swamp".

**Warehouse** = Snowflake, BigQuery, Redshift, ClickHouse. Columnar storage, query optimizer, schema enforced.
- Pros: 100ms BI queries, ACID, RBAC, mature tooling.
- Cons: $$$$ at scale, ingest pipelines must clean + model first, vendor lock-in.

**Lakehouse** = open table format (Delta, Iceberg, Hudi) on object storage + a query engine (Databricks, Trino, BigQuery external).
- Adds ACID transactions, time travel, schema evolution, MERGE/UPSERT to a lake.
- One copy of data serves SQL BI + Spark ML + streaming.

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
**Medallion architecture** (bronze/silver/gold) on a lakehouse:
- **Bronze**: raw immutable append (`s3://bucket/raw/source/dt=.../...`). Cheap. Replayable.
- **Silver**: cleaned, deduped, schema-enforced via Iceberg/Delta. ACID merges from CDC.
- **Gold**: business-level aggregates, joined dims, served to BI (or materialized to a warehouse for low-latency).

**When pure warehouse still wins**: <10TB structured data, mostly BI, small team that doesn't want to operate Spark. Just buy Snowflake.

**When pure lake still wins**: archive/compliance store, ML feature store with custom binary formats, ad-hoc analytics with no SLA.

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
