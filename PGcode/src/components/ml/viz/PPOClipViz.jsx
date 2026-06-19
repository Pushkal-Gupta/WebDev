import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const LEFT_PAD = 54;
const RIGHT_PAD = 18;
const TOP_PAD = 26;
const BOT_PAD = 44;

const R_MIN = 0;
const R_MAX = 2.2;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// L_unclipped(r) = r * A   ;   L_clipped(r) = min(r*A, clip(r,1-e,1+e)*A)
function clip(r, lo, hi) {
  return Math.min(Math.max(r, lo), hi);
}

function surrogate(r, A, eps) {
  const unclipped = r * A;
  const clipped = clip(r, 1 - eps, 1 + eps) * A;
  return Math.min(unclipped, clipped); // PPO takes the pessimistic min for both signs
}

export default function PPOClipViz() {
  const [eps, setEps] = useState(0.2);
  const [advPos, setAdvPos] = useState(true);
  const [rHover, setRHover] = useState(1.0);

  const A = advPos ? 1 : -1;

  const plotW = W - LEFT_PAD - RIGHT_PAD;
  const plotH = H - TOP_PAD - BOT_PAD;
  const x0 = LEFT_PAD;
  const y0 = TOP_PAD;

  // y range: objective spans roughly [-(1+eps), +(1+eps)] for |A|=1
  const yMin = -(1 + 0.4);
  const yMax = (1 + 0.4);

  const xOf = (r) => x0 + ((r - R_MIN) / (R_MAX - R_MIN)) * plotW;
  const yOf = (v) => y0 + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const samples = useMemo(() => {
    const out = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const r = R_MIN + (i / N) * (R_MAX - R_MIN);
      out.push({ r, unclipped: r * A, clipped: surrogate(r, A, eps) });
    }
    return out;
  }, [A, eps]);

  const unclippedPath = samples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${snap(xOf(s.r), 1)} ${snap(yOf(s.unclipped), 1)}`).join(' ');
  const clippedPath = samples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${snap(xOf(s.r), 1)} ${snap(yOf(s.clipped), 1)}`).join(' ');

  const loR = 1 - eps;
  const hiR = 1 + eps;

  // gradient is zero where the clipped curve is flat (the clamped region)
  // for A>0: flat for r > 1+eps ; for A<0: flat for r < 1-eps
  const flatLo = advPos ? hiR : R_MIN;
  const flatHi = advPos ? R_MAX : loR;

  const hClip = surrogate(rHover, A, eps);
  const hUn = rHover * A;
  const isClipped = Math.abs(hClip - hUn) > 1e-9;
  // gradient nonzero only inside the active (sloped) region
  const gradLive = !(
    (advPos && rHover > hiR) || (!advPos && rHover < loR)
  );

  const yZero = yOf(0);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '840px' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * W;
            const r = R_MIN + ((px - x0) / plotW) * (R_MAX - R_MIN);
            setRHover(Math.min(R_MAX, Math.max(R_MIN, r)));
          }}
        >
          {/* flat / zero-gradient shaded band */}
          {flatHi > flatLo && (
            <rect
              x={xOf(flatLo)}
              y={y0}
              width={xOf(flatHi) - xOf(flatLo)}
              height={plotH}
              fill="var(--text-dim)"
              opacity="0.08"
            />
          )}

          {/* trust band [1-eps, 1+eps] */}
          <rect
            x={xOf(loR)}
            y={y0}
            width={xOf(hiR) - xOf(loR)}
            height={plotH}
            fill="var(--accent)"
            opacity="0.07"
          />

          {/* axes */}
          <line x1={x0} y1={y0} x2={x0} y2={y0 + plotH} stroke="var(--border)" strokeWidth="0.8" />
          <line x1={x0} y1={yZero} x2={x0 + plotW} y2={yZero} stroke="var(--border)" strokeWidth="0.8" />

          {/* x ticks */}
          {[0, 0.5, loR, 1.0, hiR, 1.5, 2.0].map((t) => (
            <g key={`xt-${t}`}>
              <line x1={xOf(t)} y1={yZero - 3} x2={xOf(t)} y2={yZero + 3} stroke="var(--text-dim)" strokeWidth="0.6" />
              <text x={xOf(t)} y={y0 + plotH + 14} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                {snap(t, 2)}
              </text>
            </g>
          ))}

          {/* r = 1 anchor */}
          <line x1={xOf(1)} y1={y0} x2={xOf(1)} y2={y0 + plotH} stroke="var(--text-dim)" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.6" />

          {/* clip boundaries */}
          {[loR, hiR].map((b) => (
            <line key={`b-${b}`} x1={xOf(b)} y1={y0} x2={xOf(b)} y2={y0 + plotH} stroke="var(--accent)" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.7" />
          ))}

          {/* unclipped objective (dashed) */}
          <path d={unclippedPath} fill="none" stroke="var(--hue-violet)" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.7" />
          {/* clipped objective (solid, the one PPO uses) */}
          <path d={clippedPath} fill="none" stroke="var(--accent)" strokeWidth="2.2" />

          {/* hover marker */}
          <circle cx={xOf(rHover)} cy={yOf(hClip)} r="4" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.2" />
          <line x1={xOf(rHover)} y1={y0} x2={xOf(rHover)} y2={y0 + plotH} stroke="var(--accent)" strokeWidth="0.5" opacity="0.4" />

          {/* labels */}
          <text x={x0 + plotW} y={y0 + plotH + 30} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
            probability ratio  r = π_new / π_old
          </text>
          <text x={x0 - 6} y={yOf(A * (1 + eps)) - 6} fontSize="8" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="start">
            L_clip
          </text>
          <text x={x0 + 6} y={y0 + 10} fontSize="8" fill="var(--hue-violet)" fontFamily="var(--mono)" opacity="0.8">
            r·A (unclipped)
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">ε</span>
          <input type="range" min="0.05" max="0.5" step="0.01" value={eps} onChange={(e) => setEps(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{snap(eps, 2)}</span>
        </label>

        <div className="mlviz-toggles">
          <button type="button" className={`mlviz-toggle ${advPos ? 'is-on' : ''}`} onClick={() => setAdvPos(true)}>
            <span className="mlviz-toggle-dot" />A &gt; 0 (good action)
          </button>
          <button type="button" className={`mlviz-toggle ${!advPos ? 'is-on' : ''}`} onClick={() => setAdvPos(false)}>
            <span className="mlviz-toggle-dot" />A &lt; 0 (bad action)
          </button>
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">r</span>
            <span className="mlviz-val">{snap(rHover, 3)}</span>
            <span className="mlviz-sub">trust band [{snap(loR, 2)}, {snap(hiR, 2)}] — move stays inside</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">L</span>
            <span className="mlviz-val">clipped {snap(hClip, 3)} · raw {snap(hUn, 3)}</span>
            <span className="mlviz-sub">{isClipped ? 'clamped: objective stops rewarding the move' : 'inside band: objective tracks r·A'}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">∂L</span>
            <span className="mlviz-val">{gradLive ? 'nonzero' : 'zero'}</span>
            <span className="mlviz-sub">{gradLive ? 'gradient pushes the ratio' : 'flat region → no incentive to move r further'}</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => { setEps(0.2); setAdvPos(true); setRHover(1.0); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          clipping caps how far one update can move the policy · outside the band the gradient is zero
        </div>
      </div>
    </div>
  );
}
