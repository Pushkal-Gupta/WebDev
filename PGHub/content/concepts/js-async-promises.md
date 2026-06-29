---
slug: js-async-promises
module: javascript-language
title: Async & Promises
subtitle: From callbacks to promises to async/await — and the event loop underneath, where synchronous code runs first, then microtasks drain before the next macrotask.
difficulty: Intermediate
position: 3
estimatedReadMinutes: 15
prereqs: [js-functions-closures]
relatedProblems: []
references:
  - title: "MDN — Using promises"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises"
    type: docs
  - title: "MDN — async function"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function"
    type: docs
  - title: "javascript.info — Microtasks"
    url: "https://javascript.info/microtask-queue"
    type: article
  - title: "javascript.info — Event loop: microtasks and macrotasks"
    url: "https://javascript.info/event-loop"
    type: article
status: published
---

## intro
JavaScript runs on a **single thread**, so it can't simply stop and wait for a network request or a timer — that would freeze everything. Instead it schedules slow work to finish *later* and keeps running. Three generations of syntax express this: **callbacks** (pass a function to run when the work is done), **promises** (an object representing a future value you can chain), and **async/await** (write asynchronous code that *reads* like synchronous code). Under all three sits the **event loop**, the scheduler that decides what runs next — and the order it picks is the source of most async surprises.

## whyItMatters
Almost everything interesting a program does — fetch data, read a file, wait for a click, query a database — is asynchronous, so you cannot avoid this model. Get it wrong and you get bugs that are maddening precisely because they're about *timing*: a value that's `undefined` because you read it before the promise resolved, an error that vanishes because nobody caught a rejection, a "why did this log before that?" mystery that's really a microtask-versus-macrotask ordering question. The exact ordering rule — sync code first, then *all* microtasks, then one macrotask, repeat — is one of the most common senior-level interview questions because it reveals whether you actually understand the runtime. Learn it once and async stops being guesswork.

## intuition
The event loop is a simple machine with three parts: the **call stack** (the functions currently running), the **macrotask queue** (callbacks from `setTimeout`, I/O, events), and the **microtask queue** (promise reactions — `.then` callbacks and everything after an `await`). The loop's rule is strict and worth memorizing: **run all synchronous code to completion; then drain the entire microtask queue; then take exactly one macrotask; then drain microtasks again; repeat.** Microtasks always cut the line ahead of the next macrotask.

That's why `setTimeout(fn, 0)` does *not* run immediately — it's a macrotask, parked behind every microtask. A `Promise.resolve().then(fn)` scheduled later still runs *first*, because `.then` is a microtask. So sync code prints, then promise callbacks, then the timer — even when the timer was queued earlier and asked for zero delay.

Now layer the syntax on top. A **callback** is just a function you hand off to be called later; nesting several leads to the "pyramid of doom" and scattered error handling. A **promise** is an object in one of three states — pending, fulfilled, or rejected — that lets you attach `.then` for success and `.catch` for failure, and chain them into a flat sequence instead of a pyramid. **async/await** is sugar over promises: marking a function `async` makes it return a promise, and `await` *pauses* that function until the awaited promise settles, then resumes it — as a microtask — with the resolved value, or throws the rejection so a plain `try/catch` can handle it. The mental model: `await` is "park this function, let the event loop run other things, and wake me when the promise is ready." Nothing blocks the thread; the function is suspended, not the program.

## visualization
```
ONE TICK of the event loop:
  ┌── call stack ──┐   ┌ microtasks (.then, after await) ┐   ┌ macrotasks (setTimeout, I/O) ┐
  │ run sync code  │   │ drained FULLY before any        │   │ ONE taken per loop turn,     │
  │ to completion  │   │ macrotask runs                  │   │ after microtasks are empty   │
  └───────┬────────┘   └──────────────┬──────────────────┘   └──────────────┬───────────────┘
          │  stack empties             │  all run first                      │  then one of these
          └────────────────────────────┴────────────  loop repeats  ─────────┘
  console.log('A'); setTimeout(...'B',0); Promise.then(...'C'); console.log('D');
  output order ->  A   D   C   B        (sync A,D; microtask C; macrotask B)
```

## bruteForce
The original async style is the **callback**: pass a function to run when the work finishes. One level is fine; the trouble starts when results depend on each other, and you nest callback inside callback inside callback — the "pyramid of doom" that drifts off the right edge of the screen. Error handling is the real pain: each callback must check for its own error (the Node `(err, result)` convention), and a thrown exception inside an async callback won't be caught by a surrounding `try/catch`, because by the time it runs the original stack is long gone. You can write correct callback code, but sequencing several async steps and handling their errors uniformly is genuinely hard, and the nesting hides the logic.

## optimal
Prefer **async/await** for sequential async logic, and reach for promise combinators when you need concurrency. Marking a function `async` and using `await` lets you write asynchronous steps as a flat, top-to-bottom sequence — `const a = await stepOne(); const b = await stepTwo(a);` — that reads exactly like synchronous code, with ordinary `try/catch` for errors and ordinary `return` for results. This collapses the callback pyramid into a straight line and unifies error handling: a rejected promise becomes a thrown exception you catch once.

The key optimization is recognizing when steps are **independent**. Awaiting them one after another runs them in series — `await a; await b;` waits for `a` to finish before even starting `b`. If they don't depend on each other, start them together and await the group: `const [x, y] = await Promise.all([fetchX(), fetchY()]);` fires both immediately and waits for both, often halving the wall-clock time. Use `Promise.all` when you need every result (it rejects fast if any one fails), `Promise.allSettled` when you want every outcome regardless of failures, and `Promise.race`/`Promise.any` when the first to finish (or first to succeed) is what you want. Always handle rejection — an unhandled promise rejection is a silent bug — either with `try/catch` around your `await`s or a `.catch` on the chain. And remember the runtime underneath: `await` yields to the event loop, so other queued work runs while you wait, but the resumption is a microtask, which is why awaited continuations run before pending timers. The combined rule of thumb: `async/await` for readability, `Promise.all` to parallelize independent work, and one consistent error boundary so no rejection escapes.

## complexity
time: Scheduling a callback, creating a promise, or awaiting one is O(1). The asynchronous *work itself* (a request, a timer) takes however long it takes — that latency is not CPU time and doesn't block the thread. Running N independent tasks with `Promise.all` takes about as long as the *slowest* one; awaiting them in series takes the *sum* of their durations.
space: Each pending promise and each suspended async function holds O(1) state (its captured variables and continuation) until it settles. A queue of K scheduled microtasks or macrotasks holds O(K) pending callbacks. Awaiting a large array of promises keeps all of them alive at once — O(N) — until they settle.
notes: The single thread means CPU-bound work still blocks everything — async only helps with *waiting*, not with computation. A long synchronous loop freezes timers, promises, and the UI alike, because nothing else can run until the stack clears.

## pitfalls
- **`setTimeout(fn, 0)` is not immediate.** It's a macrotask, so every pending microtask (including awaited continuations) runs first. If you need "after the current code, before the next timer," use a microtask (`Promise.resolve().then`/`queueMicrotask`), not a zero-delay timer.
- **Forgetting `await` returns the promise, not the value.** `const x = fetchThing();` (no `await`) makes `x` a pending promise; `x + 1` is `"[object Promise]1"` or `NaN`. Always `await` (inside an `async` function) or chain `.then`.
- **Unhandled rejections vanish quietly.** A rejected promise with no `.catch` and no surrounding `try/catch` is a silent failure (and a process warning in Node). Put an error boundary on every async path.
- **Awaiting independent tasks in series wastes time.** `await a(); await b();` runs them sequentially even when they don't depend on each other. Use `await Promise.all([a(), b()])` to run them concurrently.
- **`await` inside a `forEach` doesn't wait.** `arr.forEach(async x => await f(x))` fires all the callbacks without awaiting them — `forEach` ignores the returned promises. Use a `for…of` loop with `await`, or `await Promise.all(arr.map(f))`.

## interviewTips
- Recite the ordering rule: "sync code runs to completion, then the entire microtask queue drains, then one macrotask, then microtasks again." Be ready to predict the output of a mix of `console.log`, `setTimeout(…,0)`, and `Promise.then`.
- Explain what `async`/`await` actually is: "`async` makes a function return a promise; `await` pauses it until the awaited promise settles and resumes it as a microtask." Stress that it's sugar over promises, not a new mechanism.
- Know when to parallelize: "independent awaits should be `Promise.all`, not sequential `await`s." Naming `allSettled`, `race`, and `any` and when each fits signals depth.

## keyTakeaways
- The event loop runs all synchronous code first, then drains every microtask (promise reactions, post-`await` continuations) before taking a single macrotask (`setTimeout`, I/O) — microtasks always jump the queue.
- Promises model a future value in pending/fulfilled/rejected states; `async`/`await` is readable sugar over them, with `await` pausing a function until its promise settles and `try/catch` handling rejection.
- Run independent async work concurrently with `Promise.all` (sum-of-durations becomes max-of-durations), and always attach an error boundary so no rejection goes unhandled.

## code.javascript
```javascript
// Synchronous code runs first, to completion, before ANY async callback.
console.log("1: sync start");

setTimeout(() => console.log("4: setTimeout (macrotask)"), 0);

Promise.resolve().then(() => console.log("3: promise (microtask)"));

console.log("2: sync end");
// So far the order will be: 1, 2 (sync), then 3 (microtask), then 4 (macrotask).

// async/await is sugar over promises: `await` pauses the async function and
// resumes it as a microtask once the awaited promise settles.
function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function run() {
  const a = await delay(10, 5);
  const b = await delay(10, 7);
  console.log("5: awaited sum:", a + b); // 12
  try {
    await Promise.reject(new Error("boom"));
  } catch (e) {
    console.log("6: caught:", e.message); // boom
  }
}
run();
```

## code.python
```python
import asyncio

# async def + await is Python's direct analog to JS async/await.
async def delay(seconds, value):
    await asyncio.sleep(seconds)
    return value

async def run():
    print("1: start")
    # asyncio.gather runs both concurrently — the analog of Promise.all.
    a, b = await asyncio.gather(delay(0.01, 5), delay(0.01, 7))
    print("2: results:", a, b, "sum", a + b)   # 5 7 sum 12
    try:
        raise ValueError("boom")
    except ValueError as e:
        print("3: caught:", e)                 # boom

asyncio.run(run())
```

## code.java
```java
import java.util.concurrent.*;

public class AsyncDemo {
    static CompletableFuture<Integer> delay(int value) {
        return CompletableFuture.supplyAsync(() -> {
            try { Thread.sleep(10); } catch (InterruptedException ignored) {}
            return value;
        });
    }

    public static void main(String[] args) throws Exception {
        System.out.println("1: start");
        CompletableFuture<Integer> a = delay(5);
        CompletableFuture<Integer> b = delay(7);
        int sum = a.thenCombine(b, Integer::sum).get(); // wait for both (concurrent)
        System.out.println("2: sum: " + sum);           // 12

        try {
            CompletableFuture.<Integer>failedFuture(new RuntimeException("boom")).get();
        } catch (ExecutionException e) {
            System.out.println("3: caught: " + e.getCause().getMessage()); // boom
        }
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <future>
#include <thread>
#include <chrono>
#include <stdexcept>
using namespace std;

future<int> delay(int value) {
    return async(launch::async, [value]() {
        this_thread::sleep_for(chrono::milliseconds(10));
        return value;
    });
}

int main() {
    cout << "1: start\n";
    auto a = delay(5);
    auto b = delay(7);                  // both run concurrently
    int sum = a.get() + b.get();        // wait for both
    cout << "2: sum: " << sum << "\n";  // 12

    try {
        auto bad = async(launch::async, []() -> int {
            throw runtime_error("boom");
        });
        bad.get();                      // the exception is rethrown here
    } catch (const exception& e) {
        cout << "3: caught: " << e.what() << "\n"; // boom
    }
    return 0;
}
```
