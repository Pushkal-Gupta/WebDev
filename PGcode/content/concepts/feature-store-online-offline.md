---
slug: feature-store-online-offline
module: sd-microservices
title: Feature Store — Online vs Offline
subtitle: The architectural split between low-latency online serving and point-in-time offline training, and the consistency contract between them.
difficulty: Advanced
position: 102
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Feast — open-source feature store"
    url: "https://docs.feast.dev/"
    type: docs
  - title: "Databricks — what is a feature store"
    url: "https://www.databricks.com/glossary/what-is-a-feature-store"
    type: reference
  - title: "Uber Engineering — Michelangelo ML platform"
    url: "https://www.uber.com/blog/michelangelo-machine-learning-platform/"
    type: blog
  - title: "feast-dev/feast — repo"
    url: "https://github.com/feast-dev/feast"
    type: repo
status: published
---

## intro
The defining design choice in any ML platform is the split between an **online** store that returns one entity's latest feature vector in under 10 ms and an **offline** store that returns months of history with point-in-time correctness for training. They serve different SLAs, different read shapes, and different consistency models — but they must agree on every value, or your model trains on one distribution and predicts on another. This concept is about the contract that holds them in sync: a single feature definition, two materialization paths, and the consistency guarantees you commit to at the boundary.

## whyItMatters
Training-serving skew is the most expensive ML production bug because it is silent: offline metrics look great, online metrics drop and nobody can attribute it. Splitting feature storage into separate online and offline layers is what makes the bug detectable. Every serious ML platform — Uber Michelangelo, Airbnb Bighead, Tecton, Feast — formalises this split. The architectural choice you face is not whether to have both stores but how to keep them coherent: write paths, freshness budget, schema evolution, backfill semantics. A team that gets this wrong rebuilds its ML platform every 18 months.

## intuition
Picture two databases owned by one definition. The **definition** is a `FeatureView` with a name, an entity (e.g. `user_id`), a transformation (SQL or Python), and a TTL. The same definition materialises into two physical stores.

**Offline store** is a columnar lake: Parquet on S3, BigQuery, Snowflake. Optimised for "give me the value of feature X for entity Y as of time T, for 10 million rows." It must answer **point-in-time** queries that respect causality — the training row labelled at time T must only see features whose `event_time <= T`. Anything else is leakage and the model overfits to information it will not have at inference. Reads are batch, latency is minutes, the planner uses partition pruning.

**Online store** is a row store keyed by entity ID: Redis, DynamoDB, Bigtable, Cassandra. Optimised for "give me the latest value of features [X1, X2, X3] for entity Y." Latency budget is 5-10 ms p99, throughput is hundreds of thousands of QPS, the read is a multi-get on (entity_id, feature_name). It stores **only the latest value** per entity — history lives in the offline store.

The consistency contract: a feature definition is a function. Run it on offline data, you get the training value. Run it on online data, you get the serving value. They must match, byte for byte, for the same (entity, time). Two materialization paths — daily batch backfill writes the offline store and pushes latest rows to the online store; streaming Flink/Spark Structured Streaming updates both as events arrive. The same SQL or Python code must execute in both pipelines, or you ship skew on day one.

The mental model: one logical feature, two physical stores, one source of truth definition that compiles into both pipelines.

## visualization
```
                       FEATURE DEFINITION
                  user_7d_clicks = SUM(clicks)
                  OVER last 7 days BY user_id, TTL=7d

                          /            \
                         /              \
              BATCH MATERIALIZER    STREAM MATERIALIZER
              (Spark, daily)        (Flink, sub-second)
                  |                       |
        +---------+-------+      +--------+--------+
        |                 |      |                 |
        v                 v      v                 v
  OFFLINE STORE         (merge)              ONLINE STORE
  S3 / BigQuery        latest snapshot       Redis / DynamoDB
  partitioned by ds    pushed nightly        key = user_id
  point-in-time joins  + streaming top-up    one row per entity
        |                                          |
        |  training reads:                         |  inference reads:
        |  "feature value AS OF label.ts"          |  "latest value NOW"
        v                                          v
  Spark batch                                  gRPC <10ms p99
  pandas DataFrame                             model.predict(features)
  for model.fit()
```

## bruteForce
Hand-roll feature pipelines per model. Engineer A writes the `user_7d_clicks` SQL for training; engineer B reimplements the same logic in Python for the inference service. Within a quarter the two definitions diverge — one rounds, one doesn't, one filters bot traffic, one doesn't. Training accuracy stays high, production accuracy collapses, and the diff is invisible until somebody compares offline and online distributions feature by feature. A second naive design: only an offline store, recompute features per request at inference. Latency moves from 10 ms to 10 s and the inference service melts.

## optimal
Split storage with shared definition. The platform owns:

1. **A registry of `FeatureView` definitions.** YAML or Python files in a versioned repo. Each view declares entity, source, transformation, schema, TTL. The registry compiles to both pipelines — never let engineers write Spark and Python implementations by hand.

2. **Offline store: columnar, partitioned, append-only.** Parquet on S3 partitioned by `event_date`. One row per (entity, event_time, feature_value). Point-in-time joins use `feat.event_time <= label.event_time` with a windowed asof join. Storage cost is dominant; compression matters.

3. **Online store: key-value, latest-wins, TTL'd.** Redis or DynamoDB keyed by entity_id, value is a serialised feature dict. Write the latest row from each materialization batch. TTL enforces freshness — a stale value is worse than no value, because the model treats it as current.

4. **Two materialization paths with shared transformation code.** Batch: Spark SQL or dbt runs nightly, writes Parquet + pushes latest to Redis. Stream: Flink runs the same SQL against Kafka, writes to Redis on every event. Reuse the transformation via Spark Structured Streaming or a shared SQL compiler so identical logic executes in both.

5. **Versioned schemas, dual-read during evolution.** Schema changes (new column, type change) ship as `feature_v2`. Backfill the offline store, push to the online store, dual-read during canary, switch the model contract atomically. Never rename in place.

6. **Materialization SLO.** Define and monitor "event time -> online store availability latency." Tecton and Feast publish this as a freshness metric. Below SLO, page; above SLO, ship.

7. **Point-in-time correctness as a unit-tested invariant.** Every feature view has an asof-join test: take a labelled training row at time T, fetch the feature value, assert no source event after T leaked into the result. CI runs this on every PR.

8. **Tooling for parity testing.** Pull a snapshot of online-store reads, replay the same entities through the offline-store point-in-time API, diff. Anything above noise threshold is skew. Run weekly.

## complexity
- Online read: O(1) Redis GET, ~1-2 ms; multi-get with k features: O(k) round-trip latency hidden by pipelining.
- Offline point-in-time join: O(n_labels * log n_features) with sorted partitions; Spark + AQE handles billions in minutes.
- Batch materialization: O(rows / parallelism) — typical 100 GB / hour per Spark executor.
- Stream materialization: O(events / partition_count); end-to-end latency ~1 s Kafka -> Flink -> Redis.
- Storage: offline ~ 2x raw event data after partitioning + compression; online ~ entities * features * 8 bytes, kept in RAM.

## pitfalls
- **Two implementations of the same feature.** Engineers hand-write Spark for training and Python for serving. Skew is guaranteed within a sprint. Single source — SQL or a transformation DSL — compiled to both.
- **Point-in-time join wrong direction.** Using `feat.event_time >= label.event_time` (future leakage) yields unrealistically high training accuracy and catastrophic production performance. Always assert `<=`.
- **Online TTL too long.** A 7-day TTL on a "user_last_click" feature keeps stale values forever for inactive users. The model sees a click that is a week old as if it just happened. Pair TTL with a default-value fallback.
- **Backfilling the offline store but forgetting the online store.** New feature works for training, returns null at inference, model crashes on missing key. Materialization must write both stores atomically (or fail loudly).
- **Schema drift between stores.** Adding a column to the offline transformation without updating the online serialiser silently drops the column at serve time. Use a shared schema registry, fail builds on mismatch.
- **No freshness monitoring.** Streaming pipeline lags 2 hours, nobody notices, model serves yesterday's prices today. Track event-time-to-availability per feature view and alert.

## interviewTips
- Lead with the consistency contract: one definition, two stores, parity SLO. Interviewers grade highly when you name "training-serving skew" as the failure mode this prevents.
- Discuss point-in-time joins concretely — `feat.event_time <= label.event_time` and the row-number windowing to dedupe to the latest pre-label value. Many candidates wave their hands here.
- For senior loops, mention streaming vs batch materialization, online TTL semantics, schema evolution under dual-read, and how Tecton / Feast handle the deployment of new feature views without backfilling everything.

## code.python
```python
# Feast: one FeatureView definition, two stores materialised by the framework.
from feast import Entity, FeatureView, Field, FileSource
from feast.types import Int64, Float32
from datetime import timedelta

user = Entity(name='user_id', join_keys=['user_id'])
clicks_src = FileSource(path='s3://lake/clicks/', timestamp_field='event_time')

user_7d_clicks = FeatureView(
    name='user_7d_clicks', entities=[user], ttl=timedelta(days=7),
    schema=[Field(name='clicks_7d', dtype=Int64)], source=clicks_src,
)

# Training: point-in-time join against offline store
training_df = store.get_historical_features(
    entity_df=labels_df,                         # has user_id, event_time, label
    features=['user_7d_clicks:clicks_7d'],
).to_df()

# Inference: latest value from online store
features = store.get_online_features(
    features=['user_7d_clicks:clicks_7d'],
    entity_rows=[{'user_id': 42}],
).to_dict()
```

## code.javascript
```javascript
// Node inference service hitting Feast's online serving gateway.
async function predict(userId) {
  const res = await fetch(`${FEAST}/get-online-features`, {
    method: 'POST',
    body: JSON.stringify({
      features: ['user_7d_clicks:clicks_7d', 'user_profile:tier'],
      entity_rows: [{ user_id: userId }],
    }),
  });
  const { results } = await res.json();
  const vec = results.map(r => r.values[0]);
  return model.predict(vec);     // 5-10ms feature fetch + model inference
}
```

## code.java
```java
// Streaming materializer in Flink — same transformation as the batch job.
DataStream<ClickEvent> events = env.fromSource(kafkaSource, ...);
events
  .keyBy(e -> e.userId)
  .window(SlidingEventTimeWindows.of(Time.days(7), Time.hours(1)))
  .aggregate(new CountAggregator())
  .map(agg -> new FeatureRow(agg.userId, "user_7d_clicks", agg.count, agg.windowEnd))
  .addSink(new RedisSink(redisCfg, /*ttl=*/ Duration.ofDays(7)));
```

## code.cpp
```cpp
// Online feature serving: multi-get N features for an entity, microsecond budget.
#include <hiredis/hiredis.h>

std::vector<float> fetch_features(int64_t user_id, const std::vector<std::string>& names) {
  redisContext* c = redisConnect("redis", 6379);
  redisReply* r = (redisReply*)redisCommand(c, "HMGET user:%lld %s %s %s",
                                             user_id, names[0].c_str(),
                                             names[1].c_str(), names[2].c_str());
  std::vector<float> out;
  for (size_t i = 0; i < r->elements; ++i) out.push_back(std::atof(r->element[i]->str));
  freeReplyObject(r); redisFree(c);
  return out;
}
```
