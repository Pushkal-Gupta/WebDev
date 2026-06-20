import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Sigma, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 300;
const PANEL_W = 250;
const GAP = 60;
const LEFT_X = 16;
const RIGHT_X = LEFT_X + PANEL_W + GAP;
const TOP = 30;
const PLOT_H = 200;
const AXIS_Y = TOP + PLOT_H;

const EPS = 1e-5;
const N = 8;
const X_RANGE = 6; // domain shown: [-X_RANGE, X_RANGE]

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeBatch() {
  const rng = mulberry32(20260619);
  // raw activations: shifted + scaled, clearly not N(0,1)
  const pts = [];
  for (let i = 0; i < N; i++) {
    pts.push(2.4 + 1.7 * (rng() * 2 - 1) + 0.9 * (rng() * 2 - 1));
  }
  return pts;
}

const RAW = makeBatch();

function fmt(v, p = 3) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

const DEF = { gamma: 1, beta: 0 };

export default function BatchNormExplorerViz() {
  const [params, setParams] = useState(DEF);
  const [raw, setRaw] = useState(RAW);
  const [dragIdx, setDragIdx] = useState(null);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const reset = useCallback(() => {
    setParams(DEF);
    setRaw(RAW);
  }, []);

  const mu = useMemo(() => raw.reduce((a, b) => a + b, 0) / raw.length, [raw]);
  const variance = useMemo(
    () => raw.reduce((a, b) => a + (b - mu) * (b - mu), 0) / raw.length,
    [raw, mu]
  );
  const sigma = Math.sqrt(variance);

  // normalized then affine-shifted
  const normed = raw.map((x) => (x - mu) / Math.sqrt(variance + EPS));
  const out = normed.map((z) => params.gamma * z + params.beta);
  const outMu = out.reduce((a, b) => a + b, 0) / out.length;

  const sx = useCallback((x, baseX) => {
    const frac = (x + X_RANGE) / (2 * X_RANGE);
    return baseX + Math.max(0, Math.min(1, frac)) * PANEL_W;
  }, []);

  // map clientY for dragging a raw point vertically -> change its value
  const updateDrag = useCallback(
    (clientX) => {
      const svg = svgRef.current;
      if (!svg || dragRef.current === null) return;
      const rect = svg.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const svgX = ratio * W;
      let xVal = ((svgX - LEFT_X) / PANEL_W) * (2 * X_RANGE) - X_RANGE;
      xVal = Math.max(-X_RANGE, Math.min(X_RANGE, xVal));
      setRaw((arr) => {
        const next = arr.slice();
        next[dragRef.current] = Math.round(xVal * 100) / 100;
        return next;
      });
    },
    []
  );

  const onDown = useCallback(
    (i) => (e) => {
      dragRef.current = i;
      setDragIdx(i);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateDrag(e.clientX);
    },
    [updateDrag]
  );
  const onMove = useCallback(
    (e) => {
      if (dragRef.current === null) return;
      updateDrag(e.clientX);
    },
    [updateDrag]
  );
  const onUp = useCallback((e) => {
    dragRef.current = null;
    setDragIdx(null);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'cx 0.1s ease';

  const ticks = [-4, -2, 0, 2, 4];

  const renderAxis = (baseX, label, color, highlightX) => (
    <g>
      <line x1={baseX} y1={AXIS_Y} x2={baseX + PANEL_W} y2={AXIS_Y} stroke="var(--border)" strokeWidth="1" />
      {ticks.map((t) => (
        <g key={`${baseX}-${t}`}>
          <line x1={sx(t, baseX)} y1={TOP} x2={sx(t, baseX)} y2={AXIS_Y} stroke="var(--border)" strokeWidth="0.4" opacity="0.45" />
          <text x={sx(t, baseX)} y={AXIS_Y + 14} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            {t}
          </text>
        </g>
      ))}
      {/* mean marker */}
      <line x1={sx(highlightX, baseX)} y1={TOP} x2={sx(highlightX, baseX)} y2={AXIS_Y} stroke={color} strokeWidth="1.4" strokeDasharray="4 3" opacity="0.8" />
      <text x={baseX + PANEL_W / 2} y={TOP - 12} fontSize="9" fill={color} fontFamily="var(--mono)" fontWeight="700" textAnchor="middle">
        {label}
      </text>
    </g>
  );

  return (
    <div className="mlviz-wrap aev-wrap bnx-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Sigma size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Batch norm explorer</span>
          <span className="aev-head-sub">
            drag the raw points — normalization centers to N(0,1), then γ/β rescale and shift
          </span>
        </span>
        <span className="aev-chip">μ = {fmt(mu, 2)}</span>
      </div>

      <div className="aev-body bnx-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg bnx-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            <defs>
              <filter id="bnx-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.6" />
              </filter>
              <linearGradient id="bnx-arrow-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--hue-pink)" />
                <stop offset="100%" stopColor="var(--hue-mint)" />
              </linearGradient>
            </defs>

            {renderAxis(LEFT_X, 'raw activations', 'var(--hue-pink)', mu)}
            {renderAxis(RIGHT_X, 'after BN (γ,β)', 'var(--hue-mint)', outMu)}

            {/* transform arrow between panels */}
            <line
              x1={LEFT_X + PANEL_W + 8}
              y1={AXIS_Y - PLOT_H / 2}
              x2={RIGHT_X - 8}
              y2={AXIS_Y - PLOT_H / 2}
              stroke="url(#bnx-arrow-grad)"
              strokeWidth="2.2"
              markerEnd="url(#bnx-arrowhead)"
            />
            <defs>
              <marker id="bnx-arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--hue-mint)" />
              </marker>
            </defs>
            <text
              x={(LEFT_X + PANEL_W + RIGHT_X) / 2}
              y={AXIS_Y - PLOT_H / 2 - 8}
              fontSize="7.6"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              (x−μ)/√(σ²+ε)
            </text>

            {/* raw points (draggable) */}
            {raw.map((x, i) => {
              const cx = sx(x, LEFT_X);
              const cy = AXIS_Y - 18 - (i % 4) * 14;
              return (
                <g key={`raw-${i}`}>
                  <circle cx={cx} cy={cy} r="9" fill="rgba(var(--accent-rgb), 0.14)" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="5"
                    fill="var(--hue-pink)"
                    stroke="var(--surface)"
                    strokeWidth="1"
                    style={{ transition: dragIdx === i ? 'none' : trans, cursor: 'grab' }}
                    onPointerDown={onDown(i)}
                  />
                </g>
              );
            })}

            {/* output points */}
            {out.map((x, i) => {
              const cx = sx(x, RIGHT_X);
              const cy = AXIS_Y - 18 - (i % 4) * 14;
              return (
                <circle
                  key={`out-${i}`}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="var(--hue-mint)"
                  stroke="var(--surface)"
                  strokeWidth="1"
                  filter="url(#bnx-glow)"
                  opacity="0.92"
                  style={{ transition: trans }}
                />
              );
            })}
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards bnx-cards">
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">batch μ</span>
            <span className="mlviz-statcard-val">{fmt(mu, 2)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-sky">
            <span className="mlviz-statcard-label">batch σ</span>
            <span className="mlviz-statcard-val">{fmt(sigma, 2)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">scale γ</span>
            <span className="mlviz-statcard-val">{fmt(params.gamma, 2)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">shift β</span>
            <span className="mlviz-statcard-val">{fmt(params.beta, 2)}</span>
          </div>
          <div className="aev-expr">y = γ·x̂ + β</div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">γ scale</span>
          <input
            type="range"
            min={0}
            max={3}
            step="0.05"
            value={params.gamma}
            onChange={(e) => setParams((p) => ({ ...p, gamma: parseFloat(e.target.value) }))}
          />
          <span className="mlviz-slider-val">{fmt(params.gamma, 2)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">β shift</span>
          <input
            type="range"
            min={-4}
            max={4}
            step="0.05"
            value={params.beta}
            onChange={(e) => setParams((p) => ({ ...p, beta: parseFloat(e.target.value) }))}
          />
          <span className="mlviz-slider-val">{fmt(params.beta, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          normalization fixes the distribution to ~N(0,1) · γ and β let the network undo it when that helps
        </div>
      </div>
    </div>
  );
}
