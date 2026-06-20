# Plan — EntrantHub features + VisuAlgo visualization overhaul

Status: in progress (started 2026-06-14). This is the single source of truth for two big workstreams the user requested. **The external sites (entranthub.com, visualgo.net) are references to MATCH and then REMOVE — never link to or credit them in shipped copy.** Reimplement features in PGcode's own style/voice; original visualizations only.

## Source material (study, replicate, do NOT cite)

- EntrantHub — `https://entranthub.com`, repo `https://github.com/baoliay2008/EntrantHub` (Scala/Pekko **backend only** — we reimplement features in React/Supabase, not port Scala).
- VisuAlgo — `https://visualgo.net/en`, list repo `https://github.com/yulonglong/VisuAlgo-List` (the gallery layout + the full DS/algo coverage list).

---

## Workstream 1 — VisuAlgo-style Visualize hub overhaul (HIGH priority — user screenshot)

The user wants `/visualize` to look like VisuAlgo's gallery: a grid of **colorful category cards**, each with a small animated SVG preview of the structure + tags (e.g. "interactive", difficulty), grouped by category. "Complete overhaul required."

Target categories (VisuAlgo's full set — map each to our existing viz where one exists, build the rest):
Array · Sorting · Bitmask · Linked List / Stack / Queue / Deque · Binary Heap · Hash Table · Binary Search Tree / AVL · Graph Structures · Union-Find DSU · Fenwick (BIT) · Segment Tree · Recursion Tree/DAG · Graph Traversal (BFS/DFS) · Minimum Spanning Tree (Prim/Kruskal) · Single-Source Shortest Paths (BFS/Dijkstra/Bellman-Ford) · Cycle Finding (Floyd) · Suffix Tree · Suffix Array · Geometry/Polygon · Convex Hull · Network Flow (Edmonds-Karp/Dinic) · Graph Matching · Min Vertex Cover · Steiner Tree · TSP.

We ALREADY have 24+ interactive viz (see `src/components/learn/interactiveViz.js`, `conceptVisualizations.js`, `interactiveTemplates.js`) — sorting, BST, AVL rotations, heap, hash, union-find, Fenwick, segment-tree, graph traversal, MST, shortest-paths, bitmask power-set, bloom filter, etc. The overhaul **groups + showcases** these as a gallery; missing categories (suffix tree/array, network flow, convex hull, geometry, graph matching beyond Kuhn, min vertex cover, Steiner, TSP) become new viz built by the ongoing [concept-viz wave drive](./llm-wiki/concept-viz-drive — see memory).

Deliverable: redesign `VisualizeIndex.jsx` + its `Learn.css` section into the gallery (category cards, mini-SVG previews, tags, one-line category blurbs, category → detail). Keep every existing `/visualize/:slug` route working.

## Workstream 2 — Contest aggregation (EntrantHub: unified contest hub)

EntrantHub aggregates programming contests from **LeetCode, Codeforces, AtCoder, CodeChef** (+ DevPost hackathons, Kaggle competitions, GSoC) into one calendar with filters, plus **LeetCode contest analytics** (rankings, question statistics, **rating predictions**).

Bring into `/contests` (we already have `ContestsIndex` + `ContestDetail` + `useContests`):

1. **Unified upcoming/past contest calendar** across the 4 judges + hackathons (DevPost) + Kaggle + GSoC. Per-platform filter chips, countdown timers, "add to calendar".
2. **LeetCode contest analytics**: per-contest rankings, per-question solve stats, and a **rating-prediction** model (predict rating delta from rank using the Elo-style LC formula) with an explainer.
3. Data: a new `PGcode_external_contests` table (migration NN) + a Supabase Edge Function `fetch-contests` that pulls each platform's public API on a schedule (clist.by-style, or each judge's contest API). Seed with sample data first; live fetch second.

Keep PGcode's own ICPC-style internal contests too — add a tab split: "Live problem sets" (ours) vs "Upcoming everywhere" (aggregated).

## Workstream 3 — Group pages for Companies & Concepts (new-tab grouping)

User: "like for companies and concepts can be grouped, so that opens up a new tab." Mirror the existing **MLGroup** pattern (`/ml/g/:groupSlug` → `MLGroup.jsx`):

- Companies grouped (FAANG, unicorns, fintech, by-region, by-hire-bar…) → `/companies/g/:groupSlug`.
- Concepts grouped (by module: arrays, graphs, dp, strings, system-design…) → `/concepts/g/:groupSlug` or a grouped Concepts hub.
  Each group is its own landing page/tab. Add to SubNav grouping where natural; keep the locked SubNav order otherwise.

---

## How we run it (manager mode — parallel background agents)

- Each agent owns DISJOINT component files; agents do NOT edit shared collision files (`App.jsx`, `SubNav.jsx`, `lib/queries.js`). They report the exact route/nav/hook lines; the orchestrator integrates those centrally (mirrors the concept-viz wave pattern that worked).
- After each batch: `npm run build`, then mandatory **triple-review** (Reviewer A correctness/render, Reviewer B quality-bar: theme tokens only, no emoji, no inner scrollbars, lucide only, reader-direct voice, no external-site references).
- Schema changes via numbered `scripts/migrate-NN-*.sql` (idempotent); reads/writes through `lib/queries.js` `qk.*`.

## Hard constraints (carry into every agent prompt)

- Reimplement in PGcode style; **no emoji, theme tokens only, no inner scrollbars, lucide icons**.
- **Remove every reference/credit to entranthub.com and visualgo.net** from shipped copy. They are scaffolding, not attributions.
- Reader-direct voice, one-line page intros (per CLAUDE.md). Original visualizations only.

## Progress log

- 2026-06-14: plan written; studied both repos (EntrantHub = Scala backend, VisuAlgo-List = static gallery + full coverage list). Mapped existing `VisualizeIndex`, `ContestsIndex`, `MLGroup` grouping pattern. Dispatching first agent wave.
