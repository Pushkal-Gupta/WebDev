---
slug: react-data-fetching-effects
module: react-frontend
title: Effects & Data Fetching
subtitle: How useEffect synchronizes a component with the outside world — running after commit, cleaning up before the next run, and surviving the race between old and new requests.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: [react-state-hooks]
references:
  - title: "React — useEffect reference"
    url: "https://react.dev/reference/react/useEffect"
    type: article
  - title: "React — Synchronizing with Effects"
    url: "https://react.dev/learn/synchronizing-with-effects"
    type: article
  - title: "React — You Might Not Need an Effect"
    url: "https://react.dev/learn/you-might-not-need-an-effect"
    type: article
  - title: "React — Lifecycle of Reactive Effects"
    url: "https://react.dev/learn/lifecycle-of-reactive-effects"
    type: article
  - title: "MDN — AbortController"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
    type: article
status: published
---

## intro
Rendering is meant to be pure: given the same props and state, a component returns the same JSX and touches nothing outside itself. But real apps have to touch the outside world — fetch from a server, open a WebSocket, start a timer, focus an input, subscribe to the browser's online/offline events. An **Effect** is React's escape hatch for exactly that work: code that runs *after* the component has rendered and committed to the screen, synchronizing the component with some **external system**. `useEffect` is the hook that registers this code and tells React when to re-run it.

## whyItMatters
Data fetching is the single most common reason a component needs an Effect, and it is also where beginners get burned most often. Get the dependency array wrong and you either fetch on every keystroke, never re-fetch when the input changes, or fetch in an infinite loop that hammers the server. Forget cleanup and you leak subscriptions and let a slow, stale response overwrite the fresh one — a race condition that shows the *wrong* data with no error in sight. These bugs rarely crash; they quietly display incorrect state, which is worse. Understanding the Effect lifecycle — setup, dependency-driven re-run, cleanup — is what turns flaky data-loading code into something you can trust, and it is a guaranteed front-end interview topic.

## intuition
Think of an Effect as a **workstation you set up and tear down each shift**. When the component mounts, React runs your **setup** code: you open the connection, start the timer, kick off the fetch — you get the station ready to work. The function you *return* from the Effect is the **cleanup**: at the end of the shift you close the connection, clear the timer, cancel the request — you put everything back so the next shift starts clean. React runs cleanup before every re-run of the Effect *and* one final time when the component unmounts. Setup then cleanup, setup then cleanup, in a strict rhythm.

The **dependency array** is how you tell React which values the Effect actually reads from the surrounding render. React compares each dependency to its value from the previous render; if any changed, it tears down the old Effect (cleanup) and sets up a new one. An empty array `[]` means "nothing from render is used, so run setup once after mount and cleanup once on unmount." `[userId]` means "re-synchronize whenever `userId` changes." No array at all means "re-run after every single render" — almost never what you want.

Now the sharp edge: **the race condition**. Say the Effect fetches a user profile keyed on `userId`. The user clicks profile 3, then quickly clicks profile 5. Two fetches are now in flight. Networks are unpredictable, so the request for profile 3 might resolve *after* the request for profile 5. Without protection, the late-arriving profile-3 response calls `setState` last and overwrites the correct profile-5 data — the screen shows the old user. The fix rides on cleanup: when `userId` changes from 3 to 5, React runs the *old* Effect's cleanup first. That cleanup flips an `ignore` flag (or calls `AbortController.abort()`), so when the stale profile-3 response finally lands, its `if (!ignore)` guard is false and it silently drops itself. Cleanup is not just tidiness — it is how an Effect refuses to act on work that belongs to a version of the component that no longer exists.

## visualization
```
  TIME |  what React does                         Effect state
  -----+-----------------------------------------+---------------------
   t0  |  render (id = 3)                          pure, no side effects
   t1  |  commit to DOM                            screen shows id 3
   t2  |  EFFECT SETUP  -> fetch(id 3) starts      ignore = false
       |  ...user clicks id 5, state changes...
   t3  |  render (id = 5)                          pure
   t4  |  commit to DOM
   t5  |  CLEANUP (old)  -> ignore = true (abort)  fetch(3) disarmed
   t6  |  EFFECT SETUP  -> fetch(id 5) starts      new ignore = false
       |  ...fetch(3) finally resolves LATE...     guard false -> dropped
       |  ...fetch(5) resolves...                  setState(profile 5) OK
   t7  |  component unmounts
   t8  |  CLEANUP (final) -> ignore = true (abort) no stale write
```

## bruteForce
The naive approach fetches straight in the component body: `const data = await fetch(...)` inline, or a `useEffect` with **no dependency array and no cleanup**. Each has a distinct failure. Fetching in the body runs on every render and can't be awaited, so it either does nothing useful or loops forever as each response triggers a re-render that fetches again. A `useEffect` with no deps array re-fetches after *every* render — including the render its own `setState` caused — an infinite request loop. And with no cleanup, rapid input changes leave multiple fetches racing, so whichever resolves last wins, frequently painting stale data over fresh.

## optimal
The correct shape is `useEffect(setup, deps)` where `setup` returns a `cleanup` function. The dependency array is the contract: `[]` runs setup once after mount and cleanup once on unmount; `[a, b]` re-runs (cleanup-then-setup) whenever `a` or `b` changes by `Object.is` comparison; omitting the array re-runs after every render. List *every* reactive value the Effect reads — props, state, or values derived from them — and let the `react-hooks/exhaustive-deps` lint rule keep you honest. Lying to the dependency array is how you get stale closures reading yesterday's values.

For data fetching, model three pieces of state — the **loading / error / data triad**. Set `loading = true` and clear any prior error before the request, set `data` on success, set `error` on failure, and always clear `loading` at the end. This lets the UI render a spinner, an error message, or the result honestly instead of guessing.

Guard against out-of-order responses. The classic pattern declares `let ignore = false` at the top of the Effect, checks `if (!ignore) setData(result)` before every state write, and returns `() => { ignore = true }` as cleanup. Because React runs the previous Effect's cleanup before starting the next, an in-flight request from a stale render finds `ignore === true` and drops its result. The stronger tool is `AbortController`: create one per Effect, pass `controller.signal` to `fetch`, and return `() => controller.abort()` — this both ignores *and* cancels the network request, freeing the connection. Depend the Effect on the query key (`[userId]`) so it re-synchronizes exactly when the thing it fetches changes.

Finally, remember you often **don't need an Effect at all**. Data you can compute from existing props/state should be derived *during render*, not stored in state via an Effect. Work that happens in response to a user action (a click, a submit) belongs in the event handler, not an Effect. Effects are for synchronizing with external systems, not for reacting to renders you could have avoided. React's Strict Mode intentionally double-invokes Effects (setup, cleanup, setup) in development precisely to surface a missing or incorrect cleanup — if your Effect breaks when run twice, it has a bug.

## complexity
time: One setup and one cleanup per dependency change — O(1) React bookkeeping per commit, dominated entirely by the external work (a network round-trip is orders of magnitude slower than the Effect machinery). The dependency comparison is O(k) in the number of dependencies.
space: O(1) per Effect for the closure and cleanup reference React retains; a fetch adds the in-flight request plus its abort controller until it settles or is cancelled.
notes: The cost that matters is the **network round-trip and the race window** — the span between a stale request starting and the cleanup that disarms it. Cleanup closes that window; without it the window stays open until the slow response lands and corrupts state.

## pitfalls
- **Missing a dependency (stale closure).** Leaving `userId` out of `[]` freezes the Effect on the first render's value, so it never re-fetches and reads a stale variable. Fix: list every reactive value the Effect uses and obey the `react-hooks/exhaustive-deps` lint warning instead of silencing it.
- **No cleanup — leaks and races.** An Effect that subscribes or fetches without returning a cleanup leaks the subscription on unmount and lets stale responses overwrite fresh ones. Fix: return `() => { ignore = true }` or `() => controller.abort()` from every Effect that starts ongoing work.
- **Object / array / function dependencies recreated each render.** A dep like `{ id }` or an inline `() => {}` is a brand-new reference every render, so `Object.is` sees a change and the Effect loops forever. Fix: depend on primitives (`id`), or memoize the object/function with `useMemo` / `useCallback`.
- **Using an Effect for derivable or event-driven state.** Storing a filtered list in state via an Effect (instead of computing it during render), or fetching inside an Effect that mirrors a click, adds an extra render and a whole class of sync bugs. Fix: derive during render, and do action-triggered work in the event handler.

## interviewTips
- Explain the Effect lifecycle in order — setup after commit, cleanup before the next setup and on unmount — and connect the dependency array directly to *when* that cleanup-then-setup cycle fires. Interviewers want the rhythm, not just "it runs after render."
- Be ready to write the race-condition fix live: the `let ignore = false` flag with an `if (!ignore)` guard and a `return () => { ignore = true }` cleanup, and know that `AbortController` additionally cancels the request. Name *why* the race happens (responses resolve out of order).
- Know when NOT to use an Effect: derive from props/state during render, and put user-action logic in handlers. Citing "You Might Not Need an Effect" and Strict Mode's double-invoke as a cleanup smoke test signals real depth.

## keyTakeaways
- An Effect synchronizes a component with an external system: setup runs after commit, the returned cleanup runs before every re-run and on unmount, and the dependency array declares when that cycle repeats.
- Data fetching needs a loading/error/data state triad plus a guard against out-of-order responses — an `ignore` flag flipped in cleanup, or an `AbortController` that both ignores and cancels the stale request.
- Many "Effects" shouldn't exist: derive values during render and handle user actions in event handlers; reach for `useEffect` only when you genuinely touch the world outside React.

## code.jsx
```jsx
import { useState, useEffect } from 'react';

// Fetches a user profile whenever `userId` changes.
// Loading / error / data triad + a cleanup guard against out-of-order responses.
function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;                 // disarmed by cleanup on the next run
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!ignore) setData(json);     // stale response: ignore === true -> skip
      })
      .catch((err) => {
        if (!ignore && err.name !== 'AbortError') setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    // Cleanup: runs before the next fetch (userId changed) and on unmount.
    return () => {
      ignore = true;                    // ignore any result already in flight
      controller.abort();               // and actually cancel the request
    };
  }, [userId]);                         // re-synchronize when userId changes

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">Could not load: {error.message}</p>;
  if (!data) return null;
  return <h1>{data.name}</h1>;
}

export default UserProfile;
```

## code.javascript
```javascript
// Plain-JS model of the fetch race condition and how an `ignore` flag fixes it.
// Two "requests" for the same field: the STALE one is slow and resolves LAST.
// Without a guard it overwrites the fresh value; with a guard it drops itself.

function fakeFetch(label, ms) {
  return new Promise((resolve) => setTimeout(() => resolve(label), ms));
}

// No guard: whichever request resolves last wins, even if it is stale.
function withoutGuard() {
  const state = { value: 'empty' };

  // Request for "old" is slow (300ms); request for "new" is fast (100ms).
  fakeFetch('old', 300).then((v) => { state.value = v; });
  fakeFetch('new', 100).then((v) => { state.value = v; });

  setTimeout(() => {
    console.log('without guard -> final state:', state.value); // "old" (WRONG)
  }, 500);
}

// With a guard: switching to "new" runs cleanup for "old", flipping its flag.
function withGuard() {
  const state = { value: 'empty' };

  // Effect for "old" starts, then gets cleaned up when we switch to "new".
  let ignoreOld = false;
  fakeFetch('old', 300).then((v) => {
    if (!ignoreOld) state.value = v;   // late + ignored -> dropped
  });
  ignoreOld = true;                    // cleanup of the old Effect

  // Effect for "new" starts fresh.
  let ignoreNew = false;
  fakeFetch('new', 100).then((v) => {
    if (!ignoreNew) state.value = v;   // fresh -> applied
  });

  setTimeout(() => {
    console.log('with guard    -> final state:', state.value); // "new" (RIGHT)
  }, 500);
}

withoutGuard();
withGuard();
// Expected console output after ~500ms:
//   without guard -> final state: old
//   with guard    -> final state: new
```
