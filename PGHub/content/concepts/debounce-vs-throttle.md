---
slug: debounce-vs-throttle
module: cs-tools-encodings
title: Debounce vs Throttle
subtitle: Two rate-limiting strategies for noisy event streams — wait for silence, or sample at a fixed cadence — and how to implement both from scratch.
difficulty: Intermediate
position: 87
estimatedReadMinutes: 9
prereqs: []
relatedProblems: []
references:
  - title: "CSS-Tricks — Debouncing and Throttling Explained Through Examples"
    url: "https://css-tricks.com/debouncing-throttling-explained-examples/"
    type: blog
  - title: "Lodash docs — _.debounce / _.throttle"
    url: "https://lodash.com/docs/#debounce"
    type: docs
  - title: "MDN — setTimeout"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout"
    type: docs
status: published
---

## intro
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
