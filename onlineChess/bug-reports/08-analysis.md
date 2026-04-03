# Bug Report: Analysis & Review

## BUG 1 — CRITICAL: importPgn Overwrites Ongoing Game Without Confirmation
**Files:** `src/components/AnalysisBoard/AnalysisBoard.jsx` lines 232–248; `src/store/gameStore.js` lines 499–538

`importPgn` writes directly into the shared game store (`chessInstance`, `gameStarted`, `moveHistory`). Loading a PGN in the Analysis tab silently destroys an in-progress game on any other tab.

**Trigger:** Start a Pass & Play game → switch to Analysis → load a PGN → switch back → original game gone.

**Severity:** CRITICAL

---

## BUG 2 — HIGH: gameLoaded Not Reset on Import Failure
**File:** `src/components/AnalysisBoard/AnalysisBoard.jsx` lines 232–248

When `importPgn` fails after `tryLoadPgn` succeeds, `setPgnError` is called but `gameLoaded` stays `true`. The error message and the previous game's board are shown simultaneously.

**Severity:** HIGH

---

## BUG 3 — MEDIUM: Eval Graph Breaks on First Undefined Gap
**File:** `src/components/AnalysisBoard/AnalysisBoard.jsx` lines 289–301

`graphData` construction breaks on the first `undefined` value in `evalHistory`:
```js
if (evalHistory[i] !== undefined) out.push(evalHistory[i]);
else break;
```
Non-sequential navigation leaves gaps → graph is truncated.

**Severity:** MEDIUM

---

## BUG 4 — MEDIUM: reviewResults State Duplicated and Desynced
**Files:** `src/App.jsx` lines 90–91; `src/components/AnalysisBoard/AnalysisBoard.jsx` line 163

`reviewResults` exists in both App-level state and AnalysisBoard local state with no synchronization. App-level state persists across tab switches; stale review badges appear.

**Severity:** MEDIUM

---

## BUG 5 — MEDIUM: openingAbortRef Never Initialized with AbortController
**File:** `src/components/AnalysisBoard/AnalysisBoard.jsx` lines 172, 202–206

`openingAbortRef` is declared but never assigned an `AbortController`. The `.abort?.()` call is a no-op; the pending fetch callback tries to call `setLiveOpeningName` on an unmounted component — memory leak warning.

**Severity:** MEDIUM

---

## BUG 6 — MEDIUM: evalHistory Sparse Array from Non-Sequential Navigation
**File:** `src/components/AnalysisBoard/AnalysisBoard.jsx` lines 198–199

`n[currentMoveIndex] = ev` writes at arbitrary indices, creating sparse arrays. Combined with Bug #3, graph visualization silently shows incomplete data.

**Severity:** MEDIUM

---

## BUG 7 — LOW: Review Progress Shows "0/0" Initially
**File:** `src/components/AnalysisBoard/AnalysisBoard.jsx` lines 398–405

Button displays `${reviewProgress.current}/${reviewProgress.total}` before progress updates, showing "0/0" as if review is complete.

**Severity:** LOW

---

## BUG 8 — LOW: EvalGraph Click Index Edge Case
**File:** `src/components/AnalysisBoard/AnalysisBoard.jsx` lines 128–147

If `data` is empty and `currentIdx` is non-negative, `data[currentIdx]` in `evalToY` could throw. Currently guarded by `data.length > 1` but the guard is on the render path, not the click handler.

**Severity:** LOW

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | PGN import overwrites live game |
| 2 | High | gameLoaded not reset on failure |
| 3 | Medium | Eval graph breaks on gap |
| 4 | Medium | reviewResults desynced |
| 5 | Medium | AbortController never initialized |
| 6 | Medium | Sparse evalHistory array |
| 7 | Low | Review shows 0/0 initially |
| 8 | Low | EvalGraph click edge case |
