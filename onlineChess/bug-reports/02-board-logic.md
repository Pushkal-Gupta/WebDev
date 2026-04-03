# Bug Report: Board Rendering & Chess Logic

## BUG 1 — HIGH: Captured Pieces Array Corrupted on Undo
**File:** `src/store/gameStore.js` lines 407–408

`capturedByWhite.slice(0, -0)` — JavaScript treats `-0` as `0`, so this is `slice(0, 0)` which returns an empty array. Every undo wipes the entire captured-pieces list instead of removing just the last entry.

**Trigger:** Make a capture, then undo. The captured-pieces display goes blank.

**Severity:** HIGH

---

## BUG 2 — MEDIUM: File Labels Reversed When Board is Flipped
**File:** `src/components/Cell/Cell.jsx` line 80

```js
const fileLabel = FILE_LABELS[flipped ? 7 - col : col];
```

The Board component already reverses the `cols` array when flipped, so `col` is already correctly positioned. Applying `7 - col` again double-inverts the label — 'a' appears on the right when playing as Black.

**Fix:** `const fileLabel = FILE_LABELS[col];`

**Severity:** MEDIUM

---

## BUG 3 — MEDIUM: Drag-and-Drop Uses Fragile setTimeout(0) Pattern
**File:** `src/components/Cell/Cell.jsx` line 67

```js
selectSquare(fromRow, fromCol);
setTimeout(() => makeMove(...), 0);
```

`makeMove` is deferred hoping `selectSquare`'s state update has committed by then. React's batching makes this timing-dependent and potentially breaks pawn promotion via drag-and-drop.

**Severity:** MEDIUM

---

## BUG 4 — LOW: Dead Code — labelColor Variable Computed but Never Used
**File:** `src/components/Cell/Cell.jsx` line 82

```js
const labelColor = isLight ? (isLight ? clr2 : clr1) : (isLight ? clr1 : clr2);
```

`labelColor` is never referenced. The JSX uses the inline expression `isLight ? clr2 : clr1` directly. The variable also has a redundant nested ternary.

**Severity:** LOW

---

## BUG 5 — LOW: Drag Handlers Missing gameStarted Guard
**File:** `src/components/Cell/Cell.jsx` lines 49–68

`handleDragStart`/`handleDragOver`/`handleDrop` don't check `if (!gameStarted) return` like `handleClick` does (line 39). Move logic is still guarded by other checks but this is an inconsistency that could expose edge-case interactions.

**Severity:** LOW

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | High | Undo wipes all captured pieces |
| 2 | Medium | File labels double-inverted when flipped |
| 3 | Medium | Drag-and-drop setTimeout race |
| 4 | Low | Dead labelColor variable |
| 5 | Low | Drag handlers missing gameStarted check |
