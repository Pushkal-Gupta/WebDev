import React, { useMemo, useState, useCallback } from 'react';
import { RotateCcw, StepForward, SkipForward } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Graph for f = a*b + sin(c)
//   v1 = a, v2 = b, v3 = c
//   v4 = v1 * v2     (mul)
//   v5 = sin(v3)     (sin)
//   v6 = v4 + v5     (add) = f
// Forward fills values v1..v6, backward fills adjoints bar(v6..v1).
//
// Sequence of "steps": 6 forward (assign each node's value) then 6 backward
// (assign each adjoint). Step 0 = nothing computed.

function buildTrace(a, b, c) {
  const v1 = a, v2 = b, v3 = c;
  const v4 = v1 * v2;
  const v5 = Math.sin(v3);
  const v6 = v4 + v5;
  // adjoints
  const g6 = 1;
  const g4 = g6 * 1;           // d(add)/d(v4) = 1
  const g5 = g6 * 1;           // d(add)/d(v5) = 1
  const g3 = g5 * Math.cos(v3); // d(sin)/d(v3) = cos
  const g1 = g4 * v2;           // d(mul)/d(v1) = v2
  const g2 = g4 * v1;           // d(mul)/d(v2) = v1
  return {
    values: { v1, v2, v3, v4, v5, v6 },
    grads: { v6: g6, v4: g4, v5: g5, v3: g3, v1: g1, v2: g2 },
  };
}

// node layout
const NODES = {
  v1: { x: 70, y: 70, label: 'a', kind: 'in' },
  v2: { x: 70, y: 175, label: 'b', kind: 'in' },
  v3: { x: 70, y: 285, label: 'c', kind: 'in' },
  v4: { x: 260, y: 120, label: '×', kind: 'op' },
  v5: { x: 260, y: 285, label: 'sin', kind: 'op' },
  v6: { x: 440, y: 200, label: '+', kind: 'op' },
};
const EDGES = [
  ['v1', 'v4'], ['v2', 'v4'], ['v3', 'v5'], ['v4', 'v6'], ['v5', 'v6'],
];

// order of node reveals
const FWD_ORDER = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'];
const BWD_ORDER = ['v6', 'v4', 'v5', 'v3', 'v1', 'v2'];
const TOTAL = FWD_ORDER.length + BWD_ORDER.length; // 12

const LOCAL_DERIV = {
  'v1->v4': (val) => `∂×/∂a = b = ${snap(val.v2, 2)}`,
  'v2->v4': (val) => `∂×/∂b = a = ${snap(val.v1, 2)}`,
  'v3->v5': (val) => `∂sin/∂c = cos c = ${snap(Math.cos(val.v3), 2)}`,
  'v4->v6': () => '∂+/∂(×) = 1',
  'v5->v6': () => '∂+/∂(sin) = 1',
};

export default function AutodiffGraphViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [c, setC] = useState(1);
  const [step, setStep] = useState(0);

  const trace = useMemo(() => buildTrace(a, b, c), [a, b, c]);

  // which nodes have values shown / adjoints shown, and the currently active node
  const fwdDone = Math.min(step, FWD_ORDER.length);
  const bwdDone = Math.max(0, step - FWD_ORDER.length);
  const valueShown = new Set(FWD_ORDER.slice(0, fwdDone));
  const gradShown = new Set(BWD_ORDER.slice(0, bwdDone));

  let activeNode = null;
  let phase = 'idle';
  if (step > 0 && step <= FWD_ORDER.length) { activeNode = FWD_ORDER[step - 1]; phase = 'forward'; }
  else if (step > FWD_ORDER.length) { activeNode = BWD_ORDER[step - 1 - FWD_ORDER.length]; phase = 'backward'; }

  const next = useCallback(() => setStep((s) => Math.min(TOTAL, s + 1)), []);
  const runAll = useCallback(() => setStep(TOTAL), []);
  const reset = useCallback(() => { setStep(0); setA(2); setB(3); setC(1); }, []);

  function edgeActive(from, to) {
    // forward: edge active when target value just computed; backward: when source adjoint flowing
    if (phase === 'forward' && to === activeNode) return true;
    if (phase === 'backward' && from === activeNode) return true;
    return false;
  }

  const f = trace.values.v6;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px' }}>
          <defs>
            <marker id="ag-fwd" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7 Z" fill="var(--hue-sky)" />
            </marker>
            <marker id="ag-bwd" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7 Z" fill="var(--hue-pink)" />
            </marker>
            <marker id="ag-dim" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7 Z" fill="var(--border)" />
            </marker>
          </defs>

          <text x={20} y={22} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
            f = a·b + sin(c)
          </text>
          <text x={W - 20} y={22} fontSize="9" fontFamily="var(--mono)" textAnchor="end"
                fill={phase === 'forward' ? 'var(--hue-sky)' : phase === 'backward' ? 'var(--hue-pink)' : 'var(--text-dim)'}>
            {phase === 'forward' ? 'FORWARD PASS — fill values' : phase === 'backward' ? 'BACKWARD PASS — accumulate adjoints' : 'press Step to walk the graph'}
          </text>

          {/* edges */}
          {EDGES.map(([from, to]) => {
            const A1 = NODES[from], B1 = NODES[to];
            const r = 26;
            const dx = B1.x - A1.x, dy = B1.y - A1.y;
            const len = Math.hypot(dx, dy);
            const sx = A1.x + (dx / len) * r, sy = A1.y + (dy / len) * r;
            const ex = B1.x - (dx / len) * r, ey = B1.y - (dy / len) * r;
            const act = edgeActive(from, to);
            const reverse = phase === 'backward';
            const stroke = act ? (reverse ? 'var(--hue-pink)' : 'var(--hue-sky)') : 'var(--border)';
            const marker = act ? (reverse ? 'url(#ag-bwd)' : 'url(#ag-fwd)') : 'url(#ag-dim)';
            // backward edges draw pink arrow head pointing back to source
            return (
              <g key={`${from}-${to}`}>
                {reverse ? (
                  <line x1={ex} y1={ey} x2={sx} y2={sy} stroke={stroke} strokeWidth={act ? 2.2 : 1} markerEnd={marker} opacity={act ? 1 : 0.55} />
                ) : (
                  <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={stroke} strokeWidth={act ? 2.2 : 1} markerEnd={marker} opacity={act ? 1 : 0.55} />
                )}
                {act && (
                  <text x={(sx + ex) / 2} y={(sy + ey) / 2 - 5} fontSize="7" fontFamily="var(--mono)"
                        fill={reverse ? 'var(--hue-pink)' : 'var(--hue-sky)'} textAnchor="middle">
                    {reverse && LOCAL_DERIV[`${to}->${from}`] ? LOCAL_DERIV[`${to}->${from}`](trace.values) : ''}
                  </text>
                )}
              </g>
            );
          })}

          {/* nodes */}
          {Object.entries(NODES).map(([id, n]) => {
            const isActive = id === activeNode;
            const hasVal = valueShown.has(id);
            const hasGrad = gradShown.has(id);
            const fill = n.kind === 'in' ? 'rgba(var(--accent-rgb), 0.10)' : 'var(--surface)';
            const stroke = isActive
              ? (phase === 'backward' ? 'var(--hue-pink)' : 'var(--hue-sky)')
              : (hasVal ? 'var(--accent)' : 'var(--border)');
            return (
              <g key={id}>
                <circle cx={n.x} cy={n.y} r="26" fill={fill} stroke={stroke} strokeWidth={isActive ? 2.6 : 1.4} />
                <text x={n.x} y={n.y - 4} fontSize="13" fontFamily="var(--mono)" fill="var(--text-main)" textAnchor="middle" fontWeight="700">
                  {n.label}
                </text>
                {/* value below the symbol */}
                {hasVal && (
                  <text x={n.x} y={n.y + 11} fontSize="8.5" fontFamily="var(--mono)" fill="var(--accent)" textAnchor="middle">
                    {snap(trace.values[id], 2)}
                  </text>
                )}
                {/* adjoint badge */}
                {hasGrad && (
                  <g>
                    <rect x={n.x + 16} y={n.y + 14} width="42" height="15" rx="3"
                          fill="rgba(var(--accent-rgb), 0.12)" stroke="var(--hue-pink)" strokeWidth="0.8" />
                    <text x={n.x + 37} y={n.y + 24.5} fontSize="7.5" fontFamily="var(--mono)" fill="var(--hue-pink)" textAnchor="middle">
                      ∂f={snap(trace.grads[id], 2)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* output banner */}
          <text x={W / 2} y={H - 8} fontSize="9" fontFamily="var(--mono)" textAnchor="middle" fill="var(--text-dim)">
            f = {snap(f, 3)}  ·  ∂f/∂a = {snap(trace.grads.v1, 3)}  ·  ∂f/∂b = {snap(trace.grads.v2, 3)}  ·  ∂f/∂c = {snap(trace.grads.v3, 3)}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">a</span>
          <input type="range" min="-3" max="3" step="0.5" value={a} onChange={(e) => { setA(parseFloat(e.target.value)); setStep(0); }} />
          <span className="mlviz-slider-val">{snap(a, 1)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">b</span>
          <input type="range" min="-3" max="3" step="0.5" value={b} onChange={(e) => { setB(parseFloat(e.target.value)); setStep(0); }} />
          <span className="mlviz-slider-val">{snap(b, 1)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">c</span>
          <input type="range" min="-3.1" max="3.1" step="0.1" value={c} onChange={(e) => { setC(parseFloat(e.target.value)); setStep(0); }} />
          <span className="mlviz-slider-val">{snap(c, 1)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">now</span>
            <span className="mlviz-val">
              {phase === 'forward' && activeNode ? `forward: ${activeNode} = ${snap(trace.values[activeNode], 3)}`
                : phase === 'backward' && activeNode ? `backward: adjoint of ${activeNode} = ${snap(trace.grads[activeNode], 3)}`
                : 'graph idle'}
            </span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">rule</span>
            <span className="mlviz-sub">
              each backward edge multiplies the upstream adjoint by the local derivative and accumulates into the parent (a feeds × and is also reached only once here)
            </span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={next} disabled={step >= TOTAL}>
            <StepForward size={13} />
            <span>Step {step}/{TOTAL}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={runAll} disabled={step >= TOTAL}>
            <SkipForward size={13} />
            <span>Run all</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          forward (sky) fills every node value bottom-up · backward (pink) starts at f with adjoint 1 and walks back, each step = upstream adjoint × local derivative · the inputs end holding the exact gradient
        </div>
      </div>
    </div>
  );
}
