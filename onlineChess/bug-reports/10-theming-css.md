# Bug Report: Theming, CSS & Responsive UI

## BUG 1 — CRITICAL: pieceSetIndex Out-of-Bounds Crash
**Files:** `src/components/Cell/Cell.jsx` line 22; `src/App.jsx` line 134; `src/components/P2PPlay/P2PGame.jsx` line 49; `src/components/Puzzles/PuzzlePage.jsx` line 19; `src/components/Spectate/SpectateBoard.jsx` line 26

`pieceSets[pieceSetIndex].path` is accessed without bounds checking. The array has 6 items. If `pieceSetIndex` is corrupted (e.g., from stale localStorage), the app crashes with "Cannot read property 'path' of undefined".

**Severity:** CRITICAL

---

## BUG 2 — HIGH: Dead/Incorrect Label Color Logic
**File:** `src/components/Cell/Cell.jsx` line 82

```js
const labelColor = isLight ? (isLight ? clr2 : clr1) : (isLight ? clr1 : clr2);
```

The nested ternary is logically equivalent to `isLight ? clr2 : clr1` — the inner ternaries are redundant and the `false` branch dead code. Likely a copy-paste error that could produce wrong colors if refactored.

**Severity:** HIGH

---

## BUG 3 — MEDIUM: Theme/Color Changes Not Persisted
**File:** `src/store/themeStore.js`

The theme store uses plain Zustand with no `persist` middleware. Board colors, themes, and piece set selection are reset to defaults on every page reload.

**Severity:** MEDIUM

---

## BUG 4 — MEDIUM: LeftSidebar Not Hidden on Mobile (≤540px)
**File:** `src/components/LeftSidebar/LeftSidebar.module.css`

`RightSidebar` is hidden at `max-width: 540px` but `LeftSidebar` has no equivalent rule (only a `max-width: 900px` collapse). On small mobile screens the sidebar squeezes the board or causes horizontal overflow.

**Severity:** MEDIUM

---

## BUG 5 — LOW: Unused CSS Class `.colorInput`
**File:** `src/components/LeftSidebar/LeftSidebar.module.css` lines 71–79

Defined but never referenced in JSX (actual implementation uses `.colorSwatch`). Dead code.

**Severity:** LOW

---

## BUG 6 — LOW: Unused CSS Class `.colorRow`
**File:** `src/components/LeftSidebar/LeftSidebar.module.css` lines 219–223

Defined but never used — all color rows use `.row`. Dead code.

**Severity:** LOW

---

## Verified OK
- All 6 piece set image directories exist with complete PNGs
- `--cell-size` defined with all responsive breakpoints in `index.css`
- Inter font correctly loaded
- Z-index stacking correct for modals
- All referenced CSS module classes are defined

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | pieceSetIndex out-of-bounds crash |
| 2 | High | Dead label-color ternary logic |
| 3 | Medium | Theme not persisted across reloads |
| 4 | Medium | LeftSidebar visible on mobile causing overflow |
| 5 | Low | Unused .colorInput class |
| 6 | Low | Unused .colorRow class |
