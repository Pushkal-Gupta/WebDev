# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PGcode is a single-author DSA / interview-prep platform aiming to be measurably better than NeetCode + GeeksforGeeks + Programiz combined — broader catalog, deeper editorial, more polished UI, server-side grading, multi-language support. Design quality and editorial depth outrank feature count.

Live: `https://pushkalgupta.com/PGcode/dist/index.html` (HashRouter; URLs use `#/`).

## PRIMARY GOAL (HARD — overrides everything else when ambiguous)

**Operate as the team lead.** Do not idle, do not wait. Continuously dispatch parallel sub-agents to build, verify, test, document, and grow content until every problem is shippable. The bar for "shippable" on a problem is:

1. **Solutions correct.** Canonical Python solution compiles and passes EVERY test case in the registry — verified via Judge0 (`scripts/verify-prune-tests.js` or `verify-all.mjs`). Any solution that fails on a real test case is a P0 fix.
2. **Test cases trustworthy.** Every test case has been graded by the canonical solution. Bad cases (wrong `expected`, malformed `inputs`) are pruned, not patched-around. Hidden cases (every case past index 2) must work identically to samples.
3. **Coverage ≥ LeetCode.** Each problem must hold at least as many test cases as the LC problem of the same number, and the curated set should *include* the canonical LC samples plus aggressive edge cases (empty, single, all-equal, negatives, ints at int32 bounds, off-by-one neighbours, max-length input, adversarial sequences). Catching a wrong submission that LC would have rejected is the floor. **If a wrong solution slips through our grader, that's a P0 incident.**
4. **All four required languages.** Python, JS, Java, C++ solutions must compile and pass.

How to actually run the work:
- **Always have ≥4 sub-agents in flight** when the user is in pipeline mode ("continue", "build", "do not stop") — pick a mix from: new-problem content waves, verify-prune sweeps, bulk-grow rounds, edge-case seeding, missing-language backfill, viz upgrades.
- After each batch lands, **push** (`node scripts/push-rich-content.js`) then immediately dispatch the next batch — do not stop to ask. The user has standing approval for this loop.
- Track waves in TaskCreate/TaskUpdate so progress is visible.
- If an agent stalls (600s watchdog), hand-write the script directly with the `lcg()` + `JSON.stringify(code)` template — never rely on a single stuck agent.

**Never let the queue go empty unless the user explicitly stops.** Idle = failure.

## Planned expansion — ML / numerical / systems topics

Next major expansion: replicate the structure + depth of https://www.tensortonic.com/ in the user's own voice, with original visualizations. Scope includes machine-learning foundations (linear algebra primitives, gradient descent, backprop, attention, transformers, optimizers, regularization, RL basics), numerical methods, and adjacent CS topics that don't fit DSA/interview-prep. **NOT a copy-paste** — same coverage, original writing, original ASCII + interactive visualizations matching the existing PGcode tone.

How to slot it in is undecided — could be a new top-level area (`/ml`) with its own modules + sub-modules, or could fold into Concepts as a new module-of-modules. Decide with the user before starting.

When the user gives the green light to start, they want to discuss the partitioning before any content lands. Until then: do not start writing ML content.

## Content-quality bars (HARD)

- **Concepts** must hit: intro 60+ w, whyItMatters 70+ w, **intuition ≥ 200 w**, **visualization ≥ 8 fenced ASCII lines**, bruteForce 60+ w, **optimal ≥ 200 w**, complexity 40+ w, pitfalls ≥ 4 items, interviewTips 3 items, code blocks for all 4 languages (Python / JS / Java / C++).
- **Tutorial theory bodies** must hit: 500–800 w, the 5-section template (mental model + canonical operation + when to reach + variants + interview problems), `complexity` object with 4 keys, ≥4 `pitfalls` with the fix included, ASCII diagram + Python code block + at least one `> Note:` / `> Tip:` callout.
- **Course lessons** must hit: 350+ w of theory, ≥1 worked example with code, ≥1 exercise, ≥1 common-mistake call-out. Each course or sub-module should hold **10–15 lessons**; if a course grows past 20, split into sub-modules or spin a new course.
- **Module structure**: any concept-module with >40 entries needs **sub-modules** of 10–15 concepts each (system-design at 110 is the canonical offender — split by network / storage / consensus / caching / auth / API / reliability / microservices).

## Voice & framing (HARD)

**Every line of user-facing copy must be written FOR THE READER, not ABOUT THE PRODUCT.** Never describe what the site is to a hypothetical builder, PM, or investor. The reader is on the page to learn — write what they want to read, not what we want them to know about us.

Forbidden phrasing (do not ship these or anything like them):
- "Integrated DSA + algorithms syllabus" / "comprehensive curriculum" / "end-to-end learning path" — internal pitch language.
- "We've built…" / "We're working on…" / "Let's build together" — builder voice.
- "This platform offers…" / "This section contains…" — meta-description; just deliver the content.
- "Welcome to X! In this guide we will…" — onboarding fluff; get to the point.

Replace with reader-direct phrasing:
- Tell them what they get ("Every data structure and algorithm you'll need — with intuition, complexity, code in four languages.")
- Or describe the thing in front of them ("Sorted array search in O(log n).")
- Use "you" sparingly; default to declarative. The reader is already here — no need to greet them.

Scope: page subtitles, module descriptions, course intros, empty states, hero copy, modal headers, footer text. Tutorial / concept BODIES can use "you" for instructional voice (that's the customer-facing register). Visualization captions stay narration-style ("The pointer moves right…") — describe the action, not the build.

Audit before shipping any new page: read every line aloud as a stranger. If it sounds like a product brief or an internal pitch, rewrite.

## One-line rule (HARD — overrides any urge to "set the stage")

**Page headers are page headers, not pitch decks.** Every page intro is **one short line** describing what's on it — then the content starts immediately. No multi-sentence hero paragraph. No stat row that says "6 pillars / 60+ planned essays / Original visualizations". No "What you'll actually get" promise section listing what makes us great. The page itself is the proof — content beats narration.

What to do:
- Hero copy: a single descriptive sentence under the title. 12-25 words max.
- Drop the "stats triple" pattern (count / count / superlative) unless every value is a real, useful number a reader would scan for.
- Drop "promise" / "what we believe" / "what you'll actually get" sections entirely. The reader sees what they get by scrolling.

What to delete on sight:
- "Every X you actually need, in plain English, with original visualizations and runnable code."
- "Same depth and tone as the DSA side, written for the reader who wants to understand the math."
- "What you'll actually get" lists bragging about no-fluff writing.
- Anything that reads like a product manifesto rather than a section heading.

This rule applies to **already-shipped pages too** — audit hubs, indexes, and any landing pages on each pass; trim until only the one-line intro plus the actual content remains.

## Triple-review policy

For any new content batch (≥6 concepts OR a new course OR a tutorial-body rewrite), after the writer agent finishes, dispatch **two independent review agents in parallel**:
- **Reviewer A** — content accuracy (algorithm correctness, code compiles, complexity claims right).
- **Reviewer B** — quality bar enforcement (word counts, section presence, no shallow filler).
- The writer agent counts as the 3rd pass.

Reviewers report a punch list of fixes; a follow-up writer agent (or foreground edits) applies them.

## Tech stack

- **Frontend:** Vite + React 19 SPA, React Router 7 (**HashRouter** — locked).
- **Routing:** every route lazy-loaded via `React.lazy` + `Suspense` in `src/App.jsx`.
- **Data:** Supabase (Postgres + Auth + Edge Functions). Project `ykpjmvoyatcrlqyqbgfu` (Singapore). Supabase CLI is linked.
- **Cache:** TanStack Query + `localStorage` persistence (`src/lib/queryClient.js`).
- **Editor:** `@monaco-editor/react` (Workspace, Playground, CoursePage example blocks).
- **Roadmap viz:** `reactflow`.
- **Code execution:** Judge0 via Supabase Edge Function `run-code` — 14 languages. Driver-code harness only supports Py/JS/Java/C++ (`HARNESS_LANGS` in `src/lib/codeRunner.js`).
- **Server-side grading:** Edge Function `grade-submission` — loads tests + driver from DB, calls Judge0, returns aggregated verdict. Workspace falls back to client flow on 5xx.
- **Icons:** `lucide-react` only — **never emoji**.

## Commands

```bash
npm run dev            # vite dev server on 5173
npm run build          # production build → dist/
npm run preview        # serve dist/ locally
npm run lint           # eslint .
node scripts/verify.js                       # build + lint + concept-parse + dev smoke (17 checks)

# Content
node scripts/import-concepts.js              # bulk-import content/concepts/*.md
node scripts/import-concepts.js --dry        # validate parse without writing
node scripts/check-flagship-ids.js <search>  # find DB id for a problem name
node scripts/multiply-test-cases.js --slug X --target 50    # generate + grade more cases
node scripts/scrape-leetcode.js --list       # pull LC problem index
node scripts/scrape-leetcode.js --import-to-supabase        # push scraped JSON to DB
node scripts/push-rich-content.js            # push RICH_CONTENT (solutions/viz) to DB

# Supabase (CLI linked to ykpjmvoyatcrlqyqbgfu)
supabase db query --linked --file scripts/migrate-NN-*.sql
supabase db query --linked "SELECT ..."
supabase functions deploy <run-code|grade-submission>
```

`scripts/verify.js` is the single source of truth — if it doesn't pass (17/17), the change isn't shippable. Run it after every non-trivial edit.

## High-level architecture

**Three layers**, each with strict invariants:

1. **Content authoring (markdown + seed scripts)** — `content/concepts/*.md` for Learn, `scripts/seed-*.js` for problem catalog growth, `src/content/*.js` for courses/tutorial/playground starters. All authored offline, then bulk-imported into Supabase.

2. **Data access (`src/lib/queries.js`)** — every Supabase read/write goes through a query hook here, keyed by the `qk.*` registry. Components never call `supabase.from()` directly. Mutations use the optimistic pattern: `queryClient.setQueryData` + invalidate on settle (see `progressMutation` in `TopicModal.jsx`).

3. **Routes/components (`src/components/*`)** — every route lazy-loaded via `React.lazy` in `App.jsx`. Each page lives in its own folder when complex (`learn/`, `courses/`, `contests/`, `company/`). Workspace is the one large monolith (~1300 lines); intentional — don't split without explicit approval.

**Auth + theme** are bridged at the App level: theme is a CSS-variables attribute on `[data-theme]`, persisted to `PGcode_profiles.theme_preset` with localStorage fallback. 8 palettes (4 paired) defined in `src/styles/theme.css`. Custom per-token overrides via `src/lib/customColors.js`.

**Bundle** is split via Vite `manualChunks`: react, monaco, reactflow, query, supabase, icons each as separate cached vendor chunks (main entry ~250KB).

## Code conventions (HARD rules)

1. **No emoji anywhere.** Source, commits, chat. Lucide icons in code; reference by name in chat ("ArrowRight icon").
2. **No hardcoded colors.** Always theme tokens: `var(--accent)`, `var(--bg)`, `var(--surface)`, `var(--text-main)`, `var(--text-dim)`, `var(--border)`, `var(--hover-box)`, `var(--easy|--medium|--hard|--warning)`, `var(--hue-violet|--hue-sky|--hue-pink|--hue-mint)`, `rgba(var(--accent-rgb), 0.X)`. All 8 palettes define these.
3. **No new files unless necessary.** Prefer editing existing.
4. **No comments explaining WHAT code does.** Only non-obvious WHY (hidden constraint, workaround, subtle invariant). Default: no comments.
5. **No docs files unless explicitly requested.** Planning lives in `docs/`.
6. **No try-catch around things that can't fail.** Only at system boundaries (user input, Supabase, Judge0).
7. **All Supabase reads/writes go through `src/lib/queries.js`** with a stable `qk.*` key.
8. **All schema changes go through a numbered `scripts/migrate-NN-*.sql`** — idempotent (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE` / `DROP POLICY IF EXISTS` then `CREATE POLICY`).
9. **The user runs `git commit` / `git push`.** Never do it without explicit ask.
10. **Secrets via env vars only.** `.env` is gitignored; service role key only in scripts that need it.
11. **Use `--container-w` token (default 1200px)** for any centered page wrapper.

## Locked architectural decisions

- **HashRouter, not BrowserRouter.** Served at a sub-path on a static host; BrowserRouter would need server-side rewrites.
- **Vite SPA, no SSR.** React Query cache + lazy routes + hover prefetch covers perceived speed.
- **Content authored in markdown / seed scripts, bulk-imported.** Not an in-browser CMS.
- **6-state status taxonomy** (`not_started`, `attempted`, `solved`, `mastered`, `bookmarked`, `needs_revision`). Legacy `is_completed`/`is_starred` booleans kept in sync via `StatusPill`.
- **One Supabase project shared with PG hub.** Session auto-shared via localStorage. See `docs/AUTH_AUDIT.md`.
- **Server-side grading is the path forward** — test cases in `PGcode_problems.test_cases`, `grade-submission` edge function loads them + driver and calls Judge0.
- **Topic-id mapping for LC imports lives in `scripts/recategorize-leetcode.js`** as a priority-ordered list. Specific topics (sliding-window, dp, graph) outrank generic catch-alls (arrays, strings, math).
- **PGcode N modes guarantee ≥1 problem per topic** — `filterByRoadmap` takes top-N then adds the top-ranked problem of any not-yet-represented topic. Never let a topic show "0 problems" under PGcode 100.

## Database

Numbered migrations in `scripts/migrate-NN-*.sql`. Apply with `supabase db query --linked --file <path>`. Highlights:
- `00..09` original catalog schema
- `11` Learn modules + concepts
- `13` rich problem fields (hints, editorial, frequency_score) + submissions
- `14..21` lists, roadmaps, snippets, achievements, companies, admin gating, contests
- `28` `solutions JSONB` + `viz_steps JSONB`
- `29` home RPCs (streak, POTD, random-unsolved)
- `30` system-design module
- `31` public-read RLS policies (modules/concepts/companies/contests + junctions) — fixed anon getting `[]` from these
- `32` user-owned write RLS (lists/progress/submissions/achievements/concept-progress/friends/snippets) — `/lists` Create works after this

All tables prefixed `PGcode_` (capital P; SQL must quote). RPCs are lowercase `pgcode_*`.

`useProblemsCompact()` paginates `.range()` in batches of 1000 — PostgREST's `db-max-rows` caps a single SELECT, so explicit pagination is required.

## Adding things — quick recipes

### A concept
1. Create `content/concepts/<slug>.md` matching the 13-section template (read `loop-detection.md` for reference): intro, whyItMatters, intuition, visualization, bruteForce, optimal, complexity, pitfalls, interviewTips, code.python/javascript/java/cpp. Frontmatter needs `slug`, `module` (valid module-slug), `title`, `subtitle`, `difficulty`, `position`, `estimatedReadMinutes`, `prereqs: []`, `relatedProblems: []`, `references`, `status: published`.
2. `node scripts/import-concepts.js --dry` then without `--dry`.

### A visualization
1. In `src/components/learn/conceptVisualizations.js`, write a `*Frames(...args)` function pushing one frame per step. Each default case should have ≥10 frames.
2. Register in the `VISUALIZATIONS` map keyed by the concept slug. Shape: `{ title, renderer: 'array'|'graph'|'window'|'grid'|'tree', cases: [{label, frames}], build?: (input)=>frames, inputSchema?: {fields:[...]} }`.
3. Appears at `/visualize/<slug>` and on the concept page automatically. The index page (`VisualizeIndex.jsx`) groups by module from the `META` map.

### A flagship problem with full grading
1. Find canonical DB id: `node scripts/check-flagship-ids.js <search>`.
2. Add to a new `scripts/seed-flagship-batch-NN.js`. Each entry needs `id`, `method_name`, `params: [{name, type}]`, `return_type`, `hints` (5 graduated), `tags`, `constraints`, `follow_up`, `pattern`, `test_cases: [{inputs:[str], expected:str}]`.
3. `node scripts/seed-flagship-batch-NN.js`. Optionally `node scripts/multiply-test-cases.js --slug X --target 50` to grow cases via Judge0.

### A schema change
1. New `scripts/migrate-NN-*.sql`, idempotent (`IF NOT EXISTS` / `ON CONFLICT` / `DROP POLICY IF EXISTS` then `CREATE`).
2. Apply: `supabase db query --linked --file scripts/migrate-NN-*.sql`.
3. Add corresponding query hook in `src/lib/queries.js` with a new `qk.*` key.

## Gotchas

- **`Workspace.jsx` is large (~1300 lines).** Don't refactor without explicit user approval — too many cross-tab interactions. Add functionality via small targeted edits.
- **Hook ordering:** if you add early returns / conditional rendering, all hook calls must come *before* them. Past crash: `RoadmapTrack.jsx` violated this on slug-not-found.
- **TDZ traps:** a `useEffect` cannot read a variable defined later in the function body — JS evaluates the deps array at the function call site. Past crash: `Workspace.jsx` read `userProgress` in an effect declared before the `useQuery` that defined it.
- **`react-hooks/set-state-in-effect`** is overzealous for ReactFlow's controlled state. `RoadmapView.jsx` and `DryRunViewer.jsx` have legitimate `eslint-disable` blocks.
- **Roadmap files (`TopicNode.jsx`, `TopicNode.css`, `RoadmapView.jsx`) are user-protected.** Don't restyle without explicit ask — match the version in the most recent git commit.
- **Topic name parsing:** use `primaryTopicLabel` / `fullTopicLabel` from `src/lib/topicLabel.js`. Some `PGcode_topics.name` rows contain literal `\n` or actual newline.
- **HashRouter URLs use `#/`.** `Link to="/foo"` is fine — Router handles it.
- **Same-named list slug + roadmap slug auto-link.** `blind-75` roadmap auto-renders the `blind-75` list when its nodes table is empty.
- **No driver code outside Py/JS/Java/C++.** Playground accepts all 14; Workspace test-running only works for the 4. `HARNESS_LANGS` gates this.
- **Flagship `test_cases` use `{inputs: [string]}` (array of per-param strings).** Workspace's Examples panel formats them via `activeProblem.params` for `name = value` display. LC-imported problems have HTML examples baked into `description` instead.
- **PostgREST `db-max-rows`** caps a single SELECT at 1000. `useProblemsCompact()` paginates explicitly via `.range()`.
- **`prefers-reduced-motion`** — `AlgoVisualizer.css` zeroes its animations when set. Respect this in any new transitions.

## SubNav order (locked by user)

```
Roadmap · Practice · Playground · Tutorial · Concepts · Courses · Visualize · Review ·
Companies · Contests · Lists · Notes · Progress
```

`/assessments`, `/history`, `/achievements` are intentionally absent from SubNav — they were folded into `/practice` (Generate practice set) and `/progress` (tabbed view: Stats / History / Achievements / Topic Mastery). Routes remain registered in `App.jsx` so existing bookmarks resolve.

## When the user says "continue building"

Pick the next highest-MVP-value item from `docs/PLATFORM_PLAN_V5.md`. Ship it properly: schema → hooks → component → verify. Run `node scripts/verify.js` at the end. Depth over breadth. **Never wait.**

For parallel work, dispatch subagents on non-overlapping files (one agent per file/folder). Visualizer / Workspace / queries.js are common collision points — coordinate.
