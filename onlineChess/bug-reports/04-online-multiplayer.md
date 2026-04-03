# Bug Report: Online Multiplayer

## BUG 1 — CRITICAL: No Channel Cleanup on Page Unload
**File:** `src/App.jsx` — missing `beforeunload` handler

No cleanup when user closes the browser tab or navigates away mid-game. Supabase Realtime channel stays subscribed on the server indefinitely.

**Severity:** CRITICAL

---

## BUG 2 — CRITICAL: No Reconnection Handling
**File:** `src/App.jsx` — entire online game logic

`isOnlineConnected` is set to `true` at match start and **never set back to `false`**. No error handlers on the channel subscription. If network drops, moves are broadcast silently into the void with no feedback to the player.

**Severity:** CRITICAL

---

## BUG 3 — CRITICAL: Timer Not Synced Between Players
**File:** `src/App.jsx` lines 154–159; `src/store/gameStore.js` lines 381–398

Each player runs their own independent `tickTimer()` interval. Move broadcasts include FEN but not remaining time. Clocks drift apart over multiple moves — bullet/blitz games produce unfair timeouts.

**Severity:** CRITICAL

---

## BUG 4 — HIGH: Game Result Not Saved on Connection Loss
**File:** `src/App.jsx` lines 263–314

Result saving depends on the local `gameOver` state being set via an incoming resign/timeout event. If the opponent's connection drops, no event arrives, the game ends server-side but the client never records the result and ratings are never updated.

**Severity:** HIGH

---

## BUG 5 — HIGH: broadcastedMoveRef Reset Race in handleMatchFound
**File:** `src/App.jsx` lines 450–468

`setOnlineRoom()` / `setIsOnlineConnected(true)` fire before `broadcastedMoveRef.current = -1`. If a move is made in the tiny window between, the first move can be skipped or duplicated.

**Severity:** HIGH

---

## BUG 6 — MEDIUM: Opponent Resign Handler Doesn't Unsubscribe Channel
**File:** `src/App.jsx` lines 339–349

`onOpponentResign` sets `gameOver` but doesn't call `unsubscribe()`. The `gameOver` useEffect only calls `endRoom()`, not `unsubscribe()`, so the channel stays open consuming resources.

**Severity:** MEDIUM

---

## BUG 7 — MEDIUM: Move Broadcast Race on Fast Moves
**File:** `src/App.jsx` lines 209–233

Rapid successive moves can be broadcast out of order if Move 2 is queued before Move 1's broadcast completes on a slow network, desynchronizing game state.

**Severity:** MEDIUM

---

## BUG 8 — MEDIUM: No Validation of Incoming Move Legality
**File:** `src/App.jsx` lines 327–333

Incoming moves are applied directly without checking legality or verifying the FEN matches expected state. A corrupted or malicious payload can apply illegal moves.

**Severity:** MEDIUM

---

## BUG 9 — MEDIUM: Board Re-enabled Even If Incoming Move Fails
**File:** `src/App.jsx` lines 327–333

`setDisableBoard(false)` is always called after `makeMove()`, even when `makeMove()` returns `false` (invalid move or pending promotion). Player can interact with board during a pending promotion dialog.

**Severity:** MEDIUM

---

## BUG 10 — MEDIUM: Matchmaking Double-Fire Race Condition
**File:** `src/store/matchmakingStore.js` line 196–201

Two rapid match broadcasts could both pass the `status !== 'searching'` guard before status updates to 'matched', starting the game twice with conflicting data.

**Severity:** MEDIUM

---

## BUG 11 — MEDIUM: Chat Message Deduplication Missing
**File:** `src/App.jsx` lines 404–410, 335–337

Messages are appended both on send and on receipt. No deduplication by message ID. If two players share an identical username, chat becomes unreliable.

**Severity:** MEDIUM

---

## BUG 12 — LOW: Chat Messages Persist Across Games
**File:** `src/App.jsx` lines 102, 361, 387, 455

`chatMessages` is cleared in `handleCreateRoom`, `handleJoinRoom`, `handleMatchFound` but NOT in `leaveOnlineGame()`. Stale chat from a previous opponent can appear in the next game.

**Severity:** LOW

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | No page-unload cleanup |
| 2 | Critical | No reconnection detection |
| 3 | Critical | Timers unsynchronized |
| 4 | High | Result lost on disconnect |
| 5 | High | broadcastedMoveRef race |
| 6 | Medium | Resign doesn't unsubscribe |
| 7 | Medium | Move broadcast race |
| 8 | Medium | No incoming move validation |
| 9 | Medium | Board unlocked after failed move |
| 10 | Medium | Matchmaking double-fire |
| 11 | Medium | Chat deduplication missing |
| 12 | Low | Chat persists across games |
