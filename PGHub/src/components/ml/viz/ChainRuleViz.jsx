import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, StepForward, ArrowLeft, ArrowRight } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './MLViz.css';

const W = 520;
const H = 260;

const NODE_X = { x: 70, y: 130, r: 26 };
const NODE_Y = { x: 260, y: 130, r: 26 };
const NODE_L = { x: 450, y: 130, r: 26 };

const STEP_DELAY = 520;

const FUNCS = {
  identity: { label: 'identity (u)',     f: (u) => u,             df: () => 1,                  tex: 'u',       dtex: '1' },
  '2x':     { label: 'linear (2u)',      f: (u) => 2 * u,         df: () => 2,                  tex: '2u',      dtex: '2' },
  square:   { label: 'square (u^2)',     f: (u) => u * u,         df: (u) => 2 * u,             tex: 'u^2',     dtex: '2u' },
  sin:      { label: 'sin(u)',           f: (u) => Math.sin(u),   df: (u) => Math.cos(u),       tex: '\\sin(u)', dtex: '\\cos(u)' },
  cos:      { label: 'cos(u)',           f: (u) => Math.cos(u),   df: (u) => -Math.sin(u),      tex: '\\cos(u)', dtex: '-\\sin(u)' },
  exp:      { label: 'exp(u)',           f: (u) => Math.exp(u),   df: (u) => Math.exp(u),       tex: 'e^{u}',   dtex: 'e^{u}' },
};

const FORWARD_STEPS = ['x', 'edge-xy', 'y', 'edge-yL', 'L'];
const BACKWARD_STEPS = ['L', 'edge-yL', 'y', 'edge-xy', 'x'];

function snap(v, p = 3) {
  if (!Number.isFinite(v)) return 'NaN';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toString();
}

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

function endpoints(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  return {
    x1: a.x + ux * a.r,
    y1: a.y + uy * a.r,
    x2: b.x - ux * b.r,
    y2: b.y - uy * b.r,
    mx: (a.x + b.x) / 2,
    my: (a.y + b.y) / 2,
  };
}

export default function ChainRuleViz() {
  const [fKey, setFKey] = useState('square');
  const [gKey, setGKey] = useState('sin');
  const [x, setX] = useState(1.2);

  const [phase, setPhase] = useState('idle'); // 'idle' | 'forward' | 'backward' | 'done'
  const [stepIdx, setStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const f = FUNCS[fKey];
  const g = FUNCS[gKey];

  // forward values
  const yVal = f.f(x);
  const LVal = g.f(yVal);

  // gradients (backprop)
  const dL_dL = 1;
  const dL_dy = g.df(yVal); // = g'(y)
  const dy_dx = f.df(x);    // = f'(x)
  const dL_dx = dL_dy * dy_dx;

  const epXY = useMemo(() => endpoints(NODE_X, NODE_Y), []);
  const epYL = useMemo(() => endpoints(NODE_Y, NODE_L), []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  // when inputs change in idle, clear any prior lighting
  const [prevTrigger, setPrevTrigger] = useState({ x, fKey, gKey, phase });
  if (
    prevTrigger.x !== x ||
    prevTrigger.fKey !== fKey ||
    prevTrigger.gKey !== gKey ||
    prevTrigger.phase !== phase
  ) {
    setPrevTrigger({ x, fKey, gKey, phase });
    if (phase === 'idle') {
      setStepIdx(-1);
    }
  }

  const handleReset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setPhase('idle');
    setStepIdx(-1);
  }, []);

  // Run sequence: forward then backward, continuous
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

  // Step button: advance one step in the forward→backward sequence
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

  // Which atoms are currently lit?
  const fwdReached = (id) => {
    if (phase === 'forward') {
      const cur = FORWARD_STEPS.slice(0, stepIdx + 1);
      return cur.includes(id);
    }
    // After forward is done (during backward or done), all forward nodes stay lit
    if (phase === 'backward' || phase === 'done') return FORWARD_STEPS.includes(id);
    return false;
  };

  const bwdReached = (id) => {
    if (phase !== 'backward' && phase !== 'done') return false;
    if (phase === 'done') return BACKWARD_STEPS.includes(id);
    const cur = BACKWARD_STEPS.slice(0, stepIdx + 1);
    return cur.includes(id);
  };

  const chainRuleTex = useMemo(
    () => katexHtml(
      '\\dfrac{\\partial L}{\\partial x} \\;=\\; \\dfrac{\\partial L}{\\partial y} \\,\\cdot\\, \\dfrac{\\partial y}{\\partial x}',
      true
    ),
    []
  );

  const substTex = useMemo(
    () => katexHtml(
      `\\dfrac{\\partial L}{\\partial x} \\;=\\; \\underbrace{${g.dtex.replace(/u/g, 'y')}}_{\\partial L/\\partial y} \\,\\cdot\\, \\underbrace{${f.dtex.replace(/u/g, 'x')}}_{\\partial y/\\partial x}`,
      true
    ),
    [f, g]
  );

  const phaseLabel =
      phase === 'forward'  ? 'FORWARD →'
    : phase === 'backward' ? '← BACKWARD'
    : phase === 'done'     ? 'COMPLETE'
    : 'IDLE';

  const phaseColor =
      phase === 'forward'  ? 'var(--accent)'
    : phase === 'backward' ? 'var(--hue-mint, #7be0c0)'
    : 'var(--text-dim)';

  // Forward particle position along an edge (animates while that edge is the current forward step)
  const fwdEdgeActive = (id) => phase === 'forward' && FORWARD_STEPS[stepIdx] === id;
  const bwdEdgeActive = (id) => phase === 'backward' && BACKWARD_STEPS[stepIdx] === id;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <marker id="cr-fwd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="cr-fwd-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="cr-bwd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-mint, #7be0c0)" />
            </marker>
          </defs>

          {/* Phase badge */}
          <text x={10} y={20} fontSize="10" fontFamily="var(--mono, monospace)" fill={phaseColor} letterSpacing="0.12em" fontWeight="700">
            {phaseLabel}
          </text>
          <text x={W - 10} y={20} textAnchor="end" fontSize="11" fontFamily="var(--serif, serif)" fontStyle="italic" fill="var(--text-dim)">
            L = g(f(x))
          </text>

          {/* Forward edge x → y */}
          {(() => {
            const lit = fwdReached('edge-xy') || phase === 'backward' || phase === 'done';
            const active = fwdEdgeActive('edge-xy');
            return (
              <g>
                <line
                  x1={epXY.x1} y1={epXY.y1} x2={epXY.x2} y2={epXY.y2}
                  stroke={lit ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={lit ? 2 : 1.4}
                  markerEnd={lit ? 'url(#cr-fwd-arrow)' : 'url(#cr-fwd-arrow-dim)'}
                  opacity={lit ? 1 : 0.6}
                />
                {/* edge label: f */}
                <g transform={`translate(${epXY.mx}, ${epXY.my - 14})`}>
                  <rect x={-28} y={-12} width={56} height={18} rx={4} ry={4} fill="var(--surface)" stroke={lit ? 'var(--accent)' : 'var(--border)'} strokeWidth={lit ? 1.2 : 0.8} />
                  <text x={0} y={2} textAnchor="middle" fontSize="11" fontFamily="var(--serif, serif)" fontStyle="italic" fill={lit ? 'var(--accent)' : 'var(--text-dim)'} fontWeight="700">
                    f(x)
                  </text>
                </g>
                {/* travelling forward particle */}
                {active && (
                  <circle cx={0} cy={0} r={6} fill="var(--accent)">
                    <animate attributeName="cx" from={epXY.x1} to={epXY.x2} dur="0.5s" fill="freeze" />
                    <animate attributeName="cy" from={epXY.y1} to={epXY.y2} dur="0.5s" fill="freeze" />
                    <animate attributeName="opacity" from="1" to="0.2" dur="0.5s" fill="freeze" />
                  </circle>
                )}
              </g>
            );
          })()}

          {/* Forward edge y → L */}
          {(() => {
            const lit = fwdReached('edge-yL') || phase === 'backward' || phase === 'done';
            const active = fwdEdgeActive('edge-yL');
            return (
              <g>
                <line
                  x1={epYL.x1} y1={epYL.y1} x2={epYL.x2} y2={epYL.y2}
                  stroke={lit ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={lit ? 2 : 1.4}
                  markerEnd={lit ? 'url(#cr-fwd-arrow)' : 'url(#cr-fwd-arrow-dim)'}
                  opacity={lit ? 1 : 0.6}
                />
                <g transform={`translate(${epYL.mx}, ${epYL.my - 14})`}>
                  <rect x={-28} y={-12} width={56} height={18} rx={4} ry={4} fill="var(--surface)" stroke={lit ? 'var(--accent)' : 'var(--border)'} strokeWidth={lit ? 1.2 : 0.8} />
                  <text x={0} y={2} textAnchor="middle" fontSize="11" fontFamily="var(--serif, serif)" fontStyle="italic" fill={lit ? 'var(--accent)' : 'var(--text-dim)'} fontWeight="700">
                    g(y)
                  </text>
                </g>
                {active && (
                  <circle cx={0} cy={0} r={6} fill="var(--accent)">
                    <animate attributeName="cx" from={epYL.x1} to={epYL.x2} dur="0.5s" fill="freeze" />
                    <animate attributeName="cy" from={epYL.y1} to={epYL.y2} dur="0.5s" fill="freeze" />
                    <animate attributeName="opacity" from="1" to="0.2" dur="0.5s" fill="freeze" />
                  </circle>
                )}
              </g>
            );
          })()}

          {/* Backward arrow overlay: L → y */}
          {(bwdReached('edge-yL')) && (
            <g>
              <line
                x1={epYL.x2} y1={epYL.y2 + 18} x2={epYL.x1} y2={epYL.y1 + 18}
                stroke="var(--hue-mint, #7be0c0)"
                strokeWidth={2}
                strokeDasharray="5 3"
                markerEnd="url(#cr-bwd-arrow)"
                opacity={0.95}
              />
              <g transform={`translate(${epYL.mx}, ${epYL.my + 30})`}>
                <rect x={-46} y={-10} width={92} height={18} rx={4} ry={4} fill="var(--surface)" stroke="var(--hue-mint, #7be0c0)" strokeWidth={1.2} />
                <text x={0} y={3} textAnchor="middle" fontSize="10" fontFamily="var(--mono, monospace)" fill="var(--hue-mint, #7be0c0)" fontWeight="700">
                  ∂L/∂y = {snap(dL_dy, 3)}
                </text>
              </g>
              {bwdEdgeActive('edge-yL') && (
                <circle cx={0} cy={0} r={6} fill="var(--hue-mint, #7be0c0)">
                  <animate attributeName="cx" from={epYL.x2} to={epYL.x1} dur="0.5s" fill="freeze" />
                  <animate attributeName="cy" from={epYL.y2 + 18} to={epYL.y1 + 18} dur="0.5s" fill="freeze" />
                  <animate attributeName="opacity" from="1" to="0.2" dur="0.5s" fill="freeze" />
                </circle>
              )}
            </g>
          )}

          {/* Backward arrow overlay: y → x */}
          {(bwdReached('edge-xy')) && (
            <g>
              <line
                x1={epXY.x2} y1={epXY.y2 + 18} x2={epXY.x1} y2={epXY.y1 + 18}
                stroke="var(--hue-mint, #7be0c0)"
                strokeWidth={2}
                strokeDasharray="5 3"
                markerEnd="url(#cr-bwd-arrow)"
                opacity={0.95}
              />
              <g transform={`translate(${epXY.mx}, ${epXY.my + 30})`}>
                <rect x={-50} y={-10} width={100} height={18} rx={4} ry={4} fill="var(--surface)" stroke="var(--hue-mint, #7be0c0)" strokeWidth={1.2} />
                <text x={0} y={3} textAnchor="middle" fontSize="10" fontFamily="var(--mono, monospace)" fill="var(--hue-mint, #7be0c0)" fontWeight="700">
                  ∂L/∂x = {snap(dL_dx, 3)}
                </text>
              </g>
              {bwdEdgeActive('edge-xy') && (
                <circle cx={0} cy={0} r={6} fill="var(--hue-mint, #7be0c0)">
                  <animate attributeName="cx" from={epXY.x2} to={epXY.x1} dur="0.5s" fill="freeze" />
                  <animate attributeName="cy" from={epXY.y2 + 18} to={epXY.y1 + 18} dur="0.5s" fill="freeze" />
                  <animate attributeName="opacity" from="1" to="0.2" dur="0.5s" fill="freeze" />
                </circle>
              )}
            </g>
          )}

          {/* Nodes — x, y, L */}
          {[
            { id: 'x', node: NODE_X, label: 'x', value: x,    color: 'var(--accent)',                  grad: dL_dx, gradTex: '∂L/∂x' },
            { id: 'y', node: NODE_Y, label: 'y', value: yVal, color: 'var(--hue-sky, #5ecbff)',        grad: dL_dy, gradTex: '∂L/∂y' },
            { id: 'L', node: NODE_L, label: 'L', value: LVal, color: 'var(--hue-pink, #ff66cc)',       grad: dL_dL, gradTex: '∂L/∂L' },
          ].map((n) => {
            const lit = fwdReached(n.id);
            const bwd = bwdReached(n.id);
            return (
              <g key={n.id}>
                {lit && (
                  <circle cx={n.node.x} cy={n.node.y} r={n.node.r + 6} fill={n.color} opacity={0.16} />
                )}
                {bwd && (
                  <circle
                    cx={n.node.x}
                    cy={n.node.y}
                    r={n.node.r + 10}
                    fill="none"
                    stroke="var(--hue-mint, #7be0c0)"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    opacity={0.9}
                  />
                )}
                <circle
                  cx={n.node.x}
                  cy={n.node.y}
                  r={n.node.r}
                  fill={lit ? n.color : 'var(--surface)'}
                  stroke={n.color}
                  strokeWidth={lit ? 2.2 : 1.4}
                  opacity={lit ? 1 : 0.85}
                />
                <text
                  x={n.node.x}
                  y={n.node.y + 5}
                  textAnchor="middle"
                  fontSize="16"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight="700"
                  fill={lit ? 'var(--bg)' : 'var(--text-main)'}
                >
                  {n.label}
                </text>
                {/* forward value above */}
                <text
                  x={n.node.x}
                  y={n.node.y - n.node.r - 8}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                  fill={lit ? n.color : 'var(--text-dim)'}
                  opacity={lit ? 1 : 0.7}
                >
                  = {snap(n.value, 3)}
                </text>
                {/* backward gradient label below the node, shown when bwd lit */}
                {bwd && (
                  <text
                    x={n.node.x}
                    y={n.node.y + n.node.r + 56}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="var(--mono, monospace)"
                    fontWeight="700"
                    fill="var(--hue-mint, #7be0c0)"
                  >
                    {n.gradTex} = {snap(n.grad, 3)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        {/* Chain rule formula */}
        <div className="mlviz-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
          <div style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Chain rule</div>
          <div
            style={{ color: 'var(--text-main)', fontSize: 14 }}
            dangerouslySetInnerHTML={{ __html: chainRuleTex }}
          />
          <div
            style={{ color: 'var(--text-dim)', fontSize: 13 }}
            dangerouslySetInnerHTML={{ __html: substTex }}
          />
        </div>

        {/* Live readout: every node + every gradient */}
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>x</span>
          <span className="mlviz-val">{snap(x, 3)}</span>
          <span className="mlviz-sub" style={{ color: 'var(--hue-sky, #5ecbff)' }}>y = f(x) = {snap(yVal, 3)}</span>
          <span className="mlviz-sub" style={{ color: 'var(--hue-pink, #ff66cc)' }}>L = g(y) = {snap(LVal, 3)}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #7be0c0)' }}>∂L/∂L</span>
          <span className="mlviz-val">{snap(dL_dL, 3)}</span>
          <span className="mlviz-sub">∂L/∂y = g'(y) = {snap(dL_dy, 3)}</span>
          <span className="mlviz-sub">∂y/∂x = f'(x) = {snap(dy_dx, 3)}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #7be0c0)' }}>∂L/∂x</span>
          <span className="mlviz-val">{snap(dL_dx, 4)}</span>
          <span className="mlviz-sub">= g'(y) · f'(x)</span>
          <span className="mlviz-sub">= {snap(dL_dy, 3)} · {snap(dy_dx, 3)}</span>
        </div>

        {/* Function pickers + x on one wrapping controls row */}
        <div className="mlviz-row mlviz-controls" style={{ gap: 10, flexWrap: 'wrap' }}>
          <label className="mlviz-slider" style={{ minWidth: 150, flex: '1 1 150px' }}>
            <span className="mlviz-slider-label">f</span>
            <select
              value={fKey}
              onChange={(e) => setFKey(e.target.value)}
              disabled={running}
              style={{
                flex: 1,
                background: 'var(--surface)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                fontFamily: 'var(--mono, monospace)',
                fontSize: 12,
              }}
            >
              {Object.entries(FUNCS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
          <label className="mlviz-slider" style={{ minWidth: 150, flex: '1 1 150px' }}>
            <span className="mlviz-slider-label">g</span>
            <select
              value={gKey}
              onChange={(e) => setGKey(e.target.value)}
              disabled={running}
              style={{
                flex: 1,
                background: 'var(--surface)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                fontFamily: 'var(--mono, monospace)',
                fontSize: 12,
              }}
            >
              {Object.entries(FUNCS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
          <label className="mlviz-slider" style={{ minWidth: 150, flex: '1 1 150px' }}>
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
          forward computes x → y → L,
          <ArrowLeft size={11} style={{ verticalAlign: 'middle', margin: '0 2px 0 6px' }} />
          backward multiplies g'(y) · f'(x) to land ∂L/∂x.
        </div>
      </div>
    </div>
  );
}
