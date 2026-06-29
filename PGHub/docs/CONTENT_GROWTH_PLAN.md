# Content Growth Plan — "The world's learning hub"

**North star (user, 2026-06-25):** every course/topic worth learning lives here, in PGHub's own
voice, with beautiful **interactive visuals + animations** next to the prose. Match the *coverage*
of NeetCode + GeeksforGeeks + Khan Academy (and beyond) — **never copied**. Original writing,
original SVG/MANIM-style/interactive viz. The wedge (CLAUDE.md thesis): every concept is
*interactive · visual · intuitive*, not a wall of text.

## HARD constraints (non-negotiable)
- **Copyright:** NEVER reproduce GfG/NeetCode/Khan/3B1B text, images, or problem statements
  verbatim. Cover the same *topics*; write original explanations + build original viz. Reference
  external resources by precise, verified URL only (CLAUDE.md "verify resources before linking").
- **Quality bars (CLAUDE.md):** concepts hit the 13-section template (intuition ≥200w, optimal
  ≥200w, ≥8-line ASCII or a real viz, 4-language code, ≥4 pitfalls); course lessons 350w+ theory +
  worked example + exercise + common-mistake. Every learning page is interactive + visual + intuitive.
- **Every new lesson ships with a registered interactive viz** (no text-only pages).
- **No inner scrollbars; vertical architecture diagrams; theme tokens; lucide only; no emoji.**
- Build green + `eslint .` 0 + triple-review after every wave. `node scripts/verify.js` before "shippable".

## Current baseline (2026-06-25)
- 486 concepts (`content/concepts/*.md`) — DSA, system-design, CS-core, thin math.
- Courses (`src/content/courses.js`), DSA tutorial (`dsaTutorial.js`), ML (`mlContent.js`),
  SQL (`sqlCourses.js`), quizzes (`quizzes.js`). Deep problem catalog (4544 problems).
- Viz: `interactiveViz.js` (INTERACTIVE_VIZ) + `viz/*.jsx`; `conceptVisualizations.js` (frames);
  ML `MLLesson.jsx` VIZ_REGISTRY + `ml/viz/*`. Concept-viz coverage = 100% (486/486).

## Pipeline (authoring → live)
1. Author `content/concepts/<slug>.md` (13-section template + frontmatter).
2. Build a viz `src/components/learn/viz/<Name>Viz.jsx` (+ css); register slug in `interactiveViz.js`
   (orchestrator registers centrally — agents never edit the registry).
3. `node scripts/import-concepts.js --dry` then without `--dry` (needs VITE_SUPABASE_URL +
   SUPABASE_SERVICE_ROLE_KEY in `.env`).
4. `npm run build` + `eslint .` + triple-review. Courses go through `src/content/courses.js` + push.

## Tracks (each a curriculum area; grown in waves of 10–15 lessons)

| # | Track | Scope (original, same coverage as) | Viz emphasis |
|---|-------|-----------------------------------|--------------|
| T1 | **Math foundations** | Khan: algebra, functions, trig, precalc, **calculus** (limits/derivatives/integrals), **linear algebra**, **probability & statistics**, discrete math | draggable graphs, Riemann sums, vector fields, distributions, unit circle |
| T2 | **CS core** | GfG: **OS** (processes, scheduling, memory, FS), **DBMS** (relational, indexing, txns, normalization), **Computer Networks** (OSI, TCP/IP, routing), **OOP & design patterns**, **Compilers/TOC** | state machines, packet flows, scheduler gantt, B-tree ops |
| T3 | **Language courses** | Python, C++, Java, JavaScript/TS, Go, Rust, SQL(have) — syntax → idioms → projects | runnable code (RunnableCodePanel), memory/stack viz |
| T4 | **ML / DL depth** | the MNIST example: forward/backprop playground, CNN feature maps, optimizers, transformers, RL | live neural-net training viz, loss landscapes, attention |
| T5 | **DSA completeness** | NeetCode/GfG patterns not yet covered; richer editorials | existing AlgoVisualizer + new interactive viz |
| T6 | **Web / systems build** | HTML/CSS/JS, React, HTTP/APIs, databases-in-practice, deployment | DOM/render-pipeline, request lifecycle |

## Scrum cadence & timeline (from 2026-06-25)
Operate as **manager agent**: each wave = parallel sub-agents (1 lesson or viz per agent) →
orchestrator central-registers + imports → 2 review agents (accuracy + quality bar) → fix → build →
next wave. Never idle; on rate-limit/token-out, **retry after a cooldown** and resume (state below).

- **Sprint 1 (Jun 25 – Jul 02): T1 Math foundations** — calculus + linear algebra + probability
  (≈45 lessons, 3–4 waves). Highest viz leverage; underpins ML.
- **Sprint 2 (Jul 02 – Jul 09): T4 ML/DL depth** — MNIST playground, backprop, CNN, optimizers.
- **Sprint 3 (Jul 09 – Jul 16): T2 CS core** — OS + DBMS + Networks.
- **Sprint 4 (Jul 16 – Jul 23): T3 Language courses** — Python + C++ + JS, runnable.
- **Sprint 5 (Jul 23 – Jul 30): T6 Web/build + T5 DSA gaps.**
- Rolling: viz-polish (colorful-by-value upgrade), triple-review, verify-prune.

## Live wave state (update each wave)
- **Next:** Sprint 2 — T4 ML/DL depth (CNN feature maps, optimizer comparison, transformer attention,
  RL gridworld) building on the MNIST viz. Then T2 CS core (OS/DBMS/Networks).

## Waves 12-14 — SHIPPED (2026-06-29): T3 Languages expand
- **Wave 12** Python depth (4): classes/OOP, modules/imports, errors/exceptions, iterators/generators + viz.
- **Wave 13** C++ course (4): types, pointers/references, memory/RAII, STL + viz. All code compiles+runs.
- **Wave 14** JavaScript course (4): scoping/hoisting, closures/this, async/event-loop, prototypes + viz.
- **547 concepts live.** eslint 0, build green.
- **NOTEBOOK STATE BUG FIXED:** PGForge project notebook cells now ACCUMULATE prior cells' live code
  (real Jupyter top-to-bottom state) — cell 2 can use names from cell 1 (was NameError). Plus a clear
  "depends on a name from an earlier cell" hint. `RunnableCodePanel.getRunPrefix` + `NotebookCells`
  per-cell refs reading `getCode()`. Verified live: cell 2 prints closed-form slope/bias, no NameError.

## Waves 10-11 — SHIPPED (2026-06-29): T2 done + T3 started
- **Wave 10** Computer Networks module (4): OSI/TCP-IP layers, TCP reliability, IP routing, DNS/HTTP + viz.
  → **T2 CS-core trio complete** (Databases + OS + Networks).
- **Wave 11** Python language course (4): variables/types, control flow, functions/scope, data structures
  + interactive viz. Language-course code VERIFIED runnable (py-variables-types prints correct output).
- **535 concepts live.** eslint 0, build green, no crashes verified.

## Waves 7-9 — SHIPPED (2026-06-27/28)
- **Wave 7** Statistics depth (4): hypothesis testing, linear regression, A/B testing, MLE + animated viz.
- **Wave 8** Databases module (4): relational/SQL, B-tree indexing, ACID transactions, normalization + viz.
- **Wave 9** Operating Systems module (4): processes/threads, CPU scheduling, virtual memory, deadlocks + viz.
- **527 concepts live.** All viz fit-on-screen (SVG capped + readouts compacted: kl-divergence 1018→820px).
- **PGForge projects → multi-cell Jupyter notebooks** (all 10; markdown + runnable pure-Python cells).
- eslint 0, build green; verified no crashes across all new routes.

## Wave 5-6 — SHIPPED (2026-06-27): MANIM-style animations + ML depth
- **Wave 5** Calculus animations (4): Taylor series, Fourier series, parametric curves, vector fields —
  each an auto-playing rAF MANIM-style viz (Play/Pause + scrub, prefers-reduced-motion).
- **Wave 6** Neural Networks depth (3): optimizers (SGD/Momentum/Adam race), RNN unrolling, RL gridworld
  — each animated. **515 concepts live**, 7 viz registered, eslint 0, build green.
- **llm-wiki filled**: 5 new pages (content-growth-pipeline, live-notebook, manim-style-animation,
  contest-seeding, adding-a-learn-module) + index/README/scrollbar/viz-patterns refreshed.
- **PGArena 38 contests** (+20 batch-3).
- **DEPLOY NOTE:** `dist/` is git-tracked + served at pushkalgupta.com/PGHub/dist/. Rebuilt fresh;
  must be committed + pushed to go live (user runs commits). Production build verified to contain the
  live notebook + all fixes.

## Sprint 1 (Math foundations) — COMPLETE + verified (2026-06-25)
3 new modules, 16 lessons, 16 interactive viz, all imported live (502 concepts) + render-verified:
- **Calculus** (7): limits, derivative-as-slope, chain rule, integral-as-area, FTC, optimization, related rates.
- **Linear Algebra** (4): vectors/span, matrix-as-transform, determinant-as-area, eigenvectors (λ verified).
- **Probability & Statistics** (5): random variables, distributions, expectation/variance, Bayes, CLT.
- Plus **MnistNetViz** (T4 seed) in the backprop lesson. eslint 0, build green throughout.

## Wave 3 — SHIPPED + verified (Probability & Statistics) — see Sprint 1 summary above.

## Wave 2 — SHIPPED + verified (2026-06-25)
- **Linear Algebra** module + 4 lessons (la-vectors-spaces, la-matrix-as-transformation, la-determinant,
  la-eigenvectors) + 4 viz (span/transform/determinant-area/eigenvectors). Eigenvector viz verified
  mathematically correct (det [[2,1],[1,2]] → λ=3,1).
- **Calculus depth** +3 lessons (calc-fundamental-theorem, calc-optimization, calc-related-rates) + 3 viz.
- 497 concepts live, eslint 0, build green, renders clean.

## Done log
- **2026-06-25 — Wave 1 SHIPPED + verified (T1 Calculus + T4 MNIST):**
  - New **Calculus** module (migrate-62 / upserted to `PGcode_modules`). 4 original lessons imported
    live (490 concepts total): `calc-limits-continuity`, `calc-derivative-as-slope`, `calc-chain-rule`,
    `calc-integral-as-area` — each 13-section, KaTeX math, 4-lang numerical code, 3B1B references.
  - 4 interactive viz built + registered in `interactiveViz.js`: CalcLimitViz (ε–δ drag),
    CalcDerivativeSlopeViz (secant→tangent), CalcChainRuleViz (rate propagation), CalcRiemannViz
    (N-rectangle convergence). Verified rendering (derivative lesson: glowing curve + draggable point
    + tangent/secant + stat cards + prereq link).
  - **MnistNetViz** (user's flagship example): drawable 8×8 grid → real forward pass (64→16 ReLU→10
    softmax, deterministic demo weights) → vertical network with activation glow + softmax bars +
    prediction/confidence/params. Registered in MLLesson VIZ_REGISTRY, hosted in the `backprop` lesson.
    Verified rendering.
  - eslint 0, `npm run build` green, dev renders clean. (Note: clear `node_modules/.vite` between
    many dev-server restarts — stale dep cache throws phantom "X is not defined" runtime errors.)
