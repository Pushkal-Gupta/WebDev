---
slug: nosql-vs-sql
module: sd-storage
title: NoSQL vs SQL
subtitle: When document, wide-column, key-value, graph, or relational stores each win.
difficulty: Intermediate
position: 62
estimatedReadMinutes: 6
prereqs: []
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Kleppmann"
    url: "https://dataintensive.net"
    type: book
  - title: "Martin Fowler — Polyglot Persistence"
    url: "https://martinfowler.com/bliki/PolyglotPersistence.html"
    type: blog
  - title: "donnemartin/system-design-primer"
    url: "https://github.com/donnemartin/system-design-primer"
    type: repo
status: published
---

## intro
"SQL or NoSQL" is the wrong question. The right question: **what access pattern dominates?** Relational shines for ad-hoc joins + strong consistency. Document fits nested aggregates. Wide-column scales writes by partition. Key-value is fastest for lookups. Graph wins when traversal IS the query. Pick by shape of reads, not by hype.

## whyItMatters
Wrong store choice equals constant pain: forcing graph traversal through 10-way SQL joins, modeling normalized invoices in MongoDB with five collections, paying for ACID you never use, or running BI dashboards directly against eventually-consistent KV stores. Right choice equals the database disappears and you write features instead of fighting your schema. Every senior backend interview at Stripe, Uber, Airbnb, Netflix, and Meta probes for the ability to pick the right store per workload and to justify the choice with concrete trade-offs (consistency, query shape, latency, write throughput, cost per GB). Polyglot persistence is the norm at scale — Uber runs Postgres, Cassandra, Redis, and HBase concurrently because no single store handles all workloads well.

## intuition
Five families cover almost every workload. **Relational (Postgres, MySQL)**: rows, columns, foreign keys, ad-hoc joins, transactions, strong schema. Best when data is highly relational, queries are unpredictable, and you need ACID. **Document (MongoDB, DynamoDB single-table, Firestore)**: nested JSON keyed by id. Best when one aggregate is read together (an order plus its line items), schema evolves often, and there are no cross-document joins. **Wide-column (Cassandra, ScyllaDB, BigTable, HBase)**: partition key plus clustering key plus many columns. Best for write-heavy time-series, fanout writes, queries scoped to a partition, and no joins. **Key-value (Redis, DynamoDB simple, Memcached, etcd)**: `get(key) -> value` with microsecond latency. Best for session stores, caches, leaderboards, counters. **Graph (Neo4j, Neptune, ArangoDB, TigerGraph)**: nodes plus edges with properties. Best for recommendations, fraud rings, social graphs, IAM permission paths — traversal *is* the workload.

The second axis is the consistency model. Strong consistency (Postgres, Spanner, FoundationDB) versus tunable (Cassandra's `QUORUM` vs `ONE`) versus eventual (Dynamo, vanilla DNS). The third axis is operational maturity — Postgres has 30 years of tooling, BigQuery has Google operating it for you, but newer stores often ship with sparse ecosystem support.

The right way to choose is to write the read and write paths first, then pick a store whose primitives match exactly. "We need ad-hoc joins" rules out KV. "We need 50,000 writes/sec per partition" rules out single-leader SQL. "We have a graph and our hottest query is multi-hop" rules out everything except graph stores.

## visualization
```
            | Schema     | Joins    | Scale    | Consistency | Sweet spot
-----------+------------+----------+----------+-------------+----------------------
Relational | strict     | great    | vertical | ACID strong | OLTP, dashboards
Document   | flexible   | weak     | horiz    | per-doc     | aggregates, CMS
WideCol    | per-CF     | none     | massive  | tunable     | timeseries, IoT
KV         | none       | none     | massive  | per-key     | cache, session
Graph      | typed      | native   | hard     | tx          | recs, fraud, IAM
```

## bruteForce
**Default to Postgres for everything**: works until you hit 100k writes/sec on a single hot table, or a per-row JSON blob bloats to MBs, or graph traversals timeout. Then it's a forced migration mid-product.

**Default to Mongo for everything**: pleasant for first 6 months until cross-collection reporting requires application-side joins + you lose transactionality.

## optimal
**Decision flow**: (1) Are queries known up-front and bounded? Document or KV. (2) Are queries ad-hoc and analytic? Relational or warehouse. (3) Is the dominant access pattern graph traversal? Graph DB. (4) Is write throughput above 50k/s per partition? Wide-column. (5) Need single-digit-ms reads on hot data? KV cache in front of any of the above.

```python
# Polyglot persistence: each store does what it is best at
orders_db    = Postgres(...)         # ACID, joins for reporting
sessions     = Redis(...)            # sub-ms reads, TTL eviction
audit_log    = Cassandra(...)        # write-heavy append-only
recsys_graph = Neo4j(...)            # multi-hop traversal
search_index = Elasticsearch(...)    # full-text and faceted search

# Sync the stores via CDC or events (Debezium, Kafka Connect)
def on_order_committed(order):
    audit_log.append({'ts': now(), 'order_id': order.id, 'state': 'committed'})
    recsys_graph.upsert_edge(order.user_id, order.product_id, 'bought')
    search_index.index(order.to_search_doc())
```

The critical pattern is keeping the *system of record* in one canonical store (here, Postgres) and projecting derived views into specialized stores via change-data-capture or domain events. The system of record stays normalized and ACID; the projections are eventually consistent caches that can be rebuilt from the log if they ever drift. For new builds at small scale, start with Postgres for everything — it covers JSON documents (`jsonb`), full-text search (`tsvector`), key-value (`hstore`), time-series (TimescaleDB extension), and graph (`recursive CTE`s) at workloads up to roughly 10k QPS. Only split the workload when a specific access pattern outgrows what Postgres can sustain on the largest instance you can afford.

## complexity
- **Relational lookup with index**: O(log n) on B-tree; joins O(n+m) hashed.
- **Document by id**: O(1) on partition.
- **Wide-column by partition**: O(log n) inside partition.
- **Graph k-hop traversal**: O(neighbors^k) — index-free adjacency makes it fast.

## pitfalls
- **Modeling Mongo like Postgres**: 5 collections + `$lookup` everywhere = bad relational DB.
- **Using Cassandra without knowing partition keys**: every query must hit one; "show all users by email" is a scan.
- **Graph DB for non-graph workloads**: 10x slower than Postgres for simple CRUD.
- **One DB per microservice as dogma**: ends up with 12 stores no one operates competently.
- **Skipping transactions when you need them**: "eventually consistent inventory" sells the same item twice.

## interviewTips
- For "design X" — name the read pattern first, THEN justify the store.
- Mention **polyglot persistence** for systems with mixed workloads.
- Discuss **CAP/PACELC tradeoffs** when picking AP vs CP.
- Strong candidates name a SPECIFIC product (DynamoDB, not "a NoSQL DB").

## code.python
```python
def pick_store(access):
    if access.get('graph_traversal'): return 'neo4j'
    if access.get('write_qps', 0) > 50000: return 'cassandra'
    if access.get('latency_ms_p99', 100) < 2: return 'redis'
    if access.get('ad_hoc_queries'): return 'postgres'
    if access.get('aggregate_reads'): return 'mongo'
    return 'postgres'
```

## code.javascript
```javascript
function pickStore(access) {
  if (access.graphTraversal) return 'neo4j';
  if ((access.writeQps ?? 0) > 50000) return 'cassandra';
  if ((access.latencyP99Ms ?? 100) < 2) return 'redis';
  if (access.adHocQueries) return 'postgres';
  if (access.aggregateReads) return 'mongo';
  return 'postgres';
}
```

## code.java
```java
static String pickStore(Map<String, Object> access) {
    if (Boolean.TRUE.equals(access.get("graphTraversal"))) return "neo4j";
    if (((Number) access.getOrDefault("writeQps", 0)).intValue() > 50000) return "cassandra";
    if (((Number) access.getOrDefault("latencyP99Ms", 100)).intValue() < 2) return "redis";
    if (Boolean.TRUE.equals(access.get("adHocQueries"))) return "postgres";
    if (Boolean.TRUE.equals(access.get("aggregateReads"))) return "mongo";
    return "postgres";
}
```

## code.cpp
```cpp
// std::string pickStore(const Access& a) {
//     if (a.graphTraversal) return "neo4j";
//     if (a.writeQps > 50000) return "cassandra";
//     if (a.latencyP99Ms < 2) return "redis";
//     if (a.adHocQueries) return "postgres";
//     if (a.aggregateReads) return "mongo";
//     return "postgres";
// }
```
