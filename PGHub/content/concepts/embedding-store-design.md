---
slug: embedding-store-design
module: sd-microservices
title: Embedding Store Design
subtitle: Write-path encoder pipelines, read-path kNN serving, and the staleness/refresh policy that keeps vectors trustworthy.
difficulty: Advanced
position: 101
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Pinecone — understanding indexes"
    url: "https://docs.pinecone.io/guides/indexes/understanding-indexes"
    type: docs
  - title: "Milvus — architecture overview"
    url: "https://milvus.io/docs/overview.md"
    type: docs
  - title: "Pinecone — HNSW deep dive"
    url: "https://www.pinecone.io/learn/series/faiss/hnsw/"
    type: blog
  - title: "Faiss wiki — index types"
    url: "https://github.com/facebookresearch/faiss/wiki/Faiss-indexes"
    type: docs
status: published
---

## intro
An embedding store is the service that owns the lifecycle of every vector your models consume — write-path ingestion through an encoder, durable persistence next to the source row, ANN-indexed serving on the read path, and the refresh logic that keeps vectors current as upstream text mutates. It sits between your application database and your vector index. Get it wrong and you ship results from a stale encoder, or worse, two encoder versions blended together at query time. Get it right and a document update propagates to retrieval in seconds without rebuilding the index.

## whyItMatters
A naive "embed once at write time" pipeline silently rots: encoder updates, schema changes, and document edits all introduce skew between the live source of truth and the served vectors. RAG hallucinations, recsys cold-start regressions, and dedup misses trace back to embedding-store hygiene more often than to model quality. Production embedding stores at Spotify, Pinterest, and OpenAI publish detailed write-then-index-then-serve pipelines with explicit freshness SLOs because the failure modes are silent until a metric drops. Designing this layer correctly is the difference between a model that works in eval and a model that works in prod.

## intuition
Think of the store as three independent paths over the same identity. The **identity** is the entity ID (doc, user, image). Around it live: the raw source row in a relational DB, the embedding vector in a vector index, and the encoder version that produced it. Each of these can move at a different cadence.

**Write path.** Source row changes -> CDC or outbox event fires -> encoder service consumes the event, fetches the latest text, computes the embedding, writes it to both the durable embedding table (e.g. Postgres with pgvector or S3 + Parquet) and the live ANN index. Crucially, the embedding row carries `(entity_id, encoder_version, vector, ts)` — never just `(entity_id, vector)`. Without `encoder_version`, you cannot detect skew or run a safe encoder rollout.

**Read path.** Query enters as text or as an upstream vector. If text, the same encoder service produces the query vector (use the same version that the active index serves — otherwise distances are uncalibrated). The ANN index returns top-k candidate IDs with distances. A hydration step joins back to the source DB to return rich payloads (title, snippet, metadata) — the vector index should not be your blob store.

**Refresh policy.** Three triggers fire re-embedding: source row mutates (CDC), encoder version bumps (full rebuild under dual-read), or freshness TTL expires (e.g. trend-sensitive recsys embeddings refreshed nightly). A scheduler reconciles backlog: it scans rows where `row.updated_at > embedding.updated_at` or `embedding.encoder_version < active.encoder_version` and re-queues them. Without this scanner, transient pipeline failures leak stale vectors forever.

The mental model: the embedding is a materialized view of "encoder(latest_text)". Like any materialized view, it needs an invalidation signal and a reconciler.

## visualization
```
   SOURCE OF TRUTH                 EMBEDDING STORE                 VECTOR INDEX (ANN)
   (Postgres / Mongo)              (durable + versioned)           (HNSW / IVF-PQ)

   docs(id, body, ts) --CDC--> encoder_v3(body) --upsert--> (id,v,enc=v3)
        |  outbox event              |                                |
        v                            v                                v
   updated_at bumps         (id, enc, vec, ts)              ANN graph + tombstones
        |                            |                                |
        |  reconciler scan           |                                |
        |  row.ts > emb.ts ----------+                                |
        |                                                             |
        |  encoder bump (v3 -> v4)                                    |
        |   dual-write to two indexes during cutover                  |
        |                                                             |
                          QUERY PATH
                          q_text --encoder_v3--> q_vec --ANN--> top-k ids
                                                                 |
                                                                 v
                                                       hydrate from source DB
                                                       (title, snippet, meta)
```

## bruteForce
"Embed at write, never refresh, store the vector in the same row as the source." It works for a static corpus and breaks the moment the encoder is upgraded or a document is edited. A second naive design: re-embed every row nightly via a batch job — wastes compute (most rows did not change), still leaves intraday queries serving yesterday's vectors, and produces nothing safe to roll back to if the new encoder is worse.

## optimal
A correct embedding store layers the following:

1. **Tuple is `(entity_id, encoder_version, vector, source_hash, updated_at)`.** Persist this in a durable store (Postgres + pgvector for small scale; S3 + Parquet partitioned by encoder_version for billion-row scale). The vector index is a derived cache, not the system of record.

2. **CDC or outbox triggers, not polling.** Hook into Postgres logical replication or the application's outbox table. Encoder workers consume from Kafka with consumer-group parallelism. Idempotent upsert on `(entity_id, encoder_version)`.

3. **Encoder service is a stable contract.** It accepts `(text, encoder_version)` and is versioned independently of the index. Multiple encoder versions run in parallel during a rollout; the router picks the active version per collection.

4. **Source-hash for short-circuit.** Hash the input text. If the new hash matches the persisted hash for the active encoder version, skip the encode. Saves 90% of CPU during minor edits.

5. **Dual-write during encoder cutover.** Stand up index v4 alongside v3, backfill v4 in the background, dual-write all new mutations. Switch the read path atomically per query workload (canary by tenant or query type). Tear down v3 only after parity checks pass.

6. **Reconciler / janitor.** A scheduled job scans for rows where `row.updated_at > embedding.updated_at OR embedding.encoder_version != active`. Re-queues into the encoder pipeline. Without this, a single failed Kafka delivery leaves a vector stale forever.

7. **TTL on the index, not the store.** ANN tombstones accumulate. Rebuild the index periodically from the source store. Cheaper than vacuuming a graph index in place.

8. **Query path uses the same encoder.** Run the encoder behind a thin RPC, with `?version=active` as the default. Skew between query-time and index-time encoders is the #1 silent-recall bug.

## complexity
- Encoder cost per vector: O(d * model_FLOPs). For a 768-dim sentence model, ~50 ms / item on CPU, ~3 ms on GPU.
- Write-path throughput: encoder workers * batch_size * GPU_throughput. Typical 5-50k vectors/sec per GPU.
- Index upsert: O(M * efConstruction) per HNSW insert; O(d) per IVF assignment.
- Read-path: O(encode + ANN search + hydrate). Hydrate is often the dominant term (50 ms RPC vs 2 ms ANN) — co-locate or cache.
- Storage: raw vectors d * 4 bytes; with PQ codes m bytes (m ~ 16-32). Postgres + pgvector adds ~24 bytes overhead per row.

## pitfalls
- **Storing only the vector, not the encoder version.** When you upgrade the encoder, you cannot tell which vectors are stale and which are current. Versioned tuples are non-negotiable.
- **Encoding at query time with a different version than at write time.** Distances become uncalibrated — top-k results look plausible but recall drops 20%. Pin the encoder version in the router and tag every index with it.
- **Vector index as system of record.** When the index file corrupts or the managed service has an incident, you need a re-derivable source. Always persist vectors in object storage too.
- **No idempotency on the upsert path.** Kafka redelivery duplicates vectors with different IDs; ANN recall degrades and the index grows unbounded. Upsert by `(entity_id, encoder_version)`.
- **Refresh fan-out storms.** An encoder version bump re-embeds the entire corpus. Throttle the reconciler and prioritise hot entities (queried in last 24 h) first.
- **Ignoring source-row deletes.** When the source DB deletes a doc, the embedding must be tombstoned in the index too — otherwise queries surface phantoms. Wire deletes into the same CDC pipeline.

## interviewTips
- Frame the design around three independently-moving pieces: source row, encoder version, vector. Every consistency problem maps to a misalignment between two of them.
- Quantify freshness as an SLO: "P99 from source mutation to vector index update under 30 s." Vague answers like "near-real-time" get downgraded.
- Mention encoder rollout explicitly: dual-write, parity check, atomic flip. Interviewers grade highly on the ability to upgrade a model in production without downtime.

## code.python
```python
# Embedding write-path worker. Consumes CDC events, re-embeds, upserts vector + meta.
from kafka import KafkaConsumer
import psycopg, hashlib, requests

consumer = KafkaConsumer('docs.cdc', group_id='embed-worker')
ENCODER_VERSION = 'sbert-mpnet-v3'

with psycopg.connect(DSN) as db:
    for msg in consumer:
        doc = msg.value           # {'id': ..., 'body': ..., 'op': 'upsert'|'delete'}
        if doc['op'] == 'delete':
            db.execute("DELETE FROM embeddings WHERE entity_id=%s", (doc['id'],))
            ann.delete(doc['id']); continue

        src_hash = hashlib.sha256(doc['body'].encode()).hexdigest()
        row = db.execute(
          "SELECT source_hash FROM embeddings WHERE entity_id=%s AND encoder_version=%s",
          (doc['id'], ENCODER_VERSION)).fetchone()
        if row and row[0] == src_hash:
            continue   # short-circuit: text unchanged for active encoder

        vec = requests.post(ENCODER_URL, json={'text': doc['body']}).json()['vector']
        db.execute("""INSERT INTO embeddings(entity_id, encoder_version, vector, source_hash, updated_at)
                      VALUES (%s,%s,%s,%s, now())
                      ON CONFLICT (entity_id, encoder_version)
                      DO UPDATE SET vector=EXCLUDED.vector, source_hash=EXCLUDED.source_hash, updated_at=now()""",
                   (doc['id'], ENCODER_VERSION, vec, src_hash))
        ann.upsert(doc['id'], vec)
```

## code.javascript
```javascript
// Read-path: encode query, search ANN, hydrate from source DB.
async function search(queryText, { tenant, k = 10 }) {
  const { vector } = await fetch(`${ENCODER}/encode?version=${ACTIVE_ENC}`, {
    method: 'POST', body: JSON.stringify({ text: queryText }),
  }).then(r => r.json());

  const hits = await vectorIndex.query({
    vector, topK: k * 3,           // overfetch for filter dropoff
    filter: { tenant: { $eq: tenant } },
  });

  const ids = hits.matches.map(m => m.id);
  const rows = await pg.query('SELECT id,title,snippet FROM docs WHERE id = ANY($1)', [ids]);
  const byId = new Map(rows.rows.map(r => [r.id, r]));
  return hits.matches.slice(0, k).map(m => ({ ...byId.get(m.id), score: m.score }));
}
```

## code.java
```java
// Reconciler scan: re-queue stale rows. Run as a scheduled job every minute.
String activeEnc = "sbert-mpnet-v3";
String sql = """
    SELECT d.id
    FROM docs d
    LEFT JOIN embeddings e
      ON e.entity_id = d.id AND e.encoder_version = ?
    WHERE e.entity_id IS NULL
       OR d.updated_at > e.updated_at
    LIMIT 1000
    """;
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.setString(1, activeEnc);
    ResultSet rs = ps.executeQuery();
    while (rs.next()) {
        kafka.send("docs.cdc", new CdcEvent(rs.getLong("id"), "upsert"));
    }
}
```

## code.cpp
```cpp
// Faiss + RocksDB durable store: vector index is a cache, RocksDB is the source.
#include <faiss/IndexHNSWFlat.h>
#include <rocksdb/db.h>

faiss::IndexHNSWFlat index(/*d=*/768, /*M=*/32);
rocksdb::DB* store;
rocksdb::DB::Open(opts, "/var/lib/embeddings", &store);

void upsert(int64_t id, const std::string& enc_ver, const float* vec) {
  std::string key = std::to_string(id) + "/" + enc_ver;
  store->Put({}, key, std::string((const char*)vec, 768 * sizeof(float)));
  index.add_with_ids(1, vec, &id);   // refresh ANN cache
}
```
