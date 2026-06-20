#!/usr/bin/env node
// Build WAVE 34Q: design-underground-system + design-parking-system
// Appends two RICH_CONTENT entries to src/content/problemContent.js using SAFE replace (function form).

import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve("src/content/problemContent.js");

function makeLcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

// ============================================================
// PROBLEM 1: design-underground-system (LC 1396)
//   Constructor + checkIn(id, stationName, t) + checkOut(id, stationName, t)
//   + getAverageTime(startStation, endStation) -> integer truncated avg
//
// For Judge0-friendly grading the registry serializes runs as:
//   ops:  List[str]  -- one of "UndergroundSystem", "checkIn", "checkOut", "getAverageTime"
//   args: List[List[int]] -- ints only. Station names are encoded as integer ids.
//         "UndergroundSystem" -> []
//         "checkIn"           -> [id, station, t]
//         "checkOut"          -> [id, station, t]
//         "getAverageTime"    -> [startStation, endStation]
// The driver returns a List[int]; void ops emit -1, getAverageTime emits the
// integer-truncated average travel time (matches LC's floor of total/count for
// inputs whose averages happen to be integers). All hand-curated test cases
// here are constructed so averages are exact integers (no truncation surprise).
// ============================================================
function buildProblem1() {
  const lcg = makeLcg(0xA10F350A);

  // Reference impl mirroring the spec.
  function runOps(ops, args) {
    const out = [];
    let checkIns = null;        // id -> [station, t]
    let totals = null;          // key "a|b" -> [sumTime, count]
    const keyOf = (a, b) => a + "|" + b;
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const a = args[i];
      if (op === "UndergroundSystem") {
        checkIns = new Map();
        totals = new Map();
        out.push(-1);
      } else if (op === "checkIn") {
        const [id, st, t] = a;
        checkIns.set(id, [st, t]);
        out.push(-1);
      } else if (op === "checkOut") {
        const [id, st, t] = a;
        const [sIn, tIn] = checkIns.get(id);
        checkIns.delete(id);
        const k = keyOf(sIn, st);
        const cur = totals.get(k) || [0, 0];
        cur[0] += (t - tIn);
        cur[1] += 1;
        totals.set(k, cur);
        out.push(-1);
      } else if (op === "getAverageTime") {
        const [sa, sb] = a;
        const cur = totals.get(keyOf(sa, sb)) || [0, 0];
        if (cur[1] === 0) {
          out.push(0);
        } else {
          out.push(Math.floor(cur[0] / cur[1]));
        }
      }
    }
    return out;
  }

  const cases = [];

  // Canonical LC sample (stations encoded: Leyton=1, Paradise=2, Cambridge=3,
  // Waterloo=4)
  // checkIn(45, Leyton, 3)
  // checkIn(32, Paradise, 8)
  // checkIn(27, Leyton, 10)
  // checkOut(45, Waterloo, 15)        -> Leyton->Waterloo 12
  // checkOut(27, Waterloo, 20)        -> Leyton->Waterloo 10
  // checkOut(32, Cambridge, 22)       -> Paradise->Cambridge 14
  // getAverageTime(Paradise, Cambridge) -> 14
  // getAverageTime(Leyton, Waterloo)    -> 11
  // checkIn(10, Leyton, 24)
  // getAverageTime(Leyton, Waterloo)    -> 11
  // checkOut(10, Waterloo, 38)          -> 14
  // getAverageTime(Leyton, Waterloo)    -> 12
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkIn", "checkIn",
      "checkOut", "checkOut", "checkOut",
      "getAverageTime", "getAverageTime",
      "checkIn",
      "getAverageTime",
      "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [45, 1, 3], [32, 2, 8], [27, 1, 10],
      [45, 4, 15], [27, 4, 20], [32, 3, 22],
      [2, 3], [1, 4],
      [10, 1, 24],
      [1, 4],
      [10, 4, 38],
      [1, 4]
    ]
  });

  // Single trip — avg equals that single trip
  cases.push({
    ops: ["UndergroundSystem", "checkIn", "checkOut", "getAverageTime"],
    args: [[], [1, 5, 0], [1, 6, 10], [5, 6]]
  });

  // Two identical trips — avg equals trip length
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 5, 0], [1, 6, 10],
      [2, 5, 100], [2, 6, 110],
      [5, 6]
    ]
  });

  // Two trips averaged: (10 + 20) / 2 = 15
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 5, 0], [1, 6, 10],
      [2, 5, 50], [2, 6, 70],
      [5, 6]
    ]
  });

  // No trips between requested pair -> 0
  cases.push({
    ops: ["UndergroundSystem", "getAverageTime"],
    args: [[], [1, 2]]
  });

  // Trip in opposite direction does not count
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 6, 0], [1, 5, 10],
      [5, 6]
    ]
  });

  // Reuse passenger id across trips
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [7, 1, 0], [7, 2, 10],
      [7, 1, 50], [7, 2, 60],
      [1, 2]
    ]
  });

  // Multiple routes coexist
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime", "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 5],
      [2, 1, 0], [2, 2, 15],
      [3, 3, 0], [3, 4, 20],
      [1, 2], [3, 4]
    ]
  });

  // Same passenger uses different start station after each checkout
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime", "getAverageTime"
    ],
    args: [
      [],
      [9, 1, 0], [9, 2, 4],
      [9, 3, 100], [9, 4, 110],
      [1, 2], [3, 4]
    ]
  });

  // getAverageTime called before any checkout for that route
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 5, 0],
      [5, 6]
    ]
  });

  // Many passengers same route, sum divides evenly
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 4],
      [2, 1, 10], [2, 2, 18],
      [3, 1, 20], [3, 2, 32],
      [4, 1, 30], [4, 2, 46],
      [1, 2]
    ]
  });

  // Bigger time gaps, exact integer average (24/4 = 6)
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 7, 0], [1, 8, 3],
      [2, 7, 0], [2, 8, 5],
      [3, 7, 0], [3, 8, 7],
      [4, 7, 0], [4, 8, 9],
      [7, 8]
    ]
  });

  // Different stations, getAverageTime queries each
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime", "getAverageTime", "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 4],
      [2, 2, 10], [2, 3, 14],
      [3, 3, 20], [3, 1, 30],
      [1, 2], [2, 3], [3, 1]
    ]
  });

  // Stress: 5 trips on the same route with average exactly 10
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 6],
      [2, 1, 100], [2, 2, 108],
      [3, 1, 200], [3, 2, 210],
      [4, 1, 300], [4, 2, 312],
      [5, 1, 400], [5, 2, 414],
      [1, 2]
    ]
  });

  // Two passengers interleaved
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkIn",
      "checkOut", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 5, 0], [2, 5, 1],
      [1, 6, 10], [2, 6, 12],
      [5, 6]
    ]
  });

  // A passenger checks in twice (after checkout) on a different start station
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime", "getAverageTime"
    ],
    args: [
      [],
      [99, 3, 0], [99, 4, 7],
      [99, 5, 20], [99, 6, 24],
      [3, 4], [5, 6]
    ]
  });

  // Stations encoded with larger ints
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 1000, 0], [1, 2000, 5],
      [2, 1000, 10], [2, 2000, 15],
      [1000, 2000]
    ]
  });

  // Long timeline, ascending times
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [10, 1, 1000], [10, 2, 1010],
      [11, 1, 2000], [11, 2, 2020],
      [12, 1, 3000], [12, 2, 3030],
      [1, 2]
    ]
  });

  // Empty pair, then trip, then query (default 0)
  cases.push({
    ops: [
      "UndergroundSystem",
      "getAverageTime",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 2],
      [1, 1, 0], [1, 2, 8],
      [1, 2]
    ]
  });

  // Three identical-length trips on two routes
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime", "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 5],
      [2, 1, 10], [2, 2, 15],
      [3, 3, 0], [3, 4, 9],
      [1, 2], [3, 4]
    ]
  });

  // Average across uneven counts (route A has 1, route B has 3)
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime", "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 12],
      [2, 3, 0], [2, 4, 4],
      [3, 3, 0], [3, 4, 6],
      [4, 3, 0], [4, 4, 8],
      [1, 2], [3, 4]
    ]
  });

  // Many id reuses; only the most recent checkin counts for matching checkout
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 5, 0], [1, 6, 10],
      [1, 5, 20], [1, 6, 30],
      [1, 5, 40], [1, 6, 50],
      [5, 6]
    ]
  });

  // Trip with t=0 starting at boundary
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 1],
      [1, 2]
    ]
  });

  // Mixed routes, query each
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "checkIn", "checkOut",
      "getAverageTime", "getAverageTime", "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 4],
      [2, 1, 10], [2, 2, 16],
      [3, 2, 20], [3, 3, 8],
      [4, 2, 50], [4, 3, 60],
      [1, 2], [2, 3], [3, 1]
    ]
  });

  // Large time gap between checkin and checkout
  cases.push({
    ops: [
      "UndergroundSystem",
      "checkIn", "checkOut",
      "getAverageTime"
    ],
    args: [
      [],
      [1, 1, 0], [1, 2, 1000],
      [1, 2]
    ]
  });

  // Random LCG-generated scenarios that still yield exact integer averages.
  while (cases.length < 28) {
    const numTrips = 2 + (lcg() % 4);
    const ops = ["UndergroundSystem"];
    const args = [[]];
    const a = 1 + (lcg() % 3);
    const b = 4 + (lcg() % 3);
    let totalTime = 0;
    // pick uniform trip times that sum evenly
    const tripLen = 2 + (lcg() % 8);
    let curT = 0;
    for (let i = 0; i < numTrips; i++) {
      ops.push("checkIn");
      args.push([i + 1, a, curT]);
      ops.push("checkOut");
      args.push([i + 1, b, curT + tripLen]);
      totalTime += tripLen;
      curT += tripLen + 5;
    }
    ops.push("getAverageTime");
    args.push([a, b]);
    cases.push({ ops, args });
  }

  const test_cases = cases.map(({ ops, args }) => ({
    inputs: [JSON.stringify(ops), JSON.stringify(args)],
    expected: JSON.stringify(runOps(ops, args))
  }));

  return {
    slug: "design-underground-system",
    obj: {
      description: "Design a system that tracks customer check-ins and check-outs at metro stations across a city, then reports average travel time between any pair of stations.\n\nImplement the `UndergroundSystem` class:\n- `void checkIn(int id, string stationName, int t)` — a customer with id `id` checks IN at `stationName` at time `t`. A customer can only be checked in at one station at a time.\n- `void checkOut(int id, string stationName, int t)` — a customer with id `id` checks OUT from `stationName` at time `t`. Time `t` is always strictly greater than the matching check-in time.\n- `int getAverageTime(string startStation, string endStation)` — return the average time it takes a customer to travel from `startStation` to `endStation`. The reported value is the **integer floor** of `totalTravelTime / numberOfTrips`. The pair (`startStation`, `endStation`) is **ordered** — a trip from A to B does NOT count toward the average for B to A.\n\nFor automated grading the registry serializes a session of operations:\n\n```\nops:  List[str]   one of \"UndergroundSystem\", \"checkIn\", \"checkOut\", \"getAverageTime\"\nargs: List[List[int]]\n    UndergroundSystem -> []\n    checkIn           -> [id, station, t]\n    checkOut          -> [id, station, t]\n    getAverageTime    -> [startStation, endStation]\n```\n\nStation names are encoded as integer ids (Leyton -> 1, Paradise -> 2, Cambridge -> 3, Waterloo -> 4, etc.). The driver returns a `List[int]` of per-op results: void operations emit `-1` and `getAverageTime` emits the floored average.\n\n**This is LeetCode 1396.** All curated test cases construct trip sums that divide evenly so the floored answer matches the true average exactly.",
      method_name: "runOps",
      params: [
        { name: "ops", type: "List[str]" },
        { name: "args", type: "List[List[int]]" }
      ],
      return_type: "List[int]",
      tags: ["design", "hash-table"],
      pattern: "**Two hash maps: in-flight customers + per-route totals.** The lifecycle of each trip has exactly two events (`checkIn` then `checkOut`) and they are separated by an arbitrary number of unrelated events. So we need a place to park the in-flight info between the two halves of one trip, and a place to accumulate route-level statistics.\n\n**Data structures.**\n1. `checkIns: Map<id, (station, time)>` — records every customer who is currently riding. Inserted on `checkIn`, removed on `checkOut`.\n2. `totals: Map<(startStation, endStation), (sumTime, count)>` — accumulates total travel time and trip count per ordered route. Each completed `checkOut` does exactly one `(sumTime += t - t_in, count += 1)`.\n\n**Operation costs.** `checkIn` is `O(1)` (one map insert). `checkOut` is `O(1)` (one map lookup + delete + one map upsert). `getAverageTime` is `O(1)` (one map lookup + integer division). All three meet the spec's implicit constant-time bar.\n\n**Why we DON'T store every trip.** A naive design might keep a `List<(routeKey, duration)>` and recompute the average per query. That is `O(N)` per query — slow when queries are frequent. By incrementally maintaining `(sumTime, count)`, the running average is `sumTime / count` in `O(1)`.\n\n**Ordering matters.** The route key is the ordered pair `(start, end)`. Trips from A to B and from B to A live in independent buckets.\n\n**Edge cases.** Query before any matching trip: spec is undefined; this registry returns `0`. Same id reused for multiple sequential trips: `checkIn` overwrites the previous in-flight record only after the prior `checkOut` ran, so behavior is well-defined. Identical pickup and drop-off station (loop trip): the route `(A, A)` is a legitimate key.\n\n**Brute-force comparison.** Store every completed trip in a flat list of `(start, end, duration)`. On each query, scan the entire list. `O(N)` per query, `O(N)` total trips. Functionally correct, but unacceptable when queries are interleaved with millions of trips.",
      follow_up: "**Variant 1 — median, not mean.** Maintain a sorted multiset per route (or two heaps for streaming median). Updates become `O(log N)` per checkout. Query is `O(1)` for top-of-heap.\n\n**Variant 2 — percentile / quantile queries.** Same heap / order-statistic structure as median. For arbitrary quantile, an order-statistic tree (balanced BST with subtree counts) gives `O(log N)` per query.\n\n**Variant 3 — sliding-window average over the last K trips.** Keep a deque per route. On checkout, push; if deque exceeds K, evict oldest and decrement sum. Still `O(1)` amortized per op.\n\n**Variant 4 — time-windowed average (last T seconds).** Same idea but evict from the deque based on timestamp, not count. Each event triggers an eviction loop over already-expired entries; total amortized `O(1)`.\n\n**Variant 5 — multi-leg trips.** A customer may transfer between trains, so the system should report total elapsed time from origin to final destination across multiple checkin/checkout pairs. The natural extension is to keep `checkIns[id] = (originalStartStation, originalCheckInTime)` only when not currently mid-trip; on checkout, the pair is `(originalStartStation, currentEndStation)`.\n\n**Variant 6 — distributed / sharded.** Partition trips by a hash of the route key. The `totals` map is partitioned, the `checkIns` map is partitioned by id. Aggregation is per-shard and trivially parallel.\n\n**Implementation pitfalls.**\n1. Treating the route key as unordered — averages get conflated between A->B and B->A. Bug.\n2. Storing the running average as a float and updating it as `(avg * count + new) / (count + 1)` — accumulates floating-point error after many updates. Always store `(sumTime, count)` as integers and divide on demand.\n3. Forgetting to remove the customer from `checkIns` on checkout — the next `checkIn` will overwrite, so the map grows monotonically (memory leak) but the logic stays correct. Still fix it.\n4. Using `string` station names directly without hashing — Java's `HashMap<String, ...>` is fine; just don't accidentally compare with `==`.",
      complexity: {
        time: "**`checkIn` is O(1), `checkOut` is O(1), `getAverageTime` is O(1).** Each operation does a constant number of hash-map insertions, deletions, or lookups, plus one integer division for the average query. Across a session of `M` operations the total work is `O(M)`.",
        space: "**O(P + R)** where `P` is the peak number of in-flight customers (size of the `checkIns` map at its maximum) and `R` is the number of distinct ordered route pairs ever observed. Each `checkIns` entry holds an `(id -> (station, time))` triple; each `totals` entry holds a `(routeKey -> (sumTime, count))` pair.",
        notes: "All three operations beat the implicit O(1) bar because totals are maintained incrementally on `checkOut`. The map is on the path of every operation, so a high-quality hash function on the (start, end) route key is the only constant-factor knob worth tuning.",
        optimal: "**O(1) per operation is optimal.** The system must process every event in at least constant time to acknowledge it, so the per-op cost cannot be reduced further. Total space is bounded below by the number of in-flight customers and distinct ordered routes, both of which the data structure must remember to answer subsequent queries — so `O(P + R)` is the lower bound."
      },
      constraints: [
        "1 <= id, t <= 10^6",
        "1 <= stationName, startStation, endStation (encoded as integer ids)",
        "1 <= ops.length <= 2 * 10^4",
        "args[i] matches the signature of ops[i]",
        "At most 2 * 10^4 calls total to checkIn, checkOut, and getAverageTime",
        "Every checkOut has a matching prior checkIn with strictly greater time t",
        "Curated test cases construct sums that divide evenly so floor(total/count) equals the true average"
      ],
      hints: [
        "**Maintain two maps.** `checkIns[id] = (station, time)` holds the in-flight customers. `totals[(start, end)] = (sumTime, count)` holds the per-route running aggregate.",
        "**On checkOut, retire the in-flight entry and update the route aggregate in O(1).** No need to remember individual trips.",
        "**Keys are ordered pairs.** A trip from A to B is in a different bucket than a trip from B to A. Encode the key as a tuple, struct, or `start * BASE + end` integer.",
        "**Never store the running average as a float.** Keep `(sumTime, count)` as integers; divide on demand. Floats accumulate error across many updates.",
        "**The id is reused.** After a checkOut, the same id may appear in a new checkIn. As long as the in-flight entry is removed promptly, the logic stays correct."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\nclass UndergroundSystem:\n    def __init__(self):\n        self._in = {}\n        self._totals = {}\n\n    def checkIn(self, id: int, stationName: int, t: int) -> None:\n        self._in[id] = (stationName, t)\n\n    def checkOut(self, id: int, stationName: int, t: int) -> None:\n        start, t_in = self._in.pop(id)\n        key = (start, stationName)\n        s, c = self._totals.get(key, (0, 0))\n        self._totals[key] = (s + (t - t_in), c + 1)\n\n    def getAverageTime(self, startStation: int, endStation: int) -> int:\n        s, c = self._totals.get((startStation, endStation), (0, 0))\n        if c == 0:\n            return 0\n        return s // c\n\n\nclass Solution:\n    def runOps(self, ops: List[str], args: List[List[int]]) -> List[int]:\n        out = []\n        sys = None\n        for op, a in zip(ops, args):\n            if op == \"UndergroundSystem\":\n                sys = UndergroundSystem()\n                out.append(-1)\n            elif op == \"checkIn\":\n                sys.checkIn(a[0], a[1], a[2])\n                out.append(-1)\n            elif op == \"checkOut\":\n                sys.checkOut(a[0], a[1], a[2])\n                out.append(-1)\n            elif op == \"getAverageTime\":\n                out.append(sys.getAverageTime(a[0], a[1]))\n        return out\n",
        javascript: "class UndergroundSystem {\n    constructor() {\n        this.inFlight = new Map();\n        this.totals = new Map();\n    }\n    _key(a, b) { return a + \"|\" + b; }\n    checkIn(id, stationName, t) {\n        this.inFlight.set(id, [stationName, t]);\n    }\n    checkOut(id, stationName, t) {\n        const [start, tIn] = this.inFlight.get(id);\n        this.inFlight.delete(id);\n        const k = this._key(start, stationName);\n        const cur = this.totals.get(k) || [0, 0];\n        cur[0] += (t - tIn);\n        cur[1] += 1;\n        this.totals.set(k, cur);\n    }\n    getAverageTime(startStation, endStation) {\n        const cur = this.totals.get(this._key(startStation, endStation)) || [0, 0];\n        if (cur[1] === 0) return 0;\n        return Math.floor(cur[0] / cur[1]);\n    }\n}\n\nvar runOps = function(ops, args) {\n    const out = [];\n    let sys = null;\n    for (let i = 0; i < ops.length; i++) {\n        const op = ops[i];\n        const a = args[i];\n        if (op === \"UndergroundSystem\") {\n            sys = new UndergroundSystem();\n            out.push(-1);\n        } else if (op === \"checkIn\") {\n            sys.checkIn(a[0], a[1], a[2]);\n            out.push(-1);\n        } else if (op === \"checkOut\") {\n            sys.checkOut(a[0], a[1], a[2]);\n            out.push(-1);\n        } else if (op === \"getAverageTime\") {\n            out.push(sys.getAverageTime(a[0], a[1]));\n        }\n    }\n    return out;\n};\n",
        java: "import java.util.*;\n\nclass UndergroundSystem {\n    private final Map<Integer, long[]> inFlight = new HashMap<>();\n    private final Map<Long, long[]> totals = new HashMap<>();\n    private long keyOf(int a, int b) { return ((long) a) * 2_000_003L + b; }\n    public void checkIn(int id, int stationName, int t) {\n        inFlight.put(id, new long[]{stationName, t});\n    }\n    public void checkOut(int id, int stationName, int t) {\n        long[] start = inFlight.remove(id);\n        long k = keyOf((int) start[0], stationName);\n        long[] cur = totals.getOrDefault(k, new long[]{0L, 0L});\n        cur[0] += (t - start[1]);\n        cur[1] += 1;\n        totals.put(k, cur);\n    }\n    public int getAverageTime(int startStation, int endStation) {\n        long[] cur = totals.get(keyOf(startStation, endStation));\n        if (cur == null || cur[1] == 0) return 0;\n        return (int) (cur[0] / cur[1]);\n    }\n}\n\npublic class Solution {\n    public List<Integer> runOps(List<String> ops, List<List<Integer>> args) {\n        List<Integer> out = new ArrayList<>();\n        UndergroundSystem sys = null;\n        for (int i = 0; i < ops.size(); i++) {\n            String op = ops.get(i);\n            List<Integer> a = args.get(i);\n            switch (op) {\n                case \"UndergroundSystem\":\n                    sys = new UndergroundSystem();\n                    out.add(-1);\n                    break;\n                case \"checkIn\":\n                    sys.checkIn(a.get(0), a.get(1), a.get(2));\n                    out.add(-1);\n                    break;\n                case \"checkOut\":\n                    sys.checkOut(a.get(0), a.get(1), a.get(2));\n                    out.add(-1);\n                    break;\n                case \"getAverageTime\":\n                    out.add(sys.getAverageTime(a.get(0), a.get(1)));\n                    break;\n            }\n        }\n        return out;\n    }\n}\n",
        cpp: "#include <vector>\n#include <string>\n#include <unordered_map>\nusing namespace std;\n\nclass UndergroundSystem {\n    unordered_map<int, pair<int,int>> inFlight;\n    unordered_map<long long, pair<long long, long long>> totals;\n    static long long keyOf(int a, int b) { return (long long)a * 2000003LL + b; }\npublic:\n    void checkIn(int id, int stationName, int t) {\n        inFlight[id] = {stationName, t};\n    }\n    void checkOut(int id, int stationName, int t) {\n        auto it = inFlight.find(id);\n        int start = it->second.first;\n        int tIn = it->second.second;\n        inFlight.erase(it);\n        long long k = keyOf(start, stationName);\n        auto& cur = totals[k];\n        cur.first += (t - tIn);\n        cur.second += 1;\n    }\n    int getAverageTime(int startStation, int endStation) {\n        auto it = totals.find(keyOf(startStation, endStation));\n        if (it == totals.end() || it->second.second == 0) return 0;\n        return (int)(it->second.first / it->second.second);\n    }\n};\n\nclass Solution {\npublic:\n    vector<int> runOps(vector<string>& ops, vector<vector<int>>& args) {\n        vector<int> out;\n        UndergroundSystem* sys = nullptr;\n        for (size_t i = 0; i < ops.size(); i++) {\n            const string& op = ops[i];\n            const vector<int>& a = args[i];\n            if (op == \"UndergroundSystem\") {\n                if (sys) delete sys;\n                sys = new UndergroundSystem();\n                out.push_back(-1);\n            } else if (op == \"checkIn\") {\n                sys->checkIn(a[0], a[1], a[2]);\n                out.push_back(-1);\n            } else if (op == \"checkOut\") {\n                sys->checkOut(a[0], a[1], a[2]);\n                out.push_back(-1);\n            } else if (op == \"getAverageTime\") {\n                out.push_back(sys->getAverageTime(a[0], a[1]));\n            }\n        }\n        if (sys) delete sys;\n        return out;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// PROBLEM 2: design-parking-system (LC 1603)
//   Constructor takes [big, medium, small] capacities; addCar(carType) returns
//   true (1) if a slot of that type was available and decrements that
//   capacity, else returns false (0).
//
//   ops:  List[str]  -- "ParkingSystem" or "addCar"
//   args: List[List[int]]
//         "ParkingSystem" -> [big, medium, small]
//         "addCar"        -> [carType]    (carType in {1,2,3})
//   The driver returns List[int]: ParkingSystem emits -1; addCar emits 1 or 0.
// ============================================================
function buildProblem2() {
  const lcg = makeLcg(0xA10F350B);

  function runOps(ops, args) {
    const out = [];
    let cap = null; // cap[1]=big, cap[2]=medium, cap[3]=small
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const a = args[i];
      if (op === "ParkingSystem") {
        cap = [0, a[0], a[1], a[2]];
        out.push(-1);
      } else if (op === "addCar") {
        const t = a[0];
        if (cap[t] > 0) {
          cap[t] -= 1;
          out.push(1);
        } else {
          out.push(0);
        }
      }
    }
    return out;
  }

  const cases = [];

  // Canonical LC sample: ParkingSystem(1,1,0), addCar(1)->1, addCar(2)->1,
  // addCar(3)->0, addCar(1)->0
  cases.push({
    ops: ["ParkingSystem", "addCar", "addCar", "addCar", "addCar"],
    args: [[1, 1, 0], [1], [2], [3], [1]]
  });

  // All zero capacities -> every addCar returns 0
  cases.push({
    ops: ["ParkingSystem", "addCar", "addCar", "addCar"],
    args: [[0, 0, 0], [1], [2], [3]]
  });

  // Only big spots
  cases.push({
    ops: ["ParkingSystem", "addCar", "addCar", "addCar", "addCar"],
    args: [[3, 0, 0], [1], [1], [1], [1]]
  });

  // Only medium spots
  cases.push({
    ops: ["ParkingSystem", "addCar", "addCar", "addCar"],
    args: [[0, 2, 0], [2], [2], [2]]
  });

  // Only small spots
  cases.push({
    ops: ["ParkingSystem", "addCar", "addCar", "addCar"],
    args: [[0, 0, 2], [3], [3], [3]]
  });

  // Asymmetric: small overflow attempts on a full big lot
  cases.push({
    ops: ["ParkingSystem", "addCar", "addCar", "addCar", "addCar", "addCar"],
    args: [[2, 1, 0], [1], [1], [1], [2], [3]]
  });

  // Interleaved adds
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar",
      "addCar", "addCar", "addCar"
    ],
    args: [
      [2, 2, 2],
      [1], [2], [3],
      [1], [2], [3]
    ]
  });

  // Tries to overflow every bucket
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar", "addCar", "addCar", "addCar"
    ],
    args: [
      [1, 1, 1],
      [1], [2], [3],
      [1], [2], [3]
    ]
  });

  // Big lot only, lots of cars
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar", "addCar", "addCar"
    ],
    args: [
      [4, 0, 0],
      [1], [1], [1], [1], [1]
    ]
  });

  // No queries (only construction)
  cases.push({
    ops: ["ParkingSystem"],
    args: [[5, 5, 5]]
  });

  // Single car each type then nothing
  cases.push({
    ops: ["ParkingSystem", "addCar", "addCar", "addCar"],
    args: [[1, 1, 1], [1], [2], [3]]
  });

  // Park all small cars first, then everyone
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar",
      "addCar", "addCar"
    ],
    args: [
      [1, 1, 3],
      [3], [3], [3],
      [3], [3]
    ]
  });

  // Mixed order: big big medium medium small small overflow
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar",
      "addCar", "addCar",
      "addCar", "addCar"
    ],
    args: [
      [2, 2, 2],
      [1], [1],
      [2], [2],
      [3], [3]
    ]
  });

  // Edge: capacity 1 each and 9 attempts
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar",
      "addCar", "addCar", "addCar",
      "addCar", "addCar", "addCar"
    ],
    args: [
      [1, 1, 1],
      [1], [2], [3],
      [1], [2], [3],
      [1], [2], [3]
    ]
  });

  // Big capacity for all
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar", "addCar", "addCar"
    ],
    args: [
      [100, 100, 100],
      [1], [2], [3], [1], [2]
    ]
  });

  // Specific drain pattern: small slot drains first then medium
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar", "addCar"
    ],
    args: [
      [2, 1, 0],
      [3], [2], [2], [1]
    ]
  });

  // Drains all bigs then questions medium
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar", "addCar"
    ],
    args: [
      [2, 0, 0],
      [1], [1], [1], [2]
    ]
  });

  // 7 cars with mixed types
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar",
      "addCar", "addCar", "addCar", "addCar"
    ],
    args: [
      [2, 2, 2],
      [3], [3], [3],
      [2], [2], [2], [1]
    ]
  });

  // Same large lot, sequential car-type cycling
  cases.push({
    ops: [
      "ParkingSystem",
      "addCar", "addCar", "addCar",
      "addCar", "addCar", "addCar",
      "addCar", "addCar", "addCar"
    ],
    args: [
      [3, 3, 3],
      [1], [2], [3],
      [1], [2], [3],
      [1], [2], [3]
    ]
  });

  // Random LCG-generated stress
  while (cases.length < 28) {
    const big = lcg() % 5;
    const med = lcg() % 5;
    const sm = lcg() % 5;
    const n = 4 + (lcg() % 8);
    const ops = ["ParkingSystem"];
    const args = [[big, med, sm]];
    for (let i = 0; i < n; i++) {
      ops.push("addCar");
      args.push([1 + (lcg() % 3)]);
    }
    cases.push({ ops, args });
  }

  const test_cases = cases.map(({ ops, args }) => ({
    inputs: [JSON.stringify(ops), JSON.stringify(args)],
    expected: JSON.stringify(runOps(ops, args))
  }));

  return {
    slug: "design-parking-system",
    obj: {
      description: "Design a parking system for a parking lot. The lot has three types of parking spaces: big, medium, and small, with a fixed number of slots of each type.\n\nImplement the `ParkingSystem` class:\n- `ParkingSystem(int big, int medium, int small)` — initializes the lot with the given capacities.\n- `bool addCar(int carType)` — checks whether there is a parking space available for a car of the given type. `carType` is `1` for big, `2` for medium, `3` for small. A car can only park in a space of its **own** type. If a slot is available, the method parks the car (decrementing that capacity) and returns `true`; otherwise it returns `false` without parking.\n\nExample:\n\n```\nInput:  ParkingSystem(1, 1, 0)\n        addCar(1) -> true   (parks in the only big slot)\n        addCar(2) -> true   (parks in the only medium slot)\n        addCar(3) -> false  (no small slots)\n        addCar(1) -> false  (big lot full)\n```\n\nFor automated grading the registry serializes a session of operations:\n\n```\nops:  List[str]   one of \"ParkingSystem\", \"addCar\"\nargs: List[List[int]]\n    ParkingSystem -> [big, medium, small]\n    addCar        -> [carType]    (carType in {1, 2, 3})\n```\n\nThe driver returns a `List[int]`: the constructor op emits `-1`, and each `addCar` emits `1` (success) or `0` (no slot).\n\n**This is LeetCode 1603.** The canonical solution stores three counters (one per car type) and decrements on success.",
      method_name: "runOps",
      params: [
        { name: "ops", type: "List[str]" },
        { name: "args", type: "List[List[int]]" }
      ],
      return_type: "List[int]",
      tags: ["design", "simulation", "counter"],
      pattern: "**Three independent counters — one per car type.** The lot decomposes cleanly into three sub-lots because cars cannot cross types. So the entire data structure is a length-3 array `cap[carType] = remainingSlots`, and `addCar` is a single decrement-if-positive.\n\n**`addCar(carType)` in one line.** `if cap[carType] > 0: cap[carType] -= 1; return true else return false`. That is the whole algorithm. There is no queue, no allocation order, no spatial bookkeeping — the spec doesn't ask which slot the car got, only whether one was available.\n\n**Why this is `O(1)`.** Indexing `cap` by `carType` is `O(1)`. The decrement is `O(1)`. There is no scan over slots.\n\n**Edge cases.** Constructor called with `0` for some capacity: every `addCar` for that type immediately returns `false`. Repeated `addCar` of the same type drains the bucket; subsequent calls return `false`. Constructor never re-called in normal usage; this registry's driver tolerates it (resets state).\n\n**Brute-force comparison.** Naively allocate `Lot` objects: `Lot[big]`, `Lot[medium]`, `Lot[small]`, each with an `occupied: boolean` field; on `addCar(t)` scan the type's list for an empty slot, mark it, return true. Functionally identical (`O(slots)` per call instead of `O(1)`), but unnecessary because we don't need slot identity.\n\n**Why arrays beat enums.** Using a length-4 array (with index 0 unused) lets `cap[carType]` be a direct lookup. `Map<Integer, Integer>` is unnecessarily heavy for a 3-key domain; a Java `EnumMap` is also slower than an array.",
      follow_up: "**Variant 1 — return the slot id, not just success.** Track a `nextSlotId[type]` counter alongside `cap[type]` and emit the next id on success. Requires the lot to remember which slot ids have been freed if cars can leave (see Variant 3).\n\n**Variant 2 — multiple car-type domains.** Generalize from 3 types to `K` types — the data structure is still a length-`K` array; `addCar(t)` is still `O(1)`.\n\n**Variant 3 — removeCar(carType, slotId).** Add a `removeCar` op. The natural structure is a free-list per type: a stack or queue of available slot ids. `addCar` pops; `removeCar` pushes. Both `O(1)`.\n\n**Variant 4 — overflow rule (big spots can fit any car).** Park small / medium cars in big spots only if their own bucket is empty. Hierarchy makes the implementation slightly more complex: first try the native bucket, then fall back to the next larger bucket. Still `O(1)` per op because there are only 3 buckets.\n\n**Variant 5 — pricing.** Augment `addCar` to return a pricing tier based on remaining occupancy. Easy: compute `(cap[type] - 1) / total[type]` for a tiered ratio.\n\n**Variant 6 — concurrent / thread-safe addCar.** Replace the integer counter with `AtomicInteger` (Java) or `atomic<int>` (C++). The CAS loop on decrement guarantees correctness without locks.\n\n**Implementation pitfalls.**\n1. Forgetting that `addCar` decrements only on success — if you decrement first and check second, you under-report capacity and the next caller sees the wrong state.\n2. Indexing `cap[carType]` with `carType` instead of `carType - 1` (when the array is length 3 instead of length 4). Pick one convention and stick to it.\n3. Constructor signature: `(big, medium, small)`. Don't swap them.",
      complexity: {
        time: "**O(1) per operation.** The constructor copies three integers. Each `addCar` performs one array index, one compare, and at most one decrement. There is no loop over slots.",
        space: "**O(1).** Three integers regardless of capacity. The structure does not allocate per-slot objects.",
        notes: "This is a textbook example of 'just count, don't allocate'. The system never needs to identify individual slots, so any per-slot bookkeeping is overkill.",
        optimal: "**O(1) is optimal.** Each operation must update or read state at least once; no algorithm can be faster than constant time."
      },
      constraints: [
        "0 <= big, medium, small <= 1000",
        "carType is one of 1 (big), 2 (medium), 3 (small)",
        "At most 1000 calls to addCar",
        "1 <= ops.length <= 1001",
        "args[0] is the constructor's (big, medium, small) triple",
        "args[i] for addCar contains exactly one element: the carType"
      ],
      hints: [
        "**Three counters.** Use `cap[1]`, `cap[2]`, `cap[3]` indexed by carType. The constructor initializes them.",
        "**`addCar(t)` is a one-liner.** If `cap[t] > 0`, decrement and return true; else return false. Do not decrement first and check after.",
        "**Don't model individual slots.** The spec asks whether a slot is available, not which one — counters are sufficient and cheaper than per-slot objects.",
        "**Watch the indexing.** `carType` is 1, 2, or 3. Either use a length-4 array (with index 0 unused) or store at `carType - 1` in a length-3 array.",
        "**Capacity 0 is legal.** A bucket starting at 0 means every `addCar` of that type returns false from the start."
      ],
      test_cases,
      solutions: {
        python: "from typing import List\n\nclass ParkingSystem:\n    def __init__(self, big: int, medium: int, small: int):\n        self.cap = [0, big, medium, small]\n\n    def addCar(self, carType: int) -> bool:\n        if self.cap[carType] > 0:\n            self.cap[carType] -= 1\n            return True\n        return False\n\n\nclass Solution:\n    def runOps(self, ops: List[str], args: List[List[int]]) -> List[int]:\n        out = []\n        sys = None\n        for op, a in zip(ops, args):\n            if op == \"ParkingSystem\":\n                sys = ParkingSystem(a[0], a[1], a[2])\n                out.append(-1)\n            elif op == \"addCar\":\n                out.append(1 if sys.addCar(a[0]) else 0)\n        return out\n",
        javascript: "class ParkingSystem {\n    constructor(big, medium, small) {\n        this.cap = [0, big, medium, small];\n    }\n    addCar(carType) {\n        if (this.cap[carType] > 0) {\n            this.cap[carType] -= 1;\n            return true;\n        }\n        return false;\n    }\n}\n\nvar runOps = function(ops, args) {\n    const out = [];\n    let sys = null;\n    for (let i = 0; i < ops.length; i++) {\n        const op = ops[i];\n        const a = args[i];\n        if (op === \"ParkingSystem\") {\n            sys = new ParkingSystem(a[0], a[1], a[2]);\n            out.push(-1);\n        } else if (op === \"addCar\") {\n            out.push(sys.addCar(a[0]) ? 1 : 0);\n        }\n    }\n    return out;\n};\n",
        java: "import java.util.*;\n\nclass ParkingSystem {\n    private final int[] cap = new int[4];\n    public ParkingSystem(int big, int medium, int small) {\n        cap[1] = big;\n        cap[2] = medium;\n        cap[3] = small;\n    }\n    public boolean addCar(int carType) {\n        if (cap[carType] > 0) {\n            cap[carType]--;\n            return true;\n        }\n        return false;\n    }\n}\n\npublic class Solution {\n    public List<Integer> runOps(List<String> ops, List<List<Integer>> args) {\n        List<Integer> out = new ArrayList<>();\n        ParkingSystem sys = null;\n        for (int i = 0; i < ops.size(); i++) {\n            String op = ops.get(i);\n            List<Integer> a = args.get(i);\n            if (op.equals(\"ParkingSystem\")) {\n                sys = new ParkingSystem(a.get(0), a.get(1), a.get(2));\n                out.add(-1);\n            } else if (op.equals(\"addCar\")) {\n                out.add(sys.addCar(a.get(0)) ? 1 : 0);\n            }\n        }\n        return out;\n    }\n}\n",
        cpp: "#include <vector>\n#include <string>\nusing namespace std;\n\nclass ParkingSystem {\n    int cap[4] = {0, 0, 0, 0};\npublic:\n    ParkingSystem(int big, int medium, int small) {\n        cap[1] = big;\n        cap[2] = medium;\n        cap[3] = small;\n    }\n    bool addCar(int carType) {\n        if (cap[carType] > 0) {\n            cap[carType]--;\n            return true;\n        }\n        return false;\n    }\n};\n\nclass Solution {\npublic:\n    vector<int> runOps(vector<string>& ops, vector<vector<int>>& args) {\n        vector<int> out;\n        ParkingSystem* sys = nullptr;\n        for (size_t i = 0; i < ops.size(); i++) {\n            const string& op = ops[i];\n            const vector<int>& a = args[i];\n            if (op == \"ParkingSystem\") {\n                if (sys) delete sys;\n                sys = new ParkingSystem(a[0], a[1], a[2]);\n                out.push_back(-1);\n            } else if (op == \"addCar\") {\n                out.push_back(sys->addCar(a[0]) ? 1 : 0);\n            }\n        }\n        if (sys) delete sys;\n        return out;\n    }\n};\n"
      }
    }
  };
}

// ============================================================
// Compose block and SAFE-replace into problemContent.js
// ============================================================
function buildBlock(p1, p2) {
  const j1 = JSON.stringify(p1.obj, null, 2);
  const j2 = JSON.stringify(p2.obj, null, 2);
  return [
    "",
    "// ===== WAVE 34Q START =====",
    "// === WAVE 34Q " + p1.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p1.slug) + ";",
    "  const _entry = " + j1 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34Q " + p1.slug + " END ===",
    "// === WAVE 34Q " + p2.slug + " START ===",
    ";(function(){",
    "  const _key = " + JSON.stringify(p2.slug) + ";",
    "  const _entry = " + j2 + ";",
    "  RICH_CONTENT[_key] = _entry;",
    "})();",
    "// === WAVE 34Q " + p2.slug + " END ===",
    "// ===== WAVE 34Q END =====",
    ""
  ].join("\n");
}

const p1 = buildProblem1();
const p2 = buildProblem2();

if (p1.obj.test_cases.length < 25) {
  console.error("P1 has only " + p1.obj.test_cases.length + " test cases");
  process.exit(1);
}
if (p2.obj.test_cases.length < 25) {
  console.error("P2 has only " + p2.obj.test_cases.length + " test cases");
  process.exit(1);
}

const block = buildBlock(p1, p2);

let src = fs.readFileSync(FILE, "utf8");

// guard: don't double-write
if (src.indexOf("WAVE 34Q START") !== -1) {
  console.error("WAVE 34Q already present; aborting to avoid duplicate.");
  process.exit(1);
}

// SAFE replace (function form) — anchor on the WAVE 34P END marker and append block after it.
const ANCHOR = "// ===== WAVE 34P END =====";
if (src.indexOf(ANCHOR) === -1) {
  console.error("Anchor " + ANCHOR + " not found");
  process.exit(1);
}

const next = src.replace(ANCHOR, function (m) {
  return m + "\n" + block;
});

if (next === src) {
  console.error("No-op replace; aborting");
  process.exit(1);
}

fs.writeFileSync(FILE, next);

console.log("DONE wave34q " + p1.slug + " + " + p2.slug);
process.exit(0);
