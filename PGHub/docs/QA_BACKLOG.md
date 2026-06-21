# PGHub — QA Backlog & Consistency-Pass Plan

**Created:** 2026-06-20 (during the PGcode→PGHub rename). Captures every issue from the live review so the 20–25 QA passes run systematically. **Repo is now at `/Users/pushkalgupta/Desktop/WebDev/PGHub`** — all agents/commands MUST `cd` there first (the old `/PGcode/` path is empty).

## Standing context (do not re-break)
- Folder + URL renamed **PGcode → PGHub** (`/PGHub/dist/index.html`). DB tables stay `PGcode_*` (schema names, NOT paths). Supabase Site URL + allowlist updated to include both `/PGHub/**` and `/PGcode/**` during transition. Vite `base:''` (relative assets) + HashRouter make share links survive.
- `#root` is `overflow:hidden` (theme.css) → **each route scrolls via its OWN container** (`height: calc(100vh-100px); overflow-y:auto`). `min-height`+`overflow:visible` CLIPS with no scroll — that's the recurring "unable to scroll" bug.
- HARD bars: theme tokens only (no hardcoded hex/rgb except neutral shadows + `rgba(var(--accent-rgb),x)`); lucide icons only, NO emoji/literal glyphs in SVG text; one-line reader-direct page intros (no pitch language); NO inner scrollbars beyond the route page-scroll; `--container-w` for centered wrappers.

## House style (the canonical spec every page must match)
- **Container:** `width:94%; max-width:var(--container-w); margin:0 auto; height:calc(100vh-100px); overflow-y:auto;` consistent vertical padding.
- **Header:** title + ONE short sub-line (12–25 w). Consistent title size/weight/font. Breadcrumb + consistent back-link where nested.
- **NO EMPTY SPACE:** content fills viewport; grids `repeat(auto-fit, minmax(...))`; no blank bottom band.
- **Cards:** ~14–16px radius, `var(--border)`, consistent padding, hover lift — match `.pgv-card` in `src/components/vault/PGVaultHub.css`.
- **Controls:** themed dropdowns everywhere (NO native `<select>`); consistent chips/pills/badges/buttons.
- **Tables:** dense house pattern from `ProblemList.css` / `compete/LcProblemsBrowser.css`.

---

## CONCRETE BUGS (fix first — verified from screenshots)
1. **Search not working** — the Practice/problem search returns nothing / doesn't filter. Check `ProblemList` search → `useProblemPage`/`pgcode_problem_page` RPC `p_search` path and the debounced input. (screenshot: practice search)
2. **Constraints shown twice** — a problem-detail page renders the Constraints block twice. De-duplicate. (Workspace / problem detail)
3. **Excess whitespace band** — a page has a large empty gap (NO EMPTY SPACE violation). Identify + fill/tighten.
4. **Logos invisible in dark mode** — dark monochrome brand logos (GitHub/Apple/X/etc.) disappear on dark themes. Fix in `src/components/common/BrandLogo.jsx`: render every logo on a subtle light chip canvas so it's legible in both themes; reduce missing-logo gaps (verified-live slugs only). Lots of missing logos on some grids.
5. **Context-aware back navigation** — ML Progress (and shared pages reachable from multiple hubs) must return to where the user CAME FROM: from PGVault → back to Vault; from PGForge → back to PGForge. Needs a `from` query param / nav-state on entry links, not a hardcoded crumb.
6. **PGForge Projects not built** — `/ml/projects` cards link nowhere. Add `/ml/projects/:slug` detail (mirror `PGForgeStudyPlanDetail`); data drafted in old tree as `pgForgeProjectsData.js` (10 projects: overview, what-you-build, skills, build steps, starter snippet) — re-create against PGHub.
7. **Back-nav render glitch (ML lessons)** — MLLesson `VizBlock` gates viz behind an IntersectionObserver (`visible` init false); on back-nav with restored scroll, off-screen viz stay as "Loading visualization…". Fix: mount-once, or scroll-to-top on `lessonSlug` change.
8. **Duplicated content under two headings** — found one (rlhf lesson: `RLHFPipelineViz` repeated the prose heading "The three-stage pipeline"); re-apply the `mlContent.js` heading removal against PGHub + re-scan for others.
9. **"How it works" disclosure** — where it's a dropdown at the END of a page, just render it open (drop the collapse gate).
10. **6 notifications, no panel** — a notification badge shows a count with nowhere to view them. Build a notifications panel OR remove the badge.
11. **Theme P2 (status/hue tints)** — ~14 sites use fixed RGB instead of tracking `--easy/--medium/--hard/--hue-*` (DryRun renderers + a few `learn/viz` CSS). Add `--easy-rgb`/`--medium-rgb`/`--hard-rgb` triples to theme.css, then `rgba(var(--X-rgb), a)`. (P1 cyan `rgba(0,255,245)`→`var(--accent-rgb)` already fixed, 11 sites.)
12. **Unique/sensible card visuals** — some card thumbnails repeat or don't match their content (PGForge/Foundations grids). Give distinct, on-topic previews.
13. **My Lists: add-problems-to-list** — make adding a problem to a custom list intuitive: a "Save to list" affordance on each problem row (pick-or-create popover) + an "Add problems" entry inside a list. (Rename/delete native popups → themed modals already DONE.)

## VAGUE — need the specific page/intent before acting (ask user)
- "Are you sure this is correct?" (×2) — which value/page?
- "What's the point of this page?" — which route? (give purpose or remove)
- "Fill data as needed" / "fix UI" / "childish UI" / "make professional" — which page + what's broken?

---

## The 20–25 consistency passes (run after limit reset, all in `/PGHub/`)
Partitioned so agents own disjoint files (no collisions). Each: audit → FIX in place → `eslint`+`build` clean → report.

**Area consistency passes (5):**
1. Learn (LearningHub, ConceptPage, VisualizeIndex, Courses, DsaTutorial, QuizIndex)
2. Vault (PGVaultHub, MyLists, Notebook, ReviewQueue, ProgressDashboard, Achievements, Assessments)
3. Compete (CompeteHub, LcHub, LcProblemsBrowser, LcContestList, LeetCodeProfile, launch sections, gsoc/kaggle/leetcode/resources)
4. Contests (ContestsIndex, ContestDetail, ExternalContestsCalendar, LeetCodeAnalytics)
5. ML/PGForge (MLHub, MLPillar, MLLesson, MLGroup, all PGForge* pages)

**Cross-cutting passes (6):**
6. Chrome (Navbar, SubNav, MobileBottomNav, modals) — consistency + stale "PGcode" user-facing labels → "PGHub"
7. Page-header + one-line-intro normalization (every route)
8. Empty-space audit (every route fills viewport)
9. Native `<select>` → themed dropdown sweep (whole app)
10. Hardcoded-color sweep (theme P2 + any new)
11. Card/button/chip style unification

**Bug-fix passes (7):** items 1–13 above (search, constraints×2, whitespace, logos dark-mode, context back-nav, projects detail, back-nav glitch, dup headings, how-it-works, notifications, theme P2, card visuals, add-to-list).

**Verification passes (3–4):**
- Triple-review each batch (correctness + house-style bar).
- `node scripts/verify.js` (17 checks) after each wave.
- Full theme audit across all 8 palettes (static hardcoded-color check — last run PASSED token completeness; ~14 P2 tints remain).
- Final build-green + lint-0 across the whole app.

---

## PASS 1 — APPLIED (2026-06-20, 9-agent area wave, build green + lint 0)

Disjoint-file fleet; each agent audited → fixed in place → eslint+build clean. Documented so these never silently regress.

**Real bugs fixed (not just style):**
- **Search not working (#1)** — root cause was the `pgcode_problem_page` RPC: number-bucket paging stayed active during a search, dropping matches outside the current number range. Fix in `scripts/migrate-58-search-number-bucket-fix.sql` — bucket paging only when `p_sort='number'` AND no search; with a search it position-pages the matched set and returns `maxNumber:0` (client `numberMode` auto-flips off, no client change). **STILL NEEDS CENTRAL DB APPLY** (see below).
- **Constraints shown twice (#2)** — `Workspace.jsx`: LC-imported rows bake `Constraints:` into description HTML AND the dedicated `.ws-constraints` block rendered it again. Added `descHasConstraints` regex gate (`!descHasConstraints &&`). Curated problems still show the dedicated block.
- **CSS class collision** — `LeetCodeProfile` shared 7 `.lcp-*` names with `LcProblemsBrowser` (different rules, same names → load-order corruption). Re-namespaced to `.lpf-*` (358 refs). Collision-free now.
- **Scroll-clip bug** — `Companies.css` used `min-height:calc(100vh-104px)` (clips against `#root overflow:hidden`) → `height:calc(100vh-100px)`.
- **Back-nav viz glitch (#7)** — `MLLesson.jsx`: added `scrollRef` + `useEffect([lessonSlug,pillarSlug])` scroll-to-top so off-screen `VizBlock` IntersectionObservers re-fire (no more stuck "Loading visualization…").
- **Context-aware back-nav (#5, partial)** — `MLLesson/MLPillar/MLGroup`: `resolveFrom(?from=)` → vault/forge/default crumb target+label; `location.search` threaded through internal links. **Remaining:** `PGVaultHub.jsx:45` "ML Progress" card → `/ml/progress` (routes to `PGForgeProgress.jsx`, NOT MLLesson) needs `?from=vault` + the context-back applied in `PGForgeProgress.jsx`.
- **How-it-works disclosure (#9)** — `LeetCodeAnalytics.jsx`: dropped the collapse gate; renders open under `.lca-section-title`. Removed dead `showMath`/`ChevronDown`.

**Consistency/style fixes:**
- Uniform card heights (CTA pinned `margin-top:auto`, `grid-auto-rows:1fr`/`stretch`): Vault, Learn (`viz-cat/member/result-grid`), CompeteHub, Companies (`.comp-card`), Roadmaps (`.rmx-card`), all PGForge grids, PGForgeProjects, ConferencesSection.
- Hardcoded color → token: Courses/DsaTutorial callout tints → `color-mix`; SettingsModal (4 rgb + added missing `.error` style), LoginModal hover → `color-mix(var(--hard))`; Math card border/bg → house `--border`/`--surface`.
- One-line-intro rule: RoadmapsIndex pitch intro trimmed; Gsoc/Kaggle/LcLlmBenchmark stats-triple headers removed (+dead useMemos/CSS); ExternalContestsCalendar builder-voice empty state rewritten.
- Modal parity: LoginModal + SettingsModal got Escape-to-close (matching CommandPalette).
- Breadcrumbs unified: all PGForge bespoke `forge-*-crumb*` → canonical `forge-crumb`.
- PGForgeProgress dashboard rows `auto auto 1fr` → fills viewport, no empty band.

**STILL OPEN after Pass 1 (carry to later passes):**
- migrate-58 DB apply (search fix is code-complete, DB not yet patched).
- Logos dark-mode (#4 BrandLogo light-chip) — re-dispatched.
- Projects detail route (#6) — verify PGForgeProjects cards link to a real `/ml/projects/:slug`.
- Dup headings re-scan (#8), notifications panel (#10), theme P2 triples (#11), card visuals (#12), My-Lists add-to-list (#13).

---

## HARD RULES added from live review (never re-break)
- **Architecture / model diagrams are VERTICAL ONLY** — top-to-bottom block flow, never left-to-right. Flagged by the user multiple times ("how many times do you need to be told"). Canonical impl: `ArchitectureDiagram.jsx`. Offenders were the bespoke horizontal `PaperDiagram` SVGs in `PGForgePapers.jsx`. Full rule now in CLAUDE.md ("Architecture / model diagrams are VERTICAL ONLY"). Scatter/PCA/SVD/heatmap math figures are exempt (not architecture).

## PASS 2 — feedback batch 2026-06-20 (papers + diagrams + problem animation)
1. **Papers steps do nothing** — `/papers` (PGForgePapers) steps only highlight an arch block; clicking "Tokenization" leads nowhere meaningful. TensorTonic decomposes each paper into an implement-it experience with theory + an interactive widget + description. FIX: each step needs a real **description/explanation** rendered in the detail panel (expand the active step into a theory paragraph + code), and where a matching PGForge problem exists, link the step to it. Not just a one-line `detail`.
2. **Architecture diagram flow animation** — animate `ArchitectureDiagram` to show data flowing DOWN the vertical stack (a pulse traveling the trunk edges + sequential block activation). Respect `prefers-reduced-motion`.
3. **ML problem animations need major professional work** — the 200+ `ml/viz/*` components (esp. the attention/transformer/tokenization family: AttentionStepViz, AttentionHeatmapViz, multi-head, BPETokenizerViz) must hit TensorTonic-grade animated polish — smooth transitions, staged reveals, professional motion, live readouts. Currently many are static/rough.
4. **Horizontal→vertical sweep** — rebuild the bespoke `PaperDiagram` SVGs (Transformer/Resnet/Seq2Seq/Vae/Diffusion/Vit/Clip/Rlhf/Flow) vertical, OR give every paper `pgForgeArchData` so the vertical `ArchitectureDiagram` renders instead.

## SOLUTIONS BACKFILL (audited 2026-06-20 via `scripts/audit-solutions.mjs`)
User: "solutions are completely shit, all the solutions [must] be there properly." Audit of 3,848 problems:
- All four langs real & non-stub: **93.7%** (3,606). Python 95.4% real, JS/Java/C++ 93.8% real. No copy-pasted-python smell.
- **ZERO solutions: 174 (4.5%)** · tests-but-no-usable-python: 177 · python stubs: 3.
- Gap concentrated in **Easy** (89% complete) then Medium; many are famous problems (Number of Islands, Merge Intervals, Unique Paths, K Closest Points) → their solution pages render empty, hence "shit".
- **242 actionable targets** (zero-solution OR missing/stub any lang OR tests-but-no-py) dumped to `scripts/solutions-backfill-targets.json` (each: id, name, difficulty, missingLangs, tests, pyReal).
- NOTE: audit checks PRESENCE + non-stub, NOT correctness. "Shit" may also mean present-but-WRONG → needs a Judge0 grading sweep over existing solutions too.

**Backfill plan (run when agent dispatch unblocks — session limit reset 3:50pm IST 2026-06-20):**
1. For each target: ensure a correct Python canonical (generate if missing; must compile + pass the problem's test_cases via Judge0 / the existing `grade-submission` path).
2. Derive JS/Java/C++ from the verified Python with the right method signature (NOT a python copy) — grade each against the same cases.
3. Re-run `audit-solutions.mjs` to confirm zero-solution → 0 and all-four-real climbs toward 100%.
4. Separately: a correctness sweep grading the existing 3,606 "complete" sets to catch present-but-wrong solutions.
Partition the 242 across agents by difficulty/topic (disjoint id ranges), each generating+grading its slice, central re-audit after.

## DONE 2026-06-21 (direct): company logos rendering blank ("logo not coming")
Featured company cards (Google/Meta/Amazon/Microsoft/Apple/Netflix...) showed blank — slugs matched the `COMPANY_LOGOS` map and the CDN SVGs resolve 200 with brand colors, so the bug was render-side: a stalled/blocked CDN `<img>` fires NO `error` event, so the old monogram fallback never triggered → blank box. Rewrote `BrandLogo.jsx`/`.css`: the themed **monogram is now the always-present base layer**, the brand SVG is an overlay that `opacity:0 → 1` only `onLoad`, plus a 6s timeout → monogram if it stalls. Blank tile now impossible (online: logo wins; offline/slow: monogram shows). Build green.

## DONE 2026-06-20 (direct, no-agent): problem-page visuals were too big
`.viz-stage` was capped at 52vh (half viewport) so AlgoVisualizer ballooned on every problem/solution page. Added a `.viz-compact` modifier (`max-height:320px`, tighter padding/fonts) in `AlgoVisualizer.css`; `ProblemVisualizer.jsx` now wraps its AlgoVisualizer in `viz-compact` (padding 1rem→0.5rem). Scoped so the standalone `/visualize` explorer is untouched. Graph/tree renderers use `preserveAspectRatio="xMidYMid meet"` (scale-to-fit, no clip); array bars are short HTML rows. Build green.

## Parallel (non-UI) lane
- **Test-case grow drive** — relaunch from `/PGHub/`: `node scripts/bulk-grow-test-cases.js --max 250 --target 50 --resume`. ~103 problems grown, ~2000+ cases added; ~99% of problems are growable (only ~1.3% SQL/async excluded). Judge0 free-tier rate-limits it — a dedicated Judge0 key is the real accelerator.
