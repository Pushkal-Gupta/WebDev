import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, StepForward, ArrowLeft, ArrowRight } from 'lucide-react';
import './MLViz.css';

const W = 640;
const H = 320;
const R = 24;

// Node layout — leaves on the left, ops flowing rightward to the loss.
const NODES = {
  x:    { id: 'x',    kind: 'leaf', label: 'x',    x: 60,  y: 80,  color: 'var(--accent)' },
  y:    { id: 'y',    kind: 'leaf', label: 'y',    x: 60,  y: 200, color: 'var(--hue-sky, #5ecbff)' },
  two:  { id: 'two',  kind: 'const', label: '2',   x: 60,  y: 280, color: 'var(--text-dim)' },
  a:    { id: 'a',    kind: 'op',   label: 'a',    op: '×',  x: 220, y: 140, color: 'var(--hue-violet, #b794f4)' },
  b:    { id: 'b',    kind: 'op',   label: 'b',    op: '+',  x: 360, y: 170, color: 'var(--hue-pink, #ff66cc)' },
  c:    { id: 'c',    kind: 'op',   label: 'c',    op: '( )²', x: 500, y: 170, color: 'var(--warning, #f5b042)' },
  loss: { id: 'loss', kind: 'out',  label: 'loss', x: 610, y: 170, color: 'var(--hue-mint, #7be0c0)' },
};

// Edges: from -> to (forward direction).
const EDGES = [
  { from: 'x',   to: 'a' },
  { from: 'two', to: 'a' },
  { from: 'a',   to: 'b' },
  { from: 'y',   to: 'b' },
  { from: 'b',   to: 'c' },
  { from: 'c',   to: 'loss' },
];

// Per node, which other node ids it gets a "grad" from when going backward.
// We use these for the backward edge highlight.
const FORWARD_STEPS = ['x', 'y', 'two', 'a', 'b', 'c', 'loss'];
const BACKWARD_STEPS = ['loss', 'c', 'b', 'a', 'x']; // y picks up at b step, two stays gradless

const STEP_DELAY = 560;

function snap(v, p = 3) {
  if (!Number.isFinite(v)) return 'NaN';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toString();
}

function endpoints(a, b, ra = R, rb = R) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  return {
    x1: a.x + ux * ra,
    y1: a.y + uy * ra,
    x2: b.x - ux * rb,
    y2: b.y - uy * rb,
    mx: (a.x + b.x) / 2,
    my: (a.y + b.y) / 2,
  };
}

export default function AutogradTraceViz() {
  const [x, setX] = useState(1.5);
  const [y, setY] = useState(1.0);

  const [phase, setPhase] = useState('idle'); // 'idle' | 'forward' | 'backward' | 'done'
  const [stepIdx, setStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  // Forward values
  const aVal = x * 2;
  const bVal = aVal + y;
  const cVal = bVal * bVal;
  const lossVal = cVal;

  // Backward gradients
  const dLoss = 1;
  const dc = 1;                  // loss = c => d loss / d c = 1
  const db = 2 * bVal;           // c = b^2 => d c / d b = 2b
  const da = db;                 // b = a + y => d b / d a = 1
  const dy = db;                 // b = a + y => d b / d y = 1
  const dx = 2 * da;             // a = x*2 => d a / d x = 2
  // const has no grad

  const eps = useMemo(() => {
    const map = {};
    EDGES.forEach((e) => {
      const a = NODES[e.from];
      const b = NODES[e.to];
      map[`${e.from}->${e.to}`] = endpoints(a, b);
    });
    return map;
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const [prevTrigger, setPrevTrigger] = useState({ x, y, phase });
  if (prevTrigger.x !== x || prevTrigger.y !== y || prevTrigger.phase !== phase) {
    setPrevTrigger({ x, y, phase });
    if (phase === 'idle') setStepIdx(-1);
  }

  const handleReset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setPhase('idle');
    setStepIdx(-1);
  }, []);

  const runAll = useCallback(() => {
    clearTimer();
    setRunning(true);
    setPhase('forward');
    setStepIdx(-1);

    let i = 0;
    let local = 'forward';
    const tick = () => {
      if (local === 'forward') {
        setStepIdx(i);
        i += 1;
        if (i >= FORWARD_STEPS.length) {
          local = 'backward';
          i = 0;
          setPhase('backward');
          timerRef.current = setTimeout(tick, STEP_DELAY + 200);
          return;
        }
      } else {
        setStepIdx(i);
        i += 1;
        if (i >= BACKWARD_STEPS.length) {
          setRunning(false);
          setPhase('done');
          return;
        }
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 80);
  }, []);

  const handleStep = useCallback(() => {
    clearTimer();
    if (phase === 'idle' || phase === 'done') {
      setPhase('forward');
      setStepIdx(0);
      return;
    }
    if (phase === 'forward') {
      const next = stepIdx + 1;
      if (next >= FORWARD_STEPS.length) {
        setPhase('backward');
        setStepIdx(0);
      } else {
        setStepIdx(next);
      }
      return;
    }
    if (phase === 'backward') {
      const next = stepIdx + 1;
      if (next >= BACKWARD_STEPS.length) {
        setPhase('done');
      } else {
        setStepIdx(next);
      }
    }
  }, [phase, stepIdx]);

  const fwdReached = (id) => {
    if (phase === 'forward') {
      return FORWARD_STEPS.slice(0, stepIdx + 1).includes(id);
    }
    if (phase === 'backward' || phase === 'done') return true;
    return false;
  };

  const bwdReached = (id) => {
    if (phase === 'backward') {
      const cur = BACKWARD_STEPS.slice(0, stepIdx + 1);
      // When backward step is 'a' (propagating from b to its parents), both
      // 'a' AND 'y' receive grad at the same time (plus distributes).
      if (id === 'y') return cur.includes('a');
      return cur.includes(id);
    }
    if (phase === 'done') {
      if (id === 'two') return false;
      return true;
    }
    return false;
  };

  // edge active for forward animation (only on the step where the *to* node is computed)
  const fwdEdgeActive = (from, to) => phase === 'forward' && FORWARD_STEPS[stepIdx] === to;
  const bwdEdgeActive = (from, _to) => phase === 'backward' && BACKWARD_STEPS[stepIdx] === from;

  // forward edges are lit when the destination has been reached
  const fwdEdgeLit = (to) => {
    if (phase === 'forward') return FORWARD_STEPS.slice(0, stepIdx + 1).includes(to);
    return phase === 'backward' || phase === 'done';
  };

  // backward edges are lit when source has been reached in backward phase
  const bwdEdgeLit = (from, to) => {
    if (phase !== 'backward' && phase !== 'done') return false;
    if (phase === 'done') {
      // constant gets no backward edge
      if (from === 'a' && to === 'two') return false;
      return true;
    }
    const cur = BACKWARD_STEPS.slice(0, stepIdx + 1);
    // edge lit if the source-node-of-forward is reached in backward
    // edge `from -> to` means forward; backward flows `to -> from`
    // So the backward edge is "lit" when `to` (destination of forward) has been
    // visited and we are about to propagate to `from`.
    if (cur.includes(to)) {
      if (from === 'two') return false;
      return true;
    }
    return false;
  };

  const phaseLabel =
      phase === 'forward'  ? 'FORWARD →'
    : phase === 'backward' ? '← BACKWARD'
    : phase === 'done'     ? 'COMPLETE'
    : 'IDLE';

  const phaseColor =
      phase === 'forward'  ? 'var(--accent)'
    : phase === 'backward' ? 'var(--hue-mint, #7be0c0)'
    : 'var(--text-dim)';

  // Value lookup
  const valFor = (id) => {
    if (id === 'x') return x;
    if (id === 'y') return y;
    if (id === 'two') return 2;
    if (id === 'a') return aVal;
    if (id === 'b') return bVal;
    if (id === 'c') return cVal;
    if (id === 'loss') return lossVal;
    return 0;
  };

  const gradFor = (id) => {
    if (id === 'x') return dx;
    if (id === 'y') return dy;
    if (id === 'two') return null;
    if (id === 'a') return da;
    if (id === 'b') return db;
    if (id === 'c') return dc;
    if (id === 'loss') return dLoss;
    return null;
  };

  // Backward "current" caption shown when an edge is actively propagating.
  const currentBackwardCaption = () => {
    if (phase !== 'backward') return null;
    const s = BACKWARD_STEPS[stepIdx];
    if (s === 'loss') return { tex: 'd loss = 1', sub: 'seed with 1' };
    if (s === 'c')    return { tex: 'd c = d loss · 1 = 1', sub: 'loss = c, identity' };
    if (s === 'b')    return { tex: `d b = d c · 2·b = 2 · ${snap(bVal, 3)} = ${snap(db, 3)}`, sub: 'c = b², so dc/db = 2b' };
    if (s === 'a')    return { tex: `d a = d b · 1 = ${snap(da, 3)} ;  d y = d b · 1 = ${snap(dy, 3)}`, sub: 'b = a + y, plus distributes' };
    if (s === 'x')    return { tex: `d x = d a · 2 = ${snap(dx, 3)}`, sub: 'a = x · 2, so da/dx = 2' };
    return null;
  };
  const currentBwd = currentBackwardCaption();

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <marker id="ag-fwd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="ag-fwd-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="ag-bwd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-mint, #7be0c0)" />
            </marker>
          </defs>

          <text x={10} y={20} fontSize="10" fontFamily="var(--mono, monospace)" fill={phaseColor} letterSpacing="0.12em" fontWeight="700">
            {phaseLabel}
          </text>
          <text x={W - 10} y={20} textAnchor="end" fontSize="11" fontFamily="var(--serif, serif)" fontStyle="italic" fill="var(--text-dim)">
            a = x · 2 ; b = a + y ; c = b² ; loss = c
          </text>

          {/* Forward edges */}
          {EDGES.map((e) => {
            const key = `${e.from}->${e.to}`;
            const ep = eps[key];
            const lit = fwdEdgeLit(e.to);
            const active = fwdEdgeActive(e.from, e.to);
            const opTag = NODES[e.to].op;
            return (
              <g key={`fwd-${key}`}>
                <line
                  x1={ep.x1} y1={ep.y1} x2={ep.x2} y2={ep.y2}
                  stroke={lit ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={lit ? 2 : 1.4}
                  markerEnd={lit ? 'url(#ag-fwd-arrow)' : 'url(#ag-fwd-arrow-dim)'}
                  opacity={lit ? 1 : 0.55}
                />
                {/* op label on the inbound edge from the first parent only */}
                {opTag && e.from === (e.to === 'a' ? 'x' : e.to === 'b' ? 'a' : e.to === 'c' ? 'b' : 'c') && (
                  <g transform={`translate(${ep.mx}, ${ep.my - 14})`}>
                    <rect x={-22} y={-11} width={44} height={18} rx={4} ry={4} fill="var(--surface)" stroke={lit ? 'var(--accent)' : 'var(--border)'} strokeWidth={lit ? 1.2 : 0.8} />
                    <text x={0} y={3} textAnchor="middle" fontSize="11" fontFamily="var(--serif, serif)" fontStyle="italic" fontWeight="700" fill={lit ? 'var(--accent)' : 'var(--text-dim)'}>
                      {opTag}
                    </text>
                  </g>
                )}
                {active && (
                  <circle r={5} fill="var(--accent)">
                    <animate attributeName="cx" from={ep.x1} to={ep.x2} dur="0.55s" fill="freeze" />
                    <animate attributeName="cy" from={ep.y1} to={ep.y2} dur="0.55s" fill="freeze" />
                    <animate attributeName="opacity" from="1" to="0.2" dur="0.55s" fill="freeze" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Backward edges — drawn as offset reverse arrows below the forward edges */}
          {EDGES.map((e) => {
            const key = `${e.from}->${e.to}`;
            const ep = eps[key];
            const lit = bwdEdgeLit(e.from, e.to);
            if (!lit) return null;
            const active = bwdEdgeActive(e.from, e.to);
            // offset perpendicular to edge so it doesn't overlap forward line
            const dx2 = ep.x2 - ep.x1;
            const dy2 = ep.y2 - ep.y1;
            const len = Math.hypot(dx2, dy2) || 1;
            const nx = -dy2 / len;
            const ny = dx2 / len;
            const off = 12;
            const x1 = ep.x2 + nx * off;
            const y1 = ep.y2 + ny * off;
            const x2 = ep.x1 + nx * off;
            const y2 = ep.y1 + ny * off;
            return (
              <g key={`bwd-${key}`}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="var(--hue-mint, #7be0c0)"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  markerEnd="url(#ag-bwd-arrow)"
                  opacity={0.95}
                />
                {active && (
                  <circle r={5} fill="var(--hue-mint, #7be0c0)">
                    <animate attributeName="cx" from={x1} to={x2} dur="0.55s" fill="freeze" />
                    <animate attributeName="cy" from={y1} to={y2} dur="0.55s" fill="freeze" />
                    <animate attributeName="opacity" from="1" to="0.2" dur="0.55s" fill="freeze" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {Object.values(NODES).map((n) => {
            const lit = fwdReached(n.id);
            const bwd = bwdReached(n.id) && n.kind !== 'const';
            const v = valFor(n.id);
            const g = gradFor(n.id);
            const isConst = n.kind === 'const';
            return (
              <g key={n.id}>
                {lit && (
                  <circle cx={n.x} cy={n.y} r={R + 6} fill={n.color} opacity={0.15} />
                )}
                {bwd && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={R + 10}
                    fill="none"
                    stroke="var(--hue-mint, #7be0c0)"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    opacity={0.9}
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={R}
                  fill={lit ? n.color : 'var(--surface)'}
                  stroke={n.color}
                  strokeWidth={lit ? 2.2 : 1.4}
                  opacity={lit ? 1 : 0.85}
                />
                <text
                  x={n.x}
                  y={n.y + 5}
                  textAnchor="middle"
                  fontSize={isConst ? 14 : 15}
                  fontFamily="var(--serif, serif)"
                  fontStyle={isConst ? 'normal' : 'italic'}
                  fontWeight="700"
                  fill={lit ? 'var(--bg)' : 'var(--text-main)'}
                >
                  {n.label}
                </text>
                {/* forward value above */}
                <text
                  x={n.x}
                  y={n.y - R - 8}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                  fill={lit ? n.color : 'var(--text-dim)'}
                  opacity={lit ? 1 : 0.7}
                >
                  = {snap(v, 3)}
                </text>
                {/* gradient below, only when bwd lit and not a constant */}
                {bwd && g !== null && (
                  <g>
                    <rect
                      x={n.x - 34}
                      y={n.y + R + 6}
                      width={68}
                      height={18}
                      rx={4}
                      ry={4}
                      fill="var(--surface)"
                      stroke="var(--hue-mint, #7be0c0)"
                      strokeWidth={1.1}
                    />
                    <text
                      x={n.x}
                      y={n.y + R + 19}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="var(--mono, monospace)"
                      fontWeight="700"
                      fill="var(--hue-mint, #7be0c0)"
                    >
                      grad {snap(g, 3)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        {/* live caption of what's happening this step */}
        {currentBwd && (
          <div className="mlviz-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
            <div style={{ color: 'var(--hue-mint, #7be0c0)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              Backward step
            </div>
            <div style={{ color: 'var(--text-main)', fontFamily: 'var(--mono, monospace)', fontSize: 13 }}>
              {currentBwd.tex}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{currentBwd.sub}</div>
          </div>
        )}

        {/* forward values readout */}
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>forward</span>
          <span className="mlviz-sub">a = x · 2 = {snap(aVal, 3)}</span>
          <span className="mlviz-sub" style={{ color: 'var(--hue-pink, #ff66cc)' }}>b = a + y = {snap(bVal, 3)}</span>
          <span className="mlviz-sub" style={{ color: 'var(--warning, #f5b042)' }}>c = b² = {snap(cVal, 3)}</span>
          <span className="mlviz-val">loss = {snap(lossVal, 3)}</span>
        </div>

        {/* gradients readout — always visible; dim when not yet computed */}
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #7be0c0)' }}>gradients</span>
          <span className="mlviz-sub" style={{ opacity: (phase === 'backward' || phase === 'done') ? 1 : 0.4 }}>
            d loss = {snap(dLoss, 3)}
          </span>
          <span className="mlviz-sub" style={{ opacity: bwdReached('c') ? 1 : 0.4 }}>
            d c = {snap(dc, 3)}
          </span>
          <span className="mlviz-sub" style={{ opacity: bwdReached('b') ? 1 : 0.4 }}>
            d b = {snap(db, 3)}
          </span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #7be0c0)' }}>leaves</span>
          <span className="mlviz-sub" style={{ opacity: bwdReached('a') ? 1 : 0.4 }}>
            d a = {snap(da, 3)}
          </span>
          <span className="mlviz-sub" style={{ opacity: bwdReached('x') ? 1 : 0.4, color: 'var(--accent)' }}>
            d x = {snap(dx, 3)}
          </span>
          <span className="mlviz-sub" style={{ opacity: bwdReached('y') ? 1 : 0.4, color: 'var(--hue-sky, #5ecbff)' }}>
            d y = {snap(dy, 3)}
          </span>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">x</span>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.05"
              value={x}
              onChange={(e) => setX(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(x, 2)}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">y</span>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.05"
              value={y}
              onChange={(e) => setY(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(y, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={runAll}
            disabled={running}
          >
            <Play size={13} />
            <span>Run</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          <ArrowRight size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
          forward traces x, y, 2 through ×, +, ² up to loss.
          <ArrowLeft size={11} style={{ verticalAlign: 'middle', margin: '0 2px 0 6px' }} />
          backward seeds d loss = 1 and walks chain-rule down to d x, d y.
        </div>
      </div>
    </div>
  );
}
