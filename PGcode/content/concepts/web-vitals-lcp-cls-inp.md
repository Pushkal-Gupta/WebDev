---
slug: web-vitals-lcp-cls-inp
module: cs-tools-encodings
title: Web Vitals — LCP, CLS, INP
subtitle: The three numbers Google grades every page on — what each one actually measures, what moves it, and how to fix the worst offenders.
difficulty: Intermediate
position: 88
estimatedReadMinutes: 10
prereqs: []
relatedProblems: []
references:
  - title: "web.dev — Largest Contentful Paint (LCP)"
    url: "https://web.dev/articles/lcp"
    type: docs
  - title: "web.dev — Cumulative Layout Shift (CLS)"
    url: "https://web.dev/articles/cls"
    type: docs
  - title: "web.dev — Interaction to Next Paint (INP)"
    url: "https://web.dev/articles/inp"
    type: docs
status: published
---

## intro
Core Web Vitals are three user-centric metrics measured on real visitors: LCP (Largest Contentful Paint) — how fast the main content appears; CLS (Cumulative Layout Shift) — how much the page jumps around; INP (Interaction to Next Paint) — how quickly the page responds to taps, clicks, and keys. Google folds them into search ranking, and the thresholds are concrete: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms at the 75th percentile.

## whyItMatters
- **They're ranking signals.** Pages failing Core Web Vitals lose a search-ranking tiebreaker; e-commerce teams routinely tie vitals regressions to conversion drops in A/B data.
- **They're measured in the field, not the lab.** Chrome reports real-user values to the CrUX dataset; the score that counts is the 75th percentile of actual visitors on actual devices — a fast laptop in DevTools proves nothing.
- **INP replaced FID in March 2024** — a much harder metric. FID measured only first-input delay; INP measures the full input-to-paint latency of the *worst* interactions across the whole visit, exposing every long task.
- **Performance interviews now use vitals as the framing.** "LCP is 4 seconds — walk me through your debugging" is the modern version of "make this page faster."

## intuition
Each metric formalizes one user perception with one number.

**LCP** answers "when did the page look loaded?" The browser tracks the largest image or text block in the viewport as rendering progresses and timestamps the moment the final largest element painted. The chain behind that timestamp is mechanical: TTFB (server answers) → resource discovery (the hero image URL must appear early — in the initial HTML, not buried in a JS bundle or CSS background) → resource load → render. Most bad LCPs are discovery problems: the hero image is loaded by JavaScript that loads after a bundle that loads after the HTML, a four-hop chain where one hop was needed. `<img>` in the HTML plus `fetchpriority="high"` (or `<link rel="preload">`) collapses the chain.

**CLS** answers "did the page jump while I was reading?" Every unexpected layout shift scores impact-fraction x distance-fraction (how much of the viewport moved, times how far); shifts within 500ms of a user input are exempt. The score sums shifts within the worst 5-second window of the visit. Causes are always "content inserted above existing content without reserved space": images without dimensions, late-loading ads or banners, and web fonts swapping at a different metric size.

**INP** answers "does it respond when I touch it?" Every interaction is timed from input to the next paint — input delay (main thread busy) + handler execution + render. The reported INP is approximately the worst interaction of the visit (75th-percentile-ish: the highest, ignoring one outlier per 50 interactions). One 600ms hydration task that swallows a click sets your INP to 600ms; the fix is always the same — shorter tasks, yield to the loop, paint before heavy work.

## visualization
```
Metric  Question              Good     Needs work  Poor     Unit
------  --------------------  -------  ----------  -------  -----------
LCP     main content visible  <=2.5s   2.5-4.0s    >4.0s    seconds
CLS     visual stability      <=0.1    0.1-0.25    >0.25    unitless score
INP     responsiveness        <=200ms  200-500ms   >500ms   milliseconds
(measured at p75 of real users, mobile and desktop separately)

LCP chain:   TTFB -> discover hero URL -> fetch -> render
             fix: image in HTML + fetchpriority=high, cut chain hops

CLS score:   shift = impact_fraction x distance_fraction
             banner pushes 80% of viewport down by 10% -> 0.8 x 0.1 = 0.08
             fix: reserve space (width/height, aspect-ratio, min-height)

INP anatomy: input_delay + handler_time + render_time, worst interaction
             fix: tasks <50ms, yield before heavy work, paint feedback first
```

## bruteForce
The traditional approach: measure `load` event time in a lab, minify everything, and call it done. It fails on all three vitals. `load` can fire before the hero image paints (bad proxy for LCP) or minutes after the page was usable. Lab runs on a fast machine miss the p75 phone on 4G that defines your real score. And no single load-time number sees post-load problems at all — CLS from a late banner and INP from a heavy click handler both happen long after `load`.

## optimal
Treat each vital as its own pipeline with known fixes.

**LCP — shorten the chain.** Measure TTFB first; if it's over ~800ms, no frontend work matters yet (cache HTML at the CDN, stream early). Then make the LCP element discoverable from the initial HTML: a real `<img src>` with `fetchpriority="high"`, never a CSS background or a client-rendered image, never behind a lazy-load (`loading="lazy"` on the hero is the single most common self-inflicted LCP wound). Preconnect to the image CDN. Inline critical CSS so render isn't blocked on a stylesheet round trip.

**CLS — reserve every pixel before it arrives.** `width`/`height` attributes on every image (the browser computes the box from the ratio before the bytes arrive), `aspect-ratio` or `min-height` for embeds and ad slots, `font-display: optional` or metric-compatible fallback fonts (`size-adjust`) to stop font-swap reflow. Never insert UI above the user's current viewport position; if content must arrive late, animate with `transform` — compositor-driven movement doesn't count as a layout shift.

**INP — keep the main thread free at interaction time.** Break long tasks under ~50ms; yield with `scheduler.yield()`/`setTimeout` between chunks so input can preempt. In handlers, paint feedback first, compute after: update the visual state, then defer the expensive work to a macrotask (`requestAnimationFrame` then `setTimeout`) so the next paint isn't blocked. Cut hydration cost on content sites (server components, islands, less JS). Audit third-party scripts — a tag manager's 300ms task is your INP.

**Measure in the field**: the `web-vitals` library (or `PerformanceObserver` directly) reports real values with attribution — which element was LCP, which shift was largest, which interaction was slowest — and that attribution is what makes the fix obvious.

## complexity
time: O(1) per performance entry — PerformanceObserver is push-based, no polling
space: O(shifts in the active 5s window) for CLS session-window aggregation
notes: Measurement cost is effectively free — entries arrive asynchronously through `PerformanceObserver` callbacks. The lifecycle matters more than the cost: LCP finalizes at first interaction or page-hide, while CLS and INP accumulate for the whole visit and must be flushed on `visibilitychange`. CLS clusters shifts into windows of at most 5 seconds with a 1-second max gap, and the worst window is the reported score, so one bad burst dominates the entire visit.

## pitfalls
- **`loading="lazy"` on the LCP image** — lazy-loading delays discovery and fetch of the exact element being timed; reserve lazy-loading for below-the-fold images only.
- **Optimizing in DevTools on a fast machine and shipping** — the score is field p75; throttle to mid-tier mobile CPU and test on real devices, then verify in CrUX/RUM data.
- **Images without `width`/`height` attributes** — "CSS sets the size" only works after CSS loads; the attributes give the browser the aspect ratio at parse time, eliminating the shift entirely.
- **Reporting vitals on `unload`** — that event doesn't fire reliably on mobile; use `visibilitychange` plus `sendBeacon` or CLS and INP silently vanish from your RUM data.
- **Treating INP as load-time-only** — INP counts interactions across the entire visit; a heavy filter dropdown used five minutes in can be the worst interaction that defines the score.

## interviewTips
- Memorize the three thresholds (2.5s / 0.1 / 200ms at p75) and lead with them — citing exact numbers signals real production experience.
- For "LCP is slow, debug it," walk the chain in order: TTFB → discovery → fetch → render, and name the classic fix at each hop (CDN/cache, image in HTML + fetchpriority, preconnect, critical CSS).
- For INP, give the modern answer: long-task budget under 50ms, yield between chunks, paint feedback before computing — and mention INP replaced FID because FID only measured the first input's delay.

## code.python
```python
# Simulation: CLS session-window scoring and INP selection,
# mirroring how the browser aggregates raw entries.

def cls_score(shifts):
    # shifts: [(t_ms, value)]; windows: <=5s span, <=1s gap between shifts
    windows, cur, start, last = [], 0.0, None, None
    for t, v in shifts:
        if start is None or t - last > 1000 or t - start > 5000:
            if start is not None:
                windows.append(cur)
            cur, start = 0.0, t
        cur += v
        last = t
    windows.append(cur)
    return max(windows)          # worst window is the score

def inp(interactions):
    # approx: worst duration, skipping one outlier per 50 interactions
    s = sorted(interactions, reverse=True)
    return s[min(len(s) // 50, len(s) - 1)]

print(cls_score([(100, 0.05), (600, 0.04), (9000, 0.02)]))  # 0.09
print(inp([40, 80, 120, 600]))                              # 600
```

## code.javascript
```javascript
// Field measurement with attribution — the production pattern.
import { onLCP, onCLS, onINP } from "web-vitals/attribution";

function send(metric) {
  const body = JSON.stringify({
    name: metric.name,                       // 'LCP' | 'CLS' | 'INP'
    value: metric.value,
    rating: metric.rating,                   // 'good' | 'needs-improvement' | 'poor'
    target: metric.attribution?.target,      // which element caused it
  });
  navigator.sendBeacon("/vitals", body);     // survives page-hide
}
onLCP(send); onCLS(send); onINP(send);

// INP fix pattern: paint feedback first, defer the heavy work.
button.addEventListener("click", () => {
  button.classList.add("is-busy");           // cheap visual state
  requestAnimationFrame(() => {              // let that paint...
    setTimeout(() => {                       // ...then run after the frame
      rebuildHugeFilteredList();
      button.classList.remove("is-busy");
    }, 0);
  });
});

// CLS fix pattern: reserve space before the image arrives.
// <img src="hero.jpg" width="1200" height="600" fetchpriority="high">
```

## code.java
```java
// Analogous pattern: p75 aggregation over a RUM stream —
// the same percentile logic CrUX applies to field vitals.
import java.util.*;

class VitalsAggregator {
    private final Map<String, List<Double>> samples = new HashMap<>();

    void record(String metric, double value) {
        samples.computeIfAbsent(metric, k -> new ArrayList<>()).add(value);
    }

    double p75(String metric) {
        List<Double> v = new ArrayList<>(samples.get(metric));
        Collections.sort(v);
        return v.get((int) Math.ceil(0.75 * v.size()) - 1);
    }

    public static void main(String[] args) {
        VitalsAggregator agg = new VitalsAggregator();
        for (double lcp : new double[]{1.8, 2.1, 2.4, 3.9}) agg.record("LCP", lcp);
        System.out.println(agg.p75("LCP") <= 2.5 ? "good" : "failing"); // 2.4 -> good
    }
}
```

## code.cpp
```cpp
// CLS session-window scoring in C++ — worst 5s window of shifts.
#include <bits/stdc++.h>
using namespace std;

double clsScore(vector<pair<int,double>>& shifts) {  // (t_ms, value)
    double best = 0, cur = 0;
    int start = -1, last = -1;
    for (auto& [t, v] : shifts) {
        if (start < 0 || t - last > 1000 || t - start > 5000) {
            best = max(best, cur);
            cur = 0; start = t;
        }
        cur += v;
        last = t;
    }
    return max(best, cur);
}

int main() {
    vector<pair<int,double>> shifts = {{100, 0.05}, {600, 0.04}, {9000, 0.02}};
    printf("%.2f\n", clsScore(shifts));   // 0.09 -> within the 0.1 budget
}
```
