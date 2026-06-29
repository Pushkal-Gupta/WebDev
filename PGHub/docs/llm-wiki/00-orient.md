# 00 · Orient

If you're a coding agent landing in this repo, read this page first. It's 60 seconds.
It points you at the right wiki page for what you're about to do.

## What is this repo?

PG Hub (formerly PGcode) — a DSA / interview-prep / ML-DL-AI / math-foundations
learning platform. ~4500 problems with graded test cases, ~500 concept references
(now including calculus, linear algebra, probability), ~150 ML lessons, ~200
interactive SVG viz components + in-browser live notebooks, internal PGArena contests
+ external contest aggregation, three code playgrounds (Python via Judge0, Web
HTML/CSS/JS, SQL via sql.js). Vite + React 19 SPA, HashRouter, Supabase backend.

## What you should read by task

| If you're about to… | Read |
|---|---|
| Add a new `content/concepts/*.md` at scale (wave pattern) | [`content-growth-pipeline.md`](./content-growth-pipeline.md), [`concept-audit-checklist.md`](./concept-audit-checklist.md) |
| Stand up a whole new subject/module (Calculus, OS, …) | [`adding-a-learn-module.md`](./adding-a-learn-module.md) |
| Write a new SVG viz component (DSA or ML) | [`viz-component-patterns.md`](./viz-component-patterns.md), [`scrollbar-rule.md`](./scrollbar-rule.md) |
| Build a premium ML "explorer" viz / register a viz in MLLesson | [`premium-explorer-viz.md`](./premium-explorer-viz.md) |
| Build a 3B1B-style animated viz (SVG + rAF, not literal manim) | [`manim-style-animation.md`](./manim-style-animation.md) |
| Add an editable live-notebook to a `/visualize/<slug>` page | [`live-notebook.md`](./live-notebook.md) |
| Make sure a component's CSS actually loads on its route | [`component-css-import.md`](./component-css-import.md) |
| Seed internal PGArena contests | [`contest-seeding.md`](./contest-seeding.md) |
| Build external contest aggregation / VisuAlgo gallery | [`entranthub-visualgo-integration.md`](./entranthub-visualgo-integration.md) |
| Edit `src/content/mlContent.js` / any huge file | [`large-file-edit-strategy.md`](./large-file-edit-strategy.md) **before you touch it** |
| Backfill `explained_samples` for a batch of problems | [`explained-samples-backfill.md`](./explained-samples-backfill.md) |
| Run any Judge0 work or launch a background script | [`judge0-and-backgrounds.md`](./judge0-and-backgrounds.md) |
| Visually QA the app (headless screenshots) | [`screenshot-qa-harness.md`](./screenshot-qa-harness.md) |
| Modify any CSS at all | [`scrollbar-rule.md`](./scrollbar-rule.md) — single hardest rule in the repo |
| Add a brand-new route page | [`page-must-scroll.md`](./page-must-scroll.md) |
| Dispatch parallel sub-agents | [`agent-dispatch-recipes.md`](./agent-dispatch-recipes.md) |
| Touch test cases or canonical solutions | [`test-coverage-pipeline.md`](./test-coverage-pipeline.md), [`pattern-1-quoting-bug.md`](./pattern-1-quoting-bug.md) |
| Understand naming / tab structure | [`pg-hub-rebrand.md`](./pg-hub-rebrand.md) |

## Full page index (grouped)

**Architecture & ops**
- [`pg-hub-rebrand.md`](./pg-hub-rebrand.md) — the PG Hub rename + tab restructure (SubNav order, consolidations).
- [`agent-dispatch-recipes.md`](./agent-dispatch-recipes.md) — wave templates that have worked (and ones that haven't).
- [`judge0-and-backgrounds.md`](./judge0-and-backgrounds.md) — when to background a script + how to monitor; Judge0 is the bottleneck.
- [`large-file-edit-strategy.md`](./large-file-edit-strategy.md) — why writes into `mlContent.js`/`problemContent.js` stall, and what to do instead.

**Content authoring**
- [`content-growth-pipeline.md`](./content-growth-pipeline.md) — the wave pattern for adding Learn concepts at scale (author → viz → register → import → verify).
- [`adding-a-learn-module.md`](./adding-a-learn-module.md) — standing up a new subject area: the `PGcode_modules` row + idempotent migration + sub-modules.
- [`concept-audit-checklist.md`](./concept-audit-checklist.md) — add a `content/concepts/*.md` without duplicating an existing slug.
- [`explained-samples-backfill.md`](./explained-samples-backfill.md) — writing the 3 worked-sample explanation paragraphs that teach.
- [`contest-seeding.md`](./contest-seeding.md) — seeding internal PGArena contests (`PGcode_contests` + `_contest_problems`, deterministic pick).

**Visualizations**
- [`viz-component-patterns.md`](./viz-component-patterns.md) — write a new SVG viz without tripping lint or scrollbars.
- [`premium-explorer-viz.md`](./premium-explorer-viz.md) — the premium ML "explorer" bar + central registration + lazy-mount.
- [`manim-style-animation.md`](./manim-style-animation.md) — 3B1B-style animation in React (SVG + rAF + KaTeX); not literal manim video.
- [`live-notebook.md`](./live-notebook.md) — the editable in-browser code → `step()` frames notebook on `/visualize/<slug>`.
- [`component-css-import.md`](./component-css-import.md) — the "giant black circle": route-mismatched CSS imports ship unstyled SVG.
- [`entranthub-visualgo-integration.md`](./entranthub-visualgo-integration.md) — external contest aggregation + VisuAlgo visualize-overhaul plan (+ the "delete the references" rule).

**Quality & QA**
- [`scrollbar-rule.md`](./scrollbar-rule.md) — only the vertical page scroll exists. The single hardest rule.
- [`page-must-scroll.md`](./page-must-scroll.md) — the recurring "new page can't scroll" bug + route-container fix + UI verify passes.
- [`screenshot-qa-harness.md`](./screenshot-qa-harness.md) — headless screenshots; build-passing ≠ renders-correctly.
- [`test-coverage-pipeline.md`](./test-coverage-pipeline.md) — the Stage 1–6 plan + which script does what.
- [`pattern-1-quoting-bug.md`](./pattern-1-quoting-bug.md) — the JSON-double-quoting storage bug + fix recipe.

## Constraints you cannot override

- `CLAUDE.md` at repo root has hard rules. They beat best-practice intuition every time. Re-read them when in doubt.
- Workspace.jsx, RoadmapView.jsx, dryrun/DryRunViewer.jsx, and the roadmap `TopicNode.*` files are **user-protected**. Do not refactor without explicit ask.
- The user runs `git commit` / `git push`. Never do it without explicit ask.
- The user hates inner scrollbars more than anything. See [`scrollbar-rule.md`](./scrollbar-rule.md).
- `interactiveViz.js` (DSA registry) and `MLLesson.jsx` `VIZ_REGISTRY` (ML) are central collision points — only the orchestrator edits them; build agents create viz files only.

## The stage 1–6 mental model for test coverage

The biggest ongoing back-end work is driving all problems to ≥50 verified test cases:

1. **Stage 1 — bulk-grow** (`scripts/multiply-test-cases.js`): generate inputs, grade via Judge0, merge.
2. **Stage 2 — LC scrape** (`scripts/scrape-lc-testcases.js`): pull LC's samples for parity.
3. **Stage 3 — mutation testing** (`scripts/mutation-test.js --augment`): plant mutations; any that passes all tests reveals a gap.
4. **Stage 4 — explained_samples**: 3 worked test cases per problem with prose.
5. **Stage 5 — verify-prune** (`scripts/verify-prune-tests.js`): drop cases where canonical disagrees with stored expected.
6. **Stage 6 — re-audit & publish** (`scripts/refresh-status.mjs`): rewrite the tables in `status.md`.

See [`test-coverage-pipeline.md`](./test-coverage-pipeline.md) for which stage to attack next.

## The other big push: content growth

Parallel to test coverage, `docs/CONTENT_GROWTH_PLAN.md` drives the catalog toward
"every course worth learning, interactive · visual · intuitive." Math foundations
(Sprint 1) shipped; ML/DL depth, CS-core, language courses follow. Start at
[`content-growth-pipeline.md`](./content-growth-pipeline.md).

## When you finish work

Update `status.md` if your work moved one of the numbers (`node scripts/refresh-status.mjs`),
and the **Done log** in `docs/CONTENT_GROWTH_PLAN.md` if it was a content wave.
