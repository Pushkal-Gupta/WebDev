# scrollbar-rule

The single hardest rule in this repo. The user has restated it 5+ times. Honor it.

## The rule

**The vertical page scroll is the ONLY allowed scrollbar.** Not horizontal. Not vertical inside a section. Not inside a viz. Not inside code blocks. Not inside math. Not inside tables. Not inside cards. Not inside modals. **Not anywhere.**

If something doesn't fit:
- Make it smaller
- Reflow text
- Scale the SVG `viewBox`
- Drop the font-size
- Wrap text
- Split the math display
- Redraw the SVG

NEVER reach for `overflow: auto`, `overflow-x: auto`, `overflow-y: auto`, `overflow: scroll`, or any variant.

## CLAUDE.md tightened this: NO carve-outs

The root `CLAUDE.md` has since removed every "legitimate exception" for *inner
content*. Terminal/run-output panes, "tall viz" stages, wide ASCII/math — all are
violations to revert, not allowed exceptions. The only inner scroll that stays is a
code **editor**'s own viewport (Monaco) — its surrounding panels/output must not add
their own. The page-level whitelist below is about the outer route shell + modals,
not inner content; when CLAUDE.md and this list disagree on inner content, CLAUDE.md
wins.

## The whitelist (legitimate page-level scrolls)

A handful of CSS rules CAN have `overflow-y: auto` because they're the outer-page-scroll role. After the Wave-9 sweep, these were validated as legitimate:

- The route shell on a paginated page (`Companies`, `Contests`, `MyLists`, etc.) — IF `html`/`body`/`#root` are themselves `overflow: hidden`.
- Workspace's IDE split-panes (`workspace.css:23/48/957/1114`) — IDE-like behavior, user-protected file.
- Modal overlays (`LoginModal`, `SettingsModal`) — modals scroll when content exceeds viewport height.
- Sticky sidebars (`DsaTutorial` TOC, `Learn cp-aside`).
- Code-runner output panels (Playground stdin/stdout, SqlPlayground results) — terminal-style buffer.
- `SubNav` horizontal nav with `scrollbar-width: none` (visually hidden).

If you're adding `overflow:` and your file is NOT in this list, you're wrong. Find another fix.

## The two most common bugs

**Bug 1 — `<pre>` ASCII / code wider than container:**

```css
/* BAD */
.tut-theory-pre { overflow-x: auto; white-space: pre; }

/* GOOD */
.tut-theory-pre { white-space: pre-wrap; word-break: break-word; }
```

**Bug 2 — wide SVG forced to scroll:**

```jsx
// BAD: SVG has fixed width, parent has overflow-x: auto
<div style={{ overflowX: 'auto' }}>
  <svg width="900" height="400">...</svg>
</div>

// GOOD: SVG reflows via viewBox
<svg viewBox="0 0 900 400" preserveAspectRatio="xMidYMid meet"
     style={{ width: '100%', height: 'auto' }}>...</svg>
```

## Wide math / KaTeX

Long `\[...\]` displays will sometimes exceed container width. Don't `overflow-x: auto` them. Options in order of preference:

1. Rewrite the formula across multiple lines using `\\` between display blocks.
2. Drop the font-size: `.cp-math .katex { font-size: 0.9em }`.
3. Allow KaTeX to wrap: `.katex { white-space: normal; max-width: 100%; }`.

## Tables wider than container

Same idea — re-think as stacked rows at narrow widths, or shrink columns. Never `overflow-x: auto` on a table wrapper.

## Test before shipping

Open every page you touched in dev at viewport widths 1280, 1024, 768. Look for any inner scrollbar. If you see one, fix it before reporting work as complete.

---
*Last updated: 2026-06-10 — 49 inner-scroll rules removed in Wave 9, rule restated by user 3 separate times.*
