---
slug: data-etl-pipelines
module: data-engineering
title: ETL and ELT Data Pipelines
subtitle: Move raw data from source systems into a warehouse reliably, incrementally, and idempotently — without duplicates or silent data loss.
difficulty: Intermediate
position: 1
estimatedReadMinutes: 16
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — batch and stream processing"
    url: "https://dataintensive.net/"
    type: book
  - title: "Apache Airflow — Core Concepts: DAGs"
    url: "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html"
    type: docs
  - title: "dbt — What is dbt? (ELT transformation in the warehouse)"
    url: "https://docs.getdbt.com/docs/introduction"
    type: docs
  - title: "Airbyte — Incremental sync and change data capture"
    url: "https://docs.airbyte.com/using-airbyte/core-concepts/sync-modes/incremental-append"
    type: docs
  - title: "Martin Kleppmann — Turning the database inside-out with Apache Samza"
    url: "https://www.confluent.io/blog/turning-the-database-inside-out-with-apache-samza/"
    type: article
status: published
---

## intro

A data pipeline moves records out of the systems where they are produced — an application database, an event stream, a third-party API, a pile of CSV exports — and lands them somewhere they can be analyzed, usually a data warehouse or lake. Along the way the data is cleaned, reshaped, joined, and aggregated so that a question like "revenue by region last quarter" is a fast query instead of a week of manual spelunking. The two dominant shapes are ETL (extract, transform, load) and ELT (extract, load, transform), and the difference in where the transform happens changes almost everything about how the pipeline scales.

## whyItMatters

Every dashboard, every metric, every machine-learning feature, and every finance report sits downstream of a pipeline. When the pipeline silently drops rows, double-counts a batch after a retry, or reloads the entire history nightly and falls behind, the damage is not a crashed page — it is a wrong number that a human trusts and acts on. Bad data is worse than missing data because nobody notices. Reliable pipelines are what let an organization treat its warehouse as a source of truth rather than a rough approximation. Getting extraction, idempotency, and orchestration right is the difference between analytics people believe and analytics people quietly work around with their own spreadsheets.

## intuition

Picture a factory assembly line. Raw parts arrive at one end (the source), pass through a sequence of stations that each do one job — inspect and discard defects, bolt two parts together, stamp a label — and finished goods roll off the other end into a warehouse. A data pipeline is that line for records. Extract is the loading dock pulling raw parts off the delivery truck. Transform is the row of stations: cleaning (drop nulls, fix types, deduplicate), joining (attach the customer name to the order id), aggregating (roll a million line-items into daily totals). Load is placing the finished goods on warehouse shelves where analysts can find them.

ETL versus ELT is just a question of where the stations sit. In ETL the transform happens on a separate box before the warehouse, so only clean, shaped data ever lands. In ELT you dump the raw parts straight onto the warehouse floor and let the warehouse's own engine do the assembly with SQL — cheaper and more flexible now that warehouses like Snowflake and BigQuery are enormously powerful, because you keep the raw data and can re-transform it any time.

Two ideas make the line trustworthy. Idempotency means running the same batch twice produces the same warehouse state as running it once — like a station that bolts a part only if it is not already bolted. Without it, a retry after a network blip double-counts. Orchestration is the floor manager: a DAG (directed acyclic graph) that says station B cannot start until station A finishes, retries a stuck station, and records which batches are done so tomorrow's run knows where to resume. Get those two right and the line keeps producing correct goods even when trucks arrive late and machines occasionally jam.

## visualization

```
            SOURCE (orders DB / event stream / API)
                          |
                          v
                   [ EXTRACT ]  (high-water-mark: rows since last run)
                          |
                          v
                   [ TRANSFORM ]
                          |
              +-----------+-----------+
              |           |           |
              v           v           v
          clean       join        aggregate
        drop nulls  add customer  daily totals
        fix types     name          per region
              |           |           |
              +-----------+-----------+
                          |
              bad row? ---+---> [ DEAD-LETTER QUEUE ]
              (parse fail)      quarantine + alert
                          |
                          v
                   [ LOAD ]  (idempotent MERGE / upsert)
                          |
                          v
              WAREHOUSE (fact + dimension tables)
```

## bruteForce

The naive approach is a single script on a cron: `SELECT * FROM orders`, mangle the rows in memory, `TRUNCATE` the warehouse table, and `INSERT` everything back. It works on day one and breaks by month three. It is not idempotent — a crash halfway through leaves the table half-loaded, and a rerun either duplicates rows or wipes good data. It reloads the full history every night, so runtime grows with total data forever instead of with new data. It has no retries, no ordering, no record of what ran, and a single malformed row aborts the whole job or is silently swallowed. There is no lineage, so when a number looks wrong nobody can trace which run produced it.

## optimal

A production pipeline is incremental, idempotent, and orchestrated. Incremental extraction uses a high-water mark: store the largest `updated_at` (or an auto-increment id, or a stream offset) from the last successful run, and next time pull only `WHERE updated_at > :watermark`. Runtime now scales with new data, not total data. To handle late-arriving rows, subtract a safety lookback from the watermark and lean on idempotent loads to absorb the overlap.

Idempotent loads are the crux. Instead of blind `INSERT`, use `MERGE` (upsert) keyed on a natural or surrogate key: update the row if it exists, insert if it does not. Now replaying a batch — after a retry, a crash, or a manual backfill — converges to the same state. This is how you get effectively-exactly-once semantics on top of an at-least-once delivery system: the load is naturally deduplicating, so duplicates from retries are harmless.

Orchestration ties it together. A DAG engine (Airflow, Dagster, Prefect) declares task dependencies, retries failed tasks with backoff, checkpoints which partitions succeeded, and supports backfills — rerunning a date range after fixing a bug — precisely because each task is idempotent. Bad records go to a dead-letter queue instead of aborting the run or vanishing: the good 99.9% loads, the poison rows are quarantined for inspection, and an alert fires. ETL versus ELT is a real tradeoff here: ELT (load raw, transform in-warehouse with dbt) keeps raw history and uses cheap warehouse compute; ETL shapes data before landing when you must mask PII early or the target cannot transform at scale. Most modern stacks default to ELT and reach for ETL only when a constraint forces it.

## complexity

- **time:** Incremental extract is proportional to *new/changed rows per run*, not total table size — the whole point of a high-water mark. A full reload is proportional to total history and gets slower forever; avoid it except for occasional backfills.
- **space:** Warehouse storage grows with retained history; staging/raw layers roughly double it. Dead-letter storage is tiny but must be bounded and monitored.
- **notes:** Optimize for throughput (rows/sec) and freshness (source-to-warehouse latency), not big-O. Reprocessing cost is dominated by idempotency: a `MERGE`-based load makes a backfill safe and cheap; a non-idempotent load makes every replay a risky, expensive full rebuild.

## pitfalls

- **Non-idempotent loads causing duplicates.** A retried batch re-inserts rows and every downstream metric double-counts. Fix: load with `MERGE`/upsert keyed on a stable business key so replays converge, never blind `INSERT`.
- **Full reloads that do not scale.** Truncate-and-reload runs longer every night until it misses its window. Fix: incremental extraction with a persisted high-water mark plus a small lookback for late data.
- **No dead-letter path silently dropping bad rows.** One malformed record either aborts the whole run or is swallowed and nobody notices the gap. Fix: route parse/validation failures to a dead-letter queue with alerting; load the healthy rows and inspect the quarantine.
- **Transform logic coupled to source schema.** A renamed upstream column breaks every downstream model at once. Fix: land raw first (ELT), transform in a separate modeling layer, and add schema/contract checks that fail loudly at the boundary.
- **No orchestration or ordering.** Independent cron jobs race — aggregates run before their inputs land. Fix: a DAG with explicit dependencies, retries with backoff, and per-partition checkpoints.
- **Ignoring late-arriving data.** A watermark set to the exact max timestamp skips rows that arrive out of order. Fix: watermark minus a lookback window, combined with idempotent upserts to safely re-process the overlap.

## interviewTips

- Lead with idempotency: explain how a `MERGE` on a business key turns at-least-once delivery into effectively-exactly-once loads, and why that makes retries and backfills safe.
- Be ready to defend ETL vs ELT as a tradeoff, not a religion — ELT for cheap warehouse compute and retained raw history, ETL when you must mask PII early or the target cannot transform at scale.
- Always mention failure handling — high-water-mark incremental extract, dead-letter queues for poison rows, and DAG-level retries/checkpoints — because interviewers probe what happens when a run dies halfway.

## keyTakeaways

- Incremental extraction via a high-water mark makes runtime scale with new data instead of total history; add a lookback window to catch late-arriving rows.
- Idempotent loads (`MERGE`/upsert on a stable key) are what make retries, crashes, and backfills safe — they convert at-least-once into effectively-exactly-once.
- Route bad rows to a dead-letter queue and orchestrate with a DAG; never let one poison record abort the run or disappear unnoticed.

## code.sql

```sql
-- Idempotent incremental load using a high-water mark + MERGE (upsert).
-- Runs safely on retries and backfills: replaying a batch converges to the
-- same target state instead of inserting duplicates.

-- 1) Read the last successful watermark (with a small lookback for late data).
--    :lookback covers rows that arrived out of order after the prior run.
WITH bounds AS (
  SELECT COALESCE(MAX(last_watermark), '1970-01-01'::timestamptz) - INTERVAL ':lookback'
         AS since_ts
  FROM etl_state
  WHERE pipeline = 'orders_daily'
),

-- 2) Extract only rows changed since the watermark (incremental, not full).
staged AS (
  SELECT o.order_id,
         o.customer_id,
         o.region,
         o.amount_cents,
         o.updated_at
  FROM   source_orders o, bounds b
  WHERE  o.updated_at > b.since_ts
)

-- 3) Load idempotently: update on key match, insert otherwise.
MERGE INTO warehouse_orders AS t
USING staged AS s
ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET
  customer_id  = s.customer_id,
  region       = s.region,
  amount_cents = s.amount_cents,
  updated_at   = s.updated_at
WHEN NOT MATCHED THEN INSERT
  (order_id, customer_id, region, amount_cents, updated_at)
  VALUES (s.order_id, s.customer_id, s.region, s.amount_cents, s.updated_at);

-- 4) Advance the watermark only after a successful load (checkpoint).
UPDATE etl_state
SET    last_watermark = (SELECT MAX(updated_at) FROM warehouse_orders)
WHERE  pipeline = 'orders_daily';
```

## code.python

```python
"""Idempotent extract-transform-load task with retry + dead-letter handling.

Shaped like one node of an Airflow-style DAG: it is safe to re-run because the
load upserts on a stable key, and a poison row is quarantined instead of
aborting the whole batch.
"""
from datetime import datetime, timedelta

LOOKBACK = timedelta(minutes=30)  # absorb late-arriving, out-of-order rows


def read_watermark(state, pipeline):
    return state.get(pipeline, datetime(1970, 1, 1))


def extract(source, since):
    # Incremental: pull only rows changed since the watermark (minus lookback).
    return source.query("updated_at > %s", since - LOOKBACK)


def transform(row):
    # Clean + reshape a single record; raise to signal a poison row.
    amount = int(row["amount_cents"])
    if amount < 0:
        raise ValueError(f"negative amount for order {row['order_id']}")
    return {
        "order_id": row["order_id"],
        "customer_id": row["customer_id"],
        "region": (row.get("region") or "unknown").strip().lower(),
        "amount_cents": amount,
        "updated_at": row["updated_at"],
    }


def load_upsert(warehouse, rows):
    # Idempotent: MERGE on order_id, so replays converge (no duplicates).
    warehouse.merge("warehouse_orders", key="order_id", rows=rows)


def run_task(source, warehouse, dead_letter, state, pipeline="orders_daily",
             max_retries=3):
    since = read_watermark(state, pipeline)
    clean, high_water = [], since

    for row in extract(source, since):
        try:
            clean.append(transform(row))
            high_water = max(high_water, row["updated_at"])
        except (ValueError, KeyError, TypeError) as err:
            dead_letter.put({"row": row, "error": str(err)})  # quarantine + alert

    # Retry only the load; transform errors already went to the dead-letter queue.
    for attempt in range(1, max_retries + 1):
        try:
            load_upsert(warehouse, clean)
            break
        except ConnectionError:
            if attempt == max_retries:
                raise  # let the orchestrator mark the task failed for a retry
    else:
        return

    # Checkpoint the watermark only after a successful, idempotent load.
    state[pipeline] = high_water
    return {"loaded": len(clean), "dead_lettered": dead_letter.size()}
```
