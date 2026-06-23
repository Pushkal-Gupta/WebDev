import { useId, useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, StepForward, Box, Layers, Ban } from 'lucide-react';
import './MonadFunctorViz.css';

const km = (expr, display = false) =>
  katex.renderToString(expr, { throwOnError: false, displayMode: display });

// Functor vs monad on Maybe/Option.
//   map  :: (a -> b)        -> Box a -> Box b           (apply inside, depth unchanged)
//   bind :: (a -> Box b)    -> Box a -> Box b           (apply, then flatten one layer)
// With map and a box-returning function you get Box<Box<T>> — nesting.
// bind flattens that extra layer; a None short-circuits the rest of the pipeline.

// Pipeline of three transforms applied to Some(2).
// Each transform's "plain" form (for map) and "box-returning" form (for bind).
const PIPELINE = [
  { label: 'x + 3', plain: (n) => n + 3, boxed: (n) => ({ kind: 'some', v: n + 3 }) },
  { label: 'x * 2', plain: (n) => n * 2, boxed: (n) => ({ kind: 'some', v: n * 2 }) },
  // A partial step: only defined for values <= 12, else None (division-by-zero analogy).
  {
    label: 'safe(x)',
    plain: (n) => (n <= 12 ? n - 1 : NaN),
    boxed: (n) => (n <= 12 ? { kind: 'some', v: n - 1 } : { kind: 'none' }),
  },
];

const START = 2;

// Render a (possibly nested) boxed value as a compact string.
function showBox(node) {
  if (node == null) return 'Some(2)';
  if (node.kind === 'none') return 'None';
  if (node.kind === 'some') {
    if (typeof node.v === 'object' && node.v && node.v.kind) {
      return `Some(${showBox(node.v)})`;
    }
    return `Some(${Number.isNaN(node.v) ? 'NaN' : node.v})`;
  }
  return String(node);
}

// nesting depth = number of Some wrappers.
function depth(node) {
  let d = 0;
  let cur = node;
  while (cur && cur.kind === 'some') {
    d += 1;
    cur = typeof cur.v === 'object' && cur.v && cur.v.kind ? cur.v : null;
  }
  return d;
}

function isNone(node) {
  let cur = node;
  while (cur && cur.kind === 'some') {
    cur = typeof cur.v === 'object' && cur.v && cur.v.kind ? cur.v : null;
  }
  return cur && cur.kind === 'none';
}

// innermost numeric payload (for readout)
function innerValue(node) {
  let cur = node;
  while (cur && cur.kind === 'some') {
    if (typeof cur.v === 'object' && cur.v && cur.v.kind) cur = cur.v;
    else return cur.v;
  }
  return null;
}

export default function MonadFunctorViz() {
  const uid = useId().replace(/:/g, '');
  const [mode, setMode] = useState('bind'); // 'map' | 'bind'
  const [step, setStep] = useState(0); // 0..PIPELINE.length
  const [injectNone, setInjectNone] = useState(false);

  // Compute the chain of boxed states for the chosen mode.
  const states = useMemo(() => {
    const out = [{ box: { kind: 'some', v: START }, applied: null, shortCircuit: false }];
    let cur = { kind: 'some', v: START };
    let dead = false;
    for (let i = 0; i < PIPELINE.length; i += 1) {
      const t = PIPELINE[i];
      if (dead) {
        out.push({ box: cur, applied: t.label, shortCircuit: true, skipped: true });
        continue;
      }
      const inner = innerValue(cur);
      if (mode === 'map') {
        // map: wrap result in a fresh layer (box-returning fn under map -> nesting).
        const res = t.boxed(inner);
        cur = { kind: 'some', v: res };
        out.push({ box: cur, applied: t.label, shortCircuit: false });
      } else {
        // bind: apply box-returning fn, flatten one layer.
        const forceNone = injectNone && i === 1;
        const res = forceNone ? { kind: 'none' } : t.boxed(inner);
        cur = res;
        const sc = res.kind === 'none';
        if (sc) dead = true;
        out.push({ box: cur, applied: t.label, shortCircuit: sc });
      }
    }
    return out;
  }, [mode, injectNone]);

  const visible = states.slice(0, step + 1);
  const final = visible[visible.length - 1].box;
  const finalDepth = depth(final);
  const shortCircuited = isNone(final);
  const canStep = step < PIPELINE.length;

  const reset = () => {
    setStep(0);
    setInjectNone(false);
  };

  // SVG geometry — vertical pipeline of boxed values, data flowing downward.
  const W = 520;
  const rowH = 78;
  const padT = 18;
  const H = padT + (PIPELINE.length + 1) * rowH + 10;
  const cx = W / 2;

  const renderNestedBox = (node, x, y, scale = 1) => {
    // draw concentric rounded rects per Some layer, innermost value at center.
    const layers = [];
    let cur = node;
    let d = 0;
    while (cur && cur.kind === 'some' && typeof cur.v === 'object' && cur.v && cur.v.kind) {
      layers.push('some');
      cur = cur.v;
      d += 1;
    }
    const isN = cur && cur.kind === 'none';
    const totalLayers = d + 1;
    const baseW = 150 * scale;
    const baseH = 46 * scale;
    const els = [];
    for (let i = totalLayers - 1; i >= 0; i -= 1) {
      const shrink = (totalLayers - 1 - i) * 7;
      els.push(
        <rect
          key={`l-${i}`}
          className={`mfv-box-layer ${i === 0 && isN ? 'is-none' : ''}`}
          x={x - baseW / 2 + shrink}
          y={y - baseH / 2 + shrink}
          width={baseW - shrink * 2}
          height={baseH - shrink * 2}
          rx={9 * scale}
        />
      );
    }
    const inner = isN ? 'None' : (cur && cur.kind === 'some' ? cur.v : null);
    els.push(
      <text key="val" className={`mfv-box-val ${isN ? 'is-none' : ''}`} x={x} y={y + 5 * scale}>
        {isN ? 'None' : Number.isNaN(inner) ? 'NaN' : inner}
      </text>
    );
    return els;
  };

  return (
    <div className="mfv">
      <div className="mfv-head">
        <h3 className="mfv-title">Functor vs monad — map keeps the box, bind flattens it</h3>
        <p className="mfv-sub">
          <span dangerouslySetInnerHTML={{ __html: km('\\text{map}') }} /> applies a plain function inside the box;{' '}
          <span dangerouslySetInnerHTML={{ __html: km('\\text{bind}') }} /> applies a box-returning function and
          flattens one layer. A None short-circuits the rest.
        </p>
      </div>

      <div className="mfv-controls">
        <div className="mfv-toggle">
          <button
            type="button"
            className={`mfv-toggle-btn ${mode === 'map' ? 'is-active' : ''}`}
            onClick={() => { setMode('map'); setStep(0); }}
          >
            map (Functor)
          </button>
          <button
            type="button"
            className={`mfv-toggle-btn ${mode === 'bind' ? 'is-active' : ''}`}
            onClick={() => { setMode('bind'); setStep(0); }}
          >
            flatMap / bind (Monad)
          </button>
        </div>
        <button
          type="button"
          className={`mfv-btn ${injectNone ? 'mfv-btn-primary' : ''}`}
          onClick={() => { setInjectNone((v) => !v); setStep(0); }}
          disabled={mode !== 'bind'}
          title={mode !== 'bind' ? 'None short-circuit applies in bind mode' : ''}
        >
          <Ban size={14} /> {injectNone ? 'None injected' : 'Inject None'}
        </button>
        <span className="mfv-spacer" aria-hidden="true" />
        <button type="button" className="mfv-btn mfv-btn-primary" onClick={() => canStep && setStep((s) => s + 1)} disabled={!canStep}>
          <StepForward size={14} /> Step
        </button>
        <button type="button" className="mfv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="mfv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mfv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {visible.map((s, i) => {
            const y = padT + i * rowH + rowH / 2;
            const stepLabel = i === 0 ? `Some(${START})` : s.applied;
            return (
              <g key={`row-${i}`}>
                {i > 0 && (
                  <line
                    className={`mfv-edge ${s.shortCircuit ? 'is-dead' : ''}`}
                    x1={cx}
                    y1={y - rowH / 2 - 2}
                    x2={cx}
                    y2={y - 24}
                    markerEnd={`url(#${uid}-arrow)`}
                  />
                )}
                {i > 0 && (
                  <text className={`mfv-op ${mode === 'map' ? 'is-map' : 'is-bind'}`} x={cx + 92} y={y - rowH / 2 + 18}>
                    {mode === 'map' ? 'map' : 'bind'}({stepLabel})
                  </text>
                )}
                {renderNestedBox(s.box, cx, y)}
                {s.skipped && (
                  <text className="mfv-skip" x={cx - 120} y={y + 3}>skipped</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mfv-metrics">
        <div className="mfv-metric">
          <span className="mfv-metric-label">current value</span>
          <span className="mfv-metric-value">{showBox(final)}</span>
        </div>
        <div className="mfv-metric">
          <span className="mfv-metric-label">nesting depth</span>
          <span className={`mfv-metric-value ${finalDepth > 1 ? 'is-warn' : ''}`}>
            {shortCircuited ? '0 (None)' : finalDepth}
          </span>
        </div>
        <div className="mfv-metric">
          <span className="mfv-metric-label">short-circuited?</span>
          <span className={`mfv-metric-value ${shortCircuited ? 'is-warn' : 'is-ok'}`}>
            {shortCircuited ? 'YES' : 'no'}
          </span>
        </div>
        <div className="mfv-metric">
          <span className="mfv-metric-label">signature</span>
          <span
            className="mfv-metric-math"
            dangerouslySetInnerHTML={{
              __html: km(
                mode === 'map'
                  ? '(a \\to b) \\to F\\,a \\to F\\,b'
                  : '(a \\to M\\,b) \\to M\\,a \\to M\\,b'
              ),
            }}
          />
        </div>
      </div>

      <div className={`mfv-verdict ${finalDepth > 1 ? 'is-nested' : ''} ${shortCircuited ? 'is-none' : ''}`}>
        {shortCircuited ? <Ban size={15} /> : finalDepth > 1 ? <Layers size={15} /> : <Box size={15} />}
        <span>
          {shortCircuited
            ? 'A None ended the chain: bind never unwraps a None, so every later step is skipped — exactly how Optional/Result error-handling avoids null checks.'
            : mode === 'map'
              ? `map applied a box-returning function and never flattened — the result is Box-in-Box (depth ${finalDepth}). To use the value you would have to unwrap twice.`
              : 'bind flattened each layer back to a single box (depth 1) — the pipeline stays composable no matter how many steps you chain.'}
        </span>
      </div>

      <div className="mfv-narration">
        <span className="mfv-narration-label">why it matters</span>
        <span className="mfv-narration-body">
          A functor lets you transform what's inside a context without leaving it. A monad adds one thing: the
          ability to <em>sequence</em> context-producing steps without the contexts piling up. That flatten is what
          makes <code>Optional</code> chains, <code>Promise.then</code>, list comprehensions, and parser combinators
          read like straight-line code while still threading failure, async, or nondeterminism underneath. Use{' '}
          <span dangerouslySetInnerHTML={{ __html: km('\\text{map}') }} /> when your function returns a plain value,{' '}
          <span dangerouslySetInnerHTML={{ __html: km('\\text{bind}') }} /> when it returns another box.
        </span>
      </div>
    </div>
  );
}
