# manim-style-animation

"MANIM-style" in this repo means **3Blue1Brown-feeling animation built in the React
SPA** — smooth SVG transforms, narrated step captions, KaTeX math morphing in.
It is **NOT** literal manim mp4 rendering. There is no Python/manim render pipeline
and no video assets; everything animates live in the browser. (True manim video
rendering would be a separate infra choice — render farm + stored mp4s — and we've
deliberately not taken it, because live SVG is editable, theme-aware, and
interactive in ways a baked video isn't.)

## The two animation surfaces

1. **Frame timeline** (`AlgoVisualizer` + the live notebook) — discrete `step()`
   frames the reader scrubs/plays. Good for algorithms. See
   [`live-notebook.md`](./live-notebook.md).
2. **Continuous SVG animation** (a rich `INTERACTIVE_VIZ` / `ml/viz` component) —
   `requestAnimationFrame` driving smooth interpolation of SVG attributes. This page
   is about #2: the 3B1B feel.

## The auto-play loop pattern

Drive a `t` (0→1) with `requestAnimationFrame`, ease it, and derive positions:

```js
const reduce = useReducedMotion(); // honor prefers-reduced-motion
useEffect(() => {
  if (reduce || !playing) return;            // static end-state if reduced motion
  let raf, start;
  const tick = (now) => {
    start ??= now;
    const t = Math.min(1, (now - start) / DURATION_MS);
    setProgress(easeInOutCubic(t));
    if (t < 1) raf = requestAnimationFrame(tick);
    else setPlaying(false);                  // derive-or-stop; avoid setState cascades
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, [playing, reduce]);
```

`const easeInOutCubic = t => t < .5 ? 4*t*t*t : 1 - (-2*t+2)**3/2;`

## Morphing objects

Interpolate the *attributes*, not the DOM nodes. A point sliding along a curve is
`cx = lerp(x0, x1, p)`; a secant becoming a tangent is the second endpoint's slope
interpolating to the derivative; a Riemann sum is N rects whose count animates. Use
the glowing-curve recipe from [`premium-explorer-viz.md`](./premium-explorer-viz.md)
(gradient stroke + blurred duplicate path) so the moving line reads as premium, not
a flat 1px stroke. Theme tokens only; **data colorful** (`--hue-*`), **chrome teal**
(`var(--accent)`).

## Narrated step captions

3B1B's voice is "say what's happening as it happens." Pair each animation phase with
a one-line caption that updates as `t` crosses phase boundaries — describe the
*action* ("The secant pivots toward the tangent…"), narration-style, never builder
voice (CLAUDE.md). For a stepped reveal, hold each phase, advance on a timer or a
Step button, and swap the caption.

## KaTeX that animates in

Render math with `katex.renderToString` into a container whose opacity/transform
animates with the same `t`. Don't animate the LaTeX string itself; fade/slide the
rendered block. Keep displays narrow — a wide `\[...\]` must reflow, never scroll
(see [`scrollbar-rule.md`](./scrollbar-rule.md)).

## When to animate vs keep it interactive

- **Animate** when the *process* is the lesson (secant→tangent, gradient descent
  rolling downhill, attention weights forming). Auto-play once, then let the reader
  replay.
- **Interactive (drag/slide)** when the *relationship* is the lesson (move the point,
  see the slope update live). Live readouts beat a captioned loop here.
- **Best:** animate to introduce, then hand control to the reader (drag handle +
  Reset). `CalcDerivativeSlopeViz` and `ActivationExplorerViz` do both.

## Non-negotiables

- `prefers-reduced-motion` → render the meaningful end-state, no motion.
- `requestAnimationFrame`, never `setInterval`, for smooth frames.
- Deterministic randomness (`mulberry32`), never `Math.random`.
- No inner scrollbars; vertical flow for any architecture/pipeline diagram (CLAUDE.md).

---
*Last updated: 2026-06-27.*
