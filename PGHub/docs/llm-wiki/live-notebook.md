# live-notebook

The "live notebook" is the in-browser editable-code surface on a `/visualize/<slug>`
page: the reader edits JavaScript **and** a JSON data cell, and the visualization
re-renders live — no Run press needed. It's `InteractiveVisualizer.jsx` +
`interactiveTemplates.js`, distinct from the rich React `INTERACTIVE_VIZ`
component (see [`viz-component-patterns.md`](./viz-component-patterns.md)).

## How execution works (`InteractiveVisualizer.jsx`)

The user's code is compiled with `new Function('input', 'step', 'log', src)` and
run **in the browser** (no Judge0). Three things are injected:

- `input` — the JSON data cell, `JSON.parse`d and **deep-cloned per run**.
- `step(state, caption?)` — records one animation frame. Each call deep-clones a
  snapshot of `state` and pushes a frame; `caption` is the narration line.
- `log(...args)` — writes to the console pane; `console.log` is wired to it too.

Guards: `MAX_FRAMES = 600` (throws if exceeded — tighten the loop), and
`EXEC_TIMEOUT_MS = 1500` (throws on suspected infinite loop). Frames feed the same
`AlgoVisualizer` renderers used by the static walkthroughs.

```js
const fn = new Function('input', 'step', 'log',
  `"use strict";\nconst console = { log };\n${code}`);
fn(deepClone(parsedInput.value), step, log);
```

## Auto-run on edit (debounced)

A `useEffect` re-runs the code **550ms** after any code/input change, so the viz
updates as the reader types. There's also a manual Run button, a Reset (restores
template defaults), play/pause/step/scrub timeline controls, and a speed select.

## The renderers + the `step()` state shape

`template.renderer` is one of `'array' | 'graph' | 'window' | 'grid' | 'tree'`,
mapped by `pickRenderer` to a renderer exported from `AlgoVisualizer.jsx`. The
shape you pass to `step(state, …)` must match:

- **array** (`ArrayBarRenderer`): `{ array:number[], highlights:{[idx]:role},
  eliminated?:number[], pointers?, chip? }` — roles paint as `low/high/mid/match`.
- **graph** (`GraphRenderer`): `{ nodes:[{id,label,state?}], edges:[{a,b,state?}] }`
  — node states `current|visited|frontier|done`.
- **window** (`SlidingWindowRenderer`): `{ array, window:[l,r], … }`.
- **grid** (`NumberGridRenderer`): `{ grid:number[][], cellLabel? }` **or**
  `{ numbers, cols, state }`.
- **tree** (`TreeRenderer`): `{ tree:{value,left,right}, traversal?:[] }`.

`eliminated` may be an array or a `Set` — `normalizeFrame` converts arrays to Sets
so the renderer's `.has?.()` works either way. Each template also carries a
`stateHint` string shown in the "API available to your code" `<details>` panel.

## How a slug gets a notebook

Templates live in `INTERACTIVE_TEMPLATES` (the `T` object) in
`src/components/learn/interactiveTemplates.js`. Each entry:

```js
T['binary-search'] = {
  title: 'Binary search',
  description: 'Halve the search space at every step. Edit the code…',
  renderer: 'array',
  initialInput: { array: [1,3,5,7,9,11,13,15,17,19], target: 11 },
  stateHint: `// { array, highlights, eliminated? }`,
  initialCode: `const { array, target } = input;\n… step({…}, 'caption');`,
};
```

A `/visualize/<slug>` page surfaces the notebook when an `editorSlug` resolves
(`VizDetail` in `VisualizeIndex.jsx`): the slug itself if `INTERACTIVE_TEMPLATES[slug]`
exists, **else** via the alias map `STATIC_TO_INTERACTIVE` (top of `VisualizeIndex.jsx`)
which maps a static-viz slug to a sibling template slug. The "Editable code" chip
scrolls to the notebook. If a rich `INTERACTIVE_VIZ` component also exists for the
slug, that heroes above the notebook.

## When to write a template vs a rich viz

- **Live notebook** — best for *algorithms the reader should step through and tweak*
  (search, traversal, DP fill). The teaching value is editing the code and watching
  frames change.
- **Rich `INTERACTIVE_VIZ`** — best for *concepts you drag/slide* (a draggable
  derivative point, an eigenvector). Bespoke SVG, no code editing.

Many slugs have both. Don't write a notebook template for something that's purely a
parameter-drag — build the rich viz instead.

---
*Last updated: 2026-06-27.*
