# Premium "explorer" viz + central registration + lazy-mount

The high bar for ML lesson visualizations. ~18 of these shipped (Activation, Loss-Descent, Gaussian, Conv-Kernel, Multi-Head-Attention, Cross-Entropy, Eigenvector, PCA, Dropout, Derivative, KL-Divergence, Bayes, LSTM-Gate, BatchNorm, Entropy, SVM-Margin, KNN, Positional-Encoding). When the user says "the visuals need to be on another level," this is the pattern.

## The reference

**`src/components/ml/viz/ActivationExplorerViz.jsx`** is the canonical template. Copy its structure. Ingredients:

- **Glowing gradient curve** — the main path uses an SVG `<linearGradient>` stroke PLUS a duplicate path underneath an `feGaussianBlur` `<filter>` (stdDeviation ~3) at reduced opacity. Round caps, ~2.5 width. Not a flat 1px line.
- **A draggable handle** — filled dot + outer halo/ring, dragged via pointer events (`pointerdown/move/up` + `setPointerCapture`, `touch-action:none`). Smooth easing on move.
- **Color-coded readout cards** — reuse the shared `.mlviz-statcard` / `.mlviz-statcol` / `.mlviz-statrow` classes (in `MLViz.css`). Uppercase mono micro-label + large mono value, updating live.
- **Header** — lucide icon + title + one-line subtitle + a value chip.
- Slider(s) as alternate controls, a `RotateCcw` **Reset**, deterministic `mulberry32` for any randomness (never `Math.random`), and `prefers-reduced-motion` honored.

## Two color rules the user enforces (both true at once)

- **Chrome = brand teal `var(--accent)`** — the accent stripe, icon-box, hover border, CTA. ("Where is the teal gone" = you let chrome drift to rainbow.)
- **Data/visuals = COLORFUL** — use the full `--hue-violet/sky/mint/pink` palette + `color-mix` for curves, bars, segments, motifs. ("Use colors not just teal" = you made the *visuals* monochrome teal.)

So: rainbow data, teal chrome. Never hardcode hex/rgba-numeric — theme tokens only.

## SVG defs ids are document-global — namespace them

Every `<filter id=>` / `<linearGradient id=>` / `<clipPath id=>` must be **component-name-prefixed and globally unique** (e.g. `id="pca-pc1-glow"`, or `useId()`-suffixed). Two viz sharing `id="glow"` collide when both render on one page (a lesson, or the `/visualize` index). This has bitten us; a cross-file audit (`grep -rhoE 'id="[a-z0-9-]+"' viz/*.jsx | sort | uniq -d`) catches it.

## Wiring + central registration (HARD collision rule)

A viz reaches a lesson in two steps:
1. **Wire a section** into the lesson source: `{ kind: 'viz', component: 'Name', heading: '…', props?: {} }`. Lesson sources are `src/content/mlContent.js` (base pillars) and `src/content/ml-extra/*.js` (optimization/regularization/architectures/rl/numerical). See `large-file-edit-strategy.md` before touching `mlContent.js`.
2. **Register** the component in `src/components/ml/MLLesson.jsx` — an `import` + an entry in the `VIZ_REGISTRY` object.

**Only ONE process may edit `MLLesson.jsx`.** When fanning out build agents, have each agent create its viz file(s) + wire lesson sections, and tell it explicitly **not to touch MLLesson.jsx** — then register all new viz centrally in one pass. Reason: it's a hard collision point, and the Edit tool repeatedly trips its "file changed since read" check (a linter rewrites it), so register with a small Node script instead:

```js
node -e 'const fs=require("fs");const p="src/components/ml/MLLesson.jsx";let s=fs.readFileSync(p,"utf8");
const names=["FooViz","BarViz"];
let imp="";for(const n of names) if(!new RegExp("import "+n+" ").test(s)) imp+=`import ${n} from "./viz/${n}";\n`;
s=s.replace("import \x27./MLHub.css\x27;",imp+"import \x27./MLHub.css\x27;");
const toReg=names.filter(n=>!new RegExp("[,{] ?"+n+"[ ,}]").test(s));
const m=s.match(/(\w+Viz) \};/);if(m&&toReg.length)s=s.replace(m[1]+" };",m[1]+", "+toReg.join(", ")+" };");
fs.writeFileSync(p,s);'
```

If a viz isn't registered, `VizBlock` renders `null` (blank, no crash) — so a wired-but-unregistered viz silently shows nothing. Always register after a build wave, then `npm run build`.

## Lazy-mount (perf + it unblocks headless QA)

`VizBlock` in `MLLesson.jsx` lazy-mounts each `kind:'viz'` section behind an `IntersectionObserver` (rootMargin `300px`): it renders a sized placeholder (reserve the viz frame height → no layout shift) until the section nears the viewport, then mounts the real component and keeps it mounted. **Why it matters:** lessons now carry several glow-filter explorers each; mounting + animating all of them at once tanks scroll perf AND hangs headless `captureScreenshot` (see `screenshot-qa-harness.md`). Don't remove this; if you add a new section `kind`, route it through the same gate where it makes sense.

## Don't over-stuff a lesson

Adding a 4th/5th heavy explorer to one lesson is diminishing returns and a perf cost. If no lesson is a natural home for a viz, that's a signal to write a proper lesson for it (or skip), not to force it onto an adjacent topic.
