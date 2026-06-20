---
slug: browser-rendering-pipeline
module: cs-tools-encodings
title: Browser Rendering Pipeline
subtitle: Parse, style, layout, paint, composite — the five stages between your HTML and pixels, and which CSS properties make each stage re-run.
difficulty: Advanced
position: 85
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "web.dev — Rendering performance (the pixel pipeline)"
    url: "https://web.dev/articles/rendering-performance"
    type: docs
  - title: "Chrome — RenderingNG architecture"
    url: "https://developer.chrome.com/docs/chromium/renderingng-architecture"
    type: docs
  - title: "MDN — Populating the page: how browsers work"
    url: "https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work"
    type: docs
status: published
---

## intro
Every frame a browser paints is the output of a pipeline: parse HTML into the DOM, resolve CSS into computed styles, lay out boxes into geometry, paint geometry into raster layers, and composite layers onto the screen. Each stage feeds the next, and a change to one input re-runs everything downstream of it. Knowing which stage a CSS property touches is the difference between a 60fps animation and a janky one.

## whyItMatters
- **Animation performance is decided here.** Animating `left` re-runs layout, paint, and composite every frame; animating `transform` re-runs only composite. Same visual result, 10-100x difference in per-frame cost.
- **Layout thrashing** — interleaving DOM writes with geometry reads (`offsetHeight`, `getBoundingClientRect`) — forces synchronous layout inside a single frame and is the most common cause of scroll jank in real codebases.
- **Web Vitals are pipeline symptoms.** Slow LCP often means the layout/paint of the hero element is blocked; CLS means layout re-ran and moved boxes; poor INP means main-thread pipeline work delayed input handling.
- **Senior frontend interviews ask this directly**: "what happens between changing a style and seeing pixels?" is the frontend equivalent of "what happens when you type a URL."

## intuition
Think of the pipeline as a build system with five targets, each depending on the previous one's output. **Parse** turns HTML bytes into the DOM tree and CSS bytes into the CSSOM. **Style** (recalculation) walks the DOM, matches selectors, and assigns each element its computed style — every property resolved to a concrete value. **Layout** (reflow) converts computed styles into geometry: each box gets an exact position and size in the coordinate space of the page. **Paint** turns geometry into draw commands — fill this rect, draw this text run, blit this image — recorded into display lists per layer. **Composite** uploads those rasterized layers to the GPU and stacks them, applying transforms and opacity at draw time.

The crucial property is **invalidation granularity**. Like a build system, the browser only re-runs the stages whose inputs changed. Change `color` and you re-run style and paint, but geometry is untouched, so layout is skipped. Change `width` and you invalidate layout — and everything below it: paint and composite must re-run too, possibly for many neighbouring elements whose positions depend on the resized box. Change `transform` or `opacity` and — if the element has its own compositor layer — nothing on the main thread re-runs at all. The compositor thread, which lives separately from JavaScript, just re-draws the cached layer texture at a new position. That's why transform-based animations stay smooth even while the main thread is blocked parsing a megabyte of JSON.

The mental model to carry into every performance conversation: **the further up the pipeline your change lands, the more expensive the frame**. Geometry changes are the top. Color changes are the middle. Transform/opacity changes are the bottom — and the bottom is nearly free.

## visualization
```
Stage          Input              Output                Re-run when…
-----------    ----------------   -------------------   --------------------------
1 Parse        HTML/CSS bytes     DOM tree, CSSOM       innerHTML, new stylesheet
2 Style        DOM + CSSOM        computed styles       class change, any style set
3 Layout       computed styles    box geometry          width, font-size, display
4 Paint        geometry           display list/raster   color, background, shadow
5 Composite    raster layers      pixels on screen      transform, opacity (layered)

el.style.width = '50%'   -> style + LAYOUT + paint + composite   (expensive)
el.style.color = 'red'   -> style + paint + composite            (medium)
el.style.transform = …   -> composite only (own layer)           (cheap, off-main-thread)

read offsetHeight after a write -> FORCED SYNCHRONOUS LAYOUT (thrash)
```

## bruteForce
The naive performance strategy is to treat all style changes as equal: animate `top`/`left` with JavaScript timers, read and write the DOM in whatever order the code happens to execute, and let the browser sort it out. Browsers do batch — they coalesce style writes and run the pipeline once per frame — but any geometry read between writes defeats the batching, and any layout-triggering property in a 60fps animation re-runs the full pipeline 60 times a second across every affected box.

## optimal
Structure work around the pipeline instead of fighting it.

**Animate at the bottom of the pipeline.** For motion and fades, use `transform` and `opacity` exclusively. Promote the animated element to its own compositor layer with `will-change: transform` (sparingly — each layer costs GPU memory) so the main thread is bypassed entirely. CSS transitions/animations on these properties run on the compositor thread and survive main-thread stalls.

**Batch reads, then writes.** A forced synchronous layout happens when you read a layout-dependent value (`offsetWidth`, `scrollTop`, `getComputedStyle(...).height`) after invalidating layout in the same frame. The browser must run layout immediately to answer correctly. The fix is phase separation: read everything first, compute, then write everything. Libraries like FastDOM formalize this; `requestAnimationFrame` gives you a hook that runs right before style/layout, which is the correct slot for visual updates.

**Contain invalidation.** `contain: layout paint` (or `content-visibility: auto`) tells the engine an element's internals can't affect outside geometry, so a change inside it relays out only that subtree instead of the document. For long lists this turns O(page) layout into O(item).

**Measure, don't guess.** Chrome DevTools Performance panel labels every pipeline stage per frame — purple for style/layout, green for paint/composite. A frame budget is ~16.7ms at 60fps; if layout alone eats 12ms, no amount of JavaScript micro-optimization will save the frame. The fix is always to move the change down the pipeline or shrink the invalidated region.

## complexity
time: O(affected boxes) for layout, O(invalidated area) for paint, O(layers) for composite
space: O(layers) GPU texture memory for promoted compositor layers
notes: Style recalculation is roughly O(elements x selectors matched), heavily optimized with bloom-filter ancestor rejection. Layout's "affected" set can cascade to the whole document without containment, and flex/grid re-resolution can iterate. Paint cost scales with invalidated pixel area, not element count — a full-viewport repaint is expensive regardless of DOM size. Compositing runs on the GPU and is effectively free until layer count or texture memory explodes, which is why over-using `will-change` backfires.

## pitfalls
- **Reading `offsetHeight` in a loop that also writes styles** — each iteration forces a synchronous layout; a 100-item loop runs layout 100 times instead of once.
- **Animating `top/left/width/height/margin`** instead of `transform` — every frame pays layout + paint; the animation competes with all other main-thread work.
- **`will-change` on everything** — each promoted layer holds a GPU texture; hundreds of layers cause memory pressure and slower compositing than no layers at all.
- **Assuming `requestAnimationFrame` makes code fast** — rAF only controls *when* code runs (before render). A 30ms rAF callback still blows the frame budget.
- **Forgetting that `getComputedStyle` can force layout** — reading any layout-dependent computed value after a DOM write flushes the pipeline just like `offsetHeight`.

## interviewTips
- Name the five stages in order and immediately give the property classification: geometry properties hit layout, visual properties hit paint, transform/opacity hit only composite. That classification is the answer interviewers are fishing for.
- Define layout thrashing precisely — "write, read, write, read forces a synchronous layout per read" — and give the fix: batch reads before writes, or use rAF to schedule writes.
- Mention the compositor thread: transform/opacity animations keep running even when the main thread is blocked, which is why CSS animations outlive a busy `while` loop but rAF-driven ones freeze.

## code.python
```python
# Simulation: pipeline invalidation as a dependency chain.
# Shows why a geometry change costs more than a transform change.

STAGES = ["style", "layout", "paint", "composite"]

ENTRY = {            # first stage each property invalidates
    "width": "layout",
    "color": "paint",
    "transform": "composite",
    "opacity": "composite",
}

def frame_cost(changed_props):
    first = min(
        (STAGES.index(ENTRY[p]) for p in changed_props),
        default=len(STAGES),
    )
    rerun = STAGES[first:]          # everything downstream re-runs
    return rerun

print(frame_cost({"transform"}))    # ['composite']
print(frame_cost({"color"}))        # ['paint', 'composite']
print(frame_cost({"width"}))        # ['layout', 'paint', 'composite']
print(frame_cost({"width", "transform"}))  # layout wins: full pipeline
```

## code.javascript
```javascript
// The real thing: avoiding forced synchronous layout.

// BAD: read-write interleave forces layout once per iteration.
function thrash(items) {
  items.forEach((el) => {
    const h = el.offsetHeight;        // read -> forces layout
    el.style.height = h * 2 + "px";   // write -> invalidates layout
  });
}

// GOOD: phase-separated. One layout for all reads, one for all writes.
function batched(items) {
  const heights = items.map((el) => el.offsetHeight); // all reads
  requestAnimationFrame(() => {
    items.forEach((el, i) => {
      el.style.height = heights[i] * 2 + "px";        // all writes
    });
  });
}

// GOOD: animate at the bottom of the pipeline (compositor-only).
function slideIn(el) {
  el.style.willChange = "transform";
  el.animate(
    [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }],
    { duration: 300, easing: "ease-out" }
  ).finished.then(() => (el.style.willChange = ""));
}
```

## code.java
```java
// Analogous pattern: staged pipeline with downstream invalidation,
// the same shape browser engines and build systems share.

import java.util.*;

class RenderPipeline {
    static final List<String> STAGES =
        List.of("style", "layout", "paint", "composite");
    static final Map<String, String> ENTRY = Map.of(
        "width", "layout",
        "color", "paint",
        "transform", "composite"
    );

    static List<String> frameCost(Set<String> changed) {
        int first = STAGES.size();
        for (String p : changed)
            first = Math.min(first, STAGES.indexOf(ENTRY.get(p)));
        return STAGES.subList(first, STAGES.size());
    }

    public static void main(String[] args) {
        System.out.println(frameCost(Set.of("transform"))); // [composite]
        System.out.println(frameCost(Set.of("width")));     // [layout, paint, composite]
    }
}
```

## code.cpp
```cpp
// Same invalidation model in C++: the earliest dirty stage
// determines the cost of the frame.

#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<string> stages = {"style", "layout", "paint", "composite"};
    map<string, int> entry = {
        {"width", 1}, {"color", 2}, {"transform", 3}, {"opacity", 3}
    };

    auto frameCost = [&](vector<string> changed) {
        int first = stages.size();
        for (auto& p : changed) first = min(first, entry[p]);
        vector<string> rerun(stages.begin() + first, stages.end());
        return rerun;
    };

    for (auto& s : frameCost({"transform"})) cout << s << " "; // composite
    cout << "\n";
    for (auto& s : frameCost({"width"}))     cout << s << " "; // layout paint composite
    cout << "\n";
}
```
