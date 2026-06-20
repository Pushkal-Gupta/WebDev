import React, { useMemo, useState, useCallback } from 'react';
import { RotateCcw, Play, StepForward } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;

function snap(v, p = 4) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRUE_PI = Math.PI;

// convergence panel geometry (module-level constants so the mapping
// functions are stable and not useMemo dependencies)
const CX0 = 350, CY0 = 56, CW = 220, CH = 224;
const Y_LO = TRUE_PI - 0.9, Y_HI = TRUE_PI + 0.9;
const xToPx = (i, nMaxPlot) => CX0 + (Math.log10(i + 1) / Math.log10(nMaxPlot)) * CW;
const yToPx = (v) => CY0 + CH - ((Math.min(Y_HI, Math.max(Y_LO, v)) - Y_LO) / (Y_HI - Y_LO)) * CH;

// generate up to MAX deterministic points + running estimate history
const MAX = 2000;
function buildSamples(seed) {
  const rand = mulberry32(seed);
  const pts = [];
  const estHist = []; // running estimate of pi after each point
  let inside = 0;
  for (let i = 0; i < MAX; i++) {
    const x = rand();
    const y = rand();
    const ins = x * x + y * y <= 1;
    if (ins) inside += 1;
    pts.push([x, y, ins]);
    estHist.push((4 * inside) / (i + 1));
  }
  return { pts, estHist };
}

export default function MonteCarloIntegrationViz() {
  const [seed, setSeed] = useState(7);
  const [n, setN] = useState(200);

  const { pts, estHist } = useMemo(() => buildSamples(seed), [seed]);

  // scatter panel
  const sx0 = 40, sy0 = 36, sSize = 264;
  const toScatter = (x, y) => [sx0 + x * sSize, sy0 + (1 - y) * sSize];

  const shown = pts.slice(0, n);
  const insideCount = shown.filter((p) => p[2]).length;
  const estimate = (4 * insideCount) / n;
  const error = Math.abs(estimate - TRUE_PI);
  const stdErr = 4 * Math.sqrt((TRUE_PI / 4) * (1 - TRUE_PI / 4)) / Math.sqrt(n); // ~1.64/sqrt(n)

  // convergence panel (right): running estimate vs n, with 1/sqrt(n) band
  const cx0 = CX0, cy0 = CY0, cw = CW, ch = CH;
  const nMaxPlot = MAX;
  const xPx = (i) => xToPx(i, nMaxPlot);

  // estimate polyline up to n
  const estPath = (() => {
    let d = '';
    for (let i = 4; i < n; i += Math.max(1, Math.floor(n / 240))) {
      const px = xPx(i);
      const py = yToPx(estHist[i]);
      d += `${d === '' ? 'M' : 'L'} ${snap(px, 1)} ${snap(py, 1)} `;
    }
    return d.trim();
  })();

  // 1/sqrt(n) error band around true pi
  const bandUpper = [];
  const bandLower = [];
  for (let i = 4; i <= n; i += Math.max(1, Math.floor(n / 120))) {
    const se = 1.642 / Math.sqrt(i);
    bandUpper.push([xPx(i), yToPx(TRUE_PI + se)]);
    bandLower.push([xPx(i), yToPx(TRUE_PI - se)]);
  }
  const bandPath = (() => {
    if (!bandUpper.length) return '';
    let d = `M ${snap(bandUpper[0][0], 1)} ${snap(bandUpper[0][1], 1)} `;
    for (let i = 1; i < bandUpper.length; i++) d += `L ${snap(bandUpper[i][0], 1)} ${snap(bandUpper[i][1], 1)} `;
    for (let i = bandLower.length - 1; i >= 0; i--) d += `L ${snap(bandLower[i][0], 1)} ${snap(bandLower[i][1], 1)} `;
    return d + 'Z';
  })();

  const play = useCallback(() => setN(MAX), []);
  const stepUp = useCallback(() => setN((v) => Math.min(MAX, Math.round(v * 2))), []);
  const reset = useCallback(() => { setN(200); setSeed(7); }, []);

  // quarter-circle arc path for the scatter overlay
  const arcPath = `M ${sx0} ${sy0 + sSize} A ${sSize} ${sSize} 0 0 1 ${sx0 + sSize} ${sy0} L ${sx0} ${sy0} Z`;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px' }}>
          <defs>
            <clipPath id="mc-sq"><rect x={sx0} y={sy0} width={sSize} height={sSize} /></clipPath>
          </defs>

          <text x={sx0} y={26} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.08em">
            DARTS in unit square · inside circle ⇒ x²+y² ≤ 1
          </text>

          {/* square + quarter circle */}
          <rect x={sx0} y={sy0} width={sSize} height={sSize} fill="rgba(var(--accent-rgb), 0.04)" stroke="var(--border)" strokeWidth="0.8" />
          <path d={arcPath} fill="rgba(var(--accent-rgb), 0.10)" stroke="var(--hue-violet)" strokeWidth="1.3" clipPath="url(#mc-sq)" />

          {/* points */}
          <g clipPath="url(#mc-sq)">
            {shown.map((p, i) => {
              const [px, py] = toScatter(p[0], p[1]);
              return <circle key={i} cx={snap(px, 1)} cy={snap(py, 1)} r={n > 600 ? 1.1 : 1.8}
                             fill={p[2] ? 'var(--accent)' : 'var(--hue-pink)'} opacity="0.8" />;
            })}
          </g>
          <text x={sx0 + sSize / 2} y={sy0 + sSize + 14} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            {insideCount} inside / {n} total  ·  area ratio ≈ π/4
          </text>

          {/* convergence plot */}
          <text x={cx0} y={44} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
            ESTIMATE → π  (1/√N band)
          </text>
          <rect x={cx0} y={cy0} width={cw} height={ch} fill="none" stroke="var(--border)" strokeWidth="0.6" />
          {/* true pi line */}
          <line x1={cx0} y1={yToPx(TRUE_PI)} x2={cx0 + cw} y2={yToPx(TRUE_PI)} stroke="var(--easy)" strokeWidth="1" strokeDasharray="4 3" />
          <text x={cx0 + cw - 2} y={yToPx(TRUE_PI) - 4} fontSize="7.5" fill="var(--easy)" fontFamily="var(--mono)" textAnchor="end">π = 3.1416</text>
          {/* error band */}
          <path d={bandPath} fill="rgba(var(--accent-rgb), 0.10)" stroke="none" />
          {/* running estimate */}
          <path d={estPath} fill="none" stroke="var(--accent)" strokeWidth="1.6" />
          {/* current estimate dot */}
          <circle cx={xPx(n - 1)} cy={yToPx(estimate)} r="3" fill="var(--accent)" />
          {/* x ticks */}
          {[10, 100, 1000].map((tick) => (
            <g key={tick}>
              <line x1={xPx(tick)} y1={cy0 + ch} x2={xPx(tick)} y2={cy0 + ch + 3} stroke="var(--text-dim)" strokeWidth="0.6" />
              <text x={xPx(tick)} y={cy0 + ch + 12} fontSize="7" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">{tick}</text>
            </g>
          ))}
          <text x={cx0 + cw / 2} y={cy0 + ch + 24} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">N (log)</text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">samples N</span>
          <input type="range" min="20" max={MAX} step="10" value={n} onChange={(e) => setN(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{n}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">seed</span>
          <input type="range" min="1" max="40" step="1" value={seed} onChange={(e) => setSeed(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{seed}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">est</span>
            <span className="mlviz-val">π̂ = 4 · ({insideCount}/{n}) = {snap(estimate, 4)}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">true</span>
            <span className="mlviz-val">π = {snap(TRUE_PI, 5)}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">err</span>
            <span className="mlviz-val" style={{ color: error < 0.05 ? 'var(--easy)' : error < 0.2 ? 'var(--medium)' : 'var(--hard)' }}>
              |π̂ − π| = {snap(error, 4)}
            </span>
            <span className="mlviz-sub">predicted ≈ {snap(stdErr, 4)} (1.64/√N)</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={stepUp} disabled={n >= MAX}>
            <StepForward size={13} />
            <span>×2 samples</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={play} disabled={n >= MAX}>
            <Play size={13} />
            <span>Fill all</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          the fraction of darts landing inside the quarter circle estimates π/4 · the band is the ±1.64/√N standard error · to halve the error you must quadruple the darts — error falls like 1/√N, not 1/N
        </div>
      </div>
    </div>
  );
}
