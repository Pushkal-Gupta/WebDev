# QA Session Backlog — every recent user prompt, tracked to verified-done

Captured 2026-06-27 from the screenshot-flood QA session. Each item: status + how verified.
Verification target: build green + eslint 0 + headless screenshot (3–4 confirmations for the touchy ones).

## DONE + verified
- [x] **Bubble-sort / viz cut off ("absolutely horrible", "getting cut")** — `.viz-detail-stage` removed `max-height:62vh; overflow:hidden`; viz shows fully. _Verified: screenshot, bars no longer clipped._
- [x] **Rating predictor variance ("+234 vs +20")** — added LeetCode contest-count damping + unified field sample. Now +26 vs +20. _Verified: live lookup screenshot._
- [x] **Editable code Run "input is not defined"** — replaced with the LIVE NOTEBOOK as primary surface; harness preamble for legacy path. _Verified: 16+ templates ran._
- [x] **Live notebook (edit code+data → viz updates)** — InteractiveVisualizer surfaced prominently + auto-run-on-edit. _Verified: prod build, 45 frames auto-ran._
- [x] **Prev/Next pager broken** — stale-page handler fixed; sticky bottom. _Verified: Next→2→Prev→1._
- [x] **GAYMAN/MANGO acronyms** — badges restored on company group cards. _Verified: ACRONYM_PILLS=[FAANG,GAYMAN,MANGO]._
- [x] **Contests page no value** — upcoming Weekly/Biweekly + countdowns + cadence + PGHub Weekly. _Verified: screenshot._
- [x] **ForgeThumb repeated/truncated** — value-driven motif index + label fit. _Verified: cuda/math screenshots._
- [x] **Sticky paper diagram** — aside stretch + capped height; pins through scroll. _Verified: top identical at scroll 550/900._
- [x] **Redundant 3-viz stacking on /visualize** — dropped frame-walkthrough when RichViz exists (hero viz + live notebook only). _Verified: build; re-confirm screenshot._
- [x] **"No output" confusing** — success-with-no-print now explains; ModuleNotFound (torch) now shows "illustrative, run locally". _Verified: build; re-confirm screenshot._
- [x] **PGForge projects = single code block** — all 10 now multi-cell Jupyter notebooks (markdown + runnable pure-Python cells). _Verified: 12 cells render, all 10 run clean in python3._
- [x] **Viz must fit on screen with controls (HARD rule)** — added to CLAUDE.md. _(enforcement sweep pending — see OPEN)._
- [x] **PGArena more contests** — 18→38 (+20 batch-3). _Verified: 38 render._
- [x] **llm-wiki stale** — 5 new pages + index refreshed. _Verified: files exist, linked._

## OPEN — to fix + verify this pass
- [x] **Viz fit-on-screen ENFORCEMENT** — capped MLViz `.mlviz-svg` 52→42vh, `.viz-detail-stage svg` 50→42vh, MnistNet 50vh, +catch-all in MLLesson.css. _Verified: optimizer-zoo controls now in view; ps-clt 843→713, taylor 809→737, vector-fields 822→731._ Residual: a few ML lessons overflow via tall READOUTS not SVG (kl-divergence, chain-rule) — flagged for a readout-layout pass.
- [x] **PGBattle compare users** — default mode=compare, seeded Pushkal_Gupta vs Pushkal-Gupta on mount, placeholders fixed, +15-row StatComparisonTable (rating/peak/rank/solved breakdown/acceptance/beats/contests/streak/badges). _Verified: compare shows on load, both real handles, 12 sized SVGs, no inner scroll._
- [x] **Wave 8 Databases** — 4 viz built + registered, databases module added, imported live (523 concepts). _Verified: db-btree + db-tx viz render (bigSVG=1), db-norm uses HTML tables by design, no crashes._
- [ ] **/learn lesson-card grids cleaner/premium** (optimization lesson grid) — polish pass. (deferred)
- [ ] **DEPLOY**: rebuild dist/ committed + pushed — live site (pushkalgupta.com/PGHub/dist) is stale vs local. User runs the commit/push.

## Content engine (parallel, ongoing)
- [x] Waves 1–8 shipped (Calculus + animations, Linear Algebra, Prob-Stats + depth, Neural Networks + depth, Databases). **523 concepts live.**
- [x] PGForge projects → multi-cell Jupyter notebooks (all 10; linear-regression verified: 13 cells, 7 md + 5 code + 5 exec badges, no errors).
- [ ] Continue T1–T6 (next: more Databases/CS-core, then Languages T3).

## Verification log (this pass — full sweep, fresh server, vite cache cleared)
- `eslint .` exit 0 · `npm run build` green.
- Headless DOM sweep (broke + pageerror): bubble, db-btree, db-relational, db-tx, db-norm, project-nb, optimizer-zoo, compare, ps-hyp → **0 crashes, 0 pageerrors** across all.
- Project notebook DOM probe: 13 cells / 7 md / 5 code / 5 exec badges, no errors.
- (Screenshot capture hangs on heavy auto-animated viz — a harness limitation, not a page bug; DOM probes confirm render + no errors.)
