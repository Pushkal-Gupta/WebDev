---
slug: hot-warm-cold-storage
module: sd-storage
title: Hot / Warm / Cold Tiered Storage
subtitle: Match each byte's price to its access frequency — sub-ms SSD for the hot path, cheap HDD for the warm shelf, Glacier for the archive nobody reads.
difficulty: Intermediate
position: 72
estimatedReadMinutes: 8
prereqs: []
relatedProblems: []
references:
  - title: "AWS — Understanding and managing Amazon S3 storage classes"
    url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html"
    type: book
  - title: "AWS — Managing the lifecycle of objects (S3 Lifecycle)"
    url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html"
    type: book
  - title: "Wikipedia — Hierarchical Storage Management"
    url: "https://en.wikipedia.org/wiki/Hierarchical_storage_management"
    type: blog
status: published
---

## intro
Not every byte deserves the same hardware. A user's last-week chat history must come back in milliseconds; a five-year-old audit log can take hours. Tiered storage spreads data across three or more layers — hot (NVMe / SSD, sub-millisecond reads), warm (HDD or S3 Standard-IA, seconds), cold (S3 Glacier / tape, minutes to hours) — and uses lifecycle rules to move objects between them as their access temperature drops. The result is a price curve that tracks the access curve.

## whyItMatters
Storage is the single largest line item in most data-heavy systems. A petabyte of NVMe on the latest instance class is on the order of 100x the price of the same petabyte on Glacier Deep Archive. Every team that runs at scale — Netflix's video catalogue, Dropbox's user files, every SaaS log pipeline, every regulated industry that must retain seven years of records — leans on tiering to keep the bill survivable. Without it the choice is "pay SSD prices for cold bytes" or "miss the SLA on the hot ones." Tiering lets the same system do both.

## intuition
Look at any production access log and the pattern is the same: a tiny fraction of objects gets almost all of the reads, and the long tail goes untouched for weeks. Plot reads on a log-log axis and you get a power-law curve — the top 1% might account for 80% of traffic, and the bottom 50% might not be read at all in a given month. If every byte sits on the same expensive medium, you are paying NVMe prices for objects that would be fine on a tape robot. The fix is to recognise that "access temperature" is a property of an object, and to move it physically as the temperature falls.

The three classical tiers map onto three different physics-cost tradeoffs. **Hot** lives on NVMe SSD or in RAM — sub-millisecond reads, tens of dollars per GB-month, perfect for the working set. **Warm** lives on spinning HDD or S3 Standard-IA — single-digit millisecond reads, an order of magnitude cheaper, perfect for the previous month's logs that you still query occasionally. **Cold** lives on S3 Glacier, Glacier Deep Archive, or LTO tape — retrieval measured in minutes to twelve hours, two orders of magnitude cheaper, perfect for the audit shelf you legally have to keep but realistically never touch.

The trick is *automatic* movement. You do not want a human deciding when last quarter's invoices migrate to Glacier. You want a lifecycle rule: "thirty days after creation, transition to Standard-IA; ninety days after creation, transition to Glacier; seven years after creation, delete." The storage system runs the rule and rewrites the object's storage class behind the scenes. Reads from cold tiers either fail or trigger a restore-and-wait — both are acceptable for genuinely cold data.

## visualization
```
Access frequency  ───►  Tier ────────►  Latency      Cost / GB-month
                                                     (relative)
once a second           Hot (NVMe)      < 1 ms       100x
once an hour            Hot (SSD)         1 ms        40x
once a day              Warm (HDD)       10 ms        10x
once a week             Warm (IA)        15 ms         4x
once a month            Cold (Glacier)   1-5 min       1x
once a year             Cold (Deep)      3-12 hr     0.4x

Lifecycle policy (S3 example):
  day 0 .......... STANDARD            (hot)
  day 30 ......... STANDARD_IA          (warm)
  day 90 ......... GLACIER              (cold)
  day 365 ........ DEEP_ARCHIVE         (deep cold)
  day 2555 ....... EXPIRE / DELETE
```

## bruteForce
Keep every byte on the same tier and pay for the hottest one. This is what early monoliths did — one EBS volume class, every object on it. It works until the storage bill outpaces the revenue. Manual moves — engineers SSH-ing in to mv files to a cold bucket once a quarter — are the next failure mode: error-prone, gets skipped during incidents, and never deletes what should be deleted.

## optimal
The production answer is **policy-driven lifecycle management** on an object store that natively supports it (S3, GCS, Azure Blob, MinIO with tiering) and **per-object access tracking** to inform the policy.

**Lifecycle rules**: declarative, attached to a bucket or prefix. "Move STANDARD to STANDARD_IA after 30 days, to GLACIER after 90, to DEEP_ARCHIVE after 365, expire after 7 years." S3 evaluates rules nightly and issues transitions in batches; you pay a small per-object transition fee plus the destination tier's cost from then on.

**Intelligent tiering** (S3 Intelligent-Tiering, Azure Cool/Cold auto-tiering) goes further: the service monitors access per object and moves it to the cheapest tier that still meets the SLA, without explicit rules. Pay a monitoring fee per object; the service guarantees no retrieval charge if it tiers wrong.

**Multi-bucket fan-out** for systems that need explicit control: write new data to the hot bucket, run a nightly job that moves untouched objects to a warm bucket, and a weekly job that pushes the warm bucket's tail into Glacier. The application reads from a small index (DynamoDB or a Postgres table) that records *which bucket* each object currently lives in, so the lookup is a single PK fetch followed by a known-tier GET.

**Operational rules of thumb**:
- **Restore latency is a contract**. If users can wait twelve hours for an audit export, Deep Archive is fine. If they expect five minutes, only Glacier Instant Retrieval will do — and it costs ~3x Deep Archive.
- **Minimum-duration penalties bite**. IA classes charge for 30 days minimum; Glacier for 90; Deep Archive for 180. Tier too eagerly and you pay for storage you immediately delete.
- **Object size matters**. Tiers charge per-object overhead (often 32 KB equivalent). Tiering a billion 1 KB objects to Glacier costs more than leaving them on Standard.
- **Egress on restore is real cost**. A `restore-object` call from Deep Archive is free of itself, but the GET that follows pays the standard-tier read price.

## complexity
- **Per-object overhead**: a few bytes of metadata recording the current tier. Transition costs are paid once per move (cents per thousand objects on S3).
- **Read latency**: hot < 1ms, warm 5-50ms, cold minutes to hours. Restore-from-cold is amortised over the read because the object pre-fetches.
- **Cost curve**: roughly logarithmic in access frequency. Moving from a single tier to a three-tier policy commonly cuts storage spend 60-80% for log-shaped workloads.

## pitfalls
- **Transition thrashing**: rules that promote/demote on tight thresholds bounce an object between tiers every week, paying transition fees both ways. Add hysteresis: only demote if untouched for 30 *consecutive* days.
- **Ignoring minimum-duration charges**: deleting an IA object after 5 days still costs the 30-day storage fee.
- **No catalogue of where things live**: application reads to "the bucket" and hits a 404 because lifecycle moved the object to Glacier; the code path that handles `STORAGE_CLASS=GLACIER` either does not exist or does `restore-object` and then panics on the wait time. Always read the metadata first and have an explicit restore-then-fetch path.
- **Cold-tier compliance lock-in**: S3 Object Lock + Glacier Vault Lock enforce write-once-read-many for regulators. Misconfigured locks turn a cost-saving move into a multi-year retention nightmare.
- **Forgetting to lifecycle multipart uploads**: an aborted multipart upload sits as a hidden "in-progress" object on the hot tier forever. Add a rule expiring incomplete uploads after 7 days.

## interviewTips
- Frame the answer around the **price-vs-latency curve**: 100x cheaper per tier step down, 100x slower. Tiering is making that curve work for you.
- Mention **lifecycle rules** by name (S3 Lifecycle, Azure blob lifecycle management). Bonus points for naming **Intelligent-Tiering** as the hands-off option.
- For senior interviews, raise the **restore-from-cold UX problem**: how do you tell a user their export will take twelve hours? Glacier Bulk vs Standard vs Expedited retrieval is the right vocabulary.

## code.python
```python
"""LifecycleManager: a tiny tier-policy engine, modelled after S3 lifecycle rules."""
from dataclasses import dataclass
from typing import Callable, List
from datetime import datetime, timedelta

@dataclass
class TierRule:
    after_days: int
    target_tier: str          # 'hot' | 'warm' | 'cold' | 'deep' | 'delete'

@dataclass
class StoredObject:
    key: str
    created_at: datetime
    last_read_at: datetime
    tier: str = 'hot'
    size_bytes: int = 0

class LifecycleManager:
    TIER_ORDER = {'hot': 0, 'warm': 1, 'cold': 2, 'deep': 3, 'delete': 4}

    def __init__(self, rules: List[TierRule], move_fn: Callable[[str, str], None]):
        # rules ordered ascending by after_days; move_fn(key, new_tier) does the IO
        self.rules = sorted(rules, key=lambda r: r.after_days)
        self.move_fn = move_fn

    def evaluate(self, obj: StoredObject, now: datetime) -> str | None:
        age = (now - obj.last_read_at).days
        # Pick the rule with the largest threshold the object has crossed.
        target = None
        for r in self.rules:
            if age >= r.after_days and self.TIER_ORDER[r.target_tier] > self.TIER_ORDER[obj.tier]:
                target = r.target_tier
        return target

    def sweep(self, objects: List[StoredObject], now: datetime | None = None) -> int:
        now = now or datetime.utcnow()
        moved = 0
        for obj in objects:
            target = self.evaluate(obj, now)
            if target and target != obj.tier:
                self.move_fn(obj.key, target)
                obj.tier = target
                moved += 1
        return moved
```

## code.javascript
```javascript
// LifecycleManager: nightly sweep that demotes untouched objects toward cold.
const TIER_ORDER = { hot: 0, warm: 1, cold: 2, deep: 3, delete: 4 };

export class LifecycleManager {
  constructor(rules, moveFn) {
    // rules: [{ afterDays, targetTier }] ; moveFn: (key, tier) => Promise<void>
    this.rules = [...rules].sort((a, b) => a.afterDays - b.afterDays);
    this.moveFn = moveFn;
  }

  evaluate(obj, now = new Date()) {
    const ageDays = (now - obj.lastReadAt) / 86_400_000;
    let target = null;
    for (const r of this.rules) {
      if (ageDays >= r.afterDays && TIER_ORDER[r.targetTier] > TIER_ORDER[obj.tier]) {
        target = r.targetTier;
      }
    }
    return target;
  }

  async sweep(objects, now = new Date()) {
    let moved = 0;
    for (const obj of objects) {
      const target = this.evaluate(obj, now);
      if (target && target !== obj.tier) {
        await this.moveFn(obj.key, target);
        obj.tier = target;
        moved++;
      }
    }
    return moved;
  }
}
```

## code.java
```java
import java.time.*;
import java.util.*;
import java.util.function.BiConsumer;

public class LifecycleManager {
    public record TierRule(int afterDays, String targetTier) {}
    public static class StoredObject {
        public String key; public Instant lastReadAt; public String tier = "hot";
    }
    private static final Map<String,Integer> ORDER = Map.of(
        "hot",0,"warm",1,"cold",2,"deep",3,"delete",4);

    private final List<TierRule> rules;
    private final BiConsumer<String,String> moveFn;

    public LifecycleManager(List<TierRule> rules, BiConsumer<String,String> moveFn) {
        this.rules = new ArrayList<>(rules);
        this.rules.sort(Comparator.comparingInt(TierRule::afterDays));
        this.moveFn = moveFn;
    }

    public String evaluate(StoredObject o, Instant now) {
        long ageDays = Duration.between(o.lastReadAt, now).toDays();
        String target = null;
        for (var r : rules) {
            if (ageDays >= r.afterDays() && ORDER.get(r.targetTier()) > ORDER.get(o.tier))
                target = r.targetTier();
        }
        return target;
    }

    public int sweep(List<StoredObject> objs, Instant now) {
        int moved = 0;
        for (var o : objs) {
            String t = evaluate(o, now);
            if (t != null && !t.equals(o.tier)) {
                moveFn.accept(o.key, t);
                o.tier = t;
                moved++;
            }
        }
        return moved;
    }
}
```

## code.cpp
```cpp
#include <vector>
#include <string>
#include <chrono>
#include <unordered_map>
#include <functional>

struct TierRule { int afterDays; std::string targetTier; };
struct StoredObject {
    std::string key;
    std::chrono::system_clock::time_point lastReadAt;
    std::string tier = "hot";
};

class LifecycleManager {
    std::vector<TierRule> rules;
    std::function<void(const std::string&, const std::string&)> moveFn;
    static inline const std::unordered_map<std::string,int> ORDER = {
        {"hot",0},{"warm",1},{"cold",2},{"deep",3},{"delete",4}};
public:
    LifecycleManager(std::vector<TierRule> rs,
        std::function<void(const std::string&, const std::string&)> mv)
        : rules(std::move(rs)), moveFn(std::move(mv)) {
        std::sort(rules.begin(), rules.end(),
            [](auto& a, auto& b){ return a.afterDays < b.afterDays; });
    }
    std::string evaluate(const StoredObject& o,
                         std::chrono::system_clock::time_point now) const {
        auto ageDays = std::chrono::duration_cast<std::chrono::hours>(now - o.lastReadAt).count()/24;
        std::string target;
        for (auto& r : rules) {
            if (ageDays >= r.afterDays && ORDER.at(r.targetTier) > ORDER.at(o.tier))
                target = r.targetTier;
        }
        return target;
    }
    int sweep(std::vector<StoredObject>& objs,
              std::chrono::system_clock::time_point now) {
        int moved = 0;
        for (auto& o : objs) {
            auto t = evaluate(o, now);
            if (!t.empty() && t != o.tier) { moveFn(o.key, t); o.tier = t; ++moved; }
        }
        return moved;
    }
};
```
