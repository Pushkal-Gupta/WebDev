import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 380;
const PAD = 50;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Anisotropic quadratic loss L = 0.5 * (x - c)^T F (x - c),
// F = diag(fx, fy) is the local metric (a stand-in for the Fisher).
// anisotropy 'a' sets fx = a, fy = 1.
const MINX = 0;
const MINY = 0;

export default function NaturalGradientViz() {
  const [aniso, setAniso] = useState(6);

  const fx = aniso;
  const fy = 1;

  // start point
  const px = 2.4;
  const py = 2.2;

  const data = useMemo(() => {
    // gradient of L at (px,py): F (x - c)
    const gx = fx * (px - MINX);
    const gy = fy * (py - MINY);
    // Euclidean step direction: -grad (normalized for display)
    const eg = Math.hypot(gx, gy);
    const eucDir = [-gx / eg, -gy / eg];
    // Natural step: -F^{-1} grad = -(x - c)  -> points straight at the minimum
    const ngx = -(px - MINX);
    const ngy = -(py - MINY);
    const ng = Math.hypot(ngx, ngy);
    const natDir = [ngx / ng, ngy / ng];
    return { gx, gy, eucDir, natDir, distToMin: ng };
  }, [fx, fy]);

  const XMIN = -1.2;
  const XMAX = 3.2;
  const YMIN = -1.2;
  const YMAX = 3.2;
  const top = PAD;
  const plotH = H - PAD - 70;
  const plotW = W - PAD * 2;

  const sx = (wx) => PAD + ((wx - XMIN) / (XMAX - XMIN)) * plotW;
  const sy = (wy) => top + plotH - ((wy - YMIN) / (YMAX - YMIN)) * plotH;

  // contour ellipses of L: x^2 * fx + y^2 * fy = const
  const contours = [0.8, 2.0, 4.0, 7.0];

  // arrow scale (world units) so arrows are visible regardless of dir
  const ARR = 1.6;
  const eucEnd = [px + data.eucDir[0] * ARR, py + data.eucDir[1] * ARR];
  const natEnd = [px + data.natDir[0] * ARR, py + data.natDir[1] * ARR];

  // angle between the two directions
  const dot = data.eucDir[0] * data.natDir[0] + data.eucDir[1] * data.natDir[1];
  const angle = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;

  // local Fisher ellipse around the start point (orientation of the metric)
  const ellRx = (Math.sqrt(1 / fx) / (XMAX - XMIN)) * plotW * 1.0;
  const ellRy = (Math.sqrt(1 / fy) / (YMAX - YMIN)) * plotH * 1.0;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '840px' }}>
          <defs>
            <marker id="ng-euc" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
            <marker id="ng-nat" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
            </marker>
          </defs>

          <text x={PAD} y={top - 18} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
            EUCLIDEAN STEP vs NATURAL STEP  ·  anisotropy a = {aniso}
          </text>

          <rect x={PAD} y={top} width={plotW} height={plotH} fill="none" stroke="var(--border)" strokeWidth="0.8" rx="3" />

          {/* loss contours (the elongated valley) */}
          {contours.map((c) => (
            <ellipse
              key={`lc-${c}`}
              cx={sx(MINX)}
              cy={sy(MINY)}
              rx={(Math.sqrt((2 * c) / fx) / (XMAX - XMIN)) * plotW}
              ry={(Math.sqrt((2 * c) / fy) / (YMAX - YMIN)) * plotH}
              fill="none"
              stroke="var(--hue-violet)"
              strokeWidth="0.6"
              opacity="0.4"
            />
          ))}

          {/* minimum */}
          <circle cx={sx(MINX)} cy={sy(MINY)} r="4" fill="var(--hue-mint, var(--accent))" />
          <text x={sx(MINX) + 7} y={sy(MINY) - 6} fontSize="7" fill="var(--text-dim)" fontFamily="var(--mono)">
            minimum
          </text>

          {/* local Fisher / metric ellipse at the start point */}
          <ellipse
            cx={sx(px)}
            cy={sy(py)}
            rx={ellRx}
            ry={ellRy}
            fill="rgba(var(--accent-rgb), 0.10)"
            stroke="var(--accent)"
            strokeWidth="0.7"
            strokeDasharray="3 2"
            opacity="0.8"
          />
          <text x={sx(px) + ellRx + 4} y={sy(py) - 2} fontSize="6.5" fill="var(--accent)" fontFamily="var(--mono)">
            Fisher F
          </text>

          {/* start point */}
          <circle cx={sx(px)} cy={sy(py)} r="4" fill="var(--text-main)" />
          <text x={sx(px) + 7} y={sy(py) + 12} fontSize="7" fill="var(--text-dim)" fontFamily="var(--mono)">
            θ
          </text>

          {/* Euclidean step arrow */}
          <line
            x1={sx(px)}
            y1={sy(py)}
            x2={sx(eucEnd[0])}
            y2={sy(eucEnd[1])}
            stroke="var(--hue-pink)"
            strokeWidth="2"
            markerEnd="url(#ng-euc)"
          />
          {/* Natural step arrow */}
          <line
            x1={sx(px)}
            y1={sy(py)}
            x2={sx(natEnd[0])}
            y2={sy(natEnd[1])}
            stroke="var(--accent)"
            strokeWidth="2"
            markerEnd="url(#ng-nat)"
          />

          {/* legend */}
          <g fontFamily="var(--mono)" fontSize="7.5">
            <rect x={PAD + 6} y={top + plotH - 22} width="9" height="3" fill="var(--hue-pink)" />
            <text x={PAD + 19} y={top + plotH - 19} fill="var(--text-dim)">−∇L (Euclidean)</text>
            <rect x={PAD + 6} y={top + plotH - 10} width="9" height="3" fill="var(--accent)" />
            <text x={PAD + 19} y={top + plotH - 7} fill="var(--text-dim)">−F⁻¹∇L (natural)</text>
          </g>

          <line x1={PAD} y1={H - 18} x2={W - PAD} y2={H - 18} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3" />
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">anisotropy a</span>
          <input type="range" min="1" max="12" step="1" value={aniso} onChange={(e) => setAniso(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{aniso}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">∇L</span>
            <span className="mlviz-val">−∇L ∝ ({snap(data.eucDir[0], 2)}, {snap(data.eucDir[1], 2)})</span>
            <span className="mlviz-sub">leans toward the steep axis — not at the minimum</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">F⁻¹∇L</span>
            <span className="mlviz-val">−F⁻¹∇L ∝ ({snap(data.natDir[0], 2)}, {snap(data.natDir[1], 2)})</span>
            <span className="mlviz-sub">rescaled by the inverse metric — points straight at c</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">angle</span>
            <span className="mlviz-val">{snap(angle, 1)}° between the two directions</span>
            <span className="mlviz-sub">grows with anisotropy — at a = 1 the metric is round and they coincide</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setAniso(6)}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          the Euclidean gradient is steepest descent under a round ruler · the natural gradient measures distance
          by the Fisher metric (KL geometry), so F⁻¹ stretches the step back toward the true minimum
        </div>
      </div>
    </div>
  );
}
