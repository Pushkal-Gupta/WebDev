# viz-component-patterns

How to write a new SVG viz component without re-hitting bugs we've seen 30+ times. Applies to anything in `src/components/ml/viz/` or `src/components/learn/viz/`.

## The contract every viz must satisfy

1. **Theme tokens only.** `var(--accent)`, `var(--easy)`, `var(--hard)`, `var(--hue-sky)`, `var(--hue-pink)`, `var(--hue-mint)`, `var(--text-main)`, `var(--text-dim)`, `var(--border)`, `var(--bg)`, `var(--surface)`. **No hardcoded hex anywhere.** Reviewers grep for `#[0-9A-Fa-f]{3,6}` and reject.
2. **Lucide-react icons only.** No emoji. If a brand icon (Github, X) isn't in Lucide, drop in the path SVG inline.
3. **SVG sizing**: `viewBox` + `preserveAspectRatio="xMidYMid meet"` + `width: 100%`. Never set fixed pixel widths. See [`scrollbar-rule.md`](./scrollbar-rule.md) — the viz must reflow at any container width without producing an inner scrollbar.
4. **Self-contained.** DSA viz live in `learn/viz/`, not registered anywhere — pages import directly. ML viz register in `src/components/ml/MLLesson.jsx`'s `VIZ_REGISTRY`.

## The two lint anti-patterns

These will fire the `react-hooks/set-state-in-effect` rule and reviewers reject. Both have been fixed across 60+ viz files; don't reintroduce.

**Anti-pattern A — ref read during render:**

```js
// BAD
const rngRef = useRef(lcg(seed));
const [plan, setPlan] = useState(() => fn(rngRef.current));  // ⚠️ ref accessed in render
```

```js
// GOOD
const rng = useMemo(() => mulberry32(seed), [seed]);
const [plan, setPlan] = useState(() => fn(rng));
```

**Anti-pattern B — setState inside auto-play effect:**

```js
// BAD
useEffect(() => {
  if (!isRunning) return;
  if (stepIdx >= totalSteps - 1) {
    setIsRunning(false);   // ⚠️ cascading setState
    return;
  }
  // ...
}, [isRunning, stepIdx]);
```

```js
// GOOD — derive isRunning instead
const [isRunningRaw, setIsRunning] = useState(false);
const isRunning = isRunningRaw && stepIdx < totalSteps - 1;
useEffect(() => {
  if (!isRunning) return;
  // ...
}, [isRunning]);
```

## CSS class naming convention

Use the established `<prefix>-*` prefix that matches the component name. For `RabinKarpViz` → `rkv-stage`, `rkv-svg`, `rkv-controls`, `rkv-buttons`, `rkv-btn`, `rkv-btn-primary`, `rkv-metrics`, `rkv-arith`. Reference `RabinKarpViz.css` or `ZAlgorithmViz.css` as the canonical example.

For ML viz, use the shared `mlviz-*` family: `mlviz-wrap`, `mlviz-stage`, `mlviz-svg`, `mlviz-readout`, `mlviz-controls`, `mlviz-btn`. Reference `KnowledgeDistillationViz.jsx`.

## Required interactivity bar

A viz that's just an animated SVG without user control will be rejected. Every viz must let the reader DO something:

- Play / Pause / Step / Reset for animations
- Slider(s) for parameters that visibly change the diagram
- Toggle(s) for variant comparisons (e.g. "with residual / without")
- Live readout(s) showing the current computation (KL value, matching size, etc.)

A static `<svg>` with arrows pointing at things is a placeholder, not a viz.

## Reference list (working viz to copy from)

- ML (mlviz CSS): `KnowledgeDistillationViz`, `QuantizationViz`, `MixedPrecisionViz`, `AttentionRolloutViz`
- DSA (prefixed CSS): `RabinKarpViz`, `ZAlgorithmViz`, `BellmanFordViz`, `DinicMaxFlowViz`

---
*Last updated: 2026-06-10.*
