# Bug Report: Home Screen & Navigation

## BUG 1 — CRITICAL: Broken Confirm Dialog Callback
**File:** `src/App.jsx` lines 492, 505–508, 519–522, 819

`setConfirmAction(() => () => executeTabSwitch(index))` stores a function that *returns* a function.
At the call site: `if (confirmAction) confirmAction()` — this calls the outer wrapper but never invokes the inner function, so the tab switch never executes.

**Trigger:** Start any game → switch tabs → click OK on confirm dialog. Dialog closes but tab doesn't change.

**Severity:** CRITICAL

---

## BUG 2 — HIGH: Missing Tab Cases in executeTabSwitch
**File:** `src/App.jsx` lines 529–546

`executeTabSwitch()` only handles tabs 0–5. Tabs 6–12 (Puzzles, Spectate, Friends, Clubs, Tournaments, Leaderboard, P2P) have no initialization logic.

**Trigger:** Start a game, switch to any of tabs 6–12, confirm dialog. State from prior game may persist.

**Severity:** HIGH

---

## BUG 3 — HIGH: P2P State Not Reset When Leaving Tab 12
**File:** `src/App.jsx` lines 95, 726–734

`p2pMyColor` is only reset via the `onExit` callback inside `P2PGame`. Switching away from tab 12 via the nav does not reset it, so returning to tab 12 shows a stale `P2PGame` instead of `P2PSetup`.

**Trigger:** Connect via P2P → navigate away → navigate back → stale game is shown.

**Severity:** HIGH

---

## BUG 4 — MEDIUM: Confirm Dialog Double-Click Race Condition
**File:** `src/App.jsx` lines 816–821

No debounce or disable on the confirm OK button. Rapid double-clicks execute the callback twice.

**Severity:** MEDIUM

---

## BUG 5 — MEDIUM: confirmAction Closure Can Become Stale
**File:** `src/App.jsx` lines 84–86, 486–527

`confirmAction` is never cleared after use. If dialogs are triggered in rapid succession the stale closure from the first interaction may be invoked by the second.

**Severity:** MEDIUM

---

## BUG 6 — LOW: Live Game Count Never Refreshes
**File:** `src/App.jsx` lines 1008–1014

The Supabase live-game-count query runs once (empty `[]` dep array). The badge count is never updated after mount.

**Severity:** LOW
