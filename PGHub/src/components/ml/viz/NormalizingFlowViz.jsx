import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

/*
 * Change-of-variables made visual.
 * Left: a uniform grid over a base Gaussian latent z in [-3,3]^2.
 * Right: the SAME grid pushed through an invertible warp f_strength(z).
 * The warp is a smooth, monotone, analytically-invertible map whose Jacobian
 * determinant we can compute in closed form, so each transformed grid cell's
 * AREA = |det J| at that point — that is exactly the density-correction factor
 * in p_x(x) = p_z(z) / |det J|. A 1-D density strip under each panel shows the
 * base Gaussian becoming bimodal as strength grows. Readout: mean log|det J|.
 */

const W = 600;
const H = 340;
const PANEL = 240;
const GAP = 40;
const PAD_T = 28;
const ORIGIN_X_L = 24;
const ORIGIN_X_R = ORIGIN_X_L + PANEL + GAP;

const DOMAIN = 3; // z in [-DOMAIN, DOMAIN]
const N = 9; // grid lines per axis

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Forward warp on one coordinate channel. s controls strength.
// f(u) = u + s * tanh(u)  -> monotone (f' = 1 + s*sech^2(u) > 0 for s>=0), invertible.
// Plus a cross-coupling so the 2-D map warps into a curved sheet.
function warp(u, v, s) {
  const fx = u + s * Math.tanh(u) + s * 0.35 * Math.sin(v * 0.9);
  const fy = v + s * 0.6 * Math.tanh(v);
  return [fx, fy];
}

// Jacobian det of warp at (u,v).
// dfx/du = 1 + s*sech^2(u);  dfx/dv = s*0.35*0.9*cos(v*0.9)
// dfy/du = 0;                dfy/dv = 1 + s*0.6*sech^2(v)
function logDet(u, v, s) {
  const sech2u = 1 / Math.cosh(u) ** 2;
  const sech2v = 1 / Math.cosh(v) ** 2;
  const a = 1 + s * sech2u;
  const d = 1 + s * 0.6 * sech2v;
  // dfy/du = 0 so det = a*d - (dfx/dv)*(dfy/du) = a*d
  const det = a * d;
  return Math.log(Math.abs(det) + 1e-9);
}

// map model coords -> pixel within a panel
function toPx(originX, mx, my, scale) {
  const cx = originX + PANEL / 2;
  const cy = PAD_T + PANEL / 2;
  return [cx + (mx / (DOMAIN * scale)) * (PANEL / 2 - 6), cy - (my / (DOMAIN * scale)) * (PANEL / 2 - 6)];
}

const STEPS = 26; // samples per grid line for smooth curves

export default function NormalizingFlowViz() {
  const [strength, setStrength] = useState(1.2);
  const s = strength;

  // base grid (left) — straight lines.
  const baseLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < N; i++) {
      const u = -DOMAIN + (i / (N - 1)) * 2 * DOMAIN;
      const vert = [];
      const horiz = [];
      for (let j = 0; j < STEPS; j++) {
        const t = -DOMAIN + (j / (STEPS - 1)) * 2 * DOMAIN;
        vert.push([u, t]);
        horiz.push([t, u]);
      }
      lines.push(vert, horiz);
    }
    return lines;
  }, []);

  // warped grid (right) — push every point through f.
  const warpedLines = useMemo(
    () => baseLines.map((line) => line.map(([u, v]) => warp(u, v, s))),
    [baseLines, s],
  );

  // mean log|det J| over a dense sample of latent points (the expected correction).
  const meanLogDet = useMemo(() => {
    let acc = 0;
    let cnt = 0;
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        const u = -DOMAIN + (i / 20) * 2 * DOMAIN;
        const v = -DOMAIN + (j / 20) * 2 * DOMAIN;
        // weight by base Gaussian so it reflects where probability mass lives
        const wgt = Math.exp(-0.5 * (u * u + v * v));
        acc += logDet(u, v, s) * wgt;
        cnt += wgt;
      }
    }
    return acc / cnt;
  }, [s]);

  // center cell |det J| readout (z=0)
  const centerDet = Math.exp(logDet(0, 0, s));

  // right panel needs a larger scale because warp expands the domain
  const rScale = 1 + s * 0.55;

  function pathFor(line, originX, scale) {
    let d = '';
    for (let k = 0; k < line.length; k++) {
      const [px, py] = toPx(originX, line[k][0], line[k][1], scale);
      d += `${k === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)} `;
    }
    return d.trim();
  }

  // 1-D marginal density strips under each panel (x-marginal).
  const baseMarg = useMemo(() => {
    const bins = 40;
    const counts = new Array(bins).fill(0);
    const lo = -DOMAIN;
    const hi = DOMAIN;
    for (let i = 0; i < 60; i++) {
      for (let j = 0; j < 60; j++) {
        const u = -DOMAIN + (i / 59) * 2 * DOMAIN;
        const v = -DOMAIN + (j / 59) * 2 * DOMAIN;
        const wgt = Math.exp(-0.5 * (u * u + v * v));
        const b = Math.floor(((u - lo) / (hi - lo)) * bins);
        if (b >= 0 && b < bins) counts[b] += wgt;
      }
    }
    const max = Math.max(...counts, 1e-6);
    return counts.map((c) => c / max);
  }, []);
  const warpMarg = useMemo(() => {
    const bins = 40;
    const counts = new Array(bins).fill(0);
    const lo = -DOMAIN * rScale;
    const hi = DOMAIN * rScale;
    for (let i = 0; i < 60; i++) {
      for (let j = 0; j < 60; j++) {
        const u = -DOMAIN + (i / 59) * 2 * DOMAIN;
        const v = -DOMAIN + (j / 59) * 2 * DOMAIN;
        const wgt = Math.exp(-0.5 * (u * u + v * v));
        const x = warp(u, v, s)[0];
        const b = Math.floor(((x - lo) / (hi - lo)) * bins);
        if (b >= 0 && b < bins) counts[b] += wgt;
      }
    }
    const max = Math.max(...counts, 1e-6);
    return counts.map((c) => c / max);
  }, [s, rScale]);

  function stripPath(marg, originX) {
    const stripY = PAD_T + PANEL + 14;
    const stripH = 30;
    let d = `M${originX},${stripY + stripH} `;
    for (let i = 0; i < marg.length; i++) {
      const px = originX + (i / (marg.length - 1)) * PANEL;
      const py = stripY + stripH - marg[i] * stripH;
      d += `L${px.toFixed(1)},${py.toFixed(1)} `;
    }
    d += `L${originX + PANEL},${stripY + stripH} Z`;
    return d;
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" style={{ maxWidth: '820px' }}>
          <text x={ORIGIN_X_L + PANEL / 2} y={16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            BASE z ~ N(0, I)
          </text>
          <text x={ORIGIN_X_R + PANEL / 2} y={16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            x = f(z) · warped density
          </text>

          {/* panel borders */}
          <rect x={ORIGIN_X_L} y={PAD_T} width={PANEL} height={PANEL} fill="none" stroke="var(--border)" strokeWidth="1" rx="4" />
          <rect x={ORIGIN_X_R} y={PAD_T} width={PANEL} height={PANEL} fill="none" stroke="var(--border)" strokeWidth="1" rx="4" />

          {/* base grid */}
          {baseLines.map((line, i) => (
            <path key={`b${i}`} d={pathFor(line, ORIGIN_X_L, 1)} fill="none" stroke="var(--hue-sky)" strokeWidth={i % 2 === 0 ? 0.9 : 0.9} opacity="0.55" />
          ))}

          {/* warped grid — color each cell-line by local log|det J| via opacity */}
          {warpedLines.map((line, i) => (
            <path key={`w${i}`} d={pathFor(line, ORIGIN_X_R, rScale)} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
          ))}

          {/* arrow between panels */}
          <g transform={`translate(${ORIGIN_X_L + PANEL + GAP / 2}, ${PAD_T + PANEL / 2})`}>
            <line x1="-12" y1="0" x2="12" y2="0" stroke="var(--text-dim)" strokeWidth="1.4" />
            <path d="M6,-5 L12,0 L6,5" fill="none" stroke="var(--text-dim)" strokeWidth="1.4" />
            <text x="0" y="-10" fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">f</text>
          </g>

          {/* density strips */}
          <path d={stripPath(baseMarg, ORIGIN_X_L)} fill="var(--hue-sky)" opacity="0.22" stroke="var(--hue-sky)" strokeWidth="1" />
          <path d={stripPath(warpMarg, ORIGIN_X_R)} fill="var(--hue-pink)" opacity="0.22" stroke="var(--hue-pink)" strokeWidth="1" />
          <text x={ORIGIN_X_L} y={PAD_T + PANEL + 56} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)">x-marginal: single mode</text>
          <text x={ORIGIN_X_R} y={PAD_T + PANEL + 56} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)">x-marginal: widened / multi-mode</text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">flow strength s</span>
          <input type="range" min="0" max="2.2" step="0.05" value={strength} onChange={(e) => setStrength(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(strength, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">f</span>
            <span className="mlviz-val">x = z + s·tanh(z) + cross-coupling</span>
            <span className="mlviz-sub">monotone ⇒ invertible ⇒ a valid flow layer</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">|det J| @0</span>
            <span className="mlviz-val">{snap(centerDet, 3)}</span>
            <span className="mlviz-sub">center cell area: grid stretches ⇒ density divides by this</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">E[log|det J|]</span>
            <span className="mlviz-val">{snap(meanLogDet, 3)}</span>
            <span className="mlviz-sub">the log-likelihood correction: log p_x = log p_z − log|det J|</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setStrength(1.2)}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          a flow reshapes a simple Gaussian into a complex density by an invertible map · where the grid stretches, |det J| &gt; 1 and probability thins out · the exact log-likelihood is the base log-density minus log|det J| — no approximation
        </div>
      </div>
    </div>
  );
}
