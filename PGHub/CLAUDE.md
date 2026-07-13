# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## NO EMPTY SPACE (HARD)

**Every page must FILL the viewport.** Empty whitespace below content, content squeezed into half the available width, lists that bottom out at 60% screen height — all of it is a bug. The reader's eye should hit something useful at every point on the page, especially the bottom.

Apply everywhere:
- **Lists/tables**: page container = flex-column filling viewport height. Header+filters take natural height. List region gets `flex: 1 1 auto; min-height: 0; overflow-y: auto`. Pagination/footer sits at viewport bottom (sticky-bottom or in flex tail). Don't let the table end at 600px when the viewport is 900px.
- **Grids**: use full container width. Don't cap at 1200px if the viewport is 1600px and the content can scale. Prefer `repeat(auto-fit, minmax(...))`.
- **Hero sections**: don't pad a small headline with 40vh of whitespace. Either pack more content (subtitle, stats, CTA, preview chips) or shorten the hero.
- **Cards**: if 3 cards fit per row on a wide screen, render 3 columns. Don't show at 280px in a 1500px viewport.
- **Mobile**: still fill vertically; sticky footer applies.

Audit at 1920×1080 desktop AND 1440×900 laptop. If there's a band of empty space below content that isn't intentional breathing room, fix it. Empty pixels are wasted learning surface.

## Breathing space after enclosed content (HARD)

**Content must never bleed flush against the edge that encloses it.** A grid of cards, a list, a code block, a chart, a diagram — anything inside a page container, a card, a modal, or a section — must have a small, consistent gap after the LAST element before the container ends. Last row of cards touching the viewport bottom, a chart whose baseline sits on the container border, text ending exactly at a card's bottom padding-line — all read as cut-off and cheap.

- Every scrollable route container ends with **bottom padding** (≈2–3rem) so the last row finishes with air beneath it, never flush against the fold/edge.
- Every card/box/modal gives its inner content padding on ALL sides — the bottom included — so nothing kisses the border.
- This is distinct from NO EMPTY SPACE: that rule kills *large dead bands*; this rule guarantees a *small, deliberate* gap so content visibly "finishes". A page fills the viewport AND ends with breathing room — both are true at once.
- When something looks "cut", first check it's not just below the fold (scroll reveals it); if it genuinely clips, the container is missing bottom padding or has an `overflow:hidden` + fixed height — fix the padding/height, never add an inner scrollbar.

## Text must never be SLICED by its box (HARD — recurring bug, the user HATES this)

**No container may ever cut a line of text mid-glyph against its own border.** Card titles, card summaries, list-item descriptions, chip labels, tooltip bodies — if the text is longer than the writer guessed, the BOX must grow to fit it. A summary that ends "A list of numbers with a" flush against the card's bottom edge (rest of the sentence gone, no ellipsis) is the bug. This has bitten the user repeatedly on the PGForge/ML card grids and elsewhere.

The #1 cause and the trap to check on sight:
- **`overflow: hidden` + `min-height` (or fixed `height`) on the same element** turns it into a scroll container whose *intrinsic* height (what CSS Grid / flexbox use to size the track) collapses to the `min-height`, NOT the real content height. The grid row then locks to `min-height`, and any card whose content is taller gets its overflow **sliced off** by `overflow:hidden`. Fix: remove `overflow:hidden` from the growable card (clip the thumb/media with its own nested `overflow:hidden` + matching `border-radius` instead), so the card's intrinsic height tracks its content and the row grows. `min-height` alone (a floor) is fine; it's the pairing with `overflow:hidden` that slices.

Rules:
- Text containers **size to content** (`height: auto`); `min-height` is a floor only, never a cap. Never put `overflow:hidden`/`max-height` on an element that holds flowing text and expect the text to "just fit."
- If a value genuinely must be bounded (a truly unbounded string breaking layout), clamp it **cleanly** with `-webkit-line-clamp: N` + `overflow:hidden` + `text-overflow: ellipsis` on the *text node itself* (never the whole card) so it ends with an ellipsis, not a border-slice. Default to letting it grow; only clamp when you've confirmed the string can be arbitrarily long.
- For equal-height card grids: let each card size to content and let the grid row `align-items: stretch` pull the shorter cards up to the tallest — that gives a tidy grid AND full text. Do NOT force a fixed row height and clip.
- Audit any new card/list/grid at a wide viewport with the LONGEST real content string: if the last line touches the box edge with the sentence unfinished and no ellipsis, it's a P0 in the same pass.

## A visualization must FIT ON SCREEN with its controls (HARD)

**A viz and ALL of its controls must be visible at once, without scrolling and without any inner scrollbar.** If a reader has to scroll to reach the Play/Step/Reset buttons, the sliders, or the readouts under a visualization, that's a bug. The whole interactive unit — stage + controls + readouts — fits inside the viewport (audit at 1440×900 AND 1366×768).

- Size the viz STAGE so that `stage height + controls height + readouts height ≤ usable viewport height`. The SVG scales down (viewBox) to leave room for the controls; never let the SVG push the controls off-screen.
- Controls and readouts are NOT optional tails that fall below the fold — they're part of the viz. Cap the SVG/canvas (e.g. `max-height: 48–56vh`) so the controls always sit within view beneath it.
- No inner scrollbar to reach any part of the viz (this is the no-scrollbar rule applied to viz specifically): shrink the stage, not scroll it.
- This applies to ML lesson viz (`ml/viz/*`, `MLLesson`), concept viz (`learn/viz/*`, `ConceptPage`, `/visualize`), and the live notebook — everywhere a viz renders with controls.

Audit: load the viz route headless at 1440×900, confirm the last control/readout's bottom edge is within the viewport. If it's cut off, the stage is too tall — reduce the SVG `max-height` until stage + controls fit.

## What this is

PGcode is a single-author DSA / interview-prep platform aiming to be measurably better than NeetCode + GeeksforGeeks + Programiz combined — broader catalog, deeper editorial, more polished UI, server-side grading, multi-language support. Design quality and editorial depth outrank feature count.

Live: `https://pushkalgupta.com/PGcode/dist/index.html` (HashRouter; URLs use `#/`).

## The thesis — why PGcode exists (HARD — north star)

The content has always existed. Linear algebra, gradient descent, attention, segment trees — every concept here has been taught a thousand times. What's changed is the toolkit for **delivering** that content: SVG animation, interactive React components, KaTeX rendering, MANIM-style step-throughs, embeddable visualizers. The libraries available in 2025 are off the charts compared to even 2020.

**That gap is our entire reason for existing.** We are not a content site competing on writing quality alone — every concept has a 3B1B video and a Wikipedia article. We are the place where every concept has an **interactive, visual, intuitive** explanation built using the modern tools, sitting inline next to the prose so the reader can *do* something with each idea instead of just reading about it.

Concrete consequences for every task on this codebase:
- **Default to visuals over prose.** If you can show it with an SVG component, ship the component; the prose around it should narrate the picture, not replace it.
- **Default to interactive over static.** If the reader can drag a vector, slide a parameter, step through an algorithm — let them. Live readouts beat captioned screenshots.
- **Default to intuitive framing over formal definition.** Geometric reframe → worked example → formula, in that order. Khan's careful pacing + 3B1B's geometric eye.
- **Reach for the right tool.** Inline SVG for diagrams, KaTeX for math, MANIM-style animation for processes, embedded videos when a 3B1B clip is the clearest explanation that exists. Use the whole modern toolkit; don't hand-draw what a library can render.
- **The lesson page is the proof.** A learner who lands here and can manipulate the concept in real time has gotten something they can't get from a textbook or a video alone. That's the wedge.

When a content task lands ambiguously phrased — "improve this lesson" / "add a section" — choose the variant that adds an interactive visual element. That's always the right call.

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

## Planned expansion — EntrantHub features + VisuAlgo visualize overhaul (HARD — in progress)

Full plan: `docs/PLAN_ENTRANTHUB_VISUALGO.md`; wiki: `docs/llm-wiki/entranthub-visualgo-integration.md`. Three workstreams the user requested 2026-06-14:
1. **VisuAlgo-style `/visualize` overhaul** — gallery of colorful category cards (mini animated SVG preview + tags), grouping our 24+ existing interactive viz + building the missing VisuAlgo categories.
2. **Contest aggregation** — unified upcoming/past contest calendar across LeetCode/Codeforces/AtCoder/CodeChef + DevPost/Kaggle/GSoC, plus LeetCode contest analytics (rankings, question stats, rating prediction). New `PGcode_external_contests` table + `fetch-contests` edge function. Keep our internal ICPC-style contests as a separate tab.
3. **Group pages for Companies & Concepts** — mirror the `MLGroup` (`/ml/g/:groupSlug`) pattern; each group opens its own tab/page.

**HARD rule:** entranthub.com and visualgo.net are reference scaffolding to MATCH then DELETE — never link to, credit, or leave "inspired by" copy referencing them. Reimplement in PGcode's own voice; original visualizations only.

Refinements (2026-06-14 PM): (a) Visualize gallery is a **routed drill-down** — category card → `/visualize/c/:category` module page (submodule/viz cards) → `/visualize/:slug` viz page with the editable-code panel; never expand viz lists inline under a category. (b) The Compete LeetCode profile/compare presents the live `lc-user` data as a coherent **chart-heavy visual dashboard** (submission/difficulty/beats/rating-timeline/win-loss/contest-table/tag charts), two-profile overlay — original SVG charts, theme tokens, never text dumps. (c) Profiles carry a `leetcode_handle`; when set, their live LeetCode stats render into one coherent shareable card.

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

## Markdown + math rendering (HARD — repeated bug)

This bug has bitten the user multiple times. Always check:

- **Inline math** uses `\(...\)` — must render via **KaTeX** (`katex.renderToString`), not a `<code>` tag. Raw `\|v\|`, `\sqrt{...}`, `\sum_i`, etc. showing as monospace text is the bug.
- **Display math** uses `\[...\]` — must render via KaTeX in **display mode**, not `<pre>` of raw LaTeX.
- Bare formulas in prose (without `\(...\)` wrapping) — STILL must render. If a writer drops in `\sum_i p_i \log q_i` without delimiters, the renderer should either detect-and-katex or our content guide should reject it. NEVER ship a page that shows raw LaTeX backslashes to the reader.
- Both `MLLesson` and `ConceptPage` MUST use the same KaTeX renderer; never half-wire one without the other.
- After any change to the markdown renderer in either file, render a page with mixed `**bold**`, `` `code` ``, `\(inline\)`, `\[display\]`, bullet/ordered lists, and a `### h3` heading — verify ALL render correctly, not just the one you touched.
- Lesson/concept SOURCE files (`mlContent.js`, `content/concepts/*.md`) are written with LaTeX syntax. Do NOT rewrite them to Unicode as a "fix" — fix the renderer instead. KaTeX is already installed.
- Test: open `/ml/foundations/vectors` in dev — if you see literal `\|v\|_2 = \sqrt{...}` text, the renderer is broken.

Renderers to keep in sync:
- `src/components/ml/MLLesson.jsx` → `renderInline` (inline math), `MathBlock` (kind=math sections), `renderProseBody` (display math inside prose).
- `src/components/learn/ConceptPage.jsx` → `Markdown` component + `preprocessInlineMath` step.

## No scrollbars anywhere except the vertical page scroll (HARD — restated multiple times, the user HATES this)

**The vertical page scroll is the ONLY allowed scrollbar.** Not horizontal. Not vertical inside a section. Not inside a viz. Not inside code blocks. Not inside math. Not inside tables. Not inside cards. Not inside modals. Not anywhere.

If something doesn't fit: **make it smaller, reflow, scale the viewBox, drop the font-size, wrap text, split the math, redraw the SVG.** NEVER reach for `overflow: auto` or `overflow-x: auto` or `overflow-y: auto` on inner content. The fix is always "make the content fit," not "let the user scroll inside the content."

Causes to check on sight (every one of these has bitten us at least once):
- `<pre>` blocks of ASCII / code that exceed container width — wrap, scale the font, or shrink.
- SVG `viewBox` mismatched to container — set `width: 100%`, `preserveAspectRatio="xMidYMid meet"`, rebalance the viewBox so 100% width fills.
- KaTeX `\[...\]` blocks too wide — wrap into multiple lines, drop the font-size, or rewrite the math.
- Math / code containers using `overflow-x: auto` — DELETE that property; replace with content reflow.
- Workspace tabs / panel children with `overflow-y: auto` on inner divs — let the outer page handle scroll instead.
- Modal bodies wider than viewport — shrink the modal width or wrap content.
- Tables wider than container — rewrite as stacked rows on narrow widths.
- **`flex: 1 1 auto` + `min-height: 0` on a card GRID inside a scroll container (the `.mlhub-pillars-auto` bug, 2026-07-13).** Flex-shrink lets the grid collapse BELOW its content height; the extra rows then bleed OUTSIDE the flex box, so they render on top of / below sibling content ("cutting/overlapping") AND the wheel can't scroll to them ("can't scroll, cut off at the fold"). Fix: the grid must GROW to fill but NEVER shrink below content → `flex: 1 0 auto` (shrink 0), and drop `min-height: 0`. Any full-viewport card/lesson grid that must both fill AND scroll uses `flex: 1 0 auto`, not `1 1 auto`.

Audit every change: if ANY inner element shows a scrollbar of any kind, it's a P0 fix in the same pass. No exceptions for "but the content is just that big" — make the content smaller.

**NO "legitimate exception" carve-outs. There are none.** These all got added thinking they were fine and ALL are violations to revert:
- Terminal / code RUN output panes (`max-height` + `overflow:auto`) — NO. Let the output grow; the page scrolls. (`.rcp-output-body` etc.)
- A "tall interactive viz" stage (`.viz-detail-stage { overflow-y:auto }`) — NO. Scale/size the viz to fit the stage; never scroll inside it.
- Wide ASCII diagrams or math (`overflow-x:auto`) — NO. Shrink font / reflow / split. (`.ml-ascii`, `.ml-math .katex-display`)
- A code EDITOR (Monaco) inherently scrolls its own viewport — that's the editing surface itself, fine; but its surrounding panels/output must NOT add their own scroll.

When in doubt: search the diff for `overflow` before finishing. Any `auto`/`scroll` on inner content is a P0 in the same pass. The ONLY scrollbar on screen is the whole-page vertical one.

## Manager role — never stop assigning (HARD)

You are the manager. The user's standing instruction: do not stop deploying agents. Pipeline mode is the default.

- **Always have ≥4 sub-agents in flight.** If a batch finishes, dispatch the next immediately. If you're waiting on one agent's output, dispatch other independent agents in parallel rather than idling.
- **Even when a long task is in flight**, schedule whatever can run alongside: content writing while a viz agent works, a verify-prune sweep while a wave agent works, a markdown audit while a UI agent works.
- **When an agent reports back**: verify the output (read files, build, render check), then assign the NEXT sequential task immediately. No "pipeline complete" pauses.
- **When you discover a bug from user feedback**: dispatch a fix agent + a verifier agent + continue the pipeline. Three things at once.
- **Pipeline never goes empty** unless the user explicitly stops, even if you think there's nothing obvious to do. Default to one of: more curated problem waves, more MANIM viz, more lesson depth, more verify-prune sweeps, more content rewrites.
- Triple-review (Reviewer A + B) is part of this, not a separate step.

## Verify resources before linking (HARD — repeated bug)

When adding external references to lessons (3B1B videos, Khan units, papers, book PDFs):

- **Paste the exact topic URL**, never a generic playlist or homepage. For 3B1B: the specific video on THAT topic (e.g. vectors → `https://www.youtube.com/watch?v=fNk_zzaMoSs`, the actual "Vectors, what even are they?" video). For Khan Academy: the specific unit URL, not `khanacademy.org/math/linear-algebra` as a catch-all.
- **Verify each link resolves to the intended content.** Use WebFetch to confirm the page exists and matches the topic. A broken or off-topic link is worse than no link.
- **Fall back to alternatives** if no precise free resource exists: arxiv paper, distill.pub article, book PDF (arxiv.org, gwern.net, public textbook hosts), MIT OCW, Coursera lecture, Andrej Karpathy's blog, etc. Whatever is the BEST resource for this exact topic.
- Lessons differ in topic — copy-pasting the same link across 25 lessons is a failure. Each lesson gets its own carefully chosen resource(s).

## No ASCII art for visual diagrams (HARD — repeated bug)

ASCII art with `+--*--+----+--> x`, `|`, `--` etc. looks terrible in a browser. Forbidden on lesson pages.

Allowed `kind: 'ascii'` content:
- Pseudo-code listings, code snippets, tabular text where mono alignment matters.
- That's it.

Forbidden as ASCII — use a real SVG viz component instead:
- Vector arrows, plane axes, grids (build a dedicated SVG viz like `VectorAdditionViz`).
- Tree diagrams (SVG with node circles + edges).
- Graph drawings, flow charts (SVG).
- Coordinate systems with labels (SVG with `<text>`).
- Anything where alignment depends on monospace spacing being interpreted geometrically.

When you find an ASCII diagram that should be a real picture:
1. Build a small SVG component under `src/components/ml/viz/<Topic>Viz.jsx`.
2. Register it in `VIZ_REGISTRY` in `MLLesson.jsx`.
3. Replace the lesson's `kind: 'ascii'` section with `{ kind: 'viz', heading: '...', component: 'TopicViz' }`.
4. Each viz: theme tokens only, lucide icons only, no emoji, no external deps, controls + live readouts when relevant.

26 ASCII sections currently in `mlContent.js` — convert them to viz components on each content pass.

## Architecture / model diagrams are VERTICAL ONLY (HARD — repeated bug, the user HATES horizontal)

**Every architecture, pipeline, or model-flow diagram flows TOP-TO-BOTTOM. Never left-to-right.** The user has flagged this multiple times. A transformer / encoder-decoder / CNN / VAE / diffusion / RLHF block stack drawn horizontally (Encoder on the left, Decoder on the right; `x → weight → weight → +` across the page; stages 1·2·3·4 in a row) is a bug, not a style choice.

Rules:
- Model blocks stack in a single centered **vertical column**, data flowing downward, arrows pointing down. The canonical, correct implementation is `src/components/ml/forge/ArchitectureDiagram.jsx` (single column, `V_GAP` spacing, straight-down trunk edges, residual/skip arrows in the left gutter, `xN` brackets on the right). Match it.
- Encoder/decoder pairs: stack the encoder column above the decoder column, or place them as two vertical lanes side-by-side — but each lane still flows top-to-bottom. Never a left-encoder / right-decoder horizontal split.
- Multi-stage pipelines (tokenize → embed → attention → …, or RLHF demo → SFT → RM → PPO): vertical list of stages, each connected by a downward arrow. Not a horizontal row of boxes.
- Applies to BOTH the big right-rail diagrams AND the small inline card / bespoke SVGs. The `PaperDiagram` family in `PGForgePapers.jsx` (Transformer / Resnet / Seq2Seq / Vae / Diffusion / Vit / Clip / Rlhf / Flow) were the offenders — all drawn horizontally.
- Scatter plots, 2D projections, number lines, heatmaps, and genuinely-2D math figures (PCA / SVD / eigenvector / kernel plots) are NOT architecture diagrams — horizontal axes there are fine. The rule is about *model / pipeline block flows*.

When you find a horizontal architecture diagram: rebuild it vertical (reuse `ArchitectureDiagram` with `pgForgeArchData.js` block specs where possible, rather than hand-rolling another bespoke SVG), verify it fills its container width with no horizontal scrollbar, then move on.

## Interactive · Visual · Intuitive (HARD — three words that govern all learning content)

Every learning page must hit all three:

- **Interactive** — readers should be able to DO something on every page: drag, slide, step, click, hover, sample. Static walls of text are a failure. If a concept has a viz registered, the page must show it inline, not gate it behind a link.
- **Visual** — a learning page without imagery is a placeholder. Diagrams, animations, graphs, side-by-side comparisons. If an idea has a canonical visual (3B1B's vector arrows, Khan's number-line stepping, the loss landscape), it must be in the lesson, not "left as an exercise". Use MANIM-style SVG viz, embed a relevant 3B1B YouTube clip as a fallback for things we haven't built ourselves, or generate an inline diagram. NEVER ship raw text where a visual would land harder.
- **Intuitive** — every lesson must answer "what's actually happening" before the formula appears. Geometric reframe, physical analogy, worked tiny example with concrete numbers. Math first = lost reader. Reframe + example + math = retained reader.

Audit before shipping: if a page is text-only, no viz, no embedded video, no inline diagram — it does not ship. Either build the viz, embed a 3B1B clip (with `<iframe>` to youtube.com/embed/`<id>` and a fallback caption explaining what to watch), or write an inline ASCII visual that earns its space.

Future content tasks should default to: build the viz first, then write the prose around it.

## Premium "explorer" viz + viz QA (HARD — learned, see wiki)

The bar for ML lesson viz and how to verify UI. Full detail: `docs/llm-wiki/premium-explorer-viz.md` + `docs/llm-wiki/screenshot-qa-harness.md`.

- **Premium pattern.** Reference: `src/components/ml/viz/ActivationExplorerViz.jsx` — glowing gradient curve (SVG `<linearGradient>` stroke + a duplicate path under an `feGaussianBlur` filter), a draggable handle with a halo (pointer capture), color-coded `.mlviz-statcard`/`.mlviz-statcol`/`.mlviz-statrow` readouts, header (lucide icon + subtitle + value chip), `RotateCcw` reset, `mulberry32` (never `Math.random`), `prefers-reduced-motion` honored.
- **Two color rules at once:** chrome (stripe/icon-box/hover-border/CTA) = brand teal `var(--accent)`; data/visuals = COLORFUL via the `--hue-*` palette + `color-mix`. "Where's the teal" = chrome drifted to rainbow; "use colors not just teal" = the visuals went monochrome. Both are bugs.
- **SVG defs ids are document-global** — component-name-prefix every `<filter>`/`<linearGradient>`/`<clipPath>` id (or `useId()`), or two viz on one page collide.
- **Central registration is a collision point.** `VIZ_REGISTRY` + viz imports live ONLY in `src/components/ml/MLLesson.jsx`. Parallel build agents must create viz files + wire `{kind:'viz', component, heading}` sections into `mlContent.js`/`ml-extra/*.js` and **NOT touch MLLesson.jsx**; the orchestrator registers all new viz centrally in one pass via a Node script (the Edit tool trips MLLesson.jsx's linter-freshness check). Unregistered viz render blank (no crash) — always register + `npm run build` after a wave.
- **Lazy-mount.** `VizBlock` lazy-mounts each viz via `IntersectionObserver` (rootMargin 300px) with a sized placeholder — required for perf on viz-dense lessons AND so headless screenshots don't hang. Keep it.
- **Verify the render, not just the build.** Agents' "build passes" ≠ "renders correctly" — collapsed cards, white-on-white text, blank pages have all slipped through. Use the screenshot harness (`scripts/_shot.cjs` + a reviewer sub-agent to triage the PNGs) for any UI change. Heavy animated pages need `prefers-reduced-motion` emulation + raised `protocolTimeout` or `captureScreenshot` hangs.
- **Uniform page gutters.** Every route container: `width: 94%; max-width: var(--container-w); margin: 0 auto;` with ZERO horizontal padding (vertical padding per-page). Mismatched widths/side-padding make the gutter jump between pages — the user notices.
- **Runnable code / solvable problems** exist: `RunnableCodeBlock` (lesson code edit+Run+Reset via Judge0) and `PGForgeProblemDetail` (Monaco + a real Python auto-grader, honest PASS/FAIL/skipped — never fake a pass + solved success-state). Reuse these; don't reinvent the run path.

## Triple-review policy (HARD — applies to UI/viz too)

Triple-review is **MANDATORY** after every batch — content, viz, or UI. Not optional. Dispatch **two independent review agents in parallel** as soon as the writer/builder pass completes:
- **Reviewer A** — content accuracy (algorithm correctness, code compiles, complexity claims right, UI renders, routes resolve, nothing orphaned).
- **Reviewer B** — quality bar enforcement (word counts, section presence, no shallow filler; no hardcoded colors, no emoji, theme tokens used, controls present, MANIM feel for viz).
- The writer agent counts as the 3rd pass.

**When to dispatch reviewers (not just for ≥6 concepts):**
- Any ≥1 new viz component (MANIM/SVG visualization).
- Any ≥1 new ML lesson or tutorial body.
- Any UI restructure (route/layout/hub redesign — render must be checked, not just build).
- Any markdown / rendering pipeline change.
- Any change to a shared layout file (MLHub, ProblemList, ConceptPage, Workspace).

Reviewers report a PUNCH LIST of fixes (file:line refs, max ~250 words); a follow-up writer agent or foreground edits apply them. Do NOT mark a wave shipped without the review pass — the user will catch what reviewers caught.

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
Roadmap · Practice · Playground · Learning · Compete · Companies ·
Contests · Vault · ML-DL-AI
```

`Learning` is the hub that groups Tutorial + Concepts + Courses + Visualize (frees top-level slots). `Compete` (`/compete`) and `ML-DL-AI` (`/ml`, PGForge) are top-level areas. **ML-DL-AI sits last by user request (2026-06-16)** — it's the newest/deepest area, not a daily-driver tab. `Vault` consolidates Review/Lists/Notes/Progress.

`/assessments`, `/history`, `/achievements` are intentionally absent from SubNav — they were folded into `/practice` (Generate practice set) and `/progress` (tabbed view: Stats / History / Achievements / Topic Mastery). Routes remain registered in `App.jsx` so existing bookmarks resolve.

## When the user says "continue building"

Pick the next highest-MVP-value item from `docs/PLATFORM_PLAN_V5.md`. Ship it properly: schema → hooks → component → verify. Run `node scripts/verify.js` at the end. Depth over breadth. **Never wait.**

For parallel work, dispatch subagents on non-overlapping files (one agent per file/folder). Visualizer / Workspace / queries.js are common collision points — coordinate.
