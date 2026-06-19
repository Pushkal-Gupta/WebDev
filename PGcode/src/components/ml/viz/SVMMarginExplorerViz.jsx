import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GitCompareArrows, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 360;
const PAD = 26;
const PLOT = W - PAD * 2;
const PLOT_H = H - PAD * 2;

const DOM_MIN = -5;
const DOM_MAX = 5;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCluster(seed, cx, cy, spread, n, label) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * spread;
    pts.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      label,
      id: `${label}-${i}`,
    });
  }
  return pts;
}

const POS_SEED = 0x51a3;
const NEG_SEED = 0x9c4f;
const DEFAULT_POS = { cx: 1.9, cy: 1.9 };
const DEFAULT_NEG = { cx: -1.9, cy: -1.9 };
const N_PER = 8;
const DEFAULT_C = 1;

function fmt(v, p = 2) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

// Fit a max-margin-flavoured separator between two clusters deterministically:
// direction = unit vector from negative centroid to positive centroid;
// the soft-margin width shrinks as C grows (hard margin) and widens as C → 0.
function fitSeparator(pos, neg, C) {
  const mean = (arr, k) => arr.reduce((s, p) => s + p[k], 0) / arr.length;
  const pcx = mean(pos, 'x');
  const pcy = mean(pos, 'y');
  const ncx = mean(neg, 'x');
  const ncy = mean(neg, 'y');
  let wx = pcx - ncx;
  let wy = pcy - ncy;
  const norm = Math.hypot(wx, wy) || 1;
  wx /= norm;
  wy /= norm;
  // boundary passes through midpoint of centroids
  const mx = (pcx + ncx) / 2;
  const my = (pcy + ncy) / 2;
  // signed projection of each point onto w (centered at midpoint)
  const proj = (p) => (p.x - mx) * wx + (p.y - my) * wy;
  // half-gap = projection of the closest correctly-side point toward boundary.
  // Larger C → tighter margin (toward closest points); smaller C → wider.
  const posProj = pos.map(proj);
  const negProj = neg.map(proj);
  const minPos = Math.min(...posProj);
  const maxNeg = Math.max(...negProj);
  const hardHalf = Math.max(0.05, (minPos - maxNeg) / 2);
  // soft margin scales the half-gap; small C lets margin exceed the hard gap.
  const softFactor = 1 + 1.6 / (C + 0.25);
  const half = hardHalf * Math.min(softFactor, 3.2);
  return { wx, wy, mx, my, half, proj };
}

export default function SVMMarginExplorerViz() {
  const [posC, setPosC] = useState(DEFAULT_POS);
  const [negC, setNegC] = useState(DEFAULT_NEG);
  const [C, setC] = useState(DEFAULT_C);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const pos = useMemo(
    () => makeCluster(POS_SEED, posC.cx, posC.cy, 1.5, N_PER, 1),
    [posC]
  );
  const neg = useMemo(
    () => makeCluster(NEG_SEED, negC.cx, negC.cy, 1.5, N_PER, -1),
    [negC]
  );

  const sx = useCallback(
    (x) => PAD + ((x - DOM_MIN) / (DOM_MAX - DOM_MIN)) * PLOT,
    []
  );
  const sy = useCallback(
    (y) => PAD + (1 - (y - DOM_MIN) / (DOM_MAX - DOM_MIN)) * PLOT_H,
    []
  );

  const sep = useMemo(() => fitSeparator(pos, neg, C), [pos, neg, C]);

  // classify + identify support vectors / violations
  const analysis = useMemo(() => {
    let support = 0;
    let violations = 0;
    const tagged = [];
    const tag = (p) => {
      const d = sep.proj(p); // signed distance toward + side (in data units, *direction unit)
      const sideOk = (p.label === 1 && d > 0) || (p.label === -1 && d < 0);
      const within = Math.abs(d) <= sep.half + 1e-6;
      const onMargin = Math.abs(Math.abs(d) - sep.half) < 0.18;
      const isSupport = onMargin || (within && sideOk);
      const violated = !sideOk;
      if (violated) violations += 1;
      if (isSupport || violated) support += violated ? 0 : 1;
      tagged.push({ ...p, d, sideOk, isSupport: isSupport && sideOk, violated });
    };
    pos.forEach(tag);
    neg.forEach(tag);
    return { tagged, support, violations };
  }, [pos, neg, sep]);

  // line geometry: boundary is the set {(x,y) : (x-mx)wx + (y-my)wy = 0}
  // direction along boundary = perpendicular to w = (-wy, wx)
  const px = -sep.wy;
  const py = sep.wx;
  const T = 9;
  const bx1 = sep.mx + px * -T;
  const by1 = sep.my + py * -T;
  const bx2 = sep.mx + px * T;
  const by2 = sep.my + py * T;
  // margin lines: shift along w by ±half
  const offset = (s) => ({
    x1: bx1 + sep.wx * s,
    y1: by1 + sep.wy * s,
    x2: bx2 + sep.wx * s,
    y2: by2 + sep.wy * s,
  });
  const mPlus = offset(sep.half);
  const mMinus = offset(-sep.half);

  const marginWidth = sep.half * 2;

  const updateDrag = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg || !dragRef.current) return;
      const rect = svg.getBoundingClientRect();
      const rx = ((clientX - rect.left) / rect.width) * W;
      const ry = ((clientY - rect.top) / rect.height) * H;
      let dx = DOM_MIN + ((rx - PAD) / PLOT) * (DOM_MAX - DOM_MIN);
      let dy = DOM_MIN + (1 - (ry - PAD) / PLOT_H) * (DOM_MAX - DOM_MIN);
      dx = Math.max(DOM_MIN + 1.2, Math.min(DOM_MAX - 1.2, dx));
      dy = Math.max(DOM_MIN + 1.2, Math.min(DOM_MAX - 1.2, dy));
      const set = dragRef.current === 'pos' ? setPosC : setNegC;
      set({ cx: Math.round(dx * 100) / 100, cy: Math.round(dy * 100) / 100 });
    },
    []
  );

  const onPointerDown = useCallback(
    (which) => (e) => {
      dragRef.current = which;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateDrag(e.clientX, e.clientY);
    },
    [updateDrag]
  );
  const onPointerMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      updateDrag(e.clientX, e.clientY);
    },
    [updateDrag]
  );
  const onPointerUp = useCallback((e) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => {
    setPosC(DEFAULT_POS);
    setNegC(DEFAULT_NEG);
    setC(DEFAULT_C);
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'cx 0.08s linear, cy 0.08s linear';

  const posCentroid = { x: sx(posC.cx), y: sy(posC.cy) };
  const negCentroid = { x: sx(negC.cx), y: sy(negC.cy) };

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <GitCompareArrows size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Max-margin explorer</span>
          <span className="aev-head-sub">
            drag a class centroid — the separating line and margin band re-fit live
          </span>
        </span>
        <span className="aev-chip">C = {fmt(C, 2)}</span>
      </div>

      <div className="aev-body svmx-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg svmx-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <linearGradient id="svmx-pos-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--hue-sky)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
              <linearGradient id="svmx-neg-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--hue-pink)" />
                <stop offset="100%" stopColor="var(--hue-violet)" />
              </linearGradient>
              <filter id="svmx-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.2" />
              </filter>
            </defs>

            {/* grid */}
            {[-4, -2, 0, 2, 4].map((g) => (
              <g key={`g-${g}`}>
                <line
                  x1={sx(g)}
                  y1={PAD}
                  x2={sx(g)}
                  y2={PAD + PLOT_H}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity="0.5"
                />
                <line
                  x1={PAD}
                  y1={sy(g)}
                  x2={PAD + PLOT}
                  y2={sy(g)}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity="0.5"
                />
              </g>
            ))}

            {/* margin band */}
            <polygon
              points={`${sx(mPlus.x1)},${sy(mPlus.y1)} ${sx(mPlus.x2)},${sy(
                mPlus.y2
              )} ${sx(mMinus.x2)},${sy(mMinus.y2)} ${sx(mMinus.x1)},${sy(
                mMinus.y1
              )}`}
              fill="var(--accent)"
              opacity="0.08"
            />

            {/* margin lines */}
            <line
              x1={sx(mPlus.x1)}
              y1={sy(mPlus.y1)}
              x2={sx(mPlus.x2)}
              y2={sy(mPlus.y2)}
              stroke="var(--hue-sky)"
              strokeWidth="1.3"
              strokeDasharray="5 4"
              opacity="0.8"
            />
            <line
              x1={sx(mMinus.x1)}
              y1={sy(mMinus.y1)}
              x2={sx(mMinus.x2)}
              y2={sy(mMinus.y2)}
              stroke="var(--hue-pink)"
              strokeWidth="1.3"
              strokeDasharray="5 4"
              opacity="0.8"
            />

            {/* glow + boundary */}
            <line
              x1={sx(bx1)}
              y1={sy(by1)}
              x2={sx(bx2)}
              y2={sy(by2)}
              stroke="var(--accent)"
              strokeWidth="4.5"
              filter="url(#svmx-glow)"
              opacity="0.5"
            />
            <line
              x1={sx(bx1)}
              y1={sy(by1)}
              x2={sx(bx2)}
              y2={sy(by2)}
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* points */}
            {analysis.tagged.map((p) => {
              const cx = sx(p.x);
              const cy = sy(p.y);
              const grad =
                p.label === 1 ? 'url(#svmx-pos-grad)' : 'url(#svmx-neg-grad)';
              return (
                <g key={p.id} style={{ transition: trans }}>
                  {p.violated && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="8.5"
                      fill="none"
                      stroke="var(--warning)"
                      strokeWidth="1.6"
                      strokeDasharray="2 2"
                    />
                  )}
                  {p.isSupport && !p.violated && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="7.5"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="1.6"
                      opacity="0.85"
                    />
                  )}
                  {p.label === 1 ? (
                    <rect
                      x={cx - 4}
                      y={cy - 4}
                      width="8"
                      height="8"
                      rx="1.5"
                      fill={grad}
                    />
                  ) : (
                    <circle cx={cx} cy={cy} r="4.4" fill={grad} />
                  )}
                </g>
              );
            })}

            {/* draggable centroids */}
            <g
              onPointerDown={onPointerDown('pos')}
              style={{ cursor: 'grab' }}
            >
              <circle
                cx={posCentroid.x}
                cy={posCentroid.y}
                r="12"
                fill="rgba(var(--accent-rgb), 0.16)"
                style={{ transition: trans }}
              />
              <circle
                cx={posCentroid.x}
                cy={posCentroid.y}
                r="6"
                fill="none"
                stroke="var(--hue-sky)"
                strokeWidth="1.6"
                style={{ transition: trans }}
              />
            </g>
            <g
              onPointerDown={onPointerDown('neg')}
              style={{ cursor: 'grab' }}
            >
              <circle
                cx={negCentroid.x}
                cy={negCentroid.y}
                r="12"
                fill="rgba(var(--accent-rgb), 0.16)"
                style={{ transition: trans }}
              />
              <circle
                cx={negCentroid.x}
                cy={negCentroid.y}
                r="6"
                fill="none"
                stroke="var(--hue-pink)"
                strokeWidth="1.6"
                style={{ transition: trans }}
              />
            </g>

            <text
              x={PAD + 4}
              y={PAD + 12}
              fontSize="8.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              squares = class +1 · circles = class −1
            </text>
          </svg>
        </div>

        <div className="mlviz-statcol svmx-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">margin width</span>
            <span className="mlviz-statcard-val">{fmt(marginWidth)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-sky">
            <span className="mlviz-statcard-label">support vectors</span>
            <span className="mlviz-statcard-val">{analysis.support}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">violations</span>
            <span className="mlviz-statcard-val">{analysis.violations}</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">C (penalty)</span>
          <input
            type="range"
            min="0.05"
            max="8"
            step="0.05"
            value={C}
            onChange={(e) => setC(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{fmt(C, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          large C = hard margin (tight band, few violations) · small C = soft margin (wide band, tolerated overlap)
        </div>
      </div>
    </div>
  );
}
