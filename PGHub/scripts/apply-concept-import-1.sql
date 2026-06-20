-- Concept import chunk 1/4 (browser-rendering-pipeline, browser-event-loop, debounce-vs-throttle).
-- Mirrors scripts/import-concepts.js parsing; node was unavailable so the parse runs in plpgsql.
DO $do$
DECLARE
  r record;
  lines text[];
  ln text;
  cl text;
  cur_name text;
  cur_lines text[];
  cleaned text;
  sections jsonb;
  codes jsonb;
  obj jsonb;
  arr jsonb;
  km text[];
  in_fence boolean;
  fence_done boolean;
  code_lines text[];
  lang text;
BEGIN
FOR r IN
SELECT * FROM (VALUES
(
  'browser-rendering-pipeline', 'cs-tools-encodings',
  $tt$Browser Rendering Pipeline$tt$,
  $tt$Parse, style, layout, paint, composite — the five stages between your HTML and pixels, and which CSS properties make each stage re-run.$tt$,
  'Advanced', 85, 11,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$web.dev — Rendering performance (the pixel pipeline)$rf$, 'url', 'https://web.dev/articles/rendering-performance', 'type', 'docs'),
      jsonb_build_object('title', $rf$Chrome — RenderingNG architecture$rf$, 'url', 'https://developer.chrome.com/docs/chromium/renderingng-architecture', 'type', 'docs'),
      jsonb_build_object('title', $rf$MDN — Populating the page: how browsers work$rf$, 'url', 'https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work', 'type', 'docs')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
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
$bdy$
),
(
  'browser-event-loop', 'cs-tools-encodings',
  $tt$Browser Event Loop & Task Queues$tt$,
  $tt$Macrotasks, microtasks, and requestAnimationFrame — the exact ordering rules behind every "why did this log first?" puzzle.$tt$,
  'Advanced', 86, 11,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$Jake Archibald — Tasks, microtasks, queues and schedules$rf$, 'url', 'https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/', 'type', 'blog'),
      jsonb_build_object('title', $rf$HTML Living Standard — Event loops (processing model)$rf$, 'url', 'https://html.spec.whatwg.org/multipage/webappapis.html#event-loops', 'type', 'docs'),
      jsonb_build_object('title', $rf$MDN — The event loop$rf$, 'url', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop', 'type', 'docs')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
JavaScript runs on one thread, yet pages handle clicks, timers, network responses, and animations seemingly at once. The trick is the event loop: a scheduler that pulls work from several queues with strict priority rules. Macrotasks run one per loop turn; microtasks drain completely after each; rendering slots in between. Every async ordering puzzle — `setTimeout` vs `Promise.then` vs `await` — resolves to these rules.

## whyItMatters
- **The single most-asked frontend interview question.** "What does this log?" with mixed `setTimeout`, `Promise.then`, `async/await`, and `queueMicrotask` appears in nearly every JS interview at every level.
- **Production bugs live here.** A microtask loop that never empties starves rendering completely — the page freezes with no long task visible in a naive profiler. An `await` placed before a DOM read changes which frame the read observes.
- **Frameworks are built on these rules.** React schedules updates across tasks, Vue batches reactivity flushes into a microtask, and `queueMicrotask` vs `setTimeout(0)` vs `requestAnimationFrame` are three different contracts that libraries pick deliberately.
- **Node.js shares the model** with extra queues (`setImmediate`, `process.nextTick`), so the browser version is the foundation for backend JS too.

## intuition
Picture the runtime as a clerk working a single counter with several inboxes. The **macrotask queue** (the spec just says "task queue") holds big envelopes: timer callbacks, click handlers, network events, script execution itself. The clerk takes exactly **one** envelope per turn. The **microtask queue** holds sticky notes: promise reactions, `queueMicrotask` callbacks, MutationObserver notifications. After finishing each envelope — and, crucially, after *every* callback, even between two event listeners — the clerk processes **all** sticky notes, including new sticky notes created while processing sticky notes, until the pad is empty. Only then does the next envelope get opened.

Rendering is a separate appointment. Roughly 60 times a second (matching the display), the browser may pause between macrotasks to run the render steps: `requestAnimationFrame` callbacks first, then style, layout, paint. rAF is therefore neither a macrotask nor a microtask — it's a render-phase hook that fires at most once per frame, right before the page is drawn.

Three consequences fall out. First, `Promise.resolve().then(f)` always beats `setTimeout(f, 0)`: microtasks drain before the loop advances to the next macrotask. Second, an infinite chain of microtasks (`function loop(){ Promise.resolve().then(loop) }`) freezes the page forever — rendering never gets a turn — while the same chain via `setTimeout` stays responsive, because the loop can render between macrotasks. Third, `await` is sugar for "put the rest of this function on the microtask queue": everything after the first `await` runs later than the synchronous code below the function call, which is exactly the ordering that trips people up.

## visualization
```
console.log('A');
setTimeout(() => console.log('B'), 0);          // macrotask
Promise.resolve().then(() => console.log('C')); // microtask
requestAnimationFrame(() => console.log('D'));  // render-phase hook
console.log('E');

Loop turn 1 (script is itself a macrotask):
  run script        -> logs A, E
  drain microtasks  -> logs C
  [render steps?]   -> rAF fires before paint -> logs D
Loop turn 2:
  macrotask: timer  -> logs B

Output: A E C D B          (D/B order: rAF rides the next frame,
                            which almost always precedes the timer)

Rule of thumb:
  sync code  >  microtasks (drain ALL)  >  render (rAF, once/frame)  >  next macrotask
```

## bruteForce
The naive mental model is a single FIFO queue: "async callbacks run later, in the order they were scheduled." It predicts `setTimeout(f, 0)` and `Promise.then(g)` interleave by registration order — wrong. It cannot explain why a promise chain starves rendering, why `await` splits a function in two, or why two `then` callbacks on the same promise both run before any timer. One queue is not enough; the real model has at least three with different drain policies.

## optimal
Internalize the spec's processing model — it's short:

1. **Pick one macrotask** from a task queue (the browser may prioritize between queues — input events are usually favored over timers) and run it to completion.
2. **Drain the microtask queue** entirely. New microtasks scheduled during the drain are also run — this is a `while not empty` loop, not a snapshot. Microtask checkpoints also happen after every callback invocation, not just after whole tasks.
3. **If it's time to render** (display refresh, ~16.7ms at 60Hz): run `requestAnimationFrame` callbacks (a snapshot — rAFs scheduled inside an rAF wait for the *next* frame), then style recalculation, layout, paint.
4. Loop.

From this, the practical scheduling toolkit: use a **microtask** (`queueMicrotask`, `Promise.then`) when you must run before anything else can observe intermediate state — e.g., batching multiple synchronous state mutations into one flush, the way Vue and MobX do. Use **`requestAnimationFrame`** for anything visual — it runs once per frame, right before paint, with fresh layout available and no risk of painting half-applied updates. Use a **macrotask** (`setTimeout(0)`, or better `MessageChannel`/`scheduler.postTask` for lower clamped latency) to yield: let rendering and input handling happen before continuing a long computation. Chunking a 500ms job into 10ms macrotask slices keeps INP healthy; chunking it into microtasks does nothing, because microtasks never yield to rendering.

The `await` rewrite rule completes the picture: `await x` evaluates `x` synchronously, then suspends; the continuation resumes as a microtask once `x` settles — even if `x` is already a resolved value.

## complexity
time: O(1) macrotask per loop turn; O(all scheduled) microtask drain per checkpoint
space: O(queued callbacks) across the macrotask, microtask, and rAF queues
notes: The microtask drain is unbounded per checkpoint — it includes microtasks scheduled while draining, so an unbounded promise chain is an infinite loop that blocks rendering forever. Macrotasks run one per turn, and nested `setTimeout(0)` is clamped to ~4ms after 5 levels of nesting, bounding busy-loop frequency. rAF callbacks run as a snapshot batch at most once per frame, aligned to display refresh, so rAFs scheduled inside an rAF wait for the next frame.

## pitfalls
- **Treating `setTimeout(fn, 0)` as "run immediately after this"** — every pending microtask, possibly a render, and any earlier macrotasks run first; nested timers are also clamped to ≥4ms.
- **Recursive microtasks for chunked work** — `Promise.then` chains never yield to rendering or input; the page hard-freezes with no obvious long task. Chunk with macrotasks or `scheduler.postTask` instead.
- **Forgetting `await` suspends even on resolved values** — `await 5` still defers the continuation to a microtask, so code after the call site runs before code after the `await`.
- **Scheduling rAF inside rAF and expecting same-frame execution** — the inner callback joins the *next* frame's snapshot; this is the correct way to build a frame loop, but wrong if you expected immediate re-run.
- **Assuming DOM updates paint between two awaits** — rendering only happens between macrotasks at frame boundaries; two microtask-separated DOM writes coalesce into one paint.

## interviewTips
- Solve ordering puzzles mechanically: label every callback macrotask / microtask / rAF, then replay the loop — one macrotask, full microtask drain, maybe render. Narrate the labels out loud; the labeling is what's being graded.
- Know the canonical one-liner: "microtasks drain completely between macrotasks, and rendering happens between macrotasks — so promise chains can starve paint, timers can't."
- Be ready for the follow-up "how do you keep a long computation from freezing the UI?" — answer: slice it across macrotasks (`setTimeout`/`MessageChannel`/`scheduler.postTask` with `yield`), or move it to a Web Worker.

## code.python
```python
# Simulation: replay the loop's drain rules to predict output order.
from collections import deque

macro, micro, raf, out = deque(), deque(), deque(), []

def script():
    out.append("A")
    macro.append(lambda: out.append("B"))    # setTimeout 0
    micro.append(lambda: out.append("C"))    # promise.then
    raf.append(lambda: out.append("D"))      # requestAnimationFrame
    out.append("E")

macro.append(script)

while macro:
    macro.popleft()()            # 1. one macrotask
    while micro:                 # 2. drain ALL microtasks
        micro.popleft()()
    frame, raf = raf, deque()    # 3. render: rAF snapshot, then paint
    for cb in frame:
        cb()

print(out)   # ['A', 'E', 'C', 'D', 'B']
```

## code.javascript
```javascript
// The classic puzzle — predict before running.
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
requestAnimationFrame(() => console.log("D"));
(async () => {
  console.log("F");
  await null;                       // continuation -> microtask queue
  console.log("G");
})();
console.log("E");
// A F E C G D B   (sync, then microtasks, then rAF/frame, then timer)

// Yielding correctly: chunk long work across MACROtasks so
// rendering and input run between slices. Microtasks would not yield.
function processInChunks(items, fn, chunkMs = 8) {
  let i = 0;
  function slice() {
    const start = performance.now();
    while (i < items.length && performance.now() - start < chunkMs) {
      fn(items[i++]);
    }
    if (i < items.length) setTimeout(slice, 0);  // yield to the loop
  }
  slice();
}
```

## code.java
```java
// Analogous pattern: a two-priority executor where "microtasks"
// always drain before the next "macrotask" — same starvation risk.

import java.util.ArrayDeque;
import java.util.Deque;

class EventLoop {
    private final Deque<Runnable> macro = new ArrayDeque<>();
    private final Deque<Runnable> micro = new ArrayDeque<>();

    void postTask(Runnable r)      { macro.add(r); }
    void postMicrotask(Runnable r) { micro.add(r); }

    void run() {
        while (!macro.isEmpty()) {
            macro.poll().run();          // one macrotask per turn
            while (!micro.isEmpty())     // drain all microtasks,
                micro.poll().run();      // including newly added ones
            // render() would go here, between macrotasks
        }
    }

    public static void main(String[] args) {
        EventLoop loop = new EventLoop();
        loop.postTask(() -> {
            System.out.println("A");
            loop.postTask(() -> System.out.println("B"));
            loop.postMicrotask(() -> System.out.println("C"));
            System.out.println("E");
        });
        loop.run();   // A E C B
    }
}
```

## code.cpp
```cpp
// Same model in C++: one macrotask per turn, full microtask drain.
#include <bits/stdc++.h>
using namespace std;

int main() {
    queue<function<void()>> macro;
    queue<function<void()>> micro;

    macro.push([&] {
        cout << "A\n";
        macro.push([] { cout << "B\n"; });   // setTimeout(0)
        micro.push([] { cout << "C\n"; });   // promise.then
        cout << "E\n";
    });

    while (!macro.empty()) {
        auto task = macro.front(); macro.pop();
        task();
        while (!micro.empty()) {             // drain completely
            auto m = micro.front(); micro.pop();
            m();
        }
        // render step would run here, once per frame
    }
    // Output: A E C B
}
```
$bdy$
),
(
  'debounce-vs-throttle', 'cs-tools-encodings',
  $tt$Debounce vs Throttle$tt$,
  $tt$Two rate-limiting strategies for noisy event streams — wait for silence, or sample at a fixed cadence — and how to implement both from scratch.$tt$,
  'Intermediate', 87, 9,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$CSS-Tricks — Debouncing and Throttling Explained Through Examples$rf$, 'url', 'https://css-tricks.com/debouncing-throttling-explained-examples/', 'type', 'blog'),
      jsonb_build_object('title', $rf$Lodash docs — _.debounce / _.throttle$rf$, 'url', 'https://lodash.com/docs/#debounce', 'type', 'docs'),
      jsonb_build_object('title', $rf$MDN — setTimeout$rf$, 'url', 'https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout', 'type', 'docs')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
Browsers fire events far faster than handlers can usefully respond: `scroll` and `mousemove` fire dozens of times per frame's worth of input, `input` fires per keystroke, `resize` fires continuously during a drag. Debounce and throttle are the two standard rate limiters. Debounce waits for a quiet gap before firing once; throttle fires at most once per interval while events keep flowing. Picking the wrong one is a real, visible bug.

## whyItMatters
- **"Implement debounce" is a top-five frontend coding interview question.** It tests closures, timers, `this` binding, and argument forwarding in fifteen lines. Throttle with leading/trailing options is the standard follow-up.
- **Search-as-you-type without debounce** sends a network request per keystroke — wasted backend load, race conditions where an older response overwrites a newer one, and rate-limit bans.
- **Scroll handlers without throttle** run heavy code hundreds of times per second and are a classic source of jank; throttling to one run per 100ms cuts the work 10x with no visible difference.
- The same two shapes appear server-side as **rate limiting** and in hardware as **switch debouncing** — the concept transfers well beyond the browser.

## intuition
Both tools answer the same question — "events arrive faster than I want to act; when do I act?" — with opposite policies.

**Debounce** is an elevator door. Every time someone walks in (an event), the door-close timer resets. The elevator only moves once people stop arriving for a full `wait` period. Formally: fire the handler once, `wait` ms after the *last* event in a burst. During a continuous stream the handler may **never** fire — that's by design. The signal debounce extracts is "the burst is over": the user stopped typing, the resize drag ended, the window settled. Use it when only the final state matters and intermediate states are noise.

**Throttle** is a camera taking one photo per second of a race. Events keep streaming, and the handler fires at a steady maximum cadence — at most once per `wait` ms — no matter how dense the stream. The signal throttle extracts is "a representative sample, regularly": scroll position for an infinite-scroll check, mouse position for a drag preview, game input polling. Use it when intermediate states matter and you need guaranteed periodic execution during the stream.

The litmus test: **if the user holds the event stream open forever, should your handler run?** If no (search query — wait until they stop), debounce. If yes (scroll progress bar — must update while scrolling), throttle. The interview-grade refinement is the leading/trailing-edge options: leading fires immediately on the first event of a burst (snappy perceived response), trailing fires after the burst ends (captures the final state). Lodash defaults: debounce trailing-only, throttle both edges.

## visualization
```
events:    x x x x x x x x x x x x          (burst, then silence)
time:      0----------------------400ms-----------

debounce(wait=100, trailing):
  every event resets the timer
  fires:                              F      (once, 100ms after LAST event)

throttle(wait=100, leading+trailing):
  fires:   F         F         F      F      (at most one per 100ms window,
           ^t=0      ^t=100    ^t=200 ^trailing catches the final event)

continuous stream that never pauses:
  debounce -> never fires (no quiet gap)
  throttle -> fires every 100ms, guaranteed
```

## bruteForce
The unrate-limited handler: attach the expensive function directly to `input`/`scroll`/`resize`. Correct output, terrible cost — one network request per keystroke, one layout-reading scroll computation per event, hundreds of invocations per second. The first instinct fix, a boolean `isRunning` flag that drops events while busy, throttles by accident but loses the final event of every burst, so the UI settles on a stale state — the exact bug trailing-edge invocation exists to fix.

## optimal
Both implementations are a closure over a timer.

**Debounce**: store a timer id. On each call, clear the pending timer and schedule a new one for `wait` ms that invokes the function with the *latest* arguments and `this`. The constant rescheduling is the mechanism — only a call that survives `wait` ms without a successor actually runs. Add a leading option by firing immediately when no timer exists, then suppressing until the quiet gap; add `cancel()` (clear the timer) and `flush()` (run the pending call now) for completeness — component unmount needs `cancel()` to avoid setting state on a dead component.

**Throttle**: record `lastRun` timestamp. On each call, if `now - lastRun >= wait`, run immediately (leading edge) and update `lastRun`. Otherwise schedule a single trailing call at `lastRun + wait` with the latest arguments — never more than one pending. The trailing call guarantees the final event of a burst is processed, so the UI never settles stale. Throttle is in fact debounce with a `maxWait`: lodash implements `throttle(f, w)` as `debounce(f, w, { maxWait: w })`.

Two production notes. First, forward `this` and arguments through (`fn.apply(ctx, args)`) — the most common interview mistake is calling `fn()` bare, which breaks methods and drops event objects. Second, for *visual* work tied to frames, `requestAnimationFrame`-based throttling (run at most once per frame) beats time-based throttling: it matches the display rate exactly and pauses in background tabs for free.

## complexity
time: O(1) per event
space: O(1) per wrapped function
notes: Each incoming event costs constant work for both wrappers — clear/reset a timer for debounce, compare a timestamp and maybe schedule one pending call for throttle. Memory is one timer id, one saved args/this pair, and one timestamp per wrapped function. The interesting metric is invocation count: debounce fires once per burst (zero during a never-ending stream); throttle fires roughly duration/wait times per stream plus one trailing call that captures the final event.

## pitfalls
- **Debouncing something that must run during a continuous stream** — a debounced scroll handler never fires while the user keeps scrolling; infinite scroll never loads. That's a throttle job.
- **Recreating the debounced function every React render** — `onChange={debounce(save, 300)}` creates a fresh closure each render, so timers never accumulate and every keystroke fires. Memoize with `useMemo`/`useRef`, and `cancel()` on unmount.
- **Dropping `this`/arguments** — invoking `fn()` instead of `fn.apply(this, args)` breaks class methods and loses the event object.
- **Throttle without a trailing call** — the last event of a burst lands mid-window and is silently dropped; the UI freezes one step before the final state.
- **Debouncing validation but not the submit path** — the user types and immediately clicks submit; the pending debounced validation hasn't run. Expose `flush()` and call it on submit.

## interviewTips
- Lead with the litmus test — "should the handler run during a never-ending stream? no → debounce, yes → throttle" — then give one example each (search input vs scroll handler) before writing code.
- Write debounce with `clearTimeout` + `setTimeout` and explicit `fn.apply(context, args)`; mention `cancel`/`flush` and leading/trailing options unprompted — that's the senior-signal part.
- Know the relationship: throttle is debounce with `maxWait` equal to the interval — lodash literally implements it that way.

## code.python
```python
# Same patterns with a monotonic clock and threading timers.
import threading, time

def debounce(wait):
    def deco(fn):
        timer = None
        def wrapper(*args, **kwargs):
            nonlocal timer
            if timer:
                timer.cancel()                 # reset on every call
            timer = threading.Timer(wait, fn, args, kwargs)
            timer.start()
        return wrapper
    return deco

def throttle(wait):
    def deco(fn):
        last = 0.0
        def wrapper(*args, **kwargs):
            nonlocal last
            now = time.monotonic()
            if now - last >= wait:             # leading edge
                last = now
                fn(*args, **kwargs)
        return wrapper
    return deco

@debounce(0.3)
def search(q): print("searching", q)

@throttle(0.1)
def on_scroll(y): print("scroll", y)
```

## code.javascript
```javascript
// Interview-grade debounce: trailing edge, cancel/flush, this+args.
function debounce(fn, wait) {
  let timer = null, lastArgs, lastThis;
  function debounced(...args) {
    lastArgs = args; lastThis = this;
    clearTimeout(timer);                       // reset on every call
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
    }, wait);
  }
  debounced.cancel = () => { clearTimeout(timer); timer = null; };
  debounced.flush = () => {
    if (timer) { debounced.cancel(); fn.apply(lastThis, lastArgs); }
  };
  return debounced;
}

// Throttle: leading + trailing, at most one pending trailing call.
function throttle(fn, wait) {
  let lastRun = 0, timer = null, lastArgs, lastThis;
  return function (...args) {
    lastArgs = args; lastThis = this;
    const now = Date.now();
    if (now - lastRun >= wait) {
      lastRun = now;
      fn.apply(lastThis, lastArgs);            // leading edge
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        lastRun = Date.now();
        fn.apply(lastThis, lastArgs);          // trailing edge, latest args
      }, wait - (now - lastRun));
    }
  };
}

input.addEventListener("input", debounce((e) => api.search(e.target.value), 300));
window.addEventListener("scroll", throttle(updateProgressBar, 100));
```

## code.java
```java
// Same shapes with ScheduledExecutorService.
import java.util.concurrent.*;

class RateLimiters {
    private final ScheduledExecutorService ses =
        Executors.newSingleThreadScheduledExecutor();
    private ScheduledFuture<?> pending;
    private long lastRun = 0;

    synchronized Runnable debounce(Runnable fn, long waitMs) {
        return () -> {
            synchronized (this) {
                if (pending != null) pending.cancel(false); // reset timer
                pending = ses.schedule(fn, waitMs, TimeUnit.MILLISECONDS);
            }
        };
    }

    synchronized Runnable throttle(Runnable fn, long waitMs) {
        return () -> {
            synchronized (this) {
                long now = System.currentTimeMillis();
                if (now - lastRun >= waitMs) {              // leading edge
                    lastRun = now;
                    fn.run();
                }
            }
        };
    }
}
```

## code.cpp
```cpp
// Single-threaded simulation: replay an event timeline through both.
#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> events = {0, 30, 60, 90, 120, 400, 430};  // event times (ms)
    int wait = 100;

    // Debounce (trailing): fires wait ms after the last event of a burst.
    vector<int> debounced;
    for (size_t i = 0; i < events.size(); i++) {
        bool last = i + 1 == events.size() ||
                    events[i + 1] - events[i] >= wait;     // quiet gap follows
        if (last) debounced.push_back(events[i] + wait);
    }

    // Throttle (leading): fires if wait ms passed since the last fire.
    vector<int> throttled;
    int lastRun = -wait;
    for (int t : events)
        if (t - lastRun >= wait) { throttled.push_back(t); lastRun = t; }

    for (int t : debounced) cout << t << " ";  // 220 530
    cout << "\n";
    for (int t : throttled) cout << t << " ";  // 0 120 400
    cout << "\n";
}
```
$bdy$
)
) AS t(slug, module_slug, title, subtitle, difficulty, pos, est, metadata, status, body_raw)
LOOP
  sections := '{}'::jsonb;
  codes := '{}'::jsonb;
  cur_name := NULL;
  cur_lines := ARRAY[]::text[];
  lines := string_to_array(r.body_raw || E'\n## __END__', E'\n');
  FOREACH ln IN ARRAY lines LOOP
    IF ln ~ '^##\s+[A-Za-z0-9_.]+\s*$' THEN
      IF cur_name IS NOT NULL THEN
        cleaned := regexp_replace(regexp_replace(array_to_string(cur_lines, E'\n'), '^\s+', ''), '\s+$', '');
        IF cur_name LIKE 'code.%' THEN
          lang := substring(cur_name from 6);
          code_lines := ARRAY[]::text[];
          in_fence := false;
          fence_done := false;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            IF NOT fence_done THEN
              IF NOT in_fence THEN
                IF cl LIKE '```%' THEN in_fence := true; END IF;
              ELSIF cl LIKE '```%' THEN
                fence_done := true;
              ELSE
                code_lines := array_append(code_lines, cl);
              END IF;
            END IF;
          END LOOP;
          IF in_fence THEN
            codes := codes || jsonb_build_object(lang, regexp_replace(array_to_string(code_lines, E'\n'), '\s+$', ''));
          ELSE
            codes := codes || jsonb_build_object(lang, cleaned);
          END IF;
        ELSIF cur_name = 'complexity' THEN
          obj := '{}'::jsonb;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            km := regexp_match(cl, '^([a-zA-Z]+):\s*(.*)$');
            IF km IS NOT NULL THEN
              obj := obj || jsonb_build_object(km[1], regexp_replace(km[2], '\s+$', ''));
            END IF;
          END LOOP;
          sections := sections || jsonb_build_object('complexity', obj);
        ELSIF cleaned LIKE '- %' THEN
          arr := '[]'::jsonb;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            IF cl LIKE '- %' THEN
              arr := arr || to_jsonb(regexp_replace(regexp_replace(substring(cl from 3), '^\s+', ''), '\s+$', ''));
            END IF;
          END LOOP;
          sections := sections || jsonb_build_object(cur_name, arr);
        ELSE
          sections := sections || jsonb_build_object(cur_name, cleaned);
        END IF;
      END IF;
      cur_name := regexp_replace(ln, '^##\s+([A-Za-z0-9_.]+)\s*$', '\1');
      cur_lines := ARRAY[]::text[];
    ELSIF cur_name IS NOT NULL THEN
      cur_lines := array_append(cur_lines, ln);
    END IF;
  END LOOP;
  sections := sections || jsonb_build_object('estimatedReadMinutes', r.est);
  INSERT INTO "PGcode_concepts" (slug, module_slug, title, subtitle, difficulty, "position", body, code, metadata, status)
  VALUES (r.slug, r.module_slug, r.title, r.subtitle, r.difficulty, r.pos, sections, codes, r.metadata, r.status)
  ON CONFLICT (slug) DO UPDATE SET
    module_slug = EXCLUDED.module_slug,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    difficulty = EXCLUDED.difficulty,
    "position" = EXCLUDED."position",
    body = EXCLUDED.body,
    code = EXCLUDED.code,
    metadata = EXCLUDED.metadata,
    status = EXCLUDED.status,
    updated_at = now();
END LOOP;
END
$do$;
