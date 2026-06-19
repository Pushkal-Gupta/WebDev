import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Radar, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 360;
const PAD = 24;
const PLOT = W - PAD * 2;
const PLOT_H = H - PAD * 2;

const DOM = 10; // domain 0..10 in both axes

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Three labelled blobs, deterministic.
const BLOBS = [
  { cx: 2.6, cy: 7.0, label: 0, seed: 0x1a2b },
  { cx: 7.4, cy: 7.2, label: 1, seed: 0x3c4d },
  { cx: 5.0, cy: 2.6, label: 2, seed: 0x5e6f },
];
const PER_BLOB = 9;
const CLASS_COLORS = ['var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];
const CLASS_VARS = ['sky', 'pink', 'mint'];

function buildPoints() {
  const out = [];
  BLOBS.forEach((b) => {
    const rng = mulberry32(b.seed);
    for (let i = 0; i < PER_BLOB; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * 1.7;
      out.push({
        x: Math.max(0.4, Math.min(DOM - 0.4, b.cx + Math.cos(a) * r)),
        y: Math.max(0.4, Math.min(DOM - 0.4, b.cy + Math.sin(a) * r)),
        label: b.label,
        id: `${b.label}-${i}`,
      });
    }
  });
  return out;
}

const POINTS = buildPoints();
const DEFAULT_Q = { x: 5.0, y: 5.0 };
const DEFAULT_K = 5;
const MAX_K = 11;

function fmt(v, p = 2) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

export default function KNNExplorerViz() {
  const [q, setQ] = useState(DEFAULT_Q);
  const [k, setK] = useState(DEFAULT_K);
  const [shade, setShade] = useState(false);
  const svgRef = useRef(null);
  const dragRef = useRef(false);

  const sx = useCallback((x) => PAD + (x / DOM) * PLOT, []);
  const sy = useCallback((y) => PAD + (1 - y / DOM) * PLOT_H, []);

  const { neighbors, votes, predicted, nearest } = useMemo(() => {
    const withDist = POINTS.map((p) => ({
      ...p,
      dist: Math.hypot(p.x - q.x, p.y - q.y),
    })).sort((a, b) => a.dist - b.dist);
    const nn = withDist.slice(0, k);
    const v = [0, 0, 0];
    nn.forEach((p) => {
      v[p.label] += 1;
    });
    let pred = 0;
    let best = -1;
    v.forEach((c, i) => {
      if (c > best) {
        best = c;
        pred = i;
      }
    });
    return {
      neighbors: nn,
      votes: v,
      predicted: pred,
      nearest: withDist[0]?.dist ?? 0,
    };
  }, [q, k]);

  // coarse decision-shading grid (predict class per cell at k)
  const shadeCells = useMemo(() => {
    if (!shade) return [];
    const N = 22;
    const cells = [];
    for (let gx = 0; gx < N; gx++) {
      for (let gy = 0; gy < N; gy++) {
        const cx = ((gx + 0.5) / N) * DOM;
        const cy = ((gy + 0.5) / N) * DOM;
        const sorted = POINTS.map((p) => ({
          label: p.label,
          d: (p.x - cx) ** 2 + (p.y - cy) ** 2,
        }))
          .sort((a, b) => a.d - b.d)
          .slice(0, k);
        const vv = [0, 0, 0];
        sorted.forEach((s) => (vv[s.label] += 1));
        let lab = 0;
        let bb = -1;
        vv.forEach((c, i) => {
          if (c > bb) {
            bb = c;
            lab = i;
          }
        });
        cells.push({ gx, gy, lab, N });
      }
    }
    return cells;
  }, [shade, k]);

  const updateDrag = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const rx = ((clientX - rect.left) / rect.width) * W;
    const ry = ((clientY - rect.top) / rect.height) * H;
    let dx = ((rx - PAD) / PLOT) * DOM;
    let dy = (1 - (ry - PAD) / PLOT_H) * DOM;
    dx = Math.max(0, Math.min(DOM, dx));
    dy = Math.max(0, Math.min(DOM, dy));
    setQ({ x: Math.round(dx * 100) / 100, y: Math.round(dy * 100) / 100 });
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      dragRef.current = true;
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
    dragRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => {
    setQ(DEFAULT_Q);
    setK(DEFAULT_K);
    setShade(false);
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'cx 0.07s linear, cy 0.07s linear';

  const qx = sx(q.x);
  const qy = sy(q.y);
  const cellW = PLOT / 22;
  const cellH = PLOT_H / 22;

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Radar size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">k-nearest-neighbours explorer</span>
          <span className="aev-head-sub">
            drag the query point — the k closest neighbours vote on its class
          </span>
        </span>
        <span className="aev-chip">k = {k}</span>
      </div>

      <div className="aev-body knnx-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg knnx-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <filter id="knnx-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
              <radialGradient id="knnx-q-grad" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--hue-violet)" />
              </radialGradient>
            </defs>

            {/* decision shading */}
            {shadeCells.map((c) => (
              <rect
                key={`s-${c.gx}-${c.gy}`}
                x={PAD + c.gx * cellW}
                y={PAD + (c.N - 1 - c.gy) * cellH}
                width={cellW + 0.5}
                height={cellH + 0.5}
                fill={CLASS_COLORS[c.lab]}
                opacity="0.1"
              />
            ))}

            {/* frame */}
            <rect
              x={PAD}
              y={PAD}
              width={PLOT}
              height={PLOT_H}
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.6"
            />

            {/* neighbour links */}
            {neighbors.map((p) => (
              <line
                key={`l-${p.id}`}
                x1={qx}
                y1={qy}
                x2={sx(p.x)}
                y2={sy(p.y)}
                stroke={CLASS_COLORS[p.label]}
                strokeWidth="1.3"
                opacity="0.55"
                style={{ transition: reducedMotion ? 'none' : 'all 0.08s linear' }}
              />
            ))}

            {/* enclosing radius of the kth neighbour */}
            {neighbors.length > 0 && (
              <circle
                cx={qx}
                cy={qy}
                r={(neighbors[neighbors.length - 1].dist / DOM) * PLOT}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.4"
              />
            )}

            {/* data points */}
            {POINTS.map((p) => {
              const isNb = neighbors.some((n) => n.id === p.id);
              return (
                <circle
                  key={p.id}
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={isNb ? 5.2 : 4}
                  fill={CLASS_COLORS[p.label]}
                  stroke={isNb ? 'var(--text-main)' : 'transparent'}
                  strokeWidth="1.1"
                  opacity={isNb ? 1 : 0.65}
                />
              );
            })}

            {/* query point */}
            <circle
              cx={qx}
              cy={qy}
              r="13"
              fill="rgba(var(--accent-rgb), 0.16)"
              style={{ transition: trans }}
            />
            <circle
              cx={qx}
              cy={qy}
              r="8"
              fill="url(#knnx-q-grad)"
              filter="url(#knnx-glow)"
              opacity="0.6"
              style={{ transition: trans }}
            />
            <circle
              cx={qx}
              cy={qy}
              r="5.5"
              fill="url(#knnx-q-grad)"
              stroke={CLASS_COLORS[predicted]}
              strokeWidth="2"
              style={{ transition: trans, cursor: 'grab' }}
            />
          </svg>
        </div>

        <div className="mlviz-statcol knnx-cards">
          <div
            className={`mlviz-statcard mlviz-statcard-${CLASS_VARS[predicted]}`}
          >
            <span className="mlviz-statcard-label">predicted class</span>
            <span className="mlviz-statcard-val">#{predicted}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">vote split</span>
            <span className="mlviz-statcard-val">
              {votes[0]}·{votes[1]}·{votes[2]}
            </span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">nearest dist</span>
            <span className="mlviz-statcard-val">{fmt(nearest)}</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">k</span>
          <input
            type="range"
            min="1"
            max={MAX_K}
            step="1"
            value={k}
            onChange={(e) => setK(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{k}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className={`mlviz-btn${shade ? ' mlviz-btn-primary' : ''}`}
            onClick={() => setShade((s) => !s)}
          >
            <span>{shade ? 'Hide regions' : 'Show regions'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          small k = jagged, local boundaries (low bias, high variance) · large k = smooth, averaged regions
        </div>
      </div>
    </div>
  );
}
