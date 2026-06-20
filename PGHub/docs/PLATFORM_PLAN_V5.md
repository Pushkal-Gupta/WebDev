# PGcode — Platform Plan V5 (2026-05)

The live punch list. V4 and earlier are archived in `docs/PLATFORM_PLAN.md`. Tackle top-down. Each item has acceptance criteria so "done" is unambiguous.

## North star

> Measurably better than NeetCode + GeeksforGeeks + Programiz combined. World-class content depth across DSA + 14 langs + SQL + system design + DBMS + OS + CN. Polished UI. Server-side grading. No half-built features.

---

## P0 — landing-pad fixes (this session)

### 0.1 Home dashboard at `/` *(in flight)*
- **Current:** `/` is `RoadmapView` (ReactFlow graph). Cold-start users land on a dense diagram with no orientation.
- **Build:** `src/components/Home.jsx` — greeting (`Good morning, {name}`), streak ring + count, POTD card (deterministic by date), Resume-Last-Problem card (`localStorage.lastProblem:${uid}`), Random Unsolved button, recent-solved horizontal scroll, weak-topics card, 6 quick-start tiles (Practice / Learn / Roadmaps / Courses / Playground / Contests).
- **Done when:** `/` renders Home; `/roadmap` and `/roadmaps/dsa-fundamentals` still render the graph; `verify.js` passes; the dashboard works for both signed-in and signed-out users (signed-out gets generic content + login CTA).

### 0.2 `grade-submission` edge function *(in flight)*
- **Build:** `supabase/functions/grade-submission/index.ts` accepts `{ problem_id, language, code }`, loads test cases + driver-code template from `PGcode_problems`, wraps code, calls Judge0 (batch), aggregates results, returns `{ verdict, passed, total, per_case: [...] }`.
- **Wire:** `Workspace.handleSubmit` posts there first; falls back to existing `runCodeBatch` client flow on 5xx.
- **Done when:** function deploys via `supabase functions deploy grade-submission`; new submissions show "graded server-side" in dev console.

### 0.3 Streak + POTD RPCs
- **Build:** `migrate-29-home-rpcs.sql`:
  - `pgcode_user_streak(uid)` → `{ current, longest, today_solved }` from `PGcode_user_progress.last_solved_at`
  - `pgcode_potd(d date default current_date)` → `{ problem_id, name }` deterministic
  - `pgcode_random_unsolved(uid)` → random Medium not in user's solved set
- **Hook:** `useUserStreak`, `usePotd`, `useRandomUnsolved` in `src/lib/queries.js`.
- **Done when:** Home shows real values; queries cached for 60s.

### 0.4 Lint cleanup (low-effort, big signal)
- 18 hook warnings (byId useMemo deps in PracticeHistory, ProblemList, ProgressDashboard, ContestDetail, RoadmapTrack, CoursePage; missing deps in SolutionView, SqlPlayground, Workspace).
- Wrap each `byId = ...` derivation in its own `useMemo`. Add missing deps with care (some are intentional).
- **Done when:** `npm run lint` = 0 errors, ≤ 4 acknowledged warnings.

---

## P1 — content depth (the actual "make it world-class" work)

### 1.1 Mass long-tail problem hydration (970 → 0 stubs)
- 970 `PGcode_problems` rows still have NULL `method_name` / `params` / `return_type` / `test_cases`.
- **Approach:** script `scripts/auto-grade-stubs.js` infers `method_name` (camelCase of name), guesses params/return from topic + heuristics, generates 5-10 basic tests from a topic template library.
- **Sweep:** arrays (245), strings (170), linked lists (95), trees (130), graphs (110), DP (130), bitmask (40), math (50), system design (15-20 cards via DBMS/CN/OS sections).
- **Done when:** every problem opens, Run button works, at least one test case green. `verify.js` adds a `grading-coverage` step.

### 1.2 Author 25+ more concepts
Currently 22. Target: 47.
- Strings: KMP, Z-algorithm, suffix array, Aho-Corasick, Manacher's, rolling hash
- Trees: LCA (binary lifting + Tarjan offline), heavy-light decomposition, Euler tour, segment tree (lazy propagation), Fenwick tree (range update)
- Graphs: A*, bidirectional BFS, max flow (Edmonds-Karp), 2-SAT, articulation points, bridges
- Math: Chinese remainder theorem, Mobius function, sieve of Eratosthenes (extended), modular inverse
- Misc: reservoir sampling, Bloom filter, Mo's algorithm, convex hull (Graham scan + Andrew monotone), sparse table

For each: write `content/concepts/<slug>.md`, add visualization to `conceptVisualizations.js`, hydrate 2-3 flagships covering it.

### 1.3 Flagship batches 47-80 (170 more problems)
Continue the pattern. Each batch: 5 problems × { 5 hints, 10+ test cases, tags, constraints, follow_up, pattern, method_name, params, return_type }.

Target catalog (the rest of LC top-500):
- Hard DP (regex matching, edit distance, distinct subsequences, scramble, palindrome partitioning II)
- Hard graphs (alien dictionary, word ladder II, accounts merge, minimum height trees)
- Hard trees (recover BST, max path sum, serialize/deserialize, vertical order)
- Hard backtracking (N-Queens II, restore IP addresses, palindrome partitioning, word break II)
- Hard strings (substring with concatenation, longest valid parentheses, repeated DNA, max gap)
- Sliding window (sliding window median, minimum window subsequence, longest repeating char replacement)
- Heap/stack (k closest points to origin, find median from data stream, dinner plate stacks)

### 1.4 Course depth (DSA II + language tracks)
- **Python**: add chapters for asyncio, decorators, generators, type hints depth, dataclasses, walrus, structural pattern matching, contextvars
- **JavaScript**: closures deep, prototypes vs classes, ES2020-2024 features, generators, async iterators
- **TypeScript**: discriminated unions, mapped types, conditional types, infer, declaration merging, decorators stage 3
- **Java**: streams, concurrent collections, virtual threads (Project Loom), records, sealed classes
- **C++**: smart pointers deep, STL algorithms tour, templates + concepts, move semantics, RVO/NRVO
- **Go**: goroutines + channels patterns, context propagation, error handling idioms, generics
- **Rust**: ownership + borrow checker examples, lifetimes, async, traits, error handling
- **SQL**: window functions, CTEs (recursive), execution plans, indexing strategies, NULL semantics
- **React**: useEffect, useMemo/useCallback, custom hooks, context, Suspense, error boundaries, concurrent features

Each missing lesson needs: explanation, 2-3 worked examples (runnable in `/playground/share/...`), exercise problems linked to PGcode catalog.

### 1.5 SQL playground depth
- 50+ SQL problems (replicate LC SQL 50 + add 30 originals)
- Schema browser (left panel)
- Saved-query library
- Execution plan view (`EXPLAIN ANALYZE`)
- Multi-statement support
- CSV export

### 1.6 System design module
New folder `content/system-design/` with:
- Caching (LRU, LFU, write-through vs write-back)
- Load balancing (L4 vs L7, consistent hashing)
- Databases (CAP, sharding strategies, replication models)
- Queues + streams (Kafka basics, exactly-once vs at-least-once)
- Service discovery + service mesh
- Rate limiting (token bucket, leaky bucket, fixed window)
- Real-world walkthroughs (URL shortener, news feed, ride-share, chat)

Surface at `/learn/system-design`.

### 1.7 DBMS + OS + CN reference cards
- DBMS: ACID, isolation levels, B+ tree internals, MVCC, deadlock detection
- OS: process vs thread, scheduling, virtual memory, paging, IPC, locking primitives
- Networking: TCP handshake, TLS, HTTP/2 + HTTP/3, DNS, CDN edges

Surface at `/learn/dbms`, `/learn/os`, `/learn/cn`. New modules in `PGcode_modules` table.

---

## P2 — new user-visible features

### 2.1 Streak heatmap on `/progress`
- GitHub-style 365-day grid keyed by `PGcode_user_progress.last_solved_at`.

### 2.2 Solution sharebility
- After solve, generate `/share/solution/:slug` (reuses playground snippet table).

### 2.3 Code diff / compare
- `/compare` route — paste two attempts; colored line diff.

### 2.4 Snippet library
- `PGcode_user_snippets` table; user-curated templates surfaced in Playground sidebar.

### 2.5 Contest leaderboards
- Currently contests exist but no per-contest leaderboard view. Rank by penalty-time + solved count.

### 2.6 Company mock OAs
- Each company gets a "Mock OA" button — 3-4 problems timed (60-90 min) with proctor mode (no copy-paste, fullscreen).

### 2.7 Random Unsolved everywhere
- Already a /Home tile (0.3); also wire into SidePanel and CommandPalette.

### 2.8 Resume Last Problem
- Home tile reads `localStorage.lastProblem:${uid}` set by Workspace on mount.

---

## P3 — polish

### 3.1 Mobile
- Workspace 3-pane stacks below 768px (currently 900).
- SubNav font ≥ 11px.
- SidePanel collapsible.
- Bottom nav already exists; verify icons render.

### 3.2 A11y
- Keyboard nav on every `Select` dropdown (focus, arrow, enter, esc).
- ARIA labels on all icon-only buttons.
- Focus-visible verified per palette.

### 3.3 Performance
- Main bundle 542 KB → target 300 KB. Split RoadmapView ReactFlow into a separate chunk (already lazy, but bundling pulls it in).
- Virtualize `ProblemList` rows if > 200.
- Image hosting: move flagship illustrations to Supabase storage + CDN.

### 3.4 AI Assist expansion
- "Explain this code" button in Workspace + Playground.
- "Suggest next problem" (uses recent solves + weak topics).
- "Debug my code" — paste failing case, get hint.
- All opt-in, keyed by user-provided Anthropic key in Settings.

### 3.5 Empty-state copy sweep
- Replace any leftover "Run migrate-XX..." dev instructions with friendly messages.

### 3.6 Dark/light tuning per palette
- Verify all 5 palettes (dark, light, midnight, solarized, dracula) on every page. Solarized currently has low contrast in Workspace tab bar.

---

## P4 — operational

### 4.1 Docs refresh
- `docs/PLATFORM_PLAN.md` archived; this file is canon.
- `docs/CONTRIBUTING.md` — how to add a flagship / concept / course lesson.
- `docs/CHANGELOG.md` — surface to users.

### 4.2 CI / verify automation
- Add `npm test` that runs `verify.js`.
- GitHub Actions on push to `main`: lint + build + verify.

### 4.3 Backup
- Weekly Supabase pg_dump → encrypted blob in storage.

---

## Acceptance — when each priority block lands

After P0 → `/` is a real dashboard, Workspace grades server-side, lint is clean, streak + POTD show real numbers.
After P1 → catalog has zero stubs, 47+ concepts, 80 flagship batches, 9 languages with deep courses, system design module, DBMS/OS/CN reference.
After P2 → user has heatmap, share solutions, compare, snippets, contest leaderboard, company mock OAs.
After P3 → mobile-class on every page, a11y-clean, < 300 KB initial bundle, AI Assist on every problem.
After P4 → docs current, CI gates regression, backups automated.

---

## How to consume this plan

Pick the highest-level open item. Do it fully. Verify (`node scripts/verify.js`). Commit message ready for the user. Move to the next. Never start two P-blocks at once.
