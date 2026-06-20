---
slug: time-series-storage
module: sd-storage
title: Time-Series Storage
subtitle: Append-only writes, time-partitioned chunks, tag indexes, and downsampling — what a TSDB does that a generic OLTP store cannot.
difficulty: Advanced
position: 3
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "InfluxDB Docs — Design Principles"
    url: "https://docs.influxdata.com/influxdb/v2/reference/key-concepts/design-principles/"
    type: book
  - title: "Prometheus Docs — Storage"
    url: "https://prometheus.io/docs/prometheus/latest/storage/"
    type: book
  - title: "TimescaleDB Docs — Hypertables"
    url: "https://www.tigerdata.com/docs/use-timescale/latest/hypertables/about-hypertables"
    type: book
status: published
---

## intro
A time-series database is optimized for one workload: append rows tagged with a timestamp, query ranges of time, often aggregating millions of points into a chart. InfluxDB, TimescaleDB, Prometheus, VictoriaMetrics, QuestDB, and ClickHouse all bet on the same set of assumptions — writes arrive in time order, updates and deletes are rare, queries scan windows of time, and the working set is dominated by recent data. Those assumptions let them outperform a general-purpose B-tree store by 10-100x on metrics workloads.

## whyItMatters
Every observability stack (Prometheus + Grafana, Datadog, New Relic), every IoT ingest pipeline, every financial tick store, every SRE dashboard hits this problem at petabyte scale. The naive answer — "just put it in Postgres with a timestamp column" — collapses past a few billion rows. B-tree indexes bloat; random-IO seeks dominate; vacuum cannot keep up. The TSDBs solve it with a different storage layout that is wrong for OLTP but right for this one workload. Knowing why your metrics pipeline uses InfluxDB instead of MySQL — and when to push back and just use Timescale on Postgres — is a routine system-design question.

## intuition
Time-series workloads have three properties that the general store ignores. **Writes are append-only and time-monotone.** Today's data arrives now; yesterday's data does not change. **Queries are range scans by time and by tag.** "p99 latency on service=api, region=us-east, last 1 hour." **Old data gets less valuable.** A point from 30 minutes ago is rendered at 1-second resolution; a point from 30 days ago is rendered at 1-minute resolution; a point from 2 years ago lives only as a daily aggregate or is dropped entirely.

Four optimizations follow.

**Time-partitioned chunks.** Split the data into per-time-window files — Prometheus uses 2-hour blocks, TimescaleDB calls them "chunks," InfluxDB calls them "shards." A query for "last 30 minutes" touches one chunk. A query for "last 7 days" touches a few. The chunk that is currently being written is in memory + a write-ahead log; once it closes, it becomes an immutable file, often compressed 10-20x. This is the LSM idea applied to time.

**Tag indexes, not row indexes.** A metric is identified by `(name, tag1=v1, tag2=v2, ...)` — `http_requests_total{method="GET", status="200", region="us-east"}`. The combination is a "series." Each series gets a compact id; all points for that series are stored together. Range queries pre-filter to matching series via inverted indexes on tags, then stream points from each series's chunk file. This is the opposite of a generic store, which indexes individual rows.

**Column-wise compression of points.** Within a series, points are `(timestamp, value)` pairs. Timestamps are nearly evenly spaced, so delta-of-delta encoding (Facebook's Gorilla compression) shrinks them to 1-2 bytes each. Values change slowly, so XOR encoding + run-length runs compress floats by 5-10x. Across a whole chunk, you store millions of points in megabytes, not gigabytes.

**Downsampling and retention.** Raw 1-second points are kept for hours, downsampled to 1-minute averages for days, then 1-hour for months, then dropped. The downsampling is itself a pre-computed materialized view ("continuous aggregate" in Timescale, "recording rule" in Prometheus). Retention policies drop chunks older than the cutoff in constant time — no row-by-row deletion, no vacuum.

The trade you're making against a B-tree store: updates and deletes are expensive (you have to rewrite a chunk), out-of-order writes are slow (you may have to merge into a sealed chunk), and arbitrary-point lookups are slow (TSDBs scan series; they don't binary-search). For metrics, those operations are nearly absent; the trade pays off massively.

## visualization
```
Series: http_requests_total{method=GET, region=us-east}

Chunk layout on disk (per 2h window):

  +-----------------------+
  | Block 14:00 - 16:00   |   (immutable, compressed)
  |  series 1842:         |
  |    ts:  [delta-of-delta, ~1.5 bytes each]
  |    val: [XOR-encoded floats, ~1.4 bytes each]
  +-----------------------+
  +-----------------------+
  | Block 16:00 - 18:00   |   (immutable)
  +-----------------------+
  +-----------------------+
  | Head 18:00 - now      |   (in memory + WAL)
  +-----------------------+

Tag index (separate inverted index):
  method=GET   -> [series 1842, 1843, 1857, ...]
  region=us-east -> [series 1842, 1849, ...]
  intersection -> matching series ids -> stream their points
```

## bruteForce
Use a generic OLTP database — Postgres or MySQL with `(timestamp, metric_name, value, tag_json)`. Indexes on `(metric, timestamp)` and a JSONB GIN on tags. Works fine to about 100 million rows. Past that: write throughput cliffs at the b-tree bottleneck, the JSONB index blows up, range queries hit billions of pages, vacuum runs for hours and falls behind, retention deletes lock the table. Teams pay this cost for years before migrating; the migration is the entire reason VictoriaMetrics, TimescaleDB, and InfluxDB are billion-dollar companies.

## optimal
A purpose-built TSDB layout with four cooperating subsystems.

**1. Time-partitioned, append-only chunks with WAL durability.** A new write goes to an in-memory "head block" and a write-ahead log. The head block is mutable. Once it fills (Prometheus: 2h; Timescale: configurable, default 7d) it is closed, written out as an immutable file in a columnar format, and compressed. Reads of recent data go to the head; reads of older data go to the closed chunks. The WAL is replayed on restart to recover the head.

**2. Inverted index on tags, mapping label-set to series id.** A series is a unique `(metric_name, tag_set)` tuple. Each series gets a small integer id. The inverted index maps each label-value pair (`region=us-east`) to a sorted posting list of series ids that have that label. A query like `up{region="us-east", env="prod"}` intersects two posting lists to get the relevant series ids — same data structure that powers search engines. Once you have the series ids, you stream their points directly from the chunk files; no row-by-row index lookup.

**3. Columnar, delta-of-delta + XOR compression.** Within a series, timestamps are encoded by storing the delta between consecutive timestamps, then the delta of those deltas (which is usually 0 for evenly-spaced samples). Values are encoded by storing the XOR with the previous value; for slowly-changing metrics, the XOR is mostly leading zeros, packed bit-aligned. This is the Gorilla compression algorithm; Facebook reported 10x compression on production metrics. Reading a chunk decompresses on the fly.

**4. Continuous aggregates and retention.** "Downsample 1s -> 1m -> 1h" is a stack of pre-computed materialized views, refreshed as new data lands. Old raw data is dropped on a per-chunk basis: when a chunk's max timestamp is older than the retention horizon, the entire file is unlinked. No vacuum, no row-by-row scan. Tiered storage moves cold chunks to S3 or object storage at a lower cost per byte.

**The chunk-skip + series-pruning execution model.** A query `rate(http_requests_total{status="500"}[5m])` over the last week resolves to: (1) ask the tag index for series ids matching `status="500"`, (2) walk the chunk index to find every chunk overlapping the time range, (3) for each (series, chunk) pair, stream and decompress the points, (4) apply the rate function. The bottleneck is the chunk-streaming bandwidth, not random IO — which is exactly why these systems scale where the OLTP store does not.

**When NOT to reach for a TSDB.** If updates are frequent (financial corrections, late-arriving data), if you need joins across series and dimension tables, if you need strong transactional guarantees, or if you need arbitrary point lookups by a non-tag field, you are not in the TSDB sweet spot. TimescaleDB is a pragmatic compromise here — it is Postgres with chunking, so you keep ACID transactions and full SQL while gaining 10-50x on time-range queries. That is why it has been the default "boring choice" for teams that need both.

The interview line: "Time-series workloads are append-only, time-monotone, range-scanned, and value-decaying. A TSDB exploits all four — time-partitioned chunks, columnar Gorilla compression, tag-inverted indexes, continuous downsampling, retention by chunk drop. Compared to a B-tree OLTP store, the TSDB is 10-100x on this workload and unusable for OLTP."

## complexity
time: write O(1) amortized per point; tag-filtered range scan O(series_matched * points_in_window / decompression_throughput); retention drop O(chunks_dropped).
space: ~1-3 bytes per point after Gorilla compression for typical metrics; raw is ~16 bytes (ts+value+overhead).
notes: Inverted-index intersection is O(min(|posting lists|)) with skip lists. Out-of-order writes that land in a sealed chunk force a merge or are rejected — both designs exist.

## pitfalls
- **High-cardinality tags blow up the index.** A label like `user_id` with 10M unique values creates 10M series. The inverted index, the series id table, and the per-series chunk metadata all scale with cardinality. Rule of thumb: keep label cardinality under ~1M per metric; use logs or traces for per-user attribution.
- **Out-of-order writes are an error path.** Default Prometheus rejects samples with an earlier timestamp than the head's max. If your producer can lag (mobile clients, batch ingest), pick a TSDB that supports out-of-order ingestion (Timescale, InfluxDB v3) or buffer at the edge.
- **Naive retention via DELETE will kill you.** Setting "delete rows older than 30 days" on a generic store generates billions of row deletes plus index rebuilds. Always partition by time and drop the partition; this is the actual reason chunking exists.
- **Querying a year of raw 1-second data is a footgun.** A dashboard query asking for "all of 2023" on raw data reads terabytes. Always serve from a downsampled rollup; auto-route the query to the right resolution based on the requested time range and point budget.
- **Treating a TSDB as a system of record.** TSDBs are designed for tolerable data loss on the recent window (a crashed scraper drops a few samples; nobody dies). If a point being permanently durable matters (billing meters, audit), tee the write to a durable queue or store in addition.

## interviewTips
- Lead with the four invariants — append-only, time-monotone, range-scanned, value-decays — and explain how each one unlocks a specific optimization. Interviewers want the "why," not a list of products.
- Always raise cardinality. "How many unique tag combinations do we expect?" is the question that separates serious from hand-wavy answers; in production, this is what blows up the ingest tier.
- Know when to use Timescale vs Prometheus vs InfluxDB vs ClickHouse. Roughly: Prometheus for pull-based metrics, InfluxDB / Influx-Cloud or VictoriaMetrics for high-throughput push, TimescaleDB when you need Postgres SQL + transactions, ClickHouse when you need analytics-style queries over events with high-cardinality columns.

## code.python
```python
from collections import defaultdict
import bisect

class TSDB:
    """Toy TSDB: append-only points, tag-indexed series, time-range scan."""
    def __init__(self):
        self.series = {}                            # series_id -> list[(ts, val)]
        self.tag_index = defaultdict(set)           # (k, v) -> set(series_id)
        self.label_to_id = {}                       # frozenset(tags) -> series_id
        self.next_id = 0

    def _series_id(self, tags):
        key = frozenset(tags.items())
        if key not in self.label_to_id:
            sid = self.next_id; self.next_id += 1
            self.label_to_id[key] = sid
            self.series[sid] = []
            for kv in tags.items():
                self.tag_index[kv].add(sid)
        return self.label_to_id[key]

    def write(self, tags, ts, val):
        sid = self._series_id(tags)
        chunk = self.series[sid]
        if chunk and ts < chunk[-1][0]:
            raise ValueError("out-of-order write")  # TSDB invariant
        chunk.append((ts, val))

    def query(self, tag_filter, t_start, t_end):
        matching = None
        for kv in tag_filter.items():
            posting = self.tag_index.get(kv, set())
            matching = posting if matching is None else matching & posting
        out = []
        for sid in matching or []:
            chunk = self.series[sid]
            tss = [p[0] for p in chunk]
            lo = bisect.bisect_left(tss, t_start)
            hi = bisect.bisect_right(tss, t_end)
            out.extend((sid, ts, v) for ts, v in chunk[lo:hi])
        return out
```

## code.javascript
```javascript
class TSDB {
  constructor() {
    this.series = new Map();        // sid -> [{ts, val}]
    this.tagIndex = new Map();      // "k=v" -> Set(sid)
    this.labelToId = new Map();     // canonical tags -> sid
    this.nextId = 0;
  }
  _seriesId(tags) {
    const key = Object.entries(tags).sort().map(([k, v]) => `${k}=${v}`).join(",");
    if (!this.labelToId.has(key)) {
      const sid = this.nextId++;
      this.labelToId.set(key, sid);
      this.series.set(sid, []);
      for (const [k, v] of Object.entries(tags)) {
        const tk = `${k}=${v}`;
        if (!this.tagIndex.has(tk)) this.tagIndex.set(tk, new Set());
        this.tagIndex.get(tk).add(sid);
      }
    }
    return this.labelToId.get(key);
  }
  write(tags, ts, val) {
    const sid = this._seriesId(tags);
    const chunk = this.series.get(sid);
    if (chunk.length && ts < chunk[chunk.length - 1].ts) {
      throw new Error("out-of-order write");
    }
    chunk.push({ ts, val });
  }
  query(tagFilter, tStart, tEnd) {
    let matching = null;
    for (const [k, v] of Object.entries(tagFilter)) {
      const posting = this.tagIndex.get(`${k}=${v}`) || new Set();
      matching = matching == null ? new Set(posting)
        : new Set([...matching].filter(x => posting.has(x)));
    }
    const out = [];
    for (const sid of matching || []) {
      for (const { ts, val } of this.series.get(sid)) {
        if (ts >= tStart && ts <= tEnd) out.push({ sid, ts, val });
      }
    }
    return out;
  }
}
```

## code.java
```java
import java.util.*;

class TSDB {
    static class Point { long ts; double val; Point(long t, double v) { ts = t; val = v; } }
    Map<Integer, List<Point>> series = new HashMap<>();
    Map<String, Set<Integer>> tagIndex = new HashMap<>();
    Map<String, Integer> labelToId = new HashMap<>();
    int nextId = 0;

    private int seriesId(Map<String, String> tags) {
        String key = new TreeMap<>(tags).toString();
        Integer sid = labelToId.get(key);
        if (sid == null) {
            sid = nextId++;
            labelToId.put(key, sid);
            series.put(sid, new ArrayList<>());
            for (var e : tags.entrySet())
                tagIndex.computeIfAbsent(e.getKey() + "=" + e.getValue(), k -> new HashSet<>()).add(sid);
        }
        return sid;
    }
    public void write(Map<String, String> tags, long ts, double val) {
        int sid = seriesId(tags);
        var chunk = series.get(sid);
        if (!chunk.isEmpty() && ts < chunk.get(chunk.size() - 1).ts)
            throw new IllegalArgumentException("out-of-order write");
        chunk.add(new Point(ts, val));
    }
    public List<double[]> query(Map<String, String> filter, long tStart, long tEnd) {
        Set<Integer> matching = null;
        for (var e : filter.entrySet()) {
            Set<Integer> p = tagIndex.getOrDefault(e.getKey() + "=" + e.getValue(), Set.of());
            matching = matching == null ? new HashSet<>(p)
                : matching.stream().filter(p::contains).collect(java.util.stream.Collectors.toCollection(HashSet::new));
        }
        List<double[]> out = new ArrayList<>();
        for (int sid : matching == null ? Set.<Integer>of() : matching)
            for (Point pt : series.get(sid))
                if (pt.ts >= tStart && pt.ts <= tEnd) out.add(new double[]{sid, pt.ts, pt.val});
        return out;
    }
}
```

## code.cpp
```cpp
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <vector>
#include <string>
#include <stdexcept>

struct Point { long long ts; double val; };

class TSDB {
    std::unordered_map<int, std::vector<Point>> series;
    std::unordered_map<std::string, std::unordered_set<int>> tag_index;
    std::unordered_map<std::string, int> label_to_id;
    int next_id = 0;

    int series_id(const std::map<std::string,std::string>& tags) {
        std::string key;
        for (auto& [k, v] : tags) { key += k; key += '='; key += v; key += ','; }
        auto it = label_to_id.find(key);
        if (it != label_to_id.end()) return it->second;
        int sid = next_id++;
        label_to_id[key] = sid;
        series[sid] = {};
        for (auto& [k, v] : tags) tag_index[k + "=" + v].insert(sid);
        return sid;
    }
public:
    void write(const std::map<std::string,std::string>& tags, long long ts, double val) {
        int sid = series_id(tags);
        auto& chunk = series[sid];
        if (!chunk.empty() && ts < chunk.back().ts) throw std::runtime_error("out-of-order write");
        chunk.push_back({ts, val});
    }
    std::vector<std::tuple<int,long long,double>>
    query(const std::map<std::string,std::string>& filter, long long t_start, long long t_end) {
        std::unordered_set<int> matching; bool first = true;
        for (auto& [k, v] : filter) {
            auto it = tag_index.find(k + "=" + v);
            std::unordered_set<int> posting = it == tag_index.end() ? std::unordered_set<int>{} : it->second;
            if (first) { matching = posting; first = false; }
            else {
                std::unordered_set<int> next;
                for (int s : matching) if (posting.count(s)) next.insert(s);
                matching = next;
            }
        }
        std::vector<std::tuple<int,long long,double>> out;
        for (int sid : matching)
            for (auto& p : series[sid])
                if (p.ts >= t_start && p.ts <= t_end) out.push_back({sid, p.ts, p.val});
        return out;
    }
};
```
