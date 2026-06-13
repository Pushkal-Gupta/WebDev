---
slug: rsc-vs-ssr-vs-csr
module: cs-tools-encodings
title: RSC vs SSR vs CSR
subtitle: Where rendering happens, what ships over the wire, who pays for hydration — and when each model actually wins.
difficulty: Advanced
position: 83
estimatedReadMinutes: 12
prereqs: []
relatedProblems: []
references:
  - title: "react.dev — Server Components reference"
    url: "https://react.dev/reference/rsc/server-components"
    type: docs
  - title: "Josh Comeau — Making Sense of React Server Components"
    url: "https://www.joshwcomeau.com/react/server-components/"
    type: blog
  - title: "web.dev — Rendering on the Web (CSR/SSR tradeoff matrix)"
    url: "https://web.dev/articles/rendering-on-the-web"
    type: blog
  - title: "React Working Group — RSC From Scratch, Part 1 (Dan Abramov)"
    url: "https://github.com/reactwg/server-components/discussions/5"
    type: repo
status: published
---

## intro
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
