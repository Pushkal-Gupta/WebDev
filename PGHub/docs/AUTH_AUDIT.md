# Auth & Identity Audit — PG hub ↔ PGcode

> Snapshot taken during Phase 0.5. Numbers and file paths reflect the state of `~/Desktop/WebDev/PG` and `~/Desktop/WebDev/PGcode` at the time of audit.

## TL;DR
- ✅ Both surfaces use the **same Supabase project** (`ykpjmvoyatcrlqyqbgfu.supabase.co`). Confirmed via `PG/main.js:2` and `PGcode/.env:1`.
- ✅ Because they share the project and the same root domain (`pushkalgupta.com`), the Supabase JS client's default `persistSession: true` makes the auth session **already shared** between the two apps via localStorage.
- ⚠️ The PG hub's login/signup flow does **not** write a profile row, so a brand-new user lands in PGcode with no `PGcode_profiles` row. PGcode's settings persistence relies on that row existing.
- ⚠️ No cross-app navigation: nothing in the PGcode navbar links back to PG, and vice versa.
- ⚠️ Display name source is duplicated — PG doesn't sync to `PGcode_profiles.display_name`.

## Inventory

### PG hub (`~/Desktop/WebDev/PG`)
- `main.html` — static HTML shell, includes the Supabase v2 CDN script.
- `main.js` — vanilla JS auth handler with:
  - Email/password signup + login (`signUp`, `signInWithPassword`)
  - Google OAuth (`signInWithOAuth`)
  - Password reset via OTP
  - Auth modal UI

### PGcode (`~/Desktop/WebDev/PGcode/src`)
- `src/lib/supabase.js` — creates a `createClient` using the same Supabase URL.
- `src/App.jsx:93-105` — listens via `supabase.auth.getSession()` + `onAuthStateChange`.
- `src/components/LoginModal.jsx` — independent login modal (duplicated UX with PG).
- `src/components/AccountModal.jsx` — logout button calls `supabase.auth.signOut()`.

## What works automatically
Because the Supabase JS client persists the session under `sb-${PROJECT_REF}-auth-token` in localStorage, and both apps are served under the same origin (`pushkalgupta.com`), they read the same storage entry:

- Log in on PG → navigate to PGcode → `supabase.auth.getSession()` returns the live session. No extra wiring required.
- Logout in either app calls `signOut()` which clears the localStorage entry → the other app's `onAuthStateChange` fires on next visit (or immediately if both are open) and reflects logged-out state.

## What's broken / inconsistent

| # | Issue | Impact | Fix |
|---|---|---|---|
| A1 | New signups have no `PGcode_profiles` row | First PGcode visit fails to load profile (theme defaults to local, preferred language can't be saved) | On signup in PG, immediately `upsert` a profile row keyed by `user.id` with sensible defaults. Alternative: trigger on the Supabase side via a postgres function. |
| A2 | Display name lives in two places | PG might show `user.email` while PGcode shows custom display_name (or vice versa) | Pick `PGcode_profiles.display_name` as canonical. PG reads/writes through it. |
| A3 | Avatar URL never synced | Google OAuth pulls a Google avatar into auth metadata; not surfaced anywhere | Add `PGcode_profiles.avatar_url`; populate on signup from `user.user_metadata.avatar_url`. |
| A4 | No cross-app navigation | User has to manually type URL to switch | Add a "← Back to PG" link in PGcode Navbar (hard-coded `https://pushkalgupta.com/PG/main.html` for now). Add a "Coding →" link in PG hub. |
| A5 | Duplicate login UI | Two different login modals (PG's HTML, PGcode's React) | Long-term: centralize. Short-term: keep both but make PGcode's modal redirect to PG's if the user is on the same domain (avoids password re-entry confusion). Or simply hide PGcode's modal and require login via PG. |

## Recommended fix order

1. **Trigger profile row on signup** (A1) — single SQL function, biggest impact.
2. **Cross-app nav links** (A4) — 5-minute UI change, makes the "one platform" feel real.
3. **Avatar sync** (A3) — small schema add + 3 lines in PG signup handler.
4. **Display name canonicalization** (A2) — refactor PG to read from `PGcode_profiles`.
5. **Login UI consolidation** (A5) — defer; not blocking.

## SQL: trigger profile row on signup

Run this in Supabase SQL editor. Creates a profile row automatically when a new user is created via `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."PGcode_profiles" (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Adds `avatar_url` column too — that migration is in `scripts/migrate-12-profile-extensions.sql`.

## Verification plan (post-fix)

1. Create a fresh test user via PG hub email/password signup → check that a `PGcode_profiles` row exists for that user immediately.
2. Log in via PG → navigate to PGcode → confirm display name shows up in Navbar/Settings without prompting login again.
3. Click "Back to PG" from PGcode → arrive on PG already logged in.
4. Sign out in PGcode → reload PG → see logged-out state.

## What's NOT in scope here

- Building a unified design system across PG and PGcode (out of scope for Phase 0.5; tracked in main plan).
- Migrating PG from vanilla JS to React/Vite (massive scope; not necessary for auth unification).
- Adding social providers beyond Google.
- Multi-factor auth.
