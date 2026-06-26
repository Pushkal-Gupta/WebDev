import React, { useMemo, useState, useCallback } from 'react';
import katex from 'katex';
import { BarChart3, RotateCcw, Sigma, BookOpen } from 'lucide-react';
import './PsDistributionsViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const DISTS = ['bernoulli', 'binomial', 'normal', 'poisson'];

const LABELS = {
  bernoulli: 'Bernoulli',
  binomial: 'Binomial',
  normal: 'Normal',
  poisson: 'Poisson',
};

const DEFAULTS = {
  bernoulli: { p: 0.5 },
  binomial: { n: 12, p: 0.5 },
  normal: { mu: 0, sigma: 1 },
  poisson: { lambda: 4 },
};

const NARRATION = {
  bernoulli: 'Bernoulli is the single yes/no trial — one coin flip, one click-or-not. It outputs 1 with probability p and 0 otherwise, the atom every other discrete distribution is built from.',
  binomial: 'Binomial counts successes in n independent yes/no trials, each succeeding with probability p — heads in n flips, conversions in n visitors. Its peak sits near np.',
  normal: 'Normal arises whenever many small independent effects add up: measurement noise, heights, averages of large samples. The central limit theorem makes it the default bell curve of aggregation.',
  poisson: 'Poisson counts rare events over a fixed interval when they occur independently at a steady average rate lambda — calls per minute, typos per page, arrivals per hour.',
};

// log-gamma (Lanczos) for numerically-safe factorials / binomial coefficients.
const LG_C = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7,
];
function logGamma(z) {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  let x = 0.99999999999980993;
  const zz = z - 1;
  for (let i = 0; i < LG_C.length; i++) {
    x += LG_C[i] / (zz + i + 1);
  }
  const t = zz + LG_C.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

function logFactorial(k) {
  return logGamma(k + 1);
}

function binomialPmf(n, k, p) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  const logCoef = logFactorial(n) - logFactorial(k) - logFactorial(n - k);
  const logP = logCoef + k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logP);
}

function poissonPmf(lambda, k) {
  if (k < 0) return 0;
  const logP = k * Math.log(lambda) - lambda - logFactorial(k);
  return Math.exp(logP);
}

function normalPdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

const HUE = {
  bar0: 'var(--hue-sky)',
  bar1: 'var(--hue-violet)',
  poisson: 'var(--hue-mint)',
};

export default function PsDistributionsViz() {
  const [dist, setDist] = useState('binomial');
  const [params, setParams] = useState(DEFAULTS);

  const cur = params[dist];

  const setParam = useCallback((key) => (e) => {
    const v = parseFloat(e.target.value);
    setParams((prev) => ({ ...prev, [dist]: { ...prev[dist], [key]: v } }));
  }, [dist]);

  const reset = () => setParams((prev) => ({ ...prev, [dist]: { ...DEFAULTS[dist] } }));

  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mean / variance per distribution.
  const stats = useMemo(() => {
    switch (dist) {
      case 'bernoulli': {
        const { p } = cur;
        return { mean: p, variance: p * (1 - p) };
      }
      case 'binomial': {
        const { n, p } = cur;
        return { mean: n * p, variance: n * p * (1 - p) };
      }
      case 'normal': {
        const { mu, sigma } = cur;
        return { mean: mu, variance: sigma * sigma };
      }
      case 'poisson':
      default: {
        const { lambda } = cur;
        return { mean: lambda, variance: lambda };
      }
    }
  }, [dist, cur]);

  const std = Math.sqrt(stats.variance);

  const W = 760;
  const H = 380;
  const padL = 44;
  const padR = 22;
  const padT = 22;
  const padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Build the discrete (PMF) data: array of {k, prob}.
  const discrete = useMemo(() => {
    if (dist === 'bernoulli') {
      const { p } = cur;
      return [{ k: 0, prob: 1 - p }, { k: 1, prob: p }];
    }
    if (dist === 'binomial') {
      const { n, p } = cur;
      const out = [];
      for (let k = 0; k <= n; k++) out.push({ k, prob: binomialPmf(n, k, p) });
      return out;
    }
    if (dist === 'poisson') {
      const { lambda } = cur;
      const kMax = Math.max(20, Math.ceil(lambda + 4 * Math.sqrt(lambda)));
      const out = [];
      for (let k = 0; k <= kMax; k++) out.push({ k, prob: poissonPmf(lambda, k) });
      return out;
    }
    return null;
  }, [dist, cur]);

  // Continuous (PDF) sample points for the Normal.
  const continuous = useMemo(() => {
    if (dist !== 'normal') return null;
    const { mu, sigma } = cur;
    const xLo = mu - 4 * sigma;
    const xHi = mu + 4 * sigma;
    const N = 160;
    const pts = [];
    let peak = 0;
    for (let i = 0; i <= N; i++) {
      const x = xLo + (i / N) * (xHi - xLo);
      const y = normalPdf(x, mu, sigma);
      if (y > peak) peak = y;
      pts.push({ x, y });
    }
    return { pts, xLo, xHi, peak };
  }, [dist, cur]);

  const fmt = (n) => {
    if (Math.abs(n) < 1e-9) return '0';
    if (Math.abs(n) >= 100) return n.toFixed(0);
    return n.toFixed(3).replace(/\.?0+$/, '');
  };

  // Active formula.
  const formula = useMemo(() => {
    switch (dist) {
      case 'bernoulli':
        return 'P(X=x) = p^x (1-p)^{1-x},\\quad x \\in \\{0,1\\}';
      case 'binomial':
        return 'P(X=k) = \\binom{n}{k}\\, p^{k} (1-p)^{\\,n-k}';
      case 'normal':
        return 'f(x) = \\dfrac{1}{\\sigma\\sqrt{2\\pi}}\\, e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}';
      case 'poisson':
      default:
        return 'P(X=k) = \\dfrac{\\lambda^{k} e^{-\\lambda}}{k!}';
    }
  }, [dist]);

  // ---- Render geometry for the discrete chart ----
  const discreteChart = useMemo(() => {
    if (!discrete) return null;
    const maxP = Math.max(...discrete.map((d) => d.prob), 1e-9);
    const count = discrete.length;
    const slot = plotW / count;
    const barW = Math.min(slot * 0.72, 40);
    const kToX = (k) => padL + (k + 0.5) * slot;
    const pToY = (p) => padT + plotH * (1 - p / maxP);
    return { maxP, count, slot, barW, kToX, pToY };
  }, [discrete, plotW, plotH, padL, padT]);

  const meanX = useMemo(() => {
    if (dist === 'normal') {
      if (!continuous) return null;
      const { xLo, xHi } = continuous;
      return padL + ((stats.mean - xLo) / (xHi - xLo)) * plotW;
    }
    if (!discreteChart) return null;
    return discreteChart.kToX(stats.mean);
  }, [dist, continuous, discreteChart, stats.mean, padL, plotW]);

  const sdBand = useMemo(() => {
    if (dist === 'normal') {
      if (!continuous) return null;
      const { xLo, xHi } = continuous;
      const toX = (v) => padL + ((v - xLo) / (xHi - xLo)) * plotW;
      return { x1: toX(stats.mean - std), x2: toX(stats.mean + std) };
    }
    if (!discreteChart) return null;
    return { x1: discreteChart.kToX(stats.mean - std), x2: discreteChart.kToX(stats.mean + std) };
  }, [dist, continuous, discreteChart, stats.mean, std, padL, plotW]);

  // Normal path strings.
  const normalPaths = useMemo(() => {
    if (dist !== 'normal' || !continuous) return null;
    const { pts, xLo, xHi, peak } = continuous;
    const toX = (x) => padL + ((x - xLo) / (xHi - xLo)) * plotW;
    const toY = (y) => padT + plotH * (1 - y / (peak * 1.08));
    const line = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${toX(pt.x).toFixed(2)},${toY(pt.y).toFixed(2)}`).join(' ');
    const baseY = (padT + plotH).toFixed(2);
    const area = `${line} L${toX(xHi).toFixed(2)},${baseY} L${toX(xLo).toFixed(2)},${baseY} Z`;
    return { line, area };
  }, [dist, continuous, padL, padT, plotW, plotH]);

  // X-axis tick labels for the discrete chart (avoid crowding).
  const discreteTicks = useMemo(() => {
    if (!discrete || !discreteChart) return [];
    const n = discrete.length;
    const step = n <= 16 ? 1 : Math.ceil(n / 16);
    return discrete.filter((_, i) => i % step === 0);
  }, [discrete, discreteChart]);

  const baseY = padT + plotH;

  return (
    <div className="psd">
      <div className="psd-head">
        <div className="psd-head-icon"><BarChart3 size={18} /></div>
        <div className="psd-head-text">
          <h3 className="psd-title">Distribution gallery: shape, center, spread</h3>
          <p className="psd-sub">
            Pick a distribution and drag its parameters. The dashed line marks the mean{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\mu') }} />; the shaded band spans{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\mu \\pm \\sigma') }} />.
          </p>
        </div>
        <button type="button" className="psd-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="psd-chips">
        {DISTS.map((d) => (
          <button
            key={d}
            type="button"
            className={d === dist ? 'psd-chip psd-chip-on' : 'psd-chip'}
            onClick={() => setDist(d)}
          >
            {LABELS[d]}
          </button>
        ))}
      </div>

      <div className="psd-formula" dangerouslySetInnerHTML={{ __html: km(formula, true) }} />

      <div className="psd-controls">
        {dist === 'bernoulli' && (
          <label className="psd-slider">
            <span className="psd-slider-key" dangerouslySetInnerHTML={{ __html: km('p') }} />
            <input type="range" min="0" max="1" step="0.01" value={cur.p} onChange={setParam('p')} />
            <span className="psd-slider-val">{cur.p.toFixed(2)}</span>
          </label>
        )}
        {dist === 'binomial' && (
          <>
            <label className="psd-slider">
              <span className="psd-slider-key" dangerouslySetInnerHTML={{ __html: km('n') }} />
              <input type="range" min="1" max="30" step="1" value={cur.n} onChange={setParam('n')} />
              <span className="psd-slider-val">{cur.n}</span>
            </label>
            <label className="psd-slider">
              <span className="psd-slider-key" dangerouslySetInnerHTML={{ __html: km('p') }} />
              <input type="range" min="0" max="1" step="0.01" value={cur.p} onChange={setParam('p')} />
              <span className="psd-slider-val">{cur.p.toFixed(2)}</span>
            </label>
          </>
        )}
        {dist === 'normal' && (
          <>
            <label className="psd-slider">
              <span className="psd-slider-key" dangerouslySetInnerHTML={{ __html: km('\\mu') }} />
              <input type="range" min="-5" max="5" step="0.1" value={cur.mu} onChange={setParam('mu')} />
              <span className="psd-slider-val">{cur.mu.toFixed(1)}</span>
            </label>
            <label className="psd-slider">
              <span className="psd-slider-key" dangerouslySetInnerHTML={{ __html: km('\\sigma') }} />
              <input type="range" min="0.3" max="4" step="0.1" value={cur.sigma} onChange={setParam('sigma')} />
              <span className="psd-slider-val">{cur.sigma.toFixed(1)}</span>
            </label>
          </>
        )}
        {dist === 'poisson' && (
          <label className="psd-slider">
            <span className="psd-slider-key" dangerouslySetInnerHTML={{ __html: km('\\lambda') }} />
            <input type="range" min="0.5" max="15" step="0.1" value={cur.lambda} onChange={setParam('lambda')} />
            <span className="psd-slider-val">{cur.lambda.toFixed(1)}</span>
          </label>
        )}
      </div>

      <div className="psd-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="psd-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="psd-normal-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-sky)" />
              <stop offset="50%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--hue-pink)" />
            </linearGradient>
            <linearGradient id="psd-normal-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-violet)" stopOpacity="0.42" />
              <stop offset="100%" stopColor="var(--hue-violet)" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="psd-bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--hue-sky)" />
            </linearGradient>
            <filter id="psd-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>

          {/* baseline + y label */}
          <line x1={padL} y1={baseY} x2={W - padR} y2={baseY} className="psd-axis" />
          <line x1={padL} y1={padT} x2={padL} y2={baseY} className="psd-axis" />

          {/* mu +/- sigma band */}
          {sdBand && (
            <rect
              x={Math.max(padL, Math.min(sdBand.x1, sdBand.x2))}
              y={padT}
              width={Math.min(Math.abs(sdBand.x2 - sdBand.x1), plotW)}
              height={plotH}
              className="psd-sdband"
            />
          )}

          {/* discrete bars */}
          {discrete && discreteChart && discrete.map((d) => {
            const x = discreteChart.kToX(d.k) - discreteChart.barW / 2;
            const y = discreteChart.pToY(d.prob);
            const h = baseY - y;
            const isBern = dist === 'bernoulli';
            const fill = isBern
              ? (d.k === 0 ? HUE.bar0 : HUE.bar1)
              : (dist === 'poisson' ? HUE.poisson : 'url(#psd-bar-grad)');
            return (
              <g key={d.k}>
                <rect
                  x={x}
                  y={y}
                  width={discreteChart.barW}
                  height={Math.max(0, h)}
                  rx="2"
                  fill={fill}
                  className={reduced ? 'psd-bar' : 'psd-bar psd-bar-anim'}
                />
              </g>
            );
          })}

          {/* normal glow + area + stroke */}
          {normalPaths && (
            <>
              <path d={normalPaths.area} fill="url(#psd-normal-fill)" className="psd-area" />
              <path d={normalPaths.line} className="psd-curve-glow" filter="url(#psd-glow)" />
              <path d={normalPaths.line} className="psd-curve" />
            </>
          )}

          {/* mean marker */}
          {meanX != null && meanX >= padL && meanX <= W - padR && (
            <>
              <line x1={meanX} y1={padT} x2={meanX} y2={baseY} className="psd-mean" />
              <text x={meanX} y={padT - 6} className="psd-mean-label" textAnchor="middle">μ</text>
            </>
          )}

          {/* discrete x ticks */}
          {discrete && discreteChart && discreteTicks.map((d) => (
            <text key={`t${d.k}`} x={discreteChart.kToX(d.k)} y={baseY + 16} className="psd-tick" textAnchor="middle">
              {d.k}
            </text>
          ))}

          {/* normal x ticks at mu-2s .. mu+2s */}
          {dist === 'normal' && continuous && [-2, -1, 0, 1, 2].map((m) => {
            const v = stats.mean + m * std;
            const { xLo, xHi } = continuous;
            const tx = padL + ((v - xLo) / (xHi - xLo)) * plotW;
            return (
              <text key={`nt${m}`} x={tx} y={baseY + 16} className="psd-tick" textAnchor="middle">
                {fmt(v)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="psd-stats">
        <div className="psd-statcard psd-accent">
          <span className="psd-stat-label">mean</span>
          <span className="psd-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\mathbb{E}[X] = ${fmt(stats.mean)}`) }} />
        </div>
        <div className="psd-statcard psd-violet">
          <span className="psd-stat-label">variance</span>
          <span className="psd-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\mathrm{Var}(X) = ${fmt(stats.variance)}`) }} />
        </div>
        <div className="psd-statcard psd-pink">
          <span className="psd-stat-label">std dev</span>
          <span className="psd-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\sigma = ${fmt(std)}`) }} />
        </div>
      </div>

      <div className="psd-trace">
        <span className="psd-trace-label"><BookOpen size={12} /> when it arises</span>
        <span className="psd-trace-body"><Sigma size={13} className="psd-trace-sigma" /> {NARRATION[dist]}</span>
      </div>
    </div>
  );
}
