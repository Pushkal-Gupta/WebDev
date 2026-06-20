# PG Hub rebrand + tab restructure (2026-06-14)

The product is **PG Hub** (was "Pushkal Gupta Code" / "PGcode"). Several top-level tabs were renamed to a `PG<suffix>` scheme, and four tabs were consolidated.

## Brand name

User-facing brand is **PG Hub**. Changed surfaces (brand label only):
- `src/components/Logo.jsx` — wordmark accent word `Code` → `Hub`; aria-label `PG Hub · Pushkal Gupta`.
- `src/components/Navbar.jsx` — `.brand-suffix` text `Code` → `Hub`.
- `index.html` — `<title>`, meta description, `.pg-shell-brand` span, and the favicon now points to local `./favicon.svg` (was a stray external URL).
- Stray UI brand strings (SidePanel curated-set label, ShareableCard, achievements, Playground starter greetings, Monaco command labels, "Solve on …" tooltips) → "PG Hub".

**DO NOT rename (infra, not brand):** the `PGcode_` DB table prefix, `pgcode_*` RPCs, `/PGcode/dist/` deploy base path, `qk.*` keys, package.json `name`, import paths, repo dir, `.pg-*` CSS classes, and example variable values inside lesson bodies.

## Tab scheme (SubNav.jsx)

**Every** tab is now PG-branded via a two-part `brand: [prefix, suffix]`. Render: `<span class="sub-nav-pg">PG</span>{suffix}`. `.sub-nav-pg` is dim + small (0.64em, --text-dim, opacity 0.55, tight margin) so the suffix dominates ("go light on PG, emphasize the suffix"). Active state tints the PG prefix --accent. Link font 0.82rem/700, icons 16px, nav `justify-content: center` with gap 1.25rem.

Order + route + icon:
**PGPath**(/, Map) · **PGDrill**(/practice, List) · **PGLab**(/playground, Terminal) · **PGLearn**(/learning, GraduationCap) · **PGForge**(/ml, Brain) · **PGBattle**(/compete, Swords) · **PGCareer**(/company, Building2) · **PGArena**(/contests, Trophy) · **PGVault**(/vault, Vault).

`PGVault` consolidates the old Review/Lists/Notes/Progress tabs — its `matches` lights it up on `/vault`, `/review`, `/lists`, `/notebook`, `/progress` (routes stay registered). Badge moved onto PGVault. `PGLearn` matches also include `/visualize` (VisuAlgo lives under Learning).

Reference-site → area mapping (the three scaffolds, matched then deleted): **VisuAlgo → PGLearn** (Visualize), **TensorTonic → PGForge** (ML), **EntrantHub → PGBattle** (Compete).

Mirror surfaces synced: `MobileBottomNav.jsx`, `CommandPalette.jsx` (aliases: vault/forge/battle/career/arena/lab/path/drill/learn/ml/compete/review/lists/notes/progress).

## Pre-render shell (index.html)

The static `#pg-shell` placeholder (instant first paint before React mounts — the static-host stand-in for SSR) is a faithful replica of the real header: brand "Pushkal Gupta Hub", a real theme-toggle pill (`.pg-shell-switch`) + LOGIN button (`.pg-shell-auth`) matching Navbar's `.toggle-wrap`/`.auth-btn`, and the centered icon nav with inline-SVG lucide icons + dim-PG labels. Keep it in sync with SubNav whenever tabs change. NOTE: opening the **source** `index.html` via a static file server (Live Server) shows this shell forever because `/src/main.jsx` isn't transpiled — use `npm run dev` or serve the built `dist/`.

## PGForge (the ML area, /ml)

`/ml` is now the **PGForgeHub** landing — a 6-card grid. Existing pillar grid (old MLHub) moved to `/ml/learn`. Sections under `src/components/ml/forge/`:
- `/ml/learn` → MLHub (existing pillars/lessons)
- `/ml/papers` → PGForgePapers (12 landmark papers; left rail + selected breakdown + original SVG schematic; real arXiv IDs, Scholar-search fallback when no preprint)
- `/ml/projects` → PGForgeProjects (curated build-it projects)
- `/ml/roadmaps` → PGForgeRoadmaps (track built from real PILLARS in mlContent.js)
- `/ml/problems` → PGForgeProblems (curated hands-on exercises)
- `/ml/arena` → PGForgeArena (challenge cards linking into viz/lessons)

Routing note: static segments (`/ml/learn`, `/ml/papers`, …) outrank the dynamic `/ml/:pillarSlug` in React Router v7 by specificity, so they coexist without ordering tricks.

## PGBattle (the Compete area, /compete)

`CompeteHub` is PGBattle. Featured cards link to the new routed sub-pages:
- `/compete/leetcode/problems` → LcProblemsBrowser (2509 rated problems from `PGcode_lc_questions`; rating bar chart + sortable/paginated table; solve-rate is a labeled ESTIMATE derived from rating).
- `/compete/leetcode/problems/:slug` → LcProblemDetail (rating scale + band number-line + stat strip).
- `/compete/leetcode/contests` → LcContestList (external_contests filtered to leetcode).
- `/compete/competitions` → CompetitionsSection (kaggle), `/compete/hackathons` → HackathonsSection (devpost), `/compete/conferences` → ConferencesSection (curated).

## Data added

- `scripts/migrate-52-lc-questions.sql` → `PGcode_lc_questions` (title_slug PK, rating, contest, problem_index, difficulty; public-read RLS).
- `scripts/seed-lc-questions.mjs` → ingests the public zerotrac problem-rating dataset (~2509 rows). Idempotent upsert on title_slug.
- Hooks `useLcQuestions()` (paginates past 1000-row cap) + `useLcQuestion(slug)` in `src/lib/queries.js`.

## GAYMAN company group

Added to `src/content/companyGroups.js` (slug `gayman`): Google, Amazon, Y Combinator, Meta, Apple, Nvidia. Matches existing FAANG-group `match` predicate; Y Combinator has no company record yet so it silently no-matches until seeded (same convention as other groups).

## PGForge depth (TensorTonic-grade)

- `/ml/papers` (PGForgePapers) is a 3-pane reading experience: paper rail → numbered method **step breakdown** (each paper in `pgForgePapersData.js` has a `steps:[{title,detail,block}]`) → architecture diagram that highlights the `block` for the selected step. ~23 papers.
- `/ml/problems/:slug` (PGForgeProblemDetail) is an IDE-style problem page: KaTeX statement + examples + collapsible hints (left) and a Monaco editor + Run (via `runCode` from codeRunner) + Reset-to-starter + test-case panel (right). Data in `src/components/ml/forge/pgForgeProblemsData.js` ({slug,title,difficulty,topic,statement,examples,starterCode.python,hints,tests}). PGForgeProblems cards link to it. Only Monaco scrolls; panes stack narrow.

## Hub page titles + company groups

- Hub H1s are branded with the dim-PG span treatment: PGLearn (LearningHub), PGCareer (CompaniesIndex), PGArena (ContestsIndex), PGBattle (CompeteHub), PGVault, PGForge.
- Company groups in `src/content/companyGroups.js`: FAANG, GAYMAN (Google/Amazon/YC/Meta/Apple/Nvidia), MANGO (Microsoft/Apple/Nvidia/Google/OpenAI), Big Tech, Unicorns, etc.
