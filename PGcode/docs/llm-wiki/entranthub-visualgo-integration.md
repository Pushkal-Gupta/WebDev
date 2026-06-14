# entranthub-visualgo-integration

Two large feature workstreams the user asked for (2026-06-14). Full plan: [`../PLAN_ENTRANTHUB_VISUALGO.md`](../PLAN_ENTRANTHUB_VISUALGO.md). This page is the quick "what + where" for an agent picking it up.

## The one rule that bites
**entranthub.com and visualgo.net are reference scaffolding to MATCH then DELETE.** Never link to them, credit them, or leave "inspired by VisuAlgo" in shipped copy. Reimplement features + build ORIGINAL visualizations in PGcode's own voice/style. The user explicitly said "remove the references to both of these websites from everywhere."

## What to build (3 workstreams)
1. **VisuAlgo-style `/visualize` overhaul** — turn `src/components/learn/VisualizeIndex.jsx` into a gallery of colorful category cards (each with a small animated SVG preview + tags), grouped by category. We already have 24+ interactive viz registered in `interactiveViz.js` / `conceptVisualizations.js` / `interactiveTemplates.js` — group + showcase them; build the missing VisuAlgo categories (suffix tree/array, network flow, convex hull, geometry, graph matching, min vertex cover, Steiner, TSP) via the concept-viz wave drive.
2. **Contest aggregation (`/contests`)** — unified upcoming/past calendar across LeetCode/Codeforces/AtCoder/CodeChef + DevPost/Kaggle/GSoC, with per-platform filters + countdowns, PLUS LeetCode contest analytics (rankings, question stats, **rating prediction** via the Elo-style LC delta formula). New `PGcode_external_contests` table + `fetch-contests` edge function. Keep our internal ICPC-style contests as a separate tab.
3. **Group pages for Companies & Concepts** — mirror the working `MLGroup` pattern (`/ml/g/:groupSlug`): `/companies/g/:slug`, grouped concepts hub. Each group is its own tab/page.

## Navigation + data-presentation refinements (user, 2026-06-14 PM)
- **VisuAlgo gallery is a DRILL-DOWN, not inline expand.** `/visualize` shows category cards → clicking a category ROUTES to a dedicated module page (`/visualize/c/:category`) showing submodule/viz cards (e.g. Sorting → bubble sort, merge sort, quicksort…) → clicking one opens the individual viz page (`/visualize/:slug`) with the interactive viz + the editable-code panel. Do NOT expand the viz list inline beneath the category card. Each level is its own routed page (mirror the MLHub→MLGroup→MLPillar→MLLesson drill-down).
- **Editable code everywhere it applies.** The `/visualize/:slug` detail must surface the InteractiveVisualizer code editor (the "Advanced — edit & run" panel) for any slug with an INTERACTIVE_TEMPLATES entry (resolve directly OR via STATIC_TO_INTERACTIVE).
- **Present lc-user data VISUALLY (QuestCode-grade).** The `lc-user` edge function is deployed + live. The Compete profile/compare must render the rich data as CHARTS, coherent with the rest of the app: submission stats, questions-by-difficulty bars, beats%, rating timeline (line), win/loss + total-contest pies, rating min/cur/max bars, a per-contest rating table, question-type/tag bars. Two-profile compare overlays both. Lots of original SVG charts, theme-token-colored, well-designed — not text dumps.

## How (manager pattern, proven by the concept-viz waves)
- Agents own DISJOINT component files; they do NOT touch `App.jsx`, `SubNav.jsx`, `lib/queries.js` (collision points) — they report the route/nav/hook lines, orchestrator integrates centrally.
- `npm run build` + triple-review (A: correctness/render; B: quality-bar incl. "no external-site references") after each batch.
- EntrantHub repo is Scala/Pekko backend-only — reimplement features, don't port. VisuAlgo-List is a static gallery — copy the LAYOUT idea, not assets.

---
*Last updated: 2026-06-14.*
