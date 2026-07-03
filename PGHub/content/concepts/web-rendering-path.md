---
slug: web-rendering-path
module: web-fundamentals
title: The Critical Rendering Path
subtitle: The fixed sequence a browser runs to turn HTML and CSS into pixels — parse, build two trees, merge, lay out, paint, composite — and why some changes cost a fraction of others.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: [web-html-dom-tree, web-css-box-layout]
relatedProblems: []
references:
  - title: "MDN — Critical rendering path"
    url: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path"
    type: article
  - title: "MDN — How browsers work: populating the page"
    url: "https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work"
    type: article
  - title: "web.dev — Rendering performance"
    url: "https://web.dev/articles/rendering-performance"
    type: article
  - title: "web.dev — Avoid large, complex layouts and layout thrashing"
    url: "https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing"
    type: article
  - title: "web.dev — Stick to compositor-only properties and manage layer count"
    url: "https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count"
    type: article
status: published
---

## intro
When a browser receives a page it does not draw anything straight away. Between the raw bytes of HTML and CSS arriving and the first pixel lighting up sits a fixed sequence of steps called the **critical rendering path**. The browser parses HTML into the **DOM**, parses CSS into the **CSSOM**, merges the two into a **render tree** of only the things that will actually be visible, computes where every box goes in **layout**, fills in pixels during **paint**, and finally stitches the painted layers together on screen in **composite**. Understanding this pipeline is what separates a page that feels instant from one that stutters.

## whyItMatters
Every visible change on a page — the first load, a hover, a scroll animation, a dropdown opening — re-runs some suffix of this pipeline, and the stages have wildly different costs. A change that forces layout has to reflow potentially the whole page; a change that only repaints touches pixels but not positions; a change the compositor can handle alone moves an existing layer on the GPU and touches neither. Screens refresh roughly every 16 milliseconds, so all the work for one frame must finish inside that budget or the animation drops frames and jank appears. Knowing which stage each change triggers is the core skill behind writing smooth interfaces, and it is a staple of front-end performance interviews because it rewards understanding over memorised tricks.

## intuition
Picture a newspaper being printed the old-fashioned way. Two separate things arrive at the print shop. The first is the **words** — the raw copy the journalists filed, which an editor arranges into a nested outline of sections, headlines, and paragraphs. That structured outline is the **DOM**: the HTML text turned into a tree of parent and child boxes. The second is the **style guide** — the rules for what every kind of element should look like: this heading is 24-point bold, that sidebar is grey, captions are italic. Parsed into a lookup the shop can apply, that style guide is the **CSSOM**.

Neither tree alone can be printed. The editor merges them: walk the outline, and for each piece that will actually appear, attach its computed style. Anything marked "do not print" — an element with `display: none`, a comment, a `<head>` tag — is simply left out. What remains is the **render tree**: only the visible content, each node already knowing its font, colour, and size, but not yet where it sits on the page.

Now the layout artist takes over. Given the page width and every element's box rules, they work out the exact rectangle each item occupies — this headline spans these columns, that photo pushes the caption down to here. This positioning pass is **layout**, also called **reflow**, and it is geometric and expensive because moving one box can shove everything after it. Once positions are fixed, the press **paints**: it inks each rectangle with its actual pixels — text glyphs, borders, shadows, backgrounds. Finally the finished sheets, possibly printed on separate transparent films, are **composited**: layered on top of one another in the right order to make the single page the reader sees. Reprint the whole run for a one-word fix and you have wasted the shop's afternoon; the entire art of fast rendering is redoing as few of these stages as possible.

## visualization
```
        HTML bytes                    CSS bytes
           |                             |
        parse                         parse
           v                             v
        [ DOM tree ]                 [ CSSOM tree ]
           \                            /
            \_________ merge __________/
                        |
                        v
                 [ Render Tree ]   (visible nodes + computed style)
                        |
                        v
                    L A Y O U T     <- reflow: box positions & sizes
                        |
                        v
                    P A I N T       <- repaint: fill pixels, no move
                        |
                        v
                   C O M P O S I T E <- GPU layers stacked to screen

  geometry change (width/top)  -> Layout -> Paint -> Composite  (full chain)
  color/background change       ->          Paint -> Composite  (skip layout)
  transform / opacity change    ->                   Composite   (skip both)
```

## bruteForce
The naive mental model treats every change as "redraw the page." Set an element's colour, nudge its position, fade it in — and you imagine the browser rebuilding everything from the render tree down: relayout every box, repaint every pixel, recomposite. If the browser truly did this it would be catastrophic inside an animation loop, running a full layout-plus-paint sixty times a second over the whole document. In practice the engine is smarter, invalidating only the stages a given change actually affects, but code that writes to the DOM carelessly can force that worst case anyway — repeatedly triggering full reflows where a targeted repaint, or better still a compositor-only update, would have done the job for a fraction of the cost.

## optimal
Walk the pipeline precisely. **Parsing** turns HTML into the DOM and CSS into the CSSOM; both are trees. CSS is **render-blocking** — the browser will not paint until it has the CSSOM, because painting with the wrong styles then correcting would flash unstyled content — so stylesheets in the `<head>` block the first render. Scripts are parser-blocking too: a plain `<script>` stops HTML parsing until it downloads and runs, which is why `defer` (run after parsing, in order) and `async` (run whenever it arrives) exist, and why scripts often sit at the end of the body.

The DOM and CSSOM merge into the **render tree**, which excludes anything non-visual: `display: none` nodes drop out entirely, though `visibility: hidden` ones stay because they still occupy space. **Layout** (reflow) then computes the geometry — position and size of every render-tree box — as a function of viewport width and the box model. **Paint** rasterises each box into actual pixels across one or more layers. **Composite** hands those layers to the GPU to be drawn on screen in the correct stacking order.

The payoff is knowing which change re-enters the pipeline where. Anything geometric — `width`, `height`, `top`, `left`, `margin`, `font-size`, adding or removing a node — invalidates layout, forcing **Layout to Paint to Composite**, the full chain. A purely visual change like `color`, `background-color`, `box-shadow`, or `visibility` skips layout and runs **Paint to Composite** (a **repaint**). The cheapest changes — `transform` and `opacity` — can be handled by the compositor alone on an element that already has its own layer, running **Composite only**, skipping both layout and paint. That is precisely why smooth animations use `transform: translate()` instead of animating `top`/`left`, and `opacity` instead of `visibility`: they move existing pixels on the GPU without ever touching the expensive stages.

## complexity
time: Per frame the browser has roughly a **16ms budget** (60fps). Layout is the costly stage — worst case it is O(n) in the number of affected render-tree nodes, and because reflowing one box can shift its siblings and descendants, a single mistimed write can cascade into a whole-subtree relayout. Paint is O(pixels) over the invalidated region. Composite is the cheapest: O(layers), essentially a GPU transform of already-rasterised bitmaps.
space: O(nodes) for the DOM, CSSOM, and render tree, plus O(pixels) of GPU memory per compositor layer — promoting too many elements to their own layers trades layout cost for memory pressure.
notes: The goal is to keep each frame's work under ~16ms; compositor-only changes stay far inside that, layout-triggering changes are the ones that blow the budget.

## pitfalls
- **Layout thrashing** — reading a layout property (`offsetHeight`, `getBoundingClientRect()`) then writing a style, repeatedly in a loop, forces a synchronous reflow on every iteration because each read must reflect the previous write. Fix: batch all reads first, then all writes, or defer writes to `requestAnimationFrame`.
- **Animating `top`/`left`/`width`/`height`** instead of `transform` — these trigger layout every frame. Fix: animate `transform: translate()` / `scale()` and `opacity`, which the compositor handles without layout or paint.
- **Render-blocking synchronous scripts** — a `<script>` in the `<head>` with no `defer`/`async` halts HTML parsing, delaying the DOM and the first paint. Fix: add `defer`, use `async` for independent scripts, or move the tag to the end of `<body>`.
- **Forcing a sync reflow by reading geometry after a write** — mutating the DOM then immediately reading `offsetWidth` in the same frame makes the browser flush layout early ("forced synchronous layout"). Fix: read geometry before mutating, or cache the value.
- **Promoting everything to its own layer** with `will-change` or `translateZ(0)` — a few layers help the compositor; hundreds exhaust GPU memory and slow compositing. Fix: promote only the specific elements you animate, and remove `will-change` when the animation ends.

## interviewTips
- Name the stages in order — parse to DOM and CSSOM, merge to render tree, layout, paint, composite — and state that CSS is render-blocking while scripts are parser-blocking, so the interviewer sees you understand what gates the first paint.
- When asked why `transform`/`opacity` animations are smooth, explain the three tiers: geometry changes re-run layout, paint, and composite; visual changes skip layout; transform and opacity are compositor-only and skip both — that is the whole reason to prefer them.
- If handed a janky animation, diagnose it as layout thrashing or animating layout properties, and fix it by batching reads-then-writes (or `requestAnimationFrame`) and switching to compositor-only properties.

## keyTakeaways
- The critical rendering path is a fixed pipeline: HTML to DOM and CSS to CSSOM, merged into a render tree of visible nodes, then layout (positions), paint (pixels), and composite (layers to screen).
- Changes cost different amounts because they re-enter the pipeline at different points: geometry forces the full Layout to Paint to Composite chain, colour-type changes skip layout (repaint only), and `transform`/`opacity` are compositor-only.
- Smooth 60fps work means staying inside the ~16ms frame budget by avoiding layout thrashing and animating compositor-only properties instead of geometric ones.

## code.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <!-- Render-blocking: the browser will not paint until this CSSOM is built. -->
    <link rel="stylesheet" href="/styles/main.css" />

    <!-- Parser-blocking if left plain. `defer` lets HTML parsing finish first,
         then runs this in order right before DOMContentLoaded. -->
    <script defer src="/js/app.js"></script>

    <!-- Independent, order-agnostic work: run it whenever it arrives. -->
    <script async src="/js/analytics.js"></script>
  </head>
  <body>
    <h1>Critical rendering path</h1>
    <p>The CSS above blocks the first paint; the scripts above do not block parsing.</p>
    <!-- No trailing <script> needed: defer already waits for the parsed DOM. -->
  </body>
</html>
```

## code.css
```css
/* Layout-triggering: animating `left` recomputes geometry every frame.
   Each frame re-runs Layout -> Paint -> Composite. Avoid for animation. */
.slide-expensive {
  position: relative;
  left: 0;
  transition: left 300ms ease;
}
.slide-expensive:hover {
  left: 120px; /* forces reflow on every intermediate frame */
}

/* Compositor-only: `transform` and `opacity` skip Layout AND Paint.
   The GPU moves an existing layer -> smooth 60fps. Prefer this. */
.slide-cheap {
  transform: translateX(0);
  opacity: 1;
  transition: transform 300ms ease, opacity 300ms ease;
  will-change: transform, opacity; /* promote only what actually animates */
}
.slide-cheap:hover {
  transform: translateX(120px); /* composite only, no layout, no paint */
  opacity: 0.7;
}
```

## code.javascript
```javascript
// Layout thrashing vs a batched read-then-write pass.
// Reading a geometry property (offsetHeight) after a write forces the browser
// to flush layout synchronously, so interleaving read/write reflows N times.

function makeBoxes(n) {
  // Simulated layout: reading `height` after a `width` write "costs" a reflow.
  const boxes = [];
  for (let i = 0; i < n; i++) boxes.push({ width: 100, height: 100, reflows: 0 });
  return boxes;
}

function readHeight(box) {
  box.reflows += 1; // reading geometry after a pending write flushes layout
  return box.height;
}

// BAD: read, then write, then read, then write... one forced reflow per box.
function thrash(boxes) {
  const t0 = Date.now();
  for (const box of boxes) {
    const h = readHeight(box);   // read  -> flush layout
    box.width = h + 10;          // write -> invalidate layout again
  }
  const reflows = boxes.reduce((s, b) => s + b.reflows, 0);
  console.log(`thrash: ${reflows} reflows in ${Date.now() - t0}ms`);
}

// GOOD: batch all reads, then all writes. Layout flushes at most once.
function batched(boxes) {
  const t0 = Date.now();
  const heights = boxes.map(readHeight); // all reads together
  boxes.forEach((box, i) => { box.width = heights[i] + 10; }); // all writes together
  const reflows = boxes.reduce((s, b) => s + b.reflows, 0);
  console.log(`batched: ${reflows} reflows in ${Date.now() - t0}ms`);
}

// In a real page you would defer the writes into requestAnimationFrame so they
// land once, right before the next paint:
//   requestAnimationFrame(() => boxes.forEach((b, i) => (b.width = heights[i] + 10)));

thrash(makeBoxes(1000));
batched(makeBoxes(1000));
```
