import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { Target, RotateCcw, Play, Pause, Sigma } from 'lucide-react';
import './PsMLEViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRUE_P = 0.7;
const SEED = 7;
const N_MAX = 240;
const DEFAULT_N = 40;

// One fixed deterministic stream of flips; the first n of them define the data.
const FLIPS = (() => {
  const rng = mulberry32(SEED);
  const out = new Array(N_MAX);
  for (let i = 0; i < N_MAX; i++) out[i] = rng() < TRUE_P ? 1 : 0;
  return out;
})();

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// k heads out of n from the fixed stream.
function countHeads(n) {
  let k = 0;
  for (let i = 0; i < n; i++) k += FLIPS[i];
  return k;
}

// Normalized log-likelihood curve over a p-grid, shifted so its peak sits at 0,
// then exponentiated to a 0..1 "relative likelihood" for plotting the bump.
function buildCurve(n, k, steps) {
  const grid = new Array(steps + 1);
  let bestLL = -Infinity;
  let bestP = 0.5;
  let bestIdx = 0;
  for (let i = 0; i <= steps; i++) {
    const p = (i + 0.5) / (steps + 1); // strictly inside (0,1)
    const ll = k * Math.log(p) + (n - k) * Math.log(1 - p);
    grid[i] = { p, ll };
    if (ll > bestLL) {
      bestLL = ll;
      bestP = p;
      bestIdx = i;
    }
  }
  const rel = grid.map((g) => Math.exp(g.ll - bestLL)); // 0..1, peak = 1
  return { grid, rel, bestP, bestIdx, bestLL };
}

export default function PsMLEViz() {
  const reduced = useMemo(prefersReducedMotion, []);
  const [n, setN] = useState(DEFAULT_N);
  const [playing, setPlaying] = useState(!reduced);
  // animated marker position along the p-axis (glides up to the MLE peak)
  const [markerP, setMarkerP] = useState(reduced ? null : 0.12);

  const rafRef = useRef(0);
  const markerRef = useRef(markerP);
  markerRef.current = markerP;

  const STEPS = 200;
  const k = useMemo(() => countHeads(n), [n]);
  const curve = useMemo(() => buildCurve(n, k, STEPS), [n, k]);
  const mleP = k / n; // closed form

  // Animation: the marker eases toward the peak; auto-pauses once it arrives.
  useEffect(() => {
    if (reduced) {
      setMarkerP(mleP);
      return undefined;
    }
    if (!playing) return undefined;

    const tick = () => {
      const cur = markerRef.current == null ? mleP : markerRef.current;
      const next = cur + (mleP - cur) * 0.08;
      if (Math.abs(next - mleP) < 0.0008) {
        setMarkerP(mleP);
        setPlaying(false);
        return;
      }
      setMarkerP(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, mleP, reduced]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    setN(DEFAULT_N);
    setMarkerP(reduced ? null : 0.12);
    setPlaying(!reduced);
  };

  const togglePlay = () => {
    if (playing) {
      cancelAnimationFrame(rafRef.current);
      setPlaying(false);
    } else {
      // restart the glide from a low guess so the motion is visible again
      setMarkerP(0.12);
      setPlaying(true);
    }
  };

  const fmt = (x) => (Number.isFinite(x) ? x.toFixed(3) : '—');

  // ---- plot geometry ----
  const W = 560;
  const H = 280;
  const padL = 40;
  const padR = 22;
  const padT = 22;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xOf = (p) => padL + p * plotW;
  const yOf = (rel) => padT + (1 - rel) * plotH;

  const areaPath = useMemo(() => {
    let d = `M ${xOf(curve.grid[0].p).toFixed(2)} ${(padT + plotH).toFixed(2)}`;
    for (let i = 0; i < curve.grid.length; i++) {
      d += ` L ${xOf(curve.grid[i].p).toFixed(2)} ${yOf(curve.rel[i]).toFixed(2)}`;
    }
    d += ` L ${xOf(curve.grid[curve.grid.length - 1].p).toFixed(2)} ${(padT + plotH).toFixed(2)} Z`;
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curve]);

  const linePts = useMemo(
    () =>
      curve.grid
        .map((g, i) => `${xOf(g.p).toFixed(2)},${yOf(curve.rel[i]).toFixed(2)}`)
        .join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [curve],
  );

  const peakX = xOf(curve.bestP);
  const peakY = yOf(1);
  const trueX = xOf(TRUE_P);

  // marker height = relative likelihood at the marker's p, read off the grid
  const mPos = markerP == null ? mleP : markerP;
  const mIdx = Math.min(STEPS, Math.max(0, Math.round(mPos * STEPS)));
  const mRel = curve.rel[mIdx] ?? 0;
  const markerX = xOf(mPos);
  const markerY = yOf(mRel);

  return (
    <div className="psmle">
      <div className="psmle-head">
        <div className="psmle-head-icon"><Target size={18} /></div>
        <div className="psmle-head-text">
          <h3 className="psmle-title">Maximum likelihood: climb to the peak</h3>
          <p className="psmle-sub">
            For a fixed stream of coin flips, the curve plots{' '}
            <span dangerouslySetInnerHTML={{ __html: km('L(p)=\\prod_i P(x_i\\mid p)') }} /> over every bias{' '}
            <span dangerouslySetInnerHTML={{ __html: km('p') }} />. The marker slides to the peak — the{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\hat{p}_{MLE}=k/n') }} />. Add data and the curve sharpens.
          </p>
        </div>
        <div className="psmle-head-btns">
          <button type="button" className="psmle-btn" onClick={togglePlay}>
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="psmle-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="psmle-controls">
        <label className="psmle-slider">
          <span className="psmle-slider-key">
            samples <span dangerouslySetInnerHTML={{ __html: km('n') }} />
          </span>
          <input
            type="range"
            min="2"
            max={N_MAX}
            step="1"
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
          />
          <span className="psmle-slider-val">{n}</span>
        </label>
      </div>

      <div className="psmle-panel">
        <div className="psmle-panel-label">likelihood over the coin bias p</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="psmle-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="psmle-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--hue-violet)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="psmle-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <filter id="psmle-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* axes */}
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} className="psmle-axis" />
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} className="psmle-axis" />

          {/* x ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={xOf(t)} y1={padT + plotH} x2={xOf(t)} y2={padT + plotH + 4} className="psmle-axis" />
              <text x={xOf(t)} y={padT + plotH + 16} className="psmle-tick" textAnchor="middle">
                {t.toFixed(2)}
              </text>
            </g>
          ))}

          {/* true-p reference */}
          <line x1={trueX} y1={padT} x2={trueX} y2={padT + plotH} className="psmle-trueline" />
          <text x={trueX} y={padT - 6} className="psmle-truetag" textAnchor="middle">
            p* = {TRUE_P}
          </text>

          {/* filled likelihood bump */}
          <path d={areaPath} className="psmle-area" />
          <polyline points={linePts} className="psmle-curve-glow" filter="url(#psmle-glow)" />
          <polyline points={linePts} className="psmle-curve" />

          {/* MLE peak drop-line */}
          <line x1={peakX} y1={peakY} x2={peakX} y2={padT + plotH} className="psmle-peakline" />
          <circle cx={peakX} cy={peakY} r="4.5" className="psmle-peakdot" />

          {/* gliding marker */}
          <line x1={markerX} y1={markerY} x2={markerX} y2={padT + plotH} className="psmle-markerline" />
          <circle cx={markerX} cy={markerY} r="8" className="psmle-marker-halo" />
          <circle cx={markerX} cy={markerY} r="4" className="psmle-marker" />
        </svg>
      </div>

      <div className="psmle-stats">
        <div className="psmle-statcard">
          <span className="psmle-stat-label">data</span>
          <span className="psmle-stat-val" dangerouslySetInnerHTML={{ __html: km(`k = ${k},\\ n = ${n}`) }} />
          <span className="psmle-stat-sub">heads out of flips</span>
        </div>
        <div className="psmle-statcard psmle-accent">
          <span className="psmle-stat-label">MLE (closed form)</span>
          <span className="psmle-stat-val" dangerouslySetInnerHTML={{ __html: km('\\hat{p}=\\dfrac{k}{n}') }} />
          <span className="psmle-stat-sub" dangerouslySetInnerHTML={{ __html: km(`= ${fmt(mleP)}`) }} />
        </div>
        <div className="psmle-statcard psmle-violet">
          <span className="psmle-stat-label">marker position</span>
          <span className="psmle-stat-val" dangerouslySetInnerHTML={{ __html: km(`p = ${fmt(mPos)}`) }} />
          <span className="psmle-stat-sub" dangerouslySetInnerHTML={{ __html: km(`L/L_{max} = ${fmt(mRel)}`) }} />
        </div>
        <div className="psmle-statcard">
          <span className="psmle-stat-label">peak log-lik.</span>
          <span className="psmle-stat-val" dangerouslySetInnerHTML={{ __html: km('\\ell(\\hat{p})') }} />
          <span className="psmle-stat-sub" dangerouslySetInnerHTML={{ __html: km(`= ${fmt(curve.bestLL)}`) }} />
        </div>
      </div>

      <div className="psmle-trace">
        <span className="psmle-trace-label"><Sigma size={12} /> reading</span>
        <span className="psmle-trace-body">
          {n < 12
            ? `With only ${n} flips the curve is broad and gentle — many biases near ${fmt(mleP)} explain the data almost as well, so the estimate is loose. Drag n up to watch the peak grow tall and narrow.`
            : `The ${n} flips gave ${k} heads, so the closed-form MLE is k/n = ${fmt(mleP)}, sitting right where the curve peaks. The taller, narrower the bump, the more the data pins the bias near the truth p* = ${TRUE_P} — more data sharpens the likelihood and concentrates the MLE on the true value.`}
        </span>
      </div>
    </div>
  );
}
