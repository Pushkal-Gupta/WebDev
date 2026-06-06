import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import './MLViz.css';

const W = 460;
const H = 280;

// Node layout — columns left → right
const NODES = {
  a:    { x: 50,  y: 60,  r: 22, kind: 'input',  label: 'a' },
  b:    { x: 50,  y: 140, r: 22, kind: 'input',  label: 'b' },
  c:    { x: 50,  y: 220, r: 22, kind: 'input',  label: 'c' },
  plus: { x: 200, y: 100, r: 26, kind: 'op',     label: '+' },
  mul:  { x: 330, y: 150, r: 26, kind: 'op',     label: '×' },
  y:    { x: 420, y: 150, r: 22, kind: 'output', label: 'y' },
};

// Edges (from → to). Each edge will carry a gradient (dy/d(from)) in the backward pass.
const EDGES = [
  { id: 'a-plus', from: 'a',    to: 'plus' },
  { id: 'b-plus', from: 'b',    to: 'plus' },
  { id: 'plus-mul', from: 'plus', to: 'mul' },
  { id: 'c-mul', from: 'c',    to: 'mul' },
  { id: 'mul-y', from: 'mul',  to: 'y' },
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function edgeEndpoints(from, to) {
  const fx = NODES[from].x, fy = NODES[from].y, fr = NODES[from].r;
  const tx = NODES[to].x,   ty = NODES[to].y,   tr = NODES[to].r;
  const dx = tx - fx, dy = ty - fy;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  return {
    x1: fx + ux * fr,
    y1: fy + uy * fr,
    x2: tx - ux * tr,
    y2: ty - uy * tr,
    mx: (fx + tx) / 2,
    my: (fy + ty) / 2,
  };
}

const STEP_DELAY = 360;

// Forward order — nodes light up left → right
const FORWARD_ORDER = ['a', 'b', 'c', 'plus', 'mul', 'y'];
// Backward order — edges/nodes light up right → left
const BACKWARD_ORDER = [
  { kind: 'node', id: 'y' },
  { kind: 'edge', id: 'mul-y' },
  { kind: 'node', id: 'mul' },
  { kind: 'edge', id: 'plus-mul' },
  { kind: 'edge', id: 'c-mul' },
  { kind: 'node', id: 'plus' },
  { kind: 'node', id: 'c' },
  { kind: 'edge', id: 'a-plus' },
  { kind: 'edge', id: 'b-plus' },
  { kind: 'node', id: 'a' },
  { kind: 'node', id: 'b' },
];

export default function BackpropViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(-1);
  const [c, setC] = useState(3);

  const [fwdLit, setFwdLit] = useState(new Set());
  const [bwdLitNodes, setBwdLitNodes] = useState(new Set());
  const [bwdLitEdges, setBwdLitEdges] = useState(new Set());
  const [phase, setPhase] = useState('idle'); // 'idle' | 'forward' | 'backward' | 'done'
  const [running, setRunning] = useState(false);

  const timerRef = useRef(null);

  // forward values
  const s = a + b;           // plus node
  const y = s * c;           // mul node / output

  // backward gradients (one per edge — gradient of y w.r.t. the FROM node's output flowing into the TO node)
  // dy/dy = 1
  // dy/d(a+b) = c  -> edge plus-mul
  // dy/dc = (a+b) -> edge c-mul
  // dy/da = c     -> edge a-plus  (since d(a+b)/da = 1, chain by c)
  // dy/db = c     -> edge b-plus
  const grads = {
    'mul-y': 1,
    'plus-mul': c,
    'c-mul': s,
    'a-plus': c,
    'b-plus': c,
  };

  // Node-level gradients (dy/dnode_output)
  const nodeGrads = {
    y: 1,
    mul: 1,
    plus: c,
    c: s,
    a: c,
    b: c,
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const handleReset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setPhase('idle');
    setFwdLit(new Set());
    setBwdLitNodes(new Set());
    setBwdLitEdges(new Set());
  }, []);

  // re-reset transient lighting when sliders move during idle
  useEffect(() => {
    if (phase === 'idle') {
      setFwdLit(new Set());
      setBwdLitNodes(new Set());
      setBwdLitEdges(new Set());
    }
  }, [a, b, c, phase]);

  const runForward = useCallback(() => {
    clearTimer();
    setRunning(true);
    setPhase('forward');
    setFwdLit(new Set());
    setBwdLitNodes(new Set());
    setBwdLitEdges(new Set());

    let i = 0;
    const tick = () => {
      setFwdLit((prev) => {
        const next = new Set(prev);
        next.add(FORWARD_ORDER[i]);
        return next;
      });
      i += 1;
      if (i >= FORWARD_ORDER.length) {
        setRunning(false);
        setPhase('done');
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 60);
  }, []);

  const runBackward = useCallback(() => {
    clearTimer();
    // ensure forward values are visible during backward pass
    setFwdLit(new Set(FORWARD_ORDER));
    setBwdLitNodes(new Set());
    setBwdLitEdges(new Set());
    setRunning(true);
    setPhase('backward');

    let i = 0;
    const tick = () => {
      const step = BACKWARD_ORDER[i];
      if (step.kind === 'node') {
        setBwdLitNodes((prev) => {
          const next = new Set(prev);
          next.add(step.id);
          return next;
        });
      } else {
        setBwdLitEdges((prev) => {
          const next = new Set(prev);
          next.add(step.id);
          return next;
        });
      }
      i += 1;
      if (i >= BACKWARD_ORDER.length) {
        setRunning(false);
        setPhase('done');
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 60);
  }, []);

  const renderNodeColor = (id) => {
    if (NODES[id].kind === 'output') return 'var(--hue-pink, #ff66cc)';
    if (NODES[id].kind === 'op') return 'var(--hue-sky, #5ecbff)';
    return 'var(--accent)';
  };

  const nodeValue = (id) => {
    if (id === 'a') return a;
    if (id === 'b') return b;
    if (id === 'c') return c;
    if (id === 'plus') return s;
    if (id === 'mul') return y;
    if (id === 'y') return y;
    return 0;
  };

  const fwdActive = (id) => fwdLit.has(id);
  const bwdNodeActive = (id) => bwdLitNodes.has(id);
  const bwdEdgeActive = (id) => bwdLitEdges.has(id);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <marker
              id="bp-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
            <marker
              id="bp-arrow-grad"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-mint, #7be0c0)" />
            </marker>
          </defs>

          {/* Edges — drawn first, behind nodes */}
          {EDGES.map((e) => {
            const ep = edgeEndpoints(e.from, e.to);
            const isBwd = bwdEdgeActive(e.id);
            return (
              <g key={e.id}>
                <line
                  x1={ep.x1}
                  y1={ep.y1}
                  x2={ep.x2}
                  y2={ep.y2}
                  stroke={isBwd ? 'var(--hue-mint, #7be0c0)' : 'var(--border)'}
                  strokeWidth={isBwd ? 2.2 : 1.4}
                  markerEnd={isBwd ? 'url(#bp-arrow-grad)' : 'url(#bp-arrow)'}
                  opacity={isBwd ? 1 : 0.85}
                />
                {/* gradient label on the edge */}
                <g
                  transform={`translate(${ep.mx}, ${ep.my - 8})`}
                  opacity={isBwd ? 1 : 0.4}
                >
                  <rect
                    x={-22}
                    y={-10}
                    width={44}
                    height={16}
                    rx={4}
                    ry={4}
                    fill="var(--surface)"
                    stroke={isBwd ? 'var(--hue-mint, #7be0c0)' : 'var(--border)'}
                    strokeWidth={isBwd ? 1.2 : 0.8}
                  />
                  <text
                    x={0}
                    y={2}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="var(--mono, monospace)"
                    fill={isBwd ? 'var(--hue-mint, #7be0c0)' : 'var(--text-dim)'}
                    fontWeight={isBwd ? 700 : 500}
                  >
                    {snap(grads[e.id])}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Nodes */}
          {Object.entries(NODES).map(([id, n]) => {
            const color = renderNodeColor(id);
            const lit = fwdActive(id);
            const bwd = bwdNodeActive(id);
            return (
              <g key={id}>
                {/* forward halo */}
                {lit && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + 6}
                    fill={color}
                    opacity={0.14}
                  />
                )}
                {/* backward halo */}
                {bwd && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + 9}
                    fill="none"
                    stroke="var(--hue-mint, #7be0c0)"
                    strokeWidth="1.4"
                    strokeDasharray="3 3"
                    opacity={0.9}
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill={lit ? color : 'var(--surface)'}
                  stroke={color}
                  strokeWidth={lit ? 2 : 1.4}
                  opacity={lit ? 1 : 0.85}
                />
                {/* label inside node */}
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fontSize={n.kind === 'op' ? 16 : 13}
                  fontFamily="var(--serif, serif)"
                  fontStyle={n.kind === 'op' ? 'normal' : 'italic'}
                  fontWeight="700"
                  fill={lit ? 'var(--bg)' : 'var(--text-main)'}
                >
                  {n.label}
                </text>
                {/* forward value above/below the node */}
                <text
                  x={n.x}
                  y={n.kind === 'input' ? n.y + n.r + 14 : n.y - n.r - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                  fill={lit ? color : 'var(--text-dim)'}
                  opacity={lit ? 1 : 0.7}
                >
                  {snap(nodeValue(id))}
                </text>
                {/* backward gradient label, shown when bwd lit */}
                {bwd && (
                  <text
                    x={n.x}
                    y={n.kind === 'input' ? n.y + n.r + 26 : n.y - n.r - 18}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="var(--mono, monospace)"
                    fill="var(--hue-mint, #7be0c0)"
                    fontWeight="700"
                  >
                    ∂y/∂{n.label === '+' ? 's' : (n.label === '×' ? 'p' : n.label)} = {snap(nodeGrads[id])}
                  </text>
                )}
              </g>
            );
          })}

          {/* Title strip */}
          <text
            x={W - 10}
            y={20}
            textAnchor="end"
            fontSize="11"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fill="var(--text-dim)"
          >
            y = (a + b) · c
          </text>

          {/* Phase indicator */}
          <text
            x={10}
            y={20}
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fill={phase === 'forward' ? 'var(--accent)' : phase === 'backward' ? 'var(--hue-mint, #7be0c0)' : 'var(--text-dim)'}
            letterSpacing="0.12em"
          >
            {phase === 'forward'  ? 'FORWARD →'
            : phase === 'backward' ? '← BACKWARD'
            : phase === 'done'     ? 'COMPLETE'
            : 'IDLE'}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>y</span>
          <span className="mlviz-val">{snap(y)}</span>
          <span className="mlviz-sub">a + b = {snap(s)}</span>
          <span className="mlviz-sub">(a+b) · c = {snap(y)}</span>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">a</span>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={a}
              onChange={(e) => setA(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(a, 1)}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">b</span>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={b}
              onChange={(e) => setB(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(b, 1)}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">c</span>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={c}
              onChange={(e) => setC(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(c, 1)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={runForward}
            disabled={running}
          >
            <ArrowRight size={13} />
            <span>Forward</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={runBackward}
            disabled={running}
          >
            <ArrowLeft size={13} />
            <span>Backward</span>
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

        <div className="mlviz-hint">slide a, b, c — then forward to compute y, backward to flow gradients</div>
      </div>
    </div>
  );
}
