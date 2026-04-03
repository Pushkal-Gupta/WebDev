# Bug Report: Social Features

## BUG 1 — CRITICAL: Club Auto-Join Failure Leaves Creator Locked Out
**File:** `src/components/Clubs/ClubsPage.jsx` lines 27–29

After creating a club, the auto-join `club_members.insert` is not error-handled. If it fails (RLS policy, network error), the club is created but the creator has no membership and can't manage or access it.

**Severity:** CRITICAL

---

## BUG 2 — HIGH: Incoming Friend Requests Show "Unknown" Username
**File:** `src/components/Friends/FriendsPage.jsx` lines 129–132

The UI reads `req.data?.from_username` but `friendStore` returns raw DB rows without enriching the sender's username. All incoming requests show "Unknown" or crash on undefined property access.

**Severity:** HIGH

---

## BUG 3 — HIGH: Club Member Removal Has No Error Handling
**File:** `src/components/Clubs/ClubPage.jsx` lines 57–61

`handleKick` has no loading state, no catch block, and no user feedback. If the RLS policy rejects the delete or a network error occurs, it fails silently.

**Severity:** HIGH

---

## BUG 4 — MEDIUM: Silent Error Swallowing in Friend Operations
**File:** `src/components/Friends/FriendsPage.jsx` lines 24, 71, 77, 207, 218

Accept, decline, remove, and send operations all have empty `catch {}` blocks. Users have no way to know whether an operation succeeded or failed.

**Severity:** MEDIUM

---

## BUG 5 — MEDIUM: Duplicate Friend Request Race Condition
**File:** `src/components/Friends/FriendsPage.jsx` lines 202–209

No debounce or in-flight check before sending a friend request. Rapid double-clicks create duplicate DB rows before `localStatus` updates.

**Severity:** MEDIUM

---

## BUG 6 — MEDIUM: searchPlayers Errors Show as Empty Results
**File:** `src/store/friendStore.js` lines 84–92

If the `search_players` RPC fails (RLS, network, bad query), the error is swallowed and an empty array is returned. Users see "No players found" instead of an error message.

**Severity:** MEDIUM

---

## BUG 7 — MEDIUM: Tournament Bye Score Not Incremented
**File:** `src/store/tournamentStore.js` line 122

`.update({ has_bye: true, score: supabase.rpc ? undefined : 0 })` — `supabase.rpc` always exists, so `score` is always `undefined`, meaning the bye player's score is never updated to 1.

**Severity:** MEDIUM

---

## BUG 8 — MEDIUM: No Real-Time Tournament Registration Updates
**File:** `src/store/tournamentStore.js` lines 181–197

The Realtime subscription only listens for `UPDATE` events on the tournaments table, not `INSERT` events on `tournament_players`. Other users registering don't appear in real-time.

**Severity:** MEDIUM

---

## BUG 9 — MEDIUM: Club Membership UI Not Immediately Consistent
**File:** `src/components/Clubs/ClubPage.jsx` lines 38–47

After joining a club, `load()` is called but there's a race condition: the optimistic UI update and the reload can produce a brief inconsistent state.

**Severity:** MEDIUM

---

## BUG 10 — LOW: Outgoing Friend Request Shows No Recipient Name
**File:** `src/components/Friends/FriendsPage.jsx` lines 161–168

The "Sent" tab shows "Pending…" without indicating who the request was sent to.

**Severity:** LOW

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | Club creator locked out on auto-join failure |
| 2 | High | Incoming requests show Unknown |
| 3 | High | Club kick has no error handling |
| 4 | Medium | Friend ops silently fail |
| 5 | Medium | Duplicate friend request race |
| 6 | Medium | Search errors show as empty |
| 7 | Medium | Bye score never incremented |
| 8 | Medium | No real-time tournament registration |
| 9 | Medium | Club membership UI race |
| 10 | Low | Sent requests show no recipient |
