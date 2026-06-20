---
slug: browser-event-loop
module: cs-tools-encodings
title: Browser Event Loop & Task Queues
subtitle: Macrotasks, microtasks, and requestAnimationFrame — the exact ordering rules behind every "why did this log first?" puzzle.
difficulty: Advanced
position: 86
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Jake Archibald — Tasks, microtasks, queues and schedules"
    url: "https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/"
    type: blog
  - title: "HTML Living Standard — Event loops (processing model)"
    url: "https://html.spec.whatwg.org/multipage/webappapis.html#event-loops"
    type: docs
  - title: "MDN — The event loop"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop"
    type: docs
status: published
---

## intro
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
