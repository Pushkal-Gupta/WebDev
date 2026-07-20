# PGHub — System Architecture

How the whole platform is built and how data flows through it, end to end. No
credentials or secrets appear here; every key is referenced by its env-var name
only. This is the map to read before touching any layer.

---

## 1. What PGHub is

A single-author DSA / interview-prep / CS-education platform. The wedge is not
writing — every concept has a 3Blue1Brown video and a Wikipedia article. The
wedge is **delivery**: every concept ships with an **interactive, visual,
intuitive** explanation (SVG animation, KaTeX math, MANIM-style step-throughs,
live code) sitting inline next to the prose, so the reader can *do* something
with each idea. Design quality and editorial depth outrank feature count.

Current scale: **~619 concepts across ~69 modules**, a ~4,500-problem practice
catalog with server-side grading, 4-language solutions, and hundreds of
registered interactive visualizations.

Live at `pushkalgupta.com/PGHub/dist/index.html` (HashRouter — URLs use `#/`).

---

## 2. The monorepo & how it deploys

PGHub is one folder inside the **`Pushkal-Gupta/WebDev`** monorepo, which hosts
several independent sites (PGHub, PG.Play, onlineChess, blog, chess, PG.Quiz,
studentSystem, employeeSystem, …). The repo root has a `CNAME`, so the **entire
repo is served by GitHub Pages** at `pushkalgupta.com`.

Key consequence: **the built `dist/` is committed to the repo** — GitHub Pages
serves those committed files directly. There is no server-side build; what's in
`dist/` on `main` is what's live. This is why:

- A source change only reaches the live site after `dist/` is rebuilt & pushed.
- CI is scoped to `PGHub/**` paths (the other sub-sites don't trigger it).
- Vite is configured with `base: ''` (relative asset paths) so the bundle works
  from a sub-path.

```
WebDev/  (GitHub Pages root, CNAME = pushkalgupta.com)
├── CNAME, index.html            landing shell
├── .github/workflows/           pghub-ci.yml, pghub-deploy.yml  (root only — GitHub reads workflows here)
├── PGHub/                        THIS app
│   ├── src/                      React SPA source
│   ├── content/concepts/*.md     concept lessons (authored offline)
│   ├── scripts/                  content pipeline + migrations + guards
│   ├── supabase/functions/       edge functions (Deno)
│   ├── docs/                     planning + this doc
│   └── dist/                     committed production build (served by Pages)
├── PG.Play/  onlineChess/  blog/  chess/  PG.Quiz/  …   other sub-sites
└── supabase/                     shared Supabase project config
```

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite + React 19 SPA | every route `React.lazy` + `Suspense` in `App.jsx` |
| Routing | React Router 7, **HashRouter** | locked — static host, no server rewrites |
| Data | Supabase (Postgres + Auth + Edge Functions) | tables prefixed `PGcode_` (capital P, SQL must quote) |
| Server cache | TanStack Query + `localStorage` persistence | `src/lib/queryClient.js`; keyed by the `qk.*` registry |
| Editor | `@monaco-editor/react` | Workspace, Playground, course examples |
| Roadmap viz | `reactflow` | `RoadmapView`, `TopicNode` |
| Math | KaTeX | inline `\(...\)` + display `\[...\]`, one shared renderer |
| Code execution | Judge0 (14 languages) via edge function `run-code` | driver-harness only for Py/JS/Java/C++ |
| Grading | edge function `grade-submission` | loads tests + driver from DB, calls Judge0, aggregates verdict |
| Icons | `lucide-react` only | never emoji |
| Build | Vite `manualChunks` | react / monaco / reactflow / query / supabase / icons split into cached vendor chunks |

---

## 4. The three layers (strict invariants)

### Layer 1 — Content authoring (offline → bulk-import)
Content is **authored as files, then imported**, never edited in-browser:
- `content/concepts/*.md` — Learn concepts (13-section template + YAML frontmatter).
- `scripts/seed-*.js` — problem-catalog growth.
- `src/content/*.js` — courses, tutorial bodies, playground starters.
- `src/content/mlContent.js` + `ml-extra/*` — ML lessons.

### Layer 2 — Data access (`src/lib/queries.js`)
**Every** Supabase read/write goes through a hook here, keyed by a stable `qk.*`
key. Components never call `supabase.from()` directly. Mutations use the
optimistic pattern: `queryClient.setQueryData` + invalidate on settle.

### Layer 3 — Routes / components (`src/components/*`)
Every route lazy-loaded via `React.lazy` in `App.jsx`. Complex areas live in
their own folders (`learn/`, `courses/`, `contests/`, `compete/`, `company/`,
`ml/forge/`). `Workspace.jsx` is the one intentional ~1,300-line monolith
(too many cross-tab interactions to split).

---

## 5. Data flow — from a markdown file to a rendered lesson

```
content/concepts/binary-search.md            (authored: frontmatter + ## sections)
        │
        │  node scripts/import-concepts.js  (parses frontmatter + ## sections,
        │                                     validates, upserts as a batch)
        ▼
Supabase  PGcode_concepts / PGcode_modules   (Postgres; RLS: public-read)
        │
        │  useConcept(slug) / useConcepts()   (src/lib/queries.js, qk.* keyed;
        │                                       TanStack Query caches + persists)
        ▼
ConceptPage.jsx   renders the 13 sections:
   • prose  → MarkdownRenderer (GFM + KaTeX for \(...\) and \[...\])
   • the interactive viz  → INTERACTIVE_VIZ[slug]  (an SVG React component)
   • a frame-based walkthrough → VISUALIZATIONS[slug] via AlgoVisualizer
   • runnable code (4 langs) → RunnableCodeBlock → Judge0
   • auto-quiz → ConceptQuiz (from complexity/pitfalls, KaTeX-aware)
```

The FK invariant that governs importing: a concept's `module_slug` must already
exist in `PGcode_modules`, or the **whole batch upsert fails** (Postgres 23503).
So a module's migration is applied *before* its concepts are imported.

Content-integrity guards (also enforced in CI, see §9): a stray **NUL byte** in
any `.md` fails the entire batch upsert (Postgres 22P05); the pipeline scans for
it. Frontmatter needs `slug`, `module`, `title`, `subtitle`, `difficulty`,
`position`, `status: published`, etc.

---

## 6. The visualization system

The heart of the platform. Three registries, each a different rendering path:

1. **`src/components/learn/interactiveViz.js` → `INTERACTIVE_VIZ`**
   `{ slug → React component }`. Bespoke SVG components under
   `learn/viz/*.jsx`, each with a matching `.css`. Deterministic (seeded
   `mulberry32`, never `Math.random`), theme-token colors, lucide icons,
   Play/Step/Reset/Speed controls, `preserveAspectRatio="xMidYMid meet"`, SVG
   capped (`max-height: ~44vh`) so the whole unit fits on screen with no inner
   scrollbar. ~595 slugs map to ~482 components (some components serve multiple
   slugs).

2. **`conceptVisualizations.js` → `VISUALIZATIONS`**
   Frame-based step-throughs (`array`/`graph`/`window`/`grid`/`tree` renderers)
   played by `AlgoVisualizer` with a shared control bar.

3. **`ml/MLLesson.jsx` → `VIZ_REGISTRY`**
   ML-lesson viz (`ml/viz/*`), lazy-mounted via `IntersectionObserver`
   (rootMargin 300px) so viz-dense pages stay fast.

**Registration is the collision point.** New viz files are created by parallel
agents but the registries are edited centrally in one pass (Edit on `MLLesson.jsx`
trips its linter-freshness check; a Node script does the central wiring). SVG
`<filter>`/`<linearGradient>`/`clipPath` ids are document-global, so every id is
component-prefixed to avoid cross-viz collisions.

---

## 7. Code execution & grading

```
Reader edits code in Monaco  ──►  RunnableCodeBlock / Workspace
        │
        ▼
 edge function  run-code   (Deno) ──► Judge0  (self-hostable; 14 languages)
        │                                   │
        │  free run: raw stdout             │  driver-harness (Py/JS/Java/C++)
        ▼                                   ▼
 edge function  grade-submission  loads PGcode_problems.test_cases + driver,
        calls Judge0 per case, returns aggregated PASS/FAIL/skipped verdict.
        Workspace falls back to a client flow on a 5xx.
```

Grading is **honest**: real PASS/FAIL/skipped, never a faked success state. The
bar for a shippable problem: canonical Python compiles & passes every registry
test case (verified via Judge0), coverage ≥ the LeetCode equivalent, and all
four languages compile & pass. Judge0 can be self-hosted (see `JUDGE0_SELF_HOST.md`)
so grading isn't rate-limited.

---

## 8. Auth, theme, and the Compete area

**Auth + theme are bridged at the App level.** Session is shared via Supabase
Auth (localStorage). Theme is a CSS-variables attribute on `[data-theme]`,
persisted to `PGcode_profiles.theme_preset` with a localStorage fallback — 8
palettes in `src/styles/theme.css`, plus per-token custom overrides via
`src/lib/customColors.js`. All colors are theme tokens (`var(--accent)`,
`var(--bg)`, `var(--hue-*)`, …); no hardcoded hex.

**Compete** aggregates external contests and LeetCode analytics:
- `LcContestList` projects the upcoming Weekly/Biweekly schedule from fixed
  **anchors** (a known date + its real contest number) plus the cadence, and
  merges them with real finished contests from the DB. Getting an anchor number
  wrong shifts every projected number — so anchors are pinned to verified rounds.
- `LeetCodeProfile` / `LeetCodeAnalytics` render a live handle's stats as
  original SVG charts (submission/difficulty/beats/rating-timeline), plus a
  rating-delta **predictor** (from your rank) and **per-contest per-question
  rating** analytics — two distinct surfaces, distinct routes.

**Rating predictor (dense-field).** The projected rating change replicates
LeetCode's real algorithm over the **actual per-contest field of ratings**, not a
synthetic sample. A cron (`build-field` edge fn, right after each contest) samples
usernames across all ranks (ranking API) and fetches each pre-contest rating
(GraphQL, unrated → 1500), storing the distribution in `PGcode_lc_contest_field`.
The client (`exactPredictDelta`) computes each looked-up user's expected rank `E`
over that field, then `delta = (perf − R)·f(k)` where `perf` comes from the
geometric-mean seed `√(E·rank)` and `f(k) = 0.17 + 1.3/(k+4)` (veterans move less).
Validated ~rmse 52 / bias +4 on 648 real deltas vs ~90 for the old sample-field
heuristic; it **falls back** to the heuristic (`predictDelta`) when a contest's
field hasn't been built yet.

**PGBattle** is a 1v1 real-time coding race with in-match **video call, voice call,
and chat**. Two Supabase Realtime channels per match: `versus:{code}` (presence +
progress/typing/win) and `comms:{code}` (WebRTC signaling + chat). Media is
peer-to-peer over WebRTC (STUN for direct, TURN relay as fallback); Supabase only
relays the small SDP/ICE messages. **No media server, no chat table** — all
ephemeral broadcast. Full detail: **`PGBATTLE_REALTIME_COMMS.md`**.

---

## 9. Content pipeline, CI/CD & security

### Content pipeline (offline authoring → live)
```
author .md / seed script
   → node scripts/import-concepts.js        (parse + validate + upsert)
   → supabase db query --linked --file scripts/migrate-NN-*.sql   (schema, idempotent)
   → npm run build                          (regenerate dist/)
   → commit + push                          (Pages serves the new dist/)
```
All schema changes are numbered idempotent migrations (`scripts/migrate-NN-*.sql`,
using `IF NOT EXISTS` / `ON CONFLICT DO UPDATE` / `DROP POLICY … CREATE POLICY`).
RLS: public-read on modules/concepts/companies/contests + junctions; user-owned
write on lists/progress/submissions.

### CI/CD (`.github/workflows/`, at the repo root)
- **`pghub-ci.yml`** — on push/PR touching `PGHub/**`: `npm ci` → **lint** (0
  errors) → **guards** (NUL / emoji / secret) → **build** → concept-parse dry
  run. Least-privilege `permissions: contents: read`.
- **`pghub-deploy.yml`** — on push to `main`: re-runs the full check suite, then
  rebuilds & commits `dist/`. It pushes to a protected branch, so it either uses
  a bypass-listed identity or a deploy token; because it self-validates first,
  bypassing the branch rule stays safe.

### Security posture
- **No secrets in the repo.** `.env` is gitignored; the app's **publishable**
  (anon-equivalent) key is public by design and baked into the client bundle,
  while the **secret** (service-role-equivalent) key lives only in gitignored
  `.env` and Supabase Function secrets — never in a tracked file or in `dist/`.
- **`scripts/ci-guards.mjs`** blocks three classes at CI time: a NUL byte in any
  concept `.md`, an emoji in source, and any hardcoded secret key (a service-role
  JWT or an `sb_secret_…` key) in `src/`/`scripts/`.
- **Key rotation drill** (documented, credential-free): on a leak, rotate →
  migrate every app to the new publishable/secret keys → disable & revoke the
  legacy keys → close the alert. Rotating the JWT signing key alone does not kill
  a leaked legacy key; the legacy keys must be revoked.
- Dependencies are kept at **0 known vulnerabilities** across PGHub / PG.Play /
  onlineChess (stable Vite 7 toolchain), and CodeQL findings are fixed or
  triaged (vendored `dist/` library code and game-internal rendering dismissed
  with reasons; real escaping/XSS/URL issues fixed).

---

## 10. Locked architectural decisions (do not revisit without cause)

- **HashRouter, not BrowserRouter** — served at a sub-path on a static host.
- **Vite SPA, no SSR** — Query cache + lazy routes + hover prefetch cover
  perceived speed.
- **Content authored in markdown / seed scripts, bulk-imported** — not an
  in-browser CMS.
- **`dist/` is committed** — the deploy artifact for GitHub Pages.
- **DB tables stay `PGcode_*`** even though the folder/URL is now PGHub — renaming
  them would break every query and RLS policy for no gain.
- **6-state status taxonomy** (`not_started`, `attempted`, `solved`, `mastered`,
  `bookmarked`, `needs_revision`); legacy booleans kept in sync via `StatusPill`.
- **One Supabase project** shared across the hub; PostgREST caps a single SELECT
  at 1000 rows, so `useProblemsCompact()` paginates via `.range()`.
- **Roadmap files are user-protected** — match the most recent committed version;
  don't restyle without an explicit ask.

---

## 11. Quick "where do I…" index

| Task | Start here |
|---|---|
| Add a concept | `content/concepts/<slug>.md` → `node scripts/import-concepts.js` |
| Add an interactive viz | `learn/viz/<Name>Viz.jsx` (+`.css`) → register in `interactiveViz.js` |
| Add a graded problem | `scripts/seed-flagship-batch-NN.js` (id, method, params, test_cases) |
| Add a data query | a hook in `src/lib/queries.js` with a new `qk.*` key |
| Change the schema | new `scripts/migrate-NN-*.sql` (idempotent) + apply via Supabase CLI |
| Add a route | `React.lazy` + `<Route>` in `src/App.jsx` |
| Change theme tokens | `src/styles/theme.css` (all 8 palettes) |
| Run the checks locally | `npm run ci` (lint + guards + build + concept-parse) |
| Understand PGBattle video/voice/chat | `PGBATTLE_REALTIME_COMMS.md` |
| Look up which tech does what | `TECH_STACK.md` |
| Tune the LeetCode rating predictor | `LeetCodeAnalytics.jsx` + `scripts/validate-*.mjs` |

---

## 12. Companion docs

- **`TECH_STACK.md`** — every technology and what it's used for (stack only).
- **`PGBATTLE_REALTIME_COMMS.md`** — how the in-match video call, voice call, and
  chat are established (WebRTC + Supabase Realtime signaling + STUN/TURN).
- **`GRADING_HARNESS_INVARIANTS.md`** — the two-driver grading contract.
- **`AUTH_AUDIT.md`**, **`JUDGE0_SELF_HOST.md`** — auth sharing, Judge0 hosting.

---

*This document describes structure and flow only. For the "why" behind content
quality bars, voice rules, and the viz thesis, see `CLAUDE.md`.*
