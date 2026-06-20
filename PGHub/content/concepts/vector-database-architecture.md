---
slug: vector-database-architecture
module: sd-microservices
title: Vector Database Architecture
subtitle: HNSW vs IVF index choice, recall/latency tradeoffs, and sharding strategies behind Milvus, Pinecone, and Weaviate.
difficulty: Advanced
position: 100
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "Malkov & Yashunin — Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs"
    url: "https://arxiv.org/abs/1603.09320"
    type: paper
  - title: "Faiss wiki — index types (IVF, HNSW, PQ)"
    url: "https://github.com/facebookresearch/faiss/wiki/Faiss-indexes"
    type: docs
  - title: "Milvus — architecture overview"
    url: "https://milvus.io/docs/overview.md"
    type: docs
  - title: "Pinecone — vector index tradeoffs"
    url: "https://www.pinecone.io/learn/series/faiss/vector-indexes/"
    type: blog
  - title: "Hierarchical Navigable Small World — Wikipedia"
    url: "https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world"
    type: reference
status: published
---

## intro
A vector database stores high-dimensional embeddings — typically 128 to 4096 floats per item — and answers approximate nearest-neighbour (ANN) queries in milliseconds across billions of rows. The workload is unlike anything a row store handles: every query is a similarity scan, indexes are graphs or quantizer codebooks, and the precision/latency knob is exposed to the application. Pick the wrong index family or the wrong shard key and recall drops below the threshold the model needs, or p99 latency drifts past the SLA. The architecture choices below are what separate a toy demo from a system that serves recommendation, retrieval-augmented generation, and dedup at production scale.

## whyItMatters
Every retrieval-augmented LLM, recommendation feed, fraud-similarity check, image dedup pipeline, and semantic-search bar now sits on top of a vector index. The cost model differs from B-tree workloads: memory is dominated by the index, not the rows; query CPU is dominated by graph traversal or asymmetric distance computation, not by row decoding. Choosing HNSW vs IVF-PQ changes RAM cost by 10x and latency by 5x for the same recall target. Sharding decisions decide whether you can rebuild an index without a maintenance window. Anyone designing search, recsys, RAG, or de-duplication infra in 2026 must reason about these tradeoffs directly — the database does not hide them.

## intuition
Think of ANN as solving a fundamentally different problem than B-tree lookup. A B-tree exploits a 1-D total order. Vectors live in 768-D space where there is no order — only distances. Brute force is O(n*d) per query, which is fine for 10k vectors and impossible for 100M. Every ANN index family trades exactness for speed by skipping most of the dataset.

**HNSW** (Hierarchical Navigable Small World) builds a layered graph. The top layer holds a sparse subset of nodes connected by long-range edges. Each lower layer adds more nodes and shorter edges. Search starts at the top, greedily descends toward the query, then refines at the bottom. Two knobs matter: `M` (edges per node, higher = better recall, more RAM) and `efSearch` (candidate-list size at query time, higher = better recall, more CPU). HNSW shines on read-heavy workloads — recall 0.95 at <2 ms is routine — but the index is fully in-memory and updates require lock coordination.

**IVF** (Inverted File) partitions the space into `nlist` Voronoi cells via k-means on a training sample. At query time you visit `nprobe` cells (the closest centroids to the query) and scan their lists. Pair IVF with **PQ** (Product Quantization), which splits each vector into `m` sub-vectors and replaces each with an 8-bit codebook ID — vectors become 32-64 bytes instead of 3 KB. IVF-PQ trades a few recall points for ~50x memory reduction, which is why billion-scale indexes use it.

The mental model: HNSW = best recall/latency on RAM-rich nodes, hard to update fast. IVF-PQ = cheapest memory, best for billion-vector cold corpora, harder to tune. Most production stacks ship both and let the caller pick per collection.

## visualization
```
                    HNSW                         IVF-PQ
              (graph traversal)            (cell-probe + quantize)

  Layer 2:    o-------o-------o        nlist Voronoi cells (e.g. 4096):
              |       |       |
              |   q   |       |          [c1] ---> v17,v92,v210, ...
              |   .   |       |          [c2] ---> v3, v44, v801, ...
  Layer 1:    o-o-o-o-o-o-o-o-o          [c3] ---> v5, v66, v512, ...   <-- nprobe=3
              | x | x | x | x |          [c4] ---> v8, v77, v999, ...
  Layer 0:    ooooooooooooooooo          [c5] ---> ...
              all N nodes, dense
                                         query q ---> find nearest nlist
                                         centroids, scan top nprobe cells
              greedy descent from         each vector held as PQ codes
              entry point, refine          (e.g. m=16 bytes per vector)
              with efSearch list
              candidates                  pq distance = sum of m table
                                          lookups -> 50x less RAM
```

## bruteForce
Linear scan: compute `dist(query, v)` for every stored vector, return top-k. Correct, trivial to implement, and dies above ~50k vectors at sub-100 ms latency. The space cost is fine — 4 bytes * d * n — but the query CPU is O(n*d), which for 100M vectors at d=768 is 300 GFLOP per query. A second naive option: cluster offline and scan the nearest cluster only — but with no overlap control, recall collapses near cluster boundaries.

## optimal
A production vector database stacks the following layers:

1. **Index family per collection.** HNSW for sub-100M cold + read-heavy collections with strict latency. IVF-PQ for >100M vectors, write-mostly batch ingest, memory-constrained. Pinecone, Weaviate, Milvus all expose both; Qdrant and pgvector default to HNSW; Faiss exposes the full menu.

2. **Sharding by hash of vector ID.** Each shard owns a disjoint subset of vectors and runs an independent ANN index. Queries fan out to every shard, top-k is merged on the coordinator. This is **horizontal recall-preserving** because nearest neighbours can land in any shard. Routing by namespace/tenant lets you isolate noisy multi-tenant workloads.

3. **Decoupled compute from storage.** Milvus separates query nodes, data nodes, index nodes, and an object-store-backed log. Index rebuilds (e.g. switching M from 16 to 32) happen on dedicated nodes and swap in atomically. Pinecone runs the same separation as a managed service.

4. **Tiered indexing.** Hot collections fit in RAM under HNSW. Warm tier uses IVF-PQ with mmap'd codes. Cold tier offloads codes to SSD with prefetch. The query planner picks the index per shard based on the collection's freshness window.

5. **Tunable recall.** Expose `ef_search` or `nprobe` per query, not per index. Latency-sensitive endpoints (autocomplete) ride low recall; analytical endpoints (offline dedup) ride high recall on the same data.

6. **Filtered ANN.** Real queries include metadata predicates ("docs from this tenant, after this date"). Pre-filter (build per-tenant indexes), post-filter (over-fetch then drop), or hybrid (filterable HNSW like Weaviate's `vectorIndexConfig.flat`) — each has known recall failure modes that you must measure on representative queries.

## complexity
- HNSW search: O(log n) hops in expectation per layer, O(M * efSearch) distance computations per query — typical 1-3 ms for n = 10M, d = 768.
- HNSW build: O(n * log n * M) distance computations; memory O(n * (d * 4 + M * 8)) bytes.
- IVF search: O(d * nlist) to pick probe cells, then O(d * n / nlist * nprobe) for the scan. Tune nlist ~= sqrt(n).
- IVF-PQ memory: n * m bytes for codes (m typically 8-32) vs n * d * 4 for raw floats — ~50-100x reduction.
- Sharded query: latency = max(shard) + merge; throughput scales linearly with shard count, recall is preserved by fan-out.

## pitfalls
- **Building HNSW with M too low to save RAM.** Recall collapses below 0.85 once you exceed 1M vectors; the savings do not justify it. Default M = 16 to 32.
- **Treating IVF nprobe as a single global knob.** Different query distributions need different nprobe. Measure recall on a held-out query set per workload, not per index.
- **Filter-then-search without enough fanout.** Pre-filtering shrinks the candidate pool below the graph's reachable set, dropping recall to zero. Either build per-tenant indexes or use a hybrid filterable index.
- **Re-embedding without a versioned index.** Swapping the encoder invalidates every stored vector. Bake the model version into the collection name and run dual reads until cutover.
- **Ignoring drift in centroid quality (IVF).** As writes pile up, original k-means centroids become stale and recall drops silently. Schedule re-clustering or use online k-means.
- **Cross-shard top-k merge bug.** If shards return top-`k_local` and you merge to top-`k`, you must request `k_local >= k` (with overfetch) per shard or miss neighbours that cluster in one shard.

## interviewTips
- Lead with the tradeoff: HNSW = best latency on RAM, IVF-PQ = best $/vector at scale. State both before defending either.
- Quantify recall as the primary SLO. "p99 latency under 50 ms at recall@10 >= 0.95" is interview-grade; "fast and accurate" is not.
- When asked to scale to 10B vectors, mention sharding + IVF-PQ + tiered storage in one breath. Single-node HNSW capped out an order of magnitude earlier.

## code.python
```python
# HNSW with hnswlib (the canonical reference implementation).
import hnswlib, numpy as np

dim = 768
index = hnswlib.Index(space='cosine', dim=dim)
index.init_index(max_elements=2_000_000, ef_construction=200, M=32)
index.set_ef(64)            # query-time candidate list (higher = better recall, slower)

vecs = np.random.randn(2_000_000, dim).astype('float32')
ids  = np.arange(len(vecs))
index.add_items(vecs, ids)  # parallel by default

q = np.random.randn(1, dim).astype('float32')
labels, distances = index.knn_query(q, k=10)
```

## code.javascript
```javascript
// Pinecone REST client — managed vector DB, no index choice surfaced to caller.
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('docs-768');

await index.upsert([
  { id: 'doc-42', values: embedding, metadata: { tenant: 'acme', ts: Date.now() } }
]);

const result = await index.query({
  vector: queryEmbedding,
  topK: 10,
  filter: { tenant: { $eq: 'acme' } },
  includeMetadata: true,
});
```

## code.java
```java
// Milvus Java SDK — collection-level index params control HNSW vs IVF.
import io.milvus.client.MilvusServiceClient;
import io.milvus.param.collection.*;
import io.milvus.param.index.*;

CreateIndexParam idx = CreateIndexParam.newBuilder()
    .withCollectionName("docs")
    .withFieldName("embedding")
    .withIndexType(IndexType.HNSW)
    .withMetricType(MetricType.COSINE)
    .withExtraParam("{\"M\":32,\"efConstruction\":200}")
    .build();
client.createIndex(idx);
```

## code.cpp
```cpp
// Faiss — IVF-PQ for billion-scale, runs CPU or GPU.
#include <faiss/IndexIVFPQ.h>
#include <faiss/IndexFlat.h>

int d = 768, nlist = 4096, m = 32;   // m = PQ sub-vectors (bytes per code)
faiss::IndexFlatL2 quantizer(d);
faiss::IndexIVFPQ index(&quantizer, d, nlist, m, /*nbits*/ 8);

index.train(n_train, train_vectors);   // k-means on a sample
index.add(n, all_vectors);             // insert
index.nprobe = 16;                     // recall vs latency knob
index.search(n_q, queries, k, distances, labels);
```
