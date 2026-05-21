# PGcode → World-Class Coding Platform: Master Plan (V2)

> One source of truth for the multi-phase rebuild. **V2** incorporates review-agent amendments: Auth & Identity is now Phase 0.5, MVP is explicitly defined, content authoring is framed as a pipeline.

## V2 changelog
- **Phase 0.5 — Auth & Identity** added: unified login, shared profile, cross-app navigation between `pushkalgupta.com/PG` hub and `pushkalgupta.com/PGcode`. Must land before deep progress features.
- **MVP scope formalized** (§6.5): Phases 0 → 0.5 → 1 → 2 (schema + 10-15 concepts) → 3 → 4 → 5 → 8. Everything else is post-MVP.
- **Content production framed as a pipeline** (§4): authoring template → reference OCR → markdown drafts → bulk import → linking → review queue. Treated as a product workstream, not "writing later".

## V3 changelog: selective server-side computation
- **No framework migration to Next.js** still locked in. The cost (rewriting routing, Monaco/ReactFlow wrappers, Supabase server clients) hasn't earned its keep yet.
- **Instead, push heavy aggregations into Postgres** (`scripts/migrate-25-server-aggregates.sql`):
  - `pgcode_user_stats(uid)` — one RPC returns totals, submissions count, acceptance, daily activity, by-topic mastery. Replaces a 500-row submission download + a 100-line JS reduce in `PracticeHistory` and `ProgressDashboard`.
  - `pgcode_practice_history(uid, lim)` — server-grouped per-problem history. Compact JSON, not raw row dump.
  - `pgcode_resolve_tutorial(text[])` — single round-trip name→id resolution for the DSA Tutorial outline so the client doesn't need to fetch + index every problem.
- **Static HTML shell in `index.html`** — Navbar + SubNav + loading spinner pre-rendered (with theme already applied from localStorage). First paint is instant even before the JS bundle loads. The React app overwrites the shell on mount.
- **Pattern**: anywhere the client today does "fetch all rows + reduce in JS," we now have a Postgres RPC that does the reduce server-side. Same data, smaller payloads, faster paint.

---

## 0. Where we are right now (after the last session)

**Architecture**: Vite + React 19 SPA, React Router 7 (HashRouter), Supabase backend, Judge0 for code execution (via Supabase edge function `run-code`), Monaco editor, ReactFlow for the roadmap. No SSR.

**Just-shipped foundations**:
- TanStack Query with localStorage cache that survives reloads. Repeat navigation to Roadmap / Problems / Topic modals is now instant.
- Shared query hooks (`src/lib/queries.js`) with hover prefetching.
- Optimistic mark-complete / mark-starred everywhere.
- 5 theme palettes (Default Dark/Light, Midnight, Solarized, Dracula) via CSS variables.
- Per-user `theme_preset` + `preferred_lang` stored in `PGcode_profiles` (SQL: `scripts/migrate-10-user-settings.sql` — **needs to be applied**).
- `/playground` route — Monaco + 4 languages + stdin + Cmd/Ctrl+Enter.
- Audit-discovered bugs fixed: `DryRunViewer` over-fetch, hardcoded light-mode colors, `prefers-reduced-motion` support.

**Known limits**:
- 815 KB main JS bundle — needs route-level code splitting.
- No SSR / SSG (decided; perceived speed already covered by cache).
- No content authoring tooling — every problem and learning section is a hand-written SQL row or component literal.
- Workspace.jsx is 1060 lines, monolithic.

**Design language to preserve** (do not violate):
- Mono headlines (`Space Mono`), serif display (`Lora`), sans body (`Inter`).
- CSS variables only — never hardcode colors.
- No emoji anywhere (use Lucide icons, reference by name in chat).
- Restrained accent colors, high contrast, editorial density.
- Skeleton loaders for every async surface.

---

## 1. Where we're going

A unified platform that supports the full learner loop: **discover → learn → see patterns → solve → run → understand failure → revise → track mastery → prep for interviews/contests**, with content depth that exceeds NeetCode / GFG / Programiz combined, and UX polish that's measurably better than each.

**Six pillars**:
1. **Learn** — concept library, language tracks, integrated 80+ topic syllabus, visual explainers
2. **Practice** — strong faceting, status tracking, POTD, curated lists (Blind 75, SQL 50, etc.)
3. **Roadmap** — data-driven roadmap engine; current single roadmap becomes one of many tracks
4. **Compiler/Playground** — multi-language, sharable, with templates and educational overlays
5. **Progress** — dashboard, streaks, spaced repetition revision, weak-area detection
6. **Contests + Company Prep** — timed contests, company packs, mock OAs, assessments

**Explicit non-goals (for now)**:
- Server-side rendering / framework migration.
- Real-time collaboration / multi-user same-doc editing.
- Browser extension, mobile app, paid tier — all "later, not now".
- Discussion threads at launch — defer until content base is solid.
- AI features ship in Phase 12 only, not earlier; quality first.

---

## 2. Foundational decisions needed from you (gate Phase 1)

Each decision below shapes multiple downstream phases. Defaults are my recommendations; tell me if you want different.

| # | Decision | Default | Why it matters |
|---|---|---|---|
| D1 | Content authoring approach | **Markdown files in repo + bulk SQL import script** (vs an in-browser admin CMS) | Markdown is faster to author, version-controllable, easy to template. Admin CMS is 2 weeks of work for content you can edit faster in VS Code. |
| D2 | Course structure | **One integrated 8-module course** (course I + II merged by topic, not by semester) | You said merge; I'll build the merge table below. |
| D3 | Language coverage priority | **Phase 0: Go, Rust, TypeScript, C#** (in addition to existing Py/JS/Java/C++). SQL playground in Phase 6. | These are the most-requested missing langs for an interview-prep audience. |
| D4 | Roadmap engine | **Data-driven** (any roadmap = `PGcode_roadmaps` row + ordered nodes) — current hard-coded `rigidGrid` becomes seed data for the "DSA Fundamentals" track | Unlocks Blind 75, SQL 50, Python 50, etc. without code changes. |
| D5 | Problem status taxonomy | **Not started / Attempted / Solved / Mastered / Bookmarked / Needs Revision** (6 states, replaces current `is_completed` bool) | Required for serious revision/progress features. Backward compatible via mapping. |
| D6 | URL routing | **Switch from HashRouter to BrowserRouter** (since you'll soon want SEO landing pages for topics/companies) | HashRouter blocks SEO. Migration is small but breaks any external bookmarks with `/#/` — need redirects from server. |
| D7 | Bundle strategy | **Route-level code splitting** — Monaco, ReactFlow, renderers each lazy-load on demand | Today: 815KB main bundle. Target: <250KB initial, rest async. |
| D8 | OCR for the PDF reference material | **You install poppler** (`brew install poppler`) so I can read your slide PDFs and convert to markdown | Otherwise I'm authoring topics blind / from web knowledge, which will diverge from your course material. |
| D9 | AI features (hints, explain-failure) | **Off until Phase 12** — and even then, opt-in toggle in Settings, keyed by your Anthropic API key | Quality + cost control. AI hints baked in too early gets relied on and undermines learning. |
| D10 | Community / discussions | **Defer** — not in scope until Phase 11+ | Moderation is a real ops cost. Wait for an audience first. |

---

## 3. Phased roadmap

Each phase is a **discrete shippable unit** with its own verification. Phases don't bleed into each other; we gate at the end of each one.

### Phase 0 — Stabilize current build (this session continues here)
**Goal**: lock in the foundations we just landed before adding more. Smoke-test, add languages, prep for splitting.

- [ ] Apply `scripts/migrate-10-user-settings.sql` against Supabase (you run; I provide the command)
- [ ] You + me walk through dev server: roadmap → topic modal → workspace → playground → settings (5 themes + lang) → verify each feature
- [ ] Add Go, Rust, TypeScript, C# to `LANG_MAP` in `src/lib/codeRunner.js` + Playground language picker + edge function. (Driver code for `runCodeBatch`/`runCodeMultiCase` stays Py/JS/Java/C++ only since they need `JAVA_CASE_SEP` infrastructure; Playground gets all 8.)
- [ ] Route-level code splitting via `React.lazy` + `Suspense` for Workspace, Playground, ReviewQueue, SolutionPage. Lazy-load Monaco only when an editor route mounts.
- [ ] Virtualize `ProblemList` with `@tanstack/react-virtual` if row count > 200.
- [ ] Cap pre-existing lint errors (the 18 still on the board). Not blockers, just hygiene.

**Verify**: `npm run build` produces a `<300KB` initial bundle. Lighthouse score recorded (baseline for future).

**Estimate**: ~2-3 hours, this session.

---

### Phase 0.5 — Auth & Identity (unified login/profile/session)
**Goal**: one identity, one session, one profile across `pushkalgupta.com/PG/main.html` (hub) and `pushkalgupta.com/PGcode/dist/index.html` (app). Without this, settings/progress/notes feel fragmented.

**Investigation** (must do first):
- Confirm both surfaces use the same Supabase project (URL + anon key).
- Check current login UX in PG hub: does it set a Supabase session cookie/localStorage entry that PGcode picks up?
- Identify the profile table(s) used by each: PGcode uses `PGcode_profiles`. Does the PG hub use a different table or the same?

**Target architecture**:
- Single Supabase project shared.
- Session persists across both surfaces via Supabase's `persistSession: true` default — same domain means the auth cookie is shared automatically (HTTP-only cookies on `*.pushkalgupta.com` or both under root domain).
- Single canonical profile table (`PGcode_profiles` or new `user_profiles`) with all shared fields: display_name, avatar, theme_preset, preferred_lang, plus per-app data namespaced (e.g., `pgcode_settings` JSONB).
- Shared Navbar component (or at minimum, shared "auth bar" widget) so logout/login looks identical.
- Cross-app links in both navs — "← Back to PG" from PGcode, "Open Coding →" from PG.

**Deliverables**:
- Audit doc in `docs/AUTH_AUDIT.md` (current state, gaps).
- Profile schema migration if needed: rename/merge.
- Shared auth helper in `src/lib/auth.js` (used by future Workspace-shell, Home, Settings).
- Cross-nav links wired.

**Verify**: log in on PG hub → land in PGcode → already logged in (no re-prompt). Toggle theme in PGcode → reflected in PG hub if PG has theming. Logout in either propagates.

**Estimate**: 1 session.

---

### Phase 1 — Information Architecture rebuild
**Goal**: navigation that scales to all the planned sections. Today's SubNav has Roadmap / Problems / Review / Playground — soon we need Home / Practice / Learn / Roadmaps / Compiler / Contests / Progress with contextual subnavs.

- New top-level routes: `/` (Home/Dashboard), `/learn`, `/practice` (rename from `/problems`), `/roadmaps` (plural, indexed), `/contests` (placeholder), `/company` (placeholder), `/progress` (dashboard), `/playground` (exists).
- Move current `/` (the rigidGrid roadmap) to `/roadmaps/dsa-fundamentals` (or similar).
- New Home/Dashboard: continue learning, POTD card, streak ring, weak topics ring, recent activity, recommended next.
- Command palette (Cmd/Ctrl+K) with fuzzy search across routes, problems, concepts.
- Global search via Postgres FTS (Supabase supports it natively).
- Breadcrumbs on deep pages.
- Mobile bottom nav for primary sections (Practice / Learn / Compiler / Progress).

**Verify**: every top-level area reachable in ≤2 clicks; CMD+K works; mobile breakpoints clean.

**Estimate**: 1-2 sessions.

---

### Phase 2 — Learn section + Algorithms Library (the 80-topic ask)
**Goal**: the integrated syllabus from your two courses, fully written, deeply linked to problems. This is *the* biggest content lift.

**New schema** (SQL migration `migrate-11-learn-schema.sql`):
```
PGcode_modules        — top-level course modules (Algorithms, Math, Bitwise, ...)
PGcode_concepts       — individual topic pages (Loop Detection, Manacher's, ...)
PGcode_concept_problems  — many-to-many: concept ↔ problem
PGcode_concept_prereqs   — concept dependency edges
```

`PGcode_concepts.content` is a structured JSONB with sections: `intro`, `whyItMatters`, `visualization`, `intuition`, `bruteForce`, `optimal`, `complexity`, `pitfalls`, `interviewTips`, `quiz` (each section optional).

**Authoring approach** (D1 decision):
- Concept content authored as Markdown in `content/concepts/<slug>.md` with YAML frontmatter for metadata.
- Bulk import script `scripts/import-concepts.js` parses MD → upserts to Supabase.
- I write **3 fully-fleshed exemplar concepts** for review: "Loop Detection" (Mod 1), "Manacher's Algorithm" (Course I sorting/strings), "Bellman-Ford" (Mod 4). You sign off on style.
- Once style is approved, I write the rest in batches of ~10 per session, sourcing from your reference PDFs (requires D8: poppler).

**Learn UI** routes:
- `/learn` — module index with progress
- `/learn/:moduleSlug` — module overview
- `/learn/:moduleSlug/:conceptSlug` — concept detail
- Sidebar shows prereqs satisfied / pending, related problems, quiz button
- "Practice now" button takes you to filtered problems for this concept

**Verify**: 3 exemplar concepts render correctly with all sections, prereq chips link, related-problems list loads from Supabase.

**Estimate**: 1 session for schema + UI + exemplars. **6-8 sessions** for full 80-topic content authoring after exemplar approval.

#### Combined syllabus (from your two courses, merged by topic)

| # | Module | Topics (sourced from both courses) |
|---|---|---|
| 1 | Foundations | Java intro, Time/Space Complexity, Algorithm fundamentals |
| 2 | Math & Number Theory | Sieve of Eratosthenes, Segmented Sieve, Euler's Phi, Strobogrammatic Number, Chinese Remainder Theorem, Alice & Apple Tree |
| 3 | Bitwise Algorithms | Binary Palindrome, Booth's Algorithm, Euclid's Algorithm, Karatsuba, Longest Sequence of 1s after Flip, Swap Nibbles |
| 4 | Arrays & Searching | Block Swap, Max Product Subarray, Hourglass Sum, Max Equilibrium Sum, Leaders in Array, Majority Element (Boyer-Moore) |
| 5 | Sorting & Strings | Lex First Palindromic String, Natural Sort, Quick/Selection Sort, Weighted Substring, Move Hyphens, **Manacher's Algorithm** |
| 6 | Linked Lists | Loop Detection (Floyd's), Sort Bitonic DLL, Segregate Even/Odd Nodes, Merge Sort for DLL |
| 7 | Stacks & Queues | Iterative Tower of Hanoi, Stock Span, Min Stack, Celebrity Problem, Priority Queue via DLL, Sort without Extra Space, Max Sliding Window, Stack Permutations |
| 8 | Recursion & Backtracking | Sorted Unique Permutation, Maneuvering, Combination, Josephus, Maze Solving, N-Queens |
| 9 | Trees | Recover BST, Tree Views (4), Vertical Order Traversal, Boundary Traversal, BFS/DFS, Dial's Algorithm |
| 10 | Graphs | Bellman-Ford, Topological Sort, Heap Sort (graph-adjacent), Kruskal, Activity Selection, Graph Coloring, Huffman Coding, Warnsdorff's Algorithm, Hamiltonian Cycle |
| 11 | Heaps | Binomial Heap, K-ary Heap, Winner Tree |
| 12 | Maps, Sets & Hashing | HashMap to TreeMap, Types of Sets, Distributing Items |
| 13 | Dynamic Programming | Basic Fibonacci, LCS, LIS, Longest Bitonic Subseq, Longest Palindromic Subseq, Subset Sum, 0/1 Knapsack, Traveling Salesman, Coin Change, Shortest Common Superseq, Levenshtein, Rod Cutting, Wildcard Pattern Match, Pots of Gold |
| 14 | Greedy | (overlaps with module 10; deduped) |
| 15 | Interview Prep (CS Core) | Networking, Security, Cryptography, OS, DBMS, RDBMS |

That's ~85 distinct topics. Module 14 is intentionally merged into 10. Module 15 is CS-core lecture notes, not algorithms — different content template.

---

### Phase 3 — Problem detail page overhaul
**Goal**: bring the problem page from "Workspace tab" to a real best-in-class detail page.

- Tabs: **Description / Examples / Constraints / Hints / Editorial / Video / Notes / Submissions / Related**
- **Tiered hints** (5 levels: direction → pattern → partial logic → key insight → pseudocode). Track hint usage as a metric.
- **Per-language submission history**, restore code from any past submission.
- **Status pill** (using D5's 6-state taxonomy) — sets both the bool and a `status` column on `PGcode_user_progress`.
- **Notes** tab — markdown-supported, autosaved, searchable across all problems.
- **Related problems** sidebar driven by shared concept/pattern tags.
- **Approach picker** in Editorial (Brute / Better / Optimal) — already partly in `SolutionView`.

**Schema additions**:
- `PGcode_problems.hints` (JSONB array of 5 hint strings)
- `PGcode_problems.editorial_md` (TEXT — markdown editorial)
- `PGcode_problems.video_url` (TEXT, nullable)
- `PGcode_user_progress.status` (TEXT — taxonomy)
- `PGcode_user_submissions` (new table — every Run / Submit logged with verdict + code snapshot)

**Verify**: pick 5 sample problems, populate hints + editorial, click through all tabs.

**Estimate**: 2 sessions (UI + schema migration + populating sample data).

---

### Phase 4 — Practice hub + filtering
**Goal**: the `/practice` page becomes the strongest discovery surface.

- Filters: topic, pattern, company, difficulty, status, language, list (Blind 75 / Top 100 Liked / etc.), frequency (rare/common/very common)
- Multi-select facets with chip pills
- Saved filter presets per user (`PGcode_user_filter_presets`)
- Sort: relevance, difficulty, frequency, recently added, acceptance, your last attempt
- List view (table, current), compact, card view (mobile)
- Comparison vs your topic mastery: "you've solved 4/12 sliding-window problems"
- **POTD widget** with calendar streak — `PGcode_potd` table (date, problem_id)

**Schema additions**:
- `PGcode_lists` + `PGcode_list_problems` (Blind 75, NeetCode 150, Grind 75 etc.)
- `PGcode_companies` + `PGcode_company_problems` (with frequency score and last_asked year)
- `PGcode_potd`
- `PGcode_user_filter_presets`

**Verify**: every filter narrows correctly; saved preset reloads after refresh; POTD widget updates daily.

**Estimate**: 1-2 sessions.

---

### Phase 5 — Roadmap engine (data-driven)
**Goal**: any new curated path is a SQL row, not a code change.

- New tables: `PGcode_roadmaps` (id, slug, name, description, kind, default_layout), `PGcode_roadmap_nodes` (id, roadmap_id, node_type, ref_id, position, dependencies)
- Node types: `concept`, `problem_set`, `single_problem`, `quiz`, `milestone`
- Current `rigidGrid` roadmap → seed into `dsa-fundamentals` roadmap row + nodes
- `/roadmaps` → index page (cards for each available track)
- `/roadmaps/:slug` → ReactFlow render or list view (mobile)
- Seed tracks: DSA Fundamentals, Blind 75, Grind 75, NeetCode 150, SQL 50, Python 50, Java 50, JavaScript 50, C 50, C++ 50, Recursion Track, DP 50, Graph 50, Tree 50, System Design (later)

**Estimate**: 2 sessions (1 for engine, 1 for seeding curated lists).

---

### Phase 6 — Compiler/Playground enhancements
**Goal**: take the Playground from solid to best-in-class.

- Shareable links — `/playground/share/:slug` with code stored in `PGcode_playground_snippets`
- Multi-file support for languages that benefit (later)
- Expected-output checker mode (you set expected, Run compares)
- "Beginner mode" with inline syntax tips, "Interview mode" without autocomplete
- **SQL playground** — sample schemas (employees/departments/orders), live query against a sandboxed schema via Supabase
- **HTML/CSS/JS sandbox** route — iframe sandbox, no Judge0 required
- Saved snippets list per user

**Estimate**: 1-2 sessions.

---

### Phase 7 — Company prep + Contests + Assessments
**Goal**: serious interview-prep pillar.

- Company pages — `/company/:slug` with frequency-ranked problem table, role filter, year filter, mock packs
- Seed: Google, Meta, Amazon, Microsoft, Apple, plus Indian tier (TCS, Infosys, Wipro, Flipkart, Razorpay, etc. per master prompt)
- **Contest engine** — `/contests` with virtual contests (run any past set as timed), ranking, penalty scoring, post-contest editorial drop. Schema: `PGcode_contests`, `PGcode_contest_problems`, `PGcode_contest_submissions`.
- **Assessments** — topic mini-tests, MCQ + coding mixed, adaptive (suggest next test based on weak topics)
- Mock OAs per company

**Estimate**: 3 sessions.

---

### Phase 8 — Notes + Revision + Spaced Repetition
**Goal**: the revision loop is what makes the platform sticky.

- `next_review_at` column already exists; build a real **spaced-repetition queue** UI (`/review` already has stub)
- SM-2 algorithm or simpler 1/3/7/14/30-day intervals based on confidence rating after solve
- **Personal notes** — markdown, autosave, full-text search, tagged
- **Flashcards** — auto-generated from concept "key insights" sections + user-created
- **Revision heatmap** in Progress dashboard

**Estimate**: 1 session.

---

### Phase 9 — Progress Dashboard + Gamification
**Goal**: motivating but never overpowering.

- Skill radar chart (per topic mastery, recharts)
- Daily activity heatmap (GitHub-style)
- Streaks (current/longest)
- XP + levels (tasteful, no animation overload)
- Badges: "First solve", "7-day streak", "DP 50 complete", "No hints used", "Contest finisher"
- Company readiness % per tracked company
- Language track progress bars

**Estimate**: 1 session.

---

### Phase 10 — Admin CMS basics
**Goal**: you can manage content without me.

- `/admin` (role-gated) — bulk import problems/concepts via JSON/CSV upload, tag editor, schedule POTD, draft/publish workflow, content review queue
- Backed by Supabase RLS for permissions
- Markdown live preview for editorials/concepts

**Estimate**: 2 sessions.

---

### Phase 11 — Polish + Performance hardening
**Goal**: production-grade.

- Lighthouse audit, fix CLS, LCP, INP
- Better skeletons for every async surface
- Empty / error states (network down, judge timeout, etc.) reviewed end-to-end
- Reduced-motion respected everywhere
- Keyboard accessibility audit
- Mobile pass — every page on a 375px-wide viewport

**Estimate**: 1 session.

---

### Phase 12 — AI features (gated by your Anthropic API key)
**Goal**: tasteful AI augmentation, not crutch.

- "Explain why my code failed" — sends failing test case + your code + expected → Claude → explanation
- Tier-5 AI hint — generated on demand, not pre-baked
- "Recommend my next problem" — based on weak-area + last solve
- Cached aggressively to control cost
- Opt-in toggle in Settings; uses your API key (env var, never committed)

**Estimate**: 1 session.

---

### Phase 13 — Community + Discussion (only if there's an audience)
- Per-problem comments, upvoting, moderation
- Per-editorial alternative-approach contributions

**Estimate**: 2-3 sessions. Defer until you have ≥50 active users.

---

## 4. Content production pipeline (the realistic part)

Content is **a product workstream**, not a "we'll write the rest later" footnote. The concept library and editorial depth are what will differentiate PGcode from weaker practice sites — so it gets a real pipeline:

**Pipeline stages**:
1. **Template lock** — I write 3 exemplar concepts (Loop Detection, Manacher's, Bellman-Ford). You redline structure, tone, depth. Locked structure becomes the schema for every future concept.
2. **Source extraction** — your reference PDFs (`/Users/pushkalgupta/Desktop/Reference Material/Mod *`) are OCR'd via poppler (D8) into raw text. Each module becomes a folder of `raw/<topic>.txt`.
3. **Drafting** — each topic gets a `content/concepts/<slug>.md` file with YAML frontmatter (slug, module, difficulty, prereqs, related_problems, etc.) and structured sections. I draft from reference + my training; you (or future contributors) can edit any file directly.
4. **Validation** — `scripts/validate-concepts.js` lints every concept against the schema, checks broken prereq references, flags missing sections, enforces wordcount minimums per section.
5. **Bulk import** — `scripts/import-concepts.js` reads validated MD files, upserts to Supabase, builds `PGcode_concept_problems` relations by matching tag overlaps.
6. **Review queue** — admin route `/admin/content` shows recently imported/edited concepts in a "needs review" state until you mark them published.
7. **Versioning** — `PGcode_concepts.version` and `PGcode_concept_revisions` table for audit; rollback supported.

**Why this matters**: 85 topics × 30-60 minutes is 40-85 hours of focused authoring. Without a pipeline, that's an unmanageable mess. With it, content authoring becomes a daily 30-minute habit you can pick up and put down, and external contributors (or you) can extend without code changes.

---

## 4b. Content authoring strategy (the realistic part — superseded by §4 above)

The 80-topic syllabus is **6-8 sessions of focused authoring** after exemplars are approved. To make this tractable:

1. **Approve a template** — I write 3 exemplars in Phase 2; you redline them; we lock the structure.
2. **Source from your PDFs** — requires D8 (poppler install). Each concept becomes a markdown file in `content/concepts/<slug>.md`.
3. **Batch import** — `scripts/import-concepts.js` reads all MD files, validates against schema, upserts to Supabase. Idempotent: re-running updates.
4. **You can co-author** — anything you write directly in MD merges seamlessly. I do the algorithm-heavy ones; you handle the parts you care to (e.g. interview tips from your own experience).
5. **Problems-to-concepts linking** — bulk script reads existing problem tags + new concept slugs, creates `PGcode_concept_problems` relations.

**This is the only way 80 topics done well is realistic.** I will not promise a one-shot delivery.

---

## 5. Recommended first sprint (this session, after you approve)

If you green-light, I do **Phase 0** end-to-end right now:

1. Add Go, Rust, TypeScript, C# to Playground language list + LANG_MAP + edge function language_ids
2. Route-level code splitting (`React.lazy` Workspace, Playground, SolutionPage, ReviewQueue)
3. Lazy-load Monaco only when editor mounts
4. Lazy-load ReactFlow only on roadmap routes
5. Verify build bundle drops below 300 KB initial
6. Provide you the SQL command to apply `migrate-10-user-settings.sql`
7. Hand you a smoke-test checklist (10 specific things to click through in your browser)

Then we gate, you smoke-test, and we plan Phase 1 next session.

---

## 6.5. MVP cut (the version we ship publicly first)

Approved by review agent and locked here. **MVP = Phases 0 → 0.5 → 1 → 2 (core schema + 10-15 concepts) → 3 → 4 → 5 → 8.**

This is the "shippable, world-class first version" — strong enough that a real user can complete the discover→learn→solve→run→revise→track loop end-to-end. Excluded from MVP and pushed to post-launch:

- Phase 6 (Compiler enhancements beyond what we already have — SQL playground, expected-output checker, shareable links) — Playground v1 is good enough at launch
- Phase 7 (Contests, Company prep, Assessments) — high-effort, can launch independently as a v1.1 drop
- Phase 9 (Gamification dashboard polish) — basic streak/counts at MVP, fancy radar/heatmap later
- Phase 10 (Admin CMS) — bulk import scripts cover MVP needs; visual CMS later
- Phase 11 (Lighthouse polish pass) — fold into each MVP phase
- Phase 12 (AI features)
- Phase 13 (Community)

**MVP sequence estimate**: Phase 0 (0.5 session, in progress) + 0.5 (1) + 1 (1.5) + 2-core (1) + 2-content-15 topics (2) + 3 (2) + 4 (1.5) + 5 (2) + 8 (1) = **~12.5 sessions to MVP**. Aggressive but tractable.

---

## 7. Open questions for you

1. **Confirm D1-D10 above** (or override any defaults).
2. **`brew install poppler`** — can you run this so I can OCR the reference PDFs? Without it, Phase 2 content will be sourced from my training knowledge of those algorithms, which may not match your course's specific framing.
3. **HashRouter → BrowserRouter migration (D6)** — your blog at `pushkalgupta.com/PGcode/dist/` is served as a SPA. Do you have control over server-side rewrites to make `/practice`, `/learn/foo`, etc. all fall back to `index.html`? If not, we keep HashRouter and accept the SEO hit.
4. **Branding** — the current domain says `pushkalgupta.com/PGcode/dist/`. Are we planning to move this to a dedicated subdomain or even a new domain at some point? Affects D6.
5. **Cost ceiling on AI features (Phase 12)** — what monthly Anthropic spend are you comfortable with? Determines how aggressive we are with caching vs fresh generation.

---

## 8. Estimate summary

| Phase | Sessions | Cumulative |
|---|---|---|
| 0 — Stabilize | 0.5 (this) | 0.5 |
| 0.5 — Auth & Identity | 1 | 1.5 |
| 1 — IA rebuild | 1.5 | 3 |
| 2 — Learn + schema + 3 exemplars | 1 | 4 |
| 2b — Full 85-topic content authoring | 6-8 | 10-12 |
| 3 — Problem detail overhaul | 2 | 12-14 |
| 4 — Practice hub | 1.5 | 13.5-15.5 |
| 5 — Roadmap engine | 2 | 15.5-17.5 |
| 6 — Compiler/Playground | 1.5 | 17-19 |
| 7 — Company / Contests / Assessments | 3 | 20-22 |
| 8 — Notes + Revision | 1 | 21-23 |
| 9 — Progress Dashboard | 1 | 22-24 |
| 10 — Admin CMS | 2 | 24-26 |
| 11 — Polish + Perf | 1 | 25-27 |
| 12 — AI features | 1 | 26-28 |
| 13 — Community (optional) | 2-3 | 28-31 |

**Total**: ~26-31 focused sessions to reach the "world-class" bar described, with Phase 2b (content) being the biggest single block. MVP at ~12.5 sessions.

This is *months* of work if we go session-by-session. If you want to compress, we identify which phases are MVP (I'd argue 0, 1, 2, 3, 4, 5, 8 = the learning + practice loop) and ship those first, then layer the rest.

---

## 8. Out of scope until further notice

- Server-side rendering or framework migration
- Mobile native app
- Paid tier / billing
- LeetCode account integration / scraping
- Multi-user real-time editing
- Browser extension
- Discord/Slack integrations
- Email notifications (Phase 8 has data hooks but no sending)
