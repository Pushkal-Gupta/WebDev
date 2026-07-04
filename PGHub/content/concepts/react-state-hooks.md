---
slug: react-state-hooks
module: react-frontend
title: State & the useState Hook
subtitle: How a component remembers a value between renders, and why calling the setter schedules a fresh render instead of editing a variable in place.
difficulty: Beginner
position: 2
estimatedReadMinutes: 13
prereqs: [react-components-props]
relatedProblems: []
references:
  - title: "React — State: A Component's Memory"
    url: "https://react.dev/learn/state-a-components-memory"
    type: article
  - title: "React — useState reference"
    url: "https://react.dev/reference/react/useState"
    type: article
  - title: "React — Render and Commit"
    url: "https://react.dev/learn/render-and-commit"
    type: article
  - title: "React — Rules of Hooks"
    url: "https://react.dev/reference/rules/rules-of-hooks"
    type: article
  - title: "React — Queueing a Series of State Updates"
    url: "https://react.dev/learn/queueing-a-series-of-state-updates"
    type: article
status: published
---

## intro
A component is a function that returns markup, and functions forget everything the moment they return. So how does a counter remember it is at 7 after you click it seven times? The answer is **state**: a value React keeps alive outside the function, handed back to you on every call. You reach for it with the **`useState` Hook**, which returns the current value plus a **setter** — and calling that setter is what tells React to run your function again and paint the new value on screen. State is the difference between a static picture and something that reacts.

## whyItMatters
Everything interactive on a page is state changing over time: a form's typed text, a toggled dark mode, an open dropdown, items in a cart, the tab you are viewing. Without state a component can only display the props it was handed and never respond to a click or a keypress. But state also trips up almost every beginner, because it does not behave like an ordinary variable — the value you read inside a render is a **frozen snapshot**, and the setter does not change it right there and then; it schedules a *future* render. Misunderstanding that one detail produces the classic bugs: UI that will not update, counters that jump by one when you expected two, and stale values captured inside callbacks. Getting the mental model right early saves hours of confusion later, and "explain how `useState` works" is one of the most common front-end interview questions.

## intuition
Think of a component's render as taking a **photograph**. Each time React calls your function, it develops one photo of the UI using the values that exist at that instant. The photo is fixed — nothing in it moves. If `count` is 3 when the photo is taken, then every reference to `count` inside that render is 3, including any click handler the render creates. The handler is part of the photograph; it captured the number 3 the moment the picture was taken.

Now, where does the number live between photos? Not in a local variable inside the function — those are born and die with each call. It lives in React, in a slot attached to this specific component instance, like a value written on a **whiteboard** that React keeps beside your component. When your function runs, `useState` walks over to the whiteboard and reads the current number back to you. That is why state *survives* re-renders while ordinary variables reset: the whiteboard outlives the function call.

Calling the setter — `setCount(4)` — does not run to the whiteboard and erase a 3 mid-render. Your current photo still shows 3; it is already developed and cannot change. Instead the setter tells React: "next time you take a photo of this component, write 4 on the whiteboard first." React **schedules a re-render**. On that next render your function runs again, `useState` reads 4 off the updated whiteboard, and a fresh photograph is developed showing 4. The screen updates because a new picture replaced the old one — not because the old picture was edited.

This is the whole model. A render is an immutable snapshot. State is memory that lives outside the snapshot. The setter swaps the memory and asks for a new snapshot. Once you see renders as a sequence of photographs rather than one mutable canvas, the surprising behaviors — why the screen did not change, why you saw the old value right after setting — stop being surprising.

## visualization
```
  render #1: React reads whiteboard -> count = 0 -> shows "0"
      |
      | user clicks the button
      v
  onClick fires -> setCount(1)
      |
      v
  React SCHEDULES a re-render (whiteboard now says 1)
      |            (this render's `count` is STILL 0 -- snapshot is frozen)
      v
  render #2: React calls the component again
      |
      v
  useState reads whiteboard -> count = 1 -> shows "1"
      |
      v
  new snapshot replaces the old one on screen  (0 -> 1)
```

## bruteForce
The tempting first attempt is a plain local variable: `let count = 0;` inside the component, with a click handler that does `count = count + 1`. Run it and nothing happens on screen. Two things defeat you. First, the assignment *does* change the variable — but React has no idea it changed, so it never re-runs the function, and the displayed markup never updates. Second, even if something else forced a re-render, the function would run top-to-bottom again and reset `count` back to 0, because a local variable is recreated on every call. A plain variable can neither trigger a render nor persist across one. You need a value React *owns* and *watches* — which is exactly what `useState` provides.

## optimal
Call `useState` at the top of your component: `const [count, setCount] = useState(0)`. The argument is the **initial value**, used only on the first render. It returns a two-element array you destructure into the **current value** (`count`) and a **setter** (`setCount`). The value is React's memory for this component instance; the setter is how you ask for a change.

Calling `setCount(next)` does two things: it stores `next` in React's slot, and it **schedules a re-render** of the component. It does not mutate `count` in the current scope — that snapshot stays frozen until the next render reads the updated value. This is why `console.log(count)` right after `setCount` still prints the old number; the new value only appears on the next render.

Treat state as **immutable by convention**: to update an object or array, build a *new* one and pass it in — `setItems([...items, newItem])`, not `items.push(newItem)`. React decides whether to re-render by comparing the new reference to the old, so mutating in place looks unchanged and the UI silently fails to update.

Two more essentials. **Batching**: multiple setter calls inside one event handler are collected and applied together in a single re-render, not one render per call. **Functional updates**: when the next value depends on the previous, pass a function — `setCount(c => c + 1)`. React feeds each queued update the freshest value, so calling it three times reliably adds three even though the snapshot's `count` never changed. Use it whenever you update based on the current state.

`useState` is for values a component *owns*. To **synchronize with the outside world** — subscriptions, timers, a fetch, the document title — use `useEffect(fn, deps)`, which runs after render and re-runs when its dependencies change. State drives the render; effects reach out from it.

Finally, the **Rules of Hooks**. Only call Hooks (1) **at the top level** — never inside conditions, loops, or nested functions — and (2) **from React function components or custom Hooks**. React does not identify your state by name; it tracks each Hook by the **order** it is called on every render. As long as the calls happen in the same sequence each time, React lines up render #2's first `useState` with render #1's first `useState`. Wrap a Hook in an `if` and the order shifts between renders, so React hands back the wrong slot — which is why the rule is absolute.

## complexity
time: Reading state is O(1) — a slot lookup. The real cost is the **re-render** each setter schedules: React re-runs the component function and diffs the returned tree, roughly O(size of that component's subtree) per update. Batching keeps multiple setters in one event to a single render pass.
space: O(1) per piece of state — one slot per `useState` call, retained for the life of the component instance. Snapshots are not stored; each render's values are transient.
notes: Frame the cost as "one re-render per state change (batched within an event)". Excess re-renders, not the read, are what you optimize — via batching, correct dependencies, and lifting or colocating state sensibly.

## pitfalls
- **Mutating state directly instead of replacing it.** `items.push(x)` then `setItems(items)` passes the same array reference, so React sees no change and skips the render. Fix: create a new value — `setItems([...items, x])` for arrays, `setObj({ ...obj, k: v })` for objects — and pass that.
- **Expecting state to update synchronously.** Reading `count` on the line right after `setCount(count + 1)` gives the old value, because the current render's snapshot is frozen; the new value only exists on the next render. Fix: compute the next value in a local variable if you need it now, and rely on the next render for the displayed value.
- **Stale closures over state.** A callback registered once (in a `setInterval`, an event listener, or an effect with the wrong deps) captures the state value from the render that created it and keeps using that stale number. Fix: use a functional update `setCount(c => c + 1)`, or list the state in the effect's dependency array so the closure is recreated.
- **Calling Hooks conditionally.** Putting `useState`/`useEffect` inside an `if`, a loop, or an early `return` changes the call order between renders, so React maps state to the wrong slot and behavior corrupts. Fix: call every Hook unconditionally at the top level; put the condition *inside* the Hook or in the returned JSX instead.
- **Assuming multiple setters in one handler cause multiple renders.** They are batched into one, and each plain `setCount(count + 1)` reads the same frozen snapshot, so three calls still add one. Fix: use functional updates when queuing dependent changes.

## interviewTips
- Explain the snapshot model out loud: a render is a frozen photograph, state lives in React outside it, and the setter schedules a *new* render rather than editing the current one. This single framing answers most `useState` follow-ups.
- When asked why a counter increments by one despite three `setCount(count + 1)` calls, point to batching plus the frozen snapshot, then show the fix with the functional updater `setCount(c => c + 1)`.
- Be ready to state the Rules of Hooks and *why* they exist — React tracks Hooks by call order, so conditional Hook calls misalign the slots between renders. Naming the underlying reason beats reciting the rule.

## keyTakeaways
- State is a component's memory that survives re-renders; `useState(initial)` returns the current value and a setter, and the initial value is used only on the first render.
- The setter schedules a re-render and does not change the current render's value — each render is an immutable snapshot, so update state by replacing values, never by mutating them in place.
- Only call Hooks at the top level of a React function, never conditionally, because React identifies each Hook by its call order across renders; use functional updates for changes that depend on the previous state.

## code.jsx
```jsx
import { useState } from 'react';

function Counter() {
  // `count` is React's memory for this component; `setCount` asks for a re-render.
  const [count, setCount] = useState(0);
  const [on, setOn] = useState(false);

  function addTwo() {
    // Functional updates: each reads the freshest queued value, so this
    // reliably adds 2 even though `count` is frozen inside this render.
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={addTwo}>+2</button>
      <button onClick={() => setOn(o => !o)}>
        {on ? 'On' : 'Off'}
      </button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

export default Counter;
```

## code.javascript
```javascript
// A tiny model of how useState + rendering actually works, in plain JS.
// React keeps state in an ordered array of "slots" and identifies each
// useState call by the ORDER it runs in -- that is why Hook order matters.

const slots = [];      // the "whiteboard": one slot per useState call
let cursor = 0;        // which slot the next useState call reads
let renderFn = null;   // the component function React will re-run

function useState(initial) {
  const i = cursor;                       // this call claims slot `i` by order
  if (slots[i] === undefined) slots[i] = initial;  // first render seeds it
  const setState = (next) => {
    // Support functional updates: setState(prev => ...)
    slots[i] = typeof next === 'function' ? next(slots[i]) : next;
    render();                             // schedule a fresh render
  };
  cursor += 1;
  return [slots[i], setState];
}

function render() {
  cursor = 0;          // reset the cursor so calls line up with the same slots
  renderFn();          // re-run the component top-to-bottom
}

// A "component": reads its state slots in the same order every render.
function Counter() {
  const [count, setCount] = useState(0);
  const [on, setOn] = useState(false);
  console.log('render -> count:', count, '| on:', on);
  // Expose the setters so our driver can simulate user clicks.
  Counter.click = () => setCount(c => c + 1);
  Counter.toggle = () => setOn(o => !o);
}

renderFn = Counter;
render();            // render #1 -> count: 0 | on: false
Counter.click();     // render #2 -> count: 1 | on: false
Counter.click();     // render #3 -> count: 2 | on: false
Counter.toggle();    // render #4 -> count: 2 | on: true
Counter.click();     // render #5 -> count: 3 | on: true
```
