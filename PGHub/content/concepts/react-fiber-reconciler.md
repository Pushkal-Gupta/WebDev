---
slug: react-fiber-reconciler
module: cs-tools-encodings
title: React Fiber Reconciler
subtitle: How React turned the call stack into a linked-list data structure so rendering can pause, resume, and reprioritize mid-flight.
difficulty: Advanced
position: 82
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "acdlite/react-fiber-architecture — the original Fiber design doc"
    url: "https://github.com/acdlite/react-fiber-architecture"
    type: repo
  - title: "Lin Clark — A Cartoon Intro to Fiber (React Conf 2017)"
    url: "https://www.youtube.com/watch?v=ZCuYPiUIONs"
    type: video
  - title: "react.dev — Render and Commit (the two-phase model)"
    url: "https://react.dev/learn/render-and-commit"
    type: docs
  - title: "JSer.dev — How does React traverse Fiber tree internally"
    url: "https://jser.dev/react/2022/01/16/fiber-traversal-in-react/"
    type: blog
status: published
---

## intro
Fiber is the reconciler React has shipped since version 16. It replaces recursive, run-to-completion rendering with an explicit data structure: every component instance becomes a **fiber node** carrying `child`, `sibling`, and `return` pointers, and rendering becomes a loop that processes one fiber at a time. Because the loop owns its own "stack," React can pause after any unit of work, let the browser paint or handle input, then resume — or throw the work away and restart at a higher priority.

## whyItMatters
Every concurrent feature in modern React sits on Fiber: `useTransition`, `useDeferredValue`, Suspense, streaming SSR, selective hydration, time slicing. Fiber also explains behaviors that look like bugs until you know the model — render functions running twice, effects firing after paint, a slow typeahead staying responsive while a giant list re-renders behind it. Senior frontend interviews probe exactly this layer: "what happens between `setState` and the pixel changing?" The answer is the fiber work loop, and being able to walk through it node by node separates "uses React" from "understands React."

## intuition
Start with the problem the old reconciler couldn't solve. Pre-Fiber React rendered recursively: `render(parent)` called `render(child)` called `render(grandchild)`, all on the native call stack, synchronously, to completion. A 200ms render of a deep tree meant 200ms where the browser could not paint, scroll, or respond to a keystroke — the stack cannot be paused halfway and resumed later.

Fiber's core move is to **reify the call stack as a heap data structure**. Instead of stack frames, you get fiber nodes. Each fiber points to its first `child`, its next `sibling`, and its parent (`return`). Recursion becomes pointer-chasing: go down via `child`, across via `sibling`, back up via `return`. Crucially, "where am I in the traversal" is now just a single variable — `workInProgress` — instead of an implicit stack of frames. Save that one pointer and you can stop after any node, yield to the browser, and pick up exactly where you left off on the next idle slice.

Two more ideas complete the picture. **Double buffering**: React keeps two trees — `current` (what's on screen) and `workInProgress` (the draft being built). Each fiber has an `alternate` pointer to its counterpart, so nodes are recycled between renders instead of reallocated. The screen never shows a half-built tree; React swaps `root.current` to the finished draft in one atomic move, like flipping the back buffer in a game engine. **Priority lanes**: every update is tagged with a lane (a bit in a 31-bit bitmask) — sync clicks outrank transitions, transitions outrank idle work. A higher-priority update arriving mid-render can interrupt the draft, render its own update first, and let the abandoned lower-priority work restart afterward. Rendering becomes preemptible, like threads under an OS scheduler.

## visualization
```
Fiber tree pointers (child / sibling / return) and traversal order:

  fiber        child      sibling    return     beginWork#  completeWork#
  ---------    --------   --------   --------   ----------  -------------
  HostRoot     App        -          -          1           10
  App          Header     -          HostRoot   2           9
  Header       h1         Main       App        3           5
  h1           -          -          Header     4           4
  Main         List       -          App        6           8
  List         -          -          Main       7           7

Work loop (one unit of work per iteration):
  while (workInProgress !== null && !shouldYield()):
      beginWork(wip)        -> render component, diff children, return wip.child
      if wip.child == null: completeWork(wip), then try sibling, else climb return
  shouldYield() true after ~5ms  -> save workInProgress pointer, yield to browser
  next slice                     -> resume loop from the saved pointer

Double buffer:
  current tree  <--alternate-->  workInProgress tree
  commit phase: mutate DOM from flagged fibers, then root.current = finishedWork
```

## bruteForce
The naive mental model: "setState re-runs my component, React recursively re-renders everything below it, and the DOM updates — one synchronous pass, top to bottom." That is exactly how the pre-16 stack reconciler worked, and it is still a fine approximation for small trees. It breaks down at scale: the recursion is uninterruptible, so one expensive subtree blocks the main thread for its entire duration, every update has equal priority, and there is no way to abandon stale work when newer input arrives. Frame drops and janky typing are the symptom.

## optimal
The Fiber work loop runs in two strictly separated phases.

**Render phase (interruptible).** `performUnitOfWork` processes one fiber: `beginWork` calls the component function (or compares props for a bailout), reconciles its children against the current tree — this is where the virtual-DOM diff with keys happens — creates or reuses child fibers via `alternate`, and returns the first child as the next unit of work. When a fiber has no child, `completeWork` runs: it creates the real DOM instance for host fibers (not yet attached), bubbles up effect flags (Placement, Update, Deletion) so the commit phase can find dirty nodes without re-walking the whole tree, then moves to the sibling, or climbs `return` pointers completing parents as it goes. Between every unit, the loop checks `shouldYield()` — React's scheduler grants roughly 5ms slices, then yields so the browser can paint and handle events. The saved `workInProgress` pointer makes resumption trivial.

**Interruption and lanes.** When an update is scheduled, it's assigned a lane: discrete input gets `SyncLane`, hover/scroll continuations get `InputContinuousLane`, normal updates `DefaultLane`, `startTransition` work gets a transition lane, offscreen work goes idle. If a higher-priority lane arrives while a lower-priority draft is mid-render, React abandons that draft — nothing was committed, so nothing is inconsistent — renders the urgent lanes to completion, then restarts the transition render from scratch against the new `current` tree. This restart is why render functions must be pure: they may execute multiple times for one eventual commit.

**Commit phase (synchronous, never interrupted).** Walking only the flagged fibers, React runs deletions and `insertBefore`/property mutations, swaps `root.current = finishedWork` (the double-buffer flip), then runs layout effects synchronously and passive effects (`useEffect`) after paint. Splitting an interruptible render from an atomic commit is the entire trick: all the slow work can be sliced and discarded, while the user-visible mutation stays consistent and instantaneous.

## complexity
time: O(n) render phase over fibers visited; commit is O(f) for f flagged fibers
space: O(n) per tree, ~2x with double buffering (alternates are recycled)
notes: Bailouts — React.memo, identical element references, no pending lanes in a subtree — skip whole subtrees, so practical render cost is O(changed region), not O(app). The commit phase finds dirty nodes through bubbled-up effect flags rather than re-walking the tree. Time slicing bounds main-thread blocking per ~5ms slice, not total work: total CPU can actually increase when a low-priority render is interrupted and restarted, which is the deliberate trade — responsiveness over throughput.

## pitfalls
- **Assuming render runs exactly once per commit.** Interrupted renders replay, and StrictMode double-invokes components on purpose to surface this. Any side effect in the render body (logging, mutation, network calls, `Math.random()` into state) will fire an unpredictable number of times. Side effects belong in effects or event handlers.
- **Believing time slicing makes slow components fast.** Yielding happens **between** fibers, never inside one. A single component that takes 80ms to render still blocks the main thread for 80ms. Fiber buys responsiveness across components; expensive single components still need memoization, virtualization, or splitting.
- **Treating mutation of the previous tree as safe.** Mutating props or state objects in place can leak into the `current` tree through `alternate` reuse, producing renders that "see" half-updated data. Always produce new objects for changed state.
- **Expecting `useEffect` to run before paint.** Passive effects are scheduled after the commit paints. Reading layout and synchronously re-rendering belongs in `useLayoutEffect`; doing it in `useEffect` causes a visible flicker.
- **Confusing the phases when debugging.** A component function appearing in a profiler flame chart is render phase (may be discarded); DOM not matching state means a commit-phase or key/reconciliation issue. Knowing which phase misbehaved cuts debugging time in half.

## interviewTips
- Walk the pipeline in one breath: "setState enqueues an update with a lane, the scheduler picks the highest-priority lane, the work loop builds a workInProgress tree one fiber at a time via beginWork/completeWork, yielding every ~5ms, then the commit phase synchronously mutates the DOM and swaps root.current." Hitting those keywords in order signals real understanding.
- Be ready for "why can renders be thrown away safely?" — because the render phase never touches the DOM; only commit does. Purity of render is the invariant that makes interruption free.
- Contrast stack vs Fiber crisply: recursion keeps traversal state on the native call stack (uninterruptible); Fiber keeps it in `child`/`sibling`/`return` pointers plus one `workInProgress` variable (pausable, resumable, abortable). That one sentence is the whole architecture.

## code.python
```python
# Teaching skeleton of the Fiber work loop: linked-list traversal
# with yielding, not real React.

import time

class Fiber:
    def __init__(self, name, render=None):
        self.name = name
        self.render = render          # produces child descriptions
        self.child = None
        self.sibling = None
        self.parent = None            # 'return' pointer (reserved word)
        self.alternate = None
        self.flags = set()

SLICE_MS = 5

def should_yield(slice_start):
    return (time.monotonic() - slice_start) * 1000 > SLICE_MS

def begin_work(fiber):
    # call the component, reconcile children, return first child
    if fiber.render:
        fiber.render(fiber)
    return fiber.child

def complete_work(fiber):
    # create host instance, bubble effect flags upward
    if fiber.parent:
        fiber.parent.flags |= fiber.flags

def perform_unit_of_work(fiber):
    nxt = begin_work(fiber)
    if nxt:
        return nxt
    while fiber:
        complete_work(fiber)
        if fiber.sibling:
            return fiber.sibling
        fiber = fiber.parent
    return None

def work_loop(root):
    wip = root
    while wip:
        slice_start = time.monotonic()
        while wip and not should_yield(slice_start):
            wip = perform_unit_of_work(wip)
        if wip:
            # yield to the "browser"; wip pointer preserves our place
            time.sleep(0)
    commit(root)

def commit(root):
    # synchronous, uninterruptible: flush flagged fibers to the host
    print("commit:", root.flags)
```

## code.javascript
```javascript
// Miniature Fiber loop mirroring React's shape:
// performUnitOfWork + child/sibling/return traversal + yielding.

function createFiber(name, render) {
  return { name, render, child: null, sibling: null, return: null,
           alternate: null, flags: 0 };
}

let workInProgress = null;
const SLICE_MS = 5;

function shouldYield(sliceStart) {
  return performance.now() - sliceStart > SLICE_MS;
}

function beginWork(fiber) {
  if (fiber.render) fiber.render(fiber);   // reconcile children here
  return fiber.child;
}

function completeWork(fiber) {
  if (fiber.return) fiber.return.flags |= fiber.flags;
}

function performUnitOfWork(fiber) {
  const next = beginWork(fiber);
  if (next) return next;
  let node = fiber;
  while (node) {
    completeWork(node);
    if (node.sibling) return node.sibling;
    node = node.return;
  }
  return null;
}

function workLoop(deadlineStart = performance.now()) {
  while (workInProgress && !shouldYield(deadlineStart)) {
    workInProgress = performUnitOfWork(workInProgress);
  }
  if (workInProgress) {
    // paused, not finished: schedule the next slice
    setTimeout(() => workLoop(), 0);
  } else {
    commitRoot();
  }
}

function commitRoot() {
  // synchronous: apply flagged mutations, then swap root.current
}

function renderRoot(rootFiber) {
  workInProgress = rootFiber;   // a fresh workInProgress tree via alternates
  workLoop();
}
```

## code.java
```java
import java.util.function.Consumer;

class Fiber {
    String name;
    Consumer<Fiber> render;     // builds children when invoked
    Fiber child, sibling, parent, alternate;
    int flags;
    Fiber(String name, Consumer<Fiber> render) {
        this.name = name; this.render = render;
    }
}

class FiberLoop {
    static final long SLICE_NANOS = 5_000_000L;
    Fiber workInProgress;

    Fiber beginWork(Fiber f) {
        if (f.render != null) f.render.accept(f);
        return f.child;
    }

    void completeWork(Fiber f) {
        if (f.parent != null) f.parent.flags |= f.flags;
    }

    Fiber performUnitOfWork(Fiber f) {
        Fiber next = beginWork(f);
        if (next != null) return next;
        Fiber node = f;
        while (node != null) {
            completeWork(node);
            if (node.sibling != null) return node.sibling;
            node = node.parent;
        }
        return null;
    }

    void workLoop(Fiber root) {
        workInProgress = root;
        while (workInProgress != null) {
            long sliceStart = System.nanoTime();
            while (workInProgress != null
                    && System.nanoTime() - sliceStart < SLICE_NANOS) {
                workInProgress = performUnitOfWork(workInProgress);
            }
            // between slices the host environment paints / handles input;
            // the saved workInProgress pointer is the whole "call stack"
        }
        commit(root);
    }

    void commit(Fiber root) {
        // synchronous phase: flush flagged fibers, swap current tree
    }
}
```

## code.cpp
```cpp
#include <chrono>
#include <functional>
#include <string>

struct Fiber {
    std::string name;
    std::function<void(Fiber*)> render;   // reconciles children
    Fiber* child = nullptr;
    Fiber* sibling = nullptr;
    Fiber* parent = nullptr;              // the 'return' pointer
    Fiber* alternate = nullptr;
    unsigned flags = 0;
};

using Clock = std::chrono::steady_clock;
constexpr auto kSlice = std::chrono::milliseconds(5);

Fiber* beginWork(Fiber* f) {
    if (f->render) f->render(f);
    return f->child;
}

void completeWork(Fiber* f) {
    if (f->parent) f->parent->flags |= f->flags;
}

Fiber* performUnitOfWork(Fiber* f) {
    if (Fiber* next = beginWork(f)) return next;
    for (Fiber* node = f; node; node = node->parent) {
        completeWork(node);
        if (node->sibling) return node->sibling;
    }
    return nullptr;
}

void commitRoot(Fiber* root) {
    // synchronous: apply flagged mutations, flip current <-> workInProgress
}

void workLoop(Fiber* root) {
    Fiber* wip = root;
    while (wip) {
        auto sliceStart = Clock::now();
        while (wip && Clock::now() - sliceStart < kSlice) {
            wip = performUnitOfWork(wip);
        }
        // slice expired: yield to the host, resume from the saved wip pointer
    }
    commitRoot(root);
}
```
