# page-must-scroll

The single most-repeated UI bug this codebase ships: **a new route page that can't scroll**, so anything below the fold is unreachable. The user has flagged it multiple times ("unable to scroll fix this", "ensure it is scrollable, it is a very common issue").

## Why it happens
`src/index.css` sets `overflow: hidden` on the scroll root (≈ line 44). So the document/body does NOT scroll. **Every route must own its own vertical scroll.** A page that just lets its content grow taller than the viewport gets clipped — no scrollbar appears.

## The fix (the established pattern)
The route's top-level container must be a fixed-height scroll box, exactly like `.learn-container`:

```css
.my-page {
  height: calc(100vh - 100px);  /* 100px ≈ header + subnav; match .learn-container */
  overflow-y: auto;             /* THIS is the whitelisted page scroll (scrollbar-rule allows it) */
  width: 94%;                   /* or max-width + margin:0 auto */
  max-width: var(--container-w);
  margin: 0 auto;
}
```

This `overflow-y: auto` is the ONE allowed scrollbar per `scrollbar-rule.md` — it is the page scroll for that route, not an inner-content scroll.

## What NOT to do (the bug we keep shipping)
- `min-height: calc(100vh - X)` with `display:flex; flex-direction:column` and a `flex:1 1 auto` child but **no `overflow-y:auto`** → content taller than viewport is clipped, unscrollable. (LearningHub shipped exactly this and the bottom cards were unreachable, 2026-06-14.)
- Relying on body/document scroll — it's disabled by `index.css overflow:hidden`.

## Verify it (do this on every new/edited page)
1. Build, open the route, make the window SHORT (e.g. laptop height).
2. Confirm a scrollbar appears and you can reach the very last element.
3. Check no INNER element also scrolls (only the route container).
4. Check it at 1920×1080 AND 1440×900 (per CLAUDE.md NO EMPTY SPACE).
5. Reduced-motion + all 8 palettes still fine.

That is the "5-pass verification" the user asks for on new UI.

---
*Last updated: 2026-06-14 — after LearningHub + visualize pages shipped unscrollable.*
