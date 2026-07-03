---
slug: web-css-box-layout
module: web-fundamentals
title: CSS Box Model & Layout
subtitle: Every element the browser paints is a rectangular box wrapped in padding, border, and margin — master those four rings and the flex and grid engines that arrange them.
difficulty: Beginner
position: 2
estimatedReadMinutes: 14
prereqs: [web-html-dom-tree]
relatedProblems: []
references:
  - title: "MDN — Introduction to the CSS box model"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Introduction_to_the_CSS_box_model"
    type: article
  - title: "MDN — Basic concepts of flexbox"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox"
    type: article
  - title: "MDN — Basic concepts of grid layout"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout"
    type: article
  - title: "web.dev — Learn CSS: Box Model"
    url: "https://web.dev/learn/css/box-model"
    type: article
  - title: "MDN — box-sizing"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing"
    type: spec
status: published
---

## intro
Every element a browser renders is a rectangle. That headline, that button, that paragraph — each is a box, and every box is built from the same four concentric regions: a **content** area holding text or an image, **padding** cushioning the content inside the box, a **border** drawn around the padding, and a **margin** of empty space pushing neighbours away. Understanding exactly how those four regions add up to the space an element occupies is the single most useful thing you can know about CSS. This lesson takes the box apart ring by ring, fixes the `box-sizing` gotcha that trips up everyone, then shows how the modern layout engines — Flexbox and Grid — arrange those boxes on the page.

## whyItMatters
Almost every visual bug you will ever chase in CSS comes down to a box behaving differently than you pictured it. An element that is 20 pixels wider than expected, a layout that overflows its container, two things that will not sit side by side, a gap you cannot explain — these are box-model misunderstandings, not mysteries. Once you can look at any element and mentally decompose it into content, padding, border, and margin, and predict the total size it claims, debugging stops being guesswork. Layout systems build directly on top of this: Flexbox and Grid distribute space between and around boxes, so if the box model is fuzzy, the layout engines feel like magic instead of tools. Interviewers probe this constantly because it separates people who copy CSS from people who reason about it.

## intuition
Picture a framed painting hanging on a wall. The **content** is the painting itself — the actual picture, sized by how big the canvas is. Around the painting sits a **mat**, the cardboard border that keeps the canvas from touching the glass: that is **padding**, breathing room *inside* the frame, and it takes on the background of the box. Then comes the **frame** itself, the physical wooden edge: that is the **border**, a drawn line with a thickness and a color. Finally, the empty wall space you leave between this frame and the next painting so they do not crowd each other is the **margin** — it is outside the box entirely and always transparent.

Now work from the inside out, because that is the order the browser thinks in. It starts with the content box. Padding wraps the content, pushing the border outward and enlarging the visible, background-filled area. The border wraps the padding, adding its own thickness. Margin wraps the whole thing but paints nothing — it only reserves space so the box's neighbours keep their distance.

The crucial question is: when you write `width: 300px`, which ring does that measure? By default — the `content-box` model — `width` sizes only the innermost content region. Padding and border are then added *on top*, so a `300px` wide element with `20px` padding and a `5px` border actually occupies `300 + 20 + 20 + 5 + 5 = 350px` across. That surprise is the source of countless "why is it too big" bugs. Switch to `box-sizing: border-box` and `width` instead measures out to the border's outer edge, so padding and border eat *into* the 300 pixels rather than adding to them — the box stays exactly 300 wide no matter how you pad it. Margin sits outside both models; it is never counted in either width. Hold this nested-frames picture and the numbers always add up.

## visualization
```
  +---------------------------------------------------+
  |  MARGIN  (transparent — pushes neighbours away)   |
  |   +-------------------------------------------+   |
  |   |  BORDER  (drawn edge, has width + color)  |   |
  |   |   +-----------------------------------+   |   |
  |   |   |  PADDING  (inside space, bg color)|   |   |
  |   |   |   +---------------------------+   |   |   |
  |   |   |   |       CONTENT             |   |   |   |
  |   |   |   |   text / image / child    |   |   |   |
  |   |   |   |     width x height        |   |   |   |
  |   |   |   +---------------------------+   |   |   |
  |   |   +-----------------------------------+   |   |
  |   +-------------------------------------------+   |
  +---------------------------------------------------+
   content-box:  occupied = width + padding + border
   border-box :  occupied = width (padding + border fit inside)
```

## bruteForce
The naive way to place things on a page is to fight the browser: give every element `position: absolute` with hardcoded `top` and `left` pixel coordinates, or nudge everything with fixed margins and floats until it lines up on your screen. This "works" for exactly one window size and one amount of content. Add a longer word, a second paragraph, or a phone-sized viewport and the whole arrangement collapses, because absolute positioning removes elements from normal **flow** — they no longer push on each other or reflow when content changes. You end up maintaining a brittle pile of magic numbers, re-measuring by hand every time anything moves. It is the pixel-pushing trap that flow-based and modern layout exist to eliminate.

## optimal
Start by getting the box model exact, then let a layout engine place the boxes. **Precisely:** a box's outer footprint is `content + padding-left/right + border-left/right + margin-left/right` horizontally (and the analogous sum vertically). Whether `width`/`height` refers to the content edge or the border edge is controlled by **`box-sizing`**. The historical default, `content-box`, makes `width` the content size and adds padding and border outside it. The far more predictable `border-box` makes `width` the distance to the outer border edge, so padding and border are absorbed inward — most codebases set `*, *::before, *::after { box-sizing: border-box }` once and never think about it again. Margins are outside both and can **collapse**: adjacent vertical margins between block siblings merge into the larger of the two rather than adding.

Boxes flow by default as **block** (stacking top to bottom, taking full available width) or **inline** (flowing along a line like words, ignoring top/bottom width and height). For real arrangement you reach for the two modern engines. **Flexbox** lays boxes out along a single axis: you set `display: flex` on a container, pick a `flex-direction` (row or column) which defines the **main axis** — the cross axis is perpendicular. `justify-content` distributes children along the main axis (start, center, space-between), `align-items` positions them on the cross axis, and `flex: 1` lets children grow to share leftover space. It is the tool for toolbars, nav rows, card strips, centering — anything essentially one-dimensional. **Grid** handles two dimensions at once: `display: grid` plus `grid-template-columns`/`grid-template-rows` defines named **tracks** (with the `fr` fractional unit and `repeat(auto-fit, minmax(...))` for responsive columns), and children snap into the resulting cells or span across them with `grid-column`/`grid-row`. Grid is the tool for page skeletons, galleries, and any real two-axis structure. Reach for flex when you think in a single line, grid when you think in rows *and* columns.

## complexity
time: Layout ("reflow") is roughly O(n) in the number of boxes the browser must position, but a single change can cascade: resizing one element can force its ancestors and following siblings to re-measure, so a careless write in a tight loop turns into repeated full-subtree reflows. Reading a geometry property like `offsetWidth` right after a style write forces a synchronous reflow, which is the classic layout-thrashing performance bug.
space: O(n) — the browser keeps a box for every rendered element plus the render-tree bookkeeping, independent of how deeply nested the flex or grid containers are.
notes: The cost that matters in practice is not asymptotic but *how often* you trigger reflow and repaint. Batch DOM reads together and writes together, and prefer transforms (which skip layout) over animating width, top, or margin.

## pitfalls
- **The `content-box` width surprise.** By default `width: 300px` plus padding and border renders *wider* than 300px, overflowing containers. Fix: set `box-sizing: border-box` globally so padding and border fit inside the declared width.
- **Margin collapse catches you off guard.** Two stacked block elements with `40px` and `30px` vertical margins leave a `40px` gap, not `70px`, and a child's top margin can escape its parent. Fix: use padding, a border, or `display: flex`/`grid` on the parent (flex and grid items do not collapse margins), or use `gap`.
- **Percentage height needs a sized parent.** `height: 100%` resolves to nothing if the parent has no explicit height, so the element silently collapses. Fix: give the ancestor chain a real height, or use viewport units / `flex: 1` instead.
- **Forgetting `min-height: 0` (or `min-width: 0`) on flex children.** A flex item defaults to `min-height: auto`, so long content or a nested scroll area refuses to shrink and blows out the layout. Fix: set `min-height: 0` / `min-width: 0` on the flex child that should be allowed to shrink.

## interviewTips
- Be able to compute an element's total occupied width out loud in both models: content-box adds padding and border to `width`, border-box absorbs them into `width`. Naming `box-sizing: border-box` as the sane default signals real experience.
- Explain Flexbox in axis terms — `flex-direction` sets the main axis, `justify-content` works along it, `align-items` works across it — rather than reciting property names. Then contrast it with Grid as one-dimensional versus two-dimensional layout.
- If asked about performance, connect layout to reflow: mention that reading geometry after writing styles forces synchronous layout ("layout thrashing") and that batching reads and writes, or animating transforms instead of box metrics, avoids it.

## keyTakeaways
- Every element is a box of four nested regions — content, padding, border, margin — and its footprint is the sum of them; `box-sizing: border-box` makes `width` measure to the border edge so padding and border fit inside instead of adding on.
- Flexbox arranges boxes along one axis (main via `justify-content`, cross via `align-items`), while Grid arranges them in two dimensions with template tracks and the `fr` unit; pick flex for a line, grid for a matrix.
- Changing box geometry triggers reflow, which can cascade to ancestors and siblings; batch DOM reads and writes and prefer transforms to keep layout cheap.

## code.html
```html
<!-- A page shell: a grid skeleton with a flex toolbar inside it. -->
<div class="page">
  <header class="bar">
    <span class="brand">PGHub</span>
    <nav class="links">
      <a href="#a">Learn</a>
      <a href="#b">Practice</a>
      <a href="#c">Compete</a>
    </nav>
  </header>

  <main class="gallery">
    <article class="card">Box one</article>
    <article class="card">Box two</article>
    <article class="card">Box three</article>
    <article class="card">Box four</article>
  </main>
</div>
```

## code.css
```css
/* Sane default: width includes padding + border everywhere. */
*, *::before, *::after { box-sizing: border-box; }

/* An explicit box: 300px wide TOTAL, padding + border fit inside. */
.card {
  width: 300px;
  padding: 20px;          /* inside space, absorbed by border-box */
  border: 2px solid #888; /* drawn edge */
  margin: 12px;           /* outside space between neighbours */
}

/* Flex container: a single-axis toolbar. */
.bar {
  display: flex;
  flex-direction: row;               /* main axis = horizontal */
  justify-content: space-between;    /* spread along main axis */
  align-items: center;               /* center on the cross axis */
  gap: 16px;
  padding: 12px 20px;
}
.links { display: flex; gap: 16px; }

/* Grid container: a responsive two-dimensional gallery. */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  padding: 20px;
}

/* Page skeleton: header row auto, content row fills the rest. */
.page {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}
```

## code.javascript
```javascript
// Read the real box metrics the browser computed for an element.
// getComputedStyle returns resolved values; getBoundingClientRect gives the
// rendered rectangle (content + padding + border), in CSS pixels.

function inspectBox(el) {
  const cs = getComputedStyle(el);
  const px = (v) => parseFloat(v) || 0;

  const padX = px(cs.paddingLeft) + px(cs.paddingRight);
  const bordX = px(cs.borderLeftWidth) + px(cs.borderRightWidth);
  const marX = px(cs.marginLeft) + px(cs.marginRight);

  // getBoundingClientRect().width = content + padding + border (the border box).
  const borderBoxWidth = el.getBoundingClientRect().width;
  const contentWidth = borderBoxWidth - padX - bordX;
  const occupiedWidth = borderBoxWidth + marX; // includes margin footprint

  console.log('box-sizing   :', cs.boxSizing);
  console.log('content w    :', contentWidth.toFixed(1), 'px');
  console.log('padding (L+R):', padX, 'px');
  console.log('border  (L+R):', bordX, 'px');
  console.log('margin  (L+R):', marX, 'px');
  console.log('border-box w :', borderBoxWidth.toFixed(1), 'px');
  console.log('occupied w   :', occupiedWidth.toFixed(1), 'px (incl. margin)');

  return { contentWidth, padX, bordX, marX, borderBoxWidth, occupiedWidth };
}

// Demo: build a box, measure it, then remove it.
const demo = document.createElement('div');
demo.style.cssText =
  'width:300px;padding:20px;border:2px solid #888;margin:12px;box-sizing:content-box';
document.body.appendChild(demo);
inspectBox(demo); // content 300, border-box 344, occupied 368
demo.remove();
```
