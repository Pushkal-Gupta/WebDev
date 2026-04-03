# Bug Report: Leaderboard & Ratings

## BUG 1 — CRITICAL: Rating Updates Are One-Sided (Not Bidirectional)
**Files:** `src/store/ratingStore.js` lines 100–102; `src/App.jsx` lines 279–286

Each player's client independently calculates and updates only its own rating. If Player B's browser crashes before calling `updateOnlineGameRating`, Player A's rating changes but Player B's does not — permanently. No server-side trigger or atomic transaction ensures both sides are updated.

**Severity:** CRITICAL

---

## BUG 2 — HIGH: Leaderboard Doesn't Refresh After Rating Change
**File:** `src/components/Leaderboard/LeaderboardPage.jsx` lines 31–50

Data is fetched only when `category` changes (dependency array: `[category]`). No real-time subscription. After a rated game, the leaderboard shows stale rankings until the user manually switches categories.

**Severity:** HIGH

---

## BUG 3 — HIGH: Opponent's Rating Change Never Stored
**Files:** `src/App.jsx` lines 304–305; `src/store/ratingStore.js` lines 114–119

```js
whiteRatingChange: myColor === 'white' ? delta?.ratingChange : null,
blackRatingChange: myColor === 'black' ? delta?.ratingChange : null,
```

The opponent's rating change is always stored as `null`. Game history records are incomplete and full rating histories can't be reconstructed.

**Severity:** HIGH

---

## BUG 4 — HIGH: Inconsistent Provisional RD Threshold
**Files:** `src/components/Leaderboard/LeaderboardPage.jsx` line 11; `src/components/Profile/RatingCard.jsx` line 23

Leaderboard uses `rd > 150` for the provisional "?" badge; RatingCard uses `rd > 110`. A player with RD=130 is provisional in their profile but not on the leaderboard.

**Severity:** HIGH

---

## BUG 5 — MEDIUM: Fixed Glicko-2 tau for All Time Controls
**Files:** `src/utils/glicko2.js` line 34; `src/store/ratingStore.js` line 76

`tau = 0.5` is hardcoded regardless of time control. Bullet/blitz games have higher variance and should use a higher tau; classical games should use lower. Current ratings change too slowly for bullet and too quickly for classical.

**Severity:** MEDIUM

---

## BUG 6 — MEDIUM: Missing Error Handling for Absent Leaderboard View
**File:** `src/components/Leaderboard/LeaderboardPage.jsx` lines 36–47

If the `leaderboard` Supabase view doesn't exist (migration not applied), the query throws a raw Postgres error with no user-friendly fallback.

**Severity:** MEDIUM

---

## BUG 7 — LOW: No Input Validation in Glicko-2 Functions
**File:** `src/utils/glicko2.js` (all functions)

`score` is not validated to be 0 / 0.5 / 1; RD not checked to stay positive; no NaN/Infinity guards. Extreme inputs could silently persist invalid ratings to the DB.

**Severity:** LOW

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | Rating updates not bidirectional |
| 2 | High | Leaderboard stale after game |
| 3 | High | Opponent rating change not stored |
| 4 | High | Provisional threshold inconsistency |
| 5 | Medium | Fixed tau for all time controls |
| 6 | Medium | No fallback for missing view |
| 7 | Low | No Glicko-2 input validation |
