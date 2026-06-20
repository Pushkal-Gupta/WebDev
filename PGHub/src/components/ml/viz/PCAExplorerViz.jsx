import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Crosshair, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 520;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const SCALE = 30; // px per data unit
const N = 60;
const RING_R = 150; // radius of the angle-handle ring (px)

// deterministic PRNG
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller standard normal from a uniform RNG
function makeNormal(rng) {
  return () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

function buildCloud(seed, corr) {
  const rng = mulberry32(seed);
  const norm = makeNormal(rng);
  const sx = 2.7;
  const sy = 1.1;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const z1 = norm();
    const z2 = norm();
    // correlated via a shear, then we describe with a base orientation
    const x = z1 * sx;
    const y = corr * x * 0.32 + z2 * sy;
    pts.push([x, y]);
  }
  // center
  let mx = 0;
  let my = 0;
  pts.forEach(([x, y]) => {
    mx += x;
    my += y;
  });
  mx /= N;
  my /= N;
  return pts.map(([x, y]) => [x - mx, y - my]);
}

function fmt(v, p = 2) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

function toScreen(x, y) {
  return [CX + x * SCALE, CY - y * SCALE];
}

export default function PCAExplorerViz({ seed = 7, correlation = 1 }) {
  const [theta, setTheta] = useState(0.35); // axis angle (radians)
  const svgRef = useRef(null);
  const dragRef = useRef(false);

  const pts = useMemo(() => buildCloud(seed, correlation), [seed, correlation]);

  // covariance + principal direction
  const { pcAngle, totalVar, varAlong, l1, l2 } = useMemo(() => {
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    pts.forEach(([x, y]) => {
      sxx += x * x;
      syy += y * y;
      sxy += x * y;
    });
    sxx /= pts.length;
    syy /= pts.length;
    sxy /= pts.length;
    const tr = sxx + syy;
    const det = sxx * syy - sxy * sxy;
    const disc = Math.max(0, tr * tr - 4 * det);
    const s = Math.sqrt(disc);
    const lambda1 = (tr + s) / 2;
    const lambda2 = (tr - s) / 2;
    // eigenvector of lambda1
    let vx = sxy;
    let vy = lambda1 - sxx;
    if (Math.abs(vx) < 1e-9 && Math.abs(vy) < 1e-9) {
      vx = 1;
      vy = 0;
    }
    const ang = Math.atan2(vy, vx);
    // variance captured along current axis theta
    const dx = Math.cos(theta);
    const dy = Math.sin(theta);
    const vAlong = dx * dx * sxx + 2 * dx * dy * sxy + dy * dy * syy;
    return { pcAngle: ang, totalVar: tr, varAlong: vAlong, l1: lambda1, l2: lambda2 };
  }, [pts, theta]);

  const captured = totalVar > 1e-9 ? (varAlong / totalVar) * 100 : 0;
  const dx = Math.cos(theta);
  const dy = Math.sin(theta);

  // projected points onto axis (in data coords)
  const projected = pts.map(([x, y]) => {
    const t = x * dx + y * dy;
    return [t * dx, t * dy, t];
  });

  // handle position on the ring
  const handleScr = [CX + Math.cos(theta) * RING_R, CY - Math.sin(theta) * RING_R];

  const updateFromClient = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * W;
    const sy = ((clientY - rect.top) / rect.height) * H;
    const ang = Math.atan2(CY - sy, sx - CX);
    setTheta(ang);
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

  const reset = useCallback(() => setTheta(0.35), []);
  const snapToPC = useCallback(() => setTheta(pcAngle), [pcAngle]);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const axisDeg = ((theta * 180) / Math.PI + 360) % 180;
  const pcDeg = ((pcAngle * 180) / Math.PI + 360) % 180;
  const atMax = Math.abs(((theta - pcAngle) % Math.PI + Math.PI + Math.PI / 2) % Math.PI - Math.PI / 2) < 0.04;

  // axis endpoints (long line through origin)
  const axLen = 6.5;
  const [ax1x, ax1y] = toScreen(-dx * axLen, -dy * axLen);
  const [ax2x, ax2y] = toScreen(dx * axLen, dy * axLen);

  const ID = 'pcaex';

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Crosshair size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">PCA explorer</span>
          <span className="aev-head-sub">
            rotate the axis — find the direction that captures the most variance
          </span>
        </span>
        <span className="aev-chip">{fmt(captured, 1)}% var</span>
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
                <feGaussianBlur stdDeviation="3.2" />
              </filter>
              <linearGradient id={`${ID}-axis`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--hue-pink)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>

            {/* angle ring */}
            <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />

            {/* PC1 direction marker on ring */}
            <line
              x1={CX}
              y1={CY}
              x2={CX + Math.cos(pcAngle) * RING_R}
              y2={CY - Math.sin(pcAngle) * RING_R}
              stroke="var(--hue-violet)"
              strokeWidth="1.4"
              strokeDasharray="5 4"
              opacity="0.7"
            />
            <line
              x1={CX}
              y1={CY}
              x2={CX - Math.cos(pcAngle) * RING_R}
              y2={CY + Math.sin(pcAngle) * RING_R}
              stroke="var(--hue-violet)"
              strokeWidth="1.4"
              strokeDasharray="5 4"
              opacity="0.7"
            />
            <text
              x={CX + Math.cos(pcAngle) * (RING_R + 14)}
              y={CY - Math.sin(pcAngle) * (RING_R + 14)}
              fontSize="9.5"
              fontFamily="var(--mono)"
              fill="var(--hue-violet)"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              PC1
            </text>

            {/* projection axis (glowing) */}
            <line x1={ax1x} y1={ax1y} x2={ax2x} y2={ax2y} stroke={`url(#${ID}-axis)`} strokeWidth="5" strokeLinecap="round" filter={`url(#${ID}-glow)`} opacity="0.5" />
            <line x1={ax1x} y1={ax1y} x2={ax2x} y2={ax2y} stroke={`url(#${ID}-axis)`} strokeWidth="2.4" strokeLinecap="round" />

            {/* projection drop lines */}
            {pts.map(([x, y], i) => {
              const [px, py] = toScreen(x, y);
              const [qx, qy] = toScreen(projected[i][0], projected[i][1]);
              return (
                <line key={`drop-${i}`} x1={px} y1={py} x2={qx} y2={qy} stroke="var(--hue-mint)" strokeWidth="0.8" opacity="0.35" />
              );
            })}

            {/* original points */}
            {pts.map(([x, y], i) => {
              const [px, py] = toScreen(x, y);
              return <circle key={`pt-${i}`} cx={px} cy={py} r="3" fill="var(--accent)" opacity="0.85" />;
            })}

            {/* projected points on the axis */}
            {projected.map(([x, y], i) => {
              const [px, py] = toScreen(x, y);
              return <circle key={`pp-${i}`} cx={px} cy={py} r="2.4" fill="var(--hue-pink)" />;
            })}

            {/* draggable angle handle */}
            <circle cx={handleScr[0]} cy={handleScr[1]} r="12" fill="rgba(var(--accent-rgb), 0.16)" />
            <circle cx={handleScr[0]} cy={handleScr[1]} r="7" fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0.75" />
            <circle cx={handleScr[0]} cy={handleScr[1]} r="4.4" fill="var(--accent)" style={{ cursor: 'grab' }} />

            {/* max-variance badge */}
            {atMax && (
              <text x={CX} y={H - 14} fontSize="11" fontFamily="var(--mono)" fill="var(--hue-violet)" textAnchor="middle" fontWeight="700">
                aligned with PC1 — max variance
              </text>
            )}
          </svg>
        </div>

        <div className="mlviz-statcol eigex-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">axis angle</span>
            <span className="mlviz-statcard-val">{fmt(axisDeg, 0)}°</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">variance captured</span>
            <span className="mlviz-statcard-val">{fmt(captured, 1)}%</span>
            <span className="eig-card-sub">of {fmt(totalVar, 2)} total</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">PC1 angle</span>
            <span className="mlviz-statcard-val">{fmt(pcDeg, 0)}°</span>
            <span className="eig-card-sub">λ1 {fmt(l1, 2)} · λ2 {fmt(l2, 2)}</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">axis θ</span>
          <input
            type="range"
            min={0}
            max={Math.PI}
            step="0.01"
            value={((theta % Math.PI) + Math.PI) % Math.PI}
            onChange={(e) => setTheta(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{fmt(axisDeg, 0)}°</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={snapToPC}>
            <Crosshair size={13} />
            <span>Snap to PC1</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {reduced ? 'pink dots = projections onto the axis' : 'drag the ring handle · mint drops show each point collapsing onto the axis · variance peaks on PC1'}
        </div>
      </div>
    </div>
  );
}
