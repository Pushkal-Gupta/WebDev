# Bug Report: P2P Nearby Play

## BUG 1 — CRITICAL: p2p.close() Not Called When Leaving Tab 12 During Setup
**File:** `src/App.jsx` lines 726–734

`p2p.close()` is only called in the `P2PGame` `onExit` handler. If the user leaves tab 12 while still in `P2PSetup` (before a game starts), the WebRTC connection is never torn down — memory leak + broken state on return.

**Severity:** CRITICAL

---

## BUG 2 — HIGH: p2pMyColor Not Reset When Navigating Away from Tab 12
**File:** `src/App.jsx` lines 95, 726–734

`p2pMyColor` only resets via the explicit Exit button. Switching away via the nav leaves the stale game rendered on return.

**Severity:** HIGH

---

## BUG 3 — HIGH: stale `onConnected` Closure in P2PSetup useEffect
**File:** `src/components/P2PPlay/P2PSetup.jsx` lines 26–33

`onConnected` prop is referenced inside the effect but not in the dependency array `[role]`. Parent re-renders produce a new `onConnected` reference that the effect never captures.

**Severity:** HIGH

---

## BUG 4 — HIGH: Clock Desynchronization Between Peers
**File:** `src/components/P2PPlay/P2PGame.jsx` lines 192–209

Each peer runs its own independent `setInterval` clock. No synchronization signal is sent with moves, so clocks drift and timeout events can fire at different times on each side.

**Severity:** HIGH

---

## BUG 5 — HIGH: No Cleanup of p2p Service on P2PGame Unmount
**File:** `src/components/P2PPlay/P2PGame.jsx` lines 180–190

The component registers `p2p.on()` listeners but never calls `p2p.close()` in its cleanup. If the component unmounts without the `onExit` path (e.g. crash or parent force-unmount), the WebRTC connection persists.

**Severity:** HIGH

---

## BUG 6 — MEDIUM: Infinite Event Listener Accumulation in P2PSetup
**File:** `src/components/P2PPlay/P2PSetup.jsx` lines 26–33

Each `role` change re-runs the effect and registers new `open`/`error` listeners. If `p2p.on()` doesn't deduplicate, listeners stack up and `onConnected` fires multiple times on connection.

**Severity:** MEDIUM

---

## BUG 7 — MEDIUM: ICE Gathering Event Listener Never Removed
**File:** `src/utils/p2pService.js` lines 110–125

The `icegatheringstatechange` listener added in `_waitForIce()` is not removed when the promise resolves, causing multiple `done()` calls if the state changes again.

**Severity:** MEDIUM

---

## BUG 8 — MEDIUM: Invalid Move Messages Silently Dropped
**File:** `src/components/P2PPlay/P2PGame.jsx` lines 182–184

When a peer sends a malformed UCI move, `applyMove()` returns `false` but the return value is ignored. Game hangs / desynchronizes with no error feedback.

**Severity:** MEDIUM

---

## BUG 9 — MEDIUM: Promotion Move Has No Delivery Guarantee
**File:** `src/components/P2PPlay/P2PGame.jsx` lines 247–252

Promotion choice is fire-and-forget. If the data channel drops the message the promoting player is stuck on the overlay indefinitely.

**Severity:** MEDIUM

---

## BUG 10 — MEDIUM: Resign Message Not Acknowledged
**File:** `src/components/P2PPlay/P2PGame.jsx` lines 260–262

Resign is fire-and-forget. If lost, the peer keeps playing while the resigning player sees the game as over.

**Severity:** MEDIUM

---

## BUG 11 — MEDIUM: Stale applyMove in Message Handler useEffect
**File:** `src/components/P2PPlay/P2PGame.jsx` lines 181–190

Message handler `useEffect` depends on `[status, myColor]` but calls `applyMove` which closes over `chess` and other state — stale closure risk.

**Severity:** MEDIUM

---

## BUG 12 — MEDIUM: Single STUN Server, No Fallback
**File:** `src/utils/p2pService.js` lines 11–13

Only `stun.l.google.com` is configured. If unavailable, ICE gathering times out after 10 s with no candidates and no user-friendly error.

**Severity:** MEDIUM

---

## BUG 13 — LOW: Malformed Messages Silently Ignored (No Debug Logging)
**File:** `src/utils/p2pService.js` lines 91–93

`catch { /* ignore bad frames */ }` hides parse errors. Makes protocol bugs impossible to diagnose.

**Severity:** LOW

---

## BUG 14 — LOW: QR Library Import Has No Graceful Fallback
**File:** `src/components/P2PPlay/P2PSetup.jsx` lines 2–3

If `qrcode.react` or `html5-qrcode` are missing, the component fails to load with a blank screen and no user-facing error.

**Severity:** LOW

---

## BUG 15 — LOW: No Retry UI for Failed Offer/Answer Exchange
**File:** `src/components/P2PPlay/P2PSetup.jsx` lines 52–76

On `acceptAnswer()` / `acceptOffer()` failure, user must manually restart the entire QR flow from scratch. No retry button.

**Severity:** LOW

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | p2p.close() missing during setup exit |
| 2 | High | p2pMyColor not reset on nav away |
| 3 | High | stale onConnected closure |
| 4 | High | Clock desync between peers |
| 5 | High | No p2p.close() on component unmount |
| 6 | Medium | Listener accumulation on role change |
| 7 | Medium | ICE listener never removed |
| 8 | Medium | Invalid moves silently dropped |
| 9 | Medium | Promotion delivery unguaranteed |
| 10 | Medium | Resign unacknowledged |
| 11 | Medium | Stale applyMove closure |
| 12 | Medium | Single STUN server |
| 13 | Low | No debug logging for bad frames |
| 14 | Low | No fallback for missing QR libs |
| 15 | Low | No retry UI after failed handshake |
