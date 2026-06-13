-- Concept import chunk 3/4 (build-graph-vite-vs-webpack, rsc-vs-ssr-vs-csr, react-fiber-reconciler).
DO $do$
DECLARE
  r record;
  lines text[];
  ln text;
  cl text;
  cur_name text;
  cur_lines text[];
  cleaned text;
  sections jsonb;
  codes jsonb;
  obj jsonb;
  arr jsonb;
  km text[];
  in_fence boolean;
  fence_done boolean;
  code_lines text[];
  lang text;
BEGIN
FOR r IN
SELECT * FROM (VALUES
(
  'build-graph-vite-vs-webpack', 'cs-tools-encodings',
  $tt$Module Graphs — Vite vs Webpack$tt$,
  $tt$Why one bundler crawls your whole dependency graph before serving a byte and the other serves instantly — and what that means for HMR and code splitting.$tt$,
  'Advanced', 84, 11,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$Vite docs — Why Vite (bundle-based vs native-ESM dev server)$rf$, 'url', 'https://vite.dev/guide/why.html', 'type', 'docs'),
      jsonb_build_object('title', $rf$webpack docs — Concepts: entry, module graph, chunks$rf$, 'url', 'https://webpack.js.org/concepts/', 'type', 'docs'),
      jsonb_build_object('title', $rf$Vite docs — HMR API (accept boundaries, propagation)$rf$, 'url', 'https://vite.dev/guide/api-hmr.html', 'type', 'docs'),
      jsonb_build_object('title', $rf$webpack docs — SplitChunksPlugin (chunk graph and cache groups)$rf$, 'url', 'https://webpack.js.org/plugins/split-chunks-plugin/', 'type', 'docs')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
Every bundler's core job is the same graph problem: start at entry files, parse out `import` statements, and recursively resolve them into a **module graph** — nodes are files, edges are imports. Webpack walks that entire graph, transforms every node, and emits bundles *before* anything runs. Vite serves source files as native ES modules in dev — the browser itself walks the graph — and only builds the full bundle (via Rollup) for production. That one architectural difference explains cold-start times, HMR behavior, and chunking strategy.

## whyItMatters
Dev-server startup and hot-reload latency are the feedback loop you live in all day; a 90-second webpack cold start versus a 300ms Vite start is the difference between flow and context-switching. The module graph is also where production performance is decided: chunk boundaries determine what users download on first paint, what's cached across deploys, and whether a one-line change invalidates your whole bundle. And it's a genuinely good interview topic — "why is Vite fast?" filters out people who say "it's newer" from people who can explain that the graph traversal moved from the bundler to the browser.

## intuition
Think of your codebase as a directed graph: `main.jsx` imports `App.jsx`, which imports `Router.jsx` and `theme.css`, and so on down to `node_modules`. A real app's graph has thousands of nodes, and most of them — the `node_modules` subgraph — almost never change.

**Webpack's bet (2012, pre-ESM browsers):** browsers can't load module graphs, so the bundler must do everything. On startup it crawls the *entire* graph from the entries: parse every file, run loaders (Babel, Sass), build the graph in memory, then serialize it into a few bundle files with a runtime that emulates module semantics. Cost of dev startup is O(whole graph) — even the 2000 transitive dependencies of your UI library get parsed before you see a pixel. Every edit re-runs the affected part of this pipeline and pushes patched modules to the page.

**Vite's bet (native ESM era):** the browser *can* load module graphs now — `<script type="module">` follows imports natively. So in dev, don't bundle at all. Serve each source file as-is (transformed on demand, one file per request), and let the browser's module loader do the graph traversal. Startup cost is O(1) — nothing is crawled until requested — and the first page load only touches the modules that page actually imports. The unchanging `node_modules` subgraph is handled separately: **pre-bundled once with esbuild** (written in Go, 10–100x faster than JS-based bundlers) into single-file ESM modules, then cached until the lockfile changes. Two different graph problems — your volatile source versus stable dependencies — get two different strategies.

For production both converge: HTTP round-trips per module are too expensive at scale, so Vite hands the graph to Rollup for a full crawl-and-bundle, just like webpack.

## visualization
```
The same module graph, two dev-server strategies:

  entry main.jsx ─> App.jsx ─> Router.jsx ─> pages/* (lazy)
                      │            └──────> theme.css
                      └────────> react, react-dom   (node_modules)

  webpack dev                          vite dev
  ----------------------------------   -----------------------------------
  1. crawl ENTIRE graph from entry     1. start server immediately (~ms)
  2. transform every module            2. esbuild pre-bundles node_modules
  3. emit bundle + runtime in memory      once (cached until lockfile change)
  4. THEN server is ready              3. browser requests main.jsx
  cold start: O(all modules)           4. each import = one request,
                                          transformed on demand
  edit a file:                         cold start: O(modules on this page)
    rebuild module + invalidate         edit a file:
    chunk, HMR-push patch                 transform 1 file, HMR-push it;
                                          browser re-imports just that module

  HMR propagation (both): walk importers UP from the edited module
    edited.css -> Button.jsx [accepts CSS]            stop, swap in place
    util.js -> three importers, none accept -> reach root = full reload
```

## bruteForce
The naive mental model: "a bundler just concatenates my files, and Vite is the same thing but faster because it's newer." Concatenation can't handle module scope, circular imports, name collisions, or on-demand loading — bundlers build a real dependency graph, give each module its own scope and ID, and emit a runtime (or rely on the browser's) to wire imports to exports at load time. And Vite isn't a faster webpack; it's a different answer to *when* and *where* the graph gets walked. Miss that and HMR boundaries, chunk splitting, and the dev/prod behavior gap all stay mysterious.

## optimal
Three graph mechanisms are worth knowing precisely.

**Graph construction and the dev/prod split.** Webpack resolves every import (enhanced-resolve: extensions, aliases, `node_modules` lookup), runs loaders per module, and records dependencies until the graph closes — all up front, in JavaScript, every cold start (mitigated by filesystem caching). Vite defers construction: dev is lazy and browser-driven with esbuild handling only the dependency pre-bundle; `vite build` runs Rollup over the full graph with tree shaking. Consequence: dev and prod pipelines differ in Vite, so a handful of bugs (import order, circular-dependency timing) only surface in the production build — test builds matter.

**HMR boundaries.** When a file changes, neither tool reloads the page by default. The server pushes the updated module over a websocket, and the client runtime walks the *importer* chain upward looking for a module that **accepts** the update (`import.meta.hot.accept` in Vite, `module.hot.accept` in webpack). React components accept via Fast Refresh, preserving state; CSS modules swap in place. If the walk reaches the entry without finding an accepter, the runtime falls back to a full page reload. Because Vite's graph is per-module, its HMR update cost stays O(1) regardless of app size; webpack must also invalidate and rebuild the containing chunk.

**Code splitting.** Every dynamic `import()` is a **split point**: the subgraph reachable only through it becomes a separate chunk, loaded on demand — this is how route-level lazy loading works. Shared modules pose the interesting problem: if two lazy routes both import `lodash`, duplicating it bloats both chunks. Webpack's `SplitChunksPlugin` and Rollup's `manualChunks` both solve it by hoisting shared subgraphs into common chunks the runtime loads alongside whichever route needs them first — also the mechanism behind stable `vendor` chunks that survive app-code deploys in cache.

## complexity
time: webpack dev cold start O(V + E) over the full module graph; Vite dev O(modules the open page actually imports)
space: webpack holds the whole transformed graph in memory; Vite caches per-module transforms plus one esbuild dep pre-bundle
notes: Vite pays an O(deps) esbuild pre-bundling cost once, then caches it until the lockfile changes, so warm starts are near-instant. An HMR update is O(1) module transform plus an O(importer-chain) walk to the accepting boundary; webpack additionally re-emits the containing chunk. Production builds converge: both run a full O(V + E) crawl with tree shaking and minification, which dominates either pipeline.

## pitfalls
- **Importing a whole library to use one function.** `import _ from "lodash"` drags the entire subgraph into your chunk; CommonJS modules defeat tree shaking entirely. Use ESM builds (`lodash-es`) and named imports so the graph edge points at one export, not the package root.
- **Trusting Vite dev behavior to match the production build.** Dev is unbundled esbuild transforms; prod is Rollup. Import-order side effects, circular imports, and `default` interop can differ. Run `vite build && vite preview` before shipping anything subtle.
- **Accidental HMR full reloads.** Editing a module whose importer chain never accepts updates (a shared util imported by the entry, or a file that exports both a component and a constant — which breaks React Fast Refresh's component-only heuristic) silently degrades to full page reloads. Keep components in component-only files.
- **Barrel files (`index.js` re-exporting everything).** One import edge into the barrel pulls every re-exported module into the graph, inflating dev request counts in Vite and bundle size where tree shaking can't prove side-effect freedom. Import from concrete files, or mark packages `"sideEffects": false`.
- **Dynamic imports with fully dynamic paths.** `import(someVariable)` gives the bundler no static edge to follow — webpack bundles everything that might match; Vite needs a literal-ish glob pattern. Keep split points statically analyzable.

## interviewTips
- Answer "why is Vite faster in dev?" in graph terms: webpack walks the whole module graph before serving; Vite serves over native ESM so the browser walks the graph lazily, and the stable `node_modules` subgraph is pre-bundled once by esbuild. Three clauses, complete answer.
- Know what a split point is: every dynamic `import()` cuts the graph, and the subgraph reachable only through it becomes a lazily loaded chunk. Connect it to `React.lazy` route splitting and to vendor-chunk caching for the senior-level follow-up.
- Explain HMR as a graph walk, not magic: the changed module is pushed over a websocket, and the runtime climbs the importer chain to the nearest accepting boundary — or full-reloads if none exists. Mentioning why editing a shared constants file reloads the page proves you've debugged it.

## code.python
```python
# The core of every bundler: build the module graph, then chunk it.

import re
from collections import deque

IMPORT_RE = re.compile(r'import .*? from ["\'](.+?)["\']')

def build_module_graph(entry, read, resolve):
    """BFS from entry; nodes = files, edges = resolved imports."""
    graph = {}
    queue = deque([entry])
    while queue:
        mod = queue.popleft()
        if mod in graph:
            continue
        source = read(mod)
        deps = [resolve(spec, mod) for spec in IMPORT_RE.findall(source)]
        graph[mod] = deps
        queue.extend(deps)
    return graph              # webpack: walk ALL of this before serving
                              # vite dev: the browser does this walk lazily

def split_chunks(graph, entry, dynamic_edges):
    """Each dynamic import() cuts the graph into a separate chunk."""
    def reachable(start, blocked):
        seen, stack = set(), [start]
        while stack:
            m = stack.pop()
            if m in seen:
                continue
            seen.add(m)
            stack.extend(d for d in graph[m] if (m, d) not in blocked)
        return seen

    main = reachable(entry, blocked=dynamic_edges)
    chunks = {"main": main}
    for (_, target) in dynamic_edges:
        # modules ONLY reachable through the split point form the lazy chunk
        chunks[target] = reachable(target, dynamic_edges) - main
    return chunks
```

## code.javascript
```javascript
// Dev-server strategies over the same graph, plus the HMR boundary walk.

function buildGraph(entry, readSource, resolveImport) {
  const graph = new Map();                 // file -> [resolved deps]
  const queue = [entry];
  while (queue.length) {
    const mod = queue.shift();
    if (graph.has(mod)) continue;
    const deps = parseImports(readSource(mod))
      .map((spec) => resolveImport(spec, mod));
    graph.set(mod, deps);
    queue.push(...deps);
  }
  return graph;
}

// webpack dev: eager — full graph walk, transform, bundle, THEN serve
function webpackDevServer(entry) {
  const graph = buildGraph(entry, fs.read, resolve);   // O(all modules)
  const bundle = emitBundleWithRuntime(graph);
  return (req) => bundle;                              // one big artifact
}

// vite dev: lazy — serve per-module; the BROWSER walks the graph
function viteDevServer() {
  const prebundled = esbuildPrebundle("node_modules"); // once, then cached
  return (req) =>
    req.path.startsWith("/node_modules")
      ? prebundled.get(req.path)
      : transformOnDemand(fs.read(req.path));          // O(1) per request
}

// HMR: climb importers from the changed module to an accepting boundary
function propagateUpdate(changed, importersOf, accepts) {
  let frontier = [changed];
  const visited = new Set();
  while (frontier.length) {
    const next = [];
    for (const mod of frontier) {
      if (accepts(mod)) continue;            // boundary found: hot-swap, stop
      const parents = importersOf(mod);
      if (parents.length === 0) return "full-reload";  // reached the entry
      for (const p of parents) if (!visited.has(p)) {
        visited.add(p);
        next.push(p);
      }
    }
    frontier = next;
  }
  return "hot-swapped";
}
```

## code.java
```java
import java.util.*;
import java.util.function.Function;

class ModuleGraph {
    // file -> resolved imports; the structure both bundlers compute
    Map<String, List<String>> edges = new HashMap<>();
    Map<String, List<String>> importers = new HashMap<>();

    static ModuleGraph build(String entry,
                             Function<String, List<String>> depsOf) {
        ModuleGraph g = new ModuleGraph();
        Deque<String> queue = new ArrayDeque<>(List.of(entry));
        while (!queue.isEmpty()) {
            String mod = queue.poll();
            if (g.edges.containsKey(mod)) continue;
            List<String> deps = depsOf.apply(mod);   // parse + resolve imports
            g.edges.put(mod, deps);
            for (String d : deps) {
                g.importers.computeIfAbsent(d, k -> new ArrayList<>()).add(mod);
                queue.add(d);
            }
        }
        return g;   // webpack: built eagerly at startup
                    // vite dev: discovered request-by-request
    }

    // HMR: walk importers upward from the changed module
    String propagate(String changed, Set<String> acceptingModules) {
        Deque<String> queue = new ArrayDeque<>(List.of(changed));
        Set<String> seen = new HashSet<>();
        while (!queue.isEmpty()) {
            String mod = queue.poll();
            if (acceptingModules.contains(mod)) continue; // boundary: swap
            List<String> parents = importers.getOrDefault(mod, List.of());
            if (parents.isEmpty()) return "full-reload";  // hit the entry
            for (String p : parents) if (seen.add(p)) queue.add(p);
        }
        return "hot-swapped";
    }
}
```

## code.cpp
```cpp
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <functional>

// Module graph: nodes are files, edges are resolved imports.
struct ModuleGraph {
    std::unordered_map<std::string, std::vector<std::string>> edges;
    std::unordered_map<std::string, std::vector<std::string>> importers;
};

ModuleGraph buildGraph(
        const std::string& entry,
        const std::function<std::vector<std::string>(const std::string&)>& depsOf) {
    ModuleGraph g;
    std::queue<std::string> q;
    q.push(entry);
    while (!q.empty()) {
        std::string mod = q.front(); q.pop();
        if (g.edges.count(mod)) continue;
        auto deps = depsOf(mod);            // parse imports + resolve paths
        g.edges[mod] = deps;
        for (auto& d : deps) {
            g.importers[d].push_back(mod);
            q.push(d);
        }
    }
    return g;   // webpack walks this fully before serving;
                // vite's dev server lets the browser drive the walk
}

// HMR propagation: climb importers until a module accepts the update.
std::string propagate(const ModuleGraph& g, const std::string& changed,
                      const std::unordered_set<std::string>& accepts) {
    std::queue<std::string> q;
    std::unordered_set<std::string> seen;
    q.push(changed);
    while (!q.empty()) {
        std::string mod = q.front(); q.pop();
        if (accepts.count(mod)) continue;          // boundary found: hot swap
        auto it = g.importers.find(mod);
        if (it == g.importers.end() || it->second.empty())
            return "full-reload";                  // reached the entry module
        for (auto& parent : it->second)
            if (seen.insert(parent).second) q.push(parent);
    }
    return "hot-swapped";
}
```
$bdy$
),
(
  'rsc-vs-ssr-vs-csr', 'cs-tools-encodings',
  $tt$RSC vs SSR vs CSR$tt$,
  $tt$Where rendering happens, what ships over the wire, who pays for hydration — and when each model actually wins.$tt$,
  'Advanced', 83, 12,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$react.dev — Server Components reference$rf$, 'url', 'https://react.dev/reference/rsc/server-components', 'type', 'docs'),
      jsonb_build_object('title', $rf$Josh Comeau — Making Sense of React Server Components$rf$, 'url', 'https://www.joshwcomeau.com/react/server-components/', 'type', 'blog'),
      jsonb_build_object('title', $rf$web.dev — Rendering on the Web (CSR/SSR tradeoff matrix)$rf$, 'url', 'https://web.dev/articles/rendering-on-the-web', 'type', 'blog'),
      jsonb_build_object('title', $rf$React Working Group — RSC From Scratch, Part 1 (Dan Abramov)$rf$, 'url', 'https://github.com/reactwg/server-components/discussions/5', 'type', 'repo')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
Three rendering models, one question: where does the component function actually execute? **CSR** runs everything in the browser from a near-empty HTML shell. **SSR** runs the render once on the server to produce HTML, then runs it *again* in the browser to hydrate. **RSC** splits the tree itself: server components execute only on the server and ship their *output* (not their code), while client components hydrate as usual. Each choice moves cost between the server, the network, and the user's CPU.

## whyItMatters
This is the architecture decision behind every modern React framework — Next.js App Router, Remix, and the meta-framework interviews that go with them. Picking wrong costs real money and real users: CSR on a content site tanks first paint and SEO; SSR everywhere doubles infrastructure cost for pages that never needed it; misunderstanding RSC leads to `"use client"` sprinkled on everything, which silently degrades back to plain SSR with none of the bundle savings. "Explain CSR vs SSR vs RSC and when you'd choose each" is now a standard senior frontend question, and the differentiating answer is about hydration cost and bundle composition, not buzzwords.

## intuition
Picture the component tree as work to be done, and ask who does it, how many times, and what crosses the network.

**CSR**: the server sends an empty `<div id="root">` plus a script tag. The browser downloads the entire app bundle, parses it, executes every component, fetches data, then paints. The user stares at a blank page (or spinner) for the whole chain: network, parse, render, fetch, render again. Work happens once — but all of it on the user's device, and nothing is visible until the very end. Every component you ever wrote is in the bundle.

**SSR**: the server executes the components and streams real HTML, so the user sees content fast. But HTML is inert — no click handlers attached. To make it interactive, the browser must still download the *same* component code and re-execute the entire render to rebuild the virtual tree and attach listeners. That second pass is **hydration**, and it's the model's hidden tax: you render everything twice, ship all the code anyway, and there's an "uncanny valley" where the page looks ready but ignores clicks. SSR buys fast *first paint*, not fast *interactivity*.

**RSC**: stop assuming every component needs to run in the browser. A markdown renderer, a date formatter, a DB query — none of it needs event handlers. Server components run only on the server and emit a compact serialized description of their output (the RSC payload); their code, and their dependencies (the markdown parser, the ORM), never enter the bundle. Only the interactive leaves — marked `"use client"` — ship JavaScript and hydrate. Hydration cost now scales with how interactive the page is, not how large it is.

## visualization
```
                       CSR              SSR               RSC (+SSR)
                       ---------------  ----------------  -----------------------
First response         empty shell      full HTML         full HTML
Component code runs    browser, 1x      server + browser  server only (server comps)
                                        (render twice)    browser (client comps)
JS bundle contains     every component  every component   client components only
Data fetching          browser, after   server, before    server, inside components
                       bundle loads     render            (async, per component)
First paint            slow             fast              fast
Time to interactive    = first paint    paint + hydrate   paint + hydrate(client
                       (late but same)  ALL components    components only)
SEO / no-JS content    none             full              full
Server cost            ~static hosting  render per req    render per request
Wins for               dashboards,      content + some    content-heavy apps with
                       internal tools   interactivity     sparse interactive islands
```

## bruteForce
The naive mental model: "SSR is just CSR where the server kindly pre-renders the HTML, so it's strictly better — turn it on everywhere." This misses both costs. The server now re-renders on every request (CPU, latency, cache complexity), and the client *still* downloads and executes the full bundle to hydrate, so time-to-interactive can be **worse** than CSR on slow devices: the page taunts users with visible-but-dead buttons. SSR is a tradeoff, not an upgrade, and RSC exists precisely because hydrating everything stopped scaling.

## optimal
Treat the three models as a decision about each *subtree*, not the whole app — which is exactly what RSC formalizes.

**Match the model to the page's economics.** A logged-in dashboard behind auth has no SEO needs and tolerates a spinner: CSR is the cheapest correct answer (static hosting, aggressive caching, no render servers). A marketing page or article lives or dies on first contentful paint and crawlability: server-render it, and ideally cache the HTML (static generation is just SSR done at build time). An app that's mostly content with islands of interactivity — comment forms inside articles, an add-to-cart button inside a product page — is the RSC sweet spot: the content tree stays server-only and bundle-free, the islands hydrate.

**Understand the RSC mechanics well enough to predict cost.** Server components can be `async` and touch databases or filesystems directly; their data fetching happens *inside* the render on the server, killing client-side waterfall round trips. Their output is the RSC payload — a serialized element tree with "holes" where client components go. Props crossing the server-to-client boundary must be serializable (no functions, no class instances). A `"use client"` directive marks a *boundary*, not a single file: everything that module imports transitively joins the client bundle. That's the operational rule — push client boundaries down to leaves, pass server-rendered children *through* client components as `children` rather than importing them.

**Stack the models rather than choosing one.** In practice RSC frameworks SSR the initial HTML too: first request returns painted HTML, the RSC payload rehydrates only client components, and subsequent navigations fetch RSC payloads instead of full pages — re-rendering the server tree without losing client state. CSR remains what happens for every interaction after hydration. The three are layers, and the architecture question is where you draw the boundaries.

## complexity
time: CSR client O(bundle + full render); SSR server O(render) + client O(render again); RSC client O(client subtree only)
space: network cost — CSR/SSR ship the full bundle; RSC ships HTML + payload + client-only code
notes: SSR's total rendering work is roughly 2x a single render: once on the server for HTML, once on the client for hydration, with the full component bundle shipped regardless. RSC changes the scaling variable — client download and hydration cost grow with the number of interactive (client) components k, not total components n, while the RSC payload grows with rendered output. For content-heavy pages where k is a small fraction of n, that's the entire win.

## pitfalls
- **`"use client"` creep.** Marking a high-level layout `"use client"` drags its entire import graph into the bundle and back into hydrate-everything SSR. Keep client boundaries at the leaves; pass server content through as `children`.
- **Passing non-serializable props across the boundary.** Functions, Dates-with-expectations, class instances, and Maps can't cross from server to client components. Pass plain data and define handlers inside the client component.
- **Assuming server components re-render on interaction.** They run on the server per request/navigation; clicking a button can't re-execute one without a server round trip (router refresh or a server action). State and effects (`useState`, `useEffect`) simply don't exist in server components.
- **Judging SSR by first paint alone.** Lighthouse FCP looks great while a low-end phone spends 4 seconds hydrating. Measure time-to-interactive and total blocking time; that's the cost hydration hides.
- **CSR with client-side data waterfalls.** Bundle loads, renders, *then* discovers it needs data, fetches, renders again — each nested component adding a round trip. If you stay CSR, hoist fetches and parallelize; the waterfall, not rendering, is usually the slow part.

## interviewTips
- Structure the comparison around three axes — where code executes, what crosses the network, and who pays for interactivity — instead of listing frameworks. "SSR renders twice and ships everything; RSC renders server parts once and ships only client-component code" is the sentence that lands.
- Be precise about hydration: HTML from SSR is visible but inert until the client re-renders and attaches listeners. Naming the look-ready-but-dead gap (and that RSC shrinks it by hydrating less) shows you've shipped this, not just read about it.
- Have one concrete boundary story ready: a product page where the gallery, description, and reviews are server components and only the add-to-cart button is `"use client"` — then explain what would happen to the bundle if you marked the page component instead.

## code.python
```python
# The three models as pseudo-pipelines over one component tree.

def render(component, props):
    return component(props)            # returns an element tree

def to_html(tree): ...
def serialize_rsc(tree): ...           # element tree -> RSC payload

def csr(request, app, bundle):
    # server ships a shell; browser does everything
    return "<div id=root></div><script src=app.js>"
    # browser: download bundle -> render(app) -> fetch data -> render again

def ssr(request, app, bundle):
    html = to_html(render(app, request.props))     # pass 1: server
    return html + "<script src=app.js>"
    # browser: download SAME bundle -> render(app) again -> attach listeners
    # (hydration: the second full render)

def rsc(request, server_tree, client_components):
    tree = render(server_tree, request.props)      # server-only code runs here
    payload = serialize_rsc(tree)                  # output with client "holes"
    client_bundle = bundle_only(client_components) # markdown lib, ORM excluded
    return to_html(tree), payload, client_bundle
    # browser: hydrate ONLY client components found in the payload holes
```

## code.javascript
```javascript
// Sketch of an RSC boundary: what runs where, what ships where.

// ---- server component (never enters the browser bundle) ----
// app/ProductPage.jsx
import db from "./db";                 // server-only dep: stays on server
import AddToCart from "./AddToCart";   // client component = a "hole"

export default async function ProductPage({ id }) {
  const product = await db.products.find(id);   // fetch inside render
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* serializable props only across this boundary */}
      <AddToCart productId={product.id} price={product.price} />
    </article>
  );
}

// ---- client component (ships to the browser, hydrates) ----
// app/AddToCart.jsx
"use client";
import { useState } from "react";

export default function AddToCart({ productId, price }) {
  const [qty, setQty] = useState(1);
  return (
    <button onClick={() => addToCart(productId, qty)}>
      Add {qty} for {qty * price}
    </button>
  );
}
// Bundle contains AddToCart + its imports. ProductPage, db, and the
// product data pipeline never ship — only their rendered output does.
```

## code.java
```java
// The three pipelines, modeled as steps with explicit cost locations.

import java.util.*;

interface Component { String render(Map<String, Object> props); }

class RenderingModels {
    // CSR: server does nothing but serve bytes
    String csr() {
        return "<div id='root'></div><script src='app.js'></script>";
        // client: download bundle -> execute all components -> fetch -> paint
    }

    // SSR: render on server, then the client renders AGAIN to hydrate
    String ssr(Component app, Map<String, Object> props) {
        String html = app.render(props);              // server pass
        return html + "<script src='app.js'></script>";
        // client pass: same components re-execute to attach listeners
    }

    // RSC: server components emit output; only client components ship code
    record RscResponse(String html, String payload, List<String> clientBundle) {}

    RscResponse rsc(Component serverTree, Map<String, Object> props,
                    List<String> clientComponents) {
        String html = serverTree.render(props);       // server-only deps OK here
        String payload = serializeTree(html);         // tree + client "holes"
        return new RscResponse(html, payload, clientComponents);
        // client hydrates only the holes; server code never crosses the wire
    }

    String serializeTree(String tree) { return "RSC:" + tree; }
}
```

## code.cpp
```cpp
// Cost model of the three strategies over one tree of n components,
// k of which are interactive (client) components, k <= n.

#include <string>

struct Cost {
    double serverRender;   // per request
    double bytesShipped;   // code over the wire
    double clientExecute;  // render/hydrate work on the device
};

Cost csr(int n) {
    // shell only; browser executes everything after the bundle arrives
    return { 0.0, codeSize(n), renderCost(n) };
}

Cost ssr(int n) {
    // server renders all n; client downloads all n and renders all n AGAIN
    return { renderCost(n), codeSize(n), renderCost(n) };  // hydration tax
}

Cost rsc(int n, int k) {
    // server renders all n; only k client components ship + hydrate
    return { renderCost(n), codeSize(k) + payloadSize(n), renderCost(k) };
}

// The decision in one line: as k/n -> 0 (content-heavy, few islands),
// RSC's client cost collapses while SSR's stays O(n).
double renderCost(int m) { return 1.0 * m; }
double codeSize(int m)   { return 8.0 * m; }
double payloadSize(int m){ return 0.5 * m; }
```
$bdy$
),
(
  'react-fiber-reconciler', 'cs-tools-encodings',
  $tt$React Fiber Reconciler$tt$,
  $tt$How React turned the call stack into a linked-list data structure so rendering can pause, resume, and reprioritize mid-flight.$tt$,
  'Advanced', 82, 12,
  jsonb_build_object(
    'references', jsonb_build_array(
      jsonb_build_object('title', $rf$acdlite/react-fiber-architecture — the original Fiber design doc$rf$, 'url', 'https://github.com/acdlite/react-fiber-architecture', 'type', 'repo'),
      jsonb_build_object('title', $rf$Lin Clark — A Cartoon Intro to Fiber (React Conf 2017)$rf$, 'url', 'https://www.youtube.com/watch?v=ZCuYPiUIONs', 'type', 'video'),
      jsonb_build_object('title', $rf$react.dev — Render and Commit (the two-phase model)$rf$, 'url', 'https://react.dev/learn/render-and-commit', 'type', 'docs'),
      jsonb_build_object('title', $rf$JSer.dev — How does React traverse Fiber tree internally$rf$, 'url', 'https://jser.dev/react/2022/01/16/fiber-traversal-in-react/', 'type', 'blog')
    ),
    'prereqs', jsonb_build_array(),
    'relatedProblems', jsonb_build_array()
  ),
  'published',
  $bdy$## intro
Fiber is the reconciler React has shipped since version 16. It replaces recursive, run-to-completion rendering with an explicit data structure: every component instance becomes a **fiber node** carrying `child`, `sibling`, and `return` pointers, and rendering becomes a loop that processes one fiber at a time. Because the loop owns its own "stack," React can pause after any unit of work, let the browser paint or handle input, then resume — or throw the work away and restart at a higher priority.

## whyItMatters
Every concurrent feature in modern React sits on Fiber: `useTransition`, `useDeferredValue`, Suspense, streaming SSR, selective hydration, time slicing. Fiber also explains behaviors that look like bugs until you know the model — render functions running twice, effects firing after paint, a slow typeahead staying responsive while a giant list re-renders behind it. Senior frontend interviews probe exactly this layer: "what happens between `setState` and the pixel changing?" The answer is the fiber work loop, and being able to walk through it node by node separates "uses React" from "understands React."

## intuition
Start with the problem the old reconciler couldn't solve. Pre-Fiber React rendered recursively: `render(parent)` called `render(child)` called `render(grandchild)`, all on the native call stack, synchronously, to completion. A 200ms render of a deep tree meant 200ms where the browser could not paint, scroll, or respond to a keystroke — the stack cannot be paused halfway and resumed later.

Fiber's core move is to **reify the call stack as a heap data structure**. Instead of stack frames, you get fiber nodes. Each fiber points to its first `child`, its next `sibling`, and its parent (`return`). Recursion becomes pointer-chasing: go down via `child`, across via `sibling`, back up via `return`. Crucially, "where am I in the traversal" is now just a single variable — `workInProgress` — instead of an implicit stack of frames. Save that one pointer and you can stop after any node, yield to the browser, and pick up exactly where you left off on the next idle slice.

Two more ideas complete the picture. **Double buffering**: React keeps two trees — `current` (what's on screen) and `workInProgress` (the draft being built). Each fiber has an `alternate` pointer to its counterpart, so nodes are recycled between renders instead of reallocated. The screen never shows a half-built tree; React swaps `root.current` to the finished draft in one atomic move, like flipping the back buffer in a game engine. **Priority lanes**: every update is tagged with a lane (a bit in a 31-bit bitmask) — sync clicks outrank transitions, transitions outrank idle work. A higher-priority update arriving mid-render can interrupt the draft, render its own update first, and let the abandoned lower-priority work restart afterward. Rendering becomes preemptible, like threads under an OS scheduler.

## visualization
```
Fiber tree pointers (child / sibling / return) and traversal order:

  fiber        child      sibling    return     beginWork#  completeWork#
  ---------    --------   --------   --------   ----------  -------------
  HostRoot     App        -          -          1           10
  App          Header     -          HostRoot   2           9
  Header       h1         Main       App        3           5
  h1           -          -          Header     4           4
  Main         List       -          App        6           8
  List         -          -          Main       7           7

Work loop (one unit of work per iteration):
  while (workInProgress !== null && !shouldYield()):
      beginWork(wip)        -> render component, diff children, return wip.child
      if wip.child == null: completeWork(wip), then try sibling, else climb return
  shouldYield() true after ~5ms  -> save workInProgress pointer, yield to browser
  next slice                     -> resume loop from the saved pointer

Double buffer:
  current tree  <--alternate-->  workInProgress tree
  commit phase: mutate DOM from flagged fibers, then root.current = finishedWork
```

## bruteForce
The naive mental model: "setState re-runs my component, React recursively re-renders everything below it, and the DOM updates — one synchronous pass, top to bottom." That is exactly how the pre-16 stack reconciler worked, and it is still a fine approximation for small trees. It breaks down at scale: the recursion is uninterruptible, so one expensive subtree blocks the main thread for its entire duration, every update has equal priority, and there is no way to abandon stale work when newer input arrives. Frame drops and janky typing are the symptom.

## optimal
The Fiber work loop runs in two strictly separated phases.

**Render phase (interruptible).** `performUnitOfWork` processes one fiber: `beginWork` calls the component function (or compares props for a bailout), reconciles its children against the current tree — this is where the virtual-DOM diff with keys happens — creates or reuses child fibers via `alternate`, and returns the first child as the next unit of work. When a fiber has no child, `completeWork` runs: it creates the real DOM instance for host fibers (not yet attached), bubbles up effect flags (Placement, Update, Deletion) so the commit phase can find dirty nodes without re-walking the whole tree, then moves to the sibling, or climbs `return` pointers completing parents as it goes. Between every unit, the loop checks `shouldYield()` — React's scheduler grants roughly 5ms slices, then yields so the browser can paint and handle events. The saved `workInProgress` pointer makes resumption trivial.

**Interruption and lanes.** When an update is scheduled, it's assigned a lane: discrete input gets `SyncLane`, hover/scroll continuations get `InputContinuousLane`, normal updates `DefaultLane`, `startTransition` work gets a transition lane, offscreen work goes idle. If a higher-priority lane arrives while a lower-priority draft is mid-render, React abandons that draft — nothing was committed, so nothing is inconsistent — renders the urgent lanes to completion, then restarts the transition render from scratch against the new `current` tree. This restart is why render functions must be pure: they may execute multiple times for one eventual commit.

**Commit phase (synchronous, never interrupted).** Walking only the flagged fibers, React runs deletions and `insertBefore`/property mutations, swaps `root.current = finishedWork` (the double-buffer flip), then runs layout effects synchronously and passive effects (`useEffect`) after paint. Splitting an interruptible render from an atomic commit is the entire trick: all the slow work can be sliced and discarded, while the user-visible mutation stays consistent and instantaneous.

## complexity
time: O(n) render phase over fibers visited; commit is O(f) for f flagged fibers
space: O(n) per tree, ~2x with double buffering (alternates are recycled)
notes: Bailouts — React.memo, identical element references, no pending lanes in a subtree — skip whole subtrees, so practical render cost is O(changed region), not O(app). The commit phase finds dirty nodes through bubbled-up effect flags rather than re-walking the tree. Time slicing bounds main-thread blocking per ~5ms slice, not total work: total CPU can actually increase when a low-priority render is interrupted and restarted, which is the deliberate trade — responsiveness over throughput.

## pitfalls
- **Assuming render runs exactly once per commit.** Interrupted renders replay, and StrictMode double-invokes components on purpose to surface this. Any side effect in the render body (logging, mutation, network calls, `Math.random()` into state) will fire an unpredictable number of times. Side effects belong in effects or event handlers.
- **Believing time slicing makes slow components fast.** Yielding happens **between** fibers, never inside one. A single component that takes 80ms to render still blocks the main thread for 80ms. Fiber buys responsiveness across components; expensive single components still need memoization, virtualization, or splitting.
- **Treating mutation of the previous tree as safe.** Mutating props or state objects in place can leak into the `current` tree through `alternate` reuse, producing renders that "see" half-updated data. Always produce new objects for changed state.
- **Expecting `useEffect` to run before paint.** Passive effects are scheduled after the commit paints. Reading layout and synchronously re-rendering belongs in `useLayoutEffect`; doing it in `useEffect` causes a visible flicker.
- **Confusing the phases when debugging.** A component function appearing in a profiler flame chart is render phase (may be discarded); DOM not matching state means a commit-phase or key/reconciliation issue. Knowing which phase misbehaved cuts debugging time in half.

## interviewTips
- Walk the pipeline in one breath: "setState enqueues an update with a lane, the scheduler picks the highest-priority lane, the work loop builds a workInProgress tree one fiber at a time via beginWork/completeWork, yielding every ~5ms, then the commit phase synchronously mutates the DOM and swaps root.current." Hitting those keywords in order signals real understanding.
- Be ready for "why can renders be thrown away safely?" — because the render phase never touches the DOM; only commit does. Purity of render is the invariant that makes interruption free.
- Contrast stack vs Fiber crisply: recursion keeps traversal state on the native call stack (uninterruptible); Fiber keeps it in `child`/`sibling`/`return` pointers plus one `workInProgress` variable (pausable, resumable, abortable). That one sentence is the whole architecture.

## code.python
```python
# Teaching skeleton of the Fiber work loop: linked-list traversal
# with yielding, not real React.

import time

class Fiber:
    def __init__(self, name, render=None):
        self.name = name
        self.render = render          # produces child descriptions
        self.child = None
        self.sibling = None
        self.parent = None            # 'return' pointer (reserved word)
        self.alternate = None
        self.flags = set()

SLICE_MS = 5

def should_yield(slice_start):
    return (time.monotonic() - slice_start) * 1000 > SLICE_MS

def begin_work(fiber):
    # call the component, reconcile children, return first child
    if fiber.render:
        fiber.render(fiber)
    return fiber.child

def complete_work(fiber):
    # create host instance, bubble effect flags upward
    if fiber.parent:
        fiber.parent.flags |= fiber.flags

def perform_unit_of_work(fiber):
    nxt = begin_work(fiber)
    if nxt:
        return nxt
    while fiber:
        complete_work(fiber)
        if fiber.sibling:
            return fiber.sibling
        fiber = fiber.parent
    return None

def work_loop(root):
    wip = root
    while wip:
        slice_start = time.monotonic()
        while wip and not should_yield(slice_start):
            wip = perform_unit_of_work(wip)
        if wip:
            # yield to the "browser"; wip pointer preserves our place
            time.sleep(0)
    commit(root)

def commit(root):
    # synchronous, uninterruptible: flush flagged fibers to the host
    print("commit:", root.flags)
```

## code.javascript
```javascript
// Miniature Fiber loop mirroring React's shape:
// performUnitOfWork + child/sibling/return traversal + yielding.

function createFiber(name, render) {
  return { name, render, child: null, sibling: null, return: null,
           alternate: null, flags: 0 };
}

let workInProgress = null;
const SLICE_MS = 5;

function shouldYield(sliceStart) {
  return performance.now() - sliceStart > SLICE_MS;
}

function beginWork(fiber) {
  if (fiber.render) fiber.render(fiber);   // reconcile children here
  return fiber.child;
}

function completeWork(fiber) {
  if (fiber.return) fiber.return.flags |= fiber.flags;
}

function performUnitOfWork(fiber) {
  const next = beginWork(fiber);
  if (next) return next;
  let node = fiber;
  while (node) {
    completeWork(node);
    if (node.sibling) return node.sibling;
    node = node.return;
  }
  return null;
}

function workLoop(deadlineStart = performance.now()) {
  while (workInProgress && !shouldYield(deadlineStart)) {
    workInProgress = performUnitOfWork(workInProgress);
  }
  if (workInProgress) {
    // paused, not finished: schedule the next slice
    setTimeout(() => workLoop(), 0);
  } else {
    commitRoot();
  }
}

function commitRoot() {
  // synchronous: apply flagged mutations, then swap root.current
}

function renderRoot(rootFiber) {
  workInProgress = rootFiber;   // a fresh workInProgress tree via alternates
  workLoop();
}
```

## code.java
```java
import java.util.function.Consumer;

class Fiber {
    String name;
    Consumer<Fiber> render;     // builds children when invoked
    Fiber child, sibling, parent, alternate;
    int flags;
    Fiber(String name, Consumer<Fiber> render) {
        this.name = name; this.render = render;
    }
}

class FiberLoop {
    static final long SLICE_NANOS = 5_000_000L;
    Fiber workInProgress;

    Fiber beginWork(Fiber f) {
        if (f.render != null) f.render.accept(f);
        return f.child;
    }

    void completeWork(Fiber f) {
        if (f.parent != null) f.parent.flags |= f.flags;
    }

    Fiber performUnitOfWork(Fiber f) {
        Fiber next = beginWork(f);
        if (next != null) return next;
        Fiber node = f;
        while (node != null) {
            completeWork(node);
            if (node.sibling != null) return node.sibling;
            node = node.parent;
        }
        return null;
    }

    void workLoop(Fiber root) {
        workInProgress = root;
        while (workInProgress != null) {
            long sliceStart = System.nanoTime();
            while (workInProgress != null
                    && System.nanoTime() - sliceStart < SLICE_NANOS) {
                workInProgress = performUnitOfWork(workInProgress);
            }
            // between slices the host environment paints / handles input;
            // the saved workInProgress pointer is the whole "call stack"
        }
        commit(root);
    }

    void commit(Fiber root) {
        // synchronous phase: flush flagged fibers, swap current tree
    }
}
```

## code.cpp
```cpp
#include <chrono>
#include <functional>
#include <string>

struct Fiber {
    std::string name;
    std::function<void(Fiber*)> render;   // reconciles children
    Fiber* child = nullptr;
    Fiber* sibling = nullptr;
    Fiber* parent = nullptr;              // the 'return' pointer
    Fiber* alternate = nullptr;
    unsigned flags = 0;
};

using Clock = std::chrono::steady_clock;
constexpr auto kSlice = std::chrono::milliseconds(5);

Fiber* beginWork(Fiber* f) {
    if (f->render) f->render(f);
    return f->child;
}

void completeWork(Fiber* f) {
    if (f->parent) f->parent->flags |= f->flags;
}

Fiber* performUnitOfWork(Fiber* f) {
    if (Fiber* next = beginWork(f)) return next;
    for (Fiber* node = f; node; node = node->parent) {
        completeWork(node);
        if (node->sibling) return node->sibling;
    }
    return nullptr;
}

void commitRoot(Fiber* root) {
    // synchronous: apply flagged mutations, flip current <-> workInProgress
}

void workLoop(Fiber* root) {
    Fiber* wip = root;
    while (wip) {
        auto sliceStart = Clock::now();
        while (wip && Clock::now() - sliceStart < kSlice) {
            wip = performUnitOfWork(wip);
        }
        // slice expired: yield to the host, resume from the saved wip pointer
    }
    commitRoot(root);
}
```
$bdy$
)
) AS t(slug, module_slug, title, subtitle, difficulty, pos, est, metadata, status, body_raw)
LOOP
  sections := '{}'::jsonb;
  codes := '{}'::jsonb;
  cur_name := NULL;
  cur_lines := ARRAY[]::text[];
  lines := string_to_array(r.body_raw || E'\n## __END__', E'\n');
  FOREACH ln IN ARRAY lines LOOP
    IF ln ~ '^##\s+[A-Za-z0-9_.]+\s*$' THEN
      IF cur_name IS NOT NULL THEN
        cleaned := regexp_replace(regexp_replace(array_to_string(cur_lines, E'\n'), '^\s+', ''), '\s+$', '');
        IF cur_name LIKE 'code.%' THEN
          lang := substring(cur_name from 6);
          code_lines := ARRAY[]::text[];
          in_fence := false;
          fence_done := false;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            IF NOT fence_done THEN
              IF NOT in_fence THEN
                IF cl LIKE '```%' THEN in_fence := true; END IF;
              ELSIF cl LIKE '```%' THEN
                fence_done := true;
              ELSE
                code_lines := array_append(code_lines, cl);
              END IF;
            END IF;
          END LOOP;
          IF in_fence THEN
            codes := codes || jsonb_build_object(lang, regexp_replace(array_to_string(code_lines, E'\n'), '\s+$', ''));
          ELSE
            codes := codes || jsonb_build_object(lang, cleaned);
          END IF;
        ELSIF cur_name = 'complexity' THEN
          obj := '{}'::jsonb;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            km := regexp_match(cl, '^([a-zA-Z]+):\s*(.*)$');
            IF km IS NOT NULL THEN
              obj := obj || jsonb_build_object(km[1], regexp_replace(km[2], '\s+$', ''));
            END IF;
          END LOOP;
          sections := sections || jsonb_build_object('complexity', obj);
        ELSIF cleaned LIKE '- %' THEN
          arr := '[]'::jsonb;
          FOREACH cl IN ARRAY string_to_array(cleaned, E'\n') LOOP
            IF cl LIKE '- %' THEN
              arr := arr || to_jsonb(regexp_replace(regexp_replace(substring(cl from 3), '^\s+', ''), '\s+$', ''));
            END IF;
          END LOOP;
          sections := sections || jsonb_build_object(cur_name, arr);
        ELSE
          sections := sections || jsonb_build_object(cur_name, cleaned);
        END IF;
      END IF;
      cur_name := regexp_replace(ln, '^##\s+([A-Za-z0-9_.]+)\s*$', '\1');
      cur_lines := ARRAY[]::text[];
    ELSIF cur_name IS NOT NULL THEN
      cur_lines := array_append(cur_lines, ln);
    END IF;
  END LOOP;
  sections := sections || jsonb_build_object('estimatedReadMinutes', r.est);
  INSERT INTO "PGcode_concepts" (slug, module_slug, title, subtitle, difficulty, "position", body, code, metadata, status)
  VALUES (r.slug, r.module_slug, r.title, r.subtitle, r.difficulty, r.pos, sections, codes, r.metadata, r.status)
  ON CONFLICT (slug) DO UPDATE SET
    module_slug = EXCLUDED.module_slug,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    difficulty = EXCLUDED.difficulty,
    "position" = EXCLUDED."position",
    body = EXCLUDED.body,
    code = EXCLUDED.code,
    metadata = EXCLUDED.metadata,
    status = EXCLUDED.status,
    updated_at = now();
END LOOP;
END
$do$;
