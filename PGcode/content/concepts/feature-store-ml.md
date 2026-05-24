---
slug: feature-store-ml
module: system-design
title: ML Feature Store
subtitle: Online + offline store for ML features — same SQL definition serves training (batch) AND inference (real-time) without skew.
difficulty: Advanced
position: 47
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Machine Learning Systems (Chip Huyen)"
    url: "https://huyenchip.com/ml-interviews-book/"
    type: book
  - title: "Uber Engineering — Michelangelo feature store"
    url: "https://www.uber.com/blog/michelangelo-machine-learning-platform/"
    type: blog
  - title: "feast-dev/feast — open-source feature store"
    url: "https://github.com/feast-dev/feast"
    type: repo
status: published
---

## intro
ML models need **features** — derived values like "user's 7-day click rate" or "merchant's avg transaction value." A **feature store** is a system that computes, stores, and serves features consistently across two settings:
- **Training (offline)**: read months of historical features as a snapshot for batch training. Use cases: hours-long batch jobs reading from warehouse/lake.
- **Inference (online)**: read the latest feature value for one entity in <10ms. Use cases: real-time scoring during a checkout / fraud check.

The single biggest ML production failure mode is **training-serving skew** — features computed differently in batch vs realtime. Feature store eliminates that by being the single source of definition.

## whyItMatters
Modern ML platforms (Uber Michelangelo, Airbnb Bighead, Tecton, Feast) all center on feature stores because:
- **Reuse**: same "user_total_purchases" feature feeds 30 models.
- **Point-in-time correctness**: training data must reflect what the model would have seen at prediction time (no future leakage).
- **Latency**: <10ms p99 to serve features at inference.
- **Auditability**: which features fed which prediction.

## intuition
Two stores, one definition:
1. **Offline store** (BigQuery / Snowflake / S3 + Parquet): historical features for training. Computed by a daily batch job.
2. **Online store** (Redis / DynamoDB / Bigtable): latest feature per entity, indexed by entity_id. Updated continuously by a streaming pipeline (Kafka + Flink) OR by the same batch job's "last row" being pushed to Redis.

A `FeatureView` definition includes: source SQL/Python, entities (e.g., user_id), schema, TTL. The framework materializes it into BOTH stores.

Point-in-time correctness: training queries use `JOIN ... ON ... AND feature.event_time <= label.event_time` to avoid future leakage.

## visualization
```
            ┌─────────────────────────────────────┐
            │     FEATURE DEFINITION              │
            │  user_7day_clicks = SUM(clicks      │
            │     OVER last 7 days BY user_id)    │
            └────────┬────────────────┬──────────┘
                     │                │
        ┌────────────▼────┐  ┌────────▼─────────┐
        │ Batch (Spark)   │  │ Stream (Flink)   │
        │ daily backfill  │  │ near-real-time   │
        └────────┬────────┘  └────────┬─────────┘
                 │                    │
        ┌────────▼────────┐  ┌────────▼─────────┐
        │ OFFLINE STORE   │  │ ONLINE STORE     │
        │ (warehouse)     │  │ (Redis / Dynamo) │
        │ point-in-time   │  │ latest by user_id│
        └────────┬────────┘  └────────┬─────────┘
                 │                    │
                 ▼                    ▼
        Training (Spark)        Inference API
        "what was this           "what's user 42's
         feature at T?"           feature NOW?"
                 │                    │
                 ▼                    ▼
        Model.train()           Model.predict()
```

## bruteForce
**Recompute features per request**: inference latency blows up (10s of seconds).

**Hand-roll feature pipelines per model**: same feature implemented 5 ways across 5 models → drift, bugs, skew.

**Use raw data**: model trained on raw clicks doesn't generalize; needs aggregations done consistently.

## optimal
**Architecture**:
1. **Registry**: YAML/Python feature definitions in a central repo.
2. **Offline materialization**: nightly Spark/dbt job reads source data, writes Parquet partitioned by date to S3.
3. **Online materialization**: 
   - Either: streaming pipeline (Kafka → Flink → Redis) updates online store in real time.
   - Or: incremental batch writes the offline store's latest row to Redis.
4. **Serving API**:
   - `get_online_features(['user_7day_clicks'], entity={'user_id': 42})` → Redis lookup, <10ms.
   - `get_historical_features(features, training_df_with_timestamps)` → SQL join with point-in-time semantics.

**Point-in-time join**:
```sql
SELECT
    label.user_id,
    label.event_time,
    label.is_fraud,
    feat.user_7day_clicks
FROM training_labels label
LEFT JOIN feature_user_clicks feat
    ON label.user_id = feat.user_id
    AND feat.event_time <= label.event_time          -- no future leakage!
    AND feat.event_time > label.event_time - INTERVAL '7 days'
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY label.user_id, label.event_time
    ORDER BY feat.event_time DESC
) = 1
```

**Tools**:
- **Feast** (open source): self-host on Postgres + Redis.
- **Tecton**: managed feature store with streaming.
- **Hopsworks**: on-prem option.
- **AWS SageMaker Feature Store**: managed.

## complexity
- **Online lookup**: O(1) Redis get; <10ms p99.
- **Offline backfill**: hours for petabyte-scale.
- **Streaming materialization**: ~1s latency from event to online store.
- **Storage**: 2x (online + offline).

## pitfalls
- **Training-serving skew**: feature computed in Spark for training but in Python for inference — small differences explode model performance. Same code path for both, OR thorough equality tests.
- **Point-in-time joins done wrong**: leak future info → unrealistically high training accuracy → terrible production performance.
- **Redis hot keys**: 1% of features hit 50% of traffic. Use local cache + Redis as L2.
- **Backfill cost**: changing a feature definition means recomputing months of history. Use materialized views + only re-compute deltas.
- **Feature staleness**: streaming features lag by N seconds. For low-latency fraud, this is OK; for personalization, it's invisible.

## interviewTips
- For "design ML serving platform" → feature store separates concerns.
- Mention **training-serving skew** as the #1 failure mode it prevents.
- For senior interviews, discuss **point-in-time correctness**, **online vs offline freshness**, **multi-tenant cost attribution**.

## code.python
```python
# Feast usage
from feast import FeatureStore
fs = FeatureStore(repo_path='feature_repo/')
features = fs.get_online_features(
    features=['user_features:user_7day_clicks', 'user_features:user_total_spent'],
    entity_rows=[{'user_id': 42}],
).to_dict()
# Inference: pass features to model.predict
```

## code.javascript
```javascript
// Node clients are less common; usually inference services are Python.
// For Node-side feature lookup, hit the Feast REST gateway:
const features = await fetch('http://feast-server/get-online-features', {
  method: 'POST',
  body: JSON.stringify({ features: ['user_features:user_7day_clicks'], entity_rows: [{ user_id: 42 }] }),
}).then(r => r.json());
```

## code.java
```java
// Feast Java client
import dev.feast.FeastClient;
FeastClient client = FeastClient.create("feast-server:6566");
Map<String, Object> features = client.getOnlineFeatures(
    Arrays.asList("user_features:user_7day_clicks"),
    Collections.singletonList(Map.of("user_id", 42L))
);
```

## code.cpp
```cpp
// Most C++ ML inference (TensorRT, ONNX Runtime) reads features from Redis directly.
// hiredis HSET get for online lookup; protobuf gRPC for Feast server calls.
```
