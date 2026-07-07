---
slug: data-batch-streaming
module: data-engineering
title: Batch versus Stream Processing
subtitle: Choose between processing bounded data in scheduled chunks and processing unbounded events as they arrive — and get windowing, event-time, and exactly-once right.
difficulty: Intermediate
position: 2
estimatedReadMinutes: 17
prereqs: [data-etl-pipelines]
relatedProblems: []
references:
  - title: "Designing Data-Intensive Applications — Chapter 11: Stream Processing"
    url: "https://dataintensive.net/"
    type: book
  - title: "Apache Flink — Timely stream processing: event time and watermarks"
    url: "https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/"
    type: docs
  - title: "Apache Flink — Windows (tumbling, sliding, session)"
    url: "https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/operators/windows/"
    type: docs
  - title: "The Dataflow Model (Akidau et al., VLDB 2015)"
    url: "https://research.google/pubs/pub43864/"
    type: article
  - title: "Streaming 101 — Tyler Akidau on batch, streaming, and time"
    url: "https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/"
    type: article
status: published
---

## intro

Batch processing takes a bounded dataset — yesterday's orders, a month of logs, an entire table — and runs a computation over the whole thing at once, on a schedule. Stream processing takes an unbounded, never-ending sequence of events and computes results continuously as each event arrives, often within milliseconds. The two are not rivals so much as two ends of a latency-versus-completeness dial: batch waits until it has everything and answers exactly; streaming answers immediately with whatever has arrived so far and revises as more shows up. The hard parts — windowing, the gap between when an event *happened* and when you *saw* it, and not double-counting after a failure — are what separate a toy from a system you can trust.

## whyItMatters

The choice governs how fresh your numbers are and how much they cost. A fraud check that runs as a nightly batch catches yesterday's stolen card today — useless. A dashboard rebuilt from scratch every hour burns compute re-reading data that never changed. Real products mix both: a streaming layer for low-latency reactions and a batch layer for correct, reprocessable history. Getting the semantics wrong is expensive and silent — a window that keys on the wrong clock quietly attributes Friday-night traffic to Saturday, an at-least-once pipeline double-bills customers after a retry, and a late event that arrives after its window closed vanishes from the totals. These are not crashes; they are wrong numbers people trust. Understanding windowing, event-time, and exactly-once is what lets you promise a stakeholder that the count on the screen is actually right.

## intuition

Think of a mail room. Batch processing is opening the mailbox once a day: you gather every letter that accumulated, sort the whole pile, and file it. You know exactly how many letters arrived because collection is closed. Stream processing is standing at the slot as letters drop through, sorting each one the instant it lands. You react instantly, but you never quite know if another letter is still in transit.

An unbounded stream has no natural end, so to compute anything aggregate — a count, an average, a top-10 — you slice time into **windows**. A **tumbling** window is a row of fixed, non-overlapping buckets: 09:00-09:05, 09:05-09:10, each event lands in exactly one. A **sliding** window overlaps: a 5-minute window that advances every 1 minute, so each event belongs to several windows and you get a smooth moving average.

The subtle part is *which clock you use*. **Event-time** is the timestamp baked into the event when it happened on the user's phone. **Processing-time** is the wall clock when your server finally handled it. They differ because the phone was in a tunnel, the network hiccuped, or a broker buffered. Key your windows by event-time and a delayed event still lands in the bucket for the minute it truly occurred; key by processing-time and the same event is misfiled into whenever it happened to arrive. But event-time forces a question: how long do you wait for stragglers before you close a window and emit its result? That is what a **watermark** answers — a moving assertion that "no more events older than time T are expected," letting the system fire a window while tolerating a bounded amount of lateness.

## visualization

```
 event-time -->  09:00   09:01   09:02   09:03   09:04   09:05
 events:          e1      e2  e3          e4              e5   e6*  (e6 late)
                  |       |   |           |               |
 TUMBLING [5m]:   |------- window A ------|------- window B ------|
                  (e1..e4 -> count 4)      (e5.. -> count grows)
                                           e6* arrives at proc 09:07
                                           but event-time = 09:02
 SLIDING [5m/1m]: [--w1--]
                     [--w2--]
                        [--w3--]   overlapping: e3 counted in w1,w2,w3
 watermark ~~~~~~~~~~~~~~~~~~> allows lateness L; fires A when wm > 09:05
```

## bruteForce

The naive streaming aggregate keys everything by processing-time and closes each window the instant the wall clock ticks past its end. Count events per 5-minute bucket by looking at `now()` when each event lands. It is trivial to write and completely wrong under any real network. An event generated at 09:04 that arrives at 09:06 — because the device was offline — gets counted in the 09:05-09:10 bucket, so Friday's late-arriving mobile traffic is silently credited to the wrong window and every downstream metric drifts. Worse, there is no notion of lateness: once the wall clock passes a boundary the bucket is sealed and stragglers are either dropped or misfiled with no record. And with at-least-once delivery, a consumer that crashes after processing but before acknowledging will reprocess the same events on restart, inflating every count. The naive version looks correct in a demo where events arrive in order and nothing fails, which is exactly never in production.

## optimal

A correct streaming aggregate keys windows by **event-time**, uses **watermarks** to decide when a window is complete, and achieves **exactly-once** results through checkpointing plus idempotent or transactional sinks.

Assign each event to windows using its embedded event-time, not arrival time, so a delayed event still lands in the bucket for the minute it occurred. Track a watermark — typically the maximum event-time seen so far minus an allowed-lateness slack — as a promise that events older than the watermark are (mostly) in. When the watermark passes a window's end, fire that window's result. Events later than the watermark are handled by an explicit policy: drop them, route them to a side output for inspection, or emit a retraction/update that corrects the earlier result. This is the lambda-versus-kappa tradeoff in miniature: emit early and revise (low latency, eventual correctness) or wait for the watermark (higher latency, cleaner output).

Exactly-once is the second pillar. Streaming systems deliver at-least-once at the wire, so "exactly-once" means exactly-once *effect on state and output*, not exactly-once delivery. Frameworks like Flink take periodic distributed **checkpoints** (a consistent snapshot of all operator state plus input offsets via the Chandy-Lamport barrier algorithm); on failure they roll back to the last checkpoint and replay from the saved offsets. To keep external sinks consistent they use idempotent writes (upsert on a key) or transactional two-phase commits so replayed output does not double-count. The mental model that unifies batch and streaming is the Dataflow model: batch is just streaming over a bounded input where the watermark jumps straight to "complete," so the same windowing and exactly-once machinery serves both, and a well-designed pipeline can reprocess history in batch mode with identical logic.

## complexity

- **time:** Streaming cost is per-event and continuous — throughput is events/sec and the metric that matters is end-to-end latency (event-time to result). Batch cost is per-run over the whole bounded input, so it is proportional to total data scanned and trades latency for amortized efficiency.
- **space:** Windowed state is proportional to the number of open windows times keys times per-key aggregate size. Sliding windows multiply this by the overlap factor; long allowed-lateness keeps windows open longer and grows state. Checkpoint size tracks live state, so unbounded key spaces or leaking windows blow up storage.
- **notes:** Watermark lag is a direct latency knob — more allowed lateness means later firing but fewer dropped events. Exactly-once via checkpointing adds overhead proportional to state size per checkpoint interval; tune the interval to balance recovery time against runtime cost.

## pitfalls

- **Keying windows by processing-time instead of event-time.** Late or out-of-order events get attributed to the wrong window and every aggregate drifts. Fix: assign windows using the event's embedded timestamp and manage completeness with watermarks, never `now()`.
- **Assuming a closed window means all data arrived.** A window fired on the watermark can still receive later events, and dropping them silently loses data. Fix: set an explicit allowed-lateness, route stragglers to a side output, and emit retractions/updates when correctness demands it.
- **Confusing exactly-once delivery with exactly-once effect.** No system gives exactly-once delivery over an unreliable network; the wire is at-least-once. Fix: get exactly-once *results* via checkpointed state plus idempotent or transactional sinks, so replays converge instead of double-counting.
- **Unbounded window state.** Session windows on a huge key space, or ever-growing allowed-lateness, keep state open until memory and checkpoints explode. Fix: bound key cardinality, cap lateness, and use state TTLs to evict dead keys.
- **No path to reprocess history.** A streaming-only pipeline cannot fix a bug retroactively because the events are gone. Fix: retain the raw event log (a durable messaging log) so you can replay and recompute in batch with the same windowing logic.
- **Ignoring the latency-completeness tradeoff.** Firing windows immediately gives fast but provisional numbers; waiting for a long watermark gives correct but stale ones. Fix: pick per-use-case — emit-early-and-revise for dashboards, wait-for-watermark for billing.

## interviewTips

- Frame batch and streaming as one model, not two systems: batch is streaming over a bounded input where the watermark jumps to complete. Cite the Dataflow model and you signal depth beyond "batch is slow, streaming is fast."
- Always separate event-time from processing-time early in the answer, then introduce watermarks as the mechanism that reconciles them — interviewers probe exactly this with an "out-of-order events" follow-up.
- Say precisely what exactly-once means: exactly-once *effect* via checkpointed state plus idempotent/transactional sinks, on top of at-least-once delivery. Claiming exactly-once delivery over a network is a red flag.

## keyTakeaways

- Batch answers a bounded dataset exactly but with latency; streaming answers an unbounded stream continuously with low latency and revises as more arrives — pick per the freshness-versus-completeness need.
- Window unbounded streams (tumbling = non-overlapping buckets, sliding = overlapping moving averages) and key them by event-time, using watermarks to decide when a window is complete enough to fire.
- Exactly-once means exactly-once effect, achieved with distributed checkpoints plus idempotent or transactional sinks on top of at-least-once delivery — never exactly-once delivery over the wire.

## code.sql

```sql
-- Event-time tumbling-window aggregate in streaming SQL (Flink/ksqlDB dialect).
-- Windows key on the event's OWN timestamp, not arrival time, and the engine's
-- watermark decides when each 5-minute window is complete enough to emit.

-- Declare the source with an event-time column and a watermark:
-- "an event may be up to 30 seconds late" -> watermark = max(event_time) - 30s.
CREATE TABLE orders_stream (
  order_id    STRING,
  region      STRING,
  amount      DECIMAL(10, 2),
  event_time  TIMESTAMP(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '30' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'orders', 'format' = 'json');

-- Tumbling 5-minute count + revenue per region, bucketed by EVENT time.
-- A late order (arrives at 09:07 but happened at 09:02) still lands in the
-- 09:00-09:05 window because TUMBLE reads event_time, and the window only
-- fires once the watermark passes its end -- tolerating bounded lateness.
SELECT
  region,
  window_start,
  window_end,
  COUNT(*)      AS order_count,
  SUM(amount)   AS revenue
FROM TABLE(
  TUMBLE(TABLE orders_stream, DESCRIPTOR(event_time), INTERVAL '5' MINUTE)
)
GROUP BY region, window_start, window_end;
```

## code.python

```python
"""Event-time tumbling windows with a watermark, from scratch.

Shows the core of a streaming aggregate: assign each event to its event-time
bucket, advance a watermark (max event-time minus allowed lateness), fire a
window once the watermark clears its end, and route too-late events to a side
output instead of silently misfiling them. Deterministic given the input list.
"""
from collections import defaultdict

WINDOW_SEC = 300          # 5-minute tumbling windows
ALLOWED_LATENESS = 30     # wait this long past a window end before dropping


def window_start(event_ts):
    # Floor the event-time to its tumbling-window bucket.
    return (event_ts // WINDOW_SEC) * WINDOW_SEC


def process(stream):
    # stream: iterable of (event_time, region, amount), possibly out of order.
    open_windows = defaultdict(lambda: {"count": 0, "revenue": 0.0})
    watermark = float("-inf")
    fired, late = [], []

    for event_ts, region, amount in stream:
        # The watermark is the completeness promise: max seen minus slack.
        watermark = max(watermark, event_ts - ALLOWED_LATENESS)

        ws = window_start(event_ts)
        # Event is later than the watermark allows -> side output, don't misfile.
        if ws + WINDOW_SEC + ALLOWED_LATENESS <= watermark:
            late.append((event_ts, region, amount))
            continue

        agg = open_windows[(region, ws)]
        agg["count"] += 1
        agg["revenue"] += amount

        # Fire and evict every window the watermark has now passed.
        for (r, w), a in list(open_windows.items()):
            if w + WINDOW_SEC <= watermark:
                fired.append({"region": r, "window_start": w,
                              "window_end": w + WINDOW_SEC, **a})
                del open_windows[(r, w)]

    # Flush any windows still open at end of stream (bounded input -> complete).
    for (r, w), a in open_windows.items():
        fired.append({"region": r, "window_start": w,
                      "window_end": w + WINDOW_SEC, **a})

    return {"fired": fired, "late": late}
```
