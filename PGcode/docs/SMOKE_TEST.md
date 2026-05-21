# PGcode Smoke Test — Walkthrough

> Run through this in a browser after the dev server starts. ~10 minutes end to end.
>
> Start the dev server: `npm run dev` (port 5173).
> If anything fails, note the step number and tell me what you saw.

## Prerequisites — Supabase migrations to apply (one time)

Open the Supabase SQL editor and run these in order:

1. **`scripts/migrate-10-user-settings.sql`** — `theme_preset` + `preferred_lang` on profiles.
2. **`scripts/migrate-11-learn-schema.sql`** — modules / concepts / concept_problems / concept_prereqs / user_concept_progress, seeds 15 modules.
3. **`scripts/migrate-12-profile-extensions.sql`** — `avatar_url` + auto-create-profile trigger + backfill.
4. **`scripts/migrate-13-problem-detail.sql`** — hints / editorial / pattern / status taxonomy / submissions log.
5. **`scripts/migrate-14-lists.sql`** — curated lists (Blind 75, NeetCode 150, SQL/Python/Java/C++/JS 50, DP/Graph/Tree 50).
6. **`scripts/migrate-15-roadmap-engine.sql`** — data-driven roadmap engine + 8 seed roadmaps.
7. **`scripts/migrate-16-playground-snippets.sql`** — shareable playground snippets table.
8. **`scripts/migrate-17-achievements.sql`** — per-user achievements.
9. **`scripts/migrate-18-companies.sql`** — `PGcode_companies` + `PGcode_company_problems` + 29 seeded companies (Google, Meta, Amazon, Microsoft, Apple, Adobe, Uber, Netflix, plus 8 Indian-tier and 5 finance/quant).
10. **`scripts/migrate-19-admin-roles.sql`** — `PGcode_profiles.role` column. Grant yourself admin: `UPDATE "PGcode_profiles" SET role = 'admin' WHERE user_id = '<your-uid>';`
11. **`scripts/migrate-20-snippet-views-rpc.sql`** — atomic view-count RPC for playground snippets (avoids read-then-write race).

Then to seed Blind 75 list:
```bash
VITE_SUPABASE_URL=https://ykpjmvoyatcrlqyqbgfu.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<service_role> \
  node scripts/import-blind-75.js
```

## Automated self-verification (fastest signal)

```
node scripts/verify.js
```

Runs in ~10s. Checks: concept parse (16 files), migration SQL sanity, ESLint within budget, Vite build + lazy-chunk emission, dev server serves 20 key modules with HTTP 200. Exits non-zero on any hard failure. Run this before every commit.

Then import the **16 exemplar concepts**:

```bash
# From the repo root
VITE_SUPABASE_URL=https://ykpjmvoyatcrlqyqbgfu.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_supabase_dashboard> \
  node scripts/import-concepts.js
```

Should print "✓ Imported 16 concepts". If you don't want to grant service-role access yet, run with `--dry` to preview without writing — the rest of the smoke test still works, you'll just see empty-state messages on the Learn pages.

---

## Smoke test steps

### 1 · Home / Dashboard
- [ ] Visit `/` (or just open `npm run dev`).
- [ ] See "Good morning/afternoon/evening, *{your name or email}*".
- [ ] Five stat cards visible: Streak, Overall %, Easy, Medium, Hard.
- [ ] "Continue where you left off" section shows your most recent 4 problems (or empty state if logged out).
- [ ] "Weak topics" panel lists topics under 40% completion.
- [ ] "Quick links" grid: Roadmap / Learn / Playground / Progress / Practice.
- [ ] "Today's problem" button takes you to the first unsolved problem.

### 2 · Cross-app navigation (Phase 0.5)
- [ ] Navbar top-left shows "PG hub" pill with a back arrow.
- [ ] Clicking it opens `https://pushkalgupta.com/PG/main.html` in the same tab.
- [ ] Log in via PG hub, navigate back to PGcode → already logged in (no re-prompt).

### 3 · Command palette (Phase 1)
- [ ] Press **Cmd+K** (or Ctrl+K on Windows/Linux) anywhere in the app.
- [ ] Palette opens centered, ~120px from top, with input focused.
- [ ] Typing "lear" highlights "Learn library" with arrow keys + Enter navigating there.
- [ ] Typing a problem name (e.g. "Two Sum") shows it under "Problems" group.
- [ ] **Esc** closes the palette.

### 4 · Learn library (Phase 2)
- [ ] Click "Learn" in SubNav or visit `/learn`.
- [ ] See 15 module cards: Foundations, Math & Number Theory, ..., CS Core.
- [ ] Click "Linked Lists" → module page shows "Loop Detection" in the list.
- [ ] Click into Loop Detection → see Overview / Intuition / Approaches / Complexity / Reference implementation / Pitfalls / Interview tips.
- [ ] Language tabs (Python / JavaScript / Java / C++) under the code block swap snippets.
- [ ] Sidebar "Practice problems" shows linked problems (empty if you haven't linked any yet — that's fine for now).
- [ ] Repeat for "Manacher's Algorithm" under Sorting & Strings and "Bellman-Ford" under Graphs.
- [ ] Breadcrumbs at top navigate back cleanly.

### 5 · Roadmap (renamed route)
- [ ] Click "Roadmap" in SubNav → loads `/roadmaps/dsa-fundamentals` (your existing ReactFlow roadmap).
- [ ] Hover a topic node → check Network panel: a Supabase request for that topic's problems prefetches.
- [ ] Click a node → TopicModal opens with the topic's problems. Mark something complete → instant flip, no server-roundtrip wait.

### 6 · Practice (renamed route)
- [ ] Click "Practice" → loads `/practice` (formerly `/problems`).
- [ ] Filters work (Topic / Status / Sort / Difficulty toggles).
- [ ] Star a problem → instant flip; reload → still starred (assuming logged in).

### 7 · Playground (Phase 0 — more languages)
- [ ] Visit `/playground`.
- [ ] Language dropdown shows **14 languages**: Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, C#, Ruby, Kotlin, Swift, PHP, Bash.
- [ ] Switch to Go → starter template appears (`package main` ...).
- [ ] Cmd+Enter runs and prints "Hello, PGcode!".
- [ ] Refresh page → your last code per language is restored.
- [ ] Try TypeScript with `const x: number = 42; console.log(x);` → runs successfully.

### 8 · Progress dashboard (Phase 1)
- [ ] Visit `/progress` (or click Progress in SubNav).
- [ ] Ring chart shows overall %.
- [ ] Three difficulty bars (Easy/Medium/Hard) with progress fills.
- [ ] Streak card visible (right side).
- [ ] "Last 12 weeks" heatmap shows 84 cells; days with solves are tinted with the easy color.
- [ ] "Topic mastery" lists every topic sorted by completion %.

### 9 · Settings (Appearance tab)
- [ ] Account → Settings → land on Appearance tab.
- [ ] Switch through all 5 themes: Default Dark, Default Light, Midnight, Solarized, Dracula. Each fully re-skins the UI.
- [ ] Change preferred language to Java → open a new problem in Workspace → editor opens with Java by default.
- [ ] Sign out and back in → theme + preferred language persist (read from profile).

### 10 · Bundle / network
- [ ] DevTools → Network → first load.
- [ ] Main JS bundle is ~510 KB (down from 815 KB).
- [ ] Visiting `/playground` triggers a separate ~6 KB Playground chunk + Monaco chunks load on demand.
- [ ] Visiting `/roadmaps/dsa-fundamentals` triggers a 195 KB RoadmapView chunk (ReactFlow) — only when you actually go there.

### 11 · Auth flow (Phase 0.5)
- [ ] Sign up a fresh test user via PG hub.
- [ ] Navigate to PGcode without re-login.
- [ ] Open Settings → display name is populated from your name/email.
- [ ] Theme toggle persists in Supabase (check `PGcode_profiles.theme_preset` in the SQL editor after toggling).

---

## Phase 3 — Problem detail tabs (NEW)
- [ ] Open any problem in the Workspace → see new **Hints** tab between Description and Solution.
- [ ] Hints tab shows 5 tiered levels with progressive reveal locked behind buttons.
- [ ] Switch to **Submissions** tab → see new **Status Pill** (Not Started / Attempted / Solved / Mastered / Bookmarked / Needs Revision) instead of the binary Mark Complete button.
- [ ] Change status → it persists to `PGcode_user_progress.status`.
- [ ] Existing Notes + Confidence dots still work and now correctly auto-schedule `next_review_at` based on confidence + solve count (via `src/lib/spacedRepetition.js`).

## Phase 4 — Practice filters expansion (NEW)
- [ ] `/practice` now has a **List** dropdown filter — pick "Blind 75" (once populated) and only those problems show.
- [ ] Status dropdown now uses the 6-state taxonomy.

## Phase 5 — Roadmap engine (NEW)
- [ ] Visit `/roadmaps` → see 8 roadmap cards: DSA Fundamentals (featured), Blind 75, Grind 75, SQL 50, Python 50, plus Graph/DP/Tree 50.
- [ ] Click "DSA Fundamentals" → goes to the existing ReactFlow graph.
- [ ] Click "Blind 75" → list-style track. Empty state shown until you populate `PGcode_list_problems` for `blind-75`; auto-renders the list once seeded.

## Phase 8 — Spaced repetition (NEW)
- [ ] Solve a problem → set confidence 4 (Easy). `next_review_at` should land ~10 days out (was previously 7 days regardless of solve count). Solve again with confidence 4 → next interval grows (~22 days). Confidence 1 (Again) resets to tomorrow.
- [ ] `/review` lists overdue + due-today problems.

## Home additions
- [ ] **Problem of the Day** card sits between hero and main grid. Same problem all day for everyone on the same tier; rotates at midnight.
- [ ] If you've already solved POTD, it shows a "Solved ✓" tag.

## Phase 6 — Compiler enhancements (NEW)
- [ ] Visit `/playground` → click "Web sandbox" link → land on `/playground/web`. 3-pane HTML/CSS/JS editor with live iframe preview. Edit HTML, see preview update within ~400ms.
- [ ] Click "SQL playground" link → land on `/playground/sql`. SQLite loads in browser (~1s first time). Cmd+Enter runs the seed query, returns a table of departments with headcount/avg/top salary.
- [ ] Try a sample query from the sidebar — populates the editor.
- [ ] Back to `/playground` → click "Share" → URL is copied to clipboard and you're navigated to `/playground/share/<slug>`. Open that URL in a new tab/incognito — the snippet loads.
- [ ] In `/playground/web`, hit "Fullscreen" — preview takes the whole viewport; click again to exit.

## Phase 7 (partial) — Company prep (NEW)
- [ ] Click "Companies" in SubNav → `/company`. Featured grid shows Google, Meta, Amazon, Microsoft, Apple, Adobe, Uber, Netflix. Below: Global + India regions.
- [ ] Click any company → `/company/:slug`. Header shows tagline, HQ chip, domain. Empty state until you populate `PGcode_company_problems`.
- [ ] After populating: difficulty stat cards + top-topic chips + filterable problem list sorted by frequency_score.

## Phase 9 — Achievements (NEW)
- [ ] Visit `/progress` → see a new "Achievements" panel above topic mastery. ~13 badges, with earned ones lit up by color (easy=green, hard=red, accent=cyan) and locked ones grayed with a lock icon.
- [ ] As you solve more problems, badges unlock automatically (no manual claim).

## Discovery → fix loop (this push)

Ran 3 parallel discovery agents (data layer / UI / routing+auth), applied highest-severity fixes, then 2 parallel verification agents (perf / cross-route UX) and looped those fixes back. End state: 14/14 verifier checks, 0 lint errors, 27/27 dev-server modules serve 200.

**Bugs caught and fixed in the loop:**
- **Auth cache leak on user switch** — `queryClient` and persisted localStorage cache now flush whenever the auth user id changes. Privacy on shared devices.
- **Theme toggle broke custom palettes** — toggling from Midnight/Dracula sent you straight to Light. Now toggles cycle between dark/light *families* and remember your last palette in each.
- **Workspace query key mismatch** — saved per-problem progress to one key but invalidated a different one, leaving stale cache. Fixed: optimistic merge into both per-problem and bundle caches.
- **`useDryRun` query key instability** — stepIds was a fresh array each render, causing the questions query to refetch every time. Memoized + sorted for stable identity.
- **Workspace `single()` on missing topic** — would throw instead of returning null. Switched to `maybeSingle()`.
- **Playground share missing snippet** — silently kept the editor empty. Now shows an explicit "No snippet found at /…" error row.
- **Playground view-count race** — read-then-write on `view_count` lost updates under concurrent tabs. Now goes through `increment_snippet_views(slug)` RPC (atomic), with a graceful fallback.
- **Heatmap unstable keys** — index-keyed; switched to date.
- **Navbar toggle non-interactive div** — replaced with `<button>` (keyboard-accessible, screen-reader-readable).
- **Rules-of-hooks violation in RoadmapTrack** (caught earlier) — verified no regressions.
- **AI module pulled into Workspace + Learn chunks** — switched to dynamic `await import('../lib/ai')` inside the callback so it only loads when the user asks for AI.
- **ReviewQueue silent failure** — caught + logged but no UI state. Now shows an error card with retry.
- **ConceptPage missing isError state** — would render "Concept not found" on network errors. Now distinguishes.
- **AdminPanel missing error fallback** — query failure was silent. Now banners the failure.
- **Legacy /problems link in ReviewQueue** — switched to /practice.

## New features (this push)

- **`/admin`** — content management surface. Stats tiles (concept count, draft count, etc), recently authored concepts table, content-task list (drafts pending publish, concepts not yet linked to problems), terminal command runbook. Gated by `PGcode_profiles.role IN ('admin', 'editor')` — non-admins get a denied screen with the SQL command to self-grant.
- **`scripts/import-blind-75.js`** — bulk-seeds the Blind 75 list by name-matching against your existing `PGcode_problems`. Idempotent. Run with `--dry` to preview.
- **AI helper layer (`src/lib/ai.js`)** — Claude API integration. Three call sites:
  - "Get an AI hint" button on `HintsPanel` (per-problem, persisted to localStorage).
  - "Generate a quick quiz" on every `ConceptPage` — generates an MCQ + explanation from the concept content.
  - Reserved: `aiExplainFailure` for explaining wrong submissions (not yet wired into a UI).
  - Opt-in via Settings → AI tab. Key stored locally only.
- **`ConceptQuiz` component** — interactive MCQ on every Learn concept page (when AI is enabled). Animated entrance, picked/correct/wrong color states, explanation reveal.
- **`ComplexityChart` component** — animated bar chart comparing O(1) / O(log n) / O(n) / O(n log n) / O(n²) / O(2ⁿ). Highlights the concept's own complexity by parsing the `complexity.time` string.
- **Page enter animations** on Learn / Roadmap / Company route headers (fade-up).
- **Global hidden scrollbars** on route containers (`theme.css`) — was the user's pet peeve. Inner panels still scroll with subtle token-colored bars.

## Cleanup

- **Removed `Home.jsx` + `Home.css`** — user requested `/` open with the roadmap, and the dashboard was duplicative of `SidePanel`.
- **Removed "PG hub" pill in Navbar** — the brand title already does that link; redundancy gone.
- **Lint baseline 53 → 0 errors** maintained across all changes.

## Cleanup + bug fixes (previous push)

- [ ] **Bug fixed:** `RoadmapTrack.jsx` had `useMemo` calls after early-return for missing roadmap — rules-of-hooks violation that would crash on slug-not-found. All hooks now hoisted above conditional returns.
- [ ] **DRY:** the `\\n|\n` topic-name splitter regex appeared in 6 files; pulled into `src/lib/topicLabel.js` (`primaryTopicLabel` + `fullTopicLabel`).
- [ ] **Lint baseline 53 → 0 errors.** Achievements:
  - Empty `catch {}` blocks in Workspace annotated.
  - Dead `handleSave`, `showConsole`, `cases`, `markComplete` removed from Workspace.
  - `Section` component extracted out of `ConceptPage` (fast-refresh rule).
  - `STATUSES`/`legacyToStatus` moved from `StatusPill.jsx` to `src/lib/status.js` (fast-refresh).
  - `Math.random()` in TopicModal skeleton replaced with deterministic widths.
  - ESLint config: added `argsIgnorePattern: '^_'`, merged Node globals.
  - `\Z` → `$` regex bug in import-concepts.js.
  - Unused `useRef`, `_i`, `_b`, `data` cleaned up.
- [ ] **Mobile polish:** `theme.css` now has a 700px-breakpoint block tightening all new routes (Home / Progress / Roadmaps / Companies / Learn / Playgrounds) — container width 96%, smaller titles, stacked hero actions, condensed problem rows.
- [ ] Verifier now checks 23 modules + 14 lazy chunks (was 20+12).

## What's queued for next session

- **Operational** (data entry — you can do this without me):
  - Populate `PGcode_list_problems` for Blind 75 (75 problem IDs).
  - Seed `PGcode_roadmap_nodes` for non-default tracks (Phase 5 polish).
  - Concept ↔ problem linking via `relatedProblems` in markdown.
- **Phase 3 advanced**: editorial markdown rendering + per-language submission history table.
- **Phase 7**: Contests / Company prep / Assessments (3 sessions in plan).
- **Phase 10**: Admin CMS (visual content manager).
- **Phase 12**: AI features (gated by your Anthropic API key).
- **Phase 13**: Community / discussions.

## Reporting issues

If a step fails, tell me:
1. Which step number.
2. What you expected vs what happened.
3. Console errors (DevTools → Console).
4. Network errors if any (DevTools → Network → red).

I'll dig in and fix.
