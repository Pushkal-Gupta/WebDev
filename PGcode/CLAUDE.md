# PGcode — Claude project memory (V2 — 2026-05)

Loaded at the start of every session. Read first; obey hard rules; don't sprawl.

## What this is

PGcode is a personal DSA / interview-prep platform. The single-author goal is to be measurably better than NeetCode + GeeksforGeeks + Programiz combined — broader catalog, deeper editorial, more polished UI, server-side grading, multi-language support.

It is **not** a clone of any one of them. Design quality and editorial depth matter more than feature count.

## Tech stack

- **Frontend:** Vite + React 19 SPA, React Router 7 (**HashRouter** — see "Locked decisions")
- **Routing:** every route lazy-loaded via `React.lazy` + `Suspense` (`src/App.jsx`)
- **Data:** Supabase (Postgres + Auth + Edge Functions) — project `ykpjmvoyatcrlqyqbgfu.supabase.co`, region Singapore. The Supabase CLI is linked locally; migrations and edge functions deploy from the repo.
- **Cache:** TanStack Query with `localStorage` persistence (`src/lib/queryClient.js`)
- **Editor:** `@monaco-editor/react`
- **Roadmap viz:** `reactflow` (DSA Fundamentals graph route)
- **Code execution:** Judge0 via Supabase Edge Function `run-code` — 14 languages (Py, JS, TS, Java, C, C++, C#, Go, Rust, Ruby, Kotlin, Swift, PHP, Bash). Driver-code harness only supports Py/JS/Java/C++ (`HARNESS_LANGS`).
- **Server-side grading:** Edge Function `grade-submission` — loads tests + driver from DB, calls Judge0, returns aggregated verdict. Workspace falls back to client flow on 5xx.
- **Icons:** `lucide-react` (named imports — **never emoji**)
- **No SSR.** Speed comes from React Query cache + route splitting + hover prefetch.

## Commands

```
npm run dev            # vite dev server (5173)
npm run build          # production build → dist/
npm run preview        # serve dist/ locally
npm run lint           # eslint .
node scripts/verify.js                # build + lint + concept-parse + dev smoke
node scripts/import-concepts.js       # bulk-import content/concepts/*.md (needs SUPABASE_SERVICE_ROLE_KEY)
node scripts/import-concepts.js --dry # preview without writing

# Supabase CLI (linked to ykpjmvoyatcrlqyqbgfu)
supabase db query --linked --file scripts/migrate-NN-*.sql   # apply a migration
supabase db query --linked "SELECT ..."                       # ad-hoc query
supabase functions deploy <name>                              # deploy edge fn
```

## File structure (as of 2026-05)

```
PGcode/
├── CLAUDE.md                       # this file
├── docs/
│   ├── PLATFORM_PLAN.md            # V3 — superseded
│   ├── PLATFORM_PLAN_V5.md         # current live backlog
│   ├── AUTH_AUDIT.md               # PG hub <-> PGcode auth state
│   └── SMOKE_TEST.md               # manual browser checklist
├── content/concepts/               # 22 markdown files (Learn library source)
├── scripts/
│   ├── migrate-NN-*.sql            # numbered migrations (00..28 applied)
│   ├── seed-flagship-batch-NN.js   # 46 batches authored, 285+ flagships hydrated
│   ├── import-concepts.js          # MD → Supabase concept upsert
│   ├── check-flagship-ids.js       # find DB id for a given problem name
│   └── verify.js                   # self-check (build + lint + concepts + dev smoke)
├── src/
│   ├── App.jsx                     # router + theme + auth bridge
│   ├── main.jsx                    # PersistQueryClientProvider + React root
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── queryClient.js
│   │   ├── queries.js              # ALL shared query hooks (qk = key registry)
│   │   ├── codeRunner.js           # Judge0 client; LANG_MAP, PLAYGROUND_LANGS, HARNESS_LANGS
│   │   ├── driverCode.js           # test-harness generators (Py/JS/Java/C++ only)
│   │   ├── achievements.js
│   │   ├── ai.js                   # AI Assist client (opt-in, key in localStorage)
│   │   ├── spacedRepetition.js     # SM-2-lite scheduler
│   │   ├── status.js               # 6-state status taxonomy
│   │   └── topicLabel.js
│   ├── styles/theme.css            # 5 palettes (dark/light/midnight/solarized/dracula)
│   └── components/
│       ├── Navbar.jsx, SubNav.jsx, MobileBottomNav.jsx
│       ├── Home.jsx                # landing dashboard (greeting, streak, POTD, resume)
│       ├── CommandPalette.jsx      # Cmd/Ctrl+K
│       ├── Workspace.jsx           # /category/:cat/:id — 1280-line monolith (see Gotchas)
│       ├── Playground.jsx          # /playground — free-form Monaco
│       ├── ProblemList.jsx         # /practice
│       ├── ProblemVisualizer.jsx   # in-workspace viz tab
│       ├── RoadmapView.jsx         # /roadmaps/dsa-fundamentals ReactFlow graph
│       ├── ProgressDashboard.jsx   # /progress — rings, heatmap, mastery
│       ├── PracticeHistory.jsx     # /history
│       ├── ReviewQueue.jsx         # /review — spaced repetition
│       ├── Achievements.jsx        # /achievements
│       ├── Notebook.jsx            # /notebook
│       ├── HintsPanel.jsx          # 5-tier hint reveal (inside Workspace)
│       ├── DryRunViewer.jsx        # interactive dry runs
│       ├── SolutionPage.jsx, SolutionView.jsx
│       ├── StatusPill.jsx          # 6-state status mutator
│       ├── SidePanel.jsx
│       ├── SettingsModal.jsx, LoginModal.jsx, AccountModal.jsx
│       ├── AiExplainFailure.jsx
│       ├── BubbleCloud.jsx
│       ├── DsaTutorial.jsx, LearningsSection.jsx
│       ├── Select.jsx              # custom dropdown (replaces native <select>)
│       ├── SqlPlayground.jsx, WebSandbox.jsx
│       ├── PlaygroundSwitcher.jsx
│       ├── MyLists.jsx, PublicListView.jsx
│       ├── Assessments.jsx
│       ├── TopicModal.jsx, TopicNode.jsx
│       ├── RouteFallback.jsx
│       ├── learn/                  # ConceptPage, AlgoVisualizer, VisualizeIndex, ConceptQuiz
│       ├── courses/                # CoursesIndex, CoursePage
│       ├── contests/               # ContestsIndex, ContestDetail
│       ├── company/                # CompaniesIndex, CompanyDetail
│       ├── admin/                  # AdminPanel
│       ├── roadmaps/               # RoadmapsIndex, RoadmapTrack
│       └── renderers/              # markdown + code renderers
└── supabase/functions/
    ├── run-code/                   # Judge0 batch executor (14 languages)
    └── grade-submission/           # server-side test grading
```

## Routes (canonical map)

```
/                          Home (dashboard)
/roadmaps                  RoadmapsIndex
/roadmaps/dsa-fundamentals RoadmapView (ReactFlow graph)
/roadmaps/:slug            RoadmapTrack (list/sequence tracks)
/practice                  ProblemList
/learn                     LearnIndex
/learn/:module             LearnIndex
/learn/:module/:concept    ConceptPage
/visualize                 VisualizeIndex
/visualize/:slug           VisualizeIndex
/courses                   CoursesIndex
/courses/:slug             CoursePage
/courses/:slug/:lessonId   CoursePage
/contests                  ContestsIndex
/contests/:slug            ContestDetail
/company                   CompaniesIndex
/company/:slug             CompanyDetail
/playground                Playground (Monaco, 14 langs)
/playground/share/:slug    Playground (shared snippet)
/playground/web            WebSandbox (HTML/CSS/JS sandbox)
/playground/sql            SqlPlayground (sql.js wasm)
/playground/sql/:course    SqlPlayground (course mode)
/notebook                  Notebook
/review                    ReviewQueue (spaced rep)
/progress                  ProgressDashboard
/achievements              Achievements
/history                   PracticeHistory
/lists                     MyLists
/lists/share/:slug         PublicListView
/assessments               Assessments
/tutorial                  DsaTutorial
/admin                     AdminPanel
/category/:cat             Workspace (no problem selected)
/category/:cat/:problem    Workspace (problem open)
/solution/:problem         SolutionPage (read-only)
```

## Code conventions (HARD rules)

1. **No emoji anywhere.** Source, commits, chat. Lucide icons in code; reference by name in chat ("ArrowRight icon").
2. **No hardcoded colors.** Always `var(--accent)`, `var(--bg)`, `var(--surface)`, `var(--text-main)`, `var(--text-dim)`, `var(--border)`, `var(--hover-box)`, `var(--easy/medium/hard/warning)`. All 5 palettes define these tokens.
3. **No new files unless necessary.** Prefer editing existing.
4. **No comments explaining WHAT code does.** Comments only for non-obvious WHY (hidden constraint, workaround, subtle invariant). Default: no comments.
5. **No docs files unless explicitly requested.** Planning lives in `docs/`.
6. **No try-catch around things that can't fail.** Only at system boundaries (user input, Supabase, Judge0).
7. **All Supabase reads/writes go through a hook in `src/lib/queries.js`** with a stable `qk.*` key. Never call `supabase.from()` directly in a component.
8. **All schema changes go through a numbered `scripts/migrate-NN-*.sql`** — idempotent (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`).
9. **The user runs `git commit` / `git push`.** Never do it without explicit ask.
10. **Secrets via env vars only.** `.env` is gitignored; service role key only in scripts that need it.

## Locked architectural decisions

- **HashRouter, not BrowserRouter.** Site is served as `pushkalgupta.com/PGcode/dist/index.html`. BrowserRouter would need server-side rewrites.
- **Vite SPA, no SSR.** Cache + lazy routes + hover prefetch covers perceived speed.
- **Content authored in markdown, bulk-imported to Supabase.** Not an in-browser CMS.
- **Theme = CSS variables on `[data-theme]`, persisted to `PGcode_profiles.theme_preset`** with localStorage fallback.
- **6-state status taxonomy** (`not_started`, `attempted`, `solved`, `mastered`, `bookmarked`, `needs_revision`). Legacy `is_completed` / `is_starred` booleans kept in sync via `StatusPill`.
- **One Supabase project shared with PG hub.** Session auto-shared via localStorage. See `docs/AUTH_AUDIT.md`.
- **Server-side grading is the path forward.** New problems' test cases live in `PGcode_problems.test_cases`; the `grade-submission` edge function loads them + driver, calls Judge0, returns aggregated verdict. Client no longer downloads the full test set.

## Database — applied migrations

`supabase db query --linked --file scripts/migrate-NN-*.sql` (idempotent).

| Migration | What it adds |
|---|---|
| `00..09` | Original schema: `PGcode_topics`, `PGcode_problems`, `PGcode_user_progress`, `PGcode_profiles`, `PGcode_friends`, `PGcode_interactive_dry_runs`, `PGcode_interactive_questions`, `PGcode_problem_templates`, `PGcode_roadmap_edges` |
| `10` | `PGcode_profiles.theme_preset`, `preferred_lang` |
| `11` | Learn schema: `PGcode_modules`, `PGcode_concepts`, `PGcode_concept_problems`, `PGcode_concept_prereqs`, `PGcode_user_concept_progress`; 15 modules |
| `12` | `PGcode_profiles.avatar_url`; `handle_new_user()` trigger on `auth.users` |
| `13` | `PGcode_problems.hints, editorial_md, video_url, pattern, frequency_score`; `PGcode_user_progress.status, status_changed_at, hints_revealed`; `PGcode_user_submissions` |
| `14` | `PGcode_lists` + `PGcode_list_problems`; 11 lists (Blind 75, etc.) |
| `15` | `PGcode_roadmaps` + `PGcode_roadmap_nodes`; 8 roadmaps |
| `16` | `PGcode_playground_snippets` |
| `17` | `PGcode_user_achievements` |
| `18` | `PGcode_companies` + `PGcode_company_problems`; 29 companies |
| `19` | `PGcode_admin_roles` (admin gating) |
| `20` | `pgcode_snippet_views` RPC |
| `21` | `PGcode_contests` + `PGcode_contest_problems` + `PGcode_contest_submissions` |
| `22` | `PGcode_user_lists` |
| `23` | seeded problems (catalog growth) |
| `24` | missing columns backfill |
| `25` | server aggregates: `pgcode_user_stats`, `pgcode_practice_history`, `pgcode_resolve_tutorial` RPCs |
| `26` | views/RPCs flipped to SECURITY INVOKER |
| `28` | `PGcode_problems.solutions JSONB` + `viz_steps JSONB` |

Increment to the next number for new schema. Always `IF NOT EXISTS` / `ON CONFLICT DO UPDATE`.

## How to add a new feature

1. **Check `docs/PLATFORM_PLAN_V5.md`** — is it in scope? If yes, follow it. If not, surface to user before sprawling.
2. **Schema first.** New tables/columns → new `migrate-NN-*.sql`. Apply with `supabase db query --linked --file <path>`.
3. **Add query hooks in `src/lib/queries.js`.** Stable `qk.*` key. No direct `supabase.from()` in components.
4. **Optimistic mutations.** Flip UI immediately via `queryClient.setQueryData` + invalidate on settle. Pattern: `progressMutation` in `TopicModal.jsx`.
5. **Lazy-load the route.** `React.lazy` in `App.jsx`. `Suspense` fallback handles skeleton.
6. **Match design language.** No new CSS variables. Mono headlines (Space Mono), serif display (Lora), sans body (Inter). Heavy `var(--hover-box)` for subtle backgrounds.

## How to add a concept to Learn

1. Create `content/concepts/<slug>.md` matching the existing 22 (`loop-detection.md` is cleanest reference).
2. `node scripts/import-concepts.js --dry` to validate parse.
3. `node scripts/import-concepts.js` (needs `VITE_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) to upsert.
4. Concept appears at `/learn/<module>/<slug>` immediately.

## How to add a flagship problem

1. Find canonical DB id: `node scripts/check-flagship-ids.js <search>`.
2. Add to a new `scripts/seed-flagship-batch-NN.js` (copy any existing batch). Each entry needs `id`, `method_name`, `params`, `return_type`, `hints` (5 graduated), `tags`, `constraints`, `follow_up`, `pattern`, `test_cases` (10+).
3. `node scripts/seed-flagship-batch-NN.js`.
4. `node scripts/verify.js` to confirm 15/15.

## How to add a visualization

1. Pick a renderer in `AlgoVisualizer.jsx`: `ArrayBarRenderer`, `GraphRenderer`, `SlidingWindowRenderer`, `NumberGridRenderer`. Each expects a specific frame shape.
2. In `conceptVisualizations.js`, write a `*Frames()` function pushing one frame per step. Register in `VISUALIZATIONS` keyed by concept slug.
3. Appears at `/visualize/<slug>` + concept page Intuition section automatically.
4. New shape? Add a `Renderer` to `AlgoVisualizer.jsx` + CSS, using theme tokens only.

## Gotchas

- **`Workspace.jsx` is 1280 lines.** Known smell. Don't refactor without explicit user approval — too many cross-tab interactions. Add functionality via small targeted edits.
- **Hook ordering:** if you add early returns / conditional rendering, all hook calls must come *before* them. `RoadmapTrack.jsx` had a violation that would crash on slug-not-found.
- **Topic name parsing:** use `primaryTopicLabel` / `fullTopicLabel` from `src/lib/topicLabel.js`. Some `PGcode_topics.name` rows contain literal `\n` or actual newline; helper handles both.
- **`react-hooks/set-state-in-effect`** is overzealous for ReactFlow's controlled state. `RoadmapView.jsx` and `DryRunViewer.jsx` have legitimate `eslint-disable` blocks.
- **18 hook warnings** still on the board (byId useMemo deps, missing useEffect deps). Build passes. Track in V5 plan.
- **HashRouter URLs use `#/`.** `Link to="/foo"` is fine — Router handles it.
- **Same-named list slug + roadmap slug auto-link.** `blind-75` roadmap auto-renders the `blind-75` list when its nodes table is empty.
- **No driver code for languages outside Py/JS/Java/C++.** Playground accepts all 14; Workspace test-running only works for the 4. `HARNESS_LANGS` constant gates this.
- **All Supabase tables are prefixed `PGcode_` (capital P).** SQL queries must quote: `"PGcode_problems"`. RPCs are lowercase `pgcode_*`.

## What's shipped / what's queued

Authoritative: `docs/PLATFORM_PLAN_V5.md`. Snapshot:

- **Code-complete:** Home dashboard, Learn library (22 concepts), 8 courses (Py/JS/TS/Java/C++/Go/Rust/SQL), DSA roadmap (graph + 8 list tracks), 285+ flagships hydrated, Playground (14 langs), WebSandbox, SqlPlayground, contests, companies, achievements, notebook, review queue, progress dashboard, history, lists, assessments.
- **Active build:** `grade-submission` edge function, streak + POTD RPCs.
- **Queued:** mass long-tail hydration (970+ stubs → graded), 13 more concepts (KMP, sparse table, LCA, suffix array, etc.), course depth (Java/C++/Go/React/TS lessons), mobile polish, a11y, AI Assist expansion, contest leaderboards, company mock OAs, dark-mode tuning per palette.

## When the user says "continue building"

Pick the next highest-MVP-value item from `PLATFORM_PLAN_V5.md`. Ship it properly (schema → hooks → component → verify). Run `node scripts/verify.js` at the end. Depth over breadth. **Never wait.**
