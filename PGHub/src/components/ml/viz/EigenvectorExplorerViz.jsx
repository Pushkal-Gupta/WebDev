import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 520;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const UNIT = 46; // px per world unit
const ALIGN_TOL = 4; // degrees: treat |angle(v, Mv)| below this as "aligned"

function toScreen(x, y) {
  return [CX + x * UNIT, CY - y * UNIT];
}

function fmt(v, p = 2) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

// Real eigen-decomposition of a 2x2 matrix [[a,b],[c,d]] (real eigenvalues only).
function eig2(a, b, c, d) {
  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  if (disc < 0) return null; // complex pair -> pure rotation, no real eigenvectors
  const s = Math.sqrt(disc);
  const l1 = (tr + s) / 2;
  const l2 = (tr - s) / 2;
  const vecFor = (lam) => {
    // (A - lam I) v = 0
    let vx = b;
    let vy = lam - a;
    if (Math.abs(vx) < 1e-9 && Math.abs(vy) < 1e-9) {
      vx = lam - d;
      vy = c;
    }
    if (Math.abs(vx) < 1e-9 && Math.abs(vy) < 1e-9) {
      vx = 1;
      vy = 0;
    }
    const n = Math.hypot(vx, vy) || 1;
    return [vx / n, vy / n];
  };
  return [
    { lambda: l1, vec: vecFor(l1) },
    { lambda: l2, vec: vecFor(l2) },
  ];
}

const DEFAULTS = { a: 2, b: 1, c: 1, d: 2 };
const DEFAULT_V = { x: 1.4, y: 0.5 };

function Arrow({ x1, y1, x2, y2, color, width = 2.6, glow, headId, opacity = 1, dash }) {
  return (
    <g opacity={opacity}>
      {glow && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={width + 4}
          strokeLinecap="round"
          filter={`url(#${glow})`}
          opacity="0.5"
        />
      )}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        markerEnd={`url(#${headId})`}
        strokeDasharray={dash}
      />
    </g>
  );
}

export default function EigenvectorExplorerViz({ matrix }) {
  const init = matrix || DEFAULTS;
  const [a, setA] = useState(init.a ?? DEFAULTS.a);
  const [b, setB] = useState(init.b ?? DEFAULTS.b);
  const [c, setC] = useState(init.c ?? DEFAULTS.c);
  const [d, setD] = useState(init.d ?? DEFAULTS.d);
  const [v, setV] = useState(DEFAULT_V);
  const svgRef = useRef(null);
  const dragRef = useRef(false);

  const Mv = useMemo(
    () => ({ x: a * v.x + b * v.y, y: c * v.x + d * v.y }),
    [a, b, c, d, v]
  );

  const eigs = useMemo(() => eig2(a, b, c, d), [a, b, c, d]);

  const lenV = Math.hypot(v.x, v.y);
  const lenMv = Math.hypot(Mv.x, Mv.y);
  const ratio = lenV > 1e-9 ? lenMv / lenV : 0;

  // signed angle between v and Mv in degrees
  const angle = useMemo(() => {
    if (lenV < 1e-9 || lenMv < 1e-9) return 0;
    const cross = v.x * Mv.y - v.y * Mv.x;
    const dot = v.x * Mv.x + v.y * Mv.y;
    return (Math.atan2(cross, dot) * 180) / Math.PI;
  }, [v, Mv, lenV, lenMv]);

  const absAngle = Math.abs(angle);
  // aligned if Mv is parallel (0deg) or antiparallel (180deg) to v
  const aligned = absAngle < ALIGN_TOL || absAngle > 180 - ALIGN_TOL;

  // effective eigenvalue if aligned: ratio with sign of dot product
  const dotSign = v.x * Mv.x + v.y * Mv.y >= 0 ? 1 : -1;
  const effLambda = ratio * dotSign;

  const updateFromClient = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * W;
    const sy = ((clientY - rect.top) / rect.height) * H;
    let wx = (sx - CX) / UNIT;
    let wy = (CY - sy) / UNIT;
    wx = Math.max(-4.2, Math.min(4.2, wx));
    wy = Math.max(-3.4, Math.min(3.4, wy));
    setV({ x: Math.round(wx * 100) / 100, y: Math.round(wy * 100) / 100 });
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      dragRef.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateFromClient(e.clientX, e.clientY);
    },
    [updateFromClient]
  );
  const onPointerMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      updateFromClient(e.clientX, e.clientY);
    },
    [updateFromClient]
  );
  const onPointerUp = useCallback((e) => {
    dragRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => {
    setA(DEFAULTS.a);
    setB(DEFAULTS.b);
    setC(DEFAULTS.c);
    setD(DEFAULTS.d);
    setV(DEFAULT_V);
  }, []);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dotTrans = reduced ? 'none' : 'cx 0.06s linear, cy 0.06s linear';

  const [vsx, vsy] = toScreen(v.x, v.y);
  const [mvsx, mvsy] = toScreen(Mv.x, Mv.y);

  const gridLines = [];
  for (let i = -4; i <= 4; i++) {
    gridLines.push(i);
  }

  // eigenvector lines extended across plot
  const eigLines = (eigs || []).map((e, i) => {
    const [ex, ey] = e.vec;
    const span = 5;
    const [x1, y1] = toScreen(-ex * span, -ey * span);
    const [x2, y2] = toScreen(ex * span, ey * span);
    return { x1, y1, x2, y2, lambda: e.lambda, idx: i };
  });

  const eigColors = ['var(--hue-violet)', 'var(--hue-sky)'];

  const ID = 'eigex';

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Compass size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Eigenvector explorer</span>
          <span className="aev-head-sub">
            drag v — when M·v lines up with v, you have found an eigenvector
          </span>
        </span>
        <span className="aev-chip">
          {aligned ? `λ ≈ ${fmt(effLambda)}` : `∠ ${fmt(absAngle, 1)}°`}
        </span>
      </div>

      <div className="aev-body eigex-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg eigex-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <filter id={`${ID}-glow`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.4" />
              </filter>
              <marker
                id={`${ID}-head-v`}
                markerWidth="9"
                markerHeight="9"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
              </marker>
              <marker
                id={`${ID}-head-mv`}
                markerWidth="9"
                markerHeight="9"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--hue-pink)" />
              </marker>
            </defs>

            {/* transformed grid (faint) — image of integer grid under M */}
            {gridLines.map((i) => {
              const p1 = toScreen(a * i + b * -4, c * i + d * -4);
              const p2 = toScreen(a * i + b * 4, c * i + d * 4);
              const q1 = toScreen(a * -4 + b * i, c * -4 + d * i);
              const q2 = toScreen(a * 4 + b * i, c * 4 + d * i);
              return (
                <g key={`tg-${i}`}>
                  <line
                    x1={p1[0]}
                    y1={p1[1]}
                    x2={p2[0]}
                    y2={p2[1]}
                    stroke="var(--hue-mint)"
                    strokeWidth="0.5"
                    opacity="0.18"
                  />
                  <line
                    x1={q1[0]}
                    y1={q1[1]}
                    x2={q2[0]}
                    y2={q2[1]}
                    stroke="var(--hue-mint)"
                    strokeWidth="0.5"
                    opacity="0.18"
                  />
                </g>
              );
            })}

            {/* base grid */}
            {gridLines.map((i) => (
              <g key={`g-${i}`}>
                <line
                  x1={CX + i * UNIT}
                  y1={CY - 4 * UNIT}
                  x2={CX + i * UNIT}
                  y2={CY + 4 * UNIT}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity="0.5"
                />
                <line
                  x1={CX - 4 * UNIT}
                  y1={CY - i * UNIT}
                  x2={CX + 4 * UNIT}
                  y2={CY - i * UNIT}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity="0.5"
                />
              </g>
            ))}

            {/* axes */}
            <line x1={CX - 4 * UNIT} y1={CY} x2={CX + 4 * UNIT} y2={CY} stroke="var(--text-dim)" strokeWidth="1" />
            <line x1={CX} y1={CY - 4 * UNIT} x2={CX} y2={CY + 4 * UNIT} stroke="var(--text-dim)" strokeWidth="1" />

            {/* eigenvector lines */}
            {eigLines.map((el) => (
              <line
                key={`el-${el.idx}`}
                x1={el.x1}
                y1={el.y1}
                x2={el.x2}
                y2={el.y2}
                stroke={eigColors[el.idx]}
                strokeWidth="1.6"
                strokeDasharray="6 5"
                opacity="0.8"
              />
            ))}
            {eigLines.map((el) => (
              <text
                key={`elt-${el.idx}`}
                x={el.x2 > CX ? el.x2 - 6 : el.x2 + 6}
                y={el.y2 > CY ? el.y2 - 6 : el.y2 + 12}
                fontSize="9"
                fontFamily="var(--mono)"
                fill={eigColors[el.idx]}
                textAnchor={el.x2 > CX ? 'end' : 'start'}
              >
                λ{el.idx + 1}={fmt(el.lambda, 2)}
              </text>
            ))}

            {/* M·v arrow (pink) */}
            <Arrow
              x1={CX}
              y1={CY}
              x2={mvsx}
              y2={mvsy}
              color="var(--hue-pink)"
              headId={`${ID}-head-mv`}
              width={2.6}
              dash={aligned ? undefined : '5 4'}
            />
            <text
              x={mvsx + (Mv.x >= 0 ? 8 : -8)}
              y={mvsy + (Mv.y >= 0 ? -6 : 14)}
              fontSize="10"
              fontFamily="var(--mono)"
              fill="var(--hue-pink)"
              textAnchor={Mv.x >= 0 ? 'start' : 'end'}
            >
              M·v
            </text>

            {/* v arrow (accent, glowing) */}
            <Arrow
              x1={CX}
              y1={CY}
              x2={vsx}
              y2={vsy}
              color="var(--accent)"
              headId={`${ID}-head-v`}
              width={2.8}
              glow={`${ID}-glow`}
            />
            <text
              x={vsx + (v.x >= 0 ? 8 : -8)}
              y={vsy + (v.y >= 0 ? -6 : 14)}
              fontSize="10"
              fontFamily="var(--mono)"
              fill="var(--accent)"
              textAnchor={v.x >= 0 ? 'start' : 'end'}
            >
              v
            </text>

            {/* aligned badge near tip */}
            {aligned && (
              <g>
                <circle cx={vsx} cy={vsy} r="14" fill="var(--hue-violet)" opacity="0.16" />
                <circle cx={vsx} cy={vsy} r="14" fill="none" stroke="var(--hue-violet)" strokeWidth="1.4" opacity="0.7" />
              </g>
            )}

            {/* draggable handle on v tip */}
            <circle cx={vsx} cy={vsy} r="11" fill="rgba(var(--accent-rgb), 0.16)" style={{ transition: dotTrans }} />
            <circle cx={vsx} cy={vsy} r="6.5" fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0.75" style={{ transition: dotTrans }} />
            <circle cx={vsx} cy={vsy} r="4" fill="var(--accent)" style={{ transition: dotTrans, cursor: 'grab' }} />
          </svg>
        </div>

        <div className="mlviz-statcol eigex-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">∠(v, Mv)</span>
            <span className="mlviz-statcard-val">{fmt(absAngle, 1)}°</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">|Mv| / |v|</span>
            <span className="mlviz-statcard-val">{fmt(ratio)}</span>
          </div>
          <div className={`mlviz-statcard ${aligned ? 'mlviz-statcard-violet' : 'mlviz-statcard-dim'}`}>
            <span className="mlviz-statcard-label">eigenvector?</span>
            <span className="mlviz-statcard-val">{aligned ? 'YES' : 'no'}</span>
            <span className="eig-card-sub">{aligned ? `λ ≈ ${fmt(effLambda)}` : 'rotate v onto a line'}</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <div className="eigex-mrow">
          <span className="mlviz-slider-label">matrix M</span>
          {[
            ['a', a, setA],
            ['b', b, setB],
            ['c', c, setC],
            ['d', d, setD],
          ].map(([name, val, set]) => (
            <label key={name} className="eigex-cell">
              <span className="eigex-cell-name">{name}</span>
              <input
                type="range"
                min={-3}
                max={3}
                step="0.1"
                value={val}
                onChange={(e) => set(parseFloat(e.target.value))}
              />
              <span className="eigex-cell-val">{fmt(val, 1)}</span>
            </label>
          ))}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setV(eigs ? { x: eigs[0].vec[0] * 1.6, y: eigs[0].vec[1] * 1.6 } : DEFAULT_V)} disabled={!eigs}>
            <Compass size={13} />
            <span>Snap to eigenvector</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {eigs
            ? 'violet & sky lines = eigenvectors · the faint mint grid is M applied to the plane'
            : 'complex eigenvalues — this M is a rotation, no real eigenvector exists'}
        </div>
      </div>
    </div>
  );
}
