# Bug Report: Auth & User Profile

## BUG 1 — CRITICAL: No Token Refresh for Expired Sessions
**File:** `src/store/authStore.js`, `src/utils/supabase.js`

Supabase access tokens expire after 1 hour. The app has no `onAuthStateChange` listener or auto-refresh logic. After expiry, all API calls fail with 401 Unauthorized silently (no re-login prompt).

**Severity:** CRITICAL

---

## BUG 2 — HIGH: Logout Doesn't Cancel Active Matchmaking Queue
**File:** `src/store/matchmakingStore.js` lines 86–98; `src/App.jsx` lines 107–152

Logging out while searching for a match leaves the queue entry in the DB and the `_pollTimeoutId` / `_elapsedIntervalId` timers running, consuming resources indefinitely.

**Severity:** HIGH

---

## BUG 3 — HIGH: Logout Doesn't Clean Up friendStore
**File:** `src/store/friendStore.js` — missing unsubscribe method

`notificationStore` has `unsubscribe()` called on logout (App.jsx line 150), but `friendStore` has no equivalent. Previous user's friends/requests persist in memory for the next login.

**Severity:** HIGH

---

## BUG 4 — HIGH: Logout Doesn't Unsubscribe Online Game Channel
**File:** `src/App.jsx` lines 237–240

If the user logs out while in an active online game, `onlineChannelRef.current` is never unsubscribed. The channel continues broadcasting game events.

**Severity:** HIGH

---

## BUG 5 — MEDIUM: Custom Display Name Not Loaded After Re-Login
**File:** `src/store/authStore.js` lines 15, 24

Username is derived from email at login time. Custom display names saved to Supabase auth metadata are ignored on re-login, so the user sees their email prefix instead of their chosen name.

**Severity:** MEDIUM

---

## BUG 6 — MEDIUM: Display Name Update Not Reflected in authStore
**File:** `src/App.jsx` lines 1237–1248

After a successful profile update (Supabase auth updated), `authStore.username` is never updated in memory. Other UI elements (LeftNav, online game, etc.) continue showing the old name until page refresh.

**Severity:** MEDIUM

---

## BUG 7 — MEDIUM: AccountScreen Games List Not Cleared on Logout
**File:** `src/App.jsx` lines 1212–1217

The `useEffect` that loads games triggers on `user?.id` change but doesn't explicitly clear the array when user becomes `null`. The previous user's game list can briefly flash for a new login.

**Severity:** MEDIUM

---

## BUG 8 — MEDIUM: AccountScreen Local State Not Cleared on Logout
**File:** `src/App.jsx` line 1262

The logout button calls `logout()` but does not reset AccountScreen local state (`games`, `editName`, `activeTab`). A new user logging in without refresh may briefly see stale state.

**Severity:** MEDIUM

---

## BUG 9 — MEDIUM: Data Loads Not Awaited After Login
**File:** `src/App.jsx` lines 143–152

`loadNotifications()`, `subscribeNotifs()`, and `loadFriends()` are fired without `await`. The UI renders before data is ready, showing empty states momentarily.

**Severity:** MEDIUM

---

## BUG 10 — LOW: Google Sign-In Error Handling Ambiguous
**File:** `src/components/modals/LoginModal.jsx` lines 58–67

Google sign-in triggers a redirect. The `catch` block may never execute because the page navigates away before the error is thrown, making error recovery unreachable.

**Severity:** LOW

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | No token refresh |
| 2 | High | Matchmaking not cancelled on logout |
| 3 | High | friendStore not cleaned up |
| 4 | High | Online channel not unsubscribed |
| 5 | Medium | Custom display name ignored |
| 6 | Medium | Display name update not reflected |
| 7 | Medium | Games list not cleared |
| 8 | Medium | AccountScreen state not cleared |
| 9 | Medium | Data loads not awaited |
| 10 | Low | Google auth error unreachable |
