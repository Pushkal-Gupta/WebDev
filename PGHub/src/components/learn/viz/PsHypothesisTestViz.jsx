import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { FlaskConical, RotateCcw, Play, Pause, Sigma } from 'lucide-react';
import './PsHypothesisTestViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// standard normal pdf
function pdf(z) {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

// erf-based standard-normal CDF (deterministic)
function erf(x) {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return s * y;
}
function cdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// critical value for a given alpha + tail mode (inverse-normal via bisection)
function critical(alpha, twoTailed) {
  const target = twoTailed ? 1 - alpha / 2 : 1 - alpha; // upper-tail quantile
  let lo = 0;
  let hi = 6;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (cdf(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const Z_MIN = -4;
const Z_MAX = 4;
const DEFAULTS = { obs: 2.3, alpha: 0.05, twoTailed: true };
// a deterministic "sweep target" so the auto-play lands somewhere meaningful
const REST_OBS = 2.3;

// ---- static geometry (depends only on constants) ----
const W = 720;
const H = 300;
const PAD_L = 30;
const PAD_R = 30;
const PAD_T = 24;
const PAD_B = 38;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const BASE_Y = PAD_T + PLOT_H;
const PEAK = pdf(0);

const xToPx = (z) => PAD_L + ((z - Z_MIN) / (Z_MAX - Z_MIN)) * PLOT_W;
const yToPx = (d) => BASE_Y - (d / PEAK) * (PLOT_H - 6);

// shaded p-value tail area as a filled polygon point-string
function tailArea(fromZ, toZ) {
  const pts = [`${xToPx(fromZ).toFixed(2)},${BASE_Y.toFixed(2)}`];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const z = fromZ + (i / n) * (toZ - fromZ);
    pts.push(`${xToPx(z).toFixed(2)},${yToPx(pdf(z)).toFixed(2)}`);
  }
  pts.push(`${xToPx(toZ).toFixed(2)},${BASE_Y.toFixed(2)}`);
  return pts.join(' ');
}

// the null curve never changes — compute its point-string once
const CURVE_PTS = (() => {
  const pts = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const z = Z_MIN + (i / steps) * (Z_MAX - Z_MIN);
    pts.push(`${xToPx(z).toFixed(2)},${yToPx(pdf(z)).toFixed(2)}`);
  }
  return pts.join(' ');
})();

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PsHypothesisTestViz() {
  const reduced = REDUCED;
  const [obs, setObs] = useState(reduced ? REST_OBS : DEFAULTS.obs);
  const [alpha, setAlpha] = useState(DEFAULTS.alpha);
  const [twoTailed, setTwoTailed] = useState(DEFAULTS.twoTailed);
  const [playing, setPlaying] = useState(!reduced);

  const rafRef = useRef(0);
  const dirRef = useRef(1);

  useEffect(() => {
    if (reduced || !playing) return undefined;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setObs((prev) => {
        let next = prev + dirRef.current * dt * 1.8;
        if (next > Z_MAX - 0.2) {
          next = Z_MAX - 0.2;
          dirRef.current = -1;
        } else if (next < Z_MIN + 0.2) {
          next = Z_MIN + 0.2;
          dirRef.current = 1;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, reduced]);

  const zStar = useMemo(() => critical(alpha, twoTailed), [alpha, twoTailed]);

  // two-tailed p uses |obs|; one-tailed tests H1: z > 0 (upper tail)
  const pValue = twoTailed ? 2 * (1 - cdf(Math.abs(obs))) : 1 - cdf(obs);
  const reject = twoTailed ? Math.abs(obs) > zStar : obs > zStar;

  const tails = useMemo(() => {
    const a = Math.abs(obs);
    if (twoTailed) {
      return [tailArea(a, Z_MAX), tailArea(Z_MIN, -a)];
    }
    return [tailArea(obs, Z_MAX)];
  }, [obs, twoTailed]);

  const reset = () => {
    setObs(DEFAULTS.obs);
    setAlpha(DEFAULTS.alpha);
    setTwoTailed(DEFAULTS.twoTailed);
    setPlaying(!reduced);
    dirRef.current = 1;
  };

  const fmt = (x, d = 2) => (Math.abs(x) < 1e-9 ? '0' : x.toFixed(d));

  const obsX = xToPx(obs);
  const obsTopY = yToPx(pdf(obs));
  const critRightX = xToPx(zStar);
  const critLeftX = xToPx(-zStar);

  return (
    <div className="psht">
      <div className="psht-head">
        <div className="psht-head-icon"><FlaskConical size={18} /></div>
        <div className="psht-head-text">
          <h3 className="psht-title">Hypothesis testing: p-values and the rejection region</h3>
          <p className="psht-sub">
            The bell is the null distribution of the z-statistic{' '}
            <span dangerouslySetInnerHTML={{ __html: km('z\\sim\\mathcal{N}(0,1)') }} />. The shaded tails are the{' '}
            <span dangerouslySetInnerHTML={{ __html: km('p') }} />-value past the observed{' '}
            <span dangerouslySetInnerHTML={{ __html: km('z') }} />. Reject{' '}
            <span dangerouslySetInnerHTML={{ __html: km('H_0') }} /> when it crosses the critical line{' '}
            <span dangerouslySetInnerHTML={{ __html: km('z^*') }} />.
          </p>
        </div>
        <div className="psht-head-btns">
          <button type="button" className="psht-btn" onClick={() => setPlaying((p) => !p)} disabled={reduced}>
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="psht-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>

      <div className="psht-chips">
        <button
          type="button"
          className={`psht-chip${twoTailed ? ' psht-chip-on' : ''}`}
          onClick={() => setTwoTailed(true)}
        >
          two-tailed
        </button>
        <button
          type="button"
          className={`psht-chip${!twoTailed ? ' psht-chip-on' : ''}`}
          onClick={() => setTwoTailed(false)}
        >
          one-tailed (upper)
        </button>
      </div>

      <div className="psht-controls">
        <label className="psht-slider">
          <span className="psht-slider-key">observed <span dangerouslySetInnerHTML={{ __html: km('z') }} /></span>
          <input
            type="range"
            min={Z_MIN + 0.2}
            max={Z_MAX - 0.2}
            step="0.01"
            value={obs}
            onChange={(e) => {
              setPlaying(false);
              setObs(parseFloat(e.target.value));
            }}
          />
          <span className="psht-slider-val">{fmt(obs)}</span>
        </label>
        <label className="psht-slider">
          <span className="psht-slider-key">significance <span dangerouslySetInnerHTML={{ __html: km('\\alpha') }} /></span>
          <input
            type="range"
            min="0.01"
            max="0.2"
            step="0.005"
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
          />
          <span className="psht-slider-val">{alpha.toFixed(3)}</span>
        </label>
      </div>

      <div className="psht-panel">
        <svg viewBox={`0 0 ${W} ${H}`} className="psht-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="psht-curve-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="psht-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* rejection-region backdrop bands */}
          {twoTailed ? (
            <>
              <rect x={PAD_L} y={PAD_T} width={Math.max(0, critLeftX - PAD_L)} height={PLOT_H} className="psht-rejband" />
              <rect x={critRightX} y={PAD_T} width={Math.max(0, PAD_L + PLOT_W - critRightX)} height={PLOT_H} className="psht-rejband" />
            </>
          ) : (
            <rect x={critRightX} y={PAD_T} width={Math.max(0, PAD_L + PLOT_W - critRightX)} height={PLOT_H} className="psht-rejband" />
          )}

          {/* axis */}
          <line x1={PAD_L} y1={BASE_Y} x2={PAD_L + PLOT_W} y2={BASE_Y} className="psht-axis" />
          {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
            <g key={t}>
              <line x1={xToPx(t)} y1={BASE_Y} x2={xToPx(t)} y2={BASE_Y + 5} className="psht-tick" />
              <text x={xToPx(t)} y={BASE_Y + 18} className="psht-ticklabel" textAnchor="middle">{t}</text>
            </g>
          ))}

          {/* p-value shaded tails */}
          {tails.map((pts, i) => (
            <polygon key={i} points={pts} className={`psht-tail${reject ? ' psht-tail-rej' : ''}`} />
          ))}

          {/* null curve */}
          <polyline points={CURVE_PTS} className="psht-curve-glow" filter="url(#psht-glow)" />
          <polyline points={CURVE_PTS} className="psht-curve" />

          {/* critical-value lines */}
          <line x1={critRightX} y1={PAD_T} x2={critRightX} y2={BASE_Y} className="psht-critline" />
          <text x={critRightX} y={PAD_T - 6} className="psht-critlabel" textAnchor="middle">z* = {fmt(zStar)}</text>
          {twoTailed && (
            <>
              <line x1={critLeftX} y1={PAD_T} x2={critLeftX} y2={BASE_Y} className="psht-critline" />
              <text x={critLeftX} y={PAD_T - 6} className="psht-critlabel" textAnchor="middle">-z*</text>
            </>
          )}

          {/* observed-statistic marker */}
          <line x1={obsX} y1={obsTopY} x2={obsX} y2={BASE_Y} className="psht-obsline" />
          <circle cx={obsX} cy={obsTopY} r={5} className="psht-obsdot" />
          <text x={obsX} y={obsTopY - 9} className="psht-obslabel" textAnchor="middle">obs z</text>
        </svg>
      </div>

      <div className="psht-stats">
        <div className="psht-statcard">
          <span className="psht-stat-label">observed statistic</span>
          <span className="psht-stat-val" dangerouslySetInnerHTML={{ __html: km(`z = ${fmt(obs)}`) }} />
          <span className="psht-stat-sub">{twoTailed ? 'two-tailed' : 'one-tailed (upper)'}</span>
        </div>
        <div className="psht-statcard psht-accent">
          <span className="psht-stat-label">p-value</span>
          <span className="psht-stat-val" dangerouslySetInnerHTML={{ __html: km(`p = ${fmt(pValue, 4)}`) }} />
          <span className="psht-stat-sub">shaded tail area</span>
        </div>
        <div className="psht-statcard psht-violet">
          <span className="psht-stat-label">critical value</span>
          <span className="psht-stat-val" dangerouslySetInnerHTML={{ __html: km(`z^* = ${fmt(zStar)}`) }} />
          <span className="psht-stat-sub" dangerouslySetInnerHTML={{ __html: km(`\\alpha = ${alpha.toFixed(3)}`) }} />
        </div>
        <div className={`psht-statcard psht-verdict ${reject ? 'psht-rejecting' : 'psht-keeping'}`}>
          <span className="psht-stat-label">verdict</span>
          <span className="psht-stat-val" dangerouslySetInnerHTML={{ __html: km(reject ? '\\text{Reject } H_0' : '\\text{Fail to reject } H_0') }} />
          <span className="psht-stat-sub">{reject ? 'p < alpha' : 'p ≥ alpha'}</span>
        </div>
      </div>

      <div className="psht-trace">
        <span className="psht-trace-label"><Sigma size={12} /> reading</span>
        <span className="psht-trace-body">
          {reject
            ? `The observed z = ${fmt(obs)} lands past the critical value z* = ${fmt(zStar)}, so the ${twoTailed ? 'combined tail' : 'upper tail'} area p = ${fmt(pValue, 4)} is below alpha = ${alpha.toFixed(3)}. Under H0 a result this extreme would be rare, so we reject H0.`
            : `The observed z = ${fmt(obs)} stays inside the keep region (|z| < z* = ${fmt(zStar)}), so p = ${fmt(pValue, 4)} exceeds alpha = ${alpha.toFixed(3)}. The data are unsurprising under H0, so we fail to reject it — not the same as proving H0 true.`}
        </span>
      </div>
    </div>
  );
}
