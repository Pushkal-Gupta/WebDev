---
slug: nosql-vs-sql
module: system-design
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
Wrong store choice = constant pain: forcing graph traversal through 10-way SQL joins, modeling normalized invoices in Mongo with five collections, paying for ACID you never use. Right choice = the database disappears; you write features instead of fighting your schema.

## intuition
**Relational (Postgres, MySQL)** — rows + columns + foreign keys. Ad-hoc joins, transactions, strong schema. Best when: data is highly relational, queries unpredictable, you need ACID.

**Document (Mongo, DynamoDB single-table)** — nested JSON keyed by id. Best when: one aggregate is read together (order + line items), schema evolves often, no cross-document joins.

**Wide-column (Cassandra, ScyllaDB, BigTable)** — partition key + clustering key + many columns. Best when: write-heavy time-series, fanout writes, queries by partition, no joins.

**Key-value (Redis, DynamoDB simple, Memcached)** — `get(key) -> value`. Best when: session store, cache, leaderboard, counter. Microsecond latency.

**Graph (Neo4j, Neptune, ArangoDB)** — nodes + edges with properties. Best when: recommendations, fraud rings, social graphs, IAM permission paths — traversal IS the workload.

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
**Decision flow**:
1. Are queries known up-front + bounded? -> document/KV.
2. Are queries ad-hoc + analytic? -> relational (or warehouse).
3. Is the dominant access traversal? -> graph.
4. Is write throughput >50k/s per partition? -> wide-column.
5. Need single-digit ms reads on hot data? -> KV cache in front of any of the above.

**Polyglot persistence**: orders in Postgres (need ACID), sessions in Redis, audit log in Cassandra, recommendations in Neo4j. Each store does what it's best at; sync via CDC or events.

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
