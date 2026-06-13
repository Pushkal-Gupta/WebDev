---
slug: build-graph-vite-vs-webpack
module: cs-tools-encodings
title: Module Graphs — Vite vs Webpack
subtitle: Why one bundler crawls your whole dependency graph before serving a byte and the other serves instantly — and what that means for HMR and code splitting.
difficulty: Advanced
position: 84
estimatedReadMinutes: 11
prereqs: []
relatedProblems: []
references:
  - title: "Vite docs — Why Vite (bundle-based vs native-ESM dev server)"
    url: "https://vite.dev/guide/why.html"
    type: docs
  - title: "webpack docs — Concepts: entry, module graph, chunks"
    url: "https://webpack.js.org/concepts/"
    type: docs
  - title: "Vite docs — HMR API (accept boundaries, propagation)"
    url: "https://vite.dev/guide/api-hmr.html"
    type: docs
  - title: "webpack docs — SplitChunksPlugin (chunk graph and cache groups)"
    url: "https://webpack.js.org/plugins/split-chunks-plugin/"
    type: docs
status: published
---

## intro
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
