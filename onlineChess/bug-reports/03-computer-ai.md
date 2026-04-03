# Bug Report: Computer AI Play

## BUG 1 — HIGH: Board Re-enabled After Computer Delivers Checkmate
**File:** `src/App.jsx` lines 162–207 (makeCompMove); `src/store/gameStore.js` line 366

The `finally` block in `makeCompMove` unconditionally calls `setDisableBoard(false)` (App.jsx line 201). When the computer's move ends the game, `checkGameOver` sets `disableBoard: true` first — then the `finally` overwrites it with `false`, leaving the board interactive after game over.

**Trigger:** Let the computer deliver checkmate. Board becomes clickable after the game-over overlay appears.

**Severity:** HIGH

---

## BUG 2 — MEDIUM: compThinking Not Cleared on Game End
**File:** `src/store/gameStore.js` lines 347–368 (checkGameOver), 370–379 (timeExpired)

Neither `checkGameOver` nor `timeExpired` resets `compThinking` to `false`. After the game ends by any means (checkmate, stalemate, draw, timeout), the UI continues showing "computer is thinking".

**Severity:** MEDIUM

---

## BUG 3 — LOW: Missing moveHistory in useEffect Dependency Array
**File:** `src/App.jsx` line 207

The computer-move effect uses `moveHistory.length` in its guard clause but `moveHistory` is absent from the dependency array `[activeColor, gameStarted, gameOver, isComp, compColor, compThinking, currentMoveIndex]`. Non-manifesting in practice because `currentMoveIndex` always changes with `moveHistory`, but technically a stale closure.

**Severity:** LOW

---

## BUG 4 — LOW: Stockfish Fallback Uses Hardcoded Strength 8
**File:** `src/App.jsx` line 184

```js
catch { bestMove = getLocalBestMove(fen, compStrength || 8); }
```

When Stockfish fails for strength ≥ 7, the fallback always plays at strength 8, ignoring strength 9 or 10 selections.

**Severity:** LOW

---

## BUG 5 — LOW: Timer Component Would Double-Decrement if Used
**File:** `src/components/Timer/Timer.jsx` lines 19–28

`Timer` sets up its own `setInterval` to call `tickTimer()`. App.jsx also runs a `tickTimer` interval. If `Timer` were ever rendered, the clock would decrement twice per second. Currently `Timer` is unused so not manifesting.

**Severity:** LOW (latent)

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | High | Board re-enabled after computer checkmates |
| 2 | Medium | compThinking persists after game over |
| 3 | Low | Missing moveHistory dependency |
| 4 | Low | Stockfish fallback ignores selected strength |
| 5 | Low | Timer double-decrement (latent) |
