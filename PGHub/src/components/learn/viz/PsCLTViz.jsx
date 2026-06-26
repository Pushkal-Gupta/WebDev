import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Bell, RotateCcw, Shuffle, Sigma } from 'lucide-react';
import './PsCLTViz.css';

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

// Each source maps a uniform u in [0,1) to a draw, plus its theoretical mean/std
// and a [lo,hi] support window used to frame the source-shape panel.
const SOURCES = {
  bimodal: {
    label: 'Bimodal (two peaks)',
    lo: 0,
    hi: 1,
    mu: 0.5,
    sigma: Math.sqrt(0.0225 + 0.16),
    draw: (rng) => {
      const u = rng();
      const peak = u < 0.5 ? 0.2 : 0.8;
      // narrow spread around each peak via a triangular bump from two more draws
      const w = (rng() + rng()) / 2 - 0.5;
      return Math.min(0.999, Math.max(0, peak + w * 0.3));
    },
  },
  exponential: {
    label: 'Exponential-ish (skewed)',
    lo: 0,
    hi: 1,
    mu: 0.25,
    sigma: 0.25,
    draw: (rng) => {
      // inverse-transform exponential, rate=4, clipped/scaled into [0,1)
      const u = rng();
      const x = -Math.log(1 - u) / 4;
      return Math.min(0.999, x);
    },
  },
  uniform: {
    label: 'Uniform',
    lo: 0,
    hi: 1,
    mu: 0.5,
    sigma: Math.sqrt(1 / 12),
    draw: (rng) => rng(),
  },
  dice: {
    label: 'Dice (discrete)',
    lo: 0,
    hi: 1,
    mu: 0.5,
    sigma: Math.sqrt(35 / 12) / 6,
    draw: (rng) => (Math.floor(rng() * 6) + 0.5) / 6,
  },
};

const SOURCE_ORDER = ['bimodal', 'exponential', 'uniform', 'dice'];
const DEFAULTS = { source: 'bimodal', n: 5, m: 1200, seed: 1 };
const M_STEPS = [50, 200, 500, 1000, 1500, 2000, 2500, 3000];

// Empirical histogram of the source itself (large fixed sample, deterministic).
function sourceProfile(src, seed) {
  const BINS = 32;
  const SAMPLES = 4000;
  const counts = new Array(BINS).fill(0);
  const rng = mulberry32(seed ^ 0x9e3779b9);
  for (let i = 0; i < SAMPLES; i++) {
    const v = src.draw(rng);
    let b = Math.floor(((v - src.lo) / (src.hi - src.lo)) * BINS);
    if (b < 0) b = 0;
    if (b >= BINS) b = BINS - 1;
    counts[b]++;
  }
  const max = Math.max(...counts, 1);
  return { counts, max, bins: BINS };
}

// m sample-means, each the average of n draws from the source.
function buildMeans(src, n, m, seed) {
  const rng = mulberry32(seed);
  const means = new Array(m);
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < m; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += src.draw(rng);
    const mean = s / n;
    means[i] = mean;
    sum += mean;
    sumSq += mean * mean;
  }
  const obsMean = sum / m;
  const obsVar = Math.max(0, sumSq / m - obsMean * obsMean);
  const obsStd = Math.sqrt(obsVar);

  const BINS = 36;
  const counts = new Array(BINS).fill(0);
  for (let i = 0; i < m; i++) {
    let b = Math.floor(((means[i] - src.lo) / (src.hi - src.lo)) * BINS);
    if (b < 0) b = 0;
    if (b >= BINS) b = BINS - 1;
    counts[b]++;
  }
  const max = Math.max(...counts, 1);
  return { counts, max, bins: BINS, obsMean, obsStd };
}

export default function PsCLTViz() {
  const [source, setSource] = useState(DEFAULTS.source);
  const [n, setN] = useState(DEFAULTS.n);
  const [mIdx, setMIdx] = useState(3);
  const [seed, setSeed] = useState(DEFAULTS.seed);

  const m = M_STEPS[mIdx];
  const src = SOURCES[source];

  const profile = useMemo(() => sourceProfile(src, seed), [src, seed]);
  const dist = useMemo(() => buildMeans(src, n, m, seed), [src, n, m, seed]);

  const mu = src.mu;
  const sigma = src.sigma;
  const se = sigma / Math.sqrt(n);
  const ci = 1.96 * se;

  const reset = () => {
    setSource(DEFAULTS.source);
    setN(DEFAULTS.n);
    setMIdx(3);
    setSeed(DEFAULTS.seed);
  };
  const reshuffle = () => setSeed((s) => (s * 1664525 + 1013904223) % 2147483647 || 1);

  const fmt = (x) => (Math.abs(x) < 1e-9 ? '0' : x.toFixed(3));

  // ---- source panel geometry ----
  const SW = 360;
  const SH = 180;
  const sPad = 22;
  const sPlotW = SW - sPad * 2;
  const sPlotH = SH - sPad * 2;
  const sBarW = sPlotW / profile.bins;

  // ---- sampling panel geometry ----
  const DW = 360;
  const DH = 230;
  const dPad = 26;
  const dPlotW = DW - dPad * 2;
  const dPlotH = DH - dPad * 2;
  const dBarW = dPlotW / dist.bins;

  // Theoretical normal curve over the sampling-mean panel, scaled to the histogram.
  const curve = useMemo(() => {
    const pts = [];
    const steps = 120;
    const peakDensity = 1 / (se * Math.sqrt(2 * Math.PI));
    // fraction of samples expected in one bin at the mode (density * binwidth)
    const binWidth = (src.hi - src.lo) / dist.bins;
    const peakFrac = peakDensity * binWidth;
    const peakFraction = Math.min(0.999, peakFrac);
    const peakCount = peakFraction * m;
    const scale = dist.max / Math.max(peakCount, dist.max, 1);
    for (let i = 0; i <= steps; i++) {
      const x = src.lo + (i / steps) * (src.hi - src.lo);
      const z = (x - mu) / se;
      const density = Math.exp(-0.5 * z * z) / (se * Math.sqrt(2 * Math.PI));
      const frac = density * binWidth;
      const countLike = frac * m * scale;
      const h = Math.min(dPlotH, (countLike / dist.max) * dPlotH);
      const px = dPad + ((x - src.lo) / (src.hi - src.lo)) * dPlotW;
      const py = dPad + dPlotH - h;
      pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
    }
    return pts.join(' ');
  }, [se, mu, src.lo, src.hi, dist.bins, dist.max, m, dPlotW, dPlotH]);

  const muX = dPad + ((mu - src.lo) / (src.hi - src.lo)) * dPlotW;
  const ciLoX = dPad + ((mu - ci - src.lo) / (src.hi - src.lo)) * dPlotW;
  const ciHiX = dPad + ((mu + ci - src.lo) / (src.hi - src.lo)) * dPlotW;

  return (
    <div className="pscl">
      <div className="pscl-head">
        <div className="pscl-head-icon"><Bell size={18} /></div>
        <div className="pscl-head-text">
          <h3 className="pscl-title">Central Limit Theorem: the mean goes bell-shaped</h3>
          <p className="pscl-sub">
            The source on top is deliberately not normal. Yet the histogram of{' '}
            <span dangerouslySetInnerHTML={{ __html: km('m') }} /> sample means below tightens onto the
            theoretical curve <span dangerouslySetInnerHTML={{ __html: km('\\mathcal{N}(\\mu,\\ \\sigma/\\sqrt{n})') }} /> as{' '}
            <span dangerouslySetInnerHTML={{ __html: km('n') }} /> grows.
          </p>
        </div>
        <div className="pscl-head-btns">
          <button type="button" className="pscl-btn" onClick={reshuffle}><Shuffle size={14} /> Reshuffle</button>
          <button type="button" className="pscl-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>

      <div className="pscl-chips">
        {SOURCE_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`pscl-chip${source === key ? ' pscl-chip-on' : ''}`}
            onClick={() => setSource(key)}
          >
            {SOURCES[key].label}
          </button>
        ))}
      </div>

      <div className="pscl-controls">
        <label className="pscl-slider">
          <span className="pscl-slider-key">sample size <span dangerouslySetInnerHTML={{ __html: km('n') }} /></span>
          <input type="range" min="1" max="50" step="1" value={n} onChange={(e) => setN(parseInt(e.target.value, 10))} />
          <span className="pscl-slider-val">{n}</span>
        </label>
        <label className="pscl-slider">
          <span className="pscl-slider-key">num samples <span dangerouslySetInnerHTML={{ __html: km('m') }} /></span>
          <input type="range" min="0" max={M_STEPS.length - 1} step="1" value={mIdx} onChange={(e) => setMIdx(parseInt(e.target.value, 10))} />
          <span className="pscl-slider-val">{m}</span>
        </label>
      </div>

      <div className="pscl-panels">
        <div className="pscl-panel">
          <div className="pscl-panel-label">source distribution &mdash; not bell-shaped</div>
          <svg viewBox={`0 0 ${SW} ${SH}`} className="pscl-svg" preserveAspectRatio="xMidYMid meet">
            <line x1={sPad} y1={sPad + sPlotH} x2={sPad + sPlotW} y2={sPad + sPlotH} className="pscl-axis" />
            {profile.counts.map((c, i) => {
              const h = (c / profile.max) * sPlotH;
              return (
                <rect
                  key={i}
                  x={sPad + i * sBarW + 0.6}
                  y={sPad + sPlotH - h}
                  width={Math.max(0.5, sBarW - 1.2)}
                  height={h}
                  className="pscl-srcbar"
                />
              );
            })}
          </svg>
        </div>

        <div className="pscl-panel">
          <div className="pscl-panel-label">sampling distribution of the mean</div>
          <svg viewBox={`0 0 ${DW} ${DH}`} className="pscl-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="pscl-curve-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--hue-violet)" />
              </linearGradient>
              <filter id="pscl-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <line x1={dPad} y1={dPad + dPlotH} x2={dPad + dPlotW} y2={dPad + dPlotH} className="pscl-axis" />

            <rect
              x={Math.max(dPad, ciLoX)}
              y={dPad}
              width={Math.max(0, Math.min(dPad + dPlotW, ciHiX) - Math.max(dPad, ciLoX))}
              height={dPlotH}
              className="pscl-ciband"
            />

            {dist.counts.map((c, i) => {
              const h = (c / dist.max) * dPlotH;
              return (
                <rect
                  key={i}
                  x={dPad + i * dBarW + 0.5}
                  y={dPad + dPlotH - h}
                  width={Math.max(0.5, dBarW - 1)}
                  height={h}
                  className="pscl-meanbar"
                />
              );
            })}

            <polyline points={curve} className="pscl-curve-glow" filter="url(#pscl-glow)" />
            <polyline points={curve} className="pscl-curve" />

            <line x1={muX} y1={dPad} x2={muX} y2={dPad + dPlotH} className="pscl-muline" />
          </svg>
        </div>
      </div>

      <div className="pscl-stats">
        <div className="pscl-statcard">
          <span className="pscl-stat-label">population</span>
          <span className="pscl-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\mu = ${fmt(mu)}`) }} />
          <span className="pscl-stat-sub" dangerouslySetInnerHTML={{ __html: km(`\\sigma = ${fmt(sigma)}`) }} />
        </div>
        <div className="pscl-statcard pscl-accent">
          <span className="pscl-stat-label">standard error</span>
          <span className="pscl-stat-val" dangerouslySetInnerHTML={{ __html: km('\\sigma_{\\bar{x}} = \\dfrac{\\sigma}{\\sqrt{n}}') }} />
          <span className="pscl-stat-sub" dangerouslySetInnerHTML={{ __html: km(`= ${fmt(se)}`) }} />
        </div>
        <div className="pscl-statcard pscl-violet">
          <span className="pscl-stat-label">observed means</span>
          <span className="pscl-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\bar{x} = ${fmt(dist.obsMean)}`) }} />
          <span className="pscl-stat-sub" dangerouslySetInnerHTML={{ __html: km(`s = ${fmt(dist.obsStd)}`) }} />
        </div>
        <div className="pscl-statcard">
          <span className="pscl-stat-label">95% CI half-width</span>
          <span className="pscl-stat-val" dangerouslySetInnerHTML={{ __html: km('1.96\\,\\sigma_{\\bar{x}}') }} />
          <span className="pscl-stat-sub" dangerouslySetInnerHTML={{ __html: km(`= \\pm${fmt(ci)}`) }} />
        </div>
      </div>

      <div className="pscl-trace">
        <span className="pscl-trace-label"><Sigma size={12} /> reading</span>
        <span className="pscl-trace-body">
          {n === 1
            ? `At n = 1 the mean is just a single draw, so the bottom histogram still looks like the ${src.label.toLowerCase()} source above — no smoothing yet.`
            : `Each of the ${m} bars below is the average of ${n} draws from the ${src.label.toLowerCase()} source. Averaging cancels the source's quirks: the spread shrinks toward the standard error ${fmt(se)} and the shape bends toward the bell curve. Push n higher and the histogram hugs the glowing Normal(${fmt(mu)}, ${fmt(se)}) tighter — that convergence is the Central Limit Theorem, independent of how lumpy the source is.`}
        </span>
      </div>
    </div>
  );
}
